import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { normalizeRole } from "@/lib/roles";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const ids = searchParams
            .get("ids")
            ?.split(",")
            .map((id) => id.trim())
            .filter(Boolean) || [];
        const exclude = searchParams.get("exclude") || ""; // exclude current user

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || "WebAppDB");
        const usersCollection = db.collection("users");
        const { ObjectId } = await import("mongodb");

        // Build query
        const query: any = { is_active: { $ne: false } };

        if (ids.length > 0) {
            const objectIds = ids.flatMap((id) => {
                try {
                    return [new ObjectId(id)];
                } catch {
                    return [];
                }
            });

            if (objectIds.length === 0) {
                return NextResponse.json([]);
            }

            query._id = { $in: objectIds };
        } else {
            // Exclude current user
            if (exclude) {
                try {
                    query._id = { $ne: new ObjectId(exclude) };
                } catch {
                    // If not a valid ObjectId, skip
                }
            }

            // Search by username or email
            if (search) {
                query.$or = [
                    { username: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                ];
            }
        }

        const users = await usersCollection
            .find(query, {
                projection: {
                    _id: 1,
                    username: 1,
                    email: 1,
                    role: 1,
                    created_at: 1,
                },
            })
            .sort({ username: 1 })
            .limit(ids.length > 0 ? ids.length : 50)
            .toArray();

        const result = users.map((u) => ({
            id: u._id.toString(),
            username: u.username,
            email: u.email,
            role: normalizeRole(u.role),
            created_at: u.created_at || null,
        }));

        if (ids.length > 0) {
            const resultById = new Map(result.map((user) => [user.id, user]));
            return NextResponse.json(
                ids.map((id) => resultById.get(id)).filter(Boolean)
            );
        }

        // Map _id to id string
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}
