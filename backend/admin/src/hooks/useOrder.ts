import { useSession } from "next-auth/react";
import { useQueryData } from "./useQueryData";
import { getOrders, updateOrderStatus } from "@/api/orders";
import { useMutationData } from "./useMutation";
import { IOrderApiResponse } from "@/types/api";

export const useOrders = () => {
    const { data: session } = useSession();
    const { data, isPending, refetch, isFetching } = useQueryData(['orders'], () => getOrders(session?.user.token))
    const response = data as IOrderApiResponse
    return { data: response, isPending, refetch, isFetching }
}

export const useUpdateOrderStatus = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['updateOrderStatus'], ({ id, status }: any) => updateOrderStatus(session?.user.token, id, status), ["orders"])
    return { mutate, isPending }
}

export const useCreateManualOrder = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['createManualOrder'], (data: any) => import("@/api/orders").then(m => m.createManualOrder(session?.user.token, data)), ["orders"])
    return { mutate, isPending }
}

export const useDeleteOrder = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['deleteOrder'], (orderId: string) => import("@/api/orders").then(m => m.deleteOrder(session?.user.token, orderId)), ["orders"])
    return { mutate, isPending }
}


