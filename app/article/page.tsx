"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Upload, Loader2, CheckCircle2, Edit3, Eye } from "lucide-react";
import dynamic from 'next/dynamic';
import { supabaseBrowser } from "../utils/supabaseBrowser";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface ArticleData {
  takeaways: string[]; article: string; published: boolean;
  thumbnail_url: string | null; thumbnail_alt: string; thumbnail_caption: string;
  thumbnail_crop: { zoom: number; x: number; y: number };
  tags: string[]; custom_title: string | null; author_name: string; published_at: string | null;
}

interface RelatedArticle { title: string; thumbnail_url: string; created_at: string; }

function ArticleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const titleId = searchParams.get("title") || "The State of Hip-Hop";
  const source = searchParams.get("source") || "News";
  const editMode = searchParams.get("edit") === "true";
  const snippet = searchParams.get("snippet") || ""; // FIX: Read snippet from URL for RAG
  
  const [data, setData] = useState<ArticleData | null>(null);
  const [related, setRelated] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [isEditing, setIsEditing] = useState(editMode);
  const [tagInput, setTagInput] = useState("");
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (session) {
        const { data: profile } = await supabaseBrowser.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile && (profile.role === 'admin' || profile.role === 'editor')) {
          setCanEdit(true);
          if (editMode) setIsEditing(true);
        }
      }
    };
    checkAuth();

    // FIX: Pass snippet as sourceText to the backend API
    fetch('/api/article', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleId, source, sourceText: snippet }),
    })
      .then(res => res.json())
      .then((data: any) => {
        setData({
          takeaways: Array.isArray(data.takeaways) ? data.takeaways : [],
          article: data.article || "", 
          published: data.published || false,
          thumbnail_url: data.thumbnail_url || null, 
          thumbnail_alt: data.thumbnail_alt || "",
          thumbnail_caption: data.thumbnail_caption || "", 
          thumbnail_crop: data.thumbnail_crop || { zoom: 1, x: 50, y: 50 },
          tags: Array.isArray(data.tags) ? data.tags : [], 
          custom_title: data.custom_title || null,
          author_name: data.author_name || 'DJ Akademiks', 
          published_at: data.published_at || null
        });
        setIsPublished(data.published || false);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/published-articles')
      .then(res => res.json())
      .then(data => {
        const filtered = (data.articles || []).filter((a: any) => a.title !== titleId).slice(0, 3);
        setRelated(filtered);
      });

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    
    const elements = document.querySelectorAll('.fade-up, .line-mask');
    elements.forEach(el => io.observe(el));

    const handleScroll = () => {
      const winHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight - winHeight;
      const scrollPos = window.scrollY;
      const scrollPercent = (scrollPos / docHeight) * 100;
      const progressBar = document.getElementById('progressBar');
      if (progressBar) progressBar.style.width = scrollPercent + '%';

      const shareBar = document.getElementById('shareBar');
      if (shareBar) {
        if (scrollPos > 400) shareBar.classList.add('is-visible');
        else shareBar.classList.remove('is-visible');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => { window.removeEventListener('scroll', handleScroll); io.disconnect(); };
  }, [titleId, source, router, editMode, snippet]);

  const handleSaveDraft = async () => {
    setSaving(true); setIsSaved(false);
    await fetch('/api/update-article', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleId, source, takeaways: data?.takeaways, article: data?.article, thumbnail_url: data?.thumbnail_url, thumbnail_alt: data?.thumbnail_alt, thumbnail_caption: data?.thumbnail_caption, thumbnail_crop: data?.thumbnail_crop, tags: data?.tags, custom_title: data?.custom_title }),
    });
    setSaving(false); setIsSaved(true); setTimeout(() => setIsSaved(false), 2000);
  };

  const handlePublish = async () => {
    setPublishing(true);
    await fetch('/api/update-article', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleId, source, takeaways: data?.takeaways, article: data?.article, thumbnail_url: data?.thumbnail_url, thumbnail_alt: data?.thumbnail_alt, thumbnail_caption: data?.thumbnail_caption, thumbnail_crop: data?.thumbnail_crop, tags: data?.tags, custom_title: data?.custom_title }),
    });
    await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: titleId }) });
    setIsPublished(true); setPublishing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingThumb(true);
    const formData = new FormData(); formData.append('file', file);
    try {
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      const imageData = await res.json();
      if (imageData.url) {
        const imageUrl = imageData.url as string;
        setData(prev => prev ? { ...prev, thumbnail_url: imageUrl, thumbnail_crop: { zoom: 1, x: 50, y: 50 } } : null);
      } else { alert('Failed to upload image: ' + (imageData.error || 'Unknown error')); }
    } catch (error) { alert('Failed to upload image.'); }
    setUploadingThumb(false);
    if (thumbInputRef.current) thumbInputRef.current.value = '';
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const newTags = tagInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    setData(prev => prev ? { ...prev, tags: [...prev.tags, ...newTags] } : null);
    setTagInput("");
  };

  if (loading) return <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  // EDITOR VIEW (NOIR DESK)
  if (canEdit && isEditing) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#ffffff', border: 'none' }}>
        <style dangerouslySetInnerHTML={{__html: `
          html, body { border: none !important; margin: 0 !important; padding: 0 !important; background-color: #0a0a0a !important; }
          :root { --bg: #0a0a0a; --bg-elev: #131313; --bg-input: #181818; --text: #ffffff; --text-soft: #a8a8a8; --text-mute: #6e6e6e; --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25); --line: rgba(255,255,255,0.05); --line-soft: rgba(255,255,255,0.02); --red: #d24239; --green: #6bbf6b; --ease-quiet: cubic-bezier(.22, 1, .36, 1); }
          .app { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; border: none !important; }
          .sidebar { background: #000; border-right: 1px solid var(--line); position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; padding: 32px 24px; }
          .sidebar__logo { font-family: 'Times New Roman', serif; font-weight: 800; font-size: 28px; margin-bottom: 48px; display: block; color: var(--text); text-decoration: none; }
          .sidebar__logo span { color: var(--accent); font-style: italic; font-weight: 500; font-size: 14px; margin-left: 8px; }
          .sidebar__nav { list-style: none; flex: 1; padding: 0; margin: 0; }
          .sidebar__nav li { margin-bottom: 4px; }
          .sidebar__nav a { display: flex; align-items: center; gap: 12px; padding: 10px 12px; font-size: 13px; font-weight: 500; color: var(--text-soft); border-left: 2px solid transparent; transition: all .3s var(--ease-quiet); text-decoration: none; }
          .sidebar__nav a:hover { color: var(--text); background: var(--bg-elev); }
          .sidebar__nav a.is-active { color: var(--text); border-left-color: var(--accent); background: linear-gradient(90deg, rgba(210, 66, 57, 0.05) 0%, transparent 100%); }
          .sidebar__user { border-top: 1px solid var(--line); padding-top: 24px; display: flex; align-items: center; gap: 12px; }
          .avatar { width: 36px; height: 36px; background: var(--bg-elev); color: var(--accent); display: flex; align-items: center; justify-content: center; font-family: 'Times New Roman', serif; font-weight: 700; font-size: 16px; border: 1px solid var(--line); }
          .user__info { flex: 1; } .user__name { font-size: 13px; font-weight: 600; } .user__role { font-family: monospace; font-size: 9px; color: var(--text-mute); letter-spacing: 0.14em; text-transform: uppercase; }
          .main { padding: 32px 48px 80px; max-width: 1400px; border: none !important; }
          .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 1px solid var(--line); }
          .breadcrumb { font-family: monospace; font-size: 11px; color: var(--text-mute); text-transform: uppercase; }
          .breadcrumb strong { color: var(--text); } .breadcrumb span { color: var(--accent); margin: 0 8px; }
          .topbar__actions { display: flex; gap: 12px; align-items: center; }
          .status-pill { font-family: monospace; font-size: 10px; color: var(--text-mute); text-transform: uppercase; border: 1px solid var(--line); padding: 6px 12px; display: flex; align-items: center; gap: 6px; }
          .status-pill::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--text-mute); } .status-pill.is-draft::before { background: var(--accent); }
          .btn { border: none; padding: 8px 18px; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; transition: all .3s var(--ease-quiet); display: inline-flex; align-items: center; gap: 8px; cursor: pointer; text-decoration: none; }
          .btn--ghost { background: transparent; color: var(--text-soft); border: 1px solid var(--line); } .btn--ghost:hover { border-color: var(--text-soft); color: var(--text); }
          .btn--primary { background: var(--accent); color: #fff; } .btn--primary:hover { background: #b91c1c; }
          .btn--red { background: var(--red); color: #fff; } .btn--red:hover { background: #b91c1c; }
          .editor-layout { display: grid; grid-template-columns: 1fr 340px; gap: 64px; align-items: start; }
          @media (max-width: 1100px) { .editor-layout { grid-template-columns: 1fr; } }
          .editor-main { display: flex; flex-direction: column; gap: 40px; }
          .field { display: flex; flex-direction: column; gap: 10px; }
          .label { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; color: var(--text-mute); text-transform: uppercase; display: flex; justify-content: space-between; align-items: center; }
          .title-input { background: transparent; border: none; color: var(--text); font-family: 'Times New Roman', serif; font-weight: 700; font-size: 42px; line-height: 1.1; padding: 0; width: 100%; }
          .title-input::placeholder { color: var(--line); } .title-input:focus { outline: none; }
          .slug-input { background: transparent; border: none; border-bottom: 1px solid var(--line); color: var(--text-mute); font-family: monospace; font-size: 12px; padding: 4px 0; width: 100%; } .slug-input:focus { outline: none; border-color: var(--accent); color: var(--accent); }
          .editor-sidebar { position: sticky; top: 32px; display: flex; flex-direction: column; gap: 32px; }
          .box { background: var(--bg-elev); border: 1px solid var(--line-soft); padding: 24px; }
          .box__title { font-family: monospace; font-size: 10px; letter-spacing: 0.2em; color: var(--accent); text-transform: uppercase; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; }
          .publish-box { background: var(--bg-elev); border-left: 2px solid var(--accent); }
          .publish-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--line-soft); font-size: 13px; } .publish-row:last-child { border-bottom: none; padding-bottom: 0; } .publish-row span { color: var(--text-soft); } .publish-row strong { font-weight: 500; }
          .btn-block { width: 100%; justify-content: center; padding: 12px; margin-top: 16px; }
          .tags-list { display: flex; flex-wrap: wrap; gap: 8px; }
          .tag { font-family: monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); background: var(--accent-soft); padding: 4px 10px; display: inline-flex; align-items: center; gap: 6px; }
          .tag span { cursor: pointer; opacity: 0.6; transition: opacity .3s; } .tag span:hover { opacity: 1; color: var(--red); }
          .add-tag { background: transparent; border: 1px dashed var(--line); color: var(--text-mute); padding: 4px 10px; font-family: monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; } .add-tag:hover { border-color: var(--accent); color: var(--accent); }

          /* THUMBNAIL CROPPER UI */
          .thumb-preview { width: 100%; max-width: 400px; aspect-ratio: 16/9; overflow: hidden; background: var(--bg); border: 1px solid var(--line); margin-bottom: 12px; position: relative; }
          .thumb-preview img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.1s ease-out; }
          .crop-control { margin-bottom: 12px; max-width: 400px; }
          .crop-label { display: flex; justify-content: space-between; font-family: monospace; font-size: 10px; color: var(--text-mute); margin-bottom: 4px; text-transform: uppercase; }
          .crop-slider { width: 100%; accent-color: var(--accent); }
          .meta-input { width: 100%; max-width: 400px; background: var(--bg); border: 1px solid var(--line); color: var(--text); padding: 8px 12px; font-family: 'Inter', sans-serif; font-size: 12px; margin-bottom: 8px; }
          .meta-input:focus { outline: none; border-color: var(--accent); }

          /* BULLETPROOF MARKDOWN EDITOR DARK MODE FIX & BORDER REMOVAL */
          [data-color-mode="dark"] .w-md-editor { background-color: #0a0a0a !important; color: #ffffff !important; border: none !important; box-shadow: none !important; }
          [data-color-mode="dark"] .w-md-editor-toolbar { background-color: #131313 !important; border: none !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
          [data-color-mode="dark"] .w-md-editor-toolbar li button { color: #a8a8a8 !important; }
          [data-color-mode="dark"] .w-md-editor-toolbar li button:hover { color: #d24239 !important; }
          [data-color-mode="dark"] .w-md-editor-content { background-color: #0a0a0a !important; border: none !important; }
          [data-color-mode="dark"] .w-md-editor-text { background-color: #0a0a0a !important; border: none !important; }
          
          /* High specificity override for the textarea text color */
          [data-color-mode="dark"] .w-md-editor-text-pre, 
          [data-color-mode="dark"] .w-md-editor-text-input,
          [data-color-mode="dark"] textarea.w-md-editor-text-input,
          [data-color-mode="dark"] .w-md-editor-input { 
            color: #ffffff !important; 
            -webkit-text-fill-color: #ffffff !important;
            background-color: #0a0a0a !important; 
            caret-color: #d24239 !important;
            border: none !important;
          }
          
          [data-color-mode="dark"] .w-md-editor-preview { background-color: #0a0a0a !important; color: #ffffff !important; padding: 24px !important; border: none !important; }
          [data-color-mode="dark"] .w-md-editor-preview * { color: #ffffff !important; }
          [data-color-mode="dark"] .w-md-editor-preview .cm-header, 
          [data-color-mode="dark"] .w-md-editor-preview h1, 
          [data-color-mode="dark"] .w-md-editor-preview h2 { color: #ffffff !important; }
        `}} />
        <input type="file" ref={thumbInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
        <div className="app">
          <aside className="sidebar">
            <Link href="/" className="sidebar__logo">Akademy <span>Desk</span></Link>
            <ul className="sidebar__nav">
              <li><Link href="/admin"><span className="icon">■</span> Dashboard</Link></li>
              <li><Link href="/news"><span className="icon">▤</span> Published</Link></li>
              <li><Link href="/admin#rss"><span className="icon">◷</span> RSS Feeds</Link></li>
            </ul>
            <div className="sidebar__user">
              <div className="avatar">AK</div>
              <div className="user__info">
                <div className="user__name">DJ Akademiks</div>
                <div className="user__role">Editor</div>
              </div>
              <button onClick={() => setIsEditing(false)} className="text-zinc-500 hover:text-red-500 transition-colors"><Eye className="w-4 h-4" /></button>
            </div>
          </aside>

          <main className="main">
            <div className="topbar">
              <div className="breadcrumb">Articles <span>/</span> Drafts <span>/</span> <strong>{titleId.substring(0, 20)}...</strong></div>
              <div className="topbar__actions">
                <div className={`status-pill ${isPublished ? '' : 'is-draft'}`}>{isPublished ? 'Published' : 'Draft'}</div>
                <button onClick={handleSaveDraft} disabled={saving} className="btn btn--ghost">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Save className="w-4 h-4" />}
                  {saving ? "Saving..." : isSaved ? "Saved!" : "Save Draft"}
                </button>
                <button onClick={handlePublish} disabled={publishing || isPublished} className="btn btn--red">
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {isPublished ? 'Published' : 'Push to Public'}
                </button>
              </div>
            </div>

            <div className="editor-layout">
              <div className="editor-main">
                <div className="field">
                  <label className="label">Headline</label>
                  <input type="text" className="title-input" value={data?.custom_title || ""} onChange={(e) => setData(prev => prev ? { ...prev, custom_title: e.target.value } : null)} placeholder={titleId} />
                </div>
                <div className="field">
                  <label className="label">URL Slug</label>
                  <input type="text" className="slug-input" value={`theakademy.com/news/${titleId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`} readOnly />
                </div>
                
                {/* THUMBNAIL CROPPER & META */}
                <div className="field">
                  <label className="label">Feed Thumbnail (16:9 Ratio)</label>
                  <div className="thumb-preview">
                    {data?.thumbnail_url ? (
                      <img 
                        src={data.thumbnail_url} 
                        alt="Thumbnail preview" 
                        style={{
                          objectFit: 'cover',
                          objectPosition: `${data.thumbnail_crop.x}% ${data.thumbnail_crop.y}%`,
                          transform: `scale(${data.thumbnail_crop.zoom})`
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">No thumbnail set</div>
                    )}
                  </div>

                  {data?.thumbnail_url && (
                    <div className="mb-4">
                      <div className="crop-control">
                        <div className="crop-label"><span>Zoom</span> <span>{data.thumbnail_crop.zoom.toFixed(1)}x</span></div>
                        <input type="range" min="1" max="3" step="0.1" value={data.thumbnail_crop.zoom} onChange={(e) => setData(prev => prev ? { ...prev, thumbnail_crop: { ...prev.thumbnail_crop, zoom: parseFloat(e.target.value) } } : null)} className="crop-slider" />
                      </div>
                      <div className="crop-control">
                        <div className="crop-label"><span>Horizontal</span> <span>{data.thumbnail_crop.x}%</span></div>
                        <input type="range" min="0" max="100" value={data.thumbnail_crop.x} onChange={(e) => setData(prev => prev ? { ...prev, thumbnail_crop: { ...prev.thumbnail_crop, x: parseInt(e.target.value) } } : null)} className="crop-slider" />
                      </div>
                      <div className="crop-control">
                        <div className="crop-label"><span>Vertical</span> <span>{data.thumbnail_crop.y}%</span></div>
                        <input type="range" min="0" max="100" value={data.thumbnail_crop.y} onChange={(e) => setData(prev => prev ? { ...prev, thumbnail_crop: { ...prev.thumbnail_crop, y: parseInt(e.target.value) } } : null)} className="crop-slider" />
                      </div>
                    </div>
                  )}

                  <button onClick={() => thumbInputRef.current?.click()} disabled={uploadingThumb} className="btn btn--ghost" style={{ width: '100%', maxWidth: '400px', justifyContent: 'center' }}>
                    {uploadingThumb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} 
                    {uploadingThumb ? "Uploading..." : "Upload Image"}
                  </button>

                  <div className="mt-4">
                    <input type="text" className="meta-input" placeholder="SEO Alt Text (e.g. Drake on livestream)" value={data?.thumbnail_alt || ""} onChange={(e) => setData(prev => prev ? { ...prev, thumbnail_alt: e.target.value } : null)} />
                    <input type="text" className="meta-input" placeholder="Public Caption (e.g. Drake during the viral stream)" value={data?.thumbnail_caption || ""} onChange={(e) => setData(prev => prev ? { ...prev, thumbnail_caption: e.target.value } : null)} />
                  </div>
                </div>

                {/* ARTICLE BODY EDITOR */}
                <div className="field">
                  <label className="label">Article Body</label>
                  {/* Applied data-color-mode="dark" directly to the wrapper to fix the invisible text issue */}
                  <div data-color-mode="dark" style={{ backgroundColor: '#0a0a0a', border: 'none' }}>
                    {/* @ts-ignore */}
                    <MDEditor 
                      value={data?.article || ""} 
                      onChange={(val) => setData(prev => prev ? { ...prev, article: val || "" } : null)}
                      height={600}
                      preview="live"
                    />
                  </div>
                </div>
              </div>

              <aside className="editor-sidebar">
                <div className="box publish-box">
                  <div className="box__title">Push to Public <span style={{ color: 'var(--text-mute)' }}>⚙</span></div>
                  <div className="publish-row"><span>Author</span><strong>{data?.author_name || 'DJ Akademiks'}</strong></div>
                  <div className="publish-row"><span>Schedule</span><strong>Immediately</strong></div>
                  <div className="publish-row"><span>Visibility</span><strong>Public</strong></div>
                  {!isPublished && <button onClick={handlePublish} disabled={publishing} className="btn btn--red btn-block">{publishing ? "Publishing..." : "Push to Public"}</button>}
                </div>
                <div className="box">
                  <div className="box__title">Article Tags</div>
                  <div className="tags-list">
                    {data?.tags.map((tag, idx) => (
                      <div key={idx} className="tag">
                        {tag}
                        <span onClick={() => setData(prev => {
                          if (!prev) return null;
                          const n = [...prev.tags];
                          n.splice(idx, 1);
                          return { ...prev, tags: n };
                        })}>✕</span>
                      </div>
                    ))}
                    <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} placeholder="+ Add Tag" className="add-tag" style={{ width: '100px' }} />
                  </div>
                </div>
              </aside>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // PUBLIC READER VIEW (VULTURE NOIR PROTOTYPE)
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#ffffff', border: 'none' }}>
      <style dangerouslySetInnerHTML={{__html: `
        html, body { border: none !important; margin: 0 !important; padding: 0 !important; background-color: #0a0a0a !important; }
        :root { --bg: #0a0a0a; --bg-elev: #131313; --text: #ffffff; --text-soft: #a8a8a8; --text-mute: #6e6e6e; --text-body: #d4d4d4; --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25); --line: rgba(255,255,255,0.05); --line-soft: rgba(255,255,255,0.02); --red: #d24239; --ease-quiet: cubic-bezier(.22, 1, .36, 1); }
        .progress-container { position: fixed; top: 0; left: 0; width: 100%; height: 2px; background: transparent; z-index: 200; }
        .progress-bar { height: 100%; width: 0%; background: var(--accent); transition: width .1s linear; }
        .article-shell { max-width: 800px; margin: 0 auto; padding: 64px 32px 80px; position: relative; border: none !important; }
        .breadcrumb { font-family: monospace; font-size: 11px; color: var(--text-mute); text-transform: uppercase; margin-bottom: 32px; display: flex; gap: 8px; }
        .breadcrumb strong { color: var(--text); } .breadcrumb span { color: var(--accent); }
        .article-head { margin-bottom: 48px; text-align: center; }
        .article-kicker { font-family: monospace; font-size: 11px; color: var(--accent); text-transform: uppercase; margin-bottom: 24px; display: block; }
        .article-title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: clamp(36px, 5vw, 56px); line-height: 1.05; margin-bottom: 24px; }
        .article-title em { font-style: italic; }
        .article-dek { font-family: 'Times New Roman', serif; font-size: 22px; line-height: 1.4; color: var(--text-soft); max-width: 680px; margin: 0 auto 32px; font-style: italic; }
        .article-meta { display: flex; justify-content: center; align-items: center; gap: 24px; font-family: monospace; font-size: 11px; color: var(--text-mute); text-transform: uppercase; }
        .article-meta strong { color: var(--text); }
        .meta-dot { width: 4px; height: 4px; background: var(--text-mute); border-radius: 50%; }
        .article-hero { width: 100%; aspect-ratio: 16 / 9; overflow: hidden; margin-bottom: 16px; background: var(--bg-elev); position: relative; border: none !important; }
        .article-hero img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.9) contrast(1.1); }
        .hero-caption { font-family: monospace; font-size: 10px; color: var(--text-mute); margin-bottom: 64px; text-align: right; }
        .article-body { font-family: 'Times New Roman', serif; font-size: 19px; line-height: 1.8; color: var(--text-body); border: none !important; }
        .article-body p { margin-bottom: 32px; }
        .article-body p:first-of-type::first-letter { font-size: 5em; float: left; line-height: 0.8; padding-right: 16px; padding-top: 8px; color: var(--accent); font-weight: 700; }
        .article-body h2 { font-size: 32px; font-weight: 700; margin-top: 64px; margin-bottom: 24px; line-height: 1.1; }
        .article-body h2 em { font-style: italic; color: var(--accent); }
        .pullquote { border-left: 2px solid var(--accent); padding: 24px 0 24px 32px; margin: 48px 0; font-style: italic; font-size: 28px; line-height: 1.3; color: var(--text); }
        .pullquote span { display: block; font-size: 14px; font-family: monospace; font-style: normal; color: var(--text-mute); margin-top: 16px; letter-spacing: 0.1em; text-transform: uppercase; }
        .share-bar { position: absolute; left: -80px; top: 300px; display: flex; flex-direction: column; gap: 16px; align-items: center; opacity: 0; transition: opacity .5s var(--ease-quiet); }
        .share-bar.is-visible { opacity: 1; }
        .share-line { width: 1px; height: 40px; background: var(--line); }
        .share-btn { width: 32px; height: 32px; border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; font-size: 12px; color: var(--text-mute); transition: all .3s var(--ease-quiet); text-decoration: none; }
        .share-btn:hover { border-color: var(--accent); color: var(--accent); }
        @media (max-width: 1000px) { .share-bar { display: none; } }
        .article-footer { margin-top: 80px; padding-top: 48px; border-top: 1px solid var(--line); }
        .tags-list { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 48px; justify-content: center; }
        .tag { font-family: monospace; font-size: 10px; color: var(--text-soft); border: 1px solid var(--line); padding: 4px 12px; text-decoration: none; }
        .tag:hover { border-color: var(--accent); color: var(--accent); }
        .author-box { display: flex; gap: 24px; align-items: center; background: var(--bg-elev); padding: 32px; border-left: 2px solid var(--accent); }
        .author-avatar { width: 64px; height: 64px; background: var(--bg); border: 1px solid var(--line); display: flex; align-items: center; justify-content: center; font-family: 'Times New Roman', serif; font-size: 24px; font-weight: 700; color: var(--accent); flex-shrink: 0; }
        .author-info h4 { font-family: 'Times New Roman', serif; font-size: 22px; font-weight: 700; margin-bottom: 4px; }
        .author-info p { font-family: 'Times New Roman', serif; font-style: italic; color: var(--text-soft); font-size: 15px; }
        .related-section { background: var(--bg-elev); padding: 80px 32px; border-top: 1px solid var(--line); }
        .related-inner { max-width: 1200px; margin: 0 auto; }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 32px; border-bottom: 1px solid var(--accent); padding-bottom: 12px; }
        .section-head__left { display: flex; align-items: baseline; gap: 16px; }
        .section-head__num { font-family: monospace; font-size: 11px; color: var(--accent); }
        .section-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 28px; }
        .section-head__title em { font-style: italic; color: var(--accent); }
        .related-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
        @media (max-width: 900px) { .related-grid { grid-template-columns: 1fr; } }
        .story { display: flex; flex-direction: column; gap: 14px; text-decoration: none; color: inherit; }
        .story__image { width: 100%; aspect-ratio: 4 / 3; overflow: hidden; background: var(--bg); }
        .story__image img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.85); transition: transform 1.1s var(--ease-quiet); }
        .story:hover .story__image img { transform: scale(1.03); }
        .story__kicker { font-family: monospace; font-size: 10px; color: var(--accent); text-transform: uppercase; }
        .story__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 20px; line-height: 1.2; }
        .story:hover .story__title { color: var(--accent); }
        .story__meta { font-family: monospace; font-size: 10px; color: var(--text-mute); text-transform: uppercase; }
        .fade-up { opacity: 0; transform: translateY(24px); transition: opacity .9s var(--ease-quiet), transform .9s var(--ease-quiet); }
        .fade-up.is-in { opacity: 1; transform: none; }
        .line-mask { overflow: hidden; display: inline-block; }
        .line-mask__inner { display: block; transform: translateY(110%); transition: transform 1.1s var(--ease-quiet); }
        .line-mask.is-in .line-mask__inner { transform: translateY(0); }
        .edit-btn { position: fixed; bottom: 32px; right: 32px; background: var(--accent); color: #fff; padding: 16px 24px; font-family: monospace; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border: none; cursor: pointer; z-index: 100; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 20px rgba(210, 66, 57, 0.4); }
        .edit-btn:hover { background: #b91c1c; }
      `}} />

      <SiteNav activePage="News" />

      <div className="progress-container">
        <div className="progress-bar" id="progressBar"></div>
      </div>

      <article className="article-shell">
        <div className="breadcrumb fade-up">
          The Akademy <span>/</span> News <span>/</span> <strong>Article</strong>
        </div>

        <div className="share-bar" id="shareBar">
          <div className="share-line"></div>
          <a href="#" className="share-btn">↗</a>
          <a href="#" className="share-btn">✦</a>
          <a href="#" className="share-btn">⌕</a>
          <div className="share-line"></div>
        </div>

        <header className="article-head fade-up">
          <span className="article-kicker">The Akademy · Breaking</span>
          <h1 className="article-title line-mask"><span className="line-mask__inner">{data?.custom_title || titleId}</span></h1>
          <p className="article-dek">{data?.takeaways?.[0] || "An exclusive breakdown of the latest developments."}</p>
          <div className="article-meta">
            <span>By <strong>{data?.author_name || 'DJ Akademiks'}</strong></span>
            <div className="meta-dot"></div>
            <span>{data?.published_at ? new Date(data.published_at).toLocaleDateString() : new Date().toLocaleDateString()}</span>
            <div className="meta-dot"></div>
            <span>5 min read</span>
          </div>
        </header>

        <figure className="article-hero fade-up">
          <img 
            src={data?.thumbnail_url || "https://images.unsplash.com/photo-1605295322749-6ef2395d4c30?auto=format&fit=crop&w=1200&q=80"} 
            alt={data?.thumbnail_alt || titleId} 
            style={{
              objectPosition: `${data?.thumbnail_crop?.x || 50}% ${data?.thumbnail_crop?.y || 50}%`,
              transform: `scale(${data?.thumbnail_crop?.zoom || 1})`
            }}
          />
          {data?.thumbnail_caption && <figcaption className="hero-caption">{data.thumbnail_caption}</figcaption>}
        </figure>

        <div className="article-body fade-up">
          <ReactMarkdown
            components={{
              p: ({node, ...props}) => <p {...props} />,
              h2: ({node, ...props}) => <h2 {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="pullquote" {...props} />,
              strong: ({node, ...props}) => <strong style={{ color: 'var(--text)' }} {...props} />,
            }}
          >
            {data?.article || ""}
          </ReactMarkdown>
        </div>

        <footer className="article-footer fade-up">
          <div className="tags-list">
            {data?.tags.map((tag, idx) => (
              <span key={idx} className="tag">{tag}</span>
            ))}
          </div>
          <div className="author-box">
            <div className="author-avatar">AK</div>
            <div className="author-info">
              <h4>DJ Akademiks</h4>
              <p>The #1 source for hip-hop media, charts, and industry breakdowns.</p>
            </div>
          </div>
        </footer>
      </article>

      <section className="related-section">
        <div className="related-inner">
          <div className="section-head fade-up">
            <div className="section-head__left">
              <span className="section-head__num">Next Up</span>
              <h2 className="section-head__title">More <em>Coverage</em></h2>
            </div>
          </div>
          <div className="related-grid">
            {related.map((article, idx) => (
              <Link href={`/article?title=${encodeURIComponent(article.title)}&source=The Akademy`} key={idx} className="story fade-up">
                <div className="story__image">
                  <img src={article.thumbnail_url || `https://picsum.photos/seed/related-${idx}/600/450`} alt="" />
                </div>
                <div className="story__kicker">The Akademy</div>
                <h3 className="story__title">{article.title}</h3>
                <div className="story__meta">{new Date(article.created_at).toLocaleDateString()}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />

      {canEdit && !isEditing && (
        <button className="edit-btn" onClick={() => setIsEditing(true)}>
          <Edit3 className="w-4 h-4" /> Edit Article
        </button>
      )}
    </div>
  );
}

export default function ArticlePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }} />}>
      <ArticleContent />
    </Suspense>
  );
}