"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteNav from "./components/SiteNav";
import SiteFooter from "./components/SiteFooter";

interface Article {
  title: string;
  link: string;
  contentSnippet: string;
  source: string;
  image: string;
  created_at: string;
  thumbnail_url: string;
  tags: string[];
}

export default function Home() {
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // 1. Data Fetching Effect (Runs once on mount)
  useEffect(() => {
    setIsMounted(true);
    fetch('/api/published-articles')
      .then(res => res.json())
      .then(data => {
        setNews(data.articles || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // 2. Animation Observer Effect (Runs AFTER loading is done)
  useEffect(() => {
    if (loading) return; // Don't run animations until articles are loaded

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    // Use requestAnimationFrame to ensure DOM is painted before querying
    const raf = requestAnimationFrame(() => {
      const elements = document.querySelectorAll('.fade-up, .line-mask');
      elements.forEach(el => io.observe(el));
      
      // Kick in the hero immediately
      const hero = document.querySelector('.hero');
      if (hero) hero.classList.add('is-in');
    });

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [loading]);

  // === TAG FILTERING LOGIC ===
  const mockNews: Article[] = [
    { title: "Drake Submits to 'Goth Baddie' Streamer", link: "#", contentSnippet: "The rapper engaged in a viral livestream moment...", source: "The Akademy", image: "https://images.unsplash.com/photo-1605295322749-6ef2395d4c30?auto=format&fit=crop&w=800&q=80", created_at: new Date().toISOString(), thumbnail_url: "https://images.unsplash.com/photo-1605295322749-6ef2395d4c30?auto=format&fit=crop&w=800&q=80", tags: ["News", "Music"] },
    { title: "Kendrick Lamar Drops Surprise Diss Track", link: "#", contentSnippet: "The pgLang founder strikes again...", source: "The Akademy", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80", created_at: new Date().toISOString(), thumbnail_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80", tags: ["News", "Music"] },
    { title: "Lil Durk's Legal Team Files Motion", link: "#", contentSnippet: "Defense attorneys aim to silence media leaks...", source: "The Akademy", image: "https://images.unsplash.com/photo-1605542339524-1b2f8b6c6c1b?auto=format&fit=crop&w=800&q=80", created_at: new Date().toISOString(), thumbnail_url: "https://images.unsplash.com/photo-1605542339524-1b2f8b6c6c1b?auto=format&fit=crop&w=800&q=80", tags: ["News", "Legal"] },
    { title: "J. Cole announces 2026 world tour", link: "#", contentSnippet: "The Dreamville founder is hitting the road...", source: "The Akademy", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80", created_at: new Date().toISOString(), thumbnail_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80", tags: ["News", "Industry"] },
  ];
  
  const allArticles = news.length > 0 ? news : mockNews;
  const usedTitles = new Set<string>();

  const getSectionArticles = (tag: string) => {
    const filtered = allArticles.filter(a =>
      (a.tags || []).map((t: string) => t.toLowerCase()).includes(tag.toLowerCase()) &&
      !usedTitles.has(a.title)
    );
    filtered.forEach(a => usedTitles.add(a.title));
    return filtered;
  };

  const sportsArticles = getSectionArticles('Sports');
  const legalArticles = getSectionArticles('Legal');
  const industryArticles = getSectionArticles('Industry');
  const musicArticles = getSectionArticles('Music');
  const newsOnlyArticles = allArticles.filter(a => !usedTitles.has(a.title));

  const heroArticle = allArticles[0] || mockNews[0];
  const gridArticles = allArticles.slice(1, 5) || mockNews.slice(1, 5);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <SiteNav activePage="Home" />

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg: #0a0a0a; --bg-elev: #131313; --bg-input: #181818;
          --text: #ffffff; --text-soft: #a8a8a8; --text-mute: #6e6e6e;
          --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25);
          --line: rgba(255,255,255,0.10); --line-soft: rgba(255,255,255,0.06);
          --red: #d24239; --blue: #6b8cff; --green: #6bbf6b;
          --ease-quiet: cubic-bezier(.22, 1, .36, 1);
          --ease-emphasis: cubic-bezier(.16, 1, .3, 1);
        }
        .shell { max-width: 1400px; margin: 0 auto; padding: 48px 32px 80px; }
        .layout { display: grid; grid-template-columns: 280px 1fr 320px; gap: 48px; align-items: start; }
        @media (max-width: 1100px) { .layout { grid-template-columns: 1fr; gap: 56px; } }
        .feed { position: sticky; top: 120px; }
        @media (max-width: 1100px) { .feed { position: static; } }
        .feed__head { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 1px solid var(--accent); padding-bottom: 12px; margin-bottom: 24px; }
        .feed__title { font-family: 'Times New Roman', serif; font-style: italic; font-weight: 500; font-size: 28px; color: var(--text); }
        .feed__live { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: var(--red); text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
        .feed__live::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--red); animation: pulse 2s var(--ease-quiet) infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .feed__list { list-style: none; }
        .feed__item { padding: 18px 0; border-bottom: 1px solid var(--line-soft); display: flex; gap: 14px; }
        .feed__item:last-child { border-bottom: none; }
        .feed__time { font-family: monospace; font-size: 10px; color: var(--text-mute); letter-spacing: 0.08em; flex-shrink: 0; width: 44px; padding-top: 2px; }
        .feed__body { flex: 1; }
        .feed__kicker { font-family: monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); display: block; margin-bottom: 4px; }
        .feed__headline { font-family: 'Times New Roman', serif; font-size: 17px; line-height: 1.3; font-weight: 500; color: var(--text); }
        .hero { margin-bottom: 64px; padding-bottom: 48px; border-bottom: 1px solid var(--line); }
        .hero__image { width: 100%; aspect-ratio: 16 / 9; overflow: hidden; margin-bottom: 28px; background: #1a1a1a; display: block; }
        .hero__image img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.92) contrast(1.05); transition: transform 1.2s var(--ease-quiet); }
        .hero:hover .hero__image img { transform: scale(1.02); }
        .hero__kicker { font-family: monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); display: inline-flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .hero__kicker::after { content: ''; width: 32px; height: 1px; background: var(--accent-soft); }
        .hero__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: clamp(36px, 5vw, 56px); line-height: 1.05; letter-spacing: -0.015em; margin-bottom: 20px; max-width: 900px; }
        .hero__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .hero__dek { font-family: 'Times New Roman', serif; font-size: 20px; line-height: 1.5; color: var(--text-soft); max-width: 720px; margin-bottom: 24px; }
        .hero__meta { display: flex; gap: 24px; align-items: center; font-family: monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-mute); }
        .story-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px 32px; margin-bottom: 80px; }
        @media (max-width: 700px) { .story-grid { grid-template-columns: 1fr; } }
        .story { display: flex; flex-direction: column; gap: 14px; }
        .story__image { width: 100%; aspect-ratio: 4 / 3; overflow: hidden; background: #1a1a1a; display: block; }
        .story__image img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.9) contrast(1.05); transition: transform 1.1s var(--ease-quiet); }
        .story:hover .story__image img { transform: scale(1.03); }
        .story__kicker { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-top: 4px; }
        .story__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 24px; line-height: 1.2; }
        .story:hover .story__title { color: var(--accent); }
        .story__dek { font-family: 'Times New Roman', serif; font-size: 16px; line-height: 1.45; color: var(--text-soft); }
        .story__meta { font-family: monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-mute); }
        .sidebar > * + * { margin-top: 48px; }
        .block { border-top: 1px solid var(--accent); padding-top: 20px; }
        .block__title { font-family: 'Times New Roman', serif; font-weight: 700; font-style: italic; font-size: 22px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; }
        .block__title::after { content: '→'; font-style: normal; color: var(--accent); font-family: sans-serif; }
        .popular { list-style: none; counter-reset: pop; }
        .popular__item { counter-increment: pop; display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--line-soft); }
        .popular__item:last-child { border-bottom: none; }
        .popular__num { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 32px; line-height: 1; color: var(--accent); width: 32px; flex-shrink: 0; }
        .popular__num::before { content: counter(pop, decimal-leading-zero); }
        .popular__title { font-family: 'Times New Roman', serif; font-size: 16px; line-height: 1.3; font-weight: 500; display: block; }
        .popular__meta { font-family: monospace; font-size: 10px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; margin-top: 6px; }
        .newsletter { background: var(--bg-elev); padding: 28px 24px; border-left: 2px solid var(--accent); }
        .newsletter__kicker { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 10px; }
        .newsletter__title { font-family: 'Times New Roman', serif; font-size: 22px; font-weight: 700; line-height: 1.2; margin-bottom: 12px; }
        .newsletter__title em { font-style: italic; }
        .newsletter__dek { font-size: 13px; color: var(--text-soft); margin-bottom: 16px; line-height: 1.5; }
        .newsletter__form { display: flex; flex-direction: column; gap: 10px; }
        .newsletter__input { background: transparent; border: 1px solid var(--line); color: var(--text); padding: 12px 14px; font-family: 'Inter', sans-serif; font-size: 13px; transition: border-color .3s; }
        .newsletter__input:focus { outline: none; border-color: var(--accent); }
        .newsletter__btn { background: var(--accent); color: var(--bg); border: none; padding: 12px; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; cursor: pointer; transition: background .3s; }
        .newsletter__btn:hover { background: #b91c1c; color: #fff; }
        .section-head { max-width: 1400px; margin: 0 auto; padding: 0 32px 32px; display: flex; align-items: baseline; justify-content: space-between; border-bottom: 1px solid var(--line); margin-bottom: 48px; }
        .section-head__left { display: flex; align-items: baseline; gap: 20px; }
        .section-head__num { font-family: monospace; font-size: 11px; letter-spacing: 0.2em; color: var(--accent); }
        .section-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: clamp(36px, 5vw, 56px); letter-spacing: -0.02em; line-height: 1; }
        .section-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .section-head__more { font-family: monospace; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--text-mute); }
        .tv-section { padding: 80px 0; border-top: 1px solid var(--line); }
        .tv-grid { max-width: 1400px; margin: 0 auto; padding: 0 32px; display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: 40px; }
        @media (max-width: 900px) { .tv-grid { grid-template-columns: 1fr; } }
        .tv-feature .story__image { aspect-ratio: 16 / 10; } .tv-feature .story__title { font-size: 32px; } .tv-feature .story__dek { font-size: 18px; }
        .movies-section { padding: 80px 0; border-top: 1px solid var(--line); background: linear-gradient(180deg, var(--bg) 0%, #0c0e14 100%); }
        .movies-section .section-head__title { color: #6b8cff; } .movies-section .section-head__num { color: #6b8cff; } .movies-section .story__kicker { color: #6b8cff; }
        .movies-grid { max-width: 1400px; margin: 0 auto; padding: 0 32px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
        @media (max-width: 1100px) { .movies-grid { grid-template-columns: repeat(2, 1fr); } } @media (max-width: 600px) { .movies-grid { grid-template-columns: 1fr; } }
        .ad-slot { max-width: 1400px; margin: 64px auto; padding: 0 32px; }
        .ad-slot__inner { border: 1px solid var(--line); background: var(--bg-elev); padding: 24px; display: flex; align-items: center; justify-content: space-between; gap: 32px; }
        .ad-slot__label { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--text-mute); text-transform: uppercase; }
        .ad-slot__content { font-family: 'Times New Roman', serif; font-style: italic; font-size: 20px; color: var(--text-soft); flex: 1; }
        .ad-slot__cta { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); border: 1px solid var(--accent); padding: 10px 20px; transition: all .3s; }
        .ad-slot__cta:hover { background: var(--accent); color: var(--bg); }
        .music-section { padding: 80px 0; border-top: 1px solid var(--line); }
        .music-grid { max-width: 1400px; margin: 0 auto; padding: 0 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
        @media (max-width: 800px) { .music-grid { grid-template-columns: 1fr; } }
        .music-main .story__image { aspect-ratio: 4 / 3; } .music-main .story__title { font-size: 30px; }
        .music-list { display: flex; flex-direction: column; gap: 24px; }
        .music-list .story { display: grid; grid-template-columns: 120px 1fr; gap: 18px; padding-bottom: 24px; border-bottom: 1px solid var(--line-soft); }
        .music-list .story__image { aspect-ratio: 1 / 1; } .music-list .story__title { font-size: 18px; } .music-list .story__dek { font-size: 14px; }
        .games-section { padding: 80px 0; border-top: 1px solid var(--line); background: var(--bg-elev); }
        .games-grid { max-width: 1400px; margin: 0 auto; padding: 0 32px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 900px) { .games-grid { grid-template-columns: repeat(2, 1fr); } } @media (max-width: 500px) { .games-grid { grid-template-columns: 1fr; } }
        .game { background: var(--bg); border: 1px solid var(--line); padding: 24px; transition: border-color .4s var(--ease-quiet), transform .4s var(--ease-quiet); position: relative; overflow: hidden; display: block; }
        .game::before { content: ''; position: absolute; top: 0; left: 0; width: 0; height: 2px; background: var(--accent); transition: width .5s var(--ease-quiet); }
        .game:hover { border-color: var(--accent-soft); transform: translateY(-4px); } .game:hover::before { width: 100%; }
        .game__num { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--text-mute); margin-bottom: 16px; }
        .game__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 26px; line-height: 1.1; margin-bottom: 12px; }
        .game__title em { font-style: italic; color: var(--accent); }
        .game__dek { font-size: 13px; color: var(--text-soft); line-height: 1.5; margin-bottom: 16px; }
        .game__cta { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); }
        .fade-up { opacity: 0; transform: translateY(28px); transition: opacity 1s var(--ease-quiet), transform 1s var(--ease-quiet); }
        .fade-up.is-in { opacity: 1; transform: none; }
        .hero [data-anim] { opacity: 0; transform: translateY(24px); transition: opacity .9s var(--ease-quiet), transform .9s var(--ease-quiet); }
        .hero.is-in [data-anim] { opacity: 1; transform: none; }
        .hero [data-anim="1"] { transition-delay: .1s; } .hero [data-anim="2"] { transition-delay: .25s; } .hero [data-anim="3"] { transition-delay: .4s; } .hero [data-anim="4"] { transition-delay: .55s; } .hero [data-anim="5"] { transition-delay: .7s; }
      `}} />

      <main className="shell">
        <div className="layout">
          
          {/* LEFT: THE FEED */}
          <aside className="feed fade-up">
            <div className="feed__head">
              <div className="feed__title">The Feed</div>
              <div className="feed__live">Live</div>
            </div>
            <ul className="feed__list">
              {allArticles.slice(0, 8).map((article, idx) => (
                <li className="feed__item" key={idx}>
                  <span className="feed__time">{isMounted ? new Date(article.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}</span>
                  <div className="feed__body">
                    <span className="feed__kicker">{article.source}</span>
                    <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} className="feed__headline">{article.title}</Link>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          {/* CENTER: HERO + GRID */}
          <section className="center">
            <article className="hero">
              <Link href={`/article?title=${encodeURIComponent(heroArticle.title)}&source=The Akademy`} className="hero__image" data-anim="1">
                <img src={heroArticle.thumbnail_url || heroArticle.image || "https://images.unsplash.com/photo-1605295322749-6ef2395d4c30?auto=format&fit=crop&w=1200&q=80"} alt="" />
              </Link>
              <div className="hero__kicker" data-anim="2">Cover Story · The Akademy</div>
              <h1 className="hero__title" data-anim="3">
                {heroArticle.title}
              </h1>
              <p className="hero__dek" data-anim="4">
                {heroArticle.contentSnippet || "Analyzing the metrics, the legal cases, and the strategies behind the top artists."}
              </p>
              <div className="hero__meta" data-anim="5">
                <span>By <strong>DJ Akademiks</strong></span>
                <span>5 min read</span>
              </div>
            </article>

            <div className="story-grid">
              {gridArticles.map((article, idx) => (
                <article className="story fade-up" key={idx}>
                  <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} className="story__image">
                    <img src={article.thumbnail_url || article.image || `https://picsum.photos/seed/akademics-${idx}/600/450`} alt="" />
                  </Link>
                  <div className="story__kicker">The Akademy</div>
                  <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`}><h3 className="story__title">{article.title}</h3></Link>
                  <div className="story__meta">By <strong>DJ Akademiks</strong></div>
                </article>
              ))}
            </div>
          </section>

          {/* RIGHT: SIDEBAR */}
          <aside className="sidebar fade-up">
            <div className="block">
              <div className="block__title">Most Popular</div>
              <ol className="popular">
                {allArticles.slice(0, 5).map((article, idx) => (
                  <li className="popular__item" key={idx}>
                    <div className="popular__num"></div>
                    <div>
                      <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} className="popular__title">{article.title}</Link>
                      <div className="popular__meta">News · {isMounted ? new Date(article.created_at).toLocaleDateString() : ''}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="newsletter">
              <div className="newsletter__kicker">Newsletter</div>
              <h4 className="newsletter__title">The <em>Akademy</em> Newsletter, Delivered Daily</h4>
              <p className="newsletter__dek">The day's essential hip-hop news, industry breakdowns, and chart analytics — in your inbox by 5pm.</p>
              <form className="newsletter__form" onSubmit={(e) => { e.preventDefault(); (e.target as HTMLFormElement).querySelector('button')!.textContent = 'Subscribed ✓'; }}>
                <input type="email" className="newsletter__input" placeholder="Your email address" required />
                <button type="submit" className="newsletter__btn">Subscribe Free</button>
              </form>
            </div>
          </aside>
        </div>
      </main>

      {/* AD SLOT 1 */}
      <div className="ad-slot fade-up">
        <div className="ad-slot__inner">
          <div>
            <div className="ad-slot__label">— Sponsored Slot —</div>
            <p className="ad-slot__content">Reach 5M+ hip-hop fans daily. Direct sponsorships, no middlemen.</p>
          </div>
          <a href="#" className="ad-slot__cta">View Media Kit</a>
        </div>
      </div>

      {/* LIVE SECTION (TV Layout) */}
      <section className="tv-section">
        <div className="section-head fade-up">
          <div className="section-head__left">
            <span className="section-head__num">01 / Stream</span>
            <h2 className="section-head__title"><em>Live</em></h2>
          </div>
          <Link href="/live" className="section-head__more">All Live Coverage →</Link>
        </div>
        <div className="tv-grid">
          <article className="story tv-feature fade-up">
            <div className="story__image"><img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80" alt="" /></div>
            <div className="story__kicker">Live Broadcast · Night Show</div>
            <h3 className="story__title">The Akademiks Night Show: Drake Beef & Industry News</h3>
            <p className="story__dek">Breaking down the latest in hip-hop, culture, and industry moves. Unfiltered and uncensored.</p>
            <div className="story__meta">By <strong>DJ Akademiks</strong> · 2 hrs ago</div>
          </article>
          <article className="story fade-up">
            <div className="story__image"><img src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8bXVzaWMlMjBwZXJmb3JtYW5jZXxlbnwwfHwwfHx8MA%3D%3D" alt="" /></div>
            <div className="story__kicker">VOD · Diddy</div>
            <h3 className="story__title">Late Night Hour: Diddy Indictment Breakdown</h3>
            <div className="story__meta">By <strong>DJ Akademiks</strong></div>
          </article>
          <article className="story fade-up">
            <div className="story__image"><img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80" alt="" /></div>
            <div className="story__kicker">VOD · Charts</div>
            <h3 className="story__title">Morning Coffee: J Cole Tour & Chart Predictions</h3>
            <div className="story__meta">By <strong>DJ Akademiks</strong></div>
          </article>
        </div>
      </section>

      {/* NEWS SECTION (Movies Layout) */}
      <section className="movies-section">
        <div className="section-head fade-up">
          <div className="section-head__left">
            <span className="section-head__num">02 / Culture</span>
            <h2 className="section-head__title"><em>News</em></h2>
          </div>
          <Link href="/news" className="section-head__more">All News Coverage →</Link>
        </div>
        <div className="movies-grid">
          {newsOnlyArticles.slice(0, 4).map((article, idx) => (
            <article className="story fade-up" key={idx}>
              <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} className="story__image"><img src={article.thumbnail_url || article.image || `https://picsum.photos/seed/ak-news-${idx}/600/450`} alt="" /></Link>
              <div className="story__kicker">The Akademy</div>
              <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`}><h3 className="story__title">{article.title}</h3></Link>
              <div className="story__meta">By <strong>DJ Akademiks</strong></div>
            </article>
          ))}
          {newsOnlyArticles.length === 0 && (
            <div className="text-zinc-500 italic col-span-full p-8 text-center">All articles have been categorized into specific sections.</div>
          )}
        </div>
      </section>

      {/* MUSIC SECTION (ChartDemiks) */}
      <section className="music-section">
        <div className="section-head fade-up">
          <div className="section-head__left">
            <span className="section-head__num">03 / Sound</span>
            <h2 className="section-head__title"><em>Music</em></h2>
          </div>
          <Link href="/charts" className="section-head__more">All Music Coverage →</Link>
        </div>
        <div className="music-grid">
          {musicArticles.length > 0 ? (
            <>
              <article className="story music-main fade-up">
                <Link href={`/article?title=${encodeURIComponent(musicArticles[0].title)}&source=The Akademy`} className="story__image"><img src={musicArticles[0].thumbnail_url || musicArticles[0].image || "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&w=800&q=80"} alt="" /></Link>
                <div className="story__kicker">Music · The Akademy</div>
                <Link href={`/article?title=${encodeURIComponent(musicArticles[0].title)}&source=The Akademy`}><h3 className="story__title">{musicArticles[0].title}</h3></Link>
                <p className="story__dek">{musicArticles[0].contentSnippet || "Read the full breakdown."}</p>
                <div className="story__meta">By <strong>DJ Akademiks</strong></div>
              </article>

              <div className="music-list">
                {musicArticles.slice(1, 5).map((article, idx) => (
                  <article className="story fade-up" key={idx}>
                    <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} className="story__image"><img src={article.thumbnail_url || article.image || `https://picsum.photos/seed/music-${idx}/300/300`} alt="" /></Link>
                    <div>
                      <div className="story__kicker">Music</div>
                      <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`}><h3 className="story__title">{article.title}</h3></Link>
                      <div className="story__meta">By <strong>DJ Akademiks</strong></div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="text-zinc-500 italic p-8 text-center col-span-full">No music articles published yet.</div>
          )}
        </div>
      </section>

      {/* INDUSTRY SECTION (TV Layout) */}
      <section className="tv-section" style={{ background: 'var(--bg-elev)' }}>
        <div className="section-head fade-up">
          <div className="section-head__left">
            <span className="section-head__num">04 / Business</span>
            <h2 className="section-head__title"><em>Industry</em></h2>
          </div>
          <Link href="/industry" className="section-head__more">All Industry Coverage →</Link>
        </div>
        <div className="tv-grid">
          {industryArticles.slice(0, 3).map((article, idx) => (
            <article className={`story ${idx === 0 ? 'tv-feature' : ''} fade-up`} key={idx}>
              <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} className="story__image"><img src={article.thumbnail_url || article.image || `https://picsum.photos/seed/ind-${idx}/600/450`} alt="" /></Link>
              <div className="story__kicker">Industry</div>
              <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`}><h3 className="story__title">{article.title}</h3></Link>
              {idx === 0 && <p className="story__dek">{article.contentSnippet || "Read the full breakdown."}</p>}
              <div className="story__meta">By <strong>DJ Akademiks</strong></div>
            </article>
          ))}
          {industryArticles.length === 0 && <div className="text-zinc-500 italic p-8 text-center col-span-full">No industry articles published yet.</div>}
        </div>
      </section>

      {/* AD SLOT 2 */}
      <div className="ad-slot fade-up">
        <div className="ad-slot__inner">
          <div>
            <div className="ad-slot__label">— Sponsored Slot —</div>
            <p className="ad-slot__content">Premium ad inventory. Direct sponsorships, no middlemen.</p>
          </div>
          <a href="#" className="ad-slot__cta">View Media Kit</a>
        </div>
      </div>

      {/* LEGAL SECTION (Music Layout) */}
      <section className="music-section">
        <div className="section-head fade-up">
          <div className="section-head__left">
            <span className="section-head__num">05 / Court</span>
            <h2 className="section-head__title"><em>Legal</em></h2>
          </div>
          <Link href="/legal" className="section-head__more">All Legal Coverage →</Link>
        </div>
        <div className="music-grid">
          {legalArticles.length > 0 ? (
            <>
              <article className="story music-main fade-up">
                <Link href={`/article?title=${encodeURIComponent(legalArticles[0].title)}&source=The Akademy`} className="story__image"><img src={legalArticles[0].thumbnail_url || legalArticles[0].image || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80"} alt="" /></Link>
                <div className="story__kicker">Legal · The Akademy</div>
                <Link href={`/article?title=${encodeURIComponent(legalArticles[0].title)}&source=The Akademy`}><h3 className="story__title">{legalArticles[0].title}</h3></Link>
                <p className="story__dek">{legalArticles[0].contentSnippet || "Read the full legal breakdown."}</p>
                <div className="story__meta">By <strong>DJ Akademiks</strong></div>
              </article>

              <div className="music-list">
                {legalArticles.slice(1, 4).map((article, idx) => (
                  <article className="story fade-up" key={idx}>
                    <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} className="story__image"><img src={article.thumbnail_url || article.image || `https://picsum.photos/seed/legal-${idx}/300/300`} alt="" /></Link>
                    <div>
                      <div className="story__kicker">Legal</div>
                      <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`}><h3 className="story__title">{article.title}</h3></Link>
                      <div className="story__meta">By <strong>DJ Akademiks</strong></div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="text-zinc-500 italic p-8 text-center col-span-full">No legal articles published yet.</div>
          )}
        </div>
      </section>

      {/* SPORTS SECTION (TV Layout) */}
      <section className="tv-section" style={{ background: 'var(--bg-elev)' }}>
        <div className="section-head fade-up">
          <div className="section-head__left">
            <span className="section-head__num">06 / Culture</span>
            <h2 className="section-head__title"><em>Sports</em></h2>
          </div>
          <Link href="/sports" className="section-head__more">All Sports Coverage →</Link>
        </div>
        <div className="tv-grid">
          {sportsArticles.slice(0, 3).map((article, idx) => (
            <article className={`story ${idx === 0 ? 'tv-feature' : ''} fade-up`} key={idx}>
              <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} className="story__image"><img src={article.thumbnail_url || article.image || `https://picsum.photos/seed/sports-${idx}/600/450`} alt="" /></Link>
              <div className="story__kicker">Sports</div>
              <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`}><h3 className="story__title">{article.title}</h3></Link>
              {idx === 0 && <p className="story__dek">{article.contentSnippet || "Read the full breakdown."}</p>}
              <div className="story__meta">By <strong>DJ Akademiks</strong></div>
            </article>
          ))}
          {sportsArticles.length === 0 && <div className="text-zinc-500 italic p-8 text-center col-span-full">No sports articles published yet.</div>}
        </div>
      </section>

      {/* TOOLS SECTION (Games Layout) */}
      <section className="games-section">
        <div className="section-head fade-up">
          <div className="section-head__left">
            <span className="section-head__num">07 / Interactive</span>
            <h2 className="section-head__title"><em>Tools & Features</em></h2>
          </div>
          <a href="#" className="section-head__more">All Tools →</a>
        </div>
        <div className="games-grid">
          <Link href="/industry" className="game fade-up">
            <div className="game__num">Industry · Tool</div>
            <h3 className="game__title">Royalty <em>Calculator</em></h3>
            <p className="game__dek">Estimate streaming revenue based on Spotify metrics. Input your monthly streams and see the payout instantly.</p>
            <div className="game__cta">Calculate Now →</div>
          </Link>
          <Link href="/sports" className="game fade-up">
            <div className="game__num">Sports · AI</div>
            <h3 className="game__title">The <em>Almanac</em></h3>
            <p className="game__dek">Enter a prop bet to generate a data-driven scout report. Injury reports, pace data, and historical matchups.</p>
            <div className="game__cta">Generate Report →</div>
          </Link>
          <Link href="/legal" className="game fade-up">
            <div className="game__num">Legal · Tracker</div>
            <h3 className="game__title">Active <em>Cases</em></h3>
            <p className="game__dek">Tracking the legal landscape of the industry. Indictments, plea deals, and verdicts explained in plain English.</p>
            <div className="game__cta">View Blotter →</div>
          </Link>
          <Link href="/sports" className="game fade-up">
            <div className="game__num">Sports · Community</div>
            <h3 className="game__title">The <em>Locks</em> Board</h3>
            <p className="game__dek">A community-driven prediction board. Lock in your picks for the night and track your win/loss record over the season.</p>
            <div className="game__cta">View Leaderboard →</div>
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}