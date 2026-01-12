"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { marketplaceService, Listing } from "@/lib/services/marketplace";
import Link from "next/link";
import { useRouter } from "next/navigation";

const GENRES: { [key: string]: string } = {
    'FANTASY': 'Fantasy',
    'SCIENCE_FICTION': 'Science Fiction',
    'ROMANCE': 'Romance',
    'THRILLER': 'Thriller',
    'MYSTERY': 'Mystery',
    'SELF_HELP': 'Self-Help',
    'BUSINESS': 'Business',
    'PROGRAMMING': 'Programming',
    'CLASSIC': 'Classic',
    'OTHER': 'Other',
};

const LANGUAGES: { [key: string]: string } = {
    'RO': 'Română',
    'EN': 'English',
    'FR': 'Français',
    'DE': 'Deutsch',
    'ES': 'Español',
    'IT': 'Italiano',
    'OTHER': 'Other',
};

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [myListings, setMyListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated' && session?.user?.id) {
            loadMyListings();
        }
    }, [status, session]);

    const loadMyListings = async () => {
        try {
            const data = await marketplaceService.getMyListings(session!.user!.id!);
            setMyListings(data);
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ro-RO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (status === 'loading' || loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-700 dark:border-amber-400"></div>
                    <span className="ml-3 text-amber-800 dark:text-amber-200 text-lg">Loading profile...</span>
                </div>
            </div>
        );
    }

    if (!session?.user) {
        return null; // Redirect will happen
    }

    const listedBooks = myListings.filter(l => l.status === 'LISTED');
    const soldBooks = myListings.filter(l => l.status === 'SOLD');

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            {/* Profile Header */}
            <div className="bg-white dark:bg-amber-900/30 rounded-2xl border border-amber-200 dark:border-amber-700/50 p-6 mb-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                        <span className="text-4xl text-white">
                            {(session.user.username || 'U')[0].toUpperCase()}
                        </span>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                            {session.user.username || 'User'}
                        </h1>
                        <p className="text-amber-700 dark:text-amber-300 mt-1">
                            {session.user.email}
                        </p>
                        <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                            <div className="bg-amber-100 dark:bg-amber-800/40 px-4 py-2 rounded-lg">
                                <span className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                                    {myListings.length}
                                </span>
                                <span className="text-amber-700 dark:text-amber-300 ml-2">
                                    {myListings.length === 1 ? 'Book Listed' : 'Books Listed'}
                                </span>
                            </div>
                            <div className="bg-green-100 dark:bg-green-900/40 px-4 py-2 rounded-lg">
                                <span className="text-2xl font-bold text-green-800 dark:text-green-300">
                                    {soldBooks.length}
                                </span>
                                <span className="text-green-700 dark:text-green-400 ml-2">
                                    Sold
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Link href="/marketplace/create" className="btn-primary">
                            + Sell a Book
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-amber-200 dark:border-amber-700/50">
                <button
                    onClick={() => setActiveTab('listings')}
                    className={`pb-3 px-4 font-medium transition ${activeTab === 'listings'
                        ? 'text-amber-900 dark:text-amber-100 border-b-2 border-amber-600 dark:border-amber-400'
                        : 'text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200'
                        }`}
                >
                    My Listings ({myListings.length})
                </button>
            </div>

            {/* My Listings */}
            {activeTab === 'listings' && (
                <>
                    {myListings.length === 0 ? (
                        <div className="text-center py-16 bg-white/60 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-700/50">
                            <span className="text-6xl mb-4 block">📚</span>
                            <h3 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-2">
                                No books listed yet
                            </h3>
                            <p className="text-amber-700 dark:text-amber-300 mb-6">
                                Start selling your books on the marketplace!
                            </p>
                            <Link href="/marketplace/create" className="btn-primary">
                                List Your First Book
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myListings.map((listing) => (
                                <div
                                    key={listing.id}
                                    className="bg-white dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
                                >
                                    {/* Image */}
                                    <div className="relative aspect-[3/4] bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center">
                                        {getImageSrc(listing) ? (
                                            <img
                                                src={getImageSrc(listing)!}
                                                alt={listing.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    target.parentElement!.innerHTML = '<span class="text-6xl">📚</span>';
                                                }}
                                            />
                                        ) : (
                                            <span className="text-6xl">📚</span>
                                        )}
                                        {/* Status Badge */}
                                        <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-1 rounded-full ${listing.status === 'LISTED'
                                            ? 'bg-green-500 text-white'
                                            : listing.status === 'SOLD'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-500 text-white'
                                            }`}>
                                            {listing.status}
                                        </span>
                                        {/* Genre Badge */}
                                        <span className="absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full bg-amber-700/90 text-white">
                                            {GENRES[listing.genre] || listing.genre}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <h3 className="font-semibold text-amber-900 dark:text-amber-100 line-clamp-1">
                                            {listing.title}
                                        </h3>
                                        <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                                            by {listing.author}
                                        </p>

                                        {/* Details */}
                                        <div className="text-xs text-amber-600 dark:text-amber-400 space-y-1 mb-3">
                                            <div className="flex justify-between">
                                                <span>Language:</span>
                                                <span>{LANGUAGES[listing.language || 'OTHER'] || listing.language || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Pages:</span>
                                                <span>{listing.pages || '-'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Condition:</span>
                                                <span>{listing.condition.replace('_', ' ')}</span>
                                            </div>
                                        </div>

                                        {/* Price & Actions */}
                                        <div className="flex items-center justify-between pt-3 border-t border-amber-100 dark:border-amber-700/30">
                                            <span className="text-xl font-bold text-amber-900 dark:text-amber-100">
                                                {listing.price} Lei
                                            </span>
                                            <Link
                                                href={`/marketplace/${listing.id}`}
                                                className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
                                            >
                                                View →
                                            </Link>
                                        </div>

                                        {/* Rating & Reviews */}
                                        <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 dark:text-amber-400">
                                            <span>⭐ {(listing.average_rating || 0).toFixed(1)}</span>
                                            <span>•</span>
                                            <span>{listing.review_count || 0} reviews</span>
                                        </div>

                                        {/* Listed Date */}
                                        <p className="text-xs text-amber-500 dark:text-amber-500 mt-2">
                                            Listed on {formatDate(listing.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
