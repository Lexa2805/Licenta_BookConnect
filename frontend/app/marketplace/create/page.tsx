"use client";

import { useState } from "react";
import { marketplaceService } from "@/lib/services/marketplace";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { PageLayout } from "@/components/layout/PageLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionTitle";
import { Upload } from "lucide-react";

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
    const queryClient = useQueryClient();

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

        if (!session?.user?.id) {
            setError("Please sign in before creating a listing.");
            setLoading(false);
            return;
        }

        const data = new FormData();
        data.append("title", formData.title);
        data.append("author", formData.author);
        data.append("description", formData.description);
        data.append("genre", formData.genre);
        data.append("language", formData.language);
        data.append("pages", formData.pages || "0");
        data.append("price", formData.price);
        data.append("condition", formData.condition);
        data.append("seller_id", session.user.id);
        data.append("seller_name", session.user.username || session.user.email || "Anonymous Seller");

        if (imageFile) {
            data.append("image", imageFile);
        }

        try {
            await marketplaceService.createListing(data);
            await queryClient.invalidateQueries({ queryKey: ["marketplace-listings"] });
            await queryClient.invalidateQueries({ queryKey: ["my-listings", session.user.id] });
            router.push("/marketplace");
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Failed to create listing. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageLayout
            active="marketplace"
            pageTitle="Sell a Book"
            pageSubtitle="List your book for sale or swap on the marketplace"
        >
            <div className="max-w-2xl">
                {error && (
                    <div className="mb-6 p-4 bg-bc-danger/10 border border-bc-danger/20 rounded-bc-md text-bc-danger text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Book Details */}
                    <div className="bc-card p-6 space-y-5">
                        <SectionHeader title="Book Details" />

                        <div>
                            <label className="block text-[13px] font-semibold text-bc-text mb-1.5">Book Title *</label>
                            <Input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., Harry Potter and the Sorcerer's Stone"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-bc-text mb-1.5">Author *</label>
                            <Input
                                name="author"
                                value={formData.author}
                                onChange={handleChange}
                                placeholder="e.g., J.K. Rowling"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[13px] font-semibold text-bc-text mb-1.5">Genre *</label>
                                <select
                                    name="genre"
                                    value={formData.genre}
                                    onChange={handleChange}
                                    className="w-full h-12 px-4 rounded-bc-md bg-bc-surface border border-bc-border text-sm text-bc-text focus:border-bc-primary focus:outline-none transition-all shadow-bc-xs"
                                >
                                    {GENRES.map((genre) => (
                                        <option key={genre.value} value={genre.value}>{genre.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[13px] font-semibold text-bc-text mb-1.5">Language *</label>
                                <select
                                    name="language"
                                    value={formData.language}
                                    onChange={handleChange}
                                    className="w-full h-12 px-4 rounded-bc-md bg-bc-surface border border-bc-border text-sm text-bc-text focus:border-bc-primary focus:outline-none transition-all shadow-bc-xs"
                                >
                                    {LANGUAGES.map((lang) => (
                                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-bc-text mb-1.5">Number of Pages</label>
                            <Input
                                type="number"
                                name="pages"
                                value={formData.pages}
                                onChange={handleChange}
                                placeholder="e.g., 320"
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-bc-text mb-1.5">Description *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe the book's story, condition details, or anything else buyers should know..."
                                className="w-full rounded-bc-md bg-bc-surface border border-bc-border p-4 text-sm text-bc-text focus:border-bc-primary focus:outline-none transition-all shadow-bc-xs h-32 resize-none placeholder:text-bc-subtext"
                                required
                            />
                        </div>
                    </div>

                    {/* Pricing & Condition */}
                    <div className="bc-card p-6 space-y-5">
                        <SectionHeader title="Pricing & Condition" />

                        <div>
                            <label className="block text-[13px] font-semibold text-bc-text mb-1.5">Price (Lei) *</label>
                            <Input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                rightSlot={<span className="text-sm font-semibold text-bc-subtext">Lei</span>}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-semibold text-bc-text mb-2.5">Condition *</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {CONDITIONS.map((cond) => (
                                    <label
                                        key={cond.value}
                                        className={`flex items-start p-3 border rounded-bc-md cursor-pointer transition-all ${
                                            formData.condition === cond.value
                                                ? 'border-bc-primary bg-bc-primary-soft shadow-bc-sm'
                                                : 'border-bc-border hover:border-bc-border-strong hover:bg-bc-surface-muted'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="condition"
                                            value={cond.value}
                                            checked={formData.condition === cond.value}
                                            onChange={handleChange}
                                            className="mt-1 mr-3 accent-bc-primary"
                                        />
                                        <div>
                                            <span className="block text-[14px] font-semibold text-bc-text leading-tight mb-0.5">
                                                {cond.label}
                                            </span>
                                            <p className="text-[12px] text-bc-subtext">
                                                {cond.description}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="bc-card p-6 space-y-5">
                        <SectionHeader title="Book Cover Image" />

                        <div>
                            <label className="block text-[13px] font-semibold text-bc-text mb-1.5">Upload Photo</label>
                            <div className="border-2 border-dashed border-bc-border rounded-bc-md p-8 text-center hover:border-bc-primary/50 transition-colors bg-bc-surface-muted/50">
                                {imagePreview ? (
                                    <div className="mb-4">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="mx-auto h-48 w-auto rounded-md object-cover shadow-bc-md"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-bc-surface border border-bc-border flex items-center justify-center mx-auto mb-3 text-bc-subtext">
                                        <Upload size={20} />
                                    </div>
                                )}
                                
                                <div className="flex flex-col items-center gap-1">
                                    <label className="cursor-pointer">
                                        <span className="text-[14px] font-semibold text-bc-primary hover:underline">
                                            {imagePreview ? 'Change image' : 'Upload a file'}
                                        </span>
                                        <input
                                            type="file"
                                            name="image"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="sr-only"
                                        />
                                    </label>
                                    {!imagePreview && <span className="text-[13px] text-bc-subtext">or drag and drop</span>}
                                    <span className="text-[11.5px] text-bc-subtext mt-1">PNG, JPG up to 10MB</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <Button type="submit" disabled={loading} className="w-40 justify-center">
                            {loading ? "Creating..." : "List for Sale"}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => router.push("/marketplace")}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </PageLayout>
    );
}
