"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabaseBrowser } from "../utils/supabaseBrowser";
import { X } from "lucide-react";

export default function SiteNav({ activePage = "" }: { activePage?: string }) {
  const [nsfw, setNsfw] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (session) {
        const { data: profile } = await supabaseBrowser.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile) setUserRole(profile.role);
      }
    };
    checkAuth();

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    const grids = document.querySelectorAll('.story-grid, .tv-grid, .movies-grid, .games-grid');
    grids.forEach(grid => {
      const items = grid.querySelectorAll('.fade-up');
      items.forEach((item, index) => { (item as HTMLElement).style.transitionDelay = (index * 0.08) + 's'; });
    });

    const elements = document.querySelectorAll('.fade-up, .line-mask');
    elements.forEach(el => io.observe(el));

    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (showAuthModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [showAuthModal]);

  const handleSignOut = async () => {
    await supabaseBrowser.auth.signOut();
    setUserRole(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const { data, error } = await supabaseBrowser.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session === null) {
          setSuccessMsg("Account created! Check your email to confirm.");
          setIsSignUp(false);
        } else {
          setShowAuthModal(false);
          window.location.href = "/admin";
        }
      } else {
        const { data, error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setShowAuthModal(false);
        window.location.href = "/admin";
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        :root {
          --bg: #0a0a0a; --bg-elev: #131313; --text: #ffffff;
          --text-soft: #a8a8a8; --text-mute: #6e6e6e;
          --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25);
          --line: rgba(255,255,255,0.10); --line-soft: rgba(255,255,255,0.06);
          --ease-quiet: cubic-bezier(.22, 1, .36, 1);
          --ease-emphasis: cubic-bezier(.16, 1, .3, 1);
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: var(--bg); color: var(--text); font-family: 'Inter', system-ui, sans-serif; font-size: 15px; line-height: 1.6; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        body.modal-open { overflow: hidden; }
        img { display: block; max-width: 100%; height: auto; }
        a { color: inherit; text-decoration: none; transition: color .3s var(--ease-quiet); }
        a:hover { color: var(--accent); }
        ::selection { background: var(--accent); color: var(--bg); }

        .line-mask { overflow: hidden; display: inline-block; }
        .line-mask__inner { display: block; transform: translateY(110%); transition: transform 1.1s var(--ease-quiet); }
        .line-mask.is-in .line-mask__inner { transform: translateY(0); }
        .fade-up { opacity: 0; transform: translateY(28px); transition: opacity 1s var(--ease-quiet), transform 1s var(--ease-quiet); }
        .fade-up.is-in { opacity: 1; transform: none; }

        .util-nav { background: #000; border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 100; }
        .util-nav__inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 10px 32px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 600; }
        .util-nav__sisters { display: flex; gap: 28px; }
        .util-nav__sisters a { color: var(--text-mute); }
        .util-nav__sisters a.is-active { color: var(--text); }
        .util-nav__meta { display: flex; gap: 24px; align-items: center; }
        .util-nav__meta a { color: var(--text-mute); cursor: pointer; }
        .util-nav__toggle { background: transparent; border: 1px solid var(--line); color: var(--text-mute); padding: 6px 14px; border-radius: 2px; letter-spacing: 0.14em; cursor: pointer; transition: all 0.3s; }
        .util-nav__toggle.active { background: var(--accent); color: #fff; border-color: var(--accent); }

        .masthead { padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid var(--line); background: var(--bg); }
        .masthead__logo { font-family: 'Times New Roman', serif; font-weight: 800; font-size: clamp(60px, 10vw, 120px); letter-spacing: -0.02em; line-height: 0.9; color: var(--text); display: inline-block; position: relative; }
        .masthead__logo::after { content: ''; display: block; width: 48px; height: 2px; background: var(--accent); margin: 12px auto 0; }
        .masthead__date { margin-top: 14px; font-family: monospace; font-size: 11px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; }

        .primary-nav { border-bottom: 1px solid var(--line); position: sticky; top: 41px; z-index: 99; background: var(--bg); }
        .primary-nav__inner { max-width: 1400px; margin: 0 auto; display: flex; align-items: center; justify-content: center; gap: 36px; padding: 16px 32px; overflow-x: auto; scrollbar-width: none; }
        .primary-nav__inner::-webkit-scrollbar { display: none; }
        .primary-nav a { font-weight: 700; font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text); white-space: nowrap; position: relative; padding-bottom: 4px; }
        .primary-nav a::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 1px; background: var(--accent); transition: width .4s var(--ease-quiet); }
        .primary-nav a:hover::after, .primary-nav a.is-active::after { width: 100%; }
        .primary-nav a.is-active { color: var(--accent); }

        /* NOIR AUTH MODAL */
        .auth-overlay { position: fixed; inset: 0; background: rgba(10, 10, 10, 0.75); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; opacity: 0; pointer-events: none; transition: opacity 0.5s var(--ease-quiet); }
        .auth-overlay.is-open { opacity: 1; pointer-events: auto; }
        .auth-modal { background: var(--bg-elev); border: 1px solid var(--line); width: 100%; max-width: 440px; padding: 48px 40px; position: relative; transform: scale(0.96) translateY(10px); transition: transform 0.6s var(--ease-emphasis); box-shadow: 0 40px 80px rgba(0,0,0,0.4); }
        .auth-overlay.is-open .auth-modal { transform: scale(1) translateY(0); }
        .auth__close { position: absolute; top: 20px; right: 20px; width: 32px; height: 32px; background: transparent; border: 1px solid var(--line); color: var(--text-mute); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .3s var(--ease-quiet); }
        .auth__close:hover { border-color: var(--accent); color: var(--accent); }
        .auth__head { text-align: center; margin-bottom: 32px; }
        .auth__logo { font-family: 'Times New Roman', serif; font-weight: 800; font-size: 32px; letter-spacing: -0.02em; margin-bottom: 8px; display: block; color: var(--text); }
        .auth__greeting { font-family: 'Times New Roman', serif; font-style: italic; font-size: 18px; color: var(--text-soft); }
        .auth__tabs { display: flex; margin-bottom: 32px; border-bottom: 1px solid var(--line); }
        .auth__tab { flex: 1; background: transparent; border: none; color: var(--text-mute); padding: 12px 0; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; cursor: pointer; position: relative; transition: color .3s; }
        .auth__tab::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 0; height: 2px; background: var(--accent); transition: width .4s var(--ease-quiet); }
        .auth__tab.is-active { color: var(--text); }
        .auth__tab.is-active::after { width: 100%; }
        .auth__form { display: flex; flex-direction: column; gap: 18px; }
        .auth__field { display: flex; flex-direction: column; gap: 8px; }
        .auth__label { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; }
        .auth__input { background: transparent; border: none; border-bottom: 1px solid var(--line); color: var(--text); padding: 8px 0; font-family: 'Inter', sans-serif; font-size: 15px; transition: border-color .3s; outline: none; }
        .auth__input:focus { border-color: var(--accent); }
        .auth__submit { background: var(--accent); color: #fff; border: none; padding: 14px; margin-top: 12px; font-family: 'Inter', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; cursor: pointer; transition: background .3s; }
        .auth__submit:hover { background: #b91c1c; }
        .auth__error { color: var(--accent); font-size: 12px; text-align: center; margin-top: 10px; font-family: monospace; border: 1px solid var(--accent); padding: 8px; background: rgba(210, 66, 57, 0.1); }
        .auth__success { color: #6bbf6b; font-size: 12px; text-align: center; margin-top: 10px; font-family: monospace; border: 1px solid #6bbf6b; padding: 8px; background: rgba(107, 191, 107, 0.1); }
        .auth__switch { text-align: center; font-family: monospace; font-size: 10px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; margin-top: 16px; display: block; cursor: pointer; }
        .auth__switch:hover { color: var(--accent); }
      `}</style>

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
              <a onClick={() => setShowAuthModal(true)} style={{ cursor: 'pointer' }}>Sign In</a>
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
          <Link href="/events" className={activePage === "Events" ? "is-active" : ""}>Events</Link>
          <Link href="/videos" className={activePage === "Videos" ? "is-active" : ""}>Videos</Link>
          <Link href="/social" className={activePage === "Social" ? "is-active" : ""}>Social</Link>
        </div>
      </nav>

      {/* NOIR AUTH MODAL */}
      {showAuthModal && (
        <div className="auth-overlay is-open" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAuthModal(false)} className="auth__close">
              <X size={16} />
            </button>
            
            <div className="auth__head">
              <div className="auth__logo">THE AKADEMY</div>
              <div className="auth__greeting">
                {isSignUp ? "Join the community." : "Welcome back."}
              </div>
            </div>

            <div className="auth__tabs">
              <button className={`auth__tab ${!isSignUp ? 'is-active' : ''}`} onClick={() => { setIsSignUp(false); setError(""); }}>
                Sign In
              </button>
              <button className={`auth__tab ${isSignUp ? 'is-active' : ''}`} onClick={() => { setIsSignUp(true); setError(""); }}>
                Create Account
              </button>
            </div>

            {error && (
              <div className="auth__error">{error}</div>
            )}
            
            {successMsg && (
              <div className="auth__success">{successMsg}</div>
            )}

            <form onSubmit={handleAuth} className="auth__form">
              <div className="auth__field">
                <label className="auth__label">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="you@email.com" 
                  className="auth__input" 
                  required 
                />
              </div>
              
              <div className="auth__field">
                <label className="auth__label">Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  className="auth__input" 
                  required 
                />
              </div>
              
              {isSignUp && (
                <div className="auth__field">
                  <label className="auth__label">Confirm Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="auth__input" 
                    required 
                  />
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading} 
                className="auth__submit"
              >
                {loading ? "Processing..." : (isSignUp ? "Create Account" : "Sign In")}
              </button>
            </form>

            <a 
              className="auth__switch" 
              onClick={() => { setIsSignUp(!isSignUp); setError(""); setSuccessMsg(""); }}
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Create one"}
            </a>
          </div>
        </div>
      )}
    </>
  );
}