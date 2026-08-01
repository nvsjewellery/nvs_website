import { useEffect, useState, useRef } from "react";

// Fallback to your deployed Vercel backend URL if env variable isn't set
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://nvs-website-backend.vercel.app";

type Reel = {
  id: string;
  title?: string;
  instagramUrl: string;
  videoUrl: string;
  isActive: boolean;
  sortOrder: number;
};

export default function InstagramReelsSection() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/reels/active`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.reels)) {
          setReels(data.reels);
        }
      })
      .catch((err) => console.error("Error fetching reels:", err))
      .finally(() => setLoading(false));
  }, []);

  // Hide section completely if there are no active reels and not loading
  if (!loading && reels.length === 0) return null;

  return (
    <section className="py-12 border-t bg-background">
      <div className="container px-4 mx-auto">
        {/* Section Header */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Follow Us On Instagram
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap any reel to watch the full video on Instagram
          </p>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="aspect-[9/16] animate-pulse bg-muted rounded-xl"
              />
            ))}
          </div>
        ) : (
          /* Reels Grid */
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
            {reels.map((reel) => (
              <ReelCard key={reel.id} reel={reel} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ReelCard({ reel }: { reel: Reel }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Force loop strictly at the 5-second mark
    const handleTimeUpdate = () => {
      if (video.currentTime >= 5) {
        video.currentTime = 0;
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  return (
    <a
      href={reel.instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-[9/16] overflow-hidden rounded-xl bg-black shadow-md transition-transform duration-300 hover:scale-[1.02]"
    >
      {/* 5-Second Auto-playing Looping Video */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        autoPlay
        loop
        muted
        playsInline
        className="object-cover w-full h-full transition-opacity duration-300 group-hover:opacity-90"
      />

      {/* Hover Overlay with Instagram Icon */}
      <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/30 group-hover:opacity-100">
        <div className="p-3 text-white backdrop-blur-md rounded-full bg-white/20">
          <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </div>
      </div>

      {/* Title / Caption overlay at bottom */}
      {reel.title && (
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-xs text-white font-medium truncate">
            {reel.title}
          </p>
        </div>
      )}
    </a>
  );
}