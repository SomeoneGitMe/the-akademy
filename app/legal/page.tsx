"use client";

import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Legal" />
      
      <header className="page-head">
        <span className="page-head__num fade-up">05 / Court</span>
        <h1 className="page-head__title line-mask"><span className="line-mask__inner"><em>Legal</em></span></h1>
        <p className="page-head__dek fade-up">Tracking the legal landscape of the industry. Indictments, plea deals, and verdicts explained.</p>
      </header>

      <main className="shell">
        <div className="layout">
          <section className="main-col">
            <article className="hero-story fade-up">
              <div className="hero-story__img">
                <img src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80" alt="" />
              </div>
              <div className="kicker">Federal Case · Breaking</div>
              <h2 className="hero-story__title">Diddy Faces <em>RICO</em> Indictment</h2>
              <p className="hero-story__dek">A breakdown of the federal charges, the co-conspirators subpoenaed, and what a conviction could mean for the Bad Boy empire.</p>
              <div className="meta">
                <span>By <strong>The Akademy Staff</strong></span>
                <span>Oct 12, 2026</span>
              </div>
            </article>

            <div className="section-head fade-up">
              <div className="section-head__left">
                <span className="section-head__num">02</span>
                <h3 className="section-head__title"><em>Indictment</em> Breakdowns</h3>
              </div>
            </div>

            <div className="story-grid">
              <article className="v-story fade-up">
                <div className="v-story__image"><img src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80" alt="" /></div>
                <div className="v-story__kicker">RICO Act</div>
                <h4 className="v-story__title">Understanding RICO in Hip-Hop</h4>
                <p className="text-sm text-zinc-400 mt-1">How feds target labels as enterprises.</p>
              </article>
              <article className="v-story fade-up">
                <div className="v-story__image"><img src="https://images.unsplash.com/photo-1534536281715-e28d76689b4d?auto=format&fit=crop&w=600&q=80" alt="" /></div>
                <div className="v-story__kicker">Plea Deals</div>
                <h4 className="v-story__title">Young Thug's Sentencing Parameters</h4>
                <p className="text-sm text-zinc-400 mt-1">Time faced vs. time given.</p>
              </article>
              <article className="v-story fade-up">
                <div className="v-story__image"><img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80" alt="" /></div>
                <div className="v-story__kicker">Gag Orders</div>
                <h4 className="v-story__title">Lil Durk's Motion to Silence Leaks</h4>
                <p className="text-sm text-zinc-400 mt-1">Why defense attorneys file them.</p>
              </article>
            </div>
          </section>

          <aside className="sidebar fade-up">
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
                <li>
                  <p className="font-bold text-white text-lg" style={{ fontFamily: 'Times New Roman, serif' }}>Young Thug</p>
                  <p className="text-xs text-red-500 font-bold uppercase mb-1">Sentencing Phase</p>
                  <p className="text-xs text-zinc-500">Next Date: Aug 25, 2026</p>
                </li>
              </ul>
            </div>

            <div className="v-newsletter">
              <div className="v-newsletter__kicker">Alerts</div>
              <h4 className="v-newsletter__title"><em>Legal</em> Brief Newsletter</h4>
              <p className="v-newsletter__dek">Get the latest court updates and verdicts delivered to your inbox.</p>
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