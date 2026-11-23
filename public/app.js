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
async function refresh(){try{allProjects=await api('/api/projects');render();refreshTaskProjects()}catch(e){showToast('Could not load projects: '+e.message)}}
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
 tbody.innerHTML=feedItems.map(o=>'<tr><td>'+escapeHtml(o.title)+'<div class="opportunity-desc">'+escapeHtml((o.description||"").slice(0,240))+'</div>'+(o.matchedSkills?.length?'<div class="opportunity-skills">'+o.matchedSkills.slice(0,6).map(s=>'<span>'+escapeHtml(s)+'</span>').join("")+'</div>':'')+'</td><td>'+escapeHtml(o.source||"RSS")+'</td><td><span class="opportunity-score">'+(Number(o.score)||0)+' / 100</span></td><td>'+dateText(o.publishedAt)+'</td><td><div class="opportunity-actions"><a class="small-btn" target="_blank" rel="noopener noreferrer" href="'+escapeAttr(o.url)+'">Open</a><button class="small-btn" data-analyze-opp="'+escapeAttr(o.id)+'">Analyze</button><button class="small-btn" data-proposal-opp="'+escapeAttr(o.id)+'">Draft proposal</button><button class="small-btn" data-develop-opp="'+escapeAttr(o.id)+'">Development plan</button><button class="small-btn" data-code-opp="'+escapeAttr(o.id)+'">Generate code</button><button class="small-btn" data-ai-code-opp="'+escapeAttr(o.id)+'">AI code</button><button class="small-btn" data-save-opp="'+escapeAttr(o.id)+'">Save project</button></div></td></tr>').join("");
}
async function loadFeed(){try{feedItems=await api("/api/opportunities");renderFeed()}catch(e){$("feedStatus").textContent="Unable to load feed results: "+e.message}}
$("scanFeeds").addEventListener("click",async()=>{const b=$("scanFeeds");b.disabled=true;b.textContent="Scanning…";$("feedStatus").textContent="Checking configured RSS feeds. This may take a moment.";try{const data=await api("/api/opportunities/scan",{method:"POST"});feedItems=data.items||[];renderFeed();$("feedStatus").textContent="Scan finished · "+data.feedsFetched+" of "+data.feedsConfigured+" feeds fetched · "+feedItems.length+" items saved · "+data.scannedAt+(data.errors?.length?" · "+data.errors.length+" feed errors":"");if(data.errors?.length)showToast("Some RSS feeds failed; see status.");}catch(e){$("feedStatus").textContent="Feed scan failed: "+e.message;showToast("Feed scan failed")}finally{b.disabled=false;b.textContent="↻ Scan feeds"}});
$("opportunityRows").addEventListener("click",async e=>{
 const analyze=e.target.closest("[data-analyze-opp]");
 if(analyze){
  analyze.disabled=true;analyze.textContent="Analyzing…";
  try{
   const a=await api("/api/opportunities/"+encodeURIComponent(analyze.dataset.analyzeOpp)+"/analyze",{method:"POST"});
   const risks=(a.risks||[]).map(x=>"<li>"+escapeHtml(x)+"</li>").join("")||"<li>No keyword-based risks detected.</li>";
   const skills=(a.matchedSkills||[]).map(x=>"<span>"+escapeHtml(x)+"</span>").join("")||"<span>None detected</span>";
   const signals=(a.complexitySignals||[]).map(x=>"<li>"+escapeHtml(x)+"</li>").join("")||"<li>None detected</li>";
   $("analysisResults").innerHTML='<article class="analysis-card"><div class="analysis-head"><h3>Job Analysis</h3><strong>'+a.opportunityScore+'/100</strong></div><p><b>Recommendation:</b> '+escapeHtml(a.recommendation)+'</p><div class="analysis-grid"><div><small>Difficulty</small><b>'+escapeHtml(a.difficulty)+'</b></div><div><small>Estimated effort</small><b>'+a.estimatedHours+' hrs</b></div><div><small>Skill fit</small><b>'+a.skillFitScore+'/100</b></div><div><small>Budget/hour</small><b>'+(a.estimatedBudgetPerHour===null?"Not provided":"$"+a.estimatedBudgetPerHour)+'</b></div></div><p><b>Matched skills</b></p><div class="opportunity-skills">'+skills+'</div><p><b>Complexity signals</b></p><ul>'+signals+'</ul><p><b>Risk flags</b></p><ul>'+risks+'</ul><p class="analysis-note">'+escapeHtml(a.disclaimer)+'</p></article>';
   $("analysisResults").scrollIntoView({behavior:"smooth",block:"start"});
  }catch(err){showToast("Analysis failed: "+err.message)}
  finally{analyze.disabled=false;analyze.textContent="Analyze"}
  return;
 }
 const proposal=e.target.closest("[data-proposal-opp]");
 if(proposal){
  proposal.disabled=true;proposal.textContent="Drafting…";
  try{
   const d=await api("/api/opportunities/"+encodeURIComponent(proposal.dataset.proposalOpp)+"/draft-proposal",{method:"POST"});
   const questions=(d.suggestedQuestions||[]).map(q=>"<li>"+escapeHtml(q)+"</li>").join("");
   $("analysisResults").innerHTML='<article class="analysis-card proposal-card"><div class="analysis-head"><h3>Proposal Draft</h3><span class="status">Review before sending</span></div><p><b>Job:</b> '+escapeHtml(d.title)+'</p><textarea id="proposalText" rows="15" style="width:100%;padding:12px;border:1px solid #dfe4ec;border-radius:8px;font:inherit;font-size:13px;line-height:1.6">'+escapeHtml(d.proposal)+'</textarea><div class="opportunity-actions" style="margin-top:10px"><button class="small-btn" id="copyProposal">Copy proposal</button></div><p><b>Clarify with client</b></p><ul>'+questions+'</ul><p class="analysis-note">'+escapeHtml(d.note)+'</p></article>';
   $("copyProposal").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("proposalText").value);showToast("Proposal copied")}catch{showToast("Copy not available; select and copy the text")}});
   $("analysisResults").scrollIntoView({behavior:"smooth",block:"start"});
  }catch(err){showToast("Proposal draft failed: "+err.message)}
  finally{proposal.disabled=false;proposal.textContent="Draft proposal"}
  return;
 }
 const aiCodeBtn=e.target.closest("[data-ai-code-opp]");
 if(aiCodeBtn){
  aiCodeBtn.disabled=true;aiCodeBtn.textContent="AI working…";
  try{
   const result=await api("/api/opportunities/"+encodeURIComponent(aiCodeBtn.dataset.aiCodeOpp)+"/ai-code",{method:"POST"});
   $("analysisResults").innerHTML='<article class="analysis-card ai-code-card"><div class="analysis-head"><h3>AI Coding Draft</h3><strong>'+escapeHtml(result.model)+'</strong></div><p>'+escapeHtml(result.notice)+'</p><textarea id="aiCodeText" rows="18" spellcheck="false"></textarea><button class="small-btn" id="copyAiCode">Copy AI draft</button></article>';
   $("aiCodeText").value=result.content;
   $("copyAiCode").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(result.content);showToast("AI draft copied")}catch{showToast("Clipboard unavailable")}});
   $("analysisResults").scrollIntoView({behavior:"smooth",block:"start"});
  }catch(err){showToast(err.message)}
  finally{aiCodeBtn.disabled=false;aiCodeBtn.textContent="AI code"}
  return;
 }
 const codeBtn=e.target.closest("[data-code-opp]");
 if(codeBtn){
  codeBtn.disabled=true;codeBtn.textContent="Generating…";
  try{
   const output=await api("/api/opportunities/"+encodeURIComponent(codeBtn.dataset.codeOpp)+"/generate-code",{method:"POST"});
   const fileHtml=(output.files||[]).map((file,i)=>'<section class="generated-file"><div class="analysis-head"><b>'+escapeHtml(file.path)+'</b><button class="small-btn" data-copy-code="'+i+'">Copy file</button></div><pre><code>'+escapeHtml(file.content)+'</code></pre></section>').join("");
   $("analysisResults").innerHTML='<article class="analysis-card code-output"><div class="analysis-head"><h3>Starter code workspace</h3><strong>'+output.files.length+' files</strong></div><p>'+escapeHtml(output.stack)+' · '+escapeHtml(output.notice)+'</p>'+fileHtml+'<button class="small-btn" id="copyAllCode">Copy all files</button></article>';
   document.querySelectorAll("[data-copy-code]").forEach(b=>b.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(output.files[Number(b.dataset.copyCode)].content);showToast("File copied")}catch{showToast("Clipboard unavailable")}}));
   $("copyAllCode").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(output.files.map(f=>"// "+f.path+"\\n"+f.content).join("\\n\\n"));showToast("All starter files copied")}catch{showToast("Clipboard unavailable")}});
   $("analysisResults").scrollIntoView({behavior:"smooth",block:"start"});
  }catch(err){showToast("Code generation failed: "+err.message)}
  finally{codeBtn.disabled=false;codeBtn.textContent="Generate code"}
  return;
 }
 const develop=e.target.closest("[data-develop-opp]");
 if(develop){
  develop.disabled=true;develop.textContent="Planning…";
  try{
   const p=await api("/api/opportunities/"+encodeURIComponent(develop.dataset.developOpp)+"/development-plan",{method:"POST"});
   const tasks=(p.tasks||[]).map(t=>"<li><b>"+escapeHtml(t.phase)+":</b> "+escapeHtml(t.task)+"</li>").join("");
   const files=(p.suggestedFiles||[]).map(f=>"<li><code>"+escapeHtml(f)+"</code></li>").join("");
   const areas=(p.detectedAreas||[]).map(a=>"<span>"+escapeHtml(a)+"</span>").join("")||"<span>General project</span>";
   $("analysisResults").innerHTML='<article class="analysis-card dev-plan-card"><div class="analysis-head"><h3>Development Plan</h3><strong>'+p.estimatedHours+' estimated hours</strong></div><p>'+escapeHtml(p.summary)+'</p><p><b>Detected areas</b></p><div class="opportunity-skills">'+areas+'</div><p><b>Tasks</b></p><ol>'+tasks+'</ol><p><b>Suggested file structure</b></p><ul>'+files+'</ul><p><b>Assumptions</b></p><ul>'+(p.assumptions||[]).map(x=>"<li>"+escapeHtml(x)+"</li>").join("")+'</ul><p class="analysis-note">'+escapeHtml(p.safeMode)+'</p><button class="small-btn" id="copyDevPlan">Copy plan</button></article>';
   $("copyDevPlan").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(JSON.stringify(p,null,2));showToast("Plan copied")}catch{showToast("Select and copy the plan manually")}});
   $("analysisResults").scrollIntoView({behavior:"smooth",block:"start"});
  }catch(err){showToast("Development plan failed: "+err.message)}
  finally{develop.disabled=false;develop.textContent="Development plan"}
  return;
 }
 const b=e.target.closest("[data-save-opp]");if(!b)return;b.disabled=true;try{await api("/api/opportunities/"+encodeURIComponent(b.dataset.saveOpp)+"/save",{method:"POST"});showToast("Saved to Projects");await refresh();await loadFeed()}catch(err){showToast(err.message)}finally{b.disabled=false}
});
document.querySelectorAll('a[href="#jobfinder"]').forEach(a=>a.addEventListener("click",async()=>{$("jobfinder").classList.remove("hidden");setTimeout(()=>$("jobfinder").scrollIntoView({behavior:"smooth"}),10);await loadFeed()}));
loadFeed();

// Step 9: task queue (project-scoped, reviewable, no automatic execution)
function refreshTaskProjects(){
 const select=$("taskProject"); if(!select)return; const current=select.value;
 select.innerHTML='<option value="">Select a project…</option>'+allProjects.map(p=>'<option value="'+escapeAttr(p.id)+'">'+escapeHtml(p.title)+'</option>').join("");
 if(allProjects.some(p=>p.id===current))select.value=current; if(select.value)loadTasks(select.value); else $("taskList").innerHTML="";
}
async function loadTasks(projectId){
 if(!projectId){$("taskStatus").textContent="Choose a project to view its task queue."; $("taskList").innerHTML="";return}
 try{
  const tasks=await api("/api/projects/"+encodeURIComponent(projectId)+"/tasks");
  $("taskStatus").textContent=tasks.length+" task(s) · status changes are saved immediately";
  $("taskList").innerHTML=tasks.length?tasks.map(t=>'<article class="task-row"><div><strong>'+escapeHtml(t.task)+'</strong><small>Added '+dateText(t.createdAt)+'</small></div><button class="small-btn" data-ai-task="'+escapeAttr(t.id)+'">AI draft</button><select data-task-status="'+escapeAttr(t.id)+'"><option'+(t.status==="Pending"?" selected":"")+'>Pending</option><option'+(t.status==="In Progress"?" selected":"")+'>In Progress</option><option'+(t.status==="Done"?" selected":"")+'>Done</option><option'+(t.status==="Blocked"?" selected":"")+'>Blocked</option></select></article>').join(""):'<p class="task-empty">No tasks yet. Add your first task above.</p>';
 }catch(e){$("taskStatus").textContent="Could not load tasks: "+e.message}
}
$("taskProject").addEventListener("change",e=>loadTasks(e.target.value));
$("taskForm").addEventListener("submit",async e=>{
 e.preventDefault();const projectId=$("taskProject").value,task=$("taskInput").value.trim();if(!projectId){showToast("Select a project first");return}if(!task)return;
 try{await api("/api/projects/"+encodeURIComponent(projectId)+"/tasks",{method:"POST",body:JSON.stringify({task})});$("taskInput").value="";await loadTasks(projectId);await refresh()}catch(err){showToast("Could not add task: "+err.message)}
});
$("taskList").addEventListener("change",async e=>{
 const sel=e.target.closest("[data-task-status]");if(!sel)return;const projectId=$("taskProject").value;
 try{await api("/api/projects/"+encodeURIComponent(projectId)+"/tasks/"+encodeURIComponent(sel.dataset.taskStatus),{method:"PATCH",body:JSON.stringify({status:sel.value})});showToast("Task status saved");await loadTasks(projectId);await refresh()}catch(err){showToast("Status update failed: "+err.message)}
});

$("taskList").addEventListener("click",async e=>{
 const btn=e.target.closest("[data-ai-task]");if(!btn)return;const projectId=$("taskProject").value,taskId=btn.dataset.aiTask;
 btn.disabled=true;btn.textContent="AI writing…";
 try{
  const draft=await api("/api/projects/"+encodeURIComponent(projectId)+"/tasks/"+encodeURIComponent(taskId)+"/ai-draft",{method:"POST"});
  $("taskDraft").innerHTML='<article class="analysis-card ai-code-card"><div class="analysis-head"><h3>Task AI Developer Draft</h3><strong>'+escapeHtml(draft.model)+'</strong></div><p>'+escapeHtml(draft.notice)+'</p><textarea id="taskDraftText" rows="20" spellcheck="false"></textarea><button class="small-btn" id="copyTaskDraft">Copy draft</button></article>';
  $("taskDraftText").value=draft.content;
  $("copyTaskDraft").addEventListener("click",async()=>{try{await navigator.clipboard.writeText($("taskDraftText").value);showToast("Task draft copied")}catch{showToast("Clipboard unavailable")}});
  $("taskDraft").scrollIntoView({behavior:"smooth",block:"start"});
 }catch(err){showToast(err.message)}
 finally{btn.disabled=false;btn.textContent="AI draft"}
});

