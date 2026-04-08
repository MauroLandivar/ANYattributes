import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const protectedPaths = ["/api/analyze", "/api/process"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !req.auth) {
    return NextResponse.json(
      { error: "No autenticado", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/api/:path*"],
};
