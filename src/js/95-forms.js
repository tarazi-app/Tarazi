/* ---------- forms ---------- */
function openShiftForm(id,fromId){
  const sh=id?S.shifts[id]:null;
  const src=fromId?S.shifts[fromId]:null;
  openForm({
    title:sh?tx("Изменить смену"):(src?tx("Копия смены"):tx("Новая смена")),
    submitLabel:sh?tx("Сохранить"):(src?tx("Создать копию"):tx("Создать смену")),
    extra:src?tx("<p class=\"dlg-note\">Машины скопируются без рейсов. Время прибытия, тару и водителей можно поправить в каждой машине.</p>"):'',
    fields:[
      {name:'date',label:tx("Дата"),type:'date',required:true,value:sh?sh.date:todayISO(),half:true},
      {name:'type',label:tx("Смена"),options:[['day',tx("1-дневная")],['night',tx("2-ночная")]],value:sh?sh.type:(src?src.type:autoType()),half:true},
      {name:'operator',label:tx("Оператор автовесов"),pick:'operators',addLabel:tx("Новый оператор"),required:true,value:sh?sh.operator:(src?src.operator:lastOperator()),placeholder:tx("Фамилия Имя Отчество")},
      {name:'status',label:tx("Статус"),options:[['active',tx("Активна")],['closed',tx("Закрыта")]],value:sh?sh.status:'active'}
    ],
    onDelete:sh?()=>handle('shift-delete',{dataset:{id:sh.id}}):null,
    onSave(v){
      if(sh){mutateShift(id,s=>{s.date=v.date;s.type=v.type;s.shift=shiftLabelRu(v.type);s.operator=v.operator;s.status=v.status;});toast(tx("Смена обновлена"));}
      else{const n={id:uid('s'),date:v.date,type:v.type,shift:shiftLabelRu(v.type),operator:v.operator,status:v.status,createdAt:Date.now(),
        cars:src?src.cars.map(c=>({id:uid('c'),plate:c.plate,driver:c.driver,arrival:'',tare:c.tare,route:c.route,material:c.material,color:c.color,trips:[]})):[]};S.shifts[n.id]=n;persist(n.id);S.homeType=v.type;navigate('shift',n.id);toast(tx("Смена создана"));}
    }
  });
}
function openCarForm(carId){
  const sh=S.shifts[S.shiftId];if(!sh)return;
  const car=carId?sh.cars.find(c=>c.id===carId):null;
  openForm({
    title:car?tx("Изменить машину"):tx("Новая машина"),
    submitLabel:car?tx("Сохранить"):tx("Создать бланк"),
    autofill:!car,
    fields:[
      {name:'plate',label:tx("Номер машины"),pick:'vehicles',addLabel:tx("Новая"),required:true,value:car?car.plate:'',placeholder:'123ABC02',half:true},
      {name:'arrival',label:tx("Время прибытия"),type:'time',value:car?car.arrival:nowHM(),half:true,check:v=>normTime(v.arrival)?'':tx("Введите время, например 07:26")},
      {name:'driver',label:tx("Водитель"),pick:'drivers',addLabel:tx("Новый"),required:true,value:car?car.driver:'',placeholder:tx("Фамилия Имя Отчество")},
      {name:'tare',label:tx("Вес тары, кг"),inputmode:'decimal',required:true,value:car?car.tare:'',placeholder:tx("например 14500"),
        check:v=>{const n=parseNum(v.tare);return isNaN(n)||n<=0?tx("Введите вес тары числом больше нуля"):'';}},
      {name:'route',label:tx("Маршрут"),pick:'routes',addLabel:tx("Новый"),required:true,value:car?car.route:'',placeholder:tx("Карьер → Завод")},
      {name:'material',label:tx("Перевозимый материал"),pick:'materials',addLabel:tx("Новый"),required:true,value:car?car.material:'',placeholder:tx("Щебень 5–20")},
      {name:'color',label:tx("Цвет карточки"),colors:true,value:car?car.color:'orange'}
    ],
    extra:car?'':'<p class="fhint" id="af-note" hidden></p>',
    onDelete:car?()=>handle('car-delete',{dataset:{car:carId}}):null,
    onSave(v){
      const props={plate:v.plate,driver:v.driver,arrival:normTime(v.arrival),tare:parseNum(v.tare),route:v.route,material:v.material,color:v.color||'orange'};
      if(car){mutateShift(sh.id,s=>{Object.assign(s.cars.find(c=>c.id===carId),props);});toast(tx("Данные машины обновлены"));}
      else{const nid=uid('c');S.scrollId='car-'+nid;mutateShift(sh.id,s=>{s.cars.push(Object.assign({id:nid,trips:[]},props));});toast(tx("Бланк машины создан"));}
    }
  });
}
function openTripForm(tripId){
  const sh=S.shifts[S.shiftId],car=currentCar();if(!sh||!car)return;
  const trip=car.trips.find(t=>t.id===tripId);if(!trip)return;
  const carId=car.id;
  openForm({
    title:tx("Рейс ")+(car.trips.indexOf(trip)+1),
    fields:[
      {name:'time',label:tx("Время"),type:'time',required:true,value:trip.time,half:true,check:v=>normTime(v.time)?'':tx("Введите время, например 14:35")},
      {name:'gross',label:tx("Брутто, кг"),inputmode:'decimal',required:true,value:trip.gross,half:true,
        check:v=>{const n=parseNum(v.gross);return isNaN(n)||n<=0?tx("Введите вес числом больше нуля"):'';}}
    ],
    extra:`<p class="dlg-note">${tx('Нетто = брутто − тара ({t} кг). Пересчитается автоматически.',{t:fmt(car.tare)})}</p>`,
    onSave(v){
      mutateShift(sh.id,s=>{const t=s.cars.find(c=>c.id===carId).trips.find(x=>x.id===tripId);if(t){t.time=normTime(v.time);t.gross=parseNum(v.gross);}});
      toast(tx("Рейс обновлён"));
    }
  });
}
function openGlossEdit(cat,id){
  const it=S.glossary[cat].find(x=>x.id===id);if(!it)return;
  openForm({
    title:tx("Изменить значение"),
    fields:[{name:'name',label:tx("Название"),required:true,value:it.name,
      check:v=>{const n=cleanName(cat,v.name);return S.glossary[cat].some(x=>x.id!==id&&sameName(x.name,n))?tx("Такое значение уже есть"):'';}}],
    extra:tx("<p class=\"dlg-note\">В уже созданных сменах значение не изменится. Оно поменяется только в справочнике.</p>"),
    onSave(v){const t=S.glossary[cat].find(x=>x.id===id);if(!t)return;t.name=cleanName(cat,v.name);persistGlossary();render();toast(tx("Сохранено"));}
  });
}

