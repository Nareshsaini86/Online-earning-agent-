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
