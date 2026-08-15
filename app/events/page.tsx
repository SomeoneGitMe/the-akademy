"use client";

import { useEffect } from "react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

export default function EventsPage() {
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    
    // Use requestAnimationFrame to ensure DOM is painted before observing
    const raf = requestAnimationFrame(() => {
      const elements = document.querySelectorAll('.fade-up, .line-mask');
      elements.forEach(el => io.observe(el));
    });
    
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Events" />
      
      <style dangerouslySetInnerHTML={{__html: `
        :root { --bg: #0a0a0a; --bg-elev: #131313; --text: #ffffff; --text-soft: #a8a8a8; --text-mute: #6e6e6e; --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25); --line: rgba(255,255,255,0.10); --line-soft: rgba(255,255,255,0.06); --red: #d24239; --green: #6bbf6b; --ease-quiet: cubic-bezier(.22, 1, .36, 1); }
        .shell { max-width: 1400px; margin: 0 auto; padding: 64px 32px 80px; }
        .page-head { margin-bottom: 64px; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--line); padding-bottom: 32px; }
        .page-head__left { flex: 1; }
        .page-head__num { font-family: monospace; font-size: 12px; letter-spacing: 0.2em; color: var(--accent); margin-bottom: 12px; display: block; }
        .page-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: clamp(48px, 8vw, 96px); line-height: 0.9; letter-spacing: -0.03em; }
        .page-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .page-head__right { text-align: right; font-family: 'Times New Roman', serif; font-style: italic; font-size: 16px; color: var(--text-soft); max-width: 400px; }
        
        .featured-event { display: grid; grid-template-columns: 1.4fr 1fr; gap: 0; margin-bottom: 100px; border: 1px solid var(--line); background: var(--bg-elev); }
        @media (max-width: 900px) { .featured-event { grid-template-columns: 1fr; } }
        .featured-image { position: relative; overflow: hidden; min-height: 500px; background: #000; }
        .featured-image img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.7) contrast(1.1); transition: transform 1.2s var(--ease-quiet); }
        .featured-event:hover .featured-image img { transform: scale(1.03); }
        .live-tag { position: absolute; top: 24px; left: 24px; background: var(--red); color: #fff; padding: 6px 14px; font-family: monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
        .live-tag::before { content: ''; width: 6px; height: 6px; background: #fff; border-radius: 50%; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .featured-content { padding: 48px; display: flex; flex-direction: column; justify-content: center; }
        .featured-date { font-family: monospace; font-size: 12px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; margin-bottom: 24px; display: block; }
        .featured-title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 44px; line-height: 1; letter-spacing: -0.02em; margin-bottom: 24px; }
        .featured-title em { font-style: italic; color: var(--accent); }
        .featured-desc { font-family: 'Times New Roman', serif; font-size: 18px; line-height: 1.5; color: var(--text-soft); margin-bottom: 32px; }
        .featured-venue { display: flex; align-items: center; gap: 16px; padding-top: 24px; border-top: 1px solid var(--line); margin-bottom: 32px; }
        .venue-icon { width: 32px; height: 32px; border: 1px solid var(--accent); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .venue-info h4 { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 15px; }
        .venue-info p { font-family: monospace; font-size: 11px; color: var(--text-mute); letter-spacing: 0.12em; text-transform: uppercase; }
        .btn { border: none; padding: 16px 24px; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; transition: all .3s var(--ease-quiet); display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: fit-content; cursor: pointer; text-decoration: none; }
        .btn--primary { background: var(--accent); color: #fff; }
        .btn--primary:hover { background: #b91c1c; }
        .btn--ghost { background: transparent; color: var(--text); border: 1px solid var(--line); margin-left: 12px; }
        .btn--ghost:hover { border-color: var(--accent); color: var(--accent); }

        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 32px; border-bottom: 1px solid var(--accent); padding-bottom: 12px; }
        .section-head__left { display: flex; align-items: baseline; gap: 16px; }
        .section-head__num { font-family: monospace; font-size: 11px; letter-spacing: 0.2em; color: var(--accent); }
        .section-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 28px; letter-spacing: -0.01em; }
        .section-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }

        .schedule-list { margin-bottom: 100px; }
        .schedule-row { display: grid; grid-template-columns: 120px 1fr 1fr auto; gap: 24px; align-items: center; padding: 24px 0; border-bottom: 1px solid var(--line-soft); transition: background .3s var(--ease-quiet); text-decoration: none; color: inherit; }
        .schedule-row:hover { background: rgba(255,255,255,0.015); padding-left: 16px; padding-right: 16px; margin-left: -16px; margin-right: -16px; border-bottom-color: var(--line); }
        .date-block { display: flex; flex-direction: column; gap: 4px; }
        .date-month { font-family: monospace; font-size: 11px; color: var(--accent); letter-spacing: 0.18em; text-transform: uppercase; }
        .date-day { font-family: 'Times New Roman', serif; font-size: 32px; font-weight: 700; line-height: 0.9; }
        .event-info { display: flex; flex-direction: column; gap: 4px; }
        .event-name { font-family: 'Times New Roman', serif; font-size: 22px; font-weight: 500; line-height: 1.2; }
        .event-name em { font-style: italic; color: var(--text-soft); }
        .venue-meta { display: flex; flex-direction: column; gap: 4px; }
        .venue-name { font-family: 'Inter', sans-serif; font-size: 14px; color: var(--text-soft); font-weight: 500; }
        .venue-loc { font-family: monospace; font-size: 10px; color: var(--text-mute); letter-spacing: 0.14em; text-transform: uppercase; }
        .status-pill { font-family: monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; padding: 6px 12px; border: 1px solid var(--line); color: var(--text-soft); }
        .status-pill.is-available { color: var(--green); border-color: var(--green); }
        .status-pill.is-soldout { color: var(--red); border-color: var(--red); text-decoration: line-through; }
        .status-pill.is-vip { color: var(--accent); border-color: var(--accent); background: var(--accent-soft); }
        .row-arrow { color: var(--text-mute); font-size: 18px; transition: transform .3s, color .3s; }
        .schedule-row:hover .row-arrow { color: var(--accent); transform: translateX(4px); }
        @media (max-width: 900px) {
          .schedule-row { grid-template-columns: 80px 1fr; gap: 16px; }
          .date-day { font-size: 24px; }
          .venue-meta, .status-pill, .row-arrow { grid-column: 2; }
          .row-arrow { display: none; }
        }

        .archive-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 100px; }
        @media (max-width: 900px) { .archive-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .archive-grid { grid-template-columns: 1fr; } }
        .archive-item { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: var(--bg-elev); display: block; }
        .archive-item img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(0.6) brightness(0.7) contrast(1.1); transition: transform 1.1s var(--ease-quiet), filter .4s var(--ease-quiet); }
        .archive-item:hover img { transform: scale(1.05); filter: grayscale(0) brightness(0.9) contrast(1.1); }
        .archive-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 24px; background: linear-gradient(0deg, rgba(10,10,10,0.9) 10%, transparent 60%); }
        .archive-date { font-family: monospace; font-size: 10px; color: var(--accent); letter-spacing: 0.16em; text-transform: uppercase; margin-bottom: 8px; }
        .archive-title { font-family: 'Times New Roman', serif; font-size: 22px; font-weight: 700; line-height: 1.1; color: var(--text); }
        .archive-title em { font-style: italic; }

        .booking-cta { background: var(--bg-elev); border-left: 3px solid var(--accent); padding: 48px; display: flex; justify-content: space-between; align-items: center; gap: 32px; }
        @media (max-width: 700px) { .booking-cta { flex-direction: column; align-items: flex-start; padding: 32px; } }
        .cta-left { flex: 1; }
        .cta-tag { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; margin-bottom: 12px; display: block; }
        .cta-title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 32px; line-height: 1.1; margin-bottom: 8px; }
        .cta-title em { font-style: italic; color: var(--accent); }
        .cta-desc { font-family: 'Times New Roman', serif; font-style: italic; color: var(--text-soft); font-size: 16px; }
        .cta-btn { background: var(--accent); color: #fff; padding: 16px 32px; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; transition: background .3s; white-space: nowrap; text-decoration: none; }
        .cta-btn:hover { background: #b91c1c; }

        .fade-up { opacity: 0; transform: translateY(24px); transition: opacity .9s var(--ease-quiet), transform .9s var(--ease-quiet); }
        .fade-up.is-in { opacity: 1; transform: none; }
        .line-mask { overflow: hidden; display: inline-block; }
        .line-mask__inner { display: block; transform: translateY(110%); transition: transform 1.1s var(--ease-quiet); }
        .line-mask.is-in .line-mask__inner { transform: translateY(0); }
      `}} />

      <div className="shell">
        <header className="page-head fade-up">
          <div className="page-head__left">
            <span className="page-head__num">10 / IRL</span>
            <h1 className="page-head__title line-mask"><span className="line-mask__inner">Events <em>&amp; Appearances</em></span></h1>
          </div>
          <div className="page-head__right">
            Live tapings, meetups, and club appearances. The culture doesn't just happen online.
          </div>
        </header>

        <article className="featured-event fade-up">
          <div className="featured-image">
            <img src="https://picsum.photos/seed/events-featured/800/600" alt="Featured Event" />
            <div className="live-tag">Featured Event</div>
          </div>
          <div className="featured-content">
            <span className="featured-date">Dec 12, 2024 · 8:00 PM EST</span>
            <h2 className="featured-title">Akademy Live: The <em>Year-End</em> Review</h2>
            <p className="featured-desc">A live podcast taping and afterparty. Join DJ Akademiks and special guests as they break down the biggest cultural moments of the year, unfiltered and uncut.</p>
            
            <div className="featured-venue">
              <div className="venue-icon">⬢</div>
              <div className="venue-info">
                <h4>Terminal 5</h4>
                <p>611 W 56th St, New York, NY</p>
              </div>
            </div>
            
            <div>
              <a href="#" className="btn btn--primary">Get Tickets →</a>
              <a href="#" className="btn btn--ghost">VIP Packages</a>
            </div>
          </div>
        </article>

        <section className="fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">No. 01</span>
              <h2 className="section-head__title">Upcoming <em>Schedule</em></h2>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--text-mute)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>2024 - 2025 Tour</span>
          </div>

          <div className="schedule-list">
            <a href="#" className="schedule-row">
              <div className="date-block">
                <span className="date-month">DEC</span>
                <span className="date-day">05</span>
              </div>
              <div className="event-info">
                <span className="event-name">Akademy <em>Meet &amp; Greet</em></span>
              </div>
              <div className="venue-meta">
                <span className="venue-name">The Tabernacle</span>
                <span className="venue-loc">Atlanta, GA</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className="status-pill is-available">Tickets Available</span>
                <span className="row-arrow">→</span>
              </div>
            </a>

            <a href="#" className="schedule-row">
              <div className="date-block">
                <span className="date-month">DEC</span>
                <span className="date-day">12</span>
              </div>
              <div className="event-info">
                <span className="event-name">Akademy Live: <em>Year-End Review</em></span>
              </div>
              <div className="venue-meta">
                <span className="venue-name">Terminal 5</span>
                <span className="venue-loc">New York, NY</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className="status-pill is-vip">VIP Only</span>
                <span className="row-arrow">→</span>
              </div>
            </a>

            <a href="#" className="schedule-row">
              <div className="date-block">
                <span className="date-month">JAN</span>
                <span className="date-day">15</span>
              </div>
              <div className="event-info">
                <span className="event-name">Midnight Club <em>Takeover</em></span>
              </div>
              <div className="venue-meta">
                <span className="venue-name">E11EVEN Miami</span>
                <span className="venue-loc">Miami, FL</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className="status-pill is-soldout">Sold Out</span>
                <span className="row-arrow">→</span>
              </div>
            </a>

            <a href="#" className="schedule-row">
              <div className="date-block">
                <span className="date-month">JAN</span>
                <span className="date-day">28</span>
              </div>
              <div className="event-info">
                <span className="event-name">The <em>Lowkey</em> Lounge</span>
              </div>
              <div className="venue-meta">
                <span className="venue-name">The Novo</span>
                <span className="venue-loc">Los Angeles, CA</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className="status-pill is-available">Tickets Available</span>
                <span className="row-arrow">→</span>
              </div>
            </a>
          </div>
        </section>

        <section className="fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">No. 02</span>
              <h2 className="section-head__title">Past <em>Appearances</em></h2>
            </div>
          </div>

          <div className="archive-grid">
            <a href="#" className="archive-item">
              <img src="https://picsum.photos/seed/events-past-1/600/450" alt="" />
              <div className="archive-overlay">
                <span className="archive-date">Oct 31, 2024</span>
                <h4 className="archive-title">Halloween <em>Scream</em> Bash</h4>
              </div>
            </a>
            <a href="#" className="archive-item">
              <img src="https://picsum.photos/seed/events-past-2/600/450" alt="" />
              <div className="archive-overlay">
                <span className="archive-date">Sep 12, 2024</span>
                <h4 className="archive-title">Brooklyn <em>Stadium</em> Takeover</h4>
              </div>
            </a>
            <a href="#" className="archive-item">
              <img src="https://picsum.photos/seed/events-past-3/600/450" alt="" />
              <div className="archive-overlay">
                <span className="archive-date">Aug 04, 2024</span>
                <h4 className="archive-title">The <em>Summer</em> Jam Afterparty</h4>
              </div>
            </a>
            <a href="#" className="archive-item">
              <img src="https://picsum.photos/seed/events-past-4/600/450" alt="" />
              <div className="archive-overlay">
                <span className="archive-date">Jul 15, 2024</span>
                <h4 className="archive-title">Akademy <em>Podcast</em> Live Taping</h4>
              </div>
            </a>
            <a href="#" className="archive-item">
              <img src="https://picsum.photos/seed/events-past-5/600/450" alt="" />
              <div className="archive-overlay">
                <span className="archive-date">May 22, 2024</span>
                <h4 className="archive-title">Akademy <em>Launch</em> Party</h4>
              </div>
            </a>
            <a href="#" className="archive-item">
              <img src="https://picsum.photos/seed/events-past-6/600/450" alt="" />
              <div className="archive-overlay">
                <span className="archive-date">Feb 10, 2024</span>
                <h4 className="archive-title">The <em>Big</em> Game Weekend</h4>
              </div>
            </a>
          </div>
        </section>

        <section className="fade-up">
          <div className="booking-cta">
            <div className="cta-left">
              <span className="cta-tag">Booking Inquiry</span>
              <h2 className="cta-title">Want to bring the <em>Akademy</em> to your city?</h2>
              <p className="cta-desc">For private bookings, college appearances, and corporate events.</p>
            </div>
            <a href="mailto:booking@theakademy.com" className="cta-btn">Contact Booking</a>
          </div>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}