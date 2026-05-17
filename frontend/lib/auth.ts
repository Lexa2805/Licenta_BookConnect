import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import type { Collection, Document } from "mongodb";
import { normalizeRole } from "@/lib/roles";

async function createUniqueUsername(
    usersCollection: Collection<Document>,
    source: string,
) {
    const base =
        source
            .toLowerCase()
            .replace(/@.*$/, "")
            .replace(/[^a-z0-9_]/g, "")
            .slice(0, 24) || "reader";

    let candidate = base;
    let suffix = 1;

    while (await usersCollection.findOne({ username: candidate })) {
        suffix += 1;
        candidate = `${base}${suffix}`;
    }

    return candidate;
}

const providers: NextAuthOptions["providers"] = [
    CredentialsProvider({
        name: "Credentials",
        credentials: {
            username: { label: "Username", type: "text" },
            password: { label: "Password", type: "password" },
            rememberMe: { label: "Remember me", type: "text" },
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

                if (!user || !user.password) {
                    console.log("User not found or password login unavailable:", credentials.username);
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
                    role: normalizeRole(user.role),
                    rememberMe: credentials.rememberMe === "true",
                };
            } catch (error: any) {
                console.error("Auth error:", error);
                throw new Error(error.message || "Authentication failed");
            }
        },
    }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    );
}

export const authOptions: NextAuthOptions = {
    providers,
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider !== "google") {
                return true;
            }

            if (!user.email) {
                return false;
            }

            try {
                const client = await clientPromise;
                const db = client.db(process.env.MONGODB_DB || "WebAppDB");
                const usersCollection = db.collection("users");
                const email = user.email.toLowerCase();
                const googleId = account.providerAccountId;
                const existingUser = await usersCollection.findOne({
                    $or: [{ email }, { googleId }],
                });

                if (existingUser?.is_active === false) {
                    return false;
                }

                if (existingUser) {
                    await usersCollection.updateOne(
                        { _id: existingUser._id },
                        {
                            $set: {
                                googleId,
                                name: user.name || existingUser.name || "",
                                image: user.image || existingUser.image || "",
                                last_login_at: new Date().toISOString(),
                            },
                            $addToSet: { authProviders: "google" },
                        },
                    );

                    user.id = existingUser._id.toString();
                    user.username = existingUser.username;
                    user.role = normalizeRole(existingUser.role);
                    user.rememberMe = true;
                    return true;
                }

                const username = await createUniqueUsername(
                    usersCollection,
                    user.name || email,
                );
                const now = new Date().toISOString();
                const result = await usersCollection.insertOne({
                    username,
                    email,
                    password: null,
                    role: "reader",
                    is_active: true,
                    googleId,
                    name: user.name || "",
                    image: user.image || "",
                    authProviders: ["google"],
                    createdAt: now,
                    last_login_at: now,
                    purchasedBooks: [],
                    chatRooms: [],
                    uploadedManuscripts: [],
                    profile: {},
                    favorites: [],
                    wallet: {},
                });

                user.id = result.insertedId.toString();
                user.username = username;
                user.email = email;
                user.role = "reader";
                user.rememberMe = true;
                return true;
            } catch (error) {
                console.error("Google sign-in error:", error);
                return false;
            }
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.username = user.username || token.name || "reader";
                token.email = user.email || token.email;
                token.role = normalizeRole(user.role);
                token.rememberMe = Boolean(user.rememberMe);
            }
            if (trigger === "update" && session?.user) {
                token.username = session.user.username || token.username;
                token.email = session.user.email || token.email;
                token.role = normalizeRole(session.user.role || token.role);
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.email = token.email as string;
                session.user.role = normalizeRole(token.role);
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // Upper limit; non-remembered logins are cleared by middleware on browser restart.
    },
    secret: process.env.NEXTAUTH_SECRET,
};
