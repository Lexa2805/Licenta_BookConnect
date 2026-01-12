import { api } from "../api";

export interface Review {
    id: number;
    listing: number;
    user_id: string;
    user_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export interface Listing {
    id: number;
    title: string;
    author: string;
    description: string;
    genre: string;
    language: string;
    pages: number;
    price: string;
    condition: string;
    seller_id: string;
    seller_name: string;
    status: string;
    image: string | null;
    image_url: string | null;
    average_rating: number;
    review_count: number;
    reviews?: Review[];
    created_at: string;
    updated_at?: string;
}

export interface Genre {
    value: string;
    label: string;
}

export interface Language {
    value: string;
    label: string;
}

export const marketplaceService = {
    getListings: async (genre?: string): Promise<Listing[]> => {
        const url = genre ? `/api/marketplace/listings/?genre=${genre}` : "/api/marketplace/listings/";
        const response = await api.get(url);
        return response.data;
    },

    getListing: async (id: number): Promise<Listing> => {
        const response = await api.get(`/api/marketplace/listings/${id}/`);
        return response.data;
    },

    getMyListings: async (sellerId: string): Promise<Listing[]> => {
        const response = await api.get(`/api/marketplace/listings/my_listings/?seller_id=${sellerId}`);
        return response.data;
    },

    getGenres: async (): Promise<Genre[]> => {
        const response = await api.get("/api/marketplace/listings/genres/");
        return response.data;
    },

    getLanguages: async (): Promise<Language[]> => {
        const response = await api.get("/api/marketplace/listings/languages/");
        return response.data;
    },

    createListing: async (data: FormData) => {
        // Don't set Content-Type manually - axios will set it correctly with boundary for FormData
        const response = await api.post("/api/marketplace/listings/", data);
        return response.data;
    },

    // Reviews
    getReviews: async (listingId: number): Promise<Review[]> => {
        const response = await api.get(`/api/marketplace/reviews/?listing_id=${listingId}`);
        return response.data;
    },

    createReview: async (data: { listing: number; user_id: string; user_name: string; rating: number; comment: string }): Promise<Review> => {
        const response = await api.post("/api/marketplace/reviews/", data);
        return response.data;
    },

    getPayouts: async () => {
        const response = await api.get("/api/marketplace/payouts/");
        return response.data;
    },
};
