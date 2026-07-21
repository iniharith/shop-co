"use client";

import { DragEvent, use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, File, FileImage, Loader2, Save, Share2, Trash2, UploadCloud } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Project, ProjectFile } from "@/api/projects";
import { createProjectShare } from "@/api/projects";
import { useDeleteProjectFile, useProject, useUpdateProject, useUploadProjectFile } from "@/hooks/useProjects";
import { useSession } from "next-auth/react";

const MAX_FILE_SIZE = 200 * 1024 * 1024;

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, isError } = useProject(id);
  const project: Project | undefined = data?.data;
  const updateMutation = useUpdateProject(id);
  const uploadMutation = useUploadProjectFile(id);
  const deleteMutation = useDeleteProjectFile(id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!project) return;
    setTitle(project.title);
    setDescription(project.description || "");
  }, [project?._id, project?.title, project?.description]);

  const saveProject = async () => {
    if (!title.trim()) return toast.error("Project title is required");
    try {
      await updateMutation.mutateAsync({ title: title.trim(), description: description.trim() });
      toast.success("Project details saved");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save project");
    }
  };

  const uploadFiles = async (files: File[]) => {
    const oversized = files.filter(file => file.size > MAX_FILE_SIZE);
    if (oversized.length) {
      toast.error(`${oversized.map(file => file.name).join(", ")} exceeded the 200MB per-file limit`);
      return;
    }
    for (const [index, file] of files.entries()) {
      const progressKey = `${file.name}-${file.size}-${index}`;
      setUploadProgress(current => ({ ...current, [progressKey]: 0 }));
      try {
        await uploadMutation.mutateAsync({
          file,
          onProgress: progress => setUploadProgress(current => ({ ...current, [progressKey]: progress })),
        });
        toast.success(`${file.name} uploaded`);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || `Failed to upload ${file.name}`);
      } finally {
        setUploadProgress(current => {
          const next = { ...current };
          delete next[progressKey];
          return next;
        });
      }
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    void uploadFiles(Array.from(event.dataTransfer.files));
  };

  const deleteFile = async (file: ProjectFile) => {
    if (!confirm(`Delete ${file.originalName}?`)) return;
    try {
      await deleteMutation.mutateAsync(file._id);
      toast.success("File deleted");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete file");
    }
  };

  const shareProject = async () => {
    setSharing(true);
    try {
      const response = await createProjectShare(session?.user?.token || "", id);
      const link = `${window.location.origin}/share/project/${response.data.token}`;
      await navigator.clipboard.writeText(link);
      toast.success("Read-only project link copied. It expires in 30 days.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create project share link");
    } finally {
      setSharing(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="size-7 animate-spin text-primary" /></div>;
  }

  if (isError || !project) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
        <p>Project not found.</p>
        <Button asChild variant="outline"><Link href="/admin/projects">Back to Projects</Link></Button>
      </div>
    );
  }

  const heroImage = project.files.find(file => file.mimetype.startsWith("image/"));
  const activeUploads = Object.entries(uploadProgress);

  return (
    <PageContainer>
      <div className="w-full space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-background/40 p-4 shadow-xl backdrop-blur-md md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button asChild variant="ghost" className="rounded-xl">
              <Link href="/admin/projects"><ArrowLeft className="mr-2 size-4" /> Projects</Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="hidden text-xs text-muted-foreground sm:block">Updated {format(new Date(project.updatedAt), "dd MMM yyyy, HH:mm")}</div>
              <Button variant="outline" onClick={shareProject} disabled={sharing}>
                {sharing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Share2 className="mr-2 size-4" />} Share Project
              </Button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
            <div className="relative min-h-[280px] overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-primary/20 via-card to-card md:min-h-[390px]">
              {heroImage ? (
                <img src={heroImage.previewUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-primary/60">
                  <FileImage className="size-16" />
                  <span className="mt-3 text-sm">Upload an image to create the project cover</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white md:p-8">
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Project Workspace</div>
                <Input
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  maxLength={160}
                  className="h-auto border-0 bg-transparent p-0 text-3xl font-bold text-white shadow-none focus-visible:ring-0 md:text-4xl"
                />
              </div>
            </div>

            <div className="flex flex-col rounded-[26px] border border-white/10 bg-card/55 p-5 md:p-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Description</p>
                <h2 className="mt-2 text-xl font-semibold">Project details</h2>
              </div>
              <Textarea
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder="Add project requirements, sizes, material, deadlines, customer notes or production instructions..."
                maxLength={10000}
                className="mt-5 min-h-52 flex-1 resize-none rounded-2xl border-white/10 bg-background/45 p-4 leading-6"
              />
              <div className="mt-5 flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">{description.length.toLocaleString()} / 10,000</span>
                <Button onClick={saveProject} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                  Save Details
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-background/40 p-5 shadow-xl backdrop-blur-md md:p-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Project Files</p>
              <h2 className="mt-1 text-2xl font-semibold">Artwork & attachments</h2>
            </div>
            <span className="text-xs text-muted-foreground">Maximum 200MB per file</span>
          </div>

          <div
            onDragEnter={event => { event.preventDefault(); setDragActive(true); }}
            onDragOver={event => event.preventDefault()}
            onDragLeave={event => { if (event.currentTarget === event.target) setDragActive(false); }}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-[24px] border-2 border-dashed p-8 text-center transition-all ${dragActive ? "border-primary bg-primary/10" : "border-white/15 bg-card/35 hover:border-primary/50 hover:bg-card/55"}`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={event => {
                if (event.target.files) void uploadFiles(Array.from(event.target.files));
                event.target.value = "";
              }}
            />
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <UploadCloud className="size-7" />
            </div>
            <p className="mt-4 font-semibold">Drop files here or click to browse</p>
            <p className="mt-1 text-sm text-muted-foreground">Images, PDF, AI, PSD, ZIP and other project files are supported</p>
          </div>

          {activeUploads.length > 0 && (
            <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-card/40 p-4">
              {activeUploads.map(([name, progress]) => (
                <div key={name}>
                  <div className="mb-2 flex justify-between gap-4 text-xs"><span className="truncate">{name.split("-").slice(0, -2).join("-")}</span><span>{progress}%</span></div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              ))}
            </div>
          )}

          {project.files.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {project.files.map(file => {
                const isImage = file.mimetype.startsWith("image/");
                return (
                  <div key={file._id} className="group overflow-hidden rounded-2xl border border-white/10 bg-card/55">
                    <div className="relative flex h-36 items-center justify-center overflow-hidden bg-background/50">
                      {isImage ? <img src={file.previewUrl} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : <File className="size-10 text-muted-foreground" />}
                    </div>
                    <div className="p-4">
                      <p className="truncate text-sm font-semibold" title={file.originalName}>{file.originalName}</p>
                      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>{formatBytes(file.size)}</span><span>{format(new Date(file.uploadedAt), "dd MMM yyyy")}</span></div>
                      <div className="mt-4 flex gap-2 border-t border-white/10 pt-3">
                        <Button asChild size="sm" variant="outline" className="flex-1">
                          <a href={file.previewUrl} target="_blank" rel="noreferrer"><Download className="mr-1.5 size-3.5" /> Open</a>
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => deleteFile(file)} disabled={deleteMutation.isPending}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
