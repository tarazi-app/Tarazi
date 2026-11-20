/* ---------- calculations ---------- */
function carStats(c){let gross=0,net=0;c.trips.forEach(t=>{gross+=t.gross;net+=t.gross-c.tare;});return{n:c.trips.length,gross:r2(gross),net:r2(net)};}
function shiftStats(sh){let trips=0,net=0,gross=0;sh.cars.forEach(c=>{const s=carStats(c);trips+=s.n;net+=s.net;gross+=s.gross;});return{cars:sh.cars.length,trips,net:r2(net),gross:r2(gross)};}
function groupStats(list,pick){
  const m={};
  list.forEach(sh=>sh.cars.forEach(c=>{
    const name=pick(c)||tx("Не указан"),k=name.trim().toLowerCase(),s=carStats(c);
    if(!m[k])m[k]={name,cars:0,trips:0,net:0};
    m[k].cars++;m[k].trips+=s.n;m[k].net=r2(m[k].net+s.net);
  }));
  return Object.values(m).sort((a,b)=>b.net-a.net);
}
function driverRoutes(list){
  const d={};
  list.forEach(sh=>sh.cars.forEach(c=>{
    const dn=c.driver||tx("Не указан"),rn=c.route||tx("Без маршрута"),s=carStats(c);
    const dk=dn.trim().toLowerCase(),rk=rn.trim().toLowerCase();
    const D=d[dk]||(d[dk]={name:dn,cars:0,trips:0,net:0,r:{}});
    const R=D.r[rk]||(D.r[rk]={name:rn,cars:0,trips:0,net:0});
    [D,R].forEach(x=>{x.cars++;x.trips+=s.n;x.net=r2(x.net+s.net);});
  }));
  return Object.values(d).map(D=>({name:D.name,cars:D.cars,trips:D.trips,net:D.net,routes:Object.values(D.r).sort((a,b)=>b.net-a.net)})).sort((a,b)=>b.net-a.net);
}
// Строки для таблицы «Водитель → маршруты» с итогом по каждому водителю.
function driverRouteRows(list,f){
  const out=[];
  driverRoutes(list).forEach(D=>{
    D.routes.forEach(R=>out.push([D.name,R.name,R.cars,R.trips,f(R.net)]));
    if(D.routes.length>1)out.push([D.name,tx("Итого"),D.cars,D.trips,f(D.net)]);
  });
  return out;
}
const DR_HEAD=()=>[tx("Водитель"),tx("Маршрут"),tx("Машин"),tx("Рейсов"),tx("Нетто, кг")];
const materialStats=sh=>groupStats([sh],c=>c.material);
const routeStats=sh=>groupStats([sh],c=>c.route||tx("Без маршрута"));
function currentCar(){const sh=S.shifts[S.shiftId];return sh?sh.cars.find(c=>c.id===S.carId):null;}
function periodShifts(){return Object.values(S.shifts).filter(sh=>(!S.sFrom||sh.date>=S.sFrom)&&(!S.sTo||sh.date<=S.sTo)).sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.createdAt||0)-(b.createdAt||0));}

