
export function startHub(ctx){
'use strict';
if(window.__hubStarted)return;window.__hubStarted=true;
const sb=ctx.supabase;
const TODAY=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'});
const CUR_YM=TODAY.slice(0,7);
const MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const MS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const $=(s,e)=>(e||document).querySelector(s);
const $$=(s,e)=>Array.prototype.slice.call((e||document).querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
const pd=s=>{const a=s.split('-').map(Number);return Date.UTC(a[0],a[1]-1,a[2])};
const dd=s=>{const x=new Date(pd(s));return x.getUTCDate()+' '+MS[x.getUTCMonth()]};
const dw=s=>DOW[new Date(pd(s)).getUTCDay()];
const diff=(a,b)=>Math.round((pd(b)-pd(a))/864e5);
const addDays=(s,n)=>new Date(pd(s)+n*864e5).toISOString().slice(0,10);
const addMonth=s=>{const a=s.split('-').map(Number);const last=new Date(Date.UTC(a[0],a[1]+1,0)).getUTCDate();return new Date(Date.UTC(a[0],a[1],Math.min(a[2],last))).toISOString().slice(0,10)};
const ymName=ym=>{const a=ym.split('-');return MN[+a[1]-1]+' '+a[0]};
const nextYm=ym=>addMonth(ym+'-01').slice(0,7);
const hm=s=>{const m=Math.round(s/60);return Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'m'};
const clock=s=>{s=Math.floor(s);return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(n=>String(n).padStart(2,'0')).join(':')};
const hrs=s=>(s/3600).toFixed(1);
const nowS=()=>{const d=new Date();let h=d.getHours();const m=String(d.getMinutes()).padStart(2,'0');const ap=h>=12?'pm':'am';h=h%12||12;return d.getDate()+' '+MS[d.getMonth()]+', '+h+':'+m+' '+ap};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const nowT=()=>{const d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};

const P=d=>'<path d="'+d+'"/>';
const IC={
 grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
 tasks:P('M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h9'),
 board:'<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="4" height="8" rx="1"/>',
 list:P('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'),
 chat:P('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'),
 video:'<rect x="2" y="5" width="14" height="14" rx="2"/>'+P('M22 8l-6 4 6 4z'),
 clock:'<circle cx="12" cy="12" r="9"/>'+P('M12 7v5l3 2'),
 users:'<circle cx="9" cy="8" r="4"/>'+P('M2 21v-1a6 6 0 0 1 12 0v1M17 4a4 4 0 0 1 0 8M22 21v-1a6 6 0 0 0-4-5.6'),
 plus:P('M12 5v14M5 12h14'),
 play:P('M6 4l14 8-14 8z'),
 stop:'<rect x="6" y="6" width="12" height="12" rx="1"/>',
 clip:P('M21 12.5l-8.5 8.5a5 5 0 0 1-7-7L14 5.5a3.5 3.5 0 0 1 5 5L10.5 19a2 2 0 0 1-3-3L15 8.5'),
 send:P('M22 2L11 13M22 2l-7 20-4-9-9-4z'),
 x:P('M18 6L6 18M6 6l12 12'),
 link:P('M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1'),
 moon:P('M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'),
 check:P('M20 6L9 17l-5-5'),
 mic:'<rect x="9" y="2" width="6" height="12" rx="3"/>'+P('M5 11a7 7 0 0 0 14 0M12 18v4'),
 bell:P('M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0'),
 upload:P('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12'),
 back:P('M15 18l-6-6 6-6'),
 ext:P('M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3'),
 sub:P('M5 4v8a3 3 0 0 0 3 3h10M14 11l4 4-4 4'),
 file:P('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6'),
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 logout:P('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9'),
 trash:P('M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6'),
 edit:P('M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'),
 down:P('M12 3v12M7 10l5 5 5-5M5 21h14'),
 key:'<rect x="2" y="6" width="20" height="12" rx="2"/>'+P('M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10'),
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/>'+P('M3 7l9 6 9-6')
};
const ic=(n,s)=>'<svg class="ic" width="'+(s||16)+'" height="'+(s||16)+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IC[n]+'</svg>';

const ST=[{k:'todo',n:'To Do'},{k:'progress',n:'In Progress'},{k:'review',n:'Review Required'},{k:'changes',n:'Changes Required'},{k:'approved',n:'Approved'},{k:'completed',n:'Completed'},{k:'hold',n:'On Hold'},{k:'cancelled',n:'Cancelled'}];
const CLOSED=['completed','cancelled'];
const stN=k=>ST.find(s=>s.k===k).n;
const PRI=['urgent','high','medium','low'];
const ROLES={admin:'Admin',manager:'Manager',reviewer:'Reviewer',member:'Team Member',external:'External'};
const stPill=k=>'<span class="pill st-'+k+'">'+stN(k)+'</span>';
const priTag=p=>'<span class="pri pri-'+p+'"><i></i>'+cap(p)+'</span>';

/* ---------- data (loaded from Supabase) ---------- */
const D=ctx.data;
const hueOf=k=>{let h=0;for(let i=0;i<k.length;i++)h=(h*31+k.charCodeAt(i))>>>0;return h%360};
const users=[];
let spaces=[],folders=[],tasks=[],entries=[],lib=[],channels=[],messages=[],campaigns=[];
const timers={};
let tn=100;
function T(sp,ym,title,st,pri,as,rv,s,d,x){
  const t=Object.assign({id:'',n:++tn,sp:sp,fo:sp+'-'+ym,title:title,st:st,pri:pri,as:Array.isArray(as)?as:(as?[as]:[]),rv:rv||'',start:s,due:d,brief:'',tags:[],subs:[],check:[],files:[],drive:'',vlinks:[],fields:{},comments:[],log:[],est:0,rev:0,recurring:false,done:'',camp:'',by:ctx.meId,created:new Date().toISOString()},x||{});
  t.id='t'+uid();return t;
}
const tByN=n=>tasks.find(t=>t.n===n);
const M=(ch,u,t,tx,x)=>Object.assign({id:'m'+uid(),ch:ch,u:u,t:t,at:new Date().toISOString(),tx:tx,media:null,react:{},pin:false,reply:null},x||{});

/* ---------- state ---------- */
const S={seen:{},me:ctx.meId,view:'dashboard',sp:'all',fo:'all',layout:'board',q:'',fa:'all',fp:'all',dsp:'all',dpe:'all',rm:CUR_YM,rby:'person',ch:'c-all',reply:null,drawer:null,tab:'comments',pend:null,draft:{},chatDraft:'',ls:'all',lst:'all',timer:null,bell:false,chatOpen:false,typing:null,flags:{wa:false,drive:true,yt:false,cal:false},invites:[],uploading:{},cst:'all',user:false,rec:null};
const me=()=>users.find(u=>u.id===S.me)||{id:S.me,name:ctx.meName||'Me',title:'',role:ctx.meRole||'member',hue:hueOf(S.me),sp:'all'};
const uById=id=>users.find(u=>u.id===id)||{id:id,name:'Former member',hue:0,role:'member',sp:'all'};
const activeUsers=()=>users.filter(u=>u.active!==false);
const spById=id=>spaces.find(s=>s.id===id)||{id:id,name:'Deleted space',short:'Deleted',color:'#8AA59C'};
const tById=id=>tasks.find(t=>t.id===id);
const first=u=>String(u.name||'').split(' ')[0];
function can(a,t){const r=me().role;
  if(a==='approve')return r==='admin'||r==='manager'||r==='reviewer';
  if(a==='create'||a==='edit'||a==='chat'||a==='reports')return r!=='external';
  if(a==='manage')return r==='admin'||r==='manager';
  if(a==='work')return r!=='external'||(t&&t.as.includes(S.me));
  return false}
function visSpaces(){const u=me();return u.sp==='all'||!Array.isArray(u.sp)?spaces:spaces.filter(s=>u.sp.includes(s.id))}
function visTasks(){const ids=visSpaces().map(s=>s.id);let ts=tasks.filter(t=>ids.includes(t.sp));if(me().role==='external')ts=ts.filter(t=>t.as.includes(S.me));return ts}
const isOver=t=>t.due<TODAY&&t.st!=='approved'&&!CLOSED.includes(t.st);
const taskSecs=id=>entries.filter(e=>e.tid===id&&entVis(e)).reduce((a,e)=>a+e.secs,0);
const entVis=e=>me().role!=='external'||e.uid===S.me;
const elapsed=()=>S.timer?(Date.now()-S.timer.start)/1000:0;
const av=(u,lg)=>'<span class="av'+(lg?' lg':'')+(u.role==='external'?' ext':'')+'" style="--h:'+u.hue+'" title="'+esc(u.name)+'">'+esc(String(u.name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join(''))+'</span>';
const avs=ids=>'<span class="avs">'+ids.map(i=>av(uById(i))).join('')+'</span>';
const fmtText=s=>esc(s).replace(/@([A-Za-z]+)/g,(m,n)=>users.some(u=>first(u).toLowerCase()===n.toLowerCase())?'<span class="mention">'+m+'</span>':m);
const host=u=>{try{return new URL(u).hostname.replace('www.','')}catch(e){return u}};
const detect=u=>/youtube\.com|youtu\.be/.test(u)?'youtube':/drive\.google/.test(u)?'drive':/docs\.google/.test(u)?'doc':/spotify|podcasts\.apple/.test(u)?'podcast':/vimeo/.test(u)?'vimeo':'other';
const ltName={youtube:'YouTube',drive:'Drive',doc:'Doc',podcast:'Podcast',vimeo:'Vimeo',other:'Link'};
const logA=(t,tx)=>t.log.unshift({u:S.me,tx:tx,at:nowS()});
function toast(m){const d=document.createElement('div');d.className='toast';d.textContent=m;$('#toasts').appendChild(d);setTimeout(()=>d.remove(),3400)}
function deny(m){toast(m);renderDrawer();return false}
const sizeStr=b=>b>1e9?(b/1e9).toFixed(1)+' GB':b>1e6?Math.round(b/1e6)+' MB':Math.max(1,Math.round(b/1e3))+' KB';

/* ---------- sidebar and top ---------- */
function renderSide(){
  const vs=visSpaces(), role=me().role, tv=S.view==='tasks';
  const openCt=id=>visTasks().filter(t=>t.sp===id&&!CLOSED.includes(t.st)).length;
  const nav=(v,label,icon)=>'<button class="nav'+(S.view===v&&!(v==='tasks')?' on':'')+'" data-act="nav" data-v="'+v+'">'+ic(icon,17)+'<span>'+label+'</span></button>';
  let h='<div class="brand">'+(ctx.logo?'<div class="logo img"><img src="'+ctx.logo+'" alt="FinStreet"></div>':'<div class="logo">FS</div>')+'<div><b>FinStreet Marketing</b><span>FinStreet Education · Workspace</span></div></div>';
  h+=nav('dashboard','Dashboard','grid');
  h+='<button class="nav'+(tv&&S.sp==='all'&&S.fa===S.me?' on':'')+'" data-act="mine">'+ic('tasks',17)+'<span>My tasks</span><span class="n">'+visTasks().filter(t=>t.as.includes(S.me)&&!CLOSED.includes(t.st)).length+'</span></button>';
  if(can('chat'))h+=nav('chat','Team chat','chat');
  h+=nav('library','Video library','video');
  if(role!=='external')h+=nav('campaigns','Campaigns','target');
  if(can('reports'))h+=nav('time','Time and reports','clock');
  if(role!=='external')h+=nav('team','Team and access','users');
  h+='<h4>Spaces'+(can('manage')?'<button data-act="newSpace" aria-label="New space" title="New space">'+ic('plus',15)+'</button>':'')+'</h4>';
  h+='<button class="sp'+(tv&&S.sp==='all'&&S.fa==='all'?' on':'')+'" data-act="space" data-id="all"><i style="background:var(--sidebar-muted)"></i><span>All spaces</span><em>'+visTasks().filter(t=>!CLOSED.includes(t.st)).length+'</em></button>';
  vs.forEach(s=>{
    const on=tv&&S.sp===s.id;
    h+='<div class="sprow"><button class="sp'+(on?' on':'')+'" data-act="space" data-id="'+s.id+'"><i style="background:'+s.color+'"></i><span>'+esc(s.name)+'</span><em>'+openCt(s.id)+'</em></button>'+(can('manage')?'<button class="sp-del" data-act="delSpace" data-id="'+s.id+'" title="Delete space" aria-label="Delete '+esc(s.name)+'">'+ic('trash',14)+'</button>':'')+'</div>';
    if(on){
      h+='<div class="folders"><button class="fo'+(S.fo==='all'?' on':'')+'" data-act="folder" data-id="all">All months</button>';
      folders.filter(f=>f.sp===s.id).forEach(f=>{h+='<button class="fo'+(S.fo===f.id?' on':'')+'" data-act="folder" data-id="'+f.id+'">'+ic('file',13)+esc(f.name)+'<em>'+visTasks().filter(t=>t.fo===f.id).length+'</em></button>'});
      if(can('manage')||role==='member')h+='<button class="fo" data-act="newMonth">'+ic('plus',13)+'New month</button>';
      h+='</div>';
    }
  });
  if(can('manage'))h+='<button class="sp sp-add" data-act="newSpace">'+ic('plus',15)+'<span>New space</span></button>';
  h+='<div class="side-note"><div class="me-row">'+av(me())+'<span><b>'+esc(me().name)+'</b><small>'+ROLES[me().role]+'</small></span><button class="ibtn sm" data-act="logout" title="Log out" aria-label="Log out">'+ic('logout',15)+'</button></div>FinStreet Education · Marketing Hub</div>';
  $('#side').innerHTML=h;
}
function notifs(){
  const m=me(),out=[];
  visTasks().forEach(t=>{
    if(t.st==='review'&&(t.rv===S.me||(!t.rv&&t.by===S.me)))out.push({id:t.id,h:'Approval needed',tx:t.title});
    if(isOver(t)&&t.as.includes(S.me))out.push({id:t.id,h:'Overdue',tx:t.title});
    t.comments.forEach(c=>{if(c.u!==S.me&&new RegExp('@'+first(m)+'\\b','i').test(c.tx))out.push({id:t.id,h:uById(c.u).name+' mentioned you',tx:t.title})});
  });
  return out;
}
function renderTop(){
  const nf=notifs();
  let h='';
  h+='<span id="saveState" class="savestate">All changes saved</span>';
  if(S.timer&&tById(S.timer.tid)){const t=tById(S.timer.tid);h+='<div class="tpill"><button class="t-open" data-act="open" data-id="'+t.id+'"><span class="dotlive"></span><span class="t-name">#'+t.n+' '+esc(t.title)+'</span><span class="mono" data-pill>'+clock(elapsed())+'</span></button><button class="t-stop" data-act="stopt" aria-label="Stop timer">'+ic('stop',12)+'</button></div>'}
  h+='<span class="whoami">'+av(me())+'<span>'+esc(first(me()))+'</span></span>';
  h+='<div style="position:relative"><button class="ibtn" data-act="bell" aria-label="Notifications">'+ic('bell',17)+(nf.length?'<span class="badge">'+nf.length+'</span>':'')+'</button>';
  if(S.bell)h+='<div class="pop"><h5>Notifications</h5>'+(nf.length?nf.slice(0,8).map(n=>'<button data-act="open" data-id="'+n.id+'"><b>'+esc(n.h)+'</b><small>'+esc(n.tx)+'</small></button>').join(''):'<div class="empty">Nothing needs you right now.</div>')+'</div>';
  h+='</div><button class="ibtn" data-act="keys" aria-label="Keyboard shortcuts" title="Shortcuts (?)">'+ic('key',17)+'</button><button class="ibtn" data-act="theme" aria-label="Toggle dark mode">'+ic('moon',17)+'</button>';
  $('#topR').innerHTML=h;
  const T={dashboard:'Dashboard',tasks:S.sp==='all'?'Tasks':spById(S.sp).short||spById(S.sp).name,chat:'Team chat',library:'Video library',time:'Time and reports',team:'Team and access',campaigns:'Campaigns'};
  $('#topTitle').textContent=T[S.view];
}

/* ---------- tasks views ---------- */
function filtered(){
  const q=S.q.trim().toLowerCase();
  return visTasks().filter(t=>(!S.fx||(S.fx==='overdue'?isOver(t):S.fx==='review'?t.st==='review':!CLOSED.includes(t.st)))&&(S.sp==='all'||t.sp===S.sp)&&(S.fo==='all'||t.fo===S.fo)&&(S.fa==='all'||t.as.includes(S.fa))&&(S.fp==='all'||t.pri===S.fp)&&(!q||(t.title+' '+t.tags.join(' ')+' '+t.brief).toLowerCase().includes(q)));
}
function card(t){
  const sp=spById(t.sp),sd=t.subs.filter(s=>s.d).length,od=isOver(t),run=S.timer&&S.timer.tid===t.id;
  return '<div class="card" draggable="true" data-act="open" data-id="'+t.id+'" tabindex="0">'
   +'<div class="c-top"><span class="c-no">#'+t.n+'</span>'+(S.sp==='all'?'<span class="c-sp"><i class="dot" style="background:'+sp.color+'"></i>'+esc(sp.short||sp.name)+'</span>':'')+(run?'<span class="live"><span class="dotlive"></span>Timing</span>':'')+'</div>'
   +'<div class="c-title">'+esc(t.title)+'</div>'
   +'<div class="c-meta">'+priTag(t.pri)+'<span class="due'+(od?' over':'')+'">'+(od?'Overdue · ':'Due ')+dd(t.due)+'</span></div>'
   +'<div class="c-foot">'+avs(t.as)+'<span class="ct">'+(t.subs.length?'<span title="Subtasks">'+ic('sub',13)+sd+'/'+t.subs.length+'</span>':'')+(t.files.length+t.vlinks.length+(t.drive?1:0)?'<span title="Files and links">'+ic('clip',13)+(t.files.length+t.vlinks.length+(t.drive?1:0))+'</span>':'')+(t.comments.length?'<span title="Comments">'+ic('chat',13)+t.comments.length+'</span>':'')+'</span></div></div>';
}
function vTasks(){
  const sp=S.sp==='all'?null:spById(S.sp), ts=filtered();
  let h='<div class="pagehead"><div class="grow"><h2>'+(sp?esc(sp.name):'All spaces')+'</h2><p>'+(S.fx?'<span class="pill st-review" style="margin-right:6px">'+({open:'Open tasks',overdue:'Overdue',review:'Waiting for approval'})[S.fx]+' <button data-act="clearFx" style="border:0;background:none;padding:0 0 0 4px;cursor:pointer;color:inherit" aria-label="Clear filter">✕</button></span>':'')+ts.length+' tasks'+(S.fo!=='all'?' in '+esc(folders.find(f=>f.id===S.fo).name):'')+(S.q?' matching “'+esc(S.q)+'”':'')+'</p></div>'
   +'<div class="seg" role="group" aria-label="Layout"><button data-act="layout" data-v="board" class="'+(S.layout==='board'?'on':'')+'">Board</button><button data-act="layout" data-v="list" class="'+(S.layout==='list'?'on':'')+'">List</button></div>'
   +(sp&&can('manage')?'<button class="btn" data-act="editSpace">'+ic('edit',15)+'Edit space</button>':'')
   +'<button class="btn" data-act="exportTasks" title="Download these tasks as CSV">'+ic('down',15)+'Export</button>'
   +(can('create')?'<button class="btn" data-act="importTasks" title="Import tasks from a CSV file">'+ic('upload',15)+'Import</button><button class="btn primary" data-act="newTask">'+ic('plus')+'New task</button>':'')+'</div>';
  h+='<div class="bar">';
  if(sp){h+='<div class="chips"><button class="chip'+(S.fo==='all'?' on':'')+'" data-act="folder" data-id="all">All months</button>'+folders.filter(f=>f.sp===sp.id).map(f=>'<button class="chip'+(S.fo===f.id?' on':'')+'" data-act="folder" data-id="'+f.id+'">'+esc(f.name)+'</button>').join('')+((can('manage')||me().role==='member')?'<button class="chip add" data-act="newMonth">+ Month</button>':'')+'</div>'}
  h+='<span class="sp-gap"></span><select data-f="fa" aria-label="Filter by person"><option value="all">Everyone</option>'+activeUsers().slice().sort((a,b)=>a.name.localeCompare(b.name)).map(u=>'<option value="'+u.id+'"'+(S.fa===u.id?' selected':'')+'>'+esc(u.name)+'</option>').join('')+'</select>'
   +'<select data-f="fp" aria-label="Filter by priority"><option value="all">Any priority</option>'+PRI.map(p=>'<option value="'+p+'"'+(S.fp===p?' selected':'')+'>'+cap(p)+'</option>').join('')+'</select></div>';
  if(S.layout==='board'){
    h+='<div class="board">'+ST.map(s=>{const c=ts.filter(t=>t.st===s.k);return '<section class="col" data-st="'+s.k+'" aria-label="'+s.n+'"><div class="col-h"><span class="pill st-'+s.k+'">'+s.n+'</span><b>'+c.length+'</b></div>'+(c.length?c.map(card).join(''):'<div class="empty">'+(s.k==='todo'&&can('create')?'<button class="btn sm" data-act="newTask">'+ic('plus',13)+'Add task</button>':'Drop a task here')+'</div>')+'</section>'}).join('')+'</div>';
  }else{
    h+='<div class="tbl-wrap"><table><thead><tr><th>#</th><th>Task</th>'+(S.sp==='all'?'<th>Space</th>':'')+'<th>Status</th><th>Assignee</th><th>Due</th><th>Priority</th><th class="num">Time</th><th class="num">Subtasks</th></tr></thead><tbody>'
     +(ts.length?ts.map(t=>{const sp2=spById(t.sp),sd=t.subs.filter(s=>s.d).length;return '<tr class="click" data-act="open" data-id="'+t.id+'"><td class="mono muted">'+t.n+'</td><td class="t-title">'+esc(t.title)+'</td>'+(S.sp==='all'?'<td><span class="c-sp" style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><i class="dot" style="background:'+sp2.color+'"></i>'+esc(sp2.short||sp2.name)+'</span></td>':'')+'<td>'+stPill(t.st)+'</td><td>'+avs(t.as)+'</td><td class="due'+(isOver(t)?' over':'')+'" style="white-space:nowrap">'+dd(t.due)+'</td><td>'+priTag(t.pri)+'</td><td class="num mono">'+hm(taskSecs(t.id))+'</td><td class="num">'+(t.subs.length?sd+'/'+t.subs.length:'-')+'</td></tr>'}).join(''):'<tr><td colspan="9"><div class="empty">No tasks match these filters.</div></td></tr>')
     +'</tbody></table></div>';
  }
  return h;
}

/* ---------- dashboard ---------- */
function vDash(){
  const ts=visTasks().filter(t=>(S.dsp==='all'||t.sp===S.dsp)&&(S.dpe==='all'||t.as.includes(S.dpe)));
  const open=ts.filter(t=>!CLOSED.includes(t.st)), over=ts.filter(isOver), pend=ts.filter(t=>t.st==='review');const pendMine=pend.filter(t=>t.rv===S.me||(!t.rv&&t.by===S.me));
  const ids=new Set(ts.map(t=>t.id));
  const ents=entries.filter(e=>ids.has(e.tid)&&entVis(e));
  const octS=ents.filter(e=>e.date.slice(0,7)===CUR_YM).reduce((a,e)=>a+e.secs,0);
  const sm=Math.max.apply(null,ST.map(s=>ts.filter(t=>t.st===s.k).length).concat([1]));
  const vs=visSpaces();
  let h='<div class="pagehead"><div class="grow"><h2>Hi '+esc(first(me()))+', here is the marketing overview</h2><p>'+new Date(pd(TODAY)).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})+'</p></div>'
   +'<button class="btn primary" data-act="newTask">'+ic('plus')+'New task</button><select data-f="dsp" aria-label="Space"><option value="all">All spaces</option>'+vs.map(s=>'<option value="'+s.id+'"'+(S.dsp===s.id?' selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select>'
   +'<select data-f="dpe" aria-label="Person"><option value="all">Everyone</option>'+activeUsers().slice().sort((a,b)=>a.name.localeCompare(b.name)).map(u=>'<option value="'+u.id+'"'+(S.dpe===u.id?' selected':'')+'>'+esc(u.name)+'</option>').join('')+'</select></div>';
  if(!tasks.length)h+='<div class="banner">Welcome to the FinStreet Marketing Hub. Pick a space on the left and press <b>New task</b> to add your first task'+(can('manage')?', or invite your team from <b>Team and access</b>':'')+'.</div>';
  if(me().role==='external')h+='<div class="banner">You are viewing as an external collaborator. You can only see tasks assigned to you in '+visSpaces().length+' spaces, and only your own time entries.</div>';
  h+='<div class="grid g4"><div class="kpi click" data-act="kpi" data-v="open" title="Show open tasks"><span>Open tasks</span><b>'+open.length+'</b><small>across '+new Set(open.map(t=>t.sp)).size+' spaces</small></div>'
   +'<div class="kpi click'+(over.length?' bad':'')+'" data-act="kpi" data-v="overdue" title="Show overdue tasks"><span>Overdue</span><b>'+over.length+'</b><small>past due, not approved</small></div>'
   +'<div class="kpi click" data-act="kpi" data-v="review" title="Show tasks waiting for approval"><span>Waiting for approval</span><b>'+pend.length+'</b><small>in Review Required</small></div>'
   +'<div class="kpi"><span data-act="nav" data-v="time" style="cursor:pointer">Hours logged, '+MN[+CUR_YM.slice(5)-1]+'</span><b>'+hrs(octS)+'</b><small>'+ents.filter(e=>e.date.slice(0,7)===CUR_YM).length+' time entries</small></div></div>';
  const mine=visTasks().filter(t=>t.as.includes(S.me)&&!CLOSED.includes(t.st)&&t.st!=='approved').sort((a,b)=>a.due<b.due?-1:1);
  h+='<div class="panel" style="margin-bottom:14px"><h3>My work<small>'+mine.length+' open · click a task to open it</small></h3>'+(mine.length?mine.slice(0,6).map(t=>{const sp=spById(t.sp);return '<div class="li" data-act="open" data-id="'+t.id+'"><i class="dot" style="background:'+sp.color+'"></i><div class="tt"><b>#'+t.n+' '+esc(t.title)+'</b><small>'+esc(sp.short||sp.name)+' · '+stN(t.st)+'</small></div>'+(S.timer&&S.timer.tid===t.id?'<span class="live"><span class="dotlive"></span>Timing</span>':'<button class="btn sm" data-act="startt" data-id="'+t.id+'" data-stop2="1">'+ic('play',12)+'Start</button>')+'<span class="when'+(isOver(t)?' over':'')+'">'+(isOver(t)?diff(t.due,TODAY)+'d late':'Due '+dd(t.due))+'</span></div>'}).join('')+(mine.length>6?'<button class="btn sm" data-act="mine" style="margin-top:8px">See all '+mine.length+'</button>':''):'<div class="empty">Nothing assigned to you. '+(can('create')?'<button class="btn sm" data-act="newTask">'+ic('plus',13)+'New task</button>':'')+'</div>')+'</div>';
  h+='<div class="grid g2"><div class="panel"><h3>Tasks by status<small>'+ts.length+' tasks</small></h3>'+ST.map(s=>{const c=ts.filter(t=>t.st===s.k).length;return '<div class="hb"><span class="lbl"><span class="pill st-'+s.k+'">'+s.n+'</span></span><div class="trk"><i style="width:'+(c/sm*100)+'%;background:var(--st-'+s.k+')"></i></div><b>'+c+'</b></div>'}).join('')+'</div>';
  h+='<div class="panel"><h3>Tasks by space<small>solid = approved or completed</small></h3>'+vs.map(s=>{const a=ts.filter(t=>t.sp===s.id),d=a.filter(t=>t.st==='approved'||t.st==='completed').length,mx=Math.max.apply(null,vs.map(x=>ts.filter(t=>t.sp===x.id).length).concat([1]));if(!a.length)return '';return '<div class="hb"><span class="lbl"><i class="dot" style="background:'+s.color+'"></i><span>'+esc(s.short||s.name)+'</span></span><div class="trk" style="width:'+(a.length/mx*100)+'%"><i style="width:'+(d/a.length*100)+'%;background:'+s.color+'"></i><i style="width:'+((a.length-d)/a.length*100)+'%;background:'+s.color+';opacity:.3"></i></div><b>'+d+'/'+a.length+'</b></div>'}).join('')+'</div></div>';
  const wl=activeUsers().map(u=>({u:u,o:ts.filter(t=>t.as.includes(u.id)&&!CLOSED.includes(t.st)).length,s:ents.filter(e=>e.uid===u.id&&e.date.slice(0,7)===CUR_YM).reduce((a,e)=>a+e.secs,0)})).filter(x=>x.o>0);
  const wm=Math.max.apply(null,wl.map(x=>x.o).concat([1]));
  const days=[];for(let i=13;i>=0;i--)days.push(addDays(TODAY,-i));
  const ds=days.map(d=>ents.filter(e=>e.date===d).reduce((a,e)=>a+e.secs,0));
  const dm=Math.max.apply(null,ds.concat([3600]));
  h+='<div class="grid g2"><div class="panel"><h3>Workload by person<small>open tasks · hours this month</small></h3>'+(wl.length?wl.map(x=>'<div class="hb"><span class="lbl">'+av(x.u)+'<span>'+esc(x.u.name)+'</span></span><div class="trk"><i style="width:'+(x.o/wm*100)+'%;background:var(--accent)"></i></div><em>'+x.o+' · '+hrs(x.s)+'h</em></div>').join(''):'<div class="empty">No open work for this filter.</div>')+'</div>';
  h+='<div class="panel"><h3>Time logged, last 14 days<small>hours per day · top line = '+(dm/3600).toFixed(1)+'h</small></h3><div class="cols" role="img" aria-label="Hours logged per day">'+ds.map((v,i)=>'<div class="'+(days[i]===TODAY?'today':'')+'" style="height:'+(v/dm*100)+'%" title="'+dd(days[i])+': '+hrs(v)+'h"></div>').join('')+'</div><div class="xl">'+days.map((d,i)=>'<span>'+(i%2===0?d.slice(8):'')+'</span>').join('')+'</div><div class="legend">'+ymName(CUR_YM)+'. Outlined bar is today.</div></div></div>';
  const li=(t,when,cls)=>{const sp=spById(t.sp);return '<div class="li" data-act="open" data-id="'+t.id+'"><i class="dot" style="background:'+sp.color+'"></i><div class="tt"><b>'+esc(t.title)+'</b><small>'+esc(sp.short||sp.name)+' · '+stN(t.st)+'</small></div>'+avs(t.as)+'<span class="when'+(cls||'')+'">'+when+'</span></div>'};
  const due7=ts.filter(t=>!CLOSED.includes(t.st)&&t.due>=TODAY&&t.due<=addDays(TODAY,7)).sort((a,b)=>a.due<b.due?-1:1);
  h+='<div class="grid g3"><div class="panel"><h3>Overdue<small>'+over.length+'</small></h3>'+(over.length?over.sort((a,b)=>a.due<b.due?-1:1).map(t=>li(t,diff(t.due,TODAY)+'d late',' over')).join(''):'<div class="empty">Nothing overdue.</div>')+'</div>'
   +'<div class="panel"><h3>Pending approvals<small>'+pend.length+'</small></h3>'+(pend.length?pend.map(t=>li(t,'Due '+dd(t.due),isOver(t)?' over':'')).join(''):'<div class="empty">No approvals waiting.</div>')+'</div>'
   +'<div class="panel"><h3>Due in the next 7 days<small>'+due7.length+'</small></h3>'+(due7.length?due7.map(t=>li(t,dw(t.due)+' '+dd(t.due),'')).join(''):'<div class="empty">Nothing due this week.</div>')+'</div></div>';
  return h;
}

/* ---------- chat ---------- */
function visChannels(){const ids=visSpaces().map(s=>s.id);channels.forEach(c=>{if(c.kind==='dm'&&Array.isArray(c.members))c.u=c.members.find(x=>x!==S.me)||S.me});return channels.filter(c=>c.kind==='dm'?Array.isArray(c.members)&&c.members.includes(S.me):(c.custom&&Array.isArray(c.members)?c.members.includes(S.me)||can('manage'):(c.sp===null||c.sp===undefined||ids.includes(c.sp))))}
function chMembers(c){if(c.kind==='dm')return c.members||[S.me,c.u];if(c.custom&&Array.isArray(c.members))return c.members;if(!c.sp)return activeUsers().filter(u=>u.role!=='external').map(u=>u.id);return activeUsers().filter(u=>u.role!=='external'&&(u.sp==='all'||!Array.isArray(u.sp)||u.sp.includes(c.sp))).map(u=>u.id)}
function wave(seed){let h='';for(let i=0;i<22;i++){h+='<i style="height:'+(5+((i*7+seed*3)%17))+'px"></i>'}return h}
function msgHtml(m){
  const u=uById(m.u),mine=m.u===S.me,rep=m.reply?messages.find(x=>x.id===m.reply):null;
  let media='';
  if(m.media){const d=m.media;
    const src=d.path?fileUrl(d.path):(d.src||'');
    if(d.type==='image')media=src?'<a href="'+src+'" target="_blank" rel="noopener" data-stop="1"><img src="'+src+'" alt="'+esc(d.name)+'"></a>':'<div class="ph" style="--h:'+(d.hue||200)+'"><span>'+esc(d.name)+(d.path?' · loading':'')+'</span></div>';
    else if(d.type==='video')media=src?'<video controls preload="metadata" src="'+src+'"></video>':'<div class="ph" style="--h:'+(d.hue||200)+'">'+ic('play',28)+'<span>'+esc(d.name)+(d.dur?' · '+d.dur:'')+'</span></div>';
    else if(d.type==='voice')media=src?'<div class="voice real"><audio controls preload="metadata" src="'+src+'"></audio><span class="mono muted" style="font-size:12px">'+esc(d.dur||'')+'</span></div>':'<div class="voice"><span class="pl">'+ic('play',14)+'</span><span class="wave">'+wave(m.id.length+m.t.length)+'</span><span class="mono muted" style="font-size:12px">'+esc(d.dur||'')+'</span></div>';
    else media='<div class="file">'+ic('file')+'<b>'+esc(d.name)+'</b><small>'+esc(d.size||'')+'</small>'+(src?'<a class="btn sm" href="'+src+'" target="_blank" rel="noopener" data-stop="1">Open</a>':'')+'</div>';
  }
  const rs=Object.keys(m.react).filter(e=>m.react[e].length).map(e=>'<button data-act="react" data-id="'+m.id+'" data-e="'+e+'" class="'+(m.react[e].includes(S.me)?'me':'')+'">'+e+' '+m.react[e].length+'</button>').join('');
  return '<div class="msg'+(mine?' mine':'')+'" id="'+m.id+'">'+(mine?'':av(u))+'<div class="bub">'+(mine?'':'<div class="m-name" style="--h:'+u.hue+'">'+esc(u.name)+'</div>')
   +(rep?'<div class="quote"><b>'+esc(uById(rep.u).name)+'</b>'+esc(rep.tx||(rep.media?rep.media.type==='voice'?'Voice note':rep.media.name:''))+'</div>':'')
   +media+(m.tx?'<div class="m-tx">'+fmtText(m.tx)+'</div>':'')
   +'<div class="m-meta">'+(m.pin?'Pinned · ':'')+m.t+(mine?'<span class="rd">'+ic('check',12)+ic('check',12)+'</span>':'')+'</div>'
   +(rs?'<div class="reacts">'+rs+'</div>':'')
   +'<div class="m-act"><button data-act="react" data-id="'+m.id+'" data-e="👍" aria-label="React thumbs up">👍</button><button data-act="react" data-id="'+m.id+'" data-e="✅" aria-label="React done">✅</button><button data-act="reply" data-id="'+m.id+'">Reply</button><button data-act="pin" data-id="'+m.id+'">'+(m.pin?'Unpin':'Pin')+'</button>'+(can('create')?'<button data-act="msg2task" data-id="'+m.id+'">Make task</button>':'')+(mine||can('manage')?'<button data-act="delMsg" data-id="'+m.id+'">Delete</button>':'')+'</div></div></div>';
}
function vChat(){
  const chs=visChannels();
  if(!chs.length)return '<div class="pagehead"><div class="grow"><h2>Team chat</h2><p>No chats yet.</p></div><button class="btn" data-act="newDm">'+ic('chat',15)+'New message</button>'+(can('manage')?'<button class="btn primary" data-act="newGroup">'+ic('plus')+'New group</button>':'')+'</div>';
  if(!chs.some(c=>c.id===S.ch))S.ch=chs[0].id;
  const ch=chs.find(c=>c.id===S.ch), ms=messages.filter(m=>m.ch===ch.id).sort((a,b)=>(a.at||'')<(b.at||'')?-1:1), pin=ms.filter(m=>m.pin).slice(-1)[0];
  S.seen[ch.id]=ms.length;
  const item=c=>{const all=messages.filter(m=>m.ch===c.id).sort((a,b)=>(a.at||'')<(b.at||'')?-1:1),l=all.slice(-1)[0],un=c.id!==S.ch&&S.seen[c.id]!=null&&all.length>S.seen[c.id]?all.length-S.seen[c.id]:0;const u=c.kind==='dm'?uById(c.u):null;return '<button class="chi'+(c.id===S.ch?' on':'')+'" data-act="channel" data-id="'+c.id+'">'+(u?av(u,1):'<span class="gi" style="background:'+(c.sp?spById(c.sp).color:'var(--accent)')+'">'+esc(c.name[0])+'</span>')+'<span class="tx"><b>'+esc(c.kind==='dm'?uById(c.u).name:c.name)+(un?' <em class="unread">'+un+'</em>':'')+'</b><small>'+(l?esc((l.u===S.me?'You: ':'')+(l.tx||(l.media?l.media.type==='voice'?'Voice note':l.media.name:''))):'No messages yet')+'</small></span></button>'};
  let h='<div class="pagehead"><div class="grow"><h2>Team chat</h2><p>Group chats per space, custom groups and direct messages. Share photos, videos, voice notes and files, and turn any message into a task.</p></div><button class="btn" data-act="newDm">'+ic('chat',15)+'New message</button>'+(can('manage')?'<button class="btn primary" data-act="newGroup">'+ic('plus')+'New group</button>':'')+'</div>';
  h+='<div class="chat'+(S.chatOpen?' open':'')+'"><div class="ch-list"><h5>Groups</h5>'+chs.filter(c=>c.kind==='group').map(item).join('')+'<h5>Direct messages</h5>'+(chs.filter(c=>c.kind==='dm').map(item).join('')||'<div class="muted" style="padding:6px 10px;font-size:12.5px">Press <b>New message</b> to chat one-to-one.</div>')+'</div>'
   +'<div class="ch-pane"><div class="ch-h"><button class="ibtn back" data-act="chatBack" aria-label="Back to chats">'+ic('back')+'</button><div><b>'+esc(ch.kind==='dm'?uById(ch.u).name:ch.name)+'</b><small>'+(ch.kind==='dm'?'Direct message':chMembers(ch).length+' members'+(ch.desc?' · '+esc(ch.desc):''))+'</small></div></div>'
   +(pin?'<div class="pinbar">Pinned: '+esc(pin.tx||'Media')+'</div>':'')
   +'<div class="msgs" id="msgs">'+(ms.length?(()=>{let last='',o='';ms.forEach(m=>{const dk=m.at?new Date(m.at).toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'}):TODAY;if(dk!==last){o+='<span class="day">'+(dk===TODAY?'Today':dk===addDays(TODAY,-1)?'Yesterday':dd(dk))+'</span>';last=dk}o+=msgHtml(m)});return o})():'<div class="empty">No messages yet. Say hello.</div>')+'</div>'
   +'<div class="typing" id="typing">'+(S.typing&&S.typing.ch===ch.id?esc(S.typing.name)+' is typing…':'')+'</div>'
   +'<div class="ch-c">'+(S.reply?'<div class="rp"><span>Replying to '+esc(uById(messages.find(x=>x.id===S.reply).u).name)+'</span><button class="btn sm" data-act="cancelReply" style="height:20px;border:0">'+ic('x',12)+'</button></div>':'')
   +'<div class="rw"><button class="ibtn" data-act="chatAttach" aria-label="Attach photo, video or file" title="Photo, video or file">'+ic('clip',17)+'</button><textarea id="chatIn" data-mention="1" rows="1" placeholder="Message, use @ to mention" aria-label="Message">'+esc(S.chatDraft)+'</textarea><button class="ibtn'+(S.rec?' recording':'')+'" data-act="voice" aria-label="'+(S.rec?'Stop and send voice note':'Record a voice note')+'" title="'+(S.rec?'Stop and send':'Voice note')+'">'+(S.rec?ic('stop',15):ic('mic',17))+'</button><button class="btn primary" data-act="send">'+ic('send',15)+'Send</button></div></div></div></div>';
  return h;
}
function sendMsg(x){
  const m=M(S.ch,S.me,nowT(),(x&&x.tx)||'',x||{});
  if(S.reply){m.reply=S.reply;S.reply=null}
  messages.push(m);S.seen[S.ch]=(S.seen[S.ch]||0)+1;
  S.chatDraft='';renderMain();
}

/* ---------- video library ---------- */
const libCls={Raw:'todo',Edited:'review',Final:'approved',Published:'completed'};
function vLib(){
  const vs=visSpaces().map(s=>s.id);
  const items=lib.filter(v=>vs.includes(v.sp)&&(S.ls==='all'||v.sp===S.ls)&&(S.lst==='all'||v.st===S.lst));
  let h='<div class="pagehead"><div class="grow"><h2>Video and podcast library</h2><p>Every session in one place: files, versions, review comments with timestamps, and all the links in the Video Links column.</p></div></div>';
  h+='<div class="drop" id="drop"><span style="color:var(--accent)">'+ic('upload',26)+'</span><p><b>Upload a video or podcast session</b><small>Drag a file here or choose one (up to '+MAX_MB+' MB, stored securely in the cloud). For longer recordings, add a Drive or YouTube link instead.</small></p><button class="btn" data-act="libNew">'+ic('link',15)+'Add with links</button><button class="btn primary" data-act="libUpload">'+ic('upload',15)+'Choose file</button></div>';
  h+='<div class="bar"><select data-f="ls" aria-label="Space"><option value="all">All spaces</option>'+visSpaces().map(s=>'<option value="'+s.id+'"'+(S.ls===s.id?' selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select><select data-f="lst" aria-label="Status"><option value="all">Any status</option>'+['Raw','Edited','Final','Published'].map(x=>'<option'+(S.lst===x?' selected':'')+'>'+x+'</option>').join('')+'</select></div>';
  h+='<div class="tbl-wrap"><table style="min-width:900px"><thead><tr><th>Title</th><th>Space</th><th>Status</th><th>Ver.</th><th>Length</th><th>Video links</th><th>Publish date</th><th class="num">Views</th></tr></thead><tbody>'
   +items.map(v=>{const sp=spById(v.sp),up=S.uploading[v.id];return '<tr class="click" data-act="openLib" data-id="'+v.id+'"><td class="t-title">'+esc(v.title)+'<div class="muted" style="font-size:12px;font-weight:400">'+esc(v.ep)+' · '+esc(v.guest)+(v.kind==='audio'?' · audio':'')+'</div>'+(up!=null?'<div class="upbar"><i data-up="'+v.id+'" style="width:'+up+'%"></i></div>':'')+'</td><td><span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><i class="dot" style="background:'+sp.color+'"></i>'+esc(sp.short||sp.name)+'</span></td><td><span class="pill st-'+libCls[v.st]+'">'+v.st+'</span></td><td class="mono">v'+v.ver+'</td><td class="mono">'+esc(v.dur)+'</td><td><div class="vl">'+(v.links.length?v.links.map(l=>'<a href="'+esc(l.url)+'" target="_blank" rel="noopener" data-stop="1"><span class="lt '+l.type+'">'+ltName[l.type]+'</span>'+esc(l.label)+'</a>').join(''):'<span class="muted">No links yet</span>')+'</div></td><td class="mono" style="white-space:nowrap">'+(v.pub?dd(v.pub):'-')+'</td><td class="num">'+(v.views!=null?v.views.toLocaleString('en-IN'):'-')+'</td></tr>'}).join('')
   +(items.length?'':'<tr><td colspan="8"><div class="empty">No sessions match these filters.</div></td></tr>')+'</tbody></table></div>';
  return h;
}
function dLib(v){
  const sp=spById(v.sp), task=v.task?tasks.find(t=>t.id===v.task||t.n===v.task):null, ed=can('edit')||v.by===S.me;
  const src=v.path?fileUrl(v.path):(localSrc[v.id]||'');
  const vers=[];for(let i=1;i<=v.ver;i++)vers.push('<span class="pill '+(i===v.ver?'st-completed':'st-todo')+'">v'+i+(i===v.ver?' latest':'')+'</span>');
  const dis=ed?'':' disabled';
  return '<div class="dh"><div class="crumb"><i class="dot" style="background:'+sp.color+'"></i>'+esc(sp.name)+' <span>/</span> Library</div>'+(ed?'<button class="ibtn" data-act="delLib" aria-label="Delete entry" title="Delete entry">'+ic('trash',16)+'</button>':'')+'<button class="ibtn" data-act="closeDrawer" aria-label="Close">'+ic('x')+'</button></div>'
   +'<div class="dbody"><div><input class="d-title" data-l="title" value="'+esc(v.title)+'"'+dis+' aria-label="Title"><div class="muted">'+esc(v.ep)+' · '+esc(v.guest)+' · recorded '+(v.rec?dd(v.rec):'-')+' · '+esc(v.dur)+'</div></div>'
   +'<div class="player">'+(src?(v.kind==='audio'?'<audio controls src="'+src+'"></audio>':'<video controls src="'+src+'"></video>'):'<div style="text-align:center"><div class="big" style="margin:0 auto 8px">'+ic('play',24)+'</div><div style="font-size:12.5px;opacity:.8">'+(v.path?'Loading the file…':'No file attached yet<br>Upload a file or use the links below')+'</div></div>')+'</div>'
   +(ed?'<div class="addrow" style="margin-top:0"><button class="btn" data-act="libVersion">'+ic('upload',15)+'Upload new version</button>'+(src?'<a class="btn" href="'+src+'" target="_blank" rel="noopener" download>'+ic('down',15)+'Download</a>':'')+'</div>':'')
   +'<div class="props">'
   +'<label class="fld">Status<select data-l="st"'+dis+'>'+['Raw','Edited','Final','Published'].map(x=>'<option'+(v.st===x?' selected':'')+'>'+x+'</option>').join('')+'</select></label>'
   +'<label class="fld">Space<select data-l="sp"'+dis+'>'+visSpaces().map(x=>'<option value="'+x.id+'"'+(v.sp===x.id?' selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></label>'
   +'<label class="fld">Type<select data-l="kind"'+dis+'><option value="video"'+(v.kind==='video'?' selected':'')+'>Video</option><option value="audio"'+(v.kind==='audio'?' selected':'')+'>Podcast / audio</option></select></label>'
   +'<label class="fld">Episode code<input data-l="ep" value="'+esc(v.ep)+'"'+dis+'></label>'
   +'<label class="fld">Guest / host<input data-l="guest" value="'+esc(v.guest)+'"'+dis+'></label>'
   +'<label class="fld">Length<input data-l="dur" value="'+esc(v.dur)+'"'+dis+'></label>'
   +'<label class="fld">Recorded on<input type="date" data-l="rec" value="'+esc(v.rec||'')+'"'+dis+'></label>'
   +'<label class="fld">Publish date<input type="date" data-l="pub" value="'+esc(v.pub||'')+'"'+dis+'></label>'
   +'<label class="fld">Linked task<select data-l="task"'+dis+'><option value="">None</option>'+visTasks().filter(t=>t.sp===v.sp).map(t=>'<option value="'+t.id+'"'+(task&&task.id===t.id?' selected':'')+'>#'+t.n+' '+esc(t.title)+'</option>').join('')+'</select></label>'
   +'<label class="fld">Views<input type="number" min="0" data-l="views" value="'+(v.views!=null?v.views:'')+'"'+dis+'></label>'
   +'<label class="fld">Likes<input type="number" min="0" data-l="likes" value="'+(v.likes!=null?v.likes:'')+'"'+dis+'></label>'
   +'</div>'
   +(task?'<div class="muted" style="font-size:13px">Task: <a href="#" data-act="open" data-id="'+task.id+'">#'+task.n+' '+esc(task.title)+'</a></div>':'')
   +'<div class="sec"><h4>Versions</h4><div class="verbar">'+vers.join('')+'</div></div>'
   +'<div class="sec"><h4>Video links<span>'+v.links.length+'</span></h4>'+v.links.map((l,i)=>'<div class="file"><span class="lt '+l.type+'">'+ltName[l.type]+'</span><b>'+esc(l.label)+'</b><small>'+esc(host(l.url))+'</small><a class="btn sm" href="'+esc(l.url)+'" target="_blank" rel="noopener">Open</a>'+(ed?'<button class="x" data-act="rmLvl" data-i="'+i+'" aria-label="Remove link">'+ic('x',14)+'</button>':'')+'</div>').join('')
   +'<div class="addrow"><input type="text" id="lvLabel" placeholder="Label, for example Raw footage" aria-label="Link label"><input type="url" id="lvUrl" placeholder="Paste a YouTube, Drive or podcast link" aria-label="Link URL"><button class="btn" data-act="addLvl">Add link</button></div></div>'
   +'<div class="sec"><h4>Review comments<span>by timestamp</span></h4>'+(v.cm.length?v.cm.map((c,i)=>'<div class="cm">'+av(uById(c.u))+'<div class="b"><div class="who"><span class="ts">'+c.ts+'</span>'+esc(uById(c.u).name)+(c.d?'<span class="pill st-approved">Resolved</span>':'')+'</div><div class="tx">'+esc(c.tx)+'</div>'+(c.d?'':'<button class="btn sm" style="margin-top:6px" data-act="resolve" data-i="'+i+'">Mark resolved</button>')+(c.u===S.me?' <button class="btn sm" style="margin-top:6px" data-act="rmTs" data-i="'+i+'">Delete</button>':'')+'</div></div>').join(''):'<div class="muted">No review comments yet.</div>')
   +'<div class="addrow"><input type="text" id="tsIn" placeholder="00:00:00" style="max-width:100px;flex:0 0 100px" aria-label="Timestamp"><input type="text" id="tsTx" placeholder="Add a note for this moment" aria-label="Review note"><button class="btn" data-act="addTs">Add</button></div></div>'
   +(can('approve')?'<div class="addrow" style="margin-top:0"><button class="btn primary" data-act="libApprove">Approve this version</button><button class="btn" data-act="libChanges">Request changes</button></div>':'')
   +'</div>';
}

/* ---------- time and reports ---------- */
function reportData(){
  const role=me().role,ids=new Set(visTasks().map(t=>t.id));
  const es=entries.filter(e=>e.date.slice(0,7)===S.rm&&ids.has(e.tid)&&(role==='admin'||role==='manager'||role==='reviewer'||e.uid===S.me));
  const g={};
  es.forEach(e=>{const t=tById(e.tid);const k=S.rby==='person'?e.uid:S.rby==='task'?e.tid:t.sp;const r=g[k]||(g[k]={k:k,secs:0,bill:0,tasks:new Set(),n:0});r.secs+=e.secs;if(e.bill)r.bill+=e.secs;r.tasks.add(e.tid);r.n++});
  const rows=Object.keys(g).map(k=>g[k]).sort((a,b)=>b.secs-a.secs);
  return {es:es,rows:rows};
}
function vTime(){
  const d=reportData(),tot=d.es.reduce((a,e)=>a+e.secs,0),bill=d.es.reduce((a,e)=>a+(e.bill?e.secs:0),0);
  const ts=visTasks().filter(t=>t.done&&t.done.slice(0,7)===S.rm);
  const tr=ts.length?(ts.reduce((a,t)=>a+diff(t.start,t.done),0)/ts.length).toFixed(1):'-';
  const rev=visTasks().filter(t=>t.due.slice(0,7)===S.rm).reduce((a,t)=>a+t.rev,0);
  const mx=Math.max.apply(null,d.rows.map(r=>r.secs).concat([1]));
  const label=r=>{if(S.rby==='person'){const u=uById(r.k);return '<span class="lbl" style="display:flex;gap:8px;align-items:center">'+av(u)+esc(u.name)+'</span>'}
    if(S.rby==='space'){const s=spById(r.k);return '<span style="display:flex;gap:8px;align-items:center"><i class="dot" style="background:'+s.color+'"></i>'+esc(s.name)+'</span>'}
    const t=tById(r.k);return '<span><span class="mono muted">#'+t.n+'</span> '+esc(t.title)+'</span>'};
  let h='<div class="pagehead"><div class="grow"><h2>Time and reports</h2><p>'+(me().role==='member'?'Showing your own time. Managers and reviewers see the whole team.':'Time entries are stored against the task and the person.')+'</p></div>'
   +'<select data-f="rm" aria-label="Month">'+[-5,-4,-3,-2,-1,0,1].map(i=>{let y=+CUR_YM.slice(0,4),mo=+CUR_YM.slice(5)+i;while(mo<1){mo+=12;y--}while(mo>12){mo-=12;y++}return y+'-'+String(mo).padStart(2,'0')}).map(m=>'<option value="'+m+'"'+(S.rm===m?' selected':'')+'>'+ymName(m)+'</option>').join('')+'</select>'
   +'<div class="seg" role="group" aria-label="Report by">'+['person','task','space'].map(x=>'<button data-act="rby" data-v="'+x+'" class="'+(S.rby===x?'on':'')+'">By '+x+'</button>').join('')+'</div>'
   +'<button class="btn" data-act="csv">Copy CSV</button><button class="btn" data-act="csvDl">'+ic('down',15)+'Download</button></div>';
  h+='<div class="grid g4"><div class="kpi"><span>Hours logged</span><b>'+hrs(tot)+'</b><small>'+d.es.length+' entries</small></div><div class="kpi"><span>People logging time</span><b>'+new Set(d.es.map(e=>e.uid)).size+'</b><small>on '+new Set(d.es.map(e=>e.tid)).size+' tasks</small></div><div class="kpi"><span>Approved or completed</span><b>'+ts.length+'</b><small>tasks finished in '+MN[+S.rm.slice(5)-1]+'</small></div><div class="kpi"><span>Avg turnaround</span><b>'+tr+(tr==='-'?'':'d')+'</b><small>start to approval · '+rev+' revision rounds</small></div></div>';
  h+='<div class="tbl-wrap"><table><thead><tr><th>'+cap(S.rby)+'</th><th style="width:34%">Share of hours</th><th class="num">Hours</th><th class="num">Entries</th><th class="num">'+(S.rby==='task'?'Estimate':'Tasks')+'</th></tr></thead><tbody>'
   +(d.rows.length?d.rows.map(r=>{let last;if(S.rby==='task'){const t=tById(r.k);last=(t.est?t.est+'h':'-')+(t.est&&r.secs/3600>t.est?' <span class="pill st-changes">over</span>':'')}else last=r.tasks.size;return '<tr><td>'+label(r)+'</td><td><div class="trk"><i style="width:'+(r.secs/mx*100)+'%;background:var(--accent)"></i></div></td><td class="num mono">'+hrs(r.secs)+'</td><td class="num mono">'+r.n+'</td><td class="num">'+last+'</td></tr>'}).join(''):'<tr><td colspan="5"><div class="empty">No time logged in '+ymName(S.rm)+'.</div></td></tr>')+'</tbody></table></div>';
  const opts=visTasks().filter(t=>me().role!=='external'||t.as.includes(S.me));
  h+='<div class="panel" style="margin-top:14px"><h3>Add a manual time entry</h3><form data-form="time" class="addrow" style="margin:0"><select name="tid" aria-label="Task">'+opts.map(t=>'<option value="'+t.id+'">#'+t.n+' '+esc(t.title)+'</option>').join('')+'</select><input type="number" name="h" min="0.25" step="0.25" value="1" aria-label="Hours" style="max-width:90px;flex:0 0 90px"><input type="text" name="note" placeholder="What did you work on?" aria-label="Note"><button class="btn primary" type="submit">Add entry</button></form></div>';
  return h;
}

/* ---------- team and access ---------- */
const PERMS=[['View tasks and files','yes','yes','yes','Own spaces','Invited scope'],['Create and edit tasks','yes','yes','yes','yes','Assigned only'],['Comment and upload files','yes','yes','yes','yes','yes'],['Change task status','yes','yes','yes','yes','Assigned, limited'],['Approve or request changes','yes','yes','yes','no','no'],['Track and log time','yes','yes','yes','yes','Assigned only'],['See reports and workload','yes','yes','yes','Own time','no'],['Use internal chat','yes','yes','yes','yes','no'],['Manage spaces and invites','yes','yes','no','no','no'],['Billing and security','yes','no','no','no','no']];
function vTeam(){
  const m=can('manage');
  let h='<div class="pagehead"><div class="grow"><h2>Team and access</h2><p>Roles, external invites and integrations. '+(m?'':'You can view this page, but only Admins and Managers can change it.')+'</p></div></div>';
  h+='<div class="grid g2"><div class="panel"><h3>Members<small>'+activeUsers().length+'</small></h3>'+users.map(u=>{const tm=timers[u.id],tt=tm?tById(tm.tid):null;return '<div class="li'+(u.active===false?' off':'')+'" '+(me().role==='admin'||u.id===S.me?'data-act="editMember" data-u="'+u.id+'"':'style="cursor:default"')+'>'+av(u,1)+'<div class="tt"><b>'+esc(u.name)+(u.id===S.me?' (you)':'')+'</b><small>'+esc(u.title||u.email||'')+' · '+(u.sp==='all'||!Array.isArray(u.sp)?'All spaces':u.sp.length+' spaces')+(tt?'<br><span class="livetxt"><span class="dotlive"></span>Working on #'+tt.n+' '+esc(tt.title)+'</span>':'')+'</small></div><span class="pill '+(u.active===false?'st-todo':u.role==='external'?'st-hold':u.role==='admin'?'st-completed':'st-todo')+'">'+(u.active===false?'Inactive':ROLES[u.role])+'</span></div>'}).join('')+(m?'<p class="muted" style="font-size:12.5px;margin:10px 0 0">Click a member to change their role, title or spaces. New people join by signing up at <b>'+esc(location.origin)+'</b> with their work email.</p>':'')+'</div>';
  h+='<div class="panel"><h3>Pending invites<small>'+S.invites.length+'</small></h3>'+(S.invites.length?S.invites.map((v,i)=>'<div class="li" style="cursor:default"><div class="tt"><b>'+esc(v.name)+'</b><small>'+esc(v.email)+' · '+esc(ROLES[v.role]||v.role)+'<br>'+esc(v.scope)+' · '+esc(v.exp)+'</small></div>'+(m?'<button class="btn sm" data-act="copyInvite" data-i="'+i+'">Copy link</button><button class="btn sm" data-act="revoke" data-i="'+i+'">Revoke</button>':'')+'</div>').join(''):'<div class="empty">No pending invites.</div>')
   +(m?'<form data-form="invite" style="margin-top:12px;display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--line);padding-top:12px"><b style="font-size:13px">Invite a team member, agency or freelancer</b><div class="addrow" style="margin:0"><input type="text" name="name" placeholder="Name or agency" required aria-label="Name"><input type="email" name="email" placeholder="Email" required aria-label="Email"></div><div class="addrow" style="margin:0"><select name="role" aria-label="Role"><option value="member">Team Member</option><option value="reviewer">Reviewer</option><option value="manager">Manager</option><option value="external">External collaborator</option></select><select name="exp" aria-label="Expiry"><option>Expires in 7 days</option><option>Expires in 14 days</option><option>Expires in 30 days</option></select></div>'
   +'<div class="fld">Spaces they can see (leave empty for all spaces)</div><div class="checks">'+spaces.map(s=>'<label><input type="checkbox" name="sp" value="'+esc(s.id)+'"><i class="dot" style="background:'+s.color+'"></i>'+esc(s.short||s.name)+'</label>').join('')+'</div>'
   +'<div class="fld">What they can do</div><div class="checks"><label><input type="checkbox" checked disabled>View</label><label><input type="checkbox" checked>Comment</label><label><input type="checkbox" checked>Upload files</label><label><input type="checkbox" checked>Update assigned tasks</label><label><input type="checkbox">See time logs</label><label><input type="checkbox" checked>Download files</label></div><button class="btn primary" type="submit" style="align-self:flex-start">Send invite</button></form>':'')+'</div></div>';
  h+='<div class="panel" style="margin-bottom:14px"><h3>Permission matrix</h3><div class="tbl-wrap" style="border:0"><table class="mtx"><thead><tr><th>Permission</th>'+['Admin','Manager','Reviewer','Team Member','External'].map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'
   +PERMS.map(r=>'<tr><td>'+r[0]+'</td>'+r.slice(1).map(c=>'<td>'+(c==='yes'?'<span class="yes">'+ic('check',16)+'</span>':c==='no'?'<span class="no">-</span>':'<span class="lim">'+c+'</span>')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></div>';
  const sw=(k,t,s)=>'<div class="sw-row"><p><b>'+t+'</b><small>'+s+'</small></p><button class="switch" role="switch" aria-checked="'+S.flags[k]+'" aria-label="'+t+'" data-act="flag" data-k="'+k+'"'+(m?'':' disabled')+'></button></div>';
  h+='<div class="panel"><h3>Integrations<small>coming soon</small></h3>'+sw('wa','WhatsApp notifications','Sends alerts to team members’ WhatsApp numbers through the official Business API. WhatsApp does not allow linking existing groups, so the built-in chat stays the main channel.')
   +(S.flags.wa?'<div class="wa">Task assigned to you\n*Thumbnails for Ep 42 (A/B set)*\nDue 30 Oct · Priority Urgent\nReply DONE 103 to mark it complete.</div>':'')
   +sw('drive','Google Drive','Pick files and show link previews inside tasks.')+sw('yt','YouTube analytics','Pull views, likes and watch time into the video library.')+sw('cal','Google Calendar','Show due dates and publishing slots in your calendar.')+'</div>';
  return h;
}

/* ---------- task drawer ---------- */
function dTask(t){
  const sp=spById(t.sp),fo=folders.find(f=>f.id===t.fo)||{name:''};
  const ed=can('edit'),dis=ed?'':' disabled',asg=ed||t.as.includes(S.me),adis=asg?'':' disabled';
  const tot=taskSecs(t.id),run=S.timer&&S.timer.tid===t.id,tw=can('work',t);
  const pct=t.est?Math.min(100,(tot+(run?elapsed():0))/3600/t.est*100):0;
  const sd=t.subs.filter(s=>s.d).length,cd=t.check.filter(s=>s.d).length;
  const es=entries.filter(e=>e.tid===t.id&&entVis(e)).slice().sort((a,b)=>a.date<b.date?1:-1);
  const people=activeUsers().filter(u=>u.sp==='all'||!Array.isArray(u.sp)||u.sp.includes(t.sp));
  const canDel=can('manage')||t.by===S.me;
  let h='<div class="dh"><div class="crumb"><i class="dot" style="background:'+sp.color+'"></i>'+esc(sp.name)+' <span>/</span> '+esc(fo.name)+' <span>/</span> <span class="mono" style="opacity:1">#'+t.n+'</span></div>'+(canDel?'<button class="ibtn" data-act="delTask" aria-label="Delete task" title="Delete task">'+ic('trash',16)+'</button>':'')+'<button class="ibtn" data-act="closeDrawer" aria-label="Close">'+ic('x')+'</button></div><div class="dbody">';
  h+='<input class="d-title" data-f="title" value="'+esc(t.title)+'"'+dis+' aria-label="Task title">';
  h+=actionBar(t);
  h+='<div class="props"><label class="fld">Status<select data-f="st">'+ST.map(s=>'<option value="'+s.k+'"'+(t.st===s.k?' selected':'')+'>'+s.n+'</option>').join('')+'</select></label>'
   +'<label class="fld">Priority<select data-f="pri"'+dis+'>'+PRI.map(p=>'<option value="'+p+'"'+(t.pri===p?' selected':'')+'>'+cap(p)+'</option>').join('')+'</select></label>'
   +'<label class="fld">Start date<input type="date" data-f="start" value="'+t.start+'"'+dis+'></label><label class="fld">Due date<input type="date" data-f="due" value="'+t.due+'"'+dis+'></label>'
   +'<label class="fld">Reviewer<select data-f="rv"'+dis+'><option value="">No reviewer</option>'+activeUsers().filter(u=>['admin','manager','reviewer'].includes(u.role)).map(u=>'<option value="'+u.id+'"'+(t.rv===u.id?' selected':'')+'>'+esc(u.name)+'</option>').join('')+'</select></label>'
   +'<label class="fld">Estimate, hours<input type="number" min="0" step="0.5" data-f="est" value="'+t.est+'"'+dis+'></label>'
   +'<label class="fld">Monthly folder<select data-f="fo"'+dis+'>'+folders.filter(f=>f.sp===t.sp).sort((a,b)=>a.ym<b.ym?-1:1).map(f=>'<option value="'+f.id+'"'+(t.fo===f.id?' selected':'')+'>'+esc(f.name)+'</option>').join('')+'</select></label>'
   +'<label class="fld">Campaign<select data-f="camp"'+dis+'><option value="">None</option>'+campaigns.map(c=>'<option value="'+c.id+'"'+(t.camp===c.id?' selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></label>'
   +'<label class="fld">Repeats monthly<select data-f="recurring"'+dis+'><option value="0">No</option><option value="1"'+(t.recurring?' selected':'')+'>Yes, copy into each new month</option></select></label></div>';
  h+='<div class="sec"><h4>Assignees</h4><div class="asg">'+t.as.map(i=>{const u=uById(i);return '<span class="tag">'+av(u)+esc(u.name)+(ed?'<button data-act="rmAs" data-u="'+i+'" aria-label="Remove '+esc(u.name)+'">'+ic('x',13)+'</button>':'')+'</span>'}).join('')+(ed?'<select data-f="addAs" aria-label="Add assignee" style="width:auto"><option value="">+ Add person</option>'+people.filter(u=>!t.as.includes(u.id)).map(u=>'<option value="'+u.id+'">'+esc(u.name)+(u.role==='external'?' (external)':'')+'</option>').join('')+'</select>':'')+'</div></div>';
  h+='<div class="sec"><h4>Tags</h4><div class="asg">'+t.tags.map((g,i)=>'<span class="tag">#'+esc(g)+(ed?'<button data-act="rmTag" data-i="'+i+'" aria-label="Remove tag">'+ic('x',13)+'</button>':'')+'</span>').join('')+(ed?'<input type="text" id="tagIn" placeholder="+ Add tag, press Enter" aria-label="Add tag" style="width:170px">':'')+(t.tags.length||ed?'':'<span class="muted" style="font-size:13px">No tags</span>')+'</div></div>';
  if(S.pend===t.id)h+='<div class="pendbox"><b>Changes Required needs a comment</b><textarea id="pendTx" rows="3" placeholder="Describe what needs to change"></textarea><div class="addrow" style="margin:0"><button class="btn danger" data-act="pendOk">Send and request changes</button><button class="btn" data-act="pendNo">Cancel</button></div></div>';
  h+='<div class="timer"><div><div class="t-sub">Time on this task</div><div class="t-clock mono" data-clock="'+t.id+'">'+clock(tot+(run?elapsed():0))+'</div><div class="t-sub">'+hm(tot)+' logged'+(t.est?' of '+t.est+'h estimate':'')+'</div></div>'+(tw?'<button class="btn '+(run?'danger':'primary')+'" data-act="'+(run?'stopt':'startt')+'" data-id="'+t.id+'">'+ic(run?'stop':'play',15)+(run?'Stop':'Start timer')+'</button>':'')+(t.est?'<div class="prog'+(tot/3600>t.est?' over':'')+'"><i style="width:'+pct+'%"></i></div>':'')+'</div>';
  h+='<div class="sec"><h4>Brief</h4><textarea data-f="brief" rows="3" placeholder="Add a brief, links and references"'+dis+'>'+esc(t.brief)+'</textarea></div>';
  h+='<div class="sec"><h4>Subtasks<span>'+sd+'/'+t.subs.length+'</span></h4>'+t.subs.map((s,i)=>'<label class="ck'+(s.d?' done':'')+'"><input type="checkbox" data-f="subd" data-i="'+i+'"'+(s.d?' checked':'')+adis+'><span>'+esc(s.t)+'</span></label>').join('')+(asg?'<div class="addrow"><input type="text" id="subIn" placeholder="Add a subtask and press Enter" aria-label="New subtask"><button class="btn" data-act="addSub">Add</button></div>':'')+'</div>';
  h+='<div class="sec"><h4>Checklist<span>'+cd+'/'+t.check.length+'</span></h4>'+(t.check.length?'<div class="prog" style="margin:0 0 6px"><i style="width:'+(cd/t.check.length*100)+'%"></i></div>':'')+t.check.map((s,i)=>'<label class="ck'+(s.d?' done':'')+'"><input type="checkbox" data-f="chkd" data-i="'+i+'"'+(s.d?' checked':'')+adis+'><span>'+esc(s.t)+'</span></label>').join('')+(asg?'<div class="addrow"><input type="text" id="chkIn" placeholder="Add a checklist item" aria-label="New checklist item"><button class="btn" data-act="addChk">Add</button></div>':'')+'</div>';
  h+='<div class="sec"><h4>Files and Drive<span>'+(t.files.length+(t.drive?1:0))+'</span></h4>'+(t.drive?'<div class="file"><span class="lt drive">Drive</span><b>'+esc(decodeURIComponent(t.drive.split('/').pop()))+'</b><small>'+esc(host(t.drive))+'</small><a class="btn sm" href="'+esc(t.drive)+'" target="_blank" rel="noopener">Open</a>'+(asg?'<button class="x" data-act="rmDrive" aria-label="Remove Drive link">'+ic('x',14)+'</button>':'')+'</div>':'')
   +t.files.map((f,i)=>{const u2=f.path?fileUrl(f.path):'';return '<div class="file">'+ic('file')+'<b>'+esc(f.name)+'</b><small>'+esc(f.size)+(f.up?' · uploading…':'')+'</small>'+(u2?'<a class="btn sm" href="'+u2+'" target="_blank" rel="noopener">Open</a>':'')+(asg?'<button class="x" data-act="rmFile" data-i="'+i+'" aria-label="Remove file">'+ic('x',14)+'</button>':'')+'</div>'}).join('')
   +(asg?'<div class="addrow"><input type="url" id="driveIn" placeholder="Paste a Google Drive link" aria-label="Drive link"><button class="btn" data-act="saveDrive">Save link</button><button class="btn" data-act="attach">'+ic('clip',15)+'Attach file</button></div>':'')+'</div>';
  h+='<div class="sec"><h4>Video links<span>'+t.vlinks.length+'</span></h4>'+(t.vlinks.length?t.vlinks.map((l,i)=>'<div class="file"><span class="lt '+l.type+'">'+ltName[l.type]+'</span><b>'+esc(l.label)+'</b><small>'+esc(host(l.url))+'</small><a class="btn sm" href="'+esc(l.url)+'" target="_blank" rel="noopener">Open</a>'+(asg?'<button class="x" data-act="rmVl" data-i="'+i+'" aria-label="Remove link">'+ic('x',14)+'</button>':'')+'</div>').join(''):'<div class="muted" style="font-size:13px">Raw footage, edits, thumbnails, scripts, YouTube and podcast links all live here.</div>')
   +(asg?'<div class="addrow"><input type="text" id="vlLabel" placeholder="Label" aria-label="Link label"><input type="url" id="vlUrl" placeholder="Paste a link" aria-label="Link URL"><button class="btn" data-act="addVl">Add</button></div>':'')+'</div>';
  const fk=Object.keys(t.fields);
  if(fk.length||ed)h+='<div class="sec"><h4>Custom fields<span>Budget, platform, venue…</span></h4><div class="cf">'+fk.map(k=>'<span><em>'+esc(k)+'</em>'+esc(t.fields[k])+(ed?' <button class="x" data-act="rmField" data-k="'+esc(k)+'" aria-label="Remove field">'+ic('x',12)+'</button>':'')+'</span>').join('')+'</div>'+(ed?'<div class="addrow"><input type="text" id="cfK" placeholder="Field, e.g. Budget" aria-label="Field name" style="max-width:170px"><input type="text" id="cfV" placeholder="Value, e.g. ₹50,000" aria-label="Field value"><button class="btn" data-act="addField">Add</button></div>':'')+'</div>';
  h+='<div class="sec"><h4>Time entries<span>'+es.length+'</span></h4>'+(es.slice(0,8).map(e=>'<div class="file">'+av(uById(e.uid))+'<b>'+esc(e.note||'Time entry')+'</b><small>'+dd(e.date)+' · '+hm(e.secs)+'</small>'+(e.uid===S.me||can('manage')?'<button class="x" data-act="rmEntry" data-id="'+e.id+'" aria-label="Delete entry">'+ic('x',14)+'</button>':'')+'</div>').join('')||'<div class="muted" style="font-size:13px">No time logged yet.</div>')
   +(tw?'<div class="addrow"><input type="number" id="mH" min="0.25" step="0.25" placeholder="Hours" aria-label="Hours" style="max-width:90px;flex:0 0 90px"><input type="text" id="mN" placeholder="Note" aria-label="Time note"><button class="btn" data-act="addTime">Log time</button></div>':'')+'</div>';
  h+='<div class="sec"><div class="tabs"><button data-act="tab" data-v="comments" class="'+(S.tab==='comments'?'on':'')+'">Comments · '+t.comments.length+'</button><button data-act="tab" data-v="activity" class="'+(S.tab==='activity'?'on':'')+'">Activity · '+t.log.length+'</button></div>';
  if(S.tab==='comments'){
    h+=(t.comments.length?t.comments.map(c=>'<div class="cm '+(c.kind||'')+'">'+av(uById(c.u),1)+'<div class="b"><div class="who">'+esc(uById(c.u).name)+(c.kind==='changes'?'<span class="pill st-changes">Changes requested</span>':c.kind==='approve'?'<span class="pill st-approved">Approved</span>':'')+'<small>'+esc(c.at)+'</small>'+(c.u===S.me?'<button class="btn sm" data-act="rmCmt" data-i="'+t.comments.indexOf(c)+'" style="margin-left:auto;height:22px">Delete</button>':'')+'</div><div class="tx">'+fmtText(c.tx)+'</div></div></div>').join(''):'<div class="muted" style="margin-bottom:12px">No comments yet. Ask a question or share feedback.</div>')
     +'<div class="composer"><textarea id="cmt" data-mention="1" rows="2" placeholder="Write a comment. Type @ to mention someone." aria-label="Comment">'+esc(S.draft[t.id]||'')+'</textarea><div class="row">'+(canReview(t)?'<button class="btn" data-act="reqChanges">Request changes</button><button class="btn" data-act="approve">Approve</button>':'')+'<button class="btn primary" data-act="comment">Comment</button></div></div>';
  }else h+=t.log.map(a=>'<div class="act">'+av(uById(a.u))+'<span><b>'+esc(uById(a.u).name)+'</b> '+esc(a.tx)+'<br><small>'+esc(a.at)+'</small></span></div>').join('');
  h+='</div></div>';
  return h;
}

/* ---------- render ---------- */
function renderDrawer(){
  queueSync();
  const d=$('#drawer');
  if(!S.drawer){d.hidden=true;d.innerHTML='';return}
  const sc=$('.dbody',d);const st=sc?sc.scrollTop:0;
  const obj=S.drawer.type==='task'?tById(S.drawer.id):S.drawer.type==='camp'?campaigns.find(c=>c.id===S.drawer.id):lib.find(v=>v.id===S.drawer.id);
  if(!obj){S.drawer=null;d.hidden=true;d.innerHTML='';return}
  d.innerHTML=S.drawer.type==='task'?dTask(obj):S.drawer.type==='camp'?dCamp(obj):dLib(obj);
  d.hidden=false;const nb=$('.dbody',d);if(nb)nb.scrollTop=st;
}
function renderMain(){
  queueSync();
  const m=$('#main'),st=m.scrollTop,b=$('.board'),bl=b?b.scrollLeft:0;
  const v=S.view;
  m.innerHTML=v==='dashboard'?vDash():v==='tasks'?vTasks():v==='chat'?vChat():v==='library'?vLib():v==='time'?vTime():v==='campaigns'?vCamps():vTeam();
  m.scrollTop=st;const nb=$('.board');if(nb)nb.scrollLeft=bl;
  const ml=$('#msgs');if(ml)ml.scrollTop=ml.scrollHeight;
  if(v==='chat'&&S.focusChat){const t=$('#chatIn');if(t)t.focus();S.focusChat=false}
}
function renderAll(){renderSide();renderTop();renderMain();renderDrawer();queueSync()}

/* ---------- actions ---------- */
function openD(type,id){S.drawer={type:type,id:id};S.tab='comments';S.bell=false;renderTop();renderDrawer()}
function startTimer(id){
  const t=tById(id);if(!can('work',t))return deny('Only people assigned to this task can track time on it.');
  if(S.timer){const p=tById(S.timer.tid);stopTimer(true);toast('Stopped the timer on #'+p.n+'. Only one timer runs at a time.')}
  S.timer={tid:id,start:Date.now()};timers[S.me]=S.timer;logA(t,'started the timer');renderAll();
}
function stopTimer(quiet){
  if(!S.timer)return;const t=tById(S.timer.tid),sec=Math.max(60,Math.round(elapsed()));if(!t){S.timer=null;delete timers[S.me];renderAll();return}
  entries.push({id:'e'+uid(),tid:t.id,uid:S.me,date:TODAY,secs:sec,note:'Timer',bill:1});logA(t,'logged '+hm(sec)+' with the timer');
  S.timer=null;delete timers[S.me];if(!quiet){toast('Logged '+hm(sec)+' on #'+t.n+'.');renderAll()}else queueSync()
}
const isOwner=t=>t&&(t.by===S.me||can('manage'));
const canReview=t=>can('approve')||(t&&(t.by===S.me||t.rv===S.me));
function setStatus(t,ns,note){
  if(ns===t.st)return true;const r=me().role;
  if(r==='external'){if(!t.as.includes(S.me)||['approved','changes','completed'].includes(ns))return deny('External collaborators can move their assigned tasks between To Do, In Progress, Review Required and On Hold.')}
  else if((ns==='approved'||ns==='changes')&&!canReview(t))return deny('Only the person who assigned this task, its reviewer or a manager can approve or request changes.');
  if(ns==='completed'&&t.st!=='approved'&&!isOwner(t))return deny('Only the person who assigned this task (or a manager) can close it before it is approved.');
  if(ns==='cancelled'&&!isOwner(t))return deny('Only the person who assigned this task (or a manager) can cancel it.');
  if(ns==='changes'&&!note){S.pend=t.id;openD('task',t.id);return false}
  const old=t.st;t.st=ns;
  if(ns==='approved'||ns==='completed')t.done=t.done||TODAY;
  if(ns==='changes')t.rev++;
  logA(t,'moved this task from '+stN(old)+' to '+stN(ns));
  if(note)t.comments.push({u:S.me,at:nowS(),tx:note,kind:ns==='changes'?'changes':ns==='approved'?'approve':''});
  S.pend=null;toast(ns==='review'?'Sent for review'+(t.rv?' to '+uById(t.rv).name:(t.by&&t.by!==S.me?' to '+uById(t.by).name:''))+'.':ns==='completed'?'Task closed.':ns==='cancelled'?'Task cancelled.':'Moved to '+stN(ns)+'. Assignee and reviewer notified.');renderAll();return true;
}
function addComment(t,kind){
  const ta=$('#cmt'),tx=ta?ta.value.trim():'';
  if(kind==='changes'&&!tx)return toast('Add a comment describing the changes first.');
  if(kind==='changes'){const ok=setStatus(t,'changes',tx);if(ok)S.draft[t.id]='';return}
  if(kind==='approve'){const ok=setStatus(t,'approved',tx||'Approved.');if(ok)S.draft[t.id]='';return}
  if(!tx)return;
  t.comments.push({u:S.me,at:nowS(),tx:tx,kind:''});S.draft[t.id]='';
  const mm=tx.match(/@([A-Za-z]+)/g);if(mm)toast('Notified '+mm.join(', '));
  logA(t,'commented');renderAll();
}
function modal(html){const m=$('#modal');m.innerHTML='<div class="modal" role="dialog" aria-modal="true">'+html+'</div>';m.hidden=false}
function closeModal(){$('#modal').hidden=true;$('#modal').innerHTML=''}
function newTaskModal(pre){
  pre=pre||{};const vs=visSpaces();if(!vs.length)return toast(can('manage')?'Create a space first with the + next to Spaces.':'You have not been given access to any space yet.');const sid=pre.sp||(S.sp!=='all'&&vs.some(s=>s.id===S.sp)?S.sp:vs[0].id);
  const fopts=id=>{const fs=folders.filter(f=>f.sp===id).sort((a,b)=>a.ym<b.ym?-1:1);if(!fs.some(f=>f.ym===CUR_YM))fs.push({id:id+'-'+CUR_YM,ym:CUR_YM,name:ymName(CUR_YM)});return fs.map(f=>'<option value="'+f.id+'"'+(f.id===(S.fo!=='all'&&S.fo.indexOf(id+'-')===0?S.fo:id+'-'+CUR_YM)?' selected':'')+'>'+esc(f.name)+'</option>').join('')};
  modal('<h3>New task</h3><form data-form="newtask" style="display:flex;flex-direction:column;gap:12px"><label class="fld">Title<input type="text" name="title" required value="'+esc(pre.title||'')+'" placeholder="What needs to be done?"></label>'
   +'<div class="two"><label class="fld">Space<select name="sp">'+vs.map(s=>'<option value="'+s.id+'"'+(s.id===sid?' selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select></label><label class="fld">Monthly folder<select name="fo">'+fopts(sid)+'</select></label>'
   +'<label class="fld">Assignee<select name="as">'+activeUsers().map(u=>'<option value="'+u.id+'"'+(u.id===S.me?' selected':'')+'>'+esc(u.name)+(u.role==='external'?' (external)':'')+'</option>').join('')+'</select></label><label class="fld">Reviewer<select name="rv"><option value="">No reviewer</option>'+activeUsers().filter(u=>['admin','manager','reviewer'].includes(u.role)).map(u=>'<option value="'+u.id+'">'+esc(u.name)+'</option>').join('')+'</select></label>'
   +'<label class="fld">Start date<input type="date" name="start" value="'+TODAY+'"></label><label class="fld">Due date<input type="date" name="due" value="'+addDays(TODAY,7)+'"></label>'
   +'<label class="fld">Priority<select name="pri"><option value="medium">Medium</option><option value="urgent">Urgent</option><option value="high">High</option><option value="low">Low</option></select></label>'
   +'<label class="fld">Campaign (optional)<select name="camp"><option value="">None</option>'+campaigns.map(c=>'<option value="'+c.id+'"'+(pre.camp===c.id?' selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></label></div>'
   +'<label class="fld">Brief<textarea name="brief" rows="3" placeholder="Describe the task, goals and references">'+esc(pre.brief||'')+'</textarea></label><div class="foot"><button type="button" class="btn" data-act="closeModal">Cancel</button><button type="submit" class="btn primary">Create task</button></div></form>');
}
function mentionCheck(el){
  const box=$('#mbox'),v=el.value.slice(0,el.selectionStart),m=v.match(/@([A-Za-z]*)$/);
  if(!m){box.hidden=true;return}
  const q=m[1].toLowerCase(),list=users.filter(u=>u.name.toLowerCase().split(' ').some(p=>p.indexOf(q)===0)).slice(0,5);
  if(!list.length){box.hidden=true;return}
  box.innerHTML=list.map(u=>'<button type="button" data-act="ment" data-u="'+u.id+'">'+av(u)+'<span>'+esc(u.name)+'</span><em>'+ROLES[u.role]+'</em></button>').join('');
  const r=el.getBoundingClientRect();box.style.left=Math.max(8,r.left)+'px';box.style.bottom=(innerHeight-r.top+6)+'px';box.hidden=false;S.mEl=el;
}
function csv(){
  const d=reportData();const rows=[[cap(S.rby),'Hours','Entries']];
  d.rows.forEach(r=>{const n=S.rby==='person'?uById(r.k).name:S.rby==='space'?spById(r.k).name:'#'+tById(r.k).n+' '+tById(r.k).title;rows.push([n,hrs(r.secs),r.n])});
  const txt=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const ok=()=>toast('CSV for '+ymName(S.rm)+' copied. Paste it into Excel or Sheets.');
  const fb=()=>{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok()}catch(e){toast('Copy is blocked here. Select the table and copy it instead.')}ta.remove()};
  try{navigator.clipboard.writeText(txt).then(ok,fb)}catch(e){fb()}
}

document.addEventListener('click',function(e){
  const ds=e.target.closest('[data-stop]');if(ds){e.stopPropagation();return}
  if(S.bell&&!e.target.closest('.pop')&&!e.target.closest('[data-act="bell"]')){S.bell=false;renderTop()}
  if(e.target===$('#modal'))return closeModal();
  const el=e.target.closest('[data-act]');if(!el)return;
  const a=el.dataset.act,id=el.dataset.id,t=S.drawer&&S.drawer.type==='task'?tById(S.drawer.id):null,v=S.drawer&&S.drawer.type==='lib'?lib.find(x=>x.id===S.drawer.id):null;
  if(a==='open'){e.preventDefault();openD('task',id);return}
  if(a==='openLib'){openD('lib',id);return}
  switch(a){
   case 'openSide':$('#app').classList.add('menu');break;
   case 'closeSide':$('#app').classList.remove('menu');break;
   case 'nav':S.fx=null;S.view=el.dataset.v;S.q='';$('#q').value='';S.drawer=null;S.chatOpen=false;$('#app').classList.remove('menu');renderAll();break;
   case 'mine':S.fx=null;S.view='tasks';S.sp='all';S.fo='all';S.fa=S.me;S.layout='list';S.q='';$('#q').value='';$('#app').classList.remove('menu');renderAll();break;
   case 'space':S.fx=null;S.view='tasks';S.sp=id;S.fo='all';S.fa='all';S.layout='board';$('#app').classList.remove('menu');renderAll();break;
   case 'folder':S.view='tasks';S.fo=id;$('#app').classList.remove('menu');renderAll();break;
   case 'layout':S.layout=el.dataset.v;renderMain();break;
   case 'theme':{const r=document.documentElement,dark=r.dataset.theme==='dark'||(r.dataset.theme!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);r.dataset.theme=dark?'light':'dark';break}
   case 'bell':S.bell=!S.bell;renderTop();break;
   case 'closeDrawer':S.drawer=null;S.pend=null;renderDrawer();break;
   case 'closeModal':closeModal();break;
   case 'newTask':newTaskModal();break;
   case 'newSpace':modal('<h3>New space</h3><form data-form="newspace" style="display:flex;flex-direction:column;gap:12px"><label class="fld">Space name<input type="text" name="name" required placeholder="For example, Podcast Studio"></label><div class="fld">Colour<div class="sw">'+['#D9433B','#D97A1E','#2A7DE1','#8A5CD6','#1B9E77','#0F8B9E','#C2417A'].map((c,i)=>'<label><input type="radio" name="color" value="'+c+'"'+(i===2?' checked':'')+'><span style="background:'+c+'"></span></label>').join('')+'</div></div><label class="fld">Start from<select name="tpl"><option value="">Blank space with a '+MN[+CUR_YM.slice(5)-1]+' folder</option>'+spaces.map(s=>'<option value="'+s.id+'">Copy structure of '+esc(s.name)+'</option>').join('')+'</select></label><div class="foot"><button type="button" class="btn" data-act="closeModal">Cancel</button><button type="submit" class="btn primary">Create space</button></div></form>');break;
   case 'newMonth':{if(S.sp==='all')return toast('Open a space first.');const fs=folders.filter(f=>f.sp===S.sp);const nx=fs.length?nextYm(fs.map(f=>f.ym).sort().slice(-1)[0]):CUR_YM;const rc=tasks.filter(x=>x.sp===S.sp&&x.recurring).length;modal('<h3>Create '+ymName(nx)+'</h3><form data-form="newmonth"><p class="muted" style="margin:0 0 12px">Adds a monthly folder to '+esc(spById(S.sp).name)+'.</p><label class="ck"><input type="checkbox" name="rec" checked><span>Copy '+rc+' recurring task'+(rc===1?'':'s')+' into the new folder</span></label><input type="hidden" name="ym" value="'+nx+'"><div class="foot" style="margin-top:14px"><button type="button" class="btn" data-act="closeModal">Cancel</button><button type="submit" class="btn primary">Create folder</button></div></form>');break}
   case 'startt':startTimer(id||t.id);break;
   case 'stopt':stopTimer();break;
   case 'tab':S.tab=el.dataset.v;renderDrawer();break;
   case 'rmAs':t.as=t.as.filter(x=>x!==el.dataset.u);logA(t,'removed '+uById(el.dataset.u).name);renderAll();break;
   case 'addSub':{const i=$('#subIn');if(i&&i.value.trim()){t.subs.push({t:i.value.trim(),d:0});logA(t,'added a subtask');renderAll()}break}
   case 'addChk':{const i=$('#chkIn');if(i&&i.value.trim()){t.check.push({t:i.value.trim(),d:0});renderAll()}break}
   case 'saveDrive':{const i=$('#driveIn');if(i&&/^https?:\/\//.test(i.value.trim())){t.drive=i.value.trim();logA(t,'added a Drive link');renderAll();toast('Drive link saved on the task.')}else toast('Paste a full link that starts with https://');break}
   case 'attach':$('#taskFile').click();break;
   case 'rmFile':t.files.splice(+el.dataset.i,1);renderAll();break;
   case 'addVl':{const l=$('#vlLabel'),u=$('#vlUrl');if(u&&/^https?:\/\//.test(u.value.trim())){const ty=detect(u.value);t.vlinks.push({label:(l.value.trim()||ltName[ty]+' link'),type:ty,url:u.value.trim()});logA(t,'added a video link');renderAll()}else toast('Paste a full link that starts with https://');break}
   case 'rmVl':t.vlinks.splice(+el.dataset.i,1);renderAll();break;
   case 'addTime':{const h=parseFloat($('#mH').value);if(!(h>0))return toast('Enter the hours worked.');entries.push({id:'e'+uid(),tid:t.id,uid:S.me,date:TODAY,secs:Math.round(h*3600),note:$('#mN').value.trim()||'Manual entry',bill:1});logA(t,'logged '+hm(h*3600)+' manually');renderAll();break}
   case 'comment':addComment(t,'');break;
   case 'approve':addComment(t,'approve');break;
   case 'reqChanges':addComment(t,'changes');break;
   case 'pendOk':{const x=$('#pendTx').value.trim();if(!x)return toast('Add a comment describing the changes.');setStatus(t,'changes',x);break}
   case 'pendNo':S.pend=null;renderDrawer();break;
   case 'ment':{const ta=S.mEl;if(ta){const u=uById(el.dataset.u),p=ta.selectionStart,val=ta.value,s=val.slice(0,p).replace(/@[A-Za-z]*$/,'@'+first(u)+' ');ta.value=s+val.slice(p);ta.focus();ta.selectionStart=ta.selectionEnd=s.length;ta.dispatchEvent(new Event('input',{bubbles:true}))}$('#mbox').hidden=true;break}
   case 'channel':S.ch=id;S.chatOpen=true;S.reply=null;renderMain();break;
   case 'chatBack':S.chatOpen=false;renderMain();break;
   case 'send':{const ta=$('#chatIn');const tx=ta.value.trim();if(!tx)return;S.focusChat=true;sendMsg({tx:tx});break}
   case 'voice':S.focusChat=true;sendMsg({tx:'',media:{type:'voice',dur:'0:'+String(7+Math.floor(Math.random()*26)).padStart(2,'0')}});break;
   case 'chatAttach':$('#chatFile').click();break;
   case 'react':{const m=messages.find(x=>x.id===id),e2=el.dataset.e;const l=m.react[e2]||(m.react[e2]=[]);const i=l.indexOf(S.me);if(i>-1)l.splice(i,1);else l.push(S.me);renderMain();break}
   case 'reply':S.reply=id;S.focusChat=true;renderMain();break;
   case 'cancelReply':S.reply=null;renderMain();break;
   case 'pin':{const m=messages.find(x=>x.id===id);m.pin=!m.pin;renderMain();break}
   case 'msg2task':{const m=messages.find(x=>x.id===id),c=channels.find(x=>x.id===m.ch);newTaskModal({title:(m.tx||'Follow up from chat').slice(0,80),brief:'Created from a chat message by '+uById(m.u).name+': '+(m.tx||''),sp:c.sp&&visSpaces().some(s=>s.id===c.sp)?c.sp:null});break}
   case 'libUpload':$('#libFile').click();break;
   case 'addLvl':{const l=$('#lvLabel'),u=$('#lvUrl');if(u&&/^https?:\/\//.test(u.value.trim())){const ty=detect(u.value);v.links.push({label:l.value.trim()||ltName[ty]+' link',type:ty,url:u.value.trim()});renderAll()}else toast('Paste a full link that starts with https://');break}
   case 'rmLvl':v.links.splice(+el.dataset.i,1);renderAll();break;
   case 'addTs':{const a1=$('#tsIn').value.trim(),b1=$('#tsTx').value.trim();if(!/^\d{1,2}(:\d{2}){1,2}$/.test(a1)||!b1)return toast('Add a timestamp like 00:02:15 and a note.');v.cm.push({ts:a1.split(':').length===2?'00:'+a1.padStart(5,'0'):a1,u:S.me,tx:b1,d:0});renderAll();break}
   case 'resolve':v.cm[+el.dataset.i].d=1;renderDrawer();break;
   case 'libApprove':v.st=v.st==='Raw'?'Edited':v.st==='Edited'?'Final':v.st;toast('Version v'+v.ver+' approved. Status is now '+v.st+'.');renderAll();break;
   case 'libChanges':toast('Add a timestamped comment above to tell the editor what to change.');break;
   case 'rby':S.rby=el.dataset.v;renderMain();break;
   case 'csv':csv();break;
   case 'revoke':S.invites.splice(+el.dataset.i,1);toast('Invite revoked.');renderMain();queueSync();break;
   case 'flag':if(can('manage')){S.flags[el.dataset.k]=!S.flags[el.dataset.k];renderMain()}break;
  }
});
document.addEventListener('change',function(e){
  const el=e.target,f=el.dataset.f;
  if(el.id==='viewas'){S.me=el.value;const r=me().role;if((S.view==='chat'&&r==='external')||(S.view==='time'&&r==='external')||(S.view==='team'&&r==='external'))S.view='dashboard';
    if(!visSpaces().some(s=>s.id===S.sp)){S.sp='all';S.fo='all'}S.fa='all';S.dsp='all';S.dpe='all';S.drawer=null;S.pend=null;renderAll();toast('Now viewing as '+me().name+' ('+ROLES[r]+')');return}
  if(el.name==='sp'&&el.closest('[data-form=newtask]')){const sel=$('select[name=fo]',el.closest('form'));const fs=folders.filter(x=>x.sp===el.value).sort((a,b)=>a.ym<b.ym?-1:1);if(!fs.some(f=>f.ym===CUR_YM))fs.push({id:el.value+'-'+CUR_YM,ym:CUR_YM,name:ymName(CUR_YM)});sel.innerHTML=fs.map(x=>'<option value="'+x.id+'"'+(x.ym===CUR_YM?' selected':'')+'>'+esc(x.name)+'</option>').join('');return}
  if(!f)return;
  if(['fa','fp','dsp','dpe','ls','lst','rm','cst'].includes(f)){S[f]=el.value;renderMain();return}
  const t=S.drawer&&S.drawer.type==='task'?tById(S.drawer.id):null;if(!t)return;
  if(f==='st'){if(!setStatus(t,el.value))renderDrawer();return}
  if(f==='addAs'){if(el.value){t.as.push(el.value);logA(t,'assigned '+uById(el.value).name);toast(uById(el.value).name+' was notified.');renderAll()}return}
  if(f==='subd'){t.subs[+el.dataset.i].d=el.checked?1:0;renderAll();return}
  if(f==='chkd'){t.check[+el.dataset.i].d=el.checked?1:0;renderAll();return}
  if(f==='est'){t.est=parseFloat(el.value)||0;renderAll();return}
  if(f==='title'&&!el.value.trim()){renderDrawer();return}
  t[f]=el.value;logA(t,'updated '+({title:'the title',pri:'the priority',start:'the start date',due:'the due date',rv:'the reviewer',brief:'the brief'}[f]||f));renderAll();
});
document.addEventListener('input',function(e){
  const el=e.target;
  if(el.id==='q'){S.q=el.value;if(S.view!=='tasks'&&S.q){S.view='tasks';S.sp='all';S.fo='all';S.layout='list';renderSide();renderTop()}if(S.view==='tasks')renderMain();return}
  if(el.id==='cmt'&&S.drawer)S.draft[S.drawer.id]=el.value;
  if(el.id==='chatIn'){S.chatDraft=el.value;el.style.height='36px';el.style.height=Math.min(120,el.scrollHeight)+'px'}
  if(el.dataset.mention)mentionCheck(el);
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){if(!$('#modal').hidden)closeModal();else if(S.drawer){S.drawer=null;S.pend=null;renderDrawer()}$('#mbox').hidden=true;return}
  if(e.key==='Enter'&&e.target.id==='chatIn'&&!e.shiftKey){e.preventDefault();const tx=e.target.value.trim();if(tx){S.focusChat=true;sendMsg({tx:tx})}return}
  if(e.key==='Enter'&&(e.target.id==='subIn'||e.target.id==='chkIn')){e.preventDefault();const t=tById(S.drawer.id),v=e.target.value.trim();if(v){(e.target.id==='subIn'?t.subs:t.check).push({t:v,d:0});renderAll()}return}
  if(e.key==='Enter'&&e.target.classList&&e.target.classList.contains('card')){openD('task',e.target.dataset.id)}
});
document.addEventListener('submit',function(e){
  const f=e.target.dataset.form;if(!f)return;e.preventDefault();const d=new FormData(e.target);
  if(f==='newtask'){
    const ym=d.get('fo').slice(d.get('sp').length+1);ensureFolder(d.get('sp'),ym);
    const t=T(d.get('sp'),ym,d.get('title').trim(),'todo',d.get('pri'),d.get('as'),d.get('rv'),d.get('start'),d.get('due'),{brief:d.get('brief'),camp:d.get('camp')||'',log:[{u:S.me,tx:'created this task',at:nowS()}]});
    tasks.push(t);closeModal();S.view='tasks';S.sp=t.sp;S.fo=t.fo;renderAll();openD('task',t.id);toast('Task #'+t.n+' created'+(d.get('as')&&d.get('as')!==S.me?' and '+uById(d.get('as')).name+' was notified':'')+'.');
  }else if(f==='newspace'){
    const name=d.get('name').trim(),id='sp'+Date.now(),tpl=d.get('tpl');
    spaces.push({id:id,name:name,short:name.length>18?name.slice(0,16)+'…':name,color:d.get('color')});
    const yms=tpl?folders.filter(x=>x.sp===tpl).map(x=>x.ym):[CUR_YM];if(!yms.includes(CUR_YM))yms.push(CUR_YM);yms.forEach(ym=>folders.push({id:id+'-'+ym,sp:id,ym:ym,name:ymName(ym)}));channels.push({id:'c-'+id,name:name,kind:'group',sp:id});
    closeModal();S.view='tasks';S.sp=id;S.fo='all';renderAll();toast('Space “'+name+'” created. Add members and tasks next.');
  }else if(f==='newmonth'){
    const ym=d.get('ym'),sp=S.sp;folders.push({id:sp+'-'+ym,sp:sp,ym:ym,name:ymName(ym)});let n=0;
    if(d.get('rec'))tasks.filter(x=>x.sp===sp&&x.recurring).forEach(x=>{const c=T(sp,ym,x.title,'todo',x.pri,x.as.slice(),x.rv,addMonth(x.start),addMonth(x.due),{brief:x.brief,tags:x.tags.slice(),est:x.est,recurring:true,subs:x.subs.map(s=>({t:s.t,d:0}))});tasks.push(c);n++});
    closeModal();S.fo=sp+'-'+ym;renderAll();toast(ymName(ym)+' created'+(n?' with '+n+' recurring task'+(n>1?'s':''):'')+'.');
  }else if(f==='time'){
    const h=parseFloat(d.get('h'));if(!(h>0))return;entries.push({id:'e'+uid(),tid:d.get('tid'),uid:S.me,date:TODAY,secs:Math.round(h*3600),note:(d.get('note')||'Manual entry').trim(),bill:1});S.rm=CUR_YM;renderMain();toast('Logged '+hm(h*3600)+'.');
  }else if(f==='invite'){
    const sc=d.getAll('sp');const inv={id:'i'+uid(),email:String(d.get('email')).trim().toLowerCase(),name:d.get('name'),role:d.get('role'),sp:sc.length?sc:'all',scope:sc.length?sc.map(x=>spById(x).name).join(', '):'All spaces',exp:d.get('exp')};S.invites.push(inv);renderMain();queueSync();copyText(inviteText(inv),'Invite saved. Message with the sign-up link copied, paste it on WhatsApp or email.');
  }
});
/* drag and drop on the board */
document.addEventListener('dragstart',function(e){const c=e.target.closest&&e.target.closest('.card[data-id]');if(c){e.dataTransfer.setData('text/plain',c.dataset.id);e.dataTransfer.effectAllowed='move';c.classList.add('drag')}});
document.addEventListener('dragend',function(){$$('.drag').forEach(x=>x.classList.remove('drag'));$$('.over').forEach(x=>x.classList.remove('over'))});
document.addEventListener('dragover',function(e){const c=e.target.closest&&e.target.closest('.col');if(c){e.preventDefault();$$('.over').forEach(x=>{if(x!==c)x.classList.remove('over')});c.classList.add('over')}
  const dz=e.target.closest&&e.target.closest('#drop');if(dz){e.preventDefault();dz.classList.add('hot')}});
document.addEventListener('drop',function(e){
  const c=e.target.closest&&e.target.closest('.col');
  if(c){e.preventDefault();$$('.over').forEach(x=>x.classList.remove('over'));const t=tById(e.dataTransfer.getData('text/plain'));if(t)setStatus(t,c.dataset.st);return}
  const dz=e.target.closest&&e.target.closest('#drop');
  if(dz){e.preventDefault();dz.classList.remove('hot');if(e.dataTransfer.files[0])addLibFile(e.dataTransfer.files[0])}
});
document.addEventListener('dragleave',function(e){const dz=e.target.closest&&e.target.closest('#drop');if(dz&&!dz.contains(e.relatedTarget))dz.classList.remove('hot')});
$('#mbox').addEventListener('mousedown',e=>e.preventDefault());

/* file inputs */
$('#chatFile').addEventListener('change',async function(e){
  const f=e.target.files[0];e.target.value='';if(!f)return;S.focusChat=true;
  if(f.size>MAX_MB*1e6)return toast('That file is over '+MAX_MB+' MB. Share a Drive link instead.');
  toast('Uploading '+f.name+'…');
  const path=await upload(f,'chat');if(!path)return;
  const type=/^image\//.test(f.type)?'image':/^video\//.test(f.type)?'video':'file';
  sendMsg({tx:'',media:{type:type,name:f.name,size:sizeStr(f.size),path:path,hue:hueOf(f.name)}});
});
$('#taskFile').addEventListener('change',async function(e){
  const f=e.target.files[0];e.target.value='';if(!f||!S.drawer)return;const t=tById(S.drawer.id);if(!t)return;
  if(f.size>MAX_MB*1e6)return toast('That file is over '+MAX_MB+' MB. Paste a Drive link instead.');
  const rec={name:f.name,size:sizeStr(f.size),up:1};t.files.push(rec);renderDrawer();
  const path=await upload(f,'tasks/'+t.id);
  if(!path){t.files.splice(t.files.indexOf(rec),1);renderAll();return}
  delete rec.up;rec.path=path;logA(t,'attached '+f.name);renderAll();toast('Attached '+f.name+'.');
});
const localSrc={};
async function addLibFile(f,existing){
  if(!/^(video|audio)\//.test(f.type)){toast('Choose a video or audio file.');return}
  if(f.size>MAX_MB*1e6){toast('That file is over '+MAX_MB+' MB. Upload it to Drive and add the link with "Add with links".');return}
  const vs=visSpaces();if(!vs.length)return toast('No space available yet.');
  const v=existing||{id:'v'+uid(),title:f.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' '),sp:S.ls!=='all'?S.ls:vs[0].id,kind:/^audio/.test(f.type)?'audio':'video',ep:'New',guest:'To add',rec:TODAY,st:'Raw',ver:1,dur:'...',pub:'',views:null,likes:null,task:null,path:'',links:[],cm:[],by:S.me};
  if(existing){v.ver++;v.st='Raw'}else lib.unshift(v);
  localSrc[v.id]=URL.createObjectURL(f);S.uploading[v.id]=5;renderMain();if(existing)renderDrawer();
  const probe=document.createElement(v.kind==='audio'?'audio':'video');probe.preload='metadata';probe.src=localSrc[v.id];
  probe.onloadedmetadata=()=>{const s=Math.round(probe.duration||0);if(s)v.dur=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
  const iv=setInterval(()=>{S.uploading[v.id]=Math.min(92,(S.uploading[v.id]||5)+4);const b=$('[data-up="'+v.id+'"]');if(b)b.style.width=S.uploading[v.id]+'%'},400);
  const path=await upload(f,'library/'+v.id);
  clearInterval(iv);delete S.uploading[v.id];
  if(!path){if(!existing)lib.splice(lib.indexOf(v),1);renderAll();return}
  const old=v.path;v.path=path;v.file=f.name;if(old)sb.storage.from(BUCKET).remove([old]);
  renderAll();toast('Uploaded '+f.name+' as v'+v.ver+'.');
}
$('#libFile').addEventListener('change',function(e){const f=e.target.files[0];e.target.value='';if(!f)return;const v=S.libVersionFor?lib.find(x=>x.id===S.libVersionFor):null;S.libVersionFor=null;addLibFile(f,v)});

/* live timer clocks */
setInterval(function(){
  if(!S.timer)return;
  $$('[data-clock]').forEach(n=>{const id=n.dataset.clock;n.textContent=clock(taskSecs(id)+(S.timer.tid===id?elapsed():0))});
  const p=$('[data-pill]');if(p)p.textContent=clock(elapsed());
},1000);

/* =====================================================================
   FinStreet additions: storage, sync with Supabase, realtime,
   campaigns, add / edit / delete everywhere, invites, CSV, voice notes
   ===================================================================== */
const BUCKET='task-files';
const MAX_MB=ctx.maxMb||50;
const urlCache={},urlPending={};
function fileUrl(path){
  if(!path)return '';
  const c=urlCache[path];if(c&&c.exp>Date.now())return c.url;
  if(!urlPending[path]){urlPending[path]=1;
    sb.storage.from(BUCKET).createSignedUrl(path,6*3600).then(({data})=>{delete urlPending[path];if(data&&data.signedUrl){urlCache[path]={url:data.signedUrl,exp:Date.now()+5.5*3600e3};softRender()}});}
  return '';
}
async function upload(file,folder){
  const clean=file.name.replace(/[^\w.\-]+/g,'_').slice(-80);
  const path='hub/'+folder+'/'+uid()+'-'+clean;
  const {error}=await sb.storage.from(BUCKET).upload(path,file,{contentType:file.type||undefined,upsert:false});
  if(error){toast('Upload failed: '+error.message);return null}
  return path;
}
function ensureFolder(sp,ym){if(!folders.some(f=>f.id===sp+'-'+ym))folders.push({id:sp+'-'+ym,sp:sp,ym:ym,name:ymName(ym)})}
function copyText(txt,msg){
  const ok=()=>toast(msg||'Copied.');
  const fb=()=>{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');ok()}catch(e){toast('Copy was blocked. '+txt)}ta.remove()};
  try{navigator.clipboard.writeText(txt).then(ok,fb)}catch(e){fb()}
}
const inviteText=v=>'Hi '+v.name+', you are invited to the FinStreet Marketing Hub. Sign up here with '+v.email+': '+location.origin+'/login?signup=1';
function download(name,text,type){const b=new Blob([text],{type:type||'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
const csvCell=c=>{let s=String(c==null?'':c);if(/^[=+\-@]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
function confirmBox(title,text,okLabel,fn){S.confirmFn=fn;modal('<h3>'+esc(title)+'</h3><p class="muted" style="margin:0 0 14px">'+esc(text)+'</p><div class="foot"><button type="button" class="btn" data-act="closeModal">Cancel</button><button type="button" class="btn danger" data-act="confirmOk">'+esc(okLabel)+'</button></div>')}
const rupee=n=>n||n===0?'₹'+Number(n).toLocaleString('en-IN'):'-';

/* ---------- campaigns ---------- */
const CST=['Planned','Live','Paused','Completed'];
const cCls={Planned:'todo',Live:'progress',Paused:'hold',Completed:'completed'};
const PLATFORMS=['Meta Ads','Google Ads','YouTube Ads','LinkedIn Ads','Instagram (organic)','YouTube (organic)','Email','WhatsApp','SMS','Offline / Event','Influencer','Other'];
const RESULT_TYPES=['Leads','Registrations','Sales','Views','Clicks','Followers'];
function vCamps(){
  const cs=campaigns.filter(c=>S.cst==='all'||c.st===S.cst).sort((a,b)=>(b.start||'')<(a.start||'')?-1:1);
  const live=campaigns.filter(c=>c.st==='Live'),bud=campaigns.reduce((a,c)=>a+(+c.budget||0),0),spent=campaigns.reduce((a,c)=>a+(+c.spent||0),0),res=campaigns.reduce((a,c)=>a+(+c.result||0),0),tgt=campaigns.reduce((a,c)=>a+(+c.target||0),0);
  let h='<div class="pagehead"><div class="grow"><h2>Campaigns</h2><p>Paid, organic and offline campaigns, kept separate from spaces. Link tasks to a campaign to see all its work in one place.</p></div>'
   +'<select data-f="cst" aria-label="Status"><option value="all">Any status</option>'+CST.map(x=>'<option'+(S.cst===x?' selected':'')+'>'+x+'</option>').join('')+'</select>'
   +(can('create')?'<button class="btn primary" data-act="newCamp">'+ic('plus')+'New campaign</button>':'')+'</div>';
  h+='<div class="grid g4"><div class="kpi"><span>Live campaigns</span><b>'+live.length+'</b><small>'+campaigns.length+' in total</small></div><div class="kpi"><span>Total budget</span><b>'+rupee(bud)+'</b><small>across all campaigns</small></div><div class="kpi'+(bud&&spent>bud?' bad':'')+'"><span>Spent</span><b>'+rupee(spent)+'</b><small>'+(bud?Math.round(spent/bud*100):0)+'% of budget</small></div><div class="kpi"><span>Results</span><b>'+res.toLocaleString('en-IN')+'</b><small>'+(tgt?Math.round(res/tgt*100)+'% of target '+tgt.toLocaleString('en-IN'):'no target set')+'</small></div></div>';
  h+='<div class="tbl-wrap"><table style="min-width:980px"><thead><tr><th>Campaign</th><th>Platform</th><th>Status</th><th>Owner</th><th>Dates</th><th style="width:18%">Budget used</th><th class="num">Results</th><th class="num">Tasks</th></tr></thead><tbody>'
   +(cs.length?cs.map(c=>{const ts=tasks.filter(t=>t.camp===c.id),dn=ts.filter(t=>t.st==='approved'||t.st==='completed').length,b=+c.budget||0,sp=+c.spent||0;return '<tr class="click" data-act="openCamp" data-id="'+c.id+'"><td class="t-title">'+esc(c.name)+'<div class="muted" style="font-size:12px;font-weight:400">'+esc(c.objective||'')+'</div></td><td>'+esc(c.platform||'-')+'</td><td><span class="pill st-'+(cCls[c.st]||'todo')+'">'+esc(c.st)+'</span></td><td>'+(c.owner?av(uById(c.owner)):'-')+'</td><td class="mono" style="white-space:nowrap">'+(c.start?dd(c.start):'-')+' – '+(c.end?dd(c.end):'-')+'</td><td><div class="trk" title="'+rupee(sp)+' of '+rupee(b)+'"><i style="width:'+(b?Math.min(100,sp/b*100):0)+'%;background:'+(b&&sp>b?'var(--danger)':'var(--accent)')+'"></i></div><small class="muted mono">'+rupee(sp)+' / '+rupee(b)+'</small></td><td class="num">'+(c.result||0).toLocaleString('en-IN')+(c.target?' / '+(+c.target).toLocaleString('en-IN'):'')+'<div class="muted" style="font-size:11.5px">'+esc(c.rtype||'')+'</div></td><td class="num">'+dn+'/'+ts.length+'</td></tr>'}).join(''):'<tr><td colspan="8"><div class="empty">'+(campaigns.length?'No campaigns with this status.':'No campaigns yet. Press <b>New campaign</b> to plan your first one.')+'</div></td></tr>')
   +'</tbody></table></div>';
  return h;
}
function dCamp(c){
  const ed=can('create'),dis=ed?'':' disabled',ts=tasks.filter(t=>t.camp===c.id);
  const sel=(k,list)=>'<select data-c="'+k+'"'+dis+'>'+list.map(x=>'<option'+(c[k]===x?' selected':'')+'>'+esc(x)+'</option>').join('')+'</select>';
  return '<div class="dh"><div class="crumb">'+ic('target',14)+' Campaigns <span>/</span> '+esc(c.platform||'')+'</div>'+(can('manage')||c.by===S.me?'<button class="ibtn" data-act="delCamp" aria-label="Delete campaign" title="Delete campaign">'+ic('trash',16)+'</button>':'')+'<button class="ibtn" data-act="closeDrawer" aria-label="Close">'+ic('x')+'</button></div><div class="dbody">'
   +'<input class="d-title" data-c="name" value="'+esc(c.name)+'"'+dis+' aria-label="Campaign name">'
   +'<div class="props"><label class="fld">Status'+sel('st',CST)+'</label><label class="fld">Platform'+sel('platform',PLATFORMS)+'</label>'
   +'<label class="fld">Owner<select data-c="owner"'+dis+'><option value="">-</option>'+activeUsers().map(u=>'<option value="'+u.id+'"'+(c.owner===u.id?' selected':'')+'>'+esc(u.name)+'</option>').join('')+'</select></label>'
   +'<label class="fld">Start date<input type="date" data-c="start" value="'+esc(c.start||'')+'"'+dis+'></label><label class="fld">End date<input type="date" data-c="end" value="'+esc(c.end||'')+'"'+dis+'></label>'
   +'<label class="fld">Result type'+sel('rtype',RESULT_TYPES)+'</label>'
   +'<label class="fld">Budget, ₹<input type="number" min="0" data-c="budget" value="'+(c.budget||'')+'"'+dis+'></label><label class="fld">Spent, ₹<input type="number" min="0" data-c="spent" value="'+(c.spent||'')+'"'+dis+'></label>'
   +'<label class="fld">Target<input type="number" min="0" data-c="target" value="'+(c.target||'')+'"'+dis+'></label><label class="fld">Results so far<input type="number" min="0" data-c="result" value="'+(c.result||'')+'"'+dis+'></label>'
   +'<label class="fld" style="grid-column:span 2">Link / UTM<input type="text" data-c="link" value="'+esc(c.link||'')+'"'+dis+' placeholder="Landing page or UTM"></label></div>'
   +'<div class="sec"><h4>Objective</h4><textarea data-c="objective" rows="2"'+dis+' placeholder="What should this campaign achieve?">'+esc(c.objective||'')+'</textarea></div>'
   +'<div class="sec"><h4>Notes</h4><textarea data-c="notes" rows="3"'+dis+' placeholder="Audience, creatives, learnings">'+esc(c.notes||'')+'</textarea></div>'
   +'<div class="sec"><h4>Tasks for this campaign<span>'+ts.length+'</span></h4>'+(ts.length?ts.map(t=>'<div class="li" data-act="open" data-id="'+t.id+'"><i class="dot" style="background:'+spById(t.sp).color+'"></i><div class="tt"><b>#'+t.n+' '+esc(t.title)+'</b><small>'+esc(spById(t.sp).name)+' · Due '+dd(t.due)+'</small></div>'+avs(t.as)+stPill(t.st)+'</div>').join(''):'<div class="muted" style="font-size:13px">No tasks linked yet.</div>')
   +(ed?'<div class="addrow"><button class="btn primary" data-act="campTask">'+ic('plus',15)+'New task for this campaign</button><select id="linkT" aria-label="Link an existing task"><option value="">Link an existing task…</option>'+visTasks().filter(t=>t.camp!==c.id).map(t=>'<option value="'+t.id+'">#'+t.n+' '+esc(t.title)+'</option>').join('')+'</select></div>':'')+'</div>'
   +'</div>';
}

/* ---------- extra actions ---------- */
document.addEventListener('click',function(e){
  const el=e.target.closest('[data-act]');if(!el)return;
  const a=el.dataset.act,id=el.dataset.id;
  const t=S.drawer&&S.drawer.type==='task'?tById(S.drawer.id):null,v=S.drawer&&S.drawer.type==='lib'?lib.find(x=>x.id===S.drawer.id):null,c=S.drawer&&S.drawer.type==='camp'?campaigns.find(x=>x.id===S.drawer.id):null;
  switch(a){
   case 'logout':sb.auth.signOut().then(()=>{location.href='/login'});break;
   case 'confirmOk':{const fn=S.confirmFn;S.confirmFn=null;closeModal();if(fn)fn();break}
   case 'openCamp':openD('camp',id);break;
   case 'newCamp':modal('<h3>New campaign</h3><form data-form="newcamp" style="display:flex;flex-direction:column;gap:12px"><label class="fld">Campaign name<input type="text" name="name" required placeholder="For example, Wealth Workshop November leads"></label><div class="two"><label class="fld">Platform<select name="platform">'+PLATFORMS.map(x=>'<option>'+x+'</option>').join('')+'</select></label><label class="fld">Owner<select name="owner">'+activeUsers().map(u=>'<option value="'+u.id+'"'+(u.id===S.me?' selected':'')+'>'+esc(u.name)+'</option>').join('')+'</select></label><label class="fld">Start date<input type="date" name="start" value="'+TODAY+'"></label><label class="fld">End date<input type="date" name="end" value="'+addDays(TODAY,14)+'"></label><label class="fld">Budget, ₹<input type="number" min="0" name="budget" placeholder="50000"></label><label class="fld">Target<input type="number" min="0" name="target" placeholder="500"></label><label class="fld">Result type<select name="rtype">'+RESULT_TYPES.map(x=>'<option>'+x+'</option>').join('')+'</select></label><label class="fld">Status<select name="st">'+CST.map(x=>'<option>'+x+'</option>').join('')+'</select></label></div><label class="fld">Objective<textarea name="objective" rows="2" placeholder="What should this campaign achieve?"></textarea></label><div class="foot"><button type="button" class="btn" data-act="closeModal">Cancel</button><button type="submit" class="btn primary">Create campaign</button></div></form>');break;
   case 'delCamp':confirmBox('Delete this campaign?','"'+c.name+'" will be removed. Linked tasks stay, they are just unlinked.','Delete campaign',()=>{tasks.forEach(x=>{if(x.camp===c.id)x.camp=''});campaigns.splice(campaigns.indexOf(c),1);S.drawer=null;renderAll();toast('Campaign deleted.')});break;
   case 'campTask':newTaskModal({camp:c.id,title:'',brief:'For campaign: '+c.name});break;
   case 'delTask':confirmBox('Delete task #'+t.n+'?','"'+t.title+'" and its time entries will be deleted for everyone. This cannot be undone.','Delete task',()=>{
      t.files.forEach(f=>{if(f.path)sb.storage.from(BUCKET).remove([f.path])});
      for(let i=entries.length-1;i>=0;i--)if(entries[i].tid===t.id)entries.splice(i,1);
      lib.forEach(x=>{if(x.task===t.id)x.task=null});if(S.timer&&S.timer.tid===t.id){S.timer=null;delete timers[S.me]}
      tasks.splice(tasks.indexOf(t),1);S.drawer=null;renderAll();toast('Task deleted.')});break;
   case 'rmTag':t.tags.splice(+el.dataset.i,1);renderAll();break;
   case 'addField':{const k=$('#cfK').value.trim(),val=$('#cfV').value.trim();if(!k)return toast('Enter a field name.');t.fields[k]=val;logA(t,'set '+k);renderAll();break}
   case 'rmField':delete t.fields[el.dataset.k];renderAll();break;
   case 'rmDrive':t.drive='';renderAll();break;
   case 'rmFile':break;
   case 'rmEntry':{const i=entries.findIndex(x=>x.id===id);if(i>-1){entries.splice(i,1);renderAll();toast('Time entry deleted.')}break}
   case 'rmCmt':t.comments.splice(+el.dataset.i,1);renderAll();break;
   case 'delMsg':{const i=messages.findIndex(x=>x.id===id);if(i>-1){const m=messages[i];if(m.media&&m.media.path)sb.storage.from(BUCKET).remove([m.media.path]);messages.splice(i,1);renderMain()}break}
   case 'libNew':{const vs=visSpaces();if(!vs.length)return toast('No space available yet.');const nv={id:'v'+uid(),title:'New session',sp:S.ls!=='all'?S.ls:vs[0].id,kind:'video',ep:'New',guest:'Host only',rec:TODAY,st:'Raw',ver:1,dur:'-',pub:'',views:null,likes:null,task:null,path:'',links:[],cm:[],by:S.me};lib.unshift(nv);renderMain();openD('lib',nv.id);break}
   case 'libVersion':S.libVersionFor=v.id;$('#libFile').click();break;
   case 'delLib':confirmBox('Delete this library entry?','"'+v.title+'" and its uploaded file will be deleted.','Delete',()=>{if(v.path)sb.storage.from(BUCKET).remove([v.path]);lib.splice(lib.indexOf(v),1);S.drawer=null;renderAll();toast('Deleted.')});break;
   case 'rmTs':v.cm.splice(+el.dataset.i,1);renderDrawer();break;
   case 'csvDl':{const d=reportData();const rows=[[cap(S.rby),'Hours','Entries']];d.rows.forEach(r=>{const n=S.rby==='person'?uById(r.k).name:S.rby==='space'?spById(r.k).name:'#'+tById(r.k).n+' '+tById(r.k).title;rows.push([n,hrs(r.secs),r.n])});
      const det=[['Date','Person','Task','Space','Hours','Note']].concat(d.es.map(e=>{const tt=tById(e.tid)||{};return [e.date,uById(e.uid).name,tt.title?'#'+tt.n+' '+tt.title:'',tt.sp?spById(tt.sp).name:'',hrs(e.secs),e.note||'']}));
      download('time-report-'+S.rm+'.csv','﻿'+rows.map(r=>r.map(csvCell).join(',')).join('\n')+'\n\n'+det.map(r=>r.map(csvCell).join(',')).join('\n'));break}
   case 'exportTasks':{const ts=filtered();const rows=[['#','Title','Space','Month','Status','Priority','Assignees','Reviewer','Start','Due','Estimate (h)','Logged (h)','Tags','Campaign','Brief']].concat(ts.map(x=>[x.n,x.title,spById(x.sp).name,(folders.find(f=>f.id===x.fo)||{}).name||'',stN(x.st),cap(x.pri),x.as.map(i=>uById(i).name).join('; '),x.rv?uById(x.rv).name:'',x.start,x.due,x.est||'',hrs(taskSecs(x.id)),x.tags.join('; '),(campaigns.find(k=>k.id===x.camp)||{}).name||'',x.brief]));
      download('finstreet-tasks-'+TODAY+'.csv','﻿'+rows.map(r=>r.map(csvCell).join(',')).join('\n'));toast('Exported '+ts.length+' tasks.');break}
   case 'importTasks':modal('<h3>Import tasks from CSV</h3><p class="muted" style="margin:0 0 10px">Use Excel or Google Sheets, save as CSV. One row per task. Columns: <b>Title</b> (required), Space, Month (YYYY-MM), Status, Priority, Assignee (name or email), Reviewer, Start, Due (YYYY-MM-DD), Estimate, Tags, Brief.</p><div class="foot" style="justify-content:flex-start"><button type="button" class="btn" data-act="csvTemplate">'+ic('down',15)+'Download template</button><button type="button" class="btn primary" data-act="csvPick">'+ic('upload',15)+'Choose CSV file</button></div>');break;
   case 'csvTemplate':download('task-import-template.csv','﻿'+[['Title','Space','Month','Status','Priority','Assignee','Reviewer','Start','Due','Estimate','Tags','Brief'],['Ep 44 script','FinStreet YouTube Channel',CUR_YM,'To Do','High',me().name,'',TODAY,addDays(TODAY,5),'4','script; long-form','Research and first draft']].map(r=>r.map(csvCell).join(',')).join('\n'));break;
   case 'csvPick':{const inp=document.createElement('input');inp.type='file';inp.accept='.csv,text/csv';inp.onchange=()=>{const f=inp.files[0];if(f)f.text().then(importCsv)};inp.click();break}
   case 'editSpace':{const sp=spById(S.sp),fs=folders.filter(f=>f.sp===sp.id).sort((x,y)=>x.ym<y.ym?-1:1);modal('<h3>Edit space</h3><form data-form="editspace" style="display:flex;flex-direction:column;gap:12px"><label class="fld">Space name<input type="text" name="name" required value="'+esc(sp.name)+'"></label><label class="fld">Short name (sidebar and cards)<input type="text" name="short" value="'+esc(sp.short||'')+'"></label><div class="fld">Colour<div class="sw">'+['#D9433B','#D97A1E','#2A7DE1','#8A5CD6','#1B9E77','#0F8B9E','#C2417A','#6B7A75'].map(c2=>'<label><input type="radio" name="color" value="'+c2+'"'+(sp.color===c2?' checked':'')+'><span style="background:'+c2+'"></span></label>').join('')+'</div></div><div class="fld">Monthly folders</div><div class="asg">'+fs.map(f=>{const n=tasks.filter(x=>x.fo===f.id).length;return '<span class="tag">'+esc(f.name)+' · '+n+(n?'':'<button type="button" data-act="rmFolder" data-id="'+f.id+'" aria-label="Remove folder">'+ic('x',13)+'</button>')+'</span>'}).join('')+'</div><div class="foot"><button type="button" class="btn danger" data-act="delSpace" style="margin-right:auto">'+ic('trash',15)+'Delete space</button><button type="button" class="btn" data-act="closeModal">Cancel</button><button type="submit" class="btn primary">Save</button></div></form>');break}
   case 'rmFolder':{const i=folders.findIndex(f=>f.id===id);if(i>-1&&!tasks.some(x=>x.fo===id)){folders.splice(i,1);if(S.fo===id)S.fo='all';closeModal();renderAll();toast('Folder removed.')}break}
   case 'delSpace':{if(!can('manage'))return;const sp=spById(el.dataset.id||S.sp);if(!sp)return;const n=tasks.filter(x=>x.sp===sp.id).length;confirmBox('Delete "'+sp.name+'"?',(n?n+' tasks in this space will also be deleted. ':'')+'This cannot be undone.','Delete space',()=>{
      const ids=new Set(tasks.filter(x=>x.sp===sp.id).map(x=>x.id));for(let i=tasks.length-1;i>=0;i--)if(ids.has(tasks[i].id))tasks.splice(i,1);for(let i=entries.length-1;i>=0;i--)if(ids.has(entries[i].tid))entries.splice(i,1);
      for(let i=folders.length-1;i>=0;i--)if(folders[i].sp===sp.id)folders.splice(i,1);for(let i=channels.length-1;i>=0;i--)if(channels[i].sp===sp.id&&!channels[i].custom)channels.splice(i,1);
      spaces.splice(spaces.indexOf(sp),1);S.view='dashboard';S.sp='all';S.fo='all';S.drawer=null;renderAll();toast('Space deleted.')});break}
   case 'editMember':{const u=uById(el.dataset.u),adm=me().role==='admin',self=u.id===S.me;if(!adm&&!self)return;
      modal('<h3>'+esc(u.name)+'</h3><form data-form="member" data-u="'+u.id+'" style="display:flex;flex-direction:column;gap:12px"><p class="muted" style="margin:0">'+esc(u.email||'')+'</p><label class="fld">Job title<input type="text" name="title" value="'+esc(u.title||'')+'" placeholder="For example, Video Editor"></label>'
       +(self?'<label class="fld">New password (leave empty to keep)<input type="password" name="pw" minlength="6" autocomplete="new-password"></label>':'')
       +(adm?'<label class="fld">Role<select name="role"'+(self?' disabled':'')+'>'+['admin','manager','reviewer','member','external'].map(r=>'<option value="'+r+'"'+(u.role===r?' selected':'')+'>'+ROLES[r]+'</option>').join('')+'</select></label><div class="fld">Spaces they can see (none ticked = all spaces)</div><div class="checks">'+spaces.map(s2=>'<label><input type="checkbox" name="sp" value="'+s2.id+'"'+(Array.isArray(u.sp)&&u.sp.includes(s2.id)?' checked':'')+'><i class="dot" style="background:'+s2.color+'"></i>'+esc(s2.short||s2.name)+'</label>').join('')+'</div>'+(self?'':'<label class="ck"><input type="checkbox" name="inactive"'+(u.active===false?' checked':'')+'><span>Deactivate (hides them from assignee lists and chats)</span></label>'):'<p class="muted" style="margin:0">Your role: '+ROLES[u.role]+'. Only an admin can change roles and space access.</p>')
       +'<div class="foot"><button type="button" class="btn" data-act="closeModal">Cancel</button><button type="submit" class="btn primary">Save</button></div></form>');break}
   case 'copyInvite':copyText(inviteText(S.invites[+el.dataset.i]),'Invite message copied. Paste it on WhatsApp or email.');break;
   case 'newGroup':modal('<h3>New group chat</h3><form data-form="newgroup" style="display:flex;flex-direction:column;gap:12px"><label class="fld">Group name<input type="text" name="name" required placeholder="For example, Ep 45 production"></label><label class="fld">Description<input type="text" name="desc" placeholder="Optional"></label><div class="fld">Members</div><div class="checks">'+activeUsers().filter(u=>u.id!==S.me).map(u=>'<label><input type="checkbox" name="m" value="'+u.id+'" checked>'+esc(u.name)+'</label>').join('')+'</div><div class="foot"><button type="button" class="btn" data-act="closeModal">Cancel</button><button type="submit" class="btn primary">Create group</button></div></form>');break;
   case 'newDm':modal('<h3>New message</h3><div style="display:flex;flex-direction:column;gap:4px;max-height:60vh;overflow:auto">'+(activeUsers().filter(u=>u.id!==S.me&&u.role!=='external').map(u=>'<button type="button" class="li" data-act="startDm" data-u="'+u.id+'" style="border:0;background:none;text-align:left;width:100%">'+av(u,1)+'<div class="tt"><b>'+esc(u.name)+'</b><small>'+esc(u.title||ROLES[u.role])+'</small></div></button>').join('')||'<div class="empty">Nobody else has joined yet.</div>')+'</div><div class="foot"><button type="button" class="btn" data-act="closeModal">Close</button></div>');break;
   case 'startDm':{const o=el.dataset.u,cid='d-'+[S.me,o].sort().join('_');if(!channels.some(x=>x.id===cid))channels.push({id:cid,name:uById(o).name,kind:'dm',members:[S.me,o].sort()});closeModal();S.view='chat';S.ch=cid;S.chatOpen=true;renderAll();break}
   case 'voice':toggleVoice();break;
  }
});
// file removal also deletes from storage (original handler only splices)
document.addEventListener('click',function(e){const el=e.target.closest('[data-act="rmFile"]');if(!el||!S.drawer)return;const t=tById(S.drawer.id);const f=t&&t.files[+el.dataset.i];if(f&&f.path)sb.storage.from(BUCKET).remove([f.path])},true);
document.addEventListener('change',function(e){
  const el=e.target;
  if(el.dataset.f==='cst'){S.cst=el.value;renderMain();return}
  if(el.dataset.f==='recurring'&&S.drawer&&S.drawer.type==='task'){const t=tById(S.drawer.id);if(t){t.recurring=el.value==='1';renderAll()}return}
  if(el.dataset.l&&S.drawer&&S.drawer.type==='lib'){const v=lib.find(x=>x.id===S.drawer.id);if(!v)return;const k=el.dataset.l;let val=el.value;
    if(k==='views'||k==='likes')val=val===''?null:Math.max(0,parseInt(val,10)||0);
    if(k==='task')val=val||null;
    if(k==='title'&&!val.trim())return renderDrawer();
    v[k]=val;renderAll();return}
  if(el.dataset.c&&S.drawer&&S.drawer.type==='camp'){const c=campaigns.find(x=>x.id===S.drawer.id);if(!c)return;const k=el.dataset.c;let val=el.value;
    if(['budget','spent','target','result'].includes(k))val=val===''?'':Math.max(0,parseFloat(val)||0);
    if(k==='name'&&!val.trim())return renderDrawer();
    c[k]=val;renderAll();return}
  if(el.id==='linkT'&&el.value&&S.drawer&&S.drawer.type==='camp'){const t=tById(el.value);if(t){t.camp=S.drawer.id;logA(t,'linked this task to a campaign');renderAll()}}
});
document.addEventListener('keydown',function(e){
  if(e.key==='Enter'&&e.target.id==='tagIn'){e.preventDefault();const t=S.drawer&&tById(S.drawer.id),v=e.target.value.trim().replace(/^#/,'');if(t&&v&&!t.tags.includes(v)){t.tags.push(v);renderAll();setTimeout(()=>{const i=$('#tagIn');if(i)i.focus()},0)}}
});
document.addEventListener('submit',function(e){
  const f=e.target.dataset.form;if(!f)return;const d=new FormData(e.target);
  if(f==='newcamp'){e.preventDefault();const c={id:'k'+uid(),name:d.get('name').trim(),platform:d.get('platform'),owner:d.get('owner'),start:d.get('start'),end:d.get('end'),budget:d.get('budget')?+d.get('budget'):'',spent:'',target:d.get('target')?+d.get('target'):'',result:'',rtype:d.get('rtype'),st:d.get('st'),objective:d.get('objective'),notes:'',link:'',by:S.me,created:new Date().toISOString()};campaigns.push(c);closeModal();S.view='campaigns';renderAll();openD('camp',c.id);toast('Campaign created.')}
  else if(f==='editspace'){e.preventDefault();const sp=spById(S.sp);sp.name=d.get('name').trim();sp.short=(d.get('short')||'').trim()||(sp.name.length>18?sp.name.slice(0,16)+'…':sp.name);sp.color=d.get('color')||sp.color;const ch=channels.find(x=>x.id==='c-'+sp.id);if(ch)ch.name=sp.name;closeModal();renderAll();toast('Space updated.')}
  else if(f==='member'){e.preventDefault();const u=uById(e.target.dataset.u);u.hasDoc=true;u.title=(d.get('title')||'').trim();if(d.get('pw')){sb.auth.updateUser({password:d.get('pw')}).then(({error})=>toast(error?'Password not changed: '+error.message:'Password changed.'))}if(me().role==='admin'){if(d.get('role'))u.role=d.get('role');const sp=d.getAll('sp');u.sp=sp.length?sp:'all';if(u.id!==S.me)u.active=!d.get('inactive')}closeModal();renderAll();toast('Saved.')}
  else if(f==='newgroup'){e.preventDefault();const c={id:'g'+uid(),name:d.get('name').trim(),kind:'group',sp:null,custom:true,desc:(d.get('desc')||'').trim(),members:[S.me].concat(d.getAll('m'))};channels.push(c);closeModal();S.view='chat';S.ch=c.id;S.chatOpen=true;renderAll();toast('Group created.')}
});
function parseCsv(text){const rows=[];let row=[],cur='',q=false;text=text.replace(/^﻿/,'');for(let i=0;i<text.length;i++){const ch=text[i];if(q){if(ch==='"'){if(text[i+1]==='"'){cur+='"';i++}else q=false}else cur+=ch}else if(ch==='"')q=true;else if(ch===','){row.push(cur);cur=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cur);cur='';if(row.some(x=>x.trim()))rows.push(row);row=[]}else cur+=ch}row.push(cur);if(row.some(x=>x.trim()))rows.push(row);return rows}
function importCsv(text){
  const rows=parseCsv(text);if(rows.length<2)return toast('The file has no task rows.');
  const hd=rows[0].map(x=>x.trim().toLowerCase().replace(/^'/,''));const col=n=>hd.indexOf(n);
  const ix={title:col('title'),space:col('space'),month:col('month'),status:col('status'),pri:col('priority'),as:col('assignee'),rv:col('reviewer'),start:col('start'),due:col('due'),est:col('estimate'),tags:col('tags'),brief:col('brief')};
  if(ix.title<0)return toast('A "Title" column is required.');
  const findU=v=>{v=String(v||'').trim().toLowerCase();if(!v)return '';const u=users.find(x=>(x.email||'').toLowerCase()===v||String(x.name).toLowerCase()===v||first(x).toLowerCase()===v);return u?u.id:''};
  const normD=v=>{v=String(v||'').trim();let m=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);if(m)return m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0');m=v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);if(m)return m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');return ''};
  let n=0,skipped=0;const vs=visSpaces();
  rows.slice(1).forEach(r=>{const g=k=>ix[k]>=0?String(r[ix[k]]||'').trim().replace(/^'/,''):'';const title=g('title');if(!title){skipped++;return}
    const spn=g('space').toLowerCase();const sp=vs.find(s=>s.name.toLowerCase()===spn||(s.short||'').toLowerCase()===spn)||(S.sp!=='all'?spById(S.sp):vs[0]);if(!sp){skipped++;return}
    let ym=g('month');if(!/^\d{4}-\d{2}$/.test(ym))ym=(normD(g('due'))||TODAY).slice(0,7);ensureFolder(sp.id,ym);
    const stv=g('status').toLowerCase();const st=(ST.find(s=>s.n.toLowerCase()===stv||s.k===stv)||ST[0]).k;
    const pr=PRI.includes(g('pri').toLowerCase())?g('pri').toLowerCase():'medium';
    const t=T(sp.id,ym,title,st,pr,findU(g('as'))||S.me,findU(g('rv')),normD(g('start'))||TODAY,normD(g('due'))||addDays(TODAY,7),{brief:g('brief'),est:parseFloat(g('est'))||0,tags:g('tags')?g('tags').split(/[;,]/).map(x=>x.trim()).filter(Boolean):[],log:[{u:S.me,tx:'imported this task',at:nowS()}]});
    tasks.push(t);n++});
  closeModal();S.view='tasks';renderAll();toast('Imported '+n+' task'+(n===1?'':'s')+(skipped?', skipped '+skipped+' rows':'')+'.');
}
async function toggleVoice(){
  if(S.rec){S.rec.mr.stop();return}
  if(!navigator.mediaDevices||!window.MediaRecorder)return toast('Voice notes are not supported in this browser.');
  let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){return toast('Microphone permission was blocked.')}
  const mr=new MediaRecorder(stream),chunks=[],start=Date.now(),ch=S.ch;
  mr.ondataavailable=ev=>{if(ev.data.size)chunks.push(ev.data)};
  mr.onstop=async()=>{stream.getTracks().forEach(x=>x.stop());S.rec=null;renderMain();const secs=Math.round((Date.now()-start)/1000);if(secs<1)return;
    const blob=new Blob(chunks,{type:mr.mimeType||'audio/webm'});const file=new File([blob],'voice-note.'+((mr.mimeType||'').includes('mp4')?'m4a':'webm'),{type:blob.type});
    toast('Sending voice note…');const path=await upload(file,'chat');if(!path)return;const prev=S.ch;S.ch=ch;S.focusChat=true;sendMsg({tx:'',media:{type:'voice',dur:Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0'),path:path,name:'Voice note'}});S.ch=prev};
  mr.start();S.rec={mr:mr};renderMain();toast('Recording… press the stop button to send.');
}

/* ---------- sync with Supabase ---------- */
const stable=o=>o===null||typeof o!=='object'?JSON.stringify(o):Array.isArray(o)?'['+o.map(stable).join(',')+']':'{'+Object.keys(o).filter(k=>o[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+stable(o[k])).join(',')+'}';
const pick=(o,ks)=>{const r={};ks.forEach(k=>{if(o[k]!==undefined)r[k]=o[k]});return r};
const SER={
  space:x=>pick(x,['name','short','color','order']),
  folder:x=>pick(x,['sp','ym','name']),
  task:x=>{const c=Object.assign({},x);c.files=(x.files||[]).filter(f=>!f.up);return c},
  entry:x=>x, lib:x=>x, msg:x=>x, camp:x=>x, invite:x=>x,
  channel:x=>pick(x,['name','kind','sp','custom','members','desc']),
  member:x=>pick(x,['title','role','sp','active']),
  timer:x=>x, setting:x=>x
};
function collect(){
  const m=new Map(),put=(k,id,o)=>m.set(k+'|'+id,stable(SER[k](o)));
  spaces.forEach(x=>put('space',x.id,x));folders.forEach(x=>put('folder',x.id,x));tasks.forEach(x=>put('task',x.id,x));
  entries.forEach(x=>put('entry',x.id,x));lib.forEach(x=>put('lib',x.id,x));messages.forEach(x=>put('msg',x.id,x));
  campaigns.forEach(x=>put('camp',x.id,x));channels.forEach(x=>put('channel',x.id,x));S.invites.forEach(x=>put('invite',x.id,x));
  users.forEach(u=>{if(u.hasDoc||u.id===S.me||u.dirty)put('member',u.id,u)});
  Object.keys(timers).forEach(k=>put('timer',k,timers[k]));
  put('setting','flags',S.flags);
  return m;
}
const snap=new Map();let syncT=null,syncing=false,again=false,ready=false;
function queueSync(){if(!ready)return;clearTimeout(syncT);syncT=setTimeout(doSync,350)}
async function doSync(){
  if(syncing){again=true;return}syncing=true;
  try{
    const cur=collect(),ups=[],dels=[];
    cur.forEach((v,k)=>{if(snap.get(k)!==v)ups.push(k)});
    snap.forEach((v,k)=>{if(!cur.has(k))dels.push(k)});
    if(ups.length){
      const rows=ups.map(k=>{const i=k.indexOf('|');return {kind:k.slice(0,i),id:k.slice(i+1),doc:JSON.parse(cur.get(k))}});
      for(let i=0;i<rows.length;i+=200){const part=rows.slice(i,i+200);const {error}=await sb.from('hub_docs').upsert(part,{onConflict:'kind,id'});
        if(error){if(part.length>1){for(const r of part){const {error:e2}=await sb.from('hub_docs').upsert(r,{onConflict:'kind,id'});if(e2)toast('Could not save ('+r.kind+'): '+e2.message);else snap.set(r.kind+'|'+r.id,stable(r.doc))}}else toast('Could not save: '+error.message);continue}
        part.forEach(r=>snap.set(r.kind+'|'+r.id,stable(r.doc)))}
      setSaved(true);
    }
    for(const k of dels){const i=k.indexOf('|');const {error}=await sb.from('hub_docs').delete().eq('kind',k.slice(0,i)).eq('id',k.slice(i+1));if(error)toast('Could not delete: '+error.message);snap.delete(k)}
  }catch(err){toast('You seem to be offline. Changes will be saved when you are back.');setSaved(false)}
  syncing=false;if(again){again=false;queueSync()}
}
function setSaved(ok){const n=$('#saveState');if(n){n.textContent=ok?'All changes saved':'Offline';n.className='savestate'+(ok?'':' off')}}

function applyRow(kind,id,doc,isDel){
  const key=kind+'|'+id;
  if(!isDel){const js=stable(doc);if(snap.get(key)===js)return false;snap.set(key,js)}else{if(!snap.has(key))return false;snap.delete(key)}
  const arr={space:spaces,folder:folders,task:tasks,entry:entries,lib:lib,msg:messages,camp:campaigns,channel:channels,invite:S.invites}[kind];
  if(arr){const i=arr.findIndex(x=>x.id===id);
    if(isDel){if(i>-1)arr.splice(i,1)}else{const o=Object.assign({},doc,{id:id});if(kind==='task'&&o.n>tn)tn=o.n;if(i>-1)arr[i]=o;else arr.push(o)}
    if(kind==='msg'&&!isDel&&doc.u!==S.me)ping(doc);
    return true}
  if(kind==='member'){const u=users.find(x=>x.id===id);if(u&&!isDel){const pa=(D.profiles||[]).find(x=>x.id===id);Object.assign(u,{title:doc.title||'',role:pa&&pa.role==='admin'?'admin':(doc.role||u.role),sp:doc.sp||'all',active:doc.active!==false,hasDoc:true})}return true}
  if(kind==='timer'){if(isDel){delete timers[id];if(id===S.me)S.timer=null}else{timers[id]=doc;if(id===S.me)S.timer=doc}return true}
  if(kind==='setting'&&id==='flags'&&!isDel){S.flags=doc;return true}
  return false;
}
function softRender(){
  const a=document.activeElement;
  if(a&&a!==document.body&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.id!=='chatIn'&&a.id!=='q'){S.dirty=true;return}
  if(a&&a.id==='chatIn')S.focusChat=true;
  renderSide();renderTop();renderMain();renderDrawer();
}
document.addEventListener('focusout',()=>setTimeout(()=>{const a=document.activeElement;if(S.dirty&&!(a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.id!=='chatIn')){S.dirty=false;softRender()}},250));
function ping(m){
  const ch=channels.find(c=>c.id===m.ch);if(!ch)return;const mine=ch.kind==='dm'?(ch.members||[]).includes(S.me):visChannels().some(c=>c.id===ch.id);if(!mine)return;
  if(S.view==='chat'&&S.ch===m.ch&&!document.hidden){S.seen[m.ch]=(S.seen[m.ch]||0)+1;return}
  if(m.tx&&new RegExp('@'+first(me())+'\\b','i').test(m.tx))toast(uById(m.u).name+' mentioned you in '+(ch.kind==='dm'?'a message':ch.name));
  else if(ch.kind==='dm')toast('New message from '+uById(m.u).name);
}

/* typing indicator */
const typingCh=sb.channel('hub-typing');
typingCh.on('broadcast',{event:'typing'},({payload})=>{if(!payload||payload.u===S.me)return;S.typing={ch:payload.ch,name:payload.name};const el=$('#typing');if(el&&S.view==='chat'&&S.ch===payload.ch)el.textContent=payload.name+' is typing…';clearTimeout(S.typingT);S.typingT=setTimeout(()=>{S.typing=null;const e2=$('#typing');if(e2)e2.textContent=''},3000)}).subscribe();
let lastType=0;
document.addEventListener('input',e=>{if(e.target.id==='chatIn'&&Date.now()-lastType>2000){lastType=Date.now();typingCh.send({type:'broadcast',event:'typing',payload:{u:S.me,ch:S.ch,name:first(me())}})}});

/* ---------- load ---------- */
function load(rows){
  (D.profiles||[]).forEach(p=>{if(!users.some(u=>u.id===p.id))users.push({id:p.id,name:p.full_name||String(p.email||'').split('@')[0]||'Member',email:p.email||'',title:'',role:p.role==='admin'?'admin':p.role==='manager'?'manager':'member',hue:hueOf(p.id),sp:'all',active:true})});
  rows.forEach(r=>{
    const d=r.doc||{};
    if(r.kind==='member'){const u=users.find(x=>x.id===r.id);if(u){const pr=u.role;Object.assign(u,{title:d.title||'',role:pr==='admin'?'admin':(d.role||pr),sp:pr==='admin'?'all':(d.sp||'all'),active:d.active!==false,hasDoc:true})}}
    else if(r.kind==='timer'){timers[r.id]=d;if(r.id===S.me)S.timer=d}
    else if(r.kind==='setting'){if(r.id==='flags')S.flags=Object.assign(S.flags,d)}
    else{const arr={space:spaces,folder:folders,task:tasks,entry:entries,lib:lib,msg:messages,camp:campaigns,channel:channels,invite:S.invites}[r.kind];if(arr)arr.push(Object.assign({},d,{id:r.id}))}
  });
  tn=Math.max(100,...tasks.map(t=>t.n||0));
  spaces.sort((a,b)=>(a.order||0)-(b.order||0)||String(a.name).localeCompare(b.name));
  // snapshot = what is in the database
  rows.forEach(r=>snap.set(r.kind+'|'+r.id,stable(r.doc||{})));
}
load(D.docs||[]);
// first run: create the FinStreet spaces, folders and chats
if(!spaces.length){
  const nx=nextYm(CUR_YM);
  [['yt1','FinStreet YouTube Channel','FinStreet YT','#D9433B'],['yt2','Aditya Shelar YouTube Channel','Aditya Shelar YT','#D97A1E'],['social','Social Media','Social','#2A7DE1'],['paid','Paid Marketing','Paid','#8A5CD6'],['events','Events & Workshops','Events','#1B9E77'],['b2b','B2B & Institutional Partnerships','B2B','#0F8B9E'],['web','Website & Other Projects','Website','#6B7A75']].forEach((x,i)=>{
    spaces.push({id:x[0],name:x[1],short:x[2],color:x[3],order:i});[CUR_YM,nx].forEach(ym=>folders.push({id:x[0]+'-'+ym,sp:x[0],ym:ym,name:ymName(ym)}));
    channels.push({id:'c-'+x[0],name:x[1],kind:'group',sp:x[0]})});
  if(!channels.some(c=>c.id==='c-all'))channels.unshift({id:'c-all',name:'All Marketing',kind:'group',sp:null,desc:'Everyone on the internal team'});
}
if(!channels.some(c=>c.id==='c-all'))channels.unshift({id:'c-all',name:'All Marketing',kind:'group',sp:null,desc:'Everyone on the internal team'});
// my member record (role is enforced by the database)
{const u=users.find(x=>x.id===S.me);if(u&&!u.hasDoc){u.hasDoc=true;const inv=S.invites.find(i=>(i.email||'').toLowerCase()===(u.email||'').toLowerCase());if(inv){u.role=inv.role||u.role;u.sp=inv.sp||'all';S.invites.splice(S.invites.indexOf(inv),1)}}}
channels.sort((a,b)=>a.id==='c-all'?-1:b.id==='c-all'?1:0);
messages.sort((a,b)=>(a.at||'')<(b.at||'')?-1:1);
channels.forEach(c=>{S.seen[c.id]=messages.filter(m=>m.ch===c.id).length});
if(S.timer&&!tById(S.timer.tid)){S.timer=null;delete timers[S.me]}

/* realtime */
sb.channel('hub-docs').on('postgres_changes',{event:'*',schema:'public',table:'hub_docs'},p=>{
  let ch=false;
  if(p.eventType==='DELETE'){if(p.old&&p.old.kind)ch=applyRow(p.old.kind,p.old.id,null,true)}
  else if(p.new&&p.new.kind)ch=applyRow(p.new.kind,p.new.id,p.new.doc,false);
  if(ch)softRender();
}).subscribe();
let hiddenAt=0;
document.addEventListener('visibilitychange',async()=>{
  if(document.hidden){hiddenAt=Date.now();return}
  if(Date.now()-hiddenAt<30000)return;
  const {data}=await sb.from('hub_docs').select('kind,id,doc').neq('kind','msg');
  const {data:ms}=await sb.from('hub_docs').select('kind,id,doc').eq('kind','msg').order('created_at',{ascending:false}).limit(800);
  if(!data)return;const rows=data.concat(ms||[]);let ch=false;
  const seenKeys=new Set(rows.map(r=>r.kind+'|'+r.id));rows.forEach(r=>{if(applyRow(r.kind,r.id,r.doc,false))ch=true});
  Array.from(snap.keys()).forEach(k=>{if(!seenKeys.has(k)&&!k.startsWith('msg|')){const i=k.indexOf('|');if(applyRow(k.slice(0,i),k.slice(i+1),null,true))ch=true}});
  if(ch)softRender();
});
window.addEventListener('online',()=>queueSync());
ready=true;

/* ---------- task workflow buttons ---------- */
function actionBar(t){
  const mine=t.as.includes(S.me),own=isOwner(t),b=[];
  if(mine&&['todo','hold'].includes(t.st))b.push(['setst','progress','Start work','']);
  if((mine||own)&&['todo','progress','changes','hold'].includes(t.st))b.push(['sendReview','','Send for review','primary']);
  if(t.st==='review'&&canReview(t)){b.push(['setst','approved','Approve','primary']);b.push(['setst','changes','Request changes',''])}
  if(own&&!CLOSED.includes(t.st))b.push(['closeTask','','Close task',t.st==='approved'?'primary':'']);
  if(own&&!CLOSED.includes(t.st))b.push(['cancelTask','','Cancel task','ghost-danger']);
  if(CLOSED.includes(t.st)&&(own||mine))b.push(['setst','todo','Reopen','']);
  if(!b.length)return '';
  return '<div class="actbar">'+b.map(x=>'<button class="btn '+x[3]+'" data-act="'+x[0]+'" data-v="'+x[1]+'">'+x[2]+'</button>').join('')+'</div>';
}
const KEYS=[['N','New task'],['/','Search tasks'],['D','Dashboard'],['M','My tasks'],['C','Team chat'],['V','Video library'],['K','Campaigns'],['T','Time and reports'],['B','Switch board / list'],['Esc','Close the open panel'],['?','Show these shortcuts']];
function keysModal(){modal('<h3>Keyboard shortcuts</h3><div style="display:flex;flex-direction:column;gap:8px">'+KEYS.map(k=>'<div style="display:flex;align-items:center;gap:12px"><kbd class="kbd">'+k[0]+'</kbd><span>'+k[1]+'</span></div>').join('')+'</div><p class="muted" style="margin:14px 0 0;font-size:12.5px">Desktop shortcut: in Chrome open the ⋮ menu, then <b>Cast, save and share → Install page as app</b> (or <b>Create shortcut</b>). On a phone use <b>Add to Home screen</b>.</p><div class="foot"><button type="button" class="btn primary" data-act="closeModal">Got it</button></div>')}
document.addEventListener('click',function(e){
  const el=e.target.closest('[data-act]');if(!el)return;const a=el.dataset.act;
  const t=S.drawer&&S.drawer.type==='task'?tById(S.drawer.id):null;
  switch(a){
   case 'kpi':S.view='tasks';S.sp='all';S.fo='all';S.fa='all';S.fp='all';S.q='';$('#q').value='';S.fx=el.dataset.v;S.layout='list';S.drawer=null;renderAll();break;
   case 'clearFx':S.fx=null;renderAll();break;
   case 'keys':keysModal();break;
   case 'setst':if(t){const ns=el.dataset.v;if(ns==='todo')t.done='';setStatus(t,ns)}break;
   case 'sendReview':if(t){if(!t.rv&&(!t.by||t.by===S.me)&&!can('approve')){toast('Pick a reviewer first, then press Send for review.');const r=$('select[data-f="rv"]');if(r)r.focus();break}setStatus(t,'review')}break;
   case 'closeTask':if(t)confirmBox('Close task #'+t.n+'?','It will be marked Completed'+(t.st!=='approved'?' without waiting for approval':'')+'.','Close task',()=>setStatus(t,'completed'));break;
   case 'cancelTask':if(t)confirmBox('Cancel task #'+t.n+'?','It will move to Cancelled. You can reopen it later.','Cancel task',()=>setStatus(t,'cancelled'));break;
  }
});
document.addEventListener('keydown',function(e){
  if(e.ctrlKey||e.metaKey||e.altKey)return;
  const a=document.activeElement;if(a&&(/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)||a.isContentEditable))return;
  if(!$('#modal').hidden)return;
  const k=e.key;
  const go=v=>{S.fx=null;S.view=v;S.drawer=null;S.chatOpen=false;renderAll()};
  if(k==='n'||k==='N'){e.preventDefault();if(can('create'))newTaskModal()}
  else if(k==='/'){e.preventDefault();$('#q').focus()}
  else if(k==='d'||k==='D')go('dashboard');
  else if(k==='m'||k==='M'){S.fx=null;S.view='tasks';S.sp='all';S.fo='all';S.fa=S.me;S.layout='list';S.drawer=null;renderAll()}
  else if(k==='c'||k==='C'){if(can('chat'))go('chat')}
  else if(k==='v'||k==='V')go('library');
  else if(k==='k'||k==='K'){if(me().role!=='external')go('campaigns')}
  else if(k==='t'||k==='T'){if(can('reports'))go('time')}
  else if((k==='b'||k==='B')&&S.view==='tasks'){S.layout=S.layout==='board'?'list':'board';renderMain()}
  else if(k==='?')keysModal();
});

if(new URLSearchParams(location.search).get('new')){history.replaceState(null,'','/');setTimeout(()=>{if(can('create'))newTaskModal()},300)}
renderAll();
}
