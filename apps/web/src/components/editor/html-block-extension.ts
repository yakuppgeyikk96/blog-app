import { Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { HtmlBlockView } from "./html-block-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    htmlBlock: {
      setHtmlBlock: (attrs?: { content?: string }) => ReturnType;
    };
  }
}

export const HtmlBlock = Node.create({
  name: "htmlBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      content: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="html-block"]',
        getAttrs: (dom) => ({
          content: (dom as HTMLElement).innerHTML,
        }),
      },
    ];
  },

  renderHTML({ node }) {
    const el = document.createElement("div");
    el.setAttribute("data-type", "html-block");
    el.innerHTML = node.attrs.content || "";
    return el;
  },

  addCommands() {
    return {
      setHtmlBlock:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { content: attrs?.content || "" },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(HtmlBlockView);
  },
});
