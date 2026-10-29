/* ---------- отчёт по водителю или маршруту ---------- */
function entCurrent(list){
  const kind=S.entKind==='route'?'route':'driver';
  const names=groupStats(list,c=>kind==='route'?c.route:c.driver).map(g=>g.name).sort((a,b)=>a.localeCompare(b,LOC()));
  return {kind,names,name:names.includes(S.entName)?S.entName:(names[0]||'')};
}
function entityDoc(list,kind,name){
  const rows=[];let trips=0,gross=0,net=0;const days=new Set();
  list.forEach(sh=>sh.cars.forEach(c=>{
    if(!sameName(kind==='route'?c.route:c.driver,name==='' ? '' : (name===tx("Не указан")?'':name)))return;
    const st=carStats(c);if(!st.n)return;
    days.add(sh.id);trips+=st.n;gross=r2(gross+st.gross);net=r2(net+st.net);
    rows.push([dateRu(sh.date),shiftName(sh),c.plate,kind==='route'?c.driver:c.route,c.material,st.n,fmt(st.gross),fmt(st.net)]);
  }));
  return {title:kind==='route'?tx('Отчёт по маршруту'):tx('Отчёт по водителю'),orient:'l',
    meta:[[tx('С даты'),S.sFrom?dateRu(S.sFrom):tx('начала')],[tx('По дату'),S.sTo?dateRu(S.sTo):tx('сегодня')],[kind==='route'?tx('Маршрут'):tx('Водитель'),name],[tx('Смен'),days.size],[tx('Рейсов'),trips],[tx('Нетто всего, кг'),fmt(net)]],
    tables:[{title:tx('Рейсы'),head:[tx('Дата'),tx('Смена'),tx('Машина'),kind==='route'?tx('Водитель'):tx('Маршрут'),tx('Материал'),tx('Рейсов'),tx('Брутто, кг'),tx('Нетто, кг')],align:'lllllrrr',boldLast:true,rows,
      foot:[tx('Итого'),'','','','',trips,fmt(gross),fmt(net)]}]};
}
function numOf(s){
  if(typeof s==='number')return isFinite(s)?s:null;
  const t=String(s==null?'':s).replace(/[\s  ]/g,'').replace(',','.');
  return /^-?\d+(\.\d+)?$/.test(t)?Number(t):null;
}
function docToCsv(doc){
  const L=[row(doc.title.toUpperCase())];
  doc.meta.forEach(([k,v])=>L.push(row(k,v)));
  doc.tables.forEach(tb=>{
    const conv=r=>r.map((c,i)=>tb.align[i]==='r'&&numOf(c)!=null?numOf(c):c);
    L.push('');L.push(row(tb.title.toUpperCase()));L.push(row(...tb.head));
    tb.rows.forEach(r=>L.push(row(...conv(r))));
    if(tb.foot)L.push(row(...conv(tb.foot)));
  });
  return L.join('\r\n');
}

