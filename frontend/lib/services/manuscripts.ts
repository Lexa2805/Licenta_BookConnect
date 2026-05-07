import { api } from "../api";

export interface ManuscriptFeedback {
    id: number;
    manuscript: number;
    user_id: string;
    user_name: string;
    selected_text: string;
    comment: string;
    created_at: string;
}

export interface Manuscript {
    id: number;
    title: string;
    content: string;
    author_id: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | string;
    file?: string | null;
    feedback?: ManuscriptFeedback[];
    created_at: string;
    updated_at: string;
}

export const manuscriptsService = {
    getManuscripts: async (authorId?: string): Promise<Manuscript[]> => {
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
    deleteManuscript: async (id: number, authorId?: string) => {
        await api.delete(`/api/manuscripts/${id}/`, {
            params: authorId ? { author_id: authorId } : undefined,
        });
    },
    publishManuscript: async (id: number, authorId?: string) => {
        const response = await api.post(`/api/manuscripts/${id}/publish/`, undefined, {
            params: authorId ? { author_id: authorId } : undefined,
        });
        return response.data;
    },
    getManuscript: async (id: number, authorId?: string): Promise<Manuscript> => {
        const response = await api.get(`/api/manuscripts/${id}/`, {
            params: authorId ? { author_id: authorId } : undefined,
        });
        return response.data;
    },
    getFeedback: async (id: number): Promise<ManuscriptFeedback[]> => {
        const response = await api.get(`/api/manuscripts/${id}/feedback/`);
        return response.data;
    },
    createFeedback: async (
        id: number,
        data: {
            user_id: string;
            user_name: string;
            selected_text?: string;
            comment: string;
        },
    ): Promise<ManuscriptFeedback> => {
        const response = await api.post(`/api/manuscripts/${id}/feedback/`, data);
        return response.data;
    },
};
