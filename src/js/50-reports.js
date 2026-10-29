/* ---------- reports ---------- */
const cell=v=>{
  if(typeof v==='number')return String(r2(v)).replace('.',',');
  let s=String(v==null?'':v);
  if(/^[=+\-@\t\r]/.test(s))s="'"+s;
  if(/[;"\r\n]/.test(s))s='"'+s.replace(/"/g,'""')+'"';
  return s;
};
const row=(...a)=>a.map(cell).join(';');

function carReportCsv(sh,car){
  const st=carStats(car),L=[];
  L.push(row(tx("ОТЧЁТ ПО МАШИНЕ")));
  L.push(row(tx("Дата"),dateRu(sh.date)));
  L.push(row(tx("Смена"),shiftName(sh)));
  L.push(row(tx("Оператор автовесов"),sh.operator));
  L.push(row(tx("Номер машины"),car.plate));
  L.push(row(tx("Водитель"),car.driver));
  L.push(row(tx("Время прибытия"),car.arrival));
  L.push(row(tx("Маршрут"),car.route));
  L.push(row(tx("Материал"),car.material));
  L.push(row(tx("Вес тары, кг"),car.tare));
  L.push('');
  L.push(row(tx("№ рейса"),tx("Время взвешивания"),tx("Брутто, кг"),tx("Тара, кг"),tx("Нетто, кг")));
  car.trips.forEach((t,i)=>L.push(row(i+1,t.time,t.gross,car.tare,r2(t.gross-car.tare))));
  L.push(row(tx("ИТОГО, рейсов: ")+st.n,'',st.gross,'',st.net));
  return L.join('\r\n');
}
function shiftReportCsv(sh){
  const L=[],tot=shiftStats(sh);
  L.push(row(tx("ОБЩИЙ РАСЧЁТ ЗА СМЕНУ")));
  L.push(row(tx("Дата"),dateRu(sh.date)));
  L.push(row(tx("Смена"),shiftName(sh)));
  L.push(row(tx("Оператор автовесов"),sh.operator));
  L.push('');
  L.push(row(tx("РАСЧЁТ ПО МАШИНАМ")));
  L.push(row('№',tx("Номер машины"),tx("Водитель"),tx("Маршрут"),tx("Материал"),tx("Прибытие"),tx("Тара, кг"),tx("Рейсов"),tx("Брутто всего, кг"),tx("Нетто всего, кг")));
  sh.cars.forEach((c,i)=>{const s=carStats(c);L.push(row(i+1,c.plate,c.driver,c.route,c.material,c.arrival,c.tare,s.n,s.gross,s.net));});
  L.push(row(tx("ИТОГО"),'','','','','','',tot.trips,tot.gross,tot.net));
  L.push('');
  L.push(row(tx("ИТОГО ПО МАТЕРИАЛАМ")));
  L.push(row(tx("Материал"),tx("Машин"),tx("Рейсов"),tx("Нетто, кг")));
  materialStats(sh).forEach(m=>L.push(row(m.name,m.cars,m.trips,m.net)));
  L.push('');
  L.push(row(tx("ВСЕ РЕЙСЫ")));
  L.push(row('№',tx("Номер машины"),tx("Водитель"),tx("Маршрут"),tx("Материал"),tx("Время взвешивания"),tx("Тара, кг"),tx("Брутто, кг"),tx("Нетто, кг")));
  let n=0;
  sh.cars.forEach(c=>c.trips.forEach(t=>{n++;L.push(row(n,c.plate,c.driver,c.route,c.material,t.time,c.tare,t.gross,r2(t.gross-c.tare)));}));
  return L.join('\r\n');
}
function periodCsv(list){
  const L=[],tot=list.reduce((a,sh)=>{const s=shiftStats(sh);a.cars+=s.cars;a.trips+=s.trips;a.net=r2(a.net+s.net);return a;},{cars:0,trips:0,net:0});
  L.push(row(tx("СВОДКА ЗА ПЕРИОД")));
  L.push(row(tx("С"),S.sFrom?dateRu(S.sFrom):tx("начала")));
  L.push(row(tx("По"),S.sTo?dateRu(S.sTo):tx("сегодня")));
  L.push('');
  L.push(row(tx("ПО СМЕНАМ")));
  L.push(row(tx("Дата"),tx("Смена"),tx("Оператор"),tx("Машин"),tx("Рейсов"),tx("Нетто, кг")));
  list.forEach(sh=>{const s=shiftStats(sh);L.push(row(dateRu(sh.date),shiftName(sh),sh.operator,s.cars,s.trips,s.net));});
  L.push(row(tx("ИТОГО"),'','',tot.cars,tot.trips,tot.net));
  [[tx("ПО МАТЕРИАЛАМ"),tx("Материал"),c=>c.material],[tx("ПО МАРШРУТАМ"),tx("Маршрут"),c=>c.route],[tx("ПО ВОДИТЕЛЯМ"),tx("Водитель"),c=>c.driver]].forEach(([title,h,pick])=>{
    L.push('');L.push(row(title));L.push(row(h,tx("Машин"),tx("Рейсов"),tx("Нетто, кг")));
    groupStats(list,pick).forEach(g=>L.push(row(g.name,g.cars,g.trips,g.net)));
  });
  return L.join('\r\n');
}
async function saveFile(filename,text,bom){
  if(!S.downloads){openExportFallback(filename,text);return;}
  try{
    await S.downloads.save({filename,data:(bom?'﻿':'')+text});
    toast(tx("Файл сохранён: ")+filename);
  }catch(e){
    const code=e&&e.code;
    if(code==='declined')return;
    if(code==='rate_limited'){toast(tx("Подождите секунду и повторите."),'err');return;}
    openExportFallback(filename,text);
  }
}
const saveCsv=(f,t)=>saveFile(f,t,true);

