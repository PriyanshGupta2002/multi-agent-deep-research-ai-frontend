"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { Bot, Check, Copy, RotateCw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  ConversationCitation,
  ConversationMessage as ConversationMessageRecord,
  ConversationUsage,
} from "@/features/research/api/conversations-api";

function getPlainText(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(getPlainText).join("");
  if (isValidElement<{ children?: ReactNode }>(value)) {
    return getPlainText(value.props.children);
  }
  return "";
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setCopyError(false);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
  }

  return (
    <Button
      aria-label={copyError ? "Copy failed" : copied ? "Copied" : label}
      className="h-7 px-2 text-[11px]"
      onClick={() => void copy()}
      title={copyError ? "Clipboard access is unavailable" : label}
      variant="ghost"
    >
      {copyError ? null : copied ? (
        <Check className="size-3" />
      ) : (
        <Copy className="size-3" />
      )}
      {copyError ? "Copy failed" : copied ? "Copied" : label}
    </Button>
  );
}

function CitationReference({
  citation,
  citationKey,
}: {
  citation: ConversationCitation;
  citationKey: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
    above: boolean;
  } | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  let externalUrl: string | null = null;
  if (citation.url) {
    try {
      const url = new URL(citation.url);
      if (url.protocol === "https:" || url.protocol === "http:") {
        externalUrl = url.toString();
      }
    } catch {
      externalUrl = null;
    }
  }
  function showSourceCard(element: HTMLElement) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const bounds = element.getBoundingClientRect();
    const drawerBounds = element
      .closest<HTMLElement>("[data-chat-presentation='drawer']")
      ?.getBoundingClientRect();
    const viewportLeft = Math.max(8, drawerBounds?.left ?? 8);
    const viewportRight = Math.min(
      window.innerWidth - 8,
      drawerBounds?.right ?? window.innerWidth - 8,
    );
    const cardWidth = Math.max(0, Math.min(288, viewportRight - viewportLeft));
    const left = Math.max(
      viewportLeft,
      Math.min(bounds.left, viewportRight - cardWidth),
    );
    const above =
      window.innerHeight - bounds.bottom < 190 && bounds.top > 120;
    const top = above
      ? bounds.top - 8
      : Math.min(bounds.bottom + 8, window.innerHeight - 8);
    const availableHeight = above
      ? top - 8
      : window.innerHeight - top - 8;
    setPosition({
      left,
      top,
      width: cardWidth,
      maxHeight: Math.max(80, Math.min(256, availableHeight)),
      above,
    });
    setOpen(true);
  }

  function closeSourceCard() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <span
      className="relative mx-0.5 inline-flex align-baseline"
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        const sourceCard = document.getElementById(
          `citation-card-${citationKey}`,
        );
        if (
          !(nextTarget instanceof Node) ||
          (!event.currentTarget.contains(nextTarget) &&
            !sourceCard?.contains(nextTarget))
        ) {
          closeSourceCard();
        }
      }}
      onFocusCapture={(event) => {
        if (
          event.target instanceof HTMLElement &&
          event.target.matches(":focus-visible")
        ) {
          showSourceCard(event.currentTarget);
        }
      }}
      onMouseEnter={(event) => showSourceCard(event.currentTarget)}
      onMouseMove={(event) => {
        if (!open) showSourceCard(event.currentTarget);
      }}
      onMouseLeave={closeSourceCard}
    >
      <button
        aria-describedby={open ? `citation-card-${citationKey}` : undefined}
        aria-expanded={open}
        aria-label={`Show source ${citation.number}`}
        className="inline-flex min-w-5 cursor-pointer items-center justify-center rounded border border-primary/25 bg-primary/5 px-1 text-[10px] font-semibold leading-4 text-primary hover:bg-primary/10"
        type="button"
      >
        {citation.number}
      </button>
      {open &&
        position &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            id={`citation-card-${citationKey}`}
            className="fixed z-[80] block overflow-y-auto rounded-lg border bg-popover p-3 text-left text-popover-foreground shadow-lg"
            onMouseEnter={() => {
              if (closeTimer.current) clearTimeout(closeTimer.current);
            }}
            onMouseLeave={closeSourceCard}
            role="dialog"
            style={{
              left: position.left,
              top: position.top,
              width: position.width,
              maxHeight: `min(${position.maxHeight}px, 45dvh)`,
              transform: position.above ? "translateY(-100%)" : undefined,
            }}
          >
            {citation.title && (
              <span className="block text-xs font-semibold leading-5">
                {citation.title}
              </span>
            )}
            {citation.url && externalUrl ? (
              <a
                className="mt-1 block break-all text-[11px] leading-4 text-primary underline underline-offset-2"
                href={externalUrl}
                rel="noreferrer"
                target="_blank"
              >
                {citation.url}
              </a>
            ) : citation.url ? (
              <span className="mt-1 block break-all text-[11px] leading-4 text-muted-foreground">
                {citation.url}
              </span>
            ) : null}
            {citation.research_id && (
              <span className="mt-2 block break-all text-[10px] text-muted-foreground">
                Research ID: {citation.research_id}
              </span>
            )}
            {!citation.title && !citation.url && !citation.research_id && (
              <span className="text-xs text-muted-foreground">
                No source details were returned.
              </span>
            )}
          </span>,
          document.body,
        )}
    </span>
  );
}

function transformCitationText(
  children: ReactNode,
  citations: Map<number, ConversationCitation>,
  messageId: string,
): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") {
      return child.split(/(\[\d+\])/g).map((part, index) => {
        const match = /^\[(\d+)\]$/.exec(part);
        const citation = match ? citations.get(Number(match[1])) : undefined;
        return citation ? (
          <CitationReference
            citation={citation}
            citationKey={`${messageId}-${citation.number}`}
            key={`${citation.number}-${index}`}
          />
        ) : (
          part
        );
      });
    }
    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children) {
      return cloneElement(
        child,
        undefined,
        transformCitationText(
          child.props.children,
          citations,
          messageId,
        ),
      );
    }
    return child;
  });
}

function MessageMetadata({ value }: { value: ConversationUsage | null }) {
  if (!value) return null;
  const parts = [
    value.input_tokens !== undefined && value.input_tokens !== null
      ? `Input ${value.input_tokens}`
      : null,
    value.output_tokens !== undefined && value.output_tokens !== null
      ? `Output ${value.output_tokens}`
      : null,
    value.total_tokens !== undefined && value.total_tokens !== null
      ? `Total ${value.total_tokens}`
      : null,
  ].filter((part): part is string => Boolean(part));
  if (parts.length === 0) return null;
  return (
    <span className="text-[10px] text-muted-foreground">
      {parts.join(" · ")}
    </span>
  );
}

function CodeBlock({ children }: { children: ReactNode }) {
  const code = getPlainText(children).replace(/\n$/, "");
  return (
    <div className="my-4 overflow-hidden rounded-lg border bg-muted/50">
      <div className="flex items-center justify-between border-b px-2 py-1">
        <span className="text-[10px] text-muted-foreground">Code</span>
        <CopyButton label="Copy code" value={code} />
      </div>
      <pre className="workspace-scrollbar overflow-x-auto px-3 py-3 text-xs leading-5">
        {children}
      </pre>
    </div>
  );
}

export function ChatMessage({
  message,
  onRetry,
}: {
  message: ConversationMessageRecord;
  onRetry?: (content: string) => void;
}) {
  const isAssistant = message.role === "assistant";
  const citationMap = useMemo(
    () => new Map(message.citations.map((citation) => [citation.number, citation])),
    [message.citations],
  );
  const [visibleContent, setVisibleContent] = useState(message.content);
  useEffect(() => {
    if (visibleContent.length >= message.content.length) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const remaining = message.content.length - visibleContent.length;
    const step = remaining > 80 ? 8 : remaining > 15 ? 3 : 1;
    const timeout = window.setTimeout(
      () => {
        setVisibleContent((current) => {
          if (reduceMotion) return message.content;
          return message.content.slice(
            0,
            Math.min(message.content.length, current.length + step),
          );
        });
      },
      reduceMotion ? 0 : remaining > 80 ? 20 : 24,
    );
    return () => window.clearTimeout(timeout);
  }, [message.content, visibleContent]);
  const components = useMemo<Components>(() => {
    const renderCitations = (children: ReactNode) =>
      transformCitationText(children, citationMap, message.id);
    return {
      p: ({ children }) => (
        <p className="my-2 break-words leading-6">{renderCitations(children)}</p>
      ),
      li: ({ children }) => (
        <li className="my-1 leading-6">{renderCitations(children)}</li>
      ),
      h1: ({ children }) => (
        <h1 className="mb-2 mt-5 text-lg font-semibold">{renderCitations(children)}</h1>
      ),
      h2: ({ children }) => (
        <h2 className="mb-2 mt-5 text-base font-semibold">{renderCitations(children)}</h2>
      ),
      h3: ({ children }) => (
        <h3 className="mb-2 mt-4 text-sm font-semibold">{renderCitations(children)}</h3>
      ),
      a: ({ href, children }) => {
        const citationNumber = /^\[?(\d+)\]?$/.exec(
          getPlainText(children).trim(),
        );
        const citation = citationNumber
          ? citationMap.get(Number(citationNumber[1]))
          : undefined;
        if (citation) {
          const citationKey = `${message.id}-${citation.number}`;
          return (
            <CitationReference
              citation={citation}
              citationKey={citationKey}
            />
          );
        }

        return (
          <a
            className="text-primary underline underline-offset-2"
            href={href}
            rel={href?.startsWith("http") ? "noreferrer" : undefined}
            target={href?.startsWith("http") ? "_blank" : undefined}
          >
            {children}
          </a>
        );
      },
      pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
      code: ({ children, className }) => (
        <code className={`${className ?? ""} rounded bg-muted px-1 py-0.5 text-[0.9em]`}>
          {children}
        </code>
      ),
    };
  }, [citationMap, message.id]);
  const metadata = message.message_metadata;
  const usage = metadata?.usage ?? null;
  const isTyping =
    isAssistant && visibleContent.length < message.content.length;

  return (
    <article
      aria-label={isAssistant ? "Assistant message" : "Your message"}
      className={`group flex gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}
    >
      <div
        className={`mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border ${
          isAssistant
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isAssistant ? (
          <Bot className="size-3.5" />
        ) : (
          <UserRound className="size-3.5" />
        )}
      </div>
      <div className={`min-w-0 max-w-[88%] ${isAssistant ? "" : "text-right"}`}>
        <div
          className={`inline-block rounded-2xl px-3.5 py-2.5 text-left text-sm ${
            isAssistant
              ? "rounded-tl-sm border bg-card"
              : "rounded-tr-sm bg-primary text-primary-foreground"
          }`}
        >
          {isAssistant ? (
            <div className="chat-markdown">
              <ReactMarkdown components={components}>
                {visibleContent}
              </ReactMarkdown>
              {(message.stream_state === "streaming" || isTyping) && (
                <span
                  aria-label="Response is being written"
                  className="ml-1 inline-block h-4 w-1 animate-pulse rounded-sm bg-primary align-middle"
                  role="status"
                />
              )}
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words leading-6">
              {message.content}
            </p>
          )}
        </div>
        {isAssistant && message.stream_state === "error" && (
          <div
            className="mt-2 rounded-md border border-destructive/25 bg-destructive/5 p-2 text-left text-xs text-destructive"
            role="alert"
          >
            <p>{message.stream_error ?? "The response did not complete."}</p>
            {message.retry_content && onRetry && (
              <Button
                className="mt-1 h-7 px-2 text-xs"
                onClick={() => onRetry(message.retry_content!)}
                variant="ghost"
              >
                <RotateCw className="size-3" />
                Retry
              </Button>
            )}
          </div>
        )}
        {isAssistant &&
          message.stream_state === "complete" &&
          (metadata?.model ||
            usage ||
            typeof metadata?.cost === "number" ||
            metadata?.cost_details) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 px-1">
              {metadata?.model && (
                <span className="text-[10px] text-muted-foreground">
                  {metadata.model}
                </span>
              )}
              <MessageMetadata value={usage} />
              {metadata?.cost !== undefined && metadata.cost !== null && (
                <span className="text-[10px] text-muted-foreground">
                  Cost {metadata.cost}
                </span>
              )}
              {metadata?.cost_details && (
                <span
                  className="text-[10px] text-muted-foreground"
                  title={JSON.stringify(metadata.cost_details)}
                >
                  Cost details
                </span>
              )}
            </div>
          )}
        {isAssistant &&
          message.stream_state === "complete" &&
          message.content && (
            <div className="mt-1 px-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <CopyButton label="Copy answer" value={message.content} />
            </div>
          )}
      </div>
    </article>
  );
}
