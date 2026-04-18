# Sentry — Discovery One-Pager
**VDA Labs × 3Nails Infosec · Scoping Document · v4**

---

## The problem in one sentence

VDA's SOC analysts hand-copy every customer email into Securonix SNYPR, and every SNYPR alert into email — there's no ticket of record, SLAs are tracked by memory, and wrong-customer data leakage is a recurring incident.

## The current state

- Halo was abandoned after a 5-month POC consumed 100–200 hours of Jim Blankenship's time and produced nothing usable.
- Analysts (led by Sibe Klomp, SOC manager) manually copy customer responses from `soc@vdalabs.com` into SNYPR incidents, and manually compose outbound notifications by copying incident detail back into fresh emails.
- There is no ticket of record. Follow-ups are remembered, not triggered.
- Mixing one customer's data into another customer's email has happened multiple times. The UI offers no structural prevention.
- Kendall (VDA leadership) is skeptical this can be fixed without repeating the Halo failure. That skepticism is correct — and the plan is designed around it.
- ~150 customers. ~12 SOC analysts. 1-hour SLA on critical incidents.

## What Sentry is

A ticketing system and customer portal purpose-built for VDA's SOC workflow. Not a SIEM. Not an XDR. Not a Halo replacement in scope — a narrower, disciplined slice of what Halo was asked to do.

1. **Ticket core** — open, assign, note (internal + external), status, close. Severity field drives SLA clock.
2. **SNYPR bridge (analyst-initiated)** — an analyst triaging in SNYPR marks an incident as "open ticket," which fires a SNYPR SOAR Python playbook that POSTs the incident payload to the Sentry ticket API. Not every alert becomes a ticket — the analyst decides.
3. **Email bridge** — inbound listener on `soc@vdalabs.com`. Subject parsing threads replies to existing tickets; unmatched emails become new tickets.
4. **Wrong-client prevention** — outbound email composer pulls customer context from the incident payload, not free-text. Structurally prevents one customer's data from being sent to another.
5. **SLA clock** — per-ticket, severity-driven. Surfaces breaches to the analyst queue. Triggers auto-reminders when a customer doesn't respond in X hours.
6. **Customer portal** — four views only (per Jim): open a case / view tickets / contract summary / documents. Magic-link auth, row-level tenant isolation.
7. **Templated outbound emails** — analyst picks template; customer name, ticket ID, severity auto-fill; only free-text fields are editable.

## What Sentry is not

- **Not a SIEM.** VDA has SNYPR. We integrate, we don't compete.
- **Not a CRM, quote tool, invoice system, or project manager.** Halo tried to be all of those. Rolled back.
- **Not a system of record for security telemetry.** VDA's promise to customers is "we don't store your data." SNYPR holds the incident detail. The ticket holds the reference and the communication log.
- **Not Salesforce, Monday, or Slack.** Those stay. We don't replace them.

## Who's who

| Role | Name | What they care about |
|------|------|----------------------|
| VDA product owner | **Jim Blankenship** | Scope discipline. Won't sign off on another Halo. |
| Primary user | **Sibe Klomp** (SOC manager) | Making the daily copy-paste go away. |
| VDA leadership / sign-off | **Kendall** | Evidence this won't fail the same way. |
| 3Nails partner | **Vincent** | Technical oversight, delivery accountability. |
| Builder | Joey (3Nails) | Product, PM, build. |

## Halo postmortem (the thing to not repeat)

1. **Sold white-glove, delivered homework.** 40 hours of professional services promised. Jim asked for 60. Got 8 actual support hours over 5 months. Everything else was Jim configuring APIs alone.
2. **Scope drifted into everything.** Started as ticketing. Grew into CRM + PM + quotes + invoicing. Sales hated it. Project team hated it. All rolled back.
3. **No product owner inside the vendor.** When sales pushed back, there was nobody on Halo's side to advocate for the fix. Jim absorbed the conflict.
4. **Built against a pitch deck, not a workflow.** The software dictated the process instead of fitting it. Analysts reverted to email within weeks.

## What's different this time

- **Sibe is the user, not Jim.** Sibe is in the tool from day one. Every screen is shaped against his daily workflow. Jim's hours are for decisions, not configuration.
- **Scope is ticketing only for 5 weeks.** Portal and reports are Phase 2 (weeks 9–14). Anything else moves to a separate Phase 3 doc.
- **VDA operates the deployment and controls its operational data.** React + Vite + Supabase. Junior-readable. No vendor lock-in. The tool survives if 3Nails disappears. Commercial structure is flexible and shaped together, not pre-committed in the deck.
- **Async-first delivery.** Slack channel with Joey, Vincent, Jim, Sibe. Weekly metric review. No six-month silence before a demo.
- **Every phase has a kill switch.** If Sibe's copy-paste count isn't zero by week 5 on the two pilot accounts, we stop and diagnose before adding scope.

## Integration architecture

### SNYPR bridge (Securonix SOAR → ticket API)

**What SNYPR is.** SNYPR is Securonix's security analytics platform — a next-generation SIEM built on Hadoop that combines log management, UEBA (user and entity behavior analytics), case management, and fraud detection. Securonix has been named a Gartner Magic Quadrant Leader for SIEM six years running. VDA uses SNYPR as the primary detection layer across all customer environments. Sibe's SOC team lives in SNYPR eight hours a day — it's where incidents are triaged, correlated, and classified before any customer communication happens.

SNYPR ships with a built-in SOAR capability and Python code blocks inside playbooks. That's the integration hook.

The flow:

```
Analyst triages incident in SNYPR
  ↓
Sets incident state: "open ticket"
  ↓
SNYPR playbook triggering rule fires
  ↓
Python playbook POSTs to Sentry ticket API:
  { incident_id, severity, asset, customer_id, summary }
  ↓
Ticket created. Analyst notified in Sentry UI.
```

Critical design decision: **analyst-initiated**. Sibe explicitly rejected the "every alert becomes a ticket" model. Too much noise. The analyst decides which incidents become customer-facing tickets.

### Email bridge (inbound → ticket)

- Inbound listener on `soc@vdalabs.com`
- Subject pattern `[VDA-XXXX]` threads to existing ticket
- Unmatched emails create new ticket; customer assigned by sender domain
- Every ticket reply from a customer threads automatically — no manual re-entry

### Auth + tenancy

- VDA analysts → Google Workspace SSO (Kendall gates Workspace admin, so this is coordinated up front)
- Customers → magic-link email auth, no password management
- Supabase row-level security enforces tenant isolation

## The 5-week build scope

Taken from Jim's original Halo requirements list (the "feature floor" — Halo could do all of these, so we must too):

- Ticket core with customizable status workflow
- Tenancy: one customer per ticket, enforced
- SNYPR SOAR bridge (analyst-initiated)
- Inbound email bridge on `soc@vdalabs.com`
- Wrong-client prevention on outbound compose
- SLA clock (severity-driven)
- Auto-reminders when customers don't reply
- Template-based outbound emails
- Internal + external notes on tickets
- Assign tickets to individual analysts

**Explicitly Phase 2 (weeks 9–14), not the 5-week build:**

- Customer portal (open a case / tickets / contract / documents)
- Templated monthly customer reports
- License usage tracking (SentinelOne, Huntress, SNYPR)
- Per-customer knowledge base
- Recurring tasks (weekly platform checks)
- CMDB for VDA internal devices
- API key expiration tracking
- Onboarding project templates with child tickets

**Explicitly out of scope, permanently:**

- Quotes, invoices, agreements
- CRM (Salesforce stays)
- Schedule-a-meeting integration
- Full XDR / SIEM functionality (SNYPR stays)
- Project management across non-ticket workstreams (Monday stays)

## The 20-week plan

| Weeks | Phase | Deliverable |
|-------|-------|-------------|
| 1–2 | **Discover** | 13-question discovery doc back from Jim + Sibe. Slack channel live. Walk one live incident end-to-end in SNYPR with Sibe. |
| 3–5 | **MVP Ticketing** | Ticket core + SNYPR bridge + email bridge + wrong-client prevention + SLA clock. |
| 6–8 | **Pilot** | Two pilot customers. Sibe + one other analyst live in the tool daily. Daily Slack feedback. No new features — fix what breaks. |
| 9–14 | **Portal + Reports** | Customer portal (four views). Templated monthly reports. Roll to remaining 148 customers in waves. |
| 15–20 | **Adopt** | Named operational owner inside VDA. Weekly metric review. VDA engineers can extend the system as licensing allows. |

## Measurement (deck slide 10 + 16)

Baselines come from sitting with Sibe in weeks 1–2, not from this document.

| Metric | What | Kill switch |
|--------|------|-------------|
| **Copy-paste count** | Manual data transfer events Sibe performs per day | Week 5: zero on pilot accounts or we stop and diagnose |
| **MTTR** | Mean time to resolution per severity | Baselined weeks 1–2, tracked weekly after |
| **SLA adherence %** | Percentage of tickets meeting severity SLA | Measured from week 5 onward |
| **Wrong-client incidents** | Times customer A's data goes to customer B | Target: zero |
| **Analyst adoption** | % of SOC using the tool for customer comms | 70% by week 8 or we stop |

## Next steps

1. **Questionnaire back from Jim + Sibe.** 13 questions, one page each. Delivered to them in the Slack channel.
2. **Walk one live incident in SNYPR with Sibe.** Document every click and copy-paste. This is the workflow the MVP eliminates.
3. **Lock 5-week build scope in writing, signed by Kendall.** One page. No moving targets after.
4. **Stand up the Supabase project.** Schema for tickets, customers, analysts, notes, SLA rules.
5. **Begin week 3 build.**

---

*Prepared as a scoping artifact, not a contract. This is the starting point for the conversation — not the conclusion.*
