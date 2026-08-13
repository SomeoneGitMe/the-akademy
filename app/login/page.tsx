"use client";

import { useState, useEffect } from "react";
import { Radio, Users, MessageSquare, Star, Send } from "lucide-react";
import SiteNav from "../components/SiteNav";

interface Stream { id: string; title: string; date: string; thumbnail: string; duration: string; }

export default function LivePage() {
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    setIsLive(true); setViewers(12453);
    const interval = setInterval(() => { setViewers(prev => prev + Math.floor(Math.random() * 50) - 20); }, 3000);
    return () => clearInterval(interval);
  }, []);

  const pastStreams: Stream[] = [
    { id: "1", title: "Akademiks Night Show: Drake Beef & Industry News", date: "Aug 12, 2026", thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80", duration: "2:45:30" },
    { id: "2", title: "Late Night Hour: Diddy Indictment Breakdown", date: "Aug 10, 2026", thumbnail: "https://images.unsplash.com/photo-1605295322749-6ef2395d4c30?auto=format&fit=crop&w=800&q=80", duration: "3:10:15" },
    { id: "3", title: "Morning Coffee: J Cole Tour & Chart Predictions", date: "Aug 08, 2026", thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80", duration: "1:55:00" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center">
      <SiteNav activePage="Live" />
      
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
        <div className="text-center mb-10 fade-up">
          <Radio className={`w-10 h-10 mx-auto mb-4 ${isLive ? 'text-red-600 animate-pulse' : 'text-zinc-600'}`} />
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-red-600 mb-2" style={{ fontFamily: 'Times New Roman, serif' }}>Akademy Live</h1>
          <p className="text-zinc-400 text-lg italic">The #1 Hip-Hop Live Stream Network</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 text-left">
          {/* LEFT: VIDEO & INFO */}
          <div className="lg:col-span-2 space-y-4 fade-up">
            <div className="w-full aspect-video bg-black rounded-lg border border-zinc-800 overflow-hidden flex items-center justify-center relative">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-600/20 flex items-center justify-center">
                  <Radio className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-zinc-500 text-xs uppercase tracking-widest">Live Video Stream Integration (Amazon IVS)</p>
              </div>
              {isLive && (
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="bg-red-600 text-white text-[10px] font-bold uppercase px-2 py-1 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> Live
                  </span>
                  <span className="bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                    <Users className="w-3 h-3" /> {viewers.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center flex-wrap gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Times New Roman, serif' }}>The Akademiks Night Show</h2>
                <p className="text-xs text-zinc-400 italic">Breaking down the latest in hip-hop, culture, and industry moves.</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-premium">
                  <Star className="w-3.5 h-3.5" /> Subscribe
                </button>
                <button className="btn-premium btn-primary">
                  Donate
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: CHAT */}
          <div className="lg:col-span-1 bg-zinc-900/60 border border-zinc-800 rounded-lg flex flex-col h-[500px] lg:h-[600px] fade-up">
            <div className="p-3 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" /> Live Chat
              </h3>
              <span className="text-[10px] text-zinc-600">Powered by Discord</span>
            </div>
            <div className="flex-1 p-3 space-y-2.5 overflow-y-auto text-sm">
              <div><span className="font-bold text-blue-400 text-xs">@RapFanatic</span> <span className="text-zinc-300 text-xs">Yo Ak, what do you think about the new Drake drop?</span></div>
              <div><span className="font-bold text-green-400 text-xs">@HipHopHead</span> <span className="text-zinc-300 text-xs">Kendrick cleared him easily ngl.</span></div>
              <div><span className="font-bold text-purple-400 text-xs">@IndustryInsider</span> <span className="text-zinc-300 text-xs">Did you see the Billboard numbers today? Insane.</span></div>
              <div><span className="font-bold text-red-400 text-xs">@Akademiks</span> <span className="text-zinc-300 text-xs">We are going live in 5 mins to break it all down.</span></div>
              <div><span className="font-bold text-yellow-400 text-xs">@VibeChecker</span> <span className="text-zinc-300 text-xs">This site is fire btw. Way better than Twitch.</span></div>
            </div>
            <div className="p-3 border-t border-zinc-800">
              <div className="flex gap-2 items-center">
                <input type="text" placeholder="Join the conversation..." className="input-premium !py-2 !text-xs" />
                <button className="btn-premium btn-primary !p-2">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PAST STREAMS */}
        <div className="fade-up text-center">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-6 border-b border-zinc-800 pb-4" style={{ fontFamily: 'Times New Roman, serif' }}>Past Streams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {pastStreams.map((stream, idx) => (
              <div key={idx} className="fade-up cursor-pointer group">
                <div className="aspect-video bg-zinc-800 overflow-hidden relative mb-3 rounded-lg border border-zinc-800">
                  <img src={stream.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Radio className="w-8 h-8 text-white" />
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{stream.duration}</span>
                </div>
                <h3 className="text-sm font-bold leading-tight mb-1 group-hover:text-red-500 transition-colors" style={{ fontFamily: 'Times New Roman, serif' }}>{stream.title}</h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{stream.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}