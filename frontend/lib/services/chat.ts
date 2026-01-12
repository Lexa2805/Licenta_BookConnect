import { api } from "../api";

export interface DirectMessage {
    id: number;
    sender_id: string;
    sender_name?: string;
    receiver_id: string;
    receiver_name?: string;
    content: string;
    timestamp: string;
}

export interface Conversation {
    id: string;
    participant_id: string;
    participant_name: string;
    last_message: string;
    last_message_time: string;
    unread_count: number;
}

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

    // Direct Messages
    getDirectMessages: async (userId: string, otherUserId: string): Promise<DirectMessage[]> => {
        const response = await api.get("/api/chat/messages/", {
            params: {
                sender_id: userId,
                receiver_id: otherUserId
            }
        });
        return response.data;
    },

    sendDirectMessage: async (data: {
        sender_id: string;
        sender_name?: string;
        receiver_id: string;
        receiver_name?: string;
        content: string;
    }): Promise<DirectMessage> => {
        const response = await api.post("/api/chat/messages/", {
            ...data,
            group: null  // null group means it's a DM
        });
        return response.data;
    },

    // Get all conversations for a user
    getConversations: async (userId: string): Promise<Conversation[]> => {
        const response = await api.get("/api/chat/messages/conversations/", {
            params: { user_id: userId }
        });
        return response.data;
    },
};
