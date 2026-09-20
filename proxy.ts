import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { AUTH_SESSION_DURATION_SECONDS } from "@/lib/auth-session";

const isSignInPage = createRouteMatcher(["/signin"]);
const isProtectedRoute = createRouteMatcher([
  "/server",
  "/board(.*)",
  "/dashboard(.*)",
]);

export default convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    if (isSignInPage(request) && (await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, "/");
    }
    if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, "/signin");
    }
  },
  {
    cookieConfig: {
      maxAge: AUTH_SESSION_DURATION_SECONDS,
    },
  }
);

export const config = {
  // Skip static assets and the PostHog reverse proxy so Convex auth
  // middleware does not intercept `/ingest` event capture.
  matcher: ["/((?!.*\\..*|_next|ingest).*)", "/", "/(api|trpc)(.*)"],
};
