export default function Loading() {
  return (
    <div className="space-y-4 p-4" aria-label="Loading page">
      <div className="h-3 w-32 animate-pulse rounded-full bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-36 animate-pulse rounded-3xl border bg-muted/40" />)}
      </div>
    </div>
  );
}
