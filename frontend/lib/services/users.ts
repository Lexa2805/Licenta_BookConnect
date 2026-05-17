export interface PublicUser {
    id: string;
    username: string;
    email: string;
    role: string;
    profile?: UserProfile;
    created_at: string | null;
}

export interface UserProfile {
    avatar_url?: string;
    avatar_public_id?: string;
    about?: string;
}

export interface CurrentUserProfile extends PublicUser {}

async function fetchUsers(params: URLSearchParams): Promise<PublicUser[]> {
    const response = await fetch(`/api/users?${params.toString()}`, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("Failed to load users");
    }

    return response.json();
}

export const userService = {
    getMe: async (): Promise<CurrentUserProfile> => {
        const response = await fetch("/api/me", { cache: "no-store" });
        if (!response.ok) {
            throw new Error("Failed to load profile");
        }
        return response.json();
    },

    updateMe: async (data: FormData): Promise<CurrentUserProfile> => {
        const response = await fetch("/api/me", {
            method: "PATCH",
            body: data,
        });

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            let message = text || "Failed to update profile";
            try {
                const parsed = JSON.parse(text) as { detail?: string; error?: string };
                message = parsed.detail || parsed.error || message;
            } catch {
                // keep raw message
            }
            throw new Error(message);
        }

        return response.json();
    },

    getUser: async (id: string): Promise<PublicUser> => {
        const response = await fetch(`/api/users/${id}`, { cache: "no-store" });
        if (!response.ok) {
            throw new Error("Failed to load user profile");
        }
        return response.json();
    },

    searchUsers: async (search = "", exclude = ""): Promise<PublicUser[]> => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (exclude) params.set("exclude", exclude);

        return fetchUsers(params);
    },

    getUsersByIds: async (ids: string[]): Promise<PublicUser[]> => {
        const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
        if (uniqueIds.length === 0) {
            return [];
        }

        const params = new URLSearchParams();
        params.set("ids", uniqueIds.join(","));

        return fetchUsers(params);
    },
};
