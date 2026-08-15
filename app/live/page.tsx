"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SiteNav from "../components/SiteNav";
import SiteFooter from "../components/SiteFooter";

export default function LivePage() {
  const [isLive, setIsLive] = useState(true);
  const [viewers, setViewers] = useState(4200);

  useEffect(() => {
    const interval = setInterval(() => {
      setViewers(prev => prev + Math.floor(Math.random() * 20) - 10);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const pastStreams = [
    { title: "Does the Pop Machine Still Work? Analyzing Q3 Major Label Releases", kicker: "Roundtable", duration: "2:14:33", date: "Nov 17", views: "5.4K", thumb: "https://picsum.photos/seed/vod-stream-1/800/450" },
    { title: "Sitting Down with Backseat Taxi Before Their Debut Drop", kicker: "Interview", duration: "1:45:10", date: "Nov 14", views: "8.1K", thumb: "https://picsum.photos/seed/vod-stream-2/800/450" },
    { title: "Live Listening Party: Kendrick Lamar's 'GNX' Deep Dive", kicker: "Review", duration: "3:02:45", date: "Nov 11", views: "12.3K", thumb: "https://picsum.photos/seed/vod-stream-3/800/450" },
    { title: "The UMG Acquisition: What It Means for Independent Artists", kicker: "News", duration: "1:08:22", date: "Nov 08", views: "3.9K", thumb: "https://picsum.photos/seed/vod-stream-4/800/450" },
    { title: "The Death of the Album Rollout: How Singles Took Over", kicker: "Discussion", duration: "2:30:00", date: "Nov 05", views: "6.7K", thumb: "https://picsum.photos/seed/vod-stream-5/800/450" },
    { title: "First Reactions to the Sabrina Carpenter Album Drop", kicker: "Reaction", duration: "0:54:12", date: "Nov 02", views: "9.2K", thumb: "https://picsum.photos/seed/vod-stream-6/800/450" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <SiteNav activePage="Live" />
      
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --bg: #0a0a0a; --bg-elev: #131313; --text: #ffffff;
          --text-soft: #a8a8a8; --text-mute: #6e6e6e;
          --accent: #d24239; --accent-soft: rgba(210, 66, 57, 0.25);
          --line: rgba(255,255,255,0.10); --line-soft: rgba(255,255,255,0.06);
          --red: #d24239; --green: #6bbf6b;
          --ease-quiet: cubic-bezier(.22, 1, .36, 1);
          --ease-emphasis: cubic-bezier(.16, 1, .3, 1);
        }
        .shell { max-width: 1400px; margin: 0 auto; padding: 48px 32px 80px; }
        .page-head { margin-bottom: 48px; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1px solid var(--line); padding-bottom: 32px; }
        .page-head__left { flex: 1; }
        .page-head__num { font-family: monospace; font-size: 12px; letter-spacing: 0.2em; color: var(--accent); margin-bottom: 12px; display: block; }
        .page-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: clamp(40px, 6vw, 72px); line-height: 0.9; letter-spacing: -0.02em; }
        .page-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }
        .page-head__right { text-align: right; font-family: monospace; font-size: 11px; letter-spacing: 0.14em; color: var(--text-mute); text-transform: uppercase; }
        .page-head__right strong { color: var(--red); font-weight: 500; display: flex; align-items: center; gap: 6px; justify-content: flex-end; }
        .page-head__right strong::before { content: ''; width: 8px; height: 8px; background: var(--red); border-radius: 50%; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .stream-layout { display: grid; grid-template-columns: 1fr 360px; gap: 32px; align-items: start; margin-bottom: 80px; }
        @media (max-width: 1100px) { .stream-layout { grid-template-columns: 1fr; } }

        .player-wrapper { display: flex; flex-direction: column; gap: 24px; }
        .player { width: 100%; aspect-ratio: 16 / 9; background: #000; border: 1px solid var(--line); position: relative; overflow: hidden; }
        .player img { width: 100%; height: 100%; object-fit: cover; opacity: 0.7; filter: contrast(1.1); }
        .player__overlay { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; padding: 20px; background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.8) 100%); }
        .player__top { display: flex; justify-content: space-between; align-items: flex-start; }
        .live-badge { background: var(--red); color: #fff; padding: 4px 12px; font-family: monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
        .live-badge::before { content: ''; width: 6px; height: 6px; background: #fff; border-radius: 50%; animation: pulse 1.5s infinite; }
        .viewer-count { background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); padding: 4px 12px; font-family: monospace; font-size: 10px; letter-spacing: 0.14em; color: var(--text); }
        
        .player__center { display: flex; justify-content: center; align-items: center; }
        .play-btn { width: 80px; height: 80px; border-radius: 50%; border: 1px solid var(--accent); background: rgba(10,10,10,0.6); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; color: var(--accent); font-size: 24px; transition: all .3s var(--ease-quiet); cursor: pointer; }
        .play-btn:hover { background: var(--accent); color: var(--bg); transform: scale(1.05); }

        .player__bottom { display: flex; justify-content: space-between; align-items: flex-end; }
        .stream-time { font-family: monospace; font-size: 11px; color: var(--text-soft); letter-spacing: 0.1em; }
        .quality-pill { font-family: monospace; font-size: 9px; color: var(--accent); border: 1px solid var(--accent-soft); background: rgba(0,0,0,0.6); padding: 4px 8px; letter-spacing: 0.14em; text-transform: uppercase; }

        .stream-info { display: flex; flex-direction: column; gap: 16px; }
        .stream-title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 32px; line-height: 1.1; letter-spacing: -0.01em; }
        .stream-title em { font-style: italic; color: var(--accent); }
        
        .stream-meta { display: flex; align-items: center; gap: 16px; }
        .host-avatar { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; background: var(--bg-elev); border: 1px solid var(--line); }
        .host-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .host-info { flex: 1; }
        .host-name { font-weight: 600; font-size: 14px; }
        .host-role { font-family: monospace; font-size: 10px; color: var(--text-mute); text-transform: uppercase; letter-spacing: 0.12em; }
        
        .stream-tags { display: flex; gap: 8px; flex-wrap: wrap; }
        .tag { font-family: monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-soft); border: 1px solid var(--line); padding: 4px 10px; }

        .stream-actions { display: flex; gap: 12px; margin-top: 8px; }
        .btn { border: none; padding: 12px 24px; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; transition: all .3s var(--ease-quiet); display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
        .btn--primary { background: var(--accent); color: var(--bg); }
        .btn--primary:hover { background: #b91c1c; }
        .btn--ghost { background: transparent; color: var(--text); border: 1px solid var(--line); }
        .btn--ghost:hover { border-color: var(--accent); color: var(--accent); }

        .chat-box { background: var(--bg-elev); border: 1px solid var(--line); display: flex; flex-direction: column; height: 600px; }
        .chat-head { padding: 16px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; }
        .chat-title { font-family: 'Times New Roman', serif; font-style: italic; font-size: 18px; font-weight: 500; }
        .chat-viewers { font-family: monospace; font-size: 10px; color: var(--green); letter-spacing: 0.12em; display: flex; align-items: center; gap: 4px; }
        .chat-viewers::before { content: ''; width: 6px; height: 6px; background: var(--green); border-radius: 50%; }

        .chat-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 16px; scrollbar-width: thin; scrollbar-color: var(--line) transparent; }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-thumb { background: var(--line); }

        .msg { font-size: 13px; line-height: 1.4; }
        .msg__user { font-weight: 700; color: var(--accent); margin-right: 6px; }
        .msg__user.host { color: var(--red); }
        .msg__user.mod { color: var(--green); }
        .msg__badge { font-family: monospace; font-size: 8px; background: var(--line); padding: 2px 4px; margin-right: 4px; letter-spacing: 0.08em; vertical-align: 1px; }
        
        .msg--superchat { background: var(--accent-soft); border-left: 3px solid var(--accent); padding: 12px; margin: -4px -16px; }
        .msg--superchat .msg__user { color: var(--text); }
        .msg--superchat .msg__amount { display: block; font-family: monospace; font-size: 11px; color: var(--accent); font-weight: 700; margin-bottom: 4px; letter-spacing: 0.1em; }
        .msg--superchat .msg__text { font-family: 'Times New Roman', serif; font-style: italic; font-size: 15px; color: var(--text); }

        .chat-input-area { border-top: 1px solid var(--line); padding: 12px; display: flex; align-items: center; gap: 8px; }
        .chat-input { flex: 1; background: var(--bg); border: 1px solid var(--line); color: var(--text); padding: 10px 12px; font-family: 'Inter', sans-serif; font-size: 13px; transition: border-color .3s; }
        .chat-input:focus { outline: none; border-color: var(--accent); }
        .chat-input::placeholder { color: var(--text-mute); }
        
        .chat-dollar { width: 36px; height: 36px; background: transparent; border: 1px solid var(--line); color: var(--accent); font-family: monospace; font-weight: 700; display: flex; align-items: center; justify-content: center; transition: all .3s var(--ease-quiet); cursor: pointer; }
        .chat-dollar:hover { background: var(--accent); color: var(--bg); border-color: var(--accent); }
        .chat-send { width: 36px; height: 36px; background: var(--accent); color: var(--bg); display: flex; align-items: center; justify-content: center; font-weight: 700; transition: background .3s; cursor: pointer; }
        .chat-send:hover { background: #b91c1c; }

        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 32px; border-bottom: 1px solid var(--accent); padding-bottom: 16px; }
        .section-head__left { display: flex; align-items: baseline; gap: 16px; }
        .section-head__num { font-family: monospace; font-size: 11px; letter-spacing: 0.2em; color: var(--accent); }
        .section-head__title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 32px; letter-spacing: -0.01em; }
        .section-head__title em { font-style: italic; font-weight: 400; color: var(--accent); }

        .past-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
        @media (max-width: 900px) { .past-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .past-grid { grid-template-columns: 1fr; } }

        .vod-card { display: flex; flex-direction: column; gap: 14px; text-decoration: none; color: inherit; }
        .vod-thumb { position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: var(--bg-elev); border: 1px solid var(--line-soft); }
        .vod-thumb img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.8) contrast(1.05); transition: transform 1.1s var(--ease-quiet); }
        .vod-card:hover .vod-thumb img { transform: scale(1.04); filter: brightness(0.9); }
        
        .vod-duration { position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); padding: 4px 8px; font-family: monospace; font-size: 10px; letter-spacing: 0.1em; color: var(--text); }
        .vod-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .3s var(--ease-quiet); }
        .vod-play svg { width: 48px; height: 48px; fill: var(--accent); }
        .vod-card:hover .vod-play { opacity: 1; }

        .vod-kicker { font-family: monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); }
        .vod-title { font-family: 'Times New Roman', serif; font-weight: 700; font-size: 20px; line-height: 1.2; }
        .vod-card:hover .vod-title { color: var(--accent); }
        .vod-meta { font-family: monospace; font-size: 10px; color: var(--text-mute); letter-spacing: 0.12em; text-transform: uppercase; }

        .fade-up { opacity: 0; transform: translateY(24px); transition: opacity .9s var(--ease-quiet), transform .9s var(--ease-quiet); }
        .fade-up.is-in { opacity: 1; transform: none; }
        .line-mask { overflow: hidden; display: inline-block; }
        .line-mask__inner { display: block; transform: translateY(110%); transition: transform 1.1s var(--ease-quiet); }
        .line-mask.is-in .line-mask__inner { transform: translateY(0); }
      `}} />

      <div className="shell">
        <header className="page-head fade-up">
          <div className="page-head__left">
            <span className="page-head__num">05 / Broadcast</span>
            <h1 className="page-head__title line-mask"><span className="line-mask__inner"><em>Live</em> Stream</span></h1>
          </div>
          <div className="page-head__right">
            Currently Broadcasting<br />
            <strong>ON AIR</strong>
          </div>
        </header>

        <div className="stream-layout">
          <div className="player-wrapper fade-up">
            <div className="player">
              <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1280&q=80" alt="Live Stream" />
              <div className="player__overlay">
                <div className="player__top">
                  <div className="live-badge">Live</div>
                  <div className="viewer-count">{viewers.toLocaleString()} Watching</div>
                </div>
                <div className="player__center">
                  <button className="play-btn">▶</button>
                </div>
                <div className="player__bottom">
                  <div className="stream-time">Started 1h 24m ago</div>
                  <div className="quality-pill">1080p · 60fps</div>
                </div>
              </div>
            </div>

            <div className="stream-info">
              <h2 className="stream-title">The State of Hip-Hop in 2025: A <em>Live</em> Roundtable</h2>
              
              <div className="stream-meta">
                <div className="host-avatar"><img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80" alt="" /></div>
                <div className="host-info">
                  <div className="host-name">DJ Akademiks</div>
                  <div className="host-role">Host · Editor</div>
                </div>
                <div className="stream-tags">
                  <span className="tag">Hip-Hop</span>
                  <span className="tag">Culture</span>
                  <span className="tag">Roundtable</span>
                </div>
              </div>

              <div className="stream-actions">
                <button className="btn btn--primary">Subscribe</button>
                <button className="btn btn--ghost">⬆ Donate</button>
              </div>
            </div>
          </div>

          <aside className="chat-box fade-up">
            <div className="chat-head">
              <div className="chat-title">Live Chat</div>
              <div className="chat-viewers">{viewers.toLocaleString()} LIVE</div>
            </div>
            
            <div className="chat-messages">
              <div className="msg msg--superchat">
                <span className="msg__amount">⬆ $50.00 · Sarah M.</span>
                <span className="msg__text">Love the insight on the underground scene right now. Keep up the great work!</span>
              </div>
              <div className="msg"><span className="msg__badge">MOD</span><span className="msg__user mod">NightOwl_92:</span> Welcome to the stream everyone. Keep it respectful.</div>
              <div className="msg"><span className="msg__badge">SUB</span><span className="msg__user">VinylCollector_88:</span> This panel is exactly what the genre needed right now.</div>
              <div className="msg"><span className="msg__user">rapfan_99:</span> Are we going to talk about the Kendrick album sales numbers?</div>
              <div className="msg"><span className="msg__badge">HOST</span><span className="msg__user host">DJ Akademiks:</span> We're getting to the sales numbers in 10 minutes. Stay tuned.</div>
              <div className="msg"><span className="msg__user">Sarah_M:</span> The production on that new Backseat Taxi track is insane.</div>
              <div className="msg"><span className="msg__user">beatmaker_x:</span> where can i find the tracklist for this episode?</div>
              <div className="msg"><span className="msg__badge">SUB</span><span className="msg__user">VinylCollector_88:</span> Right? That bassline is crazy.</div>
              <div className="msg"><span className="msg__user">rapfan_99:</span> thanks!</div>
            </div>

            <div className="chat-input-area">
              <input type="text" className="chat-input" placeholder="Send a message..." />
              <button className="chat-dollar" title="Send a Superchat">$</button>
              <button className="chat-send" title="Send">➤</button>
            </div>
          </aside>
        </div>

        <section className="fade-up">
          <div className="section-head">
            <div className="section-head__left">
              <span className="section-head__num">Archive</span>
              <h2 className="section-head__title">Past <em>Broadcasts</em></h2>
            </div>
          </div>

          <div className="past-grid">
            {pastStreams.map((stream, idx) => (
              <Link href="#" key={idx} className="vod-card">
                <div className="vod-thumb">
                  <img src={stream.thumb} alt="" />
                  <div className="vod-duration">{stream.duration}</div>
                  <div className="vod-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div>
                </div>
                <div className="vod-kicker">{stream.kicker}</div>
                <h3 className="vod-title">{stream.title}</h3>
                <div className="vod-meta">{stream.date} · {stream.views} Views</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
}