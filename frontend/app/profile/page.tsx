"use client";

import { Edit3, MapPin, Quote, Loader2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionTitle";
import { BookCard } from "@/components/books/BookCard";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { libraryService } from "@/lib/services/library";

export default function ProfilePage() {
  const { data: session } = useSession();
  
  const username = session?.user?.username || "Guest";
  const initials = username.substring(0, 2).toUpperCase();

  const { data: userLibrary = [], isLoading } = useQuery({
    queryKey: ["user-library", session?.user?.id],
    queryFn: () => libraryService.getUserLibrary(session!.user.id as string),
    enabled: !!session?.user?.id,
  });

  const readingBooks = userLibrary.filter(entry => entry.status === "READING");
  const finishedBooks = userLibrary.filter(entry => entry.status === "FINISHED");
  
  const totalPagesRead = finishedBooks.reduce((sum, entry) => sum + (entry.book.pages || 0), 0) + 
                         readingBooks.reduce((sum, entry) => sum + (entry.current_page || 0), 0);

  const realStats = [
    { id: "s1", label: "Books Read", value: finishedBooks.length.toString() },
    { id: "s2", label: "Pages", value: totalPagesRead.toLocaleString() },
    { id: "s3", label: "Avg Rating", value: "0.0" },
    { id: "s4", label: "Reading", value: readingBooks.length.toString() },
  ];

  const getGradientForBook = (id: number) => {
    const gradients = [
      "linear-gradient(135deg, #1B2638, #3B4860)",
      "linear-gradient(135deg, #7C3F22, #B26845)",
      "linear-gradient(135deg, #1F4A3A, #3D7A60)",
      "linear-gradient(135deg, #BA9747, #D4B679)",
      "linear-gradient(135deg, #2D4C3B, #5A7B68)",
      "linear-gradient(135deg, #5C3A21, #8B5A33)",
      "linear-gradient(135deg, #4B2A3B, #7A4A5C)",
    ];
    return gradients[id % gradients.length];
  };

  return (
    <PageLayout
      active="profile"
      pageTitle="Profile"
      pageSubtitle="Your reading life, gathered in one place."
      headerActions={
        <Button variant="secondary" leftIcon={<Edit3 size={14} />}>
          Edit profile
        </Button>
      }
    >
      {/* Identity card */}
      <section className="bc-card p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center relative overflow-hidden">
        <span
          aria-hidden
          className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-bc-primary-grad opacity-10 blur-3xl pointer-events-none"
        />
        <div className="grid place-items-center w-24 h-24 rounded-full bg-bc-primary-grad text-white font-display text-3xl font-semibold shadow-bc-primary shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0 relative">
          <h2 className="font-display text-[26px] font-semibold text-bc-text leading-tight">
            {username}
          </h2>
          <p className="text-bc-subtext text-[13.5px] mt-1 inline-flex items-center gap-1.5">
            <MapPin size={13} /> {session?.user?.email || "No email provided"}
          </p>
          <p className="text-bc-text-soft text-[14.5px] leading-relaxed mt-3 max-w-xl">
            {session?.user?.role === "author" ? "Author" : "Reader"} on BookConnect.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bc-stagger grid grid-cols-2 sm:grid-cols-4 gap-4">
        {realStats.map((s) => (
          <div
            key={s.id}
            className="bc-card bc-card-hover p-5 text-center sm:text-left"
          >
            <div className="text-[11px] uppercase tracking-[0.07em] font-bold text-bc-subtext mb-2">
              {s.label}
            </div>
            <div className="font-display text-[2rem] font-semibold text-bc-text leading-none">
              {isLoading ? "..." : s.value}
            </div>
          </div>
        ))}
      </section>

      {/* Reading journal + quote */}
      <section className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div>
          <SectionHeader title="Currently on the nightstand" />
          {isLoading ? (
             <div className="flex justify-center py-10"><Loader2 className="animate-spin text-bc-primary w-6 h-6" /></div>
          ) : readingBooks.length === 0 ? (
             <div className="text-center py-10 text-bc-subtext text-sm bc-card bg-transparent border-dashed">No books currently being read.</div>
          ) : (
            <div className="bc-stagger grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
              {readingBooks.map((entry) => {
                const progressPct = entry.book.pages ? Math.round((entry.current_page / entry.book.pages) * 100) : 0;
                return (
                  <BookCard
                    key={entry.id}
                    title={entry.book.title}
                    author={entry.book.author}
                    gradient={(entry.book.cover || entry.book.cover_url) ? undefined : getGradientForBook(entry.book.id)}
                    coverUrl={entry.book.cover || entry.book.cover_url}
                    meta={`${progressPct}% · Page ${entry.current_page}`}
                    href={`/books/${entry.book.id}`}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="bc-card p-6 sm:p-7 flex flex-col gap-4 relative overflow-hidden h-fit">
          <Quote
            size={28}
            className="text-bc-primary opacity-80"
            strokeWidth={2.4}
          />
          <p className="font-display text-[20px] leading-snug text-bc-text italic">
            &ldquo;Memory is a wilderness — once you let yourself in, you may
            wander a long time before finding your way out.&rdquo;
          </p>
          <div className="text-[12.5px] text-bc-subtext">
            from <em>Norwegian Wood</em> · saved last week
          </div>
        </div>
      </section>

      {/* Activity heatmap */}
      <section>
        <SectionHeader title="A year of reading" />
        <div className="bc-card p-6 overflow-x-auto mt-2">
          <Heatmap />
        </div>
      </section>
    </PageLayout>
  );
}

function Heatmap() {
  // 53 weeks x 7 days
  const weeks = 53;
  const days = 7;
  const cells: { intensity: number }[][] = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: days }, (_, d) => {
      // pseudo-random pattern that's deterministic
      const v = Math.sin(w * 1.7 + d * 0.9) * 0.5 + 0.5;
      const noise = ((w * 7 + d) % 11) / 22;
      const intensity = Math.max(0, Math.min(1, v * 0.85 + noise));
      return { intensity: intensity < 0.18 ? 0 : intensity };
    }),
  );

  function shade(i: number) {
    if (i === 0) return "var(--bc-surface-muted)";
    if (i < 0.4) return "rgba(196, 106, 43, 0.25)";
    if (i < 0.65) return "rgba(196, 106, 43, 0.5)";
    if (i < 0.85) return "rgba(196, 106, 43, 0.75)";
    return "var(--bc-primary)";
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-[3px]">
        {cells.map((week, w) => (
          <div key={w} className="flex flex-col gap-[3px]">
            {week.map((cell, d) => (
              <span
                key={d}
                title={`Week ${w + 1}, day ${d + 1}`}
                className="w-2.5 h-2.5 rounded-[3px]"
                style={{ background: shade(cell.intensity) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 text-[11px] text-bc-subtext">
        Less
        {[0, 0.3, 0.55, 0.75, 1].map((v, i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-[3px]"
            style={{ background: shade(v) }}
          />
        ))}
        More
      </div>
    </div>
  );
}
