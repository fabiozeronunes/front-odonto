import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "code", "pre",
  "table", "thead", "tbody", "tr", "th", "td",
];

const ALLOWED_ATTRS = {
  a: ["href", "title", "target", "rel"],
};

export function sanitize(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRS,
    disallowedTagsMode: "discard",
  });
}

export function sanitizeOrNull(dirty: string | null | undefined): string | null {
  if (!dirty) return null;
  return sanitize(dirty);
}
