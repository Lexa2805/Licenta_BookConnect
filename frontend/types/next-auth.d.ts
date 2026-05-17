import 'next-auth';
import type { AccountRole } from '@/lib/roles';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            username: string;
            email: string;
            role: AccountRole;
        };
    }

    interface User {
        id: string;
        username?: string;
        email: string;
        role?: AccountRole;
        rememberMe?: boolean;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        username: string;
        email: string;
        role: AccountRole;
        rememberMe?: boolean;
    }
}
