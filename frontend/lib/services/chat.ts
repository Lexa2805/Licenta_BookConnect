import { api } from "../api";

export interface DirectMessage {
    id: number;
    sender_id: string;
    sender_name?: string;
    receiver_id: string;
    receiver_name?: string;
    content: string;
    attachment?: string | null;
    attachment_url?: string | null;
    attachment_name?: string;
    attachment_type?: string;
    attachment_size?: number | null;
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

export interface ChatGroup {
    id: number;
    name: string;
    description: string;
    created_at: string;
    created_by?: string;
    member_count?: number;
    members?: Array<{ id: number; user_id: string; joined_at: string }>;
    is_member?: boolean;
    last_message?: string;
    last_message_time?: string;
}

export interface DirectMessagePayload {
    sender_id: string;
    sender_name?: string;
    receiver_id: string;
    receiver_name?: string;
    content?: string;
    attachment?: File | null;
    attachment_name?: string;
    attachment_type?: string;
    attachment_size?: number;
}

export const chatService = {
    // Group Management
    getGroups: async (): Promise<ChatGroup[]> => {
        const response = await api.get("/api/chat/groups/");
        return response.data;
    },

    getMyGroups: async (userId: string): Promise<ChatGroup[]> => {
        const response = await api.get("/api/chat/groups/my_groups/", {
            params: { user_id: userId }
        });
        return response.data;
    },

    getGroup: async (groupId: number): Promise<ChatGroup> => {
        const response = await api.get(`/api/chat/groups/${groupId}/`);
        return response.data;
    },

    createGroup: async (data: { name: string; description: string; created_by: string }): Promise<ChatGroup> => {
        const response = await api.post("/api/chat/groups/", data);
        return response.data;
    },

    joinGroup: async (groupId: number, userId: string) => {
        const response = await api.post(`/api/chat/groups/${groupId}/join/`, { user_id: userId });
        return response.data;
    },

    leaveGroup: async (groupId: number, userId: string) => {
        const response = await api.post(`/api/chat/groups/${groupId}/leave/`, { user_id: userId });
        return response.data;
    },

    getGroupMembers: async (groupId: number) => {
        const response = await api.get(`/api/chat/groups/${groupId}/members/`);
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

    sendDirectMessage: async (data: DirectMessagePayload): Promise<DirectMessage> => {
        const payload = new FormData();
        payload.append("sender_id", data.sender_id);
        if (data.sender_name) payload.append("sender_name", data.sender_name);
        payload.append("receiver_id", data.receiver_id);
        if (data.receiver_name) payload.append("receiver_name", data.receiver_name);
        if (data.content !== undefined) payload.append("content", data.content);
        if (data.attachment) payload.append("attachment", data.attachment);
        if (data.attachment_name) payload.append("attachment_name", data.attachment_name);
        if (data.attachment_type) payload.append("attachment_type", data.attachment_type);
        if (data.attachment_size !== undefined) {
            payload.append("attachment_size", String(data.attachment_size));
        }

        const response = await api.post("/api/chat/messages/", payload);
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
