import { api } from "../api";

export const chatService = {
    getGroups: async () => {
        const response = await api.get("/api/chat/groups/");
        return response.data;
    },
    joinGroup: async (groupId: number, userId: string) => {
        const response = await api.post(`/api/chat/groups/${groupId}/join/`, { user_id: userId });
        return response.data;
    },
    getMessages: async (groupId?: number, receiverId?: string, senderId?: string) => {
        const params: any = {};
        if (groupId) params.group_id = groupId;
        if (receiverId) params.receiver_id = receiverId;
        if (senderId) params.sender_id = senderId;

        const response = await api.get("/api/chat/messages/", { params });
        return response.data;
    },
    sendMessage: async (data: any) => {
        const response = await api.post("/api/chat/messages/", data);
        return response.data;
    },
};
