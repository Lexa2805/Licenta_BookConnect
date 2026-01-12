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
    makePrivate: async (id: number) => {
        const response = await api.post(`/api/manuscripts/${id}/make_private/`);
        return response.data;
    },
    archiveManuscript: async (id: number) => {
        const response = await api.post(`/api/manuscripts/${id}/archive/`);
        return response.data;
    },
    deleteManuscript: async (id: number) => {
        const response = await api.delete(`/api/manuscripts/${id}/`);
        return response.data;
    },
    getManuscript: async (id: number) => {
        const response = await api.get(`/api/manuscripts/${id}/`);
        return response.data;
    },
    downloadManuscript: async (id: number, title: string) => {
        const response = await api.get(`/api/manuscripts/${id}/download/`, {
            responseType: 'blob',
        });
        // Create a download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${title}.txt`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
    uploadManuscript: async (file: File, title: string, authorId: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('author_id', authorId);

        const response = await api.post("/api/manuscripts/upload/", formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
