function stripInlineMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\[[^\]]*\]/g, "$1")
    .replace(/`+([^`]+)`+/g, "$1")
    .replace(/(\*\*|__|~~)(.*?)\1/g, "$2")
    .replace(/(^|\s)#{1,6}[ \t]+(?=\S)/g, "$1")
    .replace(/\s+#{1,6}\s*$/g, "")
    .replace(/(^|\s)(?:\*{3,}|_{3,}|-{3,})(?=\s|$)/g, "$1")
    .replace(/(?<!\w)[*_]|[*_](?!\w)/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\\([\\`*_{}[\]()#+.!>~-])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSavedReportExcerpt(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let inCodeFence = false;
  let headingCount = 0;

  const flushParagraph = () => {
    const text = stripInlineMarkdown(paragraph.join(" "));
    if (text) blocks.push(text);
    paragraph = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (/^(```|~~~)/.test(trimmed)) {
      flushParagraph();
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const heading = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (heading) {
      flushParagraph();
      if (headingCount < 2) {
        const text = stripInlineMarkdown(heading[1]);
        if (text) {
          blocks.push(text);
          headingCount += 1;
        }
      }
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      continue;
    }
    if (/^(\*\s*){3,}$|^(-\s*){3,}$|^(_\s*){3,}$/.test(trimmed)) {
      flushParagraph();
      continue;
    }
    if (/^\[[^\]]+\]:\s*\S+/.test(trimmed) || trimmed.startsWith("|")) {
      flushParagraph();
      continue;
    }

    const listItem = trimmed.match(/^(?:[-*+]|\d+[.)])\s+(.+)$/);
    if (listItem) {
      flushParagraph();
      const text = stripInlineMarkdown(listItem[1]);
      if (text) blocks.push(text);
      continue;
    }

    paragraph.push(trimmed.replace(/^\s*>\s?/, ""));
  }
  flushParagraph();

  const text = blocks.join(" ").replace(/\s+/g, " ").trim();
  const maxLength = 280;
  if (text.length <= maxLength) return text;

  const previousBoundary = text.lastIndexOf(" ", maxLength);
  const nextBoundary = text.indexOf(" ", maxLength);
  const wordBoundary =
    previousBoundary > maxLength * 0.75
      ? previousBoundary
      : nextBoundary === -1
        ? text.length
        : nextBoundary;
  return `${text.slice(0, wordBoundary).trimEnd()}…`;
}
