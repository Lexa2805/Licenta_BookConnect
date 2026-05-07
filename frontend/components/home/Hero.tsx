"use client";

import { ArrowRight, Coffee, Headphones, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../ui/Button";
import { Eyebrow } from "../ui/Eyebrow";
import { BookCover } from "../books/BookCover";
import { libraryService } from "@/lib/services/library";

const AVATARS = ["#A8581F", "#E8A9A9", "#8AA98F", "#A8B8C8"];

function getGradientForBook(id: number) {
  const gradients = [
    "linear-gradient(135deg, #2A3B32, #4A5B42)",
    "linear-gradient(135deg, #5C3A21, #8B5A33)",
    "linear-gradient(135deg, #1C2331, #3A4B62)",
  ];
  return gradients[id % gradients.length];
}

export function Hero() {
  const router = useRouter();
  const { data: books = [], isLoading } = useQuery({
    queryKey: ["hero-books"],
    queryFn: async () => {
      const featured = await libraryService.getBooks({ featured: true });
      if (featured.length >= 3) {
        return featured.slice(0, 3);
      }
      const allBooks = featured.length > 0 ? featured : await libraryService.getBooks();
      return allBooks.slice(0, 3);
    },
  });

  const heroBooks = books.slice(0, 3);
  const detailsBookId = heroBooks[1]?.id ?? heroBooks[0]?.id;
  const heroTitle = heroBooks[1]?.title || heroBooks[0]?.title || "your next chapter";
  const heroAuthor = heroBooks[1]?.author || heroBooks[0]?.author || "the library";

  return (
    <section
      className="relative isolate overflow-hidden rounded-bc-3xl border bg-bc-hero shadow-bc-lg animate-bc-fade-up"
      style={{
        borderColor: "var(--bc-hero-border)",
        padding: "52px clamp(28px, 5vw, 56px)",
        minHeight: 360,
      }}
    >
      <span
        aria-hidden
        className="bc-orb bc-orb-primary animate-bc-blob"
        style={{ width: 380, height: 380, top: -120, left: -100, opacity: 0.45 }}
      />
      <span
        aria-hidden
        className="bc-orb bc-orb-secondary animate-bc-blob"
        style={{
          width: 320,
          height: 320,
          bottom: -120,
          right: -80,
          opacity: 0.45,
          animationDelay: "-6s",
        }}
      />
      <span
        aria-hidden
        className="bc-dot-grid absolute inset-0 z-0 opacity-20"
        style={{
          maskImage:
            "radial-gradient(ellipse at 30% 50%, black 30%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 30% 50%, black 30%, transparent 70%)",
        }}
      />

      <div className="relative z-[2] grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="max-w-[540px]">
          <Eyebrow className="mb-6">Featured library picks</Eyebrow>

          <h2 className="font-display text-[clamp(36px,5vw,50px)] font-semibold leading-[1.02] tracking-[-0.035em] text-bc-text">
            Settle in with
            <br />
            <span
              className="italic font-medium"
              style={{
                background:
                  "linear-gradient(135deg, var(--bc-primary-grad-from), var(--bc-primary-grad-to))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {heroTitle}
            </span>
          </h2>

          <p className="mt-5 mb-8 max-w-[460px] text-[16.5px] leading-relaxed text-bc-text-soft">
            Real books from your library catalog are back in the new UI. Open a title,
            read the PDF, and pick up where you left off without the old route crash.
          </p>

          <div className="mb-7 flex flex-wrap gap-3">
            <Button
              size="lg"
              rightIcon={<ArrowRight size={16} />}
              onClick={() => router.push("/library")}
            >
              Browse library
            </Button>
            <Button
              size="lg"
              variant="secondary"
              disabled={!detailsBookId}
              onClick={() => detailsBookId && router.push(`/books/${detailsBookId}`)}
            >
              Open book details
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[13px] text-bc-text-soft">
            <div className="flex">
              {AVATARS.map((c, i) => (
                <span
                  key={i}
                  className="h-7 w-7 rounded-full border-2 border-bc-surface shadow-bc-sm"
                  style={{
                    background: `linear-gradient(135deg, ${c}, ${c}cc)`,
                    marginLeft: i > 0 ? -10 : 0,
                  }}
                />
              ))}
            </div>
            <span className="font-medium">
              <strong className="font-bold text-bc-text">{heroAuthor}</strong> is ready to
              read
            </span>
            <span className="h-3.5 w-px bg-bc-border-strong" />
            <span className="inline-flex items-center gap-1.5">
              <Coffee size={14} className="text-bc-primary" />
              Reader synced
            </span>
          </div>
        </div>

        <div className="relative flex h-[320px] items-center justify-center">
          <span
            aria-hidden
            className="absolute left-1/2 bottom-6 z-0 h-14 w-80 -translate-x-1/2"
            style={{
              background:
                "radial-gradient(ellipse, var(--bc-hero-stack-glow), transparent 70%)",
              filter: "blur(18px)",
            }}
          />

          {isLoading ? (
            <div className="flex items-center gap-3 rounded-bc-lg border border-bc-border bg-bc-surface px-5 py-4 shadow-bc-lg">
              <Loader2 className="h-5 w-5 animate-spin text-bc-primary" />
              <span className="text-sm text-bc-subtext">Loading live library books...</span>
            </div>
          ) : (
            <>
              {heroBooks[0] && (
                <div
                  className="absolute z-[1]"
                  style={{ transform: "translateX(-90px) translateY(8px) rotate(-12deg)" }}
                >
                  <BookCover
                    title={heroBooks[0].title}
                    author={heroBooks[0].author}
                    gradient={(heroBooks[0].cover || heroBooks[0].cover_url) ? undefined : getGradientForBook(heroBooks[0].id)}
                    coverUrl={heroBooks[0].cover || heroBooks[0].cover_url}
                    width={140}
                    height={210}
                  />
                </div>
              )}
              {heroBooks[1] && (
                <div className="absolute z-[3] animate-bc-float-slow">
                  <div style={{ transform: "translateY(-12px)" }}>
                    <BookCover
                      title={heroBooks[1].title}
                      author={heroBooks[1].author}
                      gradient={(heroBooks[1].cover || heroBooks[1].cover_url) ? undefined : getGradientForBook(heroBooks[1].id)}
                      coverUrl={heroBooks[1].cover || heroBooks[1].cover_url}
                      width={150}
                      height={220}
                    />
                  </div>
                </div>
              )}
              {heroBooks[2] && (
                <div
                  className="absolute z-[2]"
                  style={{ transform: "translateX(90px) translateY(8px) rotate(12deg)" }}
                >
                  <BookCover
                    title={heroBooks[2].title}
                    author={heroBooks[2].author}
                    gradient={(heroBooks[2].cover || heroBooks[2].cover_url) ? undefined : getGradientForBook(heroBooks[2].id)}
                    coverUrl={heroBooks[2].cover || heroBooks[2].cover_url}
                    width={140}
                    height={210}
                  />
                </div>
              )}
            </>
          )}

          <div className="absolute bottom-2 -right-2.5 z-[4] flex items-center gap-2.5 rounded-bc-lg border border-bc-border bg-bc-surface px-3.5 py-2.5 shadow-bc-lg animate-bc-float">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-bc-primary-grad shadow-[0_6px_14px_-4px_var(--bc-primary-glow)]">
              <Headphones size={14} className="text-white" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-bc-subtext">
                Reader status
              </div>
              <div className="text-[13px] font-semibold text-bc-text">PDF route fixed</div>
            </div>
          </div>

          <div
            className="absolute top-1.5 -left-5 z-[4] flex items-center gap-2.5 rounded-bc-lg border border-bc-border bg-bc-surface px-3.5 py-2.5 shadow-bc-lg animate-bc-float-slow"
            style={{ animationDelay: "-3s" }}
          >
            <Sparkles size={14} className="text-bc-primary" />
            <div className="leading-tight">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-bc-subtext">
                Live catalog
              </div>
              <div className="text-[13px] font-semibold text-bc-text">
                Real data restored
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
