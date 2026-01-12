"use client";

import { useState } from "react";
import { marketplaceService } from "@/lib/services/marketplace";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

const GENRES = [
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

const CONDITIONS = [
    { value: 'NEW', label: 'New', description: 'Never used, in perfect condition' },
    { value: 'LIKE_NEW', label: 'Like New', description: 'Minimal signs of use' },
    { value: 'GOOD', label: 'Good', description: 'Some wear but fully functional' },
    { value: 'FAIR', label: 'Fair', description: 'Noticeable wear, still readable' },
    { value: 'POOR', label: 'Poor', description: 'Heavy wear, may have damage' },
];

const LANGUAGES = [
    { value: 'RO', label: 'Română' },
    { value: 'EN', label: 'English' },
    { value: 'FR', label: 'Français' },
    { value: 'DE', label: 'Deutsch' },
    { value: 'ES', label: 'Español' },
    { value: 'IT', label: 'Italiano' },
    { value: 'OTHER', label: 'Other' },
];

export default function CreateListingPage() {
    const router = useRouter();
    const { data: session } = useSession();

    const [formData, setFormData] = useState({
        title: "",
        author: "",
        description: "",
        genre: "OTHER",
        language: "RO",
        pages: "",
        price: "",
        condition: "GOOD",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const data = new FormData();
        data.append("title", formData.title);
        data.append("author", formData.author);
        data.append("description", formData.description);
        data.append("genre", formData.genre);
        data.append("language", formData.language);
        data.append("pages", formData.pages || "0");
        data.append("price", formData.price);
        data.append("condition", formData.condition);
        data.append("seller_id", session?.user?.id || "anonymous");
        data.append("seller_name", session?.user?.username || "Anonymous Seller");

        if (imageFile) {
            data.append("image", imageFile);
        }

        try {
            await marketplaceService.createListing(data);
            router.push("/marketplace");
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data
                ? JSON.stringify(err.response.data)
                : "Failed to create listing. Please try again.";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/marketplace"
                    className="inline-flex items-center text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 mb-4 transition"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Marketplace
                </Link>
                <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">Sell a Book</h1>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                    List your book for sale on the marketplace
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white dark:bg-amber-900/30 p-6 rounded-xl border border-amber-200 dark:border-amber-700/50 space-y-5">
                    <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100 border-b border-amber-200 dark:border-amber-700/50 pb-2">
                        Book Details
                    </h2>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                            Book Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Harry Potter and the Sorcerer's Stone"
                            className="w-full border border-amber-200 dark:border-amber-700/50 rounded-lg p-3 bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 placeholder-amber-400 dark:placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            required
                        />
                    </div>

                    {/* Author */}
                    <div>
                        <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                            Author *
                        </label>
                        <input
                            type="text"
                            name="author"
                            value={formData.author}
                            onChange={handleChange}
                            placeholder="e.g., J.K. Rowling"
                            className="w-full border border-amber-200 dark:border-amber-700/50 rounded-lg p-3 bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 placeholder-amber-400 dark:placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            required
                        />
                    </div>

                    {/* Genre and Language */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                                Genre *
                            </label>
                            <select
                                name="genre"
                                value={formData.genre}
                                onChange={handleChange}
                                className="w-full border border-amber-200 dark:border-amber-700/50 rounded-lg p-3 bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                {GENRES.map((genre) => (
                                    <option key={genre.value} value={genre.value}>
                                        {genre.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                                Language *
                            </label>
                            <select
                                name="language"
                                value={formData.language}
                                onChange={handleChange}
                                className="w-full border border-amber-200 dark:border-amber-700/50 rounded-lg p-3 bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                {LANGUAGES.map((lang) => (
                                    <option key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Pages */}
                    <div>
                        <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                            Number of Pages
                        </label>
                        <input
                            type="number"
                            name="pages"
                            value={formData.pages}
                            onChange={handleChange}
                            placeholder="e.g., 320"
                            className="w-full border border-amber-200 dark:border-amber-700/50 rounded-lg p-3 bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 placeholder-amber-400 dark:placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            min="0"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe the book's story, condition details, or anything else buyers should know..."
                            className="w-full border border-amber-200 dark:border-amber-700/50 rounded-lg p-3 bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 placeholder-amber-400 dark:placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 h-32 resize-none"
                            required
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-amber-900/30 p-6 rounded-xl border border-amber-200 dark:border-amber-700/50 space-y-5">
                    <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100 border-b border-amber-200 dark:border-amber-700/50 pb-2">
                        Pricing & Condition
                    </h2>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                            Price (Lei) *
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="0.00"
                                className="w-full border border-amber-200 dark:border-amber-700/50 rounded-lg p-3 pr-16 bg-white dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 placeholder-amber-400 dark:placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                step="0.01"
                                min="0"
                                required
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-600 dark:text-amber-400 font-medium">
                                Lei
                            </span>
                        </div>
                    </div>

                    {/* Condition */}
                    <div>
                        <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                            Condition *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {CONDITIONS.map((cond) => (
                                <label
                                    key={cond.value}
                                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition ${formData.condition === cond.value
                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-800/40'
                                        : 'border-amber-200 dark:border-amber-700/50 hover:bg-amber-50 dark:hover:bg-amber-800/20'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="condition"
                                        value={cond.value}
                                        checked={formData.condition === cond.value}
                                        onChange={handleChange}
                                        className="mt-1 mr-3"
                                    />
                                    <div>
                                        <span className="font-medium text-amber-900 dark:text-amber-100">
                                            {cond.label}
                                        </span>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">
                                            {cond.description}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-amber-900/30 p-6 rounded-xl border border-amber-200 dark:border-amber-700/50 space-y-5">
                    <h2 className="text-lg font-semibold text-amber-900 dark:text-amber-100 border-b border-amber-200 dark:border-amber-700/50 pb-2">
                        Book Cover Image
                    </h2>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                            Upload Photo
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-amber-200 dark:border-amber-700/50 border-dashed rounded-lg hover:border-amber-400 dark:hover:border-amber-500 transition">
                            <div className="space-y-1 text-center">
                                {imagePreview ? (
                                    <div className="mb-4">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="mx-auto h-48 w-auto rounded-lg object-cover"
                                        />
                                    </div>
                                ) : (
                                    <svg
                                        className="mx-auto h-12 w-12 text-amber-400"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                    >
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                                <div className="flex text-sm text-amber-600 dark:text-amber-400 justify-center">
                                    <label className="relative cursor-pointer rounded-md font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200">
                                        <span>{imagePreview ? 'Change image' : 'Upload a file'}</span>
                                        <input
                                            type="file"
                                            name="image"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="sr-only"
                                        />
                                    </label>
                                    {!imagePreview && <p className="pl-1">or drag and drop</p>}
                                </div>
                                <p className="text-xs text-amber-500 dark:text-amber-500">
                                    PNG, JPG, GIF up to 10MB
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seller Info Preview */}
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-700/50">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        <span className="font-medium">Listing as:</span>{" "}
                        {session?.user?.username || session?.user?.name || "Anonymous Seller"}
                    </p>
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 btn-primary py-3 text-lg disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Creating...
                            </span>
                        ) : (
                            "List Book for Sale"
                        )}
                    </button>
                    <Link href="/marketplace" className="btn-secondary py-3 px-6">
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}
