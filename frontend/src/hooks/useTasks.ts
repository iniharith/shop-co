/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { useSession } from "next-auth/react";
import { useQueryData } from "./useQueryData";
import { useMutationData } from "./useMutation";
import AxiosInstance from "@/utils/axios";

export const useCustomerTasks = () => {
    const { data: session } = useSession();
    const token = session?.user?.token;
    return useQueryData(['customerTasks'], async () => {
        if (!token) return { tasks: [] };
        const res = await AxiosInstance(token).get(`/api/tasks`);
        return res.data;
    });
}

export const useAddCustomerTaskComment = () => {
    const { data: session } = useSession();
    const token = session?.user?.token;
    const { mutate, isPending } = useMutationData(['addCustomerTaskComment'], async ({ id, text }: { id: string, text: string }) => {
        const res = await AxiosInstance(token).post(`/api/tasks/${id}/comments`, { text });
        return res.data;
    }, ['customerTasks']);
    return { mutate, isPending };
}
