/* MedHub — SPA logic: state, routes, modules, API */
(function(){
'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const fmtD = ts => new Date(ts).toLocaleDateString(undefined,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const todayISO = () => new Date().toISOString().slice(0,10);
const daysBetween = (a,b) => Math.round((new Date(b)-new Date(a))/86400000);

/* ---------------- state ---------------- */
const DEFAULTS = {lang:'ru', theme:'light', quality:'high', latin:false,
  localFeed:{material:[],error:[],case:[],'duty-swap':[],diary:[]},
  grades:[], events:[], diary:[], skills:{}, ops:[], reflect:[], duties:[],
  decks:[], cards:[], srs:{}, streak:0, lastReview:'',
  patient:{solved:0, attempted:0}, notif:{duty:true, colloq:true, cards:true},
  group:null, authSkip:false, groqKey:'', aiChat:[], syncKey:'', basesOffline:false};
let S;
try { S = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem('medhub')||'{}')); }
catch { S = Object.assign({}, DEFAULTS); }
const save = () => localStorage.setItem('medhub', JSON.stringify(S));
window.LANG = S.lang;

/* ---------------- свои SVG-иконки (вместо эмодзи) ---------------- */
const ICONS = {
 bot:'<rect x="4.5" y="8" width="15" height="11.5" rx="3.5"/><path d="M12 8V4.5M9 4.5h6"/><circle cx="9.3" cy="13.2" r="1.2"/><circle cx="14.7" cy="13.2" r="1.2"/><path d="M9.5 16.8h5"/>',
 check:'<path d="m4.5 12.5 5 5 10-11"/>',
 upload:'<path d="M12 16V4.5M12 4.5 7.5 9M12 4.5l4.5 4.5"/><path d="M4.5 15.5v3a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-3"/>',
 copy:'<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M5.5 15.5h-1a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1"/>',
 send:'<path d="M21 3.5 3.5 10.8l6.8 2.4L12.7 20 21 3.5Z"/><path d="m10.3 13.2 4.2-4.2"/>',
 move:'<path d="M12 3.5v17M3.5 12h17M12 3.5 9.5 6M12 3.5 14.5 6M12 20.5 9.5 18M12 20.5l2.5-2.5M3.5 12 6 9.5M3.5 12 6 14.5M20.5 12 18 9.5M20.5 12l-2.5 2.5"/>',
 board:'<path d="M3.5 5h17v11.5h-17Z"/><path d="M12 16.5v3M8 20.5h8"/><path d="m6.5 11.5 3-3.5 2.5 3 2-2.5 3.5 4"/>',
 undo:'<path d="M9.5 7 4 12l5.5 5M4 12h9a6 6 0 0 1 6 6v1"/>',
 redo:'<path d="m14.5 7 5.5 5-5.5 5M20 12h-9a6 6 0 0 0-6 6v1"/>',
 eraser:'<path d="m7 20.5h10"/><path d="M13.5 3.5 20.5 10.5 12 19H7l-3.5-3.5Z"/><path d="m9.5 7.5 7 7"/>',
 note:'<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M20 13.5 13.5 20H6a2 2 0 0 1-2-2v-2.5Z"/>',
 fullscreen:'<path d="M3.5 8.5v-5h5M15.5 3.5h5v5M20.5 15.5v5h-5M8.5 20.5h-5v-5"/>',
 grid:'<path d="M3.5 3.5h17v17h-17ZM3.5 9h17M3.5 15h17M9 3.5v17M15 3.5v17"/>',
 zoomin:'<circle cx="11" cy="11" r="6.2"/><path d="m15.8 15.8 5 5M11 8.2v5.6M8.2 11h5.6"/>',
 zoomout:'<circle cx="11" cy="11" r="6.2"/><path d="m15.8 15.8 5 5M8.2 11h5.6"/>',
 fit:'<path d="M3.5 8.5v-5h5M15.5 3.5h5v5M20.5 15.5v5h-5M8.5 20.5h-5v-5"/><path d="M8 12h8"/>',
 image:'<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="9.5" r="1.7"/><path d="m3.5 16.5 5-4.5 4 3.5 3.5-3 4.5 4"/>',
 pen:'<path d="m15 4.5 4.5 4.5L8 20.5H3.5V16Z"/><path d="m12.5 7 4.5 4.5"/>',
 cursor:'<path d="M5 3.5 19 11.5l-6 1.5-3.5 5.5Z"/>',
 bline:'<path d="M4.5 19.5 19.5 4.5"/>',
 barrow:'<path d="M4.5 19.5 19.5 4.5M12 4.5h7.5V12"/>',
 brect:'<rect x="4" y="5.5" width="16" height="13" rx="1.5"/>',
 bellipse:'<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>',
 btext:'<path d="M5 6.5V4.5h14v2M12 4.5v15M9 19.5h6"/>',
 trash2:'<path d="M4.5 6.5h15M9.5 6.5V4.2h5v2.3M6.5 6.5l1 14h9l1-14"/>',
 steth:'<path d="M5.5 3v5a4.5 4.5 0 0 0 9 0V3"/><path d="M3.5 3h2M14.5 3h2"/><path d="M10 12v3a5.5 5.5 0 0 0 11 0v-2.2"/><circle cx="21" cy="10.5" r="1.9"/>',
 grad:'<path d="M12 4 21 8.5 12 13 3 8.5Z"/><path d="M6.5 10.8V15c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8v-4.2"/><path d="M21 8.5v5.5"/>',
 search:'<circle cx="11" cy="11" r="6.2"/><path d="m15.8 15.8 5 5"/>',
 book:'<path d="M5.5 5A2.5 2.5 0 0 1 8 2.5h10.5V19H8A2.5 2.5 0 0 0 5.5 21.5Z"/><path d="M5.5 19V5"/>',
 heart:'<path d="M12 20.5S4.6 16.2 2.9 11.6C1.7 8.3 3.8 5.2 7 5.2c2 0 3.7 1 5 2.7C13.3 6.2 15 5.2 17 5.2c3.2 0 5.3 3.1 4.1 6.4C19.4 16.2 12 20.5 12 20.5Z"/>',
 brain:'<path d="M9.3 3.8a2.6 2.6 0 0 0-2.6 2.6v.5a2.8 2.8 0 0 0-2 2.7c0 .7.3 1.4.7 1.9a2.9 2.9 0 0 0-.6 1.8 2.9 2.9 0 0 0 1.9 2.7 2.7 2.7 0 0 0 2.6 2.3c1 0 1.9-.5 2.4-1.3V5.1a2.6 2.6 0 0 0-2.4-1.3Z"/><path d="M14.7 3.8a2.6 2.6 0 0 1 2.6 2.6v.5a2.8 2.8 0 0 1 2 2.7c0 .7-.3 1.4-.7 1.9a2.9 2.9 0 0 1 .6 1.8 2.9 2.9 0 0 1-1.9 2.7 2.7 2.7 0 0 1-2.6 2.3c-1 0-1.9-.5-2.4-1.3V5.1a2.6 2.6 0 0 1 2.4-1.3Z"/>',
 diary:'<rect x="5" y="3" width="14.5" height="18" rx="2.2"/><path d="M9.2 3v18"/><path d="M13 8.2h3.4M13 12h3.4"/>',
 sliders:'<path d="M4 7.2h8.6M16.4 7.2H20M4 12h2.6M10.4 12H20M4 16.8h10.6M18.4 16.8H20"/><circle cx="14.5" cy="7.2" r="1.9"/><circle cx="8.5" cy="12" r="1.9"/><circle cx="16.5" cy="16.8" r="1.9"/>',
 users:'<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20c.6-3.5 3.1-5.5 6.2-5.5s5.6 2 6.2 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.4 14.6c2.6.4 4.3 2.1 4.8 4.9"/>',
 box:'<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5Z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
 lock:'<rect x="5.5" y="10.5" width="13" height="10" rx="2.2"/><path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7"/>',
 globe:'<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2M12 3.4c2.6 2.4 3.9 5.3 3.9 8.6s-1.3 6.2-3.9 8.6c-2.6-2.4-3.9-5.3-3.9-8.6s1.3-6.2 3.9-8.6Z"/>',
 download:'<path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4.5 19.5h15"/>',
 save:'<path d="M5 3.5h11L20.5 8v12.5H5Z"/><path d="M8 3.5V9h7V3.5"/><path d="M8 13h8v7.5H8Z"/>',
 doc:'<path d="M6.5 2.5h8L19 7v14.5H6.5Z"/><path d="M14 2.5V7h5"/><path d="M9.5 12h5M9.5 15.5h5"/>',
 printer:'<path d="M7 8V3.5h10V8"/><rect x="3.5" y="8" width="17" height="8.5" rx="2"/><path d="M7 14h10v6.5H7Z"/>',
 dice:'<rect x="3.5" y="3.5" width="17" height="17" rx="3.5"/><circle cx="8.3" cy="8.3" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.7" cy="8.3" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="8.3" cy="15.7" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.7" cy="15.7" r="1.2" fill="currentColor" stroke="none"/>',
 calendar:'<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 2.5v4M16 2.5v4"/>',
 chart:'<path d="M4 20V4M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-8"/>',
 bell:'<path d="M12 3.5a5.5 5.5 0 0 1 5.5 5.5c0 4 1.5 5.5 2 6.5h-15c.5-1 2-2.5 2-6.5A5.5 5.5 0 0 1 12 3.5Z"/><path d="M10 18.5a2 2 0 0 0 4 0"/>',
 check:'<path d="m4.5 12.5 5 5L19.5 6.5"/>',
 x:'<path d="m5.5 5.5 13 13M18.5 5.5l-13 13"/>',
 play:'<path d="M7 4.5 19.5 12 7 19.5Z"/>',
 clock:'<circle cx="12" cy="12" r="8.6"/><path d="M12 6.5V12l3.5 2"/>',
 refresh:'<path d="M20 12a8 8 0 1 1-2.3-5.6M20 3.5V8h-4.5"/>',
 pin:'<path d="M12 21s6.5-6.6 6.5-11a6.5 6.5 0 1 0-13 0c0 4.4 6.5 11 6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
 flame:'<path d="M12 21c-3.9 0-6.5-2.6-6.5-6 0-2.5 1.5-4.5 3-6.5.6 1 1.3 1.7 2 2C10.3 8 11 5 13.5 3c-.3 2.3.6 3.6 1.9 5.1 1.4 1.6 3.1 3.2 3.1 6.4 0 3.9-2.6 6.5-6.5 6.5Z"/>',
 moon:'<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z"/>',
 sun:'<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
 crown:'<path d="M4 8.5 8 12l4-6 4 6 4-3.5-1.5 11h-13Z"/>',
 bed:'<path d="M3.5 19.5V9M3.5 13.5h17v6M20.5 19.5v-6a3 3 0 0 0-3-3h-8v3.5"/><circle cx="7.3" cy="11" r="1.8"/>',
 headphones:'<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13.5" width="4.4" height="7" rx="2"/><rect x="16.6" y="13.5" width="4.4" height="7" rx="2"/>',
 info:'<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5M12 7.6v.4"/>',
 lungs:'<path d="M12 3.5v7M12 10.5c-1.2-2-3.4-2.6-5-2.6-2.6 0-3.5 1.6-3.5 4.6v4c0 2 1 3.5 2.8 3.5 2.9 0 5.7-2.3 5.7-5.5M12 10.5c1.2-2 3.4-2.6 5-2.6 2.6 0 3.5 1.6 3.5 4.6v4c0 2-1 3.5-2.8 3.5-2.9 0-5.7-2.3-5.7-5.5"/>',
 bowel:'<path d="M6.5 4.5h8a4 4 0 0 1 4 4c0 1.8-1.2 3-3 3H9a3.5 3.5 0 0 0 0 7h8.5"/><path d="M6.5 4.5a3 3 0 0 0 0 6"/>',
 swap:'<path d="M17 3.5 20.5 7 17 10.5M20.5 7H7M7 20.5 3.5 17 7 13.5M3.5 17h13.5"/>',
 warn:'<path d="M12 3.5 21.5 20h-19Z"/><path d="M12 9.5v4.5M12 16.8v.4"/>',
 cards:'<rect x="3.5" y="6.5" width="11" height="14" rx="2"/><path d="M8 3.5h11a2 2 0 0 1 2 2v11"/>',
 palette:'<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.5 0 2-1 1.6-1.9-.5-1.2.3-2.6 1.9-2.6h2A3.5 3.5 0 0 0 21 12.5C21 7.5 17 3.5 12 3.5Z"/><circle cx="8" cy="10" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="10" r="1.2" fill="currentColor" stroke="none"/>',
 monitor:'<rect x="3" y="4.5" width="18" height="12.5" rx="2"/><path d="M9 20.5h6M12 17v3.5"/>',
 child:'<circle cx="12" cy="6.5" r="3"/><path d="M12 10v6M8.5 12.5h7M12 16l-3 5M12 16l3 5"/>',
 trash:'<path d="M4.5 6.5h15M9.5 6.5V4.2h5v2.3M6.5 6.5l1 14h9l1-14"/><path d="M10 10.5v6M14 10.5v6"/>',
 eye:'<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/>',
 pill:'<rect x="3.5" y="8.5" width="17" height="7" rx="3.5" transform="rotate(-35 12 12)"/><path d="m9.2 6.7 5.6 10.6"/>',
 link:'<path d="M9.5 14.5 14.5 9.5"/><path d="M7 12 5 14a3.5 3.5 0 0 0 5 5l2-2M17 12l2-2a3.5 3.5 0 0 0-5-5l-2 2"/>'
};
function ic(name, cls=''){
  const p = ICONS[name];
  return p ? `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>` : '';
}

/* ---------------- api: server, или localStorage в статическом режиме ---------------- */
const Store = (function(){
  let staticMode = null;                       // null = ещё определяем
  const ready = (async () => {
    try {
      if (new URLSearchParams(location.search).has('static') || localStorage.getItem('medhub_force_static')){
        staticMode = true; return;
      }
      const r = await fetch('/api/health');
      staticMode = !(r.ok && (r.headers.get('content-type')||'').includes('json'));
    } catch { staticMode = true; }
  })();
  const L = () => { try { return Object.assign({groups:{},entries:[],sync:{}}, JSON.parse(localStorage.getItem('medhub_local')||'{}')); } catch { return {groups:{},entries:[],sync:{}}; } };
  const saveL = db => localStorage.setItem('medhub_local', JSON.stringify(db));
  const uid2 = () => Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const pub = g => ({code:g.code, name:g.name, createdAt:g.createdAt, members:g.members.map(m=>({id:m.id,name:m.name,role:m.role}))});
  function handle(path, opts){
    const db = L(); const o = opts || {};
    const body = o.body || {};
    let m;
    if (o.method==='POST' && path==='/groups'){
      if (!body.name || !body.adminName) return Promise.reject(new Error('name and adminName required'));
      let code; do { code = Array.from(crypto.getRandomValues(new Uint8Array(3))).map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase(); } while (db.groups[code]);
      const admin = {id:uid2(), name:body.adminName.slice(0,40), role:'admin'};
      db.groups[code] = {code, name:body.name.slice(0,60), createdAt:Date.now(), members:[admin], adminKey:uid2()+uid2()};
      saveL(db);
      return Promise.resolve({group:pub(db.groups[code]), me:admin, adminKey:db.groups[code].adminKey});
    }
    if ((m = path.match(/^\/groups\/([A-Za-z0-9]+)\/join$/)) && o.method==='POST'){
      const g = db.groups[m[1]]; if (!g) return Promise.reject(new Error('group not found'));
      if (!body.name) return Promise.reject(new Error('name required'));
      let me = g.members.find(x=>x.name===body.name);
      if (!me){ me = {id:uid2(), name:body.name.slice(0,40), role: body.adminKey===g.adminKey?'admin':'student'}; g.members.push(me); saveL(db); }
      const out = {group:pub(g), me};
      if (me.role==='admin') out.adminKey = g.adminKey;
      return Promise.resolve(out);
    }
    if ((m = path.match(/^\/groups\/([A-Za-z0-9]+)$/)) && !o.method){
      const g = db.groups[m[1]]; if (!g) return Promise.reject(new Error('group not found'));
      return Promise.resolve({group:pub(g)});
    }
    if ((m = path.match(/^\/groups\/([A-Za-z0-9]+)\/feed$/))){
      let list = db.entries.filter(e=>e.group===m[1]);
      const qt = (o.query&&o.query.type) || o.type;
      if (qt) list = list.filter(e=>e.type===qt);
      list.sort((a,b)=>b.ts-a.ts);
      return Promise.resolve({entries:list.slice(0,300)});
    }
    if ((m = path.match(/^\/groups\/([A-Za-z0-9]+)\/entries$/)) && o.method==='POST'){
      const g = db.groups[m[1]]; if (!g) return Promise.reject(new Error('group not found'));
      if (!g.members.find(x=>x.id===body.authorId)) return Promise.reject(new Error('not a member'));
      const e = {id:uid2(), group:g.code, type:body.type, ts:Date.now(), authorId:body.authorId,
        authorName:String(body.authorName||'').slice(0,40), title:String(body.title||'').slice(0,160),
        body:String(body.body||'').slice(0,8000), visibility:body.visibility||'group', meta:body.meta||{}};
      db.entries.push(e); saveL(db);
      return Promise.resolve({entry:e});
    }
    if ((m = path.match(/^\/groups\/([A-Za-z0-9]+)\/entries\/([^/]+)\/comments$/)) && o.method==='POST'){
      const e = db.entries.find(x=>x.id===m[2] && x.group===m[1]); if (!e) return Promise.reject(new Error('not found'));
      e.meta.comments = e.meta.comments||[];
      e.meta.comments.push({id:uid2(), ts:Date.now(), authorName:String(body.authorName||'').slice(0,40), text:String(body.text||'').slice(0,1000)});
      saveL(db);
      return Promise.resolve({entry:e});
    }
    if ((m = path.match(/^\/groups\/([A-Za-z0-9]+)\/entries\/([^/]+)$/)) && o.method==='DELETE'){
      const g = db.groups[m[1]]; if (!g) return Promise.reject(new Error('group not found'));
      const i = db.entries.findIndex(x=>x.id===m[2] && x.group===g.code);
      if (i<0) return Promise.reject(new Error('not found'));
      if (!(body.adminKey===g.adminKey || db.entries[i].authorId===body.memberId)) return Promise.reject(new Error('no rights'));
      db.entries.splice(i,1); saveL(db);
      return Promise.resolve({ok:true});
    }
    if (path === '/feed'){
      const qt = (o.query&&o.query.type) || o.type;
      let list = db.entries.slice();
      if (qt) list = list.filter(e=>e.type===qt);
      list.sort((a,b)=>b.ts-a.ts);
      return Promise.resolve({entries:list.slice(0,120).map(e=>Object.assign({},e,{groupName:(db.groups[e.group]||{}).name||''}))});
    }
    if ((m = path.match(/^\/groups\/([A-Za-z0-9]+)\/grades$/)) && !o.method){
      const g = db.groups[m[1]]; if (!g) return Promise.reject(new Error('group not found'));
      return Promise.resolve({grades:g.grades||[]});
    }
    if ((m = path.match(/^\/groups\/([A-Za-z0-9]+)\/grades$/)) && o.method==='POST'){
      const g = db.groups[m[1]]; if (!g) return Promise.reject(new Error('group not found'));
      const rec = {id:uid2(), memberId:String(body.memberId||''), authorName:String(body.authorName||'').slice(0,40),
        subject:String(body.subject||'').slice(0,80), course:+body.course||1, grade:+body.grade, cred:+body.cred||null,
        date:String(body.date||'').slice(0,10), ts:Date.now()};
      g.grades = g.grades||[]; g.grades.push(rec); saveL(db);
      return Promise.resolve({grade:rec});
    }
    if ((m = path.match(/^\/sync\/(.+)$/)) && o.method==='PUT'){
      db.sync[decodeURIComponent(m[1])] = {ts:Date.now(), data:body};
      saveL(db);
      return Promise.resolve({ok:true, ts:db.sync[decodeURIComponent(m[1])].ts});
    }
    if ((m = path.match(/^\/sync\/(.+)$/))){
      const rec = db.sync[decodeURIComponent(m[1])]; if (!rec) return Promise.reject(new Error('not found'));
      return Promise.resolve(rec);
    }
    return Promise.reject(new Error('unknown endpoint: '+path));
  }
  return {
    ready,
    isStatic: () => staticMode === true,
    async call(path, opts){
      await ready;
      if (staticMode) return handle(path.replace(/^\/api/, ''), opts);
      let url = '/api'+path;
      if (opts && opts.query){ const qs = new URLSearchParams(opts.query).toString(); if (qs) url += '?'+qs; }
      const r = await fetch(url, Object.assign({headers:{'Content-Type':'application/json'}}, opts,
        opts && opts.body ? {body: JSON.stringify(opts.body)} : {}));
      const j = await r.json().catch(()=>({error:'bad json'}));
      if (!r.ok){
        // сервер перезапущен с чистыми данными / группу удалили — само-лечимся
        if (j.error === 'group not found' && typeof S !== 'undefined' && S.group){
          S.group = null; save(); applyChrome();
          throw new Error('Группа больше не существует на сервере — создайте новую или войдите по коду');
        }
        if (j.error === 'group not found'){
          throw new Error('Группа с таким кодом не найдена — проверьте код');
        }
        if (typeof j.error === 'string' && j.error.includes('not found'))
          throw new Error('Запись не найдена — возможно, её уже удалили. Обновите страницу');
        throw new Error(j.error || r.status);
      }
      return j;
    }
  };
})();
async function api(path, opts={}){
  return Store.call(path, opts);
}

/* ---------------- i18n / theme ---------------- */
function applyChrome(){
  document.documentElement.dataset.theme = S.theme;
  document.documentElement.classList.toggle('no-anim', S.quality==='low');
  window.LANG = S.lang;
  $('#lang-select').value = S.lang;
  $('#global-search').placeholder = t('search_placeholder');
  const ab = $('#ai-btn'); if (ab) ab.onclick = ()=>AI.toggle();
  $('.small-print').textContent = t('disclaimer');
  $('#theme-btn').innerHTML = S.theme==='light'?ic('moon'):S.theme==='dark'?ic('sun'):ic('flame');
  buildDock();
}
let currentRoute = 'grades';

/* --- hand-made SVG icons for the dock --- */
const DOCK_ICONS = {
 academy:'<path d="M12 4 21 8.5 12 13 3 8.5Z"/><path d="M6.5 10.8V15c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8v-4.2"/><path d="M21 8.5v5.5"/>',
 search:'<circle cx="11" cy="11" r="6.2"/><path d="m15.8 15.8 5 5"/>',
 ref:'<path d="M5.5 5A2.5 2.5 0 0 1 8 2.5h10.5V19H8A2.5 2.5 0 0 0 5.5 21.5Z"/><path d="M5.5 19V5"/><path d="M12 6.5v6M9 9.5h6"/>',
 sims:'<path d="M12 20.5S4.6 16.2 2.9 11.6C1.7 8.3 3.8 5.2 7 5.2c2 0 3.7 1 5 2.7C13.3 6.2 15 5.2 17 5.2c3.2 0 5.3 3.1 4.1 6.4C19.4 16.2 12 20.5 12 20.5Z"/><path d="M6.2 11.5h2.6l1.4-2.7 2.9 5.6 1.4-2.9h3.3"/>',
 board:'<path d="M3.5 5h17v11.5h-17Z"/><path d="M12 16.5v3M8 20.5h8"/><path d="m6.5 11.5 3-3.5 2.5 3 2-2.5 3.5 4"/>',
 train:'<path d="M9.3 3.8a2.6 2.6 0 0 0-2.6 2.6v.5a2.8 2.8 0 0 0-2 2.7c0 .7.3 1.4.7 1.9a2.9 2.9 0 0 0-.6 1.8 2.9 2.9 0 0 0 1.9 2.7 2.7 2.7 0 0 0 2.6 2.3c1 0 1.9-.5 2.4-1.3V5.1a2.6 2.6 0 0 0-2.4-1.3Z"/><path d="M14.7 3.8a2.6 2.6 0 0 1 2.6 2.6v.5a2.8 2.8 0 0 1 2 2.7c0 .7-.3 1.4-.7 1.9a2.9 2.9 0 0 1 .6 1.8 2.9 2.9 0 0 1-1.9 2.7 2.7 2.7 0 0 1-2.6 2.3c-1 0-1.9-.5-2.4-1.3V5.1a2.6 2.6 0 0 1 2.4-1.3Z"/><path d="M12 5.1v13.6"/>',
 diary:'<rect x="5" y="3" width="14.5" height="18" rx="2.2"/><path d="M9.2 3v18"/><path d="M13 8.2h3.4M13 12h3.4"/>',
 set:'<path d="M4 7.2h8.6M16.4 7.2H20M4 12h2.6M10.4 12H20M4 16.8h10.6M18.4 16.8H20"/><circle cx="14.5" cy="7.2" r="1.9"/><circle cx="8.5" cy="12" r="1.9"/><circle cx="16.5" cy="16.8" r="1.9"/>'
};
const DOCK = [
 {key:'academy', lbl:{ru:'Учёба', uz:'O‘quv', en:'Study'}, icon:'academy', first:'grades',
  items:[['grades','nav_grades'],['calendar','nav_calendar'],['materials','nav_materials'],['errors','nav_errors']]},
 {key:'search', lbl:{ru:'Поиск', uz:'Qidiruv', en:'Search'}, icon:'search', first:'search',
  items:[['search','nav_search']]},
 {key:'ref', lbl:{ru:'Справка', uz:'Ma’lumot', en:'Ref'}, icon:'ref', first:'icd',
  items:[['icd','nav_icd'],['drugs','nav_drugs'],['labs','nav_labs'],['protocols','nav_protocols'],['calcs','nav_calc']]},
 {key:'sims', lbl:{ru:'Симуляторы', uz:'Simulyator', en:'Sims'}, icon:'sims', first:'pain',
  items:[['pain','nav_pain'],['auscult','nav_auscult'],['ecg','nav_ecg'],['atlas','nav_atlas']]},
 {key:'board', lbl:{ru:'Доска', uz:'Doska', en:'Board'}, icon:'board', first:'board',
  items:[['board','nav_board']]},
 {key:'train', lbl:{ru:'Тренажёры', uz:'Mashqlar', en:'Trainers'}, icon:'train', first:'patient',
  items:[['patient','nav_patient'],['tests','nav_tests'],['cards','nav_cards']]},
 {key:'diary', lbl:{ru:'Дневник', uz:'Kundalik', en:'Diary'}, icon:'diary', first:'curation',
  items:[['curation','nav_curation'],['skills','nav_skills'],['ops','nav_ops'],['cases','nav_cases'],['reflect','nav_reflect'],['duty','nav_duty']]},
 {key:'set', lbl:{ru:'Опции', uz:'Sozlash', en:'Options'}, icon:'set', first:'setgroup',
  items:[['setgroup','nav_lang'],['setlook','nav_look'],['setdata','nav_data'],['setnotif','nav_notif']]}
];
function buildDock(){
  const dock = $('#dock'); if (!dock) return;
  const cur = DOCK.find(d=>d.items.some(([r])=>r===currentRoute));
  dock.innerHTML = DOCK.map(d=>`
    <button class="dock-btn ${cur&&cur.key===d.key?'active':''}" data-dept="${d.key}" aria-label="${esc(d.lbl[window.LANG]||d.lbl.ru)}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${DOCK_ICONS[d.icon]}</svg>
      <span>${esc(d.lbl[window.LANG]||d.lbl.ru)}</span>
    </button>`).join('');
  dock.querySelectorAll('.dock-btn').forEach(b=>b.onclick=()=>dockTap(b.dataset.dept));
}
function dockTap(key){
  const d = DOCK.find(x=>x.key===key);
  const sheet = $('#dock-sheet');
  if (!d.items.some(([r])=>r===currentRoute)) go(d.first);
  if (sheet){
    sheet.innerHTML = `<div class="ds-head">${DOCK_ICONS[d.icon] ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${DOCK_ICONS[d.icon]}</svg>`:''}<b>${esc(d.lbl[window.LANG]||d.lbl.ru)}</b></div>` +
      d.items.map(([r,l])=>`
      <button class="dock-item ${r===currentRoute?'on':''}" data-dr="${r}">
        <span class="di"></span>${esc(t(l))}</button>`).join('');
    sheet.classList.remove('hidden');
    sheet.querySelectorAll('.dock-item').forEach(b=>b.onclick=()=>{ sheet.classList.add('hidden'); go(b.dataset.dr); });
  }
}
document.addEventListener('click', e=>{
  const sheet = $('#dock-sheet');
  if (sheet && !sheet.classList.contains('hidden') && !e.target.closest('#dock') && !e.target.closest('#dock-sheet'))
    sheet.classList.add('hidden');
});

function go(route, arg){
  stopSims();
  try{ Board.unmount(); }catch(_e){}
  currentRoute = route;
  $$('#nav .nav-item').forEach(b=>b.classList.toggle('active', b.dataset.route===route));
  const fn = ROUTES[route];
  $('#view').innerHTML = fn ? fn(arg) : '<div class="empty">404</div>';
  $('#view').scrollTop = 0;
  if (fn && fn.after) fn.after(arg);
  buildDock();
}
function stopSims(){ if (window.ECGRen) ECGRen.stop(); if (window.Ausc) Ausc.stop(); }

/* ---------------- PDF export (jsPDF + DejaVu, кириллица) ---------------- */
const PDFX = (function(){
  let loading = null;
  function ensure(){
    if (window.jspdf && window.DEJAVU_SANS_B64) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((res, rej)=>{
      const s1 = document.createElement('script'); s1.src = 'vendor/jspdf.umd.min.js';
      s1.onload = () => {
        const s2 = document.createElement('script'); s2.src = 'vendor/font-dejavu.js';
        s2.onload = () => { try {
          const {jsPDF} = window.jspdf;
          const d = new jsPDF();
          d.addFileToVFS('DejaVu.ttf', window.DEJAVU_SANS_B64);
          d.addFont('DejaVu.ttf', 'DejaVu', 'normal');
          d.addFont('DejaVu.ttf', 'DejaVu', 'bold');
          res();
        } catch(e){ rej(e); } };
        s2.onerror = rej; document.head.appendChild(s2);
      };
      s1.onerror = rej; document.head.appendChild(s1);
    });
    return loading;
  }
  async function download(filename, title, blocks){
    await ensure();
    const {jsPDF} = window.jspdf;
    const doc = new jsPDF({unit:'mm', format:'a4'});
    doc.addFileToVFS('DejaVu.ttf', window.DEJAVU_SANS_B64);
    doc.addFont('DejaVu.ttf', 'DejaVu', 'normal');
    doc.addFont('DejaVu.ttf', 'DejaVu', 'bold');
    const W=210, M=15, BOT=283; let y=18;
    doc.setFont('DejaVu','bold'); doc.setFontSize(16); doc.setTextColor(25,35,60);
    doc.text(title, M, y); y+=7;
    doc.setFont('DejaVu','normal'); doc.setFontSize(9); doc.setTextColor(130);
    doc.text('MedHub · '+new Date().toLocaleString(), M, y); y+=8;
    doc.setTextColor(25);
    const para = (txt, size, bold, gap)=>{
      doc.setFont('DejaVu', bold?'bold':'normal'); doc.setFontSize(size);
      const lines = doc.splitTextToSize(String(txt??''), W-M*2);
      const lh = size*0.46;
      for (const ln of lines){
        if (y+lh > BOT){ doc.addPage(); y=18; }
        doc.text(ln, M, y); y += lh;
      }
      y += gap;
    };
    for (const b of blocks){
      if (b.h !== undefined) para(b.h, 13, true, 2.5);
      else if (b.p !== undefined) para(b.p, 10.5, false, 3);
      else if (b.kv){ para(b.kv[0]+': '+b.kv[1], 10.5, false, 1.5); }
      else if (b.table){
        const cols = b.table.head, rows = b.table.rows, colW = (W-M*2)/cols.length;
        if (y+10 > BOT){ doc.addPage(); y=18; }
        doc.setFont('DejaVu','bold'); doc.setFontSize(9.5);
        cols.forEach((c,i)=>doc.text(String(c).slice(0,40), M+i*colW, y));
        y+=2; doc.setDrawColor(150); doc.line(M,y,W-M,y); y+=4.5;
        doc.setFont('DejaVu','normal'); doc.setFontSize(9);
        for (const r of rows){
          const cl = r.map(c=>doc.splitTextToSize(String(c??''), colW-2));
          const rh = Math.max(1,...cl.map(l=>l.length))*4.1+1.5;
          if (y+rh > BOT){ doc.addPage(); y=18; }
          r.forEach((c,i)=>doc.text(cl[i], M+i*colW, y));
          y += rh;
          doc.setDrawColor(230); doc.line(M,y,W-M,y); y+=2;
        }
        y+=3;
      }
    }
    doc.save(filename);
  }
  return {download};
})();

/* ---------------- ui helpers ---------------- */
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.remove('hidden');
  clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.add('hidden'), 2600); }
function dlg(html){ const d=document.createElement('dialog'); d.innerHTML=html; document.body.appendChild(d);
  d.showModal(); d.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>d.close());
  d.addEventListener('close',()=>d.remove()); return d; }
function csv(name, rows){
  const data = rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(';')).join('\n');
  const blob = new Blob(['\uFEFF'+data],{type:'text/csv;charset=utf-8'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click();
}
function download(name, text){ const blob=new Blob([text],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); }
const head = (ttl, hint, extra='') => `<div class="page-head"><h2>${esc(ttl)}</h2>${hint?`<p>${esc(hint)}</p>`:''}${extra}</div>`;
const visSelect = (cur='group') => `<label class="f">${t('visibility')}</label>
  <select id="f-vis"><option value="private" ${cur==='private'?'selected':''}>${t('vis_private')}</option>
  <option value="group" ${cur==='group'?'selected':''}>${t('vis_group')}</option>
  <option value="public" ${cur==='public'?'selected':''}>${t('vis_public')}</option></select>`;
const visIcon = v => v==='private'?ic('lock'):v==='public'?ic('globe'):ic('users');

/* --- real anatomy mapping for pain zones --- */
const ZONE_ANAT = {head:'anat_nerves',face:'anat_nerves',eye:'anat_nerves',ear:'anat_nerves',throat:'anat_nerves',neck:'anat_nerves',
 heart:'anat_heart',chest_l:'anat_resp',chest_r:'anat_resp',breast:'anat_resp',
 epigastrium:'anat_digestive',ruq:'anat_digestive',luq:'anat_digestive',umbilical:'anat_digestive',rlq:'anat_digestive',llq:'anat_digestive',
 hypogastrium:'anat_urinary',lowback:'anat_urinary',groin:'anat_urinary',
 shoulder:'anat_skeleton',elbow:'anat_skeleton',wrist:'anat_skeleton',hand:'anat_skeleton',
 hip:'anat_skeleton',knee:'anat_skeleton',ankle:'anat_skeleton',foot:'anat_skeleton',skin:'anat_organs'};
const anatBy = k => window.ANAT_LIB.find(a=>a.k===k);

/* =========================================================
   ROUTES
========================================================= */
const ROUTES = {};

/* ---------- 1. GRADES ---------- */
ROUTES.grades = function(){
  const gpa = S.grades.length ? (S.grades.reduce((a,g)=>a+g.grade,0)/S.grades.length) : 0;
  const byCourse = {};
  for (let c=1;c<=6;c++){ const arr = S.grades.filter(g=>g.course===c);
    byCourse[c] = arr.length ? arr.reduce((a,g)=>a+g.grade,0)/arr.length : null; }
  return head(t('nav_grades'), t('grades_hint')) + `
  <div class="grid g4">
    <div class="stat"><div class="num">${gpa?gpa.toFixed(2):'—'}</div><div class="lbl">${t('gpa')}</div></div>
    <div class="stat"><div class="num">${S.grades.length}</div><div class="lbl">${t('total')} ${t('grade').toLowerCase()}</div></div>
    <div class="stat"><div class="num">${[...new Set(S.grades.map(g=>g.subject))].length}</div><div class="lbl">${t('subject')}</div></div>
    <div class="stat"><div class="num">${Object.entries(byCourse).filter(([,v])=>v).length}</div><div class="lbl">${t('by_course')}</div></div>
  </div>
  <div class="card">
    <h3>${t('by_course')}</h3>
    <div>${[1,2,3,4,5,6].map(c=>{ const v=byCourse[c];
      return `<div style="display:flex;align-items:center;gap:10px;margin:6px 0">
        <span style="width:64px;font-size:.8rem" class="muted">${t('course'+c)}</span>
        <div class="progressbar" style="flex:1"><div style="width:${v?(v/5*100):0}%"></div></div>
        <b style="width:36px;text-align:right">${v?v.toFixed(2):'—'}</b></div>`; }).join('')}</div>
  </div>
  <div class="card"><h3>${t('trend')}</h3><canvas id="gpa-chart" height="180" style="width:100%"></canvas></div>
  <div class="card">
    <h3>${t('add_grade')}</h3>
    <div class="formrow g2">
      <div><label class="f">${t('subject')}</label><select id="g-sub">${window.SUBJECTS.map(s=>
        `<option value="${esc(s.n)}" data-c="${s.c}">${t('course'+s.c)} — ${esc(s.n)}</option>`).join('')}</select></div>
      <div><label class="f">${t('grade')} (2–5)</label><input type="number" id="g-grade" min="2" max="5" step="1" value="5"></div>
    </div>
    <div class="formrow g2">
      <div><label class="f">${t('credits')}</label><input type="number" id="g-cred" min="1" max="12" value="3"></div>
      <div><label class="f">${t('date')}</label><input type="date" id="g-date" value="${todayISO()}"></div>
    </div>
    <div id="g-member-box"></div>
    <p><button class="btn" id="g-add">＋ ${t('add')}</button></p>
  </div>
  <div class="card"><h3>${S.group&&S.group.me.role==='admin'?t('grades_all'):t('subject')}</h3><div id="g-tables"><div class="empty">${t('loading')}</div></div>
    <p><button class="btn secondary small" id="g-pdf">${ic('download')} PDF</button></p>
  </div>`;
};
ROUTES.grades.after = function(){
  $('#g-add').onclick = () => {
    const sub = $('#g-sub'); const grade = +$('#g-grade').value;
    if (!sub.value || grade<2 || grade>5) return toast(t('required'));
    S.grades.push({id:uid(), subject:sub.value, course:+sub.selectedOptions[0].dataset.c, grade, cred:+$('#g-cred').value||null, date:$('#g-date').value||todayISO()});
    save(); toast(t('saved'));
    if (S.group){
      const ms = $('#g-member');
      const memberId = (S.group.me.role==='admin' && ms && ms.value) ? ms.value : S.group.me.id;
      api(`/groups/${S.group.code}/grades`, {method:'POST', body:{memberId, authorName:S.group.me.name,
        subject:sub.value, course:+sub.selectedOptions[0].dataset.c, grade, cred:+$('#g-cred').value||null,
        date:$('#g-date').value||todayISO()}}).catch(e=>toast(e.message));
    }
    go('grades');
  };
  $$('[data-del]').forEach(b=>b.onclick=()=>{ S.grades = S.grades.filter(g=>g.id!==b.dataset.del); save(); go('grades'); });
  function gradeTable(rows){
    return `<div class="table-wrap"><table><thead><tr><th>${t('subject')}</th><th>${t('course')}</th><th>${t('grade')}</th><th>${t('credits')}</th><th>${t('date')}</th></tr></thead>
    <tbody>${rows.slice().sort((a,b)=>(b.ts||0)-(a.ts||0)).map(g=>`
      <tr><td>${esc(g.subject)}</td><td>${t('course'+(g.course||1))}</td><td><b>${g.grade}</b></td><td>${g.cred||'—'}</td><td>${g.date||''}</td></tr>`).join('') ||
      `<tr><td colspan="5" class="muted">${t('empty')}</td></tr>`}</tbody></table></div>`;
  }
  (async ()=>{
    const box = $('#g-tables'); if (!box) return;
    if (!S.group){ box.innerHTML = gradeTable(S.grades); return; }
    try{
      const {group:grp} = await api(`/groups/${S.group.code}`);
      const grades = (await api(`/groups/${S.group.code}/grades`)).grades || [];
      const isAdmin = S.group.me.role==='admin';
      if (isAdmin){
        const mb = $('#g-member-box');
        if (mb && !mb.innerHTML) mb.innerHTML = `<label class="f">${t('grade_for')}</label><select id="g-member">${grp.members.map(m=>`<option value="${m.id}"${m.id===S.group.me.id?' selected':''}>${esc(m.name)}${m.role==='admin'?' ★':''}</option>`).join('')}</select>`;
        box.innerHTML = grp.members.map(m=>{
          const rows = grades.filter(g=>g.memberId===m.id);
          const avg = rows.length ? (rows.reduce((a,g)=>a+g.grade,0)/rows.length).toFixed(2) : '—';
          return `<h3 style="font-size:.95rem;margin:14px 0 6px">${m.role==='admin'?ic('crown'):ic('grad')} ${esc(m.name)} <span class="muted">· GPA ${avg}</span></h3>` + gradeTable(rows);
        }).join('') || `<div class="empty">${t('empty')}</div>`;
      } else {
        box.innerHTML = gradeTable(grades.filter(g=>g.memberId===S.group.me.id).concat(S.grades));
      }
    }catch(e){ box.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
  })();
  $('#g-pdf').onclick = ()=>PDFX.download('medhub-ocenki.pdf', t('nav_grades'), [
    {kv:[t('gpa'), S.grades.length ? (S.grades.reduce((a,g)=>a+g.grade,0)/S.grades.length).toFixed(2) : '—']},
    {table:{head:[t('subject'),t('course'),t('grade'),t('credits'),t('date')],
      rows:S.grades.map(g=>[g.subject,t('course'+g.course),g.grade,g.cred||'—',g.date])}}]);
  // trend chart: running average of grades sorted by date
  const cv = $('#gpa-chart'); if (cv){ const ctx = cv.getContext('2d'); cv.width = cv.offsetWidth;
    const pts = S.grades.slice().sort((a,b)=>a.date<b.date?-1:1);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent');
    ctx.lineWidth = 2; ctx.beginPath();
    const w = cv.width, h = 180;
    pts.forEach((g,i)=>{ const x = 20 + i*(w-40)/Math.max(pts.length-1,1);
      const y = h - ((g.grade-2)/3)*(h-40) - 20;
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
    if (pts.length) ctx.stroke();
    ctx.fillStyle = ctx.strokeStyle; pts.forEach((g,i)=>{ const x = 20 + i*(w-40)/Math.max(pts.length-1,1);
      const y = h - ((g.grade-2)/3)*(h-40) - 20; ctx.beginPath(); ctx.arc(x,y,3.5,0,7); ctx.fill(); });
    if (!pts.length){ ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted');
      ctx.font='13px sans-serif'; ctx.textAlign='center'; ctx.fillText(t('empty'), w/2, h/2); }
  }
};

/* ---------- 2. CALENDAR ---------- */
let calMonth = new Date();
ROUTES.calendar = function(){
  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  const first = new Date(y,m,1), startDow = (first.getDay()+6)%7;
  const dim = new Date(y,m+1,0).getDate();
  const evByDate = {};
  S.events.forEach(e=>{ (evByDate[e.date]=evByDate[e.date]||[]).push(e); });
  let cells = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d=>`<div class="dow">${d}</div>`).join('');
  for (let i=0;i<startDow;i++) cells += `<div class="day other"></div>`;
  for (let d=1;d<=dim;d++){
    const iso = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const evs = (evByDate[iso]||[]);
    cells += `<div class="day ${iso===todayISO()?'today':''}" data-date="${iso}">
      <div class="dnum">${d}</div>${evs.map(e=>`<div class="ev ${e.type}" title="${esc(e.title||t('ev_'+e.type))}">${esc(e.title||t('ev_'+e.type))}</div>`).join('')}</div>`;
  }
  const upcoming = S.events.filter(e=>e.date>=todayISO()).sort((a,b)=>a.date<b.date?-1:1).slice(0,8)
    .map(e=>`<div class="entry tight"><div class="meta"><span class="badge ${e.type==='exam'?'bad':e.type==='colloq'||e.type==='test'?'warn':'ok'}">${t('ev_'+e.type)}</span>
      <b>${e.date}</b> ${e.time?esc(e.time):''} · ${daysBetween(todayISO(),e.date)} ${t('days_left')}</div>
      <div><b>${esc(e.title||t('ev_'+e.type))}</b>${e.subject?` · ${esc(e.subject)}`:''}
      <button class="btn small danger" style="float:right" data-evdel="${e.id}">${ic('trash')}</button></div></div>`).join('') ||
    `<div class="empty">${t('ev_none')}</div>`;
  return head(t('nav_calendar'), t('cal_hint')) + `
  <div class="card">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <button class="btn secondary small" id="cal-prev">←</button>
      <b style="flex:1;text-align:center;font-size:1.05rem">${calMonth.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</b>
      <button class="btn secondary small" id="cal-next">→</button>
      <button class="btn small" id="cal-add">＋ ${t('add_event')}</button>
      <button class="btn small secondary" id="cal-pdf">${ic('download')} PDF</button>
    </div>
    <div class="cal">${cells}</div>
  </div>
  <div class="card"><h3>${t('upcoming')}</h3>${upcoming}</div>`;
};
ROUTES.calendar.after = function(){
  $('#cal-prev').onclick = ()=>{ calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth()-1, 1); go('calendar'); };
  $('#cal-next').onclick = ()=>{ calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth()+1, 1); go('calendar'); };
  $('#cal-pdf').onclick = ()=>PDFX.download('medhub-calendar.pdf', t('nav_calendar'), [
    {table:{head:[t('date'),t('type'),t('title'),t('subject')],
      rows:S.events.filter(e=>e.date>=todayISO()).sort((a,b)=>a.date<b.date?-1:1)
        .map(e=>[e.date, t('ev_'+e.type), e.title||t('ev_'+e.type), e.subject||'—'])}}]);
  $$('.cal .day[data-date]').forEach(d=>d.onclick=()=>addEventDialog(d.dataset.date));
  $('#cal-add').onclick = ()=>addEventDialog(todayISO());
  $$('[data-evdel]').forEach(b=>b.onclick=()=>{ S.events = S.events.filter(e=>e.id!==b.dataset.evdel); save(); go('calendar'); });
};
function addEventDialog(date){
  const d = dlg(`<h3>${t('add_event')}</h3>
    <label class="f">${t('date')}</label><input type="date" id="ev-date" value="${date}">
    <label class="f">${t('type')}</label><select id="ev-type">
      ${['lecture','practice','colloq','test','exam','duty'].map(x=>`<option value="${x}">${t('ev_'+x)}</option>`).join('')}</select>
    <label class="f">${t('title')}</label><input type="text" id="ev-title" placeholder="">
    <label class="f">${t('subject')}</label><select id="ev-sub"><option value="">—</option>${window.SUBJECTS.map(s=>`<option>${esc(s.n)}</option>`).join('')}</select>
    <label class="f">⏰</label><input type="time" id="ev-time">
    <p style="display:flex;gap:10px;margin-top:14px"><button class="btn" id="ev-ok">${t('save')}</button>
    <button class="btn secondary" data-close>${t('cancel')}</button></p>`);
  d.querySelector('#ev-ok').onclick = ()=>{
    S.events.push({id:uid(), date:d.querySelector('#ev-date').value||todayISO(),
      type:d.querySelector('#ev-type').value, title:d.querySelector('#ev-title').value.trim(),
      subject:d.querySelector('#ev-sub').value, time:d.querySelector('#ev-time').value});
    save(); d.close(); toast(t('saved')); go('calendar');
  };
}

/* ---------- feeds (materials / errors / cases / duty-swaps) ---------- */
function localFeed(type){
  return (S.localFeed[type]||[]).slice().sort((a,b)=>b.ts-a.ts);
}
function feedBanner(){
  if (S.group) return `<div class="entry tight" style="background:var(--panel2);margin-bottom:10px">
    <span class="badge ok">${ic('users')} ${esc(S.group.name)}</span> <span class="muted" style="font-size:.8rem">код: ${esc(S.group.code)}</span>
    <span class="muted" style="font-size:.8rem"> · записи видят все участники</span></div>`;
  return `<div class="entry tight" style="background:var(--panel2);margin-bottom:10px">
    ${ic('box')}<span class="muted" style="font-size:.85rem"> ${t('local_hint')}</span>
    <a href="#" data-goto="setgroup" style="font-size:.85rem;margin-left:6px">→ ${t('set_group_create')}</a></div>`;
}
let feedScope = 'group';
const feedScopeBar = () => (Store.isStatic && Store.isStatic()) ? '' :
  `<div class="feed-tabs">
    <button class="ftab${feedScope==='group'?' on':''}" data-fs="group">${ic('users')} ${t('feed_group')}</button>
    <button class="ftab${feedScope==='public'?' on':''}" data-fs="public">${ic('globe')} ${t('feed_public')}</button></div>`;
function bindScopeBar(box, refresh){
  box.querySelectorAll('.ftab').forEach(b=>b.onclick=()=>{ feedScope=b.dataset.fs; refresh(); });
}
async function fetchFeed(type){
  if (feedScope==='public'){
    try { return (await api('/feed', {query:{type}})).entries; } catch { return null; }
  }
  if (!S.group) return localFeed(type);
  try { const j = await api(`/groups/${S.group.code}/feed`, {query:{type}}); return j.entries; }
  catch { return null; }
}
function entryHtml(e, extra=''){
  const mine = S.group && e.authorId === S.group.me.id;
  return `<div class="entry" data-eid="${e.id}">
    <div class="meta">${visIcon(e.visibility)} <b>${esc(e.authorName)}</b>${e.groupName?` <span class="badge">${ic('users')} ${esc(e.groupName)}</span>`:''} · ${fmtD(e.ts)}</div>
    ${e.title?`<div><b>${esc(e.title)}</b></div>`:''}
    ${e.meta&&e.meta.link?`<div>${ic('link')} <a href="${esc(e.meta.link)}" target="_blank" rel="noopener">${esc(e.meta.link)}</a></div>`:''}
    ${e.body?`<div class="body">${esc(e.body)}</div>`:''}
    ${extra}
    ${((S.group&&e.group===S.group.code)&&(mine||(S.group&&S.group.me.role==='admin')))?`<div class="entry-actions"><button class="btn small danger" data-edel="${e.id}">${ic('trash')}</button></div>`:''}
  </div>`;
}
function bindFeedActions(container, type, refresh){
  container.querySelectorAll('[data-edel]').forEach(b=>b.onclick=async()=>{
    if (!confirm(t('confirm_delete'))) return;
    if (!S.group){
      S.localFeed[type] = (S.localFeed[type]||[]).filter(x=>x.id!==b.dataset.edel);
      save(); return refresh();
    }
    try { await api(`/groups/${S.group.code}/entries/${b.dataset.edel}`, {method:'DELETE',
      body:{memberId:S.group.me.id, adminKey:S.group.adminKey}}); refresh(); }
    catch(e){ toast(e.message); }
  });
}
function shareDialog(type, fields, buildBody, title){
  const fieldsHtml = fields.map(f=>`<label class="f">${esc(f.l)}</label>${
    f.t==='area' ? `<textarea id="fd-${f.k}"></textarea>` :
    f.t==='sel' ? `<select id="fd-${f.k}">${f.o.map(o=>`<option>${esc(o)}</option>`).join('')}</select>` :
    `<input type="text" id="fd-${f.k}" placeholder="${esc(f.ph||'')}">`}`).join('');
  const needGroup = type!=='note';
  const d = dlg(`<h3>${esc(title)}</h3>${fieldsHtml}
    ${needGroup?visSelect():''}
    <p style="display:flex;gap:10px;margin-top:14px"><button class="btn" id="fd-ok">${t('feed_post')}</button>
    <button class="btn secondary" data-close>${t('cancel')}</button></p>`);
  d.querySelector('#fd-ok').onclick = async ()=>{
    const vals = {}; fields.forEach(f=>vals[f.k]=d.querySelector('#fd-'+f.k).value.trim());
    const {body, title:et, meta} = buildBody(vals);
    if (S.group){
      try { await api(`/groups/${S.group.code}/entries`, {method:'POST', body:{
        type, authorId:S.group.me.id, authorName:S.group.me.name, title:et, body, meta,
        visibility: d.querySelector('#f-vis') ? d.querySelector('#f-vis').value : 'group'}});
        d.close(); toast(t('posted')); }
      catch(e){ toast(e.message); }
    } else { // offline: keep locally in diary-ish storage
      S.reflectFallback = S.reflectFallback||[];
      d.close(); toast(t('set_group_join')+' → ' + t('feed_post'));
    }
  };
}

/* ---------- MATERIALS ---------- */
ROUTES.materials = function(){
  return head(t('nav_materials'), t('materials_hint')) + `
  <div class="card"><h3>${t('add_material')}</h3>
    <label class="f">${t('title')}</label><input type="text" id="m-title">
    <label class="f">${t('link')}</label><input type="url" id="m-link" placeholder="https://…">
    <label class="f">${t('body')}</label><textarea id="m-body" placeholder="${t('file_note')}"></textarea>
    ${visSelect()}
    <p><button class="btn" id="m-post">${ic('send')} ${t('feed_post')}</button></p>
  </div>
  <div id="mat-feed"><div class="empty">${t('loading')}</div></div>`;
};
ROUTES.materials.after = async function(){
  const refresh = async ()=>{
    const box = $('#mat-feed');
    const entries = (await fetchFeed('material')) || [];
    box.innerHTML = feedScopeBar() + feedBanner() + ((entries.length) ? entries.map(e=>entryHtml(e)).join('') : `<div class="empty">${t('feed_empty')}</div>`);
    bindFeedActions(box, 'material', refresh); bindScopeBar(box, refresh);
  };
  $('#m-post').onclick = async ()=>{
    const title=$('#m-title').value.trim(), link=$('#m-link').value.trim(), body=$('#m-body').value.trim();
    if (!title && !link && !body) return toast(t('required'));
    if (!S.group){
      S.localFeed.material = S.localFeed.material||[];
      S.localFeed.material.unshift({id:uid(), ts:Date.now(), authorName:'Я', title, body, meta:{link}, visibility:'private'});
      save(); toast(t('saved')); $('#m-title').value=$('#m-link').value=$('#m-body').value=''; return refresh();
    }
    try { await api(`/groups/${S.group.code}/entries`,{method:'POST',body:{type:'material',
      authorId:S.group.me.id, authorName:S.group.me.name, title, body, meta:{link},
      visibility:$('#f-vis').value}}); toast(t('posted')); $('#m-title').value=$('#m-link').value=$('#m-body').value=''; refresh(); }
    catch(e){ toast(e.message); }
  };
  refresh();
};

/* ---------- ERRORS feed ---------- */
ROUTES.errors = function(){
  return head(t('nav_errors'), t('errors_hint')) + `
  <div class="card"><h3>${t('add_error')}</h3>
    <label class="f">${t('q_asked')}</label><textarea id="e-q"></textarea>
    <div class="formrow g2">
      <div><label class="f">${t('wrong_ans')}</label><textarea id="e-wrong"></textarea></div>
      <div><label class="f">${t('right_ans')}</label><textarea id="e-right"></textarea></div>
    </div>
    <label class="f">${t('lesson')}</label><textarea id="e-lesson"></textarea>
    <label class="f">${t('subject')}</label><select id="e-sub"><option value="">—</option>${window.SUBJECTS.map(s=>`<option>${esc(s.n)}</option>`).join('')}</select>
    <p><button class="btn" id="e-post">${ic('send')} ${t('feed_post')}</button></p>
  </div>
  <div id="err-feed"><div class="empty">${t('loading')}</div></div>`;
};
ROUTES.errors.after = async function(){
  const refresh = async ()=>{
    const box = $('#err-feed');
    const entries = (await fetchFeed('error')) || [];
    box.innerHTML = feedScopeBar() + feedBanner() + ((entries&&entries.length) ? entries.map(e=>{
      const html = entryHtml(e, `<div class="comment">${ic('x')} <b>${t('wrong_ans')}:</b> ${esc(e.meta&&e.meta.wrong||'—')}</div>
        <div class="comment">${ic('check')} <b>${t('right_ans')}:</b> ${esc(e.meta&&e.meta.right||'—')}</div>
        ${e.meta&&e.meta.lesson?`<div class="comment">${ic('info')} ${esc(e.meta.lesson)}</div>`:''}`);
      return html; }).join('') : `<div class="empty">${t('feed_empty')}</div>`);
    bindFeedActions(box, 'error', refresh); bindScopeBar(box, refresh);
  };
  $('#e-post').onclick = async ()=>{
    const q=$('#e-q').value.trim(), wrong=$('#e-wrong').value.trim(), right=$('#e-right').value.trim(), lesson=$('#e-lesson').value.trim();
    if (!q || !right) return toast(t('required'));
    if (!S.group){
      S.localFeed.error = S.localFeed.error||[];
      S.localFeed.error.unshift({id:uid(), ts:Date.now(), authorName:'Я', title:$('#e-sub').value, body:q,
        meta:{wrong, right, lesson}, visibility:'private'});
      save(); toast(t('saved')); $('#e-q').value=''; return refresh();
    }
    try { await api(`/groups/${S.group.code}/entries`,{method:'POST',body:{type:'error',
      authorId:S.group.me.id, authorName:S.group.me.name, title:$('#e-sub').value, body:q,
      meta:{wrong, right, lesson}, visibility:'group'}});
      toast(t('posted')); $('#e-q').value=''; refresh(); }
    catch(e){ toast(e.message); }
  };
  refresh();
};

/* ---------- SMART SEARCH ---------- */
ROUTES.search = function(q){
  return head(t('nav_search')) + `
  <div class="card">
    <div class="search-wrap" style="max-width:100%">
      <input id="s-in" type="search" value="${esc(q||'')}" placeholder="${t('search_placeholder')}">
      <button class="btn" id="s-go">${ic('search')} ${t('search_btn')}</button>
    </div>
    <div class="chiprow" id="s-scope">
      <button class="chip on" data-sc="lib">${ic('book')} ${t('search_scope_lib')}</button>
      <button class="chip" data-sc="notes">${ic('doc')} ${t('search_scope_notes')}</button>
      <button class="chip" data-sc="web">${ic('globe')} ${t('search_scope_web')}</button>
    </div>
    <div class="chiprow hidden" id="s-ct">
      ${[['books',t('ct_books')],['articles',t('ct_articles')],['cheats',t('ct_cheats')],['video',t('ct_video')]]
        .map(([k,l],i)=>`<button class="chip ${i===0?'on':''}" data-ct="${k}">${l}</button>`).join('')}
    </div>
  </div>
  <div id="s-results"></div>`;
};
ROUTES.search.after = function(q){
  let scope = 'lib', ct = 'books';
  $$('#s-scope .chip').forEach(b=>b.onclick=()=>{ scope=b.dataset.sc;
    $$('#s-scope .chip').forEach(x=>x.classList.toggle('on',x===b));
    $('#s-ct').classList.toggle('hidden', scope!=='web');
    run(); });
  $$('#s-ct .chip').forEach(b=>b.onclick=()=>{ ct=b.dataset.ct;
    $$('#s-ct .chip').forEach(x=>x.classList.toggle('on',x===b)); run(); });
  $('#s-go').onclick = run;
  $('#s-in').addEventListener('keydown', e=>{ if(e.key==='Enter') run(); });
  if (q) run();
  function run(){
    const q = $('#s-in').value.trim(); const box = $('#s-results');
    if (!q){ box.innerHTML=''; return; }
    const ql = q.toLowerCase();
    if (scope === 'web'){
      const enc = encodeURIComponent(q);
      const srcs = {
        books:[[`https://www.google.com/search?q=${enc}+site:drive.google.com+OR+filetype:pdf+медицина+учебник`,'Google: учебники PDF'],
               [`https://openlibrary.org/search?q=${enc}`,'Open Library']],
        articles:[[`https://pubmed.ncbi.nlm.nih.gov/?term=${enc}`,'PubMed'],
               [`https://scholar.google.com/scholar?q=${enc}`,'Google Scholar'],
               [`https://www.cochranelibrary.com/search?q=${enc}`,'Cochrane Library']],
        cheats:[[`https://www.google.com/search?q=${enc}+конспект+шпаргалка+медицина`,'Google: конспекты'],
               [`https://ru.wikibooks.org/w/index.php?search=${enc}`,'Wikibooks']],
        video:[[`https://www.youtube.com/results?search_query=${enc}+медицина+лекция`,'YouTube'],
               [`https://www.youtube.com/results?search_query=${enc}+osmosis`,'YouTube (Osmosis)']]
      }[ct];
      box.innerHTML = `<div class="card"><h3>${t('web_hint')}</h3>
        ${srcs.map(([u,l])=>`<p><a class="btn secondary small" href="${u}" target="_blank" rel="noopener">${l} ↗</a></p>`).join('')}</div>`;
      return;
    }
    const res = [];
    if (scope === 'lib'){
      for (const r of window.ICD10) if ((r.c+' '+r.ru+' '+r.en).toLowerCase().includes(ql))
        res.push({where:'ICD-10', title:`${r.c} — ${r.ru}`, sub:r.en, route:'icd'});
      for (const d of window.DRUGS) if ((d.n+' '+d.ind+' '+d.cl).toLowerCase().includes(ql))
        res.push({where:t('nav_drugs'), title:d.n, sub:d.ind, route:'drugs'});
      for (const l of window.LABS) if ((l.a+' '+(l.m||'')+(l.f||'')).toLowerCase().includes(ql))
        res.push({where:t('nav_labs'), title:l.a, sub:`${l.m||''} ${l.f&&l.f!==l.m?'| '+l.f:''}`, route:'labs'});
      for (const p of window.PROTOCOLS) if ((p.t+' '+p.cat).toLowerCase().includes(ql))
        res.push({where:t('nav_protocols'), title:p.t, sub:p.cat, route:'protocols'});
      for (const c of window.CALCS) if (c.n.toLowerCase().includes(ql))
        res.push({where:t('nav_calc'), title:c.n, sub:'', route:'calcs'});
      for (const z of window.PAIN_ZONES) if ((z.n+' '+z.causes).toLowerCase().includes(ql))
        res.push({where:t('nav_pain'), title:z.n, sub:z.causes.slice(0,80)+'…', route:'pain'});
      for (const e of window.ECGS) if ((e.n+' '+e.cat).toLowerCase().includes(ql))
        res.push({where:t('nav_ecg'), title:e.n, sub:e.findings.slice(0,90)+'…', route:'ecg'});
      for (const a of window.ATLAS) if ((a.t+' '+a.find).toLowerCase().includes(ql))
        res.push({where:t('nav_atlas'), title:a.t, sub:a.find.slice(0,90)+'…', route:'atlas'});
      for (const s of window.SOUNDS) if (s.n.toLowerCase().includes(ql))
        res.push({where:t('nav_auscult'), title:s.n, sub:s.meaning, route:'auscult'});
      for (const p of window.PROTOCOLS){ if (p.steps.some(s=>s.toLowerCase().includes(ql)))
        res.push({where:t('nav_protocols'), title:p.t, sub:'…'+p.steps.find(s=>s.toLowerCase().includes(ql)).slice(0,90)+'…', route:'protocols'}); }
    } else {
      for (const c of S.cards) if ((c.f+' '+c.b+' '+(c.deck||'')).toLowerCase().includes(ql))
        res.push({where:t('nav_cards'), title:c.f, sub:c.b, route:'cards'});
      for (const d of S.diary) if ((d.cc+' '+d.diag+' '+(d.status||'')+' '+(d.plan||'')).toLowerCase().includes(ql))
        res.push({where:t('nav_curation'), title:d.diag||t('nav_curation'), sub:d.cc.slice(0,90), route:'curation'});
      for (const r of S.reflect) if ((r.sit+' '+r.err+' '+(r.lesson||'')).toLowerCase().includes(ql))
        res.push({where:t('nav_reflect'), title:r.sit.slice(0,60), sub:r.err.slice(0,90), route:'reflect'});
      for (const e of S.events) if ((e.title+' '+(e.subject||'')).toLowerCase().includes(ql))
        res.push({where:t('nav_calendar'), title:e.title||t('ev_'+e.type), sub:e.date, route:'calendar'});
      for (const g of S.grades) if (g.subject.toLowerCase().includes(ql))
        res.push({where:t('nav_grades'), title:g.subject, sub:`${t('grade')}: ${g.grade}`, route:'grades'});
    }
    box.innerHTML = res.length ? `<div class="muted" style="margin:8px 0">${t('results_in')}: ${res.length}</div>` +
      res.slice(0,40).map(r=>`<div class="sr"><div class="where">${esc(r.where)}</div>
        <a href="#" data-route="${r.route}">${esc(r.title)}</a>${r.sub?`<div class="muted" style="font-size:.82rem">${esc(r.sub)}</div>`:''}</div>`).join('')
      : `<div class="empty">${t('empty')}</div>`;
    box.querySelectorAll('[data-route]').forEach(a=>a.onclick=e=>{e.preventDefault(); go(a.dataset.route);});
  }
};

/* ---------- ICD ---------- */
ROUTES.icd = function(){
  return head(t('nav_icd'), t('icd_hint')) + `
  <div class="card"><input type="search" id="icd-q" placeholder="${t('search')}…"></div>
  <div class="card"><div id="icd-list" class="table-wrap"></div></div>
  <div class="card"><h3>${t('icd11_title')}</h3><p class="muted" style="font-size:.85rem">${t('icd11_hint')}</p>
    <div class="table-wrap"><table><tbody>
      ${window.ICD11_CODES.map(c=>`<tr><td><b>${c[0]}</b></td><td>${esc(c[1])}</td></tr>`).join('')}
    </tbody></table></div>
    <details style="margin-top:8px"><summary class="muted">${t('icd11_title')} — ${t('group_lab')} (главы)</summary>
      <div class="chiprow">${window.ICD11_CHAPTERS.map(c=>`<span class="badge">${c[0]} ${esc(c[1])}</span>`).join('')}</div>
    </details>
    <p><a href="https://icd.who.int/browse/2024-01/mms/ru" target="_blank" rel="noopener">WHO ICD-11 ↗</a></p>
  </div>`;
};
ROUTES.icd.after = function(){
  const draw = ()=>{
    const q = ($('#icd-q').value||'').toLowerCase().trim();
    const rows = window.ICD10.filter(r=>!q || (r.c+' '+r.ru+' '+r.en).toLowerCase().includes(q));
    $('#icd-list').innerHTML = `<table><thead><tr><th>МКБ</th><th>RU</th><th>EN</th></tr></thead><tbody>
      ${rows.slice(0,120).map(r=>`<tr><td><b>${r.c}</b></td><td>${esc(r.ru)}</td><td class="muted">${esc(r.en)}</td></tr>`).join('')}
      </tbody></table>${rows.length>120?`<p class="muted" style="font-size:.8rem">…показано 120 из ${rows.length}. Уточните запрос.</p>`:''}`;
  };
  $('#icd-q').addEventListener('input', draw); draw();
};

/* ---------- DRUGS ---------- */
ROUTES.drugs = function(){
  return head(t('nav_drugs'), t('drugs_hint')) + `
  <div class="card"><input type="search" id="dr-q" placeholder="${t('search')}…"></div>
  <div id="dr-list"></div>
  <p class="muted" style="font-size:.8rem">${ic('warn')} ${t('drug_disclaimer')}</p>`;
};
ROUTES.drugs.after = function(){
  const draw = ()=>{
    const q = ($('#dr-q').value||'').toLowerCase().trim();
    const rows = window.DRUGS.filter(d=>!q || (d.n+' '+d.ind+' '+d.cl+' '+(d.lat||'')).toLowerCase().includes(q));
    $('#dr-list').innerHTML = rows.map(d=>`<div class="entry">
      <div class="meta"><span class="badge">${esc(d.cl)}</span>${S.latin&&d.lat?`<span class="badge">${ic('pill')} ${esc(d.lat)}</span>`:''}</div>
      <h3>${esc(d.n)}</h3>
      <p><b>${t('d_ind')}:</b> ${esc(d.ind)}</p>
      <p><b>${t('d_dose')}:</b> ${esc(d.dose)}</p>
      <p style="color:var(--danger)"><b>${t('d_contra')}:</b> ${esc(d.contr)}</p>
      <p class="muted"><b>${t('d_inter')}:</b> ${esc(d.inter)}</p>
      <p class="muted"><b>${t('d_preg')}:</b> ${esc(d.preg)}</p>
    </div>`).join('') || `<div class="empty">${t('empty')}</div>`;
  };
  $('#dr-q').addEventListener('input', draw); draw();
};

/* ---------- LABS ---------- */
const LAB_PANELS = [['hem','panel_hematology'],['bio','panel_biochem'],['hor','panel_hormones'],['uri','panel_urine'],['csf','panel_csf'],['coag','panel_coag']];
ROUTES.labs = function(){
  return head(t('nav_labs'), t('labs_hint')) + `
  <div class="chiprow" id="lab-tabs">
    ${LAB_PANELS.map(([k,l],i)=>`<button class="chip ${i===0?'on':''}" data-p="${k}">${t(l)}</button>`).join('')}
    <button class="chip" data-p="all">${t('all')}</button>
  </div>
  <div class="card"><input type="search" id="lab-q" placeholder="${t('search')}…"></div>
  <div class="card"><div id="lab-list" class="table-wrap"></div>
    <p><button class="btn secondary small" id="lab-pdf">${ic('download')} PDF</button></p></div>`;
};
ROUTES.labs.after = function(){
  let panel = 'hem';
  const draw = ()=>{
    const q = ($('#lab-q').value||'').toLowerCase().trim();
    const rows = window.LABS.filter(l=>(panel==='all'||l.p===panel) && (!q || l.a.toLowerCase().includes(q)));
    $('#lab-list').innerHTML = `<table><thead><tr><th>${t('lab_analyte')}</th><th>${t('lab_unit')}</th><th>${t('lab_m')}</th><th>${t('lab_f')}</th><th>${t('lab_child')}</th><th>${t('lab_note')}</th></tr></thead>
      <tbody>${rows.map(l=>`<tr><td><b>${esc(l.a)}</b></td><td>${esc(l.u)}</td><td>${esc(l.m||'—')}</td><td>${esc(l.f||'—')}</td><td>${esc(l.ch||'—')}</td><td class="muted">${esc(l.n||'')}</td></tr>`).join('')}</tbody></table>`;
  };
  $$('#lab-tabs .chip').forEach(b=>b.onclick=()=>{ panel=b.dataset.p;
    $$('#lab-tabs .chip').forEach(x=>x.classList.toggle('on',x===b)); draw(); });
  $('#lab-q').addEventListener('input', draw);
  $('#lab-pdf').onclick = ()=>PDFX.download('medhub-normy.pdf', t('nav_labs'), [
    {table:{head:[t('lab_analyte'),t('lab_unit'),t('lab_m'),t('lab_f'),t('lab_child')],
      rows:window.LABS.filter(l=>panel==='all'||l.p===panel).map(l=>[l.a,l.u,l.m||'—',l.f||'—',l.ch||'—'])}}]);
  draw();
};

/* ---------- PROTOCOLS ---------- */
ROUTES.protocols = function(){
  return head(t('nav_protocols'), t('protocols_hint')) + window.PROTOCOLS.map(p=>`
  <div class="entry">
    <div class="meta"><span class="badge warn">${esc(p.cat)}</span></div>
    <h3>${esc(p.t)}</h3>
    <h3 style="font-size:.9rem;color:var(--muted)">${t('p_diff')}</h3>
    <ul class="steps">${p.diff.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
    <h3 style="font-size:.9rem;color:var(--muted)">${t('p_steps')}</h3>
    <ol class="steps">${p.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>
    <p style="color:var(--danger)"><b>${t('p_redflags')}:</b> ${esc(p.red)}</p>
  </div>`).join('');
};

/* ---------- CALCULATORS ---------- */
ROUTES.calcs = function(){
  return head(t('nav_calc'), t('calc_hint')) + `<div class="grid g2">` + window.CALCS.map(c=>`
  <div class="card calc-card"><h3>${esc(c.n)}</h3>
    ${c.f.map(f=>`<label class="f">${esc(f.l)}</label>${
      f.t==='s' ? `<select data-calc="${c.id}" data-k="${f.k}">${f.o.map(o=>`<option>${o}</option>`).join('')}</select>`
      : `<input type="number" step="any" data-calc="${c.id}" data-k="${f.k}">`}`).join('')}
    <div class="result hidden" data-res="${c.id}"><div class="rv"></div><div class="interp muted"></div></div>
  </div>`).join('') + `</div>`;
};
ROUTES.calcs.after = function(){
  const recompute = id => {
    const c = window.CALCS.find(x=>x.id===id);
    const vals = {};
    let complete = true;
    $$(`[data-calc="${id}"]`).forEach(el=>{ vals[el.dataset.k]=el.value; if (!el.value && el.tagName!=='SELECT') complete=false; });
    const res = $(`[data-res="${id}"]`);
    if (!complete){ res.classList.add('hidden'); return; }
    try { const out = c.c(vals);
      res.classList.remove('hidden');
      res.querySelector('.rv').textContent = out.v;
      res.querySelector('.interp').textContent = out.i||''; }
    catch(e){ res.classList.add('hidden'); }
  };
  $$('[data-calc]').forEach(el=>el.addEventListener('input', ()=>recompute(el.dataset.calc)));
};

/* ---------- PAIN MAP ---------- */
let painMode = 'male';
ROUTES.pain = function(){
  return head(t('nav_pain'), t('pain_hint')) + `
  <div class="chiprow" id="pain-mode">
    <button class="chip ${painMode==='male'?'on':''}" data-m="male">${t('mode_male')}</button>
    <button class="chip ${painMode==='female'?'on':''}" data-m="female">${t('mode_female')}</button>
    <button class="chip ${painMode==='child'?'on':''}" data-m="child">${ic('child')} ${t('mode_child')}</button>
  </div>
  <div class="sim-layout">
    <div class="bodymap-wrap" id="pain-svg"></div>
    <div id="pain-info"><div class="empty">${t('pain_hint')}</div></div>
  </div>
  <div class="card"><h3>${ic('heart')} 3D-анатомия</h3>
    <p class="muted" style="font-size:.84rem;margin-top:0">Реальные 3D-модели человека и внутренностей — нажмите, чтобы увеличить.</p>
    <div class="anat-grid">${window.ANAT_LIB.map(a=>`
      <figure class="anat-fig" data-anat="${a.k}"><img src="${a.f}" alt="${esc(a.l)}" loading="lazy"><figcaption>${esc(a.l)}</figcaption></figure>`).join('')}
    </div>
  </div>`;
};
ROUTES.pain.after = function(){
  $$('#pain-mode .chip').forEach(b=>b.onclick=()=>{ painMode=b.dataset.m; go('pain'); });
  $('#pain-svg').innerHTML = BodyMap.html(painMode);
  $$('#view [data-anat]').forEach(f=>f.onclick=()=>{
    const a = anatBy(f.dataset.anat);
    dlg(`<h3>${esc(a.l)}</h3><img src="${a.f}" style="width:100%;border-radius:12px" alt="">
      <p><button class="btn" data-close>${t('close')}</button></p>`);
  });
  BodyMap.bind($('#pain-svg'), zid=>{
    const z = window.PAIN_ZONES.find(x=>x.id===zid); if (!z) return;
    const anat = anatBy(ZONE_ANAT[z.id]);
    $('#pain-info').innerHTML = `<div class="card">
      <h3>${esc(z.n)}</h3>
      ${anat?`<figure class="anat-fig"><img src="${anat.f}" alt="${esc(anat.l)}" loading="lazy"><figcaption>${esc(anat.l)}</figcaption></figure>`:''}
      <p><b>${t('pain_organs')}:</b> ${esc(z.organs)}</p>
      <p><b>${t('pain_causes')}:</b> ${esc(z.causes)}</p>
      <p><b>${t('pain_irr')}:</b> ${esc(z.irr)}</p>
      <p style="color:var(--danger)"><b>${t('pain_red')}:</b> ${esc(z.red)}</p>
      ${painMode==='child'&&z.peds?`<p class="muted">${ic('child')} <b>${t('mode_child')}:</b> ${esc(z.peds)}</p>`:''}
    </div>`;
  });
};

/* ---------- AUSCULTATION ---------- */
let auscCat = 'heart';
ROUTES.auscult = function(){
  return head(t('nav_auscult'), t('ausc_hint')) + `
  <div class="chiprow" id="ausc-tabs">
    <button class="chip ${auscCat==='heart'?'on':''}" data-c="heart">${ic('heart')} ${t('heart_points')}</button>
    <button class="chip ${auscCat==='lung'?'on':''}" data-c="lung">${ic('lungs')} ${t('lung_points')}</button>
    <button class="chip ${auscCat==='abdomen'?'on':''}" data-c="abdomen">${ic('bowel')} ${t('bowel_points')}</button>
  </div>
  <div class="sim-layout">
    <div class="bodymap-wrap ausc" id="ausc-svg"></div>
    <div id="ausc-info"><div class="empty">${t('ausc_hint')}</div></div>
  </div>`;
};
ROUTES.auscult.after = function(){
  $$('#ausc-tabs .chip').forEach(b=>b.onclick=()=>{ auscCat=b.dataset.c; Ausc.stop(); go('auscult'); });
  let markers = '';
  for (const snd of window.SOUNDS){ if (snd.cat!==auscCat) continue;
    for (const p of snd.points){
      markers += `<button class="ausc-pt" data-sound="${snd.id}" data-p="${esc(p.l)}" style="left:${p.x}%;top:${p.y}%" title="${esc(p.l)}" aria-label="${esc(p.l)}"></button>`; } }
  $('#ausc-svg').innerHTML = `<div class="body-photo ausc-photo"><img src="img/body_blue.jpg" alt="" draggable="false">${markers}</div>`;
  $('#ausc-svg').querySelectorAll('.ausc-pt').forEach(el=>{
    const pick = ()=>{ const snd = window.SOUNDS.find(s=>s.id===el.dataset.sound);
      Ausc.play(snd.synth);
      $('#ausc-info').innerHTML = `<div class="card">
        <h3>${ic('headphones')} ${esc(snd.n)}</h3>
        <p class="muted" style="font-size:.82rem">${ic('pin')} ${esc(el.dataset.p)}</p>
        <p><b>${t('ausc_findings')}:</b> ${esc(snd.desc)}</p>
        <p><b>${t('ausc_meaning')}:</b> ${esc(snd.meaning)}</p>
        <p><button class="btn danger small" id="ausc-stop">■ ${t('stop_sound')}</button></p></div>`;
      $('#ausc-stop').onclick = ()=>{ Ausc.stop(); };
    };
    el.addEventListener('click', pick);
    el.addEventListener('keydown', e=>{ if(e.key==='Enter') pick(); });
  });
};

/* ---------- ECG ---------- */
let ecgQuiz = null;
ROUTES.ecg = function(){
  ecgQuiz = null;
  return head(t('nav_ecg'), t('ecg_hint')) + `
  <div class="chiprow" id="ecg-list">
    ${window.ECGS.map(e=>`<button class="chip" data-e="${e.id}">${esc(e.n)}</button>`).join('')}
    <button class="chip" id="ecg-quiz-start">${ic('dice')} ${t('ecg_quiz')}</button>
  </div>
  <div class="canvas-wrap"><canvas id="ecg-cv"></canvas>
    <div class="ecg-hud" id="ecg-hud"><span class="ecg-heart">${ic('heart')}</span><b>—</b><small>${t('ecg_rate')}</small></div>
  </div>
  <div class="ecg-controls">
    <button class="btn small secondary" id="ecg-pause">⏸ ${t('ecg_pause')}</button>
  </div>
  <div id="ecg-info"></div>`;
};
ROUTES.ecg.after = function(){
  const cv = $('#ecg-cv');
  let paused = false, raf = null;
  const show = r => {
    ECGRen.start(cv, r, S.theme, S.quality==='low'?0.6:1);
    const hud = $('#ecg-hud');
    hud.querySelector('b').textContent = r.rate || '--';
    hud.querySelector('.ecg-heart').style.animationDuration = (r.rate ? (60/r.rate) : 1) + 's';
    $('#ecg-info').innerHTML = `<div class="card">
      <div class="meta"><span class="badge">${esc(r.cat)}</span> <span class="badge">${t('ecg_rate')}: ${r.rate||'—'}</span></div>
      <h3>${esc(r.n)}</h3>
      <p>${esc(r.findings)}</p>
      <h3 style="font-size:.9rem;color:var(--muted)">${t('ecg_steps')}</h3>
      <table><tbody>${r.steps.map(s=>`<tr><td style="width:140px"><b>${esc(s[0])}</b></td><td>${esc(s[1])}</td></tr>`).join('')}</tbody></table>
    </div>`;
  };
  $$('#ecg-list [data-e]').forEach(b=>b.onclick=()=>{ ecgQuiz=null; show(window.ECGS.find(e=>e.id===b.dataset.e)); });
  $('#ecg-quiz-start').onclick = ()=>{ ecgQuiz = window.ECGS[Math.floor(Math.random()*window.ECGS.length)];
    ECGRen.start(cv, ecgQuiz, S.theme);
    $('#ecg-info').innerHTML = `<div class="card"><h3>${ic('info')} ${t('ecg_quiz')}</h3>
      <div class="chiprow">${window.ECGS.map(e=>`<button class="chip" data-g="${e.id}">${esc(e.n)}</button>`).join('')}</div>
      <div id="ecg-quiz-res"></div></div>`;
    $$('#ecg-info [data-g]').forEach(b=>b.onclick=()=>{
      const ok = b.dataset.g === ecgQuiz.id;
      $('#ecg-quiz-res').innerHTML = ok
        ? `<p class="badge ok">${t('ecg_correct')} — ${esc(ecgQuiz.n)}</p>`
        : `<p class="badge bad">${t('ecg_wrong')}. ${t('ecg_rhythm')}: <b>${esc(ecgQuiz.n)}</b></p>`;
      setTimeout(()=>show(ecgQuiz), 900);
    }); };
  $('#ecg-pause').onclick = function(){
    paused = !paused;
    if (paused){ ECGRen.stop(); this.textContent='▶ '+t('ecg_play'); }
    else { const cur = ecgQuiz || window.ECGS.find(e=>e.id==='sinus') || window.ECGS[0]; ECGRen.start(cv, cur, S.theme); this.textContent='⏸ '+t('ecg_pause'); }
  };
  show(window.ECGS[0]);
};

/* ---------- ATLAS ---------- */
ROUTES.atlas = function(){
  const cats = [['all',t('all')],['xray',t('cat_xray')],['ct',t('cat_ct')],['mri',t('cat_mri')],['histology',t('cat_histology')],['fundus',t('cat_fundus')],['oto',t('cat_oto')]];
  return head(t('nav_atlas'), t('atlas_hint')) + `
  <div class="chiprow" id="atlas-tabs">${cats.map(([k,l],i)=>`<button class="chip ${i===0?'on':''}" data-c="${k}">${l}</button>`).join('')}</div>
  <div class="atlas-grid" id="atlas-grid"></div>
  <p class="muted" style="font-size:.8rem">${ic('info')} ${t('atlas_note')}</p>`;
};
ROUTES.atlas.after = function(){
  let cat = 'all';
  const fallback = (imgEl, a, w, h)=>{
    const cv = document.createElement('canvas'); cv.width=w; cv.height=h;
    try { ATLAS_DRAW[a.id](cv.getContext('2d'), w, h); } catch(e){}
    imgEl.replaceWith(cv); return cv;
  };
  const draw = ()=>{
    const items = window.ATLAS.filter(a=>cat==='all'||a.cat===cat);
    $('#atlas-grid').innerHTML = items.map(a=>`<div class="atlas-item" data-a="${a.id}">
      ${a.img
        ? `<img src="${a.img}" alt="${esc(a.t)}" loading="lazy">`
        : `<canvas width="440" height="330"></canvas>`}
      <div class="cap"><div class="cat">${esc(a.cat)}</div>${esc(a.t)}</div></div>`).join('');
    $('#atlas-grid').querySelectorAll('.atlas-item').forEach(el=>{
      const a = window.ATLAS.find(x=>x.id===el.dataset.a);
      if (a.img){
        const im = el.querySelector('img');
        im.onerror = ()=>{ im.onerror=null; fallback(im, a, 440, 330); };
        el.onclick = ()=>dlg(`<h3>${esc(a.t)}</h3>
          <img src="${a.img}" style="width:100%;border-radius:10px;display:block" alt="">
          <p><b>${t('atlas_find')}:</b> ${esc(a.find)}</p><p><b>${t('atlas_teach')}:</b> ${esc(a.teach)}</p>
          <p class="muted" style="font-size:.8rem">${t('atlas_note')}</p>
          <p><button class="btn" data-close>${t('close')}</button></p>`);
      } else {
        ATLAS_DRAW[a.id](el.querySelector('canvas').getContext('2d'), 440, 330);
        el.onclick = ()=>dlg(`<h3>${esc(a.t)}</h3><canvas id="ad-cv" width="560" height="400" style="width:100%;background:#0b0e13;border-radius:10px"></canvas>
          <p><b>${t('atlas_find')}:</b> ${esc(a.find)}</p><p><b>${t('atlas_teach')}:</b> ${esc(a.teach)}</p>
          <p class="muted" style="font-size:.8rem">${t('atlas_note')}</p>
          <p><button class="btn" data-close>${t('close')}</button></p>`);
      }
    });
    $('#atlas-grid').querySelectorAll('.atlas-item').forEach(el=>{
      el.addEventListener('click', ()=>{
        const a = window.ATLAS.find(x=>x.id===el.dataset.a);
        if (!a.img) setTimeout(()=>{ const cv=$('#ad-cv'); if (cv) ATLAS_DRAW[a.id](cv.getContext('2d'),560,400); }, 30);
      });
    });
  };
  $$('#atlas-tabs .chip').forEach(b=>b.onclick=()=>{ cat=b.dataset.c;
    $$('#atlas-tabs .chip').forEach(x=>x.classList.toggle('on',x===b)); draw(); });
  draw();
};

/* ---------- RANDOM PATIENT ---------- */
ROUTES.patient = function(){
  return head(t('nav_patient'), t('pat_hint')) + `
  <div class="card" style="text-align:center">
    <button class="btn" id="pt-new" style="font-size:1rem">${ic('dice')} ${t('pat_new')}</button>
    <p class="muted" style="margin:8px 0 0;font-size:.85rem">${t('pat_stats')}: <b>${S.patient.solved}</b> ${t('solved')} / <b>${S.patient.attempted}</b> ${t('attempted')}</p>
  </div>
  <div id="pt-case"></div>`;
};
ROUTES.patient.after = function(){
  let cur = null;
  $('#pt-new').onclick = ()=>{ Ausc.stop(); ECGRen.stop();
    cur = window.CASES[Math.floor(Math.random()*window.CASES.length)];
    renderCase(cur);
  };
  function renderCase(c){
    const others = window.CASES.filter(x=>x.dx!==c.dx).sort(()=>Math.random()-0.5).slice(0,5).map(x=>x.dx);
    const opts = [c.dx, ...others].sort(()=>Math.random()-0.5);
    const vt = c.vitals;
    $('#pt-case').innerHTML = `
    <div class="entry">
      <div class="meta"><span class="badge">${t('pat_age')}: ${c.age}</span><span class="badge">${c.sex}</span></div>
      <p><b>${t('pat_cc')}:</b> ${esc(c.cc)}</p>
      <p><b>${t('pat_hist')}:</b> ${esc(c.hist)}</p>
      <p><b>${t('pat_exam')}:</b> ${esc(c.exam)}</p>
      <h3>${t('pat_vitals')}</h3>
      <div class="vitals">
        <div class="vital"><div class="v">${vt.bp}</div><div class="l">АД</div></div>
        <div class="vital ${vt.hr>100||vt.hr<55?'abn':''}"><div class="v">${vt.hr}</div><div class="l">ЧСС</div></div>
        <div class="vital ${vt.rr>20?'abn':''}"><div class="v">${vt.rr}</div><div class="l">ЧДД</div></div>
        <div class="vital ${vt.t>37?'abn':''}"><div class="v">${vt.t}</div><div class="l">t°C</div></div>
        <div class="vital ${vt.spo2<94?'abn':''}"><div class="v">${vt.spo2}%</div><div class="l">SpO₂</div></div>
      </div>
      <div class="sim-layout" style="margin-top:12px">
        <div>
          <h3>${ic('lungs')} ${t('nav_auscult')}</h3>
          <p><button class="btn small" id="pt-sound">${ic('headphones')} ${t('ecg_play')}</button></p>
          <h3>${ic('pin')} ${t('nav_pain')}</h3>
          <div id="pt-map"></div>
        </div>
        <div>
          <h3>${ic('chart')} ${t('nav_ecg')}</h3>
          <div class="canvas-wrap"><canvas id="pt-ecg"></canvas></div>
        </div>
      </div>
      <h3>${t('pat_labs')}</h3>
      <div class="table-wrap"><table><tbody>${c.labs.map(l=>`<tr class="lab-row"><td>${esc(l[0])}</td><td class="${l[2]?'':'abn'}">${esc(l[1])}</td></tr>`).join('')}</tbody></table></div>
      <h3 style="margin-top:14px">${t('pat_dx')}</h3>
      <select id="pt-dx">${opts.map(o=>`<option>${esc(o)}</option>`).join('')}</select>
      <p style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn" id="pt-check">${ic('check')} ${t('pat_submit')}</button>
        <button class="btn secondary" id="pt-reveal">${t('pat_reveal')}</button>
      </p>
      <div id="pt-verdict"></div>
    </div>`;
    $('#pt-sound').onclick = ()=>Ausc.play(window.SOUNDS.find(s=>s.id===c.sound).synth);
    $('#pt-map').innerHTML = BodyMap.html('male');
    const pmap = $('#pt-map .body-photo');
    pmap.querySelectorAll('.zone-dot').forEach(z=>{ if (z.dataset.zone!==c.pain) z.remove(); else z.classList.add('sel'); });
    pmap.classList.add('mini');
    ECGRen.start($('#pt-ecg'), window.ECGS.find(e=>e.id===c.ecg), S.theme, 0.8);
    $('#pt-check').onclick = ()=>{
      S.patient.attempted++;
      const ok = $('#pt-dx').value === c.dx;
      if (ok) S.patient.solved++;
      save();
      $('#pt-verdict').innerHTML = `<p class="badge ${ok?'ok':'bad'}">${ok?t('pat_correct'):t('pat_try')}</p><div id="pt-expl"></div>`;
      reveal();
    };
    $('#pt-reveal').onclick = ()=>{ S.patient.attempted++; save(); $('#pt-verdict').innerHTML='<div id="pt-expl"></div>'; reveal(); };
    function reveal(){
      $('#pt-expl').innerHTML = `<div class="card"><h3>${ic('check')} ${t('pat_showcase')}: ${esc(c.dx)}</h3>
        <p><b>${t('p_diff')}:</b> ${esc(c.ddx.join('; '))}</p><p>${esc(c.explain)}</p></div>`;
      $('#pt-verdict').parentElement.querySelectorAll('#pt-check,#pt-reveal').forEach(b=>b.disabled=true);
    }
  }
};

/* ---------- TESTS ---------- */
let testState = null;
ROUTES.tests = function(){
  const subs = [...new Set(window.TESTS.map(x=>x.s))];
  return head(t('nav_tests'), t('test_hint')) + `
  <div class="card">
    <div class="chiprow" id="t-sub">${subs.map((s,i)=>`<button class="chip ${i===0?'on':''}" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div>
    <p><button class="btn" id="t-start">${ic('play')} ${t('test_start')} (${t('test_mode_topic')})</button>
    <button class="btn secondary" id="t-exam">${ic('clock')} ${t('test_mode_exam')}</button></p>
  </div>
  <div id="t-area"></div>`;
};
ROUTES.tests.after = function(){
  let sub = $$('#t-sub .chip')[0].dataset.s;
  $$('#t-sub .chip').forEach(b=>b.onclick=()=>{ sub=b.dataset.s;
    $$('#t-sub .chip').forEach(x=>x.classList.toggle('on',x===b)); });
  function run(pool, examMode){
    const qs = pool.slice().sort(()=>Math.random()-0.5).slice(0, examMode?20:10);
    if (!qs.length) return toast(t('empty'));
    testState = {qs, i:0, score:0, wrong:[], examMode, deadline: examMode?Date.now()+25*60000:null};
    step();
  }
  function step(){
    const st = testState, q = st.qs[st.i];
    if (st.examMode && Date.now()>st.deadline) return finish();
    $('#t-area').innerHTML = `<div class="card">
      <div class="meta" style="display:flex;gap:10px;color:var(--muted);font-size:.8rem;margin-bottom:8px">
        <span class="badge">${esc(q.s)}</span><span>${st.i+1} ${t('test_of')} ${st.qs.length}</span>
        <span style="flex:1"></span>${st.examMode?`<b id="t-timer"></b>`:''}<span>${ic('check')} ${st.score}</span></div>
      <h3>${esc(q.q)}</h3>
      ${q.o.map((o,i)=>`<p><button class="chip" style="width:100%;justify-content:flex-start;text-align:left" data-o="${i}">${String.fromCharCode(65+i)}. ${esc(o)}</button></p>`).join('')}
    </div>`;
    if (st.examMode){ const tm = setInterval(()=>{ const el=$('#t-timer'); if (!el){clearInterval(tm);return;}
      const left = st.deadline-Date.now();
      if (left<=0){ clearInterval(tm); finish(); }
      else el.textContent = `⏱ ${Math.floor(left/60000)}:${String(Math.floor(left%60000/1000)).padStart(2,'0')}`; }, 500); }
    $$('#t-area [data-o]').forEach(b=>b.onclick=()=>{
      const ok = +b.dataset.o === q.a;
      if (ok) st.score++; else st.wrong.push(q);
      $$('#t-area [data-o]').forEach((x,i)=>{ x.disabled=true;
        if (i===q.a) x.classList.add('on');
        else if (x===b && !ok) x.classList.add('bad'); });
      st.i++;
      setTimeout(()=>{ st.i>=st.qs.length ? finish() : step(); }, ok?350:1100);
    });
  }
  function finish(){
    const st = testState;
    const pct = Math.round(st.score/st.qs.length*100);
    $('#t-area').innerHTML = `<div class="card" style="text-align:center">
      <h2>${t('test_score')}: ${st.score} / ${st.qs.length} (${pct}%)</h2>
      <div class="progressbar" style="max-width:300px;margin:10px auto"><div style="width:${pct}%"></div></div>
      ${st.wrong.length?`<h3>${ic('x')} ${st.wrong.length}</h3>${st.wrong.map(q=>`<div class="entry tight" style="text-align:left">
        <b>${esc(q.q)}</b><div class="comment">${ic('check')} ${t('test_correct_answer')}: ${esc(q.o[q.a])}</div>
        <div class="comment">${esc(q.e)}</div></div>`).join('')}`:''}
      <p><button class="btn" id="t-again">${ic('refresh')} ${t('test_again')}</button>
      <button class="btn secondary" id="t-pdf">${ic('download')} PDF</button></p></div>`;
    $('#t-again').onclick = ()=>go('tests');
    $('#t-pdf').onclick = ()=>PDFX.download('medhub-test.pdf', t('test_score'), [
      {kv:[t('test_score'), `${st.score} / ${st.qs.length} (${pct}%)`]},
      {table:{head:['№', t('test_correct_answer'), t('test_explain')],
        rows:st.wrong.map((q,i)=>[i+1, q.o[q.a], q.e])}}]);
  }
  $('#t-start').onclick = ()=>run(window.TESTS.filter(x=>x.s===sub), false);
  $('#t-exam').onclick = ()=>run(window.TESTS, true);
};

/* ---------- FLASHCARDS (SRS) ---------- */
const SRS_IV = [0,1,3,7,16,35];
function dueCards(){ const t0 = todayISO();
  return S.cards.filter(c=>{ const s = S.srs[c.id]; return !s || s.due <= t0; }); }
ROUTES.cards = function(){
  const due = dueCards();
  return head(t('nav_cards'), t('cards_hint')) + `
  <div class="grid g3">
    <div class="stat"><div class="num">${due.length}</div><div class="lbl">${t('cards_due')}</div></div>
    <div class="stat"><div class="num">${S.cards.length}</div><div class="lbl">${t('total')} · ${[...new Set(S.cards.map(c=>c.deck))].length} ${t('cards_deck')}</div></div>
    <div class="stat"><div class="num">${S.streak||0}</div><div class="lbl">${ic('flame')} ${t('cards_streak')}</div></div>
  </div>
  <div class="card">
    <h3>${t('cards_add')}</h3>
    <div class="formrow g2">
      <div><label class="f">${t('cards_deck')}</label><input type="text" id="c-deck" list="decks" value="Мои"><datalist id="decks">
        ${[...new Set([...S.cards.map(c=>c.deck),...window.STARTER_DECK.map(c=>c.d)])].map(d=>`<option>${esc(d)}</option>`).join('')}</datalist></div>
      <div><label class="f">${t('subject')} (необяз.)</label><select id="c-sub"><option value="">—</option>${window.SUBJECTS.map(s=>`<option>${esc(s.n)}</option>`).join('')}</select></div>
    </div>
    <label class="f">${t('cards_front')}</label><textarea id="c-front"></textarea>
    <label class="f">${t('cards_back')}</label><textarea id="c-back"></textarea>
    <p><button class="btn" id="c-add">＋ ${t('add')}</button>
    <button class="btn secondary" id="c-import">${ic('download')} ${t('cards_deck')}: стартовый набор</button></p>
  </div>
  <div id="card-area"></div>`;
};
ROUTES.cards.after = function(){
  $('#c-add').onclick = ()=>{
    const f=$('#c-front').value.trim(), b=$('#c-back').value.trim();
    if (!f||!b) return toast(t('required'));
    S.cards.push({id:uid(), deck:$('#c-deck').value.trim()||'Мои', sub:$('#c-sub').value, f, b});
    save(); toast(t('card_added')); go('cards');
  };
  $('#c-import').onclick = ()=>{
    let added = 0;
    for (const c of window.STARTER_DECK){
      if (S.cards.some(x=>x.f===c.f)) continue;
      S.cards.push({id:uid(), deck:c.d, f:c.f, b:c.b}); added++;
    }
    save(); toast(`+${added} · ${t('added')}`); go('cards');
  };
  const due = dueCards().sort(()=>Math.random()-0.5);
  const area = $('#card-area');
  if (!due.length){ area.innerHTML = `<div class="empty">${ic('check')} ${t('cards_done')}</div>`; return; }
  let shown = null, revealed = false;
  function next(){
    shown = due[0]; revealed = false;
    area.innerHTML = `<div class="flash"><div class="flash-inner" id="fl"><div class="q">${esc(shown.f)}<div class="muted" style="font-size:.75rem;margin-top:10px">${esc(shown.deck)} · ${t('cards_show')}</div></div></div></div>
      <div class="rate-row hidden" id="rr">
        <button class="btn danger" data-r="0">${t('cards_again')}</button>
        <button class="btn secondary" data-r="1">${t('cards_hard')}</button>
        <button class="btn" data-r="2">${t('cards_good')}</button>
        <button class="btn" data-r="3">${t('cards_easy')}</button>
      </div>
      <p style="text-align:center"><button class="btn small danger" data-skip="1">${ic('trash')} ${t('delete')}</button></p>`;
    $('#fl').onclick = ()=>{ if (revealed) return; revealed = true;
      $('#fl').innerHTML = `<div class="a">${esc(shown.b)}<div class="muted" style="font-size:.75rem;margin-top:10px">${esc(shown.f)}</div></div>`;
      $('#rr').classList.remove('hidden'); };
    $$('#rr [data-r]').forEach(b=>b.onclick=()=>{
      const lvl = (S.srs[shown.id]?.iv ?? -1) + 1;
      const nv = {0:Math.max(lvl-2,-1),1:Math.max(lvl-1,-1),2:lvl,3:lvl+1}[+b.dataset.r];
      S.srs[shown.id] = {iv:nv, due: nv<=0 ? todayISO() : new Date(Date.now()+SRS_IV[Math.min(nv,SRS_IV.length-1)]*86400000).toISOString().slice(0,10)};
      // streak
      const today = todayISO();
      if (S.lastReview !== today){ S.streak = (S.lastReview && daysBetween(S.lastReview, today)===1) ? (S.streak||0)+1 : 1; S.lastReview = today; }
      save(); due.shift(); due.length ? next() : (area.innerHTML = `<div class="empty">${ic('check')} ${t('cards_done')}</div>`);
    });
    area.querySelector('[data-skip]').onclick = ()=>{ S.cards = S.cards.filter(c=>c.id!==shown.id); save(); due.shift(); due.length?next():go('cards'); };
  }
  next();
};

/* ---------- CURATION (diary) ---------- */
ROUTES.curation = function(){
  return head(t('nav_curation'), t('cur_hint')) + `
  <div class="card"><h3>${t('cur_new')}</h3>
    <div class="formrow g2">
      <div><label class="f">${t('pat_age')}</label><input type="number" id="cur-age" min="0" max="120"></div>
      <div><label class="f">${t('pat_sex')}</label><select id="cur-sex"><option>М</option><option>Ж</option></select></div>
    </div>
    <label class="f">${t('cur_cc')}</label><textarea id="cur-cc"></textarea>
    <label class="f">${t('cur_anam')}</label><textarea id="cur-anam"></textarea>
    <label class="f">${t('cur_status')}</label><textarea id="cur-status"></textarea>
    <label class="f">${t('cur_diag')}</label><input type="text" id="cur-diag">
    <label class="f">${t('cur_plan')}</label><textarea id="cur-plan"></textarea>
    ${visSelect('private')}
    <p><button class="btn" id="cur-save">${ic('save')} ${t('save')}</button>
    ${S.group?`<button class="btn secondary" id="cur-share">${ic('users')} ${t('vis_group')} → ${t('cases')}</button>`:''}</p>
  </div>
  <div class="card"><h3>${t('nav_curation')} (${S.diary.length})</h3>
    ${S.diary.slice().reverse().map(d=>`<div class="entry">
      <div class="meta">${visIcon(d.visibility||'private')} <b>${d.date}</b> · ${d.sex}, ${d.age} ${t('pat_age').toLowerCase()}</div>
      <div><b>${esc(d.diag||'—')}</b></div>
      <div class="body muted" style="font-size:.86rem">${esc((d.cc||'').slice(0,160))}${(d.cc||'').length>160?'…':''}</div>
      <div class="entry-actions">
        <button class="btn small secondary" data-view="${d.id}">${ic('eye')}</button>
        <button class="btn small danger" data-cdel="${d.id}">${ic('trash')}</button></div>
    </div>`).join('') || `<div class="empty">${t('empty')}</div>`}
    ${S.diary.length?`<p><button class="btn secondary small" id="cur-print">${ic('printer')} ${t('print')}</button>
    <button class="btn secondary small" id="cur-pdf">${ic('download')} PDF</button></p>`:''}
  </div>`;
};
ROUTES.curation.after = function(){
  const read = ()=>({age:$('#cur-age').value, sex:$('#cur-sex').value, cc:$('#cur-cc').value.trim(),
    anam:$('#cur-anam').value.trim(), status:$('#cur-status').value.trim(), diag:$('#cur-diag').value.trim(),
    plan:$('#cur-plan').value.trim(), visibility:$('#f-vis').value, date:todayISO()});
  const saveEntry = (d, post)=>{
    if (!d.cc && !d.diag) return toast(t('required'));
    S.diary.push(Object.assign({id:uid()}, d)); save(); toast(t('saved')); go('curation');
    if (post && S.group) api(`/groups/${S.group.code}/entries`,{method:'POST',body:{type:'diary',
      authorId:S.group.me.id, authorName:S.group.me.name, title:`Курация: ${d.diag||''}`, 
      body:`${d.sex}, ${d.age}\n${t('cur_cc')}: ${d.cc}\n${t('cur_diag')}: ${d.diag}\n${t('cur_plan')}: ${d.plan}`,
      meta:{}, visibility:d.visibility}}).catch(()=>{});
  };
  $('#cur-save').onclick = ()=>saveEntry(read(), false);
  const sh = $('#cur-share'); if (sh) sh.onclick = ()=>{ const d = read();
    if (!d.cc && !d.diag) return toast(t('required'));
    S.diary.push(Object.assign({id:uid()}, d)); save();
    if (!S.group){
      S.localFeed.diary = S.localFeed.diary||[];
      S.localFeed.diary.unshift({id:uid(), ts:Date.now(), authorName:'Я', title:`Курация: ${d.diag||''}`,
        body:`${d.sex}, ${d.age}\n${t('cur_cc')}: ${d.cc}\n${t('cur_diag')}: ${d.diag}\n${t('cur_plan')}: ${d.plan}`,
        meta:{}, visibility:d.visibility});
      save(); toast(t('saved')); return go('curation');
    }
    api(`/groups/${S.group.code}/entries`,{method:'POST',body:{type:'diary', authorId:S.group.me.id,
      authorName:S.group.me.name, title:`Курация: ${d.diag||''}`,
      body:`${d.sex}, ${d.age}\n${t('cur_cc')}: ${d.cc}\n${t('cur_diag')}: ${d.diag}\n${t('cur_plan')}: ${d.plan}`,
      meta:{}, visibility:d.visibility}}).then(()=>{toast(t('posted')); go('curation');}).catch(e=>toast(e.message));
  };
  $$('[data-view]').forEach(b=>b.onclick=()=>{
    const d = S.diary.find(x=>x.id===b.dataset.view);
    dlg(`<h3>${esc(d.diag||t('nav_curation'))}</h3>
      <p class="muted">${d.date} · ${d.sex}, ${d.age}</p>
      <p><b>${t('cur_cc')}:</b> ${esc(d.cc)}</p>
      ${d.anam?`<p><b>${t('cur_anam')}:</b> ${esc(d.anam)}</p>`:''}
      ${d.status?`<p><b>${t('cur_status')}:</b> ${esc(d.status)}</p>`:''}
      ${d.plan?`<p><b>${t('cur_plan')}:</b> ${esc(d.plan)}</p>`:''}
      <p><button class="btn" data-close>${t('close')}</button></p>`);
  });
  $$('[data-cdel]').forEach(b=>b.onclick=()=>{ if (!confirm(t('confirm_delete'))) return;
    S.diary = S.diary.filter(x=>x.id!==b.dataset.cdel); save(); go('curation'); });
  const pr = $('#cur-print'); if (pr) pr.onclick = ()=>window.print();
  const curPdf = $('#cur-pdf'); if (curPdf) curPdf.onclick = ()=>PDFX.download('medhub-kundalik.pdf', t('nav_curation'),
    S.diary.flatMap(d=>[{h:`${d.date} · ${d.sex}, ${d.age}`},
      {kv:[t('cur_cc'), d.cc]}, d.anam?{kv:[t('cur_anam'), d.anam]}:null,
      d.status?{kv:[t('cur_status'), d.status]}:null, {kv:[t('cur_diag'), d.diag||'—']},
      d.plan?{kv:[t('cur_plan'), d.plan]}:null, {p:''}]).filter(Boolean));
};

/* ---------- SKILLS ---------- */
ROUTES.skills = function(){
  const groups = [...new Set(window.SKILLS.map(s=>s.g))];
  const done = Object.values(S.skills).filter(v=>v===2).length;
  const pct = Math.round(done/window.SKILLS.length*100);
  return head(t('nav_skills'), t('skills_hint')) + `
  <div class="grid g2">
    <div class="stat"><div class="num">${done}/${window.SKILLS.length}</div><div class="lbl">${t('skills_mine')}</div>
      <div class="progressbar" style="margin-top:8px"><div style="width:${pct}%"></div></div></div>
    <div class="stat"><div class="num">${done}/${window.SKILLS.length}</div><div class="lbl">PDF</div>
      <p><button class="btn small secondary" id="sk-pdf">${ic('download')} PDF</button></p></div>
    <div class="stat"><div class="num">${S.group?S.group.name:'—'}</div><div class="lbl">${t('skills_progress')}</div>
      ${S.group?`<p><button class="btn small secondary" id="sk-share">${ic('send')} ${t('feed_post')}</button></p>`:`<p class="muted" style="font-size:.8rem">${t('set_group_join')}</p>`}</div>
  </div>
  ${groups.map(g=>`<div class="card"><h3>${esc(g)}</h3>
    ${window.SKILLS.filter(s=>s.g===g).map(s=>{ const v = S.skills[s.n]||0;
      return `<div class="skill-row"><span class="n">${esc(s.n)}</span>
      <div class="seg" data-sk="${esc(s.n)}">
        <button class="${v===0?'on':''}" data-v="0">${t('sk_watched')}</button>
        <button class="${v===1?'on':''}" data-v="1">${t('sk_assisted')}</button>
        <button class="${v===2?'on':''}" data-v="2">${t('sk_independent')}</button>
      </div></div>`; }).join('')}
  </div>`).join('')}`;
};
ROUTES.skills.after = function(){
  $$('.seg').forEach(seg=>seg.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    S.skills[seg.dataset.sk] = +b.dataset.v; save(); go('skills'); }));
  $('#sk-pdf').onclick = ()=>PDFX.download('medhub-navyki.pdf', t('nav_skills'),
    [{table:{head:[t('subject'),t('sk_watched')+'/'+t('sk_assisted')+'/'+t('sk_independent')],
      rows:window.SKILLS.map(sk=>[sk.g+' — '+sk.n, [t('sk_watched'),t('sk_assisted'),t('sk_independent')][S.skills[sk.n]||0]])}}]);
  const sh = $('#sk-share');
  if (sh) sh.onclick = async ()=>{
    const done = Object.entries(S.skills).filter(([,v])=>v===2).map(([k])=>k);
    if (!S.group){
      S.localFeed.diary = S.localFeed.diary||[];
      S.localFeed.diary.unshift({id:uid(), ts:Date.now(), authorName:'Я',
        title:`${t('skills_mine')}: ${done.length}/${window.SKILLS.length}`, body:done.join(', '), meta:{}, visibility:'private'});
      save(); return toast(t('saved'));
    }
    try { await api(`/groups/${S.group.code}/entries`,{method:'POST',body:{type:'diary',
      authorId:S.group.me.id, authorName:S.group.me.name,
      title:`${t('skills_mine')}: ${done.length}/${window.SKILLS.length}`,
      body:done.join(', '), meta:{}, visibility:'group'}});
      toast(t('posted')); } catch(e){ toast(e.message); }
  };
};

/* ---------- OPS registry ---------- */
ROUTES.ops = function(){
  const cnt = {observer:0, assistant:0};
  S.ops.forEach(o=>cnt[o.role]++);
  return head(t('nav_ops'), t('ops_hint')) + `
  <div class="grid g3">
    <div class="stat"><div class="num">${S.ops.length}</div><div class="lbl">${t('total')}</div></div>
    <div class="stat"><div class="num">${cnt.observer}</div><div class="lbl">${t('ops_observer')}</div></div>
    <div class="stat"><div class="num">${cnt.assistant}</div><div class="lbl">${t('ops_assistant')}</div></div>
  </div>
  <div class="card"><h3>${t('ops_add')}</h3>
    <div class="formrow g2">
      <div><label class="f">${t('date')}</label><input type="date" id="o-date" value="${todayISO()}"></div>
      <div><label class="f">${t('ops_role')}</label><select id="o-role"><option value="observer">${t('ops_observer')}</option><option value="assistant">${t('ops_assistant')}</option></select></div>
    </div>
    <label class="f">${t('ops_operation')}</label><input type="text" id="o-op" placeholder="ЛХЭ, аппендэктомия, кесарево…">
    <label class="f">${t('notes')}</label><textarea id="o-notes"></textarea>
    ${visSelect('private')}
    <p><button class="btn" id="o-add">＋ ${t('add')}</button>
    <button class="btn secondary" id="ops-pdf">${ic('download')} PDF</button></p>
  </div>
  <div class="card">${S.ops.slice().reverse().map(o=>`<div class="entry">
    <div class="meta"><span class="badge ${o.role==='assistant'?'ok':''}">${o.role==='assistant'?t('ops_assistant'):t('ops_observer')}</span> <b>${o.date}</b></div>
    <div><b>${esc(o.op)}</b>${o.notes?` — <span class="muted">${esc(o.notes)}</span>`:''}</div>
    <div class="entry-actions"><button class="btn small danger" data-odel="${o.id}">${ic('trash')}</button></div></div>`).join('') ||
    `<div class="empty">${t('empty')}</div>`}</div>`;
};
ROUTES.ops.after = function(){
  $('#o-add').onclick = ()=>{
    const op = $('#o-op').value.trim();
    if (!op) return toast(t('required'));
    S.ops.push({id:uid(), date:$('#o-date').value||todayISO(), role:$('#o-role').value, op, notes:$('#o-notes').value.trim()});
    save(); toast(t('added')); go('ops');
  };
  $('#ops-pdf').onclick = ()=>PDFX.download('medhub-operacii.pdf', t('nav_ops'), [
    {table:{head:[t('date'),t('ops_role'),t('ops_operation'),t('notes')],
      rows:S.ops.map(o=>[o.date, o.role==='assistant'?t('ops_assistant'):t('ops_observer'), o.op, o.notes||'—'])}}]);
  $$('[data-odel]').forEach(b=>b.onclick=()=>{ S.ops = S.ops.filter(o=>o.id!==b.dataset.odel); save(); go('ops'); });
};

/* ---------- GROUP CASES feed ---------- */
ROUTES.cases = function(){
  return head(t('nav_cases'), t('cases_hint')) + `
  <div class="card"><h3>${t('case_new')}</h3>
    <label class="f">${t('title')}</label><input type="text" id="cs-title" placeholder="Кейс: боль в животе у подростка">
    <label class="f">${t('body')}</label><textarea id="cs-body" style="min-height:110px"></textarea>
    <p><button class="btn" id="cs-post">${ic('send')} ${t('feed_post')}</button></p>
  </div>
  <div id="cs-feed"><div class="empty">${t('loading')}</div></div>`;
};
ROUTES.cases.after = async function(){
  const refresh = async ()=>{
    const box = $('#cs-feed');
    const entries = (await fetchFeed('case')) || [];
    box.innerHTML = feedScopeBar() + feedBanner() + ((entries.length) ? entries.map(e=>{
      const comments = (e.meta&&e.meta.comments||[]).map(c=>`<div class="comment"><b>${esc(c.authorName)}:</b> ${esc(c.text)}</div>`).join('');
      if (feedScope==='public') return entryHtml(e);
      return entryHtml(e, comments + `<div style="display:flex;gap:6px;margin-top:8px">
        <input type="text" placeholder="${t('comment')}…" data-cin="${e.id}">
        <button class="btn small" data-csend="${e.id}">${t('send')}</button></div>`);
    }).join('') : `<div class="empty">${t('feed_empty')}</div>`);
    bindFeedActions(box, 'case', refresh); bindScopeBar(box, refresh);
    box.querySelectorAll('[data-csend]').forEach(b=>b.onclick=async()=>{
      const inp = box.querySelector(`[data-cin="${b.dataset.csend}"]`);
      if (!inp.value.trim()) return;
      if (!S.group){
        const e = (S.localFeed.case||[]).find(x=>x.id===b.dataset.csend);
        if (e){ e.meta.comments = e.meta.comments||[]; e.meta.comments.push({id:uid(), ts:Date.now(), authorName:'Я', text:inp.value.trim()}); save(); }
        return refresh();
      }
      try { await api(`/groups/${S.group.code}/entries/${b.dataset.csend}/comments`,{method:'POST',
        body:{authorId:S.group.me.id, authorName:S.group.me.name, text:inp.value.trim()}});
        refresh(); } catch(e){ toast(e.message); }
    });
  };
  $('#cs-post').onclick = async ()=>{
    const title=$('#cs-title').value.trim(), body=$('#cs-body').value.trim();
    if (!body) return toast(t('required'));
    if (!S.group){
      S.localFeed.case = S.localFeed.case||[];
      S.localFeed.case.unshift({id:uid(), ts:Date.now(), authorName:'Я', title, body, meta:{}, visibility:'private'});
      save(); toast(t('saved')); $('#cs-title').value=''; $('#cs-body').value=''; return refresh();
    }
    try { await api(`/groups/${S.group.code}/entries`,{method:'POST',body:{type:'case',
      authorId:S.group.me.id, authorName:S.group.me.name, title, body, meta:{}, visibility:'group'}});
      toast(t('posted')); $('#cs-title').value=''; $('#cs-body').value=''; refresh(); }
    catch(e){ toast(e.message); }
  };
  refresh();
};

/* ---------- REFLECTION ---------- */
ROUTES.reflect = function(){
  return head(t('nav_reflect'), t('refl_hint')) + `
  <div class="card"><h3>${t('refl_new')}</h3>
    <label class="f">${t('refl_sit')}</label><textarea id="r-sit"></textarea>
    <label class="f">${t('refl_err')}</label><textarea id="r-err"></textarea>
    <label class="f">${t('refl_lesson')}</label><textarea id="r-lesson"></textarea>
    <label class="f">${t('refl_topics')} (через запятую)</label><input type="text" id="r-topics">
    <p><button class="btn" id="r-add">${ic('save')} ${t('save')}</button></p>
  </div>
  <div class="card"><p><button class="btn secondary small" id="refl-pdf">${ic('download')} PDF</button></p>
  ${S.reflect.slice().reverse().map(r=>`<div class="entry">
    <div class="meta">${ic('lock')} <b>${r.date}</b></div>
    <p><b>${t('refl_sit')}:</b> ${esc(r.sit)}</p>
    <p style="color:var(--danger)"><b>${t('refl_err')}:</b> ${esc(r.err)}</p>
    <p><b>${t('refl_lesson')}:</b> ${esc(r.lesson||'—')}</p>
    ${(r.topics||[]).length?`<div class="chiprow">${r.topics.map(tp=>`<span class="chip" style="cursor:default">${ic('pin')} ${esc(tp)}</span>`).join('')}</div>`:''}
    ${(r.topics||[]).length?`<p><button class="btn small secondary" data-tocard="${r.id}">${ic('cards')} ${t('cards_to_deck')}</button></p>`:''}
    <div class="entry-actions"><button class="btn small danger" data-rdel="${r.id}">${ic('trash')}</button></div>
  </div>`).join('') || `<div class="empty">${t('empty')}</div>`}</div>`;
};
ROUTES.reflect.after = function(){
  $('#r-add').onclick = ()=>{
    const sit=$('#r-sit').value.trim(), err=$('#r-err').value.trim();
    if (!sit||!err) return toast(t('required'));
    S.reflect.push({id:uid(), date:todayISO(), sit, err, lesson:$('#r-lesson').value.trim(),
      topics:$('#r-topics').value.split(',').map(x=>x.trim()).filter(Boolean)});
    save(); toast(t('saved')); go('reflect');
  };
  $('#refl-pdf').onclick = ()=>PDFX.download('medhub-refleksiya.pdf', t('nav_reflect'),
    S.reflect.flatMap(r=>[{h:r.date},{kv:[t('refl_sit'), r.sit]},{kv:[t('refl_err'), r.err]},
      {kv:[t('refl_lesson'), r.lesson||'—']}, {kv:[t('refl_topics'), (r.topics||[]).join(', ')||'—']}, {p:''}]));
  $$('[data-rdel]').forEach(b=>b.onclick=()=>{ S.reflect = S.reflect.filter(r=>r.id!==b.dataset.rdel); save(); go('reflect'); });
  $$('[data-tocard]').forEach(b=>b.onclick=()=>{
    const r = S.reflect.find(x=>x.id===b.dataset.tocard); if (!r) return;
    for (const tp of r.topics){
      if (S.cards.some(c=>c.f===tp)) continue;
      S.cards.push({id:uid(), deck:'Повторение', f:tp, b:(r.lesson||r.err||'').slice(0,200)});
    }
    save(); toast(t('card_added'));
  });
};

/* ---------- DUTY roster ---------- */
ROUTES.duty = function(){
  const total = S.duties.reduce((a,d)=>a+(d.hours||0),0);
  const up = S.duties.filter(d=>d.date>=todayISO()).sort((a,b)=>a.date<b.date?-1:1);
  return head(t('nav_duty'), t('duty_hint')) + `
  <div class="grid g2">
    <div class="stat"><div class="num">${total}</div><div class="lbl">${t('duty_total')}</div></div>
    <div class="stat"><div class="num">${up.length}</div><div class="lbl">${t('upcoming')}</div></div>
  </div>
  <div class="card"><h3>${t('duty_shift')}</h3>
    <div class="formrow g2">
      <div><label class="f">${t('date')}</label><input type="date" id="d-date" value="${todayISO()}"></div>
      <div><label class="f">${t('duty_place')}</label><input type="text" id="d-place" placeholder="Приёмное, ОРИТ, терапия…"></div>
      <div><label class="f">${t('duty_from')}</label><input type="time" id="d-from" value="08:00"></div>
      <div><label class="f">${t('duty_to')}</label><input type="time" id="d-to" value="08:00"></div>
    </div>
    <p><button class="btn" id="d-add">＋ ${t('add')}</button>
    <button class="btn secondary" id="duty-pdf">${ic('download')} PDF</button></p>
  </div>
  <div class="card"><h3>${t('nav_duty')}</h3>
    ${up.map(d=>`<div class="entry"><div class="meta">${ic('bed')} <b>${d.date}</b> · ${d.from}–${d.to} · ${esc(d.place||'—')} · ${d.hours} ${t('duty_hours').toLowerCase()}</div>
      <div class="entry-actions">
        ${S.group?`<button class="btn small secondary" data-swap="${d.id}">${ic('swap')} ${t('duty_swap')}</button>`:''}
        <button class="btn small danger" data-ddel="${d.id}">${ic('trash')}</button></div></div>`).join('') ||
      `<div class="empty">${t('empty')}</div>`}
  </div>
  <div id="swap-feed"></div>`;
};
ROUTES.duty.after = async function(){
  $('#d-add').onclick = ()=>{
    let h = 24; // overnight default
    const [fh,fm] = $('#d-from').value.split(':').map(Number), [th,tm2] = $('#d-to').value.split(':').map(Number);
    if (!isNaN(fh) && !isNaN(th)) h = ((th*60+tm2)-(fh*60+fm)+1440)%1440/60 || 24;
    S.duties.push({id:uid(), date:$('#d-date').value||todayISO(), from:$('#d-from').value, to:$('#d-to').value,
      place:$('#d-place').value.trim(), hours:Math.round(h*10)/10});
    save(); toast(t('added')); go('duty');
  };
  $('#duty-pdf').onclick = ()=>PDFX.download('medhub-dezhurstva.pdf', t('nav_duty'), [
    {kv:[t('duty_total'), S.duties.reduce((a,d)=>a+(d.hours||0),0)+'']},
    {table:{head:[t('date'),t('duty_from'),t('duty_to'),t('duty_place'),t('duty_hours')],
      rows:S.duties.map(d=>[d.date,d.from,d.to,d.place||'—',d.hours])}}]);
  $$('[data-ddel]').forEach(b=>b.onclick=()=>{ S.duties = S.duties.filter(d=>d.id!==b.dataset.ddel); save(); go('duty'); });
  $$('[data-swap]').forEach(b=>b.onclick=async()=>{
    const d = S.duties.find(x=>x.id===b.dataset.swap);
    if (!S.group){
      S.localFeed['duty-swap'] = S.localFeed['duty-swap']||[];
      S.localFeed['duty-swap'].unshift({id:uid(), ts:Date.now(), authorName:'Я',
        title:`${t('duty_swap')}: ${d.date} ${d.from}–${d.to}`, body:d.place||'', meta:{date:d.date}, visibility:'private', localDutyId:d.id});
      save(); toast(t('saved')); return loadSwaps();
    }
    try { await api(`/groups/${S.group.code}/entries`,{method:'POST',body:{type:'duty-swap',
      authorId:S.group.me.id, authorName:S.group.me.name,
      title:`${t('duty_swap')}: ${d.date} ${d.from}–${d.to}`, body:d.place||'', meta:{date:d.date},
      visibility:'group'}});
      toast(t('posted')); loadSwaps(); } catch(e){ toast(e.message); }
  });
  async function loadSwaps(){
    const box = $('#swap-feed'); if (!box) return;
    const entries = (await fetchFeed('duty-swap')) || [];
    box.innerHTML = feedBanner() + `<h3 style="margin:14px 0 8px">${ic('swap')} ${t('duty_swap')}</h3>` + ((entries.length) ?
      entries.map(e=>entryHtml(e, `<button class="btn small" data-take="${e.id}">${ic('check')} ${t('duty_taken')}</button>`)).join('')
      : `<div class="empty">${t('feed_empty')}</div>`);
    box.querySelectorAll('[data-take]').forEach(btn=>btn.onclick=async()=>{
      if (!S.group){
        const e = (S.localFeed['duty-swap']||[]).find(x=>x.id===btn.dataset.take);
        if (e){ e.meta.comments = e.meta.comments||[]; e.meta.comments.push({id:uid(), ts:Date.now(), authorName:'Я', text:t('duty_taken')}); save(); }
        return loadSwaps();
      }
      try { await api(`/groups/${S.group.code}/entries/${btn.dataset.take}/comments`,{method:'POST',
        body:{authorId:S.group.me.id, authorName:S.group.me.name, text:t('duty_taken')}});
        toast(t('posted')); loadSwaps(); } catch(e){ toast(e.message); }
    });
    bindFeedActions(box, 'duty-swap', loadSwaps);
  }
  loadSwaps();
};

/* ---------- SETTINGS: group & language ---------- */
ROUTES.setgroup = function(){
  const g = S.group;
  return head(t('nav_lang')) + `
  <div class="card"><h3>${ic('globe')} ${t('set_lang')}</h3>
    <div class="chiprow">
      <button class="chip ${S.lang==='ru'?'on':''}" data-l="ru">Русский</button>
      <button class="chip ${S.lang==='uz'?'on':''}" data-l="uz">Oʻzbekcha</button>
      <button class="chip ${S.lang==='en'?'on':''}" data-l="en">English</button>
    </div>
    <p class="muted" style="font-size:.8rem">${t('disclaimer')}</p>
  </div>
  <div class="card"><h3>${ic('users')} ${t('set_group')}</h3>
    <p id="static-note" class="muted" style="font-size:.84rem"></p>
    ${g?`<div class="entry">
      <div class="meta"><span class="badge ok">${g.code}</span> <b>${esc(g.name)}</b></div>
      <p>${t('role')}: <b>${g.me.role==='admin'?t('role_admin'):t('role_student')}</b> · ${esc(g.me.name)}</p>
      <div class="auth-actions">
        <button class="btn small secondary" id="grp-cp">${ic('copy')} ${t('auth_copy')}</button>
        <button class="btn small secondary" id="grp-cl">${ic('link')} ${t('auth_copy_link')}</button>
      </div>
      ${g.me.role==='admin'&&g.adminKey?`<p class="muted" style="font-size:.8rem">${t('auth_admin_key')}: <code>${g.adminKey}</code></p>`:''}
      <p><button class="btn danger small" id="grp-leave">${t('leave_group')}</button></p>
    </div>`:`
    <p class="muted" style="font-size:.88rem">${t('auth_choose')}</p>
    <div class="formrow g2">
      <p><button class="btn" id="grp-open-create">${ic('crown')} ${t('auth_teacher')}</button></p>
      <p><button class="btn secondary" id="grp-open-join">${ic('users')} ${t('auth_student')}</button></p>
    </div>`}
    <div id="grp-members"></div>
  </div>`;
};
ROUTES.setgroup.after = function(){
  $$('[data-l]').forEach(b=>b.onclick=()=>{ S.lang=b.dataset.l; save(); applyChrome(); go('setgroup'); toast(t('saved')); });
  const oc = $('#grp-open-create');
  if (oc) oc.onclick = ()=> Auth.show('create');
  const oj = $('#grp-open-join');
  if (oj) oj.onclick = ()=> Auth.show('join');
  const cp = $('#grp-cp');
  if (cp) cp.onclick = ()=> Auth.copyText(S.group.code);
  const cl = $('#grp-cl');
  if (cl) cl.onclick = ()=> Auth.copyText(Auth.inviteLink(S.group.code));
  const lv = $('#grp-leave');
  if (lv) lv.onclick = ()=>{ S.group=null; S.authSkip=false; save(); applyChrome(); go('setgroup'); };
  Store.ready.then(()=>{
    if (Store.isStatic()){
      const box = $('#static-note');
      if (box) box.innerHTML = `${ic('box')} <b>Статический режим</b>: сайт развёрнут без сервера, поэтому группы, ленты и синхронизация хранятся только в этом браузере. Для обмена между устройствами задеплойте Node-версию (README → «Вариант Б») или запустите <code>npm start</code>.`;
    }
  });
  const mem = $('#grp-members');
  if (mem && S.group) api(`/groups/${S.group.code}`).then(j=>{
    mem.innerHTML = `<h3 style="font-size:.95rem">${t('group_members')} (${j.group.members.length})</h3>
      <div class="chiprow">${j.group.members.map(m=>`<span class="badge">${m.role==='admin'?ic('crown'):ic('grad')} ${esc(m.name)}</span>`).join('')}</div>`;
  }).catch(()=>{});
};

/* ---------- SETTINGS: look ---------- */
ROUTES.setlook = function(){
  return head(t('nav_look')) + `
  <div class="card"><h3>${ic('palette')} ${t('set_theme')}</h3>
    <div class="chiprow">
      <button class="chip ${S.theme==='light'?'on':''}" data-th="light">${ic('sun')} ${t('theme_light')}</button>
      <button class="chip ${S.theme==='dark'?'on':''}" data-th="dark">${ic('moon')} ${t('theme_dark')}</button>
      <button class="chip ${S.theme==='night'?'on':''}" data-th="night">${ic('flame')} ${t('theme_night')}</button>
    </div>
  </div>
  <div class="card"><h3>${ic('monitor')} ${t('set_quality')}</h3>
    <div class="chiprow">
      <button class="chip ${S.quality==='low'?'on':''}" data-q="low">${t('quality_low')}</button>
      <button class="chip ${S.quality==='high'?'on':''}" data-q="high">${t('quality_high')}</button>
    </div>
  </div>
  <div class="card"><h3>${ic('book')} ${t('set_latin')}</h3>
    <p><button class="chip ${S.latin?'on':''}" id="latin-toggle">${S.latin?ic('check')+' ':''}${t('latin_on')}</button></p>
  </div>`;
};
ROUTES.setlook.after = function(){
  $$('[data-th]').forEach(b=>b.onclick=()=>{ S.theme=b.dataset.th; save(); applyChrome(); go('setlook'); });
  $$('[data-q]').forEach(b=>b.onclick=()=>{ S.quality=b.dataset.q; save(); go('setlook'); });
  $('#latin-toggle').onclick = ()=>{ S.latin=!S.latin; save(); go('setlook'); };
};

/* ---------- SETTINGS: data ---------- */
ROUTES.setdata = function(){
  return head(t('nav_data')) + `
  <div class="card"><h3>${ic('download')} ${t('set_offline')}</h3>
    <p class="muted" style="font-size:.85rem">МКБ, препараты, нормы, протоколы, калькуляторы, тесты и кейсы уже встроены в приложение и работают без интернета. Нажмите, чтобы закрепить кэш.</p>
    <p><button class="btn" id="off-dl">${S.basesOffline?ic('check')+' ':ic('download')+' '}${t('offline_dl')}</button></p>
  </div>
  <div class="card"><h3>${ic('save')} ${t('backup')}</h3>
    <p><button class="btn secondary" id="bk-export">${ic('download')} ${t('backup_export')}</button>
    <label class="btn secondary" style="cursor:pointer">${ic('upload')} ${t('backup_import')}<input type="file" id="bk-import" accept=".json" hidden></label></p>
    <label class="f">${t('sync_key')}</label>
    <div style="display:flex;gap:8px"><input type="text" id="bk-key" value="${esc(S.syncKey)}" placeholder="мой-ключ-2026">
    <button class="btn small" id="bk-up">${ic('upload')}</button><button class="btn small secondary" id="bk-down">${ic('download')}</button></div>
    <p class="muted" style="font-size:.8rem">Синхронизация по ключу: тот же ключ на другом устройстве подтянет данные.</p>
  </div>
  <div class="card"><h3>${ic('doc')} ${t('export_pdf')}</h3>
    <p><button class="btn secondary" id="ex-diary-print">${ic('printer')} ${t('nav_diary')} → ${t('print')}</button>
    <button class="btn secondary" id="ex-diary-pdf">${ic('download')} ${t('nav_diary')} → PDF</button>
    <button class="btn secondary" id="ex-grades-pdf">${ic('download')} ${t('nav_grades')} → PDF</button>
    <button class="btn secondary" id="ex-duty-pdf">${ic('download')} ${t('nav_duty')} → PDF</button></p>
  </div>`;
};
ROUTES.setdata.after = function(){
  $('#off-dl').onclick = ()=>{ S.basesOffline=true; save(); go('setdata'); toast(t('offline_ok')); };
  $('#bk-export').onclick = ()=>{ download(`medhub-backup-${todayISO()}.json`, JSON.stringify(S,null,1)); toast(t('backup_ok')); };
  $('#bk-import').onchange = e=>{
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ()=>{ try { const j = JSON.parse(r.result);
      S = Object.assign({}, DEFAULTS, j); save(); applyChrome(); toast(t('backup_ok')); go('setdata'); }
      catch { toast(t('backup_bad')); } };
    r.readAsText(f);
  };
  $('#bk-up').onclick = async ()=>{
    S.syncKey = $('#bk-key').value.trim(); save();
    if (!S.syncKey) return toast(t('required'));
    try { await api(`/sync/${encodeURIComponent(S.syncKey)}`, {method:'PUT', body:S}); toast(t('backup_ok')); }
    catch(e){ toast(t('backup_bad')+': '+e.message); }
  };
  $('#bk-down').onclick = async ()=>{
    S.syncKey = $('#bk-key').value.trim();
    if (!S.syncKey) return toast(t('required'));
    try { const j = await api(`/sync/${encodeURIComponent(S.syncKey)}`);
      S = Object.assign({}, DEFAULTS, j.data); save(); applyChrome(); toast(t('backup_ok')); go('setdata'); }
    catch(e){ toast(t('backup_bad')); }
  };
  $('#ex-diary-print').onclick = ()=>{ go('curation'); setTimeout(()=>window.print(), 400); };
  $('#ex-diary-pdf').onclick = ()=>{ go('curation'); setTimeout(()=>$('#cur-pdf')?.click(), 500); };
  $('#ex-grades-pdf').onclick = ()=>{ go('grades'); setTimeout(()=>$('#g-pdf')?.click(), 500); };
  $('#ex-duty-pdf').onclick = ()=>{ go('duty'); setTimeout(()=>$('#duty-pdf')?.click(), 500); };
};

/* ---------- SETTINGS: notifications ---------- */
ROUTES.setnotif = function(){
  return head(t('set_notif')) + `
  <div class="card">
    <p><button class="chip ${S.notif.duty?'on':''}" id="n-duty">${ic('bed')} ${t('notif_duty')}</button></p>
    <p><button class="chip ${S.notif.colloq?'on':''}" id="n-colloq">${ic('warn')} ${t('notif_colloq')}</button></p>
    <p><button class="chip ${S.notif.cards?'on':''}" id="n-cards">${ic('cards')} ${t('notif_cards')}</button></p>
    <hr style="border:0;border-top:1px solid var(--line);margin:14px 0">
    <p><button class="btn" id="n-ask">${ic('bell')} ${t('notif_ask')}</button>
    <button class="btn secondary" id="n-test">${t('notif_test')}</button></p>
    <p class="muted" id="n-status" style="font-size:.82rem"></p>
  </div>`;
};
ROUTES.setnotif.after = function(){
  const tog = (id, key)=>{ $(id).onclick = ()=>{ S.notif[key]=!S.notif[key]; save(); go('setnotif'); }; };
  tog('#n-duty','duty'); tog('#n-colloq','colloq'); tog('#n-cards','cards');
  const status = $('#n-status');
  const upd = ()=>{ status.textContent = Notification.permission==='granted'?ic('check')+' '+t('notif_ask'):
    Notification.permission==='denied'?ic('x')+' '+t('notif_denied'):''; };
  $('#n-ask').onclick = ()=>Notification.requestPermission().then(upd);
  $('#n-test').onclick = ()=>notify('MedHub', t('notif_test'));
  if ('Notification' in window) upd();
};
function notify(title, body){
  if (!('Notification' in window)) return toast(body);
  if (Notification.permission==='granted') new Notification(title, {body});
  else toast(body);
}
/* periodic checks */
setInterval(()=>{
  if (!S.notif) return;
  const t0 = todayISO(), now = new Date().toISOString().slice(0,10);
  if (S.notif.colloq){
    const soon = S.events.find(e=>['exam','colloq','test'].includes(e.type) && daysBetween(t0, e.date)===1);
    if (soon && !notify._colloqDone){ notify._colloqDone = t0; notify('MedHub', `⏰ ${soon.title||t('ev_'+soon.type)} — ${soon.date}`); }
  }
  if (S.notif.duty){
    const d = S.duties.find(x=>x.date===new Date(Date.now()+86400000).toISOString().slice(0,10));
    if (d && !notify._dutyDone){ notify._dutyDone = t0; notify('MedHub', `${ic('bed')} ${t('notif_duty')}: ${d.date} ${d.from}–${d.to}`); }
  }
  if (S.notif.cards && dueCards().length>5 && new Date().getHours()===19 && !notify._cardsDone){
    notify._cardsDone = t0; notify('MedHub', `${ic('cards')} ${t('cards_due')}: ${dueCards().length}`);
  }
}, 60000);

/* ---------------- boot ---------------- */
$('#lang-select').onchange = e=>{ S.lang = e.target.value; save(); applyChrome(); go(currentRoute); };
$('#theme-btn').onclick = ()=>{ S.theme = S.theme==='light'?'dark':S.theme==='dark'?'night':'light'; save(); applyChrome(); go(currentRoute); };
function globalSearch(){
  const q = $('#global-search').value.trim();
  if (!q) return;
  go('search', q); setTimeout(()=>{ const i=$('#s-in'); if(i) i.focus(); }, 60);
}
$('#search-go').onclick = globalSearch;
$('#global-search').addEventListener('keydown', e=>{ if (e.key==='Enter') globalSearch(); });
document.addEventListener('keydown', e=>{ if (e.key==='/' && document.activeElement.tagName!=='INPUT' && document.activeElement.tagName!=='TEXTAREA'){
  e.preventDefault(); $('#global-search').focus(); } });
document.addEventListener('click', e=>{
  const g = e.target.closest('[data-goto]');
  if (g){ e.preventDefault(); go(g.dataset.goto); }
});
/* ================= ДОСКА (белая доска для ТВ/проектора) ================= */
const Board = (function(){
  const LS = 'medhub_board_v1';
  let cv=null, ctx=null, wrap=null, ro=null;
  let objs=[], view={ox:0, oy:0, scale:1};
  let undoS=[], redoS=[];
  let tool='pen', color='#1f2937', width=4, gridOn=true;
  let cur=null, sel=null, pan=null, dragSel=null, spaceDown=false;
  let editTa=null, editObj=null, editNew=false, editPos=null;
  let imgCache={};
  let saveT=null;
  const PALETTE=['#1f2937','#dc2626','#2563eb','#16a34a','#d97706','#7c3aed'];
  const WIDTHS=[3,5,9,16];

  const clone = o => JSON.parse(JSON.stringify(o));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

  function norm(o){
    if ((o.type==='rect'||o.type==='ellipse') && (o.w<0||o.h<0)){
      if (o.w<0){ o.x+=o.w; o.w=-o.w; }
      if (o.h<0){ o.y+=o.h; o.h=-o.h; }
    }
    if ((o.type==='line'||o.type==='arrow') && (o.x2<o.x1)){ const t=o.x1; o.x1=o.x2; o.x2=t; const t2=o.y1; o.y1=o.y2; o.y2=t2; }
    return o;
  }
  function pushUndo(){ undoS.push(clone(objs)); if (undoS.length>60) undoS.shift(); redoS.length=0; }
  function undo(){ if(!undoS.length) return; redoS.push(clone(objs)); objs=undoS.pop(); sel=null; draw(); persist(); updBtns(); }
  function redo(){ if(!redoS.length) return; undoS.push(clone(objs)); objs=redoS.pop(); sel=null; draw(); persist(); updBtns(); }
  function persist(){
    clearTimeout(saveT); saveT=setTimeout(()=>{ try{ localStorage.setItem(LS, JSON.stringify({objs, view})); }catch(e){} }, 500); }

  /* ---------- координаты ---------- */
  function toWorld(e){
    const r = cv.getBoundingClientRect();
    return [ (e.clientX - r.left - view.ox)/view.scale, (e.clientY - r.top - view.oy)/view.scale ];
  }
  function toScreen(x, y){
    return [ x*view.scale + view.ox, y*view.scale + view.oy ];
  }
  function updZoom(){
    if (!wrap) return;
    const v=wrap.querySelector('.bz-val');
    if (v) v.textContent=Math.round(view.scale*100)+'%';
  }

  /* ---------- рисование ---------- */
  function rr(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  }
  function drawObj(o){
    ctx.save();
    ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.strokeStyle=o.color||color; ctx.fillStyle=o.color||color; ctx.lineWidth=o.size||4;
    if (o.type==='pen'){
      ctx.beginPath();
      o.pts.forEach((p,i)=> i? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]));
      if (o.pts.length===1){ ctx.lineTo(o.pts[0][0]+.5, o.pts[0][1]+.5); }
      ctx.stroke();
    } else if (o.type==='line'){
      ctx.beginPath(); ctx.moveTo(o.x1,o.y1); ctx.lineTo(o.x2,o.y2); ctx.stroke();
    } else if (o.type==='arrow'){
      ctx.beginPath(); ctx.moveTo(o.x1,o.y1); ctx.lineTo(o.x2,o.y2); ctx.stroke();
      const a=Math.atan2(o.y2-o.y1, o.x2-o.x1), h=Math.max(11,(o.size||4)*3);
      ctx.beginPath();
      ctx.moveTo(o.x2,o.y2);
      ctx.lineTo(o.x2-h*Math.cos(a-.42), o.y2-h*Math.sin(a-.42));
      ctx.moveTo(o.x2,o.y2);
      ctx.lineTo(o.x2-h*Math.cos(a+.42), o.y2-h*Math.sin(a+.42));
      ctx.stroke();
    } else if (o.type==='rect'){
      ctx.strokeRect(o.x,o.y,o.w,o.h);
    } else if (o.type==='ellipse'){
      ctx.beginPath(); ctx.ellipse(o.x+o.w/2,o.y+o.h/2,Math.abs(o.w/2),Math.abs(o.h/2),0,0,Math.PI*2); ctx.stroke();
    } else if (o.type==='text'){
      ctx.font=(o.size||22)+'px "DejaVu Sans", system-ui, sans-serif';
      ctx.textBaseline='top';
      (o.text||'').split('\n').forEach((ln,i)=> ctx.fillText(ln, o.x, o.y+i*(o.size||22)*1.28));
    } else if (o.type==='note'){
      ctx.save();
      ctx.shadowColor='rgba(15,23,42,.18)'; ctx.shadowBlur=10/view.scale; ctx.shadowOffsetY=3;
      ctx.fillStyle=o.bg||'#fde68a';
      rr(o.x,o.y,o.w,o.h,6); ctx.fill();
      ctx.restore();
      ctx.fillStyle='#78350f';
      ctx.font='16px "DejaVu Sans", system-ui, sans-serif';
      ctx.textBaseline='top';
      const words=(o.text||'').split(/\s+/); let line='', ly=o.y+10;
      const maxW=o.w-20;
      words.forEach(w=>{
        const t2=line?line+' '+w:w;
        if (ctx.measureText(t2).width>maxW && line){ ctx.fillText(line,o.x+10,ly); ly+=20; line=w; }
        else line=t2;
      });
      if (line) ctx.fillText(line,o.x+10,ly);
    } else if (o.type==='img' && imgCache[o.src] && imgCache[o.src].complete){
      ctx.drawImage(imgCache[o.src], o.x, o.y, o.w, o.h);
    }
    ctx.restore();
  }
  function bboxOf(o){
    if (o.type==='pen'){
      let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;
      o.pts.forEach(p=>{ x1=Math.min(x1,p[0]); y1=Math.min(y1,p[1]); x2=Math.max(x2,p[0]); y2=Math.max(y2,p[1]); });
      return [x1,y1,x2,y2];
    }
    if (o.type==='line'||o.type==='arrow') return [Math.min(o.x1,o.x2),Math.min(o.y1,o.y2),Math.max(o.x1,o.x2),Math.max(o.y1,o.y2)];
    if (o.type==='text'){
      const fs=o.size||22, lines=(o.text||'').split('\n');
      let w=10; ctx.font=fs+'px "DejaVu Sans", system-ui, sans-serif';
      lines.forEach(ln=> w=Math.max(w, ctx.measureText(ln).width));
      return [o.x,o.y,o.x+w,o.y+lines.length*fs*1.3];
    }
    if (o.type==='img') return [o.x,o.y,o.x+o.w,o.y+o.h];
    return [o.x,o.y,o.x+(o.w||0),o.y+(o.h||0)];
  }
  function draw(){
    if (!ctx) return;
    const dpr=window.devicePixelRatio||1;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.fillStyle='#f8fafc';
    ctx.fillRect(0,0,cv.width,cv.height);
    ctx.setTransform(dpr*view.scale,0,0,dpr*view.scale,dpr*view.ox,dpr*view.oy);
    const w=cv.width/dpr, h=cv.height/dpr;
    const wx0=-view.ox/view.scale, wy0=-view.oy/view.scale;
    const wx1=(w-view.ox)/view.scale, wy1=(h-view.oy)/view.scale;
    if (gridOn){
      const step=34;
      ctx.save();
      ctx.strokeStyle='#dbe3ee'; ctx.lineWidth=1/view.scale;
      ctx.beginPath();
      for(let x=Math.floor(wx0/step)*step; x<=wx1; x+=step){ ctx.moveTo(x,wy0); ctx.lineTo(x,wy1); }
      for(let y=Math.floor(wy0/step)*step; y<=wy1; y+=step){ ctx.moveTo(wx0,y); ctx.lineTo(wx1,y); }
      ctx.stroke(); ctx.restore();
    }
    objs.forEach(drawObj);
    if (sel){
      const b=bboxOf(sel), pad=8;
      ctx.save();
      ctx.strokeStyle='#2563eb'; ctx.lineWidth=1.5/view.scale; ctx.setLineDash([6/view.scale,4/view.scale]);
      ctx.strokeRect(b[0]-pad,b[1]-pad,b[2]-b[0]+pad*2,b[3]-b[1]+pad*2);
      ctx.restore();
    }
  }
  function resize(){
    if (!wrap||!cv) return;
    const dpr=window.devicePixelRatio||1, r=wrap.getBoundingClientRect();
    cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr);
    cv.style.width=r.width+'px'; cv.style.height=r.height+'px';
    draw();
  }

  /* ---------- hit-test ---------- */
  function distSeg(px,py,x1,y1,x2,y2){
    const dx=x2-x1, dy=y2-y1, L=dx*dx+dy*dy;
    let t = L? ((px-x1)*dx+(py-y1)*dy)/L : 0;
    t=Math.max(0,Math.min(1,t));
    const qx=x1+t*dx, qy=y1+t*dy;
    return Math.hypot(px-qx,py-qy);
  }
  function hit(wx,wy){
    for (let i=objs.length-1;i>=0;i--){
      const o=objs[i], tol=(o.size||16)/2+6/view.scale;
      if (o.type==='pen'){
        for (let j=1;j<o.pts.length;j++) if (distSeg(wx,wy,o.pts[j-1][0],o.pts[j-1][1],o.pts[j][0],o.pts[j][1])<tol) return o;
        if (o.pts.length===1 && Math.hypot(wx-o.pts[0][0],wy-o.pts[0][1])<tol) return o;
      } else if (o.type==='line'||o.type==='arrow'){
        if (distSeg(wx,wy,o.x1,o.y1,o.x2,o.y2)<tol) return o;
      } else if (o.type==='rect'||o.type==='note'||o.type==='img'){
        if (wx>=o.x-tol && wx<=o.x+o.w+tol && wy>=o.y-tol && wy<=o.y+o.h+tol) return o;
      } else if (o.type==='ellipse'){
        const cx=o.x+o.w/2, cy=o.y+o.h/2, rx=Math.abs(o.w/2)+tol, ry=Math.abs(o.h/2)+tol;
        if (((wx-cx)/rx)**2 + ((wy-cy)/ry)**2 <= 1) return o;
      } else if (o.type==='text'){
        const b=bboxOf(o);
        if (wx>=b[0]-4 && wx<=b[2]+4 && wy>=b[1] && wy<=b[3]+4) return o;
      }
    }
    return null;
  }
  function translate(o,dx,dy){
    if (o.type==='pen') o.pts=o.pts.map(p=>[p[0]+dx,p[1]+dy]);
    else if (o.type==='line'||o.type==='arrow'){ o.x1+=dx; o.y1+=dy; o.x2+=dx; o.y2+=dy; }
    else { o.x+=dx; o.y+=dy; }
  }

  /* ---------- редактор текста ---------- */
  function closeEditor(commit){
    if (!editTa) return;
    const ta=editTa, obj=editObj, isNew=editNew, pos=editPos;
    editTa=null; editObj=null; editNew=false; editPos=null;
    try{ ta.remove(); }catch(_e){}
    const val=ta.value.trim();
    if (commit && val){
      if (isNew){
        objs.push({id:uid(),type:'text',x:pos.x,y:pos.y,text:val,color,size:22});
        sel=null;
      } else {
        obj.text=val;
      }
      persist();
    }
    draw();
  }
  function pushUndoIfSel(){ /* без undo для правки текста — упрощение */ }
  function openEditor(o, wx, wy){
    closeEditor(false);
    editObj=o; editNew=!o; editPos={x:wx||0,y:wy||0};
    const ta=document.createElement('textarea');
    ta.id='board-edit';
    ta.className='board-edit' + (o&&o.type==='note'?' is-note':'');
    ta.placeholder = o&&o.type==='note' ? t('board_note_ph') : t('board_text_ph');
    const [sx,sy]=toScreen(o?o.x:wx, o?o.y:wy);
    const r=wrap.getBoundingClientRect();
    ta.style.left=(sx)+'px'; ta.style.top=(sy)+'px';
    if (o){ ta.value=o.text||''; if(o.type==='note'){ ta.style.width=o.w+'px'; ta.style.height=o.h+'px'; } }
    ta.style.fontSize=((o&&o.size)||22)*view.scale+'px';
    ta.style.color=(o&&o.color)||color;
    wrap.appendChild(ta);
    editTa=ta;
    setTimeout(()=>{ ta.focus(); ta.setSelectionRange(ta.value.length,ta.value.length); },0);
    ta.addEventListener('keydown', e=>{
      e.stopPropagation();
      if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); closeEditor(true); }
      if (e.key==='Escape'){ closeEditor(false); }
    });
    ta.addEventListener('blur', ()=> closeEditor(true));
  }

  /* ---------- события ---------- */
  function onDown(e){
    if (e.button===1 || tool==='pan' || spaceDown){
      pan={x:e.clientX,y:e.clientY,ox:view.ox,oy:view.oy};
      try{cv.setPointerCapture(e.pointerId);}catch(_e){} return;
    }
    if (e.button!==0) return;
    closeEditor(true);
    const [wx,wy]=toWorld(e);
    if (tool==='select'){
      const o=hit(wx,wy);
      sel=o;
      if (o){ dragSel={o,dx:wx,dy:wy,moved:false,orig:clone(objs)}; }
      draw(); updBtns(); return;
    }
    if (tool==='erase'){
      const o=hit(wx,wy);
      if (o){ pushUndo(); objs=objs.filter(x=>x!==o); if(sel===o)sel=null; draw(); persist(); updBtns(); }
      cur={erase:true}; cv.setPointerCapture(e.pointerId); return;
    }
    if (tool==='text'){ openEditor(null,wx,wy); return; }
    if (tool==='note'){
      pushUndo();
      objs.push({id:uid(),type:'note',x:wx,y:wy,w:180,h:120,text:'',bg:'#fde68a'});
      const o=objs[objs.length-1];
      draw(); persist();
      openEditor(o,wx,wy);
      return;
    }
    if (tool==='pen'){
      pushUndo();
      objs.push({id:uid(),type:'pen',pts:[[wx,wy]],color,size:width});
      cur=objs[objs.length-1]; try{cv.setPointerCapture(e.pointerId);}catch(_e){} return;
    }
    // фигуры
    pushUndo();
    const base={id:uid(),color,size:width};
    let o;
    if (tool==='line'||tool==='arrow') o=Object.assign(base,{type:tool,x1:wx,y1:wy,x2:wx,y2:wy});
    else o=Object.assign(base,{type:tool,x:wx,y:wy,w:0,h:0});
    objs.push(o); cur=o; try{cv.setPointerCapture(e.pointerId);}catch(_e){}
  }
  function onMove(e){
    if (pan){
      view.ox=pan.ox+(e.clientX-pan.x); view.oy=pan.oy+(e.clientY-pan.y);
      draw(); return;
    }
    if (dragSel){
      const [wx,wy]=toWorld(e);
      if (!dragSel.moved){ if (Math.hypot(wx-dragSel.dx,wy-dragSel.dy)<2/view.scale) return; dragSel.moved=true; objs=clone(dragSel.orig); dragSel.o=objs.find(x=>x.id===dragSel.o.id)||dragSel.o; sel=dragSel.o; }
      translate(sel, wx-dragSel.dx, wy-dragSel.dy);
      dragSel.dx=wx; dragSel.dy=wy;
      draw(); return;
    }
    if (cur && cur.erase){
      const [wx,wy]=toWorld(e);
      const o=hit(wx,wy);
      if (o){ objs=objs.filter(x=>x!==o); draw(); persist(); updBtns(); }
      return;
    }
    if (!cur) return;
    const [wx,wy]=toWorld(e);
    if (cur.type==='pen'){ cur.pts.push([wx,wy]); }
    else if (cur.type==='line'||cur.type==='arrow'){ cur.x2=wx; cur.y2=wy; }
    else { cur.w=wx-cur.x; cur.h=wy-cur.y; }
    draw();
  }
  function onUp(){
    if (pan){ pan=null; persist(); return; }
    if (dragSel){ if (dragSel.moved) persist(); dragSel=null; updBtns(); return; }
    if (cur){
      if (cur.type!=='pen' && cur.type!=='line' && cur.type!=='arrow'){
        if (Math.abs(cur.w)<3 && Math.abs(cur.h)<3){ cur.w=cur.w<0?-60:60; cur.h=cur.h<0?-60:60; if(cur.type==='ellipse'){cur.h=cur.w;} }
      }
      if (cur.type==='pen' && cur.pts.length<2){ cur.pts.push([cur.pts[0][0]+.6,cur.pts[0][1]+.6]); }
      cur=null; draw(); persist(); updBtns();
    }
  }
  function onWheel(e){
    e.preventDefault();
    const r=cv.getBoundingClientRect();
    const mx=e.clientX-r.left, my=e.clientY-r.top;
    if (!(e.ctrlKey||e.metaKey)){
      view.ox-=e.deltaX; view.oy-=e.deltaY;
      if (editTa) positionEditor();
      draw(); persist(); updZoom();
      return;
    }
    const k=e.deltaY<0?1.12:1/1.12;
    const ns=Math.max(.15,Math.min(8,view.scale*k));
    const kk=ns/view.scale;
    view.ox=mx-(mx-view.ox)*kk; view.oy=my-(my-view.oy)*kk; view.scale=ns;
    if (editTa) positionEditor();
    draw(); persist(); updZoom();
  }
  function positionEditor(){
    if (!editTa||!editObj) return;
    const [sx,sy]=toScreen(editObj.x,editObj.y);
    editTa.style.left=sx+'px'; editTa.style.top=sy+'px';
    editTa.style.fontSize=((editObj.size)||22)*view.scale+'px';
  }

  /* ---------- зум/fit ---------- */
  function fit(){
    if (!objs.length){ view={ox:0,oy:0,scale:1}; draw(); persist(); return; }
    let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;
    objs.forEach(o=>{ const b=bboxOf(o); x1=Math.min(x1,b[0]); y1=Math.min(y1,b[1]); x2=Math.max(x2,b[2]); y2=Math.max(y2,b[3]); });
    const w=cv.width/(window.devicePixelRatio||1), h=cv.height/(window.devicePixelRatio||1);
    const pad=50;
    const s=Math.max(.15,Math.min(3, Math.min((w-pad*2)/Math.max(1,x2-x1), (h-pad*2)/Math.max(1,y2-y1))));
    view.scale=s;
    view.ox=(w-(x2-x1)*s)/2 - x1*s;
    view.oy=(h-(y2-y1)*s)/2 - y1*s;
    draw(); persist();
  }
  function zoom(k){
    const w=cv.width/(window.devicePixelRatio||1), h=cv.height/(window.devicePixelRatio||1);
    const mx=w/2, my=h/2;
    const ns=Math.max(.15,Math.min(8,view.scale*k)), kk=ns/view.scale;
    view.ox=mx-(mx-view.ox)*kk; view.oy=my-(my-view.oy)*kk; view.scale=ns;
    draw(); persist(); updZoom();
  }

  /* ---------- экспорт ---------- */
  function renderExport(scaleUp){
    if (!objs.length) return null;
    let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;
    objs.forEach(o=>{ const b=bboxOf(o); x1=Math.min(x1,b[0]); y1=Math.min(y1,b[1]); x2=Math.max(x2,b[2]); y2=Math.max(y2,b[3]); });
    const pad=40, W=x2-x1+pad*2, H=y2-y1+pad*2;
    const off=document.createElement('canvas');
    off.width=Math.min(4000,Math.round(W*scaleUp)); off.height=Math.min(4000,Math.round(H*scaleUp));
    const sc=Math.min(off.width/W, off.height/H);
    const c2=off.getContext('2d');
    c2.fillStyle='#ffffff'; c2.fillRect(0,0,off.width,off.height);
    c2.setTransform(sc,0,0,sc,pad*sc-x1*sc,pad*sc-y1*sc);
    const main=ctx; ctx=c2; gridOn=false; objs.forEach(drawObj); ctx=main; gridOn=true;
    return off;
  }
  function png(){
    const off=renderExport(2);
    if (!off) return;
    const a=document.createElement('a');
    a.download='medhub-board-'+Date.now()+'.png';
    a.href=off.toDataURL('image/png');
    a.click();
  }
  function pdf(){
    const off=renderExport(2);
    if (!off) return;
    const load=(src)=>new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); });
    Promise.resolve()
      .then(()=> window.jspdf ? null : load('vendor/jspdf.umd.min.js'))
      .then(()=>{
        const {jsPDF}=window.jspdf;
        const d=new jsPDF({orientation: off.width>off.height?'l':'p', unit:'pt', format:'a4'});
        const pw=d.internal.pageSize.getWidth(), ph=d.internal.pageSize.getHeight();
        const k=Math.min(pw/ph>off.width/off.height ? (ph-40)/off.height : (pw-40)/off.width, 1e9);
        const w=off.width*k, h=off.height*k;
        d.addImage(off.toDataURL('image/jpeg',.92),'JPEG',(pw-w)/2,(ph-h)/2,w,h);
        d.save('medhub-board-'+Date.now()+'.pdf');
      }).catch(()=>{});
  }

  /* ---------- снимки из атласа ---------- */
  function imageBank(){
    const out=[];
    (window.ANAT_LIB||[]).forEach(a=>{ if (a.img) out.push({src:a.img, t:a.title||a.name||''}); });
    (window.ATLAS||[]).forEach(a=>{ if (a.img) out.push({src:a.img, t:a.title||a.name||''}); });
    return out;
  }
  function addImage(src){
    let im=imgCache[src];
    if (!im){ im=new Image(); im.src=src; imgCache[src]=im; }
    const place=()=>{
      pushUndo();
      const w=cv.width/(window.devicePixelRatio||1), h=cv.height/(window.devicePixelRatio||1);
      const maxW=w*0.5, maxH=h*0.7;
      let iw=im.naturalWidth||600, ih=im.naturalHeight||800;
      const k=Math.min(maxW/iw, maxH/ih);
      iw*=k; ih*=k;
      const wx=(w/2-view.ox/view.scale)-iw/2, wy=(h/2-view.oy/view.scale)-ih/2;
      objs.push({id:uid(),type:'img',x:Math.round(wx),y:Math.round(wy),w:Math.round(iw),h:Math.round(ih),src});
      draw(); persist(); updBtns();
    };
    if (im.complete) place(); else { im.onload=place; im.onerror=()=>{}; }
  }
  function picker(){
    const old=wrap.querySelector('.board-picker');
    if (old){ old.remove(); return; }
    const items=imageBank().filter(a=>!/\.(svg|mp3)$/i.test(a.src));
    const p=document.createElement('div');
    p.className='board-picker';
    p.innerHTML='<div class="bp-title">'+ic('image')+' '+t('board_image')+'</div><div class="bp-grid"></div>';
    const g=p.querySelector('.bp-grid');
    items.forEach(a=>{
      const b=document.createElement('button');
      b.className='bp-item';
      b.innerHTML='<img loading="lazy" src="'+a.src+'" alt=""><span></span>';
      b.querySelector('span').textContent=a.t;
      b.onclick=()=>{ p.remove(); addImage(a.src); };
      g.appendChild(b);
    });
    if (!items.length) g.innerHTML='<div class="muted small">—</div>';
    const x=document.createElement('button');
    x.className='bp-close'; x.textContent='✕';
    x.onclick=()=>p.remove();
    p.appendChild(x);
    wrap.appendChild(p);
  }

  /* ---------- кнопки/тулбар ---------- */
  function tbtn(tool2, icon, key, extra){
    return '<button class="btool'+(extra||'')+'" data-tool="'+tool2+'" title="'+esc(t(key))+'">'+ic(icon)+'</button>';
  }
  function updBtns(){
    if (!wrap) return;
    wrap.querySelectorAll('.btool[data-tool]').forEach(b=> b.classList.toggle('active', b.dataset.tool===tool));
    const u=wrap.querySelector('[data-act=undo]'), r=wrap.querySelector('[data-act=redo]');
    if (u) u.disabled=!undoS.length;
    if (r) r.disabled=!redoS.length;
  }
  function setTool(t2){ closeEditor(true); sel=null; tool=t2; draw(); updBtns(); syncCursor(); }
  function syncCursor(){
    if (!cv) return;
    cv.style.cursor = tool==='pan' ? 'grab' : tool==='select' ? 'default' : tool==='text'||tool==='note' ? 'text' : 'crosshair';
  }

  function mount(){
    wrap=$('#board-wrap'); cv=$('#board-cv');
    if (!wrap||!cv) return;
    ctx=cv.getContext('2d');
    try{
      const saved=JSON.parse(localStorage.getItem(LS)||'null');
      if (saved && Array.isArray(saved.objs)){ objs=saved.objs; view=saved.view||view; }
      else { objs=[]; view={ox:0,oy:0,scale:1}; }
    }catch(e){ objs=[]; }
    undoS=[]; redoS=[]; sel=null; tool='pen';
    (objs.filter(o=>o.type==='img')).forEach(o=>{
      if (!imgCache[o.src]){ const im=new Image(); im.src=o.src; imgCache[o.src]=im; }
    });
    ro=new ResizeObserver(resize); ro.observe(wrap);
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('wheel', onWheel, {passive:false});
    cv.addEventListener('dblclick', e=>{
      const [wx,wy]=toWorld(e);
      const o=hit(wx,wy);
      if (o && (o.type==='text'||o.type==='note')) openEditor(o);
    });
    const gb=wrap.querySelector('[data-act=grid]'); if (gb) gb.classList.add('active');
    bindUi();
    resize(); updBtns(); syncCursor(); updZoom();
  }
  function unmount(){
    closeEditor(false);
    if (ro){ ro.disconnect(); ro=null; }
    wrap=null; cv=null; ctx=null;
  }

  function shortcuts(e){
    if (!wrap || document.activeElement && (document.activeElement.tagName==='INPUT'||document.activeElement.tagName==='TEXTAREA')) return;
    if (e.code==='Space'){ spaceDown=true; }
    const k=e.key.toLowerCase();
    if ((e.ctrlKey||e.metaKey) && k==='z'){ e.preventDefault(); e.shiftKey?redo():undo(); return; }
    if ((e.ctrlKey||e.metaKey) && k==='y'){ e.preventDefault(); redo(); return; }
    if (e.key==='Delete'||e.key==='Backspace'){
      if (sel){ pushUndo(); objs=objs.filter(x=>x!==sel); sel=null; draw(); persist(); updBtns(); }
      return;
    }
    if (e.key==='Escape'){ sel=null; draw(); return; }
    const map={v:'select',p:'pen',e:'erase',l:'line',a:'arrow',r:'rect',o:'ellipse',t:'text',n:'note',h:'pan'};
    if (map[k] && !e.ctrlKey && !e.metaKey && !e.altKey) setTool(map[k]);
  }
  function shortcutsUp(e){ if (e.code==='Space') spaceDown=false; }

  function init(){
    document.addEventListener('keydown', shortcuts);
    document.addEventListener('keyup', shortcutsUp);
    document.addEventListener('fullscreenchange', ()=>{ if (wrap) setTimeout(resize,60); });
  }

  function toolbarHtml(){
    const tools=[['select','cursor','board_select'],['pen','pen','board_pen'],['erase','eraser','board_erase'],
      ['line','bline','board_line'],['arrow','barrow','board_arrow'],['rect','brect','board_rect'],
      ['ellipse','bellipse','board_ellipse'],['text','btext','board_text'],['note','note','board_note'],['pan','move','board_pan']];
    const acts=[['undo','undo','board_undo'],['redo','redo','board_redo'],['grid','grid','board_grid'],
      ['image','image','board_image'],['png','download','board_png'],['pdf','file','board_pdf'],
      ['clear','trash2','board_clear'],['full','fullscreen','board_full']];
    const zooms=[['zin','zoomin','board_zoom_in'],['zout','zoomout','board_zoom_out'],['fit2','fit','board_fit']];
    return `
    <div class="board-tools glass">
      ${tools.map(x=>tbtn(x[0],x[1],x[2])).join('')}
      <div class="bsep"></div>
      <div class="bpal">${PALETTE.map(c=>`<button class="bcolor${c===color?' active':''}" data-color="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div>
      <div class="bsep"></div>
      <div class="bwidths">${WIDTHS.map(w=>`<button class="bw${w===width?' active':''}" data-w="${w}"><i style="width:${Math.min(18,4+w*1.1)}px;height:${Math.min(18,4+w*1.1)}px"></i></button>`).join('')}</div>
    </div>
    <div class="board-acts glass">
      ${acts.map(x=>`<button class="btool" data-act="${x[0]}" title="${esc(t(x[2]))}">${ic(x[1])}</button>`).join('')}
    </div>
    <div class="board-zoom glass">
      ${zooms.map(x=>`<button class="btool" data-zoom="${x[0]}" title="${esc(t(x[2]))}">${ic(x[1])}</button>`).join('')}
      <span class="bz-val">${Math.round(view.scale*100)}%</span>
    </div>`;
  }

  function bindUi(){
    wrap.addEventListener('click', e=>{
      const tb=e.target.closest('[data-tool]');
      if (tb){ setTool(tb.dataset.tool); return; }
      const cb=e.target.closest('[data-color]');
      if (cb){ color=cb.dataset.color; wrap.querySelectorAll('.bcolor').forEach(b=>b.classList.toggle('active',b.dataset.color===color)); closeEditor(true); return; }
      const wb=e.target.closest('[data-w]');
      if (wb){ width=+wb.dataset.w; wrap.querySelectorAll('.bw').forEach(b=>b.classList.toggle('active',+b.dataset.w===width)); return; }
      const ab=e.target.closest('[data-act]');
      if (ab){
        const a=ab.dataset.act;
        if (a==='undo') undo();
        else if (a==='redo') redo();
        else if (a==='grid'){ gridOn=!gridOn; ab.classList.toggle('active',gridOn); draw(); }
        else if (a==='image') picker();
        else if (a==='png') png();
        else if (a==='pdf') pdf();
        else if (a==='clear'){ if (objs.length){ pushUndo(); objs=[]; sel=null; draw(); persist(); updBtns(); } }
        else if (a==='full'){
          if (document.fullscreenElement) document.exitFullscreen();
          else if (wrap.requestFullscreen) wrap.requestFullscreen().catch(()=>{});
        }
        return;
      }
      const zb=e.target.closest('[data-zoom]');
      if (zb){
        const z=zb.dataset.zoom;
        if (z==='zin') zoom(1.25); else if (z==='zout') zoom(1/1.25); else fit();
        const v=wrap.querySelector('.bz-val'); if (v) v.textContent=Math.round(view.scale*100)+'%';
      }
    });
    wrap.addEventListener('pointermove', ()=>{
      const v=wrap.querySelector('.bz-val');
      if (v && v.textContent!==Math.round(view.scale*100)+'%') v.textContent=Math.round(view.scale*100)+'%';
    });
  }

  init();

  const debug = () => ({tool, sel: !!sel, n: objs.length, undo: undoS.length, redo: redoS.length, view: {...view}});
  try{ window.__boardDebug = debug; }catch(_e){}
  return { html: toolbarHtml, mount, unmount, debug };
})();

ROUTES.board = function(){
  return head(t('board_title'), t('board_hint')) + `
  <div class="board-shell">
    <div id="board-wrap">
      <canvas id="board-cv"></canvas>
      ${Board.html()}
    </div>
    <p class="muted small board-tip">${ic('pen')} V/P/E/L/A/R/O/T/N — инструменты · Ctrl+Z / Ctrl+Y — отмена · Delete — удалить выбранное · колесо — двигать · Ctrl+колесо — зум · двойной клик — править текст</p>
  </div>`;
};
ROUTES.board.after = function(){ Board.mount(); };


/* ---------------- Регистрация: учитель создаёт группу, ученики входят по коду ---------------- */
const Auth = (function(){
  const inviteLink = code => location.origin + location.pathname + '?join=' + code;
  function copyText(txt, msg){
    const ok = ()=> toast(msg || t('auth_copied'));
    const fallback = ()=>{ const i=document.createElement('input'); i.value=txt; document.body.appendChild(i); i.select();
      try{ document.execCommand('copy'); ok(); }catch(_e){} i.remove(); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok).catch(fallback);
    else fallback();
  }
  function leave(){ /* после выхода/входа перерисуем активный раздел */
    go(currentRoute);
  }
  function show(mode, prefill){
    const prev = document.querySelector('dialog[open].auth-dlg');
    if (prev) prev.close();
    const d = dlg('<div id="auth-box"></div>');
    d.classList.add('auth-dlg');
    const box = d.querySelector('#auth-box');
    const view = mode || 'choose';

    if (view === 'choose'){
      box.innerHTML = `
        <div class="auth-hero">${ic('grad')}<h3>${t('auth_welcome')}</h3><p class="muted" style="font-size:.92rem;margin:0">${t('auth_choose')}</p></div>
        <div class="auth-roles">
          <button class="auth-role" data-mode="create">${ic('crown')}<span><b>${t('auth_teacher')}</b><span class="muted">${t('auth_teacher_sub')}</span></span></button>
          <button class="auth-role" data-mode="join">${ic('users')}<span><b>${t('auth_student')}</b><span class="muted">${t('auth_student_sub')}</span></span></button>
        </div>
        <p class="muted" style="text-align:center;margin-bottom:0"><a href="#" id="auth-skip">${t('auth_skip')}</a></p>`;
      box.querySelector('[data-mode=create]').onclick = ()=>show('create');
      box.querySelector('[data-mode=join]').onclick = ()=>show('join');
      box.querySelector('#auth-skip').onclick = e=>{ e.preventDefault(); S.authSkip=true; save(); d.close(); };
      return;
    }

    if (view === 'create'){
      box.innerHTML = `
        <h3 style="margin-top:0">${ic('crown')} ${t('auth_create_title')}</h3>
        <label class="f">${t('group_name')}</label><input type="text" id="au-name" placeholder="Лечебный 4 курс, группа 12">
        <label class="f">${t('your_name')}</label><input type="text" id="au-me" placeholder="${t('auth_ph_teacher')}">
        <div class="auth-actions"><button class="btn" id="au-go">${t('set_group_create')}</button>
        <button class="btn secondary" id="au-back">${t('auth_back')}</button></div>`;
      box.querySelector('#au-back').onclick = ()=>show('choose');
      const go1 = async ()=>{
        const name = box.querySelector('#au-name').value.trim(), me = box.querySelector('#au-me').value.trim();
        if (!name || !me) return toast(t('required'));
        try{
          const j = await api('/groups', {method:'POST', body:{name, adminName:me}});
          S.group = {code:j.group.code, name:j.group.name, me:j.me, adminKey:j.adminKey};
          S.authSkip = true; save();
          show('success');
        }catch(e){ toast(e.message); }
      };
      box.querySelector('#au-go').onclick = go1;
      box.querySelector('#au-name').addEventListener('keydown', e=>{ if (e.key==='Enter') go1(); });
      setTimeout(()=>{ try{ box.querySelector('#au-name').focus(); }catch(_e){} }, 80);
      return;
    }

    if (view === 'join'){
      box.innerHTML = `
        <h3 style="margin-top:0">${ic('users')} ${t('auth_join_title')}</h3>
        <label class="f">${t('group_code')}</label><input type="text" id="au-code" value="${esc(prefill||'')}" placeholder="A1B2C3" style="text-transform:uppercase" autocomplete="off">
        <label class="f">${t('your_name')}</label><input type="text" id="au-me">
        <details style="margin-top:8px"><summary class="muted" style="font-size:.8rem;cursor:pointer">${t('auth_have_key')}</summary>
          <input type="text" id="au-key" placeholder="admin key" style="margin-top:6px"></details>
        <div class="auth-actions"><button class="btn" id="au-go">${t('set_group_join')}</button>
        <button class="btn secondary" id="au-back">${t('auth_back')}</button></div>`;
      box.querySelector('#au-back').onclick = ()=>show('choose');
      const go1 = async ()=>{
        const code = box.querySelector('#au-code').value.trim().toUpperCase();
        const me = box.querySelector('#au-me').value.trim();
        const keyEl = box.querySelector('#au-key');
        const key = keyEl ? keyEl.value.trim() : '';
        if (!code || !me) return toast(t('required'));
        try{
          const j = await api('/groups/'+code+'/join', {method:'POST', body:{name:me, adminKey:key || undefined}});
          S.group = {code:j.group.code, name:j.group.name, me:j.me};
          if (j.adminKey) S.group.adminKey = j.adminKey;
          S.authSkip = true; save();
          d.close();
          toast(t('group_saved'));
          leave();
        }catch(e){ toast(e.message); }
      };
      box.querySelector('#au-go').onclick = go1;
      box.querySelector('#au-code').addEventListener('keydown', e=>{ if (e.key==='Enter') box.querySelector('#au-me').focus(); });
      box.querySelector('#au-me').addEventListener('keydown', e=>{ if (e.key==='Enter') go1(); });
      setTimeout(()=>{ try{ (prefill ? box.querySelector('#au-me') : box.querySelector('#au-code')).focus(); }catch(_e){} }, 80);
      return;
    }

    if (view === 'success'){
      const g = S.group;
      box.innerHTML = `
        <h3 style="margin-top:0">${ic('crown')} ${t('auth_done_title')}</h3>
        <p class="muted" style="font-size:.88rem">${t('auth_done_sub')}</p>
        <div class="auth-code">${esc(g.code)}</div>
        <div class="auth-actions">
          <button class="btn small secondary" id="au-cp">${ic('copy')} ${t('auth_copy')}</button>
          <button class="btn small secondary" id="au-cl">${ic('link')} ${t('auth_copy_link')}</button>
        </div>
        <details style="margin-top:10px"><summary class="muted" style="font-size:.8rem;cursor:pointer">${t('auth_admin_key')}</summary>
          <code style="word-break:break-all">${esc(g.adminKey||'')}</code></details>
        <div class="auth-actions"><button class="btn" id="au-open">${t('auth_open_app')}</button></div>`;
      box.querySelector('#au-cp').onclick = ()=>copyText(g.code);
      box.querySelector('#au-cl').onclick = ()=>copyText(inviteLink(g.code));
      box.querySelector('#au-open').onclick = ()=>{ d.close(); leave(); };
      return;
    }
  }
  function maybeShow(){
    let jc = '';
    try{ jc = (new URLSearchParams(location.search).get('join')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8); }catch(_e){}
    if (jc){ try{ history.replaceState(null,'',location.pathname); }catch(_e){} show('join', jc); return; }
    if (!S.group && !S.authSkip) show();
  }
  return { show, maybeShow, copyText, inviteLink };
})();



/* ---------- ИИ-ассистент: панель у поиска, общий ключ сайта ---------- */
const AI = (function(){
  const SYSTEM = 'Ты — ИИ-ассистент MedHub для студентов-медиков. Ты отвечаешь ТОЛЬКО на вопросы, связанные с учебной медициной: анатомия, гистология, биохимия, физиология, патология, фармакология, пропедевтика, клинические дисциплины, лабораторные нормы, диагностика, неотложные состояния (в учебных целях). Если вопрос не по учебной медицине — вежливо откажись одной фразой и предложи задать медицинский вопрос. Отвечай на языке вопроса (по умолчанию русский), кратко и структурировано: списки, ключевые термины с расшифровкой. Не назначай лечение конкретному человеку — давай только учебную информацию и напоминай сверяться с первоисточниками.';
  let proxy = false, sharedKey = null, bound = false, keyReady = false;
  const md = t => esc(t)
    .replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')
    .replace(/\*([^*\n]+)\*/g,'<i>$1</i>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\n/g,'<br>');
  function render(){
    const log = $('#ai-log'); if (!log) return;
    log.innerHTML = (S.aiChat||[]).map(m=>`<div class="aimsg ${m.role}"><div class="ab">${m.role==='assistant'?ic('bot'):ic('grad')}</div><div class="atxt">${md(m.content)}</div></div>`).join('') ||
      `<div class="empty">${t('ai_hello')}</div>`;
    log.scrollTop = log.scrollHeight;
  }
  async function detectKey(){
    if (keyReady) return true;
    if (!Store.isStatic()){
      try { if (await (await api('/ai/key')).shared){ proxy = true; keyReady = true; return true; } } catch(_e){}
    }
    if (window.MEDHUB_AI_KEY){ sharedKey = window.MEDHUB_AI_KEY; proxy = false; keyReady = true; return true; }
    if (S.groqKey){ proxy = false; keyReady = true; return true; }
    return false;
  }
  async function send(q){
    q = (q||'').trim();
    if (!q) return;
    const ok = await detectKey();
    if (!ok){
      $('#ai-keyline').classList.remove('hidden');
      return toast(t('ai_need_key'));
    }
    $('#ai-keyline').classList.add('hidden');
    S.aiChat = S.aiChat||[];
    S.aiChat.push({role:'user', content:q});
    save(); render();
    const inp = $('#ai-q'); if (inp) inp.value='';
    const log = $('#ai-log');
    if (log){
      const tip = document.createElement('div');
      tip.className = 'aimsg assistant typing';
      tip.innerHTML = `<div class="ab">${ic('bot')}</div><div class="atxt"><span></span><span></span><span></span></div>`;
      log.appendChild(tip); log.scrollTop = log.scrollHeight;
    }
    try{
      let ans;
      if (proxy){
        const j = await api('/ai/chat', {method:'POST', body:{messages:[{role:'system', content:SYSTEM}].concat(S.aiChat.slice(-14))}});
        ans = j.content || '—';
      } else {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {method:'POST',
          headers:{'Authorization':'Bearer '+(sharedKey||S.groqKey), 'Content-Type':'application/json'},
          body: JSON.stringify({model:'llama-3.3-70b-versatile', temperature:0.35, max_tokens:1200,
            messages:[{role:'system', content:SYSTEM}].concat(S.aiChat.slice(-14))})});
        const j = await r.json().catch(()=>({}));
        if (!r.ok) throw new Error(r.status===401 ? t('ai_bad_key') : ((j.error&&j.error.message)||('HTTP '+r.status)));
        ans = (j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content) || '—';
      }
      S.aiChat.push({role:'assistant', content:ans});
      if (S.aiChat.length>40) S.aiChat = S.aiChat.slice(-40);
      save();
    }catch(e){ toast(e.message || t('ai_err')); }
    render();
  }
  function mount(){
    if (bound) return; bound = true;
    $('#ai-sub').textContent = t('ai_med_only');
    $('#ai-q').placeholder = t('ai_ph');
    $('#ai-foot').innerHTML = t('ai_disclaimer') + ' · <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com/keys</a>';
    $('#ai-sug').innerHTML = ['ai_s1','ai_s2','ai_s3','ai_s4'].map(k=>`<button class="chip" data-q="${esc(t(k))}">${esc(t(k))}</button>`).join('');
    $$('#ai-sug .chip').forEach(c=>c.onclick = ()=>{ AI.toggle(); send(c.dataset.q); });
    $('#ai-send').onclick = ()=>send($('#ai-q').value);
    $('#ai-q').addEventListener('keydown', e=>{ if (e.key==='Enter') send($('#ai-q').value); });
    $('#ai-close').onclick = ()=>$('#ai-panel').classList.add('hidden');
    $('#ai-keysave').onclick = ()=>{ const v=$('#ai-keyin').value.trim(); if(!v) return toast(t('required')); S.groqKey=v; save(); $('#ai-keyline').classList.add('hidden'); toast(t('saved')); send('Привет! Что ты умеешь?'); };
    document.addEventListener('click', e=>{
      const p = $('#ai-panel');
      if (!p.classList.contains('hidden') && !e.target.closest('#ai-panel') && !e.target.closest('#ai-btn'))
        p.classList.add('hidden');
    });
    detectKey().then(ok=>{ if (!ok && !$('#ai-panel').classList.contains('hidden')) $('#ai-keyline').classList.remove('hidden'); });
  }
  function toggle(){
    mount();
    const p = $('#ai-panel');
    p.classList.toggle('hidden');
    if (!p.classList.contains('hidden')){
      render();
      detectKey().then(ok=>{ $('#ai-keyline').classList.toggle('hidden', !!ok || !!S.groqKey); });
      setTimeout(()=>{ try{ $('#ai-q').focus(); }catch(_e){} }, 90);
    }
  }
  return {toggle, send, render};
})();

applyChrome();
go('grades');
setTimeout(()=>{ try{ Auth.maybeShow(); }catch(_e){} }, 700);
})();
