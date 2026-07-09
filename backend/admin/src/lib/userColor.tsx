/**
 * Coded by Harith
 * Kampungcetak ®
 *
 * Shared, single source of truth for "what color is this user's tag".
 * Import getUserColor / AssigneeTag anywhere a user needs to be shown with
 * their persistent color (task board, task list, task detail modal, etc.)
 * instead of re-deriving it locally — that's how the modal ended up with no
 * color treatment at all while the board/list had one.
 */
import React from "react";

// Hash the user's own _id into a hue across the full 0–359° wheel. Same id
// always produces the same hue (persistent), and unlike picking from a small
// preset list of ~16 colors, this gives effectively unlimited distinct
// values so users stop colliding once you have more than a handful of staff.
export const getUserHue = (id: string): number => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
};

export const getUserColor = (id: string): string => `hsl(${getUserHue(id)}, 70%, 50%)`;

/** Colored dot + name. Used for the *closed/collapsed* state of a select
 * trigger (so the tag is visible without opening the dropdown), and can be
 * reused anywhere else a user needs to be shown with their color. */
export const AssigneeTag = ({ user }: { user: any }) => {
  if (!user) return <span className="text-muted-foreground">Unassigned</span>;
  return (
    <span className="flex items-center gap-1.5 min-w-0">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getUserColor(user._id) }} />
      <span className="truncate">{user.name || user.email}</span>
    </span>
  );
};

/** Colored dot only — for use inside a <SelectItem> row where the label text
 * is already provided separately. */
export const AssigneeDot = ({ userId }: { userId: string }) => (
  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getUserColor(userId) }} />
);
