"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

interface PublishedArticle { 
  title: string; source: string; thumbnail_url: string; 
  created_at: string; tags: string[]; contentSnippet?: string; 
}

export default function PublicNewsPage() {
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Data Fetching Effect
  useEffect(() => {
    setIsMounted(true);
    fetch('/api/published-articles')
      .then(res => res.json())
      .then(data => {
        const filtered = (data.articles || []).filter((a: PublishedArticle) => 
          (a.tags || []).map(t => t.toLowerCase()).includes('news')
        );
        setArticles(filtered);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch articles:", error);
        setLoading(false);
      });
  }, []);

  // 2. Animation Observer Effect (Runs AFTER loading is done)
  useEffect(() => {
    if (loading) return; // Don't run until articles are loaded

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => { 
        if (entry.isIntersecting) { 
          entry.target.classList.add('is-in'); 
          io.unobserve(entry.target); 
        } 
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    // Use requestAnimationFrame to ensure DOM is painted before querying
    const raf = requestAnimationFrame(() => {
      document.querySelectorAll('.fade-up, .line-mask').forEach(el => io.observe(el));
    });

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [loading]);

  const filteredArticles = articles.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const musicIndustry = filteredArticles.slice(0, 5);
  const filmTV = filteredArticles.slice(5, 10);
  const cultureInternet = filteredArticles.slice(10, 15);
  const liveBroadcasting = filteredArticles.slice(15, 20);

  const renderSection = (num: string, title: string, titleEm: string, sectionArticles: PublishedArticle[]) => {
    if (sectionArticles.length === 0 && !loading) return null;
    return (
      <section className="news-section fade-up">
        <div className="section-head">
          <div className="section-head__left">
            <span className="section-head__num">{num}</span>
            <h2 className="section-head__title">{title} <em>{titleEm}</em></h2>
          </div>
        </div>
        <div className="news-layout">
          {sectionArticles.length > 0 ? (
            <>
              <article className="lead-story">
                <Link href={`/article?title=${encodeURIComponent(sectionArticles[0].title)}&source=The Akademy`} className="lead-story__img">
                  <img src={sectionArticles[0].thumbnail_url || "https://images.unsplash.com/photo-1605295322749-6ef2395d4c30?auto=format&fit=crop&w=800&q=80"} alt="" />
                </Link>
                <span className="kicker">The Akademy</span>
                <Link href={`/article?title=${encodeURIComponent(sectionArticles[0].title)}&source=The Akademy`}><h3 className="lead-story__title">{sectionArticles[0].title}</h3></Link>
                <p className="lead-story__dek">{sectionArticles[0].contentSnippet || "Read the full breakdown inside The Akademy."}</p>
                <div className="story-meta">By <strong>DJ Akademiks</strong> · {isMounted ? new Date(sectionArticles[0].created_at).toLocaleDateString() : ''}</div>
              </article>

              <div className="quick-list">
                {sectionArticles.slice(1).map((article, idx) => (
                  <div className="quick-item" key={idx}>
                    <span className="quick-time">{isMounted ? new Date(article.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}</span>
                    <div className="quick-content">
                      <span className="quick-kicker">The Akademy</span>
                      <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} className="quick-title">{article.title}</Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-zinc-600 italic text-center py-20">No articles in this section yet.</div>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="News" />
      
      <style dangerouslySetInnerHTML={{__html: `
        :root { --bg: #0a0a0a; --bg-elev: #131313; --bg-input: #181818; --text: #ffffff; --text-soft: #a8a8a8; --text-mute: #6e6e6e; --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25); --line: rgba(255,255,255,0.10); --line-soft: rgba(255,255,255,0.06); --red: #d24239; --ease-quiet: cubic-bezier(.22, 1, .36, 1); }
        .shell { max-width: 1400px; margin: 0 auto; padding: 64px 32px 80px; }
        .page-head { margin-bottom: 48px; text-align: center; }
        .page-head__num { font-family: monospace; font-size: 12px; letter-spacing: 0.2em; color: var(--accent); margin-bottom: 16px; display: block; }
        .page-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: clamp(48px, 8vw, 96px); line-height: 0.9; letter-spacing: -0.03em; margin-bottom: 24px; }
        .page-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .search-bar { max-width: 680px; margin: 0 auto 16px; display: flex; align-items: center; gap: 16px; background: var(--bg-elev); border: 1px solid var(--line); padding: 16px 24px; transition: border-color .3s var(--ease-quiet); }
        .search-bar:focus-within { border-color: var(--accent); }
        .search-icon { color: var(--text-mute); font-size: 18px; }
        .search-input { flex: 1; background: transparent; border: none; color: var(--text); font-family: 'Times New Roman', serif; font-size: 20px; outline: none; }
        .search-input::placeholder { color: var(--text-mute); font-style: italic; }
        .search-kbd { font-family: monospace; font-size: 10px; color: var(--text-mute); border: 1px solid var(--line); padding: 4px 8px; }
        .trending-tags { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; font-family: monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-mute); }
        .trending-tags span { color: var(--text-soft); }
        .trending-tags a { border-bottom: 1px dotted var(--line); padding-bottom: 2px; cursor: pointer; }
        .trending-tags a:hover { color: var(--accent); border-color: var(--accent); }
        .news-section { margin-bottom: 80px; padding-bottom: 48px; border-bottom: 1px solid var(--line); }
        .news-section:last-child { border-bottom: none; }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 32px; }
        .section-head__left { display: flex; align-items: baseline; gap: 16px; }
        .section-head__num { font-family: monospace; font-size: 11px; letter-spacing: 0.2em; color: var(--accent); }
        .section-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 32px; letter-spacing: -0.01em; }
        .section-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .news-layout { display: grid; grid-template-columns: 1.2fr 1fr; gap: 48px; }
        @media (max-width: 900px) { .news-layout { grid-template-columns: 1fr; } }
        .lead-story { display: flex; flex-direction: column; gap: 16px; }
        .lead-story__img { width: 100%; aspect-ratio: 16 / 10; overflow: hidden; background: var(--bg-elev); display: block; }
        .lead-story__img img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.85) contrast(1.1); transition: transform 1.1s var(--ease-quiet); }
        .lead-story:hover .lead-story__img img { transform: scale(1.03); }
        .kicker { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent); display: inline-flex; align-items: center; gap: 8px; }
        .lead-story__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 32px; line-height: 1.1; letter-spacing: -0.01em; }
        .lead-story:hover .lead-story__title { color: var(--accent); }
        .lead-story__title em { font-style: italic; }
        .lead-story__dek { font-family: 'Times New Roman', serif; font-size: 18px; line-height: 1.5; color: var(--text-soft); }
        .story-meta { font-family: monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-mute); }
        .story-meta strong { color: var(--text-soft); font-weight: 500; }
        .quick-list { display: flex; flex-direction: column; gap: 0; }
        .quick-item { padding: 16px 0; border-bottom: 1px solid var(--line-soft); display: flex; gap: 16px; align-items: flex-start; }
        .quick-item:last-child { border-bottom: none; }
        .quick-time { font-family: monospace; font-size: 10px; color: var(--text-mute); width: 50px; flex-shrink: 0; padding-top: 4px; letter-spacing: 0.08em; }
        .quick-content { flex: 1; }
        .quick-title { font-family: 'Times New Roman', serif; font-size: 18px; font-weight: 500; line-height: 1.3; display: block; }
        .quick-item:hover .quick-title { color: var(--accent); }
        .quick-kicker { font-family: monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); margin-bottom: 4px; display: block; }
        .fade-up { opacity: 0; transform: translateY(24px); transition: opacity .9s var(--ease-quiet), transform .9s var(--ease-quiet); }
        .fade-up.is-in { opacity: 1; transform: none; }
        .line-mask { overflow: hidden; display: inline-block; }
        .line-mask__inner { display: block; transform: translateY(110%); transition: transform 1.1s var(--ease-quiet); }
        .line-mask.is-in .line-mask__inner { transform: translateY(0); }
      `}} />

      <div className="shell">
        <header className="page-head fade-up">
          <span className="page-head__num">06 / Wire</span>
          <h1 className="page-head__title line-mask"><span className="line-mask__inner">News <em>&amp; Dispatches</em></span></h1>
          
          <div className="search-bar">
            <span className="search-icon">⌕</span>
            <input type="text" className="search-input" placeholder="Search the newsroom..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <span className="search-kbd">⌘ K</span>
          </div>

          <div className="trending-tags">
            <span>Trending:</span>
            <a>Drake</a><a>Kendrick Lamar</a><a>Diddy</a><a>Legal</a><a>Industry</a>
          </div>
        </header>

        {loading ? (
          <div className="text-zinc-500 animate-pulse text-center py-20">Loading the newsroom...</div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-zinc-600 italic text-center py-20">{searchQuery ? "No articles match your search." : "No news articles published yet."}</div>
        ) : (
          <>
            {renderSection("01", "Music &", "Industry", musicIndustry)}
            {renderSection("02", "Film &", "Television", filmTV)}
            {renderSection("03", "Culture &", "Internet", cultureInternet)}
            {renderSection("04", "Live &", "Broadcasting", liveBroadcasting)}
          </>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}