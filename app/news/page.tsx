"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

interface PublishedArticle { title: string; source: string; thumbnail_url: string; created_at: string; }

export default function PublicNewsPage() {
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetch('/api/published-articles')
      .then(res => res.json())
      .then(data => { setArticles(data.articles); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="News" />
      
      <header className="page-head">
        <span className="page-head__num fade-up">02 / Culture</span>
        <h1 className="page-head__title line-mask"><span className="line-mask__inner"><em>News</em></span></h1>
        <p className="page-head__dek fade-up">The official archive of hip-hop breakdowns and industry news. Uncensored, raw, and authoritative.</p>
      </header>

      <main className="shell">
        <div className="layout">
          <section className="main-col">
            {loading ? (
              <div className="text-zinc-500 animate-pulse">Loading the archive...</div>
            ) : articles.length === 0 ? (
              <div className="text-zinc-600 italic text-center py-20">No articles have been published yet. Check back soon.</div>
            ) : (
              <>
                {/* Hero Story (Latest Article) */}
                <article className="hero-story fade-up">
                  <Link href={`/article?title=${encodeURIComponent(articles[0].title)}&source=The Akademy`} className="hero-story__img">
                    {articles[0].thumbnail_url ? (
                      <img src={articles[0].thumbnail_url} alt={articles[0].title} />
                    ) : (
                      <img src="https://images.unsplash.com/photo-1605295322749-6ef2395d4c30?auto=format&fit=crop&w=1200&q=80" alt="Default" />
                    )}
                  </Link>
                  <div className="kicker">The Akademy · Breaking</div>
                  <Link href={`/article?title=${encodeURIComponent(articles[0].title)}&source=The Akademy`}>
                    <h2 className="hero-story__title">{articles[0].title}</h2>
                  </Link>
                  <p className="hero-story__dek">An exclusive breakdown of the latest developments. Read the full report inside The Akademy.</p>
                  {isMounted && (
                    <div className="meta">
                      <span>By <strong>DJ Akademiks</strong></span>
                      <span>{new Date(articles[0].created_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </article>

                {/* Story Grid (Rest of Articles) */}
                <div className="section-head fade-up">
                  <div className="section-head__left">
                    <span className="section-head__num">01</span>
                    <h3 className="section-head__title"><em>The</em> Feed</h3>
                  </div>
                </div>

                <div className="story-grid">
                  {articles.slice(1).map((article, idx) => (
                    <article className="v-story fade-up" key={idx}>
                      <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} className="v-story__image">
                        {article.thumbnail_url ? (
                          <img src={article.thumbnail_url} alt={article.title} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700"><ExternalLink className="w-8 h-8" /></div>
                        )}
                      </Link>
                      <div className="v-story__kicker">The Akademy</div>
                      <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`}>
                        <h4 className="v-story__title">{article.title}</h4>
                      </Link>
                      {isMounted && <div className="v-story__meta">{new Date(article.created_at).toLocaleDateString()}</div>}
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>

          <aside className="sidebar fade-up">
            <div className="block">
              <div className="block__title">Trending Tags</div>
              <div className="flex flex-wrap gap-2">
                {["Drake", "Kendrick", "Diddy", "Legal", "Industry", "Hip-Hop"].map(tag => (
                  <span key={tag} className="text-xs font-bold uppercase text-red-400 border border-red-600/50 bg-red-600/10 px-2 py-1 rounded">{tag}</span>
                ))}
              </div>
            </div>

            <div className="v-newsletter">
              <div className="v-newsletter__kicker">Daily Dispatch</div>
              <h4 className="v-newsletter__title"><em>The Akademy</em> Newsletter</h4>
              <p className="v-newsletter__dek">Get the day's essential hip-hop news and industry breakdowns delivered daily.</p>
              <form className="v-form">
                <input type="email" className="v-input" placeholder="Your email address" required />
                <button type="submit" className="v-btn">Subscribe Free</button>
              </form>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}