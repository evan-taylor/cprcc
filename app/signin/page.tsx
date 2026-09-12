"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthPageShell } from "@/components/auth-page-shell";
import { api } from "@/convex/_generated/api";

// Convex redacts errors thrown in server functions to a production message that
// holds a per-call request id, for example "[Request ID: <id>] Server Error".
// The id is unique per attempt.
const CONVEX_REQUEST_ID_ERROR = /\[Request ID: [^\]]+\]/;

// The password provider throws a redacted server error for wrong credentials.
// We treat this as an expected sign-in failure, not an error worth tracking.
const isExpectedCredentialError = (error: unknown): boolean =>
  error instanceof Error && CONVEX_REQUEST_ID_ERROR.test(error.message);

// Reports a failed signIn() call and returns the message to show the user. A
// wrong password is expected and only counted; anything else is captured under a
// fixed fingerprint so real outages group into one issue.
const reportSignInFailure = (
  authError: unknown,
  flow: "signIn" | "signUp"
): string => {
  posthog.capture("sign_in_failed", { flow });

  if (isExpectedCredentialError(authError)) {
    return "Invalid email or password. If you don’t have an account, please sign up.";
  }

  posthog.captureException(
    authError instanceof Error ? authError : new Error("Sign-in failed"),
    { $exception_fingerprint: "signin-unexpected-failure" }
  );
  return "Something went wrong. Please try again.";
};

// What handleSubmit asks the authenticated effect to finish once the client is
// signed in. We defer profile creation so the mutation never runs before the
// auth token has propagated.
type PendingProfile =
  | {
      flow: "signUp";
      email: string;
      name: string;
      newsletterOptIn: boolean;
      phoneNumber?: string;
    }
  | { flow: "signIn"; email: string };

export default function SignIn() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const ensureCurrentUserProfile = useMutation(
    api.users.ensureCurrentUserProfile
  );
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);
  const createdRef = useRef(false);
  const submittingRef = useRef(false);
  const pendingProfileRef = useRef<PendingProfile | null>(null);
  const router = useRouter();

  const completeProfileSetup = useCallback(async () => {
    if (createdRef.current) {
      return;
    }
    createdRef.current = true;

    const pending = pendingProfileRef.current;

    try {
      if (pending?.flow === "signUp") {
        const profileId = await ensureCurrentUserProfile({
          newsletterOptIn: pending.newsletterOptIn,
          phoneNumber: pending.phoneNumber,
        });
        posthog.identify(String(profileId), {
          email: pending.email,
          name: pending.name,
        });
        posthog.capture("user_signed_up", {
          has_phone_number: !!pending.phoneNumber,
          newsletter_opt_in: pending.newsletterOptIn,
        });
      } else if (pending) {
        const profileId = await ensureCurrentUserProfile({});
        posthog.identify(String(profileId), { email: pending.email });
        posthog.capture("user_signed_in");
      } else {
        // An existing user who lands on /signin already authenticated. Make sure
        // a profile row exists, but stay silent about any failure.
        await ensureCurrentUserProfile({});
      }

      pendingProfileRef.current = null;

      if (pending) {
        router.push("/");
      } else {
        setLoading(false);
      }
    } catch (profileError) {
      createdRef.current = false;
      submittingRef.current = false;
      pendingProfileRef.current = null;

      if (!pending) {
        return;
      }

      // A ConvexError carries a user-facing message, for example a missing email
      // address. Anything else stays a generic message.
      const message =
        profileError instanceof ConvexError &&
        typeof profileError.data === "string"
          ? profileError.data
          : "Something went wrong. Please try again.";

      // The real cause is captured, not a synthetic error, so recurrences stay
      // diagnosable. The fixed fingerprint keeps them in one issue.
      posthog.captureException(
        profileError instanceof Error
          ? profileError
          : new Error("Sign-in profile setup failed"),
        { $exception_fingerprint: "signin-profile-setup-failed" }
      );
      setError(message);
      setLoading(false);
    }
  }, [ensureCurrentUserProfile, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (window.location.pathname !== "/signin") {
      return;
    }
    // Create the profile only once the client is authenticated. A mutation fired
    // right after signIn() resolves can reach the server before the auth token
    // propagates and fail as "not authenticated".
    completeProfileSetup();
  }, [isAuthenticated, completeProfileSetup]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submittingRef.current) {
      return;
    }
    submittingRef.current = true;
    setError(null);
    setLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const name = ((formData.get("name") as string | null) ?? "").trim();
    const phoneNumber = (
      (formData.get("phoneNumber") as string | null) ?? ""
    ).trim();
    const email = ((formData.get("email") as string | null) ?? "").trim();

    if (flow === "signUp" && name.length === 0) {
      setError("Please enter your name");
      setLoading(false);
      submittingRef.current = false;
      return;
    }

    formData.set("flow", flow);

    const normalizedPhone = phoneNumber.length > 0 ? phoneNumber : undefined;
    pendingProfileRef.current =
      flow === "signUp"
        ? { flow, email, name, newsletterOptIn, phoneNumber: normalizedPhone }
        : { flow, email };

    try {
      await signIn("password", formData);
    } catch (authError) {
      pendingProfileRef.current = null;
      submittingRef.current = false;
      setError(reportSignInFailure(authError, flow));
      setLoading(false);
      return;
    }

    // Auth passed. If the client is already authenticated, finish now; otherwise
    // the effect above runs completeProfileSetup once isAuthenticated flips true.
    if (isAuthenticated) {
      await completeProfileSetup();
    }
  };

  return (
    <AuthPageShell>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display font-semibold text-3xl text-[color:var(--color-text-emphasis)]">
            {flow === "signIn" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-[color:var(--color-text-muted)] text-sm">
            {flow === "signIn"
              ? "Sign in to your account to continue"
              : "Join our community of volunteers"}
          </p>
        </div>

        <div className="editorial-card rounded-2xl p-6 sm:p-8">
          <div className="mb-6 flex gap-1 rounded-xl bg-[color:var(--color-bg-subtle)] p-1">
            <button
              className={`flex-1 rounded-lg px-4 py-2 font-medium text-sm transition-all duration-200 ${
                flow === "signIn"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)]"
              }`}
              onClick={() => {
                setFlow("signIn");
                setError(null);
              }}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`flex-1 rounded-lg px-4 py-2 font-medium text-sm transition-all duration-200 ${
                flow === "signUp"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)]"
              }`}
              onClick={() => {
                setFlow("signUp");
                setError(null);
              }}
              type="button"
            >
              Sign Up
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {flow === "signUp" && (
              <>
                <div>
                  <label
                    className="mb-1.5 block font-medium text-[color:var(--color-text)] text-sm"
                    htmlFor="name"
                  >
                    Full Name
                  </label>
                  <input
                    className="w-full rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-2.5 text-[color:var(--color-text-emphasis)] transition-colors duration-200 placeholder:text-[color:var(--color-text-subtle)] focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    required={flow === "signUp"}
                    type="text"
                  />
                </div>
                <div>
                  <label
                    className="mb-1.5 block font-medium text-[color:var(--color-text)] text-sm"
                    htmlFor="phoneNumber"
                  >
                    Phone Number
                  </label>
                  <input
                    className="w-full rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-2.5 text-[color:var(--color-text-emphasis)] transition-colors duration-200 placeholder:text-[color:var(--color-text-subtle)] focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="(555) 123-4567"
                    type="tel"
                  />
                  <p className="mt-1.5 text-[color:var(--color-text-subtle)] text-xs">
                    Optional — recommended for carpool coordination
                  </p>
                </div>
                <label
                  className="flex items-start gap-3 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-subtle)] px-4 py-3"
                  htmlFor="newsletterOptIn"
                >
                  <input
                    checked={newsletterOptIn}
                    className="mt-1 size-4 rounded border-[color:var(--color-border-hover)] text-red-600 focus:ring-red-500"
                    id="newsletterOptIn"
                    onChange={(event) =>
                      setNewsletterOptIn(event.target.checked)
                    }
                    type="checkbox"
                  />
                  <span className="min-w-0">
                    <span className="block font-medium text-[color:var(--color-text-emphasis)] text-sm">
                      Email me club news and newsletters
                    </span>
                    <span className="mt-1 block text-[color:var(--color-text-muted)] text-xs">
                      Get event announcements, volunteer updates, and chapter
                      highlights. You can unsubscribe at any time.
                    </span>
                  </span>
                </label>
              </>
            )}

            <div>
              <label
                className="mb-1.5 block font-medium text-[color:var(--color-text)] text-sm"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-2.5 text-[color:var(--color-text-emphasis)] transition-colors duration-200 placeholder:text-[color:var(--color-text-subtle)] focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                id="email"
                name="email"
                placeholder="you@example.com"
                required
                type="email"
              />
            </div>

            <div>
              <label
                className="mb-1.5 block font-medium text-[color:var(--color-text)] text-sm"
                htmlFor="password"
              >
                Password
              </label>
              <input
                className="w-full rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-2.5 text-[color:var(--color-text-emphasis)] transition-colors duration-200 placeholder:text-[color:var(--color-text-subtle)] focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                id="password"
                minLength={8}
                name="password"
                placeholder="Enter your password"
                required
                type="password"
              />
              {flow === "signUp" && (
                <p className="mt-1.5 text-[color:var(--color-text-subtle)] text-xs">
                  Must be at least 8 characters
                </p>
              )}
              {flow === "signIn" && (
                <div className="mt-1.5 text-right">
                  <Link
                    className="font-medium text-red-600 text-xs transition-colors duration-150 hover:text-red-700"
                    href="/forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            {error && (
              <div className="animate-scale-in rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-sm text-white shadow-md shadow-red-600/20 transition-all duration-200 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
              type="submit"
            >
              {loading && (
                <span className="flex items-center justify-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Please wait…
                </span>
              )}
              {!loading && flow === "signIn" && "Sign In"}
              {!loading && flow === "signUp" && "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-[color:var(--color-text-muted)] text-sm">
            {flow === "signIn" ? (
              <p>
                New to Red Cross?{" "}
                <button
                  className="font-medium text-red-600 transition-colors duration-150 hover:text-red-700"
                  onClick={() => {
                    setFlow("signUp");
                    setError(null);
                  }}
                  type="button"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  className="font-medium text-red-600 transition-colors duration-150 hover:text-red-700"
                  onClick={() => {
                    setFlow("signIn");
                    setError(null);
                  }}
                  type="button"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[color:var(--color-text-subtle)] text-xs">
          By signing up, you agree to help make a difference in our community
        </p>
      </div>
    </AuthPageShell>
  );
}
