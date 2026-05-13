import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";

const handler = NextAuth(authOptions);
const REMEMBER_MAX_AGE = 30 * 24 * 60 * 60;

function authCookie(
  name: string,
  value: string,
  options: { maxAge?: number } = {},
) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Lax",
    "HttpOnly",
  ];

  if (typeof options.maxAge === "number") {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export async function GET(request: NextRequest, context: any) {
  const response = await handler(request, context);

  if (!request.nextUrl.pathname.endsWith("/callback/google")) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.append(
    "Set-Cookie",
    authCookie("bc_remember", "1", { maxAge: REMEMBER_MAX_AGE }),
  );
  headers.append(
    "Set-Cookie",
    authCookie("bc_session", "1", { maxAge: REMEMBER_MAX_AGE }),
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function POST(request: NextRequest, context: any) {
  const clonedRequest = request.clone();
  const response = await handler(request, context);

  if (!request.nextUrl.pathname.endsWith("/callback/credentials")) {
    return response;
  }

  try {
    const formData = await clonedRequest.formData();
    const rememberMe = formData.get("rememberMe") === "true";
    const headers = new Headers(response.headers);

    headers.append(
      "Set-Cookie",
      authCookie("bc_remember", rememberMe ? "1" : "", {
        maxAge: rememberMe ? REMEMBER_MAX_AGE : 0,
      }),
    );
    headers.append(
      "Set-Cookie",
      authCookie("bc_session", "1", rememberMe ? { maxAge: REMEMBER_MAX_AGE } : {}),
    );

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch {
    return response;
  }
}
