/* ---------- helpers ---------- */
const IC={
  back:'<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
  trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v6M14 11v6"/>',
  down:'<path d="M12 3v12"/><path d="M8 11l4 4 4-4"/><path d="M5 21h14"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  truck:'<path d="M14 18V6a2 2 0 00-2-2H4a2 2 0 00-2 2v11a1 1 0 001 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 001-1v-3.65a1 1 0 00-.22-.62l-3.48-4.35A1 1 0 0017.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  scale:'<path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  box:'<path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  book:'<path d="M2 4h6a4 4 0 014 4v13a3 3 0 00-3-3H2z"/><path d="M22 4h-6a4 4 0 00-4 4v13a3 3 0 013-3h7z"/>',
  up:'<path d="M12 21V9"/><path d="M8 13l4-4 4 4"/><path d="M5 3h14"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>',
  contrast:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 010 18z" fill="currentColor"/>',
  chart:'<path d="M3 3v18h18"/><path d="M8 17v-6"/><path d="M13 17V7"/><path d="M18 17v-4"/>',
  copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>'
};
const icon=(n,cls)=>`<svg class="ic${cls?' '+cls:''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>Number(n||0).toLocaleString(LOC(),{maximumFractionDigits:d});
const r2=n=>Math.round(n*100)/100;
const pad=n=>String(n).padStart(2,'0');
const nowHM=()=>{const d=new Date();return pad(d.getHours())+':'+pad(d.getMinutes());};
const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());};
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const plain=o=>JSON.parse(JSON.stringify(o));
const isReady=()=>S.gotShifts&&S.gotGloss;
const plateLabel=p=>/^\d+$/.test(String(p||''))?'№'+p:String(p||'');
/* время вводится цифрами: 0726 → 07:26, 726 → 07:26, 14 → 14:00 */
function normTime(s){
  const d=String(s||'').replace(/\D/g,'');
  if(!d||d.length>4)return '';
  let h,m;
  if(d.length<=2){h=+d;m=0;}else if(d.length===3){h=+d[0];m=+d.slice(1);}else{h=+d.slice(0,2);m=+d.slice(2);}
  return h>23||m>59?'':pad(h)+':'+pad(m);
}
function fmtTimeLive(v){
  const d=String(v||'').replace(/\D/g,'').slice(0,4);
  if(d.length<=2)return d;
  let h=d.slice(0,2),m=d.slice(2);
  if(+h>23){h='0'+d[0];m=d.slice(1,3);}
  return h+':'+m;
}
function plural(n,f){const a=Math.abs(n)%100,b=a%10;if(a>10&&a<20)return f[2];if(b>1&&b<5)return f[1];if(b===1)return f[0];return f[2];}
function parseNum(s){const t=String(s==null?'':s).replace(/[\s  ]/g,'').replace(',','.');if(t==='')return NaN;const n=Number(t);return isFinite(n)?n:NaN;}
function parseDate(s){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
function dateLong(s){const d=parseDate(s);if(!d)return s||tx("без даты");if(LANG==='kk')return d.getDate()+' '+KK_MONTHS[d.getMonth()]+' '+d.getFullYear();return d.toLocaleDateString(LOC(),{day:'numeric',month:'long',year:'numeric'});}
function dateShort(s){const d=parseDate(s);if(!d)return s||tx("без даты");if(LANG==='kk')return d.getDate()+' '+KK_MONTHS[d.getMonth()];return d.toLocaleDateString(LOC(),{day:'numeric',month:'long'});}
function dateRu(s){const d=parseDate(s);return d?pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear():(s||'');}
function stable(v){return JSON.stringify(v,(k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.keys(x).sort().reduce((o,kk)=>(o[kk]=x[kk],o),{}):x);}
function safeName(s){return String(s).replace(/[\\\/:*?"<>|]+/g,'-').replace(/\s+/g,'_');}
const newestFirst=(a,b)=>(b.date||'').localeCompare(a.date||'')||(b.createdAt||0)-(a.createdAt||0);

const shiftLabelRu=t=>t==='night'?'2-ночная':'1-дневная';
const shiftName=sh=>tx(shiftLabelRu(sh&&sh.type));
function normalize(v,id){
  const sh=plain(v);
  sh.id=id;sh.date=sh.date||'';sh.shift=sh.shift||'';sh.operator=sh.operator||'';sh.createdAt=sh.createdAt||0;
  sh.type=(sh.type==='night'||sh.type==='day')?sh.type:(/ноч/i.test(sh.shift)?'night':'day');
  sh.status=sh.status==='closed'?'closed':'active';
  sh.cars=Array.isArray(sh.cars)?sh.cars:[];
  sh.cars.forEach(c=>{
    c.trips=Array.isArray(c.trips)?c.trips:[];c.tare=Number(c.tare)||0;
    c.color=COLORS.some(k=>k.id===c.color)?c.color:'orange';
    c.trips.forEach(t=>{t.gross=Number(t.gross)||0;});
  });
  return sh;
}
function normGloss(v){
  const g=emptyGloss();
  CATS.forEach(c=>{
    const a=v&&Array.isArray(v[c.id])?v[c.id]:[];
    a.forEach(x=>{if(x&&typeof x.name==='string'&&x.name.trim())g[c.id].push({id:String(x.id||uid('g')),name:x.name});});
  });
  return g;
}

