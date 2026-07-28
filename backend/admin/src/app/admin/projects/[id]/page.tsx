"use client";

import { DragEvent, use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, File, FileImage, Folder, FolderPlus, Loader2, MoreVertical, Pencil, Save, Share2, Trash2, UploadCloud, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Project, ProjectFile } from "@/api/projects";
import { createProjectShare } from "@/api/projects";
import { useCreateProjectFolder, useDeleteProjectFile, useDeleteProjectFolder, useProject, useRenameProjectFolder, useUpdateProject, useUpdateProjectFile, useUploadProjectFile } from "@/hooks/useProjects";
import { useSession } from "next-auth/react";
import { useUsers } from "@/hooks/useUsers";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { forceDownload } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const createFolderMutation = useCreateProjectFolder(id);
  const renameFolderMutation = useRenameProjectFolder(id);
  const deleteFolderMutation = useDeleteProjectFolder(id);
  const updateFileMutation = useUpdateProjectFile(id);
  const { data: usersData } = useUsers();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [sharing, setSharing] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<4 | 6>(4);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [draggedFileIds, setDraggedFileIds] = useState<string[]>([]);
  const lastSelectedFileIdRef = useRef<string | null>(null);

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

  const createFolder = async () => {
    const name = window.prompt("Folder name");
    if (!name?.trim()) return;
    try {
      await createFolderMutation.mutateAsync(name.trim());
      toast.success("Folder created");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create folder");
    }
  };

  const renameFolder = async (folder: { _id: string; name: string }) => {
    const name = window.prompt("Folder name", folder.name);
    if (!name?.trim() || name.trim() === folder.name) return;
    try {
      await renameFolderMutation.mutateAsync({ folderId: folder._id, name: name.trim() });
      toast.success("Folder renamed");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to rename folder");
    }
  };

  const removeFolder = async (folder: { _id: string; name: string }) => {
    if (!confirm(`Delete ${folder.name}? Files will be kept in the project root.`)) return;
    try {
      await deleteFolderMutation.mutateAsync(folder._id);
      if (selectedFolderId === folder._id) setSelectedFolderId(null);
      toast.success("Folder deleted");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete folder");
    }
  };

  const editFile = async (file: ProjectFile) => {
    const originalName = window.prompt("File name", file.originalName);
    if (originalName === null) return;
    const notes = window.prompt("File notes", file.notes || "");
    if (notes === null) return;
    try {
      await updateFileMutation.mutateAsync({ fileId: file._id, data: { originalName: originalName.trim() || file.originalName, notes } });
      toast.success("File updated");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update file");
    }
  };

  const moveFile = async (file: ProjectFile, folderId: string) => {
    try {
      await updateFileMutation.mutateAsync({ fileId: file._id, data: { folderId: folderId || null } });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to move file");
    }
  };

  const moveFiles = async (fileIds: string[], folderId: string | null) => {
    try {
      for (const fileId of fileIds) {
        await updateFileMutation.mutateAsync({ fileId, data: { folderId } });
      }
      setSelectedFileIds(new Set());
      lastSelectedFileIdRef.current = null;
      toast.success(`Moved ${fileIds.length} file${fileIds.length === 1 ? "" : "s"}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to move files");
    }
  };

  const deleteFiles = async (fileIds: string[]) => {
    if (!confirm(`Delete ${fileIds.length} selected file${fileIds.length === 1 ? "" : "s"}?`)) return;
    try {
      for (const fileId of fileIds) await deleteMutation.mutateAsync(fileId);
      setSelectedFileIds(new Set());
      lastSelectedFileIdRef.current = null;
      toast.success(`Deleted ${fileIds.length} file${fileIds.length === 1 ? "" : "s"}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete files");
    }
  };

  const selectFileRange = (fileId: string, orderedFileIds: string[]) => {
    setSelectedFileIds(current => {
      const next = new Set(current);
      const anchorId = lastSelectedFileIdRef.current;
      if (anchorId && orderedFileIds.includes(anchorId)) {
        const start = orderedFileIds.indexOf(anchorId);
        const end = orderedFileIds.indexOf(fileId);
        orderedFileIds.slice(Math.min(start, end), Math.max(start, end) + 1).forEach(id => next.add(id));
      } else {
        next.has(fileId) ? next.delete(fileId) : next.add(fileId);
      }
      return next;
    });
    lastSelectedFileIdRef.current = fileId;
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

  const heroImage = project.files.find(file => file._id === project.coverFileId) || project.files.find(file => file.mimetype.startsWith("image/"));
  const activeUploads = Object.entries(uploadProgress);
  const users = usersData?.users || [];
  const visibleFiles = selectedFolderId === null ? project.files.filter(file => !file.folderId) : project.files.filter(file => file.folderId === selectedFolderId);
  const folders = [{ _id: "", name: "Project root", count: project.files.filter(file => !file.folderId).length }, ...project.folders.map(folder => ({ ...folder, count: project.files.filter(file => file.folderId === folder._id).length }))];
  const allVisibleFilesSelected = visibleFiles.length > 0 && visibleFiles.every(file => selectedFileIds.has(file._id));

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
              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"><Users className="size-3.5" /> Assigned users</div>
                <div className="flex flex-wrap gap-2">
                  {users.map((user: any) => {
                    const assigned = project.assigneeIds?.includes(user._id);
                    return <Button key={user._id} type="button" size="sm" variant={assigned ? "default" : "outline"} className="h-7" onClick={() => updateMutation.mutate({ assigneeIds: assigned ? project.assigneeIds.filter(userId => userId !== user._id) : [...(project.assigneeIds || []), user._id] })}>{user.name || user.email}</Button>;
                  })}
                </div>
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
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={createFolder}><FolderPlus className="mr-1.5 size-3.5" /> Folder</Button>
              {visibleFiles.length > 0 && <Button type="button" variant="outline" size="sm" onClick={() => {
                if (allVisibleFilesSelected) {
                  setSelectedFileIds(new Set());
                  lastSelectedFileIdRef.current = null;
                } else {
                  setSelectedFileIds(new Set(visibleFiles.map(file => file._id)));
                  lastSelectedFileIdRef.current = visibleFiles[0]._id;
                }
              }}>{allVisibleFilesSelected ? "Clear all" : "Select all"}</Button>}
              <Button type="button" variant={gridSize === 4 ? "default" : "outline"} size="sm" onClick={() => setGridSize(4)}>4 x 4</Button>
              <Button type="button" variant={gridSize === 6 ? "default" : "outline"} size="sm" onClick={() => setGridSize(6)}>6 x 6</Button>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {folders.map(folder => {
              const isRoot = !folder._id;
              const isActive = selectedFolderId === (folder._id || null);
              return (
                <div
                  key={folder._id || "root"}
                  onDragOver={event => event.preventDefault()}
                  onDrop={event => {
                    event.preventDefault();
                    void moveFiles(draggedFileIds, folder._id || null);
                    setDraggedFileIds([]);
                  }}
                  className={`group relative rounded-2xl border p-3 transition-colors ${isActive ? "border-primary bg-primary/10" : "border-border/60 bg-card/50 hover:border-primary/50"}`}
                >
                  <button type="button" className="flex w-full flex-col items-start gap-2 text-left" onClick={() => setSelectedFolderId(folder._id || null)}>
                    <Folder className="size-7 text-primary" />
                    <span className="w-full truncate text-sm font-semibold">{folder.name}</span>
                    <span className="text-xs text-muted-foreground">{folder.count} files</span>
                  </button>
                  {!isRoot && <div className="absolute right-2 top-2 flex opacity-0 transition-opacity group-hover:opacity-100">
                    <Button type="button" size="icon" variant="ghost" className="size-6" onClick={() => renameFolder(folder)}><Pencil className="size-3" /></Button>
                    <Button type="button" size="icon" variant="ghost" className="size-6 text-destructive" onClick={() => removeFolder(folder)}><Trash2 className="size-3" /></Button>
                  </div>}
                </div>
              );
            })}
          </div>

          {selectedFileIds.size > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-3">
              <span className="mr-1 text-sm font-semibold">{selectedFileIds.size} selected</span>
              <select defaultValue="" onChange={event => { if (event.target.value !== "") void moveFiles([...selectedFileIds], event.target.value === "root" ? null : event.target.value); event.target.value = ""; }} className="h-8 rounded-md border bg-background px-2 text-xs">
                <option value="" disabled>Move to folder...</option>
                <option value="root">Project root</option>
                {project.folders.map(folder => <option key={folder._id} value={folder._id}>{folder.name}</option>)}
              </select>
              {selectedFileIds.size === 1 && <Button type="button" size="sm" variant="outline" onClick={() => { const file = project.files.find(item => item._id === [...selectedFileIds][0]); if (file) void editFile(file); }}>Rename / notes</Button>}
              <Button type="button" size="sm" variant="destructive" onClick={() => void deleteFiles([...selectedFileIds])}>Delete</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setSelectedFileIds(new Set()); lastSelectedFileIdRef.current = null; }}>Clear</Button>
            </div>
          )}

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

          {visibleFiles.length > 0 && (
            <div className={`mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 ${gridSize === 4 ? "xl:grid-cols-4" : "xl:grid-cols-6"}`}>
              {visibleFiles.map(file => {
                const isImage = file.mimetype.startsWith("image/");
                return (
                  <div
                    key={file._id}
                    draggable
                    onDragStart={() => setDraggedFileIds(selectedFileIds.has(file._id) ? [...selectedFileIds] : [file._id])}
                    onDragEnd={() => setDraggedFileIds([])}
                    onClick={event => { if (event.shiftKey) selectFileRange(file._id, visibleFiles.map(item => item._id)); }}
                    className={`group overflow-hidden rounded-2xl border bg-card/55 ${selectedFileIds.has(file._id) ? "border-primary ring-2 ring-primary/40" : "border-white/10"}`}
                  >
                    <div className="relative flex h-32 items-center justify-center overflow-hidden bg-background/50">
                      {isImage ? <button type="button" className="h-full w-full" onClick={event => { if (!event.shiftKey) setPreviewFile(file); }}><img src={file.previewUrl} alt={file.originalName} className="h-full w-full object-cover transition-transform group-hover:scale-105" /></button> : <File className="size-10 text-muted-foreground" />}
                    </div>
                    <div className="relative p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" size="icon" variant="ghost" className="absolute right-2 top-2 h-7 w-7" title="File options"><MoreVertical className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel>File options</DropdownMenuLabel>
                          {isImage && <DropdownMenuItem onClick={() => updateMutation.mutate({ coverFileId: file._id })}>{project.coverFileId === file._id ? "Project cover" : "Set as cover"}</DropdownMenuItem>}
                          {isImage && <DropdownMenuSeparator />}
                          <DropdownMenuItem onClick={() => moveFile(file, "")}>Project root{!file.folderId && " (current)"}</DropdownMenuItem>
                          {project.folders.map(folder => <DropdownMenuItem key={folder._id} onClick={() => moveFile(file, folder._id)}>{folder.name}{file.folderId === folder._id && " (current)"}</DropdownMenuItem>)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <p className="truncate text-sm font-semibold" title={file.originalName}>{file.originalName}</p>
                      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>{formatBytes(file.size)}</span><span>{format(new Date(file.uploadedAt), "dd MMM yyyy")}</span></div>
                      {file.notes && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{file.notes}</p>}
                      <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
                        <Button size="icon" variant="outline" className="h-[30px] w-[30px]" title="Download" onClick={() => forceDownload(file.previewUrl, file.originalName)}><Download className="size-3.5" /></Button>
                        <Button size="icon" variant="outline" className="h-[30px] w-[30px] text-destructive hover:text-destructive" title="Delete" onClick={() => deleteFile(file)} disabled={deleteMutation.isPending}><Trash2 className="size-3.5" /></Button>
                        <Button size="icon" variant="outline" className="h-[30px] w-[30px]" title="Edit name and notes" onClick={() => editFile(file)}><Pencil className="size-3.5" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Dialog open={!!previewFile} onOpenChange={open => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-[95vw] bg-black p-2 sm:max-w-4xl">
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          {previewFile && <img src={previewFile.previewUrl} alt={previewFile.originalName} className="max-h-[85vh] w-full rounded object-contain" />}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
