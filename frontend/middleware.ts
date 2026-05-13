import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_APP_PATHS = ["/login", "/register", "/reset-password"];
const PUBLIC_API_PREFIXES = [
  "/api/auth",
  "/api/register",
  "/api/password-reset",
];

const AUTH_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
  "bc_remember",
  "bc_session",
];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_APP_PATHS.includes(pathname) ||
    PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function clearAuthCookies(response: NextResponse) {
  for (const cookieName of AUTH_COOKIE_NAMES) {
    response.cookies.set(cookieName, "", {
      maxAge: 0,
      path: "/",
    });
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);

  if (request.nextUrl.pathname !== "/") {
    loginUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
  }

  return NextResponse.redirect(loginUrl);
}

function unauthorizedResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json(
      { detail: "Authentication required" },
      { status: 401 },
    );
  }

  return redirectToLogin(request);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return isPublicPath(pathname) ? NextResponse.next() : unauthorizedResponse(request);
  }

  const remembered = request.cookies.get("bc_remember")?.value === "1";
  const browserSessionAlive = request.cookies.get("bc_session")?.value === "1";

  if (!remembered && !browserSessionAlive) {
    const response = unauthorizedResponse(request);
    clearAuthCookies(response);
    return response;
  }

  if (PUBLIC_APP_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
