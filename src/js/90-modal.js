/* ---------- toast & modal ---------- */
let toastTimer=null;
function toast(msg,kind){
  $toast.textContent=msg;$toast.className='toast'+(kind==='err'?' is-err':'');$toast.hidden=false;
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$toast.hidden=true;},kind==='err'?5000:3000);
}
function showModal(html,st){
  st.opener=document.activeElement;S.modal=st;
  $modal.innerHTML=html;document.body.classList.add('modal-open');
  const first=$modal.querySelector(st.focus||'input:not([hidden]):not([type=hidden]):not([type=radio]),select,textarea,button');
  if(first)first.focus();
}
function closeModal(){
  const st=S.modal;S.modal=null;$modal.innerHTML='';document.body.classList.remove('modal-open');
  if(st&&st.opener&&st.opener.isConnected&&st.opener.focus)try{st.opener.focus({preventScroll:true});}catch(_){}
}
function pickHtml(f){
  const items=S.glossary[f.pick].map(x=>x.name).sort((a,b)=>a.localeCompare(b,'ru'));
  const cur=f.value||'';
  const hasCur=cur&&items.some(n=>sameName(n,cur));
  const opts=[tx("<option value=\"\">Выберите из списка…</option>")]
    .concat(items.map(n=>`<option value="${esc(n)}"${sameName(n,cur)?' selected':''}>${esc(n)}</option>`));
  if(cur&&!hasCur)opts.push(`<option value="${esc(cur)}" selected>${esc(cur)} ${tx("(нет в справочнике)")}</option>`);
  opts.push(tx("<option value=\"__new__\">+ Добавить новый…</option>"));
  return `<div class="field${f.half?' field--half':''}"><div class="field__lbl"><label for="f-${f.name}">${esc(f.label)}</label><button type="button" class="linkbtn" data-addnew="${f.name}">+ ${esc(f.addLabel||tx("Добавить"))}</button></div>
    <select class="inp" id="f-${f.name}" name="${f.name}" data-pick="${f.pick}">${opts.join('')}</select>
    <input class="inp" id="f-${f.name}__new" name="${f.name}__new" placeholder="${esc(f.placeholder||tx("Новое значение"))}" autocomplete="off" hidden>
    ${items.length?'':tx("<p class=\"fhint\">Справочник пока пуст. Нажмите «Добавить», и значение сохранится в справочнике.</p>")}
    <p class="err" data-err="${f.name}" hidden></p></div>`;
}
function fieldHtml(f){
  if(f.pick)return pickHtml(f);
  if(f.colors)return `<div class="field"><span class="lbl" id="lbl-${f.name}">${esc(f.label)}</span>
    <div class="sws" role="radiogroup" aria-labelledby="lbl-${f.name}">${COLORS.map(k=>`<label class="sw" title="${k.name}" style="--c:${k.hex}"><input type="radio" name="${f.name}" value="${k.id}"${k.id===f.value?' checked':''} aria-label="${k.name}"><span></span></label>`).join('')}</div>
    <p class="err" data-err="${f.name}" hidden></p></div>`;
  if(f.options)return `<div class="field${f.half?' field--half':''}"><label for="f-${f.name}">${esc(f.label)}</label>
    <select class="inp" id="f-${f.name}" name="${f.name}">${f.options.map(o=>`<option value="${esc(o[0])}"${o[0]===f.value?' selected':''}>${esc(o[1])}</option>`).join('')}</select>
    <p class="err" data-err="${f.name}" hidden></p></div>`;
  return `<div class="field${f.half?' field--half':''}"><label for="f-${f.name}">${esc(f.label)}</label>
    <input class="inp" id="f-${f.name}" name="${f.name}" type="${f.type==='time'?'text':(f.type||'text')}"${f.type==='time'?tx(" inputmode=\"numeric\" maxlength=\"5\" placeholder=\"ЧЧ:ММ\" data-time=\"1\""):''}${f.inputmode?` inputmode="${f.inputmode}"`:''}${f.list?` list="${f.list}"`:''}${f.placeholder?` placeholder="${esc(f.placeholder)}"`:''} value="${esc(f.value)}" autocomplete="off">
    <p class="err" data-err="${f.name}" hidden></p></div>`;
}
function openForm(o){
  const html=`<div class="overlay"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
    <h2 id="dlg-title" class="dlg-title">${esc(o.title)}</h2>
    <form id="dlg-form" novalidate autocomplete="off"><div class="fields">${o.fields.map(fieldHtml).join('')}</div>${o.extra||''}${o.extra2||''}
    <div class="dlg-actions">${o.onDelete?tx("<button type=\"button\" class=\"btn btn--ghost btn--danger dlg-del\" data-act=\"modal-delete\">Удалить</button>"):''}<button type="button" class="btn" data-act="modal-close">${tx("Отмена")}</button><button type="submit" class="btn btn--primary">${esc(o.submitLabel||tx("Сохранить"))}</button></div></form></div></div>`;
  showModal(html,{onDelete:o.onDelete,autofill:o.autofill,submit(form){
    const v={},isNew={};
    o.fields.forEach(f=>{
      if(f.pick){
        const sel=form.elements[f.name].value;
        if(sel==='__new__'){v[f.name]=cleanName(f.pick,form.elements[f.name+'__new'].value);isNew[f.name]=true;}
        else v[f.name]=sel;
      }else v[f.name]=String(form.elements[f.name].value||'').trim();
    });
    let firstBad=null;
    o.fields.forEach(f=>{
      const er=form.querySelector('[data-err="'+f.name+'"]');
      const el=f.pick&&isNew[f.name]?form.elements[f.name+'__new']:form.elements[f.name];
      let msg='';
      if(f.required&&!v[f.name])msg=f.pick?(isNew[f.name]?tx("Введите значение"):tx("Выберите значение из списка")):tx("Заполните это поле");
      else if(f.check&&v[f.name])msg=f.check(v)||'';
      if(er){er.textContent=msg;er.hidden=!msg;}
      if(el&&el.setAttribute)el.setAttribute('aria-invalid',msg?'true':'false');
      if(msg&&!firstBad)firstBad=el;
    });
    if(firstBad){if(firstBad.focus)firstBad.focus();return;}
    o.fields.forEach(f=>{if(f.pick&&isNew[f.name])v[f.name]=glossAdd(f.pick,v[f.name]);});
    closeModal();o.onSave(v);
  }});
}
function openConfirm(o){
  const html=`<div class="overlay"><div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" aria-describedby="dlg-text">
    <h2 id="dlg-title" class="dlg-title">${esc(o.title)}</h2><p id="dlg-text" class="dlg-text">${esc(o.text)}</p>
    <div class="dlg-actions"><button type="button" class="btn" id="dlg-cancel" data-act="modal-close">${tx("Отмена")}</button><button type="button" class="btn ${o.safe?'btn--primary':'btn--solid-danger'}" data-act="modal-confirm">${esc(o.confirmLabel||tx("Удалить"))}</button></div></div></div>`;
  showModal(html,{onConfirm:o.onConfirm,focus:'#dlg-cancel'});
}
function openExportFallback(filename,text){
  const html=`<div class="overlay"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
    <h2 id="dlg-title" class="dlg-title">${tx("Файл готов")}</h2>
    <p class="dlg-text">${tx('Автоматическое сохранение здесь недоступно. Скопируйте текст и вставьте в Excel или сохраните как файл «{f}».',{f:esc(filename)})}</p>
    <textarea class="dlg-area" id="dlg-area" readonly>${esc(text)}</textarea>
    <div class="dlg-actions"><button type="button" class="btn" data-act="modal-close">${tx("Закрыть")}</button><button type="button" class="btn btn--primary" data-act="copy-text">${tx("Скопировать")}</button></div></div></div>`;
  showModal(html,{focus:'#dlg-area'});
}
function showNewInput(name){
  const sel=document.getElementById('f-'+name),ni=document.getElementById('f-'+name+'__new');
  if(!sel||!ni)return;
  sel.value='__new__';ni.hidden=false;ni.focus();
}
function autofillCar(form,car){
  const tare=form.elements.tare;if(tare&&!tare.value.trim())tare.value=car.tare;
  [['driver',car.driver],['route',car.route],['material',car.material]].forEach(([n,val])=>{
    const sel=form.elements[n];
    if(sel&&!sel.value&&[...sel.options].some(o=>o.value===val))sel.value=val;
  });
  const r=[...form.querySelectorAll('input[name="color"]')].find(x=>x.value===car.color);if(r)r.checked=true;
  const nt=document.getElementById('af-note');
  if(nt){nt.textContent=tx("Данные подставлены из последней записи по этому номеру. Проверьте и измените при необходимости.");nt.hidden=false;}
}

