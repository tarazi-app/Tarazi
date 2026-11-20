/* ---------- guide: a walkthrough on practice data ---------- */
const TOUR_KEY='tarazi.tour';
const dSid=()=>Object.keys(S.shifts)[0];
const dCar=()=>{const s=S.shifts[dSid()];return s&&s.cars[0];};
const dSet=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v;};
const TOUR_STEPS=[
  {t:()=>tx("Добро пожаловать в Tarazi"),d:()=>tx("Гид пройдёт по всему приложению на учебных данных: создадим смену, машину и рейс, скачаем отчёт. Ваши данные не затрагиваются. Нажимайте «Далее»."),go(){closeModal();navigate('home');}},
  {sel:'.sq--navy[data-act="shift-new"]',t:()=>tx("Новая смена"),d:()=>tx("Работа начинается со смены. Нажмите «+», откроется форма."),go(){closeModal();navigate('home');}},
  {sel:'#f-date',t:()=>tx("Дата и тип смены"),d:()=>tx("Выберите дату и тип: 1-ночная или 2-дневная. По умолчанию подставляется сегодняшний день."),go(){openShiftForm(null);}},
  {sel:'#f-operator',t:()=>tx("Оператор"),d:()=>tx("Оператор выбирается из справочника. Нужного нет? Нажмите «+ Новый оператор» над списком и впишите имя."),go(){dSet('f-operator',S.glossary.operators[0].name);}},
  {sel:'.dlg-actions .btn--primary',t:()=>tx("Создать смену"),d:()=>tx("Нажмите «Создать смену». Дальше откроется экран этой смены.")},
  {sel:'.shiftcard',t:()=>tx("Экран смены"),d:()=>tx("Сверху дата, оператор и итоги: сколько машин, рейсов и общий вес нетто."),go(){const f=document.getElementById('dlg-form');if(S.modal&&f)S.modal.submit(f);}},
  {sel:'.shiftcard__st',t:()=>tx("Статус смены"),d:()=>tx("Когда смена закончена, нажмите «Закрыть смену», позже её можно открыть снова. Карандаш меняет дату, тип и оператора.")},
  {sel:'.sq--navy[data-act="car-new"]',t:()=>tx("Добавить машину"),d:()=>tx("Для каждой машины создаётся свой бланк. Нажмите «+» вверху, чтобы добавить машину.")},
  {sel:'#f-plate',t:()=>tx("Номер машины"),d:()=>tx("Номер выбирается из справочника или добавляется новый. Если машина уже ездила, остальные поля подставятся сами."),go(){openCarForm();dSet('f-plate',S.glossary.vehicles[0].name);dSet('f-driver',S.glossary.drivers[0].name);dSet('f-tare','17250');dSet('f-route',S.glossary.routes[0].name);dSet('f-material',S.glossary.materials[0].name);}},
  {sel:'#f-tare',t:()=>tx("Вес тары"),d:()=>tx("Тара — вес пустой машины в килограммах. Нетто считается как брутто минус тара.")},
  {sel:'#f-route',t:()=>tx("Маршрут и материал"),d:()=>tx("Маршрут и материал тоже выбираются из справочника. Цвет карточки помогает находить машину в списке.")},
  {sel:'.dlg-actions .btn--primary',t:()=>tx("Создать бланк"),d:()=>tx("Нажмите «Создать бланк», и машина появится в смене.")},
  {sel:'.ccard',t:()=>tx("Карточка машины"),d:()=>tx("Нажмите на карточку, чтобы открыть бланк машины. Когда машин много, их можно показать списком или сеткой."),go(){const f=document.getElementById('dlg-form');if(S.modal&&f)S.modal.submit(f);}},
  {sel:'.carcard',t:()=>tx("Бланк машины"),d:()=>tx("Здесь водитель, маршрут, тара и общий вес нетто по всем рейсам."),go(){navigate('car',dSid(),dCar().id);}},
  {sel:'#w-gross',t:()=>tx("Вес брутто"),d:()=>tx("После взвешивания введите вес брутто в килограммах."),go(){S.drafts[dCar().id]='41250';render();}},
  {sel:'#w-calc',t:()=>tx("Нетто сразу видно"),d:()=>tx("Приложение показывает нетто рейса до записи. Если вес сильно отличается от обычного, оно предупредит о возможной ошибке.")},
  {sel:'#w-time',t:()=>tx("Время"),d:()=>tx("Время подставляется текущее. Поправить можно цифрами: 726 превратится в 07:26.")},
  {sel:'#w-add',t:()=>tx("Записать рейс"),d:()=>tx("Нажмите большую кнопку «+», и рейс запишется.")},
  {sel:'.trips',t:()=>tx("Рейсы"),d:()=>tx("Рейс в таблице, внизу итог. Карандаш исправляет рейс, корзина удаляет."),go(){addTrip(dCar().id);}},
  {sel:'[data-act="car-report"]',t:()=>tx("Отчёт по машине"),d:()=>tx("Кнопка со стрелкой скачивает отчёт по этой машине.")},
  {sel:'.xgrid',t:()=>tx("Форматы отчёта"),d:()=>tx("Выберите PDF для печати, PNG для мессенджера, Excel, CSV или TXT."),go(){handle('car-report',{dataset:{car:dCar().id}});}},
  {sel:'[data-act="shift-report"]',t:()=>tx("Отчёт по смене"),d:()=>tx("Общий расчёт за всю смену, с итогами по материалам, скачивается так же."),go(){closeModal();navigate('shift',dSid());}},
  {sel:'.scard',t:()=>tx("Список смен"),d:()=>tx("Все смены на главном экране. Вкладки делят их на дневные и ночные, а поиск находит смену по дате или оператору."),go(){navigate('home');}},
  {sel:'.range',t:()=>tx("Сводка за период"),d:()=>tx("Выберите период и скачайте итоги. Ниже есть отчёт по водителю или маршруту."),go(){navigate('stats');}},
  {sel:'.tabs',t:()=>tx("Справочник"),d:()=>tx("Маршруты, машины, водители, операторы и материалы. Впишите значение и нажмите «Добавить». Карандаш меняет его, корзина удаляет."),go(){navigate('glossary');}},
  {sel:'[role="radiogroup"]',t:()=>tx("Язык и тема"),d:()=>tx("Язык можно сменить в любой момент, тему тоже: светлая, тёмная или как в системе."),go(){navigate('settings');}},
  {sel:'[data-act="backup"]',t:()=>tx("Резервная копия"),d:()=>tx("Раз в неделю скачивайте копию данных. Если телефон потеряется или данные пропадут, их можно вернуть из файла. Приложение ещё само хранит последние автокопии.")},
  {sel:'[data-act="tour-start"]',t:()=>tx("Гид"),d:()=>tx("Если что-то забудете, запустите гид здесь снова.")},
  {t:()=>tx("Готово!"),d:()=>tx("Учебные данные удалятся, ваши остались на месте. Нажмите «+» и создайте первую смену."),go(){navigate('home');}},
];
let tour=null;
function tourSeen(){try{return !!localStorage.getItem(TOUR_KEY);}catch(_){return true;}}
function tourMark(){try{localStorage.setItem(TOUR_KEY,'1');}catch(_){}}
function demoReset(){
  closeModal();
  const g=emptyGloss();
  g.operators.push({id:uid('g'),name:'Петров Пётр Петрович'});
  g.vehicles.push({id:uid('g'),name:'123ABC02'});
  g.drivers.push({id:uid('g'),name:'Иванов Иван Иванович'});
  g.routes.push({id:uid('g'),name:'Карьер → Завод'});
  g.materials.push({id:uid('g'),name:'Щебень 5–20'});
  S.shifts={};S.glossary=g;S.drafts={};S.search='';S.carQuery='';
}
function startTour(){
  endTour(true);
  tour={i:0,real:{shifts:S.shifts,glossary:S.glossary,drafts:S.drafts,homeType:S.homeType,search:S.search,carQuery:S.carQuery}};
  S.demo=true;
  const root=document.createElement('div');
  root.className='tour';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
  root.innerHTML='<div class="tour__spot"></div><div class="tour__card" tabindex="-1"></div>';
  document.body.appendChild(root);
  tour.root=root;tour.spot=root.firstChild;tour.card=root.lastChild;
  root.addEventListener('click',tourClick);
  window.addEventListener('resize',tourPlace);
  window.addEventListener('keydown',tourKey,true);
  window.addEventListener('hashchange',tourHash);
  tourShow();
}
function endTour(silent){
  if(!tour)return;
  window.removeEventListener('resize',tourPlace);
  window.removeEventListener('keydown',tourKey,true);
  window.removeEventListener('hashchange',tourHash);
  tour.root.remove();
  const r=tour.real;tour=null;
  closeModal();
  S.shifts=r.shifts;S.glossary=r.glossary;S.drafts=r.drafts;S.homeType=r.homeType;S.search=r.search;S.carQuery=r.carQuery;
  S.demo=false;
  $toast.hidden=true;
  if(!silent){tourMark();navigate('home');}
}
function tourHash(){if(tour&&location.hash!==tour.hash)setTimeout(()=>{if(tour&&location.hash!==tour.hash)tourShow();},0);}
function tourKey(e){
  if(!tour)return;
  if(e.key==='Escape'){e.preventDefault();endTour();}
  else if(e.key==='ArrowRight'||e.key==='Enter'){e.preventDefault();tourNext();}
  else if(e.key==='ArrowLeft'){e.preventDefault();tourPrev();}
}
function tourNext(){if(!tour)return;if(tour.i>=TOUR_STEPS.length-1){endTour();return;}tour.i++;tourShow();}
function tourPrev(){if(tour&&tour.i>0){tour.i--;tourShow();}}
function tourClick(e){
  const b=e.target.closest('[data-tour]');if(!b)return;
  const a=b.dataset.tour;
  if(a==='next')tourNext();else if(a==='prev')tourPrev();else if(a==='skip')endTour();
}
function tourShow(){
  // Строим состояние заново: учебные данные с нуля и все шаги до текущего.
  demoReset();navigate('home');
  for(let k=0;k<=tour.i;k++){const g=TOUR_STEPS[k].go;if(g){try{g();}catch(_){}}}
  tour.hash=location.hash;
  $toast.hidden=true;
  const st=TOUR_STEPS[tour.i],n=TOUR_STEPS.length,last=tour.i===n-1;
  tour.card.innerHTML='<div class="tour__bar"><i style="width:'+Math.round((tour.i+1)/n*100)+'%"></i></div>'
    +'<div class="tour__n">'+(tour.i+1)+' / '+n+'</div>'
    +'<h2>'+esc(st.t())+'</h2><p>'+esc(st.d())+'</p>'
    +'<div class="tour__btns">'
    +(tour.i===0?'<button class="btn btn--ghost" data-tour="skip">'+esc(tx("Пропустить"))+'</button>':'<button class="btn btn--ghost" data-tour="prev">'+esc(tx("Назад"))+'</button>')
    +(tour.i>0&&!last?'<button class="btn btn--ghost" data-tour="skip">'+esc(tx("Закрыть"))+'</button>':'')
    +'<button class="btn btn--primary" data-tour="next">'+esc(last?tx("Готово"):tx("Далее"))+'</button></div>';
  let el=st.sel?document.querySelector(st.sel):null;
  if(el&&el.matches&&el.matches('input,select'))el=el.closest('.field')||el;
  tour.target=el||null;
  if(el)el.scrollIntoView({block:'center'});
  tourPlace();
  try{tour.card.focus({preventScroll:true});}catch(_){}
}
function tourPlace(){
  if(!tour)return;
  const el=tour.target,sp=tour.spot,card=tour.card,vw=innerWidth,vh=innerHeight;
  if(!el){
    sp.style.cssText='left:50%;top:50%;width:0;height:0';
    card.style.cssText='left:50%;top:50%;transform:translate(-50%,-50%)';
    return;
  }
  const r=el.getBoundingClientRect(),p=6;
  sp.style.cssText='left:'+(r.left-p)+'px;top:'+(r.top-p)+'px;width:'+(r.width+2*p)+'px;height:'+(r.height+2*p)+'px';
  const ch=card.offsetHeight,gap=p+12;
  const spaceBelow=vh-r.bottom-gap,spaceAbove=r.top-gap;
  let top;
  if(spaceBelow>=ch)top=r.bottom+gap;
  else if(spaceAbove>=ch)top=r.top-gap-ch;
  else top=spaceBelow>=spaceAbove?Math.min(r.bottom+gap,vh-ch-8):Math.max(8,r.top-gap-ch);
  top=Math.max(8,Math.min(top,vh-ch-8));
  card.style.cssText='left:50%;top:'+top+'px;transform:translateX(-50%)';
}
function maybeStartTour(){
  if(S.tourChecked||!LANG||!isReady())return;
  S.tourChecked=true;
  if(tourSeen())return;
  if(Object.keys(S.shifts).length){tourMark();return;}
  setTimeout(startTour,350);
}
