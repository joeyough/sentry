<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sentry Client · VDA Labs</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: #e8e6e0; min-height: 100vh; overscroll-behavior: none; }
body { padding: 20px 12px; transition: background 0.4s ease; }
body.dark { background: #050505; }
.serif { font-family: 'Fraunces', 'Iowan Old Style', Georgia, serif; font-optical-sizing: auto; }
.sans { font-family: 'Inter', -apple-system, system-ui, sans-serif; }
.mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
.report-serif { font-family: 'Cormorant Garamond', Georgia, serif; }

:root {
  --bg: #fbfaf7; --surface: #ffffff; --surfaceHi: #f4f1eb;
  --text: #1a1816; --textDim: #7a756d; --textMid: #5a5550;
  --border: rgba(0,0,0,0.06); --borderStrong: rgba(0,0,0,0.12);
  --brand: #c83e00; --brandDim: rgba(200, 62, 0, 0.06); --brandEdge: rgba(200, 62, 0, 0.25);
  --onBrand: #ffffff;
  --statusClear: #4a6b54; --statusWorking: #a8651e; --statusAttention: #a83a32;
  --statusClearDim: rgba(74, 107, 84, 0.08);
  --statusWorkingDim: rgba(168, 101, 30, 0.08);
  --statusAttentionDim: rgba(168, 58, 50, 0.08);
  --phoneShadow: 0 30px 80px rgba(0,0,0,0.18), 0 0 0 8px #fafaf7, 0 0 0 9px #d8d4cc;
  --brandGrad: linear-gradient(135deg, rgba(200,62,0,0.10) 0%, rgba(200,62,0,0.02) 100%);
  --teachGrad: linear-gradient(135deg, rgba(200,62,0,0.08) 0%, rgba(200,62,0,0.02) 100%);
  --timelineGrad: linear-gradient(135deg, rgba(74,107,84,0.06) 0%, rgba(74,107,84,0.02) 100%);
}
body.dark {
  --bg: #0e0f10; --surface: #16181a; --surfaceHi: #1d1f22;
  --text: #f5f3ee; --textDim: #8a8680; --textMid: #a8a49d;
  --border: rgba(255,255,255,0.06); --borderStrong: rgba(255,255,255,0.12);
  --brand: #ff5722; --brandDim: rgba(255, 87, 34, 0.12); --brandEdge: rgba(255, 87, 34, 0.35);
  --statusClear: #9bb5a3; --statusWorking: #d4a574; --statusAttention: #c95850;
  --statusClearDim: rgba(155, 181, 163, 0.12);
  --statusWorkingDim: rgba(212, 165, 116, 0.12);
  --statusAttentionDim: rgba(201, 88, 80, 0.12);
  --phoneShadow: 0 30px 80px rgba(0,0,0,0.7), 0 0 0 8px #18181a, 0 0 0 9px #2a2a2c;
  --brandGrad: linear-gradient(135deg, rgba(255,87,34,0.15) 0%, rgba(255,87,34,0.05) 100%);
  --teachGrad: linear-gradient(135deg, rgba(255,87,34,0.14) 0%, rgba(255,87,34,0.04) 100%);
  --timelineGrad: linear-gradient(135deg, rgba(155,181,163,0.08) 0%, rgba(155,181,163,0.02) 100%);
}

@keyframes pulse-slow { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
.pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
@keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.fade-in { animation: fade-in 0.4s ease-out; }
@keyframes scale-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
.scale-in { animation: scale-in 0.3s ease-out; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin-slow { animation: spin 8s linear infinite; }
@keyframes slide-up { from { transform: translateY(100%); opacity: 0.7; } to { transform: translateY(0); opacity: 1; } }
.slide-up { animation: slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1); }

/* NEW — noted toast animation */
@keyframes noted-pop {
  0% { transform: translateY(10px) scale(0.9); opacity: 0; }
  20% { transform: translateY(0) scale(1.05); opacity: 1; }
  35% { transform: translateY(0) scale(1); opacity: 1; }
  80% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(-8px) scale(0.95); opacity: 0; }
}
.noted-pop {
  animation: noted-pop 2.4s cubic-bezier(0.32, 0.72, 0, 1) forwards;
}

/* SLA pulse */
@keyframes sla-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(74,107,84, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(74,107,84, 0); }
}
body.dark .sla-pulse-dot { animation: sla-pulse-dark 2.5s ease-in-out infinite; }
@keyframes sla-pulse-dark {
  0%,100% { box-shadow: 0 0 0 0 rgba(155,181,163, 0.5); }
  50% { box-shadow: 0 0 0 4px rgba(155,181,163, 0); }
}
.sla-pulse-dot { animation: sla-pulse 2.5s ease-in-out infinite; }

.wrap { max-width: 1100px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 0 8px; gap: 12px; }
.header-brand { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.brand-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brand); flex-shrink: 0; }
.wordmark { font-size: 10px; letter-spacing: 0.25em; color: var(--brand); text-transform: uppercase; font-weight: 700; }
.client-name-header { font-size: 13px; color: var(--text); letter-spacing: -0.005em; margin-top: 2px; }
.theme-toggle { display: flex; gap: 8px; align-items: center; }
.theme-btn { font-size: 9px; padding: 4px 10px; background: transparent; color: #999; border: 1px solid transparent; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.18em; cursor: pointer; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
.theme-btn.active { background: #fff; color: #000; border-color: #ddd; }
body.dark .theme-btn { color: #666; }
body.dark .theme-btn.active { background: #222; color: #fff; border-color: #333; }

.phone { max-width: 420px; margin: 0 auto; background: var(--bg); color: var(--text); border-radius: 44px; overflow: hidden; box-shadow: var(--phoneShadow); position: relative; min-height: 820px; transition: background 0.4s ease, color 0.4s ease; }
.notch { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 120px; height: 26px; background: #000; border-radius: 20px; z-index: 10; }
.status-bar { display: flex; justify-content: space-between; padding: 16px 28px 0; font-size: 11px; font-weight: 600; color: var(--text); letter-spacing: 0.05em; }
.screen { padding: 56px 28px 32px; min-height: 740px; }
.home-indicator { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); width: 120px; height: 4px; background: var(--text); opacity: 0.25; border-radius: 2px; }

.btn { cursor: pointer; font-family: inherit; border: none; background: transparent; color: inherit; }
.btn-back { font-size: 11px; padding: 0 0 24px; display: flex; align-items: center; gap: 6px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; color: var(--textDim); font-family: 'JetBrains Mono', monospace; }

.card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 20px; margin-bottom: 16px; }
.card-lg { border-radius: 24px; padding: 32px 24px; }

.eyebrow { font-size: 9px; letter-spacing: 0.2em; color: var(--textDim); text-transform: uppercase; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
.eyebrow-accent { color: var(--brand); font-weight: 700; letter-spacing: 0.22em; }
.eyebrow-attn { color: var(--statusAttention); font-weight: 700; }
.eyebrow-working { color: var(--statusWorking); font-weight: 700; }
.eyebrow-clear { color: var(--statusClear); font-weight: 700; }

.greeting { font-size: 10px; color: var(--textDim); margin-bottom: 6px; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
.client-name { font-size: 26px; font-weight: 400; color: var(--text); margin-bottom: 32px; letter-spacing: -0.01em; }

.status-card { position: relative; overflow: hidden; }
.status-wash { position: absolute; top: -40%; right: -20%; width: 240px; height: 240px; opacity: 0.08; filter: blur(80px); border-radius: 50%; pointer-events: none; }
.status-inner { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; }
.status-icon-wrap { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
.status-headline { font-size: 32px; font-weight: 400; color: var(--text); margin-bottom: 8px; letter-spacing: -0.02em; }
.status-sub { font-size: 14px; color: var(--textDim); line-height: 1.5; max-width: 260px; }

.item-btn { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 20px; margin-bottom: 12px; text-align: left; cursor: pointer; color: var(--text); font-family: inherit; display: block; }
.item-btn.attn { border-color: rgba(168, 58, 50, 0.4); }
body.dark .item-btn.attn { border-color: rgba(201, 88, 80, 0.4); }
.item-btn.working { border-left: 3px solid var(--statusWorking); }
.item-btn.attn-left { border-left: 3px solid var(--statusAttention); }

.item-title { font-size: 18px; color: var(--text); margin-bottom: 6px; line-height: 1.3; }
.item-title-sm { font-size: 16px; }
.item-body { font-size: 13px; color: var(--textDim); line-height: 1.5; margin-bottom: 12px; }
.item-body-sm { font-size: 12px; }
.item-meta { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--textDim); }
.meta-mono { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.05em; color: var(--textDim); }

.working-summary { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 18px 20px; margin-bottom: 20px; text-align: left; cursor: pointer; color: var(--text); font-family: inherit; display: flex; justify-content: space-between; align-items: center; }

.stat-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; }
.stat-big { font-size: 32px; font-weight: 400; color: var(--text); line-height: 1; letter-spacing: -0.02em; }
.stat-label { font-size: 11px; color: var(--textDim); margin-top: 6px; }
.stat-mini-row { display: flex; justify-content: space-between; font-size: 12px; }
.divider { height: 1px; background: var(--border); margin: 0 -20px 16px; }

.report-cta { width: 100%; background: var(--brandGrad); border: 1px solid var(--brandEdge); border-left: 3px solid var(--brand); border-radius: 16px; padding: 18px; cursor: pointer; color: var(--text); font-family: inherit; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 16px rgba(200,62,0,0.07); }
body.dark .report-cta { box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
.report-cta-icon { width: 36px; height: 36px; border-radius: 10px; background: var(--brandDim); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

.decision-title { font-size: 26px; color: var(--text); margin-bottom: 16px; line-height: 1.2; letter-spacing: -0.01em; }
.decision-headline { font-size: 15px; color: var(--text); line-height: 1.6; margin-bottom: 24px; }
.context-card, .rec-card { background: var(--surfaceHi); border: 1px solid var(--border); border-radius: 16px; padding: 18px; margin-bottom: 16px; }
.rec-card.attn { border-color: rgba(168, 58, 50, 0.3); }
.rec-card.working { border-color: rgba(168, 101, 30, 0.3); }
.card-title { font-size: 13px; color: var(--text); line-height: 1.6; }

/* === RESPONSE TIMELINE === */
.timeline-card {
  background: var(--timelineGrad);
  border: 1px solid rgba(74,107,84,0.25);
  border-left: 3px solid var(--statusClear);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 16px;
}
body.dark .timeline-card { border-color: rgba(155,181,163,0.25); }
.timeline-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.timeline-head-left { display: flex; align-items: center; gap: 10px; }
.timeline-icon {
  width: 28px; height: 28px; border-radius: 8px;
  background: var(--statusClearDim);
  display: flex; align-items: center; justify-content: center;
  color: var(--statusClear);
}
.sla-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 999px;
  background: var(--statusClearDim);
  border: 1px solid rgba(74,107,84,0.3);
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px; letter-spacing: 0.12em;
  color: var(--statusClear); font-weight: 700;
  text-transform: uppercase;
}
body.dark .sla-badge { border-color: rgba(155,181,163,0.3); }
.sla-badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--statusClear);
  border-radius: 50%;
}
.timeline-list {
  list-style: none; padding: 0; margin: 0;
  position: relative;
}
.timeline-list::before {
  content: "";
  position: absolute;
  left: 9px; top: 10px; bottom: 10px;
  width: 1px; background: var(--border);
}
.timeline-item {
  display: flex; gap: 14px; padding: 6px 0 6px 0;
  position: relative;
  align-items: flex-start;
}
.timeline-dot {
  width: 18px; height: 18px; border-radius: 50%;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--surface);
  border: 1px solid var(--border);
  position: relative; z-index: 1;
  margin-top: 1px;
}
.timeline-dot.done { background: var(--statusClear); border-color: var(--statusClear); color: #fff; }
.timeline-dot.current { background: var(--brandDim); border-color: var(--brand); }
.timeline-dot.current-inner { width: 7px; height: 7px; border-radius: 50%; background: var(--brand); }
.timeline-body { flex: 1; min-width: 0; padding-top: 1px; }
.timeline-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px; font-weight: 500;
  color: var(--text); line-height: 1.4;
}
.timeline-label.waiting { color: var(--brand); }
.timeline-meta {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px; letter-spacing: 0.08em;
  color: var(--textDim); margin-top: 3px;
}

.asset-row { display: flex; justify-content: space-between; padding: 12px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); margin-bottom: 20px; }

.teach { background: var(--teachGrad); border: 1px solid var(--brandEdge); border-left: 3px solid var(--brand); border-radius: 16px; padding: 18px; margin-bottom: 20px; box-shadow: 0 4px 16px rgba(200,62,0,0.08); position: relative; }
body.dark .teach { box-shadow: 0 4px 16px rgba(0,0,0,0.25); }
.teach-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.teach-icon { width: 28px; height: 28px; border-radius: 8px; background: var(--brandDim); display: flex; align-items: center; justify-content: center; color: var(--brand); }
.teach-title { font-size: 18px; color: var(--text); margin-bottom: 8px; letter-spacing: -0.005em; line-height: 1.3; }
.teach-body { font-size: 12px; color: var(--textDim); line-height: 1.55; margin-bottom: 14px; }
.teach-body strong { color: var(--text); font-weight: 500; }
.teach-opts { display: flex; gap: 8px; }
.teach-btn { flex: 1; background: transparent; border-radius: 12px; padding: 12px 10px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 180ms ease; }
.teach-btn-up { border: 1px solid rgba(168,58,50,0.6); color: var(--statusAttention); }
.teach-btn-up.active { background: var(--statusAttention); color: #fff; border-color: var(--statusAttention); }
.teach-btn-mid { border: 1px solid var(--borderStrong); color: var(--textDim); }
.teach-btn-mid.active { background: var(--textMid); color: var(--bg); border-color: var(--textMid); }
.teach-btn-down { border: 1px solid var(--borderStrong); color: var(--textDim); }
.teach-btn-down.active { background: var(--textMid); color: var(--bg); border-color: var(--textMid); }

/* NEW — animated noted ack */
.teach-ack {
  position: absolute; left: 50%; top: -10px;
  transform: translateX(-50%);
  background: var(--brand); color: #fff;
  font-size: 11px; font-weight: 600;
  padding: 6px 14px; border-radius: 999px;
  box-shadow: 0 4px 12px rgba(200,62,0,0.35);
  display: flex; align-items: center; gap: 6px;
  white-space: nowrap;
  font-family: 'Inter', sans-serif;
  pointer-events: none;
}

.decision-stack { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.btn-primary { background: var(--statusClear); color: #fff; border: none; border-radius: 16px; padding: 18px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit; letter-spacing: 0.01em; }
.btn-secondary { background: transparent; color: var(--text); border: 1px solid var(--border); border-radius: 16px; padding: 18px; font-size: 15px; font-weight: 500; cursor: pointer; font-family: inherit; }
.btn-tertiary { background: transparent; color: var(--textDim); border: none; border-radius: 16px; padding: 14px; font-size: 13px; cursor: pointer; font-family: inherit; }

.clarity-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0 4px; opacity: 0.7; }
.clarity-label { font-size: 9px; color: var(--textDim); letter-spacing: 0.14em; text-transform: uppercase; font-weight: 600; font-family: 'JetBrains Mono', monospace; }
.clarity-btns { display: flex; gap: 4px; }
.clarity-btn { width: 24px; height: 24px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--textDim); font-size: 11px; font-weight: 500; cursor: pointer; font-family: 'JetBrains Mono', monospace; transition: all 120ms ease; }
.clarity-btn.active { border-color: var(--brand); background: var(--brandDim); color: var(--brand); }

.digest-big { font-size: 52px; font-weight: 400; color: var(--text); line-height: 1; letter-spacing: -0.03em; }
.digest-mid { font-size: 32px; font-weight: 400; color: var(--statusClear); line-height: 1; letter-spacing: -0.02em; }
.digest-label { font-size: 10px; color: var(--textDim); letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600; font-family: 'JetBrains Mono', monospace; }

.bars { display: flex; align-items: flex-end; gap: 8px; height: 60px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.bar { width: 100%; background: var(--brand); border-radius: 3px; min-height: 2px; }
.bar-day { font-size: 9px; color: var(--textDim); font-weight: 600; font-family: 'JetBrains Mono', monospace; }

.digest-narrative { font-size: 16px; color: var(--text); line-height: 1.6; font-weight: 400; }
.digest-sig { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }

.btn-open-report { width: 100%; background: var(--brand); color: var(--onBrand); border: none; border-radius: 14px; padding: 16px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 16px rgba(200,62,0,0.3); }
body.dark .btn-open-report { box-shadow: 0 4px 16px rgba(255,87,34,0.3); }

.sparkline { overflow: visible; }
.icon { flex-shrink: 0; }
body.report-open .phone-wrap { display: none; }

/* === REPORT OVERLAY === */
.report-overlay { position: fixed; inset: 0; z-index: 100; background: #1a1a1a; overflow: auto; }
.report-toolbar { position: sticky; top: 0; z-index: 50; background: rgba(20,20,20,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.tb-close { background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #e8e8e8; font-size: 11px; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.tb-doc { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #999; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 600; }
.tb-actions { display: flex; gap: 8px; }
.tb-btn-dl { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #e8e8e8; font-size: 12px; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 500; display: flex; align-items: center; gap: 6px; }
.tb-btn-print { background: #c83e00; color: #fff; border: none; font-size: 12px; padding: 8px 14px; border-radius: 8px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 500; display: flex; align-items: center; gap: 6px; }

.report-stage { padding: 32px 20px 60px; background: #2a2826; min-height: calc(100vh - 60px); display: flex; flex-direction: column; align-items: center; gap: 24px; overflow-x: hidden; }

/* Scale wrapper — key fix: JS sets both transform AND explicit width so
   the scaled element's layout box matches its visual size, allowing
   proper horizontal centering inside the flex stage */
.report-scale-outer {
  width: 100%;
  display: flex;
  justify-content: center;
}
.report-scale {
  transform-origin: top left;
  /* JS sets --report-scale (scale factor) and --report-width (px) */
  width: var(--report-width, 850px);
  height: var(--report-height, auto);
}
.report-scale-inner {
  width: 850px;
  transform: scale(var(--report-scale, 1));
  transform-origin: top left;
}
.report-pages {
  display: flex; flex-direction: column; gap: 24px;
  width: 850px;
}

.report-page { background: #ffffff; width: 850px; height: calc(850px * 11 / 8.5); padding: 0.85in 0.95in 0.7in; box-shadow: 0 12px 40px rgba(0,0,0,0.4); position: relative; color: #1a1a1a; font-family: 'Inter', sans-serif; font-size: 10.5px; line-height: 1.65; }

.rp-eyebrow { font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; font-weight: 700; color: #8b1a1a; font-family: 'JetBrains Mono', monospace; }
.rp-head-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 32px; padding-bottom: 10px; border-bottom: 2px solid #1a1a1a; }
.rp-period { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #8a8580; letter-spacing: 0.12em; font-weight: 500; }
.rp-h2 { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 500; letter-spacing: -0.015em; margin-bottom: 16px; color: #1a1a1a; line-height: 1.15; }
.rp-lead { font-family: 'Cormorant Garamond', serif; font-size: 19px; line-height: 1.5; color: #3a3530; font-weight: 400; margin-bottom: 28px; max-width: 6.2in; }
.rp-lead strong { color: #1a1a1a; font-weight: 600; }
.rp-lead .accent { color: #8b1a1a; font-weight: 700; }

/* === BCG / McKinsey takeaway banner === */
.rp-takeaway {
  background: #1a1a1a; color: #fff;
  padding: 20px 28px; margin: 0 0 26px;
  display: flex; gap: 18px; align-items: center;
}
.rp-takeaway-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px; letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #c8a86b;
  font-weight: 700;
  padding-right: 18px;
  border-right: 1px solid rgba(255,255,255,0.2);
  white-space: nowrap;
}
.rp-takeaway-body {
  font-family: 'Cormorant Garamond', serif;
  font-size: 16px; line-height: 1.45;
  color: #f5f3ee;
  font-weight: 500;
}

.rp-footer { position: absolute; bottom: 0.5in; left: 0.95in; right: 0.95in; display: flex; justify-content: space-between; font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase; color: #8a8580; padding-top: 8px; border-top: 1px solid #d4d0c8; font-weight: 600; font-family: 'JetBrains Mono', monospace; }

.rp-metrics { display: flex; gap: 18px; margin: 22px 0 28px; }
.rp-metric { flex: 1; padding: 14px 0 0; border-top: 2px solid #1a1a1a; }
.rp-metric-num { font-family: 'Cormorant Garamond', serif; font-size: 40px; font-weight: 500; line-height: 1; letter-spacing: -0.025em; color: #1a1a1a; }
.rp-metric-num .pct { font-size: 22px; }
.rp-metric-label { font-family: 'JetBrains Mono', monospace; font-size: 8.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #6b6560; margin-top: 8px; font-weight: 700; }
.rp-metric-sub { font-size: 9.5px; color: #8a8580; margin-top: 3px; font-style: italic; }

.rp-chart-wrap { padding: 16px 0; border-top: 1px solid #d4d0c8; border-bottom: 1px solid #d4d0c8; margin-bottom: 22px; }
.rp-bars { display: flex; align-items: flex-end; gap: 14px; height: 100px; padding: 0 4px; }
.rp-bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.rp-bar-val { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #1a1a1a; font-weight: 600; }
.rp-bar { width: 100%; background: #8b1a1a; min-height: 3px; }
.rp-bar-day { font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; color: #6b6560; font-weight: 600; }
.rp-chart-caption { font-size: 9px; color: #8a8580; font-style: italic; margin-top: 10px; }

.rp-pull { padding: 20px 28px; border-left: 3px solid #8b1a1a; background: #faf8f4; margin-top: 8px; }
.rp-pull-q { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; line-height: 1.45; color: #1a1a1a; }
.rp-pull-by { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: #6b6560; margin-top: 10px; font-weight: 600; }

.rp-findings { list-style: none; padding: 0; margin: 0; }
.rp-findings li { padding: 16px 0 16px 32px; border-bottom: 1px solid #e8e4dd; position: relative; font-size: 11.5px; line-height: 1.6; }
.rp-findings li::before { content: ""; position: absolute; left: 0; top: 22px; width: 18px; height: 1px; background: #8b1a1a; }
.rp-findings strong { font-weight: 600; color: #1a1a1a; }

.rp-table { width: 100%; border-collapse: collapse; }
.rp-table th { font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; text-align: left; color: #8b1a1a; padding: 10px 12px 10px 0; border-bottom: 2px solid #1a1a1a; font-weight: 700; }
.rp-table td { padding: 14px 12px 14px 0; font-size: 10.5px; border-bottom: 1px solid #e8e4dd; vertical-align: top; line-height: 1.5; }
.rp-table td.priority { font-weight: 600; color: #8b1a1a; white-space: nowrap; }
.rp-table td.rationale { color: #5a5550; }

.rp-cover { display: flex; flex-direction: column; }
.rp-cover-top { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 600; color: #8b1a1a; }
.rp-cover-mid { margin: auto 0; }
.rp-cover-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; color: #6b6560; margin-bottom: 32px; font-weight: 600; }
.rp-cover-title { font-family: 'Cormorant Garamond', serif; font-size: 80px; font-weight: 500; line-height: 1.02; letter-spacing: -0.03em; margin-bottom: 24px; color: #1a1a1a; }
.rp-cover-sub { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 400; font-style: italic; color: #5a5550; line-height: 1.35; max-width: 5in; }
.rp-cover-bottom { padding-top: 24px; border-top: 2px solid #1a1a1a; display: flex; justify-content: space-between; gap: 16px; font-size: 10px; }
.rp-cover-bottom .lbl { font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: #8a8580; margin-bottom: 5px; font-weight: 700; }
.rp-cover-bottom .name { font-family: 'Cormorant Garamond', serif; font-size: 15px; font-weight: 500; margin-bottom: 2px; }
.rp-cover-bottom .sub { color: #6b6560; font-size: 10px; }
.rp-cover-bottom .doc-id { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; margin-bottom: 2px; }

.rp-signoff { margin-top: 44px; padding-top: 20px; border-top: 2px solid #1a1a1a; display: flex; gap: 40px; }
.rp-signoff-col { flex: 1; }
.rp-signoff-lbl { font-family: 'JetBrains Mono', monospace; font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: #8a8580; margin-bottom: 8px; font-weight: 700; }
.rp-signoff-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; margin-bottom: 4px; font-weight: 500; }
.rp-signoff-sub { font-size: 10px; color: #6b6560; }

@media print {
  .no-print, body.dark .theme-toggle { display: none !important; }
  body { background: white !important; padding: 0 !important; }
  body * { visibility: hidden; }
  .report-pages, .report-pages * { visibility: visible; }
  .report-pages { position: absolute; left: 0; top: 0; width: 100%; background: white; }
  .report-page { margin: 0 !important; box-shadow: none !important; page-break-after: always; transform: none !important; width: 100% !important; height: auto !important; }
  .report-page:last-child { page-break-after: auto; }
  .report-scale, .report-scale-inner, .report-scale-outer {
    transform: none !important;
    width: 100% !important;
    height: auto !important;
  }
}

.toast { position: absolute; top: 48px; left: 20px; right: 20px; z-index: 20; border-radius: 14px; padding: 14px 18px; font-size: 12px; font-family: 'Inter', sans-serif; backdrop-filter: blur(8px); background: rgba(232,245,232,0.98); border: 1px solid #a8d8a8; color: #2d5a2d; display: flex; align-items: center; gap: 8px; }
body.dark .toast { background: rgba(26,46,26,0.95); border-color: #2d5a2d; color: #a8d8a8; }
</style>
</head>
<body>

<div class="wrap">
  <div class="header no-print">
    <div class="header-brand">
      <div class="brand-dot"></div>
      <div>
        <div class="wordmark mono">SENTRY · CLIENT</div>
        <div class="client-name-header serif">Aspen Holdings</div>
      </div>
    </div>
    <div class="theme-toggle">
      <button class="theme-btn" data-theme="auto">auto</button>
      <button class="theme-btn active" data-theme="light">light</button>
      <button class="theme-btn" data-theme="dark">dark</button>
    </div>
  </div>

  <div class="phone-wrap">
    <div class="phone">
      <div class="notch"></div>
      <div id="toast" style="display:none;"></div>
      <div class="status-bar mono">
        <span id="clock">—</span>
        <span style="opacity:0.5">•••</span>
      </div>
      <div class="screen" id="screen"></div>
      <div class="home-indicator"></div>
    </div>
  </div>
</div>

<div id="report-overlay"></div>

<script>
const ICONS = {
  checkCircle: '<svg class="icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  loader: '<svg class="icon spin-slow" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
  alert: '<svg class="icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  chevronR: '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  chevronL: '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  calendar: '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  target: '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  arrowUp: '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>',
  arrowDown: '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>',
  check: '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  checkSm: '<svg class="icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  file: '<svg class="icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  printer: '<svg class="icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
  download: '<svg class="icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  activity: '<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  clock: '<svg class="icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
};

const CLIENT = { name: "Aspen Holdings", industry: "Financial Services", contact: "Jordan Mauriello", ciso: "T. Reeves" };

// NOW with response timelines per item
const initialItems = [
  {
    id: "I-001", severity: "ATTENTION",
    title: "Unusual login from new country",
    headline: "Someone signed into your CFO's email from Lagos, Nigeria 14 minutes ago.",
    context: "VDA's analysts checked: this isn't on Tom's typical travel pattern. We've temporarily blocked the session and want your call before reaching out to him directly.",
    recommendation: "Approve the block and we'll call Tom now to verify.",
    asset: "Tom Webb · CFO · O365 mailbox",
    handledBy: "T. Reeves", timeReceived: Date.now() - 14 * 60 * 1000,
    requiresClient: true, decision: null,
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
    id: "I-002", severity: "WORKING",
    title: "Phishing campaign targeting finance team",
    headline: "5 phishing emails impersonating your bank were caught before delivery.",
    context: "Standard campaign, no one clicked. We're updating the rule so future variants are blocked automatically.",
    recommendation: "No action needed. We'll include this in your weekly digest.",
    asset: "Email gateway · 5 messages",
    handledBy: "M. Chen", timeReceived: Date.now() - 2 * 60 * 60 * 1000,
    requiresClient: false, decision: null,
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
    id: "I-003", severity: "WORKING",
    title: "Patch deployed to trading server",
    headline: "Critical security patch applied to SVR-TRADE-07 during maintenance window.",
    context: "Routine. Server back online, all checks green.",
    recommendation: "FYI only.",
    asset: "SVR-TRADE-07",
    handledBy: "T. Reeves", timeReceived: Date.now() - 5 * 60 * 60 * 1000,
    requiresClient: false, decision: null,
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
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const days = [];
  for (let i = 0; i < 30; i++) {
    days.push({ ingested: Math.floor(800 + rand() * 600), escalated: Math.floor(rand() * 3) });
  }
  return days;
}

const state = {
  items: JSON.parse(JSON.stringify(initialItems)),
  screen: "status", activeItemId: null, theme: "light",
  history: buildHistory(),
  criticalityChoice: null, clarityRating: null,
  showNotedAck: false,
};

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

function computeStatus() {
  const open = state.items.filter(i => i.decision === null);
  if (open.some(i => i.requiresClient)) return "ATTENTION";
  if (open.some(i => !i.requiresClient)) return "WORKING";
  return "CLEAR";
}

function getOpenItems() { return state.items.filter(i => i.decision === null); }
function getAttention() { return getOpenItems().filter(i => i.requiresClient); }
function getWorking() { return getOpenItems().filter(i => !i.requiresClient); }

function applyTheme(t) {
  state.theme = t;
  document.querySelectorAll(".theme-btn").forEach(b => b.classList.toggle("active", b.dataset.theme === t));
  const isDark = t === "dark" || (t === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.body.classList.toggle("dark", isDark);
}

function sparklineSvg(values, color) {
  const w = 100, h = 32;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return x + "," + y;
  }).join(" ");
  const area = "0," + h + " " + pts + " " + w + "," + h;
  return '<svg class="sparkline" width="' + w + '" height="' + h + '">' +
    '<defs><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1">' +
    '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.25"/>' +
    '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/>' +
    '</linearGradient></defs>' +
    '<polygon points="' + area + '" fill="url(#sg)"/>' +
    '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>' +
    '</svg>';
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.style.display = "block";
  t.className = "toast fade-in";
  t.innerHTML = ICONS.check + msg;
  setTimeout(() => { t.style.display = "none"; }, 4000);
}

function renderStatus() {
  const status = computeStatus();
  const cfg = {
    CLEAR: { color: "var(--statusClear)", dim: "var(--statusClearDim)", icon: ICONS.checkCircle, headline: "All clear", sub: "VDA is monitoring. Nothing needs you right now." },
    WORKING: { color: "var(--statusWorking)", dim: "var(--statusWorkingDim)", icon: ICONS.loader, headline: "We're on it", sub: getWorking().length + " " + (getWorking().length === 1 ? "item" : "items") + " being handled. No action needed." },
    ATTENTION: { color: "var(--statusAttention)", dim: "var(--statusAttentionDim)", icon: ICONS.alert, headline: "Your attention", sub: getAttention().length + " " + (getAttention().length === 1 ? "decision" : "decisions") + " only you can make." },
  }[status];

  const recent = state.history.slice(-14);
  const reviewed = recent.reduce((s, d) => s + d.ingested, 0);
  const escalated = recent.reduce((s, d) => s + d.escalated, 0);
  const handled = reviewed - escalated;
  const quiet = recent.filter(d => d.escalated === 0).length;

  const attnHtml = getAttention().map(item => {
    return '<button class="item-btn attn" onclick="openItem(\'' + item.id + '\')">' +
      '<div class="eyebrow eyebrow-attn mono" style="margin-bottom:8px;">Needs your decision · SLA ' + item.sla + '</div>' +
      '<div class="serif item-title">' + item.title + '</div>' +
      '<div class="sans item-body">' + item.headline + '</div>' +
      '<div class="item-meta">' +
      '<span class="meta-mono">' + ago(item.timeReceived) + '</span>' +
      '<span style="color:var(--statusAttention)">' + ICONS.chevronR + '</span>' +
      '</div></button>';
  }).join("");

  const workingBtn = getWorking().length > 0 ?
    '<button class="working-summary" onclick="goto(\'active\')">' +
    '<div>' +
    '<div class="eyebrow mono" style="margin-bottom:4px;">VDA is handling</div>' +
    '<div class="serif" style="font-size:16px; color:var(--text);">' + getWorking().length + ' ' + (getWorking().length === 1 ? "item" : "items") + ' in progress</div>' +
    '</div>' +
    '<span style="color:var(--textDim)">' + ICONS.chevronR + '</span>' +
    '</button>' : "";

  return '<div class="fade-in">' +
    '<div class="greeting mono">Good ' + greet() + ', ' + CLIENT.contact.split(" ")[0] + '</div>' +
    '<div class="client-name serif">' + CLIENT.name + '</div>' +
    '<div class="card card-lg status-card scale-in">' +
    '<div class="status-wash" style="background:' + cfg.color + ';"></div>' +
    '<div class="status-inner">' +
    '<div class="status-icon-wrap" style="background:' + cfg.dim + ';border:1px solid ' + cfg.color + '30;color:' + cfg.color + ';">' + cfg.icon + '</div>' +
    '<div class="serif status-headline">' + cfg.headline + '</div>' +
    '<div class="sans status-sub">' + cfg.sub + '</div>' +
    '</div></div>' +
    (attnHtml ? '<div style="margin-bottom:20px;">' + attnHtml + '</div>' : '') +
    workingBtn +
    '<div class="card">' +
    '<div class="eyebrow mono" style="margin-bottom:12px;">Last 14 days</div>' +
    '<div class="stat-row">' +
    '<div><div class="serif stat-big">' + handled.toLocaleString() + '</div>' +
    '<div class="sans stat-label">alerts handled without you</div></div>' +
    sparklineSvg(recent.map(d => d.ingested), "var(--brand)") +
    '</div>' +
    '<div class="divider"></div>' +
    '<div class="stat-mini-row sans">' +
    '<div><div class="mono" style="color:var(--textDim); font-size:9px; letter-spacing:0.12em; text-transform:uppercase; font-weight:600;">Reviewed</div>' +
    '<div style="color:var(--text); font-weight:500; margin-top:3px; font-size:13px;">' + reviewed.toLocaleString() + '</div></div>' +
    '<div><div class="mono" style="color:var(--textDim); font-size:9px; letter-spacing:0.12em; text-transform:uppercase; font-weight:600;">Escalated</div>' +
    '<div style="color:var(--text); font-weight:500; margin-top:3px; font-size:13px;">' + escalated + '</div></div>' +
    '<div><div class="mono" style="color:var(--textDim); font-size:9px; letter-spacing:0.12em; text-transform:uppercase; font-weight:600;">Quiet days</div>' +
    '<div style="color:var(--text); font-weight:500; margin-top:3px; font-size:13px;">' + quiet + '</div></div>' +
    '</div></div>' +
    '<button class="report-cta" onclick="goto(\'digest\')">' +
    '<div style="display:flex; align-items:center; gap:14px;">' +
    '<div class="report-cta-icon" style="color:var(--brand);">' + ICONS.calendar + '</div>' +
    '<div style="text-align:left; line-height:1.3;">' +
    '<div class="eyebrow eyebrow-accent mono" style="margin-bottom:2px;">New · Ready</div>' +
    '<div class="serif" style="font-size:15px; color:var(--text); letter-spacing:-0.005em;">This week\'s report</div>' +
    '</div></div>' +
    '<span style="color:var(--brand)">' + ICONS.chevronR + '</span>' +
    '</button></div>';
}

function renderActive() {
  const items = getOpenItems();
  return '<div class="fade-in">' +
    '<button class="btn btn-back mono" onclick="goto(\'status\')">' + ICONS.chevronL + ' Back</button>' +
    '<div class="serif" style="font-size:28px; color:var(--text); margin-bottom:8px; letter-spacing:-0.01em;">Active items</div>' +
    '<div class="mono" style="font-size:11px; color:var(--textDim); margin-bottom:28px; letter-spacing:0.08em;">' +
    items.length + ' ' + (items.length === 1 ? "ITEM" : "ITEMS") + ' IN PROGRESS' +
    '</div>' +
    items.map(item => {
      const isAttn = item.requiresClient;
      const accent = isAttn ? "var(--statusAttention)" : "var(--statusWorking)";
      return '<button class="item-btn ' + (isAttn ? 'attn-left' : 'working') + '" onclick="openItem(\'' + item.id + '\')">' +
        '<div class="eyebrow mono" style="color:' + accent + '; font-weight:700; margin-bottom:8px;">' +
        (isAttn ? "Needs decision · SLA " + item.sla : "Handling") +
        '</div>' +
        '<div class="serif item-title item-title-sm">' + item.title + '</div>' +
        '<div class="sans item-body item-body-sm">' + item.headline + '</div>' +
        '<div class="item-meta">' +
        '<span class="sans" style="font-size:11px; color:var(--textDim);">by ' + item.handledBy + '</span>' +
        '<span class="meta-mono">' + ago(item.timeReceived) + '</span>' +
        '</div></button>';
    }).join("") +
    '</div>';
}

function renderDecision() {
  const item = state.items.find(i => i.id === state.activeItemId);
  if (!item) return renderStatus();
  const needsDecision = item.requiresClient;
  const accent = needsDecision ? "var(--statusAttention)" : "var(--statusWorking)";
  const cc = state.criticalityChoice;
  const cr = state.clarityRating;

  // Response timeline
  const timelineHtml = (item.timeline || []).map(step => {
    const dotClass = step.status === "done" ? "done" : step.status === "current" ? "current" : "";
    const dotInner = step.status === "done" ? ICONS.checkSm : (step.status === "current" ? '<div class="current-inner" style="width:7px;height:7px;border-radius:50%;background:var(--brand);"></div>' : "");
    const labelClass = step.status === "current" ? "waiting" : "";
    return '<li class="timeline-item">' +
      '<div class="timeline-dot ' + dotClass + (step.status === "current" ? ' sla-pulse-dot' : '') + '">' + dotInner + '</div>' +
      '<div class="timeline-body">' +
      '<div class="timeline-label ' + labelClass + '">' + step.label + '</div>' +
      '<div class="timeline-meta mono">' + step.meta + '</div>' +
      '</div></li>';
  }).join("");

  const slaBadge = needsDecision
    ? '<div class="sla-badge mono"><span class="sla-badge-dot sla-pulse-dot"></span>SLA ' + item.slaRemaining + '</div>'
    : '<div class="sla-badge mono"><span class="sla-badge-dot"></span>Informational</div>';

  return '<div class="fade-in">' +
    '<button class="btn btn-back mono" onclick="goto(\'active\')">' + ICONS.chevronL + ' Back</button>' +
    '<div class="mono" style="font-size:10px; letter-spacing:0.22em; color:' + accent + '; text-transform:uppercase; margin-bottom:12px; font-weight:700;">' +
    (needsDecision ? "Decision needed" : "For your awareness") +
    '</div>' +
    '<div class="serif decision-title">' + item.title + '</div>' +
    '<div class="sans decision-headline">' + item.headline + '</div>' +

    '<div class="context-card">' +
    '<div class="eyebrow mono" style="margin-bottom:10px;">What\'s happening</div>' +
    '<div class="sans card-title">' + item.context + '</div>' +
    '</div>' +

    // NEW — Response timeline card
    '<div class="timeline-card">' +
    '<div class="timeline-head">' +
    '<div class="timeline-head-left">' +
    '<div class="timeline-icon">' + ICONS.activity + '</div>' +
    '<div class="mono eyebrow eyebrow-clear" style="color:var(--statusClear);">What we\'ve done</div>' +
    '</div>' +
    slaBadge +
    '</div>' +
    '<ul class="timeline-list">' + timelineHtml + '</ul>' +
    '</div>' +

    '<div class="rec-card ' + (needsDecision ? 'attn' : 'working') + '">' +
    '<div class="eyebrow mono" style="color:' + accent + '; font-weight:700; margin-bottom:10px;">Our recommendation</div>' +
    '<div class="sans card-title">' + item.recommendation + '</div>' +
    '</div>' +

    '<div class="asset-row">' +
    '<span class="meta-mono">' + item.asset + '</span>' +
    '<span class="meta-mono">' + ago(item.timeReceived) + '</span>' +
    '</div>' +

    // Teach-back
    '<div class="teach">' +
    (state.showNotedAck ? '<div class="teach-ack noted-pop">' + ICONS.checkSm + ' Noted · carried forward</div>' : '') +
    '<div class="teach-head">' +
    '<div class="teach-icon">' + ICONS.target + '</div>' +
    '<div class="mono" style="font-size:10px; letter-spacing:0.22em; color:var(--brand); text-transform:uppercase; font-weight:700;">Before you decide</div>' +
    '</div>' +
    '<div class="serif teach-title">How critical is this asset, really?</div>' +
    '<div class="sans teach-body">Your answer tunes how Sentry scores future alerts on <strong>' + item.asset.split(" · ")[0] + '</strong>. This is the loop that makes detection smarter for your environment specifically.</div>' +
    '<div class="teach-opts">' +
    '<button class="sans teach-btn teach-btn-up ' + (cc === 'elevated' ? 'active' : '') + '" onclick="setCriticality(\'elevated\')">' + ICONS.arrowUp + ' More critical</button>' +
    '<button class="sans teach-btn teach-btn-mid ' + (cc === 'same' ? 'active' : '') + '" onclick="setCriticality(\'same\')">Just right</button>' +
    '<button class="sans teach-btn teach-btn-down ' + (cc === 'lowered' ? 'active' : '') + '" onclick="setCriticality(\'lowered\')">' + ICONS.arrowDown + ' Less</button>' +
    '</div>' +
    '</div>' +

    '<div class="decision-stack">' +
    '<button class="sans btn-primary" onclick="decide(\'APPROVED\')">Approve' + (needsDecision ? " · block the session" : "") + '</button>' +
    '<button class="sans btn-secondary" onclick="decide(\'DENIED\')">Override · ' + (needsDecision ? "I\'ll handle directly" : "needs more review") + '</button>' +
    '<button class="sans btn-tertiary" onclick="decide(\'LATER\')">Ask me later</button>' +
    '</div>' +

    '<div class="clarity-row">' +
    '<span class="clarity-label">Clarity of this alert</span>' +
    '<div class="clarity-btns">' +
    [1,2,3,4,5].map(n => '<button class="clarity-btn ' + (cr && n <= cr ? 'active' : '') + '" onclick="setClarity(' + n + ')">' + n + '</button>').join("") +
    '</div></div></div>';
}

function renderDigest() {
  const week = state.history.slice(-7);
  const reviewed = week.reduce((s, d) => s + d.ingested, 0);
  const escalated = week.reduce((s, d) => s + d.escalated, 0);
  const confirmed = state.items.filter(i => i.clientConfirmed).length;
  const maxVol = Math.max(...week.map(d => d.ingested));
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const days = ["S", "M", "T", "W", "T", "F", "S"];

  return '<div class="fade-in">' +
    '<button class="btn btn-back mono" onclick="goto(\'status\')">' + ICONS.chevronL + ' Back</button>' +
    '<div class="mono digest-label" style="margin-bottom:8px;">Week of ' + weekStart + '</div>' +
    '<div class="serif" style="font-size:28px; color:var(--text); margin-bottom:32px; letter-spacing:-0.01em; line-height:1.1;">Your week with VDA</div>' +
    '<div class="card" style="text-align:center; padding:28px 24px;">' +
    '<div class="serif digest-big">' + reviewed.toLocaleString() + '</div>' +
    '<div class="mono digest-label" style="margin-top:10px;">alerts reviewed by VDA</div>' +
    '<div class="divider" style="margin: 20px -24px;"></div>' +
    '<div class="serif digest-mid">' + escalated + '</div>' +
    '<div class="mono digest-label" style="margin-top:8px;">required your attention</div>' +
    '</div>' +
    '<div class="card">' +
    '<div class="eyebrow mono" style="margin-bottom:16px;">Daily volume</div>' +
    '<div class="bars">' +
    week.map((d, i) =>
      '<div class="bar-col">' +
      '<div class="bar" style="height:' + ((d.ingested / maxVol) * 100) + '%; opacity:' + (0.3 + (d.ingested / maxVol) * 0.7) + ';"></div>' +
      '<div class="bar-day">' + days[i] + '</div>' +
      '</div>'
    ).join("") +
    '</div></div>' +
    '<div class="card" style="padding:24px;">' +
    '<div class="serif digest-narrative">' +
    (confirmed > 0 ? 'You confirmed ' + confirmed + ' ' + (confirmed === 1 ? "incident" : "incidents") + ' this week, each one making the model smarter for your environment.' : "A quiet week.") +
    (escalated === 0 ? ' Nothing reached you.' : ' ' + escalated + ' ' + (escalated === 1 ? "item" : "items") + ' required your input.') +
    ' VDA\'s analysts handled the rest.' +
    '</div>' +
    '<div class="digest-sig">' +
    '<span class="mono" style="font-size:9px; color:var(--textDim); letter-spacing:0.15em; text-transform:uppercase; font-weight:600;">CISO of record</span>' +
    '<span class="sans" style="font-size:12px; color:var(--text); font-weight:500;">' + CLIENT.ciso + '</span>' +
    '</div></div>' +
    '<button class="sans btn-open-report" onclick="openReport()">' + ICONS.file + ' Open board report</button>' +
    '</div>';
}

function renderReport() {
  const week = state.history.slice(-7);
  const totalReviewed = week.reduce((s, d) => s + d.ingested, 0);
  const totalEscalated = week.reduce((s, d) => s + d.escalated, 0);
  const confirmed = state.items.filter(i => i.clientConfirmed).length;
  const noiseReduced = totalReviewed > 0 ? Math.round(((totalReviewed - totalEscalated) / totalReviewed) * 100) : 0;
  const today = new Date();
  const period = 'Week of ' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const docId = 'VDA-' + today.getFullYear() + String(today.getMonth() + 1).padStart(2, "0") + String(today.getDate()).padStart(2, "0") + '-' + CLIENT.name.substring(0,3).toUpperCase();
  const maxVol = Math.max(...week.map(d => d.ingested), 1);
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  // BCG/McKinsey-style strong takeaway
  const takeaway = totalEscalated === 0
    ? 'The week was quiet. VDA handled ' + totalReviewed.toLocaleString() + ' signals without executive involvement. Maintain current posture; no structural changes recommended.'
    : 'VDA surfaced ' + totalEscalated + ' of ' + totalReviewed.toLocaleString() + ' signals for executive review — a ' + noiseReduced + '% noise reduction. The signal-to-board ratio is healthy; current escalation discipline is working.';

  return '<div class="slide-up" style="min-height:100vh;">' +
    '<div class="report-toolbar no-print">' +
    '<button class="tb-close" onclick="closeReport()">' + ICONS.chevronL + ' Close</button>' +
    '<div class="tb-doc">' + docId + ' · Preview</div>' +
    '<div class="tb-actions">' +
    '<button class="tb-btn-dl" onclick="downloadReport()">' + ICONS.download + ' Download</button>' +
    '<button class="tb-btn-print" onclick="window.print()">' + ICONS.printer + ' Print / Save as PDF</button>' +
    '</div></div>' +

    '<div class="report-stage">' +
    '<div class="report-scale-outer">' +
    '<div class="report-scale" id="report-scale">' +
    '<div class="report-scale-inner" id="report-scale-inner">' +
    '<div class="report-pages">' +

    // COVER
    '<div class="report-page rp-cover">' +
    '<div class="rp-cover-top">VDA Labs · Managed Detection &amp; Response</div>' +
    '<div class="rp-cover-mid">' +
    '<div class="rp-cover-eyebrow">' + period + ' · Confidential Brief</div>' +
    '<div class="rp-cover-title">Security<br/>Posture<br/>Brief</div>' +
    '<div class="rp-cover-sub">A weekly synthesis of detection activity, analyst decisions, and the threats your team chose not to ignore.</div>' +
    '</div>' +
    '<div class="rp-cover-bottom">' +
    '<div><div class="lbl">Prepared for</div><div class="name">' + CLIENT.name + '</div><div class="sub">Board of Directors</div></div>' +
    '<div><div class="lbl">Prepared by</div><div class="name">VDA Labs SOC</div><div class="sub">' + CLIENT.ciso + '</div></div>' +
    '<div style="text-align:right"><div class="lbl">Document</div><div class="doc-id">' + docId + '</div><div class="sub">' + today.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) + '</div></div>' +
    '</div></div>' +

    // EXEC SUMMARY
    '<div class="report-page">' +
    '<div class="rp-head-row">' +
    '<div class="rp-eyebrow">I · Executive Summary</div>' +
    '<div class="rp-period">' + period.toUpperCase() + '</div>' +
    '</div>' +

    // NEW — BCG-style black takeaway banner up top
    '<div class="rp-takeaway">' +
    '<div class="rp-takeaway-label">The take</div>' +
    '<div class="rp-takeaway-body">' + takeaway + '</div>' +
    '</div>' +

    '<h2 class="rp-h2">The week, in one sentence.</h2>' +
    '<p class="rp-lead">VDA\'s analysts reviewed <strong>' + totalReviewed.toLocaleString() + '</strong> security signals on your behalf this week and surfaced <strong>' + totalEscalated + '</strong> ' + (totalEscalated === 1 ? "item" : "items") + ' that required executive awareness — a noise reduction of <span class="accent">' + noiseReduced + '%</span> against your endpoint and identity surface.</p>' +

    '<div class="rp-metrics">' +
    '<div class="rp-metric"><div class="rp-metric-num">' + totalReviewed.toLocaleString() + '</div><div class="rp-metric-label">Signals Triaged</div><div class="rp-metric-sub">by VDA SOC analysts</div></div>' +
    '<div class="rp-metric"><div class="rp-metric-num">' + totalEscalated + '</div><div class="rp-metric-label">Escalated</div><div class="rp-metric-sub">required your attention</div></div>' +
    '<div class="rp-metric"><div class="rp-metric-num">' + noiseReduced + '<span class="pct">%</span></div><div class="rp-metric-label">Noise Filtered</div><div class="rp-metric-sub">handled without you</div></div>' +
    '<div class="rp-metric"><div class="rp-metric-num">' + confirmed + '</div><div class="rp-metric-label">Confirmed True</div><div class="rp-metric-sub">model learned from outcomes</div></div>' +
    '</div>' +

    '<div class="rp-eyebrow" style="margin-bottom:12px;">Daily Detection Volume</div>' +
    '<div class="rp-chart-wrap">' +
    '<div class="rp-bars">' +
    week.map((d, i) =>
      '<div class="rp-bar-col">' +
      '<div class="rp-bar-val">' + d.ingested + '</div>' +
      '<div class="rp-bar" style="height:' + ((d.ingested / maxVol) * 80) + 'px;"></div>' +
      '<div class="rp-bar-day">' + days[i] + '</div>' +
      '</div>'
    ).join("") +
    '</div>' +
    '<div class="rp-chart-caption">Total signals ingested per day across all monitored surfaces. Triaged automatically by Sentry, escalated by analyst judgment.</div>' +
    '</div>' +

    '<div class="rp-pull">' +
    '<div class="rp-pull-q">"The right number of alerts to escalate to a CEO is the number that demand a decision. This week, that number was ' + totalEscalated + '."</div>' +
    '<div class="rp-pull-by">— ' + CLIENT.ciso + ', VDA Labs</div>' +
    '</div>' +

    '<div class="rp-footer"><span>VDA Labs · Confidential</span><span>' + CLIENT.name + '</span><span>Page 1 of 3</span></div>' +
    '</div>' +

    // FINDINGS
    '<div class="report-page">' +
    '<div class="rp-head-row">' +
    '<div class="rp-eyebrow">II · Key Findings</div>' +
    '<div class="rp-period">' + period.toUpperCase() + '</div>' +
    '</div>' +
    '<h2 class="rp-h2">What we observed.</h2>' +
    '<p style="font-size:11.5px; line-height:1.65; color:#2a2520; margin-bottom:22px;">Detection activity was consistent with your established baseline. Three observations are worth surfacing to the board.</p>' +
    '<ul class="rp-findings">' +
    '<li><strong>Phishing campaign targeting finance.</strong> A coordinated credential-harvesting attempt was detected against three members of your finance team. All messages were quarantined before delivery; no clicks recorded. Pattern matches activity attributed to a known commodity threat actor.</li>' +
    '<li><strong>Routine maintenance executed cleanly.</strong> A scheduled patch on your trading server (SVR-TRADE-07) completed within the maintenance window without incident. Continuity preserved.</li>' +
    '<li><strong>Model precision improving.</strong> ' + (confirmed > 0 ? 'The ' + confirmed + ' ' + (confirmed === 1 ? "incident" : "incidents") + ' you confirmed this week measurably improved how Sentry scores future activity in your environment.' : "No analyst overrides were required this week — a sign of healthy baseline calibration.") + '</li>' +
    '</ul>' +
    '<div class="rp-eyebrow" style="margin-top:34px; margin-bottom:14px;">III · Recommendations</div>' +
    '<table class="rp-table">' +
    '<thead><tr><th style="width:20%;">Priority</th><th style="width:42%;">Action</th><th>Rationale</th></tr></thead>' +
    '<tbody>' +
    '<tr><td class="priority">Immediate</td><td>Reinforce phishing awareness for finance team via 15-minute briefing.</td><td class="rationale">Threat actor has demonstrated targeting interest. Repetition reduces susceptibility.</td></tr>' +
    '<tr><td class="priority">This Quarter</td><td>Schedule tabletop exercise covering wire-fraud scenario.</td><td class="rationale">Aligns finance, legal, and IT response under a controlled simulation.</td></tr>' +
    '<tr><td class="priority">Ongoing</td><td>Maintain current cadence of executive review.</td><td class="rationale">Current escalation volume is healthy. No structural changes recommended.</td></tr>' +
    '</tbody></table>' +
    '<div class="rp-footer"><span>VDA Labs · Confidential</span><span>' + CLIENT.name + '</span><span>Page 2 of 3</span></div>' +
    '</div>' +

    // METHODOLOGY
    '<div class="report-page">' +
    '<div class="rp-head-row">' +
    '<div class="rp-eyebrow">IV · Methodology &amp; Sign-Off</div>' +
    '<div class="rp-period">' + period.toUpperCase() + '</div>' +
    '</div>' +
    '<h2 class="rp-h2">How we arrived at these numbers.</h2>' +
    '<p style="font-size:11px; line-height:1.7; color:#2a2520; margin-bottom:14px;">Sentry ingests telemetry from your endpoints, identity provider, network gateway, and email security stack. Every signal is scored against MITRE ATT&amp;CK techniques, contextualized against your environment\'s baseline, and routed through a triage queue staffed by VDA analysts.</p>' +
    '<p style="font-size:11px; line-height:1.7; color:#2a2520; margin-bottom:14px;">Items reach the board only if they pass three filters: technical credibility, business relevance, and executive actionability. Anything that fails one of those filters is handled by the SOC and recorded in your weekly digest — not sent to you.</p>' +
    '<div class="rp-eyebrow" style="margin-top:28px; margin-bottom:10px;">Confidence Statement</div>' +
    '<p style="font-size:11px; line-height:1.7; color:#2a2520;">This brief reflects telemetry available as of ' + today.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) + '. VDA assumes responsibility for the accuracy of detection counts and analyst decisions.</p>' +
    '<div class="rp-signoff">' +
    '<div class="rp-signoff-col"><div class="rp-signoff-lbl">Prepared By</div><div class="rp-signoff-name">' + CLIENT.ciso + '</div><div class="rp-signoff-sub">VDA Labs · SOC</div></div>' +
    '<div class="rp-signoff-col"><div class="rp-signoff-lbl">For Review By</div><div class="rp-signoff-name">' + CLIENT.name + ' Board</div><div class="rp-signoff-sub">Quarterly Risk Committee</div></div>' +
    '</div>' +
    '<div class="rp-footer"><span>VDA Labs · Confidential</span><span>' + CLIENT.name + '</span><span>Page 3 of 3</span></div>' +
    '</div>' +

    '</div></div></div></div></div>';
}

function render() {
  const s = document.getElementById("screen");
  if (state.screen === "status") s.innerHTML = renderStatus();
  else if (state.screen === "active") s.innerHTML = renderActive();
  else if (state.screen === "decision") s.innerHTML = renderDecision();
  else if (state.screen === "digest") s.innerHTML = renderDigest();
}

function goto(screen) {
  state.screen = screen;
  if (screen !== "decision") {
    state.activeItemId = null;
    state.criticalityChoice = null;
    state.clarityRating = null;
    state.showNotedAck = false;
  }
  render();
}

function openItem(id) {
  state.activeItemId = id;
  state.criticalityChoice = null;
  state.clarityRating = null;
  state.showNotedAck = false;
  state.screen = "decision";
  render();
}

function setCriticality(val) {
  const isNew = state.criticalityChoice !== val;
  state.criticalityChoice = isNew ? val : null;
  if (isNew) {
    state.showNotedAck = true;
    render();
    setTimeout(() => {
      state.showNotedAck = false;
      render();
    }, 2400);
  } else {
    render();
  }
}

function setClarity(n) { state.clarityRating = n; render(); }

function decide(decision) {
  const item = state.items.find(i => i.id === state.activeItemId);
  if (!item) return;
  item.decision = decision;
  item.decidedAt = Date.now();
  item.clientConfirmed = decision === "APPROVED";
  if (decision === "APPROVED") {
    showToast("Your confirmation improved detection for this pattern across your environment.");
  }
  state.activeItemId = null;
  state.criticalityChoice = null;
  state.clarityRating = null;
  state.showNotedAck = false;
  state.screen = "status";
  render();
}

function openReport() {
  document.body.classList.add("report-open");
  const overlay = document.getElementById("report-overlay");
  overlay.className = "report-overlay";
  overlay.innerHTML = renderReport();
  // Scale the report to fit viewport on mobile
  setTimeout(scaleReport, 50);
}

function scaleReport() {
  const scale = document.getElementById("report-scale");
  const inner = document.getElementById("report-scale-inner");
  if (!scale || !inner) return;
  const vw = window.innerWidth;
  const reportW = 850; // fixed letter width in px
  const reportH = reportW * 11 / 8.5;
  const pages = inner.querySelectorAll(".report-page");
  const pageCount = pages.length;
  const gap = 24;
  const unscaledTotalHeight = reportH * pageCount + gap * (pageCount - 1);

  // Factor of 0.96 leaves a little horizontal breathing room off each side
  const available = vw - 40;
  const s = Math.min(1, available / reportW);

  // Set the scale on the INNER (the element that actually transforms)
  inner.style.setProperty("--report-scale", s);

  // Set the OUTER's explicit size to the *scaled* dimensions — this is
  // what the browser uses for layout/centering, since transforms don't
  // affect layout box size
  const scaledW = reportW * s;
  const scaledH = unscaledTotalHeight * s;
  scale.style.width = scaledW + "px";
  scale.style.height = scaledH + "px";
}

window.addEventListener("resize", () => {
  if (document.body.classList.contains("report-open")) scaleReport();
});

function closeReport() {
  document.body.classList.remove("report-open");
  const overlay = document.getElementById("report-overlay");
  overlay.className = "";
  overlay.innerHTML = "";
}

function downloadReport() {
  const reportHtml = document.querySelector(".report-pages").outerHTML;
  const styles = Array.from(document.querySelectorAll("style")).map(s => s.outerHTML).join("");
  const fonts = '<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet">';
  const today = new Date();
  const docId = 'VDA-' + today.getFullYear() + String(today.getMonth() + 1).padStart(2, "0") + String(today.getDate()).padStart(2, "0") + '-' + CLIENT.name.substring(0,3).toUpperCase();

  const standalone = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + CLIENT.name + ' · Security Posture Brief</title>' + fonts + styles +
    '<style>body{background:#e8e6e0;padding:20px;margin:0;display:flex;justify-content:center;} .dl-wrapper{width:850px;max-width:100%;} .print-btn{position:fixed;top:20px;right:20px;z-index:999;background:#1a1a1a;color:#fff;border:none;padding:12px 20px;border-radius:6px;font-family:Inter,sans-serif;font-size:13px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.2);} @media print{.print-btn{display:none;}body{background:#fff;padding:0;display:block;}.dl-wrapper{width:100%;}.report-page{box-shadow:none !important;margin:0 !important;transform:none !important;}}</style>' +
    '</head><body><button class="print-btn" onclick="window.print()">Print / Save as PDF</button><div class="dl-wrapper">' + reportHtml + '</div></body></html>';

  try {
    const blob = new Blob([standalone], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = docId + "-board-brief.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    alert("Download failed. Use the Print button instead.");
  }
}

function tickClock() {
  const el = document.getElementById("clock");
  if (el) el.textContent = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

document.querySelectorAll(".theme-btn").forEach(b => {
  b.addEventListener("click", () => applyTheme(b.dataset.theme));
});

tickClock();
setInterval(tickClock, 30000);
render();
</script>
</body>
</html>
