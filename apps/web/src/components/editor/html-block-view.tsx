"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Code, Eye } from "lucide-react";
import { useState } from "react";

export function HtmlBlockView({ node, updateAttributes }: NodeViewProps) {
  const content = (node.attrs.content as string) || "";
  const [editing, setEditing] = useState(!content);

  return (
    <NodeViewWrapper data-type="html-block" className="my-4">
      <div className="overflow-hidden rounded-lg border border-muted">
        <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
          <span>HTML Block</span>
          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-1 rounded px-2 py-0.5 hover:bg-accent"
          >
            {editing ? (
              <Eye className="h-3 w-3" />
            ) : (
              <Code className="h-3 w-3" />
            )}
            {editing ? "Preview" : "Edit"}
          </button>
        </div>

        {editing ? (
          <textarea
            value={content}
            onChange={(e) => updateAttributes({ content: e.target.value })}
            placeholder='<img src="..." alt="..." />'
            className="w-full min-h-[100px] resize-y bg-muted/30 p-3 font-mono text-sm focus:outline-none"
            spellCheck={false}
          />
        ) : content ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-full p-3"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="p-3 text-sm text-muted-foreground">
            Empty HTML block — click Edit to add content
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
