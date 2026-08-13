"use client";

import { useState } from "react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

export default function IndustryPage() {
  const [streams, setStreams] = useState(1000000);
  const [payout, setPayout] = useState(0);

  const calculatePayout = (e: React.FormEvent) => {
    e.preventDefault();
    setPayout(streams * 0.004);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Industry" />
      
      <header className="page-head">
        <span className="page-head__num fade-up">04 / Business</span>
        <h1 className="page-head__title line-mask"><span className="line-mask__inner"><em>Industry</em></span></h1>
        <p className="page-head__dek fade-up">Inside the business of hip-hop. Contract breakdowns, label architecture, and executive moves.</p>
      </header>

      <main className="shell">
        <div className="layout">
          <section className="main-col">
            <article className="hero-story fade-up">
              <div className="hero-story__img">
                <img src="https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&w=1200&q=80" alt="" />
              </div>
              <div className="kicker">Contract Breakdown · OVO</div>
              <h2 className="hero-story__title">Drake's $400M Universal Deal <em>Explained</em></h2>
              <p className="hero-story__dek">A deep dive into the multi-album advance, ownership clauses, and what it means for the future of OVO Sound.</p>
              <div className="meta">
                <span>By <strong>DJ Akademiks</strong></span>
                <span>5 min read</span>
              </div>
            </article>

            <div className="section-head fade-up">
              <div className="section-head__left">
                <span className="section-head__num">01</span>
                <h3 className="section-head__title"><em>The Bag</em></h3>
              </div>
            </div>

            <div className="story-grid">
              <article className="v-story fade-up">
                <div className="v-story__image"><img src="https://images.unsplash.com/photo-1605542339524-1b2f8b6c6c1b?auto=format&fit=crop&w=600&q=80" alt="" /></div>
                <div className="v-story__kicker">JV Deal</div>
                <h4 className="v-story__title">J. Cole's Dreamville Structure</h4>
                <p className="text-sm text-zinc-400 mt-1">50/50 split with Interscope.</p>
              </article>
              <article className="v-story fade-up">
                <div className="v-story__image"><img src="https://images.unsplash.com/photo-1571974599782-87624638275ec?auto=format&fit=crop&w=600&q=80" alt="" /></div>
                <div className="v-story__kicker">Indie</div>
                <h4 className="v-story__title">Russ Owns 100% of Masters</h4>
                <p className="text-sm text-zinc-400 mt-1">Keeps $0.80 per dollar.</p>
              </article>
              <article className="v-story fade-up">
                <div className="v-story__image"><img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80" alt="" /></div>
                <div className="v-story__kicker">360 Deal</div>
                <h4 className="v-story__title">Lil Baby's QC Agreement</h4>
                <p className="text-sm text-zinc-400 mt-1">Label takes cut of touring.</p>
              </article>
            </div>
          </section>

          <aside className="sidebar fade-up">
            <div className="v-newsletter">
              <div className="v-newsletter__kicker">Interactive Tool</div>
              <h4 className="v-newsletter__title"><em>Royalty</em> Calculator</h4>
              <p className="v-newsletter__dek">Estimate streaming revenue based on Spotify metrics.</p>
              <form onSubmit={calculatePayout} className="v-form">
                <input type="number" value={streams} onChange={(e) => setStreams(Number(e.target.value))} className="v-input" placeholder="Monthly Streams" />
                <button type="submit" className="v-btn">Calculate</button>
              </form>
              {payout > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Estimated Payout</p>
                  <p className="text-2xl font-black text-green-500" style={{ fontFamily: 'Times New Roman, serif' }}>${payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              )}
            </div>

            <div className="block">
              <div className="block__title">Executive Moves</div>
              <ul className="space-y-3 text-sm text-zinc-300">
                <li className="border-b border-zinc-800/50 pb-2"><strong className="text-white">Elijah Watson</strong> promoted to VP of A&R at Def Jam.</li>
                <li className="border-b border-zinc-800/50 pb-2"><strong className="text-white">Julius Valentine</strong> departs Atlantic Records.</li>
                <li><strong className="text-white">Kei Henderson</strong> launches new imprint under Interscope.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}