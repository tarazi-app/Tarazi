/* ---------- guide (first-run tour) ---------- */
const TOUR_KEY='tarazi.tour';
const TOUR_STEPS=[
  {t:()=>tx("Добро пожаловать в Tarazi"),d:()=>tx("Короткий гид покажет, что и где нажимать. Это займёт минуту. Пропустить можно в любой момент.")},
  {sel:'.sq--navy[data-act="shift-new"]',t:()=>tx("Новая смена"),d:()=>tx("Нажмите «+», чтобы создать смену: дата, тип смены и оператор автовесов.")},
  {sel:'.pills',t:()=>tx("Тип смены"),d:()=>tx("Здесь переключаются 1-дневные и 2-ночные смены.")},
  {sel:'.search',t:()=>tx("Поиск"),d:()=>tx("Найдите нужную смену по дате или по оператору.")},
  {sel:'[data-act="stats"]',t:()=>tx("Сводка"),d:()=>tx("Итоги за любой период и отчёты по водителю или маршруту.")},
  {sel:'[data-act="glossary"]',t:()=>tx("Справочник"),d:()=>tx("Маршруты, машины, водители, операторы и материалы. Выбирайте их из списка вместо ручного ввода.")},
  {sel:'[data-act="settings"]',t:()=>tx("Настройки"),d:()=>tx("Язык, тема, резервная копия. Здесь же можно снова запустить этот гид.")},
  {ic:'truck',t:()=>tx("Машины в смене"),d:()=>tx("Откройте смену и нажмите «Добавить машину». Для каждой машины создаётся свой бланк с рейсами.")},
  {ic:'scale',t:()=>tx("Взвешивание"),d:()=>tx("В бланке машины введите вес брутто и нажмите большую кнопку «+». Нетто посчитается само.")},
  {ic:'down',t:()=>tx("Отчёты"),d:()=>tx("Кнопка со стрелкой скачивает отчёт: PDF, PNG, Excel, CSV или TXT.")},
];
let tour=null;
function tourSeen(){try{return !!localStorage.getItem(TOUR_KEY);}catch(_){return true;}}
function tourMark(){try{localStorage.setItem(TOUR_KEY,'1');}catch(_){}}
function startTour(){
  endTour(true);
  if(S.view!=='home'||S.shiftId)navigate('home');
  const root=document.createElement('div');
  root.className='tour';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
  root.innerHTML='<div class="tour__spot"></div><div class="tour__card" tabindex="-1"></div>';
  document.body.appendChild(root);
  tour={root,i:0,spot:root.firstChild,card:root.lastChild};
  root.addEventListener('click',tourClick);
  window.addEventListener('resize',tourPlace);
  window.addEventListener('keydown',tourKey,true);
  tourShow();
}
function endTour(silent){
  if(!tour)return;
  window.removeEventListener('resize',tourPlace);
  window.removeEventListener('keydown',tourKey,true);
  tour.root.remove();tour=null;
  if(!silent)tourMark();
}
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
  const st=TOUR_STEPS[tour.i],n=TOUR_STEPS.length,last=tour.i===n-1;
  const dots=TOUR_STEPS.map((_,k)=>'<i'+(k===tour.i?' class="is-on"':'')+'></i>').join('');
  tour.card.innerHTML=(st.ic?'<span class="tile tour__ic">'+icon(st.ic)+'</span>':'')
    +'<h2>'+esc(st.t())+'</h2><p>'+esc(st.d())+'</p><div class="tour__dots" aria-hidden="true">'+dots+'</div>'
    +'<div class="tour__btns">'
    +(tour.i===0?'<button class="btn btn--ghost" data-tour="skip">'+esc(tx("Пропустить"))+'</button>':'<button class="btn btn--ghost" data-tour="prev">'+esc(tx("Назад"))+'</button>')
    +'<button class="btn btn--primary" data-tour="next">'+esc(last?tx("Готово"):tx("Далее"))+'</button></div>';
  const el=st.sel?document.querySelector('#app '+st.sel):null;
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
  const ch=card.offsetHeight,below=vh-r.bottom>=ch+24||r.top<ch+24;
  const top=below?Math.min(r.bottom+p+12,vh-ch-12):Math.max(r.top-p-12-ch,12);
  card.style.cssText='left:50%;top:'+top+'px;transform:translateX(-50%)';
}
function maybeStartTour(){
  if(S.tourChecked||!LANG||!isReady())return;
  S.tourChecked=true;
  if(tourSeen())return;
  if(Object.keys(S.shifts).length){tourMark();return;}
  setTimeout(startTour,350);
}
