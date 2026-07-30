/* =========================================================
   我的闪闪工作台 · 交互逻辑（全模块可编辑 + 自动复盘 + 一次性固定密码）
   数据存储：阶段一用 localStorage（单设备）。
   后续接入 Supabase 时，只需替换下方 store 的实现即可切换为云端同步。
   ========================================================= */
const store = {
  get: (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $ = id => document.getElementById(id);

// ===== 日期 =====
const now = new Date();
const wkName = ['周日','周一','周二','周三','周四','周五','周六'][now.getDay()];
$('todayDate').textContent = `${now.getMonth()+1}月${now.getDate()}日 ${wkName}`;
const pad = n => String(n).padStart(2,'0');
const dateStr = d => { d = d || now; return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
function daysAgo(n){ const d = new Date(now); d.setDate(d.getDate()-n); return dateStr(d); }
function weekOf(ds){
  const [y,m,d] = ds.split('-').map(Number);
  const dt = new Date(y, m-1, d); const onejan = new Date(y,0,1);
  const week = Math.ceil((((dt - onejan)/86400000) + onejan.getDay() + 1)/7);
  return `${y}-W${week}`;
}
const weekStr = () => weekOf(dateStr());
const inWeek = ds => weekOf(ds) === weekStr();

const catName = { work:'工作', media:'自媒体', life:'生活', fit:'健身', read:'阅读' };
const ACC_COLORS = ['yellow','pink','orange','purple','blue','mint'];
const fmtFans = n => { n = Number(n)||0; return n>=1000 ? (n/1000).toFixed(1).replace(/\.0$/,'')+'k' : ''+n; };

/* =========================================================
   登录：一次性固定密码
   ========================================================= */
const loginName = $('loginName'), loginPwd = $('loginPwd'), loginBtn = $('loginBtn'),
      loginHint = $('loginHint'), loginTip = $('loginTip'), loginErr = $('loginErr');
const savedPwd = store.get('sw_pwd', null);
loginName.value = store.get('sw_name', '运营小主');
if(!savedPwd){
  loginHint.textContent = '首次使用，设置你的访问密码';
  loginTip.textContent = '只设置这一次，之后都用此密码进入';
  loginBtn.textContent = '设置并进入 ✨';
} else {
  loginHint.textContent = '欢迎回来 ✨';
  loginTip.textContent = '请输入访问密码';
}
function showLoginErr(m){ loginErr.textContent = m; loginErr.style.display = 'block'; }
loginBtn.addEventListener('click', ()=>{
  const v = loginPwd.value, nm = loginName.value.trim() || '运营小主';
  if(!savedPwd){
    if(v.length < 4){ showLoginErr('密码至少 4 位哦'); return; }
    store.set('sw_pwd', v); store.set('sw_name', nm);
  } else {
    if(v !== savedPwd){ showLoginErr('密码不正确，请重试'); return; }
    store.set('sw_name', nm);
  }
  $('login').classList.add('hidden');
  $('sideName').textContent = nm;
  loadWelcome();
});
loginPwd.addEventListener('keydown', e=>{ if(e.key==='Enter') loginBtn.click(); });
$('logoutBtn').addEventListener('click', ()=>{ $('login').classList.remove('hidden'); loginPwd.value=''; loginErr.style.display='none'; });

/* =========================================================
   首次运行种子数据
   ========================================================= */
function seedIfEmpty(){
  if(!store.get('sw_accounts')){
    store.set('sw_accounts', [
      {id:1, platform:'xhs', name:'宠物号', emoji:'🐾', color:'yellow', fans:12800, monthAdd:1200, posts:21, pending:2},
      {id:2, platform:'xhs', name:'个人工作vlog', emoji:'🎬', color:'pink', fans:8200, monthAdd:680, posts:13, pending:1},
      {id:3, platform:'xhs', name:'卖货账号', emoji:'🛍️', color:'orange', fans:23500, monthAdd:2100, posts:28, pending:3},
      {id:4, platform:'xhs', name:'个人口播号', emoji:'🎙️', color:'purple', fans:5600, monthAdd:420, posts:16, pending:2},
      {id:5, platform:'dy', name:'宠物号', emoji:'🐾', color:'blue', fans:41200, monthAdd:4800, posts:24, pending:2},
      {id:6, platform:'dy', name:'工作VLOG记录', emoji:'📹', color:'mint', fans:15900, monthAdd:1900, posts:20, pending:1},
    ]);
  }
  if(!store.get('sw_ideas')){
    store.set('sw_ideas', [
      {id:1, tag:'宠物选题', text:'「猫主子的一天」系列 vlog，第一视角拍吃喝睡', date:daysAgo(0), time:'10:12', status:'值得尝试'},
      {id:2, tag:'卖货内容', text:'开场白：「别急着划走，这件我自用了 3 个月」', date:daysAgo(1), time:'21:40', status:'已加入计划'},
      {id:3, tag:'工作VLOG', text:'手机云台 + 自然光，比补光灯更真实', date:daysAgo(1), time:'15:03', status:'已完成'},
      {id:4, tag:'个人口播', text:'标题公式：数字+痛点+反转', date:daysAgo(2), time:'09:20', status:'值得尝试'},
    ]);
  }
  if(!store.get('sw_weight')){
    const w = [[6,58.0],[5,57.8],[4,57.6],[3,57.2],[2,57.0],[1,56.9],[0,56.8]];
    store.set('sw_weight', w.map(([n,v])=>({id:n, date:daysAgo(n), value:v})));
  }
  if(!store.get('sw_fit')) store.set('sw_fit', {goal:54, start:58, achievements:['裤子变宽松了 👖','连续运动 7 天 💪','爬楼不喘了 🏃','睡眠变好了 😴']});
  if(store.get('sw_read_goal')===undefined) store.set('sw_read_goal', 30);
  if(store.get('sw_read_today')===undefined) store.set('sw_read_today', 32);
  if(store.get('sw_read_streak')===undefined) store.set('sw_read_streak', 16);
  if(!store.get('sw_read_log')) store.set('sw_read_log', [{date:dateStr(), min:32}]);
  if(!store.get('sw_books')) store.set('sw_books', [{id:1, name:'增长黑客', progress:78, quote:'不要用战术勤奋掩盖战略懒惰。'}]);
  if(!store.get('sw_skills')) store.set('sw_skills', [
    {id:1, name:'🎬 剪映进阶剪辑', progress:65},
    {id:2, name:'📊 数据分析', progress:30},
    {id:3, name:'✍️ 文案写作', progress:88},
  ]);
  if(!store.get('sw_skill_tasks')) store.set('sw_skill_tasks', ['看一节课程','做一次练习','整理笔记','完成一个作品']);
  if(!store.get('sw_kanban')) store.set('sw_kanban', []);
  if(!store.get('sw_tasks')) store.set('sw_tasks', []);
  if(store.get('sw_hitnote')===undefined) store.set('sw_hitnote', '封面：猫脸特写；标题：数字+痛点；前三秒：直接上才艺');
  if(!store.get('sw_done_log')) store.set('sw_done_log', []);
}

/* =========================================================
   导航 / 抽屉 / 收起 / 撒花 / 提示
   ========================================================= */
const titles = { home:'今日概览', plan:'每日计划', accounts:'我的账号', idea:'灵感记录', fit:'减肥记录', read:'每日阅读', skill:'新技能学习' };
const content = document.querySelector('.content');
function switchTo(t){
  document.querySelectorAll('.nav-item[data-target]').forEach(b=>b.classList.toggle('active', b.dataset.target===t));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id===t));
  document.querySelectorAll('.bottom-nav .bn[data-target]').forEach(b=>b.classList.toggle('active', b.dataset.target===t));
  $('topTitle').textContent = titles[t] || '';
  content.scrollTop = 0; closeDrawer();
}
document.querySelectorAll('[data-target]').forEach(el=> el.addEventListener('click', ()=> switchTo(el.dataset.target)));
$('collapse').addEventListener('click', ()=> $('sidebar').classList.toggle('collapsed'));
const sidebar = $('sidebar'), scrim = $('scrim');
function openDrawer(){ sidebar.classList.add('open'); scrim.classList.add('show'); }
function closeDrawer(){ sidebar.classList.remove('open'); scrim.classList.remove('show'); }
$('hamburger').addEventListener('click', ()=> sidebar.classList.contains('open')?closeDrawer():openDrawer());
$('moreBtn').addEventListener('click', openDrawer);
scrim.addEventListener('click', closeDrawer);
$('fab').addEventListener('click', ()=>{ switchTo('plan'); setTimeout(()=>$('taskText')?.focus(), 300); });

function celebrate(){
  const em = ['🎉','✨','🌸','⭐','💖','🍬'];
  for(let i=0;i<14;i++){
    const c = document.createElement('div'); c.className='confetti'; c.textContent = em[Math.floor(Math.random()*em.length)];
    c.style.left = Math.random()*100+'vw'; c.style.animationDelay=(Math.random()*0.3)+'s';
    document.body.appendChild(c); setTimeout(()=>c.remove(),1500);
  }
}
function toast(msg){
  let t = document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),300); },1700);
}
const cheers = ['今天也要闪闪发光！','完成一件事就很棒啦 🌟','喝口水，慢慢来~','你比昨天的自己更厉害 💪','记得对小猫说声辛苦啦 🐱'];
$('mascot').addEventListener('click', ()=>{ $('mascotBubble').textContent = cheers[Math.floor(Math.random()*cheers.length)]; });

function loadWelcome(){
  const h = now.getHours();
  const greet = h<11?'早上好呀':h<14?'中午好呀':h<18?'下午好呀':'晚上好呀';
  $('welcomeText').textContent = `${greet}，${store.get('sw_name','运营小主')}！`;
  $('welcomeSub').textContent = `${now.getMonth()+1}月${now.getDate()}日 ${wkName} · 苏州 ⛅26° · 今天也要完成闪闪发光的小目标 ✨`;
}

/* =========================================================
   每日计划（可编辑）
   ========================================================= */
let tasks = store.get('sw_tasks', []);
const saveTasks = () => store.set('sw_tasks', tasks);
function renderTasks(){
  const list = $('tasksList'), home = $('homeTasks');
  list.innerHTML=''; home.innerHTML='';
  tasks.forEach(t=>{
    const li = document.createElement('li');
    li.innerHTML = `<label><input type="checkbox" ${t.done?'checked':''}><span class="t-text cat-${t.cat}">${esc(t.text)}</span></label>` +
      (t.time?`<span class="t-time">${t.time}</span>`:'') +
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
  $('taskCount').textContent = tasks.length;
  $('homeTodo').textContent = `${done}/${tasks.length}`;
  $('tasksEmpty').style.display = tasks.length ? 'none':'block';
  const tl = $('timelineView'); tl.innerHTML='';
  const wt = [...tasks].filter(t=>t.time).sort((a,b)=>a.time.localeCompare(b.time));
  if(!wt.length) tl.innerHTML='<li class="muted small">添加带时间的任务，这里会按时间排好～</li>';
  wt.forEach(t=>{ const li=document.createElement('li'); li.innerHTML=`<i>${t.time}</i> ${esc(t.text)}`; tl.appendChild(li); });
}
function addTask(){
  const text = $('taskText').value.trim(); if(!text) return;
  tasks.push({ id:Date.now(), text, time:$('taskTime').value, cat:$('taskCat').value, done:false });
  saveTasks(); renderTasks(); renderHome();
  $('taskText').value=''; $('taskTime').value=''; $('taskText').focus();
}
function toggleTask(id){
  const t = tasks.find(x=>x.id===id); if(!t) return;
  t.done = !t.done; saveTasks(); renderTasks(); renderHome(); renderDailyAuto();
  if(t.done){
    celebrate();
    const log = store.get('sw_done_log',[]);
    if(!log.some(l=>l.date===dateStr() && l.text===t.text)) log.push({date:dateStr(), text:t.text, cat:t.cat});
    store.set('sw_done_log', log);
  }
}
function editTask(id){
  const t = tasks.find(x=>x.id===id); if(!t) return;
  const nv = prompt('修改任务内容：', t.text);
  if(nv!==null && nv.trim()){ t.text=nv.trim(); saveTasks(); renderTasks(); renderHome(); renderDailyAuto(); }
}
function delTask(id){ if(!confirm('确定删除这条任务？')) return; tasks=tasks.filter(x=>x.id!==id); saveTasks(); renderTasks(); renderHome(); renderDailyAuto(); }
$('taskAdd').addEventListener('click', addTask);
$('taskText').addEventListener('keydown', e=>{ if(e.key==='Enter') addTask(); });

/* =========================================================
   日复盘（自动生成 + 主观补充）
   ========================================================= */
let selectedMood = '';
function setMood(m){ selectedMood=m; document.querySelectorAll('#rvMood button').forEach(b=>b.classList.toggle('on', b.dataset.m===m)); }
document.querySelectorAll('#rvMood button').forEach(b=> b.addEventListener('click', ()=> setMood(b.dataset.m)));
function dailyData(){
  const done = tasks.filter(t=>t.done).map(t=>`${t.text}[${catName[t.cat]}]`);
  const undone = tasks.filter(t=>!t.done).map(t=>t.text);
  const wT = store.get('sw_weight',[]).filter(w=>w.date===dateStr()).map(w=>w.value+'kg');
  const ideasT = store.get('sw_ideas',[]).filter(i=>i.date===dateStr()).length;
  const readT = store.get('sw_read_log',[]).filter(r=>r.date===dateStr()).reduce((s,r)=>s+r.min,0);
  const extra=[]; if(wT.length) extra.push('体重 '+wT.join(',')); if(readT) extra.push('阅读 '+readT+' 分钟'); if(ideasT) extra.push('灵感 '+ideasT+' 条');
  return {done, undone, extra};
}
const autoBlock = (t,b)=>`<div class="auto-sec"><div class="auto-h">${t}</div><div class="auto-b">${b}</div></div>`;
function renderDailyAuto(){
  const d = dailyData();
  $('dailyAuto').innerHTML =
    autoBlock('✅ 今日完成', d.done.length?d.done.map(esc).join('、'):'暂无已完成任务') +
    autoBlock('❌ 未完成', d.undone.length?d.undone.map(esc).join('、'):'🎉 全部完成啦！') +
    autoBlock('📊 今日其他记录', d.extra.length?d.extra.join('；'):'暂无其他记录');
}
function dailySummaryText(){ const d=dailyData(); return `完成：${d.done.join('、')||'无'}\n未完成：${d.undone.join('、')||'无'}\n其他：${d.extra.join('；')||'无'}`; }
function loadDaily(hd){
  const t = hd || dateStr();
  const all = store.get('sw_daily',{}); const r = all[t] || {};
  $('rvHappy').value = r.happy||''; $('rvTomorrow').value = r.tomorrow||''; setMood(r.mood||'');
  $('reviewDate').textContent = t;
  if(hd && r.summary) $('dailyAuto').innerHTML = `<div class="rec-view">📌 保存于 ${new Date(r.savedAt).toLocaleString('zh-CN')}<br>${esc(r.summary).replace(/\n/g,'<br>')}</div>`;
  else renderDailyAuto();
  const dates = Object.keys(all).sort().reverse();
  let h = dates.length? `已保存 ${dates.length} 篇日复盘：` : '还没有保存的日复盘，写第一篇吧～';
  h += dates.map(d=>`<button class="hist-chip" data-d="${d}">${d.slice(5)}</button>`).join('');
  if(hd) h += `<button class="hist-chip back" data-back="1">↩ 返回今日</button>`;
  $('rvHistory').innerHTML = h;
  $('rvHistory').querySelectorAll('.hist-chip').forEach(b=> b.onclick = ()=> b.dataset.back? loadDaily() : loadDaily(b.dataset.d));
}
$('rvSave').addEventListener('click', ()=>{
  const all = store.get('sw_daily',{});
  all[dateStr()] = { happy:$('rvHappy').value, tomorrow:$('rvTomorrow').value, mood:selectedMood, summary:dailySummaryText(), savedAt:Date.now() };
  store.set('sw_daily', all); loadDaily(); toast('✅ 今日复盘已保存');
});

/* =========================================================
   周复盘（自动生成 + 主观补充）
   ========================================================= */
function weeklyData(){
  const wk = weekStr();
  const doneWk = store.get('sw_done_log',[]).filter(d=>weekOf(d.date)===wk);
  const ideasWk = store.get('sw_ideas',[]).filter(i=>weekOf(i.date)===wk);
  const readWk = store.get('sw_read_log',[]).filter(r=>weekOf(r.date)===wk);
  const wWk = store.get('sw_weight',[]).filter(w=>weekOf(w.date)===wk).sort((a,b)=>a.date.localeCompare(b.date));
  const accts = store.get('sw_accounts',[]);
  return {doneWk, ideasWk, readWk, wWk, accts};
}
function renderWeeklyAuto(){
  const d = weeklyData();
  const acc = d.accts.length? d.accts.map(a=>`· ${esc(a.name)}：${fmtFans(a.fans)}粉 · 月增${a.monthAdd}`).join('<br>') : '暂无账号';
  const wchg = d.wWk.length>=2? `${(d.wWk[d.wWk.length-1].value - d.wWk[0].value).toFixed(1)} kg（${d.wWk[0].value}→${d.wWk[d.wWk.length-1].value}）` : '本周体重记录不足';
  let h = '';
  h += autoBlock('🎯 本周完成任务', d.doneWk.length? `${d.doneWk.length} 项 · `+d.doneWk.slice(0,5).map(x=>esc(x.text)).join('、') : '暂无完成任务记录');
  h += autoBlock('📱 六个账号', acc);
  h += autoBlock('📖 本周阅读', d.readWk.length? `共 ${d.readWk.reduce((s,r)=>s+r.min,0)} 分钟` : '暂无阅读记录');
  h += autoBlock('⚖️ 体重变化', wchg);
  h += autoBlock('💡 本周灵感', d.ideasWk.length? `${d.ideasWk.length} 条` : '0 条');
  $('weeklyAuto').innerHTML = h;
}
function weeklySummaryText(){
  const d = weeklyData();
  return `完成：${d.doneWk.length}项\n账号：${d.accts.map(a=>a.name+fmtFans(a.fans)).join('、')}\n阅读：${d.readWk.reduce((s,r)=>s+r.min,0)}分\n灵感：${d.ideasWk.length}条`;
}
function loadWeekly(hd){
  const w = hd || weekStr();
  const all = store.get('sw_weekly',{}); const r = all[w] || {};
  ['wkGoal','wkGood','wkImprove','wkNext','wkState'].forEach(id=> $(id).value = r[id.replace('wk','').toLowerCase()]||'');
  $('weekLabel').textContent = w;
  if(hd && r.summary) $('weeklyAuto').innerHTML = `<div class="rec-view">📌 保存于 ${new Date(r.savedAt).toLocaleString('zh-CN')}<br>${esc(r.summary).replace(/\n/g,'<br>')}</div>`;
  else renderWeeklyAuto();
  const dates = Object.keys(all).sort().reverse();
  let h = dates.length? `已保存 ${dates.length} 篇周复盘：` : '还没有保存的周复盘，这周写第一篇吧～';
  h += dates.map(d=>`<button class="hist-chip" data-d="${d}">${d.slice(5)}</button>`).join('');
  if(hd) h += `<button class="hist-chip back" data-back="1">↩ 返回本周</button>`;
  $('wkHistory').innerHTML = h;
  $('wkHistory').querySelectorAll('.hist-chip').forEach(b=> b.onclick = ()=> b.dataset.back? loadWeekly() : loadWeekly(b.dataset.d));
}
$('wkSave').addEventListener('click', ()=>{
  const all = store.get('sw_weekly',{});
  all[weekStr()] = { goal:$('wkGoal').value, good:$('wkGood').value, improve:$('wkImprove').value, next:$('wkNext').value, state:$('wkState').value, summary:weeklySummaryText(), savedAt:Date.now() };
  store.set('sw_weekly', all); loadWeekly(); toast('✅ 本周复盘已保存');
});

/* =========================================================
   我的账号（可编辑）
   ========================================================= */
const KANBAN_COLS = [
  {k:'idea',t:'💡 灵感池',c:'yellow'},{k:'script',t:'✍️ 待写脚本',c:'blue'},
  {k:'shoot',t:'🎥 待拍摄',c:'pink'},{k:'edit',t:'✂️ 待剪辑',c:'orange'},
  {k:'post',t:'📤 待发布',c:'purple'},{k:'done',t:'✅ 已发布',c:'mint'}
];
function renderAccounts(){
  let accts = store.get('sw_accounts',[]);
  $('acctCount').textContent = accts.length;
  const box = $('acctList'); box.innerHTML='';
  accts.forEach(a=>{
    const el = document.createElement('div');
    el.className='card acct'; el.style.setProperty('--ac', `var(--${a.color})`);
    el.innerHTML = `
      <div class="acct-top">
        <select class="acct-plat inline-sel">
          <option value="xhs" ${a.platform==='xhs'?'selected':''}>小红书</option>
          <option value="dy" ${a.platform==='dy'?'selected':''}>抖音</option>
        </select>
        <select class="acct-emoji inline-sel">
          ${['🐾','🎬','🛍️','🎙️','📹','📱','🍰','💡'].map(e=>`<option ${e===a.emoji?'selected':''}>${e}</option>`).join('')}
        </select>
        <button class="t-del" title="删除账号">✕</button>
      </div>
      <input class="acct-name inline-edit" value="${esc(a.name)}" />
      <div class="acct-fans"><input class="inline-num acct-fans-input" type="number" value="${a.fans}" /><small>粉</small></div>
      <div class="acct-meta">
        月增 <input class="inline-num sm" type="number" data-f="monthAdd" value="${a.monthAdd}"/> ·
        发 <input class="inline-num sm" type="number" data-f="posts" value="${a.posts}"/> ·
        待发 <input class="inline-num sm" type="number" data-f="pending" value="${a.pending}"/>
      </div>`;
    el.querySelector('.acct-plat').addEventListener('change', e=>{ a.platform=e.target.value; saveAccounts(accts); renderAccounts(); renderHome(); });
    el.querySelector('.acct-emoji').addEventListener('change', e=>{ a.emoji=e.target.value; saveAccounts(accts); renderAccounts(); });
    el.querySelector('.acct-name').addEventListener('change', e=>{ a.name=e.target.value; saveAccounts(accts); renderHome(); });
    el.querySelector('.acct-fans-input').addEventListener('change', e=>{ a.fans=+e.target.value||0; saveAccounts(accts); renderHome(); });
    el.querySelectorAll('.acct-meta .inline-num').forEach(inp=> inp.addEventListener('change', e=>{ a[inp.dataset.f]=+e.target.value||0; saveAccounts(accts); renderHome(); }));
    el.querySelector('.t-del').addEventListener('click', ()=>{ if(confirm('删除该账号？')){ accts=accts.filter(x=>x.id!==a.id); saveAccounts(accts); renderAccounts(); renderHome(); }});
    box.appendChild(el);
  });
}
const saveAccounts = accts => store.set('sw_accounts', accts);
$('acctAdd').addEventListener('click', ()=>{
  let accts = store.get('sw_accounts',[]);
  const id = Date.now();
  accts.push({id, platform:'xhs', name:'新账号', emoji:'📱', color:ACC_COLORS[accts.length%ACC_COLORS.length], fans:0, monthAdd:0, posts:0, pending:0});
  saveAccounts(accts); renderAccounts(); renderHome();
});
function renderKanban(){
  const kb = store.get('sw_kanban',[]);
  const box = $('kanban'); box.innerHTML='';
  KANBAN_COLS.forEach(col=>{
    const cards = kb.filter(c=>c.col===col.k);
    const colEl = document.createElement('div'); colEl.className='kb-col';
    colEl.innerHTML = `<div class="kb-h" style="--kc:var(--${col.c})">${col.t}</div>` +
      cards.map((c,i)=>`<div class="kb-card">${esc(c.text)}<button class="kb-del" data-i="${kb.indexOf(c)}">✕</button></div>`).join('') +
      `<input class="kb-add" placeholder="＋ 加一张卡片" data-col="${col.k}" />`;
    colEl.querySelectorAll('.kb-del').forEach(b=> b.addEventListener('click', ()=>{ const arr=store.get('sw_kanban',[]); arr.splice(+b.dataset.i,1); store.set('sw_kanban',arr); renderKanban(); }));
    colEl.querySelector('.kb-add').addEventListener('keydown', e=>{ if(e.key==='Enter' && e.target.value.trim()){ const arr=store.get('sw_kanban',[]); arr.push({col:col.k, text:e.target.value.trim()}); store.set('sw_kanban',arr); renderKanban(); }});
    box.appendChild(colEl);
  });
}
$('hitNote').value = store.get('sw_hitnote','');
$('hitNote').addEventListener('change', e=> store.set('sw_hitnote', e.target.value));

/* =========================================================
   灵感记录（可编辑）
   ========================================================= */
const IDEA_COLORS = ['yellow','pink','blue','purple'];
function renderIdeas(){
  let ideas = store.get('sw_ideas',[]).slice().sort((a,b)=> b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  const box = $('ideaList'); box.innerHTML='';
  ideas.forEach(idea=>{
    const el = document.createElement('div'); el.className='card idea-card';
    el.style.setProperty('--ic', `var(--${IDEA_COLORS[ideas.indexOf(idea)%IDEA_COLORS.length]})`);
    el.innerHTML = `
      <div class="idea-top"><span class="idea-tag">${esc(idea.tag)}</span><button class="t-del" title="删除">✕</button></div>
      <textarea class="idea-text inline-edit" rows="2">${esc(idea.text)}</textarea>
      <div class="idea-foot">🕒 ${idea.date} ${idea.time} · 状态
        <select class="idea-status inline-sel">
          ${['值得尝试','已加入计划','进行中','已完成'].map(s=>`<option ${s===idea.status?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>`;
    el.querySelector('.idea-text').addEventListener('change', e=>{ idea.text=e.target.value; saveIdeas(ideas); });
    el.querySelector('.idea-status').addEventListener('change', e=>{ idea.status=e.target.value; saveIdeas(ideas); });
    el.querySelector('.t-del').addEventListener('click', ()=>{ if(confirm('删除这条灵感？')){ ideas=ideas.filter(x=>x.id!==idea.id); saveIdeas(ideas); renderIdeas(); renderHome(); renderDailyAuto(); renderWeeklyAuto(); }});
    box.appendChild(el);
  });
}
const saveIdeas = ideas => store.set('sw_ideas', ideas);
function addIdea(){
  const v = $('ideaInput').value.trim(); if(!v) return;
  let ideas = store.get('sw_ideas',[]);
  ideas.push({ id:Date.now(), tag:$('ideaTag').value, text:v, date:dateStr(), time:`${pad(now.getHours())}:${pad(now.getMinutes())}`, status:'值得尝试' });
  saveIdeas(ideas); renderIdeas(); renderHome(); renderDailyAuto(); renderWeeklyAuto();
  $('ideaInput').value='';
}
$('ideaAdd').addEventListener('click', addIdea);
$('ideaInput').addEventListener('keydown', e=>{ if(e.key==='Enter') addIdea(); });

/* =========================================================
   减肥记录（可编辑）
   ========================================================= */
function renderFit(){
  const ws = store.get('sw_weight',[]).slice().sort((a,b)=>a.date.localeCompare(b.date));
  const fit = store.get('sw_fit',{});
  const cur = ws.length? ws[ws.length-1].value : null;
  $('fitBig').innerHTML = (cur!=null? cur.toFixed(1):'--') + '<small>kg</small>';
  if(cur!=null && fit.start){ const d=(cur-fit.start); $('fitDelta').textContent = (d<=0?'▼ 已减 ':'▲ 已增 ') + Math.abs(d).toFixed(1) + 'kg'; $('fitDelta').className = 'muted '+(d<=0?'down':'up'); }
  else $('fitDelta').textContent='';
  $('fitGoal').value = fit.goal ?? ''; $('fitStart').value = fit.start ?? '';
  const prog = (cur!=null && fit.start && fit.goal && fit.start>fit.goal)? Math.max(0,Math.min(100, Math.round((fit.start-cur)/(fit.start-fit.goal)*100))) : 0;
  $('fitRing').style.setProperty('--p', prog); $('fitRing').querySelector('b').textContent = prog+'%';
  renderFitChart(ws);
  const log = $('weightLog'); log.innerHTML='';
  ws.slice().reverse().slice(0,8).forEach(w=>{ const r=document.createElement('div'); r.className='log-row'; r.innerHTML=`<span>${w.date}</span><b>${w.value.toFixed(1)}kg</b><button class="t-del sm" title="删除">✕</button>`; r.querySelector('.t-del').addEventListener('click', ()=>{ const arr=store.get('sw_weight',[]); store.set('sw_weight', arr.filter(x=>x.id!==w.id)); renderFit(); renderWeeklyAuto(); }); log.appendChild(r); });
  const ach = $('achList'); ach.innerHTML='';
  (fit.achievements||[]).forEach((a,i)=>{ const c=document.createElement('span'); c.className='tag-edit'; c.innerHTML=`${esc(a)} <button class="kb-del" data-i="${i}">✕</button>`; c.querySelector('button').addEventListener('click', ()=>{ const f=store.get('sw_fit',{}); f.achievements=f.achievements.filter((_,j)=>j!==i); store.set('sw_fit',f); renderFit(); }); ach.appendChild(c); });
}
function renderFitChart(ws){
  const svg = $('fitChart');
  if(ws.length<2){ svg.innerHTML='<text x="160" y="64" text-anchor="middle" fill="#b3a6b8" font-size="12">记录 2 条以上体重后显示趋势</text>'; return; }
  const vals = ws.map(w=>w.value), min=Math.min(...vals), max=Math.max(...vals), span=(max-min)||1;
  const W=320,H=120,p=12;
  const pts = ws.map((w,i)=>[ p+(W-2*p)*(i/(ws.length-1)), p+(H-2*p)*(1-(w.value-min)/span) ]);
  const line = pts.map(x=>x.map(n=>n.toFixed(1)).join(',')).join(' ');
  const dots = pts.map(x=>`<circle class="dot" cx="${x[0].toFixed(1)}" cy="${x[1].toFixed(1)}" r="3"/>`).join('');
  svg.innerHTML = `<polyline class="grid-line" points="0,30 320,30"/><polyline class="grid-line" points="0,70 320,70"/><polyline class="line" points="${line}"/>${dots}`;
}
$('weightAdd').addEventListener('click', ()=>{
  const v = parseFloat($('weightInput').value);
  if(!isNaN(v)){ const arr=store.get('sw_weight',[]); arr.push({id:Date.now(), date:dateStr(), value:v}); store.set('sw_weight', arr); $('weightInput').value=''; renderFit(); renderHome(); renderDailyAuto(); renderWeeklyAuto(); }
});
$('fitGoal').addEventListener('change', e=>{ const f=store.get('sw_fit',{}); f.goal=+e.target.value||0; store.set('sw_fit',f); renderFit(); });
$('fitStart').addEventListener('change', e=>{ const f=store.get('sw_fit',{}); f.start=+e.target.value||0; store.set('sw_fit',f); renderFit(); });
$('achAdd').addEventListener('click', ()=>{ const t=prompt('添加一条非体重成就：'); if(t&&t.trim()){ const f=store.get('sw_fit',{}); f.achievements=f.achievements||[]; f.achievements.push(t.trim()); store.set('sw_fit',f); renderFit(); }});

/* =========================================================
   每日阅读（可编辑）
   ========================================================= */
function renderRead(){
  const today = store.get('sw_read_today',0), goal = store.get('sw_read_goal',30), streak = store.get('sw_read_streak',0);
  $('readBig').innerHTML = today + '<small>分</small>';
  $('readStreak').innerHTML = streak + '<small>天</small>';
  $('readGoal').value = goal;
  const p = goal? Math.min(100, Math.round(today/goal*100)) : 0;
  $('readRing').style.setProperty('--p', p); $('readRing').querySelector('b').textContent = p+'%';
  const books = store.get('sw_books',[]);
  const box = $('bookList'); box.innerHTML='';
  books.forEach((b,i)=>{
    const c = ACC_COLORS[i%ACC_COLORS.length];
    const el = document.createElement('div'); el.className='book'; el.style.setProperty('--bc', `var(--${c})`);
    el.innerHTML = `
      <div class="book-top"><input class="inline-edit book-name" value="${esc(b.name)}"/><button class="t-del" title="删除">✕</button></div>
      <div class="skill-row"><span>进度</span><b class="bp">${b.progress}%</b></div>
      <input type="range" min="0" max="100" value="${b.progress}" class="book-prog" style="--pc:var(--${c})"/>
      <input class="inline-edit book-quote" value="${esc(b.quote||'')}" placeholder="今日金句"/>`;
    el.querySelector('.book-name').addEventListener('change', e=>{ b.name=e.target.value; saveBooks(books); });
    el.querySelector('.book-quote').addEventListener('change', e=>{ b.quote=e.target.value; saveBooks(books); });
    el.querySelector('.book-prog').addEventListener('input', e=>{ b.progress=+e.target.value; el.querySelector('.bp').textContent=b.progress+'%'; saveBooks(books); });
    el.querySelector('.t-del').addEventListener('click', ()=>{ if(confirm('删除这本书？')){ const arr=store.get('sw_books',[]); store.set('sw_books', arr.filter(x=>x.id!==b.id)); renderRead(); }});
    box.appendChild(el);
  });
}
const saveBooks = arr => store.set('sw_books', arr);
$('readAdd').addEventListener('click', ()=>{
  const v = parseInt($('readToday').value); if(isNaN(v)) return;
  store.set('sw_read_today', v);
  const log = store.get('sw_read_log',[]); const ex = log.find(r=>r.date===dateStr());
  if(ex) ex.min=v; else log.push({date:dateStr(), min:v});
  store.set('sw_read_log', log);
  $('readToday').value=''; renderRead(); renderHome(); renderDailyAuto(); renderWeeklyAuto();
});
$('readGoal').addEventListener('change', e=>{ store.set('sw_read_goal', +e.target.value||30); renderRead(); });
$('readStreak').addEventListener('click', ()=>{ const v=prompt('连续阅读天数：', store.get('sw_read_streak',0)); if(v!==null){ store.set('sw_read_streak', +v||0); renderRead(); renderHome(); }});
$('bookAdd').addEventListener('click', ()=>{ const arr=store.get('sw_books',[]); arr.push({id:Date.now(), name:'新书', progress:0, quote:''}); store.set('sw_books', arr); renderRead(); });

/* =========================================================
   新技能学习（可编辑）
   ========================================================= */
function renderSkill(){
  const skills = store.get('sw_skills',[]);
  const box = $('skillList'); box.innerHTML='';
  skills.forEach((s,i)=>{
    const c = ACC_COLORS[i%ACC_COLORS.length];
    const el = document.createElement('div'); el.className='skill-item';
    el.innerHTML = `
      <div class="skill-row"><input class="inline-edit skill-name" value="${esc(s.name)}"/><b class="sp">${s.progress}%</b><button class="t-del" title="删除">✕</button></div>
      <div class="progress"><i style="width:${s.progress}%;--pc:var(--${c})"></i></div>
      <input type="range" min="0" max="100" value="${s.progress}" class="skill-prog" style="--pc:var(--${c})"/>`;
    el.querySelector('.skill-name').addEventListener('change', e=>{ s.name=e.target.value; saveSkills(skills); });
    el.querySelector('.skill-prog').addEventListener('input', e=>{ s.progress=+e.target.value; el.querySelector('.sp').textContent=s.progress+'%'; el.querySelector('.progress i').style.width=s.progress+'%'; saveSkills(skills); renderHome(); });
    el.querySelector('.t-del').addEventListener('click', ()=>{ if(confirm('删除该技能？')){ const arr=store.get('sw_skills',[]); store.set('sw_skills', arr.filter(x=>x.id!==s.id)); renderSkill(); renderHome(); }});
    box.appendChild(el);
  });
  const tl = $('skillTaskList'); tl.innerHTML='';
  store.get('sw_skill_tasks',[]).forEach((t,i)=>{
    const c=document.createElement('span'); c.className='tag-edit'; c.innerHTML=`${esc(t)} <button class="kb-del" data-i="${i}">✕</button>`;
    c.querySelector('button').addEventListener('click', ()=>{ const arr=store.get('sw_skill_tasks',[]); store.set('sw_skill_tasks', arr.filter((_,j)=>j!==i)); renderSkill(); });
    tl.appendChild(c);
  });
}
const saveSkills = arr => store.set('sw_skills', arr);
$('skillAdd').addEventListener('click', ()=>{ const arr=store.get('sw_skills',[]); arr.push({id:Date.now(), name:'新技能', progress:0}); store.set('sw_skills', arr); renderSkill(); renderHome(); });
$('skillTaskAdd').addEventListener('click', ()=>{ const t=prompt('添加今日学习任务：'); if(t&&t.trim()){ const arr=store.get('sw_skill_tasks',[]); arr.push(t.trim()); store.set('sw_skill_tasks', arr); renderSkill(); }});

/* =========================================================
   首页（动态）
   ========================================================= */
function renderHome(){
  const rings = $('homeRings');
  const done = tasks.filter(t=>t.done).length, total = tasks.length;
  const goal = store.get('sw_read_goal',30), today = store.get('sw_read_today',0);
  const skills = store.get('sw_skills',[]);
  const avg = skills.length? Math.round(skills.reduce((s,x)=>s+x.progress,0)/skills.length):0;
  const ideasT = store.get('sw_ideas',[]).filter(i=>i.date===dateStr()).length;
  const streak = store.get('sw_read_streak',0);
  const data = [
    {c:'var(--blue)', l:'计划', v: total? Math.round(done/total*100):0, t:`${done}/${total}`},
    {c:'var(--purple)', l:'阅读', v: goal? Math.min(100,Math.round(today/goal*100)):0, t:`${today}′`},
    {c:'var(--orange)', l:'学习', v: avg, t:`${avg}%`},
    {c:'var(--yellow)', l:'灵感', v: Math.min(100,ideasT*25), t:`${ideasT}条`},
    {c:'var(--mint)', l:'打卡', v: Math.min(100,streak), t:`${streak}天`},
  ];
  rings.innerHTML = data.map(d=>`<div class="ring" style="--p:${d.v};--c:${d.c}"><span>${d.l}</span><b>${d.t}</b></div>`).join('');
  $('homeStreak').innerHTML = `${streak}<span>天</span>`;
  $('homeStreakSub').textContent = '📖 阅读打卡';
  const rem = store.get('sw_accounts',[]).filter(a=>a.pending>0);
  $('homeRemind').innerHTML = rem.length? rem.map(a=>`<div class="remind-row"><span class="badge ${a.platform}">${a.platform==='xhs'?'小红书':'抖音'}</span>${esc(a.name)} · ${a.pending} 条待发布</div>`).join('') : '<div class="muted small">所有账号都已发布，棒棒哒 🎉</div>';
}

/* =========================================================
   初始化
   ========================================================= */
seedIfEmpty();
renderTasks(); renderAccounts(); renderKanban(); renderIdeas(); renderFit(); renderRead(); renderSkill();
renderHome(); renderDailyAuto(); renderWeeklyAuto(); loadDaily(); loadWeekly();
