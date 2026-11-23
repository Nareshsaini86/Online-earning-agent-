# Online Earning Agent (AI Freelance Assistant)

A zero-cost-first, self-hostable web dashboard that helps discover software opportunities, score them, track them, and prepare proposals. It is designed around .NET/C#/ASP.NET Core/SQL skills.

## Safety & platform notes
- This is an assistant, not a guaranteed earning bot.
- Use platform-approved APIs, feeds, email alerts, or manually supplied links. Do not bypass login, CAPTCHA, or platform anti-bot rules.
- It does not auto-apply, accept contracts, send messages, deliver work, or spend money. Those actions require your review.
- AI features are optional and require an API key; API use can cost money. No key is used by default.
- MVP discovery uses configured RSS feeds and manual job import. Feed availability and terms vary.

## Quick start
1. Install Node.js 20+.
2. Copy `.env.example` to `.env` if you want to configure settings.
3. Run `npm install`, then `npm start`.
4. Open http://localhost:3000


## Features
- Mobile-responsive dashboard
- RSS discovery and manual job intake
- Opportunity score and skill matching
- Job details, status tracking and notes
- Proposal draft generation (template-based)
- Optional AI enhancement (disabled unless configured)
- Local JSON store; no external database needed
- API endpoints and health check


## Configuration
See `.env.example`. Never commit `.env`, tokens, passwords, or API keys.


## Roadmap
- MVP: dashboard, RSS/manual discovery, scoring, proposal drafts
- Optional AI analysis and proposal drafting
- Sandbox workspace and test runner for approved projects
- Platform connectors only where official APIs and terms permit


## Limitations
No guarantees of job source coverage, automated outreach, project completion, or earnings. Review opportunities and proposals before submitting.
