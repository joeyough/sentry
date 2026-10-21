/**
 * Facts for Joey's cockpit.
 * Draft 0.15, wording commit 53026cbfd373.
 * Branch cursor/draft-0-15-dan-answers.
 * Checked against Draft 0.15 (b9e2bc3) on October 21, 2026.
 * Anything that check does not settle is marked TBD.
 */

export const SOURCE = {
  draft: "Draft 0.15",
  commit: "53026cbfd373",
  branch: "cursor/draft-0-15-dan-answers",
  note: "Checked against Draft 0.15 (b9e2bc3) on October 21, 2026.",
};

export const CONTRACT = {
  amount: "$20,000",
  terms: "100% at kickoff, Net 30",
  signed: "September 17, 2026",
};

export const PEOPLE = [
  { name: "Jon Capra", role: "CMMC owner and Affirming Official" },
  { name: "Frans", role: "User. Last name TBD" },
  { name: "Dan Hardison", role: "Client contact for accounts, access, and devices" },
  { name: "Chase", role: "User. Last name TBD" },
  { name: "Chris", role: "User. Last name TBD" },
  { name: "Joseph Wright", role: "Sixth user, named by Jon on October 19" },
];

export const BUILD_STEPS = [
  {
    id: "step-01",
    text: "Scott gives a thumbs up on the one-pager. Vince confirms what is already in AWS.",
  },
  {
    id: "step-02",
    text: "AWS account: the client holds root with hardware MFA. Retire the shared login.",
  },
  {
    id: "step-03",
    text: "Network: private subnets, no inbound, certificate remote access, the allow-list, traffic logs.",
  },
  {
    id: "step-04",
    text: "Directory, MFA, and the admin desktop. Vince confirms Active Directory before this is treated as settled.",
  },
  {
    id: "step-05",
    text: "Encryption keys, the file share with group permissions, and locked backups.",
  },
  {
    id: "step-06",
    text: "Logging, alerts, patching, vulnerability scan, and a signed weekly review.",
  },
  {
    id: "step-07",
    text: "Desktop image: hardened Windows, Defender, Office, and Bluebeam Core. Studio off. Print, USB, and clipboard off.",
  },
  {
    id: "step-08",
    text: "Six enclave accounts, only after screening and training. The six email accounts already exist.",
  },
  {
    id: "step-09",
    text: "Pilot one user. Prove the portal to the share and back. Prove print, USB, clipboard, Studio, and CUI on regular mail are blocked.",
  },
  {
    id: "step-10",
    text: "Move old CUI from PCs, the mailbox, Google Drive, and Dropbox into the share. Wipe the old copies and record it.",
  },
  {
    id: "step-11",
    text: "Turn on all six. Start weekly reviews and access logs.",
  },
  {
    id: "step-12",
    text: "Write the security plan from the build. Then the self-assessment, the score upload, and the yearly affirmation.",
  },
];

export const SYSTEMS = [
  {
    name: "AWS workspace",
    what: "A separate locked-down AWS space in commercial us-east-1, one secure desktop per user. EC2 or WorkSpaces is still open.",
    owner: "3Nails builds it. The client holds root and break-glass. Vince confirms the desktop type and what is already live.",
  },
  {
    name: "Six email accounts",
    what: "All six email accounts exist. Dan confirmed them on October 20, 2026. Enclave logins still follow the build sheet, after screening and training.",
    owner: "The client owns the addresses. 3Nails creates the enclave accounts.",
    people: true,
  },
  {
    name: "Bluebeam Core, 1 license",
    what: "Core plan, one license. License sign-in online is allowed. Studio is off. If Core will not run on the desktop, the fallback is the offline plan at $795 per license per year.",
    owner: "The client owns the license. Who holds the one license is TBD. Whether Core activates on a virtual desktop is something the build shows.",
  },
  {
    name: "Identity and MFA",
    what: "MFA at Windows logon for enclave accounts. The design uses Duo Federal. No SMS. The second factor is not stored on the office PC. Active Directory is for Vince to confirm.",
    owner: "3Nails configures it once Vince confirms the directory. Users enroll their own second factor. The client buys any hardware tokens.",
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
    what: "One share inside the enclave. Downloads land there. Uploads come from there. FSx is the recommendation carried forward from the earlier draft.",
    owner: "3Nails builds it. The client owns the files.",
  },
  {
    name: "Office PCs",
    what: "The design treats them as screens only, after a wipe and the tests. Whether they are only screens is something the build has to show.",
    owner: "The client owns the PCs. That result is TBD.",
  },
  {
    name: "Prime portal",
    what: "Procore for Government, named by Jon. The project is not confirmed. DoD SAFE file transfer is still to be confirmed. Use is in the desktop browser only.",
    owner: "The client uses the portals. 3Nails puts confirmed sites on the allow-list.",
  },
  {
    name: "Print and USB",
    what: "Both stay off for every user until a person is named. Clipboard, drive mapping, and file transfer stay off with them. There is no print room and no printer in this build.",
    owner: "3Nails keeps them off. The client names a person before either one is turned on. Nobody is named. TBD.",
  },
  {
    name: "Business mail",
    what: "Ordinary mail stays on commercial Microsoft 365. CUI-marked mail is blocked. A mailbox inside the enclave is not in v1.",
    owner: "The client owns the tenant. 3Nails sets the block and the purge.",
  },
  {
    name: "Admin desktop",
    what: "One hardened desktop inside the enclave, with no access to the CUI store. It is the only place interactive admin work happens. The real monthly price waits on Vince's calculator.",
    owner: "3Nails. The client does not use it for drawings.",
  },
];

export const VERIFY = [
  {
    id: "signoff",
    title: "Scott's thumbs up on the one-pager",
    evidence: "The one-pager is the page he reviews. The build waits on that thumbs up, and on Vince confirming what is in AWS.",
  },
  {
    id: "root",
    title: "AWS root is the client's, with hardware MFA",
    evidence: "Root holder named. Shared login retired. Vince is a named Identity Center user. Screenshot of the MFA device, not the secret.",
  },
  {
    id: "pilot-path",
    title: "Pilot user: portal to the share and back",
    evidence: "One user opens the confirmed portal in the desktop, saves a sanitized file to the share, and opens it again. Procore's project is not confirmed yet. Record the user and the date.",
  },
  {
    id: "print-off",
    title: "Print is blocked",
    evidence: "A print from the session fails. The desktop offers no redirected printer. Keep the permissions export. There is no print room in this build.",
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
    evidence: "Studio is off. Studio hosts are absent from the allow-list. A Studio sign-in attempt fails. Screenshot of the block.",
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
    id: "restore",
    title: "A restore test succeeds",
    evidence: "Date, who ran it, and what came back. The pass bar beyond a successful restore is TBD.",
  },
  {
    id: "weekly",
    title: "Weekly review is signed",
    evidence: "Reviewer and countersigner named. How many signed weeks come before readiness is TBD.",
  },
];

export const TALK = {
  where:
    "We are on Draft 0.15. Discovery and design is about 90 percent done. Dan's answers are in: Bluebeam Core, one license, Studio off, all six emails exist, and the date is as soon as possible. The print room and the printer are not in this build. Nothing in AWS counts as live until Vince confirms it. The build can start once Scott gives a thumbs up on the one-pager and Vince confirms what is in AWS.",
  next:
    "Scott's thumbs up on the one-pager. Vince confirms what is already in AWS, EC2 or WorkSpaces, Active Directory, and the monthly number from his calculator. Then we walk the build sheet, one step at a time. Dan's deadline is as soon as possible. There is no calendar date.",
  simple:
    "One secure desktop per person. The office PC is meant to be only a screen. The build will show whether that holds. Print and USB stay off until we name someone. There is no print room. Bluebeam is Core, one license, and Studio is off. Drawings move through Procore for Government once the project is confirmed.",
  cost:
    "The monthly number is pending Vince's AWS calculator run. The client has heard about $700 to $1,000. That is not a quote.",
  contract:
    "The contract is $20,000. It is 100 percent at kickoff, Net 30. It was signed September 17, 2026.",
};

export const TALK_FOR = {
  jon: "Jon owns the CMMC decision and signs as Affirming Official. He asked to keep this simple. He named Procore for Government. The project is not confirmed yet.",
  dan: "Dan owns accounts, access, and devices. He confirmed Core, one license, Studio off, the six emails, and as soon as possible. Still open: who holds the one Bluebeam license, and who needs print or USB.",
  scott: "Scott gives a thumbs up on the one-pager before the build starts. He still chooses the office security items: a locked room or the whole office, who may enter, keys, the landlord key, cameras or a door sensor, and who reports incidents and signs policies.",
};

export const OPEN_ITEMS = [
  {
    title: "Who needs print or USB",
    body: "Both stay off until a person is named. Nobody is named. There is no print room and no printer in this build.",
  },
  {
    title: "Who holds the one Bluebeam license",
    body: "Dan confirmed the Core plan, one license. License sign-in online is allowed. Studio is off. If Core will not run, the fallback is the offline plan at $795 per license per year. Who holds the license is TBD.",
  },
  {
    title: "Scott's office security choices",
    body: "Locked room or the whole office. Who may enter. Keys. Whether the landlord has a key. Cameras on the door and the network cabinet, or a door sensor. Who reports incidents, and who signs policies. All TBD.",
  },
  {
    title: "EC2 or WorkSpaces, and Active Directory",
    body: "Vince confirms both. The desktop type is still open. Whether Active Directory is in is still open. TBD until he confirms.",
  },
  {
    title: "DoD SAFE file transfer",
    body: "Still to be confirmed. TBD.",
  },
  {
    title: "Procore for Government",
    body: "Jon named it. The project is not confirmed. TBD.",
  },
  {
    title: "Things only the build shows",
    body: "Portal URLs. Whether Core activates on a virtual desktop. Real AWS prices. Whether the office PCs are only screens. TBD until the build shows them.",
  },
  {
    title: "Vince confirms the AWS state and the monthly number",
    body: "What is live in AWS is not counted until Vince confirms it. The monthly number is pending his AWS calculator run. The client has heard about $700 to $1,000. That is not a quote.",
  },
];

export const PHASES = [
  {
    id: "discovery",
    name: "Discovery and design",
    weight: 30,
    pct: 90,
    note: "Draft 0.15 puts this at about 90 percent. That is 27 of the 30 points.",
  },
  {
    id: "build",
    name: "Build",
    weight: 35,
    pct: 0,
    note: "Set to 0 until Vince confirms what is live in AWS. Each 1 of the 12 build-sheet steps that is live adds about 3 points.",
  },
  {
    id: "testing",
    name: "Testing",
    weight: 10,
    pct: 0,
    note: "Not started. It stays at 0 while nothing is confirmed live.",
  },
  {
    id: "ssp",
    name: "SSP",
    weight: 10,
    pct: 0,
    note: "The security plan is written from the build. It is not written.",
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
