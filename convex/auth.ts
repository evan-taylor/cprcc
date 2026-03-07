import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth, type EmailConfig } from "@convex-dev/auth/server";
import {
  generatePasswordResetEmailHtml,
  generatePasswordResetEmailSubject,
  generatePasswordResetEmailText,
} from "./emails/password_reset_email";
import { resend } from "./resend";

const PASSWORD_RESET_FROM =
  "Cal Poly Red Cross Club <notifications@calpolyredcross.org>";
const PASSWORD_RESET_MAX_AGE_SECONDS = 60 * 60;
const PASSWORD_RESET_EXPIRATION_MINUTES = PASSWORD_RESET_MAX_AGE_SECONDS / 60;
type PasswordResetSendParams = Parameters<
  NonNullable<EmailConfig["sendVerificationRequest"]>
>[0];
type PasswordResetSendCtx = Parameters<(typeof resend)["sendEmail"]>[0];

function createPasswordResetProvider(): EmailConfig | undefined {
  if (!process.env.RESEND_API_KEY) {
    return undefined;
  }

  return {
    id: "password-reset",
    type: "email",
    name: "Password Reset",
    from: PASSWORD_RESET_FROM,
    maxAge: PASSWORD_RESET_MAX_AGE_SECONDS,
    async sendVerificationRequest(
      { identifier, provider, token, url }: PasswordResetSendParams,
      ...rest: [PasswordResetSendCtx?]
    ) {
      const sendContext = rest[0];
      if (!sendContext) {
        throw new Error("Missing Convex context for password reset email send");
      }

      const resetUrl = new URL(url);
      resetUrl.searchParams.delete("code");
      resetUrl.searchParams.set("token", token);
      resetUrl.searchParams.set("email", identifier);
      const resetLink = resetUrl.toString();

      await resend.sendEmail(sendContext, {
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
      });
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
