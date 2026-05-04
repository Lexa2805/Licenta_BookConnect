import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    throw new Error("Username and password are required");
                }

                try {
                    const client = await clientPromise;
                    const db = client.db(process.env.MONGODB_DB || "WebAppDB");
                    const usersCollection = db.collection("users");

                    // Find user by username
                    const user = await usersCollection.findOne({
                        username: credentials.username,
                    });

                    if (!user) {
                        console.log("User not found:", credentials.username);
                        throw new Error("Invalid credentials");
                    }

                    // Check if account is active
                    if (user.is_active === false) {
                        throw new Error("Account deactivated");
                    }

                    // Verify password
                    console.log("Comparing passwords...");
                    const isValidPassword = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isValidPassword) {
                        console.log("Password mismatch for user:", credentials.username);
                        throw new Error("Invalid credentials");
                    }

                    console.log("Login successful for:", credentials.username);

                    // Return user object
                    return {
                        id: user._id.toString(),
                        username: user.username,
                        email: user.email,
                        role: user.role || "reader",
                    };
                } catch (error: any) {
                    console.error("Auth error:", error);
                    throw new Error(error.message || "Authentication failed");
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.email = user.email;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.email = token.email as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
};
