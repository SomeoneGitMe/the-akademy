"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

interface PublishedArticle { 
  title: string; source: string; thumbnail_url: string; 
  created_at: string; tags: string[]; 
}

const mockMusicArticles = [
  { title: "Drake Submits to 'Goth Baddie' Streamer", source: "The Akademy", thumbnail_url: "https://images.unsplash.com/photo-1605295322749-6ef2395d4c30?auto=format&fit=crop&w=800&q=80", created_at: new Date().toISOString(), tags: ["Music", "News"] },
  { title: "Kendrick Lamar Drops Surprise Diss Track", source: "The Akademy", thumbnail_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80", created_at: new Date().toISOString(), tags: ["Music", "News"] },
  { title: "Lil Durk's Legal Team Files Motion", source: "The Akademy", thumbnail_url: "https://images.unsplash.com/photo-1605542339524-1b2f8b6c6c1b?auto=format&fit=crop&w=800&q=80", created_at: new Date().toISOString(), tags: ["Music", "Legal"] },
  { title: "J. Cole announces 2026 world tour", source: "The Akademy", thumbnail_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80", created_at: new Date().toISOString(), tags: ["Music", "Industry"] },
];

export default function ChartsPage() {
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // 1. Data Fetching Effect
  useEffect(() => {
    setIsMounted(true);
    fetch('/api/published-articles')
      .then(res => res.json())
      .then(data => {
        const filtered = (data.articles || []).filter((a: PublishedArticle) => 
          (a.tags || []).map(t => t.toLowerCase()).includes('music')
        );
        setArticles(filtered.length > 0 ? filtered : mockMusicArticles);
        setLoading(false);
      })
      .catch(() => {
        setArticles(mockMusicArticles);
        setLoading(false);
      });
  }, []);

  // 2. Animation Observer Effect (Runs AFTER loading is done)
  useEffect(() => {
    if (loading) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => { 
        if (entry.isIntersecting) { 
          entry.target.classList.add('is-in'); 
          io.unobserve(entry.target); 
        } 
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    const raf = requestAnimationFrame(() => {
      document.querySelectorAll('.fade-up, .line-mask').forEach(el => io.observe(el));
    });

    const chartObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const rows = entry.target.querySelectorAll('.sales-row');
          rows.forEach((row, index) => { setTimeout(() => { row.classList.add('is-in'); }, index * 150); });
          chartObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    
    const chart = document.querySelector('.sales-chart');
    if (chart) chartObserver.observe(chart);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      if (chart) chartObserver.unobserve(chart);
    };
  }, [loading]);

  const topTracks = [
    { rank: "01", art: "https://images.genius.com/c6619186e8f93ff5c7ce61912e08d9c0.1000x1000x1.png", title: "STFU", artist: "Drake", peak: "1", weeks: "6", trend: "flat" },
    { rank: "02", art: "https://images.genius.com/8e735d8d35ed60db832ca4d86d49619f.1000x1000x1.png", title: "Spend Dat", artist: "Yung Miami", peak: "2", weeks: "4", trend: "down" },
    { rank: "03", art: "https://ceconline.co.za/wp-content/uploads/2026/08/CARDI-B-.jpg", title: "AH HA", artist: "Cardi B", peak: "3", weeks: "1", trend: "new" },
    { rank: "04", art: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/4c/ed/97/4ced97e4-5f77-b8d6-1a2f-57ef0a93cf57/26UMGIM41443.rgb.jpg/296x296bb.webp", title: "Luther", artist: "Kendrick Lamar & SZA", peak: "4", weeks: "5", trend: "up" },
    { rank: "05", art: "https://images.genius.com/c6619186e8f93ff5c7ce61912e08d9c0.1000x1000x1.png", title: "Not Like Us", artist: "Kendrick Lamar", peak: "5", weeks: "12", trend: "down" },
  ];

  // Updated to Chronological Order with corrected EAU numbers and bar percentages
  const albumSales = [
    { art: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTi7hPBhD4O1AyVTnhrdGh_XMUilnAc3tP3LimIfADNzUzYA2lLRKt5nfV4&s=10", album: "Maverick (Almost Forever)", artist: "Lil Uzi Vert · Aug 2026", percent: "5%", units: "23K", isTop: false },
    { art: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0FlVn4R5jRPvaYAG43X1m_K54eBFcwNPAaKNbCK-DyE_-u649-NhTnkOT&s=10", album: "The Real Me", artist: "Future · Jul 2026", percent: "15%", units: "68K", isTop: false },
    { art: "https://substackcdn.com/image/fetch/$s_!Tddb!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F29e39ea5-d9e5-4b5e-bd3e-6dff39110eae_3000x3000.jpeg", album: "Kill the King", artist: "T.I. · Jul 2026", percent: "10%", units: "45K", isTop: false },
    { art: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8aImkF1hbihVEp_563hOqUElAD3PdEFbCD_HepPkWEg&s=10", album: "ICEMAN", artist: "Drake · May 2026", percent: "100%", units: "463K", isTop: true },
    { art: "https://www.sentireascoltare.com/wp-content/uploads/2026/02/j-cole-the-fall-off.webp", album: "The Fall Off", artist: "J. Cole · Early 2026", percent: "24%", units: "110K", isTop: false },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Charts" />
      
      <style dangerouslySetInnerHTML={{__html: `
        :root { --bg: #0a0a0a; --bg-elev: #131313; --text: #ffffff; --text-soft: #a8a8a8; --text-mute: #6e6e6e; --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25); --line: rgba(255,255,255,0.10); --line-soft: rgba(255,255,255,0.06); --red: #d24239; --blue: #6b8cff; --green: #6bbf6b; --ease-quiet: cubic-bezier(.22, 1, .36, 1); --ease-emphasis: cubic-bezier(.16, 1, .3, 1); }
        .shell { max-width: 1400px; margin: 0 auto; padding: 80px 32px; }
        .page-head { margin-bottom: 80px; text-align: center; border-bottom: 1px solid var(--line); padding-bottom: 48px; }
        .page-head__num { font-family: monospace; font-size: 12px; letter-spacing: 0.2em; color: var(--accent); margin-bottom: 16px; display: block; }
        .page-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: clamp(56px, 10vw, 120px); line-height: 0.9; letter-spacing: -0.03em; margin-bottom: 24px; }
        .page-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .page-head__dek { font-family: 'Times New Roman', serif; font-size: 20px; line-height: 1.5; color: var(--text-soft); max-width: 680px; margin: 0 auto; }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 40px; border-bottom: 1px solid var(--accent); padding-bottom: 16px; }
        .section-head__left { display: flex; align-items: baseline; gap: 16px; }
        .section-head__num { font-family: monospace; font-size: 11px; letter-spacing: 0.2em; color: var(--accent); }
        .section-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 32px; letter-spacing: -0.01em; }
        .section-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .section-head__more { font-family: monospace; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-mute); }
        .billboard { list-style: none; margin-bottom: 100px; padding: 0; }
        .billboard-row { display: grid; grid-template-columns: 80px 80px 1fr auto auto 60px; align-items: center; gap: 32px; padding: 20px 0; border-bottom: 1px solid var(--line-soft); transition: background .3s var(--ease-quiet); }
        .billboard-row:hover { background: rgba(255,255,255,0.015); }
        .bb-rank { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 48px; line-height: 1; color: var(--text-mute); text-align: center; }
        .billboard-row.is-number-one .bb-rank { color: var(--accent); }
        .bb-art { width: 64px; height: 64px; background: var(--bg-elev); overflow: hidden; }
        .bb-art img { width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1); }
        .bb-info { display: flex; flex-direction: column; gap: 4px; }
        .bb-title { font-family: 'Times New Roman', serif; font-size: 22px; font-weight: 500; line-height: 1.2; }
        .bb-artist { font-family: 'Inter', sans-serif; font-size: 13px; color: var(--text-soft); }
        .bb-stats { font-family: monospace; font-size: 11px; letter-spacing: 0.12em; color: var(--text-mute); text-transform: uppercase; text-align: right; }
        .bb-stats strong { color: var(--text); font-weight: 500; display: block; margin-bottom: 4px; }
        .bb-trend { font-family: monospace; font-size: 14px; width: 40px; text-align: center; }
        .trend-up { color: var(--green); } .trend-down { color: var(--red); } .trend-flat { color: var(--text-mute); } .trend-new { color: var(--accent); }
        .bb-play { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; transition: all .3s var(--ease-quiet); background: none; color: inherit; cursor: pointer; }
        .bb-play:hover { border-color: var(--accent); color: var(--accent); }
        .sales-chart { margin-bottom: 100px; display: grid; grid-template-columns: 1fr; gap: 16px; }
        .sales-row { display: grid; grid-template-columns: 240px 1fr 80px; align-items: center; gap: 24px; }
        .sales-label { display: flex; align-items: center; gap: 12px; }
        .sales-art { width: 40px; height: 40px; background: var(--bg-elev); overflow: hidden; flex-shrink: 0; }
        .sales-art img { width: 100%; height: 100%; object-fit: cover; }
        .sales-album { font-family: 'Times New Roman', serif; font-size: 16px; font-weight: 500; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sales-artist { font-family: monospace; font-size: 10px; color: var(--text-mute); text-transform: uppercase; letter-spacing: 0.1em; }
        .sales-bar-container { height: 8px; background: var(--bg-elev); position: relative; overflow: hidden; }
        .sales-bar { height: 100%; background: var(--text-mute); transform-origin: left; transform: scaleX(0); transition: transform 1.2s var(--ease-emphasis); }
        .sales-row.is-top .sales-bar { background: var(--accent); }
        .sales-row.is-in .sales-bar { transform: scaleX(1); }
        .sales-units { font-family: monospace; font-size: 14px; font-weight: 500; color: var(--text); text-align: right; }
        .sales-row.is-top .sales-units { color: var(--accent); }
        .media-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 32px; margin-bottom: 64px; }
        @media (max-width: 900px) { .media-grid { grid-template-columns: 1fr; } }
        .live-block { position: relative; background: var(--bg-elev); border: 1px solid var(--line); overflow: hidden; min-height: 400px; display: flex; flex-direction: column; justify-content: flex-end; }
        .live-bg { position: absolute; inset: 0; z-index: 1; }
        .live-bg img { width: 100%; height: 100%; object-fit: cover; opacity: 0.5; filter: grayscale(0.8) contrast(1.2); }
        .live-content { position: relative; z-index: 2; padding: 32px; background: linear-gradient(0deg, var(--bg) 10%, transparent 100%); }
        .live-tag { display: inline-flex; align-items: center; gap: 8px; background: var(--red); color: #fff; padding: 4px 12px; margin-bottom: 16px; font-family: monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700; }
        .live-tag::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: #fff; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .live-title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 36px; line-height: 1.1; margin-bottom: 12px; }
        .live-title em { font-style: italic; }
        .live-meta { display: flex; gap: 16px; font-family: monospace; font-size: 11px; color: var(--text-soft); text-transform: uppercase; letter-spacing: 0.12em; }
        .news-list { display: flex; flex-direction: column; gap: 24px; }
        .news-item { padding-bottom: 24px; border-bottom: 1px solid var(--line-soft); }
        .news-item:last-child { border-bottom: none; }
        .news-kicker { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 8px; display: block; }
        .news-title { font-family: 'Times New Roman', serif; font-size: 20px; font-weight: 500; line-height: 1.3; margin-bottom: 8px; }
        .news-meta { font-family: monospace; font-size: 10px; color: var(--text-mute); text-transform: uppercase; letter-spacing: 0.12em; }
        .review-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; margin-bottom: 80px; }
        @media (max-width: 900px) { .review-grid { grid-template-columns: repeat(2, 1fr); } } @media (max-width: 600px) { .review-grid { grid-template-columns: 1fr; } }
        .story { display: flex; flex-direction: column; gap: 14px; }
        .story__image { width: 100%; aspect-ratio: 4 / 3; overflow: hidden; background: #1a1a1a; display: block; }
        .story__image img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.9) contrast(1.05); transition: transform 1.1s var(--ease-quiet); }
        .story:hover .story__image img { transform: scale(1.03); }
        .story__kicker { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-top: 4px; }
        .story__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 22px; line-height: 1.2; }
        .story:hover .story__title { color: var(--accent); }
        .story__meta { font-family: monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-mute); }
        .fade-up { opacity: 0; transform: translateY(24px); transition: opacity .9s var(--ease-quiet), transform .9s var(--ease-quiet); }
        .fade-up.is-in { opacity: 1; transform: none; }
        .line-mask { overflow: hidden; display: inline-block; }
        .line-mask__inner { display: block; transform: translateY(110%); transition: transform 1.1s var(--ease-quiet); }
        .line-mask.is-in .line-mask__inner { transform: translateY(0); }
      `}} />

      <div className="shell">
        <header className="page-head">
          <span className="page-head__num fade-up">03 / Sound</span>
          <h1 className="page-head__title line-mask"><span className="line-mask__inner"><em>ChartDemiks</em></span></h1>
          <p className="page-head__dek fade-up">The authoritative source for hip-hop analytics. Real-time rankings, first-week projections, and market share.</p>
        </header>

        {/* TOP 5 TRACKS */}
        <section className="fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">No. 01</span>
              <h2 className="section-head__title"><em>The Hot 5</em> Tracks Right Now</h2>
            </div>
            <Link href="#" className="section-head__more">View Full Chart →</Link>
          </div>

          <ul className="billboard">
            {topTracks.map((track, idx) => (
              <li className={`billboard-row ${idx === 0 ? 'is-number-one' : ''} fade-up`} key={idx}>
                <div className="bb-rank">{track.rank}</div>
                <div className="bb-art"><img src={track.art} alt="" /></div>
                <div className="bb-info">
                  <div className="bb-title">{track.title}</div>
                  <div className="bb-artist">{track.artist}</div>
                </div>
                <div className="bb-stats"><strong>Peak: {track.peak}</strong>{track.weeks} Weeks on Chart</div>
                <div className={`bb-trend trend-${track.trend}`}>
                  {track.trend === 'up' ? '▲' : track.trend === 'down' ? '▼' : track.trend === 'new' ? '★' : '—'}
                </div>
                <button className="bb-play">▶</button>
              </li>
            ))}
          </ul>
        </section>

        {/* FIRST WEEK SALES */}
        <section className="fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">No. 02</span>
              <h2 className="section-head__title">First Week <em>Album Sales</em></h2>
            </div>
            <Link href="#" className="section-head__more">Methodology →</Link>
          </div>

          <div className="sales-chart">
            {albumSales.map((sale, idx) => (
              <div className={`sales-row ${sale.isTop ? 'is-top' : ''} fade-up`} key={idx}>
                <div className="sales-label">
                  <div className="sales-art"><img src={sale.art} alt="" /></div>
                  <div className="sales-meta">
                    <div className="sales-album">{sale.album}</div>
                    <div className="sales-artist">{sale.artist}</div>
                  </div>
                </div>
                <div className="sales-bar-container"><div className="sales-bar" style={{ width: sale.percent }}></div></div>
                <div className="sales-units">{sale.units}</div>
              </div>
            ))}
          </div>
        </section>

        {/* MULTIMEDIA & ARTICLES */}
        <section className="fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">No. 03</span>
              <h2 className="section-head__title">Latest <em>Coverage</em></h2>
            </div>
            <Link href="/news" className="section-head__more">All Music →</Link>
          </div>

          <div className="media-grid">
            <Link href="/live" className="live-block">
              <div className="live-bg"><img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80" alt="" /></div>
              <div className="live-content">
                <div className="live-tag">On Air Now</div>
                <h3 className="live-title">Live from the <em>Akademy</em>: The Night Show</h3>
                <div className="live-meta">
                  <span><strong>12.4K</strong> Watching</span>
                  <span>Started 14 min ago</span>
                </div>
              </div>
            </Link>

            <div className="news-list">
              {articles.slice(0, 3).map((article, idx) => (
                <div className="news-item" key={idx}>
                  <span className="news-kicker">Music</span>
                  <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`}><h4 className="news-title">{article.title}</h4></Link>
                  <div className="news-meta">By DJ Akademiks · {isMounted ? new Date(article.created_at).toLocaleDateString() : ''}</div>
                </div>
              ))}
              {articles.length === 0 && <div className="news-item"><span className="news-kicker">Music</span><h4 className="news-title">No music articles published yet.</h4></div>}
            </div>
          </div>

          <div className="review-grid">
            {articles.slice(0, 3).map((article, idx) => (
              <article className="story fade-up" key={idx}>
                <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} className="story__image">
                  <img src={article.thumbnail_url || `https://picsum.photos/seed/music-rev-${idx}/600/450`} alt="" />
                </Link>
                <div className="story__kicker">Review · Music</div>
                <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`}><h3 className="story__title">{article.title}</h3></Link>
                <div className="story__meta">By <strong>DJ Akademiks</strong> · {isMounted ? new Date(article.created_at).toLocaleDateString() : ''}</div>
              </article>
            ))}
            {articles.length === 0 && <div className="text-zinc-500 italic col-span-full text-center">No music articles published yet.</div>}
          </div>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}