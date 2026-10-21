/**
 * Facts for Joey's cockpit.
 * Draft 0.14 export, commit 59adc0d2e405, October 19, 2026.
 * Plus Dan Hardison's email on October 20, 2026.
 * Anything the sources do not settle is marked TBD.
 */

export const SOURCE = {
  draft: "Draft 0.14",
  date: "October 19, 2026",
  commit: "59adc0d2e405",
  later: "Dan's email, October 20, 2026",
};

export const PEOPLE = [
  { name: "Jon Capra", email: "jcapra@ksg-us.com", role: "CMMC owner and Affirming Official" },
  { name: "Frans", email: "frans@ksg-us.com", role: "User. Last name TBD" },
  { name: "Dan Hardison", email: "dan@ksg-us.com", role: "Client contact for accounts, access, and devices" },
  { name: "Chase", email: "chase@ksg-us.com", role: "User. Last name TBD" },
  { name: "Chris", email: "cbateman@ksg-us.com", role: "User. Last name TBD" },
  { name: "Joseph Wright", email: "jwright@ksg-us.com", role: "Sixth user, named by Jon on October 19" },
];

export const DAILY = [
  {
    id: "gate",
    text: "Read the gate. If Scott's written sign-off is not on file, leave the AWS sandbox alone.",
  },
  {
    id: "vince",
    text: "Check Vince's open calls: the first decisions, and the AWS Pricing Calculator. Do not send a monthly number.",
  },
  {
    id: "facts",
    text: "Write down any new fact from Jon or Dan. Leave blanks as TBD. Do not guess.",
  },
  {
    id: "off",
    text: "Keep print, USB, clipboard, drive mapping, and file transfer off for every user.",
  },
  {
    id: "note",
    text: "One line for yourself: what moved today, and what is still waiting.",
  },
];

export const BUILD_ORDER = [
  "Scott's written sign-off. Lock the desktop type, the directory, and the print room.",
  "AWS account: the client holds root with hardware MFA. Retire the shared login.",
  "Network: private subnets, no inbound, certificate remote access, the allow-list, traffic logs.",
  "Directory, MFA, and the admin desktop.",
  "Encryption keys, the file share with group permissions, and locked backups.",
  "Logging, alerts, patching, vulnerability scan, and a signed weekly review.",
  "Desktop image: hardened Windows, Defender, Office, and Bluebeam once the license is confirmed. Studio, print, USB, and clipboard off.",
  "Six accounts, only after screening and training, and only once the emails are in. The emails arrived October 20.",
  "Pilot one user. Prove the portal to the share and back. Prove print, USB, clipboard, Studio, and CUI on regular mail are blocked.",
  "Move old CUI from PCs, the mailbox, Google Drive, and Dropbox into the share. Wipe the old copies and record it.",
  "Turn on all six. Start weekly reviews and access logs.",
  "Write the security plan from the build. Then the self-assessment, the score upload, and the yearly affirmation.",
];

export const SYSTEMS = [
  {
    name: "AWS workspace",
    what: "A separate locked-down AWS space in commercial us-east-1, one secure desktop per user. The October 16 note leaned toward WorkSpaces. The long doc still prices EC2. The pick is open.",
    owner: "3Nails builds it. The client holds root and break-glass.",
  },
  {
    name: "Six email accounts",
    what: "The six people who get a desktop. Enclave accounts are not created until screening and training are on file.",
    owner: "The client owns the addresses. 3Nails creates the enclave accounts.",
    people: true,
  },
  {
    name: "Bluebeam Core, 1 license",
    what: "Dan said Core, one license, on October 20. It runs inside the secure desktop. Studio stays off. Jon said the team does not use Studio. Dan has not restated that in his own words.",
    owner: "The client owns the license. 3Nails installs it after Bluebeam confirms it may run on a virtual desktop. That confirmation is TBD.",
  },
  {
    name: "Identity and MFA",
    what: "A small directory for enclave accounts only, plus Duo Federal at Windows logon. No SMS. Admins use Identity Center and hardware keys. The directory decision (V1) is still open.",
    owner: "3Nails configures it. Users enroll their own second factor. The client buys any hardware tokens.",
  },
  {
    name: "Logging",
    what: "CloudTrail, CloudWatch, GuardDuty, Security Hub, Config, alarms to named people, and a locked archive. No SIEM in v1.",
    owner: "3Nails runs it. The client countersigns the weekly review. Who reviews Defender alerts is TBD.",
  },
  {
    name: "Backups",
    what: "AWS Backup with Vault Lock, in us-east-1 only, under one retention rule. How long past the NIST minimum is TBD.",
    owner: "3Nails. The client agrees the retention rule before the lock goes to compliance mode.",
  },
  {
    name: "CUI file share",
    what: "One share inside the enclave. Downloads land there. Uploads come from there. FSx is the recommendation. Kiteworks is only if Procore and eCMS do not cover the exchange.",
    owner: "3Nails builds it. The client owns the files.",
  },
  {
    name: "Office PCs",
    what: "Screens only, after they are wiped and the tests pass. They are not a place to store drawings.",
    owner: "The client owns the PCs. Scott rules whether the tests keep them out of scope (S1). That ruling is TBD.",
  },
  {
    name: "Prime portal",
    what: "Procore for Government, in the desktop browser only. The contract also names eCMS and DoD SAFE. Login method for Procore is TBD.",
    owner: "The client uses the portals. 3Nails puts them on the allow-list.",
  },
  {
    name: "Print and USB",
    what: "Off for every user until a person and a reason are named in writing. The locked print room is still in the design. Printer, lock, camera, and room are TBD.",
    owner: "The client owns the room and the purchases. 3Nails builds the tunnel only if Vince keeps the print island.",
  },
  {
    name: "Business mail",
    what: "Ordinary mail stays on commercial Microsoft 365. CUI-marked mail is blocked. A mailbox inside the enclave is not in v1.",
    owner: "The client owns the tenant. 3Nails sets the block and the purge.",
  },
  {
    name: "Admin desktop",
    what: "One hardened desktop inside the enclave, with no access to the CUI store. It is the only place interactive admin work happens. About $119 a month in the draft. Vince has not restored it yet.",
    owner: "3Nails. The client does not use it for drawings.",
  },
];

export const VERIFY = [
  {
    id: "signoff",
    title: "Scott's written sign-off",
    evidence: "A signed copy of the whole design, not only part of it. Phase 1 does not start without this.",
  },
  {
    id: "root",
    title: "AWS root is the client's, with hardware MFA",
    evidence: "Root holder named. Shared login retired. Vince is a named Identity Center user. Screenshot of the MFA device, not the secret.",
  },
  {
    id: "pilot-path",
    title: "Pilot user: portal to the share and back",
    evidence: "One user opens Procore in the desktop, saves a sanitized file to the share, and opens it again. Record the user and the date.",
  },
  {
    id: "print-off",
    title: "Print is blocked",
    evidence: "A print from the session fails. The desktop offers no redirected printer. Keep the permissions export.",
  },
  {
    id: "usb-off",
    title: "USB is blocked",
    evidence: "A USB device on the office PC does not appear in the secure desktop. Note the test device.",
  },
  {
    id: "clipboard-off",
    title: "Clipboard, drive mapping, and file transfer are blocked",
    evidence: "Copy, paste, and a file drag each fail. Same permissions export as the print test.",
  },
  {
    id: "studio-off",
    title: "Bluebeam Studio does not connect",
    evidence: "Studio hosts are absent from the allow-list. A Studio sign-in attempt fails. Screenshot of the block.",
  },
  {
    id: "mail-block",
    title: "CUI does not leave on regular mail",
    evidence: "A marked test message is blocked, and the auto-reply points at the approved path. Save the message headers.",
  },
  {
    id: "no-cert",
    title: "A device with no certificate is refused",
    evidence: "Client VPN refuses a device with no certificate, and a device whose certificate was revoked. The connection log shows both refusals.",
  },
  {
    id: "screenshot",
    title: "Screenshots of the desktop come out black",
    evidence: "From a real office PC, on the native client only. The browser client is removed and a connection with it fails.",
  },
  {
    id: "duo",
    title: "Duo prompts at Windows logon",
    evidence: "The second factor is a phone or a hardware token, not something stored on the office PC. Photo of the prompt, not the code.",
  },
  {
    id: "printer-wall",
    title: "An office PC cannot reach the printer",
    evidence: "Only if the print room is built. Until then this stays unchecked. The in-room firewall denies the office LAN.",
  },
  {
    id: "restore",
    title: "A restore test succeeds",
    evidence: "Date, who ran it, and what came back. The draft does not name the pass bar beyond a successful restore.",
  },
  {
    id: "weekly",
    title: "Weekly review is signed",
    evidence: "Reviewer and countersigner named. The draft proposes 12 signed weeks before readiness. Scott has not ruled on that count.",
  },
];

export const TALK = {
  where: "We are still in the plan. Draft 0.14 maps every Level 2 requirement to an owner and a method. Jon's answers are in. Dan sent the six emails, Bluebeam Core with one license, and said as soon as possible. Nothing is built. Zero of 110 practices are marked designed. Scott has not signed, so the build has not started.",
  next: "Scott signs the design in writing. Vince runs the AWS Pricing Calculator. Then we build the secure desktops, test one person, and only then turn on all six. Readiness in the draft is late January to late February 2027 if the weekly reviews count. Two months was the fast end of the build alone, not the assessment.",
  simple: "One secure desktop per person. The office PC is only a screen. Print and USB stay off until we name someone. Bluebeam Studio stays off. Drawings move through Procore. That is the whole first version.",
  cost: "The monthly number is not ready. It waits on Vince's AWS Pricing Calculator. Until that run, the figure to use is about $700 to $1,000 a month. We will not quote a different number before that run.",
  costQuiet: "Do not read this out. Draft 0.14's known lines add up to about $1,056 a month at the floor, about $1,290 with the recommended defaults, and about $1,327 with the print tunnel, before Office. Unknown lines are not zero. The $700 to $1,000 line is the one to say until Vince's calculator replaces it.",
};

export const TALK_FOR = {
  jon: "Jon owns the CMMC decision and signs as Affirming Official. He asked to keep this simple. Lead with the simple path, then the date.",
  dan: "Dan owns accounts, access, and devices. He already sent the six emails and the Bluebeam plan. The next ask, when you need it, is the Procore login method and the office facts. Do not ask him to build.",
  scott: "Scott signs the whole design before any build. Two rulings still decide pass or fail: whether the office PCs stay out of scope after the tests, and whether unsalted Windows password hashes meet the rule.",
};

export const OPEN_ITEMS = [
  {
    title: "Print and USB stay off until named",
    body: "Jon asked to keep it simple. The plan starts with print, USB, clipboard, drive mapping, and file transfer off for everyone. Turn one on only for a named person and a named device, with written approval. Nobody is named yet.",
  },
  {
    title: "Office security decisions",
    body: "From Scott's physical guide, still open: one locked CUI room or the whole office. Who may enter without an escort. A facilities owner and a backup for keys, the visitor log, and escorts. The lock, and whether the landlord has a key. Cameras on the door, the printer, and the network cabinet: no audio, no cloud, 90 days. Records are meant to start about two months before the self-assessment. Who reports incidents is TBD.",
  },
  {
    title: "Scott's sign-off",
    body: "Scott reviews the whole document and signs in writing before any build. Phase 1 does not start until that page is on file. It is not on file.",
  },
  {
    title: "The monthly number",
    body: "No monthly number goes to the client before Vince's AWS Pricing Calculator run. That run has not happened. The us-east-1 print-tunnel rate is still unknown.",
  },
  {
    title: "Award-copy clauses",
    body: "Level 2 (Self) is set. The award copy and Exhibit G are not in hand. Article 3's greater-duty rule still applies. The DFARS clause numbers from the October 9 reading stay unverified until that copy is checked.",
  },
  {
    title: "Things we only learn by building",
    body: "Whether directory sign-in works for the VPN. Whether AWS confirms FIPS in writing for the VPN in us-east-1. Whether Bluebeam's Core license may run on a virtual desktop. How big the logs are. Each of these is TBD until a test. The draft says not to design past them.",
  },
  {
    title: "Hard date",
    body: "Dan said as soon as possible. That is not a calendar date. A prime review date or an SPRS date is TBD.",
  },
];

export const PHASES = [
  {
    id: "discovery",
    name: "Discovery and design",
    weight: 30,
    pct: 70,
    note: "Joey's October 19 note: about 70% to build-ready. Dan's answers landed the next day. Scott has not signed, and zero practices are marked designed, so this is not 100.",
  },
  {
    id: "build",
    name: "Build",
    weight: 35,
    pct: 0,
    note: "The sandbox has not started. The gate is Scott's signature.",
  },
  {
    id: "testing",
    name: "Testing",
    weight: 10,
    pct: 0,
    note: "The pilot has not started. Plan on 1 to 2 weeks once the build is up.",
  },
  {
    id: "ssp",
    name: "SSP",
    weight: 10,
    pct: 0,
    note: "The security plan is written from the build, not before it. It is not written.",
  },
  {
    id: "assessment",
    name: "Assessment",
    weight: 15,
    pct: 0,
    note: "Self-assessment, score upload, and the yearly affirmation come after the plan. Not started.",
  },
];

export function overallPct(phases) {
  const total = phases.reduce((sum, p) => sum + (p.weight * p.pct) / 100, 0);
  return Math.round(total);
}
