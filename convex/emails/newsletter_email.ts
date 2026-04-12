import { CLUB_EMAIL_REPLY_TO, createPlainTextFromHtml } from "../lib/email";

const STYLE_ATTR_REGEX = /\bstyle\s*=/i;

interface NewsletterEmailParams {
  bodyHtml: string;
  previewText?: string;
  subject: string;
  unsubscribeUrl: string;
}

function applyNewsletterBodyStyles(html: string): string {
  let result = html;
  const blockStyles: Array<{ style: string; tag: string }> = [
    {
      style: "margin:0 0 16px 0;line-height:1.7;color:#0f172a;font-size:16px;",
      tag: "p",
    },
    {
      style:
        "margin:24px 0 12px 0;font-size:22px;line-height:1.3;color:#0f172a;",
      tag: "h2",
    },
    {
      style:
        "margin:20px 0 10px 0;font-size:18px;line-height:1.35;color:#0f172a;",
      tag: "h3",
    },
    {
      style:
        "margin:0 0 16px 0;padding-left:24px;line-height:1.7;color:#0f172a;",
      tag: "ul",
    },
    {
      style:
        "margin:0 0 16px 0;padding-left:24px;line-height:1.7;color:#0f172a;",
      tag: "ol",
    },
    { style: "margin:0 0 8px 0;", tag: "li" },
    {
      style:
        "margin:0 0 16px 0;padding-left:16px;border-left:4px solid #e2e8f0;color:#475569;",
      tag: "blockquote",
    },
  ];

  for (const { style, tag } of blockStyles) {
    result = result.replace(
      new RegExp(`<${tag}\\b([^>]*)>`, "gi"),
      (_match, attrs: string) => {
        if (STYLE_ATTR_REGEX.test(attrs)) {
          return `<${tag}${attrs}>`;
        }
        return `<${tag} style="${style}"${attrs}>`;
      }
    );
  }

  result = result.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    if (STYLE_ATTR_REGEX.test(attrs)) {
      return `<a${attrs}>`;
    }
    return `<a style="color:#b91c1c;text-decoration:underline;"${attrs}>`;
  });

  return result;
}

function getPreviewText(previewText?: string) {
  if (!previewText) {
    return "";
  }

  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${previewText}</div>`;
}

export function generateNewsletterEmailHtml({
  bodyHtml,
  previewText,
  subject,
  unsubscribeUrl,
}: NewsletterEmailParams) {
  const styledBody = applyNewsletterBodyStyles(bodyHtml);
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Inter,Arial,sans-serif;">
    ${getPreviewText(previewText)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;max-width:680px;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;">
            <tr>
              <td style="background:#b91c1c;padding:28px 32px;color:#ffffff;">
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.85;">
                  Cal Poly Red Cross Club
                </p>
                <h1 style="margin:0;font-size:28px;line-height:1.2;font-weight:700;">
                  ${subject}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <div style="font-size:16px;line-height:1.7;color:#0f172a;">
                  ${styledBody}
                </div>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e2e8f0;padding:24px 32px;background:#f8fafc;">
                <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#475569;">
                  Replies to this email will go to
                  <a href="mailto:${CLUB_EMAIL_REPLY_TO}" style="color:#b91c1c;text-decoration:none;">
                    ${CLUB_EMAIL_REPLY_TO}
                  </a>.
                </p>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
                  Don’t want club news and announcements in your inbox?
                  <a href="${unsubscribeUrl}" style="color:#b91c1c;text-decoration:none;">
                    Unsubscribe from the newsletter
                  </a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function generateNewsletterEmailText({
  bodyHtml,
  previewText,
  subject,
  unsubscribeUrl,
}: NewsletterEmailParams) {
  const bodyText = createPlainTextFromHtml(bodyHtml);
  const sections = [
    subject,
    previewText,
    bodyText,
    `Reply to: ${CLUB_EMAIL_REPLY_TO}`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ];

  return sections.filter(Boolean).join("\n\n");
}
