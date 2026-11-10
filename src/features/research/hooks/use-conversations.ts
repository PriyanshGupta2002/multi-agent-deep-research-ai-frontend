"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authUserQueryKey } from "@/features/auth/hooks/use-auth";
import {
  conversationsApi,
  type FeedbackRating,
  type MessageFeedback,
  type ConversationMessage,
  type ConversationScope,
} from "@/features/research/api/conversations-api";
import type { ConversationCreateRequest } from "@/features/research/api/conversations-api";
import { ApiError } from "@/lib/api/errors";

export const conversationsQueryKey = (scope?: ConversationScope) =>
  ["conversations", scope ?? "all"] as const;
export const conversationQueryKey = (id: string) =>
  ["conversation", id] as const;
export const conversationMessagesQueryKey = (id: string) =>
  ["conversation", id, "messages"] as const;

async function invalidateAuthOnUnauthorized(
  queryClient: ReturnType<typeof useQueryClient>,
  error: unknown,
) {
  if (error instanceof ApiError && error.status === 401) {
    await queryClient.invalidateQueries({ queryKey: authUserQueryKey });
  }
}

export function useConversations(scope: ConversationScope) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: conversationsQueryKey(scope),
    queryFn: async () => {
      try {
        const conversations = [];
        let page = 1;
        while (true) {
          const result = await conversationsApi.list(scope, page);
          conversations.push(...result.items);
          if (!result.has_next) return conversations;
          page += 1;
        }
      } catch (error) {
        await invalidateAuthOnUnauthorized(queryClient, error);
        throw error;
      }
    },
    staleTime: 30_000,
    retry: (count, error) =>
      count < 1 &&
      (!(error instanceof ApiError) ||
        error.isNetworkError ||
        (error.status !== undefined && error.status >= 500)),
  });
}

export function useConversation(conversationId: string | null) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: conversationQueryKey(conversationId ?? ""),
    queryFn: async () => {
      if (!conversationId) {
        throw new Error("A conversation ID is required.");
      }
      try {
        return await conversationsApi.get(conversationId);
      } catch (error) {
        await invalidateAuthOnUnauthorized(queryClient, error);
        throw error;
      }
    },
    enabled: Boolean(conversationId),
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useResearchConversation(researchId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["conversation", "research", researchId] as const,
    queryFn: async () => {
      try {
        const conversation =
          await conversationsApi.findOrCreateResearch(researchId);
        queryClient.setQueryData(conversationQueryKey(conversation.id), conversation);
        return conversation;
      } catch (error) {
        await invalidateAuthOnUnauthorized(queryClient, error);
        throw error;
      }
    },
    enabled: Boolean(researchId) && enabled,
    staleTime: 30_000,
    retry: false,
  });
}

export function useConversationMessages(conversationId: string | null) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: conversationMessagesQueryKey(conversationId ?? ""),
    queryFn: async () => {
      if (!conversationId) {
        throw new Error("A conversation ID is required to load messages.");
      }
      try {
        return await conversationsApi.getMessages(conversationId);
      } catch (error) {
        await invalidateAuthOnUnauthorized(queryClient, error);
        throw error;
      }
    },
    enabled: Boolean(conversationId),
    retry: (count, error) =>
      count < 1 &&
      (!(error instanceof ApiError) ||
        error.isNetworkError ||
        (error.status !== undefined && error.status >= 500)),
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConversationCreateRequest) =>
      conversationsApi.create(payload),
    onSuccess: async (conversation) => {
      queryClient.setQueryData(conversationQueryKey(conversation.id), conversation);
      await queryClient.invalidateQueries({
        queryKey: conversationsQueryKey(conversation.scope),
      });
    },
    onError: (error) => invalidateAuthOnUnauthorized(queryClient, error),
  });
}

type MessageFeedbackVariables = {
  conversationId: string;
  messageId: string;
  rating: FeedbackRating;
};

function updateMessageFeedback(
  messages: ConversationMessage[] | undefined,
  messageId: string,
  feedback: MessageFeedback | undefined,
): ConversationMessage[] | undefined {
  if (!messages) return messages;
  return messages.map((message) => {
    if (message.id !== messageId) return message;
    const metadata = { ...message.message_metadata };
    if (feedback) metadata.feedback = feedback;
    else delete metadata.feedback;
    return { ...message, message_metadata: metadata };
  });
}

export function useMessageFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      messageId,
      rating,
    }: MessageFeedbackVariables) =>
      conversationsApi.submitMessageFeedback(conversationId, messageId, rating),
    onMutate: async ({ conversationId, messageId, rating }) => {
      const queryKey = conversationMessagesQueryKey(conversationId);
      await queryClient.cancelQueries({ queryKey });
      const messages =
        queryClient.getQueryData<ConversationMessage[]>(queryKey);
      const previousFeedback = messages?.find(
        (message) => message.id === messageId,
      )?.message_metadata?.feedback;
      const optimisticFeedback: MessageFeedback = {
        rating,
        updated_at: new Date().toISOString(),
      };
      queryClient.setQueryData<ConversationMessage[]>(queryKey, (current) =>
        updateMessageFeedback(current, messageId, optimisticFeedback),
      );
      return {
        queryKey,
        messageId,
        previousFeedback,
        optimisticFeedback,
      };
    },
    onError: async (error, _variables, context) => {
      await invalidateAuthOnUnauthorized(queryClient, error);
      if (!context) return;
      queryClient.setQueryData<ConversationMessage[]>(
        context.queryKey,
        (current) => {
          const currentFeedback = current?.find(
            (message) => message.id === context.messageId,
          )?.message_metadata?.feedback;
          if (
            currentFeedback?.rating !== context.optimisticFeedback.rating ||
            currentFeedback.updated_at !==
              context.optimisticFeedback.updated_at
          ) {
            return current;
          }
          return updateMessageFeedback(
            current,
            context.messageId,
            context.previousFeedback,
          );
        },
      );
    },
    onSuccess: (response, variables, context) => {
      const messageId = response.message_id || variables.messageId;
      queryClient.setQueryData<ConversationMessage[]>(
        context?.queryKey ??
          conversationMessagesQueryKey(variables.conversationId),
        (current) => {
          const message = current?.find((item) => item.id === messageId);
          const updatedAt =
            message?.message_metadata?.feedback?.updated_at ??
            new Date().toISOString();
          return updateMessageFeedback(current, messageId, {
            rating: response.rating,
            updated_at: updatedAt,
          });
        },
      );
    },
  });
}
