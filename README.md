# VDA Ticketing & Client Portal

A focused ticketing system and customer portal for VDA Labs' SOC team. Built to replace the manual email ↔ SIM copy-paste that runs Sibe's daily workflow today.

Built by 3Nails Infosec. VDA owns the repo, the deployment, the data, and the extension path from day one.

## What this is (and what it isn't)

**This is:**
- A ticketing system for VDA's ~12 SOC analysts and ~150 customers
- A SNYPR bridge that turns analyst-initiated Securonix incidents into tickets
- An email bridge that turns customer emails to `soc@vdalabs.com` into tickets
- A simple customer-facing portal (open a case, view tickets, contract summary, documents)

**This is not:**
- A SIEM or XDR platform. VDA has SNYPR. We don't compete with it.
- A CRM, quoting tool, or project management system. Halo tried to be those. It failed.
- A system of record for security telemetry. Sensitive data stays in SNYPR — we reference incident IDs.

## Why this exists

Halo was a 5-month POC that consumed 100-200 hours of Jim's configuration time and produced nothing usable. The reason: it was sold as white-glove, delivered as homework, and expanded into everything (CRM, project management, invoicing) before it could deliver the one thing Jim actually wanted — ticketing.

Kendall (VDA leadership) signed off on trying this again, with stricter scope discipline. This repo is the second attempt.

Full postmortem and phased remediation plan in the `VDA_SecOps_Plan_v4` deck.

## What's in this repo

```
src/
  App.jsx                  # React Router — / (analyst) and /portal (customer)
  main.jsx                 # Entry point
  sentry-client.jsx        # Customer portal — 4 views (case, tickets, contract, docs)
  sentry-v2.jsx            # Analyst ticketing UI (v2 — current)

public/
  sentry-design-system-v3.html   # Design system (standalone reference doc)

docs/
  DISCOVERY.md             # 13-question doc sent to Jim + Sibe
  BUS_FACTOR.md            # Handoff notes — if you only read one file, read this
```

## Quick start

```bash
git clone https://github.com/joeyough/sentry.git
cd sentry
npm install
npm run dev
```

Dev server at `localhost:5173`:
- `/` — analyst ticketing UI
- `/portal` — customer portal

## Stack

- **React** + **Vite**
- **Tailwind CSS** (used sparingly; components use inline styles for portability)
- **Lucide React** (icons)
- **React Router**
- **Supabase** — ticket storage, auth, row-level tenant isolation (added week 3)
- **Python** — SNYPR SOAR playbook (separate subdirectory, added week 4)

Deliberately vanilla. A competent junior dev or an LLM coding agent can extend this without hand-holding. The goal is zero key-man risk.

## The two surfaces

### Analyst UI (`sentry-v2.jsx`)

The daily driver for VDA's SOC team. Replaces manual copy-paste between SNYPR and email.

- **Ticket queue** — all open tickets, grouped by customer, filtered by assignee and SLA status
- **Ticket composer** — auto-pulls customer context from the incident payload. Structurally prevents sending another customer's data (the wrong-client bug Jim flagged twice).
- **SNYPR incident reference** — every ticket links back to its SNYPR incident ID. We don't duplicate security data.
- **SLA clock** — per-ticket, severity-driven. Surfaces breaches to the queue automatically.
- **Templated outbound emails** — analyst picks template, customer auto-fills, only free-text fields are editable.
- **Auto-reminders** — if the customer doesn't reply in X hours, the ticket generates a follow-up automatically (X varies by severity, set during discovery).

### Customer Portal (`sentry-client.jsx`)

The four views Jim specified. Nothing more in v1.

1. **Home** — dashboard with open tickets and an "Open a case" CTA
2. **My Tickets** — all tickets (open, ongoing, closed) with status and last update
3. **Contract / Licenses** — summary of what they bought, usage against limits (S1, Huntress, SNYPR)
4. **Documents** — shared docs per customer (SLAs, comms guidelines, onboarding paperwork)

Mobile-first. Magic-link auth — no passwords to manage, no separate credentials for customers to lose.

**Explicitly out of v1:** quotations, invoices, agreements, schedule-a-meeting, knowledge base. Those are Phase 2. Halo tried to ship all of them at once and got rolled back.

## Integration architecture

### SNYPR bridge (Securonix SOAR → Ticket API)

SNYPR (the Securonix SIEM, `snypr`) ships with a built-in SOAR capability and Python code blocks in its playbooks. The integration is analyst-initiated:

```
Analyst triages incident in SNYPR
  ↓
Marks incident state: "open ticket"
  ↓
SNYPR playbook triggering rule fires
  ↓
Python playbook POSTs to our ticket API:
  - incident_id
  - severity
  - asset
  - customer_id
  - summary
  ↓
Ticket created, analyst notified in our UI
```

Critical: we don't auto-create tickets from every alert. Sibe explicitly doesn't want that — too much noise. The analyst decides which incidents become customer-facing tickets.

### Email bridge (inbound → ticket)

Inbound listener on `soc@vdalabs.com`. Subject parsing:
- If subject contains `[VDA-XXXX]`, append to that ticket
- Otherwise, create new ticket and assign based on customer domain mapping

Every ticket reply from a customer threads automatically. No more copy-paste from the SOC inbox into SNYPR.

### Auth + tenancy

- VDA analysts: Google Workspace SSO
- Customers: magic-link email auth
- Row-level security in Supabase enforces tenant isolation — customer A can never see customer B's tickets

## Measurement

Aligned with `VDA_SecOps_Plan_v4` slide 10 and 16. Baselines come from discovery, not promises.

| Metric | What it measures | How |
|--------|------------------|-----|
| **Copy-paste count** | Manual data transfer events per day | Target week 5: zero for pilot accounts |
| **MTTR** | Mean time to resolution, per severity | Baselined weeks 1–2 |
| **SLA adherence** | % tickets meeting severity SLA | Tracked automatically from week 5 |
| **Wrong-client incidents** | Times customer A's data goes to customer B | Historical: multiple/quarter. Target: zero |
| **Analyst adoption** | % of SOC team using tool for customer comms | Target 70% by week 8 or we stop and diagnose |

If Sibe's copy-paste count isn't zero by week 5 on the two pilot accounts, the system isn't working. That's the primary kill-switch.

## Delivery model

- **Weeks 1–2:** Discovery. 13-question doc back from Jim + Sibe. Slack channel for daily async feedback. Walk one live incident end-to-end with Sibe.
- **Weeks 3–5:** Build the MVP. Ticket core, SNYPR bridge, email bridge, wrong-client prevention, SLA clock.
- **Weeks 6–8:** Two pilot customers. Daily feedback. No new features — fix what breaks.
- **Weeks 9–14:** Customer portal ships. Templated monthly customer reports. Roll to remaining 148 customers in waves.
- **Weeks 15–20:** Named owner inside VDA. Weekly metric review. VDA engineers begin extending.

Halo's failure mode was the absence of an adoption plan. This has one: Sibe is in the tool from day one, Slack is the feedback loop, weekly metric reviews are non-negotiable.

## Deployment

Connected to Netlify via `netlify.toml`. Auto-deploys on push to `main`.

- `sentry-vda.netlify.app/` — analyst UI
- `sentry-vda.netlify.app/portal` — customer portal
- `sentry-vda.netlify.app/sentry-design-system-v3.html` — design system reference

## Why this time will be different from Halo

| Halo | This build |
|------|------------|
| Sold white-glove, delivered homework | Joey + Vincent do the work; Jim's hours are for decisions only |
| Scope grew into CRM + PM + quoting | Scope is ticketing only. Phase 2 features live in a separate doc. |
| No product owner inside VDA | Jim is the product owner. Sibe is the daily user. Both are in Slack. |
| Vendor-hosted, vendor-controlled | VDA owns the repo, the database, the deployment. Zero lock-in. |
| Built against a pitch deck | Built against Sibe's actual daily workflow |
| 5 months of configuration | 5 weeks to working MVP, or we stop and diagnose |

## License

Proprietary. VDA Labs internal use only.
