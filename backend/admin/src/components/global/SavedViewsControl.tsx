"use client";

import { FormEvent, useState } from "react";
import { Bookmark, Trash2 } from "lucide-react";
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
};

export default function SavedViewsControl<T>({
  scope,
  state,
  isValidState,
  onApply,
  className,
}: SavedViewsControlProps<T>) {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const { savedViews, saveView, deleteView } = useSavedViews(scope, isValidState);

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
