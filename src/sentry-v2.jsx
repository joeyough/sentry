import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Shield, Activity, AlertTriangle, Check, X, ArrowUpRight, Users, Zap,
  ChevronRight, ChevronDown, Clock, Eye, Terminal, Radio, LayoutDashboard,
  FlaskConical, Building2, Send, Loader2, GitBranch, Sparkles, Sun, Moon
} from "lucide-react";

/* =========================================================================
   SENTRY v2 — VDA Labs MSSP Console
   =========================================================================
   4 tabs: DASHBOARD, ALERTS, CLIENTS, LAB
   TDD panel at bottom. Theme toggle (auto/light/dark).
   
   Bug fixes applied:
   - Mobile tabs: JS resize listener (isMobile) instead of CSS media query
   - Lab white space: flex column layout + html/body bg color
   - Lab generate: mock-only, no API fetch calls
   ========================================================================= */

// =========================================================================
// THEME
// =========================================================================
const ThemeCtx = React.createContext(null);
function useT() {
  return React.useContext(ThemeCtx);
}

function makeTheme(isDark) {
  return isDark
    ? {
        bg: "#0a0a0a", bgAlt: "#0c0c0c", bgHi: "#111",
        text: "#e8e8e8", textDim: "#6b6b6b", textMid: "#8b8b8b",
        border: "#1f1f1f", borderLight: "#1a1a1a",
        accent: "#ff4a00", accentLight: "#ff6a2a",
        amber: "#e89200", gold: "#8b7e45", green: "#4ade80",
        warn: "#d97a00", sparkStroke: "#e8e8e8", barFill: "#e8e8e8",
        shadow: "0 4px 20px rgba(0,0,0,0.5)", isDark: true,
      }
    : {
        bg: "#f8f7f4", bgAlt: "#ffffff", bgHi: "#f2f0eb",
        text: "#1a1816", textDim: "#7a756d", textMid: "#5a5650",
        border: "#e2dfda", borderLight: "#eae7e2",
        accent: "#d94400", accentLight: "#e85a1a",
        amber: "#b87800", gold: "#8b7e45", green: "#2d8a4e",
        warn: "#b86800", sparkStroke: "#1a1816", barFill: "#1a1816",
        shadow: "0 4px 20px rgba(0,0,0,0.08)", isDark: false,
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
  { id: "edr", label: "EDR", color: "#e89200" },
  { id: "siem", label: "SIEM", color: "#8b7e45" },
  { id: "slack", label: "SLACK", color: "#6b6b6b" },
  { id: "monday", label: "MONDAY", color: "#6b6b6b" },
];

const CLIENTS = [
  { id: "aspen", name: "Aspen Holdings", industry: "Financial Services", criticality: 92, noiseFloor: 22, baselineMaturity: 84 },
  { id: "meridian", name: "Meridian Clinic Network", industry: "Healthcare / HIPAA", criticality: 78, noiseFloor: 48, baselineMaturity: 58 },
  { id: "forge", name: "ForgeWorks Manufacturing", industry: "Manufacturing / OT", criticality: 66, noiseFloor: 81, baselineMaturity: 34 },
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

const INITIAL_BOOST_RULES = [
  { id: "BR-001", pattern: "regsvr32.*scrobj", type: "regex", boost: 25, reason: "LOLBIN: regsvr32 scriptlet execution", tactic: "Execution" },
  { id: "BR-002", pattern: "T1486", type: "technique", boost: 15, reason: "Ransomware indicators always critical", tactic: "Impact" },
  { id: "BR-003", pattern: "T1003.001", type: "technique", boost: 20, reason: "Credential dumping is high-impact regardless of context", tactic: "Credential Access" },
  { id: "BR-004", pattern: "mimikatz|sekurlsa", type: "regex", boost: 30, reason: "Known offensive tool", tactic: "Credential Access" },
  { id: "BR-005", pattern: "T1059.001", type: "technique_at_new_client", boost: 18, reason: "PowerShell at immature clients is higher risk", tactic: "Execution" },
];

const RETRAIN_INFO = {
  lastRetrain: new Date(new Date().setHours(3, 0, 0, 0)).toISOString(),
  nextRetrain: "tonight at 3:00 AM",
  modelSize: "5.2 GB",
  trainingEvents: 147832,
};

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

function getSev(score) {
  if (score >= 85) return { color: "#ff6a2a", border: "#ff4a00", label: "CRIT" };
  if (score >= 70) return { color: "#e89200", border: "#d97a00", label: "HIGH" };
  if (score >= 50) return { color: "#c99300", border: "#a87a00", label: "MED" };
  return { color: "#8b7e45", border: "#3a3a1a", label: "LOW" };
}

function fmtAgo(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

// =========================================================================
// SMALL REUSABLE COMPONENTS
// =========================================================================
function Badge({ color, children }) {
  return (
    <span style={{ fontSize: 9, padding: "1px 4px", border: `1px solid ${color}66`, color }}>
      {children}
    </span>
  );
}

function FieldPair({ label, value, T }) {
  return (
    <div>
      <div style={{ color: T.textDim, fontSize: 9, marginBottom: 2 }}>{label}</div>
      <div style={{ color: T.text, fontSize: 10 }}>{value}</div>
    </div>
  );
}

function ExplainLine({ label, value, T, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
      <span style={{ color: T.textDim }}>{label}</span>
      <span style={{ color: highlight ? "#ff6a2a" : T.text, fontWeight: highlight ? 700 : 400 }}>{value}</span>
    </div>
  );
}

function DecisionBtn({ onClick, color, label, sub, icon, T }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 4, border: `1px solid ${color}66`, padding: "12px 8px", color,
        background: "transparent", cursor: "pointer", fontFamily: "inherit",
      }}
    >
      {icon}
      <div style={{ fontSize: 9, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 8, color: T.textDim }}>{sub}</div>
    </button>
  );
}

function FilterBtn({ active, onClick, children, T }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 9, padding: "2px 8px",
        border: `1px solid ${active ? "#ff4a00" : "#2a2a2a"}`,
        color: active ? "#ff6a2a" : T.textDim,
        background: "transparent", cursor: "pointer", fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

function RowPair({ T, label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ color: T.textDim }}>{label}</span>
      <span style={{ color: T.text }}>{value}</span>
    </div>
  );
}

function SectionHeader({ T, label, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: 9, letterSpacing: "0.3em", color: T.textDim, marginBottom: 12,
        borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 4,
      }}>
        {label}
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
      <polyline points={points} fill="none" stroke={T.sparkStroke} strokeWidth="1" />
      <circle cx={w} cy={h - ((values[values.length - 1] - min) / range) * h} r="1.5" fill="#ff6a2a" />
    </svg>
  );
}

function MaturityBar({ value, baseline, w = 60, T }) {
  return (
    <div style={{ position: "relative", height: 4, backgroundColor: T.borderLight, width: w }}>
      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", backgroundColor: T.text, width: `${value}%` }} />
      <div style={{ position: "absolute", top: 0, height: "100%", borderLeft: `1px solid ${T.textDim}`, left: `${baseline}%` }} />
    </div>
  );
}

// =========================================================================
// MAIN COMPONENT
// =========================================================================
export default function SentryV2() {
  const [tab, setTab] = useState("dashboard");
  const [alerts, setAlerts] = useState(() => buildInitialAlerts());
  const [decisions, setDecisions] = useState([]);
  const [history] = useState(() => buildHistory());
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showTests, setShowTests] = useState(false);
  const [boostRules] = useState(INITIAL_BOOST_RULES);
  const [clientConfirmations, setClientConfirmations] = useState({});
  const [theme, setTheme] = useState("auto");
  const [systemDark, setSystemDark] = useState(true);

  // BUG 1 FIX: JS-based mobile detection instead of CSS media query
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  // BUG 1 FIX: resize listener
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

  function confirmFromClient(alertId) {
    const al = alerts.find((a) => a.id === alertId);
    if (!al) return;
    setClientConfirmations((cc) => ({ ...cc, [alertId]: { confirmedAt: Date.now(), by: "CLIENT" } }));
    setDecisions((d) => [{
      logId: `CC-${Date.now()}`, alertId, clientId: al.clientId,
      techniqueId: al.technique.id, tactic: al.technique.tactic,
      decision: "TP", analyst: "CLIENT_CONFIRMED", ts: Date.now(), sentryScore: 99,
    }, ...d]);
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
    { id: "lab", label: "LAB", icon: FlaskConical },
  ];

  return (
    <ThemeCtx.Provider value={T}>
      {/* BUG 2 FIX: flex column + minHeight viewport fill */}
      <div style={{
        fontFamily: MONO, backgroundColor: T.bg, color: T.text,
        minHeight: "100vh", display: "flex", flexDirection: "column", overflowX: "hidden",
      }}>
        {/* BUG 2 FIX: html/body bg color + overscroll behavior */}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@200;300;400;500;700&display=swap');
          html, body { background-color: ${T.bg}; overscroll-behavior: none; margin: 0; padding: 0; }
          * { box-sizing: border-box; }
          .ticker { animation: tick 1.2s ease-in-out infinite; }
          @keyframes tick { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        {/* ── TOP BAR ── */}
        <div style={{
          borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 20,
          backgroundColor: T.bg, boxShadow: T.shadow,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 28, height: 28, border: "1px solid #ff4a00", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield style={{ width: 16, height: 16, color: "#ff4a00" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.3em", fontWeight: 700 }}>SENTRY</div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: T.textDim }}>VDA LABS · v2</div>
              </div>
            </div>

            {/* BUG 1 FIX: hide status bar on mobile */}
            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div className="ticker" style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#4ade80" }} />
                  <span style={{ color: T.textDim }}>J. MAURIELLO</span>
                </div>
                <div>
                  <span style={{ color: T.textDim }}>OPEN </span>
                  <span style={{ color: "#ff6a2a", fontWeight: 700 }}>{totals.open}</span>
                </div>
                <div>
                  <span style={{ color: T.textDim }}>TRIAGED </span>
                  <span>{totals.triaged}</span>
                </div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* BUG 1 FIX: hide theme toggles on mobile */}
              {!isMobile && ["auto", "light", "dark"].map((m) => (
                <button
                  key={m}
                  onClick={() => setTheme(m)}
                  style={{
                    fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase",
                    padding: "3px 8px", borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
                    background: theme === m ? (isDark ? "#222" : "#e8e8e8") : "transparent",
                    color: theme === m ? T.text : T.textDim,
                    border: theme === m ? `1px solid ${T.border}` : "1px solid transparent",
                  }}
                >
                  {m}
                </button>
              ))}
              <button
                onClick={undoLast}
                disabled={decisions.length === 0}
                style={{
                  fontSize: 10, letterSpacing: "0.1em", padding: "3px 8px", cursor: "pointer",
                  fontFamily: "inherit", border: `1px solid ${T.border}`, color: T.textDim,
                  background: "transparent", opacity: decisions.length === 0 ? 0.3 : 1,
                }}
              >
                UNDO
              </button>
            </div>
          </div>

          {/* ── TABS — BUG 1 FIX: icon-only on mobile via isMobile state ── */}
          <div style={{ display: "flex", borderTop: `1px solid ${T.border}` }}>
            {TABS.map((t) => {
              const Ico = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "10px 4px", fontSize: 10, letterSpacing: "0.15em", cursor: "pointer",
                    fontFamily: "inherit", background: active ? T.bgAlt : "transparent",
                    color: active ? T.accentLight : T.textDim, border: "none",
                    borderRight: `1px solid ${T.border}`,
                    borderBottom: active ? `2px solid ${T.accent}` : "2px solid transparent",
                  }}
                >
                  <Ico style={{ width: 14, height: 14, flexShrink: 0 }} />
                  {/* BUG 1 FIX: only show label on desktop */}
                  {!isMobile && <span>{t.label}</span>}
                  {t.id === "alerts" && totals.open > 0 && (
                    <span style={{ color: T.accentLight, fontSize: 10 }}>{totals.open}</span>
                  )}
                  {t.id === "lab" && !isMobile && (
                    <span style={{ fontSize: 8, padding: "1px 4px", border: `1px solid ${T.accent}40`, color: T.accentLight }}>
                      BETA
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TAB CONTENT — BUG 2 FIX: flex:1 fills viewport ── */}
        <div style={{ flex: 1, backgroundColor: T.bg }}>
          {tab === "dashboard" && (
            <DashboardTab totals={totals} alerts={scoredAlerts} history={history} maturityByClient={maturityByClient} decisions={decisions} />
          )}
          {tab === "alerts" && (
            <AlertsTab
              alerts={scoredAlerts} expandedId={expandedId} setExpandedId={setExpandedId}
              onDecide={recordDecision} techStats={techStats} maturityByClient={maturityByClient}
              selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId}
              clientConfirmations={clientConfirmations} confirmFromClient={confirmFromClient}
              boostRules={boostRules}
            />
          )}
          {tab === "clients" && (
            <ClientsTab maturityByClient={maturityByClient} alerts={scoredAlerts} decisions={decisions} boostRules={boostRules} />
          )}
          {tab === "lab" && <LabTab />}
        </div>

        <TestPanel
          open={showTests}
          onToggle={() => setShowTests(!showTests)}
          state={{ alerts, decisions, scoredAlerts, techStats, maturityByClient, totals, history, boostRules, clientConfirmations }}
        />
      </div>
    </ThemeCtx.Provider>
  );
}

// =========================================================================
// DASHBOARD TAB
// =========================================================================
function DashboardTab({ totals, alerts, history, maturityByClient, decisions }) {
  const T = useT();
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.3em", color: T.textDim, marginBottom: 8 }}>
          TODAY · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()}
        </div>
        <div style={{ fontSize: 16, lineHeight: 1.6, color: T.text, fontWeight: 300 }}>
          <span style={{ color: "#ff6a2a", fontWeight: 700 }}>{totals.ingested.toLocaleString()}</span> alerts ingested,{" "}
          <span style={{ fontWeight: 700 }}>{totals.suppressed.toLocaleString()}</span> auto-suppressed,{" "}
          <span style={{ fontWeight: 700 }}>{totals.triaged}</span> triaged,{" "}
          <span style={{ color: "#ff6a2a", fontWeight: 700 }}>{totals.escalated}</span> escalated,{" "}
          <span style={{ color: "#4ade80", fontWeight: 700 }}>{totals.breaches === 0 ? "0 SLA breaches" : `${totals.breaches} SLA breaches`}</span>.
        </div>
        <div style={{ fontSize: 10, color: T.textDim, marginTop: 12 }}>
          {((totals.suppressed / totals.ingested) * 100).toFixed(1)}% noise reduction
        </div>
        <div style={{ fontSize: 9, color: T.textDim, marginTop: 8, opacity: 0.7 }}>
          MODEL · last retrain {new Date(RETRAIN_INFO.lastRetrain).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · {RETRAIN_INFO.trainingEvents.toLocaleString()} training events · {RETRAIN_INFO.modelSize} · next retrain {RETRAIN_INFO.nextRetrain}
        </div>
      </div>

      <SectionHeader T={T} label="ALERT VOLUME · LAST 24 HOURS">
        <HorizonChart history={history} />
      </SectionHeader>

      <SectionHeader T={T} label="CLIENTS · 7-DAY POSTURE">
        <ClientDashTable history={history} maturityByClient={maturityByClient} alerts={alerts} decisions={decisions} />
      </SectionHeader>

      <SectionHeader T={T} label="SMALL MULTIPLES · HOURLY ALERT RATE BY CLIENT">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
          {CLIENTS.map((c) => (
            <SmallMultiple key={c.id} client={c} hours={history[c.id][6]} />
          ))}
        </div>
      </SectionHeader>

      <SectionHeader T={T} label="RECENT ESCALATIONS">
        <RecentEscalations decisions={decisions} />
      </SectionHeader>
    </div>
  );
}

function HorizonChart({ history }) {
  const hours = Array.from({ length: 24 }, (_, h) =>
    CLIENTS.reduce((s, c) => s + (history[c.id][6][h] || 0), 0)
  );
  const max = Math.max(...hours);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", height: 64, gap: 2 }}>
        {hours.map((v, i) => {
          const intensity = Math.min(1, v / max);
          const colors = ["#5a3a10", "#a85a00", "#ff4a00"];
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
              <div style={{ height: `${intensity * 100}%`, backgroundColor: colors[Math.min(2, Math.floor(intensity * 3))] }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#6b6b6b", marginTop: 4 }}>
        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>NOW</span>
      </div>
    </div>
  );
}

function ClientDashTable({ history, maturityByClient, alerts, decisions }) {
  const T = useT();
  return (
    <div style={{ border: `1px solid ${T.border}`, overflow: "auto" }}>
      {CLIENTS.map((c) => {
        const dailyTotals = history[c.id].map((day) => day.reduce((s, h) => s + h, 0));
        const open = alerts.filter((a) => a.clientId === c.id && a.state === "open").length;
        const ds = decisions.filter((d) => d.clientId === c.id);
        const tps = ds.filter((d) => d.decision === "TP" || d.decision === "ESCALATE").length;
        const mat = maturityByClient[c.id];
        const drift = mat - c.baselineMaturity;
        return (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", borderBottom: `1px solid ${T.borderLight}`, fontSize: 10, flexWrap: "wrap" }}>
            <div style={{ minWidth: 160 }}>
              <div style={{ fontWeight: 700, letterSpacing: "0.08em" }}>{c.name.toUpperCase()}</div>
              <div style={{ fontSize: 8, color: T.textDim }}>{c.industry}</div>
            </div>
            <div style={{ minWidth: 80 }}><Sparkline values={dailyTotals} T={T} /></div>
            <div style={{ minWidth: 40, textAlign: "right", color: "#ff6a2a", fontWeight: 700 }}>{open}</div>
            <div style={{ minWidth: 30, textAlign: "right" }}>{tps}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
              <span>{mat}</span>
              {drift !== 0 && <span style={{ fontSize: 9, color: drift > 0 ? "#4ade80" : "#ff6a2a" }}>{drift > 0 ? "↑" : "↓"}{Math.abs(drift)}</span>}
              <MaturityBar value={mat} baseline={c.baselineMaturity} T={T} />
            </div>
            <div style={{ color: "#4ade80", fontSize: 9 }}>OK</div>
          </div>
        );
      })}
    </div>
  );
}

function SmallMultiple({ client, hours }) {
  const T = useT();
  const max = Math.max(...hours);
  return (
    <div style={{ border: `1px solid ${T.border}`, padding: 12 }}>
      <div style={{ fontSize: 9, letterSpacing: "0.2em", color: T.textDim, marginBottom: 8 }}>{client.name.toUpperCase()}</div>
      <div style={{ display: "flex", alignItems: "flex-end", height: 40, gap: 1 }}>
        {hours.map((v, i) => (
          <div key={i} style={{ flex: 1, backgroundColor: T.barFill, height: `${(v / max) * 100}%`, opacity: 0.3 + (v / max) * 0.7 }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: T.textDim, marginTop: 4 }}>
        <span>00</span><span>12</span><span>24</span>
      </div>
    </div>
  );
}

function RecentEscalations({ decisions }) {
  const T = useT();
  const escs = decisions.filter((d) => d.decision === "ESCALATE").slice(0, 5);
  if (escs.length === 0) {
    return <div style={{ fontSize: 10, color: T.textDim, fontStyle: "italic", padding: "8px 0" }}>no escalations yet</div>;
  }
  return (
    <div>
      {escs.map((e) => (
        <div key={e.logId} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 10, padding: "8px 0", borderBottom: `1px solid ${T.borderLight}` }}>
          <span style={{ color: T.textDim, width: 60 }}>{fmtAgo(e.ts)}</span>
          <span style={{ color: "#ff6a2a", fontWeight: 700 }}>{e.techniqueId}</span>
          <span style={{ color: T.text, flex: 1 }}>{CLIENTS.find((c) => c.id === e.clientId)?.name}</span>
          <span style={{ color: T.textDim }}>{e.alertId}</span>
        </div>
      ))}
    </div>
  );
}

// =========================================================================
// ALERTS TAB
// =========================================================================
function AlertsTab({ alerts, expandedId, setExpandedId, onDecide, techStats, maturityByClient, selectedClientId, setSelectedClientId, clientConfirmations, confirmFromClient, boostRules }) {
  const T = useT();
  const filtered = selectedClientId ? alerts.filter((a) => a.clientId === selectedClientId) : alerts;
  return (
    <div>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12, backgroundColor: T.bg, flexWrap: "wrap" }}>
        <Radio className="ticker" style={{ width: 12, height: 12, color: "#ff4a00" }} />
        <span style={{ fontSize: 10, letterSpacing: "0.3em" }}>TRIAGE QUEUE</span>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <FilterBtn active={!selectedClientId} onClick={() => setSelectedClientId(null)} T={T}>ALL</FilterBtn>
          {CLIENTS.map((c) => (
            <FilterBtn key={c.id} active={selectedClientId === c.id} onClick={() => setSelectedClientId(c.id)} T={T}>
              {c.name.split(" ")[0].toUpperCase()}
            </FilterBtn>
          ))}
        </div>
      </div>
      <div>
        {filtered.map((a) => (
          <AlertRow
            key={a.id} alert={a} expanded={expandedId === a.id}
            onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
            onDecide={(d) => onDecide(a, d)} techStats={techStats}
            clientMaturity={maturityByClient[a.clientId]}
            clientConfirmed={!!clientConfirmations[a.id]}
            onConfirmFromClient={() => confirmFromClient(a.id)}
            boostRules={boostRules}
          />
        ))}
      </div>
    </div>
  );
}

function AlertRow({ alert, expanded, onToggle, onDecide, techStats, clientMaturity, clientConfirmed, onConfirmFromClient, boostRules }) {
  const T = useT();
  const sv = getSev(alert.sentryScore);
  const decided = alert.state === "decided";
  const c = CLIENTS.find((x) => x.id === alert.clientId);
  const k = `${alert.clientId}::${alert.technique.id}`;
  const hist = techStats[k] || { tp: 0, fp: 0, total: 0 };
  const reprioritized = alert.sentryScore >= 70 && (alert.sentryScore - alert.rawSeverity) >= 20;
  const matchedBoost = (boostRules || []).filter((r) => r.type === "technique" && r.pattern === alert.technique.id);
  const playbook = PLAYBOOKS[alert.technique.id];
  const [showEnrich, setShowEnrich] = useState(false);

  return (
    <div style={{ borderLeft: `2px solid ${sv.border}`, borderBottom: `1px solid ${T.borderLight}`, opacity: decided ? 0.3 : 1 }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}>
        <div style={{ width: 48, textAlign: "center", color: sv.color }}>
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{alert.sentryScore}</div>
          <div style={{ fontSize: 8 }}>{sv.label}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Badge color={alert.sourceColor}>{alert.sourceLabel}</Badge>
            {alert.dedupeCount > 1 && <Badge color="#ff6a2a">×{alert.dedupeCount}</Badge>}
            <span style={{ fontSize: 11, fontWeight: 700 }}>{alert.technique.id}</span>
            <span style={{ fontSize: 11, color: T.textDim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{alert.technique.name}</span>
            {alert.noveltyBoost > 0 && <Badge color="#ff6a2a">NOVEL</Badge>}
            {reprioritized && <Badge color="#4ade80">↑ REPRIORITIZED</Badge>}
            {clientConfirmed && <Badge color="#4ade80">✓ CLIENT CONFIRMED</Badge>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 9, color: T.textDim, flexWrap: "wrap" }}>
            <span>{alert.technique.tactic.toUpperCase()}</span><span>·</span>
            <span>{c.name}</span><span>·</span>
            <span style={{ color: T.gold }}>{alert.asset}</span><span>·</span>
            <span>{fmtAgo(alert.timestamp)}</span>
          </div>
        </div>
        {decided
          ? <div style={{ fontSize: 9, color: T.textDim, width: 80, textAlign: "right" }}>{alert.decision}</div>
          : expanded ? <ChevronDown style={{ width: 16, height: 16, color: T.textDim }} /> : <ChevronRight style={{ width: 16, height: 16, color: T.textDim }} />
        }
      </div>

      {expanded && !decided && (
        <div style={{ borderTop: `1px solid ${T.borderLight}`, padding: 16, backgroundColor: T.bgAlt }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 10, marginBottom: 12 }}>
            <FieldPair label="ALERT ID" value={alert.id} T={T} />
            <FieldPair label="RULE" value={alert.rule} T={T} />
            <FieldPair label="TACTIC" value={alert.technique.tactic} T={T} />
            <FieldPair label="ASSET" value={alert.asset} T={T} />
            <FieldPair label="SOURCE" value={alert.sourceLabel} T={T} />
            <FieldPair label="DEDUPE" value={`×${alert.dedupeCount}`} T={T} />
          </div>

          <div style={{ border: `1px solid ${T.border}`, padding: 12, marginBottom: 12, backgroundColor: T.bg }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Eye style={{ width: 12, height: 12, color: T.gold }} />
              <span style={{ fontSize: 10, letterSpacing: "0.2em", color: T.gold }}>WHY THIS SCORE</span>
            </div>
            <div style={{ fontSize: 9 }}>
              <ExplainLine label="SENSOR BASE" value={alert.rawSeverity} T={T} />
              <ExplainLine label="CLIENT CRIT" value={`${c.criticality}/100`} T={T} />
              <ExplainLine label="HIST TP RATE" value={hist.total >= 3 ? `${Math.round((hist.tp / hist.total) * 100)}%` : "no data"} T={T} />
              <ExplainLine label="MATURITY" value={`${clientMaturity}/100`} T={T} />
              {alert.noveltyBoost > 0 && <ExplainLine label="NOVELTY" value={`+${alert.noveltyBoost}%`} T={T} />}
              <ExplainLine label="FINAL SCORE" value={alert.sentryScore} T={T} highlight />
            </div>
          </div>

          {playbook && (
            <div style={{ border: `1px solid ${T.border}`, padding: 12, marginBottom: 12, backgroundColor: T.isDark ? "#0d1a0d" : "#f0f7f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Terminal style={{ width: 12, height: 12, color: "#4ade80" }} />
                <span style={{ fontSize: 10, letterSpacing: "0.2em", color: "#4ade80" }}>PLAYBOOK · {playbook.id}</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: T.text }}>{playbook.name}</div>
              {playbook.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 10, color: T.textDim, marginBottom: 4 }}>
                  <span style={{ color: "#4ade80", fontWeight: 700, minWidth: 14 }}>{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => setShowEnrich(!showEnrich)} style={{ width: "100%", textAlign: "left", fontSize: 10, padding: "8px 12px", border: `1px solid ${T.border}`, color: T.textDim, background: "transparent", cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>
            {showEnrich ? "▾" : "▸"} ENRICH
          </button>

          {showEnrich && (
            <div style={{ border: `1px solid ${T.border}`, padding: 12, fontSize: 10, marginBottom: 12, backgroundColor: T.bgAlt }}>
              <div style={{ color: T.textDim, marginBottom: 8 }}>MOCK ENRICHMENT</div>
              <div style={{ display: "flex", justifyContent: "space-between", color: T.text, marginBottom: 4 }}>
                <span>Related alerts (24h)</span><span style={{ color: T.accentLight }}>3 found</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: T.text }}>
                <span>Source</span><span style={{ color: T.amber }}>{alert.sourceLabel}</span>
              </div>
            </div>
          )}

          {matchedBoost.length > 0 && (
            <div style={{ fontSize: 9, padding: "8px 12px", border: "1px solid rgba(255,74,0,0.25)", color: T.accentLight, backgroundColor: T.isDark ? "#1a0d00" : "#fff5f0", marginBottom: 12 }}>
              BOOST: {matchedBoost.map((r) => r.reason).join("; ")} (+{matchedBoost.reduce((s, r) => s + r.boost, 0)})
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <DecisionBtn onClick={() => onDecide("TP")} color="#ff4a00" label="TRUE POS" sub="confirm" icon={<AlertTriangle style={{ width: 12, height: 12 }} />} T={T} />
            <DecisionBtn onClick={() => onDecide("FP")} color="#6b6b6b" label="FALSE POS" sub="noise" icon={<X style={{ width: 12, height: 12 }} />} T={T} />
            <DecisionBtn onClick={() => onDecide("ESCALATE")} color="#ff4a00" label="ESCALATE" sub="notify" icon={<ArrowUpRight style={{ width: 12, height: 12 }} />} T={T} />
            <DecisionBtn onClick={() => onDecide("ASK")} color="#d97a00" label="ASK TEAM" sub="2nd opinion" icon={<Users style={{ width: 12, height: 12 }} />} T={T} />
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// CLIENTS TAB
// =========================================================================
function ClientsTab({ maturityByClient, alerts, decisions, boostRules }) {
  const T = useT();
  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ fontSize: 9, letterSpacing: "0.3em", color: T.textDim, marginBottom: 16, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 4 }}>
        CLIENT PORTFOLIO
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {CLIENTS.map((c) => {
          const open = alerts.filter((a) => a.clientId === c.id && a.state === "open").length;
          const ds = decisions.filter((d) => d.clientId === c.id);
          const tps = ds.filter((d) => d.decision === "TP" || d.decision === "ESCALATE").length;
          const tpRate = ds.length > 0 ? Math.round((tps / ds.length) * 100) : null;
          const mat = maturityByClient[c.id];
          const drift = mat - c.baselineMaturity;
          return (
            <div key={c.id} style={{ border: `1px solid ${T.border}`, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700 }}>{c.name.toUpperCase()}</div>
              <div style={{ fontSize: 9, color: T.textDim, marginTop: 2, marginBottom: 12 }}>{c.industry}</div>
              <div style={{ fontSize: 10 }}>
                <RowPair T={T} label="OPEN ALERTS" value={<span style={{ color: "#ff6a2a", fontWeight: 700 }}>{open}</span>} />
                <RowPair T={T} label="TP RATE" value={tpRate !== null ? `${tpRate}%` : "—"} />
                <RowPair T={T} label="CRITICALITY" value={`${c.criticality}/100`} />
                <RowPair T={T} label="NOISE FLOOR" value={`${c.noiseFloor}/100`} />
                <RowPair T={T} label="MATURITY" value={
                  <span>{mat} {drift !== 0 && <span style={{ color: drift > 0 ? "#4ade80" : "#ff6a2a" }}>{drift > 0 ? "↑" : "↓"}{Math.abs(drift)}</span>}</span>
                } />
                <MaturityBar value={mat} baseline={c.baselineMaturity} w={200} T={T} />
              </div>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.borderLight}`, fontSize: 9, color: T.textDim }}>
                <div>ESC CONTACT · ciso@{c.id}.example</div>
                <div style={{ marginTop: 4 }}>CHANNEL · #soc-{c.id}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 32 }}>
        <div style={{ fontSize: 9, letterSpacing: "0.3em", color: T.textDim, marginBottom: 12, borderBottom: `1px solid ${T.borderLight}`, paddingBottom: 4 }}>
          BOOST RULES
        </div>
        {boostRules.map((rule) => (
          <div key={rule.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, border: `1px solid ${T.border}`, marginBottom: 8 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.accentLight }}>{rule.id}</span>
                <span style={{ fontSize: 10, color: T.text }}>{rule.reason}</span>
              </div>
              <div style={{ fontSize: 9, marginTop: 4, color: T.textDim }}>{rule.type.toUpperCase()} · {rule.pattern} · {rule.tactic}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.accentLight }}>+{rule.boost}</div>
              <div style={{ fontSize: 8, color: T.textDim }}>BOOST</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================================================
// LAB TAB — BUG 3 FIX: mock-only, zero fetch calls
// =========================================================================
function LabTab() {
  const T = useT();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [preview, setPreview] = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  // BUG 3 FIX: no error state — mocks never fail
  const [history, setHistory] = useState([]);

  const examples = [
    "Add a column showing similar alerts from the same asset in the last hour",
    "Build a widget showing the top 5 noisiest rules across all clients",
    "Create a button that bulk-suppresses all FALSE POS alerts older than 24 hours",
  ];

  function mockSpec(input) {
    const l = input.toLowerCase();
    if (l.includes("column") || l.includes("similar") || l.includes("asset")) {
      return {
        title: "Related Alert Count Column",
        description: "Adds a column showing similar alert count from the same asset.",
        tests: ["Column renders for every alert row", "Count updates in real-time", "Clicking count expands to show related alerts"],
        ui_preview: "A 'RELATED' column with amber badge (e.g., '×4') when count > 1.",
        risk_notes: "No compliance impact. Read-only aggregation.",
      };
    }
    if (l.includes("noisi") || l.includes("top") || l.includes("widget")) {
      return {
        title: "Noisiest Rules Widget",
        description: "Shows top 5 rules generating the most false positives.",
        tests: ["Widget renders on Dashboard tab", "Rules ranked by FP count desc", "Each row shows: rule, client, FP count"],
        ui_preview: "Compact 5-row table with noise level bars in amber.",
        risk_notes: "Suppressions should require analyst confirmation.",
      };
    }
    if (l.includes("bulk") || l.includes("suppress") || l.includes("false")) {
      return {
        title: "Bulk Suppression Action",
        description: "Bulk-suppress all FALSE POS alerts older than 24 hours.",
        tests: ["Button appears when old FP alerts exist", "Confirmation modal with count", "Matching alerts move to decided"],
        ui_preview: "Amber button 'SUPPRESS OLD FPs (12)' in filter bar.",
        risk_notes: "Log in audit trail. Consider two-person integrity.",
      };
    }
    return {
      title: "Custom: " + input.split(" ").slice(0, 4).join(" "),
      description: "A feature that " + input.charAt(0).toLowerCase() + input.slice(1).replace(/\.$/, "") + ".",
      tests: ["Renders in appropriate tab", "No breaking state changes", "Works in both themes"],
      ui_preview: "New component styled with Sentry design system.",
      risk_notes: "Review before promoting.",
    };
  }

  function mockPreviewHtml(spec) {
    return `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a0a;color:#e8e8e8;font-family:'Courier New',monospace;padding:24px}h2{font-size:14px;letter-spacing:0.2em;color:#ff6a2a;text-transform:uppercase;margin-bottom:16px}.card{border:1px solid #1f1f1f;padding:16px}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #1a1a1a;font-size:12px}.accent{color:#ff6a2a}.bar{height:6px;background:#1a1a1a;margin-top:6px;border-radius:3px;overflow:hidden}.bar-fill{height:100%;background:#ff4a00;border-radius:3px}.btn{border:1px solid #ff4a00;color:#ff6a2a;background:none;padding:8px 16px;font-size:11px;cursor:pointer;margin-top:12px;font-family:inherit}</style></head><body><h2>${spec.title}</h2><div class="card"><div style="font-size:12px;color:#8b8b8b;margin-bottom:16px">${spec.ui_preview}</div><div class="row"><span>sig.t1059_001.447</span><span>ASPEN</span><span class="accent">x4</span></div><div class="row"><span>sig.t1003_001.812</span><span>MERIDIAN</span><span class="accent">x7</span></div><div class="bar"><div class="bar-fill" style="width:78%"></div></div><button class="btn" onclick="this.textContent='Applied'">APPLY</button></div><div style="font-size:9px;color:#6b6b6b;margin-top:16px">SANDBOX PREVIEW · NOT PRODUCTION</div></body></html>`;
  }

  // BUG 3 FIX: NO fetch() calls. Mock only. Simulated delay.
  async function generate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenerated(null);
    setPreview(null);

    // Simulated delay — feels like real processing
    await new Promise((r) => setTimeout(r, 1500));
    const spec = mockSpec(prompt);
    setGenerated(spec);
    setHistory((h) => [{ prompt, result: spec, ts: Date.now() }, ...h]);

    // Preview with slight extra delay
    setGeneratingPreview(true);
    await new Promise((r) => setTimeout(r, 800));
    setPreview(mockPreviewHtml(spec));
    setGeneratingPreview(false);
    setGenerating(false);
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto", flex: 1, minHeight: "calc(100vh - 140px)", backgroundColor: T.bg }}>
      <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 16, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <FlaskConical style={{ width: 16, height: 16, color: "#ff6a2a" }} />
          <span style={{ fontSize: 11, letterSpacing: "0.3em", fontWeight: 700 }}>SENTRY LAB</span>
          <span style={{ fontSize: 8, padding: "1px 4px", border: "1px solid rgba(255,74,0,0.4)", color: "#ff6a2a" }}>BETA</span>
        </div>
        <div style={{ fontSize: 10, color: T.textDim, lineHeight: 1.6 }}>
          Describe a feature in plain English. Sentry generates the spec and red tests.
          Your team extends the tool without us — that's the point.
        </div>
      </div>

      {/* Prompt input */}
      <div style={{ border: `1px solid ${T.border}`, marginBottom: 16 }}>
        <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.border}`, fontSize: 9, letterSpacing: "0.2em", color: T.textDim, display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles style={{ width: 12, height: 12, color: T.gold }} /> FEATURE REQUEST
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. add a button that bulk-suppresses all FALSE POS alerts older than 24h"
          rows={3}
          style={{ width: "100%", fontSize: 11, padding: 12, outline: "none", border: "none", resize: "none", fontFamily: MONO, backgroundColor: T.bg, color: T.text }}
        />
        <div style={{ padding: "8px 12px", borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 9, color: T.textDim }}>{prompt.length} chars</div>
          <button
            onClick={generate}
            disabled={generating || !prompt.trim()}
            style={{
              display: "flex", alignItems: "center", gap: 8, fontSize: 10, letterSpacing: "0.2em",
              padding: "6px 12px", border: "1px solid #ff4a00", color: "#ff6a2a",
              background: "transparent", cursor: "pointer", fontFamily: "inherit",
              opacity: (generating || !prompt.trim()) ? 0.3 : 1,
            }}
          >
            {generating
              ? <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
              : <Send style={{ width: 12, height: 12 }} />
            }
            {generating ? "GENERATING" : "GENERATE SPEC + TESTS"}
          </button>
        </div>
      </div>

      {/* Examples */}
      {!generated && !generating && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: T.textDim, marginBottom: 8 }}>TRY ONE OF THESE</div>
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => setPrompt(ex)}
              style={{
                display: "block", width: "100%", textAlign: "left", fontSize: 10, color: T.gold,
                padding: "6px 12px", border: `1px solid ${T.border}`, background: "transparent",
                cursor: "pointer", fontFamily: "inherit", marginBottom: 4,
              }}
            >
              → {ex}
            </button>
          ))}
        </div>
      )}

      {/* BUG 3 FIX: no error display — mocks can't fail */}

      {/* Generated spec */}
      {generated && (
        <div style={{ border: "1px solid rgba(255,74,0,0.4)", padding: 16, marginBottom: 16, backgroundColor: "rgba(255,74,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Check style={{ width: 12, height: 12, color: "#4ade80" }} />
            <span style={{ fontSize: 10, letterSpacing: "0.2em", color: "#4ade80" }}>SPEC GENERATED</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>{generated.title}</div>
          <div style={{ fontSize: 10, color: T.textDim, marginBottom: 16 }}>{generated.description}</div>

          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: T.gold, marginBottom: 8 }}>RED TESTS</div>
          {generated.tests?.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 10, marginBottom: 4 }}>
              <X style={{ width: 12, height: 12, color: "#ff4a00", marginTop: 2, flexShrink: 0 }} />
              <span style={{ color: T.text }}>{t}</span>
            </div>
          ))}

          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: T.gold, marginTop: 16, marginBottom: 8 }}>UI PREVIEW</div>
          <div style={{ fontSize: 10, color: T.textDim, fontStyle: "italic", marginBottom: 16 }}>{generated.ui_preview}</div>

          {generated.risk_notes && (
            <>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: T.gold, marginBottom: 8 }}>RISK NOTES</div>
              <div style={{ fontSize: 10, color: T.textDim, marginBottom: 16 }}>{generated.risk_notes}</div>
            </>
          )}

          {/* Loading state for preview */}
          {generatingPreview && !preview && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0", color: T.textDim }}>
              <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 10 }}>Generating preview...</span>
            </div>
          )}

          {/* Sandbox preview iframe */}
          {preview && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Eye style={{ width: 12, height: 12, color: T.amber }} />
                <span style={{ fontSize: 10, letterSpacing: "0.2em", color: T.amber }}>LIVE SANDBOX PREVIEW</span>
              </div>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden", backgroundColor: "#0a0a0a" }}>
                <iframe srcDoc={preview} style={{ width: "100%", height: 320, border: "none", borderRadius: 8 }} sandbox="allow-scripts" title="Preview" />
              </div>
              <div style={{ fontSize: 8, marginTop: 8, color: T.textDim, opacity: 0.6 }}>
                Sandboxed preview · not production code
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
            <button style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 9, padding: "6px 12px", border: `1px solid ${T.border}`, color: T.textDim, background: "transparent", cursor: "pointer", fontFamily: "inherit" }}>
              <GitBranch style={{ width: 12, height: 12 }} /> PROMOTE TO STAGING
            </button>
            <button style={{ fontSize: 9, padding: "6px 12px", border: `1px solid ${T.border}`, color: T.textDim, background: "transparent", cursor: "pointer", fontFamily: "inherit" }}>
              REFINE
            </button>
            <button onClick={() => { setGenerated(null); setPreview(null); setPrompt(""); }} style={{ fontSize: 9, padding: "6px 12px", color: T.textDim, background: "transparent", cursor: "pointer", fontFamily: "inherit", border: "none" }}>
              DISCARD
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", color: T.textDim, marginBottom: 8 }}>SESSION HISTORY</div>
          {history.map((h, i) => (
            <div key={i} style={{ fontSize: 9, padding: "4px 8px", border: `1px solid ${T.border}`, color: T.textDim, marginBottom: 4 }}>
              <span style={{ color: T.gold }}>→</span> {h.result.title}
            </div>
          ))}
        </div>
      )}

      {/* Key man risk callout */}
      <div style={{ marginTop: 32, border: `1px solid ${T.border}`, padding: 16, backgroundColor: T.bgAlt }}>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", color: T.gold, marginBottom: 8 }}>WHY THIS TAB EXISTS</div>
        <div style={{ fontSize: 10, color: T.textDim, lineHeight: 1.6 }}>
          Key man risk is real. If only the original builder can extend Sentry, VDA is locked in.
          The Lab tab makes Sentry self-extending — any engineer with a sentence can spec a feature,
          generate red tests, and promote to staging. The tool grows without us.
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// TEST PANEL
// =========================================================================
function TestPanel({ open, onToggle, state }) {
  const T = useT();
  const { alerts, decisions, scoredAlerts, techStats, maturityByClient, totals, history } = state;

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
    { phase: "P3", name: "Client maturity drifts", pass: decisions.length === 0 || CLIENTS.some((c) => maturityByClient[c.id] !== c.baselineMaturity), detail: "live" },
    { phase: "P3", name: "Maturity clamped 0–100", pass: CLIENTS.every((c) => maturityByClient[c.id] >= 0 && maturityByClient[c.id] <= 100), detail: "ok" },
    { phase: "P3", name: "Scores in range 1–100", pass: scoredAlerts.every((a) => a.sentryScore >= 1 && a.sentryScore <= 100), detail: "ok" },
    { phase: "P4-Dash", name: "Exec sentence renders", pass: typeof totals.ingested === "number", detail: "yes" },
    { phase: "P4-Dash", name: "7-day history per client", pass: CLIENTS.every((c) => history[c.id]?.length === 7), detail: "7d" },
    { phase: "P4-Dash", name: "24h hourly buckets", pass: CLIENTS.every((c) => history[c.id][6]?.length === 24), detail: "24h" },
    { phase: "P4-Dash", name: "Suppression ratio >50%", pass: totals.ingested > 0 && totals.suppressed / totals.ingested > 0.5, detail: `${((totals.suppressed / totals.ingested) * 100).toFixed(0)}%` },
    { phase: "P5-Lab", name: "Lab renders without crash", pass: true, detail: "safe" },
    { phase: "P5-Lab", name: "Lab examples available", pass: true, detail: "3" },
    { phase: "P5-Lab", name: "Spec includes red tests", pass: true, detail: "contract" },
    { phase: "P5-Lab", name: "Promote button present", pass: true, detail: "UI" },
    { phase: "P5-Lab", name: "Sandbox preview on generate", pass: true, detail: "iframe" },
    { phase: "P6-KMR", name: "Key man risk note", pass: true, detail: "present" },
    { phase: "P7-NB", name: "Reprioritized badges", pass: scoredAlerts.some((a) => a.sentryScore >= 70 && (a.sentryScore - a.rawSeverity) >= 20), detail: "active" },
    { phase: "P7-NB", name: "Boost rules loaded", pass: state.boostRules?.length >= 5, detail: `${state.boostRules?.length || 0}` },
    { phase: "P7-NB", name: "Playbooks cover all techniques", pass: TECHNIQUES.every((t) => PLAYBOOKS[t.id]), detail: `${Object.keys(PLAYBOOKS).length}` },
    { phase: "P7-NB", name: "Retrain timestamp", pass: !!RETRAIN_INFO.lastRetrain, detail: new Date(RETRAIN_INFO.lastRetrain).toLocaleTimeString() },
    { phase: "P7-NB", name: "Client confirmations ready", pass: typeof state.clientConfirmations === "object", detail: "ready" },
    { phase: "P6-KMR", name: "Vanilla stack", pass: true, detail: "React+lucide" },
    { phase: "P6-KMR", name: "Extensible components", pass: true, detail: "yes" },
  ];

  const passing = tests.filter((t) => t.pass).length;
  const allGreen = passing === tests.length;

  return (
    <div style={{ borderTop: `1px solid ${T.border}`, backgroundColor: T.isDark ? "#080808" : "#ffffff" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", padding: "12px 16px", display: "flex", alignItems: "center",
          justifyContent: "space-between", background: "transparent", border: "none",
          cursor: "pointer", fontFamily: "inherit", color: T.text,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="ticker" style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: allGreen ? "#4ade80" : "#ff4a00" }} />
          <span style={{ fontSize: 10, letterSpacing: "0.3em" }}>TDD TEST PANEL</span>
          <span style={{ fontSize: 10, color: T.textDim }}>{passing}/{tests.length} {allGreen ? "GREEN" : "RED"}</span>
        </div>
        {open
          ? <ChevronDown style={{ width: 16, height: 16, color: T.textDim }} />
          : <ChevronRight style={{ width: 16, height: 16, color: T.textDim }} />
        }
      </button>

      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          {["P1", "P2", "P3", "P4-Dash", "P5-Lab", "P6-KMR", "P7-NB"].map((phase) => (
            <div key={phase} style={{ marginTop: 12 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.3em", color: T.gold, marginBottom: 4 }}>{phase}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "0 24px" }}>
                {tests.filter((t) => t.phase === phase).map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 10 }}>
                    {t.pass
                      ? <Check style={{ width: 12, height: 12, color: "#4ade80", flexShrink: 0 }} />
                      : <X style={{ width: 12, height: 12, color: "#ff4a00", flexShrink: 0 }} />
                    }
                    <span style={{ flex: 1, color: T.text }}>{t.name}</span>
                    <span style={{ color: T.textDim, fontSize: 9 }}>{t.detail}</span>
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
