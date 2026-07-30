/* =========================================================
   我的闪闪工作台 · 交互逻辑
   数据存储：阶段一用 localStorage（刷新不丢，单设备）。
   后续接入 Supabase 时，只需替换下方 store 的实现，
   其余渲染/逻辑无需改动即可切换为云端同步。
   ========================================================= */
const store = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ===== 日期 =====
const now = new Date();
const wkName = ['周日','周一','周二','周三','周四','周五','周六'][now.getDay()];
document.getElementById('todayDate').textContent = `${now.getMonth()+1}月${now.getDate()}日 ${wkName}`;
const dateStr = () => `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
function weekStr(){
  const onejan = new Date(now.getFullYear(),0,1);
  const week = Math.ceil((((now - onejan)/86400000) + onejan.getDay() + 1)/7);
  return `${now.getFullYear()}-W${week}`;
}

// ===== 登录 =====
document.getElementById('loginBtn').addEventListener('click', ()=>{
  document.getElementById('login').classList.add('hidden');
});

// ===== 导航切换 =====
const titles = { home:'今日概览', plan:'每日计划', accounts:'我的账号', idea:'灵感记录', fit:'减肥记录', read:'每日阅读', skill:'新技能学习' };
const content = document.querySelector('.content');
function switchTo(t){
  document.querySelectorAll('.nav-item[data-target]').forEach(b=>b.classList.toggle('active', b.dataset.target===t));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id===t));
  document.querySelectorAll('.bottom-nav .bn[data-target]').forEach(b=>b.classList.toggle('active', b.dataset.target===t));
  document.getElementById('topTitle').textContent = titles[t] || '';
  content.scrollTop = 0;
  closeDrawer();
}
document.querySelectorAll('[data-target]').forEach(el=> el.addEventListener('click', ()=> switchTo(el.dataset.target)));

// ===== 左侧收起 =====
document.getElementById('collapse').addEventListener('click', ()=> document.getElementById('sidebar').classList.toggle('collapsed'));

// ===== 移动端抽屉 =====
const sidebar = document.getElementById('sidebar');
const scrim = document.getElementById('scrim');
function openDrawer(){ sidebar.classList.add('open'); scrim.classList.add('show'); }
function closeDrawer(){ sidebar.classList.remove('open'); scrim.classList.remove('show'); }
document.getElementById('hamburger').addEventListener('click', ()=> sidebar.classList.contains('open')?closeDrawer():openDrawer());
document.getElementById('moreBtn').addEventListener('click', openDrawer);
scrim.addEventListener('click', closeDrawer);
document.getElementById('fab').addEventListener('click', ()=>{ switchTo('plan'); setTimeout(()=>document.getElementById('taskText')?.focus(), 300); });

// ===== 撒花 =====
function celebrate(){
  const em = ['🎉','✨','🌸','⭐','💖','🍬'];
  for(let i=0;i<14;i++){
    const c = document.createElement('div');
    c.className = 'confetti';
    c.textContent = em[Math.floor(Math.random()*em.length)];
    c.style.left = Math.random()*100 + 'vw';
    c.style.animationDelay = (Math.random()*0.3) + 's';
    document.body.appendChild(c);
    setTimeout(()=>c.remove(), 1500);
  }
}

// ===================== 每日计划（可编辑） =====================
let tasks = store.get('sw_tasks', []);
const saveTasks = () => store.set('sw_tasks', tasks);
const catName = { work:'工作', media:'自媒体', life:'生活', fit:'健身', read:'阅读' };

function renderTasks(){
  const list = document.getElementById('tasksList');
  const home = document.getElementById('homeTasks');
  list.innerHTML = ''; home.innerHTML = '';
  tasks.forEach(t=>{
    const li = document.createElement('li');
    li.innerHTML = `<label><input type="checkbox" ${t.done?'checked':''}><span class="t-text cat-${t.cat}">${esc(t.text)}</span></label>` +
      (t.time ? `<span class="t-time">${t.time}</span>` : '') +
      `<button class="t-edit" title="编辑">✎</button><button class="t-del" title="删除">✕</button>`;
    li.querySelector('input').addEventListener('change', ()=> toggleTask(t.id));
    li.querySelector('.t-edit').addEventListener('click', ()=> editTask(t.id));
    li.querySelector('.t-del').addEventListener('click', ()=> delTask(t.id));
    list.appendChild(li);
    const hl = document.createElement('li');
    hl.innerHTML = `<label><input type="checkbox" ${t.done?'checked':''}><span class="cat-${t.cat}">${esc(t.text)}</span></label>`;
    hl.querySelector('input').addEventListener('change', ()=> toggleTask(t.id));
    home.appendChild(hl);
  });
  const done = tasks.filter(t=>t.done).length;
  document.getElementById('taskCount').textContent = tasks.length;
  document.getElementById('homeTodo').textContent = `${done}/${tasks.length}`;
  document.getElementById('tasksEmpty').style.display = tasks.length ? 'none' : 'block';
  // 时间轴
  const tl = document.getElementById('timelineView'); tl.innerHTML = '';
  const withTime = [...tasks].filter(t=>t.time).sort((a,b)=>a.time.localeCompare(b.time));
  if(!withTime.length) tl.innerHTML = '<li class="muted small">添加带时间的任务，这里会按时间排好～</li>';
  withTime.forEach(t=>{ const li=document.createElement('li'); li.innerHTML=`<i>${t.time}</i> ${esc(t.text)}`; tl.appendChild(li); });
}
function addTask(){
  const text = document.getElementById('taskText').value.trim();
  if(!text) return;
  tasks.push({ id: Date.now(), text, time: document.getElementById('taskTime').value, cat: document.getElementById('taskCat').value, done:false });
  saveTasks(); renderTasks();
  document.getElementById('taskText').value = ''; document.getElementById('taskTime').value = '';
  document.getElementById('taskText').focus();
}
function toggleTask(id){
  const t = tasks.find(x=>x.id===id); if(!t) return;
  t.done = !t.done; saveTasks(); renderTasks(); if(t.done) celebrate();
}
function editTask(id){
  const t = tasks.find(x=>x.id===id); if(!t) return;
  const nv = prompt('修改任务内容：', t.text);
  if(nv!==null && nv.trim()){ t.text = nv.trim(); saveTasks(); renderTasks(); }
}
function delTask(id){
  if(!confirm('确定删除这条任务？')) return;
  tasks = tasks.filter(x=>x.id!==id); saveTasks(); renderTasks();
}
document.getElementById('taskAdd').addEventListener('click', addTask);
document.getElementById('taskText').addEventListener('keydown', e=>{ if(e.key==='Enter') addTask(); });

// ===================== 日复盘 =====================
let selectedMood = '';
function setMood(m){
  selectedMood = m;
  document.querySelectorAll('#rvMood button').forEach(b=>b.classList.toggle('on', b.dataset.m===m));
}
document.querySelectorAll('#rvMood button').forEach(b=> b.addEventListener('click', ()=> setMood(b.dataset.m)));
function loadDaily(){
  const t = dateStr();
  document.getElementById('reviewDate').textContent = t;
  const all = store.get('sw_daily', {});
  const r = all[t] || {};
  document.getElementById('rvDone').value = r.done || '';
  document.getElementById('rvNot').value = r.not || '';
  document.getElementById('rvHappy').value = r.happy || '';
  document.getElementById('rvTomorrow').value = r.tomorrow || '';
  setMood(r.mood || '');
  const n = Object.keys(all).length;
  document.getElementById('rvHistory').textContent = n ? `已记录 ${n} 篇日复盘` : '还没有日复盘，今天写第一篇吧～';
}
document.getElementById('rvSave').addEventListener('click', ()=>{
  const all = store.get('sw_daily', {});
  all[dateStr()] = {
    done: document.getElementById('rvDone').value,
    not: document.getElementById('rvNot').value,
    happy: document.getElementById('rvHappy').value,
    tomorrow: document.getElementById('rvTomorrow').value,
    mood: selectedMood
  };
  store.set('sw_daily', all);
  document.getElementById('rvHistory').textContent = '✅ 今日复盘已保存';
  loadDaily();
});

// ===================== 周复盘 =====================
function loadWeekly(){
  const w = weekStr();
  document.getElementById('weekLabel').textContent = w;
  const all = store.get('sw_weekly', {});
  const r = all[w] || {};
  ['wkGoal','wkAcc','wkGood','wkImprove','wkNext','wkState'].forEach(id=> document.getElementById(id).value = r[id.replace('wk','').toLowerCase()] || '');
  const n = Object.keys(all).length;
  document.getElementById('wkHistory').textContent = n ? `已记录 ${n} 篇周复盘` : '还没有周复盘，这周写第一篇吧～';
}
document.getElementById('wkSave').addEventListener('click', ()=>{
  const all = store.get('sw_weekly', {});
  all[weekStr()] = {
    goal: document.getElementById('wkGoal').value,
    acc: document.getElementById('wkAcc').value,
    good: document.getElementById('wkGood').value,
    improve: document.getElementById('wkImprove').value,
    next: document.getElementById('wkNext').value,
    state: document.getElementById('wkState').value
  };
  store.set('sw_weekly', all);
  document.getElementById('wkHistory').textContent = '✅ 本周复盘已保存';
  loadWeekly();
});

// ===================== 灵感 / 体重 / 小伙伴 =====================
const ideaInput = document.getElementById('ideaInput');
const ideaGrid = document.querySelector('#idea .grid');
const ideaTags = ['宠物选题','工作VLOG','卖货内容','个人口播','生活记录'];
function addIdea(){
  const v = ideaInput.value.trim(); if(!v) return;
  const card = document.createElement('div');
  card.className = 'card idea-card';
  const colors = ['var(--yellow)','var(--pink)','var(--blue)','var(--purple)'];
  card.style.setProperty('--ic', colors[Math.floor(Math.random()*colors.length)]);
  const tag = ideaTags[Math.floor(Math.random()*ideaTags.length)];
  const time = `${now.getMonth()+1}月${now.getDate()}日 ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  card.innerHTML = `<span class="idea-tag">${tag}</span><div>${esc(v)}</div><div class="idea-foot">🕒 ${time} · 状态：刚刚想到</div>`;
  ideaGrid.insertBefore(card, ideaGrid.children[1]);
  ideaInput.value = '';
}
document.getElementById('ideaAdd').addEventListener('click', addIdea);
ideaInput.addEventListener('keydown', e=>{ if(e.key==='Enter') addIdea(); });

const weightInput = document.getElementById('weightInput');
document.getElementById('weightAdd').addEventListener('click', ()=>{
  const v = parseFloat(weightInput.value);
  if(!isNaN(v)){ document.getElementById('fitBig').innerHTML = `${v.toFixed(1)} <small>kg</small>`; weightInput.value=''; }
});

const cheers = ['今天也要闪闪发光！','完成一件事就很棒啦 🌟','喝口水，慢慢来~','你比昨天的自己更厉害 💪','记得对小猫说声辛苦啦 🐱'];
document.getElementById('mascot').addEventListener('click', ()=>{
  document.getElementById('mascotBubble').textContent = cheers[Math.floor(Math.random()*cheers.length)];
});

// ===== 初始化 =====
renderTasks();
loadDaily();
loadWeekly();
