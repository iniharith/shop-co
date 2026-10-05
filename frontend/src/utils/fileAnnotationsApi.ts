export async function fileAnnotationsApi(token: string, method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/api/file-annotations${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Unable to load annotations');
  return result.data;
}
