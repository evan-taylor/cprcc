export const CLUB_EMAIL_FROM =
  "Cal Poly Red Cross Club <notifications@calpolyredcross.org>";

export const CLUB_EMAIL_REPLY_TO = "RedCrossClub@calpoly.edu";

export const CLUB_SITE_URL = "https://calpolyredcross.org";

const BLOCK_ELEMENT_REGEX =
  /<\/?(address|article|aside|blockquote|br|div|footer|h[1-6]|header|hr|li|main|ol|p|section|table|tbody|td|tfoot|th|thead|tr|ul)[^>]*>/gi;
const HTML_TAG_REGEX = /<[^>]+>/g;
const MULTIPLE_NEWLINES_REGEX = /\n{3,}/g;
const MULTIPLE_SPACES_REGEX = /[ \t]{2,}/g;
const UNSAFE_BLOCK_REGEX =
  /<(iframe|object|embed|script|style)[\s\S]*?<\/\1>/gi;
const INLINE_EVENT_HANDLER_DOUBLE_QUOTE_REGEX = /\son[a-z]+="[^"]*"/gi;
const INLINE_EVENT_HANDLER_SINGLE_QUOTE_REGEX = /\son[a-z]+='[^']*'/gi;
const INLINE_EVENT_HANDLER_UNQUOTED_REGEX = /\s+on[a-z]+\s*=\s*[^\s>]+/gi;
const JAVASCRIPT_PROTOCOL_REGEX =
  /(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi;
const JAVASCRIPT_PROTOCOL_UNQUOTED_REGEX = /(href|src)\s*=\s*javascript:/gi;

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

export function sanitizeEmailHtml(html: string) {
  return html
    .replace(UNSAFE_BLOCK_REGEX, "")
    .replace(INLINE_EVENT_HANDLER_DOUBLE_QUOTE_REGEX, "")
    .replace(INLINE_EVENT_HANDLER_SINGLE_QUOTE_REGEX, "")
    .replace(INLINE_EVENT_HANDLER_UNQUOTED_REGEX, "")
    .replace(JAVASCRIPT_PROTOCOL_REGEX, '$1="#"')
    .replace(JAVASCRIPT_PROTOCOL_UNQUOTED_REGEX, '$1="#"')
    .trim();
}

export function createPlainTextFromHtml(html: string) {
  const sanitizedHtml = sanitizeEmailHtml(html);
  const withLineBreaks = sanitizedHtml.replace(BLOCK_ELEMENT_REGEX, "\n");
  const withoutTags = withLineBreaks.replace(HTML_TAG_REGEX, " ");
  const decoded = decodeHtmlEntities(withoutTags);

  return decoded
    .replace(MULTIPLE_SPACES_REGEX, " ")
    .replace(MULTIPLE_NEWLINES_REGEX, "\n\n")
    .trim();
}
