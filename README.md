# Sentry — VDA Labs MSSP Console

A noise-reduction layer and decision orchestration tool for VDA Labs' SecOps alerting.

Built by 3Nails Infosec. VDA owns the repo, the deployment, and the data.

## What's in this repo

```
src/
  sentry-v2.jsx       # Engineer console — Dashboard, Alerts, Clients, Lab
  sentry-client.jsx   # Client app — status, decisions, digest, board PDF

docs/
  DISCOVERY.md          # One-pager: problem, approach, 5-week plan, metrics
  BUS_FACTOR.md         # If you only read one file for handoff, read this
```

## Quick start

```bash
git clone https://github.com/joeyough/sentry.git
cd sentry
npm install
npm run dev
```

Local dev server at `localhost:5173`. Both routes work:
- `/` — engineer console
- `/client` — client app

## Stack

- **React** (functional components, hooks only)
- **Vite** (build tool)
- **Tailwind CSS** (in dev dependencies — used for layout primitives only; the JSX components are styled with inline styles for Claude Artifacts portability)
- **Lucide React** (icons)
- **React Router** (`/` and `/client` routes)
- **No backend yet** — state lives in React. Week 1 adds Supabase.

Deliberately vanilla. A competent junior dev or any LLM coding agent can extend this.

## The two apps

### Engineer Console (`sentry-v2.jsx`)

Four tabs:

- **Dashboard** — Tufte-style. One sentence, sparklines, small multiples, horizon chart, outcome metrics, model retrain timestamp.
- **Alerts** — Triage queue with source badges, dedupe counts, three learning loops, auto-reprioritization badges, suggested playbooks, agentic enrichment panel, boost rule indicators, client confirmation badges.
- **Clients** — Per-client maturity, criticality, escalation contacts, boost rules for known-bad patterns.
- **Lab** — Natural-language feature requests. Generates specs with red tests and a live sandbox preview iframe. **Mock-only** (no external API calls — runs offline, no CORS issues).

Auto light/dark theme. Responsive — icon-only tabs on mobile via JavaScript `isMobile` state + resize listener (not CSS media queries).

### Client App (`sentry-client.jsx`)

Four screens (no tabs, no menus):

- **Status** — The 2-second answer: all clear / we're on it / your attention needed.
- **Active** — What VDA is working on right now.
- **Decision** — Approve / Override / Ask later. Clarity rating (1-5). Criticality teach-back. Confirmations feed back into the scoring model.
- **Digest** — Weekly summary with **board-ready PDF export** (see below).

Auto light/dark theme. Inter (UI) + Cormorant Garamond (PDF display type).

### Board PDF generator

The Digest screen's "Save as PDF for the board" button triggers `generateBoardPdf()`, which produces a 4-page McKinsey/BCG-style consulting brief:

| Page | Section |
|------|---------|
| 1 | Cover — client name, period, document ID, prepared-by/for |
| 2 | Executive Summary — one-sentence narrative, 4-metric row, daily volume bar chart, pull quote |
| 3 | Key Findings + Recommendations table (Priority/Action/Rationale) |
| 4 | Methodology, Confidence Statement, Sign-off blocks |

Typography: Cormorant Garamond display + Inter body. Burgundy `#8b1a1a` accent on cream. Letter-size pages, page numbers, "Confidential" footers. Zero npm dependencies — opens in a new window via `window.open()` with a Blob-download fallback for sandboxed environments. Auto-triggers print dialog.

## Key features (v3)

| Feature | Inspired by | What it does |
|---------|------------|--------------|
| Three learning loops | Critical Start TBR | Known-good suppression, per-client scoring |
| Auto-reprioritization | NightBeacon | Elevates medium events exhibiting critical behavior |
| Boost rules | NightBeacon | Known-bad patterns (LOLBIN, C2, cred dump) boost scores |
| Playbook suggestions | NightBeacon | Response steps mapped to every MITRE technique |
| Client confirmation loop | Original | Client approvals retrain the scoring model |
| Agentic enrichment | NightBeacon | Related alerts, process tree, network connections |
| Lab sandbox | Original | Natural language to spec + tests + live preview (mock-only) |
| Board PDF brief | Original | McKinsey/BCG-style 4-page weekly report, one click |
| Model retrain timestamp | NightBeacon | Shows when scoring model last updated |

## Measurement framework

Aligned with SecOps deck slide 16. Baselines come from discovery, not promises.

| Metric | What | How |
|--------|------|-----|
| Client clarity (1-5) | Did they understand? | Weekly pilot scores |
| FP rate | Is noise improving? | Tracked from triage decisions |
| Renewal signal | Does sales mention alerting? | Yes/no from sales team |

## Reference platforms

- **Critical Start** — zero-trust triage, Trusted Behavior Registry, mobile-first transparency
- **Binary Defense NightBeacon** — AI-first pipeline, analyst feedback loops, auto-reprioritization, boost rules

Sentry takes the best of both, tuned for a $10-20M MSSP.

## Deployment

Connected to Netlify via `netlify.toml`. Auto-deploys on push to main.

- `sentry-vda.netlify.app/` — engineer console
- `sentry-vda.netlify.app/client` — client app

## License

Proprietary. VDA Labs internal use only.
