import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

function getCompactMarkdownExcerpt(markdown: string) {
  const blocks = markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const isHeading = (block: string) =>
    /^#{1,6}\s/.test(block) || /(?:^|\n)(?:=+|-+)\s*$/.test(block);
  const isList = (block: string) =>
    /^\s*(?:[-*+]|\d+[.)])\s+/m.test(block);
  const isTable = (block: string) =>
    /^\s*\|.+\|\s*\n\s*\|[\s:|-]+\|\s*$/m.test(block);
  const atxHeading = blocks.find((block) => /^#{1,6}\s/.test(block));
  const heading =
    atxHeading?.split("\n", 1)[0].trim() ?? blocks.find(isHeading);
  const contentBlocks = blocks.flatMap((block) => {
    if (block !== atxHeading) return [block];
    const remaining = block.split("\n").slice(1).join("\n").trim();
    return remaining ? [remaining] : [];
  });
  const paragraph = contentBlocks.find(
    (block) =>
      !isHeading(block) &&
      !isList(block) &&
      !isTable(block) &&
      !/^(```|~~~)/.test(block) &&
      !/^---+\s*$/.test(block),
  );
  const list = contentBlocks.find(isList);
  const listItem = list
    ?.split("\n")
    .find((line) => /^\s*(?:[-*+]|\d+[.)])\s+/.test(line));
  const excerpt = paragraph ?? listItem;

  return [heading, excerpt]
    .filter((block): block is string => Boolean(block))
    .join("\n\n");
}

export function ReportMarkdown({
  markdown,
  compact = false,
}: {
  markdown: string;
  compact?: boolean;
}) {
  const renderedMarkdown = compact
    ? getCompactMarkdownExcerpt(markdown)
    : markdown;
  const compactHeadingClass =
    "mb-1 mt-0 line-clamp-1 break-words text-xs font-semibold leading-4 tracking-tight text-foreground";
  const compactTableClass =
    "w-full table-fixed border-collapse text-left text-xs";

  const components: Components = {
    ...(compact
      ? {
          h1: ({ children }) => (
            <h1 className={compactHeadingClass}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className={compactHeadingClass}>{children}</h2>
          ),
          h4: ({ children }) => (
            <h4 className={compactHeadingClass}>{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className={compactHeadingClass}>{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className={compactHeadingClass}>{children}</h6>
          ),
        }
      : {}),
    a: ({ href, children }) => {
      const external =
        href?.startsWith("http://") || href?.startsWith("https://");

      return (
        <a
          className={`text-primary underline underline-offset-4${compact ? " break-words" : ""}`}
          href={href}
          rel={external ? "noreferrer" : undefined}
          target={external ? "_blank" : undefined}
        >
          {children}
        </a>
      );
    },
    h3: ({ children }) => (
      <h3
        className={
          compact
            ? compactHeadingClass
            : "mb-3 mt-8 text-lg font-semibold tracking-tight text-foreground"
        }
      >
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p
        className={
          compact
            ? "mb-0 line-clamp-4 break-words text-xs leading-5 text-muted-foreground"
            : "mb-5 text-[15px] leading-7 text-foreground/85"
        }
      >
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul
        className={
          compact
            ? "mb-1.5 list-disc space-y-0.5 pl-4 text-xs leading-5 text-muted-foreground marker:text-muted-foreground"
            : "mb-5 list-disc space-y-2 pl-6 text-[15px] leading-7 text-foreground/85 marker:text-muted-foreground"
        }
      >
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol
        className={
          compact
            ? "mb-1.5 list-decimal space-y-0.5 pl-4 text-xs leading-5 text-muted-foreground marker:font-medium marker:text-muted-foreground"
            : "mb-5 list-decimal space-y-2 pl-6 text-[15px] leading-7 text-foreground/85 marker:font-medium marker:text-muted-foreground"
        }
      >
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li
        className={compact ? "line-clamp-4 break-words" : undefined}
      >
        {children}
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote
        className={
          compact
            ? "my-1 border-l-2 pl-2 text-xs italic leading-5 text-muted-foreground"
            : "my-6 border-l-2 pl-4 text-[15px] italic leading-7 text-muted-foreground"
        }
      >
        {children}
      </blockquote>
    ),
    table: ({ children }) =>
      compact ? (
        <div className="mb-1 overflow-hidden rounded border">
          <table className={compactTableClass}>{children}</table>
        </div>
      ) : (
        <div className="mb-6 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            {children}
          </table>
        </div>
      ),
    thead: ({ children }) => (
      <thead
        className={
          compact
            ? "bg-muted/70 text-[10px] font-semibold"
            : "bg-muted/70 text-xs font-semibold"
        }
      >
        {children}
      </thead>
    ),
    th: ({ children }) => (
      <th
        className={
          compact
            ? "break-words border-b px-1.5 py-1 align-top"
            : "border-b px-3 py-2.5 align-top"
        }
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td
        className={
          compact
            ? "border-b px-1.5 py-1 align-top text-[10px] leading-4 text-foreground/80 break-words"
            : "border-b px-3 py-2.5 align-top text-[13px] leading-5 text-foreground/80"
        }
      >
        {children}
      </td>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code
        className={
          compact
            ? "break-words rounded bg-muted px-1 py-0.5 text-[10px]"
            : undefined
        }
      >
        {children}
      </code>
    ),
  };

  return <ReactMarkdown components={components}>{renderedMarkdown}</ReactMarkdown>;
}
