// Zero-cost, rule-based opportunity analysis. No external AI/API calls.
const skillPatterns = [
  { label: ".NET / C#", re: /\\.net|asp\\.net|c#|dotnet/i },
  { label: "SQL / Database", re: /sql|database|mysql|postgres|mongodb/i },
  { label: "API / Backend", re: /api|backend|rest|integration|server/i },
  { label: "Frontend", re: /react|angular|javascript|html|css|frontend|ui/i },
  { label: "Cloud / DevOps", re: /azure|aws|docker|devops|deploy|cloud/i },
  { label: "Mobile", re: /flutter|android|ios|mobile app/i },
];
const riskPatterns = [
  { label: "Vague requirements", re: /details later|not sure|idea only|need suggestions/i },
  { label: "Unclear budget", re: /budget.*(negotiable|flexible|not decided)|no budget/i },
  { label: "Urgent deadline", re: /urgent|asap|immediately|within 24 hours|today/i },
  { label: "Large scope signal", re: /full platform|complete system|entire application|from scratch/i },
  { label: "Payment / access concern", re: /free sample|unpaid test|pay.*outside|telegram|whatsapp only/i },
];
const complexityPatterns = [
  { label: "Authentication / permissions", re: /auth|login|sign.?in|role|permission|security/i, hours: 5 },
  { label: "Payments", re: /payment|checkout|billing|wallet|razorpay|stripe/i, hours: 8 },
  { label: "Third-party integrations", re: /integration|third.?party|webhook|external api/i, hours: 6 },
  { label: "Reports / data processing", re: /report|dashboard|analytics|excel|csv|data processing/i, hours: 5 },
  { label: "Database / migration", re: /database|sql|migration|schema/i, hours: 5 },
  { label: "UI / multiple pages", re: /ui|frontend|multiple pages|responsive|design/i, hours: 6 },
  { label: "Testing / deployment", re: /test|deploy|production|hosting/i, hours: 4 },
];
export function analyzeOpportunity(item = {}) {
  const text = [item.title, item.description].filter(Boolean).join(" ");
  const matchedSkills = skillPatterns.filter(s => s.re.test(text)).map(s => s.label);
  const risks = riskPatterns.filter(r => r.re.test(text)).map(r => r.label);
  const complexity = complexityPatterns.filter(c => c.re.test(text));
  const wordCount = text.trim().split(/\\s+/).filter(Boolean).length;
  const estimatedHours = Math.max(2, Math.min(120, 3 + complexity.reduce((sum, c) => sum + c.hours, 0) + Math.ceil(wordCount / 180)));
  const difficulty = complexity.length >= 5 || risks.includes("Large scope signal") ? "High" : complexity.length >= 2 ? "Medium" : "Low";
  const skillFit = Math.min(100, matchedSkills.reduce((sum, s) => sum + (s === ".NET / C#" ? 30 : s === "SQL / Database" ? 20 : s === "API / Backend" ? 20 : 10), 0));
  const budget = Number(item.budget || item.budgetAmount || 0);
  const budgetPerHour = budget > 0 ? Math.round(budget / estimatedHours) : null;
  const score = Math.max(0, Math.min(100, Math.round(skillFit * 0.55 + (difficulty === "Low" ? 25 : difficulty === "Medium" ? 15 : 5) + (risks.length ? Math.max(0, 15 - risks.length * 4) : 20))));
  const recommendation = risks.includes("Payment / access concern") || score < 30 ? "Skip" : score >= 65 && difficulty !== "High" ? "Review / Consider applying" : "Review carefully";
  return {
    analyzedAt: new Date().toISOString(), difficulty, estimatedHours, matchedSkills, skillFitScore: skillFit,
    complexitySignals: complexity.map(c => c.label), risks, budgetEstimate: budget || null, estimatedBudgetPerHour: budgetPerHour,
    opportunityScore: score, recommendation, disclaimer: "Rule-based estimate only. Verify scope, budget, deadline, client and platform rules before applying."
  };
}
