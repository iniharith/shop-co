/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { useSession } from "next-auth/react";
import { useQueryData } from "./useQueryData";
import { useMutationData } from "./useMutation";
import { 
    getParcelStats, 
    getParcels, 
    syncParcelTracking, 
    updateParcel,
    sendWhatsAppNotification, 
    getFileStats, 
    getGroupedFiles, 
    getAllFiles,
    reviewFile, 
    deleteFile,
    bulkDeleteFiles,
    createShareLink,
    getFolders,
    createFolder,
    deleteFolder,
    moveFile
} from "@/api/admin-dashboard";

export const useParcelStats = () => {
    const { data: session } = useSession();
    return useQueryData(['parcelStats'], () => getParcelStats(session?.user?.token));
}

export const useParcels = (filters?: any) => {
    const { data: session } = useSession();
    return useQueryData(['parcels', filters], () => getParcels(session?.user?.token));
}

export const useSyncParcel = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['syncParcelTracking'], (id: string) => syncParcelTracking(session?.user?.token, id));
    return { mutate, isPending };
}

export const useUpdateParcel = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['updateParcelTracking'], ({ id, data }: { id: string, data: any }) => updateParcel(session?.user?.token, id, data));
    return { mutate, isPending };
}

export const useSendWhatsApp = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['sendWhatsApp'], (id: string) => sendWhatsAppNotification(session?.user?.token, id));
    return { mutate, isPending };
}

export const useFileStats = () => {
    const { data: session } = useSession();
    return useQueryData(['fileStats'], () => getFileStats(session?.user?.token));
}

export const useGroupedFiles = () => {
    const { data: session } = useSession();
    return useQueryData(['groupedFiles'], () => getGroupedFiles(session?.user?.token));
}

export const useAllFiles = () => {
    const { data: session } = useSession();
    return useQueryData(['allFiles'], () => getAllFiles(session?.user?.token));
}

export const useReviewFile = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['reviewFile'], ({ id, reviewed, notes }: any) => reviewFile(session?.user?.token, id, reviewed, notes), ['groupedFiles']);
    return { mutate, isPending };
}

export const useDeleteFile = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['deleteFile'], (id: string) => deleteFile(session?.user?.token, id), ['groupedFiles', 'allFiles', 'tasks']);
    return { mutate, isPending };
}

export const useBulkDeleteFiles = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['bulkDeleteFiles'], (fileIds: string[]) => bulkDeleteFiles(session?.user?.token, fileIds), ['groupedFiles', 'allFiles', 'tasks']);
    return { mutate, isPending };
}


export const useRenameFile = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['renameFile'],
        (data: { id: string, originalName: string }) => AxiosInstance(session?.user?.token).put(`/api/files//name`, { originalName: data.originalName }),
        ['allFiles', 'groupedFiles', 'tasks']
    );
    return { mutate, isPending };
}

export const useCreateShareLink = () => {
    const { data: session } = useSession();
    const { mutate, mutateAsync, isPending } = useMutationData(
        ['createShareLink'],
        (data: { folderName: string; taskId?: string; orderId?: string; userId?: string }) =>
            createShareLink(session?.user?.token, data)
    );
    return { mutate, mutateAsync, isPending };
}

export const useFolders = () => {
    const { data: session } = useSession();
    return useQueryData(['virtualFolders'], () => getFolders(session?.user?.token));
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

export const useDeleteFolder = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['deleteFolder'],
        (id: string) => deleteFolder(session?.user?.token, id),
        ['virtualFolders', 'allFiles', 'groupedFiles']
    );
    return { mutate, isPending };
}

export const useMoveFile = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['moveFile'],
        ({ fileId, folderId }: { fileId: string; folderId: string | null }) => moveFile(session?.user?.token, fileId, folderId),
        ['allFiles', 'groupedFiles']
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
