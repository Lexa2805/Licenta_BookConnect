"use client";

import { useEffect, useState } from "react";
import { marketplaceService, Listing, Genre } from "@/lib/services/marketplace";
import Link from "next/link";

const GENRES: Genre[] = [
  { value: 'FANTASY', label: 'Fantasy' },
  { value: 'SCIENCE_FICTION', label: 'Science Fiction' },
  { value: 'ROMANCE', label: 'Romance' },
  { value: 'THRILLER', label: 'Thriller' },
  { value: 'MYSTERY', label: 'Mystery' },
  { value: 'SELF_HELP', label: 'Self-Help' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'PROGRAMMING', label: 'Programming' },
  { value: 'CLASSIC', label: 'Classic' },
  { value: 'OTHER', label: 'Other' },
];

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const data = await marketplaceService.getListings();
      setListings(data);
    } catch (err) {
      console.error("Failed to load listings:", err);
    } finally {
      setLoading(false);
    }
  };

  const getImageSrc = (listing: Listing) => {
    if (listing.image_url) return listing.image_url;
    if (!listing.image) return null;
    if (listing.image.startsWith('http')) return listing.image;
    return `/books/${listing.image}`;
  };

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700 dark:border-amber-400"></div>
          <p className="text-gray-800 dark:text-amber-100">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900">
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-amber-100 flex items-center gap-2">
              Welcome to BookConnect
              <span className="text-2xl">📚</span>
            </h1>
            <p className="text-gray-600 dark:text-amber-300 mt-2 max-w-2xl">
              Discover, buy and sell second-hand books from our community
            </p>
          </div>
          <Link
            href="/marketplace/create"
            className="btn-primary whitespace-nowrap"
          >
            + Sell a Book
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white/70 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{listings.length}</p>
            <p className="text-sm text-gray-600 dark:text-amber-400">Books Available</p>
          </div>
          <div className="bg-white/70 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{GENRES.length}</p>
            <p className="text-sm text-gray-600 dark:text-amber-400">Genres</p>
          </div>
          <div className="bg-white/70 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {listings.filter(l => l.status === 'LISTED').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-amber-400">For Sale</p>
          </div>
          <div className="bg-white/70 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {new Set(listings.map(l => l.seller_id)).size}
            </p>
            <p className="text-sm text-gray-600 dark:text-amber-400">Sellers</p>
          </div>
        </div>

        {/* Browse by Genre */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-amber-100 mb-3">Browse by Genre</h2>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <Link
                key={genre.value}
                href={`/marketplace?genre=${genre.value}`}
                className="px-4 py-2 rounded-full bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-gray-700 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-800/40 hover:border-amber-300 dark:hover:border-amber-600 transition text-sm"
              >
                {genre.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Latest Books */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-amber-100">
              Latest Books
            </h2>
            <Link
              href="/marketplace"
              className="text-sm text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300"
            >
              See all →
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-12 bg-white/60 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-700/50">
              <span className="text-5xl mb-4 block">📚</span>
              <p className="text-gray-600 dark:text-amber-300 mb-4">No books listed yet.</p>
              <Link href="/marketplace/create" className="btn-primary">
                Be the first to sell a book!
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {listings.slice(0, 8).map((listing) => (
                <Link
                  key={listing.id}
                  href={`/marketplace/${listing.id}`}
                  className="group"
                >
                  <article className="bg-white dark:bg-amber-900/30 rounded-xl overflow-hidden shadow-sm border border-amber-200 dark:border-amber-700/50 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    {/* Image */}
                    <div className="relative aspect-[3/4] overflow-hidden bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center">
                      {getImageSrc(listing) ? (
                        <img
                          src={getImageSrc(listing)!}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = '<span class="text-5xl">📚</span>';
                          }}
                        />
                      ) : (
                        <span className="text-5xl">📚</span>
                      )}
                      {/* Genre Badge */}
                      <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full bg-amber-700/90 text-white">
                        {GENRES.find(g => g.value === listing.genre)?.label || listing.genre}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold text-gray-900 dark:text-amber-100 line-clamp-1 mb-1 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-amber-300 mb-2">
                        by {listing.author}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-2 border-t border-amber-100 dark:border-amber-700/30">
                        <span className="text-lg font-bold text-amber-900 dark:text-amber-100">
                          {listing.price} Lei
                        </span>
                        <span className="text-xs text-gray-500 dark:text-amber-400">
                          {listing.condition.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Call to Action */}
        <section className="bg-gradient-to-r from-amber-600 to-orange-500 dark:from-amber-700 dark:to-orange-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Have books to sell?</h2>
          <p className="text-amber-100 mb-6 max-w-xl mx-auto">
            Join our community of book lovers. List your books and find them a new home.
          </p>
          <Link
            href="/marketplace/create"
            className="inline-block bg-white text-amber-700 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 transition"
          >
            Start Selling Today
          </Link>
        </section>
      </section>
    </main>
  );
}
