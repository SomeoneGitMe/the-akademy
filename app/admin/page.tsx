"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, Lock, LogOut, Plus, FileText, CheckCircle2, Users, ShieldCheck, Search } from "lucide-react";
import { supabaseBrowser } from "../utils/supabaseBrowser";

interface Article { title: string; link: string; contentSnippet: string; source: string; image: string; }
interface Draft { title: string; source: string; created_at: string; }
interface PublishedArticle { title: string; source: string; thumbnail_url: string; created_at: string; }
interface TeamMember { id: string; username: string | null; role: string; }

export default function AdminDashboardPage() {
  const [news, setNews] = useState<Article[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [published, setPublished] = useState<PublishedArticle[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [teamSearch, setTeamSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [manualTitle, setManualTitle] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!session) { router.push("/login"); return; }
      
      const { data: profile } = await supabaseBrowser.from('profiles').select('role').eq('id', session.user.id).single();
      if (profile) {
        setUserRole(profile.role);
        if (profile.role !== 'admin' && profile.role !== 'editor') { router.push("/"); return; }
      } else { router.push("/"); return; }
      
      setAuthChecked(true);

      fetch('/api/news').then(res => res.json()).then(data => { setNews(data.articles); setLoading(false); });
      fetch('/api/drafts').then(res => res.json()).then(data => setDrafts(data.drafts || []));
      fetch('/api/published-articles').then(res => res.json()).then(data => setPublished(data.articles || []));
      fetch('/api/team').then(res => res.json()).then(data => setTeam(data.team || []));
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => { await supabaseBrowser.auth.signOut(); router.push("/"); };
  const handleManualGenerate = (e: React.FormEvent) => { e.preventDefault(); if (!manualTitle.trim()) return; router.push(`/article?title=${encodeURIComponent(manualTitle)}&source=The Akademy`); };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setTeam(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
    await fetch('/api/team', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, newRole }) });
  };

  if (!authChecked) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Verifying Permissions...</div>;

  const dashboardTitle = userRole === 'editor' ? 'Editor Dashboard' : 'Admin Dashboard';
  const filteredTeam = team.filter(m => m.username?.toLowerCase().includes(teamSearch.toLowerCase()) || m.id.toLowerCase().includes(teamSearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 md:p-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-zinc-500 hover:text-red-600 flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors"><ArrowLeft className="w-4 h-4" /> Back to Site</Link>
          <button onClick={handleLogout} className="text-zinc-500 hover:text-red-600 flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors"><LogOut className="w-4 h-4" /> Logout</button>
        </div>

        <div className="border-b border-zinc-800 pb-6 mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-6 h-6 text-red-600" />
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-red-600">{dashboardTitle}</h1>
          </div>
          <p className="text-zinc-400 text-lg">Generate, edit, and publish your editorial pipeline.</p>
        </div>

        {/* TEAM & PERMISSIONS (ADMIN ONLY) */}
        {userRole === 'admin' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2"><Users className="w-6 h-6 text-red-600" /> Team & Permissions</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input type="text" placeholder="Search users..." value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} className="bg-zinc-950 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-red-600 w-64" />
              </div>
            </div>
            <div className="space-y-4">
              {filteredTeam.map((member) => (
                <div key={member.id} className="flex items-center justify-between bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className={`w-5 h-5 ${member.role === 'admin' ? 'text-red-600' : member.role === 'editor' ? 'text-blue-500' : 'text-zinc-600'}`} />
                    <div>
                      <p className="font-bold text-white">{member.username || member.id.slice(0, 8)}</p>
                      <p className="text-xs text-zinc-500 capitalize">{member.role}</p>
                    </div>
                  </div>
                  <select value={member.role} onChange={(e) => handleRoleChange(member.id, e.target.value)} className="bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-600">
                    <option value="user">Standard User</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MANUAL & DRAFTS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Plus className="w-5 h-5 text-red-600" /> Manual Entry</h2>
            <form onSubmit={handleManualGenerate} className="flex gap-2">
              <input type="text" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="Enter a custom headline..." className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-red-600" />
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-3 rounded-lg text-sm uppercase">Generate</button>
            </form>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-red-600" /> Draft Board</h2>
            {drafts.length === 0 ? <p className="text-zinc-600 italic text-sm">No drafts saved.</p> : (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {drafts.map((draft, idx) => (
                  <Link key={idx} href={`/article?title=${encodeURIComponent(draft.title)}&source=The Akademy`} className="block p-3 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-red-600/50 transition-colors">
                    <p className="text-sm font-bold text-white truncate">{draft.title}</p>
                    <p className="text-xs text-zinc-500">{new Date(draft.created_at).toLocaleDateString()}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PUBLISHED ARTICLES */}
        <h2 className="text-2xl font-black uppercase tracking-tight mb-6 border-b border-zinc-800 pb-4 flex items-center gap-2"><CheckCircle2 className="w-6 h-6 text-green-500" /> Published Articles (Live Edit)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {published.map((article, idx) => (
            <Link key={idx} href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-red-600/50 transition-colors group">
              <div className="h-24 bg-zinc-800 overflow-hidden">
                {article.thumbnail_url ? <img src={article.thumbnail_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-zinc-700"><ExternalLink className="w-6 h-6" /></div>}
              </div>
              <div className="p-3"><p className="text-xs font-bold text-white truncate">{article.title}</p></div>
            </Link>
          ))}
        </div>

        {/* RAW RSS FEED */}
        <h2 className="text-2xl font-black uppercase tracking-tight mb-6 border-b border-zinc-800 pb-4">Raw RSS Feed</h2>
        {loading ? <div className="text-zinc-500 animate-pulse">Fetching live news...</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((article, idx) => (
              <motion.div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-red-600/50 transition-all group block" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Link href={`/article?title=${encodeURIComponent(article.title)}&source=${article.source}`}>
                  <div className="h-48 bg-zinc-800 overflow-hidden">
                    {article.image ? <img src={article.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-zinc-700"><ExternalLink className="w-8 h-8" /></div>}
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-bold uppercase text-red-600 mb-2 block">{article.source}</span>
                    <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-red-500 transition-colors">{article.title}</h3>
                    <p className="text-sm text-zinc-400 line-clamp-2">{article.contentSnippet}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}