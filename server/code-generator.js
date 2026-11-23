// Step 7: Zero-dependency starter-code generator. Outputs editable drafts only; no execution or file writes.
function safeName(s){return String(s||"Project").replace(/[^a-z0-9]+/gi," ").trim().split(/\\s+/).map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join("")||"Project";}
export function generateStarterCode({title="",description="",stack=""}={}){
 const name=safeName(title), desc=String(description||"").trim(), isDotnet=/\\.net|asp\\.net|c#|dotnet/i.test(stack+" "+title+" "+desc);
 const files=[];
 if(isDotnet){
  files.push({path:"README.md",content:"# "+name+"\\n\\nGenerated starter files. Review requirements and adapt before use.\\n\\n"+desc});
  files.push({path:"Program.cs",content:"var builder = WebApplication.CreateBuilder(args);\\nbuilder.Services.AddControllers();\\nbuilder.Services.AddEndpointsApiExplorer();\\nbuilder.Services.AddSwaggerGen();\\nvar app = builder.Build();\\nif (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }\\napp.UseHttpsRedirection();\\napp.MapControllers();\\napp.Run();"});
  files.push({path:"Controllers/ItemsController.cs",content:"using Microsoft.AspNetCore.Mvc;\\n\\nnamespace "+name+".Controllers;\\n\\n[ApiController]\\n[Route(\"api/[controller]\")]\\npublic class ItemsController : ControllerBase\\n{\\n    [HttpGet]\\n    public IActionResult Get() => Ok(Array.Empty<object>());\\n\\n    [HttpPost]\\n    public IActionResult Create([FromBody] object input)\\n    {\\n        if (input is null) return BadRequest();\\n        // TODO: Add validation, persistence and authorization.\\n        return CreatedAtAction(nameof(Get), new { }, input);\\n    }\\n}"});
  files.push({path:"Models/ItemDto.cs",content:"namespace "+name+".Models;\\n\\npublic sealed record ItemDto(string Name);"});
  files.push({path:"Tests/ItemsControllerTests.todo.md",content:"# Test checklist\\n- GET returns expected data\\n- POST validates input\\n- Unauthorized access is rejected where applicable\\n- Database failure is handled safely"});
 }else{
  files.push({path:"README.md",content:"# "+name+"\\n\\nGenerated starter template. Review before implementation.\\n\\n"+desc});
  files.push({path:"index.html",content:"<!doctype html>\\n<html lang=\\\"en\\\"><head><meta charset=\\\"utf-8\\\"><meta name=\\\"viewport\\\" content=\\\"width=device-width,initial-scale=1\\\"><title>"+name+"</title><link rel=\\\"stylesheet\\\" href=\\\"styles.css\\\"></head><body><main><h1>"+name+"</h1><p>"+desc.replace(/[<>]/g,"")+"</p><button id=\\\"action\\\">Get started</button></main><script src=\\\"app.js\\\"></script></body></html>"});
  files.push({path:"styles.css",content:"*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:#f4f6fa;color:#182235}main{max-width:800px;margin:8vh auto;padding:24px;background:#fff;border-radius:16px}button{padding:12px 18px;border:0;border-radius:8px;cursor:pointer}"});
  files.push({path:"app.js",content:"document.getElementById('action')?.addEventListener('click',()=>alert('Connect this action to your real workflow.'));\\n// TODO: Implement requirements, validation, error states, and API calls."});
 }
 return {name,stack:isDotnet?".NET / ASP.NET Core starter":"Web starter",generatedAt:new Date().toISOString(),notice:"Draft code only. It has not been run or security-reviewed. Review and test before production.",files};
}