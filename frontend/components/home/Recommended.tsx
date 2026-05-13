"use client";

import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SectionHeader } from "../ui/SectionTitle";
import { BookCard } from "../books/BookCard";
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

export function Recommended() {
  const { data: books = [], isLoading } = useQuery({
    queryKey: ["recommended-books"],
    queryFn: async () => {
      const featured = await libraryService.getBooks({ featured: true });
      if (featured.length > 0) {
        return featured;
      }
      return libraryService.getBooks();
    },
  });

  const displayBooks = books.slice(0, 6);

  return (
    <section>
      <SectionHeader
        title="Recommended for you"
        actionLabel="View all"
        actionHref="/library"
      />
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-bc-primary" />
        </div>
      ) : displayBooks.length === 0 ? (
        <div className="bc-card border-dashed bg-transparent py-10 text-center text-sm text-bc-subtext">
          No books are available yet.
        </div>
      ) : (
        <div className="bc-stagger grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {displayBooks.map((book) => (
            <BookCard
              key={book.id}
              title={book.title}
              author={book.author}
              gradient={(book.cover || book.cover_url) ? undefined : getGradientForBook(book.id)}
              coverUrl={book.cover || book.cover_url}
              badge={book.is_featured ? "Featured" : book.is_free ? "Free" : undefined}
              href={`/books/${book.id}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
