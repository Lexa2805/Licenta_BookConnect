"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { BookCover } from "../books/BookCover";
import { SectionHeader } from "../ui/SectionTitle";
import { libraryService } from "@/lib/services/library";

function getGradientSeed(id: string | number) {
  if (typeof id === "number") return id;
  return String(id).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getGradientForBook(id: string | number) {
  const gradients = [
    "linear-gradient(135deg, #1B2638, #3B4860)",
    "linear-gradient(135deg, #7C3F22, #B26845)",
    "linear-gradient(135deg, #1F4A3A, #3D7A60)",
    "linear-gradient(135deg, #BA9747, #D4B679)",
    "linear-gradient(135deg, #2D4C3B, #5A7B68)",
    "linear-gradient(135deg, #5C3A21, #8B5A33)",
    "linear-gradient(135deg, #4B2A3B, #7A4A5C)",
  ];
  return gradients[getGradientSeed(id) % gradients.length];
}

export function ContinueReading() {
  const { data: session } = useSession();
  const { data: userLibrary = [], isLoading } = useQuery({
    queryKey: ["continue-reading", session?.user?.id],
    queryFn: () => libraryService.getUserLibrary(session!.user.id as string),
    enabled: !!session?.user?.id,
  });

  const books = userLibrary
    .filter((entry) => entry.status === "READING")
    .slice(0, 3);

  return (
    <section>
      <SectionHeader
        title="Continue reading"
        actionLabel="Your library"
        actionHref="/library"
      />
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-bc-primary" />
        </div>
      ) : !session?.user?.id ? (
        <div className="bc-card border-dashed bg-transparent py-10 text-center text-sm text-bc-subtext">
          Log in to track and resume your reading.
        </div>
      ) : books.length === 0 ? (
        <div className="bc-card border-dashed bg-transparent py-10 text-center text-sm text-bc-subtext">
          You do not have any books in progress yet.
        </div>
      ) : (
        <div className="bc-stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((entry) => {
            const totalPages = entry.book.pages || 0;
            const progress = totalPages > 0
              ? Math.min(100, Math.round((entry.current_page / totalPages) * 100))
              : 0;

            return (
              <article
                key={entry.id}
                className="bc-card bc-card-hover flex items-center gap-4 p-5"
              >
                <Link href={`/books/${entry.book.id}`} className="shrink-0">
                  <BookCover
                    title={entry.book.title}
                    author={entry.book.author}
                    gradient={(entry.book.cover || entry.book.cover_url) ? undefined : getGradientForBook(entry.book.id)}
                    coverUrl={entry.book.cover || entry.book.cover_url}
                    width={84}
                    height={126}
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/books/${entry.book.id}`}>
                    <h4 className="mb-0.5 truncate text-base font-semibold tracking-tight text-bc-text">
                      {entry.book.title}
                    </h4>
                  </Link>
                  <p className="mb-4 truncate text-[13px] text-bc-subtext">
                    {entry.book.author}
                  </p>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-bc-subtext">
                      Progress
                    </span>
                    <span className="font-display text-[13px] font-bold text-bc-text">
                      {progress}%
                    </span>
                  </div>
                  <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-bc-surface-muted">
                    <div
                      className="h-full rounded-full bg-bc-primary-grad"
                      style={{
                        width: `${progress}%`,
                        boxShadow: "0 0 8px var(--bc-primary-glow)",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-bc-subtext">
                      Page {entry.current_page} of {totalPages || "?"}
                    </span>
                    <Link
                      href={`/library/read/${entry.book.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-bc-primary transition-all hover:gap-2"
                    >
                      Resume <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
