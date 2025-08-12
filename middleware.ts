import { NextResponse } from "next/server";
import { auth } from "./src/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  if (nextUrl.pathname.startsWith("/dashboard") && !isLoggedIn) {
    const url = new URL("/login", nextUrl);
    return NextResponse.redirect(url);
  }

  if (nextUrl.pathname === "/login" && isLoggedIn) {
    const url = new URL("/dashboard", nextUrl);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
