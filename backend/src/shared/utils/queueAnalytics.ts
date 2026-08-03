export const COMPLETION_STATUSES = ['SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'DONE'] as const;

interface StatusTransitionLike {
  fromStatus?: string | null;
  toStatus?: string;
  fromIsDone?: boolean;
  toIsDone?: boolean;
  changedAt?: Date | string;
}

export interface CompletionTaskLike {
  createdAt: Date | string;
  status?: string;
  isDone?: boolean;
  statusUpdatedAt?: Date | string;
  statusHistory?: StatusTransitionLike[];
}

export interface CompletionAnalytics {
  completedInRange: number;
  avgCompletionHours: number | null;
  completedByDate: Map<string, number>;
  historicalCompletedInRange: number;
  legacyEstimatedCompletedInRange: number;
}

const isComplete = (status: string | null | undefined, isDone: boolean | undefined) =>
  Boolean(isDone) || COMPLETION_STATUSES.includes(status as typeof COMPLETION_STATUSES[number]);

const dateKey = (date: Date, timezoneOffsetHours: number) =>
  new Date(date.getTime() + timezoneOffsetHours * 60 * 60 * 1000).toISOString().slice(0, 10);

export function aggregateCompletionAnalytics(
  tasks: CompletionTaskLike[],
  from: Date,
  to: Date,
  timezoneOffsetHours = 8,
): CompletionAnalytics {
  const completedByDate = new Map<string, number>();
  const durations: number[] = [];
  let historicalCompletedInRange = 0;
  let legacyEstimatedCompletedInRange = 0;

  for (const task of tasks) {
    const hasHistory = Array.isArray(task.statusHistory) && task.statusHistory.length > 0;
    let completedAt: Date | null = null;

    if (hasHistory) {
      const firstCompletion = task.statusHistory!
        .filter(transition =>
          transition.changedAt &&
          isComplete(transition.toStatus, transition.toIsDone) &&
          !isComplete(transition.fromStatus, transition.fromIsDone),
        )
        .map(transition => new Date(transition.changedAt!))
        .filter(date => !Number.isNaN(date.getTime()))
        .sort((left, right) => left.getTime() - right.getTime())[0];
      completedAt = firstCompletion || null;
    } else if (isComplete(task.status, task.isDone) && task.statusUpdatedAt) {
      const fallbackDate = new Date(task.statusUpdatedAt);
      completedAt = Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
    }

    if (!completedAt || completedAt < from || completedAt > to) continue;

    if (hasHistory) historicalCompletedInRange += 1;
    else legacyEstimatedCompletedInRange += 1;
    const key = dateKey(completedAt, timezoneOffsetHours);
    completedByDate.set(key, (completedByDate.get(key) || 0) + 1);

    const createdAt = new Date(task.createdAt);
    const duration = completedAt.getTime() - createdAt.getTime();
    if (!Number.isNaN(createdAt.getTime()) && duration >= 0) durations.push(duration / (60 * 60 * 1000));
  }

  return {
    completedInRange: historicalCompletedInRange + legacyEstimatedCompletedInRange,
    avgCompletionHours: durations.length
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      : null,
    completedByDate,
    historicalCompletedInRange,
    legacyEstimatedCompletedInRange,
  };
}
