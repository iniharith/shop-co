"use client";

import {
  ArrowUpRight,
  ChevronRight,
  FileText,
  FolderKanban,
  ListTodo,
  Package,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  GlobalSearchGroupKey,
  GlobalSearchGroups,
  GlobalSearchHasMore,
  GlobalSearchHit,
} from "@/types/globalSearch";

export const GLOBAL_SEARCH_GROUPS: GlobalSearchGroupKey[] = [
  "tasks",
  "orders",
  "customers",
  "files",
  "projects",
  "tracking",
];

type GroupMeta = {
  label: string;
  Icon: LucideIcon;
  iconClassName: string;
};

export const GLOBAL_SEARCH_GROUP_META: Record<GlobalSearchGroupKey, GroupMeta> = {
  tasks: {
    label: "Tasks",
    Icon: ListTodo,
    iconClassName: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  orders: {
    label: "Orders",
    Icon: Package,
    iconClassName: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  customers: {
    label: "Customers",
    Icon: Users,
    iconClassName: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  files: {
    label: "Files",
    Icon: FileText,
    iconClassName: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  projects: {
    label: "Projects",
    Icon: FolderKanban,
    iconClassName: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400",
  },
  tracking: {
    label: "Tracking",
    Icon: Truck,
    iconClassName: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
};

const humanize = (value?: string) => value?.replace(/_/g, " ").toLowerCase();
const joinDetails = (...values: Array<string | undefined | null | false>) =>
  values.filter(Boolean).join(" / ");

export const flattenGlobalSearchGroups = (groups?: GlobalSearchGroups): GlobalSearchHit[] => {
  if (!groups) return [];

  return GLOBAL_SEARCH_GROUPS.flatMap(group =>
    (groups[group] || []).map(item => ({ group, item }) as GlobalSearchHit)
  );
};

export const getGlobalSearchHitHref = (hit: GlobalSearchHit) => {
  switch (hit.group) {
    case "tasks":
      return `/admin/tasks?taskId=${encodeURIComponent(hit.item.id)}`;
    case "orders":
      return `/admin/orders?search=${encodeURIComponent(hit.item.id)}`;
    case "customers":
      return `/admin/orders?search=${encodeURIComponent(hit.item.email || hit.item.name)}`;
    case "files":
      return `/share/file/${encodeURIComponent(hit.item.id)}`;
    case "projects":
      return `/admin/projects/${encodeURIComponent(hit.item.id)}`;
    case "tracking":
      return `/admin/tracking?search=${encodeURIComponent(hit.item.trackingNumber)}`;
  }
};

export const getGlobalSearchHitTitle = (hit: GlobalSearchHit) => {
  switch (hit.group) {
    case "tasks":
      return hit.item.title;
    case "orders":
      return `Order ${hit.item.id}`;
    case "customers":
      return hit.item.name;
    case "files":
      return hit.item.name;
    case "projects":
      return hit.item.title;
    case "tracking":
      return hit.item.trackingNumber;
  }
};

export const getGlobalSearchHitDetails = (hit: GlobalSearchHit) => {
  switch (hit.group) {
    case "tasks":
      return joinDetails(
        humanize(hit.item.status),
        hit.item.orderId && `Order ${hit.item.orderId}`,
        hit.item.customerUsername
      );
    case "orders":
      return joinDetails(
        hit.item.customerName || hit.item.customerEmail,
        humanize(hit.item.status),
        hit.item.trackingNumber
      );
    case "customers":
      return joinDetails(hit.item.email, hit.item.phoneNumber);
    case "files":
      return joinDetails(
        humanize(hit.item.category),
        hit.item.mimetype,
        hit.item.taskId && `Task ${hit.item.taskId}`,
        !hit.item.taskId && hit.item.orderId && `Order ${hit.item.orderId}`
      );
    case "projects":
      return hit.item.description || `${hit.item.fileCount} file${hit.item.fileCount === 1 ? "" : "s"}`;
    case "tracking":
      return joinDetails(
        hit.item.customerName,
        hit.item.courier,
        humanize(hit.item.status),
        hit.item.orderId && `Order ${hit.item.orderId}`
      );
  }
};

type SearchResultItemProps = {
  hit: GlobalSearchHit;
  index?: number;
  active?: boolean;
  variant?: "compact" | "page";
  showGroupLabel?: boolean;
  onSelect: (hit: GlobalSearchHit) => void;
  onActiveIndexChange?: (index: number) => void;
};

export function GlobalSearchResultItem({
  hit,
  index,
  active = false,
  variant = "compact",
  showGroupLabel = false,
  onSelect,
  onActiveIndexChange,
}: SearchResultItemProps) {
  const { label, Icon, iconClassName } = GLOBAL_SEARCH_GROUP_META[hit.group];
  const compact = variant === "compact";
  const title = getGlobalSearchHitTitle(hit);
  const details = getGlobalSearchHitDetails(hit);
  const EndIcon = compact ? ChevronRight : ArrowUpRight;

  return (
    <button
      type="button"
      role={compact ? "option" : undefined}
      aria-selected={compact ? active : undefined}
      data-search-index={index}
      onMouseEnter={() => index !== undefined && onActiveIndexChange?.(index)}
      onClick={() => onSelect(hit)}
      className={cn(
        "group flex w-full min-w-0 items-start gap-3 text-left outline-none transition-colors",
        compact
          ? "rounded-lg px-3 py-2.5 hover:bg-muted focus-visible:bg-muted"
          : "rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm hover:border-primary/35 hover:bg-card hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring",
        compact && active && "bg-muted"
      )}
    >
      <span className={cn("flex shrink-0 items-center justify-center", compact ? "size-8 rounded-lg" : "size-10 rounded-xl", iconClassName)}>
        <Icon className={compact ? "size-4" : "size-5"} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className={cn("truncate font-semibold", compact ? "text-sm" : "text-base")}>{title}</span>
          {showGroupLabel && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </span>
          )}
        </span>
        <span className={cn("mt-0.5 block text-muted-foreground", compact ? "truncate text-xs" : "line-clamp-2 text-sm leading-5")}>
          {details || label}
        </span>
      </span>
      <EndIcon className={cn("mt-1 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground", compact ? "size-3.5 group-hover:translate-x-0.5" : "size-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5")} />
    </button>
  );
}

type GroupedSearchResultsProps = {
  groups: GlobalSearchGroups;
  hasMore?: GlobalSearchHasMore;
  activeIndex?: number;
  variant?: "compact" | "page";
  onSelect: (hit: GlobalSearchHit) => void;
  onActiveIndexChange?: (index: number) => void;
};

export function GroupedGlobalSearchResults({
  groups,
  hasMore,
  activeIndex = -1,
  variant = "compact",
  onSelect,
  onActiveIndexChange,
}: GroupedSearchResultsProps) {
  const compact = variant === "compact";
  const indexedHits = flattenGlobalSearchGroups(groups).map((hit, index) => ({ hit, index }));

  return (
    <div className={compact ? "space-y-1" : "space-y-8"} role={compact ? "listbox" : undefined}>
      {GLOBAL_SEARCH_GROUPS.map(group => {
        const groupHits = indexedHits.filter(entry => entry.hit.group === group);
        if (groupHits.length === 0) return null;

        const { label, Icon } = GLOBAL_SEARCH_GROUP_META[group];
        return (
          <section key={group} className={compact ? "py-1" : "space-y-3"}>
            <div className={cn("flex items-center justify-between gap-3", compact ? "px-3 pb-1 pt-1.5" : "border-b border-border/60 pb-3")}>
              <div className="flex items-center gap-2">
                {!compact && <Icon className="size-4 text-primary" />}
                <h2 className={cn("font-semibold uppercase tracking-wider text-muted-foreground", compact ? "text-[10px]" : "text-xs")}>{label}</h2>
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{groupHits.length}</span>
              </div>
              {hasMore?.[group] && <span className="text-[10px] font-medium text-primary">More matches available</span>}
            </div>
            <div className={compact ? "space-y-0.5" : "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"}>
              {groupHits.map(({ hit, index }) => (
                <GlobalSearchResultItem
                  key={`${hit.group}:${hit.item.id}`}
                  hit={hit}
                  index={index}
                  active={index === activeIndex}
                  variant={variant}
                  onSelect={onSelect}
                  onActiveIndexChange={onActiveIndexChange}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
