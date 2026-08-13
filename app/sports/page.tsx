"use client";

import { useState } from "react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

export default function SportsPage() {
  const [pickInput, setPickInput] = useState("");
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickInput.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setReport(`Based on the request for "${pickInput}": The player averages 24.1 points against this opponent over the last 3 games. The opposing defense ranks 22nd in points allowed to this position.`);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Sports" />
      
      <header className="page-head">
        <span className="page-head__num fade-up">06 / Court</span>
        <h1 className="page-head__title line-mask"><span className="line-mask__inner"><em>Sports</em></span></h1>
        <p className="page-head__dek fade-up">Where culture meets the court. AI insights, community locks, and draft tracking.</p>
      </header>

      <main className="shell">
        <div className="layout">
          <section className="main-col">
            <article className="hero-story fade-up">
              <div className="hero-story__img">
                <img src="https://images.unsplash.com/photo-1518407613690-d9fc990e795f?auto=format&fit=crop&w=1200&q=80" alt="" />
              </div>
              <div className="kicker">Draft HQ · NBA</div>
              <h2 className="hero-story__title">Cooper Flagg is the <em>Consensus</em> #1</h2>
              <p className="hero-story__dek">Aggregating mock drafts from ESPN, Bleacher Report, and The Athletic. Flagg sits at a 98% consensus probability to go first overall.</p>
              <div className="meta">
                <span>By <strong>Akademy Sports</strong></span>
                <span>2 days ago</span>
              </div>
            </article>

            <div className="section-head fade-up">
              <div className="section-head__left">
                <span className="section-head__num">01</span>
                <h3 className="section-head__title"><em>The Locks</em> Leaderboard</h3>
              </div>
            </div>

            <div className="story-grid">
              <article className="v-story fade-up">
                <div className="v-story__image"><img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80" alt="" /></div>
                <div className="v-story__kicker">Rank 1 · 78.9% Win</div>
                <h4 className="v-story__title">@AkademiksGold</h4>
                <p className="text-sm text-zinc-400 mt-1">Record: 142 - 38</p>
              </article>
              <article className="v-story fade-up">
                <div className="v-story__image"><img src="https://images.unsplash.com/photo-1605295322749-6ef2395d4c30?auto=format&fit=crop&w=600&q=80" alt="" /></div>
                <div className="v-story__kicker">Rank 2 · 74.3% Win</div>
                <h4 className="v-story__title">@VibeChecker</h4>
                <p className="text-sm text-zinc-400 mt-1">Record: 130 - 45</p>
              </article>
              <article className="v-story fade-up">
                <div className="v-story__image"><img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80" alt="" /></div>
                <div className="v-story__kicker">Rank 3 · 69.4% Win</div>
                <h4 className="v-story__title">@RapFanatic</h4>
                <p className="text-sm text-zinc-400 mt-1">Record: 118 - 52</p>
              </article>
            </div>
          </section>

          <aside className="sidebar fade-up">
            <div className="v-newsletter">
              <div className="v-newsletter__kicker">AI Research Tool</div>
              <h4 className="v-newsletter__title"><em>The</em> Almanac</h4>
              <p className="v-newsletter__dek">Enter a prop bet to generate a data-driven scout report.</p>
              <form onSubmit={generateReport} className="v-form">
                <input type="text" value={pickInput} onChange={(e) => setPickInput(e.target.value)} className="v-input" placeholder="e.g. LeBron Over 22.5 pts" />
                <button type="submit" disabled={loading} className="v-btn">{loading ? "Analyzing..." : "Generate Report"}</button>
              </form>
              {report && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Scout Report</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{report}</p>
                </div>
              )}
            </div>

            <div className="block">
              <div className="block__title">Draft Heat Index</div>
              <ul className="space-y-4">
                <li>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-white">Cooper Flagg (Duke)</span>
                    <span className="text-xs text-red-500 font-mono">98%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className="bg-red-600 h-1.5 rounded-full" style={{ width: '98%' }}></div></div>
                </li>
                <li>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-white">Ace Bailey (Rutgers)</span>
                    <span className="text-xs text-red-500 font-mono">85%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5"><div className="bg-red-600 h-1.5 rounded-full" style={{ width: '85%' }}></div></div>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}