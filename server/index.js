import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { listOpportunities, scanFeeds } from './scanner.js';
import { analyzeOpportunity } from './analyzer.js';
import { createProposal } from './proposal.js';
import { createDevelopmentPlan } from './developer-agent.js';
import { randomUUID } from 'node:crypto';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve('data');
const DATA_FILE = path.join(DATA_DIR, 'projects.json');
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

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
app.get('/api/dashboard', async (_req, res, next) => {
  try { const projects = await readProjects(); res.json({ total: projects.length, active: projects.filter(p => ['Analyzing','Proposal','In Progress'].includes(p.status)).length, completed: projects.filter(p => p.status === 'Completed').length, budget: projects.filter(p => p.status !== 'Rejected').reduce((sum,p) => sum + (Number(p.budget)||0), 0), projects }); }
  catch (e) { next(e); }
});

app.get('/api/opportunities', async (_req,res,next)=>{try{res.json(await listOpportunities())}catch(e){next(e)}});
app.post('/api/opportunities/scan', async (_req,res,next)=>{try{res.json(await scanFeeds())}catch(e){next(e)}});
app.post('/api/opportunities/:id/save', async (req,res,next)=>{try{const items=await listOpportunities(),item=items.find(x=>x.id===req.params.id);if(!item)return res.status(404).json({error:'Opportunity not found'});const projects=await readProjects();if(projects.some(p=>p.url===item.url))return res.status(409).json({error:'Already saved as a project'});const project={id:randomUUID(),title:item.title,client:'',source:item.source||'RSS',budget:0,description:item.description||'',status:'New',url:item.url,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};projects.unshift(project);await writeProjects(projects);item.status='saved';await fs.writeFile(path.join(DATA_DIR,'opportunities.json'),JSON.stringify(items,null,2));res.status(201).json(project)}catch(e){next(e)}});

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
app.listen(PORT, () => console.log(`Online Earning Agent dashboard listening on http://localhost:${PORT}`));
