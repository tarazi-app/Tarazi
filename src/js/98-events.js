/* ---------- events ---------- */
$app.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]');if(!b||!$app.contains(b))return;
  if(b.tagName==='A')e.preventDefault();
  handle(b.dataset.act,b);
});
$app.addEventListener('input',e=>{
  const t=e.target;if(!t.dataset)return;
  if(t.dataset.time!=null)t.value=fmtTimeLive(t.value);
  if(t.dataset.draft!=null)S.drafts[t.dataset.draft]=t.value;
  if(t.id==='backup-file'){onBackupFile(t);return;}
  if(t.id==='w-gross')updatePreview();
  if(t.dataset.gfilter!=null){S.gfilter=t.value;render();}
  if(t.dataset.search!=null){S.search=t.value;render();}
  if(t.dataset.csearch!=null){S.carQuery=t.value;render();}
  if(t.dataset.ent){if(t.dataset.ent==='kind'){S.entKind=t.value==='route'?'route':'driver';S.entName='';}else S.entName=t.value;render();}
  if(t.dataset.stat){if(t.dataset.stat==='from')S.sFrom=t.value;else S.sTo=t.value;render();}
});
$app.addEventListener('keydown',e=>{
  const t=e.target;if(e.key!=='Enter'||!t.dataset||!t.dataset.enter)return;
  e.preventDefault();handle(t.dataset.enter,t);
});
$modal.addEventListener('click',e=>{
  const ab=e.target.closest('[data-addnew]');
  if(ab){showNewInput(ab.dataset.addnew);return;}
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act;
  if(a==='modal-close')closeModal();
  else if(a==='export-go')runExport(b.dataset.fmt);
  else if(a==='web-save'){const fn=S.modal&&S.modal.webSave;if(fn)fn();}
  else if(a==='modal-delete'){const fn=S.modal&&S.modal.onDelete;closeModal();if(fn)fn();}
  else if(a==='modal-confirm'){const fn=S.modal&&S.modal.onConfirm;closeModal();if(fn)fn();}
  else if(a==='copy-text'){
    const ta=document.getElementById('dlg-area');if(!ta)return;
    const done=()=>toast(tx("Скопировано"));
    const sel=()=>{ta.focus();ta.select();try{document.execCommand('copy')?done():toast(tx("Выделите текст и скопируйте вручную"),'err');}catch(_){toast(tx("Выделите текст и скопируйте вручную"),'err');}};
    try{navigator.clipboard.writeText(ta.value).then(done,sel);}catch(_){sel();}
  }
});
$modal.addEventListener('change',e=>{
  const t=e.target;
  if(t.matches&&t.matches('select[data-pick]')){
    const ni=document.getElementById('f-'+t.name+'__new');if(!ni)return;
    const isNew=t.value==='__new__';ni.hidden=!isNew;if(isNew)ni.focus();
    if(t.name==='plate'&&S.modal&&S.modal.autofill&&t.value&&!isNew){
      const car=lastCarFor(t.value);if(car&&t.form)autofillCar(t.form,car);
    }
  }
});
$modal.addEventListener('submit',e=>{e.preventDefault();if(S.modal&&S.modal.submit)S.modal.submit(e.target);});
$modal.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.time!=null)t.value=fmtTimeLive(t.value);});
document.addEventListener('focusout',e=>{
  const t=e.target;if(!t||!t.dataset||t.dataset.time==null)return;
  const n=normTime(t.value);
  if(n){t.value=n;if(t.dataset.draft!=null)S.drafts[t.dataset.draft]=n;}
});
document.addEventListener('keydown',e=>{
  if(!S.modal)return;
  if(e.key==='Escape'){e.preventDefault();closeModal();return;}
  if(e.key==='Tab'){
    const f=[...$modal.querySelectorAll('input,select,textarea,button')].filter(x=>!x.disabled&&x.offsetParent!==null);
    if(!f.length)return;
    const first=f[0],last=f[f.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
});
window.addEventListener('hashchange',()=>{
  const r=parseHash();
  const flat=r.view==='home'||r.view==='glossary'||r.view==='stats';
  const same=r.view===S.view&&(flat?(r.view!=='glossary'||!r.gcat||r.gcat===S.gcat):(r.shiftId===S.shiftId&&(r.view!=='car'||r.carId===S.carId)));
  if(!same){closeModal();applyRoute(r);render();window.scrollTo(0,0);}
});

