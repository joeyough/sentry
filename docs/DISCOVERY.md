# Sentry — Discovery One-Pager
**VDA Labs MSSP Console · Scoping Document**

---

## The problem in one sentence

VDA's engineers are drowning in duplicate alerts across Slack, Monday.com, and the SIEM — most are false positives, there's no single place to triage, and there's no clean way to show clients what's actually being done.

## The current state

- Halo was abandoned months ago. The team routed around it and never came back.
- The real system of record is Slack threads and individual memory.
- There is no reliable path from a detected alert to a client notification — some clients hear in 3 minutes, some in 3 hours, some never.
- Sales absorbs the consequences in renewal conversations.
- The team has been told to fix this twice. The fix has not stuck.

## What Sentry is

A noise-reduction layer and decision orchestration tool that sits on top of VDA's existing stack. Not a SIEM. Not a SOAR. Not a Halo replacement. A purpose-built console that:

1. **Ingests** alerts from any source (SIEM, EDR, Slack webhooks, Monday.com webhooks).
2. **Dedupes** alerts on a `(source, rule, asset, time-window)` key so the same event becomes one row, not seven.
3. **Scores** alerts using a per-client context model that learns from analyst decisions over time.
4. **Suppresses** known-good patterns (Critical Start TBR-style) so engineers only see deviations.
5. **Elevates** known-bad patterns via boost rules — LOLBIN execution, C2 beaconing, credential dumping.
6. **Reprioritizes** medium events exhibiting critical behavior so nothing slips through SLA gaps.
7. **Suggests** response playbooks mapped to every MITRE ATT&CK technique.
8. **Reports** to clients through a mobile-first app where they approve, override, and teach the system what matters.

## What best-in-class looks like (deck slide 13)

Four patterns separate the best MSSPs from the rest. Most MSPs miss all four. Sentry is built on all four.

**1. Known-good suppression, not just known-bad detection.** Critical Start filters everything through a Trusted Behavior Registry. Known-good patterns are resolved automatically. Only deviations surface. Most MSPs do the opposite: alert on everything, triage later.

**2. The model learns from every analyst decision.** NightBeacon (Binary Defense) retrains nightly on analyst feedback, not customer data. Every true positive and false positive makes the next call faster. Most MSPs never close this loop.

**3. The client is part of the feedback loop, not just a notification endpoint.** When a client confirms an escalation, it strengthens the detection model for their environment. Most MSPs treat the client as a ticket recipient. Best-in-class treats them as a training signal.

**4. Auto-reprioritization catches what SLA thresholds miss.** NightBeacon automatically elevates medium events that exhibit high-risk behavior. The medium alert during a pen test that nobody looked at? It gets bumped to critical. Most MSPs lose these in the noise.

## How Sentry delivers it (deck slide 14)

| Capability | What it does | Inspired by |
|---|---|---|
| **Suppress** | Three learning loops score every alert by client context. Known-good auto-resolves. FP rate drops week over week. | Critical Start TBR |
| **Learn** | Every analyst decision retrains the model. Customer confirmations strengthen detection. Nightly retrain cycle. | NightBeacon feedback pipeline |
| **Elevate** | Auto-reprioritization badges. Boost rules for known-bad patterns. Suggested playbooks for every MITRE technique. | NightBeacon auto-reprioritization |
| **Teach** | Client app is bidirectional. Clients approve, override, rate clarity 1-5, and adjust asset criticality. | Original to Sentry |
| **Extend** | Lab tab: any engineer describes a feature in plain English, gets a spec with tests and a sandbox preview. | Original to Sentry |

## The four tabs (engineer console)

| Tab | Purpose | Audience |
|---|---|---|
| **Dashboard** | Tufte-style war-room readout. One sentence, sparklines, small multiples, horizon chart, outcome metrics, model retrain timestamp. | Engineers + leadership |
| **Alerts** | Triage queue with source badges (EDR/SIEM/Slack/Monday), dedupe counts, auto-reprioritization badges, playbook suggestions, enrichment panel, boost rule indicators. | Engineers |
| **Clients** | Per-client maturity, criticality, escalation contacts, boost rules (known-bad patterns). | Engineers + managers |
| **Lab** | Natural-language feature requests with auto-generated specs, red tests, and live sandbox preview. The key-man-risk killer. | Anyone |

## The client app

A separate mobile-first app for VDA's clients. Not a dashboard — a status check. Three states:

- **All clear** — everything's handled, no action needed.
- **We're on it** — VDA is actively triaging, no action needed yet.
- **Your attention** — there's a decision only the client can make.

Clients approve, override, rate clarity (1-5), or teach the system what matters via criticality feedback. Client confirmations feed directly back into the scoring model — every approval strengthens detection for that client's environment.

The client app also includes a **weekly digest** — a screenshot-ready summary of what VDA did that week, including confirmed incident count, designed to be forwarded to the board.

Auto light/dark theme. Fraunces + Inter typography.

## The dashboard philosophy

Standard SOC dashboards are decorative — KPI cards, donut charts, gradients, dropdowns. Sentry follows Edward Tufte's principles: maximize the data-ink ratio, eliminate chartjunk. The dashboard reads more like a Bloomberg terminal than a SaaS app:

- **One sentence at the top**, not four KPI cards.
- **Sparklines** embedded inline next to client names.
- **Small multiples** so all clients are visible at once.
- **A horizon chart** packing 24 hours of all-client volume into 60 vertical pixels.
- **Color reserved for exceptions only** — grayscale by default.
- **Model retrain timestamp** — shows when the scoring model last updated and how many training events it has processed.

## The 5-week MVP plan

| Week | Deliverable | Key tests |
|---|---|---|
| 1 | Ingestion bridge — webhook receiver + normalized schema + dedupe key + universal log translator | 5 acceptance tests |
| 2 | Alerts tab with dedupe + source filters + auto-reprioritization + playbook suggestions | 6 acceptance tests |
| 3 | Tufte dashboard wired to live data + outcome metrics framework | 5 acceptance tests |
| 4 | Client portal — internal config + client-facing app with confirmation loop | 5 acceptance tests |
| 5 | Suppression + boost rules engine + Slack/Teams outbound + polish | 6 acceptance tests |

Every week is gated red-to-green: tests are written before the code, the week is "done" only when all tests pass, and the artifact is deployed to staging for VDA's team to review.

## How we plan to measure (deck slide 16)

The deck defines a measurement framework, not a set of promises. The baselines come from discovery — from sitting with the team in weeks 1-2 — not from this document.

**Primary outcome metrics:**

| Metric | What it measures | How |
|---|---|---|
| **Client clarity (1-5)** | Did the client understand what happened and why? | Scored weekly by pilot accounts |
| **FP rate trending** | Is the noise getting better or worse over time? | Baselined in discovery, tracked weekly |
| **Renewal signal** | Does sales reference the alerting experience in renewals? | Yes/no, tracked by sales team |

**Also tracked:**

| Metric | What it measures | Notes |
|---|---|---|
| Time to notification | Alert to client, per incident | Target comes from discovery |
| Slack incident volume | Is the team still routing around the system? | If it doesn't drop by week 12, the system isn't working |

What "good" looks like for VDA is a discovery question. These metrics are the framework. The numbers come from the team, not from us.

## Key man risk

The honest concern: *if you build it, we have to keep you around to maintain it.* Three answers:

1. **Vanilla stack.** React + Supabase + standard hooks. No exotic libraries. A competent junior dev or any LLM coding agent can extend it.
2. **Documentation as a deliverable.** Every component has a header explaining *why* it exists. A `BUS_FACTOR.md` lists every dependency, secret, and decision. Knowledge transfer is part of the engagement, not an afterthought.
3. **The Lab tab.** A built-in natural-language feature request system. Any engineer can describe a change in plain English; Sentry generates the spec, the red tests, and a sandbox preview. The tool is designed to extend itself, which means VDA isn't trapped with the original builder.

VDA owns the repo, the deployment, and the data from day one. We're consultants, not vendors.

## What's in the prototype today

Working prototypes of both the engineer console (`sentry-v2.jsx`) and the client app (`sentry-client.jsx`) that run in any browser. They include:

- All four tabs functional (Dashboard, Alerts, Clients, Lab)
- Mock alerts from 3 fictional clients with real MITRE ATT&CK technique IDs
- Tufte dashboard with sparklines, small multiples, horizon chart, and model retrain timestamp
- Full alert triage flow with three live learning loops
- Auto-reprioritization badges on alerts where Sentry score diverges from sensor severity
- Suggested playbooks mapped to every MITRE technique
- Boost rules for known-bad patterns (LOLBIN execution, C2 beaconing, credential dumping)
- Agentic enrichment panel (mock — production queries real APIs)
- Client confirmation loop that feeds back into the scoring model
- Source badges (EDR/SIEM/Slack/Monday) and dedupe counts on every alert
- Lab tab with spec generation and live sandbox preview
- Client app with status screen, decision flow, clarity rating (1-5), criticality teach-back, confirmation toast, and weekly digest
- Auto light/dark theme on both apps
- Live TDD test panels on both apps
- Responsive mobile layout — icon-only tabs on small screens

## What's not in the prototype

- Real alert ingestion from VDA's actual tools (needs Week 1 backend)
- Real auth and multi-analyst support (needs Week 1 backend)
- Persistent storage across sessions (needs Week 1 backend)
- Real enrichment from source APIs (needs Week 1 integrations)
- The promote-to-staging Git integration in Lab (needs Week 5)
- SOC 2 compliance layer (post-MVP)

## Next steps

1. Meet with Seba. Ask questions. Validate or break this diagnosis.
2. Get a list of the 3-5 alert sources VDA actually uses today.
3. Pick the Week 1 backend (Supabase recommended for speed).
4. Lock the 5-week schedule and the staging deployment URL.
5. Begin Week 1 — ingestion bridge, red tests written first.

---

*Prepared as a discovery artifact. Not a contract, not a final spec — a starting point for a conversation.*| 2 | Alerts tab with real ingested data + dedupe + source filters | 6 acceptance tests |
| 3 | Tufte dashboard wired to live data | 5 acceptance tests |
| 4 | Client portal (internal config + read-only client-facing view) | 5 acceptance tests |
| 5 | Suppression rules engine + Slack/Teams outbound + polish | 6 acceptance tests |

Every week is gated red-to-green: tests are written before the code, the week is "done" only when the test panel runs all green, and the artifact is deployed to the staging URL for VDA's team to poke at before the next week starts.

## How we plan to measure

The deck (slide 14) defines a measurement framework, not a set of promises. The baselines come from discovery — from sitting with the team in weeks 1-2 — not from this document.

**Primary outcome metrics:**

| Metric | What it measures | How |
|---|---|---|
| **Client clarity (1-5)** | Did the client understand what happened and why? | Scored weekly by pilot accounts |
| **FP rate trending** | Is the noise getting better or worse over time? | Baselined in discovery, tracked weekly |
| **Renewal signal** | Does sales reference the alerting experience in renewals? | Yes/no, tracked by sales team |

**Also tracked:**

| Metric | What it measures | Notes |
|---|---|---|
| Time to notification | Alert to client, per incident | Target comes from discovery |
| Slack incident volume | Is the team still routing around the system? | If it doesn't drop by week 12, the system isn't working |

What "good" looks like for VDA is a discovery question. These metrics are the framework. The numbers come from the team, not from us.

## Key man risk

The honest concern: *if you build it, we have to keep you around to maintain it.* Three answers:

1. **Vanilla stack.** React + Supabase + standard hooks. No exotic libraries, no clever metaprogramming. A competent junior dev or any LLM coding agent can extend it.
2. **Documentation as a deliverable.** Every component has a header explaining *why* it exists. A `BUS_FACTOR.md` lists every dependency, secret, and "if you only read one file, read this." Knowledge transfer is part of the engagement, not an afterthought.
3. **The Lab tab.** A built-in natural-language feature request system. Any engineer can describe a change in plain English; Sentry generates the spec, the red tests, and a code preview. Promote-to-staging is one click. The tool is designed to extend itself, which means VDA isn't trapped with the original builder.

VDA owns the repo, the deployment, and the data from day one. We're consultants, not vendors.

## What's in the prototype today

Working prototypes of both the engineer console (`sentry-v2.jsx`) and the client app (`sentry-client.jsx`) that run in any browser. They show:

- All four tabs functional (Dashboard, Alerts, Clients, Lab)
- Mock alerts from 3 fictional clients with real MITRE ATT&CK technique IDs
- The Tufte dashboard with sparklines, small multiples, and a horizon chart
- The full alert triage flow with three live learning loops
- Source badges (EDR/SIEM/Slack/Monday) and dedupe counts on every alert
- The Lab tab with working Anthropic API calls (generates real specs from real prompts)
- The client app with status screen, decision flow, criticality teach-back, and weekly digest
- Live TDD test panels on both apps showing assertions across all phase groups

## What's not in the prototype

- Real alert ingestion from VDA's actual tools (needs Week 1 backend)
- Real auth and multi-analyst support (needs Week 1 backend)
- Persistent storage across sessions (needs Week 1 backend)
- The promote-to-staging Git integration (needs Week 5)
- SOC 2 compliance layer (post-MVP)

## Next steps

1. Meet with Seba. Ask questions. Validate or break this diagnosis.
2. Get a list of the 3-5 alert sources VDA actually uses today.
3. Pick the Week 1 backend (Supabase recommended for speed).
4. Lock the 5-week schedule and the staging deployment URL.
5. Begin Week 1 — ingestion bridge, red tests written first.

---

*Prepared as a discovery artifact. Not a contract, not a final spec — a starting point for a conversation.*
