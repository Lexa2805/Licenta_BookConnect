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

export default function MarketplacePage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

    useEffect(() => {
        loadListings();
    }, [selectedGenre]);

    const loadListings = async () => {
        setLoading(true);
        try {
            const data = await marketplaceService.getListings(selectedGenre || undefined);
            setListings(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getImageSrc = (listing: Listing) => {
        // Use image_url from backend if available (for uploaded images)
        if (listing.image_url) return listing.image_url;
        // Fallback to old method for legacy images
        if (!listing.image) return null;
        if (listing.image.startsWith('http')) return listing.image;
        return `/books/${listing.image}`;
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">Marketplace</h1>
                    <p className="text-amber-800/70 dark:text-amber-200/70 mt-1">
                        Discover and buy second-hand books from our community
                    </p>
                </div>
                <Link href="/marketplace/create" className="btn-primary">
                    Sell a Book
                </Link>
            </div>

            {/* Genre Filter */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-3">Browse by Genre</h2>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedGenre(null)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedGenre === null
                            ? 'bg-amber-700 dark:bg-amber-600 text-white'
                            : 'bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-amber-900 dark:text-amber-100 hover:bg-amber-50 dark:hover:bg-amber-800/40'
                            }`}
                    >
                        All Books
                    </button>
                    {GENRES.map((genre) => (
                        <button
                            key={genre.value}
                            onClick={() => setSelectedGenre(genre.value)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${selectedGenre === genre.value
                                ? 'bg-amber-700 dark:bg-amber-600 text-white'
                                : 'bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-amber-900 dark:text-amber-100 hover:bg-amber-50 dark:hover:bg-amber-800/40'
                                }`}
                        >
                            {genre.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Results count */}
            {!loading && (
                <p className="text-amber-800/70 dark:text-amber-200/70 mb-4">
                    {listings.length} {listings.length === 1 ? 'book' : 'books'} found
                    {selectedGenre && ` in ${GENRES.find(g => g.value === selectedGenre)?.label}`}
                </p>
            )}

            {/* Listings Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700 dark:border-amber-400"></div>
                    <span className="ml-3 text-amber-800 dark:text-amber-200">Loading books...</span>
                </div>
            ) : listings.length === 0 ? (
                <div className="text-center py-12 bg-white/60 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-700/50">
                    <p className="text-amber-800 dark:text-amber-200 text-lg">No books found in this category.</p>
                    <p className="text-amber-700/70 dark:text-amber-300/70 mt-2">Try selecting a different genre or be the first to list one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {listings.map((listing) => (
                        <Link
                            href={`/marketplace/${listing.id}`}
                            key={listing.id}
                            className="group"
                        >
                            <article className="bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                                {/* Book Image */}
                                <div className="relative aspect-[3/4] overflow-hidden bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center">
                                    {getImageSrc(listing) ? (
                                        <img
                                            src={getImageSrc(listing)!}
                                            alt={listing.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                target.parentElement!.innerHTML = '<span class="text-6xl">📚</span>';
                                            }}
                                        />
                                    ) : (
                                        <span className="text-6xl">📚</span>
                                    )}
                                    {/* Genre Badge */}
                                    <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full bg-amber-700/90 text-white">
                                        {GENRES.find(g => g.value === listing.genre)?.label || listing.genre}
                                    </span>
                                    {/* Condition Badge */}
                                    <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full ${listing.condition === 'NEW' ? 'bg-green-500 text-white' :
                                        listing.condition === 'LIKE_NEW' ? 'bg-green-400 text-white' :
                                            listing.condition === 'GOOD' ? 'bg-blue-500 text-white' :
                                                listing.condition === 'FAIR' ? 'bg-yellow-500 text-white' :
                                                    'bg-orange-500 text-white'
                                        }`}>
                                        {listing.condition.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Book Info */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100 line-clamp-2 mb-1 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition">
                                        {listing.title}
                                    </h2>
                                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                                        by {listing.author}
                                    </p>

                                    {/* Rating */}
                                    <div className="flex items-center gap-2 mb-2">
                                        {renderStars(Math.round(listing.average_rating))}
                                        <span className="text-xs text-amber-600 dark:text-amber-400">
                                            ({listing.review_count} {listing.review_count === 1 ? 'review' : 'reviews'})
                                        </span>
                                    </div>

                                    <p className="text-amber-800/70 dark:text-amber-200/70 text-sm line-clamp-2 mb-3 flex-1">
                                        {listing.description}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex justify-between items-center pt-3 border-t border-amber-100 dark:border-amber-700/30">
                                        <span className="text-xl font-bold text-amber-900 dark:text-amber-100">
                                            {listing.price} Lei
                                        </span>
                                        <span className="text-xs text-amber-600 dark:text-amber-400">
                                            by {listing.seller_name}
                                        </span>
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
