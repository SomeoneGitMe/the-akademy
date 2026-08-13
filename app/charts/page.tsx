"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Award } from "lucide-react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

interface ChartItem {
  rank: number; last_week: number; title: string; artist: string; image: string;
  label: string; peak: number; weeks: number; award: string;
}

export default function ChartsPage() {
  const [charts, setCharts] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setCharts([
        { rank: 1, last_week: 1, title: "Not Like Us", artist: "Kendrick Lamar", image: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&w=100&q=80", label: "Interscope", peak: 1, weeks: 12, award: "Diamond" },
        { rank: 2, last_week: 3, title: "STFU", artist: "Drake", image: "https://images.unsplash.com/photo-1605542339524-1b2f8b6c6c1b?auto=format&fit=crop&w=100&q=80", label: "OVO/Republic", peak: 2, weeks: 4, award: "Platinum" },
        { rank: 3, last_week: 2, title: "Luther", artist: "Kendrick Lamar & SZA", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=100&q=80", label: "Interscope", peak: 3, weeks: 5, award: "Gold" },
        { rank: 4, last_week: 4, title: "Dead Fresh", artist: "Lil Baby", image: "https://images.unsplash.com/photo-1571974599782-87624638275ec?auto=format&fit=crop&w=100&q=80", label: "Quality Control", peak: 4, weeks: 8, award: "Gold" },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getTrendIcon = (current: number, last: number) => {
    if (last > current) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (last < current) return <TrendingDown className="w-4 h-4 text-red-500" />;
    if (last === current) return <Minus className="w-4 h-4 text-zinc-500" />;
    return <span className="text-zinc-500 text-xs">NEW</span>;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Charts" />
      
      <header className="page-head">
        <span className="page-head__num fade-up">01 / Streams</span>
        <h1 className="page-head__title line-mask"><span className="line-mask__inner"><em>ChartDemiks</em></span></h1>
        <p className="page-head__dek fade-up">The authoritative source for hip-hop analytics. Real-time rankings, first-week projections, and market share.</p>
      </header>

      <main className="shell">
        <div className="layout">
          <section className="main-col">
            <div className="section-head fade-up">
              <div className="section-head__left">
                <span className="section-head__num">01</span>
                <h3 className="section-head__title"><em>Hot</em> Rap Songs</h3>
              </div>
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-lg overflow-hidden mb-16 fade-up">
              <table className="w-full text-left">
                <thead className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4 font-bold w-12 text-center">#</th>
                    <th className="p-4 font-bold w-12 text-center hidden md:table-cell">Trend</th>
                    <th className="p-4 font-bold">Title & Artist</th>
                    <th className="p-4 font-bold hidden md:table-cell">Label</th>
                    <th className="p-4 font-bold text-center hidden md:table-cell">Award</th>
                    <th className="p-4 font-bold text-center hidden md:table-cell">Peak</th>
                    <th className="p-4 font-bold text-center hidden md:table-cell">Wks</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="p-8 text-center text-zinc-500 animate-pulse">Compiling chart data...</td></tr>
                  ) : (
                    charts.map((item, idx) => (
                      <motion.tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors group" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}>
                        <td className="p-4 text-center"><span className="text-2xl font-black text-zinc-200 group-hover:text-red-500 transition-colors" style={{ fontFamily: 'Times New Roman, serif' }}>{item.rank}</span></td>
                        <td className="p-4 text-center hidden md:table-cell"><div className="flex justify-center">{getTrendIcon(item.rank, item.last_week)}</div></td>
                        <td className="p-4">
                          <div className="flex items-center gap-4">
                            <img src={item.image} alt="" className="w-12 h-12 rounded-md border border-zinc-700 object-cover" />
                            <div>
                              <p className="font-bold text-white group-hover:text-red-500 transition-colors">{item.title}</p>
                              <p className="text-sm text-zinc-400 italic">{item.artist}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell"><span className="text-sm text-zinc-400">{item.label}</span></td>
                        <td className="p-4 text-center hidden md:table-cell">
                          {item.award && <span className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-300 text-xs font-bold px-2 py-1 rounded"><Award className="w-3 h-3 text-yellow-500" /> {item.award}</span>}
                        </td>
                        <td className="p-4 text-center hidden md:table-cell"><span className="font-mono text-zinc-300">{item.peak}</span></td>
                        <td className="p-4 text-center hidden md:table-cell"><span className="font-mono text-zinc-300">{item.weeks}</span></td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="sidebar fade-up">
            <div className="block">
              <div className="block__title">Market Share</div>
              <div className="flex items-center gap-6 mb-6">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="#27272a" strokeWidth="12" fill="none" />
                    <motion.circle cx="48" cy="48" r="40" stroke="#d24239" strokeWidth="12" fill="none" strokeDasharray="251.2" initial={{ strokeDashoffset: 251.2 }} animate={{ strokeDashoffset: 0 }} transition={{ duration: 1.5 }} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-black text-white">100%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Major Labels</p>
                  <p className="text-xs text-zinc-500 italic">Universal, Sony, Warner</p>
                </div>
              </div>
            </div>

            <div className="v-newsletter">
              <div className="v-newsletter__kicker">Alerts</div>
              <h4 className="v-newsletter__title"><em>Chart</em> Updates</h4>
              <p className="v-newsletter__dek">Get weekly first-week projections delivered to your inbox.</p>
              <form className="v-form">
                <input type="email" className="v-input" placeholder="Your email address" required />
                <button type="submit" className="v-btn">Subscribe Free</button>
              </form>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}