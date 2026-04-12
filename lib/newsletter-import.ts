const CELL_SPLIT_REGEX = /[\t,;]+/;
const EMAIL_TOKEN_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const IMPORT_EMAIL_VALID_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const LINE_BREAK_REGEX = /\r?\n/;

export interface NewsletterImportEntry {
  email: string;
  name?: string;
}

export interface NewsletterImportParseResult {
  duplicateLineCount: number;
  entries: NewsletterImportEntry[];
  skippedLineCount: number;
}

function isValidImportEmail(value: string) {
  return IMPORT_EMAIL_VALID_REGEX.test(value.trim());
}

function mergeEmailsFromLineIntoMap(
  byEmail: Map<string, { name?: string }>,
  emailsInLine: string[],
  name: string | undefined
): number {
  let duplicateLineCount = 0;

  for (const emailCandidate of emailsInLine) {
    const email = emailCandidate.trim().toLowerCase();
    if (!IMPORT_EMAIL_VALID_REGEX.test(email)) {
      continue;
    }

    if (byEmail.has(email)) {
      duplicateLineCount += 1;
      const existing = byEmail.get(email);
      byEmail.set(email, {
        name: name ?? existing?.name,
      });
    } else {
      byEmail.set(email, { name });
    }
  }

  return duplicateLineCount;
}

/**
 * Parse pasted text from Excel (tab-separated), CSV (comma/semicolon), or plain lists.
 * Dedupes by email (case-insensitive); later rows override names for the same email.
 */
export function parseNewsletterImportPaste(
  text: string
): NewsletterImportParseResult {
  const byEmail = new Map<string, { name?: string }>();
  let duplicateLineCount = 0;
  let skippedLineCount = 0;

  const lines = text.split(LINE_BREAK_REGEX);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      continue;
    }

    const parts = trimmed
      .split(CELL_SPLIT_REGEX)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    const emailsInLine = parts.filter((part) => isValidImportEmail(part));
    if (emailsInLine.length === 0) {
      skippedLineCount += 1;
      continue;
    }

    const nameParts = parts.filter((part) => !isValidImportEmail(part));
    const name = nameParts.length > 0 ? nameParts.join(" ").trim() : undefined;

    duplicateLineCount += mergeEmailsFromLineIntoMap(
      byEmail,
      emailsInLine,
      name
    );
  }

  const globalMatches = text.matchAll(EMAIL_TOKEN_REGEX);
  for (const match of globalMatches) {
    const email = match[0].toLowerCase();
    if (!IMPORT_EMAIL_VALID_REGEX.test(email)) {
      continue;
    }
    if (!byEmail.has(email)) {
      byEmail.set(email, {});
    }
  }

  const entries: NewsletterImportEntry[] = [];
  for (const [email, data] of byEmail) {
    entries.push({
      email,
      name: data.name,
    });
  }

  entries.sort((left, right) => left.email.localeCompare(right.email));

  return {
    duplicateLineCount,
    entries,
    skippedLineCount,
  };
}
