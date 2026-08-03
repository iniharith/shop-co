"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export type SavedView<T> = {
  name: string;
  state: T;
  updatedAt: number;
};

const MAX_SAVED_VIEWS = 20;
const STORAGE_PREFIX = "shop-co:admin:saved-views:";
const STORAGE_EVENT = "shop-co:admin:saved-views-change";

export const useSavedViews = <T,>(
  scope: string,
  isValidState: (value: unknown) => value is T
) => {
  const { data: session } = useSession();
  const storageKey = session?.user?.id
    ? `${STORAGE_PREFIX}${session.user.id}:${scope}`
    : "";
  const [savedViews, setSavedViews] = useState<SavedView<T>[]>([]);

  const readSavedViews = (): SavedView<T>[] => {
    if (!storageKey || typeof window === "undefined") return [];

    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(
          (entry): entry is SavedView<T> =>
            !!entry &&
            typeof entry === "object" &&
            typeof (entry as SavedView<T>).name === "string" &&
            (entry as SavedView<T>).name.trim().length > 0 &&
            typeof (entry as SavedView<T>).updatedAt === "number" &&
            isValidState((entry as SavedView<T>).state)
        )
        .slice(0, MAX_SAVED_VIEWS);
    } catch {
      return [];
    }
  };

  useEffect(() => {
    if (!storageKey) {
      setSavedViews([]);
      return;
    }

    const refresh = () => setSavedViews(readSavedViews());
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

  const persist = (next: SavedView<T>[]) => {
    if (!storageKey || typeof window === "undefined") return false;

    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSavedViews(next);
      window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: storageKey }));
      return true;
    } catch {
      return false;
    }
  };

  const saveView = (name: string, state: T) => {
    const normalizedName = name.trim().slice(0, 60);
    if (!normalizedName || !isValidState(state)) return false;

    const next = [
      { name: normalizedName, state, updatedAt: Date.now() },
      ...readSavedViews().filter(
        view => view.name.toLocaleLowerCase() !== normalizedName.toLocaleLowerCase()
      ),
    ].slice(0, MAX_SAVED_VIEWS);
    return persist(next);
  };

  const deleteView = (name: string) =>
    persist(readSavedViews().filter(view => view.name !== name));

  return { savedViews, saveView, deleteView };
};
