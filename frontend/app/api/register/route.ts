import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, email, password, role } = body;

        // Validation
        if (!username || !email || !password) {
            return NextResponse.json(
                { detail: "Username, email and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { detail: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || "WebAppDB");
        const usersCollection = db.collection("users");

        // Check if username already exists
        const existingUsername = await usersCollection.findOne({ username });
        if (existingUsername) {
            return NextResponse.json(
                { detail: "Username already taken" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingEmail = await usersCollection.findOne({
            email: email.toLowerCase(),
        });
        if (existingEmail) {
            return NextResponse.json(
                { detail: "Email already in use" },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = {
            username,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || "reader",
            is_active: true,
            createdAt: new Date().toISOString(),
            purchasedBooks: [],
            chatRooms: [],
            uploadedManuscripts: [],
            profile: {},
            favorites: [],
            wallet: {},
        };

        const result = await usersCollection.insertOne(newUser);

        console.log("User registered successfully:", username);
        return NextResponse.json(
            {
                message: "Account created successfully",
                userId: result.insertedId.toString(),
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Register error:", error);
        return NextResponse.json(
            { detail: error.message || "Registration failed" },
            { status: 500 }
        );
    }
}
