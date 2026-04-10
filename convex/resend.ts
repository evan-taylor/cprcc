import { Resend } from "@convex-dev/resend";
import { components, internal } from "./_generated/api";

export const resend: Resend = new Resend(components.resend, {
  // Existing production flows send to real recipients.
  onEmailEvent: internal.newsletters.handleResendEmailEvent,
  testMode: false,
});
