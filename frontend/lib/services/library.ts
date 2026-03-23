import { api } from "../api";

export interface LibraryBook {
    id: number;
    title: string;
    author: string;
    description: string;
    cover_url: string;
    cover_image: string | null;
    cover: string;  // Computed field - returns actual cover URL
    pdf_url: string;
    pdf_file: string | null;
    pdf: string;  // Computed field - returns actual PDF URL
    epub_url: string;
    genres: string[];
    language: string;
    pages: number;
    year_published: number | null;
    is_free: boolean;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateBookData {
    title: string;
    author: string;
    description?: string;
    genres?: string[];
    language?: string;
    pages?: number;
    year_published?: number | null;
    is_free?: boolean;
    is_featured?: boolean;
    cover_image?: File;
    pdf_file?: File;
    cover_url?: string;
    pdf_url?: string;
}

export interface UserLibraryEntry {
    id: number;
    user_id: string;
    book: LibraryBook;
    book_id?: number;
    status: 'WANT_TO_READ' | 'READING' | 'FINISHED';
    is_favorite: boolean;
    current_page: number;
    rating: number | null;
    notes: string;
    added_at: string;
    updated_at: string;
}

export interface Bookmark {
    id: number;
    user_id: string;
    book: number;
    page_number: number;
    paragraph_text: string;
    note: string;
    color: string;
    created_at: string;
}

export const libraryService = {
    // Library Books (Admin)
    getBooks: async (params?: { search?: string; genre?: string; featured?: boolean; is_free?: boolean }) => {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        if (params?.genre) queryParams.append('genre', params.genre);
        if (params?.featured) queryParams.append('featured', 'true');
        if (params?.is_free) queryParams.append('is_free', 'true');

        const response = await api.get(`/api/library/books/?${queryParams.toString()}`);
        return response.data as LibraryBook[];
    },

    getBook: async (id: number) => {
        const response = await api.get(`/api/library/books/${id}/`);
        return response.data as LibraryBook;
    },

    createBook: async (data: CreateBookData) => {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('author', data.author);
        if (data.description) formData.append('description', data.description);
        if (data.genres) formData.append('genres', JSON.stringify(data.genres));
        if (data.language) formData.append('language', data.language);
        if (data.pages) formData.append('pages', data.pages.toString());
        if (data.year_published) formData.append('year_published', data.year_published.toString());
        if (data.is_free !== undefined) formData.append('is_free', data.is_free.toString());
        if (data.is_featured !== undefined) formData.append('is_featured', data.is_featured.toString());
        if (data.cover_image) formData.append('cover_image', data.cover_image);
        if (data.pdf_file) formData.append('pdf_file', data.pdf_file);
        if (data.cover_url) formData.append('cover_url', data.cover_url);
        if (data.pdf_url) formData.append('pdf_url', data.pdf_url);

        const response = await api.post('/api/library/books/', formData);
        return response.data as LibraryBook;
    },

    updateBook: async (id: number, data: Partial<CreateBookData>) => {
        const formData = new FormData();
        if (data.title) formData.append('title', data.title);
        if (data.author) formData.append('author', data.author);
        if (data.description !== undefined) formData.append('description', data.description);
        if (data.genres) formData.append('genres', JSON.stringify(data.genres));
        if (data.language) formData.append('language', data.language);
        if (data.pages) formData.append('pages', data.pages.toString());
        if (data.year_published) formData.append('year_published', data.year_published.toString());
        if (data.is_free !== undefined) formData.append('is_free', data.is_free.toString());
        if (data.is_featured !== undefined) formData.append('is_featured', data.is_featured.toString());
        if (data.cover_image) formData.append('cover_image', data.cover_image);
        if (data.pdf_file) formData.append('pdf_file', data.pdf_file);

        const response = await api.patch(`/api/library/books/${id}/`, formData);
        return response.data as LibraryBook;
    },

    deleteBook: async (id: number) => {
        await api.delete(`/api/library/books/${id}/`);
    },

    toggleFeatured: async (id: number) => {
        const response = await api.post(`/api/library/books/${id}/toggle_featured/`);
        return response.data as LibraryBook;
    },

    // User Library
    getUserLibrary: async (userId: string, params?: { status?: string; favorites?: boolean }) => {
        const queryParams = new URLSearchParams();
        queryParams.append('user_id', userId);
        if (params?.status) queryParams.append('status', params.status);
        if (params?.favorites) queryParams.append('favorites', 'true');

        const response = await api.get(`/api/library/user-library/?${queryParams.toString()}`);
        return response.data as UserLibraryEntry[];
    },

    addToLibrary: async (userId: string, bookId: number) => {
        const response = await api.post('/api/library/user-library/', {
            user_id: userId,
            book_id: bookId,
        });
        return response.data as UserLibraryEntry;
    },

    removeFromLibrary: async (entryId: number) => {
        await api.delete(`/api/library/user-library/${entryId}/`);
    },

    toggleFavorite: async (entryId: number) => {
        const response = await api.post(`/api/library/user-library/${entryId}/toggle_favorite/`);
        return response.data as UserLibraryEntry;
    },

    updateProgress: async (entryId: number, currentPage: number) => {
        const response = await api.post(`/api/library/user-library/${entryId}/update_progress/`, {
            current_page: currentPage,
        });
        return response.data as UserLibraryEntry;
    },

    rateBook: async (entryId: number, rating: number) => {
        const response = await api.post(`/api/library/user-library/${entryId}/rate/`, {
            rating,
        });
        return response.data as UserLibraryEntry;
    },

    updateLibraryEntry: async (entryId: number, data: Partial<UserLibraryEntry>) => {
        const response = await api.patch(`/api/library/user-library/${entryId}/`, data);
        return response.data as UserLibraryEntry;
    },

    // Bookmarks
    getBookmarks: async (userId: string, bookId?: number) => {
        const queryParams = new URLSearchParams();
        queryParams.append('user_id', userId);
        if (bookId) queryParams.append('book_id', bookId.toString());

        const response = await api.get(`/api/library/bookmarks/?${queryParams.toString()}`);
        return response.data as Bookmark[];
    },

    createBookmark: async (data: { user_id: string; book: number; page_number: number; paragraph_text?: string; note?: string; color?: string }) => {
        const response = await api.post('/api/library/bookmarks/', data);
        return response.data as Bookmark;
    },

    deleteBookmark: async (id: number) => {
        await api.delete(`/api/library/bookmarks/${id}/`);
    },

    // Reading Sessions
    startReadingSession: async (userId: string, bookId: number, startPage: number) => {
        const response = await api.post('/api/library/reading-sessions/', {
            user_id: userId,
            book: bookId,
            start_page: startPage,
        });
        return response.data;
    },

    endReadingSession: async (sessionId: number, endPage: number) => {
        const response = await api.post(`/api/library/reading-sessions/${sessionId}/end_session/`, {
            end_page: endPage,
        });
        return response.data;
    },
};
