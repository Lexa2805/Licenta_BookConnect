import { api } from "../api";

export const manuscriptsService = {
    getManuscripts: async (authorId?: string) => {
        const response = await api.get("/api/manuscripts/", {
            params: authorId ? { author_id: authorId } : undefined,
        });
        return response.data;
    },
    createManuscript: async (data: any) => {
        const response = await api.post("/api/manuscripts/", data);
        return response.data;
    },
    updateManuscript: async (id: number, data: any, authorId?: string) => {
        const response = await api.patch(`/api/manuscripts/${id}/`, data, {
            params: authorId ? { author_id: authorId } : undefined,
        });
        return response.data;
    },
    publishManuscript: async (id: number, authorId?: string) => {
        const response = await api.post(`/api/manuscripts/${id}/publish/`, undefined, {
            params: authorId ? { author_id: authorId } : undefined,
        });
        return response.data;
    },
    getManuscript: async (id: number, authorId?: string) => {
        const response = await api.get(`/api/manuscripts/${id}/`, {
            params: authorId ? { author_id: authorId } : undefined,
        });
        return response.data;
    },
};
