import parse from "html-react-parser";
import { createElement } from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  render,
  Section,
  Text,
} from "react-email";
import { CLUB_EMAIL_REPLY_TO, createPlainTextFromHtml } from "../lib/email";

/** Match real `style=` only — avoid false positives like `data-style=`. */
const HTML_STYLE_ATTR_REGEX = /(^|[\s])style\s*=/i;

interface NewsletterEmailParams {
  bodyHtml: string;
  previewText?: string;
  subject: string;
  unsubscribeUrl: string;
}

const OUTER_BACKGROUND_COLOR = "#f8fafc";
const CARD_BORDER_COLOR = "#e2e8f0";
const CLUB_RED = "#b91c1c";
const TEXT_COLOR = "#0f172a";
const MUTED_TEXT_COLOR = "#475569";
const SUBTLE_TEXT_COLOR = "#64748b";

const bodyStyle = {
  backgroundColor: OUTER_BACKGROUND_COLOR,
  color: TEXT_COLOR,
  fontFamily: "Inter, Arial, sans-serif",
  margin: "0",
};

const pageSectionStyle = {
  backgroundColor: OUTER_BACKGROUND_COLOR,
  padding: "32px 16px",
};

const containerStyle = {
  backgroundColor: "#ffffff",
  border: `1px solid ${CARD_BORDER_COLOR}`,
  borderRadius: "24px",
  maxWidth: "680px",
  overflow: "hidden",
};

const headerSectionStyle = {
  backgroundColor: CLUB_RED,
  color: "#ffffff",
  padding: "28px 32px",
};

const eyebrowStyle = {
  fontSize: "12px",
  letterSpacing: "0.16em",
  lineHeight: "1.4",
  margin: "0 0 8px",
  opacity: "0.85",
  textTransform: "uppercase" as const,
};

const headingStyle = {
  fontSize: "28px",
  fontWeight: "700",
  lineHeight: "1.2",
  margin: "0",
};

const contentSectionStyle = {
  padding: "32px",
};

const contentWrapperStyle = {
  color: TEXT_COLOR,
  fontSize: "16px",
  lineHeight: "1.7",
};

const footerSectionStyle = {
  backgroundColor: OUTER_BACKGROUND_COLOR,
  borderTop: `1px solid ${CARD_BORDER_COLOR}`,
  padding: "24px 32px",
};

const replyTextStyle = {
  color: MUTED_TEXT_COLOR,
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const unsubscribeTextStyle = {
  color: SUBTLE_TEXT_COLOR,
  fontSize: "13px",
  lineHeight: "1.6",
  margin: "0",
};

const footerLinkStyle = {
  color: CLUB_RED,
  textDecoration: "none",
};

function applyNewsletterBodyStyles(html: string): string {
  let result = html;
  const blockStyles: Array<{ style: string; tag: string }> = [
    {
      style: "margin:0 0 16px 0;line-height:1.7;color:#0f172a;font-size:16px;",
      tag: "p",
    },
    {
      style:
        "margin:28px 0 14px 0;font-size:26px;line-height:1.25;color:#0f172a;font-weight:700;",
      tag: "h1",
    },
    {
      style:
        "margin:24px 0 12px 0;font-size:22px;line-height:1.3;color:#0f172a;font-weight:700;",
      tag: "h2",
    },
    {
      style:
        "margin:20px 0 10px 0;font-size:18px;line-height:1.35;color:#0f172a;font-weight:600;",
      tag: "h3",
    },
    {
      style:
        "margin:16px 0 8px 0;font-size:16px;line-height:1.4;color:#0f172a;font-weight:600;",
      tag: "h4",
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
    {
      style: "margin:24px 0;border:none;border-top:1px solid #e2e8f0;",
      tag: "hr",
    },
  ];

  for (const { style, tag } of blockStyles) {
    result = result.replace(
      new RegExp(`<${tag}\\b([^>]*)>`, "gi"),
      (_match, attrs: string) => {
        if (HTML_STYLE_ATTR_REGEX.test(attrs)) {
          return `<${tag}${attrs}>`;
        }
        return `<${tag} style="${style}"${attrs}>`;
      }
    );
  }

  result = result.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    if (HTML_STYLE_ATTR_REGEX.test(attrs)) {
      return `<a${attrs}>`;
    }
    return `<a style="color:#b91c1c;text-decoration:underline;"${attrs}>`;
  });

  result = result.replace(/<strong\b([^>]*)>/gi, (_match, attrs: string) => {
    if (HTML_STYLE_ATTR_REGEX.test(attrs)) {
      return `<strong${attrs}>`;
    }
    return `<strong style="font-weight:700;color:#0f172a;"${attrs}>`;
  });

  result = result.replace(/<em\b([^>]*)>/gi, (_match, attrs: string) => {
    if (HTML_STYLE_ATTR_REGEX.test(attrs)) {
      return `<em${attrs}>`;
    }
    return `<em style="font-style:italic;color:#0f172a;"${attrs}>`;
  });

  return result;
}

function NewsletterEmailTemplate({
  bodyHtml,
  previewText,
  subject,
  unsubscribeUrl,
}: NewsletterEmailParams) {
  const bodyContent = parse(applyNewsletterBodyStyles(bodyHtml));

  return createElement(
    Html,
    { lang: "en" },
    createElement(Head),
    previewText ? createElement(Preview, null, previewText) : null,
    createElement(
      Body,
      { style: bodyStyle },
      createElement(
        Section,
        { style: pageSectionStyle },
        createElement(
          Container,
          { style: containerStyle },
          createElement(
            Section,
            { style: headerSectionStyle },
            createElement(
              Text,
              { style: eyebrowStyle },
              "Cal Poly Red Cross Club"
            ),
            createElement(Heading, { as: "h1", style: headingStyle }, subject)
          ),
          createElement(
            Section,
            { style: contentSectionStyle },
            createElement("div", { style: contentWrapperStyle }, bodyContent)
          ),
          createElement(
            Section,
            { style: footerSectionStyle },
            createElement(
              Text,
              { style: replyTextStyle },
              "Replies to this email will go to ",
              createElement(
                Link,
                {
                  href: `mailto:${CLUB_EMAIL_REPLY_TO}`,
                  style: footerLinkStyle,
                },
                CLUB_EMAIL_REPLY_TO
              ),
              "."
            ),
            createElement(
              Text,
              { style: unsubscribeTextStyle },
              "Don't want club news and announcements in your inbox? ",
              createElement(
                Link,
                {
                  href: unsubscribeUrl,
                  style: footerLinkStyle,
                },
                "Unsubscribe from the newsletter"
              ),
              "."
            )
          )
        )
      )
    )
  );
}

export async function generateNewsletterEmailHtml({
  bodyHtml,
  previewText,
  subject,
  unsubscribeUrl,
}: NewsletterEmailParams) {
  return await render(
    createElement(NewsletterEmailTemplate, {
      bodyHtml,
      previewText,
      subject,
      unsubscribeUrl,
    })
  );
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
