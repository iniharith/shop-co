"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  GlobalSearchGroupKey,
  GlobalSearchHit,
  RecentlyViewedSearchHit,
} from "@/types/globalSearch";

const MAX_RECENT_ITEMS = 10;
const STORAGE_PREFIX = "shop-co:admin-search:recent:";
const STORAGE_EVENT = "shop-co:admin-search:recent-change";
const SEARCH_GROUPS: GlobalSearchGroupKey[] = [
  "tasks",
  "orders",
  "customers",
  "files",
  "projects",
  "tracking",
];

const readRecentlyViewed = (storageKey: string): RecentlyViewedSearchHit[] => {
  if (!storageKey || typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry): entry is RecentlyViewedSearchHit =>
          !!entry &&
          SEARCH_GROUPS.includes(entry.group) &&
          typeof entry.item?.id === "string" &&
          typeof entry.viewedAt === "number"
      )
      .slice(0, MAX_RECENT_ITEMS);
  } catch {
    return [];
  }
};

export const useRecentlyViewed = () => {
  const { data: session } = useSession();
  const storageKey = session?.user?.id
    ? `${STORAGE_PREFIX}${session.user.id}`
    : "";
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedSearchHit[]>([]);

  useEffect(() => {
    if (!storageKey) {
      setRecentlyViewed([]);
      return;
    }

    const refresh = () => setRecentlyViewed(readRecentlyViewed(storageKey));
    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) refresh();
    };
    const handleLocalChange = (event: Event) => {
      if ((event as CustomEvent<string>).detail === storageKey) refresh();
    };

    refresh();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(STORAGE_EVENT, handleLocalChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(STORAGE_EVENT, handleLocalChange);
    };
  }, [storageKey]);

  const recordRecentlyViewed = (hit: GlobalSearchHit) => {
    if (!storageKey || typeof window === "undefined") return;

    const dedupeKey = `${hit.group}:${hit.item.id}`;
    const next = [
      { ...hit, viewedAt: Date.now() } as RecentlyViewedSearchHit,
      ...readRecentlyViewed(storageKey).filter(
        entry => `${entry.group}:${entry.item.id}` !== dedupeKey
      ),
    ].slice(0, MAX_RECENT_ITEMS);

    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setRecentlyViewed(next);
      window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: storageKey }));
    } catch {
      // Search navigation should still work when storage is unavailable.
    }
  };

  return { recentlyViewed, recordRecentlyViewed };
};
