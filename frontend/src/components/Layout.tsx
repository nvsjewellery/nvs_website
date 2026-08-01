import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import InstagramReelsSection from "./InstagramReelsSection";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1">{children}</main>
      
      {/* 👇 Instagram Reels rendered cleanly above Footer */}
      <InstagramReelsSection />
      
      <Footer />
    </div>
  );
}