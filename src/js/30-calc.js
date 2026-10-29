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
const materialStats=sh=>groupStats([sh],c=>c.material);
function currentCar(){const sh=S.shifts[S.shiftId];return sh?sh.cars.find(c=>c.id===S.carId):null;}
function periodShifts(){return Object.values(S.shifts).filter(sh=>(!S.sFrom||sh.date>=S.sFrom)&&(!S.sTo||sh.date<=S.sTo)).sort((a,b)=>(a.date||'').localeCompare(b.date||'')||(a.createdAt||0)-(b.createdAt||0));}

