"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronRight, Download, File, FileImage, Folder, FolderOpen, FolderPlus, Grid3x3, Home, List, Loader2, MoreVertical, Pencil, Save, Share2, Trash2, UploadCloud, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import PageContainer from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Project, ProjectFile, ProjectFolder } from "@/api/projects";
import { createProjectShare } from "@/api/projects";
import { useCreateProjectFolder, useDeleteProject, useDeleteProjectFile, useDeleteProjectFolder, useMoveProjectFolders, useProject, useRenameProjectFolder, useUpdateProject, useUpdateProjectFile, useUploadProjectFile } from "@/hooks/useProjects";
import { useSession } from "next-auth/react";
import { useUsers } from "@/hooks/useUsers";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { forceDownload } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";

const MAX_FILE_SIZE = 200 * 1024 * 1024;

const formatBytes = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

// Free global CDN proxy to downscale large S3 images on the fly
const getThumbUrl = (url: string, w: number, h: number) =>
  `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&h=${h}&fit=cover`;

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading, isError } = useProject(id);
  const project: Project | undefined = data?.data;
  const updateMutation = useUpdateProject(id);
  const deleteProjectMutation = useDeleteProject(id);
  const uploadMutation = useUploadProjectFile(id);
  const deleteMutation = useDeleteProjectFile(id);
  const createFolderMutation = useCreateProjectFolder(id);
  const renameFolderMutation = useRenameProjectFolder(id);
  const deleteFolderMutation = useDeleteProjectFolder(id);
  const moveFolderMutation = useMoveProjectFolders(id);
  const updateFileMutation = useUpdateProjectFile(id);
  const { data: usersData } = useUsers();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const dragCounterRef = useRef(0);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [sharing, setSharing] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState<4 | 6>(4);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [draggedFileIds, setDraggedFileIds] = useState<string[]>([]);
  const [draggedFolderIds, setDraggedFolderIds] = useState<string[]>([]);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const lastSelectedFileIdRef = useRef<string | null>(null);
  const lastSelectedFolderIdRef = useRef<string | null>(null);
  const [uploadFolderId, setUploadFolderId] = useState<string>("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (!project) return;
    setTitle(project.title);
    setDescription(project.description || "");
  }, [project?._id, project?.title, project?.description]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // F2 - Rename selected file or folder
      if (e.key === "F2" && selectedFolderIds.size === 1 && selectedFileIds.size === 0) {
        e.preventDefault();
        const folder = project?.folders.find(f => f._id === [...selectedFolderIds][0]);
        if (folder) startRenamingFolder(folder);
      } else if (e.key === "F2" && selectedFileIds.size === 1) {
        e.preventDefault();
        const fileId = [...selectedFileIds][0];
        const file = project?.files.find(f => f._id === fileId);
        if (file) {
          setRenamingItemId(fileId);
          setRenamingValue(file.originalName);
        }
      }
      // Delete - Delete selected folders and/or files
      if (e.key === "Delete" && (selectedFolderIds.size > 0 || selectedFileIds.size > 0)) {
        e.preventDefault();
        if (selectedFolderIds.size > 0) void deleteFolders([...selectedFolderIds]);
        if (selectedFileIds.size > 0) void deleteFiles([...selectedFileIds]);
      }
      // Ctrl+A - Select all folders and files in current folder
      if (e.ctrlKey && e.key === "a" && containerRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        const visibleFiles = selectedFolderId === null 
          ? project?.files.filter(file => !file.folderId) || []
          : project?.files.filter(file => file.folderId === selectedFolderId) || [];
        const visibleFolders = (project?.folders || []).filter(f =>
          selectedFolderId === null ? !f.parentFolderId : f.parentFolderId === selectedFolderId
        );
        setSelectedFileIds(new Set(visibleFiles.map(f => f._id)));
        setSelectedFolderIds(new Set(visibleFolders.map(f => f._id)));
      }
      // Escape - Clear selection or cancel rename
      if (e.key === "Escape") {
        if (renamingItemId) {
          setRenamingItemId(null);
          setRenamingValue("");
        } else {
          setSelectedFileIds(new Set());
          lastSelectedFileIdRef.current = null;
          setSelectedFolderIds(new Set());
          lastSelectedFolderIdRef.current = null;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedFileIds, selectedFolderIds, project, selectedFolderId, renamingItemId]);

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
          folderId: selectedFolderId || null,
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

  const uploadFilesRef = useRef<(files: File[]) => void>(() => {});
  useEffect(() => {
    uploadFilesRef.current = uploadFiles;
  });

  // Full-screen drag & drop upload — lights up the whole page while files are dragged in.
  useEffect(() => {
    const hasFiles = (e: globalThis.DragEvent) => Array.from(e.dataTransfer.types).includes("Files");

    const handleDragEnter = (e: globalThis.DragEvent) => {
      e.preventDefault();
      if (!hasFiles(e)) return;
      dragCounterRef.current += 1;
      setDragActive(true);
    };

    const handleDragOver = (e: globalThis.DragEvent) => {
      e.preventDefault();
      if (hasFiles(e)) setDragActive(true);
    };

    const handleDragLeave = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
      if (dragCounterRef.current === 0) setDragActive(false);
    };

    const handleDrop = (e: globalThis.DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        uploadFilesRef.current(Array.from(e.dataTransfer.files));
      }
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);

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
      await createFolderMutation.mutateAsync({ name: name.trim(), parentFolderId: selectedFolderId });
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

  const startRenamingFolder = (folder: { _id: string; name: string }) => {
    setRenamingItemId(`folder-${folder._id}`);
    setRenamingValue(folder.name);
  };

  const finishRenamingFolder = async (folderId: string) => {
    if (!renamingValue.trim() || renamingValue === project?.folders.find(f => f._id === folderId)?.name) {
      setRenamingItemId(null);
      setRenamingValue("");
      return;
    }
    try {
      await renameFolderMutation.mutateAsync({ folderId, name: renamingValue.trim() });
      toast.success("Folder renamed");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to rename folder");
    } finally {
      setRenamingItemId(null);
      setRenamingValue("");
    }
  };

  const removeFolder = async (folder: { _id: string; name: string }) => {
    const childCount = project?.folders.filter(f => f.parentFolderId === folder._id).length || 0;
    const warningMsg = childCount > 0 
      ? `Delete ${folder.name} and its ${childCount} subfolder(s)? Files will be kept in the project root.`
      : `Delete ${folder.name}? Files will be kept in the project root.`;
    if (!confirm(warningMsg)) return;
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

  const moveFolders = async (folderIds: string[], parentFolderId: string | null) => {
    try {
      await moveFolderMutation.mutateAsync({ folderIds, parentFolderId });
      setSelectedFolderIds(new Set());
      lastSelectedFolderIdRef.current = null;
      toast.success(`Moved ${folderIds.length} folder${folderIds.length === 1 ? "" : "s"}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to move folders");
    }
  };

  const deleteFolders = async (folderIds: string[]) => {
    const childCount = (project?.folders || []).filter(f => folderIds.includes(f.parentFolderId || "")).length;
    if (!confirm(`Delete ${folderIds.length} selected folder${folderIds.length === 1 ? "" : "s"}${childCount > 0 ? ` and their ${childCount} subfolder(s)` : ""}? Files will be kept in the project root.`)) return;
    try {
      for (const folderId of folderIds) await deleteFolderMutation.mutateAsync(folderId);
      if (selectedFolderId && folderIds.includes(selectedFolderId)) setSelectedFolderId(null);
      setSelectedFolderIds(new Set());
      lastSelectedFolderIdRef.current = null;
      toast.success(`Deleted ${folderIds.length} folder${folderIds.length === 1 ? "" : "s"}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete folders");
    }
  };

  const selectFolderRange = (folderId: string, orderedFolderIds: string[]) => {
    setSelectedFolderIds(current => {
      const next = new Set(current);
      const anchorId = lastSelectedFolderIdRef.current;
      if (anchorId && orderedFolderIds.includes(anchorId)) {
        const start = orderedFolderIds.indexOf(anchorId);
        const end = orderedFolderIds.indexOf(folderId);
        orderedFolderIds.slice(Math.min(start, end), Math.max(start, end) + 1).forEach(id => next.add(id));
      } else {
        next.has(folderId) ? next.delete(folderId) : next.add(folderId);
      }
      return next;
    });
    lastSelectedFolderIdRef.current = folderId;
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

  const removeProject = async () => {
    try {
      const response = await deleteProjectMutation.mutateAsync();
      if (response.data?.shareCleanupFailed) {
        toast.warning("Project deleted, but obsolete share-link records need server cleanup");
      } else {
        toast.success("Project deleted");
      }
      router.push("/admin/projects");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete project");
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
  const canDeleteProject = ["sysadmin", "admin", "boss"].includes(session?.user?.role || "");
  const hasActiveUploads = Object.keys(uploadProgress).length > 0 || uploadMutation.isPending;
  const visibleFiles = selectedFolderId === null ? project.files.filter(file => !file.folderId) : project.files.filter(file => file.folderId === selectedFolderId);
  const allVisibleFilesSelected = visibleFiles.length > 0 && visibleFiles.every(file => selectedFileIds.has(file._id));
  const visibleFolders = selectedFolderId === null ? project.folders.filter(f => !f.parentFolderId) : project.folders.filter(f => f.parentFolderId === selectedFolderId);
  const allVisibleFoldersSelected = visibleFolders.length > 0 && visibleFolders.every(folder => selectedFolderIds.has(folder._id));  // Helper functions for nested folders
  const getFolderPath = (folderId: string | null): Array<{ _id: string | null; name: string }> => {
    if (folderId === null) return [{ _id: null, name: "Project root" }];
    const path: Array<{ _id: string | null; name: string }> = [{ _id: null, name: "Project root" }];
    let currentId: string | null = folderId;
    
    while (currentId) {
      const folder = project.folders.find(f => f._id === currentId);
      if (!folder) break;
      path.push({ _id: folder._id, name: folder.name });
      currentId = folder.parentFolderId || null;
    }
    
    return path.reverse();
  };

  const getRootFolders = () => project.folders.filter(f => !f.parentFolderId);
  const getSubfolders = (parentId: string) => project.folders.filter(f => f.parentFolderId === parentId);
  const getFolderThumbnails = (folderId: string) => {
    return project.files
      .filter(f => f.folderId === folderId && f.mimetype.startsWith("image/"))
      .slice(0, 4)
      .map(f => ({
        url: f.url,
        thumbnail: getThumbUrl(f.url, 240, 240)
      }));
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const breadcrumbPath = getFolderPath(selectedFolderId);

  return (
    <PageContainer>
      <div className={`w-full space-y-6 ${deleteProjectMutation.isPending ? "pointer-events-none opacity-70" : ""}`}>
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-background/40 p-4 shadow-xl backdrop-blur-md md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button asChild variant="ghost" className="rounded-xl">
              <Link href="/admin/projects"><ArrowLeft className="mr-2 size-4" /> Projects</Link>
            </Button>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="hidden text-xs text-muted-foreground sm:block">Updated {format(new Date(project.updatedAt), "dd MMM yyyy, HH:mm")}</div>
              {canDeleteProject && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleteProjectMutation.isPending || hasActiveUploads} title={hasActiveUploads ? "Wait for uploads to finish before deleting this project" : undefined}>
                      {deleteProjectMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />} Delete Project
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl border-white/10 bg-card/95">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete “{project.title}”?</AlertDialogTitle>
                      <AlertDialogDescription>This permanently deletes the project, its folders, all files recorded in this project, and every active share link. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void removeProject()}>Delete Project</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="outline" onClick={shareProject} disabled={sharing || Boolean(project.deletingAt)}>
                {sharing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Share2 className="mr-2 size-4" />} Share Project
              </Button>
            </div>
          </div>

          {project.deletingAt && <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">A previous deletion attempt did not finish. Project editing is locked; use Delete Project again to retry cleanup.</div>}

          <div className={`grid gap-6 xl:grid-cols-[1.35fr_1fr] ${project.deletingAt ? "pointer-events-none opacity-60" : ""}`}>
            <div className="relative min-h-[280px] overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-primary/20 via-card to-card md:min-h-[390px]">
              {heroImage ? (
                <img src={getThumbUrl(heroImage.url, 1200, 800)} alt="" className="absolute inset-0 h-full w-full object-cover" />
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

        <div className={`rounded-3xl border border-white/10 bg-background/40 p-5 shadow-xl backdrop-blur-md md:p-7 ${project.deletingAt ? "pointer-events-none opacity-60" : ""}`}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Project Files</p>
              <h2 className="mt-1 text-2xl font-semibold">Artwork & attachments</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={createFolder}><FolderPlus className="mr-1.5 size-3.5" /> Folder</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}><UploadCloud className="mr-1.5 size-3.5" /> Upload</Button>
              {visibleFiles.length > 0 && <Button type="button" variant="outline" size="sm" onClick={() => {
                if (allVisibleFilesSelected) {
                  setSelectedFileIds(new Set());
                  lastSelectedFileIdRef.current = null;
                } else {
                  setSelectedFileIds(new Set(visibleFiles.map(file => file._id)));
                  lastSelectedFileIdRef.current = visibleFiles[0]._id;
                }
              }}>{allVisibleFilesSelected ? "Clear all" : "Select all"}</Button>}
              <div className="h-6 w-px bg-border" />
              <Button type="button" variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}><List className="size-4" /></Button>
              <Button type="button" variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}><Grid3x3 className="size-4" /></Button>
              {viewMode === "grid" && (
                <>
                  <Button type="button" variant={gridSize === 4 ? "default" : "outline"} size="sm" onClick={() => setGridSize(4)}>4 x 4</Button>
                  <Button type="button" variant={gridSize === 6 ? "default" : "outline"} size="sm" onClick={() => setGridSize(6)}>6 x 6</Button>
                </>
              )}
            </div>
          </div>

          {/* Breadcrumb Navigation Bar */}
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-card/30 p-3 text-sm">
            {breadcrumbPath.map((item, index) => {
              const isLast = index === breadcrumbPath.length - 1;
              return (
                <div key={item._id || "root"} className="flex items-center gap-2">
                  {index > 0 && <ChevronRight className="size-4 text-muted-foreground" />}
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(item._id)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      isLast ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item._id === null ? <Home className="size-4" /> : <Folder className="size-4" />}
                    <span>{item.name}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Folder Explorer View (Windows 11 Style) */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {/* Show Root button if inside a folder */}
            {selectedFolderId !== null && (
              <div
                onClick={() => setSelectedFolderId(null)}
                onDragEnter={event => { event.preventDefault(); setDragOverFolderId("ROOT"); }}
                onDragOver={event => event.preventDefault()}
                onDragLeave={event => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                    setDragOverFolderId(current => current === "ROOT" ? null : current);
                  }
                }}
                onDrop={event => {
                  event.preventDefault();
                  setDragOverFolderId(null);
                  if (draggedFolderIds.length > 0) { void moveFolders(draggedFolderIds, null); setDraggedFolderIds([]); }
                  if (draggedFileIds.length > 0) { void moveFiles(draggedFileIds, null); setDraggedFileIds([]); }
                }}
                className={`group relative flex cursor-pointer flex-col items-start rounded-2xl border border-dashed p-4 transition-colors ${
                  dragOverFolderId === "ROOT" ? "border-primary bg-primary/10" : "border-primary/40 bg-primary/5 hover:bg-primary/10"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="size-7 text-primary" />
                  <span className="text-sm font-semibold text-primary">← Go to Root</span>
                </div>
                <span className="mt-2 text-xs text-muted-foreground">Click to return to root level</span>
              </div>
            )}

            {/* Render Current Level Folders */}
            {visibleFolders.map(folder => {
              const isActive = selectedFolderId === folder._id;
              const isSelected = selectedFolderIds.has(folder._id);
              const subfolderCount = getSubfolders(folder._id).length;
              const fileCount = project.files.filter(f => f.folderId === folder._id).length;
              const thumbnails = getFolderThumbnails(folder._id);
              const isRenaming = renamingItemId === `folder-${folder._id}`;
              const visibleFolderIds = visibleFolders.map(f => f._id);

              return (
                <ContextMenu key={folder._id}>
                  <ContextMenuTrigger>
                    <div
                      draggable
                      onDragStart={() => setDraggedFolderIds(isSelected ? [...selectedFolderIds] : [folder._id])}
                      onDragEnd={() => { setDraggedFolderIds([]); setDragOverFolderId(null); }}
                      onDragEnter={event => { event.preventDefault(); setDragOverFolderId(folder._id); }}
                      onDragOver={event => event.preventDefault()}
                      onDragLeave={event => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                          setDragOverFolderId(current => current === folder._id ? null : current);
                        }
                      }}
                      onDrop={event => {
                        event.preventDefault();
                        setDragOverFolderId(null);
                        if (draggedFolderIds.length > 0) {
                          const targetIsDragged = draggedFolderIds.includes(folder._id);
                          const targetIsDraggedChild = draggedFolderIds.some(id =>
                            project.folders.some(f => f.parentFolderId === id && f._id === folder._id)
                          );
                          if (!targetIsDragged && !targetIsDraggedChild) {
                            void moveFolders(draggedFolderIds, folder._id);
                          }
                          setDraggedFolderIds([]);
                        }
                        if (draggedFileIds.length > 0) {
                          void moveFiles(draggedFileIds, folder._id);
                          setDraggedFileIds([]);
                        }
                      }}
                      onDoubleClick={() => setSelectedFolderId(folder._id)}
                      onClick={event => {
                        if (event.shiftKey) {
                          event.preventDefault();
                          selectFolderRange(folder._id, visibleFolderIds);
                        } else {
                          setSelectedFolderId(folder._id);
                        }
                      }}
                      className={`group relative rounded-2xl border p-4 transition-colors cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : isActive
                            ? "border-primary bg-primary/10"
                            : dragOverFolderId === folder._id
                              ? "border-primary border-dashed bg-primary/10"
                              : "border-border/60 bg-card/50 hover:border-primary/50"
                      }`}
                    >
                       {/* Folder Thumbnails (Windows 11 Preview) */}
                       <div className="mb-2 relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-background/50 p-2">
                         {thumbnails.length > 0 ? (
                           <div className={`grid h-full w-full gap-1 ${thumbnails.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                             {thumbnails.map((thumb, idx) => (
                               <img 
                                 key={idx} 
                                 src={thumb.thumbnail} 
                                 alt="" 
                                 className="h-full w-full object-cover rounded"
                                 loading="lazy"
                               />
                             ))}
                           </div>
                         ) : (
                           <Folder className="size-16 text-primary/80" />
                         )}
                       </div>

                      {/* Folder Name & Details */}
                      {isRenaming ? (
                        <Input
                          value={renamingValue}
                          onChange={e => setRenamingValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") void finishRenamingFolder(folder._id);
                            if (e.key === "Escape") {
                              setRenamingItemId(null);
                              setRenamingValue("");
                            }
                          }}
                          onBlur={() => void finishRenamingFolder(folder._id)}
                          autoFocus
                          className="h-7 text-xs"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex w-full flex-col">
                          <span className="w-full truncate text-sm font-semibold">{folder.name}</span>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{fileCount} files</span>
                            {subfolderCount > 0 && <span>{subfolderCount} subfolders</span>}
                          </div>
                        </div>
                      )}

                      {/* Quick Action Buttons */}
                      <div className="absolute right-2 top-2 flex opacity-0 transition-opacity group-hover:opacity-100 bg-background/80 rounded-lg p-0.5">
                        <Button type="button" size="icon" variant="ghost" className="size-6" onClick={e => { e.stopPropagation(); startRenamingFolder(folder); }}>
                          <Pencil className="size-3" />
                        </Button>
                        <Button type="button" size="icon" variant="ghost" className="size-6 text-destructive" onClick={e => { e.stopPropagation(); removeFolder(folder); }}>
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-48">
                    <ContextMenuItem onClick={() => setSelectedFolderId(folder._id)}>
                      <FolderOpen className="mr-2 size-4" /> Open Folder
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => startRenamingFolder(folder)}>
                      <Pencil className="mr-2 size-4" /> Rename (F2)
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem className="text-destructive" onClick={() => removeFolder(folder)}>
                      <Trash2 className="mr-2 size-4" /> Delete (Del)
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>

          {(selectedFolderIds.size > 0 || selectedFileIds.size > 0) && (
            <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 p-3">
              <span className="mr-1 text-sm font-semibold">
                {selectedFolderIds.size > 0 && `${selectedFolderIds.size} folder${selectedFolderIds.size === 1 ? "" : "s"}`}
                {selectedFolderIds.size > 0 && selectedFileIds.size > 0 && " · "}
                {selectedFileIds.size > 0 && `${selectedFileIds.size} file${selectedFileIds.size === 1 ? "" : "s"}`} selected
              </span>
              <select defaultValue="" onChange={event => { if (event.target.value !== "") { const target = event.target.value === "root" ? null : event.target.value; if (selectedFolderIds.size > 0) void moveFolders([...selectedFolderIds], target); if (selectedFileIds.size > 0) void moveFiles([...selectedFileIds], target); event.target.value = ""; } }} className="h-8 rounded-md border bg-background px-2 text-xs">
                <option value="" disabled>Move to folder...</option>
                <option value="root">Project root</option>
                {project.folders.filter(folder => !selectedFolderIds.has(folder._id)).map(folder => <option key={folder._id} value={folder._id}>{folder.name}</option>)}
              </select>
              {selectedFileIds.size === 1 && selectedFolderIds.size === 0 && <Button type="button" size="sm" variant="outline" onClick={() => { const file = project.files.find(item => item._id === [...selectedFileIds][0]); if (file) void editFile(file); }}>Rename / notes</Button>}
              <Button type="button" size="sm" variant="destructive" onClick={() => { if (selectedFolderIds.size > 0) void deleteFolders([...selectedFolderIds]); if (selectedFileIds.size > 0) void deleteFiles([...selectedFileIds]); }}>Delete</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setSelectedFileIds(new Set()); lastSelectedFileIdRef.current = null; setSelectedFolderIds(new Set()); lastSelectedFolderIdRef.current = null; }}>Clear</Button>
            </div>
          )}

          {/* Hidden File Input */}
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

          {activeUploads.length > 0 && (
            <div className="mb-5 space-y-3 rounded-2xl border border-white/10 bg-card/40 p-4">
              {activeUploads.map(([name, progress]) => (
                <div key={name}>
                  <div className="mb-2 flex justify-between gap-4 text-xs"><span className="truncate">{name.split("-").slice(0, -2).join("-")}</span><span>{progress}%</span></div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              ))}
            </div>
          )}

          {/* File section wrapper (drag & drop handled at page level via full-screen overlay) */}
          <div ref={containerRef} className="relative transition-colors rounded-xl">

          {visibleFiles.length > 0 && viewMode === "grid" && (
            <div className={`mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 ${gridSize === 4 ? "xl:grid-cols-4" : "xl:grid-cols-6"}`}>
              {visibleFiles.map(file => {
                const isImage = file.mimetype.startsWith("image/");
                return (
                  <ContextMenu key={file._id}>
                    <ContextMenuTrigger>
                      <div
                        draggable
                        onDragStart={() => setDraggedFileIds(selectedFileIds.has(file._id) ? [...selectedFileIds] : [file._id])}
                        onDragEnd={() => setDraggedFileIds([])}
                        onClick={event => { if (event.shiftKey) selectFileRange(file._id, visibleFiles.map(item => item._id)); else { setSelectedFileIds(prev => { const next = new Set(prev); if (next.has(file._id)) next.delete(file._id); else next.add(file._id); return next; }); } }}
                        className={`group overflow-hidden rounded-2xl border bg-card/55 cursor-pointer ${selectedFileIds.has(file._id) ? "border-primary ring-2 ring-primary/40" : "border-white/10"}`}
                      >
                        <div className="relative flex h-32 items-center justify-center overflow-hidden bg-background/50">
                          {isImage ? <button type="button" className="h-full w-full" onClick={event => { event.stopPropagation(); if (!event.shiftKey) setPreviewFile(file); }}><img src={getThumbUrl(file.url, 400, 300)} alt={file.originalName} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" /></button> : <File className="size-10 text-muted-foreground" />}
                        </div>
                        <div className="relative p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" size="icon" variant="ghost" className="absolute right-2 top-2 h-7 w-7" title="File options" onClick={e => e.stopPropagation()}><MoreVertical className="size-4" /></Button>
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
                            <Button size="icon" variant="outline" className="h-[30px] w-[30px]" title="Download" onClick={(e) => { e.stopPropagation(); forceDownload(file.previewUrl, file.originalName); }}><Download className="size-3.5" /></Button>
                            <Button size="icon" variant="outline" className="h-[30px] w-[30px] text-destructive hover:text-destructive" title="Delete" onClick={(e) => { e.stopPropagation(); deleteFile(file); }} disabled={deleteMutation.isPending}><Trash2 className="size-3.5" /></Button>
                            <Button size="icon" variant="outline" className="h-[30px] w-[30px]" title="Edit name and notes" onClick={(e) => { e.stopPropagation(); editFile(file); }}><Pencil className="size-3.5" /></Button>
                          </div>
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem onClick={() => setPreviewFile(file)}>
                        <FileImage className="mr-2 size-4" /> Preview
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => forceDownload(file.previewUrl, file.originalName)}>
                        <Download className="mr-2 size-4" /> Download
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => editFile(file)}>
                        <Pencil className="mr-2 size-4" /> Rename (F2)
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem className="text-destructive" onClick={() => deleteFile(file)}>
                        <Trash2 className="mr-2 size-4" /> Delete (Del)
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>
          )}

          {visibleFiles.length > 0 && viewMode === "list" && (
            <div className="mt-6 space-y-1">
              {/* List View Header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_100px] gap-4 border-b border-white/10 px-4 py-2 text-xs font-semibold text-muted-foreground">
                <div>Name</div>
                <div>Date Modified</div>
                <div>Type</div>
                <div>Size</div>
              </div>
              
              {/* List View Items */}
              {visibleFiles.map(file => {
                const isImage = file.mimetype.startsWith("image/");
                return (
                  <ContextMenu key={file._id}>
                    <ContextMenuTrigger>
                      <div
                        draggable
                        onDragStart={() => setDraggedFileIds(selectedFileIds.has(file._id) ? [...selectedFileIds] : [file._id])}
                        onDragEnd={() => setDraggedFileIds([])}
                        onClick={event => { if (event.shiftKey) selectFileRange(file._id, visibleFiles.map(item => item._id)); else { setSelectedFileIds(prev => { const next = new Set(prev); if (next.has(file._id)) next.delete(file._id); else next.add(file._id); return next; }); } }}
                        onDoubleClick={() => isImage && setPreviewFile(file)}
                        className={`group grid grid-cols-[2fr_1fr_1fr_100px] gap-4 items-center rounded-lg border px-4 py-3 transition-colors cursor-pointer ${
                          selectedFileIds.has(file._id) ? "border-primary bg-primary/10" : "border-transparent hover:bg-card/60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background/50">
                            {isImage ? <img src={getThumbUrl(file.url, 96, 96)} alt="" className="h-full w-full object-cover" loading="lazy" /> : <File className="size-5 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium" title={file.originalName}>{file.originalName}</p>
                            {file.notes && <p className="truncate text-xs text-muted-foreground">{file.notes}</p>}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">{format(new Date(file.uploadedAt), "dd MMM yyyy, HH:mm")}</div>
                        <div className="text-sm text-muted-foreground">{file.mimetype.split('/')[1]?.toUpperCase() || 'FILE'}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{formatBytes(file.size)}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}><MoreVertical className="size-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel>File options</DropdownMenuLabel>
                              {isImage && <DropdownMenuItem onClick={() => updateMutation.mutate({ coverFileId: file._id })}>{project.coverFileId === file._id ? "Project cover" : "Set as cover"}</DropdownMenuItem>}
                              {isImage && <DropdownMenuSeparator />}
                              <DropdownMenuItem onClick={() => moveFile(file, "")}>Project root{!file.folderId && " (current)"}</DropdownMenuItem>
                              {project.folders.map(folder => <DropdownMenuItem key={folder._id} onClick={() => moveFile(file, folder._id)}>{folder.name}{file.folderId === folder._id && " (current)"}</DropdownMenuItem>)}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem onClick={() => isImage && setPreviewFile(file)}>
                        <FileImage className="mr-2 size-4" /> Preview
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => forceDownload(file.previewUrl, file.originalName)}>
                        <Download className="mr-2 size-4" /> Download
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => editFile(file)}>
                        <Pencil className="mr-2 size-4" /> Rename (F2)
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem className="text-destructive" onClick={() => deleteFile(file)}>
                        <Trash2 className="mr-2 size-4" /> Delete (Del)
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>
      <Dialog open={!!previewFile} onOpenChange={open => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-[95vw] bg-black p-2 sm:max-w-4xl">
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          {previewFile && <img src={previewFile.previewUrl} alt={previewFile.originalName} className="max-h-[85vh] w-full rounded object-contain" />}
        </DialogContent>
      </Dialog>

      {dragActive && (
        <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-primary/10 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-primary bg-background/85 px-12 py-10 shadow-2xl">
            <UploadCloud className="size-14 animate-bounce text-primary" />
            <p className="text-xl font-bold text-primary">Drop files to upload</p>
            <p className="text-sm text-muted-foreground">
              to {selectedFolderId ? project.folders.find(f => f._id === selectedFolderId)?.name || "current folder" : "Project root"}
            </p>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
