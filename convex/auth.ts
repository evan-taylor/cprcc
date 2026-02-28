import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, type EmailConfig } from "@convex-dev/auth/server";
import {
  generatePasswordResetEmailHtml,
  generatePasswordResetEmailSubject,
  generatePasswordResetEmailText,
} from "./emails/password-reset-email";

const PASSWORD_RESET_FROM =
  "Cal Poly Red Cross Club <notifications@calpolyredcross.org>";
const PASSWORD_RESET_MAX_AGE_SECONDS = 60 * 60;
const PASSWORD_RESET_EXPIRATION_MINUTES = PASSWORD_RESET_MAX_AGE_SECONDS / 60;

function createPasswordResetProvider(): EmailConfig | undefined {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return undefined;
  }

  return {
    id: "password-reset",
    type: "email",
    name: "Password Reset",
    from: PASSWORD_RESET_FROM,
    maxAge: PASSWORD_RESET_MAX_AGE_SECONDS,
    apiKey: resendApiKey,
    async sendVerificationRequest({ identifier, provider, token, url }) {
      const resetUrl = new URL(url);
      resetUrl.searchParams.delete("code");
      resetUrl.searchParams.set("token", token);
      resetUrl.searchParams.set("email", identifier);
      const resetLink = resetUrl.toString();

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${provider.apiKey ?? resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: provider.from ?? PASSWORD_RESET_FROM,
          to: identifier,
          subject: generatePasswordResetEmailSubject(),
          html: generatePasswordResetEmailHtml({
            expiresInMinutes: PASSWORD_RESET_EXPIRATION_MINUTES,
            resetUrl: resetLink,
          }),
          text: generatePasswordResetEmailText({
            expiresInMinutes: PASSWORD_RESET_EXPIRATION_MINUTES,
            resetUrl: resetLink,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to send password reset email (${response.status})`
        );
      }
    },
  };
}

const passwordResetProvider = createPasswordResetProvider();

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      reset: passwordResetProvider,
      profile(params) {
        return {
          email: params.email as string,
          name: params.name as string,
        };
      },
    }),
  ],
});
