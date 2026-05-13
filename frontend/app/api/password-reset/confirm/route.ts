import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import clientPromise from "@/lib/mongodb";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    const resetToken = String(token || "").trim();
    const newPassword = String(password || "");

    if (!resetToken || !newPassword) {
      return NextResponse.json(
        { detail: "Reset token and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { detail: "Password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "WebAppDB");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      "passwordReset.tokenHash": hashToken(resetToken),
      "passwordReset.expiresAt": { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { detail: "This reset link is invalid or has expired" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { passwordReset: "" },
      },
    );

    return NextResponse.json({
      message: "Password updated successfully. You can sign in now.",
    });
  } catch (error: any) {
    console.error("Password reset confirm error:", error);
    return NextResponse.json(
      { detail: error.message || "Could not reset password" },
      { status: 500 },
    );
  }
}
