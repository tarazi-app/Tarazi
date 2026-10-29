/* ---------- glossary model ---------- */
const sameName=(a,b)=>String(a||'').trim().toLowerCase()===String(b||'').trim().toLowerCase();
function cleanName(cat,s){let t=String(s||'').replace(/\s+/g,' ').trim();if(cat==='vehicles')t=t.toUpperCase();return t;}
function glossFind(cat,name){return S.glossary[cat].find(x=>sameName(x.name,name));}
function glossAdd(cat,name){
  const n=cleanName(cat,name);if(!n)return null;
  const ex=glossFind(cat,n);if(ex)return ex.name;
  S.glossary[cat].push({id:uid('g'),name:n});persistGlossary();return n;
}
function glossValue(cat,car){return {routes:car.route,vehicles:car.plate,drivers:car.driver,materials:car.material}[cat];}
function usageCount(cat,name){
  let n=0;
  Object.values(S.shifts).forEach(sh=>{
    if(cat==='operators'){if(sameName(sh.operator,name))n++;}
    else sh.cars.forEach(c=>{if(sameName(glossValue(cat,c),name))n++;});
  });
  return n;
}
function missingFromShifts(){
  const seen={},out=[];
  const add=(cat,v)=>{const n=cleanName(cat,v);if(!n)return;const k=cat+'|'+n.toLowerCase();if(seen[k]||glossFind(cat,n))return;seen[k]=1;out.push({cat,name:n});};
  Object.values(S.shifts).forEach(sh=>{
    add('operators',sh.operator);
    sh.cars.forEach(c=>{add('vehicles',c.plate);add('drivers',c.driver);add('routes',c.route);add('materials',c.material);});
  });
  return out;
}
function autoType(){const h=new Date().getHours();return h>=8&&h<20?'day':'night';}
function lastOperator(){const l=Object.values(S.shifts).sort(newestFirst)[0];return l?l.operator:'';}

