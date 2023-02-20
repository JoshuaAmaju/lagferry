import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withIronSessionApiRoute } from "iron-session/next";
import { getIronSession } from "iron-session/edge";
import { get_sessionConfig } from "./common/utils/session";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    // '/((?!api|_next/static|_next/image|favicon.ico).*)',

    "/((?!auth|_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};

export async function middleware(req: NextRequest, res: NextResponse) {
  // if (request.nextUrl.pathname.startsWith("/about")) {
  //   return NextResponse.rewrite(new URL("/about-2", request.url));
  // }

  const session = await getIronSession(req, res, get_sessionConfig());

  const { auth } = session as any;

  // console.log(auth);

  if (!auth) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}
