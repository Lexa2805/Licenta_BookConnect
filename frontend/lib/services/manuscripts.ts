import { api } from "../api";

export const manuscriptsService = {
    getManuscripts: async () => {
        const response = await api.get("/api/manuscripts/");
        return response.data;
    },
    createManuscript: async (data: any) => {
        const response = await api.post("/api/manuscripts/", data);
        return response.data;
    },
    updateManuscript: async (id: number, data: any) => {
        const response = await api.patch(`/api/manuscripts/${id}/`, data);
        return response.data;
    },
    publishManuscript: async (id: number) => {
        const response = await api.post(`/api/manuscripts/${id}/publish/`);
        return response.data;
    },
    getManuscript: async (id: number) => {
        const response = await api.get(`/api/manuscripts/${id}/`);
        return response.data;
    },
};
