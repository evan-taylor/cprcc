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
