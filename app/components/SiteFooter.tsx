"use client";

import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="v-footer">
      <style dangerouslySetInnerHTML={{__html: `
        .v-footer { background: #000; border-top: 1px solid rgba(255,255,255,0.10); padding: 80px 32px 40px; margin-top: 80px; font-family: 'Inter', sans-serif; }
        .v-footer__inner { max-width: 1400px; margin: 0 auto; }
        .v-footer__top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 40px; padding-bottom: 48px; border-bottom: 1px solid rgba(255,255,255,0.10); }
        @media (max-width: 900px) { .v-footer__top { grid-template-columns: 1fr 1fr; } }
        .v-footer__brand { font-family: 'Times New Roman', serif; font-weight: 800; font-size: 48px; line-height: 1; margin-bottom: 16px; color: #fff; }
        .v-footer__tagline { font-family: 'Times New Roman', serif; font-style: italic; color: #a8a8a8; font-size: 16px; max-width: 320px; }
        .v-footer__col h4 { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #d24239; margin-bottom: 18px; }
        .v-footer__col ul { list-style: none; padding: 0; margin: 0; }
        .v-footer__col li { margin-bottom: 10px; }
        .v-footer__col a { color: #a8a8a8; font-size: 14px; text-decoration: none; transition: color 0.3s; }
        .v-footer__col a:hover { color: #d24239; }
        .v-footer__bottom { padding-top: 32px; display: flex; justify-content: space-between; align-items: center; font-family: monospace; font-size: 10px; letter-spacing: 0.14em; color: #6e6e6e; text-transform: uppercase; flex-wrap: wrap; gap: 16px; }
      `}} />
      <div className="v-footer__inner">
        <div className="v-footer__top">
          <div>
            <div className="v-footer__brand">The Akademy</div>
            <p className="v-footer__tagline">The #1 Hub for Hip-Hop Media, Charts, and Industry Breakdowns. Owning the narrative.</p>
          </div>
          <div className="v-footer__col">
            <h4>Sections</h4>
            <ul>
              <li><Link href="/news">News</Link></li>
              <li><Link href="/charts">ChartDemiks</Link></li>
              <li><Link href="/live">Live</Link></li>
              <li><Link href="/sports">Sports</Link></li>
            </ul>
          </div>
          <div className="v-footer__col">
            <h4>Features</h4>
            <ul>
              <li><Link href="/videos">Videos</Link></li>
              <li><Link href="/social">Social Wall</Link></li>
              <li><Link href="/industry">Boardroom</Link></li>
              <li><Link href="/events">Events</Link></li>
            </ul>
          </div>
          <div className="v-footer__col">
            <h4>About</h4>
            <ul>
              <li><a href="#">Mission</a></li>
              <li><a href="#">Editorial Team</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Advertise</a></li>
            </ul>
          </div>
          <div className="v-footer__col">
            <h4>Follow</h4>
            <ul>
              <li><a href="#">Instagram</a></li>
              <li><a href="#">Twitter/X</a></li>
              <li><a href="#">YouTube</a></li>
              <li><a href="#">Discord</a></li>
            </ul>
          </div>
        </div>
        <div className="v-footer__bottom">
          <div>© 2026 The Akademy · All Rights Reserved</div>
          <div>Privacy · Terms · Cookie Policy · Do Not Sell My Info</div>
        </div>
      </div>
    </footer>
  );
}