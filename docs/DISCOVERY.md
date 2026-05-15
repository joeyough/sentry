# Sentry — Discovery Brief

**VDA Labs × 3Nails Infosec · Consolidated from three sources · May 2026**

This document synthesizes everything learned in discovery into one place. It draws from three sources:

1. **The Kendall intro call** — Joey and Vince met with Kendall Rusco (VDA CEO) to understand the business need and his concerns about custom-built software.
2. **The Jim + Sibe discovery call** — Jim Blankenship (product owner), Sibe Klomp (SOC manager), Vince, and Joey walked through the current workflow, the Halo failure, and what the MVP should do.
3. **The 13-question discovery questionnaire** — filled in by Jim (blue) and Sibe (green), returned April 2026. The original is at `public/VDA_Discovery_Questionnaire.pdf`.

For the technical architecture, see `docs/ARCHITECTURE.md`. For feature-by-feature scope reasoning, see `docs/SCOPE_AUDIT.md`. For handoff notes, see `docs/BUS_FACTOR.md`. This document covers **what the people said and what it means for the build**.

---

## The problem in one sentence

VDA's ~11 SOC analysts serve ~150 customers and manually copy every customer email into Securonix SNYPR, and every SNYPR alert that needs customer communication gets hand-drafted in Gmail with contacts looked up in Hudu — there's no ticket of record, SLAs are tracked by memory, and wrong-customer data leakage has happened multiple times.

---

## What Kendall told us

Kendall is a software developer himself. He reads things literally and has strong opinions about what works and what doesn't. Three things came through clearly:

**He calls failed custom software "science projects."** This is his core pejorative. He's seen it happen: a developer builds something, accumulates all the intellectual property in their head, then leaves, and the company can't maintain what was built. His exact framing: a science project with one person's knowledge baked in is a liability, not an asset. The anti-science-project property is why the build uses Terraform (everything rebuilds from zero), standard tooling (React, Node, AWS), and documented architecture — so VDA can pick it up without us.

**He's nervous about anything custom-built, and he's right to be.** VDA does application security for customers. Kendall knows what can go wrong with custom software, and it makes him cautious. The build has to be secure, maintainable, and operated by VDA from day one — not hosted on some third-party platform they don't control. This is why the stack is React + Node.js on AWS (ECS/Docker), deployed with Terraform, with Cloudflare for DNS and email routing. VDA operates the deployment and controls its operational data throughout.

**He named Critical Start NDR as the customer-experience reference.** His vision: a VDA customer walking down the street in Italy on vacation should be able to pull up their phone and see what's happening with an incident. That's the design north star for the customer portal and eventually native apps. Phase 1 delivers the responsive-web version; Phase 2 adds native iOS/Android.

**He wants clear cost boundaries and ROI, not open-ended engagements.** He explicitly said: "I want to understand the ROI, the cost, and it can't be a surprise." No open-ended arrangements, no vague timelines. Phase 1 is 8 weeks, $24k, $3k/week, with milestones shared along the way. Every phase has a kill switch.

---

## What Jim and Sibe told us

### Jim Blankenship — product owner, scope anchor

Jim ran the Halo implementation. He's the one who sunk 100-200 hours into configuring it and then pulled the plug. His position is specific and consistent:

- *"We don't need anything super crazy. It just needs to be able to... send notifications to our customers based on severity, and then everything regarding that ticket or event is logged against that ticket through closure."*
- *"I'm leery to bite off on too much, just based on our [Halo] experience. I want to focus on ticketing."*
- *"We tried to do too much at one time, too much change at once."*

Jim also raised the **wrong-client problem** explicitly: *"We've had a lot of circumstances where analysts are working quickly, and they'll copy a bunch of information, and then they'll send information to the wrong client."* He asked for a structural stop-gap — not just a warning, but a UI that makes it impossible to mix customer data.

Jim showed us the Halo customer portal he liked. Four views: open a case, view tickets, contract summary (what they bought and usage), documents. He was clear: *"I don't think we need all the sales-related stuff... primarily focusing on ticketing."*

On reports, Jim raised that **customers have "heartburn" about report depth** — *"our existing report I put together like five years ago and it's the same report. It's a very basic template."* This is the one stakeholder-requested capability beyond ticketing, and it lives in Phase 2.

### Sibe Klomp — SOC manager, primary user, adoption owner

Sibe runs the daily workflow this tool replaces. His description of the current state is the spec:

- Incident in SNYPR → analyst claims, investigates, deems it requires communication → draft email in Gmail, grabbing pertinent info from the incident (username, IP, country, count) → look in **Hudu** (KB portal) for customer contacts → copy email addresses, paste into Gmail → send from shared SOC address → move incident to "awaiting customer" in SNYPR → paste sent email into SNYPR comments → customer responds → copy response into SNYPR comments → close incident.

Where it breaks: wrong contact info grabbed from Hudu, forgetting to change incident state, forgetting to log sent email, not closing the incident when the customer responds.

Sibe was clear on two design principles: **analyst-initiated** (not every alert becomes a ticket — too much noise) and **sensitive data stays in SNYPR** (the ticket references an incident ID, not the raw security telemetry).

Communications channels: primarily email, also **Slack** (trying to move away from Slack for initial escalation), and phone for critical incidents. Customer "heads-up" context ("this user is traveling to Brazil," "I'm bypassing MFA") lives in Slack today and sometimes in Hudu — analysts have to check both.

---

## What the questionnaire confirmed and changed

The filled questionnaire (`public/VDA_Discovery_Questionnaire.pdf`) is the authoritative source for specific requirements. Key findings that confirmed, corrected, or added to what we heard on the calls:

**Confirmed:**
- Primary users are the SOC team. Account Manager access is a "someday" bonus, not MVP.
- The single most important job: remove the manual email creation and auto-fill customer contacts.
- Analyst-initiated ticket creation from SNYPR, not auto-everything.
- Customer portal actions are read-only / acknowledgment-only in Phase 1.
- Out of scope: anything not SOC operations. Sales, project management, "doing too much at once like Halo."
- Success = the full communicated-incident workflow proven end-to-end, creation to resolution.

**Corrected:**
- Team size is **11**, not 12. (Jim said "12 ish" on the call; Sibe confirmed 11 in the questionnaire.)
- **VDA has no formal, tracked SLAs.** They prioritize by event severity, but the "1-hour critical SLA" from the call is an expectation, not a measured standard. The SLA clock is something Sentry introduces.
- The customer portal is **lower importance** than the analyst console. Sibe: the SOC manually creates tickets from customer requests, so the portal is a convenience.

**New requirements surfaced:**
- The four workflow states: **Open, Claimed, Awaiting Customer, Completed.** When created from SNYPR, the ticket auto-assigns to the analyst who ran the playbook. Awaiting Customer should have an expiration / auto-reminder. Completed should push the state back to SNYPR and close the incident there.
- **Individual email signatures** on outbound emails (not a generic SOC signature).
- Customer reply confirmation: *"your response has been logged under ticket ###."*
- Alert sources for the pilot: Securonix SNYPR SIEM, Huntress (automated emails), CrowdStrike/SentinelOne (API integrations).
- **Hudu** is explicitly where customer contacts and context live today.
- Follow-up reminders are a "big item" — analysts keep incidents in "claimed" status for days or weeks.
- Adoption ownership: **Sibe and his team**, with Jim helping where necessary.

**Noted nice-to-haves (not Phase 1):**
- **AI-assisted investigation** — Jim: "a nice to have would be some AI-assisted investigation about the alert or the context of the alert... something out of band that aids the analyst." Heard, noted, parked.
- MTTD/MTTR metrics and per-client reports — Jim: "probably not necessary for phase 1 MVP but it would be nice." Phase 2.
- Account Manager access to customer data — Jim: "at some point." Phase 2.

---

## Why Halo failed — the specific diagnosis

The discovery calls produced a clear, specific postmortem. This is not a generic "it didn't work" — the failure modes are named:

1. **Sold white-glove, delivered homework.** Halo promised 40 hours of professional services. Jim asked for 60. Over five months, he got 8 actual support hours. Everything else was the London-based consultant giving Jim homework.
2. **Scope drifted into everything.** Started as ticketing. Grew into CRM + project management + quotes + invoicing. Sales team hated it. Project team resisted it. Everything got rolled back.
3. **The implementation team vanished.** Two of the three Halo people left shortly after the sale. Jim was left configuring API endpoints alone, decoding errors without expertise.
4. **100-200 hours, all reversible.** Jim's estimate of the configuration time he personally invested. None of it is usable today.
5. **No adoption plan.** Nobody inside VDA owned making the team actually use it. When resistance came, there was no one to push through it.

Kendall's summary: he calls this kind of failure a "science project." The plan is designed around not repeating it.

---

## What this means for Phase 1

Phase 1 is 8 weeks. React + Node.js on AWS (ECS/Docker), deployed with Terraform, Cloudflare for email routing. The build scope, directly mapped to what the people said:

| What we build | Who asked for it |
|---------------|------------------|
| Ticket core (open, claim, note, status, close) | Jim: "everything logged against that ticket through closure" |
| SNYPR bridge (analyst-initiated, auto-assigns to playbook runner) | Sibe: workflow description + Q6 + Q9 |
| Email bridge on `soc@vdalabs.com` | Jim and Sibe: both named it |
| Wrong-client prevention (structural, not just a warning) | Jim: flagged twice on the call |
| SLA clock (severity-driven, introduces formal tracking) | Jim + Sibe: Q6 auto-reminder, Q10 follow-up reminders |
| Template-based outbound emails with individual signatures | Q9 + Q13 |
| Customer reply confirmation ("logged under ticket ###") | Q13 |
| Customer portal (4 views, mobile-responsive, lower priority) | Jim: showed us the Halo portal he liked |
| Two-way SNYPR sync (Completed closes the SNYPR incident) | Q6: "each step adding a comment or changes the state" |

**Explicitly not Phase 1:** monthly customer reports (Phase 2), native apps (Phase 2), AI-assisted investigation (noted nice-to-have), license tracking / CMDB / knowledge base / recurring tasks (Phase 2), CRM / quoting / project management (never — Halo failure modes).

---

## Open questions

- **Workflow state labels.** Jim and Sibe specified Open / Claimed / Awaiting Customer / Completed. The current prototype uses slightly different labels. The build aligns to what they specified.
- **Customer heads-up context.** Slack is where customers send "this user is traveling" notices. Whether this context moves into the ticketing system or stays in Slack is a week-1 decision with Sibe.
- **Is this bespoke or a product?** The build is bespoke for VDA. Any broader question is deferred.
- **SLA targets.** No formal SLA exists today. Specific response-hour targets per severity get set with the team during weeks 1-2, not assumed in advance.
- **Google Workspace admin access.** Kendall gates Workspace admin. Standing up a dev account for testing requires his sign-off — flagged by Jim on the call.

---

*This brief synthesizes what was said. The questionnaire PDF (`public/VDA_Discovery_Questionnaire.pdf`) has the verbatim answers. The deck (`public/VDA_SecOps_Plan.pdf`) has the three-phase plan. `docs/ARCHITECTURE.md` has the technical blueprint. `docs/SCOPE_AUDIT.md` has the feature-by-feature reasoning.*
