"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

interface PublishedArticle { 
  title: string; source: string; thumbnail_url: string; 
  created_at: string; tags: string[]; contentSnippet?: string; 
}

export default function SportsPage() {
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  // AI Almanac State
  const [propInput, setPropInput] = useState("LeBron Over 22.5 Pts vs Celtics");
  const [verdict, setVerdict] = useState("OVER");
  const [confidence, setConfidence] = useState("82%");

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
      });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fade-up, .line-mask').forEach(el => io.observe(el));

    // Chart Bar stagger trigger for Heat Index
    const chartObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const rows = entry.target.querySelectorAll('.heat-row');
          rows.forEach((row, index) => { setTimeout(() => { row.classList.add('is-in'); }, index * 150); });
          chartObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    const heatList = document.querySelector('.heat-list');
    if (heatList) chartObserver.observe(heatList);

    return () => { io.disconnect(); if (heatList) chartObserver.unobserve(heatList); };
  }, []);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propInput.trim()) return;
    // Mock AI analysis
    const confidences = ['82%', '76%', '91%', '68%', '88%'];
    const verdicts = ['OVER', 'UNDER', 'OVER', 'THE UNDER', 'OVER'];
    const random = Math.floor(Math.random() * 5);
    setVerdict(verdicts[random]);
    setConfidence(confidences[random]);
  };

  const heatIndexPlayers = [
    { rank: "01", player: "Cooper Flagg", pos: "PF · Duke", prob: "96%", width: "96%", isTop: true },
    { rank: "02", player: "Ace Bailey", pos: "SF · Rutgers", prob: "82%", width: "82%", isTop: false },
    { rank: "03", player: "VJ Edgecombe", pos: "SG · Baylor", prob: "74%", width: "74%", isTop: false },
    { rank: "04", player: "Dylan Harper", pos: "PG · Rutgers", prob: "61%", width: "61%", isTop: false },
    { rank: "05", player: "Khaman Maluach", pos: "C · Duke", prob: "45%", width: "45%", isTop: false },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Sports" />
      
      <style dangerouslySetInnerHTML={{__html: `
        :root { --bg: #0a0a0a; --bg-elev: #131313; --text: #ffffff; --text-soft: #a8a8a8; --text-mute: #6e6e6e; --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25); --line: rgba(255,255,255,0.10); --line-soft: rgba(255,255,255,0.06); --red: #d24239; --green: #6bbf6b; --ease-quiet: cubic-bezier(.22, 1, .36, 1); --ease-emphasis: cubic-bezier(.16, 1, .3, 1); }
        .shell { max-width: 1400px; margin: 0 auto; padding: 64px 32px 80px; }
        .page-head { margin-bottom: 64px; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--line); padding-bottom: 32px; }
        .page-head__left { flex: 1; }
        .page-head__num { font-family: monospace; font-size: 12px; letter-spacing: 0.2em; color: var(--accent); margin-bottom: 12px; display: block; }
        .page-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: clamp(48px, 8vw, 96px); line-height: 0.9; letter-spacing: -0.03em; }
        .page-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .page-head__right { text-align: right; font-family: 'Times New Roman', serif; font-style: italic; font-size: 16px; color: var(--text-soft); max-width: 400px; }
        .widgets-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 48px; margin-bottom: 80px; }
        @media (max-width: 1100px) { .widgets-grid { grid-template-columns: 1fr; } }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 32px; border-bottom: 1px solid var(--accent); padding-bottom: 12px; }
        .section-head__left { display: flex; align-items: baseline; gap: 16px; }
        .section-head__num { font-family: monospace; font-size: 11px; letter-spacing: 0.2em; color: var(--accent); }
        .section-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 28px; letter-spacing: -0.01em; }
        .section-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .almanac-card { background: var(--bg-elev); border: 1px solid var(--line); padding: 32px; }
        .almanac-input-group { display: flex; align-items: center; gap: 16px; background: var(--bg); border: 1px solid var(--line); padding: 12px 16px; margin-bottom: 32px; transition: border-color .3s; }
        .almanac-input-group:focus-within { border-color: var(--accent); }
        .almanac-input { flex: 1; background: transparent; border: none; color: var(--text); font-family: monospace; font-size: 14px; outline: none; width: 100%; }
        .almanac-input::placeholder { color: var(--text-mute); }
        .almanac-btn { background: var(--accent); color: #fff; padding: 8px 16px; font-weight: 700; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; transition: background .3s; cursor: pointer; border: none; }
        .almanac-btn:hover { background: #b91c1c; }
        .scout-report { border-top: 1px solid var(--line); padding-top: 24px; }
        .report-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .report-tag { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: var(--accent); text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
        .report-tag::before { content: '✦'; font-size: 12px; }
        .report-confidence { font-family: 'Times New Roman', serif; font-size: 14px; font-style: italic; color: var(--text-soft); }
        .report-confidence strong { color: var(--accent); font-weight: 700; font-size: 18px; font-style: normal; }
        .insight-list { list-style: none; padding: 0; margin-bottom: 24px; }
        .insight-item { padding: 16px 0; border-bottom: 1px solid var(--line-soft); display: flex; gap: 16px; align-items: flex-start; }
        .insight-item:last-child { border-bottom: none; }
        .insight-icon { width: 24px; height: 24px; border: 1px solid var(--accent-soft); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
        .insight-text { font-family: 'Times New Roman', serif; font-size: 16px; line-height: 1.4; color: var(--text); }
        .insight-text strong { color: var(--accent); font-weight: 600; }
        .report-verdict { background: var(--bg); border-left: 3px solid var(--accent); padding: 16px; display: flex; justify-content: space-between; align-items: center; }
        .verdict-label { font-family: monospace; font-size: 11px; letter-spacing: 0.16em; color: var(--text-mute); text-transform: uppercase; }
        .verdict-value { font-family: 'Times New Roman', serif; font-size: 20px; font-weight: 700; color: var(--text); }
        .verdict-value em { color: var(--green); font-style: normal; }
        .locks-card { background: var(--bg-elev); border-left: 3px solid var(--accent); padding: 32px; height: 100%; }
        .locks-list { list-style: none; padding: 0; margin: 0; }
        .lock-row { display: grid; grid-template-columns: 40px 1fr auto auto; gap: 16px; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--line-soft); }
        .lock-row:last-child { border-bottom: none; }
        .lock-rank { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 24px; color: var(--text-mute); text-align: center; }
        .lock-row.is-top .lock-rank { color: var(--accent); }
        .lock-user { display: flex; flex-direction: column; gap: 4px; }
        .lock-name { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; }
        .gold-badge { font-family: monospace; font-size: 8px; background: var(--accent); color: #fff; padding: 2px 6px; letter-spacing: 0.1em; font-weight: 700; }
        .lock-streak { font-family: monospace; font-size: 10px; color: var(--text-mute); letter-spacing: 0.1em; }
        .lock-record { font-family: monospace; font-size: 14px; color: var(--text); font-weight: 500; text-align: right; }
        .lock-percent { font-family: 'Times New Roman', serif; font-size: 18px; color: var(--accent); font-weight: 700; width: 50px; text-align: right; }
        .heat-index-section { margin-bottom: 80px; }
        .heat-list { display: flex; flex-direction: column; gap: 16px; }
        .heat-row { display: grid; grid-template-columns: 240px 1fr 80px; align-items: center; gap: 24px; padding: 16px 0; border-bottom: 1px solid var(--line-soft); }
        .heat-row:last-child { border-bottom: none; }
        .heat-meta { display: flex; align-items: center; gap: 16px; }
        .heat-rank { font-family: 'Times New Roman', serif; font-size: 24px; font-weight: 700; color: var(--text-mute); width: 32px; }
        .heat-name { display: flex; flex-direction: column; gap: 4px; }
        .heat-player { font-family: 'Times New Roman', serif; font-size: 18px; font-weight: 700; }
        .heat-pos { font-family: monospace; font-size: 10px; color: var(--text-mute); letter-spacing: 0.12em; text-transform: uppercase; }
        .heat-bar-container { height: 6px; background: var(--bg-elev); position: relative; overflow: hidden; }
        .heat-bar { height: 100%; background: var(--text-mute); transform-origin: left; transform: scaleX(0); transition: transform 1.2s var(--ease-emphasis); }
        .heat-row.is-top .heat-bar { background: var(--accent); }
        .heat-row.is-in .heat-bar { transform: scaleX(1); }
        .heat-prob { font-family: monospace; font-size: 14px; font-weight: 500; color: var(--text); text-align: right; }
        .heat-row.is-top .heat-prob { color: var(--accent); }
        .story-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px 32px; }
        @media (max-width: 900px) { .story-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .story-grid { grid-template-columns: 1fr; } }
        .story { display: flex; flex-direction: column; gap: 14px; text-decoration: none; color: inherit; }
        .story__image { width: 100%; aspect-ratio: 4 / 3; overflow: hidden; background: #1a1a1a; display: block; }
        .story__image img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.9) contrast(1.05); transition: transform 1.1s var(--ease-quiet); }
        .story:hover .story__image img { transform: scale(1.03); }
        .story__kicker { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-top: 4px; }
        .story__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 22px; line-height: 1.2; }
        .story:hover .story__title { color: var(--accent); }
        .story__title em { font-style: italic; font-weight: 400; }
        .story__dek { font-family: 'Times New Roman', serif; font-size: 15px; line-height: 1.4; color: var(--text-soft); }
        .story__meta { font-family: monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-mute); }
        .story__meta strong { color: var(--text-soft); font-weight: 500; }
        .fade-up { opacity: 0; transform: translateY(24px); transition: opacity .9s var(--ease-quiet), transform .9s var(--ease-quiet); }
        .fade-up.is-in { opacity: 1; transform: none; }
        .line-mask { overflow: hidden; display: inline-block; }
        .line-mask__inner { display: block; transform: translateY(110%); transition: transform 1.1s var(--ease-quiet); }
        .line-mask.is-in .line-mask__inner { transform: translateY(0); }
      `}} />

      <div className="shell">
        <header className="page-head fade-up">
          <div className="page-head__left">
            <span className="page-head__num">09 / The Parlay</span>
            <h1 className="page-head__title line-mask"><span className="line-mask__inner"><em>The</em> Sports Desk</span></h1>
          </div>
          <div className="page-head__right">
            The picks, the probabilities, and the culture of the game. A data-driven terminal for the modern sports fanatic.
          </div>
        </header>

        <div className="widgets-grid">
          {/* Akademy Almanac */}
          <section className="fade-up">
            <div className="section-head">
              <div className="section-head__left">
                <span className="section-head__num">No. 01</span>
                <h2 className="section-head__title">Akademy <em>Almanac</em></h2>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--red)', letterSpacing: '0.14em', textTransform: 'uppercase', border: '1px solid var(--red)', padding: '4px 8px' }}>Premium</span>
            </div>

            <div className="almanac-card">
              <form className="almanac-input-group" onSubmit={handleAnalyze}>
                <input type="text" className="almanac-input" placeholder="Enter prop: e.g. LeBron Over 22.5 Pts vs Celtics" value={propInput} onChange={(e) => setPropInput(e.target.value)} />
                <button type="submit" className="almanac-btn">Analyze</button>
              </form>

              <div className="scout-report">
                <div className="report-head">
                  <div className="report-tag">AI Scout Report</div>
                  <div className="report-confidence">Confidence: <strong>{confidence}</strong></div>
                </div>
                
                <ul className="insight-list">
                  <li className="insight-item">
                    <div className="insight-icon">↑</div>
                    <div className="insight-text"><strong>Historical Trend:</strong> LeBron has scored 25+ points in 4 of his last 5 games against Boston.</div>
                  </li>
                  <li className="insight-item">
                    <div className="insight-icon">⚠</div>
                    <div className="insight-text"><strong>Defensive Matchup:</strong> Celtics rank 3rd in points allowed to Small Forwards this season.</div>
                  </li>
                  <li className="insight-item">
                    <div className="insight-icon">⚡</div>
                    <div className="insight-text"><strong>Pace Data:</strong> Expected game pace is 102.4 possessions, well above league average.</div>
                  </li>
                  <li className="insight-item">
                    <div className="insight-icon">∞</div>
                    <div className="insight-text"><strong>Injury Impact:</strong> Anthony Davis listed as Questionable. If out, usage rate jumps +6.2%.</div>
                  </li>
                </ul>

                <div className="report-verdict">
                  <span className="verdict-label">AI Verdict</span>
                  <span className="verdict-value">Lean: <em>{verdict}</em></span>
                </div>
              </div>
            </div>
          </section>

          {/* Locks Leaderboard */}
          <aside className="fade-up">
            <div className="section-head">
              <div className="section-head__left">
                <span className="section-head__num">No. 02</span>
                <h2 className="section-head__title">The <em>Locks</em> Leaderboard</h2>
              </div>
            </div>

            <div className="locks-card">
              <ul className="locks-list">
                <li className="lock-row is-top">
                  <div className="lock-rank">01</div>
                  <div className="lock-user">
                    <div className="lock-name">SharpMoney_99 <span className="gold-badge">GOLD</span></div>
                    <div className="lock-streak">🔥 12-Game Win Streak</div>
                  </div>
                  <div className="lock-record">42 - 8</div>
                  <div className="lock-percent">84%</div>
                </li>
                <li className="lock-row">
                  <div className="lock-rank">02</div>
                  <div className="lock-user">
                    <div className="lock-name">BookieSlayer</div>
                    <div className="lock-streak">🔥 5-Game Win Streak</div>
                  </div>
                  <div className="lock-record">38 - 12</div>
                  <div className="lock-percent">76%</div>
                </li>
                <li className="lock-row">
                  <div className="lock-rank">03</div>
                  <div className="lock-user">
                    <div className="lock-name">UnderdogDegenerate</div>
                    <div className="lock-streak">3-Game Loss Streak</div>
                  </div>
                  <div className="lock-record">35 - 15</div>
                  <div className="lock-percent">70%</div>
                </li>
                <li className="lock-row">
                  <div className="lock-rank">04</div>
                  <div className="lock-user">
                    <div className="lock-name">PlayerPropsOnly</div>
                    <div className="lock-streak">2-Game Win Streak</div>
                  </div>
                  <div className="lock-record">31 - 19</div>
                  <div className="lock-percent">62%</div>
                </li>
                <li className="lock-row">
                  <div className="lock-rank">05</div>
                  <div className="lock-user">
                    <div className="lock-name">TheFadeKing</div>
                    <div className="lock-streak">1-Game Loss Streak</div>
                  </div>
                  <div className="lock-record">28 - 22</div>
                  <div className="lock-percent">56%</div>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        {/* DRAFT HEAT INDEX */}
        <section className="heat-index-section fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">No. 03</span>
              <h2 className="section-head__title">Draft <em>Heat</em> Index</h2>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--text-mute)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>2025 NBA Mock Consensus</span>
          </div>

          <div className="heat-list">
            {heatIndexPlayers.map((p, idx) => (
              <div className={`heat-row ${p.isTop ? 'is-top' : ''}`} key={idx}>
                <div className="heat-meta">
                  <div className="heat-rank">{p.rank}</div>
                  <div className="heat-name">
                    <div className="heat-player">{p.player}</div>
                    <div className="heat-pos">{p.pos}</div>
                  </div>
                </div>
                <div className="heat-bar-container"><div className="heat-bar" style={{ width: p.width }}></div></div>
                <div className="heat-prob">{p.prob}</div>
              </div>
            ))}
          </div>
        </section>

        {/* SPORTS ARTICLES */}
        <section className="fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">No. 04</span>
              <h2 className="section-head__title">Sports <em>Coverage</em></h2>
            </div>
          </div>

          {loading ? (
            <div className="text-zinc-500 animate-pulse">Loading articles...</div>
          ) : articles.length === 0 ? (
            <div className="text-zinc-600 italic text-center py-20">No sports articles published yet.</div>
          ) : (
            <div className="story-grid">
              {articles.map((article, idx) => (
                <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} key={idx} className="story">
                  <div className="story__image">
                    <img src={article.thumbnail_url || `https://picsum.photos/seed/sports-news-${idx}/600/450`} alt="" />
                  </div>
                  <div className="story__kicker">Sports</div>
                  <h3 className="story__title">{article.title}</h3>
                  <p className="story__dek">{article.contentSnippet || "Read the full breakdown."}</p>
                  <div className="story__meta">By <strong>DJ Akademiks</strong> · {isMounted ? new Date(article.created_at).toLocaleDateString() : ''}</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}