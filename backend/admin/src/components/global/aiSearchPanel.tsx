/**
 * Coded by Harith
 * Kampungcetak ®
 * AI-powered search summary panel shown above the admin global-search results.
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { Bot, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AiSearchHit, getAiSearchResults } from "@/api/search";
import { GLOBAL_SEARCH_MIN_LENGTH } from "@/hooks/useGlobalSearch";
import { Roles } from "@/types/api";

const AI_ROLES = [
  Roles.ADMIN,
  Roles.SYSADMIN,
  Roles.BOSS,
  Roles.DESIGNER,
  Roles.PRODUCTION,
  Roles.PACKAGING,
];

const AI_SEARCH_ENABLED = process.env.NEXT_PUBLIC_AI_SEARCH_ENABLED === "true";

const GROUP_LABEL: Record<AiSearchHit["collection"], string> = {
  products: "Products",
  tasks: "Tasks",
  files: "Files",
};

const hitHref = (hit: AiSearchHit): string | null => {
  switch (hit.collection) {
    case "tasks":
      return `/admin/tasks?taskId=${encodeURIComponent(hit.entityId)}`;
    case "files":
      return `/share/file/${encodeURIComponent(hit.entityId)}`;
    case "products":
      return null;
  }
};

export function AiSearchPanel({ query }: { query: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const allowed = AI_SEARCH_ENABLED && !!role && AI_ROLES.includes(role as Roles);
  const normalized = query.trim();

  const { data, isFetching, isPending } = useQuery({
    queryKey: ["ai-admin-search", normalized],
    queryFn: ({ signal }) => getAiSearchResults(session?.user?.token || "", normalized, signal),
    enabled: allowed && normalized.length >= GLOBAL_SEARCH_MIN_LENGTH,
    staleTime: 30_000,
  });

  if (!allowed || normalized.length < GLOBAL_SEARCH_MIN_LENGTH) return null;

  if (isPending || isFetching) {
    return (
      <section className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Bot className="size-4 animate-pulse text-primary" /> AI is analyzing the workspace...
        </p>
      </section>
    );
  }

  if (!data?.summary && !data?.groups?.products?.length && !data?.groups?.tasks?.length && !data?.groups?.files?.length) {
    return null;
  }

  const hits = [
    ...(data.groups?.products || []),
    ...(data.groups?.tasks || []),
    ...(data.groups?.files || []),
  ].sort((a, b) => b.score - a.score);

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 md:p-5">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        <Bot className="size-4" /> AI Summary
      </div>
      {data.summary && <p className="text-sm leading-relaxed text-foreground">{data.summary}</p>}
      {hits.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {hits.map(hit => {
            const href = hitHref(hit);
            const inner = (
              <>
                <span className="text-[10px] font-bold uppercase text-primary">
                  {GROUP_LABEL[hit.collection]}
                </span>
                <span className="max-w-[180px] truncate">{hit.title}</span>
                <span className="text-[10px] text-muted-foreground">
                  {(hit.score * 100).toFixed(0)}%
                </span>
                {href && (
                  <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary" />
                )}
              </>
            );
            const className =
              "group inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors";
            if (!href) {
              return (
                <span key={`${hit.collection}:${hit.entityId}`} className={`${className} cursor-default`}>
                  {inner}
                </span>
              );
            }
            return (
              <button
                key={`${hit.collection}:${hit.entityId}`}
                type="button"
                onClick={() => router.push(href)}
                className={`${className} hover:border-primary/40 hover:bg-primary/5`}
              >
                {inner}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
