const DANGEROUS_TAGS = /<\s*\/?\s*(script|iframe|object|embed|form|input|textarea|button|link|meta|base)\b[^>]*>/gi;
const DANGEROUS_ATTRS = /\s+(on\w+|style)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const HTML_COMMENTS = /<!--[\s\S]*?-->/g;
const JAVASCRIPT_URLS = /href\s*=\s*["']?\s*javascript:/gi;
const DATA_URLS_SRC = /src\s*=\s*["']?\s*data:/gi;

export function sanitize(dirty: string): string {
  return dirty
    .replace(HTML_COMMENTS, "")
    .replace(DANGEROUS_TAGS, "")
    .replace(DANGEROUS_ATTRS, "")
    .replace(JAVASCRIPT_URLS, 'href="about:blank"')
    .replace(DATA_URLS_SRC, 'src="about:blank"');
}

export function sanitizeOrNull(dirty: string | null | undefined): string | null {
  if (!dirty) return null;
  return sanitize(dirty);
}
