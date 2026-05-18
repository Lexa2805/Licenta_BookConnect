import { api } from "../api";

export interface ManuscriptFeedback {
    id: string | number;
    manuscript: string | number;
    user_id: string;
    user_name: string;
    selected_text: string;
    comment: string;
    created_at: string;
}

export interface Manuscript {
    id: string | number;
    _id?: string;
    title: string;
    content: string;
    author_id: string;
    author_name?: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | string;
    file?: string | null;
    file_url?: string | null;
    cover_url?: string;
    cover_prompt?: string;
    cover_tagline?: string;
    cover_palette?: string[];
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
    updateManuscript: async (id: string | number, data: any, authorId?: string) => {
        const response = await api.patch(`/api/manuscripts/${id}/`, data, {
            params: authorId ? { author_id: authorId } : undefined,
        });
        return response.data;
    },
    deleteManuscript: async (id: string | number, authorId?: string) => {
        await api.delete(`/api/manuscripts/${id}/`, {
            params: authorId ? { author_id: authorId } : undefined,
        });
    },
    publishManuscript: async (id: string | number, authorId?: string) => {
        const response = await api.post(`/api/manuscripts/${id}/publish/`, undefined, {
            params: authorId ? { author_id: authorId } : undefined,
        });
        return response.data;
    },
    getManuscript: async (id: string | number, authorId?: string): Promise<Manuscript> => {
        const response = await api.get(`/api/manuscripts/${id}/`, {
            params: authorId ? { author_id: authorId } : undefined,
        });
        return response.data;
    },
    getFeedback: async (id: string | number): Promise<ManuscriptFeedback[]> => {
        const response = await api.get(`/api/manuscripts/${id}/feedback/`);
        return response.data;
    },
    createFeedback: async (
        id: string | number,
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
