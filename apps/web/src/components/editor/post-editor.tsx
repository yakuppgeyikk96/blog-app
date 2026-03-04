"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorCommandList,
  handleCommandNavigation,
  type EditorInstance,
  type JSONContent,
} from "novel";
import { useDebouncedCallback } from "use-debounce";
import type { PostResponseDto, UpdatePostInput } from "@repo/shared-types";
import { api } from "@/lib/api";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defaultExtensions } from "./extensions";
import { slashCommand, suggestionItems } from "./slash-command";
import { BubbleMenu } from "./bubble-menu";
import { PostPreviewDialog } from "./post-preview-dialog";

const extensions = [...defaultExtensions, slashCommand];

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface PostEditorProps {
  postId: string;
}

export function PostEditor({ postId }: PostEditorProps) {
  const [post, setPost] = useState<PostResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [title, setTitle] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const editorRef = useRef<EditorInstance | null>(null);

  useEffect(() => {
    api<{ data: { post: PostResponseDto } }>(`/posts/${postId}`)
      .then((res) => {
        setPost(res.data.post);
        setTitle(res.data.post.title);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [postId]);

  const save = useCallback(
    async (input: UpdatePostInput) => {
      setSaveStatus("saving");
      try {
        await api(`/posts/${postId}`, {
          method: "PUT",
          body: JSON.stringify(input),
        });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    },
    [postId],
  );

  const debouncedSaveTitle = useDebouncedCallback((value: string) => {
    save({ title: value });
  }, 1000);

  const debouncedSaveContent = useDebouncedCallback(
    (editor: EditorInstance) => {
      save({ content: editor.getHTML() });
    },
    1500,
  );

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setTitle(value);
    debouncedSaveTitle(value);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      editorRef.current?.commands.focus();
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-2/3 rounded bg-muted" />
          <div className="h-64 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <p className="text-destructive">{error ?? "Post not found"}</p>
      </div>
    );
  }

  const initialContent = htmlToInitialContent(post.content);

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="mb-4 flex items-center gap-3">
        <SaveStatusIndicator status={saveStatus} />
        <div className="ml-auto" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPreviewContent(editorRef.current?.getHTML() ?? "");
            setPreviewOpen(true);
          }}
        >
          <Eye className="mr-1.5 size-4" />
          Preview
        </Button>
      </div>

      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        onKeyDown={handleTitleKeyDown}
        placeholder="Untitled"
        className="w-full border-none bg-transparent text-4xl font-bold tracking-tight placeholder:text-muted-foreground focus:outline-none"
      />

      <div className="mt-6">
        <EditorRoot>
          <EditorContent
            initialContent={initialContent}
            extensions={extensions}
            editorProps={{
              handleDOMEvents: {
                keydown: (_view, event) => handleCommandNavigation(event),
              },
              transformPastedHTML(html) {
                return html
                  .replace(
                    /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi,
                    "<p>$1</p>",
                  )
                  .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "<p>$1</p>");
              },
              attributes: {
                class:
                  "prose prose-lg dark:prose-invert focus:outline-none max-w-full",
              },
            }}
            onCreate={({ editor }) => {
              editorRef.current = editor;
            }}
            onUpdate={({ editor }) => {
              debouncedSaveContent(editor);
            }}
          >
            <BubbleMenu />
            <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
              <EditorCommandEmpty className="px-2 text-muted-foreground">
                No results
              </EditorCommandEmpty>
              <EditorCommandList>
                {suggestionItems.map((item) => (
                  <EditorCommandItem
                    value={item.title}
                    onCommand={(val) => item.command?.(val)}
                    className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent"
                    key={item.title}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </EditorCommandItem>
                ))}
              </EditorCommandList>
            </EditorCommand>
          </EditorContent>
        </EditorRoot>
      </div>
      <PostPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={title}
        content={previewContent}
      />
    </div>
  );
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  return (
    <span className="flex items-center gap-1.5 text-sm">
      {status === "saving" && (
        <span className="text-muted-foreground">Saving...</span>
      )}
      {status === "saved" && (
        <>
          <svg
            className="size-4 text-green-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M4 12l6 6L20 6"
              className="animate-[draw-check_0.3s_ease-out_forwards]"
              style={{
                strokeDasharray: 24,
                strokeDashoffset: 24,
              }}
            />
          </svg>
          <span className="text-muted-foreground">Saved</span>
        </>
      )}
      {status === "error" && (
        <span className="text-destructive">Save failed</span>
      )}
    </span>
  );
}

function htmlToInitialContent(html: string): JSONContent | undefined {
  if (!html || html === "<p></p>") return undefined;

  // Tiptap's EditorProvider accepts HTML strings as content,
  // but Novel's TypeScript types restrict initialContent to JSONContent.
  // The underlying tiptap core handles the conversion internally.
  return html as unknown as JSONContent;
}
