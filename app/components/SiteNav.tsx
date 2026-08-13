"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabaseBrowser } from "../utils/supabaseBrowser";

export default function SiteNav({ activePage = "" }: { activePage?: string }) {
  const [nsfw, setNsfw] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (session) {
        const { data: profile } = await supabaseBrowser.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile) setUserRole(profile.role);
      }
    };
    checkAuth();

    // Inject Scroll Animations globally for all pages
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    const grids = document.querySelectorAll('.story-grid, .tv-grid, .movies-grid, .games-grid');
    grids.forEach(grid => {
      const items = grid.querySelectorAll('.fade-up');
      items.forEach((item, index) => {
        (item as HTMLElement).style.transitionDelay = (index * 0.08) + 's';
      });
    });

    const elements = document.querySelectorAll('.fade-up, .line-mask');
    elements.forEach(el => io.observe(el));

    return () => io.disconnect();
  }, []);

  const handleSignOut = async () => {
    await supabaseBrowser.auth.signOut();
    setUserRole(null);
  };

  return (
    <>
      <nav className="util-nav">
        <div className="util-nav__inner">
          <div className="util-nav__sisters">
            <Link href="/news" className={activePage === "News" ? "is-active" : ""}>News</Link>
            <Link href="/" className={activePage === "Home" ? "is-active" : ""}>The Akademy</Link>
            <Link href="/charts" className={activePage === "Charts" ? "is-active" : ""}>Charts</Link>
            <Link href="/industry" className={activePage === "Industry" ? "is-active" : ""}>Industry</Link>
          </div>
          <div className="util-nav__meta">
            <a>Newsletters</a><a>Podcasts</a>
            {userRole === 'admin' || userRole === 'editor' ? (
              <>
                <Link href="/admin">{userRole === 'admin' ? 'Admin Dashboard' : 'Editor Dashboard'}</Link>
                <a onClick={handleSignOut} style={{ cursor: 'pointer' }}>Sign Out</a>
              </>
            ) : (
              <Link href="/login">Sign In</Link>
            )}
            <button className={`util-nav__toggle ${nsfw ? 'active' : ''}`} onClick={() => setNsfw(!nsfw)}>18+ Uncensored</button>
          </div>
        </div>
      </nav>

      <header className="masthead">
        <Link href="/" className="masthead__logo line-mask"><span className="line-mask__inner">THE AKADEMY</span></Link>
        <div className="masthead__date fade-up">Hip-Hop Media · Industry Breakdowns</div>
      </header>

            <nav className="primary-nav">
        <div className="primary-nav__inner">
          <Link href="/" className={activePage === "Home" ? "is-active" : ""}>The Feed</Link>
          <Link href="/charts" className={activePage === "Charts" ? "is-active" : ""}>ChartDemiks</Link>
          <Link href="/news" className={activePage === "News" ? "is-active" : ""}>News</Link>
          <Link href="/live" className={activePage === "Live" ? "is-active" : ""}>Live</Link>
          <Link href="/industry" className={activePage === "Industry" ? "is-active" : ""}>Industry</Link>
          <Link href="/legal" className={activePage === "Legal" ? "is-active" : ""}>Legal</Link>
          <Link href="/sports" className={activePage === "Sports" ? "is-active" : ""}>Sports</Link>
          <a href="#">Videos</a><a href="#">Social</a><a href="#">Events</a>
        </div>
      </nav>
    </>
  );
}