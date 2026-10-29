/* ---------- start ---------- */
async function fallbackLocal(){
  S.mode='local';S.db=null;
  const r=await loadLocalAll();
  S.shifts=r.shifts;S.glossary=r.glossary;S.snaps=r.snaps;
  S.gotShifts=true;S.gotGloss=true;render();
  if(r.restoredFrom){flushLocal();toast(tx("Данные были повреждены. Восстановлена автокопия от {d}.",{d:stampOf(r.restoredFrom)}),'err');}
  else if(r.migrate)flushLocal();
}
window.__updateReady=()=>{S.updateReady=true;render();};
async function init(){
  applyTheme();
  applyRoute(parseHash());
  render();
  const c=window.claude;
  let db=null,dl=null;
  if(c&&c.use){
    const r=await Promise.all([c.use('db').catch(()=>null),c.use('downloads').catch(()=>null)]);
    db=r[0];dl=r[1];
  }
  S.downloads=dl;
  if(!db){fallbackLocal().catch(()=>{});return;}
  S.db=db;S.mode='db';
  const fail=()=>{toast(tx("Нет связи с хранилищем данных"),'err');S.gotShifts=true;S.gotGloss=true;render();};
  try{
    db.collection('shifts').onSnapshot(onSnap,fail);
    db.doc('glossary/main').onSnapshot(onGlossSnap,fail);
  }catch(e){fallbackLocal().catch(()=>{});}
}
init();
})();
