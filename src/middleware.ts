import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { validateCsrf, isCsrfExempt } from "@/lib/csrf";

// Roles that are restricted to candidate-only paths (not admin)
const CANDIDATE_ROLES = ["CANDIDATE"];

// Routes that require authentication — admin/staff dashboard
const adminPrefix = "/admin";

// Routes that require authentication — candidate area
const candidatePaths = ["/profile", "/take", "/verify"];

// Routes that should redirect if already authenticated
const authPaths = ["/login", "/register"];

// Public routes (no auth required)
const publicPaths = ["/", "/catalog", "/news", "/contact"];

// Legacy admin paths — redirect old URLs to /admin/*
const legacyAdminPaths = [
  "/dashboard",
  "/question-bank",
  "/exams",
  "/grading",
  "/test-centers",
  "/registrations",
  "/payments",
  "/certificates",
  "/analytics",
  "/notifications",
  "/proctoring",
  "/users",
  "/settings",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CSRF Protection for API mutation requests
  if (pathname.startsWith("/api/") && !isCsrfExempt(pathname)) {
    const method = req.method.toUpperCase();
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      if (!validateCsrf(req)) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "CSRF_FAILED", message: "คำขอไม่ถูกต้อง (CSRF)" },
          },
          { status: 403 }
        );
      }
    }
    // Let API requests pass through (no redirect logic)
    return NextResponse.next();
  }

  // Redirect legacy admin URLs → /admin/*
  const legacyMatch = legacyAdminPaths.find(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
  if (legacyMatch) {
    return NextResponse.redirect(new URL("/admin" + pathname, req.url), 301);
  }

  // Skip public paths (exact match for "/" to avoid matching everything)
  if (
    pathname === "/" ||
    publicPaths.some((path) => path !== "/" && pathname.startsWith(path))
  ) {
    return NextResponse.next();
  }

  // Decode JWT token (works in Edge Runtime, no DB needed)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;
  const roleName = (token?.roleName as string) ?? "";
  const isCandidate = CANDIDATE_ROLES.includes(roleName);

  // Auth pages: redirect if already logged in
  if (authPaths.some((path) => pathname === path)) {
    if (isLoggedIn) {
      return NextResponse.redirect(
        new URL(isCandidate ? "/profile" : "/admin/dashboard", req.url)
      );
    }
    return NextResponse.next();
  }

  // Protected pages: redirect to login if not logged in
  const isAdminPath = pathname.startsWith(adminPrefix);
  const isCandidatePath = candidatePaths.some((path) =>
    pathname.startsWith(path)
  );

  if ((isAdminPath || isCandidatePath) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control: block non-admin roles from admin routes
  const ADMIN_ROLES = ["PLATFORM_ADMIN", "TENANT_OWNER", "ADMIN", "EXAM_CREATOR", "GRADER", "PROCTOR", "CENTER_MANAGER", "CENTER_STAFF"];
  const hasAdminRole = ADMIN_ROLES.includes(roleName);
  if (isAdminPath && isLoggedIn && !hasAdminRole) {
    return NextResponse.redirect(new URL("/profile", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Include API routes for CSRF protection + all pages for auth
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
