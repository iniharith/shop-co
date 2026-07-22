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
        { enabled: status === "authenticated", refetchInterval: 60_000, staleTime: 30_000 }
    )
    const response = data as IOrderApiResponse
    )
    const response = data as IOrderApiResponse
    return { data: response, isPending, refetch, isFetching }
}

export const useUpdateOrderStatus = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['updateOrderStatus'], ({ id, status }: any) => updateOrderStatus(session?.user?.token, id, status), ["orders", "tasks", "folderGroup"])
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
    const { mutate, isPending } = useMutationData(['createShipment'], ({ orderId, data }: { orderId: string, data: any }) => import("@/api/orders").then(m => m.createShipment(session?.user?.token, orderId, data)), ["orders", "parcels"])
    return { mutate, isPending }
}

export const useEasyParcelStatus = () => {
    const { data: session, status } = useSession();
    return useQueryData(
        ['easyParcelStatus'],
        () => import("@/api/orders").then(m => m.getEasyParcelStatus(session?.user?.token)),
        { enabled: status === "authenticated" }
    );
}

export const useConnectEasyParcel = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['connectEasyParcel'],
        () => import("@/api/orders").then(m => m.connectEasyParcel(session?.user?.token))
    );
    return { mutate, isPending };
}

export const useShippingQuotations = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['easyParcelQuotations'],
        ({ orderId, data }: { orderId: string, data: any }) => import("@/api/orders").then(m => m.getShippingQuotations(session?.user?.token, orderId, data))
    );
    return { mutate, isPending };
}

export const useRefreshShipment = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['refreshEasyParcelShipment'],
        (orderId: string) => import("@/api/orders").then(m => m.refreshShipment(session?.user?.token, orderId)),
        ["orders", "parcels"]
    );
    return { mutate, isPending };
}

export const useReconcileShipment = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(
        ['reconcileEasyParcelShipment'],
        ({ orderId, shipmentNumber }: { orderId: string, shipmentNumber: string }) => import("@/api/orders").then(m => m.reconcileShipment(session?.user?.token, orderId, shipmentNumber)),
        ["orders", "parcels"]
    );
    return { mutate, isPending };
}
