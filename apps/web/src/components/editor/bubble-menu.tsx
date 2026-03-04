"use client";

import { EditorBubble, useEditor } from "novel";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

export function BubbleMenu() {
  return (
    <EditorBubble
      tippyOptions={{ placement: "top" }}
      className="flex items-center overflow-hidden rounded-lg border border-muted bg-background shadow-lg"
    >
      <NodeSelector />
      <div className="h-6 w-px bg-border" />
      <TextFormatButtons />
    </EditorBubble>
  );
}

const NODE_TYPES = [
  { name: "Text", value: "paragraph" },
  { name: "Heading 1", value: "heading-1" },
  { name: "Heading 2", value: "heading-2" },
  { name: "Heading 3", value: "heading-3" },
  { name: "Quote", value: "blockquote" },
] as const;

function NodeSelector() {
  const { editor } = useEditor();
  const [open, setOpen] = useState(false);

  if (!editor) return null;

  function getActiveNodeName() {
    if (!editor) return "Text";
    if (editor.isActive("heading", { level: 1 })) return "Heading 1";
    if (editor.isActive("heading", { level: 2 })) return "Heading 2";
    if (editor.isActive("heading", { level: 3 })) return "Heading 3";
    if (editor.isActive("blockquote")) return "Quote";
    return "Text";
  }

  function handleSelect(value: string) {
    if (!editor) return;

    switch (value) {
      case "paragraph":
        editor.chain().focus().setParagraph().run();
        break;
      case "heading-1":
        editor.chain().focus().setHeading({ level: 1 }).run();
        break;
      case "heading-2":
        editor.chain().focus().setHeading({ level: 2 }).run();
        break;
      case "heading-3":
        editor.chain().focus().setHeading({ level: 3 }).run();
        break;
      case "blockquote":
        editor.chain().focus().toggleBlockquote().run();
        break;
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-2 text-sm hover:bg-accent"
      >
        <span>{getActiveNodeName()}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-md border border-muted bg-background py-1 shadow-lg">
          {NODE_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleSelect(type.value)}
              className="flex w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
            >
              {type.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface FormatButton {
  name: string;
  icon: LucideIcon;
  mark: string;
  action: () => void;
}

function TextFormatButtons() {
  const { editor } = useEditor();

  if (!editor) return null;

  const formats: FormatButton[] = [
    {
      name: "Bold",
      icon: Bold,
      mark: "bold",
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      name: "Italic",
      icon: Italic,
      mark: "italic",
      action: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      name: "Underline",
      icon: Underline,
      mark: "underline",
      action: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      name: "Strikethrough",
      icon: Strikethrough,
      mark: "strike",
      action: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      name: "Code",
      icon: Code,
      mark: "code",
      action: () => editor.chain().focus().toggleCode().run(),
    },
  ];

  return (
    <div className="flex items-center">
      {formats.map(({ name, icon: Icon, mark, action }) => (
        <button
          key={name}
          type="button"
          onClick={action}
          className={`p-2 hover:bg-accent ${
            editor.isActive(mark) ? "bg-accent text-accent-foreground" : ""
          }`}
          title={name}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
