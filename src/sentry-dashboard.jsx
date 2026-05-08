/**
 * sentry-dashboard.jsx — Standalone reporting & analytics sandbox
 *
 * Purpose: "Here's what Wave 2 reporting could look like."
 * Two views: Client Executive Report + SOC Ops Engineering Dashboard
 *
 * Brand system: Sentry v3 tokens (navy/burnt orange/steel)
 * Font stack: Georgia display, Calibri body, Consolas mono
 * All data mocked. No backend calls. Single-file JSX.
 */

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Shield, Activity, AlertCircle, BarChart3, Clock, ChevronRight,
  Layers, TrendingUp, TrendingDown, Users, Zap, Eye, FileText,
  ArrowUpRight, ArrowDownRight, Target, Crosshair, Monitor, Server,
  Globe, Lock, Cpu, Mail, CheckCircle2, XCircle,
} from "lucide-react";

/* ============================================================
 * BRAND TOKENS — Sentry v3
 * ============================================================ */
const T = {
  bg: "#0A1628",
  bgCard: "#122238",
  bgCardEdge: "#1A2E47",
  bgElevated: "#172941",
  bgDeep: "#080E1A",
  ink: "#E8EEF4",
  inkDim: "#A8B8C8",
  inkMuted: "#6B7D91",
  divider: "#2A3E57",

  orange: "#D2691E",
  orangeSoft: "#E89968",
  orangeTint: "rgba(210,105,30,0.08)",
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
 * RESPONSIVE HOOK
 * ============================================================ */
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [breakpoint]);
  return isMobile;
};

/* ============================================================
 * MOCK DATA
 * ============================================================ */

// ── MITRE ATT&CK Techniques (real IDs, mock frequency) ──
const MITRE_TECHNIQUES = [
  { id: "T1566", name: "Phishing", tactic: "Initial Access", count: 34, trend: "up" },
  { id: "T1059", name: "Command & Scripting", tactic: "Execution", count: 28, trend: "up" },
  { id: "T1078", name: "Valid Accounts", tactic: "Persistence", count: 22, trend: "flat" },
  { id: "T1021", name: "Remote Services", tactic: "Lateral Movement", count: 19, trend: "down" },
  { id: "T1486", name: "Data Encrypted", tactic: "Impact", count: 7, trend: "up" },
  { id: "T1053", name: "Scheduled Task", tactic: "Execution", count: 15, trend: "flat" },
  { id: "T1071", name: "Application Layer", tactic: "C2", count: 12, trend: "down" },
  { id: "T1110", name: "Brute Force", tactic: "Credential Access", count: 41, trend: "up" },
  { id: "T1027", name: "Obfuscated Files", tactic: "Defense Evasion", count: 9, trend: "flat" },
  { id: "T1190", name: "Exploit Public App", tactic: "Initial Access", count: 16, trend: "up" },
  { id: "T1087", name: "Account Discovery", tactic: "Discovery", count: 11, trend: "flat" },
  { id: "T1048", name: "Exfiltration Over Alt", tactic: "Exfiltration", count: 4, trend: "down" },
];

const TACTICS = [
  "Initial Access", "Execution", "Persistence", "Privilege Escalation",
  "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement",
  "Collection", "C2", "Exfiltration", "Impact",
];

// ── Monthly trend data (12 months) ──
const MONTHLY = [
  { m: "Jun", tickets: 82, mttr: 4.2, sla: 91 },
  { m: "Jul", tickets: 95, mttr: 3.8, sla: 93 },
  { m: "Aug", tickets: 78, mttr: 4.5, sla: 89 },
  { m: "Sep", tickets: 110, mttr: 3.1, sla: 95 },
  { m: "Oct", tickets: 124, mttr: 2.9, sla: 96 },
  { m: "Nov", tickets: 98, mttr: 3.4, sla: 94 },
  { m: "Dec", tickets: 67, mttr: 5.1, sla: 88 },
  { m: "Jan", tickets: 105, mttr: 3.0, sla: 96 },
  { m: "Feb", tickets: 118, mttr: 2.7, sla: 97 },
  { m: "Mar", tickets: 132, mttr: 2.4, sla: 97 },
  { m: "Apr", tickets: 121, mttr: 2.6, sla: 96 },
  { m: "May", tickets: 89, mttr: 2.8, sla: 95 },
];

// ── Severity distribution ──
const SEV_DIST = [
  { level: "CRITICAL", count: 14, color: T.sevCrit },
  { level: "HIGH", count: 38, color: T.sevHigh },
  { level: "MEDIUM", count: 67, color: T.sevMed },
  { level: "LOW", count: 42, color: T.sevLow },
];
const SEV_TOTAL = SEV_DIST.reduce((a, s) => a + s.count, 0);

// ── Recent SNYPR incidents ──
const INCIDENTS = [
  { id: "INC-2026-0847", snyprId: "SNYPR-94812", customer: "Meridian Health", severity: "critical", technique: "T1566", title: "Spear-phishing with macro-enabled attachment", status: "open", mttr: null, analyst: "Sibe K.", created: "2h ago" },
  { id: "INC-2026-0846", snyprId: "SNYPR-94808", customer: "Atlas Manufacturing", severity: "high", technique: "T1110", title: "Brute force against Exchange OWA", status: "in-progress", mttr: null, analyst: "Ryan M.", created: "4h ago" },
  { id: "INC-2026-0845", snyprId: "SNYPR-94801", customer: "Lakeshore Financial", severity: "high", technique: "T1078", title: "Service account login from anomalous geo", status: "in-progress", mttr: null, analyst: "Sibe K.", created: "6h ago" },
  { id: "INC-2026-0844", snyprId: "SNYPR-94795", customer: "Redwood Partners", severity: "medium", technique: "T1059", title: "PowerShell download cradle on endpoint", status: "awaiting-customer", mttr: null, analyst: "Tina L.", created: "8h ago" },
  { id: "INC-2026-0843", snyprId: "SNYPR-94788", customer: "Meridian Health", severity: "critical", technique: "T1486", title: "Ransomware binary staged in temp directory", status: "resolved", mttr: 0.8, analyst: "Sibe K.", created: "12h ago" },
  { id: "INC-2026-0842", snyprId: "SNYPR-94780", customer: "Atlas Manufacturing", severity: "medium", technique: "T1053", title: "Scheduled task persistence via schtasks.exe", status: "resolved", mttr: 3.2, analyst: "Ryan M.", created: "1d ago" },
  { id: "INC-2026-0841", snyprId: "SNYPR-94772", customer: "Lakeshore Financial", severity: "low", technique: "T1087", title: "AD enumeration from standard user context", status: "resolved", mttr: 6.1, analyst: "Tina L.", created: "1d ago" },
  { id: "INC-2026-0840", snyprId: "SNYPR-94765", customer: "Redwood Partners", severity: "high", technique: "T1190", title: "CVE-2026-21894 exploit attempt on web portal", status: "resolved", mttr: 1.4, analyst: "Sibe K.", created: "2d ago" },
];

// ── Analysts ──
const ANALYSTS = [
  { name: "Sibe K.", open: 8, resolved: 42, slaHit: 96 },
  { name: "Ryan M.", open: 5, resolved: 31, slaHit: 94 },
  { name: "Tina L.", open: 3, resolved: 28, slaHit: 98 },
  { name: "Marcus D.", open: 6, resolved: 35, slaHit: 91 },
  { name: "Alicia R.", open: 2, resolved: 22, slaHit: 97 },
  { name: "Jordan W.", open: 4, resolved: 18, slaHit: 93 },
];

// ── Customers (for client view selector) ──
const CUSTOMERS = [
  { name: "Meridian Health", env: "Hybrid", endpoints: 2400, sla: "1h/4h/8h/24h" },
  { name: "Atlas Manufacturing", env: "On-prem", endpoints: 890, sla: "2h/4h/12h/24h" },
  { name: "Lakeshore Financial", env: "Cloud", endpoints: 1650, sla: "1h/4h/8h/24h" },
  { name: "Redwood Partners", env: "Hybrid", endpoints: 340, sla: "4h/8h/24h/48h" },
];

/* ============================================================
 * SVG MICRO-CHARTS
 * ============================================================ */

const Sparkline = ({ data, width = 120, height = 32, color = T.orange, showArea = false }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const line = pts.join(" ");
  const area = `0,${height} ${line} ${width},${height}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      {showArea && <polygon points={area} fill={`${color}15`} />}
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(",")[0]} cy={pts[pts.length - 1].split(",")[1]} r={2.5} fill={color} />
    </svg>
  );
};

const HorizBar = ({ value, max, color, width = "100%", height = 6 }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ width, height, background: `${color}18`, borderRadius: height / 2 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: height / 2, transition: "width 0.6s ease" }} />
    </div>
  );
};

const MiniDonut = ({ segments, size = 80, thickness = 10 }) => {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.bgCardEdge} strokeWidth={thickness} />
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circ;
        const gap = circ - dash;
        const thisOffset = offset;
        offset += pct * circ;
        return (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-thisOffset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 0.6s ease" }} />
        );
      })}
    </svg>
  );
};

const TacticHeatmap = ({ techniques, isMobile }) => {
  const byTactic = {};
  TACTICS.forEach((t) => (byTactic[t] = []));
  techniques.forEach((tech) => {
    if (byTactic[tech.tactic]) byTactic[tech.tactic].push(tech);
  });
  const maxCount = Math.max(...techniques.map((t) => t.count));

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: 2 }}>
      {TACTICS.map((tactic) => {
        const techs = byTactic[tactic];
        const sum = techs.reduce((a, t) => a + t.count, 0);
        const intensity = sum / maxCount;
        const bg = `rgba(210,105,30,${0.04 + intensity * 0.25})`;
        return (
          <div key={tactic} style={{
            background: bg, border: `1px solid ${T.bgCardEdge}`, borderRadius: 4, padding: "8px 10px",
            minHeight: 56,
          }}>
            <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
              {tactic}
            </div>
            {techs.map((tech) => (
              <div key={tech.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.orangeSoft }}>{tech.id}</span>
                <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkDim }}>{tech.count}</span>
              </div>
            ))}
            {techs.length === 0 && (
              <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, fontStyle: "italic" }}>—</div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ============================================================
 * SHARED COMPONENTS
 * ============================================================ */

const KPICard = ({ label, value, sub, icon: Icon, trend, trendDir, color = T.orange }) => (
  <div style={{
    background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 8,
    padding: "20px 18px", position: "relative", overflow: "hidden",
  }}>
    <div style={{ position: "absolute", top: 14, right: 14, opacity: 0.12 }}>
      <Icon size={40} color={color} />
    </div>
    <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 10 }}>
      {label}
    </div>
    <div style={{ fontFamily: T.fontDisplay, fontSize: 34, fontWeight: 700, color: T.ink, lineHeight: 1 }}>
      {value}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
      {trend && (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
          color: trendDir === "up" ? T.slaOk : trendDir === "down" ? T.slaBreach : T.inkMuted,
        }}>
          {trendDir === "up" ? <ArrowUpRight size={11} /> : trendDir === "down" ? <ArrowDownRight size={11} /> : null}
          {trend}
        </span>
      )}
      {sub && <span style={{ fontFamily: T.fontBody, fontSize: 12, color: T.inkMuted }}>{sub}</span>}
    </div>
  </div>
);

const SectionHeader = ({ label, number }) => (
  <div style={{ marginBottom: 16, marginTop: 32 }}>
    <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.orange, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>
      {number}
    </div>
    <div style={{ fontFamily: T.fontDisplay, fontSize: 22, color: T.ink, fontWeight: 700 }}>
      {label}
    </div>
  </div>
);

const SevBadge = ({ sev }) => {
  const c = { critical: T.sevCrit, high: T.sevHigh, medium: T.sevMed, low: T.sevLow }[sev];
  return (
    <span style={{
      display: "inline-block", padding: "2px 7px", borderRadius: 3,
      fontFamily: T.fontMono, fontSize: 9, fontWeight: 700,
      letterSpacing: "0.12em", textTransform: "uppercase",
      background: `${c}20`, color: c, border: `1px solid ${c}40`,
    }}>{sev}</span>
  );
};

const StatusDot = ({ status }) => {
  const map = {
    open: T.steel, "in-progress": T.orange,
    "awaiting-customer": T.sevHigh, resolved: T.slaOk,
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: T.fontMono, fontSize: 9, color: map[status], letterSpacing: "0.08em", textTransform: "uppercase" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: map[status], boxShadow: status === "open" ? `0 0 6px ${map[status]}60` : "none" }} />
      {status.replace("-", " ")}
    </span>
  );
};

/* ============================================================
 * CLIENT VIEW — Executive report for a customer
 * ============================================================ */
const ClientView = ({ customer, isMobile }) => {
  const custIncidents = INCIDENTS.filter((i) => i.customer === customer.name);
  const resolved = custIncidents.filter((i) => i.status === "resolved");
  const avgMttr = resolved.length > 0 ? (resolved.reduce((a, i) => a + i.mttr, 0) / resolved.length).toFixed(1) : "—";

  return (
    <div>
      {/* Customer header */}
      <div style={{
        background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 10,
        padding: isMobile ? "20px 16px" : "28px 32px", marginBottom: 24,
        borderLeft: `4px solid ${T.orange}`,
      }}>
        <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
          MONTHLY SECURITY REPORT
        </div>
        <div style={{ fontFamily: T.fontDisplay, fontSize: isMobile ? 24 : 30, color: T.ink, fontWeight: 700, marginBottom: 6 }}>
          {customer.name}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 12 : 24, marginTop: 12 }}>
          <span style={{ fontFamily: T.fontBody, fontSize: 13, color: T.inkDim }}>
            <span style={{ color: T.inkMuted }}>Environment:</span> {customer.env}
          </span>
          <span style={{ fontFamily: T.fontBody, fontSize: 13, color: T.inkDim }}>
            <span style={{ color: T.inkMuted }}>Endpoints:</span> {customer.endpoints.toLocaleString()}
          </span>
          <span style={{ fontFamily: T.fontBody, fontSize: 13, color: T.inkDim }}>
            <span style={{ color: T.inkMuted }}>SLA Tiers:</span> {customer.sla}
          </span>
          <span style={{ fontFamily: T.fontBody, fontSize: 13, color: T.inkDim }}>
            <span style={{ color: T.inkMuted }}>Period:</span> May 2026
          </span>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <KPICard label="Incidents" value={custIncidents.length} icon={AlertCircle} trend="+12%" trendDir="down" sub="vs prior month" />
        <KPICard label="MTTR" value={`${avgMttr}h`} icon={Clock} trend="-18%" trendDir="up" sub="avg hours" color={T.steel} />
        <KPICard label="SLA Hit" value="96%" icon={Shield} trend="+2pt" trendDir="up" sub="on-time" color={T.slaOk} />
        <KPICard label="Resolved" value={resolved.length} icon={CheckCircle2} sub={`of ${custIncidents.length} total`} color={T.slaOk} />
      </div>

      {/* Trends + Severity side by side */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Ticket trend */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 8, padding: "18px 20px" }}>
          <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>
            12-MONTH TICKET TREND
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 100 }}>
            {MONTHLY.map((m, i) => {
              const maxT = Math.max(...MONTHLY.map((d) => d.tickets));
              const h = (m.tickets / maxT) * 90;
              const isLast = i === MONTHLY.length - 1;
              return (
                <div key={m.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: "100%", height: h, borderRadius: "3px 3px 0 0",
                    background: isLast ? T.orange : `${T.steel}60`,
                    transition: "height 0.4s ease",
                  }} />
                  <span style={{ fontFamily: T.fontMono, fontSize: 8, color: T.inkMuted }}>{m.m}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity donut */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 8, padding: "18px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12, alignSelf: "flex-start" }}>
            SEVERITY BREAKDOWN
          </div>
          <MiniDonut segments={SEV_DIST.map((s) => ({ value: s.count, color: s.color }))} size={90} thickness={12} />
          <div style={{ marginTop: 14, width: "100%" }}>
            {SEV_DIST.map((s) => (
              <div key={s.level} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                  <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkDim }}>{s.level}</span>
                </div>
                <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.ink, fontWeight: 700 }}>
                  {s.count} <span style={{ color: T.inkMuted, fontWeight: 400 }}>({Math.round((s.count / SEV_TOTAL) * 100)}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MTTR + SLA sparklines */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 8, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>MTTR TREND</div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 26, color: T.ink, fontWeight: 700 }}>2.8h</div>
              <div style={{ fontFamily: T.fontBody, fontSize: 11, color: T.slaOk, marginTop: 2 }}>Down from 4.2h (Jun)</div>
            </div>
            <Sparkline data={MONTHLY.map((m) => m.mttr)} color={T.steel} width={100} height={40} showArea />
          </div>
        </div>
        <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 8, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>SLA ADHERENCE</div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 26, color: T.ink, fontWeight: 700 }}>95%</div>
              <div style={{ fontFamily: T.fontBody, fontSize: 11, color: T.slaOk, marginTop: 2 }}>Up from 91% (Jun)</div>
            </div>
            <Sparkline data={MONTHLY.map((m) => m.sla)} color={T.slaOk} width={100} height={40} showArea />
          </div>
        </div>
      </div>

      {/* Recent incidents table */}
      <SectionHeader number="02" label="Recent Incidents" />
      <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "100px 80px 1fr 100px 80px",
          padding: "10px 16px", borderBottom: `1px solid ${T.divider}`,
          fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, letterSpacing: "0.12em", textTransform: "uppercase",
        }}>
          <span>ID</span>
          {!isMobile && <span>SEV</span>}
          <span>TITLE</span>
          {!isMobile && <span>STATUS</span>}
          {!isMobile && <span>MTTR</span>}
        </div>
        {custIncidents.map((inc) => (
          <div key={inc.id} style={{
            display: "grid", gridTemplateColumns: isMobile ? "1fr" : "100px 80px 1fr 100px 80px",
            padding: "12px 16px", borderBottom: `1px solid ${T.bgCardEdge}`,
            alignItems: "center",
          }}>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.orangeSoft }}>{inc.id}</span>
            {!isMobile && <SevBadge sev={inc.severity} />}
            <div>
              <div style={{ fontFamily: T.fontBody, fontSize: 13, color: T.ink }}>{inc.title}</div>
              <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, marginTop: 2 }}>
                {inc.snyprId} · {inc.technique} · {inc.created}
              </div>
              {isMobile && (
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <SevBadge sev={inc.severity} />
                  <StatusDot status={inc.status} />
                </div>
              )}
            </div>
            {!isMobile && <StatusDot status={inc.status} />}
            {!isMobile && (
              <span style={{ fontFamily: T.fontMono, fontSize: 12, color: inc.mttr ? T.ink : T.inkMuted }}>
                {inc.mttr ? `${inc.mttr}h` : "—"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================
 * SOC OPS VIEW — Engineering / internal dashboard
 * ============================================================ */
const SOCView = ({ isMobile }) => {
  const openTickets = INCIDENTS.filter((i) => i.status !== "resolved");
  const unassigned = 3;
  const slaBreach = 2;
  const totalAnalysts = ANALYSTS.length;
  const avgLoad = Math.round(ANALYSTS.reduce((a, an) => a + an.open, 0) / totalAnalysts);

  return (
    <div>
      {/* Queue health banner */}
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", gap: 12, marginBottom: 24,
      }}>
        <KPICard label="Open Queue" value={openTickets.length} icon={Layers} color={T.steel} />
        <KPICard label="Unassigned" value={unassigned} icon={Users} trend={unassigned > 2 ? "Action needed" : "OK"} trendDir={unassigned > 2 ? "down" : "up"} color={unassigned > 2 ? T.slaBreach : T.slaOk} />
        <KPICard label="SLA Breaches" value={slaBreach} icon={AlertCircle} trend="today" color={T.slaBreach} />
        <KPICard label="Avg Load" value={`${avgLoad}/analyst`} icon={Activity} sub={`${totalAnalysts} active`} color={T.steel} />
        <KPICard label="SNYPR Bridge" value="Active" icon={Zap} sub="Last event 4m ago" color={T.slaOk} />
      </div>

      {/* Analyst workload + Throughput */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Analyst table */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 8, padding: "18px 20px" }}>
          <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>
            ANALYST WORKLOAD
          </div>
          {ANALYSTS.map((a) => (
            <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.bgCardEdge, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.orangeSoft }}>{a.name.split(" ")[0][0]}{a.name.split(" ")[1]?.[0] || ""}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontFamily: T.fontBody, fontSize: 12, color: T.ink }}>{a.name}</span>
                  <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkDim }}>{a.open} open · {a.resolved} closed</span>
                </div>
                <HorizBar value={a.open} max={12} color={a.open > 6 ? T.slaWarn : T.steel} />
              </div>
              <span style={{ fontFamily: T.fontMono, fontSize: 10, color: a.slaHit >= 95 ? T.slaOk : T.slaWarn, minWidth: 32, textAlign: "right" }}>
                {a.slaHit}%
              </span>
            </div>
          ))}
        </div>

        {/* Ticket throughput */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 8, padding: "18px 20px" }}>
          <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>
            MONTHLY THROUGHPUT
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120, marginBottom: 12 }}>
            {MONTHLY.map((m, i) => {
              const maxT = Math.max(...MONTHLY.map((d) => d.tickets));
              const h = (m.tickets / maxT) * 110;
              return (
                <div key={m.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <span style={{ fontFamily: T.fontMono, fontSize: 8, color: T.inkMuted }}>{m.tickets}</span>
                  <div style={{
                    width: "100%", height: h, borderRadius: "3px 3px 0 0",
                    background: `linear-gradient(180deg, ${T.orange}${i === MONTHLY.length - 1 ? "CC" : "44"}, ${T.orange}${i === MONTHLY.length - 1 ? "88" : "18"})`,
                  }} />
                  <span style={{ fontFamily: T.fontMono, fontSize: 8, color: T.inkMuted }}>{m.m}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${T.divider}`, paddingTop: 10 }}>
            <span style={{ fontFamily: T.fontBody, fontSize: 11, color: T.inkMuted }}>12-month total</span>
            <span style={{ fontFamily: T.fontMono, fontSize: 13, color: T.ink, fontWeight: 700 }}>{MONTHLY.reduce((a, m) => a + m.tickets, 0)}</span>
          </div>
        </div>
      </div>

      {/* MITRE ATT&CK Heatmap */}
      <SectionHeader number="02" label="Technique Distribution" />
      <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 8, padding: "18px 20px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.14em", textTransform: "uppercase" }}>
            MITRE ATT&CK TECHNIQUE HEATMAP
          </div>
          <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted }}>
            {MITRE_TECHNIQUES.length} techniques · {MITRE_TECHNIQUES.reduce((a, t) => a + t.count, 0)} observations
          </div>
        </div>
        <TacticHeatmap techniques={MITRE_TECHNIQUES} isMobile={isMobile} />
      </div>

      {/* Top techniques table */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 8, padding: "18px 20px" }}>
          <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>
            TOP TECHNIQUES BY FREQUENCY
          </div>
          {[...MITRE_TECHNIQUES].sort((a, b) => b.count - a.count).slice(0, 6).map((tech) => (
            <div key={tech.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.orangeSoft, width: 50 }}>{tech.id}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.fontBody, fontSize: 12, color: T.ink, marginBottom: 3 }}>{tech.name}</div>
                <HorizBar value={tech.count} max={45} color={tech.count > 30 ? T.orange : T.steel} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 45, justifyContent: "flex-end" }}>
                <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.ink, fontWeight: 700 }}>{tech.count}</span>
                {tech.trend === "up" && <ArrowUpRight size={10} color={T.slaBreach} />}
                {tech.trend === "down" && <ArrowDownRight size={10} color={T.slaOk} />}
              </div>
            </div>
          ))}
        </div>

        {/* SLA breach trajectory */}
        <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 8, padding: "18px 20px" }}>
          <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.orange, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>
            SLA BREACH TRAJECTORY
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 28, color: T.ink, fontWeight: 700 }}>2</div>
              <div style={{ fontFamily: T.fontBody, fontSize: 11, color: T.slaBreach }}>active breaches today</div>
            </div>
            <Sparkline data={[5, 3, 4, 2, 6, 3, 1, 4, 2, 3, 2, 2]} color={T.slaBreach} width={100} height={40} showArea />
          </div>
          <div style={{ borderTop: `1px solid ${T.divider}`, paddingTop: 12 }}>
            {[
              { sev: "CRITICAL", sla: "1 hour", breaches: 1, color: T.sevCrit },
              { sev: "HIGH", sla: "4 hours", breaches: 1, color: T.sevHigh },
              { sev: "MEDIUM", sla: "8 hours", breaches: 0, color: T.sevMed },
              { sev: "LOW", sla: "24 hours", breaches: 0, color: T.sevLow },
            ].map((tier) => (
              <div key={tier.sev} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: tier.color }} />
                  <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkDim }}>{tier.sev}</span>
                  <span style={{ fontFamily: T.fontBody, fontSize: 10, color: T.inkMuted }}>({tier.sla})</span>
                </div>
                <span style={{
                  fontFamily: T.fontMono, fontSize: 11, fontWeight: 700,
                  color: tier.breaches > 0 ? T.slaBreach : T.slaOk,
                }}>
                  {tier.breaches > 0 ? `${tier.breaches} breach` : "on track"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full incident feed */}
      <SectionHeader number="03" label="Live Incident Feed" />
      <div style={{ background: T.bgCard, border: `1px solid ${T.bgCardEdge}`, borderRadius: 8, overflow: "hidden" }}>
        {INCIDENTS.map((inc, i) => (
          <div key={inc.id} style={{
            display: "grid", gridTemplateColumns: isMobile ? "1fr" : "90px 60px 100px 1fr 90px 70px 80px",
            padding: "10px 16px", borderBottom: i < INCIDENTS.length - 1 ? `1px solid ${T.bgCardEdge}` : "none",
            alignItems: "center", gap: 6,
            background: inc.status === "open" ? `${T.orange}06` : "transparent",
          }}>
            <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.orangeSoft }}>{inc.id.replace("INC-2026-", "")}</span>
            {!isMobile && <SevBadge sev={inc.severity} />}
            {!isMobile && <span style={{ fontFamily: T.fontMono, fontSize: 9, color: T.steelDim }}>{inc.snyprId}</span>}
            <div>
              <div style={{ fontFamily: T.fontBody, fontSize: 12, color: T.ink }}>{inc.title}</div>
              {isMobile && (
                <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                  <SevBadge sev={inc.severity} />
                  <StatusDot status={inc.status} />
                  <span style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted }}>{inc.created}</span>
                </div>
              )}
            </div>
            {!isMobile && <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkDim }}>{inc.analyst}</span>}
            {!isMobile && <StatusDot status={inc.status} />}
            {!isMobile && <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted }}>{inc.created}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================
 * MAIN APP — View toggle + routing
 * ============================================================ */
export default function SentryDashboard() {
  const isMobile = useIsMobile();
  const [view, setView] = useState("soc"); // "client" | "soc"
  const [selectedCustomer, setSelectedCustomer] = useState(0);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      {/* Top chrome */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100, background: T.bgDeep,
        borderBottom: `1px solid ${T.bgCardEdge}`,
        padding: isMobile ? "10px 12px" : "10px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Shield size={20} color={T.orange} />
          <span style={{ fontFamily: T.fontDisplay, fontSize: 17, color: T.ink, fontWeight: 700 }}>
            Sentry
          </span>
          <span style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, letterSpacing: "0.1em", background: T.bgCardEdge, padding: "2px 8px", borderRadius: 3 }}>
            DASHBOARD
          </span>
        </div>

        <div style={{ display: "flex", gap: 2, background: T.bgCard, borderRadius: 6, padding: 2, border: `1px solid ${T.bgCardEdge}` }}>
          {[
            { key: "soc", label: "SOC Ops" },
            { key: "client", label: "Client Report" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              style={{
                fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.08em",
                padding: "6px 14px", borderRadius: 4, border: "none", cursor: "pointer",
                background: view === tab.key ? T.orange : "transparent",
                color: view === tab.key ? "#fff" : T.inkMuted,
                fontWeight: view === tab.key ? 700 : 400,
                transition: "all 0.2s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer selector (client view only) */}
      {view === "client" && (
        <div style={{
          padding: isMobile ? "10px 12px" : "10px 24px",
          background: T.bgCard, borderBottom: `1px solid ${T.bgCardEdge}`,
          display: "flex", gap: 6, overflowX: "auto",
        }}>
          {CUSTOMERS.map((c, i) => (
            <button
              key={c.name}
              onClick={() => setSelectedCustomer(i)}
              style={{
                fontFamily: T.fontBody, fontSize: 12, padding: "5px 14px",
                borderRadius: 999, border: `1px solid ${selectedCustomer === i ? T.orange : T.bgCardEdge}`,
                background: selectedCustomer === i ? T.orangeTint : "transparent",
                color: selectedCustomer === i ? T.orange : T.inkDim,
                cursor: "pointer", whiteSpace: "nowrap",
                fontWeight: selectedCustomer === i ? 700 : 400,
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: isMobile ? "16px 12px" : "24px 24px", maxWidth: 1200, margin: "0 auto" }}>
        {view === "client" ? (
          <ClientView customer={CUSTOMERS[selectedCustomer]} isMobile={isMobile} />
        ) : (
          <SOCView isMobile={isMobile} />
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "16px 24px", borderTop: `1px solid ${T.bgCardEdge}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, letterSpacing: "0.1em" }}>
          VDA LABS × 3NAILS INFOSEC
        </span>
        <span style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, letterSpacing: "0.1em" }}>
          SANDBOX · WAVE 2 PREVIEW
        </span>
      </div>
    </div>
  );
}
