# BUS_FACTOR.md

If the original builder gets hit by a bus, this is the file you read first. It exists so VDA can pick up the repo without the builder, at any point, without losing momentum.

## Architecture (one paragraph)

A React + Vite single-page app (two routes: `/` analyst UI, `/portal` customer-facing) backed by Supabase for ticket storage, auth, and row-level tenant isolation. Integration with VDA's Securonix Sniper SIEM happens via a Python SOAR playbook that POSTs incident payloads to the Sentry ticket API on analyst-initiated state change. Inbound customer email to `soc@vdalabs.com` is routed through a webhook listener that creates or threads tickets. The goal of every decision in this repo is: **make the daily copy-paste that runs Sibe's SOC workflow go away, and make it never come back.**

## Dependencies (complete list)

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18+ | UI framework |
| react-dom | 18+ | DOM rendering |
| react-router-dom | 6+ | Routing between analyst UI and customer portal |
| @supabase/supabase-js | 2+ | Database, auth, realtime |
| lucide-react | 0.383.0 | Icons |
| tailwindcss | 3.4+ | Utility CSS (used sparingly; components prefer inline styles for portability) |
| vite | 5+ | Build tool |

Seven dependencies. All mainstream. No exotic libraries. A junior React dev can extend this without hand-holding.

## Key decisions and why

| Decision | Why | Where |
|----------|-----|-------|
| Single-file React components | Eliminates build complexity, easier handoff | `src/*.jsx` |
| Inline styles over Tailwind arbitrary values | Works in any build environment; no JIT compile edge cases | all JSX files |
| Supabase row-level security for tenancy | Customer A structurally cannot see customer B's tickets. Enforced at the database, not the UI. | Supabase RLS policies |
| Analyst-initiated Sniper ingress (not auto) | Sibe explicitly rejected "every alert becomes a ticket." Too much noise. | Sniper SOAR Python playbook |
| Severity-driven SLA clock | Matches VDA's 1-hour critical SLA commitment to customers | `sla_rules` table + clock service |
| Wrong-client prevention via incident-bound context | Outbound email composer cannot mix customer data. The compose UI pulls customer from the ticket, not from a free-text field. | Analyst UI compose flow |
| Magic-link auth for customers | No password management burden on VDA, no password leaks in customer support tickets | Supabase magic-link auth |
| Google Workspace SSO for analysts | Kendall controls Workspace admin; aligning auth with existing identity provider keeps her in the loop | Supabase SSO config |
| Email ingress via webhook, not IMAP polling | Real-time threading, no missed messages, no state drift | Email webhook → edge function |
| VDA owns the repo, not 3Nails | Survives 3Nails disappearing. No vendor lock-in — the anti-Halo. | GitHub: `joeyough/sentry` (to transfer to VDA org) |

## Data model (Supabase schema, target state week 5)

```
customers         → id, name, domain, contract_tier, created_at
analysts          → id, email (google sso), name, role
tickets           → id, customer_id, assigned_analyst_id, status,
                    severity, source ('sniper' | 'email' | 'manual'),
                    sniper_incident_id, subject, created_at, updated_at,
                    sla_due_at, last_customer_response_at
ticket_notes      → id, ticket_id, author_id, author_type ('analyst'|'customer'),
                    body, internal (bool), created_at
email_events      → id, ticket_id, direction ('in'|'out'), from_addr, to_addr,
                    subject, body, headers, received_at
sla_rules         → id, severity, response_hours, reminder_hours
email_templates   → id, name, subject_tmpl, body_tmpl, variables (jsonb)
```

All timestamps UTC. All IDs UUIDs. Row-level security enforces `customer_id` filtering on every portal query.

## Integration: Sniper bridge

The Securonix Sniper (SNYPR) SIEM ships with a built-in SOAR capability and Python code blocks inside playbooks. The bridge is a single Python playbook attached to a state-change rule:

```python
# Sniper SOAR playbook — analyst-initiated ticket creation
# Trigger: incident state transitions to "open ticket"

def on_state_change(incident):
    payload = {
        "sniper_incident_id": incident.id,
        "severity": incident.severity,
        "asset": incident.asset,
        "customer_id": incident.customer_mapping,
        "summary": incident.summary,
        "triggering_analyst": incident.current_assignee,
    }
    post("https://sentry-vda.netlify.app/api/ingest/sniper", payload,
         headers={"X-Sniper-Secret": SECRET})
```

The endpoint lives as a Netlify edge function (or Supabase edge function — TBD based on where Sibe's team wants the secret to live). It validates the secret, looks up the `customer_id`, and inserts a `tickets` row. The analyst sees the new ticket in the Sentry UI seconds later.

**Why analyst-initiated, not automatic**: every Sniper alert becoming a ticket = noise Sibe's team already rejected. The analyst triages in Sniper first; only incidents that need customer communication become tickets.

## Integration: Email bridge

Inbound listener on `soc@vdalabs.com` (mail provider TBD — likely Google Workspace mail routing to a webhook). Subject parsing:

- `[VDA-1234]` → thread to ticket #1234
- No match → new ticket, customer resolved by sender domain via `customers.domain` lookup
- Ambiguous sender → ticket created in "unassigned" state for analyst routing

Every email (inbound and outbound) is logged in `email_events`. The ticket view shows the full email thread alongside internal analyst notes.

## What needs to happen (weeks 1–5)

1. **Supabase project stood up** — schema above, RLS policies, magic-link email auth.
2. **Google Workspace SSO configured** — requires Kendall to grant Workspace admin access.
3. **Sniper SOAR playbook written and tested** — Sibe's team has an existing dev/staging Sniper instance.
4. **Email routing configured** — `soc@vdalabs.com` webhook target.
5. **Analyst UI build** — queue, compose (with wrong-client prevention), notes, SLA display.
6. **Template library seeded** — outbound email templates pre-loaded from what VDA sends today.
7. **Pilot with 2 customers** — Sibe + one other analyst live on those accounts only.

## What is explicitly NOT in this build

- Customer portal (Phase 2, weeks 9–14)
- Monthly customer reports (Phase 2)
- License usage tracking, CMDB, knowledge base, recurring tasks (Phase 2)
- Anything related to quotes, invoices, agreements, CRM, project management (never — Halo failure modes)

## Secrets and configuration

| Secret | Where stored | Notes |
|--------|--------------|-------|
| `VITE_SUPABASE_URL` | Netlify env, client-safe | Public URL |
| `VITE_SUPABASE_ANON_KEY` | Netlify env, client-safe | Anon key; RLS enforces safety |
| `SUPABASE_SERVICE_ROLE` | Netlify edge function env only | Never exposed to client |
| `SNIPER_WEBHOOK_SECRET` | Netlify edge function env + Sniper playbook config | Shared secret for POST validation |
| `EMAIL_WEBHOOK_SECRET` | Netlify edge function env + email provider config | Shared secret for inbound email |

No OAuth tokens stored. No customer passwords stored (magic link only).

## File structure

```
sentry/
├── README.md
├── package.json
├── vite.config.js
├── tailwind.config.js
├── netlify.toml
├── index.html
├── src/
│   ├── index.css
│   ├── main.jsx
│   ├── App.jsx                  ← Router: / → analyst UI, /portal → customer portal
│   └── components/              ← to be populated in week 3 build
├── public/
│   └── sentry-design-system-v3.html   ← standalone design system reference
├── api/                         ← Netlify edge functions
│   ├── ingest-sniper.js
│   ├── ingest-email.js
│   └── sla-tick.js
├── supabase/
│   ├── migrations/              ← SQL schema migrations
│   └── seed.sql                 ← initial SLA rules, email templates
└── docs/
    ├── DISCOVERY.md             ← scoping doc
    └── BUS_FACTOR.md            ← you are here
```

## Deck alignment

The strategic deck is `VDA_SecOps_Plan_v4.pptx`, 16 slides. It operates at the decision level (Halo replacement framing, 3-options analysis, 20-week roadmap, measurement). This file operates at the implementation level. The deck and this file are complementary — a new team member should read the deck first to understand why, then read this file to understand how.

## Who to call

| Role | Who | Context |
|------|-----|---------|
| VDA product owner | **Jim Blankenship** | Scope decisions, requirements |
| VDA primary user | **Sibe Klomp** (SOC manager) | Daily workflow, feedback loop |
| VDA sign-off | **Kendall** | Leadership buy-in, Workspace admin |
| 3Nails partner | **Vincent** | Technical oversight |
| Original builder | Joey (3Nails) | Product + build during weeks 1–20 |
| VDA engineering lead | TBD | To be named during weeks 15–20 adopt phase |

## The one-sentence handoff test

A new engineer joining the project should be able to answer this in 30 seconds after reading this file:

> *"Build the ticketing layer that replaces Sibe's manual email ↔ Sniper copy-paste, with wrong-client prevention on the compose flow, in 5 weeks — and don't let scope grow into what Halo tried to be."*

If they can't answer that, this file isn't doing its job. Update it until they can.
