"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ArrowUpRight, FileText, FolderKanban, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Project } from "@/api/projects";
import { useCreateProject, useProjects } from "@/hooks/useProjects";

// Free global CDN proxy to downscale large S3 images on the fly
const getThumbUrl = (url: string, w: number, h: number) =>
  `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&h=${h}&fit=cover`;

export default function ProjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { data, isLoading } = useProjects(deferredSearch);
  const createMutation = useCreateProject();
  const projects: Project[] = data?.data || [];

  const handleCreate = async () => {
    if (!title.trim()) return toast.error("Project title is required");
    try {
      const response = await createMutation.mutateAsync({ title: title.trim(), description: description.trim() });
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      router.push(`/admin/projects/${response.data._id}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create project");
    }
  };

  return (
    <PageContainer>
      <div className="w-full space-y-7 rounded-3xl border border-white/10 bg-background/40 p-5 shadow-xl backdrop-blur-md md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Project Library</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Projects</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Keep project briefs, artwork and production files together in one visual workspace.
            </p>
          </div>
          <div className="relative w-full xl:w-80">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search projects..." className="h-11 rounded-xl bg-card/60 pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <button
            onClick={() => setCreateOpen(true)}
            className="group flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-primary/35 bg-primary/[0.035] p-6 text-center transition-all hover:-translate-y-1 hover:border-primary hover:bg-primary/[0.07] hover:shadow-xl"
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105">
              <Plus className="size-6" />
            </span>
            <span className="mt-5 font-semibold">New Project</span>
            <span className="mt-1 text-xs text-muted-foreground">Create a brief and add files</span>
          </button>

          {isLoading && (
            <div className="flex min-h-[280px] items-center justify-center rounded-[28px] border border-white/10 bg-card/40">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          )}

          {projects.map(project => {
            const cover = project.files?.find(file => file._id === project.coverFileId) || project.files?.find(file => file.mimetype.startsWith("image/"));
            return (
              <Link
                key={project._id}
                href={`/admin/projects/${project._id}`}
                className="group relative min-h-[280px] overflow-hidden rounded-[28px] border border-white/10 bg-card/60 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl"
              >
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/25 via-card to-card">
                  {cover ? (
                    <img src={getThumbUrl(cover.url, 640, 480)} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <FolderKanban className="size-12 text-primary/60" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-4 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                    {project.files?.length || 0} files
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">{project.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                        {project.description || "No description yet."}
                      </p>
                    </div>
                    <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary" />
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5"><FileText className="size-3.5" /> {project.createdByName || "Admin"}</span>
                    <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="rounded-3xl border-white/10 bg-card/95 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Add the project title now. You can upload artwork and files on the next screen.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input value={title} onChange={event => setTitle(event.target.value)} placeholder="Project title" maxLength={160} autoFocus />
            <Textarea value={description} onChange={event => setDescription(event.target.value)} placeholder="Short project description (optional)" className="min-h-28 resize-none" maxLength={10000} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
