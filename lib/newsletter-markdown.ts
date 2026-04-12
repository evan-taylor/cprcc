import { marked } from "marked";
import TurndownService from "turndown";

const turndown = new TurndownService({
  codeBlockStyle: "fenced",
  headingStyle: "atx",
});

marked.setOptions({
  breaks: true,
  gfm: true,
});

const LINE_SPLIT_REGEX = /\r?\n/;
const MD_LIST_LINE_REGEX = /^\s*[-*+]\s/;
const MD_ORDERED_LINE_REGEX = /^\s*\d+\.\s/;
const MD_BLOCKQUOTE_START_REGEX = /^>\s/m;
const MD_CODE_FENCE_REGEX = /^```/m;
const MD_BOLD_PHRASE_REGEX = /\*\*[^*]+\*\*/;

export function htmlToMarkdown(html: string): string {
  const trimmed = html.trim();
  if (trimmed === "") {
    return "";
  }
  return turndown.turndown(trimmed);
}

export function markdownToHtml(markdown: string): string {
  const result = marked.parse(markdown, { async: false });
  if (typeof result !== "string") {
    throw new Error("Expected synchronous Markdown parse");
  }
  return result;
}

const MARKDOWN_HEADING_LINE_REGEX = /^#{1,6}\s/m;
const MARKDOWN_LINK_REGEX = /\[[^\]]+\]\([^)\s]+\)/;

/**
 * Heuristic: pasted plain text is probably Markdown (for Visual-mode paste handling).
 */
export function clipboardTextLooksLikeMarkdown(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3) {
    return false;
  }
  if (MARKDOWN_HEADING_LINE_REGEX.test(trimmed)) {
    return true;
  }
  if (MARKDOWN_LINK_REGEX.test(trimmed)) {
    return true;
  }
  const lines = trimmed.split(LINE_SPLIT_REGEX);
  let listLines = 0;
  for (const line of lines) {
    if (MD_LIST_LINE_REGEX.test(line) || MD_ORDERED_LINE_REGEX.test(line)) {
      listLines += 1;
    }
  }
  if (listLines >= 2) {
    return true;
  }
  if (listLines >= 1 && lines.length >= 4) {
    return true;
  }
  if (MD_BLOCKQUOTE_START_REGEX.test(trimmed)) {
    return true;
  }
  if (MD_CODE_FENCE_REGEX.test(trimmed)) {
    return true;
  }
  if (MD_BOLD_PHRASE_REGEX.test(trimmed) && trimmed.length > 24) {
    return true;
  }
  return false;
}

/**
 * If Markdown was pasted into Visual mode, the doc is only &lt;p&gt; nodes with raw
 * `##` / `[](url)` text. Re-parse as Markdown before send. Browser-only (DOMParser).
 */
export function repairVisualEditorHtmlIfMarkdown(html: string): string {
  if (typeof globalThis.DOMParser === "undefined") {
    return html;
  }

  const trimmed = html.trim();
  if (trimmed === "" || trimmed === "<p></p>") {
    return html;
  }

  const doc = new DOMParser().parseFromString(trimmed, "text/html");
  const body = doc.body;
  if (
    body.querySelector(
      "h1, h2, h3, h4, h5, h6, ul, ol, li, hr, blockquote, table, pre"
    )
  ) {
    return html;
  }

  const text = body.textContent ?? "";
  if (!clipboardTextLooksLikeMarkdown(text)) {
    return html;
  }

  const paragraphs = [...body.querySelectorAll("p")];
  if (paragraphs.length === 0) {
    return html;
  }

  const joined = paragraphs
    .map((p) => (p.textContent ?? "").trimEnd())
    .join("\n\n")
    .trim();

  if (!clipboardTextLooksLikeMarkdown(joined)) {
    return html;
  }

  return markdownToHtml(joined);
}
