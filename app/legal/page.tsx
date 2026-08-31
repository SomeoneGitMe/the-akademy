"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { X, Loader2, Upload, Maximize2, Plus, Pencil } from "lucide-react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import { supabaseBrowser } from "../utils/supabaseBrowser";

interface PublishedArticle {
  title: string; source: string; thumbnail_url: string;
  created_at: string; tags: string[]; contentSnippet?: string;
}

interface LegalSection { label: string; text: string; }

interface DocketEntry {
  id: string;
  date: string;
  docType: string;
  caseName: string;
  court: string;
  division: string;
  caseNo: string;
  filed: string;
  status: string;
  defendants: string[];
  pills: string[];
  charges: string[];
  facts: { label: string; value: string }[];
  pdf_url: string | null;
  decode: { label: string; text: string }[];
}

interface VerdictRow {
  dbId?: string;
  name: string;
  charge: string;
  max: string;
  received: string;
  date: string;
  status: string;
}

/* ============ THE WATCHLIST ============ */

const PHASES = ["CHARGED", "ARRAIGNED", "PRE-TRIAL", "TRIAL", "VERDICT", "SENTENCING", "APPEAL"];

const WATCHLIST = [
  { defendant: "Combs", caseNo: "1:24-CR-00571", court: "S.D.N.Y.", charges: "Transportation for prostitution ×2 · acquitted: RICO, trafficking", custody: "DETAINED", custodyClass: "red", phase: 4, next: "SENTENCING TBD", exposure: "20 YRS MAX" },
  { defendant: "Love & Chan", caseNo: "3:26-MJ-00227", court: "D. ORE.", charges: "Wire fraud · romance-investment scheme · 26 victims · $1.3M", custody: "DETAINED", custodyClass: "red", phase: 0, next: "DETENTION HEARING", exposure: "20 YRS MAX" },
  { defendant: "Banks (Lil Durk)", caseNo: "2:25-CR-00583", court: "C.D. CAL.", charges: "Murder-for-hire conspiracy · use of interstate facilities", custody: "DETAINED", custodyClass: "red", phase: 2, next: "PRE-TRIAL 10.03", exposure: "LIFE MAX" },
  { defendant: "Jackson (YG)", caseNo: "2:26-CR-00311", court: "C.D. CAL.", charges: "Charges pending · pre-trial proceedings", custody: "OUT ON BAIL", custodyClass: "green", phase: 2, next: "STATUS 09.18", exposure: "TBD" },
  { defendant: "Williams (Pooh Shiesty)", caseNo: "NEW FEDERAL CASE", court: "FEDERAL", charges: "Kidnapping & robbery conspiracy · rearrested Jan 2026", custody: "DETAINED", custodyClass: "red", phase: 0, next: "DETENTION HEARING", exposure: "LIFE MAX" },
  { defendant: "Conway (Yella Beezy)", caseNo: "CAPITAL MURDER", court: "TEXAS", charges: "Capital murder · death-penalty eligible · house arrest", custody: "HOUSE ARREST", custodyClass: "mute", phase: 2, next: "TRIAL DATE TBD", exposure: "DEATH / LWOP" },
  { defendant: "Peterson (Tory Lanez)", caseNo: "UNDER APPEAL", court: "CALIFORNIA", charges: "Assault w/ semiauto firearm ×3 · conviction under appeal", custody: "APPEAL", custodyClass: "mute", phase: 6, next: "APPELLATE BRIEFING", exposure: "10 YRS SERVING" },
];

/* ============ THE LEDGER SEED ============ */

const SEED_VERDICTS: VerdictRow[] = [
  { name: "Sean Combs", charge: "Transportation for Prostitution ×2 · acquitted: RICO, trafficking", max: "20 YRS", received: "PENDING", date: "07.2025", status: "PENDING" },
  { name: "Tory Lanez", charge: "Assault w/ Semiauto Firearm ×3 · appeal pending", max: "22 YRS 8 MO", received: "10 YRS", date: "08.2023", status: "DEPORTED" },
  { name: "Young Thug", charge: "YSL RICO · Guilty Plea (GA)", max: "20 YRS", received: "TIME SERVED", date: "12.2024", status: "PROBATION" },
  { name: "Pooh Shiesty", charge: "Firearms Conspiracy · released Oct 2025, rearrested Jan 2026", max: "20 YRS", received: "5 YRS 3 MO", date: "04.2022", status: "RELEASED" },
  { name: "Tay-K", charge: "Murder ×2 (TX) · 55 yrs (2019) + 80 yrs (2025), concurrent", max: "LIFE", received: "135 YRS", date: "2025", status: "SERVING" },
  { name: "Yella Beezy", charge: "Capital Murder · death-penalty eligible · awaiting trial", max: "DEATH / LWOP", received: "PENDING", date: "—", status: "HOUSE ARREST" },
  { name: "Mystikal", charge: "Third-Degree Rape · plea down from life (LA)", max: "LIFE", received: "20 YRS", date: "06.2026", status: "SERVING" },
];

const DECODE_CHIPS = [
  "The RICO Act",
  "Wire Fraud · 18 U.S.C. § 1343",
  "Plea Deal",
  "924(c) Firearm Stacking",
  "Grand Jury vs. Complaint",
  "Superseding Indictment",
];

/* ============ THE DOCKET (9 filings) ============ */

const DOCKET_ENTRIES: DocketEntry[] = [
  {
    id: "us-v-love-chan",
    date: "08.14",
    docType: "Criminal Complaint",
    caseName: "United States v. Love & Chan",
    court: "U.S. District Court · D. Oregon",
    division: "PORTLAND DIVISION",
    caseNo: "3:26-MJ-00227",
    filed: "AUG 14, 2026",
    status: "SEALED",
    defendants: ["Daejon Labrayae Love", "Taylor Jamie Chan"],
    pills: ["WIRE FRAUD · 18 U.S.C. § 1343", "26 VICTIMS · $1.3M", "INVESTMENT FRAUD"],
    charges: ["WIRE FRAUD — 18 U.S.C. § 1343"],
    facts: [
      { label: "Alleged Loss", value: "$1.3 MILLION" },
      { label: "Victims Identified", value: "26 WOMEN" },
      { label: "Scheme Window", value: "FEB 2022 — PRESENT" },
      { label: "Primary Channel", value: "DATING APPS" },
      { label: "The Play", value: "BOGUS INVESTMENTS" },
      { label: "Chan's Role", value: "FAKE FINANCIAL ADVISOR" },
    ],
    pdf_url: null,
    decode: [
      { label: "THE SCHEME", text: "Per the FBI's sworn complaint, Love and Chan ran an investment fraud since at least February 2022: Love connected with women on dating apps under a fake NFL-player persona, then handed them off to Chan — posing as his financial advisor — who talked each victim into 'investments' that went straight into accounts they controlled. Roughly 26 women lost approximately $1.3 million. The romance was never the product; it was the delivery system." },
      { label: "THE CHARGES", text: "Wire fraud, 18 U.S.C. § 1343 — the federal default for any fraud that touches a phone or the internet. Prosecutors only need a scheme to defraud plus one wire transmission in furtherance. Every transfer can be its own count, and every count carries up to 20 years. In a 26-victim case, the counts stack fast." },
      { label: "WHAT THIS DOCUMENT IS", text: "A sealed criminal complaint — not an indictment. An FBI agent swears out probable cause before a magistrate judge, arrest warrants issue, and the clock starts on a grand jury indictment. The seal means the government didn't want the targets to see it coming." },
      { label: "WHAT'S NEXT", text: "The complaint almost always converts to a grand jury indictment within weeks. From there: detention hearings, discovery, and — given a paper trail of wires, accounts, and app messages — a case built to end in pleas. Watch for a superseding indictment adding identity-theft and money-laundering counts." },
    ],
  },
  {
    id: "us-v-combs-verdict",
    date: "08.02",
    docType: "Superseding Indictment",
    caseName: "United States v. Combs",
    court: "U.S. District Court · S.D.N.Y.",
    division: "MANHATTAN",
    caseNo: "1:24-CR-00571",
    filed: "AUG 2, 2026",
    status: "PUBLIC",
    defendants: ["Sean Combs"],
    pills: ["RACKETEERING · 18 U.S.C. § 1962", "SEX TRAFFICKING", "TRANSPORTATION · § 2421"],
    charges: ["RACKETEERING CONSPIRACY — 18 U.S.C. § 1962", "SEX TRAFFICKING — 18 U.S.C. § 1591", "TRANSPORTATION — 18 U.S.C. § 2421"],
    facts: [
      { label: "Phase", value: "VERDICT IN" },
      { label: "Convicted", value: "2 COUNTS · § 2421" },
      { label: "Acquitted", value: "RICO · TRAFFICKING" },
      { label: "Custody", value: "DETAINED" },
      { label: "Next", value: "SENTENCING TBD" },
    ],
    pdf_url: null,
    decode: [
      { label: "WHAT THIS IS", text: "A superseding indictment swaps the original charges for an expanded set. Prosecutors file one when discovery turns up more than the first indictment covered — the defense effectively restarts motion practice against the new version. When you see 'superseding,' read: the feds found more." },
      { label: "THE OUTCOME", text: "The jury convicted on two transportation-for-prostitution counts under § 2421 and acquitted on the RICO and sex-trafficking counts. The split verdict means the jury bought the travel-and-prostitution conduct but rejected the broader 'criminal enterprise' framing — a significant government loss on its centerpiece theory." },
      { label: "THE EXPOSURE", text: "Each § 2421 count carries up to 10 years. The sentencing math now runs through the federal guidelines — and the acquitted conduct fight begins: the government will argue for enhancements tied to allegations the jury rejected, and the defense will fight to keep them out of the calculation." },
      { label: "WHAT'S NEXT", text: "Sentencing briefing, then the hearing. Expect appeals from both sides — the government on evidentiary rulings that limited its case, the defense on the acquitted-conduct sentencing enhancements. This file stays open for years." },
    ],
  },
  {
    id: "us-v-banks-motion",
    date: "07.21",
    docType: "Motion in Limine",
    caseName: "United States v. Banks (Lil Durk)",
    court: "U.S. District Court · C.D. CAL.",
    division: "LOS ANGELES",
    caseNo: "2:25-CR-00583",
    filed: "JUL 21, 2026",
    status: "PUBLIC",
    defendants: ["Durk Banks"],
    pills: ["MURDER-FOR-HIRE · 18 U.S.C. § 1958", "PRE-TRIAL", "EVIDENCE FIGHT"],
    charges: ["MURDER-FOR-HIRE CONSPIRACY — 18 U.S.C. § 1958"],
    facts: [
      { label: "Phase", value: "PRE-TRIAL" },
      { label: "Custody", value: "DETAINED" },
      { label: "Next Date", value: "PRE-TRIAL 10.03" },
      { label: "Target", value: "KEY GOVERNMENT EVIDENCE" },
    ],
    pdf_url: null,
    decode: [
      { label: "WHAT THIS IS", text: "A pre-trial motion asking the judge to rule key evidence inadmissible before the jury ever hears it. Win one of these and the government's strongest exhibit never enters the room. Quietly, these motions decide more trials than juries ever do." },
      { label: "THE STRATEGY", text: "Expect the defense to target the emotional spine of the government's case: song lyrics, social media posts, and any gang-association framing. The argument is Rule 403 — the prejudicial sting of that material far outweighs what it actually proves. Separate fights target co-defendant statements and cooperating-witness evidence." },
      { label: "WHY IT MATTERS", text: "Murder-for-hire conspiracy under § 1958 requires proving intent and agreement. The government leans on context — associates, communications, money movement — to build that arc. Every piece of context the defense carves out weakens the arc. If the lyrics and gang narrative come in, the jury hears a story; if they stay out, the jury hears a wire-transfer case." },
      { label: "WHAT'S NEXT", text: "The judge rules from the bench or in writing before jury selection. Watch the government's opposition filing — what they fight hardest to keep in tells you exactly what their trial theory is." },
    ],
  },
  {
    id: "us-v-jackson-status",
    date: "07.09",
    docType: "Status Conference",
    caseName: "United States v. Jackson (YG)",
    court: "U.S. District Court · C.D. CAL.",
    division: "LOS ANGELES",
    caseNo: "2:26-CR-00311",
    filed: "JUL 9, 2026",
    status: "PUBLIC",
    defendants: ["Keenon Jackson"],
    pills: ["CHARGES PENDING", "OUT ON BAIL", "PRE-TRIAL"],
    charges: ["PENDING"],
    facts: [
      { label: "Phase", value: "PRE-TRIAL" },
      { label: "Custody", value: "OUT ON BAIL" },
      { label: "Next Date", value: "STATUS 09.18" },
      { label: "Posture", value: "DISCOVERY OPEN" },
    ],
    pdf_url: null,
    decode: [
      { label: "WHAT THIS IS", text: "A joint status report: both sides tell the judge where the case actually stands — discovery progress, plea discussions, scheduling. Nothing dramatic gets decided. It's the court asking everybody the same question: why isn't this case finished yet?" },
      { label: "WHERE THINGS STAND", text: "The defendant is out on bail while charges work through pre-trial. Discovery is open — the government is handing over its evidence file — and the absence of a trial date usually means both sides are still feeling out whether this resolves with a plea or a fight." },
      { label: "HOW TO READ IT", text: "Status conferences are the docket's tell. Frequent continuances mean negotiation. A suddenly accelerated schedule means someone rejected a deal. A quiet case with regular status dates is almost always a case moving toward resolution without a jury." },
      { label: "WHAT'S NEXT", text: "The September date. If the parties announce a change of plea hearing there, this file closes the way most federal files do — quietly. If they announce trial prep, the calendar starts filling with motions." },
    ],
  },
  {
    id: "people-v-peterson-appeal",
    date: "06.30",
    docType: "Notice of Appeal",
    caseName: "People v. Peterson (Tory Lanez)",
    court: "California Superior Court · L.A. County",
    division: "APPELLATE DIVISION",
    caseNo: "SA098204",
    filed: "JUN 30, 2026",
    status: "PUBLIC",
    defendants: ["Daystar Peterson"],
    pills: ["ASSAULT · PC § 245(b)(6) ×3", "APPEAL PENDING", "10 YRS SERVING"],
    charges: ["ASSAULT WITH SEMIAUTO FIREARM — PENAL CODE § 245(b)(6)"],
    facts: [
      { label: "Phase", value: "APPEAL" },
      { label: "Sentence", value: "10 YEARS" },
      { label: "Convicted", value: "DEC 2022 · 3 COUNTS" },
      { label: "Custody", value: "DEPORTATION TRACK" },
      { label: "Grounds", value: "NEW EVIDENCE · RULINGS" },
    ],
    pdf_url: null,
    decode: [
      { label: "WHAT THIS IS", text: "A notice of appeal preserves the right to challenge the conviction and starts the appellate clock. It doesn't argue the case — it announces the intent to. Briefing follows over months, and the appellate court reviews the record for legal error, not to re-weigh the evidence." },
      { label: "THE GROUNDS", text: "The appeal targets evidentiary rulings at trial and advances new-evidence claims — including statements from the key witness that the defense says undermine the conviction. New evidence discovered after trial is the strongest card an appellant holds, but the bar for a new trial is high." },
      { label: "WHY IT MATTERS", text: "Direct appeals rarely overturn convictions outright, but a new-trial grant on evidentiary grounds would restart everything. Meanwhile the sentence runs — and the immigration consequence (deportation to Canada after custody) proceeds on its own separate track, unaffected by the appeal." },
      { label: "WHAT'S NEXT", text: "Appellate briefing, then oral argument, then a decision — a process measured in years. Any new-trial hearing would be its own event in the trial court. The conviction stands unless and until the appellate court says otherwise." },
    ],
  },
  {
    id: "us-v-williams-complaint",
    date: "01.12",
    docType: "Criminal Complaint",
    caseName: "United States v. Williams (Pooh Shiesty)",
    court: "U.S. District Court",
    division: "NEW FILING",
    caseNo: "NEW FEDERAL CASE",
    filed: "JAN 12, 2026",
    status: "SEALED",
    defendants: ["Lontrell Williams"],
    pills: ["KIDNAPPING CONSPIRACY · 18 U.S.C. § 1201", "ROBBERY CONSPIRACY", "REARRESTED"],
    charges: ["FEDERAL KIDNAPPING CONSPIRACY — 18 U.S.C. § 1201"],
    facts: [
      { label: "Phase", value: "CHARGED" },
      { label: "Custody", value: "DETAINED" },
      { label: "Prior Case", value: "63 MO · COMPLETE" },
      { label: "Released", value: "OCT 2025 · EARLY" },
      { label: "Rearrested", value: "JAN 2026" },
    ],
    pdf_url: null,
    decode: [
      { label: "WHAT THIS IS", text: "A new federal criminal complaint filed months after release — a fresh case, not a violation of supervised release. The 63 months served on the Florida firearms case are complete and carry no credit here. This is a clean-slate prosecution with its own exposure math." },
      { label: "THE CHARGES", text: "Federal kidnapping conspiracy under § 1201 is a life-exposure count. Add robbery conspiracy and the counts stack. If the allegations involve targeting named victims and crossing state lines, every element that makes the charge federal also makes it heavy." },
      { label: "THE SITUATION", text: "Released in October 2025 on good-time credit after serving the 2022 sentence, then rearrested in January 2026 on these allegations. The optics of a rearrest that fast are brutal at a detention hearing — the government will argue no condition of release can reasonably assure appearance or safety." },
      { label: "WHAT'S NEXT", text: "Detention hearing first — expect the government to seek pre-trial detention given the new-case-while-released posture. Then a grand jury indictment, then the standard federal machinery. This one is early; the complaint is the opening move." },
    ],
  },
  {
    id: "tx-v-mcintosh-judgment",
    date: "05.18",
    docType: "Judgment & Sentence",
    caseName: "Texas v. McIntosh (Tay-K)",
    court: "Texas District Court",
    division: "TARRANT COUNTY",
    caseNo: "2025-CR-JS",
    filed: "MAY 18, 2025",
    status: "PUBLIC",
    defendants: ["Taymor McIntosh"],
    pills: ["MURDER ×2 · TX", "135 YRS TOTAL", "CONCURRENT"],
    charges: ["MURDER — TEXAS PENAL CODE § 19.02"],
    facts: [
      { label: "Total Sentence", value: "135 YEARS" },
      { label: "First Conviction", value: "55 YRS · 2019" },
      { label: "Second Conviction", value: "80 YRS · 2025" },
      { label: "Structure", value: "CONCURRENT" },
      { label: "Parole Eligible", value: "AUG 7, 2049" },
      { label: "Projected Release", value: "AUG 8, 2099" },
    ],
    pdf_url: null,
    decode: [
      { label: "WHAT THIS IS", text: "The judgment on the 2025 murder conviction — the second of two Texas murder cases. The 2025 jury assessed 80 years for the fatal shooting committed while he was a fugitive from the first case. This document is the sentence reduced to its final form." },
      { label: "THE MATH", text: "The two sentences run concurrently — served at the same time, not stacked end-to-end. The 80 years doesn't add to the 55; it replaces it as the controlling sentence. Total exposure: 135 years on paper, but concurrent structure means the longest single sentence governs the release date." },
      { label: "THE PAROLE HORIZON", text: "Parole eligibility lands August 7, 2049. If the board grants release at first eligibility, he walks then. Every denial pushes review forward — repeated denials project an actual release date of August 8, 2099. The gap between eligibility and projection is the parole board's discretion, and violent-offense records rarely clear on the first look." },
      { label: "WHAT'S NEXT", text: "This is functionally final absent appellate intervention. The file that matters now is the parole review calendar starting in 2049 — everything between now and then is custody classification and time served." },
    ],
  },
  {
    id: "tx-v-conway-indictment",
    date: "03.04",
    docType: "Indictment",
    caseName: "Texas v. Conway (Yella Beezy)",
    court: "Texas District Court",
    division: "DALLAS COUNTY",
    caseNo: "TX-CAP-2026",
    filed: "MAR 4, 2026",
    status: "PUBLIC",
    defendants: ["Markies Conway"],
    pills: ["CAPITAL MURDER · TX PC § 19.03", "DEATH PENALTY ELIGIBLE", "HOUSE ARREST"],
    charges: ["CAPITAL MURDER — TEXAS PENAL CODE § 19.03"],
    facts: [
      { label: "Phase", value: "PRE-TRIAL" },
      { label: "Custody", value: "HOUSE ARREST" },
      { label: "Bail", value: "$750K · REDUCED" },
      { label: "Conditions", value: "ANKLE MONITOR" },
      { label: "Work Release", value: "5 HRS / WEEK" },
      { label: "Exposure", value: "DEATH OR LWOP" },
    ],
    pdf_url: null,
    decode: [
      { label: "WHAT THIS IS", text: "A capital murder indictment — the state's most serious charging instrument. The prosecution alleges the defendant orchestrated and funded a gunman to attack a rival. 'Capital' means the murder carries an aggravating element that makes the case death-penalty eligible under Texas law." },
      { label: "THE CHARGE", text: "Texas capital murder under § 19.03 is murder plus an aggravator — murder-for-hire among them. Upon conviction, the punishment phase determines the sentence: death by lethal injection, or life without the possibility of parole. The district attorney's decision on whether to seek death shapes the entire case." },
      { label: "THE BAIL", text: "Bail was initially set at $2 million, later reduced to $750,000 with strict conditions: full-time house arrest on electronic monitoring, with a five-hour weekly window for studio work. Rare for a capital case — the defense won a meaningful concession on pre-trial liberty." },
      { label: "WHAT'S NEXT", text: "The trial was originally set for early 2026 and has been postponed; a new date is pending. Watch for the state's formal notice on whether it will seek death — that filing changes the trial's length, the voir dire, and everything about the defense's posture." },
    ],
  },
  {
    id: "la-v-tyler-plea",
    date: "06.15",
    docType: "Guilty Plea & Sentence",
    caseName: "Louisiana v. Tyler (Mystikal)",
    court: "Louisiana District Court",
    division: "ASCENSION PARISH",
    caseNo: "LA-2026-PLEA",
    filed: "JUN 15, 2026",
    status: "PUBLIC",
    defendants: ["Michael Tyler"],
    pills: ["THIRD-DEGREE RAPE · PLEA", "20 YRS · JUNE 2026", "STATE CUSTODY"],
    charges: ["THIRD-DEGREE RAPE — LOUISIANA R.S. 14:43"],
    facts: [
      { label: "Plea Entered", value: "MARCH 2026" },
      { label: "Sentenced", value: "20 YEARS · JUNE 2026" },
      { label: "Original Charge", value: "LIFE-EXPOSURE" },
      { label: "Withdrawal Bid", value: "DENIED" },
      { label: "Location", value: "LA STATE PRISON" },
      { label: "Housing", value: "PROTECTIVE CUSTODY" },
    ],
    pdf_url: null,
    decode: [
      { label: "WHAT THIS IS", text: "The plea and judgment closing a prosecution that began with a life-exposure charge. In March 2026, the defendant pleaded guilty to third-degree rape — a lesser offense than the original allegations carried. In June, the court imposed 20 years. The case is over; the sentence has begun." },
      { label: "THE PLEA", text: "Pleading to a lesser charge in exchange for capped exposure is the standard machinery of criminal resolution. Here the trade was stark: a life-exposure allegation resolved with a 20-year ceiling. After sentencing, the defense moved to withdraw the plea — claiming grounds to undo it — and the court denied the motion." },
      { label: "THE SENTENCE", text: "Twenty years, with transfer in July 2026 to Louisiana State Prison. Because he is a public figure, the department placed him in protective custody — segregated housing for inmates who can't be safely housed in general population. It is custody within custody, for his own protection." },
      { label: "WHAT'S NEXT", text: "Serving. The plea-withdrawal denial is the only live appellate issue, and it's a narrow one — courts rarely let defendants undo knowing pleas after sentencing. Absent a reversal, the next date that matters on this file is the parole eligibility calculation." },
    ],
  },
];

/* ============ SHARED BITS ============ */

const Blip = ({ text }: { text: string }) => (
  <span className="help-icon-wrapper">
    <span className="help-icon">?</span>
    <span className="help-tooltip">{text}</span>
  </span>
);

const CaseName = ({ name, className }: { name: string; className: string }) => {
  const parts = name.split(" v. ");
  return (
    <span className={className}>
      {parts[0]} v. <em>{parts[1]}</em>
    </span>
  );
};

const yrs = (s: string): number | null => {
  if (!s) return null;
  let total = 0;
  const y = s.match(/([\d.]+)\s*YR/i);
  const m = s.match(/(\d+)\s*MO/i);
  if (y) total += parseFloat(y[1]);
  if (m) total += parseInt(m[1]) / 12;
  return total > 0 ? total : null;
};

const pillClass = (s: string) => {
  if (/SERVING/i.test(s)) return 'red';
  if (/PROBATION|RELEASED/i.test(s)) return 'green';
  if (/HOUSE/i.test(s)) return 'mute';
  return 'mute';
};

/* ============ PAGE ============ */

export default function LegalPage() {
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // AI Decoder state
  const [topicInput, setTopicInput] = useState("The RICO Act");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSections, setAiSections] = useState<LegalSection[] | null>(null);
  const [aiBottomLine, setAiBottomLine] = useState<string | null>(null);
  const [aiMeta, setAiMeta] = useState<{ provider: string; model: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Docket state
  const [featuredId, setFeaturedId] = useState<string>("us-v-love-chan");
  const [activeDoc, setActiveDoc] = useState<DocketEntry | null>(null);
  const [docTab, setDocTab] = useState<"filing" | "decode">("decode");

  // Fullscreen state
  const [fsDoc, setFsDoc] = useState<DocketEntry | null>(null);
  const fsRef = useRef<HTMLDivElement>(null);

  // Editor / PDF state
  const [userRole, setUserRole] = useState<string | null>(null);
  const [pdfMap, setPdfMap] = useState<Record<string, string>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docketCardRef = useRef<HTMLElement>(null);

  // Ledger state
  const [verdicts, setVerdicts] = useState<VerdictRow[]>(SEED_VERDICTS);
  const [showAddVerdict, setShowAddVerdict] = useState(false);
  const [savingVerdict, setSavingVerdict] = useState(false);
  const [verdictError, setVerdictError] = useState<string | null>(null);
  const [vName, setVName] = useState("");
  const [vCharge, setVCharge] = useState("");
  const [vMax, setVMax] = useState("");
  const [vReceived, setVReceived] = useState("");
  const [vDate, setVDate] = useState("");
  const [vStatus, setVStatus] = useState("SERVING");

  // Ledger edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eCharge, setECharge] = useState("");
  const [eMax, setEMax] = useState("");
  const [eReceived, setEReceived] = useState("");
  const [eDate, setEDate] = useState("");
  const [eStatus, setEStatus] = useState("SERVING");

  const featured = DOCKET_ENTRIES.find(e => e.id === featuredId) || DOCKET_ENTRIES[0];

  useEffect(() => {
    setIsMounted(true);
    fetch('/api/published-articles')
      .then(res => res.json())
      .then(data => {
        const filtered = (data.articles || []).filter((a: PublishedArticle) =>
          (a.tags || []).map(t => t.toLowerCase()).includes('legal')
        );
        setArticles(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fade-up:not(.is-in), .line-mask:not(.is-in)').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [loading]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (fsDoc) { closeFullscreen(); return; }
      if (activeDoc) setActiveDoc(null);
    };
    if (activeDoc || fsDoc) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKey);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [activeDoc, fsDoc]);

  const fetchLedger = useCallback(async () => {
    try {
      const { data, error: dbErr } = await supabaseBrowser.from('verdicts').select('*').order('created_at', { ascending: false });
      if (!dbErr && data && data.length > 0) {
        setVerdicts(data.map(r => ({
          dbId: r.id,
          name: r.name,
          charge: r.charge || '',
          max: r.max_faced || '',
          received: r.received || '',
          date: r.date_label || '',
          status: (r.status || 'SERVING').toUpperCase(),
        })));
      }
    } catch (e) { /* keep seed */ }
  }, []);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { session } } = await supabaseBrowser.auth.getSession();
        if (!session) { fetchLedger(); return; }
        const { data: profile } = await supabaseBrowser.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile && (profile.role === 'admin' || profile.role === 'editor')) setUserRole(profile.role);
      } catch (e) { /* anon */ }
      fetchLedger();
    };
    checkRole();
  }, [fetchLedger]);

  // FIXED: version stamps from each file's own updated_at — the browser cache
  // invalidates only for files that actually changed, so replacements always show
  const loadPdfMap = useCallback(async () => {
    try {
      const { data } = await supabaseBrowser.storage.from('docket').list();
      const map: Record<string, string> = {};
      (data || []).forEach(f => {
        if (f.name.toLowerCase().endsWith('.pdf')) {
          const { data: urlData } = supabaseBrowser.storage.from('docket').getPublicUrl(f.name);
          const stamp = new Date(f.updated_at || f.created_at || Date.now()).getTime();
          map[f.name.replace(/\.pdf$/i, '')] = `${urlData.publicUrl}?v=${stamp}`;
        }
      });
      setPdfMap(map);
    } catch (e) {
      console.error('[Docket] Storage list failed:', e);
    }
  }, []);

  useEffect(() => { loadPdfMap(); }, [loadPdfMap]);

  useEffect(() => {
    if (!activeDoc) return;
    const hasPdf = !!(pdfMap[activeDoc.id] || activeDoc.pdf_url);
    setDocTab(hasPdf || userRole ? 'filing' : 'decode');
  }, [activeDoc]);

  const swapFeature = (id: string) => {
    if (id === featuredId) return;
    setFeaturedId(id);
    if (typeof window !== 'undefined' && window.innerWidth < 1000) {
      setTimeout(() => docketCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  };

  useEffect(() => {
    if (fsDoc && fsRef.current) {
      const el: any = fsRef.current;
      try {
        if (el.requestFullscreen) { el.requestFullscreen().catch(() => {}); }
        else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
      } catch (e) { /* overlay fallback */ }
    }
  }, [fsDoc]);

  const openFullscreen = (entry: DocketEntry) => setFsDoc(entry);

  const closeFullscreen = () => {
    try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch (e) {}
    setFsDoc(null);
  };

  const triggerUpload = (entryId: string) => {
    setUploadTarget(entryId);
    fileInputRef.current?.click();
  };

  // FIXED: remove-then-upload — upsert is unreliable under storage RLS,
  // which is why replacements silently failed before
  const handleUpload = async (entryId: string, file: File) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) { setUploadError(entryId); return; }
    setUploadingId(entryId);
    setUploadError(null);
    try {
      await supabaseBrowser.storage.from('docket').remove([`${entryId}.pdf`]).catch(() => {});
      const { error: upErr } = await supabaseBrowser.storage
        .from('docket')
        .upload(`${entryId}.pdf`, file, { contentType: 'application/pdf' });
      if (upErr) {
        console.error('[Docket] Upload failed:', upErr.message);
        setUploadError(entryId);
      } else {
        await loadPdfMap();
        setDocTab('filing');
      }
    } catch (e) {
      console.error('[Docket] Upload exception:', e);
      setUploadError(entryId);
    }
    setUploadingId(null);
  };

  const handleRemovePdf = async (entryId: string) => {
    try {
      await supabaseBrowser.storage.from('docket').remove([`${entryId}.pdf`]);
      await loadPdfMap();
    } catch (e) {
      console.error('[Docket] Remove failed:', e);
    }
  };

  const runDecode = async (topic: string) => {
    if (!topic.trim() || aiLoading) return;
    setAiLoading(true); setAiSections(null); setAiBottomLine(null); setError(null); setAiMeta(null);
    try {
      const res = await fetch('/api/legal-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiSections(data.sections);
      setAiBottomLine(data.bottom_line);
      setAiMeta(data.provider ? { provider: data.provider, model: data.model } : null);
    } catch (err: any) {
      setError(err?.message || "Decode failed — try again.");
    }
    setAiLoading(false);
  };

  const handleExplain = (e: React.FormEvent) => {
    e.preventDefault();
    runDecode(topicInput);
  };

  // Ledger CRUD
  const handleAddVerdict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim() || !vCharge.trim() || !vReceived.trim()) {
      setVerdictError("Name, charge, and result are required.");
      return;
    }
    setSavingVerdict(true); setVerdictError(null);
    try {
      const { data, error: insErr } = await supabaseBrowser
        .from('verdicts')
        .insert({
          name: vName.trim(),
          charge: vCharge.trim(),
          max_faced: vMax.trim() || '—',
          received: vReceived.trim(),
          date_label: vDate.trim(),
          status: (vStatus || 'SERVING').toUpperCase(),
        })
        .select()
        .single();
      if (insErr) throw new Error(insErr.message);
      setVerdicts(prev => [{
        dbId: data.id,
        name: data.name,
        charge: data.charge || '',
        max: data.max_faced || '',
        received: data.received || '',
        date: data.date_label || '',
        status: (data.status || 'SERVING').toUpperCase(),
      }, ...prev]);
      setVName(""); setVCharge(""); setVMax(""); setVReceived(""); setVDate(""); setVStatus("SERVING");
      setShowAddVerdict(false);
    } catch (err: any) {
      setVerdictError("Save failed — run SQL 06/07 and check the verdicts table.");
    }
    setSavingVerdict(false);
  };

  const startEdit = (v: VerdictRow) => {
    setEditingId(v.dbId || null);
    setEName(v.name); setECharge(v.charge); setEMax(v.max);
    setEReceived(v.received); setEDate(v.date); setEStatus(v.status);
    setShowAddVerdict(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!eName.trim() || !eCharge.trim()) {
      setVerdictError("Name and charge are required.");
      return;
    }
    setSavingVerdict(true); setVerdictError(null);
    try {
      const { error: upErr } = await supabaseBrowser
        .from('verdicts')
        .update({
          name: eName.trim(),
          charge: eCharge.trim(),
          max_faced: eMax.trim() || '—',
          received: eReceived.trim(),
          date_label: eDate.trim(),
          status: (eStatus || 'SERVING').toUpperCase(),
        })
        .eq('id', editingId);
      if (upErr) throw new Error(upErr.message);
      setVerdicts(prev => prev.map(v => v.dbId === editingId ? {
        ...v,
        name: eName.trim(),
        charge: eCharge.trim(),
        max: eMax.trim() || '—',
        received: eReceived.trim(),
        date: eDate.trim(),
        status: (eStatus || 'SERVING').toUpperCase(),
      } : v));
      setEditingId(null);
    } catch (err: any) {
      setVerdictError("Update failed — check the verdicts table.");
    }
    setSavingVerdict(false);
  };

  const handleDeleteVerdict = async (row: VerdictRow) => {
    if (!row.dbId) return;
    try {
      await supabaseBrowser.from('verdicts').delete().eq('id', row.dbId);
      setVerdicts(prev => prev.filter(v => v.dbId !== row.dbId));
    } catch (e) { /* no-op */ }
  };

  const activePdf = activeDoc ? (pdfMap[activeDoc.id] || activeDoc.pdf_url) : null;
  const showTabs = activeDoc && (activePdf || userRole);
  const pdfCount = Object.keys(pdfMap).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Legal" />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && uploadTarget) handleUpload(uploadTarget, f);
          e.target.value = '';
        }}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        :root { --bg: #0a0a0a; --bg-elev: #131313; --text: #ffffff; --text-soft: #a8a8a8; --text-mute: #6e6e6e; --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25); --line: rgba(255,255,255,0.10); --line-soft: rgba(255,255,255,0.06); --red: #d24239; --green: #6bbf6b; --ease-quiet: cubic-bezier(.22, 1, .36, 1); }

        .shell { max-width: 1400px; margin: 0 auto; padding: 64px 32px 80px; }

        /* ===== PAGE HEAD ===== */
        .page-head { margin-bottom: 64px; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--line); padding-bottom: 32px; }
        .page-head__left { flex: 1; }
        .page-head__num { font-family: monospace; font-size: 12px; letter-spacing: 0.2em; color: var(--accent); margin-bottom: 12px; display: block; }
        .page-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: clamp(48px, 8vw, 96px); line-height: 0.9; letter-spacing: -0.03em; }
        .page-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .page-head__right { text-align: right; font-family: 'Times New Roman', serif; font-style: italic; font-size: 16px; color: var(--text-soft); max-width: 400px; }

        /* ===== SECTION HEAD ===== */
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 32px; border-bottom: 1px solid var(--accent); padding-bottom: 12px; }
        .section-head__left { display: flex; align-items: baseline; gap: 16px; }
        .section-head__num { font-family: monospace; font-size: 11px; letter-spacing: 0.2em; color: var(--accent); }
        .section-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 28px; letter-spacing: -0.01em; }
        .section-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .section-head__count { font-family: monospace; font-size: 10px; letter-spacing: 0.16em; color: var(--text-mute); text-transform: uppercase; }
        .section-head__tools { display: flex; align-items: center; gap: 12px; }

        /* ===== THE WATCHLIST ===== */
        .watchlist-section { margin-bottom: 80px; }
        .watchlist-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        .watch-card { border: 1px solid var(--line); background: var(--bg-elev); padding: 28px; display: flex; flex-direction: column; gap: 14px; }
        .watch-card__rail { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .watch-card__id { display: flex; flex-direction: column; gap: 4px; }
        .watch-card__name { font-family: 'Times New Roman', serif; font-size: 24px; font-weight: 700; line-height: 1.15; }
        .watch-card__name em { font-style: italic; font-weight: 400; }
        .watch-card__charges { font-family: 'Times New Roman', serif; font-style: italic; color: var(--text-soft); font-size: 14px; line-height: 1.5; }
        .watch-card__meta { font-family: monospace; font-size: 9px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; display: flex; gap: 20px; }
        .watch-card__meta strong { color: var(--text-soft); font-weight: 500; }
        .custody-pill { font-family: monospace; font-size: 8px; letter-spacing: 0.16em; text-transform: uppercase; padding: 4px 8px; border: 1px solid var(--line); color: var(--text-soft); white-space: nowrap; flex-shrink: 0; }
        .custody-pill.red { color: var(--red); border-color: var(--red); }
        .custody-pill.green { color: var(--green); border-color: var(--green); }

        .phase-pipe { display: flex; margin: 10px 0 4px; }
        .phase-node { display: flex; flex-direction: column; align-items: center; gap: 7px; flex: 1; position: relative; }
        .phase-node::before { content: ''; position: absolute; top: 3.5px; left: -50%; width: 100%; height: 1px; background: var(--line); }
        .phase-node:first-child::before { display: none; }
        .phase-dot { width: 8px; height: 8px; border-radius: 50%; border: 1px solid var(--line); background: var(--bg-elev); z-index: 1; transition: all .4s var(--ease-quiet); }
        .phase-node.is-done .phase-dot { background: var(--text-mute); border-color: var(--text-mute); }
        .phase-node.is-done::before { background: var(--text-mute); }
        .phase-node.is-now .phase-dot { background: var(--accent); border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); animation: phasePulse 2.4s var(--ease-quiet) infinite; }
        .phase-node.is-now::before { background: var(--accent); }
        @keyframes phasePulse { 0%,100% { box-shadow: 0 0 0 3px var(--accent-soft); } 50% { box-shadow: 0 0 0 6px rgba(210,66,57,0.10); } }
        .phase-label { font-family: monospace; font-size: 7px; letter-spacing: 0.08em; color: var(--text-mute); text-transform: uppercase; text-align: center; line-height: 1.3; }
        .phase-node.is-now .phase-label { color: var(--accent); font-weight: 700; }
        .phase-node.is-done .phase-label { color: var(--text-soft); }

        .watch-card__foot { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--line-soft); padding-top: 12px; gap: 12px; flex-wrap: wrap; }
        .watch-card__exposure { font-family: monospace; font-size: 9px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; }
        .watch-card__next { font-family: monospace; font-size: 9px; letter-spacing: 0.14em; color: var(--accent); text-transform: uppercase; }

        /* ===== AI CARD ===== */
        .decode-section { margin-bottom: 80px; }
        .decode-wrap { max-width: 900px; margin: 0 auto; }
        .ai-card { background: var(--bg-elev); border: 1px solid var(--accent-soft); border-left: 3px solid var(--accent); padding: 28px; }
        .ai-tag { display: flex; align-items: center; gap: 8px; font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: var(--accent); text-transform: uppercase; margin-bottom: 16px; }
        .ai-tag::before { content: '✦'; font-size: 14px; }
        .ai-title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
        .ai-title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 22px; line-height: 1.2; }
        .ai-title em { font-style: italic; }
        .ai-text { font-family: 'Times New Roman', serif; font-size: 15px; line-height: 1.6; color: var(--text-soft); margin-bottom: 16px; }
        .ai-form { display: flex; border: 1px solid var(--line); background: var(--bg); transition: border-color .3s var(--ease-quiet); }
        .ai-form:focus-within { border-color: var(--accent); }
        .ai-input { flex: 1; min-width: 0; background: transparent; border: none; outline: none; color: var(--text); font-family: 'Times New Roman', serif; font-size: 15px; padding: 12px 14px; }
        .ai-input::placeholder { color: var(--text-mute); font-style: italic; }
        .ai-btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--accent); color: #0a0a0a; border: none; font-family: monospace; font-size: 10px; letter-spacing: 0.18em; padding: 0 20px; cursor: pointer; font-weight: 700; transition: background .3s; }
        .ai-btn:hover:not(:disabled) { background: #e05a50; }
        .ai-btn:disabled { opacity: 0.6; cursor: wait; }
        .decode-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .decode-chip { background: none; border: 1px solid var(--line); color: var(--text-soft); font-family: monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 10px; cursor: pointer; transition: all .3s var(--ease-quiet); }
        .decode-chip:hover { color: var(--accent); border-color: var(--accent); }
        .ai-result { border-top: 1px solid var(--line-soft); margin-top: 16px; }
        .lex-section { padding: 14px 0; border-bottom: 1px solid var(--line-soft); }
        .lex-section:last-child { border-bottom: none; }
        .lex-label { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); display: block; margin-bottom: 6px; }
        .lex-text { font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.6; color: var(--text-soft); }
        .ai-bottom { margin-top: 16px; padding: 14px; border: 1px solid var(--accent-soft); background: var(--bg); font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.55; color: var(--text); }
        .ai-bottom strong { color: var(--accent); font-weight: 400; font-family: monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; display: block; margin-bottom: 6px; }
        .ai-error { margin-top: 12px; font-family: monospace; font-size: 10px; letter-spacing: 0.1em; color: var(--red); text-transform: uppercase; line-height: 1.6; }
        .ai-divider { height: 1px; background: var(--line); margin: 16px 0; }
        .ai-source { font-family: monospace; font-size: 9px; color: var(--text-mute); letter-spacing: 0.14em; text-transform: uppercase; }

        .skeleton-grid { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
        .skeleton { background: linear-gradient(90deg, #1a1a1a 0%, #262626 50%, #1a1a1a 100%); background-size: 200% 100%; animation: skeletonShimmer 1.4s ease-in-out infinite; }
        .skeleton-line { height: 12px; width: 100%; }
        .skeleton-line.short { width: 60%; }
        @keyframes skeletonShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* ===== THE LEDGER ===== */
        .ledger-section { margin-bottom: 80px; }
        .ledger-add-btn { display: inline-flex; align-items: center; gap: 8px; background: transparent; border: 1px solid var(--accent); color: var(--accent); font-family: monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; padding: 8px 14px; cursor: pointer; transition: all .3s var(--ease-quiet); }
        .ledger-add-btn:hover { background: var(--accent); color: #0a0a0a; }
        .ledger-form { border: 1px solid var(--line); background: var(--bg-elev); padding: 24px; margin-bottom: 28px; display: flex; flex-direction: column; gap: 16px; }
        .ledger-form__row { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 16px; }
        .ledger-field { display: flex; flex-direction: column; gap: 6px; }
        .ledger-field__label { font-family: monospace; font-size: 8px; letter-spacing: 0.18em; color: var(--accent); text-transform: uppercase; }
        .ledger-input, .ledger-select { background: var(--bg); border: 1px solid var(--line); color: var(--text); padding: 10px 12px; font-family: 'Times New Roman', serif; font-size: 14px; outline: none; transition: border-color .3s; width: 100%; }
        .ledger-input:focus, .ledger-select:focus { border-color: var(--accent); }
        .ledger-select { font-family: monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; }
        .ledger-select option { background: #131313; color: #fff; }
        .ledger-form__actions { display: flex; gap: 12px; justify-content: flex-end; align-items: center; }
        .ledger-submit { display: inline-flex; align-items: center; gap: 8px; background: var(--accent); color: #0a0a0a; border: none; font-family: monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700; padding: 10px 18px; cursor: pointer; }
        .ledger-submit:disabled { opacity: .6; cursor: wait; }
        .ledger-cancel { background: none; border: 1px solid var(--line); color: var(--text-mute); font-family: monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; padding: 10px 18px; cursor: pointer; }
        .ledger-cancel:hover { border-color: var(--text-soft); color: var(--text-soft); }
        .ledger-form__error { font-family: monospace; font-size: 9px; letter-spacing: 0.1em; color: var(--red); text-transform: uppercase; }

        .ledger-row { display: grid; grid-template-columns: 280px 1fr 160px 180px; gap: 24px; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--line-soft); }
        .ledger-row:hover .ledger-name { color: var(--accent); }
        .ledger-name { font-family: 'Times New Roman', serif; font-size: 19px; font-weight: 700; line-height: 1.2; transition: color .3s; }
        .ledger-charge { font-family: monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-mute); margin-top: 6px; line-height: 1.7; }
        .ledger-bar-col { display: flex; flex-direction: column; gap: 8px; }
        .ledger-bar { height: 6px; background: var(--line-soft); position: relative; overflow: hidden; }
        .ledger-bar__fill { position: absolute; top: 0; left: 0; bottom: 0; background: var(--accent); }
        .ledger-bar-meta { display: flex; justify-content: space-between; gap: 12px; font-family: monospace; font-size: 8px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; }
        .ledger-max { text-decoration: line-through; }
        .ledger-nobar { color: var(--text-soft); }
        .ledger-actual { font-family: 'Times New Roman', serif; font-size: 20px; font-weight: 700; color: var(--accent); text-align: right; }
        .ledger-actual.is-long { font-size: 13px; letter-spacing: 0.04em; }
        .ledger-actual.is-pending { font-family: monospace; font-size: 10px; letter-spacing: 0.14em; color: var(--text-mute); }
        .ledger-right { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
        .vs-pill { font-family: monospace; font-size: 8px; letter-spacing: 0.16em; text-transform: uppercase; padding: 4px 8px; border: 1px solid var(--line); color: var(--text-soft); white-space: nowrap; }
        .vs-red { color: var(--red); border-color: var(--red); }
        .vs-green { color: var(--green); border-color: var(--green); }
        .vs-mute { color: var(--text-mute); }
        .ledger-icon-btn { background: none; border: 1px solid transparent; color: var(--text-mute); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: all .3s; }
        .ledger-row:hover .ledger-icon-btn { opacity: 1; }
        .ledger-icon-btn:hover { color: var(--accent); border-color: var(--accent); }
        .ledger-icon-btn.is-del:hover { color: var(--red); border-color: var(--red); }

        /* ===== THE DOCKET ===== */
        .docket-section { margin-bottom: 80px; }
        .docket-entry { display: grid; grid-template-columns: 1fr 320px; border: 1px solid var(--line); background: var(--bg-elev); margin-bottom: 24px; animation: docketSwap .55s var(--ease-quiet); }
        @keyframes docketSwap { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .docket-entry__main { padding: 32px; }
        .docket-entry__side { border-left: 1px solid var(--line); padding: 28px; background: var(--bg); display: flex; flex-direction: column; }
        .docket-entry__rail { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; flex-wrap: wrap; }
        .doc-badge { font-family: monospace; font-size: 9px; letter-spacing: 0.16em; color: var(--accent); border: 1px solid var(--accent); padding: 4px 8px; text-transform: uppercase; white-space: nowrap; }
        .doc-filed { font-family: monospace; font-size: 10px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; }
        .docket-entry__case { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 30px; line-height: 1.1; letter-spacing: -0.01em; margin-bottom: 8px; }
        .docket-entry__case em, .doc-modal__case em { font-style: italic; font-weight: 400; }
        .docket-entry__court { font-family: monospace; font-size: 10px; letter-spacing: 0.16em; color: var(--text-soft); text-transform: uppercase; margin-bottom: 20px; }
        .charge-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }
        .charge-pill { font-family: monospace; font-size: 9px; letter-spacing: 0.12em; color: var(--text-soft); border: 1px solid var(--line); padding: 5px 10px; text-transform: uppercase; }
        .docket-decode__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-wrap: wrap; gap: 8px; }
        .docket-decode__tag { font-family: monospace; font-size: 9px; letter-spacing: 0.18em; color: var(--accent); text-transform: uppercase; }
        .docket-decode__count { font-family: monospace; font-size: 9px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; }
        .docket-decode__section { padding: 18px 0; border-bottom: 1px solid var(--line-soft); }
        .docket-decode__section:last-child { border-bottom: none; padding-bottom: 0; }
        .docket-decode__label { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; display: block; margin-bottom: 6px; }
        .docket-decode__text { font-family: 'Times New Roman', serif; font-size: 15px; line-height: 1.6; color: var(--text-soft); }
        .docket-inline-link { background: none; border: none; color: var(--accent); font-family: monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer; padding: 0; margin-top: 20px; transition: color .3s; }
        .docket-inline-link:hover { color: #e05a50; }
        .docket-side__tag { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .docket-side__tag::after { content: ''; flex: 1; height: 1px; background: var(--line); }
        .docket-fact { margin-bottom: 16px; }
        .docket-fact__label { font-family: monospace; font-size: 9px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; display: block; margin-bottom: 4px; }
        .docket-fact__value { font-family: monospace; font-size: 11px; color: var(--text); letter-spacing: 0.06em; text-transform: uppercase; line-height: 1.5; }
        .docket-view-btn { margin-top: auto; background: transparent; border: 1px solid var(--accent); color: var(--accent); font-family: monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; padding: 12px; cursor: pointer; transition: all .3s var(--ease-quiet); }
        .docket-view-btn:hover { background: var(--accent); color: #0a0a0a; }

        .docket-admin { margin-top: 20px; padding-top: 16px; border-top: 1px dashed var(--line); }
        .docket-admin__label { font-family: monospace; font-size: 8px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; margin-bottom: 10px; }
        .docket-upload-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: transparent; border: 1px dashed var(--accent-soft); color: var(--accent); font-family: monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; padding: 10px; cursor: pointer; transition: all .3s var(--ease-quiet); }
        .docket-upload-btn:hover:not(:disabled) { border-color: var(--accent); border-style: solid; background: rgba(210,66,57,0.06); }
        .docket-upload-btn:disabled { opacity: 0.5; cursor: wait; }
        .docket-upload-btn.is-remove { color: var(--text-mute); border-color: var(--line); margin-top: 8px; }
        .docket-upload-btn.is-remove:hover { color: var(--red); border-color: var(--red); border-style: solid; background: transparent; }
        .docket-pdf-status { font-family: monospace; font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-mute); margin-top: 8px; text-align: center; }
        .docket-pdf-status.is-ok { color: var(--green); }
        .docket-admin__error { font-family: monospace; font-size: 8px; letter-spacing: 0.1em; color: var(--red); text-transform: uppercase; margin-top: 8px; text-align: center; }

        .docket-list__hint { font-family: monospace; font-size: 8px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; padding: 10px 0; border-bottom: 1px solid var(--line); }
        .docket-list { border-top: 1px solid var(--line); }
        .docket-row { display: flex; align-items: baseline; gap: 18px; padding: 18px 0; border-bottom: 1px solid var(--line-soft); cursor: pointer; }
        .docket-row:hover .docket-row__title { color: var(--accent); }
        .docket-row__date { font-family: monospace; font-size: 10px; color: var(--text-mute); letter-spacing: 0.08em; width: 48px; flex-shrink: 0; }
        .docket-row__type { font-family: monospace; font-size: 9px; letter-spacing: 0.16em; color: var(--accent); text-transform: uppercase; width: 190px; flex-shrink: 0; }
        .docket-row__title { font-family: 'Times New Roman', serif; font-size: 17px; font-weight: 500; line-height: 1.3; flex: 1; transition: color .3s; }
        .docket-row__court { font-family: monospace; font-size: 9px; letter-spacing: 0.14em; color: var(--text-mute); flex-shrink: 0; }
        .row-pdf-badge { font-family: monospace; font-size: 8px; letter-spacing: 0.14em; color: var(--green); border: 1px solid rgba(107,191,107,0.4); padding: 2px 6px; flex-shrink: 0; }
        .docket-row__open { font-family: monospace; font-size: 9px; letter-spacing: 0.14em; color: var(--text-mute); background: none; border: 1px solid var(--line); padding: 4px 10px; text-transform: uppercase; cursor: pointer; opacity: 0; transition: all .3s var(--ease-quiet); flex-shrink: 0; }
        .docket-row:hover .docket-row__open { opacity: 1; }
        .docket-row__open:hover { color: var(--accent); border-color: var(--accent); }
        .docket-row.is-active .docket-row__date { color: var(--accent); }
        .docket-row.is-active .docket-row__type { color: var(--text); }
        .docket-row.is-active .docket-row__title { color: var(--accent); }
        .docket-row.is-active .docket-row__open { opacity: 1; color: var(--accent); border-color: var(--accent-soft); }

        /* ===== MODAL ===== */
        .doc-modal { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .doc-modal__backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
        .doc-modal__frame { position: relative; width: 100%; max-width: 1040px; max-height: 88vh; background: var(--bg-elev); border: 1px solid var(--line); display: flex; flex-direction: column; animation: docModalIn .45s var(--ease-quiet); }
        @keyframes docModalIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        .doc-modal__head { display: flex; align-items: center; gap: 16px; padding: 16px 24px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
        .doc-modal__type { font-family: monospace; font-size: 9px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; white-space: nowrap; }
        .doc-modal__case { font-family: 'Times New Roman', serif; font-size: 18px; font-weight: 700; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .doc-modal__close { background: transparent; border: 1px solid var(--line); color: var(--text-mute); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .3s; flex-shrink: 0; }
        .doc-modal__close:hover { border-color: var(--accent); color: var(--accent); }
        .doc-tabs { display: flex; gap: 28px; padding: 0 24px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
        .doc-tab { background: none; border: none; border-bottom: 2px solid transparent; font-family: monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-mute); padding: 14px 0 12px; cursor: pointer; transition: color .3s, border-color .3s; }
        .doc-tab:hover { color: var(--text); }
        .doc-tab.is-active { color: var(--accent); border-bottom-color: var(--accent); }
        .doc-modal__body { display: grid; grid-template-columns: 1fr 280px; overflow: hidden; }
        .doc-modal__paper { padding: 24px 32px; overflow-y: auto; }
        .doc-modal__paper iframe { width: 100%; height: 56vh; border: 1px solid var(--line); background: #fff; }
        .doc-modal__facts { border-left: 1px solid var(--line); background: var(--bg); padding: 24px; overflow-y: auto; }
        .doc-modal__foot { padding: 12px 24px; border-top: 1px solid var(--line); font-family: monospace; font-size: 9px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; flex-shrink: 0; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
        .pdf-controls { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
        .pdf-controls__src { font-family: monospace; font-size: 9px; letter-spacing: 0.16em; color: var(--text-mute); text-transform: uppercase; }
        .pdf-fullscreen-btn { display: inline-flex; align-items: center; gap: 8px; background: transparent; border: 1px solid var(--line); color: var(--text-soft); font-family: monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; padding: 8px 14px; cursor: pointer; transition: all .3s var(--ease-quiet); }
        .pdf-fullscreen-btn:hover { border-color: var(--accent); color: var(--accent); }
        .pdf-fullscreen { position: fixed; inset: 0; z-index: 300; background: #050505; display: flex; flex-direction: column; animation: fsIn .35s var(--ease-quiet); }
        @keyframes fsIn { from { opacity: 0; } to { opacity: 1; } }
        .pdf-fullscreen__bar { display: flex; align-items: center; gap: 16px; padding: 14px 24px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
        .pdf-fullscreen__case { font-family: 'Times New Roman', serif; font-size: 18px; font-weight: 700; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pdf-fullscreen__case em { font-style: italic; font-weight: 400; }
        .pdf-fullscreen__exit { display: inline-flex; align-items: center; gap: 8px; background: transparent; border: 1px solid var(--line); color: var(--text-soft); font-family: monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; padding: 8px 14px; cursor: pointer; transition: all .3s; flex-shrink: 0; }
        .pdf-fullscreen__exit:hover { border-color: var(--accent); color: var(--accent); }
        .pdf-fullscreen iframe { flex: 1; width: 100%; border: none; background: #fff; }
        .doc-brief-tag { font-family: monospace; font-size: 9px; letter-spacing: 0.18em; color: var(--accent); text-transform: uppercase; margin-bottom: 10px; }
        .doc-brief-title { font-family: 'Times New Roman', serif; font-size: 28px; font-weight: 700; line-height: 1.1; margin-bottom: 6px; }
        .doc-brief-title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .doc-brief-sub { font-family: 'Times New Roman', serif; font-style: italic; font-size: 14px; color: var(--text-mute); margin-bottom: 20px; }
        .doc-brief-section { padding: 16px 0; border-top: 1px solid var(--line-soft); }
        .doc-brief-label { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; display: block; margin-bottom: 6px; }
        .doc-brief-text { font-family: 'Times New Roman', serif; font-size: 15px; line-height: 1.65; color: var(--text-soft); }
        .doc-dropzone { border: 1px dashed var(--line); padding: 56px 32px; display: flex; flex-direction: column; align-items: center; gap: 10px; cursor: pointer; transition: border-color .3s var(--ease-quiet), background .3s var(--ease-quiet); text-align: center; }
        .doc-dropzone:hover { border-color: var(--accent); background: rgba(210,66,57,0.04); }
        .doc-dropzone svg { color: var(--accent); }
        .doc-dropzone__title { font-family: 'Times New Roman', serif; font-size: 19px; font-weight: 500; font-style: italic; color: var(--text); }
        .doc-dropzone__sub { font-family: monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-soft); }
        .doc-dropzone__hint { font-family: monospace; font-size: 8px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; }
        .doc-replace-row { display: flex; gap: 10px; margin-top: 14px; }
        .doc-replace { display: flex; align-items: center; justify-content: center; gap: 8px; flex: 1; background: none; border: 1px dashed var(--line); color: var(--text-mute); font-family: monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; padding: 10px; cursor: pointer; transition: all .3s; }
        .doc-replace:hover { border-color: var(--accent); color: var(--accent); }
        .doc-replace.is-remove { color: var(--text-mute); border-color: var(--line); }
        .doc-replace.is-remove:hover { border-color: var(--red); color: var(--red); }

        /* ===== STORY GRID ===== */
        .story-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px 32px; }
        .story__image { width: 100%; aspect-ratio: 16 / 10; overflow: hidden; background: var(--bg-elev); display: block; }
        .story__image img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.85) contrast(1.1); transition: transform 1.1s var(--ease-quiet); }
        .story:hover .story__image img { transform: scale(1.03); }
        .story__kicker { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin: 14px 0 8px; }
        .story__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 20px; line-height: 1.25; }
        .story:hover .story__title { color: var(--accent); }
        .story__title em { font-style: italic; font-weight: 400; }
        .story__meta { font-family: monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-mute); margin-top: 10px; }
        .story__meta strong { color: var(--text-soft); font-weight: 500; }
        .loading-line { font-family: 'Times New Roman', serif; font-style: italic; color: var(--text-mute); padding: 32px 0; text-align: center; }

        /* ===== TOOLTIPS ===== */
        .help-icon-wrapper { position: relative; display: inline-flex; align-items: center; align-self: center; margin-left: 4px; }
        .help-icon { width: 16px; height: 16px; border-radius: 50%; border: 1px solid var(--line); color: var(--text-mute); font-family: monospace; font-size: 9px; display: inline-flex; align-items: center; justify-content: center; cursor: help; transition: all .3s var(--ease-quiet); flex-shrink: 0; }
        .help-icon:hover { border-color: var(--accent); color: var(--accent); }
        .help-tooltip { position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%) translateY(4px); background: rgba(40, 40, 40, 0.95); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--line); padding: 10px 14px; font-family: inherit; font-size: 12px; line-height: 1.5; color: var(--text-soft); letter-spacing: 0.01em; text-transform: none; white-space: normal; width: 230px; opacity: 0; pointer-events: none; transition: opacity .3s var(--ease-quiet), transform .3s var(--ease-quiet); z-index: 60; text-align: left; }
        .help-tooltip::after { content: ''; position: absolute; top: 100%; left: 50%; transform: translateX(-50%); border: 5px solid transparent; border-top-color: rgba(40, 40, 40, 0.95); }
        .help-icon-wrapper:hover .help-tooltip { opacity: 1; transform: translateX(-50%) translateY(0); }

        /* ===== ANIMATIONS ===== */
        .fade-up { opacity: 0; transform: translateY(24px); transition: opacity .9s var(--ease-quiet), transform .9s var(--ease-quiet); }
        .fade-up.is-in { opacity: 1; transform: none; }
        .line-mask { overflow: hidden; display: inline-block; }
        .line-mask__inner { display: block; transform: translateY(110%); transition: transform 1.1s var(--ease-quiet); }
        .line-mask.is-in .line-mask__inner { transform: translateY(0); }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1000px) {
          .watchlist-grid { grid-template-columns: 1fr; }
          .docket-entry { grid-template-columns: 1fr; }
          .docket-entry__side { border-left: none; border-top: 1px solid var(--line); }
          .phase-label { font-size: 6px; }
        }
        @media (max-width: 900px) {
          .story-grid { grid-template-columns: 1fr; gap: 40px; }
          .ledger-row { grid-template-columns: 1fr; gap: 12px; }
          .ledger-actual { text-align: left; }
          .ledger-right { justify-content: flex-start; }
          .ledger-icon-btn { opacity: 1; }
        }
        @media (max-width: 800px) {
          .doc-modal { padding: 12px; }
          .doc-modal__body { grid-template-columns: 1fr; overflow-y: auto; }
          .doc-modal__facts { border-left: none; border-top: 1px solid var(--line); }
          .doc-modal__paper { overflow-y: visible; padding: 24px 20px; }
          .doc-modal__paper iframe { height: 48vh; }
        }
        @media (max-width: 720px) {
          .shell { padding: 40px 18px 64px; }
          .page-head { flex-direction: column; align-items: flex-start; gap: 16px; }
          .page-head__right { text-align: left; }
          .section-head { flex-direction: column; align-items: flex-start; gap: 8px; }
          .docket-row { flex-wrap: wrap; gap: 8px 14px; }
          .docket-row__type { width: auto; }
          .docket-row__court { display: none; }
          .docket-row__open { opacity: 1; }
          .docket-entry__main, .docket-entry__side { padding: 24px 18px; }
          .doc-modal__head { flex-wrap: wrap; }
          .phase-label { display: none; }
          .phase-node.is-now .phase-label { display: block; }
        }
      `}} />

      <div className="shell">
        {/* ===== PAGE HEAD ===== */}
        <header className="page-head fade-up">
          <div className="page-head__left">
            <span className="page-head__num">04 / THE RECORD</span>
            <h1 className="page-head__title line-mask"><span className="line-mask__inner">The <em>Blotter</em></span></h1>
          </div>
          <p className="page-head__right">Every charge, every filing, every verdict — tracked from the docket to the gavel. The culture's legal record, translated.</p>
        </header>

        {/* ===== 01 / THE WATCHLIST ===== */}
        <section className="watchlist-section fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">01</span>
              <h2 className="section-head__title">The <em>Watchlist</em></h2>
              <Blip text="Every active case in the culture, tracked through the federal pipeline. The lit node shows exactly where each case sits — charged, pre-trial, verdict, or appeal." />
            </div>
            <span className="section-head__count">{WATCHLIST.length} CASES ACTIVE</span>
          </div>
          <div className="watchlist-grid">
            {WATCHLIST.map((c, i) => (
              <article className="watch-card" key={i}>
                <div className="watch-card__rail">
                  <span className={`custody-pill ${c.custodyClass}`}>{c.custody}</span>
                  <span className="watch-card__next">{c.next}</span>
                </div>
                <div className="watch-card__id">
                  <h3 className="watch-card__name">United States v. <em>{c.defendant}</em></h3>
                  <p className="watch-card__charges">{c.charges}</p>
                </div>
                <div className="watch-card__meta">
                  <span><strong>{c.court}</strong></span>
                  <span>{c.caseNo}</span>
                </div>
                <div className="phase-pipe">
                  {PHASES.map((ph, pi) => (
                    <div className={`phase-node ${pi < c.phase ? 'is-done' : ''} ${pi === c.phase ? 'is-now' : ''}`} key={ph}>
                      <div className="phase-dot"></div>
                      <span className="phase-label">{ph}</span>
                    </div>
                  ))}
                </div>
                <div className="watch-card__foot">
                  <span className="watch-card__exposure">EXPOSURE: {c.exposure}</span>
                  <span className="watch-card__next">PHASE: {PHASES[c.phase]}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ===== 02 / DECODE ===== */}
        <section className="decode-section fade-up">
          <div className="decode-wrap">
            <div className="section-head">
              <div className="section-head__left">
                <span className="section-head__num">02</span>
                <h2 className="section-head__title">Decode Legal <em>Jargon</em></h2>
                <Blip text="AI-powered plain-English breakdowns of any statute, charge, or legal concept. No law degree required." />
              </div>
            </div>
            <div className="ai-card">
              <div className="ai-tag">Akademy AI</div>
              <p className="ai-text">Type any statute, charge, or concept — RICO, a plea deal, an indictment — and the decoder translates it into plain English.</p>
              <form className="ai-form" onSubmit={handleExplain}>
                <input
                  className="ai-input"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="The RICO Act, 18 U.S.C. § 1961..."
                />
                <button className="ai-btn" type="submit" disabled={aiLoading}>
                  {aiLoading ? <Loader2 size={14} className="animate-spin" /> : "EXPLAIN"}
                </button>
              </form>
              <div className="decode-chips">
                {DECODE_CHIPS.map(c => (
                  <button type="button" className="decode-chip" key={c} onClick={() => { setTopicInput(c); runDecode(c); }}>
                    {c}
                  </button>
                ))}
              </div>

              {aiLoading && (
                <div className="skeleton-grid">
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line short" />
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line short" />
                </div>
              )}

              {aiSections && !aiLoading && (
                <div className="ai-result">
                  {aiSections.map((s, i) => (
                    <div className="lex-section" key={i}>
                      <span className="lex-label">{s.label}</span>
                      <p className="lex-text">{s.text}</p>
                    </div>
                  ))}
                  {aiBottomLine && (
                    <div className="ai-bottom"><strong>Bottom Line</strong>{aiBottomLine}</div>
                  )}
                </div>
              )}

              {error && <div className="ai-error">{error}</div>}

              <div className="ai-divider" />
              <div className="ai-source">
                {aiMeta ? `AI: ${aiMeta.provider} · ${aiMeta.model} · ` : ''}NOT LEGAL ADVICE
              </div>
            </div>
          </div>
        </section>

        {/* ===== 03 / THE LEDGER ===== */}
        <section className="ledger-section fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">03</span>
              <h2 className="section-head__title">The <em>Ledger</em></h2>
              <Blip text="The sentencing scoreboard. The bar shows what fraction of the maximum each sentence actually was — time faced versus time given." />
            </div>
            <div className="section-head__tools">
              {userRole && (
                <button className="ledger-add-btn" onClick={() => { setShowAddVerdict(v => !v); setEditingId(null); setVerdictError(null); }}>
                  <Plus size={12} /> {showAddVerdict ? 'Close' : 'Add Entry'}
                </button>
              )}
              <span className="section-head__count">{verdicts.length} ON THE BOARD</span>
            </div>
          </div>

          {userRole && showAddVerdict && (
            <form className="ledger-form" onSubmit={handleAddVerdict}>
              <div className="ledger-form__row">
                <div className="ledger-field">
                  <span className="ledger-field__label">Name</span>
                  <input className="ledger-input" value={vName} onChange={(e) => setVName(e.target.value)} placeholder="Casanova" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Charge</span>
                  <input className="ledger-input" value={vCharge} onChange={(e) => setVCharge(e.target.value)} placeholder="Racketeering Conspiracy" />
                </div>
              </div>
              <div className="ledger-form__row">
                <div className="ledger-field">
                  <span className="ledger-field__label">Max Faced</span>
                  <input className="ledger-input" value={vMax} onChange={(e) => setVMax(e.target.value)} placeholder="20 YRS" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Received</span>
                  <input className="ledger-input" value={vReceived} onChange={(e) => setVReceived(e.target.value)} placeholder="15 YRS 6 MO" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Date</span>
                  <input className="ledger-input" value={vDate} onChange={(e) => setVDate(e.target.value)} placeholder="06.2022" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Status</span>
                  <select className="ledger-select" value={vStatus} onChange={(e) => setVStatus(e.target.value)}>
                    <option>SERVING</option>
                    <option>PENDING</option>
                    <option>PROBATION</option>
                    <option>RELEASED</option>
                    <option>DEPORTED</option>
                    <option>HOUSE ARREST</option>
                  </select>
                </div>
              </div>
              {verdictError && <div className="ledger-form__error">{verdictError}</div>}
              <div className="ledger-form__actions">
                <button type="button" className="ledger-cancel" onClick={() => setShowAddVerdict(false)}>Cancel</button>
                <button type="submit" className="ledger-submit" disabled={savingVerdict}>
                  {savingVerdict ? <Loader2 size={12} className="animate-spin" /> : null}
                  {savingVerdict ? 'Saving...' : 'Add to the Ledger'}
                </button>
              </div>
            </form>
          )}

          <div className="ledger-rows">
            {verdicts.map(v => {
              if (editingId && v.dbId === editingId) {
                return (
                  <form className="ledger-form" onSubmit={handleSaveEdit} key={v.dbId} style={{ marginBottom: 0, borderBottom: '1px solid var(--line-soft)', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
                    <div className="ledger-form__row">
                      <div className="ledger-field">
                        <span className="ledger-field__label">Name</span>
                        <input className="ledger-input" value={eName} onChange={(e) => setEName(e.target.value)} />
                      </div>
                      <div className="ledger-field">
                        <span className="ledger-field__label">Charge</span>
                        <input className="ledger-input" value={eCharge} onChange={(e) => setECharge(e.target.value)} />
                      </div>
                    </div>
                    <div className="ledger-form__row">
                      <div className="ledger-field">
                        <span className="ledger-field__label">Max Faced</span>
                        <input className="ledger-input" value={eMax} onChange={(e) => setEMax(e.target.value)} />
                      </div>
                      <div className="ledger-field">
                        <span className="ledger-field__label">Received</span>
                        <input className="ledger-input" value={eReceived} onChange={(e) => setEReceived(e.target.value)} />
                      </div>
                      <div className="ledger-field">
                        <span className="ledger-field__label">Date</span>
                        <input className="ledger-input" value={eDate} onChange={(e) => setEDate(e.target.value)} />
                      </div>
                      <div className="ledger-field">
                        <span className="ledger-field__label">Status</span>
                        <select className="ledger-select" value={eStatus} onChange={(e) => setEStatus(e.target.value)}>
                          <option>SERVING</option>
                          <option>PENDING</option>
                          <option>PROBATION</option>
                          <option>RELEASED</option>
                          <option>DEPORTED</option>
                          <option>HOUSE ARREST</option>
                        </select>
                      </div>
                    </div>
                    <div className="ledger-form__actions">
                      <button type="button" className="ledger-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                      <button type="submit" className="ledger-submit" disabled={savingVerdict}>
                        {savingVerdict ? <Loader2 size={12} className="animate-spin" /> : null}
                        {savingVerdict ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                );
              }

              const maxN = yrs(v.max);
              const recN = yrs(v.received);
              const pct = (maxN && recN) ? Math.min(100, Math.round((recN / maxN) * 100)) : null;
              return (
                <div className="ledger-row" key={v.dbId || v.name}>
                  <div className="ledger-id">
                    <div className="ledger-name">{v.name}</div>
                    <div className="ledger-charge">{v.charge}{v.date ? ` · ${v.date}` : ''}</div>
                  </div>
                  <div className="ledger-bar-col">
                    {pct !== null ? (
                      <>
                        <div className="ledger-bar"><div className="ledger-bar__fill" style={{ width: pct + '%' }} /></div>
                        <div className="ledger-bar-meta">
                          <span className="ledger-max">FACED {v.max}</span>
                          <span>{pct}% OF MAX</span>
                        </div>
                      </>
                    ) : (
                      <div className="ledger-bar-meta">
                        <span className="ledger-max">FACED {v.max}</span>
                        <span className="ledger-nobar">{v.received === 'PENDING' ? 'AWAITING SENTENCE' : 'NON-CUSTODIAL'}</span>
                      </div>
                    )}
                  </div>
                  <div className={`ledger-actual ${v.received === 'PENDING' ? 'is-pending' : ''} ${v.received.length > 9 ? 'is-long' : ''}`}>
                    {v.received}
                  </div>
                  <div className="ledger-right">
                    <span className={`vs-pill vs-${pillClass(v.status)}`}>{v.status}</span>
                    {userRole && v.dbId && (
                      <>
                        <button className="ledger-icon-btn" onClick={() => startEdit(v)} aria-label="Edit entry"><Pencil size={11} /></button>
                        <button className="ledger-icon-btn is-del" onClick={() => handleDeleteVerdict(v)} aria-label="Delete entry"><X size={11} /></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== 04 / THE DOCKET ===== */}
        <section className="docket-section fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">04</span>
              <h2 className="section-head__title">The <em>Docket</em></h2>
              <Blip text="The actual paperwork. Select any filing to feature it, then open the full document — read the paper itself, and the AI decode beneath it." />
            </div>
            <span className="section-head__count">
              {DOCKET_ENTRIES.length} FILINGS{pdfCount > 0 ? ` · ${pdfCount} PDFS LOADED` : ' ON RECORD'}
            </span>
          </div>

          <article className="docket-entry" key={featured.id} ref={docketCardRef}>
            <div className="docket-entry__main">
              <div className="docket-entry__rail">
                <span className="doc-badge">{featured.status}</span>
                <span className="doc-filed">{featured.docType} · FILED {featured.filed}</span>
              </div>
              <h3 className="docket-entry__case"><CaseName name={featured.caseName} className="case-inner" /></h3>
              <div className="docket-entry__court">{featured.court} · {featured.division}</div>
              <div className="charge-pills">
                {featured.pills.map(p => <span className="charge-pill" key={p}>{p}</span>)}
              </div>
              <div className="docket-decode__head">
                <span className="docket-decode__tag">✦ AI Document Decode</span>
                <span className="docket-decode__count">{featured.decode.length} SECTIONS</span>
              </div>
              <div className="docket-decode">
                {featured.decode.map(s => (
                  <div className="docket-decode__section" key={s.label}>
                    <span className="docket-decode__label">{s.label}</span>
                    <p className="docket-decode__text">{s.text}</p>
                  </div>
                ))}
              </div>
              <button className="docket-inline-link" onClick={() => setActiveDoc(featured)}>Open the full filing →</button>
            </div>

            <aside className="docket-entry__side">
              <div className="docket-side__tag">Case File</div>
              <div className="docket-fact"><span className="docket-fact__label">Case No.</span><span className="docket-fact__value">{featured.caseNo}</span></div>
              <div className="docket-fact"><span className="docket-fact__label">Filed</span><span className="docket-fact__value">{featured.filed}</span></div>
              <div className="docket-fact"><span className="docket-fact__label">Defendants</span><span className="docket-fact__value">{featured.defendants.join(" · ")}</span></div>
              <div className="docket-fact"><span className="docket-fact__label">Charge</span><span className="docket-fact__value">{featured.charges[0]}</span></div>
              {featured.facts.map(f => (
                <div className="docket-fact" key={f.label}>
                  <span className="docket-fact__label">{f.label}</span>
                  <span className="docket-fact__value">{f.value}</span>
                </div>
              ))}
              <button className="docket-view-btn" onClick={() => setActiveDoc(featured)}>View Filing →</button>

              {userRole && (
                <div className="docket-admin">
                  <div className="docket-admin__label">Editor Tools</div>
                  <button className="docket-upload-btn" onClick={() => triggerUpload(featured.id)} disabled={uploadingId === featured.id}>
                    {uploadingId === featured.id ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    {uploadingId === featured.id ? 'Uploading...' : pdfMap[featured.id] ? 'Replace Filing PDF' : 'Load Filing PDF'}
                  </button>
                  {pdfMap[featured.id] && (
                    <button className="docket-upload-btn is-remove" onClick={() => handleRemovePdf(featured.id)}>Remove Filing PDF</button>
                  )}
                  <div className={`docket-pdf-status ${pdfMap[featured.id] ? 'is-ok' : ''}`}>
                    {pdfMap[featured.id] ? 'PDF on record ✓' : 'No PDF loaded'}
                  </div>
                  {uploadError === featured.id && <div className="docket-admin__error">Upload failed — check storage policies</div>}
                </div>
              )}
            </aside>
          </article>

          <div className="docket-list__hint">Select a filing to feature it on the docket · View opens the full document</div>
          <div className="docket-list">
            {DOCKET_ENTRIES.map(entry => (
              <div
                className={`docket-row ${entry.id === featuredId ? 'is-active' : ''}`}
                key={entry.id}
                onClick={() => swapFeature(entry.id)}
              >
                <span className="docket-row__date">{entry.date}</span>
                <span className="docket-row__type">{entry.docType}</span>
                <span className="docket-row__title">{entry.caseName}</span>
                {pdfMap[entry.id] && <span className="row-pdf-badge">PDF</span>}
                <span className="docket-row__court">{entry.court}</span>
                <button
                  className="docket-row__open"
                  onClick={(e) => { e.stopPropagation(); setActiveDoc(entry); }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 05 / LEGAL COVERAGE ===== */}
        <section className="fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">05</span>
              <h2 className="section-head__title">Legal <em>Coverage</em></h2>
              <Blip text="Every legal-tagged story from the newsroom, aggregated into one feed." />
            </div>
            <span className="section-head__count">{articles.length} STORIES</span>
          </div>

          {loading ? (
            <div className="loading-line">Pulling the record...</div>
          ) : articles.length === 0 ? (
            <div className="loading-line">No legal coverage published yet.</div>
          ) : (
            <div className="story-grid">
              {articles.slice(0, 6).map((a, i) => (
                <article className="story" key={i}>
                  <Link href={`/article?title=${encodeURIComponent(a.title)}&source=${encodeURIComponent(a.source || "The Akademy")}`} className="story__image">
                    <img src={a.thumbnail_url || `https://picsum.photos/seed/blotter-${i}/600/375`} alt="" />
                  </Link>
                  <div className="story__kicker">{a.source || "The Akademy"}</div>
                  <Link href={`/article?title=${encodeURIComponent(a.title)}&source=${encodeURIComponent(a.source || "The Akademy")}`}>
                    <h3 className="story__title">{a.title}</h3>
                  </Link>
                  <div className="story__meta">By <strong>DJ Akademiks</strong> · {isMounted ? new Date(a.created_at).toLocaleDateString() : ""}</div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <SiteFooter />

      {/* ===== DOCUMENT VIEWER MODAL ===== */}
      {activeDoc && (
        <div className="doc-modal" onClick={() => setActiveDoc(null)}>
          <div className="doc-modal__backdrop"></div>
          <div className="doc-modal__frame" onClick={(e) => e.stopPropagation()}>
            <div className="doc-modal__head">
              <span className="doc-badge">{activeDoc.status}</span>
              <span className="doc-modal__type">{activeDoc.docType}</span>
              <h3 className="doc-modal__case"><CaseName name={activeDoc.caseName} className="case-inner" /></h3>
              <button className="doc-modal__close" onClick={() => setActiveDoc(null)} aria-label="Close"><X size={16} /></button>
            </div>

            {showTabs && (
              <div className="doc-tabs">
                <button className={`doc-tab ${docTab === 'filing' ? 'is-active' : ''}`} onClick={() => setDocTab('filing')}>The Filing</button>
                <button className={`doc-tab ${docTab === 'decode' ? 'is-active' : ''}`} onClick={() => setDocTab('decode')}>The Decode</button>
              </div>
            )}

            <div className="doc-modal__body">
              <div className="doc-modal__paper">

                {docTab === 'filing' && activePdf && (
                  <>
                    <div className="pdf-controls">
                      <span className="pdf-controls__src">Source: Court Record · {activeDoc.caseNo}</span>
                      <button className="pdf-fullscreen-btn" onClick={() => openFullscreen(activeDoc)}>
                        <Maximize2 size={12} /> Full Screen
                      </button>
                    </div>
                    <iframe src={`${activePdf}#view=FitH`} title={activeDoc.caseName} />
                    {userRole && (
                      <div className="doc-replace-row">
                        <button className="doc-replace" onClick={() => triggerUpload(activeDoc.id)}>
                          {uploadingId === activeDoc.id ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                          {uploadingId === activeDoc.id ? 'Uploading replacement...' : 'Replace PDF'}
                        </button>
                        <button className="doc-replace is-remove" onClick={() => handleRemovePdf(activeDoc.id)}>
                          <X size={12} /> Remove
                        </button>
                      </div>
                    )}
                  </>
                )}

                {docTab === 'filing' && !activePdf && userRole && (
                  <div
                    className="doc-dropzone"
                    onClick={() => triggerUpload(activeDoc.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleUpload(activeDoc.id, f);
                    }}
                  >
                    {uploadingId === activeDoc.id ? (
                      <>
                        <Loader2 size={22} className="animate-spin" />
                        <div className="doc-dropzone__title">Uploading the filing...</div>
                        <div className="doc-dropzone__sub">Storing to the case file</div>
                      </>
                    ) : (
                      <>
                        <Upload size={22} />
                        <div className="doc-dropzone__title">Drop the filing PDF here</div>
                        <div className="doc-dropzone__sub">Or click to browse · PDF only</div>
                        <div className="doc-dropzone__hint">Loads instantly into the viewer for every reader</div>
                      </>
                    )}
                    {uploadError === activeDoc.id && <div className="docket-admin__error">Upload failed — check storage policies</div>}
                  </div>
                )}

                {docTab === 'decode' && (
                  <>
                    <div className="doc-brief-tag">✦ Akademy AI · Document Decode</div>
                    <div className="doc-brief-title">The Filing, <em>Translated</em></div>
                    <div className="doc-brief-sub">What this document says, in plain English.</div>
                    {activeDoc.decode.map(s => (
                      <div className="doc-brief-section" key={s.label}>
                        <span className="doc-brief-label">{s.label}</span>
                        <p className="doc-brief-text">{s.text}</p>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <aside className="doc-modal__facts">
                <div className="docket-side__tag">Case File</div>
                <div className="docket-fact"><span className="docket-fact__label">Case No.</span><span className="docket-fact__value">{activeDoc.caseNo}</span></div>
                <div className="docket-fact"><span className="docket-fact__label">Court</span><span className="docket-fact__value">{activeDoc.court}</span></div>
                <div className="docket-fact"><span className="docket-fact__label">Filed</span><span className="docket-fact__value">{activeDoc.filed}</span></div>
                <div className="docket-fact"><span className="docket-fact__label">Doc Type</span><span className="docket-fact__value">{activeDoc.docType}</span></div>
                <div className="docket-fact"><span className="docket-fact__label">Defendants</span><span className="docket-fact__value">{activeDoc.defendants.join(" · ")}</span></div>
                <div className="docket-fact"><span className="docket-fact__label">Charges</span><span className="docket-fact__value">{activeDoc.charges.join(" · ")}</span></div>
                {activeDoc.facts.map(f => (
                  <div className="docket-fact" key={f.label}>
                    <span className="docket-fact__label">{f.label}</span>
                    <span className="docket-fact__value">{f.value}</span>
                  </div>
                ))}
              </aside>
            </div>

            <div className="doc-modal__foot">
              <span>SOURCE: FEDERAL COURT RECORDS</span>
              <span>DECODED BY AKADEMY AI · NOT LEGAL ADVICE</span>
            </div>
          </div>
        </div>
      )}

      {/* ===== FULLSCREEN PDF READER ===== */}
      {fsDoc && (pdfMap[fsDoc.id] || fsDoc.pdf_url) && (
        <div className="pdf-fullscreen" ref={fsRef}>
          <div className="pdf-fullscreen__bar">
            <span className="doc-badge">{fsDoc.status}</span>
            <span className="doc-modal__type">{fsDoc.docType}</span>
            <h3 className="pdf-fullscreen__case"><CaseName name={fsDoc.caseName} className="case-inner" /></h3>
            <button className="pdf-fullscreen__exit" onClick={closeFullscreen}>
              <X size={12} /> Exit Full Screen
            </button>
          </div>
          <iframe src={`${(pdfMap[fsDoc.id] || fsDoc.pdf_url)}#view=FitH`} title={fsDoc.caseName} />
        </div>
      )}
    </div>
  );
}