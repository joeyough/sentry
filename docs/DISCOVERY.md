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
4. **Triages** them through a fast keyboard-first or thumb-first interface with TP / FP / Escalate / Ask team decisions.
5. **Suppresses** known-good patterns (Critical Start TBR-style) so engineers only see deviations.
6. **Reports** to clients through a read-only transparency view — "here's what we did this week."

The two reference platforms are **Critical Start** (for the transparency model and SLA discipline) and **Binary Defense NightBeacon** (for the AI triage and explainability). Sentry borrows the best of both, tuned for an MSSP at VDA's scale.

## The four tabs

| Tab | Purpose | Audience |
|---|---|---|
| **Dashboard** | War-room readout. Tufte-style data density, no chartjunk. | Engineers + leadership |
| **Alerts** | Triage queue with dedupe, source badges, decision capture. | Engineers |
| **Clients** | Per-client maturity, criticality, escalation contacts. | Engineers + managers |
| **Lab** | Natural-language feature requests with auto-generated tests. | Anyone |

## The client app

A separate mobile-first app for VDA's clients. Not a dashboard — a status check. Three states:

- **All clear** — everything's handled, no action needed.
- **We're on it** — VDA is actively triaging, no action needed yet.
- **Your attention** — there's a decision only the client can make.

Clients approve, override, or teach the system what matters via criticality feedback. This is a bidirectional loop: client decisions feed back into the scoring engine on the engineer side. Over time, the model learns what each client actually cares about.

The client app also includes a **weekly digest** — a screenshot-ready summary of what VDA did that week, designed to be forwarded to the board.

## The dashboard philosophy

Standard SOC dashboards are decorative — KPI cards, donut charts, gradients, dropdowns. Edward Tufte's *Visual Display of Quantitative Information* makes the case for the opposite: maximize the data-ink ratio, eliminate chartjunk, use sparklines, small multiples, and dense tables. Sentry's dashboard reads more like a Bloomberg terminal or a *Financial Times* front page than a SaaS app:

- **One sentence at the top**, not four KPI cards.
- **Sparklines** embedded inline next to client names.
- **Small multiples** so all clients are visible at once.
- **A horizon chart** packing 24 hours of all-client volume into 60 vertical pixels.
- **Color reserved for exceptions only** — grayscale by default.

## The 5-week MVP plan

| Week | Deliverable | Red tests |
|---|---|---|
| 1 | Ingestion bridge — webhook receiver + normalized schema, dedupe key | 5 acceptance tests |
| 2 | Alerts tab with real ingested data + dedupe + source filters | 6 acceptance tests |
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
