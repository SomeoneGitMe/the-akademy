"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { X, Plus, Loader2, Sparkles } from "lucide-react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import { supabaseBrowser } from "../utils/supabaseBrowser";

interface PublishedArticle {
  title: string; source: string; thumbnail_url: string;
  created_at: string; tags: string[];
}

/* ============================================================
   DATA LAYER — seeds double as the DB publish source.
   ============================================================ */

type MoveType = "EXIT" | "HIRE" | "REUP" | "PROMOTION";
const MOVE_TYPES: MoveType[] = ["EXIT", "HIRE", "REUP", "PROMOTION"];

interface Deal {
  id: string;
  dbId?: string;
  status: string;
  date: string;
  artist: string;
  counterparty: string;
  dealType: string;
  listType: string;
  value: string;
  pills: string[];
  allocation: { label: string; pct: number }[];
  ledger: { label: string; value: string; accent?: boolean }[];
  finePrint: string[];
  read: string;
  sideFacts: { label: string; value: string }[];
}

interface WireMove {
  dbId?: string;
  date: string;
  name: string;
  from: string;
  to: string;
  role: string;
  type: MoveType;
  impact: string;
}

interface IndieCase {
  dbId?: string;
  name: string;
  path: "INDIE" | "RECLAIM";
  play: string;
  metric: string;
  text: string;
}

const SEED_DEALS: Deal[] = [
  {
    id: "drake-umg",
    status: "REPORTED",
    date: "2022",
    artist: "Drake",
    counterparty: "Universal Music Group",
    dealType: "Multi-Album Recording Agreement",
    listType: "Recording Deal",
    value: "~$400M",
    pills: ["MASTERS · IN PERPETUITY", "MULTI-ALBUM", "PREMIUM ROYALTY TIER"],
    allocation: [
      { label: "Advances & Commitments", pct: 55 },
      { label: "Catalog & Marketing", pct: 30 },
      { label: "Adjacent Rights", pct: 15 },
    ],
    ledger: [
      { label: "Reported Value", value: "~$400M", accent: true },
      { label: "Structure", value: "ADVANCE-HEAVY · MULTI-ALBUM" },
      { label: "Masters", value: "UMG · IN PERPETUITY" },
      { label: "Royalty Tier", value: "PREMIUM (EST.)" },
      { label: "Recoupment", value: "ALL COSTS → ARTIST SHARE" },
    ],
    finePrint: [
      "The advance is a loan, not a gift. Recording, video, and marketing costs recoup from the artist's royalty share before a single new dollar is paid out.",
      "Cross-collateralization: underperformance on one album can be offset against another album's earnings inside the same deal.",
      "The masters remain label property in perpetuity — the streaming catalog outlives the contract, and that catalog is what the money was really buying.",
    ],
    read: "Why does the biggest streaming artist on the planet re-up with a major instead of walking with his audience? Leverage. UMG's radio, touring, and global marketing infrastructure plus a nine-figure guarantee beats a bigger percentage of a slower independent build. The trade is clean: maximum scale in exchange for maximum ownership. Every stream of every record feeds the label catalog forever — and 'forever' was the line item UMG paid ~$400M reported to secure.",
    sideFacts: [
      { label: "Buyer", value: "UNIVERSAL MUSIC GROUP" },
      { label: "Type", value: "RECORDING AGREEMENT" },
      { label: "Reported", value: "2022" },
      { label: "Multiple", value: "N/A · GOING CONCERN" },
      { label: "Status", value: "REPORTED" },
    ],
  },
  {
    id: "mj-estate-sony",
    status: "CLOSED",
    date: "2024",
    artist: "Michael Jackson Estate",
    counterparty: "Sony Music",
    dealType: "Catalog Acquisition — 50% Stake",
    listType: "Catalog Sale",
    value: "~$600M",
    pills: ["MASTERS · 50%", "PUBLISHING SHARE", "PERPETUAL"],
    allocation: [
      { label: "Masters", pct: 55 },
      { label: "Publishing (Mijac)", pct: 30 },
      { label: "Name & Likeness Rights", pct: 15 },
    ],
    ledger: [
      { label: "Price", value: "~$600M", accent: true },
      { label: "Stake Sold", value: "50% OF CATALOG" },
      { label: "Est. Annual Income", value: "~$35M+" },
      { label: "Implied Multiple", value: "~17X", accent: true },
      { label: "Term", value: "PERPETUAL" },
    ],
    finePrint: [
      "Sony buys perpetual ownership — this is a dividend stream, not a license with an expiry date.",
      "The estate retains the remaining 50% and continues earning its full share on the assets it kept.",
      "Catalog income is annuity-like: sync placements, streaming, and radio rotation don't age the way singles do.",
    ],
    read: "Fifteen years after his death, Michael Jackson still out-earns most living artists — which is exactly why this deal is the benchmark every catalog on the market is priced against. Sony reportedly paid ~$600M for half the estate's catalog, a ~17x multiple on annual royalties. The logic for the buyer: catalogs trade like bonds with upside. 'Billie Jean' doesn't need a rollout or a marketing budget; it needs an owner collecting the checks.",
    sideFacts: [
      { label: "Buyer", value: "SONY MUSIC" },
      { label: "Type", value: "CATALOG ACQUISITION" },
      { label: "Reported", value: "2024" },
      { label: "Multiple", value: "~17X ROYALTIES" },
      { label: "Status", value: "CLOSED" },
    ],
  },
  {
    id: "springsteen-sony",
    status: "CLOSED",
    date: "2021",
    artist: "Bruce Springsteen",
    counterparty: "Sony Music",
    dealType: "Catalog + Name & Likeness",
    listType: "Catalog + N&L",
    value: "~$550M",
    pills: ["MASTERS", "PUBLISHING", "NAME & LIKENESS"],
    allocation: [
      { label: "Masters", pct: 40 },
      { label: "Publishing", pct: 35 },
      { label: "Name & Likeness", pct: 25 },
    ],
    ledger: [
      { label: "Price", value: "~$550M", accent: true },
      { label: "Assets", value: "MASTERS + PUBLISHING + N&L" },
      { label: "Est. Annual Income", value: "~$30M" },
      { label: "Implied Multiple", value: "~18X", accent: true },
      { label: "First of Its Kind", value: "N&L PRICED AS ASSET" },
    ],
    finePrint: [
      "The deal's innovation: name and likeness explicitly priced as a separate, ownable asset class — the first mega-deal to do it.",
      "Publishing (the songwriting side) went to Sony's publishing arm, consolidating both halves of the copyright under one roof.",
      "Catalog income at this scale behaves like infrastructure: predictable, diversified across sync, streaming, and radio.",
    ],
    read: "The Boss moved the market twice with one signature. First by proving a living legend's catalog could clear half a billion dollars, and second by explicitly pricing his name and likeness — treating the person himself as an asset class. Every artist-brand valuation negotiated since runs on the rails this deal built. When your likeness has a line item, the whole concept of 'selling out' gets a price tag.",
    sideFacts: [
      { label: "Buyer", value: "SONY MUSIC" },
      { label: "Type", value: "CATALOG + NAME & LIKENESS" },
      { label: "Reported", value: "2021" },
      { label: "Multiple", value: "~18X ROYALTIES" },
      { label: "Status", value: "CLOSED" },
    ],
  },
  {
    id: "dre-shamrock",
    status: "CLOSED",
    date: "2023",
    artist: "Dr. Dre",
    counterparty: "Shamrock Capital + UMG",
    dealType: "Passive Royalty Streams",
    listType: "Royalty Streams",
    value: "~$205M",
    pills: ["ROYALTY STREAMS", "NO EQUITY SOLD", "PRODUCER SHARE"],
    allocation: [
      { label: "Solo Masters Points", pct: 50 },
      { label: "Producer Royalties", pct: 30 },
      { label: "Writer Share", pct: 20 },
    ],
    ledger: [
      { label: "Price", value: "~$205M", accent: true },
      { label: "Assets", value: "ROYALTY STREAMS ONLY" },
      { label: "Excluded", value: "DEATH ROW · AFTERMATH EQUITY" },
      { label: "Est. Annual Income", value: "~$10M" },
      { label: "Implied Multiple", value: "~20X", accent: true },
    ],
    finePrint: [
      "Only passive income streams were sold — label equity and ownership stakes were never on the table.",
      "Split between two buyers: Shamrock took the artist and writer shares, Universal took the label-side share.",
      "The streams sold are the annuity; the equity kept is the company. Different assets, different buyers, same artist.",
    ],
    read: "Dre sold the annuity and kept the company. The ~$205M covered royalty streams — his solo master points, producer share, and writer's share — while his equity stayed entirely his. The structure became the template for hip-hop catalog deals: you can monetize the flow without ever selling the pipe. It's the most sophisticated answer yet to the question every legacy artist faces — how do you cash out without giving up the business?",
    sideFacts: [
      { label: "Buyers", value: "SHAMROCK · UMG" },
      { label: "Type", value: "ROYALTY STREAM SALE" },
      { label: "Reported", value: "2023" },
      { label: "Multiple", value: "~20X STREAMS" },
      { label: "Status", value: "CLOSED" },
    ],
  },
];

const SEED_MOVES: WireMove[] = [
  { date: "07.25", name: "Sylvia Rhone", from: "Epic Records", to: "—", role: "Chairman & CEO", type: "EXIT", impact: "Exits after twelve years atop Epic — one of the longest and most powerful runs by any woman in label history. The chair sits vacant and the industry is watching who inherits it." },
  { date: "09.24", name: "Julie Greenwald", from: "Atlantic Music Group", to: "—", role: "Chairman & COO", type: "EXIT", impact: "The architect of modern Atlantic — the Cardi, Ed, and Bruno eras — exits as the label consolidates under new leadership. The end of a two-decade dynasty." },
  { date: "05.24", name: "Elliott Grainge", from: "10K Projects", to: "Atlantic Music Group", role: "CEO", type: "HIRE", impact: "The 10K founder — and son of UMG chief Lucian Grainge — takes Atlantic's top job. A new-generation chief who built his label on artist services and revenue splits, not advances." },
  { date: "02.24", name: "Ethiopia Habtemariam", from: "Motown Records", to: "—", role: "Chairman & CEO", type: "EXIT", impact: "Steps down after rebuilding Motown around quality-over-quantity releases. One of music's most storied imprints is searching for direction again." },
  { date: "05.25", name: "Lyor Cohen", from: "YouTube", to: "—", role: "Global Head of Music", type: "EXIT", impact: "The ex-Def Jam architect leaves YouTube after eight years running its music strategy. Watch where he lands — when Lyor moves, the industry reorganizes around it." },
  { date: "05.24", name: "Lucian Grainge", from: "Universal Music Group", to: "UMG · THROUGH 2028", role: "Chairman & CEO", type: "REUP", impact: "Re-ups with an equity-heavy package and a succession clock now officially ticking. The most powerful executive in music is planning his own ending — the industry's biggest open question." },
  { date: "01.23", name: "Robert Kyncl", from: "Netflix / YouTube", to: "Warner Music Group", role: "CEO", type: "HIRE", impact: "The tech-exec experiment: a data-first chief running a sixty-year-old music company. Cost discipline and catalog strategy over glamour signings — Wall Street's kind of music executive." },
  { date: "01.22", name: "Tunji Balogun", from: "Interscope", to: "Def Jam", role: "CEO", type: "HIRE", impact: "The A&R savant behind some of the decade's biggest signings takes the most storied brand in hip-hop. Charged with making Def Jam cultural again after the pop era." },
];

const SEED_CASES: IndieCase[] = [
  { name: "Russ", path: "INDIE", play: "The Recoupment Refusal", metric: "100% OWNERSHIP · $0 ADVANCE", text: "Built DIEMON without a label, financed his early records himself, and turned the majors down when they came calling — because he'd done the math on recoupment. The albums charted anyway, the tours sold out, and every stream pays the artist first. The lesson isn't that labels are evil; it's that ownership compounds and leverage is built before the meeting, not during it." },
  { name: "Nipsey Hussle", path: "INDIE", play: "Proud 2 Pay", metric: "$100 × 1,000 = $100K · 0 MIDDLEMEN", text: "Crenshaw pressed 1,000 copies at $100 each and sold every single one — direct-to-fan, no distributor margin, no advance to recoup. A mixtape grossed like a small label's quarter. Scarcity plus ownership turned the free-mixtape economy into a pricing event, and the majors called after the proof, not before it." },
  { name: "Chance the Rapper", path: "INDIE", play: "The No-Label Grammys", metric: "3 GRAMMYS · 0 LABELS", text: "Coloring Book won Best Rap Album as a streaming-only release — the first in history — backed by an exclusive Apple partnership reported in the seven figures. He replaced the label advance with a platform deal, kept his masters, and forced the Recording Academy to rewrite its eligibility rules. Proof that distribution leverage, not a label, is the actual asset." },
  { name: "Taylor Swift", path: "RECLAIM", play: "The Re-Record Masterclass", metric: "TAYLOR'S VERSION OUT-EARNS THE ORIGINALS", text: "Her first six albums' masters were sold out from under her — twice. Her answer: re-record everything. The 'Taylor's Version' releases didn't just reclaim the income; they devalued the originals with every chart-topping re-do. The greatest ownership play in music history was executed by rewriting the asset itself." },
];

const SPLIT_ROWS: { metric: string; indie: string; major: string }[] = [
  { metric: "Masters Ownership", indie: "100% ARTIST", major: "LABEL · IN PERPETUITY" },
  { metric: "Net Recording Royalty", indie: "~60–85%", major: "~15–22%" },
  { metric: "Upfront Capital", indie: "$0 — SELF-FUNDED", major: "$250K–$1M+ ADVANCE" },
  { metric: "Recoupment", indie: "NONE — NO ADVANCE", major: "ALL COSTS FROM ARTIST SHARE" },
  { metric: "Creative Control", indie: "TOTAL", major: "COMMITTEE APPROVAL" },
  { metric: "Marketing Reach", indie: "ORGANIC · DIY", major: "GLOBAL MACHINE" },
  { metric: "First Dollar Timing", indie: "STREAM ONE", major: "AFTER RECOUPMENT" },
  { metric: "Catalog at Exit", indie: "YOU SELL IT · 15–25X", major: "THE LABEL OWNS IT" },
];

const POWER_MAP: { label: string; parent: string; chief: string; since: string }[] = [
  { label: "Republic", parent: "UMG · Lucian Grainge", chief: "Monte Lipman", since: "1995 · FOUNDER" },
  { label: "Interscope", parent: "UMG", chief: "John Janick", since: "2014" },
  { label: "Def Jam", parent: "UMG", chief: "Tunji Balogun", since: "2022" },
  { label: "Atlantic", parent: "WMG · Robert Kyncl", chief: "Elliott Grainge", since: "2024" },
  { label: "Warner Records", parent: "WMG", chief: "Corson & Bay-Schuck", since: "2018" },
  { label: "Columbia", parent: "SONY · Rob Stringer", chief: "Ron Perry", since: "2018" },
  { label: "Epic", parent: "SONY", chief: "Search Underway", since: "2025 · VACANT" },
];

const PER_STREAM = 0.0035;
const INDIE_KEEP = 0.85;
const MAJOR_RATE = 0.20;
const ADVANCE = 250000;
const RECOUP_STREAMS = Math.round(ADVANCE / (PER_STREAM * MAJOR_RATE));

const STREAM_CHIPS = [
  { v: 100000, label: "100K" },
  { v: 1000000, label: "1M" },
  { v: 10000000, label: "10M" },
  { v: 100000000, label: "100M" },
];

/* ============ SHARED BITS ============ */

const Blip = ({ text }: { text: string }) => (
  <span className="help-icon-wrapper">
    <span className="help-icon">?</span>
    <span className="help-tooltip">{text}</span>
  </span>
);

const fmtMoney = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'deal';
const dealKey = (d: Deal) => d.dbId || d.id;
const moveKey = (m: WireMove) => m.dbId || `${m.name}-${m.date}`;
const caseKey = (c: IndieCase) => c.dbId || c.name;

const mapDealRow = (r: any): Deal => ({
  dbId: r.id,
  id: r.slug,
  status: r.status || 'REPORTED',
  date: r.date || '',
  artist: r.artist || '',
  counterparty: r.counterparty || '',
  dealType: r.deal_type || '',
  listType: r.list_type || 'Deal',
  value: r.value || '',
  pills: Array.isArray(r.pills) ? r.pills : [],
  allocation: Array.isArray(r.allocation) ? r.allocation : [],
  ledger: Array.isArray(r.ledger) ? r.ledger : [],
  finePrint: Array.isArray(r.fine_print) ? r.fine_print : [],
  read: r.the_read || '',
  sideFacts: Array.isArray(r.side_facts) ? r.side_facts : [],
});

const mapMoveRow = (r: any): WireMove => ({
  dbId: r.id,
  date: r.date || '',
  name: r.name || '',
  from: r.from_label || '—',
  to: r.to_label || '—',
  role: r.role || '',
  type: (MOVE_TYPES.includes(String(r.type).toUpperCase() as MoveType) ? String(r.type).toUpperCase() : 'HIRE') as MoveType,
  impact: r.impact || '',
});

const mapCaseRow = (r: any): IndieCase => ({
  dbId: r.id,
  name: r.name || '',
  path: r.path === 'RECLAIM' ? 'RECLAIM' : 'INDIE',
  play: r.play || '',
  metric: r.metric || '',
  text: r.story || '',
});

/* ============ PAGE ============ */

export default function IndustryPage() {
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // The Bag — DB-backed
  const [deals, setDeals] = useState<Deal[]>(SEED_DEALS);
  const [featuredKey, setFeaturedKey] = useState<string>("drake-umg");
  const dealCardRef = useRef<HTMLElement>(null);

  // The Bag — add form
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [savingDeal, setSavingDeal] = useState(false);
  const [dealError, setDealError] = useState<string | null>(null);
  const [dArtist, setDArtist] = useState("");
  const [dCounter, setDCounter] = useState("");
  const [dValue, setDValue] = useState("");
  const [dDate, setDDate] = useState("");
  const [dType, setDType] = useState("");
  const [dStatus, setDStatus] = useState("REPORTED");
  const [dPills, setDPills] = useState("");
  const [dFine, setDFine] = useState("");
  const [dRead, setDRead] = useState("");

  // The Wire — DB-backed
  const [moves, setMoves] = useState<WireMove[]>(SEED_MOVES);

  // The Wire — add form
  const [showAddMove, setShowAddMove] = useState(false);
  const [savingMove, setSavingMove] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [mDate, setMDate] = useState("");
  const [mName, setMName] = useState("");
  const [mFrom, setMFrom] = useState("");
  const [mTo, setMTo] = useState("");
  const [mRole, setMRole] = useState("");
  const [mType, setMType] = useState<MoveType>("HIRE");
  const [mImpact, setMImpact] = useState("");
  const [aiDrafting, setAiDrafting] = useState(false);

  // Indie vs. Major — DB-backed
  const [cases, setCases] = useState<IndieCase[]>(SEED_CASES);

  // Indie vs. Major — add form
  const [showAddCase, setShowAddCase] = useState(false);
  const [savingCase, setSavingCase] = useState(false);
  const [caseError, setCaseError] = useState<string | null>(null);
  const [cName, setCName] = useState("");
  const [cPath, setCPath] = useState<"INDIE" | "RECLAIM">("INDIE");
  const [cPlay, setCPlay] = useState("");
  const [cMetric, setCMetric] = useState("");
  const [cText, setCText] = useState("");
  const [caseAiDrafting, setCaseAiDrafting] = useState(false);

  // P&L
  const [streams, setStreams] = useState<number>(1000000);

  const featured = deals.find(d => dealKey(d) === featuredKey) || deals[0];

  useEffect(() => {
    setIsMounted(true);
    fetch('/api/published-articles')
      .then(res => res.json())
      .then(data => {
        const filtered = (data.articles || []).filter((a: PublishedArticle) =>
          (a.tags || []).map(t => t.toLowerCase()).includes('industry')
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

  // Role check + seed + fetch (the Ledger pattern)
  const fetchDeals = useCallback(async () => {
    try {
      const { data, error: dbErr } = await supabaseBrowser.from('deals').select('*').order('created_at', { ascending: false });
      if (!dbErr && data && data.length > 0) setDeals(data.map(mapDealRow));
    } catch (e) { /* keep seed */ }
  }, []);

  const fetchMoves = useCallback(async () => {
    try {
      const { data, error: dbErr } = await supabaseBrowser.from('exec_moves').select('*').order('created_at', { ascending: false });
      if (!dbErr && data && data.length > 0) setMoves(data.map(mapMoveRow));
    } catch (e) { /* keep seed */ }
  }, []);

  const fetchCases = useCallback(async () => {
    try {
      const { data, error: dbErr } = await supabaseBrowser.from('indie_cases').select('*').order('created_at', { ascending: false });
      if (!dbErr && data && data.length > 0) setCases(data.map(mapCaseRow));
    } catch (e) { /* keep seed */ }
  }, []);

  const seedIfEmpty = useCallback(async () => {
    try {
      const { count: dealCount } = await supabaseBrowser.from('deals').select('*', { count: 'exact', head: true });
      if (dealCount === 0) {
        await supabaseBrowser.from('deals').insert(SEED_DEALS.map(d => ({
          slug: d.id, status: d.status, date: d.date, artist: d.artist, counterparty: d.counterparty,
          deal_type: d.dealType, list_type: d.listType, value: d.value,
          pills: d.pills, allocation: d.allocation, ledger: d.ledger,
          fine_print: d.finePrint, the_read: d.read, side_facts: d.sideFacts,
        })));
      }
      const { count: moveCount } = await supabaseBrowser.from('exec_moves').select('*', { count: 'exact', head: true });
      if (moveCount === 0) {
        await supabaseBrowser.from('exec_moves').insert(SEED_MOVES.map(m => ({
          date: m.date, name: m.name, from_label: m.from, to_label: m.to,
          role: m.role, type: m.type, impact: m.impact,
        })));
      }
      const { count: caseCount } = await supabaseBrowser.from('indie_cases').select('*', { count: 'exact', head: true });
      if (caseCount === 0) {
        await supabaseBrowser.from('indie_cases').insert(SEED_CASES.map(c => ({
          name: c.name, path: c.path, play: c.play, metric: c.metric, story: c.text,
        })));
      }
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: { session } } = await supabaseBrowser.auth.getSession();
        if (!session) { fetchDeals(); fetchMoves(); fetchCases(); return; }
        const { data: profile } = await supabaseBrowser.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile && (profile.role === 'admin' || profile.role === 'editor')) {
          setUserRole(profile.role);
          await seedIfEmpty();
        }
      } catch (e) { /* anon */ }
      fetchDeals();
      fetchMoves();
      fetchCases();
    };
    checkRole();
  }, [fetchDeals, fetchMoves, fetchCases, seedIfEmpty]);

  const swapDeal = (key: string) => {
    if (key === featuredKey) return;
    setFeaturedKey(key);
    if (typeof window !== 'undefined' && window.innerWidth < 1000) {
      setTimeout(() => dealCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    }
  };

  // ===== THE BAG — add / delete =====
  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dArtist.trim() || !dCounter.trim() || !dValue.trim()) {
      setDealError("Artist, counterparty, and value are required.");
      return;
    }
    setSavingDeal(true); setDealError(null);
    try {
      const pills = dPills.split(',').map(s => s.trim()).filter(Boolean);
      const finePrint = dFine.split('\n').map(s => s.trim()).filter(Boolean);
      const dealType = dType.trim() || 'Deal';
      const status = dStatus || 'REPORTED';
      const payload = {
        slug: `${slugify(dArtist)}-${Date.now().toString(36).slice(-4)}`,
        status, date: dDate.trim() || '—', artist: dArtist.trim(), counterparty: dCounter.trim(),
        deal_type: dealType, list_type: dealType.includes('Catalog') ? 'Catalog Sale' : 'Deal',
        value: dValue.trim(), pills, allocation: [],
        ledger: [
          { label: 'Reported Value', value: dValue.trim(), accent: true },
          { label: 'Structure', value: dealType.toUpperCase() },
          { label: 'Status', value: status },
        ],
        fine_print: finePrint,
        the_read: dRead.trim(),
        side_facts: [
          { label: 'Counterparty', value: dCounter.trim().toUpperCase() },
          { label: 'Type', value: dealType },
          { label: 'Reported', value: dDate.trim() || '—' },
          { label: 'Status', value: status },
        ],
      };
      const { data, error: insErr } = await supabaseBrowser.from('deals').insert(payload).select().single();
      if (insErr) throw new Error(insErr.message);
      const mapped = mapDealRow(data);
      setDeals(prev => [mapped, ...prev]);
      setFeaturedKey(dealKey(mapped));
      setDArtist(""); setDCounter(""); setDValue(""); setDDate("");
      setDType(""); setDPills(""); setDFine(""); setDRead("");
      setShowAddDeal(false);
    } catch (err: any) {
      setDealError("Save failed — run SQL 08 and check the deals table.");
    }
    setSavingDeal(false);
  };

  const handleDeleteDeal = async (d: Deal) => {
    if (!d.dbId) return;
    try {
      await supabaseBrowser.from('deals').delete().eq('id', d.dbId);
      setDeals(prev => prev.filter(x => x.dbId !== d.dbId));
      if (dealKey(d) === featuredKey) setFeaturedKey(dealKey(deals.find(x => x.dbId !== d.dbId) || SEED_DEALS[0]));
    } catch (e) { /* no-op */ }
  };

  // ===== THE WIRE — add / delete / AI draft =====
  const handleAddMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim()) {
      setMoveError("A name is required.");
      return;
    }
    setSavingMove(true); setMoveError(null);
    try {
      const payload = {
        date: mDate.trim() || '—', name: mName.trim(),
        from_label: mFrom.trim() || '—', to_label: mTo.trim() || '—',
        role: mRole.trim(), type: mType, impact: mImpact.trim(),
      };
      const { data, error: insErr } = await supabaseBrowser.from('exec_moves').insert(payload).select().single();
      if (insErr) throw new Error(insErr.message);
      setMoves(prev => [mapMoveRow(data), ...prev]);
      setMDate(""); setMName(""); setMFrom(""); setMTo(""); setMRole(""); setMImpact("");
      setShowAddMove(false);
    } catch (err: any) {
      setMoveError("Save failed — run SQL 09 and check the exec_moves table.");
    }
    setSavingMove(false);
  };

  const handleDeleteMove = async (m: WireMove) => {
    if (!m.dbId) return;
    try {
      await supabaseBrowser.from('exec_moves').delete().eq('id', m.dbId);
      setMoves(prev => prev.filter(x => x.dbId !== m.dbId));
    } catch (e) { /* no-op */ }
  };

  const handleDraftRead = async () => {
    if (!mName.trim() || aiDrafting) return;
    setAiDrafting(true);
    try {
      const res = await fetch('/api/boardroom-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'move', name: mName, from: mFrom, to: mTo, role: mRole, type: mType }),
      });
      const data = await res.json();
      if (data.text) setMImpact(data.text);
    } catch (e) { /* leave manual */ }
    setAiDrafting(false);
  };

  // ===== INDIE VS MAJOR — add / delete / AI draft =====
  const handleAddCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cText.trim()) {
      setCaseError("Name and the story are required.");
      return;
    }
    setSavingCase(true); setCaseError(null);
    try {
      const payload = {
        name: cName.trim(), path: cPath, play: cPlay.trim(), metric: cMetric.trim(), story: cText.trim(),
      };
      const { data, error: insErr } = await supabaseBrowser.from('indie_cases').insert(payload).select().single();
      if (insErr) throw new Error(insErr.message);
      setCases(prev => [mapCaseRow(data), ...prev]);
      setCName(""); setCPlay(""); setCMetric(""); setCText("");
      setShowAddCase(false);
    } catch (err: any) {
      setCaseError("Save failed — run SQL 10 and check the indie_cases table.");
    }
    setSavingCase(false);
  };

  const handleDeleteCase = async (c: IndieCase) => {
    if (!c.dbId) return;
    try {
      await supabaseBrowser.from('indie_cases').delete().eq('id', c.dbId);
      setCases(prev => prev.filter(x => x.dbId !== c.dbId));
    } catch (e) { /* no-op */ }
  };

  const handleDraftCase = async () => {
    if (!cName.trim() || caseAiDrafting) return;
    setCaseAiDrafting(true);
    try {
      const res = await fetch('/api/boardroom-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'case', name: cName, path: cPath, play: cPlay, metric: cMetric }),
      });
      const data = await res.json();
      if (data.text) setCText(data.text);
    } catch (e) { /* leave manual */ }
    setCaseAiDrafting(false);
  };

  const handleStreams = (raw: string) => {
    const n = parseInt(raw.replace(/[^0-9]/g, ''), 10);
    setStreams(isNaN(n) ? 0 : n);
  };

  const gross = streams * PER_STREAM;
  const indieNet = gross * INDIE_KEEP;
  const majorAccrued = gross * MAJOR_RATE;
  const maxBar = Math.max(indieNet, majorAccrued) || 1;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Industry" />

      <style dangerouslySetInnerHTML={{ __html: `
        :root { --bg: #0a0a0a; --bg-elev: #131313; --text: #ffffff; --text-soft: #a8a8a8; --text-mute: #6e6e6e; --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25); --line: rgba(255,255,255,0.10); --line-soft: rgba(255,255,255,0.06); --red: #d24239; --green: #6bbf6b; --gold: #d4b896; --ease-quiet: cubic-bezier(.22, 1, .36, 1); }

        .shell { max-width: 1400px; margin: 0 auto; padding: 64px 32px 80px; }

        .page-head { margin-bottom: 64px; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--line); padding-bottom: 32px; }
        .page-head__left { flex: 1; }
        .page-head__num { font-family: monospace; font-size: 12px; letter-spacing: 0.2em; color: var(--accent); margin-bottom: 12px; display: block; }
        .page-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: clamp(48px, 8vw, 96px); line-height: 0.9; letter-spacing: -0.03em; }
        .page-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .page-head__right { text-align: right; font-family: 'Times New Roman', serif; font-style: italic; font-size: 16px; color: var(--text-soft); max-width: 400px; }

        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 32px; border-bottom: 1px solid var(--accent); padding-bottom: 12px; }
        .section-head__left { display: flex; align-items: baseline; gap: 16px; }
        .section-head__num { font-family: monospace; font-size: 11px; letter-spacing: 0.2em; color: var(--accent); }
        .section-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 28px; letter-spacing: -0.01em; }
        .section-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .section-head__count { font-family: monospace; font-size: 10px; letter-spacing: 0.16em; color: var(--text-mute); text-transform: uppercase; }
        .section-head__tools { display: flex; align-items: center; gap: 12px; }

        /* ===== 01 · THE BAG ===== */
        .bag-section { margin-bottom: 80px; }
        .deal-entry { display: grid; grid-template-columns: 1fr 320px; border: 1px solid var(--line); background: var(--bg-elev); margin-bottom: 24px; animation: dealSwap .55s var(--ease-quiet); }
        @keyframes dealSwap { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        .deal-entry__main { padding: 32px; }
        .deal-entry__side { border-left: 1px solid var(--line); padding: 28px; background: var(--bg); display: flex; flex-direction: column; }
        .deal-entry__rail { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; flex-wrap: wrap; }
        .deal-badge { font-family: monospace; font-size: 9px; letter-spacing: 0.16em; color: var(--accent); border: 1px solid var(--accent); padding: 4px 8px; text-transform: uppercase; white-space: nowrap; }
        .deal-filed { font-family: monospace; font-size: 10px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; }
        .deal-artist { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 34px; line-height: 1.05; letter-spacing: -0.015em; margin-bottom: 6px; }
        .deal-counter { font-family: 'Times New Roman', serif; font-style: italic; font-size: 17px; color: var(--text-soft); margin-bottom: 20px; }
        .deal-value__label { font-family: monospace; font-size: 9px; letter-spacing: 0.2em; color: var(--text-mute); text-transform: uppercase; display: block; margin-bottom: 4px; }
        .deal-value { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 44px; line-height: 1; color: var(--accent); margin-bottom: 20px; }
        .deal-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }
        .deal-pill { font-family: monospace; font-size: 9px; letter-spacing: 0.12em; color: var(--text-soft); border: 1px solid var(--line); padding: 5px 10px; text-transform: uppercase; }

        .alloc-label { font-family: monospace; font-size: 8px; letter-spacing: 0.2em; color: var(--text-mute); text-transform: uppercase; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .alloc-label::after { content: ''; flex: 1; height: 1px; background: var(--line-soft); }
        .alloc-bar { display: flex; height: 8px; overflow: hidden; margin-bottom: 12px; }
        .alloc-seg { height: 100%; }
        .alloc-seg.is-1 { background: var(--accent); }
        .alloc-seg.is-2 { background: #8a5c56; }
        .alloc-seg.is-3 { background: var(--text-mute); }
        .alloc-seg.is-4 { background: var(--line); }
        .alloc-legend { display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 28px; }
        .alloc-key { display: inline-flex; align-items: center; gap: 6px; font-family: monospace; font-size: 9px; letter-spacing: 0.1em; color: var(--text-soft); text-transform: uppercase; }
        .alloc-dot { width: 8px; height: 8px; flex-shrink: 0; }
        .alloc-dot.is-1 { background: var(--accent); }
        .alloc-dot.is-2 { background: #8a5c56; }
        .alloc-dot.is-3 { background: var(--text-mute); }
        .alloc-dot.is-4 { background: var(--line); }

        .deal-ledger__head { font-family: monospace; font-size: 8px; letter-spacing: 0.2em; color: var(--text-mute); text-transform: uppercase; margin-bottom: 6px; }
        .deal-ledger__row { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--line-soft); }
        .deal-ledger__row:last-child { border-bottom: none; }
        .deal-ledger__label { font-family: monospace; font-size: 9px; letter-spacing: 0.16em; color: var(--text-mute); text-transform: uppercase; }
        .deal-ledger__value { font-family: monospace; font-size: 11px; letter-spacing: 0.06em; color: var(--text); text-align: right; }
        .deal-ledger__value.is-accent { color: var(--accent); font-size: 13px; font-weight: 700; }

        .fine-print__label { font-family: monospace; font-size: 8px; letter-spacing: 0.2em; color: var(--text-mute); text-transform: uppercase; margin: 24px 0 10px; display: flex; align-items: center; gap: 8px; }
        .fine-print__label::after { content: ''; flex: 1; height: 1px; background: var(--line-soft); }
        .fine-print { list-style: none; border-left: 2px solid var(--line); padding-left: 18px; }
        .fine-print li { font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.55; color: var(--text-soft); margin-bottom: 12px; }
        .fine-print li::before { content: '—'; color: var(--accent); margin-right: 8px; }
        .fine-print li:last-child { margin-bottom: 0; }

        .the-read { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--line); }
        .the-read__label { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; display: block; margin-bottom: 8px; }
        .the-read__text { font-family: 'Times New Roman', serif; font-size: 16px; line-height: 1.65; color: var(--text-soft); }

        .deal-side__tag { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .deal-side__tag::after { content: ''; flex: 1; height: 1px; background: var(--line); }
        .deal-fact { margin-bottom: 16px; }
        .deal-fact__label { font-family: monospace; font-size: 9px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; display: block; margin-bottom: 4px; }
        .deal-fact__value { font-family: monospace; font-size: 11px; color: var(--text); letter-spacing: 0.06em; text-transform: uppercase; line-height: 1.5; }

        .deal-list__hint { font-family: monospace; font-size: 8px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; padding: 10px 0; border-bottom: 1px solid var(--line); }
        .deal-list { border-top: 1px solid var(--line); }
        .deal-row { display: flex; align-items: baseline; gap: 18px; padding: 18px 0; border-bottom: 1px solid var(--line-soft); cursor: pointer; }
        .deal-row:hover .deal-row__title { color: var(--accent); }
        .deal-row__date { font-family: monospace; font-size: 10px; color: var(--text-mute); letter-spacing: 0.08em; width: 48px; flex-shrink: 0; }
        .deal-row__type { font-family: monospace; font-size: 9px; letter-spacing: 0.16em; color: var(--accent); text-transform: uppercase; width: 150px; flex-shrink: 0; }
        .deal-row__title { font-family: 'Times New Roman', serif; font-size: 17px; font-weight: 500; line-height: 1.3; flex: 1; transition: color .3s; }
        .deal-row__value { font-family: monospace; font-size: 11px; color: var(--text-soft); flex-shrink: 0; }
        .deal-row.is-active .deal-row__date { color: var(--accent); }
        .deal-row.is-active .deal-row__title { color: var(--accent); }
        .deal-row.is-active .deal-row__value { color: var(--accent); font-weight: 700; }
        .bag-foot { margin-top: 16px; font-family: monospace; font-size: 8px; letter-spacing: 0.16em; color: var(--text-mute); text-transform: uppercase; text-align: center; }

        /* ===== CRUD FORMS ===== */
        .ledger-add-btn { display: inline-flex; align-items: center; gap: 8px; background: transparent; border: 1px solid var(--accent); color: var(--accent); font-family: monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; padding: 8px 14px; cursor: pointer; transition: all .3s var(--ease-quiet); }
        .ledger-add-btn:hover { background: var(--accent); color: #0a0a0a; }
        .ledger-form { border: 1px solid var(--line); background: var(--bg-elev); padding: 24px; margin-bottom: 28px; display: flex; flex-direction: column; gap: 16px; }
        .ledger-form__row { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 16px; }
        .ledger-field { display: flex; flex-direction: column; gap: 6px; }
        .ledger-field.is-wide { grid-column: 1 / -1; }
        .ledger-field__label { font-family: monospace; font-size: 8px; letter-spacing: 0.18em; color: var(--accent); text-transform: uppercase; }
        .ledger-input, .ledger-select, .ledger-textarea { background: var(--bg); border: 1px solid var(--line); color: var(--text); padding: 10px 12px; font-family: 'Times New Roman', serif; font-size: 14px; outline: none; transition: border-color .3s; width: 100%; }
        .ledger-textarea { font-size: 14px; line-height: 1.6; resize: vertical; min-height: 80px; }
        .ledger-textarea.is-tall { min-height: 110px; }
        .ledger-input:focus, .ledger-select:focus, .ledger-textarea:focus { border-color: var(--accent); }
        .ledger-select { font-family: monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; }
        .ledger-select option { background: #131313; color: #fff; }
        .ledger-input__hint { font-family: monospace; font-size: 7px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; }
        .ledger-form__actions { display: flex; gap: 12px; justify-content: flex-end; align-items: center; flex-wrap: wrap; }
        .ledger-submit { display: inline-flex; align-items: center; gap: 8px; background: var(--accent); color: #0a0a0a; border: none; font-family: monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700; padding: 10px 18px; cursor: pointer; }
        .ledger-submit:disabled { opacity: .6; cursor: wait; }
        .ledger-cancel { background: none; border: 1px solid var(--line); color: var(--text-mute); font-family: monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; padding: 10px 18px; cursor: pointer; }
        .ledger-cancel:hover { border-color: var(--text-soft); color: var(--text-soft); }
        .ledger-form__error { font-family: monospace; font-size: 9px; letter-spacing: 0.1em; color: var(--red); text-transform: uppercase; }
        .ai-draft-btn { display: inline-flex; align-items: center; gap: 8px; background: transparent; border: 1px solid var(--accent-soft); color: var(--accent); font-family: monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; padding: 10px 18px; cursor: pointer; transition: all .3s var(--ease-quiet); }
        .ai-draft-btn:hover:not(:disabled) { border-color: var(--accent); border-style: solid; }
        .ai-draft-btn:disabled { opacity: .6; cursor: wait; }

        .ledger-icon-btn { background: none; border: 1px solid transparent; color: var(--text-mute); width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: all .3s; flex-shrink: 0; }
        .deal-row:hover .ledger-icon-btn, .wire-row:hover .ledger-icon-btn, .case-card:hover .ledger-icon-btn { opacity: 1; }
        .ledger-icon-btn:hover { color: var(--accent); border-color: var(--accent); }
        .ledger-icon-btn.is-del:hover { color: var(--red); border-color: var(--red); }

        /* ===== 02 · SPLIT BOARD + CASES ===== */
        .split-section { margin-bottom: 80px; }
        .split-board { border: 1px solid var(--line); background: var(--bg-elev); }
        .split-row { display: grid; grid-template-columns: 240px 1fr 1fr; gap: 24px; align-items: baseline; padding: 16px 24px; border-bottom: 1px solid var(--line-soft); }
        .split-row:last-child { border-bottom: none; }
        .split-row.is-head { padding: 18px 24px; border-bottom: 1px solid var(--line); }
        .split-metric { font-family: monospace; font-size: 10px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; }
        .split-head-pill { font-family: monospace; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; padding: 5px 12px; border: 1px solid var(--line); color: var(--text-soft); justify-self: start; }
        .split-head-pill.is-indie { color: var(--green); border-color: var(--green); }
        .split-head-pill.is-major { color: var(--accent); border-color: var(--accent); }
        .split-val { font-family: monospace; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text); }
        .split-val.is-indie { color: var(--green); }
        .split-val.is-major { color: var(--text-soft); }

        .case-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 40px; }
        .case-card { border: 1px solid var(--line); background: var(--bg-elev); padding: 26px; display: flex; flex-direction: column; gap: 12px; }
        .case-card__head { display: flex; justify-content: space-between; align-items: center; }
        .case-card__pill { font-family: monospace; font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; padding: 4px 10px; border: 1px solid var(--line); color: var(--text-soft); }
        .case-card__pill.is-indie { color: var(--green); border-color: var(--green); }
        .case-card__pill.is-reclaim { color: var(--gold); border-color: rgba(212,184,150,0.5); }
        .case-card__name { font-family: 'Times New Roman', serif; font-size: 24px; font-weight: 700; line-height: 1.1; }
        .case-card__play { font-family: 'Times New Roman', serif; font-style: italic; font-size: 15px; color: var(--accent); }
        .case-card__text { font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.6; color: var(--text-soft); flex: 1; white-space: pre-line; }
        .case-card__metric { font-family: monospace; font-size: 10px; letter-spacing: 0.12em; color: var(--text); text-transform: uppercase; border-top: 1px solid var(--line-soft); padding-top: 12px; }

        /* ===== 03 · THE WIRE ===== */
        .wire-section { margin-bottom: 80px; }
        .wire-list { border-top: 1px solid var(--line); }
        .wire-row { display: grid; grid-template-columns: 64px 210px 1fr 110px 32px; gap: 24px; align-items: baseline; padding: 20px 0; border-bottom: 1px solid var(--line-soft); }
        .wire-row:last-child { border-bottom: none; }
        .wire-date { font-family: monospace; font-size: 10px; color: var(--text-mute); letter-spacing: 0.08em; }
        .wire-name { font-family: 'Times New Roman', serif; font-size: 19px; font-weight: 700; line-height: 1.2; }
        .wire-name small { display: block; font-family: monospace; font-size: 8px; letter-spacing: 0.16em; color: var(--text-mute); text-transform: uppercase; margin-top: 4px; font-weight: 400; }
        .wire-block { display: flex; flex-direction: column; gap: 6px; }
        .wire-move { font-family: 'Times New Roman', serif; font-size: 15px; color: var(--text); line-height: 1.4; }
        .wire-from { color: var(--text-mute); }
        .wire-row.is-exit .wire-from { text-decoration: line-through; }
        .wire-arrow { color: var(--accent); margin: 0 6px; }
        .wire-arrow.is-up { color: var(--gold); }
        .wire-to { font-weight: 700; }
        .wire-impact { font-family: 'Times New Roman', serif; font-style: italic; font-size: 13px; line-height: 1.55; color: var(--text-soft); }
        .wire-pill { font-family: monospace; font-size: 8px; letter-spacing: 0.16em; text-transform: uppercase; padding: 4px 8px; border: 1px solid var(--line); color: var(--text-soft); justify-self: end; white-space: nowrap; }
        .wire-pill.is-exit { color: var(--red); border-color: var(--red); }
        .wire-pill.is-hire { color: var(--green); border-color: var(--green); }
        .wire-pill.is-reup, .wire-pill.is-promotion { color: var(--gold); border-color: rgba(212,184,150,0.5); }

        .power-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 40px; }
        .power-card { border: 1px solid var(--line); background: var(--bg-elev); padding: 20px 22px; }
        .power-card__head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 10px; }
        .power-card__label { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: var(--accent); text-transform: uppercase; }
        .power-card__since { font-family: monospace; font-size: 8px; letter-spacing: 0.12em; color: var(--text-mute); text-transform: uppercase; white-space: nowrap; }
        .power-card__chief { font-family: 'Times New Roman', serif; font-size: 20px; font-weight: 700; line-height: 1.15; margin-bottom: 6px; }
        .power-card__chief.is-vacant { color: var(--text-mute); font-style: italic; font-weight: 400; }
        .power-card__parent { font-family: monospace; font-size: 9px; letter-spacing: 0.14em; color: var(--text-soft); text-transform: uppercase; }

        /* ===== 04 · P&L ===== */
        .calc-section { margin-bottom: 80px; }
        .calc-card { background: var(--bg-elev); border: 1px solid var(--accent-soft); border-left: 3px solid var(--accent); padding: 28px; }
        .calc-tag { display: flex; align-items: center; gap: 8px; font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: var(--accent); text-transform: uppercase; margin-bottom: 16px; }
        .calc-tag::before { content: '✦'; font-size: 14px; }
        .calc-row { display: flex; border: 1px solid var(--line); background: var(--bg); transition: border-color .3s var(--ease-quiet); }
        .calc-row:focus-within { border-color: var(--accent); }
        .calc-prefix { font-family: monospace; font-size: 10px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; padding: 12px 0 12px 14px; }
        .calc-input { flex: 1; min-width: 0; background: transparent; border: none; outline: none; color: var(--text); font-family: monospace; font-size: 15px; letter-spacing: 0.04em; padding: 12px 14px 12px 8px; }
        .calc-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .calc-chip { background: none; border: 1px solid var(--line); color: var(--text-soft); font-family: monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 10px; cursor: pointer; transition: all .3s var(--ease-quiet); }
        .calc-chip:hover { color: var(--accent); border-color: var(--accent); }
        .calc-chip.is-active { color: var(--accent); border-color: var(--accent); }

        .calc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
        .econ-card { border: 1px solid var(--line); background: var(--bg); padding: 22px 24px; display: flex; flex-direction: column; gap: 10px; }
        .econ-card__pill { font-family: monospace; font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; padding: 4px 10px; border: 1px solid var(--line); justify-self: start; }
        .econ-card__pill.is-indie { color: var(--green); border-color: var(--green); }
        .econ-card__pill.is-major { color: var(--accent); border-color: var(--accent); }
        .econ-card__number { font-family: 'Times New Roman', serif; font-size: 38px; font-weight: 700; line-height: 1; }
        .econ-card__number.is-indie { color: var(--green); }
        .econ-card__number.is-major { color: var(--accent); }
        .econ-card__sub { font-family: 'Times New Roman', serif; font-style: italic; font-size: 13px; color: var(--text-soft); line-height: 1.5; }

        .calc-bars { margin-top: 24px; display: flex; flex-direction: column; gap: 14px; }
        .calc-bar__meta { display: flex; justify-content: space-between; font-family: monospace; font-size: 9px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; margin-bottom: 6px; }
        .calc-bar { height: 8px; background: var(--line-soft); overflow: hidden; }
        .calc-bar__fill { height: 100%; width: 0; transition: width .6s var(--ease-quiet); }
        .calc-bar__fill.is-indie { background: var(--green); }
        .calc-bar__fill.is-major { background: var(--accent); }

        .calc-stat { margin-top: 24px; padding: 16px 20px; border: 1px dashed var(--accent-soft); background: var(--bg); font-family: 'Times New Roman', serif; font-size: 15px; line-height: 1.6; color: var(--text); }
        .calc-stat strong { font-family: monospace; font-size: 10px; letter-spacing: 0.16em; color: var(--accent); text-transform: uppercase; display: block; margin-bottom: 6px; font-weight: 400; }
        .calc-foot { margin-top: 16px; font-family: monospace; font-size: 8px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; line-height: 1.8; }

        /* ===== 05 · COVERAGE ===== */
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
          .deal-entry { grid-template-columns: 1fr; }
          .deal-entry__side { border-left: none; border-top: 1px solid var(--line); }
        }
        @media (max-width: 900px) {
          .story-grid { grid-template-columns: 1fr; gap: 40px; }
          .case-grid { grid-template-columns: 1fr; }
          .power-grid { grid-template-columns: repeat(2, 1fr); }
          .wire-row { grid-template-columns: 64px 1fr 110px 32px; }
          .wire-name { grid-column: 2; }
          .wire-block { grid-column: 1 / -1; padding-left: 88px; }
          .wire-pill { grid-row: 1; grid-column: 3; }
          .ledger-icon-btn { opacity: 1; }
        }
        @media (max-width: 720px) {
          .shell { padding: 40px 18px 64px; }
          .page-head { flex-direction: column; align-items: flex-start; gap: 16px; }
          .page-head__right { text-align: left; }
          .section-head { flex-direction: column; align-items: flex-start; gap: 8px; }
          .split-row { grid-template-columns: 1fr 1fr; gap: 12px; }
          .split-metric { grid-column: 1 / -1; }
          .calc-grid { grid-template-columns: 1fr; }
          .power-grid { grid-template-columns: 1fr; }
          .deal-row { flex-wrap: wrap; gap: 8px 14px; }
          .deal-row__type { width: auto; }
          .deal-row__value { margin-left: auto; }
          .deal-entry__main, .deal-entry__side { padding: 24px 18px; }
          .wire-row { display: block; }
          .wire-block { padding-left: 0; margin-top: 8px; }
          .wire-pill { margin-top: 10px; justify-self: start; display: inline-block; }
        }
      `}} />

      <div className="shell">
        <header className="page-head fade-up">
          <div className="page-head__left">
            <span className="page-head__num">05 / THE FLOOR</span>
            <h1 className="page-head__title line-mask"><span className="line-mask__inner">The <em>Boardroom</em></span></h1>
          </div>
          <p className="page-head__right">The money, the masters, and the people who move both. Every deal decoded to the fine print, every path mapped to the dollar, every corner office tracked.</p>
        </header>

        {/* ===== 01 / THE BAG ===== */}
        <section className="bag-section fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">01</span>
              <h2 className="section-head__title">The <em>Bag</em></h2>
              <Blip text="The biggest deals in the culture, broken down to the term sheet — and fully editor-controlled: add new contracts, clear stale ones." />
            </div>
            <div className="section-head__tools">
              {userRole && (
                <button className="ledger-add-btn" onClick={() => { setShowAddDeal(v => !v); setDealError(null); }}>
                  <Plus size={12} /> {showAddDeal ? 'Close' : 'Add Deal'}
                </button>
              )}
              <span className="section-head__count">{deals.length} DEALS ON FILE</span>
            </div>
          </div>

          {userRole && showAddDeal && (
            <form className="ledger-form" onSubmit={handleAddDeal}>
              <div className="ledger-form__row">
                <div className="ledger-field">
                  <span className="ledger-field__label">Artist / Seller</span>
                  <input className="ledger-input" value={dArtist} onChange={(e) => setDArtist(e.target.value)} placeholder="Kendrick Lamar" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Counterparty / Buyer</span>
                  <input className="ledger-input" value={dCounter} onChange={(e) => setDCounter(e.target.value)} placeholder="Universal Music Group" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Value</span>
                  <input className="ledger-input" value={dValue} onChange={(e) => setDValue(e.target.value)} placeholder="~$150M" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Date</span>
                  <input className="ledger-input" value={dDate} onChange={(e) => setDDate(e.target.value)} placeholder="08.2026" />
                </div>
              </div>
              <div className="ledger-form__row">
                <div className="ledger-field">
                  <span className="ledger-field__label">Deal Type</span>
                  <input className="ledger-input" value={dType} onChange={(e) => setDType(e.target.value)} placeholder="Catalog Acquisition" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Status</span>
                  <select className="ledger-select" value={dStatus} onChange={(e) => setDStatus(e.target.value)}>
                    <option>REPORTED</option>
                    <option>CLOSED</option>
                    <option>CONFIRMED</option>
                    <option>RUMORED</option>
                  </select>
                </div>
                <div className="ledger-field is-wide">
                  <span className="ledger-field__label">Pills</span>
                  <input className="ledger-input" value={dPills} onChange={(e) => setDPills(e.target.value)} placeholder="MASTERS, PUBLISHING, 360 CLAUSES" />
                  <span className="ledger-input__hint">Comma-separated · renders as the pill strip</span>
                </div>
              </div>
              <div className="ledger-field is-wide">
                <span className="ledger-field__label">The Fine Print</span>
                <textarea className="ledger-textarea" value={dFine} onChange={(e) => setDFine(e.target.value)} placeholder="One clause per line — the terms nobody reads until they cost them." />
                <span className="ledger-input__hint">One entry per line · renders as the fine-print ledger</span>
              </div>
              <div className="ledger-field is-wide">
                <span className="ledger-field__label">The Read</span>
                <textarea className="ledger-textarea is-tall" value={dRead} onChange={(e) => setDRead(e.target.value)} placeholder="Why this deal matters — the editorial close." />
              </div>
              {dealError && <div className="ledger-form__error">{dealError}</div>}
              <div className="ledger-form__actions">
                <button type="button" className="ledger-cancel" onClick={() => setShowAddDeal(false)}>Cancel</button>
                <button type="submit" className="ledger-submit" disabled={savingDeal}>
                  {savingDeal ? <Loader2 size={12} className="animate-spin" /> : null}
                  {savingDeal ? 'Filing...' : 'Add to the Bag'}
                </button>
              </div>
            </form>
          )}

          <article className="deal-entry" key={dealKey(featured)} ref={dealCardRef}>
            <div className="deal-entry__main">
              <div className="deal-entry__rail">
                <span className="deal-badge">{featured.status}</span>
                <span className="deal-filed">{featured.dealType} · REPORTED {featured.date}</span>
              </div>
              <h3 className="deal-artist">{featured.artist}</h3>
              <div className="deal-counter">× {featured.counterparty}</div>
              <span className="deal-value__label">Deal Value</span>
              <div className="deal-value">{featured.value}</div>
              <div className="deal-pills">
                {featured.pills.map(p => <span className="deal-pill" key={p}>{p}</span>)}
              </div>

              {featured.allocation.length > 0 && (
                <>
                  <div className="alloc-label">Estimated Allocation</div>
                  <div className="alloc-bar">
                    {featured.allocation.map((a, i) => (
                      <div className={`alloc-seg is-${i + 1}`} key={a.label} style={{ width: a.pct + '%' }} />
                    ))}
                  </div>
                  <div className="alloc-legend">
                    {featured.allocation.map((a, i) => (
                      <span className="alloc-key" key={a.label}>
                        <span className={`alloc-dot is-${i + 1}`} />{a.label} {a.pct}%
                      </span>
                    ))}
                  </div>
                </>
              )}

              <div className="deal-ledger__head">Deal Ledger</div>
              {featured.ledger.map(l => (
                <div className="deal-ledger__row" key={l.label}>
                  <span className="deal-ledger__label">{l.label}</span>
                  <span className={`deal-ledger__value ${l.accent ? 'is-accent' : ''}`}>{l.value}</span>
                </div>
              ))}

              {featured.finePrint.length > 0 && (
                <>
                  <div className="fine-print__label">The Fine Print</div>
                  <ul className="fine-print">
                    {featured.finePrint.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </>
              )}

              {featured.read && (
                <div className="the-read">
                  <span className="the-read__label">The Read</span>
                  <p className="the-read__text">{featured.read}</p>
                </div>
              )}
            </div>

            <aside className="deal-entry__side">
              <div className="deal-side__tag">Deal File</div>
              {featured.sideFacts.map(f => (
                <div className="deal-fact" key={f.label}>
                  <span className="deal-fact__label">{f.label}</span>
                  <span className="deal-fact__value">{f.value}</span>
                </div>
              ))}
            </aside>
          </article>

          <div className="deal-list__hint">Select a deal to feature it on the board{userRole ? ' · hover a row to remove it' : ''}</div>
          <div className="deal-list">
            {deals.map(d => (
              <div
                className={`deal-row ${dealKey(d) === featuredKey ? 'is-active' : ''}`}
                key={dealKey(d)}
                onClick={() => swapDeal(dealKey(d))}
              >
                <span className="deal-row__date">{d.date}</span>
                <span className="deal-row__type">{d.listType}</span>
                <span className="deal-row__title">{d.artist} × {d.counterparty}</span>
                <span className="deal-row__value">{d.value}</span>
                {userRole && d.dbId && (
                  <button
                    className="ledger-icon-btn is-del"
                    onClick={(e) => { e.stopPropagation(); handleDeleteDeal(d); }}
                    aria-label="Delete deal"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="bag-foot">Figures as publicly reported · Allocations are estimates</div>
        </section>

        {/* ===== 02 / INDIE VS MAJOR ===== */}
        <section className="split-section fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">02</span>
              <h2 className="section-head__title">Indie vs. <em>Major</em></h2>
              <Blip text="The Split Board is the reference matrix; the case files below it are editor-controlled — add new artists with an AI-assisted draft or write them yourself." />
            </div>
            <div className="section-head__tools">
              {userRole && (
                <button className="ledger-add-btn" onClick={() => { setShowAddCase(v => !v); setCaseError(null); }}>
                  <Plus size={12} /> {showAddCase ? 'Close' : 'Add Case'}
                </button>
              )}
              <span className="section-head__count">{cases.length} CASE FILES</span>
            </div>
          </div>

          {userRole && showAddCase && (
            <form className="ledger-form" onSubmit={handleAddCase}>
              <div className="ledger-form__row">
                <div className="ledger-field">
                  <span className="ledger-field__label">Artist</span>
                  <input className="ledger-input" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Lanre Gaba" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Path</span>
                  <select className="ledger-select" value={cPath} onChange={(e) => setCPath(e.target.value as "INDIE" | "RECLAIM")}>
                    <option>INDIE</option>
                    <option>RECLAIM</option>
                  </select>
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">The Play</span>
                  <input className="ledger-input" value={cPlay} onChange={(e) => setCPlay(e.target.value)} placeholder="Proud 2 Pay" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">The Metric</span>
                  <input className="ledger-input" value={cMetric} onChange={(e) => setCMetric(e.target.value)} placeholder="3 GRAMMYS · 0 LABELS" />
                </div>
              </div>
              <div className="ledger-field is-wide">
                <span className="ledger-field__label">The Story</span>
                <textarea className="ledger-textarea is-tall" value={cText} onChange={(e) => setCText(e.target.value)} placeholder="Type it yourself, or hit Draft the Case and let the AI write two paragraphs from the facts above." />
              </div>
              {caseError && <div className="ledger-form__error">{caseError}</div>}
              <div className="ledger-form__actions">
                <button
                  type="button"
                  className="ai-draft-btn"
                  onClick={handleDraftCase}
                  disabled={caseAiDrafting || !cName.trim()}
                >
                  {caseAiDrafting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {caseAiDrafting ? 'Drafting...' : '✦ Draft the Case'}
                </button>
                <button type="button" className="ledger-cancel" onClick={() => setShowAddCase(false)}>Cancel</button>
                <button type="submit" className="ledger-submit" disabled={savingCase}>
                  {savingCase ? <Loader2 size={12} className="animate-spin" /> : null}
                  {savingCase ? 'Filing...' : 'Add Case File'}
                </button>
              </div>
            </form>
          )}

          <div className="split-board">
            <div className="split-row is-head">
              <span className="split-metric">The Metric</span>
              <span className="split-head-pill is-indie">The Indie Path</span>
              <span className="split-head-pill is-major">The Major Path</span>
            </div>
            {SPLIT_ROWS.map(r => (
              <div className="split-row" key={r.metric}>
                <span className="split-metric">{r.metric}</span>
                <span className="split-val is-indie">{r.indie}</span>
                <span className="split-val is-major">{r.major}</span>
              </div>
            ))}
          </div>

          <div className="case-grid">
            {cases.map(c => (
              <article className="case-card" key={caseKey(c)}>
                <div className="case-card__head">
                  <span className={`case-card__pill is-${c.path === 'INDIE' ? 'indie' : 'reclaim'}`}>{c.path} PATH</span>
                  {userRole && c.dbId && (
                    <button className="ledger-icon-btn is-del" onClick={() => handleDeleteCase(c)} aria-label="Delete case">
                      <X size={11} />
                    </button>
                  )}
                </div>
                <h3 className="case-card__name">{c.name}</h3>
                {c.play && <div className="case-card__play">"{c.play}"</div>}
                <p className="case-card__text">{c.text}</p>
                {c.metric && <div className="case-card__metric">{c.metric}</div>}
              </article>
            ))}
          </div>
        </section>

        {/* ===== 03 / EXECUTIVE MOVES ===== */}
        <section className="wire-section fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">03</span>
              <h2 className="section-head__title">Executive <em>Moves</em></h2>
              <Blip text="The wire: hires, exits, re-ups, and promotions — with an AI assist that drafts the read from the facts you type. Add moves live; the board keeps score." />
            </div>
            <div className="section-head__tools">
              {userRole && (
                <button className="ledger-add-btn" onClick={() => { setShowAddMove(v => !v); setMoveError(null); }}>
                  <Plus size={12} /> {showAddMove ? 'Close' : 'Add Move'}
                </button>
              )}
              <span className="section-head__count">{moves.length} ON THE WIRE</span>
            </div>
          </div>

          {userRole && showAddMove && (
            <form className="ledger-form" onSubmit={handleAddMove}>
              <div className="ledger-form__row">
                <div className="ledger-field">
                  <span className="ledger-field__label">Executive</span>
                  <input className="ledger-input" value={mName} onChange={(e) => setMName(e.target.value)} placeholder="Lanre Gaba" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Date</span>
                  <input className="ledger-input" value={mDate} onChange={(e) => setMDate(e.target.value)} placeholder="08.2026" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Role</span>
                  <input className="ledger-input" value={mRole} onChange={(e) => setMRole(e.target.value)} placeholder="EVP, Head of Urban Music" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Move Type</span>
                  <select className="ledger-select" value={mType} onChange={(e) => setMType(e.target.value as MoveType)}>
                    {MOVE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="ledger-form__row">
                <div className="ledger-field">
                  <span className="ledger-field__label">From</span>
                  <input className="ledger-input" value={mFrom} onChange={(e) => setMFrom(e.target.value)} placeholder="Previous post" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">To</span>
                  <input className="ledger-input" value={mTo} onChange={(e) => setMTo(e.target.value)} placeholder="Elevated post — for promotions, the new chair" />
                </div>
              </div>
              <div className="ledger-field is-wide">
                <span className="ledger-field__label">The Read — Why It Matters</span>
                <textarea className="ledger-textarea is-tall" value={mImpact} onChange={(e) => setMImpact(e.target.value)} placeholder="Type it yourself, or hit Draft the Read and let the AI write one from the facts above." />
              </div>
              {moveError && <div className="ledger-form__error">{moveError}</div>}
              <div className="ledger-form__actions">
                <button
                  type="button"
                  className="ai-draft-btn"
                  onClick={handleDraftRead}
                  disabled={aiDrafting || !mName.trim()}
                >
                  {aiDrafting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {aiDrafting ? 'Drafting...' : '✦ Draft the Read'}
                </button>
                <button type="button" className="ledger-cancel" onClick={() => setShowAddMove(false)}>Cancel</button>
                <button type="submit" className="ledger-submit" disabled={savingMove}>
                  {savingMove ? <Loader2 size={12} className="animate-spin" /> : null}
                  {savingMove ? 'Filing...' : 'Add to the Wire'}
                </button>
              </div>
            </form>
          )}

          <div className="wire-list">
            {moves.map(m => (
              <div className={`wire-row ${m.type === 'EXIT' ? 'is-exit' : ''}`} key={moveKey(m)}>
                <span className="wire-date">{m.date}</span>
                <div className="wire-name">
                  {m.name}
                  <small>{m.role}</small>
                </div>
                <div className="wire-block">
                  <span className="wire-move">
                    <span className="wire-from">{m.from}</span>
                    <span className={`wire-arrow ${m.type === 'PROMOTION' ? 'is-up' : ''}`}>{m.type === 'PROMOTION' ? '↑' : '→'}</span>
                    <span className="wire-to">{m.to}</span>
                  </span>
                  {m.impact && <span className="wire-impact">{m.impact}</span>}
                </div>
                <span className={`wire-pill is-${m.type.toLowerCase()}`}>{m.type}</span>
                {userRole && m.dbId && (
                  <button className="ledger-icon-btn is-del" onClick={() => handleDeleteMove(m)} aria-label="Delete move">
                    <X size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="power-grid">
            {POWER_MAP.map(p => (
              <div className="power-card" key={p.label}>
                <div className="power-card__head">
                  <span className="power-card__label">{p.label}</span>
                  <span className="power-card__since">{p.since}</span>
                </div>
                <div className={`power-card__chief ${p.chief === 'Search Underway' ? 'is-vacant' : ''}`}>{p.chief}</div>
                <div className="power-card__parent">{p.parent}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 04 / THE STREAMING P&L ===== */}
        <section className="calc-section fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">04</span>
              <h2 className="section-head__title">The Streaming <em>P&amp;L</em></h2>
              <Blip text="The royalty calculator, upgraded. Type any stream count and see what each path actually pays — including the recoupment truth the advance hides." />
            </div>
          </div>

          <div className="calc-card">
            <div className="calc-tag">Akademy Desk · Streaming Math</div>
            <div className="calc-row">
              <span className="calc-prefix">Streams</span>
              <input
                className="calc-input"
                type="text"
                inputMode="numeric"
                value={streams ? streams.toLocaleString('en-US') : ''}
                onChange={(e) => handleStreams(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="calc-chips">
              {STREAM_CHIPS.map(c => (
                <button
                  type="button"
                  className={`calc-chip ${streams === c.v ? 'is-active' : ''}`}
                  key={c.label}
                  onClick={() => setStreams(c.v)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="calc-grid">
              <div className="econ-card">
                <span className="econ-card__pill is-indie">Indie Path</span>
                <span className="econ-card__number is-indie">{fmtMoney(indieNet)}</span>
                <span className="econ-card__sub">In hand. ~85% of net, no advance, no recoupment — the distributor takes its cut and the rest is yours from stream one.</span>
              </div>
              <div className="econ-card">
                <span className="econ-card__pill is-major">Major Path</span>
                <span className="econ-card__number is-major">$0</span>
                <span className="econ-card__sub">In hand — until recouped. {fmtMoney(majorAccrued)} accrues to your ~20% royalty share, but every dollar services the advance first.</span>
              </div>
            </div>

            <div className="calc-bars">
              <div>
                <div className="calc-bar__meta"><span>Indie · Net in hand</span><span>{fmtMoney(indieNet)}</span></div>
                <div className="calc-bar"><div className="calc-bar__fill is-indie" style={{ width: (indieNet / maxBar * 100) + '%' }} /></div>
              </div>
              <div>
                <div className="calc-bar__meta"><span>Major · Accrued against recoupment</span><span>{fmtMoney(majorAccrued)}</span></div>
                <div className="calc-bar"><div className="calc-bar__fill is-major" style={{ width: (majorAccrued / maxBar * 100) + '%' }} /></div>
              </div>
            </div>

            <div className="calc-stat">
              <strong>The Recoupment Math</strong>
              At this blended rate, a $250,000 advance recoups at approximately <em>{RECOUP_STREAMS.toLocaleString('en-US')}</em> streams. A gold single barely clears it. That is why ownership is the whole conversation.
            </div>

            <div className="calc-foot">
              Blended per-stream rate ≈ $0.0035 (recording side) · Actual rates vary by platform, territory, and tier — the ratio holds at any rate · Not financial advice
            </div>
          </div>
        </section>

        {/* ===== 05 / INDUSTRY COVERAGE ===== */}
        <section className="fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">05</span>
              <h2 className="section-head__title">Industry <em>Coverage</em></h2>
              <Blip text="Every industry-tagged story from the newsroom, aggregated into one feed." />
            </div>
            <span className="section-head__count">{articles.length} STORIES</span>
          </div>

          {loading ? (
            <div className="loading-line">Pulling the board...</div>
          ) : articles.length === 0 ? (
            <div className="loading-line">No industry coverage published yet.</div>
          ) : (
            <div className="story-grid">
              {articles.slice(0, 6).map((a, i) => (
                <article className="story" key={i}>
                  <Link href={`/article?title=${encodeURIComponent(a.title)}&source=${encodeURIComponent(a.source || "The Akademy")}`} className="story__image">
                    <img src={a.thumbnail_url || `https://picsum.photos/seed/boardroom-${i}/600/375`} alt="" />
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
    </div>
  );
}