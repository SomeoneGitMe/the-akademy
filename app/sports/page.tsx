"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, X, Plus, Sparkles } from "lucide-react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";
import { supabaseBrowser } from "../utils/supabaseBrowser";

interface PublishedArticle {
  title: string; source: string; thumbnail_url: string;
  created_at: string; tags: string[]; contentSnippet?: string;
}

interface Insight { label: string; text: string; }

interface VerifiedFacts {
  player: string; pos: string | null; team: string; league: string;
  stat: string; stat_label: string; stat_note: string | null;
  line: number | null; direction: string;
  opponent: string | null; opponent_valid: boolean;
  next_game: { opponent: string; date: string | null; is_queried_next: boolean; games_until: number | null } | null;
  season_avg: string | null; games_sampled: number | null; last_games: number[] | null;
  hit_note: string | null; schedule_note: string | null; stats_verified: boolean;
}

interface LockEntry {
  dbId: string;
  userId: string | null;
  handle: string;
  pick: string;
  league: string;
  status: "PENDING" | "WIN" | "LOSS" | "PUSH";
  createdAt: string;
}

interface Prospect {
  dbId?: string;
  rank: number;
  name: string;
  pos: string;
  school: string;
  tier: number;
  prob: number;
  trend: "RISING" | "FALLING" | "STEADY";
  slot: string;
  range: string;
  read: string;
}

const PROP_CHIPS = [
  "Angel Reese Over 15.5 Pts vs Connecticut Sun",
  "Patrick Mahomes Over 249.5 Pass Yds",
  "Shohei Ohtani Over 0.5 HRs",
  "Lionel Messi Over 0.5 Goals",
  "LeBron Over 22.5 Pts vs Celtics",
];

const ALERT_TAGS: Record<string, string> = {
  unknown_team: 'Unverified Matchup',
  cross_league: 'Real Team — Wrong League',
  opponent_not_scheduled: 'Real Team — Not Scheduled',
  no_upcoming_game: 'No Upcoming Game',
  ambiguous_player: 'Which Player?',
  player_not_found: 'Player Not Found',
  fight_found: 'Verified Fight — UFC',
};

const LEAGUE_OPTIONS = ['WNBA', 'NBA', 'NFL', 'MLB', 'NHL', 'EPL', 'UFC', 'GENERAL'];

const TIER_LABELS: Record<number, string> = {
  1: 'THE FRANCHISE TIER',
  2: 'THE LOTTERY',
  3: 'FIRST-ROUND LOCKS',
  4: 'THE BUBBLE',
};

/* ============ THE LOCKS — seed (the leaderboard computes from this log) ============ */

const SEED_LOCKS: { handle: string; pick: string; league: string; status: string; hoursAgo: number }[] = [
  // @akwooden — 6-1, riding W2
  { handle: "@akwooden", pick: "Reese double-double vs the Sun", league: "WNBA", status: "WIN", hoursAgo: 96 },
  { handle: "@akwooden", pick: "Celtics ML over the Heat", league: "NBA", status: "WIN", hoursAgo: 94 },
  { handle: "@akwooden", pick: "Mahomes Over 38.5 pass attempts", league: "NFL", status: "LOSS", hoursAgo: 90 },
  { handle: "@akwooden", pick: "Ohtani to go yard", league: "MLB", status: "WIN", hoursAgo: 86 },
  { handle: "@akwooden", pick: "Aces first half -6.5", league: "WNBA", status: "WIN", hoursAgo: 82 },
  { handle: "@akwooden", pick: "Under 218.5 in the rematch", league: "NBA", status: "WIN", hoursAgo: 78 },
  { handle: "@akwooden", pick: "Cole Under 2.00 ERA this month", league: "MLB", status: "WIN", hoursAgo: 52 },
  // @chalkgod — 4-3, coming off an L
  { handle: "@chalkgod", pick: "Celtics ML", league: "NBA", status: "WIN", hoursAgo: 95 },
  { handle: "@chalkgod", pick: "Luka Over 9.5 assists", league: "NBA", status: "LOSS", hoursAgo: 91 },
  { handle: "@chalkgod", pick: "Reese Over 15.5 pts vs the Sun", league: "WNBA", status: "WIN", hoursAgo: 87 },
  { handle: "@chalkgod", pick: "Chiefs team total Over 27", league: "NFL", status: "WIN", hoursAgo: 83 },
  { handle: "@chalkgod", pick: "Yankees -1.5 vs the Halos", league: "MLB", status: "LOSS", hoursAgo: 79 },
  { handle: "@chalkgod", pick: "Vega Over 1.5 threes", league: "WNBA", status: "WIN", hoursAgo: 75 },
  { handle: "@chalkgod", pick: "LeBron to record a triple-double", league: "NBA", status: "LOSS", hoursAgo: 50 },
  // @midrange_mandy — 3-2-1, riding W1
  { handle: "@midrange_mandy", pick: "Gray Over 3 assists", league: "WNBA", status: "WIN", hoursAgo: 93 },
  { handle: "@midrange_mandy", pick: "K Drama in the main event", league: "UFC", status: "LOSS", hoursAgo: 89 },
  { handle: "@midrange_mandy", pick: "Betts to score a run", league: "MLB", status: "WIN", hoursAgo: 85 },
  { handle: "@midrange_mandy", pick: "Timberwolves -2.5", league: "NBA", status: "LOSS", hoursAgo: 81 },
  { handle: "@midrange_mandy", pick: "Clark Over 7.5 assists", league: "WNBA", status: "PUSH", hoursAgo: 77 },
  { handle: "@midrange_mandy", pick: "Durk album drops this quarter", league: "GENERAL", status: "WIN", hoursAgo: 49 },
  // @tapemachine — 1-4, cold L3
  { handle: "@tapemachine", pick: "Aces -6.5 first half", league: "WNBA", status: "LOSS", hoursAgo: 92 },
  { handle: "@tapemachine", pick: "Shohei Over 0.5 HRs", league: "MLB", status: "WIN", hoursAgo: 88 },
  { handle: "@tapemachine", pick: "Nuggets -4.5", league: "NBA", status: "LOSS", hoursAgo: 84 },
  { handle: "@tapemachine", pick: "Ravens Over 24 pts", league: "NFL", status: "LOSS", hoursAgo: 80 },
  { handle: "@tapemachine", pick: "Sun ML as home dogs", league: "WNBA", status: "LOSS", hoursAgo: 47 },
  // @akstatlass — 3-1, W1
  { handle: "@akstatlass", pick: "LeBron 25+ pts & 8 ast", league: "NBA", status: "WIN", hoursAgo: 94 },
  { handle: "@akstatlass", pick: "Freeman to homer", league: "MLB", status: "WIN", hoursAgo: 90 },
  { handle: "@akstatlass", pick: "Griffin top-5 at the Open", league: "GENERAL", status: "LOSS", hoursAgo: 86 },
  { handle: "@akstatlass", pick: "Reese & Cardoso double-doubles", league: "WNBA", status: "WIN", hoursAgo: 51 },
  // Tonight's board — pending
  { handle: "@akwooden", pick: "Reese Over 15.5 pts vs the Sun", league: "WNBA", status: "PENDING", hoursAgo: 6 },
  { handle: "@chalkgod", pick: "Celtics ML", league: "NBA", status: "PENDING", hoursAgo: 5 },
  { handle: "@midrange_mandy", pick: "Gray Over 15 pts", league: "WNBA", status: "PENDING", hoursAgo: 4 },
  { handle: "@tapemachine", pick: "Cole Over 5.5 Ks", league: "MLB", status: "PENDING", hoursAgo: 3 },
  { handle: "@akstatlass", pick: "Ohtani Over 0.5 HRs", league: "MLB", status: "PENDING", hoursAgo: 2 },
];

/* ============ THE BIG BOARD — seed ============ */

const SEED_BOARD: Prospect[] = [
  { rank: 1, name: "Cooper Flagg", pos: "F", school: "Duke", tier: 1, prob: 96, trend: "STEADY", slot: "Consensus #1", range: "1–1", read: "The no-debate pick — every board in the country has him first overall, and has for a year." },
  { rank: 2, name: "Dylan Harper", pos: "G", school: "Rutgers", tier: 1, prob: 78, trend: "RISING", slot: "Consensus #2", range: "1–4", read: "Guard one on every board; the only question is whether a bad-lottery team falls in love with a big instead." },
  { rank: 3, name: "VJ Edgecombe", pos: "G", school: "Baylor", tier: 2, prob: 64, trend: "RISING", slot: "Consensus #3", range: "2–6", read: "The riser of the class — boards that had him sixth in the fall now won't let him past four." },
  { rank: 4, name: "Tre Johnson", pos: "G", school: "Texas", tier: 2, prob: 52, trend: "STEADY", slot: "Consensus #4", range: "3–7", read: "Pure bucket. The split on him is shot-making vs. feel — teams pick a side and stay there." },
  { rank: 5, name: "Ace Bailey", pos: "F", school: "Rutgers", tier: 2, prob: 47, trend: "FALLING", slot: "Consensus #5", range: "3–8", read: "Widest variance in the class — one board has him three, another has him out of the top ten entirely." },
  { rank: 6, name: "Kon Knueppel", pos: "F", school: "Duke", tier: 2, prob: 41, trend: "STEADY", slot: "Consensus #6", range: "4–9", read: "The safe floor guy — every board agrees he's a top-ten talent, nobody argues for higher." },
  { rank: 7, name: "Khaman Maluach", pos: "C", school: "Duke", tier: 2, prob: 38, trend: "FALLING", slot: "Consensus #7", range: "5–12", read: "Big boards drift — teams without a center need keep him top-eight; everyone else shops later." },
  { rank: 8, name: "Asa Newell", pos: "F", school: "Georgia", tier: 3, prob: 33, trend: "RISING", slot: "Consensus #12", range: "9–18", read: "Quietly climbing — three boards moved him up a full tier in the last update cycle." },
  { rank: 9, name: "Derik Queen", pos: "C", school: "Maryland", tier: 3, prob: 27, trend: "STEADY", slot: "Consensus #14", range: "12–20", read: "Offense-first big — the boards that believe in the passing love him, the rest see a second-rounder." },
  { rank: 10, name: "Liam McNeeley", pos: "G", school: "UConn", tier: 3, prob: 24, trend: "STEADY", slot: "Consensus #16", range: "14–22", read: "The shooter every board agrees on — the only debate is lottery versus mid-first." },
  { rank: 11, name: "Labaron Philon", pos: "G", school: "Alabama", tier: 3, prob: 19, trend: "RISING", slot: "Consensus #18", range: "15–26", read: "The tournament did its job — every board that watched March moved him up." },
  { rank: 12, name: "Jase Richardson", pos: "G", school: "Michigan State", tier: 4, prob: 14, trend: "STEADY", slot: "Consensus #24", range: "20–35", read: "Bubble name — the boards split between late first and early second, no consensus forming." },
];

/* ============ SHARED BITS ============ */

const Blip = ({ text }: { text: string }) => (
  <span className="help-icon-wrapper">
    <span className="help-icon">?</span>
    <span className="help-tooltip">{text}</span>
  </span>
);

const mapLockRow = (r: any): LockEntry => ({
  dbId: r.id,
  userId: r.user_id || null,
  handle: r.handle || '',
  pick: r.pick_text || '',
  league: r.league || 'GENERAL',
  status: (['WIN', 'LOSS', 'PUSH', 'PENDING'].includes(r.status) ? r.status : 'PENDING') as LockEntry["status"],
  createdAt: r.created_at || new Date().toISOString(),
});

const mapProspectRow = (r: any): Prospect => ({
  dbId: r.id,
  rank: Number(r.board_rank) || 99,
  name: r.name || '',
  pos: r.pos || '',
  school: r.school || '',
  tier: Number(r.tier) || 3,
  prob: Number(r.prob) || 10,
  trend: (['RISING', 'FALLING', 'STEADY'].includes(r.trend) ? r.trend : 'STEADY') as Prospect["trend"],
  slot: r.slot || '',
  range: r.range_label || '',
  read: r.the_read || '',
});

const timeAgo = (iso: string) => {
  try {
    const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
    if (h < 1) return 'JUST NOW';
    if (h < 24) return `${h}H AGO`;
    return `${Math.floor(h / 24)}D AGO`;
  } catch { return ''; }
};

/* ============ PAGE ============ */

export default function SportsPage() {
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const [userRole, setUserRole] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userHandle, setUserHandle] = useState("");

  // Almanac state
  const [propInput, setPropInput] = useState("Angel Reese Over 15.5 Pts vs Connecticut Sun");
  const [aiLoading, setAiLoading] = useState(false);
  const [facts, setFacts] = useState<VerifiedFacts | null>(null);
  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [verdictReason, setVerdictReason] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<string | null>(null);
  const [aiMeta, setAiMeta] = useState<{ provider: string; model: string } | null>(null);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<{ name: string; team: string; league: string }[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Locks state
  const [locks, setLocks] = useState<LockEntry[]>([]);
  const [showLockForm, setShowLockForm] = useState(false);
  const [savingLock, setSavingLock] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [lkHandle, setLkHandle] = useState("");
  const [lkPick, setLkPick] = useState("");
  const [lkLeague, setLkLeague] = useState("WNBA");
  const [gradingId, setGradingId] = useState<string | null>(null);

  // Big Board state
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [showAddProspect, setShowAddProspect] = useState(false);
  const [savingProspect, setSavingProspect] = useState(false);
  const [prospectError, setProspectError] = useState<string | null>(null);
  const [pName, setPName] = useState("");
  const [pPos, setPPos] = useState("");
  const [pSchool, setPSchool] = useState("");
  const [pRank, setPRank] = useState("");
  const [pTier, setPTier] = useState("3");
  const [pProb, setPProb] = useState("");
  const [pTrend, setPTrend] = useState<"RISING" | "FALLING" | "STEADY">("STEADY");
  const [pSlot, setPSlot] = useState("");
  const [pRange, setPRange] = useState("");
  const [pRead, setPRead] = useState("");
  const [readDrafting, setReadDrafting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetch('/api/published-articles')
      .then(res => res.json())
      .then(data => {
        const filtered = (data.articles || []).filter((a: PublishedArticle) =>
          (a.tags || []).map(t => t.toLowerCase()).includes('sports')
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

  // Bar animation — re-runs when board data lands
  useEffect(() => {
    const chartObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); chartObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('.heat-item:not(.is-in)').forEach(el => chartObserver.observe(el));
    return () => chartObserver.disconnect();
  }, [prospects, loading]);

  // Auth + seed + fetch
  const fetchLocks = useCallback(async () => {
    try {
      const { data, error: dbErr } = await supabaseBrowser.from('locks').select('*').order('created_at', { ascending: true });
      if (!dbErr && data) setLocks(data.map(mapLockRow));
    } catch (e) { /* empty */ }
  }, []);

  const fetchProspects = useCallback(async () => {
    try {
      const { data, error: dbErr } = await supabaseBrowser.from('draft_board').select('*');
      if (!dbErr && data) setProspects(data.map(mapProspectRow).sort((a: Prospect, b: Prospect) => a.rank - b.rank));
    } catch (e) { /* empty */ }
  }, []);

  const seedIfEmpty = useCallback(async () => {
    try {
      const { count: lockCount } = await supabaseBrowser.from('locks').select('*', { count: 'exact', head: true });
      if (lockCount === 0) {
        await supabaseBrowser.from('locks').insert(SEED_LOCKS.map(l => ({
          handle: l.handle, pick_text: l.pick, league: l.league, status: l.status,
          created_at: new Date(Date.now() - l.hoursAgo * 3600000).toISOString(),
        })));
      }
      const { count: boardCount } = await supabaseBrowser.from('draft_board').select('*', { count: 'exact', head: true });
      if (boardCount === 0) {
        await supabaseBrowser.from('draft_board').insert(SEED_BOARD.map(p => ({
          board_rank: p.rank, name: p.name, pos: p.pos, school: p.school, tier: p.tier,
          prob: p.prob, trend: p.trend, slot: p.slot, range_label: p.range, the_read: p.read,
        })));
      }
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabaseBrowser.auth.getSession();
        if (session) {
          setSignedIn(true);
          setCurrentUserId(session.user.id);
          const { data: profile } = await supabaseBrowser.from('profiles').select('role, username').eq('id', session.user.id).single();
          if (profile) {
            if (profile.role === 'admin' || profile.role === 'editor') {
              setUserRole(profile.role);
              await seedIfEmpty();
            }
            if (profile.username) { setUserHandle(profile.username); setLkHandle(profile.username); }
          }
        }
      } catch (e) { /* anon */ }
      fetchLocks();
      fetchProspects();
    };
    init();
  }, [fetchLocks, fetchProspects, seedIfEmpty]);

  // ===== ALMANAC =====
  const handleAnalyze = async (propOverride?: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prop = (propOverride !== undefined ? propOverride : propInput).trim();
    if (!prop || aiLoading) return;
    setAiLoading(true);
    setFacts(null); setInsights(null); setVerdict(null); setVerdictReason(null);
    setConfidence(null); setAiMeta(null); setAiStatus(null); setStatusMsg(null);
    setCandidates(null); setAiError(null);
    try {
      const res = await fetch('/api/sports-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prop })
      });
      const data = await res.json();
      if (data.error) {
        setAiError(data.error);
      } else if (data.status === 'ok') {
        setFacts(data.facts);
        setInsights(data.insights);
        setVerdict(data.verdict);
        setVerdictReason(data.verdict_reason);
        setConfidence(data.confidence);
        setAiMeta(data.provider ? { provider: data.provider, model: data.model } : null);
      } else {
        setAiStatus(data.status);
        setStatusMsg(data.message || null);
        setCandidates(data.candidates || null);
        setFacts(data.facts || null);
      }
    } catch {
      setAiError('The Almanac could not be reached — try again.');
    }
    setAiLoading(false);
  };

  const runChip = (chip: string) => {
    setPropInput(chip);
    handleAnalyze(chip);
  };

  const verdictClass = (v: string | null) =>
    v === 'OVER' ? 'is-over' : v === 'UNDER' ? 'is-under' : 'is-pass';

  // ===== LOCKS =====
  const handleAddLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lkPick.trim()) { setLockError("The pick is required — what are we locking?"); return; }
    setSavingLock(true); setLockError(null);
    try {
      const handleText = lkHandle.trim() || userHandle || "@player";
      const payload = {
        user_id: currentUserId,
        handle: handleText.startsWith('@') ? handleText : `@${handleText}`,
        pick_text: lkPick.trim(),
        league: lkLeague,
        status: 'PENDING',
      };
      const { data, error: insErr } = await supabaseBrowser.from('locks').insert(payload).select().single();
      if (insErr) throw new Error(insErr.message);
      setLocks(prev => [...prev, mapLockRow(data)]);
      setLkPick("");
      setShowLockForm(false);
    } catch (err: any) {
      setLockError("Save failed — run SQL 11 and check the locks table.");
    }
    setSavingLock(false);
  };

  const gradeLock = async (id: string, status: "WIN" | "LOSS" | "PUSH") => {
    if (!userRole) return;
    setGradingId(id);
    try {
      const { error } = await supabaseBrowser.from('locks').update({ status }).eq('id', id);
      if (!error) setLocks(prev => prev.map(l => (l.dbId === id ? { ...l, status } : l)));
    } catch (e) { /* no-op */ }
    setGradingId(null);
  };

  const deleteLock = async (l: LockEntry) => {
    if (!l.dbId) return;
    if (!(userRole || l.userId === currentUserId)) return;
    try {
      await supabaseBrowser.from('locks').delete().eq('id', l.dbId);
      setLocks(prev => prev.filter(x => x.dbId !== l.dbId));
    } catch (e) { /* no-op */ }
  };

  // Computed board — the leaderboard derives from the graded log
  const pendingLocks = [...locks].filter(l => l.status === 'PENDING').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const gradedLocks = [...locks].filter(l => l.status !== 'PENDING').sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const seasonBoard = (() => {
    const map = new Map<string, { handle: string; w: number; l: number; p: number; graded: { status: string; at: number }[] }>();
    gradedLocks.forEach(l => {
      const e = map.get(l.handle) || { handle: l.handle, w: 0, l: 0, p: 0, graded: [] };
      if (l.status === 'WIN') e.w++;
      else if (l.status === 'LOSS') e.l++;
      else e.p++;
      e.graded.push({ status: l.status, at: new Date(l.createdAt).getTime() });
      map.set(l.handle, e);
    });
    const rows = [...map.values()].map(e => {
      const sorted = e.graded.sort((a, b) => a.at - b.at);
      let streakType = '', streakCount = 0;
      for (let i = sorted.length - 1; i >= 0; i--) {
        const s = sorted[i].status;
        if (s === 'PUSH') continue;
        if (!streakType) { streakType = s; streakCount = 1; }
        else if (s === streakType) streakCount++;
        else break;
      }
      const decided = e.w + e.l;
      return {
        handle: e.handle, w: e.w, l: e.l, p: e.p, decided,
        winPct: decided ? Math.round(e.w / decided * 100) : 0,
        streakType, streakCount,
      };
    });
    rows.sort((a, b) => (b.w - a.w) || (b.winPct - a.winPct));
    return rows;
  })();

  const goldHandle = seasonBoard.find(r => r.decided >= 6)?.handle || null;
  const recentGraded = [...gradedLocks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  // ===== BIG BOARD =====
  const handleAddProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) { setProspectError("A name is required."); return; }
    setSavingProspect(true); setProspectError(null);
    try {
      const payload = {
        board_rank: parseInt(pRank, 10) || 99,
        name: pName.trim(),
        pos: pPos.trim() || '—',
        school: pSchool.trim() || '—',
        tier: parseInt(pTier, 10) || 3,
        prob: Math.max(0, Math.min(100, parseInt(pProb, 10) || 10)),
        trend: pTrend,
        slot: pSlot.trim() || '—',
        range_label: pRange.trim() || '—',
        the_read: pRead.trim(),
      };
      const { data, error: insErr } = await supabaseBrowser.from('draft_board').insert(payload).select().single();
      if (insErr) throw new Error(insErr.message);
      setProspects(prev => [...prev, mapProspectRow(data)].sort((a, b) => a.rank - b.rank));
      setPName(""); setPPos(""); setPSchool(""); setPRank("");
      setPProb(""); setPSlot(""); setPRange(""); setPRead("");
      setShowAddProspect(false);
    } catch (err: any) {
      setProspectError("Save failed — run SQL 12 and check the draft_board table.");
    }
    setSavingProspect(false);
  };

  const deleteProspect = async (p: Prospect) => {
    if (!p.dbId) return;
    try {
      await supabaseBrowser.from('draft_board').delete().eq('id', p.dbId);
      setProspects(prev => prev.filter(x => x.dbId !== p.dbId));
    } catch (e) { /* no-op */ }
  };

  const handleDraftRead = async () => {
    if (!pName.trim() || readDrafting) return;
    setReadDrafting(true);
    try {
      const res = await fetch('/api/draft-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pName, pos: pPos, school: pSchool, trend: pTrend, slot: pSlot, range: pRange }),
      });
      const data = await res.json();
      if (data.read) setPRead(data.read);
    } catch (e) { /* leave manual */ }
    setReadDrafting(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Sports" />

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

        /* ===== 01 · ALMANAC ===== */
        .almanac-section { margin-bottom: 80px; }
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
        .ai-promise { font-family: monospace; font-size: 8px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; margin-top: 10px; line-height: 1.8; }
        .prop-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .prop-chip { background: none; border: 1px solid var(--line); color: var(--text-soft); font-family: monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 10px; cursor: pointer; transition: all .3s var(--ease-quiet); }
        .prop-chip:hover { color: var(--accent); border-color: var(--accent); }
        .ai-error { margin-top: 12px; font-family: monospace; font-size: 10px; letter-spacing: 0.1em; color: var(--red); text-transform: uppercase; line-height: 1.6; }
        .ai-divider { height: 1px; background: var(--line); margin: 16px 0; }
        .ai-source { font-family: monospace; font-size: 9px; color: var(--text-mute); letter-spacing: 0.14em; text-transform: uppercase; }

        .skeleton-grid { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
        .skeleton { background: linear-gradient(90deg, #1a1a1a 0%, #262626 50%, #1a1a1a 100%); background-size: 200% 100%; animation: skeletonShimmer 1.4s ease-in-out infinite; }
        .skeleton-line { height: 12px; width: 100%; }
        .skeleton-line.short { width: 60%; }
        @keyframes skeletonShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .loading-hint { font-family: monospace; font-size: 8px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; margin-top: 10px; }

        .facts-panel { border: 1px solid var(--line); background: var(--bg); padding: 20px 24px; margin-top: 16px; }
        .facts-panel__tag { font-family: monospace; font-size: 9px; letter-spacing: 0.2em; color: var(--green); text-transform: uppercase; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .facts-panel__tag::before { content: '✓'; font-size: 12px; }
        .facts-panel__tag::after { content: ''; flex: 1; height: 1px; background: var(--line); }
        .fact-row { display: grid; grid-template-columns: 180px 1fr; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--line-soft); align-items: baseline; }
        .fact-row:last-child { border-bottom: none; }
        .fact-label { font-family: monospace; font-size: 9px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; }
        .fact-value { font-family: 'Times New Roman', serif; font-size: 15px; color: var(--text); line-height: 1.5; }
        .fact-value.is-mono { font-family: monospace; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; }
        .fact-value.is-note { font-style: italic; color: var(--text-soft); }
        .valid-yes { color: var(--green); }
        .valid-no { color: var(--red); }
        .unverified { color: var(--text-mute); font-style: italic; }

        .alert-card { border: 1px dashed var(--red); background: rgba(210,66,57,0.05); padding: 24px; margin-top: 16px; }
        .alert-card__tag { font-family: monospace; font-size: 9px; letter-spacing: 0.2em; color: var(--red); text-transform: uppercase; margin-bottom: 12px; }
        .alert-card__msg { font-family: 'Times New Roman', serif; font-size: 16px; line-height: 1.6; color: var(--text-soft); }
        .alert-cand { font-family: monospace; font-size: 10px; letter-spacing: 0.12em; color: var(--text); text-transform: uppercase; padding: 10px 0; border-bottom: 1px solid var(--line-soft); display: flex; gap: 16px; }
        .alert-cand:last-child { border-bottom: none; }
        .alert-cand em { color: var(--text-mute); font-style: normal; }

        .report-rows { margin-top: 16px; border-top: 1px solid var(--line-soft); }
        .report-section { padding: 16px 0; border-bottom: 1px solid var(--line-soft); }
        .report-section:last-child { border-bottom: none; }
        .report-label { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; display: block; margin-bottom: 6px; }
        .report-text { font-family: 'Times New Roman', serif; font-size: 15px; line-height: 1.6; color: var(--text-soft); }

        .verdict-card { margin-top: 16px; border: 1px solid var(--accent-soft); background: var(--bg); padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
        .verdict-left { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 220px; }
        .verdict-tag { font-family: monospace; font-size: 9px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; }
        .verdict-word { font-family: 'Times New Roman', serif; font-size: 30px; font-weight: 700; line-height: 1; }
        .verdict-word.is-over { color: var(--green); }
        .verdict-word.is-under { color: var(--red); }
        .verdict-word.is-pass { color: var(--text-mute); }
        .verdict-reason { font-family: 'Times New Roman', serif; font-style: italic; font-size: 14px; color: var(--text-soft); line-height: 1.5; }
        .verdict-confidence { font-family: monospace; font-size: 9px; letter-spacing: 0.16em; color: var(--text-mute); text-transform: uppercase; text-align: right; }
        .verdict-confidence strong { color: var(--accent); font-weight: 500; font-size: 14px; display: block; margin-top: 4px; }

        /* ===== 02 · THE LOCKS ===== */
        .locks-section { margin-bottom: 80px; }
        .sub-head { display: flex; align-items: baseline; gap: 16px; border-bottom: 1px solid var(--line); padding-bottom: 10px; margin: 40px 0 12px; flex-wrap: wrap; }
        .sub-head__tag { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--accent); }
        .sub-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 20px; }
        .sub-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .sub-head__count { font-family: monospace; font-size: 8px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; margin-left: auto; }
        .sub-hint { font-family: monospace; font-size: 8px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; margin-bottom: 8px; }

        .lock-row { display: flex; align-items: baseline; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--line-soft); flex-wrap: wrap; }
        .lock-row:last-child { border-bottom: none; }
        .lock-league { font-family: monospace; font-size: 8px; letter-spacing: 0.16em; color: var(--accent); border: 1px solid var(--accent-soft); padding: 3px 8px; text-transform: uppercase; flex-shrink: 0; }
        .lock-handle { font-family: monospace; font-size: 11px; letter-spacing: 0.08em; color: var(--text); width: 150px; flex-shrink: 0; }
        .lock-pick { font-family: 'Times New Roman', serif; font-style: italic; font-size: 16px; color: var(--text-soft); flex: 1; min-width: 180px; }
        .lock-time { font-family: monospace; font-size: 8px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; flex-shrink: 0; }
        .grade-group { display: flex; gap: 6px; margin-left: auto; }
        .grade-btn { font-family: monospace; font-size: 9px; letter-spacing: 0.1em; padding: 5px 10px; border: 1px solid var(--line); background: none; color: var(--text-mute); cursor: pointer; transition: all .25s; flex-shrink: 0; }
        .grade-btn:hover { border-color: var(--accent); color: var(--accent); }
        .grade-btn.is-win:hover { border-color: var(--green); color: var(--green); }
        .grade-btn.is-loss:hover { border-color: var(--red); color: var(--red); }
        .grade-btn:disabled { opacity: .4; cursor: wait; }

        .season-row { display: grid; grid-template-columns: 36px 1fr 100px 110px 90px 130px; gap: 18px; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--line-soft); }
        .season-row:last-child { border-bottom: none; }
        .season-rank { font-family: 'Times New Roman', serif; font-style: italic; font-size: 20px; color: var(--text-mute); }
        .season-handle { font-family: monospace; font-size: 11px; letter-spacing: 0.08em; color: var(--text); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .season-record { font-family: monospace; font-size: 12px; color: var(--text); letter-spacing: 0.04em; }
        .season-record strong { color: var(--accent); font-weight: 700; }
        .season-bar { height: 6px; background: var(--line-soft); overflow: hidden; }
        .season-bar__fill { height: 100%; background: var(--accent); }
        .streak-pill { font-family: monospace; font-size: 8px; letter-spacing: 0.14em; padding: 3px 8px; border: 1px solid var(--line); text-transform: uppercase; color: var(--text-mute); text-align: center; white-space: nowrap; }
        .streak-pill.is-win { color: var(--green); border-color: var(--green); }
        .streak-pill.is-loss { color: var(--red); border-color: var(--red); }
        .season-pct { font-family: monospace; font-size: 9px; color: var(--text-soft); text-align: right; letter-spacing: 0.08em; }
        .gold-pill { font-family: monospace; font-size: 8px; letter-spacing: 0.16em; color: var(--gold); border: 1px solid rgba(212,184,150,0.5); padding: 3px 8px; text-transform: uppercase; white-space: nowrap; }

        .graded-strip { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
        .graded-chip { display: inline-flex; align-items: center; gap: 10px; border: 1px solid var(--line-soft); background: var(--bg-elev); padding: 8px 12px; }
        .graded-chip__status { font-family: monospace; font-size: 8px; letter-spacing: 0.14em; padding: 2px 6px; border: 1px solid; text-transform: uppercase; flex-shrink: 0; }
        .graded-chip__status.is-win { color: var(--green); border-color: var(--green); }
        .graded-chip__status.is-loss { color: var(--red); border-color: var(--red); }
        .graded-chip__status.is-push { color: var(--text-mute); border-color: var(--line); }
        .graded-chip__text { font-family: 'Times New Roman', serif; font-style: italic; font-size: 13px; color: var(--text-soft); }
        .graded-chip__text strong { font-family: monospace; font-style: normal; font-size: 9px; color: var(--text); font-weight: 500; margin-right: 6px; }

        .empty-line { font-family: 'Times New Roman', serif; font-style: italic; color: var(--text-mute); padding: 24px 0; }

        /* ===== 03 · THE BIG BOARD ===== */
        .board-section { margin-bottom: 80px; }
        .tier-band { display: flex; align-items: baseline; gap: 14px; padding: 32px 0 10px; border-bottom: 1px solid var(--line); }
        .tier-band__num { font-family: monospace; font-size: 9px; letter-spacing: 0.2em; color: var(--accent); }
        .tier-band__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 21px; letter-spacing: -0.01em; }
        .tier-band__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .board-row { padding: 18px 0; border-bottom: 1px solid var(--line-soft); }
        .board-row:last-child { border-bottom: none; }
        .board-top { display: grid; grid-template-columns: 36px 1fr 110px 200px 60px 28px; gap: 18px; align-items: center; }
        .board-rank { font-family: monospace; font-size: 10px; letter-spacing: 0.14em; color: var(--accent); }
        .board-name { font-family: 'Times New Roman', serif; font-size: 19px; font-weight: 700; line-height: 1.2; display: block; }
        .board-meta { font-family: monospace; font-size: 9px; letter-spacing: 0.12em; color: var(--text-mute); text-transform: uppercase; margin-top: 4px; display: block; }
        .trend-pill { font-family: monospace; font-size: 8px; letter-spacing: 0.14em; padding: 4px 8px; border: 1px solid var(--line); text-transform: uppercase; color: var(--text-soft); text-align: center; white-space: nowrap; }
        .trend-pill.is-rising { color: var(--green); border-color: var(--green); }
        .trend-pill.is-falling { color: var(--red); border-color: var(--red); }
        .board-prob { font-family: monospace; font-size: 11px; color: var(--text); text-align: right; }
        .board-read { font-family: 'Times New Roman', serif; font-style: italic; font-size: 14px; line-height: 1.55; color: var(--text-soft); margin: 10px 0 0 54px; }
        .heat-bar { height: 6px; background: var(--line-soft); overflow: hidden; }
        .heat-bar__fill { height: 100%; width: 0; background: var(--accent); transition: width 1.1s var(--ease-quiet); }
        .heat-item.is-in .heat-bar__fill { width: var(--w); }

        /* ===== CRUD FORMS ===== */
        .ledger-add-btn { display: inline-flex; align-items: center; gap: 8px; background: transparent; border: 1px solid var(--accent); color: var(--accent); font-family: monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; padding: 8px 14px; cursor: pointer; transition: all .3s var(--ease-quiet); }
        .ledger-add-btn:hover { background: var(--accent); color: #0a0a0a; }
        .ledger-form { border: 1px solid var(--line); background: var(--bg-elev); padding: 24px; margin-bottom: 28px; display: flex; flex-direction: column; gap: 16px; }
        .ledger-form__row { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 16px; }
        .ledger-field { display: flex; flex-direction: column; gap: 6px; }
        .ledger-field.is-wide { grid-column: 1 / -1; }
        .ledger-field__label { font-family: monospace; font-size: 8px; letter-spacing: 0.18em; color: var(--accent); text-transform: uppercase; }
        .ledger-input, .ledger-select, .ledger-textarea { background: var(--bg); border: 1px solid var(--line); color: var(--text); padding: 10px 12px; font-family: 'Times New Roman', serif; font-size: 14px; outline: none; transition: border-color .3s; width: 100%; }
        .ledger-textarea { font-size: 14px; line-height: 1.6; resize: vertical; min-height: 70px; }
        .ledger-input:focus, .ledger-select:focus, .ledger-textarea:focus { border-color: var(--accent); }
        .ledger-select { font-family: monospace; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; }
        .ledger-select option { background: #131313; color: #fff; }
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
        .lock-row:hover .ledger-icon-btn, .board-row:hover .ledger-icon-btn { opacity: 1; }
        .ledger-icon-btn:hover { color: var(--accent); border-color: var(--accent); }
        .ledger-icon-btn.is-del:hover { color: var(--red); border-color: var(--red); }

        /* ===== 04 · COVERAGE ===== */
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
        @media (max-width: 900px) {
          .story-grid { grid-template-columns: 1fr; gap: 40px; }
          .season-row { grid-template-columns: 36px 1fr 90px 110px; row-gap: 10px; }
          .season-bar { grid-column: 2 / 3; }
          .season-pct { grid-column: 3 / -1; text-align: left; }
          .board-top { grid-template-columns: 36px 1fr 90px 28px; row-gap: 10px; }
          .trend-pill { grid-column: 2; justify-self: start; }
          .board-barwrap { grid-column: 2 / 4; }
          .board-prob { grid-column: 4; }
          .board-read { margin-left: 0; }
          .ledger-icon-btn { opacity: 1; }
        }
        @media (max-width: 720px) {
          .shell { padding: 40px 18px 64px; }
          .page-head { flex-direction: column; align-items: flex-start; gap: 16px; }
          .page-head__right { text-align: left; }
          .section-head { flex-direction: column; align-items: flex-start; gap: 8px; }
          .fact-row { grid-template-columns: 1fr; gap: 4px; }
          .verdict-confidence { text-align: left; }
          .lock-row { gap: 8px 14px; }
          .lock-handle { width: auto; }
          .grade-group { margin-left: 0; }
          .season-row { grid-template-columns: 1fr 90px; }
          .season-rank, .season-bar { display: none; }
          .season-pct { grid-column: 2; text-align: right; }
          .board-top { grid-template-columns: 36px 1fr 28px; }
          .trend-pill { grid-column: 1 / -1; justify-self: start; }
          .board-barwrap { grid-column: 1 / -1; }
          .board-prob { display: none; }
        }
      `}} />

      <div className="shell">
        <header className="page-head fade-up">
          <div className="page-head__left">
            <span className="page-head__num">07 / THE COURT</span>
            <h1 className="page-head__title line-mask"><span className="line-mask__inner">The <em>Field</em></span></h1>
          </div>
          <p className="page-head__right">Picks grounded in verified league data, a prediction board the community keeps score on, and the draft consensus in one war room. No imagination — just the tape.</p>
        </header>

        {/* ===== 01 / THE ALMANAC ===== */}
        <section className="almanac-section fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">01</span>
              <h2 className="section-head__title">The Akademy <em>Almanac</em></h2>
              <Blip text="AI prop analysis grounded in live league data. The Almanac verifies the player, the team, the schedule, and the stat line before generating — if it can't verify, it won't generate." />
            </div>
          </div>

          <div className="ai-card">
            <div className="ai-tag">Akademy AI · Grounded</div>
            <div className="ai-title-row">
              <h3 className="ai-title">Scout <em>Report</em></h3>
              <Blip text="The report cites only verified facts. Mixed data forces a PASS — the Almanac would rather tell you nothing than tell you something wrong." />
            </div>
            <p className="ai-text">Type a prop — any league, any player, any stat. The Almanac resolves the player, checks the roster, the schedule, and the stat log first, then reads the matchup from what it could actually verify.</p>
            <form className="ai-form" onSubmit={(e) => handleAnalyze(undefined, e)}>
              <input
                className="ai-input"
                value={propInput}
                onChange={(e) => setPropInput(e.target.value)}
                placeholder="Patrick Mahomes Over 249.5 Pass Yds"
              />
              <button className="ai-btn" type="submit" disabled={aiLoading}>
                {aiLoading ? <Loader2 size={14} className="animate-spin" /> : "ANALYZE"}
              </button>
            </form>
            <div className="ai-promise">Verified against live NBA · WNBA · NFL · MLB · NHL · EPL · MLS · LaLiga · Serie A · Bundesliga · Ligue 1 · UFC data — fabricated stats are refused by design</div>

            <div className="prop-chips">
              {PROP_CHIPS.map(c => (
                <button type="button" className="prop-chip" key={c} onClick={() => runChip(c)}>{c}</button>
              ))}
            </div>

            {aiLoading && (
              <div className="skeleton-grid">
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line short" />
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line short" />
                <div className="loading-hint">Verifying the matchup · First lookup builds the league index — a few seconds</div>
              </div>
            )}

            {aiError && <div className="ai-error">{aiError}</div>}

            {aiStatus && !aiLoading && (
              <div className="alert-card">
                <div className="alert-card__tag">{ALERT_TAGS[aiStatus] || 'Notice'}</div>
                <div className="alert-card__msg">{statusMsg}</div>
                {candidates && candidates.map(c => (
                  <div className="alert-cand" key={`${c.name}-${c.team}`}>
                    <span>{c.name}</span><em>{c.team}</em><em>{c.league}</em>
                  </div>
                ))}
              </div>
            )}

            {facts && !aiLoading && (
              <>
                <div className="facts-panel">
                  <div className="facts-panel__tag">Verified Data</div>
                  <div className="fact-row">
                    <span className="fact-label">Player</span>
                    <span className="fact-value">{facts.player}{facts.pos ? ` · ${facts.pos}` : ''} · {facts.team} · {facts.league}</span>
                  </div>
                  <div className="fact-row">
                    <span className="fact-label">Queried Line</span>
                    <span className="fact-value is-mono">{facts.line !== null ? `${facts.direction !== 'NONE' ? facts.direction + ' ' : ''}${facts.line} ${facts.stat_label}` : 'NO LINE'}</span>
                  </div>
                  <div className="fact-row">
                    <span className="fact-label">Queried Opponent</span>
                    <span className="fact-value">
                      {facts.opponent !== null ? (
                        <>
                          {facts.opponent} {facts.opponent_valid
                            ? <span className="valid-yes">· REAL TEAM ✓</span>
                            : <span className="valid-no">· UNVERIFIED ✗</span>}
                        </>
                      ) : <span className="unverified">none specified — next game used</span>}
                    </span>
                  </div>
                  <div className="fact-row">
                    <span className="fact-label">Next Game</span>
                    <span className="fact-value">
                      {facts.next_game ? (
                        <>
                          vs {facts.next_game.opponent}
                          {facts.next_game.date ? ` · ${facts.next_game.date}` : ''}
                          {facts.next_game.is_queried_next
                            ? <span className="valid-yes"> · THE MATCHUP ✓</span>
                            : facts.next_game.games_until ? ` · queried game is ${facts.next_game.games_until} games out` : ''}
                        </>
                      ) : <span className="unverified">none remaining on schedule</span>}
                    </span>
                  </div>
                  <div className="fact-row">
                    <span className="fact-label">Season Average</span>
                    <span className="fact-value is-mono">
                      {facts.season_avg
                        ? `${facts.season_avg}${facts.games_sampled ? ` (${facts.games_sampled} G)` : ''}`
                        : <span className="unverified">unverified — not stated</span>}
                    </span>
                  </div>
                  <div className="fact-row">
                    <span className="fact-label">Last 5 Games</span>
                    <span className="fact-value is-mono">{facts.last_games ? `${facts.last_games.join(' · ')} (${facts.stat_label})` : <span className="unverified">unverified — not stated</span>}</span>
                  </div>
                  {facts.hit_note && (
                    <div className="fact-row">
                      <span className="fact-label">Line vs Form</span>
                      <span className="fact-value is-mono">{facts.hit_note}</span>
                    </div>
                  )}
                  {facts.stat_note && (
                    <div className="fact-row">
                      <span className="fact-label">Stat Read</span>
                      <span className="fact-value is-note">{facts.stat_note}</span>
                    </div>
                  )}
                  {facts.schedule_note && (
                    <div className="fact-row">
                      <span className="fact-label">Schedule Read</span>
                      <span className="fact-value is-note">{facts.schedule_note}</span>
                    </div>
                  )}
                </div>

                {insights && (
                  <div className="report-rows">
                    {insights.map((s, i) => (
                      <div className="report-section" key={i}>
                        <span className="report-label">{s.label}</span>
                        <p className="report-text">{s.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {verdict && (
                  <div className="verdict-card">
                    <div className="verdict-left">
                      <span className="verdict-tag">AI Verdict</span>
                      <span className={`verdict-word ${verdictClass(verdict)}`}>LEAN: {verdict}</span>
                      {verdictReason && <span className="verdict-reason">{verdictReason}</span>}
                    </div>
                    <div className="verdict-confidence">
                      Confidence
                      <strong>{confidence}</strong>
                    </div>
                  </div>
                )}

                <div className="ai-divider" />
                <div className="ai-source">
                  {aiMeta ? `AI: ${aiMeta.provider} · ${aiMeta.model} · ` : ''}GROUNDED IN VERIFIED LEAGUE DATA · NOT BETTING ADVICE
                </div>
              </>
            )}
          </div>
        </section>

        {/* ===== 02 / THE LOCKS ===== */}
        <section className="locks-section fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">02</span>
              <h2 className="section-head__title">The <em>Locks</em></h2>
              <Blip text="The community prediction economy. Any signed-in user locks a pick; admins grade it W / L / PUSH; the Season Board computes itself from the graded log. Top record wears Akademy Gold." />
            </div>
            <div className="section-head__tools">
              {signedIn && (
                <button className="ledger-add-btn" onClick={() => { setShowLockForm(v => !v); setLockError(null); }}>
                  <Plus size={12} /> {showLockForm ? 'Close' : 'Lock It In'}
                </button>
              )}
              <span className="section-head__count">{pendingLocks.length} LIVE · {seasonBoard.length} ON THE BOARD</span>
            </div>
          </div>

          {signedIn && showLockForm && (
            <form className="ledger-form" onSubmit={handleAddLock}>
              <div className="ledger-form__row">
                <div className="ledger-field">
                  <span className="ledger-field__label">Handle</span>
                  <input className="ledger-input" value={lkHandle} onChange={(e) => setLkHandle(e.target.value)} placeholder={userHandle || "@yourhandle"} />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">League</span>
                  <select className="ledger-select" value={lkLeague} onChange={(e) => setLkLeague(e.target.value)}>
                    {LEAGUE_OPTIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="ledger-field is-wide">
                  <span className="ledger-field__label">The Pick</span>
                  <input className="ledger-input" value={lkPick} onChange={(e) => setLkPick(e.target.value)} placeholder="Reese Over 15.5 pts vs the Sun" />
                </div>
              </div>
              {lockError && <div className="ledger-form__error">{lockError}</div>}
              <div className="ledger-form__actions">
                <button type="button" className="ledger-cancel" onClick={() => setShowLockForm(false)}>Cancel</button>
                <button type="submit" className="ledger-submit" disabled={savingLock}>
                  {savingLock ? <Loader2 size={12} className="animate-spin" /> : null}
                  {savingLock ? 'Locking...' : 'Lock It In'}
                </button>
              </div>
            </form>
          )}

          <div className="sub-head">
            <span className="sub-head__tag">TONIGHT'S BOARD</span>
            <h3 className="sub-head__title">Pending <em>Locks</em></h3>
            <span className="sub-head__count">{userRole ? 'STAFF: GRADE RESULTS' : 'AWAITING RESULTS'}</span>
          </div>
          <div className="sub-hint">{signedIn ? '' : 'SIGN IN TO LOCK YOUR OWN PICK'}</div>

          {pendingLocks.length === 0 ? (
            <div className="empty-line">No live locks — the board is quiet tonight.</div>
          ) : (
            pendingLocks.map(l => (
              <div className="lock-row" key={l.dbId}>
                <span className="lock-league">{l.league}</span>
                <span className="lock-handle">{l.handle}</span>
                <span className="lock-pick">"{l.pick}"</span>
                <span className="lock-time">{timeAgo(l.createdAt)}</span>
                {userRole && (
                  <div className="grade-group">
                    <button className="grade-btn is-win" onClick={() => gradeLock(l.dbId, 'WIN')} disabled={gradingId === l.dbId}>W</button>
                    <button className="grade-btn is-loss" onClick={() => gradeLock(l.dbId, 'LOSS')} disabled={gradingId === l.dbId}>L</button>
                    <button className="grade-btn" onClick={() => gradeLock(l.dbId, 'PUSH')} disabled={gradingId === l.dbId}>P</button>
                  </div>
                )}
                {(userRole || l.userId === currentUserId) && (
                  <button className="ledger-icon-btn is-del" onClick={() => deleteLock(l)} aria-label="Remove lock">
                    <X size={11} />
                  </button>
                )}
              </div>
            ))
          )}

          <div className="sub-head">
            <span className="sub-head__tag">THE SEASON BOARD</span>
            <h3 className="sub-head__title">Computed <em>Standings</em></h3>
            <span className="sub-head__count">GOLD: TOP RECORD · MIN 6 GRADED</span>
          </div>

          {seasonBoard.length === 0 ? (
            <div className="empty-line">No graded locks yet — the board builds itself as results come in.</div>
          ) : (
            seasonBoard.map((r, i) => (
              <div className="season-row" key={r.handle}>
                <span className="season-rank">{String(i + 1).padStart(2, '0')}</span>
                <span className="season-handle">
                  {r.handle}
                  {r.handle === goldHandle && <span className="gold-pill">Akademy Gold</span>}
                </span>
                <span className="season-record"><strong>{r.w}</strong>–{r.l}{r.p > 0 ? `–${r.p}` : ''}</span>
                <div className="season-bar"><div className="season-bar__fill" style={{ width: r.winPct + '%' }} /></div>
                <span className={`streak-pill ${r.streakType === 'WIN' ? 'is-win' : r.streakType === 'LOSS' ? 'is-loss' : ''}`}>
                  {r.streakType ? `${r.streakType === 'WIN' ? 'W' : 'L'}${r.streakCount}` : '—'}
                </span>
                <span className="season-pct">{r.winPct}% · {r.decided + r.p} PICKS</span>
              </div>
            ))
          )}

          <div className="sub-head">
            <span className="sub-head__tag">THE RECEIPTS</span>
            <h3 className="sub-head__title">Recently <em>Graded</em></h3>
          </div>
          {recentGraded.length === 0 ? (
            <div className="empty-line">Nothing graded yet.</div>
          ) : (
            <div className="graded-strip">
              {recentGraded.map(l => (
                <div className="graded-chip" key={l.dbId}>
                  <span className={`graded-chip__status is-${l.status.toLowerCase()}`}>{l.status === 'PUSH' ? 'P' : l.status === 'WIN' ? 'W' : 'L'}</span>
                  <span className="graded-chip__text"><strong>{l.handle}</strong>{l.pick}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== 03 / THE BIG BOARD ===== */}
        <section className="board-section fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">03</span>
              <h2 className="section-head__title">Draft <em>Heat Index</em></h2>
              <Blip text="The war-room big board — every mock aggregated into one consensus. Tiers, trends, ranges, and probability bars. Editor-controlled, with an AI that drafts the scouting read from the facts you type." />
            </div>
            <div className="section-head__tools">
              {userRole && (
                <button className="ledger-add-btn" onClick={() => { setShowAddProspect(v => !v); setProspectError(null); }}>
                  <Plus size={12} /> {showAddProspect ? 'Close' : 'Add Prospect'}
                </button>
              )}
              <span className="section-head__count">{prospects.length} ON THE BOARD</span>
            </div>
          </div>

          {userRole && showAddProspect && (
            <form className="ledger-form" onSubmit={handleAddProspect}>
              <div className="ledger-form__row">
                <div className="ledger-field">
                  <span className="ledger-field__label">Name</span>
                  <input className="ledger-input" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Cooper Flagg" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Position</span>
                  <input className="ledger-input" value={pPos} onChange={(e) => setPPos(e.target.value)} placeholder="F" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">School</span>
                  <input className="ledger-input" value={pSchool} onChange={(e) => setPSchool(e.target.value)} placeholder="Duke" />
                </div>
              </div>
              <div className="ledger-form__row">
                <div className="ledger-field">
                  <span className="ledger-field__label">Board Rank</span>
                  <input className="ledger-input" value={pRank} onChange={(e) => setPRank(e.target.value)} placeholder="13" inputMode="numeric" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Tier</span>
                  <select className="ledger-select" value={pTier} onChange={(e) => setPTier(e.target.value)}>
                    <option value="1">1 — FRANCHISE</option>
                    <option value="2">2 — LOTTERY</option>
                    <option value="3">3 — FIRST ROUND</option>
                    <option value="4">4 — BUBBLE</option>
                  </select>
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Consensus %</span>
                  <input className="ledger-input" value={pProb} onChange={(e) => setPProb(e.target.value)} placeholder="25" inputMode="numeric" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Trend</span>
                  <select className="ledger-select" value={pTrend} onChange={(e) => setPTrend(e.target.value as "RISING" | "FALLING" | "STEADY")}>
                    <option>RISING</option>
                    <option>FALLING</option>
                    <option>STEADY</option>
                  </select>
                </div>
              </div>
              <div className="ledger-form__row">
                <div className="ledger-field">
                  <span className="ledger-field__label">Slot</span>
                  <input className="ledger-input" value={pSlot} onChange={(e) => setPSlot(e.target.value)} placeholder="Consensus #13" />
                </div>
                <div className="ledger-field">
                  <span className="ledger-field__label">Range</span>
                  <input className="ledger-input" value={pRange} onChange={(e) => setPRange(e.target.value)} placeholder="10–20" />
                </div>
              </div>
              <div className="ledger-field is-wide">
                <span className="ledger-field__label">The Read</span>
                <textarea className="ledger-textarea" value={pRead} onChange={(e) => setPRead(e.target.value)} placeholder="Type the scouting line, or hit Draft the Read and let the AI write one from the facts above." />
              </div>
              {prospectError && <div className="ledger-form__error">{prospectError}</div>}
              <div className="ledger-form__actions">
                <button
                  type="button"
                  className="ai-draft-btn"
                  onClick={handleDraftRead}
                  disabled={readDrafting || !pName.trim()}
                >
                  {readDrafting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {readDrafting ? 'Drafting...' : '✦ Draft the Read'}
                </button>
                <button type="button" className="ledger-cancel" onClick={() => setShowAddProspect(false)}>Cancel</button>
                <button type="submit" className="ledger-submit" disabled={savingProspect}>
                  {savingProspect ? <Loader2 size={12} className="animate-spin" /> : null}
                  {savingProspect ? 'Filing...' : 'Add to the Board'}
                </button>
              </div>
            </form>
          )}

          {prospects.length === 0 ? (
            <div className="empty-line">The board is empty — an admin visit seeds the consensus.</div>
          ) : (
            [1, 2, 3, 4].map(t => {
              const rows = prospects.filter(p => p.tier === t).sort((a, b) => a.rank - b.rank);
              if (!rows.length) return null;
              return (
                <div key={t}>
                  <div className="tier-band">
                    <span className="tier-band__num">TIER {['I', 'II', 'III', 'IV'][t - 1]}</span>
                    <h3 className="tier-band__title">{TIER_LABELS[t].split(' ').slice(0, -1).join(' ')} <em>{TIER_LABELS[t].split(' ').slice(-1)}</em></h3>
                  </div>
                  {rows.map(p => (
                    <div className="board-row heat-item" key={p.dbId || p.rank} style={{ ['--w' as any]: `${p.prob}%` }}>
                      <div className="board-top">
                        <span className="board-rank">{String(p.rank).padStart(2, '0')}</span>
                        <div>
                          <span className="board-name">{p.name}</span>
                          <span className="board-meta">{p.pos} · {p.school} · {p.slot} · RANGE {p.range}</span>
                        </div>
                        <span className={`trend-pill is-${p.trend.toLowerCase()}`}>
                          {p.trend === 'RISING' ? '↑' : p.trend === 'FALLING' ? '↓' : '—'} {p.trend}
                        </span>
                        <div className="board-barwrap">
                          <div className="heat-bar"><div className="heat-bar__fill" /></div>
                        </div>
                        <span className="board-prob">{p.prob}%</span>
                        {userRole && p.dbId && (
                          <button className="ledger-icon-btn is-del" onClick={() => deleteProspect(p)} aria-label="Remove prospect">
                            <X size={11} />
                          </button>
                        )}
                      </div>
                      {p.read && <p className="board-read">{p.read}</p>}
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </section>

        {/* ===== 04 / COVERAGE ===== */}
        <section className="fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">04</span>
              <h2 className="section-head__title">Sports <em>Coverage</em></h2>
              <Blip text="Every sports-tagged story from the newsroom, aggregated into one feed." />
            </div>
            <span className="section-head__count">{articles.length} STORIES</span>
          </div>

          {loading ? (
            <div className="loading-line">Pulling the board...</div>
          ) : articles.length === 0 ? (
            <div className="loading-line">No sports coverage published yet.</div>
          ) : (
            <div className="story-grid">
              {articles.slice(0, 6).map((a, i) => (
                <article className="story" key={i}>
                  <Link href={`/article?title=${encodeURIComponent(a.title)}&source=${encodeURIComponent(a.source || "The Akademy")}`} className="story__image">
                    <img src={a.thumbnail_url || `https://picsum.photos/seed/field-${i}/600/375`} alt="" />
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