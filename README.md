# Sentry — VDA Labs MSSP Console

A noise-reduction layer and decision orchestration tool for VDA Labs' SecOps alerting.

Built by 3Nails Infosec. VDA owns the repo, the deployment, and the data.

## What's in this repo

```
src/
  sentry-v2.jsx     # Engineer console — 4 tabs: Dashboard, Alerts, Clients, Lab
  sentry-client.jsx  # Client app — status, decisions, digest, bidirectional teach

docs/
  DISCOVERY.md        # One-pager: problem, approach, 5-week plan, metrics framework
  BUS_FACTOR.md       # If you only read one file for handoff, read this
```

## Quick start

Both `.jsx` files are self-contained React components. No build step required for prototyping — drop into any React environment or use Claude Artifacts to preview.

For Netlify deployment:

```bash
npm create vite@latest sentry -- --template react
cd sentry
# Replace src/App.jsx with either sentry-v2.jsx or sentry-client.jsx
npm install lucide-react
npm run dev
```

## Stack

- **React** (functional components, hooks only)
- **Tailwind CSS** (utility classes, no compiler needed for Artifacts)
- **Lucide React** (icons)
- **No backend yet** — state lives in React. Week 1 adds Supabase.

Deliberately vanilla. A competent junior dev or any LLM coding agent can extend this.

## The two apps

### Engineer Console (`sentry-v2.jsx`)

Four tabs:

- **Dashboard** — Tufte-style. One sentence, sparklines, small multiples, horizon chart, outcome metrics framework.
- **Alerts** — Triage queue with source badges (EDR/SIEM/Slack/Monday), dedupe counts, three learning loops, explainability panel.
- **Clients** — Per-client maturity, criticality, escalation contacts.
- **Lab** — Natural-language feature requests via Anthropic API. Generates specs + red tests. The key-man-risk killer.

### Client App (`sentry-client.jsx`)

Four screens (no tabs, no menus):

- **Status** — The 2-second answer: all clear / we're on it / your attention needed.
- **Active** — What VDA is working on right now.
- **Decision** — Approve / Override / Ask later. One thumb. Plus clarity rating (1-5) and criticality teach-back.
- **Digest** — Weekly summary for the board.

Auto light/dark theme. Fraunces + Inter typography.

## Measurement framework

Aligned with SecOps deck slide 14. Baselines come from discovery, not promises.

| Metric | What | How |
|--------|------|-----|
| Client clarity (1-5) | Did they understand? | Weekly pilot scores |
| FP rate | Is noise improving? | Tracked from triage decisions |
| Renewal signal | Does sales mention alerting? | Yes/no from sales team |

## Reference platforms

- **Critical Start** — zero-trust triage, Trusted Behavior Registry, mobile-first transparency
- **Binary Defense NightBeacon** — AI-first pipeline, analyst feedback loops, explainability via LIME/SHAP

Sentry takes the best of both, tuned for a $10-20M MSSP.

## License

Proprietary. VDA Labs internal use only.
