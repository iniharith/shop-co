export const isTaskId = (value: unknown): value is string => typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

export function requireTaskId(value: unknown): string {
  if (!isTaskId(value)) throw new Error("Task ID is missing or invalid. Close and reopen the task before saving or uploading.");
  return value;
}
