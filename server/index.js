import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { listOpportunities, scanFeeds } from './scanner.js';
import { analyzeOpportunity } from './analyzer.js';
import { createProposal } from './proposal.js';
import { createDevelopmentPlan } from './developer-agent.js';
import { generateStarterCode } from './code-generator.js';
import { generateWithAI } from './ai-engine.js';
import { randomUUID } from 'node:crypto';
import archiver from 'archiver';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = path.resolve('data');
const DATA_FILE = path.join(DATA_DIR, 'projects.json');
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));
const DASHBOARD_USER = process.env.DASHBOARD_USER || '';
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || '';
if (process.env.NODE_ENV === 'production' && (!DASHBOARD_USER || !DASHBOARD_PASSWORD)) throw new Error('DASHBOARD_USER and DASHBOARD_PASSWORD must be set in production.');
app.use((req,res,next)=>{
  if(!DASHBOARD_USER || !DASHBOARD_PASSWORD) return next();
  const header=req.headers.authorization||'',match=header.match(/^Basic\\s+(.+)$/i);
  if(match){try{const decoded=Buffer.from(match[1],'base64').toString('utf8'),i=decoded.indexOf(':');if(i>=0&&decoded.slice(0,i)===DASHBOARD_USER&&decoded.slice(i+1)===DASHBOARD_PASSWORD)return next();}catch{}}
  res.setHeader('WWW-Authenticate','Basic realm="Online Earning Agent", charset="UTF-8"');
  res.status(401).send('Authentication required');
});
const FS_WORKSPACE_ENABLED = process.env.ENABLE_FILESYSTEM_WORKSPACE === 'true';


async function readProjects() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try { return JSON.parse(await fs.readFile(DATA_FILE, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
async function writeProjects(projects) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(projects, null, 2), 'utf8');
}
const statuses = ['New', 'Analyzing', 'Proposal', 'In Progress', 'Completed', 'Rejected'];

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'online-earning-agent', timestamp: new Date().toISOString() }));
app.get('/api/projects', async (_req, res, next) => { try { res.json(await readProjects()); } catch (e) { next(e); } });
app.post('/api/projects', async (req, res, next) => {
  try {
    const { title, client = '', source = 'Manual', budget = 0, description = '', status = 'New', url = '' } = req.body || {};
    if (!String(title || '').trim()) return res.status(400).json({ error: 'Project title is required.' });
    if (!statuses.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    const projects = await readProjects();
    const now = new Date().toISOString();
    const project = { id: randomUUID(), title: String(title).trim(), client: String(client).trim(), source: String(source).trim(), budget: Math.max(0, Number(budget) || 0), description: String(description).trim(), status, url: String(url).trim(), createdAt: now, updatedAt: now };
    projects.unshift(project); await writeProjects(projects); res.status(201).json(project);
  } catch (e) { next(e); }
});
app.patch('/api/projects/:id', async (req, res, next) => {
  try {
    const projects = await readProjects(); const index = projects.findIndex(p => p.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: 'Project not found.' });
    const updates = req.body || {};
    if (updates.status && !statuses.includes(updates.status)) return res.status(400).json({ error: 'Invalid status.' });
    if ('title' in updates && !String(updates.title || '').trim()) return res.status(400).json({ error: 'Project title is required.' });
    const allowed = ['title','client','source','budget','description','status','url'];
    for (const key of allowed) if (key in updates) projects[index][key] = key === 'budget' ? Math.max(0, Number(updates[key]) || 0) : String(updates[key]).trim();
    projects[index].updatedAt = new Date().toISOString(); await writeProjects(projects); res.json(projects[index]);
  } catch (e) { next(e); }
});
app.delete('/api/projects/:id', async (req, res, next) => {
  try { const projects = await readProjects(); const nextList = projects.filter(p => p.id !== req.params.id); if (nextList.length === projects.length) return res.status(404).json({ error: 'Project not found.' }); await writeProjects(nextList); res.status(204).end(); }
  catch (e) { next(e); }
});
app.get('/api/projects/:id/tasks', async (req, res, next) => {
  try { const projects = await readProjects(); const p = projects.find(x => x.id === req.params.id); if (!p) return res.status(404).json({ error: 'Project not found.' }); res.json(p.tasks || []); }
  catch (e) { next(e); }
});
app.post('/api/projects/:id/tasks', async (req, res, next) => {
  try {
    const task = String(req.body?.task || '').trim(); if (!task) return res.status(400).json({ error: 'Task text is required.' });
    const projects = await readProjects(); const p = projects.find(x => x.id === req.params.id); if (!p) return res.status(404).json({ error: 'Project not found.' });
    p.tasks = p.tasks || []; const item = { id: randomUUID(), task: task.slice(0, 1000), status: 'Pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    p.tasks.unshift(item); p.updatedAt = new Date().toISOString(); await writeProjects(projects); res.status(201).json(item);
  } catch (e) { next(e); }
});
app.post('/api/projects/:id/tasks/:taskId/ai-draft', async (req, res, next) => {
  try {
    const projects = await readProjects();
    const project = projects.find(x => x.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found.' });
    const task = (project.tasks || []).find(x => x.id === req.params.taskId);
    if (!task) return res.status(404).json({ error: 'Task not found.' });
    const promptDescription = [
      'Project: ' + String(project.title || '').slice(0, 300),
      'Project requirements: ' + String(project.description || '').slice(0, 10000),
      'Task to implement: ' + String(task.task || '').slice(0, 1000),
      'Existing project context (if any): ' + String(req.body?.context || '').slice(0, 10000),
      'Return a focused implementation draft with filenames, complete code blocks, assumptions, and test/validation steps. Avoid unrelated refactoring.'
    ].join('\n\n');
    const draft = await generateWithAI({ title: project.title + ' — ' + task.task, description: promptDescription, mode: 'code' });
    task.aiDraft = draft;
    task.updatedAt = new Date().toISOString();
    project.updatedAt = task.updatedAt;
    await writeProjects(projects);
    res.json(draft);
  } catch (e) { res.status(e.status || 500).json({ error: e.message || 'Task AI draft failed.' }); }
});
app.patch('/api/projects/:id/tasks/:taskId', async (req, res, next) => {
  try {
    const status = String(req.body?.status || ''); if (!['Pending','In Progress','Done','Blocked'].includes(status)) return res.status(400).json({ error: 'Invalid task status.' });
    const projects = await readProjects(); const p = projects.find(x => x.id === req.params.id); if (!p) return res.status(404).json({ error: 'Project not found.' });
    const task = (p.tasks || []).find(x => x.id === req.params.taskId); if (!task) return res.status(404).json({ error: 'Task not found.' });
    task.status = status; task.updatedAt = new Date().toISOString(); p.updatedAt = task.updatedAt; await writeProjects(projects); res.json(task);
  } catch (e) { next(e); }
});
// Step 11: project workspace files are stored as drafts inside project JSON.
const cleanWorkspacePath = (input) => {
  const raw = String(input || '').replace(/\\/g, '/').trim();
  if (!raw || raw.length > 180 || raw.startsWith('/') || raw.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Invalid workspace file path.');
  return raw.split('/').map(part => part.replace(/[^a-zA-Z0-9._-]/g, '_')).join('/');
};
app.get('/api/projects/:id/workspace', async (req, res, next) => {
  try { const projects = await readProjects(); const p = projects.find(x => x.id === req.params.id); if (!p) return res.status(404).json({ error: 'Project not found.' }); res.json({ files: p.workspaceFiles || [] }); }
  catch (e) { next(e); }
});
app.put('/api/projects/:id/workspace/file', async (req, res, next) => {
  try {
    const filePath = cleanWorkspacePath(req.body?.path); const content = String(req.body?.content ?? '');
    if (content.length > 500000) return res.status(413).json({ error: 'File content too large (500 KB max).' });
    const projects = await readProjects(); const p = projects.find(x => x.id === req.params.id); if (!p) return res.status(404).json({ error: 'Project not found.' });
    p.workspaceFiles = p.workspaceFiles || []; const existing = p.workspaceFiles.find(f => f.path === filePath);
    if (existing) { existing.content = content; existing.updatedAt = new Date().toISOString(); } else p.workspaceFiles.push({ path: filePath, content, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    p.updatedAt = new Date().toISOString(); await writeProjects(projects); res.json({ path: filePath, saved: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.post('/api/projects/:id/workspace/ai-edit', async (req, res, next) => {
  try {
    const filePath = cleanWorkspacePath(req.body?.path); const prompt = String(req.body?.prompt || '').trim().slice(0, 8000);
    if (!prompt) return res.status(400).json({ error: 'Describe the change you want.' });
    const projects = await readProjects(); const p = projects.find(x => x.id === req.params.id); if (!p) return res.status(404).json({ error: 'Project not found.' });
    const existing = (p.workspaceFiles || []).find(f => f.path === filePath);
    const context = 'Project: '+p.title+'\\nProject requirements: '+String(p.description||'').slice(0,8000)+'\\nTarget filename: '+filePath+'\\nUser requested change: '+prompt+'\\nCurrent file contents:\\n'+String(existing?.content||'').slice(0,30000)+'\\nReturn ONLY the complete replacement file contents. No markdown fences.';
    const result = await generateWithAI({ title: 'Edit '+filePath, description: context, mode: 'code' });
    res.json({ path: filePath, content: result.content, model: result.model, notice: result.notice, original: existing?.content || '' });
  } catch (e) { res.status(e.status || 500).json({ error: e.message || 'AI workspace edit failed.' }); }
});
app.get('/api/projects/:id/workspace.zip', async (req, res, next) => {
  try {
    const projects = await readProjects(); const p = projects.find(x => x.id === req.params.id); if (!p) return res.status(404).json({ error: 'Project not found.' });
    const files = p.workspaceFiles || []; if (!files.length) return res.status(400).json({ error: 'Workspace is empty. Save at least one file first.' });
    res.setHeader('Content-Type', 'application/zip'); res.setHeader('Content-Disposition', 'attachment; filename="project-workspace.zip"');
    const archive = archiver('zip', { zlib: { level: 9 } }); archive.on('error', err => next(err)); archive.pipe(res);
    for (const file of files) archive.append(String(file.content || ''), { name: cleanWorkspacePath(file.path) });
    archive.finalize();
  } catch (e) { next(e); }
});
// Step 12: real filesystem project scanner, bounded to configured project root.
const PROJECT_ROOT = path.resolve(process.env.PROJECT_ROOT || process.cwd());
const ignoredFolders = new Set(['.git','node_modules','.next','dist','build','coverage','.idea','.vscode']);
const ignoredFiles = new Set(['.env','.env.local','.env.production','id_rsa','id_ed25519']);
const allowedTextExtensions = new Set(['.js','.mjs','.cjs','.ts','.tsx','.jsx','.cs','.sql','.json','.html','.css','.scss','.md','.txt','.xml','.yml','.yaml','.config','.csproj','.sln','.sh','.ps1']);
async function verifyInsideRoot(absolute){const real=await fs.realpath(absolute),root=await fs.realpath(PROJECT_ROOT);if(real!==root&&!real.startsWith(root+path.sep))throw new Error('Symlink path outside project root blocked.');return real;}
function resolveProjectFile(rel) {
  if(typeof rel!=='string'||!rel.trim()||rel.length>600||path.isAbsolute(rel))throw new Error('Invalid relative file path.');
  const absolute=path.resolve(PROJECT_ROOT,rel);
  if(absolute!==PROJECT_ROOT&&!absolute.startsWith(PROJECT_ROOT+path.sep))throw new Error('Path outside project root blocked.');
  const segments=rel.replace(/\\/g,'/').split('/');
  if(segments.some(s=>!s||s==='.'||s==='..'||s.startsWith('.env')))throw new Error('Unsafe path segment.');
  if(ignoredFiles.has(path.basename(absolute)))throw new Error('Sensitive file blocked.');
  return absolute;
}
async function scanProjectTree(dir=PROJECT_ROOT,depth=0,items=[],relBase=PROJECT_ROOT){
  if(depth>9||items.length>350)return items;
  let entries=[];try{entries=await fs.readdir(dir,{withFileTypes:true});}catch{return items}
  entries.sort((a,b)=>a.name.localeCompare(b.name));
  for(const entry of entries){
    if(items.length>=350)break;
    if(entry.name.startsWith('.')||ignoredFolders.has(entry.name)||ignoredFiles.has(entry.name))continue;
    const full=path.join(dir,entry.name), rel=path.relative(relBase,full);
    try{
      const st=await fs.lstat(full); if(st.isSymbolicLink())continue;
      if(st.isDirectory()){items.push({path:rel,type:'directory'});await scanProjectTree(full,depth+1,items,relBase);}
      else if(st.isFile())items.push({path:rel,type:'file',size:st.size,editable:allowedTextExtensions.has(path.extname(entry.name).toLowerCase())&&st.size<=300000});
    }catch{}
  }
  return items;
}
app.get('/api/fs/scan',async(_req,res,next)=>{if(!FS_WORKSPACE_ENABLED)return res.status(403).json({error:'Local filesystem workspace disabled on cloud hosting.'});try{res.json({rootName:path.basename(PROJECT_ROOT),files:await scanProjectTree()})}catch(e){next(e)}});
app.get('/api/fs/file',async(req,res,next)=>{if(!FS_WORKSPACE_ENABLED)return res.status(403).json({error:'Local filesystem workspace disabled on cloud hosting.'});try{const absolute=await verifyInsideRoot(resolveProjectFile(req.query.path));const st=await fs.lstat(absolute);if(!st.isFile()||st.size>300000||!allowedTextExtensions.has(path.extname(absolute).toLowerCase()))return res.status(400).json({error:'File is not an editable text file or exceeds 300 KB.'});res.json({path:req.query.path,content:await fs.readFile(absolute,'utf8')});}catch(e){res.status(400).json({error:e.message})}});
app.put('/api/fs/file',async(req,res,next)=>{if(!FS_WORKSPACE_ENABLED)return res.status(403).json({error:'Local filesystem workspace disabled on cloud hosting.'});try{const absolute=await verifyInsideRoot(resolveProjectFile(req.body?.path)),content=String(req.body?.content??'');if(content.length>300000)return res.status(413).json({error:'File exceeds 300 KB.'});if(!allowedTextExtensions.has(path.extname(absolute).toLowerCase()))return res.status(400).json({error:'Extension not allowed for editing.'});const st=await fs.lstat(absolute);if(!st.isFile()||st.isSymbolicLink())return res.status(400).json({error:'Only existing regular files can be updated.'});await fs.writeFile(absolute,content,'utf8');res.json({saved:true,path:req.body.path});}catch(e){res.status(400).json({error:e.message})}});
app.post('/api/fs/bug-fix',async(req,res,next)=>{if(!FS_WORKSPACE_ENABLED)return res.status(403).json({error:'Local filesystem workspace disabled on cloud hosting.'});try{const rel=String(req.body?.path||''),bug=String(req.body?.problem||'').trim().slice(0,6000);if(!bug)return res.status(400).json({error:'Describe the error or bug.'});const absolute=await verifyInsideRoot(resolveProjectFile(rel)),st=await fs.lstat(absolute);if(!st.isFile()||st.size>300000||!allowedTextExtensions.has(path.extname(absolute).toLowerCase()))return res.status(400).json({error:'File is not a supported text file.'});const original=await fs.readFile(absolute,'utf8');const prompt='Review and fix this code. User reported problem: '+bug+'\\nProject file: '+rel+'\\nCurrent code:\\n'+original.slice(0,25000)+'\\nReturn only a complete replacement file, no markdown fences. Keep unrelated code intact. Do not invent APIs; include a short explanation after the code only if impossible to fit as comments.';const ai=await generateWithAI({title:'Bug fix: '+rel,description:prompt,mode:'code'});res.json({path:rel,original,content:ai.content,model:ai.model});}catch(e){res.status(e.status||500).json({error:e.message||'AI bug fix failed.'})}});
app.get('/api/dashboard', async (_req, res, next) => {
  try { const projects = await readProjects(); res.json({ total: projects.length, active: projects.filter(p => ['Analyzing','Proposal','In Progress'].includes(p.status)).length, completed: projects.filter(p => p.status === 'Completed').length, budget: projects.filter(p => p.status !== 'Rejected').reduce((sum,p) => sum + (Number(p.budget)||0), 0), projects }); }
  catch (e) { next(e); }
});

app.get('/api/opportunities', async (_req,res,next)=>{try{res.json(await listOpportunities())}catch(e){next(e)}});
app.post('/api/opportunities/scan', async (_req,res,next)=>{try{res.json(await scanFeeds())}catch(e){next(e)}});
app.post('/api/opportunities/:id/save', async (req,res,next)=>{try{const items=await listOpportunities(),item=items.find(x=>x.id===req.params.id);if(!item)return res.status(404).json({error:'Opportunity not found'});const projects=await readProjects();if(projects.some(p=>p.url===item.url))return res.status(409).json({error:'Already saved as a project'});const project={id:randomUUID(),title:item.title,client:'',source:item.source||'RSS',budget:0,description:item.description||'',status:'New',url:item.url,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};projects.unshift(project);await writeProjects(projects);item.status='saved';await fs.writeFile(path.join(DATA_DIR,'opportunities.json'),JSON.stringify(items,null,2));res.status(201).json(project)}catch(e){next(e)}});

app.post('/api/opportunities/:id/ai-code', async (req, res, next) => {
  try {
    const items = await listOpportunities();
    const item = items.find(x => x.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Opportunity not found.' });
    const result = await generateWithAI({ title: item.title, description: item.description, mode: 'code' });
    item.aiCodeDraft = result;
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, 'opportunities.json'), JSON.stringify(items, null, 2), 'utf8');
    res.json(result);
  } catch (e) { res.status(e.status || 500).json({ error: e.message || 'AI generation failed.' }); }
});

app.post('/api/opportunities/:id/generate-code', async (req, res, next) => {
  try {
    const items = await listOpportunities();
    const item = items.find(x => x.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Opportunity not found.' });
    const output = generateStarterCode({ title: item.title, description: item.description, stack: req.body?.stack || '' });
    item.codeDraft = output;
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, 'opportunities.json'), JSON.stringify(items, null, 2), 'utf8');
    res.json(output);
  } catch (e) { next(e); }
});

app.post('/api/opportunities/:id/analyze', async (req, res, next) => {
  try {
    const items = await listOpportunities();
    const item = items.find(x => x.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Opportunity not found.' });
    item.analysis = analyzeOpportunity(item);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, 'opportunities.json'), JSON.stringify(items, null, 2), 'utf8');
    res.json(item.analysis);
  } catch (e) { next(e); }
});

app.post('/api/opportunities/:id/draft-proposal', async (req, res, next) => {
  try {
    const items = await listOpportunities();
    const item = items.find(x => x.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Opportunity not found.' });
    item.proposalDraft = createProposal(item);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, 'opportunities.json'), JSON.stringify(items, null, 2), 'utf8');
    res.json(item.proposalDraft);
  } catch (e) { next(e); }
});

app.post('/api/opportunities/:id/development-plan', async (req, res, next) => {
  try {
    const items = await listOpportunities();
    const item = items.find(x => x.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Opportunity not found.' });
    item.developmentPlan = createDevelopmentPlan(item);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(DATA_DIR, 'opportunities.json'), JSON.stringify(items, null, 2), 'utf8');
    res.json(item.developmentPlan);
  } catch (e) { next(e); }
});

app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Unexpected server error.' }); });
app.listen(PORT, HOST, () => console.log(`Online Earning Agent dashboard listening on http://${HOST}:${PORT}`));
