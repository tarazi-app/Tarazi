/* ---------- navigation ---------- */
function parseHash(){
  const h=location.hash;let m;
  if((m=/^#car-([a-z0-9]+)-([a-z0-9]+)$/.exec(h)))return{view:'car',shiftId:m[1],carId:m[2]};
  if((m=/^#shift-([a-z0-9]+)$/.exec(h)))return{view:'shift',shiftId:m[1]};
  if(h==='#stats')return{view:'stats'};
  if(h==='#settings')return{view:'settings'};
  if((m=/^#glossary(?:-([a-z]+))?$/.exec(h)))return{view:'glossary',gcat:CATS.some(c=>c.id===m[1])?m[1]:null};
  return{view:'home'};
}
function applyRoute(r){S.view=r.view;S.shiftId=r.shiftId||null;S.carId=r.carId||null;if(r.gcat)S.gcat=r.gcat;}
function navigate(view,a,b){
  let hash='';
  if(view==='shift'){if(S.shiftId!==a)S.carQuery='';S.view='shift';S.shiftId=a;S.carId=null;hash='shift-'+a;}
  else if(view==='car'){S.view='car';S.shiftId=a;S.carId=b;hash='car-'+a+'-'+b;}
  else if(view==='glossary'){S.view='glossary';S.shiftId=null;S.carId=null;if(a){S.gcat=a;S.gfilter='';}hash='glossary-'+S.gcat;}
  else if(view==='settings'){S.view='settings';S.shiftId=null;S.carId=null;hash='settings';}
  else if(view==='stats'){S.view='stats';S.shiftId=null;S.carId=null;hash='stats';}
  else{S.view='home';S.shiftId=null;S.carId=null;}
  try{location.hash=hash;}catch(_){}
  render();window.scrollTo(0,0);
}

