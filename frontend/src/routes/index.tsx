
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  X,
  Images,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { OrnamentalDivider } from "@/components/OrnamentalDivider";

// ======================================================
// ROUTE
// ======================================================

export const Route = createFileRoute("/")({
  component: Home,
});

// ======================================================
// ORIGINAL HERO BANNER - RESTORED
// ======================================================

const HERO_SLIDES = [
  {
    title: "Everyday Gold,",
    highlight: "Timeless Sparkle",
    subtitle:
      "Certified craftsmanship since 1978. Discover heirloom pieces crafted for modern elegance.",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1920&auto=format&fit=crop",
    linkText: "Shop Gold Collection",
    linkUrl: "/gold",
  },
  {
    title: "Graceful Heritage,",
    highlight: "Royal Bridal Edits",
    subtitle:
      "Intricately detailed temple and bridal jewellery designed to make your special moments eternal.",
    image:
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1920&auto=format&fit=crop",
    linkText: "Explore Bridal Line",
    linkUrl: "/gold",
  },
  {
    title: "Pure & Radiant,",
    highlight: "Silver Craftsmanship",
    subtitle:
      "Hallmarked sterling silver and fine bullion articles styled for contemporary everyday luxury.",
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1920&auto=format&fit=crop",
    linkText: "Discover Silver",
    linkUrl: "/silver",
  },
];

// ======================================================
// STATIC SILVER PHOTOS
// photo1.jpg to photo65.jpg
// Files must be in /public
// ======================================================

const SILVER_PHOTOS = Array.from(
  { length: 65 },
  (_, index) => ({
    id: index + 1,
    image: `/photo${index + 1}.jpg`,
    name: `Silver Design ${index + 1}`,
  })
);

// ======================================================
// HOME
// ======================================================

function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const [selectedImage, setSelectedImage] = useState<
    number | null
  >(null);

  // Original automatic banner transition
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(
        (prev) => (prev + 1) % HERO_SLIDES.length
      );
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const closePreview = () => setSelectedImage(null);

  const nextImage = () => {
    setSelectedImage((current) =>
      current === null
        ? null
        : (current + 1) % SILVER_PHOTOS.length
    );
  };

  const previousImage = () => {
    setSelectedImage((current) =>
      current === null
        ? null
        : (current - 1 + SILVER_PHOTOS.length) %
          SILVER_PHOTOS.length
    );
  };

  // Fullscreen image keyboard navigation
  useEffect(() => {
    if (selectedImage === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePreview();
      }

      if (event.key === "ArrowRight") {
        setSelectedImage((current) =>
          current === null
            ? null
            : (current + 1) % SILVER_PHOTOS.length
        );
      }

      if (event.key === "ArrowLeft") {
        setSelectedImage((current) =>
          current === null
            ? null
            : (current - 1 + SILVER_PHOTOS.length) %
              SILVER_PHOTOS.length
        );
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
      document.body.style.overflow = "";
    };
  }, [selectedImage]);

  return (
    <Layout>
      {/* ============================================
          ORIGINAL HERO CAROUSEL - UNCHANGED
      ============================================ */}

      <section className="relative h-[75vh] min-h-[480px] max-h-[680px] overflow-hidden bg-black">
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentSlide
                ? "opacity-100 z-10 pointer-events-auto"
                : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-[4500ms] ease-out"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent max-w-3xl" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center">
              <div className="max-w-xl space-y-4">
                <p className="label-caps text-[color:var(--gold)] text-xs tracking-widest font-semibold uppercase">
                  NVS Jewellery Presents
                </p>

                <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-[1.1] text-white">
                  {slide.title}
                  <br />
                  <span className="text-[color:var(--gold)] italic font-serif">
                    {slide.highlight}
                  </span>
                </h1>

                <p className="text-white/85 text-sm md:text-base leading-relaxed max-w-md">
                  {slide.subtitle}
                </p>

                <div className="pt-2">
                  <Link
                    to={slide.linkUrl}
                    className="pill-gold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition"
                  >
                    {slide.linkText}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Original carousel indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
          {HERO_SLIDES.map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? "w-8 bg-[color:var(--gold)]"
                  : "w-2 bg-white/40 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ============================================
          RATES BAR - NO BACKEND FETCH
      ============================================ */}

      <StaticRatesBar />

      <OrnamentalDivider />

      {/* ============================================
          SILVER COLLECTION INTRO
      ============================================ */}

      <section
        id="silver-collection"
        className="max-w-7xl mx-auto px-4 pt-8 scroll-mt-24"
      >
        <div className="text-center mb-12">
          <p className="label-caps text-[color:var(--gold-dark)] text-xs uppercase tracking-widest font-semibold">
            Our Exclusive Collection
          </p>

          <h2 className="font-serif text-3xl md:text-4xl mt-3 text-[color:var(--espresso)]">
            Elegant Silver Jewellery
          </h2>

          <p className="text-[color:var(--muted-foreground)] text-sm mt-4 max-w-2xl mx-auto leading-relaxed">
            Explore our beautiful silver jewellery
            collection, carefully selected for
            elegance, tradition and timeless style.
          </p>

          <div className="w-20 h-[2px] bg-[color:var(--gold)] mx-auto mt-7" />
        </div>
      </section>

      {/* ============================================
          ALL 65 SILVER PHOTOS
      ============================================ */}

      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div
          style={{ backgroundColor: "var(--panel)" }}
          className="rounded-3xl p-4 sm:p-6 md:p-10 border border-[color:var(--border)] shadow-sm"
        >
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <div>
              <p className="label-caps text-[color:var(--gold-dark)] text-xs uppercase tracking-widest">
                Browse Our Designs
              </p>

              <h2 className="font-serif text-2xl md:text-3xl mt-2 text-[color:var(--espresso)]">
                Silver Collection
              </h2>

              <p className="text-xs text-[color:var(--muted-foreground)] mt-2">
                Explore our complete silver jewellery
                collection
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white border border-[color:var(--border)] rounded-full px-4 py-2 text-[color:var(--gold-dark)] text-xs font-semibold">
              <Images className="w-4 h-4" />
              {SILVER_PHOTOS.length} Designs
            </div>
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {SILVER_PHOTOS.map((photo, index) => (
              <button
                type="button"
                key={photo.id}
                onClick={() => setSelectedImage(index)}
                className="group overflow-hidden rounded-2xl border border-[color:var(--border)] bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--gold)] hover:shadow-xl"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-[#f5f3f0]">
                  <img
                    src={photo.image}
                    alt={photo.name}
                    loading={
                      index < 8 ? "eager" : "lazy"
                    }
                    decoding="async"
                    className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Image Number */}
                  <div className="absolute top-3 right-3 rounded-full bg-white/90 shadow-sm px-3 py-1 text-[11px] font-medium text-[color:var(--gold-dark)]">
                    {String(photo.id).padStart(2, "0")}
                  </div>
                </div>

                {/* Image Details */}
                <div className="p-3 sm:p-5">
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-[color:var(--gold-dark)] mb-1">
                    Silver Jewellery
                  </p>

                  <h3 className="font-serif text-sm sm:text-base text-[color:var(--espresso)] font-medium">
                    {photo.name}
                  </h3>

                  <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[color:var(--gold-dark)]">
                    View Design

                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* End Message */}
          <div className="text-center mt-14">
            <div className="w-40 h-px bg-[color:var(--border)] mx-auto mb-5" />

            <p className="font-serif text-lg italic text-[color:var(--gold-dark)]">
              Beauty in Every Detail
            </p>

            <p className="text-xs text-[color:var(--muted-foreground)] mt-2">
              You have viewed all{" "}
              {SILVER_PHOTOS.length} silver designs
            </p>
          </div>
        </div>
      </section>

      {/* ============================================
          FULLSCREEN IMAGE PREVIEW
      ============================================ */}

      {selectedImage !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Silver jewellery image preview"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 sm:p-8"
          onClick={closePreview}
        >
          {/* Close */}
          <button
            type="button"
            onClick={closePreview}
            aria-label="Close preview"
            className="absolute top-4 right-4 z-20 bg-white/15 hover:bg-white/30 text-white p-3 rounded-full transition"
          >
            <X size={23} />
          </button>

          {/* Previous */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              previousImage();
            }}
            aria-label="Previous image"
            className="absolute left-3 sm:left-7 top-1/2 -translate-y-1/2 z-20 bg-white/15 hover:bg-white/30 text-white p-3 rounded-full transition"
          >
            <ArrowLeft size={22} />
          </button>

          {/* Full Image */}
          <div
            className="flex flex-col items-center justify-center gap-5 max-w-5xl max-h-full px-10"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={
                SILVER_PHOTOS[selectedImage].image
              }
              alt={
                SILVER_PHOTOS[selectedImage].name
              }
              className="max-w-full max-h-[75vh] object-contain rounded-lg bg-white shadow-2xl"
            />

            <div className="text-center">
              <h3 className="font-serif text-white text-xl">
                {
                  SILVER_PHOTOS[selectedImage]
                    .name
                }
              </h3>

              <p className="text-white/60 text-xs mt-2">
                {selectedImage + 1} of{" "}
                {SILVER_PHOTOS.length}
              </p>
            </div>
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            aria-label="Next image"
            className="absolute right-3 sm:right-7 top-1/2 -translate-y-1/2 z-20 bg-white/15 hover:bg-white/30 text-white p-3 rounded-full transition"
          >
            <ArrowRight size={22} />
          </button>
        </div>
      )}
    </Layout>
  );
}

// ======================================================
// RATES BAR - STATIC LINK, NO API REQUEST
// ======================================================

function StaticRatesBar() {
  return (
    <div
      style={{ backgroundColor: "var(--cream)" }}
      className="border-y border-[color:var(--gold)]/20"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="label-caps text-[color:var(--gold-dark)] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Today's Rates
          </span>

          <span className="text-xs text-[color:var(--muted-foreground)]">
            View gold and silver rates
          </span>
        </div>

        <Link
          to="/liverates"
          className="flex items-center gap-1.5 text-[color:var(--gold-dark)] font-semibold text-xs hover:underline transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          View details
        </Link>
      </div>
    </div>
  );
}
