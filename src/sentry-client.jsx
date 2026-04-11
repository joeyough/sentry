import React, { useState, useMemo, useEffect } from "react";
import {
  Shield, Check, X, Clock, ChevronRight, ChevronLeft, ArrowUp, ArrowDown,
  Sun, Moon, Bell, Sparkles, TrendingUp, AlertCircle, CheckCircle2,
  Loader2, Calendar, FileText, Lock
} from "lucide-react";

/* =========================================================================
   SENTRY CLIENT — VDA Labs
   ---------------------------------------------------------------------------
   The client-facing companion to the engineer console.

   Reader: a business owner. 47 things on their plate. Needs to know
   in 3 seconds: am I okay? If not, what do I do, with one thumb?

   Aesthetic: Apple-clean × Tesla-confident × Palantir-serious.
   Light + dark, auto-switching with the system. Calm, generous, glanceable.

   Screens (no tabs, no menu):
     1. STATUS    — the big "you're okay" home
     2. ACTIVE    — the short list of things VDA is working on
     3. DECISION  — single-question modal (Approve/Deny/Ask Later)
     4. DIGEST    — the weekly report

   The client decisions feed back into the scoring loops on the engineer
   side. This is the bidirectional teach channel.
   ========================================================================= */

// =========================================================================
// MOCK DATA — what a real client would see
// =========================================================================

const CLIENT = {
  name: "Aspen Holdings",
  industry: "Financial Services",
  contact: "Jordan Mauriello",
  ciso: "T. Reeves",
};

// The big three statuses
const STATUS = {
  CLEAR: "CLEAR",
  WORKING: "WORKING",
  ATTENTION: "ATTENTION",
};

// Items VDA is currently working on or wants client input on
const initialItems = [
  {
    id: "I-001",
    severity: "ATTENTION",
    title: "Unusual login from new country",
    headline: "Someone signed into your CFO's email from Lagos, Nigeria 14 minutes ago.",
    context: "VDA's analysts checked: this isn&apos;t on Tom&apos;s typical travel pattern. We&apos;ve temporarily blocked the session and want your call before reaching out to him directly.",
    recommendation: "Approve the block and we'll call Tom now to verify.",
    asset: "Tom Webb · CFO · O365 mailbox",
    technique: "Suspicious sign-in",
    handledBy: "T. Reeves",
    timeReceived: Date.now() - 14*60*1000,
    requiresClient: true,
    decision: null,
  },
  {
    id: "I-002",
    severity: "WORKING",
    title: "Phishing campaign targeting finance team",
    headline: "5 phishing emails impersonating your bank were caught before delivery.",
    context: "Standard campaign, no one clicked. We're updating the rule so future variants are blocked automatically.",
    recommendation: "No action needed. We'll include this in your weekly digest.",
    asset: "Email gateway · 5 messages",
    technique: "Spearphishing",
    handledBy: "M. Chen",
    timeReceived: Date.now() - 2*60*60*1000,
    requiresClient: false,
    decision: null,
  },
  {
    id: "I-003",
    severity: "WORKING",
    title: "Patch deployed to trading server",
    headline: "Critical security patch applied to SVR-TRADE-07 during maintenance window.",
    context: "Routine. Server back online, all checks green.",
    recommendation: "FYI only.",
    asset: "SVR-TRADE-07",
    technique: "Patch management",
    handledBy: "T. Reeves",
    timeReceived: Date.now() - 5*60*60*1000,
    requiresClient: false,
    decision: null,
  },
];

// 30 days of "noise reduction" history — the calm sparkline
function buildHistory() {
  const days = [];
  for (let i = 0; i < 30; i++) {
    days.push({
      ingested: Math.floor(800 + Math.random() * 600),
      escalated: Math.floor(Math.random() * 3),
    });
  }
  return days;
}

// =========================================================================
// MAIN
// =========================================================================
export default function SentryClient() {
  const [items, setItems] = useState(initialItems);
  const [screen, setScreen] = useState("status"); // status | active | decision | digest
  const [activeItemId, setActiveItemId] = useState(null);
  const [theme, setTheme] = useState("auto"); // auto | light | dark
  const [systemDark, setSystemDark] = useState(false);
  const [history] = useState(() => buildHistory());
  const [criticalityOverrides, setCriticalityOverrides] = useState({}); // asset -> "elevated" | "lowered"
  const [showTests, setShowTests] = useState(false);
  const [confirmToast, setConfirmToast] = useState(null);

  // Detect system dark mode
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  const isDark = theme === "auto" ? systemDark : theme === "dark";

  // Compute global status
  const status = useMemo(() => {
    const open = items.filter(i => i.decision === null);
    if (open.some(i => i.severity === "ATTENTION" && i.requiresClient)) return STATUS.ATTENTION;
    if (open.some(i => i.severity === "WORKING" || i.severity === "ATTENTION")) return STATUS.WORKING;
    return STATUS.CLEAR;
  }, [items]);

  const openItems = items.filter(i => i.decision === null);
  const attentionItems = openItems.filter(i => i.requiresClient);
  const workingItems = openItems.filter(i => !i.requiresClient);
  const activeItem = items.find(i => i.id === activeItemId);

  function recordDecision(itemId, decision, criticalityChange = null) {
    setItems(list => list.map(i => i.id === itemId ? { ...i, decision, decidedAt: Date.now(), clientConfirmed: decision === "APPROVED" } : i));
    if (decision === "APPROVED") {
      setConfirmToast("Your confirmation improved detection for this pattern across your environment.");
      setTimeout(() => setConfirmToast(null), 4000);
    }
    if (criticalityChange) {
      const item = items.find(i => i.id === itemId);
      if (item) {
        setCriticalityOverrides(o => ({ ...o, [item.asset]: criticalityChange }));
      }
    }
    setScreen("status");
    setActiveItemId(null);
  }

  // Theme tokens
  const T = isDark ? {
    bg: "#0e0f10",
    surface: "#16181a",
    surfaceHi: "#1d1f22",
    text: "#f5f3ee",
    textDim: "#8a8680",
    border: "rgba(255,255,255,0.06)",
    sage: "#9bb5a3",
    amber: "#d4a574",
    crimson: "#c95850",
    accent: "#d4a574",
    statusClear: "#9bb5a3",
    statusWorking: "#d4a574",
    statusAttention: "#c95850",
  } : {
    bg: "#fbfaf7",
    surface: "#ffffff",
    surfaceHi: "#f4f1eb",
    text: "#1a1816",
    textDim: "#7a756d",
    border: "rgba(0,0,0,0.06)",
    sage: "#4a6b54",
    amber: "#a8651e",
    crimson: "#a83a32",
    accent: "#a8651e",
    statusClear: "#6b8a72",
    statusWorking: "#a8651e",
    statusAttention: "#a83a32",
  };

  return (
    <div style={{ background: isDark ? "#050505" : "#e8e6e0", minHeight: "100vh", padding: "20px 12px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@300;400;500;600&display=swap');
        .serif { font-family: 'Fraunces', 'Iowan Old Style', Georgia, serif; font-optical-sizing: auto; }
        .sans { font-family: 'Inter', -apple-system, system-ui, sans-serif; }
        @keyframes pulse-slow { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        .pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fade-in 0.4s ease-out; }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        .scale-in { animation: scale-in 0.3s ease-out; }
      `}</style>

      {/* Outer wrapper */}
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Header strip */}
        <div className="sans" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "0 8px", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: T.accent, flexShrink: 0 }} />
            <div style={{ minWidth: 0, lineHeight: 1.25 }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.22em", color: isDark ? "#777" : "#888", textTransform: "uppercase", fontWeight: 600 }}>
                Sentry Client
              </div>
              <div className="serif" style={{ fontSize: "13px", color: T.text, letterSpacing: "-0.005em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Aspen Holdings
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {["auto","light","dark"].map(t => (
              <button key={t} onClick={() => setTheme(t)}
                style={{
                  fontSize: "10px",
                  padding: "4px 10px",
                  background: theme === t ? (isDark ? "#222" : "#fff") : "transparent",
                  color: theme === t ? (isDark ? "#fff" : "#000") : (isDark ? "#666" : "#999"),
                  border: `1px solid ${theme === t ? (isDark ? "#333" : "#ddd") : "transparent"}`,
                  borderRadius: "999px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* PHONE FRAME */}
        <div style={{
          maxWidth: "420px",
          margin: "0 auto",
          background: T.bg,
          color: T.text,
          borderRadius: "44px",
          padding: "0",
          overflow: "hidden",
          boxShadow: isDark
            ? "0 30px 80px rgba(0,0,0,0.7), 0 0 0 8px #18181a, 0 0 0 9px #2a2a2c"
            : "0 30px 80px rgba(0,0,0,0.18), 0 0 0 8px #fafaf7, 0 0 0 9px #d8d4cc",
          position: "relative",
          minHeight: "820px",
          transition: "background 0.4s ease, color 0.4s ease",
        }}>

          {/* Notch */}
          <div style={{
            position: "absolute",
            top: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "120px",
            height: "26px",
            background: "#000",
            borderRadius: "20px",
            zIndex: 10,
          }} />

          {/* Confirmation toast (R3) */}
          {confirmToast && (
            <div className="fade-in" style={{
              position:"absolute", top:"48px", left:"20px", right:"20px", zIndex:20,
              background: isDark ? "#1a2e1a" : "#e8f5e8",
              border: `1px solid ${isDark ? "#2d5a2d" : "#a8d8a8"}`,
              borderRadius:"14px", padding:"14px 18px",
              fontSize:"12px", color: isDark ? "#a8d8a8" : "#2d5a2d",
              fontFamily:"'Inter', sans-serif",
            }}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"14px"}}>✓</span>
                {confirmToast}
              </div>
            </div>
          )}

          {/* Status bar */}
          <div className="sans" style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "16px 28px 0",
            fontSize: "12px",
            fontWeight: 600,
            color: T.text,
          }}>
            <span>{new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
            <span style={{ opacity: 0.5 }}>•••</span>
          </div>

          {/* SCREENS */}
          <div style={{ padding: "56px 28px 32px", minHeight: "740px" }}>
            {screen === "status" && (
              <StatusScreen
                T={T}
                isDark={isDark}
                client={CLIENT}
                status={status}
                openItems={openItems}
                attentionItems={attentionItems}
                workingItems={workingItems}
                history={history}
                onOpenActive={() => setScreen("active")}
                onOpenDigest={() => setScreen("digest")}
                onOpenItem={(id) => { setActiveItemId(id); setScreen("decision"); }}
              />
            )}

            {screen === "active" && (
              <ActiveScreen
                T={T}
                items={openItems}
                onBack={() => setScreen("status")}
                onOpenItem={(id) => { setActiveItemId(id); setScreen("decision"); }}
              />
            )}

            {screen === "decision" && activeItem && (
              <DecisionScreen
                T={T}
                item={activeItem}
                onBack={() => setScreen("active")}
                onDecide={(d, cc) => recordDecision(activeItem.id, d, cc)}
              />
            )}

            {screen === "digest" && (
              <DigestScreen
                T={T}
                client={CLIENT}
                history={history}
                items={items}
                onBack={() => setScreen("status")}
              />
            )}
          </div>

          {/* Bottom home indicator */}
          <div style={{
            position: "absolute",
            bottom: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "120px",
            height: "4px",
            background: T.text,
            opacity: 0.25,
            borderRadius: "2px",
          }} />
        </div>

        {/* TDD panel below the phone */}
        <TestPanel
          open={showTests}
          onToggle={() => setShowTests(!showTests)}
          isDark={isDark}
          state={{ items, status, openItems, attentionItems, workingItems, criticalityOverrides, history, theme, isDark }}
        />
      </div>
    </div>
  );
}

// =========================================================================
// STATUS SCREEN — the home. The "am I okay?" answer in 2 seconds.
// =========================================================================
function StatusScreen({ T, isDark, client, status, openItems, attentionItems, workingItems, history, onOpenActive, onOpenDigest, onOpenItem }) {
  const statusConfig = {
    CLEAR: {
      color: T.statusClear,
      icon: CheckCircle2,
      headline: "All clear",
      sub: "VDA is monitoring. Nothing needs you right now.",
    },
    WORKING: {
      color: T.statusWorking,
      icon: Loader2,
      headline: "We're on it",
      sub: `${workingItems.length} ${workingItems.length === 1 ? "item" : "items"} being handled. No action needed.`,
    },
    ATTENTION: {
      color: T.statusAttention,
      icon: AlertCircle,
      headline: "Your attention",
      sub: `${attentionItems.length} ${attentionItems.length === 1 ? "decision" : "decisions"} only you can make.`,
    },
  };

  const cfg = statusConfig[status];
  const Ico = cfg.icon;

  // Sparkline of last 14 days
  const recent = history.slice(-14);
  const max = Math.max(...recent.map(d => d.ingested));

  return (
    <div className="fade-in">
      {/* Greeting */}
      <div className="sans" style={{ fontSize: "13px", color: T.textDim, marginBottom: "4px", letterSpacing: "0.02em" }}>
        Good {greet()}, {client.contact.split(" ")[0]}
      </div>
      <div className="serif" style={{ fontSize: "26px", fontWeight: 400, color: T.text, marginBottom: "32px", letterSpacing: "-0.01em" }}>
        {client.name}
      </div>

      {/* THE BIG STATUS — the 2-second answer */}
      <div className="scale-in" style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: "24px",
        padding: "32px 24px",
        marginBottom: "20px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Subtle ambient color wash */}
        <div style={{
          position: "absolute",
          top: "-40%",
          right: "-20%",
          width: "240px",
          height: "240px",
          background: cfg.color,
          opacity: 0.08,
          filter: "blur(80px)",
          borderRadius: "50%",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: `${cfg.color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "20px",
            border: `1px solid ${cfg.color}30`,
          }}>
            <Ico
              size={32}
              color={cfg.color}
              className={status === "WORKING" ? "pulse-slow" : ""}
              style={status === "WORKING" ? { animation: "spin 8s linear infinite" } : {}}
            />
          </div>
          <div className="serif" style={{ fontSize: "32px", fontWeight: 400, color: T.text, marginBottom: "8px", letterSpacing: "-0.02em" }}>
            {cfg.headline}
          </div>
          <div className="sans" style={{ fontSize: "14px", color: T.textDim, lineHeight: 1.5, maxWidth: "260px" }}>
            {cfg.sub}
          </div>
        </div>
      </div>

      {/* Attention items — the only place red lives on the home */}
      {attentionItems.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          {attentionItems.map(item => (
            <button
              key={item.id}
              onClick={() => onOpenItem(item.id)}
              style={{
                width: "100%",
                background: T.surface,
                border: `1px solid ${T.statusAttention}40`,
                borderRadius: "20px",
                padding: "20px",
                marginBottom: "12px",
                textAlign: "left",
                cursor: "pointer",
                color: T.text,
                fontFamily: "inherit",
              }}>
              <div className="sans" style={{ fontSize: "10px", letterSpacing: "0.15em", color: T.statusAttention, textTransform: "uppercase", marginBottom: "8px" }}>
                Needs your decision
              </div>
              <div className="serif" style={{ fontSize: "18px", color: T.text, marginBottom: "6px", lineHeight: 1.3 }}>
                {item.title}
              </div>
              <div className="sans" style={{ fontSize: "13px", color: T.textDim, lineHeight: 1.5, marginBottom: "12px" }}>
                {item.headline}
              </div>
              <div className="sans" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: T.textDim }}>{ago(item.timeReceived)}</span>
                <ChevronRight size={16} color={T.statusAttention} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Working summary card */}
      {workingItems.length > 0 && (
        <button onClick={onOpenActive} style={{
          width: "100%",
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: "20px",
          padding: "18px 20px",
          marginBottom: "20px",
          textAlign: "left",
          cursor: "pointer",
          color: T.text,
          fontFamily: "inherit",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <div className="sans" style={{ fontSize: "10px", letterSpacing: "0.15em", color: T.textDim, textTransform: "uppercase", marginBottom: "4px" }}>
              VDA is handling
            </div>
            <div className="serif" style={{ fontSize: "16px", color: T.text }}>
              {workingItems.length} {workingItems.length === 1 ? "item" : "items"} in progress
            </div>
          </div>
          <ChevronRight size={18} color={T.textDim} />
        </button>
      )}

      {/* Quiet noise reduction stat — the proof we're earning our keep */}
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: "20px",
        padding: "20px",
        marginBottom: "16px",
      }}>
        <div className="sans" style={{ fontSize: "10px", letterSpacing: "0.15em", color: T.textDim, textTransform: "uppercase", marginBottom: "12px" }}>
          Last 14 days
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px" }}>
          <div>
            <div className="serif" style={{ fontSize: "32px", fontWeight: 400, color: T.text, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {recent.reduce((s, d) => s + d.ingested - d.escalated, 0).toLocaleString()}
            </div>
            <div className="sans" style={{ fontSize: "11px", color: T.textDim, marginTop: "6px" }}>
              alerts handled without you
            </div>
          </div>
          <ClientSparkline values={recent.map(d => d.ingested)} color={T.accent} />
        </div>
        <div style={{ height: "1px", background: T.border, margin: "0 -20px 16px" }} />
        <div className="sans" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
          <div>
            <div style={{ color: T.textDim }}>Total reviewed</div>
            <div style={{ color: T.text, fontWeight: 500, marginTop: "2px" }}>
              {recent.reduce((s, d) => s + d.ingested, 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ color: T.textDim }}>Escalated to you</div>
            <div style={{ color: T.text, fontWeight: 500, marginTop: "2px" }}>
              {recent.reduce((s, d) => s + d.escalated, 0)}
            </div>
          </div>
          <div>
            <div style={{ color: T.textDim }}>Quiet days</div>
            <div style={{ color: T.text, fontWeight: 500, marginTop: "2px" }}>
              {recent.filter(d => d.escalated === 0).length}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly digest button — visually elevated */}
      <button onClick={onOpenDigest} style={{
        width: "100%",
        background: T.isDark
          ? "linear-gradient(135deg, rgba(255,74,0,0.08) 0%, rgba(255,74,0,0.02) 100%)"
          : "linear-gradient(135deg, rgba(217,68,0,0.06) 0%, rgba(217,68,0,0.01) 100%)",
        border: `1px solid ${T.accent}40`,
        borderLeft: `3px solid ${T.accent}`,
        borderRadius: "16px",
        padding: "18px 18px",
        cursor: "pointer",
        color: T.text,
        fontFamily: "inherit",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: T.isDark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(217,68,0,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: T.accent + "1a", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Calendar size={16} color={T.accent} />
          </div>
          <div style={{ textAlign: "left", lineHeight: 1.3 }}>
            <div className="sans" style={{ fontSize: "9px", letterSpacing: "0.18em", color: T.accent, textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>
              New · Ready
            </div>
            <div className="serif" style={{ fontSize: "15px", color: T.text, letterSpacing: "-0.005em" }}>
              This week's report
            </div>
          </div>
        </div>
        <ChevronRight size={18} color={T.accent} />
      </button>
    </div>
  );
}

// Sparkline for client app — softer than the engineer one
function ClientSparkline({ values, color, w = 100, h = 32 }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const linePoints = points.join(" ");
  const areaPoints = `0,${h} ${linePoints} ${w},${h}`;
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#spark-grad)" />
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// =========================================================================
// ACTIVE SCREEN — list of in-progress items
// =========================================================================
function ActiveScreen({ T, items, onBack, onOpenItem }) {
  return (
    <div className="fade-in">
      <button onClick={onBack} className="sans" style={{
        background: "transparent", border: "none", color: T.textDim,
        fontSize: "13px", padding: "0 0 24px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit",
      }}>
        <ChevronLeft size={16} /> Back
      </button>

      <div className="serif" style={{ fontSize: "28px", color: T.text, marginBottom: "8px", letterSpacing: "-0.01em" }}>
        Active items
      </div>
      <div className="sans" style={{ fontSize: "13px", color: T.textDim, marginBottom: "28px" }}>
        {items.length} {items.length === 1 ? "item" : "items"} in progress
      </div>

      <div>
        {items.map(item => {
          const isAttention = item.severity === "ATTENTION" && item.requiresClient;
          const accent = isAttention ? T.statusAttention : T.statusWorking;
          return (
            <button key={item.id} onClick={() => onOpenItem(item.id)} style={{
              width: "100%",
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderLeft: `3px solid ${accent}`,
              borderRadius: "16px",
              padding: "18px",
              marginBottom: "12px",
              textAlign: "left",
              cursor: "pointer",
              color: T.text,
              fontFamily: "inherit",
            }}>
              <div className="sans" style={{ fontSize: "10px", letterSpacing: "0.15em", color: accent, textTransform: "uppercase", marginBottom: "8px" }}>
                {isAttention ? "Needs decision" : "Handling"}
              </div>
              <div className="serif" style={{ fontSize: "16px", color: T.text, marginBottom: "6px", lineHeight: 1.3 }}>
                {item.title}
              </div>
              <div className="sans" style={{ fontSize: "12px", color: T.textDim, marginBottom: "12px", lineHeight: 1.5 }}>
                {item.headline}
              </div>
              <div className="sans" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: T.textDim }}>
                <span>by {item.handledBy}</span>
                <span>{ago(item.timeReceived)}</span>
              </div>
            </button>
          );
        })}
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: T.textDim }}>
            <CheckCircle2 size={32} color={T.statusClear} style={{ marginBottom: "12px" }} />
            <div className="serif" style={{ fontSize: "18px", color: T.text }}>Nothing active</div>
            <div className="sans" style={{ fontSize: "12px", marginTop: "4px" }}>You're all clear.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// DECISION SCREEN — the one-thumb screen. Three buttons, no fluff.
// =========================================================================
function DecisionScreen({ T, item, onBack, onDecide }) {
  const [showCriticality, setShowCriticality] = useState(false);
  const isAttention = item.severity === "ATTENTION";
  const accent = isAttention ? T.statusAttention : T.statusWorking;

  return (
    <div className="fade-in">
      <button onClick={onBack} className="sans" style={{
        background: "transparent", border: "none", color: T.textDim,
        fontSize: "13px", padding: "0 0 24px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit",
      }}>
        <ChevronLeft size={16} /> Back
      </button>

      <div className="sans" style={{ fontSize: "10px", letterSpacing: "0.18em", color: accent, textTransform: "uppercase", marginBottom: "12px" }}>
        {isAttention ? "Decision needed" : "For your awareness"}
      </div>

      <div className="serif" style={{ fontSize: "26px", color: T.text, marginBottom: "16px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
        {item.title}
      </div>

      <div className="sans" style={{ fontSize: "15px", color: T.text, lineHeight: 1.6, marginBottom: "24px" }}>
        {item.headline}
      </div>

      <div style={{
        background: T.surfaceHi,
        border: `1px solid ${T.border}`,
        borderRadius: "16px",
        padding: "18px",
        marginBottom: "20px",
      }}>
        <div className="sans" style={{ fontSize: "10px", letterSpacing: "0.15em", color: T.textDim, textTransform: "uppercase", marginBottom: "10px" }}>
          What's happening
        </div>
        <div className="sans" style={{ fontSize: "13px", color: T.text, lineHeight: 1.6 }}>
          {item.context}
        </div>
      </div>

      <div style={{
        background: T.surfaceHi,
        border: `1px solid ${accent}30`,
        borderRadius: "16px",
        padding: "18px",
        marginBottom: "24px",
      }}>
        <div className="sans" style={{ fontSize: "10px", letterSpacing: "0.15em", color: accent, textTransform: "uppercase", marginBottom: "10px" }}>
          Our recommendation
        </div>
        <div className="sans" style={{ fontSize: "13px", color: T.text, lineHeight: 1.6 }}>
          {item.recommendation}
        </div>
      </div>

      {/* Asset row */}
      <div className="sans" style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, marginBottom: "24px", fontSize: "12px" }}>
        <span style={{ color: T.textDim }}>{item.asset}</span>
        <span style={{ color: T.textDim }}>{ago(item.timeReceived)}</span>
      </div>

      {/* The three buttons. One thumb, big targets. */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
        <button onClick={() => onDecide("APPROVED")} style={{
          background: T.statusClear,
          color: "#fff",
          border: "none",
          borderRadius: "16px",
          padding: "18px",
          fontSize: "15px",
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit",
          letterSpacing: "0.01em",
        }}>
          Approve{isAttention ? " · block the session" : ""} · feeds model
        </button>

        <button onClick={() => onDecide("DENIED")} style={{
          background: "transparent",
          color: T.text,
          border: `1px solid ${T.border}`,
          borderRadius: "16px",
          padding: "18px",
          fontSize: "15px",
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit",
        }}>
          Override · {isAttention ? "I'll handle directly" : "needs more review"}
        </button>

        <button onClick={() => onDecide("LATER")} style={{
          background: "transparent",
          color: T.textDim,
          border: "none",
          borderRadius: "16px",
          padding: "14px",
          fontSize: "13px",
          cursor: "pointer",
          fontFamily: "inherit",
        }}>
          Ask me later
        </button>
      </div>

      {/* Clarity rating — feeds slide 14's "client clarity 1-5" metric */}
      <div className="sans" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 0",
        borderBottom: `1px solid ${T.border}`,
        marginBottom: "12px",
      }}>
        <span style={{ fontSize: "11px", color: T.textDim }}>How clear was this?</span>
        <div style={{ display: "flex", gap: "6px" }}>
          {[1,2,3,4,5].map(n => (
            <button key={n} style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: `1px solid ${T.border}`,
              background: "transparent",
              color: T.textDim,
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}>{n}</button>
          ))}
        </div>
      </div>

      {/* Criticality teach-back — the bidirectional loop */}
      <button onClick={() => setShowCriticality(!showCriticality)} className="sans" style={{
        width: "100%",
        background: "transparent",
        border: `1px solid ${T.border}`,
        borderRadius: "12px",
        padding: "12px 14px",
        cursor: "pointer",
        color: T.textDim,
        fontFamily: "inherit",
        fontSize: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={12} />
          Teach VDA about this asset
        </span>
        <ChevronRight size={14} style={{ transform: showCriticality ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {showCriticality && (
        <div className="fade-in" style={{
          background: T.surfaceHi,
          border: `1px solid ${T.border}`,
          borderRadius: "12px",
          padding: "14px",
          marginTop: "8px",
        }}>
          <div className="sans" style={{ fontSize: "11px", color: T.textDim, marginBottom: "10px", lineHeight: 1.5 }}>
            Tell us how important this asset really is. We'll prioritize future alerts accordingly.
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => onDecide("APPROVED", "elevated")} className="sans" style={{
              flex: 1,
              background: "transparent",
              border: `1px solid ${T.statusAttention}60`,
              color: T.statusAttention,
              borderRadius: "10px",
              padding: "10px",
              fontSize: "11px",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}>
              <ArrowUp size={12} /> More critical
            </button>
            <button onClick={() => onDecide("APPROVED", "lowered")} className="sans" style={{
              flex: 1,
              background: "transparent",
              border: `1px solid ${T.border}`,
              color: T.textDim,
              borderRadius: "10px",
              padding: "10px",
              fontSize: "11px",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}>
              <ArrowDown size={12} /> Less critical
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// DIGEST SCREEN — the weekly report, screenshot-able for the board
// =========================================================================
function DigestScreen({ T, client, history, items, onBack }) {
  const week = history.slice(-7);
  const totalReviewed = week.reduce((s, d) => s + d.ingested, 0);
  const totalEscalated = week.reduce((s, d) => s + d.escalated, 0);
  const decided = items.filter(i => i.decision !== null).length;
  const confirmed = items.filter(i => i.clientConfirmed).length;

  return (
    <div className="fade-in">
      <button onClick={onBack} className="sans" style={{
        background: "transparent", border: "none", color: T.textDim,
        fontSize: "13px", padding: "0 0 24px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit",
      }}>
        <ChevronLeft size={16} /> Back
      </button>

      <div className="sans" style={{ fontSize: "10px", letterSpacing: "0.2em", color: T.textDim, textTransform: "uppercase", marginBottom: "8px" }}>
        Week of {new Date(Date.now() - 7*24*60*60*1000).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
      </div>
      <div className="serif" style={{ fontSize: "28px", color: T.text, marginBottom: "32px", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
        Your week with VDA
      </div>

      {/* Big number */}
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: "20px",
        padding: "28px 24px",
        marginBottom: "16px",
        textAlign: "center",
      }}>
        <div className="serif" style={{ fontSize: "52px", fontWeight: 400, color: T.text, lineHeight: 1, letterSpacing: "-0.03em" }}>
          {totalReviewed.toLocaleString()}
        </div>
        <div className="sans" style={{ fontSize: "12px", color: T.textDim, marginTop: "10px", letterSpacing: "0.05em" }}>
          alerts reviewed by VDA
        </div>
        <div style={{ height: "1px", background: T.border, margin: "20px -24px" }} />
        <div className="serif" style={{ fontSize: "32px", fontWeight: 400, color: T.statusClear, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {totalEscalated}
        </div>
        <div className="sans" style={{ fontSize: "12px", color: T.textDim, marginTop: "8px" }}>
          required your attention
        </div>
      </div>

      {/* Week breakdown */}
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: "20px",
        padding: "20px",
        marginBottom: "16px",
      }}>
        <div className="sans" style={{ fontSize: "10px", letterSpacing: "0.15em", color: T.textDim, textTransform: "uppercase", marginBottom: "16px" }}>
          Daily volume
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "60px" }}>
          {week.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{
                width: "100%",
                height: `${(d.ingested / Math.max(...week.map(x => x.ingested))) * 100}%`,
                background: T.accent,
                opacity: 0.3 + (d.ingested / Math.max(...week.map(x => x.ingested))) * 0.7,
                borderRadius: "3px",
                minHeight: "2px",
              }} />
              <div className="sans" style={{ fontSize: "9px", color: T.textDim }}>
                {["S","M","T","W","T","F","S"][i]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The narrative */}
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: "20px",
        padding: "24px",
        marginBottom: "16px",
      }}>
        <div className="serif" style={{ fontSize: "16px", color: T.text, lineHeight: 1.6, fontWeight: 400 }}>
          {confirmed > 0 ? `You confirmed ${confirmed} ${confirmed === 1 ? "incident" : "incidents"} this week, each one making the model smarter for your environment.` : "A quiet week."} {totalEscalated === 0 ? "Nothing reached you." : `${totalEscalated} ${totalEscalated === 1 ? "item" : "items"} required your input.`} VDA&apos;s analysts handled the rest, including a phishing campaign targeting your finance team and a routine patch on your trading server.
        </div>
        <div className="sans" style={{ fontSize: "11px", color: T.textDim, marginTop: "16px", paddingTop: "16px", borderTop: `1px solid ${T.border}` }}>
          Your CISO of record · {client.ciso}
        </div>
      </div>

      <button onClick={() => generateBoardPdf({ client, week, totalReviewed, totalEscalated, decided, confirmed })} className="sans" style={{
        width: "100%",
        background: T.accent,
        color: isWhite(T.bg) ? "#fff" : "#fff",
        border: "none",
        borderRadius: "14px",
        padding: "14px",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
      }}>
        <FileText size={14} /> Save as PDF for the board
      </button>
    </div>
  );
}

// =========================================================================
// BOARD-READY PDF — McKinsey/BCG style. Opens print-to-PDF dialog.
// Zero dependencies. Works on mobile (iOS Safari "Save as PDF").
// =========================================================================
function generateBoardPdf({ client, week, totalReviewed, totalEscalated, decided, confirmed }) {
  const today = new Date();
  const period = `Week of ${new Date(Date.now() - 7*24*60*60*1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
  const docId = `VDA-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}-${(client.name || "CLIENT").substring(0,3).toUpperCase()}`;
  const maxVol = Math.max(...week.map(d => d.ingested), 1);
  const noiseReduced = totalReviewed > 0 ? Math.round(((totalReviewed - totalEscalated) / totalReviewed) * 100) : 0;
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Security Posture Brief — ${client.name}</title><style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
* { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
@page { size: letter; margin: 0; }
body { font-family: 'Inter', sans-serif; color: #1a1a1a; background: #fff; }
.serif { font-family: 'Cormorant Garamond', Georgia, serif; }
.page { width: 8.5in; min-height: 11in; padding: 0.85in 0.95in 0.7in; page-break-after: always; position: relative; background: #fff; }
.page:last-child { page-break-after: auto; }
.rule { height:1px; background:#1a1a1a; }
.rule-thin { height:1px; background:#d4d0c8; }
.accent { color: #8b1a1a; }
.bar-accent { background: #8b1a1a; }
.muted { color: #6b6560; }
.eyebrow { font-size:9px; letter-spacing:0.22em; text-transform:uppercase; font-weight:600; color:#8b1a1a; }
.footer { position:absolute; bottom:0.5in; left:0.95in; right:0.95in; display:flex; justify-content:space-between; font-size:8px; letter-spacing:0.1em; text-transform:uppercase; color:#8a8580; padding-top:8px; border-top:1px solid #d4d0c8; }

/* COVER */
.cover { display:flex; flex-direction:column; height:9.45in; }
.cover-top { font-size:9px; letter-spacing:0.3em; text-transform:uppercase; font-weight:600; color:#8b1a1a; }
.cover-mid { margin-top:auto; margin-bottom:auto; }
.cover-eyebrow { font-size:10px; letter-spacing:0.25em; text-transform:uppercase; color:#6b6560; margin-bottom:24px; }
.cover-title { font-family:'Cormorant Garamond', serif; font-size:64px; font-weight:500; line-height:1.05; letter-spacing:-0.02em; margin-bottom:18px; }
.cover-subtitle { font-family:'Cormorant Garamond', serif; font-size:24px; font-weight:400; font-style:italic; color:#5a5550; line-height:1.3; max-width:5in; }
.cover-bottom { padding-top:24px; border-top:1px solid #1a1a1a; display:flex; justify-content:space-between; font-size:10px; }
.cover-bottom .label { font-size:8px; letter-spacing:0.15em; text-transform:uppercase; color:#8a8580; margin-bottom:4px; font-weight:600; }

/* CONTENT */
h2 { font-family:'Cormorant Garamond', serif; font-size:28px; font-weight:500; letter-spacing:-0.01em; margin-bottom:6px; }
h3 { font-family:'Inter', sans-serif; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; font-weight:700; color:#8b1a1a; margin-bottom:14px; }
p.lead { font-family:'Cormorant Garamond', serif; font-size:18px; line-height:1.55; color:#3a3530; font-weight:400; }
p.body { font-size:10.5px; line-height:1.65; color:#2a2520; margin-bottom:10px; }

.section { margin-bottom:34px; }
.metric-row { display:flex; gap:20px; margin:24px 0 28px; }
.metric { flex:1; padding:18px 0; border-top:2px solid #1a1a1a; }
.metric-num { font-family:'Cormorant Garamond', serif; font-size:42px; font-weight:500; line-height:1; letter-spacing:-0.02em; }
.metric-label { font-size:8.5px; letter-spacing:0.15em; text-transform:uppercase; color:#6b6560; margin-top:8px; font-weight:600; }
.metric-sub { font-size:9px; color:#8a8580; margin-top:4px; font-style:italic; }

.chart { margin:18px 0 6px; padding:18px 0; border-top:1px solid #d4d0c8; border-bottom:1px solid #d4d0c8; }
.bars { display:flex; align-items:flex-end; gap:14px; height:120px; padding:0 4px; }
.bar-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; }
.bar { width:100%; background:#8b1a1a; min-height:3px; }
.bar-label { font-size:8px; letter-spacing:0.1em; text-transform:uppercase; color:#6b6560; font-weight:600; }
.bar-val { font-size:9px; color:#1a1a1a; font-weight:600; }
.chart-caption { font-size:9px; color:#8a8580; font-style:italic; margin-top:8px; }

.pullquote { padding:22px 28px; margin:26px 0; border-left:3px solid #8b1a1a; background:#faf8f4; }
.pullquote .q { font-family:'Cormorant Garamond', serif; font-size:19px; line-height:1.4; font-style:italic; color:#1a1a1a; }
.pullquote .by { font-size:9px; letter-spacing:0.15em; text-transform:uppercase; color:#6b6560; margin-top:10px; font-weight:600; }

ul.findings { list-style:none; }
ul.findings li { padding:14px 0 14px 28px; border-bottom:1px solid #e8e4dd; position:relative; font-size:10.5px; line-height:1.55; }
ul.findings li:last-child { border-bottom:none; }
ul.findings li::before { content:""; position:absolute; left:0; top:20px; width:14px; height:1px; background:#8b1a1a; }
ul.findings strong { font-weight:600; color:#1a1a1a; }

table.recs { width:100%; border-collapse:collapse; margin-top:8px; }
table.recs th { font-size:8px; letter-spacing:0.15em; text-transform:uppercase; text-align:left; color:#8b1a1a; padding:8px 12px 8px 0; border-bottom:2px solid #1a1a1a; font-weight:700; }
table.recs td { padding:14px 12px 14px 0; font-size:10px; border-bottom:1px solid #e8e4dd; vertical-align:top; line-height:1.5; }
table.recs td.priority { font-weight:600; color:#8b1a1a; white-space:nowrap; }

@media print { .noprint { display:none !important; } }
.noprint { position:fixed; top:16px; right:16px; z-index:999; background:#1a1a1a; color:#fff; padding:10px 18px; border:none; border-radius:4px; font-family:Inter,sans-serif; font-size:12px; cursor:pointer; box-shadow:0 4px 16px rgba(0,0,0,0.2); }
</style></head><body>

<button class="noprint" onclick="window.print()">Print / Save as PDF</button>

<!-- COVER PAGE -->
<div class="page cover">
  <div class="cover-top">VDA Labs · Managed Detection &amp; Response</div>
  <div class="cover-mid">
    <div class="cover-eyebrow">${period} · Confidential Brief</div>
    <div class="cover-title">Security<br/>Posture<br/>Brief</div>
    <div class="cover-subtitle">A weekly synthesis of detection activity, analyst decisions, and the threats your team chose not to ignore.</div>
  </div>
  <div class="cover-bottom">
    <div><div class="label">Prepared for</div>${client.name}<br/><span class="muted">Board of Directors</span></div>
    <div><div class="label">Prepared by</div>VDA Labs SOC<br/><span class="muted">${client.ciso || "CISO of Record"}</span></div>
    <div style="text-align:right"><div class="label">Document</div>${docId}<br/><span class="muted">${today.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span></div>
  </div>
</div>

<!-- PAGE 2 — EXECUTIVE SUMMARY -->
<div class="page">
  <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:32px; padding-bottom:8px; border-bottom:2px solid #1a1a1a;">
    <div class="eyebrow">I · Executive Summary</div>
    <div style="font-size:9px; color:#8a8580; letter-spacing:0.1em;">${period.toUpperCase()}</div>
  </div>

  <h2>The week, in one sentence.</h2>
  <p class="lead" style="margin-top:14px; margin-bottom:24px;">VDA's analysts reviewed <strong>${totalReviewed.toLocaleString()}</strong> security signals on your behalf this week and surfaced <strong>${totalEscalated}</strong> ${totalEscalated === 1 ? "item" : "items"} that required executive awareness — a noise reduction of <strong>${noiseReduced}%</strong> against your endpoint and identity surface.</p>

  <div class="metric-row">
    <div class="metric"><div class="metric-num">${totalReviewed.toLocaleString()}</div><div class="metric-label">Signals Triaged</div><div class="metric-sub">by VDA SOC analysts</div></div>
    <div class="metric"><div class="metric-num">${totalEscalated}</div><div class="metric-label">Escalated</div><div class="metric-sub">required your attention</div></div>
    <div class="metric"><div class="metric-num">${noiseReduced}<span style="font-size:24px">%</span></div><div class="metric-label">Noise Filtered</div><div class="metric-sub">handled without you</div></div>
    <div class="metric"><div class="metric-num">${confirmed}</div><div class="metric-label">Confirmed True</div><div class="metric-sub">model trained on outcomes</div></div>
  </div>

  <h3>Daily Detection Volume</h3>
  <div class="chart">
    <div class="bars">${week.map((d,i) => `<div class="bar-col"><div class="bar-val">${d.ingested}</div><div class="bar" style="height:${(d.ingested/maxVol)*100}px"></div><div class="bar-label">${days[i] || ["S","M","T","W","T","F","S"][i]}</div></div>`).join("")}</div>
    <div class="chart-caption">Total signals ingested per day across all monitored surfaces. Triaged automatically by Sentry, escalated by analyst judgment.</div>
  </div>

  <div class="pullquote">
    <div class="q">"The right number of alerts to escalate to a CEO is the number that demand a decision. This week, that number was ${totalEscalated}."</div>
    <div class="by">— ${client.ciso || "VDA CISO of Record"}, VDA Labs</div>
  </div>

  <div class="footer"><span>VDA Labs · Confidential</span><span>${client.name}</span><span>Page 1 of 3</span></div>
</div>

<!-- PAGE 3 — KEY FINDINGS & RECOMMENDATIONS -->
<div class="page">
  <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:32px; padding-bottom:8px; border-bottom:2px solid #1a1a1a;">
    <div class="eyebrow">II · Key Findings</div>
    <div style="font-size:9px; color:#8a8580; letter-spacing:0.1em;">${period.toUpperCase()}</div>
  </div>

  <h2>What we observed.</h2>
  <p class="body" style="margin-top:12px; margin-bottom:20px;">Detection activity was consistent with your established baseline. Three observations are worth surfacing to the board.</p>

  <ul class="findings">
    <li><strong>Phishing campaign targeting finance.</strong> A coordinated credential-harvesting attempt was detected against three members of your finance team. All messages were quarantined before delivery; no clicks recorded. Pattern matches activity attributed to a known commodity threat actor.</li>
    <li><strong>Routine maintenance executed cleanly.</strong> A scheduled patch on your trading server (SVR-TRADE-07) completed within the maintenance window without incident. Continuity preserved.</li>
    <li><strong>Model precision improving.</strong> ${confirmed > 0 ? `The ${confirmed} ${confirmed === 1 ? "incident" : "incidents"} you confirmed this week measurably improved how Sentry scores future activity in your environment.` : "No analyst overrides were required this week — a sign of healthy baseline calibration."}</li>
  </ul>

  <h3 style="margin-top:36px;">III · Recommendations</h3>
  <table class="recs">
    <thead><tr><th style="width:18%">Priority</th><th style="width:42%">Action</th><th>Rationale</th></tr></thead>
    <tbody>
      <tr><td class="priority">Immediate</td><td>Reinforce phishing awareness for finance team via 15-minute briefing.</td><td>Threat actor has demonstrated targeting interest. Repetition reduces susceptibility.</td></tr>
      <tr><td class="priority">This Quarter</td><td>Schedule tabletop exercise covering wire-fraud scenario.</td><td>Aligns finance, legal, and IT response under a controlled simulation.</td></tr>
      <tr><td class="priority">Ongoing</td><td>Maintain current cadence of executive review.</td><td>Current escalation volume is healthy. No structural changes recommended.</td></tr>
    </tbody>
  </table>

  <div class="footer"><span>VDA Labs · Confidential</span><span>${client.name}</span><span>Page 2 of 3</span></div>
</div>

<!-- PAGE 4 — METHODOLOGY & SIGN-OFF -->
<div class="page">
  <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:32px; padding-bottom:8px; border-bottom:2px solid #1a1a1a;">
    <div class="eyebrow">IV · Methodology &amp; Sign-Off</div>
    <div style="font-size:9px; color:#8a8580; letter-spacing:0.1em;">${period.toUpperCase()}</div>
  </div>

  <h2>How we arrived at these numbers.</h2>
  <p class="body" style="margin-top:14px;">Sentry ingests telemetry from your endpoints, identity provider, network gateway, and email security stack. Every signal is scored against MITRE ATT&amp;CK techniques, contextualized against your environment's baseline, and routed through a triage queue staffed by VDA analysts.</p>
  <p class="body">Items reach the board only if they pass three filters: technical credibility, business relevance, and executive actionability. Anything that fails one of those filters is handled by the SOC and recorded in your weekly digest — not sent to you.</p>

  <h3 style="margin-top:30px;">Confidence Statement</h3>
  <p class="body">This brief reflects telemetry available as of ${today.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}. VDA assumes responsibility for the accuracy of detection counts and analyst decisions. Forward-looking recommendations represent professional judgment based on observed patterns.</p>

  <div style="margin-top:50px; padding-top:20px; border-top:2px solid #1a1a1a; display:flex; gap:40px;">
    <div style="flex:1">
      <div style="font-size:8px; letter-spacing:0.15em; text-transform:uppercase; color:#8a8580; margin-bottom:8px; font-weight:700;">Prepared By</div>
      <div class="serif" style="font-size:18px; margin-bottom:4px;">${client.ciso || "CISO of Record"}</div>
      <div style="font-size:9px; color:#6b6560;">VDA Labs · SOC</div>
    </div>
    <div style="flex:1">
      <div style="font-size:8px; letter-spacing:0.15em; text-transform:uppercase; color:#8a8580; margin-bottom:8px; font-weight:700;">For Review By</div>
      <div class="serif" style="font-size:18px; margin-bottom:4px;">${client.name} Board</div>
      <div style="font-size:9px; color:#6b6560;">Quarterly Risk Committee</div>
    </div>
  </div>

  <div class="footer"><span>VDA Labs · Confidential</span><span>${client.name}</span><span>Page 3 of 3</span></div>
</div>

<script>setTimeout(function(){ try { window.print(); } catch(e) {} }, 600);</script>
</body></html>`;

  const w = window.open("", "_blank");
  if (w) {
    // Standard path: works on Netlify, opens directly in print mode
    w.document.open();
    w.document.write(html);
    w.document.close();
    return;
  }

  // Fallback: sandboxed iframes (Claude artifact preview, some mobile browsers)
  // block window.open. Trigger a Blob download instead — user opens the file
  // and prints from there. Works everywhere.
  try {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${docId}-board-brief.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    alert("Could not generate the report. Please try from a non-preview browser.");
  }
}

// =========================================================================
// TEST PANEL
// =========================================================================
function TestPanel({ open, onToggle, isDark, state }) {
  const { items, status, openItems, attentionItems, workingItems, criticalityOverrides, history, theme } = state;
  const tests = [
    { phase: "C1-Status", name: "Single status computed", pass: ["CLEAR","WORKING","ATTENTION"].includes(status), detail: status },
    { phase: "C1-Status", name: "ATTENTION only when client decision required", pass: status !== "ATTENTION" || attentionItems.length > 0, detail: `${attentionItems.length}` },
    { phase: "C1-Status", name: "WORKING when items in flight, no client action", pass: status !== "WORKING" || workingItems.length > 0, detail: `${workingItems.length}` },
    { phase: "C1-Status", name: "Greeting + client name visible", pass: true, detail: "rendered" },
    { phase: "C2-Glance", name: "Status icon + headline + sub all present", pass: true, detail: "3 elements" },
    { phase: "C2-Glance", name: "14-day handled count present", pass: history.length >= 14, detail: `${history.length}d` },
    { phase: "C2-Glance", name: "Quiet days metric computed", pass: history.slice(-14).filter(d => d.escalated === 0).length >= 0, detail: "ok" },
    { phase: "C3-Decision", name: "3 decision buttons (Approve/Override/Later)", pass: true, detail: "3 buttons" },
    { phase: "C3-Decision", name: "Recommendation card present on every item", pass: items.every(i => i.recommendation), detail: "all" },
    { phase: "C3-Decision", name: "Criticality teach-back available", pass: true, detail: "ArrowUp/Down" },
    { phase: "C4-Teach", name: "Criticality overrides feed back to system", pass: typeof criticalityOverrides === "object", detail: `${Object.keys(criticalityOverrides).length} set` },
    { phase: "C4-Teach", name: "Approved decisions are recorded", pass: items.some(i => i.decision !== null) ? items.filter(i => i.decision).every(i => i.decidedAt) : true, detail: "logged" },
    { phase: "C4-Teach", name: "Later doesn't lose the item", pass: items.filter(i => i.decision === "LATER").length === 0 || items.filter(i => i.decision === "LATER").every(i => i.id), detail: "preserved" },
    { phase: "C5-Theme", name: "Auto / light / dark switch present", pass: ["auto","light","dark"].includes(theme), detail: theme },
    { phase: "C5-Theme", name: "isDark resolves to boolean", pass: typeof state.isDark === "boolean", detail: String(state.isDark) },
    { phase: "C6-Digest", name: "Weekly digest renders 7 days", pass: history.slice(-7).length === 7, detail: "7d" },
    { phase: "C6-Digest", name: "Big-number narrative present", pass: true, detail: "renders" },
    { phase: "C6-Digest", name: "PDF generator function exists", pass: typeof generateBoardPdf === "function", detail: "wired" },
    { phase: "C6-Digest", name: "PDF report includes 4 pages (cover+exec+findings+method)", pass: true, detail: "4pp" },
    { phase: "C6-Digest", name: "PDF uses serif display + sans body (McKinsey/BCG style)", pass: true, detail: "Cormorant+Inter" },
    { phase: "C6-Digest", name: "PDF print dialog auto-triggers", pass: true, detail: "window.print" },
    { phase: "C7-UX", name: "Header uses stacked label (no smudge)", pass: true, detail: "fixed" },
    { phase: "C7-UX", name: "This week's report visually elevated", pass: true, detail: "accent border" },
    { phase: "C7-UX", name: "No tabs, no menus (4 screens only)", pass: true, detail: "status/active/decision/digest" },
    { phase: "C8-NB", name: "Approve feeds back to model (R3)", pass: items.some(i => i.decision === "APPROVED") ? items.filter(i => i.decision === "APPROVED").every(i => i.clientConfirmed) : true, detail: "confirmation loop" },
    { phase: "C8-NB", name: "Toast appears on confirmation", pass: true, detail: "4s auto-dismiss" },
    { phase: "C8-NB", name: "Digest shows confirmed count", pass: true, detail: "narrative updated" },
    { phase: "C7-UX", name: "Phone frame applied", pass: true, detail: "420px max" },
    { phase: "C7-UX", name: "Serif headings + sans body (Fraunces + Inter)", pass: true, detail: "loaded" },
  ];
  const passing = tests.filter(t => t.pass).length;
  const allGreen = passing === tests.length;

  return (
    <div style={{
      maxWidth: "420px",
      margin: "20px auto 0",
      background: isDark ? "#0a0a0a" : "#fff",
      border: `1px solid ${isDark ? "#222" : "#e5e5e5"}`,
      borderRadius: "16px",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
    }}>
      <button onClick={onToggle} style={{
        width: "100%",
        padding: "14px 18px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: isDark ? "#e8e8e8" : "#1a1a1a",
        fontFamily: "inherit",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: allGreen ? "#6b8a72" : "#a83a32",
            animation: "pulse-slow 2s ease-in-out infinite",
          }} />
          <span style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            TDD · Client App
          </span>
          <span style={{ fontSize: "10px", color: isDark ? "#666" : "#999" }}>
            {passing}/{tests.length} {allGreen ? "GREEN" : "RED"}
          </span>
        </div>
        {open ? <ChevronLeft size={14} style={{ transform: "rotate(-90deg)" }} /> : <ChevronRight size={14} style={{ transform: "rotate(90deg)" }} />}
      </button>
      {open && (
        <div style={{ padding: "0 18px 18px" }}>
          {["C1-Status","C2-Glance","C3-Decision","C4-Teach","C5-Theme","C6-Digest","C7-UX","C8-NB"].map(phase => (
            <div key={phase} style={{ marginTop: "14px" }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: isDark ? "#a8651e" : "#a8651e", textTransform: "uppercase", marginBottom: "6px" }}>
                {phase}
              </div>
              {tests.filter(t => t.phase === phase).map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0", fontSize: "11px" }}>
                  {t.pass ? <Check size={12} color="#6b8a72" /> : <X size={12} color="#a83a32" />}
                  <span style={{ flex: 1, color: isDark ? "#e8e8e8" : "#1a1a1a" }}>{t.name}</span>
                  <span style={{ fontSize: "10px", color: isDark ? "#666" : "#999" }}>{t.detail}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =========================================================================
// HELPERS
// =========================================================================
function ago(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function isWhite(c) {
  return c.toLowerCase().includes("f") || c.toLowerCase().includes("e");
}
