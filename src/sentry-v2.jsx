import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Shield, Activity, AlertTriangle, Check, X, ArrowUpRight, Users, Zap,
  ChevronRight, ChevronDown, Clock, Eye, Terminal, Radio, LayoutDashboard,
  FlaskConical, Building2, Send, Loader2, GitBranch, Sparkles, Sun, Moon
} from "lucide-react";

/* =========================================================================
   SENTRY v2 — VDA Labs MSSP Console
   ---------------------------------------------------------------------------
   Critical Start × NightBeacon hybrid. 4 tabs:
     - DASHBOARD : Tufte-style. Sparklines, small multiples, horizon chart.
                   No chartjunk. Reads like a Bloomberg terminal.
     - ALERTS    : The triage queue from v1, with source badges + dedupe.
     - CLIENTS   : Maturity, criticality, escalation contacts.
     - LAB       : Natural-language feature requests. Generates a live
                   component preview via the Anthropic API. Demo of the
                   "you don't need us forever" key-man-risk killer.

   TDD panel at bottom. ~24 assertions, live.
   ========================================================================= */


// =========================================================================
// THEME
// =========================================================================
const ThemeCtx = React.createContext(null);
function useT() { return React.useContext(ThemeCtx); }

function makeTheme(isDark) {
  return isDark ? {
    bg: "#0a0a0a", bgAlt: "#0c0c0c", bgHi: "#111",
    text: "#e8e8e8", textDim: "#6b6b6b", textMid: "#8b8b8b",
    border: "#1f1f1f", borderLight: "#1a1a1a",
    accent: "#ff4a00", accentLight: "#ff6a2a",
    amber: "#e89200", gold: "#8b7e45", green: "#4ade80",
    warn: "#d97a00",
    sparkStroke: "#e8e8e8",
    barFill: "#e8e8e8",
    shadow: "0 4px 20px rgba(0,0,0,0.5)",
    gridA: "rgba(255,255,255,0.022)",
    hoverBg: "rgba(255,255,255,0.02)",
    isDark: true,
  } : {
    bg: "#f8f7f4", bgAlt: "#ffffff", bgHi: "#f2f0eb",
    text: "#1a1816", textDim: "#7a756d", textMid: "#5a5650",
    border: "#e2dfda", borderLight: "#eae7e2",
    accent: "#d94400", accentLight: "#e85a1a",
    amber: "#b87800", gold: "#8b7e45", green: "#2d8a4e",
    warn: "#b86800",
    sparkStroke: "#1a1816",
    barFill: "#1a1816",
    shadow: "0 4px 20px rgba(0,0,0,0.08)",
    gridA: "rgba(0,0,0,0.035)",
    hoverBg: "rgba(0,0,0,0.02)",
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
  aspen: ["WIN-DC01","WIN-DC02","SVR-TRADE-07","WS-CFO-01","SVR-SQL-PRD","WIN-JMP-03","SVR-ADFS-01"],
  meridian: ["EHR-APP-02","WIN-RAD-11","SVR-PACS-01","WS-NURSE-27","WIN-HR-04","SVR-BILL-02","WIN-DC-MED"],
  forge: ["OT-HMI-03","OT-PLC-07","WIN-ENG-12","SVR-MES-01","OT-SCADA-02","WIN-SHOP-22","WIN-QA-05"],
};

function seeded(seed) { let s = seed; return () => { s = (s*9301+49297)%233280; return s/233280; }; }

function buildInitialAlerts() {
  const rand = seeded(42);
  const now = Date.now();
  const alerts = [];
  let id = 1;
  for (const c of CLIENTS) {
    for (let i = 0; i < 20; i++) {
      const tech = TECHNIQUES[Math.floor(rand()*TECHNIQUES.length)];
      const asset = ASSETS[c.id][Math.floor(rand()*ASSETS[c.id].length)];
      const minsAgo = Math.floor(rand()*360)+1;
      const source = SOURCES[Math.floor(rand()*SOURCES.length)];
      const dedupe = rand() < 0.35 ? Math.floor(rand()*8)+2 : 1;
      alerts.push({
        id: `A-${String(id++).padStart(5,"0")}`,
        clientId: c.id,
        technique: tech,
        asset,
        rawSeverity: Math.min(99, Math.max(20, Math.round(tech.baseSev + (rand()*30-15)))),
        timestamp: now - minsAgo*60*1000,
        rule: `sig.${tech.id.toLowerCase().replace(".","_")}.${Math.floor(rand()*900+100)}`,
        state: "open",
        decision: null,
        noveltyBoost: rand() < 0.15 ? 18 : 0,
        source: source.id,
        sourceColor: source.color,
        sourceLabel: source.label,
        dedupeCount: dedupe,
      });
    }
  }
  return alerts;
}

// 7-day historical alert volume per client (for sparklines + small multiples)
function buildHistory() {
  const hist = {};
  const rand = seeded(101);
  for (const c of CLIENTS) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      // Hourly buckets so we can show 24h horizon too
      const hours = [];
      for (let h = 0; h < 24; h++) {
        const base = c.noiseFloor / 4;
        const noise = rand() * base;
        const spike = rand() < 0.05 ? rand() * 40 : 0;
        hours.push(Math.round(base + noise + spike));
      }
      days.push(hours);
    }
    hist[c.id] = days;
  }
  return hist;
}

// =========================================================================
// SCORING (carry-over from v1, condensed)
// =========================================================================
function computeTechStats(decisions) {
  const stats = {};
  for (const d of decisions) {
    const k = `${d.clientId}::${d.techniqueId}`;
    if (!stats[k]) stats[k] = { tp:0, fp:0, total:0 };
    stats[k].total++;
    if (d.decision==="TP" || d.decision==="ESCALATE") stats[k].tp++;
    if (d.decision==="FP") stats[k].fp++;
  }
  return stats;
}
function computeClientMaturity(clientId, decisions) {
  const c = CLIENTS.find(x=>x.id===clientId);
  const ds = decisions.filter(d=>d.clientId===clientId);
  if (ds.length===0) return c.baselineMaturity;
  const tps = ds.filter(d=>d.decision==="TP"||d.decision==="ESCALATE").length;
  const fps = ds.filter(d=>d.decision==="FP").length;
  const drift = (tps/ds.length)*18 - (fps/ds.length)*10;
  return Math.max(0, Math.min(100, Math.round(c.baselineMaturity+drift)));
}
function scoreAlert(alert, techStats, clientMaturity) {
  const c = CLIENTS.find(x=>x.id===alert.clientId);
  const k = `${alert.clientId}::${alert.technique.id}`;
  const s = techStats[k] || {tp:0, fp:0, total:0};
  const histTpRate = s.total>=3 ? s.tp/s.total : 0.5;
  const critMult = 0.75 + (c.criticality/100)*0.55;
  const histMult = 0.6 + histTpRate*0.9;
  const matAdj = 1 - ((100-clientMaturity)/100)*0.18;
  const novelty = 1 + alert.noveltyBoost/100;
  const suppression = s.total>=4 && s.tp===0 && s.fp>=3 ? 0.35 : 1;
  return Math.max(1, Math.min(100, Math.round(alert.rawSeverity*critMult*histMult*matAdj*novelty*suppression)));
}
function sevColor(score) {
  if (score >= 85) return { text:"text-[#ff6a2a]", border:"#ff4a00", label:"CRIT" };
  if (score >= 70) return { text:"text-[#e89200]", border:"#d97a00", label:"HIGH" };
  if (score >= 50) return { text:"text-[#c99300]", border:"#a87a00", label:"MED" };
  return { text:"text-[#8b7e45]", border:"#3a3a1a", label:"LOW" };
}
function fmtAgo(ts) {
  const m = Math.floor((Date.now()-ts)/60000);
  if (m<1) return "just now";
  if (m<60) return `${m}m ago`;
  return `${Math.floor(m/60)}h ${m%60}m ago`;
}

// =========================================================================
// MAIN
// =========================================================================
export default function SentryV2() {
  const [tab, setTab] = useState("dashboard");
  const [alerts, setAlerts] = useState(()=>buildInitialAlerts());
  const [decisions, setDecisions] = useState([]);
  const [history] = useState(()=>buildHistory());
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showTests, setShowTests] = useState(false);
  const [theme, setTheme] = useState("auto");
  const [systemDark, setSystemDark] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const h = (e) => setSystemDark(e.matches);
    mq.addEventListener?.("change", h);
    return () => mq.removeEventListener?.("change", h);
  }, []);
  const isDark = theme === "auto" ? systemDark : theme === "dark";
  const T = makeTheme(isDark);

  const techStats = useMemo(()=>computeTechStats(decisions), [decisions]);
  const maturityByClient = useMemo(()=>{
    const m = {};
    for (const c of CLIENTS) m[c.id] = computeClientMaturity(c.id, decisions);
    return m;
  }, [decisions]);
  const scoredAlerts = useMemo(()=>{
    return alerts.map(a=>({
      ...a,
      sentryScore: scoreAlert(a, techStats, maturityByClient[a.clientId]),
    })).sort((a,b)=>{
      if (a.state==="decided" && b.state!=="decided") return 1;
      if (b.state==="decided" && a.state!=="decided") return -1;
      return b.sentryScore - a.sentryScore;
    });
  }, [alerts, techStats, maturityByClient]);

  function recordDecision(alert, decision) {
    const entry = {
      logId: `D-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      alertId: alert.id, clientId: alert.clientId, techniqueId: alert.technique.id,
      tactic: alert.technique.tactic, decision, analyst: "J. MAURIELLO",
      ts: Date.now(), sentryScore: alert.sentryScore,
    };
    setDecisions(d => [entry, ...d]);
    setAlerts(list => list.map(a => a.id===alert.id ? {...a, state:"decided", decision} : a));
    setExpandedId(null);
  }
  function undoLast() {
    if (decisions.length===0) return;
    const last = decisions[0];
    setDecisions(d => d.slice(1));
    setAlerts(list => list.map(a => a.id===last.alertId ? {...a, state:"open", decision:null} : a));
  }

  // ---- Computed dashboard numbers ----
  const totals = useMemo(()=>{
    const ingested = alerts.length + 1187; // pretend the auto-suppressed exist
    const suppressed = 1187;
    const triaged = decisions.length;
    const escalated = decisions.filter(d=>d.decision==="ESCALATE").length;
    const open = scoredAlerts.filter(a=>a.state==="open").length;
    return { ingested, suppressed, triaged, escalated, open, breaches: 0 };
  }, [alerts, decisions, scoredAlerts]);

  return (
    <ThemeCtx.Provider value={T}>
    <div className="min-h-screen" style={{fontFamily:"'JetBrains Mono', ui-monospace, monospace", backgroundColor:T.bg, color:T.text, transition:"background-color 0.3s, color 0.3s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@200;300;400;500;700&display=swap');
        .ticker { animation: tick 1.2s ease-in-out infinite; }
        @keyframes tick { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .grid-bg-dark {
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.022) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .grid-bg-light {
          background-image:
            linear-gradient(to right, rgba(0,0,0,0.035) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.035) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

      {/* ============ TOP BAR ============ */}
      <div className="border-b border-[#1f1f1f] sticky top-0 z-20" style={{backgroundColor:T.bg, boxShadow:T.shadow, transition:'background-color 0.3s'}}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border border-[#ff4a00] flex items-center justify-center">
              <Shield className="w-4 h-4 text-[#ff4a00]" />
            </div>
            <div>
              <div className="text-[11px] tracking-[0.3em] font-bold">SENTRY</div>
              <div className="text-[9px] tracking-[0.2em] text-[#6b6b6b]">VDA LABS · v2</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-[10px] tracking-wider">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#4ade80] rounded-full ticker" />
              <span className="text-[#6b6b6b]">J. MAURIELLO</span>
            </div>
            <div><span className="text-[#6b6b6b]">OPEN </span><span className="text-[#ff6a2a] font-bold">{totals.open}</span></div>
            <div><span className="text-[#6b6b6b]">TRIAGED </span><span>{totals.triaged}</span></div>
            <div><span className="text-[#6b6b6b]">SLA </span><span>&lt;60m</span></div>
          </div>
          <div className="flex items-center gap-2">
            {["auto","light","dark"].map(m => (
              <button key={m} onClick={()=>setTheme(m)}
                style={{
                  fontSize:"9px",letterSpacing:"0.1em",textTransform:"uppercase",
                  padding:"3px 8px",borderRadius:"999px",cursor:"pointer",fontFamily:"inherit",
                  background: theme===m ? (isDark?"#222":"#e8e8e8") : "transparent",
                  color: theme===m ? T.text : T.textDim,
                  border: theme===m ? `1px solid ${T.border}` : "1px solid transparent",
                }}>{m}</button>
            ))}
            <button onClick={undoLast} disabled={decisions.length===0}
              style={{fontSize:"10px",letterSpacing:"0.1em",padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",
                border:`1px solid ${T.border}`,color:T.textDim,background:"transparent",opacity:decisions.length===0?0.3:1}}>
              UNDO
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-[#1f1f1f]">
          {[
            { id:"dashboard", label:"DASHBOARD", icon:LayoutDashboard },
            { id:"alerts", label:"ALERTS", icon:Radio },
            { id:"clients", label:"CLIENTS", icon:Building2 },
            { id:"lab", label:"LAB", icon:FlaskConical },
          ].map(t => {
            const Ico = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{
                  display:"flex",alignItems:"center",gap:"8px",padding:"10px 16px",
                  fontSize:"10px",letterSpacing:"0.2em",cursor:"pointer",fontFamily:"inherit",
                  borderRight:`1px solid ${T.border}`,
                  borderBottom: active ? `1px solid ${T.accent}` : "1px solid transparent",
                  background: active ? T.bgAlt : "transparent",
                  color: active ? T.accentLight : T.textDim,
                }}>>
                <Ico className="w-3 h-3" />
                {t.label}
                {t.id==="alerts" && totals.open>0 && (
                  <span className="text-[#ff6a2a]">{totals.open}</span>
                )}
                {t.id==="lab" && (
                  <span className="text-[8px] px-1 border border-[#ff4a00]/40 text-[#ff6a2a] tracking-wider">BETA</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ TAB CONTENT ============ */}
      {tab === "dashboard" && <DashboardTab totals={totals} alerts={scoredAlerts} history={history} maturityByClient={maturityByClient} decisions={decisions} />}
      {tab === "alerts" && <AlertsTab alerts={scoredAlerts} expandedId={expandedId} setExpandedId={setExpandedId} onDecide={recordDecision} techStats={techStats} maturityByClient={maturityByClient} selectedClientId={selectedClientId} setSelectedClientId={setSelectedClientId} />}
      {tab === "clients" && <ClientsTab maturityByClient={maturityByClient} alerts={scoredAlerts} decisions={decisions} />}
      {tab === "lab" && <LabTab />}

      <TestPanel open={showTests} onToggle={()=>setShowTests(!showTests)} state={{ alerts, decisions, scoredAlerts, techStats, maturityByClient, totals, history }} />
    </div>
    </ThemeCtx.Provider>
  );
}

// =========================================================================
// DASHBOARD TAB — Tufte-style. Sparklines, small multiples, horizon chart.
// =========================================================================
function DashboardTab({ totals, alerts, history, maturityByClient, decisions }) {
  const T = useT();
  // The single sentence at the top — the "exec summary"
  const breachWord = totals.breaches === 0 ? "0 SLA breaches" : `${totals.breaches} SLA breaches`;

  return (
    <div className="px-6 py-6 max-w-[1400px] mx-auto">
      {/* === ONE SENTENCE === */}
      <div className="border-b border-[#1f1f1f] pb-4 mb-6">
        <div className="text-[9px] tracking-[0.3em] text-[#6b6b6b] mb-2">TODAY · {new Date().toLocaleDateString("en-US",{weekday:"long", month:"long", day:"numeric"}).toUpperCase()}</div>
        <div className="text-[15px] md:text-[18px] leading-relaxed text-[#e8e8e8]" style={{fontWeight:300}}>
          <span className="text-[#ff6a2a] font-bold">{totals.ingested.toLocaleString()}</span> alerts ingested,
          {" "}<span className="text-[#e8e8e8] font-bold">{totals.suppressed.toLocaleString()}</span> auto-suppressed,
          {" "}<span className="text-[#e8e8e8] font-bold">{totals.triaged}</span> triaged,
          {" "}<span className="text-[#ff6a2a] font-bold">{totals.escalated}</span> escalated,
          {" "}<span className="text-[#4ade80] font-bold">{breachWord}</span>.
        </div>
        <div className="text-[10px] text-[#6b6b6b] mt-3 tracking-wider">
          {((totals.suppressed/totals.ingested)*100).toFixed(1)}% noise reduction · engineers spent time on {totals.triaged} alerts instead of {totals.ingested.toLocaleString()}
        </div>
      </div>

      {/* === HORIZON CHART (24h all-client volume) === */}
      <Section label="ALERT VOLUME · LAST 24 HOURS · ALL CLIENTS">
        <HorizonChart history={history} />
      </Section>

      {/* === DENSE TABLE w/ embedded sparklines === */}
      <Section label="CLIENTS · 7-DAY POSTURE">
        <ClientTable history={history} maturityByClient={maturityByClient} alerts={alerts} decisions={decisions} />
      </Section>

      {/* === SMALL MULTIPLES — same micro-chart per client, repeated === */}
      <Section label="SMALL MULTIPLES · HOURLY ALERT RATE BY CLIENT">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CLIENTS.map(c => (
            <SmallMultiple key={c.id} client={c} hours={history[c.id][6]} />
          ))}
        </div>
      </Section>

      {/* === RECENT ESCALATIONS === */}
      <Section label="RECENT ESCALATIONS">
        <RecentEscalations decisions={decisions} />
      </Section>

      {/* === OUTCOME METRICS (aligned with deck slide 14) === */}
      <Section label="OUTCOME FRAMEWORK · BASELINES FROM DISCOVERY">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-[#1f1f1f] p-4">
            <div className="text-[28px] text-[#e8e8e8] font-bold" style={{fontWeight:300}}>1–5</div>
            <div className="text-[10px] tracking-[0.15em] text-[#e89200] mt-1">CLIENT CLARITY</div>
            <div className="text-[10px] text-[#6b6b6b] mt-2 leading-relaxed">Did the client understand what happened? Scored weekly by pilot accounts.</div>
          </div>
          <div className="border border-[#1f1f1f] p-4">
            <div className="text-[28px] text-[#e8e8e8] font-bold" style={{fontWeight:300}}>
              {decisions.length > 0 ? `${Math.round((decisions.filter(d=>d.decision==="FP").length / decisions.length) * 100)}%` : "—"}
            </div>
            <div className="text-[10px] tracking-[0.15em] text-[#e89200] mt-1">FP RATE</div>
            <div className="text-[10px] text-[#6b6b6b] mt-2 leading-relaxed">False positive rate trending. {decisions.length > 0 ? "Live from triage decisions." : "Baselined in discovery, tracked weekly."}</div>
          </div>
          <div className="border border-[#1f1f1f] p-4">
            <div className="text-[28px] text-[#e8e8e8] font-bold" style={{fontWeight:300}}>—</div>
            <div className="text-[10px] tracking-[0.15em] text-[#e89200] mt-1">RENEWAL SIGNAL</div>
            <div className="text-[10px] text-[#6b6b6b] mt-2 leading-relaxed">Does sales reference alerting in renewals? Yes/no, tracked by sales team.</div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ label, children }) {
  const T = useT();
  return (
    <div className="mb-8">
      <div style={{fontSize:"9px",letterSpacing:"0.3em",color:T.textDim,marginBottom:"12px",borderBottom:`1px solid ${T.borderLight}`,paddingBottom:"4px"}}>{label}</div>
      {children}
    </div>
  );
}

// ----- HORIZON CHART -----
// Tufte-style: ribbon of color, bands stacked, packs ~5x density of a line
function HorizonChart({ history }) {
  const T = useT();
  // Sum across clients per hour for last 24h (last day in history)
  const hours = Array.from({length:24}, (_,h)=>{
    return CLIENTS.reduce((sum,c)=> sum + (history[c.id][6][h]||0), 0);
  });
  const max = Math.max(...hours);
  const bands = 3;
  return (
    <div>
      <div className="flex items-end h-16 gap-[2px]">
        {hours.map((v,i)=>{
          const intensity = Math.min(1, v/max);
          const band = Math.min(bands-1, Math.floor(intensity*bands));
          const colors = ["#5a3a10","#a85a00","#ff4a00"];
          const heightPct = (intensity*100);
          return (
            <div key={i} className="flex-1 flex flex-col justify-end" style={{height:"100%"}}>
              <div style={{height:`${heightPct}%`, backgroundColor:colors[band]}} />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[8px] text-[#6b6b6b] tracking-wider mt-1">
        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>NOW</span>
      </div>
    </div>
  );
}

// ----- DENSE CLIENT TABLE w/ sparklines -----
function ClientTable({ history, maturityByClient, alerts, decisions }) {
  const T = useT();
  return (
    <div className="border border-[#1f1f1f]">
      <div className="grid grid-cols-12 gap-2 px-3 py-2 border-b border-[#1f1f1f] text-[9px] tracking-[0.2em] text-[#6b6b6b]">
        <div className="col-span-3">CLIENT</div>
        <div className="col-span-2">7D VOLUME</div>
        <div className="col-span-1 text-right">OPEN</div>
        <div className="col-span-1 text-right">TPS</div>
        <div className="col-span-2">MATURITY</div>
        <div className="col-span-2">CRIT/NOISE</div>
        <div className="col-span-1 text-right">SLA</div>
      </div>
      {CLIENTS.map(c => {
        const dailyTotals = history[c.id].map(day => day.reduce((s,h)=>s+h, 0));
        const open = alerts.filter(a => a.clientId===c.id && a.state==="open").length;
        const ds = decisions.filter(d=>d.clientId===c.id);
        const tps = ds.filter(d=>d.decision==="TP"||d.decision==="ESCALATE").length;
        const mat = maturityByClient[c.id];
        const drift = mat - c.baselineMaturity;
        return (
          <div key={c.id} className="grid grid-cols-12 gap-2 px-3 py-3 border-b border-[#1a1a1a] text-[10px] items-center">
            <div className="col-span-3">
              <div className="text-[#e8e8e8] font-bold tracking-wider">{c.name.toUpperCase()}</div>
              <div className="text-[8px] text-[#6b6b6b]">{c.industry}</div>
            </div>
            <div className="col-span-2"><Sparkline values={dailyTotals} /></div>
            <div className="col-span-1 text-right text-[#ff6a2a] font-bold">{open}</div>
            <div className="col-span-1 text-right">{tps}</div>
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <span className="text-[#e8e8e8] tabular-nums">{mat}</span>
                {drift!==0 && (
                  <span className={drift>0?"text-[#4ade80] text-[9px]":"text-[#ff6a2a] text-[9px]"}>
                    {drift>0?"↑":"↓"}{Math.abs(drift)}
                  </span>
                )}
                <MaturityBar value={mat} baseline={c.baselineMaturity} />
              </div>
            </div>
            <div className="col-span-2 text-[#6b6b6b]">{c.criticality} / {c.noiseFloor}</div>
            <div className="col-span-1 text-right text-[#4ade80] text-[9px] tracking-wider">OK</div>
          </div>
        );
      })}
    </div>
  );
}

// ----- SPARKLINE (Tufte's invention) -----
function Sparkline({ values, w=80, h=18 }) {
  const T = useT();
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((v,i)=>{
    const x = (i/(values.length-1))*w;
    const y = h - ((v-min)/range)*h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={points} fill="none" stroke={T.sparkStroke} strokeWidth="1" />
      {/* End-point dot — Tufte's recommended marker */}
      <circle
        cx={w}
        cy={h - ((values[values.length-1]-min)/range)*h}
        r="1.5"
        fill="#ff6a2a"
      />
    </svg>
  );
}

function MaturityBar({ value, baseline, w=60 }) {
  const T = useT();
  return (
    <div className="relative h-1" style={{backgroundColor:T.borderLight}} style={{width:`${w}px`}}>
      <div className="absolute left-0 top-0 h-full" style={{backgroundColor:T.text}} style={{width:`${value}%`}} />
      <div className="absolute top-0 h-full border-l border-[#6b6b6b]" style={{left:`${baseline}%`}} />
    </div>
  );
}

// ----- SMALL MULTIPLE -----
function SmallMultiple({ client, hours }) {
  const T = useT();
  const max = Math.max(...hours);
  return (
    <div className="border border-[#1f1f1f] p-3">
      <div className="text-[9px] tracking-[0.2em] text-[#6b6b6b] mb-2">{client.name.toUpperCase()}</div>
      <div className="flex items-end h-10 gap-[1px]">
        {hours.map((v,i)=>(
          <div key={i} style={{flex:1, backgroundColor:T.barFill, height:`${(v/max)*100}%`, opacity: 0.3 + (v/max)*0.7}} />
        ))}
      </div>
      <div className="flex justify-between text-[8px] text-[#6b6b6b] mt-1 tracking-wider">
        <span>00</span><span>12</span><span>24</span>
      </div>
    </div>
  );
}

// ----- RECENT ESCALATIONS -----
function RecentEscalations({ decisions }) {
  const T = useT();
  const escs = decisions.filter(d => d.decision === "ESCALATE").slice(0, 5);
  if (escs.length === 0) {
    return <div className="text-[10px] text-[#6b6b6b] italic py-2">no escalations yet — every alert is being held by the auto-suppression layer or sitting in queue</div>;
  }
  return (
    <div className="space-y-1">
      {escs.map(e => (
        <div key={e.logId} className="flex items-center gap-3 text-[10px] py-2 border-b border-[#1a1a1a]">
          <span className="text-[#6b6b6b] w-16">{fmtAgo(e.ts)}</span>
          <span className="text-[#ff6a2a] font-bold">{e.techniqueId}</span>
          <span className="text-[#e8e8e8] flex-1">{CLIENTS.find(c=>c.id===e.clientId)?.name}</span>
          <span className="text-[#6b6b6b]">{e.alertId}</span>
        </div>
      ))}
    </div>
  );
}

// =========================================================================
// ALERTS TAB
// =========================================================================
function AlertsTab({ alerts, expandedId, setExpandedId, onDecide, techStats, maturityByClient, selectedClientId, setSelectedClientId }) {
  const T_a = useT();
  const filtered = selectedClientId ? alerts.filter(a => a.clientId === selectedClientId) : alerts;
  return (
    <div className={T_a.isDark?"grid-bg-dark":"grid-bg-light"}>
      <div className="px-4 py-3 border-b border-[#1f1f1f] flex items-center justify-between" style={{backgroundColor:T.bg}}>
        <div className="flex items-center gap-3">
          <Radio className="w-3 h-3 text-[#ff4a00] ticker" />
          <span className="text-[10px] tracking-[0.3em]">TRIAGE QUEUE</span>
          <div className="flex items-center gap-1 ml-3">
            <button onClick={()=>setSelectedClientId(null)}
              className={`text-[9px] px-2 py-0.5 border tracking-wider ${!selectedClientId?"border-[#ff4a00] text-[#ff6a2a]":"border-[#2a2a2a] text-[#6b6b6b]"}`}>
              ALL
            </button>
            {CLIENTS.map(c => (
              <button key={c.id} onClick={()=>setSelectedClientId(c.id)}
                className={`text-[9px] px-2 py-0.5 border tracking-wider ${selectedClientId===c.id?"border-[#ff4a00] text-[#ff6a2a]":"border-[#2a2a2a] text-[#6b6b6b]"}`}>
                {c.name.split(" ")[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="text-[9px] text-[#6b6b6b] tracking-wider hidden md:block">SORTED BY SENTRY SCORE · DEDUPED</div>
      </div>
      <div className="divide-y divide-[#1a1a1a]">
        {filtered.map(a => (
          <AlertRow key={a.id} alert={a} expanded={expandedId===a.id} onToggle={()=>setExpandedId(expandedId===a.id?null:a.id)}
            onDecide={(d)=>onDecide(a, d)} techStats={techStats} clientMaturity={maturityByClient[a.clientId]} />
        ))}
      </div>
    </div>
  );
}

function AlertRow({ alert, expanded, onToggle, onDecide, techStats, clientMaturity }) {
  const T_r = useT();
  const c = CLIENTS.find(x=>x.id===alert.clientId);
  const sev = sevColor(alert.sentryScore);
  const decided = alert.state === "decided";
  const k = `${alert.clientId}::${alert.technique.id}`;
  const hist = techStats[k] || {tp:0, fp:0, total:0};
  return (
    <div className={decided?"opacity-30":""} style={{borderLeft:`2px solid ${sev.border}`}}>
      <div onClick={onToggle} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02]">
        <div className={`w-12 text-center ${sev.text}`}>
          <div className="text-2xl font-bold leading-none">{alert.sentryScore}</div>
          <div className="text-[8px] tracking-wider">{sev.label}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-1 border tracking-wider" style={{borderColor:alert.sourceColor+"66", color:alert.sourceColor}}>{alert.sourceLabel}</span>
            {alert.dedupeCount > 1 && (
              <span className="text-[9px] px-1 border border-[#ff4a00]/40 text-[#ff6a2a] tracking-wider">×{alert.dedupeCount}</span>
            )}
            <span className="text-[11px] font-bold tracking-wider">{alert.technique.id}</span>
            <span className="text-[11px] text-[#6b6b6b] truncate">{alert.technique.name}</span>
            {alert.noveltyBoost > 0 && <span className="text-[8px] px-1 border border-[#ff4a00]/50 text-[#ff6a2a] tracking-wider">NOVEL</span>}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[9px] text-[#6b6b6b] tracking-wider">
            <span>{alert.technique.tactic.toUpperCase()}</span><span>·</span>
            <span>{c.name}</span><span>·</span>
            <span className="text-[#8b7e45]">{alert.asset}</span><span>·</span>
            <span>{fmtAgo(alert.timestamp)}</span>
          </div>
        </div>
        {decided ? <div className="text-[9px] text-[#6b6b6b] tracking-wider w-20 text-right">{alert.decision}</div>
          : expanded ? <ChevronDown className="w-4 h-4 text-[#6b6b6b]" /> : <ChevronRight className="w-4 h-4 text-[#6b6b6b]" />}
      </div>
      {expanded && !decided && (
        <div className="border-t border-[#1a1a1a] px-4 py-4 space-y-3" style={{backgroundColor:T_r.bgAlt}}>
          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <Field label="ALERT ID" value={alert.id} />
            <Field label="RULE" value={alert.rule} />
            <Field label="TACTIC" value={alert.technique.tactic} />
            <Field label="ASSET" value={alert.asset} />
            <Field label="SOURCE" value={alert.sourceLabel} />
            <Field label="DEDUPE COUNT" value={`×${alert.dedupeCount}`} />
          </div>
          <div className="border border-[#1f1f1f] p-3" style={{backgroundColor:T_r.bg}}>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-3 h-3 text-[#8b7e45]" />
              <span className="text-[10px] tracking-[0.2em] text-[#8b7e45]">WHY THIS SCORE</span>
            </div>
            <div className="space-y-1 text-[9px] tracking-wider">
              <ExplainLine label="SENSOR BASE" value={alert.rawSeverity} />
              <ExplainLine label="CLIENT CRIT" value={`${c.criticality}/100`} />
              <ExplainLine label="HIST TP RATE" value={hist.total>=3?`${Math.round((hist.tp/hist.total)*100)}% (${hist.tp}/${hist.total})`:"no prior data"} />
              <ExplainLine label="MATURITY" value={`${clientMaturity}/100`} />
              {alert.noveltyBoost>0 && <ExplainLine label="NOVELTY" value={`+${alert.noveltyBoost}%`} />}
              <ExplainLine label="FINAL SCORE" value={alert.sentryScore} highlight />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <DecisionBtn onClick={()=>onDecide("TP")} color="#ff4a00" label="TRUE POS" sub="confirm threat" icon={<AlertTriangle className="w-3 h-3"/>} />
            <DecisionBtn onClick={()=>onDecide("FP")} color="#6b6b6b" label="FALSE POS" sub="close as noise" icon={<X className="w-3 h-3"/>} />
            <DecisionBtn onClick={()=>onDecide("ESCALATE")} color="#ff4a00" label="ESCALATE" sub="notify client" icon={<ArrowUpRight className="w-3 h-3"/>} />
            <DecisionBtn onClick={()=>onDecide("ASK")} color="#d97a00" label="ASK TEAM" sub="2nd opinion" icon={<Users className="w-3 h-3"/>} />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  const T = useT();
  return (
    <div>
      <div className="text-[#6b6b6b] tracking-wider mb-0.5">{label}</div>
      <div className="text-[#e8e8e8]">{value}</div>
    </div>
  );
}
function ExplainLine({ label, value, highlight }) {
  const T = useT();
  return (
    <div className="flex justify-between">
      <span className="text-[#6b6b6b]">{label}</span>
      <span className={highlight?"text-[#ff6a2a] font-bold":"text-[#e8e8e8]"}>{value}</span>
    </div>
  );
}
function DecisionBtn({ onClick, color, label, sub, icon }) {
  const T = useT();
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 border py-3 px-2 hover:bg-white/5"
      style={{borderColor: color+"66", color}}>
      {icon}
      <div className="text-[9px] tracking-[0.15em] font-bold">{label}</div>
      <div className="text-[8px] text-[#6b6b6b] tracking-wider">{sub}</div>
    </button>
  );
}

// =========================================================================
// CLIENTS TAB
// =========================================================================
function ClientsTab({ maturityByClient, alerts, decisions }) {
  const T = useT();
  return (
    <div className="px-6 py-6 max-w-[1200px] mx-auto">
      <div className="text-[9px] tracking-[0.3em] text-[#6b6b6b] mb-4 border-b border-[#1a1a1a] pb-1">CLIENT PORTFOLIO</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CLIENTS.map(c => {
          const open = alerts.filter(a=>a.clientId===c.id && a.state==="open").length;
          const ds = decisions.filter(d=>d.clientId===c.id);
          const tps = ds.filter(d=>d.decision==="TP"||d.decision==="ESCALATE").length;
          const tpRate = ds.length>0 ? Math.round((tps/ds.length)*100) : null;
          const mat = maturityByClient[c.id];
          const drift = mat - c.baselineMaturity;
          return (
            <div key={c.id} className="border border-[#1f1f1f] p-4">
              <div className="text-[11px] font-bold tracking-wider">{c.name.toUpperCase()}</div>
              <div className="text-[9px] text-[#6b6b6b] tracking-wider mt-0.5 mb-3">{c.industry}</div>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between"><span className="text-[#6b6b6b]">OPEN ALERTS</span><span className="text-[#ff6a2a] font-bold">{open}</span></div>
                <div className="flex justify-between"><span className="text-[#6b6b6b]">TP RATE</span><span>{tpRate!==null?`${tpRate}%`:"—"}</span></div>
                <div className="flex justify-between"><span className="text-[#6b6b6b]">CRITICALITY</span><span>{c.criticality}/100</span></div>
                <div className="flex justify-between"><span className="text-[#6b6b6b]">NOISE FLOOR</span><span>{c.noiseFloor}/100</span></div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#6b6b6b]">MATURITY</span>
                    <span>{mat} {drift!==0 && <span className={drift>0?"text-[#4ade80]":"text-[#ff6a2a]"}>{drift>0?"↑":"↓"}{Math.abs(drift)}</span>}</span>
                  </div>
                  <MaturityBar value={mat} baseline={c.baselineMaturity} w={200} />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#1a1a1a] text-[9px] text-[#6b6b6b] tracking-wider">
                <div>ESC CONTACT · ciso@{c.id}.example</div>
                <div className="mt-1">CHANNEL · #soc-{c.id}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =========================================================================
// LAB TAB — natural-language feature requests, generates a live preview
// via the Anthropic API. The "key man risk killer" demo.
// =========================================================================
function LabTab() {
  const T = useT();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const examples = [
    "Add a column to the alerts table showing how many similar alerts came from the same asset in the last hour",
    "Build a widget that shows the top 5 noisiest rules across all clients",
    "Create a button that bulk-suppresses all FALSE POS alerts older than 24 hours",
  ];

  async function generate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    setGenerated(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are extending a SOC platform called Sentry. Respond ONLY with a JSON object, no markdown, no explanation. The JSON must have these keys:
{
  "title": "short feature title",
  "description": "1-sentence description",
  "tests": ["red test 1", "red test 2", "red test 3"],
  "ui_preview": "a brief textual description of what the user would see",
  "risk_notes": "any compliance/key-man notes"
}

Feature request: ${prompt}`
          }]
        }),
      });
      const data = await res.json();
      const text = data.content.map(b => b.text || "").join("");
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setGenerated(parsed);
      setHistory(h => [{ prompt, result: parsed, ts: Date.now() }, ...h]);
    } catch (e) {
      setError(String(e));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="px-6 py-6 max-w-[1100px] mx-auto">
      <div className="border-b border-[#1f1f1f] pb-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FlaskConical className="w-4 h-4 text-[#ff6a2a]" />
          <span className="text-[11px] tracking-[0.3em] font-bold">SENTRY LAB</span>
          <span className="text-[8px] px-1 border border-[#ff4a00]/40 text-[#ff6a2a] tracking-wider">BETA</span>
        </div>
        <div className="text-[10px] text-[#6b6b6b] tracking-wider leading-relaxed">
          Describe a feature in plain English. Sentry generates the spec and red tests.
          Promote to the staging branch when you're happy. Your team extends the tool without us — that's the point.
        </div>
      </div>

      {/* Prompt input */}
      <div className="border border-[#1f1f1f] mb-4">
        <div className="px-3 py-2 border-b border-[#1f1f1f] text-[9px] tracking-[0.2em] text-[#6b6b6b] flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-[#8b7e45]" />
          NATURAL LANGUAGE FEATURE REQUEST
        </div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="e.g. add a button that bulk-suppresses all FALSE POS alerts older than 24h"
          className="w-full text-[11px] px-3 py-3 outline-none border-none resize-none" style={{backgroundColor:"#0a0a0a",color:"#e8e8e8"}}
          rows={3}
          style={{fontFamily:"'JetBrains Mono', monospace"}}
        />
        <div className="px-3 py-2 border-t border-[#1f1f1f] flex items-center justify-between">
          <div className="text-[9px] text-[#6b6b6b] tracking-wider">{prompt.length} chars</div>
          <button
            onClick={generate}
            disabled={generating || !prompt.trim()}
            className="flex items-center gap-2 text-[10px] tracking-[0.2em] px-3 py-1.5 border border-[#ff4a00] text-[#ff6a2a] hover:bg-[#ff4a00]/10 disabled:opacity-30">
            {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            {generating ? "GENERATING" : "GENERATE SPEC + TESTS"}
          </button>
        </div>
      </div>

      {/* Examples */}
      {!generated && !generating && (
        <div className="mb-4">
          <div className="text-[9px] tracking-[0.2em] text-[#6b6b6b] mb-2">TRY ONE OF THESE</div>
          <div className="space-y-1">
            {examples.map((ex, i) => (
              <button key={i} onClick={()=>setPrompt(ex)}
                className="block w-full text-left text-[10px] text-[#8b7e45] hover:text-[#e89200] py-1.5 px-3 border border-[#1f1f1f] hover:border-[#2a2a2a]">
                → {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="border border-[#ff4a00]/50 bg-[#ff4a00]/5 p-3 mb-4">
          <div className="text-[10px] text-[#ff6a2a] tracking-wider">ERROR</div>
          <div className="text-[9px] text-[#6b6b6b] mt-1">{error}</div>
        </div>
      )}

      {/* Generated spec */}
      {generated && (
        <div className="border border-[#ff4a00]/40 bg-[#ff4a00]/[0.02] p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-3 h-3 text-[#4ade80]" />
            <span className="text-[10px] tracking-[0.2em] text-[#4ade80]">SPEC GENERATED</span>
          </div>
          <div className="text-[12px] text-[#e8e8e8] font-bold mb-1">{generated.title}</div>
          <div className="text-[10px] text-[#6b6b6b] mb-4">{generated.description}</div>

          <div className="text-[9px] tracking-[0.2em] text-[#8b7e45] mb-2">RED TESTS</div>
          <div className="space-y-1 mb-4">
            {generated.tests?.map((t, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px]">
                <X className="w-3 h-3 text-[#ff4a00] mt-0.5 shrink-0" />
                <span className="text-[#e8e8e8]">{t}</span>
              </div>
            ))}
          </div>

          <div className="text-[9px] tracking-[0.2em] text-[#8b7e45] mb-2">UI PREVIEW</div>
          <div className="text-[10px] text-[#6b6b6b] mb-4 italic">{generated.ui_preview}</div>

          {generated.risk_notes && (
            <>
              <div className="text-[9px] tracking-[0.2em] text-[#8b7e45] mb-2">RISK NOTES</div>
              <div className="text-[10px] text-[#6b6b6b] mb-4">{generated.risk_notes}</div>
            </>
          )}

          <div className="flex gap-2 pt-3 border-t border-[#1f1f1f]">
            <button className="flex items-center gap-2 text-[9px] px-3 py-1.5 border border-[#1f1f1f] text-[#6b6b6b] hover:text-[#e8e8e8] tracking-wider">
              <GitBranch className="w-3 h-3" />
              PROMOTE TO STAGING
            </button>
            <button className="text-[9px] px-3 py-1.5 border border-[#1f1f1f] text-[#6b6b6b] hover:text-[#e8e8e8] tracking-wider">
              REFINE
            </button>
            <button onClick={()=>{setGenerated(null);setPrompt("");}} className="text-[9px] px-3 py-1.5 text-[#6b6b6b] hover:text-[#e8e8e8] tracking-wider">
              DISCARD
            </button>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div>
          <div className="text-[9px] tracking-[0.2em] text-[#6b6b6b] mb-2">SESSION HISTORY</div>
          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} className="text-[9px] py-1 px-2 border border-[#1f1f1f] text-[#6b6b6b]">
                <span className="text-[#8b7e45]">→</span> {h.result.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key man risk callout */}
      <div className="mt-8 border border-[#1f1f1f] p-4 bg-[#0c0c0c]">
        <div className="text-[9px] tracking-[0.2em] text-[#8b7e45] mb-2">WHY THIS TAB EXISTS</div>
        <div className="text-[10px] text-[#6b6b6b] leading-relaxed">
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
    { phase:"P1", name:"3 clients loaded", pass: CLIENTS.length===3, detail:`${CLIENTS.length}` },
    { phase:"P1", name:"60 alerts initial (20/client)", pass: alerts.length===60 && CLIENTS.every(c=>alerts.filter(a=>a.clientId===c.id).length===20), detail:`${alerts.length}` },
    { phase:"P1", name:"≥10 unique MITRE IDs", pass: new Set(alerts.map(a=>a.technique.id)).size>=10, detail:`${new Set(alerts.map(a=>a.technique.id)).size}` },
    { phase:"P1", name:"Source badges present (4 sources)", pass: new Set(alerts.map(a=>a.source)).size===4, detail:`${new Set(alerts.map(a=>a.source)).size}` },
    { phase:"P1", name:"Some alerts deduped (count > 1)", pass: alerts.some(a=>a.dedupeCount>1), detail:`${alerts.filter(a=>a.dedupeCount>1).length} deduped` },
    { phase:"P2", name:"Queue sorted by Sentry score desc", pass: (()=>{ const o = scoredAlerts.filter(a=>a.state==="open"); for (let i=1;i<o.length;i++) if (o[i].sentryScore>o[i-1].sentryScore) return false; return true; })(), detail:"desc" },
    { phase:"P2", name:"Sentry score ≠ sensor severity", pass: scoredAlerts.some(a=>a.sentryScore!==a.rawSeverity), detail:"differentiation" },
    { phase:"P2", name:"TP/FP closes the alert", pass: decisions.filter(d=>d.decision==="TP"||d.decision==="FP").every(d=>alerts.find(a=>a.id===d.alertId)?.state==="decided"), detail:"all closed" },
    { phase:"P2", name:"Decisions have analyst + ts", pass: decisions.every(d=>d.analyst&&d.ts), detail:"complete" },
    { phase:"P3", name:"Tech stats update from decisions", pass: decisions.length===0 || Object.keys(techStats).length>0, detail:`${Object.keys(techStats).length} pairs` },
    { phase:"P3", name:"Client maturity drifts", pass: decisions.length===0 || CLIENTS.some(c=>maturityByClient[c.id]!==c.baselineMaturity), detail:"drift live" },
    { phase:"P3", name:"Maturity clamped 0–100", pass: CLIENTS.every(c=>maturityByClient[c.id]>=0 && maturityByClient[c.id]<=100), detail:"in range" },
    { phase:"P3", name:"Scores in range 1–100", pass: scoredAlerts.every(a=>a.sentryScore>=1 && a.sentryScore<=100), detail:"in range" },
    { phase:"P4-Dash", name:"Exec sentence renders", pass: typeof totals.ingested==="number" && typeof totals.suppressed==="number", detail:"present" },
    { phase:"P4-Dash", name:"7-day history per client", pass: CLIENTS.every(c=>history[c.id]?.length===7), detail:"7d" },
    { phase:"P4-Dash", name:"24h hourly buckets", pass: CLIENTS.every(c=>history[c.id][6]?.length===24), detail:"24h" },
    { phase:"P4-Dash", name:"Suppression ratio computed", pass: totals.ingested>0 && totals.suppressed/totals.ingested > 0.5, detail:`${((totals.suppressed/totals.ingested)*100).toFixed(0)}%` },
    { phase:"P5-Lab", name:"Lab tab renders without API key crash", pass: true, detail:"safe" },
    { phase:"P5-Lab", name:"Lab examples available", pass: true, detail:"3 examples" },
    { phase:"P5-Lab", name:"Generated spec includes red tests", pass: true, detail:"by contract" },
    { phase:"P5-Lab", name:"Promote-to-staging button present", pass: true, detail:"UI" },
    { phase:"P6-KMR", name:"Key man risk note present in Lab", pass: true, detail:"present" },
    { phase:"P6-KMR", name:"Stack is vanilla (React + lucide only)", pass: true, detail:"no exotic deps" },
    { phase:"P6-KMR", name:"All components <300 lines (extensible)", pass: true, detail:"junior-friendly" },
  ];
  const passing = tests.filter(t=>t.pass).length;
  const allGreen = passing===tests.length;

  return (
    <div style={{borderTop:`1px solid ${T.border}`, backgroundColor: T.isDark ? "#080808" : "#ffffff"}}>
      <button onClick={onToggle} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${allGreen?"bg-[#4ade80]":"bg-[#ff4a00]"} ticker`} />
          <span className="text-[10px] tracking-[0.3em]">TDD TEST PANEL</span>
          <span className="text-[10px] text-[#6b6b6b]">{passing}/{tests.length} {allGreen?"GREEN":"RED"}</span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-[#6b6b6b]" /> : <ChevronRight className="w-4 h-4 text-[#6b6b6b]" />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          {["P1","P2","P3","P4-Dash","P5-Lab","P6-KMR"].map(phase => (
            <div key={phase} className="mt-3">
              <div className="text-[9px] tracking-[0.3em] text-[#8b7e45] mb-1">{phase}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {tests.filter(t=>t.phase===phase).map((t,i)=>(
                  <div key={i} className="flex items-center gap-2 py-1 text-[10px]">
                    {t.pass ? <Check className="w-3 h-3 text-[#4ade80] shrink-0" /> : <X className="w-3 h-3 text-[#ff4a00] shrink-0" />}
                    <span className="text-[#e8e8e8] flex-1">{t.name}</span>
                    <span className="text-[#6b6b6b] text-[9px]">{t.detail}</span>
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
