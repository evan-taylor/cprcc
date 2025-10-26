"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="mx-auto flex h-screen w-96 flex-col items-center justify-center gap-8">
      <p>Log in to see the numbers</p>
      <form
        className="flex flex-col gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          try {
            await signIn("password", formData);
            router.push("/");
          } catch (authError) {
            if (authError instanceof Error) {
              setError(authError.message);
            } else {
              setError("Something went wrong. Please try again.");
            }
          }
        }}
      >
        <input
          className="rounded-md border-2 border-slate-200 bg-background p-2 text-foreground dark:border-slate-800"
          name="email"
          placeholder="Email"
          type="email"
        />
        <input
          className="rounded-md border-2 border-slate-200 bg-background p-2 text-foreground dark:border-slate-800"
          name="password"
          placeholder="Password"
          type="password"
        />
        <button
          className="rounded-md bg-foreground text-background"
          type="submit"
        >
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="flex flex-row gap-2">
          <span>
            {flow === "signIn"
              ? "Don't have an account?"
              : "Already have an account?"}
          </span>
          <button
            className="text-foreground underline hover:no-underline"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
            type="button"
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
        {error && (
          <div className="rounded-md border-2 border-red-500/50 bg-red-500/20 p-2">
            <p className="font-mono text-foreground text-xs">
              Error signing in: {error}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
