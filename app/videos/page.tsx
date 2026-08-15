"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

export default function VideosPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [vaultUnlocked, setVaultUnlocked] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fade-up, .line-mask').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Videos" />
      
      <style dangerouslySetInnerHTML={{__html: `
        :root { --bg: #0a0a0a; --bg-elev: #131313; --text: #ffffff; --text-soft: #a8a8a8; --text-mute: #6e6e6e; --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25); --line: rgba(255,255,255,0.10); --line-soft: rgba(255,255,255,0.06); --red: #d24239; --red-soft: rgba(210, 66, 57, 0.15); --green: #6bbf6b; --ease-quiet: cubic-bezier(.22, 1, .36, 1); }
        .shell { max-width: 1400px; margin: 0 auto; padding: 64px 32px 80px; }
        .page-head { margin-bottom: 48px; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--line); padding-bottom: 32px; }
        .page-head__left { flex: 1; }
        .page-head__num { font-family: monospace; font-size: 12px; letter-spacing: 0.2em; color: var(--accent); margin-bottom: 12px; display: block; }
        .page-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: clamp(48px, 8vw, 96px); line-height: 0.9; letter-spacing: -0.03em; }
        .page-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .page-head__right { text-align: right; font-family: 'Times New Roman', serif; font-style: italic; font-size: 16px; color: var(--text-soft); max-width: 400px; }
        .sponsor-banner { display: flex; align-items: center; justify-content: center; gap: 16px; background: var(--bg-elev); border: 1px solid var(--line); border-left: 3px solid var(--accent); padding: 16px 24px; margin-bottom: 48px; font-family: monospace; font-size: 11px; letter-spacing: 0.16em; color: var(--text-mute); text-transform: uppercase; }
        .sponsor-banner span { color: var(--text-soft); }
        .sponsor-banner strong { color: var(--accent); font-weight: 700; }
        .hero-video { position: relative; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; margin-bottom: 80px; background: #000; border: 1px solid var(--line); cursor: pointer; }
        .hero-video img { width: 100%; height: 100%; object-fit: cover; opacity: 0.7; filter: contrast(1.1); transition: transform 1.2s var(--ease-quiet), opacity .4s; }
        .hero-video:hover img { transform: scale(1.03); opacity: 0.8; }
        .hero-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 32px; background: linear-gradient(180deg, rgba(10,10,10,0.4) 0%, transparent 40%, rgba(10,10,10,0.9) 100%); }
        .hero-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .hero-tag { background: var(--red); color: #fff; padding: 6px 14px; font-family: monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
        .hero-views { background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); padding: 6px 14px; font-family: monospace; font-size: 11px; letter-spacing: 0.12em; color: var(--text); }
        .hero-center { display: flex; justify-content: center; align-items: center; }
        .play-btn { width: 80px; height: 80px; border-radius: 50%; border: 2px solid var(--accent); background: rgba(10,10,10,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; color: var(--accent); font-size: 24px; transition: all .3s var(--ease-quiet); cursor: pointer; }
        .hero-video:hover .play-btn { background: var(--accent); color: var(--bg); transform: scale(1.05); }
        .hero-bottom h2 { font-family: 'Times New Roman', serif; font-weight: 700; font-size: clamp(28px, 4vw, 48px); line-height: 1.1; margin-bottom: 12px; max-width: 800px; }
        .hero-bottom h2 em { font-style: italic; color: var(--accent); }
        .hero-meta { display: flex; gap: 24px; font-family: monospace; font-size: 11px; color: var(--text-soft); text-transform: uppercase; letter-spacing: 0.12em; }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 32px; border-bottom: 1px solid var(--accent); padding-bottom: 12px; }
        .section-head__left { display: flex; align-items: baseline; gap: 16px; }
        .section-head__num { font-family: monospace; font-size: 11px; letter-spacing: 0.2em; color: var(--accent); }
        .section-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 28px; letter-spacing: -0.01em; }
        .section-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .filter-tabs { display: flex; gap: 24px; margin-bottom: 32px; border-bottom: 1px solid var(--line); }
        .tab { font-family: monospace; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-mute); padding-bottom: 12px; border-bottom: 2px solid transparent; cursor: pointer; transition: all .3s; }
        .tab.is-active { color: var(--accent); border-color: var(--accent); }
        .tab:hover { color: var(--text); }
        .vod-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-bottom: 80px; }
        @media (max-width: 900px) { .vod-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .vod-grid { grid-template-columns: 1fr; } }
        .vod-card { display: flex; flex-direction: column; gap: 14px; text-decoration: none; color: inherit; }
        .vod-thumb { position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: var(--bg-elev); border: 1px solid var(--line-soft); }
        .vod-thumb img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.8) contrast(1.05); transition: transform 1.1s var(--ease-quiet), filter .4s; }
        .vod-card:hover .vod-thumb img { transform: scale(1.04); filter: brightness(0.95); }
        .vod-duration { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); padding: 4px 8px; font-family: monospace; font-size: 10px; letter-spacing: 0.1em; color: var(--text); }
        .vod-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .3s var(--ease-quiet); }
        .vod-play svg { width: 48px; height: 48px; fill: var(--accent); }
        .vod-card:hover .vod-play { opacity: 1; }
        .vod-kicker { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); }
        .vod-title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 20px; line-height: 1.2; }
        .vod-card:hover .vod-title { color: var(--accent); }
        .vod-meta { font-family: monospace; font-size: 10px; color: var(--text-mute); letter-spacing: 0.12em; text-transform: uppercase; }
        .reels-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 80px; }
        @media (max-width: 900px) { .reels-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .reels-grid { grid-template-columns: 1fr; } }
        .reel-card { position: relative; aspect-ratio: 9 / 16; overflow: hidden; background: var(--bg-elev); border: 1px solid var(--line-soft); cursor: pointer; }
        .reel-card img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.8) contrast(1.1); transition: transform 1.1s var(--ease-quiet); }
        .reel-card:hover img { transform: scale(1.05); }
        .reel-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 16px; background: linear-gradient(0deg, rgba(10,10,10,0.9) 10%, transparent 50%); }
        .reel-title { font-family: 'Times New Roman', serif; font-size: 16px; font-weight: 500; line-height: 1.2; color: var(--text); margin-bottom: 8px; }
        .reel-meta { display: flex; gap: 12px; font-family: monospace; font-size: 10px; color: var(--text-mute); letter-spacing: 0.1em; }
        .reel-meta span { display: flex; align-items: center; gap: 4px; }
        .reel-play { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 48px; height: 48px; border-radius: 50%; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; color: var(--text); font-size: 16px; opacity: 0; transition: opacity .3s; border: 1px solid var(--line); }
        .reel-card:hover .reel-play { opacity: 1; border-color: var(--accent); color: var(--accent); }
        .vault-section { position: relative; }
        .vault-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; transition: filter .5s var(--ease-quiet); }
        @media (max-width: 900px) { .vault-grid { grid-template-columns: 1fr; } }
        .vault-card { position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: var(--bg-elev); }
        .vault-card img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.6) contrast(1.1); }
        .vault-badge-18 { position: absolute; top: 12px; right: 12px; background: var(--red); color: #fff; padding: 4px 8px; font-family: monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; }
        .vault-lock-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(10,10,10,0.8); text-align: center; padding: 32px; transition: opacity .5s var(--ease-quiet); }
        .vault-lock-overlay .lock-icon { font-size: 32px; color: var(--red); margin-bottom: 16px; }
        .vault-lock-overlay h3 { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 28px; margin-bottom: 12px; }
        .vault-lock-overlay h3 em { font-style: italic; color: var(--red); }
        .vault-lock-overlay p { font-family: 'Times New Roman', serif; font-style: italic; color: var(--text-soft); font-size: 16px; max-width: 400px; margin-bottom: 24px; }
        .vault-btn { background: var(--red); color: #fff; border: none; padding: 12px 24px; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; transition: background .3s; cursor: pointer; }
        .vault-btn:hover { background: #b91c1c; }
        .fade-up { opacity: 0; transform: translateY(24px); transition: opacity .9s var(--ease-quiet), transform .9s var(--ease-quiet); }
        .fade-up.is-in { opacity: 1; transform: none; }
        .line-mask { overflow: hidden; display: inline-block; }
        .line-mask__inner { display: block; transform: translateY(110%); transition: transform 1.1s var(--ease-quiet); }
        .line-mask.is-in .line-mask__inner { transform: translateY(0); }
      `}} />

      <div className="shell">
        <header className="page-head fade-up">
          <div className="page-head__left">
            <span className="page-head__num">12 / On Demand</span>
            <h1 className="page-head__title line-mask"><span className="line-mask__inner">The <em>Video</em> Archive</span></h1>
          </div>
          <div className="page-head__right">
            The algorithm-free library. Long-form podcasts, interviews, and stream highlights that live forever.
          </div>
        </header>

        {/* SPONSOR BANNER */}
        <div className="sponsor-banner fade-up">
          <span>The Archive is Presented By:</span>
          <strong>DraftKings</strong>
          <span>·</span>
          <a href="#" style={{ color: 'var(--text)', textDecoration: 'underline', textUnderlineOffset: '4px' }}>Bet $5, Get $200</a>
        </div>

        {/* HERO VIDEO */}
        <div className="hero-video fade-up">
          <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80" alt="Hero Video" />
          <div className="hero-overlay">
            <div className="hero-top">
              <div className="hero-tag">Featured Episode</div>
              <div className="hero-views">12.4K Watching Now</div>
            </div>
            <div className="hero-center">
              <div className="play-btn">▶</div>
            </div>
            <div className="hero-bottom">
              <h2>The State of Hip-Hop in 2025: A <em>Live</em> Roundtable</h2>
              <div className="hero-meta">
                <span>Episode 142</span>
                <span>2:14:33 Duration</span>
                <span>Nov 18, 2024</span>
              </div>
            </div>
          </div>
        </div>

        {/* VOD GRID */}
        <section className="fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">No. 01</span>
              <h2 className="section-head__title">Recent <em>Uploads</em></h2>
            </div>
          </div>

          <div className="filter-tabs">
            {["All", "Podcast Episodes", "Stream Highlights", "Interviews", "Reactions"].map(tab => (
              <span key={tab} className={`tab ${activeTab === tab ? 'is-active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</span>
            ))}
          </div>

          <div className="vod-grid">
            <a href="#" className="vod-card">
              <div className="vod-thumb">
                <img src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80" alt="" />
                <div className="vod-duration">1:24:10</div>
                <div className="vod-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
              </div>
              <div className="vod-kicker">Podcast · Ep 141</div>
              <h3 className="vod-title">Does the Pop Machine Still Work? Analyzing Q3 Releases</h3>
              <div className="vod-meta">Nov 17 · 5.4K Views</div>
            </a>
            <a href="#" className="vod-card">
              <div className="vod-thumb">
                <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80" alt="" />
                <div className="vod-duration">0:18:42</div>
                <div className="vod-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
              </div>
              <div className="vod-kicker">Stream Highlight</div>
              <h3 className="vod-title">When the Chat Catches You Off Guard 😂</h3>
              <div className="vod-meta">Nov 16 · 12.1K Views</div>
            </a>
            <a href="#" className="vod-card">
              <div className="vod-thumb">
                <img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80" alt="" />
                <div className="vod-duration">0:45:15</div>
                <div className="vod-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
              </div>
              <div className="vod-kicker">Interview</div>
              <h3 className="vod-title">Sitting Down with Backseat Taxi Before Their Debut Drop</h3>
              <div className="vod-meta">Nov 14 · 8.1K Views</div>
            </a>
            <a href="#" className="vod-card">
              <div className="vod-thumb">
                <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80" alt="" />
                <div className="vod-duration">3:02:45</div>
                <div className="vod-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
              </div>
              <div className="vod-kicker">Podcast · Ep 140</div>
              <h3 className="vod-title">Live Listening Party: Kendrick Lamar's 'GNX' Deep Dive</h3>
              <div className="vod-meta">Nov 11 · 12.3K Views</div>
            </a>
            <a href="#" className="vod-card">
              <div className="vod-thumb">
                <img src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80" alt="" />
                <div className="vod-duration">0:12:30</div>
                <div className="vod-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
              </div>
              <div className="vod-kicker">Reaction</div>
              <h3 className="vod-title">First Reactions to the Sabrina Carpenter Album Drop</h3>
              <div className="vod-meta">Nov 09 · 9.2K Views</div>
            </a>
            <a href="#" className="vod-card">
              <div className="vod-thumb">
                <img src="https://images.unsplash.com/photo-1496337589254-7e19d01cec44?auto=format&fit=crop&w=600&q=80" alt="" />
                <div className="vod-duration">1:08:22</div>
                <div className="vod-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
              </div>
              <div className="vod-kicker">Podcast · Ep 139</div>
              <h3 className="vod-title">The UMG Acquisition: What It Means for Independent Artists</h3>
              <div className="vod-meta">Nov 08 · 3.9K Views</div>
            </a>
          </div>
        </section>

        {/* SHORT-FORM REELS */}
        <section className="fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">No. 02</span>
              <h2 className="section-head__title">Short-Form <em>Reels</em></h2>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--text-mute)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Swipe Up to Scroll</span>
          </div>

          <div className="reels-grid">
            <div className="reel-card">
              <img src="https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=300&q=80" alt="Reel" />
              <div className="reel-play">▶</div>
              <div className="reel-overlay">
                <h4 className="reel-title">Drake's surprise stream appearance</h4>
                <div className="reel-meta">
                  <span>♥ 15.2K</span>
                  <span>↻ 3.1K</span>
                </div>
              </div>
            </div>
            <div className="reel-card">
              <img src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=300&q=80" alt="Reel" />
              <div className="reel-play">▶</div>
              <div className="reel-overlay">
                <h4 className="reel-title">Kendrick fans vs. Drake fans</h4>
                <div className="reel-meta">
                  <span>♥ 42.1K</span>
                  <span>↻ 8.4K</span>
                </div>
              </div>
            </div>
            <div className="reel-card">
              <img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=300&q=80" alt="Reel" />
              <div className="reel-play">▶</div>
              <div className="reel-overlay">
                <h4 className="reel-title">The wildest chat moment of the year</h4>
                <div className="reel-meta">
                  <span>♥ 9.8K</span>
                  <span>↻ 1.2K</span>
                </div>
              </div>
            </div>
            <div className="reel-card">
              <img src="https://images.unsplash.com/photo-1496337589254-7e19d01cec44?auto=format&fit=crop&w=300&q=80" alt="Reel" />
              <div className="reel-play">▶</div>
              <div className="reel-overlay">
                <h4 className="reel-title">Breaking down the 360 deal</h4>
                <div className="reel-meta">
                  <span>♥ 5.4K</span>
                  <span>↻ 800</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* UNCENSORED VAULT */}
        <section className="vault-section fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">No. 03</span>
              <h2 className="section-head__title">The <em>Uncensored</em> Vault</h2>
            </div>
          </div>

          <div className="vault-grid" style={{ filter: vaultUnlocked ? 'none' : 'blur(8px)', pointerEvents: vaultUnlocked ? 'auto' : 'none' }}>
            <div className="vault-card">
              <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80" alt="" />
              <div className="vault-badge-18">18+</div>
            </div>
            <div className="vault-card">
              <img src="https://images.unsplash.com/photo-1496337589254-7e19d01cec44?auto=format&fit=crop&w=600&q=80" alt="" />
              <div className="vault-badge-18">18+</div>
            </div>
            <div className="vault-card">
              <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80" alt="" />
              <div className="vault-badge-18">18+</div>
            </div>
          </div>

          {!vaultUnlocked && (
            <div className="vault-lock-overlay">
              <div className="lock-icon">⛔</div>
              <h3>The <em>Uncensored</em> Vault is Locked</h3>
              <p>This section contains raw, explicit, and unedited clips that cannot live on YouTube or Instagram. Enable 18+ Mode to reveal the archive.</p>
              <button className="vault-btn" onClick={() => setVaultUnlocked(true)}>Enable 18+ Mode</button>
            </div>
          )}
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}