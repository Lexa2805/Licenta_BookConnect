import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { normalizeRole } from "@/lib/roles";
import { cloudinaryImageUrl } from "@/lib/server/cloudinary";

function serializeUser(user: any) {
  const avatarPublicId = user.profile?.avatar_public_id || user.image_public_id || "";

  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: normalizeRole(user.role),
    profile: {
      avatar_url: cloudinaryImageUrl(avatarPublicId) || user.profile?.avatar_url || user.image || "",
      avatar_public_id: avatarPublicId,
      about: user.profile?.about || "",
    },
    created_at: user.created_at || user.createdAt || null,
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "WebAppDB");
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(id), is_active: { $ne: false } },
      {
        projection: {
          username: 1,
          email: 1,
          role: 1,
          profile: 1,
          image: 1,
          image_public_id: 1,
          created_at: 1,
          createdAt: 1,
        },
      },
    );

    if (!user) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    return NextResponse.json(serializeUser(user));
  } catch {
    return NextResponse.json({ detail: "Failed to load user profile" }, { status: 500 });
  }
}
