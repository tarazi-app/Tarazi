/* ---------- Android (Capacitor): сохранение файлов через меню «Поделиться» ---------- */
function nativeDownloads(){
  const C=window.Capacitor;
  if(!C||!C.isNativePlatform||!C.isNativePlatform())return null;
  const P=C.Plugins||{};if(!P.Filesystem||!P.Share)return null;
  const toB64=async d=>{
    if(typeof d==='string')d=new TextEncoder().encode(d);
    else if(d instanceof Blob)d=new Uint8Array(await d.arrayBuffer());
    else if(d instanceof ArrayBuffer)d=new Uint8Array(d);
    let bin='';for(let i=0;i<d.length;i+=0x8000)bin+=String.fromCharCode.apply(null,d.subarray(i,i+0x8000));
    return btoa(bin);
  };
  return {async save({filename,data}){
    try{
      const w=await P.Filesystem.writeFile({path:filename,data:await toB64(data),directory:'CACHE'});
      await P.Share.share({title:filename,files:[w.uri],dialogTitle:'Сохранить или отправить файл'});
      return {status:'saved'};
    }catch(e){
      const m=String(e&&e.message||e).toLowerCase();
      if(m.includes('cancel')||m.includes('dismiss'))throw {code:'declined'};
      throw {code:'unavailable',message:String(e&&e.message||e)};
    }
  }};
}
