/* ---------- views ---------- */
const IS_NATIVE=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
const IS_STANDALONE=(()=>{try{return !!(window.navigator.standalone||(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches));}catch(e){return false;}})();
const IS_IOS=/iphone|ipad|ipod/i.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function note(){
  if(S.updateReady)return '<div class="hint"><span>'+esc(tx('Доступна новая версия Tarazi.'))+'</span><button class="btn btn--sm btn--primary" data-act="reload-app">'+esc(tx('Обновить'))+'</button></div>';
  if(window.__PWA&&IS_IOS&&!IS_STANDALONE)return '<p class="note">'+esc(tx('Чтобы установить приложение на iPhone: нажмите «Поделиться» в Safari и выберите «На экран Домой».'))+'</p>';
  if(IS_STANDALONE||IS_NATIVE)return '';
  return S.mode==='local'?tx("<p class=\"note\">Общее хранилище недоступно. Данные сохраняются только в этом браузере.</p>"):'';
}
const appbar=(l,r)=>`<header class="appbar"><div class="appbar__l">${l}</div><div class="appbar__r">${r}</div></header>`;
const sq=(act,ic,label,extra,cls)=>`<button class="sq${cls?' '+cls:''}" data-act="${act}"${extra||''} aria-label="${esc(label)}">${icon(ic)}</button>`;
const THEME_NAME={get light(){return tx("светлая");},get dark(){return tx("тёмная");},get auto(){return tx("как в системе");}};
function themeBtn(){return sq('theme',S.theme==='light'?'sun':S.theme==='dark'?'moon':'contrast',tx("Тема: ")+THEME_NAME[S.theme]+tx(". Нажмите, чтобы сменить"));}

function viewHome(){
  const q=S.search.trim().toLowerCase();
  const all=Object.values(S.shifts);
  const list=all.filter(sh=>sh.type===S.homeType)
    .filter(sh=>!q||[dateLong(sh.date),dateRu(sh.date),sh.date,shiftName(sh),sh.operator].join(' ').toLowerCase().includes(q))
    .sort(newestFirst);
  const cards=list.map(sh=>{
    const t=shiftStats(sh),open=sh.status==='active';
    return `<a class="card scard" href="#shift-${esc(sh.id)}" data-act="open" data-id="${esc(sh.id)}">
      <div class="scard__top"><span class="tile">${icon('cal')}</span>
        <div class="scard__main"><div class="scard__date">${esc(dateLong(sh.date))}</div><div class="scard__sub">${esc(shiftName(sh))}</div></div>
        <span class="badge${open?' badge--ok':''}">${open?tx("Активна"):tx("Закрыта")}</span></div>
      <div class="scard__foot"><span>${icon('user','ic--sm')}${esc(sh.operator)}</span><span>${icon('truck','ic--sm')}${t.cars} ${plural(t.cars,[tx("машина"),tx("машины"),tx("машин")])}</span><span>${icon('box','ic--sm')}${fmt(t.net/1000,1)} ${tx("т")}</span></div>
    </a>`;}).join('');
  let body;
  if(!all.length)body=`<div class="empty"><p>${tx("Смен пока нет. Создайте проект на смену: дата, смена и оператор автовесов.")}</p><button class="btn btn--primary" data-act="shift-new">${icon('plus','ic--sm')}${tx("Создать смену")}</button></div>`;
  else if(!list.length)body=`<div class="empty"><p>${q?tx("Ничего не найдено."):tx("В этой категории смен пока нет.")}</p></div>`;
  else body=`<section class="scards" aria-label="${tx("Список смен")}">${cards}</section>`;
  return appbar(`<span class="tile logo-tile">${icon('scale')}</span><span class="logo">Tarazi</span>`,
      sq('stats','chart',tx("Сводка за период"))+sq('glossary','book',tx("Справочник"))+sq('settings','gear',tx("Настройки"))+sq('shift-new','plus',tx("Новая смена"),'','sq--navy'))
    +note()
    +(backupDue()?`<div class="hint"><span>${tx('Давно не было резервной копии. Сохраните её, чтобы не потерять данные.')}</span><button class="btn btn--sm" data-act="backup">${tx('Сохранить копию')}</button></div>`:'')
    +`<div class="pills" role="tablist" aria-label="${tx("Тип смены")}">
      <button class="pill${S.homeType==='day'?' is-on':''}" role="tab" aria-selected="${S.homeType==='day'}" data-act="htype" data-type="day">${icon('sun','ic--sm')}${tx("1-дневная")}</button>
      <button class="pill${S.homeType==='night'?' is-on':''}" role="tab" aria-selected="${S.homeType==='night'}" data-act="htype" data-type="night">${icon('moon','ic--sm')}${tx("2-ночная")}</button></div>
    <div class="search">${icon('search')}<input class="inp" id="hsearch" type="search" placeholder="${tx("Поиск по дате или оператору…")}" value="${esc(S.search)}" data-search="1" autocomplete="off" aria-label="${tx("Поиск по дате или оператору")}"></div>
    ${body}`;
}

function summaryHtml(sh){
  if(!sh.cars.length)return tx("<p class=\"lead\">Добавьте машины, и здесь появится общий расчёт.</p>");
  const tot=shiftStats(sh);
  const rows=sh.cars.map((c,i)=>{const s=carStats(c);
    return `<tr><td>${i+1}</td><td class="mono"><span class="dot" style="background:${colorHex(c.color)}"></span>${esc(c.plate)}</td><td>${esc(c.driver)}</td><td>${esc(c.route)}</td><td>${esc(c.material)}</td><td class="r mono">${s.n}</td><td class="r mono net${s.net<0?' is-bad':''}">${fmt(s.net)}</td></tr>`;}).join('');
  const mats=materialStats(sh).map(m=>`<tr><td>${esc(m.name)}</td><td class="r mono">${m.cars}</td><td class="r mono">${m.trips}</td><td class="r mono net">${fmt(m.net)}</td></tr>`).join('');
  return `<div class="box scroll"><table class="tbl tbl--sum tbl--stack"><thead><tr><th>№</th><th>${tx("Машина")}</th><th>${tx("Водитель")}</th><th>${tx("Маршрут")}</th><th>${tx("Материал")}</th><th class="r">${tx("Рейсов")}</th><th class="r">${tx("Нетто, кг")}</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="5">${tx("Итого за смену")}</td><td class="r mono">${tot.trips}</td><td class="r mono net">${fmt(tot.net)}</td></tr></tfoot></table></div>
    <h3>${tx("По материалам")}</h3>
    <div class="box scroll"><table class="tbl tbl--stack"><thead><tr><th>${tx("Материал")}</th><th class="r">${tx("Машин")}</th><th class="r">${tx("Рейсов")}</th><th class="r">${tx("Нетто, кг")}</th></tr></thead><tbody>${mats}</tbody></table></div>`;
}
function carCard(sh,c){
  const s=carStats(c),hex=colorHex(c.color);
  return `<a class="ccard" id="car-${esc(c.id)}" style="border-left-color:${hex}" href="#car-${esc(sh.id)}-${esc(c.id)}" data-act="open-car" data-car="${esc(c.id)}">
    <div class="ccard__top"><span class="tile tile--car" style="background:${hex}">${icon('truck')}</span>
      <div class="ccard__id"><div class="ccard__line"><span class="ccard__name">${esc(plateLabel(c.plate))}</span><span class="ccard__route">${esc(c.route)}</span></div>
        <div class="ccard__driver">${esc(c.driver)}</div></div></div>
    <div class="ccard__net"><span class="muted">${tx("Итого НЕТТО")}</span><b class="mono${s.net<0?' is-bad':''}">${fmt(s.net)} ${tx("кг")}</b></div>
    <div class="ccard__foot"><span class="chip">${s.n} ${plural(s.n,[tx("рейс"),tx("рейса"),tx("рейсов")])}</span></div>
  </a>`;
}
function viewShift(sh){
  const t=shiftStats(sh),open=sh.status==='active',prev=prevShift(sh);
  const cq=S.carQuery.trim().toLowerCase();
  const vis=cq?sh.cars.filter(c=>[c.driver,c.plate,c.route,c.material].join(' ').toLowerCase().includes(cq)):sh.cars;
  const groups=new Map();
  vis.forEach(c=>{const k=c.route||tx("Без маршрута");if(!groups.has(k))groups.set(k,[]);groups.get(k).push(c);});
  const carsHtml=[...groups].map(([route,cars])=>`<div class="rgroup">${icon('pin')}<span>${esc(route)}</span><span class="chip">${cars.length} ${tx("маш.")}</span></div>${S.carView==='grid'?`<div class="cgrid">${cars.map(c=>carCard(sh,c)).join('')}</div>`:cars.map(c=>carCard(sh,c)).join('')}`).join('');
  const copyBtn=prev?`<button class="btn btn--ghost btn--sm" data-act="cars-copy">${icon('copy','ic--sm')}${tx("Копировать из прошлой смены")}</button>`:'';
  let list;
  if(!sh.cars.length)list=`<div class="empty"><p>${tx("В этой смене пока нет машин. Для каждой машины создаётся свой бланк.")}</p><div class="row-btns"><button class="btn btn--primary" data-act="car-new">${icon('plus','ic--sm')}${tx("Добавить машину")}</button>${prev?`<button class="btn" data-act="cars-copy">${icon('copy','ic--sm')}${tx("Копировать из прошлой смены")}</button>`:''}</div></div>`;
  else if(!vis.length)list=tx("<div class=\"empty\"><p>Ничего не найдено.</p></div>");
  else list=carsHtml;
  return appbar(sq('home','back',tx("Все смены"),'','sq--ghost'),sq('shift-report','down',tx("Скачать общий расчёт"))+sq('car-new','plus',tx("Добавить машину"),'','sq--navy'))
    +note()
    +`<section class="card shiftcard">
      <div class="shiftcard__top"><span class="tile">${icon('cal')}</span><div><h1>${esc(dateLong(sh.date))}</h1><div class="muted" style="font-size:15px">${esc(shiftName(sh))}</div></div></div>
      <div class="shiftcard__st"><span class="badge${open?' badge--ok':''}">${open?tx("Активна"):tx("Закрыта")}</span><button class="ibtn" data-act="shift-edit" aria-label="${tx("Изменить смену")}">${icon('edit','ic--sm')}</button><button class="btn btn--sm" data-act="shift-toggle">${open?tx("Закрыть смену"):tx("Открыть снова")}</button></div>
      <div class="shiftcard__row">${icon('user')}<span>${tx("Оператор:")} ${esc(sh.operator)}</span></div>
      <div class="tiles">
        <div class="tcell">${icon('truck')}<div class="tcell__v">${t.cars}</div><div class="tcell__l">${plural(t.cars,[tx("Машина"),tx("Машины"),tx("Машин")])}</div></div>
        <div class="tcell">${icon('scale')}<div class="tcell__v">${t.trips}</div><div class="tcell__l">${plural(t.trips,[tx("Рейс"),tx("Рейса"),tx("Рейсов")])}</div></div>
        <div class="tcell">${icon('box')}<div class="tcell__v mono">${fmt(t.net)}</div><div class="tcell__l">${tx("кг НЕТТО")}</div></div>
      </div>
      <div class="shiftcard__acts"><button class="btn btn--sm" data-act="shift-copy">${icon('copy','ic--sm')}${tx("Создать копию смены")}</button></div></section>
    <div class="sect"><h2>${tx('Машины')} (${t.cars})</h2><div class="sect__r">${sh.cars.length?copyBtn:''}${sh.cars.length>1?`<div class="viewtog" role="group" aria-label="${tx('Вид списка')}"><button class="ibtn${S.carView==='list'?' is-on':''}" data-act="carview" data-view="list" aria-pressed="${S.carView==='list'}" aria-label="${tx('Список')}">${icon('list','ic--sm')}</button><button class="ibtn${S.carView==='grid'?' is-on':''}" data-act="carview" data-view="grid" aria-pressed="${S.carView==='grid'}" aria-label="${tx('Сетка')}">${icon('grid','ic--sm')}</button></div>`:''}</div></div>
    ${sh.cars.length>=5?`<div class="search" style="margin-top:0">${icon('search')}<input class="inp" id="csearch" type="search" placeholder="${tx("Найти машину, водителя, маршрут…")}" value="${esc(S.carQuery)}" data-csearch="1" autocomplete="off" aria-label="${tx("Поиск машины")}"></div>`:''}
    ${list}
    <section class="summary"><h2>${tx("Общий расчёт за смену")}</h2><div>${summaryHtml(sh)}</div></section>`;
}

function medianOf(a){const v=a.slice().sort((x,y)=>x-y),m=v.length>>1;return v.length%2?v[m]:(v[m-1]+v[m])/2;}
function refGross(car){
  const arr=car.trips.map(t=>t.gross);
  if(arr.length<3){
    const list=Object.values(S.shifts).sort(newestFirst);
    outer:for(const sh of list){for(const c of sh.cars){if(c.id===car.id||!sameName(c.plate,car.plate))continue;for(const t of c.trips){arr.push(t.gross);if(arr.length>=6)break outer;}}}
  }
  return arr.length?medianOf(arr):0;
}
function grossAnomaly(car,g){const ref=refGross(car);return ref&&Math.abs(g-ref)/ref>0.2?ref:0;}
function calcHtml(car,raw){
  const g=parseNum(raw);
  if(isNaN(g)||g<=0)return '';
  const n=r2(g-car.tare);
  const ref=n>=0?grossAnomaly(car,g):0;
  return `<span class="calc__label">${tx("НЕТТО:")}</span><span class="calc__val mono${n<0?' is-bad':''}">${fmt(n)} ${tx("кг")}</span>${n<0?tx("<span class=\"calc__warn\">Брутто меньше тары. Проверьте вес.</span>"):''}${ref?`<span class="calc__warn">${esc(tx('Обычно около {r} кг. Проверьте вес.',{r:fmt(ref,0)}))}</span>`:''}`;
}
function viewCar(sh,c){
  const s=carStats(c),hex=colorHex(c.color);
  const trips=c.trips.map((t,i)=>({t,i})).reverse().map(({t,i})=>{
    const net=r2(t.gross-c.tare);
    return `<tr>
      <td class="mono">${i+1}</td><td class="mono">${esc(t.time)}</td><td class="mono">${fmt(t.gross)}</td>
      <td class="r mono net${net<0?' is-bad':''}">${fmt(net)}</td>
      <td class="acts"><button class="ibtn" data-act="trip-edit" data-trip="${esc(t.id)}" aria-label="${tx("Изменить рейс")} ${i+1}">${icon('edit','ic--sm')}</button><button class="ibtn ibtn--danger" data-act="trip-delete" data-trip="${esc(t.id)}" aria-label="${tx("Удалить рейс")} ${i+1}">${icon('trash','ic--sm')}</button></td>
    </tr>`;}).join('');
  const tv=S.drafts['t-'+c.id];
  const timeVal=tv!=null?tv:nowHM();
  const gv=S.drafts[c.id]||'';
  const g=parseNum(gv),idle=isNaN(g)||g<=0;
  const avg=s.n?` · ${tx('в среднем {a} кг за рейс',{a:fmt(s.net/s.n,0)})}`:'';
  return appbar(sq('back-shift','back',tx("Назад к смене"),'','sq--ghost'),sq('car-report','down',tx("Скачать отчёт по машине"),' data-car="'+esc(c.id)+'"'))
    +(sh.status==='closed'?tx("<p class=\"note\">Смена закрыта. Рейсы можно добавлять и править, статус меняется на экране смены.</p>"):'')
    +`<section class="card carcard" style="--car:${colorHex(c.color)}">
      <div class="carcard__top"><span class="tile tile--car" style="background:${hex}">${icon('truck')}</span>
        <div class="carcard__id"><div class="carcard__name">${esc(c.driver)}</div><div class="muted">${esc(plateLabel(c.plate))} ${tx("· Прибытие:")} ${esc(c.arrival||'—')}</div></div>
        <button class="ibtn" data-act="car-edit" data-car="${esc(c.id)}" aria-label="${tx("Изменить машину")}">${icon('edit')}</button></div>
      <ul class="facts">
        <li>${icon('pin','ic--sm')}<span>${esc(c.route)}</span></li>
        <li>${icon('box','ic--sm')}<span>${esc(c.material)}</span></li>
        <li>${icon('scale','ic--sm')}<span>${tx("Тара:")} ${fmt(c.tare)} ${tx("кг")}</span></li>
        <li>${icon('truck','ic--sm')}<span>${s.n} ${plural(s.n,[tx("рейс"),tx("рейса"),tx("рейсов")])}</span></li>
      </ul>
      <div class="netbox"><div class="netbox__label">${tx("Общий вес НЕТТО")}</div>
        <div class="netbox__val mono">${fmt(s.net)} ${tx("кг")}</div>
        <div class="netbox__sub">${fmt(s.net/1000,3)} ${tx("т")}${avg}</div></div>
    </section>
    <section class="weigh" aria-label="${tx("Новое взвешивание")}">
      <h2>${tx("Новое взвешивание")}</h2>
      <input class="inp inp--xl mono" id="w-gross" inputmode="decimal" placeholder="${tx("Вес БРУТТО (кг)")}" aria-label="${tx("Вес брутто, кг")}" value="${esc(gv)}" data-draft="${esc(c.id)}" data-enter="trip-add" data-car="${esc(c.id)}" autocomplete="off">
      <div class="calc" id="w-calc">${calcHtml(c,gv)}</div>
      <input class="inp mono" id="w-time" type="text" inputmode="numeric" maxlength="5" placeholder="${tx("ЧЧ:ММ")}" data-time="1" aria-label="${tx("Время взвешивания, цифрами")}" value="${esc(timeVal)}" data-draft="t-${esc(c.id)}" data-enter="trip-add" data-car="${esc(c.id)}">
      <button class="btn btn--add${idle?' is-idle':''}" id="w-add" data-act="trip-add" data-car="${esc(c.id)}" aria-label="${tx("Записать рейс")}">+</button>
    </section>
    <section class="card trips" aria-label="${tx("Рейсы")}">
      <div class="trips__head"><h2>${tx("Рейсы")}</h2><span class="muted">${s.n} ${plural(s.n,[tx("рейс"),tx("рейса"),tx("рейсов")])}</span></div>
      <div class="scroll"><table class="tbl tbl--trips">
        <thead><tr><th>№</th><th>${tx("Время")}</th><th>${tx("БРУТТО")}</th><th class="r">${tx("НЕТТО")}</th><th></th></tr></thead>
        <tbody>${trips||tx("<tr><td colspan=\"5\" class=\"td-empty\">Рейсов пока нет. Введите вес брутто после взвешивания.</td></tr>")}</tbody>
        <tfoot><tr><td colspan="2">${tx("Итого")}</td><td class="mono">${fmt(s.gross)}</td><td class="r mono net${s.net<0?' is-bad':''}">${fmt(s.net)}</td><td></td></tr></tfoot>
      </table></div>
    </section>`;
}
function perTable(title,h,rows){
  if(!rows.length)return '';
  return `<h2 class="sect2">${title}</h2><div class="box scroll"><table class="tbl tbl--per tbl--stack"><thead><tr><th>${h}</th><th class="r">${tx("Машин")}</th><th class="r">${tx("Рейсов")}</th><th class="r">${tx("Нетто, кг")}</th></tr></thead><tbody>${rows.map(g=>`<tr><td>${esc(g.name)}</td><td class="r mono">${g.cars}</td><td class="r mono">${g.trips}</td><td class="r mono net">${fmt(g.net)}</td></tr>`).join('')}</tbody></table></div>`;
}
function viewStats(){
  const list=periodShifts();
  const E=entCurrent(list);
  const entHtml=`<h2 class="sect2">${tx("Отчёт по водителю или маршруту")}</h2><div class="range"><div class="field"><label for="ent-kind">${tx("Тип")}</label><select class="inp" id="ent-kind" data-ent="kind"><option value="driver"${E.kind==='driver'?' selected':''}>${tx("Водитель")}</option><option value="route"${E.kind==='route'?' selected':''}>${tx("Маршрут")}</option></select></div><div class="field"><label for="ent-name">${tx("Выбор")}</label><select class="inp" id="ent-name" data-ent="name">${E.names.map(n=>`<option value="${esc(n)}"${n===E.name?' selected':''}>${esc(n)}</option>`).join('')}</select></div></div><div style="margin-top:12px"><button class="btn btn--primary" data-act="entity-report"${E.names.length?'':' disabled'}>${icon('down','ic--sm')}${tx("Скачать отчёт")}</button></div>`;
  const tot=list.reduce((a,sh)=>{const s=shiftStats(sh);a.cars+=s.cars;a.trips+=s.trips;a.net=r2(a.net+s.net);return a;},{cars:0,trips:0,net:0});
  const rows=list.map(sh=>{const s=shiftStats(sh);
    return `<tr><td>${esc(dateRu(sh.date))}</td><td>${esc(shiftName(sh))}</td><td>${esc(sh.operator)}</td><td class="r mono">${s.cars}</td><td class="r mono">${s.trips}</td><td class="r mono net">${fmt(s.net)}</td></tr>`;}).join('');
  return appbar(sq('home','back',tx("Все смены"),'','sq--ghost'),sq('stats-report','down',tx("Скачать сводку")))
    +`<h1>${tx("Сводка за период")}</h1>
    <p class="lead">${tx("Итоги по сменам, материалам, маршрутам и водителям. Отчёт выгружается в CSV для Excel.")}</p>
    <div class="range">
      <div class="field"><label for="sfrom">${tx("С даты")}</label><input class="inp" id="sfrom" type="date" value="${esc(S.sFrom)}" data-stat="from"></div>
      <div class="field"><label for="sto">${tx("По дату")}</label><input class="inp" id="sto" type="date" value="${esc(S.sTo)}" data-stat="to"></div>
    </div>
    <div class="chips"><button class="btn btn--sm" data-act="range" data-range="week">${tx("7 дней")}</button><button class="btn btn--sm" data-act="range" data-range="month">${tx("Этот месяц")}</button><button class="btn btn--sm" data-act="range" data-range="all">${tx("Всё время")}</button></div>
    <div class="tiles tiles--4">
      <div class="tcell">${icon('cal')}<div class="tcell__v">${list.length}</div><div class="tcell__l">${plural(list.length,[tx("Смена"),tx("Смены"),tx("Смен")])}</div></div>
      <div class="tcell">${icon('truck')}<div class="tcell__v">${tot.cars}</div><div class="tcell__l">${plural(tot.cars,[tx("Машина"),tx("Машины"),tx("Машин")])}</div></div>
      <div class="tcell">${icon('scale')}<div class="tcell__v">${tot.trips}</div><div class="tcell__l">${plural(tot.trips,[tx("Рейс"),tx("Рейса"),tx("Рейсов")])}</div></div>
      <div class="tcell">${icon('box')}<div class="tcell__v mono">${fmt(tot.net/1000,1)}</div><div class="tcell__l">${tx("т НЕТТО")}</div></div>
    </div>
    ${entHtml}
    ${list.length?`<h2 class="sect2">${tx("По сменам")}</h2><div class="box scroll"><table class="tbl tbl--sum tbl--stack"><thead><tr><th>${tx("Дата")}</th><th>${tx("Смена")}</th><th>${tx("Оператор")}</th><th class="r">${tx("Машин")}</th><th class="r">${tx("Рейсов")}</th><th class="r">${tx("Нетто, кг")}</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td colspan="3">${tx("Итого")}</td><td class="r mono">${tot.cars}</td><td class="r mono">${tot.trips}</td><td class="r mono net">${fmt(tot.net)}</td></tr></tfoot></table></div>`
      :tx("<div class=\"empty\"><p>За выбранный период смен нет.</p></div>")}
    ${perTable(tx("По материалам"),tx("Материал"),groupStats(list,c=>c.material))}
    ${perTable(tx("По маршрутам"),tx("Маршрут"),groupStats(list,c=>c.route))}
    ${perTable(tx("По водителям"),tx("Водитель"),groupStats(list,c=>c.driver))}
    <h2 class="sect2">${tx("Резервная копия")}</h2>
    <p class="lead" style="margin-top:0">${tx("Все смены и справочник одним файлом JSON. Храните его на случай, если данные понадобятся вне сайта.")}</p>
    ${backupButtons()}`;
}
function viewGlossary(){
  const cat=CATS.find(c=>c.id===S.gcat)||CATS[0];
  const items=S.glossary[cat.id].slice().sort((a,b)=>a.name.localeCompare(b.name,LOC()));
  const q=S.gfilter.trim().toLowerCase();
  const shown=q?items.filter(x=>x.name.toLowerCase().includes(q)):items;
  const miss=missingFromShifts();
  const tabs=CATS.map(c=>`<button class="tab${c.id===cat.id?' is-on':''}" role="tab" aria-selected="${c.id===cat.id}" data-act="gtab" data-cat="${c.id}">${c.label}<span class="tab__n">${S.glossary[c.id].length}</span></button>`).join('');
  const lis=shown.map(it=>{
    const n=usageCount(cat.id,it.name);
    const use=n?`${n} ${cat.id==='operators'?plural(n,[tx("смена"),tx("смены"),tx("смен")]):plural(n,[tx("бланк"),tx("бланка"),tx("бланков")])}`:tx("не используется");
    return `<li class="gitem"><span class="gitem__name${cat.id==='vehicles'?' mono':''}">${esc(it.name)}</span><span class="gitem__use">${use}</span>
      <span class="gitem__act"><button class="ibtn" data-act="gloss-edit" data-id="${esc(it.id)}" aria-label="${tx("Изменить")} ${esc(it.name)}">${icon('edit','ic--sm')}</button><button class="ibtn ibtn--danger" data-act="gloss-delete" data-id="${esc(it.id)}" aria-label="${tx("Удалить")} ${esc(it.name)}">${icon('trash','ic--sm')}</button></span></li>`;}).join('');
  return appbar(sq('home','back',tx("Все смены"),'','sq--ghost'),'')
    +`<h1>${tx("Справочник")}</h1>
    <p class="lead">${tx("Эти значения выбираются из списка при создании смены и бланка машины. Новое значение можно добавить и прямо в форме.")}</p>
    <div class="tabs" role="tablist" aria-label="${tx("Разделы справочника")}">${tabs}</div>
    <div class="addrow">
      <input class="inp${cat.id==='vehicles'?' mono':''}" id="gnew" placeholder="${esc(cat.ph)}" value="${esc(S.drafts['g-'+cat.id]||'')}" data-draft="g-${cat.id}" data-enter="gloss-add" autocomplete="off" aria-label="${tx("Новое значение, раздел")} ${esc(cat.label)}">
      <button class="btn btn--primary" data-act="gloss-add">${tx("Добавить")}</button>
    </div>
    ${items.length>=8?`<div class="filter"><input class="inp" id="gfilter" type="search" placeholder="${tx("Найти в разделе")}" value="${esc(S.gfilter)}" data-gfilter="1" autocomplete="off" aria-label="${tx("Поиск в разделе")}"></div>`:''}
    ${shown.length?`<ul class="glist">${lis}</ul>`:`<div class="empty"><p>${items.length?tx("Ничего не найдено."):tx("В этом разделе пока пусто. Добавьте первое значение выше.")}</p></div>`}
    ${miss.length?`<div class="hint"><span>${tx('В сменах есть значения, которых нет в справочнике: {k}.',{k:miss.length})}</span><button class="btn btn--sm" data-act="gloss-import">${tx("Добавить из смен")}</button></div>`:''}`;
}

function viewLang(){
  return `<div class="langsel"><span class="tile logo-tile">${icon('scale')}</span><h1 class="logo">Tarazi</h1>
    <p class="lead">Тілді таңдаңыз · Выберите язык</p>
    <div class="langsel__btns"><button class="btn btn--primary btn--lg" data-act="setlang" data-lang="kk">Қазақша</button><button class="btn btn--primary btn--lg" data-act="setlang" data-lang="ru">Русский</button></div></div>`;
}
function snapsHtml(){
  const rows=S.snaps.map(x=>`<div class="gitem"><span class="gitem__name">${esc(stampOf(x.t))} · ${x.n} ${tx("смен")}</span><button class="btn btn--sm" data-act="snap-restore" data-t="${x.t}">${tx("Восстановить")}</button></div>`).join('');
  return `<div class="sect"><h2>${tx("Автокопии")}</h2></div>
    <p class="lead" style="margin-top:0">${tx("Приложение само хранит последние копии данных на этом устройстве. Если что-то пропало, восстановите одну из них.")}</p>
    ${rows||`<p class="muted">${tx("Автокопий пока нет.")}</p>`}`;
}
function viewSettings(){
  const lg=(l,n)=>`<button class="pill${LANG===l?' is-on':''}" role="radio" aria-checked="${LANG===l}" data-act="setlang" data-lang="${l}">${n}</button>`;
  const th=(v,ic,n)=>`<button class="pill${S.theme===v?' is-on':''}" role="radio" aria-checked="${S.theme===v}" data-act="settheme" data-theme="${v}">${icon(ic,'ic--sm')}${n}</button>`;
  return appbar(sq('home','back',tx("Все смены"),'','sq--ghost'),'')
    +`<h1>${tx("Настройки")}</h1>
    <div class="sect"><h2>${tx("Язык")}</h2></div><div class="pills" role="radiogroup" aria-label="${tx("Язык")}">${lg('kk','Қазақша')}${lg('ru','Русский')}</div>
    <div class="sect"><h2>${tx("Тема")}</h2></div><div class="pills" role="radiogroup" aria-label="${tx("Тема")}">${th('light','sun',tx("Светлая"))}${th('dark','moon',tx("Тёмная"))}${th('auto','contrast',tx("Как в системе"))}</div>
    <div class="sect"><h2>${tx("Резервная копия")}</h2></div>
    <p class="lead" style="margin-top:0">${tx("Все смены и справочник одним файлом JSON. Храните его на случай, если данные понадобятся вне сайта.")}</p>
    ${backupButtons()}
    ${S.mode==='local'?snapsHtml():''}
    <p class="note" style="margin-top:28px">Tarazi · ${tx("Работает без интернета, данные хранятся на этом устройстве")}<br>${tx("Версия")} ${esc(BUILD.version)} · ${esc(BUILD.date)}</p>`;
}
function setLang(l){
  if(l!=='kk'&&l!=='ru')return;
  LANG=l;try{localStorage.setItem(LKEY,l);}catch(_){}
  try{document.documentElement.lang=l;}catch(_){}
  render();window.scrollTo(0,0);
}
function render(){
  const ae=document.activeElement;let aid=null,sel=null;
  if(ae&&ae!==document.body&&$app.contains(ae)&&ae.id){aid=ae.id;try{if(ae.selectionStart!=null)sel=[ae.selectionStart,ae.selectionEnd];}catch(_){}}
  if(!LANG){$app.innerHTML=viewLang();return;}
  let html;
  if(!isReady()){html=tx("<p class=\"lead\" style=\"margin-top:24px\">Загружаю данные…</p>");}
  else{
    const sh=S.shifts[S.shiftId];
    if(S.view==='car'&&sh&&sh.cars.some(c=>c.id===S.carId)){html=viewCar(sh,sh.cars.find(c=>c.id===S.carId));}
    else if((S.view==='car'||S.view==='shift')&&sh){
      if(S.view==='car'){S.view='shift';S.carId=null;try{location.hash='shift-'+sh.id;}catch(_){}}
      html=viewShift(sh);
    }
    else if(S.view==='glossary'){html=viewGlossary();}
    else if(S.view==='stats'){html=viewStats();}
    else if(S.view==='settings'){html=viewSettings();}
    else{
      if(S.view!=='home'){S.view='home';S.shiftId=null;S.carId=null;try{location.hash='';}catch(_){}}
      html=viewHome();
    }
  }
  $app.innerHTML=html;
  labelTables();
  if(S.focusId){const el=document.getElementById(S.focusId);if(el)el.focus();S.focusId=null;}
  else if(aid){const el=document.getElementById(aid);if(el){el.focus({preventScroll:true});if(sel){try{el.setSelectionRange(sel[0],sel[1]);}catch(_){}}}}
  if(S.scrollId){const el=document.getElementById(S.scrollId);if(el)el.scrollIntoView({block:'nearest'});S.scrollId=null;}
}
function labelTables(){
  $app.querySelectorAll('table.tbl--stack').forEach(t=>{
    const hs=[...t.querySelectorAll('thead th')].map(h=>h.textContent.trim());
    t.querySelectorAll('tbody tr,tfoot tr').forEach(r=>{let c=0;[...r.children].forEach(td=>{const span=td.colSpan||1;td.setAttribute('data-l',span>1?'':(hs[c]||''));c+=span;});});
  });
}
function updatePreview(){
  const car=currentCar(),el=document.getElementById('w-calc'),inp=document.getElementById('w-gross'),btn=document.getElementById('w-add');
  if(!car||!el||!inp)return;
  el.innerHTML=calcHtml(car,inp.value);
  const g=parseNum(inp.value);
  if(btn)btn.classList.toggle('is-idle',isNaN(g)||g<=0);
}

