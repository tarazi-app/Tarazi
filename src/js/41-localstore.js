/* ---------- локальное хранилище: IndexedDB + автокопии ---------- */
const IDB_NAME='tarazi';
let idbP=null,saveTimer=null,saving=Promise.resolve(),lastSnapAt=0,lastStorageErr=0;
function idbOpen(){
  if(idbP)return idbP;
  idbP=new Promise((res,rej)=>{
    if(!window.indexedDB){rej(new Error('no-idb'));return;}
    let rq;try{rq=indexedDB.open(IDB_NAME,1);}catch(e){rej(e);return;}
    rq.onupgradeneeded=()=>{const db=rq.result;
      if(!db.objectStoreNames.contains('kv'))db.createObjectStore('kv');
      if(!db.objectStoreNames.contains('snaps'))db.createObjectStore('snaps',{keyPath:'t'});};
    rq.onsuccess=()=>res(rq.result);rq.onerror=()=>rej(rq.error);rq.onblocked=()=>rej(new Error('blocked'));
  });
  idbP.catch(()=>{});
  return idbP;
}
function idbTx(store,mode,fn){
  return idbOpen().then(db=>new Promise((res,rej)=>{
    const t=db.transaction(store,mode);let rq;
    try{rq=fn(t.objectStore(store));}catch(e){rej(e);return;}
    t.oncomplete=()=>res(rq&&rq.result!==undefined?rq.result:undefined);
    t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error||new Error('abort'));
  }));
}
const idbGet=k=>idbTx('kv','readonly',s=>s.get(k));
const idbSet=(k,v)=>idbTx('kv','readwrite',s=>s.put(v,k));
const validData=d=>!!(d&&typeof d==='object'&&d.shifts&&typeof d.shifts==='object'&&!Array.isArray(d.shifts));
function readLegacy(){
  try{
    const raw=localStorage.getItem(KEY);if(!raw)return null;
    const sh=JSON.parse(raw);if(!sh||typeof sh!=='object')return null;
    const g=localStorage.getItem(GKEY);
    return {shifts:sh,glossary:g?JSON.parse(g):null};
  }catch(e){return null;}
}
function normData(d){
  const shifts={};Object.keys(d.shifts).forEach(id=>{const v=d.shifts[id];if(v&&typeof v==='object')shifts[id]=normalize(v,id);});
  return {shifts,glossary:normGloss(d.glossary)};
}
const stampOf=t=>{const d=new Date(t);return pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear()+' '+pad(d.getHours())+':'+pad(d.getMinutes());};
async function listSnaps(){
  try{const all=await idbTx('snaps','readonly',s=>s.getAll());return (all||[]).filter(x=>x&&x.t).sort((a,b)=>b.t-a.t);}catch(e){return [];}
}
async function refreshSnaps(){
  const all=await listSnaps();
  S.snaps=all.map(x=>({t:x.t,n:Object.keys(x.shifts||{}).length}));
  lastSnapAt=all.length?all[0].t:0;
  if(S.view==='settings')render();
}
async function snapshotNow(){
  try{
    const rec={t:Date.now(),shifts:plain(S.shifts),glossary:plain(S.glossary)};
    await idbTx('snaps','readwrite',s=>s.put(rec));
    lastSnapAt=rec.t;
    const keys=(await idbTx('snaps','readonly',s=>s.getAllKeys())||[]).sort((a,b)=>b-a);
    for(const k of keys.slice(8))await idbTx('snaps','readwrite',s=>s.delete(k));
    await refreshSnaps();
  }catch(e){}
}
async function loadLocalAll(){
  let data=null,corrupt=false,idbOk=true,restoredFrom=0;
  try{
    const d=await idbGet('data');
    if(d!==undefined){if(validData(d))data=d;else corrupt=true;}
  }catch(e){idbOk=false;}
  if(!data&&!corrupt){const lg=readLegacy();if(lg)data=lg;}          // перенос из старого хранилища
  if(!data&&idbOk){                                                   // повреждение: берём последнюю автокопию
    const snaps=await listSnaps();
    const good=snaps.find(x=>validData(x));
    if(good){data=good;restoredFrom=good.t;}
  }
  const r=data?normData(data):{shifts:{},glossary:emptyGloss()};
  r.restoredFrom=restoredFrom;r.migrate=!!data&&idbOk;
  r.snaps=(await listSnaps()).map(x=>({t:x.t,n:Object.keys(x.shifts||{}).length}));
  lastSnapAt=r.snaps.length?r.snaps[0].t:0;
  return r;
}
function storageError(){
  const now=Date.now();if(now-lastStorageErr<10000)return;lastStorageErr=now;
  toast(tx("Не удалось сохранить данные на устройстве. Возможно, память заполнена. Скачайте резервную копию."),'err');
}
function flushLocal(){
  if(saveTimer){clearTimeout(saveTimer);saveTimer=null;}
  const rec={v:2,savedAt:Date.now(),shifts:plain(S.shifts),glossary:plain(S.glossary)};
  let mirrored=true;
  try{localStorage.setItem(KEY,JSON.stringify(rec.shifts));localStorage.setItem(GKEY,JSON.stringify(rec.glossary));}catch(e){mirrored=false;}
  saving=saving.then(()=>idbSet('data',rec)).then(()=>{
    if(Date.now()-lastSnapAt>6*3600*1000&&Object.keys(rec.shifts).length)return snapshotNow();
  }).catch(()=>{if(!mirrored)storageError();});
  return saving;
}
function saveLocal(){if(saveTimer)return;saveTimer=setTimeout(flushLocal,150);}
addEventListener('pagehide',()=>{if(saveTimer)flushLocal();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&saveTimer)flushLocal();});
async function restoreSnap(t){
  let snap=null;
  try{snap=await idbTx('snaps','readonly',s=>s.get(t));}catch(e){}
  if(!snap||!validData(snap)){toast(tx("Не удалось сохранить изменения. Повторите действие."),'err');return;}
  await snapshotNow();
  const r=normData(snap);S.shifts=r.shifts;S.glossary=r.glossary;
  await flushLocal();render();toast(tx("Данные восстановлены"));
}
