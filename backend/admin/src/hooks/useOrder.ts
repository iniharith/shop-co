/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { useSession } from "next-auth/react";
import { useQueryData } from "./useQueryData";
import { getOrders, updateOrderStatus } from "@/api/orders";
import { useMutationData } from "./useMutation";
import { IOrderApiResponse } from "@/types/api";

export const useOrders = () => {
    const { data: session, status } = useSession();
    const { data, isPending, refetch, isFetching } = useQueryData(
        ['orders'],
        () => getOrders(session?.user?.token),
        { enabled: status !== "loading" }
    )
    const response = data as IOrderApiResponse
    return { data: response, isPending, refetch, isFetching }
}

export const useUpdateOrderStatus = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['updateOrderStatus'], ({ id, status }: any) => updateOrderStatus(session?.user?.token, id, status), ["orders"])
    return { mutate, isPending }
}

export const useToggleArchiveOrder = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['toggleArchiveOrder'], ({ id, isArchived }: any) => import("@/api/orders").then(m => m.archiveOrder(session?.user?.token, id, isArchived)), ["orders"])
    return { mutate, isPending }
}

export const useCreateManualOrder = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['createManualOrder'], (data: any) => import("@/api/orders").then(m => m.createManualOrder(session?.user?.token, data)), ["orders"])
    return { mutate, isPending }
}

export const useDeleteOrder = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['deleteOrder'], (orderId: string) => import("@/api/orders").then(m => m.deleteOrder(session?.user?.token, orderId)), ["orders"])
    return { mutate, isPending }
}

export const useBulkDeleteOrders = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['bulkDeleteOrders'], (orderIds: string[]) => import("@/api/orders").then(m => m.bulkDeleteOrders(session?.user?.token, orderIds)), ["orders"])
    return { mutate, isPending }
}

export const useCreateShipment = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['createShipment'], (orderId: string) => import("@/api/orders").then(m => m.createShipment(session?.user?.token, orderId)), ["orders"])
    return { mutate, isPending }
}
