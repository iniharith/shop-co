// Task QR links must stay on the main site, including uploads handled by replicas.
export function taskQrUrl(token: string): string {
  return `https://admin.kampungcetak.com/task-access/${encodeURIComponent(token)}`;
}
