const skills = ["C#", ".NET / ASP.NET Core", "REST APIs", "SQL Server", "API integration", "debugging", "performance optimization"];
export function createProposal(item = {}) {
  const title = String(item.title || "your project");
  const description = String(item.description || "").replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").trim().slice(0, 1800);
  const lower = (title + " " + description).toLowerCase();
  const focus = [];
  if (/\\.net|asp\\.net|c#|dotnet/.test(lower)) focus.push("C# and ASP.NET/.NET development");
  if (/sql|database|mysql|postgres/.test(lower)) focus.push("database design, SQL queries, and data handling");
  if (/api|integration|webhook|rest/.test(lower)) focus.push("REST API development and integrations");
  if (/report|dashboard|analytics|excel/.test(lower)) focus.push("reporting and data presentation");
  if (/bug|fix|error|debug/.test(lower)) focus.push("debugging and targeted fixes");
  if (!focus.length) focus.push("understanding the requirements and delivering a maintainable implementation");
  return {
    generatedAt: new Date().toISOString(),
    title,
    proposal: `Hello,

I read your project requirements for "${title}" and can help you deliver a reliable, maintainable solution.

My experience includes ${skills.join(", ")}. For this project, I would focus on ${focus.join("; ")}.

My approach:
1. Confirm the scope, expected output, and acceptance criteria.
2. Implement the solution in small, reviewable steps.
3. Test the key flows and address issues found.
4. Share progress and provide clear handover notes.

${description ? "Based on the details shared: " + description + "\\n\\n" : ""}I can discuss the exact scope and timeline before starting so we can agree on a realistic plan.

Regards`,
    suggestedQuestions: ["What are the required deliverables and acceptance criteria?", "Is there an existing codebase or database to work with?", "What is your target deadline and preferred milestone plan?"],
    note: "Draft only—review the facts, scope, and tone before sending. Do not claim skills or commitments you cannot verify."
  };
}
