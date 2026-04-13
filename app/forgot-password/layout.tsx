import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot password",
  description:
    "Request a password reset link for your Cal Poly Red Cross Club account.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
