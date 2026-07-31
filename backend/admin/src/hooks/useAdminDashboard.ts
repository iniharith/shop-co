/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { useSession } from "next-auth/react";
import AxiosInstance from "@/utils/axios";
import { useQueryData } from "./useQueryData";
import { useMutationData } from "./useMutation";
import { 
    getParcelStats, 
    getParcels, 
    syncParcelTracking, 
    syncAllParcelTracking,
    updateParcel,
    getCustomerUpdateSettings,
    updateCustomerUpdateSettings,
    sendWhatsAppNotification, 
    getFileStats, 
    getGroupedFiles, 
    getAllFiles,
    getFileIndex,
    getFolderGroup,
    getFilesByFolder,
    reviewFile, 
    deleteFile,
    bulkDeleteFiles,
    createShareLink,
    getFolders,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFile,
    getDashboardSummary,
    resolveFileByPath
} from "@/api/admin-dashboard";

export const useParcelStats = () => {
    const { data: session } = useSession();
    return useQueryData(['parcelStats'], () => getParcelStats(session?.user?.token));
}

export const useParcels = (filters?: any) => {
    const { data: session, status } = useSession();
    return useQueryData(
        ['parcels', filters],
        () => getParcels(session?.user?.token),
        { enabled: status !== 'loading', refetchInterval: 60_000 }
    );
}

export const useSyncParcel = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['syncParcelTracking'], (id: string) => syncParcelTracking(session?.user?.token, id), ['parcels', 'orders']);
    return { mutate, isPending };
}

export const useSyncAllParcels = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['syncAllParcelTracking'], () => syncAllParcelTracking(session?.user?.token), ['parcels', 'orders']);
    return { mutate, isPending };
}

export const useUpdateParcel = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['updateParcelTracking'], ({ id, data }: { id: string, data: any }) => updateParcel(session?.user?.token, id, data), ['parcels']);
    return { mutate, isPending };
}

export const useCustomerUpdateSettings = () => {
    const { data: session, status } = useSession();
    return useQueryData(
        ['whatsappCustomerUpdates'],
        () => getCustomerUpdateSettings(session?.user?.token),
        { enabled: status === 'authenticated' }
    );
}

export const useUpdateCustomerUpdateSettings = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['updateWhatsAppCustomerUpdates'],
        (enabled: boolean) => updateCustomerUpdateSettings(session?.user?.token, enabled),
        ['whatsappCustomerUpdates']
    );
    return { mutate, isPending };
}

export const useSendWhatsApp = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['sendWhatsApp'], (id: string) => sendWhatsAppNotification(session?.user?.token, id));
    return { mutate, isPending };
}

export const useFileStats = () => {
    const { data: session, status } = useSession();
    return useQueryData(['fileStats'], () => getFileStats(session?.user?.token), { enabled: status === 'authenticated', staleTime: 60_000 });
}

export const useGroupedFiles = () => {
    const { data: session, status } = useSession();
    return useQueryData(['groupedFiles'], () => getGroupedFiles(session?.user?.token), { enabled: status === 'authenticated', staleTime: 300_000 });
}

export const useAllFiles = (search?: string) => {
    const { data: session, status } = useSession();
    return useQueryData(
        ['allFiles', search],
        () => getAllFiles(session?.user?.token, search),
        { enabled: status === "authenticated" && search !== "", staleTime: 0 }
    );
}

export const useFileIndex = () => {
    const { data: session, status } = useSession();
    return useQueryData(
        ['fileIndex'],
        () => getFileIndex(session?.user?.token),
        { enabled: status === "authenticated", staleTime: 300_000 }
    );
}

// Server-side grouped folder data — replaces the expensive client-side join
// between files, tasks, orders and users. Accepts optional task status filter.
export const useFolderGroup = (taskStatuses?: string[]) => {
    const { data: session, status } = useSession();
    return useQueryData(
        ['folderGroup', taskStatuses],
        () => getFolderGroup(session?.user?.token, taskStatuses),
        {
            enabled: status === "authenticated",
            staleTime: 0,           // always refetch — ensures moved folders don't re-appear on navigation
            refetchOnWindowFocus: true,
            refetchOnMount: true,
        }
    );
}

export const useFilesByFolder = (params: { taskId?: string | null; orderId?: string | null; userId?: string | null } | null) => {
    const { data: session, status } = useSession();
    const key = params ? (params.taskId || `${params.orderId || ''}:${params.userId || ''}`) : null;
    return useQueryData(
        ['filesByFolder', key],
        () => getFilesByFolder(session?.user?.token, {
            taskId: params?.taskId || undefined,
            orderId: params?.orderId || undefined,
            userId: params?.userId || undefined,
        }),
        { enabled: status === "authenticated" && !!params && !!key, staleTime: 0 }
    );
}

export const useReviewFile = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['reviewFile'], ({ id, reviewed, notes }: any) => reviewFile(session?.user?.token, id, reviewed, notes), ['groupedFiles', 'fileIndex', 'folderGroup', 'filesByFolder']);
    return { mutate, isPending };
}

export const useDeleteFile = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['deleteFile'], (id: string) => deleteFile(session?.user?.token, id), ['groupedFiles', 'allFiles', 'tasks', 'fileIndex', 'folderGroup', 'filesByFolder']);
    return { mutate, isPending };
}

export const useBulkDeleteFiles = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['bulkDeleteFiles'], (fileIds: string[]) => bulkDeleteFiles(session?.user?.token, fileIds), ['groupedFiles', 'allFiles', 'tasks', 'fileIndex', 'folderGroup', 'filesByFolder']);
    return { mutate, isPending };
}

export const useRenameFile = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['renameFile'],
        (data: { id: string, originalName: string }) => AxiosInstance(session?.user?.token).put(`/api/files//name`, { originalName: data.originalName }),
        ['allFiles', 'groupedFiles', 'tasks', 'fileIndex', 'folderGroup', 'filesByFolder']
    );
    return { mutate, isPending };
}

export const useCreateShareLink = () => {
    const { data: session } = useSession();
    const { mutate, mutateAsync, isPending } = useMutationData(
        ['createShareLink'],
        (data: { folderName: string; taskId?: string; orderId?: string; userId?: string; folderId?: string; audience?: 'CUSTOMER' | 'SUPPLIER' }) =>
            createShareLink(session?.user?.token, data)
    );
    return { mutate, mutateAsync, isPending };
}

// Self-healing lookup for the per-file "Share" button: guarantees a real,
// working FileUpload id even if the original upload-time sync silently
// failed for that file.
export const useResolveFileByPath = () => {
    const { data: session } = useSession();
    const { mutate, mutateAsync, isPending } = useMutationData(
        ['resolveFileByPath'],
        (data: { path: string; name: string; mimetype?: string; size?: number; taskId?: string; orderId?: string; category?: string; tag?: string }) =>
            resolveFileByPath(session?.user?.token, data)
    );
    return { mutate, mutateAsync, isPending };
}

export const useFolders = () => {
    const { data: session, status } = useSession();
    return useQueryData(
        ['virtualFolders'],
        () => getFolders(session?.user?.token),
        { enabled: status === "authenticated", staleTime: 60_000 }
    );
}

export const useCreateFolder = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['createFolder'],
        (data: { name: string; taskId?: string; userId?: string }) => createFolder(session?.user?.token, data),
        ['virtualFolders']
    );
    return { mutate, isPending };
}

export const useRenameFolder = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['renameFolder'],
        ({ id, name }: { id: string; name: string }) => renameFolder(session?.user?.token, id, name),
        ['virtualFolders']
    );
    return { mutate, isPending };
}

export const useDeleteFolder = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['deleteFolder'],
        (id: string) => deleteFolder(session?.user?.token, id),
        ['virtualFolders', 'allFiles', 'groupedFiles', 'fileIndex', 'folderGroup', 'filesByFolder']
    );
    return { mutate, isPending };
}

export const useMoveFile = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['moveFile'],
        ({ fileId, folderId }: { fileId: string; folderId: string | null }) => moveFile(session?.user?.token, fileId, folderId),
        ['allFiles', 'groupedFiles', 'fileIndex', 'folderGroup', 'filesByFolder']
    );
    return { mutate, isPending };
}

export const useOnlineUsers = () => {
    const { data: session } = useSession();
    return useQueryData(
        ['onlineUsers'],
        async () => {
            const token = session?.user?.token;
            if (!token) return { count: 0 };
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            const res = await fetch(`${backendUrl}/api/sysadmin/online-users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return res.json();
        },
        { refetchInterval: 10000 }
    );
}

// Powers the dashboard overview screen with one request instead of the
// previous 5 (orders/parcels/files/tasks/folders) fired in parallel on
// every page open. Kept on the same 10s poll as online-users had, since
// that was the only field on the dashboard that needed live refreshing.
export const useDashboardSummary = () => {
    const { data: session, status } = useSession();
    return useQueryData(
        ['dashboardSummary'],
        () => getDashboardSummary(session?.user?.token),
        { enabled: status === "authenticated", refetchInterval: 60_000, staleTime: 30_000 }
    );
}
