"use client";

import { use, useEffect, useState } from "react";
import { Download, File, FolderKanban, Loader2 } from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function SharedProjectPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${BACKEND}/api/projects/shared/${encodeURIComponent(token)}`, { credentials: "omit" })
      .then(async response => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || "Project link is unavailable");
        setProject(data.data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="size-7 animate-spin text-primary" /></div>;
  if (error || !project) return <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-muted-foreground">{error || "Project not found"}</div>;
  const cover = project.files.find((file: any) => file.mimetype.startsWith("image/"));

  return (
    <main className="min-h-screen bg-background p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-card shadow-xl">
          <div className="relative min-h-64 bg-gradient-to-br from-primary/25 via-card to-card md:min-h-96">
            {cover ? <img src={cover.previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center"><FolderKanban className="size-16 text-primary/50" /></div>}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
            <div className="absolute bottom-0 p-6 text-white md:p-10"><h1 className="text-3xl font-bold md:text-5xl">{project.title}</h1></div>
          </div>
          {project.description && <p className="whitespace-pre-wrap p-6 leading-7 text-muted-foreground md:p-10">{project.description}</p>}
        </section>
        <section className="rounded-3xl border border-white/10 bg-card/60 p-5 md:p-8">
          <h2 className="text-xl font-semibold">Project Files</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {project.files.map((file: any) => (
              <a key={file._id} href={file.previewUrl} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl border border-white/10 bg-background/50 transition hover:border-primary/40">
                <div className="flex h-36 items-center justify-center overflow-hidden bg-muted/30">{file.mimetype.startsWith("image/") ? <img src={file.previewUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-105" /> : <File className="size-10 text-muted-foreground" />}</div>
                <div className="flex items-center justify-between gap-3 p-4"><span className="truncate text-sm font-medium">{file.originalName}</span><Download className="size-4 shrink-0 text-primary" /></div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
