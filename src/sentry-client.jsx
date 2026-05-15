/**
 * sentry-client.jsx — VDA × 3Nails Customer Portal
 *
 * The customer-facing portal. Part of the ticketing system Sentry ships for VDA,
 * built against the scope from the discovery call with Jim, Sibe, and Kendall.
 * Companion to sentry-console.jsx — they share the same ticket database, same
 * soc@vdalabs.com inbound email bridge, and the same Securonix SNYPR integration.
 *
 * Four views in Phase 1 (per Jim's explicit call):
 *   Home · Open a case · My Tickets · Documents
 *
 * Phase 2 expands to seven tiles with:
 *   + Contract · Dashboards · Knowledge Base
 *
 * The Phase Toggle (top right) lets a viewer switch between scopes —
 * doubles as a scope-communication device when showing this to Kendall or Jim.
 *
 * Halo tried to be a customer portal too, but expanded into quoting, invoicing,
 * and agreements until it collapsed. This portal stays narrow on purpose.
 *
 * Design note: this portal is the public face of a system whose private face
 * (sentry-console.jsx) eliminates manual email ↔ SNYPR copy-paste for Sibe's
 * team and enforces wrong-client prevention on every outbound customer email.
 * The portal exists because the ticketing layer needs a customer-facing surface;
 * it is deliberately quiet about the internal workflow it's built on top of.
 *
 * Customer voice: plain-English, calm, past-tense for completed actions.
 * No ticket IDs in body copy (they live in subject + metadata).
 * No jargon, no scoring, no survey-style feedback widgets. A ticket portal,
 * not a feedback platform.
 *
 * Brand tokens match the Sentry design system and the SecOps deck:
 *   navy #0A1628, burnt orange #D2691E, steel blue #6B93B8
 *
 * Font stack in the app runtime: Georgia display, Calibri body, Consolas mono.
 * The standalone design-system doc (sentry-design-system.html) uses the
 * system font stack instead — this was a targeted workaround for an iOS Safari
 * rendering bug specific to that doc's layout (sticky nav + backdrop-filter +
 * Georgia at synthesized weights). The app runtime does not trigger that bug
 * and keeps Georgia for its editorial feel (Security Report cover, portal
 * greeting, ticket subject display).
 */

import React, { useState, useEffect, useRef } from "react";
import {
  AlertCircle, Archive, ArrowLeft, ArrowRight, BookOpen, Calendar, Check, ChevronRight,
  Download, Eye, FileText, Folder, Gauge, HelpCircle, Home, Inbox, Lock, Mail,
  MessageSquare, PlusCircle, Send, Shield, ShoppingCart, Sparkles,
  TrendingDown, TrendingUp, User, Zap,
} from "lucide-react";

/* ============================================================
 * BRAND TOKENS — match the Sentry design system
 * ============================================================ */
const T = {
  // Dark frame (outer chrome, header)
  bg: "#0A1628",
  bgCard: "#122238",
  bgCardEdge: "#1A2E47",

  // Light content area (portal is friendlier on white)
  bgLight: "#F5F4F0",
  bgLightCard: "#FFFFFF",
  bgLightAlt: "#FAFAF7",

  // Ink
  ink: "#E8EEF4",
  inkDim: "#A8B8C8",
  inkMuted: "#6B7D91",
  inkDark: "#1A2E47",
  inkDarkDim: "#5A6A7D",
  inkDarkMuted: "#8A97A5",

  divider: "#2A3E57",
  dividerLight: "#D8DCE2",

  orange: "#D2691E",
  orangeSoft: "#E89968",
  orangeTint: "#FBF0E6",
  steel: "#6B93B8",

  sevCrit: "#D2691E",
  sevHigh: "#D4A574",
  sevMed: "#6B93B8",

  slaOk: "#5B8F6F",
  slaWarn: "#D4A574",
  slaBreach: "#C95850",

  fontDisplay: 'Georgia, "Times New Roman", serif',
  fontBody: 'Calibri, "Segoe UI", system-ui, sans-serif',
  fontMono: 'Consolas, "Courier New", monospace',
};

/* ============================================================
 * RESPONSIVE HOOK — JS-based (works in every sandbox, unlike @media)
 * Matches the pattern documented in BUS_FACTOR.md
 * ============================================================ */
const useIsMobile = (breakpoint = 768) => {
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
 * MOCK DATA — this customer ("Acme Corp") has ~8 tickets
 * ============================================================ */

const THIS_CUSTOMER = {
  id: "acme", name: "Acme Corp",
  primaryContact: { name: "Kate Lin", email: "security@acme.com", role: "CISO" },
  contract: {
    tier: "Enterprise", startDate: "2025-01-15", renewalDate: "2026-01-15",
    monthlySpend: "$24,500",
    services: [
      { name: "24/7 SOC Monitoring", status: "active", count: "342 endpoints" },
      { name: "Managed SentinelOne", status: "active", count: "342 licenses" },
      { name: "Managed Huntress", status: "active", count: "342 agents" },
      { name: "Quarterly Penetration Testing", status: "scheduled", count: "Q2 2026 · May 12" },
    ],
  },
};

const NOW = new Date("2026-04-17T14:30:00Z").getTime();
const mins = (n) => NOW - n * 60 * 1000;

const CUSTOMER_TICKETS = [
  {
    id: "VDA-1847", severity: "critical", status: "in-progress",
    subject: "Unusual login activity on your CFO's account",
    customerFacing: "We detected an unusual sign-in to Tom Webb's account from Lagos, Nigeria. We've isolated the session and blocked further activity. Waiting on your confirmation that Tom is not currently traveling.",
    createdAt: mins(42), lastUpdate: mins(35),
    thread: [
      { from: "VDA", at: mins(35),
        body: "We've detected an unusual sign-in to your CFO's account from Lagos, Nigeria. Session has been isolated. Please confirm whether Tom is currently traveling." },
    ],
  },
  {
    id: "VDA-1844", severity: "medium", status: "resolved",
    subject: "SSL certificate renewal heads-up",
    customerFacing: "api.acme.com's certificate is set to expire in 28 days. You've confirmed renewal is scheduled.",
    createdAt: mins(1440), lastUpdate: mins(700),
    thread: [
      { from: "VDA", at: mins(1430),
        body: "Heads up — your api.acme.com SSL certificate expires in 28 days." },
      { from: "You", at: mins(720),
        body: "Thanks — renewal scheduled. Close ticket." },
      { from: "VDA", at: mins(700),
        body: "Marked resolved. Renewal calendar confirmed." },
    ],
  },
  {
    id: "VDA-1841", severity: "low", status: "open",
    subject: "New user provisioning",
    customerFacing: "HR flagged three new engineers starting Monday. We've noted the request and will add them to your monitoring scope.",
    createdAt: mins(15), lastUpdate: mins(15),
    thread: [
      { from: "You", at: mins(15),
        body: "Three new engineers starting Monday — please add to your monitoring scope." },
    ],
  },
  {
    id: "VDA-1839", severity: "high", status: "open",
    subject: "Data egress alert — 2.3GB outbound transfer",
    customerFacing: "Our monitoring flagged a large outbound transfer from your network to an unknown S3 bucket. Our team is investigating the source and destination.",
    createdAt: mins(8), lastUpdate: mins(8),
    thread: [],
  },
  {
    id: "VDA-1836", severity: "critical", status: "resolved",
    subject: "Ransomware pattern contained on staging VM",
    customerFacing: "A known ransomware indicator matched activity on your staging VM last week. It was automatically contained and your team restored from snapshot.",
    createdAt: mins(10080), lastUpdate: mins(9000),
    thread: [
      { from: "VDA", at: mins(10050),
        body: "A ransomware indicator matched on your staging VM. Isolated automatically. Requesting restore-from-snapshot confirmation." },
      { from: "You", at: mins(9000),
        body: "Snapshot restored, VM rebuilt from gold image. Thanks." },
    ],
  },
  {
    id: "VDA-1832", severity: "medium", status: "resolved",
    subject: "Monthly compliance summary — March",
    customerFacing: "March compliance: all green. No dropped MFA enrollments, no overdue patches.",
    createdAt: mins(25000), lastUpdate: mins(24800),
    thread: [],
  },
  {
    id: "VDA-1820", severity: "low", status: "resolved",
    subject: "Weekly vulnerability scan — week of Apr 7",
    customerFacing: "3 medium findings this week. All have available patches. We've flagged them in your dashboard.",
    createdAt: mins(14400), lastUpdate: mins(14300),
    thread: [],
  },
  {
    id: "VDA-1815", severity: "high", status: "resolved",
    subject: "Phishing campaign blocked (AP team)",
    customerFacing: "We blocked 12 phishing emails targeting your accounts-payable team last Tuesday. All were quarantined.",
    createdAt: mins(20000), lastUpdate: mins(19900),
    thread: [],
  },
];

const DOCUMENTS = [
  { id: "d1", name: "Service Level Agreement · 2025–2026", kind: "Contract", updated: "Jan 15, 2025" },
  { id: "d2", name: "SOC Response Playbook · Acme", kind: "Runbook", updated: "Mar 30, 2026" },
  { id: "d3", name: "Incident Communication Preferences", kind: "Preferences", updated: "Feb 12, 2026" },
  { id: "d4", name: "Q1 2026 Security Review", kind: "Report", updated: "Apr 3, 2026" },
  { id: "d5", name: "Onboarding Runbook · Acme", kind: "Runbook", updated: "Jan 20, 2025" },
  { id: "d6", name: "Annual Penetration Test · 2025", kind: "Report", updated: "Dec 4, 2025" },
];

const KB_ARTICLES = [
  { id: "k1", title: "What counts as a critical security event?", category: "Basics" },
  { id: "k2", title: "How to confirm a team member's travel plans during an investigation", category: "Response" },
  { id: "k3", title: "Understanding your monthly security report", category: "Reports" },
  { id: "k4", title: "Requesting changes to your monitoring scope", category: "Scope" },
  { id: "k5", title: "After-hours incident escalation", category: "Response" },
  { id: "k6", title: "How VDA handles your data", category: "Privacy" },
];

/* ============================================================
 * HELPERS
 * ============================================================ */
const fmtAgo = (t) => {
  const d = NOW - t;
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
};

const fmtDateShort = (t) => {
  const d = new Date(t);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

// Customer-facing severity translation (no raw CRIT/HIGH/MEDIUM)
const severityLanguage = (sev, status) => {
  if (status === "resolved") return { label: "Resolved", color: T.slaOk };
  if (sev === "critical") return { label: "Needs your attention", color: T.orange };
  if (sev === "high") return { label: "We're working on it", color: T.sevHigh };
  return { label: "Informational", color: T.steel };
};

/* ============================================================
 * HEADER — navy, with phase toggle
 * ============================================================ */

const PhaseToggle = ({ phase, setPhase }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <span style={{
      fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.2em",
      color: T.inkMuted, textTransform: "uppercase", marginRight: 6,
    }}>Scope</span>
    {[
      { id: "p1", label: "Phase 1", sub: "5-week MVP · 4 tiles" },
      { id: "p2", label: "Phase 2", sub: "Weeks 9–14 · 7 tiles" },
    ].map((p) => {
      const active = phase === p.id;
      return (
        <button
          key={p.id}
          onClick={() => setPhase(p.id)}
          title={p.sub}
          style={{
            padding: "6px 12px", borderRadius: 3, cursor: "pointer",
            background: active ? T.orange : "transparent",
            color: active ? "#fff" : T.inkDim,
            border: `1px solid ${active ? T.orange : T.divider}`,
            fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}
        >
          {p.label}
        </button>
      );
    })}
  </div>
);

const Header = ({ phase, setPhase, currentView, goHome }) => {
  const isMobile = useIsMobile();
  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "stretch" : "center",
      justifyContent: "space-between",
      gap: isMobile ? 12 : 0,
      padding: isMobile ? "14px 18px" : "14px 30px",
      background: T.bg, color: T.ink,
      borderBottom: `1px solid ${T.divider}`, position: "sticky", top: 0, zIndex: 10,
    }}>
      {/* Row 1 on mobile: logo + avatar (avatar gets bumped up) */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
        }} onClick={goHome}>
          <div style={{
            width: 28, height: 28, borderRadius: 4,
            background: "rgba(210,105,30,0.14)",
            border: `1px solid rgba(210,105,30,0.35)`,
            display: "flex", alignItems: "center", justifyContent: "center", color: T.orange,
            flexShrink: 0,
          }}><Shield size={15} /></div>
          <div>
            <div style={{
              fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.22em",
              color: T.inkMuted, textTransform: "uppercase",
            }}>VDA LABS</div>
            <div style={{
              fontFamily: T.fontMono, fontSize: 11, letterSpacing: "0.22em",
              color: T.ink, fontWeight: 700, textTransform: "uppercase",
            }}>SENTRY · PORTAL</div>
          </div>
        </div>

        {/* Avatar shown in row 1 on mobile; stays in row 3 slot on desktop */}
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: T.orangeTint, color: T.orange,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: T.fontMono, fontSize: 12, fontWeight: 700,
            }}>KL</div>
          </div>
        )}
      </div>

      {/* Phase toggle */}
      <div style={{
        display: "flex", justifyContent: isMobile ? "center" : "flex-start",
        order: isMobile ? 2 : 0,
      }}>
        <PhaseToggle phase={phase} setPhase={setPhase} />
      </div>

      {/* Desktop-only: user identity on the right */}
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: T.fontBody, fontSize: 12, color: T.ink, fontWeight: 500 }}>
              {THIS_CUSTOMER.primaryContact.name}
            </div>
            <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, letterSpacing: "0.12em" }}>
              {THIS_CUSTOMER.name}
            </div>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: T.orangeTint, color: T.orange,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: T.fontMono, fontSize: 12, fontWeight: 700,
          }}>KL</div>
        </div>
      )}
    </div>
  );
};

/* ============================================================
 * HOME — tile grid
 * ============================================================ */

const PHASE_1_TILES = [
  { id: "open", icon: PlusCircle, title: "Open a case", sub: "Let us know what you're seeing", primary: true },
  { id: "tickets", icon: Inbox, title: "My tickets", sub: "View open and closed cases" },
  { id: "contract", icon: FileText, title: "Contract", sub: "Your agreement at a glance" },
  { id: "documents", icon: Folder, title: "Documents", sub: "Reports, runbooks, records" },
];

const PHASE_2_TILES = [
  { id: "open", icon: PlusCircle, title: "Open a case", sub: "Let us know what you're seeing", primary: true },
  { id: "report", icon: Sparkles, title: "Security Report", sub: "This month, tailored for you", highlight: true },
  { id: "tickets", icon: Inbox, title: "My tickets", sub: "View open and closed cases" },
  { id: "contract", icon: FileText, title: "Contract", sub: "Your agreement at a glance" },
  { id: "documents", icon: Folder, title: "Documents", sub: "Reports, runbooks, records" },
  { id: "dashboards", icon: Gauge, title: "Dashboards", sub: "Security posture at a glance" },
  { id: "kb", icon: HelpCircle, title: "Knowledge base", sub: "Common questions, answered" },
  { id: "services", icon: ShoppingCart, title: "Services", sub: "What's covered by your contract" },
];

const Tile = ({ tile, onClick, isMobile }) => {
  const Icon = tile.icon;
  const isHighlight = tile.highlight;
  return (
    <button onClick={() => onClick(tile.id)} style={{
      background: isHighlight
        ? "linear-gradient(135deg, #FFFFFF 0%, #FDF6EE 100%)"
        : T.bgLightCard,
      border: `1px solid ${isHighlight ? "rgba(210,105,30,0.28)" : T.dividerLight}`,
      borderRadius: 6,
      padding: isMobile ? 20 : 28, textAlign: "left", cursor: "pointer",
      borderLeft: tile.primary
        ? `3px solid ${T.orange}`
        : isHighlight
          ? `3px solid ${T.orange}`
          : `1px solid ${T.dividerLight}`,
      boxShadow: isHighlight
        ? "0 2px 8px rgba(210,105,30,0.12)"
        : "0 1px 2px rgba(0,0,0,0.04)",
      transition: "all 160ms ease",
      display: "flex", flexDirection: "column",
      gap: isMobile ? 10 : 14,
      minHeight: isMobile ? 120 : 148,
      position: "relative",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = isHighlight
        ? "0 6px 20px rgba(210,105,30,0.18)"
        : "0 4px 14px rgba(0,0,0,0.08)";
      e.currentTarget.style.transform = "translateY(-1px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = isHighlight
        ? "0 2px 8px rgba(210,105,30,0.12)"
        : "0 1px 2px rgba(0,0,0,0.04)";
      e.currentTarget.style.transform = "translateY(0)";
    }}
    >
      {isHighlight && (
        <span style={{
          position: "absolute", top: 12, right: 12,
          fontFamily: T.fontMono, fontSize: 8, letterSpacing: "0.2em",
          color: T.orange, fontWeight: 700, textTransform: "uppercase",
          background: "rgba(210,105,30,0.1)",
          border: "1px solid rgba(210,105,30,0.3)",
          borderRadius: 999, padding: "3px 8px",
        }}>NEW</span>
      )}
      <div style={{
        width: isMobile ? 38 : 44, height: isMobile ? 38 : 44, borderRadius: 8,
        background: tile.primary
          ? T.orangeTint
          : isHighlight
            ? "linear-gradient(135deg, rgba(210,105,30,0.12) 0%, rgba(210,105,30,0.06) 100%)"
            : "#EEF0F3",
        color: tile.primary || isHighlight ? T.orange : T.steel,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}><Icon size={isMobile ? 18 : 22} /></div>
      <div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: isMobile ? 17 : 20, color: T.inkDark,
          fontWeight: 500, lineHeight: 1.2, marginBottom: 4,
        }}>{tile.title}</div>
        <div style={{
          fontFamily: T.fontBody, fontSize: isMobile ? 12 : 13, color: T.inkDarkDim, lineHeight: 1.45,
        }}>{tile.sub}</div>
      </div>
    </button>
  );
};

const HomeView = ({ phase, tickets, onNavigate }) => {
  const isMobile = useIsMobile();
  const openCount = tickets.filter((t) => t.status !== "resolved").length;
  const tiles = phase === "p1" ? PHASE_1_TILES : PHASE_2_TILES;

  return (
    <div style={{
      maxWidth: 1060, margin: "0 auto",
      padding: isMobile ? "28px 18px" : "40px 30px",
    }}>
      {/* Greeting */}
      <div style={{ marginBottom: isMobile ? 24 : 32 }}>
        <div style={{
          fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.2em",
          color: T.orange, fontWeight: 700, textTransform: "uppercase", marginBottom: 10,
        }}>Welcome back</div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: isMobile ? 32 : 44, color: T.inkDark,
          fontWeight: 400, lineHeight: 1.1, marginBottom: 4,
        }}>Good afternoon, {THIS_CUSTOMER.primaryContact.name.split(" ")[0]}.</div>
      </div>

      {/* Open cases status card — prominent and clickable */}
      {(() => {
        const needsAttention = tickets.filter((t) =>
          (t.severity === "critical" || t.severity === "high") && t.status !== "resolved"
        ).length;
        const inProgress = openCount - needsAttention;

        if (openCount === 0) {
          return (
            <div style={{
              marginBottom: isMobile ? 28 : 36,
              padding: isMobile ? "18px 20px" : "22px 26px",
              background: T.bgLightCard,
              border: `1px solid ${T.dividerLight}`,
              borderLeft: `3px solid ${T.slaOk}`,
              borderRadius: 6,
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: `${T.slaOk}18`, color: T.slaOk,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}><Check size={18} /></div>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: isMobile ? 17 : 20,
                color: T.inkDark, lineHeight: 1.35,
              }}>
                A quiet afternoon — nothing needs you right now.
              </div>
            </div>
          );
        }

        return (
          <button
            onClick={() => onNavigate("tickets")}
            style={{
              marginBottom: isMobile ? 28 : 36,
              width: "100%", textAlign: "left", cursor: "pointer",
              padding: isMobile ? "18px 20px" : "22px 26px",
              background: needsAttention > 0
                ? "linear-gradient(135deg, #FFFFFF 0%, #FDF6EE 100%)"
                : T.bgLightCard,
              border: `1px solid ${needsAttention > 0 ? "rgba(210,105,30,0.28)" : T.dividerLight}`,
              borderLeft: `3px solid ${needsAttention > 0 ? T.orange : T.steel}`,
              borderRadius: 6,
              display: "flex", alignItems: "center", gap: 16,
              boxShadow: needsAttention > 0
                ? "0 2px 8px rgba(210,105,30,0.10)"
                : "0 1px 2px rgba(0,0,0,0.04)",
              transition: "all 160ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = needsAttention > 0
                ? "0 6px 18px rgba(210,105,30,0.16)"
                : "0 4px 12px rgba(0,0,0,0.08)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = needsAttention > 0
                ? "0 2px 8px rgba(210,105,30,0.10)"
                : "0 1px 2px rgba(0,0,0,0.04)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{
              width: isMobile ? 44 : 52, height: isMobile ? 44 : 52, borderRadius: "50%",
              background: needsAttention > 0 ? T.orangeTint : `${T.steel}18`,
              color: needsAttention > 0 ? T.orange : T.steel,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {needsAttention > 0
                ? <AlertCircle size={isMobile ? 22 : 26} />
                : <Inbox size={isMobile ? 22 : 26} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap",
                marginBottom: 4,
              }}>
                <span style={{
                  fontFamily: T.fontDisplay, fontSize: isMobile ? 26 : 32,
                  color: needsAttention > 0 ? T.orange : T.inkDark,
                  fontWeight: 500, lineHeight: 1,
                }}>{openCount}</span>
                <span style={{
                  fontFamily: T.fontDisplay, fontSize: isMobile ? 18 : 22,
                  color: T.inkDark, fontWeight: 400, lineHeight: 1.2,
                }}>
                  open case{openCount === 1 ? "" : "s"}
                </span>
              </div>
              <div style={{
                fontFamily: T.fontBody, fontSize: isMobile ? 13 : 14,
                color: T.inkDarkDim, lineHeight: 1.45,
              }}>
                {needsAttention > 0 ? (
                  <>
                    <span style={{ color: T.orange, fontWeight: 600 }}>
                      {needsAttention} need{needsAttention === 1 ? "s" : ""} your attention
                    </span>
                    {inProgress > 0 && <> · {inProgress} in progress with VDA</>}
                  </>
                ) : (
                  <>VDA is working on all of them — nothing needs you right now.</>
                )}
              </div>
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              flexShrink: 0, color: T.inkDarkDim,
            }}>
              {!isMobile && (
                <span style={{
                  fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.15em",
                  fontWeight: 700, textTransform: "uppercase",
                }}>View all</span>
              )}
              <ChevronRight size={isMobile ? 18 : 16} />
            </div>
          </button>
        );
      })()}

      {/* Phase-aware tile count indicator — makes the toggle visible */}
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        marginBottom: 14, gap: 10, flexWrap: "wrap",
      }}>
        <div style={{
          fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.22em",
          color: T.inkDarkMuted, fontWeight: 700, textTransform: "uppercase",
        }}>
          {phase === "p1" ? "Phase 1 · 4 tiles" : "Phase 2 · 7 tiles"}
        </div>
        <div style={{
          fontFamily: T.fontBody, fontSize: 12, color: T.inkDarkMuted,
        }}>
          {phase === "p1" ? "5-week MVP scope" : "Weeks 9–14 expansion"}
        </div>
      </div>

      {/* Tiles — grid differs by phase: P1 uses wider tiles (4 at 260), P2 uses tighter (7 at 200) */}
      <div style={{
        display: "grid",
        gap: isMobile ? 12 : 16,
        gridTemplateColumns: isMobile
          ? "1fr"
          : phase === "p1"
            ? "repeat(auto-fit, minmax(240px, 1fr))"
            : "repeat(auto-fit, minmax(200px, 1fr))",
      }}>
        {tiles.map((t) => <Tile key={t.id} tile={t} onClick={onNavigate} isMobile={isMobile} />)}
      </div>

      {/* Scope explainer */}
      <div style={{
        marginTop: isMobile ? 28 : 40,
        padding: isMobile ? "14px 16px" : "18px 22px",
        background: "rgba(210,105,30,0.06)",
        border: `1px solid rgba(210,105,30,0.25)`,
        borderLeft: `3px solid ${T.orange}`, borderRadius: 4,
      }}>
        <div style={{
          fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.2em",
          color: T.orange, fontWeight: 700, textTransform: "uppercase", marginBottom: 6,
        }}>{phase === "p1" ? "Currently showing · Phase 1" : "Currently showing · Phase 2"}</div>
        <div style={{
          fontFamily: T.fontBody, fontSize: 13, color: T.inkDark, lineHeight: 1.55,
        }}>
          {phase === "p1"
            ? "Four tiles — the scope Jim explicitly asked for on the discovery call. This is what ships in the 5-week MVP: Home, Open a case, My Tickets, Documents. Toggle to Phase 2 to see the expanded scope."
            : "Seven tiles — the Phase 2 expansion planned for weeks 9–14. Adds Dashboards, Knowledge Base, and Services alongside the core four. Quotes, invoices, and scheduled meetings remain explicitly out of scope."}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
 * OPEN A CASE
 * ============================================================ */
const OpenCaseView = ({ onBack, onSubmit }) => {
  const isMobile = useIsMobile();
  const [urgency, setUrgency] = useState("standard");
  const [category, setCategory] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!subject.trim() || !description.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      onSubmit({ urgency, category, subject, description });
    }, 1100);
  };

  if (submitted) {
    return (
      <div style={{
        maxWidth: 560, margin: isMobile ? "40px auto" : "80px auto",
        padding: isMobile ? 24 : 40, textAlign: "center",
        background: T.bgLightCard, border: `1px solid ${T.dividerLight}`, borderRadius: 8,
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: "50%", margin: "0 auto 20px",
          background: `${T.slaOk}22`, color: T.slaOk,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><Check size={26} /></div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: 28, color: T.inkDark,
          fontWeight: 400, marginBottom: 10,
        }}>Your case is open.</div>
        <div style={{
          fontFamily: T.fontBody, fontSize: 15, color: T.inkDarkDim, lineHeight: 1.5,
        }}>
          An analyst will review shortly. You'll see updates in My Tickets.
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 720, margin: "0 auto",
      padding: isMobile ? "24px 18px" : "40px 30px",
    }}>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "transparent", border: "none", cursor: "pointer",
        fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.15em",
        color: T.inkDarkDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 20,
      }}><ArrowLeft size={13} /> BACK</button>

      <div style={{
        fontFamily: T.fontDisplay, fontSize: isMobile ? 28 : 38, color: T.inkDark,
        fontWeight: 400, marginBottom: 10,
      }}>Open a new case</div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: isMobile ? 15 : 18, color: T.inkDarkDim,
        fontStyle: "italic", marginBottom: 36, lineHeight: 1.45,
      }}>
        Tell us what you're seeing. An analyst will pick it up — usually within minutes.
      </div>

      {/* Urgency */}
      <div style={{ marginBottom: 24 }}>
        <label style={{
          display: "block", fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.2em",
          color: T.inkDarkDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 10,
        }}>How urgent?</label>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
          gap: 10,
        }}>
          {[
            { id: "standard", label: "Standard", sub: "Informational or FYI", color: T.steel },
            { id: "important", label: "Important", sub: "Needs a response today", color: T.sevHigh },
            { id: "urgent", label: "Urgent", sub: "Active threat or incident", color: T.orange },
          ].map((u) => (
            <button key={u.id} onClick={() => setUrgency(u.id)} style={{
              padding: 16, borderRadius: 6, cursor: "pointer",
              background: urgency === u.id ? `${u.color}18` : T.bgLightCard,
              border: `2px solid ${urgency === u.id ? u.color : T.dividerLight}`,
              textAlign: "left",
            }}>
              <div style={{
                fontFamily: T.fontBody, fontSize: 14, color: T.inkDark, fontWeight: 600, marginBottom: 3,
              }}>{u.label}</div>
              <div style={{ fontFamily: T.fontBody, fontSize: 11, color: T.inkDarkDim }}>{u.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div style={{ marginBottom: 24 }}>
        <label style={{
          display: "block", fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.2em",
          color: T.inkDarkDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 10,
        }}>What's it about?</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{
          width: "100%", padding: 14, background: T.bgLightCard,
          border: `1px solid ${T.dividerLight}`, borderRadius: 4,
          fontFamily: T.fontBody, fontSize: 14, color: T.inkDark,
        }}>
          <option value="">Select a category…</option>
          <option value="incident">Security incident or alert</option>
          <option value="request">Change request (scope, users, etc.)</option>
          <option value="question">Question about a report or finding</option>
          <option value="escalation">Escalation or complaint</option>
          <option value="other">Something else</option>
        </select>
      </div>

      {/* Subject */}
      <div style={{ marginBottom: 24 }}>
        <label style={{
          display: "block", fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.2em",
          color: T.inkDarkDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 10,
        }}>Subject</label>
        <input
          value={subject} onChange={(e) => setSubject(e.target.value)}
          placeholder="One-line summary"
          style={{
            width: "100%", padding: 14, background: T.bgLightCard,
            border: `1px solid ${T.dividerLight}`, borderRadius: 4,
            fontFamily: T.fontBody, fontSize: 14, color: T.inkDark,
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Description */}
      <div style={{ marginBottom: 32 }}>
        <label style={{
          display: "block", fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.2em",
          color: T.inkDarkDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 10,
        }}>What's happening?</label>
        <textarea
          value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Be as specific as you can — what you saw, when, and anything that feels relevant."
          style={{
            width: "100%", minHeight: 160, resize: "vertical",
            padding: 14, background: T.bgLightCard,
            border: `1px solid ${T.dividerLight}`, borderRadius: 4,
            fontFamily: T.fontBody, fontSize: 14, color: T.inkDark, lineHeight: 1.55,
            boxSizing: "border-box",
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!subject.trim() || !description.trim()}
        style={{
          padding: "14px 22px", borderRadius: 6,
          background: T.bg, color: "#fff", border: "none",
          fontFamily: T.fontBody, fontSize: 15, fontWeight: 500,
          cursor: (!subject.trim() || !description.trim()) ? "not-allowed" : "pointer",
          opacity: (!subject.trim() || !description.trim()) ? 0.4 : 1,
          display: "flex", alignItems: "center", gap: 8,
          width: isMobile ? "100%" : "auto",
          justifyContent: isMobile ? "center" : "flex-start",
        }}
      >Open this case <ArrowRight size={16} /></button>
    </div>
  );
};

/* ============================================================
 * MY TICKETS
 * ============================================================ */

const TicketCard = ({ ticket, onOpen, onArchive }) => {
  const sev = severityLanguage(ticket.severity, ticket.status);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchMoved = useRef(false);
  const COMMIT_PX = 140;
  const MAX_SWIPE = 220;

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
    // Cancel if vertical scroll wins
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
      touchStartX.current = null;
      setSwipeX(0);
      setSwiping(false);
      return;
    }
    if (Math.abs(dx) > 6) touchMoved.current = true;
    // Only allow swipe-left (archive gesture) — no swipe-right for customers
    const clamped = Math.max(-MAX_SWIPE, Math.min(0, dx));
    setSwipeX(clamped);
  };
  const onTouchEnd = () => {
    if (touchStartX.current == null) { setSwiping(false); return; }
    if (swipeX <= -COMMIT_PX && onArchive) {
      onArchive(ticket.id);
    }
    setSwipeX(0);
    setSwiping(false);
    touchStartX.current = null;
  };
  const handleClick = (e) => {
    if (touchMoved.current) {
      e.preventDefault(); e.stopPropagation();
      touchMoved.current = false;
      return;
    }
    onOpen(ticket.id);
  };

  const showArchiveZone = swipeX < -20;
  const archiveOpacity = Math.min(1, -swipeX / COMMIT_PX);

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 6 }}>
      {showArchiveZone && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          paddingRight: 22, pointerEvents: "none",
          background: `rgba(107,147,184,${0.12 + archiveOpacity * 0.18})`,
          borderRadius: 6,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            opacity: archiveOpacity,
            transform: `scale(${0.85 + archiveOpacity * 0.15})`,
          }}>
            <span style={{
              fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.2em", color: T.steel, textTransform: "uppercase",
            }}>
              {swipeX <= -COMMIT_PX ? "Release to archive" : "Archive"}
            </span>
            <Archive size={18} style={{ color: T.steel }} />
          </div>
        </div>
      )}
      <button
        onClick={handleClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={{
          background: T.bgLightCard, border: `1px solid ${T.dividerLight}`, borderRadius: 6,
          padding: 20, textAlign: "left", cursor: "pointer", width: "100%",
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? "none" : "all 220ms cubic-bezier(0.2, 0.9, 0.3, 1)",
          position: "relative", zIndex: 1,
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = T.steel}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = T.dividerLight}
      >
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6,
      }}>
        <div style={{
          fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.14em",
          color: T.inkDarkMuted, fontWeight: 600,
        }}>{ticket.id}</div>
        <div style={{
          fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.12em",
          color: T.inkDarkMuted, textTransform: "uppercase",
        }}>Opened {fmtAgo(ticket.createdAt)}</div>
      </div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 19, color: T.inkDark,
        fontWeight: 500, lineHeight: 1.3, marginBottom: 10,
      }}>{ticket.subject}</div>
      <div style={{
        fontFamily: T.fontBody, fontSize: 13, color: T.inkDarkDim,
        lineHeight: 1.55, marginBottom: 14,
      }}>{ticket.customerFacing}</div>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "4px 10px", borderRadius: 999,
          background: `${sev.color}18`, border: `1px solid ${sev.color}55`,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: sev.color }} />
          <span style={{
            fontFamily: T.fontBody, fontSize: 12, color: sev.color, fontWeight: 500,
          }}>{sev.label}</span>
        </span>
        <div style={{ flex: 1 }} />
        <span style={{
          fontFamily: T.fontMono, fontSize: 10, color: T.inkDarkMuted, letterSpacing: "0.1em",
        }}>Last update {fmtAgo(ticket.lastUpdate)}</span>
        <ChevronRight size={14} style={{ color: T.inkDarkDim }} />
      </div>
      </button>
    </div>
  );
};

const TicketsListView = ({ tickets, onBack, onOpenTicket, showToast }) => {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("all");
  const [archivedIds, setArchivedIds] = useState(new Set());
  const handleArchive = (ticketId) => {
    setArchivedIds((prev) => new Set([...prev, ticketId]));
    if (showToast) showToast(`${ticketId} archived from view`);
  };
  const visible = tickets.filter((t) => !archivedIds.has(t.id));
  const filtered = filter === "all"
    ? visible
    : filter === "open"
    ? visible.filter((t) => t.status !== "resolved")
    : visible.filter((t) => t.status === "resolved");

  return (
    <div style={{
      maxWidth: 880, margin: "0 auto",
      padding: isMobile ? "24px 18px" : "40px 30px",
    }}>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "transparent", border: "none", cursor: "pointer",
        fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.15em",
        color: T.inkDarkDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 20,
      }}><ArrowLeft size={13} /> BACK</button>

      <div style={{
        fontFamily: T.fontDisplay, fontSize: isMobile ? 28 : 38, color: T.inkDark,
        fontWeight: 400, marginBottom: 6,
      }}>My tickets</div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: isMobile ? 14 : 17, color: T.inkDarkDim,
        fontStyle: "italic", marginBottom: 24,
      }}>Every case we've opened on your behalf. Open cases first.</div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { id: "all", label: "All" },
          { id: "open", label: "Open" },
          { id: "resolved", label: "Resolved" },
        ].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: "6px 14px", borderRadius: 4, cursor: "pointer",
            background: filter === f.id ? T.inkDark : "transparent",
            color: filter === f.id ? "#fff" : T.inkDarkDim,
            border: `1px solid ${filter === f.id ? T.inkDark : T.dividerLight}`,
            fontFamily: T.fontBody, fontSize: 13, fontWeight: 500,
          }}>{f.label}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: "grid", gap: 12 }}>
        {filtered.sort((a, b) => b.createdAt - a.createdAt).map((t) => (
          <TicketCard key={t.id} ticket={t} onOpen={onOpenTicket} onArchive={handleArchive} />
        ))}
      </div>
    </div>
  );
};

/* ============================================================
 * TICKET DETAIL (customer view)
 * ============================================================ */

const TicketDetailView = ({ ticket, onBack }) => {
  const isMobile = useIsMobile();
  const sev = severityLanguage(ticket.severity, ticket.status);
  const [reply, setReply] = useState("");

  return (
    <div style={{
      maxWidth: 760, margin: "0 auto",
      padding: isMobile ? "24px 18px" : "40px 30px",
    }}>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "transparent", border: "none", cursor: "pointer",
        fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.15em",
        color: T.inkDarkDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 20,
      }}><ArrowLeft size={13} /> BACK TO MY TICKETS</button>

      <div style={{
        fontFamily: T.fontMono, fontSize: 11, letterSpacing: "0.14em",
        color: T.inkDarkMuted, fontWeight: 600, marginBottom: 10,
      }}>{ticket.id}</div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: isMobile ? 24 : 32, color: T.inkDark,
        fontWeight: 400, lineHeight: 1.2, marginBottom: 16,
      }}>{ticket.subject}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 12px", borderRadius: 999,
          background: `${sev.color}18`, border: `1px solid ${sev.color}55`,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: sev.color }} />
          <span style={{ fontFamily: T.fontBody, fontSize: 13, color: sev.color, fontWeight: 500 }}>
            {sev.label}
          </span>
        </span>
        <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkDarkMuted, letterSpacing: "0.12em" }}>
          Opened {fmtAgo(ticket.createdAt)}
        </span>
      </div>

      {/* Customer-facing summary */}
      <div style={{
        padding: 22, background: T.bgLightCard,
        border: `1px solid ${T.dividerLight}`, borderRadius: 6, marginBottom: 28,
      }}>
        <div style={{
          fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.2em",
          color: T.orange, fontWeight: 700, textTransform: "uppercase", marginBottom: 10,
        }}>Summary</div>
        <div style={{
          fontFamily: T.fontBody, fontSize: 15, color: T.inkDark, lineHeight: 1.6,
        }}>{ticket.customerFacing}</div>
      </div>

      {/* Thread */}
      {ticket.thread.length > 0 && (
        <>
          <div style={{
            fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.2em",
            color: T.orange, fontWeight: 700, textTransform: "uppercase", marginBottom: 14,
          }}>Conversation</div>
          <div style={{ display: "grid", gap: 14, marginBottom: 28 }}>
            {ticket.thread.map((msg, i) => (
              <div key={i} style={{
                padding: 18, borderRadius: 6,
                background: msg.from === "VDA" ? T.bgLightCard : T.orangeTint,
                border: `1px solid ${msg.from === "VDA" ? T.dividerLight : "rgba(210,105,30,0.25)"}`,
                borderLeft: msg.from === "VDA" ? `3px solid ${T.steel}` : `3px solid ${T.orange}`,
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "baseline",
                  marginBottom: 8,
                }}>
                  <div style={{
                    fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.14em",
                    color: msg.from === "VDA" ? T.steel : T.orange, fontWeight: 700,
                    textTransform: "uppercase",
                  }}>{msg.from === "VDA" ? "VDA Analyst" : "You"}</div>
                  <div style={{
                    fontFamily: T.fontMono, fontSize: 9, color: T.inkDarkMuted,
                    letterSpacing: "0.1em",
                  }}>{fmtAgo(msg.at)}</div>
                </div>
                <div style={{
                  fontFamily: T.fontBody, fontSize: 14, color: T.inkDark, lineHeight: 1.55,
                }}>{msg.body}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Reply form (only for open tickets) */}
      {ticket.status !== "resolved" && (
        <div style={{
          padding: 22, background: T.bgLightCard,
          border: `1px solid ${T.dividerLight}`, borderRadius: 6,
        }}>
          <div style={{
            fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.2em",
            color: T.inkDarkDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 10,
          }}>Reply</div>
          <textarea
            value={reply} onChange={(e) => setReply(e.target.value)}
            placeholder="Add more context, answer our question, or let us know anything we should be aware of."
            style={{
              width: "100%", minHeight: 120, resize: "vertical", padding: 14,
              background: T.bgLight, border: `1px solid ${T.dividerLight}`, borderRadius: 4,
              fontFamily: T.fontBody, fontSize: 14, color: T.inkDark, lineHeight: 1.55, marginBottom: 12,
            }}
          />
          <button
            disabled={reply.trim().length < 3}
            onClick={() => { setReply(""); }}
            style={{
              padding: "10px 18px", borderRadius: 4,
              background: reply.trim().length < 3 ? T.dividerLight : T.inkDark,
              color: reply.trim().length < 3 ? T.inkDarkMuted : "#fff",
              border: "none",
              fontFamily: T.fontBody, fontSize: 14, fontWeight: 500,
              cursor: reply.trim().length < 3 ? "not-allowed" : "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          ><Send size={13} /> Send reply</button>
        </div>
      )}
    </div>
  );
};

/* ============================================================
 * CONTRACT
 * ============================================================ */

const ContractView = ({ onBack }) => {
  const isMobile = useIsMobile();
  const c = THIS_CUSTOMER.contract;
  return (
    <div style={{
      maxWidth: 760, margin: "0 auto",
      padding: isMobile ? "24px 18px" : "40px 30px",
    }}>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "transparent", border: "none", cursor: "pointer",
        fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.15em",
        color: T.inkDarkDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 20,
      }}><ArrowLeft size={13} /> BACK</button>

      <div style={{
        fontFamily: T.fontDisplay, fontSize: isMobile ? 28 : 38, color: T.inkDark, marginBottom: 6,
      }}>Your contract</div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: isMobile ? 14 : 17, color: T.inkDarkDim,
        fontStyle: "italic", marginBottom: 32,
      }}>The services VDA is delivering, at a glance.</div>

      <div style={{
        padding: isMobile ? 18 : 24, background: T.bgLightCard,
        border: `1px solid ${T.dividerLight}`, borderRadius: 6, marginBottom: 20,
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
          gap: isMobile ? 14 : 20, marginBottom: isMobile ? 0 : 20,
        }}>
          {[
            { label: "Tier", value: c.tier },
            { label: "Renewal", value: c.renewalDate },
            { label: "Monthly", value: c.monthlySpend },
          ].map((f) => (
            <div key={f.label}>
              <div style={{
                fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.2em",
                color: T.inkDarkMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 4,
              }}>{f.label}</div>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: 20, color: T.inkDark, fontWeight: 500,
              }}>{f.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.2em",
        color: T.orange, fontWeight: 700, textTransform: "uppercase", marginBottom: 12,
      }}>Services in scope</div>
      <div style={{ display: "grid", gap: 10 }}>
        {c.services.map((s) => (
          <div key={s.name} style={{
            padding: 18, background: T.bgLightCard,
            border: `1px solid ${T.dividerLight}`, borderRadius: 6,
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: s.status === "active" ? T.slaOk : T.sevHigh,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: T.fontBody, fontSize: 14, color: T.inkDark, fontWeight: 500,
              }}>{s.name}</div>
              <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkDarkMuted, letterSpacing: "0.1em", marginTop: 2 }}>
                {s.count}
              </div>
            </div>
            <div style={{
              fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.14em",
              color: s.status === "active" ? T.slaOk : T.sevHigh,
              fontWeight: 700, textTransform: "uppercase",
            }}>{s.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============================================================
 * DOCUMENTS
 * ============================================================ */
const DocumentsView = ({ onBack }) => {
  const isMobile = useIsMobile();
  return (
  <div style={{
    maxWidth: 760, margin: "0 auto",
    padding: isMobile ? "24px 18px" : "40px 30px",
  }}>
    <button onClick={onBack} style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "transparent", border: "none", cursor: "pointer",
      fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.15em",
      color: T.inkDarkDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 20,
    }}><ArrowLeft size={13} /> BACK</button>

    <div style={{ fontFamily: T.fontDisplay, fontSize: isMobile ? 28 : 38, color: T.inkDark, marginBottom: 6 }}>
      Documents
    </div>
    <div style={{
      fontFamily: T.fontDisplay, fontSize: isMobile ? 14 : 17, color: T.inkDarkDim, fontStyle: "italic", marginBottom: 32,
    }}>Contracts, runbooks, reports, and records shared with your team.</div>

    <div style={{ display: "grid", gap: 10 }}>
      {DOCUMENTS.map((d) => (
        <div key={d.id} style={{
          padding: 16, background: T.bgLightCard,
          border: `1px solid ${T.dividerLight}`, borderRadius: 6,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 4, background: "#EEF0F3", color: T.steel,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><FileText size={18} /></div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: T.fontBody, fontSize: 14, color: T.inkDark, fontWeight: 500,
            }}>{d.name}</div>
            <div style={{
              fontFamily: T.fontMono, fontSize: 10, color: T.inkDarkMuted, letterSpacing: "0.1em", marginTop: 2,
            }}>{d.kind} · Updated {d.updated}</div>
          </div>
          <ChevronRight size={14} style={{ color: T.inkDarkDim }} />
        </div>
      ))}
    </div>
  </div>
  );
};

/* ============================================================
 * DASHBOARDS (Phase 2)
 * ============================================================ */

const DashboardsView = ({ tickets, onBack }) => {
  const isMobile = useIsMobile();
  const open = tickets.filter((t) => t.status !== "resolved").length;
  const resolved30d = tickets.filter((t) => t.status === "resolved").length;

  return (
    <div style={{
      maxWidth: 880, margin: "0 auto",
      padding: isMobile ? "24px 18px" : "40px 30px",
    }}>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "transparent", border: "none", cursor: "pointer",
        fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.15em",
        color: T.inkDarkDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 20,
      }}><ArrowLeft size={13} /> BACK</button>

      <div style={{
        fontFamily: T.fontDisplay, fontSize: isMobile ? 28 : 38, color: T.inkDark, marginBottom: 6,
      }}>Your security posture</div>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: isMobile ? 14 : 17, color: T.inkDarkDim,
        fontStyle: "italic", marginBottom: 32,
      }}>What VDA's done for you — this week, this month, this year.</div>

      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
        gap: 16, marginBottom: 28,
      }}>
        {[
          { label: "Open cases", value: open, caption: "active right now" },
          { label: "Resolved · last 30 days", value: resolved30d, caption: "cases closed" },
          { label: "Email phishing blocked", value: "124", caption: "this month" },
        ].map((m) => (
          <div key={m.label} style={{
            padding: 22, background: T.bgLightCard,
            border: `1px solid ${T.dividerLight}`, borderRadius: 6,
          }}>
            <div style={{
              fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.2em",
              color: T.inkDarkMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 8,
            }}>{m.label}</div>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: 44, color: T.orange, fontWeight: 400, lineHeight: 1,
            }}>{m.value}</div>
            <div style={{
              fontFamily: T.fontBody, fontSize: 12, color: T.inkDarkDim, marginTop: 6,
            }}>{m.caption}</div>
          </div>
        ))}
      </div>

      <div style={{
        padding: 22, background: T.bgLightCard,
        border: `1px solid ${T.dividerLight}`, borderRadius: 6,
      }}>
        <div style={{
          fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.2em",
          color: T.orange, fontWeight: 700, textTransform: "uppercase", marginBottom: 10,
        }}>This month's take</div>
        <div style={{
          fontFamily: T.fontDisplay, fontSize: isMobile ? 16 : 20, color: T.inkDark,
          lineHeight: 1.4, fontStyle: "italic",
        }}>
          A steady month. We surfaced {open + resolved30d} events across your environment — most routine,
          one worth your attention (the CFO login, still in progress). No data reached your team that shouldn't have.
        </div>
      </div>
    </div>
  );
};

/* ============================================================
 * KNOWLEDGE BASE (Phase 2)
 * ============================================================ */
const KBView = ({ onBack }) => {
  const isMobile = useIsMobile();
  return (
  <div style={{
    maxWidth: 760, margin: "0 auto",
    padding: isMobile ? "24px 18px" : "40px 30px",
  }}>
    <button onClick={onBack} style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "transparent", border: "none", cursor: "pointer",
      fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.15em",
      color: T.inkDarkDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 20,
    }}><ArrowLeft size={13} /> BACK</button>

    <div style={{ fontFamily: T.fontDisplay, fontSize: isMobile ? 28 : 38, color: T.inkDark, marginBottom: 6 }}>
      Knowledge base
    </div>
    <div style={{
      fontFamily: T.fontDisplay, fontSize: isMobile ? 14 : 17, color: T.inkDarkDim, fontStyle: "italic", marginBottom: 32,
    }}>Common questions, answered once.</div>

    <div style={{ display: "grid", gap: 10 }}>
      {KB_ARTICLES.map((a) => (
        <div key={a.id} style={{
          padding: 18, background: T.bgLightCard,
          border: `1px solid ${T.dividerLight}`, borderRadius: 6,
          display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
        }}>
          <HelpCircle size={18} style={{ color: T.steel, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: T.fontBody, fontSize: 14, color: T.inkDark, fontWeight: 500,
            }}>{a.title}</div>
            <div style={{
              fontFamily: T.fontMono, fontSize: 10, color: T.inkDarkMuted, letterSpacing: "0.12em", marginTop: 2,
            }}>{a.category.toUpperCase()}</div>
          </div>
          <ChevronRight size={14} style={{ color: T.inkDarkDim }} />
        </div>
      ))}
    </div>
  </div>
  );
};

/* ============================================================
 * SERVICES (Phase 2)
 * ============================================================ */
const ServicesView = ({ onBack }) => {
  const isMobile = useIsMobile();
  return (
  <div style={{
    maxWidth: 760, margin: "0 auto",
    padding: isMobile ? "24px 18px" : "40px 30px",
  }}>
    <button onClick={onBack} style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "transparent", border: "none", cursor: "pointer",
      fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.15em",
      color: T.inkDarkDim, fontWeight: 700, textTransform: "uppercase", marginBottom: 20,
    }}><ArrowLeft size={13} /> BACK</button>

    <div style={{ fontFamily: T.fontDisplay, fontSize: isMobile ? 28 : 38, color: T.inkDark, marginBottom: 6 }}>
      Services
    </div>
    <div style={{
      fontFamily: T.fontDisplay, fontSize: isMobile ? 14 : 17, color: T.inkDarkDim, fontStyle: "italic", marginBottom: 32,
    }}>What's covered — and what you can add.</div>

    <div style={{ display: "grid", gap: 10 }}>
      {THIS_CUSTOMER.contract.services.map((s) => (
        <div key={s.name} style={{
          padding: 18, background: T.bgLightCard,
          border: `1px solid ${T.dividerLight}`, borderRadius: 6,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8,
            background: "#EEF0F3", color: T.steel,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><Shield size={18} /></div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: T.fontBody, fontSize: 14, color: T.inkDark, fontWeight: 500,
            }}>{s.name}</div>
            <div style={{
              fontFamily: T.fontMono, fontSize: 11, color: T.inkDarkMuted, letterSpacing: "0.1em", marginTop: 2,
            }}>{s.count}</div>
          </div>
          <div style={{
            fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.14em",
            color: s.status === "active" ? T.slaOk : T.sevHigh, fontWeight: 700, textTransform: "uppercase",
          }}>{s.status}</div>
        </div>
      ))}
    </div>
  </div>
  );
};

/* ============================================================
 * SECURITY REPORT (Phase 2) — the AI-generated "wow" feature
 *
 * Jim's heartburn on the discovery call: their current reports are a 5-year-old
 * template — "monthly meeting. Here's all the log sources we're pulling in.
 * Here's your top 10 sources that are creating activity." Customers want MORE.
 * Not semi-auto, not generic — AI-auto-generated, tailored, narrative, premium.
 *
 * This report is rendered as if it was generated overnight, reviewed by Morgan
 * Hale (SOC analyst), and published for Kate Lin at Acme Corp. Every paragraph
 * names something specific to Acme — Tom Webb, the 342 endpoints, the AP team,
 * the CFO login incident still in progress. That specificity is the product.
 * ============================================================ */
const SecurityReportView = ({ tickets, onBack }) => {
  const isMobile = useIsMobile();
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  // Derive metrics from live ticket state — feels dynamic, reinforces "tailored for you"
  const resolved = tickets.filter((t) => t.status === "resolved");
  const openCount = tickets.filter((t) => t.status !== "resolved").length;
  const critOpen = tickets.filter((t) =>
    t.severity === "critical" && t.status !== "resolved"
  );
  const criticalIncident = critOpen[0] || tickets.find((t) => t.severity === "critical");

  // Report metadata
  const reportMonth = "April 2026";
  const generatedAt = "Apr 30, 2026 · 02:14 AM UTC";
  const analyst = { name: "Morgan Hale", role: "SOC Analyst · VDA Labs", initials: "MH" };

  // === PDF download: opens a print-optimized HTML in a new window, triggers print dialog ===
  // Uses window.open() with a Blob fallback — same pattern documented in BUS_FACTOR.md.
  // Users save as PDF via the browser's native print-to-PDF feature.
  const handleOpenInBrowser = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${THIS_CUSTOMER.name} · Security Report · ${reportMonth}</title>
<style>
  @page { size: letter; margin: 0.6in; }
  * { box-sizing: border-box; }
  body {
    font-family: Calibri, 'Segoe UI', system-ui, sans-serif;
    color: #1A2E47; background: #fff;
    margin: 0; padding: 0; line-height: 1.55;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .wrap { max-width: 7in; margin: 0 auto; }
  .eyebrow {
    font-family: Consolas, monospace; font-size: 10px; letter-spacing: 0.28em;
    color: #D2691E; font-weight: 700; text-transform: uppercase;
    margin-bottom: 18px; padding-bottom: 2px;
  }
  .eyebrow .rule { display: inline-block; width: 24px; height: 1px; background: #D2691E; vertical-align: middle; margin-right: 10px; }
  h1 {
    font-family: Georgia, serif; font-size: 40px; font-weight: 500;
    line-height: 1.08; letter-spacing: -0.02em; color: #1A2E47;
    margin: 0 0 14px; page-break-after: avoid;
  }
  h1 em { font-style: italic; color: #D2691E; font-weight: 600; }
  .subtitle {
    font-family: Georgia, serif; font-size: 17px; color: #5A6A7D;
    font-style: italic; line-height: 1.5; margin-bottom: 26px;
  }
  .cover-border { border-bottom: 2px solid #1A2E47; padding-bottom: 24px; margin-bottom: 32px; }
  .prepared {
    display: flex; gap: 14px; align-items: center; margin-top: 24px;
  }
  .prepared-badge {
    width: 38px; height: 38px; border-radius: 50%;
    background: #FBF0E6; color: #D2691E;
    display: flex; align-items: center; justify-content: center;
    font-family: Consolas, monospace; font-size: 12px; font-weight: 700;
  }
  .prepared-label {
    font-family: Consolas, monospace; font-size: 9px; letter-spacing: 0.22em;
    color: #8A97A5; font-weight: 700; text-transform: uppercase;
  }
  .prepared-name { font-size: 13px; font-weight: 600; color: #1A2E47; }
  .prepared-meta { font-family: Consolas, monospace; font-size: 9px; color: #8A97A5; letter-spacing: 0.08em; }
  h2 {
    font-family: Georgia, serif; font-size: 22px; font-weight: 400;
    color: #1A2E47; margin: 32px 0 4px;
    page-break-after: avoid;
  }
  .section-lead {
    font-family: Georgia, serif; font-size: 14px; color: #5A6A7D;
    font-style: italic; margin-bottom: 18px;
  }
  section { margin-bottom: 28px; page-break-inside: avoid; }
  .take {
    background: #1A2E47; color: #fff; padding: 22px 26px; border-radius: 4px;
    display: flex; gap: 18px; align-items: stretch;
    page-break-inside: avoid;
  }
  .take-label {
    font-family: Consolas, monospace; font-size: 9px; letter-spacing: 0.32em;
    color: #D2691E; font-weight: 700; text-transform: uppercase;
    padding-right: 16px; border-right: 1px solid rgba(255,255,255,0.15);
    white-space: nowrap; flex-shrink: 0; align-self: center;
  }
  .take-body { font-family: Georgia, serif; font-size: 15px; line-height: 1.5; color: #F5F4F0; }
  .metrics {
    display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px;
    margin-top: 8px;
  }
  .metric {
    padding: 14px; background: #FAFAF7;
    border: 1px solid #D8DCE2; border-radius: 4px;
  }
  .metric-label {
    font-family: Consolas, monospace; font-size: 8px; letter-spacing: 0.18em;
    color: #8A97A5; font-weight: 700; text-transform: uppercase;
    margin-bottom: 8px;
  }
  .metric-n {
    font-family: Georgia, serif; font-size: 28px; color: #D2691E;
    font-weight: 400; line-height: 1; margin-bottom: 4px;
  }
  .metric-c { font-size: 10px; color: #5A6A7D; line-height: 1.4; }
  .metric-t { font-family: Consolas, monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.1em; margin-top: 6px; }
  .metric-t.down { color: #5B8F6F; }
  .metric-t.up { color: #6B93B8; }
  .metric-t.steady { color: #8A97A5; }
  .incident {
    padding: 22px; background: rgba(210,105,30,0.04);
    border: 1px solid rgba(210,105,30,0.22);
    border-left: 3px solid #D2691E; border-radius: 4px;
    page-break-inside: avoid;
  }
  .incident-id {
    font-family: Consolas, monospace; font-size: 10px; letter-spacing: 0.2em;
    color: #D2691E; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;
  }
  .incident-meta { font-family: Consolas, monospace; font-size: 10px; color: #8A97A5; margin-bottom: 12px; }
  .incident h3 { font-family: Georgia, serif; font-size: 19px; font-weight: 500; line-height: 1.3; margin: 0 0 14px; color: #1A2E47; }
  .incident p { font-size: 14px; line-height: 1.6; margin: 0 0 12px; color: #1A2E47; }
  .incident .actions {
    padding: 10px 14px; background: rgba(91,143,111,0.06);
    border-left: 2px solid #5B8F6F; margin: 0 0 12px;
    font-style: italic;
  }
  .pattern-grid { display: grid; gap: 10px; }
  .pattern {
    padding: 16px; background: #FAFAF7;
    border: 1px solid #D8DCE2; border-radius: 4px;
    page-break-inside: avoid;
  }
  .pattern h4 { font-family: Georgia, serif; font-size: 16px; font-weight: 500; margin: 0 0 8px; line-height: 1.3; color: #1A2E47; }
  .pattern p { font-size: 13px; line-height: 1.6; margin: 0; color: #1A2E47; }
  .blocked {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    page-break-inside: avoid;
  }
  .blocked-cell {
    padding: 14px; background: #FAFAF7; border: 1px solid #D8DCE2;
    border-radius: 4px; display: flex; gap: 12px; align-items: flex-start;
  }
  .blocked-icon {
    width: 30px; height: 30px; border-radius: 6px;
    background: rgba(91,143,111,0.18); color: #5B8F6F;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    font-family: Georgia, serif; font-size: 14px; font-weight: 700;
  }
  .blocked-n { font-family: Georgia, serif; font-size: 20px; font-weight: 500; color: #1A2E47; line-height: 1; margin-bottom: 3px; }
  .blocked-t { font-size: 12px; font-weight: 500; color: #1A2E47; }
  .blocked-s { font-family: Consolas, monospace; font-size: 9px; color: #8A97A5; letter-spacing: 0.05em; margin-top: 2px; }
  .next-item {
    padding: 14px 18px; background: #FAFAF7;
    border: 1px solid #D8DCE2; border-left: 3px solid #6B93B8;
    border-radius: 4px; margin-bottom: 10px;
    page-break-inside: avoid;
  }
  .next-item.from-you {
    background: rgba(210,105,30,0.05);
    border-color: rgba(210,105,30,0.22);
    border-left-color: #D2691E;
  }
  .next-label {
    font-family: Consolas, monospace; font-size: 9px; letter-spacing: 0.22em;
    font-weight: 700; text-transform: uppercase; margin-bottom: 5px;
    color: #6B93B8;
  }
  .next-item.from-you .next-label { color: #D2691E; }
  .next-body { font-size: 13px; line-height: 1.6; color: #1A2E47; }
  .signoff {
    padding-top: 22px; border-top: 1px solid #D8DCE2;
    display: flex; gap: 14px; align-items: flex-start;
    page-break-inside: avoid;
  }
  .signoff-badge {
    width: 42px; height: 42px; border-radius: 50%;
    background: #FBF0E6; color: #D2691E;
    display: flex; align-items: center; justify-content: center;
    font-family: Consolas, monospace; font-size: 13px; font-weight: 700;
    flex-shrink: 0;
  }
  .signoff-quote {
    font-family: Georgia, serif; font-size: 14px; color: #1A2E47;
    font-style: italic; line-height: 1.55; margin-bottom: 8px;
  }
  .signoff-name {
    font-family: Consolas, monospace; font-size: 10px; letter-spacing: 0.14em;
    color: #8A97A5; font-weight: 600; text-transform: uppercase;
  }
  .footer-branding {
    margin-top: 36px; padding-top: 16px; border-top: 1px solid #D8DCE2;
    display: flex; justify-content: space-between; gap: 10px;
    font-family: Consolas, monospace; font-size: 9px; letter-spacing: 0.14em;
    color: #8A97A5; text-transform: uppercase;
  }
  @media print { .noprint { display: none !important; } }
  .noprint {
    position: fixed; top: 14px; right: 14px;
    background: #1A2E47; color: #fff;
    padding: 10px 16px; border: none; border-radius: 4px;
    font-family: Calibri, sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; z-index: 999;
    box-shadow: 0 4px 14px rgba(0,0,0,0.15);
  }
</style>
</head>
<body>
<button class="noprint" onclick="window.print()">Save as PDF →</button>
<div class="wrap">

<div class="eyebrow"><span class="rule"></span>Security Report · ${reportMonth}</div>
<div class="cover-border">
  <h1>A quieter month than March — with<br/>one thing still on the table.</h1>
  <div class="subtitle">${THIS_CUSTOMER.name} · ${reportMonth}. Prepared for ${THIS_CUSTOMER.primaryContact.name} and the security team.</div>
  <div class="prepared">
    <div class="prepared-badge">${analyst.initials}</div>
    <div>
      <div class="prepared-label">Prepared by</div>
      <div class="prepared-name">${analyst.name}</div>
      <div class="prepared-meta">${analyst.role} · ${generatedAt}</div>
    </div>
  </div>
</div>

<section>
  <div class="take">
    <div class="take-label">The take</div>
    <div class="take-body">VDA surfaced ${openCount + resolved.length} events across your environment this month — ${openCount} still need your attention, ${resolved.length} resolved. No customer data left your network without authorization. The outstanding case — an unusual sign-in to your CFO's account from Lagos — is under active investigation.</div>
  </div>
</section>

<section>
  <h2>Month at a glance</h2>
  <div class="section-lead">Four numbers worth keeping in mind.</div>
  <div class="metrics">
    <div class="metric"><div class="metric-label">Signals investigated</div><div class="metric-n">18,340</div><div class="metric-c">SNYPR anomalies analyzed</div><div class="metric-t up">+12% vs last month</div></div>
    <div class="metric"><div class="metric-label">Incidents reported</div><div class="metric-n">8</div><div class="metric-c">After SOC review</div><div class="metric-t down">-30% vs last month</div></div>
    <div class="metric"><div class="metric-label">Phishing blocked</div><div class="metric-n">124</div><div class="metric-c">Before they hit inboxes</div><div class="metric-t up">+18% vs last month</div></div>
    <div class="metric"><div class="metric-label">Signal-to-noise</div><div class="metric-n">99.6%</div><div class="metric-c">Routine noise filtered</div><div class="metric-t steady">steady vs last month</div></div>
  </div>
</section>

<section>
  <h2>The one that mattered</h2>
  <div class="section-lead">Out of ${openCount + resolved.length} events, this is the one still worth your time.</div>
  <div class="incident">
    <div class="incident-id">Case ${criticalIncident ? criticalIncident.id : "VDA-1847"}</div>
    <div class="incident-meta">In progress · assigned to Sibe Klomp</div>
    <h3>Unusual sign-in to Tom Webb's account from Lagos, Nigeria</h3>
    <p>On April 17 at 14:16 UTC, SNYPR flagged an authentication event from an IP in Lagos against your CFO's Microsoft 365 identity. The sign-in succeeded, but the session was isolated within 42 seconds of detection — before any mail was read, any file was downloaded, or any conditional-access rule was bypassed.</p>
    <p>The pattern didn't match Tom's travel history. He's never signed in from Nigeria. His last recorded location before this event was Denver, four hours earlier. VDA reached out to your team the same minute we isolated the session, and we're still waiting on confirmation that Tom isn't traveling — once you confirm, we finalize remediation (rotate credentials, review any cross-tenant access, rebuild conditional access rules if needed).</p>
    <div class="actions">What VDA has done already: session isolated, credentials flagged for rotation, SentinelOne endpoint scan completed (clean), and a timeline of the attacker's attempted actions preserved for your records.</div>
    <p>The ticket thread in your portal has the full timeline. We'll update you the moment we hear from you, and we don't close this case without your sign-off.</p>
  </div>
</section>

<section>
  <h2>Patterns we only see in your environment</h2>
  <div class="section-lead">Across VDA's 150+ customers, these three things are unique to ${THIS_CUSTOMER.name}.</div>
  <div class="pattern-grid">
    <div class="pattern"><h4>Your AP team is the most-targeted team at Acme</h4><p>62% of the phishing we blocked this month was addressed to accounts-payable. Across our book of business, AP teams account for roughly 30% of phishing volume — yours is running at twice that. Attackers have identified your team as a high-value target, likely because of the invoice-heavy workflow. We've tuned detection rules specifically for invoice-theme lures on your domain.</p></div>
    <div class="pattern"><h4>Your patch cadence is the fastest in your industry peer set</h4><p>Critical patches landed on 98% of your 342 endpoints within 72 hours of vendor release this month. Industry median is 58%. This is a posture strength worth knowing — and worth staying honest about if your team ever considers loosening the policy.</p></div>
    <div class="pattern"><h4>Nobody in Acme has had an identity incident in 14 months — until this week</h4><p>The Lagos sign-in is the first identity-targeted event against your organization since February 2025. That's a meaningful streak, and it tells us two things: your MFA enforcement is working, and this attacker is probably worth understanding better. We'll include what we learn in next month's report.</p></div>
  </div>
</section>

<section>
  <h2>What we blocked that you didn't see</h2>
  <div class="section-lead">The invisible work — what didn't reach your team.</div>
  <div class="blocked">
    <div class="blocked-cell"><div class="blocked-icon">✓</div><div><div class="blocked-n">124</div><div class="blocked-t">Phishing emails blocked</div><div class="blocked-s">Before inbox delivery · 58 AP-targeted</div></div></div>
    <div class="blocked-cell"><div class="blocked-icon">✓</div><div><div class="blocked-n">7</div><div class="blocked-t">Malicious file uploads stopped</div><div class="blocked-s">SentinelOne quarantine · 2 ransomware IOCs</div></div></div>
    <div class="blocked-cell"><div class="blocked-icon">✓</div><div><div class="blocked-n">42</div><div class="blocked-t">Credential-stuffing attempts</div><div class="blocked-s">Against your M365 tenant · all blocked</div></div></div>
    <div class="blocked-cell"><div class="blocked-icon">✓</div><div><div class="blocked-n">3</div><div class="blocked-t">Risky OAuth app connections</div><div class="blocked-s">Flagged and denied by policy</div></div></div>
  </div>
</section>

<section>
  <h2>What's coming next month</h2>
  <div class="section-lead">Two small things from our side. One small thing from yours.</div>
  <div class="next-item">
    <div class="next-label">From us · May 6</div>
    <div class="next-body"><strong>Detection tuning for invoice-theme phishing.</strong> We're deploying a new signature set trained on the patterns we saw targeting your AP team in April. No action from you — this runs inside SNYPR on our side.</div>
  </div>
  <div class="next-item">
    <div class="next-label">From us · May 12</div>
    <div class="next-body"><strong>Quarterly penetration test kickoff.</strong> Scheduled for Q2 per your contract. Our team will coordinate scope with ${THIS_CUSTOMER.primaryContact.name} the week before.</div>
  </div>
  <div class="next-item from-you">
    <div class="next-label">From you · as soon as you can</div>
    <div class="next-body"><strong>Confirm Tom Webb's travel status.</strong> This is the one piece we need to finalize the Lagos investigation. The ticket in your portal has a reply button — a one-line answer unblocks us.</div>
  </div>
</section>

<section class="signoff">
  <div class="signoff-badge">${analyst.initials}</div>
  <div>
    <div class="signoff-quote">"Quiet month overall — the Lagos sign-in is the thing that could get louder, so please ping back when you have a read on Tom. Any questions on what's in here, reply directly to me."</div>
    <div class="signoff-name">— ${analyst.name} · ${analyst.role}</div>
  </div>
</section>

<div class="footer-branding">
  <div>VDA Labs · SOC Services</div>
  <div>${THIS_CUSTOMER.name} · ${reportMonth}</div>
  <div>Confidential · prepared for recipient only</div>
</div>

</div>
</body>
</html>`;

    // Open in new window — fallback to Blob download if popup blocked
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    } else {
      // Popup blocked — fall back to Blob download
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${THIS_CUSTOMER.name.replace(/\s+/g, "_")}_Security_Report_${reportMonth.replace(/\s+/g, "_")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // === TRUE PDF DOWNLOAD ===
  // Loads jsPDF from CDN on demand, renders the report to an actual .pdf file.
  // Works in artifact sandboxes, Netlify, and anywhere else the browser is modern.
  // Falls back to the HTML-in-new-window path if the CDN fetch fails.
  const loadScript = (src) => new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      return resolve();
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });

  const handleDownloadPDFFile = async () => {
    setPdfBusy(true);
    try {
      // Load jsPDF from cdnjs (a single UMD bundle, ~400KB, cached after first load)
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

      // eslint-disable-next-line no-undef
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });

      // Page geometry (letter = 612 × 792 pt at 72dpi, 0.6in margins = 43.2pt)
      const pageW = 612, pageH = 792, margin = 43;
      const contentW = pageW - margin * 2;
      let y = margin;

      // Brand colors as RGB for jsPDF
      const cOrange = [210, 105, 30];
      const cNavy = [26, 46, 71];
      const cMuted = [138, 151, 165];
      const cDim = [90, 106, 125];
      const cGreen = [91, 143, 111];
      const cLightBg = [250, 250, 247];
      const cDivider = [216, 220, 226];

      const newPageIfNeeded = (needed) => {
        if (y + needed > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      };

      const drawText = (txt, opts = {}) => {
        const {
          size = 11, font = "helvetica", weight = "normal", color = cNavy,
          maxWidth = contentW, leading = 1.4, gapAfter = 0, italic = false,
        } = opts;
        doc.setFont(font, italic ? "italic" : weight);
        doc.setFontSize(size);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(txt, maxWidth);
        const lineHeight = size * leading;
        newPageIfNeeded(lines.length * lineHeight);
        lines.forEach((line) => {
          doc.text(line, margin, y);
          y += lineHeight;
        });
        y += gapAfter;
      };

      const drawRule = (color = cDivider, thickness = 0.6) => {
        doc.setDrawColor(...color);
        doc.setLineWidth(thickness);
        doc.line(margin, y, margin + contentW, y);
        y += 12;
      };

      const drawBox = (h, fill, borderColor, borderLeftColor) => {
        newPageIfNeeded(h);
        if (fill) {
          doc.setFillColor(...fill);
          doc.rect(margin, y, contentW, h, "F");
        }
        if (borderColor) {
          doc.setDrawColor(...borderColor);
          doc.setLineWidth(0.6);
          doc.rect(margin, y, contentW, h, "S");
        }
        if (borderLeftColor) {
          doc.setFillColor(...borderLeftColor);
          doc.rect(margin, y, 3, h, "F");
        }
      };

      // ─── COVER ───
      // Orange eyebrow rule
      doc.setDrawColor(...cOrange);
      doc.setLineWidth(1);
      doc.line(margin, y, margin + 24, y);
      y += 10;
      drawText(`SECURITY REPORT  ·  ${reportMonth.toUpperCase()}`, {
        size: 9, font: "courier", weight: "bold", color: cOrange, gapAfter: 18,
      });

      // Big Georgia-style headline (using times as closest default font)
      drawText("A quieter month than March — with one thing", {
        size: 26, font: "times", weight: "normal", color: cNavy, leading: 1.1,
      });
      drawText("still on the table.", {
        size: 26, font: "times", weight: "normal", color: cNavy, leading: 1.1, gapAfter: 14,
      });

      drawText(
        `${THIS_CUSTOMER.name} · ${reportMonth}. Prepared for ${THIS_CUSTOMER.primaryContact.name} and the security team.`,
        { size: 13, font: "times", italic: true, color: cDim, leading: 1.5, gapAfter: 18 }
      );

      // Prepared by row
      drawText("PREPARED BY", {
        size: 8, font: "courier", weight: "bold", color: cMuted, gapAfter: 2,
      });
      drawText(analyst.name, {
        size: 12, font: "helvetica", weight: "bold", color: cNavy, gapAfter: 1,
      });
      drawText(`${analyst.role} · ${generatedAt}`, {
        size: 9, font: "courier", color: cMuted, gapAfter: 16,
      });

      // Navy underline (2pt, like the CSS border-bottom)
      doc.setDrawColor(...cNavy);
      doc.setLineWidth(2);
      doc.line(margin, y, margin + contentW, y);
      y += 22;

      // ─── "The take" callout (navy block with one-sentence conclusion) ───
      const takeText = `VDA surfaced ${openCount + resolved.length} events across your environment this month — ${openCount} still need your attention, ${resolved.length} resolved. No customer data left your network without authorization. The outstanding case — an unusual sign-in to your CFO's account from Lagos — is under active investigation.`;
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      const takeLines = doc.splitTextToSize(takeText, contentW - 90);
      const takeH = Math.max(60, takeLines.length * 15 + 24);
      newPageIfNeeded(takeH + 20);
      doc.setFillColor(...cNavy);
      doc.rect(margin, y, contentW, takeH, "F");
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...cOrange);
      doc.text("THE TAKE", margin + 14, y + 18);
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.setTextColor(245, 244, 240);
      takeLines.forEach((line, i) => {
        doc.text(line, margin + 85, y + 18 + i * 15);
      });
      y += takeH + 24;

      // ─── MONTH AT A GLANCE ───
      drawText("Month at a glance", {
        size: 18, font: "times", color: cNavy, leading: 1.2, gapAfter: 4,
      });
      drawText("Four numbers worth keeping in mind.", {
        size: 11, font: "times", italic: true, color: cDim, gapAfter: 14,
      });

      const metrics = [
        { n: "18,340", l: "Signals investigated", c: "SNYPR anomalies analyzed", t: "+12% vs last month" },
        { n: "8", l: "Incidents reported", c: "After SOC review", t: "-30% vs last month" },
        { n: "124", l: "Phishing blocked", c: "Before they hit inboxes", t: "+18% vs last month" },
        { n: "99.6%", l: "Signal-to-noise", c: "Routine noise filtered", t: "steady vs last month" },
      ];
      const cellW = (contentW - 12 * 3) / 4;
      const cellH = 78;
      newPageIfNeeded(cellH + 10);
      metrics.forEach((m, i) => {
        const x = margin + (cellW + 12) * i;
        doc.setFillColor(...cLightBg);
        doc.rect(x, y, cellW, cellH, "F");
        doc.setDrawColor(...cDivider);
        doc.setLineWidth(0.5);
        doc.rect(x, y, cellW, cellH, "S");
        doc.setFont("courier", "bold");
        doc.setFontSize(7);
        doc.setTextColor(...cMuted);
        doc.text(m.l.toUpperCase(), x + 10, y + 14);
        doc.setFont("times", "normal");
        doc.setFontSize(22);
        doc.setTextColor(...cOrange);
        doc.text(m.n, x + 10, y + 40);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...cDim);
        const cLines = doc.splitTextToSize(m.c, cellW - 20);
        cLines.forEach((line, li) => doc.text(line, x + 10, y + 52 + li * 10));
        doc.setFont("courier", "bold");
        doc.setFontSize(7);
        const tColor = m.t.startsWith("-") ? cGreen : m.t.includes("steady") ? cMuted : [107, 147, 184];
        doc.setTextColor(...tColor);
        doc.text(m.t, x + 10, y + cellH - 8);
      });
      y += cellH + 24;

      // ─── THE ONE THAT MATTERED ───
      newPageIfNeeded(60);
      drawText("The one that mattered", {
        size: 18, font: "times", color: cNavy, leading: 1.2, gapAfter: 4,
      });
      drawText(`Out of ${openCount + resolved.length} events, this is the one still worth your time.`, {
        size: 11, font: "times", italic: true, color: cDim, gapAfter: 14,
      });

      const incidentParas = [
        `Case ${criticalIncident ? criticalIncident.id : "VDA-1847"}  ·  In progress · assigned to Sibe Klomp`,
        "Unusual sign-in to Tom Webb's account from Lagos, Nigeria",
        "On April 17 at 14:16 UTC, SNYPR flagged an authentication event from an IP in Lagos against your CFO's Microsoft 365 identity. The sign-in succeeded, but the session was isolated within 42 seconds of detection — before any mail was read, any file was downloaded, or any conditional-access rule was bypassed.",
        "The pattern didn't match Tom's travel history. He's never signed in from Nigeria. His last recorded location before this event was Denver, four hours earlier. VDA reached out to your team the same minute we isolated the session, and we're still waiting on confirmation that Tom isn't traveling — once you confirm, we finalize remediation (rotate credentials, review cross-tenant access, rebuild conditional-access rules if needed).",
        "ACTIONS_PULLQUOTE:What VDA has done already: session isolated, credentials flagged for rotation, SentinelOne endpoint scan completed (clean), and a timeline of the attacker's attempted actions preserved for your records.",
        "The ticket thread in your portal has the full timeline. We'll update you the moment we hear from you, and we don't close this case without your sign-off.",
      ];

      // Calculate height
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      let incidentH = 18 + 16 + 8; // case id + title anchor + padding
      const wrapped = [];
      incidentParas.forEach((p) => {
        if (p.startsWith("Case ")) {
          wrapped.push({ type: "meta", text: p });
          incidentH += 16;
        } else if (p.startsWith("Unusual sign-in")) {
          wrapped.push({ type: "h3", text: p });
          doc.setFont("times", "bold");
          doc.setFontSize(14);
          const tl = doc.splitTextToSize(p, contentW - 28);
          wrapped[wrapped.length - 1].lines = tl;
          incidentH += tl.length * 17 + 10;
        } else if (p.startsWith("ACTIONS_PULLQUOTE:")) {
          const text = p.replace("ACTIONS_PULLQUOTE:", "");
          doc.setFont("times", "italic");
          doc.setFontSize(11);
          const tl = doc.splitTextToSize(text, contentW - 40);
          wrapped.push({ type: "pull", text, lines: tl });
          incidentH += tl.length * 14 + 24;
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          const tl = doc.splitTextToSize(p, contentW - 28);
          wrapped.push({ type: "p", text: p, lines: tl });
          incidentH += tl.length * 14 + 10;
        }
      });

      newPageIfNeeded(incidentH);
      const incY = y;
      doc.setFillColor(253, 246, 238);
      doc.rect(margin, incY, contentW, incidentH, "F");
      doc.setFillColor(...cOrange);
      doc.rect(margin, incY, 3, incidentH, "F");
      doc.setDrawColor(210, 105, 30, 0.4);
      doc.setLineWidth(0.4);
      doc.rect(margin, incY, contentW, incidentH, "S");

      let incY2 = incY + 18;
      wrapped.forEach((item) => {
        if (item.type === "meta") {
          doc.setFont("courier", "bold");
          doc.setFontSize(8);
          doc.setTextColor(...cOrange);
          doc.text(item.text.toUpperCase(), margin + 14, incY2);
          incY2 += 14;
        } else if (item.type === "h3") {
          doc.setFont("times", "bold");
          doc.setFontSize(14);
          doc.setTextColor(...cNavy);
          item.lines.forEach((line) => {
            doc.text(line, margin + 14, incY2);
            incY2 += 17;
          });
          incY2 += 8;
        } else if (item.type === "p") {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(...cNavy);
          item.lines.forEach((line) => {
            doc.text(line, margin + 14, incY2);
            incY2 += 14;
          });
          incY2 += 8;
        } else if (item.type === "pull") {
          // Sage-green left-border pullquote
          const pullY = incY2;
          const pullH = item.lines.length * 13 + 18;
          doc.setFillColor(245, 250, 245);
          doc.rect(margin + 14, pullY, contentW - 28, pullH, "F");
          doc.setFillColor(...cGreen);
          doc.rect(margin + 14, pullY, 2, pullH, "F");
          doc.setFont("times", "italic");
          doc.setFontSize(11);
          doc.setTextColor(...cNavy);
          incY2 += 14;
          item.lines.forEach((line) => {
            doc.text(line, margin + 26, incY2);
            incY2 += 13;
          });
          incY2 += 16;
        }
      });
      y = incY + incidentH + 24;

      // ─── PATTERNS ───
      newPageIfNeeded(60);
      drawText("Patterns we only see in your environment", {
        size: 18, font: "times", color: cNavy, leading: 1.2, gapAfter: 4,
      });
      drawText(`Across VDA's 150+ customers, these three things are unique to ${THIS_CUSTOMER.name}.`, {
        size: 11, font: "times", italic: true, color: cDim, gapAfter: 14,
      });

      const patterns = [
        ["Your AP team is the most-targeted team at Acme",
          "62% of the phishing we blocked this month was addressed to accounts-payable. Across our book of business, AP teams account for roughly 30% of phishing volume — yours is running at twice that. Attackers have identified your team as a high-value target, likely because of the invoice-heavy workflow. We've tuned detection rules specifically for invoice-theme lures on your domain."],
        ["Your patch cadence is the fastest in your industry peer set",
          "Critical patches landed on 98% of your 342 endpoints within 72 hours of vendor release this month. Industry median is 58%. This is a posture strength worth knowing — and worth staying honest about if your team ever considers loosening the policy."],
        ["Nobody in Acme has had an identity incident in 14 months — until this week",
          "The Lagos sign-in is the first identity-targeted event against your organization since February 2025. That's a meaningful streak, and it tells us two things: your MFA enforcement is working, and this attacker is probably worth understanding better. We'll include what we learn in next month's report."],
      ];
      patterns.forEach(([title, body]) => {
        doc.setFont("times", "bold");
        doc.setFontSize(13);
        const titleLines = doc.splitTextToSize(title, contentW - 28);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const bodyLines = doc.splitTextToSize(body, contentW - 28);
        const boxH = titleLines.length * 15 + bodyLines.length * 13 + 24;
        newPageIfNeeded(boxH + 10);
        doc.setFillColor(...cLightBg);
        doc.rect(margin, y, contentW, boxH, "F");
        doc.setDrawColor(...cDivider);
        doc.setLineWidth(0.4);
        doc.rect(margin, y, contentW, boxH, "S");
        let py = y + 16;
        doc.setFont("times", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...cNavy);
        titleLines.forEach((l) => { doc.text(l, margin + 14, py); py += 15; });
        py += 4;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...cNavy);
        bodyLines.forEach((l) => { doc.text(l, margin + 14, py); py += 13; });
        y += boxH + 10;
      });
      y += 12;

      // ─── WHAT WE BLOCKED ───
      newPageIfNeeded(60);
      drawText("What we blocked that you didn't see", {
        size: 18, font: "times", color: cNavy, leading: 1.2, gapAfter: 4,
      });
      drawText("The invisible work — what didn't reach your team.", {
        size: 11, font: "times", italic: true, color: cDim, gapAfter: 14,
      });

      const blocked = [
        ["124", "Phishing emails blocked", "Before inbox delivery · 58 AP-targeted"],
        ["7", "Malicious file uploads stopped", "SentinelOne quarantine · 2 ransomware IOCs"],
        ["42", "Credential-stuffing attempts", "Against your M365 tenant · all blocked"],
        ["3", "Risky OAuth app connections", "Flagged and denied by policy"],
      ];
      const bw = (contentW - 12) / 2;
      const bh = 64;
      for (let i = 0; i < blocked.length; i += 2) {
        newPageIfNeeded(bh + 10);
        [0, 1].forEach((col) => {
          const item = blocked[i + col];
          if (!item) return;
          const [n, t, s] = item;
          const x = margin + (bw + 12) * col;
          doc.setFillColor(...cLightBg);
          doc.rect(x, y, bw, bh, "F");
          doc.setDrawColor(...cDivider);
          doc.setLineWidth(0.4);
          doc.rect(x, y, bw, bh, "S");
          doc.setFillColor(232, 243, 235);
          doc.roundedRect(x + 12, y + 16, 28, 28, 4, 4, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(...cGreen);
          doc.text("✓", x + 20, y + 34);
          doc.setFont("times", "normal");
          doc.setFontSize(18);
          doc.setTextColor(...cNavy);
          doc.text(n, x + 50, y + 28);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.text(t, x + 50, y + 42);
          doc.setFont("courier", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...cMuted);
          doc.text(s, x + 50, y + 54);
        });
        y += bh + 10;
      }
      y += 12;

      // ─── WHAT'S COMING NEXT MONTH ───
      newPageIfNeeded(60);
      drawText("What's coming next month", {
        size: 18, font: "times", color: cNavy, leading: 1.2, gapAfter: 4,
      });
      drawText("Two small things from our side. One small thing from yours.", {
        size: 11, font: "times", italic: true, color: cDim, gapAfter: 14,
      });

      const next = [
        ["From us · May 6", "Detection tuning for invoice-theme phishing.", "We're deploying a new signature set trained on the patterns we saw targeting your AP team in April. No action from you — this runs inside SNYPR on our side.", "us"],
        ["From us · May 12", "Quarterly penetration test kickoff.", `Scheduled for Q2 per your contract. Our team will coordinate scope with ${THIS_CUSTOMER.primaryContact.name} the week before.`, "us"],
        ["From you · as soon as you can", "Confirm Tom Webb's travel status.", "This is the one piece we need to finalize the Lagos investigation. The ticket in your portal has a reply button — a one-line answer unblocks us.", "you"],
      ];
      next.forEach(([label, bold, rest, who]) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const bodyLines = doc.splitTextToSize(`${bold} ${rest}`, contentW - 28);
        const h = 18 + bodyLines.length * 13 + 12;
        newPageIfNeeded(h + 8);
        doc.setFillColor(...(who === "you" ? [253, 246, 238] : cLightBg));
        doc.rect(margin, y, contentW, h, "F");
        doc.setFillColor(...(who === "you" ? cOrange : [107, 147, 184]));
        doc.rect(margin, y, 3, h, "F");
        doc.setDrawColor(...cDivider);
        doc.setLineWidth(0.4);
        doc.rect(margin, y, contentW, h, "S");
        doc.setFont("courier", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...(who === "you" ? cOrange : [107, 147, 184]));
        doc.text(label.toUpperCase(), margin + 14, y + 14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...cNavy);
        doc.text(bold, margin + 14, y + 28);
        doc.setFont("helvetica", "normal");
        const restLines = doc.splitTextToSize(rest, contentW - 28);
        let ny = y + 42;
        restLines.forEach((l) => { doc.text(l, margin + 14, ny); ny += 13; });
        y += h + 8;
      });
      y += 16;

      // ─── SIGN-OFF ───
      newPageIfNeeded(80);
      doc.setDrawColor(...cDivider);
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + contentW, y);
      y += 18;
      doc.setFont("times", "italic");
      doc.setFontSize(12);
      doc.setTextColor(...cNavy);
      const quote = '"Quiet month overall — the Lagos sign-in is the thing that could get louder, so please ping back when you have a read on Tom. Any questions on what\'s in here, reply directly to me."';
      const ql = doc.splitTextToSize(quote, contentW - 14);
      ql.forEach((line) => { doc.text(line, margin, y); y += 16; });
      y += 6;
      doc.setFont("courier", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...cMuted);
      doc.text(`— ${analyst.name.toUpperCase()} · ${analyst.role.toUpperCase()}`, margin, y);
      y += 28;

      // Footer branding
      doc.setDrawColor(...cDivider);
      doc.line(margin, y, margin + contentW, y);
      y += 14;
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...cMuted);
      doc.text("VDA LABS · SOC SERVICES", margin, y);
      doc.text(`${THIS_CUSTOMER.name.toUpperCase()} · ${reportMonth.toUpperCase()}`, margin + contentW / 2 - 50, y);
      doc.text("CONFIDENTIAL", margin + contentW - 75, y);

      // Save — this triggers the actual file download in every browser
      const filename = `${THIS_CUSTOMER.name.replace(/\s+/g, "_")}_Security_Report_${reportMonth.replace(/\s+/g, "_")}.pdf`;
      doc.save(filename);
      setPdfError(null);
    } catch (err) {
      console.error("PDF generation failed:", err);
      // Show user-visible error, then fall back to opening in browser
      setPdfError("Couldn't generate PDF — opened report in a new tab instead.");
      handleOpenInBrowser();
      // Clear error after 5 seconds
      setTimeout(() => setPdfError(null), 5000);
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div style={{
      background: T.bgLight, minHeight: "calc(100vh - 60px)",
    }}>
      {/* Page chrome: back nav + download affordance */}
      <div style={{
        maxWidth: 820, margin: "0 auto",
        padding: isMobile ? "20px 16px 0" : "28px 30px 0",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 16, flexWrap: "wrap", gap: 10,
        }}>
          <button onClick={onBack} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent", border: "none", cursor: "pointer",
            fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.15em",
            color: T.inkDarkDim, fontWeight: 700, textTransform: "uppercase",
          }}><ArrowLeft size={13} /> BACK</button>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={handleOpenInBrowser} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 4, cursor: "pointer",
              background: "transparent", color: T.inkDarkDim,
              border: `1px solid ${T.dividerLight}`,
              fontFamily: T.fontBody, fontSize: 12, fontWeight: 500,
              transition: "all 120ms ease",
            }}>
              <Eye size={12} /> Open in browser
            </button>
            <button onClick={handleDownloadPDFFile} disabled={pdfBusy} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 4,
              cursor: pdfBusy ? "wait" : "pointer",
              background: pdfBusy ? T.bgLightAlt : T.inkDark,
              color: pdfBusy ? T.inkDarkMuted : "#fff",
              border: "none",
              fontFamily: T.fontBody, fontSize: 12, fontWeight: 500,
              opacity: pdfBusy ? 0.7 : 1,
              transition: "all 120ms ease",
            }}>
              <Download size={12} />
              {pdfBusy ? "Generating PDF…" : "Download PDF"}
            </button>
          </div>
        </div>
        {pdfError && (
          <div style={{
            marginBottom: 12, padding: "10px 14px", borderRadius: 4,
            background: "rgba(210,105,30,0.08)",
            border: "1px solid rgba(210,105,30,0.3)",
            color: T.orange, fontFamily: T.fontBody, fontSize: 13,
          }}>
            {pdfError}
          </div>
        )}
      </div>

      {/* THE DOCUMENT — looks like a polished report, feels premium */}
      <div style={{
        maxWidth: 820, margin: "0 auto",
        padding: isMobile ? "0 16px 40px" : "0 30px 60px",
      }}>
        <article style={{
          background: T.bgLightCard,
          border: `1px solid ${T.dividerLight}`,
          borderRadius: 4,
          padding: isMobile ? "36px 24px" : "64px 72px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.06)",
        }}>

          {/* ─── COVER / HERO ─── */}
          <header style={{
            borderBottom: `2px solid ${T.inkDark}`,
            paddingBottom: 32, marginBottom: 44,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 24,
              fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.28em",
              color: T.orange, fontWeight: 700, textTransform: "uppercase",
            }}>
              <span style={{
                display: "inline-block", width: 24, height: 1, background: T.orange,
              }} />
              Security Report · {reportMonth}
            </div>
            <h1 style={{
              fontFamily: T.fontDisplay, fontSize: isMobile ? 34 : 48,
              color: T.inkDark, fontWeight: 400, lineHeight: 1.05,
              letterSpacing: "-0.02em", marginBottom: 14,
            }}>
              A quieter month than March — with<br/>one thing still on the table.
            </h1>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: isMobile ? 17 : 20,
              color: T.inkDarkDim, fontStyle: "italic", lineHeight: 1.5,
              maxWidth: 620,
            }}>
              {THIS_CUSTOMER.name} · {reportMonth}. Prepared for{" "}
              {THIS_CUSTOMER.primaryContact.name} and the security team.
            </div>

            {/* Attribution row — the trust anchor */}
            <div style={{
              marginTop: 32, display: "flex", gap: 16, alignItems: "center",
              flexWrap: "wrap",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: T.orangeTint, color: T.orange,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: T.fontMono, fontSize: 13, fontWeight: 700,
              }}>{analyst.initials}</div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{
                  fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.22em",
                  color: T.inkDarkMuted, fontWeight: 700, textTransform: "uppercase",
                  marginBottom: 3,
                }}>Prepared by</div>
                <div style={{
                  fontFamily: T.fontBody, fontSize: 14, color: T.inkDark, fontWeight: 600,
                }}>
                  {analyst.name}
                </div>
                <div style={{
                  fontFamily: T.fontMono, fontSize: 10, color: T.inkDarkMuted, letterSpacing: "0.08em",
                }}>{analyst.role} · {generatedAt}</div>
              </div>
            </div>
          </header>

          {/* ─── THE TAKE — single declarative sentence ─── */}
          <section style={{ marginBottom: 48 }}>
            <div style={{
              background: T.inkDark, color: "#fff", padding: "28px 32px",
              borderRadius: 4, display: "flex", gap: 20,
              flexDirection: isMobile ? "column" : "row",
            }}>
              <div style={{
                fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.32em",
                color: T.orange, fontWeight: 700, textTransform: "uppercase",
                paddingRight: isMobile ? 0 : 20,
                borderRight: isMobile ? "none" : `1px solid rgba(255,255,255,0.15)`,
                paddingBottom: isMobile ? 8 : 0,
                borderBottom: isMobile ? `1px solid rgba(255,255,255,0.15)` : "none",
                flexShrink: 0, whiteSpace: "nowrap",
              }}>The take</div>
              <div style={{
                fontFamily: T.fontDisplay, fontSize: isMobile ? 18 : 20,
                lineHeight: 1.5, color: "#F5F4F0", fontWeight: 400,
              }}>
                VDA surfaced {openCount + resolved.length} events across your environment this month — {openCount} still need your attention, {resolved.length} resolved.
                No customer data left your network without authorization. The outstanding case —
                an unusual sign-in to your CFO's account from Lagos — is under active investigation.
              </div>
            </div>
          </section>

          {/* ─── MONTH AT A GLANCE ─── */}
          <section style={{ marginBottom: 56 }}>
            <h2 style={{
              fontFamily: T.fontDisplay, fontSize: isMobile ? 22 : 28,
              color: T.inkDark, fontWeight: 400, marginBottom: 6,
            }}>Month at a glance</h2>
            <p style={{
              fontFamily: T.fontDisplay, fontSize: 15, color: T.inkDarkDim,
              fontStyle: "italic", marginBottom: 24,
            }}>Four numbers worth keeping in mind.</p>

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
              gap: 12,
            }}>
              {[
                { n: "18,340", l: "Signals investigated", c: "SNYPR anomalies analyzed", trend: "+12%" },
                { n: "8", l: "Incidents reported", c: "After SOC review", trend: "-30%" },
                { n: "124", l: "Phishing blocked", c: "Before they hit inboxes", trend: "+18%" },
                { n: "99.6%", l: "Signal-to-noise", c: "Routine noise filtered", trend: "steady" },
              ].map((m) => (
                <div key={m.l} style={{
                  padding: 20, background: T.bgLightAlt,
                  border: `1px solid ${T.dividerLight}`, borderRadius: 4,
                }}>
                  <div style={{
                    fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.2em",
                    color: T.inkDarkMuted, fontWeight: 700, textTransform: "uppercase",
                    marginBottom: 10,
                  }}>{m.l}</div>
                  <div style={{
                    fontFamily: T.fontDisplay, fontSize: 36, color: T.orange,
                    fontWeight: 400, lineHeight: 1, marginBottom: 6,
                  }}>{m.n}</div>
                  <div style={{
                    fontFamily: T.fontBody, fontSize: 11, color: T.inkDarkDim, lineHeight: 1.4,
                  }}>{m.c}</div>
                  <div style={{
                    marginTop: 10, fontFamily: T.fontMono, fontSize: 10,
                    color: m.trend.startsWith("-") ? T.slaOk : m.trend === "steady" ? T.inkDarkMuted : T.steel,
                    fontWeight: 600, letterSpacing: "0.12em",
                  }}>{m.trend} vs. last month</div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── THE ONE THING THAT MATTERED — narrative deep-dive ─── */}
          <section style={{ marginBottom: 56 }}>
            <h2 style={{
              fontFamily: T.fontDisplay, fontSize: isMobile ? 22 : 28,
              color: T.inkDark, fontWeight: 400, marginBottom: 6,
            }}>The one that mattered</h2>
            <p style={{
              fontFamily: T.fontDisplay, fontSize: 15, color: T.inkDarkDim,
              fontStyle: "italic", marginBottom: 24,
            }}>Out of {openCount + resolved.length} events, this is the one still worth your time.</p>

            <div style={{
              padding: 26, background: "rgba(210,105,30,0.04)",
              border: `1px solid rgba(210,105,30,0.22)`,
              borderLeft: `3px solid ${T.orange}`, borderRadius: 4,
            }}>
              <div style={{
                display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16,
                flexWrap: "wrap",
              }}>
                <span style={{
                  fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.2em",
                  color: T.orange, fontWeight: 700, textTransform: "uppercase",
                }}>Case {criticalIncident ? criticalIncident.id : "VDA-1847"}</span>
                <span style={{ color: T.dividerLight }}>·</span>
                <span style={{
                  fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.12em",
                  color: T.inkDarkMuted,
                }}>In progress · assigned to Sibe Klomp</span>
              </div>
              <h3 style={{
                fontFamily: T.fontDisplay, fontSize: 22, color: T.inkDark,
                fontWeight: 500, lineHeight: 1.3, marginBottom: 16,
              }}>Unusual sign-in to Tom Webb's account from Lagos, Nigeria</h3>
              <div style={{
                fontFamily: T.fontBody, fontSize: 15, color: T.inkDark, lineHeight: 1.65,
              }}>
                <p style={{ marginBottom: 14 }}>
                  On April 17 at 14:16 UTC, SNYPR flagged an authentication event from an IP in Lagos
                  against your CFO's Microsoft 365 identity. The sign-in succeeded, but the session was
                  isolated within 42 seconds of detection — before any mail was read, any file was
                  downloaded, or any conditional-access rule was bypassed.
                </p>
                <p style={{ marginBottom: 14 }}>
                  The pattern didn't match Tom's travel history. He's never signed in from Nigeria.
                  His last recorded location before this event was Denver, four hours earlier. VDA
                  reached out to your team the same minute we isolated the session, and we're still
                  waiting on confirmation that Tom isn't traveling — once you confirm, we finalize
                  remediation (rotate credentials, review any cross-tenant access, rebuild conditional
                  access rules if needed).
                </p>
                <p style={{
                  padding: "12px 16px", background: "rgba(91,143,111,0.06)",
                  borderLeft: `2px solid ${T.slaOk}`, marginBottom: 14,
                  fontStyle: "italic",
                }}>
                  What VDA has done already: session isolated, credentials flagged for rotation,
                  SentinelOne endpoint scan completed (clean), and a timeline of the attacker's
                  attempted actions preserved for your records.
                </p>
                <p>
                  The ticket thread in your portal has the full timeline. We'll update you the moment
                  we hear from you, and we don't close this case without your sign-off.
                </p>
              </div>
            </div>
          </section>

          {/* ─── PATTERNS UNIQUE TO YOU ─── */}
          <section style={{ marginBottom: 56 }}>
            <h2 style={{
              fontFamily: T.fontDisplay, fontSize: isMobile ? 22 : 28,
              color: T.inkDark, fontWeight: 400, marginBottom: 6,
            }}>Patterns we only see in your environment</h2>
            <p style={{
              fontFamily: T.fontDisplay, fontSize: 15, color: T.inkDarkDim,
              fontStyle: "italic", marginBottom: 24,
            }}>Across VDA's 150+ customers, these three things are unique to {THIS_CUSTOMER.name}.</p>

            <div style={{ display: "grid", gap: 14 }}>
              {[
                {
                  title: "Your AP team is the most-targeted team at Acme",
                  body: "62% of the phishing we blocked this month was addressed to accounts-payable. Across our book of business, AP teams account for roughly 30% of phishing volume — yours is running at twice that. Attackers have identified your team as a high-value target, likely because of the invoice-heavy workflow. We've tuned detection rules specifically for invoice-theme lures on your domain.",
                },
                {
                  title: "Your patch cadence is the fastest in your industry peer set",
                  body: "Critical patches landed on 98% of your 342 endpoints within 72 hours of vendor release this month. Industry median is 58%. This is a posture strength worth knowing — and worth staying honest about if your team ever considers loosening the policy.",
                },
                {
                  title: "Nobody in Acme has had an identity incident in 14 months — until this week",
                  body: "The Lagos sign-in is the first identity-targeted event against your organization since February 2025. That's a meaningful streak, and it tells us two things: your MFA enforcement is working, and this attacker is probably worth understanding better. We'll include what we learn in next month's report.",
                },
              ].map((p, i) => (
                <div key={i} style={{
                  padding: 22, background: T.bgLightAlt,
                  border: `1px solid ${T.dividerLight}`, borderRadius: 4,
                }}>
                  <h4 style={{
                    fontFamily: T.fontDisplay, fontSize: 18, color: T.inkDark,
                    fontWeight: 500, lineHeight: 1.3, marginBottom: 10,
                  }}>{p.title}</h4>
                  <p style={{
                    fontFamily: T.fontBody, fontSize: 14, color: T.inkDark,
                    lineHeight: 1.65,
                  }}>{p.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ─── WHAT WE BLOCKED ─── */}
          <section style={{ marginBottom: 56 }}>
            <h2 style={{
              fontFamily: T.fontDisplay, fontSize: isMobile ? 22 : 28,
              color: T.inkDark, fontWeight: 400, marginBottom: 6,
            }}>What we blocked that you didn't see</h2>
            <p style={{
              fontFamily: T.fontDisplay, fontSize: 15, color: T.inkDarkDim,
              fontStyle: "italic", marginBottom: 24,
            }}>The invisible work — what didn't reach your team.</p>

            <div style={{
              display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: 12,
            }}>
              {[
                { n: "124", t: "Phishing emails blocked", s: "Before inbox delivery · 58 AP-targeted" },
                { n: "7", t: "Malicious file uploads stopped", s: "SentinelOne quarantine · 2 ransomware IOCs" },
                { n: "42", t: "Credential-stuffing attempts", s: "Against your M365 tenant · all blocked" },
                { n: "3", t: "Risky OAuth app connections", s: "Flagged and denied by policy" },
              ].map((b) => (
                <div key={b.t} style={{
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: 18, background: T.bgLightAlt,
                  border: `1px solid ${T.dividerLight}`, borderRadius: 4,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `${T.slaOk}18`, color: T.slaOk,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}><Shield size={17} /></div>
                  <div>
                    <div style={{
                      fontFamily: T.fontDisplay, fontSize: 24, color: T.inkDark,
                      fontWeight: 500, lineHeight: 1, marginBottom: 4,
                    }}>{b.n}</div>
                    <div style={{
                      fontFamily: T.fontBody, fontSize: 13, color: T.inkDark, fontWeight: 500,
                    }}>{b.t}</div>
                    <div style={{
                      fontFamily: T.fontMono, fontSize: 10, color: T.inkDarkMuted,
                      letterSpacing: "0.06em", marginTop: 3,
                    }}>{b.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─── WHAT'S COMING NEXT MONTH ─── */}
          <section style={{ marginBottom: 56 }}>
            <h2 style={{
              fontFamily: T.fontDisplay, fontSize: isMobile ? 22 : 28,
              color: T.inkDark, fontWeight: 400, marginBottom: 6,
            }}>What's coming next month</h2>
            <p style={{
              fontFamily: T.fontDisplay, fontSize: 15, color: T.inkDarkDim,
              fontStyle: "italic", marginBottom: 24,
            }}>Two small things from our side. One small thing from yours.</p>

            <div style={{ display: "grid", gap: 12 }}>
              <div style={{
                padding: "18px 22px", background: T.bgLightAlt,
                border: `1px solid ${T.dividerLight}`, borderLeft: `3px solid ${T.steel}`,
                borderRadius: 4,
              }}>
                <div style={{
                  fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.22em",
                  color: T.steel, fontWeight: 700, textTransform: "uppercase", marginBottom: 6,
                }}>FROM US · MAY 6</div>
                <div style={{ fontFamily: T.fontBody, fontSize: 14, color: T.inkDark, lineHeight: 1.6 }}>
                  <strong>Detection tuning for invoice-theme phishing.</strong> We're deploying a new signature
                  set trained on the patterns we saw targeting your AP team in April. No action from you —
                  this runs inside SNYPR on our side.
                </div>
              </div>
              <div style={{
                padding: "18px 22px", background: T.bgLightAlt,
                border: `1px solid ${T.dividerLight}`, borderLeft: `3px solid ${T.steel}`,
                borderRadius: 4,
              }}>
                <div style={{
                  fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.22em",
                  color: T.steel, fontWeight: 700, textTransform: "uppercase", marginBottom: 6,
                }}>FROM US · MAY 12</div>
                <div style={{ fontFamily: T.fontBody, fontSize: 14, color: T.inkDark, lineHeight: 1.6 }}>
                  <strong>Quarterly penetration test kickoff.</strong> Scheduled for Q2 per your contract.
                  Our team will coordinate scope with {THIS_CUSTOMER.primaryContact.name} the week before.
                </div>
              </div>
              <div style={{
                padding: "18px 22px", background: "rgba(210,105,30,0.05)",
                border: `1px solid rgba(210,105,30,0.22)`, borderLeft: `3px solid ${T.orange}`,
                borderRadius: 4,
              }}>
                <div style={{
                  fontFamily: T.fontMono, fontSize: 9, letterSpacing: "0.22em",
                  color: T.orange, fontWeight: 700, textTransform: "uppercase", marginBottom: 6,
                }}>FROM YOU · AS SOON AS YOU CAN</div>
                <div style={{ fontFamily: T.fontBody, fontSize: 14, color: T.inkDark, lineHeight: 1.6 }}>
                  <strong>Confirm Tom Webb's travel status.</strong> This is the one piece we need to finalize
                  the Lagos investigation. The ticket in your portal has a reply button — a one-line answer
                  unblocks us.
                </div>
              </div>
            </div>
          </section>

          {/* ─── ANALYST SIGN-OFF ─── */}
          <section style={{
            paddingTop: 32, borderTop: `1px solid ${T.dividerLight}`,
          }}>
            <div style={{
              display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap",
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: T.orangeTint, color: T.orange,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: T.fontMono, fontSize: 15, fontWeight: 700,
                flexShrink: 0,
              }}>{analyst.initials}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{
                  fontFamily: T.fontDisplay, fontSize: 16, color: T.inkDark,
                  fontStyle: "italic", lineHeight: 1.55, marginBottom: 10,
                }}>
                  "Quiet month overall — the Lagos sign-in is the thing that could get louder, so please
                  ping back when you have a read on Tom. Any questions on what's in here, reply directly
                  to me."
                </div>
                <div style={{
                  fontFamily: T.fontMono, fontSize: 10, letterSpacing: "0.14em",
                  color: T.inkDarkMuted, fontWeight: 600, textTransform: "uppercase",
                }}>— {analyst.name} · {analyst.role}</div>
              </div>
            </div>

          </section>
        </article>
      </div>
    </div>
  );
};

/* ============================================================
 * TOAST
 * ============================================================ */
const Toast = ({ visible, message }) => (
  <div style={{
    position: "fixed", bottom: 20, right: 20, zIndex: 200,
    background: T.inkDark, color: "#fff", borderRadius: 6,
    padding: "12px 18px", boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
    fontFamily: T.fontBody, fontSize: 13, fontWeight: 500,
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(8px)",
    transition: "all 200ms ease", pointerEvents: visible ? "auto" : "none",
    display: "flex", alignItems: "center", gap: 10,
  }}>
    <Check size={14} style={{ color: T.orange }} />
    {message}
  </div>
);

/* ============================================================
 * ROOT APP
 * ============================================================ */

export default function SentryPortal() {
  const [phase, setPhase] = useState("p1");
  const [view, setView] = useState({ name: "home" });
  const [tickets, setTickets] = useState(CUSTOMER_TICKETS);
  const [toast, setToast] = useState({ visible: false, message: "" });

  const goHome = () => setView({ name: "home" });
  const navigate = (viewId) => setView({ name: viewId });
  const openTicket = (ticketId) => setView({ name: "ticket-detail", ticketId });

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 2400);
  };

  const handleNewCase = (draft) => {
    const newId = `VDA-${1900 + tickets.length}`;
    const newTicket = {
      id: newId, severity: draft.urgency === "urgent" ? "critical" : draft.urgency === "important" ? "high" : "medium",
      status: "open", subject: draft.subject,
      customerFacing: "We've opened this case and an analyst will pick it up shortly.",
      createdAt: Date.now(), lastUpdate: Date.now(),
      thread: [{ from: "You", at: Date.now(), body: draft.description }],
    };
    setTickets((ts) => [newTicket, ...ts]);
    showToast(`Case opened · ${newId}`);
    goHome();
  };

  // Route view
  let body;
  if (view.name === "home") {
    body = <HomeView phase={phase} tickets={tickets} onNavigate={navigate} />;
  } else if (view.name === "open") {
    body = <OpenCaseView onBack={goHome} onSubmit={handleNewCase} />;
  } else if (view.name === "tickets") {
    body = <TicketsListView tickets={tickets} onBack={goHome} onOpenTicket={openTicket} showToast={showToast} />;
  } else if (view.name === "ticket-detail") {
    const ticket = tickets.find((t) => t.id === view.ticketId);
    if (!ticket) { goHome(); return null; }
    body = <TicketDetailView ticket={ticket} onBack={() => setView({ name: "tickets" })} />;
  } else if (view.name === "contract") {
    body = <ContractView onBack={goHome} />;
  } else if (view.name === "documents") {
    body = <DocumentsView onBack={goHome} />;
  } else if (view.name === "dashboards") {
    body = <DashboardsView tickets={tickets} onBack={goHome} />;
  } else if (view.name === "report") {
    body = <SecurityReportView tickets={tickets} onBack={goHome} />;
  } else if (view.name === "kb") {
    body = <KBView onBack={goHome} />;
  } else if (view.name === "services") {
    body = <ServicesView onBack={goHome} />;
  }

  return (
    <div style={{
      minHeight: "100vh", background: T.bgLight, color: T.inkDark,
      fontFamily: T.fontBody,
    }}>
      <Header phase={phase} setPhase={setPhase} currentView={view.name} goHome={goHome} />
      {body}
      <Toast visible={toast.visible} message={toast.message} />
    </div>
  );
}
