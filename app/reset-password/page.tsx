"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import { AuthPageShell } from "@/components/auth-page-shell";

const MIN_PASSWORD_LENGTH = 8;

function getResetErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unable to reset your password right now. Please try again.";
  }

  if (
    error.message.includes("Invalid code") ||
    error.message.includes("Could not verify code")
  ) {
    return "This reset link is invalid or expired. Request a new password reset link.";
  }

  if (error.message.includes("Invalid password")) {
    return "Your new password must be at least 8 characters long.";
  }

  if (error.message.includes("Password reset is not enabled")) {
    return "Password reset is unavailable right now. Please email redcrossclub@calpoly.edu for help.";
  }

  return "Unable to reset your password right now. Please try again.";
}

function ResetPasswordPageContent() {
  const { signIn } = useAuthActions();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") ?? "").trim();
  const emailFromLink = (searchParams.get("email") ?? "").trim().toLowerCase();

  const [email, setEmail] = useState(emailFromLink);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!token) {
      setErrorMessage(
        "This reset link is missing a token. Please request a new reset email."
      );
      return;
    }

    if (!normalizedEmail) {
      setErrorMessage("Please enter the email address tied to your account.");
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage("Your new password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Your password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await signIn("password", {
        email: normalizedEmail,
        flow: "reset-verification",
        code: token,
        newPassword,
      });
      setSuccessMessage(
        "Password updated successfully. You can now continue to the site."
      );
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(getResetErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-display font-semibold text-3xl text-[color:var(--color-text-emphasis)]">
            Set a new password
          </h1>
          <p className="mt-2 text-[color:var(--color-text-muted)] text-sm">
            Choose a new password for your account.
          </p>
        </div>

        <div className="editorial-card rounded-2xl p-6 sm:p-8">
          {!token && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-amber-800 text-sm">
                This link is missing a reset token. Request a new password reset
                email.
              </p>
            </div>
          )}

          {successMessage ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-emerald-700 text-sm">{successMessage}</p>
              </div>
              <Link
                className="block w-full rounded-xl bg-red-600 px-4 py-3 text-center font-semibold text-sm text-white shadow-md shadow-red-600/20 transition-all duration-200 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-[0.98]"
                href="/"
              >
                Go to homepage
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  className="mb-1.5 block font-medium text-[color:var(--color-text)] text-sm"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <input
                  autoComplete="email"
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-2.5 text-[color:var(--color-text-emphasis)] transition-colors duration-200 placeholder:text-[color:var(--color-text-subtle)] focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  id="email"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </div>

              <div>
                <label
                  className="mb-1.5 block font-medium text-[color:var(--color-text)] text-sm"
                  htmlFor="newPassword"
                >
                  New Password
                </label>
                <input
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-2.5 text-[color:var(--color-text-emphasis)] transition-colors duration-200 placeholder:text-[color:var(--color-text-subtle)] focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  id="newPassword"
                  minLength={MIN_PASSWORD_LENGTH}
                  name="newPassword"
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Enter a new password"
                  required
                  type="password"
                  value={newPassword}
                />
              </div>

              <div>
                <label
                  className="mb-1.5 block font-medium text-[color:var(--color-text)] text-sm"
                  htmlFor="confirmPassword"
                >
                  Confirm New Password
                </label>
                <input
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-white px-4 py-2.5 text-[color:var(--color-text-emphasis)] transition-colors duration-200 placeholder:text-[color:var(--color-text-subtle)] focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  id="confirmPassword"
                  minLength={MIN_PASSWORD_LENGTH}
                  name="confirmPassword"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  type="password"
                  value={confirmPassword}
                />
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-red-700 text-sm">{errorMessage}</p>
                </div>
              )}

              <button
                className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-sm text-white shadow-md shadow-red-600/20 transition-all duration-200 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting || !token}
                type="submit"
              >
                {isSubmitting ? "Updating password…" : "Update password"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-[color:var(--color-text-muted)] text-sm">
            Need a new link?{" "}
            <Link
              className="font-medium text-red-600 transition-colors duration-150 hover:text-red-700"
              href="/forgot-password"
            >
              Request password reset
            </Link>
          </p>
        </div>
      </div>
    </AuthPageShell>
  );
}

function ResetPasswordPageFallback() {
  return (
    <AuthPageShell>
      <div className="w-full max-w-sm">
        <div className="editorial-card rounded-2xl p-6 text-center sm:p-8">
          <p className="font-medium text-[color:var(--color-text-emphasis)] text-sm">
            Loading password reset details...
          </p>
        </div>
      </div>
    </AuthPageShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordPageFallback />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
