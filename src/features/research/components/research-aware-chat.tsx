"use client";

import {
  ArrowUp,
  Bot,
  CircleAlert,
  LoaderCircle,
  MessageSquareText,
  Plus,
  X,
} from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/components/ui/button";
import { authUserQueryKey } from "@/features/auth/hooks/use-auth";
import {
  normalizeConversationUsage,
  normalizeConversationCitations,
  conversationsApi,
  type ConversationMessage,
  type ConversationRecord,
  type ConversationScope,
  type ConversationStreamEvent,
} from "@/features/research/api/conversations-api";
import { ChatMessage } from "@/features/research/components/chat-message";
import {
  conversationMessagesQueryKey,
  conversationQueryKey,
  conversationsQueryKey,
  useConversation,
  useConversationMessages,
  useConversations,
  useCreateConversation,
  useResearchConversation,
} from "@/features/research/hooks/use-conversations";
import {
  useResearchDetail,
  useResearchReport,
} from "@/features/research/hooks/use-researches";
import { getResearchErrorMessage } from "@/features/research/research-errors";
import { ApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

const researchSuggestions = [
  "Summarize the most important findings.",
  "What evidence supports the main conclusion?",
  "What limitations or open questions remain?",
];

const workspaceSuggestions = [
  "Compare the key findings across my recent reports.",
  "What themes appear across my research?",
  "Which reports discuss a related topic?",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function field(data: unknown, key: string): unknown {
  return isRecord(data) ? data[key] : undefined;
}

function getChatError(error: unknown) {
  return getResearchErrorMessage(
    error,
    "Something went wrong. Please try again.",
  );
}

function ChatSidebar({
  conversations,
  activeId,
  isLoading,
  error,
  onSelect,
  onCreate,
  isCreating,
  onRetry,
}: {
  conversations: ConversationRecord[];
  activeId: string | null;
  isLoading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  isCreating: boolean;
  onRetry: () => void;
}) {
  return (
    <aside className="flex min-h-0 flex-col border-b bg-card lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div>
          <h2 className="text-xs font-semibold">Conversations</h2>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Workspace scope
          </p>
        </div>
        <Button
          aria-label="Start a new workspace conversation"
          disabled={isCreating}
          onClick={onCreate}
          size="icon-sm"
          title="New conversation"
          variant="outline"
        >
          {isCreating ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
        </Button>
      </div>

      <nav
        aria-label="Workspace conversations"
        className="workspace-scrollbar flex max-h-52 gap-1 overflow-x-auto p-2 lg:max-h-none lg:flex-1 lg:flex-col lg:overflow-y-auto"
      >
        {isLoading ? (
          <p className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
            <LoaderCircle className="size-3.5 animate-spin" />
            Loading conversations…
          </p>
        ) : error ? (
          <div className="p-2 text-xs">
            <p className="text-destructive">{error}</p>
            <Button className="mt-2" onClick={onRetry} size="sm" variant="outline">
              Try again
            </Button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-2 py-3 text-xs leading-5 text-muted-foreground">
            No workspace conversations yet. Start one to explore your completed
            research together.
          </div>
        ) : (
          conversations.map((conversation) => (
            <button
              aria-current={activeId === conversation.id ? "page" : undefined}
              className={cn(
                "min-w-52 rounded-md border border-transparent px-3 py-2 text-left transition-colors hover:bg-muted lg:min-w-0",
                activeId === conversation.id &&
                  "border-border bg-muted text-foreground",
              )}
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              type="button"
            >
              <span className="block truncate text-xs font-medium">
                {conversation.title ?? "Workspace conversation"}
              </span>
              <span className="mt-1 block text-[10px] text-muted-foreground">
                Updated{" "}
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: "medium",
                }).format(new Date(conversation.updated_at))}
              </span>
            </button>
          ))
        )}
      </nav>
    </aside>
  );
}

function EmptyChatState({
  scope,
  onSuggestion,
}: {
  scope: ConversationScope;
  onSuggestion: (value: string) => void;
}) {
  const suggestions =
    scope === "research" ? researchSuggestions : workspaceSuggestions;
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-12 text-center sm:py-16">
      <div className="flex size-11 items-center justify-center rounded-xl border bg-card text-primary">
        <MessageSquareText className="size-5" />
      </div>
      <h2 className="mt-4 text-base font-semibold">Start with a question</h2>
      <p className="mt-1.5 max-w-sm text-xs leading-5 text-muted-foreground">
        {scope === "research"
          ? "Explore the findings, evidence, and limitations in this report."
          : "Ask across recent completed research reports."}
      </p>
      <div className="mt-5 grid w-full gap-2 sm:grid-cols-1">
        {suggestions.map((suggestion) => (
          <button
            className="rounded-lg border bg-card px-3 py-2.5 text-left text-xs leading-5 transition-colors hover:bg-muted"
            key={suggestion}
            onClick={() => onSuggestion(suggestion)}
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  isStreaming,
  onKeyDown,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  disabled: boolean;
  isStreaming: boolean;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <form className="border-t bg-background p-3 sm:p-4" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="research-aware-chat-input">
        Ask a question
      </label>
      <div className="flex items-end gap-2 rounded-xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring/40">
        <textarea
          className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          disabled={disabled}
          id="research-aware-chat-input"
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask a follow-up question…"
          rows={1}
          value={value}
        />
        <Button
          aria-label={isStreaming ? "Generating response" : "Send message"}
          disabled={!value.trim() || disabled || isStreaming}
          size="icon"
          type="submit"
        >
          {isStreaming ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </Button>
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        Enter to send · Shift + Enter for a new line
      </p>
    </form>
  );
}

export function ResearchAwareChat({
  scope,
  researchId,
  presentation = "page",
}: {
  scope: ConversationScope;
  researchId?: string;
  presentation?: "page" | "drawer";
}) {
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [draft, setDraft] = useState("");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [creationError, setCreationError] = useState<string | null>(null);
  const activeStream = useRef<AbortController | null>(null);
  const streamFinished = useRef(false);
  const streamErrorRef = useRef<string | null>(null);
  const autoScroll = useRef(true);
  const messageEnd = useRef<HTMLDivElement>(null);
  const scrollContainer = useRef<HTMLDivElement>(null);

  const researchQuery = useResearchDetail(researchId ?? "");
  const reportQuery = useResearchReport(
    researchId ?? "",
    researchQuery.data?.status,
  );
  const researchReady =
    scope === "research" &&
    researchQuery.data?.status === "completed" &&
    Boolean(reportQuery.data);
  const researchConversation = useResearchConversation(
    researchId ?? "",
    researchReady,
  );
  const conversationsQuery = useConversations("workspace");
  const createConversation = useCreateConversation();
  const workspaceItems = conversationsQuery.data ?? [];
  const selectedWorkspaceConversation =
    workspaceItems.find((item) => item.id === selectedConversationId) ??
    (selectedConversationId
      ? queryClient.getQueryData<ConversationRecord>(
          conversationQueryKey(selectedConversationId),
        )
      : undefined);
  const activeConversation =
    scope === "research"
      ? researchConversation.data
      : (selectedWorkspaceConversation ?? workspaceItems[0]);
  const conversationId = activeConversation?.id ?? null;
  const activeConversationQuery = useConversation(conversationId);
  const displayedConversation =
    activeConversationQuery.data ?? activeConversation;
  const conversationQuery = useConversationMessages(conversationId);
  const cachedMessages = conversationQuery.data ?? [];
  const visibleMessages = cachedMessages;

  useEffect(() => {
    if (!autoScroll.current) return;
    messageEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visibleMessages]);

  useEffect(
    () => () => {
      activeStream.current?.abort();
    },
    [],
  );

  async function createWorkspaceConversation() {
    setCreationError(null);
    try {
      const conversation = await createConversation.mutateAsync({
        scope: "workspace",
      });
      setSelectedConversationId(conversation.id);
    } catch (error) {
      setCreationError(getChatError(error));
    }
  }

  function updateMessages(
    id: string,
    updater: (items: ConversationMessage[]) => ConversationMessage[],
  ) {
    queryClient.setQueryData<ConversationMessage[]>(
      conversationMessagesQueryKey(id),
      (current) => updater(current ?? []),
    );
  }

  function updateMessage(
    id: string,
    messageId: string,
    update: (message: ConversationMessage) => ConversationMessage,
  ) {
    updateMessages(id, (items) =>
      items.map((message) =>
        message.id === messageId ? update(message) : message,
      ),
    );
  }

  async function sendMessage(content: string) {
    const conversation = activeConversation;
    if (
      !conversation ||
      !content.trim() ||
      isStreaming ||
      activeStream.current ||
      conversationQuery.isPending ||
      conversationQuery.isError
    ) {
      return;
    }
    const messageContent = content.trim();
    setDraft("");
    setStreamError(null);
    streamErrorRef.current = null;
    setIsStreaming(true);
    streamFinished.current = false;
    const userLocalId = `local-user-${crypto.randomUUID()}`;
    const assistantLocalId = `local-assistant-${crypto.randomUUID()}`;
    const createdAt = new Date().toISOString();
    updateMessages(conversation.id, (items) => [
      ...items,
      {
        id: userLocalId,
        conversation_id: conversation.id,
        role: "user",
        content: messageContent,
        citations: [],
        message_metadata: null,
        created_at: createdAt,
      },
      {
        id: assistantLocalId,
        conversation_id: conversation.id,
        role: "assistant",
        content: "",
        citations: [],
        message_metadata: null,
        created_at: createdAt,
        stream_state: "streaming",
        retry_content: messageContent,
      },
    ]);

    const controller = new AbortController();
    activeStream.current = controller;
    try {
      await conversationsApi.streamMessage(
        conversation.id,
        messageContent,
        controller.signal,
        (event: ConversationStreamEvent) => {
          if (event.type === "message_start") {
            const userMessageId = field(event.data, "user_message_id");
            if (typeof userMessageId === "string") {
              updateMessage(conversation.id, userLocalId, (message) => ({
                ...message,
                id: userMessageId,
              }));
            }
          } else if (event.type === "token") {
            const token = field(event.data, "content");
            if (typeof token === "string") {
              updateMessage(conversation.id, assistantLocalId, (message) => ({
                ...message,
                content: message.content + token,
              }));
            }
          } else if (event.type === "citations") {
            const items = field(event.data, "items");
            updateMessage(conversation.id, assistantLocalId, (message) => ({
              ...message,
              citations: normalizeConversationCitations(items),
            }));
          } else if (event.type === "usage") {
            updateMessage(conversation.id, assistantLocalId, (message) => ({
              ...message,
              message_metadata: {
                ...message.message_metadata,
                usage: tokenUsage(event.data),
              },
            }));
          } else if (event.type === "cost") {
            const amount = field(event.data, "amount");
            const details = field(event.data, "details");
            updateMessage(conversation.id, assistantLocalId, (message) => ({
              ...message,
              message_metadata: {
                ...message.message_metadata,
                cost: typeof amount === "number" ? amount : null,
                cost_details: isRecord(details) ? details : null,
              },
            }));
          } else if (event.type === "message_complete") {
            const assistantId = field(event.data, "assistant_message_id");
            streamFinished.current = true;
            updateMessage(conversation.id, assistantLocalId, (message) => ({
              ...message,
              id: typeof assistantId === "string" ? assistantId : message.id,
              stream_state: "complete",
              retry_content: undefined,
              stream_error: undefined,
            }));
          } else if (event.type === "error") {
            const message =
              typeof field(event.data, "message") === "string"
                ? (field(event.data, "message") as string)
                : "The assistant could not complete the response.";
            streamErrorRef.current = message;
            setStreamError(message);
            updateMessage(conversation.id, assistantLocalId, (current) => ({
              ...current,
              stream_state: "error",
              stream_error: message,
            }));
          }
        },
      );
      if (!streamFinished.current && !controller.signal.aborted) {
        const message =
          streamErrorRef.current ??
          "The response ended before it was completed.";
        streamErrorRef.current = message;
        setStreamError(message);
        updateMessage(conversation.id, assistantLocalId, (current) => ({
          ...current,
          stream_state: "error",
          stream_error: message,
        }));
      }
      if (streamFinished.current) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: conversationMessagesQueryKey(conversation.id),
          }),
          queryClient.invalidateQueries({
            queryKey: conversationQueryKey(conversation.id),
          }),
          queryClient.invalidateQueries({
            queryKey: conversationsQueryKey(conversation.scope),
          }),
        ]);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        if (error instanceof ApiError && error.status === 401) {
          await queryClient.invalidateQueries({ queryKey: authUserQueryKey });
        }
        const message = getChatError(error);
        streamErrorRef.current = message;
        setStreamError(message);
        updateMessage(conversation.id, assistantLocalId, (current) => ({
          ...current,
          stream_state: "error",
          stream_error: message,
        }));
      }
    } finally {
      if (activeStream.current === controller) activeStream.current = null;
      setIsStreaming(false);
    }
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function handleScroll() {
    const element = scrollContainer.current;
    if (!element) return;
    autoScroll.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 120;
  }

  const loadError =
    scope === "research"
      ? researchQuery.isError
        ? getChatError(researchQuery.error)
        : reportQuery.isError
          ? getChatError(reportQuery.error)
          : researchConversation.isError
            ? getChatError(researchConversation.error)
            : null
      : null;
  const historyError =
    scope === "workspace" && conversationsQuery.isError
      ? getChatError(conversationsQuery.error)
      : null;
  const isContextLoading =
    scope === "research" &&
    (researchQuery.isPending ||
      (researchQuery.data?.status === "completed" && reportQuery.isPending) ||
      (researchReady && researchConversation.isPending));
  const chatIsLoading =
    Boolean(conversationId) && conversationQuery.isPending;
  const chatError = activeConversationQuery.isError
    ? getChatError(activeConversationQuery.error)
    : conversationQuery.isError
      ? getChatError(conversationQuery.error)
      : null;
  const canSend = Boolean(conversationId) && !chatError;

  return (
    <section
      data-chat-presentation={presentation}
      className={
        presentation === "drawer"
          ? "flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-background"
          : "mx-auto flex h-[min(720px,calc(100dvh-8rem))] min-h-[480px] max-w-6xl flex-col overflow-hidden rounded-xl border bg-background shadow-sm"
      }
    >
      {scope === "workspace" ? (
        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)] lg:grid-rows-1">
          <ChatSidebar
            activeId={conversationId}
            conversations={workspaceItems}
            error={historyError}
            isCreating={createConversation.isPending}
            isLoading={conversationsQuery.isPending}
            onCreate={() => void createWorkspaceConversation()}
            onRetry={() => void conversationsQuery.refetch()}
            onSelect={setSelectedConversationId}
          />
          <div className="flex min-h-0 min-w-0 flex-col">
            <ChatHeader
              conversation={displayedConversation}
              presentation={presentation}
              scope={scope}
              researchTitle={null}
            />
            {creationError && (
              <p
                className="border-b border-destructive/25 bg-destructive/5 px-4 py-2 text-xs text-destructive"
                role="alert"
              >
                {creationError}
              </p>
            )}
            {renderChatBody()}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatHeader
            conversation={displayedConversation}
            presentation={presentation}
            scope={scope}
            researchTitle={researchQuery.data?.query ?? null}
          />
          {isContextLoading ? (
            <LoadingState label="Loading research chat…" />
          ) : loadError ? (
            <ChatErrorState
              message={loadError}
              onRetry={() => {
                void researchQuery.refetch();
                if (researchQuery.data?.status === "completed") {
                  void reportQuery.refetch();
                  void researchConversation.refetch();
                }
              }}
            />
          ) : !researchId ? (
            <ChatErrorState
              message="A research ID is required for Research Chat."
            />
          ) : researchQuery.data?.status !== "completed" ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center">
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Research Chat becomes available after this investigation is
                complete and its report is ready.
              </p>
            </div>
          ) : !reportQuery.data ? (
            <LoadingState label="Waiting for the completed research report…" />
          ) : (
            renderChatBody()
          )}
        </div>
      )}
    </section>
  );

  function renderChatBody() {
    return (
      <>
        <div
          className="workspace-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7"
          onScroll={handleScroll}
          ref={scrollContainer}
        >
          {chatError ? (
            <ChatErrorState
              message={chatError}
              onRetry={() => {
                void activeConversationQuery.refetch();
                void conversationQuery.refetch();
              }}
            />
          ) : chatIsLoading ? (
            <LoadingState label="Loading conversation…" />
          ) : !activeConversation ? (
            <EmptyChatState
              onSuggestion={(value) => {
                void createWorkspaceConversation().then(() => setDraft(value));
              }}
              scope={scope}
            />
          ) : visibleMessages.length === 0 ? (
            <EmptyChatState onSuggestion={setDraft} scope={scope} />
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {visibleMessages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onRetry={(content) => void sendMessage(content)}
                />
              ))}
              {streamError && (
                <p className="sr-only" role="status">
                  {streamError}
                </p>
              )}
            </div>
          )}
          <div ref={messageEnd} />
        </div>
        {activeConversation && (
          <ChatInput
            disabled={
              !canSend ||
              conversationQuery.isPending ||
              conversationQuery.isError ||
              isContextLoading
            }
            isStreaming={isStreaming}
            onChange={setDraft}
            onKeyDown={handleInputKeyDown}
            onSubmit={submitMessage}
            value={draft}
          />
        )}
        {!activeConversation && scope === "workspace" && !conversationsQuery.isPending && (
          <div className="border-t bg-background p-3 text-center text-xs text-muted-foreground">
            Start a workspace conversation to ask across completed reports.
            <Button
              className="ml-2"
              disabled={createConversation.isPending}
              onClick={() => void createWorkspaceConversation()}
              size="sm"
              variant="outline"
            >
              <Plus className="size-3.5" />
              New conversation
            </Button>
          </div>
        )}
      </>
    );
  }
}

function ChatHeader({
  conversation,
  scope,
  researchTitle,
  presentation = "page",
}: {
  conversation: ConversationRecord | undefined;
  scope: ConversationScope;
  researchTitle: string | null;
  presentation?: "page" | "drawer";
}) {
  return (
    <header className="flex items-center gap-3 border-b px-4 py-3 sm:px-6">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card text-primary">
        <Bot className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold">
          {presentation === "drawer"
            ? "Ask AI"
            : scope === "research"
              ? researchTitle ?? conversation?.title ?? "Research Chat"
              : conversation?.title ?? "Workspace Chat"}
        </h1>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {presentation === "drawer"
            ? researchTitle ?? "Research-scoped conversation"
            : scope === "research"
              ? "Research-scoped conversation"
              : "Across recent completed research reports"}
        </p>
      </div>
      {presentation === "drawer" ? (
        <Dialog.Close
          aria-label="Close Ask AI drawer"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <X className="size-4" />
        </Dialog.Close>
      ) : (
        <span className="rounded-full border px-2 py-1 text-[10px] text-muted-foreground">
          {scope === "research" ? "Research" : "Workspace"}
        </span>
      )}
    </header>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 items-center justify-center gap-2 p-6 text-sm text-muted-foreground" role="status">
      <LoaderCircle className="size-4 animate-spin" />
      {label}
    </div>
  );
}

function ChatErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <CircleAlert className="size-5 text-destructive" />
      <p className="mt-2 max-w-md text-sm leading-6 text-destructive" role="alert">
        {message}
      </p>
      {onRetry && (
        <Button className="mt-3" onClick={onRetry} size="sm" variant="outline">
          Try again
        </Button>
      )}
    </div>
  );
}

function tokenUsage(value: unknown) {
  return normalizeConversationUsage(value);
}
