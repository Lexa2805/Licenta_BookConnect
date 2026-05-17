import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { uploadImageToCloudinary } from "@/lib/server/cloudinary";

export const runtime = "nodejs";

function cleanPurpose(value: FormDataEntryValue | null) {
  const purpose = String(value || "upload")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return purpose || "upload";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const form = await request.formData();
    const file = form.get("file");
    const purpose = cleanPurpose(form.get("purpose"));

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ detail: "Choose an image to upload." }, { status: 400 });
    }

    const folder =
      purpose === "movie-scan" ? "bookconnect/movie-scans" : "bookconnect/uploads";
    const uploaded = await uploadImageToCloudinary(file, {
      folder,
      publicIdPrefix: `${session?.user?.id || "anonymous"}-${purpose}`,
      maxBytes: 8 * 1024 * 1024,
    });

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "WebAppDB");
    await db.collection("cloudinary_uploads").insertOne({
      public_id: uploaded.publicId,
      purpose,
      user_id: session?.user?.id || null,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      public_id: uploaded.publicId,
      url: uploaded.secureUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error?.message || "Could not upload image." },
      { status: 500 },
    );
  }
}
