const $ = (id) => document.getElementById(id);
let allProjects = [];
let toastTimer;
const money = (n) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(n)||0);
const dateText = (d) => { if(!d) return '—'; const dt=new Date(d); return isNaN(dt) ? '—' : dt.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}); };
function showToast(message){ const el=$('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2600); }
async function api(url,options={}){ const res=await fetch(url,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options}); if(!res.ok){let msg='Request failed';try{msg=(await res.json()).error||msg}catch{} throw new Error(msg)} if(res.status===204)return null; return res.json(); }
function statusClass(status){ return status.toLowerCase().replaceAll(' ','-'); }
function render(){
 const total=allProjects.length, active=allProjects.filter(p=>['Analyzing','Proposal','In Progress'].includes(p.status)).length, completed=allProjects.filter(p=>p.status==='Completed').length, budget=allProjects.filter(p=>p.status!=='Rejected').reduce((s,p)=>s+(Number(p.budget)||0),0);
 $('total').textContent=total; $('active').textContent=active; $('completed').textContent=completed; $('budget').textContent=money(budget);
 const search=$('search').value.trim().toLowerCase(), filter=$('filter').value;
 const list=allProjects.filter(p=>(filter==='All'||p.status===filter)&&(!search||[p.title,p.client,p.source,p.description].some(v=>String(v||'').toLowerCase().includes(search))));
 $('rows').innerHTML=list.map(p=>`<tr><td>${escapeHtml(p.title)}<div class="muted">${p.url?'<a target="_blank" rel="noopener noreferrer" href="'+escapeAttr(p.url)+'">Open link ↗</a>':''}</div></td><td>${escapeHtml(p.client||'—')}<div class="muted">${escapeHtml(p.source||'—')}</div></td><td>${money(p.budget)}</td><td><span class="status ${statusClass(p.status)}">${escapeHtml(p.status)}</span></td><td>${dateText(p.updatedAt||p.createdAt)}</td><td><div class="row-actions"><button class="small-btn" data-edit="${escapeAttr(p.id)}">Edit</button><button class="small-btn delete" data-delete="${escapeAttr(p.id)}">Delete</button></div></td></tr>`).join('');
 $('empty').classList.toggle('hidden',list.length>0); $('rows').closest('.table-wrap').classList.toggle('hidden',list.length===0);
}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function escapeAttr(value){return escapeHtml(value);}
async function refresh(){try{allProjects=await api('/api/projects');render()}catch(e){showToast('Could not load projects: '+e.message)}}
function openModal(project=null){
 $('projectForm').reset(); $('projectId').value=project?.id||''; $('modalTitle').textContent=project?'Edit project':'Add project';
 $('title').value=project?.title||''; $('client').value=project?.client||''; $('source').value=project?.source||'Manual'; $('budgetInput').value=project?.budget??0; $('statusInput').value=project?.status||'New'; $('url').value=project?.url||''; $('description').value=project?.description||'';
 $('modal').classList.remove('hidden'); $('title').focus();
}
function closeModal(){ $('modal').classList.add('hidden'); }
['addTop','addEmpty'].forEach(id=>$(id).addEventListener('click',()=>openModal()));
$('closeModal').addEventListener('click',closeModal); $('cancel').addEventListener('click',closeModal);
$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeModal()});
$('search').addEventListener('input',render); $('filter').addEventListener('change',render);
$('rows').addEventListener('click',async e=>{
 const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');
 if(edit){const p=allProjects.find(x=>x.id===edit.dataset.edit);if(p)openModal(p);}
 if(del){const id=del.dataset.delete, p=allProjects.find(x=>x.id===id);if(!confirm('Delete project “'+(p?.title||'')+'”?'))return;try{await api('/api/projects/'+encodeURIComponent(id),{method:'DELETE'});showToast('Project deleted');await refresh()}catch(err){showToast(err.message)}}
});
$('projectForm').addEventListener('submit',async e=>{
 e.preventDefault();const id=$('projectId').value;
 const payload={title:$('title').value.trim(),client:$('client').value.trim(),source:$('source').value.trim(),budget:Number($('budgetInput').value||0),status:$('statusInput').value,url:$('url').value.trim(),description:$('description').value.trim()};
 try{if(id)await api('/api/projects/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify(payload)});else await api('/api/projects',{method:'POST',body:JSON.stringify(payload)});closeModal();showToast(id?'Project updated':'Project added');await refresh()}catch(err){showToast(err.message)}
});
refresh();

let feedItems=[];
function renderFeed(){
 const tbody=$("opportunityRows"),empty=$("opportunityEmpty");
 if(!feedItems.length){tbody.innerHTML="";empty.classList.remove("hidden");return}
 empty.classList.add("hidden");
 tbody.innerHTML=feedItems.map(o=>'<tr><td>'+escapeHtml(o.title)+'<div class="opportunity-desc">'+escapeHtml((o.description||"").slice(0,240))+'</div>'+(o.matchedSkills?.length?'<div class="opportunity-skills">'+o.matchedSkills.slice(0,6).map(s=>'<span>'+escapeHtml(s)+'</span>').join("")+'</div>':'')+'</td><td>'+escapeHtml(o.source||"RSS")+'</td><td><span class="opportunity-score">'+(Number(o.score)||0)+' / 100</span></td><td>'+dateText(o.publishedAt)+'</td><td><div class="opportunity-actions"><a class="small-btn" target="_blank" rel="noopener noreferrer" href="'+escapeAttr(o.url)+'">Open</a><button class="small-btn" data-save-opp="'+escapeAttr(o.id)+'">Save project</button></div></td></tr>').join("");
}
async function loadFeed(){try{feedItems=await api("/api/opportunities");renderFeed()}catch(e){$("feedStatus").textContent="Unable to load feed results: "+e.message}}
$("scanFeeds").addEventListener("click",async()=>{const b=$("scanFeeds");b.disabled=true;b.textContent="Scanning…";$("feedStatus").textContent="Checking configured RSS feeds. This may take a moment.";try{const data=await api("/api/opportunities/scan",{method:"POST"});feedItems=data.items||[];renderFeed();$("feedStatus").textContent="Scan finished · "+data.feedsFetched+" of "+data.feedsConfigured+" feeds fetched · "+feedItems.length+" items saved · "+data.scannedAt+(data.errors?.length?" · "+data.errors.length+" feed errors":"");if(data.errors?.length)showToast("Some RSS feeds failed; see status.");}catch(e){$("feedStatus").textContent="Feed scan failed: "+e.message;showToast("Feed scan failed")}finally{b.disabled=false;b.textContent="↻ Scan feeds"}});
$("opportunityRows").addEventListener("click",async e=>{const b=e.target.closest("[data-save-opp]");if(!b)return;b.disabled=true;try{await api("/api/opportunities/"+encodeURIComponent(b.dataset.saveOpp)+"/save",{method:"POST"});showToast("Saved to Projects");await refresh();await loadFeed()}catch(err){showToast(err.message)}finally{b.disabled=false}});
document.querySelectorAll('a[href="#jobfinder"]').forEach(a=>a.addEventListener("click",async()=>{$("jobfinder").classList.remove("hidden");setTimeout(()=>$("jobfinder").scrollIntoView({behavior:"smooth"}),10);await loadFeed()}));
loadFeed();
