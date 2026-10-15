/* =====================================================================
   My Day Planner – Visual Schedule & Task Management (front-end prototype)
   Mock login only (NOT secure). All data lives in this browser's localStorage.
   ===================================================================== */
'use strict';

/* ---------- Constants ---------- */
const KEY = 'mdp_data_v1', SKEY = 'mdp_session_v1';
const DAYS = [['Mon','Monday','#ffc2d1'],['Tue','Tuesday','#ffd8a8'],['Wed','Wednesday','#fff0a0'],
  ['Thu','Thursday','#d3f0a8'],['Fri','Friday','#b4e6f7'],['Sat','Saturday','#cdc6f5'],['Sun','Sunday','#b9ecdd']]
  .map(([k,n,c]) => ({k,n,c}));
const WD = ['Mon','Tue','Wed','Thu','Fri'], WE = ['Sat','Sun'];
const CATS = ['Personal hygiene','Dressing','Eating and drinking','Toileting','Household chores','Communication',
  'School activities','Social interaction','Physical activities','Bedtime routines','Other custom activities'];
const EMOJI = ['🪥','🛁','👕','🍽️','🧼','🎒','🧸','📚','🌙','🚽','👟','🥄','📦','🧺','🛏️','🏃','👋','🎨','🧩','🍎','🥛','🚿','🧦','✏️','🗣️','🤝','🧹','🐶'];
const AVATARS = ['🦊','🐻','🐰','🐼','🦁','🐸','🐙','🦄'];
const AV_COLORS = ['#ffc2d1','#b4e6f7','#d3f0a8'];
const USERS = { parent:'Parent / guardian', caregiver:'Caregiver', ot:'Occupational therapist', teacher:'SPED teacher' };
const DEMO_PW = 'demo123';
const TR = {
  en:{dashboard:'Home',schedule:'Schedule',kid:'Child view',rewards:'Rewards',progress:'Progress',settings:'Settings',
    logout:'Log out',today:"Today's Activities",done:'Done!',next:'Up next',great:'Great job!',nothing:'Nothing planned today',
    allDone:'You finished everything!'},
  fil:{dashboard:'Home',schedule:'Iskedyul',kid:'Para sa bata',rewards:'Gantimpala',progress:'Progreso',settings:'Settings',
    logout:'Mag-logout',today:'Mga Gawain Ngayon',done:'Tapos na!',next:'Susunod',great:'Magaling!',nothing:'Walang gawain ngayon',
    allDone:'Natapos mo lahat!'}
};

/* Built-in activities: [id, icon, name, category, instructions, minutes, time] */
const BUILTIN = [
 ['brush','🪥','Brush my teeth','Personal hygiene','Put toothpaste on the brush. Brush up and down. Rinse.',3,'07:30'],
 ['bath','🛁','Take a bath','Personal hygiene','Wash with soap. Rinse. Dry with a towel.',15,'18:30'],
 ['dress','👕','Get dressed','Dressing','Put on your shirt, pants and socks.',10,'07:45'],
 ['breakfast','🍽️','Eat breakfast','Eating and drinking','Sit at the table. Eat slowly. Drink your milk.',20,'08:00'],
 ['wash','🧼','Wash my hands','Personal hygiene','Wet hands. Soap. Rub. Rinse. Dry.',2,''],
 ['bag','🎒','Pack my school bag','School activities','Put your books and lunch box in the bag.',5,'08:20'],
 ['toys','🧸','Put my toys away','Household chores','Put all the toys back where they live.',10,'17:30'],
 ['learn','📚','Do a learning activity','School activities','Sit down. Do your learning activity.',20,'16:00'],
 ['bedtime','🌙','Get ready for bed','Bedtime routines','Put on pajamas. Brush teeth. Go to bed.',15,'20:00'],
 ['lunch','🥪','Eat lunch','Eating and drinking','Sit and eat your lunch.',20,'12:00'],
 ['dinner','🍲','Eat dinner','Eating and drinking','Sit with your family and eat dinner.',25,'18:00'],
 ['toilet','🚽','Use the toilet','Toileting','Go to the toilet. Flush. Wash your hands.',5,''],
 ['play','🏃','Play outside','Physical activities','Go outside and move your body!',30,'15:30'],
 ['hello','👋','Say hello to someone','Communication','Look at them and say "Hello!"',2,''],
 ['makebed','🛏️','Make my bed','Household chores','Pull up the blanket. Fix the pillow.',5,'07:55'],
 ['read','📖','Read a book','School activities','Pick a book. Look at the pictures and read.',15,'19:30']
].map(([id,icon,name,cat,instr,dur,time]) => ({id:'b_'+id,icon,name,cat,instr,dur,time,reward:true,builtin:true,img:''}));
/* Custom examples (not built-in, so they can be edited/deleted freely) */
const CUSTOM = [
 ['shoes','👟','Practice putting on shoes','Dressing','Sit down. Put one foot in. Pull. Fasten.',10,'07:50'],
 ['fold','🧺','Fold my clothes','Household chores','Lay the shirt flat. Fold the sides. Fold in half.',10,''],
 ['box','📦','Put my toys inside the box','Household chores','Pick up a toy. Put it in the box.',8,'17:45'],
 ['spoon','🥄','Practice using a spoon','Eating and drinking','Hold the spoon. Scoop. Bring it to your mouth.',10,'12:15']
].map(([id,icon,name,cat,instr,dur,time]) => ({id:'c_'+id,icon,name,cat,instr,dur,time,reward:true,builtin:false,img:''}));

/* ---------- Tiny helpers ---------- */
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const todayKey = () => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()];
const dayName = k => DAYS.find(d => d.k === k).n;
const fmtDate = ts => new Date(ts).toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'});
const emptySched = () => Object.fromEntries(DAYS.map(d => [d.k, []]));

/* ---------- Sample data ---------- */
function sample(){
  const acts = [...BUILTIN, ...CUSTOM].map(a => ({...a}));
  const mk = ids => ids.map(a => ({u: uid(), a}));
  const build = (name, age, av, ci, wd, we, doneN, rules, earnedDays, hist) => {
    const schedule = emptySched();
    WD.forEach(d => schedule[d] = mk(wd)); WE.forEach(d => schedule[d] = mk(we));
    const done = {};
    DAYS.forEach(d => { done[d.k] = schedule[d.k].slice(0, doneN[d.k]).map(i => i.u); });
    const earned = earnedDays.map(([d, given], i) => ({
      id: uid(), key: [rules[0].id, d, 0, 'd'].join('|'), rid: rules[0].id, name: rules[0].name, icon: rules[0].icon,
      qty: rules[0].qty, day: d, ts: Date.now() - (i + 1) * 864e5, given, givenTs: given ? Date.now() - (i + 1) * 864e5 + 36e5 : null, food: rules[0].food }));
    const history = hist.map((t, i) => ({ts: Date.now() - (i + 1) * 5400e3, text: t}));
    return {id: uid(), name, age, avatar: av, color: AV_COLORS[ci], schedule, done, resets: {}, rules, earned, history};
  };
  const children = [
    build('Mia', 6, '🦊', 0, ['b_brush','b_dress','b_breakfast','b_bag','b_learn'], ['b_brush','b_dress','b_toys','b_play'],
      {Mon:9,Tue:3,Wed:4,Thu:2,Fri:9,Sat:3,Sun:9},
      [{id:'r1',name:'Free Candy',icon:'🍬',type:'day',count:5,qty:1,food:true},{id:'r2',name:'Extra playtime',icon:'🧸',type:'group',count:3,qty:1,food:false}],
      [['Mon',true],['Fri',false]], ['Completed “Do a learning activity” (Sunday)','Completed “Get dressed” (Saturday)','Completed “Brush my teeth” (Saturday)']),
    build('Leo', 8, '🐻', 1, ['b_wash','b_breakfast','c_shoes','b_bag','b_learn','b_bedtime'], ['b_wash','c_fold','c_box','b_play','b_read'],
      {Mon:9,Tue:4,Wed:9,Thu:1,Fri:3,Sat:2,Sun:0},
      [{id:'r1',name:'Extra screen time',icon:'📺',type:'day',count:6,qty:1,food:false},{id:'r2',name:'Gold star',icon:'⭐',type:'group',count:3,qty:1,food:false}],
      [['Mon',true],['Wed',false]], ['Completed “Wash my hands” (Saturday)','Completed “Practice putting on shoes” (Friday)']),
    build('Ava', 5, '🐼', 2, ['b_toilet','b_brush','b_dress','c_spoon','b_lunch','b_bedtime'], ['b_toilet','b_brush','c_spoon','b_toys','b_play','b_bath'],
      {Mon:2,Tue:9,Wed:3,Thu:9,Fri:0,Sat:4,Sun:9},
      [{id:'r1',name:'Coloring time',icon:'🎨',type:'day',count:6,qty:1,food:false},{id:'r2',name:'Sticker',icon:'⭐',type:'each',count:1,qty:1,food:false}],
      [['Tue',true],['Thu',false]], ['Completed “Practice using a spoon” (Sunday)','Completed “Use the toilet” (Sunday)'])
  ];
  return {activities: acts, children, settings: {lang:'en', text:2, sound:true, anim:true, noFood:false, hc:false, autoToday:true, times:true}};
}

/* ---------- State & persistence ---------- */
function load(){
  try { const r = JSON.parse(localStorage.getItem(KEY)); if (r && r.children && r.activities) return r; } catch(e){}
  const s = sample(); try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){}
  return s;
}
function save(){
  try { localStorage.setItem(KEY, JSON.stringify(S)); return true; }
  catch(e){ toast('Could not save – browser storage is full. Try a smaller picture.', 'danger'); return false; }
}
let S = load();
let U = null; try { U = JSON.parse(localStorage.getItem(SKEY)); } catch(e){}
let ui = {view:'dashboard', child:S.children[0].id, day: S.settings.autoToday ? todayKey() : 'Mon', q:'', cat:'', msg:'', celebrate:null, focus:null};

/* ---------- Selectors / calculations ---------- */
const t = k => (TR[S.settings.lang] || TR.en)[k] ?? TR.en[k] ?? k;
const cur = () => S.children.find(c => c.id === ui.child) || S.children[0];
const act = id => S.activities.find(a => a.id === id);
const items = (c, d) => c.schedule[d].filter(i => act(i.a));
const isDone = (c, d, u) => (c.done[d] || []).includes(u);
function stat(c, d){
  const l = items(c, d), n = l.filter(i => isDone(c, d, i.u)).length;
  return {total: l.length, done: n, left: l.length - n, pct: l.length ? Math.round(n / l.length * 100) : 0};
}
const weekTotals = c => DAYS.reduce((a, d) => { const s = stat(c, d.k); a.done += s.done; a.total += s.total; return a; }, {done:0, total:0});
const log = (c, text) => { c.history.unshift({ts: Date.now(), text}); c.history = c.history.slice(0, 60); };
const rewardLabel = (n, q) => `${q > 1 ? q : 'one'} ${n}`.toLowerCase();

/* ---------- UI utilities ---------- */
function toast(msg, type='ok'){
  const d = document.createElement('div'); d.className = 'toast-i ' + (type === 'danger' ? 'danger' : '');
  d.textContent = (type === 'danger' ? '⚠️ ' : '✅ ') + msg; $('#toasts').appendChild(d);
  $('#live').textContent = msg; setTimeout(() => d.remove(), 4000);
}
const announce = m => { $('#live').textContent = ''; setTimeout(() => $('#live').textContent = m, 30); };
const bar = (p, label) => `<div class="pbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}" aria-label="${esc(label)}"><i style="width:${p}%"></i></div>`;
const ico = a => a.img ? `<img src="${a.img}" alt="">` : `<span aria-hidden="true">${esc(a.icon)}</span>`;
function chip(state){ return state === 'done' ? '<span class="chip done">✅ Done</span>' : state === 'next' ? '<span class="chip next">⏳ Up next</span>' : '<span class="chip later">⚪ Not started yet</span>'; }
const stateOf = (c, d, i) => isDone(c, d, i.u) ? 'done' : (items(c, d).find(x => !isDone(c, d, x.u)) === i ? 'next' : 'later');
function applyPrefs(){
  document.documentElement.style.fontSize = [16,18,20,22][S.settings.text - 1] + 'px' || '18px';
  document.body.classList.toggle('hc', !!S.settings.hc);
  document.body.classList.toggle('no-anim', !S.settings.anim);
  document.documentElement.lang = S.settings.lang === 'fil' ? 'fil' : 'en';
}
function chime(){
  if (!S.settings.sound) return;
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)(), o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(660, ac.currentTime); o.frequency.setValueAtTime(880, ac.currentTime + .15);
    g.gain.setValueAtTime(.12, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + .45);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + .5);
  } catch(e){}
}

/* ---------- Modals ---------- */
const fm = new bootstrap.Modal('#formModal'), cm = new bootstrap.Modal('#confirmModal');
let formCb = null;
function openForm(title, html, cb, ok='Save'){
  $('#formTitle').textContent = title; $('#formBody').innerHTML = html; $('#formOk').textContent = ok; formCb = cb; fm.show();
}
$('#formEl').addEventListener('submit', e => { e.preventDefault(); if (formCb && formCb(new FormData(e.target)) !== false) fm.hide(); });
function confirmBox(msg, ok='Yes, continue'){
  return new Promise(res => {
    $('#confirmMsg').textContent = msg; $('#confirmOk').textContent = ok; let yes = false;
    const el = $('#confirmModal'), h = () => { el.removeEventListener('hidden.bs.modal', h); res(yes); };
    el.addEventListener('hidden.bs.modal', h); $('#confirmOk').onclick = () => { yes = true; cm.hide(); }; cm.show();
  });
}

/* ---------- Components ---------- */
function dayBar(c, big){
  return `<div class="daybar ${big ? 'big' : ''}" role="group" aria-label="Choose a day of the week">` + DAYS.map(d => {
    const s = stat(c, d.k);
    const ic = s.total === 0 ? '➖' : s.done === s.total ? '✅' : s.done > 0 ? '⭐' : '🔵';
    const tx = s.total === 0 ? 'No activities' : s.done === s.total ? 'All done' : s.done > 0 ? `${s.done}/${s.total} done` : `${s.total} to do`;
    const icons = items(c, d.k).slice(0, 6).map(i => act(i.a).img ? '🖼️' : act(i.a).icon).join('');
    return `<button class="daybtn${ui.day === d.k ? ' sel' : ''}" style="--dc:${d.c}" data-act="day" data-d="${d.k}" aria-pressed="${ui.day === d.k}">
      <b>${d.n}</b><span class="ds"><span aria-hidden="true">${ic}</span> ${tx}${d.k === todayKey() ? ' · Today' : ''}</span>
      ${big ? '' : `<span class="ic" aria-hidden="true">${icons}</span>`}</button>`;
  }).join('') + '</div>';
}

/* ---------- Views ---------- */
function loginView(){
  return `<div class="login panel"><h1>🌈 My Day Planner</h1>
  <p class="lead">Visual schedules and rewards for children with developmental delays.</p>
  <p class="proto" role="note">Prototype only. This mock login is NOT secure and stores nothing on a server.</p>
  <form id="loginForm" class="mt-3" novalidate>
    <label class="form-label fw-bold" for="role">I am a…</label>
    <select id="role" class="form-select mb-3">${Object.entries(USERS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
    <label class="form-label fw-bold" for="uname">Username</label>
    <input id="uname" class="form-control mb-3" value="parent" autocomplete="username">
    <label class="form-label fw-bold" for="pw">Password</label>
    <input id="pw" type="password" class="form-control mb-2" autocomplete="current-password">
    <p id="loginErr" class="text-danger fw-bold" role="alert"></p>
    <button class="btn btn-main w-100" type="submit">Log in</button>
  </form>
  <p class="mt-3 mb-0 small lead">Demo: usernames <b>parent</b>, <b>caregiver</b>, <b>ot</b>, <b>teacher</b> · password <b>${DEMO_PW}</b></p></div>`;
}
function header(){
  const tabs = [['dashboard','🏠'],['schedule','📅'],['kid','🧒'],['rewards','🏆'],['progress','📊'],['settings','⚙️']];
  return `<div class="topbar"><div class="brand"><span aria-hidden="true">🌈</span> My Day Planner</div>
  <div><label class="visually-hidden" for="childSel">Selected child</label>
  <select id="childSel" class="form-select kid-sel" data-change="child">${S.children.map(c => `<option value="${c.id}" ${c.id === ui.child ? 'selected' : ''}>${c.avatar} ${esc(c.name)}</option>`).join('')}</select></div>
  <div class="who"><span class="badge-role">${USERS[U.role]}</span><button class="btn btn-soft btn-sm" data-act="logout">${t('logout')}</button></div></div>
  <nav class="tabs" aria-label="Main">${tabs.map(([v, i]) => `<button class="tab ${ui.view === v ? 'on' : ''}" data-act="nav" data-v="${v}" ${ui.view === v ? 'aria-current="page"' : ''}><span aria-hidden="true">${i}</span><span>${t(v)}</span></button>`).join('')}</nav>`;
}

function dashboardView(){
  const c = cur(), s = stat(c, ui.day), l = items(c, ui.day);
  const cards = S.children.map(k => {
    const st = stat(k, todayKey());
    return `<div class="col-md-4"><div class="childcard ${k.id === c.id ? 'sel' : ''}">
      <div class="d-flex gap-3 align-items-center"><div class="avatar" style="--ac:${k.color}" aria-hidden="true">${k.avatar}</div>
      <div><h2 class="h4 mb-0">${esc(k.name)}</h2><span class="lead">Age ${esc(k.age)} · Weekly visual schedule</span></div></div>
      <p class="mt-3 mb-1 fw-bold">Today (${dayName(todayKey())}): ${st.done}/${st.total} done · ${st.pct}%</p>${bar(st.pct, k.name + ' today')}
      <p class="mb-2">🏆 ${k.earned.length} earned · ${k.earned.filter(e => e.given).length} given</p>
      <div class="d-flex gap-2 flex-wrap"><button class="btn btn-main btn-sm" data-act="selChild" data-id="${k.id}" ${k.id === c.id ? 'aria-pressed="true"' : ''}>${k.id === c.id ? '✔ Selected' : 'Select ' + esc(k.name)}</button>
      <button class="btn btn-soft btn-sm" data-act="editChild" data-id="${k.id}">✏️ Edit</button></div></div></div>`;
  }).join('');
  const add = S.children.length < 3 ? `<div class="col-md-4"><button class="childcard w-100 h-100 text-center fw-bold" data-act="newChild" style="border-style:dashed">➕<br>Add a child profile</button></div>` : '';
  return `<h1>Hello, ${esc(USERS[U.role])}!</h1><p class="lead">Choose a child to see the schedule, progress and rewards. (Up to 3 profiles.)</p>
  <div class="row g-3">${cards}${add}</div>
  <div class="row g-4 mt-1"><section class="col-lg-7" aria-labelledby="dtl"><div class="panel">
    <h2 id="dtl">${esc(c.name)} – ${dayName(ui.day)}</h2>
    <p class="mb-1 fw-bold">${s.done} done · ${s.left} pending · ${s.pct}%</p>${bar(s.pct, 'Progress for ' + dayName(ui.day))}
    ${l.length ? l.map(i => `<div class="mini"><span class="si-ico" style="width:42px;height:42px;font-size:1.5rem">${ico(act(i.a))}</span><b>${esc(act(i.a).name)}</b><span class="ms-auto">${chip(stateOf(c, ui.day, i))}</span></div>`).join('') : '<p>No activities planned. Open the Schedule to add some.</p>'}
    <div class="d-flex flex-wrap gap-2 mt-3"><button class="btn btn-main" data-act="nav" data-v="schedule">📅 Edit schedule</button><button class="btn btn-ok" data-act="nav" data-v="kid">🧒 Open child view</button></div></div></section>
  <aside class="col-lg-5"><div class="panel"><h2>Recent activity</h2>
    ${c.history.slice(0, 6).map(h => `<div class="mini"><span>🕒</span><span>${esc(h.text)}<br><small class="lead">${fmtDate(h.ts)}</small></span></div>`).join('') || '<p>No activity yet.</p>'}
    <h2 class="mt-3">Rewards</h2>${c.earned.slice(-3).reverse().map(e => `<div class="mini"><span aria-hidden="true">${esc(e.icon)}</span><b>${esc(e.name)}</b><span class="ms-auto">${e.given ? '<span class="chip given">✅ Given</span>' : '<span class="chip waiting">⏳ To give</span>'}</span></div>`).join('') || '<p>No rewards earned yet.</p>'}
  </div></aside></div>`;
}

function scheduleView(){
  const c = cur(), d = DAYS.find(x => x.k === ui.day), l = items(c, d.k), s = stat(c, d.k);
  return `<h1>${esc(c.name)}'s weekly schedule</h1>
  <p class="lead">Pick a day, then add activities by dragging them in or with the Add buttons. Changes save automatically.</p>${dayBar(c)}
  <div class="row g-4"><section class="col-lg-7" aria-labelledby="dayH"><div class="panel" style="border-color:${d.c}">
    <div class="d-flex flex-wrap justify-content-between align-items-center"><h2 id="dayH" class="mb-0">${d.n}</h2><b>${s.done}/${s.total} done</b></div>${bar(s.pct, d.n + ' progress')}
    <ol id="sched" class="sched" aria-label="${d.n} activities">${l.map((i, n) => {
      const a = act(i.a), st = stateOf(c, d.k, i);
      return `<li class="sitem ${st === 'done' ? 'isdone' : ''}" draggable="true" data-u="${i.u}"><span class="grip" aria-hidden="true">⠿</span>
        <span class="si-ico">${ico(a)}</span><div class="si-txt"><b>${esc(a.name)}</b><small>${S.settings.times && a.time ? '🕒 ' + a.time + ' · ' : ''}${a.dur} min</small><span>${chip(st)}</span></div>
        <div class="si-btn"><button class="btn btn-soft btn-sm" data-act="up" data-u="${i.u}" aria-label="Move ${esc(a.name)} up" ${n === 0 ? 'disabled' : ''}>⬆️</button>
        <button class="btn btn-soft btn-sm" data-act="down" data-u="${i.u}" aria-label="Move ${esc(a.name)} down" ${n === l.length - 1 ? 'disabled' : ''}>⬇️</button>
        <button class="btn btn-soft btn-sm" data-act="editAct" data-id="${a.id}" aria-label="Edit ${esc(a.name)}">✏️</button>
        <button class="btn btn-soft btn-sm" data-act="rm" data-u="${i.u}" aria-label="Remove ${esc(a.name)} from ${d.n}">🗑️</button></div></li>`;
    }).join('') || '<li class="lead p-3">Nothing here yet. Drag an activity here or press Add.</li>'}</ol>
    <div class="d-flex flex-wrap gap-2 align-items-center">
      <button class="btn btn-soft" data-act="resetDay">↺ Reset ${d.n} progress</button>
      <label class="visually-hidden" for="copySel">Copy this day to</label>
      <select id="copySel" class="form-select w-auto"><option value="wd">Copy to all weekdays</option><option value="we">Copy to weekend</option><option value="all">Copy to all other days</option></select>
      <button class="btn btn-soft" data-act="copy">Copy</button></div></div></section>
  <aside class="col-lg-5"><div class="panel"><h2>Activity library</h2>
    <label class="visually-hidden" for="q">Search activities</label><input id="q" class="form-control mb-2" placeholder="Search activities…" value="${esc(ui.q)}" data-input="q">
    <label class="visually-hidden" for="catf">Filter by category</label><select id="catf" class="form-select mb-2" data-change="cat"><option value="">All categories</option>${CATS.map(x => `<option ${ui.cat === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
    <button class="btn btn-main mb-3 w-100" data-act="newAct">➕ Create my own activity</button><div id="lib"></div></div></aside></div>`;
}
function renderLib(){
  const el = $('#lib'); if (!el) return;
  const q = ui.q.toLowerCase();
  const list = S.activities.filter(a => (!ui.cat || a.cat === ui.cat) && (!q || (a.name + a.cat).toLowerCase().includes(q)));
  el.innerHTML = list.map(a => `<div class="libitem" draggable="true" data-lib="${a.id}"><span class="si-ico">${ico(a)}</span>
    <div class="si-txt"><b>${esc(a.name)}</b><small>${esc(a.cat)}${a.builtin ? '' : ' · custom'}</small></div>
    <button class="btn btn-main btn-sm" data-act="addItem" data-id="${a.id}" aria-label="Add ${esc(a.name)} to ${dayName(ui.day)}">Add</button>
    <button class="btn btn-soft btn-sm" data-act="editAct" data-id="${a.id}" aria-label="Edit ${esc(a.name)}">✏️</button></div>`).join('') || '<p>No activities match.</p>';
}

function kidView(){
  const c = cur(), d = ui.day, l = items(c, d), s = stat(c, d), nx = l.find(i => !isDone(c, d, i.u));
  let main;
  if (!l.length) main = `<div class="kid-card empty"><div class="big-ico" aria-hidden="true">🌙</div><h2>${t('nothing')}</h2><p>Enjoy your free time!</p></div>`;
  else if (!nx) main = `<div class="kid-card"><div class="big-ico" aria-hidden="true">🏆</div><h2>${t('allDone')}</h2><p>Amazing work, ${esc(c.name)}!</p></div>`;
  else { const a = act(nx.a), after = l.find(i => i !== nx && !isDone(c, d, i.u));
    main = `<article class="kid-card" aria-labelledby="curA"><div class="big-ico">${ico(a)}</div><h2 id="curA">${esc(a.name)}</h2><p>${esc(a.instr)}</p>
      ${S.settings.times && a.time ? `<p>🕒 ${a.time}</p>` : ''}<button class="btn-done" data-act="done" data-u="${nx.u}" data-kidfocus>✔ ${t('done')}</button>
      ${after ? `<p class="mt-3"><b>${t('next')}:</b> ${esc(act(after.a).icon)} ${esc(act(after.a).name)}</p>` : ''}</article>`; }
  const rule = c.rules.find(r => r.type === 'day' && !(r.food && S.settings.noFood) && !c.earned.some(e => e.key === [r.id, d, c.resets[d] || 0, 'd'].join('|')));
  const near = rule && s.left > 0 ? `<p class="text-center fs-5 fw-bold">${rule.icon} ${s.left} more ${s.left === 1 ? 'activity' : 'activities'} to earn: ${esc(rule.name)}!</p>` : '';
  return `<button class="btn btn-soft grownup" data-act="nav" data-v="dashboard">🔒 Grown-up menu</button>
  <div class="kid-wrap"><h1 class="text-center">${t('today')}</h1>${dayBar(c, true)}
  <p class="text-center fs-4 fw-bold mb-0">${s.done} of ${s.total} done · ${s.left} left</p>${bar(s.pct, 'Progress today')}
  ${ui.msg ? `<div class="msg" role="status">⭐ ${esc(ui.msg)}</div>` : ''}${main}${near}
  <ul class="kidlist" aria-label="All activities for ${dayName(d)}">${l.map(i => { const a = act(i.a), st = stateOf(c, d, i);
    return `<li class="${st === 'done' ? 'isdone' : st === 'next' ? 'isnext' : ''}"><span class="em">${a.img ? '🖼️' : esc(a.icon)}</span>${esc(a.name)}${chip(st)}</li>`; }).join('')}</ul></div>`;
}

function rewardsView(){
  const c = cur(), pend = c.earned.filter(e => !e.given), given = c.earned.filter(e => e.given);
  const typeTxt = r => r.type === 'day' ? 'Complete the whole day' : r.type === 'each' ? 'After each eligible activity' : `After every ${r.count} activities`;
  return `<h1>${esc(c.name)}'s rewards</h1><p class="lead">Rewards are given by you in real life. “Earned” and “given” are tracked separately.</p>
  <div class="row g-4"><section class="col-lg-5" aria-labelledby="rr"><div class="panel"><div class="d-flex justify-content-between align-items-center"><h2 id="rr" class="mb-0">Reward rules</h2><button class="btn btn-main btn-sm" data-act="newRule">➕ New</button></div>
    <label class="form-check mt-3 d-flex gap-2 align-items-center"><input class="form-check-input" type="checkbox" data-pref="noFood" ${S.settings.noFood ? 'checked' : ''}><span class="form-check-label">Disable food-based rewards</span></label>
    ${c.rules.map(r => `<div class="mini"><span style="font-size:1.8rem" aria-hidden="true">${esc(r.icon)}</span><div><b>${esc(r.name)}</b>${r.qty > 1 ? ' ×' + r.qty : ''}<br><small class="lead">${typeTxt(r)}${r.food ? ' · 🍬 food' : ''}${r.food && S.settings.noFood ? ' (disabled)' : ''}</small></div>
      <span class="ms-auto d-flex gap-1"><button class="btn btn-soft btn-sm" data-act="editRule" data-id="${r.id}" aria-label="Edit ${esc(r.name)}">✏️</button><button class="btn btn-soft btn-sm" data-act="delRule" data-id="${r.id}" aria-label="Delete ${esc(r.name)}">🗑️</button></span></div>`).join('') || '<p class="mt-3">No rules yet.</p>'}</div></section>
  <section class="col-lg-7" aria-labelledby="er"><div class="panel"><h2 id="er">Earned rewards</h2>
    <div class="statlist mb-3"><div class="stat"><b>${c.earned.length}</b>earned</div><div class="stat"><b>${given.length}</b>given</div></div>
    ${[...pend, ...given.slice().reverse()].map(e => `<div class="mini"><span style="font-size:1.8rem" aria-hidden="true">${esc(e.icon)}</span><div><b>${esc(e.name)}${e.qty > 1 ? ' ×' + e.qty : ''}</b><br><small class="lead">Earned ${dayName(e.day)}, ${fmtDate(e.ts)}${e.given ? ' · given ' + fmtDate(e.givenTs) : ''}</small></div>
      <span class="ms-auto">${e.given ? '<span class="chip given">✅ Given</span>' : `<button class="btn btn-ok btn-sm" data-act="give" data-id="${e.id}">Mark Reward as Given</button>`}</span></div>`).join('') || '<p>No rewards earned yet. Finish activities in the child view!</p>'}
  </div></section></div>`;
}

function progressView(){
  const c = cur(), s = stat(c, ui.day), w = weekTotals(c), given = c.earned.filter(e => e.given).length;
  return `<h1>${esc(c.name)}'s progress</h1>${dayBar(c)}
  <div class="row g-4"><section class="col-lg-5" aria-labelledby="pd"><div class="panel text-center"><h2 id="pd">${dayName(ui.day)}</h2>
    <div class="donut" style="--p:${s.pct}" role="img" aria-label="${s.pct} percent complete"><span>${s.pct}%</span></div>
    <div class="statlist mt-3"><div class="stat"><b>${s.done}</b>completed</div><div class="stat"><b>${s.left}</b>pending</div>
    <div class="stat"><b>${c.earned.length}</b>rewards earned</div><div class="stat"><b>${given}</b>rewards redeemed</div></div></div></section>
  <section class="col-lg-7" aria-labelledby="pw"><div class="panel"><h2 id="pw">Weekly summary (Monday–Sunday)</h2>
    <table class="rtable"><thead><tr><th scope="col">Day</th><th scope="col">Completed</th><th scope="col">Progress</th></tr></thead><tbody>
    ${DAYS.map(d => { const x = stat(c, d.k); return `<tr><th scope="row">${d.n}</th><td>${x.done}/${x.total}</td><td style="min-width:140px">${bar(x.pct, d.n)}<small>${x.pct}%</small></td></tr>`; }).join('')}</tbody></table>
    <p class="fw-bold mb-0">Week total: ${w.done}/${w.total} (${w.total ? Math.round(w.done / w.total * 100) : 0}%)</p></div></section>
  <section class="col-12" aria-labelledby="ph"><div class="panel"><div class="d-flex justify-content-between flex-wrap gap-2"><h2 id="ph">Activity completion history</h2><button class="btn btn-soft btn-sm" data-act="newWeek">Start a new week</button></div>
    ${c.history.slice(0, 15).map(h => `<div class="mini"><span>✅</span><span>${esc(h.text)}</span><small class="ms-auto lead">${fmtDate(h.ts)}</small></div>`).join('') || '<p>No history yet.</p>'}</div></section></div>`;
}

function settingsView(){
  const c = cur(), st = S.settings;
  const sw = (n, label, v) => `<label class="form-check d-flex gap-2 align-items-center mb-2"><input class="form-check-input" type="checkbox" data-pref="${n}" ${v ? 'checked' : ''}><span class="form-check-label">${label}</span></label>`;
  return `<h1>Settings</h1><div class="row g-4">
  <section class="col-lg-6" aria-labelledby="s1"><div class="panel"><h2 id="s1">Child profile</h2><p>${c.avatar} <b>${esc(c.name)}</b>, age ${esc(c.age)}</p>
    <button class="btn btn-main me-2" data-act="editChild" data-id="${c.id}">✏️ Edit profile</button><button class="btn btn-soft" data-act="delChild" data-id="${c.id}">🗑️ Delete profile</button></div></section>
  <section class="col-lg-6" aria-labelledby="s2"><div class="panel"><h2 id="s2">Display & accessibility</h2>
    <label class="form-label fw-bold" for="lang">Interface language</label><select id="lang" class="form-select mb-3" data-pref="lang"><option value="en" ${st.lang === 'en' ? 'selected' : ''}>English</option><option value="fil" ${st.lang === 'fil' ? 'selected' : ''}>Filipino (main labels)</option></select>
    <label class="form-label fw-bold" for="ts">Text size</label><select id="ts" class="form-select mb-3" data-pref="text">${['Small','Medium','Large','Extra large'].map((n, i) => `<option value="${i + 1}" ${st.text === i + 1 ? 'selected' : ''}>${n}</option>`).join('')}</select>
    ${sw('sound', '🔊 Sound effects', st.sound)}${sw('anim', '✨ Celebration animations', st.anim)}${sw('hc', '◐ High-contrast mode', st.hc)}${sw('autoToday', '📅 Open on today\'s day', st.autoToday)}${sw('times', '🕒 Show activity times', st.times)}${sw('noFood', '🍬 Disable food-based rewards', st.noFood)}
    <p class="small lead mb-0">Reduced-motion device settings are always respected.</p></div></section>
  <section class="col-lg-7" aria-labelledby="s3"><div class="panel"><div class="d-flex justify-content-between align-items-center"><h2 id="s3" class="mb-0">Activity library</h2><button class="btn btn-main btn-sm" data-act="newAct">➕ New</button></div>
    ${S.activities.map(a => `<div class="mini"><span class="si-ico" style="width:42px;height:42px;font-size:1.5rem">${ico(a)}</span><span><b>${esc(a.name)}</b><br><small class="lead">${esc(a.cat)}</small></span>
    <span class="ms-auto d-flex gap-1"><button class="btn btn-soft btn-sm" data-act="editAct" data-id="${a.id}" aria-label="Edit ${esc(a.name)}">✏️</button><button class="btn btn-soft btn-sm" data-act="delAct" data-id="${a.id}" aria-label="Delete ${esc(a.name)}">🗑️</button></span></div>`).join('')}</div></section>
  <section class="col-lg-5" aria-labelledby="s4"><div class="panel"><h2 id="s4">Data</h2>
    <p>Saved only in this browser. Other devices won't see changes.</p>
    <div class="d-grid gap-2"><button class="btn btn-main" data-act="export">⬇️ Export ${esc(c.name)}'s schedule &amp; progress (JSON)</button>
    <button class="btn btn-soft" data-act="restore">↺ Restore sample data</button><button class="btn btn-soft" data-act="wipe">🗑️ Erase all data</button></div></div></section></div>`;
}
const VIEWS = {dashboard: dashboardView, schedule: scheduleView, kid: kidView, rewards: rewardsView, progress: progressView, settings: settingsView};

/* ---------- Render ---------- */
function render(scroll){
  applyPrefs();
  const y = window.scrollY;
  if (!U){ document.body.classList.remove('kid-mode'); $('#top').innerHTML = ''; $('#app').innerHTML = loginView(); return; }
  document.body.classList.toggle('kid-mode', ui.view === 'kid');
  $('#top').innerHTML = ui.view === 'kid' ? '' : header();
  $('#app').innerHTML = VIEWS[ui.view]();
  if (ui.view === 'schedule') renderLib();
  const cel = $('#celebrate');
  if (ui.celebrate){ cel.hidden = false; cel.innerHTML = celebrateHTML(); $('#celOk').focus(); } else { cel.hidden = true; cel.innerHTML = ''; }
  window.scrollTo(0, scroll ? 0 : y);
  if (ui.focus){ const f = $(ui.focus); if (f) f.focus(); ui.focus = null; }
}
function celebrateHTML(){
  const { all, got } = ui.celebrate, c = cur();
  return `<div class="cel">${all ? `<div class="stars" aria-hidden="true">🎉</div><h2 id="celTitle">AMAZING! YOU DID IT!</h2><p>You completed all your activities today!</p>`
    : `<div class="stars" aria-hidden="true">⭐</div><h2 id="celTitle">${t('great')}</h2>`}
    ${got.map(e => `<div class="rw">🏆 YOUR REWARD: ${esc(rewardLabel(e.name, e.qty).toUpperCase())}! <span aria-hidden="true">${esc(e.icon)}</span></div>`).join('')}
    ${got.length ? `<p>You earned ${got.length > 1 ? 'rewards' : 'a reward'}! Ask your parent or caregiver to receive your reward!</p>` : ''}
    <button class="btn-done" id="celOk" data-act="closeCel" style="font-size:1.8rem">Yay, ${esc(c.name)}!</button></div>`;
}

/* ---------- Reward engine ---------- */
function award(c, day, u){
  const a = act(c.schedule[day].find(i => i.u === u).a), n = (c.done[day] || []).length, total = items(c, day).length, out = [];
  c.rules.forEach(r => {
    if (r.food && S.settings.noFood) return;
    let extra = [];
    if (r.type === 'each') { if (a.reward) extra = [u]; }
    else if (r.type === 'group') { if (n % Math.max(1, r.count) === 0) extra = [n / Math.max(1, r.count)]; }
    else if (n === total && total > 0) extra = ['d'];
    extra.forEach(x => {
      const key = [r.id, day, c.resets[day] || 0, x].join('|');
      if (c.earned.some(e => e.key === key)) return;       // never award the same thing twice
      const e = {id: uid(), key, rid: r.id, name: r.name, icon: r.icon, qty: r.qty, day, ts: Date.now(), given: false, givenTs: null, food: r.food};
      c.earned.push(e); out.push(e);
    });
  });
  return out;
}

/* ---------- Forms ---------- */
let pendingImg = null, removeImg = false;
function childForm(c){
  return `<label class="form-label fw-bold" for="f_name">Name</label><input id="f_name" name="name" class="form-control mb-3" required maxlength="30" value="${esc(c?.name)}">
  <label class="form-label fw-bold" for="f_age">Age</label><input id="f_age" name="age" type="number" min="1" max="18" class="form-control mb-3" required value="${esc(c?.age || '')}">
  <label class="form-label fw-bold" for="f_av">Avatar</label><select id="f_av" name="avatar" class="form-select">${AVATARS.map(a => `<option ${c?.avatar === a ? 'selected' : ''}>${a}</option>`).join('')}</select>`;
}
function actForm(a){
  const c = cur(), sel = a ? DAYS.filter(d => c.schedule[d.k].some(i => i.a === a.id)).map(d => d.k) : [ui.day];
  pendingImg = null; removeImg = false;
  return `<label class="form-label fw-bold" for="a_name">Activity name</label><input id="a_name" name="name" class="form-control mb-3" required maxlength="50" placeholder="e.g. Practice using a spoon" value="${esc(a?.name)}">
  <div class="row g-3"><div class="col-md-6"><label class="form-label fw-bold" for="a_icon">Icon (emoji)</label><input id="a_icon" name="icon" class="form-control" maxlength="4" value="${esc(a?.icon || '⭐')}">
    <div class="emojigrid mt-2" role="group" aria-label="Pick an icon">${EMOJI.map(e => `<button type="button" data-act="pickEmoji" data-e="${e}" aria-label="Use ${e}">${e}</button>`).join('')}</div></div>
  <div class="col-md-6"><label class="form-label fw-bold" for="actImg">Or upload a picture (optional)</label><input id="actImg" type="file" accept="image/*" class="form-control">
    ${a?.img ? `<div class="mt-2"><img src="${a.img}" alt="Current picture for ${esc(a.name)}" width="80" height="80" style="border-radius:16px;object-fit:cover"><label class="form-check d-flex gap-2 mt-2"><input class="form-check-input" type="checkbox" id="rmImg"><span class="form-check-label">Remove picture</span></label></div>` : ''}
    <div id="imgPrev" class="mt-2"></div></div></div>
  <label class="form-label fw-bold mt-3" for="a_instr">Short instructions</label><textarea id="a_instr" name="instr" class="form-control mb-3" rows="2" maxlength="140">${esc(a?.instr)}</textarea>
  <div class="row g-3"><div class="col-md-5"><label class="form-label fw-bold" for="a_cat">Category</label><select id="a_cat" name="cat" class="form-select">${CATS.map(x => `<option ${a?.cat === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <div class="col-md-3"><label class="form-label fw-bold" for="a_dur">Minutes</label><input id="a_dur" name="dur" type="number" min="1" max="180" class="form-control" value="${a?.dur || 5}"></div>
  <div class="col-md-4"><label class="form-label fw-bold" for="a_time">Time (optional)</label><input id="a_time" name="time" type="time" class="form-control" value="${esc(a?.time)}"></div></div>
  <label class="form-check d-flex gap-2 mt-3"><input class="form-check-input" type="checkbox" name="reward" ${a?.reward !== false ? 'checked' : ''}><span class="form-check-label">Eligible for rewards</span></label>
  <fieldset class="mt-3"><legend class="fs-6 fw-bold">Repeat on (for ${esc(c.name)})</legend><div class="d-flex flex-wrap gap-3">${DAYS.map(d => `<label class="form-check d-flex gap-2"><input class="form-check-input" type="checkbox" name="days" value="${d.k}" ${sel.includes(d.k) ? 'checked' : ''}><span class="form-check-label">${d.n}</span></label>`).join('')}</div>
  <div class="d-flex gap-2 mt-2"><button type="button" class="btn btn-soft btn-sm" data-act="setDays" data-s="wd">Weekdays</button><button type="button" class="btn btn-soft btn-sm" data-act="setDays" data-s="we">Weekend</button><button type="button" class="btn btn-soft btn-sm" data-act="setDays" data-s="all">Every day</button></div></fieldset>`;
}
function openActForm(id){
  const a = id ? act(id) : null;
  openForm(a ? 'Edit activity' : 'Create my own activity', actForm(a), fd => {
    const name = (fd.get('name') || '').trim(); if (!name){ toast('Please enter an activity name.', 'danger'); return false; }
    const o = a || {id: 'c_' + uid(), builtin: false, img: ''};
    Object.assign(o, {name, icon: (fd.get('icon') || '⭐').trim() || '⭐', instr: (fd.get('instr') || '').trim() || 'Do this activity.', cat: fd.get('cat'),
      dur: +fd.get('dur') || 5, time: fd.get('time') || '', reward: fd.get('reward') === 'on'});
    if (pendingImg) o.img = pendingImg; else if ($('#rmImg')?.checked) o.img = '';
    if (!a) S.activities.push(o);
    const c = cur(), days = fd.getAll('days');
    DAYS.forEach(d => {
      const has = c.schedule[d.k].some(i => i.a === o.id);
      if (days.includes(d.k) && !has) c.schedule[d.k].push({u: uid(), a: o.id});
      if (!days.includes(d.k) && has && a) c.schedule[d.k] = c.schedule[d.k].filter(i => i.a !== o.id);
    });
    if (!save()) return false;
    toast(a ? 'Activity updated.' : 'Activity created and saved.'); render(); return true;
  });
}
function ruleForm(r){
  return `<label class="form-label fw-bold" for="r_name">Reward name</label><input id="r_name" name="name" class="form-control mb-3" required maxlength="40" value="${esc(r?.name)}" placeholder="e.g. Free Candy">
  <label class="form-label fw-bold" for="r_icon">Icon (emoji)</label><input id="r_icon" name="icon" class="form-control mb-3" maxlength="4" value="${esc(r?.icon || '⭐')}">
  <label class="form-label fw-bold" for="r_type">When is it earned?</label><select id="r_type" name="type" class="form-select mb-3"><option value="day" ${r?.type === 'day' ? 'selected' : ''}>When the entire day's schedule is complete</option><option value="group" ${r?.type === 'group' ? 'selected' : ''}>After a group of activities</option><option value="each" ${r?.type === 'each' ? 'selected' : ''}>After each eligible activity</option></select>
  <label class="form-label fw-bold" for="r_count">Activities in a group (used for “group”)</label><input id="r_count" name="count" type="number" min="1" max="20" class="form-control mb-3" value="${r?.count || 3}">
  <label class="form-label fw-bold" for="r_qty">Quantity</label><input id="r_qty" name="qty" type="number" min="1" max="20" class="form-control mb-3" value="${r?.qty || 1}">
  <label class="form-check d-flex gap-2"><input class="form-check-input" type="checkbox" name="food" ${r?.food ? 'checked' : ''}><span class="form-check-label">This is a food reward (can be disabled in settings)</span></label>`;
}

/* ---------- Actions (click delegation) ---------- */
const ACT = {
  nav: d => { ui.view = d.v; ui.msg = ''; render(true); },
  logout: () => { U = null; localStorage.removeItem(SKEY); ui.view = 'dashboard'; render(true); },
  selChild: d => { ui.child = d.id; render(); },
  day: d => { ui.day = d.d; ui.msg = ''; ui.focus = `[data-act=day][data-d=${d.d}]`; render(); },
  addItem: (d, b) => { const c = cur(); c.schedule[ui.day].push({u: uid(), a: d.id}); save(); ui.focus = `[data-act=addItem][data-id="${d.id}"]`; render(); toast(`Added “${act(d.id).name}” to ${dayName(ui.day)}.`); },
  rm: d => { const c = cur(); c.schedule[ui.day] = c.schedule[ui.day].filter(i => i.u !== d.u); c.done[ui.day] = (c.done[ui.day] || []).filter(u => u !== d.u); save(); render(); announce('Activity removed.'); },
  up: d => move(d.u, -1), down: d => move(d.u, 1),
  newAct: () => openActForm(), editAct: d => openActForm(d.id),
  delAct: async d => { const a = act(d.id); if (!await confirmBox(`Delete “${a.name}”? It will be removed from every child's schedule.`, 'Delete activity')) return;
    S.activities = S.activities.filter(x => x.id !== a.id); S.children.forEach(k => DAYS.forEach(dd => k.schedule[dd.k] = k.schedule[dd.k].filter(i => i.a !== a.id))); save(); render(); toast('Activity deleted.'); },
  pickEmoji: d => { $('#a_icon').value = d.e; },
  setDays: d => document.querySelectorAll('input[name=days]').forEach(i => i.checked = d.s === 'all' || (d.s === 'wd' ? WD : WE).includes(i.value)),
  resetDay: async () => { if (!await confirmBox(`Reset ${dayName(ui.day)}'s progress? Activities stay; check-marks are cleared.`, 'Reset day')) return;
    const c = cur(); c.done[ui.day] = []; c.resets[ui.day] = (c.resets[ui.day] || 0) + 1; log(c, `Reset ${dayName(ui.day)} schedule`); save(); render(); toast('Day reset.'); },
  newWeek: async () => { if (!await confirmBox('Clear all check-marks for the whole week? Rewards already earned are kept.', 'Start new week')) return;
    const c = cur(); DAYS.forEach(d => { c.done[d.k] = []; c.resets[d.k] = (c.resets[d.k] || 0) + 1; }); log(c, 'Started a new week'); save(); render(); toast('New week started.'); },
  copy: async () => { const c = cur(), v = $('#copySel').value, tg = (v === 'wd' ? WD : v === 'we' ? WE : DAYS.map(d => d.k)).filter(k => k !== ui.day);
    if (!tg.length){ toast('Nothing to copy to.', 'danger'); return; }
    if (!await confirmBox(`Replace the schedule on ${tg.map(dayName).join(', ')} with ${dayName(ui.day)}'s activities?`, 'Copy schedule')) return;
    tg.forEach(k => { c.schedule[k] = c.schedule[ui.day].map(i => ({u: uid(), a: i.a})); c.done[k] = []; }); save(); render(); toast('Schedule copied.'); },
  done: d => {
    const c = cur(), day = ui.day, it = items(c, day).find(i => i.u === d.u); if (!it || isDone(c, day, it.u)) return;
    (c.done[day] = c.done[day] || []).push(it.u); const a = act(it.a);
    log(c, `Completed “${a.name}” (${dayName(day)})`);
    const got = award(c, day, it.u), s = stat(c, day); save(); chime();
    const nx = items(c, day).find(i => !isDone(c, day, i.u));
    ui.msg = nx ? `${t('great')} You finished “${a.name}”. Next: ${act(nx.a).name}.` : `${t('great')} You finished “${a.name}”!`;
    if (s.left === 0 || got.length) ui.celebrate = {all: s.left === 0, got};
    ui.focus = ui.celebrate ? null : '[data-kidfocus]'; render(); announce(ui.msg);
  },
  closeCel: () => { ui.celebrate = null; ui.focus = '[data-kidfocus]'; render(); },
  give: d => { const e = cur().earned.find(x => x.id === d.id); e.given = true; e.givenTs = Date.now(); log(cur(), `Reward given: ${e.name}`); save(); render(); toast(`Marked “${e.name}” as given.`); },
  newRule: () => openForm('New reward rule', ruleForm(), fd => saveRule(null, fd)),
  editRule: d => { const r = cur().rules.find(x => x.id === d.id); openForm('Edit reward rule', ruleForm(r), fd => saveRule(r, fd)); },
  delRule: async d => { if (!await confirmBox('Delete this reward rule? Rewards already earned stay in the history.', 'Delete rule')) return;
    const c = cur(); c.rules = c.rules.filter(r => r.id !== d.id); save(); render(); },
  newChild: () => { if (S.children.length >= 3){ toast('Up to three child profiles are supported.', 'danger'); return; }
    openForm('Add a child profile', childForm(), fd => { if (!fd.get('name').trim()) return false;
      const k = {id: uid(), name: fd.get('name').trim(), age: +fd.get('age'), avatar: fd.get('avatar'), color: AV_COLORS[S.children.length % 3], schedule: emptySched(), done: {}, resets: {},
        rules: [{id: 'r1', name: 'Free Candy', icon: '🍬', type: 'day', count: 5, qty: 1, food: true}], earned: [], history: []};
      S.children.push(k); ui.child = k.id; save(); render(); toast(`${k.name}'s profile was added.`); }); },
  editChild: d => { const k = S.children.find(x => x.id === d.id);
    openForm('Edit child profile', childForm(k), fd => { k.name = fd.get('name').trim() || k.name; k.age = +fd.get('age') || k.age; k.avatar = fd.get('avatar'); save(); render(); toast('Profile updated.'); }); },
  delChild: async d => { if (S.children.length <= 1){ toast('At least one child profile is required.', 'danger'); return; }
    if (U.role === 'caregiver'){ toast('Caregivers cannot delete profiles.', 'danger'); return; }
    const k = S.children.find(x => x.id === d.id);
    if (!await confirmBox(`Delete ${k.name}'s profile, schedule and rewards? This cannot be undone.`, 'Delete profile')) return;
    S.children = S.children.filter(x => x.id !== k.id); ui.child = S.children[0].id; save(); render(true); toast('Profile deleted.'); },
  export: () => { const c = cur(), blob = new Blob([JSON.stringify({exportedAt: new Date().toISOString(), child: c, activities: S.activities, weekly: DAYS.map(d => ({day: d.n, ...stat(c, d.k)}))}, null, 2)], {type: 'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${c.name.toLowerCase()}-backup.json`; a.click(); URL.revokeObjectURL(a.href); toast('Backup downloaded.'); },
  restore: async () => { if (U.role === 'caregiver'){ toast('Caregivers cannot reset data.', 'danger'); return; }
    if (!await confirmBox('Replace ALL data with the original sample data? Your changes will be lost.', 'Restore sample data')) return;
    S = sample(); ui.child = S.children[0].id; save(); render(true); toast('Sample data restored.'); },
  wipe: async () => { if (U.role === 'caregiver'){ toast('Caregivers cannot erase data.', 'danger'); return; }
    if (!await confirmBox('Erase everything, including all children, activities and rewards? This cannot be undone.', 'Erase all data')) return;
    S = sample(); S.children.forEach(k => { k.done = {}; k.earned = []; k.history = []; DAYS.forEach(d => k.schedule[d.k] = []); }); S.activities = S.activities.filter(a => a.builtin);
    ui.child = S.children[0].id; save(); render(true); toast('All data erased. Add activities to begin.'); }
};
function saveRule(r, fd){
  const name = (fd.get('name') || '').trim(); if (!name) return false;
  const o = r || {id: 'r' + uid()};
  Object.assign(o, {name, icon: (fd.get('icon') || '⭐').trim() || '⭐', type: fd.get('type'), count: +fd.get('count') || 1, qty: +fd.get('qty') || 1, food: fd.get('food') === 'on'});
  if (!r) cur().rules.push(o); save(); render(); toast('Reward rule saved.');
}
function move(u, dir){
  const l = cur().schedule[ui.day], i = l.findIndex(x => x.u === u), j = i + dir; if (j < 0 || j >= l.length) return;
  [l[i], l[j]] = [l[j], l[i]]; save(); render(); announce(`Moved to position ${j + 1} of ${l.length}.`);
  const f = $(`.sitem[data-u="${u}"] [data-act=${dir < 0 ? 'up' : 'down'}]:not([disabled])`) || $(`.sitem[data-u="${u}"] [data-act=editAct]`); if (f) f.focus();
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const fn = ACT[b.dataset.act]; if (fn) fn(b.dataset, b);
});
document.addEventListener('change', e => {
  const t0 = e.target;
  if (t0.dataset.change === 'child'){ ui.child = t0.value; render(); }
  else if (t0.dataset.change === 'cat'){ ui.cat = t0.value; renderLib(); }
  else if (t0.dataset.pref){ const n = t0.dataset.pref; S.settings[n] = t0.type === 'checkbox' ? t0.checked : (n === 'text' ? +t0.value : t0.value); save(); render(); }
  else if (t0.id === 'actImg' && t0.files[0]) readImage(t0.files[0]);
});
document.addEventListener('input', e => { if (e.target.dataset.input === 'q'){ ui.q = e.target.value; renderLib(); } });

/* Resize uploaded pictures so they fit in localStorage */
function readImage(file){
  const fr = new FileReader();
  fr.onload = () => { const im = new Image(); im.onload = () => {
    const s = Math.min(1, 300 / Math.max(im.width, im.height)), cv = document.createElement('canvas');
    cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
    pendingImg = cv.toDataURL('image/jpeg', .8);
    $('#imgPrev').innerHTML = `<img src="${pendingImg}" alt="Preview of the uploaded picture" width="80" height="80" style="border-radius:16px;object-fit:cover">`; };
    im.onerror = () => toast('That file is not a usable picture.', 'danger'); im.src = fr.result; };
  fr.readAsDataURL(file);
}

/* ---------- Drag & drop (keyboard alternatives are the ⬆️ ⬇️ Add and Remove buttons) ---------- */
let drag = null;
document.addEventListener('dragstart', e => {
  const el = e.target.closest('[data-lib],.sitem'); if (!el) return;
  drag = el.dataset.lib ? {lib: el.dataset.lib} : {u: el.dataset.u};
  e.dataTransfer.effectAllowed = 'copyMove'; e.dataTransfer.setData('text/plain', 'x'); el.classList.add('dragging');
});
document.addEventListener('dragend', () => { drag = null; document.querySelectorAll('.dragging,.over').forEach(x => x.classList.remove('dragging', 'over')); });
document.addEventListener('dragover', e => { const z = e.target.closest('#sched'); if (drag && z){ e.preventDefault(); z.classList.add('over'); } });
document.addEventListener('dragleave', e => { const z = e.target.closest('#sched'); if (z && !z.contains(e.relatedTarget)) z.classList.remove('over'); });
document.addEventListener('drop', e => {
  const z = e.target.closest('#sched'); if (!drag || !z) return; e.preventDefault();
  const tgt = e.target.closest('.sitem'), l = cur().schedule[ui.day]; let idx = tgt ? l.findIndex(i => i.u === tgt.dataset.u) : l.length;
  if (drag.lib) l.splice(idx, 0, {u: uid(), a: drag.lib});
  else { const from = l.findIndex(i => i.u === drag.u); if (from < 0) return; const [it] = l.splice(from, 1); if (from < idx) idx--; l.splice(idx, 0, it); }
  drag = null; save(); render(); announce('Schedule updated.');
});

/* ---------- Login ---------- */
document.addEventListener('change', e => { if (e.target.id === 'role') $('#uname').value = e.target.value; });
document.addEventListener('submit', e => {
  if (e.target.id !== 'loginForm') return; e.preventDefault();
  const u = $('#uname').value.trim().toLowerCase();
  if (USERS[u] && $('#pw').value === DEMO_PW){ U = {user: u, role: u}; localStorage.setItem(SKEY, JSON.stringify(U)); ui.view = 'dashboard'; render(true); }
  else $('#loginErr').textContent = 'Username or password not recognised. Use the demo details below.';
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.celebrate){ ACT.closeCel(); } });

render(true);
