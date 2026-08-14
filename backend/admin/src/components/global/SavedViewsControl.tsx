"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bookmark, History, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSavedViews } from "@/hooks/useSavedViews";

type SavedViewsControlProps<T> = {
  scope: string;
  state: T;
  isValidState: (value: unknown) => value is T;
  onApply: (state: T) => void;
  className?: string;
  rememberLastView?: boolean;
};

export default function SavedViewsControl<T>({
  scope,
  state,
  isValidState,
  onApply,
  className,
  rememberLastView = false,
}: SavedViewsControlProps<T>) {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [lastView, setLastView] = useState<T | null>(null);
  const { savedViews, saveView, deleteView } = useSavedViews(scope, isValidState);
  const lastViewKey = rememberLastView && session?.user?.id
    ? `shop-co:admin:last-view:${session.user.id}:${scope}`
    : "";
  const restoredKeyRef = useRef("");
  const skipNextPersistRef = useRef(false);
  const lastSerializedRef = useRef("");

  useEffect(() => {
    if (!lastViewKey || restoredKeyRef.current === lastViewKey) return;
    restoredKeyRef.current = lastViewKey;
    skipNextPersistRef.current = true;

    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(lastViewKey) || "null");
      if (isValidState(parsed)) {
        lastSerializedRef.current = JSON.stringify(parsed);
        setLastView(parsed);
        onApply(parsed);
      }
    } catch {
      localStorage.removeItem(lastViewKey);
    }
  }, [lastViewKey]);

  useEffect(() => {
    if (!lastViewKey || restoredKeyRef.current !== lastViewKey || !isValidState(state)) return;

    const serialized = JSON.stringify(state);
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      if (lastSerializedRef.current) return;
    }
    if (serialized === lastSerializedRef.current) return;

    try {
      localStorage.setItem(lastViewKey, serialized);
      lastSerializedRef.current = serialized;
      setLastView(state);
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
  }, [lastViewKey, state, isValidState]);

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    if (saveView(name, state)) {
      setName("");
      toast.success("View saved");
    } else {
      toast.error("Could not save view");
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className ?? "h-9 gap-2"}>
          <Bookmark className="h-4 w-4" /> Saved views
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Saved views</DropdownMenuLabel>
        {rememberLastView && lastView && (
          <>
            <DropdownMenuItem onSelect={() => onApply(lastView)}>
              <History className="mr-2 h-4 w-4" /> Last view
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {savedViews.length === 0 ? (
          <div className="px-2 py-3 text-sm text-muted-foreground">No saved views yet.</div>
        ) : (
          savedViews.map(view => (
            <DropdownMenuItem
              key={view.name}
              className="group justify-between"
              onSelect={() => onApply(view.state)}
            >
              <span className="truncate">{view.name}</span>
              <button
                type="button"
                aria-label={`Delete ${view.name}`}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onPointerDown={event => event.stopPropagation()}
                onClick={event => {
                  event.stopPropagation();
                  deleteView(view.name);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <form className="flex gap-2 p-1" onSubmit={handleSave} onKeyDown={event => event.stopPropagation()}>
          <Input
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Name this view"
            maxLength={60}
            className="h-8"
          />
          <Button type="submit" size="sm" className="h-8" disabled={!name.trim()}>
            Save
          </Button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
