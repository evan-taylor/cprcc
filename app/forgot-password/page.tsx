"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

const RESET_REQUEST_SUCCESS_MESSAGE =
  "If an account exists for that email, we just sent a password reset link.";

function isResetUnavailableError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("Password reset is not enabled")
  );
}

export default function ForgotPasswordPage() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await signIn("password", {
        email: normalizedEmail,
        flow: "reset",
        redirectTo: "/reset-password",
      });
      setSuccessMessage(RESET_REQUEST_SUCCESS_MESSAGE);
    } catch (error) {
      if (isResetUnavailableError(error)) {
        setErrorMessage(
          "Password reset is unavailable right now. Please email redcrossclub@calpoly.edu for help."
        );
      } else {
        // Keep account existence private.
        setSuccessMessage(RESET_REQUEST_SUCCESS_MESSAGE);
      }
    } finally {
      setIsSubmitting(false);
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
            Forgot your password?
          </h1>
          <p className="mt-2 text-[color:var(--color-text-muted)] text-sm">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        <div className="editorial-card rounded-2xl p-6 sm:p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-1.5 block font-medium text-slate-700 text-sm"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 transition-colors duration-200 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                id="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                <p className="text-red-700 text-sm">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-emerald-700 text-sm">{successMessage}</p>
              </div>
            )}

            <button
              className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-sm text-white shadow-md shadow-red-600/20 transition-all duration-200 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Sending reset link…" : "Send reset link"}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-500 text-sm">
            Remembered your password?{" "}
            <Link
              className="font-medium text-red-600 transition-colors duration-150 hover:text-red-700"
              href="/signin"
            >
              Return to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
