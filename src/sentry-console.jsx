/**
 * sentry-console.jsx — VDA × 3Nails Engineering Console
 *
 * The analyst UI for Sibe's SOC team. Built against the ticketing scope from the
 * discovery call with Jim, Sibe, Kendall, and Vincent.
 *
 * Purpose: eliminate the manual copy-paste workflow between Securonix SNYPR and
 * outbound email (inbound address: soc@vdalabs.com) that runs Sibe's day.
 * Replaces what Halo tried and failed to do.
 *
 * Core surface: ticket queue, ticket detail view with email thread, compose flow
 * with wrong-client prevention (the single most important UX pattern in the app —
 * Jim flagged cross-customer data leakage twice on the discovery call).
 *
 * Stage toggle (top right, labeled "Demo") lets a viewer see three maturity stages:
 *   Stage 1 · 5-week MVP        — Queue + Detail + Compose only
 *   Stage 2 · Production Feel    — Stage 1 + assign/reassign + SLA breach view
 *   Stage 3 · Full SNYPR Flow    — Stage 2 + SNYPR ingest simulation view
 *
 * Desktop layout is a 2-pane grid (queue + detail). Queue is an inbox stack —
 * each row is a 4-line card, not a spreadsheet grid. SNYPR panel is a separate
 * view accessed from the top nav. Phase 2 asks (analyst dashboard, queue health)
 * are documented in SCOPE_AUDIT.md, not rendered as dead UI chrome.
 *
 * All data is mocked. Built against the Sentry design system:
 *   navy #0A1628, card #122238, edge #1A2E47
 *   burnt orange #D2691E, steel blue #6B93B8
 *
 * Font stack in the app runtime: Georgia display, Calibri body, Consolas mono.
 * The standalone design-system doc (sentry-design-system.html) uses the
 * system font stack instead — this was a targeted workaround for an iOS Safari
 * rendering bug specific to that doc's layout (sticky nav + backdrop-filter +
 * Georgia at synthesized weights). The app runtime does not trigger that bug
 * and keeps Georgia for its editorial feel.
 *
 * NOTE: this file was renamed from sentry-v2.jsx. The component export below
 * is SentryConsole. The route in App.jsx is "/" — the console is the root view.
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  AlertCircle, Check, CheckCircle2, Clock, Inbox, Lock, Mail, Search,
  Send, Shield, Zap, User, UserPlus, ChevronRight, ChevronLeft, X, Plus, Filter,
  Settings, Layers, Activity, UserCircle, AtSign, Tag,
} from "lucide-react";

/* ============================================================
 * BRAND TOKENS — pulled directly from the Sentry design system
 * ============================================================ */
const T = {
  bg: "#0A1628",
  bgCard: "#122238",
  bgCardEdge: "#1A2E47",
  bgElevated: "#172941",
  ink: "#E8EEF4",
  inkDim: "#A8B8C8",
  inkMuted: "#6B7D91",
  divider: "#2A3E57",

  orange: "#D2691E",
  orangeSoft: "#E89968",
  steel: "#6B93B8",
  steelDim: "#4A7090",

  sevCrit: "#D2691E",
  sevHigh: "#D4A574",
  sevMed: "#6B93B8",
  sevLow: "#6B7D91",

  slaOk: "#5B8F6F",
  slaWarn: "#D4A574",
  slaBreach: "#C95850",

  fontDisplay: 'Georgia, "Times New Roman", serif',
  fontBody: 'Calibri, "Segoe UI", system-ui, sans-serif',
  fontMono: 'Consolas, "Courier New", monospace',
};

/* ============================================================
 * RESPONSIVE HOOK — JS-based (works in every sandbox)
 * ============================================================ */
const useIsMobile = (breakpoint = 900) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
};

/* ============================================================
 * MOCK DATA — three customers, ~12 tickets, varied states
 * Demo intent: wrong-client prevention must be demonstrable
 * ============================================================ */

const CUSTOMERS = [
  { id: "acme", name: "Acme Corp", domain: "acme.com", tier: "Enterprise",
    contact: "security@acme.com", slaProfile: "standard" },
  { id: "basalt", name: "Basalt Industries", domain: "basalt.io", tier: "Growth",
    contact: "security@basalt.io", slaProfile: "standard" },
  { id: "cirrus", name: "Cirrus Health", domain: "cirrushealth.com", tier: "Enterprise",
    contact: "it-security@cirrushealth.com", slaProfile: "healthcare" },
];

const ANALYSTS = [
  { id: "sibe", name: "Sibe Klomp", role: "SOC Manager", initials: "SK" },
  { id: "taylor", name: "Taylor Reeves", role: "SOC Analyst", initials: "TR" },
  { id: "morgan", name: "Morgan Hale", role: "SOC Analyst", initials: "MH" },
  { id: "dani", name: "Dani Okafor", role: "SOC Analyst", initials: "DO" },
];

// Severity → SLA hours (matches real VDA commitments from call)
const SLA_HOURS = { critical: 1, high: 4, medium: 24, low: 72 };

// Severity sort rank — CRIT first, resolved sinks to bottom.
// Kept intentionally simple: no learning, no feedback loops, no detection-engine plumbing.
// Just the ordering Sibe already does mentally, made explicit.
const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3 };
const sortKey = (t) => {
  const resolvedOffset = t.status === "resolved" ? 1000 : 0;
  return resolvedOffset + (SEV_RANK[t.severity] ?? 99);
};

const NOW = new Date("2026-04-17T14:30:00Z").getTime();
const mins = (n) => NOW - n * 60 * 1000;

const TICKETS = [
  {
    id: "VDA-1847", customerId: "acme", severity: "critical",
    subject: "Unusual login from new IP range — finance.lead@acme.com",
    source: "snypr", snyprIncidentId: "INC-4421",
    assigneeId: "sibe", status: "in-progress",
    createdAt: mins(42),
    events: [
      { type: "snypr-ingest", at: mins(42),
        text: "SNYPR incident INC-4421 opened — SentinelOne auth anomaly, Lagos NG" },
      { type: "note-internal", at: mins(40), authorId: "sibe",
        text: "Cross-referencing with Tom Webb's travel calendar. Not on approved travel." },
      { type: "email-out", at: mins(35), authorId: "sibe",
        to: "security@acme.com",
        body: "We've detected an unusual login to your CFO's account from Lagos, Nigeria. Session has been isolated. Please confirm whether Tom is currently traveling." },
    ],
  },
  {
    id: "VDA-1846", customerId: "basalt", severity: "high",
    subject: "Phishing campaign targeting AP team — 7 emails quarantined",
    source: "snypr", snyprIncidentId: "INC-4419",
    assigneeId: "taylor", status: "awaiting-customer",
    createdAt: mins(180),
    events: [
      { type: "snypr-ingest", at: mins(180),
        text: "SNYPR incident INC-4419 — Proofpoint blocked 7 emails matching phishing signature" },
      { type: "email-out", at: mins(170), authorId: "taylor",
        to: "security@basalt.io",
        body: "We blocked 7 phishing emails targeting your accounts-payable team today. All were quarantined. Confirm whether your team has seen any suspicious invoices lately." },
      { type: "email-in", at: mins(90), authorId: null,
        from: "security@basalt.io",
        body: "Nothing unusual reported from the AP team. Thanks for the heads-up." },
      { type: "note-internal", at: mins(60), authorId: "taylor",
        text: "Customer confirmed no downstream impact. Closing when SLA reminder clears." },
    ],
  },
  {
    id: "VDA-1845", customerId: "cirrus", severity: "critical",
    subject: "Memory scraping attempt on patient DB server",
    source: "email", snyprIncidentId: null,
    assigneeId: "morgan", status: "in-progress",
    createdAt: mins(25),
    events: [
      { type: "email-in", at: mins(25), authorId: null,
        from: "it-security@cirrushealth.com",
        body: "Our EDR is flagging lsass access attempts on PATIENT-DB-02. Can you investigate?" },
      { type: "note-internal", at: mins(20), authorId: "morgan",
        text: "Opening SNYPR case. Pulling process tree from SentinelOne." },
    ],
  },
  {
    id: "VDA-1844", customerId: "acme", severity: "medium",
    subject: "SSL cert renewal reminder — api.acme.com",
    source: "snypr", snyprIncidentId: "INC-4415",
    assigneeId: "dani", status: "resolved",
    createdAt: mins(1440),
    events: [
      { type: "snypr-ingest", at: mins(1440), text: "Certificate expiration within 30 days" },
      { type: "email-out", at: mins(1430), authorId: "dani", to: "security@acme.com",
        body: "Heads up — api.acme.com SSL certificate expires in 28 days." },
      { type: "email-in", at: mins(720), authorId: null, from: "security@acme.com",
        body: "Thanks — renewal scheduled. Close ticket." },
      { type: "status-change", at: mins(700), authorId: "dani",
        text: "Marked resolved — customer confirmed renewal scheduled." },
    ],
  },
  {
    id: "VDA-1843", customerId: "basalt", severity: "low",
    subject: "Weekly vulnerability scan report",
    source: "snypr", snyprIncidentId: "INC-4410",
    assigneeId: "taylor", status: "resolved",
    createdAt: mins(2880),
    events: [
      { type: "snypr-ingest", at: mins(2880), text: "Scheduled scan completed — 3 medium findings" },
      { type: "email-out", at: mins(2870), authorId: "taylor", to: "security@basalt.io",
        body: "Your weekly scan is attached. Three medium findings — patches available for all three." },
    ],
  },
  {
    id: "VDA-1842", customerId: "cirrus", severity: "high",
    subject: "Suspicious PowerShell execution on FILE-SRV-03",
    source: "snypr", snyprIncidentId: "INC-4408",
    assigneeId: "sibe", status: "awaiting-customer",
    createdAt: mins(720),
    events: [
      { type: "snypr-ingest", at: mins(720), text: "SNYPR flagged encoded PS command from cached admin session" },
      { type: "note-internal", at: mins(700), authorId: "sibe",
        text: "Matches pattern of legit IT scripting. Confirming with customer." },
      { type: "email-out", at: mins(690), authorId: "sibe", to: "it-security@cirrushealth.com",
        body: "SNYPR caught encoded PowerShell activity on FILE-SRV-03. Before we escalate — is this part of any scheduled admin work?" },
    ],
  },
  {
    id: "VDA-1841", customerId: "acme", severity: "low",
    subject: "New user provisioning — inform SOC of new hires",
    source: "email", snyprIncidentId: null,
    assigneeId: "dani", status: "open",
    createdAt: mins(15),
    events: [
      { type: "email-in", at: mins(15), authorId: null, from: "hr@acme.com",
        body: "Three new engineers starting Monday — please add to your monitoring scope." },
    ],
  },
  {
    id: "VDA-1840", customerId: "basalt", severity: "medium",
    subject: "Lockout storm — five users locked in 10 minutes",
    source: "snypr", snyprIncidentId: "INC-4402",
    assigneeId: "morgan", status: "in-progress",
    createdAt: mins(95),
    events: [
      { type: "snypr-ingest", at: mins(95), text: "Account lockout anomaly — 5 accounts in 10min window" },
      { type: "note-internal", at: mins(85), authorId: "morgan",
        text: "Looks like a rollout of a new VPN client misfiring. Not malicious. Verifying with IT." },
    ],
  },
  {
    id: "VDA-1839", customerId: "acme", severity: "high",
    subject: "Data exfiltration alert — 2.3GB to unknown S3 bucket",
    source: "snypr", snyprIncidentId: "INC-4398",
    assigneeId: null, status: "open",
    createdAt: mins(8),
    events: [
      { type: "snypr-ingest", at: mins(8),
        text: "Egress anomaly — 2.3GB transfer to s3://ext-data-8a7c in 6min window" },
    ],
  },
  {
    id: "VDA-1838", customerId: "cirrus", severity: "low",
    subject: "MFA enrollment dropped for 2 users last month",
    source: "snypr", snyprIncidentId: "INC-4390",
    assigneeId: "taylor", status: "resolved",
    createdAt: mins(4320),
    events: [
      { type: "snypr-ingest", at: mins(4320), text: "MFA compliance check — 2 users below threshold" },
      { type: "email-out", at: mins(4310), authorId: "taylor", to: "it-security@cirrushealth.com",
        body: "Monthly compliance: two users dropped MFA. Names attached." },
      { type: "email-in", at: mins(3000), authorId: null, from: "it-security@cirrushealth.com",
        body: "Both re-enrolled. Close ticket, thanks." },
    ],
  },
  {
    id: "VDA-1837", customerId: "basalt", severity: "medium",
    subject: "Failed patch rollout on DEV-WEB-02",
    source: "email", snyprIncidentId: null,
    assigneeId: "sibe", status: "open",
    createdAt: mins(35),
    events: [
      { type: "email-in", at: mins(35), authorId: null, from: "ops@basalt.io",
        body: "Our Tuesday patch cycle partially failed. Can you confirm nothing drifted on the SOC side?" },
    ],
  },
  {
    id: "VDA-1836", customerId: "acme", severity: "critical",
    subject: "Ransomware IOC match on staging VM — contained",
    source: "snypr", snyprIncidentId: "INC-4385",
    assigneeId: "sibe", status: "resolved",
    createdAt: mins(10080),
    events: [
      { type: "snypr-ingest", at: mins(10080),
        text: "IOC match against staging VM — auto-isolated by SentinelOne" },
      { type: "note-internal", at: mins(10060), authorId: "sibe",
        text: "Staging VM is pre-production, not touching customer data. Confirming isolation." },
      { type: "email-out", at: mins(10050), authorId: "sibe", to: "security@acme.com",
        body: "Ransomware IOC matched on your staging VM. Isolated automatically. Requesting restore-from-snapshot confirmation." },
      { type: "email-in", at: mins(9000), authorId: null, from: "security@acme.com",
        body: "Snapshot restored, VM rebuilt from gold image. Thanks." },
    ],
  },
];

// SNYPR incident backlog for L3 demo — unopened incidents waiting for analyst decision
const SNYPR_BACKLOG = [
  {
    id: "INC-4424", customerId: "acme", severity: "medium",
    title: "Outbound connection to known TOR exit node",
    details: "Workstation EN-042 (Sarah Liu, Marketing) initiated 3 connections to 185.220.101.42 over 20 min",
    at: mins(4),
  },
  {
    id: "INC-4423", customerId: "cirrus", severity: "high",
    title: "Service account login outside business hours",
    details: "svc_backup_db authenticated from new source IP at 03:12 local",
    at: mins(11),
  },
  {
    id: "INC-4422", customerId: "basalt", severity: "low",
    title: "Endpoint missed scheduled scan",
    details: "DEV-LAPTOP-14 offline during 2026-04-17 02:00 scheduled scan window",
    at: mins(18),
  },
];

/* ============================================================
 * HELPERS
 * ============================================================ */

const fmtAgo = (t) => {
  const d = NOW - t;
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const slaRemaining = (t) => {
  const hoursForSeverity = (sev) => SLA_HOURS[sev] || 24;
  return (ticket) => {
    const deadline = ticket.createdAt + hoursForSeverity(ticket.severity) * 3600000;
    return deadline - NOW;
  };
};

const slaState = (t, sev) => {
  const hours = SLA_HOURS[sev] || 24;
  const deadline = t + hours * 3600000;
  const remaining = deadline - NOW;
  const pctLeft = remaining / (hours * 3600000);
  if (remaining < 0) return "breach";
  if (pctLeft < 0.25) return "warning";
  return "on-track";
};

const fmtSlaLabel = (t, sev) => {
  const hours = SLA_HOURS[sev] || 24;
  const deadline = t + hours * 3600000;
  const remaining = deadline - NOW;
  if (remaining < 0) {
    const over = Math.abs(Math.floor(remaining / 60000));
    return over < 60 ? `BREACHED +${over}m` : `BREACHED +${Math.floor(over / 60)}h`;
  }
  const mins = Math.floor(remaining / 60000);
  if (mins < 60) return `${mins}m LEFT`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h LEFT`;
};

const customerById = (id) => CUSTOMERS.find((c) => c.id === id);
const analystById = (id) => ANALYSTS.find((a) => a.id === id);

/* ============================================================
 * SMALL COMPONENTS
 * ============================================================ */

const SevBadge = ({ sev }) => {
  const colors = {
    critical: { bg: "rgba(210,105,30,0.14)", fg: T.sevCrit, border: "rgba(210,105,30,0.35)" },
    high: { bg: "rgba(212,165,116,0.14)", fg: T.sevHigh, border: "rgba(212,165,116,0.35)" },
    medium: { bg: "rgba(107,147,184,0.14)", fg: T.sevMed, border: "rgba(107,147,184,0.35)" },
    low: { bg: "rgba(107,125,145,0.14)", fg: T.sevLow, border: "rgba(107,125,145,0.35)" },
  };
  const c = colors[sev];
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 3,
      fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
      letterSpacing: "0.14em", textTransform: "uppercase",
      background: c.bg, color: c.fg, border: `1px solid ${c.border}`,
    }}>{sev}</span>
  );
};

const StatusPill = ({ status }) => {
  const map = {
    open: { label: "OPEN", color: T.steel },
    "in-progress": { label: "IN PROGRESS", color: T.orange },
    "awaiting-customer": { label: "AWAITING CUSTOMER", color: T.sevHigh },
    resolved: { label: "RESOLVED", color: T.slaOk },
  };
  const s = map[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 999,
      background: `${s.color}22`, border: `1px solid ${s.color}55`, color: s.color,
      fontFamily: T.fontMono, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color }} />
      {s.label}
    </span>
  );
};

const SlaPill = ({ createdAt, severity }) => {
  const state = slaState(createdAt, severity);
  const colors = { "on-track": T.slaOk, warning: T.slaWarn, breach: T.slaBreach };
  const c = colors[state];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 999,
      background: `${c}22`, border: `1px solid ${c}55`, color: c,
      fontFamily: T.fontMono, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: c,
        animation: state === "warning" || state === "breach" ? "pulse 2s ease-in-out infinite" : "none",
      }} />
      SLA · {fmtSlaLabel(createdAt, severity)}
    </span>
  );
};

const AnalystAvatar = ({ analyst, size = 28 }) => {
  if (!analyst) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: T.bgElevated, border: `1px dashed ${T.divider}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: T.inkMuted, fontSize: 10, fontFamily: T.fontMono,
      }}>??</div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: T.bgElevated, border: `1px solid ${T.bgCardEdge}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: T.ink, fontSize: size > 32 ? 12 : 10, fontFamily: T.fontMono, fontWeight: 600,
    }} title={analyst.name}>
      {analyst.initials}
    </div>
  );
};

/* ============================================================
 * HEADER with scope toggle
 * ============================================================ */

const STAGES = [
  { id: "stage1", label: "Stage 1 · 5-Week MVP", short: "Stage 1", sub: "Queue · Detail · Compose" },
  { id: "stage2", label: "Stage 2 · Production", short: "Stage 2", sub: "+ Assign · SLA · Sidebar" },
  { id: "stage3", label: "Stage 3 · SNYPR Flow", short: "Stage 3", sub: "+ SNYPR ingest simulation" },
];

const Header = ({ stage, setStage, activeView, setActiveView }) => {
  const isMobile = useIsMobile();
  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "stretch" : "center",
      gap: isMobile ? 8 : 0,
      padding: isMobile ? "10px 14px" : "0 20px",
      height: isMobile ? "auto" : 48,
      background: T.bg,
      borderBottom: `1px solid ${T.divider}`,
    }}>
      {/* Left: brand lockup — slim and quiet */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 3,
          background: "rgba(210,105,30,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center", color: T.orange,
          flexShrink: 0,
        }}>
          <Shield size={13} />
        </div>
        <div style={{
          fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.22em",
          fontWeight: 700, color: T.ink, textTransform: "uppercase",
        }}>
          SENTRY
        </div>
        {!isMobile && (
          <div style={{
            fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.16em",
            color: T.inkMuted, textTransform: "uppercase", marginLeft: 2,
          }}>
            VDA × 3NAILS
          </div>
        )}
      </div>

      {/* Middle: workflow nav — the primary affordance */}
      {!isMobile && (
        <div style={{
          display: "flex", alignItems: "center", gap: 0, marginLeft: 32,
          height: "100%", flex: 1, minWidth: 0,
        }}>
          <HeaderNavButton
            label="Tickets"
            active={activeView === "tickets"}
            onClick={() => setActiveView("tickets")}
          />
          {stage === "stage3" && (
            <HeaderNavButton
              label="SNYPR Ingest"
              active={activeView === "snypr"}
              onClick={() => setActiveView("snypr")}
            />
          )}
        </div>
      )}

      {/* Right: Stage demo toggle — visually demoted */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
        justifyContent: isMobile ? "flex-start" : "flex-end", flexShrink: 0,
      }}>
        <span style={{
          fontFamily: T.fontMono, fontSize: 8, letterSpacing: "0.2em",
          color: T.inkMuted, textTransform: "uppercase", marginRight: 4, opacity: 0.7,
        }}>demo view</span>
        {STAGES.map((s) => {
          const active = stage === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setStage(s.id)}
              title={s.sub}
              style={{
                padding: isMobile ? "4px 8px" : "4px 10px",
                borderRadius: 3, cursor: "pointer",
                background: active ? "rgba(210,105,30,0.12)" : "transparent",
                color: active ? T.orange : T.inkMuted,
                border: `1px solid ${active ? "rgba(210,105,30,0.5)" : "transparent"}`,
                fontFamily: T.fontMono, fontSize: 9, fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase",
                transition: "all 120ms ease",
              }}
            >
              {s.short}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* Workflow nav button — uses underline active state like a real app nav, not a chip */
const HeaderNavButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      height: "100%", padding: "0 16px", cursor: "pointer",
      background: "transparent",
      color: active ? T.ink : T.inkMuted,
      border: "none",
      borderBottom: `2px solid ${active ? T.orange : "transparent"}`,
      fontFamily: T.fontBody, fontSize: 13, fontWeight: 600,
      letterSpacing: "0.02em",
      transition: "all 120ms ease",
      display: "flex", alignItems: "center",
    }}
  >
    {label}
  </button>
);

/* ============================================================
 * QUEUE VIEW (all levels)
 * ============================================================ */

const QueueFilters = ({ filters, setFilters, level, isMobile }) => (
  <div style={{
    display: "flex", gap: 8,
    padding: isMobile ? "10px 14px" : "12px 20px",
    borderBottom: `1px solid ${T.divider}`, alignItems: "center",
    flexWrap: "wrap",
    overflowX: isMobile ? "auto" : "visible",
  }}>
    <Filter size={14} style={{ color: T.inkMuted, flexShrink: 0 }} />
    {["all", "open", "in-progress", "awaiting-customer", "resolved"].map((s) => (
      <button
        key={s}
        onClick={() => setFilters({ ...filters, status: s })}
        style={{
          padding: "4px 10px", borderRadius: 3, cursor: "pointer",
          background: filters.status === s ? T.bgElevated : "transparent",
          color: filters.status === s ? T.ink : T.inkDim,
          border: `1px solid ${filters.status === s ? T.bgCardEdge : "transparent"}`,
          fontFamily: T.fontMono, fontSize: 10, fontWeight: 600,
          letterSpacing: "0.1em", textTransform: "uppercase",
          flexShrink: 0, whiteSpace: "nowrap",
        }}
      >{s === "all" ? "ALL" : s.replace("-", " ")}</button>
    ))}
    <div style={{ flex: 1, minWidth: 0 }} />
    {level !== "stage1" && (
      <button onClick={() => setFilters({ ...filters, slaBreach: !filters.slaBreach })}
        style={{
          padding: "4px 10px", borderRadius: 3, cursor: "pointer",
          background: filters.slaBreach ? `${T.slaBreach}22` : "transparent",
          color: filters.slaBreach ? T.slaBreach : T.inkMuted,
          border: `1px solid ${filters.slaBreach ? T.slaBreach : T.divider}`,
          fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
          letterSpacing: "0.12em", textTransform: "uppercase",
          display: "flex", alignItems: "center", gap: 4,
          flexShrink: 0, whiteSpace: "nowrap",
        }}
      >
        <AlertCircle size={11} />
        {isMobile ? "BREACH" : "SLA BREACH ONLY"}
      </button>
    )}
  </div>
);

const TicketRow = ({ ticket, onOpen, selected, isMobile, onQuickAssign, onQuickResolve }) => {
  const customer = customerById(ticket.customerId);
  const assignee = analystById(ticket.assigneeId);

  // Swipe state — mobile only. No-op on desktop.
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchMoved = useRef(false);

  // Commit threshold: 30% of row width (~120px on iPhone). Below = snap back.
  const COMMIT_PX = 120;
  const MAX_SWIPE = 200;

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchMoved.current = false;
    setSwiping(true);
  };

  const onTouchMove = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    // Only horizontal — if the user is scrolling vertically, abandon the swipe
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      touchStartX.current = null;
      setSwipeX(0);
      setSwiping(false);
      return;
    }
    if (Math.abs(dx) > 6) touchMoved.current = true;
    // Clamp swipe so it doesn't fly off screen
    const clamped = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, dx));
    setSwipeX(clamped);
  };

  const onTouchEnd = () => {
    if (touchStartX.current == null) { setSwiping(false); return; }
    if (swipeX >= COMMIT_PX) {
      // Swipe-right committed → assign to me (orange)
      if (onQuickAssign) onQuickAssign(ticket.id);
    } else if (swipeX <= -COMMIT_PX) {
      // Swipe-left committed → resolve (sage green)
      if (onQuickResolve && ticket.status !== "resolved") onQuickResolve(ticket.id);
    }
    // Always snap back — if we committed, the list will re-render with new state
    setSwipeX(0);
    setSwiping(false);
    touchStartX.current = null;
  };

  const handleClick = (e) => {
    // Suppress click if the finger actually swiped (prevents accidental open-ticket)
    if (touchMoved.current) {
      e.preventDefault();
      e.stopPropagation();
      touchMoved.current = false;
      return;
    }
    onOpen(ticket);
  };

  if (isMobile) {
    // Action-zone hints revealed behind the row as it swipes
    const showAssignZone = swipeX > 20;
    const showResolveZone = swipeX < -20;
    const assignOpacity = Math.min(1, swipeX / COMMIT_PX);
    const resolveOpacity = Math.min(1, -swipeX / COMMIT_PX);

    return (
      <div style={{
        position: "relative",
        borderBottom: `1px solid ${T.divider}`,
        overflow: "hidden",
        background: T.bg,
      }}>
        {/* Action zone — right swipe reveals ASSIGN ME (orange, left edge) */}
        {showAssignZone && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "flex-start",
            paddingLeft: 22, pointerEvents: "none",
            background: `rgba(210,105,30,${0.12 + assignOpacity * 0.18})`,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              opacity: assignOpacity,
              transform: `scale(${0.85 + assignOpacity * 0.15})`,
              transition: "transform 80ms ease",
            }}>
              <UserPlus size={20} style={{ color: T.orange }} />
              <span style={{
                fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
                letterSpacing: "0.2em", color: T.orange, textTransform: "uppercase",
              }}>
                {swipeX >= COMMIT_PX ? "Release to assign" : "Assign me"}
              </span>
            </div>
          </div>
        )}
        {/* Action zone — left swipe reveals RESOLVE (sage green, right edge) */}
        {showResolveZone && ticket.status !== "resolved" && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            paddingRight: 22, pointerEvents: "none",
            background: `rgba(91,143,111,${0.12 + resolveOpacity * 0.18})`,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              opacity: resolveOpacity,
              transform: `scale(${0.85 + resolveOpacity * 0.15})`,
              transition: "transform 80ms ease",
            }}>
              <span style={{
                fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
                letterSpacing: "0.2em", color: T.slaOk, textTransform: "uppercase",
              }}>
                {swipeX <= -COMMIT_PX ? "Release to resolve" : "Resolve"}
              </span>
              <Check size={20} style={{ color: T.slaOk }} />
            </div>
          </div>
        )}

        <div
          onClick={handleClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          style={{
            padding: "14px 16px", cursor: "pointer",
            background: selected ? T.bgElevated : T.bg,
            borderLeft: `3px solid ${selected ? T.orange : "transparent"}`,
            transform: `translateX(${swipeX}px)`,
            transition: swiping ? "none" : "transform 220ms cubic-bezier(0.2, 0.9, 0.3, 1)",
            position: "relative", zIndex: 1,
          }}
        >
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
            flexWrap: "wrap",
          }}>
            <span style={{
              fontFamily: T.fontMono, fontSize: 11, color: T.ink, fontWeight: 600,
            }}>{ticket.id}</span>
            <SevBadge sev={ticket.severity} />
            <div style={{ flex: 1 }} />
            <AnalystAvatar analyst={assignee} size={22} />
          </div>
          <div style={{
            fontFamily: T.fontBody, fontSize: 14, color: T.ink, fontWeight: 500,
            lineHeight: 1.35, marginBottom: 8,
          }}>{ticket.subject}</div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
          }}>
            <StatusPill status={ticket.status} />
            <SlaPill createdAt={ticket.createdAt} severity={ticket.severity} />
          </div>
          <div style={{
            fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted, marginTop: 6,
          }}>
            {customer.name} · {fmtAgo(ticket.createdAt)}
            {ticket.source === "snypr" && ticket.snyprIncidentId && (
              <span style={{ color: T.orange }}> · snypr:{ticket.snyprIncidentId}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onOpen(ticket)}
      style={{
        padding: "14px 18px",
        cursor: "pointer",
        borderBottom: `1px solid ${T.divider}`,
        background: selected ? T.bgElevated : "transparent",
        borderLeft: `3px solid ${selected ? T.orange : "transparent"}`,
        transition: "background 120ms ease",
      }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = T.bgCard; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Row 1: id + severity + time + avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.ink, fontWeight: 600 }}>
          {ticket.id}
        </div>
        <SevBadge sev={ticket.severity} />
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted }}>
          {fmtAgo(ticket.createdAt)}
        </div>
        <AnalystAvatar analyst={assignee} size={24} />
      </div>

      {/* Row 2: subject — the scannable line */}
      <div style={{
        fontFamily: T.fontBody, fontSize: 16, color: T.ink, fontWeight: 600,
        lineHeight: 1.32, marginBottom: 8,
      }}>
        {ticket.subject}
      </div>

      {/* Row 3: status + SLA pills */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
        <StatusPill status={ticket.status} />
        <SlaPill createdAt={ticket.createdAt} severity={ticket.severity} />
      </div>

      {/* Row 4: customer + source */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted,
      }}>
        <span>{customer.name}</span>
        {ticket.source === "snypr" && ticket.snyprIncidentId && (
          <span style={{ color: T.orange }}>· snypr:{ticket.snyprIncidentId}</span>
        )}
        {ticket.source === "email" && <span style={{ color: T.steel }}>· email</span>}
      </div>
    </div>
  );
};

const QueueView = ({ tickets, filters, setFilters, onOpen, selectedId, level, isMobile, onQuickAssign, onQuickResolve }) => {
  const filtered = useMemo(() => {
    let list = tickets;
    if (filters.status !== "all") list = list.filter((t) => t.status === filters.status);
    if (filters.slaBreach) list = list.filter((t) => slaState(t.createdAt, t.severity) === "breach");
    // Severity-primary sort: CRIT > HIGH > MED > LOW, then newest-first within each tier.
    // Resolved tickets sink to bottom via sortKey offset.
    return [...list].sort((a, b) => {
      const keyA = sortKey(a);
      const keyB = sortKey(b);
      if (keyA !== keyB) return keyA - keyB;
      return b.createdAt - a.createdAt;
    });
  }, [tickets, filters]);

  return (
    <div>
      <QueueFilters filters={filters} setFilters={setFilters} level={level} isMobile={isMobile} />
      {!isMobile && (
        <div style={{
          padding: "10px 18px",
          borderBottom: `1px solid ${T.divider}`,
          fontFamily: T.fontMono, fontSize: 9, fontWeight: 700,
          letterSpacing: "0.18em", color: T.inkMuted, textTransform: "uppercase",
        }}>
          Active queue
        </div>
      )}
      <div>
        {filtered.map((t) => (
          <TicketRow
            key={t.id}
            ticket={t}
            onOpen={onOpen}
            selected={t.id === selectedId}
            isMobile={isMobile}
            onQuickAssign={onQuickAssign}
            onQuickResolve={onQuickResolve}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{
            padding: 60, textAlign: "center", color: T.inkMuted,
            fontFamily: T.fontBody, fontSize: 14,
          }}>
            No tickets match these filters.
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================
 * TICKET DETAIL + EMAIL THREAD
 * ============================================================ */

const EventRow = ({ event }) => {
  const author = analystById(event.authorId);

  const styles = {
    "snypr-ingest": {
      icon: <Zap size={12} />, color: T.orange,
      label: "SNYPR INGEST",
    },
    "email-in": {
      icon: <Mail size={12} />, color: T.steel,
      label: `EMAIL IN · from ${event.from || "customer"}`,
    },
    "email-out": {
      icon: <Send size={12} />, color: T.slaOk,
      label: `EMAIL OUT · to ${event.to || "customer"}${author ? ` · ${author.name}` : ""}`,
    },
    "note-internal": {
      icon: <Tag size={12} />, color: T.sevHigh,
      label: `INTERNAL NOTE${author ? ` · ${author.name}` : ""}`,
    },
    "status-change": {
      icon: <CheckCircle2 size={12} />, color: T.inkMuted,
      label: `STATUS${author ? ` · ${author.name}` : ""}`,
    },
  };
  const s = styles[event.type] || styles["note-internal"];

  return (
    <div style={{ padding: "12px 22px", borderBottom: `1px solid ${T.divider}` }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
        fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.15em",
        color: s.color, textTransform: "uppercase", fontWeight: 700,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 3,
          background: `${s.color}22`, display: "flex",
          alignItems: "center", justifyContent: "center", color: s.color,
        }}>{s.icon}</div>
        {s.label}
        <div style={{ flex: 1 }} />
        <span style={{ color: T.inkMuted, fontSize: 10 }}>{fmtAgo(event.at)}</span>
      </div>
      <div style={{
        fontFamily: T.fontBody, fontSize: 13, color: T.ink,
        paddingLeft: 32, lineHeight: 1.55,
        background: event.type === "note-internal" ? "rgba(212,165,116,0.05)" : "transparent",
        padding: event.type === "note-internal" ? "10px 14px 10px 32px" : "0 0 0 32px",
        borderLeft: event.type === "note-internal" ? `2px solid ${T.sevHigh}` : "none",
        borderRadius: event.type === "note-internal" ? 3 : 0,
      }}>
        {event.text || event.body}
      </div>
    </div>
  );
};

/* Compact metric display for the case-metrics rail in TicketDetail.
   Replaces the old always-on right Sidebar with inline, contextual operational data. */
const CaseMetric = ({ label, value, valueColor, mono }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
    <div style={{
      fontFamily: "Consolas, Monaco, monospace", fontSize: 9, letterSpacing: "0.18em",
      color: "#6B7D91", textTransform: "uppercase", fontWeight: 700,
    }}>
      {label}
    </div>
    <div style={{
      fontFamily: mono ? "Consolas, Monaco, monospace" : 'Calibri, "Segoe UI", system-ui, sans-serif',
      fontSize: 13, color: valueColor || "#E8EEF4", fontWeight: 600,
      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200,
    }}>
      {value}
    </div>
  </div>
);

const TicketDetail = ({ ticket, level, onClose, onCompose, onAssign, isMobile }) => {
  const customer = customerById(ticket.customerId);
  const assignee = analystById(ticket.assigneeId);
  const events = [...ticket.events].sort((a, b) => a.at - b.at);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      background: T.bg, borderLeft: isMobile ? "none" : `1px solid ${T.divider}`,
    }}>
      {/* Ticket header */}
      <div style={{
        padding: isMobile ? "16px 16px" : "20px 22px",
        borderBottom: `1px solid ${T.divider}`,
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap",
              fontFamily: T.fontMono, fontSize: 11, letterSpacing: "0.15em",
              color: T.orange, fontWeight: 700,
            }}>
              {ticket.id}
              <span style={{ color: T.divider }}>·</span>
              <span style={{ color: T.inkMuted }}>{customer.name}</span>
              {ticket.snyprIncidentId && (
                <>
                  <span style={{ color: T.divider }}>·</span>
                  <span style={{ color: T.steel }}>snypr:{ticket.snyprIncidentId}</span>
                </>
              )}
            </div>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: isMobile ? 19 : 20, color: T.ink,
              lineHeight: 1.2, marginBottom: 8, fontWeight: 700,
            }}>{ticket.subject}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <SevBadge sev={ticket.severity} />
              <StatusPill status={ticket.status} />
              <SlaPill createdAt={ticket.createdAt} severity={ticket.severity} />
            </div>
          </div>
          {!isMobile && (
            <button onClick={onClose} style={{
              background: "transparent", border: `1px solid ${T.divider}`, borderRadius: 3,
              color: T.inkMuted, padding: 6, cursor: "pointer",
            }} title="Close ticket detail">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Stage 2+ inline case-metrics rail (replaces removed persistent sidebar).
            Compact, operational, not a dashboard — three data points Sibe cares about. */}
        {level !== "stage1" && (
          <div style={{
            marginTop: 14, padding: "10px 14px",
            background: T.bgCard, border: `1px solid ${T.divider}`, borderRadius: 4,
            display: "flex", alignItems: "center", gap: isMobile ? 14 : 24, flexWrap: "wrap",
          }}>
            <CaseMetric
              label="Age"
              value={fmtAgo(ticket.createdAt).replace(" ago", "")}
            />
            <CaseMetric
              label="Events"
              value={ticket.events.length}
            />
            <CaseMetric
              label="Source"
              value={ticket.source === "snypr" ? "SNYPR" : "Email"}
              valueColor={ticket.source === "snypr" ? T.orange : T.steel}
            />
            <CaseMetric
              label="Contact"
              value={customer.contact}
              mono
            />
          </div>
        )}

        {/* Assignee row */}
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.divider}`,
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          background: "rgba(255,255,255,0.01)", borderRadius: 4, paddingBottom: 2,
        }}>
          <AnalystAvatar analyst={assignee} size={32} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, letterSpacing: "0.18em" }}>
              ASSIGNEE
            </div>
            <div style={{ fontFamily: T.fontBody, fontSize: 13, color: T.ink, fontWeight: 500 }}>
              {assignee ? `${assignee.name} · ${assignee.role}` : "Unassigned"}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }} />
          {level !== "stage1" && (
            <button onClick={onAssign} style={{
              fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              padding: "6px 12px", borderRadius: 3, cursor: "pointer",
              background: "transparent", color: T.steel,
              border: `1px solid ${T.steelDim}`, textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>REASSIGN</button>
          )}
          {ticket.status !== "resolved" && (
            <button onClick={onCompose} style={{
              fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
              padding: "6px 12px", borderRadius: 3, cursor: "pointer",
              background: T.orange, color: "#fff",
              border: "none", textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>{isMobile ? "REPLY" : "REPLY TO CUSTOMER"}</button>
          )}
        </div>
      </div>

      {/* Event stream */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {events.map((e, i) => <EventRow key={i} event={e} />)}
      </div>
    </div>
  );
};

/* ============================================================
 * COMPOSE MODAL — wrong-client prevention in action
 * This is the single most important feature in the app.
 * ============================================================ */

const ComposeModal = ({ ticket, onClose, onSend, isMobile }) => {
  const customer = customerById(ticket.customerId);
  const [body, setBody] = useState("");
  const [template, setTemplate] = useState("custom");
  const [attempt, setAttempt] = useState(null); // for "did you mean to type another customer?" demo

  const templates = {
    custom: { label: "Custom message", body: "" },
    update: {
      label: "Status update",
      body: `Hi team — wanted to send a quick update on ${ticket.id}. We're actively investigating and will have more detail within the hour.`,
    },
    request: {
      label: "Request information",
      body: `Hi team — regarding ${ticket.id}, we need the following information from your side to continue the investigation:\n\n- \n\nThanks.`,
    },
    resolve: {
      label: "Mark resolved",
      body: `Hi team — ${ticket.id} is now resolved. Summary of actions taken:\n\n- \n\nLet us know if you have any questions.`,
    },
  };

  const pickTemplate = (key) => {
    setTemplate(key);
    setBody(templates[key].body);
  };

  // The wrong-client guard: if the body text contains another customer's name, warn.
  const otherCustomers = CUSTOMERS.filter((c) => c.id !== ticket.customerId);
  const hasWrongCustomer = otherCustomers.find((c) =>
    body.toLowerCase().includes(c.name.toLowerCase()) ||
    body.toLowerCase().includes(c.domain.toLowerCase())
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(10,22,40,0.85)",
      backdropFilter: "blur(6px)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: isMobile ? 0 : 30,
    }}>
      <div style={{
        background: T.bgCard, border: `1px solid ${T.bgCardEdge}`,
        borderRadius: isMobile ? 0 : 6,
        width: "100%", maxWidth: isMobile ? "100%" : 720,
        maxHeight: isMobile ? "100%" : "90vh",
        height: isMobile ? "100%" : "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 22px", borderBottom: `1px solid ${T.bgCardEdge}`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Lock size={14} style={{ color: T.orange }} />
          <div style={{
            fontFamily: T.fontMono, fontSize: 11, letterSpacing: "0.2em",
            color: T.ink, fontWeight: 700, textTransform: "uppercase", flex: 1,
          }}>Compose reply · {ticket.id}</div>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: T.inkMuted, cursor: "pointer",
          }}><X size={16} /></button>
        </div>

        {/* LOCKED CONTEXT FIELDS — the wrong-client prevention */}
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${T.bgCardEdge}` }}>
          {[
            { label: "CUSTOMER", value: `${customer.name} (${customer.id})` },
            { label: "TO", value: customer.contact },
            { label: "SUBJECT", value: `[${ticket.id}] ${ticket.subject}` },
          ].map((f) => (
            <div key={f.label} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
              background: T.bgElevated, border: `1px solid ${T.bgCardEdge}`,
              borderRadius: 3, marginBottom: 8,
            }}>
              <div style={{
                fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.18em",
                color: T.inkMuted, fontWeight: 700, minWidth: 80,
              }}>{f.label}</div>
              <div style={{
                fontFamily: T.fontBody, fontSize: 13, color: T.ink,
                fontWeight: 500, flex: 1,
              }}>{f.value}</div>
              <div style={{
                fontFamily: T.fontMono, fontSize: 9, color: T.orange,
                letterSpacing: "0.14em", fontWeight: 700, display: "flex",
                alignItems: "center", gap: 4,
              }}>
                <Lock size={9} />
                LOCKED · FROM TICKET
              </div>
            </div>
          ))}
          <div style={{
            fontFamily: T.fontBody, fontSize: 11, color: T.inkMuted, fontStyle: "italic",
            marginTop: 8,
          }}>
            Customer, recipient, and ticket reference are bound to the ticket record. They cannot be edited.
            Only the message body below accepts input.
          </div>
        </div>

        {/* Template picker */}
        <div style={{
          padding: "12px 22px", borderBottom: `1px solid ${T.bgCardEdge}`,
          display: "flex", gap: 6, flexWrap: "wrap",
        }}>
          <div style={{
            fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.2em",
            color: T.inkMuted, fontWeight: 700, marginRight: 6,
            display: "flex", alignItems: "center",
          }}>TEMPLATE</div>
          {Object.entries(templates).map(([k, v]) => (
            <button key={k} onClick={() => pickTemplate(k)} style={{
              padding: "4px 10px", borderRadius: 3, cursor: "pointer",
              background: template === k ? T.bgElevated : "transparent",
              color: template === k ? T.orange : T.inkDim,
              border: `1px solid ${template === k ? T.orange : T.divider}`,
              fontFamily: T.fontMono, fontSize: 10, fontWeight: 600,
              letterSpacing: "0.1em",
            }}>{v.label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: "16px 22px", flex: 1, minHeight: 180 }}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message here. Customer context is locked from the ticket above."
            style={{
              width: "100%", minHeight: 160, resize: "vertical",
              background: T.bg, border: `1px solid ${T.bgCardEdge}`, borderRadius: 3,
              color: T.ink, fontFamily: T.fontBody, fontSize: 14, lineHeight: 1.55,
              padding: 14, outline: "none",
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = T.steel}
            onBlur={(e) => e.currentTarget.style.borderColor = T.bgCardEdge}
          />
          {/* Body-level wrong-client warning */}
          {hasWrongCustomer && (
            <div style={{
              marginTop: 12, padding: "10px 14px",
              background: `${T.slaBreach}11`, border: `1px solid ${T.slaBreach}55`,
              borderRadius: 3, display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <AlertCircle size={14} style={{ color: T.slaBreach, marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{
                  fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.15em",
                  color: T.slaBreach, fontWeight: 700, textTransform: "uppercase", marginBottom: 4,
                }}>Wrong-customer content detected</div>
                <div style={{ fontFamily: T.fontBody, fontSize: 12, color: T.ink }}>
                  This message mentions <strong>{hasWrongCustomer.name}</strong>, but this ticket is for{" "}
                  <strong>{customer.name}</strong>. Review before sending.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{
          padding: "14px 22px", borderTop: `1px solid ${T.bgCardEdge}`,
          display: "flex", gap: 10, justifyContent: "flex-end",
        }}>
          <button onClick={onClose} style={{
            padding: "8px 16px", borderRadius: 3, cursor: "pointer",
            background: "transparent", color: T.inkDim, border: `1px solid ${T.divider}`,
            fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>CANCEL</button>
          <button
            onClick={() => onSend(body)}
            disabled={body.trim().length < 4 || hasWrongCustomer}
            style={{
              padding: "8px 16px", borderRadius: 3,
              cursor: (body.trim().length < 4 || hasWrongCustomer) ? "not-allowed" : "pointer",
              background: (body.trim().length < 4 || hasWrongCustomer) ? T.divider : T.orange,
              color: "#fff", border: "none",
              fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Send size={11} /> SEND TO CUSTOMER
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
 * ASSIGN MODAL (L2+)
 * ============================================================ */
const AssignModal = ({ ticket, onClose, onAssign, isMobile }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(10,22,40,0.85)",
    backdropFilter: "blur(6px)", zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: isMobile ? 16 : 30,
  }}>
    <div style={{
      background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 6,
      width: "100%", maxWidth: 460, padding: isMobile ? 18 : 22,
    }}>
      <div style={{
        fontFamily: T.fontMono, fontSize: 11, letterSpacing: "0.2em",
        color: T.orange, fontWeight: 700, textTransform: "uppercase", marginBottom: 8,
      }}>Reassign · {ticket.id}</div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 20, color: T.ink, marginBottom: 20,
      }}>Hand this ticket to another analyst</div>
      <div style={{ display: "grid", gap: 8 }}>
        {ANALYSTS.map((a) => (
          <button key={a.id} onClick={() => onAssign(a.id)} style={{
            display: "flex", alignItems: "center", gap: 12, padding: 14,
            background: T.bgElevated, border: `1px solid ${T.bgCardEdge}`,
            borderRadius: 4, cursor: "pointer", textAlign: "left",
            transition: "all 120ms ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = T.orange}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = T.bgCardEdge}
          >
            <AnalystAvatar analyst={a} size={32} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.fontBody, fontSize: 14, color: T.ink, fontWeight: 500 }}>{a.name}</div>
              <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted, letterSpacing: "0.1em" }}>{a.role}</div>
            </div>
            <ChevronRight size={14} style={{ color: T.inkMuted }} />
          </button>
        ))}
      </div>
      <button onClick={onClose} style={{
        marginTop: 16, width: "100%", padding: 10, background: "transparent",
        color: T.inkDim, border: `1px solid ${T.divider}`, borderRadius: 3, cursor: "pointer",
        fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
      }}>CANCEL</button>
    </div>
  </div>
);

/* ============================================================
 * SNYPR INGEST PANEL (L3 only)
 * Simulates the analyst-initiated flow: analyst triages in SNYPR,
 * clicks "open ticket", payload POSTs to Sentry, ticket appears.
 * ============================================================ */

const SnyprPanel = ({ backlog, onOpenTicket, isMobile }) => {
  return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 4,
      padding: isMobile ? "14px 14px" : "16px 18px",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 3,
          background: "rgba(107,147,184,0.14)", color: T.steel,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><Zap size={12} /></div>
        <div style={{
          fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.2em",
          color: T.steel, fontWeight: 700, textTransform: "uppercase", flex: 1,
        }}>
          Securonix SNYPR · Incident Queue
        </div>
        <div style={{
          fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, letterSpacing: "0.14em",
        }}>SIMULATED</div>
      </div>
      <div style={{
        fontFamily: T.fontBody, fontSize: 12, color: T.inkDim, marginBottom: 14,
        lineHeight: 1.55,
      }}>
        Sibe's team triages incidents in SNYPR. Incidents that need customer communication
        get escalated by clicking <span style={{ color: T.orange, fontWeight: 600 }}>"Open ticket"</span> —
        this fires the SNYPR SOAR Python playbook, which POSTs the incident to the Sentry ticket API.
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {backlog.map((inc) => {
          const cust = customerById(inc.customerId);
          return (
            <div key={inc.id} style={{
              padding: "12px 14px", background: T.bgElevated,
              border: `1px solid ${T.bgCardEdge}`, borderRadius: 3,
              borderLeft: `3px solid ${T.steel}`,
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 4,
                fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.12em",
              }}>
                <span style={{ color: T.steel, fontWeight: 700 }}>{inc.id}</span>
                <span style={{ color: T.divider }}>·</span>
                <SevBadge sev={inc.severity} />
                <span style={{ color: T.divider }}>·</span>
                <span style={{ color: T.inkMuted }}>{cust.name}</span>
                <span style={{ color: T.divider }}>·</span>
                <span style={{ color: T.inkMuted }}>{fmtAgo(inc.at)}</span>
              </div>
              <div style={{
                fontFamily: T.fontBody, fontSize: 13, color: T.ink, fontWeight: 500, marginBottom: 6,
              }}>{inc.title}</div>
              <div style={{
                fontFamily: T.fontBody, fontSize: 11, color: T.inkMuted, marginBottom: 10,
              }}>{inc.details}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onOpenTicket(inc)} style={{
                  padding: "5px 10px", borderRadius: 3, cursor: "pointer",
                  background: T.orange, color: "#fff", border: "none",
                  fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Plus size={10} /> OPEN TICKET
                </button>
                <button style={{
                  padding: "5px 10px", borderRadius: 3, cursor: "pointer",
                  background: "transparent", color: T.inkMuted, border: `1px solid ${T.divider}`,
                  fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}>SUPPRESS</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* NOTE: The old persistent right-edge Sidebar was removed in the inbox-rebuild.
   Queue health + by-customer metrics it used to show now live inline in TicketDetail's
   CaseMetric rail (Stage 2+). If full dashboard-style queue health is desired later,
   that's a Phase 2 ask documented in SCOPE_AUDIT.md — not a persistent UI surface. */

/* ============================================================
 * TOAST
 * ============================================================ */
const Toast = ({ message, visible }) => (
  <div style={{
    position: "fixed", bottom: 20, right: 20, zIndex: 200,
    background: T.bgElevated, border: `1px solid ${T.orange}`, borderRadius: 4,
    padding: "12px 18px", boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
    fontFamily: T.fontMono, fontSize: 11, letterSpacing: "0.12em",
    color: T.ink, fontWeight: 700,
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(8px)",
    transition: "all 200ms ease",
    pointerEvents: visible ? "auto" : "none",
  }}>
    <CheckCircle2 size={12} style={{ color: T.orange, marginRight: 8, verticalAlign: "middle" }} />
    {message}
  </div>
);

/* ============================================================
 * ROOT APP
 * ============================================================ */

export default function SentryConsole() {
  const [stage, setStage] = useState("stage2");
  const [activeView, setActiveView] = useState("tickets"); // "tickets" | "snypr"
  const [tickets, setTickets] = useState(TICKETS);
  const [backlog, setBacklog] = useState(SNYPR_BACKLOG);
  const [selectedId, setSelectedId] = useState(TICKETS[0].id);
  const [filters, setFilters] = useState({ status: "all", slaBreach: false });
  const [composeOpen, setComposeOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const isMobile = useIsMobile();
  // On mobile, user navigates between panes. Desktop shows everything at once.
  const [mobilePane, setMobilePane] = useState("queue"); // "snypr" | "queue" | "detail"

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 2200);
  };

  const selectedTicket = tickets.find((t) => t.id === selectedId);

  const handleSend = (body) => {
    setTickets((ts) => ts.map((t) => t.id === selectedTicket.id
      ? { ...t, status: "awaiting-customer", events: [...t.events, {
          type: "email-out", at: Date.now(), authorId: "sibe",
          to: customerById(t.customerId).contact, body,
        }] }
      : t
    ));
    setComposeOpen(false);
    showToast(`Reply sent · ${selectedTicket.id}`);
  };

  const handleAssign = (assigneeId) => {
    setTickets((ts) => ts.map((t) => t.id === selectedTicket.id ? { ...t, assigneeId } : t));
    setAssignOpen(false);
    showToast(`Assigned to ${analystById(assigneeId).name}`);
  };

  // Swipe quick-actions (mobile) — same state transitions as the modal/detail-pane
  // buttons, just triggered by thumb gesture. No scoring, no feedback, no learning.
  const handleQuickAssignToMe = (ticketId) => {
    setTickets((ts) => ts.map((t) => t.id === ticketId ? { ...t, assigneeId: "sibe" } : t));
    showToast(`${ticketId} assigned to you`);
  };

  const handleQuickResolve = (ticketId) => {
    setTickets((ts) => ts.map((t) => t.id === ticketId
      ? { ...t, status: "resolved", events: [...t.events, {
          type: "status-change", at: Date.now(), authorId: "sibe",
          text: "Resolved via swipe",
        }] }
      : t));
    showToast(`${ticketId} resolved`);
  };

  const handleOpenFromSnypr = (inc) => {
    const newId = `VDA-${1848 + (TICKETS.length - 12)}`;
    const newTicket = {
      id: newId, customerId: inc.customerId, severity: inc.severity,
      subject: inc.title, source: "snypr", snyprIncidentId: inc.id,
      assigneeId: "sibe", status: "in-progress", createdAt: Date.now(),
      events: [
        { type: "snypr-ingest", at: Date.now(),
          text: `SNYPR incident ${inc.id} opened by analyst — ${inc.details}` },
      ],
    };
    setTickets((ts) => [newTicket, ...ts]);
    setBacklog((b) => b.filter((x) => x.id !== inc.id));
    setSelectedId(newId);
    if (isMobile) setMobilePane("detail");
    showToast(`Ticket created · ${newId} from ${inc.id}`);
  };

  // Ensure selectedId stays valid if ticket list changes
  useEffect(() => {
    if (!tickets.find((t) => t.id === selectedId) && tickets.length > 0) {
      setSelectedId(tickets[0].id);
    }
  }, [tickets, selectedId]);

  // Reset mobile pane if stage changes away from stage3 while viewing snypr
  useEffect(() => {
    if (stage !== "stage3" && mobilePane === "snypr") setMobilePane("queue");
  }, [stage, mobilePane]);

  // Desktop hardening: if user leaves stage3 while on the SNYPR view, fall back to Tickets
  // so the main pane never goes blank.
  useEffect(() => {
    if (stage !== "stage3" && activeView === "snypr") setActiveView("tickets");
  }, [stage, activeView]);

  const onOpenTicket = (t) => {
    setSelectedId(t.id);
    if (isMobile) setMobilePane("detail");
  };

  const pulse = `@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`;

  // ============================================================
  // MOBILE LAYOUT — single pane with tabs
  // ============================================================
  if (isMobile) {
    return (
      <div style={{
        minHeight: "100vh", background: T.bg, color: T.ink,
        fontFamily: T.fontBody, fontSize: 14,
      }}>
        <style>{pulse}</style>
        <Header stage={stage} setStage={setStage} activeView={activeView} setActiveView={setActiveView} />

        {/* Mobile pane nav — only show SNYPR tab at Stage 3 */}
        <div style={{
          display: "flex", borderBottom: `1px solid ${T.divider}`, background: T.bg,
          position: "sticky", top: 0, zIndex: 5,
        }}>
          {stage === "stage3" && (
            <button onClick={() => setMobilePane("snypr")} style={{
              flex: 1, padding: "12px 8px", cursor: "pointer",
              background: mobilePane === "snypr" ? T.bgCard : "transparent",
              color: mobilePane === "snypr" ? T.orange : T.inkMuted,
              border: "none",
              borderBottom: `2px solid ${mobilePane === "snypr" ? T.orange : "transparent"}`,
              fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <Zap size={11} /> SNYPR · {backlog.length}
            </button>
          )}
          <button onClick={() => setMobilePane("queue")} style={{
            flex: 1, padding: "12px 8px", cursor: "pointer",
            background: mobilePane === "queue" ? T.bgCard : "transparent",
            color: mobilePane === "queue" ? T.orange : T.inkMuted,
            border: "none",
            borderBottom: `2px solid ${mobilePane === "queue" ? T.orange : "transparent"}`,
            fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <Inbox size={11} /> Queue · {tickets.filter(t => t.status !== "resolved").length}
          </button>
          <button onClick={() => setMobilePane("detail")} disabled={!selectedTicket} style={{
            flex: 1, padding: "12px 8px", cursor: selectedTicket ? "pointer" : "not-allowed",
            background: mobilePane === "detail" ? T.bgCard : "transparent",
            color: mobilePane === "detail" ? T.orange : (selectedTicket ? T.inkMuted : T.divider),
            border: "none",
            borderBottom: `2px solid ${mobilePane === "detail" ? T.orange : "transparent"}`,
            fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <ChevronRight size={11} /> Ticket
          </button>
        </div>

        {/* Pane content */}
        {mobilePane === "snypr" && stage === "stage3" && (
          <div style={{ padding: 14 }}>
            <SnyprPanel backlog={backlog} onOpenTicket={handleOpenFromSnypr} isMobile={isMobile} />
          </div>
        )}
        {mobilePane === "queue" && (
          <div style={{ minHeight: "calc(100vh - 170px)" }}>
            <QueueView
              tickets={tickets} filters={filters} setFilters={setFilters}
              onOpen={onOpenTicket} selectedId={selectedId} level={stage} isMobile={isMobile}
              onQuickAssign={handleQuickAssignToMe}
              onQuickResolve={handleQuickResolve}
            />
          </div>
        )}
        {mobilePane === "detail" && selectedTicket && (
          <div style={{ minHeight: "calc(100vh - 170px)" }}>
            <TicketDetail
              ticket={selectedTicket} level={stage} isMobile={isMobile}
              onClose={() => setMobilePane("queue")}
              onCompose={() => setComposeOpen(true)}
              onAssign={() => setAssignOpen(true)}
            />
          </div>
        )}

        {composeOpen && selectedTicket && (
          <ComposeModal
            ticket={selectedTicket} isMobile={isMobile}
            onClose={() => setComposeOpen(false)} onSend={handleSend}
          />
        )}
        {assignOpen && selectedTicket && (
          <AssignModal
            ticket={selectedTicket} isMobile={isMobile}
            onClose={() => setAssignOpen(false)} onAssign={handleAssign}
          />
        )}
        <Toast visible={toast.visible} message={toast.message} />
      </div>
    );
  }

  // ============================================================
  // DESKTOP LAYOUT — full side-by-side
  // ============================================================
  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.ink,
      fontFamily: T.fontBody, fontSize: 14,
    }}>
      <style>{pulse}</style>
      <Header stage={stage} setStage={setStage} activeView={activeView} setActiveView={setActiveView} />

      {/* SNYPR Ingest view — full-screen separate view on desktop */}
      {activeView === "snypr" && stage === "stage3" && (
        <div style={{
          height: "calc(100vh - 48px)", overflowY: "auto",
          padding: "20px 24px", maxWidth: 900, margin: "0 auto", width: "100%",
        }}>
          <div style={{
            fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.2em",
            color: T.orange, fontWeight: 700, textTransform: "uppercase",
            marginBottom: 8,
          }}>STAGE 3 · SNYPR Ingest Simulation</div>
          <div style={{
            fontFamily: T.fontBody, fontSize: 14, color: T.inkDim, marginBottom: 20, lineHeight: 1.5,
          }}>
            Demo view of how SNYPR incidents appear in the bridge before an analyst opens a ticket.
            In production, Sibe's team writes the SOAR playbook on the SNYPR side; Sentry receives the webhook.
          </div>
          <SnyprPanel backlog={backlog} onOpenTicket={(inc) => {
            handleOpenFromSnypr(inc);
            setActiveView("tickets");
          }} isMobile={false} />
        </div>
      )}

      {/* Tickets view — rail + workspace (not pane + pane).
          Rail: 420px fixed, feels like an inbox.
          Workspace: 1fr fluid, feels like the place you actually work. */}
      {activeView === "tickets" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "420px 1fr",
          height: "calc(100vh - 48px)",
        }}>
          <div style={{ overflowY: "auto", borderRight: `1px solid ${T.divider}`, background: T.bg }}>
            <QueueView
              tickets={tickets} filters={filters} setFilters={setFilters}
              onOpen={onOpenTicket} selectedId={selectedId} level={stage} isMobile={false}
              onQuickAssign={handleQuickAssignToMe}
              onQuickResolve={handleQuickResolve}
            />
          </div>

          <div style={{ overflow: "hidden", position: "relative", background: T.bg }}>
            {selectedTicket ? (
              <TicketDetail
                ticket={selectedTicket} level={stage} isMobile={false}
                onClose={() => setSelectedId(null)}
                onCompose={() => setComposeOpen(true)}
                onAssign={() => setAssignOpen(true)}
              />
            ) : (
              <div style={{
                height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                color: T.inkMuted, fontFamily: T.fontBody, fontSize: 14,
              }}>
                Select a ticket from the queue to open its case.
              </div>
            )}
          </div>
        </div>
      )}

      {composeOpen && selectedTicket && (
        <ComposeModal
          ticket={selectedTicket} isMobile={false}
          onClose={() => setComposeOpen(false)}
          onSend={handleSend}
        />
      )}
      {assignOpen && selectedTicket && (
        <AssignModal
          ticket={selectedTicket} isMobile={false}
          onClose={() => setAssignOpen(false)}
          onAssign={handleAssign}
        />
      )}
      <Toast visible={toast.visible} message={toast.message} />
    </div>
  );
}
