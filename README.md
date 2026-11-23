# Online Earning Agent (AI Freelance Assistant)

Zero-cost-first freelance workspace built around software development skills (.NET, C#, ASP.NET Core, SQL and APIs).

## Run locally
- Node.js 20+
- `npm install`
- `npm start`
- Open `http://localhost:3000`

## Step 2 — Dashboard
- Responsive dashboard layout
- Add, edit, and delete saved projects/opportunities
- Project statuses: New, Analyzing, Proposal, In Progress, Completed, Rejected
- Search and status filter
- Total, active, completed and potential-budget statistics
- JSON persistence in `data/projects.json`

## Step 3 — Job Finder (early implementation)
- Configurable RSS feed scan via `JOB_RSS_FEEDS` (semicolon-separated)
- RSS opportunity list with source, date, matched skill tags and basic relevance score
- Open original listing in its source site
- Save a feed result into Projects for tracking
- Feed results stored locally in `data/opportunities.json`
- Current default feed: Hacker News Jobs RSS. It is not a guaranteed freelancing marketplace feed; discovery sources are limited and feed quality can vary.

## API routes
- `GET /api/health`
- `GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/:id`, `DELETE /api/projects/:id`
- `GET /api/dashboard`
- `GET /api/opportunities`, `POST /api/opportunities/scan`, `POST /api/opportunities/:id/save`

## Safety & cost
- No AI API key is configured or required for the dashboard/feed scanner.
- RSS access only; do not bypass login, CAPTCHA, anti-bot controls, or marketplace restrictions.
- No automatic applications, client messages, contract acceptance, delivery, or payments.
- This local MVP is not ready for public hosting. Add authentication and security hardening before exposing it.

## Step 4 — Job Analyzer (rule-based, zero-cost)
- Analyze a saved RSS opportunity using local keyword rules; no AI API or paid service required.
- Shows difficulty, rough hours, skill-fit score, opportunity score, recommendation, complexity signals and risk flags.
- Analysis is stored with the opportunity in `data/opportunities.json`.
- API: `POST /api/opportunities/:id/analyze`
- Estimates are heuristic only and should not replace reading the full scope or checking the client.

## Step 5 — Proposal Generator (draft-only)
- Creates a tailored proposal draft from the opportunity title and description using a local template and keyword focus areas.
- Editable proposal text, copy button, and client clarification questions.
- No paid AI API, auto-send, or application submission.
- API: `POST /api/opportunities/:id/draft-proposal`

## Step 6 — Development Planner (zero-cost, safe mode)
- Builds a structured plan from the opportunity title/description using keyword rules.
- Displays task phases, detected areas, heuristic effort estimate, and suggested file structure.
- Copy the plan for later use; it does not create files, execute code, or contact clients.
- API: `POST /api/opportunities/:id/development-plan`
- This is a planning assistant, not an AI code-writing model yet.
