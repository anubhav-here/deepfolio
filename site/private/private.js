'use strict';
const $ = id => document.getElementById(id);
const db = supabase.createClient('https://lpreyagvoigdxomfymfn.supabase.co','sb_publishable_CPQHfrr8Zg17dqR2tbK4Og_1v4CSxzw');
let user = null, entries = [], view = 'today', editing = null, generation = 0;
const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const titles = {today:'Make room for today.',week:'A week with intention.',horizon:'Keep the bigger picture.',notes:'A moment to reflect.',finance:'Know where you stand.'};
const say = text => { $('status').textContent = text; };
function resetEditor(){ editing=null;$('entry-form').reset();$('horizon').value=['today','week','horizon'].includes(view)?view:'today';$('cancel').hidden=true; }
async function run(button, action){button.disabled=true;try{await action();}catch(e){say(e.message || 'Something went wrong. Please try again.');}finally{button.disabled=false;}}
$('login-form').onsubmit = e => {e.preventDefault();run(e.submitter,async()=>{const {error}=await db.auth.signInWithOtp({email:$('email').value.trim(),options:{shouldCreateUser:true,emailRedirectTo:location.origin+'/private/'}});if(error)throw error;say('Check your email for a sign-in link.');});};
$('signout').onclick = e => run(e.currentTarget,async()=>{const {error}=await db.auth.signOut();if(error)throw error;await sync();say('Signed out.');});
async function sync(){
 const ticket=++generation;
 $('workspace').hidden=true;entries=[];user=null;resetEditor();
 const {data,error}=await db.auth.getUser();
 if(ticket!==generation)return;
 $('signout').hidden=!data?.user;$('login').hidden=!!data?.user;
 if(error || !data?.user){$('login').hidden=false;return;}
 const owner=await db.from('deepfolio_owner').select('email');
 if(ticket!==generation)return;
 if(owner.error) {say(owner.error.message);return;}
 if(!owner.data.length){say('This account does not have workspace access. Owner setup must be completed first.');return;}
 user=data.user;$('workspace').hidden=false;say('');await refresh();
}
async function refresh(){const ticket=generation;const {data,error}=await db.from('deepfolio_entries').select('*').order('created_at',{ascending:false});if(ticket!==generation || !user)return;if(error)throw error;entries=data;render();}
function node(tag,text,cls){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;}
function render(){
 $('view-title').textContent=titles[view];$('date').textContent=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'long',month:'long',day:'numeric'}).format(new Date()).toUpperCase();
 $('summary').textContent=entries.filter(e=>e.kind==='task'&&!e.completed).length+' open tasks';
 $('list-title').textContent=view==='notes'?'Reflections & weekly reviews':view==='finance'?'Finance notes':'Your next steps';
 const rows=entries.filter(e=> view==='notes'?['reflection','review'].includes(e.kind):view==='finance'?e.kind==='finance':['task','habit'].includes(e.kind)&&(view==='today'?(e.horizon==='today'||e.kind==='habit'||e.due_date&&e.due_date<=today()):view==='week'?['today','week'].includes(e.horizon):e.horizon==='horizon'));
 rows.sort((a,b)=>Number(a.completed)-Number(b.completed));$('count').textContent=rows.length;$('entries').replaceChildren();
 if(!rows.length)$('entries').append(node('p',view==='finance'?'No finance notes yet. Your connected financial accounts are not synced to this workspace.':view==='notes'?'What worked? What got in the way? What would make next week easier? Save a reflection or weekly review.':'Nothing here yet. Start with one small next step.','empty'));
 for(const entry of rows){
 const el=node('article','','entry'+(entry.completed?' done':''));
 el.append(node('small',entry.kind.replace('review','weekly review')+' · '+entry.horizon+(entry.due_date?' · due '+entry.due_date:'')),node('h3',entry.title));
 if(entry.body)el.append(node('p',entry.body));
 const actions=node('div','','actions');
 const act=(label,fn)=>{const b=node('button',label);b.type='button';b.onclick=()=>run(b,fn);actions.append(b);};
 if(entry.kind==='task')act(entry.completed?'Reopen':'Complete',()=>update(entry.id,{completed:!entry.completed}));
 if(entry.kind==='habit'){const checked=entry.checkins.includes(today());act(checked?'✓ Done today · undo':'Mark today done',()=>update(entry.id,{checkins:checked?entry.checkins.filter(d=>d!==today()):[...entry.checkins,today()]}));el.append(node('p',entry.checkins.length+' days checked in'));}
 act('Edit',async()=>{editing=entry.id;$('title').value=entry.title;$('body').value=entry.body;$('kind').value=entry.kind;$('horizon').value=entry.horizon;$('due').value=entry.due_date||'';$('cancel').hidden=false;$('title').focus();});
 act('Delete',async()=>{if(!confirm('Delete “'+entry.title+'”?'))return;const {error}=await db.from('deepfolio_entries').delete().eq('id',entry.id);if(error)throw error;await refresh();say('Deleted.');});
 el.append(actions);$('entries').append(el);
 }
}
async function update(id,patch){const {error}=await db.from('deepfolio_entries').update(patch).eq('id',id);if(error)throw error;await refresh();say('Saved.');}
$('entry-form').onsubmit=e=>{e.preventDefault();run(e.submitter,async()=>{if(!user)throw Error('Please sign in again.');const record={title:$('title').value.trim(),body:$('body').value,kind:$('kind').value,horizon:$('horizon').value,due_date:$('due').value||null};if(!record.title)throw Error('Add a title first.');if(editing)await update(editing,record);else{const {error}=await db.from('deepfolio_entries').insert({...record,user_id:user.id});if(error)throw error;await refresh();}resetEditor();say('Saved.');});};
$('cancel').onclick=resetEditor;
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>{view=button.dataset.view;document.querySelectorAll('[data-view]').forEach(b=>b.removeAttribute('aria-current'));button.setAttribute('aria-current','page');resetEditor();if(view==='notes')$('kind').value='reflection';if(view==='finance')$('kind').value='finance';render();};
db.auth.onAuthStateChange((event)=>{if(['SIGNED_IN','SIGNED_OUT'].includes(event))setTimeout(()=>sync().catch(e=>say(e.message)),0);});
sync().catch(e=>say(e.message));
