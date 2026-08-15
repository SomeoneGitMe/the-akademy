🏫The Akademy — Sovereign Media Infrastructure
A custom, AI-driven media platform built to replace standard CMS environments. It auto-generates SEO articles from RSS feeds, tracks Billboard charts, and hosts an uncensored video vault. No algorithms, no demonetization—100% first-party data ownership.

🧠 How It Works
- RSS Aggregation: Ingests trending news from major hip-hop/entertainment outlets.
- AI Engine (Groq): Uses Llama 3.3 (70B) via Groq API to auto-generate 6-paragraph, SEO-optimized articles with Key Takeaways in JSON format.
- Custom CMS: A "Noir Desk" admin dashboard for editors to crop thumbnails, add SEO tags, and push to public.
- Edge Delivery: Built on Next.js App Router for instant static regeneration (ISR) and global CDN caching.

🛠 Tech Stack
- Frontend: Next.js, React, Tailwind CSS, Fira Code, EB Garamond.
- Backend: Node.js, Next.js Server Actions / API Routes.
- Database & Auth: Supabase (PostgreSQL, Row Level Security, Auth, Storage).
- AI Models: Groq (Llama 3.3-70b-versatile).
- Styling: Custom "Noir" design system (Crimson Red / Dark Steel).

💻 Engineering Highlights
- RBAC: Role-Based Access Control (Admin, Editor, User) built natively into Supabase Auth and Next.js middleware.
- Bulletproof Prompting: Groq API forced to output strict JSON formatting for reliable article generation.
- Optimistic UI: Client-side state management for instant tag inputs, image uploads, and draft saving.
- Scalable CDN: Architecture designed to handle 25k+ concurrent viewers via Vercel Edge and Amazon IVS integration.

🚀 Live Demo URL
[N/A]
