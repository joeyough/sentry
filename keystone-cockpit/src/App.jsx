import React, { useEffect, useState } from "react";
import {
  CalendarCheck, Server, ShieldCheck, MessageSquare,
  ListTodo, Gauge, Check,
} from "lucide-react";
import {
  SOURCE, PEOPLE, BUILD_STEPS, SYSTEMS, VERIFY,
  TALK, TALK_FOR, OPEN_ITEMS, PHASES, overallPct,
} from "./data";

const STEPS_KEY = "keystone-cockpit-steps-v1";
const VERIFY_KEY = "keystone-cockpit-verify-v1";

const NAV = [
  { id: "today", label: "Today", Icon: CalendarCheck },
  { id: "systems", label: "Systems", Icon: Server },
  { id: "verify", label: "Verify", Icon: ShieldCheck },
  { id: "talk", label: "Talk", Icon: MessageSquare },
  { id: "open", label: "Open", Icon: ListTodo },
  { id: "progress", label: "Progress", Icon: Gauge },
];

function loadIds(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function useChecks(kind) {
  const key = kind === "today" ? STEPS_KEY : VERIFY_KEY;
  const [ids, setIds] = useState(() => loadIds(key));

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(ids));
  }, [key, ids]);

  const toggle = (id) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clear = () => setIds([]);

  return { ids, toggle, clear };
}

function Shell({ screen, setScreen, children }) {
  return (
    <div className="min-h-screen bg-ink text-paper font-body">
      <header className="border-b border-edge bg-deep">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-6 rounded-sm bg-orange" aria-hidden />
            <span className="font-display text-lg font-bold tracking-tight">Keystone</span>
            <span className="rounded bg-orange/15 px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.14em] text-orange">
              COCKPIT
            </span>
          </div>
          <span className="font-mono text-[10px] tracking-[0.14em] text-muted">
            JOEY · DRAFT 0.15
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-6 sm:pb-16">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-edge bg-deep/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl overflow-x-auto">
          {NAV.map(({ id, label, Icon }) => {
            const on = screen === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setScreen(id);
                  window.scrollTo(0, 0);
                }}
                className={`flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-2 text-[10px] font-semibold leading-none tracking-wide sm:text-[11px] ${
                  on ? "text-orange" : "text-muted"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function Eyebrow({ children }) {
  return (
    <div className="mb-2 font-mono text-[10px] font-bold tracking-[0.22em] text-orange">
      {children}
    </div>
  );
}

function Title({ children }) {
  return (
    <h1 className="mb-3 font-display text-[1.7rem] font-normal leading-tight text-paper sm:text-4xl">
      {children}
    </h1>
  );
}

function Lead({ children }) {
  return <p className="mb-6 max-w-xl font-display text-base italic leading-relaxed text-dim">{children}</p>;
}

function Card({ children, className = "" }) {
  return (
    <section className={`mb-3 rounded-lg border border-edge border-l-[3px] border-l-orange bg-card px-4 py-3.5 ${className}`}>
      {children}
    </section>
  );
}

function CheckRow({ checked, onToggle, title, detail }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={checked}
      className="mb-2 flex w-full items-start gap-3 rounded-lg border border-edge bg-card px-3 py-3 text-left"
    >
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border ${
          checked ? "border-orange bg-orange text-white" : "border-line bg-deep text-transparent"
        }`}
      >
        <Check size={14} />
      </span>
      <span className="min-w-0">
        <span className={`block text-[15px] leading-snug ${checked ? "text-dim line-through" : "text-paper"}`}>
          {title}
        </span>
        {detail && <span className="mt-1 block text-[13px] leading-relaxed text-muted">{detail}</span>}
      </span>
    </button>
  );
}

function SourceLine() {
  return (
    <p className="mt-8 font-mono text-[10px] leading-relaxed tracking-wide text-muted">
      {SOURCE.draft}. Wording commit {SOURCE.commit}. Branch {SOURCE.branch}. {SOURCE.note} Unknowns stay marked TBD.
    </p>
  );
}

function Today() {
  const { ids, toggle, clear } = useChecks("today");
  const done = BUILD_STEPS.filter((item) => ids.includes(item.id)).length;

  return (
    <div>
      <Eyebrow>TODAY · BUILD SHEET</Eyebrow>
      <Title>Build can start once Scott gives a thumbs up on the one-pager and Vince confirms what is in AWS.</Title>
      <Lead>
        Walk the build sheet from the top. Checks stay on this browser. They are your working list.
        They do not mean a step is live in AWS. Vince confirms that.
      </Lead>

      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-muted">
          {done} OF {BUILD_STEPS.length} STEPS
        </span>
        <button type="button" onClick={clear} className="font-mono text-[10px] font-bold tracking-[0.12em] text-steel">
          CLEAR CHECKS
        </button>
      </div>

      {BUILD_STEPS.map((item, i) => (
        <CheckRow
          key={item.id}
          checked={ids.includes(item.id)}
          onToggle={() => toggle(item.id)}
          title={`${String(i + 1).padStart(2, "0")}. ${item.text}`}
        />
      ))}
      <SourceLine />
    </div>
  );
}

function Systems() {
  return (
    <div>
      <Eyebrow>SYSTEMS</Eyebrow>
      <Title>What we are standing up.</Title>
      <Lead>
        One line on what each piece is, and who owns it. Vince confirms EC2 or WorkSpaces, Active Directory, and what is already live.
      </Lead>
      {SYSTEMS.map((sys) => (
        <Card key={sys.name}>
          <h2 className="font-display text-lg font-bold text-paper">{sys.name}</h2>
          <p className="mt-1 text-sm leading-relaxed text-dim">{sys.what}</p>
          <p className="mt-2 text-sm leading-relaxed text-paper">
            <span className="font-mono text-[10px] font-bold tracking-[0.14em] text-orange">OWNER </span>
            {sys.owner}
          </p>
          {sys.people && (
            <ul className="mt-3 space-y-1.5 border-t border-edge pt-3">
              {PEOPLE.map((p) => (
                <li key={p.email} className="text-sm leading-snug text-dim">
                  <span className="text-paper">{p.name}</span>
                  <span className="text-muted"> · {p.email}</span>
                  <span className="block text-[13px] text-muted">{p.role}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
      <SourceLine />
    </div>
  );
}

function Verify() {
  const { ids, toggle, clear } = useChecks("verify");
  const done = VERIFY.filter((item) => ids.includes(item.id)).length;

  return (
    <div>
      <Eyebrow>VERIFY</Eyebrow>
      <Title>Proof for the assessor.</Title>
      <Lead>
        Check a box only when the evidence exists. Boxes stay on this browser. They are not the official record.
      </Lead>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-muted">
          {done} OF {VERIFY.length} PROVEN
        </span>
        <button type="button" onClick={clear} className="font-mono text-[10px] font-bold tracking-[0.12em] text-steel">
          CLEAR CHECKS
        </button>
      </div>
      {VERIFY.map((item) => (
        <CheckRow
          key={item.id}
          checked={ids.includes(item.id)}
          onToggle={() => toggle(item.id)}
          title={item.title}
          detail={item.evidence}
        />
      ))}
      <SourceLine />
    </div>
  );
}

function Talk() {
  const [who, setWho] = useState("jon");
  const blocks = [
    { k: "Where we are", v: TALK.where },
    { k: "What's next", v: TALK.next },
    { k: "Why it's simple", v: TALK.simple },
    { k: "Monthly cost", v: TALK.cost },
  ];

  return (
    <div>
      <Eyebrow>TALK TRACK</Eyebrow>
      <Title>Say it in plain words.</Title>
      <Lead>Same four answers for Jon, Dan, and Scott. The note on top changes with the person.</Lead>

      <div className="mb-4 flex gap-2">
        {[
          ["jon", "Jon"],
          ["dan", "Dan"],
          ["scott", "Scott"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setWho(id)}
            className={`min-h-11 rounded-full border px-4 text-sm ${
              who === id ? "border-orange bg-orange/10 font-bold text-orange" : "border-edge text-dim"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card>
        <div className="mb-1 font-mono text-[10px] font-bold tracking-[0.16em] text-steel">FOR THIS PERSON</div>
        <p className="text-sm leading-relaxed text-dim">{TALK_FOR[who]}</p>
      </Card>

      {blocks.map((b) => (
        <Card key={b.k}>
          <h2 className="font-display text-lg font-bold text-paper">{b.k}</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-dim">{b.v}</p>
        </Card>
      ))}

      <Card>
        <h2 className="font-display text-lg font-bold text-paper">The contract</h2>
        <p className="mt-1 text-[15px] leading-relaxed text-dim">{TALK.contract}</p>
      </Card>
      <SourceLine />
    </div>
  );
}

function Open() {
  return (
    <div>
      <Eyebrow>OPEN ITEMS</Eyebrow>
      <Title>Still waiting.</Title>
      <Lead>These are still open in Draft 0.15.</Lead>
      {OPEN_ITEMS.map((item, i) => (
        <Card key={item.title}>
          <div className="mb-1 font-mono text-[10px] font-bold tracking-[0.16em] text-orange">
            {String(i + 1).padStart(2, "0")}
          </div>
          <h2 className="font-display text-lg font-bold text-paper">{item.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-dim">{item.body}</p>
        </Card>
      ))}
      <SourceLine />
    </div>
  );
}

function Progress() {
  const total = overallPct(PHASES);

  return (
    <div>
      <Eyebrow>PROGRESS</Eyebrow>
      <Title>{total}% of the weighted plan.</Title>
      <Lead>
        Weights are discovery and design 30, build 35, testing 10, SSP 10, assessment 15.
        About 90 percent of discovery is 27 points. The other phases are 0 if nothing is live in AWS. That is 27 percent.
      </Lead>

      <Card>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-muted">WEIGHTED TOTAL</span>
          <span className="font-display text-3xl text-paper">{total}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-deep">
          <div className="h-full rounded-full bg-orange" style={{ width: `${total}%` }} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-dim">
          About 90 percent of the 30-point discovery weight is 27. Build, testing, the SSP, and the assessment stay at 0 while nothing is confirmed live in AWS. That is 27 percent.
          Vince must confirm what is live. Each 1 of the 12 build-sheet steps that is live adds about 3 points.
        </p>
      </Card>

      {PHASES.map((p) => {
        const points = Math.round((p.weight * p.pct) / 100);
        return (
          <Card key={p.id}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-paper">{p.name}</h2>
              <span className="shrink-0 font-mono text-xs text-orange">
                {p.pct}% · weight {p.weight}
              </span>
            </div>
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-deep">
              <div className="h-full rounded-full bg-steel" style={{ width: `${p.pct}%` }} />
            </div>
            <p className="text-sm leading-relaxed text-dim">
              {p.note} Contributes {points} of {p.weight} points.
            </p>
          </Card>
        );
      })}
      <SourceLine />
    </div>
  );
}

const SCREENS = {
  today: Today,
  systems: Systems,
  verify: Verify,
  talk: Talk,
  open: Open,
  progress: Progress,
};

export default function App() {
  const [screen, setScreen] = useState("today");
  const View = SCREENS[screen];
  return (
    <Shell screen={screen} setScreen={setScreen}>
      <View />
    </Shell>
  );
}
