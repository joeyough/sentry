# Sentry v4 — Scope Audit

**Date:** April 17, 2026
**Author:** Joey Mentz (3Nails Infosec)
**Status:** Pre-demo audit. Jim's 13 discovery questions sent, awaiting response.
**Purpose:** Record the scope-discipline reasoning before the MVP demo, so every feature in v4 has a documented justification and every feature we *didn't* build has a documented reason.

---

## Why this doc exists

The team has three voices feeding into the product:

1. **Jim Blankenship** (VDA product owner, primary stakeholder) — the scope anchor.
2. **Sibe Klomp** (VDA SOC manager, primary user) — the workflow anchor.
3. **Vincent Mentz** (3Nails partner, technical collaborator) — the craft voice.

These voices don't always agree. Vince in particular looked at an earlier version of the app (v2/v3) and sent written feedback about features that **no longer exist in v4** — because Jim and Kendall asked us to cut those exact features.

This doc records which asks won, which lost, and why — so when the stakeholder answers come back, we know what to honor, what to defend, and what to cut.

---

## The scope anchors, in Jim and Sibe's own words

From the 45-minute discovery call with Jim, Sibe, Vincent, and Joey (transcript in `/mnt/user-data/uploads/SecOps_Conversation.txt`):

### Jim's scope-discipline quotes

- *"We don't need anything super crazy. It just needs to be able to our SOC team to be able to send notifications to our customers based on severity, and then everything regarding that ticket or event is logged against that ticket and through closure, and then also maybe a mechanism for a customer to open a case directly with us."*
- *"I'm leery to bite off on too much, just based on our [Halo experience]. I want to focus on ticketing."*
- *"We just need them [the 12 SOC analysts] to be able to use this tool and communicate with our roughly 150 customers."*
- On why Halo failed: *"We tried to do too much at one time, too much change at once."* — this is the single most important quote in the transcript.

### Sibe's workflow-anchor quotes

- Primary ask: *"Primarily I wanted [ticketing] for communication, because right now we get so much email... It's so much just manual work right now."*
- Core pain: SOC team manually copy-pastes between Securonix SNYPR and customer emails. Customer replies are tracked by memory. No ticket of record.
- Integration path: SNYPR has built-in SOAR with Python playbooks. Sibe writes the trigger on the SNYPR side; we receive the webhook.

### Jim on customer reports (the one *new* thing to add)

- *"We have gotten some heartburn from our customers, especially recently, around the depth of our reports. They want to have additional — they're expecting to see more... our existing report I put together like five years ago and it's the same report. It's a very basic template."*
- This is the one stakeholder-requested *new capability* beyond ticketing. Defended in this doc.

---

## Vince's feedback — what he was actually looking at

Vince sent detailed written feedback about "the dashboard," "the alerts tab," "boost rules," "the client performance portfolio," "the lab page," "100 crit severity ratings," and "dark and light mode."

**None of those things exist in v4.** Vince was looking at v2 or v3 — the version the team built *before* the discovery call that clarified scope with Jim.

### What Vince described (features in v2/v3) vs. where they are now in v4

| Vince's reference | v2/v3 state | v4 state | Why |
|---|---|---|---|
| "The dashboard" | Rich dashboard tab | Removed | Jim: "we don't need anything super crazy" |
| "Alerts tab" | Separate alerts tab | Removed — consolidated into ticket queue | Jim named "ticketing" not "alerts" |
| "Boost rules" | Boost rules section | Removed; tests fail if the phrase returns | Kendall explicitly killed this after the discovery call |
| "Client performance portfolio" | Cards on the clients page | Removed | Not a Jim ask |
| "Lab page" | Self-extension lab tab | Removed | Jim: "leery to bite off on too much" |
| "100 crit numeric severity" | 0–100 numeric score | Replaced with low/medium/high/critical | Industry standard, matches SNYPR and how Sibe already thinks |
| "Dark and light mode" | Inconsistent | Analyst console is dark (SOC standard), customer portal is light (trust standard) | Intentional — different audiences, no toggle needed for MVP |

### Vince's legitimate craft points that *do* apply to v4

Not everything Vince said was v2/v3-specific. A few points translate:

- **"Feel interactive on hover"** — valid. v4 ticket rows have hover states on desktop and swipe affordances on mobile, but desktop could be richer. Note for Phase 2 polish.
- **"Cards should come off the page"** — valid. v4 uses subtle shadow on tiles and the Security Report cover. Craft pass OK.
- **"Shadow and modern style guides for contrast"** — valid, and we already addressed this on mobile cover readability (design system v3 mobile fix was the last session).

---

## v4 feature-by-feature scope decisions

### IN-SCOPE — earned, directly maps to a stakeholder quote

| Feature | Justification quote |
|---|---|
| Ticket queue + detail + compose (analyst console) | Jim: "send notifications based on severity, everything logged against that ticket through closure" |
| Wrong-client prevention on every outbound email | Jim: "analysts are working quickly, they'll copy a bunch of information, and then they'll send information to the wrong client" |
| Email bridge (inbound `soc@vdalabs.com` → ticket) | Sibe: primary pain point is email-to-SNYPR manual copy-paste |
| SNYPR SOAR bridge (Python playbook → ticket API) | Sibe: "we've got built-in SOAR capabilities, you can run like Python code" |
| Customer portal — Open case | Jim: "maybe a mechanism for a customer to open a case directly with us" |
| Customer portal — My tickets | Jim explicit in the portal walkthrough |
| Customer portal — Contract | Jim explicit in the portal walkthrough (bought 200 Sentinel One, using 150) |
| Customer portal — Documents | Jim explicit in the portal walkthrough ("SLAs, communication mechanisms, severity docs") |
| Severity sort (CRIT first) in queue | How Sibe already mentally sorts — documented in DISCOVERY.md, not a "ranking engine" |
| BUS_FACTOR.md + DISCOVERY.md | Jim: "we don't want to be stuck with a tool that a year from now is not going to work" — these docs are the handoff guardrail |
| Mobile responsiveness | Sibe and any SOC analyst using phone during off-hours |

### DEFENDED — not an explicit ask, but we chose to build it and can justify

| Feature | Why it's defensible |
|---|---|
| **Security Report (Phase 2 tile)** | Directly solves Jim's "customers have heartburn about reports" quote. Customers want more than his 5-year-old template. This is the one *new* capability in v4 beyond ticketing, and it has a clean stakeholder quote behind it. |
| **Swipe UX on mobile (analyst + portal)** | Modern ergonomics for a 12-analyst team that will sometimes triage on phones. Doesn't cost anything on desktop. Joey pushed for this explicitly. |
| **v4 design system doc** | Kendall is a software developer; he'll want to see design tokens and decisions documented. |
| **Analyst dashboard (Phase 2, not MVP)** | Vince raised a dashboard ask. The honest version of it inside v4 scope is an *operational* dashboard for Sibe's team — queue health, SLA breach trajectory, tickets per analyst, unassigned backlog. It supports triage, which passes the "does it help Sibe handle 20 tickets before lunch?" test. Belongs in Phase 2, not MVP, because (a) Jim said "focus on ticketing" for the 5-week build, and (b) a queue dashboard needs real ticket data to be useful — you can't design queue-health indicators against mock data and trust them. Scoped strictly to analyst operational use, NOT the cross-customer MSP-wide portfolio view Vince originally described (that was v2 drift and stays Phase 3+). |

### AT-RISK — not asked for by Jim, should probably trim after discovery answers

| Feature | Risk | What Jim might say |
|---|---|---|
| **Dashboards** (Phase 2 tile) | Not in Jim's explicit four. Feels like Vince's "I love the dashboard" bleeding in. | If Jim ignores it in Q7/Q8, cut it. |
| **Knowledge base** (Phase 2 tile) | Not in Jim's explicit four. We invented this. | Likely cuttable — Jim didn't mention a KB need. |
| **Services** (Phase 2 tile) | Overlaps with Contract tile. Redundant. | Almost certainly cuttable — merge into Contract. |
| **L3 "Full SNYPR flow" demo panel** | Implies we're building a SNYPR integration surface. We're not — Sibe writes the playbook on his side. | Relabel as "aspirational preview" OR cut after Jim's answer to Q5. |

### OUT-OF-SCOPE — considered, explicitly declined

| Ask | Source | Why declined |
|---|---|---|
| Lab page / rule-based workflow builder with webhooks + SMS | Vince's written feedback | This is Zapier + PagerDuty + ServiceNow Flow Designer. Jim: "leery to bite off on too much." |
| Dark/light mode toggle | Vince's written feedback | Theming infrastructure is weeks of work for zero stakeholder pull. Analyst console dark + customer portal light is a deliberate design choice. |
| Alerts tab / boost rules / numeric severity scoring | Vince's written feedback (describing v2/v3) | Kendall explicitly killed these after the discovery call. Tests fail if vocabulary returns. |
| CRM features, quotes, agreements, meeting scheduling | Halo did this | Jim: "we tried to do too much at one time... we're back with Salesforce, we're back with Monday.com" |
| Learning loops / analyst feedback-retrain / scoring engine | v2/v3 drift | Explicit guardrail in `test_v4_consistency.js` — build fails if these phrases appear |
| Sales team portal, invoice management, quotations | Halo did this | Jim walked away from this in month 3 of the Halo POC |

---

## What to do when Jim's 13 answers land

The 13 discovery questions were sent after the call. They cover:

- Which SNYPR incident states should trigger ticket creation
- Which customer contact gets notified at which severity
- SLA commitments by severity
- Document repository contents (what goes in the Documents tile?)
- Customer portal login model (SSO? magic link?)
- Expected ticket volume per month (sizes the system)
- Analyst rotation / on-call coverage expectations
- What to show on the customer's "my tickets" view (open only? everything?)
- How customers should reply to updates (portal? email? both?)
- What triggers a status change to "resolved"
- Retention expectations on ticket data
- Branding / logo / copy tone preferences
- Pilot customer for the first demo (which of the 150 customers?)

**When the answers come back, map each one against this doc:**

1. If Jim's answer **confirms** an IN-SCOPE or DEFENDED feature → ship as-is, note in changelog
2. If Jim's answer **reveals** we're missing something → add it to IN-SCOPE and scope the build
3. If Jim's answer **ignores** an AT-RISK feature (Dashboards, KB, Services) → trim that feature
4. If Jim's answer **asks for** something on the OUT-OF-SCOPE list → reopen the discussion with Kendall, don't silently expand

**Do not** trim AT-RISK features tonight based on my audit alone — the honest answer to "cut or keep" will come from what Jim prioritizes in his answers, not from my guess.

---

## The Kendall test

If Kendall (software developer, signed off on killing Halo-scope-creep) reads the v4 repo tomorrow, can he defend every file?

- `README.md` → yes, cites Jim's "just ticketing" quote
- `DISCOVERY.md` → yes, maps to transcript
- `BUS_FACTOR.md` → yes, addresses Jim's "don't want to be stuck with a tool in a year" concern
- `sentry-analyst.jsx` → queue + detail + compose only. Defensible.
- `sentry-portal.jsx` → 4 Jim tiles + Security Report defensible; Dashboards/KB/Services flagged AT-RISK in this doc
- `sentry-design-system-v3.html` → design tokens + rationale. Defensible.
- `SCOPE_AUDIT.md` → this doc. Proves we thought about it.

If any file fails that test, fix it before the demo — not after.

---

## One-line summary

**v4 is ticketing plus one earned capability (Security Report), with three Phase 2 tiles flagged for trim pending Jim's answers. Vince's feedback describes a version of the product the team agreed to kill. Honor the stakeholder hierarchy: Jim > Sibe > Vince > Joey's instincts > Claude's aesthetic preferences.**
