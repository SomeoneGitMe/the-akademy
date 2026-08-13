"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

interface PublishedArticle {
  title: string;
  source: string;
  created_at: string;
}

export default function PublicFeedPage() {
  const [articles, setArticles] = useState<PublishedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch only published articles from Supabase
    fetch('/api/published-articles')
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 md:p-16">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-zinc-500 hover:text-red-600 flex items-center gap-2 mb-8 text-sm font-bold uppercase tracking-wider transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to The Akademy
        </Link>

        <div className="border-b border-zinc-800 pb-6 mb-12">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-red-600 mb-2">The Akademy Feed</h1>
          <p className="text-zinc-400 text-lg">The official archive of hip-hop breakdowns and industry news.</p>
        </div>

        {loading ? (
          <div className="text-zinc-500 animate-pulse">Loading the archive...</div>
        ) : articles.length === 0 ? (
          <div className="text-zinc-600 italic">No articles have been published yet. Check back soon.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, idx) => (
              <motion.div 
                key={idx} 
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-red-600/50 transition-all group block"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link href={`/article?title=${encodeURIComponent(article.title)}&source=${article.source}`}>
                  <div className="h-48 bg-zinc-800 flex items-center justify-center text-zinc-700 group-hover:scale-105 transition-transform duration-500">
                    <ExternalLink className="w-8 h-8" />
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-bold uppercase text-red-600 mb-2 block">{article.source}</span>
                    <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-red-500 transition-colors">{article.title}</h3>
                    <p className="text-xs text-zinc-500">{new Date(article.created_at).toLocaleDateString()}</p>
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