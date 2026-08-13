"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Save, Plus, Trash2, ImagePlus, Loader2, Upload, Tag } from "lucide-react";
import dynamic from 'next/dynamic';
import { supabaseBrowser } from "../utils/supabaseBrowser";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

interface ArticleData {
  takeaways: string[];
  article: string;
  published: boolean;
  thumbnail_url: string | null;
  thumbnail_alt: string;
  thumbnail_caption: string;
  thumbnail_crop: { zoom: number; x: number; y: number };
  tags: string[];
  custom_title: string | null;
  author_name: string;
  published_at: string | null;
}

function ArticleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const titleId = searchParams.get("title") || "The State of Hip-Hop";
  const source = searchParams.get("source") || "News";
  
  const [data, setData] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (session) {
        const { data: profile } = await supabaseBrowser.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile && (profile.role === 'admin' || profile.role === 'editor')) setCanEdit(true);
      }
    };
    checkAuth();

    fetch('/api/article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleId, source }),
    })
      .then(res => res.json())
      .then(data => {
        setData({
          takeaways: data.takeaways || [],
          article: data.article || "",
          published: data.published || false,
          thumbnail_url: data.thumbnail_url || null,
          thumbnail_alt: data.thumbnail_alt || "",
          thumbnail_caption: data.thumbnail_caption || "",
          thumbnail_crop: data.thumbnail_crop || { zoom: 1, x: 50, y: 50 },
          tags: data.tags || [],
          custom_title: data.custom_title || null,
          author_name: data.author_name || 'DJ Akademiks',
          published_at: data.published_at || null
        });
        setIsPublished(data.published || false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [titleId, source, router]);

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
    await fetch('/api/publish', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: titleId }),
    });
    setIsPublished(true); setPublishing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'body' | 'thumb') => {
    const file = e.target.files?.[0];
    if (!file) return; // Guard against undefined

    if (type === 'body') setUploadingImage(true);
    if (type === 'thumb') setUploadingThumb(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
      const imageData = await res.json();
      if (imageData.url) {
        const imageUrl = imageData.url as string; // Explicit type
        if (type === 'body') {
          const imageMarkdown = `\n\n![${data?.thumbnail_alt || 'Image'}](${imageUrl})\n\n`;
          setData(prev => prev ? { ...prev, article: prev.article + imageMarkdown } : null);
        } else {
          setData(prev => prev ? { ...prev, thumbnail_url: imageUrl, thumbnail_crop: { zoom: 1, x: 50, y: 50 } } : null);
        }
      } else {
        alert('Failed to upload image: ' + (imageData.error || 'Unknown error'));
      }
    } catch (error) { alert('Failed to upload image.'); }

    setUploadingImage(false); setUploadingThumb(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (thumbInputRef.current) thumbInputRef.current.value = '';
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const newTags = tagInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    setData(prev => prev ? { ...prev, tags: [...prev.tags, ...newTags] } : null);
    setTagInput("");
  };

  const updateTakeaway = (idx: number, value: string) => {
    setData(prev => { if (!prev) return null; const n = [...prev.takeaways]; n[idx] = value; return { ...prev, takeaways: n }; });
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Loading...</div>;

  const displayTitle = data?.custom_title || titleId;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <Link href={canEdit ? "/admin" : "/news"} className="text-zinc-500 hover:text-red-600 flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors">
            <ArrowLeft className="w-4 h-4" /> {canEdit ? "Back to Admin Feed" : "Back to The Feed"}
          </Link>
          
          {canEdit && (
            <div className="flex gap-2 items-center">
              {isPublished && (
                <span className="text-green-500 text-xs font-bold uppercase flex items-center gap-1 mr-2">
                  <CheckCircle2 className="w-3 h-3" /> Published
                </span>
              )}
              <button onClick={handleSaveDraft} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors bg-zinc-800 hover:bg-zinc-700 text-white disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : isSaved ? "Saved!" : "Save Draft"}
              </button>
              <button onClick={handlePublish} disabled={publishing} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors bg-red-600 hover:bg-red-700 text-white disabled:opacity-50">
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isPublished ? 'Update Article' : 'Push to Public'}
              </button>
            </div>
          )}
        </div>

        {/* UNIFORM THUMBNAIL IMAGE (PUBLIC VIEW) */}
        {!canEdit && data?.thumbnail_url && (
          <figure className="w-full mb-8">
            <div className="w-full aspect-video overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
              <img 
                src={data.thumbnail_url} 
                alt={data.thumbnail_alt || titleId} 
                style={{
                  objectFit: 'cover',
                  objectPosition: `${data.thumbnail_crop?.x || 50}% ${data.thumbnail_crop?.y || 50}%`,
                  transform: `scale(${data.thumbnail_crop?.zoom || 1})`,
                  width: '100%', height: '100%'
                }}
              />
            </div>
            {data.thumbnail_caption && (
              <figcaption className="text-center text-sm text-zinc-500 italic mt-2 px-4">
                {data.thumbnail_caption}
              </figcaption>
            )}
          </figure>
        )}

        <div className="border-b border-zinc-800 pb-6 mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-red-600 mb-4 block">The Akademy</span>
          {canEdit ? (
            <input type="text" value={data?.custom_title || ""} onChange={(e) => setData(prev => prev ? { ...prev, custom_title: e.target.value } : null)} placeholder={titleId} className="w-full bg-transparent text-3xl md:text-4xl font-black tracking-tighter leading-tight text-white focus:outline-none border-b border-zinc-800 focus:border-red-600 transition-colors mb-4" />
          ) : (
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-tight text-white">{displayTitle}</h1>
          )}
          
          <div className="flex items-center gap-4 text-xs text-zinc-500 font-bold uppercase tracking-wider mt-4">
            <span>By <span className="text-zinc-300">{data?.author_name || 'DJ Akademiks'}</span></span>
            {data?.published_at && <span>· {new Date(data.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
          </div>
        </div>

        {data && (
          <div className="space-y-8">
            {/* THUMBNAIL CROPPER & TAGS (ADMIN ONLY) */}
            {canEdit && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Feed Thumbnail</h3>
                    <input type="file" ref={thumbInputRef} onChange={(e) => handleImageUpload(e, 'thumb')} accept="image/*" className="hidden" />
                    <button onClick={() => thumbInputRef.current?.click()} disabled={uploadingThumb} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors bg-zinc-800 border border-zinc-700 text-zinc-300 hover:border-red-600/50 disabled:opacity-50">
                      {uploadingThumb ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />} Upload
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mb-2">Recommended: 1200x675px (16:9). Use sliders to frame image.</p>
                  
                  {/* IMAGE CROPPER UI */}
                  <div className="w-full aspect-video bg-zinc-950 rounded-lg border border-dashed border-zinc-700 overflow-hidden mb-3 relative">
                    {data.thumbnail_url ? (
                      <img 
                        src={data.thumbnail_url} 
                        alt="Thumbnail preview" 
                        style={{
                          objectFit: 'cover',
                          objectPosition: `${data.thumbnail_crop.x}% ${data.thumbnail_crop.y}%`,
                          transform: `scale(${data.thumbnail_crop.zoom})`,
                          width: '100%', height: '100%', transition: 'all 0.2s ease-out'
                        }}
                      />
                    ) : <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">No thumbnail set</div>}
                  </div>

                  {/* CROP CONTROLS */}
                  {data.thumbnail_url && (
                    <div className="space-y-2 mb-3">
                      <div>
                        <label className="text-xs text-zinc-500 flex justify-between"><span>Zoom</span> <span>{data.thumbnail_crop.zoom.toFixed(1)}x</span></label>
                        <input type="range" min="0.5" max="3" step="0.1" value={data.thumbnail_crop.zoom} onChange={(e) => setData(prev => prev ? { ...prev, thumbnail_crop: { ...prev.thumbnail_crop, zoom: parseFloat(e.target.value) } } : null)} className="w-full accent-red-600" />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 flex justify-between"><span>Horizontal</span> <span>{data.thumbnail_crop.x}%</span></label>
                        <input type="range" min="0" max="100" value={data.thumbnail_crop.x} onChange={(e) => setData(prev => prev ? { ...prev, thumbnail_crop: { ...prev.thumbnail_crop, x: parseInt(e.target.value) } } : null)} className="w-full accent-red-600" />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 flex justify-between"><span>Vertical</span> <span>{data.thumbnail_crop.y}%</span></label>
                        <input type="range" min="0" max="100" value={data.thumbnail_crop.y} onChange={(e) => setData(prev => prev ? { ...prev, thumbnail_crop: { ...prev.thumbnail_crop, y: parseInt(e.target.value) } } : null)} className="w-full accent-red-600" />
                      </div>
                    </div>
                  )}

                  <input type="text" value={data.thumbnail_alt} onChange={(e) => setData(prev => prev ? { ...prev, thumbnail_alt: e.target.value } : null)} placeholder="SEO Alt Text (e.g. Drake on livestream)" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600 mb-2" />
                  <input type="text" value={data.thumbnail_caption} onChange={(e) => setData(prev => prev ? { ...prev, thumbnail_caption: e.target.value } : null)} placeholder="Public Caption (e.g. Drake during the viral stream)" className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-red-600" />
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2"><Tag className="w-4 h-4" /> Article Tags</h3>
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} placeholder="Type tags, comma separated" className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-600" />
                    <button onClick={handleAddTag} className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag, idx) => (
                      <span key={idx} className="flex items-center gap-1 bg-red-600/20 text-red-400 border border-red-600/50 text-xs font-bold px-2 py-1 rounded">{tag}<button onClick={() => setData(prev => { if (!prev) return null; const n = [...prev.tags]; n.splice(idx, 1); return { ...prev, tags: n }; })} className="hover:text-white"><Trash2 className="w-3 h-3" /></button></span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Key Takeaways */}
            <div className="bg-red-950/30 border-l-4 border-red-600 rounded-r-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black uppercase tracking-wider text-red-500">Key Takeaways</h2>
              </div>
              <div className="space-y-3">
                {data.takeaways.map((point, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-red-500 font-bold mt-2">•</span>
                    {canEdit ? (
                      <textarea value={point} onChange={(e) => updateTakeaway(idx, e.target.value)} className="flex-1 bg-transparent border border-zinc-700 rounded p-2 text-zinc-200 focus:outline-none focus:border-red-600 resize-none" rows={2} />
                    ) : (
                      <span className="flex-1 leading-relaxed text-zinc-200">{point}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Article Body */}
            <div>
              {canEdit && (
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-black uppercase tracking-wider text-zinc-400">Article Body</h2>
                  <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, 'body')} accept="image/*" className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImage} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors bg-red-600/20 border border-red-600/50 text-red-500 hover:bg-red-600/30 disabled:opacity-50">
                    {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />} Insert Image
                  </button>
                </div>
              )}

              <style>{`
                .w-md-editor-preview img, .prose img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; border: 1px solid #27272a; }
                .uniform-img-container { width: 100%; max-width: 640px; margin: 2rem auto; border-radius: 8px; border: 1px solid #27272a; overflow: hidden; cursor: zoom-in; }
                .uniform-img-container img { width: 100%; height: auto; display: block; }
              `}</style>

              {canEdit ? (
                <div className="prose prose-invert max-w-none">
                  {/* @ts-ignore */}
                  <MDEditor value={data.article} onChange={(val) => setData(prev => prev ? { ...prev, article: val || "" } : null)} height={600} style={{ background: '#09090b', color: 'white' }} />
                </div>
              ) : (
                <div className="prose prose-invert prose-lg max-w-none text-zinc-300 leading-relaxed space-y-6 text-lg">
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <div className="mb-6 leading-relaxed" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-white mt-10 mb-4" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                      img: ({ src, alt }) => (
                        <div className="uniform-img-container" onClick={() => src && window.open(src as string, '_blank')}>
                          <img src={src as string} alt={alt || 'Article image'} />
                        </div>
                      )
                    }}
                  >
                    {data.article}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ArticlePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <ArticleContent />
    </Suspense>
  );
}