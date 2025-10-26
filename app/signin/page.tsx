"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const createUserProfile = useMutation(api.users.createUserProfile);
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const email = formData.get("email") as string;
      const name = formData.get("name") as string;

      if (flow === "signUp") {
        if (!name || name.trim().length === 0) {
          setError("Please enter your name");
          setLoading(false);
          return;
        }
        formData.set("flow", "signUp");
        await signIn("password", formData);
        await createUserProfile({ name, email });
      } else {
        formData.set("flow", "signIn");
        await signIn("password", formData);
      }

      router.push("/");
    } catch (authError) {
      if (authError instanceof Error) {
        setError(authError.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-bold text-3xl text-slate-900">
            Cal Poly Red Cross Club
          </h1>
          <p className="mt-2 text-slate-600">
            {flow === "signIn"
              ? "Welcome back! Sign in to your account"
              : "Join our community of volunteers"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-6 flex gap-2 rounded-lg bg-slate-100 p-1">
            <button
              className={`flex-1 rounded-md px-4 py-2 font-medium text-sm transition-all ${
                flow === "signIn"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
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
              className={`flex-1 rounded-md px-4 py-2 font-medium text-sm transition-all ${
                flow === "signUp"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
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
              <div>
                <label
                  className="mb-1.5 block font-medium text-slate-700 text-sm"
                  htmlFor="name"
                >
                  Full Name
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  required={flow === "signUp"}
                  type="text"
                />
              </div>
            )}

            <div>
              <label
                className="mb-1.5 block font-medium text-slate-700 text-sm"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
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
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 transition focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                id="password"
                minLength={8}
                name="password"
                placeholder="Enter your password"
                required
                type="password"
              />
              {flow === "signUp" && (
                <p className="mt-1.5 text-slate-500 text-xs">
                  Must be at least 8 characters
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              className="w-full rounded-lg bg-rose-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
              type="submit"
            >
              {loading && "Please wait..."}
              {!loading && flow === "signIn" && "Sign In"}
              {!loading && flow === "signUp" && "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center text-slate-600 text-sm">
            {flow === "signIn" ? (
              <p>
                New to Red Cross?{" "}
                <button
                  className="font-medium text-rose-600 hover:text-rose-700"
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
                  className="font-medium text-rose-600 hover:text-rose-700"
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

        <p className="mt-6 text-center text-slate-500 text-xs">
          By signing up, you agree to help make a difference in our community
        </p>
      </div>
    </div>
  );
}
