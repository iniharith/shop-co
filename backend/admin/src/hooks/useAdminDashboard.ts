import { useSession } from "next-auth/react";
import { useQueryData } from "./useQueryData";
import { useMutationData } from "./useMutation";
import { 
    getParcelStats, 
    getParcels, 
    syncParcelTracking, 
    sendWhatsAppNotification, 
    getFileStats, 
    getGroupedFiles, 
    getAllFiles,
    reviewFile, 
    deleteFile 
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
    const { mutate, isPending } = useMutationData(['reviewFile'], ({ id, reviewed, notes }: any) => reviewFile(session?.user?.token, id, reviewed, notes));
    return { mutate, isPending };
}

export const useDeleteFile = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['deleteFile'], (id: string) => deleteFile(session?.user?.token, id));
    return { mutate, isPending };
}
