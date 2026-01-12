"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { marketplaceService, Listing, Review } from "@/lib/services/marketplace";
import Link from "next/link";

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

export default function BookDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const id = Number(params.id);

    const [listing, setListing] = useState<Listing | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Review form state
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        if (id) {
            loadListing();
        }
    }, [id]);

    const loadListing = async () => {
        try {
            const data = await marketplaceService.getListing(id);
            setListing(data);
        } catch (err) {
            console.error(err);
            setError("Could not load book details. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getImageSrc = () => {
        // Use image_url from backend if available (for uploaded images)
        if (listing?.image_url) return listing.image_url;
        // Fallback to old method for legacy images
        if (!listing?.image) return null;
        if (listing.image.startsWith('http')) return listing.image;
        return `/books/${listing.image}`;
    };

    const renderStars = (rating: number, interactive: boolean = false, onRate?: (r: number) => void) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={!interactive}
                        onClick={() => interactive && onRate && onRate(star)}
                        className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition`}
                    >
                        <svg
                            className={`w-6 h-6 ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </button>
                ))}
            </div>
        );
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user) {
            alert("Please log in to leave a review");
            return;
        }

        setSubmittingReview(true);
        try {
            await marketplaceService.createReview({
                listing: id,
                user_id: session.user.id || 'anonymous',
                user_name: session.user.username || 'Anonymous',
                rating: reviewRating,
                comment: reviewComment,
            });
            // Reload listing to get updated reviews
            await loadListing();
            setShowReviewForm(false);
            setReviewComment("");
            setReviewRating(5);
        } catch (err) {
            console.error(err);
            alert("Failed to submit review. Please try again.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-700 dark:border-amber-400"></div>
                    <span className="ml-3 text-amber-800 dark:text-amber-200 text-lg">Loading book details...</span>
                </div>
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className="container mx-auto p-4">
                <div className="text-center py-20">
                    <p className="text-red-600 dark:text-red-400 text-lg mb-4">{error || "Book not found"}</p>
                    <Link href="/marketplace" className="btn-primary">
                        ← Back to Marketplace
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            {/* Back Button */}
            <Link
                href="/marketplace"
                className="inline-flex items-center text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 mb-6 transition"
            >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Marketplace
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Book Image */}
                <div className="relative">
                    <div className="sticky top-24">
                        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-amber-100 dark:bg-amber-800/30 shadow-xl flex items-center justify-center">
                            {getImageSrc() ? (
                                <img
                                    src={getImageSrc()!}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.parentElement!.innerHTML = '<span class="text-8xl">📚</span>';
                                    }}
                                />
                            ) : (
                                <span className="text-8xl">📚</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Book Details */}
                <div className="space-y-6">
                    {/* Title & Author */}
                    <div>
                        <div className="flex flex-wrap gap-2 mb-3">
                            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-amber-700 dark:bg-amber-600 text-white">
                                {GENRES[listing.genre] || listing.genre}
                            </span>
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${listing.condition === 'NEW' ? 'bg-green-500 text-white' :
                                listing.condition === 'LIKE_NEW' ? 'bg-green-400 text-white' :
                                    listing.condition === 'GOOD' ? 'bg-blue-500 text-white' :
                                        listing.condition === 'FAIR' ? 'bg-yellow-500 text-white' :
                                            'bg-orange-500 text-white'
                                }`}>
                                {listing.condition.replace('_', ' ')}
                            </span>
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${listing.status === 'LISTED' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' :
                                'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                                }`}>
                                {listing.status}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                            {listing.title}
                        </h1>
                        <p className="text-xl text-amber-700 dark:text-amber-300">
                            by {listing.author}
                        </p>
                    </div>

                    {/* Rating Summary */}
                    <div className="flex items-center gap-3 p-4 bg-white/60 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-700/50">
                        {renderStars(Math.round(listing.average_rating || 0))}
                        <span className="text-amber-900 dark:text-amber-100 font-semibold">
                            {(listing.average_rating || 0).toFixed(1)}
                        </span>
                        <span className="text-amber-600 dark:text-amber-400">
                            ({listing.review_count || 0} {listing.review_count === 1 ? 'review' : 'reviews'})
                        </span>
                    </div>

                    {/* Price & Buy */}
                    <div className="p-6 bg-white dark:bg-amber-900/40 rounded-xl border border-amber-200 dark:border-amber-700/50 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-4xl font-bold text-amber-900 dark:text-amber-100">
                                {listing.price} Lei
                            </span>
                        </div>
                        <button className="w-full btn-primary py-3 text-lg">
                            Buy Now
                        </button>
                        <button className="w-full mt-3 btn-secondary py-3">
                            Add to Wishlist
                        </button>
                    </div>

                    {/* Book Details */}
                    <div className="p-6 bg-white/60 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-700/50">
                        <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-3">
                            Book Details
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-amber-600 dark:text-amber-400">Language</p>
                                <p className="font-medium text-amber-900 dark:text-amber-100">
                                    {LANGUAGES[listing.language || 'OTHER'] || listing.language || 'Not specified'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-amber-600 dark:text-amber-400">Pages</p>
                                <p className="font-medium text-amber-900 dark:text-amber-100">
                                    {listing.pages || 'Not specified'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-amber-600 dark:text-amber-400">Genre</p>
                                <p className="font-medium text-amber-900 dark:text-amber-100">
                                    {GENRES[listing.genre] || listing.genre}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-amber-600 dark:text-amber-400">Condition</p>
                                <p className="font-medium text-amber-900 dark:text-amber-100">
                                    {listing.condition.replace('_', ' ')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="p-6 bg-white/60 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-700/50">
                        <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-3">
                            About this book
                        </h2>
                        <p className="text-amber-800 dark:text-amber-200 leading-relaxed whitespace-pre-line">
                            {listing.description}
                        </p>
                    </div>

                    {/* Seller Info */}
                    <div className="p-6 bg-white/60 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-700/50">
                        <h2 className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-3">
                            Seller Information
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-amber-200 dark:bg-amber-700 flex items-center justify-center">
                                <span className="text-2xl">👤</span>
                            </div>
                            <div>
                                <p className="font-semibold text-amber-900 dark:text-amber-100">
                                    {listing.seller_name}
                                </p>
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    Listed on {formatDate(listing.created_at)}
                                </p>
                            </div>
                        </div>
                        {session?.user && listing.seller_id !== session.user.id ? (
                            <Link
                                href={`/community/dm/${listing.seller_id}?name=${encodeURIComponent(listing.seller_name)}&book=${encodeURIComponent(listing.title)}`}
                                className="mt-4 w-full py-2 border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-800/30 transition flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                Contact Seller
                            </Link>
                        ) : session?.user && listing.seller_id === session.user.id ? (
                            <p className="mt-4 text-center text-amber-600 dark:text-amber-400 text-sm">
                                This is your listing
                            </p>
                        ) : (
                            <Link
                                href="/login"
                                className="mt-4 w-full py-2 border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-800/30 transition flex items-center justify-center gap-2"
                            >
                                Log in to Contact Seller
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <section className="mt-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                        Reviews ({listing.review_count || 0})
                    </h2>
                    {session?.user && !showReviewForm && (
                        <button
                            onClick={() => setShowReviewForm(true)}
                            className="btn-primary"
                        >
                            Write a Review
                        </button>
                    )}
                </div>

                {/* Review Form */}
                {showReviewForm && (
                    <form
                        onSubmit={handleSubmitReview}
                        className="mb-8 p-6 bg-white dark:bg-amber-900/40 rounded-xl border border-amber-200 dark:border-amber-700/50"
                    >
                        <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-4">
                            Write your review
                        </h3>

                        <div className="mb-4">
                            <label className="block text-amber-800 dark:text-amber-200 mb-2">Your Rating</label>
                            {renderStars(reviewRating, true, setReviewRating)}
                        </div>

                        <div className="mb-4">
                            <label className="block text-amber-800 dark:text-amber-200 mb-2">Your Review</label>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Share your thoughts about this book..."
                                className="w-full p-3 border border-amber-200 dark:border-amber-700/50 rounded-lg bg-white dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 placeholder-amber-400 dark:placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                rows={4}
                                required
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={submittingReview}
                                className="btn-primary disabled:opacity-50"
                            >
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowReviewForm(false)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* Reviews List */}
                {listing.reviews && listing.reviews.length > 0 ? (
                    <div className="space-y-4">
                        {listing.reviews.map((review) => (
                            <div
                                key={review.id}
                                className="p-6 bg-white/60 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-700/50"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-700 flex items-center justify-center">
                                            <span className="text-lg">👤</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-amber-900 dark:text-amber-100">
                                                {review.user_name}
                                            </p>
                                            <p className="text-xs text-amber-600 dark:text-amber-400">
                                                {formatDate(review.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    {renderStars(review.rating)}
                                </div>
                                <p className="text-amber-800 dark:text-amber-200">
                                    {review.comment}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white/60 dark:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-700/50">
                        <p className="text-amber-600 dark:text-amber-400 text-lg">No reviews yet.</p>
                        <p className="text-amber-500 dark:text-amber-500 mt-1">Be the first to review this book!</p>
                    </div>
                )}
            </section>
        </div>
    );
}
