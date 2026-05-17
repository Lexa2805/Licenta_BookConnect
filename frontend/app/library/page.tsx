"use client";

import { useMemo, useState } from "react";
import { BookOpen, Bookmark, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionTitle";
import { BookCard } from "@/components/books/BookCard";
import { MovieMatchTool } from "@/components/library/MovieMatchTool";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { libraryService, type UserLibraryEntry } from "@/lib/services/library";

const FILTERS = [
  "All",
  "Reading",
  "Finished",
  "Wishlist",
] as const;

type LibraryFilter = (typeof FILTERS)[number];

export default function LibraryPage() {
  const [filter, setFilter] = useState<LibraryFilter>("All");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const searchQuery = searchParams.get("search")?.trim() ?? "";

  const { data: allBooks = [], isLoading: loadingBooks } = useQuery({
    queryKey: ["all-books", searchQuery],
    queryFn: () => libraryService.getBooks(searchQuery ? { search: searchQuery } : undefined),
  });

  const { data: userLibrary = [], isLoading: loadingLibrary } = useQuery({
    queryKey: ["user-library", session?.user?.id],
    queryFn: () => libraryService.getUserLibrary(session!.user.id as string),
    enabled: !!session?.user?.id,
  });

  const userEntryByBookId = useMemo(() => {
    return new Map<string, UserLibraryEntry>(userLibrary.map((e) => [String(e.book.id), e]));
  }, [userLibrary]);

  const shelfBooks = useMemo(() => {
    if (filter === "Reading") return userLibrary.filter((entry) => entry.status === "READING");
    if (filter === "Finished") return userLibrary.filter((entry) => entry.status === "FINISHED");
    if (filter === "Wishlist") return userLibrary.filter((entry) => entry.is_favorite || entry.status === "WANT_TO_READ");
    return userLibrary;
  }, [filter, userLibrary]);

  const selectedShelfBook =
    shelfBooks.find((entry) => String(entry.book.id) === selectedBookId) ?? shelfBooks[0];

  const toggleWishlistMutation = useMutation({
    mutationFn: async (bookId: string | number) => {
      const userId = session?.user?.id as string | undefined;
      if (!userId) throw new Error("Not authenticated");

      const existing = userEntryByBookId.get(String(bookId));
      if (existing) {
        return await libraryService.toggleFavorite(existing.id);
      }

      const created = await libraryService.addToLibrary(userId, bookId);
      if (created.is_favorite) return created;
      return await libraryService.toggleFavorite(created.id);
    },
    onSuccess: (updatedEntry) => {
      const userId = session?.user?.id;
      if (!userId) return;

      queryClient.setQueryData<UserLibraryEntry[]>(["user-library", userId], (prev) => {
        const prevList = prev ?? [];
        const idx = prevList.findIndex((e) => e.id === updatedEntry.id);
        if (idx === -1) return [updatedEntry, ...prevList];

        const next = prevList.slice();
        next[idx] = updatedEntry;
        return next;
      });
    },
  });

  const isLoading = loadingBooks || loadingLibrary;

  const getGradientSeed = (id: string | number) => {
    if (typeof id === "number") return id;
    return String(id).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  };

  const getGradientForBook = (id: string | number) => {
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
  };

  // Map backend status to UI filter
  let displayBooks: any[] = [];

  if (filter === "All") {
    // Show all available books from admin catalog
    displayBooks = allBooks.map(book => {
      // Check if user has this book in their library to show status badge
      const userEntry = userLibrary.find(entry => String(entry.book.id) === String(book.id));
      return {
        id: book.id,
        title: book.title,
        author: book.author,
        cover_url: book.cover || book.cover_url,
        status: userEntry?.status,
        isWishlisted: !!userEntry?.is_favorite,
        meta: `Added ${new Date(book.created_at).toLocaleDateString()}`
      };
    });
  } else {
    // Show only user's specific library entries based on filter
    displayBooks = userLibrary
      .filter((entry) => {
        if (filter === "Reading" && entry.status === "READING") return true;
        if (filter === "Finished" && entry.status === "FINISHED") return true;
        if (filter === "Wishlist" && entry.is_favorite) return true;
        return false;
      })
      .map(entry => ({
        id: entry.book.id,
        title: entry.book.title,
        author: entry.book.author,
        cover_url: entry.book.cover || entry.book.cover_url,
        status: entry.status,
        isWishlisted: entry.is_favorite,
        meta: entry.status === "READING"
          ? `Page ${entry.current_page} / ${entry.book.pages || '?'}`
          : entry.status === "FINISHED"
            ? `Finished`
            : `Added ${new Date(entry.added_at).toLocaleDateString()}`
      }));
  }

  const readingCount = userLibrary.filter(b => b.status === "READING").length;

  return (
    <PageLayout
      active="library"
      pageTitle="Your library"
      pageSubtitle={
        searchQuery
          ? `${allBooks.length} result${allBooks.length === 1 ? "" : "s"} for "${searchQuery}"`
          : `${allBooks.length} books available · ${readingCount} currently reading`
      }
    >
      <section>
        <SectionHeader title="Virtual library" />
        <VirtualLibrary
          books={shelfBooks}
          allBooksCount={userLibrary.length}
          activeFilter={filter}
          selectedBook={selectedShelfBook}
          isLoading={loadingLibrary}
          onFilterChange={(nextFilter) => {
            setFilter(nextFilter);
            setSelectedBookId(null);
          }}
          onSelectBook={(entry) => setSelectedBookId(String(entry.book.id))}
          onOpenBook={(bookId) => router.push(`/books/${bookId}`)}
          onOpenReader={(bookId) => router.push(`/library/read/${bookId}`)}
        />
      </section>

      {isLoading ? (
        <div className="grid place-items-center py-20 text-bc-primary">
          <Loader2 className="animate-spin w-8 h-8" />
        </div>
      ) : displayBooks.length === 0 ? (
        <div className="grid place-items-center py-20 text-bc-subtext">
          <p>No books found in this category.</p>
        </div>
      ) : (
        <div className="bc-stagger grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {displayBooks.map((book) => (
            <BookCard
              key={book.id}
              title={book.title}
              author={book.author}
              gradient={book.cover_url ? undefined : getGradientForBook(book.id)}
              coverUrl={book.cover_url}
              badge={book.status === "FINISHED" ? "Finished" : undefined}
              meta={book.meta}
              isWishlisted={!!(userEntryByBookId.get(String(book.id))?.is_favorite ?? book.isWishlisted)}
              onToggleWishlist={
                session?.user?.id
                  ? () => toggleWishlistMutation.mutate(book.id)
                  : undefined
              }
              href={`/books/${book.id}`}
            />
          ))}
        </div>
      )}

      <MovieMatchTool books={allBooks} />
    </PageLayout>
  );
}

function VirtualLibrary({
  books,
  allBooksCount,
  activeFilter,
  selectedBook,
  isLoading,
  onFilterChange,
  onSelectBook,
  onOpenBook,
  onOpenReader,
}: {
  books: UserLibraryEntry[];
  allBooksCount: number;
  activeFilter: LibraryFilter;
  selectedBook?: UserLibraryEntry;
  isLoading: boolean;
  onFilterChange: (filter: LibraryFilter) => void;
  onSelectBook: (entry: UserLibraryEntry) => void;
  onOpenBook: (bookId: string | number) => void;
  onOpenReader: (bookId: string | number) => void;
}) {
  return (
    <div className="mt-2 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
      <div className="rounded-bc-lg border border-bc-border bg-bc-surface p-5 shadow-bc-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-bc-text">
              {allBooksCount} book{allBooksCount === 1 ? "" : "s"} in your collection
            </div>
            <div className="mt-1 text-xs text-bc-subtext">
              Click a spine to inspect progress and jump back into the book.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <Pill
                key={filter}
                active={activeFilter === filter}
                onClick={() => onFilterChange(filter)}
              >
                {filter}
              </Pill>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid min-h-72 place-items-center text-bc-primary">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>
        ) : books.length === 0 ? (
          <div className="grid min-h-72 place-items-center rounded-bc-md border border-dashed border-bc-border bg-bc-surface-muted px-6 text-center">
            <div>
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-bc-subtext" />
              <p className="text-sm font-semibold text-bc-text">No books on this shelf yet</p>
              <p className="mt-1 text-sm text-bc-subtext">Add books from the Library to start filling it.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {chunkBooks(books, 12).map((row, rowIndex) => (
              <div key={rowIndex} className="relative pb-5">
                <div className="flex min-h-48 items-end gap-2 overflow-x-auto px-2 pt-3">
                  {row.map((entry, index) => {
                    const isSelected = selectedBook?.id === entry.id;
                    const progressPct = getProgressPct(entry);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => onSelectBook(entry)}
                        className={[
                          "group relative flex shrink-0 items-end justify-center rounded-t-[7px] border border-white/10 px-2 pb-3 pt-4 text-left shadow-bc-sm transition duration-300 hover:-translate-y-2 focus:outline-none focus:ring-2 focus:ring-bc-primary",
                          isSelected ? "-translate-y-2 ring-2 ring-bc-primary" : "",
                        ].join(" ")}
                        style={{
                          width: `${42 + (index % 4) * 7}px`,
                          height: `${132 + (index % 5) * 12}px`,
                          background: getSpineGradient(String(entry.book.id), index),
                        }}
                        title={`${entry.book.title} by ${entry.book.author}`}
                      >
                        <span aria-hidden className="absolute inset-y-0 left-1 w-1.5 rounded-full bg-black/15" />
                        <span aria-hidden className="absolute inset-y-0 right-1 w-px bg-white/25" />
                        {entry.is_favorite && (
                          <Bookmark className="absolute right-1.5 top-2 h-3.5 w-3.5 fill-white/80 text-white/80" />
                        )}
                        <span className="relative z-[1] max-h-[104px] -rotate-180 [writing-mode:vertical-rl] text-[11px] font-bold leading-none text-white drop-shadow line-clamp-1">
                          {entry.book.title}
                        </span>
                        {progressPct > 0 && (
                          <span className="absolute bottom-0 left-0 h-1 rounded-br-full bg-white/70" style={{ width: `${progressPct}%` }} />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-5 rounded-bc-md border border-bc-border bg-[linear-gradient(180deg,var(--bc-surface-muted),var(--bc-surface))] shadow-bc-sm" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-bc-lg border border-bc-border bg-bc-surface p-5 shadow-bc-sm">
        {selectedBook ? (
          <div className="flex h-full flex-col">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-bc-subtext">
                  Selected book
                </div>
                <h3 className="mt-2 line-clamp-2 font-display text-2xl font-semibold leading-tight text-bc-text">
                  {selectedBook.book.title}
                </h3>
                <p className="mt-1 truncate text-sm text-bc-subtext">{selectedBook.book.author}</p>
              </div>
              <span className="shrink-0 rounded-full border border-bc-border bg-bc-surface-muted px-3 py-1 text-xs font-semibold text-bc-text-soft">
                {getStatusLabel(selectedBook)}
              </span>
            </div>

            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-bc-subtext">
                <span>Progress</span>
                <span>{getProgressPct(selectedBook)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bc-surface-muted">
                <div
                  className="h-full rounded-full bg-bc-primary-grad"
                  style={{ width: `${getProgressPct(selectedBook)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-bc-subtext">
                Page {selectedBook.current_page || 0} of {selectedBook.book.pages || "?"}
              </div>
            </div>

            <p className="line-clamp-5 text-sm leading-6 text-bc-text-soft">
              {selectedBook.book.description?.trim() || "No description has been added for this book yet."}
            </p>

            <div className="mt-auto flex flex-col gap-2 pt-5">
              <Button
                fullWidth
                onClick={() => onOpenReader(selectedBook.book.id)}
                leftIcon={<BookOpen size={14} />}
              >
                Open reader
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => onOpenBook(selectedBook.book.id)}
              >
                View details
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid h-full min-h-72 place-items-center text-center">
            <div>
              <BookOpen className="mx-auto mb-3 h-8 w-8 text-bc-subtext" />
              <p className="text-sm font-semibold text-bc-text">Choose a book spine</p>
              <p className="mt-1 text-sm text-bc-subtext">Its progress and quick actions will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function chunkBooks(books: UserLibraryEntry[], size: number) {
  const rows: UserLibraryEntry[][] = [];
  for (let index = 0; index < books.length; index += size) {
    rows.push(books.slice(index, index + size));
  }
  return rows;
}

function getProgressPct(entry: UserLibraryEntry) {
  if (entry.status === "FINISHED") return 100;
  const pages = entry.book.pages || 0;
  if (!pages) return entry.current_page > 0 ? 1 : 0;
  return Math.min(100, Math.max(0, Math.round((entry.current_page / pages) * 100)));
}

function getStatusLabel(entry: UserLibraryEntry) {
  if (entry.status === "FINISHED") return "Finished";
  if (entry.status === "READING") return "Reading";
  if (entry.is_favorite) return "Wishlist";
  return "Saved";
}

function getSpineGradient(seed: string, index: number) {
  const palettes = [
    ["#1f4a3a", "#6b8f71"],
    ["#7a3f4f", "#c07a82"],
    ["#234f68", "#8bb7c9"],
    ["#8a5a24", "#d2a85f"],
    ["#3d355f", "#8d7ab8"],
    ["#6b2f35", "#c66f58"],
    ["#2f4d5c", "#77a3a3"],
  ];
  const value = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), index);
  const [from, to] = palettes[value % palettes.length];
  return `linear-gradient(135deg, ${from}, ${to})`;
}
