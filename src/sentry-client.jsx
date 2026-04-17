// Sentry Client v4 — React/JSX
// VDA Labs × 3Nails Infosec
// Features: response timeline, SLA badge, animated noted pill,
// BCG "The Take" banner, mobile-scaled inline PDF report preview.

import React, { useState, useEffect, useRef } from "react";

// ============================================================================
// CLIENT CONTEXT + DATA
// ============================================================================
const CLIENT = {
  name: "Aspen Holdings",
  industry: "Financial Services",
  contact: "Jordan Mauriello",
  ciso: "T. Reeves",
};

const initialItems = [
  {
    id: "I-001",
    severity: "ATTENTION",
    title: "Unusual login from new country",
    headline: "Someone signed into your CFO's email from Lagos, Nigeria 14 minutes ago.",
    context: "VDA's analysts checked: this isn't on Tom's typical travel pattern. We've temporarily blocked the session and want your call before reaching out to him directly.",
    recommendation: "Approve the block and we'll call Tom now to verify.",
    asset: "Tom Webb · CFO · O365 mailbox",
    handledBy: "T. Reeves",
    timeReceived: Date.now() - 14 * 60 * 1000,
    requiresClient: true,
    decision: null,
    sla: "15 min",
    slaRemaining: "12 min",
    timeline: [
      { label: "Suspicious login detected", meta: "14 min ago", status: "done" },
      { label: "Session isolated by VDA", meta: "12 min ago · T. Reeves", status: "done" },
      { label: "Account placed on hold", meta: "12 min ago", status: "done" },
      { label: "Threat intel cross-reference complete", meta: "8 min ago · matched 3 related events", status: "done" },
      { label: "Awaiting your decision", meta: "SLA: call Tom within 15 min of approval", status: "current" },
    ],
  },
  {
    id: "I-002",
    severity: "WORKING",
    title: "Phishing campaign targeting finance team",
    headline: "5 phishing emails impersonating your bank were caught before delivery.",
    context: "Standard campaign, no one clicked. We're updating the rule so future variants are blocked automatically.",
    recommendation: "No action needed. We'll include this in your weekly digest.",
    asset: "Email gateway · 5 messages",
    handledBy: "M. Chen",
    timeReceived: Date.now() - 2 * 60 * 60 * 1000,
    requiresClient: false,
    decision: null,
    sla: "informational",
    timeline: [
      { label: "Phishing pattern detected", meta: "2h ago", status: "done" },
      { label: "Messages quarantined pre-delivery", meta: "2h ago · auto-response", status: "done" },
      { label: "Sender reputation updated", meta: "1h 50m ago", status: "done" },
      { label: "Detection rule tuned", meta: "30m ago · M. Chen", status: "done" },
      { label: "Included in weekly digest", meta: "no further action", status: "current" },
    ],
  },
  {
    id: "I-003",
    severity: "WORKING",
    title: "Patch deployed to trading server",
    headline: "Critical security patch applied to SVR-TRADE-07 during maintenance window.",
    context: "Routine. Server back online, all checks green.",
    recommendation: "FYI only.",
    asset: "SVR-TRADE-07",
    handledBy: "T. Reeves",
    timeReceived: Date.now() - 5 * 60 * 60 * 1000,
    requiresClient: false,
    decision: null,
    sla: "informational",
    timeline: [
      { label: "Patch release scheduled", meta: "yesterday 6:00 PM", status: "done" },
      { label: "Pre-deployment snapshot taken", meta: "5h ago", status: "done" },
      { label: "Patch applied in maintenance window", meta: "5h ago · T. Reeves", status: "done" },
      { label: "Post-patch health checks green", meta: "4h 30m ago", status: "done" },
      { label: "Closed · recorded in digest", meta: "no further action", status: "current" },
    ],
  },
];

function buildHistory() {
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const days = [];
  for (let i = 0; i < 30; i++) {
    days.push({
      ingested: Math.floor(800 + rand() * 600),
      escalated: Math.floor(rand() * 3),
    });
  }
  return days;
}

// ============================================================================
// THEME TOKENS — single object, no CSS vars needed (React handles it)
// ============================================================================
const lightTokens = {
  bg: "#fbfaf7",
  bodyBg: "#e8e6e0",
  surface: "#ffffff",
  surfaceHi: "#f4f1eb",
  text: "#1a1816",
  textDim: "#7a756d",
  textMid: "#5a5550",
  border: "rgba(0,0,0,0.06)",
  borderStrong: "rgba(0,0,0,0.12)",
  brand: "#c83e00",
  brandDim: "rgba(200, 62, 0, 0.06)",
  brandEdge: "rgba(200, 62, 0, 0.25)",
  onBrand: "#ffffff",
  statusClear: "#4a6b54",
  statusWorking: "#a8651e",
  statusAttention: "#a83a32",
  statusClearDim: "rgba(74, 107, 84, 0.08)",
  statusWorkingDim: "rgba(168, 101, 30, 0.08)",
  statusAttentionDim: "rgba(168, 58, 50, 0.08)",
  phoneShadow: "0 30px 80px rgba(0,0,0,0.18), 0 0 0 8px #fafaf7, 0 0 0 9px #d8d4cc",
  brandGrad: "linear-gradient(135deg, rgba(200,62,0,0.10) 0%, rgba(200,62,0,0.02) 100%)",
  teachGrad: "linear-gradient(135deg, rgba(200,62,0,0.08) 0%, rgba(200,62,0,0.02) 100%)",
  timelineGrad: "linear-gradient(135deg, rgba(74,107,84,0.06) 0%, rgba(74,107,84,0.02) 100%)",
  slaBorder: "rgba(74,107,84,0.3)",
  timelineBorder: "rgba(74,107,84,0.25)",
};

const darkTokens = {
  bg: "#0e0f10",
  bodyBg: "#050505",
  surface: "#16181a",
  surfaceHi: "#1d1f22",
  text: "#f5f3ee",
  textDim: "#8a8680",
  textMid: "#a8a49d",
  border: "rgba(255,255,255,0.06)",
  borderStrong: "rgba(255,255,255,0.12)",
  brand: "#ff5722",
  brandDim: "rgba(255, 87, 34, 0.12)",
  brandEdge: "rgba(255, 87, 34, 0.35)",
  onBrand: "#ffffff",
  statusClear: "#9bb5a3",
  statusWorking: "#d4a574",
  statusAttention: "#c95850",
  statusClearDim: "rgba(155, 181, 163, 0.12)",
  statusWorkingDim: "rgba(212, 165, 116, 0.12)",
  statusAttentionDim: "rgba(201, 88, 80, 0.12)",
  phoneShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 8px #18181a, 0 0 0 9px #2a2a2c",
  brandGrad: "linear-gradient(135deg, rgba(255,87,34,0.15) 0%, rgba(255,87,34,0.05) 100%)",
  teachGrad: "linear-gradient(135deg, rgba(255,87,34,0.14) 0%, rgba(255,87,34,0.04) 100%)",
  timelineGrad: "linear-gradient(135deg, rgba(155,181,163,0.08) 0%, rgba(155,181,163,0.02) 100%)",
  slaBorder: "rgba(155,181,163,0.3)",
  timelineBorder: "rgba(155,181,163,0.25)",
};

// ============================================================================
// ICONS — inline SVG (Lucide style)
// ============================================================================
const Icon = ({ name, size = 16, style = {} }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { flexShrink: 0, ...style },
  };
  switch (name) {
    case "checkCircle":
      return (
        <svg {...common}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case "loader":
      return (
        <svg {...common} style={{ ...common.style, animation: "sentry-spin 8s linear infinite" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    case "chevronR":
      return (
        <svg {...common}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      );
    case "chevronL":
      return (
        <svg {...common}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "arrowUp":
      return (
        <svg {...common} strokeWidth={2.2}>
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      );
    case "arrowDown":
      return (
        <svg {...common} strokeWidth={2.2}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
      );
    case "check":
      return (
        <svg {...common} strokeWidth={2.5}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "checkSm":
      return (
        <svg {...common} strokeWidth={3}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "file":
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case "printer":
      return (
        <svg {...common}>
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      );
    case "download":
      return (
        <svg {...common}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      );
    case "activity":
      return (
        <svg {...common}>
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    default:
      return null;
  }
};

// ============================================================================
// UTILITIES
// ============================================================================
function ago(ts) {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  return Math.floor(h / 24) + "d ago";
}

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function Sparkline({ values, color, width = 100, height = 32 }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${height} ${pts} ${width},${height}`;
  const gradId = `sg-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================================
// GLOBAL ANIMATIONS + FONT INJECTION (runs once on mount)
// ============================================================================
const GLOBAL_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&display=swap');
@keyframes sentry-spin { to { transform: rotate(360deg); } }
@keyframes sentry-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
@keyframes sentry-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes sentry-scale-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
@keyframes sentry-slide-up { from { transform: translateY(100%); opacity: 0.7; } to { transform: translateY(0); opacity: 1; } }
@keyframes sentry-noted-pop {
  0% { transform: translateX(-50%) translateY(10px) scale(0.9); opacity: 0; }
  20% { transform: translateX(-50%) translateY(0) scale(1.05); opacity: 1; }
  35% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
  80% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
  100% { transform: translateX(-50%) translateY(-8px) scale(0.95); opacity: 0; }
}
@keyframes sentry-sla-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(74,107,84, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(74,107,84, 0); }
}
@media print {
  body > div > div:not(.sentry-report-overlay) { display: none !important; }
  .sentry-report-overlay { position: static !important; background: white !important; }
  .sentry-report-toolbar { display: none !important; }
  .sentry-report-stage { background: white !important; padding: 0 !important; }
  .sentry-report-scale-outer, .sentry-report-scale, .sentry-report-scale-inner {
    transform: none !important;
    width: 100% !important;
    height: auto !important;
  }
  .sentry-report-page {
    margin: 0 !important;
    box-shadow: none !important;
    page-break-after: always;
    width: 100% !important;
    height: auto !important;
    transform: none !important;
  }
  .sentry-report-page:last-child { page-break-after: auto; }
}
`;

function useGlobalStyles() {
  useEffect(() => {
    const id = "sentry-client-global-styles";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.innerHTML = GLOBAL_STYLES;
    document.head.appendChild(el);
  }, []);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function SentryClient() {
  useGlobalStyles();

  const [items, setItems] = useState(() => JSON.parse(JSON.stringify(initialItems)));
  const [screen, setScreen] = useState("status");
  const [activeItemId, setActiveItemId] = useState(null);
  const [theme, setTheme] = useState("light");
  const [history] = useState(() => buildHistory());
  const [criticalityChoice, setCriticalityChoice] = useState(null);
  const [clarityRating, setClarityRating] = useState(null);
  const [showNotedAck, setShowNotedAck] = useState(false);
  const [toast, setToast] = useState(null);
  const [clock, setClock] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportScale, setReportScale] = useState(1);
  const [reportScaledSize, setReportScaledSize] = useState({ width: 850, height: 1100 * 3 });

  // Resolve tokens
  const isDark =
    theme === "dark" ||
    (theme === "auto" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const T = isDark ? darkTokens : lightTokens;

  // Clock tick
  useEffect(() => {
    const tick = () => {
      setClock(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  // Body bg follows theme
  useEffect(() => {
    document.body.style.background = T.bodyBg;
    document.body.style.transition = "background 0.4s ease";
  }, [T.bodyBg]);

  // Report scale logic (mobile fit)
  useEffect(() => {
    if (!reportOpen) return;
    const recalc = () => {
      const vw = window.innerWidth;
      const reportW = 850;
      const reportH = (reportW * 11) / 8.5;
      const pages = 4; // cover, exec, findings, methodology
      const gap = 24;
      const totalH = reportH * pages + gap * (pages - 1);
      const available = vw - 40;
      const s = Math.min(1, available / reportW);
      setReportScale(s);
      setReportScaledSize({ width: reportW * s, height: totalH * s });
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [reportOpen]);

  // Noted ack auto-dismiss
  useEffect(() => {
    if (!showNotedAck) return;
    const id = setTimeout(() => setShowNotedAck(false), 2400);
    return () => clearTimeout(id);
  }, [showNotedAck]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  // --- derived ---
  const openItems = items.filter((i) => i.decision === null);
  const attention = openItems.filter((i) => i.requiresClient);
  const working = openItems.filter((i) => !i.requiresClient);
  const status = attention.length > 0 ? "ATTENTION" : working.length > 0 ? "WORKING" : "CLEAR";

  // --- handlers ---
  const goto = (s) => {
    if (s !== "decision") {
      setActiveItemId(null);
      setCriticalityChoice(null);
      setClarityRating(null);
      setShowNotedAck(false);
    }
    setScreen(s);
  };

  const openItem = (id) => {
    setActiveItemId(id);
    setCriticalityChoice(null);
    setClarityRating(null);
    setShowNotedAck(false);
    setScreen("decision");
  };

  const setCriticality = (val) => {
    const isNew = criticalityChoice !== val;
    setCriticalityChoice(isNew ? val : null);
    if (isNew) setShowNotedAck(true);
  };

  const decide = (decision) => {
    const item = items.find((i) => i.id === activeItemId);
    if (!item) return;
    const next = items.map((i) =>
      i.id === activeItemId
        ? { ...i, decision, decidedAt: Date.now(), clientConfirmed: decision === "APPROVED" }
        : i,
    );
    setItems(next);
    if (decision === "APPROVED") {
      setToast("Your confirmation improved detection for this pattern across your environment.");
    }
    setActiveItemId(null);
    setCriticalityChoice(null);
    setClarityRating(null);
    setShowNotedAck(false);
    setScreen("status");
  };

  const openReport = () => setReportOpen(true);
  const closeReport = () => setReportOpen(false);

  const downloadReport = () => {
    const today = new Date();
    const docId = `VDA-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${CLIENT.name.substring(0, 3).toUpperCase()}`;
    const reportEl = document.querySelector(".sentry-report-pages");
    if (!reportEl) return;
    const reportHtml = reportEl.outerHTML;
    const styles = Array.from(document.querySelectorAll("style"))
      .map((s) => s.outerHTML)
      .join("");
    const fonts = `<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet">`;
    const extraCss = `<style>body{background:#e8e6e0;padding:20px;margin:0;display:flex;justify-content:center;} .dl-wrapper{width:850px;max-width:100%;} .print-btn{position:fixed;top:20px;right:20px;z-index:999;background:#1a1a1a;color:#fff;border:none;padding:12px 20px;border-radius:6px;font-family:Inter,sans-serif;font-size:13px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.2);} @media print{.print-btn{display:none;}body{background:#fff;padding:0;display:block;}.dl-wrapper{width:100%;}.sentry-report-page{box-shadow:none !important;margin:0 !important;transform:none !important;width:100% !important;height:auto !important;}}</style>`;
    const standalone = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${CLIENT.name} · Security Posture Brief</title>${fonts}${styles}${extraCss}</head><body><button class="print-btn" onclick="window.print()">Print / Save as PDF</button><div class="dl-wrapper">${reportHtml}</div></body></html>`;
    try {
      const blob = new Blob([standalone], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docId}-board-brief.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      alert("Download failed. Use the Print button instead.");
    }
  };

  // ==========================================================================
  // STYLES (as JS objects, no CSS-in-JS lib needed)
  // ==========================================================================
  const S = buildStyles(T);

  // ==========================================================================
  // SCREENS
  // ==========================================================================
  const renderStatus = () => {
    const recent = history.slice(-14);
    const reviewed = recent.reduce((s, d) => s + d.ingested, 0);
    const escalated = recent.reduce((s, d) => s + d.escalated, 0);
    const handled = reviewed - escalated;
    const quiet = recent.filter((d) => d.escalated === 0).length;

    const cfg = {
      CLEAR: {
        color: T.statusClear,
        dim: T.statusClearDim,
        iconName: "checkCircle",
        headline: "All clear",
        sub: "VDA is monitoring. Nothing needs you right now.",
      },
      WORKING: {
        color: T.statusWorking,
        dim: T.statusWorkingDim,
        iconName: "loader",
        headline: "We're on it",
        sub: `${working.length} ${working.length === 1 ? "item" : "items"} being handled. No action needed.`,
      },
      ATTENTION: {
        color: T.statusAttention,
        dim: T.statusAttentionDim,
        iconName: "alert",
        headline: "Your attention",
        sub: `${attention.length} ${attention.length === 1 ? "decision" : "decisions"} only you can make.`,
      },
    }[status];

    return (
      <div style={{ animation: "sentry-fade-in 0.4s ease-out" }}>
        <div style={S.greeting}>Good {greet()}, {CLIENT.contact.split(" ")[0]}</div>
        <div style={S.clientName}>{CLIENT.name}</div>

        <div style={{ ...S.card, ...S.cardLg, position: "relative", overflow: "hidden", animation: "sentry-scale-in 0.3s ease-out" }}>
          <div style={{ position: "absolute", top: "-40%", right: "-20%", width: 240, height: 240, opacity: 0.08, filter: "blur(80px)", borderRadius: "50%", pointerEvents: "none", background: cfg.color }} />
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, background: cfg.dim, border: `1px solid ${cfg.color}30`, color: cfg.color }}>
              <Icon name={cfg.iconName} size={32} />
            </div>
            <div style={S.statusHeadline}>{cfg.headline}</div>
            <div style={S.statusSub}>{cfg.sub}</div>
          </div>
        </div>

        {attention.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {attention.map((item) => (
              <button key={item.id} onClick={() => openItem(item.id)} style={{ ...S.itemBtn, border: `1px solid ${isDark ? "rgba(201,88,80,0.4)" : "rgba(168,58,50,0.4)"}` }}>
                <div style={{ ...S.eyebrow, color: T.statusAttention, fontWeight: 700, marginBottom: 8 }}>
                  Needs your decision · SLA {item.sla}
                </div>
                <div style={S.itemTitle}>{item.title}</div>
                <div style={S.itemBody}>{item.headline}</div>
                <div style={S.itemMeta}>
                  <span style={S.metaMono}>{ago(item.timeReceived)}</span>
                  <span style={{ color: T.statusAttention }}><Icon name="chevronR" size={16} /></span>
                </div>
              </button>
            ))}
          </div>
        )}

        {working.length > 0 && (
          <button onClick={() => goto("active")} style={S.workingSummary}>
            <div>
              <div style={{ ...S.eyebrow, marginBottom: 4 }}>VDA is handling</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: T.text }}>
                {working.length} {working.length === 1 ? "item" : "items"} in progress
              </div>
            </div>
            <span style={{ color: T.textDim }}><Icon name="chevronR" size={16} /></span>
          </button>
        )}

        <div style={S.card}>
          <div style={{ ...S.eyebrow, marginBottom: 12 }}>Last 14 days</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
            <div>
              <div style={S.statBig}>{handled.toLocaleString()}</div>
              <div style={S.statLabel}>alerts handled without you</div>
            </div>
            <Sparkline values={recent.map((d) => d.ingested)} color={T.brand} />
          </div>
          <div style={S.divider} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            {[
              { label: "Reviewed", val: reviewed.toLocaleString() },
              { label: "Escalated", val: escalated },
              { label: "Quiet days", val: quiet },
            ].map((m) => (
              <div key={m.label}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.textDim, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>{m.label}</div>
                <div style={{ color: T.text, fontWeight: 500, marginTop: 3, fontSize: 13 }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => goto("digest")} style={S.reportCta}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ ...S.reportCtaIcon, color: T.brand }}><Icon name="calendar" size={16} /></div>
            <div style={{ textAlign: "left", lineHeight: 1.3 }}>
              <div style={{ ...S.eyebrow, color: T.brand, fontWeight: 700, letterSpacing: "0.22em", marginBottom: 2 }}>New · Ready</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: T.text, letterSpacing: "-0.005em" }}>This week's report</div>
            </div>
          </div>
          <span style={{ color: T.brand }}><Icon name="chevronR" size={16} /></span>
        </button>
      </div>
    );
  };

  const renderActive = () => (
    <div style={{ animation: "sentry-fade-in 0.4s ease-out" }}>
      <button onClick={() => goto("status")} style={S.btnBack}>
        <Icon name="chevronL" size={14} /> Back
      </button>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: T.text, marginBottom: 8, letterSpacing: "-0.01em" }}>
        Active items
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.textDim, marginBottom: 28, letterSpacing: "0.08em" }}>
        {openItems.length} {openItems.length === 1 ? "ITEM" : "ITEMS"} IN PROGRESS
      </div>
      {openItems.map((item) => {
        const isAttn = item.requiresClient;
        const accent = isAttn ? T.statusAttention : T.statusWorking;
        return (
          <button key={item.id} onClick={() => openItem(item.id)} style={{
            ...S.itemBtn,
            borderLeft: `3px solid ${accent}`,
          }}>
            <div style={{ ...S.eyebrow, color: accent, fontWeight: 700, marginBottom: 8 }}>
              {isAttn ? `Needs decision · SLA ${item.sla}` : "Handling"}
            </div>
            <div style={{ ...S.itemTitle, fontSize: 16 }}>{item.title}</div>
            <div style={{ ...S.itemBody, fontSize: 12 }}>{item.headline}</div>
            <div style={S.itemMeta}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: T.textDim }}>by {item.handledBy}</span>
              <span style={S.metaMono}>{ago(item.timeReceived)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderDecision = () => {
    const item = items.find((i) => i.id === activeItemId);
    if (!item) return renderStatus();
    const needsDecision = item.requiresClient;
    const accent = needsDecision ? T.statusAttention : T.statusWorking;

    return (
      <div style={{ animation: "sentry-fade-in 0.4s ease-out" }}>
        <button onClick={() => goto("active")} style={S.btnBack}>
          <Icon name="chevronL" size={14} /> Back
        </button>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.22em", color: accent, textTransform: "uppercase", marginBottom: 12, fontWeight: 700 }}>
          {needsDecision ? "Decision needed" : "For your awareness"}
        </div>
        <div style={S.decisionTitle}>{item.title}</div>
        <div style={S.decisionHeadline}>{item.headline}</div>

        {/* What's happening */}
        <div style={S.contextCard}>
          <div style={{ ...S.eyebrow, marginBottom: 10 }}>What's happening</div>
          <div style={S.cardTitle}>{item.context}</div>
        </div>

        {/* Response Timeline */}
        <div style={{
          background: T.timelineGrad,
          border: `1px solid ${T.timelineBorder}`,
          borderLeft: `3px solid ${T.statusClear}`,
          borderRadius: 16,
          padding: 18,
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: T.statusClearDim, display: "flex", alignItems: "center", justifyContent: "center", color: T.statusClear }}>
                <Icon name="activity" size={14} />
              </div>
              <div style={{ ...S.eyebrow, color: T.statusClear, fontWeight: 700 }}>What we've done</div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 999,
              background: needsDecision ? T.statusClearDim : "transparent",
              border: `1px solid ${needsDecision ? T.slaBorder : T.borderStrong}`,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.12em",
              color: needsDecision ? T.statusClear : T.textDim, fontWeight: 700, textTransform: "uppercase",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: needsDecision ? T.statusClear : T.textDim,
                animation: needsDecision ? "sentry-sla-pulse 2.5s ease-in-out infinite" : "none",
              }} />
              {needsDecision ? `SLA ${item.slaRemaining}` : "Informational"}
            </div>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, position: "relative" }}>
            <div style={{ position: "absolute", left: 9, top: 10, bottom: 10, width: 1, background: T.border }} />
            {(item.timeline || []).map((step, idx) => (
              <li key={idx} style={{ display: "flex", gap: 14, padding: "6px 0", position: "relative", alignItems: "flex-start" }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: step.status === "done" ? T.statusClear : step.status === "current" ? T.brandDim : T.surface,
                  border: `1px solid ${step.status === "done" ? T.statusClear : step.status === "current" ? T.brand : T.border}`,
                  color: "#fff",
                  position: "relative", zIndex: 1, marginTop: 1,
                  animation: step.status === "current" ? "sentry-sla-pulse 2.5s ease-in-out infinite" : "none",
                }}>
                  {step.status === "done" && <Icon name="checkSm" size={11} />}
                  {step.status === "current" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.brand }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: step.status === "current" ? T.brand : T.text, lineHeight: 1.4 }}>
                    {step.label}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.08em", color: T.textDim, marginTop: 3 }}>
                    {step.meta}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommendation */}
        <div style={{
          ...S.contextCard,
          borderColor: needsDecision ? "rgba(168,58,50,0.3)" : "rgba(168,101,30,0.3)",
        }}>
          <div style={{ ...S.eyebrow, color: accent, fontWeight: 700, marginBottom: 10 }}>Our recommendation</div>
          <div style={S.cardTitle}>{item.recommendation}</div>
        </div>

        {/* Asset */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, marginBottom: 20 }}>
          <span style={S.metaMono}>{item.asset}</span>
          <span style={S.metaMono}>{ago(item.timeReceived)}</span>
        </div>

        {/* Teach-back */}
        <div style={{
          background: T.teachGrad,
          border: `1px solid ${T.brandEdge}`,
          borderLeft: `3px solid ${T.brand}`,
          borderRadius: 16,
          padding: 18,
          marginBottom: 20,
          boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.25)" : "0 4px 16px rgba(200,62,0,0.08)",
          position: "relative",
        }}>
          {showNotedAck && (
            <div style={{
              position: "absolute", left: "50%", top: -10,
              background: T.brand, color: "#fff",
              fontSize: 11, fontWeight: 600,
              padding: "6px 14px", borderRadius: 999,
              boxShadow: "0 4px 12px rgba(200,62,0,0.35)",
              display: "flex", alignItems: "center", gap: 6,
              whiteSpace: "nowrap",
              fontFamily: "'Inter', sans-serif",
              pointerEvents: "none",
              animation: "sentry-noted-pop 2.4s cubic-bezier(0.32, 0.72, 0, 1) forwards",
            }}>
              <Icon name="checkSm" size={11} /> Noted · carried forward
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: T.brandDim, display: "flex", alignItems: "center", justifyContent: "center", color: T.brand }}>
              <Icon name="target" size={14} />
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.22em", color: T.brand, textTransform: "uppercase", fontWeight: 700 }}>
              Before you decide
            </div>
          </div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: T.text, marginBottom: 8, letterSpacing: "-0.005em", lineHeight: 1.3 }}>
            How critical is this asset, really?
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: T.textDim, lineHeight: 1.55, marginBottom: 14 }}>
            Your answer tunes how Sentry scores future alerts on <strong style={{ color: T.text, fontWeight: 500 }}>{item.asset.split(" · ")[0]}</strong>. This is the loop that makes detection smarter for your environment specifically.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { key: "elevated", label: "More critical", icon: "arrowUp", upColor: true },
              { key: "same", label: "Just right", icon: null, upColor: false },
              { key: "lowered", label: "Less", icon: "arrowDown", upColor: false },
            ].map((opt) => {
              const active = criticalityChoice === opt.key;
              let btnStyle;
              if (opt.upColor) {
                btnStyle = {
                  border: `1px solid ${active ? T.statusAttention : "rgba(168,58,50,0.6)"}`,
                  background: active ? T.statusAttention : "transparent",
                  color: active ? "#fff" : T.statusAttention,
                };
              } else {
                btnStyle = {
                  border: `1px solid ${active ? T.textMid : T.borderStrong}`,
                  background: active ? T.textMid : "transparent",
                  color: active ? T.bg : T.textDim,
                };
              }
              return (
                <button key={opt.key} onClick={() => setCriticality(opt.key)} style={{
                  flex: 1, borderRadius: 12, padding: "12px 10px",
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'Inter', sans-serif",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "all 180ms ease",
                  ...btnStyle,
                }}>
                  {opt.icon && <Icon name={opt.icon} size={14} />} {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Decision buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <button onClick={() => decide("APPROVED")} style={{
            background: T.statusClear, color: "#fff", border: "none",
            borderRadius: 16, padding: 18, fontSize: 15, fontWeight: 500,
            cursor: "pointer", fontFamily: "'Inter', sans-serif", letterSpacing: "0.01em",
          }}>
            Approve{needsDecision ? " · block the session" : ""}
          </button>
          <button onClick={() => decide("DENIED")} style={{
            background: "transparent", color: T.text,
            border: `1px solid ${T.border}`, borderRadius: 16,
            padding: 18, fontSize: 15, fontWeight: 500,
            cursor: "pointer", fontFamily: "'Inter', sans-serif",
          }}>
            Override · {needsDecision ? "I'll handle directly" : "needs more review"}
          </button>
          <button onClick={() => decide("LATER")} style={{
            background: "transparent", color: T.textDim, border: "none",
            borderRadius: 16, padding: 14, fontSize: 13, cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}>
            Ask me later
          </button>
        </div>

        {/* Clarity row — demoted */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 4px", opacity: 0.7 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.textDim, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 }}>
            Clarity of this alert
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3, 4, 5].map((n) => {
              const active = clarityRating && n <= clarityRating;
              return (
                <button key={n} onClick={() => setClarityRating(n)} style={{
                  width: 24, height: 24, borderRadius: 6,
                  border: `1px solid ${active ? T.brand : T.border}`,
                  background: active ? T.brandDim : "transparent",
                  color: active ? T.brand : T.textDim,
                  fontSize: 11, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  transition: "all 120ms ease",
                }}>
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDigest = () => {
    const week = history.slice(-7);
    const reviewed = week.reduce((s, d) => s + d.ingested, 0);
    const escalated = week.reduce((s, d) => s + d.escalated, 0);
    const confirmed = items.filter((i) => i.clientConfirmed).length;
    const maxVol = Math.max(...week.map((d) => d.ingested));
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric" });
    const days = ["S", "M", "T", "W", "T", "F", "S"];

    return (
      <div style={{ animation: "sentry-fade-in 0.4s ease-out" }}>
        <button onClick={() => goto("status")} style={S.btnBack}>
          <Icon name="chevronL" size={14} /> Back
        </button>
        <div style={{ ...S.digestLabel, marginBottom: 8 }}>Week of {weekStart}</div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: T.text, marginBottom: 32, letterSpacing: "-0.01em", lineHeight: 1.1 }}>
          Your week with VDA
        </div>

        <div style={{ ...S.card, textAlign: "center", padding: "28px 24px" }}>
          <div style={S.digestBig}>{reviewed.toLocaleString()}</div>
          <div style={{ ...S.digestLabel, marginTop: 10 }}>alerts reviewed by VDA</div>
          <div style={{ ...S.divider, margin: "20px -24px" }} />
          <div style={S.digestMid}>{escalated}</div>
          <div style={{ ...S.digestLabel, marginTop: 8 }}>required your attention</div>
        </div>

        <div style={S.card}>
          <div style={{ ...S.eyebrow, marginBottom: 16 }}>Daily volume</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 60 }}>
            {week.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{
                  width: "100%", background: T.brand, borderRadius: 3,
                  height: `${(d.ingested / maxVol) * 100}%`,
                  minHeight: 2,
                  opacity: 0.3 + (d.ingested / maxVol) * 0.7,
                }} />
                <div style={{ fontSize: 9, color: T.textDim, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{days[i]}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...S.card, padding: 24 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, color: T.text, lineHeight: 1.6, fontWeight: 400 }}>
            {confirmed > 0
              ? `You confirmed ${confirmed} ${confirmed === 1 ? "incident" : "incidents"} this week, each one making the model smarter for your environment.`
              : "A quiet week."}
            {escalated === 0 ? " Nothing reached you." : ` ${escalated} ${escalated === 1 ? "item" : "items"} required your input.`}
            {" "}VDA's analysts handled the rest.
          </div>
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: T.textDim, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>
              CISO of record
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: T.text, fontWeight: 500 }}>
              {CLIENT.ciso}
            </span>
          </div>
        </div>

        <button onClick={openReport} style={{
          width: "100%", background: T.brand, color: T.onBrand, border: "none",
          borderRadius: 14, padding: 16, fontSize: 14, fontWeight: 500,
          cursor: "pointer", fontFamily: "'Inter', sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: isDark ? "0 4px 16px rgba(255,87,34,0.3)" : "0 4px 16px rgba(200,62,0,0.3)",
        }}>
          <Icon name="file" size={15} /> Open board report
        </button>
      </div>
    );
  };

  // ==========================================================================
  // REPORT OVERLAY
  // ==========================================================================
  const renderReport = () => {
    const week = history.slice(-7);
    const totalReviewed = week.reduce((s, d) => s + d.ingested, 0);
    const totalEscalated = week.reduce((s, d) => s + d.escalated, 0);
    const confirmed = items.filter((i) => i.clientConfirmed).length;
    const noiseReduced = totalReviewed > 0 ? Math.round(((totalReviewed - totalEscalated) / totalReviewed) * 100) : 0;
    const today = new Date();
    const period = `Week of ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
    const docId = `VDA-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${CLIENT.name.substring(0, 3).toUpperCase()}`;
    const maxVol = Math.max(...week.map((d) => d.ingested), 1);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const takeaway = totalEscalated === 0
      ? `The week was quiet. VDA handled ${totalReviewed.toLocaleString()} signals without executive involvement. Maintain current posture; no structural changes recommended.`
      : `VDA surfaced ${totalEscalated} of ${totalReviewed.toLocaleString()} signals for executive review — a ${noiseReduced}% noise reduction. The signal-to-board ratio is healthy; current escalation discipline is working.`;

    return (
      <div className="sentry-report-overlay" style={{ position: "fixed", inset: 0, zIndex: 100, background: "#1a1a1a", overflow: "auto", animation: "sentry-slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1)" }}>
        <div className="sentry-report-toolbar" style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(20,20,20,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <button onClick={closeReport} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#e8e8e8", fontSize: 11, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="chevronL" size={14} /> Close
          </button>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#999", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }}>
            {docId} · Preview
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={downloadReport} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#e8e8e8", fontSize: 12, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="download" size={13} /> Download
            </button>
            <button onClick={() => window.print()} style={{ background: "#c83e00", color: "#fff", border: "none", fontSize: 12, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="printer" size={13} /> Print / Save as PDF
            </button>
          </div>
        </div>

        <div className="sentry-report-stage" style={{ padding: "32px 20px 60px", background: "#2a2826", minHeight: "calc(100vh - 60px)", display: "flex", flexDirection: "column", alignItems: "center", gap: 24, overflowX: "hidden" }}>
          <div className="sentry-report-scale-outer" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <div className="sentry-report-scale" style={{ transformOrigin: "top left", width: reportScaledSize.width, height: reportScaledSize.height }}>
              <div className="sentry-report-scale-inner" style={{ width: 850, transform: `scale(${reportScale})`, transformOrigin: "top left" }}>
                <div className="sentry-report-pages" style={{ display: "flex", flexDirection: "column", gap: 24, width: 850 }}>

                  {/* COVER */}
                  <div className="sentry-report-page" style={pageStyle()}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 600, color: "#8b1a1a" }}>
                      VDA Labs · Managed Detection & Response
                    </div>
                    <div style={{ margin: "auto 0" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: "#6b6560", marginBottom: 32, fontWeight: 600 }}>
                        {period} · Confidential Brief
                      </div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 80, fontWeight: 500, lineHeight: 1.02, letterSpacing: "-0.03em", marginBottom: 24, color: "#1a1a1a" }}>
                        Security<br />Posture<br />Brief
                      </div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 400, fontStyle: "italic", color: "#5a5550", lineHeight: 1.35, maxWidth: "5in" }}>
                        A weekly synthesis of detection activity, analyst decisions, and the threats your team chose not to ignore.
                      </div>
                    </div>
                    <div style={{ paddingTop: 24, borderTop: "2px solid #1a1a1a", display: "flex", justifyContent: "space-between", gap: 16, fontSize: 10 }}>
                      {[
                        { lbl: "Prepared for", name: CLIENT.name, sub: "Board of Directors" },
                        { lbl: "Prepared by", name: "VDA Labs SOC", sub: CLIENT.ciso },
                        { lbl: "Document", name: docId, sub: today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), mono: true, align: "right" },
                      ].map((c, i) => (
                        <div key={i} style={{ textAlign: c.align || "left" }}>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a8580", marginBottom: 5, fontWeight: 700 }}>{c.lbl}</div>
                          <div style={{ fontFamily: c.mono ? "'JetBrains Mono', monospace" : "'Cormorant Garamond', serif", fontSize: c.mono ? 11 : 15, fontWeight: c.mono ? 600 : 500, marginBottom: 2 }}>{c.name}</div>
                          <div style={{ color: "#6b6560", fontSize: 10 }}>{c.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* EXEC SUMMARY */}
                  <div className="sentry-report-page" style={pageStyle()}>
                    <div style={headRowStyle()}>
                      <div style={eyebrowStyle()}>I · Executive Summary</div>
                      <div style={periodStyle()}>{period.toUpperCase()}</div>
                    </div>

                    {/* THE TAKE */}
                    <div style={{ background: "#1a1a1a", color: "#fff", padding: "20px 28px", margin: "0 0 26px", display: "flex", gap: 18, alignItems: "center" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c8a86b", fontWeight: 700, paddingRight: 18, borderRight: "1px solid rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>
                        The take
                      </div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, lineHeight: 1.45, color: "#f5f3ee", fontWeight: 500 }}>
                        {takeaway}
                      </div>
                    </div>

                    <h2 style={h2Style()}>The week, in one sentence.</h2>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, lineHeight: 1.5, color: "#3a3530", fontWeight: 400, marginBottom: 28, maxWidth: "6.2in" }}>
                      VDA's analysts reviewed <strong style={{ color: "#1a1a1a", fontWeight: 600 }}>{totalReviewed.toLocaleString()}</strong> security signals on your behalf this week and surfaced <strong style={{ color: "#1a1a1a", fontWeight: 600 }}>{totalEscalated}</strong> {totalEscalated === 1 ? "item" : "items"} that required executive awareness — a noise reduction of <span style={{ color: "#8b1a1a", fontWeight: 700 }}>{noiseReduced}%</span> against your endpoint and identity surface.
                    </p>

                    <div style={{ display: "flex", gap: 18, margin: "22px 0 28px" }}>
                      {[
                        { num: totalReviewed.toLocaleString(), lbl: "Signals Triaged", sub: "by VDA SOC analysts" },
                        { num: totalEscalated, lbl: "Escalated", sub: "required your attention" },
                        { num: `${noiseReduced}%`, lbl: "Noise Filtered", sub: "handled without you" },
                        { num: confirmed, lbl: "Confirmed True", sub: "model learned from outcomes" },
                      ].map((m, i) => (
                        <div key={i} style={{ flex: 1, padding: "14px 0 0", borderTop: "2px solid #1a1a1a" }}>
                          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.025em", color: "#1a1a1a" }}>{m.num}</div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6b6560", marginTop: 8, fontWeight: 700 }}>{m.lbl}</div>
                          <div style={{ fontSize: 9.5, color: "#8a8580", marginTop: 3, fontStyle: "italic" }}>{m.sub}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ ...eyebrowStyle(), marginBottom: 12 }}>Daily Detection Volume</div>
                    <div style={{ padding: "16px 0", borderTop: "1px solid #d4d0c8", borderBottom: "1px solid #d4d0c8", marginBottom: 22 }}>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 100, padding: "0 4px" }}>
                        {week.map((d, i) => (
                          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#1a1a1a", fontWeight: 600 }}>{d.ingested}</div>
                            <div style={{ width: "100%", background: "#8b1a1a", minHeight: 3, height: (d.ingested / maxVol) * 80 }} />
                            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b6560", fontWeight: 600 }}>{dayNames[i]}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 9, color: "#8a8580", fontStyle: "italic", marginTop: 10 }}>
                        Total signals ingested per day across all monitored surfaces. Triaged automatically by Sentry, escalated by analyst judgment.
                      </div>
                    </div>

                    <div style={{ padding: "20px 28px", borderLeft: "3px solid #8b1a1a", background: "#faf8f4", marginTop: 8 }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: "italic", lineHeight: 1.45, color: "#1a1a1a" }}>
                        "The right number of alerts to escalate to a CEO is the number that demand a decision. This week, that number was {totalEscalated}."
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6b6560", marginTop: 10, fontWeight: 600 }}>
                        — {CLIENT.ciso}, VDA Labs
                      </div>
                    </div>

                    <div style={footerStyle()}><span>VDA Labs · Confidential</span><span>{CLIENT.name}</span><span>Page 1 of 3</span></div>
                  </div>

                  {/* FINDINGS */}
                  <div className="sentry-report-page" style={pageStyle()}>
                    <div style={headRowStyle()}>
                      <div style={eyebrowStyle()}>II · Key Findings</div>
                      <div style={periodStyle()}>{period.toUpperCase()}</div>
                    </div>
                    <h2 style={h2Style()}>What we observed.</h2>
                    <p style={{ fontSize: 11.5, lineHeight: 1.65, color: "#2a2520", marginBottom: 22 }}>
                      Detection activity was consistent with your established baseline. Three observations are worth surfacing to the board.
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      <li style={findingStyle()}><strong style={{ fontWeight: 600, color: "#1a1a1a" }}>Phishing campaign targeting finance.</strong> A coordinated credential-harvesting attempt was detected against three members of your finance team. All messages were quarantined before delivery; no clicks recorded. Pattern matches activity attributed to a known commodity threat actor.</li>
                      <li style={findingStyle()}><strong style={{ fontWeight: 600, color: "#1a1a1a" }}>Routine maintenance executed cleanly.</strong> A scheduled patch on your trading server (SVR-TRADE-07) completed within the maintenance window without incident. Continuity preserved.</li>
                      <li style={findingStyle()}>
                        <strong style={{ fontWeight: 600, color: "#1a1a1a" }}>Model precision improving.</strong>{" "}
                        {confirmed > 0
                          ? `The ${confirmed} ${confirmed === 1 ? "incident" : "incidents"} you confirmed this week measurably improved how Sentry scores future activity in your environment.`
                          : "No analyst overrides were required this week — a sign of healthy baseline calibration."}
                      </li>
                    </ul>

                    <div style={{ ...eyebrowStyle(), marginTop: 34, marginBottom: 14 }}>III · Recommendations</div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["Priority", "Action", "Rationale"].map((h, i) => (
                            <th key={h} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", textAlign: "left", color: "#8b1a1a", padding: "10px 12px 10px 0", borderBottom: "2px solid #1a1a1a", fontWeight: 700, width: i === 0 ? "20%" : i === 1 ? "42%" : "auto" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { p: "Immediate", a: "Reinforce phishing awareness for finance team via 15-minute briefing.", r: "Threat actor has demonstrated targeting interest. Repetition reduces susceptibility." },
                          { p: "This Quarter", a: "Schedule tabletop exercise covering wire-fraud scenario.", r: "Aligns finance, legal, and IT response under a controlled simulation." },
                          { p: "Ongoing", a: "Maintain current cadence of executive review.", r: "Current escalation volume is healthy. No structural changes recommended." },
                        ].map((row, i) => (
                          <tr key={i}>
                            <td style={{ padding: "14px 12px 14px 0", fontSize: 10.5, borderBottom: "1px solid #e8e4dd", verticalAlign: "top", lineHeight: 1.5, fontWeight: 600, color: "#8b1a1a", whiteSpace: "nowrap" }}>{row.p}</td>
                            <td style={{ padding: "14px 12px 14px 0", fontSize: 10.5, borderBottom: "1px solid #e8e4dd", verticalAlign: "top", lineHeight: 1.5 }}>{row.a}</td>
                            <td style={{ padding: "14px 12px 14px 0", fontSize: 10.5, borderBottom: "1px solid #e8e4dd", verticalAlign: "top", lineHeight: 1.5, color: "#5a5550" }}>{row.r}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={footerStyle()}><span>VDA Labs · Confidential</span><span>{CLIENT.name}</span><span>Page 2 of 3</span></div>
                  </div>

                  {/* METHODOLOGY */}
                  <div className="sentry-report-page" style={pageStyle()}>
                    <div style={headRowStyle()}>
                      <div style={eyebrowStyle()}>IV · Methodology &amp; Sign-Off</div>
                      <div style={periodStyle()}>{period.toUpperCase()}</div>
                    </div>
                    <h2 style={h2Style()}>How we arrived at these numbers.</h2>
                    <p style={{ fontSize: 11, lineHeight: 1.7, color: "#2a2520", marginBottom: 14 }}>
                      Sentry ingests telemetry from your endpoints, identity provider, network gateway, and email security stack. Every signal is scored against MITRE ATT&amp;CK techniques, contextualized against your environment's baseline, and routed through a triage queue staffed by VDA analysts.
                    </p>
                    <p style={{ fontSize: 11, lineHeight: 1.7, color: "#2a2520", marginBottom: 14 }}>
                      Items reach the board only if they pass three filters: technical credibility, business relevance, and executive actionability. Anything that fails one of those filters is handled by the SOC and recorded in your weekly digest — not sent to you.
                    </p>
                    <div style={{ ...eyebrowStyle(), marginTop: 28, marginBottom: 10 }}>Confidence Statement</div>
                    <p style={{ fontSize: 11, lineHeight: 1.7, color: "#2a2520" }}>
                      This brief reflects telemetry available as of {today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. VDA assumes responsibility for the accuracy of detection counts and analyst decisions.
                    </p>
                    <div style={{ marginTop: 44, paddingTop: 20, borderTop: "2px solid #1a1a1a", display: "flex", gap: 40 }}>
                      {[
                        { lbl: "Prepared By", name: CLIENT.ciso, sub: "VDA Labs · SOC" },
                        { lbl: "For Review By", name: `${CLIENT.name} Board`, sub: "Quarterly Risk Committee" },
                      ].map((c, i) => (
                        <div key={i} style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "#8a8580", marginBottom: 8, fontWeight: 700 }}>{c.lbl}</div>
                          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, marginBottom: 4, fontWeight: 500 }}>{c.name}</div>
                          <div style={{ fontSize: 10, color: "#6b6560" }}>{c.sub}</div>
                        </div>
                      ))}
                    </div>
                    <div style={footerStyle()}><span>VDA Labs · Confidential</span><span>{CLIENT.name}</span><span>Page 3 of 3</span></div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================
  return (
    <div style={{ padding: "20px 12px", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "0 8px", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.brand, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.25em", color: T.brand, textTransform: "uppercase", fontWeight: 700 }}>
                SENTRY · CLIENT
              </div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, color: T.text, letterSpacing: "-0.005em", marginTop: 2 }}>
                {CLIENT.name}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {["auto", "light", "dark"].map((t) => (
              <button key={t} onClick={() => setTheme(t)} style={{
                fontSize: 9, padding: "4px 10px",
                background: theme === t ? (isDark ? "#222" : "#fff") : "transparent",
                color: theme === t ? (isDark ? "#fff" : "#000") : (isDark ? "#666" : "#999"),
                border: `1px solid ${theme === t ? (isDark ? "#333" : "#ddd") : "transparent"}`,
                borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.18em",
                cursor: "pointer", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
              }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div style={{
          maxWidth: 420, margin: "0 auto",
          background: T.bg, color: T.text,
          borderRadius: 44, overflow: "hidden",
          boxShadow: T.phoneShadow,
          position: "relative", minHeight: 820,
          transition: "background 0.4s ease, color 0.4s ease",
        }}>
          <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", width: 120, height: 26, background: "#000", borderRadius: 20, zIndex: 10 }} />
          {toast && (
            <div style={{
              position: "absolute", top: 48, left: 20, right: 20, zIndex: 20,
              borderRadius: 14, padding: "14px 18px", fontSize: 12,
              fontFamily: "'Inter', sans-serif", backdropFilter: "blur(8px)",
              background: isDark ? "rgba(26,46,26,0.95)" : "rgba(232,245,232,0.98)",
              border: `1px solid ${isDark ? "#2d5a2d" : "#a8d8a8"}`,
              color: isDark ? "#a8d8a8" : "#2d5a2d",
              display: "flex", alignItems: "center", gap: 8,
              animation: "sentry-fade-in 0.4s ease-out",
            }}>
              <Icon name="check" size={14} /> {toast}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 28px 0", fontSize: 11, fontWeight: 600, color: T.text, letterSpacing: "0.05em", fontFamily: "'JetBrains Mono', monospace" }}>
            <span>{clock || "—"}</span>
            <span style={{ opacity: 0.5 }}>•••</span>
          </div>
          <div style={{ padding: "56px 28px 32px", minHeight: 740 }}>
            {screen === "status" && renderStatus()}
            {screen === "active" && renderActive()}
            {screen === "decision" && renderDecision()}
            {screen === "digest" && renderDigest()}
          </div>
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", width: 120, height: 4, background: T.text, opacity: 0.25, borderRadius: 2 }} />
        </div>
      </div>

      {reportOpen && renderReport()}
    </div>
  );
}

// ============================================================================
// STYLE BUILDERS — reused across screens
// ============================================================================
function buildStyles(T) {
  return {
    greeting: {
      fontSize: 10, color: T.textDim, marginBottom: 6,
      letterSpacing: "0.18em", textTransform: "uppercase",
      fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
    },
    clientName: {
      fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 400,
      color: T.text, marginBottom: 32, letterSpacing: "-0.01em",
    },
    card: {
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 20, padding: 20, marginBottom: 16,
    },
    cardLg: { borderRadius: 24, padding: "32px 24px" },
    statusHeadline: {
      fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 400,
      color: T.text, marginBottom: 8, letterSpacing: "-0.02em",
    },
    statusSub: {
      fontFamily: "'Inter', sans-serif", fontSize: 14, color: T.textDim,
      lineHeight: 1.5, maxWidth: 260,
    },
    eyebrow: {
      fontSize: 9, letterSpacing: "0.2em", color: T.textDim,
      textTransform: "uppercase", fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace",
    },
    itemBtn: {
      width: "100%", background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 20, padding: 20, marginBottom: 12,
      textAlign: "left", cursor: "pointer", color: T.text,
      fontFamily: "inherit", display: "block",
    },
    itemTitle: {
      fontFamily: "'Fraunces', serif", fontSize: 18, color: T.text,
      marginBottom: 6, lineHeight: 1.3,
    },
    itemBody: {
      fontFamily: "'Inter', sans-serif", fontSize: 13, color: T.textDim,
      lineHeight: 1.5, marginBottom: 12,
    },
    itemMeta: {
      display: "flex", justifyContent: "space-between",
      alignItems: "center", fontSize: 11, color: T.textDim,
    },
    metaMono: {
      fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
      letterSpacing: "0.05em", color: T.textDim,
    },
    workingSummary: {
      width: "100%", background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 20, padding: "18px 20px", marginBottom: 20,
      textAlign: "left", cursor: "pointer", color: T.text,
      fontFamily: "inherit", display: "flex",
      justifyContent: "space-between", alignItems: "center",
    },
    statBig: {
      fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 400,
      color: T.text, lineHeight: 1, letterSpacing: "-0.02em",
    },
    statLabel: {
      fontFamily: "'Inter', sans-serif", fontSize: 11,
      color: T.textDim, marginTop: 6,
    },
    divider: { height: 1, background: T.border, margin: "0 -20px 16px" },
    reportCta: {
      width: "100%", background: T.brandGrad,
      border: `1px solid ${T.brandEdge}`, borderLeft: `3px solid ${T.brand}`,
      borderRadius: 16, padding: 18, cursor: "pointer", color: T.text,
      fontFamily: "inherit", display: "flex",
      justifyContent: "space-between", alignItems: "center",
      boxShadow: "0 4px 16px rgba(200,62,0,0.07)",
    },
    reportCtaIcon: {
      width: 36, height: 36, borderRadius: 10,
      background: T.brandDim, display: "flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    btnBack: {
      fontSize: 11, padding: "0 0 24px",
      display: "flex", alignItems: "center", gap: 6,
      letterSpacing: "0.1em", textTransform: "uppercase",
      fontWeight: 600, color: T.textDim,
      fontFamily: "'JetBrains Mono', monospace",
      background: "transparent", border: "none", cursor: "pointer",
    },
    decisionTitle: {
      fontFamily: "'Fraunces', serif", fontSize: 26, color: T.text,
      marginBottom: 16, lineHeight: 1.2, letterSpacing: "-0.01em",
    },
    decisionHeadline: {
      fontFamily: "'Inter', sans-serif", fontSize: 15, color: T.text,
      lineHeight: 1.6, marginBottom: 24,
    },
    contextCard: {
      background: T.surfaceHi, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: 18, marginBottom: 16,
    },
    cardTitle: {
      fontFamily: "'Inter', sans-serif", fontSize: 13,
      color: T.text, lineHeight: 1.6,
    },
    digestBig: {
      fontFamily: "'Fraunces', serif", fontSize: 52, fontWeight: 400,
      color: T.text, lineHeight: 1, letterSpacing: "-0.03em",
    },
    digestMid: {
      fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 400,
      color: T.statusClear, lineHeight: 1, letterSpacing: "-0.02em",
    },
    digestLabel: {
      fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
      color: T.textDim, letterSpacing: "0.15em",
      textTransform: "uppercase", fontWeight: 600,
    },
  };
}

// Report page style builders
function pageStyle() {
  return {
    background: "#ffffff",
    width: 850,
    height: (850 * 11) / 8.5,
    padding: "0.85in 0.95in 0.7in",
    boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
    position: "relative",
    color: "#1a1a1a",
    fontFamily: "'Inter', sans-serif",
    fontSize: 10.5,
    lineHeight: 1.65,
  };
}
function headRowStyle() {
  return {
    display: "flex", justifyContent: "space-between", alignItems: "baseline",
    marginBottom: 32, paddingBottom: 10, borderBottom: "2px solid #1a1a1a",
  };
}
function eyebrowStyle() {
  return {
    fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase",
    fontWeight: 700, color: "#8b1a1a",
    fontFamily: "'JetBrains Mono', monospace",
  };
}
function periodStyle() {
  return {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
    color: "#8a8580", letterSpacing: "0.12em", fontWeight: 500,
  };
}
function h2Style() {
  return {
    fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 500,
    letterSpacing: "-0.015em", marginBottom: 16, color: "#1a1a1a", lineHeight: 1.15,
  };
}
function findingStyle() {
  return {
    padding: "16px 0 16px 32px", borderBottom: "1px solid #e8e4dd",
    position: "relative", fontSize: 11.5, lineHeight: 1.6,
  };
}
function footerStyle() {
  return {
    position: "absolute", bottom: "0.5in", left: "0.95in", right: "0.95in",
    display: "flex", justifyContent: "space-between",
    fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase",
    color: "#8a8580", paddingTop: 8, borderTop: "1px solid #d4d0c8",
    fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
  };
}
