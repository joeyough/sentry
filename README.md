# Sentry — VDA Ticketing & Customer Portal

A focused ticketing system and customer portal for VDA Labs' SOC team. Built to replace the manual copy-paste between Securonix SNYPR, Gmail, and Hudu that runs the SOC's daily workflow today.

Built by 3Nails Infosec. VDA operates the deployment and controls its operational data throughout. No vendor lock-in — the tool survives if 3Nails disappears. Commercial structure is flexible and shaped together.

## What this is (and what it isn't)

**This is:**

- A ticketing system for VDA's ~11 SOC analysts and ~150 customers
- A SNYPR bridge that turns analyst-initiated Securonix incidents into tickets, with the correct customer auto-recognized and contacts pre-filled
- An email bridge that turns customer replies to `soc@vdalabs.com` into ticket activity
- A mobile-responsive customer portal (open a case, view tickets, contract summary, documents)

**This is not:**

- A SIEM or XDR platform. VDA has SNYPR. We don't compete with it.
- A CRM, quoting tool, or project management system. Halo tried to be those. It failed.
- A system of record for security telemetry. Sensitive data stays in SNYPR — we reference incident IDs.

## Why this exists

Halo was a 5-month POC that consumed 100–200 hours of Jim Blankenship's configuration time and produced nothing usable. It was sold white-glove, delivered as homework, and expanded into everything (CRM, project management, invoicing) before it could deliver the one thing the SOC actually needed — ticketing. The implementation team also largely vanished after the sale, leaving Jim to configure API endpoints alone.

Kendall (VDA leadership) signed off on trying this again, with stricter scope discipline. This repo is the second attempt.

Full postmortem and the three-phase plan are in the deck: `public/VDA_SecOps_Plan.pdf`.

## The phases

This repo builds Phase 1 only. The later phases are named so the direction is clear, but nothing here commits to them.

- **Phase 1 — Ticketing MVP.** 8 weeks. The analyst console, SNYPR bridge, email bridge, SLA clock, wrong-client prevention, and the mobile-responsive customer portal. First customer notification sent from the tool in week 5; build buffered to 8.
- **Phase 2 — Reporting + Native Apps.** Templated monthly customer reports, the rest of Halo's requirements list, and native iOS/Android customer apps. Scoped and priced separately, after Phase 1 proves out.
- **Phase 3 — Full Platform.** The Halo-shaped everything. Not before 2027, not before Phase 1 and Phase 2 prove out.

## What's in this repo

```
src/
  App.jsx                     React Router — five routes (see below)
  main.jsx                    Entry point
  index.css                   Global styles
  sentry-console.jsx          Analyst console — queue, detail, compose, SNYPR panel
  sentry-client.jsx           Customer portal — four views
  sentry-home.jsx             Project home — the one link that ties everything together
  sentry-insights-tiered.jsx  Phase 2 reporting preview — Standard / Full depth
  sentry-dashboard.jsx        Basic dashboard — early proof-of-concept

public/
  VDA_SecOps_Plan.pdf              The strategic deck (16 pages)
  VDA_Discovery_Questionnaire.pdf  The 13-question discovery doc, filled in by Jim + Sibe
  sentry-design-system.html        Design system (standalone reference doc)

docs/
  ARCHITECTURE.md  The technical blueprint — stack, infra, what VDA inherits
  DISCOVERY.md     Consolidated discovery brief — synthesis of calls + questionnaire
  BUS_FACTOR.md    Handoff notes — if you only read one file, read this
  SCOPE_AUDIT.md   Feature-by-feature scope reasoning
```

## Routes

The app is a single React SPA with five routes:

| Route | File | What it is |
|---|---|---|
| `/` | `sentry-console.jsx` | Analyst console — the daily driver for the SOC team |
| `/home` | `sentry-home.jsx` | Project home — audience-framed entry point, the link to send VDA |
| `/client` | `sentry-client.jsx` | Customer portal — four views, mobile-responsive |
| `/dashboard` | `sentry-dashboard.jsx` | Basic dashboard — early proof-of-concept |
| `/insights-tiered` | `sentry-insights-tiered.jsx` | Phase 2 reporting preview — Standard / Full depth toggle |

## Quick start

```
git clone https://github.com/joeyough/sentry.git
cd sentry
npm install
npm run dev
```

Dev server runs at `localhost:5173`. The current JSX files are working prototypes with mocked data — no backend wiring yet. The production stack (below) is stood up during the Phase 1 build.

## Stack

The current prototypes are React + Vite, deployed static on Netlify. The Phase 1 production stack is:

- **React** — the UI, built with Vite
- **Node.js** — the ticket API
- **AWS (ECS / Docker)** — containerized deployment VDA operates and controls
- **Cloudflare** — email routing for the inbound bridge
- **Terraform** — infrastructure as code, so the whole environment is reproducible and portable
- **Python** — the SNYPR SOAR playbook (runs inside SNYPR, POSTs to the ticket API)

Standard tooling, fully portable. VDA operates the deployment and controls its operational data from day one. A competent engineer or an LLM coding agent can extend this without hand-holding — the goal is zero key-man risk. Full detail in `docs/ARCHITECTURE.md`.

## The two surfaces

### Analyst console (`sentry-console.jsx`)

The daily driver for VDA's SOC team. Today, an analyst who decides an incident needs customer communication drafts the email in Gmail by hand, looks up contacts in Hudu, pastes addresses in, sends from the shared SOC address, moves the SNYPR incident to "awaiting customer," and pastes the sent email back into the incident comments. The console replaces that.

- **Ticket queue** — open tickets, severity-sorted, filtered by assignee and SLA status
- **Workflow states** — Jim and Sibe specified four: Open (created, unassigned), Claimed (an analyst picked it up), Awaiting Customer (waiting on a reply, with an expiration / auto-reminder), and Completed (resolved — and where possible, this pushes the state back to SNYPR and closes the incident there). A ticket created from SNYPR auto-assigns to the analyst who ran the playbook.
- **Ticket composer** — auto-pulls customer context from the incident payload. Structurally prevents sending one customer's data to another (the wrong-contact bug Jim flagged twice — it happens today because contacts are looked up by hand in Hudu).
- **SNYPR incident reference** — every ticket links back to its SNYPR incident ID. We don't duplicate security data. Each state change on the ticket adds a comment or status change on the SNYPR side.
- **SLA clock** — per-ticket, severity-driven. VDA has no formal SLAs today and no way to track them; the clock is something Sentry introduces, not something it measures against an existing standard.
- **Templated outbound emails** — analyst picks a template, customer and ticket reference auto-fill, only free-text fields are editable. Individual analyst email signatures supported.
- **Auto-reminders** — if a customer doesn't reply, the ticket surfaces a follow-up. Follow-up reminders living only in analyst memory is a named pain point.

### Customer portal (`sentry-client.jsx`)

Four views, mobile-responsive. Lower priority than the console for Phase 1 — the SOC manually creates tickets from customer requests, so the portal is a convenience, not the core. Customer actions are read-only / acknowledgment-only in Phase 1.

- **Home** — open tickets and an "open a case" action
- **My tickets** — all tickets with status and last update
- **Contract / licenses** — what they bought, usage against limits (SentinelOne, Huntress, SNYPR)
- **Documents** — shared docs per customer (SLAs, comms guidelines, onboarding paperwork)

Magic-link auth — no passwords to manage, no separate credentials for customers to lose. The design reference Kendall named is Critical Start NDR's mobile customer app — a customer should be able to see what's happening with an incident from the palm of their hand. The Phase 1 portal is the responsive-web version of that; native apps are Phase 2.

## Integration architecture

### SNYPR bridge (Securonix SOAR → ticket API)

SNYPR is Securonix's SIEM and ships with a built-in SOAR capability that supports Python code blocks inside playbooks. The integration is analyst-initiated:

```
Analyst triages incident in SNYPR
  ↓
Marks incident state: "open ticket"
  ↓
SNYPR SOAR Python playbook fires
  ↓
POSTs incident payload to the Sentry ticket API:
  incident_id · severity · asset · customer_id · summary · triggering analyst
  ↓
Ticket created, correct customer assigned, contacts pre-filled,
incident data pulled in, ticket assigned to the incident owner
```

Critical: we don't auto-create tickets from every alert. Sibe explicitly rejected that — too much noise. The analyst decides which incidents become customer-facing tickets. When a ticket is completed, the goal is to push the state back to SNYPR and close the incident there.

### Email bridge (inbound → ticket)

Inbound listener on `soc@vdalabs.com`, routed via Cloudflare. Subject parsing:

- Subject contains `[VDA-XXXX]` → thread to that ticket
- No match → create a new ticket, customer resolved by sender domain

When a customer replies, they get a confirmation that their response was logged under the ticket. No more copy-pasting replies from the SOC inbox into SNYPR by hand.

### Alert sources for the pilot

Securonix SNYPR SIEM is the confirmed primary source. The EDR products follow: Huntress (which sends automated emails), and CrowdStrike / SentinelOne (both offer API integrations).

### Auth + tenancy

- VDA analysts: Google Workspace SSO
- Customers: magic-link email auth
- Tenant isolation enforced at the database — customer A can never see customer B's tickets

## Measurement

Aligned with the deck's metrics page. Baselines come from shadowing the SOC team in weeks 1–2, not from this document.

| Metric | What it measures | Target |
|---|---|---|
| Copy-paste count | Manual data transfer events per day | Week 5: zero for the two pilot accounts |
| MTTR | Mean time to resolution, per severity | Baselined weeks 1–2, tracked after |
| SLA adherence | % of tickets meeting severity SLA | Measured from week 5 — note: VDA has no formal SLA today, so this becomes a number for the first time |
| Wrong-client incidents | Times one customer's data goes to another | Historical: multiple per quarter. Target: zero |
| Analyst adoption | % of SOC using the tool for customer comms | 70% by week 8, or we stop and diagnose |

If the pilot accounts' copy-paste count isn't zero by week 5, the system isn't working. That's the primary kill switch.

## Delivery model

- **Weeks 1–2 — Discover.** Questionnaire answers in hand. Slack channel live. Walk one live incident end-to-end with Sibe in SNYPR.
- **Weeks 3–5 — MVP Ticketing.** Ticket core, SNYPR bridge, email bridge, wrong-client prevention, SLA clock.
- **Weeks 6–8 — Pilot.** Two pilot customers. Sibe plus one other analyst live daily. Daily Slack feedback. No new features — fix what breaks.
- **Weeks 9–14 — Phase 2 begins.** Phase 2 scoped and priced. Templated monthly reports begin. Ticketing rolls out to remaining customers in batches.
- **Weeks 15–20 — Adopt.** Named operational owner inside VDA (adoption ownership sits with Sibe and his team). Weekly metric review. VDA's own engineers can extend the system.

Halo's failure mode was the absence of an adoption plan. This has one: Sibe is in the tool from day one, Slack is the feedback loop, weekly metric reviews are non-negotiable.

## Deployment

The current prototypes auto-deploy to Netlify on push to `main`:

- `sentry-vda.netlify.app/` — analyst console
- `sentry-vda.netlify.app/home` — project home
- `sentry-vda.netlify.app/client` — customer portal
- `sentry-vda.netlify.app/insights-tiered` — Phase 2 reporting preview

The Phase 1 production app deploys to AWS ECS via Terraform — see `docs/ARCHITECTURE.md`.

## Why this time is different from Halo

| Halo | This build |
|---|---|
| Sold white-glove, delivered homework | 3Nails does the work; Jim's hours are for decisions only |
| Implementation team vanished after the sale | A partner that stays — weekly Slack cadence, named owner at handoff |
| Scope grew into CRM + PM + quoting | Scope is ticketing only for Phase 1. Phase 2 features live in a separate doc. |
| No product owner inside VDA | Jim is the product owner. Sibe is the daily user and owns adoption. Both are in Slack. |
| Vendor-hosted, vendor-controlled | React + Node + AWS, containerized and deployed with Terraform. VDA operates the deployment. No vendor lock-in. |
| Built against a pitch deck | Built against the SOC's actual daily workflow — Gmail, Hudu, SNYPR, Slack |
| 5 months of configuration | 8-week MVP, first customer notification in week 5, or we stop and diagnose |

## Open questions and decision points

Things that are genuinely undecided, or where the sources don't fully agree. Tracked here honestly rather than papered over — these get resolved with Jim and Sibe, not assumed.

- **Workflow state labels.** Jim and Sibe specified Open / Claimed / Awaiting Customer / Completed. The current prototype (`sentry-console.jsx`) uses slightly different labels (open / in-progress / awaiting-customer / resolved). The build aligns to the four states Jim and Sibe named — the prototype labels are not the commitment.
- **Customer portal priority.** The portal is in Phase 1 scope, but Sibe flagged it as lower importance than the analyst console — the SOC manually creates tickets from customer requests today, so the portal is a convenience, not the core. It stays in Phase 1, built after the console proves out.
- **Account Manager access.** Jim raised giving Account Managers read access to their customers' data "at some point." Noted as a Phase 2 bonus, explicitly not MVP.
- **AI-assisted investigation.** Jim floated this as a Q9 "nice to have" — something out-of-band that speeds up an analyst's investigation. Heard and noted. Not in Phase 1 scope; revisited only if Phase 1 proves out.
- **SLA tracking.** VDA has no formal, tracked SLA today — they prioritize by event severity, and a critical incident gets a phone call. The SLA clock is something Sentry introduces. The "1-hour critical" figure is an expectation, not a measured commitment, until the tool makes it one.
- **Is this bespoke or a product?** Vince raised whether this could be marketed to other MSPs; Jim's answer was that it's bespoke for VDA. Built for VDA first. Any broader question is deferred and is not a Phase 1 consideration.

## License

Proprietary. VDA Labs internal use only.
