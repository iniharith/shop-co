/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, History, LoaderCircle, Search, X } from "lucide-react";
import {
  flattenGlobalSearchGroups,
  getGlobalSearchHitHref,
  GlobalSearchResultItem,
  GroupedGlobalSearchResults,
} from "@/components/global/searchResults";
import { Input } from "@/components/ui/input";
import {
  GLOBAL_SEARCH_MIN_LENGTH,
  useGlobalSearch,
} from "@/hooks/useGlobalSearch";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { cn } from "@/lib/utils";
import { GlobalSearchHit } from "@/types/globalSearch";
import { Roles } from "@/types/api";

interface SearchInputProps {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  showShortcut?: boolean;
}

export default function SearchInput({
  className,
  inputClassName,
  placeholder,
  showShortcut = true,
}: SearchInputProps = {}) {
  const router = useRouter();
  const { data: session } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const isAwapparel = session?.user?.role === Roles.AWAPPAREL;
  const resolvedPlaceholder =
    placeholder ||
    (isAwapparel
      ? "Search files in Sublimation..."
      : "Search tasks, orders, customers, files...");
  const {
    data,
    debouncedQuery,
    error,
    isDebouncing,
    isError,
    isFetching,
    isPending,
    refetch,
  } = useGlobalSearch(value, 5);
  const { recentlyViewed, recordRecentlyViewed } = useRecentlyViewed();

  const normalizedValue = value.trim();
  const isEmptySearch = normalizedValue.length === 0;
  const shouldSearch = normalizedValue.length >= GLOBAL_SEARCH_MIN_LENGTH;
  const resultsAreCurrent = debouncedQuery === normalizedValue;
  const searchHits = resultsAreCurrent
    ? flattenGlobalSearchGroups(data?.groups)
    : [];
  const recentHits = recentlyViewed.map(
    entry => ({ group: entry.group, item: entry.item }) as GlobalSearchHit
  );
  const selectableHits = isEmptySearch ? recentHits : searchHits;
  const showInitialLoading =
    shouldSearch &&
    (isDebouncing || !resultsAreCurrent || (isPending && !data));

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!formRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    const focusOnShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen(true);
        setActiveIndex(-1);
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", focusOnShortcut);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", focusOnShortcut);
    };
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [value, data]);

  useEffect(() => {
    if (activeIndex < 0) return;
    formRef.current
      ?.querySelector<HTMLElement>(`[data-search-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const openHit = (hit: GlobalSearchHit) => {
    recordRecentlyViewed(hit);
    setIsOpen(false);
    setActiveIndex(-1);
    router.push(getGlobalSearchHitHref(hit));
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.currentTarget.value);
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleClear = () => {
    setValue("");
    setIsOpen(true);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();

    if (activeIndex >= 0 && selectableHits[activeIndex]) {
      openHit(selectableHits[activeIndex]);
      return;
    }

    if (shouldSearch) {
      setIsOpen(false);
      router.push(`/admin/search?q=${encodeURIComponent(normalizedValue)}`);
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();
    setIsOpen(true);
    if (selectableHits.length === 0) return;

    setActiveIndex(current => {
      if (event.key === "ArrowDown") {
        return current < selectableHits.length - 1 ? current + 1 : 0;
      }
      return current > 0 ? current - 1 : selectableHits.length - 1;
    });
  };

  return (
    <form
      ref={formRef}
      role="search"
      onSubmit={handleSearch}
      className={cn("relative w-full", className)}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInput}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={resolvedPlaceholder}
          aria-label="Search admin"
          aria-autocomplete="list"
          aria-controls="global-search-results"
          aria-expanded={isOpen}
          className={cn(
            "h-9 w-full rounded-lg bg-background pl-10 pr-12 text-sm shadow-none md:w-40 lg:w-64",
            inputClassName,
            value && "pr-10"
          )}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-[0.3rem] top-1/2 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Clear search"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
        {showShortcut && !value && (
          <kbd className="pointer-events-none absolute right-[0.3rem] top-1/2 hidden h-6 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
            <span className="text-xs">Ctrl</span>K
          </kbd>
        )}
      </div>

      {isOpen && (
        <div
          id="global-search-results"
          className="fixed left-1/2 top-20 z-[100] mt-2 max-h-[calc(100svh-6rem)] w-[calc(100vw-1.5rem)] -translate-x-1/2 overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl md:absolute md:left-auto md:right-0 md:top-full md:w-[min(32rem,calc(100vw-2rem))] md:translate-x-0"
        >
          {isEmptySearch ? (
            <div className="p-1.5">
              <div className="flex items-center gap-2 px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <History className="size-3.5" /> Recently viewed
              </div>
              {recentHits.length > 0 ? (
                <div className="space-y-0.5" role="listbox">
                  {recentHits.map((hit, index) => (
                    <GlobalSearchResultItem
                      key={`${hit.group}:${hit.item.id}`}
                      hit={hit}
                      index={index}
                      active={index === activeIndex}
                      showGroupLabel
                      onSelect={openHit}
                      onActiveIndexChange={setActiveIndex}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-3 pb-4 pt-2 text-sm text-muted-foreground">
                  Items you open from search will appear here.
                </div>
              )}
            </div>
          ) : normalizedValue.length < GLOBAL_SEARCH_MIN_LENGTH ? (
            <div className="p-4 text-sm text-muted-foreground">
              Type at least {GLOBAL_SEARCH_MIN_LENGTH} characters to search.
            </div>
          ) : showInitialLoading ? (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> Searching across admin...
            </div>
          ) : isError ? (
            <div className="flex items-start gap-3 p-4">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Search could not be completed.</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {(error as any)?.response?.data?.message || "Check your connection and try again."}
                </p>
              </div>
              <button type="button" onClick={() => refetch()} className="text-xs font-semibold text-primary hover:underline">
                Retry
              </button>
            </div>
          ) : searchHits.length > 0 && data ? (
            <div className="p-1.5">
              <GroupedGlobalSearchResults
                groups={data.groups}
                hasMore={data.hasMore}
                activeIndex={activeIndex}
                onSelect={openHit}
                onActiveIndexChange={setActiveIndex}
              />
              <div className="mt-1 flex items-center justify-between gap-3 border-t border-border px-3 py-2">
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  {isFetching && <LoaderCircle className="size-3 animate-spin" />}
                  {data.tookMs} ms
                </span>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:underline"
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/admin/search?q=${encodeURIComponent(normalizedValue)}`);
                  }}
                >
                  View all results
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              No results found for &quot;{normalizedValue}&quot;.
            </div>
          )}
        </div>
      )}
    </form>
  );
}
