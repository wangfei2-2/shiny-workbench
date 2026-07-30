// ===== 日期 =====
const now = new Date();
const wk = ['周日','周一','周二','周三','周四','周五','周六'][now.getDay()];
document.getElementById('todayDate').textContent = `${now.getMonth()+1}月${now.getDate()}日 ${wk}`;

// ===== 登录 =====
document.getElementById('loginBtn').addEventListener('click', ()=>{
  document.getElementById('login').classList.add('hidden');
});

// ===== 标题映射 =====
const titles = {
  home:'今日概览', plan:'每日计划', accounts:'我的账号', idea:'灵感记录',
  fit:'减肥记录', read:'每日阅读', skill:'新技能学习'
};
const content = document.querySelector('.content');

// ===== 统一切换 =====
function switchTo(t){
  document.querySelectorAll('.nav-item[data-target]').forEach(b=>b.classList.toggle('active', b.dataset.target===t));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.id===t));
  document.querySelectorAll('.bottom-nav .bn[data-target]').forEach(b=>b.classList.toggle('active', b.dataset.target===t));
  document.getElementById('topTitle').textContent = titles[t] || '';
  content.scrollTop = 0;
  closeDrawer();
}
document.querySelectorAll('[data-target]').forEach(el=>{
  el.addEventListener('click', ()=> switchTo(el.dataset.target));
});

// ===== 左侧收起 =====
document.getElementById('collapse').addEventListener('click', ()=>{
  document.getElementById('sidebar').classList.toggle('collapsed');
});

// ===== 移动端抽屉 =====
const sidebar = document.getElementById('sidebar');
const scrim = document.getElementById('scrim');
function openDrawer(){ sidebar.classList.add('open'); scrim.classList.add('show'); }
function closeDrawer(){ sidebar.classList.remove('open'); scrim.classList.remove('show'); }
document.getElementById('hamburger').addEventListener('click', ()=> sidebar.classList.contains('open')?closeDrawer():openDrawer());
document.getElementById('moreBtn').addEventListener('click', openDrawer);
scrim.addEventListener('click', closeDrawer);
document.getElementById('fab').addEventListener('click', ()=> switchTo('home'));

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

// ===== 待办计数 + 撒花 =====
function bindTodo(listId, countId){
  const list = document.getElementById(listId);
  const count = document.getElementById(countId);
  if(!list) return;
  function update(){
    const items = list.querySelectorAll('input');
    const done = [...items].filter(i=>i.checked).length;
    if(count) count.textContent = `${done}/${items.length}`;
  }
  list.addEventListener('change', e=>{
    update();
    if(e.target.checked) celebrate();
  });
  update();
}
bindTodo('homeTodoList','homeTodo');
bindTodo('todoList','todoCount');

// ===== 灵感速记 =====
const ideaInput = document.getElementById('ideaInput');
const ideaGrid = document.querySelector('#idea .grid');
const tags = ['宠物选题','工作VLOG','卖货内容','个人口播','生活记录'];
function addIdea(){
  const v = ideaInput.value.trim(); if(!v) return;
  const card = document.createElement('div');
  card.className = 'card idea-card';
  const colors = ['var(--yellow)','var(--pink)','var(--blue)','var(--purple)'];
  card.style.setProperty('--ic', colors[Math.floor(Math.random()*colors.length)]);
  const tag = tags[Math.floor(Math.random()*tags.length)];
  const time = `${now.getMonth()+1}月${now.getDate()}日 ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  card.innerHTML = `<span class="idea-tag">${tag}</span><div>${v.replace(/</g,'&lt;')}</div><div class="idea-foot">🕒 ${time} · 状态：刚刚想到</div>`;
  ideaGrid.insertBefore(card, ideaGrid.children[1]);
  ideaInput.value = '';
}
document.getElementById('ideaAdd').addEventListener('click', addIdea);
ideaInput.addEventListener('keydown', e=>{ if(e.key==='Enter') addIdea(); });

// ===== 体重记录 =====
const weightInput = document.getElementById('weightInput');
const fitBig = document.getElementById('fitBig');
document.getElementById('weightAdd').addEventListener('click', ()=>{
  const v = parseFloat(weightInput.value);
  if(!isNaN(v)){ fitBig.innerHTML = `${v.toFixed(1)} <small>kg</small>`; weightInput.value=''; }
});

// ===== 桌面小伙伴鼓励 =====
const cheers = ['今天也要闪闪发光！','完成一件事就很棒啦 🌟','喝口水，慢慢来~','你比昨天的自己更厉害 💪','记得对小猫说声辛苦啦 🐱'];
document.getElementById('mascot').addEventListener('click', ()=>{
  document.getElementById('mascotBubble').textContent = cheers[Math.floor(Math.random()*cheers.length)];
});
