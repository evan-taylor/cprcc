import { CLUB_SITE_URL } from "./email";

export const NEWSLETTER_SUBSCRIBED = "subscribed" as const;
export const NEWSLETTER_UNSUBSCRIBED = "unsubscribed" as const;

export type NewsletterStatus =
  | typeof NEWSLETTER_SUBSCRIBED
  | typeof NEWSLETTER_UNSUBSCRIBED;

export function createNewsletterUnsubscribeToken() {
  return crypto.randomUUID().replaceAll("-", "");
}

export function resolveNewsletterStatus(subscribed: boolean): NewsletterStatus {
  return subscribed ? NEWSLETTER_SUBSCRIBED : NEWSLETTER_UNSUBSCRIBED;
}

export function getResolvedNewsletterStatus(
  status?: NewsletterStatus
): NewsletterStatus {
  return status === NEWSLETTER_SUBSCRIBED
    ? NEWSLETTER_SUBSCRIBED
    : NEWSLETTER_UNSUBSCRIBED;
}

export function isNewsletterSubscribed(status?: NewsletterStatus) {
  return getResolvedNewsletterStatus(status) === NEWSLETTER_SUBSCRIBED;
}

export function getNewsletterUnsubscribeUrl(token: string) {
  const url = new URL("/newsletter/unsubscribe", CLUB_SITE_URL);
  url.searchParams.set("token", token);
  return url.toString();
}
