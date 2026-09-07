'use strict';
const $ = id => document.getElementById(id);
const db = supabase.createClient('https://lpreyagvoigdxomfymfn.supabase.co','sb_publishable_CPQHfrr8Zg17dqR2tbK4Og_1v4CSxzw');
let user = null, entries = [], view = 'today', editing = null, generation = 0;
const today = () => new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const titles = {today:'What matters today.',week:'Turn goals into a week.',horizon:'What you’re working toward.',notes:'A moment to reflect.',finance:'Know where you stand.'};
const say = text => { $('status').textContent = text; };
function resetEditor(){ editing=null;$('entry-form').reset();$('kind').value=view==='week'?'weekly_goal':view==='horizon'?'long_goal':view==='notes'?'reflection':view==='finance'?'finance':'mit';$('horizon').value=['today','week','horizon'].includes(view)?view:'today';$('cancel').hidden=true;configureEditor(); }
function configureEditor(selected=''){
 const kind=$('kind').value, parentKind=kind==='mit'?'weekly_goal':kind==='weekly_goal'?'long_goal':null;
 $('parent').replaceChildren(node('option',parentKind?'Choose a '+(kind==='mit'?'weekly':'long-term')+' goal':'No parent'));$('parent').firstChild.value='';
 for(const e of entries.filter(e=>e.kind===parentKind&&e.id!==editing)){$('parent').append(Object.assign(node('option',e.title+(e.week_start?' · '+e.week_start:'')),{value:e.id}));}
 $('parent').value=selected;$('parent').hidden=$('parent-label').hidden=!parentKind;$('parent').required=!!parentKind;
 $('parent-label').textContent=kind==='mit'?'Weekly goal':'Long-term goal';
 $('week-start').hidden=$('week-label').hidden=kind!=='weekly_goal';$('week-start').required=kind==='weekly_goal';if(kind==='weekly_goal'&&!$('week-start').value)$('week-start').value=weekBounds().start;
 $('due').required=kind==='mit';if(kind==='mit'&&!$('due').value)$('due').value=today();
 $('horizon').value=kind==='long_goal'?'horizon':kind==='weekly_goal'?'week':kind==='mit'?'today':$('horizon').value;
}
function ancestry(e){const parent=entries.find(p=>p.id===e.parent_id);const grand=parent&&entries.find(p=>p.id===parent.parent_id);return [grand?.title,parent?.title].filter(Boolean).join(' → ');}
function startChild(entry){resetEditor();$('kind').value=entry.kind==='long_goal'?'weekly_goal':'mit';configureEditor(entry.id);$('title').focus();}

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
async function refresh(){const ticket=generation;const {data,error}=await db.from('deepfolio_entries').select('*').order('created_at',{ascending:false});if(ticket!==generation || !user)return;if(error)throw error;entries=data;configureEditor($('parent').value);render();}
function node(tag,text,cls){const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;}
function weekBounds(){const end=new Date(today()+'T12:00:00Z');const start=new Date(end);start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7));end.setTime(start.getTime());end.setUTCDate(end.getUTCDate()+6);return {start:start.toISOString().slice(0,10),end:end.toISOString().slice(0,10)};}
function visibleEntry(e){
 if(view==='notes')return ['reflection','review'].includes(e.kind);
 if(view==='finance')return e.kind==='finance';
 if(view==='horizon')return e.kind==='long_goal'&&(!e.completed||$('show-completed').checked);
 if(view==='week')return e.kind==='weekly_goal'&&(!e.completed||$('show-completed').checked);
 if(!['task','habit','mit'].includes(e.kind))return false;
 if(e.completed&&!$('show-completed').checked)return false;
 if(e.kind==='habit')return view!=='horizon';
 if(view==='today')return e.due_date?e.due_date<=today():e.horizon==='today';
 if(view==='week')return e.due_date?e.due_date<=weekBounds().end:['today','week'].includes(e.horizon);
 return e.horizon==='horizon';
}
function render(){
 $('view-title').textContent=titles[view];$('date').textContent=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'long',month:'long',day:'numeric'}).format(new Date()).toUpperCase();
 $('summary').textContent=entries.filter(e=>e.kind==='mit'&&!e.completed&&e.due_date===today()).length+' MITs today · '+entries.filter(e=>e.kind==='long_goal'&&!e.completed).length+' long-term goals';
 $('list-title').textContent=view==='notes'?'Reflections & weekly reviews':view==='finance'?'Finance notes':view==='week'?'Weekly goals':view==='horizon'?'Long-term goals':'Daily MITs & unlinked tasks';
 $('week-review').hidden=view!=='week';
 const bounds=weekBounds();
 const habits=entries.filter(e=>e.kind==='habit');
 const checkins=habits.reduce((n,e)=>n+e.checkins.filter(d=>d>=bounds.start&&d<=today()).length,0);
 $('week-stats').textContent=bounds.start+' – '+bounds.end+' · '+checkins+' habit check-ins · '+entries.filter(e=>e.kind==='weekly_goal'&&!e.completed&&visibleEntry(e)).length+' open weekly goals';
 const rows=entries.filter(visibleEntry);
 rows.sort((a,b)=>Number(a.completed)-Number(b.completed));$('count').textContent=rows.length;$('entries').replaceChildren();
 if(!rows.length)$('entries').append(node('p',view==='finance'?'No finance notes yet. Your connected financial accounts are not synced to this workspace.':view==='notes'?'What worked? What got in the way? What would make next week easier? Save a reflection or weekly review.':view==='horizon'?'Start with a long-term goal. We can break it down together in ChatGPT.':view==='week'?'Add a weekly goal linked to a long-term goal. Then choose its daily MITs.':'No MITs yet. Add a weekly goal first, then choose a concrete action for a day.','empty'));
 for(const entry of rows){
 const el=node('article','','entry'+(entry.completed?' done':''));
 el.append(node('small',({long_goal:'Long-term goal',weekly_goal:'Weekly goal',mit:'MIT',task:'Unlinked task',review:'Weekly review'}[entry.kind]||entry.kind)+' · '+entry.horizon+(entry.due_date?' · due '+entry.due_date:'')),node('h3',entry.title));
 if(['task','mit'].includes(entry.kind)&&!entry.completed&&entry.due_date&&entry.due_date<today())el.append(node('small',' · Overdue','overdue'));
 if(entry.parent_id)el.append(node('p',ancestry(entry),'ancestry'));
 if(entry.week_start)el.append(node('small','Week of '+entry.week_start));
 const children=entries.filter(c=>c.parent_id===entry.id);
 if(['long_goal','weekly_goal'].includes(entry.kind)){el.append(node('p',children.filter(c=>c.completed).length+' / '+children.length+' '+(entry.kind==='long_goal'?'weekly goals':'MITs')+' complete'));for(const child of children){const line=node('div',(child.completed?'✓ ':'○ ')+child.title+(child.due_date?' · '+child.due_date:''),'child-line');el.append(line);}}
 if(entry.kind==='mit')el.append(node('small',entry.automation_id?'Reminder linked in ChatGPT':'No ChatGPT reminder linked'));
 if(entry.body)el.append(node('p',entry.body));
 const actions=node('div','','actions');
 const act=(label,fn)=>{const b=node('button',label);b.type='button';b.onclick=()=>run(b,fn);actions.append(b);};
 if(['task','mit','long_goal','weekly_goal'].includes(entry.kind)){
 act(entry.completed?'Reopen':'Complete',()=>update(entry.id,{completed:!entry.completed}));
 if(['long_goal','weekly_goal'].includes(entry.kind))act(entry.kind==='long_goal'?'Add weekly goal':'Add daily MIT',async()=>startChild(entry));
 if(['task','mit'].includes(entry.kind)&&!entry.completed){act('Do today',()=>update(entry.id,{horizon:'today',due_date:today()}));act('Next week',()=>{const d=new Date(weekBounds().end+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return update(entry.id,{horizon:'week',due_date:d.toISOString().slice(0,10)});});}
 }
 if(entry.kind==='habit'){const checked=entry.checkins.includes(today());act(checked?'✓ Done today · undo':'Mark today done',()=>update(entry.id,{checkins:checked?entry.checkins.filter(d=>d!==today()):[...entry.checkins,today()]}));el.append(node('p',entry.checkins.length+' days checked in'));}
 act('Edit',async()=>{editing=entry.id;$('title').value=entry.title;$('body').value=entry.body;$('kind').value=entry.kind;$('horizon').value=entry.horizon;$('due').value=entry.due_date||'';$('week-start').value=entry.week_start||'';configureEditor(entry.parent_id||'');$('cancel').hidden=false;$('title').focus();});
 act('Delete',async()=>{if(entries.some(c=>c.parent_id===entry.id))throw Error('Move or delete the linked items before deleting this goal.');if(!confirm('Delete “'+entry.title+'”?'))return;const {error}=await db.from('deepfolio_entries').delete().eq('id',entry.id);if(error)throw error;await refresh();say('Deleted.');});
 el.append(actions);$('entries').append(el);
 }
}
async function update(id,patch){const {error}=await db.from('deepfolio_entries').update(patch).eq('id',id);if(error)throw error;await refresh();say('Saved.');}
$('entry-form').onsubmit=e=>{e.preventDefault();run(e.submitter,async()=>{if(!user)throw Error('Please sign in again.');const record={title:$('title').value.trim(),body:$('body').value,kind:$('kind').value,horizon:$('horizon').value,due_date:$('due').value||null,parent_id:['mit','weekly_goal'].includes($('kind').value)?$('parent').value||null:null,week_start:$('kind').value==='weekly_goal'?$('week-start').value||null:null};if(!record.title)throw Error('Add a title first.');if(editing)await update(editing,record);else{const {error}=await db.from('deepfolio_entries').insert({...record,user_id:user.id});if(error)throw error;await refresh();}resetEditor();say('Saved.');});};
$('cancel').onclick=resetEditor;
$('show-completed').onchange=render;
$('kind').onchange=()=>configureEditor();
$('start-review').onclick=()=>{
 const title='Week of '+weekBounds().start;
 const existing=entries.find(e=>e.kind==='review'&&e.title===title);
 resetEditor();$('kind').value='review';configureEditor();$('horizon').value='week';$('title').value=title;
 if(existing){editing=existing.id;$('body').value=existing.body;$('cancel').hidden=false;}
 else $('body').value='What went well?\n\nWhat got in the way?\n\nWhat can I make easier?\n\nMy three priorities for next week:\n1. \n2. \n3. ';
 $('body').focus();
};
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>{view=button.dataset.view;document.querySelectorAll('[data-view]').forEach(b=>b.removeAttribute('aria-current'));button.setAttribute('aria-current','page');resetEditor();if(view==='notes')$('kind').value='reflection';if(view==='finance')$('kind').value='finance';render();};
db.auth.onAuthStateChange((event)=>{if(['SIGNED_IN','SIGNED_OUT'].includes(event))setTimeout(()=>sync().catch(e=>say(e.message)),0);});
sync().catch(e=>say(e.message));
