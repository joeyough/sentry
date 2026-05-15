/**
 * sentry-insights-tiered.jsx — Sentry Insights
 * Research-driven advanced reporting & analytics dashboard.
 * Phase 2 reporting preview + VDA sales-tool dual purpose.
 * Toggle is report DEPTH (Standard / Full), not project phase.
 *
 * Research sources informing this build:
 *   - Critical Start CORR (Risk Overview, Coverage Gaps, MOBILESOC)
 *   - Binary Defense investigation transparency UX (renamed: Decision Log)
 *   - Huntress Nov-2025 monthly/quarterly report redesign
 *   - Expel Workbench transparency model
 *   - 2025-2026 cyber insurance underwriting standards (Marsh, Coalition)
 *   - ScalePad / NinjaOne 2025 QBR best practices
 *   - NIST CSF 2.0 framing
 *
 * Brand system: Sentry design system tokens. All data mocked. Single-file JSX.
 * PDF export uses jsPDF + jspdf-autotable from CDN (loaded at runtime).
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Shield, Activity, AlertCircle, AlertTriangle, BarChart3, Clock, ChevronRight, ChevronDown,
  Layers, TrendingUp, TrendingDown, Users, Zap, Eye, FileText, Download,
  ArrowUpRight, ArrowDownRight, Target, Crosshair, Monitor, Server,
  Globe, Lock, Unlock, Cpu, Mail, CheckCircle2, XCircle, Wifi, WifiOff,
  Calendar, MapPin, Briefcase, Award, PieChart, Minus, Info, Filter,
  Building2, Hospital, Landmark, Scale, Factory, FileSignature, ChevronUp,
} from "lucide-react";

/* ============================================================
 * BRAND TOKENS — Sentry design system (locked)
 * ============================================================ */
const T = {
  bg: "#0A1628", bgCard: "#122238", bgCardEdge: "#1A2E47",
  bgElevated: "#172941", bgDeep: "#080E1A",
  ink: "#E8EEF4", inkDim: "#A8B8C8", inkMuted: "#6B7D91",
  divider: "#2A3E57",
  orange: "#D2691E", orangeSoft: "#E89968", orangeTint: "rgba(210,105,30,0.08)",
  steel: "#6B93B8", steelDim: "#4A7090", steelTint: "rgba(107,147,184,0.08)",
  sevCrit: "#D2691E", sevHigh: "#D4A574", sevMed: "#6B93B8", sevLow: "#6B7D91",
  slaOk: "#5B8F6F", slaWarn: "#D4A574", slaBreach: "#C95850",
  fontDisplay: 'Georgia, "Times New Roman", serif',
  fontBody: 'Calibri, "Segoe UI", system-ui, sans-serif',
  fontMono: 'Consolas, "Courier New", monospace',
};

const useIsMobile = (breakpoint = 768) => {
  const [m, setM] = useState(typeof window !== "undefined" ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    const h = () => setM(window.innerWidth < breakpoint);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [breakpoint]);
  return m;
};

/* ============================================================
 * TOOLTIP SYSTEM — three patterns, one shared hook
 * ============================================================ */
const useTooltip = () => {
  const [active, setActive] = useState(null);
  const isMobile = useIsMobile();
  useEffect(() => {
    if (!isMobile || !active) return;
    const close = () => setActive(null);
    document.addEventListener("scroll", close, true);
    document.addEventListener("click", close);
    return () => {
      document.removeEventListener("scroll", close, true);
      document.removeEventListener("click", close);
    };
  }, [isMobile, active]);

  const bind = (id) => {
    let timer;
    return {
      onMouseEnter: () => { if (!isMobile) { clearTimeout(timer); timer = setTimeout(() => setActive(id), 120); } },
      onMouseLeave: () => { if (!isMobile) { clearTimeout(timer); timer = setTimeout(() => setActive(null), 200); } },
      onClick: (e) => { if (isMobile) { e.stopPropagation(); setActive(active === id ? null : id); } },
      "data-tt": id,
    };
  };
  return { active, bind, close: () => setActive(null) };
};

const TooltipCard = ({ open, children, anchor = "top" }) => {
  if (!open) return null;
  const positions = {
    top: { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
    right: { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
    bottom: { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
  };
  return (
    <div style={{
      position: "absolute", zIndex: 1000, ...positions[anchor],
      background: T.bg, color: "#FFFFFF", padding: "10px 14px",
      borderRadius: 4, boxShadow: "0 4px 12px rgba(10,22,40,0.32)",
      fontFamily: T.fontBody, fontSize: 12, lineHeight: 1.5,
      maxWidth: 280, minWidth: 180, pointerEvents: "none",
      animation: "tt-in 150ms ease-out forwards",
      border: `1px solid ${T.bgCardEdge}`,
    }}>
      {children}
    </div>
  );
};

// Pattern 1: Info Dot
const InfoDot = ({ id, tip, source }) => {
  const tt = useTooltip();
  return (
    <span style={{ position: "relative", display: "inline-flex" }} {...tt.bind(id)}>
      <Info size={11} color={T.steel} style={{ opacity: tt.active === id ? 1 : 0.55, cursor: "help", transition: "opacity 150ms ease-out" }} />
      <TooltipCard open={tt.active === id}>
        <div>{tip}</div>
        {source && <div style={{ marginTop: 6, fontFamily: T.fontMono, fontSize: 10, color: T.steel, fontStyle: "italic" }}>Source: {source}</div>}
      </TooltipCard>
    </span>
  );
};

// Pattern 2: Dotted Underline
const DottedTerm = ({ id, term, definition }) => {
  const tt = useTooltip();
  return (
    <span style={{ position: "relative", display: "inline" }} {...tt.bind(id)}>
      <span style={{ borderBottom: `1px dotted ${T.steel}`, cursor: "help" }}>{term}</span>
      <TooltipCard open={tt.active === id}>{definition}</TooltipCard>
    </span>
  );
};

/* ============================================================
 * MOCK DATA — four distinct customer profiles
 * ============================================================ */

const NOW = new Date(2026, 4, 7); // May 7, 2026

const CUSTOMERS = {
  meridian: {
    id: "meridian",
    name: "Meridian Health",
    icon: Hospital,
    industry: "Healthcare",
    sites: 6,
    endpoints: 412,
    identities: 1840,
    tier: "Tier 2 — 24×7 EDR + Identity + M365 + SIEM",
    period: { label: "Q1 2026 · Jan 1 – Mar 31", generated: "May 7, 2026", reportId: "SI-MERIDIAN-2026Q1" },
    quirk: "ED kiosks excluded — air-gapped per clinical IT.",
    cohortLabel: "47 mid-market healthcare providers",
    mttd: "6m 12s", mttr: "41m 30s", mttdPeer: "14m", mttrPeer: "2h 04m",

    summary: [
      "Q1 saw 3 high-severity incidents, all contained pre-impact. Akira affiliate dwell-time on the radiology VLAN was caught at initial access via impossible-travel detection. The session was isolated in 8 minutes and credentials rotated; no lateral movement, no encryption.",
      "Identity coverage improved from 71% to 84% after the March Entra rollout. DNS telemetry remains the single largest gap in your program — addressing it would close visibility on 12% of remaining attack paths and bring your peer-cohort dwell-time from above-median to top-decile.",
      "Heading into Q2: annual security awareness training (HIPAA §164.308(a)(5)) is due, the OCR random-audit window opens June 1, and we recommend prioritizing the DNS telemetry add-on. We will schedule the tabletop you flagged after the April board meeting.",
    ],

    kpis: {
      ticketsHandled: 312, escalated: 47, confirmed: 14, criticalCaught: 3,
      autoResolvedPct: 78, openCritical: 0, coveragePct: 84,
      roiTotal: 847400, sevSplit: { crit: 3, high: 11, med: 64, low: 234 },
    },

    coverage: [
      { source: "Endpoint EDR (CrowdStrike)",  covered: 398, degraded: 6,  uncovered: 8,   total: 412, last: "2m ago" },
      { source: "Identity (Entra ID)",         covered: 1546, degraded: 0, uncovered: 294, total: 1840, last: "live" },
      { source: "M365 Audit",                  covered: 1840, degraded: 0, uncovered: 0,   total: 1840, last: "live" },
      { source: "Firewall Syslog",             covered: 4,   degraded: 1,  uncovered: 0,   total: 5, last: "11m ago" },
      { source: "DNS Telemetry",               covered: 0,   degraded: 0,  uncovered: 412, total: 412, last: "—" },
      { source: "Backup Attestation",          covered: 363, degraded: 0,  uncovered: 49,  total: 412, last: "1h ago" },
    ],

    nextActions: [
      { rank: 1, action: "Enroll 294 unmanaged Entra accounts in Identity Threat Detection", reduction: "−18% identity breach risk", effort: "S", mitre: "T1078", owner: "VDA" },
      { rank: 2, action: "Deploy DNS telemetry collection to all sites", reduction: "−12% dwell-time exposure", effort: "M", mitre: "T1071", owner: "VDA" },
      { rank: 3, action: "Roll phishing-resistant MFA to clinical workstations", reduction: "−14% account-takeover risk", effort: "M", mitre: "T1110", owner: "Customer" },
      { rank: 4, action: "Annual Security Awareness Training (HIPAA §164.308(a)(5))", reduction: "Compliance — required", effort: "S", mitre: "—", owner: "Joint" },
    ],

    compliance: {
      primary: { framework: "HIPAA Security Rule", coverage: 84, controlsEvidenced: 47, controlsTotal: 56,
        gaps: ["§164.308(a)(5) — Annual SAT due May 2026", "§164.312(b) — log retention 6mo of 12 required"] },
      insurance: { readiness: 92, controls: [
        { name: "MFA enforcement", status: "evidenced", note: "100% across email/VPN/admin" },
        { name: "EDR coverage", status: "evidenced", note: "98.1% endpoints" },
        { name: "Immutable backups (3-2-1-1)", status: "evidenced", note: "Verified 04/22/2026" },
        { name: "Tested IR plan", status: "partial", note: "Tabletop overdue — last: Sep 2025" },
        { name: "Vendor oversight", status: "evidenced", note: "12/12 critical vendors attested" },
      ]},
    },

    narrative: {
      id: "INC-2026-0114",
      title: "Caught: Akira affiliate dwell on radiology VLAN",
      stoppedAt: "Initial Access (T1078.004)",
      timeline: [
        { t: "T+0:00", who: "Akira affiliate", what: "Login from impossible-travel IP (Romania → US in 14m)" },
        { t: "T+0:42", who: "VDA SOC", what: "Auto-isolated user session, paged on-call analyst" },
        { t: "T+1:15", who: "VDA SOC", what: "Confirmed credential-stuffing source; rotated 6 admin creds" },
        { t: "T+3:08", who: "VDA SOC", what: "Closed ticket — no lateral movement, no encryption" },
      ],
      whatCouldHaveHappened: "Akira's median dwell-to-encryption is 5 days. A 24-hour delay would likely have meant clinical-system halt during morning shift change.",
      avoided: "Estimated $1.4M – $3.2M in operational downtime avoided.",
    },

    weeklyTickets: [
      { week: "W1", crit: 0, high: 1, med: 5,  low: 22, note: null },
      { week: "W2", crit: 0, high: 0, med: 4,  low: 18, note: null },
      { week: "W3", crit: 0, high: 1, med: 6,  low: 21, note: null },
      { week: "W4", crit: 0, high: 1, med: 4,  low: 17, note: null },
      { week: "W5", crit: 1, high: 1, med: 5,  low: 19, note: "INC-0114: Akira contained" },
      { week: "W6", crit: 0, high: 0, med: 4,  low: 15, note: null },
      { week: "W7", crit: 0, high: 1, med: 7,  low: 20, note: null },
      { week: "W8", crit: 0, high: 1, med: 5,  low: 16, note: null },
      { week: "W9", crit: 0, high: 1, med: 6,  low: 18, note: null },
      { week: "W10",crit: 1, high: 1, med: 4,  low: 14, note: "M365 OAuth abuse wave (industry-wide)" },
      { week: "W11",crit: 0, high: 1, med: 5,  low: 13, note: null },
      { week: "W12",crit: 0, high: 1, med: 5,  low: 12, note: null },
      { week: "W13",crit: 1, high: 2, med: 4,  low: 9,  note: null },
    ],

    benchmarks: [
      { metric: "MTTD (mean time to detect)", you: 6.2,  peer: 14, top: 5,   unit: "min", betterLow: true },
      { metric: "MTTR (mean time to resolve)", you: 41.5, peer: 124, top: 38, unit: "min", betterLow: true },
      { metric: "Auto-resolved %",             you: 78,  peer: 62, top: 84,  unit: "%",   betterLow: false },
      { metric: "Median dwell-time",           you: 1.2, peer: 4.1, top: 0.9, unit: "days",betterLow: true },
      { metric: "Phish report rate",           you: 41,  peer: 27, top: 52,  unit: "%",   betterLow: false },
    ],

    investigations: [
      { id: "INV-9421", t: "Mar 14 · 06:14 EST", source: "EDR — CrowdStrike",
        signal: "powershell.exe -enc spawned by winword.exe on MERIDIAN-RAD-04",
        enrichment: ["VirusTotal: 14/72 detections on decoded payload", "Process tree: winword → powershell → cmd → curl to 185.x.x.x", "User context: radiology tech, no admin scope", "Asset criticality: HIGH (PHI-adjacent)"],
        decision: "Confirmed malicious — isolated host", decidedBy: "L2 Analyst (J. Reyes)", ttd: "4m 11s", ttr: "8m 02s", verdict: "Contained" },
      { id: "INV-9387", t: "Mar 11 · 22:47 EST", source: "Identity — Entra",
        signal: "Service account login from Lagos, Nigeria",
        enrichment: ["Geo: 8,200km from baseline", "Device: unmanaged, first-seen", "MFA: not satisfied", "Time-of-day: outside business hours"],
        decision: "Confirmed malicious — account suspended", decidedBy: "L2 Analyst (S. Klomp)", ttd: "2m 04s", ttr: "11m 15s", verdict: "True positive" },
      { id: "INV-9341", t: "Mar 09 · 10:22 EST", source: "M365 Audit",
        signal: "OAuth consent grant: 'Innocent Lookup' app requesting Mail.ReadWrite",
        enrichment: ["App publisher: unverified", "App age: 4 days", "User: clinical billing manager", "Pattern match: known consent-phishing wave"],
        decision: "Revoked consent, blocked app tenant-wide", decidedBy: "L1 Analyst (T. Lin)", ttd: "5m 48s", ttr: "12m 30s", verdict: "Prevented" },
    ],

    roadmap: {
      now: [
        { item: "DNS telemetry deployment to all 6 sites", owner: "VDA", effort: "M", csf: "Detect", reduction: "−12%", status: "in-progress" },
        { item: "Annual Security Awareness Training campaign", owner: "Joint", effort: "S", csf: "Protect", reduction: "Compliance", status: "not-started" },
        { item: "Q2 quarterly tabletop exercise", owner: "VDA", effort: "M", csf: "Respond", reduction: "Insurance evidence", status: "not-started" },
      ],
      next: [
        { item: "Enroll 294 unmanaged Entra accounts in ITDR", owner: "VDA", effort: "S", csf: "Protect", reduction: "−18%" },
        { item: "Phishing-resistant MFA to clinical workstations", owner: "Customer", effort: "M", csf: "Protect", reduction: "−14%" },
        { item: "12-month log retention upgrade (HIPAA §164.312(b))", owner: "VDA", effort: "S", csf: "Detect", reduction: "Compliance" },
      ],
      later: [
        { item: "HITRUST r2 readiness assessment", owner: "Joint", effort: "L", csf: "Govern", reduction: "Aspirational" },
        { item: "Medical-device IoT segmentation pilot", owner: "Customer", effort: "L", csf: "Protect", reduction: "−9%" },
      ],
    },

    roi: { components: [
      { label: "Analyst hours saved", value: 312000, detail: "1,040 hours × $300 loaded SOC analyst rate" },
      { label: "Incidents contained pre-impact", value: 425000, detail: "3 high-severity × industry avg $141K (IBM CDB 2025)" },
      { label: "Compliance audit prep saved", value: 60400, detail: "HIPAA evidence pack auto-generated" },
      { label: "Insurance premium hold", value: 50000, detail: "Carrier renewed flat vs. peer avg +18% (Coalition 2026)" },
    ]},
  },

  atlas: {
    id: "atlas",
    name: "Atlas Manufacturing",
    icon: Factory,
    industry: "Manufacturing",
    sites: 2,
    endpoints: 286,
    identities: 410,
    tier: "Tier 2 + OT Visibility add-on",
    period: { label: "Trailing 90d · Feb 7 – May 7", generated: "May 7, 2026", reportId: "SI-ATLAS-T90D" },
    quirk: "Plant 2 OT visibility deferred to Q3 — controls integrator scoping.",
    cohortLabel: "82 mid-market manufacturers (NIST 800-171 scope)",
    mttd: "8m 47s", mttr: "1h 04m", mttdPeer: "22m", mttrPeer: "3h 30m",

    summary: [
      "Trailing 90d saw 2 high-severity incidents, both contained at the network edge. RDP brute force from a Russian-block IP (likely RansomHub affiliate) was blocked at the firewall after 11 attempts; correlation showed similar attempts against three other manufacturers in your peer cohort.",
      "OT/ICS east-west visibility remains your largest gap at 40% — the controls-integrator scoping for Plant 2 is the gating step. Once complete, your CMMC L2 SSP will show full asset inventory coverage, the underwriter's #1 question for manufacturing renewals.",
      "Heading into Q3: CMMC SSP refresh is on deck, the 12-month log retention upgrade closes a known PCI-adjacent gap, and we recommend prioritizing OT segmentation alongside the integrator engagement so it lands in one project, not two.",
    ],

    kpis: { ticketsHandled: 218, escalated: 39, confirmed: 9, criticalCaught: 2, autoResolvedPct: 71, openCritical: 0, coveragePct: 76, roiTotal: 612000, sevSplit: { crit: 2, high: 7, med: 38, low: 171 } },

    coverage: [
      { source: "Endpoint EDR (SentinelOne)",   covered: 268, degraded: 0, uncovered: 18, total: 286, last: "1m ago" },
      { source: "Identity (AD on-prem)",        covered: 410, degraded: 0, uncovered: 0,  total: 410, last: "live" },
      { source: "M365 Audit",                   covered: 410, degraded: 0, uncovered: 0,  total: 410, last: "live" },
      { source: "Firewall Syslog",              covered: 6,   degraded: 0, uncovered: 0,  total: 6, last: "live" },
      { source: "OT/ICS Network Visibility",    covered: 14,  degraded: 0, uncovered: 20, total: 34, last: "5m ago" },
      { source: "Backup Attestation",           covered: 286, degraded: 0, uncovered: 0,  total: 286, last: "30m ago" },
    ],

    nextActions: [
      { rank: 1, action: "Roll EDR to 18 plant-floor Windows hosts on AV-only", reduction: "−15% endpoint risk", effort: "S", mitre: "T1059", owner: "VDA" },
      { rank: 2, action: "OT segmentation project (joint with controls integrator)", reduction: "−22% IT-OT pivot risk", effort: "L", mitre: "T1021", owner: "Joint" },
      { rank: 3, action: "12-month log retention (CMMC AU.L2-3.3.1)", reduction: "Compliance — required", effort: "S", mitre: "—", owner: "VDA" },
      { rank: 4, action: "VPN/RDP hardening — phishing-resistant MFA", reduction: "−18% credential-theft risk", effort: "M", mitre: "T1110", owner: "Customer" },
    ],

    compliance: {
      primary: { framework: "CMMC 2.0 Level 2 (NIST SP 800-171)", coverage: 76, controlsEvidenced: 80, controlsTotal: 110,
        gaps: ["AU.L2-3.3.1 — log retention partial (90d of 365)", "SC.L2-3.13.1 — OT segmentation incomplete", "IR.L2-3.6.3 — IR test cadence due"] },
      insurance: { readiness: 81, controls: [
        { name: "MFA enforcement", status: "partial", note: "Office staff 100%; plant floor in pilot" },
        { name: "EDR coverage", status: "partial", note: "93.7% endpoints — 18 AV-only" },
        { name: "Immutable backups (3-2-1-1)", status: "evidenced", note: "Verified 04/29/2026" },
        { name: "Tested IR plan", status: "evidenced", note: "Tabletop completed 03/14/2026" },
        { name: "Vendor oversight", status: "evidenced", note: "9/9 critical suppliers attested" },
      ]},
    },

    narrative: {
      id: "INC-2026-0089",
      title: "Blocked: RansomHub-affiliate RDP brute-force at Plant 1 edge",
      stoppedAt: "Initial Access — denied",
      timeline: [
        { t: "T+0:00",  who: "RansomHub affiliate", what: "RDP attempts begin against Plant-1 firewall (185.x.x.x, Russia)" },
        { t: "T+0:08",  who: "VDA SOC",  what: "Threshold rule fires after 11 attempts; source IP auto-blocked" },
        { t: "T+0:24",  who: "VDA SOC",  what: "Threat-intel pivot: same IP attempted entry against 3 other Sentry customers in 90m" },
        { t: "T+1:14",  who: "VDA SOC",  what: "Pushed IOC to all customers' edge filters; updated geo-fence policy" },
      ],
      whatCouldHaveHappened: "RansomHub's median time from successful RDP entry to encryption is 22 hours in manufacturing. Median impact: 4–9 days of production downtime.",
      avoided: "Estimated $2.1M – $4.7M in production downtime avoided.",
    },

    weeklyTickets: [
      { week: "W1", crit: 0, high: 0, med: 3, low: 14, note: null },
      { week: "W2", crit: 1, high: 1, med: 4, low: 13, note: "INC-0089: RansomHub blocked" },
      { week: "W3", crit: 0, high: 0, med: 2, low: 12, note: null },
      { week: "W4", crit: 0, high: 1, med: 3, low: 11, note: null },
      { week: "W5", crit: 0, high: 1, med: 4, low: 14, note: null },
      { week: "W6", crit: 0, high: 0, med: 3, low: 13, note: null },
      { week: "W7", crit: 1, high: 1, med: 3, low: 12, note: "Phishing wave: invoice-impersonation" },
      { week: "W8", crit: 0, high: 1, med: 3, low: 10, note: null },
      { week: "W9", crit: 0, high: 0, med: 4, low: 11, note: null },
      { week: "W10",crit: 0, high: 1, med: 3, low: 13, note: null },
      { week: "W11",crit: 0, high: 0, med: 3, low: 12, note: null },
      { week: "W12",crit: 0, high: 1, med: 3, low: 14, note: null },
      { week: "W13",crit: 0, high: 0, med: 0, low: 12, note: null },
    ],

    benchmarks: [
      { metric: "MTTD",          you: 8.8,  peer: 22,  top: 7,    unit: "min", betterLow: true },
      { metric: "MTTR",          you: 64,   peer: 210, top: 58,   unit: "min", betterLow: true },
      { metric: "Auto-resolved %", you: 71, peer: 54,  top: 82,   unit: "%",   betterLow: false },
      { metric: "Dwell-time",    you: 1.8,  peer: 6.2, top: 1.1,  unit: "days",betterLow: true },
      { metric: "OT signal coverage", you: 41, peer: 28, top: 78, unit: "%",   betterLow: false },
    ],

    investigations: [
      { id: "INV-8814", t: "Feb 19 · 03:14 CST", source: "Firewall — Palo Alto",
        signal: "11 RDP attempts from 185.213.x.x (Russia geofence)",
        enrichment: ["IP reputation: AbuseIPDB 100/100 confidence malicious", "Threat actor: RansomHub affiliate cluster (CISA AA24-242A)", "Cross-customer hits: 3 other Sentry customers in 90m", "Source ASN: bulletproof hosting"],
        decision: "Auto-blocked at edge; IOC pushed tenant-wide", decidedBy: "L2 Analyst (R. Mendez)", ttd: "8m 12s", ttr: "1h 14m", verdict: "Prevented" },
      { id: "INV-8762", t: "Feb 11 · 14:08 CST", source: "M365 — phishing",
        signal: "Invoice-impersonation campaign targeting AP team (4 mailboxes)",
        enrichment: ["Sender: lookalike domain (1-char swap)", "Attachment: macro-enabled XLSM", "Payload: Cobalt Strike beacon (decoded)", "Match: known FIN7-adjacent TTPs"],
        decision: "Quarantined, AP team briefed, training assigned", decidedBy: "L1 Analyst (M. Doyle)", ttd: "11m 04s", ttr: "32m 18s", verdict: "Contained" },
    ],

    roadmap: {
      now: [
        { item: "Roll EDR to 18 plant-floor Windows hosts", owner: "VDA", effort: "S", csf: "Protect", reduction: "−15%", status: "in-progress" },
        { item: "12-month log retention upgrade", owner: "VDA", effort: "S", csf: "Detect", reduction: "Compliance", status: "in-progress" },
        { item: "CMMC L2 SSP refresh", owner: "Joint", effort: "M", csf: "Govern", reduction: "Compliance", status: "not-started" },
      ],
      next: [
        { item: "OT segmentation Plant 2 (controls integrator)", owner: "Joint", effort: "L", csf: "Protect", reduction: "−22%" },
        { item: "Phishing-resistant MFA — plant floor", owner: "Customer", effort: "M", csf: "Protect", reduction: "−18%" },
        { item: "Q3 tabletop — manufacturing-specific scenario", owner: "VDA", effort: "S", csf: "Respond", reduction: "Insurance" },
      ],
      later: [
        { item: "CMMC L2 third-party assessment (C3PAO)", owner: "Joint", effort: "L", csf: "Govern", reduction: "DoD eligibility" },
        { item: "OT-specific threat-hunting program", owner: "VDA", effort: "L", csf: "Detect", reduction: "−12%" },
      ],
    },

    roi: { components: [
      { label: "Analyst hours saved", value: 234000, detail: "780 hours × $300 loaded SOC analyst rate" },
      { label: "Incidents contained pre-impact", value: 282000, detail: "2 high-severity × industry avg $141K (IBM CDB 2025)" },
      { label: "Compliance audit prep saved", value: 48000, detail: "CMMC evidence pack auto-generated" },
      { label: "Insurance premium hold", value: 48000, detail: "Carrier renewed +4% vs. mfg peer avg +22%" },
    ]},
  },

  lakeshore: {
    id: "lakeshore",
    name: "Lakeshore Financial",
    icon: Landmark,
    industry: "Financial Services",
    sites: 9,
    endpoints: 168,
    identities: 290,
    tier: "Tier 3 — full stack + DLP + PCI scope monitoring",
    period: { label: "Q1 2026 · Feb 1 – Apr 30", generated: "May 7, 2026", reportId: "SI-LAKESHORE-2026Q1" },
    quirk: "Reference deployment — every coverage source intentionally green for prospect demos.",
    cohortLabel: "31 community/regional financial institutions",
    mttd: "4m 02s", mttr: "28m 11s", mttdPeer: "11m", mttrPeer: "1h 38m",

    summary: [
      "Q1 saw 1 high-severity incident: a vendor-impersonation BEC targeting a payroll-change request, flagged by VDA's email rule on display-name versus envelope-from mismatch. Saved an estimated $94,200 wire transfer.",
      "Every monitored telemetry source is green — this is what a fully covered program looks like. Your cohort top-decile MTTR of 28 minutes is a number underwriters actively reward; your renewal landed flat against a peer cohort that averaged +14%.",
      "Heading into Q2: PCI DSS v4.0 future-dated requirements are now in effect. The FIDO2 hardware-key rollout for the 12 wire-authorization users is queued. We'll begin SWIFT CSP evidence collection if international wire becomes a requirement.",
    ],

    kpis: { ticketsHandled: 156, escalated: 28, confirmed: 6, criticalCaught: 1, autoResolvedPct: 84, openCritical: 0, coveragePct: 100, roiTotal: 942100, sevSplit: { crit: 1, high: 5, med: 28, low: 122 } },

    coverage: [
      { source: "Endpoint EDR (CrowdStrike)",  covered: 168, degraded: 0, uncovered: 0,   total: 168, last: "live" },
      { source: "Identity (Entra ID + AD)",    covered: 290, degraded: 0, uncovered: 0,   total: 290, last: "live" },
      { source: "M365 Audit",                  covered: 290, degraded: 0, uncovered: 0,   total: 290, last: "live" },
      { source: "Firewall Syslog",             covered: 9,   degraded: 0, uncovered: 0,   total: 9,   last: "live" },
      { source: "DNS Telemetry",               covered: 168, degraded: 0, uncovered: 0,   total: 168, last: "live" },
      { source: "DLP + PCI CDE Monitoring",    covered: 14,  degraded: 0, uncovered: 0,   total: 14,  last: "live" },
    ],

    nextActions: [
      { rank: 1, action: "FIDO2 hardware keys for 12 wire-authorization users", reduction: "−24% wire-fraud risk", effort: "S", mitre: "T1110", owner: "Customer" },
      { rank: 2, action: "PCI DSS v4.0 future-dated requirements evidence", reduction: "Compliance — required", effort: "M", mitre: "—", owner: "Joint" },
      { rank: 3, action: "Vendor-impersonation BEC simulation campaign", reduction: "−9% BEC success rate", effort: "S", mitre: "T1566", owner: "VDA" },
      { rank: 4, action: "GLBA Safeguards Rule annual review", reduction: "Compliance — required", effort: "S", mitre: "—", owner: "Joint" },
    ],

    compliance: {
      primary: { framework: "PCI DSS v4.0", coverage: 96, controlsEvidenced: 309, controlsTotal: 322,
        gaps: ["12.10.4 — IR test scope expansion", "11.4.5 — change-management automation", "10.4.1.1 — log review cadence proof"] },
      insurance: { readiness: 98, controls: [
        { name: "Phishing-resistant MFA", status: "partial", note: "FIDO2 in rollout for 12 wire users" },
        { name: "EDR coverage", status: "evidenced", note: "100% endpoints" },
        { name: "Immutable backups (3-2-1-1)", status: "evidenced", note: "12-month retention verified" },
        { name: "Tested IR plan", status: "evidenced", note: "Q1 tabletop + Q4 full simulation" },
        { name: "Vendor oversight", status: "evidenced", note: "All 23 fintech suppliers attested" },
      ]},
    },

    narrative: {
      id: "INC-2026-0067",
      title: "Stopped: $94,200 wire-fraud BEC against payroll",
      stoppedAt: "Initial Access — denied",
      timeline: [
        { t: "T+0:00", who: "Threat actor", what: "Email arrives from lookalike domain impersonating known vendor" },
        { t: "T+0:00", who: "VDA Email rule", what: "Display-name vs envelope-from mismatch detected; routed to L1" },
        { t: "T+0:18", who: "VDA SOC", what: "Confirmed lookalike (1-char swap on TLD); quarantined and reported" },
        { t: "T+0:42", who: "VDA SOC", what: "Briefed payroll team; added sender domain to deny-list tenant-wide" },
      ],
      whatCouldHaveHappened: "BEC wire requests average $94K when successful; recovery rates are below 30% if wire executes. Treasury reconciliation cycles compound the loss.",
      avoided: "Estimated $94,200 wire saved; reputational risk (regulator-reportable event) avoided.",
    },

    weeklyTickets: [
      { week: "W1", crit: 0, high: 0, med: 2, low: 8,  note: null },
      { week: "W2", crit: 0, high: 1, med: 2, low: 9,  note: null },
      { week: "W3", crit: 1, high: 1, med: 3, low: 10, note: "INC-0067: BEC wire saved" },
      { week: "W4", crit: 0, high: 0, med: 2, low: 9,  note: null },
      { week: "W5", crit: 0, high: 1, med: 2, low: 11, note: null },
      { week: "W6", crit: 0, high: 0, med: 3, low: 10, note: null },
      { week: "W7", crit: 0, high: 1, med: 2, low: 9,  note: null },
      { week: "W8", crit: 0, high: 0, med: 2, low: 8,  note: null },
      { week: "W9", crit: 0, high: 1, med: 3, low: 11, note: null },
      { week: "W10",crit: 0, high: 0, med: 2, low: 10, note: null },
      { week: "W11",crit: 0, high: 1, med: 2, low: 9,  note: null },
      { week: "W12",crit: 0, high: 0, med: 2, low: 9,  note: null },
      { week: "W13",crit: 0, high: 0, med: 1, low: 9,  note: null },
    ],

    benchmarks: [
      { metric: "MTTD",          you: 4.0,  peer: 11,  top: 3.8,  unit: "min", betterLow: true },
      { metric: "MTTR",          you: 28,   peer: 98,  top: 31,   unit: "min", betterLow: true },
      { metric: "Auto-resolved %", you: 84, peer: 67,  top: 86,   unit: "%",   betterLow: false },
      { metric: "Dwell-time",    you: 0.6,  peer: 2.8, top: 0.7,  unit: "days",betterLow: true },
      { metric: "BEC catch rate",you: 99,   peer: 91,  top: 99,   unit: "%",   betterLow: false },
    ],

    investigations: [
      { id: "INV-7912", t: "Feb 18 · 09:34 CST", source: "M365 — email",
        signal: "Vendor-impersonation lookalike domain targeting payroll inbox",
        enrichment: ["Display-name match: 'Acme Vendor LLC'", "Envelope-from: lookalike (acrne-vendor.com vs acme-vendor.com)", "Pattern: prior wire instructions, new account number", "Recipient: payroll change-of-account authority"],
        decision: "Quarantined, payroll briefed, sender domain blocked", decidedBy: "L2 Analyst (R. Mendez)", ttd: "0m 18s", ttr: "42m 04s", verdict: "Prevented" },
      { id: "INV-7889", t: "Feb 12 · 16:51 CST", source: "DLP — CDE",
        signal: "Cardholder data accessed from unsanctioned endpoint",
        enrichment: ["User: branch teller (in-scope role)", "Endpoint: out-of-policy (personal laptop, not CDE-tagged)", "Volume: 14 records — under threshold but unusual", "Time: end-of-day cleanup window"],
        decision: "User counseled, endpoint enrolled in CDE policy", decidedBy: "L1 Analyst (T. Lin)", ttd: "6m 41s", ttr: "1h 02m", verdict: "Contained" },
    ],

    roadmap: {
      now: [
        { item: "PCI DSS v4.0 future-dated requirements evidence", owner: "Joint", effort: "M", csf: "Govern", reduction: "Compliance", status: "in-progress" },
        { item: "FIDO2 hardware-key procurement (12 users)", owner: "Customer", effort: "S", csf: "Protect", reduction: "−24%", status: "not-started" },
      ],
      next: [
        { item: "FIDO2 rollout — wire-authorization users", owner: "Customer", effort: "S", csf: "Protect", reduction: "−24%" },
        { item: "Q2 BEC simulation campaign", owner: "VDA", effort: "S", csf: "Protect", reduction: "−9%" },
        { item: "GLBA Safeguards Rule annual review", owner: "Joint", effort: "S", csf: "Govern", reduction: "Compliance" },
      ],
      later: [
        { item: "SWIFT CSP self-assessment (if international wire pursued)", owner: "Joint", effort: "L", csf: "Govern", reduction: "Eligibility" },
        { item: "Insider-risk module for wire-authorization roles", owner: "VDA", effort: "M", csf: "Detect", reduction: "−7%" },
      ],
    },

    roi: { components: [
      { label: "Wire fraud prevented", value: 94200, detail: "BEC INC-0067 — vendor-impersonation caught at ingress" },
      { label: "Analyst hours saved", value: 522000, detail: "1,740 hours × $300 loaded SOC analyst rate" },
      { label: "Incidents contained pre-impact", value: 141000, detail: "1 high-severity × industry avg $141K (IBM CDB 2025)" },
      { label: "Insurance premium hold", value: 184900, detail: "Carrier renewed flat vs. fin-services peer avg +14%" },
    ]},
  },

  redwood: {
    id: "redwood",
    name: "Redwood Partners",
    icon: Scale,
    industry: "Professional Services (Law/Accounting)",
    sites: 1,
    endpoints: 94,
    identities: 112,
    tier: "Tier 1 — 24×7 EDR + M365 + Identity",
    period: { label: "Trailing 90d · Feb 7 – May 7", generated: "May 7, 2026", reportId: "SI-REDWOOD-T90D" },
    quirk: "Two attorney laptops on travel — last seen 04/29.",
    cohortLabel: "64 professional services firms (50–500 employees)",
    mttd: "9m 20s", mttr: "52m 18s", mttdPeer: "18m", mttrPeer: "2h 14m",

    summary: [
      "Trailing 90d was a quiet quarter: 0 high-severity incidents, 3 confirmed events all contained at first analyst touch. The headline was an OAuth consent-phishing attempt against a partner mailbox — revoked within 6 minutes of the consent grant; no email exfiltrated.",
      "A quiet quarter is the program working. The signal-to-noise ratio (89 alerts → 14 escalated → 3 confirmed) demonstrates that your Tier 1 telemetry is well-tuned to your environment. SIEM and DLP are the two coverage gaps — both are the Tier 2 conversation.",
      "Heading into Q3: the SOC 2 Type II evidence-pack refresh is queued for auditor fieldwork. The Tier 2 upgrade is the next program decision — adding centralized log management closes your largest visibility gap and brings insider-risk detection online.",
    ],

    kpis: { ticketsHandled: 89, escalated: 14, confirmed: 3, criticalCaught: 0, autoResolvedPct: 84, openCritical: 0, coveragePct: 68, roiTotal: 318000, sevSplit: { crit: 0, high: 2, med: 14, low: 73 } },

    coverage: [
      { source: "Endpoint EDR (Defender)",      covered: 92, degraded: 0, uncovered: 2,  total: 94, last: "live" },
      { source: "Identity (Entra ID)",          covered: 112, degraded: 0, uncovered: 0, total: 112, last: "live" },
      { source: "M365 Audit",                   covered: 112, degraded: 0, uncovered: 0, total: 112, last: "live" },
      { source: "SIEM / Centralized Logs",      covered: 0,   degraded: 0, uncovered: 94, total: 94, last: "—" },
      { source: "DLP",                          covered: 0,   degraded: 0, uncovered: 94, total: 94, last: "—" },
      { source: "Backup Attestation",           covered: 94,  degraded: 0, uncovered: 0,  total: 94, last: "1h ago" },
    ],

    nextActions: [
      { rank: 1, action: "SOC 2 Type II evidence-pack refresh (auditor fieldwork)", reduction: "Compliance — required", effort: "M", mitre: "—", owner: "Joint" },
      { rank: 2, action: "Tier 2 upgrade — add SIEM + centralized log management", reduction: "−22% blind-spot exposure", effort: "L", mitre: "—", owner: "Customer" },
      { rank: 3, action: "OAuth consent-phishing simulation for partner cohort", reduction: "−11% consent-phishing risk", effort: "S", mitre: "T1528", owner: "VDA" },
      { rank: 4, action: "Insider-risk module rollout (departing-attorney scenarios)", reduction: "−8% data-loss risk", effort: "M", mitre: "T1530", owner: "Joint" },
    ],

    compliance: {
      primary: { framework: "SOC 2 Type II", coverage: 88, controlsEvidenced: 47, controlsTotal: 53,
        gaps: ["CC7.2 — log centralization (in scope, in-progress)", "CC6.7 — DLP scope expansion", "CC9.2 — vendor management evidence cadence"] },
      insurance: { readiness: 84, controls: [
        { name: "MFA enforcement", status: "evidenced", note: "100% across all roles" },
        { name: "EDR coverage", status: "evidenced", note: "97.9% endpoints (2 travel laptops pending sync)" },
        { name: "Immutable backups (3-2-1-1)", status: "evidenced", note: "Verified 04/29/2026" },
        { name: "Tested IR plan", status: "partial", note: "Tabletop scheduled for Q3" },
        { name: "Vendor oversight", status: "evidenced", note: "16/18 vendors attested — 2 in renewal" },
      ]},
    },

    narrative: {
      id: "INC-2026-0042",
      title: "Revoked: OAuth consent-phishing on partner mailbox",
      stoppedAt: "Initial Access (T1528)",
      timeline: [
        { t: "T+0:00",  who: "Threat actor", what: "Consent-phish app 'Innocent Lookup' requests Mail.ReadWrite scope" },
        { t: "T+1:42",  who: "Partner",     what: "Grants consent (mistakenly believing it was IT-issued tool)" },
        { t: "T+5:28",  who: "VDA SOC",     what: "M365 audit detects consent grant matching known phishing pattern" },
        { t: "T+6:03",  who: "VDA SOC",     what: "App revoked tenant-wide; mail rules audited; no exfiltration confirmed" },
      ],
      whatCouldHaveHappened: "OAuth consent-phishing is the fastest-growing attorney-targeted attack of 2026. Partner mailbox compromise often pivots to client-confidential email exfiltration within hours.",
      avoided: "Estimated $480K – $1.1M in client-confidentiality breach exposure avoided; bar reportable event averted.",
    },

    weeklyTickets: [
      { week: "W1", crit: 0, high: 0, med: 1, low: 5, note: null },
      { week: "W2", crit: 0, high: 0, med: 1, low: 6, note: null },
      { week: "W3", crit: 0, high: 1, med: 1, low: 6, note: null },
      { week: "W4", crit: 0, high: 0, med: 1, low: 5, note: null },
      { week: "W5", crit: 0, high: 0, med: 1, low: 7, note: null },
      { week: "W6", crit: 0, high: 1, med: 2, low: 5, note: "INC-0042: OAuth consent revoked" },
      { week: "W7", crit: 0, high: 0, med: 1, low: 6, note: null },
      { week: "W8", crit: 0, high: 0, med: 1, low: 5, note: null },
      { week: "W9", crit: 0, high: 0, med: 1, low: 6, note: null },
      { week: "W10",crit: 0, high: 0, med: 1, low: 5, note: null },
      { week: "W11",crit: 0, high: 0, med: 1, low: 6, note: null },
      { week: "W12",crit: 0, high: 0, med: 1, low: 6, note: null },
      { week: "W13",crit: 0, high: 0, med: 1, low: 5, note: null },
    ],

    benchmarks: [
      { metric: "MTTD",            you: 9.3,  peer: 18,  top: 7,    unit: "min", betterLow: true },
      { metric: "MTTR",            you: 52,   peer: 134, top: 47,   unit: "min", betterLow: true },
      { metric: "Auto-resolved %", you: 84,   peer: 71,  top: 88,   unit: "%",   betterLow: false },
      { metric: "Dwell-time",      you: 1.4,  peer: 4.6, top: 0.8,  unit: "days",betterLow: true },
      { metric: "Phish report rate",you: 38,  peer: 22,  top: 49,   unit: "%",   betterLow: false },
    ],

    investigations: [
      { id: "INV-6841", t: "Mar 19 · 14:08 PST", source: "M365 — OAuth audit",
        signal: "Consent grant: 'Innocent Lookup' app requesting Mail.ReadWrite",
        enrichment: ["App publisher: unverified", "App age: 6 days", "User: senior partner mailbox", "Pattern match: known consent-phishing wave (2026 spring cluster)"],
        decision: "App revoked tenant-wide; mail rules audited", decidedBy: "L1 Analyst (T. Lin)", ttd: "5m 28s", ttr: "6m 03s", verdict: "Prevented" },
      { id: "INV-6798", t: "Mar 12 · 11:24 PST", source: "EDR — Defender",
        signal: "PowerShell anomaly on attorney laptop",
        enrichment: ["Process: powershell.exe with encoded args", "Parent: outlook.exe (suspicious chain)", "User context: associate attorney, no scripting role", "Recent activity: opened email with macro doc"],
        decision: "Host isolated; macro source identified and quarantined", decidedBy: "L1 Analyst (M. Doyle)", ttd: "12m 14s", ttr: "1h 18m", verdict: "Contained" },
    ],

    roadmap: {
      now: [
        { item: "SOC 2 Type II evidence-pack refresh", owner: "Joint", effort: "M", csf: "Govern", reduction: "Compliance", status: "in-progress" },
        { item: "Q3 tabletop exercise scheduling", owner: "VDA", effort: "S", csf: "Respond", reduction: "Insurance", status: "not-started" },
      ],
      next: [
        { item: "Tier 2 upgrade — SIEM + centralized log management", owner: "Customer", effort: "L", csf: "Detect", reduction: "−22%" },
        { item: "OAuth consent-phishing simulation campaign", owner: "VDA", effort: "S", csf: "Protect", reduction: "−11%" },
        { item: "Vendor attestation refresh — 2 outstanding", owner: "Joint", effort: "S", csf: "Govern", reduction: "Compliance" },
      ],
      later: [
        { item: "Insider-risk module — departing-attorney scenarios", owner: "Joint", effort: "M", csf: "Detect", reduction: "−8%" },
        { item: "Client-confidentiality DLP module", owner: "VDA", effort: "M", csf: "Protect", reduction: "−6%" },
      ],
    },

    roi: { components: [
      { label: "Client-confidentiality breach prevented", value: 480000, detail: "OAuth consent-phish caught at 6m post-grant" },
      { label: "Analyst hours saved", value: 156000, detail: "520 hours × $300 loaded SOC analyst rate" },
      { label: "Compliance audit prep saved", value: 36000, detail: "SOC 2 Type II evidence pack auto-generated" },
      { label: "Insurance premium hold", value: 18000, detail: "Carrier renewed flat vs. prof-services peer avg +9%" },
    ]},
  },
};

// MITRE ATT&CK matrix — coverage tier per technique
const MITRE_TACTICS = ["Initial Access", "Execution", "Persistence", "Priv Esc", "Defense Evasion", "Cred Access", "Discovery", "Lateral Mvmt", "Collection", "C2", "Exfiltration", "Impact"];
const MITRE_DATA = [
  { id: "T1566", name: "Phishing", tactic: "Initial Access", coverage: "strong" },
  { id: "T1190", name: "Exploit Public App", tactic: "Initial Access", coverage: "strong" },
  { id: "T1078", name: "Valid Accounts", tactic: "Initial Access", coverage: "hunt-validated" },
  { id: "T1059", name: "Cmd & Scripting", tactic: "Execution", coverage: "strong" },
  { id: "T1053", name: "Scheduled Task", tactic: "Execution", coverage: "strong" },
  { id: "T1547", name: "Boot Autostart", tactic: "Persistence", coverage: "partial" },
  { id: "T1098", name: "Account Manipulation", tactic: "Persistence", coverage: "strong" },
  { id: "T1068", name: "Exploit for Priv Esc", tactic: "Priv Esc", coverage: "strong" },
  { id: "T1027", name: "Obfuscated Files", tactic: "Defense Evasion", coverage: "partial" },
  { id: "T1562", name: "Impair Defenses", tactic: "Defense Evasion", coverage: "strong" },
  { id: "T1110", name: "Brute Force", tactic: "Cred Access", coverage: "hunt-validated" },
  { id: "T1555", name: "Cred from Stores", tactic: "Cred Access", coverage: "strong" },
  { id: "T1087", name: "Account Discovery", tactic: "Discovery", coverage: "partial" },
  { id: "T1021", name: "Remote Services", tactic: "Lateral Mvmt", coverage: "partial" },
  { id: "T1005", name: "Data from Local", tactic: "Collection", coverage: "strong" },
  { id: "T1071", name: "App Layer Protocol", tactic: "C2", coverage: "partial" },
  { id: "T1048", name: "Exfil Alt Proto", tactic: "Exfiltration", coverage: "partial" },
  { id: "T1528", name: "Token Theft (OAuth)", tactic: "Cred Access", coverage: "strong" },
  { id: "T1486", name: "Data Encrypted", tactic: "Impact", coverage: "strong" },
];

/* ============================================================
 * SVG MICRO-CHARTS
 * ============================================================ */

const Sparkline = ({ data, w = 120, h = 32, color = T.orange, area = false }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * w, y: h - ((v - min) / range) * (h - 4) - 2 }));
  const line = pts.map(p => `${p.x},${p.y}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {area && <polygon points={`0,${h} ${line} ${w},${h}`} fill={`${color}12`} />}
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={2.5} fill={color} />
    </svg>
  );
};

const StackedSeverityBars = ({ data, w = "100%", h = 140 }) => {
  const totals = data.map(d => d.crit + d.high + d.med + d.low);
  const max = Math.max(...totals);
  return (
    <div style={{ width: w }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: h, position: "relative" }}>
        {data.map((d, i) => {
          const total = d.crit + d.high + d.med + d.low;
          const totalH = (total / max) * (h - 16);
          const seg = (n) => totalH * (n / total) || 0;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
              {d.note && <div style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", width: 6, height: 6, transform: "translateX(-50%) rotate(45deg)", background: T.orange, border: `1px solid ${T.bgDeep}` }} title={d.note} />}
              <div style={{ width: "100%", maxWidth: 28, display: "flex", flexDirection: "column-reverse", height: totalH, transition: "height 0.5s ease" }}>
                {d.low > 0 && <div style={{ background: T.sevLow, height: seg(d.low) }} />}
                {d.med > 0 && <div style={{ background: T.sevMed, height: seg(d.med) }} />}
                {d.high > 0 && <div style={{ background: T.sevHigh, height: seg(d.high) }} />}
                {d.crit > 0 && <div style={{ background: T.sevCrit, height: seg(d.crit), borderRadius: "3px 3px 0 0" }} />}
              </div>
              <span style={{ fontFamily: T.fontMono, fontSize: 8, color: T.inkMuted }}>{d.week}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 8, fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, flexWrap: "wrap" }}>
        {[
          ["CRIT", T.sevCrit], ["HIGH", T.sevHigh], ["MED", T.sevMed], ["LOW", T.sevLow],
        ].map(([label, c]) => (
          <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, background: c, borderRadius: 2 }} />{label}
          </span>
        ))}
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, background: T.orange, transform: "rotate(45deg)" }} /> Notable event (hover bar)
        </span>
      </div>
    </div>
  );
};

const BulletBar = ({ value, peer, top, max, betterLow, unit }) => {
  // navy thick bar = customer; thin grey vertical = peer median; orange tick = top decile
  const fullW = 100;
  const v = (value / max) * fullW;
  const p = (peer / max) * fullW;
  const t = (top / max) * fullW;
  const isWin = betterLow ? value <= peer : value >= peer;
  return (
    <div style={{ position: "relative", height: 18, background: T.bgElevated, borderRadius: 3 }}>
      <div style={{ position: "absolute", left: 0, top: 4, height: 10, width: `${Math.min(v, fullW)}%`, background: isWin ? T.steel : T.slaWarn, borderRadius: 2, transition: "width 0.6s ease" }} />
      <div style={{ position: "absolute", left: `${Math.min(p, fullW)}%`, top: 0, width: 1.5, height: 18, background: T.inkMuted }} title={`Peer median: ${peer}${unit}`} />
      <div style={{ position: "absolute", left: `${Math.min(t, fullW)}%`, top: -2, width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `5px solid ${T.orange}` }} title={`Top decile: ${top}${unit}`} />
    </div>
  );
};

const HorizBar = ({ value, max, color, height = 6 }) => (
  <div style={{ width: "100%", height, background: `${color}18`, borderRadius: height / 2 }}>
    <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", background: color, borderRadius: height / 2, transition: "width 0.6s ease" }} />
  </div>
);

const StackedHorizBar = ({ covered, degraded, uncovered, total, height = 10 }) => {
  const c = (covered / total) * 100;
  const d = (degraded / total) * 100;
  const u = (uncovered / total) * 100;
  return (
    <div style={{ width: "100%", height, display: "flex", borderRadius: height / 2, overflow: "hidden", background: T.bgElevated }}>
      {covered > 0 && <div style={{ width: `${c}%`, background: T.steel, transition: "width 0.6s ease" }} />}
      {degraded > 0 && <div style={{ width: `${d}%`, background: T.slaWarn, transition: "width 0.6s ease" }} />}
      {uncovered > 0 && <div style={{ width: `${u}%`, background: T.orange, transition: "width 0.6s ease" }} />}
    </div>
  );
};

/* ============================================================
 * SHARED COMPONENTS
 * ============================================================ */

const Card = ({ children, style: s = {} }) => (
  <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 8, padding: "16px 18px", ...s }}>{children}</div>
);

const Label = ({ children, info, infoSource }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
    <span style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700 }}>{children}</span>
    {info && <InfoDot id={`l-${children}`} tip={info} source={infoSource} />}
  </div>
);

const Section = ({ num, title, right }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, marginTop: 28, gap: 12, flexWrap: "wrap" }}>
    <div>
      <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.2em", marginBottom: 2 }}>{num}</div>
      <div style={{ fontFamily: T.fontDisplay, fontSize: 22, color: T.ink, fontWeight: 700 }}>{title}</div>
    </div>
    {right}
  </div>
);

const KPI = ({ label, value, sub, icon: Icon, trend, dir, color = T.orange, info, infoSource }) => (
  <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 8, padding: "16px 14px", position: "relative", overflow: "hidden", transition: "background 200ms ease-out" }}>
    <div style={{ position: "absolute", top: 10, right: 10, opacity: 0.10 }}><Icon size={32} color={color} /></div>
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
      <span style={{ fontFamily: T.fontMono, fontSize: 8, color: T.inkMuted, letterSpacing: "0.14em", textTransform: "uppercase" }}>{label}</span>
      {info && <InfoDot id={`kpi-${label}`} tip={info} source={infoSource} />}
    </div>
    <div style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 700, color: T.ink, lineHeight: 1 }}>{value}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
      {trend && <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontFamily: T.fontMono, fontSize: 9, fontWeight: 700, color: dir === "up" ? T.slaOk : dir === "down" ? T.slaBreach : T.inkMuted }}>
        {dir === "up" ? <ArrowUpRight size={10} /> : dir === "down" ? <ArrowDownRight size={10} /> : <Minus size={10} />}{trend}
      </span>}
      {sub && <span style={{ fontFamily: T.fontBody, fontSize: 11, color: T.inkMuted }}>{sub}</span>}
    </div>
  </div>
);

const SevTag = ({ sev }) => {
  const c = { critical: T.sevCrit, high: T.sevHigh, medium: T.sevMed, low: T.sevLow }[sev] || T.steel;
  return <span style={{ display: "inline-block", padding: "2px 6px", borderRadius: 3, fontFamily: T.fontMono, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", background: `${c}18`, color: c, border: `1px solid ${c}35` }}>{sev}</span>;
};

const StatusPip = ({ status }) => {
  const colors = { evidenced: T.slaOk, partial: T.slaWarn, gap: T.slaBreach };
  const labels = { evidenced: "Evidenced", partial: "Partial", gap: "Gap" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: T.fontMono, fontSize: 9, color: colors[status], fontWeight: 700, textTransform: "uppercase" }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: colors[status] }} />{labels[status]}
    </span>
  );
};

/* ============================================================
 * PDF EXPORT — print-styled HTML report opened in a new tab
 *
 * Why this approach: the prior jsPDF + doc.save() path silently failed in
 * sandboxes that block dynamic <script> injection or programmatic downloads.
 * The HTML-in-new-window pattern works in every modern browser, on every
 * device, behind every popup blocker (Blob fallback). User saves as PDF via
 * the browser's native print-to-PDF dialog (Cmd-P → Save as PDF).
 *
 * Layout follows MBB executive memo conventions:
 *   - Cover: customer + period + analyst, single-line headline
 *   - Section 01: The Verdict — single-sentence answer first (pyramid principle)
 *   - Section 02: What We Found — three supporting points, each with one number
 *   - Section 03: The Evidence — KPIs + value delivered + peer position
 *   - Section 04: What We Recommend — ranked actions with ownership
 *   - Section 05: The Roadmap — Now / Next / Later
 *   - Sign-off: prepared by, reviewed for, disclaimer
 *
 * No icons in the printed document. White space and weight do the work,
 * not decoration.
 * ============================================================ */

const buildReportHTML = (customer, wave = 2) => {
  const c = customer;
  // Split a paragraph into [first sentence, rest] where the first period
  // followed by a space and a capital letter ends the sentence. This skips
  // over abbreviations like "§164.308(a)(5)" and decimals.
  const splitFirstSentence = (text) => {
    const m = text.match(/^([\s\S]*?[.!?])\s+([A-Z][\s\S]*)$/);
    if (!m) return [text.trim(), ""];
    return [m[1].trim(), m[2].trim()];
  };

  const [headline] = splitFirstSentence(c.summary[0]);
  const supportingPoints = c.summary.slice(0, 3).map((p) => splitFirstSentence(p));

  const fmt$ = (n) => "$" + n.toLocaleString();
  const cohortRank = (b) => {
    if (b.betterLow) {
      if (b.you <= b.top * 1.1) return "Top decile";
      if (b.you <= b.peer) return "Above median";
      return "Below median";
    }
    if (b.you >= b.top * 0.95) return "Top decile";
    if (b.you >= b.peer) return "Above median";
    return "Below median";
  };

  // Three lead numbers for the executive summary
  const leadStat1 = { value: c.kpis.criticalCaught, label: "critical incidents caught and contained pre-impact" };
  const leadStat2 = { value: c.mttr, label: `mean time to resolve · peer median ${c.mttrPeer}` };
  const leadStat3 = { value: fmt$(c.kpis.roiTotal), label: "in avoided cost delivered this period" };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sentry Insights · ${c.name} · ${c.period.label}</title>
<style>
  @page { size: letter; margin: 0.7in; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
    background: #FAFAF7;
    color: #1A2E47;
    font-family: Calibri, "Segoe UI", system-ui, sans-serif;
    line-height: 1.55;
    font-size: 11pt;
  }
  .page {
    max-width: 7.1in;
    margin: 0 auto;
    padding: 0.4in 0;
    background: #FAFAF7;
  }

  /* ── Top control bar (hidden in print) ─────────────────── */
  .controls {
    position: sticky; top: 0; z-index: 100;
    background: #0A1628; color: #FAFAF7;
    padding: 12px 24px;
    display: flex; justify-content: space-between; align-items: center;
    box-shadow: 0 2px 12px rgba(10,22,40,0.18);
  }
  .controls-brand {
    font-family: Georgia, serif; font-size: 14px; font-weight: 700;
    letter-spacing: 0.02em;
  }
  .controls-brand small {
    font-family: Consolas, monospace; font-size: 9px;
    letter-spacing: 0.18em; color: #D2691E; margin-left: 10px;
    background: rgba(210,105,30,0.14); padding: 2px 7px; border-radius: 3px;
  }
  .controls-actions { display: flex; gap: 8px; }
  .controls button {
    background: #D2691E; color: #FFFFFF; border: none;
    padding: 8px 18px; border-radius: 4px; cursor: pointer;
    font-family: Calibri, "Segoe UI", sans-serif; font-size: 13px; font-weight: 600;
    letter-spacing: 0.02em;
    transition: background 150ms ease-out;
  }
  .controls button:hover { background: #B85916; }
  .controls button.secondary { background: transparent; border: 1px solid #2A3E57; color: #A8B8C8; }
  .controls button.secondary:hover { background: #122238; color: #E8EEF4; }
  .controls-hint {
    font-family: Consolas, monospace; font-size: 10px;
    color: #6B7D91; letter-spacing: 0.08em;
  }
  @media print {
    .controls { display: none !important; }
    .page { padding: 0; }
  }

  /* ── Cover ──────────────────────────────────────────────── */
  .cover {
    padding: 0 0 28pt 0;
    border-bottom: 2px solid #1A2E47;
    margin-bottom: 36pt;
    page-break-after: always;
  }
  .cover-band {
    background: #0A1628;
    color: #FAFAF7;
    padding: 22pt 24pt 18pt;
    margin-bottom: 28pt;
  }
  .cover-eyebrow {
    font-family: Consolas, "Courier New", monospace;
    font-size: 10pt;
    letter-spacing: 0.28em;
    color: #D2691E;
    font-weight: 700;
    margin-bottom: 4pt;
  }
  .cover-brand {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 22pt;
    font-weight: 400;
    letter-spacing: -0.01em;
    color: #FAFAF7;
  }
  .cover-customer {
    font-family: Georgia, serif;
    font-size: 38pt;
    font-weight: 400;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: #1A2E47;
    margin: 18pt 0 8pt;
  }
  .cover-period {
    font-family: Georgia, serif;
    font-style: italic;
    font-size: 14pt;
    color: #5A6A7D;
    margin-bottom: 22pt;
  }
  .cover-orange-rule {
    width: 80pt; height: 2pt;
    background: #D2691E;
    margin-bottom: 22pt;
  }
  .cover-meta {
    padding-top: 18pt;
    border-top: 1px solid #D8DCE2;
    font-size: 0;  /* collapse whitespace between inline-blocks */
  }
  .cover-meta-item {
    display: inline-block;
    vertical-align: top;
    margin-right: 32pt;
    margin-bottom: 8pt;
    font-size: 11pt;
  }
  .cover-meta-item:last-child { margin-right: 0; }
  .cover-meta-label {
    font-family: Consolas, monospace;
    font-size: 8pt;
    letter-spacing: 0.18em;
    color: #8A97A5;
    font-weight: 700;
    margin-bottom: 4pt;
  }
  .cover-meta-value {
    font-family: Calibri, sans-serif;
    font-size: 12pt;
    color: #1A2E47;
    font-weight: 600;
  }
  .cover-prepared {
    margin-top: 36pt;
    display: flex; gap: 14pt; align-items: center;
  }
  .cover-badge {
    width: 42pt; height: 42pt; border-radius: 50%;
    background: #FBF0E6; color: #D2691E;
    display: flex; align-items: center; justify-content: center;
    font-family: Consolas, monospace; font-size: 13pt; font-weight: 700;
    flex-shrink: 0;
  }
  .cover-prepared-label {
    font-family: Consolas, monospace; font-size: 8pt;
    letter-spacing: 0.22em; color: #8A97A5; font-weight: 700;
  }
  .cover-prepared-name {
    font-size: 13pt; font-weight: 600; color: #1A2E47; margin-top: 2pt;
  }
  .cover-prepared-meta {
    font-family: Consolas, monospace; font-size: 9pt; color: #8A97A5;
    letter-spacing: 0.04em; margin-top: 2pt;
  }

  /* ── Section ────────────────────────────────────────────── */
  section {
    margin-bottom: 32pt;
    page-break-inside: avoid;
  }
  .section-eyebrow {
    font-family: Consolas, monospace;
    font-size: 9pt;
    letter-spacing: 0.24em;
    color: #D2691E;
    font-weight: 700;
    margin-bottom: 4pt;
  }
  .section-eyebrow .num {
    background: #D2691E; color: #FAFAF7;
    padding: 2pt 7pt; border-radius: 2pt;
    margin-right: 10pt;
  }
  h2 {
    font-family: Georgia, serif;
    font-size: 22pt;
    font-weight: 400;
    letter-spacing: -0.01em;
    color: #1A2E47;
    margin-bottom: 4pt;
    line-height: 1.15;
    page-break-after: avoid;
  }
  .h2-rule {
    width: 60pt; height: 1.5pt;
    background: #D2691E;
    margin-bottom: 18pt;
  }
  h3 {
    font-family: Georgia, serif;
    font-size: 14pt;
    font-weight: 600;
    color: #1A2E47;
    margin-bottom: 8pt;
    page-break-after: avoid;
  }

  /* ── Verdict ────────────────────────────────────────────── */
  .verdict {
    background: #FFFFFF;
    border: 1px solid #D8DCE2;
    border-left: 4pt solid #D2691E;
    padding: 24pt 28pt;
    margin-bottom: 22pt;
    page-break-inside: avoid;
  }
  .verdict-headline {
    font-family: Georgia, serif;
    font-size: 18pt;
    line-height: 1.35;
    color: #1A2E47;
    font-weight: 400;
    letter-spacing: -0.005em;
  }
  .verdict-headline em {
    color: #D2691E;
    font-style: normal;
    font-weight: 600;
  }
  .verdict-detail {
    font-family: Calibri, sans-serif;
    font-size: 11pt;
    color: #5A6A7D;
    line-height: 1.6;
    margin-top: 12pt;
  }

  /* ── Lead stats ─────────────────────────────────────────── */
  .lead-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14pt;
    margin: 22pt 0;
    page-break-inside: avoid;
  }
  .lead-stat {
    background: #FFFFFF;
    border: 1px solid #D8DCE2;
    padding: 18pt 16pt;
    text-align: left;
  }
  .lead-stat-value {
    font-family: Georgia, serif;
    font-size: 28pt;
    font-weight: 400;
    color: #D2691E;
    line-height: 1;
    margin-bottom: 6pt;
  }
  .lead-stat-label {
    font-family: Calibri, sans-serif;
    font-size: 10pt;
    color: #5A6A7D;
    line-height: 1.45;
  }

  /* ── Supporting points ──────────────────────────────────── */
  .supporting {
    margin-bottom: 22pt;
  }
  .supporting-point {
    display: flex;
    gap: 18pt;
    padding: 14pt 0;
    border-bottom: 1px solid #D8DCE2;
    page-break-inside: avoid;
  }
  .supporting-point:last-child { border-bottom: none; }
  .supporting-num {
    flex: 0 0 auto;
    font-family: Georgia, serif;
    font-size: 26pt;
    font-weight: 400;
    color: #D2691E;
    line-height: 1;
    width: 36pt;
  }
  .supporting-body {
    flex: 1;
  }
  .supporting-headline {
    font-family: Georgia, serif;
    font-size: 13pt;
    font-weight: 600;
    color: #1A2E47;
    line-height: 1.35;
    margin-bottom: 6pt;
  }
  .supporting-detail {
    font-family: Calibri, sans-serif;
    font-size: 11pt;
    color: #5A6A7D;
    line-height: 1.55;
  }

  /* ── KPI grid ───────────────────────────────────────────── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: #D8DCE2;
    border: 1px solid #D8DCE2;
    margin-bottom: 22pt;
  }
  .kpi-cell {
    background: #FFFFFF;
    padding: 14pt 14pt 12pt;
  }
  .kpi-label {
    font-family: Consolas, monospace;
    font-size: 7.5pt;
    letter-spacing: 0.16em;
    color: #8A97A5;
    font-weight: 700;
    margin-bottom: 8pt;
  }
  .kpi-value {
    font-family: Georgia, serif;
    font-size: 20pt;
    color: #1A2E47;
    font-weight: 400;
    line-height: 1;
    margin-bottom: 4pt;
  }
  .kpi-sub {
    font-family: Calibri, sans-serif;
    font-size: 9pt;
    color: #5A6A7D;
  }

  /* ── Value delivered table ──────────────────────────────── */
  .value-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14pt;
    page-break-inside: avoid;
  }
  .value-table th {
    text-align: left;
    background: #1A2E47;
    color: #FAFAF7;
    font-family: Consolas, monospace;
    font-size: 9pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding: 8pt 12pt;
    font-weight: 700;
  }
  .value-table th.right { text-align: right; }
  .value-table td {
    padding: 10pt 12pt;
    border-bottom: 1px solid #D8DCE2;
    background: #FFFFFF;
    font-family: Calibri, sans-serif;
    font-size: 11pt;
    color: #1A2E47;
    vertical-align: top;
  }
  .value-table td.value {
    text-align: right;
    font-family: Consolas, monospace;
    font-weight: 700;
    color: #D2691E;
  }
  .value-table td.method {
    font-family: Calibri, sans-serif;
    font-size: 10pt;
    color: #5A6A7D;
    font-style: italic;
  }
  .value-table tfoot td {
    background: #FBF0E6;
    font-weight: 700;
    border-top: 2px solid #1A2E47;
  }

  /* ── Peer position ──────────────────────────────────────── */
  .peer-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14pt;
    page-break-inside: avoid;
  }
  .peer-table th {
    text-align: left;
    background: #1A2E47;
    color: #FAFAF7;
    font-family: Consolas, monospace;
    font-size: 9pt;
    letter-spacing: 0.14em;
    padding: 8pt 12pt;
    text-transform: uppercase;
  }
  .peer-table th.right { text-align: right; }
  .peer-table td {
    padding: 10pt 12pt;
    border-bottom: 1px solid #D8DCE2;
    background: #FFFFFF;
    font-family: Calibri, sans-serif;
    font-size: 11pt;
    vertical-align: middle;
  }
  .peer-table td.metric { color: #1A2E47; font-weight: 600; }
  .peer-table td.you {
    text-align: right;
    font-family: Consolas, monospace;
    color: #D2691E;
    font-weight: 700;
    font-size: 12pt;
  }
  .peer-table td.peer-num {
    text-align: right;
    font-family: Consolas, monospace;
    color: #5A6A7D;
  }
  .peer-table td.rank {
    font-family: Consolas, monospace;
    font-size: 9pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-weight: 700;
  }
  .rank-top { color: #5B8F6F; }
  .rank-above { color: #6B93B8; }
  .rank-below { color: #D4A574; }

  /* ── Recommendation list ────────────────────────────────── */
  .reco-list {
    list-style: none;
    margin-bottom: 14pt;
  }
  .reco-item {
    display: flex;
    gap: 14pt;
    padding: 12pt 0;
    border-bottom: 1px solid #D8DCE2;
    page-break-inside: avoid;
  }
  .reco-item:last-child { border-bottom: none; }
  .reco-item.priority {
    border-left: 3pt solid #D2691E;
    padding-left: 14pt;
    margin-left: -14pt;
    background: #FBF0E6;
  }
  .reco-num {
    flex: 0 0 auto;
    width: 26pt; height: 26pt;
    border-radius: 50%;
    background: #FBF0E6;
    color: #D2691E;
    display: flex; align-items: center; justify-content: center;
    font-family: Consolas, monospace; font-size: 11pt; font-weight: 700;
  }
  .reco-body { flex: 1; }
  .reco-action {
    font-family: Calibri, sans-serif;
    font-size: 12pt;
    color: #1A2E47;
    margin-bottom: 4pt;
  }
  .reco-meta {
    font-family: Consolas, monospace;
    font-size: 9pt;
    color: #8A97A5;
    letter-spacing: 0.04em;
  }
  .reco-meta .reduction { color: #D2691E; font-weight: 700; }
  .reco-meta .owner-vda { color: #D2691E; font-weight: 700; }
  .reco-meta .owner-customer { color: #6B93B8; font-weight: 700; }
  .reco-meta .owner-joint { color: #5B8F6F; font-weight: 700; }

  /* ── Roadmap ────────────────────────────────────────────── */
  .roadmap-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12pt;
    margin-bottom: 14pt;
  }
  .roadmap-lane {
    background: #FFFFFF;
    border: 1px solid #D8DCE2;
    page-break-inside: avoid;
  }
  .roadmap-lane-header {
    padding: 8pt 14pt;
    color: #FFFFFF;
    font-family: Consolas, monospace;
    font-size: 9pt;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-weight: 700;
  }
  .roadmap-lane-now { background: #D2691E; }
  .roadmap-lane-next { background: #6B93B8; }
  .roadmap-lane-later { background: #1A2E47; }
  .roadmap-lane-body { padding: 12pt 14pt; }
  .roadmap-item {
    margin-bottom: 12pt;
    padding-bottom: 12pt;
    border-bottom: 1px solid #D8DCE2;
  }
  .roadmap-item:last-child { border: none; margin-bottom: 0; padding-bottom: 0; }
  .roadmap-item-text {
    font-family: Calibri, sans-serif;
    font-size: 10.5pt;
    color: #1A2E47;
    line-height: 1.45;
    margin-bottom: 4pt;
  }
  .roadmap-item-meta {
    font-family: Consolas, monospace;
    font-size: 8pt;
    color: #8A97A5;
    letter-spacing: 0.04em;
  }

  /* ── Sign-off ───────────────────────────────────────────── */
  .signoff {
    margin-top: 36pt;
    padding-top: 24pt;
    border-top: 2px solid #1A2E47;
    page-break-inside: avoid;
  }
  .signoff-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 36pt;
    margin-bottom: 28pt;
  }
  .signoff-block { }
  .signoff-label {
    font-family: Consolas, monospace;
    font-size: 8pt;
    letter-spacing: 0.22em;
    color: #8A97A5;
    font-weight: 700;
    margin-bottom: 6pt;
    text-transform: uppercase;
  }
  .signoff-name {
    font-family: Calibri, sans-serif;
    font-size: 12pt;
    color: #1A2E47;
    font-weight: 600;
    margin-bottom: 18pt;
  }
  .signoff-line {
    border-top: 1px solid #1A2E47;
    margin-bottom: 4pt;
  }
  .signoff-meta {
    font-family: Consolas, monospace;
    font-size: 8pt;
    color: #8A97A5;
    font-style: italic;
  }
  .disclaimer {
    font-family: Calibri, sans-serif;
    font-size: 8.5pt;
    color: #8A97A5;
    font-style: italic;
    line-height: 1.6;
    padding-top: 16pt;
    border-top: 1px solid #D8DCE2;
  }

  /* ── Footer ─────────────────────────────────────────────── */
  .footer-strip {
    margin-top: 28pt;
    padding-top: 14pt;
    border-top: 1px solid #D8DCE2;
    display: flex;
    justify-content: space-between;
    font-family: Consolas, monospace;
    font-size: 8pt;
    letter-spacing: 0.14em;
    color: #8A97A5;
    text-transform: uppercase;
  }
</style>
</head>
<body>

<div class="controls">
  <div class="controls-brand">Sentry <small>INSIGHTS</small></div>
  <div class="controls-hint">Press Cmd-P (Mac) or Ctrl-P (Windows) to save as PDF</div>
  <div class="controls-actions">
    <button class="secondary" onclick="window.close()">Close</button>
    <button onclick="window.print()">Save as PDF →</button>
  </div>
</div>

<div class="page">

  <!-- ── COVER ── -->
  <div class="cover">
    <div class="cover-band">
      <div class="cover-eyebrow">SENTRY · INSIGHTS${wave === 1 ? " · STANDARD" : " · FULL"}</div>
      <div class="cover-brand">Quarterly Security Report</div>
    </div>

    <div class="cover-customer">${escapeHTML(c.name)}</div>
    <div class="cover-period">${escapeHTML(c.period.label)}</div>
    <div class="cover-orange-rule"></div>

    <div class="cover-meta">
      <div class="cover-meta-item">
        <div class="cover-meta-label">INDUSTRY</div>
        <div class="cover-meta-value">${escapeHTML(c.industry)}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">ENDPOINTS</div>
        <div class="cover-meta-value">${c.endpoints.toLocaleString()}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">SITES</div>
        <div class="cover-meta-value">${c.sites}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">SERVICE TIER</div>
        <div class="cover-meta-value">${escapeHTML(c.tier.split("—")[0].trim())}</div>
      </div>
    </div>

    <div class="cover-prepared">
      <div class="cover-badge">VL</div>
      <div>
        <div class="cover-prepared-label">PREPARED BY</div>
        <div class="cover-prepared-name">VDA Labs · Security Operations</div>
        <div class="cover-prepared-meta">Generated ${escapeHTML(c.period.generated)} · Report ID ${escapeHTML(c.period.reportId)}</div>
      </div>
    </div>
  </div>

  <!-- ── 01 · THE VERDICT ── -->
  <section>
    <div class="section-eyebrow"><span class="num">01</span>THE VERDICT</div>
    <h2>What we want you to know.</h2>
    <div class="h2-rule"></div>
    <div class="verdict">
      <div class="verdict-headline">${escapeHTML(headline)}</div>
      <div class="verdict-detail">${escapeHTML(splitFirstSentence(c.summary[0])[1])}</div>
    </div>

    <div class="lead-stats">
      <div class="lead-stat">
        <div class="lead-stat-value">${leadStat1.value}</div>
        <div class="lead-stat-label">${leadStat1.label}</div>
      </div>
      <div class="lead-stat">
        <div class="lead-stat-value">${escapeHTML(leadStat2.value)}</div>
        <div class="lead-stat-label">${leadStat2.label}</div>
      </div>
      <div class="lead-stat">
        <div class="lead-stat-value">${leadStat3.value}</div>
        <div class="lead-stat-label">${leadStat3.label}</div>
      </div>
    </div>
  </section>

  <!-- ── 02 · WHAT WE FOUND ── -->
  <section>
    <div class="section-eyebrow"><span class="num">02</span>WHAT WE FOUND</div>
    <h2>Three points worth your attention.</h2>
    <div class="h2-rule"></div>

    <div class="supporting">
      ${c.summary.map((para, i) => {
        const [head, rest] = splitFirstSentence(para);
        return `
        <div class="supporting-point">
          <div class="supporting-num">${i + 1}</div>
          <div class="supporting-body">
            <div class="supporting-headline">${escapeHTML(head)}</div>
            <div class="supporting-detail">${escapeHTML(rest)}</div>
          </div>
        </div>
      `;
      }).join("")}
    </div>
  </section>

  <!-- ── 03 · THE EVIDENCE ── -->
  <section>
    <div class="section-eyebrow"><span class="num">03</span>THE EVIDENCE</div>
    <h2>The numbers behind the verdict.</h2>
    <div class="h2-rule"></div>

    <div class="kpi-grid">
      <div class="kpi-cell">
        <div class="kpi-label">MTTD</div>
        <div class="kpi-value">${escapeHTML(c.mttd)}</div>
        <div class="kpi-sub">vs peer ${escapeHTML(c.mttdPeer)}</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-label">MTTR</div>
        <div class="kpi-value">${escapeHTML(c.mttr)}</div>
        <div class="kpi-sub">vs peer ${escapeHTML(c.mttrPeer)}</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-label">TICKETS</div>
        <div class="kpi-value">${c.kpis.ticketsHandled}</div>
        <div class="kpi-sub">${c.kpis.escalated} escalated · ${c.kpis.confirmed} confirmed</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-label">AUTO-RESOLVED</div>
        <div class="kpi-value">${c.kpis.autoResolvedPct}%</div>
        <div class="kpi-sub">closed without analyst</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-label">CRITICAL CAUGHT</div>
        <div class="kpi-value">${c.kpis.criticalCaught}</div>
        <div class="kpi-sub">contained pre-impact</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-label">OPEN CRITICAL</div>
        <div class="kpi-value">${c.kpis.openCritical}</div>
        <div class="kpi-sub">as of report date</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-label">COVERAGE</div>
        <div class="kpi-value">${c.kpis.coveragePct}%</div>
        <div class="kpi-sub">telemetry sources</div>
      </div>
      <div class="kpi-cell">
        <div class="kpi-label">VALUE DELIVERED</div>
        <div class="kpi-value">${fmt$(c.kpis.roiTotal)}</div>
        <div class="kpi-sub">this period</div>
      </div>
    </div>

    <h3>Value delivered, with methodology</h3>
    <table class="value-table">
      <thead>
        <tr>
          <th>Component</th>
          <th class="right">Value</th>
          <th>Methodology</th>
        </tr>
      </thead>
      <tbody>
        ${c.roi.components.map(r => `
          <tr>
            <td>${escapeHTML(r.label)}</td>
            <td class="value">${fmt$(r.value)}</td>
            <td class="method">${escapeHTML(r.detail)}</td>
          </tr>
        `).join("")}
      </tbody>
      <tfoot>
        <tr>
          <td>Total this period</td>
          <td class="value">${fmt$(c.kpis.roiTotal)}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>

    ${wave === 2 ? `
    <h3 style="margin-top: 24pt;">How you compare to your peer cohort</h3>
    <div style="font-family: Calibri, sans-serif; font-size: 10pt; color: #5A6A7D; font-style: italic; margin-bottom: 10pt;">
      Cohort: ${escapeHTML(c.cohortLabel)}
    </div>
    <table class="peer-table">
      <thead>
        <tr>
          <th>Metric</th>
          <th class="right">You</th>
          <th class="right">Peer median</th>
          <th class="right">Top decile</th>
          <th>Position</th>
        </tr>
      </thead>
      <tbody>
        ${c.benchmarks.map(b => {
          const rank = cohortRank(b);
          const rankCls = rank === "Top decile" ? "rank-top" : rank === "Above median" ? "rank-above" : "rank-below";
          return `
            <tr>
              <td class="metric">${escapeHTML(b.metric)}</td>
              <td class="you">${b.you}${escapeHTML(b.unit)}</td>
              <td class="peer-num">${b.peer}${escapeHTML(b.unit)}</td>
              <td class="peer-num">${b.top}${escapeHTML(b.unit)}</td>
              <td class="rank ${rankCls}">${rank}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
    ` : ""}
  </section>

  ${wave === 2 ? `
  <!-- ── 04 · WHAT WE RECOMMEND ── -->
  <section>
    <div class="section-eyebrow"><span class="num">04</span>WHAT WE RECOMMEND</div>
    <h2>Where to spend the next dollar.</h2>
    <div class="h2-rule"></div>

    <ol class="reco-list">
      ${c.nextActions.map((act, i) => `
        <li class="reco-item ${i === 0 ? "priority" : ""}">
          <div class="reco-num">${act.rank}</div>
          <div class="reco-body">
            <div class="reco-action">${escapeHTML(act.action)}</div>
            <div class="reco-meta">
              <span class="reduction">${escapeHTML(act.reduction)}</span>
              &nbsp;·&nbsp; Effort: ${escapeHTML(act.effort)}
              &nbsp;·&nbsp; MITRE: ${escapeHTML(act.mitre)}
              &nbsp;·&nbsp; Owner: <span class="owner-${act.owner.toLowerCase()}">${escapeHTML(act.owner)}</span>
            </div>
          </div>
        </li>
      `).join("")}
    </ol>
  </section>
  ` : ""}

  ${wave === 2 ? `
  <!-- ── 05 · ROADMAP ── -->
  <section style="page-break-before: always;">
    <div class="section-eyebrow"><span class="num">05</span>THE ROADMAP</div>
    <h2>Now, next, and what's coming.</h2>
    <div class="h2-rule"></div>

    <div class="roadmap-grid">
      <div class="roadmap-lane">
        <div class="roadmap-lane-header roadmap-lane-now">NOW · COMMITTED</div>
        <div class="roadmap-lane-body">
          ${c.roadmap.now.map(it => `
            <div class="roadmap-item">
              <div class="roadmap-item-text">${escapeHTML(it.item)}</div>
              <div class="roadmap-item-meta">${escapeHTML(it.owner)} · ${escapeHTML(it.effort)} · ${escapeHTML(it.csf)} · ${escapeHTML(it.reduction)}</div>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="roadmap-lane">
        <div class="roadmap-lane-header roadmap-lane-next">NEXT · PLANNED</div>
        <div class="roadmap-lane-body">
          ${c.roadmap.next.map(it => `
            <div class="roadmap-item">
              <div class="roadmap-item-text">${escapeHTML(it.item)}</div>
              <div class="roadmap-item-meta">${escapeHTML(it.owner)} · ${escapeHTML(it.effort)} · ${escapeHTML(it.csf)} · ${escapeHTML(it.reduction)}</div>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="roadmap-lane">
        <div class="roadmap-lane-header roadmap-lane-later">LATER · STRATEGIC</div>
        <div class="roadmap-lane-body">
          ${c.roadmap.later.map(it => `
            <div class="roadmap-item">
              <div class="roadmap-item-text">${escapeHTML(it.item)}</div>
              <div class="roadmap-item-meta">${escapeHTML(it.owner)} · ${escapeHTML(it.effort)} · ${escapeHTML(it.csf)} · ${escapeHTML(it.reduction)}</div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  </section>
  ` : ""}

  <!-- ── SIGN-OFF ── -->
  <div class="signoff">
    <div class="signoff-grid">
      <div class="signoff-block">
        <div class="signoff-label">PREPARED BY</div>
        <div class="signoff-name">VDA Labs SOC Lead</div>
        <div class="signoff-line"></div>
        <div class="signoff-meta">Signature &amp; date</div>
      </div>
      <div class="signoff-block">
        <div class="signoff-label">REVIEWED FOR</div>
        <div class="signoff-name">${escapeHTML(c.name)} — Security/IT Contact</div>
        <div class="signoff-line"></div>
        <div class="signoff-meta">Signature &amp; date</div>
      </div>
    </div>
    <div class="disclaimer">
      This report reflects observed activity within VDA-monitored telemetry sources during the reporting period. It does not constitute a full risk assessment, compliance audit, or legal advice. Methodology and assumptions are stated alongside each metric. Sentry Insights operates with no vendor lock-in: VDA operates the deployment and the customer controls operational data, exportable any time.
    </div>
  </div>

  <div class="footer-strip">
    <span>SENTRY INSIGHTS · ${escapeHTML(c.period.reportId)}</span>
    <span>VDA LABS · CONFIDENTIAL — FOR BOARD USE ONLY</span>
  </div>

</div>
</body>
</html>`;
};

// HTML-escape helper (referenced inside the template)
const escapeHTML = (s) => {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const generatePDF = (customer, wave = 2) => {
  const html = buildReportHTML(customer, wave);

  // Primary path: open in a new window. Works in every modern browser, every
  // device. The user saves as PDF via Cmd-P / Ctrl-P inside the new window.
  const w = window.open("", "_blank");
  if (w && w.document) {
    w.document.open();
    w.document.write(html);
    w.document.close();
    return;
  }

  // Fallback: popup blocked. Trigger an HTML download via Blob + temp anchor,
  // then the user can open it locally and print to PDF from there.
  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Sentry-Insights-${customer.id}-${customer.period.reportId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 500);
  } catch (e) {
    // Last resort: alert with hint
    alert("Could not open the report. Please allow popups for this site and try again.");
  }
};


/* ============================================================
 * VIEW: CLIENT (board-ready)
 * ============================================================ */

const ClientView = ({ customer, isMobile, wave = 2 }) => {
  const [exporting, setExporting] = useState(false);
  const [expandedInv, setExpandedInv] = useState(null);
  const tt = useTooltip();

  const onExport = async () => {
    setExporting(true);
    try { await generatePDF(customer, wave); }
    finally { setExporting(false); }
  };

  const c = customer;
  const cohortBenchMax = (b) => Math.max(b.you, b.peer, b.top) * 1.15;

  return (
    <div>
      {/* ── Header with export ── */}
      <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 10, padding: isMobile ? "18px 14px" : "24px 28px", marginBottom: 20, borderLeft: `4px solid ${T.orange}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontFamily: T.fontMono, fontSize: 8, color: T.orange, letterSpacing: "0.18em", marginBottom: 6 }}>SECURITY REPORT</div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: isMobile ? 22 : 28, color: T.ink, fontWeight: 700, marginBottom: 4 }}>{c.name}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {[
              ["Industry", c.industry],
              ["Endpoints", c.endpoints.toLocaleString()],
              ["Sites", c.sites],
              ["Period", c.period.label],
            ].map(([k, v]) => (
              <span key={k} style={{ fontFamily: T.fontBody, fontSize: 12, color: T.inkDim }}>
                <span style={{ color: T.inkMuted }}>{k}:</span> {v}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 6, fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted }}>{c.tier}  ·  Report ID {c.period.reportId}</div>
        </div>
        <button onClick={onExport} disabled={exporting} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 6,
          border: `1px solid ${T.orange}`, background: T.orange, color: "#fff",
          fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
          cursor: exporting ? "wait" : "pointer", opacity: exporting ? 0.6 : 1,
          transition: "opacity 200ms ease-out",
        }}>
          <Download size={13} /> {exporting ? "GENERATING..." : "EXPORT PDF"}
        </button>
      </div>

      {/* ── Executive Summary (A11) ── */}
      <Section num="01" title="Executive Summary" />
      <Card>
        {c.summary.map((para, i) => (
          <p key={i} style={{ fontFamily: T.fontBody, fontSize: 14, lineHeight: 1.65, color: T.ink, marginBottom: 12, marginTop: 0 }}>{para}</p>
        ))}
        <div style={{ fontFamily: T.fontDisplay, fontStyle: "italic", fontSize: 11, color: T.inkMuted, marginTop: 8 }}>Reporting period: {c.period.label}. Compiled by VDA Labs SOC.</div>
      </Card>
      {c.quirk && (
        <div style={{ fontFamily: T.fontBody, fontStyle: "italic", fontSize: 11, color: T.inkMuted, padding: "10px 18px", marginTop: 10 }}>Note: {c.quirk}</div>
      )}

      {/* ── Headline KPIs ── */}
      <Section num="02" title="Headline Metrics" />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
        <KPI label="MTTD" value={c.mttd} icon={Eye} sub="vs peer " trend={c.mttdPeer} dir="up" color={T.steel}
          info="Mean time to detect — measured from first signal to first analyst touch." infoSource="Methodology: VDA SOC ticketing system" />
        <KPI label="MTTR" value={c.mttr} icon={Clock} sub="vs peer " trend={c.mttrPeer} dir="up"
          info="Mean time to resolve — first analyst touch to ticket closure." infoSource="Methodology: VDA SOC ticketing system" />
        <KPI label="Tickets" value={c.kpis.ticketsHandled} icon={Layers} sub={`${c.kpis.escalated} escalated · ${c.kpis.confirmed} confirmed`} color={T.steel}
          info="Total alerts triaged across all telemetry sources during the reporting period." />
        <KPI label="Auto-resolved" value={`${c.kpis.autoResolvedPct}%`} icon={Zap} dir="up" trend="closed without analyst" color={T.slaOk}
          info="Alerts dispositioned by automation alone — no analyst time spent." />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
        <KPI label="Critical caught" value={c.kpis.criticalCaught} icon={AlertCircle} sub="contained pre-impact" color={T.sevCrit} />
        <KPI label="Open critical" value={c.kpis.openCritical} icon={CheckCircle2} sub="as of report date" color={T.slaOk} />
        <KPI label="Coverage" value={`${c.kpis.coveragePct}%`} icon={Shield} sub="telemetry sources" color={T.steel}
          info="Weighted coverage across endpoint, identity, M365, network, and backup telemetry sources." />
        <KPI label="Value delivered" value={`$${(c.kpis.roiTotal / 1000).toFixed(0)}K`} icon={TrendingUp} sub="this period" color={T.orange}
          info="Estimated avoided cost: analyst-hours saved + incidents contained pre-impact + audit prep + insurance hold."
          infoSource="Each component method shown in Value Delivered section below" />
      </div>

      {/* ── Value Delivered (A9 ROI) ── */}
      <Section num="03" title="Value Delivered" right={<span style={{ fontFamily: T.fontDisplay, fontSize: 22, color: T.orange, fontWeight: 700 }}>${c.kpis.roiTotal.toLocaleString()}</span>} />
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {c.roi.components.map((r, i) => (
              <tr key={i} style={{ borderBottom: i < c.roi.components.length - 1 ? `1px solid ${T.bgCardEdge}` : "none" }}>
                <td style={{ padding: "10px 0", fontFamily: T.fontBody, fontSize: 13, color: T.ink, width: "55%" }}>
                  {r.label}
                  <span style={{ marginLeft: 6 }}><InfoDot id={`roi-${i}`} tip={r.detail} /></span>
                </td>
                <td style={{ padding: "10px 0", fontFamily: T.fontMono, fontSize: 13, color: T.orange, fontWeight: 700, textAlign: "right" }}>${r.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontFamily: T.fontDisplay, fontStyle: "italic", fontSize: 10, color: T.inkMuted, marginTop: 8 }}>
          Hover the info dots for the methodology behind each number. Industry benchmarks reference IBM Cost of a Data Breach 2025 and Coalition Cyber Insurance 2026 underwriting data.
        </div>
      </Card>

      {/* ── Posture Trend + Severity ── */}
      <Section num="04" title="Activity & Severity" />
      <Card>
        <Label info="Each weekly bar is segmented by severity (LOW → CRIT bottom-up). Diamond markers mark notable events; hover the bar to read the note.">WEEKLY TICKET VOLUME, STACKED BY SEVERITY</Label>
        <StackedSeverityBars data={c.weeklyTickets} h={140} />
      </Card>

      {wave === 1 && (
        <div style={{ marginTop: 30, padding: "20px 22px", borderRadius: 8, background: T.bgCard, border: `1px dashed ${T.orange}55`, display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.orangeTint, color: T.orange, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.fontMono, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>+</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.18em", marginBottom: 6, fontWeight: 700 }}>THE FULL REPORT ADDS</div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 16, color: T.ink, fontWeight: 700, marginBottom: 6 }}>Six more sections render in the full report.</div>
            <div style={{ fontFamily: T.fontBody, fontSize: 12, color: T.inkDim, lineHeight: 1.55 }}>
              Signal coverage gaps · risk-ranked next actions · compliance &amp; insurance readiness · what we caught this period (threat narrative) · how you compare to your peer cohort · remediation roadmap. Toggle to Full at the top to see them.
            </div>
          </div>
        </div>
      )}

      {wave === 2 && (<>
      {/* ── Coverage Gaps (A1) ── */}
      <Section num="05" title="Signal Coverage" right={
        <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.slaOk, fontWeight: 700 }}>{c.kpis.coveragePct}% OVERALL</span>
      } />
      <Card>
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontFamily: T.fontBody, fontSize: 12, color: T.inkDim }}>Three states per source: </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: T.fontMono, fontSize: 9, color: T.steel, marginRight: 12 }}>
            <span style={{ width: 8, height: 8, background: T.steel, borderRadius: 2 }} />Covered
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: T.fontMono, fontSize: 9, color: T.slaWarn, marginRight: 12 }}>
            <span style={{ width: 8, height: 8, background: T.slaWarn, borderRadius: 2 }} />Degraded
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: T.fontMono, fontSize: 9, color: T.orange }}>
            <span style={{ width: 8, height: 8, background: T.orange, borderRadius: 2 }} />Uncovered
          </span>
        </div>
        {c.coverage.map((src, i) => {
          const pct = src.total > 0 ? Math.round((src.covered / src.total) * 100) : 0;
          const hasGap = src.uncovered > 0;
          return (
            <div key={i} style={{ marginBottom: 10, padding: 10, background: hasGap ? `${T.orange}06` : "transparent", borderRadius: 4, borderLeft: hasGap ? `2px solid ${T.orange}` : "2px solid transparent" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontFamily: T.fontBody, fontSize: 12, color: T.ink }}>{src.source}</span>
                <span style={{ fontFamily: T.fontMono, fontSize: 9, color: hasGap ? T.orange : T.slaOk, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {hasGap ? <WifiOff size={10} /> : <Wifi size={10} />}{pct}%
                </span>
              </div>
              <StackedHorizBar covered={src.covered} degraded={src.degraded} uncovered={src.uncovered} total={src.total} />
              <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                <span>{src.covered}/{src.total} covered{src.uncovered > 0 ? ` · ${src.uncovered} uncovered` : ""}{src.degraded > 0 ? ` · ${src.degraded} degraded` : ""}</span>
                <span>last signal: {src.last}</span>
              </div>
            </div>
          );
        })}
      </Card>

      {/* ── Risk-Ranked Next Best Actions (A2) ── */}
      <Section num="06" title="What We Recommend Next" />
      <Card>
        {c.nextActions.map((act, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: i < c.nextActions.length - 1 ? `1px solid ${T.bgCardEdge}` : "none", borderLeft: i === 0 ? `3px solid ${T.orange}` : "3px solid transparent", paddingLeft: 12, marginLeft: -12 }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.bgElevated, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.fontMono, fontSize: 11, color: T.orange, fontWeight: 700, flexShrink: 0 }}>{act.rank}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.fontBody, fontSize: 13, color: T.ink, marginBottom: 3 }}>{act.action}</div>
              <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted, display: "flex", gap: 14, flexWrap: "wrap" }}>
                <span style={{ color: T.orangeSoft }}>{act.reduction}</span>
                <span>Effort: <span style={{ color: T.ink }}>{act.effort}</span></span>
                <span>MITRE: <span style={{ color: T.steel }}>{act.mitre}</span></span>
                <span>Owner: <span style={{ color: act.owner === "VDA" ? T.orange : act.owner === "Customer" ? T.steel : T.slaOk }}>{act.owner}</span></span>
              </div>
            </div>
          </div>
        ))}
      </Card>

      {/* ── Compliance Overlay (A3) ── */}
      <Section num="07" title="Compliance & Insurance Readiness" />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        <Card>
          <Label>{c.compliance.primary.framework.toUpperCase()}</Label>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span style={{ fontFamily: T.fontDisplay, fontSize: 32, color: T.orange, fontWeight: 700 }}>{c.compliance.primary.coverage}%</span>
            <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted }}>{c.compliance.primary.controlsEvidenced} of {c.compliance.primary.controlsTotal} controls evidenced</span>
          </div>
          <HorizBar value={c.compliance.primary.coverage} max={100} color={T.orange} height={8} />
          <div style={{ marginTop: 12, fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.1em", marginBottom: 6 }}>OPEN GAPS</div>
          {c.compliance.primary.gaps.map((g, i) => (
            <div key={i} style={{ fontFamily: T.fontBody, fontSize: 11, color: T.inkDim, marginBottom: 4, paddingLeft: 12, position: "relative" }}>
              <span style={{ position: "absolute", left: 0, color: T.slaWarn }}>•</span>{g}
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <Label info="The 5 universally-asked controls in 2026 cyber insurance underwriting (Marsh, Coalition, Beazley).">CYBER INSURANCE READINESS</Label>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
            <span style={{ fontFamily: T.fontDisplay, fontSize: 32, color: T.slaOk, fontWeight: 700 }}>{c.compliance.insurance.readiness}%</span>
            <span style={{ fontFamily: T.fontBody, fontSize: 11, color: T.inkMuted }}>underwriter-ready evidence</span>
          </div>
          {c.compliance.insurance.controls.map((ctrl, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < c.compliance.insurance.controls.length - 1 ? `1px solid ${T.bgCardEdge}` : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.fontBody, fontSize: 12, color: T.ink }}>{ctrl.name}</div>
                <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted }}>{ctrl.note}</div>
              </div>
              <StatusPip status={ctrl.status === "evidenced" ? "evidenced" : ctrl.status === "partial" ? "partial" : "gap"} />
            </div>
          ))}
        </Card>
      </div>

      {/* ── Threat Narrative (A4) ── */}
      <Section num="08" title="What We Caught This Period" />
      <Card style={{ borderLeft: `4px solid ${T.orange}` }}>
        <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.orange, letterSpacing: "0.16em", marginBottom: 6 }}>{c.narrative.id} · STOPPED AT {c.narrative.stoppedAt.toUpperCase()}</div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 20, color: T.ink, fontWeight: 700, marginBottom: 16 }}>{c.narrative.title}</div>
        <div style={{ marginBottom: 16 }}>
          {c.narrative.timeline.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, position: "relative" }}>
              <div style={{ width: 60, fontFamily: T.fontMono, fontSize: 10, color: T.orangeSoft, fontWeight: 700, flexShrink: 0 }}>{t.t}</div>
              <div style={{ width: 110, fontFamily: T.fontBody, fontSize: 11, color: T.steel, flexShrink: 0 }}>{t.who}</div>
              <div style={{ flex: 1, fontFamily: T.fontBody, fontSize: 12, color: T.inkDim }}>{t.what}</div>
            </div>
          ))}
        </div>
        <div style={{ background: T.bgElevated, padding: 14, borderRadius: 4, marginBottom: 10 }}>
          <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.14em", marginBottom: 6 }}>WHAT COULD HAVE HAPPENED</div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 14, fontStyle: "italic", color: T.ink, lineHeight: 1.55 }}>{c.narrative.whatCouldHaveHappened}</div>
        </div>
        <div style={{ fontFamily: T.fontBody, fontSize: 13, color: T.orange, fontWeight: 700 }}>{c.narrative.avoided}</div>
      </Card>

      {/* ── Peer Cohort Benchmark (A6) ── */}
      <Section num="09" title="How You Compare" right={
        <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted }}>vs. {c.cohortLabel}</span>
      } />
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 18, marginBottom: 8 }}>
          {c.benchmarks.map((b, i) => {
            const isWin = b.betterLow ? b.you <= b.peer : b.you >= b.peer;
            const rank = b.betterLow
              ? (b.you <= b.top * 1.1 ? "Top decile" : b.you <= b.peer ? "Above median" : "Below median")
              : (b.you >= b.top * 0.95 ? "Top decile" : b.you >= b.peer ? "Above median" : "Below median");
            return (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontFamily: T.fontBody, fontSize: 12, color: T.ink }}>{b.metric}</span>
                  <span style={{ fontFamily: T.fontMono, fontSize: 10, color: rank === "Top decile" ? T.slaOk : isWin ? T.steel : T.slaWarn, fontWeight: 700 }}>{rank}</span>
                </div>
                <BulletBar value={b.you} peer={b.peer} top={b.top} max={cohortBenchMax(b)} betterLow={b.betterLow} unit={b.unit} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted }}>
                  <span>You: <span style={{ color: T.ink, fontWeight: 700 }}>{b.you}{b.unit}</span></span>
                  <span>Peer: {b.peer}{b.unit}</span>
                  <span style={{ color: T.orangeSoft }}>Top: {b.top}{b.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ fontFamily: T.fontDisplay, fontStyle: "italic", fontSize: 11, color: T.inkMuted, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.bgCardEdge}` }}>
          Cohort: <DottedTerm id="cohort" term={c.cohortLabel} definition="Peer cohorts are anonymized aggregates from VDA-monitored customers in the same vertical and size band. Updated quarterly." />. Bullet bars: navy = you, grey vertical = peer median, orange tick = top decile.
        </div>
      </Card>

      {/* ── Roadmap (A10) ── */}
      <Section num="10" title="Remediation Roadmap" />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 12 }}>
        {[
          { lane: "now", title: "Now (committed)", color: T.orange, items: c.roadmap.now },
          { lane: "next", title: "Next quarter", color: T.steel, items: c.roadmap.next },
          { lane: "later", title: "Strategic 6–12mo", color: T.inkMuted, items: c.roadmap.later },
        ].map(lane => (
          <Card key={lane.lane} style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ background: lane.color, padding: "8px 14px", fontFamily: T.fontMono, fontSize: 10, color: "#fff", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>{lane.title}</div>
            <div style={{ padding: 14 }}>
              {lane.items.map((it, i) => (
                <div key={i} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: i < lane.items.length - 1 ? `1px solid ${T.bgCardEdge}` : "none" }}>
                  <div style={{ fontFamily: T.fontBody, fontSize: 12, color: T.ink, marginBottom: 5, lineHeight: 1.4 }}>{it.item}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted }}>
                    <span>Owner: <span style={{ color: it.owner === "VDA" ? T.orange : it.owner === "Customer" ? T.steel : T.slaOk }}>{it.owner}</span></span>
                    <span>Effort: <span style={{ color: T.ink }}>{it.effort}</span></span>
                    <span>{it.csf}</span>
                    <span style={{ color: T.orangeSoft }}>{it.reduction}</span>
                  </div>
                  {it.status && (
                    <div style={{ marginTop: 6, fontFamily: T.fontMono, fontSize: 8, color: it.status === "complete" ? T.slaOk : it.status === "in-progress" ? T.orange : T.inkMuted, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>● {it.status.replace("-", " ")}</div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      </>)}

      {/* ── Footer note ── */}
      <div style={{ marginTop: 30, padding: "16px 0", borderTop: `1px solid ${T.bgCardEdge}`, fontFamily: T.fontBody, fontStyle: "italic", fontSize: 11, color: T.inkMuted, lineHeight: 1.6 }}>
        Sentry Insights — built by VDA Labs to give security leaders a board-ready view of their program. No vendor lock-in: VDA operates the deployment and the customer controls operational data, exportable any time.
      </div>
    </div>
  );
};

/* ============================================================
 * VIEW: SOC OPS (engineering / internal)
 * ============================================================ */

const SOCView = ({ customer, isMobile, wave = 2 }) => {
  const [expandedInv, setExpandedInv] = useState(null);
  const c = customer;
  const tacticCoverage = useMemo(() => {
    const out = {};
    MITRE_TACTICS.forEach(tactic => {
      const techs = MITRE_DATA.filter(t => t.tactic === tactic);
      const score = techs.reduce((acc, t) => {
        const w = { strong: 1, "hunt-validated": 1.2, partial: 0.5, none: 0 };
        return acc + (w[t.coverage] || 0);
      }, 0);
      out[tactic] = techs.length > 0 ? Math.min(Math.round((score / techs.length) * 100), 100) : 0;
    });
    return out;
  }, []);

  return (
    <div>
      {/* ── Queue health ── */}
      <Section num="01" title="Queue Health" right={<span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.slaOk, fontWeight: 700 }}>SNYPR BRIDGE ACTIVE · last event 4m ago</span>} />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
        <KPI label="Open queue" value={c.kpis.escalated - c.kpis.confirmed} icon={Layers} color={T.steel} />
        <KPI label="Open critical" value={c.kpis.openCritical} icon={AlertCircle} color={c.kpis.openCritical > 0 ? T.slaBreach : T.slaOk} />
        <KPI label="Auto-resolved" value={`${c.kpis.autoResolvedPct}%`} icon={Zap} color={T.slaOk}
          info="Alerts dispositioned by deterministic rules without analyst time." />
        <KPI label="Avg investigation" value={c.mttd} icon={Clock} sub="time to decide" color={T.steel} />
        <KPI label="Confirmed" value={c.kpis.confirmed} icon={CheckCircle2} sub={`of ${c.kpis.escalated} escalated`} color={T.steel} />
      </div>

      {wave === 2 && (<>
      {/* ── MITRE Coverage Matrix (A7) ── */}
      <Section num="02" title="MITRE ATT&CK Coverage" right={
        <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted }}>{MITRE_DATA.length} techniques · {MITRE_TACTICS.length} tactics</span>
      } />
      {/* Tactic coverage rollup */}
      <Card style={{ marginBottom: 12 }}>
        <Label info="Coverage tier per tactic = weighted average of technique coverage. Hunt-validated = strong + active hunt program. Partial = detection deployed but not yet validated.">TACTIC COVERAGE ROLLUP</Label>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : `repeat(${MITRE_TACTICS.length}, 1fr)`, gap: 4 }}>
          {MITRE_TACTICS.map(t => {
            const cov = tacticCoverage[t];
            const color = cov >= 90 ? T.slaOk : cov >= 70 ? T.steel : cov >= 50 ? T.slaWarn : T.orange;
            return (
              <div key={t} style={{ padding: "8px 6px", textAlign: "center", background: T.bgElevated, borderRadius: 3, borderTop: `2px solid ${color}` }}>
                <div style={{ fontFamily: T.fontMono, fontSize: 7, color: T.inkMuted, letterSpacing: "0.1em", marginBottom: 4 }}>{t.toUpperCase()}</div>
                <div style={{ fontFamily: T.fontMono, fontSize: 12, color, fontWeight: 700 }}>{cov}%</div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(4, minmax(80px, 1fr))" : `repeat(${MITRE_TACTICS.length}, minmax(70px, 1fr))`, gap: 2, minWidth: isMobile ? 320 : "auto" }}>
          {(isMobile ? MITRE_TACTICS.slice(0, 4) : MITRE_TACTICS).map(t => (
            <div key={t} style={{ padding: "6px 3px", textAlign: "center", fontFamily: T.fontMono, fontSize: 7, color: T.inkMuted, letterSpacing: "0.06em", borderBottom: `1px solid ${T.bgCardEdge}` }}>
              {t.toUpperCase()}
            </div>
          ))}
          {(isMobile ? MITRE_TACTICS.slice(0, 4) : MITRE_TACTICS).map(tactic => {
            const techs = MITRE_DATA.filter(t => t.tactic === tactic);
            return (
              <div key={tactic} style={{ minHeight: 80 }}>
                {techs.map(tech => {
                  const colors = {
                    strong: { bg: `${T.sevHigh}24`, border: `${T.sevHigh}55`, text: T.sevHigh },
                    "hunt-validated": { bg: `${T.slaOk}24`, border: `${T.slaOk}55`, text: T.slaOk },
                    partial: { bg: `${T.steel}18`, border: `${T.steel}40`, text: T.steel },
                    none: { bg: T.bgElevated, border: T.bgCardEdge, text: T.inkMuted },
                  };
                  const col = colors[tech.coverage];
                  return (
                    <div key={tech.id} style={{ padding: "4px 5px", margin: "2px 0", borderRadius: 3, background: col.bg, border: `1px solid ${col.border}` }}>
                      <div style={{ fontFamily: T.fontMono, fontSize: 8, color: col.text, fontWeight: 700 }}>{tech.id}</div>
                      <div style={{ fontFamily: T.fontMono, fontSize: 7, color: T.inkDim, marginTop: 1 }}>{tech.name}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 12, fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, flexWrap: "wrap" }}>
          {[
            ["Hunt-validated", T.slaOk],
            ["Strong", T.sevHigh],
            ["Partial", T.steel],
          ].map(([label, c]) => (
            <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, background: c, borderRadius: 2 }} />{label}
            </span>
          ))}
        </div>
      </Card>
      </>)}

      {wave === 1 && (
        <div style={{ marginTop: 20, padding: "20px 22px", borderRadius: 8, background: T.bgCard, border: `1px dashed ${T.orange}55`, display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.orangeTint, color: T.orange, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.fontMono, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>+</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.18em", marginBottom: 6, fontWeight: 700 }}>THE FULL REPORT ADDS</div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 16, color: T.ink, fontWeight: 700, marginBottom: 6 }}>MITRE ATT&amp;CK coverage matrix renders in the full report.</div>
            <div style={{ fontFamily: T.fontBody, fontSize: 12, color: T.inkDim, lineHeight: 1.55 }}>
              Per-technique coverage tier across all 12 tactics, with rollup view. Useful for analyst hunt prioritization and customer-facing coverage discussions. Toggle to Full above to preview.
            </div>
          </div>
        </div>
      )}

      {/* ── Decision Log / Investigation Trail (A8) ── */}
      <Section num="03" title="Decision Log" right={
        <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.slaOk }}>{c.investigations.length} recent · all enriched</span>
      } />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {c.investigations.map(inv => {
          const expanded = expandedInv === inv.id;
          const verdictColor = { "True positive": T.slaBreach, "Prevented": T.slaOk, "Contained": T.slaWarn }[inv.verdict] || T.steel;
          return (
            <Card key={inv.id} style={{ cursor: "pointer", transition: "border-color 200ms ease-out, background 200ms ease-out", borderColor: expanded ? `${T.orange}80` : T.bgCardEdge, background: expanded ? T.bgElevated : T.bgCard }}>
              <div onClick={() => setExpandedInv(expanded ? null : inv.id)} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.fontBody, fontSize: 13, color: T.ink, marginBottom: 3 }}>{inv.signal}</div>
                  <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted }}>{inv.id} · {inv.t} · {inv.source} · {inv.enrichment.length} enrichment sources</div>
                </div>
                <span style={{ fontFamily: T.fontMono, fontSize: 9, color: verdictColor, fontWeight: 700, flexShrink: 0 }}>{inv.verdict.toUpperCase()}</span>
                {expanded ? <ChevronUp size={14} color={T.orange} /> : <ChevronDown size={14} color={T.inkMuted} />}
              </div>
              {expanded && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.bgCardEdge}` }}>
                  {/* 3-stage pipeline */}
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                    {[
                      { label: "01 · SIGNAL", body: <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkDim, lineHeight: 1.5 }}>{inv.signal}</div> },
                      { label: "02 · ENRICHMENT", body: (
                        <div>
                          {inv.enrichment.map((e, i) => (
                            <div key={i} style={{ fontFamily: T.fontBody, fontSize: 11, color: T.inkDim, marginBottom: 4, paddingLeft: 12, position: "relative" }}>
                              <span style={{ position: "absolute", left: 0, color: T.steel }}>✓</span>{e}
                            </div>
                          ))}
                        </div>
                      )},
                      { label: "03 · DECISION", body: (
                        <div>
                          <div style={{ fontFamily: T.fontBody, fontSize: 11, color: T.ink, marginBottom: 6 }}>{inv.decision}</div>
                          <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted }}>By: {inv.decidedBy}</div>
                          <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted }}>TTD: {inv.ttd} · TTR: {inv.ttr}</div>
                        </div>
                      )},
                    ].map((stage, i) => (
                      <div key={i} style={{ background: T.bgCard, padding: 10, borderRadius: 4, border: `1px solid ${T.bgCardEdge}` }}>
                        <div style={{ fontFamily: T.fontMono, fontSize: 8, color: T.orange, letterSpacing: "0.14em", marginBottom: 6 }}>{stage.label}</div>
                        {stage.body}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── Coverage gaps (mirrored on SOC for ops view) ── */}
      <Section num="04" title="Telemetry Health" />
      <Card>
        {c.coverage.map((src, i) => {
          const pct = src.total > 0 ? Math.round((src.covered / src.total) * 100) : 0;
          const hasGap = src.uncovered > 0;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < c.coverage.length - 1 ? `1px solid ${T.bgCardEdge}` : "none" }}>
              <div style={{ width: hasGap ? 8 : 0, height: 8, borderRadius: "50%", background: hasGap ? T.orange : "transparent", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: T.fontBody, fontSize: 12, color: T.ink }}>{src.source}</span>
                  <span style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted }}>{src.last}</span>
                </div>
                <StackedHorizBar covered={src.covered} degraded={src.degraded} uncovered={src.uncovered} total={src.total} height={6} />
              </div>
              <span style={{ fontFamily: T.fontMono, fontSize: 11, color: hasGap ? T.orange : T.slaOk, fontWeight: 700, minWidth: 40, textAlign: "right" }}>{pct}%</span>
            </div>
          );
        })}
      </Card>

      {/* ── On-call mobile view (A12) ── */}
      <Section num="05" title="On-Call View" right={<span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted }}>designed for mobile</span>} />
      <Card>
        <Label>WALK-INTO-A-MEETING SUMMARY</Label>
        <div style={{ fontFamily: T.fontBody, fontSize: 13, color: T.ink, lineHeight: 1.7 }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{ color: T.inkMuted }}>Status: </span>
            <span style={{ color: c.kpis.openCritical === 0 ? T.slaOk : T.slaBreach, fontWeight: 700 }}>
              {c.kpis.openCritical === 0 ? "All clear" : `${c.kpis.openCritical} open critical`}
            </span>
          </div>
          <div style={{ marginBottom: 10 }}>
            <span style={{ color: T.inkMuted }}>This period: </span>
            <span>{c.kpis.confirmed} confirmed incidents · {c.kpis.criticalCaught} critical caught · 0 successful</span>
          </div>
          <div style={{ marginBottom: 10 }}>
            <span style={{ color: T.inkMuted }}>Coverage: </span>
            <span>{c.kpis.coveragePct}% of expected telemetry</span>
            {c.coverage.filter(x => x.uncovered > 0).length > 0 && (
              <span style={{ color: T.orange }}> · {c.coverage.filter(x => x.uncovered > 0).length} gap{c.coverage.filter(x => x.uncovered > 0).length === 1 ? "" : "s"} flagged</span>
            )}
          </div>
          <div>
            <span style={{ color: T.inkMuted }}>Last analyst note: </span>
            <span style={{ fontStyle: "italic" }}>{c.investigations[0]?.decision || "No recent activity"}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

/* ============================================================
 * MAIN APP
 * ============================================================ */

export default function SentryInsightsTiered() {
  const isMobile = useIsMobile();
  const [view, setView] = useState("client");
  const [activeId, setActiveId] = useState("meridian");
  const [wave, setWave] = useState(1);
  const customer = CUSTOMERS[activeId];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      {/* keyframes for tooltip fade-in */}
      <style>{`
        @keyframes tt-in {
          from { opacity: 0; transform: translateY(4px) translateX(-50%); }
          to { opacity: 1; transform: translateY(0) translateX(-50%); }
        }
      `}</style>

      {/* Top chrome */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: T.bgDeep, borderBottom: `1px solid ${T.bgCardEdge}`, padding: isMobile ? "8px 10px" : "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={18} color={T.orange} />
          <span style={{ fontFamily: T.fontDisplay, fontSize: 16, color: T.ink, fontWeight: 700 }}>Sentry</span>
          <span style={{ fontFamily: T.fontMono, fontSize: 8, color: T.orange, letterSpacing: "0.12em", background: `${T.orange}15`, padding: "2px 7px", borderRadius: 3, fontWeight: 700 }}>INSIGHTS · TIERED</span>
        </div>
        <div style={{ display: "flex", gap: 2, background: T.bgCard, borderRadius: 6, padding: 2, border: `1px solid ${T.bgCardEdge}` }}>
          {[{ k: "client", l: "Client Report" }, { k: "soc", l: "SOC Ops" }].map(t => (
            <button key={t.k} onClick={() => setView(t.k)} style={{
              fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.08em",
              padding: "5px 12px", borderRadius: 4, border: "none", cursor: "pointer",
              background: view === t.k ? T.orange : "transparent",
              color: view === t.k ? "#fff" : T.inkMuted,
              fontWeight: view === t.k ? 700 : 400, transition: "all 200ms ease-out",
            }}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* Customer pills */}
      <div style={{ padding: isMobile ? "8px 10px" : "10px 24px", background: T.bgCard, borderBottom: `1px solid ${T.bgCardEdge}`, display: "flex", gap: 6, overflowX: "auto", alignItems: "center" }}>
        <span style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, letterSpacing: "0.1em", marginRight: 8, flexShrink: 0 }}>SAMPLE:</span>
        {Object.values(CUSTOMERS).map(c => {
          const Icon = c.icon;
          return (
            <button key={c.id} onClick={() => setActiveId(c.id)} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontFamily: T.fontBody, fontSize: 12, padding: "5px 12px", borderRadius: 999,
              border: `1px solid ${activeId === c.id ? T.orange : T.bgCardEdge}`,
              background: activeId === c.id ? T.orangeTint : "transparent",
              color: activeId === c.id ? T.orange : T.inkDim,
              cursor: "pointer", whiteSpace: "nowrap", fontWeight: activeId === c.id ? 700 : 400,
              transition: "all 200ms ease-out", flexShrink: 0,
            }}>
              <Icon size={12} />{c.name}
            </button>
          );
        })}
      </div>

      {/* Banner — frames this as a Phase 2 reporting preview, depth toggle */}
      <div style={{
        background: `linear-gradient(180deg, ${T.bgCard} 0%, ${T.bg} 100%)`,
        borderBottom: `1px solid ${T.bgCardEdge}`,
        padding: isMobile ? "16px 12px" : "18px 24px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.22em", fontWeight: 700, marginBottom: 4 }}>
                PHASE 2 REPORTING · PREVIEW
              </div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: isMobile ? 16 : 18, color: T.ink, fontWeight: 700, marginBottom: 4 }}>
                {wave === 1
                  ? "Standard — the templated monthly report."
                  : "Full — the complete reporting picture."}
              </div>
              <div style={{ fontFamily: T.fontBody, fontSize: 12, color: T.inkDim, lineHeight: 1.55 }}>
                {wave === 1
                  ? "The monthly report Phase 2 commits to: queue health, decision log, metrics, board-ready PDF. Toggle to Full to see where reporting could go."
                  : "Where reporting could go: coverage gaps, MITRE matrix, peer benchmarking, compliance overlays, threat narrative, remediation roadmap. The ceiling, not the commitment — scoped later, only if ticketing proves out."}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <div style={{ fontFamily: T.fontMono, fontSize: 8, color: T.inkMuted, letterSpacing: "0.14em" }}>
                REPORT DEPTH
              </div>
              <div style={{ display: "flex", gap: 2, background: T.bgDeep, borderRadius: 6, padding: 3, border: `1px solid ${T.bgCardEdge}` }}>
                {[
                  { w: 1, l: "Standard", sub: "Monthly report" },
                  { w: 2, l: "Full", sub: "The ceiling" },
                ].map(opt => (
                  <button key={opt.w} onClick={() => setWave(opt.w)} style={{
                    fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.06em",
                    padding: "8px 14px", borderRadius: 4, border: "none", cursor: "pointer",
                    background: wave === opt.w ? T.orange : "transparent",
                    color: wave === opt.w ? "#fff" : T.inkDim,
                    fontWeight: 700,
                    transition: "all 200ms ease-out",
                    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1,
                    minWidth: 90,
                  }}>
                    <span>{opt.l}</span>
                    <span style={{ fontSize: 8, fontWeight: 400, letterSpacing: "0.1em", opacity: wave === opt.w ? 0.85 : 0.6 }}>{opt.sub}</span>
                  </button>
                ))}
              </div>
              <div style={{ fontFamily: T.fontMono, fontSize: 8, color: T.inkMuted, letterSpacing: "0.1em", textAlign: "right", maxWidth: 220 }}>
                The deck commits to Standard. Full is where it could go, scoped later.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: isMobile ? "14px 10px" : "20px 24px", maxWidth: 1200, margin: "0 auto" }}>
        {view === "client"
          ? <ClientView customer={customer} isMobile={isMobile} wave={wave} />
          : <SOCView customer={customer} isMobile={isMobile} wave={wave} />
        }
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.bgCardEdge}`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
        <span style={{ fontFamily: T.fontMono, fontSize: 8, color: T.inkMuted, letterSpacing: "0.1em" }}>SENTRY INSIGHTS · PHASE 2 REPORTING PREVIEW</span>
        <span style={{ fontFamily: T.fontMono, fontSize: 8, color: T.inkMuted, letterSpacing: "0.1em" }}>NO VENDOR LOCK-IN · YOUR DATA, YOUR DECISIONS</span>
      </div>
    </div>
  );
}
