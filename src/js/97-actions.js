/* ---------- actions ---------- */
function addTrip(carId){
  const sh=S.shifts[S.shiftId];if(!sh)return;
  const car=sh.cars.find(c=>c.id===carId);if(!car)return;
  const g=parseNum(S.drafts[carId]);
  if(isNaN(g)||g<=0){toast(tx("Введите вес брутто числом, например 41250"),'err');const el=document.getElementById('w-gross');if(el)el.focus();return;}
  const tv=S.drafts['t-'+carId];
  let time=nowHM();
  if(tv){time=normTime(tv);if(!time){toast(tx("Введите время цифрами, например 14:35"),'err');const el=document.getElementById('w-time');if(el)el.focus();return;}}
  const ref=g>=car.tare?grossAnomaly(car,g):0;
  if(ref){
    openConfirm({title:tx('Проверьте вес'),confirmLabel:tx('Записать'),safe:true,
      text:tx('Обычно около {r} кг, а вы ввели {g} кг. Записать рейс?',{r:fmt(ref,0),g:fmt(g,0)}),
      onConfirm(){commitTrip(carId,g,time);}});
    return;
  }
  commitTrip(carId,g,time);
}
function commitTrip(carId,g,time){
  const sh=S.shifts[S.shiftId];if(!sh)return;
  const car=sh.cars.find(c=>c.id===carId);if(!car)return;
  S.drafts[carId]='';delete S.drafts['t-'+carId];S.focusId='w-gross';
  mutateShift(sh.id,s=>{s.cars.find(c=>c.id===carId).trips.push({id:uid('t'),time,gross:g});});
  if(g<car.tare)toast(tx("Брутто меньше тары. Проверьте вес."),'err');
  else toast(tx("Рейс записан: нетто ")+fmt(r2(g-car.tare))+tx(" кг"));
}
function setRange(kind){
  const d=new Date();
  if(kind==='all'){S.sFrom='';S.sTo='';}
  else if(kind==='week'){const f=new Date(d.getFullYear(),d.getMonth(),d.getDate()-6);S.sFrom=f.getFullYear()+'-'+pad(f.getMonth()+1)+'-'+pad(f.getDate());S.sTo=todayISO();}
  else{S.sFrom=monthStart();S.sTo='';}
  render();
}
function handle(act,b){
  const sh=S.shifts[S.shiftId];
  switch(act){
    case 'home':navigate('home');break;
    case 'htype':S.homeType=b.dataset.type==='night'?'night':'day';render();break;
    case 'theme':{
      S.theme=S.theme==='light'?'dark':S.theme==='dark'?'auto':'light';
      try{localStorage.setItem(TKEY,S.theme);}catch(_){}
      applyTheme();render();toast(tx("Тема: ")+THEME_NAME[S.theme]);break;}
    case 'shift-copy':if(sh)openShiftForm(null,sh.id);break;
    case 'carview':S.carView=b.dataset.view==='grid'?'grid':'list';try{localStorage.setItem('tarazi.carView',S.carView);}catch(_){}render();break;
    case 'glossary':navigate('glossary');break;
    case 'stats':navigate('stats');break;
    case 'settings':navigate('settings');break;
    case 'reload-app':try{location.reload();}catch(_){}break;
    case 'snap-restore':{
      const t=Number(b.dataset.t),x=S.snaps.find(y=>y.t===t);if(!x)break;
      openConfirm({title:tx('Восстановить автокопию?'),confirmLabel:tx('Восстановить'),safe:true,
        text:tx('Текущие данные будут заменены данными из копии от {d} (смен: {n}). Перед этим текущее состояние тоже сохранится как автокопия.',{d:stampOf(t),n:x.n}),
        onConfirm(){restoreSnap(t);}});
      break;}
    case 'setlang':setLang(b.dataset.lang);break;
    case 'settheme':{const v=b.dataset.theme;if(v==='light'||v==='dark'||v==='auto'){S.theme=v;try{localStorage.setItem(TKEY,v);}catch(_){}applyTheme();render();}break;}
    case 'range':setRange(b.dataset.range);break;
    case 'entity-report':{
      const list=periodShifts(),E=entCurrent(list);if(!E.name)break;
      const sub=(E.kind==='route'?tx('Маршрут'):tx('Водитель'))+': '+E.name+' · '+(S.sFrom?dateRu(S.sFrom):tx('начало'))+' — '+(S.sTo?dateRu(S.sTo):tx('сегодня'));
      openExport({sub,base:safeName(tx('Отчёт_')+E.name+'_'+(S.sFrom||'')+'_'+(S.sTo||todayISO())),doc:()=>entityDoc(list,E.kind,E.name),csv:()=>docToCsv(entityDoc(list,E.kind,E.name))});
      break;}
    case 'stats-report':{
      const list=periodShifts();
      openExport({sub:tx("Сводка за период: ")+(S.sFrom?dateRu(S.sFrom):tx("начало"))+' — '+(S.sTo?dateRu(S.sTo):tx("сегодня")),
        base:safeName(tx("Сводка_")+(S.sFrom||tx("начало"))+'_'+(S.sTo||todayISO())),doc:()=>periodDoc(list),csv:()=>periodCsv(list)});
      break;}
    case 'backup-load':{const i=document.getElementById('backup-file');if(i)i.click();break;}
    case 'backup':try{localStorage.setItem('tarazi.lastBackup',String(Date.now()));}catch(_){}render();saveFile('avtovesy_backup_'+todayISO()+'.json',JSON.stringify({exportedAt:new Date().toISOString(),shifts:Object.values(S.shifts).sort(newestFirst),glossary:S.glossary},null,2),false);break;
    case 'gtab':navigate('glossary',b.dataset.cat);break;
    case 'open':navigate('shift',b.dataset.id);break;
    case 'open-car':if(sh)navigate('car',sh.id,b.dataset.car);break;
    case 'back-shift':if(sh)navigate('shift',sh.id);else navigate('home');break;
    case 'shift-new':openShiftForm(null);break;
    case 'shift-edit':if(sh)openShiftForm(sh.id);break;
    case 'shift-toggle':if(sh){const open=sh.status==='active';mutateShift(sh.id,s=>{s.status=open?'closed':'active';});toast(open?tx("Смена закрыта"):tx("Смена снова активна"));}break;
    case 'shift-delete':{
      const s=S.shifts[b.dataset.id];if(!s)break;const t=shiftStats(s);
      openConfirm({title:tx("Удалить смену?"),confirmLabel:tx("Удалить смену"),
        text:tx('Смена «{n}» за {d} будет удалена вместе с машинами ({c}) и рейсами ({r}). Это действие нельзя отменить.',{n:shiftName(s),d:dateLong(s.date),c:t.cars,r:t.trips}),
        onConfirm(){delete S.shifts[s.id];persistDelete(s.id);if(S.shiftId===s.id)navigate('home');else render();toast(tx("Смена удалена"));}});
      break;}
    case 'car-new':openCarForm(null);break;
    case 'car-edit':openCarForm(b.dataset.car);break;
    case 'cars-copy':{
      if(!sh)break;const prev=prevShift(sh);if(!prev)break;
      const fresh=prev.cars.filter(c=>!sh.cars.some(x=>sameName(x.plate,c.plate)));
      if(!fresh.length){toast(tx("Все машины из прошлой смены уже добавлены"),'err');break;}
      openConfirm({title:tx("Копировать машины?"),confirmLabel:tx("Копировать"),safe:true,
        text:tx('Из смены «{n}» за {d} будет добавлено машин: {k}. Копируются номер, водитель, маршрут, материал, тара и цвет. Рейсы не копируются, время прибытия ставится текущее.',{n:shiftName(prev),d:dateLong(prev.date),k:fresh.length}),
        onConfirm(){const t=nowHM();mutateShift(sh.id,s=>{fresh.forEach(c=>s.cars.push({id:uid('c'),plate:c.plate,driver:c.driver,route:c.route,material:c.material,tare:c.tare,color:c.color,arrival:t,trips:[]}));});toast(tx("Добавлено машин: ")+fresh.length);}});
      break;}
    case 'car-delete':{
      if(!sh)break;const c=sh.cars.find(x=>x.id===b.dataset.car);if(!c)break;
      openConfirm({title:tx("Удалить машину?"),confirmLabel:tx("Удалить машину"),
        text:tx('Бланк {p} ({d}) будет удалён вместе с рейсами: {k}. Это действие нельзя отменить.',{p:c.plate,d:c.driver,k:c.trips.length}),
        onConfirm(){navigate('shift',sh.id);mutateShift(sh.id,s=>{s.cars=s.cars.filter(x=>x.id!==c.id);});toast(tx("Машина удалена"));}});
      break;}
    case 'trip-add':addTrip(b.dataset.car);break;
    case 'trip-edit':openTripForm(b.dataset.trip);break;
    case 'trip-delete':{
      const c=currentCar();if(!sh||!c)break;const idx=c.trips.findIndex(x=>x.id===b.dataset.trip);if(idx<0)break;
      const tid=b.dataset.trip;
      openConfirm({title:tx("Удалить рейс?"),confirmLabel:tx("Удалить рейс"),
        text:tx('Рейс {i} машины {p} (брутто {g} кг) будет удалён.',{i:idx+1,p:c.plate,g:fmt(c.trips[idx].gross)}),
        onConfirm(){mutateShift(sh.id,s=>{const cc=s.cars.find(x=>x.id===c.id);cc.trips=cc.trips.filter(x=>x.id!==tid);});toast(tx("Рейс удалён"));}});
      break;}
    case 'car-report':{
      if(!sh)break;const c=sh.cars.find(x=>x.id===b.dataset.car);if(!c)break;
      openExport({sub:tx("Машина ")+c.plate+' · '+dateRu(sh.date)+' · '+shiftName(sh),base:safeName(tx("Отчёт_")+c.plate+'_'+sh.date+'_'+shiftName(sh)),doc:()=>carDoc(sh,c),csv:()=>carReportCsv(sh,c)});break;}
    case 'shift-report':
      if(sh)openExport({sub:tx("Общий расчёт за смену: ")+dateRu(sh.date)+' · '+shiftName(sh),base:safeName(tx("Общий-расчёт_")+sh.date+'_'+shiftName(sh)),doc:()=>shiftDoc(sh),csv:()=>shiftReportCsv(sh)});break;
    case 'gloss-add':{
      const key='g-'+S.gcat,name=cleanName(S.gcat,S.drafts[key]);
      if(!name){toast(tx("Введите значение"),'err');const el=document.getElementById('gnew');if(el)el.focus();break;}
      if(glossFind(S.gcat,name)){toast(tx("Такое значение уже есть"),'err');break;}
      glossAdd(S.gcat,name);S.drafts[key]='';S.gfilter='';S.focusId='gnew';render();toast(tx("Добавлено: ")+name);
      break;}
    case 'gloss-edit':openGlossEdit(S.gcat,b.dataset.id);break;
    case 'gloss-delete':{
      const it=S.glossary[S.gcat].find(x=>x.id===b.dataset.id);if(!it)break;
      const cat=S.gcat,n=usageCount(cat,it.name);
      openConfirm({title:tx("Удалить из справочника?"),confirmLabel:tx("Удалить"),
        text:tx('«{n}» будет удалено из справочника.',{n:it.name})+(n?' '+tx('Значение используется в сменах ({k}), там оно останется без изменений.',{k:n}):''),
        onConfirm(){S.glossary[cat]=S.glossary[cat].filter(x=>x.id!==it.id);persistGlossary();render();toast(tx("Удалено из справочника"));}});
      break;}
    case 'gloss-import':{
      const miss=missingFromShifts();if(!miss.length)break;
      miss.forEach(m=>S.glossary[m.cat].push({id:uid('g'),name:m.name}));
      persistGlossary();render();toast(tx("Добавлено значений: ")+miss.length);
      break;}
  }
}

