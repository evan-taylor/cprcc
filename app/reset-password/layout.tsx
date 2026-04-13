import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password",
  description:
    "Set a new password for your Cal Poly Red Cross Club account using your email reset link.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
