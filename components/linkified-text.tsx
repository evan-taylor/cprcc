import type { ReactNode } from "react";

const URL_IN_TEXT = /\b(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
const TRAILING_PUNCT_FROM_URL = /[.,;:!?)]+$/u;

interface LinkifiedTextProps {
  readonly className?: string;
  readonly linkClassName?: string;
  readonly text: string;
}

const trimTrailingFromUrl = (raw: string): string =>
  raw.replace(TRAILING_PUNCT_FROM_URL, "");

export function LinkifiedText({
  className,
  linkClassName = "font-medium text-red-600 underline underline-offset-2 hover:text-red-700",
  text,
}: LinkifiedTextProps): ReactNode {
  const parts: ReactNode[] = [];
  let key = 0;
  let lastIndex = 0;

  for (const match of text.matchAll(URL_IN_TEXT)) {
    const raw = match[0];
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push(<span key={key}>{text.slice(lastIndex, start)}</span>);
      key += 1;
    }
    const cleaned = trimTrailingFromUrl(raw);
    const href =
      cleaned.startsWith("http://") || cleaned.startsWith("https://")
        ? cleaned
        : `https://${cleaned}`;
    parts.push(
      <a
        className={linkClassName}
        href={href}
        key={key}
        rel="noopener noreferrer"
        target="_blank"
      >
        {cleaned}
      </a>
    );
    key += 1;
    lastIndex = start + raw.length;
  }

  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key}>{text.slice(lastIndex)}</span>);
  }

  return <span className={className}>{parts}</span>;
}
