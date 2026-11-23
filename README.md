# Online Earning Agent (AI Freelance Assistant)

A zero-cost-first freelancing workspace designed around software projects (.NET, C#, ASP.NET Core, SQL, APIs).

## Run locally
Requires Node.js 20+.
1. Clone the repository.
2. Run `npm install`.
3. Run `npm start`.
4. Open `http://localhost:3000`.

## Step 2 — Dashboard
- Responsive workspace UI
- Project/opportunity add, edit, delete
- Status tracking (New, Analyzing, Proposal, In Progress, Completed, Rejected)
- Search and status filtering
- Total, active, completed, and potential-budget metrics
- Persistent local JSON storage (`data/projects.json)

## API
- `GET /api/health`
- `GET /api/projects`
- `POST /api/projects`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/dashboard`

## Step 3 — Job Finder (in progress)
Opportunity discovery is being added using RSS feeds and user-provided links. Feed availability, terms, and relevance vary; this is not guaranteed access to Upwork or Fiverr listings.

## Safety and cost
- AI APIs are optional and not enabled by default. Provider use may incur charges.
- Do not bypass login, CAPTCHA, anti-bot controls, or platform restrictions.
- The app does not auto-apply, send client messages, accept contracts, deliver work, or pay for services.
- This MVP is not secured for public hosting. Add authentication and secure deployment before exposing it online.
