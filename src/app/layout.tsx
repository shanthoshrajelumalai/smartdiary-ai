import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "SmartDairy AI - Methane Reduction & Feed Optimization Platform",
  description:
    "AI-driven enteric methane reduction and precision Total Mixed Ration (TMR) optimizer for smallholder dairy entrepreneurs in Tamil Nadu. Inspired by Kumaraguru Institutions & Environmental Defense Fund.",
  keywords: [
    "SmartDairy AI",
    "Methane Reduction",
    "Tamil Nadu Dairy",
    "Feed Optimization",
    "Kumaraguru Institutions",
    "Environmental Defense Fund",
    "Gemini 2.5 Flash",
    "Sustainable Agriculture",
  ],
  authors: [{ name: "SmartDairy AI Team - AI Builder Cup 2026" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pointer-events-none" />
        {children}
      </body>
    </html>
  );
}
