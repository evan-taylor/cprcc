import type { EmailEvent } from "@convex-dev/resend";
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { resend } from "./resend";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const newsletterRequest = req.clone();
    const response = await resend.handleResendEventWebhook(ctx, req);

    if (response.status !== 201) {
      return response;
    }

    const payload = (await newsletterRequest.json()) as {
      data?: { email_id?: string };
      type?: string;
    } | null;

    if (
      !payload ||
      payload.type !== "email.bounced" ||
      !payload.data?.email_id
    ) {
      return response;
    }

    await ctx.runMutation(internal.newsletters.handleResendEmailEvent, {
      event: payload as EmailEvent,
    });

    return response;
  }),
});

export default http;
