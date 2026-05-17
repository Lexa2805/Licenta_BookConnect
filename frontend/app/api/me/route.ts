import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { normalizeRole } from "@/lib/roles";
import { cloudinaryImageUrl, uploadImageToCloudinary } from "@/lib/server/cloudinary";

export const runtime = "nodejs";

function serializeUser(user: any) {
  const avatarPublicId = user.profile?.avatar_public_id || user.image_public_id || "";
  const avatarUrl = cloudinaryImageUrl(avatarPublicId) || user.profile?.avatar_url || user.image || "";

  return {
    id: user._id?.toString?.() || user.id,
    username: user.username,
    email: user.email,
    role: normalizeRole(user.role),
    profile: {
      avatar_url: avatarUrl,
      avatar_public_id: avatarPublicId,
      about: user.profile?.about || "",
    },
    created_at: user.created_at || user.createdAt || null,
  };
}

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function dataImageUrlToBlob(value: string) {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);([^,]*),(.*)$/);
  if (!match) {
    throw new Error("Generated avatar could not be prepared for upload.");
  }

  const [, mimeType, metadata, payload] = match;
  const bytes = metadata.includes("base64")
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");

  return new Blob([bytes], { type: mimeType });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "WebAppDB");
    const user = await db.collection("users").findOne({ _id: new ObjectId(session.user.id) });

    if (!user) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    return NextResponse.json(serializeUser(user));
  } catch {
    return NextResponse.json({ detail: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    const form = await request.formData();
    const username = cleanText(form.get("username"), 32);
    const email = cleanText(form.get("email"), 120).toLowerCase();
    const about = cleanText(form.get("about"), 260);
    const avatarUrl = cleanText(form.get("avatar_url"), 20000);
    const avatarFile = form.get("avatar");

    if (!username || !email) {
      return NextResponse.json({ detail: "Username and email are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ detail: "Enter a valid email address." }, { status: 400 });
    }

    const userId = new ObjectId(session.user.id);
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "WebAppDB");
    const usersCollection = db.collection("users");

    const duplicate = await usersCollection.findOne({
      _id: { $ne: userId },
      $or: [{ username }, { email }],
    });

    if (duplicate) {
      return NextResponse.json(
        { detail: "That username or email is already used by another account." },
        { status: 409 },
      );
    }

    let nextAvatarPublicId = "";
    if (avatarFile instanceof File && avatarFile.size > 0) {
      const uploadedAvatar = await uploadImageToCloudinary(avatarFile, {
        folder: "bookconnect/avatars",
        publicIdPrefix: session.user.id,
        maxBytes: 5 * 1024 * 1024,
      });
      nextAvatarPublicId = uploadedAvatar.publicId;
    } else if (avatarUrl.startsWith("data:image/")) {
      const uploadedAvatar = await uploadImageToCloudinary(dataImageUrlToBlob(avatarUrl), {
        folder: "bookconnect/avatars",
        publicIdPrefix: `${session.user.id}-generated`,
        maxBytes: 5 * 1024 * 1024,
      });
      nextAvatarPublicId = uploadedAvatar.publicId;
    }

    const update: Record<string, string> = {
      username,
      email,
      "profile.about": about,
      updated_at: new Date().toISOString(),
    };

    const unset: Record<string, ""> = {};

    if (nextAvatarPublicId) {
      update["profile.avatar_public_id"] = nextAvatarPublicId;
      update.image_public_id = nextAvatarPublicId;
      unset["profile.avatar_url"] = "";
      unset.image = "";
    }

    const updateDocument: { $set: Record<string, string>; $unset?: Record<string, ""> } = {
      $set: update,
    };

    if (Object.keys(unset).length > 0) {
      updateDocument.$unset = unset;
    }

    const result = await usersCollection.findOneAndUpdate(
      { _id: userId },
      updateDocument,
      { returnDocument: "after" },
    );

    if (!result) {
      return NextResponse.json({ detail: "User not found" }, { status: 404 });
    }

    return NextResponse.json(serializeUser(result));
  } catch (error: any) {
    return NextResponse.json(
      { detail: error?.message || "Failed to update profile." },
      { status: 500 },
    );
  }
}
