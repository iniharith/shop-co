/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { useSession } from "next-auth/react";
import { useQueryData } from "./useQueryData";
import { useMutationData } from "./useMutation";
import AxiosInstance from "@/utils/axios";

export const useConversations = () => {
    const { data: session } = useSession();
    const token = session?.user?.token;
    return useQueryData(['conversations'], async () => {
        if (!token) return { conversations: [] };
        const res = await AxiosInstance(token).get(`/api/chat/conversations`);
        return res.data;
    });
}

export const useMessages = (conversationId: string) => {
    const { data: session } = useSession();
    const token = session?.user?.token;
    return useQueryData(['messages', conversationId], async () => {
        if (!conversationId || !token) return { messages: [] };
        const res = await AxiosInstance(token).get(`/api/chat/conversations/${conversationId}/messages`);
        return res.data;
    }, { refetchInterval: 3000 });
}

export const useSendMessage = (conversationId: string) => {
    const { data: session } = useSession();
    const token = session?.user?.token;
    const { mutate, isPending } = useMutationData(['sendMessage'], async (text: string) => {
        const res = await AxiosInstance(token).post(`/api/chat/conversations/${conversationId}/messages`, { text });
        return res.data;
    }, ['messages', conversationId]);
    return { mutate, isPending };
}

export const useCreateConversation = () => {
    const { data: session } = useSession();
    const token = session?.user?.token;
    const { mutate, isPending } = useMutationData(['createConversation'], async (data: any) => {
        const res = await AxiosInstance(token).post(`/api/chat/conversations`, data);
        return res.data;
    }, ['conversations']);
    return { mutate, isPending };
}
