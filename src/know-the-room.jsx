import React, { useState, useMemo } from "react";

// ==========================================================================
// Know the Room — Sentry Intel Console
// A stakeholder-intelligence surface for Joey before walking into any call
// with Kendall, Jim, Sibe, or Vince. Mock-only. Single-file. No backend.
// ==========================================================================

const T = {
  bg: "#0A1628",
  bgCard: "#122238",
  bgCardEdge: "#1A2E47",
  bgElevated: "#172941",
  ink: "#E8EEF4",
  inkDim: "#A8B8C8",
  inkMuted: "#6B7D91",
  divider: "#2A3E57",
  orange: "#D2691E",
  orangeSoft: "#E89968",
  steel: "#6B93B8",
  trustHot: "#3FB185",
  trustWarm: "#D2691E",
  trustCool: "#6B93B8",
  trustCold: "#8A3F3F",
  fontDisplay: 'Georgia, "Times New Roman", serif',
  fontBody: 'Calibri, "Segoe UI", system-ui, sans-serif',
  fontMono: 'Consolas, "Courier New", monospace',
};

// --------------------------------------------------------------------------
// useIsMobile — non-SSR safe, reactive on resize. No window.innerWidth in render.
// --------------------------------------------------------------------------
function useIsMobile(breakpoint = 760) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

// --------------------------------------------------------------------------
// The data. Sourced from SecOps_Conversation.txt and Joey_Kendall_Introduction.
// Timestamps are real. Quotes are real (lightly trimmed for punctuation).
// --------------------------------------------------------------------------

const STAKEHOLDERS = [
  {
    id: "kendall",
    name: "Kendall Rusco",
    role: "VDA Software Developer — final technical sign-off",
    trust: 62,
    trustNote: "Warming. Killed Halo, approved you as sub, opened the door.",
    leadWith:
      "We're thinking a 5-week ticketing MVP, one deliverable, clean handoff to whoever you put on it after.",
    closer:
      "He reads literally. Warm, collaborative, flexibility-first. Nothing that sounds like a lawyer wrote it.",
    priorities: [
      "Scalable, modular — VDA engineers can pick it up after handoff",
      "Short roadmap, not a long-term vendor dependency",
      "Trust the relationship — 'it's how we handle problems along the way'",
    ],
    concerns: [
      "Another Halo. Another tool that dies quietly a year later.",
      "Legal or contract language landing before technical proof",
      "Getting stuck again as the de facto admin for a vendor's platform",
    ],
    asks: [
      "No vendor lock-in — operational control stays with VDA",
      "Proof of work before pricing conversations",
      "A technical surface he can actually audit",
    ],
    antiPatterns: [
      "Licensing terms in the deck or docs — he gets spooked by legal tone",
      "Pre-announcing IP structure before the SOW",
      "Ownership-of-the-code phrasing — overcommits and raises questions he didn't have",
    ],
    read: [
      "Reads literally. 'Flexible' lands as 'contingent.' Say 'shaped together.'",
      "Tests trust in small bets before big ones. Sub-approval was the test — the tool is the ask.",
      "Goes quiet when spooked, doesn't argue. If you lose him, pull back on tone before content.",
      "Rewards consistency over charisma. Show up the same way twice and you're in.",
    ],
    quotes: [
      {
        time: "09:49",
        src: "intro",
        text:
          "My whole thing is just trust. Trust the people that we're working with, and good outcomes.",
      },
      {
        time: "09:49",
        src: "intro",
        text:
          "Not saying that there won't be problems along the way, but it's how we handle them and how we work through them.",
      },
      {
        time: "00:16",
        src: "secops",
        via: "Vincent, paraphrasing Kendall",
        text:
          "Kendall really emphasized — he wasn't super stoked on the idea to do, like, a long term lock in, where we just develop a thing and ship it.",
      },
    ],
  },
  {
    id: "jim",
    name: "Jim Blankenship",
    role: "VDA Product Owner — scope approver",
    trust: 78,
    trustNote: "High, but carrying Halo trauma. 100–200 hrs he wants back.",
    leadWith:
      "The wrong-client UI is the first thing I want you to see — it's the feature that came from the call where you flagged it twice.",
    closer:
      "He is the rare product owner who already knows what he doesn't need. Trust him on scope; don't try to expand it.",
    priorities: [
      "Ticketing first. Everything else is a 'maybe later'.",
      "Customer portal — he liked Halo's one and wants a lean version",
      "Mean-time-to-resolution metrics for monthly reports",
    ],
    concerns: [
      "Getting stuck with a tool that a year from now doesn't work",
      "Analysts sending information to the wrong customer under pressure",
      "Rebuilding the 5-month Halo POC where he became the dev",
    ],
    asks: [
      "Inbound email at soc@vdalabs.com opens a case",
      "Analyst-initiated ticket creation from SNYPR, not auto-flooding",
      "Customer portal with open case / tickets / contract / documents",
    ],
    antiPatterns: [
      "CRM, invoicing, project management — he walked back from that already",
      "'Run your whole business on this' — that was Halo's pitch and it burned him",
      "Complex onboarding that makes him the admin again",
    ],
    read: [
      "Owns outcomes, not processes. He wants the ticket resolved, not the framework validated.",
      "Halo left a mark. He'll re-open the wound every time a tool feels abstract. Name the parallel before he does.",
      "Approves in plain terms when he sees the thing. Demo-first, deck-second.",
      "Generous with time when you come in concrete. Loses patience fast with abstractions.",
    ],
    quotes: [
      {
        time: "03:34",
        src: "secops",
        text:
          "Everything here is such a shit show. We have no efficiencies, no organization whatsoever. I'm trying to organize it so it's not that way.",
      },
      {
        time: "03:34",
        src: "secops",
        text:
          "We don't want to be stuck with a tool that a year from now is not going to work — not scalable, or can't be tweaked.",
      },
      {
        time: "27:36",
        src: "secops",
        flag: "sacred feature",
        text:
          "Analysts are working quickly, and they'll copy a bunch of information, and then they'll send information to the wrong client about an alert. If there's some sort of stop gap we can put in where — when I click create a ticket, it pulls that customer profile and all the customer contacts.",
      },
      {
        time: "33:35",
        src: "secops",
        text:
          "This is what made me really fall in love with Halo — a full customer experience platform. A customer would have an account, they could come in and see the tickets that are open, report an issue.",
      },
      {
        time: "44:15",
        src: "secops",
        text:
          "Probably like mean time to resolution, or mean time to respond. At the end of the month — hey, we got 15 alerts for you guys last month, 12 of them were medium, you had one critical.",
      },
    ],
  },
  {
    id: "sibe",
    name: "Sibe Klomp",
    role: "VDA SOC Manager — daily user, 12 analysts under him",
    trust: 55,
    trustNote: "Neutral-professional. Wants less, not more. Respect his time.",
    leadWith:
      "One button in SNYPR creates a ticket. That's the whole thing. Let me show you.",
    closer:
      "Don't tour features. Hand him the rail and shut up. If he starts clicking, you've won.",
    priorities: [
      "Less noise, not more — the SIM already buries him in false positives",
      "Email is the channel. Don't move him off it.",
      "Analyst-triggered workflow: I decide what becomes a ticket",
    ],
    concerns: [
      "Auto-ingesting every SIM alert and recreating the junk problem",
      "Learning a new interface that slows down the critical-hour SLA",
      "Tools with 'all the bells and whistles' he doesn't want",
    ],
    asks: [
      "Playbook trigger from SNYPR when an analyst changes incident state",
      "Inbound email on soc@vdalabs.com creates or threads into a case",
      "Simple severity — CRIT / HIGH / MED / LOW, nothing fancy",
    ],
    antiPatterns: [
      "Scoring engines, ranking, boost rules — the wrong answer to his pain",
      "Slack as a primary SOC channel — he uses it for projects, not alerts",
      "Any feature that assumes every SIM event should become a ticket",
    ],
    read: [
      "Operator vocabulary. Short sentences, concrete nouns. 'Rail, button, status' — not 'workflow, interface, ontology.'",
      "Noise-averse. If your pitch has adjectives, he's already half-out.",
      "Trusts what he clicks. Hand him the rail and shut up for twenty seconds.",
      "Answers directly to direct questions. Never ask a yes/no when you want the why.",
    ],
    quotes: [
      {
        time: "24:06",
        src: "secops",
        text:
          "The thing with the SIM is we get a lot of just junk, a lot of false positive alerts. I don't want to just get every alert. I just want to focus on things that actually need to be communicated.",
      },
      {
        time: "25:43",
        src: "secops",
        text:
          "There's playbook triggering rules. We can change the status of an incident — open, claim, awaiting customer, completed. A playbook triggering rule sees this incident is in this state, let me run this playbook to create a ticket.",
      },
      {
        time: "28:21",
        src: "secops",
        text:
          "It doesn't need to be very difficult. A lot of these ticketing platforms, they've got all the bells and whistles. We don't really need all that crazy stuff.",
      },
      {
        time: "29:01",
        src: "secops",
        text:
          "We primarily use email. Any initial communication from the SOC team is going to be over email, text, or phone. We use Slack just for interaction with the customer after the incident has been initially communicated.",
      },
      {
        time: "42:20",
        src: "secops",
        text:
          "We very clearly lay it out to our customers. If they have an emergency, they call us. Same goes — if we detect something of high criticality, we call them. If it's lower, we just email.",
      },
    ],
  },
  {
    id: "vince",
    name: "Vincent Mentz",
    role: "3Nails partner, cousin — technical builder, you hold the reins on scope + comms",
    trust: 95,
    trustNote: "Family. Covenant-level. Fully aligned.",
    leadWith:
      "Here's what I want you to build this week. I'll handle the stakeholder side.",
    closer:
      "He's the hacker-workhorse. Hand him specs, not choices. Decisions drain him; building energizes him.",
    priorities: [
      "Ship a working POC in 5–6 weeks, fail fast, refine on top",
      "Premium feel for the customer portal — VDA sells on that surface",
      "Build time protected — no surprise scope debates mid-sprint",
    ],
    concerns: [
      "Building for weeks before hearing back from Jim on discovery",
      "Scope drift — 'we could market this to other people' energy",
      "Decisions leaking into his build time",
    ],
    asks: [
      "You handle stakeholder comms, deck, scope discipline",
      "Sibe gets into the portal while it's still wet",
      "Deployment on cloud — Netlify or similar, not VDA hardware",
    ],
    antiPatterns: [
      "Asking him to pick between options instead of handing him a brief",
      "Reopening scope questions you already closed",
      "Letting the build run dark for a week without a Slack drop",
    ],
    read: [
      "Builds on trust, not argument. Don't re-litigate decisions he already signed off on.",
      "Needs momentum, not consensus. One Slack message with a decision beats three with options.",
      "Covenants show up in action. When he says 'let's,' he means 'you lead, I'll build.'",
      "Says yes fast when the ask is concrete. Slows down when the ask is directional.",
    ],
    quotes: [
      {
        time: "11:04",
        src: "secops",
        text:
          "I think it would be possible for us to realistically create a working proof of concept in five to six weeks. One of the biggest requirements is to establish a product owner.",
      },
      {
        time: "29:43",
        src: "secops",
        text:
          "We also want to make it feel premium for the end user, the customer. We can make the back end work, but for what they're interacting with, it needs to feel premium and powerful, robust.",
      },
      {
        time: "39:35",
        src: "secops",
        text:
          "I'll probably have Sibe in the portal as I'm developing. Is this what you would want to see? How would you adjust this?",
      },
      {
        time: "01:23:30",
        src: "secops",
        text:
          "You're like a layer on top, you're like an AI, but a human over my life. That actually frames it differently for me.",
      },
    ],
  },
  {
    id: "joey",
    name: "Joey Mentz",
    self: true,
    role: "3Nails principal — the one carrying the thread",
    leadWith:
      "Your edge is work-first, then price. When pressure climbs, don't skip straight to pricing.",
    closer:
      "You came into this to build, not to manage. When you feel pulled to manage, it's a signal — not a promotion.",
    priorities: [
      "Prove worth through work before anyone sees a price tag",
      "Protect focus across the 8 parallel threads — one forward, not eight sideways",
      "Build things clients can own without you — no dependency trap",
      "Stay at 30k altitude; delegate the 3-foot work",
    ],
    concerns: [
      "Enabling instead of building — caring more than the owner does",
      "Thread sprawl — saying yes to a new mess before closing an old one",
      "Being read as 'too good to be true' before the receipts exist",
      "Over-rotating on business as identity — you've named it, it's a lifelong watch",
    ],
    asks: [
      "To Kendall — let me work for you first, prove the value, then talk price",
      "To Vincent — what can I take off your plate so you can build",
      "To every new client — don't pay me until you've felt it",
    ],
    antiPatterns: [
      "Treating every founder's mess like yours to fix",
      "Confusing 'helpful' with 'needed'",
      "Taking on a new thread before closing an old one",
      "Letting work-first become never-charge",
    ],
    read: [
      "You pitch through analogies — Monopoly, 360 deals, Marie Kondo, video game. Systematic thinking, vernacular voice. Use both on purpose.",
      "Your default is 'behind the scenes.' Own it when it serves. Notice when it's a retreat from the spotlight.",
      "You frame focus as spiritual — 'keep God at the center.' That's load-bearing, not decorative.",
      "You charge less than you're worth by design at the start. Decide consciously when to stop.",
    ],
    quotes: [
      {
        time: "12:27",
        src: "intro",
        text:
          "Business is my video game, it's my sport, it's my hobby. Being in my mid 30s now, I've learned to find the balance and not over-rotate and idolize and make it all of my life.",
      },
      {
        time: "12:27",
        src: "intro",
        text:
          "I'm not working. I'm just having fun. That's how I exceed and beat the competition.",
      },
      {
        time: "12:27",
        src: "intro",
        flag: "core pitch",
        text:
          "What does the X stand for? Whatever you need. I'd rather actually be the guy behind the scenes that helps boost you up.",
      },
      {
        time: "18:09",
        src: "intro",
        text:
          "Any business has the same nine departments — legal, HR, finance, marketing, sales, vision, product, technical. How do you focus on what needs to be focused on at that given season. It's like a game of Monopoly to me, a game of strategy. And I really just enjoy chewing on that.",
      },
      {
        time: "1:22:25",
        src: "secops",
        text:
          "Let me just work for you first, because let me prove to you that it's not too good to be true.",
      },
      {
        time: "1:22:25",
        src: "secops",
        flag: "watch this",
        text:
          "I don't want to do this with everyone. I have to be very careful with who I do it with too — because I could be enabling if it's not done right.",
      },
      {
        time: "1:29:51",
        src: "secops",
        text:
          "We have to be really careful of not getting unfocused. Keep God at the center and keep praying about what we're doing.",
      },
    ],
  },
];

// --------------------------------------------------------------------------
// Open loops — who owes what. Sourced from the transcripts.
// --------------------------------------------------------------------------
const LOOPS = [
  {
    owner: "jim",
    title: "Return the 13-question Discovery Questionnaire",
    origin: "secops 40:12",
    stakes: "Every AT-RISK scope item stays or falls based on his answers",
    age: "sent · awaiting",
  },
  {
    owner: "jim",
    title: "Share the original Halo requirements doc",
    origin: "secops 12:04",
    stakes:
      "Direct line to what he wanted from Halo — the MVP scope map for free",
    age: "promised on call · awaiting",
  },
  {
    owner: "sibe",
    title: "Stand up soc-dev account + API key for test inbox",
    origin: "secops 38:51",
    stakes: "Email bridge can't be built until the mailbox is reachable",
    age: "said he'd ask the group · awaiting",
  },
  {
    owner: "sibe",
    title: "Send one sample alert email from the SOC",
    origin: "secops 41:18",
    stakes: "Inbound parser needs real-shape payload to thread correctly",
    age: "requested · awaiting",
  },
  {
    owner: "jim",
    title: "Share a sample monthly customer report",
    origin: "secops 46:42",
    stakes: "Feeds Option B reporting scope if that conversation opens",
    age: "offered · awaiting",
  },
  {
    owner: "kendall",
    title: "Sign off on final 5-week scope after discovery returns",
    origin: "implicit — he gets the last technical look",
    stakes: "Phase 1 doesn't start without him nodding",
    age: "pending discovery answers",
  },
  {
    owner: "joey",
    title: "Follow up with Jim on discovery — one nudge, gentle",
    origin: "project cadence",
    stakes: "Every day in limbo is a day Vince isn't building",
    age: "your move",
  },
];

// --------------------------------------------------------------------------
// Assets — the full surface area of the Sentry project at this moment
// --------------------------------------------------------------------------
const ASSETS = [
  {
    id: "deck",
    name: "VDA_SecOps_Plan_v4",
    type: "Operator deck",
    state: "shipped",
    tldr:
      "16-slide deck for Kendall and Jim. Walks the Halo autopsy, the 5-week MVP, and Options A / B / C without pre-announcing IP.",
    audience: "Kendall, Jim, Sibe",
    note: "Keep licensing language out. Wrong-client UI is the sacred slide.",
  },
  {
    id: "portal",
    name: "sentry-portal.jsx",
    type: "Customer-facing app",
    state: "shipped",
    tldr:
      "The VDA customer experience — security report, ticket list, swipe-archive, PDF download. Magic-link auth, no CRM.",
    audience: "End customers, via Jim",
    note: "Premium feel per Vince — this is the surface VDA sells on.",
  },
  {
    id: "analyst",
    name: "sentry-analyst.jsx",
    type: "SOC console",
    state: "shipped",
    tldr:
      "Sibe's daily workspace. 420px rail + workspace, inbox-stack queue, ComposeModal with the wrong-client prevention UI Jim flagged.",
    audience: "Sibe and 12 analysts",
    note: "Severity sort only. No scoring, no ranking, no learning loop.",
  },
  {
    id: "design",
    name: "sentry-design-system-v3.html",
    type: "Design doc",
    state: "shipped",
    tldr:
      "Standalone reference for tokens, type, severity colors, and the rules of orange. Uses system fonts to dodge the iOS Safari Georgia bug.",
    audience: "Internal — you, Vince, future engineers",
    note: "Georgia weights 400 and 700 only on dark backgrounds.",
  },
  {
    id: "readme",
    name: "README.md",
    type: "Pitch doc",
    state: "shipped",
    tldr:
      "Project pitch in Jim's language. Halo post-mortem framing, the five things only, the 5-week commit.",
    audience: "Any new reader — Kendall hands it out",
    note: "Plain-spoken. No vendor voice.",
  },
  {
    id: "discovery",
    name: "DISCOVERY.md",
    type: "Call synthesis",
    state: "shipped",
    tldr:
      "Call-by-call synthesis and SNYPR integration patterns. The reference that turned Sibe's 'one button' into an architecture.",
    audience: "Internal — you, Vince",
    note: "Pair with Loops tab when Jim's 13 answers come back.",
  },
  {
    id: "bus",
    name: "BUS_FACTOR.md",
    type: "Handoff doc",
    state: "shipped",
    tldr:
      "The 'don't get stuck with a tool' answer. Explicit handoff protocol so VDA engineers can take the repo after Phase 1.",
    audience: "Kendall first, then Jim",
    note: "This is the anti-lock-in proof. Point to it by name.",
  },
  {
    id: "scope",
    name: "SCOPE_AUDIT.md",
    type: "Scope playbook",
    state: "live",
    tldr:
      "What's DEFENDED, AT-RISK, and OUT-OF-SCOPE — voiced from Jim, Sibe, and Vince. The runbook for when discovery comes back.",
    audience: "Internal",
    note: "AT-RISK items get cut if Jim doesn't mention them. Scope discipline is the product.",
  },
  {
    id: "questionnaire",
    name: "VDA_Discovery_Questionnaire.docx",
    type: "Questionnaire",
    state: "awaiting",
    tldr:
      "13 questions out to Jim. Every AT-RISK scope item turns on his answers. Nothing builds until they return.",
    audience: "Jim (direct)",
    note: "Gentle nudge is on your plate. One follow-up, then hold.",
  },
  {
    id: "room",
    name: "know-the-room.jsx",
    type: "Intel console",
    state: "live",
    tldr:
      "This thing. Stakeholder reads, quotes, loops, and the Prep tab that assembles a paste-ready prompt for any call.",
    audience: "You, Vince — before any conversation",
    note: "Share with Vince before the next sync. He's going to like it.",
  },
];


const TIMELINE = [
  {
    phase: "before",
    title: "Halo enters",
    detail:
      "VDA evaluates Halo on ticketing. The pitch expands into CRM, invoicing, ops — 'run your whole business on this thing'.",
    anchor: "Jim · secops 03:34",
  },
  {
    phase: "before",
    title: "Halo fails",
    detail:
      "Five-month POC. 100–200 hours Jim himself configures. Sales team hates it. Control-Z back to Salesforce and Monday. Ticketing problem still unsolved.",
    anchor: "Jim · secops 03:34",
  },
  {
    phase: "before",
    title: "Kendall opens the door",
    detail:
      "Vincent introduces Joey and Kendall. Kendall approves Joey as a sub — then suggests maybe VDA itself, not just through 3Nails.",
    anchor: "Vincent · intro 0:55",
  },
  {
    phase: "before",
    title: "Kendall mentions the XDR pain",
    detail:
      "In passing, Kendall brings up a past failed build for a console. That's the moment Sentry becomes a real conversation.",
    anchor: "Vincent · secops 00:16",
  },
  {
    phase: "discovery",
    title: "Discovery call — Jim + Sibe unpack pain",
    detail:
      "Jim tells the full Halo story. Sibe describes the SOC's real workflow — SIM junk, email primary, analyst-triggered tickets.",
    anchor: "full call · secops",
  },
  {
    phase: "discovery",
    title: "The wrong-client moment",
    detail:
      "Jim surfaces cross-customer data leakage — analysts under pressure copy-pasting into the wrong client's email. This becomes Sentry's sacred feature.",
    anchor: "Jim · secops 27:36",
  },
  {
    phase: "discovery",
    title: "Scope crystallizes — five things only",
    detail:
      "Ticketing, SNYPR bridge, email bridge, customer portal, SLA clock. CRM and scoring are explicitly out. Sibe confirms: 'doesn't need to be very difficult'.",
    anchor: "Sibe · secops 28:21",
  },
  {
    phase: "now",
    title: "13 questions out to Jim",
    detail:
      "Discovery questionnaire sent. Every AT-RISK scope item is contingent on his answers. Build is deliberately paused here to preserve scope discipline.",
    anchor: "current · awaiting",
  },
];

// --------------------------------------------------------------------------
// buildPrepPrompt — assemble a paste-ready prompt for a fresh Claude session.
// Pure function. Takes a person + meeting type + the loops array.
// --------------------------------------------------------------------------
function buildPrepPrompt(person, meetingType, loops) {
  const personLoops = loops.filter((l) => l.owner === person.id);
  const L = [];

  L.push(`I'm about to meet with ${person.name}.`);
  L.push("");
  L.push(`Role · ${person.role}`);
  L.push(`Trust read · ${person.trustNote}`);
  L.push("");

  L.push("What they want:");
  person.priorities.forEach((p) => L.push(`  - ${p}`));
  L.push("");

  L.push("What keeps them up:");
  person.concerns.forEach((c) => L.push(`  - ${c}`));
  L.push("");

  L.push("Direct asks they've made:");
  person.asks.forEach((a) => L.push(`  - ${a}`));
  L.push("");

  if (person.read && person.read.length > 0) {
    L.push("The read — how they operate in a room:");
    person.read.forEach((r) => L.push(`  - ${r}`));
    L.push("");
  }

  L.push("Their own words (with timestamps):");
  person.quotes.forEach((q) => {
    const tag = q.src === "secops" ? "discovery call" : "intro call";
    const via = q.via ? ` (via ${q.via})` : "";
    L.push(`  - "${q.text}" — ${q.time} ${tag}${via}`);
  });
  L.push("");

  if (personLoops.length > 0) {
    L.push("Still owed to me or the project by them:");
    personLoops.forEach((l) => L.push(`  - ${l.title} — ${l.stakes}`));
    L.push("");
  }

  L.push("Do not mention:");
  person.antiPatterns.forEach((a) => L.push(`  - ${a}`));
  L.push("");

  L.push("---");
  L.push("");

  if (meetingType === "sync") {
    L.push("Meeting type · sync / check-in");
    L.push("");
    L.push(
      "Draft three opening lines I could actually use. For each, tell me why it works specifically for this person. Keep them plain-spoken — no consultant voice."
    );
  } else if (meetingType === "decision") {
    L.push("Meeting type · I need them to commit to something");
    L.push("");
    L.push("What I need committed: <<fill this in before pasting>>");
    L.push("");
    L.push(
      "Pressure-test my angle. Flag what they're likely to push back on based on their quotes above. Draft the direct ask and the fallback if they hedge."
    );
  } else if (meetingType === "hard") {
    L.push("Meeting type · hard conversation");
    L.push("");
    L.push("What I need to surface: <<fill this in before pasting>>");
    L.push("");
    L.push(
      "Draft an opener that respects the trust we've built. Give me an escape hatch if it lands badly — what to say, and when to stop and circle back later."
    );
  }

  return L.join("\n");
}



function Pill({ children, tone = "default", style = {} }) {
  const tones = {
    default: { bg: T.bgElevated, fg: T.inkDim, border: T.divider },
    orange: { bg: "rgba(210,105,30,0.14)", fg: T.orangeSoft, border: "rgba(210,105,30,0.35)" },
    steel: { bg: "rgba(107,147,184,0.14)", fg: T.steel, border: "rgba(107,147,184,0.3)" },
    flag: { bg: "rgba(210,105,30,0.18)", fg: T.orangeSoft, border: T.orange },
  };
  const t = tones[tone] || tones.default;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        fontSize: 11,
        fontFamily: T.fontBody,
        letterSpacing: 0.3,
        textTransform: "uppercase",
        color: t.fg,
        background: t.bg,
        border: `1px solid ${t.border}`,
        borderRadius: 3,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function TrustDial({ value, label }) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 85 ? T.trustHot : pct >= 60 ? T.trustWarm : pct >= 40 ? T.trustCool : T.trustCold;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: T.bgElevated,
          borderRadius: 2,
          overflow: "hidden",
          minWidth: 80,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            transition: "width 0.4s",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: T.fontMono,
          fontSize: 11,
          color: color,
          minWidth: 28,
          textAlign: "right",
        }}
      >
        {pct}
      </span>
      {label && (
        <span style={{ fontFamily: T.fontBody, fontSize: 11, color: T.inkMuted }}>
          {label}
        </span>
      )}
    </div>
  );
}

function Quote({ q, name }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        background: T.bgCard,
        border: `1px solid ${q.flag ? T.orange : T.divider}`,
        borderLeft: `3px solid ${q.flag ? T.orange : T.steel}`,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {name && (
            <span
              style={{
                fontFamily: T.fontDisplay,
                fontSize: 13,
                color: T.ink,
                fontWeight: 700,
              }}
            >
              {name}
            </span>
          )}
          <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkMuted }}>
            {q.time}
          </span>
          <span style={{ fontFamily: T.fontBody, fontSize: 10, color: T.inkMuted, letterSpacing: 0.3 }}>
            · {q.src === "secops" ? "DISCOVERY CALL" : "INTRO CALL"}
          </span>
          {q.via && (
            <span style={{ fontFamily: T.fontBody, fontSize: 10, color: T.inkMuted, fontStyle: "italic" }}>
              ({q.via})
            </span>
          )}
        </div>
        {q.flag && <Pill tone="flag">{q.flag}</Pill>}
      </div>
      <div
        style={{
          fontFamily: T.fontDisplay,
          fontSize: 15,
          lineHeight: 1.55,
          color: T.ink,
        }}
      >
        &ldquo;{q.text}&rdquo;
      </div>
    </div>
  );
}

function SectionHead({ children, style = {} }) {
  return (
    <div
      style={{
        fontFamily: T.fontBody,
        fontSize: 10,
        letterSpacing: 1.5,
        textTransform: "uppercase",
        color: T.inkMuted,
        marginBottom: 10,
        marginTop: 4,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function BulletList({ items, tone = "default" }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {items.map((x, i) => (
        <li
          key={i}
          style={{
            padding: "6px 0 6px 14px",
            position: "relative",
            fontFamily: T.fontBody,
            fontSize: 14,
            color: T.ink,
            lineHeight: 1.5,
            borderBottom: i < items.length - 1 ? `1px solid ${T.divider}` : "none",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 12,
              width: 6,
              height: 1,
              background: tone === "orange" ? T.orange : T.steel,
            }}
          />
          {x}
        </li>
      ))}
    </ul>
  );
}

// --------------------------------------------------------------------------
// Views
// --------------------------------------------------------------------------

function BriefView({ selected, setSelected, stakeholders }) {
  const isMobile = useIsMobile();
  const person = stakeholders.find((s) => s.id === selected) || stakeholders[0];
  const todaysFocus = LOOPS.filter((l) => l.owner === "joey");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "260px 1fr",
        gap: 20,
      }}
    >
      {/* stakeholder selector rail */}
      <div>
        {todaysFocus.length > 0 && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 14px",
              background: T.bgCard,
              border: `1px solid ${T.orange}`,
              borderLeft: `3px solid ${T.orange}`,
            }}
          >
            <div
              style={{
                fontFamily: T.fontBody,
                fontSize: 10,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                color: T.orangeSoft,
                marginBottom: 6,
              }}
            >
              Today · {todaysFocus.length} {todaysFocus.length === 1 ? "nudge" : "nudges"} on your plate
            </div>
            {todaysFocus.map((l, i) => (
              <div
                key={i}
                style={{
                  fontFamily: T.fontDisplay,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: T.ink,
                  marginBottom: i < todaysFocus.length - 1 ? 6 : 0,
                  overflowWrap: "break-word",
                }}
              >
                {l.title}
              </div>
            ))}
          </div>
        )}
        <SectionHead>The room</SectionHead>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {stakeholders.filter((s) => !s.self).map((s) => {
            const active = s.id === selected;
            const loopCount = LOOPS.filter((l) => l.owner === s.id).length;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  background: active ? T.bgElevated : T.bgCard,
                  border: `1px solid ${active ? T.orange : T.divider}`,
                  borderLeft: `3px solid ${active ? T.orange : T.divider}`,
                  cursor: "pointer",
                  fontFamily: T.fontBody,
                  color: T.ink,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 8,
                    marginBottom: 3,
                  }}
                >
                  <div
                    style={{
                      fontFamily: T.fontDisplay,
                      fontSize: 15,
                      fontWeight: 700,
                      color: T.ink,
                    }}
                  >
                    {s.name}
                  </div>
                  {loopCount > 0 && (
                    <div
                      style={{
                        fontFamily: T.fontMono,
                        fontSize: 10,
                        color: T.orangeSoft,
                        letterSpacing: 0.3,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {loopCount} open
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 6 }}>
                  {s.role.split("—")[0].trim()}
                </div>
                <TrustDial value={s.trust} />
              </button>
            );
          })}
        </div>

        {/* you — self-reflection card, separated from the room */}
        {stakeholders.filter((s) => s.self).map((s) => {
          const active = s.id === selected;
          const loopCount = LOOPS.filter((l) => l.owner === s.id).length;
          return (
            <div key={s.id} style={{ marginTop: 18 }}>
              <SectionHead>You</SectionHead>
              <button
                onClick={() => setSelected(s.id)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  background: active ? T.bgElevated : T.bgCard,
                  border: `1px solid ${active ? T.orange : T.divider}`,
                  borderLeft: `3px solid ${active ? T.orange : T.steel}`,
                  cursor: "pointer",
                  fontFamily: T.fontBody,
                  color: T.ink,
                  width: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 8,
                    marginBottom: 3,
                  }}
                >
                  <div
                    style={{
                      fontFamily: T.fontDisplay,
                      fontSize: 15,
                      fontWeight: 700,
                      color: T.ink,
                    }}
                  >
                    {s.name}
                  </div>
                  {loopCount > 0 && (
                    <div
                      style={{
                        fontFamily: T.fontMono,
                        fontSize: 10,
                        color: T.orangeSoft,
                        letterSpacing: 0.3,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {loopCount} open
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: T.inkMuted }}>
                  {s.role.split("—")[0].trim()}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* the brief itself */}
      <div>
        <SectionHead>{person.self ? "Before you open the next tab" : "Before the call"}</SectionHead>
        <div
          style={{
            padding: "18px 20px",
            background: T.bgCard,
            border: `1px solid ${T.divider}`,
            borderTop: `3px solid ${T.orange}`,
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 11, color: T.orangeSoft, letterSpacing: 1, marginBottom: 8 }}>
            {person.self ? "REMIND YOURSELF" : "LEAD WITH"}
          </div>
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 18,
              lineHeight: 1.5,
              color: T.ink,
              fontWeight: 400,
            }}
          >
            &ldquo;{person.leadWith}&rdquo;
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 22,
              fontWeight: 700,
              color: T.ink,
            }}
          >
            {person.name}
          </div>
          <div style={{ fontFamily: T.fontBody, fontSize: 13, color: T.inkDim, marginBottom: 10 }}>
            {person.role}
          </div>
          {!person.self && <TrustDial value={person.trust} label={person.trustNote} />}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 18,
            marginBottom: 18,
          }}
        >
          <div>
            <SectionHead>{person.self ? "What you want" : "What they want"}</SectionHead>
            <BulletList items={person.priorities} />
          </div>
          <div>
            <SectionHead>{person.self ? "What keeps you up" : "What keeps them up"}</SectionHead>
            <BulletList items={person.concerns} tone="orange" />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 18,
            marginBottom: 18,
          }}
        >
          <div>
            <SectionHead>{person.self ? "Asks you've made of others" : "Direct asks"}</SectionHead>
            <BulletList items={person.asks} />
          </div>
          <div>
            <SectionHead>{person.self ? "Don't drift into" : "Don't do this"}</SectionHead>
            <BulletList items={person.antiPatterns} tone="orange" />
          </div>
        </div>

        {person.read && (
          <div
            style={{
              marginBottom: 18,
              padding: "14px 16px",
              background: T.bgCard,
              border: `1px solid ${T.divider}`,
              borderLeft: `3px solid ${T.steel}`,
            }}
          >
            <SectionHead style={{ marginBottom: 8, marginTop: 0 }}>
              {person.self ? "The read · how you actually operate" : "The read · how they operate"}
            </SectionHead>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {person.read.map((r, i) => (
                <li
                  key={i}
                  style={{
                    padding: "6px 0",
                    fontFamily: T.fontDisplay,
                    fontSize: 14,
                    color: T.ink,
                    lineHeight: 1.55,
                    fontStyle: "italic",
                    borderBottom:
                      i < person.read.length - 1
                        ? `1px solid ${T.divider}`
                        : "none",
                  }}
                >
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          style={{
            padding: "14px 16px",
            background: T.bgElevated,
            border: `1px solid ${T.divider}`,
            fontFamily: T.fontDisplay,
            fontSize: 14,
            lineHeight: 1.55,
            color: T.inkDim,
            fontStyle: "italic",
          }}
        >
          {person.closer}
        </div>
      </div>
    </div>
  );
}

function QuotesView({ stakeholders }) {
  const [filter, setFilter] = useState("all");
  const all = useMemo(() => {
    const arr = [];
    stakeholders.forEach((s) => {
      s.quotes.forEach((q) => arr.push({ ...q, name: s.name, who: s.id }));
    });
    return arr;
  }, [stakeholders]);
  const filtered = filter === "all" ? all : all.filter((q) => q.who === filter);

  return (
    <div>
      <SectionHead>Every quote that matters, with a timestamp</SectionHead>
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {["all", ...stakeholders.map((s) => s.id)].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 12px",
              background: filter === f ? T.orange : T.bgCard,
              color: filter === f ? T.bg : T.inkDim,
              border: `1px solid ${filter === f ? T.orange : T.divider}`,
              fontFamily: T.fontBody,
              fontSize: 12,
              letterSpacing: 0.4,
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {f === "all"
              ? "All"
              : stakeholders.find((s) => s.id === f).name.split(" ")[0]}
          </button>
        ))}
      </div>
      <div>
        {filtered.map((q, i) => (
          <Quote key={i} q={q} name={q.name} />
        ))}
      </div>
    </div>
  );
}

function TimelineView() {
  return (
    <div>
      <SectionHead>How Sentry became Sentry</SectionHead>
      <div style={{ position: "relative", paddingLeft: 20 }}>
        <div
          style={{
            position: "absolute",
            left: 4,
            top: 6,
            bottom: 6,
            width: 1,
            background: T.divider,
          }}
        />
        {TIMELINE.map((m, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              paddingBottom: 18,
              paddingLeft: 8,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -20,
                top: 6,
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: m.phase === "now" ? T.orange : T.bgCard,
                border: `2px solid ${m.phase === "now" ? T.orange : T.steel}`,
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontFamily: T.fontDisplay,
                  fontSize: 16,
                  fontWeight: 700,
                  color: T.ink,
                }}
              >
                {m.title}
              </div>
              <Pill tone={m.phase === "now" ? "orange" : "steel"}>
                {m.phase}
              </Pill>
            </div>
            <div
              style={{
                fontFamily: T.fontBody,
                fontSize: 14,
                color: T.inkDim,
                lineHeight: 1.55,
                marginBottom: 4,
              }}
            >
              {m.detail}
            </div>
            <div
              style={{
                fontFamily: T.fontMono,
                fontSize: 11,
                color: T.inkMuted,
              }}
            >
              {m.anchor}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoopsView({ stakeholders }) {
  const byOwner = useMemo(() => {
    const map = {};
    LOOPS.forEach((l) => {
      if (!map[l.owner]) map[l.owner] = [];
      map[l.owner].push(l);
    });
    return map;
  }, []);
  const owners = ["jim", "sibe", "kendall", "vince", "joey"];
  return (
    <div>
      <SectionHead>What's owed, and by whom</SectionHead>
      {owners.map((o) => {
        const items = byOwner[o];
        if (!items) return null;
        const person =
          stakeholders.find((s) => s.id === o) || { name: "Joey (you)" };
        return (
          <div key={o} style={{ marginBottom: 18 }}>
            <div
              style={{
                fontFamily: T.fontDisplay,
                fontSize: 15,
                fontWeight: 700,
                color: T.ink,
                marginBottom: 8,
                paddingBottom: 4,
                borderBottom: `1px solid ${T.divider}`,
              }}
            >
              {person.name}
            </div>
            {items.map((loop, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 12px",
                  background: T.bgCard,
                  border: `1px solid ${T.divider}`,
                  borderLeft: o === "joey" ? `3px solid ${T.orange}` : `3px solid ${T.steel}`,
                  marginBottom: 8,
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: 14,
                    color: T.ink,
                    marginBottom: 4,
                    fontWeight: 600,
                    overflowWrap: "break-word",
                  }}
                >
                  {loop.title}
                </div>
                <div
                  style={{
                    fontFamily: T.fontBody,
                    fontSize: 12,
                    color: T.inkDim,
                    marginBottom: 6,
                    lineHeight: 1.45,
                    overflowWrap: "break-word",
                  }}
                >
                  {loop.stakes}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    fontFamily: T.fontMono,
                    fontSize: 10,
                    color: T.inkMuted,
                    flexWrap: "wrap",
                    overflowWrap: "break-word",
                  }}
                >
                  <span>origin · {loop.origin}</span>
                  <span>state · {loop.age}</span>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// --------------------------------------------------------------------------
// PrepView — paste-ready brief for a fresh Claude conversation
// --------------------------------------------------------------------------
const MEETING_TYPES = [
  { id: "sync", label: "Check-in", tag: "low-stakes sync" },
  { id: "decision", label: "Decision", tag: "need a commit" },
  { id: "hard", label: "Hard", tag: "risk or bad news" },
];

function PrepView({ selected, setSelected, stakeholders }) {
  const prepTargets = stakeholders.filter((s) => !s.self);
  const [meetingType, setMeetingType] = useState("sync");
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();
  // if self is currently selected, snap to first non-self for Prep
  const effectiveSelected = prepTargets.find((s) => s.id === selected)
    ? selected
    : prepTargets[0].id;
  const person =
    prepTargets.find((s) => s.id === effectiveSelected) || prepTargets[0];
  const prompt = useMemo(
    () => buildPrepPrompt(person, meetingType, LOOPS),
    [person, meetingType]
  );

  const preview = {
    sync: {
      label: "Check-in",
      ask: "Draft three openers — plain-spoken, no consultant voice.",
    },
    decision: {
      label: "Decision",
      ask:
        "Pressure-test the angle. Draft the direct ask plus the fallback if they hedge.",
    },
    hard: {
      label: "Hard",
      ask:
        "Opener that keeps trust intact, plus the escape hatch if it lands wrong.",
    },
  }[meetingType];

  const doCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(prompt).then(
        () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        },
        () => {}
      );
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "220px 1fr",
        gap: 20,
      }}
    >
      {/* who */}
      <div>
        <SectionHead>Who</SectionHead>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {prepTargets.map((s) => {
            const active = s.id === effectiveSelected;
            const loopCount = LOOPS.filter((l) => l.owner === s.id).length;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  background: active ? T.bgElevated : T.bgCard,
                  border: `1px solid ${active ? T.orange : T.divider}`,
                  borderLeft: `3px solid ${active ? T.orange : T.divider}`,
                  cursor: "pointer",
                  fontFamily: T.fontDisplay,
                  fontSize: 14,
                  fontWeight: 700,
                  color: T.ink,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 8,
                }}
              >
                <span>{s.name.split(" ")[0]}</span>
                {loopCount > 0 && (
                  <span
                    style={{
                      fontFamily: T.fontMono,
                      fontSize: 10,
                      color: T.orangeSoft,
                      fontWeight: 400,
                      letterSpacing: 0.3,
                    }}
                  >
                    {loopCount} open
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* the prompt */}
      <div>
        <SectionHead>Meeting type</SectionHead>
        <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {MEETING_TYPES.map((m) => {
            const active = meetingType === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMeetingType(m.id)}
                style={{
                  padding: "8px 14px",
                  background: active ? T.orange : T.bgCard,
                  color: active ? T.bg : T.inkDim,
                  border: `1px solid ${active ? T.orange : T.divider}`,
                  fontFamily: T.fontBody,
                  fontSize: 12,
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  lineHeight: 1.2,
                }}
              >
                <span style={{ fontWeight: 700 }}>{m.label}</span>
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: 0.3,
                    textTransform: "none",
                    color: active ? T.bg : T.inkMuted,
                    marginTop: 2,
                  }}
                >
                  {m.tag}
                </span>
              </button>
            );
          })}
        </div>

        {/* instant preview of what changed — visible above the prompt */}
        <div
          style={{
            padding: "12px 16px",
            background: T.bgElevated,
            border: `1px solid ${T.orange}`,
            borderLeft: `3px solid ${T.orange}`,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontFamily: T.fontBody,
              fontSize: 10,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: T.orangeSoft,
              marginBottom: 6,
            }}
          >
            Closing ask · {preview.label}
          </div>
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 15,
              lineHeight: 1.5,
              color: T.ink,
            }}
          >
            {preview.ask}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <SectionHead style={{ margin: 0 }}>Paste into Claude</SectionHead>
          <button
            onClick={doCopy}
            style={{
              padding: "6px 14px",
              background: copied ? T.trustHot : T.orange,
              color: T.bg,
              border: "none",
              fontFamily: T.fontBody,
              fontSize: 12,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              cursor: "pointer",
              fontWeight: 700,
              transition: "background 0.2s",
            }}
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>

        <pre
          style={{
            background: T.bgCard,
            border: `1px solid ${T.divider}`,
            borderLeft: `3px solid ${T.orange}`,
            padding: "16px 18px",
            fontFamily: T.fontMono,
            fontSize: 12.5,
            lineHeight: 1.6,
            color: T.ink,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            margin: 0,
            overflowX: "auto",
            userSelect: "text",
          }}
        >
          {prompt}
        </pre>

        <div
          style={{
            marginTop: 12,
            fontFamily: T.fontBody,
            fontSize: 12,
            color: T.inkMuted,
            lineHeight: 1.5,
          }}
        >
          Paste into a Claude session already loaded with the Sentry project
          context. For Decision and Hard variants, replace the &lt;&lt;fill
          this in&gt;&gt; line with what you actually need before you send.
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// AssetsView — the full surface area of the project, one click at a time
// --------------------------------------------------------------------------
const STATE_TONES = {
  shipped: { bg: "rgba(63,177,133,0.15)", fg: T.trustHot, border: "rgba(63,177,133,0.35)", label: "shipped" },
  live: { bg: "rgba(210,105,30,0.14)", fg: T.orangeSoft, border: "rgba(210,105,30,0.35)", label: "live" },
  awaiting: { bg: "rgba(138,63,63,0.18)", fg: "#D48787", border: "rgba(138,63,63,0.4)", label: "awaiting" },
};

function AssetsView() {
  const [expanded, setExpanded] = useState(null);
  return (
    <div>
      <SectionHead>Everything you've built on this project so far</SectionHead>
      <div
        style={{
          fontFamily: T.fontBody,
          fontSize: 13,
          color: T.inkDim,
          marginBottom: 16,
          lineHeight: 1.5,
          maxWidth: 720,
        }}
      >
        Nine surfaces, one project. Tap any asset to see its TLDR, audience,
        and the note you'd want to remember when someone asks about it.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ASSETS.map((a) => {
          const isOpen = expanded === a.id;
          const st = STATE_TONES[a.state] || STATE_TONES.live;
          return (
            <div
              key={a.id}
              style={{
                background: T.bgCard,
                border: `1px solid ${isOpen ? T.orange : T.divider}`,
                borderLeft: `3px solid ${isOpen ? T.orange : st.fg}`,
                overflowWrap: "break-word",
                wordBreak: "break-word",
              }}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : a.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "12px 14px",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  color: T.ink,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: T.fontDisplay,
                      fontSize: 15,
                      fontWeight: 700,
                      color: T.ink,
                      marginBottom: 2,
                      overflowWrap: "break-word",
                    }}
                  >
                    {a.name}
                  </div>
                  <div
                    style={{
                      fontFamily: T.fontBody,
                      fontSize: 12,
                      color: T.inkMuted,
                    }}
                  >
                    {a.type}
                  </div>
                </div>
                <span
                  style={{
                    padding: "3px 9px",
                    fontSize: 10,
                    fontFamily: T.fontBody,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: st.fg,
                    background: st.bg,
                    border: `1px solid ${st.border}`,
                    borderRadius: 2,
                    whiteSpace: "nowrap",
                  }}
                >
                  {st.label}
                </span>
                <span
                  style={{
                    color: T.inkMuted,
                    fontFamily: T.fontMono,
                    fontSize: 14,
                    minWidth: 14,
                    textAlign: "center",
                  }}
                >
                  {isOpen ? "–" : "+"}
                </span>
              </button>
              {isOpen && (
                <div
                  style={{
                    padding: "4px 14px 16px 14px",
                    borderTop: `1px solid ${T.divider}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: T.fontDisplay,
                      fontSize: 15,
                      lineHeight: 1.55,
                      color: T.ink,
                      marginTop: 10,
                      marginBottom: 10,
                      overflowWrap: "break-word",
                    }}
                  >
                    {a.tldr}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr",
                      gap: "6px 12px",
                      fontFamily: T.fontBody,
                      fontSize: 12,
                      marginTop: 8,
                    }}
                  >
                    <span style={{ color: T.inkMuted, letterSpacing: 0.5, textTransform: "uppercase", fontSize: 10 }}>
                      Audience
                    </span>
                    <span style={{ color: T.inkDim, overflowWrap: "break-word" }}>{a.audience}</span>
                    <span style={{ color: T.inkMuted, letterSpacing: 0.5, textTransform: "uppercase", fontSize: 10 }}>
                      Remember
                    </span>
                    <span style={{ color: T.inkDim, overflowWrap: "break-word" }}>{a.note}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const VIEWS = ["Brief", "Prep", "Quotes", "Timeline", "Loops", "Assets"];

export default function KnowTheRoom() {
  const [view, setView] = useState("Brief");
  const [selected, setSelected] = useState("kendall");
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.ink,
        fontFamily: T.fontBody,
        padding: isMobile ? 14 : 28,
      }}
    >
      {/* header */}
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          paddingBottom: 14,
          borderBottom: `1px solid ${T.divider}`,
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: T.fontBody,
              fontSize: 10,
              letterSpacing: 2,
              color: T.inkMuted,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Sentry Intel · VDA × 3Nails
          </div>
          <h1
            style={{
              fontFamily: T.fontDisplay,
              fontSize: isMobile ? 26 : 32,
              fontWeight: 400,
              color: T.ink,
              margin: 0,
              letterSpacing: -0.5,
            }}
          >
            Know the Room
          </h1>
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontSize: isMobile ? 13 : 14,
              color: T.inkDim,
              fontStyle: "italic",
              marginTop: 4,
            }}
          >
            What each person cares about, said, and is still owing — in the 30 seconds before you dial in.
          </div>
          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 8,
              alignItems: "center",
              fontFamily: T.fontBody,
              fontSize: 11,
              color: T.inkMuted,
              flexWrap: "wrap",
            }}
          >
            <span style={{ letterSpacing: 0.5 }}>Trust dial · </span>
            <span style={{ color: T.trustCold }}>0 cold</span>
            <span>→</span>
            <span style={{ color: T.trustCool }}>warming</span>
            <span>→</span>
            <span style={{ color: T.trustWarm }}>hot</span>
            <span>→</span>
            <span style={{ color: T.trustHot }}>100 family</span>
          </div>
        </div>
        <div
          style={{
            fontFamily: T.fontMono,
            fontSize: 11,
            color: T.inkMuted,
            whiteSpace: "nowrap",
          }}
        >
          sourced · 2 transcripts · 776 lines
        </div>
      </header>

      {/* view switcher */}
      <nav
        style={{
          display: "flex",
          gap: isMobile ? 2 : 0,
          marginBottom: 24,
          borderBottom: isMobile ? "none" : `1px solid ${T.divider}`,
          background: isMobile ? T.bgCard : "transparent",
          border: isMobile ? `1px solid ${T.divider}` : "none",
          borderRadius: isMobile ? 6 : 0,
          padding: isMobile ? 3 : 0,
          width: "100%",
        }}
      >
        {VIEWS.map((v) => {
          const active = view === v;
          return (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                flex: isMobile ? "1 1 0" : "0 0 auto",
                padding: isMobile ? "8px 4px" : "10px 18px",
                background: isMobile
                  ? active
                    ? T.orange
                    : "transparent"
                  : "transparent",
                border: "none",
                borderBottom: isMobile
                  ? "none"
                  : `2px solid ${active ? T.orange : "transparent"}`,
                borderRadius: isMobile ? 4 : 0,
                color: isMobile
                  ? active
                    ? T.bg
                    : T.inkDim
                  : active
                  ? T.ink
                  : T.inkMuted,
                fontFamily: T.fontBody,
                fontSize: isMobile ? 11 : 13,
                fontWeight: isMobile && active ? 700 : 400,
                letterSpacing: isMobile ? 0.4 : 0.8,
                textTransform: "uppercase",
                cursor: "pointer",
                marginBottom: isMobile ? 0 : -1,
                minWidth: 0,
                textAlign: "center",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {v}
            </button>
          );
        })}
      </nav>

      {/* the view */}
      <main style={{ maxWidth: 1100, margin: "0 auto" }}>
        {view === "Brief" && (
          <BriefView
            selected={selected}
            setSelected={setSelected}
            stakeholders={STAKEHOLDERS}
          />
        )}
        {view === "Prep" && (
          <PrepView
            selected={selected}
            setSelected={setSelected}
            stakeholders={STAKEHOLDERS}
          />
        )}
        {view === "Quotes" && <QuotesView stakeholders={STAKEHOLDERS} />}
        {view === "Timeline" && <TimelineView />}
        {view === "Loops" && <LoopsView stakeholders={STAKEHOLDERS} />}
        {view === "Assets" && <AssetsView />}
      </main>

      {/* footer */}
      <footer
        style={{
          marginTop: 40,
          paddingTop: 16,
          borderTop: `1px solid ${T.divider}`,
          fontFamily: T.fontMono,
          fontSize: 11,
          color: T.inkMuted,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span>Joey Mentz · 3Nails · Sentry build</span>
        <span>Mock-only data · no backend · single-file JSX</span>
      </footer>
    </div>
  );
}
