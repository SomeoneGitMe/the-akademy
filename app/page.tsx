"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Radio, Users, MessageSquare, Calculator, Gavel, Brain, TrendingUp, Star, ExternalLink } from "lucide-react";
import SiteNav from "./components/SiteNav";
import SiteFooter from "./components/SiteFooter";

interface Article { title: string; link: string; contentSnippet: string; source: string; image: string; created_at: string; thumbnail_url: string; }
interface ChartItem { artist: string; song: string; image: string; rank: number; streams: number; percent: number; }

export default function Home() {
  const [news, setNews] = useState<Article[]>([]);
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetch('/api/published-articles').then(res => res.json()).then(data => setNews(data.articles || []) ).catch(err => console.error(err));
    fetch('/api/charts').then(res => res.json()).then(data => { setCharts(data.charts || []); setLoading(false); }).catch(err => { console.error(err); setLoading(false); });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    const grids = document.querySelectorAll('.story-grid');
    grids.forEach(grid => {
      const items = grid.querySelectorAll('.fade-up');
      items.forEach((item, index) => { (item as HTMLElement).style.transitionDelay = (index * 0.08) + 's'; });
    });

    const elements = document.querySelectorAll('.fade-up, .line-mask');
    elements.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [loading, news]);

  // Fallback mock articles if none are published yet
  const displayNews = news.length > 0 ? news : [
    { title: "Drake Submits to 'Goth Baddie' Streamer", link: "#", contentSnippet: "The rapper engaged in a viral livestream moment...", source: "The Akademy", image: "https://images.unsplash.com/photo-1605295322749-6ef2395d4c30?auto=format&fit=crop&w=800&q=80", created_at: new Date().toISOString(), thumbnail_url: "https://images.unsplash.com/photo-1605295322749-6ef2395d4c30?auto=format&fit=crop&w=800&q=80" },
    { title: "Kendrick Lamar Drops Surprise Diss Track", link: "#", contentSnippet: "The pgLang founder strikes again...", source: "The Akademy", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80", created_at: new Date().toISOString(), thumbnail_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80" },
    { title: "Lil Durk's Legal Team Files Motion", link: "#", contentSnippet: "Defense attorneys aim to silence media leaks...", source: "The Akademy", image: "https://images.unsplash.com/photo-1605542339524-1b2f8b6c6c1b?auto=format&fit=crop&w=800&q=80", created_at: new Date().toISOString(), thumbnail_url: "https://images.unsplash.com/photo-1605542339524-1b2f8b6c6c1b?auto=format&fit=crop&w=800&q=80" },
    { title: "J. Cole announces 2026 world tour", link: "#", contentSnippet: "The Dreamville founder is hitting the road...", source: "The Akademy", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80", created_at: new Date().toISOString(), thumbnail_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Home" />
      
      {/* HERO SECTION */}
      <main className="shell">
        <article className="hero-story fade-up">
          <Link href={`/article?title=${encodeURIComponent(displayNews[0]?.title || "Welcome")}&source=The Akademy`} className="hero-story__img">
            <img src={displayNews[0]?.thumbnail_url || "https://images.unsplash.com/photo-1605295322749-6ef2395d4c30?auto=format&fit=crop&w=1200&q=80"} alt="" />
          </Link>
          <div className="kicker">The Feed · Cover Story</div>
          <Link href={`/article?title=${encodeURIComponent(displayNews[0]?.title || "Welcome")}&source=The Akademy`}>
            <h2 className="hero-story__title">{displayNews[0]?.title || "The State of Hip-Hop: A Complete Industry Breakdown"}</h2>
          </Link>
          <p className="hero-story__dek">{displayNews[0]?.contentSnippet || "Analyzing the metrics, the legal cases, and the strategies behind the top artists."}</p>
          <div className="meta">
            <span>By <strong>DJ Akademiks</strong></span>
            {isMounted && <span>{new Date(displayNews[0]?.created_at || Date.now()).toLocaleDateString()}</span>}
          </div>
        </article>

        {/* CHARTDEMIKS SECTION (Vulture Music Layout Clone) */}
        <div className="layout mb-24 fade-up" style={{ gridTemplateColumns: '1fr 340px', gap: '64px' }}>
          <section className="main-col">
            <div className="section-head">
              <div className="section-head__left">
                <span className="section-head__num">01</span>
                <h3 className="section-head__title"><em>Chart</em>Demiks</h3>
              </div>
              <Link href="/charts" className="text-xs font-bold uppercase tracking-wider text-red-500 hover:underline flex items-center gap-1">View Full Chart <ExternalLink className="w-3 h-3" /></Link>
            </div>
            <ul className="tracks">
              {charts.slice(0, 5).map((item, idx) => (
                <li key={idx} className="track">
                  <span className="track__rank">{item.rank}</span>
                  <div className="track__play">▶</div>
                  <div className="track__info">
                    <div className="track__title">{item.song}</div>
                    <div className="track__artist">{item.artist}</div>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">{(item.streams / 1000000).toFixed(1)}M</span>
                </li>
              ))}
            </ul>
          </section>
          <aside className="sidebar">
            <div className="block">
              <div className="block__title">Dominance Index</div>
              <div className="space-y-4">
                {charts.slice(0, 3).map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-zinc-200">{item.artist}</span>
                      <span className="text-red-500 font-mono">{item.percent}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5">
                      <motion.div className="bg-red-600 h-1.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${item.percent}%` }} transition={{ duration: 1, delay: idx * 0.2 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* SPONSOR SLOT 1 */}
        <div className="bg-zinc-900/50 border border-dashed border-zinc-700 rounded-lg p-8 text-center my-16 fade-up">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Sponsor Slot</p>
          <h4 className="text-2xl font-bold text-zinc-400" style={{ fontFamily: 'Times New Roman, serif' }}>Your Brand Here</h4>
          <p className="text-sm text-zinc-500 mt-1">Reach 5M+ hip-hop fans daily.</p>
        </div>

        {/* LIVE SECTION (Unique Layout) */}
        <div className="section-head fade-up">
          <div className="section-head__left">
            <span className="section-head__num">02</span>
            <h3 className="section-head__title"><em>Akademy</em> Live</h3>
          </div>
          <Link href="/live" className="text-xs font-bold uppercase tracking-wider text-red-500 hover:underline flex items-center gap-1">Go to Live <ExternalLink className="w-3 h-3" /></Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24 fade-up">
          <div className="lg:col-span-2 space-y-4">
            <div className="w-full aspect-video bg-black rounded-lg border border-zinc-800 overflow-hidden flex items-center justify-center relative">
              <Radio className="w-12 h-12 text-red-600 animate-pulse" />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="bg-red-600 text-white text-[10px] font-bold uppercase px-2 py-1 rounded flex items-center gap-1"><span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> Live</span>
                <span className="bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><Users className="w-3 h-3" /> 12,453</span>
              </div>
            </div>
            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-zinc-800 pb-4">
              <h4 className="text-xl font-bold text-white" style={{ fontFamily: 'Times New Roman, serif' }}>The Akademiks Night Show</h4>
              <div className="flex gap-2">
                <button className="btn-premium"><Star className="w-3.5 h-3.5" /> Subscribe</button>
                <button className="btn-premium btn-primary">Donate</button>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 h-[300px] flex flex-col">
            <h5 className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Live Chat</h5>
            <div className="flex-1 space-y-2 text-xs text-zinc-300 overflow-hidden">
              <p><span className="font-bold text-blue-400">@Fan1</span> Yo Ak, what do you think about the new Drake drop?</p>
              <p><span className="font-bold text-green-400">@Fan2</span> Kendrick cleared him easily ngl.</p>
              <p><span className="font-bold text-red-400">@Akademiks</span> We are going live in 5 mins to break it all down.</p>
            </div>
          </div>
        </div>

        {/* NEWS GRID (Top 5 Articles) */}
        <div className="section-head fade-up">
          <div className="section-head__left">
            <span className="section-head__num">03</span>
            <h3 className="section-head__title"><em>The</em> Feed</h3>
          </div>
          <Link href="/news" className="text-xs font-bold uppercase tracking-wider text-red-500 hover:underline flex items-center gap-1">View All News <ExternalLink className="w-3 h-3" /></Link>
        </div>
        <div className="story-grid mb-24">
          {displayNews.slice(1, 5).map((article, idx) => (
            <article className="v-story fade-up" key={idx}>
              <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} className="v-story__image">
                <img src={article.thumbnail_url || article.image || `https://picsum.photos/seed/akademics-${idx}/600/450`} alt="" />
              </Link>
              <div className="v-story__kicker">The Akademy</div>
              <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`}><h4 className="v-story__title">{article.title}</h4></Link>
              {isMounted && <div className="v-story__meta">{new Date(article.created_at).toLocaleDateString()}</div>}
            </article>
          ))}
        </div>

        {/* SPONSOR SLOT 2 */}
        <div className="bg-zinc-900/50 border border-dashed border-zinc-700 rounded-lg p-8 text-center my-16 fade-up">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Sponsor Slot</p>
          <h4 className="text-2xl font-bold text-zinc-400" style={{ fontFamily: 'Times New Roman, serif' }}>Premium Ad Inventory</h4>
          <p className="text-sm text-zinc-500 mt-1">Direct sponsorships, no middlemen.</p>
        </div>

        {/* INDUSTRY SECTION (Unique Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24 fade-up">
          <div>
            <div className="section-head">
              <div className="section-head__left">
                <span className="section-head__num">04</span>
                <h3 className="section-head__title"><em>Industry</em></h3>
              </div>
              <Link href="/industry" className="text-xs font-bold uppercase tracking-wider text-red-500 hover:underline flex items-center gap-1">Enter Boardroom <ExternalLink className="w-3 h-3" /></Link>
            </div>
            <div className="v-newsletter">
              <div className="v-newsletter__kicker">Interactive Tool</div>
              <h4 className="v-newsletter__title"><em>Royalty</em> Calculator</h4>
              <p className="v-newsletter__dek">Estimate streaming revenue based on Spotify metrics.</p>
              <div className="mt-4 pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Sample Payout (1M Streams)</p>
                <p className="text-2xl font-black text-green-500" style={{ fontFamily: 'Times New Roman, serif' }}>$4,000.00</p>
              </div>
            </div>
          </div>
          <div className="pt-12">
            <h4 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Times New Roman, serif' }}>The Bag: Contract Breakdowns</h4>
            <ul className="space-y-4 text-sm text-zinc-300">
              <li className="border-b border-zinc-800/50 pb-2"><strong className="text-white">Drake's $400M Universal Deal</strong><br />Multi-album advance + ownership clauses.</li>
              <li className="border-b border-zinc-800/50 pb-2"><strong className="text-white">J. Cole's Dreamville Structure</strong><br />Joint venture with Interscope, 50/50 split.</li>
              <li><strong className="text-white">Russ Owns 100% of Masters</strong><br />Uses TuneCore, keeps $0.80 per dollar.</li>
            </ul>
          </div>
        </div>

        {/* LEGAL SECTION (Unique Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24 fade-up">
          <div className="order-2 lg:order-1 pt-12">
            <h4 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Times New Roman, serif' }}>Indictment Breakdowns</h4>
            <ul className="space-y-4 text-sm text-zinc-300">
              <li className="border-b border-zinc-800/50 pb-2"><strong className="text-white">Understanding RICO in Hip-Hop</strong><br />How feds target labels as enterprises.</li>
              <li className="border-b border-zinc-800/50 pb-2"><strong className="text-white">Young Thug's Sentencing Parameters</strong><br />Time faced vs. time given.</li>
              <li><strong className="text-white">Lil Durk's Motion to Silence Leaks</strong><br />Why defense attorneys file them.</li>
            </ul>
          </div>
          <div className="order-1 lg:order-2">
            <div className="section-head">
              <div className="section-head__left">
                <span className="section-head__num">05</span>
                <h3 className="section-head__title"><em>Legal</em></h3>
              </div>
              <Link href="/legal" className="text-xs font-bold uppercase tracking-wider text-red-500 hover:underline flex items-center gap-1">View Blotter <ExternalLink className="w-3 h-3" /></Link>
            </div>
            <div className="block">
              <div className="block__title">Active Cases Tracker</div>
              <ul className="space-y-4">
                <li className="border-b border-zinc-800/50 pb-3">
                  <p className="font-bold text-white text-lg" style={{ fontFamily: 'Times New Roman, serif' }}>Diddy</p>
                  <p className="text-xs text-red-500 font-bold uppercase mb-1">Federal Indictment</p>
                  <p className="text-xs text-zinc-500">Next Date: Oct 12, 2026</p>
                </li>
                <li className="border-b border-zinc-800/50 pb-3">
                  <p className="font-bold text-white text-lg" style={{ fontFamily: 'Times New Roman, serif' }}>Lil Durk</p>
                  <p className="text-xs text-red-500 font-bold uppercase mb-1">Pre-Trial Motions</p>
                  <p className="text-xs text-zinc-500">Next Date: Sep 05, 2026</p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* SPORTS SECTION (Unique Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24 fade-up">
          <div>
            <div className="section-head">
              <div className="section-head__left">
                <span className="section-head__num">06</span>
                <h3 className="section-head__title"><em>Sports</em></h3>
              </div>
              <Link href="/sports" className="text-xs font-bold uppercase tracking-wider text-red-500 hover:underline flex items-center gap-1">View Sports <ExternalLink className="w-3 h-3" /></Link>
            </div>
            <div className="block">
              <div className="block__title">The "Locks" Leaderboard</div>
              <ul className="space-y-3">
                <li className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
                  <div><p className="font-bold text-white">@AkademiksGold</p><p className="text-xs text-zinc-500">142 - 38</p></div>
                  <span className="text-green-500 font-mono text-sm">78.9%</span>
                </li>
                <li className="flex justify-between items-center border-b border-zinc-800/50 pb-2">
                  <div><p className="font-bold text-white">@VibeChecker</p><p className="text-xs text-zinc-500">130 - 45</p></div>
                  <span className="text-green-500 font-mono text-sm">74.3%</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-12">
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Times New Roman, serif' }}><Brain className="w-5 h-5 text-red-600" /> The Almanac (AI Insight)</h4>
            <div className="v-newsletter">
              <p className="v-newsletter__dek">Enter a prop bet to generate a data-driven scout report.</p>
              <div className="v-form">
                <input type="text" className="v-input" placeholder="e.g. LeBron Over 22.5 pts" />
                <button className="v-btn">Generate Report</button>
              </div>
            </div>
          </div>
        </div>

      </main>
      <SiteFooter />
    </div>
  );
}