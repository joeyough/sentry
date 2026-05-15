/**
 * sentry-home.jsx — Project home landing page
 *
 * The screen-share anchor for stakeholder meetings (Jim, Kendall, Sibe).
 * Big, tappable tiles linking to every public artifact in the Sentry build.
 * Audience-framed sections: SOC / Customers / Board / Plan / Docs.
 *
 * Same-tab navigation throughout (so browser back-button works during
 * screen-share). No new-tab opens, no popup chaos.
 *
 * Private artifacts (Know the Room, Maiden Voyage) are intentionally
 * excluded — they live elsewhere.
 */

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Shield, Monitor, Users, FileText, BarChart3, Layers,
  ArrowRight, Sparkles, FileSignature, ScrollText, Mail,
  Mic, MicOff, Send, ChevronDown, MessageSquare, Check,
  Network, UserCheck, ClipboardList,
} from "lucide-react";

/* ============================================================
 * BRAND TOKENS — Sentry design system (locked)
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
 * PROJECT CONFIG — the template seam
 *
 * Everything project-specific lives here. Forking this home page for a
 * new client (Denver Storm Door, Affordable Door, the next thing) is a
 * 30-second edit of this one block. The rest of the file is generic.
 *
 * Three rules for this block:
 *   1. Update `status` when you remember to. If it goes stale, it goes
 *      stale gracefully — nothing on the page breaks. No daily obligation.
 *   2. URLs that don't exist yet can be left as empty strings. Tiles
 *      with empty hrefs render disabled.
 *   3. Keep `currentState` to one sentence. If you need two sentences,
 *      the project is in a weird spot and the band can't fix that.
 * ============================================================ */
const PROJECT = {
  name: "Sentry",
  client: "VDA Labs",
  studio: "3Nails Infosec",
  heroEyebrow: "THE WORK SO FAR",
  heroTitle: "Everything we've built for VDA Labs, in one place.",
  heroSubtitle:
    "The analyst console, the customer portal, the board reports, the plan, the design system. Same brand, same data model, same tool. Pick the piece you want to see and we'll go.",
  // ── External resources ──
  deckUrl: "https://sentry-vda.netlify.app/VDA_SecOps_Plan.pdf",  // stable filename — re-upload future versions to this same name
  designSystemUrl: "https://sentry-vda.netlify.app/sentry-design-system.html",
  // ── Footer ──
  footerTagline: "BUILT BY 3NAILS INFOSEC FOR VDA LABS",
  footerNote: "NO VENDOR LOCK-IN · YOUR DATA, YOUR DECISIONS",
};

/* ============================================================
 * ARTIFACT MAP
 * Audience-framed. Order matters: SOC first (what Jim and Sibe care
 * about), then customer-facing (what their customers see), then board
 * (Kendall's view), then plan and docs.
 * ============================================================ */
const SECTIONS = [
  {
    eyebrow: "01",
    title: "For your SOC",
    tagline: "What Jim and Sibe touch every day.",
    tiles: [
      {
        to: "/",
        title: "Engineering Console",
        sub: "Where Sibe and the analyst team work the queue. SNYPR bridge, decision log, ticket triage.",
        Icon: Monitor,
        accent: T.orange,
      },
    ],
  },
  {
    eyebrow: "02",
    title: "For your customers",
    tagline: "What ends up in front of the people paying you.",
    tiles: [
      {
        to: "/client",
        title: "Customer Portal",
        sub: "Ticket view, security report, mobile-first.",
        Icon: Users,
        accent: T.steel,
      },
    ],
  },
  {
    eyebrow: "03",
    title: "For your board",
    tagline: "Reporting that makes the spend obvious.",
    tiles: [
      {
        to: "/insights-tiered",
        title: "Sentry Insights",
        sub: "A preview of Phase 2 reporting. Toggle Standard and Full depth, then Export PDF for a board-ready document.",
        Icon: Sparkles,
        accent: T.orange,
        primary: true,
      },
      {
        to: "/dashboard",
        title: "Sentry Dashboard · Basic",
        sub: "Original sandbox proof-of-concept.",
        Icon: Layers,
        accent: T.steel,
      },
    ],
  },
];

/* ============================================================
 * COMPONENTS
 * ============================================================ */

const Tile = ({ to, title, sub, Icon, accent = T.orange, primary = false, isMobile }) => {
  const [hover, setHover] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => window.scrollTo(0, 0)}
      style={{
        display: "block",
        textDecoration: "none",
        background: hover ? T.bgElevated : T.bgCard,
        border: `1px solid ${hover ? `${accent}55` : T.bgCardEdge}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 8,
        padding: isMobile ? "20px 18px" : "26px 24px",
        transition: "background 180ms ease-out, border-color 180ms ease-out, transform 180ms ease-out",
        transform: hover ? "translateY(-1px)" : "translateY(0)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        minHeight: primary ? (isMobile ? 120 : 140) : (isMobile ? 100 : 120),
      }}
    >
      {primary && (
        <div style={{ marginBottom: 14 }}>
          <span style={{
            display: "inline-block",
            fontFamily: T.fontMono, fontSize: 8, letterSpacing: "0.18em",
            color: accent, background: `${accent}15`,
            padding: "3px 9px", borderRadius: 3, fontWeight: 700,
          }}>RECOMMENDED</span>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 8,
          background: `${accent}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={22} color={accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: T.fontDisplay,
            fontSize: primary ? 19 : 17,
            fontWeight: 700,
            color: T.ink,
            marginBottom: 6,
            lineHeight: 1.25,
          }}>
            {title}
          </div>
          <div style={{
            fontFamily: T.fontBody,
            fontSize: 13,
            color: T.inkDim,
            lineHeight: 1.5,
          }}>
            {sub}
          </div>
        </div>
        <ArrowRight
          size={18}
          color={hover ? accent : T.inkMuted}
          style={{
            flexShrink: 0,
            marginTop: 6,
            transform: hover ? "translateX(2px)" : "translateX(0)",
            transition: "transform 180ms ease-out, color 180ms ease-out",
          }}
        />
      </div>
    </Link>
  );
};

const ExternalTile = ({ href, title, sub, Icon, accent = T.steel, isMobile }) => {
  // Used for off-site docs (GitHub raw, etc.) — same-tab nav so back works.
  const [hover, setHover] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "block",
        textDecoration: "none",
        background: hover ? T.bgElevated : T.bgCard,
        border: `1px solid ${hover ? `${accent}55` : T.bgCardEdge}`,
        borderLeft: `3px solid ${accent}`,
        borderRadius: 8,
        padding: isMobile ? "18px 16px" : "22px 20px",
        transition: "background 180ms ease-out, border-color 180ms ease-out",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 6,
          background: `${accent}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={18} color={accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: T.fontDisplay,
            fontSize: 15,
            fontWeight: 700,
            color: T.ink,
            marginBottom: 4,
          }}>
            {title}
          </div>
          <div style={{
            fontFamily: T.fontBody,
            fontSize: 12,
            color: T.inkDim,
            lineHeight: 1.5,
          }}>
            {sub}
          </div>
        </div>
      </div>
    </a>
  );
};

const Section = ({ eyebrow, title, tagline, tiles, isMobile }) => (
  <div style={{ marginBottom: isMobile ? 32 : 44 }}>
    <div style={{ marginBottom: 16 }}>
      <div style={{
        fontFamily: T.fontMono, fontSize: 10, color: T.orange,
        letterSpacing: "0.22em", fontWeight: 700, marginBottom: 6,
      }}>
        {eyebrow}
      </div>
      <div style={{
        fontFamily: T.fontDisplay,
        fontSize: isMobile ? 22 : 26,
        fontWeight: 700,
        color: T.ink,
        marginBottom: 4,
      }}>
        {title}
      </div>
      <div style={{
        fontFamily: T.fontDisplay,
        fontSize: isMobile ? 13 : 14,
        fontStyle: "italic",
        color: T.inkMuted,
      }}>
        {tagline}
      </div>
    </div>
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile
        ? "1fr"
        : tiles.length === 1 ? "1fr" : "repeat(2, 1fr)",
      gap: 12,
    }}>
      {tiles.map((t, i) => (
        <Tile key={i} {...t} isMobile={isMobile} />
      ))}
    </div>
  </div>
);

/* ============================================================
 * NOTES WIDGET — stakeholder feedback, named sender, voice + type
 *
 * Lives at the bottom of SentryHome. Collapsed by default. Click to expand.
 *
 *   - Required name selector (Jim / Kendall / Sibe / Vince / Joey / Other)
 *   - Voice transcription via Web Speech API (browser-native, no API key)
 *   - Light rule-based cleanup before review (trim, capitalize, normalize spaces)
 *   - "Review your note" preview panel before submit
 *   - Submits via Netlify Forms (free tier, lands in joey's email)
 *   - No fetch to AI APIs, no API keys, no backend
 *
 * Netlify Forms setup (one-time): in your repo, add a hidden form to
 * index.html so Netlify detects the form at build time:
 *
 *   <form name="sentry-notes" netlify hidden>
 *     <input name="sender" />
 *     <input name="subject" />
 *     <textarea name="note"></textarea>
 *   </form>
 *
 * Then point Netlify's form-notification email to joey@3nails-infosec.com.
 * ============================================================ */

const SENDERS = ["Jim", "Kendall", "Sibe", "Vince", "Joey", "Other"];

const NOTES_KEY = "sentry-notes-log-v1";

const STATUS_FLOW = { new: "heard", heard: "integrated", integrated: "new" };
const STATUS_LABELS = { new: "New", heard: "Heard", integrated: "Integrated" };
const STATUS_COLORS = (T) => ({ new: T.orange, heard: T.steel, integrated: "#5B8F6F" });

// Rule-based cleanup. No AI. Just housekeeping so the preview looks tidy
// without changing meaning. Trim, normalize whitespace, capitalize first
// letter of each sentence, ensure terminal punctuation.
const cleanupNote = (raw) => {
  if (!raw) return "";
  let t = raw.trim().replace(/\s+/g, " ").replace(/\s+([,.!?;:])/g, "$1");
  // Capitalize first letter of the whole note
  if (t.length > 0) t = t[0].toUpperCase() + t.slice(1);
  // Capitalize first letter after sentence-ending punctuation + space
  t = t.replace(/([.!?])\s+([a-z])/g, (_, p, c) => `${p} ${c.toUpperCase()}`);
  // Add a period if there's no terminal punctuation
  if (!/[.!?]$/.test(t)) t = t + ".";
  return t;
};

const NotesWidget = ({ isMobile }) => {
  const [expanded, setExpanded] = useState(false);
  const [sender, setSender] = useState("");
  const [otherName, setOtherName] = useState("");
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [notesLog, setNotesLog] = useState([]);
  const recognitionRef = useRef(null);
  const statusColors = STATUS_COLORS(T);

  // Read the running log from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(NOTES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setNotesLog(parsed);
      }
    } catch (err) {
      // Corrupt data — start fresh, don't crash the page
      console.warn("Notes log read failed:", err);
    }
  }, []);

  // Detect Web Speech API support on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, []);

  const startListening = () => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceSupported(false); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let final = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      if (final) setNote(prev => (prev + " " + final).trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setListening(false);
  };

  const effectiveSender = sender === "Other" ? otherName.trim() : sender;
  const polished = cleanupNote(note);
  const canSubmit = !!effectiveSender && polished.length > 1;

  const handleReview = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setShowPreview(true);
  };

  // Netlify Forms accepts AJAX submissions too. We use that path here:
  // a native form POST would redirect the browser to Netlify's default
  // success URL (e.g. "/?form-submitted=..."), which is not a real route
  // in this SPA, so the user lands on a 404. Submitting via fetch keeps
  // them on the page so the thank-you card and live log render normally.
  //
  // Netlify still recognizes the form because the hidden form is declared
  // in index.html at build time, and we include form-name in the POST body.
  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Persist locally so the live log updates immediately on this device.
    const entry = {
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender: effectiveSender,
      subject: subject || "",
      note: polished,
      status: "new",
      ts: Date.now(),
    };
    try {
      const next = [entry, ...notesLog].slice(0, 200);
      window.localStorage.setItem(NOTES_KEY, JSON.stringify(next));
      setNotesLog(next);
    } catch (err) {
      console.warn("Notes log write failed:", err);
    }

    // 2. POST to Netlify Forms via fetch (no navigation).
    const body = new URLSearchParams({
      "form-name": "sentry-notes",
      sender: effectiveSender,
      subject: subject || "",
      note: polished,
    }).toString();
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }).catch(err => {
      // If Netlify is briefly unreachable, the local entry above still
      // stands so the sender's note isn't lost from this device's view.
      console.warn("Netlify form POST failed:", err);
    });

    // 3. Flip to the thank-you state.
    setSubmitted(true);
  };

  // Reset the form so the user can send another note without a hard refresh.
  const resetForm = () => {
    setSender("");
    setOtherName("");
    setSubject("");
    setNote("");
    setShowPreview(false);
    setSubmitted(false);
    setExpanded(true);
  };

  // Advance status one step: new -> heard -> integrated -> back to new.
  const advanceStatus = (id) => {
    const next = notesLog.map(n =>
      n.id === id ? { ...n, status: STATUS_FLOW[n.status] || "new" } : n
    );
    setNotesLog(next);
    try { window.localStorage.setItem(NOTES_KEY, JSON.stringify(next)); }
    catch (err) { console.warn("Notes log update failed:", err); }
  };

  // Clear the local view only. The Netlify Forms record persists in the
  // dashboard and email regardless — nothing is actually deleted.
  const clearLocalLog = () => {
    if (typeof window === "undefined") return;
    const ok = window.confirm(
      "Clear the local note log on this device?\n\n" +
      "This only hides notes from this page on this device. Notes you've " +
      "submitted are still saved in the Netlify Forms dashboard and have " +
      "been emailed to Joey. Nothing is actually deleted."
    );
    if (!ok) return;
    try { window.localStorage.removeItem(NOTES_KEY); } catch {}
    setNotesLog([]);
  };

  const formatTimestamp = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Running log render — appears above the form/button so it's always visible.
  // The log is the demo: Joey screen-shares his device, shows notes appearing
  // and being marked Heard/Integrated. Stakeholders see "the same shape as the
  // ticketing app we're proposing for your customers."
  const renderLog = () => {
    if (notesLog.length === 0) return null;
    return (
      <div style={{ marginBottom: 18 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          marginBottom: 10, gap: 10, flexWrap: "wrap",
        }}>
          <div>
            <div style={{
              fontFamily: T.fontMono, fontSize: 9, color: T.orange,
              letterSpacing: "0.22em", fontWeight: 700, marginBottom: 4,
            }}>
              NOTE LOG · LIVE
            </div>
            <div style={{
              fontFamily: T.fontBody, fontSize: 11, color: T.inkMuted,
              fontStyle: "italic",
            }}>
              Tap a status to advance: New → Heard → Integrated.
            </div>
          </div>
          <button
            type="button"
            onClick={clearLocalLog}
            style={{
              padding: "6px 12px", borderRadius: 4,
              border: `1px solid ${T.bgCardEdge}`,
              background: "transparent", color: T.inkMuted,
              cursor: "pointer",
              fontFamily: T.fontMono, fontSize: 9,
              letterSpacing: "0.12em", fontWeight: 700,
            }}
            title="Clears local view only — Netlify keeps the durable record."
          >
            CLEAR LOCAL VIEW
          </button>
        </div>
        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {notesLog.map(n => {
            const sColor = statusColors[n.status] || T.inkMuted;
            return (
              <div key={n.id} style={{
                background: T.bgCard,
                border: `1px solid ${T.bgCardEdge}`,
                borderLeft: `3px solid ${sColor}`,
                borderRadius: 6,
                padding: isMobile ? "12px 14px" : "14px 16px",
              }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "baseline", gap: 10, marginBottom: 6, flexWrap: "wrap",
                }}>
                  <div style={{
                    fontFamily: T.fontMono, fontSize: 10,
                    color: T.orange, fontWeight: 700, letterSpacing: "0.08em",
                  }}>
                    {n.sender.toUpperCase()}
                    {n.subject && (
                      <span style={{ color: T.inkDim, fontWeight: 400, letterSpacing: "0.02em" }}>
                        {" · "}{n.subject}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{
                      fontFamily: T.fontMono, fontSize: 9,
                      color: T.inkMuted, letterSpacing: "0.06em",
                    }}>
                      {formatTimestamp(n.ts)}
                    </span>
                    <button
                      type="button"
                      onClick={() => advanceStatus(n.id)}
                      title="Click to advance status"
                      style={{
                        padding: "3px 9px", borderRadius: 3,
                        border: `1px solid ${sColor}55`,
                        background: `${sColor}15`,
                        color: sColor, cursor: "pointer",
                        fontFamily: T.fontMono, fontSize: 9,
                        letterSpacing: "0.14em", fontWeight: 700,
                      }}
                    >
                      {STATUS_LABELS[n.status]}
                    </button>
                  </div>
                </div>
                <div style={{
                  fontFamily: T.fontBody, fontSize: 13, color: T.ink,
                  lineHeight: 1.55,
                }}>
                  {n.note}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{
          fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted,
          letterSpacing: "0.06em", marginTop: 10, fontStyle: "italic",
        }}>
          Live view on this device. Every submission is also saved in the
          Netlify Forms dashboard and emailed — clearing here doesn't delete
          anything Joey has on file.
        </div>
      </div>
    );
  };

  if (submitted) {
    return (
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: isMobile ? "32px 14px 24px" : "44px 28px 32px",
      }}>
        <div style={{
          background: T.bgCard,
          border: `1px solid ${T.bgCardEdge}`,
          borderLeft: `3px solid ${T.orange}`,
          borderRadius: 8,
          padding: isMobile ? "24px 18px" : "32px 28px",
          display: "flex", gap: 16, alignItems: "flex-start",
          marginBottom: 18,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 8,
            background: `${T.orange}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Check size={20} color={T.orange} />
          </div>
          <div>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: 18, color: T.ink,
              fontWeight: 700, marginBottom: 6,
            }}>
              Thanks, {effectiveSender}.
            </div>
            <div style={{
              fontFamily: T.fontBody, fontSize: 13, color: T.inkDim,
              lineHeight: 1.55,
            }}>
              Your note is in the log below and Joey will see it within a few
              hours. If it's time-sensitive, ping him directly.
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <button
            type="button"
            onClick={resetForm}
            style={{
              padding: "10px 18px", borderRadius: 6,
              border: `1px solid ${T.orange}`,
              background: T.orangeTint, color: T.orange,
              cursor: "pointer",
              fontFamily: T.fontMono, fontSize: 10,
              letterSpacing: "0.14em", fontWeight: 700,
            }}
          >
            SEND ANOTHER NOTE
          </button>
        </div>
        {renderLog()}
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 1100, margin: "0 auto",
      padding: isMobile ? "32px 14px 24px" : "44px 28px 32px",
    }}>
      {renderLog()}
      {/* Collapsed state: a discreet "send a note" prompt */}
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          style={{
            width: "100%",
            background: T.bgCard,
            border: `1px solid ${T.bgCardEdge}`,
            borderRadius: 8,
            padding: isMobile ? "16px 18px" : "20px 22px",
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 14,
            fontFamily: "inherit",
            transition: "background 180ms ease-out, border-color 180ms ease-out",
            textAlign: "left",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${T.orange}55`; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.bgCardEdge; }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 8,
            background: `${T.orange}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <MessageSquare size={18} color={T.orange} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: 15, color: T.ink,
              fontWeight: 700, marginBottom: 2,
            }}>
              Send Joey a note
            </div>
            <div style={{
              fontFamily: T.fontBody, fontSize: 12, color: T.inkMuted,
            }}>
              Reactions, questions, or something we should change. Type or talk.
            </div>
          </div>
          <ChevronDown size={18} color={T.inkMuted} style={{ flexShrink: 0 }} />
        </button>
      ) : (
        <div style={{
          background: T.bgCard,
          border: `1px solid ${T.bgCardEdge}`,
          borderRadius: 8,
          padding: isMobile ? "20px 18px" : "28px 26px",
        }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontFamily: T.fontMono, fontSize: 10, color: T.orange,
              letterSpacing: "0.22em", fontWeight: 700, marginBottom: 6,
            }}>
              SEND A NOTE
            </div>
            <div style={{
              fontFamily: T.fontDisplay, fontSize: isMobile ? 20 : 22,
              color: T.ink, fontWeight: 700,
            }}>
              What's on your mind?
            </div>
          </div>

          {/*
            Netlify Forms: the form name must match a hidden form in index.html.
            Inputs use real `name` attributes so Netlify captures them.
          */}
          <form
            name="sentry-notes"
            method="POST"
            data-netlify="true"
            netlify-honeypot="bot-field"
            onSubmit={handleSubmit}
          >
            <input type="hidden" name="form-name" value="sentry-notes" />
            <p style={{ display: "none" }}>
              <label>Don't fill this out: <input name="bot-field" /></label>
            </p>

            {/* ── Name selector ── */}
            <div style={{ marginBottom: 18 }}>
              <div style={{
                fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted,
                letterSpacing: "0.16em", fontWeight: 700, marginBottom: 8,
              }}>
                YOU ARE <span style={{ color: T.orange }}>·</span> REQUIRED
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {SENDERS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSender(s)}
                    style={{
                      fontFamily: T.fontBody, fontSize: 13,
                      padding: "8px 16px", borderRadius: 999,
                      border: `1px solid ${sender === s ? T.orange : T.bgCardEdge}`,
                      background: sender === s ? T.orangeTint : "transparent",
                      color: sender === s ? T.orange : T.inkDim,
                      cursor: "pointer", fontWeight: sender === s ? 700 : 400,
                      transition: "all 180ms ease-out",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {sender === "Other" && (
                <input
                  type="text"
                  placeholder="Your name"
                  value={otherName}
                  onChange={e => setOtherName(e.target.value)}
                  style={{
                    marginTop: 10, width: "100%",
                    padding: "10px 14px", borderRadius: 6,
                    border: `1px solid ${T.bgCardEdge}`,
                    background: T.bgDeep, color: T.ink,
                    fontFamily: T.fontBody, fontSize: 13,
                    outline: "none",
                  }}
                />
              )}
              {/* hidden name field carries the effective sender to Netlify */}
              <input type="hidden" name="sender" value={effectiveSender} />
            </div>

            {/* ── Subject (optional) ── */}
            <div style={{ marginBottom: 14 }}>
              <input
                type="text"
                name="subject"
                placeholder="Subject (optional)"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px", borderRadius: 6,
                  border: `1px solid ${T.bgCardEdge}`,
                  background: T.bgDeep, color: T.ink,
                  fontFamily: T.fontBody, fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            {/* ── Note textarea + mic ── */}
            <div style={{ marginBottom: 14, position: "relative" }}>
              <textarea
                name="note"
                placeholder={listening ? "Listening… speak now." : "Type your note, or tap the mic to talk."}
                value={note}
                onChange={e => { setNote(e.target.value); setShowPreview(false); }}
                rows={isMobile ? 5 : 6}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  paddingRight: 52,
                  borderRadius: 6,
                  border: `1px solid ${listening ? T.orange : T.bgCardEdge}`,
                  background: T.bgDeep, color: T.ink,
                  fontFamily: T.fontBody, fontSize: 14,
                  outline: "none",
                  resize: "vertical",
                  lineHeight: 1.55,
                  transition: "border-color 180ms ease-out",
                }}
              />
              {voiceSupported && (
                <button
                  type="button"
                  onClick={listening ? stopListening : startListening}
                  title={listening ? "Stop recording" : "Start voice note"}
                  style={{
                    position: "absolute",
                    top: 10, right: 10,
                    width: 36, height: 36, borderRadius: 8,
                    border: "none",
                    background: listening ? T.orange : `${T.orange}18`,
                    color: listening ? "#fff" : T.orange,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 180ms ease-out",
                  }}
                >
                  {listening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              )}
              {!voiceSupported && (
                <div style={{
                  fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted,
                  marginTop: 6, letterSpacing: "0.04em",
                }}>
                  Voice not available in this browser — type your note below.
                </div>
              )}
            </div>

            {/* ── Review preview (rule-based polish, no AI) ── */}
            {showPreview && polished && (
              <div style={{
                background: T.bgElevated,
                border: `1px dashed ${T.orange}55`,
                borderRadius: 6,
                padding: isMobile ? "14px 16px" : "16px 18px",
                marginBottom: 14,
              }}>
                <div style={{
                  fontFamily: T.fontMono, fontSize: 9, color: T.orange,
                  letterSpacing: "0.18em", fontWeight: 700, marginBottom: 8,
                }}>
                  REVIEW BEFORE SEND
                </div>
                <div style={{
                  fontFamily: T.fontBody, fontSize: 13, color: T.inkDim,
                  marginBottom: 10,
                }}>
                  From <span style={{ color: T.orange, fontWeight: 700 }}>{effectiveSender}</span>
                  {subject && <> · <span style={{ color: T.ink }}>{subject}</span></>}
                </div>
                <div style={{
                  fontFamily: T.fontDisplay, fontSize: 14, color: T.ink,
                  lineHeight: 1.65, fontStyle: "italic",
                }}>
                  "{polished}"
                </div>
              </div>
            )}

            {/* ── Buttons ── */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => { setExpanded(false); setShowPreview(false); }}
                style={{
                  padding: "10px 18px", borderRadius: 6,
                  border: `1px solid ${T.bgCardEdge}`,
                  background: "transparent", color: T.inkDim,
                  cursor: "pointer",
                  fontFamily: T.fontMono, fontSize: 10,
                  letterSpacing: "0.14em", fontWeight: 700,
                }}
              >
                CANCEL
              </button>
              {!showPreview ? (
                <button
                  type="button"
                  onClick={handleReview}
                  disabled={!canSubmit}
                  style={{
                    padding: "10px 18px", borderRadius: 6,
                    border: `1px solid ${canSubmit ? T.orange : T.bgCardEdge}`,
                    background: canSubmit ? T.orangeTint : "transparent",
                    color: canSubmit ? T.orange : T.inkMuted,
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    fontFamily: T.fontMono, fontSize: 10,
                    letterSpacing: "0.14em", fontWeight: 700,
                    opacity: canSubmit ? 1 : 0.6,
                  }}
                >
                  REVIEW
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSubmit}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "10px 20px", borderRadius: 6,
                    border: "none",
                    background: T.orange, color: "#fff",
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    fontFamily: T.fontMono, fontSize: 10,
                    letterSpacing: "0.14em", fontWeight: 700,
                  }}
                >
                  <Send size={12} /> SEND
                </button>
              )}
              {!canSubmit && (
                <span style={{
                  fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted,
                  alignSelf: "center", letterSpacing: "0.06em",
                }}>
                  {!effectiveSender ? "Pick your name first." : "Add a note."}
                </span>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

/* ============================================================
 * MAIN
 * ============================================================ */
export default function SentryHome() {
  const isMobile = useIsMobile();

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.ink }}>
      {/* ── Top chrome ── */}
      <div style={{
        background: T.bgDeep,
        borderBottom: `1px solid ${T.bgCardEdge}`,
        padding: isMobile ? "12px 14px" : "14px 28px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={20} color={T.orange} />
          <span style={{
            fontFamily: T.fontDisplay,
            fontSize: 17,
            color: T.ink,
            fontWeight: 700,
          }}>
            Sentry
          </span>
          <span style={{
            fontFamily: T.fontMono, fontSize: 8,
            color: T.orange,
            letterSpacing: "0.14em",
            background: `${T.orange}15`,
            padding: "2px 8px",
            borderRadius: 3,
            fontWeight: 700,
          }}>
            PROJECT HOME
          </span>
        </div>
        <div style={{
          fontFamily: T.fontMono,
          fontSize: 9,
          color: T.inkMuted,
          letterSpacing: "0.14em",
        }}>
          VDA LABS × 3NAILS INFOSEC
        </div>
      </div>

      {/* ── Hero band ── */}
      <div style={{
        padding: isMobile ? "32px 14px 24px" : "56px 28px 40px",
        maxWidth: 1100,
        margin: "0 auto",
      }}>
        <div style={{
          fontFamily: T.fontMono,
          fontSize: 10,
          color: T.orange,
          letterSpacing: "0.24em",
          fontWeight: 700,
          marginBottom: 14,
        }}>
          {PROJECT.heroEyebrow}
        </div>
        <div style={{
          fontFamily: T.fontDisplay,
          fontSize: isMobile ? 32 : 46,
          fontWeight: 400,
          color: T.ink,
          lineHeight: 1.12,
          letterSpacing: "-0.01em",
          marginBottom: 18,
          maxWidth: 880,
        }}>
          {PROJECT.heroTitle}
        </div>
        <div style={{
          fontFamily: T.fontDisplay,
          fontSize: isMobile ? 15 : 17,
          fontStyle: "italic",
          color: T.inkDim,
          lineHeight: 1.55,
          maxWidth: 720,
        }}>
          {PROJECT.heroSubtitle}
        </div>
        <div style={{
          marginTop: 28,
          height: 2,
          width: 80,
          background: T.orange,
        }} />
      </div>

      {/* ── Sections ── */}
      <div style={{
        padding: isMobile ? "8px 14px 24px" : "8px 28px 36px",
        maxWidth: 1100,
        margin: "0 auto",
      }}>
        {SECTIONS.map((s, i) => (
          <Section key={i} {...s} isMobile={isMobile} />
        ))}

        {/* ── 04 · The plan & design system (external links) ── */}
        <div style={{ marginBottom: isMobile ? 32 : 44 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: T.fontMono, fontSize: 10, color: T.orange,
              letterSpacing: "0.22em", fontWeight: 700, marginBottom: 6,
            }}>
              04
            </div>
            <div style={{
              fontFamily: T.fontDisplay,
              fontSize: isMobile ? 22 : 26,
              fontWeight: 700,
              color: T.ink,
              marginBottom: 4,
            }}>
              The plan
            </div>
            <div style={{
              fontFamily: T.fontDisplay,
              fontSize: isMobile ? 13 : 14,
              fontStyle: "italic",
              color: T.inkMuted,
            }}>
              How we got here and where we're going.
            </div>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 12,
          }}>
            <ExternalTile
              href={PROJECT.deckUrl}
              title="SecOps Rebuild Deck"
              sub="17 slides. Background, options, scope, metrics, timeline."
              Icon={FileText}
              accent={T.orange}
              isMobile={isMobile}
            />
            <ExternalTile
              href="https://sentry-vda.netlify.app/VDA_Discovery_Questionnaire.pdf"
              title="Discovery Questionnaire"
              sub="Thirteen questions to lock MVP scope. Out with Jim and Sibe."
              Icon={ClipboardList}
              accent={T.steel}
              isMobile={isMobile}
            />
            <ExternalTile
              href={PROJECT.designSystemUrl}
              title="Design System"
              sub="Tokens, typography, color rules, component patterns."
              Icon={Sparkles}
              accent={T.steel}
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* ── 05 · Docs ── */}
        <div style={{ marginBottom: isMobile ? 32 : 44 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: T.fontMono, fontSize: 10, color: T.orange,
              letterSpacing: "0.22em", fontWeight: 700, marginBottom: 6,
            }}>
              05
            </div>
            <div style={{
              fontFamily: T.fontDisplay,
              fontSize: isMobile ? 22 : 26,
              fontWeight: 700,
              color: T.ink,
              marginBottom: 4,
            }}>
              The docs
            </div>
            <div style={{
              fontFamily: T.fontDisplay,
              fontSize: isMobile ? 13 : 14,
              fontStyle: "italic",
              color: T.inkMuted,
            }}>
              Discovery, scope, architecture, and handoff readiness for your team.
            </div>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 12,
          }}>
            <ExternalTile
              href="https://github.com/joeyough/sentry/blob/main/README.md"
              title="README"
              sub="What this is, in Jim's language."
              Icon={ScrollText}
              accent={T.steel}
              isMobile={isMobile}
            />
            <ExternalTile
              href="https://github.com/joeyough/sentry/blob/main/docs/SCOPE_AUDIT.md"
              title="Scope Audit"
              sub="What's in, what's out, why."
              Icon={FileSignature}
              accent={T.steel}
              isMobile={isMobile}
            />
            <ExternalTile
              href="https://github.com/joeyough/sentry/blob/main/docs/DISCOVERY.md"
              title="Discovery Notes"
              sub="Call synthesis, integration patterns."
              Icon={Mail}
              accent={T.steel}
              isMobile={isMobile}
            />
            <ExternalTile
              href="https://github.com/joeyough/sentry/blob/main/docs/ARCHITECTURE.md"
              title="Architecture"
              sub="How it's wired together."
              Icon={Network}
              accent={T.steel}
              isMobile={isMobile}
            />
            <ExternalTile
              href="https://github.com/joeyough/sentry/blob/main/docs/BUS_FACTOR.md"
              title="Bus Factor"
              sub="If we disappear, here's how to keep it running."
              Icon={UserCheck}
              accent={T.steel}
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* ── Notes widget ── */}
      <NotesWidget isMobile={isMobile} />

      {/* ── Footer ── */}
      <div style={{
        borderTop: `1px solid ${T.bgCardEdge}`,
        padding: isMobile ? "20px 14px" : "26px 28px",
        background: T.bgDeep,
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto",
          display: "flex", justifyContent: "space-between",
          flexWrap: "wrap", gap: 10,
          fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted,
          letterSpacing: "0.14em",
        }}>
          <span>{PROJECT.name.toUpperCase()} · {PROJECT.footerTagline}</span>
          <span style={{ color: T.inkDim }}>{PROJECT.footerNote}</span>
        </div>
      </div>
    </div>
  );
}
