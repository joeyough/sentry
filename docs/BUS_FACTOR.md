# BUS_FACTOR.md

If the original builder gets hit by a bus, this is the file you read first. It exists so VDA can pick up the repo without the builder, at any point, without losing momentum.

## Architecture (one paragraph)

A React single-page app (five routes: `/` analyst console, `/home` project home, `/client` customer portal, `/dashboard` basic dashboard, `/insights-tiered` Phase 2 reporting preview) backed by a Node.js API on AWS ECS (Fargate), an AWS RDS PostgreSQL database, and two Lambda functions for the SNYPR and email bridges. The React app is built via Vite and served as static files through S3 + CloudFront. Cloudflare handles DNS, WAF, and inbound email routing for `soc@vdalabs.com`. All infrastructure is declared in Terraform. VDA operates the deployment and controls its operational data from day one. The goal of every decision in this repo is: **make the daily copy-paste that runs the SOC workflow go away, and make it never come back.** Scale: ~11 SOC analysts serving ~150 customers.

## The daily workflow this replaces

Today, when a SOC analyst decides an incident in SNYPR needs customer communication, they draft the email in Gmail by hand, look up the customer's contacts in Hudu (VDA's KB portal), paste the addresses into Gmail, send from the shared `soc@vdalabs.com` address, move the incident to "awaiting customer" in SNYPR, and paste the sent email back into the incident comments. When the customer replies, the analyst copies the reply into SNYPR too. Wrong-client data leakage happens because contacts are looked up by hand. Follow-ups are tracked by memory.

Sentry replaces this with: analyst marks the incident in SNYPR, a SOAR playbook creates a ticket with the correct customer auto-recognized and contacts pre-filled, the analyst writes the message and sends from the tool, replies thread automatically, and SLA reminders fire when the customer doesn't respond.

## Dependencies (complete list)

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18+ | UI framework |
| react-dom | 18+ | DOM rendering |
| react-router-dom | 6+ | Five-route SPA |
| lucide-react | 0.383.0 | Icons |
| tailwindcss | 3.4+ | Utility CSS (used sparingly; components prefer inline styles) |
| vite | 5+ | Build tool |

Six dependencies. All mainstream. No exotic libraries. The Node.js API adds `express`, `pg` (Postgres client), `aws-sdk`, and `nodemailer` or `@aws-sdk/client-ses` for outbound email. A competent junior dev or an LLM coding agent can extend this without hand-holding. The goal is zero key-man risk.

## Key decisions and why

| Decision | Why | Where |
|----------|-----|-------|
| Single-file React components | Eliminates build complexity, easier handoff | `src/*.jsx` |
| Inline styles over Tailwind arbitrary values | Works in any build environment; no JIT compile edge cases | All JSX files |
| AWS RDS for the database | VDA's AWS account, no third party between them and their customer data | RDS PostgreSQL, encrypted at rest |
| Row-level tenant isolation | Customer A structurally cannot see customer B's tickets, enforced at the database | Postgres RLS policies |
| Analyst-initiated SNYPR ingress (not auto) | Sibe explicitly rejected "every alert becomes a ticket" — too much noise | SNYPR SOAR Python playbook |
| Four workflow states: Open, Claimed, Awaiting Customer, Completed | What Jim and Sibe specified in discovery | Ticket status field |
| Auto-assign ticket to playbook runner | When a ticket is created from SNYPR, it assigns to the analyst who triggered it | SNYPR ingest Lambda |
| Completed ticket closes the SNYPR incident | Two-way sync, not just inbound — each state change writes back to SNYPR | Node API + SNYPR bridge |
| Wrong-client prevention via incident-bound context | Outbound email composer cannot mix customer data — pulls customer from the ticket, not free-text | Analyst console compose flow |
| SLA clock as something Sentry introduces | VDA has no formal, tracked SLA today; the clock creates the measurement | Node API SLA service |
| Magic-link auth for customers | No password management burden, no password leaks in support tickets | Auth service |
| Google Workspace SSO for analysts | Kendall controls Workspace admin; aligns auth with existing identity provider | Auth service |
| Email ingress via Cloudflare, not IMAP polling | Real-time threading, no missed messages, one less vendor | Cloudflare Email Routing → Lambda |
| Terraform for all infra | If 3Nails disappears, VDA clones the repo and runs `terraform apply` — the anti-Halo property | `infra/` directory |
| Critical Start NDR as design reference | Kendall named it — a customer should see incident status from their phone | Customer portal UX |
| VDA operates the deployment | No vendor lock-in. The tool doesn't die if we disappear. Commercial structure is flexible and shaped together. | AWS account ownership |

## Data model (target state, Phase 1)

```
customers         → id, name, domain, contract_tier, created_at
analysts          → id, email (Google SSO), name, role
tickets           → id, customer_id, assigned_analyst_id, status,
                    severity, source ('snypr' | 'email' | 'manual'),
                    snypr_incident_id, subject, created_at, updated_at,
                    sla_due_at, last_customer_response_at
ticket_notes      → id, ticket_id, author_id, author_type ('analyst'|'customer'),
                    body, internal (bool), created_at
email_events      → id, ticket_id, direction ('in'|'out'), from_addr, to_addr,
                    subject, body, headers, received_at
sla_rules         → id, severity, response_hours, reminder_hours
email_templates   → id, name, subject_tmpl, body_tmpl, variables (jsonb)
```

All timestamps UTC. All IDs UUIDs. Row-level security enforces `customer_id` filtering on every portal query. Schema lives in `docs/SCHEMA.sql` once the build starts.

## Integration: SNYPR bridge

SNYPR is Securonix's SIEM and ships with built-in SOAR capability that supports Python code blocks inside playbooks. The bridge is analyst-initiated:

```python
# SNYPR SOAR playbook — analyst-initiated ticket creation
# Trigger: incident state transitions to "open ticket"

def on_state_change(incident):
    payload = {
        "snypr_incident_id": incident.id,
        "severity": incident.severity,
        "asset": incident.asset,
        "customer_id": incident.customer_mapping,
        "summary": incident.summary,
        "triggering_analyst": incident.current_assignee,
    }
    post("https://api.sentry.vdalabs.com/ingest/snypr", payload,
         headers={"X-SNYPR-Secret": SECRET})
```

The Lambda validates the HMAC, looks up the customer, inserts a ticket row, and auto-assigns to the triggering analyst. The analyst sees the new ticket in the console seconds later, with customer contacts already pre-filled from the customer record (no more looking them up by hand in Hudu).

**Why analyst-initiated:** Sibe explicitly rejected auto-creating tickets from every alert — too many false positives. The analyst triages in SNYPR first; only incidents that need customer communication become tickets.

**Two-way sync:** each ticket state change writes a comment or status change back to the SNYPR incident. When a ticket reaches Completed, the bridge closes the incident in SNYPR.

## Integration: Email bridge

Inbound listener on `soc@vdalabs.com`, routed via Cloudflare Email Routing to a Lambda:

- Subject contains `[VDA-XXXX]` → thread to ticket #XXXX
- No match → new ticket, customer resolved by sender domain via the `customers.domain` lookup
- When a customer replies, they get a confirmation: "your response has been logged under ticket #XXXX"

Every email (inbound and outbound) is logged in `email_events`. The ticket view shows the full email thread alongside internal analyst notes.

## Integration: Alert sources for the pilot

Securonix SNYPR SIEM is the primary source. The EDR products follow: Huntress (automated emails), CrowdStrike and SentinelOne (API integrations). Phase 1 focuses on the SNYPR bridge; additional sources are Phase 2.

## Auth + tenancy

- VDA analysts → Google Workspace SSO (Kendall gates Workspace admin)
- Customers → magic-link email auth, no password management
- Postgres row-level security enforces tenant isolation — customer A can never see customer B's tickets

## What needs to happen (Phase 1, 8 weeks)

1. **AWS account and Terraform skeleton** — new AWS account for VDA, or build in an existing one and transfer. Terraform declares ECS, RDS, Lambdas, IAM, Secrets Manager.
2. **Node.js API** — ticket CRUD, customer auth gates, SLA clock, template rendering, outbound email.
3. **SNYPR SOAR playbook written and tested** — Sibe's team has a dev/staging SNYPR instance.
4. **Email routing configured** — `soc@vdalabs.com` via Cloudflare to the ingest Lambda.
5. **Analyst console build** — queue, compose (with wrong-client prevention), notes, SLA display.
6. **Customer portal** — four views (open a case, view tickets, contract, documents). Mobile-responsive. Lower priority than the console per Sibe, but in Phase 1 scope.
7. **Template library seeded** — outbound email templates pre-loaded from what VDA sends today. Individual analyst email signatures.
8. **Pilot with 2 customers** — Sibe plus one other analyst live on those accounts.

## What is explicitly NOT in this build

- Native iOS / Android apps (Phase 2)
- Monthly customer reports beyond what the ticketing data naturally produces (Phase 2)
- License usage tracking, CMDB, knowledge base, recurring tasks (Phase 2)
- Anything related to quotes, invoices, agreements, CRM, project management (never — Halo failure modes)
- AI-assisted investigation (noted as Jim's nice-to-have, not Phase 1)
- Cross-customer MSP-wide dashboards, scoring engines, learning loops (forbidden scope)

## Secrets and configuration

| Secret | Where stored | Used by |
|--------|--------------|-------|
| `SNYPR_WEBHOOK_SECRET` | AWS Secrets Manager | SNYPR ingest Lambda + SNYPR playbook |
| `EMAIL_WEBHOOK_SECRET` | AWS Secrets Manager | Email ingest Lambda + Cloudflare webhook config |
| `DATABASE_URL` | AWS Secrets Manager | Node API container + Lambdas |
| `GOOGLE_OAUTH_CLIENT_SECRET` | AWS Secrets Manager | Node API container (analyst SSO) |
| `SES_SMTP_PASSWORD` | AWS Secrets Manager | Outbound email Lambda |
| `CLOUDFLARE_API_TOKEN` | Terraform Cloud variables | Terraform apply only, not runtime |

No secrets in environment variables. No secrets in the repo. No secrets in CloudWatch logs. IAM policies enforce that each Lambda can read only its own secrets.

## File structure (target state)

```
sentry/
├── README.md
├── package.json
├── vite.config.js
├── tailwind.config.js
├── netlify.toml                        ← prototype deployment (pre-production)
├── index.html
├── src/
│   ├── index.css
│   ├── main.jsx
│   ├── App.jsx                         ← Router: 5 routes
│   ├── sentry-console.jsx              ← Analyst console (the daily driver)
│   ├── sentry-client.jsx               ← Customer portal (4 views)
│   ├── sentry-home.jsx                 ← Project home (the one link to send VDA)
│   ├── sentry-insights-tiered.jsx      ← Phase 2 reporting preview
│   └── sentry-dashboard.jsx            ← Basic dashboard (early proof-of-concept)
├── api/                                ← Lambda functions (Phase 1 build)
│   ├── ingest-snypr.js
│   ├── ingest-email.js
│   └── sla-tick.js
├── infra/                              ← Terraform
│   ├── main.tf
│   ├── variables.tf
│   ├── ecs.tf
│   ├── rds.tf
│   ├── lambda.tf
│   └── cloudflare.tf
├── public/
│   ├── VDA_SecOps_Plan.pdf             ← The strategic deck (stable filename)
│   ├── VDA_Discovery_Questionnaire.pdf ← 13-question doc, filled in by Jim + Sibe
│   └── sentry-design-system.html       ← Design system reference doc
└── docs/
    ├── ARCHITECTURE.md                  ← The technical blueprint
    ├── DISCOVERY.md                     ← Consolidated discovery brief
    ├── BUS_FACTOR.md                    ← You are here
    └── SCOPE_AUDIT.md                   ← Feature-by-feature scope reasoning
```

## Deck alignment

The strategic deck is `public/VDA_SecOps_Plan.pdf`, 16 pages, three phases. It operates at the decision level (Halo postmortem, three-phase roadmap, measurement, investment). This file operates at the implementation level. `docs/ARCHITECTURE.md` has the full system diagram and the "why" behind every infrastructure choice. A new team member should read the deck first to understand why, ARCHITECTURE.md to understand how, and this file to understand what happens if the builder isn't around.

## Who to call

| Role | Who | Context |
|------|-----|---------|
| VDA product owner | **Jim Blankenship** | Scope decisions, requirements |
| VDA primary user | **Sibe Klomp** (SOC manager, ~11 analysts) | Daily workflow, feedback loop, adoption owner |
| VDA sign-off | **Kendall Rusco** | Leadership, final technical sign-off, Workspace admin |
| 3Nails partner | **Vincent Mentz** | Technical oversight, week-1 planning partner |
| Original builder | **Joey Mentz** (3Nails) | Product + build during Phase 1 |
| VDA engineering lead | TBD | Named during weeks 15-20 adopt phase |

## The one-sentence handoff test

A new engineer joining the project should be able to answer this in 30 seconds after reading this file:

> *"Build the ticketing layer that replaces the SOC's manual Gmail-to-SNYPR copy-paste, with wrong-client prevention on the compose flow and contacts auto-filled from the customer record instead of looked up by hand in Hudu. Ship in 8 weeks, and don't let scope grow into what Halo tried to be."*

If they can't answer that, this file isn't doing its job. Update it until they can.
