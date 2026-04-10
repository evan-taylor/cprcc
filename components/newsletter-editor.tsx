"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface NewsletterEditorProps {
  content: string;
  disabled?: boolean;
  error?: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const emptyEditorContent = "<p></p>";

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
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center rounded-full border px-3 py-2 font-medium text-sm transition-colors ${
        active
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      } disabled:cursor-not-allowed disabled:opacity-50`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export function NewsletterEditor({
  content,
  disabled = false,
  error,
  onChange,
  placeholder = "Share updates, volunteer opportunities, and highlights with the club.",
}: NewsletterEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Link.configure({
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
        class:
          "min-h-[20rem] rounded-b-[1.5rem] px-5 py-5 text-[15px] leading-7 text-slate-900 focus:outline-none",
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      onChange(nextEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHtml = editor.getHTML();
    const normalizedContent = content || emptyEditorContent;
    if (currentHtml !== normalizedContent) {
      editor.commands.setContent(normalizedContent, { emitUpdate: false });
    }
    editor.setEditable(!disabled);
  }, [content, disabled, editor]);

  if (!editor) {
    return (
      <div className="editorial-card overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
        <div className="border-slate-200 border-b px-5 py-4">
          <p className="text-slate-500 text-sm">Loading editor…</p>
        </div>
        <div className="space-y-3 px-5 py-6">
          <div className="shimmer-surface h-4 rounded-full" />
          <div className="shimmer-surface h-4 w-[90%] rounded-full" />
          <div className="shimmer-surface h-4 w-[70%] rounded-full" />
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
        <div className="flex flex-wrap gap-2 border-slate-200 border-b bg-slate-50/80 px-4 py-4">
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
          <ToolbarButton
            active={editor.isActive("heading", { level: 2 })}
            disabled={disabled}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            Heading
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("bulletList")}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            Bullets
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("orderedList")}
            disabled={disabled}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            Numbers
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: "left" })}
            disabled={disabled}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          >
            Left
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive({ textAlign: "center" })}
            disabled={disabled}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          >
            Center
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("link")}
            disabled={disabled}
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            Remove link
          </ToolbarButton>
          <Button
            className="ml-auto"
            disabled={disabled}
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }
            size="sm"
            type="button"
            variant="ghost"
          >
            Clear formatting
          </Button>
        </div>
        <EditorContent editor={editor} />
      </div>
      {error ? <p className="mt-2 text-red-600 text-sm">{error}</p> : null}
    </div>
  );
}
