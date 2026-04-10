# BUS_FACTOR.md

If the original builder gets hit by a bus, this is the file you read first.

## Architecture (one paragraph)

Two React single-page apps. No backend yet (Week 1 adds Supabase). The engineer console (`sentry-v2.jsx`) and client app (`sentry-client.jsx`) are both self-contained JSX files — all components, state, scoring logic, and mock data live in one file each. This was deliberate: no dependency graphs, no import chains, no hidden configuration. Copy the file, drop it into a React project, it runs. The repo includes a full Vite scaffold with Tailwind, React Router (/ for console, /client for client app), and a Netlify config for auto-deploy.

## Dependencies (complete list)

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18+ | UI framework |
| react-dom | 18+ | DOM rendering |
| react-router-dom | 6+ | Routing between console and client app |
| lucide-react | 0.383.0 | Icons |
| tailwindcss | 3.4+ | Utility CSS (dev dependency) |
| vite | 5+ | Build tool (dev dependency) |

That's it. Six dependencies, all standard, all replaceable.

## Key decisions and why

| Decision | Why | Where in code |
|----------|-----|---------------|
| Single-file architecture | Eliminates build complexity, maximizes portability | Both JSX files |
| Hardcoded mock data | No backend dependency, runs anywhere for demos | `buildInitialAlerts()`, `initialItems` |
| Sentry score ≠ sensor severity | The whole pitch — context-aware scoring, not vendor pass-through | `scoreAlert()` |
| Three learning loops | Alert-type, client maturity, analyst weight — all client-side | `computeTechStats()`, `computeClientMaturity()`, `scoreAlert()` |
| TBR-style suppression | FP rate ≥75% over 4+ decisions → score crushed to 35% | `suppression` variable in `scoreAlert()` |
| Boost rules (v3) | Known-bad patterns elevate scores — LOLBIN, C2, credential dumping | `INITIAL_BOOST_RULES` + `boostAdj` in `scoreAlert()` |
| Auto-reprioritization (v3) | Badge when Sentry score ≥70 and ≥20 above sensor severity | `reprioritized` in `AlertRow` |
| Playbook suggestion (v3) | Every MITRE technique mapped to a response playbook with steps | `PLAYBOOKS` constant, rendered in `AlertRow` expanded panel |
| Client confirmation loop (v3) | Client approval writes TP event back into scoring model | `confirmFromClient()` + `clientConfirmations` state |
| Agentic enrichment (v3) | Mock panel for related alerts, process tree, network connections | `showEnrich` toggle in `AlertRow` |
| Lab sandbox preview (v3) | Generates spec + live HTML preview rendered in sandboxed iframe | `mockSpec()`, `mockPreviewHtml()`, iframe in `LabTab` |
| Nightly retrain timestamp (v3) | Dashboard shows model retrain time and training event count | `RETRAIN_INFO` constant |
| Client clarity 1-5 (v3) | Clients rate how clear each communication was — feeds deck slide 16 metric | Decision screen in client app |
| Criticality teach-back | Client can elevate/lower asset importance, feeds scoring | `criticalityOverrides` in client app |
| Confirmation toast (v3) | Green toast on approval: "Your confirmation improved detection" | `confirmToast` state in client app |
| Auto light/dark theme | Both apps detect system preference with manual override | `ThemeCtx` in console, `theme` state in client app |
| Responsive tabs (v3) | Icon-only on mobile (<640px), icon+label on desktop | CSS media query `.tab-label` |
| JetBrains Mono + Fraunces + Inter | Console = terminal monospace, Client = luxury serif/sans pair | `@import` in style blocks |

## Scoring math (the important part)

```
score = (rawSeverity + boostAdj) × criticalityMult × historyMult × maturityAdj × noveltyBoost × suppression

where:
  criticalityMult = 0.75 + (client.criticality / 100) × 0.55
  historyMult     = 0.6 + (historicalTPRate) × 0.9
  maturityAdj     = 1 - ((100 - clientMaturity) / 100) × 0.18
  noveltyBoost    = 1 + (alert.noveltyBoost / 100)
  suppression     = 0.35 if (4+ decisions, 0 TPs, 3+ FPs) else 1.0
  boostAdj        = sum of boost values from matched boost rules (technique, regex, technique_at_new_client)
```

All numbers are tunable. All live in `scoreAlert()`.

## Reference platforms

| Platform | What we took | What we skipped |
|----------|-------------|----------------|
| **Critical Start** | Trusted Behavior Registry concept (known-good suppression), contractual SLA discipline, mobile-first transparency | Full SOAR platform weight, vendor lock-in |
| **NightBeacon (Binary Defense)** | Analyst feedback retraining, auto-reprioritization, boost rules, nightly retrain cycle, universal log translator concept | BERT model (we use client-side math for prototype), local LLM training pipeline |
| **Neither has** | Client-facing app, Lab tab for self-extension, Tufte dashboard, bidirectional client-analyst learning loop | — |

## What needs to happen next (Week 1)

1. **Supabase project** — free tier, Postgres. Tables: `alerts`, `decisions`, `clients`, `suppression_rules`, `boost_rules`.
2. **Webhook endpoint** — Netlify function or Supabase edge function. Accepts POST from Slack/Monday/SIEM, normalizes to the alert schema. Universal log translator (inspired by Kennedy's approach in NightBeacon).
3. **Auth** — Supabase auth with magic links. Three roles: `analyst`, `manager`, `client`.
4. **Replace `buildInitialAlerts()`** — swap mock data for a real `useEffect` fetch from Supabase.
5. **Replace `useState(decisions)`** — write decisions to Supabase, subscribe for real-time updates.
6. **Replace mock enrichment** — wire the ENRICH button to real EDR/SIEM API queries.
7. **Wire client confirmation** — client app approval writes to shared Supabase table, engineer console reads it.

None of these changes touch the UI or the scoring logic. The architecture was designed for this swap.

## Secrets and configuration

| Secret | Where | Notes |
|--------|-------|-------|
| Supabase URL | Not yet | Will be `VITE_SUPABASE_URL` |
| Supabase anon key | Not yet | Will be `VITE_SUPABASE_ANON_KEY` |

No API keys needed for the current prototype. The Lab tab uses local mock generation, not external API calls.

## File structure

```
sentry/
├── .gitignore
├── README.md
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── netlify.toml          ← build command + SPA redirects
├── index.html
├── src/
│   ├── index.css         ← Tailwind directives
│   ├── main.jsx          ← ReactDOM entry
│   ├── App.jsx           ← Router: / → console, /client → client app
│   ├── sentry-v2.jsx     ← Engineer console (~1300 lines)
│   └── sentry-client.jsx ← Client app (~1130 lines)
└── docs/
    ├── DISCOVERY.md      ← This project's one-pager
    └── BUS_FACTOR.md     ← You are here
```

## Deck alignment

The SecOps deck is at v3, 16 slides. Key slide references:

| Slide | Section | What it covers |
|-------|---------|---------------|
| 13 | BEST IN CLASS | Four patterns from Critical Start + NightBeacon that Sentry implements |
| 14 | THE SENTRY EDGE | How Sentry delivers each pattern: Suppress, Learn, Elevate, Teach, Extend |
| 15 | THE BUILD | Technical implementation: Console, Portal, Bridge, Extend, Stack |
| 16 | MEASUREMENT | Outcome metrics: Client clarity 1-5, FP rate, Renewal signal |

## Who to call

| Role | Who | Context |
|------|-----|---------|
| Original builder | 3Nails Infosec / Joey | Built during planning phase |
| 3Nails CEO | Vincent | Technical oversight |
| VDA engineering lead | TBD (from Seba discovery) | Day-to-day owner post-handoff |
| VDA stakeholder | Kendall | Signs off on scope changes |
| VDA discovery contact | Seba | Initial discovery meeting || Supabase URL | Not yet | Will be `VITE_SUPABASE_URL` |
| Supabase anon key | Not yet | Will be `VITE_SUPABASE_ANON_KEY` |

## Files you can safely ignore

| File | Why |
|------|-----|
| `sentry.jsx` (v1) | Superseded by `sentry-v2.jsx`. Kept for reference only. |

## Who to call

| Role | Who | Context |
|------|-----|---------|
| Original builder | 3Nails Infosec / Joey | Built during planning phase |
| VDA engineering lead | TBD (from Seba discovery) | Day-to-day owner |
| Stakeholder | Kendall | Signs off on scope changes |
