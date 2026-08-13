import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div>
            <div className="footer__brand">The Akademy</div>
            <p className="footer__tagline">The #1 Hub for Hip-Hop Media, Charts, and Industry Breakdowns. Owning the narrative.</p>
          </div>
          <div className="footer__col">
            <h4>Sections</h4>
            <ul>
              <li><Link href="/news">News</Link></li>
              <li><Link href="/charts">ChartDemiks</Link></li>
              <li><Link href="/live">Live</Link></li>
              <li><Link href="/industry">Industry</Link></li>
              <li><Link href="/legal">Legal</Link></li>
              <li><Link href="/sports">Sports</Link></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>Features</h4>
            <ul>
              <li><a href="#">The Feed</a></li>
              <li><a href="#">18+ Uncensored</a></li>
              <li><a href="#">Akademy Almanac</a></li>
              <li><a href="#">Royalty Calculator</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>About</h4>
            <ul>
              <li><a href="#">Mission</a></li>
              <li><a href="#">Editorial Team</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Advertise</a></li>
            </ul>
          </div>
          <div className="footer__col">
            <h4>Follow</h4>
            <ul>
              <li><a href="#">Instagram</a></li>
              <li><a href="#">Twitter/X</a></li>
              <li><a href="#">YouTube</a></li>
              <li><a href="#">Discord</a></li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <div>© 2026 The Akademy · All Rights Reserved</div>
          <div>Privacy · Terms · Cookie Policy · Do Not Sell My Info</div>
        </div>
      </div>
    </footer>
  );
}