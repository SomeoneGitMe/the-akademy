"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Search, Users, ShieldCheck, LayoutDashboard, FileText, Radio, Trash2, Edit3, RefreshCw, PlusCircle } from "lucide-react";
import { supabaseBrowser } from "../utils/supabaseBrowser";

interface Article { title: string; link: string; contentSnippet: string; source: string; image: string; pubDate: string; }
interface Draft { title: string; source: string; created_at: string; }
interface PublishedArticle { title: string; source: string; thumbnail_url: string; created_at: string; }
interface TeamMember { id: string; username: string | null; role: string; }

export default function AdminDashboardPage() {
  const [news, setNews] = useState<Article[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [published, setPublished] = useState<PublishedArticle[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [manualTitle, setManualTitle] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [refreshingRSS, setRefreshingRSS] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) { router.push("/login"); return; }
      const { data: profile } = await supabaseBrowser.from('profiles').select('role').eq('id', session.user.id).single();
      if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) { router.push("/"); return; }
      setUserRole(profile.role);
      setAuthChecked(true);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    const fetchData = async () => {
      try {
        const [newsRes, draftsRes, publishedRes, teamRes] = await Promise.all([
          fetch('/api/news').then(r => r.json()), 
          fetch('/api/drafts').then(r => r.json()),
          fetch('/api/published-articles').then(r => r.json()), 
          fetch('/api/team').then(r => r.json())
        ]);
        setNews(newsRes.articles || []); 
        setDrafts(draftsRes.drafts || []);
        setPublished(publishedRes.articles || []); 
        setTeam(teamRes.team || []);
        setLoadingData(false);
      } catch (err) { 
        console.error(err); 
        setLoadingData(false);
      }
    };
    fetchData();
  }, [authChecked]);

  useEffect(() => {
    if (loadingData) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    const raf = requestAnimationFrame(() => {
      document.querySelectorAll('.fade-up').forEach(el => io.observe(el));
    });
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [loadingData]);

  const handleLogout = async () => { await supabaseBrowser.auth.signOut(); router.push("/"); };
  const handleManualGenerate = (e: React.FormEvent) => { e.preventDefault(); if (!manualTitle.trim()) return; router.push(`/article?title=${encodeURIComponent(manualTitle)}&source=The Akademy&edit=true`); };
  
  const handleRefreshRSS = async () => {
    setRefreshingRSS(true);
    try {
      const res = await fetch('/api/news');
      const data = await res.json();
      setNews(data.articles || []);
    } catch (err) { console.error("Failed to refresh RSS", err); }
    setRefreshingRSS(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setTeam(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
    await fetch('/api/team', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, newRole }) });
  };

  const handleDelete = async (title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    setPublished(prev => prev.filter(a => a.title !== title));
    setDrafts(prev => prev.filter(a => a.title !== title));
    await fetch('/api/delete-article', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
  };

  if (!authChecked || loadingData) return <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Desk...</div>;

  const filteredTeam = team.filter(m => (m.username || m.id).toLowerCase().includes(teamSearch.toLowerCase()));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#ffffff', display: 'flex', border: 'none' }}>
      <style dangerouslySetInnerHTML={{__html: `
        html, body { border: none !important; margin: 0 !important; padding: 0 !important; background-color: #0a0a0a !important; }
        :root { --bg: #0a0a0a; --bg-elev: #131313; --text: #ffffff; --text-soft: #a8a8a8; --text-mute: #6e6e6e; --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25); --line: rgba(255,255,255,0.05); --line-soft: rgba(255,255,255,0.02); --red: #d24239; --green: #6bbf6b; --ease-quiet: cubic-bezier(.22, 1, .36, 1); }
        .app { display: flex; width: 100%; min-height: 100vh; border: none !important; }
        .sidebar { background: #000; border-right: 1px solid var(--line); position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; padding: 32px 24px; width: 240px; flex-shrink: 0; }
        .sidebar__logo { font-family: 'Times New Roman', serif; font-weight: 800; font-size: 24px; margin-bottom: 48px; display: block; color: var(--text); text-decoration: none; }
        .sidebar__logo span { color: var(--accent); font-style: italic; font-weight: 500; font-size: 14px; margin-left: 8px; }
        .sidebar__nav { list-style: none; flex: 1; padding: 0; margin: 0; }
        .sidebar__nav li { margin-bottom: 4px; }
        .sidebar__nav a { display: flex; align-items: center; gap: 12px; padding: 10px 12px; font-size: 13px; font-weight: 500; color: var(--text-soft); border-left: 2px solid transparent; transition: all .3s var(--ease-quiet); text-decoration: none; }
        .sidebar__nav a:hover { color: var(--text); background: var(--bg-elev); }
        .sidebar__nav a.is-active { color: var(--text); border-left-color: var(--accent); background: linear-gradient(90deg, rgba(210, 66, 57, 0.05) 0%, transparent 100%); }
        .sidebar__user { border-top: 1px solid var(--line); padding-top: 24px; display: flex; align-items: center; gap: 12px; }
        .avatar { width: 36px; height: 36px; background: var(--bg-elev); color: var(--accent); display: flex; align-items: center; justify-content: center; font-family: 'Times New Roman', serif; font-weight: 700; font-size: 14px; border: 1px solid var(--line); }
        .user__info { flex: 1; } .user__name { font-size: 13px; font-weight: 600; } .user__role { font-family: monospace; font-size: 9px; color: var(--text-mute); letter-spacing: 0.14em; text-transform: uppercase; }
        
        .main { flex: 1; padding: 32px 48px 80px; max-width: 1200px; border: none !important; }
        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 1px solid var(--line); }
        .breadcrumb { font-family: monospace; font-size: 11px; color: var(--text-mute); text-transform: uppercase; }
        .breadcrumb strong { color: var(--text); }
        .topbar__actions { display: flex; gap: 12px; align-items: center; }
        .search { background: var(--bg-elev); border: 1px solid var(--line); padding: 8px 14px; display: flex; align-items: center; gap: 12px; width: 320px; }
        .search input { background: transparent; border: none; color: var(--text); font-family: 'Inter', sans-serif; font-size: 13px; flex: 1; outline: none; }
        .btn { border: none; padding: 8px 18px; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; transition: all .3s var(--ease-quiet); display: inline-flex; align-items: center; gap: 8px; cursor: pointer; text-decoration: none; }
        .btn--ghost { background: transparent; color: var(--text-soft); border: 1px solid var(--line); } .btn--ghost:hover { border-color: var(--text-soft); color: var(--text); }
        .btn--primary { background: var(--accent); color: #fff; } .btn--primary:hover { background: #b91c1c; }

        .page-head { margin-bottom: 48px; display: flex; justify-content: space-between; align-items: flex-end; }
        .page-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 48px; line-height: 0.9; letter-spacing: -0.02em; margin-bottom: 8px; }
        .page-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .page-head__sub { font-family: 'Times New Roman', serif; font-style: italic; color: var(--text-soft); font-size: 16px; }
        .page-head__meta { font-family: monospace; font-size: 11px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; text-align: right; }
        .page-head__meta strong { color: var(--accent); font-weight: 500; }

        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 64px; }
        .stat-card { background: var(--bg-elev); border: 1px solid var(--line-soft); padding: 24px; position: relative; overflow: hidden; transition: border-color .4s var(--ease-quiet); }
        .stat-card:hover { border-color: var(--line); }
        .stat-card__label { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; margin-bottom: 16px; }
        .stat-card__value { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 42px; line-height: 1; margin-bottom: 8px; }
        .stat-card__trend { font-family: monospace; font-size: 11px; color: var(--text-soft); }
        .stat-card__trend.up { color: var(--green); }
        .stat-card__trend.down { color: var(--accent); }

        .section { margin-bottom: 64px; }
        .section__head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px; border-bottom: 1px solid var(--accent); padding-bottom: 12px; }
        .section__title { font-family: 'Times New Roman', serif; font-weight: 700; font-style: italic; font-size: 24px; }
        .section__filters { display: flex; gap: 16px; font-family: monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-mute); align-items: center; }
        .filter-btn { cursor: pointer; padding-bottom: 2px; border-bottom: 1px solid transparent; transition: all .3s; }
        .filter-btn.is-active { color: var(--accent); border-color: var(--accent); }
        .filter-btn:hover { color: var(--text); }
        
        .ep-field { display: flex; flex-direction: column; gap: 8px; }
        .ep-label { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; }
        .ep-input { background: transparent; border: none; border-bottom: 1px solid var(--line); color: var(--text); padding: 12px 0; font-family: 'Times New Roman', serif; font-size: 20px; transition: border-color .3s; outline: none; width: 100%; }
        .ep-input:focus { border-color: var(--accent); }

        .article-table { width: 100%; border-collapse: collapse; }
        .article-table th { text-align: left; font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; padding: 0 16px 16px 0; font-weight: 400; border-bottom: 1px solid var(--line); }
        .article-table td { padding: 20px 16px 20px 0; border-bottom: 1px solid var(--line-soft); vertical-align: middle; transition: background .3s var(--ease-quiet); }
        .article-table tr:hover td { background: rgba(255,255,255,0.015); }
        .article-title { font-family: 'Times New Roman', serif; font-size: 18px; font-weight: 500; line-height: 1.3; margin-bottom: 4px; display: block; color: var(--text); }
        .article-title:hover { color: var(--accent); }
        .article-author { font-family: monospace; font-size: 10px; color: var(--text-mute); letter-spacing: 0.1em; }
        .status { display: inline-flex; align-items: center; gap: 6px; font-family: monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 500; }
        .status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .status--published { color: var(--green); }
        .status--draft { color: var(--text-mute); }
        .table-actions { display: flex; gap: 12px; }
        .table-action { color: var(--text-mute); font-size: 14px; transition: color .3s; cursor: pointer; background: transparent; border: none; padding: 0; text-decoration: none; display: inline-flex; align-items: center; }
        .table-action:hover { color: var(--accent); }
        .table-action.delete:hover { color: var(--red); }

        .rss-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .rss-card { background: var(--bg-elev); padding: 20px; border-left: 2px solid var(--line); transition: border-color .4s var(--ease-quiet); text-decoration: none; color: inherit; display: block; }
        .rss-card:hover { border-left-color: var(--accent); }
        .rss-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .rss-source { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 18px; }
        .rss-count { font-family: monospace; font-size: 10px; color: var(--accent); background: var(--accent-soft); padding: 2px 8px; }
        .rss-latest { font-family: 'Times New Roman', serif; font-size: 15px; color: var(--text-soft); line-height: 1.4; font-style: italic; margin-bottom: 12px; }
        .rss-time { font-family: monospace; font-size: 10px; color: var(--text-mute); letter-spacing: 0.1em; text-transform: uppercase; }

        .team-card { background: var(--bg-elev); border: 1px solid var(--line-soft); padding: 20px; display: flex; align-items: center; justify-content: space-between; }
        .select-group { background: var(--bg); border: 1px solid var(--line); color: var(--text); padding: 8px 12px; font-size: 13px; outline: none; }
        .fade-up { opacity: 0; transform: translateY(24px); transition: opacity .9s var(--ease-quiet), transform .9s var(--ease-quiet); }
        .fade-up.is-in { opacity: 1; transform: none; }
      `}} />

      <div className="app">
        <aside className="sidebar">
          <Link href="/" className="sidebar__logo">Akademy <span>Desk</span></Link>
          <ul className="sidebar__nav">
            <li><a href="#top" className="is-active"><LayoutDashboard className="w-4 h-4" /> Dashboard</a></li>
            <li><a href="#articles"><FileText className="w-4 h-4" /> Articles</a></li>
            <li><a href="#rss"><Radio className="w-4 h-4" /> RSS Feeds</a></li>
            <li><a href="#team"><Users className="w-4 h-4" /> Users & Roles</a></li>
            <li><Link href="/"><LayoutDashboard className="w-4 h-4" /> View Site</Link></li>
          </ul>
          <div className="sidebar__user">
            <div className="avatar">AK</div>
            <div className="user__info">
              <div className="user__name">DJ Akademiks</div>
              <div className="user__role">{userRole || 'Admin'}</div>
            </div>
            <button onClick={handleLogout} style={{ color: '#6e6e6e', transition: 'color 0.3s', cursor: 'pointer', border: 'none', background: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = '#d24239'} onMouseLeave={(e) => e.currentTarget.style.color = '#6e6e6e'}><LogOut className="w-4 h-4" /></button>
          </div>
        </aside>

        <main className="main" id="top">
          <div className="topbar">
            <div className="breadcrumb">Editorial / <strong>Dashboard</strong></div>
            <div className="topbar__actions">
              <div className="search">
                <Search className="w-4 h-4" style={{ color: '#6e6e6e' }} />
                <input type="text" placeholder="Search drafts, articles..." />
              </div>
              <button onClick={() => document.getElementById('manual-entry-input')?.focus()} className="btn btn--primary"><PlusCircle className="w-4 h-4" /> New Article</button>
            </div>
          </div>

          <header className="page-head fade-up">
            <div>
              <h1 className="page-head__title">Admin Desk</h1>
              <div className="page-head__sub">A quiet morning. Six items require your attention.</div>
            </div>
            <div className="page-head__meta">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}<br />
              <strong>{published.length} Published Live</strong>
            </div>
          </header>

          <div className="stats">
            <div className="stat-card fade-up">
              <div className="stat-card__label">Published Live</div>
              <div className="stat-card__value">{published.length.toString().padStart(2, '0')}</div>
              <div className="stat-card__trend up">↑ Live on Site</div>
            </div>
            <div className="stat-card fade-up">
              <div className="stat-card__label">In Drafts</div>
              <div className="stat-card__value">{drafts.length.toString().padStart(2, '0')}</div>
              <div className="stat-card__trend down">↓ Awaiting Review</div>
            </div>
            <div className="stat-card fade-up">
              <div className="stat-card__label">Team Members</div>
              <div className="stat-card__value">{team.length.toString().padStart(2, '0')}</div>
              <div className="stat-card__trend">— Active Roles</div>
            </div>
            <div className="stat-card fade-up">
              <div className="stat-card__label">RSS Imports</div>
              <div className="stat-card__value">{news.length.toString().padStart(3, '0')}</div>
              <div className="stat-card__trend up">↑ Fresh Stories</div>
            </div>
          </div>

          <section className="section fade-up" id="manual-entry">
            <div className="section__head">
              <div className="section__title">Manual Entry</div>
            </div>
            <form onSubmit={handleManualGenerate} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="ep-label" style={{ display: 'block', marginBottom: '8px' }}>Custom Headline</label>
                <input id="manual-entry-input" type="text" className="ep-input" placeholder="Enter a custom headline..." value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} />
              </div>
              <button type="submit" className="btn btn--primary" style={{ height: '42px', padding: '0 24px' }}>Generate Article</button>
            </form>
          </section>

          <section className="section fade-up" id="articles">
            <div className="section__head">
              <div className="section__title">Recent Articles & Drafts</div>
              <div className="section__filters">
                <span className="filter-btn is-active">All</span>
                <span className="filter-btn">Published</span>
                <span className="filter-btn">Drafts</span>
              </div>
            </div>
            <table className="article-table">
              <thead>
                <tr>
                  <th className="col-title">Title</th>
                  <th>Status</th>
                  <th>Last Modified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {published.map((article, idx) => (
                  <tr key={`pub-${idx}`}>
                    <td className="col-title">
                      <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy&edit=true`} className="article-title">{article.title}</Link>
                      <span className="article-author">THE AKADEMY</span>
                    </td>
                    <td><span className="status status--published">Published</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6e6e6e' }}>{new Date(article.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy&edit=true`} className="table-action"><Edit3 className="w-4 h-4" /></Link>
                        {userRole === 'admin' && (
                          <button onClick={() => handleDelete(article.title)} className="table-action delete"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {drafts.map((draft, idx) => (
                  <tr key={`draft-${idx}`}>
                    <td className="col-title">
                      <Link href={`/article?title=${encodeURIComponent(draft.title)}&source=The Akademy&edit=true`} className="article-title">{draft.title}</Link>
                      <span className="article-author">DRAFT</span>
                    </td>
                    <td><span className="status status--draft">Draft</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6e6e6e' }}>{new Date(draft.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <Link href={`/article?title=${encodeURIComponent(draft.title)}&source=The Akademy&edit=true`} className="table-action"><Edit3 className="w-4 h-4" /></Link>
                        {userRole === 'admin' && (
                          <button onClick={() => handleDelete(draft.title)} className="table-action delete"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {published.length === 0 && drafts.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#6e6e6e', padding: '32px 0', fontStyle: 'italic' }}>No articles yet. Generate one from RSS or Manual Entry.</td></tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="section fade-up" id="rss">
            <div className="section__head">
              <div className="section__title">RSS Aggregation</div>
              <div className="section__filters">
                <span className="filter-btn is-active">Active</span>
                <button onClick={handleRefreshRSS} disabled={refreshingRSS} className="btn btn--ghost" style={{ padding: '4px 12px', fontSize: '10px', gap: '6px' }}>
                  <RefreshCw className={`w-3 h-3 ${refreshingRSS ? 'animate-spin' : ''}`} /> {refreshingRSS ? 'Refreshing...' : 'Refresh Feed'}
                </button>
              </div>
            </div>
            <div className="rss-list">
              {news.map((article, idx) => (
                <Link key={idx} href={`/article?title=${encodeURIComponent(article.title)}&source=${article.source}&edit=true`} className="rss-card">
                  <div className="rss-head">
                    <div className="rss-source">{article.source}</div>
                    <div className="rss-count">NEW</div>
                  </div>
                  <div className="rss-latest">"{article.title}"</div>
                  <div className="rss-time">IMPORTED {new Date(article.pubDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </Link>
              ))}
              {news.length === 0 && <div style={{ color: '#6e6e6e', fontStyle: 'italic' }}>Fetching RSS...</div>}
            </div>
          </section>

          {userRole === 'admin' && (
            <section className="section fade-up" id="team">
              <div className="section__head">
                <div className="section__title">Team & Permissions</div>
                <div className="search" style={{ width: 'auto', padding: '4px 12px' }}>
                  <Search className="w-4 h-4" style={{ color: '#6e6e6e' }} />
                  <input type="text" placeholder="Search users..." value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} style={{ fontSize: '12px' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {filteredTeam.map((member) => (
                  <div key={member.id} className="team-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <ShieldCheck className={`w-5 h-5 ${member.role === 'admin' ? 'text-red-600' : member.role === 'editor' ? 'text-blue-500' : 'text-zinc-600'}`} />
                      <div>
                        <p style={{ fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>{member.username || member.id.slice(0, 8)}</p>
                        <p style={{ fontSize: '12px', color: '#6e6e6e', textTransform: 'capitalize' }}>{member.role}</p>
                      </div>
                    </div>
                    <select value={member.role} onChange={(e) => handleRoleChange(member.id, e.target.value)} className="select-group">
                      <option value="user">Standard User</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}