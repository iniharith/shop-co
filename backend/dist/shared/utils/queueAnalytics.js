"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPLETION_STATUSES = void 0;
exports.aggregateCompletionAnalytics = aggregateCompletionAnalytics;
exports.COMPLETION_STATUSES = ['SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'DONE'];
const isComplete = (status, isDone) => Boolean(isDone) || exports.COMPLETION_STATUSES.includes(status);
const dateKey = (date, timezoneOffsetHours) => new Date(date.getTime() + timezoneOffsetHours * 60 * 60 * 1000).toISOString().slice(0, 10);
function aggregateCompletionAnalytics(tasks, from, to, timezoneOffsetHours = 8) {
    const completedByDate = new Map();
    const durations = [];
    let historicalCompletedInRange = 0;
    let legacyEstimatedCompletedInRange = 0;
    for (const task of tasks) {
        const hasHistory = Array.isArray(task.statusHistory) && task.statusHistory.length > 0;
        let completedAt = null;
        if (hasHistory) {
            const firstCompletion = task.statusHistory
                .filter(transition => transition.changedAt &&
                isComplete(transition.toStatus, transition.toIsDone) &&
                !isComplete(transition.fromStatus, transition.fromIsDone))
                .map(transition => new Date(transition.changedAt))
                .filter(date => !Number.isNaN(date.getTime()))
                .sort((left, right) => left.getTime() - right.getTime())[0];
            completedAt = firstCompletion || null;
        }
        else if (isComplete(task.status, task.isDone) && task.statusUpdatedAt) {
            const fallbackDate = new Date(task.statusUpdatedAt);
            completedAt = Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
        }
        if (!completedAt || completedAt < from || completedAt > to)
            continue;
        if (hasHistory)
            historicalCompletedInRange += 1;
        else
            legacyEstimatedCompletedInRange += 1;
        const key = dateKey(completedAt, timezoneOffsetHours);
        completedByDate.set(key, (completedByDate.get(key) || 0) + 1);
        const createdAt = new Date(task.createdAt);
        const duration = completedAt.getTime() - createdAt.getTime();
        if (!Number.isNaN(createdAt.getTime()) && duration >= 0)
            durations.push(duration / (60 * 60 * 1000));
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
