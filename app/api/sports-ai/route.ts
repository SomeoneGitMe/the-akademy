// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/* ============ LLM PROVIDERS ============ */
const PROVIDERS = [
  { name: 'Cerebras', key: () => process.env.CEREBRAS_API_KEY, base: 'https://api.cerebras.ai/v1' },
  { name: 'Groq', key: () => process.env.GROQ_API_KEY, base: 'https://api.groq.com/openai/v1' },
];

function scoreModel(id: string): number {
  const s = (id || '').toLowerCase();
  let score = 0;
  if (/llama[\s._-]*3[._-]?3/.test(s)) score += 40;
  else if (/llama[\s._-]*3[._-]?1/.test(s)) score += 30;
  else if (/gpt-oss/.test(s)) score += 35;
  else if (/llama/.test(s)) score += 15;
  if (/(70b|120b)/.test(s)) score += 25;
  else if (/8b/.test(s)) score += 5;
  if (/instruct|versatile|instant/.test(s)) score += 5;
  if (/embed|whisper|guard|tts|rerank|vision|preview|deprecated|distil|moderation/.test(s)) score -= 100;
  return score;
}

async function discoverModel(p: { key: string; base: string }): Promise<string | null> {
  try {
    const res = await fetch(`${p.base}/models`, {
      headers: { Authorization: `Bearer ${p.key}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const ids = (data.data || []).map((m: any) => m.id).filter(Boolean);
    ids.sort((a: string, b: string) => scoreModel(b) - scoreModel(a));
    return ids[0] || null;
  } catch { return null; }
}

async function callLLM(system: string, user: string, temperature: number, maxTokens: number) {
  for (const p of PROVIDERS) {
    const apiKey = p.key();
    if (!apiKey) continue;
    const model = await discoverModel({ key: apiKey, base: p.base });
    if (!model) continue;
    try {
      const res = await fetch(`${p.base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model, temperature, max_tokens: maxTokens,
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return { content, model, provider: p.name };
    } catch { /* next provider */ }
  }
  return null;
}

function extractJson(text: string): any {
  let t = (text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/g, '').trim();
  const first = t.indexOf('{'); const last = t.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  try { return JSON.parse(t.slice(first, last + 1)); } catch { return null; }
}

/* ============ ACCENT NORMALIZATION ============ */
const deaccent = (s: string) =>
  String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n').replace(/ø/g, 'o').toLowerCase().trim();

/* ============ DATE HELPERS ============ */
const toMs = (d: any) => {
  try { const t = new Date(d); return isNaN(t.getTime()) ? 0 : t.getTime(); } catch { return 0; }
};

/* ============ REGISTRY ============ */
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports';
const MLB_API = 'https://statsapi.mlb.com/api/v1';
const BDL = 'https://api.balldontlie.io/v1';

/* ============ CACHED HTTP ============ */
const mem = new Map<string, { t: number; v: any }>();
async function cached(key: string, ttlMs: number, fn: () => Promise<any>) {
  const hit = mem.get(key);
  if (hit && Date.now() - hit.t < ttlMs) return hit.v;
  const v = await fn();
  if (v != null && (!Array.isArray(v) || v.length > 0)) mem.set(key, { t: Date.now(), v });
  return v;
}

async function httpGet(url: string, timeoutMs = 10000, headers: any = null): Promise<any> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; AkademyAlmanac/1.0)', ...(headers || {}) },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); } catch { return iso; }
};
const cap = (s: string) => String(s || '').replace(/\b\w/g, c => c.toUpperCase());

/* ================================================================
   BALLDONTLIE — NBA booster
   ============================================================ */

const bdlKey = () => process.env.BALLDONTLIE_API_KEY;

async function bdlSearchPlayer(name: string) {
  const key = bdlKey();
  if (!key) return null;
  return cached(`bdl:player:${name.toLowerCase()}`, 6 * 3600 * 1000, async () => {
    const data = await httpGet(`${BDL}/players?search=${encodeURIComponent(name)}`, 8000, { Authorization: key });
    const arr = data?.data || data?.players || [];
    const q = deaccent(name);
    const hit = arr.find((p: any) => deaccent(`${p.first_name} ${p.last_name}`) === q)
      || arr.find((p: any) => {
        const full = deaccent(`${p.first_name} ${p.last_name}`);
        return full.includes(q) || q.includes(full);
      });
    if (!hit) return null;
    return {
      id: hit.id,
      name: `${hit.first_name} ${hit.last_name}`,
      teamAbbr: hit.team?.abbreviation || '',
      teamId: hit.team?.id ? String(hit.team.id) : null,
    };
  });
}

const BDL_STAT_MAP: Record<string, string> = {
  points: 'pts',
  rebounds: 'reb',
  assists: 'ast',
  threes: 'fg3m',
  steals: 'stl',
  blocks: 'blk',
  turnovers: 'turnover',
};

async function bdlGetStats(playerId: number, statKey: string) {
  const key = bdlKey();
  if (!key) return null;
  const bdlStat = BDL_STAT_MAP[statKey];
  if (!bdlStat) return null;
  const season = new Date().getFullYear() - (new Date().getMonth() < 7 ? 1 : 0);

  const avg = await cached(`bdl:avg:${playerId}:${statKey}:${season}`, 15 * 60 * 1000, async () => {
    const data = await httpGet(`${BDL}/season_averages?season=${season}&player_ids[]=${playerId}`, 8000, { Authorization: key });
    const row = (data?.data || [])[0];
    if (!row || row[bdlStat] == null) return null;
    return Number(row[bdlStat]);
  });
  if (avg == null || isNaN(avg)) return null;

  const games = await cached(`bdl:games:${playerId}:${statKey}:${season}`, 15 * 60 * 1000, async () => {
    const vals: number[] = [];
    let cursor = null;
    for (let page = 1; page <= 2; page++) {
      const url = cursor
        ? `${BDL}/stats?player_ids[]=${playerId}&season=${season}&cursor=${cursor}&per_page=25`
        : `${BDL}/stats?player_ids[]=${playerId}&season=${season}&per_page=25`;
      const data = await httpGet(url, 8000, { Authorization: key });
      const rows = data?.data || [];
      if (!rows.length) break;
      for (const r of rows) {
        const v = r?.stat?.[bdlStat];
        if (v != null && !isNaN(Number(v))) vals.push(Number(v));
      }
      cursor = data?.meta?.next_cursor;
      if (!cursor) break;
    }
    const chrono = vals.slice().reverse();
    return chrono.slice(-5);
  });
  if (!games || !games.length) return null;

  return { avg: Math.round(avg * 10) / 10, last5: games, count: games.length, source: 'Balldontlie' };
}

/* ================================================================
   MLB PATH — statsapi.mlb.com (official)
   ============================================================ */

interface StatDef { key: string; label: string; aliases: string[]; cols: string[]; mlbGroup?: string; mlbStat?: string; }

const KIND_STATS: Record<string, StatDef[]> = {
  basketball: [
    { key: 'points',    label: 'PTS',  aliases: ['pts','points','point','ppg'], cols: ['pts','points'] },
    { key: 'rebounds',  label: 'REB',  aliases: ['reb','rebs','rebounds','boards','rpg'], cols: ['reb','trb','rebounds'] },
    { key: 'assists',   label: 'AST',  aliases: ['ast','assists','apg','dimes'], cols: ['ast','assists'] },
    { key: 'threes',    label: '3PM',  aliases: ['3pm','3ptm','3pt','threes','triples','3 pointers'], cols: ['3pm','3ptm','fg3m','3pt'] },
    { key: 'steals',    label: 'STL',  aliases: ['stl','steals','spg'], cols: ['stl','steals'] },
    { key: 'blocks',    label: 'BLK',  aliases: ['blk','blocks','bpg'], cols: ['blk','blocks'] },
  ],
  nfl: [
    { key: 'pass_yds',   label: 'PASS YDS', aliases: ['pass yds','passing yards','pass yrds','pass yards','passing yds','throwing yards'], cols: ['yds','yards'] },
    { key: 'rush_yds',   label: 'RUSH YDS', aliases: ['rush yds','rushing yards','rush yrds','rush yards','rushing yds','carrying yards','ground yards'], cols: ['yds','yards'] },
    { key: 'rec_yds',    label: 'REC YDS',  aliases: ['rec yds','receiving yards','rec yrds','rec yards','receiving yds','catch yards','air yards'], cols: ['yds','yards'] },
    { key: 'receptions', label: 'REC',      aliases: ['receptions','catches','rec'], cols: ['rec','receptions','catches'] },
    { key: 'pass_td',    label: 'PASS TD',  aliases: ['pass td','passing td','pass tds','passing tds','td pass'], cols: ['td','tds','touchdowns'] },
    { key: 'rush_td',    label: 'RUSH TD',  aliases: ['rush td','rushing td','rush tds','rushing tds','td run'], cols: ['td','tds','touchdowns'] },
    { key: 'total_td',   label: 'TD',       aliases: ['td','tds','touchdown','touchdowns','total tds','anytime td','any time td'], cols: ['td','tds','touchdowns'] },
  ],
  mlb: [
    { key: 'hits',        label: 'HITS', aliases: ['hits','base hits'], cols: ['h','hits'], mlbGroup: 'hitting', mlbStat: 'hits' },
    { key: 'home_runs',   label: 'HR',   aliases: ['hr','hrs','home run','home runs','homeruns','homers','bombs','dingers'], cols: ['hr','home runs'], mlbGroup: 'hitting', mlbStat: 'homeRuns' },
    { key: 'rbis',        label: 'RBI',  aliases: ['rbi','rbis','runs batted in'], cols: ['rbi','rbis'], mlbGroup: 'hitting', mlbStat: 'rbi' },
    { key: 'runs',        label: 'RUNS', aliases: ['runs scored'], cols: ['r','runs'], mlbGroup: 'hitting', mlbStat: 'runs' },
    { key: 'strikeouts',  label: 'K',    aliases: ['strikeouts','strike out','ks'], cols: ['so','k','strikeouts'], mlbGroup: 'pitching', mlbStat: 'strikeOuts' },
    { key: 'innings',     label: 'IP',   aliases: ['innings','innings pitched','ip','frames'], cols: ['ip','innings'], mlbGroup: 'pitching', mlbStat: 'inningsPitched' },
    { key: 'earned_runs', label: 'ER',   aliases: ['earned runs','er'], cols: ['er','earned runs'], mlbGroup: 'pitching', mlbStat: 'earnedRuns' },
  ],
  nhl: [
    { key: 'goals',   label: 'G',   aliases: ['goals','goal','ginos'], cols: ['g','goals'] },
    { key: 'assists', label: 'A',   aliases: ['assists','apples'], cols: ['a','assists'] },
    { key: 'points',  label: 'PTS', aliases: ['pts','points','point'], cols: ['p','pts','points'] },
    { key: 'shots',   label: 'SOG', aliases: ['sog','shots on goal','shots'], cols: ['sog','shots','sh'] },
  ],
  soccer: [
    { key: 'goals',   label: 'G',  aliases: ['goals','goal','goals scored'], cols: ['g','gl','goals','gf'] },
    { key: 'assists', label: 'A',  aliases: ['assists','helpers'], cols: ['a','ast','assists'] },
    { key: 'shots',   label: 'SH', aliases: ['shots','shot attempts'], cols: ['sh','shots','shs'] },
  ],
};

const REGISTRY = [
  { key: 'mlb',        sport: 'baseball',   league: 'mlb',   label: 'MLB',        kind: 'mlb',        primary: 'hits',      useMLB: true },
  { key: 'nba',        sport: 'basketball', league: 'nba',   label: 'NBA',        kind: 'basketball', primary: 'points',    useMLB: false },
  { key: 'wnba',       sport: 'basketball', league: 'wnba',  label: 'WNBA',       kind: 'basketball', primary: 'points',    useMLB: false },
  { key: 'nfl',        sport: 'football',   league: 'nfl',   label: 'NFL',        kind: 'nfl',        primary: 'pass_yds',  useMLB: false },
  { key: 'nhl',        sport: 'hockey',     league: 'nhl',   label: 'NHL',        kind: 'nhl',        primary: 'goals',     useMLB: false },
  { key: 'epl',        sport: 'soccer',     league: 'eng.1', label: 'EPL',        kind: 'soccer',     primary: 'goals',     useMLB: false },
  { key: 'mls',        sport: 'soccer',     league: 'usa.1', label: 'MLS',        kind: 'soccer',     primary: 'goals',     useMLB: false },
  { key: 'laliga',     sport: 'soccer',     league: 'esp.1', label: 'LaLiga',     kind: 'soccer',     primary: 'goals',     useMLB: false },
  { key: 'seriea',     sport: 'soccer',     league: 'ita.1', label: 'Serie A',    kind: 'soccer',     primary: 'goals',     useMLB: false },
  { key: 'bundesliga', sport: 'soccer',     league: 'ger.1', label: 'Bundesliga', kind: 'soccer',     primary: 'goals',     useMLB: false },
  { key: 'ligue1',     sport: 'soccer',     league: 'fra.1', label: 'Ligue 1',    kind: 'soccer',     primary: 'goals',     useMLB: false },
];

const ALL_STATS: StatDef[] = Object.values(KIND_STATS).flat();
const statDefFor = (key: string) => ALL_STATS.find(s => s.key === key) || null;

/* Word-boundary MLB detection — "Pass Yds" can never trigger baseball */
function isMLBQuery(prop: string): boolean {
  const q = prop.toLowerCase();
  const baseballWords = ['strikeouts','strikeout','strike out','homers','homer','home runs','home run','hrs','rbi','rbis','innings','earned runs','hits','batting average','pitcher','pitching','shutout','no-hitter'];
  for (const w of baseballWords) {
    const re = new RegExp(`\\b${w.replace(/ /g, '\\s+')}\\b`, 'i');
    if (re.test(q)) return true;
  }
  if (/\b(k|so)\s*(outs?|strikeouts?)\b/i.test(q) || /\bover\s+\d+(\.\d+)?\s*(k|so)\b/i.test(q)) return true;
  if (/\b(baseball|mlb)\b/i.test(q)) return true;
  return false;
}

async function mlbSearchPlayer(name: string) {
  return cached(`mlb:search:${name.toLowerCase()}`, 30 * 60 * 1000, async () => {
    const data = await httpGet(`${MLB_API}/people?names=${encodeURIComponent(name)}`);
    if (!data?.people?.length) return null;
    const p = data.people[0];
    return {
      id: p.id,
      name: p.fullName,
      position: p.primaryPosition?.abbreviation || '',
      teamId: p.currentTeam?.id || null,
      teamName: p.currentTeam?.name || '',
      isPitcher: ['P', 'SP', 'RP', 'LHP', 'RHP'].includes(p.primaryPosition?.abbreviation || ''),
    };
  });
}

async function mlbAllRosters() {
  return cached('mlb:allrosters', 6 * 3600 * 1000, async () => {
    const data = await httpGet(`${MLB_API}/teams?sportId=1&fields=teams,id,name`);
    const teams = data?.teams || [];
    const out: any[] = [];
    for (const t of teams) {
      const roster = await httpGet(`${MLB_API}/teams/${t.id}/roster?rosterType=active`);
      const entries = (roster?.roster || []).map((r: any) => ({
        id: r.person?.id,
        name: r.person?.fullName || '',
        norm: deaccent(r.person?.fullName || ''),
        position: r.position?.abbreviation || '',
        teamId: t.id,
        teamName: t.name,
      })).filter((r: any) => r.id && r.norm);
      out.push(...entries);
    }
    return out;
  });
}

async function mlbRosterLookup(query: string) {
  const rosters = await mlbAllRosters();
  if (!rosters?.length) return null;
  const q = deaccent(query);
  if (!q) return null;

  let hit = rosters.find((r: any) => r.norm === q);
  if (!hit) {
    const qLast = q.split(/\s+/).pop();
    const lastName = (r: any) => r.norm.split(/\s+/).pop();
    if (qLast && qLast.length > 2) {
      const lastMatches = rosters.filter((r: any) => lastName(r) === qLast);
      if (lastMatches.length === 1) hit = lastMatches[0];
    }
  }
  if (!hit) {
    const contains = rosters.filter((r: any) => r.norm.includes(q) || q.includes(r.norm));
    if (contains.length === 1) hit = contains[0];
  }

  if (!hit) return null;
  return {
    id: hit.id,
    name: hit.name,
    position: hit.position,
    teamId: hit.teamId,
    teamName: hit.teamName,
    isPitcher: ['P', 'SP', 'RP', 'LHP', 'RHP'].includes(hit.position),
  };
}

async function mlbMatchTeam(query: string) {
  return cached(`mlb:team:${deaccent(query)}`, 6 * 3600 * 1000, async () => {
    const data = await httpGet(`${MLB_API}/teams?sportId=1`);
    const q = deaccent(query);
    const teams = (data?.teams || []).map((t: any) => ({
      id: t.id, name: t.name,
      norm: deaccent(t.name),
      abbr: deaccent(t.abbreviation || t.teamName || ''),
    }));
    return teams.find((t: any) =>
      t.norm === q || t.abbr === q || t.norm.includes(q) || (q.length >= 4 && q.includes(t.norm))
    ) || null;
  });
}

async function mlbGetGamelog(playerId: number, isPitcher: boolean, statKey: string) {
  const def = statDefFor(statKey);
  const group = def?.mlbGroup || (isPitcher ? 'pitching' : 'hitting');
  const season = new Date().getFullYear();
  return cached(`mlb:gamelog:${playerId}:${statKey}:${season}`, 15 * 60 * 1000, async () => {
    const data = await httpGet(`${MLB_API}/people/${playerId}/stats?stats=gameLog&group=${group}&season=${season}`);
    if (!data?.stats?.length || !data.stats[0]?.splits?.length) return null;
    const splits = data.stats[0].splits;
    const mlbStat = def?.mlbStat;
    if (!mlbStat) return null;
    const vals = splits.map(s => Number(s.stat?.[mlbStat] ?? 0)).filter(v => !isNaN(v));
    if (!vals.length) return null;
    const last5 = vals.slice(-5);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { avg: Math.round(avg * 10) / 10, last5, count: vals.length };
  });
}

async function mlbGetTeamSchedule(teamId: number, daysAhead = 7, daysBack = 7) {
  const now = new Date();
  const start = new Date(now.getTime() - daysBack * 86400000).toISOString().slice(0, 10);
  const end = new Date(now.getTime() + daysAhead * 86400000).toISOString().slice(0, 10);
  return cached(`mlb:sched:${teamId}:${start}:${end}`, 30 * 60 * 1000, async () => {
    const data = await httpGet(`${MLB_API}/schedule?sportId=1&teamId=${teamId}&startDate=${start}&endDate=${end}`);
    if (!data?.dates?.length) return null;
    const games: any[] = [];
    for (const d of data.dates) {
      for (const g of (d.games || [])) {
        const home = g.teams?.home || {};
        const away = g.teams?.away || {};
        const isHome = Number(home.team?.id) === Number(teamId);
        const opp = isHome ? away : home;
        const oppProbable = isHome ? away?.probablePitcher : home?.probablePitcher;
        games.push({
          date: g.gameDate,
          dateMs: toMs(g.gameDate),
          status: g.status?.detailedState || '',
          completed: ['Final', 'Game Over', 'Completed'].includes(g.status?.detailedState || ''),
          opponent: opp?.team?.name || '',
          opponentId: opp?.team?.id ? String(opp.team.id) : null,
          opponentProbable: oppProbable?.fullName || null,
        });
      }
    }
    return games;
  });
}

/* ================================================================
   ESPN PATH
   ============================================================ */

async function espnGetTeams(entry: any) {
  return cached(`espn:teams:${entry.key}`, 12 * 3600 * 1000, async () => {
    const data = await httpGet(`${ESPN}/${entry.sport}/${entry.league}/teams?limit=500`);
    const picked: any[] = [];
    const push = (arr: any) => { if (Array.isArray(arr)) picked.push(...arr); };
    push(data?.teams);
    if (Array.isArray(data?.sports)) for (const s of data.sports) {
      push(s?.teams);
      if (Array.isArray(s?.leagues)) for (const l of s.leagues) push(l?.teams);
    }
    if (Array.isArray(data?.leagues)) for (const l of data.leagues) push(l?.teams);
    const seen = new Set<string>();
    const teams: any[] = [];
    for (const t of picked) {
      const x = t?.team || t;
      const id = String(x?.id || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      teams.push({
        id,
        name: String(x?.displayName || '').toLowerCase(),
        norm: deaccent(String(x?.displayName || '')),
        abbr: String(x?.abbreviation || '').toLowerCase(),
        league: entry.label,
      });
    }
    return teams;
  });
}

function espnMatchTeam(teams: any[], rawQuery: string) {
  const q = deaccent(rawQuery).replace(/^the\s+/, '').replace(/[.?!,;]+$/, '');
  if (!q) return null;
  return teams.find(t =>
    t.norm === q || t.abbr === q || t.norm.includes(q) || (q.length >= 4 && q.includes(t.norm))
  ) || null;
}

/* ================================================================
   THE DETERMINISTIC RESOLVER — per-league player indexes built
   from team rosters. Search is flaky; rosters are not.
   NFL = 32 calls once, cached 12 hours. This is what catches
   Mahomes when search returns 0.
   ============================================================ */

async function espnGetLeaguePlayerIndex(entry: any) {
  return cached(`espn:idx:${entry.key}`, 12 * 3600 * 1000, async () => {
    const teams = await espnGetTeams(entry);
    const players: any[] = [];
    for (const t of (teams || [])) {
      const roster = await httpGet(`${ESPN}/${entry.sport}/${entry.league}/teams/${t.id}/roster`, 8000);
      const athletes = roster?.team?.athletes || roster?.athletes || [];
      for (const a of athletes) {
        const norm = deaccent(a?.displayName || a?.fullName || '');
        if (!norm || !a?.id) continue;
        players.push({
          id: String(a.id),
          name: String(a.displayName || a.fullName),
          norm,
          pos: String(a.position?.abbreviation || ''),
          team: t.abbr.toUpperCase(),
          teamId: t.id,
          league: entry.label,
          entry,
        });
      }
    }
    return players;
  });
}

async function espnIndexLookup(playerQuery: string, entries: any[]) {
  const q = deaccent(playerQuery);
  if (!q) return null;
  const qLast = q.split(/\s+/).pop();
  for (const entry of entries) {
    if (entry.kind === 'soccer') continue; // soccer has no site-API rosters — search handles it
    const idx = await espnGetLeaguePlayerIndex(entry);
    if (!idx || !idx.length) continue;
    let hit = idx.find((p: any) => p.norm === q);
    if (!hit && qLast && qLast.length > 2) {
      const lastMatches = idx.filter((p: any) => p.norm.split(/\s+/).pop() === qLast);
      if (lastMatches.length === 1) hit = lastMatches[0];
    }
    if (!hit) {
      const contains = idx.filter((p: any) => p.norm.includes(q) || q.includes(p.norm));
      if (contains.length === 1) hit = contains[0];
    }
    if (hit) return hit;
  }
  return null;
}

/* ================================================================
   SCHEDULES — team feed + soccer scoreboard fallback.
   ESPN's soccer team-schedule endpoint lies (returns empty even
   on match days). The league scoreboard feed does not.
   ============================================================ */

async function espnTeamSchedule(entry: any, teamId: string) {
  return cached(`espn:teamsched:${entry.key}:${teamId}`, 30 * 60 * 1000, async () => {
    let data = await httpGet(`${ESPN}/${entry.sport}/${entry.league}/teams/${teamId}/schedule`);
    let events = data?.events || [];
    if (!events.length && entry.sport === 'soccer') {
      data = await httpGet(`${ESPN}/${entry.sport}/${entry.league}/teams/${teamId}/schedule?fixture=true`);
      events = data?.events || [];
    }
    return (events || []).map((ev: any) => {
      const comp = ev.competitions?.[0] || {};
      const home = (comp.competitors || []).find((c: any) => c?.homeAway === 'home');
      const away = (comp.competitors || []).find((c: any) => c?.homeAway === 'away');
      const opp = (String(home?.team?.id) === String(teamId)) ? away : home;
      return {
        id: ev.id,
        date: ev.date,
        dateMs: toMs(ev.date),
        completed: !!(comp.status?.type?.completed ?? ev.status?.type?.completed),
        competitionId: comp.id || ev.id,
        opponentId: opp?.team?.id ? String(opp.team.id) : null,
        opponentName: String(opp?.team?.displayName || opp?.team?.abbreviation || ev.name || ''),
      };
    });
  });
}

async function espnSoccerScheduleFromScoreboard(entry: any, teamId: string) {
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
  const now = new Date();
  const start = fmt(new Date(now.getTime() - 7 * 86400000));
  const end = fmt(new Date(now.getTime() + 7 * 86400000));
  return cached(`espn:sbsched:${entry.key}:${teamId}:${start}:${end}`, 30 * 60 * 1000, async () => {
    const data = await httpGet(`${ESPN}/${entry.sport}/${entry.league}/scoreboard?dates=${start}-${end}&limit=300`);
    const events = data?.events || [];
    const out: any[] = [];
    for (const ev of events) {
      const comp = ev.competitions?.[0] || {};
      const competitors = comp.competitors || [];
      const involves = competitors.some((c: any) => String(c?.team?.id) === String(teamId));
      if (!involves) continue;
      const opp = competitors.find((c: any) => String(c?.team?.id) !== String(teamId));
      out.push({
        id: ev.id,
        date: ev.date,
        dateMs: toMs(ev.date),
        completed: !!(comp.status?.type?.completed ?? ev.status?.type?.completed),
        competitionId: comp.id || ev.id,
        opponentId: opp?.team?.id ? String(opp.team.id) : null,
        opponentName: String(opp?.team?.displayName || opp?.team?.abbreviation || ev.name || ''),
      });
    }
    return out;
  });
}

async function espnGetSchedule(entry: any, teamId: string) {
  let games: any[] = (await espnTeamSchedule(entry, teamId)) || [];
  if (entry.sport === 'soccer') {
    const viaBoard = await espnSoccerScheduleFromScoreboard(entry, teamId);
    if (viaBoard && viaBoard.length) {
      const seen = new Set(games.map((g: any) => String(g.id)));
      for (const g of viaBoard) {
        if (!seen.has(String(g.id))) games.push(g);
      }
    }
  }
  return games;
}

function espnUpcoming(schedule: any[]) {
  const nowMs = Date.now();
  return (schedule || [])
    .filter(g => !g.completed && g.dateMs && g.dateMs > nowMs - 12 * 3600 * 1000)
    .sort((a, b) => a.dateMs - b.dateMs);
}

/* ============ STATS — dual source ============ */

function detectChronological(rows: any[][]): boolean {
  const monthOf = (v: any): any => {
    const s = String(v || '');
    let m: RegExpMatchArray | null;
    if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return { y: +m[1], mo: +m[2] };
    if ((m = s.match(/^(\d{1,2})\/(\d{1,2})$/))) return { mo: +m[1] };
    const d = new Date(s);
    if (!isNaN(d.getTime()) && d.getFullYear() > 2005) return { y: d.getFullYear(), mo: d.getMonth() + 1 };
    return null;
  };
  const first = monthOf(rows[0]?.[0]);
  const last = monthOf(rows[rows.length - 1]?.[0]);
  if (first && last && first.y && last.y) {
    return first.y < last.y || (first.y === last.y && first.mo <= last.mo);
  }
  const months = rows.map(r => monthOf(r[0])?.mo).filter((m: any) => m);
  let inc = 0, dec = 0;
  for (let i = 1; i < months.length; i++) {
    const d = months[i] - months[i - 1];
    if (d === 1) inc++; else if (d === -1) dec++;
  }
  return dec > inc ? false : true;
}

async function espnGetStatsFromGamelog(entry: any, athleteId: string, statKey: string) {
  const def = statDefFor(statKey);
  if (!def) return null;
  return cached(`espn:glog:${entry.key}:${athleteId}:${statKey}`, 30 * 60 * 1000, async () => {
    const data = await httpGet(`${ESPN}/${entry.sport}/${entry.league}/athletes/${athleteId}/gamelog`);
    const root = data?.seasonTypes ? data : (data?.data || null);
    if (!root?.seasonTypes) return null;
    const cats: any[] = [];
    for (const st of root.seasonTypes) for (const c of (st.categories || [])) cats.push(c);
    if (!cats.length) return null;

    const catName = (c: any) => String(c.name || c.displayName || '').toLowerCase();
    const preferred = def.cats ? cats.filter(c => def.cats.some(h => catName(c).includes(h))) : cats;
    const searchCats = preferred.length ? preferred : cats;

    let rows: any[] | null = null, statCol = -1;
    for (const c of searchCats) {
      if (!Array.isArray(c.rows) || !c.rows.length) continue;
      const labels = (c.displayNames || c.colNames || c.labels || []).map((x: any) => String(x).toLowerCase());
      if (!labels.length) continue;
      let idx = -1;
      for (const w of def.cols) {
        idx = labels.findIndex(l => l === w);
        if (idx === -1) idx = labels.findIndex(l => l.replace(/[^a-z0-9]/g, '') === w.replace(/[^a-z0-9]/g, ''));
        if (idx !== -1) break;
      }
      if (idx !== -1) { rows = c.rows; statCol = idx; break; }
    }
    if (!rows || statCol === -1) return null;

    let ordered = rows;
    try { if (!detectChronological(rows)) ordered = [...rows].reverse(); } catch { /* keep order */ }

    const vals = ordered.map(r => Number(String(r[statCol] ?? '').replace(/[^0-9.\-]/g, ''))).filter(v => !isNaN(v));
    if (!vals.length) return null;
    const last5 = vals.slice(-5);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { avg: Math.round(avg * 10) / 10, last5, count: vals.length };
  });
}

async function espnGetEventSummary(entry: any, competitionId: string) {
  return cached(`espn:box:${entry.key}:${competitionId}`, 15 * 60 * 1000, async () => {
    return await httpGet(`${ESPN}/${entry.sport}/${entry.league}/summary?event=${competitionId}`);
  });
}

async function espnGetStatsFromBoxscores(entry: any, teamId: string, athleteId: string, statKey: string, numGames = 5) {
  const schedule = await espnGetSchedule(entry, teamId);
  if (!schedule?.length) return null;

  const nowMs = Date.now();
  const recent = (schedule || [])
    .filter(g => g.dateMs && g.dateMs < nowMs)
    .sort((a, b) => b.dateMs - a.dateMs)
    .slice(0, numGames);
  if (!recent.length) return null;

  const def = statDefFor(statKey);
  if (!def) return null;

  const statPromises = recent.map(async game => {
    try {
      const box = await espnGetEventSummary(entry, String(game.competitionId));
      if (!box?.boxscore?.players) return null;
      for (const teamPlayers of box.boxscore.players) {
        for (const stat of (teamPlayers.statistics || [])) {
          for (const athlete of (stat.athletes || [])) {
            if (String(athlete.athlete?.id) === String(athleteId)) {
              const labels = (stat.labels || []).map((l: any) => String(l).toLowerCase());
              for (const col of def.cols) {
                const idx = labels.findIndex(l => l === col || l.replace(/[^a-z0-9]/g, '') === col.replace(/[^a-z0-9]/g, ''));
                if (idx !== -1 && athlete.stats?.[idx] !== undefined) {
                  return Number(String(athlete.stats[idx]).replace(/[^0-9.\-]/g, '')) || 0;
                }
              }
              return null;
            }
          }
        }
      }
      return null;
    } catch { return null; }
  });

  const results = await Promise.all(statPromises);
  const valid = results.filter(v => v !== null && !isNaN(v));
  if (!valid.length) return null;
  const chrono = valid.slice().reverse();
  const avg = chrono.reduce((a, b) => a + b, 0) / chrono.length;
  return { avg: Math.round(avg * 10) / 10, last5: chrono.slice(-5), count: chrono.length };
}

async function espnGetPlayerStats(entry: any, teamId: string, athleteId: string, statKey: string, playerName: string) {
  if (entry?.key === 'nba') {
    const bdlPlayer = await bdlSearchPlayer(playerName);
    if (bdlPlayer) {
      const bdlStats = await bdlGetStats(bdlPlayer.id, statKey);
      if (bdlStats) return bdlStats;
    }
  }
  const viaGamelog = await espnGetStatsFromGamelog(entry, athleteId, statKey);
  if (viaGamelog) return { ...viaGamelog, source: 'ESPN Gamelog' };
  const viaBox = await espnGetStatsFromBoxscores(entry, teamId, athleteId, statKey, 5);
  if (viaBox) return { ...viaBox, source: 'ESPN Boxscores' };
  return null;
}

/* ============ SEARCH (fast path, kept — flaky but cheap) ============ */

async function espnSearchPlayer(query: string): Promise<any[]> {
  return cached(`espn:search:${query.toLowerCase()}`, 60 * 60 * 1000, async () => {
    const data = await httpGet(`https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(query)}&limit=10`);
    const q = query.toLowerCase();
    const out: any[] = [];
    for (const r of (data?.results || [])) {
      const typeStr = String(r?.type || '').toLowerCase();
      if (!['athlete', 'player'].includes(typeStr)) continue;
      const text = String(r?.text || r?.displayName || '').toLowerCase();
      if (!text || !(text === q || text.includes(q) || q.includes(text))) continue;
      let href = '';
      if (typeof r?.url === 'string' && r.url) href = r.url;
      else if (typeof r?.link?.web?.href === 'string') href = r.link.web.href;
      else if (typeof r?.link === 'string') href = r.link;
      else if (typeof r?.links?.web?.href === 'string') href = r.links.web.href;
      if (!href) continue;
      const idM = href.match(/\/id\/(\d+)/) || href.match(/\/athletes\/(\d+)/);
      if (!idM) continue;
      const athleteId = idM[1];
      const slugM = href.match(/espn\.com\/([a-z0-9.]+)\//i);
      const slug = slugM ? slugM[1].toLowerCase() : '';
      const direct = REGISTRY.find(e => slug === e.league || slug === e.key);
      if (direct) { out.push({ entry: direct, athleteId, name: text }); continue; }
      if (slug === 'soccer') {
        const hay = `${r?.subType || ''} ${r?.description || ''} ${text}`.toLowerCase();
        const sniffed =
          hay.includes('mls') ? REGISTRY.find(e => e.key === 'mls') :
          (hay.includes('premier') || hay.includes('epl')) ? REGISTRY.find(e => e.key === 'epl') :
          (hay.includes('la liga') || hay.includes('laliga')) ? REGISTRY.find(e => e.key === 'laliga') :
          hay.includes('serie') ? REGISTRY.find(e => e.key === 'seriea') :
          hay.includes('bundes') ? REGISTRY.find(e => e.key === 'bundesliga') :
          hay.includes('ligue') ? REGISTRY.find(e => e.key === 'ligue1') : null;
        if (sniffed) out.push({ entry: sniffed, athleteId, name: text });
      }
    }
    return out;
  });
}

/* ============ HELPERS ============ */

function statFromQueryText(query: string, kind: string | null): string {
  const q = ` ${query.toLowerCase()} `;
  const found = new Set<string>();
  for (const def of ALL_STATS) {
    for (const a of def.aliases) {
      if (a.length < 3) continue;
      if (q.includes(` ${a} `) || q.includes(` ${a}s `)) { found.add(def.key); break; }
    }
  }
  if (found.size === 1) return [...found][0];
  if (kind) {
    const primary = REGISTRY.find(e => e.kind === kind && e.primary)?.primary;
    if (primary) return primary;
  }
  return 'points';
}

/* ============ COMBAT — UFC + BOXING ============ */

const COMBAT_SOURCES = [
  { path: 'mma/ufc', label: 'UFC' },
  { path: 'boxing', label: 'BOXING' },
];

const nameMatch = (a: string, b: string) => {
  const x = deaccent(a), y = deaccent(b);
  if (!x || !y) return false;
  const xl = x.split(/\s+/).pop(), yl = y.split(/\s+/).pop();
  return x === y || x.includes(y) || y.includes(x) || (xl && yl && xl.length > 3 && xl === yl);
};

async function scanCombatCards() {
  return cached('combat:next14', 60 * 60 * 1000, async () => {
    const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
    const today = new Date();
    const start = fmt(today);
    const end = fmt(new Date(today.getTime() + 14 * 86400000));
    const cards: any[] = [];
    for (const src of COMBAT_SOURCES) {
      let events: any[] = [];
      const range = await httpGet(`${ESPN}/${src.path}/scoreboard?dates=${start}-${end}`);
      (range?.events || []).forEach(e => events.push(e));
      if (!events.length) {
        for (let i = 0; i < 14; i += 2) {
          const d = await httpGet(`${ESPN}/${src.path}/scoreboard?dates=${fmt(new Date(today.getTime() + i * 86400000))}`);
          (d?.events || []).forEach(e => events.push(e));
        }
      }
      for (const ev of (events || [])) {
        if (ev.status?.type?.completed) continue;
        const comp = ev.competitions?.[0] || {};
        const fighters = (comp.competitors || []).map((c: any) => ({
          name: String(c.athlete?.displayName || c.athlete?.fullName || '').toLowerCase(),
          raw: String(c.athlete?.displayName || c.athlete?.fullName || ''),
        })).filter((f: any) => f.name);
        if (fighters.length < 2) continue;
        cards.push({
          date: ev.date,
          event: String(ev.name || ev.title || `${src.label} Event`),
          league: src.label,
          fighters,
        });
      }
    }
    return cards.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  });
}

async function matchFight(fighterQuery: string, opponentQuery: string | null) {
  const cards = await scanCombatCards();
  let mismatchCard: any = null;
  for (const card of cards) {
    const [a, b] = card.fighters;
    const aMatch = nameMatch(a.name, fighterQuery);
    const bMatch = nameMatch(b.name, fighterQuery);
    if (!aMatch && !bMatch) continue;
    const fighter = aMatch ? a : b;
    const opponent = aMatch ? b : a;
    if (opponentQuery) {
      if (nameMatch(opponent.name, opponentQuery)) {
        return { fighter: fighter.raw, opponent: opponent.raw, date: card.date, event: card.event, league: card.league };
      }
      mismatchCard = mismatchCard || { fighter: fighter.raw, opponent: opponent.raw, date: card.date, event: card.event, league: card.league, mismatch: true };
    } else {
      return { fighter: fighter.raw, opponent: opponent.raw, date: card.date, event: card.event, league: card.league };
    }
  }
  return null;
}

/* ============ PROMPTS ============ */

const VALID_STAT_KEYS = ALL_STATS.map(s => s.key).join(', ');

const EXTRACT_SYS = `You extract components from a sports prop query. You do NOT generate statistics or facts. Respond with ONLY valid JSON:
{"player":"","stat":"","line":null,"direction":"OVER|UNDER|NONE","opponent":null}
Rules:
- player: the athlete's name exactly as written.
- stat: exactly one of these keys: ${VALID_STAT_KEYS}. If unclear, use "points".
- line: the numeric threshold, or null.
- direction: OVER or UNDER from the text, else NONE.
- opponent: the team after "vs" or "against", else null. For fight queries ("Ryan Garcia vs Tank Davis"), opponent is the other fighter.`;

const REPORT_SYS = `You are the "Akademy Almanac" — a sports scout STRICTLY bound to a VERIFIED FACTS block.

ABSOLUTE RULES:
1. Every number in your output MUST appear in the facts block. ZERO invented statistics.
2. If a needed fact is missing or unverified, say so. Never substitute an estimate.
3. If verified facts don't clearly support one side, verdict MUST be "PASS".
4. confidence: "LOW" unless verified avg AND recent games clearly sit on one side — then max "MODERATE". Never "HIGH".
5. Output ONLY JSON:
{"insights":[{"label":"MATCHUP CONTEXT","text":"..."},{"label":"RECENT FORM","text":"..."},{"label":"VERIFIED DATA READ","text":"..."}],"verdict":"OVER|UNDER|PASS","verdict_reason":"...","confidence":"LOW|MODERATE"}
Each text is 2-3 sentences.`;

/* ============ ROUTE ============ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prop: string = String(body?.prop || '').trim();
    if (prop.length < 4) return NextResponse.json({ error: 'A valid prop bet is required.' }, { status: 400 });

    const dbg: string[] = [];

    /* 1 — EXTRACT */
    let ex: any = null;
    const llmEx = await callLLM(EXTRACT_SYS, prop, 0, 300);
    if (llmEx) ex = extractJson(llmEx.content);
    if (!ex || !ex.player) {
      const m = prop.match(/(.+?)\s+(?:over|under|o\b|u\b)[\s.:—-]*([\d.]+)/i);
      const opp = prop.match(/\bvs\.?\s+(.+)$/i);
      ex = {
        player: m ? m[1].trim() : prop.split(/\s+(?:over|under|vs)/i)[0].trim(),
        stat: 'points',
        line: m ? Number(m[2]) : null,
        direction: /under/i.test(prop) ? 'UNDER' : (/over/i.test(prop) ? 'OVER' : 'NONE'),
        opponent: opp ? opp[1].trim() : null,
      };
    }
    const line = Number.isFinite(Number(ex.line)) ? Number(ex.line) : null;
    const direction = /UNDER/i.test(String(ex.direction)) ? 'UNDER' : (/OVER/i.test(String(ex.direction)) ? 'OVER' : 'NONE');
    const playerName = String(ex.player || '').trim();

    /* 2 — ROUTE DECISION */
    const mlbSignal = isMLBQuery(prop);
    let mlbTeamMatch: any = null;
    if (ex.opponent) mlbTeamMatch = await mlbMatchTeam(String(ex.opponent));
    const isMLB = mlbSignal || !!mlbTeamMatch;

    if (isMLB) {
      dbg.push('route:MLB');

      let mlbPlayer: any = null;
      mlbPlayer = await mlbSearchPlayer(playerName);
      if (mlbPlayer) dbg.push('mlb:L1-exact');
      if (!mlbPlayer) {
        mlbPlayer = await mlbRosterLookup(playerName);
        if (mlbPlayer) dbg.push('mlb:L2-roster-deaccent');
      }

      if (mlbPlayer) {
        let statKey = statDefFor(String(ex.stat || '')) ? String(ex.stat) : statFromQueryText(prop, 'mlb');
        const def = statDefFor(statKey) || KIND_STATS.mlb[0];

        const log = await mlbGetGamelog(mlbPlayer.id, mlbPlayer.isPitcher, statKey);
        if (log) {
          const schedule = mlbPlayer.teamId ? await mlbGetTeamSchedule(mlbPlayer.teamId) : null;
          const upcoming = espnUpcoming(schedule || []);
          const nextGame = upcoming[0] || null;
          let isNextMatchup = false;
          if (nextGame && ex.opponent) {
            const oppNorm = deaccent(String(ex.opponent));
            const gOppNorm = deaccent(nextGame.opponent);
            isNextMatchup = gOppNorm.includes(oppNorm) || oppNorm.includes(gOppNorm);
          }

          let hit_note: string | null = null;
          if (line !== null && direction === 'OVER') {
            hit_note = `${log.last5.filter(v => v > line).length} of last ${log.last5.length} games OVER ${line}`;
          } else if (line !== null && direction === 'UNDER') {
            hit_note = `${log.last5.filter(v => v < line).length} of last ${log.last5.length} games UNDER ${line}`;
          }

          const facts = {
            player: mlbPlayer.name,
            pos: mlbPlayer.position,
            team: mlbPlayer.teamName,
            league: 'MLB',
            stat: statKey,
            stat_label: def.label,
            stat_note: null,
            line, direction,
            opponent: ex.opponent ? cap(String(ex.opponent)) : null,
            opponent_valid: !!(ex.opponent && (mlbTeamMatch || isNextMatchup)),
            next_game: nextGame ? {
              opponent: nextGame.opponent,
              date: fmtDate(nextGame.date),
              is_queried_next: !!isNextMatchup,
              games_until: null,
            } : null,
            season_avg: `${log.avg} ${def.label}`,
            games_sampled: log.count,
            last_games: log.last5,
            hit_note,
            schedule_note: nextGame
              ? `VERIFIED: next game is vs ${nextGame.opponent} on ${fmtDate(nextGame.date)}.` +
                (nextGame.opponentProbable ? ` Opposing probable: ${nextGame.opponentProbable}.` : '') +
                (isNextMatchup ? ' This IS the queried matchup.' : '')
              : null,
            stats_verified: true,
            stats_source: 'Official MLB Stats API',
          };

          const factsBlock = `VERIFIED FACTS:
- Player: ${facts.player} (${facts.pos}, ${facts.team}), MLB
- Stat: ${def.label}
- Line: ${line !== null ? `${direction} ${line} ${def.label}` : 'NO LINE — verdict must be PASS'}
- Queried opponent: ${facts.opponent || 'none specified'}
- Schedule: ${facts.schedule_note || 'no upcoming games found in the window'}
- Season average: ${log.avg} ${def.label} over ${log.count} games (verified, official MLB Stats API)
- Last 5 games: ${log.last5.join(', ')} (verified)
- Line vs recent: ${hit_note || 'not computable'}
- Missing facts are missing. Do not fill them.`;

          const llm = await callLLM(REPORT_SYS, `${factsBlock}\n\nGenerate the scout report for: "${prop}"`, 0.4, 1000);
          if (llm) {
            const parsed = extractJson(llm.content);
            if (parsed?.insights?.length) {
              console.log(`[sports-ai] ${facts.player} · MLB · ${dbg.join(' · ')}`);
              return NextResponse.json({
                status: 'ok',
                facts,
                insights: parsed.insights.map((s: any) => ({ label: String(s.label || '').toUpperCase(), text: String(s.text || '') })).filter((s: any) => s.text),
                verdict: String(parsed.verdict || 'PASS').toUpperCase(),
                verdict_reason: String(parsed.verdict_reason || ''),
                confidence: String(parsed.confidence || 'LOW').toUpperCase(),
                model: llm.model,
                provider: llm.provider,
              });
            }
          }
        } else {
          dbg.push('mlb:no-gamelog');
        }
      } else {
        dbg.push('mlb:unresolved');
      }
      // fall through to ESPN — even for baseball-signaled queries
    }

    /* 3 — RESOLUTION: search (fast) → league index (deterministic) → opponent roster → combat */

    let player: any = null, entry: any = null;

    // 3a — NBA: Balldontlie resolution boost
    if (!player) {
      const bdlPlayer = await bdlSearchPlayer(playerName);
      if (bdlPlayer) {
        const hits = await espnSearchPlayer(playerName);
        const nbaHit = hits.find(h => h.entry?.key === 'nba');
        if (nbaHit) {
          player = { id: String(nbaHit.athleteId), name: bdlPlayer.name, pos: '', team: bdlPlayer.teamAbbr, teamId: bdlPlayer.teamId || nbaHit.athleteId };
          entry = REGISTRY.find(e => e.key === 'nba');
          dbg.push('bdl:resolved');
        }
      }
    }

    // 3b — ESPN search (fast path — 1 call; works when it works)
    if (!player) {
      const searchHits = await espnSearchPlayer(playerName);
      dbg.push(`search:${searchHits.length}`);

      for (const h of searchHits) {
        if (h.entry && h.athleteId) {
          try {
            const aData = await httpGet(`${ESPN}/${h.entry.sport}/${h.entry.league}/athletes/${h.athleteId}`);
            const a = aData?.athlete || aData;
            if (a?.id) {
              let teamId: string | null = null;
              let teamName = '';
              if (a?.team?.id) {
                teamId = String(a.team.id);
                teamName = String(a.team.abbreviation || a.team.displayName || '');
              } else if (a?.team?.$ref) {
                const refMatch = String(a.team.$ref).match(/\/teams\/(\d+)/);
                if (refMatch) teamId = refMatch[1];
              }
              if (teamId) {
                player = { id: String(a.id), name: a.displayName || playerName, pos: a.position?.abbreviation || '', team: teamName, teamId };
                entry = h.entry;
                break;
              }
            }
          } catch { /* try next */ }
        }
      }
      if (player) dbg.push('espn:search-direct');
    }

    // 3c — THE DETERMINISTIC BACKSTOP: stat-ordered league roster index.
    // Search returned 0 for Mahomes? The Chiefs roster still has him.
    if (!player) {
      const provisionalStat = statFromQueryText(prop, null);
      const kinds = new Set(
        Object.entries(KIND_STATS)
          .filter(([, arr]) => (arr as StatDef[]).some(s => s.key === provisionalStat))
          .map(([k]) => k)
      );
      const scoreOf = (e: any) => (kinds.has(e.kind) ? 0 : 10) + (e.kind === 'basketball' ? -1 : 0);
      const ordered = [...REGISTRY.filter(e => !e.useMLB)].sort((a, b) => scoreOf(a) - scoreOf(b));
      const found = await espnIndexLookup(playerName, ordered.slice(0, 3));
      if (found) {
        player = { id: found.id, name: found.name, pos: found.pos, team: found.team, teamId: found.teamId };
        entry = found.entry;
        dbg.push(`espn:idx-${found.league}`);
      }
    }

    // 3d — Opponent-league roster quick check
    if (!player && ex.opponent) {
      for (const e of REGISTRY) {
        if (e.useMLB) continue;
        const teams = await espnGetTeams(e);
        const team = espnMatchTeam(teams, String(ex.opponent));
        if (team) {
          const roster = await httpGet(`${ESPN}/${e.sport}/${e.league}/teams/${team.id}/roster`);
          const athletes = roster?.team?.athletes || roster?.athletes || [];
          const q = deaccent(playerName);
          const hit = athletes.find(a => {
            const n = deaccent(a?.displayName || a?.fullName || '');
            return n && (n === q || n.includes(q) || q.includes(n));
          });
          if (hit) {
            player = { id: String(hit.id), name: String(hit.displayName || hit.fullName), pos: String(hit.position?.abbreviation || ''), team: team.abbr.toUpperCase(), teamId: team.id };
            entry = e;
            break;
          }
        }
      }
      if (player) dbg.push('espn:opp-roster');
    }

    // 3e — COMBAT: UFC + boxing cards
    if (!player) {
      const fight = await matchFight(playerName, ex.opponent || null);
      if (fight) {
        return NextResponse.json({
          status: 'fight_found',
          message: fight.mismatch
            ? `${fight.fighter} is scheduled to face ${fight.opponent} at ${fight.event} on ${fmtDate(fight.date)} — not the queried opponent.`
            : `VERIFIED: ${fight.fighter} vs ${fight.opponent} at ${fight.event} on ${fmtDate(fight.date)}. Fight matchups verify the bout only — no stat lines graded for combat sports. Nothing was invented.`,
          facts: { fighter: fight.fighter, next_fight: { opponent: fight.opponent, date: fmtDate(fight.date), event: fight.event, league: fight.league } },
        });
      }
      return NextResponse.json({
        status: 'player_not_found',
        query: playerName,
        message: `"${playerName}" was not found. ${dbg.length ? `[${dbg.join(' · ')}]` : ''} The Almanac refuses to invent data.`,
      });
    }

    /* 4 — Stat + schedule */
    let statKey = statDefFor(String(ex.stat || '')) ? String(ex.stat) : statFromQueryText(prop, entry?.kind || null);
    const def = statDefFor(statKey) || ALL_STATS[0];

    const log = await espnGetPlayerStats(entry, player.teamId, player.id, statKey, playerName);
    dbg.push(`stats:${log ? `${log.count}G via ${log.source}` : 'none'}`);

    const schedule = await espnGetSchedule(entry, player.teamId);
    const upcoming = espnUpcoming(schedule || []);
    const nextGame = upcoming[0] || null;
    dbg.push(`sched:${schedule?.length || 0}G · upcoming:${upcoming.length}${nextGame ? ` · next:${nextGame.opponentName}` : ''}`);

    let opponent: string | null = null;
    let oppTeamObj: any = null;
    if (ex.opponent) {
      const teams = await espnGetTeams(entry);
      const oppTeam = espnMatchTeam(teams, String(ex.opponent));
      if (oppTeam) {
        oppTeamObj = oppTeam;
        opponent = oppTeam.norm;
        const hasMatchup = upcoming.some(g => {
          if (g.opponentId && oppTeam.id) return String(g.opponentId) === String(oppTeam.id);
          const gOpp = deaccent(g.opponentName || '');
          return gOpp.includes(oppTeam.norm) || oppTeam.norm.includes(gOpp);
        });
        if (!hasMatchup) {
          return NextResponse.json({
            status: 'opponent_not_scheduled',
            facts: {
              player: cap(player.name), team: player.team, league: entry.label,
              season_avg: log ? `${log.avg} ${def.label}` : null,
              next_game: nextGame ? { opponent: nextGame.opponentName, date: fmtDate(nextGame.date) } : null,
            },
            message: `${cap(oppTeam.norm)} is a real team, but ${player.team || 'the player\'s team'} has no remaining game against them. No upcoming matchup exists.`,
          });
        }
      } else {
        return NextResponse.json({
          status: 'unknown_team',
          opponent: ex.opponent,
          message: `"${ex.opponent}" is not a team in the ${entry.label}. The Almanac refuses to invent a matchup.`,
        });
      }
    }

    let hit_note: string | null = null;
    if (log && line !== null && direction === 'OVER') {
      hit_note = `${log.last5.filter(v => v > line).length} of last ${log.last5.length} games OVER ${line}`;
    } else if (log && line !== null && direction === 'UNDER') {
      hit_note = `${log.last5.filter(v => v < line).length} of last ${log.last5.length} games UNDER ${line}`;
    }

    const facts = {
      player: cap(player.name),
      pos: player.pos || null,
      team: player.team || 'TBD',
      league: entry?.label || '—',
      stat: statKey,
      stat_label: def.label,
      stat_note: null,
      line, direction,
      opponent: opponent ? cap(opponent) : null,
      opponent_valid: !!opponent,
      next_game: nextGame ? {
        opponent: nextGame.opponentName,
        date: fmtDate(nextGame.date),
        is_queried_next: !!(nextGame && (
          (nextGame.opponentId && oppTeamObj?.id && String(nextGame.opponentId) === String(oppTeamObj.id)) ||
          (opponent && deaccent(nextGame.opponentName || '').includes(opponent))
        )),
        games_until: null,
      } : null,
      season_avg: log ? `${log.avg} ${def.label}` : null,
      games_sampled: log ? log.count : null,
      last_games: log ? log.last5 : null,
      hit_note,
      schedule_note: nextGame ? `VERIFIED: next game is vs ${nextGame.opponentName} on ${fmtDate(nextGame.date)}.` : null,
      stats_verified: !!log,
      stats_source: log ? log.source : null,
    };

    const factsBlock = `VERIFIED FACTS:
- Player: ${facts.player}${facts.pos ? ` (${facts.pos}, ${facts.team})` : ` (${facts.team})`}, ${facts.league}
- Stat: ${def.label}
- Line: ${line !== null ? `${direction} ${line} ${def.label}` : 'NO LINE — verdict must be PASS'}
- Queried opponent: ${opponent ? `${facts.opponent} — REAL TEAM` : 'none specified'}
- Schedule: ${facts.schedule_note || 'no upcoming games found'}
- Season average: ${log ? `${log.avg} ${def.label} over ${log.count} games (verified via ${log.source})` : 'UNVERIFIED — stat data unavailable. Do NOT state any numbers.'}
- Last 5 games: ${log ? log.last5.join(', ') + ' (verified)' : 'UNVERIFIED — stat data unavailable'}
- Line vs recent: ${hit_note || 'not computable'}
- Missing facts are missing. Do not fill them.`;

    const llm = await callLLM(REPORT_SYS, `${factsBlock}\n\nGenerate the scout report for: "${prop}"`, 0.4, 1000);
    if (!llm) {
      return NextResponse.json({ error: 'No AI provider responded. Check CEREBRAS_API_KEY / GROQ_API_KEY.' }, { status: 502 });
    }
    const parsed = extractJson(llm.content);
    if (!parsed?.insights?.length) {
      return NextResponse.json({ error: 'Model returned an unusable report.' }, { status: 502 });
    }

    console.log(`[sports-ai] ${facts.player} · ${entry?.label || 'MLB'} · ${dbg.join(' · ')}`);
    return NextResponse.json({
      status: 'ok',
      facts,
      insights: parsed.insights.map((s: any) => ({ label: String(s.label || '').toUpperCase(), text: String(s.text || '') })).filter((s: any) => s.text),
      verdict: String(parsed.verdict || 'PASS').toUpperCase(),
      verdict_reason: String(parsed.verdict_reason || ''),
      confidence: String(parsed.confidence || 'LOW').toUpperCase(),
      model: llm.model,
      provider: llm.provider,
    });

  } catch (error: any) {
    console.error('[sports-ai] Route error:', error);
    return NextResponse.json({ error: 'Failed to generate scout report.' }, { status: 500 });
  }
}