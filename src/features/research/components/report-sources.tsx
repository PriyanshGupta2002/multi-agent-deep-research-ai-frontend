import { ArrowUpRight, ExternalLink } from "lucide-react";
import type { StructuredReportSource } from "@/features/research/api/research-api";

function getExternalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url
      : undefined;
  } catch {
    return undefined;
  }
}

export function ReportSources({
  sources,
}: {
  sources: StructuredReportSource[];
}) {
  return (
    <section aria-labelledby="report-sources-title">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2
          className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          id="report-sources-title"
        >
          Structured sources
        </h2>
        <span className="text-[10px] text-muted-foreground">
          {sources.length}
        </span>
      </div>
      {sources.length === 0 ? (
        <p className="text-xs leading-5 text-muted-foreground">
          No structured sources available.
        </p>
      ) : (
        <ol className="space-y-3">
          {sources.map((source, index) => {
            const externalUrl = source.url
              ? getExternalUrl(source.url)
              : undefined;
            const title = source.title || source.url || "Untitled source";

            return (
              <li
                className="rounded-md border-b pb-3 last:border-b-0 last:pb-0"
                key={`${source.url ?? "source"}-${index}`}
              >
                {externalUrl ? (
                  <a
                    className="group flex items-start gap-2.5"
                    href={externalUrl.toString()}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium leading-4 group-hover:underline">
                        {title}
                      </span>
                      <span className="mt-1 block break-all text-[10px] leading-4 text-muted-foreground">
                        {externalUrl.hostname}
                      </span>
                      {source.published_date && (
                        <span className="mt-1 block text-[10px] text-muted-foreground">
                          Published {source.published_date}
                        </span>
                      )}
                    </span>
                    <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  </a>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium leading-4">
                        {title}
                      </span>
                      {source.published_date && (
                        <span className="mt-1 block text-[10px] text-muted-foreground">
                          Published {source.published_date}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
      {sources.length > 0 && (
        <div className="mt-4 flex gap-2 border-t pt-3 text-[10px] leading-4 text-muted-foreground">
          <ExternalLink className="mt-0.5 size-3 shrink-0" />
          <p>These sources are reported in the structured report data.</p>
        </div>
      )}
    </section>
  );
}
