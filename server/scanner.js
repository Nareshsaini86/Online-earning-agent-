import Parser from "rss-parser";
import fs from "node:fs/promises";
import path from "node:path";

const parser=new Parser({timeout:12000,headers:{"User-Agent":"OnlineEarningAgent/0.1 (RSS reader)"}});
const file=path.resolve("data","opportunities.json");
const feeds=(process.env.JOB_RSS_FEEDS||"https://hnrss.org/jobs").split(";").map(s=>s.trim()).filter(Boolean);
const skills=[".net","asp.net","c#","sql","api","backend","software","developer","web","programming","freelance","remote"];
function score(item){const text=(item.title+" "+item.description).toLowerCase();let points=0;const matched=[];for(const k of skills)if(text.includes(k)){points+=k==="c#"?3:2;matched.push(k)}if(/remote|anywhere|work from home/i.test(text))points+=2;return {score:Math.min(100,points*6),matched}}
async function readSaved(){try{return JSON.parse(await fs.readFile(file,"utf8"))}catch(e){if(e.code==="ENOENT")return [];throw e}}
async function saveSaved(list){await fs.mkdir(path.dirname(file),{recursive:true});const tmp=file+".tmp";await fs.writeFile(tmp,JSON.stringify(list,null,2));await fs.rename(tmp,file)}
export async function listOpportunities(){return readSaved()}
export async function scanFeeds(){const saved=await readSaved(),byUrl=new Map(saved.map(x=>[x.url,x]));let fetched=0,errors=[];for(const url of feeds){try{const feed=await parser.parseURL(url);fetched++;for(const item of (feed.items||[]).slice(0,80)){const link=item.link||item.guid;if(!link||!/^https?:\/\//i.test(link))continue;const title=String(item.title||"Untitled opportunity").slice(0,250),description=String(item.contentSnippet||item.content||item.summary||"").replace(/<[^>]*>/g," ").slice(0,4000),analysis=score({title,description});const existing=byUrl.get(link);byUrl.set(link,{id:existing?.id||Buffer.from(link).toString("base64url").slice(0,36),title,description,url:link,source:feed.title||new URL(url).hostname,publishedAt:item.isoDate||item.pubDate||null,score:analysis.score,matchedSkills:analysis.matched,status:existing?.status||"new",scannedAt:new Date().toISOString()})}}catch(e){errors.push({feed:url,error:String(e.message||e).slice(0,220)})}}const result=[...byUrl.values()].sort((a,b)=>b.score-a.score);await saveSaved(result);return {items:result,feedsConfigured:feeds.length,feedsFetched:fetched,errors,scannedAt:new Date().toISOString()}}
