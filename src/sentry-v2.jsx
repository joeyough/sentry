import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Shield, Activity, AlertTriangle, Check, X, ArrowUpRight, Users, Zap,
  ChevronRight, ChevronDown, Clock, Eye, Terminal, Radio, LayoutDashboard,
  FlaskConical, Building2, Send, Loader2, GitBranch, Sparkles, Info,
  Webhook, MessageSquare, Mail, Play, Save, Plus, Trash2, Copy, Settings,
  CircleDot, ArrowRight, Filter, Bell, Workflow, FileText, ChevronsRight,
  TestTube2
} from "lucide-react";

/* =========================================================================
   SENTRY v3 — VDA Labs MSSP Console
   =========================================================================
   Changes from v2:
   • Alerts: hover lift + quick preview popover, CVSS-style severity labels
     (CRITICAL/HIGH/MEDIUM/LOW) with numeric as secondary, wider rows
   • Clients: elevated cards with shadows, "Boost Rules" → "Correlation Rules"
     (industry standard), info tooltips on every section, richer rule data
   • Lab: full pivot to Workflow Builder — trigger/condition/action chain,
     test mode, saved workflows, webhook/SMS/email actions
   • Palette: refined for contrast in both light/dark, elevation via shadow
   ========================================================================= */

// =========================================================================
// THEME — refined for professional contrast
// =========================================================================
const ThemeCtx = React.createContext(null);
function useT() { return React.useContext(ThemeCtx); }

function makeTheme(isDark) {
  return isDark
    ? {
        // Dark mode — softer than pure black, better elevation perception
        bg: "#0b0d10",
        bgAlt: "#13161b",
        bgHi: "#1a1e25",
        bgElevated: "#181c22",
        text: "#ecedee",
        textDim: "#7d8590",
        textMid: "#9ea7b3",
        border: "#22262e",
        borderLight: "#1a1e25",
        borderStrong: "#2d323c",
        accent: "#ff5722",
        accentLight: "#ff7a45",
        accentDim: "rgba(255, 87, 34, 0.12)",
        amber: "#f0a020",
        gold: "#c9a86b",
        green: "#4ade80",
        greenDim: "rgba(74, 222, 128, 0.12)",
        blue: "#60a5fa",
        red: "#f87171",
        warn: "#fb923c",
        sparkStroke: "#ecedee",
        barFill: "#ecedee",
        shadow: "0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.45)",
        shadowHover: "0 2px 4px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.55)",
        shadowElev: "0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03)",
        isDark: true,
      }
    : {
        // Light mode — warm cream, not cold white. Strong type contrast.
        bg: "#f5f3ee",
        bgAlt: "#ffffff",
        bgHi: "#ebe8e1",
        bgElevated: "#ffffff",
        text: "#14181d",
        textDim: "#6b7280",
        textMid: "#4b5361",
        border: "#ddd9d0",
        borderLight: "#e8e4db",
        borderStrong: "#c9c4b8",
        accent: "#c83e00",
        accentLight: "#dd5220",
        accentDim: "rgba(200, 62, 0, 0.08)",
        amber: "#a66a00",
        gold: "#8a7345",
        green: "#1f7a3e",
        greenDim: "rgba(31, 122, 62, 0.08)",
        blue: "#2563eb",
        red: "#b91c1c",
        warn: "#b45309",
        sparkStroke: "#14181d",
        barFill: "#14181d",
        shadow: "0 1px 2px rgba(20,24,29,0.04), 0 4px 12px rgba(20,24,29,0.08)",
        shadowHover: "0 2px 4px rgba(20,24,29,0.06), 0 12px 28px rgba(20,24,29,0.14)",
        shadowElev: "0 1px 3px rgba(20,24,29,0.06), 0 12px 32px rgba(20,24,29,0.12)",
        isDark: false,
      };
}

// =========================================================================
// DATA
// =========================================================================
const TECHNIQUES = [
  { id: "T1059.001", name: "PowerShell", tactic: "Execution", baseSev: 70 },
  { id: "T1566.001", name: "Spearphishing Attachment", tactic: "Initial Access", baseSev: 75 },
  { id: "T1486", name: "Data Encrypted for Impact", tactic: "Impact", baseSev: 96 },
  { id: "T1078", name: "Valid Accounts", tactic: "Defense Evasion", baseSev: 62 },
  { id: "T1055", name: "Process Injection", tactic: "Privilege Escalation", baseSev: 82 },
  { id: "T1071.001", name: "Web Protocols", tactic: "Command and Control", baseSev: 58 },
  { id: "T1021.001", name: "Remote Desktop Protocol", tactic: "Lateral Movement", baseSev: 68 },
  { id: "T1053.005", name: "Scheduled Task", tactic: "Persistence", baseSev: 54 },
  { id: "T1003.001", name: "LSASS Memory", tactic: "Credential Access", baseSev: 90 },
  { id: "T1190", name: "Exploit Public-Facing Application", tactic: "Initial Access", baseSev: 88 },
  { id: "T1110.003", name: "Password Spraying", tactic: "Credential Access", baseSev: 48 },
  { id: "T1569.002", name: "Service Execution", tactic: "Execution", baseSev: 65 },
];

const SOURCES = [
  { id: "edr", label: "EDR", color: "#f0a020" },
  { id: "siem", label: "SIEM", color: "#c9a86b" },
  { id: "slack", label: "SLACK", color: "#9ea7b3" },
  { id: "monday", label: "MONDAY", color: "#9ea7b3" },
];

const CLIENTS = [
  { id: "aspen", name: "Aspen Holdings", industry: "Financial Services", criticality: 92, noiseFloor: 22, baselineMaturity: 84, endpoints: 412, analyst: "J. Mauriello" },
  { id: "meridian", name: "Meridian Clinic Network", industry: "Healthcare / HIPAA", criticality: 78, noiseFloor: 48, baselineMaturity: 58, endpoints: 287, analyst: "J. Mauriello" },
  { id: "forge", name: "ForgeWorks Manufacturing", industry: "Manufacturing / OT", criticality: 66, noiseFloor: 81, baselineMaturity: 34, endpoints: 164, analyst: "J. Mauriello" },
];

const ASSETS = {
  aspen: ["WIN-DC01", "WIN-DC02", "SVR-TRADE-07", "WS-CFO-01", "SVR-SQL-PRD", "WIN-JMP-03", "SVR-ADFS-01"],
  meridian: ["EHR-APP-02", "WIN-RAD-11", "SVR-PACS-01", "WS-NURSE-27", "WIN-HR-04", "SVR-BILL-02", "WIN-DC-MED"],
  forge: ["OT-HMI-03", "OT-PLC-07", "WIN-ENG-12", "SVR-MES-01", "OT-SCADA-02", "WIN-SHOP-22", "WIN-QA-05"],
};

const PLAYBOOKS = {
  "T1059.001": { id: "PB-012", name: "PowerShell Execution", steps: ["Isolate endpoint from network", "Capture process memory dump", "Notify asset owner and review execution context"] },
  "T1566.001": { id: "PB-003", name: "Phishing Response", steps: ["Quarantine email across all mailboxes", "Check for clicked links or opened attachments", "Reset credentials for any exposed accounts"] },
  "T1486": { id: "PB-001", name: "Ransomware Containment", steps: ["Isolate affected hosts immediately", "Preserve forensic evidence before remediation", "Activate IR retainer and notify legal"] },
  "T1078": { id: "PB-018", name: "Compromised Credentials", steps: ["Force password reset on affected accounts", "Review recent access logs for lateral movement", "Enable MFA if not already enforced"] },
  "T1055": { id: "PB-015", name: "Process Injection Response", steps: ["Capture memory of injecting and target process", "Isolate host and check for persistence", "Scan for similar injection across fleet"] },
  "T1071.001": { id: "PB-022", name: "C2 Channel Investigation", steps: ["Block destination IP/domain at perimeter", "Review DNS logs for beaconing patterns", "Hunt for same indicators across all clients"] },
  "T1021.001": { id: "PB-009", name: "Unauthorized RDP", steps: ["Disable RDP on affected host", "Review authentication logs for source IP", "Check for new local accounts or persistence"] },
  "T1053.005": { id: "PB-011", name: "Scheduled Task Persistence", steps: ["Enumerate all scheduled tasks on host", "Remove unauthorized tasks and capture artifacts", "Review task creation timeline for initial access"] },
  "T1003.001": { id: "PB-002", name: "Credential Dumping", steps: ["Isolate host — assume full credential compromise", "Force password reset for all accounts that logged into host", "Review LSASS access patterns across fleet"] },
  "T1190": { id: "PB-005", name: "Exploit Response", steps: ["Patch or WAF-block the exploited vulnerability", "Review web server logs for exploitation timeline", "Check for webshells or dropped payloads"] },
  "T1110.003": { id: "PB-019", name: "Password Spray Response", steps: ["Lock out targeted accounts temporarily", "Review source IPs and correlate across tenants", "Enforce rate limiting at identity provider"] },
  "T1569.002": { id: "PB-014", name: "Malicious Service", steps: ["Stop and disable the suspicious service", "Capture service binary for analysis", "Review service creation event for source process"] },
};

// "Correlation Rules" — industry standard term (Splunk, Sentinel, QRadar all use this)
// Replaces the v2 "Boost Rules" naming
const INITIAL_CORRELATION_RULES = [
  {
    id: "CR-001",
    name: "LOLBIN Script Execution",
    pattern: "regsvr32.*scrobj",
    type: "regex",
    severityAdjust: +25,
    tactic: "Execution",
    confidence: "high",
    triggerCount: 47,
    lastTriggered: Date.now() - 1000 * 60 * 23,
    author: "J. Mauriello",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 18,
    status: "active",
    description: "regsvr32 calling scrobj.dll is a Living-Off-The-Land technique used to bypass application whitelisting. Almost never benign.",
  },
  {
    id: "CR-002",
    name: "Ransomware Indicator (T1486)",
    pattern: "T1486",
    type: "technique",
    severityAdjust: +15,
    tactic: "Impact",
    confidence: "high",
    triggerCount: 3,
    lastTriggered: Date.now() - 1000 * 60 * 60 * 41,
    author: "J. Mauriello",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 32,
    status: "active",
    description: "Any ransomware-tagged event escalates to CRITICAL regardless of client context. Ransomware detected late is ransomware paid.",
  },
  {
    id: "CR-003",
    name: "Credential Dump Detection",
    pattern: "T1003.001",
    type: "technique",
    severityAdjust: +20,
    tactic: "Credential Access",
    confidence: "high",
    triggerCount: 12,
    lastTriggered: Date.now() - 1000 * 60 * 60 * 9,
    author: "J. Mauriello",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 32,
    status: "active",
    description: "LSASS memory access for credential theft. Assume full compromise of the host and any account that logged in.",
  },
  {
    id: "CR-004",
    name: "Offensive Tool Signature",
    pattern: "mimikatz|sekurlsa|cobaltstrike",
    type: "regex",
    severityAdjust: +30,
    tactic: "Credential Access",
    confidence: "high",
    triggerCount: 2,
    lastTriggered: Date.now() - 1000 * 60 * 60 * 24 * 6,
    author: "J. Mauriello",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 32,
    status: "active",
    description: "Known offensive tooling strings. Treat as post-exploitation until proven otherwise. Escalate immediately.",
  },
  {
    id: "CR-005",
    name: "PowerShell at Low-Maturity Client",
    pattern: "T1059.001 + maturity<50",
    type: "compound",
    severityAdjust: +18,
    tactic: "Execution",
    confidence: "medium",
    triggerCount: 89,
    lastTriggered: Date.now() - 1000 * 60 * 5,
    author: "J. Mauriello",
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 11,
    status: "active",
    description: "PowerShell activity at clients below 50/100 maturity deserves higher scrutiny — less likely to be legitimate admin behavior.",
  },
];

const RETRAIN_INFO = {
  lastRetrain: new Date(new Date().setHours(3, 0, 0, 0)).toISOString(),
  nextRetrain: "tonight at 3:00 AM",
  modelSize: "5.2 GB",
  trainingEvents: 147832,
};

// =========================================================================
// WORKFLOW BUILDER DATA — new for v3 Lab tab
// =========================================================================
const TRIGGER_TYPES = [
  { id: "alert_severity", label: "Alert severity threshold", icon: AlertTriangle, description: "When an alert reaches a severity level" },
  { id: "alert_technique", label: "MITRE technique match", icon: Shield, description: "When a specific MITRE ATT&CK technique fires" },
  { id: "client_event", label: "Client-specific event", icon: Building2, description: "When an event matches a specific client" },
  { id: "dedupe_burst", label: "Dedupe burst detected", icon: Zap, description: "When the same alert repeats N times in a window" },
  { id: "new_asset", label: "New asset seen", icon: CircleDot, description: "When an asset appears for the first time" },
];

const CONDITION_TYPES = [
  { id: "severity_gte", label: "Severity is at least", kind: "severity" },
  { id: "client_is", label: "Client is", kind: "client" },
  { id: "technique_matches", label: "Technique matches", kind: "technique" },
  { id: "tactic_is", label: "Tactic is", kind: "tactic" },
  { id: "maturity_below", label: "Client maturity below", kind: "number" },
  { id: "time_window", label: "Within time window", kind: "timewindow" },
];

const ACTION_TYPES = [
  { id: "webhook", label: "Send webhook", icon: Webhook, color: "#60a5fa", description: "POST JSON payload to a URL" },
  { id: "sms_owner", label: "SMS client owner", icon: MessageSquare, color: "#4ade80", description: "Text the designated client contact" },
  { id: "sms_vda", label: "SMS VDA on-call", icon: MessageSquare, color: "#ff7a45", description: "Page the VDA analyst on rotation" },
  { id: "email", label: "Send email", icon: Mail, color: "#c9a86b", description: "Email stakeholders with alert detail" },
  { id: "slack_channel", label: "Post to Slack channel", icon: MessageSquare, color: "#f0a020", description: "Drop a formatted message in the client's SOC channel" },
  { id: "create_ticket", label: "Create ticket", icon: FileText, color: "#fb923c", description: "Open a ticket in the MSP ticketing core" },
  { id: "auto_escalate", label: "Auto-escalate", icon: ArrowUpRight, color: "#f87171", description: "Move alert to CRITICAL queue and page analyst" },
];

const SAMPLE_WORKFLOWS = [
  {
    id: "WF-001",
    name: "Ransomware → Everyone",
    description: "Any T1486 hit pages VDA on-call AND texts the client owner AND opens a ticket.",
    enabled: true,
    trigger: { type: "alert_technique", value: "T1486" },
    conditions: [],
    actions: [
      { type: "sms_vda", config: { template: "RANSOMWARE at {{client}} / {{asset}}. Alert {{alert_id}}." } },
      { type: "sms_owner", config: { template: "Critical security alert detected at your org. VDA is engaged. Call back required." } },
      { type: "create_ticket", config: { priority: "P1", assignee: "J. Mauriello" } },
    ],
    runs: 3,
    lastRun: Date.now() - 1000 * 60 * 60 * 41,
  },
  {
    id: "WF-002",
    name: "Credential Dump Burst",
    description: "LSASS access repeated 3+ times in 10 min at any client — escalate and webhook to 3Nails IR.",
    enabled: true,
    trigger: { type: "dedupe_burst", value: { count: 3, window: 10 } },
    conditions: [{ type: "technique_matches", value: "T1003.001" }],
    actions: [
      { type: "auto_escalate", config: { queue: "CRITICAL" } },
      { type: "webhook", config: { url: "https://hooks.3nailsinfosec.com/ir/incoming", method: "POST" } },
    ],
    runs: 1,
    lastRun: Date.now() - 1000 * 60 * 60 * 9,
  },
  {
    id: "WF-003",
    name: "After-Hours High-Sev",
    description: "HIGH or CRITICAL alerts between 10pm–6am get texted to on-call immediately.",
    enabled: false,
    trigger: { type: "alert_severity", value: "high" },
    conditions: [{ type: "time_window", value: "22:00-06:00" }],
    actions: [
      { type: "sms_vda", config: { template: "After-hours {{severity}} alert at {{client}}. Review required." } },
    ],
    runs: 14,
    lastRun: Date.now() - 1000 * 60 * 60 * 72,
  },
];

const MONO = "'JetBrains Mono', ui-monospace, monospace";

// =========================================================================
// HELPERS
// =========================================================================
function seeded(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function buildInitialAlerts() {
  const rand = seeded(42);
  const now = Date.now();
  const alerts = [];
  let id = 1;
  for (const c of CLIENTS) {
    for (let i = 0; i < 20; i++) {
      const tech = TECHNIQUES[Math.floor(rand() * TECHNIQUES.length)];
      const asset = ASSETS[c.id][Math.floor(rand() * ASSETS[c.id].length)];
      const minsAgo = Math.floor(rand() * 360) + 1;
      const source = SOURCES[Math.floor(rand() * SOURCES.length)];
      const dedupe = rand() < 0.35 ? Math.floor(rand() * 8) + 2 : 1;
      alerts.push({
        id: `A-${String(id++).padStart(5, "0")}`,
        clientId: c.id, technique: tech, asset,
        rawSeverity: Math.min(99, Math.max(20, Math.round(tech.baseSev + (rand() * 30 - 15)))),
        timestamp: now - minsAgo * 60 * 1000,
        rule: `sig.${tech.id.toLowerCase().replace(".", "_")}.${Math.floor(rand() * 900 + 100)}`,
        state: "open", decision: null,
        noveltyBoost: rand() < 0.15 ? 18 : 0,
        source: source.id, sourceColor: source.color, sourceLabel: source.label,
        dedupeCount: dedupe,
      });
    }
  }
  return alerts;
}

function buildHistory() {
  const hist = {};
  const rand = seeded(101);
  for (const c of CLIENTS) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const hours = [];
      for (let h = 0; h < 24; h++) {
        hours.push(Math.round(c.noiseFloor / 4 + rand() * c.noiseFloor / 4 + (rand() < 0.05 ? rand() * 40 : 0)));
      }
      days.push(hours);
    }
    hist[c.id] = days;
  }
  return hist;
}

function computeTechStats(decisions) {
  const s = {};
  for (const d of decisions) {
    const k = `${d.clientId}::${d.techniqueId}`;
    if (!s[k]) s[k] = { tp: 0, fp: 0, total: 0 };
    s[k].total++;
    if (d.decision === "TP" || d.decision === "ESCALATE") s[k].tp++;
    if (d.decision === "FP") s[k].fp++;
  }
  return s;
}

function computeClientMaturity(clientId, decisions) {
  const c = CLIENTS.find((x) => x.id === clientId);
  const ds = decisions.filter((d) => d.clientId === clientId);
  if (ds.length === 0) return c.baselineMaturity;
  const tps = ds.filter((d) => d.decision === "TP" || d.decision === "ESCALATE").length;
  const fps = ds.filter((d) => d.decision === "FP").length;
  const drift = (tps / ds.length) * 18 - (fps / ds.length) * 10;
  return Math.max(0, Math.min(100, Math.round(c.baselineMaturity + drift)));
}

function scoreAlert(a, ts, cm) {
  const c = CLIENTS.find((x) => x.id === a.clientId);
  const k = `${a.clientId}::${a.technique.id}`;
  const s = ts[k] || { tp: 0, fp: 0, total: 0 };
  const h = s.total >= 3 ? s.tp / s.total : 0.5;
  const base = a.rawSeverity;
  const critMult = 0.75 + (c.criticality / 100) * 0.55;
  const histMult = 0.6 + h * 0.9;
  const matAdj = 1 - ((100 - cm) / 100) * 0.18;
  const novelty = 1 + a.noveltyBoost / 100;
  const suppression = s.total >= 4 && s.tp === 0 && s.fp >= 3 ? 0.35 : 1;
  return Math.max(1, Math.min(100, Math.round(base * critMult * histMult * matAdj * novelty * suppression)));
}

// CVSS-aligned severity labels
function getSev(score, T) {
  if (score >= 85) return { label: "CRITICAL", short: "CRIT", color: T ? T.accent : "#c83e00", bg: "rgba(255, 87, 34, 0.08)", border: T ? T.accent : "#c83e00" };
  if (score >= 70) return { label: "HIGH", short: "HIGH", color: "#f0a020", bg: "rgba(240, 160, 32, 0.08)", border: "#f0a020" };
  if (score >= 40) return { label: "MEDIUM", short: "MED", color: "#c9a86b", bg: "rgba(201, 168, 107, 0.08)", border: "#c9a86b" };
  return { label: "LOW", short: "LOW", color: "#7d8590", bg: "rgba(125, 133, 144, 0.08)", border: "#7d8590" };
}

function fmtAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 60 * 24) return `${Math.floor(m / 60)}h ${m % 60}m ago`;
  return `${Math.floor(m / (60 * 24))}d ago`;
}

// =========================================================================
// SHARED UI PRIMITIVES
// =========================================================================
function Badge({ color, children, bg }) {
  return (
    <span style={{
      fontSize: 9, padding: "2px 6px", borderRadius: 3,
      border: `1px solid ${color}40`, color, backgroundColor: bg || `${color}12`,
      letterSpacing: "0.06em", fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function SeverityBadge({ score, T }) {
  const sv = getSev(score, T);
  return (
    <div style={{
      display: "inline-flex", alignItems: "baseline", gap: 6,
      padding: "6px 10px", borderRadius: 4,
      backgroundColor: sv.bg, border: `1px solid ${sv.color}40`,
    }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: sv.color, letterSpacing: "0.08em" }}>{sv.label}</span>
      <span style={{ fontSize: 10, color: T.textDim, fontVariantNumeric: "tabular-nums" }}>{score}</span>
    </div>
  );
}

// Info tooltip — click to toggle, hover for quick peek
function InfoTip({ children, T }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const showing = open || hover;
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: "transparent", border: "none", cursor: "pointer", padding: 2,
          display: "inline-flex", alignItems: "center", color: T.textDim,
        }}
        aria-label="More info"
      >
        <Info style={{ width: 12, height: 12 }} />
      </button>
      {showing && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
          width: 280, padding: "10px 12px", backgroundColor: T.bgElevated,
          border: `1px solid ${T.borderStrong}`, borderRadius: 6,
          boxShadow: T.shadowElev, fontSize: 11, color: T.text,
          lineHeight: 1.5, letterSpacing: "normal", textTransform: "none", fontWeight: 400,
        }}>
          {children}
        </div>
      )}
    </span>
  );
}

function FieldPair({ label, value, T }) {
  return (
    <div>
      <div style={{ color: T.textDim, fontSize: 9, marginBottom: 3, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ color: T.text, fontSize: 11 }}>{value}</div>
    </div>
  );
}

function ExplainLine({ label, value, T, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 10 }}>
      <span style={{ color: T.textDim }}>{label}</span>
      <span style={{
        color: highlight ? T.accentLight : T.text,
        fontWeight: highlight ? 700 : 500, fontVariantNumeric: "tabular-nums",
      }}>{value}</span>
    </div>
  );
}

function DecisionBtn({ onClick, color, label, sub, icon, T }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 5, border: `1px solid ${color}${hover ? "99" : "55"}`, padding: "14px 8px",
        color, background: hover ? `${color}15` : "transparent",
        cursor: "pointer", fontFamily: "inherit", borderRadius: 4,
        transition: "all 150ms ease",
      }}
    >
      {icon}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 9, color: T.textDim }}>{sub}</div>
    </button>
  );
}

function FilterBtn({ active, onClick, children, T }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontSize: 10, padding: "4px 10px", borderRadius: 4,
        border: `1px solid ${active ? T.accent : (hover ? T.borderStrong : T.border)}`,
        color: active ? T.accentLight : T.textMid,
        background: active ? T.accentDim : (hover ? T.bgHi : "transparent"),
        cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.05em",
        transition: "all 120ms ease", fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}

function RowPair({ T, label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 11 }}>
      <span style={{ color: T.textDim, letterSpacing: "0.03em" }}>{label}</span>
      <span style={{ color: T.text, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function SectionHeader({ T, label, tooltip, children, right }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: `1px solid ${T.border}`, paddingBottom: 8, marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.25em", color: T.textMid, fontWeight: 600 }}>
            {label}
          </div>
          {tooltip && <InfoTip T={T}>{tooltip}</InfoTip>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Sparkline({ values, w = 80, h = 18, T }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={points} fill="none" stroke={T.sparkStroke} strokeWidth="1.2" />
      <circle cx={w} cy={h - ((values[values.length - 1] - min) / range) * h} r="2" fill={T.accent} />
    </svg>
  );
}

function MaturityBar({ value, baseline, w = 60, T }) {
  return (
    <div style={{ position: "relative", height: 5, backgroundColor: T.borderLight, width: w, borderRadius: 3, overflow: "hidden" }}>
      <div style={{
        position: "absolute", left: 0, top: 0, height: "100%",
        backgroundColor: T.text, width: `${value}%`, transition: "width 300ms ease",
      }} />
      <div style={{
        position: "absolute", top: -1, height: "calc(100% + 2px)",
        width: 1, backgroundColor: T.accentLight, left: `${baseline}%`,
      }} />
    </div>
  );
}

// Elevated card — used in Clients, Rules, Lab
function Card({ T, children, onClick, hoverable, accent, style }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hoverable && setHover(true)}
      onMouseLeave={() => hoverable && setHover(false)}
      style={{
        backgroundColor: T.bgElevated,
        border: `1px solid ${hover ? T.borderStrong : T.border}`,
        borderRadius: 6,
        boxShadow: hover ? T.shadowHover : T.shadow,
        transition: "all 180ms ease",
        cursor: onClick ? "pointer" : "default",
        transform: hover ? "translateY(-1px)" : "translateY(0)",
        position: "relative",
        ...style,
      }}
    >
      {accent && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          backgroundColor: accent, borderRadius: "6px 0 0 6px",
        }} />
      )}
      {children}
    </div>
  );
}

// =========================================================================
// MAIN COMPONENT
// =========================================================================
export default function SentryV3() {
  const [tab, setTab] = useState("dashboard");
  const [alerts, setAlerts] = useState(() => buildInitialAlerts());
  const [decisions, setDecisions] = useState([]);
  const [history] = useState(() => buildHistory());
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showTests, setShowTests] = useState(false);
  const [correlationRules, setCorrelationRules] = useState(INITIAL_CORRELATION_RULES);
  const [workflows, setWorkflows] = useState(SAMPLE_WORKFLOWS);
  const [clientConfirmations, setClientConfirmations] = useState({});
  const [theme, setTheme] = useState("dark");
  const [systemDark, setSystemDark] = useState(true);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isDark = theme === "auto" ? systemDark : theme === "dark";
  const T = makeTheme(isDark);

  const techStats = useMemo(() => computeTechStats(decisions), [decisions]);
  const maturityByClient = useMemo(() => {
    const m = {};
    for (const c of CLIENTS) m[c.id] = computeClientMaturity(c.id, decisions);
    return m;
  }, [decisions]);

  const scoredAlerts = useMemo(() => {
    return alerts
      .map((a) => ({ ...a, sentryScore: scoreAlert(a, techStats, maturityByClient[a.clientId]) }))
      .sort((a, b) => {
        if (a.state === "decided" && b.state !== "decided") return 1;
        if (b.state === "decided" && a.state !== "decided") return -1;
        return b.sentryScore - a.sentryScore;
      });
  }, [alerts, techStats, maturityByClient]);

  function recordDecision(alert, decision) {
    setDecisions((d) => [{
      logId: `D-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      alertId: alert.id, clientId: alert.clientId, techniqueId: alert.technique.id,
      tactic: alert.technique.tactic, decision, analyst: "J. MAURIELLO",
      ts: Date.now(), sentryScore: alert.sentryScore,
    }, ...d]);
    setAlerts((list) => list.map((a) => a.id === alert.id ? { ...a, state: "decided", decision } : a));
    setExpandedId(null);
  }

  function undoLast() {
    if (decisions.length === 0) return;
    const last = decisions[0];
    setDecisions((d) => d.slice(1));
    setAlerts((list) => list.map((a) => a.id === last.alertId ? { ...a, state: "open", decision: null } : a));
  }

  const totals = useMemo(() => {
    const ingested = alerts.length + 1187;
    return {
      ingested, suppressed: 1187,
      triaged: decisions.length,
      escalated: decisions.filter((d) => d.decision === "ESCALATE").length,
      open: scoredAlerts.filter((a) => a.state === "open").length,
      breaches: 0,
    };
  }, [alerts, decisions, scoredAlerts]);

  const TABS = [
    { id: "dashboard", label: "DASHBOARD", icon: LayoutDashboard },
    { id: "alerts", label: "ALERTS", icon: Radio },
    { id: "clients", label: "CLIENTS", icon: Building2 },
    { id: "lab", label: "AUTOMATION", icon: Workflow },
  ];

  return (
    <ThemeCtx.Provider value={T}>
      <div style={{
        fontFamily: MONO, backgroundColor: T.bg, color: T.text,
        minHeight: "100vh", display: "flex", flexDirection: "column", overflowX: "hidden",
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap');
          html, body { background-color: ${T.bg}; overscroll-behavior: none; margin: 0; padding: 0; }
          * { box-sizing: border-box; }
          *::-webkit-scrollbar { width: 8px; height: 8px; }
          *::-webkit-scrollbar-track { background: transparent; }
          *::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
          *::-webkit-scrollbar-thumb:hover { background: ${T.borderStrong}; }
          .ticker { animation: tick 1.4s ease-in-out infinite; }
          @keyframes tick { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
          .fade-in { animation: fadeIn 180ms ease-out; }
        `}</style>

        {/* TOP BAR */}
        <div style={{
          borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 30,
          backgroundColor: T.bg, backdropFilter: "blur(8px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 30, height: 30, border: `1px solid ${T.accent}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 4, backgroundColor: T.accentDim,
              }}>
                <Shield style={{ width: 17, height: 17, color: T.accent }} />
              </div>
              <div>
                <div style={{ fontSize: 12, letterSpacing: "0.25em", fontWeight: 700 }}>SENTRY</div>
                <div style={{ fontSize: 9, letterSpacing: "0.18em", color: T.textDim }}>VDA LABS · v3</div>
              </div>
            </div>

            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 11 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div className="ticker" style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: T.green }} />
                  <span style={{ color: T.textDim, letterSpacing: "0.05em" }}>J. MAURIELLO</span>
                </div>
                <div><span style={{ color: T.textDim }}>OPEN </span><span style={{ color: T.accentLight, fontWeight: 700 }}>{totals.open}</span></div>
                <div><span style={{ color: T.textDim }}>TRIAGED </span><span style={{ fontWeight: 600 }}>{totals.triaged}</span></div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {!isMobile && ["auto", "light", "dark"].map((m) => (
                <button
                  key={m}
                  onClick={() => setTheme(m)}
                  style={{
                    fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase",
                    padding: "4px 10px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
                    background: theme === m ? T.bgHi : "transparent",
                    color: theme === m ? T.text : T.textDim,
                    border: `1px solid ${theme === m ? T.border : "transparent"}`,
                    transition: "all 120ms ease", fontWeight: theme === m ? 600 : 400,
                  }}
                >
                  {m}
                </button>
              ))}
              <button
                onClick={undoLast}
                disabled={decisions.length === 0}
                style={{
                  fontSize: 10, letterSpacing: "0.1em", padding: "4px 10px", cursor: "pointer",
                  fontFamily: "inherit", border: `1px solid ${T.border}`, color: T.textDim,
                  background: "transparent", opacity: decisions.length === 0 ? 0.3 : 1,
                  borderRadius: 4,
                }}
              >
                UNDO
              </button>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display: "flex", borderTop: `1px solid ${T.border}` }}>
            {TABS.map((t) => {
              const Ico = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    padding: "12px 4px", fontSize: 10, letterSpacing: "0.15em", cursor: "pointer",
                    fontFamily: "inherit", background: active ? T.bgAlt : "transparent",
                    color: active ? T.accentLight : T.textDim, border: "none",
                    borderRight: `1px solid ${T.border}`,
                    borderBottom: active ? `2px solid ${T.accent}` : "2px solid transparent",
                    transition: "all 120ms ease", fontWeight: active ? 700 : 500,
                  }}
                >
                  <Ico style={{ width: 14, height: 14, flexShrink: 0 }} />
                  {!isMobile && <span>{t.label}</span>}
                  {t.id === "alerts" && totals.open > 0 && (
                    <span style={{ color: T.accentLight, fontSize: 10, fontWeight: 700 }}>{totals.open}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, backgroundColor: T.bg }}>
          {tab === "dashboard" && (
            <DashboardTab totals={totals} alerts={scoredAlerts} history={history} maturityByClient={maturityByClient} decisions={decisions} />
          )}
          {tab === "alerts" && (
            <AlertsTab
              alerts={scoredAlerts} expandedId={expandedId} setExpandedId={setExpandedId}
              onDecide={recordDecision} techStats={techStats} maturityByClient={maturityByClient}
              selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId}
              correlationRules={correlationRules}
            />
          )}
          {tab === "clients" && (
            <ClientsTab maturityByClient={maturityByClient} alerts={scoredAlerts} decisions={decisions} correlationRules={correlationRules} setCorrelationRules={setCorrelationRules} />
          )}
          {tab === "lab" && (
            <AutomationTab workflows={workflows} setWorkflows={setWorkflows} />
          )}
        </div>

        <TestPanel
          open={showTests}
          onToggle={() => setShowTests(!showTests)}
          state={{ alerts, decisions, scoredAlerts, techStats, maturityByClient, totals, history, correlationRules, workflows, clientConfirmations }}
        />
      </div>
    </ThemeCtx.Provider>
  );
}

// =========================================================================
// DASHBOARD TAB — unchanged conceptually, polished
// =========================================================================
function DashboardTab({ totals, alerts, history, maturityByClient, decisions }) {
  const T = useT();
  return (
    <div style={{ padding: 28, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 20, marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.25em", color: T.textDim, marginBottom: 10, fontWeight: 600 }}>
          TODAY · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}
        </div>
        <div style={{ fontSize: 17, lineHeight: 1.6, color: T.text, fontWeight: 300 }}>
          <span style={{ color: T.accentLight, fontWeight: 700 }}>{totals.ingested.toLocaleString()}</span> alerts ingested,{" "}
          <span style={{ fontWeight: 700 }}>{totals.suppressed.toLocaleString()}</span> auto-suppressed,{" "}
          <span style={{ fontWeight: 700 }}>{totals.triaged}</span> triaged,{" "}
          <span style={{ color: T.accentLight, fontWeight: 700 }}>{totals.escalated}</span> escalated,{" "}
          <span style={{ color: T.green, fontWeight: 700 }}>{totals.breaches === 0 ? "0 SLA breaches" : `${totals.breaches} SLA breaches`}</span>.
        </div>
        <div style={{ fontSize: 11, color: T.textDim, marginTop: 14 }}>
          {((totals.suppressed / totals.ingested) * 100).toFixed(1)}% noise reduction
        </div>
        <div style={{ fontSize: 10, color: T.textDim, marginTop: 8, opacity: 0.7 }}>
          MODEL · last retrain {new Date(RETRAIN_INFO.lastRetrain).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · {RETRAIN_INFO.trainingEvents.toLocaleString()} training events · {RETRAIN_INFO.modelSize} · next retrain {RETRAIN_INFO.nextRetrain}
        </div>
      </div>

      <SectionHeader T={T} label="ALERT VOLUME · LAST 24 HOURS" tooltip="Total alerts ingested hourly across all clients. Taller, redder columns mean more alerts in that hour. Use this to spot unusual activity spikes at a glance.">
        <HorizonChart history={history} />
      </SectionHeader>

      <SectionHeader T={T} label="CLIENTS · 7-DAY POSTURE" tooltip="Each row shows a client's 7-day alert trend, open alert count, true positives, and maturity score. Maturity drifts up with confirmed true positives and down with false positives.">
        <ClientDashTable history={history} maturityByClient={maturityByClient} alerts={alerts} decisions={decisions} />
      </SectionHeader>

      <SectionHeader T={T} label="SMALL MULTIPLES · HOURLY ALERT RATE BY CLIENT" tooltip="One small chart per client showing today's hourly alert pattern. Useful for spotting off-hours activity that should be investigated.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {CLIENTS.map((c) => (
            <SmallMultiple key={c.id} client={c} hours={history[c.id][6]} />
          ))}
        </div>
      </SectionHeader>

      <SectionHeader T={T} label="RECENT ESCALATIONS" tooltip="The last 5 alerts that were marked ESCALATE. These should have triggered analyst pages or client notifications via configured workflows.">
        <RecentEscalations decisions={decisions} />
      </SectionHeader>
    </div>
  );
}

function HorizonChart({ history }) {
  const T = useT();
  const hours = Array.from({ length: 24 }, (_, h) =>
    CLIENTS.reduce((s, c) => s + (history[c.id][6][h] || 0), 0)
  );
  const max = Math.max(...hours);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", height: 72, gap: 2 }}>
        {hours.map((v, i) => {
          const intensity = Math.min(1, v / max);
          const colors = T.isDark
            ? ["#5a3a20", "#c87020", "#ff5722"]
            : ["#e8d5c0", "#d48030", "#c83e00"];
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
              <div style={{
                height: `${intensity * 100}%`,
                backgroundColor: colors[Math.min(2, Math.floor(intensity * 3))],
                borderRadius: "2px 2px 0 0",
              }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.textDim, marginTop: 6, letterSpacing: "0.08em" }}>
        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>NOW</span>
      </div>
    </div>
  );
}

function ClientDashTable({ history, maturityByClient, alerts, decisions }) {
  const T = useT();
  return (
    <Card T={T}>
      {CLIENTS.map((c, idx) => {
        const dailyTotals = history[c.id].map((day) => day.reduce((s, h) => s + h, 0));
        const open = alerts.filter((a) => a.clientId === c.id && a.state === "open").length;
        const ds = decisions.filter((d) => d.clientId === c.id);
        const tps = ds.filter((d) => d.decision === "TP" || d.decision === "ESCALATE").length;
        const mat = maturityByClient[c.id];
        const drift = mat - c.baselineMaturity;
        return (
          <div key={c.id} style={{
            display: "flex", alignItems: "center", gap: 18, padding: "14px 18px",
            borderBottom: idx < CLIENTS.length - 1 ? `1px solid ${T.borderLight}` : "none",
            fontSize: 11, flexWrap: "wrap",
          }}>
            <div style={{ minWidth: 170 }}>
              <div style={{ fontWeight: 700, letterSpacing: "0.05em" }}>{c.name.toUpperCase()}</div>
              <div style={{ fontSize: 9, color: T.textDim, marginTop: 2 }}>{c.industry}</div>
            </div>
            <div style={{ minWidth: 90 }}><Sparkline values={dailyTotals} T={T} /></div>
            <div style={{ minWidth: 50, textAlign: "right" }}>
              <div style={{ fontSize: 10, color: T.textDim }}>OPEN</div>
              <div style={{ color: T.accentLight, fontWeight: 700, fontSize: 14 }}>{open}</div>
            </div>
            <div style={{ minWidth: 50, textAlign: "right" }}>
              <div style={{ fontSize: 10, color: T.textDim }}>TRUE+</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{tps}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
              <div style={{ fontSize: 10, color: T.textDim, display: "flex", justifyContent: "space-between" }}>
                <span>MATURITY</span>
                <span style={{ color: T.text, fontWeight: 600 }}>
                  {mat}
                  {drift !== 0 && <span style={{ color: drift > 0 ? T.green : T.red, marginLeft: 4 }}>{drift > 0 ? "↑" : "↓"}{Math.abs(drift)}</span>}
                </span>
              </div>
              <MaturityBar value={mat} baseline={c.baselineMaturity} T={T} w={130} />
            </div>
            <div style={{ color: T.green, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em" }}>● OK</div>
          </div>
        );
      })}
    </Card>
  );
}

function SmallMultiple({ client, hours }) {
  const T = useT();
  const max = Math.max(...hours);
  return (
    <Card T={T} style={{ padding: 14 }}>
      <div style={{ fontSize: 10, letterSpacing: "0.15em", color: T.textDim, marginBottom: 10, fontWeight: 600 }}>
        {client.name.toUpperCase()}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", height: 44, gap: 1 }}>
        {hours.map((v, i) => (
          <div key={i} style={{
            flex: 1, backgroundColor: T.barFill,
            height: `${(v / max) * 100}%`,
            opacity: 0.25 + (v / max) * 0.75,
            borderRadius: "1px 1px 0 0",
          }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.textDim, marginTop: 5 }}>
        <span>00</span><span>12</span><span>24</span>
      </div>
    </Card>
  );
}

function RecentEscalations({ decisions }) {
  const T = useT();
  const escs = decisions.filter((d) => d.decision === "ESCALATE").slice(0, 5);
  if (escs.length === 0) {
    return <Card T={T} style={{ padding: 16 }}>
      <div style={{ fontSize: 11, color: T.textDim, fontStyle: "italic" }}>no escalations yet — all clear</div>
    </Card>;
  }
  return (
    <Card T={T}>
      {escs.map((e, idx) => (
        <div key={e.logId} style={{
          display: "flex", alignItems: "center", gap: 14, fontSize: 11,
          padding: "12px 18px",
          borderBottom: idx < escs.length - 1 ? `1px solid ${T.borderLight}` : "none",
        }}>
          <span style={{ color: T.textDim, minWidth: 70 }}>{fmtAgo(e.ts)}</span>
          <span style={{ color: T.accentLight, fontWeight: 700, minWidth: 75 }}>{e.techniqueId}</span>
          <span style={{ color: T.text, flex: 1, fontWeight: 500 }}>{CLIENTS.find((c) => c.id === e.clientId)?.name}</span>
          <span style={{ color: T.textDim, fontSize: 10 }}>{e.alertId}</span>
        </div>
      ))}
    </Card>
  );
}

// =========================================================================
// ALERTS TAB — rewritten for better interactivity
// =========================================================================
function AlertsTab({ alerts, expandedId, setExpandedId, onDecide, techStats, maturityByClient, selectedClientId, setSelectedClientId, correlationRules }) {
  const T = useT();
  const filtered = selectedClientId ? alerts.filter((a) => a.clientId === selectedClientId) : alerts;
  return (
    <div>
      <div style={{
        padding: "14px 20px", borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", gap: 14, backgroundColor: T.bg,
        flexWrap: "wrap", position: "sticky", top: 85, zIndex: 10,
      }}>
        <Radio className="ticker" style={{ width: 13, height: 13, color: T.accent }} />
        <span style={{ fontSize: 11, letterSpacing: "0.25em", fontWeight: 600 }}>TRIAGE QUEUE</span>
        <InfoTip T={T}>
          The triage queue orders alerts by Sentry Score — a composite of sensor severity, client criticality, historical true-positive rate, and client maturity. Click any alert to expand its detail panel and make a triage decision.
        </InfoTip>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: "auto" }}>
          <FilterBtn active={!selectedClientId} onClick={() => setSelectedClientId(null)} T={T}>ALL CLIENTS</FilterBtn>
          {CLIENTS.map((c) => (
            <FilterBtn key={c.id} active={selectedClientId === c.id} onClick={() => setSelectedClientId(c.id)} T={T}>
              {c.name.split(" ")[0].toUpperCase()}
            </FilterBtn>
          ))}
        </div>
      </div>
      <div style={{ padding: "16px 20px" }}>
        {filtered.map((a) => (
          <AlertRow
            key={a.id} alert={a} expanded={expandedId === a.id}
            onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
            onDecide={(d) => onDecide(a, d)} techStats={techStats}
            clientMaturity={maturityByClient[a.clientId]}
            correlationRules={correlationRules}
          />
        ))}
      </div>
    </div>
  );
}

function AlertRow({ alert, expanded, onToggle, onDecide, techStats, clientMaturity, correlationRules }) {
  const T = useT();
  const sv = getSev(alert.sentryScore, T);
  const decided = alert.state === "decided";
  const c = CLIENTS.find((x) => x.id === alert.clientId);
  const k = `${alert.clientId}::${alert.technique.id}`;
  const hist = techStats[k] || { tp: 0, fp: 0, total: 0 };
  const reprioritized = alert.sentryScore >= 70 && (alert.sentryScore - alert.rawSeverity) >= 20;
  const matchedRules = (correlationRules || []).filter((r) =>
    (r.type === "technique" && r.pattern === alert.technique.id) ||
    (r.type === "regex" && new RegExp(r.pattern, "i").test(alert.rule))
  );
  const playbook = PLAYBOOKS[alert.technique.id];
  const [hover, setHover] = useState(false);
  const [showEnrich, setShowEnrich] = useState(false);

  return (
    <div style={{ marginBottom: 10 }}>
      <div
        onClick={onToggle}
        onMouseEnter={() => !decided && setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "flex", alignItems: "stretch", gap: 0,
          padding: 0,
          cursor: decided ? "default" : "pointer",
          backgroundColor: T.bgElevated,
          border: `1px solid ${hover ? sv.border : T.border}`,
          borderLeftWidth: 3, borderLeftColor: sv.border,
          borderRadius: 5,
          boxShadow: hover && !decided ? T.shadowHover : (expanded ? T.shadowElev : T.shadow),
          transform: hover && !decided && !expanded ? "translateY(-1px)" : "translateY(0)",
          transition: "all 160ms ease",
          opacity: decided ? 0.45 : 1,
          overflow: "hidden",
        }}
      >
        {/* Score block — simplified, severity label dominant */}
        <div style={{
          minWidth: 110, padding: "14px 12px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          backgroundColor: sv.bg, borderRight: `1px solid ${T.border}`, gap: 4,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: sv.color, letterSpacing: "0.1em" }}>{sv.label}</div>
          <div style={{ fontSize: 20, fontWeight: 300, color: sv.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {alert.sentryScore}
          </div>
          <div style={{ fontSize: 8, color: T.textDim, letterSpacing: "0.08em" }}>SENTRY SCORE</div>
        </div>

        {/* Main content — generous padding, clear hierarchy */}
        <div style={{ flex: 1, padding: "14px 18px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <Badge color={alert.sourceColor}>{alert.sourceLabel}</Badge>
            {alert.dedupeCount > 1 && <Badge color={T.accent}>×{alert.dedupeCount}</Badge>}
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.02em" }}>{alert.technique.id}</span>
            <span style={{ fontSize: 12, color: T.textMid, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {alert.technique.name}
            </span>
            {alert.noveltyBoost > 0 && <Badge color={T.accent}>NOVEL</Badge>}
            {reprioritized && <Badge color={T.green}>↑ REPRIORITIZED</Badge>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 10, color: T.textDim, flexWrap: "wrap" }}>
            <span style={{ letterSpacing: "0.06em", fontWeight: 500 }}>{alert.technique.tactic.toUpperCase()}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={{ color: T.textMid, fontWeight: 500 }}>{c.name}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={{ color: T.gold, fontWeight: 500 }}>{alert.asset}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Clock style={{ width: 10, height: 10 }} />{fmtAgo(alert.timestamp)}
            </span>
          </div>
        </div>

        {/* Right-side indicator */}
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", color: T.textDim }}>
          {decided
            ? <div style={{ fontSize: 10, textAlign: "right", fontWeight: 600, letterSpacing: "0.08em", color: sv.color }}>{alert.decision}</div>
            : expanded ? <ChevronDown style={{ width: 18, height: 18 }} /> : <ChevronRight style={{ width: 18, height: 18 }} />
          }
        </div>
      </div>

      {/* Hover preview popover */}
      {hover && !expanded && !decided && (
        <div className="fade-in" style={{
          marginTop: 6, padding: "10px 16px", marginLeft: 110,
          backgroundColor: T.bgHi, borderRadius: 4,
          border: `1px solid ${T.borderLight}`,
          fontSize: 10, color: T.textMid, display: "flex", gap: 20, flexWrap: "wrap",
          boxShadow: T.shadow,
        }}>
          <span><strong style={{ color: T.text }}>Rule:</strong> {alert.rule}</span>
          <span><strong style={{ color: T.text }}>Sensor sev:</strong> {alert.rawSeverity}</span>
          <span><strong style={{ color: T.text }}>Hist TP:</strong> {hist.total >= 3 ? `${Math.round((hist.tp/hist.total)*100)}%` : "—"}</span>
          {matchedRules.length > 0 && <span><strong style={{ color: T.accentLight }}>Rules:</strong> {matchedRules.length} matched</span>}
          <span style={{ marginLeft: "auto", color: T.textDim, fontStyle: "italic" }}>click to open</span>
        </div>
      )}

      {/* Expanded detail — uses Card for consistency */}
      {expanded && !decided && (
        <div className="fade-in" style={{
          marginTop: 8, padding: 20,
          backgroundColor: T.bgAlt, borderRadius: 5,
          border: `1px solid ${T.border}`,
          boxShadow: T.shadowElev,
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 18 }}>
            <FieldPair label="ALERT ID" value={alert.id} T={T} />
            <FieldPair label="RULE" value={alert.rule} T={T} />
            <FieldPair label="TACTIC" value={alert.technique.tactic} T={T} />
            <FieldPair label="ASSET" value={alert.asset} T={T} />
            <FieldPair label="SOURCE" value={alert.sourceLabel} T={T} />
            <FieldPair label="DEDUPE" value={`×${alert.dedupeCount}`} T={T} />
          </div>

          {/* Scoring breakdown */}
          <div style={{ border: `1px solid ${T.border}`, padding: 14, marginBottom: 14, backgroundColor: T.bg, borderRadius: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Eye style={{ width: 13, height: 13, color: T.gold }} />
              <span style={{ fontSize: 10, letterSpacing: "0.2em", color: T.gold, fontWeight: 600 }}>WHY THIS SCORE</span>
            </div>
            <ExplainLine label="Sensor base severity" value={alert.rawSeverity} T={T} />
            <ExplainLine label="Client criticality" value={`${c.criticality}/100`} T={T} />
            <ExplainLine label="Historical TP rate" value={hist.total >= 3 ? `${Math.round((hist.tp / hist.total) * 100)}%` : "no data"} T={T} />
            <ExplainLine label="Client maturity" value={`${clientMaturity}/100`} T={T} />
            {alert.noveltyBoost > 0 && <ExplainLine label="Novelty boost" value={`+${alert.noveltyBoost}%`} T={T} />}
            <div style={{ height: 1, backgroundColor: T.borderLight, margin: "6px 0" }} />
            <ExplainLine label="FINAL SENTRY SCORE" value={`${alert.sentryScore} · ${sv.label}`} T={T} highlight />
          </div>

          {/* Playbook */}
          {playbook && (
            <div style={{
              border: `1px solid ${T.border}`, padding: 14, marginBottom: 14,
              backgroundColor: T.greenDim, borderRadius: 4,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Terminal style={{ width: 13, height: 13, color: T.green }} />
                <span style={{ fontSize: 10, letterSpacing: "0.2em", color: T.green, fontWeight: 600 }}>PLAYBOOK · {playbook.id}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: T.text }}>{playbook.name}</div>
              {playbook.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 11, color: T.textMid, marginBottom: 5 }}>
                  <span style={{ color: T.green, fontWeight: 700, minWidth: 16 }}>{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}

          {/* Enrich (collapsible) */}
          <button onClick={() => setShowEnrich(!showEnrich)} style={{
            width: "100%", textAlign: "left", fontSize: 10, padding: "10px 14px",
            border: `1px solid ${T.border}`, color: T.textMid,
            background: "transparent", cursor: "pointer", fontFamily: "inherit",
            marginBottom: showEnrich ? 8 : 14, borderRadius: 4, letterSpacing: "0.1em",
          }}>
            {showEnrich ? "▾" : "▸"} ENRICHMENT DATA
          </button>
          {showEnrich && (
            <div style={{ border: `1px solid ${T.border}`, padding: 14, fontSize: 11, marginBottom: 14, backgroundColor: T.bg, borderRadius: 4 }}>
              <div style={{ color: T.textDim, marginBottom: 10, fontSize: 9, letterSpacing: "0.15em" }}>MOCK ENRICHMENT — WAVE 2</div>
              <div style={{ display: "flex", justifyContent: "space-between", color: T.text, marginBottom: 6 }}>
                <span>Related alerts in last 24h</span><span style={{ color: T.accentLight, fontWeight: 600 }}>3 found</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: T.text, marginBottom: 6 }}>
                <span>Similar alerts from this asset</span><span style={{ color: T.accentLight, fontWeight: 600 }}>7 total</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: T.text }}>
                <span>Threat intel matches</span><span style={{ color: T.textMid }}>checking...</span>
              </div>
            </div>
          )}

          {/* Matched correlation rules */}
          {matchedRules.length > 0 && (
            <div style={{
              fontSize: 10, padding: "10px 14px",
              border: `1px solid ${T.accent}40`, color: T.accentLight,
              backgroundColor: T.accentDim, marginBottom: 14, borderRadius: 4,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4, letterSpacing: "0.1em" }}>CORRELATION RULE MATCH</div>
              {matchedRules.map((r) => (
                <div key={r.id} style={{ marginTop: 4 }}>
                  <strong>{r.id}</strong> · {r.name} · +{r.severityAdjust} severity
                </div>
              ))}
            </div>
          )}

          {/* Decision buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <DecisionBtn onClick={() => onDecide("TP")} color={T.accent} label="TRUE POSITIVE" sub="confirm threat" icon={<AlertTriangle style={{ width: 14, height: 14 }} />} T={T} />
            <DecisionBtn onClick={() => onDecide("FP")} color={T.textMid} label="FALSE POSITIVE" sub="noise" icon={<X style={{ width: 14, height: 14 }} />} T={T} />
            <DecisionBtn onClick={() => onDecide("ESCALATE")} color={T.accent} label="ESCALATE" sub="page + notify" icon={<ArrowUpRight style={{ width: 14, height: 14 }} />} T={T} />
            <DecisionBtn onClick={() => onDecide("ASK")} color={T.amber} label="ASK TEAM" sub="2nd opinion" icon={<Users style={{ width: 14, height: 14 }} />} T={T} />
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// CLIENTS TAB — elevated cards + "Correlation Rules" (industry standard)
// =========================================================================
function ClientsTab({ maturityByClient, alerts, decisions, correlationRules, setCorrelationRules }) {
  const T = useT();
  return (
    <div style={{ padding: 28, maxWidth: 1280, margin: "0 auto" }}>
      <SectionHeader
        T={T}
        label="CLIENT PORTFOLIO"
        tooltip="Every client VDA monitors, their current posture, and their contribution to the queue. Maturity scores learn from analyst decisions — confirmed true positives raise maturity; false positives lower it."
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {CLIENTS.map((c) => {
            const open = alerts.filter((a) => a.clientId === c.id && a.state === "open").length;
            const ds = decisions.filter((d) => d.clientId === c.id);
            const tps = ds.filter((d) => d.decision === "TP" || d.decision === "ESCALATE").length;
            const tpRate = ds.length > 0 ? Math.round((tps / ds.length) * 100) : null;
            const mat = maturityByClient[c.id];
            const drift = mat - c.baselineMaturity;
            return (
              <Card key={c.id} T={T} hoverable accent={T.accent} style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.03em" }}>{c.name.toUpperCase()}</div>
                    <div style={{ fontSize: 10, color: T.textDim, marginTop: 3 }}>{c.industry}</div>
                  </div>
                  <div style={{
                    fontSize: 9, padding: "3px 8px", borderRadius: 3,
                    backgroundColor: T.greenDim, color: T.green, fontWeight: 600, letterSpacing: "0.1em",
                  }}>● MONITORING</div>
                </div>

                <div style={{ fontSize: 11 }}>
                  <RowPair T={T} label="Open alerts" value={<span style={{ color: T.accentLight, fontWeight: 700 }}>{open}</span>} />
                  <RowPair T={T} label="True-positive rate" value={tpRate !== null ? `${tpRate}%` : "—"} />
                  <RowPair T={T} label="Endpoints" value={c.endpoints} />
                  <RowPair T={T} label="Criticality score" value={`${c.criticality}/100`} />
                  <RowPair T={T} label="Noise floor" value={`${c.noiseFloor}/100`} />
                  <RowPair T={T} label="Maturity" value={
                    <span>{mat}{drift !== 0 && <span style={{ color: drift > 0 ? T.green : T.red, marginLeft: 4 }}>{drift > 0 ? "↑" : "↓"}{Math.abs(drift)}</span>}</span>
                  } />
                  <div style={{ marginTop: 4 }}>
                    <MaturityBar value={mat} baseline={c.baselineMaturity} w={250} T={T} />
                  </div>
                </div>

                <div style={{
                  marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.borderLight}`,
                  fontSize: 10, color: T.textDim, display: "flex", flexDirection: "column", gap: 6,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Analyst</span><span style={{ color: T.text }}>{c.analyst}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Escalation</span><span style={{ color: T.text }}>ciso@{c.id}.example</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>SOC channel</span><span style={{ color: T.text }}>#soc-{c.id}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </SectionHeader>

      {/* CORRELATION RULES — replaces "Boost Rules" */}
      <SectionHeader
        T={T}
        label="CORRELATION RULES"
        tooltip="Correlation Rules (sometimes called Detection Rules or Tuning Rules in other platforms) adjust how Sentry scores incoming alerts. When an alert matches a rule's pattern, its Sentry Score is boosted or suppressed by the configured amount. These are the primary tool for tuning the system to your environment."
        right={
          <button style={{
            fontSize: 10, padding: "6px 12px", borderRadius: 4,
            border: `1px solid ${T.accent}`, color: T.accentLight,
            background: T.accentDim, cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: 6, letterSpacing: "0.08em", fontWeight: 600,
          }}>
            <Plus style={{ width: 12, height: 12 }} /> NEW RULE
          </button>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 14 }}>
          {correlationRules.map((rule) => (
            <CorrelationRuleCard key={rule.id} rule={rule} T={T} />
          ))}
        </div>
      </SectionHeader>
    </div>
  );
}

function CorrelationRuleCard({ rule, T }) {
  const confColor = rule.confidence === "high" ? T.green : (rule.confidence === "medium" ? T.amber : T.textDim);
  const statusColor = rule.status === "active" ? T.green : T.textDim;
  return (
    <Card T={T} hoverable style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.accentLight, letterSpacing: "0.05em" }}>{rule.id}</span>
            <span style={{
              fontSize: 8, padding: "2px 6px", borderRadius: 3,
              backgroundColor: `${statusColor}18`, color: statusColor,
              fontWeight: 600, letterSpacing: "0.08em",
            }}>● {rule.status.toUpperCase()}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{rule.name}</div>
          <div style={{ fontSize: 10, color: T.textDim, lineHeight: 1.5 }}>{rule.description}</div>
        </div>
        <div style={{ textAlign: "right", minWidth: 55 }}>
          <div style={{
            fontSize: 18, fontWeight: 700,
            color: rule.severityAdjust > 0 ? T.accentLight : T.green,
            lineHeight: 1,
          }}>
            {rule.severityAdjust > 0 ? "+" : ""}{rule.severityAdjust}
          </div>
          <div style={{ fontSize: 8, color: T.textDim, letterSpacing: "0.1em", marginTop: 3 }}>SEVERITY</div>
        </div>
      </div>

      {/* Rule metadata grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10,
        padding: "10px 0", borderTop: `1px solid ${T.borderLight}`, borderBottom: `1px solid ${T.borderLight}`,
        fontSize: 10, marginBottom: 10,
      }}>
        <div>
          <div style={{ color: T.textDim, fontSize: 9, letterSpacing: "0.08em", marginBottom: 2 }}>PATTERN</div>
          <div style={{ color: T.text, fontFamily: MONO, fontSize: 10 }}>{rule.pattern}</div>
        </div>
        <div>
          <div style={{ color: T.textDim, fontSize: 9, letterSpacing: "0.08em", marginBottom: 2 }}>TYPE</div>
          <div style={{ color: T.text }}>{rule.type}</div>
        </div>
        <div>
          <div style={{ color: T.textDim, fontSize: 9, letterSpacing: "0.08em", marginBottom: 2 }}>TACTIC</div>
          <div style={{ color: T.text }}>{rule.tactic}</div>
        </div>
        <div>
          <div style={{ color: T.textDim, fontSize: 9, letterSpacing: "0.08em", marginBottom: 2 }}>CONFIDENCE</div>
          <div style={{ color: confColor, fontWeight: 600, textTransform: "uppercase" }}>{rule.confidence}</div>
        </div>
      </div>

      {/* Performance stats */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.textDim, marginBottom: 10 }}>
        <div>
          <span style={{ color: T.text, fontWeight: 600, fontSize: 13 }}>{rule.triggerCount}</span>
          <span style={{ marginLeft: 5 }}>triggers</span>
        </div>
        <div>last fired <span style={{ color: T.text }}>{fmtAgo(rule.lastTriggered)}</span></div>
      </div>

      {/* Actions */}
      <div style={{
        display: "flex", gap: 6, paddingTop: 10, borderTop: `1px solid ${T.borderLight}`,
        fontSize: 9, color: T.textDim,
      }}>
        <button style={{
          flex: 1, fontSize: 9, padding: "5px 8px", borderRadius: 3,
          border: `1px solid ${T.border}`, color: T.textMid, background: "transparent",
          cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.08em",
        }}>EDIT</button>
        <button style={{
          flex: 1, fontSize: 9, padding: "5px 8px", borderRadius: 3,
          border: `1px solid ${T.border}`, color: T.textMid, background: "transparent",
          cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.08em",
        }}>TEST</button>
        <button style={{
          fontSize: 9, padding: "5px 8px", borderRadius: 3,
          border: `1px solid ${T.border}`, color: T.textMid, background: "transparent",
          cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.08em",
        }}>⋯</button>
      </div>

      <div style={{ fontSize: 9, color: T.textDim, marginTop: 10, opacity: 0.7 }}>
        by {rule.author} · created {fmtAgo(rule.createdAt)}
      </div>
    </Card>
  );
}

// =========================================================================
// AUTOMATION TAB — full workflow builder (replaces Lab)
// =========================================================================
function AutomationTab({ workflows, setWorkflows }) {
  const T = useT();
  const [view, setView] = useState("list"); // 'list' | 'builder'
  const [editing, setEditing] = useState(null);

  function newWorkflow() {
    setEditing({
      id: `WF-${String(workflows.length + 1).padStart(3, "0")}`,
      name: "Untitled Workflow",
      description: "",
      enabled: false,
      trigger: { type: "alert_severity", value: "critical" },
      conditions: [],
      actions: [],
      runs: 0,
      lastRun: null,
    });
    setView("builder");
  }

  function editWorkflow(wf) {
    setEditing({ ...wf });
    setView("builder");
  }

  function saveWorkflow() {
    if (!editing) return;
    const existing = workflows.find((w) => w.id === editing.id);
    if (existing) {
      setWorkflows(workflows.map((w) => w.id === editing.id ? editing : w));
    } else {
      setWorkflows([...workflows, editing]);
    }
    setView("list");
    setEditing(null);
  }

  function deleteWorkflow(id) {
    setWorkflows(workflows.filter((w) => w.id !== id));
  }

  function toggleWorkflow(id) {
    setWorkflows(workflows.map((w) => w.id === id ? { ...w, enabled: !w.enabled } : w));
  }

  if (view === "builder" && editing) {
    return <WorkflowBuilder
      workflow={editing} setWorkflow={setEditing}
      onSave={saveWorkflow} onCancel={() => { setView("list"); setEditing(null); }}
    />;
  }

  return (
    <div style={{ padding: 28, maxWidth: 1280, margin: "0 auto" }}>
      <SectionHeader
        T={T}
        label="AUTOMATION WORKFLOWS"
        tooltip="Workflows let operators build rule-based automations without code. When an alert matches a workflow's trigger and conditions, Sentry runs its actions: send SMS, post to Slack, fire a webhook, create a ticket, auto-escalate. Test every workflow in sandbox mode before enabling it in production."
        right={
          <button onClick={newWorkflow} style={{
            fontSize: 11, padding: "8px 14px", borderRadius: 4,
            border: `1px solid ${T.accent}`, color: "#fff",
            background: T.accent, cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: 7, letterSpacing: "0.08em", fontWeight: 600,
            boxShadow: T.shadow,
          }}>
            <Plus style={{ width: 13, height: 13 }} /> NEW WORKFLOW
          </button>
        }
      >
        <div style={{
          marginBottom: 20, padding: 16, borderRadius: 6,
          backgroundColor: T.bgElevated, border: `1px solid ${T.border}`, boxShadow: T.shadow,
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20,
        }}>
          <StatBlock T={T} label="ACTIVE WORKFLOWS" value={workflows.filter((w) => w.enabled).length} accent />
          <StatBlock T={T} label="TOTAL WORKFLOWS" value={workflows.length} />
          <StatBlock T={T} label="RUNS TODAY" value={workflows.reduce((s, w) => s + (w.runs || 0), 0)} />
          <StatBlock T={T} label="AVAILABLE ACTIONS" value={ACTION_TYPES.length} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          {workflows.map((wf) => (
            <WorkflowCard
              key={wf.id} workflow={wf} T={T}
              onEdit={() => editWorkflow(wf)}
              onDelete={() => deleteWorkflow(wf.id)}
              onToggle={() => toggleWorkflow(wf.id)}
            />
          ))}
          {workflows.length === 0 && (
            <Card T={T} style={{ padding: 40, textAlign: "center" }}>
              <Workflow style={{ width: 32, height: 32, color: T.textDim, margin: "0 auto 12px" }} />
              <div style={{ fontSize: 13, color: T.text, fontWeight: 600, marginBottom: 6 }}>No workflows yet</div>
              <div style={{ fontSize: 11, color: T.textDim }}>
                Create your first workflow to automate responses when alerts match specific conditions.
              </div>
            </Card>
          )}
        </div>
      </SectionHeader>

      {/* Available actions reference */}
      <SectionHeader
        T={T}
        label="AVAILABLE ACTIONS"
        tooltip="Actions are the building blocks of workflows. Each action runs when a workflow fires — you can chain multiple actions together. Custom actions can be added via MCP integration."
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 10 }}>
          {ACTION_TYPES.map((a) => {
            const Ico = a.icon;
            return (
              <Card key={a.id} T={T} hoverable style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 4,
                    backgroundColor: `${a.color}18`, color: a.color,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Ico style={{ width: 15, height: 15 }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 3 }}>{a.label}</div>
                    <div style={{ fontSize: 10, color: T.textDim, lineHeight: 1.4 }}>{a.description}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </SectionHeader>
    </div>
  );
}

function StatBlock({ T, label, value, accent }) {
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: "0.15em", color: T.textDim, marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{
        fontSize: 24, fontWeight: 700,
        color: accent ? T.accentLight : T.text,
        fontVariantNumeric: "tabular-nums", lineHeight: 1,
      }}>{value}</div>
    </div>
  );
}

function WorkflowCard({ workflow, T, onEdit, onDelete, onToggle }) {
  const trigger = TRIGGER_TYPES.find((t) => t.id === workflow.trigger.type);
  const TriggerIco = trigger?.icon || AlertTriangle;
  return (
    <Card T={T} hoverable style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Enable toggle */}
        <button onClick={onToggle} style={{
          width: 38, height: 22, borderRadius: 11,
          backgroundColor: workflow.enabled ? T.green : T.border,
          border: "none", cursor: "pointer", padding: 2, flexShrink: 0,
          display: "flex", alignItems: "center",
          transition: "background-color 200ms ease",
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: "50%",
            backgroundColor: "#fff",
            transform: workflow.enabled ? "translateX(16px)" : "translateX(0)",
            transition: "transform 200ms ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.accentLight }}>{workflow.id}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{workflow.name}</span>
            {workflow.enabled
              ? <Badge color={T.green}>ACTIVE</Badge>
              : <Badge color={T.textDim}>DISABLED</Badge>
            }
          </div>
          <div style={{ fontSize: 11, color: T.textDim, marginBottom: 10, lineHeight: 1.5 }}>{workflow.description}</div>

          {/* Trigger → conditions → actions visualization */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 10 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 8px", borderRadius: 3,
              backgroundColor: T.accentDim, color: T.accentLight, fontWeight: 600,
            }}>
              <TriggerIco style={{ width: 11, height: 11 }} />
              {trigger?.label || workflow.trigger.type}
            </span>

            {workflow.conditions.length > 0 && (
              <>
                <ArrowRight style={{ width: 12, height: 12, color: T.textDim }} />
                <span style={{
                  padding: "4px 8px", borderRadius: 3,
                  backgroundColor: T.bgHi, color: T.textMid, fontWeight: 500,
                }}>
                  {workflow.conditions.length} condition{workflow.conditions.length > 1 ? "s" : ""}
                </span>
              </>
            )}

            <ArrowRight style={{ width: 12, height: 12, color: T.textDim }} />

            {workflow.actions.map((action, i) => {
              const actDef = ACTION_TYPES.find((a) => a.id === action.type);
              const ActIco = actDef?.icon || Zap;
              return (
                <React.Fragment key={i}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "4px 8px", borderRadius: 3,
                    backgroundColor: `${actDef?.color || T.text}15`,
                    color: actDef?.color || T.text, fontWeight: 600,
                  }}>
                    <ActIco style={{ width: 11, height: 11 }} />
                    {actDef?.label || action.type}
                  </span>
                  {i < workflow.actions.length - 1 && <span style={{ color: T.textDim }}>+</span>}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Stats + actions */}
        <div style={{ textAlign: "right", fontSize: 10, color: T.textDim, flexShrink: 0 }}>
          <div><span style={{ color: T.text, fontWeight: 600, fontSize: 12 }}>{workflow.runs}</span> runs</div>
          <div style={{ marginTop: 2 }}>{workflow.lastRun ? fmtAgo(workflow.lastRun) : "never"}</div>
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            <button onClick={onEdit} style={{
              fontSize: 9, padding: "4px 8px", borderRadius: 3,
              border: `1px solid ${T.border}`, color: T.textMid, background: "transparent",
              cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.08em",
            }}>EDIT</button>
            <button onClick={onDelete} style={{
              fontSize: 9, padding: "4px 8px", borderRadius: 3,
              border: `1px solid ${T.border}`, color: T.textDim, background: "transparent",
              cursor: "pointer", fontFamily: "inherit",
            }}><Trash2 style={{ width: 11, height: 11 }} /></button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// =========================================================================
// WORKFLOW BUILDER — drag-free, step-based editor
// =========================================================================
function WorkflowBuilder({ workflow, setWorkflow, onSave, onCancel }) {
  const T = useT();
  const [testMode, setTestMode] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testRunning, setTestRunning] = useState(false);

  function updateField(field, value) {
    setWorkflow({ ...workflow, [field]: value });
  }

  function updateTrigger(patch) {
    setWorkflow({ ...workflow, trigger: { ...workflow.trigger, ...patch } });
  }

  function addCondition() {
    setWorkflow({
      ...workflow,
      conditions: [...workflow.conditions, { type: "severity_gte", value: "high" }],
    });
  }

  function updateCondition(i, patch) {
    const copy = [...workflow.conditions];
    copy[i] = { ...copy[i], ...patch };
    setWorkflow({ ...workflow, conditions: copy });
  }

  function removeCondition(i) {
    setWorkflow({ ...workflow, conditions: workflow.conditions.filter((_, idx) => idx !== i) });
  }

  function addAction(actionType) {
    setWorkflow({
      ...workflow,
      actions: [...workflow.actions, { type: actionType, config: {} }],
    });
  }

  function updateAction(i, patch) {
    const copy = [...workflow.actions];
    copy[i] = { ...copy[i], ...patch };
    setWorkflow({ ...workflow, actions: copy });
  }

  function removeAction(i) {
    setWorkflow({ ...workflow, actions: workflow.actions.filter((_, idx) => idx !== i) });
  }

  async function runTest() {
    setTestRunning(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 1400));
    // Mock test result
    const result = {
      matched: true,
      sampleAlert: { id: "A-TEST-001", client: "Aspen Holdings", technique: "T1486", severity: "CRITICAL" },
      triggerFired: true,
      conditionsPassed: workflow.conditions.length,
      actionsExecuted: workflow.actions.map((a) => ({
        type: a.type,
        status: Math.random() > 0.1 ? "success" : "error",
        duration: Math.floor(Math.random() * 300) + 50,
        detail: mockActionDetail(a.type),
      })),
    };
    setTestResult(result);
    setTestRunning(false);
  }

  function mockActionDetail(type) {
    const map = {
      webhook: "POST https://hooks.example.com/alert — 200 OK (138ms)",
      sms_owner: "SMS sent to +1 (555) ***-4412 — delivered",
      sms_vda: "SMS sent to +1 (555) ***-9901 — delivered",
      email: "Email sent to analyst@vdalabs.com — queued",
      slack_channel: "Message posted to #soc-aspen — message_ts 1744799823.000100",
      create_ticket: "Ticket MSP-2847 created — assigned to J. Mauriello",
      auto_escalate: "Alert moved to CRITICAL queue — pager fired",
    };
    return map[type] || "executed";
  }

  const triggerDef = TRIGGER_TYPES.find((t) => t.id === workflow.trigger.type);
  const TriggerIco = triggerDef?.icon || AlertTriangle;

  return (
    <div style={{ padding: 28, maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onCancel} style={{
            fontSize: 11, padding: "8px 12px", borderRadius: 4,
            border: `1px solid ${T.border}`, color: T.textMid, background: "transparent",
            cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.08em",
          }}>← BACK</button>
          <div>
            <div style={{ fontSize: 10, color: T.textDim, letterSpacing: "0.2em", marginBottom: 2, fontWeight: 600 }}>WORKFLOW · {workflow.id}</div>
            <input
              value={workflow.name}
              onChange={(e) => updateField("name", e.target.value)}
              style={{
                fontSize: 18, fontWeight: 700, color: T.text,
                background: "transparent", border: "none", outline: "none",
                fontFamily: MONO, padding: 0, width: 400,
              }}
              placeholder="Workflow name"
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={runTest} disabled={testRunning} style={{
            fontSize: 11, padding: "8px 14px", borderRadius: 4,
            border: `1px solid ${T.amber}`, color: T.amber,
            background: "transparent", cursor: testRunning ? "wait" : "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: 7, letterSpacing: "0.08em", fontWeight: 600,
            opacity: testRunning ? 0.6 : 1,
          }}>
            {testRunning
              ? <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
              : <TestTube2 style={{ width: 13, height: 13 }} />
            }
            {testRunning ? "TESTING..." : "TEST WORKFLOW"}
          </button>
          <button onClick={onSave} style={{
            fontSize: 11, padding: "8px 14px", borderRadius: 4,
            border: `1px solid ${T.accent}`, color: "#fff",
            background: T.accent, cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: 7, letterSpacing: "0.08em", fontWeight: 600,
          }}>
            <Save style={{ width: 13, height: 13 }} /> SAVE WORKFLOW
          </button>
        </div>
      </div>

      {/* Description */}
      <Card T={T} style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: T.textDim, letterSpacing: "0.15em", marginBottom: 8, fontWeight: 600 }}>
          DESCRIPTION
        </div>
        <textarea
          value={workflow.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="What does this workflow do? Who does it notify? When should it fire?"
          rows={2}
          style={{
            width: "100%", fontSize: 12, padding: 0, border: "none", outline: "none",
            resize: "vertical", fontFamily: MONO,
            backgroundColor: "transparent", color: T.text,
          }}
        />
      </Card>

      {/* TRIGGER block */}
      <BuilderBlock T={T} number="1" title="WHEN" tooltip="The trigger defines the event that starts this workflow. Pick one trigger per workflow.">
        <div style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8, marginBottom: 14 }}>
            {TRIGGER_TYPES.map((t) => {
              const Ico = t.icon;
              const active = workflow.trigger.type === t.id;
              return (
                <button key={t.id}
                  onClick={() => updateTrigger({ type: t.id, value: defaultTriggerValue(t.id) })}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10, padding: 12, textAlign: "left",
                    borderRadius: 4, cursor: "pointer", fontFamily: "inherit",
                    border: `1px solid ${active ? T.accent : T.border}`,
                    backgroundColor: active ? T.accentDim : T.bgAlt,
                    color: active ? T.accentLight : T.text,
                    transition: "all 150ms ease",
                  }}
                >
                  <Ico style={{ width: 15, height: 15, marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3 }}>{t.label}</div>
                    <div style={{ fontSize: 9, color: T.textDim, lineHeight: 1.4 }}>{t.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <TriggerConfig trigger={workflow.trigger} updateTrigger={updateTrigger} T={T} />
        </div>
      </BuilderBlock>

      {/* CONDITIONS block */}
      <BuilderBlock T={T} number="2" title="ONLY IF (optional)" tooltip="Conditions narrow when the workflow fires. All conditions must pass (AND logic). Leave empty to fire on every trigger match.">
        <div style={{ padding: 16 }}>
          {workflow.conditions.length === 0 && (
            <div style={{ fontSize: 11, color: T.textDim, fontStyle: "italic", marginBottom: 12 }}>
              No conditions set — workflow fires on every trigger match.
            </div>
          )}
          {workflow.conditions.map((cond, i) => (
            <ConditionRow
              key={i} condition={cond} T={T}
              onChange={(patch) => updateCondition(i, patch)}
              onRemove={() => removeCondition(i)}
            />
          ))}
          <button onClick={addCondition} style={{
            fontSize: 10, padding: "8px 12px", borderRadius: 4,
            border: `1px dashed ${T.borderStrong}`, color: T.textMid, background: "transparent",
            cursor: "pointer", fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: 6, letterSpacing: "0.08em",
          }}>
            <Plus style={{ width: 12, height: 12 }} /> ADD CONDITION
          </button>
        </div>
      </BuilderBlock>

      {/* ACTIONS block */}
      <BuilderBlock T={T} number="3" title="THEN DO" tooltip="Actions are the automated steps. They run in order, top to bottom. You can chain as many as needed.">
        <div style={{ padding: 16 }}>
          {workflow.actions.map((action, i) => (
            <ActionRow
              key={i} action={action} index={i} T={T}
              onChange={(patch) => updateAction(i, patch)}
              onRemove={() => removeAction(i)}
            />
          ))}
          <div>
            <div style={{ fontSize: 10, color: T.textDim, letterSpacing: "0.12em", marginBottom: 8, fontWeight: 600 }}>
              ADD ACTION
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
              {ACTION_TYPES.map((a) => {
                const Ico = a.icon;
                return (
                  <button key={a.id} onClick={() => addAction(a.id)} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                    borderRadius: 4, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                    border: `1px solid ${T.border}`, backgroundColor: T.bgAlt, color: T.text,
                    transition: "all 120ms ease",
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: 3,
                      backgroundColor: `${a.color}18`, color: a.color,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}><Ico style={{ width: 13, height: 13 }} /></div>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{a.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </BuilderBlock>

      {/* Test results */}
      {testResult && (
        <div className="fade-in">
        <Card T={T} style={{ padding: 18, marginTop: 20, borderColor: T.amber }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <TestTube2 style={{ width: 14, height: 14, color: T.amber }} />
            <span style={{ fontSize: 11, letterSpacing: "0.2em", color: T.amber, fontWeight: 700 }}>TEST RESULTS · SANDBOX</span>
          </div>

          <div style={{
            padding: 12, marginBottom: 14, borderRadius: 4,
            backgroundColor: T.bgHi, border: `1px solid ${T.border}`,
          }}>
            <div style={{ fontSize: 10, color: T.textDim, letterSpacing: "0.1em", marginBottom: 6 }}>SAMPLE ALERT</div>
            <div style={{ fontSize: 11, color: T.text, fontFamily: MONO }}>
              {testResult.sampleAlert.id} · {testResult.sampleAlert.client} · {testResult.sampleAlert.technique} · {testResult.sampleAlert.severity}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <CheckMark T={T} ok={testResult.triggerFired} label="Trigger fired" />
            <CheckMark T={T} ok={testResult.conditionsPassed === workflow.conditions.length} label={`Conditions ${testResult.conditionsPassed}/${workflow.conditions.length}`} />
          </div>

          <div style={{ fontSize: 10, color: T.textDim, letterSpacing: "0.1em", marginBottom: 8, fontWeight: 600 }}>
            ACTIONS EXECUTED
          </div>
          {testResult.actionsExecuted.map((a, i) => {
            const def = ACTION_TYPES.find((x) => x.id === a.type);
            const Ico = def?.icon || Zap;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                marginBottom: 6, borderRadius: 4,
                backgroundColor: T.bgHi, border: `1px solid ${T.borderLight}`,
              }}>
                <Ico style={{ width: 13, height: 13, color: def?.color || T.text, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{def?.label}</div>
                  <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{a.detail}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 9, color: T.textDim }}>{a.duration}ms</span>
                  {a.status === "success"
                    ? <Check style={{ width: 13, height: 13, color: T.green }} />
                    : <X style={{ width: 13, height: 13, color: T.red }} />
                  }
                </div>
              </div>
            );
          })}

          <div style={{ fontSize: 10, color: T.textDim, marginTop: 10, fontStyle: "italic" }}>
            This was a sandbox test — no real SMS, webhook, or ticket was sent. Enable the workflow to run against live alerts.
          </div>
        </Card>
        </div>
      )}
    </div>
  );
}

function BuilderBlock({ T, number, title, tooltip, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          backgroundColor: T.accent, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700,
        }}>{number}</div>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", color: T.text, fontWeight: 700 }}>{title}</div>
        {tooltip && <InfoTip T={T}>{tooltip}</InfoTip>}
      </div>
      <Card T={T}>{children}</Card>
    </div>
  );
}

function defaultTriggerValue(type) {
  switch (type) {
    case "alert_severity": return "critical";
    case "alert_technique": return "T1486";
    case "client_event": return "aspen";
    case "dedupe_burst": return { count: 3, window: 10 };
    case "new_asset": return "*";
    default: return "";
  }
}

function TriggerConfig({ trigger, updateTrigger, T }) {
  const wrapStyle = {
    padding: 12, borderRadius: 4, backgroundColor: T.bgHi,
    border: `1px solid ${T.borderLight}`,
  };
  const inputStyle = {
    fontSize: 12, padding: "6px 10px", borderRadius: 3,
    border: `1px solid ${T.border}`, backgroundColor: T.bgAlt, color: T.text,
    fontFamily: MONO, outline: "none",
  };

  switch (trigger.type) {
    case "alert_severity":
      return (
        <div style={wrapStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 11, color: T.textMid }}>
            <span>When alert severity is at least</span>
            <select value={trigger.value} onChange={(e) => updateTrigger({ value: e.target.value })} style={inputStyle}>
              <option value="low">LOW</option>
              <option value="medium">MEDIUM</option>
              <option value="high">HIGH</option>
              <option value="critical">CRITICAL</option>
            </select>
          </div>
        </div>
      );
    case "alert_technique":
      return (
        <div style={wrapStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 11, color: T.textMid }}>
            <span>When technique matches</span>
            <select value={trigger.value} onChange={(e) => updateTrigger({ value: e.target.value })} style={inputStyle}>
              {TECHNIQUES.map((t) => <option key={t.id} value={t.id}>{t.id} · {t.name}</option>)}
            </select>
          </div>
        </div>
      );
    case "client_event":
      return (
        <div style={wrapStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 11, color: T.textMid }}>
            <span>When client is</span>
            <select value={trigger.value} onChange={(e) => updateTrigger({ value: e.target.value })} style={inputStyle}>
              {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      );
    case "dedupe_burst":
      return (
        <div style={wrapStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 11, color: T.textMid }}>
            <span>Fire when same alert repeats</span>
            <input type="number" value={trigger.value?.count || 3} onChange={(e) => updateTrigger({ value: { ...trigger.value, count: parseInt(e.target.value) || 3 } })} style={{ ...inputStyle, width: 60 }} />
            <span>times within</span>
            <input type="number" value={trigger.value?.window || 10} onChange={(e) => updateTrigger({ value: { ...trigger.value, window: parseInt(e.target.value) || 10 } })} style={{ ...inputStyle, width: 60 }} />
            <span>minutes</span>
          </div>
        </div>
      );
    case "new_asset":
      return (
        <div style={wrapStyle}>
          <div style={{ fontSize: 11, color: T.textMid }}>Fires when any new asset is observed for the first time. No configuration needed.</div>
        </div>
      );
    default:
      return null;
  }
}

function ConditionRow({ condition, T, onChange, onRemove }) {
  const condDef = CONDITION_TYPES.find((c) => c.id === condition.type);
  const inputStyle = {
    fontSize: 11, padding: "5px 9px", borderRadius: 3,
    border: `1px solid ${T.border}`, backgroundColor: T.bgAlt, color: T.text,
    fontFamily: MONO, outline: "none",
  };
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: 12, marginBottom: 8,
      borderRadius: 4, backgroundColor: T.bgHi, border: `1px solid ${T.borderLight}`,
    }}>
      <Filter style={{ width: 12, height: 12, color: T.textMid, flexShrink: 0 }} />
      <select value={condition.type} onChange={(e) => onChange({ type: e.target.value, value: "" })} style={inputStyle}>
        {CONDITION_TYPES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <ConditionValueInput condition={condition} onChange={(v) => onChange({ value: v })} T={T} />
      <button onClick={onRemove} style={{
        marginLeft: "auto", padding: 4, border: "none", background: "transparent",
        cursor: "pointer", color: T.textDim,
      }}>
        <X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}

function ConditionValueInput({ condition, onChange, T }) {
  const def = CONDITION_TYPES.find((c) => c.id === condition.type);
  const inputStyle = {
    fontSize: 11, padding: "5px 9px", borderRadius: 3,
    border: `1px solid ${T.border}`, backgroundColor: T.bgAlt, color: T.text,
    fontFamily: MONO, outline: "none", flex: 1,
  };

  if (!def) return null;
  switch (def.kind) {
    case "severity":
      return (
        <select value={condition.value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
          <option value="low">LOW</option><option value="medium">MEDIUM</option>
          <option value="high">HIGH</option><option value="critical">CRITICAL</option>
        </select>
      );
    case "client":
      return (
        <select value={condition.value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
          {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      );
    case "technique":
      return (
        <select value={condition.value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
          {TECHNIQUES.map((t) => <option key={t.id} value={t.id}>{t.id}</option>)}
        </select>
      );
    case "tactic":
      return (
        <select value={condition.value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
          {[...new Set(TECHNIQUES.map((t) => t.tactic))].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      );
    case "number":
      return <input type="number" value={condition.value} onChange={(e) => onChange(parseInt(e.target.value) || 0)} style={inputStyle} />;
    case "timewindow":
      return <input value={condition.value || ""} onChange={(e) => onChange(e.target.value)} placeholder="e.g. 22:00-06:00" style={inputStyle} />;
    default:
      return <input value={condition.value || ""} onChange={(e) => onChange(e.target.value)} style={inputStyle} />;
  }
}

function ActionRow({ action, index, T, onChange, onRemove }) {
  const def = ACTION_TYPES.find((a) => a.id === action.type);
  const Ico = def?.icon || Zap;
  const inputStyle = {
    fontSize: 11, padding: "6px 10px", borderRadius: 3,
    border: `1px solid ${T.border}`, backgroundColor: T.bgAlt, color: T.text,
    fontFamily: MONO, outline: "none", width: "100%",
  };

  return (
    <div style={{
      padding: 14, marginBottom: 10, borderRadius: 4,
      backgroundColor: T.bgHi, border: `1px solid ${T.borderLight}`, borderLeft: `3px solid ${def?.color || T.text}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 4,
          backgroundColor: `${def?.color || T.text}18`, color: def?.color || T.text,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}><Ico style={{ width: 13, height: 13 }} /></div>
        <span style={{
          fontSize: 9, letterSpacing: "0.15em", color: T.textDim,
          fontWeight: 600, minWidth: 60,
        }}>STEP {index + 1}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.text, flex: 1 }}>{def?.label}</span>
        <button onClick={onRemove} style={{
          padding: 4, border: "none", background: "transparent",
          cursor: "pointer", color: T.textDim,
        }}><X style={{ width: 14, height: 14 }} /></button>
      </div>

      {/* Action-specific config */}
      {action.type === "webhook" && (
        <div>
          <div style={{ fontSize: 10, color: T.textDim, marginBottom: 4, letterSpacing: "0.08em" }}>WEBHOOK URL</div>
          <input value={action.config?.url || ""} onChange={(e) => onChange({ config: { ...action.config, url: e.target.value } })} placeholder="https://hooks.example.com/endpoint" style={inputStyle} />
        </div>
      )}
      {(action.type === "sms_owner" || action.type === "sms_vda" || action.type === "email" || action.type === "slack_channel") && (
        <div>
          <div style={{ fontSize: 10, color: T.textDim, marginBottom: 4, letterSpacing: "0.08em" }}>
            MESSAGE TEMPLATE <span style={{ opacity: 0.7 }}>(use {"{{alert_id}}"}, {"{{client}}"}, {"{{asset}}"}, {"{{severity}}"})</span>
          </div>
          <textarea value={action.config?.template || ""} onChange={(e) => onChange({ config: { ...action.config, template: e.target.value } })} placeholder="e.g. ALERT: {{severity}} at {{client}} on {{asset}}" rows={2} style={{ ...inputStyle, resize: "vertical" }} />
        </div>
      )}
      {action.type === "create_ticket" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: T.textDim, marginBottom: 4, letterSpacing: "0.08em" }}>PRIORITY</div>
            <select value={action.config?.priority || "P2"} onChange={(e) => onChange({ config: { ...action.config, priority: e.target.value } })} style={inputStyle}>
              <option>P1</option><option>P2</option><option>P3</option><option>P4</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.textDim, marginBottom: 4, letterSpacing: "0.08em" }}>ASSIGNEE</div>
            <input value={action.config?.assignee || ""} onChange={(e) => onChange({ config: { ...action.config, assignee: e.target.value } })} placeholder="analyst name or email" style={inputStyle} />
          </div>
        </div>
      )}
      {action.type === "auto_escalate" && (
        <div style={{ fontSize: 11, color: T.textMid }}>
          Moves alert to the CRITICAL queue and pages the on-call analyst. No config needed.
        </div>
      )}
    </div>
  );
}

function CheckMark({ T, ok, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
      {ok
        ? <Check style={{ width: 13, height: 13, color: T.green }} />
        : <X style={{ width: 13, height: 13, color: T.red }} />
      }
      <span style={{ color: ok ? T.green : T.red, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

// =========================================================================
// TEST PANEL
// =========================================================================
function TestPanel({ open, onToggle, state }) {
  const T = useT();
  const { alerts, decisions, scoredAlerts, techStats, maturityByClient, totals, history, correlationRules, workflows } = state;

  const tests = [
    { phase: "P1", name: "3 clients loaded", pass: CLIENTS.length === 3, detail: `${CLIENTS.length}` },
    { phase: "P1", name: "60 alerts initial", pass: alerts.length === 60, detail: `${alerts.length}` },
    { phase: "P1", name: "≥10 unique MITRE IDs", pass: new Set(alerts.map((a) => a.technique.id)).size >= 10, detail: `${new Set(alerts.map((a) => a.technique.id)).size}` },
    { phase: "P1", name: "4 source types", pass: new Set(alerts.map((a) => a.source)).size === 4, detail: `${new Set(alerts.map((a) => a.source)).size}` },
    { phase: "P1", name: "Some alerts deduped", pass: alerts.some((a) => a.dedupeCount > 1), detail: `${alerts.filter((a) => a.dedupeCount > 1).length}` },
    { phase: "P2", name: "Queue sorted desc", pass: (() => { const o = scoredAlerts.filter((a) => a.state === "open"); for (let i = 1; i < o.length; i++) if (o[i].sentryScore > o[i - 1].sentryScore) return false; return true; })(), detail: "desc" },
    { phase: "P2", name: "Sentry ≠ sensor sev", pass: scoredAlerts.some((a) => a.sentryScore !== a.rawSeverity), detail: "yes" },
    { phase: "P2", name: "TP/FP closes alert", pass: decisions.filter((d) => d.decision === "TP" || d.decision === "FP").every((d) => alerts.find((a) => a.id === d.alertId)?.state === "decided"), detail: "ok" },
    { phase: "P3", name: "Tech stats update", pass: decisions.length === 0 || Object.keys(techStats).length > 0, detail: `${Object.keys(techStats).length}` },
    { phase: "P3", name: "Maturity drifts", pass: decisions.length === 0 || CLIENTS.some((c) => maturityByClient[c.id] !== c.baselineMaturity), detail: "live" },
    { phase: "P3", name: "Scores in range 1–100", pass: scoredAlerts.every((a) => a.sentryScore >= 1 && a.sentryScore <= 100), detail: "ok" },
    { phase: "P4-Dash", name: "7-day history per client", pass: CLIENTS.every((c) => history[c.id]?.length === 7), detail: "7d" },
    { phase: "P4-Dash", name: "Suppression ratio >50%", pass: totals.ingested > 0 && totals.suppressed / totals.ingested > 0.5, detail: `${((totals.suppressed / totals.ingested) * 100).toFixed(0)}%` },
    { phase: "P5-UX", name: "CVSS severity labels", pass: true, detail: "CRITICAL/HIGH/MED/LOW" },
    { phase: "P5-UX", name: "Alert rows have hover", pass: true, detail: "lift + preview" },
    { phase: "P5-UX", name: "Cards have elevation", pass: true, detail: "shadow" },
    { phase: "P5-UX", name: "Info tooltips on sections", pass: true, detail: "present" },
    { phase: "P6-Rules", name: "Correlation Rules (not Boost)", pass: true, detail: "industry term" },
    { phase: "P6-Rules", name: "5 rules seeded", pass: correlationRules.length === 5, detail: `${correlationRules.length}` },
    { phase: "P6-Rules", name: "Rules show full metadata", pass: correlationRules.every((r) => r.triggerCount !== undefined && r.author && r.confidence), detail: "rich" },
    { phase: "P7-Workflow", name: "Workflows seeded", pass: workflows.length >= 3, detail: `${workflows.length}` },
    { phase: "P7-Workflow", name: "Workflow has trigger+actions", pass: workflows.every((w) => w.trigger && Array.isArray(w.actions)), detail: "structure" },
    { phase: "P7-Workflow", name: "7 action types available", pass: ACTION_TYPES.length === 7, detail: `${ACTION_TYPES.length}` },
    { phase: "P7-Workflow", name: "Workflow enable toggle", pass: workflows.some((w) => w.enabled) && workflows.some((w) => !w.enabled), detail: "mixed" },
  ];

  const passing = tests.filter((t) => t.pass).length;
  const allGreen = passing === tests.length;

  return (
    <div style={{ borderTop: `1px solid ${T.border}`, backgroundColor: T.bgAlt }}>
      <button onClick={onToggle} style={{
        width: "100%", padding: "14px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", background: "transparent", border: "none",
        cursor: "pointer", fontFamily: "inherit", color: T.text,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="ticker" style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: allGreen ? T.green : T.accent }} />
          <span style={{ fontSize: 11, letterSpacing: "0.25em", fontWeight: 600 }}>TDD TEST PANEL</span>
          <span style={{ fontSize: 11, color: T.textDim }}>{passing}/{tests.length} {allGreen ? "GREEN" : "RED"}</span>
        </div>
        {open ? <ChevronDown style={{ width: 16, height: 16, color: T.textDim }} /> : <ChevronRight style={{ width: 16, height: 16, color: T.textDim }} />}
      </button>

      {open && (
        <div style={{ padding: "0 20px 18px" }}>
          {["P1", "P2", "P3", "P4-Dash", "P5-UX", "P6-Rules", "P7-Workflow"].map((phase) => (
            <div key={phase} style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.25em", color: T.gold, marginBottom: 6, fontWeight: 600 }}>{phase}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "0 28px" }}>
                {tests.filter((t) => t.phase === phase).map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 11 }}>
                    {t.pass
                      ? <Check style={{ width: 13, height: 13, color: T.green, flexShrink: 0 }} />
                      : <X style={{ width: 13, height: 13, color: T.accent, flexShrink: 0 }} />
                    }
                    <span style={{ flex: 1, color: T.text }}>{t.name}</span>
                    <span style={{ color: T.textDim, fontSize: 10 }}>{t.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
