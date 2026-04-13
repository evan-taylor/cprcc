"use client";

import type { Editor } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clipboardTextLooksLikeMarkdown,
  htmlToMarkdown,
  markdownToHtml,
} from "@/lib/newsletter-markdown";

interface NewsletterEditorProps {
  content: string;
  disabled?: boolean;
  error?: string;
  /** Taller editing area for the dedicated compose screen */
  largeWorkspace?: boolean;
  onChange: (html: string) => void;
  placeholder?: string;
}

const emptyEditorContent = "<p></p>";

const HTTP_URL_PREFIX_REGEX = /^https?:\/\//i;

/** Keeps focus in the TipTap editor so toolbar actions run (click/tap otherwise blur first). */
function toolbarPointerDown(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

function toggleBulletListFromToolbar(editor: Editor) {
  const chain = editor.chain().focus();
  if (editor.isActive("heading")) {
    chain.setParagraph();
  }
  chain.toggleBulletList().run();
}

function toggleOrderedListFromToolbar(editor: Editor) {
  const chain = editor.chain().focus();
  if (editor.isActive("heading")) {
    chain.setParagraph();
  }
  chain.toggleOrderedList().run();
}

function ToolbarButton({
  active,
  children,
  disabled,
  onClick,
}: {
  active?: boolean;
  children: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const isToggle = active !== undefined;
  return (
    <button
      aria-pressed={isToggle ? active : undefined}
      className={`inline-flex min-h-11 touch-manipulation items-center justify-center whitespace-nowrap rounded-lg border px-3 py-2 font-medium text-sm transition-colors sm:min-h-9 sm:py-1.5 ${
        active
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-[color:var(--color-border)] bg-white text-[color:var(--color-text-muted)] hover:border-[color:var(--color-border-hover)] hover:bg-[color:var(--color-bg-subtle)] hover:text-[color:var(--color-text-emphasis)]"
      } disabled:cursor-not-allowed disabled:opacity-50`}
      disabled={disabled}
      onClick={onClick}
      onMouseDown={toolbarPointerDown}
      type="button"
    >
      {children}
    </button>
  );
}

const EDITOR_MIN_HEIGHT_DEFAULT = "min-h-[20rem]";
const EDITOR_MIN_HEIGHT_LARGE =
  "min-h-[min(70vh,52rem)] sm:min-h-[min(75vh,56rem)]";
const EDITOR_PLACEHOLDER_CLASSES =
  "[&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-[color:var(--color-text-subtle)] [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]";

const HEADING_LEVELS = [
  { label: "H1", level: 1 as const },
  { label: "H2", level: 2 as const },
  { label: "H3", level: 3 as const },
  { label: "H4", level: 4 as const },
];

export function NewsletterEditor({
  content,
  disabled = false,
  error,
  largeWorkspace = false,
  onChange,
  placeholder = "Share updates, volunteer opportunities, and highlights with the club.",
}: NewsletterEditorProps) {
  const [linkHref, setLinkHref] = useState("");
  const [linkError, setLinkError] = useState<string | undefined>();
  const [mode, setMode] = useState<"markdown" | "visual">("visual");
  const [markdownDraft, setMarkdownDraft] = useState("");
  const editorRef = useRef<Editor | null>(null);
  const modeRef = useRef(mode);
  const disabledRef = useRef(disabled);
  modeRef.current = mode;
  disabledRef.current = disabled;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      Link.configure({
        HTMLAttributes: {
          class:
            "newsletter-editor-link text-red-700 underline decoration-red-600/70 underline-offset-[3px]",
        },
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: content || emptyEditorContent,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: `${largeWorkspace ? EDITOR_MIN_HEIGHT_LARGE : EDITOR_MIN_HEIGHT_DEFAULT} ${EDITOR_PLACEHOLDER_CLASSES} rounded-b-[1.5rem] px-5 py-5 text-[15px] leading-7 text-[color:var(--color-text-emphasis)] focus:outline-none [&_a.newsletter-editor-link]:text-red-700 [&_a.newsletter-editor-link]:underline [&_a.newsletter-editor-link]:decoration-red-600/70 [&_blockquote]:my-4 [&_blockquote]:border-[color:var(--color-border)] [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:text-[color:var(--color-text-muted)] [&_li]:my-1 [&_li>p]:mb-0 [&_li>p]:mt-0 [&_ol]:list-decimal [&_ol]:list-outside [&_ol]:pl-8 [&_ol_ol]:list-[lower-alpha] [&_ul]:list-disc [&_ul]:list-outside [&_ul]:pl-8 [&_ul_ul]:list-[circle]`,
      },
      handlePaste: (_view, event) => {
        if (modeRef.current !== "visual" || disabledRef.current) {
          return false;
        }
        const clipboard = event.clipboardData;
        if (!clipboard) {
          return false;
        }
        const plain = clipboard.getData("text/plain");
        if (!(plain && clipboardTextLooksLikeMarkdown(plain))) {
          return false;
        }
        event.preventDefault();
        const ed = editorRef.current;
        if (!ed) {
          return false;
        }
        ed.chain().focus().insertContent(markdownToHtml(plain)).run();
        return true;
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      // In Markdown mode the textarea owns content; TipTap still holds the last
      // Visual document. Propagating onUpdate would overwrite parent state with
      // stale HTML after the textarea calls onChange(markdownToHtml(...)).
      if (modeRef.current === "markdown") {
        return;
      }
      onChange(nextEditor.getHTML());
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const syncLinkHref = () => {
      if (editor.isActive("link")) {
        const href = editor.getAttributes("link").href;
        if (typeof href === "string" && href.length > 0) {
          setLinkHref(href);
        }
      }
    };

    editor.on("selectionUpdate", syncLinkHref);
    syncLinkHref();

    return () => {
      editor.off("selectionUpdate", syncLinkHref);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHtml = editor.getHTML();
    const normalizedContent = content || emptyEditorContent;
    if (mode === "visual" && currentHtml !== normalizedContent) {
      editor.commands.setContent(normalizedContent, { emitUpdate: false });
    }
    editor.setEditable(!disabled && mode === "visual");
  }, [content, disabled, editor, mode]);

  const applyLinkHref = () => {
    if (!editor) {
      return;
    }

    const raw = linkHref.trim();
    if (raw === "") {
      setLinkError("Enter a URL.");
      return;
    }

    if (editor.state.selection.empty && !editor.isActive("link")) {
      setLinkError("Select text first, then apply a link.");
      return;
    }

    setLinkError(undefined);
    const href = HTTP_URL_PREFIX_REGEX.test(raw) ? raw : `https://${raw}`;

    if (editor.isActive("link")) {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
      return;
    }

    editor.chain().focus().setLink({ href }).run();
  };

  const switchToMarkdown = () => {
    const sourceHtml = content || emptyEditorContent;
    setMarkdownDraft(htmlToMarkdown(sourceHtml));
    setMode("markdown");
  };

  const switchToVisual = () => {
    if (!editor) {
      return;
    }
    const html = markdownToHtml(markdownDraft);
    onChange(html);
    editor.commands.setContent(html, { emitUpdate: false });
    setMode("visual");
  };

  if (!editor) {
    return (
      <div className="editorial-card overflow-hidden rounded-[1.5rem] border border-[color:var(--color-border)] bg-white">
        <div className="border-[color:var(--color-border)] border-b px-5 py-4">
          <p className="text-[color:var(--color-text-muted)] text-sm">
            Loading editor…
          </p>
        </div>
        <div className="space-y-3 px-5 py-6">
          <div className="shimmer-surface h-4 rounded-lg" />
          <div className="shimmer-surface h-4 w-[90%] rounded-lg" />
          <div className="shimmer-surface h-4 w-[70%] rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={`editorial-card overflow-hidden rounded-[1.5rem] ${
          error ? "border-red-300" : ""
        }`}
      >
        <div className="space-y-0 border-[color:var(--color-border)] border-b bg-[color:var(--color-bg-subtle)]/70">
          <div className="flex flex-wrap items-center gap-2 px-3 py-3">
            <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
              <ToolbarButton
                active={mode === "visual"}
                disabled={disabled}
                onClick={() => {
                  if (mode === "markdown") {
                    switchToVisual();
                  }
                }}
              >
                Visual
              </ToolbarButton>
              <ToolbarButton
                active={mode === "markdown"}
                disabled={disabled}
                onClick={() => {
                  if (mode === "visual") {
                    switchToMarkdown();
                  }
                }}
              >
                Markdown
              </ToolbarButton>
            </div>
            <div
              className={mode === "visual" ? "contents" : "hidden"}
              data-editor-visual=""
            >
              <span
                aria-hidden="true"
                className="mx-1 h-5 w-px bg-[color:var(--color-border)]"
              />
              <div className="flex gap-1">
                <ToolbarButton
                  active={editor.isActive("bold")}
                  disabled={disabled}
                  onClick={() => editor.chain().focus().toggleBold().run()}
                >
                  Bold
                </ToolbarButton>
                <ToolbarButton
                  active={editor.isActive("italic")}
                  disabled={disabled}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                  Italic
                </ToolbarButton>
                <ToolbarButton
                  active={editor.isActive("underline")}
                  disabled={disabled}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                  Underline
                </ToolbarButton>
              </div>
              <span
                aria-hidden="true"
                className="mx-1 h-5 w-px bg-[color:var(--color-border)] max-sm:hidden"
              />
              <div className="flex gap-1">
                {HEADING_LEVELS.map(({ label, level }) => (
                  <ToolbarButton
                    active={editor.isActive("heading", { level })}
                    disabled={disabled}
                    key={level}
                    onClick={() =>
                      editor.chain().focus().toggleHeading({ level }).run()
                    }
                  >
                    {label}
                  </ToolbarButton>
                ))}
              </div>
              <span
                aria-hidden="true"
                className="mx-1 h-5 w-px bg-[color:var(--color-border)] max-sm:hidden"
              />
              <div className="flex gap-1">
                <ToolbarButton
                  active={editor.isActive("bulletList")}
                  disabled={disabled}
                  onClick={() => toggleBulletListFromToolbar(editor)}
                >
                  Bullets
                </ToolbarButton>
                <ToolbarButton
                  active={editor.isActive("orderedList")}
                  disabled={disabled}
                  onClick={() => toggleOrderedListFromToolbar(editor)}
                >
                  Numbers
                </ToolbarButton>
                <ToolbarButton
                  disabled={disabled}
                  onClick={() =>
                    editor.chain().focus().setHorizontalRule().run()
                  }
                >
                  Rule
                </ToolbarButton>
              </div>
              <span
                aria-hidden="true"
                className="mx-1 h-5 w-px bg-[color:var(--color-border)] max-sm:hidden"
              />
              <div className="flex gap-1">
                <ToolbarButton
                  active={editor.isActive({ textAlign: "left" })}
                  disabled={disabled}
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                >
                  Left
                </ToolbarButton>
                <ToolbarButton
                  active={editor.isActive({ textAlign: "center" })}
                  disabled={disabled}
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                >
                  Center
                </ToolbarButton>
              </div>
              <div className="ml-auto">
                <Button
                  className="touch-manipulation"
                  disabled={disabled}
                  onClick={() =>
                    editor.chain().focus().clearNodes().unsetAllMarks().run()
                  }
                  onMouseDown={toolbarPointerDown}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Clear formatting
                </Button>
              </div>
            </div>
          </div>
          {mode === "visual" && (
            <div className="flex flex-col gap-2 border-[color:var(--color-border)] border-t bg-white/65 px-3 py-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label
                  className="mb-1.5 block font-medium text-[color:var(--color-text-muted)] text-sm"
                  htmlFor="newsletter-link-url"
                >
                  Link URL
                </label>
                <Input
                  className="min-w-0 py-2 text-sm"
                  disabled={disabled}
                  id="newsletter-link-url"
                  onChange={(event) => {
                    setLinkHref(event.target.value);
                    setLinkError(undefined);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyLinkHref();
                    }
                  }}
                  placeholder="https://example.org"
                  value={linkHref}
                />
              </div>
              <div className="flex gap-1.5">
                <ToolbarButton
                  disabled={disabled}
                  onClick={() => {
                    applyLinkHref();
                  }}
                >
                  Apply link
                </ToolbarButton>
                <ToolbarButton
                  active={editor.isActive("link")}
                  disabled={disabled || !editor.isActive("link")}
                  onClick={() => {
                    setLinkError(undefined);
                    editor.chain().focus().unsetLink().run();
                  }}
                >
                  Remove link
                </ToolbarButton>
              </div>
              {linkError ? (
                <p className="text-red-600 text-sm">{linkError}</p>
              ) : null}
            </div>
          )}
        </div>
        <div
          className={`[&_.ProseMirror_blockquote]:mb-4 [&_.ProseMirror_h1]:mt-7 [&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:text-[color:var(--color-text-emphasis)] [&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:text-[color:var(--color-text-emphasis)] [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h3]:mt-5 [&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:text-[color:var(--color-text-emphasis)] [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h4]:mt-4 [&_.ProseMirror_h4]:mb-2 [&_.ProseMirror_h4]:font-semibold [&_.ProseMirror_h4]:text-[color:var(--color-text-emphasis)] [&_.ProseMirror_h4]:text-base [&_.ProseMirror_hr]:my-6 [&_.ProseMirror_hr]:border-[color:var(--color-border)] [&_.ProseMirror_li]:mb-1 [&_.ProseMirror_ol]:mb-4 [&_.ProseMirror_p]:mb-4 [&_.ProseMirror_ul]:mb-4 ${
            mode === "markdown" ? "hidden" : ""
          }`}
        >
          <EditorContent editor={editor} />
        </div>
        {mode === "markdown" ? (
          <div className="border-[color:var(--color-border)] border-t bg-white px-4 py-4">
            <label
              className="mb-2 block font-medium text-[color:var(--color-text-emphasis)] text-sm"
              htmlFor="newsletter-markdown-body"
            >
              Markdown
            </label>
            <textarea
              className={`${largeWorkspace ? EDITOR_MIN_HEIGHT_LARGE : EDITOR_MIN_HEIGHT_DEFAULT} w-full resize-y rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg-subtle)] px-4 py-3 font-mono text-[14px] text-[color:var(--color-text-emphasis)] leading-6 placeholder:text-[color:var(--color-text-subtle)] focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/20`}
              disabled={disabled}
              id="newsletter-markdown-body"
              onChange={(event) => {
                const next = event.target.value;
                setMarkdownDraft(next);
                onChange(markdownToHtml(next));
              }}
              placeholder={
                "## Section title\n\nIntro paragraph.\n\n### Subsection\n\n- [Link text](https://example.org)\n\n---\n\n**Bold** and *italic*."
              }
              spellCheck={false}
              value={markdownDraft}
            />
            <p className="mt-2 text-[color:var(--color-text-muted)] text-xs">
              GitHub-flavored Markdown:{" "}
              <code className="rounded bg-[color:var(--color-bg-subtle)] px-1 py-0.5 text-[11px]">
                ## / ### / ####
              </code>{" "}
              headings,{" "}
              <code className="rounded bg-[color:var(--color-bg-subtle)] px-1 py-0.5 text-[11px]">
                ---
              </code>{" "}
              rules, lists, and links. Use Visual for H1–H4 and Rule buttons.
            </p>
          </div>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-red-600 text-sm">{error}</p> : null}
    </div>
  );
}
