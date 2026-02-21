/**
 * HTML Sanitizer for document content.
 * Strips dangerous elements/attributes while keeping structural tags.
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "div", "span",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "strike",
  "ul", "ol", "li",
  "table", "thead", "tbody", "tfoot", "tr", "td", "th",
  "a", "img",
  "blockquote", "pre", "code", "hr",
  "font", "sup", "sub",
]);

const ALLOWED_ATTRS = new Set([
  "style", "class", "href", "src", "alt", "colspan", "rowspan",
  "align", "valign", "width", "height", "border",
  "cellpadding", "cellspacing", "face", "size", "color",
]);

const DANGEROUS_STYLE_PATTERNS = [
  /expression\s*\(/gi,
  /javascript\s*:/gi,
  /url\s*\(\s*['"]?\s*javascript:/gi,
  /behavior\s*:/gi,
  /-moz-binding/gi,
];

export function sanitizeHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  sanitizeNode(doc.body);
  return doc.body.innerHTML;
}

function sanitizeNode(node: Node): void {
  const toRemove: Node[] = [];

  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();

      // Remove disallowed tags entirely (script, iframe, object, etc.)
      if (!ALLOWED_TAGS.has(tag)) {
        // Keep text content, remove the element wrapper
        if (tag === "script" || tag === "iframe" || tag === "object" || tag === "embed" || tag === "link") {
          toRemove.push(child);
          return;
        }
        // For other tags, unwrap (keep children)
        const fragment = document.createDocumentFragment();
        while (el.firstChild) fragment.appendChild(el.firstChild);
        node.replaceChild(fragment, child);
        return;
      }

      // Remove disallowed attributes
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) {
          el.removeAttribute(attr.name);
        } else if (!ALLOWED_ATTRS.has(name)) {
          el.removeAttribute(attr.name);
        } else if (name === "style") {
          let styleVal = attr.value;
          for (const pattern of DANGEROUS_STYLE_PATTERNS) {
            styleVal = styleVal.replace(pattern, "");
          }
          el.setAttribute("style", styleVal);
        } else if (name === "href" || name === "src") {
          const val = attr.value.trim().toLowerCase();
          if (val.startsWith("javascript:") || val.startsWith("data:text/html")) {
            el.removeAttribute(attr.name);
          }
        }
      }

      sanitizeNode(child);
    }
  });

  for (const n of toRemove) {
    node.removeChild(n);
  }
}
