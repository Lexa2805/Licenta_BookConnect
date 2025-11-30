import { api } from "../api";

export const marketplaceService = {
    getListings: async () => {
        const response = await api.get("/api/marketplace/listings/");
        return response.data;
    },
    createListing: async (data: FormData) => {
        const response = await api.post("/api/marketplace/listings/", data, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },
    getPayouts: async () => {
        const response = await api.get("/api/marketplace/payouts/");
        return response.data;
    },
};
