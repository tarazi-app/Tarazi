/* ---------- экспорт: PDF, PNG, TXT, CSV ---------- */
const stamp=()=>dateRu(todayISO())+' '+nowHM();
function carDoc(sh,car){
  const st=carStats(car);
  return {title:tx("Отчёт по машине"),orient:'p',
    meta:[[tx("Дата"),dateRu(sh.date)],[tx("Смена"),shiftName(sh)],[tx("Оператор автовесов"),sh.operator],[tx("Номер машины"),car.plate],[tx("Водитель"),car.driver],[tx("Время прибытия"),car.arrival||'—'],[tx("Маршрут"),car.route],[tx("Материал"),car.material],[tx("Вес тары, кг"),fmt(car.tare)],[tx("Нетто всего, кг"),fmt(st.net)]],
    tables:[{title:tx("Рейсы"),head:['№',tx("Время"),tx("Брутто, кг"),tx("Тара, кг"),tx("Нетто, кг")],align:'lrrrr',boldLast:true,
      rows:car.trips.map((t,i)=>[i+1,t.time,fmt(t.gross),fmt(car.tare),fmt(r2(t.gross-car.tare))]),
      foot:['Σ',st.n+tx(" рейс."),fmt(st.gross),'',fmt(st.net)]}]};
}
function shiftDoc(sh){
  const tot=shiftStats(sh);
  const trips=[];let n=0;
  sh.cars.forEach(c=>c.trips.forEach(t=>{n++;trips.push([n,c.plate,c.driver,c.route,c.material,t.time,fmt(c.tare),fmt(t.gross),fmt(r2(t.gross-c.tare))]);}));
  return {title:tx("Общий расчёт за смену"),orient:'l',
    meta:[[tx("Дата"),dateRu(sh.date)],[tx("Смена"),shiftName(sh)],[tx("Оператор автовесов"),sh.operator],[tx("Машин"),tot.cars],[tx("Рейсов"),tot.trips],[tx("Нетто всего, кг"),fmt(tot.net)]],
    tables:[
      {title:tx("По машинам"),head:['№',tx("Машина"),tx("Водитель"),tx("Маршрут"),tx("Материал"),tx("Прибытие"),tx("Тара, кг"),tx("Рейсов"),tx("Брутто, кг"),tx("Нетто, кг")],align:'llllllrrrr',boldLast:true,
        rows:sh.cars.map((c,i)=>{const s=carStats(c);return [i+1,c.plate,c.driver,c.route,c.material,c.arrival||'—',fmt(c.tare),s.n,fmt(s.gross),fmt(s.net)];}),
        foot:[tx("Итого"),'','','','','','',tot.trips,fmt(tot.gross),fmt(tot.net)]},
      {title:tx("По материалам"),head:[tx("Материал"),tx("Машин"),tx("Рейсов"),tx("Нетто, кг")],align:'lrrr',boldLast:true,
        rows:materialStats(sh).map(m=>[m.name,m.cars,m.trips,fmt(m.net)])},
      {title:tx("Все рейсы"),head:['№',tx("Машина"),tx("Водитель"),tx("Маршрут"),tx("Материал"),tx("Время"),tx("Тара, кг"),tx("Брутто, кг"),tx("Нетто, кг")],align:'lllllrrrr',boldLast:true,rows:trips}
    ]};
}
function periodDoc(list){
  const tot=list.reduce((a,sh)=>{const s=shiftStats(sh);a.cars+=s.cars;a.trips+=s.trips;a.net=r2(a.net+s.net);return a;},{cars:0,trips:0,net:0});
  const grp=(title,h,pick)=>({title,head:[h,tx("Машин"),tx("Рейсов"),tx("Нетто, кг")],align:'lrrr',boldLast:true,rows:groupStats(list,pick).map(g=>[g.name,g.cars,g.trips,fmt(g.net)])});
  return {title:tx("Сводка за период"),orient:'l',
    meta:[[tx("С даты"),S.sFrom?dateRu(S.sFrom):tx("начала")],[tx("По дату"),S.sTo?dateRu(S.sTo):tx("сегодня")],[tx("Смен"),list.length],[tx("Машин"),tot.cars],[tx("Рейсов"),tot.trips],[tx("Нетто всего, т"),fmt(tot.net/1000,1)]],
    tables:[
      {title:tx("По сменам"),head:[tx("Дата"),tx("Смена"),tx("Оператор"),tx("Машин"),tx("Рейсов"),tx("Нетто, кг")],align:'lllrrr',boldLast:true,
        rows:list.map(sh=>{const s=shiftStats(sh);return [dateRu(sh.date),shiftName(sh),sh.operator,s.cars,s.trips,fmt(s.net)];}),
        foot:[tx("Итого"),'','',tot.cars,tot.trips,fmt(tot.net)]},
      grp(tx("По материалам"),tx("Материал"),c=>c.material),
      grp(tx("По маршрутам"),tx("Маршрут"),c=>c.route),
      grp(tx("По водителям"),tx("Водитель"),c=>c.driver)
    ]};
}
function docToTxt(doc){
  const cl=s=>String(s==null?'':s).replace(/[  ]/g,' ');
  const L=[doc.title.toUpperCase(),'Tarazi · '+tx('сформировано')+' '+stamp(),''];
  const kw=Math.max(...doc.meta.map(m=>m[0].length));
  doc.meta.forEach(([k,v])=>L.push(k.padEnd(kw)+' : '+cl(v)));
  doc.tables.forEach(tb=>{
    const all=[tb.head,...tb.rows,...(tb.foot?[tb.foot]:[])].map(r=>r.map(cl));
    const w=tb.head.map((_,i)=>Math.max(...all.map(r=>r[i].length)));
    const fr=r=>r.map((c,i)=>tb.align[i]==='r'?c.padStart(w[i]):c.padEnd(w[i])).join(' | ').replace(/\s+$/,'');
    const sep=w.map(n=>'-'.repeat(n)).join('-+-');
    L.push('',tb.title.toUpperCase(),fr(all[0]),sep);
    all.slice(1,tb.foot?-1:undefined).forEach(r=>L.push(fr(r)));
    if(tb.foot)L.push(sep,fr(all[all.length-1]));
  });
  return L.join('\r\n');
}

const RF='Onest, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const RC={ink:'#0F172A',mute:'#64748B',head:'#334155',line:'#D9E0E7',fill:'#EEF1F6',accent:'#0F766E'};
const toBlob=(cv,type,q)=>new Promise((res,rej)=>cv.toBlob(b=>b?res(b):rej(new Error('blob')),type,q));
function wrapLines(ctx,text,maxW){
  text=String(text==null?'':text);if(!text)return [''];
  const out=[];let line='';
  for(const w of text.split(/\s+/)){
    const t=line?line+' '+w:w;
    if(ctx.measureText(t).width<=maxW){line=t;continue;}
    if(line){out.push(line);line='';}
    let chunk='';
    for(const ch of w){if(chunk&&ctx.measureText(chunk+ch).width>maxW){out.push(chunk);chunk=ch;}else chunk+=ch;}
    line=chunk;
  }
  out.push(line);return out;
}
function layoutDoc(doc,W){
  const M=40,cw=W-2*M,ctx=document.createElement('canvas').getContext('2d'),items=[];
  const F=(wt,sz)=>{ctx.font=wt+' '+sz+'px '+RF;};
  items.push({t:'title',h:64,text:doc.title});
  const half=cw/2;
  const blocks=doc.meta.map(([k,v])=>{F(700,14);const lines=wrapLines(ctx,v,half-16);return {k,lines,h:22+lines.length*19};});
  for(let i=0;i<blocks.length;i+=2){const pair=blocks.slice(i,i+2);items.push({t:'meta',pair,h:Math.max(...pair.map(b=>b.h))+6});}
  doc.tables.forEach(tb=>{
    const pad=9,all=[tb.head,...tb.rows,...(tb.foot?[tb.foot]:[])];
    const nat=tb.head.map((_,i)=>{let m=0;all.forEach((r,ri)=>{const bold=ri===0||(tb.foot&&r===tb.foot);F(bold?700:400,ri===0?12:13);m=Math.max(m,ctx.measureText(String(r[i]==null?'':r[i])).width);});return m+2*pad;});
    const sum=nat.reduce((a,b)=>a+b,0);
    let w;
    if(sum<=cw){w=nat.map(x=>x+(cw-sum)*(x/sum));}
    else{
      const mn=nat.map(x=>Math.min(x,64));
      w=nat.map((x,i)=>Math.max(mn[i],x*cw/sum));
      const total=w.reduce((a,b)=>a+b,0);
      if(total>cw){const flex=w.map((x,i)=>x-mn[i]),fs=flex.reduce((a,b)=>a+b,0)||1;w=w.map((x,i)=>x-(total-cw)*flex[i]/fs);}
    }
    const xs=[];let x=M;w.forEach(v=>{xs.push(x);x+=v;});
    const T={w,xs,pad,align:tb.align,boldLast:tb.boldLast};
    const mk=(cells,bold,head)=>{
      F(bold?700:400,head?12:13);
      const lines=cells.map((c,i)=>wrapLines(ctx,c,w[i]-2*pad)),lh=head?15:17;
      return {lines,lh,h:Math.max(...lines.map(l=>l.length))*lh+(head?14:12)};
    };
    items.push({t:'h2',h:42,text:tb.title});
    items.push(Object.assign({t:'thead',T},mk(tb.head,true,true)));
    tb.rows.forEach(r=>items.push(Object.assign({t:'trow',T},mk(r,false,false))));
    if(tb.foot)items.push(Object.assign({t:'tfoot',T},mk(tb.foot,true,false)));
  });
  return {items,M,cw,half};
}
function drawItem(ctx,it,y,L){
  const M=L.M,cw=L.cw;
  ctx.textBaseline='alphabetic';ctx.textAlign='left';
  const hline=(yy,lw,col)=>{ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(M,yy);ctx.lineTo(M+cw,yy);ctx.stroke();};
  if(it.t==='title'){
    ctx.fillStyle=RC.ink;ctx.font='700 26px '+RF;ctx.fillText(it.text,M,y+28);
    ctx.fillStyle=RC.mute;ctx.font='400 12px '+RF;ctx.fillText('Tarazi · '+tx('сформировано')+' '+stamp(),M,y+47);
    hline(y+56,2,RC.ink);
  }else if(it.t==='meta'){
    it.pair.forEach((b,j)=>{
      const x=M+j*L.half;
      ctx.fillStyle=RC.mute;ctx.font='400 11.5px '+RF;ctx.fillText(b.k,x,y+12);
      ctx.fillStyle=RC.ink;ctx.font='700 14px '+RF;
      b.lines.forEach((ln,li)=>ctx.fillText(ln,x,y+31+li*19));
    });
  }else if(it.t==='h2'){
    ctx.fillStyle=RC.ink;ctx.font='700 17px '+RF;ctx.fillText(it.text,M,y+28);
  }else{
    const T=it.T,head=it.t==='thead',bold=head||it.t==='tfoot';
    if(head){ctx.fillStyle=RC.fill;ctx.fillRect(M,y,cw,it.h);}
    if(it.t==='tfoot')hline(y+0.75,1.5,RC.ink);
    else if(it.t==='trow')hline(y+it.h-0.5,1,RC.line);
    it.lines.forEach((lines,i)=>{
      const b=bold||(T.boldLast&&i===T.w.length-1);
      ctx.font=(b?'700 ':'400 ')+(head?12:13)+'px '+RF;
      ctx.fillStyle=head?RC.head:RC.ink;
      const right=T.align[i]==='r';
      ctx.textAlign=right?'right':'left';
      const x=right?T.xs[i]+T.w[i]-T.pad:T.xs[i]+T.pad;
      lines.forEach((ln,li)=>ctx.fillText(ln,x,y+(head?18:17)+li*it.lh));
    });
    ctx.textAlign='left';
  }
}
async function loadReportFonts(){
  try{await Promise.all([document.fonts.load('400 13px Onest'),document.fonts.load('700 13px Onest')]);}catch(e){}
}
async function docToPng(doc){
  await loadReportFonts();
  const W=doc.orient==='l'?1400:900,L=layoutDoc(doc,W);
  const H=L.M*2+L.items.reduce((a,i)=>a+i.h,0);
  const sc=Math.max(1,Math.min(2,Math.sqrt(14e6/(W*H))));
  const cv=document.createElement('canvas');cv.width=Math.round(W*sc);cv.height=Math.round(H*sc);
  const ctx=cv.getContext('2d');ctx.scale(sc,sc);ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,W,H);
  let y=L.M;L.items.forEach(it=>{drawItem(ctx,it,y,L);y+=it.h;});
  return toBlob(cv,'image/png');
}
function paginate(items,H,M){
  const bottom=H-M-14,pages=[[]];let y=M,pi=0,head=null;
  const np=()=>{pages.push([]);pi++;y=M;};
  const add=it=>{pages[pi].push({it,y});y+=it.h;};
  items.forEach((it,idx)=>{
    if(it.t==='title'||it.t==='meta'){if(y+it.h>bottom&&y>M)np();add(it);return;}
    if(it.t==='h2'){
      const need=it.h+(items[idx+1]?items[idx+1].h:0)+(items[idx+2]?items[idx+2].h:0);
      if(y+need>bottom&&y>M)np();add(it);return;
    }
    if(it.t==='thead'){head=it;add(it);return;}
    if(y+it.h>bottom){np();if(head)add(head);}
    add(it);
  });
  return pages;
}
function buildPdf(pages){
  const enc=new TextEncoder(),chunks=[],offs=[];let off=0;
  const push=b=>{chunks.push(b);off+=b.length;};
  const str=s=>push(enc.encode(s));
  const n=pages.length;
  str('%PDF-1.4\n');push(new Uint8Array([0x25,0xE2,0xE3,0xCF,0xD3,10]));
  const obj=(id,fn)=>{offs[id]=off;str(id+' 0 obj\n');fn();str('\nendobj\n');};
  obj(1,()=>str('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2,()=>str('<< /Type /Pages /Count '+n+' /Kids ['+pages.map((_,i)=>(3+3*i)+' 0 R').join(' ')+'] >>'));
  pages.forEach((p,i)=>{
    const pw=(p.w*0.75).toFixed(2),ph=(p.h*0.75).toFixed(2);
    obj(3+3*i,()=>str('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+pw+' '+ph+'] /Resources << /XObject << /Im0 '+(5+3*i)+' 0 R >> >> /Contents '+(4+3*i)+' 0 R >>'));
    const cs='q '+pw+' 0 0 '+ph+' 0 0 cm /Im0 Do Q';
    obj(4+3*i,()=>str('<< /Length '+cs.length+' >>\nstream\n'+cs+'\nendstream'));
    obj(5+3*i,()=>{str('<< /Type /XObject /Subtype /Image /Width '+p.iw+' /Height '+p.ih+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+p.jpg.length+' >>\nstream\n');push(p.jpg);str('\nendstream');});
  });
  const total=3+3*n,xref=off;
  str('xref\n0 '+total+'\n0000000000 65535 f \n');
  for(let id=1;id<total;id++)str(String(offs[id]).padStart(10,'0')+' 00000 n \n');
  str('trailer\n<< /Size '+total+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF');
  return new Blob(chunks,{type:'application/pdf'});
}
async function docToPdf(doc){
  await loadReportFonts();
  const land=doc.orient==='l',pw=land?1123:794,ph=land?794:1123,sc=2;
  const L=layoutDoc(doc,pw),pages=paginate(L.items,ph,L.M),out=[];
  for(let i=0;i<pages.length;i++){
    const cv=document.createElement('canvas');cv.width=pw*sc;cv.height=ph*sc;
    const ctx=cv.getContext('2d');ctx.scale(sc,sc);ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,pw,ph);
    pages[i].forEach(p=>drawItem(ctx,p.it,p.y,L));
    ctx.fillStyle=RC.mute;ctx.font='400 11px '+RF;ctx.textBaseline='alphabetic';
    ctx.textAlign='left';ctx.fillText('Tarazi',L.M,ph-22);
    ctx.textAlign='right';ctx.fillText((i+1)+' / '+pages.length,pw-L.M,ph-22);
    const blob=await toBlob(cv,'image/jpeg',0.92);
    out.push({w:pw,h:ph,iw:cv.width,ih:cv.height,jpg:new Uint8Array(await blob.arrayBuffer())});
  }
  return buildPdf(out);
}

