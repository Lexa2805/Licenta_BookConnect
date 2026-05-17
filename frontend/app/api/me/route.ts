import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { normalizeRole } from "@/lib/roles";

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
            role: normalizeRole(session.user.role),
        });
    } catch (error: any) {
        return NextResponse.json(
            { detail: "Eroare la obținerea datelor utilizatorului" },
            { status: 500 }
        );
    }
}
