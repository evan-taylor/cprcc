import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const HOME_PATH = "/";
const SIGN_IN_PATH = "/signin";

const getSafeRedirectPath = (path: string | null) => {
  if (!path?.startsWith("/")) {
    return HOME_PATH;
  }

  if (path.startsWith("//")) {
    return HOME_PATH;
  }

  if (path === SIGN_IN_PATH || path.startsWith(`${SIGN_IN_PATH}?`)) {
    return HOME_PATH;
  }

  return path;
};

const isSignInPage = createRouteMatcher(["/signin"]);
const isProtectedRoute = createRouteMatcher([
  "/server",
  "/board(.*)",
  "/dashboard(.*)",
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isSignInPage(request) && (await convexAuth.isAuthenticated())) {
    const redirectPath = getSafeRedirectPath(
      request.nextUrl.searchParams.get("redirect")
    );
    return nextjsMiddlewareRedirect(request, redirectPath);
  }
  if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/signin");
  }
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
