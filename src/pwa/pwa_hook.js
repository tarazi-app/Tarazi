/* ---------- PWA (iPhone/браузер): сохранение через «Поделиться» или загрузку ---------- */
const MIMES={pdf:'application/pdf',png:'image/png',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',csv:'text/csv;charset=utf-8',txt:'text/plain;charset=utf-8',json:'application/json'};
function webDownloads(){
  return {save({filename,data}){
    return new Promise((resolve,reject)=>{
      const ext=(filename.split('.').pop()||'').toLowerCase();
      const blob=data instanceof Blob?data:new Blob([data],{type:MIMES[ext]||'application/octet-stream'});
      const html=`<div class="overlay"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <h2 id="dlg-title" class="dlg-title">${tx("Файл готов")}</h2><p class="dlg-text">${esc(filename)}</p>
        <div class="dlg-actions"><button type="button" class="btn" data-act="modal-close">${tx("Закрыть")}</button><button type="button" class="btn btn--primary" data-act="web-save">${tx("Сохранить")}</button></div></div></div>`;
      showModal(html,{focus:'[data-act=web-save]',webSave:async()=>{
        try{
          const file=new File([blob],filename,{type:blob.type});
          if(navigator.canShare&&navigator.canShare({files:[file]})){
            try{await navigator.share({files:[file],title:filename});closeModal();resolve({status:'saved'});return;}
            catch(e){if(e&&e.name==='AbortError')return;}
          }
          const url=URL.createObjectURL(blob),a=document.createElement('a');
          a.href=url;a.download=filename;document.body.appendChild(a);a.click();
          setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},4000);
          closeModal();resolve({status:'saved'});
        }catch(e){reject({code:'unavailable',message:String(e&&e.message||e)});}
      }});
    });
  }};
}
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
