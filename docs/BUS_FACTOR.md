# BUS_FACTOR.md

If the original builder gets hit by a bus, this is the file you read first.

## Architecture (one paragraph)

Two React single-page apps. No backend yet (Week 1 adds Supabase). The engineer console (`sentry-v2.jsx`) and client app (`sentry-client.jsx`) are both self-contained JSX files — all components, state, scoring logic, mock data, and styling live in one file each. This was deliberate: no dependency graphs, no import chains, no Tailwind arbitrary-value classes that could fail to compile in different environments. The repo includes a Vite scaffold with React Router (`/` for console, `/client` for client app) and a Netlify config for auto-deploy.

## Dependencies (complete list)

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18+ | UI framework |
| react-dom | 18+ | DOM rendering |
| react-router-dom | 6+ | Routing between console and client app |
| lucide-react | 0.383.0 | Icons |
| tailwindcss | 3.4+ | Layout primitives only — components use inline styles |
| vite | 5+ | Build tool |

Six dependencies. All standard. The JSX components themselves do not rely on Tailwind arbitrary values (`bg-[#...]`, `text-[Npx]`); colors and sizes are inline styles for maximum portability across build environments.

## Key decisions and why

| Decision | Why | Where in code |
|----------|-----|---------------|
| Single-file architecture | Eliminates build complexity, maximizes portability | Both JSX files |
| Inline styles, not Tailwind arbitrary values | Tailwind JIT classes don't compile in some sandboxes (Claude Artifacts, certain Vite setups). Inline styles work everywhere. | Both JSX files |
| Hardcoded mock data | No backend dependency, runs anywhere for demos | `buildInitialAlerts()`, `initialItems` |
| Sentry score ≠ sensor severity | Context-aware scoring, not vendor pass-through | `scoreAlert()` |
| Three learning loops | Alert-type, client maturity, analyst weight — all client-side | `computeTechStats()`, `computeClientMaturity()`, `scoreAlert()` |
| TBR-style suppression | FP rate ≥75% over 4+ decisions → score crushed to 35% | `suppression` in `scoreAlert()` |
| Boost rules | Known-bad patterns elevate scores — LOLBIN, C2, credential dumping | `INITIAL_BOOST_RULES` + `boostAdj` in `scoreAlert()` |
| Auto-reprioritization | Badge when Sentry score ≥70 and ≥20 above sensor severity | `reprioritized` in `AlertRow` |
| Playbook suggestion | Every MITRE technique mapped to a response playbook | `PLAYBOOKS` constant, rendered in `AlertRow` expanded panel |
| Client confirmation loop | Client approval writes TP event back into scoring model | `confirmFromClient()` + `clientConfirmations` state |
| Lab is mock-only (no fetch) | Eliminates CORS errors and external API dependencies — runs offline | `mockSpec()`, `mockPreviewHtml()`, `generate()` in `LabTab` |
| Lab sandbox preview | Generates spec + live HTML rendered in sandboxed iframe | iframe with `srcDoc` in `LabTab` |
| Mobile responsive via JS state | Claude Artifact sandboxes don't always honor `@media` rules in injected `<style>` tags. JavaScript `isMobile` + resize listener works everywhere. | `isMobile` state + `useEffect` resize listener in `SentryV2` |
| **Board PDF generator** | One-click McKinsey/BCG-style 4-page consulting brief from the client app — Cover / Executive Summary / Key Findings + Recs / Methodology + Sign-off | `generateBoardPdf()` function in `sentry-client.jsx` |
| **PDF: window.open + Blob fallback** | `window.open()` works on Netlify; sandboxed iframes get a Blob download instead. Same generated HTML, dual delivery. | `generateBoardPdf()` |
| **PDF typography: Cormorant Garamond + Inter** | Audit-firm aesthetic (not AI slop). Burgundy `#8b1a1a` accent on cream. | Embedded `<style>` in `generateBoardPdf` HTML template |
| Stacked client header | Original single-line "Sentry Client · Aspen Holdings" smudged on narrow viewports. Now: accent dot + eyebrow label + serif client name with `text-overflow: ellipsis`. | Header strip in client app `App` |
| Elevated weekly digest button | Original button blended in. Now: accent left border, gradient background, "NEW · READY" eyebrow, accent chevron. | Status screen, weekly digest button |
| Auto light/dark theme | Both apps detect system preference with manual override | `ThemeCtx` in console, `theme` state in client app |

## Scoring math

```
score = (rawSeverity + boostAdj) × criticalityMult × historyMult × maturityAdj × noveltyBoost × suppression

where:
  criticalityMult = 0.75 + (client.criticality / 100) × 0.55
  historyMult     = 0.6 + (historicalTPRate) × 0.9
  maturityAdj     = 1 - ((100 - clientMaturity) / 100) × 0.18
  noveltyBoost    = 1 + (alert.noveltyBoost / 100)
  suppression     = 0.35 if (4+ decisions, 0 TPs, 3+ FPs) else 1.0
  boostAdj        = sum of boost values from matched boost rules
```

All numbers are tunable. All live in `scoreAlert()`.

## Reference platforms

| Platform | What we took | What we skipped |
|----------|-------------|----------------|
| **Critical Start** | Trusted Behavior Registry concept, contractual SLA discipline, mobile-first transparency | Full SOAR platform weight |
| **NightBeacon (Binary Defense)** | Analyst feedback retraining, auto-reprioritization, boost rules, nightly retrain cycle | BERT model (we use client-side math for prototype) |
| **Neither has** | Client-facing app, Lab tab for self-extension, Tufte dashboard, bidirectional client-analyst learning loop, board-ready PDF brief | — |

## What needs to happen next (Week 1)

1. **Supabase project** — Postgres. Tables: `alerts`, `decisions`, `clients`, `suppression_rules`, `boost_rules`.
2. **Webhook endpoint** — Netlify function or Supabase edge function. Normalizes Slack/Monday/SIEM POSTs to the alert schema.
3. **Auth** — Supabase magic links. Three roles: `analyst`, `manager`, `client`.
4. **Replace `buildInitialAlerts()`** — swap mock data for `useEffect` fetch from Supabase.
5. **Replace `useState(decisions)`** — write decisions to Supabase, subscribe for real-time updates.
6. **Replace mock enrichment** — wire ENRICH button to real EDR/SIEM API queries.
7. **Wire client confirmation** — client app approval writes to shared Supabase table, console reads it.
8. **(Optional)** Wire `generateBoardPdf()` to pull real weekly aggregates from Supabase instead of in-memory state.

None of these changes touch the UI or scoring logic.

## Secrets and configuration

| Secret | Where | Notes |
|--------|-------|-------|
| Supabase URL | Not yet | Will be `VITE_SUPABASE_URL` |
| Supabase anon key | Not yet | Will be `VITE_SUPABASE_ANON_KEY` |

No API keys needed for the current prototype. The Lab tab uses local mock generation. The board PDF generator is fully client-side (no external font fetches at runtime — Cormorant Garamond and Inter load from Google Fonts inside the generated PDF document).

## File structure

```
sentry/
├── README.md
├── package.json
├── vite.config.js
├── tailwind.config.js
├── netlify.toml
├── index.html
├── src/
│   ├── index.css
│   ├── main.jsx
│   ├── App.jsx              ← Router: / → console, /client → client app
│   ├── sentry-v2.jsx        ← Engineer console (~1300 lines)
│   └── sentry-client.jsx    ← Client app (~1380 lines, includes generateBoardPdf)
└── docs/
    ├── DISCOVERY.md
    └── BUS_FACTOR.md         ← You are here
```

## Deck alignment

The SecOps deck is `VDA_SecOps_Plan_v3.pptx`, 16 slides. It operates at the strategic level (Halo replacement, 5/20-week roadmap, options analysis) and does not duplicate the technical detail in this file. The deck and the code are complementary, not redundant.

## Who to call

| Role | Who | Context |
|------|-----|---------|
| Original builder | 3Nails Infosec / Joey | Built during planning phase |
| 3Nails CEO | Vincent | Technical oversight |
| VDA engineering lead | TBD (from Seba discovery) | Day-to-day owner post-handoff |
| VDA stakeholder | Kendall | Signs off on scope changes |
| VDA discovery contact | Seba | Initial discovery meeting |
