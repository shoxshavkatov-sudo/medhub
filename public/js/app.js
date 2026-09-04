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
  grades:[], events:[], diary:[], skills:{}, ops:[], reflect:[], duties:[],
  decks:[], cards:[], srs:{}, streak:0, lastReview:'',
  patient:{solved:0, attempted:0}, notif:{duty:true, colloq:true, cards:true},
  group:null, syncKey:'', basesOffline:false};
let S;
try { S = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem('medhub')||'{}')); }
catch { S = Object.assign({}, DEFAULTS); }
const save = () => localStorage.setItem('medhub', JSON.stringify(S));
window.LANG = S.lang;

/* ---------------- api ---------------- */
async function api(path, opts={}){
  const r = await fetch('/api'+path, Object.assign({headers:{'Content-Type':'application/json'}}, opts,
    opts.body ? {body: JSON.stringify(opts.body)} : {}));
  const j = await r.json().catch(()=>({error:'bad json'}));
  if (!r.ok) throw new Error(j.error || r.status);
  return j;
}

/* ---------------- i18n / theme ---------------- */
function applyChrome(){
  document.documentElement.dataset.theme = S.theme;
  window.LANG = S.lang;
  $('#lang-select').value = S.lang;
  $('#global-search').placeholder = t('search_placeholder');
  $('.small-print').textContent = t('disclaimer');
  $('#theme-btn').textContent = S.theme==='light'?'🌙':S.theme==='dark'?'☀️':'🔴';
  buildDock();
}
let currentRoute = 'grades';

/* --- hand-made SVG icons for the dock --- */
const DOCK_ICONS = {
 academy:'<path d="M12 4 21 8.5 12 13 3 8.5Z"/><path d="M6.5 10.8V15c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8v-4.2"/><path d="M21 8.5v5.5"/>',
 search:'<circle cx="11" cy="11" r="6.2"/><path d="m15.8 15.8 5 5"/>',
 ref:'<path d="M5.5 5A2.5 2.5 0 0 1 8 2.5h10.5V19H8A2.5 2.5 0 0 0 5.5 21.5Z"/><path d="M5.5 19V5"/><path d="M12 6.5v6M9 9.5h6"/>',
 sims:'<path d="M12 20.5S4.6 16.2 2.9 11.6C1.7 8.3 3.8 5.2 7 5.2c2 0 3.7 1 5 2.7C13.3 6.2 15 5.2 17 5.2c3.2 0 5.3 3.1 4.1 6.4C19.4 16.2 12 20.5 12 20.5Z"/><path d="M6.2 11.5h2.6l1.4-2.7 2.9 5.6 1.4-2.9h3.3"/>',
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
  currentRoute = route;
  $$('#nav .nav-item').forEach(b=>b.classList.toggle('active', b.dataset.route===route));
  const fn = ROUTES[route];
  $('#view').innerHTML = fn ? fn(arg) : '<div class="empty">404</div>';
  $('#view').scrollTop = 0;
  if (fn && fn.after) fn.after(arg);
  buildDock();
}
function stopSims(){ if (window.ECGRen) ECGRen.stop(); if (window.Ausc) Ausc.stop(); }

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
  <select id="f-vis"><option value="private" ${cur==='private'?'selected':''}>🔒 ${t('vis_private')}</option>
  <option value="group" ${cur==='group'?'selected':''}>👥 ${t('vis_group')}</option>
  <option value="public" ${cur==='public'?'selected':''}>🌍 ${t('vis_public')}</option></select>`;
const visIcon = v => v==='private'?'🔒':v==='public'?'🌍':'👥';

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
    <p><button class="btn" id="g-add">＋ ${t('add')}</button></p>
  </div>
  <div class="card"><h3>${t('subject')}</h3><div class="table-wrap">
    <table><thead><tr><th>${t('subject')}</th><th>${t('course')}</th><th>${t('grade')}</th><th>${t('credits')}</th><th>${t('date')}</th><th></th></tr></thead>
    <tbody>${S.grades.slice().sort((a,b)=>b.date<a.date?-1:1).map(g=>`
      <tr><td>${esc(g.subject)}</td><td>${t('course'+g.course)}</td><td><b>${g.grade}</b></td><td>${g.cred||'—'}</td><td>${g.date}</td>
      <td><button class="btn small danger" data-del="${g.id}">✕</button></td></tr>`).join('') ||
      `<tr><td colspan="6" class="muted">${t('empty')}</td></tr>`}</tbody></table></div>
    <p><button class="btn secondary small" id="g-csv">⬇ ${t('export_excel')}</button></p>
  </div>`;
};
ROUTES.grades.after = function(){
  $('#g-add').onclick = () => {
    const sub = $('#g-sub'); const grade = +$('#g-grade').value;
    if (!sub.value || grade<2 || grade>5) return toast(t('required'));
    S.grades.push({id:uid(), subject:sub.value, course:+sub.selectedOptions[0].dataset.c, grade, cred:+$('#g-cred').value||null, date:$('#g-date').value||todayISO()});
    save(); toast(t('saved')); go('grades');
  };
  $$('[data-del]').forEach(b=>b.onclick=()=>{ S.grades = S.grades.filter(g=>g.id!==b.dataset.del); save(); go('grades'); });
  $('#g-csv').onclick = ()=>csv('medhub-grades.csv', [[t('subject'),t('course'),t('grade'),t('credits'),t('date')],
    ...S.grades.map(g=>[g.subject,g.course,g.grade,g.cred,g.date])]);
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
      <div class="dnum">${d}</div>${evs.map(e=>`<div class="ev ${e.type}" title="${esc(e.title||t('ev_'+e.type))}">${e.type==='duty'?'🛏':e.type==='exam'?'❗':e.type==='colloq'||e.type==='test'?'❕':'📚'} ${esc(e.title||t('ev_'+e.type))}</div>`).join('')}</div>`;
  }
  const upcoming = S.events.filter(e=>e.date>=todayISO()).sort((a,b)=>a.date<b.date?-1:1).slice(0,8)
    .map(e=>`<div class="entry tight"><div class="meta"><span class="badge ${e.type==='exam'?'bad':e.type==='colloq'||e.type==='test'?'warn':'ok'}">${t('ev_'+e.type)}</span>
      <b>${e.date}</b> ${e.time?esc(e.time):''} · ${daysBetween(todayISO(),e.date)} ${t('days_left')}</div>
      <div><b>${esc(e.title||t('ev_'+e.type))}</b>${e.subject?` · ${esc(e.subject)}`:''}
      <button class="btn small danger" style="float:right" data-evdel="${e.id}">✕</button></div></div>`).join('') ||
    `<div class="empty">${t('ev_none')}</div>`;
  return head(t('nav_calendar'), t('cal_hint')) + `
  <div class="card">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <button class="btn secondary small" id="cal-prev">←</button>
      <b style="flex:1;text-align:center;font-size:1.05rem">${calMonth.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</b>
      <button class="btn secondary small" id="cal-next">→</button>
      <button class="btn small" id="cal-add">＋ ${t('add_event')}</button>
    </div>
    <div class="cal">${cells}</div>
  </div>
  <div class="card"><h3>${t('upcoming')}</h3>${upcoming}</div>`;
};
ROUTES.calendar.after = function(){
  $('#cal-prev').onclick = ()=>{ calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth()-1, 1); go('calendar'); };
  $('#cal-next').onclick = ()=>{ calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth()+1, 1); go('calendar'); };
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
async function fetchFeed(type){
  if (!S.group) return null;
  try { const j = await api(`/groups/${S.group.code}/feed?type=${type}`); return j.entries; }
  catch { return null; }
}
function entryHtml(e, extra=''){
  const mine = S.group && e.authorId === S.group.me.id;
  return `<div class="entry" data-eid="${e.id}">
    <div class="meta">${visIcon(e.visibility)} <b>${esc(e.authorName)}</b> · ${fmtD(e.ts)}</div>
    ${e.title?`<div><b>${esc(e.title)}</b></div>`:''}
    ${e.meta&&e.meta.link?`<div>🔗 <a href="${esc(e.meta.link)}" target="_blank" rel="noopener">${esc(e.meta.link)}</a></div>`:''}
    ${e.body?`<div class="body">${esc(e.body)}</div>`:''}
    ${extra}
    ${(mine||(S.group&&S.group.me.role==='admin'))?`<div class="entry-actions"><button class="btn small danger" data-edel="${e.id}">🗑</button></div>`:''}
  </div>`;
}
function bindFeedActions(container, type, refresh){
  container.querySelectorAll('[data-edel]').forEach(b=>b.onclick=async()=>{
    if (!confirm(t('confirm_delete'))) return;
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
    <p><button class="btn" id="m-post">⬆ ${t('feed_post')}</button></p>
  </div>
  <div id="mat-feed"><div class="empty">${t('loading')}</div></div>`;
};
ROUTES.materials.after = async function(){
  const refresh = async ()=>{
    const box = $('#mat-feed');
    if (!S.group){ box.innerHTML = `<div class="empty">${t('set_group_join')} → ${t('nav_lang')}</div>`; return; }
    const entries = await fetchFeed('material');
    box.innerHTML = (entries&&entries.length) ? entries.map(e=>entryHtml(e)).join('') : `<div class="empty">${t('feed_empty')}</div>`;
    bindFeedActions(box, 'material', refresh);
  };
  $('#m-post').onclick = async ()=>{
    const title=$('#m-title').value.trim(), link=$('#m-link').value.trim(), body=$('#m-body').value.trim();
    if (!title && !link && !body) return toast(t('required'));
    if (!S.group) return toast(t('set_group_join'));
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
    <p><button class="btn" id="e-post">⬆ ${t('feed_post')}</button></p>
  </div>
  <div id="err-feed"><div class="empty">${t('loading')}</div></div>`;
};
ROUTES.errors.after = async function(){
  const refresh = async ()=>{
    const box = $('#err-feed');
    if (!S.group){ box.innerHTML = `<div class="empty">${t('set_group_join')} → ${t('nav_lang')}</div>`; return; }
    const entries = await fetchFeed('error');
    box.innerHTML = (entries&&entries.length) ? entries.map(e=>{
      const html = entryHtml(e, `<div class="comment"><b>❌ ${t('wrong_ans')}:</b> ${esc(e.meta&&e.meta.wrong||'—')}</div>
        <div class="comment"><b>✅ ${t('right_ans')}:</b> ${esc(e.meta&&e.meta.right||'—')}</div>
        ${e.meta&&e.meta.lesson?`<div class="comment">💡 ${esc(e.meta.lesson)}</div>`:''}`);
      return html; }).join('') : `<div class="empty">${t('feed_empty')}</div>`;
    bindFeedActions(box, 'error', refresh);
  };
  $('#e-post').onclick = async ()=>{
    const q=$('#e-q').value.trim(), wrong=$('#e-wrong').value.trim(), right=$('#e-right').value.trim(), lesson=$('#e-lesson').value.trim();
    if (!q || !right) return toast(t('required'));
    if (!S.group) return toast(t('set_group_join'));
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
      <button class="btn" id="s-go">🔍 ${t('search_btn')}</button>
    </div>
    <div class="chiprow" id="s-scope">
      <button class="chip on" data-sc="lib">📚 ${t('search_scope_lib')}</button>
      <button class="chip" data-sc="notes">📝 ${t('search_scope_notes')}</button>
      <button class="chip" data-sc="web">🌍 ${t('search_scope_web')}</button>
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
  <p class="muted" style="font-size:.8rem">⚠ ${t('drug_disclaimer')}</p>`;
};
ROUTES.drugs.after = function(){
  const draw = ()=>{
    const q = ($('#dr-q').value||'').toLowerCase().trim();
    const rows = window.DRUGS.filter(d=>!q || (d.n+' '+d.ind+' '+d.cl+' '+(d.lat||'')).toLowerCase().includes(q));
    $('#dr-list').innerHTML = rows.map(d=>`<div class="entry">
      <div class="meta"><span class="badge">${esc(d.cl)}</span>${S.latin&&d.lat?`<span class="badge">💊 ${esc(d.lat)}</span>`:''}</div>
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
    <p><button class="btn secondary small" id="lab-csv">⬇ ${t('export_excel')}</button></p></div>`;
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
  $('#lab-csv').onclick = ()=>csv('medhub-labs.csv', [[t('lab_analyte'),t('lab_unit'),t('lab_m'),t('lab_f'),t('lab_child'),t('lab_note')],
    ...window.LABS.map(l=>[l.a,l.u,l.m,l.f,l.ch,l.n])]);
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
    <button class="chip ${painMode==='male'?'on':''}" data-m="male">♂ ${t('mode_male')}</button>
    <button class="chip ${painMode==='female'?'on':''}" data-m="female">♀ ${t('mode_female')}</button>
    <button class="chip ${painMode==='child'?'on':''}" data-m="child">🧒 ${t('mode_child')}</button>
  </div>
  <div class="sim-layout">
    <div class="bodymap-wrap" id="pain-svg"></div>
    <div id="pain-info"><div class="empty">${t('pain_hint')}</div></div>
  </div>
  <div class="card"><h3>🫀 3D-анатомия</h3>
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
      ${painMode==='child'&&z.peds?`<p class="muted"><b>🧒 ${t('mode_child')}:</b> ${esc(z.peds)}</p>`:''}
    </div>`;
  });
};

/* ---------- AUSCULTATION ---------- */
let auscCat = 'heart';
ROUTES.auscult = function(){
  return head(t('nav_auscult'), t('ausc_hint')) + `
  <div class="chiprow" id="ausc-tabs">
    <button class="chip ${auscCat==='heart'?'on':''}" data-c="heart">🫀 ${t('heart_points')}</button>
    <button class="chip ${auscCat==='lung'?'on':''}" data-c="lung">🫁 ${t('lung_points')}</button>
    <button class="chip ${auscCat==='abdomen'?'on':''}" data-c="abdomen">🫃 ${t('bowel_points')}</button>
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
        <h3>🎧 ${esc(snd.n)}</h3>
        <p class="muted" style="font-size:.82rem">📍 ${esc(el.dataset.p)}</p>
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
    <button class="chip" id="ecg-quiz-start">🎲 ${t('ecg_quiz')}</button>
  </div>
  <div class="canvas-wrap"><canvas id="ecg-cv"></canvas>
    <div class="ecg-hud" id="ecg-hud"><span class="ecg-heart">❤</span><b>—</b><small>${t('ecg_rate')}</small></div>
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
    $('#ecg-info').innerHTML = `<div class="card"><h3>❓ ${t('ecg_quiz')}</h3>
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
  <p class="muted" style="font-size:.8rem">ℹ ${t('atlas_note')}</p>`;
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
    <button class="btn" id="pt-new" style="font-size:1rem">🎲 ${t('pat_new')}</button>
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
      <div class="meta"><span class="badge">${t('pat_age')}: ${c.age}</span><span class="badge">${c.sex==='М'?'♂':'♀'} ${c.sex}</span></div>
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
          <h3>🫁 ${t('nav_auscult')}</h3>
          <p><button class="btn small" id="pt-sound">🎧 ${t('ecg_play')}</button></p>
          <h3>🗺 ${t('nav_pain')}</h3>
          <div id="pt-map"></div>
        </div>
        <div>
          <h3>📈 ${t('nav_ecg')}</h3>
          <div class="canvas-wrap"><canvas id="pt-ecg"></canvas></div>
        </div>
      </div>
      <h3>${t('pat_labs')}</h3>
      <div class="table-wrap"><table><tbody>${c.labs.map(l=>`<tr class="lab-row"><td>${esc(l[0])}</td><td class="${l[2]?'':'abn'}">${esc(l[1])}</td></tr>`).join('')}</tbody></table></div>
      <h3 style="margin-top:14px">${t('pat_dx')}</h3>
      <select id="pt-dx">${opts.map(o=>`<option>${esc(o)}</option>`).join('')}</select>
      <p style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn" id="pt-check">✅ ${t('pat_submit')}</button>
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
      $('#pt-expl').innerHTML = `<div class="card"><h3>✅ ${t('pat_showcase')}: ${esc(c.dx)}</h3>
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
    <p><button class="btn" id="t-start">▶ ${t('test_start')} (${t('test_mode_topic')})</button>
    <button class="btn secondary" id="t-exam">⏱ ${t('test_mode_exam')}</button></p>
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
        <span style="flex:1"></span>${st.examMode?`<b id="t-timer"></b>`:''}<span>✅ ${st.score}</span></div>
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
      ${st.wrong.length?`<h3>${st.wrong.length} ✗</h3>${st.wrong.map(q=>`<div class="entry tight" style="text-align:left">
        <b>${esc(q.q)}</b><div class="comment">✅ ${t('test_correct_answer')}: ${esc(q.o[q.a])}</div>
        <div class="comment">${esc(q.e)}</div></div>`).join('')}`:''}
      <p><button class="btn" id="t-again">↻ ${t('test_again')}</button></p></div>`;
    $('#t-again').onclick = ()=>go('tests');
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
    <div class="stat"><div class="num">${S.streak||0}</div><div class="lbl">🔥 ${t('cards_streak')}</div></div>
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
    <button class="btn secondary" id="c-import">📥 ${t('cards_deck')}: стартовый набор</button></p>
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
  if (!due.length){ area.innerHTML = `<div class="empty">🎉 ${t('cards_done')}</div>`; return; }
  let shown = null, revealed = false;
  function next(){
    shown = due[0]; revealed = false;
    area.innerHTML = `<div class="flash"><div class="flash-inner" id="fl"><div class="q">${esc(shown.f)}<div class="muted" style="font-size:.75rem;margin-top:10px">${esc(shown.deck)} · 👆 ${t('cards_show')}</div></div></div></div>
      <div class="rate-row hidden" id="rr">
        <button class="btn danger" data-r="0">🙈 ${t('cards_again')}</button>
        <button class="btn secondary" data-r="1">😅 ${t('cards_hard')}</button>
        <button class="btn" data-r="2">🙂 ${t('cards_good')}</button>
        <button class="btn" data-r="3">😎 ${t('cards_easy')}</button>
      </div>
      <p style="text-align:center"><button class="btn small danger" data-skip="1">🗑 ${t('delete')}</button></p>`;
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
      save(); due.shift(); due.length ? next() : (area.innerHTML = `<div class="empty">🎉 ${t('cards_done')}</div>`);
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
    <p><button class="btn" id="cur-save">💾 ${t('save')}</button>
    ${S.group?`<button class="btn secondary" id="cur-share">👥 ${t('vis_group')} → ${t('cases')}</button>`:''}</p>
  </div>
  <div class="card"><h3>${t('nav_curation')} (${S.diary.length})</h3>
    ${S.diary.slice().reverse().map(d=>`<div class="entry">
      <div class="meta">${visIcon(d.visibility||'private')} <b>${d.date}</b> · ${d.sex}, ${d.age} ${t('pat_age').toLowerCase()}</div>
      <div><b>${esc(d.diag||'—')}</b></div>
      <div class="body muted" style="font-size:.86rem">${esc((d.cc||'').slice(0,160))}${(d.cc||'').length>160?'…':''}</div>
      <div class="entry-actions">
        <button class="btn small secondary" data-view="${d.id}">👁</button>
        <button class="btn small danger" data-cdel="${d.id}">🗑</button></div>
    </div>`).join('') || `<div class="empty">${t('empty')}</div>`}
    ${S.diary.length?`<p><button class="btn secondary small" id="cur-print">🖨 ${t('print')} / ${t('export_pdf')}</button>
    <button class="btn secondary small" id="cur-csv">⬇ ${t('export_excel')}</button></p>`:''}
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
  const csvBtn = $('#cur-csv'); if (csvBtn) csvBtn.onclick = ()=>csv('medhub-diary.csv',
    [[t('date'),t('pat_sex'),t('pat_age'),t('cur_cc'),t('cur_anam'),t('cur_status'),t('cur_diag'),t('cur_plan')],
     ...S.diary.map(d=>[d.date,d.sex,d.age,d.cc,d.anam,d.status,d.diag,d.plan])]);
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
    <div class="stat"><div class="num">${S.group?S.group.name:'—'}</div><div class="lbl">${t('skills_progress')}</div>
      ${S.group?`<p><button class="btn small secondary" id="sk-share">⬆ ${t('feed_post')}</button></p>`:`<p class="muted" style="font-size:.8rem">${t('set_group_join')}</p>`}</div>
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
  const sh = $('#sk-share');
  if (sh) sh.onclick = async ()=>{
    const done = Object.entries(S.skills).filter(([,v])=>v===2).map(([k])=>k);
    if (!S.group) return toast(t('set_group_join'));
    try { await api(`/groups/${S.group.code}/entries`,{method:'POST',body:{type:'diary',
      authorId:S.group.me.id, authorName:S.group.me.name,
      title:`✅ ${t('skills_mine')}: ${done.length}/${window.SKILLS.length}`,
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
    <p><button class="btn" id="o-add">＋ ${t('add')}</button></p>
  </div>
  <div class="card">${S.ops.slice().reverse().map(o=>`<div class="entry">
    <div class="meta"><span class="badge ${o.role==='assistant'?'ok':''}">${o.role==='assistant'?t('ops_assistant'):t('ops_observer')}</span> <b>${o.date}</b></div>
    <div><b>${esc(o.op)}</b>${o.notes?` — <span class="muted">${esc(o.notes)}</span>`:''}</div>
    <div class="entry-actions"><button class="btn small danger" data-odel="${o.id}">🗑</button></div></div>`).join('') ||
    `<div class="empty">${t('empty')}</div>`}</div>`;
};
ROUTES.ops.after = function(){
  $('#o-add').onclick = ()=>{
    const op = $('#o-op').value.trim();
    if (!op) return toast(t('required'));
    S.ops.push({id:uid(), date:$('#o-date').value||todayISO(), role:$('#o-role').value, op, notes:$('#o-notes').value.trim()});
    save(); toast(t('added')); go('ops');
  };
  $$('[data-odel]').forEach(b=>b.onclick=()=>{ S.ops = S.ops.filter(o=>o.id!==b.dataset.odel); save(); go('ops'); });
};

/* ---------- GROUP CASES feed ---------- */
ROUTES.cases = function(){
  return head(t('nav_cases'), t('cases_hint')) + `
  <div class="card"><h3>${t('case_new')}</h3>
    <label class="f">${t('title')}</label><input type="text" id="cs-title" placeholder="Кейс: боль в животе у подростка">
    <label class="f">${t('body')}</label><textarea id="cs-body" style="min-height:110px"></textarea>
    <p><button class="btn" id="cs-post">⬆ ${t('feed_post')}</button></p>
  </div>
  <div id="cs-feed"><div class="empty">${t('loading')}</div></div>`;
};
ROUTES.cases.after = async function(){
  const refresh = async ()=>{
    const box = $('#cs-feed');
    if (!S.group){ box.innerHTML = `<div class="empty">${t('set_group_join')} → ${t('nav_lang')}</div>`; return; }
    const entries = await fetchFeed('case');
    box.innerHTML = (entries&&entries.length) ? entries.map(e=>{
      const comments = (e.meta&&e.meta.comments||[]).map(c=>`<div class="comment"><b>${esc(c.authorName)}:</b> ${esc(c.text)}</div>`).join('');
      return entryHtml(e, comments + (S.group?`<div style="display:flex;gap:6px;margin-top:8px">
        <input type="text" placeholder="${t('comment')}…" data-cin="${e.id}">
        <button class="btn small" data-csend="${e.id}">${t('send')}</button></div>`:''));
    }).join('') : `<div class="empty">${t('feed_empty')}</div>`;
    bindFeedActions(box, 'case', refresh);
    box.querySelectorAll('[data-csend]').forEach(b=>b.onclick=async()=>{
      const inp = box.querySelector(`[data-cin="${b.dataset.csend}"]`);
      if (!inp.value.trim()) return;
      try { await api(`/groups/${S.group.code}/entries/${b.dataset.csend}/comments`,{method:'POST',
        body:{authorId:S.group.me.id, authorName:S.group.me.name, text:inp.value.trim()}});
        refresh(); } catch(e){ toast(e.message); }
    });
  };
  $('#cs-post').onclick = async ()=>{
    const title=$('#cs-title').value.trim(), body=$('#cs-body').value.trim();
    if (!body) return toast(t('required'));
    if (!S.group) return toast(t('set_group_join'));
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
    <p><button class="btn" id="r-add">💾 ${t('save')}</button></p>
  </div>
  <div class="card">${S.reflect.slice().reverse().map(r=>`<div class="entry">
    <div class="meta">🔒 <b>${r.date}</b></div>
    <p><b>${t('refl_sit')}:</b> ${esc(r.sit)}</p>
    <p style="color:var(--danger)"><b>${t('refl_err')}:</b> ${esc(r.err)}</p>
    <p><b>${t('refl_lesson')}:</b> ${esc(r.lesson||'—')}</p>
    ${(r.topics||[]).length?`<div class="chiprow">${r.topics.map(tp=>`<span class="chip" style="cursor:default">📌 ${esc(tp)}</span>`).join('')}</div>`:''}
    ${(r.topics||[]).length?`<p><button class="btn small secondary" data-tocard="${r.id}">🃏 ${t('cards_to_deck')}</button></p>`:''}
    <div class="entry-actions"><button class="btn small danger" data-rdel="${r.id}">🗑</button></div>
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
    <p><button class="btn" id="d-add">＋ ${t('add')}</button></p>
  </div>
  <div class="card"><h3>${t('nav_duty')}</h3>
    ${up.map(d=>`<div class="entry"><div class="meta">🛏 <b>${d.date}</b> · ${d.from}–${d.to} · ${esc(d.place||'—')} · ${d.hours} ${t('duty_hours').toLowerCase()}</div>
      <div class="entry-actions">
        ${S.group?`<button class="btn small secondary" data-swap="${d.id}">🔁 ${t('duty_swap')}</button>`:''}
        <button class="btn small danger" data-ddel="${d.id}">🗑</button></div></div>`).join('') ||
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
  $$('[data-ddel]').forEach(b=>b.onclick=()=>{ S.duties = S.duties.filter(d=>d.id!==b.dataset.ddel); save(); go('duty'); });
  $$('[data-swap]').forEach(b=>b.onclick=async()=>{
    const d = S.duties.find(x=>x.id===b.dataset.swap);
    if (!S.group) return toast(t('set_group_join'));
    try { await api(`/groups/${S.group.code}/entries`,{method:'POST',body:{type:'duty-swap',
      authorId:S.group.me.id, authorName:S.group.me.name,
      title:`🔁 ${t('duty_swap')}: ${d.date} ${d.from}–${d.to}`, body:d.place||'', meta:{date:d.date},
      visibility:'group'}});
      toast(t('posted')); loadSwaps(); } catch(e){ toast(e.message); }
  });
  async function loadSwaps(){
    const box = $('#swap-feed'); if (!S.group || !box) return;
    const entries = await fetchFeed('duty-swap');
    box.innerHTML = `<h3 style="margin:14px 0 8px">🔁 ${t('duty_swap')}</h3>` + ((entries&&entries.length) ?
      entries.map(e=>entryHtml(e, `<button class="btn small" data-take="${e.id}">🙋 ${t('duty_taken')}</button>`)).join('')
      : `<div class="empty">${t('feed_empty')}</div>`);
    box.querySelectorAll('[data-take]').forEach(btn=>btn.onclick=async()=>{
      try { await api(`/groups/${S.group.code}/entries/${btn.dataset.take}/comments`,{method:'POST',
        body:{authorId:S.group.me.id, authorName:S.group.me.name, text:'🙋‍♀️ ' + t('duty_taken')}});
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
  <div class="card"><h3>🌐 ${t('set_lang')}</h3>
    <div class="chiprow">
      <button class="chip ${S.lang==='ru'?'on':''}" data-l="ru">🇷🇺 Русский</button>
      <button class="chip ${S.lang==='uz'?'on':''}" data-l="uz">🇺🇿 Oʻzbekcha</button>
      <button class="chip ${S.lang==='en'?'on':''}" data-l="en">🇬🇧 English</button>
    </div>
    <p class="muted" style="font-size:.8rem">${t('disclaimer')}</p>
  </div>
  <div class="card"><h3>👥 ${t('set_group')}</h3>
    ${g?`<div class="entry">
      <div class="meta"><span class="badge ok">${g.code}</span> <b>${esc(g.name)}</b></div>
      <p>${t('role')}: <b>${g.me.role==='admin'?t('role_admin'):t('role_student')}</b> · ${esc(g.me.name)}</p>
      ${g.adminKey?`<p class="muted" style="font-size:.8rem">${t('admin_key_note')} <code>${g.adminKey}</code></p>`:''}
      <p><button class="btn danger small" id="grp-leave">${t('leave_group')}</button></p>
    </div>`:`
    <div class="formrow g2">
      <div><h3 style="font-size:.95rem">${t('set_group_create')}</h3>
        <label class="f">${t('group_name')}</label><input type="text" id="grp-name" placeholder="Терапия 4 курс, группа 12">
        <label class="f">${t('your_name')}</label><input type="text" id="grp-me">
        <p><button class="btn" id="grp-create">${t('set_group_create')}</button></p>
      </div>
      <div><h3 style="font-size:.95rem">${t('set_group_join')}</h3>
        <label class="f">${t('group_code')}</label><input type="text" id="grp-code" placeholder="A1B2C3" style="text-transform:uppercase">
        <label class="f">${t('your_name')}</label><input type="text" id="grp-joinme">
        <p><button class="btn secondary" id="grp-join">${t('set_group_join')}</button></p>
      </div>
    </div>`}
    <div id="grp-members"></div>
  </div>`;
};
ROUTES.setgroup.after = function(){
  $$('[data-l]').forEach(b=>b.onclick=()=>{ S.lang=b.dataset.l; save(); applyChrome(); go('setgroup'); toast(t('saved')); });
  const cr = $('#grp-create');
  if (cr) cr.onclick = async ()=>{
    const name=$('#grp-name').value.trim(), me=$('#grp-me').value.trim();
    if (!name||!me) return toast(t('required'));
    try { const j = await api('/groups',{method:'POST',body:{name, adminName:me}});
      S.group = {code:j.group.code, name:j.group.name, me:j.me, adminKey:j.adminKey}; save();
      applyChrome(); toast(t('group_saved')); go('setgroup'); }
    catch(e){ toast(e.message); }
  };
  const jn = $('#grp-join');
  if (jn) jn.onclick = async ()=>{
    const code=$('#grp-code').value.trim().toUpperCase(), me=$('#grp-joinme').value.trim();
    if (!code||!me) return toast(t('required'));
    try { const j = await api(`/groups/${code}/join`,{method:'POST',body:{name:me}});
      S.group = {code:j.group.code, name:j.group.name, me:j.me}; save();
      applyChrome(); toast(t('group_saved')); go('setgroup'); }
    catch(e){ toast(e.message); }
  };
  const lv = $('#grp-leave');
  if (lv) lv.onclick = ()=>{ S.group=null; save(); applyChrome(); go('setgroup'); };
  const mem = $('#grp-members');
  if (mem && S.group) api(`/groups/${S.group.code}`).then(j=>{
    mem.innerHTML = `<h3 style="font-size:.95rem">${t('group_members')} (${j.group.members.length})</h3>
      <div class="chiprow">${j.group.members.map(m=>`<span class="badge">${m.role==='admin'?'👑':'🎓'} ${esc(m.name)}</span>`).join('')}</div>`;
  }).catch(()=>{});
};

/* ---------- SETTINGS: look ---------- */
ROUTES.setlook = function(){
  return head(t('nav_look')) + `
  <div class="card"><h3>🎨 ${t('set_theme')}</h3>
    <div class="chiprow">
      <button class="chip ${S.theme==='light'?'on':''}" data-th="light">☀️ ${t('theme_light')}</button>
      <button class="chip ${S.theme==='dark'?'on':''}" data-th="dark">🌙 ${t('theme_dark')}</button>
      <button class="chip ${S.theme==='night'?'on':''}" data-th="night">🔴 ${t('theme_night')}</button>
    </div>
  </div>
  <div class="card"><h3>🖥 ${t('set_quality')}</h3>
    <div class="chiprow">
      <button class="chip ${S.quality==='low'?'on':''}" data-q="low">${t('quality_low')}</button>
      <button class="chip ${S.quality==='high'?'on':''}" data-q="high">${t('quality_high')}</button>
    </div>
  </div>
  <div class="card"><h3>🏛 ${t('set_latin')}</h3>
    <p><button class="chip ${S.latin?'on':''}" id="latin-toggle">${S.latin?'✓ ':''}${t('latin_on')}</button></p>
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
  <div class="card"><h3>📥 ${t('set_offline')}</h3>
    <p class="muted" style="font-size:.85rem">МКБ, препараты, нормы, протоколы, калькуляторы, тесты и кейсы уже встроены в приложение и работают без интернета. Нажмите, чтобы закрепить кэш.</p>
    <p><button class="btn" id="off-dl">${S.basesOffline?'✓ ':'⬇ '}${t('offline_dl')}</button></p>
  </div>
  <div class="card"><h3>💾 ${t('backup')}</h3>
    <p><button class="btn secondary" id="bk-export">⬇ ${t('backup_export')}</button>
    <label class="btn secondary" style="cursor:pointer">⬆ ${t('backup_import')}<input type="file" id="bk-import" accept=".json" hidden></label></p>
    <label class="f">${t('sync_key')}</label>
    <div style="display:flex;gap:8px"><input type="text" id="bk-key" value="${esc(S.syncKey)}" placeholder="мой-ключ-2026">
    <button class="btn small" id="bk-up">☁ ↑</button><button class="btn small secondary" id="bk-down">☁ ↓</button></div>
    <p class="muted" style="font-size:.8rem">Синхронизация по ключу: тот же ключ на другом устройстве подтянет данные.</p>
  </div>
  <div class="card"><h3>📄 ${t('export_pdf')} / ${t('export_excel')}</h3>
    <p><button class="btn secondary" id="ex-diary-print">🖨 ${t('nav_diary')} → ${t('export_pdf')}</button>
    <button class="btn secondary" id="ex-diary-csv">⬇ ${t('nav_diary')} → ${t('export_excel')}</button>
    <button class="btn secondary" id="ex-all-csv">⬇ ${t('nav_grades')} → ${t('export_excel')}</button></p>
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
  $('#ex-diary-csv').onclick = ()=>csv('medhub-diary.csv',
    [[t('date'),t('pat_sex'),t('pat_age'),t('cur_cc'),t('cur_diag'),t('cur_plan')],
     ...S.diary.map(d=>[d.date,d.sex,d.age,d.cc,d.diag,d.plan])]);
  $('#ex-all-csv').onclick = ()=>csv('medhub-grades.csv',
    [[t('subject'),t('course'),t('grade'),t('credits'),t('date')],
     ...S.grades.map(g=>[g.subject,g.course,g.grade,g.cred,g.date])]);
};

/* ---------- SETTINGS: notifications ---------- */
ROUTES.setnotif = function(){
  return head(t('set_notif')) + `
  <div class="card">
    <p><button class="chip ${S.notif.duty?'on':''}" id="n-duty">🛏 ${t('notif_duty')}</button></p>
    <p><button class="chip ${S.notif.colloq?'on':''}" id="n-colloq">❗ ${t('notif_colloq')}</button></p>
    <p><button class="chip ${S.notif.cards?'on':''}" id="n-cards">🃏 ${t('notif_cards')}</button></p>
    <hr style="border:0;border-top:1px solid var(--line);margin:14px 0">
    <p><button class="btn" id="n-ask">🔔 ${t('notif_ask')}</button>
    <button class="btn secondary" id="n-test">${t('notif_test')}</button></p>
    <p class="muted" id="n-status" style="font-size:.82rem"></p>
  </div>`;
};
ROUTES.setnotif.after = function(){
  const tog = (id, key)=>{ $(id).onclick = ()=>{ S.notif[key]=!S.notif[key]; save(); go('setnotif'); }; };
  tog('#n-duty','duty'); tog('#n-colloq','colloq'); tog('#n-cards','cards');
  const status = $('#n-status');
  const upd = ()=>{ status.textContent = Notification.permission==='granted'?'✅ '+t('notif_ask'):
    Notification.permission==='denied'?'⛔ '+t('notif_denied'):''; };
  $('#n-ask').onclick = ()=>Notification.requestPermission().then(upd);
  $('#n-test').onclick = ()=>notify('MedHub', t('notif_test'));
  if ('Notification' in window) upd();
};
function notify(title, body){
  if (!('Notification' in window)) return toast(body);
  if (Notification.permission==='granted') new Notification(title, {body});
  else toast('🔔 ' + body);
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
    if (d && !notify._dutyDone){ notify._dutyDone = t0; notify('MedHub', `🛏 ${t('notif_duty')}: ${d.date} ${d.from}–${d.to}`); }
  }
  if (S.notif.cards && dueCards().length>5 && new Date().getHours()===19 && !notify._cardsDone){
    notify._cardsDone = t0; notify('MedHub', `🃏 ${t('cards_due')}: ${dueCards().length}`);
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
applyChrome();
go('grades');
})();
