import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { detail: "Nu ești autentificat" },
                { status: 401 }
            );
        }

        return NextResponse.json({
            id: session.user.id,
            username: session.user.username,
            email: session.user.email,
            role: session.user.role,
        });
    } catch (error: any) {
        return NextResponse.json(
            { detail: "Eroare la obținerea datelor utilizatorului" },
            { status: 500 }
        );
    }
}
