# Sentry v4 — Scope Audit

**Date:** April 17, 2026
**Author:** Joey Mentz (3Nails Infosec)
**Status:** Discovery complete. Jim and Sibe's 13-question answers received and reconciled below.
**Purpose:** Record the scope-discipline reasoning so every feature in the build has a documented justification and every feature we *didn't* build has a documented reason.

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
| Analyst-initiated SNYPR bridge (not every alert) | Sibe: "I don't want to just get every alert. I just want to focus on things that actually need to be communicated" |
| Four workflow states: Open, Claimed, Awaiting Customer, Completed | Jim + Sibe Q6: "Open, Claimed, Awaiting Customer, Completed states are the most important" |
| Auto-assign ticket to the analyst who ran the playbook | Sibe Q6: "auto assign the ticket to the user who ran the playbook" |
| Wrong-client prevention on every outbound email | Jim: "analysts are working quickly, they'll copy a bunch of information, and then they'll send information to the wrong client" |
| Email bridge (inbound `soc@vdalabs.com` → ticket) | Sibe: primary pain point is email-to-SNYPR manual copy-paste |
| SNYPR SOAR bridge (Python playbook → ticket API) | Sibe: "we've got built-in SOAR capabilities, you can run like Python code" |
| Two-way SNYPR sync (Completed closes the incident) | Sibe Q6: "Completed... would also send the information to SNYPR and close out of the incident there" |
| Individual email signatures on outbound | Jim Q13: "properly formatted email to customer (individual email signatures)" |
| Reply confirmation ("your response logged under ticket ###") | Jim Q13: "smooth customer experience where they can reply... gives them a notice" |
| Customer portal — Open case | Jim: "maybe a mechanism for a customer to open a case directly with us" |
| Customer portal — My tickets | Jim explicit in the portal walkthrough |
| Customer portal — Contract | Jim explicit in the portal walkthrough (bought 200 Sentinel One, using 150) |
| Customer portal — Documents | Jim explicit in the portal walkthrough ("SLAs, communication mechanisms, severity docs") |
| Severity sort (CRIT first) in queue | How Sibe already mentally sorts — not a "ranking engine" |
| SLA clock (severity-driven, introduces formal tracking) | Jim + Sibe: VDA has no formal SLA today; the clock creates the measurement |
| BUS_FACTOR.md + DISCOVERY.md + ARCHITECTURE.md | Jim: "we don't want to be stuck with a tool that a year from now is not going to work" |
| Mobile responsiveness | Sibe and any SOC analyst using phone during off-hours |

### DEFENDED — not an explicit ask, but we chose to build it and can justify

| Feature | Why it's defensible |
|---|---|
| **Security Report (Phase 2 tile)** | Directly solves Jim's "customers have heartburn about reports" quote. Customers want more than his 5-year-old template. This is the one *new* capability in v4 beyond ticketing, and it has a clean stakeholder quote behind it. |
| **Swipe UX on mobile (analyst + portal)** | Modern ergonomics for an 11-analyst team that will sometimes triage on phones. Doesn't cost anything on desktop. Joey pushed for this explicitly. |
| **v4 design system doc** | Kendall is a software developer; he'll want to see design tokens and decisions documented. |
| **Analyst dashboard (Phase 2, not MVP)** | Vince raised a dashboard ask. The honest version of it inside v4 scope is an *operational* dashboard for Sibe's team — queue health, SLA breach trajectory, tickets per analyst, unassigned backlog. It supports triage, which passes the "does it help Sibe handle 20 tickets before lunch?" test. Belongs in Phase 2, not MVP, because (a) Jim said "focus on ticketing" for the 8-week build, and (b) a queue dashboard needs real ticket data to be useful — you can't design queue-health indicators against mock data and trust them. Scoped strictly to analyst operational use, NOT the cross-customer MSP-wide portfolio view Vince originally described (that was v2 drift and stays Phase 3+). |

### AT-RISK — not asked for by Jim, should probably trim after discovery answers

| Feature | Risk | What Jim might say |
|---|---|---|
| **Dashboards** (Phase 2 tile) | Not in Jim's explicit four. Feels like Vince's "I love the dashboard" bleeding in. | If Jim ignores it in Q7/Q8, cut it. |
| **Knowledge base** (Phase 2 tile) | Not in Jim's explicit four. We invented this. | Likely cuttable — Jim didn't mention a KB need. |
| **Services** (Phase 2 tile) | Overlaps with Contract tile. Redundant. | Almost certainly cuttable — merge into Contract. |
| **Stage 3 SNYPR flow demo view** | Still implies we're building a SNYPR integration surface if misread. Reality: we're not — Sibe writes the playbook on his side; we receive the webhook. | The rail+workspace rebuild moved this from a fourth desktop column to a cleanly separate nav-accessed view, which lowers the risk of misreading it as a built integration. Keep as demo; confirm framing with Jim's Q5 answer. |

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

## What Jim and Sibe's answers told us

The 13-question discovery questionnaire was returned with answers from both Jim (blue) and Sibe (green). The original is at `public/VDA_Discovery_Questionnaire.pdf`. Here's how the answers mapped against the AT-RISK items above:

**Dashboards (Phase 2 tile):** Jim Q11 said metrics and per-client reports would be "probably not necessary for phase 1 MVP but it would be nice." **Confirmed Phase 2.** Dashboard stays as a Phase 2 item, not MVP. The analyst console shows live queue data (which is just the UI working, not a "dashboard feature"), but generated reports and trend views are Phase 2.

**Knowledge base:** Jim didn't mention a KB need anywhere in the 13 answers. Sibe named **Hudu** as their existing KB portal. **Cut from the Phase 1 prototype.** If it comes back, it's Phase 2 at the earliest.

**Services tile:** Nobody mentioned it. **Merged into the Contract tile.** The "services" concept was redundant with "contract summary" from the start.

**Stage 3 SNYPR flow demo view:** The questionnaire confirmed the SNYPR bridge is analyst-initiated (Q6, Q7, Q9). The Stage 3 demo view is a prototype demo tool, not a production feature. **Kept as demo, framing confirmed.**

**New item surfaced:** Jim Q9 raised **AI-assisted investigation** as a nice-to-have — "some AI-assisted investigation about the alert or the context of the alert." **Noted, not in Phase 1 scope.** This is a Phase 2+ idea that gets revisited only if ticketing proves out. It is not being built speculatively. Kendall would call that a "science project."

### The reconciliation rule, applied

1. Jim's answers **confirmed** every IN-SCOPE feature → shipped as-is
2. Jim's answers **revealed** new requirements (four workflow states, auto-assign, individual signatures, reply confirmation, two-way SNYPR sync) → added to IN-SCOPE above
3. Jim's answers **ignored** the AT-RISK features (Dashboards, KB, Services) → trimmed or deferred as noted
4. Jim's answer **surfaced** one new nice-to-have (AI investigation) → noted, not built

**Do not** reopen OUT-OF-SCOPE items without Kendall's explicit sign-off. The scope discipline that killed Halo is the same discipline that protects this build.

---

## The Kendall test

If Kendall (software developer, signed off on killing Halo-scope-creep) reads the repo tomorrow, can he defend every file?

- `README.md` → yes, cites Jim's "just ticketing" quote and the Halo postmortem
- `ARCHITECTURE.md` → yes, the technical blueprint with the Terraform-rebuilds-from-zero property
- `DISCOVERY.md` → yes, synthesizes all three discovery sources
- `BUS_FACTOR.md` → yes, addresses Jim's "don't want to be stuck with a tool in a year" concern
- `sentry-console.jsx` → queue + detail + compose only. Defensible.
- `sentry-client.jsx` → 4 Jim tiles. Defensible.
- `sentry-home.jsx` → project home, the one link to send VDA. Defensible.
- `sentry-insights-tiered.jsx` → Phase 2 reporting preview, explicitly framed as "the ceiling, not the commitment." Defensible.
- `sentry-design-system-v2.html` → design tokens + rationale. Defensible.
- `SCOPE_AUDIT.md` → this doc. Proves we thought about it.

If any file fails that test, fix it before the demo — not after.

---

## One-line summary

**Phase 1 is ticketing plus one earned capability (Security Report). Three AT-RISK features were reconciled against Jim's answers: Dashboards confirmed Phase 2, Knowledge Base cut, Services merged into Contract. One new nice-to-have surfaced (AI-assisted investigation) and was parked. Vince's feedback describes a version of the product the team agreed to kill. Honor the stakeholder hierarchy: Jim > Sibe > Vince > Joey's instincts > Claude's aesthetic preferences. Kendall calls failed scope-creep builds "science projects." This doc exists to make sure we don't build one.**
