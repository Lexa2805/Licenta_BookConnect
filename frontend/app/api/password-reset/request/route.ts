import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import clientPromise from "@/lib/mongodb";

const RESET_TOKEN_MINUTES = 15;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const { identifier } = await request.json();
    const normalizedIdentifier = String(identifier || "").trim().toLowerCase();

    if (!normalizedIdentifier) {
      return NextResponse.json(
        { detail: "Username or email is required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "WebAppDB");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier },
      ],
    });

    const responseBody: {
      message: string;
      resetUrl?: string;
      resetToken?: string;
    } = {
      message:
        "If an account exists, a password reset link has been created.",
    };

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000);

      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordReset: {
              tokenHash: hashToken(resetToken),
              expiresAt,
              createdAt: new Date(),
            },
          },
        },
      );

      if (process.env.NODE_ENV !== "production") {
        responseBody.resetToken = resetToken;
        responseBody.resetUrl = `/reset-password?token=${resetToken}`;
      }

      console.log(
        `Password reset link for ${user.username}: /reset-password?token=${resetToken}`,
      );
    }

    return NextResponse.json(responseBody);
  } catch (error: any) {
    console.error("Password reset request error:", error);
    return NextResponse.json(
      { detail: error.message || "Could not create password reset link" },
      { status: 500 },
    );
  }
}
