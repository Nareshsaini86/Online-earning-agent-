# Online Earning Agent (AI Freelance Assistant)

A zero-cost-first, self-hostable workspace for collecting software freelance opportunities, tracking projects, and preparing proposals. This project is being built in stages.

## Step 2 — Dashboard (implemented)
- Responsive mobile and desktop dashboard
- Project create, edit, delete
- Project statuses: New, Analyzing, Proposal, In Progress, Completed, Rejected
- Search projects and filter by status
- Summary cards for project counts and potential budget (not actual income)
- Project fields: title, client, source, budget (USD), URL, description
- Express API and local JSON persistence
- Health endpoint

## Quick start
1. Install Node.js 20 or newer.
2. Clone this repository.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000`.

No AI provider key is needed to run the dashboard. `.env` is optional for the dashboard. Do not commit credentials.

## API
- `GET /api/health` — server health
- `GET /api/projects` — list projects
- `POST /api/projects` — create project
- `PATCH /api/projects/:id` — update project
- `DELETE /api/projects/:id` — delete project
- `GET /api/dashboard` — project summary

## Safety and limitations
- This is a project tracker, not a guaranteed income bot.
- Project data is stored in a local JSON file in the server's `data/` directory. On some hosting platforms, ephemeral filesystems may reset; persistent storage is required for reliable hosted use.
- No automatic client messages, applications, contract acceptance, project delivery, or payments are enabled.
- Opportunity sources and integrations will be added in later steps, using official APIs, feeds, or permitted methods. Never bypass platform login, CAPTCHA, or anti-bot controls.
- AI features will be optional and must be configured separately. API usage may incur fees; no paid services should be enabled without approval.

## Roadmap
- Step 2: Dashboard and project management — implemented
- Next: job discovery feeds and opportunity analysis
- Later: proposal drafting, approved coding workspace/test runner, notifications, and permitted platform integrations

Review all job details and proposals before submitting. Earnings are not guaranteed.
