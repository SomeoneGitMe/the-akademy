"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Brain } from "lucide-react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

interface PublishedArticle { 
  title: string; source: string; thumbnail_url: string; 
  created_at: string; tags: string[]; contentSnippet?: string; 
}

interface LegalSection { label: string; text: string; }

export default function LegalPage() {
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const [topicInput, setTopicInput] = useState("The RICO Act");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSections, setAiSections] = useState<LegalSection[] | null>(null);
  const [aiBottomLine, setAiBottomLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    fetch('/api/published-articles')
      .then(res => res.json())
      .then(data => {
        const filtered = (data.articles || []).filter((a: PublishedArticle) => 
          (a.tags || []).map(t => t.toLowerCase()).includes('legal')
        );
        setArticles(filtered);
        setLoading(false);
      });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fade-up, .line-mask').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const handleExplain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim()) return;
    
    setAiLoading(true);
    setAiSections(null);
    setError(null);
    
    try {
      const res = await fetch('/api/legal-ai', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ topic: topicInput }) 
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setAiSections(data.sections);
      setAiBottomLine(data.bottom_line);
    } catch (err) {
      setError("Failed to generate legal breakdown.");
    }
    setAiLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Legal" />
      
      <style dangerouslySetInnerHTML={{__html: `
        :root { --bg: #0a0a0a; --bg-elev: #131313; --text: #ffffff; --text-soft: #a8a8a8; --text-mute: #6e6e6e; --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25); --line: rgba(255,255,255,0.10); --line-soft: rgba(255,255,255,0.06); --red: #d24239; --green: #6bbf6b; --ease-quiet: cubic-bezier(.22, 1, .36, 1); }
        .shell { max-width: 1400px; margin: 0 auto; padding: 64px 32px 80px; }
        .page-head { margin-bottom: 64px; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--line); padding-bottom: 32px; }
        .page-head__left { flex: 1; }
        .page-head__num { font-family: monospace; font-size: 12px; letter-spacing: 0.2em; color: var(--accent); margin-bottom: 12px; display: block; }
        .page-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: clamp(48px, 8vw, 96px); line-height: 0.9; letter-spacing: -0.03em; }
        .page-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .page-head__right { text-align: right; font-family: 'Times New Roman', serif; font-style: italic; font-size: 16px; color: var(--text-soft); max-width: 400px; }
        .blotter-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 64px; margin-bottom: 80px; }
        @media (max-width: 1100px) { .blotter-grid { grid-template-columns: 1fr; } }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 32px; border-bottom: 1px solid var(--accent); padding-bottom: 12px; }
        .section-head__left { display: flex; align-items: center; gap: 16px; }
        .section-head__num { font-family: monospace; font-size: 11px; letter-spacing: 0.2em; color: var(--accent); }
        .section-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 28px; letter-spacing: -0.01em; display: flex; align-items: center; }
        .section-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        
        .help-icon-wrapper { position: relative; display: inline-flex; align-items: center; margin-left: 8px; }
        .help-icon { width: 14px; height: 14px; border: 1px solid var(--text-mute); border-radius: 50%; font-size: 9px; color: var(--text-mute); display: flex; align-items: center; justify-content: center; cursor: help; transition: all 0.3s ease; font-weight: bold; }
        .help-icon:hover { border-color: var(--accent); color: var(--accent); }
        .help-tooltip { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: rgba(40, 40, 40, 0.95); backdrop-filter: blur(10px); border: 1px solid var(--line); padding: 10px 14px; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 400; color: var(--text-soft); width: 240px; opacity: 0; pointer-events: none; transition: opacity 0.3s ease; z-index: 100; line-height: 1.4; text-transform: none; letter-spacing: 0; }
        .help-icon-wrapper:hover .help-tooltip { opacity: 1; }

        .timeline { position: relative; padding-left: 24px; border-left: 1px solid var(--line); margin-left: 8px; }
        .case-item { position: relative; padding-bottom: 40px; }
        .case-item:last-child { padding-bottom: 0; }
        .case-item::before { content: ''; position: absolute; left: -29px; top: 8px; width: 10px; height: 10px; background: var(--bg); border: 1px solid var(--text-mute); border-radius: 50%; }
        .case-item.is-detained::before { border-color: var(--red); background: var(--red); }
        .case-item.is-plea::before { border-color: var(--accent); background: var(--accent); }
        .case-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
        .case-name { font-family: 'Times New Roman', serif; font-size: 24px; font-weight: 700; }
        .case-name em { font-style: italic; font-weight: 400; }
        .case-status { font-family: monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; padding: 4px 8px; border: 1px solid var(--line); color: var(--text-soft); }
        .case-status.is-detained { color: var(--red); border-color: var(--red); }
        .case-status.is-plea { color: var(--accent); border-color: var(--accent-soft); }
        .case-status.is-bail { color: var(--green); border-color: var(--green); }
        .case-charges { font-family: 'Times New Roman', serif; font-style: italic; color: var(--text-soft); font-size: 15px; margin-bottom: 12px; }
        .case-meta { display: flex; gap: 24px; font-family: monospace; font-size: 11px; color: var(--text-mute); letter-spacing: 0.1em; text-transform: uppercase; }
        .case-meta strong { color: var(--text); font-weight: 500; }
        .widgets-col { display: flex; flex-direction: column; gap: 48px; }
        .ai-card { background: var(--bg-elev); border: 1px solid var(--accent-soft); border-left: 3px solid var(--accent); padding: 24px; }
        .ai-tag { display: flex; align-items: center; gap: 8px; font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: var(--accent); text-transform: uppercase; margin-bottom: 16px; }
        .ai-tag::before { content: '✦'; font-size: 14px; }
        .ai-title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 22px; line-height: 1.2; margin-bottom: 16px; display: flex; align-items: center; }
        .ai-title em { font-style: italic; }
        .ai-input-group { display: flex; align-items: center; gap: 12px; background: var(--bg); border: 1px solid var(--line); padding: 10px 14px; margin-bottom: 24px; transition: border-color .3s; }
        .ai-input-group:focus-within { border-color: var(--accent); }
        .ai-input { flex: 1; background: transparent; border: none; color: var(--text); font-family: monospace; font-size: 13px; outline: none; width: 100%; }
        .ai-input::placeholder { color: var(--text-mute); }
        .ai-btn { background: var(--accent); color: #fff; border: none; padding: 8px 14px; font-weight: 700; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: background .3s; }
        .ai-btn:hover { background: #b91c1c; }
        .ai-text { font-family: 'Times New Roman', serif; font-size: 15px; line-height: 1.6; color: var(--text-soft); margin-bottom: 16px; }
        .ai-text strong { color: var(--text); font-weight: 500; }
        .ai-divider { height: 1px; background: var(--line); margin: 16px 0; }
        .ai-source { font-family: monospace; font-size: 9px; color: var(--text-mute); letter-spacing: 0.14em; text-transform: uppercase; }
        .ai-output { margin-top: 24px; border-top: 1px solid var(--line); padding-top: 24px; }
        .ai-row { margin-bottom: 20px; }
        .ai-label { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: var(--accent); text-transform: uppercase; margin-bottom: 6px; display: block; }
        .ai-bottom { margin-top: 24px; padding: 16px; background: var(--bg); border: 1px solid var(--accent-soft); font-style: italic; }
        .verdict-table { width: 100%; border-collapse: collapse; }
        .verdict-table th { text-align: left; font-family: monospace; font-size: 9px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; padding-bottom: 12px; font-weight: 400; border-bottom: 1px solid var(--line); }
        .verdict-table td { padding: 16px 0; border-bottom: 1px solid var(--line-soft); vertical-align: top; }
        .verdict-name { font-family: 'Times New Roman', serif; font-size: 16px; font-weight: 500; }
        .verdict-charge { font-family: monospace; font-size: 10px; color: var(--text-mute); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }
        .verdict-max { font-family: monospace; font-size: 13px; color: var(--text-mute); text-decoration: line-through; }
        .verdict-actual { font-family: 'Times New Roman', serif; font-size: 18px; font-weight: 700; color: var(--accent); }
        .story-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px 32px; margin-bottom: 48px; }
        @media (max-width: 900px) { .story-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .story-grid { grid-template-columns: 1fr; } }
        .story { display: flex; flex-direction: column; gap: 14px; text-decoration: none; color: inherit; }
        .story__image { width: 100%; aspect-ratio: 4 / 3; overflow: hidden; background: #1a1a1a; display: block; }
        .story__image img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.9) contrast(1.05); transition: transform 1.1s var(--ease-quiet); }
        .story:hover .story__image img { transform: scale(1.03); }
        .story__kicker { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-top: 4px; }
        .story__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 22px; line-height: 1.2; }
        .story:hover .story__title { color: var(--accent); }
        .story__title em { font-style: italic; font-weight: 400; }
        .story__dek { font-family: 'Times New Roman', serif; font-size: 15px; line-height: 1.4; color: var(--text-soft); }
        .story__meta { font-family: monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-mute); }
        .story__meta strong { color: var(--text-soft); font-weight: 500; }
        .fade-up { opacity: 0; transform: translateY(24px); transition: opacity .9s var(--ease-quiet), transform .9s var(--ease-quiet); }
        .fade-up.is-in { opacity: 1; transform: none; }
        .line-mask { overflow: hidden; display: inline-block; }
        .line-mask__inner { display: block; transform: translateY(110%); transition: transform 1.1s var(--ease-quiet); }
        .line-mask.is-in .line-mask__inner { transform: translateY(0); }
      `}} />

      <div className="shell">
        <header className="page-head fade-up">
          <div className="page-head__left">
            <span className="page-head__num">08 / Court</span>
            <h1 className="page-head__title line-mask"><span className="line-mask__inner"><em>The</em> Blotter</span></h1>
          </div>
          <div className="page-head__right">Tracking the legal landscape of the industry. Indictments, plea deals, and verdicts explained.</div>
        </header>

        <div className="blotter-grid">
          <section className="fade-up">
            <div className="section-head">
              <div className="section-head__left">
                <span className="section-head__num">No. 01</span>
                <h2 className="section-head__title">Active <em>Cases</em> <div className="help-icon-wrapper"><span className="help-icon">?</span><span className="help-tooltip">Timeline of ongoing legal issues, tracking court dates, charges, and plea statuses.</span></div></h2>
              </div>
            </div>

            <div className="timeline">
              <div className="case-item is-detained">
                <div className="case-header"><div className="case-name">United States v. <em>Combs</em></div><div className="case-status is-detained">Detained</div></div>
                <div className="case-charges">Charges: Racketeering conspiracy, sex trafficking by force/fraud/coercion, transportation to engage in prostitution.</div>
                <div className="case-meta"><span><strong>Next Date:</strong> May 5, 2025</span><span><strong>Status:</strong> Denied Bail</span></div>
              </div>
              <div className="case-item">
                <div className="case-header"><div className="case-name">United States v. <em>Banks</em> (Lil Durk)</div><div className="case-status is-bail">Arraigned</div></div>
                <div className="case-charges">Charges: Conspiracy to commit murder-for-hire, use of interstate facilities to commit murder-for-hire.</div>
                <div className="case-meta"><span><strong>Next Date:</strong> Dec 12, 2024</span><span><strong>Status:</strong> Held without bond</span></div>
              </div>
              <div className="case-item is-plea">
                <div className="case-header"><div className="case-name">United States v. <em>Williams</em> (Young Thug)</div><div className="case-status is-plea">Plea Accepted</div></div>
                <div className="case-charges">Charges: Violation of the RICO Act, participation in criminal street gang activity.</div>
                <div className="case-meta"><span><strong>Next Date:</strong> N/A</span><span><strong>Status:</strong> Released on Probation</span></div>
              </div>
              <div className="case-item">
                <div className="case-header"><div className="case-name">United States v. <em>Jackson</em> (YG)</div><div className="case-status is-bail">Out on Bail</div></div>
                <div className="case-charges">Charges: Robbery (Felony), Assault with a deadly weapon.</div>
                <div className="case-meta"><span><strong>Next Date:</strong> Jan 10, 2025</span><span><strong>Status:</strong> Pending Pre-Trial</span></div>
              </div>
            </div>
          </section>

          <aside className="widgets-col fade-up">
            <div className="ai-card">
              <div className="ai-tag">AI Indictment Breakdown</div>
              <h3 className="ai-title">Decode Legal <em>Jargon</em> <div className="help-icon-wrapper"><span className="help-icon">?</span><span className="help-tooltip">Enter a legal concept, statute, or indictment term (e.g., RICO, Conspiracy, Wire Fraud). The AI will break it down into plain English.</span></div></h3>
              
              <form className="ai-input-group" onSubmit={handleExplain}>
                <input type="text" className="ai-input" placeholder="e.g. RICO Act, Conspiracy, Wire Fraud" value={topicInput} onChange={(e) => setTopicInput(e.target.value)} />
                <button type="submit" disabled={aiLoading} className="ai-btn">{aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}{aiLoading ? "..." : "Explain"}</button>
              </form>

              {aiLoading && <div className="text-zinc-500 animate-pulse flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Analyzing legal documents...</div>}
              {error && <div className="text-red-500">{error}</div>}
              {aiSections && (
                <div className="ai-output">
                  {aiSections.map((sec, idx) => (<div className="ai-row" key={idx}><span className="ai-label">{sec.label}</span><p className="ai-text">{sec.text}</p></div>))}
                  {aiBottomLine && (<div className="ai-bottom"><span className="ai-label" style={{ color: 'var(--accent)' }}>Bottom Line</span><p className="ai-text" style={{ color: 'var(--text)' }}>{aiBottomLine}</p></div>)}
                  <div className="ai-divider"></div><div className="ai-source">SOURCE: U.S. Legal Code · Generated by Akademy AI</div>
                </div>
              )}
            </div>

            <div>
              <div className="section-head"><div className="section-head__left"><span className="section-head__num">No. 02</span><h2 className="section-head__title">Verdicts &amp; <em>Sentencings</em> <div className="help-icon-wrapper"><span className="help-icon">?</span><span className="help-tooltip">Log of recent outcomes, showing maximum time faced vs. actual time given.</span></div></h2></div></div>
              <table className="verdict-table">
                <thead><tr><th>Defendant</th><th>Max Faced</th><th>Actual</th></tr></thead>
                <tbody>
                  <tr><td><div className="verdict-name">Tory Lanez</div><div className="verdict-charge">Assault / Firearm</div></td><td><span className="verdict-max">22 yrs</span></td><td><span className="verdict-actual">10 yrs</span></td></tr>
                  <tr><td><div className="verdict-name">YSL Mondo</div><div className="verdict-charge">RICO / Gang</div></td><td><span className="verdict-max">20 yrs</span></td><td><span className="verdict-actual">5 yrs</span></td></tr>
                  <tr><td><div className="verdict-name">6ix9ine</div><div className="verdict-charge">RICO / Violence</div></td><td><span className="verdict-max">Life</span></td><td><span className="verdict-actual">2 yrs</span></td></tr>
                  <tr><td><div className="verdict-name">Max B</div><div className="verdict-charge">Murder / Robbery</div></td><td><span className="verdict-max">75 yrs</span></td><td><span className="verdict-actual">12 yrs</span></td></tr>
                </tbody>
              </table>
            </div>
          </aside>
        </div>

        <section className="fade-up">
          <div className="section-head"><div className="section-head__left"><span className="section-head__num">No. 03</span><h2 className="section-head__title">Legal <em>Coverage</em></h2></div></div>
          {loading ? <div className="text-zinc-500 animate-pulse">Loading articles...</div> : articles.length === 0 ? <div className="text-zinc-600 italic text-center py-20">No legal articles published yet.</div> : (
            <div className="story-grid">
              {articles.map((article, idx) => (
                <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} key={idx} className="story">
                  <div className="story__image"><img src={article.thumbnail_url || `https://picsum.photos/seed/legal-${idx}/600/450`} alt="" /></div>
                  <div className="story__kicker">Legal</div>
                  <h3 className="story__title">{article.title}</h3>
                  <p className="story__dek">{article.contentSnippet || "Read the full breakdown."}</p>
                  <div className="story__meta">By <strong>DJ Akademiks</strong> · {isMounted ? new Date(article.created_at).toLocaleDateString() : ''}</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}