"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

interface PublishedArticle { title: string; source: string; thumbnail_url: string; created_at: string; tags: string[]; contentSnippet?: string; } // FIXED: Added contentSnippet

export default function IndustryPage() {
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [streams, setStreams] = useState(1000000);
  const [payout, setPayout] = useState(3800);

  useEffect(() => {
    setIsMounted(true);
    fetch('/api/published-articles')
      .then(res => res.json())
      .then(data => {
        const filtered = (data.articles || []).filter((a: PublishedArticle) => (a.tags || []).map(t => t.toLowerCase()).includes('industry'));
        setArticles(filtered);
        setLoading(false);
      });
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fade-up, .line-mask').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const handleCalc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setStreams(val);
    setPayout(val * 0.0038);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Industry" />
      <style dangerouslySetInnerHTML={{__html: `
        :root { --bg: #0a0a0a; --bg-elev: #131313; --text: #ffffff; --text-soft: #a8a8a8; --text-mute: #6e6e6e; --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25); --line: rgba(255,255,255,0.10); --line-soft: rgba(255,255,255,0.06); --red: #d24239; --green: #6bbf6b; --ease-quiet: cubic-bezier(.22, 1, .36, 1); }
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
        .section-head__left { display: flex; align-items: center; gap: 16px; }
        .section-head__num { font-family: monospace; font-size: 11px; letter-spacing: 0.2em; color: var(--accent); }
        .section-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 28px; letter-spacing: -0.01em; display: flex; align-items: center; }
        .section-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        
        .help-icon-wrapper { position: relative; display: inline-flex; align-items: center; margin-left: 8px; }
        .help-icon { width: 14px; height: 14px; border: 1px solid var(--text-mute); border-radius: 50%; font-size: 9px; color: var(--text-mute); display: flex; align-items: center; justify-content: center; cursor: help; transition: all 0.3s ease; font-weight: bold; }
        .help-icon:hover { border-color: var(--accent); color: var(--accent); }
        .help-tooltip { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: rgba(40, 40, 40, 0.95); backdrop-filter: blur(10px); border: 1px solid var(--line); padding: 10px 14px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 400; color: var(--text-soft); width: 240px; opacity: 0; pointer-events: none; transition: opacity 0.3s ease; z-index: 100; line-height: 1.4; text-transform: none; letter-spacing: 0; }
        .help-icon-wrapper:hover .help-tooltip { opacity: 1; }

        .contract-card { background: var(--bg-elev); border: 1px solid var(--line-soft); padding: 32px; }
        .contract-head { margin-bottom: 32px; }
        .contract-kicker { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; margin-bottom: 12px; display: block; }
        .contract-title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 32px; line-height: 1.1; letter-spacing: -0.01em; }
        .contract-title em { font-style: italic; color: var(--accent); }
        .contract-summary { font-family: 'Times New Roman', serif; font-style: italic; color: var(--text-soft); font-size: 16px; margin-top: 8px; }
        .ledger { margin-bottom: 32px; }
        .ledger-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--line-soft); }
        .ledger-row:last-child { border-bottom: none; }
        .ledger-label { font-family: monospace; font-size: 11px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; }
        .ledger-value { font-family: 'Times New Roman', serif; font-size: 20px; font-weight: 500; color: var(--text); }
        .ledger-value.is-accent { color: var(--accent); font-weight: 700; }
        .calc-card { background: var(--bg-elev); border-left: 3px solid var(--accent); padding: 32px; height: 100%; display: flex; flex-direction: column; }
        .calc-kicker { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; margin-bottom: 16px; display: block; }
        .calc-title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 24px; line-height: 1.1; margin-bottom: 24px; }
        .calc-input-group { display: flex; align-items: center; gap: 12px; background: var(--bg); border: 1px solid var(--line); padding: 12px 16px; margin-bottom: 24px; transition: border-color .3s; }
        .calc-input-group:focus-within { border-color: var(--accent); }
        .calc-input { flex: 1; background: transparent; border: none; color: var(--text); font-family: monospace; font-size: 16px; outline: none; width: 100%; }
        .calc-input::placeholder { color: var(--text-mute); }
        .calc-input-label { font-family: monospace; font-size: 10px; color: var(--text-mute); letter-spacing: 0.12em; text-transform: uppercase; }
        .calc-result { margin-top: auto; border-top: 1px solid var(--line); padding-top: 24px; }
        .calc-result-label { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; margin-bottom: 8px; }
        .calc-result-value { font-family: 'Times New Roman', serif; font-size: 48px; font-weight: 700; color: var(--accent); line-height: 1; }
        .calc-disclaimer { font-family: monospace; font-size: 9px; color: var(--text-mute); letter-spacing: 0.12em; text-transform: uppercase; margin-top: 12px; }
        .vs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-bottom: 80px; border: 1px solid var(--line); }
        @media (max-width: 700px) { .vs-grid { grid-template-columns: 1fr; } }
        .vs-col { padding: 32px; }
        .vs-col--indie { border-right: 1px solid var(--line); }
        @media (max-width: 700px) { .vs-col--indie { border-right: none; border-bottom: 1px solid var(--line); } }
        .vs-head { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .vs-avatar { width: 48px; height: 48px; background: var(--bg); border: 1px solid var(--line); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Times New Roman', serif; font-weight: 700; font-size: 18px; color: var(--text-soft); }
        .vs-name { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 20px; }
        .vs-tag { font-family: monospace; font-size: 9px; letter-spacing: 0.14em; color: var(--accent); text-transform: uppercase; display: block; margin-bottom: 4px; }
        .vs-list { list-style: none; padding: 0; }
        .vs-list li { padding: 12px 0; border-bottom: 1px solid var(--line-soft); font-size: 14px; display: flex; justify-content: space-between; gap: 16px; }
        .vs-list li:last-child { border-bottom: none; }
        .vs-list span { color: var(--text-mute); font-family: monospace; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; }
        .vs-list strong { font-weight: 500; color: var(--text); text-align: right; }
        .exec-list { list-style: none; padding: 0; margin-bottom: 80px; }
        .exec-row { display: grid; grid-template-columns: 120px 1fr auto; gap: 24px; align-items: center; padding: 20px 0; border-bottom: 1px solid var(--line-soft); }
        .exec-row:last-child { border-bottom: none; }
        .exec-label { font-family: monospace; font-size: 10px; letter-spacing: 0.16em; color: var(--text-mute); text-transform: uppercase; border: 1px solid var(--line); padding: 4px 12px; text-align: center; }
        .exec-label.is-hire { color: var(--green); border-color: var(--green); }
        .exec-label.is-fire { color: var(--red); border-color: var(--red); }
        .exec-info { display: flex; flex-direction: column; gap: 4px; }
        .exec-name { font-family: 'Times New Roman', serif; font-size: 18px; font-weight: 700; }
        .exec-role { font-family: 'Inter', sans-serif; font-size: 13px; color: var(--text-soft); }
        .exec-company { font-family: monospace; font-size: 11px; letter-spacing: 0.14em; color: var(--accent); text-transform: uppercase; }
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
            <span className="page-head__num">07 / The Business</span>
            <h1 className="page-head__title line-mask"><span className="line-mask__inner"><em>The</em> Boardroom</span></h1>
          </div>
          <div className="page-head__right">The deals, the dollars, and the departures. A financial wire service for the music industry.</div>
        </header>

        <div className="widgets-grid">
          <section className="fade-up">
            <div className="section-head"><div className="section-head__left"><span className="section-head__num">No. 01</span><h2 className="section-head__title">The <em>Bag:</em> Contract Breakdown <div className="help-icon-wrapper"><span className="help-icon">?</span><span className="help-tooltip">Breakdowns of reported deals, showing advances, royalty splits, and ownership clauses.</span></div></h2></div></div>
            <div className="contract-card">
              <div className="contract-head">
                <span className="contract-kicker">Deal Analysis · 2024</span>
                <h3 className="contract-title">Drake's <em>$400M</em> Universal Deal Explained</h3>
                <p className="contract-summary">A historic 10-year multi-rights agreement that redefines what a "360 deal" looks like at the highest echelon of the music industry.</p>
              </div>
              <div className="ledger">
                <div className="ledger-row"><div className="ledger-label">Advance (Upfront)</div><div className="ledger-value">$150,000,000</div></div>
                <div className="ledger-row"><div className="ledger-label">Royalty Split (Artist / Label)</div><div className="ledger-value">50 / 50</div></div>
                <div className="ledger-row"><div className="ledger-label">Masters Ownership</div><div className="ledger-value">Reverts 2026</div></div>
                <div className="ledger-row"><div className="ledger-label">Publishing Administration</div><div className="ledger-value">Universal (10yr Term)</div></div>
                <div className="ledger-row"><div className="ledger-label">Merch & Touring Gross</div><div className="ledger-value">20% to Label</div></div>
                <div className="ledger-row"><div className="ledger-label">Estimated Total Value</div><div className="ledger-value is-accent">$400,000,000+</div></div>
              </div>
            </div>
          </section>

          <aside className="fade-up">
            <div className="section-head"><div className="section-head__left"><span className="section-head__num">No. 02</span><h2 className="section-head__title">Royalty <em>Calculator</em> <div className="help-icon-wrapper"><span className="help-icon">?</span><span className="help-tooltip">Interactive tool where users type in a Spotify stream count to calculate estimated payouts.</span></div></h2></div></div>
            <div className="calc-card">
              <span className="calc-kicker">Interactive Tool · Spotify</span>
              <h3 className="calc-title">How much does a stream actually pay?</h3>
              <div className="calc-input-group">
                <input type="number" className="calc-input" placeholder="1,000,000" value={streams} onChange={handleCalc} />
                <span className="calc-input-label">Streams</span>
              </div>
              <div className="calc-result">
                <div className="calc-result-label">Estimated Payout</div>
                <div className="calc-result-value">${payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="calc-disclaimer">*Based on $0.0038 per stream average. Net of publisher/mechanical cuts.</div>
              </div>
            </div>
          </aside>
        </div>

        <section className="fade-up">
          <div className="section-head"><div className="section-head__left"><span className="section-head__num">No. 03</span><h2 className="section-head__title">Indie vs. <em>Major</em> Case Studies <div className="help-icon-wrapper"><span className="help-icon">?</span><span className="help-tooltip">Case studies on how independent artists built their own infrastructure vs. artists who signed 360 deals.</span></div></h2></div></div>
          <div className="vs-grid">
            <div className="vs-col vs-col--indie">
              <div className="vs-head"><div className="vs-avatar">R</div><div><span className="vs-tag">The Indie Blueprint</span><div className="vs-name">Russ</div></div></div>
              <ul className="vs-list"><li><span>Distribution Model</span><strong>Independent / Empire</strong></li><li><span>Initial Royalty Split</span><strong>100% to Artist</strong></li><li><span>Masters Ownership</span><strong>100% Retained</strong></li><li><span>Marketing Budget</span><strong>Organic / Social</strong></li></ul>
            </div>
            <div className="vs-col vs-col--major">
              <div className="vs-head"><div className="vs-avatar">A</div><div><span className="vs-tag" style={{ color: 'var(--red)' }}>The Major 360 Deal</span><div className="vs-name">Artist X (Average)</div></div></div>
              <ul className="vs-list"><li><span>Distribution Model</span><strong>Major Label (UMG/Sony/WMG)</strong></li><li><span>Initial Royalty Split</span><strong>~85/15 (Label/Artist)</strong></li><li><span>Masters Ownership</span><strong>Label Retains Perpetuity</strong></li><li><span>Marketing Budget</span><strong>$500K - $2M Advance</strong></li></ul>
            </div>
          </div>
        </section>

        <section className="fade-up">
          <div className="section-head"><div className="section-head__left"><span className="section-head__num">No. 04</span><h2 className="section-head__title">Executive <em>Moves</em> <div className="help-icon-wrapper"><span className="help-icon">?</span><span className="help-tooltip">Who got hired or fired at major labels. Proves the site appeals to industry executives.</span></div></h2></div></div>
          <ul className="exec-list">
            <li className="exec-row"><div className="exec-label is-hire">HIRED</div><div className="exec-info"><div className="exec-name">Tunji Balogun</div><div className="exec-role">Chairman & CEO</div></div><div className="exec-company">Def Jam Records</div></li>
            <li className="exec-row"><div className="exec-label is-fire">FIRED</div><div className="exec-info"><div className="exec-name">Lucian Grainge</div><div className="exec-role">CEO (Stepping Down)</div></div><div className="exec-company">Universal Music Group</div></li>
          </ul>
        </section>

        <section className="fade-up">
          <div className="section-head"><div className="section-head__left"><span className="section-head__num">No. 05</span><h2 className="section-head__title">Industry <em>Coverage</em></h2></div></div>
          {loading ? <div className="text-zinc-500 animate-pulse">Loading articles...</div> : articles.length === 0 ? <div className="text-zinc-600 italic text-center py-20">No industry articles published yet.</div> : (
            <div className="story-grid">
              {articles.map((article, idx) => (
                <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} key={idx} className="story">
                  <div className="story__image"><img src={article.thumbnail_url || `https://picsum.photos/seed/boardroom-news-${idx}/600/450`} alt="" /></div>
                  <div className="story__kicker">Industry</div>
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