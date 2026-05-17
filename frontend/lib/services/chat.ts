import { api } from "../api";

export interface DirectMessage {
    id: string | number;
    _id?: string;
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
    id: string | number;
    _id?: string;
    name: string;
    description: string;
    created_at: string;
    created_by?: string;
    member_count?: number;
    members?: Array<{ id: string | number; user_id: string; joined_at: string }>;
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

export interface ChatMessagePayload {
    group?: string | number;
    group_id?: string | number;
    sender_id: string;
    sender_name?: string;
    content?: string;
    attachment?: File | null;
    attachment_name?: string;
    attachment_type?: string;
    attachment_size?: number;
}

function buildMessageFormData(data: DirectMessagePayload | ChatMessagePayload): FormData {
    const payload = new FormData();

    Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            return;
        }

        if (key === "attachment" && value instanceof File) {
            payload.append(key, value);
            return;
        }

        payload.append(key, String(value));
    });

    return payload;
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

    getGroup: async (groupId: string | number): Promise<ChatGroup> => {
        const response = await api.get(`/api/chat/groups/${groupId}/`);
        return response.data;
    },

    createGroup: async (data: { name: string; description: string; created_by: string }): Promise<ChatGroup> => {
        const response = await api.post("/api/chat/groups/", data);
        return response.data;
    },

    joinGroup: async (groupId: string | number, userId: string) => {
        const response = await api.post(`/api/chat/groups/${groupId}/join/`, { user_id: userId });
        return response.data;
    },

    leaveGroup: async (groupId: string | number, userId: string) => {
        const response = await api.post(`/api/chat/groups/${groupId}/leave/`, { user_id: userId });
        return response.data;
    },

    getGroupMembers: async (groupId: string | number) => {
        const response = await api.get(`/api/chat/groups/${groupId}/members/`);
        return response.data;
    },
    getMessages: async (groupId?: string | number, receiverId?: string, senderId?: string) => {
        const params: any = {};
        if (groupId) params.group_id = groupId;
        if (receiverId) params.receiver_id = receiverId;
        if (senderId) params.sender_id = senderId;

        const response = await api.get("/api/chat/messages/", { params });
        return response.data;
    },
    sendMessage: async (data: ChatMessagePayload) => {
        const payload = data.attachment ? buildMessageFormData(data) : data;
        const response = await api.post("/api/chat/messages/", payload);
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
        const payload = buildMessageFormData(data);
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
