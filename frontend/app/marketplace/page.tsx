"use client";

import { useEffect, useState } from "react";
import { marketplaceService } from "@/lib/services/marketplace";
import Link from "next/link";

interface Listing {
    id: number;
    title: string;
    description: string;
    price: string;
    condition: string;
    status: string;
    image: string | null;
    seller_id: string;
}

export default function MarketplacePage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        marketplaceService.getListings()
            .then((data) => {
                setListings(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-amber-900">Marketplace</h1>
                <Link href="/marketplace/create" className="btn-primary">
                    Sell a Book
                </Link>
            </div>

            {loading ? (
                <p className="text-amber-800">Loading listings...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                        <div key={listing.id} className="bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
                            {listing.image ? (
                                <img
                                    src={listing.image}
                                    alt={listing.title}
                                    className="w-full h-48 object-cover"
                                />
                            ) : (
                                <div className="w-full h-48 bg-amber-50 flex items-center justify-center text-amber-800/50">
                                    No Image
                                </div>
                            )}
                            <div className="p-4">
                                <h2 className="text-xl font-semibold mb-2 text-amber-900">{listing.title}</h2>
                                <p className="text-amber-800/80 mb-2 line-clamp-2">{listing.description}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-amber-900">${listing.price}</span>
                                    <span className="text-sm bg-amber-100 text-amber-900 px-2 py-1 rounded">{listing.condition}</span>
                                </div>
                                <div className="mt-4">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded ${listing.status === 'LISTED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {listing.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
