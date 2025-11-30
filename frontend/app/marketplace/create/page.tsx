"use client";

import { useState } from "react";
import { marketplaceService } from "@/lib/services/marketplace";
import { useRouter } from "next/navigation";

export default function CreateListingPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        condition: "GOOD",
        seller_id: "user_123", // Mock user ID for now
    });
    const [image, setImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append("title", formData.title);
        data.append("description", formData.description);
        data.append("price", formData.price);
        data.append("condition", formData.condition);
        data.append("seller_id", formData.seller_id);
        if (image) {
            data.append("image", image);
        }

        try {
            await marketplaceService.createListing(data);
            router.push("/marketplace");
        } catch (err) {
            console.error(err);
            alert("Failed to create listing");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">Sell a Book</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full border rounded p-2 h-32"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Price ($)</label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                        step="0.01"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Condition</label>
                    <select
                        name="condition"
                        value={formData.condition}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                    >
                        <option value="NEW">New</option>
                        <option value="LIKE_NEW">Like New</option>
                        <option value="GOOD">Good</option>
                        <option value="FAIR">Fair</option>
                        <option value="POOR">Poor</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Photo</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full border rounded p-2"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400"
                >
                    {loading ? "Creating..." : "List Book"}
                </button>
            </form>
        </div>
    );
}
