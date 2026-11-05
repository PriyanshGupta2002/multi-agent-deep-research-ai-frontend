"use client";

import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useCreateResearch } from "@/features/research/hooks/use-researches";
import { getResearchErrorMessage } from "@/features/research/research-errors";
import type { ResearchDepth } from "@/features/research/api/research-api";
import { ApiError } from "@/lib/api/errors";

const exampleBriefs = [
  "How are cities adapting to extreme heat?",
  "Compare open-source AI models for research",
];

const researchDepths: {
  value: ResearchDepth;
  label: string;
  description: string;
}[] = [
  {
    value: "quick",
    label: "Quick",
    description: "A focused overview",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Balanced coverage",
  },
  {
    value: "comprehensive",
    label: "Comprehensive",
    description: "More depth and detail",
  },
];

export function ResearchComposer() {
  const router = useRouter();
  const createResearch = useCreateResearch();
  const [brief, setBrief] = useState("");
  const [depth, setDepth] = useState<ResearchDepth>("standard");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const topic = brief.trim();
    if (topic.length < 5 || topic.length > 5000) return;

    createResearch.mutate(
      { query: topic, depth },
      {
        onSuccess: (research) => {
          const search = new URLSearchParams({
            topic: research.query,
            depth: research.depth,
          });
          router.push(
            `/research/${encodeURIComponent(research.id)}?${search.toString()}`,
          );
        },
      },
    );
  }

  return (
    <section
      aria-labelledby="research-composer-title"
      className="overflow-hidden rounded-xl border bg-card"
    >
      <div className="flex items-start gap-3 border-b px-5 py-4 sm:px-6">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Sparkles className="size-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold" id="research-composer-title">
            What would you like to research?
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Ask a question or describe a topic to investigate.
          </p>
        </div>
      </div>
      <form className="p-4 sm:p-5" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="research-brief">
          Research question
        </label>
        <textarea
          className="min-h-32 w-full resize-y rounded-md border bg-background px-4 py-3.5 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground/75 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          id="research-brief"
          onChange={(event) => setBrief(event.target.value)}
          placeholder="e.g. What are the most promising approaches to long-duration energy storage, and what are their trade-offs?"
          value={brief}
        />
        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-medium text-foreground">
            Research depth
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {researchDepths.map((option) => {
              const selected = depth === option.value;
              return (
                <button
                  aria-pressed={selected}
                  className={`flex min-h-14 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition-colors ${
                    selected
                      ? "border-ring bg-muted/60"
                      : "bg-background hover:bg-muted/40"
                  }`}
                  key={option.value}
                  onClick={() => setDepth(option.value)}
                  type="button"
                >
                  <span>
                    <span className="block text-xs font-medium">{option.label}</span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                  {selected && <Check className="size-4 shrink-0 text-foreground" />}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Research starts after you submit. You can follow its progress in the
            workspace.
          </p>
          <Button
            className="w-full sm:w-auto"
            disabled={
              brief.trim().length < 5 ||
              brief.trim().length > 5000 ||
              createResearch.isPending
            }
            type="submit"
          >
            {createResearch.isPending ? "Starting research…" : "Start research"}
            <ArrowUpRight className="size-4" />
          </Button>
        </div>
        {brief.trim().length > 0 && brief.trim().length < 5 && (
          <p className="mt-2 text-xs text-destructive">
            Enter at least 5 characters.
          </p>
        )}
        {brief.trim().length > 5000 && (
          <p className="mt-2 text-xs text-destructive">
            Research question must be 5,000 characters or fewer.
          </p>
        )}
        {createResearch.isError && (
          <p
            aria-live="polite"
            className="mt-3 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-xs leading-5 text-destructive"
            role="alert"
          >
            {getResearchErrorMessage(
              createResearch.error,
              "Could not start research.",
            )}
            {createResearch.error instanceof ApiError &&
              createResearch.error.status === 401 && (
                <>
                  {" "}
                  <Link
                    className="font-medium underline underline-offset-2"
                    href="/login"
                  >
                    Sign in again
                  </Link>
                  .
                </>
              )}
          </p>
        )}
      </form>
      <div className="flex flex-col gap-2 border-t bg-muted/20 px-5 py-3.5 sm:flex-row sm:items-center sm:px-6">
        <span className="shrink-0 text-xs text-muted-foreground">
          Try a prompt
        </span>
        <div className="flex flex-wrap gap-2">
          {exampleBriefs.map((suggestion) => (
            <button
              className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              key={suggestion}
              onClick={() => setBrief(suggestion)}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
