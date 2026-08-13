"use client";

import { useState, useEffect } from "react";
import { Radio, Users, MessageSquare, Star } from "lucide-react";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

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
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Live" />
      
      <header className="page-head">
        <span className="page-head__num fade-up">03 / Stream</span>
        <h1 className="page-head__title line-mask"><span className="line-mask__inner"><em>Live</em></span></h1>
        <p className="page-head__dek fade-up">The #1 Hip-Hop Live Stream Network. Exclusive broadcasts, real-time chat, and uncut reactions.</p>
      </header>

      <main className="shell">
        <div className="layout">
          <section className="main-col">
            <article className="hero-story fade-up">
              <div className="hero-story__img relative flex items-center justify-center">
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <Radio className={`w-16 h-16 ${isLive ? 'text-red-600 animate-pulse' : 'text-zinc-600'}`} />
                </div>
                {isLive && (
                  <div className="absolute top-4 left-4 flex items-center gap-3">
                    <span className="bg-red-600 text-white text-xs font-bold uppercase px-2 py-1 rounded flex items-center gap-1">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> Live
                    </span>
                    <span className="bg-black/70 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                      <Users className="w-3 h-3" /> {viewers.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
              <div className="kicker">Live Broadcast · Night Show</div>
              <h2 className="hero-story__title">The Akademiks <em>Night Show</em></h2>
              <p className="hero-story__dek">Breaking down the latest in hip-hop, culture, and industry moves. Unfiltered and uncensored.</p>
              <div className="flex gap-3 mt-4">
                <button className="btn-premium">
                  <Star className="w-4 h-4" /> Subscribe
                </button>
                <button className="btn-premium btn-primary">
                  Donate
                </button>
              </div>
            </article>

            <div className="section-head fade-up">
              <div className="section-head__left">
                <span className="section-head__num">02</span>
                <h3 className="section-head__title"><em>Past</em> Streams</h3>
              </div>
            </div>

            <div className="story-grid">
              {pastStreams.map((stream, idx) => (
                <article className="v-story fade-up" key={idx}>
                  <div className="v-story__image relative">
                    <img src={stream.thumbnail} alt="" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Radio className="w-10 h-10 text-white" />
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{stream.duration}</span>
                  </div>
                  <div className="v-story__kicker">VOD · {stream.date}</div>
                  <h4 className="v-story__title">{stream.title}</h4>
                </article>
              ))}
            </div>
          </section>

          <aside className="sidebar fade-up">
            <div className="block h-[600px] flex flex-col">
              <div className="block__title mb-0">Live Chat</div>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto text-sm">
                <div><span className="font-bold text-blue-400 text-xs">@RapFanatic</span> <span className="text-zinc-300 text-xs">Yo Ak, what do you think about the new Drake drop?</span></div>
                <div><span className="font-bold text-green-400 text-xs">@HipHopHead</span> <span className="text-zinc-300 text-xs">Kendrick cleared him easily ngl.</span></div>
                <div><span className="font-bold text-purple-400 text-xs">@IndustryInsider</span> <span className="text-zinc-300 text-xs">Did you see the Billboard numbers today? Insane.</span></div>
                <div><span className="font-bold text-red-400 text-xs">@Akademiks</span> <span className="text-zinc-300 text-xs">We are going live in 5 mins to break it all down.</span></div>
                <div><span className="font-bold text-yellow-400 text-xs">@VibeChecker</span> <span className="text-zinc-300 text-xs">This site is fire btw. Way better than Twitch.</span></div>
              </div>
              <div className="p-4 border-t border-zinc-800">
                <div className="flex gap-2 items-center">
                  <input type="text" placeholder="Join the conversation..." className="v-input !py-2 !text-xs" />
                  <button className="btn-premium btn-primary !p-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}