"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  researchDetailQueryKey,
  researchListQueryKey,
  researchReportQueryKey,
  researchSourcesQueryKey,
  researchTasksQueryKey,
} from "@/features/research/hooks/use-researches";
import {
  parseResearchEvent,
  researchEventNames,
  type ResearchEventName,
  type ResearchLiveEvent,
} from "@/features/research/api/research-events";
import type {
  ResearchRecord,
  ResearchStatus,
  ResearchTaskRecord,
} from "@/features/research/api/research-api";

export type ResearchEventConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "unavailable";

const unavailableAfterMs = 20_000;

function getEventsUrl(researchId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const url = new URL(
    `/api/v1/research/${encodeURIComponent(researchId)}/events`,
    baseUrl,
  );
  return url.toString();
}

export function useResearchEvents(researchId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const [eventState, setEventState] = useState<{
    researchId: string;
    events: ResearchLiveEvent[];
  }>({ researchId, events: [] });
  const [connection, setConnection] = useState<{
    researchId: string;
    status: ResearchEventConnectionStatus;
    error: string | null;
  }>({
    researchId,
    status: "connecting",
    error: null,
  });
  const [retryToken, setRetryToken] = useState(0);
  const seenEventIds = useRef(new Set<string>());

  useEffect(() => {
    seenEventIds.current.clear();
  }, [researchId]);

  const retry = useCallback(() => {
    setConnection({ researchId, status: "connecting", error: null });
    setRetryToken((current) => current + 1);
  }, [researchId]);

  useEffect(() => {
    if (!enabled || !researchId) return;

    let startupErrorTimer: ReturnType<typeof setTimeout> | undefined;

    if (typeof EventSource === "undefined") {
      startupErrorTimer = setTimeout(
        () =>
          setConnection({
            researchId,
            status: "unavailable",
            error: "Live updates are not supported by this browser.",
          }),
        0,
      );
      return () => {
        if (startupErrorTimer) clearTimeout(startupErrorTimer);
      };
    }

    let source: EventSource;
    let closed = false;
    let unavailableTimer: ReturnType<typeof setTimeout> | undefined;

    const clearUnavailableTimer = () => {
      if (unavailableTimer) {
        clearTimeout(unavailableTimer);
        unavailableTimer = undefined;
      }
    };

    const updateResearchStatus = (nextStatus: ResearchStatus) => {
      queryClient.setQueryData<ResearchRecord>(
        researchDetailQueryKey(researchId),
        (current) => (current ? { ...current, status: nextStatus } : current),
      );
      queryClient.setQueriesData(
        { queryKey: researchListQueryKey },
        (current: unknown) => {
          if (
            !current ||
            typeof current !== "object" ||
            !("items" in current) ||
            !Array.isArray(current.items)
          ) {
            return current;
          }
          return {
            ...current,
            items: current.items.map((item) =>
              item &&
              typeof item === "object" &&
              "id" in item &&
              item.id === researchId
                ? { ...item, status: nextStatus }
                : item,
            ),
          };
        },
      );
    };

    const invalidateLiveQueries = (includeSources: boolean) => {
      const queries = [
        queryClient.invalidateQueries({
          queryKey: researchDetailQueryKey(researchId),
        }),
        queryClient.invalidateQueries({
          queryKey: researchTasksQueryKey(researchId),
        }),
        queryClient.invalidateQueries({ queryKey: researchListQueryKey }),
      ];
      if (includeSources) {
        queries.push(
          queryClient.invalidateQueries({
            queryKey: researchSourcesQueryKey(researchId),
          }),
        );
      }
      if (includeSources) {
        queries.push(
          queryClient.invalidateQueries({
            queryKey: researchReportQueryKey(researchId),
          }),
        );
      }
      void Promise.all(queries);
    };

    const onMessage = (type: ResearchEventName, event: Event) => {
      const message = event as MessageEvent<string>;
      const eventId = message.lastEventId;
      const dedupeKey = eventId || `${type}:${message.data}`;
      if (seenEventIds.current.has(dedupeKey)) return;

      let liveEvent: ResearchLiveEvent;
      try {
        liveEvent = parseResearchEvent(type, dedupeKey, message.data);
      } catch (parseError) {
        const messageText =
          parseError instanceof Error
            ? parseError.message
            : `Could not read the ${type} event.`;
        setConnection({
          researchId,
          status: "unavailable",
          error: messageText,
        });
        return;
      }

      seenEventIds.current.add(dedupeKey);
      setConnection({
        researchId,
        status: "connected",
        error: null,
      });
      setEventState((current) => ({
        researchId,
        events: [
          ...(current.researchId === researchId ? current.events : []),
          liveEvent,
        ],
      }));

      switch (liveEvent.type) {
        case "research_started":
          updateResearchStatus("running");
          break;
        case "researcher_started":
        case "researcher_completed":
        case "researcher_failed": {
        const { subtask } = liveEvent.payload;
        const taskStatus =
          liveEvent.type === "researcher_started"
            ? "running"
            : liveEvent.type === "researcher_completed"
              ? "completed"
              : "failed";
        const taskError =
          liveEvent.type === "researcher_failed"
            ? liveEvent.payload.error
            : null;
        queryClient.setQueryData<ResearchTaskRecord[]>(
          researchTasksQueryKey(researchId),
          (current) =>
            current?.map((task) =>
              task.title === subtask
                ? { ...task, status: taskStatus, error: taskError }
                : task,
            ),
        );
        void queryClient.invalidateQueries({
          queryKey: researchTasksQueryKey(researchId),
        });
          break;
        }
        case "tasks_generated":
          void queryClient.invalidateQueries({
            queryKey: researchTasksQueryKey(researchId),
          });
          break;
      }

      if (
        liveEvent.type === "research_completed" ||
        liveEvent.type === "research_failed" ||
        liveEvent.type === "research_cancelled"
      ) {
        updateResearchStatus(liveEvent.payload.status);
        invalidateLiveQueries(true);
        clearUnavailableTimer();
        closed = true;
        source.close();
        setConnection({
          researchId,
          status: "disconnected",
          error: null,
        });
        return;
      }

      if (liveEvent.type === "stream_end") {
        updateResearchStatus(liveEvent.payload.status);
        invalidateLiveQueries(liveEvent.payload.status === "completed");
        clearUnavailableTimer();
        closed = true;
        source.close();
        setConnection({
          researchId,
          status: "disconnected",
          error: null,
        });
      }
    };

    try {
      source = new EventSource(getEventsUrl(researchId), {
        withCredentials: true,
      });
    } catch (connectionError) {
      startupErrorTimer = setTimeout(
        () =>
          setConnection({
            researchId,
            status: "unavailable",
            error:
              connectionError instanceof Error
                ? connectionError.message
                : "Could not start live updates.",
          }),
        0,
      );
      return () => {
        if (startupErrorTimer) clearTimeout(startupErrorTimer);
      };
    }

    source.onopen = () => {
      clearUnavailableTimer();
      setConnection({ researchId, status: "connected", error: null });
    };

    source.onerror = () => {
      if (closed) return;
      setConnection({
        researchId,
        status: "reconnecting",
        error:
          "The live connection was interrupted. The browser will reconnect automatically.",
      });
      clearUnavailableTimer();
      unavailableTimer = setTimeout(() => {
        if (!closed) {
          setConnection({
            researchId,
            status: "unavailable",
            error:
              "Live updates are still unavailable. Automatic reconnection remains active; check the network and cross-origin configuration.",
          });
        }
      }, unavailableAfterMs);
    };

    for (const eventName of researchEventNames) {
      source.addEventListener(eventName, (event) => {
        onMessage(eventName, event);
      });
    }

    return () => {
      closed = true;
      clearUnavailableTimer();
      if (startupErrorTimer) clearTimeout(startupErrorTimer);
      source.close();
    };
  }, [enabled, queryClient, researchId, retryToken]);

  const events =
    eventState.researchId === researchId ? eventState.events : [];
  const connectionState =
    connection.researchId === researchId
      ? connection
      : {
          researchId,
          status: enabled
            ? ("connecting" as const)
            : ("disconnected" as const),
          error: null,
        };
  return {
    events,
    status: enabled ? connectionState.status : "disconnected",
    error: connectionState.error,
    retry,
  };
}
