export interface PublicUser {
    id: string;
    username: string;
    email: string;
    role: string;
    created_at: string | null;
}

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
