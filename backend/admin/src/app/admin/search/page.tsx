"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, LoaderCircle, SearchX, Sparkles } from "lucide-react";
import PageContainer from "@/components/layout/page-container";
import {
  flattenGlobalSearchGroups,
  getGlobalSearchHitHref,
  GroupedGlobalSearchResults,
} from "@/components/global/searchResults";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  GLOBAL_SEARCH_MIN_LENGTH,
  useGlobalSearch,
} from "@/hooks/useGlobalSearch";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { GlobalSearchHit } from "@/types/globalSearch";
import { Roles } from "@/types/api";
import { AiSearchPanel } from "@/components/global/aiSearchPanel";

const SEARCH_PAGE_LIMIT = 20;

export default function SearchResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const isAwapparel = session?.user?.role === Roles.AWAPPAREL;
  const query = (searchParams.get("q") || "").trim();
  const {
    data,
    debouncedQuery,
    error,
    isDebouncing,
    isError,
    isPending,
    refetch,
  } = useGlobalSearch(query, SEARCH_PAGE_LIMIT);
  const { recordRecentlyViewed } = useRecentlyViewed();

  const resultsAreCurrent = debouncedQuery === query;
  const hits = resultsAreCurrent
    ? flattenGlobalSearchGroups(data?.groups)
    : [];
  const isLoading =
    query.length >= GLOBAL_SEARCH_MIN_LENGTH &&
    (isDebouncing || !resultsAreCurrent || (isPending && !data));

  const openHit = (hit: GlobalSearchHit) => {
    recordRecentlyViewed(hit);
    router.push(getGlobalSearchHitHref(hit));
  };

  return (
    <PageContainer scrollable>
      <div className="flex w-full min-w-0 flex-1 flex-col space-y-6 rounded-2xl border border-white/10 bg-background/40 p-4 shadow-xl backdrop-blur-md md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="size-3.5" /> Global Search
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Search results</h1>
            <p className="mt-1 break-words text-sm text-muted-foreground">
              {query
                ? isAwapparel
                  ? `Matches across Sublimation files for "${query}".`
                  : `Matches across the admin workspace for "${query}".`
                : isAwapparel
                  ? "Search files in the Sublimation Manager."
                  : "Search tasks, orders, customers, files, projects and tracking."}
            </p>
          </div>
          {data && resultsAreCurrent && (
            <div className="shrink-0 text-xs text-muted-foreground">
              {hits.length} result{hits.length === 1 ? "" : "s"} in {data.tookMs} ms
            </div>
          )}
        </div>

        <Separator />

        <AiSearchPanel query={query} />

        {query.length < GLOBAL_SEARCH_MIN_LENGTH ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/30 px-6 text-center">
            <SearchX className="mb-4 size-10 text-muted-foreground/60" />
            <h2 className="font-semibold">Enter a longer search</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Use at least {GLOBAL_SEARCH_MIN_LENGTH} characters to search the admin workspace.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card/30 text-sm text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin text-primary" /> Searching across admin...
          </div>
        ) : isError ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/[0.03] px-6 text-center">
            <AlertCircle className="mb-4 size-10 text-destructive/70" />
            <h2 className="font-semibold">Search could not be completed</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {(error as any)?.response?.data?.message || "Check your connection and try again."}
            </p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : hits.length > 0 && data ? (
          <GroupedGlobalSearchResults
            groups={data.groups}
            hasMore={data.hasMore}
            variant="page"
            onSelect={openHit}
          />
        ) : (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/30 px-6 text-center">
            <SearchX className="mb-4 size-10 text-muted-foreground/60" />
            <h2 className="font-semibold">No matching results</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Try a customer name, order number, task title, file name or tracking number.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
