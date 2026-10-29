/* ---------- резервная копия: загрузка и напоминание ---------- */
function parseBackup(text){
  let o;try{o=JSON.parse(String(text).replace(/^\uFEFF/,''));}catch(e){return null;}
  if(!o||typeof o!=='object')return null;
  const arr=Array.isArray(o)?o:(Array.isArray(o.shifts)?o.shifts:(o.shifts&&typeof o.shifts==='object'?Object.values(o.shifts):null));
  if(!arr)return null;
  const shifts=arr.filter(x=>x&&typeof x==='object'&&typeof x.date==='string').map(x=>{
    const id=String(x.id||'').toLowerCase().replace(/[^a-z0-9]/g,'')||uid('s');
    return normalize(x,id);
  });
  const glossary=normGloss(o.glossary);
  if(!shifts.length&&!CATS.some(c=>glossary[c.id].length))return null;
  return {shifts,glossary};
}
function applyBackup(b){
  if(S.mode==='local')snapshotNow();
  let n=0,g=0;
  b.shifts.forEach(sh=>{S.shifts[sh.id]=sh;persist(sh.id);n++;});
  CATS.forEach(c=>{b.glossary[c.id].forEach(x=>{if(!S.glossary[c.id].some(y=>sameName(y.name,x.name))){S.glossary[c.id].push({id:uid('g'),name:x.name});g++;}});});
  if(g)persistGlossary();
  render();toast(tx('Загружено смен: {n}',{n}));
}
async function onBackupFile(inp){
  const f=inp.files&&inp.files[0];if(!f)return;
  let text='';
  try{text=await (f.text?f.text():new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsText(f);}));}catch(e){text='';}
  inp.value='';
  const b=parseBackup(text);
  if(!b){toast(tx('Файл не похож на резервную копию Tarazi.'),'err');return;}
  openConfirm({title:tx('Загрузить резервную копию?'),confirmLabel:tx('Загрузить'),safe:true,
    text:tx('В копии смен: {n}. Смены с теми же номерами будут заменены, остальные сохранятся. Справочник дополнится.',{n:b.shifts.length}),
    onConfirm(){applyBackup(b);}});
}
function backupDue(){
  if(S.mode!=='local'||!Object.keys(S.shifts).length)return false;
  try{
    const now=Date.now(),last=+localStorage.getItem('tarazi.lastBackup')||0;
    let first=+localStorage.getItem('tarazi.firstSeen')||0;
    if(!first){first=now;localStorage.setItem('tarazi.firstSeen',String(now));}
    return now-Math.max(last,first)>7*864e5;
  }catch(e){return false;}
}
const backupButtons=()=>`<div class="row-btns" style="margin-top:12px"><button class="btn" data-act="backup">${icon('down','ic--sm')}${tx("Скачать резервную копию")}</button><button class="btn" data-act="backup-load">${icon('up','ic--sm')}${tx("Загрузить копию")}</button></div><input type="file" id="backup-file" accept=".json,application/json" hidden>`;
function lastCarFor(plate){
  const list=Object.values(S.shifts).sort(newestFirst);
  for(const sh of list){for(let i=sh.cars.length-1;i>=0;i--){if(sameName(sh.cars[i].plate,plate))return sh.cars[i];}}
  return null;
}
function prevShift(sh){
  return Object.values(S.shifts).filter(x=>x.id!==sh.id&&x.cars.length).sort((a,b)=>((b.type===sh.type)-(a.type===sh.type))||newestFirst(a,b))[0]||null;
}

