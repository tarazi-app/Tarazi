/* ---------- storage ---------- */
function enqueue(id,job){
  pending[id]=(pending[id]||0)+1;
  queues[id]=(queues[id]||Promise.resolve()).then(job).catch(err=>{
    const denied=err&&err.code==='invalid_argument';
    toast(denied?tx("Не удалось сохранить: у вас нет прав на изменение данных."):tx("Не удалось сохранить изменения. Повторите действие."),'err');
  }).then(()=>{pending[id]--;});
}
function persist(id){
  if(S.mode==='db'){enqueue(id,async()=>{const s=S.shifts[id];if(!s)return;await S.db.doc('shifts/'+id).set(plain(s));});}
  else saveLocal();
}
function persistDelete(id){
  if(S.mode==='db'){enqueue(id,async()=>{await S.db.doc('shifts/'+id).delete();});}
  else saveLocal();
}
function persistGlossary(){
  if(S.mode==='db'){enqueue('glossary',async()=>{await S.db.doc('glossary/main').set(plain(S.glossary));});}
  else saveLocal();
}
function mutateShift(id,fn){
  const cur=S.shifts[id];if(!cur)return;
  const next=plain(cur);fn(next);
  S.shifts[id]=next;persist(id);render();
}
function onSnap(snap){
  const next={};
  snap.docs.forEach(d=>{const v=d.data();if(v&&d.id)next[d.id]=normalize(v,d.id);});
  let changed=false;
  new Set(Object.keys(next).concat(Object.keys(S.shifts))).forEach(id=>{
    if(pending[id])return;
    const a=S.shifts[id],b=next[id];
    if(!b){if(a){delete S.shifts[id];changed=true;}return;}
    if(!a||stable(a)!==stable(b)){S.shifts[id]=b;changed=true;}
  });
  if(!S.gotShifts){S.gotShifts=true;changed=true;}
  if(changed)render();
}
function onGlossSnap(snap){
  let changed=false;
  if(!pending.glossary){
    const d=snap.exists?normGloss(snap.data()):emptyGloss();
    if(stable(d)!==stable(S.glossary)){S.glossary=d;changed=true;}
  }
  if(!S.gotGloss){S.gotGloss=true;changed=true;}
  if(changed)render();
}

