import sanitizeHtml from "sanitize-html";

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    // Block
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "blockquote", "pre", "div", "hr", "br",
    // Lists
    "ul", "ol", "li",
    // Inline
    "a", "b", "strong", "i", "em", "u", "s", "code", "mark",
    "sub", "sup", "span", "small",
    // Media
    "img", "figure", "figcaption",
    // Table
    "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow" }),
  },
};

export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, sanitizeOptions);
}
