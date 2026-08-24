"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [voted, setVoted] = useState(false);
  
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fade-up, .line-mask').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Social" />
      <style dangerouslySetInnerHTML={{__html: `
        :root { --bg: #0a0a0a; --bg-elev: #131313; --text: #ffffff; --text-soft: #a8a8a8; --text-mute: #6e6e6e; --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25); --line: rgba(255,255,255,0.10); --line-soft: rgba(255,255,255,0.06); --red: #d24239; --green: #6bbf6b; --ease-quiet: cubic-bezier(.22, 1, .36, 1); }
        .shell { max-width: 1400px; margin: 0 auto; padding: 64px 32px 80px; }
        .page-head { margin-bottom: 64px; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--line); padding-bottom: 32px; }
        .page-head__left { flex: 1; }
        .page-head__num { font-family: monospace; font-size: 12px; letter-spacing: 0.2em; color: var(--accent); margin-bottom: 12px; display: block; }
        .page-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: clamp(48px, 8vw, 96px); line-height: 0.9; letter-spacing: -0.03em; }
        .page-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .page-head__right { text-align: right; font-family: 'Times New Roman', serif; font-style: italic; font-size: 16px; color: var(--text-soft); max-width: 400px; }
        .social-layout { display: grid; grid-template-columns: 1.5fr 1fr; gap: 64px; margin-bottom: 80px; }
        @media (max-width: 1100px) { .social-layout { grid-template-columns: 1fr; } }
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

        .pulse-section { margin-bottom: 80px; }
        .poll-card { background: var(--bg-elev); border: 1px solid var(--line); padding: 48px; display: grid; grid-template-columns: 1fr 1.2fr; gap: 48px; align-items: center; }
        @media (max-width: 800px) { .poll-card { grid-template-columns: 1fr; padding: 32px; } }
        .poll-left h2 { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 36px; line-height: 1; margin-bottom: 16px; }
        .poll-left h2 em { font-style: italic; color: var(--accent); }
        .poll-left p { font-family: 'Times New Roman', serif; font-style: italic; color: var(--text-soft); font-size: 16px; margin-bottom: 24px; }
        .poll-meta { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
        .poll-meta::before { content: ''; width: 6px; height: 6px; background: var(--red); border-radius: 50%; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .poll-options { display: flex; flex-direction: column; gap: 16px; }
        .poll-option { position: relative; background: var(--bg); border: 1px solid var(--line); padding: 16px 24px; cursor: pointer; transition: border-color .3s; overflow: hidden; }
        .poll-option:hover { border-color: var(--accent); }
        .poll-option-fill { position: absolute; top: 0; left: 0; height: 100%; background: var(--accent-soft); border-right: 1px solid var(--red); transition: width 1s var(--ease-quiet); }
        .poll-option-content { position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center; }
        .poll-option-text { font-family: 'Times New Roman', serif; font-size: 18px; font-weight: 500; }
        .poll-option-percent { font-family: monospace; font-size: 14px; font-weight: 600; color: var(--accent); }
        .filter-tabs { display: flex; gap: 24px; margin-bottom: 32px; border-bottom: 1px solid var(--line); }
        .tab { font-family: monospace; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-mute); padding-bottom: 12px; border-bottom: 2px solid transparent; cursor: pointer; transition: all .3s; }
        .tab.is-active { color: var(--accent); border-color: var(--accent); }
        .tab:hover { color: var(--text); }
        .social-wall { column-count: 2; column-gap: 24px; }
        @media (max-width: 600px) { .social-wall { column-count: 1; } }
        .social-card { break-inside: avoid; margin-bottom: 24px; background: var(--bg-elev); border: 1px solid var(--line-soft); transition: border-color .3s var(--ease-quiet); }
        .social-card:hover { border-color: var(--line); }
        .card-head { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--line-soft); }
        .card-avatar { width: 36px; height: 36px; background: var(--bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Times New Roman', serif; font-weight: 700; color: var(--accent); border: 1px solid var(--line); flex-shrink: 0; }
        .card-name { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 13px; }
        .card-source { font-family: monospace; font-size: 9px; color: var(--text-mute); letter-spacing: 0.12em; text-transform: uppercase; }
        .source-badge { font-family: monospace; font-size: 9px; padding: 2px 6px; border: 1px solid var(--line); letter-spacing: 0.1em; text-transform: uppercase; color: var(--text); }
        .source-badge.is-ig { color: var(--red); border-color: var(--red); }
        .card-body { padding: 20px; }
        .card-text { font-family: 'Times New Roman', serif; font-size: 16px; line-height: 1.5; color: var(--text); margin-bottom: 16px; }
        .card-media { width: 100%; border: 1px solid var(--line-soft); margin-bottom: 16px; overflow: hidden; }
        .card-media img { width: 100%; height: auto; filter: brightness(0.9) contrast(1.05); transition: transform 1.1s var(--ease-quiet); }
        .social-card:hover .card-media img { transform: scale(1.03); }
        .card-footer { display: flex; gap: 24px; padding: 12px 20px; border-top: 1px solid var(--line-soft); font-family: monospace; font-size: 11px; color: var(--text-mute); letter-spacing: 0.1em; }
        .card-footer span { display: flex; align-items: center; gap: 6px; cursor: pointer; transition: color .3s; }
        .card-footer span:hover { color: var(--accent); }
        .hot-takes-list { display: flex; flex-direction: column; gap: 24px; }
        .take-item { display: grid; grid-template-columns: 40px 1fr; gap: 16px; padding-bottom: 24px; border-bottom: 1px solid var(--line-soft); }
        .take-item:last-child { border-bottom: none; }
        .vote-col { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .vote-btn { width: 32px; height: 32px; border: 1px solid var(--line); color: var(--text-mute); display: flex; align-items: center; justify-content: center; transition: all .3s; cursor: pointer; background: transparent; font-size: 14px; }
        .vote-btn:hover { border-color: var(--accent); color: var(--accent); }
        .vote-btn.is-upvoted { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
        .vote-count { font-family: monospace; font-size: 12px; font-weight: 600; color: var(--text); }
        .take-content { display: flex; flex-direction: column; gap: 8px; }
        .take-user { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .take-username { font-weight: 600; color: var(--text); }
        .tier-badge { font-family: monospace; font-size: 8px; padding: 2px 6px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; }
        .tier-civilian { color: var(--text-mute); border: 1px solid var(--line); }
        .tier-scholar { color: var(--accent); border: 1px solid var(--accent-soft); }
        .tier-circle { color: #fff; background: var(--red); border: 1px solid var(--red); }
        .take-text { font-family: 'Times New Roman', serif; font-size: 18px; line-height: 1.4; color: var(--text); }
        .take-text em { font-style: italic; color: var(--accent); }
        .take-meta { font-family: monospace; font-size: 10px; color: var(--text-mute); letter-spacing: 0.1em; display: flex; gap: 16px; margin-top: 4px; }
        .take-meta span { cursor: pointer; transition: color .3s; }
        .take-meta span:hover { color: var(--accent); }
        .sidebar { display: flex; flex-direction: column; gap: 48px; position: sticky; top: 120px; align-self: start; }
        @media (max-width: 1100px) { .sidebar { position: static; } }
        .leaderboard-card { background: var(--bg-elev); border: 1px solid var(--line); padding: 32px; }
        .leaderboard-list { list-style: none; padding: 0; margin: 0; }
        .leader-row { display: grid; grid-template-columns: 32px 1fr auto; gap: 16px; align-items: center; padding: 16px 0; border-bottom: 1px solid var(--line-soft); }
        .leader-row:last-child { border-bottom: none; padding-bottom: 0; }
        .leader-rank { font-family: 'Times New Roman', serif; font-size: 20px; font-weight: 700; color: var(--text-mute); text-align: center; }
        .leader-row.is-top .leader-rank { color: var(--accent); }
        .leader-user { display: flex; flex-direction: column; gap: 4px; }
        .leader-name { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; }
        .leader-tier { font-family: monospace; font-size: 9px; color: var(--text-mute); letter-spacing: 0.1em; text-transform: uppercase; }
        .leader-points { font-family: monospace; font-size: 14px; font-weight: 600; color: var(--accent); }
        .discord-card { background: var(--bg-elev); border-left: 3px solid var(--accent); padding: 32px; }
        .discord-head { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
        .discord-status { width: 8px; height: 8px; background: var(--green); border-radius: 50%; animation: pulse 2s infinite; }
        .discord-title { font-family: 'Times New Roman', serif; font-style: italic; font-size: 20px; font-weight: 500; }
        .discord-feed { margin-bottom: 24px; }
        .discord-msg { padding: 8px 0; border-bottom: 1px solid var(--line-soft); font-size: 13px; line-height: 1.4; color: var(--text-soft); }
        .discord-msg:last-child { border-bottom: none; }
        .discord-msg strong { color: var(--accent); font-weight: 600; }
        .discord-msg span { color: var(--text-mute); font-family: monospace; font-size: 10px; margin-left: 4px; }
        .discord-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: var(--accent); color: #fff; padding: 14px; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; transition: background .3s; cursor: pointer; text-decoration: none; }
        .discord-btn:hover { background: #b91c1c; }
        .uncensored-vault { border: 2px dashed var(--line); padding: 48px; text-align: center; margin-bottom: 80px; position: relative; }
        .vault-lock { font-size: 24px; color: var(--red); margin-bottom: 16px; }
        .vault-title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 32px; margin-bottom: 12px; }
        .vault-title em { font-style: italic; color: var(--red); }
        .vault-desc { font-family: 'Times New Roman', serif; font-style: italic; color: var(--text-soft); font-size: 16px; max-width: 500px; margin: 0 auto 24px; }
        .vault-btn { background: transparent; color: var(--red); border: 1px solid var(--red); padding: 12px 24px; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; transition: all .3s; cursor: pointer; }
        .vault-btn:hover { background: var(--red); color: #fff; }
        .fade-up { opacity: 0; transform: translateY(24px); transition: opacity .9s var(--ease-quiet), transform .9s var(--ease-quiet); }
        .fade-up.is-in { opacity: 1; transform: none; }
        .line-mask { overflow: hidden; display: inline-block; }
        .line-mask__inner { display: block; transform: translateY(110%); transition: transform 1.1s var(--ease-quiet); }
        .line-mask.is-in .line-mask__inner { transform: translateY(0); }
      `}} />

      <div className="shell">
        <header className="page-head fade-up">
          <div className="page-head__left">
            <span className="page-head__num">11 / The Community</span>
            <h1 className="page-head__title line-mask"><span className="line-mask__inner">The <em>Social</em> Wall</span></h1>
          </div>
          <div className="page-head__right">The unified feed. The hot takes. The Akademy. A central hub for the culture, immune to the algorithm.</div>
        </header>

        <section className="pulse-section fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">No. 01</span>
              <h2 className="section-head__title">Pulse of the <em>Culture</em> <div className="help-icon-wrapper"><span className="help-icon">?</span><span className="help-tooltip">Interactive polls built natively into the site. Users vote and see live percentages.</span></div></h2>
            </div>
          </div>
          <div className="poll-card">
            <div className="poll-left">
              <h2>Who won the <em>Drake vs. Kendrick</em> beef?</h2>
              <p>It's the debate that ripped the internet in half for six months. We're putting it to the community to settle the score once and for all.</p>
              <div className="poll-meta">12,452 Votes · Live</div>
            </div>
            <div className="poll-options">
              <div className="poll-option" onClick={() => setVoted(true)}>
                <div className="poll-option-fill" style={{ width: '85%' }}></div>
                <div className="poll-option-content"><span className="poll-option-text">Drake</span><span className="poll-option-percent">85%</span></div>
              </div>
              <div className="poll-option" onClick={() => setVoted(true)}>
                <div className="poll-option-fill" style={{ width: '15%' }}></div>
                <div className="poll-option-content"><span className="poll-option-text">Kendrick Lamar</span><span className="poll-option-percent">15%</span></div>
              </div>
            </div>
          </div>
        </section>

        <div className="social-layout">
          <div className="main-col fade-up">
            <div className="filter-tabs">
              {["All", "X (Twitter)", "Instagram", "TikTok"].map(tab => (
                <span key={tab} className={`tab ${activeTab === tab ? 'is-active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</span>
              ))}
            </div>
            
            <div className="section-head" style={{ marginBottom: '24px', borderBottom: '1px solid var(--line)' }}>
              <div className="section-head__left">
                <span className="section-head__num">No. 02</span>
                <h2 className="section-head__title" style={{ fontSize: '22px' }}>Unified <em>Social</em> Wall <div className="help-icon-wrapper"><span className="help-icon">?</span><span className="help-tooltip">Aggregates tweets, IG posts, and TikToks into one native feed.</span></div></h2>
              </div>
            </div>
            <div className="social-wall">
              <div className="social-card"><div className="card-head"><div className="card-avatar">A</div><div><div className="card-name">DJ Akademiks</div><div className="card-source">2 Hours Ago</div></div><div className="source-badge">X</div></div><div className="card-body"><p className="card-text">Kendrick's 'GNX' did 324k first week. No features, no massive rollout. Just bars.</p></div></div>
              <div className="social-card"><div className="card-head"><div className="card-avatar">A</div><div><div className="card-name">DJ Akademiks</div><div className="card-source">5 Hours Ago</div></div><div className="source-badge is-ig">IG</div></div><div className="card-body"><div className="card-media"><img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80" alt=""/></div><p className="card-text">Live from the terminal. #AkademyLive</p></div></div>
            </div>

            <div style={{ marginTop: '80px' }}>
              <div className="section-head"><div className="section-head__left"><span className="section-head__num">No. 03</span><h2 className="section-head__title" style={{ fontSize: '22px' }}>Community <em>Hot Takes</em> <div className="help-icon-wrapper"><span className="help-icon">?</span><span className="help-tooltip">A controlled environment for the community to argue. Users submit text posts that get upvoted or downvoted.</span></div></h2></div></div>
              <div className="hot-takes-list">
                <div className="take-item"><div className="vote-col"><button className="vote-btn is-upvoted">▲</button><div className="vote-count">4.2K</div><button className="vote-btn">▼</button></div><div className="take-content"><div className="take-user"><span className="take-username">ColeDevotee_88</span><span className="tier-badge tier-scholar">Scholar</span></div><p className="take-text">J. Cole's apology was actually the hardest bar dropped this year.</p></div></div>
                <div className="take-item"><div className="vote-col"><button className="vote-btn is-upvoted">▲</button><div className="vote-count">2.8K</div><button className="vote-btn">▼</button></div><div className="take-content"><div className="take-user"><span className="take-username">VinylCollector_99</span><span className="tier-badge tier-circle">VIP</span></div><p className="take-text">The 360 deal is coming back, but this time it's marketed as 'creator-friendly infrastructure.'</p></div></div>
              </div>
            </div>
          </div>

          <aside className="sidebar fade-up">
            <div className="leaderboard-card">
              <div className="section-head" style={{ marginBottom: '24px', borderBottom: '1px solid var(--line)' }}>
                <div className="section-head__left"><h2 className="section-head__title" style={{ fontSize: '22px' }}>Top <em>Contributors</em> <div className="help-icon-wrapper"><span className="help-icon">?</span><span className="help-tooltip">A user profile and ranking system. Users earn points for commenting, sharing, and participating.</span></div></h2></div>
              </div>
              <ul className="leaderboard-list">
                <li className="leader-row is-top"><div className="leader-rank">01</div><div className="leader-user"><div className="leader-name">SharpMoney_99</div><div className="leader-tier">Inner Circle · 45,200 Pts</div></div><div className="leader-points">+500</div></li>
                <li className="leader-row"><div className="leader-rank">02</div><div className="leader-user"><div className="leader-name">BookieSlayer</div><div className="leader-tier">Akademy Scholar · 32,100 Pts</div></div><div className="leader-points">+250</div></li>
              </ul>
            </div>
            <div className="discord-card">
              <div className="section-head" style={{ marginBottom: '24px', borderBottom: '1px solid var(--line)' }}>
                <div className="section-head__left"><h2 className="section-head__title" style={{ fontSize: '22px' }}>The <em>Discord</em> is Live <div className="help-icon-wrapper"><span className="help-icon">?</span><span className="help-tooltip">A live sidebar widget showing who is active in the Discord right now.</span></div></h2></div>
              </div>
              <div className="discord-feed"><div className="discord-msg"><strong>SharpMoney:</strong> The new layout is insane. <span>2m</span></div></div>
              <a href="#" className="discord-btn">Join the Discord →</a>
            </div>
          </aside>
        </div>

        <section className="fade-up">
          <div className="uncensored-vault">
            <div className="vault-lock">⛔</div>
            <h2 className="vault-title">The <em>Uncensored</em> Vault</h2>
            <p className="vault-desc">Raw, unedited clips and live moments that can't live on IG or YouTube. Toggle on 18+ Mode in the top nav to unlock the native sub-feed.</p>
            <button className="vault-btn">Enable 18+ Mode</button>
          </div>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}