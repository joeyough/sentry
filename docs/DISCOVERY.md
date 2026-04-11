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
8. **Reports** to clients through a mobile-first app where they approve, override, teach the system what matters, and export a board-ready PDF brief.

## What best-in-class looks like (deck slide 13)

Four patterns separate the best MSSPs from the rest. Most MSPs miss all four. Sentry is built on all four.

**1. Known-good suppression, not just known-bad detection.** Critical Start filters everything through a Trusted Behavior Registry. Known-good patterns are resolved automatically. Only deviations surface.

**2. The model learns from every analyst decision.** NightBeacon retrains nightly on analyst feedback. Every true positive and false positive makes the next call faster.

**3. The client is part of the feedback loop, not just a notification endpoint.** When a client confirms an escalation, it strengthens the detection model for their environment.

**4. Auto-reprioritization catches what SLA thresholds miss.** NightBeacon automatically elevates medium events that exhibit high-risk behavior.

## How Sentry delivers it (deck slide 14)

| Capability | What it does | Inspired by |
|---|---|---|
| **Suppress** | Three learning loops score every alert by client context. Known-good auto-resolves. | Critical Start TBR |
| **Learn** | Every analyst decision retrains the model. Customer confirmations strengthen detection. | NightBeacon feedback pipeline |
| **Elevate** | Auto-reprioritization badges. Boost rules for known-bad patterns. Suggested playbooks. | NightBeacon auto-reprioritization |
| **Teach** | Client app is bidirectional. Clients approve, override, rate clarity 1-5, adjust criticality. | Original to Sentry |
| **Extend** | Lab tab: any engineer describes a feature in plain English, gets a spec with tests and a sandbox preview. | Original to Sentry |
| **Report** | One-click McKinsey/BCG-style PDF brief from the client app, ready for the board. | Original to Sentry |

## The four tabs (engineer console)

| Tab | Purpose | Audience |
|---|---|---|
| **Dashboard** | Tufte-style war-room readout. One sentence, sparklines, small multiples, horizon chart, model retrain timestamp. | Engineers + leadership |
| **Alerts** | Triage queue with source badges (EDR/SIEM/Slack/Monday), dedupe counts, auto-reprioritization, playbook suggestions, enrichment, boost rules. | Engineers |
| **Clients** | Per-client maturity, criticality, escalation contacts, boost rules. | Engineers + managers |
| **Lab** | Natural-language feature requests with auto-generated specs, red tests, and live sandbox preview. **Mock-only** — runs offline, no API dependencies, no CORS. | Anyone |

## The client app

A separate mobile-first app for VDA's clients. Three states:

- **All clear** — everything's handled, no action needed.
- **We're on it** — VDA is actively triaging.
- **Your attention** — there's a decision only the client can make.

Clients approve, override, rate clarity (1-5), or teach the system what matters via criticality feedback. Client confirmations feed back into the scoring model.

The client app also includes a **weekly digest** that produces a one-click **board-ready PDF brief**. The brief is a 4-page McKinsey/BCG-style consulting document: a cover page, an executive summary with metrics and a daily-volume chart, a key-findings + recommendations table, and a methodology / sign-off page. Cormorant Garamond display type, Inter body, burgundy accent on cream — designed to look like an audit firm produced it, not an AI. Zero dependencies; uses `window.open()` with a Blob-download fallback for sandboxed environments.

## Mobile responsiveness

Both apps detect viewport width via a JavaScript `isMobile` state hook + resize event listener — not CSS media queries. This decision was made because Claude Artifact sandboxes don't always honor `@media` rules in injected styles, and the JS approach gives consistent behavior across every deployment target. Tabs render icon-only below 640px; full label + badge above.

## The 5-week MVP plan

| Week | Deliverable | Key tests |
|---|---|---|
| 1 | Ingestion bridge — webhook receiver + normalized schema + dedupe key | 5 acceptance tests |
| 2 | Alerts tab with dedupe + source filters + auto-reprioritization + playbooks | 6 acceptance tests |
| 3 | Tufte dashboard wired to live data + outcome metrics framework | 5 acceptance tests |
| 4 | Client portal — internal config + client-facing app with confirmation loop | 5 acceptance tests |
| 5 | Suppression + boost rules engine + Slack/Teams outbound + polish | 6 acceptance tests |

Every week is gated red-to-green: tests written before the code, the week is done only when all tests pass, artifact deployed to staging for VDA to review.

## How we plan to measure (deck slide 16)

| Metric | What | How |
|---|---|---|
| **Client clarity (1-5)** | Did the client understand? | Weekly pilot scores |
| **FP rate trending** | Is noise improving? | Baselined in discovery |
| **Renewal signal** | Does sales reference alerting in renewals? | Yes/no, sales team |

## Key man risk

1. **Vanilla stack.** React + Supabase + standard hooks. No exotic libraries.
2. **Documentation as a deliverable.** Every component has a header explaining *why*. `BUS_FACTOR.md` lists every dependency, secret, and decision.
3. **The Lab tab.** Built-in natural-language feature request system. Any engineer can describe a change in plain English and get a spec, red tests, and sandbox preview. The tool extends itself.

VDA owns the repo, the deployment, and the data from day one.

## What's in the prototype today

- All four tabs functional in the engineer console
- Mock alerts from 3 fictional clients with real MITRE ATT&CK technique IDs
- Tufte dashboard with sparklines, small multiples, horizon chart, retrain timestamp
- Three live learning loops, auto-reprioritization, playbook suggestions, boost rules
- Mock agentic enrichment panel
- Client confirmation loop
- Lab tab with spec generation and live sandbox preview (mock-only, offline)
- Client app: status, decision flow, clarity rating, criticality teach-back, confirmation toast
- **Board PDF brief generator — 4-page McKinsey/BCG style, one click**
- Auto light/dark theme on both apps
- Live TDD test panels on both apps
- Responsive mobile via JavaScript `isMobile` state

## What's not in the prototype

- Real alert ingestion from VDA's tools (Week 1 backend)
- Real auth and multi-analyst support (Week 1)
- Persistent storage across sessions (Week 1)
- Real enrichment from source APIs (Week 1)
- Lab promote-to-staging Git integration (Week 5)
- SOC 2 compliance layer (post-MVP)

## Next steps

1. Meet with Seba. Validate or break this diagnosis.
2. Get a list of the 3-5 alert sources VDA actually uses today.
3. Pick the Week 1 backend (Supabase recommended).
4. Lock the 5-week schedule and the staging URL.
5. Begin Week 1 — ingestion bridge, red tests written first.

---

*Prepared as a discovery artifact. Not a contract — a starting point for a conversation.*
