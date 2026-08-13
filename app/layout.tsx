import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Akademy | Hip-Hop Media & Industry",
  description: "The #1 Hub for Hip-Hop Media, Charts, and Industry Breakdowns by DJ Akademiks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}