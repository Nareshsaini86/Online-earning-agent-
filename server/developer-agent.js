// Zero-cost development planner. It creates a reviewable plan; it does not execute or modify client code.
const checks = [
  { key: "auth", label: "Authentication / roles", re: /auth|login|sign.?in|user|role|permission/i },
  { key: "db", label: "Database / data model", re: /database|sql|data|crud|table|schema/i },
  { key: "api", label: "API / integration", re: /api|integration|rest|webhook|third.?party/i },
  { key: "ui", label: "UI / frontend", re: /ui|frontend|web|page|form|dashboard|responsive/i },
  { key: "payment", label: "Payment / billing", re: /payment|billing|checkout|wallet|stripe|razorpay/i },
  { key: "report", label: "Reports / exports", re: /report|analytics|excel|csv|pdf/i },
  { key: "deploy", label: "Deployment / hosting", re: /deploy|hosting|production|cloud|docker/i },
  { key: "test", label: "Testing / bug fixes", re: /test|bug|fix|error|quality/i },
];
export function createDevelopmentPlan(item = {}) {
  const title = String(item.title || "Untitled opportunity");
  const description = String(item.description || "").replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").trim();
  const text = (title + " " + description).toLowerCase();
  const found = checks.filter(c => c.re.test(text));
  const tasks = [
    { phase: "Discovery", task: "Confirm scope, inputs/outputs, acceptance criteria, deadline and existing codebase." },
    { phase: "Design", task: "Define architecture, data model, API contracts and edge cases." },
    { phase: "Implementation", task: "Create a small working vertical slice; keep changes isolated and reviewable." },
    { phase: "Validation", task: "Test success, validation failures, empty data, permissions and error handling." },
    { phase: "Delivery", task: "Prepare deployment notes, configuration checklist and handover summary." },
  ];
  found.forEach(f => tasks.splice(2, 0, { phase: "Implementation", task: "Implement " + f.label + " and document its behavior." }));
  const files = [];
  if (/\\.net|asp\\.net|c#|dotnet/.test(text)) files.push("src/Api/Controllers or endpoint files", "src/Application/Services", "src/Domain/Models", "src/Infrastructure/Data", "tests/");
  else files.push("src/", "tests/", "README.md");
  if (/sql|database|schema|crud/.test(text)) files.push("database/migrations or schema scripts");
  if (/api|integration|webhook/.test(text)) files.push("docs/api-contract.md");
  if (/deploy|hosting|production|docker/.test(text)) files.push("deployment/configuration checklist");
  const hours = Math.max(4, Math.min(160, 6 + found.length * 5 + Math.ceil(description.length / 250) * 2));
  return {
    createdAt: new Date().toISOString(), title, summary: "Plan generated from title and description keywords. Review and adjust before implementation.",
    phases: ["Discovery", "Design", "Implementation", "Validation", "Delivery"],
    detectedAreas: found.map(f => f.label), tasks, suggestedFiles: [...new Set(files)],
    estimatedHours: hours, assumptions: ["Requirements may be incomplete.", "Estimate is heuristic and excludes client feedback/unknown legacy constraints."],
    nextStep: "Paste or confirm the complete requirements and existing code structure before generating code.",
    safeMode: "No files are created, commands are executed, or client-facing actions are performed by this planner."
  };
}
