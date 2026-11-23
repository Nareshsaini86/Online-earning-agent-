// Optional OpenAI-compatible AI provider. Disabled when no API key is configured.
export async function generateWithAI({title="",description="",mode="code"}={}){
 const apiKey=process.env.AI_API_KEY;
 if(!apiKey) throw Object.assign(new Error("AI is not configured. Set AI_API_KEY in .env to enable this feature."),{status:503});
 const base=(process.env.AI_BASE_URL||"https://api.openai.com/v1").replace(/\/$/,"");
 const model=process.env.AI_MODEL||"gpt-4o-mini";
 const safeTitle=String(title||"Project").slice(0,300);
 const safeDesc=String(description||"").slice(0,12000);
 const task=mode==="code"?"Design and write implementation starter code for this task. Provide clear filenames and complete code blocks, prioritize a minimal useful vertical slice, include input validation and security notes, and do not claim it was tested.":"Analyze this freelance task and provide a concise implementation plan, assumptions, clarifying questions, risk list, and suggested acceptance tests.";
 const messages=[
  {role:"system",content:"You are a careful software engineering assistant. Never invent confirmed requirements. Avoid hard-coded secrets. Do not propose bypassing authentication, platform rules, or security controls. Output plain text with Markdown."},
  {role:"user",content:task+"\n\nTitle: "+safeTitle+"\n\nRequirements:\n"+safeDesc}
 ];
 const response=await fetch(base+"/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},body:JSON.stringify({model,messages,temperature:0.2})});
 if(!response.ok){const msg=(await response.text()).slice(0,500);throw Object.assign(new Error("AI provider returned HTTP "+response.status+": "+msg),{status:502});}
 const data=await response.json();
 const content=data?.choices?.[0]?.message?.content;
 if(typeof content!=="string"||!content.trim())throw Object.assign(new Error("AI provider returned an empty response."),{status:502});
 return {title:safeTitle,mode,model,generatedAt:new Date().toISOString(),content,notice:"AI-generated draft. Review requirements, code, dependencies, and security before using. It has not been executed or tested."};
}