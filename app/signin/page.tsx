"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const ensureCurrentUserProfile = useMutation(
    api.users.ensureCurrentUserProfile
  );
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const createdRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !createdRef.current) {
      const pathname = window.location.pathname;
      if (pathname !== "/signin") {
        return;
      }
      createdRef.current = true;
      ensureCurrentUserProfile({}).catch(() => {
        // Silently ignore profile creation errors for existing users
      });
    }
  }, [isAuthenticated, ensureCurrentUserProfile]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get("name") as string;
      const phoneNumber = formData.get("phoneNumber") as string;

      const email = formData.get("email") as string;

      if (flow === "signUp") {
        if (!name || name.trim().length === 0) {
          setError("Please enter your name");
          setLoading(false);
          return;
        }

        const localPhone =
          phoneNumber && phoneNumber.trim().length > 0
            ? phoneNumber.trim()
            : undefined;

        formData.set("flow", "signUp");

        await signIn("password", formData);

        await ensureCurrentUserProfile({ phoneNumber: localPhone });

        posthog.identify(email, { email, name: name.trim() });
        posthog.capture("user_signed_up", {
          has_phone_number: !!localPhone,
        });

        router.push("/");
        setLoading(false);
      } else {
        formData.set("flow", "signIn");
        await signIn("password", formData);

        posthog.identify(email, { email });
        posthog.capture("user_signed_in");

        router.push("/");
        setLoading(false);
      }
    } catch (authError) {
      posthog.captureException(
        authError instanceof Error
          ? authError
          : new Error("Authentication failed")
      );
      posthog.capture("sign_in_failed", {
        flow,
      });
      if (authError instanceof Error) {
        setError(
          "Invalid email or password. If you don\u2019t have an account, please sign up."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
      createdRef.current = false;
    }
  };

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[color:var(--color-bg-subtle)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link className="inline-block" href="/">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-600/25">
              <svg
                className="h-8 w-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <title>Red Cross logo</title>
                <path d="M14 2h-4v8H2v4h8v8h4v-8h8v-4h-8V2z" />
              </svg>
            </div>
          </Link>
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
          <div className="mb-6 flex gap-1 rounded-xl bg-slate-100 p-1">
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
                    className="mb-1.5 block font-medium text-slate-700 text-sm"
                    htmlFor="name"
                  >
                    Full Name
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 transition-colors duration-200 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    required={flow === "signUp"}
                    type="text"
                  />
                </div>
                <div>
                  <label
                    className="mb-1.5 block font-medium text-slate-700 text-sm"
                    htmlFor="phoneNumber"
                  >
                    Phone Number
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 transition-colors duration-200 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="(555) 123-4567"
                    type="tel"
                  />
                  <p className="mt-1.5 text-slate-400 text-xs">
                    Optional — recommended for carpool coordination
                  </p>
                </div>
              </>
            )}

            <div>
              <label
                className="mb-1.5 block font-medium text-slate-700 text-sm"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 transition-colors duration-200 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                id="email"
                name="email"
                placeholder="you@example.com"
                required
                type="email"
              />
            </div>

            <div>
              <label
                className="mb-1.5 block font-medium text-slate-700 text-sm"
                htmlFor="password"
              >
                Password
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 transition-colors duration-200 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                id="password"
                minLength={8}
                name="password"
                placeholder="Enter your password"
                required
                type="password"
              />
              {flow === "signUp" && (
                <p className="mt-1.5 text-slate-400 text-xs">
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
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Please wait…
                </span>
              )}
              {!loading && flow === "signIn" && "Sign In"}
              {!loading && flow === "signUp" && "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-slate-500 text-sm">
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

        <p className="mt-6 text-center text-slate-400 text-xs">
          By signing up, you agree to help make a difference in our community
        </p>
      </div>
    </div>
  );
}
