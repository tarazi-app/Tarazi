/* ---------- XLSX (без библиотек: минимальный ZIP + XML) ---------- */
const CRCT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(u){let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=CRCT[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function zipStore(files){
  const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  files.forEach(f=>{
    const name=enc.encode(f.name),data=enc.encode(f.text),crc=crc32(data);
    const h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint16(10,0,true);h.setUint16(12,0x5D5C,true);
    h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);h.setUint16(28,0,true);
    parts.push(new Uint8Array(h.buffer),name,data);
    const c=new DataView(new ArrayBuffer(46));
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(10,0,true);c.setUint16(12,0,true);c.setUint16(14,0x5D5C,true);
    c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);
    c.setUint32(42,off,true);
    cen.push(new Uint8Array(c.buffer),name);
    off+=30+name.length+data.length;
  });
  const cdSize=cen.reduce((a,b)=>a+b.length,0);
  const e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cdSize,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cen,new Uint8Array(e.buffer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
const xe=v=>String(v==null?'':v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function xcol(i){let n='',k=i+1;while(k>0){const r=(k-1)%26;n=String.fromCharCode(65+r)+n;k=Math.floor((k-1)/26);}return n;}
function xcell(ref,v,st){
  if(v===''||v==null)return '<c r="'+ref+'" s="'+st+'"/>';
  if(typeof v==='number')return '<c r="'+ref+'" s="'+st+'"><v>'+v+'</v></c>';
  return '<c r="'+ref+'" s="'+st+'" t="inlineStr"><is><t xml:space="preserve">'+xe(v)+'</t></is></c>';
}
const XNS='xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"';
function xsheet(rowsXml,widths,freeze){
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet '+XNS+'><sheetViews><sheetView workbookViewId="0">'
    +(freeze?'<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>':'')+'</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>'
    +'<cols>'+widths.map((w,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>').join('')+'</cols><sheetData>'+rowsXml+'</sheetData></worksheet>';
}
function xstyles(){
  // [numFmt,font,fill,border,align]
  const X=[[0,0,0,0,''],[0,2,0,0,''],[0,3,0,0,''],[0,3,0,0,''],[0,1,0,0,''],[0,1,2,1,''],[0,1,2,1,'right'],[0,0,0,0,''],[3,0,0,0,''],[4,0,0,0,''],[3,1,0,0,''],[4,1,0,0,''],[0,1,0,2,''],[3,1,0,2,''],[4,1,0,2,''],[0,1,0,0,'']];
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet '+XNS+'>'
   +'<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="16"/><name val="Calibri"/></font><font><sz val="10"/><color rgb="FF64748B"/><name val="Calibri"/></font></fonts>'
   +'<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEF1F6"/><bgColor indexed="64"/></patternFill></fill></fills>'
   +'<borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FF94A3B8"/></bottom><diagonal/></border><border><left/><right/><top style="thin"><color rgb="FF0F172A"/></top><bottom/><diagonal/></border></borders>'
   +'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
   +'<cellXfs count="'+X.length+'">'+X.map(x=>'<xf numFmtId="'+x[0]+'" fontId="'+x[1]+'" fillId="'+x[2]+'" borderId="'+x[3]+'" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"'+(x[4]?' applyAlignment="1"><alignment horizontal="'+x[4]+'"/></xf>':'/>')).join('')+'</cellXfs>'
   +'<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
}
function docToXlsx(doc){
  const sheets=[],used=new Set();
  const sname=t=>{let b=String(t).replace(/[\[\]:*?\/\\]/g,' ').trim().slice(0,28)||'Sheet',n=b,i=2;while(used.has(n.toLowerCase())){n=b+' '+i++;}used.add(n.toLowerCase());return n;};
  // сводка
  let r=1;const mrows=[];
  mrows.push('<row r="1">'+xcell('A1',doc.title,1)+'</row>');
  mrows.push('<row r="2">'+xcell('A2','Tarazi · '+tx('сформировано')+' '+stamp(),2)+'</row>');
  r=4;doc.meta.forEach(([k,v])=>{mrows.push('<row r="'+r+'">'+xcell('A'+r,k,3)+xcell('B'+r,String(v==null?'':v),4)+'</row>');r++;});
  const kw=Math.max(14,...doc.meta.map(m=>String(m[0]).length+3)),vw=Math.max(18,...doc.meta.map(m=>String(m[1]).length+3));
  sheets.push({name:sname(tx('Сводка')),xml:xsheet(mrows.join(''),[Math.min(kw,40),Math.min(vw,60)],false)});
  doc.tables.forEach(tb=>{
    const ncol=tb.head.length,wid=tb.head.map((h,i)=>{let m=String(h).length+2;[...tb.rows,...(tb.foot?[tb.foot]:[])].forEach(rw=>{m=Math.max(m,String(rw[i]==null?'':rw[i]).length+2);});return Math.min(60,Math.max(8,Math.round(m*1.1)));});
    const out=[];
    out.push('<row r="1">'+tb.head.map((h,i)=>xcell(xcol(i)+'1',h,tb.align[i]==='r'?6:5)).join('')+'</row>');
    const line=(rw,rn,foot)=>'<row r="'+rn+'">'+rw.map((v,i)=>{
      const bold=!!tb.boldLast&&i===ncol-1,num=tb.align[i]==='r'?numOf(v):null;
      let st;
      if(num!=null){const int=Number.isInteger(num);st=foot?(int?13:14):(bold?(int?10:11):(int?8:9));return xcell(xcol(i)+rn,num,st);}
      st=foot?12:(bold?15:7);return xcell(xcol(i)+rn,v,st);
    }).join('')+'</row>';
    tb.rows.forEach((rw,k)=>out.push(line(rw,k+2,false)));
    if(tb.foot)out.push(line(tb.foot,tb.rows.length+2,true));
    sheets.push({name:sname(tb.title),xml:xsheet(out.join(''),wid,true)});
  });
  const files=[
    {name:'[Content_Types].xml',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+sheets.map((_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'},
    {name:'_rels/.rels',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
    {name:'xl/workbook.xml',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook '+XNS+' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((sh,i)=>'<sheet name="'+xe(sh.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>'},
    {name:'xl/_rels/workbook.xml.rels',text:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'<Relationship Id="rId'+(sheets.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
    {name:'xl/styles.xml',text:xstyles()}
  ].concat(sheets.map((sh,i)=>({name:'xl/worksheets/sheet'+(i+1)+'.xml',text:sh.xml})));
  return zipStore(files);
}
async function buildExportFile(fmt,o){
  if(fmt==='csv'){const t=o.csv();return {name:o.base+'.csv',data:'﻿'+t,text:t};}
  if(fmt==='txt'){const t=docToTxt(o.doc());return {name:o.base+'.txt',data:'﻿'+t,text:t};}
  if(fmt==='png')return {name:o.base+'.png',data:await docToPng(o.doc())};
  if(fmt==='xlsx')return {name:o.base+'.xlsx',data:docToXlsx(o.doc())};
  return {name:o.base+'.pdf',data:await docToPdf(o.doc())};
}
async function deliver(name,data,text){
  if(!S.downloads){
    if(text!=null){closeModal();openExportFallback(name,text);}
    else toast(tx("В этом окне сохранение файлов недоступно. Откройте сайт в браузере."),'err');
    return false;
  }
  try{await S.downloads.save({filename:name,data});toast(tx("Файл сохранён: ")+name);return true;}
  catch(e){
    const code=e&&e.code;
    if(code==='declined')return false;
    if(code==='rate_limited'){toast(tx("Подождите секунду и повторите."),'err');return false;}
    if(text!=null){closeModal();openExportFallback(name,text);}
    else toast(tx("Не удалось сохранить файл."),'err');
    return false;
  }
}
async function runExport(fmt){
  const st=S.modal,o=st&&st.exp;if(!o||st.busy)return;
  st.busy=true;
  const btns=[...$modal.querySelectorAll('.xbtn')],msg=document.getElementById('x-status');
  btns.forEach(b=>{b.disabled=true;});
  if(msg){msg.textContent=tx("Готовлю файл…");msg.hidden=false;}
  try{
    const f=await buildExportFile(fmt,o);
    if(S.modal!==st)return;
    const ok=await deliver(f.name,f.data,f.text);
    if(ok&&S.modal===st)closeModal();
  }catch(e){toast(tx("Не удалось подготовить файл. Попробуйте другой формат."),'err');}
  finally{st.busy=false;if(S.modal===st){btns.forEach(b=>{b.disabled=false;});if(msg)msg.hidden=true;}}
}
function openExport(o){
  const fm=[['pdf','PDF',tx("Для печати и отправки")],['png','PNG',tx("Картинка для мессенджера")],['xlsx','Excel',tx("Таблица .xlsx")],['csv','CSV',tx("Простая таблица")],['txt','TXT',tx("Простой текст")]];
  const html=`<div class="overlay"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
    <h2 id="dlg-title" class="dlg-title">${tx("Скачать отчёт")}</h2><p class="dlg-text">${esc(o.sub)}</p>
    <div class="xgrid">${fm.map(f=>`<button type="button" class="xbtn" data-act="export-go" data-fmt="${f[0]}"><b>${f[1]}</b><span>${f[2]}</span></button>`).join('')}</div>
    <p class="dlg-note" id="x-status" hidden></p>
    <div class="dlg-actions"><button type="button" class="btn" data-act="modal-close">${tx("Закрыть")}</button></div></div></div>`;
  showModal(html,{exp:o,focus:'.xbtn'});
}

