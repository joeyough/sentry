# BUS_FACTOR.md

If the original builder gets hit by a bus, this is the file you read first.

## Architecture (one paragraph)

Two React single-page apps. No backend yet (Week 1 adds Supabase). The engineer console (`sentry-v2.jsx`) and client app (`sentry-client.jsx`) are both self-contained JSX files — all components, state, scoring logic, and mock data live in one file each. This was deliberate: no dependency graphs, no import chains, no hidden configuration. Copy the file, drop it into a React project, it runs.

## Dependencies (complete list)

| Package | Version | Purpose |
|---------|---------|---------|
| react | 18+ | UI framework |
| lucide-react | 0.383.0 | Icons |
| tailwindcss | (utility classes only) | Styling — no compiler needed in Artifacts |

That's it. Three dependencies. All standard. All replaceable.

## Key decisions and why

| Decision | Why | Where in code |
|----------|-----|---------------|
| Single-file architecture | Eliminates build complexity, maximizes portability | Both JSX files |
| Hardcoded mock data | No backend dependency, runs anywhere for demos | `buildInitialAlerts()`, `initialItems` |
| Sentry score ≠ sensor severity | The whole pitch — context-aware scoring, not vendor pass-through | `scoreAlert()` |
| Three learning loops | Alert-type, client maturity, analyst weight — all client-side | `computeTechStats()`, `computeClientMaturity()`, `scoreAlert()` |
| TBR-style suppression | FP rate ≥75% over 4+ decisions → score crushed to 35% | `suppression` variable in `scoreAlert()` |
| Client clarity 1-5 | Aligns with deck slide 14 outcome metric | Decision screen in client app |
| Criticality teach-back | Client can elevate/lower asset importance, feeds scoring | `criticalityOverrides` in client app |
| Lab tab uses Anthropic API | Generates feature specs from natural language, kills key-man risk | `LabTab` component, `api.anthropic.com` call |
| Fraunces + Inter fonts | Client app uses serif headers + sans body for luxury feel | `@import` in client app styles |
| JetBrains Mono | Engineer console uses monospace for terminal aesthetic | `@import` in v2 styles |

## Scoring math (the important part)

```
score = rawSeverity × criticalityMult × historyMult × maturityAdj × noveltyBoost × suppression

where:
  criticalityMult = 0.75 + (client.criticality / 100) × 0.55
  historyMult     = 0.6 + (historicalTPRate) × 0.9
  maturityAdj     = 1 - ((100 - clientMaturity) / 100) × 0.18
  noveltyBoost    = 1 + (alert.noveltyBoost / 100)
  suppression     = 0.35 if (4+ decisions, 0 TPs, 3+ FPs) else 1.0
```

All numbers are tunable. All live in `scoreAlert()`.

## What needs to happen next (Week 1)

1. **Supabase project** — free tier, Postgres. Tables: `alerts`, `decisions`, `clients`, `suppression_rules`.
2. **Webhook endpoint** — Netlify function or Supabase edge function. Accepts POST from Slack/Monday/SIEM, normalizes to the alert schema.
3. **Auth** — Supabase auth with magic links. Two roles: `analyst` and `client`.
4. **Replace `buildInitialAlerts()`** — swap mock data for a real `useEffect` fetch from Supabase.
5. **Replace `useState(decisions)`** — write decisions to Supabase, subscribe for real-time updates.

None of these changes touch the UI or the scoring logic. The architecture was designed for this swap.

## Secrets and configuration

| Secret | Where | Notes |
|--------|-------|-------|
| Anthropic API key | Lab tab only | Currently uses artifact-mode (no key needed in Claude Artifacts). Production needs `ANTHROPIC_API_KEY` env var |
| Supabase URL | Not yet | Will be `VITE_SUPABASE_URL` |
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
