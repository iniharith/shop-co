/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { useSession } from "next-auth/react";
import { useQueryData } from "./useQueryData";
import { getOrder, getOrders, updateOrderStatus } from "@/api/orders";
import { useMutationData } from "./useMutation";
import { IOrderApiResponse } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const findCachedOrder = (client: ReturnType<typeof useQueryClient>, id: string) => {
    const list = client.getQueryData<IOrderApiResponse>(['orders'])?.orders.find(order => order._id === id);
    return list || (client.getQueryData(['order', id]) as any)?.order;
};

const patchOrderCaches = (client: ReturnType<typeof useQueryClient>, id: string, patch: Record<string, unknown>) => {
    client.setQueryData(['orders'], (old: any) => old?.orders ? {
        ...old,
        orders: old.orders.map((order: any) => order._id === id ? { ...order, ...patch } : order),
    } : old);
    client.setQueryData(['order', id], (old: any) => old?.order ? { ...old, order: { ...old.order, ...patch } } : old);
};

export const useOrders = (enabled = true) => {
    const { data: session, status } = useSession();
    const { data, isPending, refetch, isFetching } = useQueryData(
        ['orders'],
        () => getOrders(session?.user?.token),
        { enabled: enabled && status === "authenticated", refetchInterval: 60_000, staleTime: 30_000 }
    )
    const response = data as IOrderApiResponse
    return { data: response, isPending, refetch, isFetching }
}

export const useOrder = (orderId?: string) => {
    const { data: session, status } = useSession();
    return useQueryData(
        ['order', orderId],
        () => getOrder(session?.user?.token, orderId!),
        { enabled: status === "authenticated" && !!orderId, staleTime: 60_000 }
    );
}

export const useUpdateOrderStatus = () => {
    const { data: session } = useSession();
    const client = useQueryClient();
    type Variables = { id: string; status: string; skipUndo?: boolean; silent?: boolean };
    const mutation = useMutation<any, Error, Variables, { previousStatus?: string }>({
        mutationKey: ['updateOrderStatus'],
        mutationFn: ({ id, status }) => updateOrderStatus(session?.user?.token, id, status),
        onMutate: async ({ id, status }) => {
            await client.cancelQueries({ queryKey: ['orders'] });
            const previousStatus = findCachedOrder(client, id)?.orderStatus;
            patchOrderCaches(client, id, { orderStatus: status });
            return { previousStatus };
        },
        onError: (error, variables, context) => {
            const current = findCachedOrder(client, variables.id);
            if (context?.previousStatus && current?.orderStatus === variables.status) {
                patchOrderCaches(client, variables.id, { orderStatus: context.previousStatus });
            }
            if (!variables.silent) toast.error('Failed to update order status', { description: error.message });
        },
        onSuccess: (data, variables, context) => {
            if (data?.order) patchOrderCaches(client, variables.id, data.order);
            const canUndo = !variables.silent && !variables.skipUndo && variables.status !== 'DELIVERED' && context?.previousStatus;
            if (!variables.silent) toast.success('Order status updated', canUndo ? {
                duration: 5000,
                action: { label: 'Move back', onClick: () => {
                    if (findCachedOrder(client, variables.id)?.orderStatus !== variables.status) {
                        toast.info('Order changed again; Move back is no longer available');
                        return;
                    }
                    mutation.mutate({ id: variables.id, status: context.previousStatus!, skipUndo: true });
                } },
            } : undefined);
        },
        onSettled: (_data, _error, variables) => {
            ['orders', 'tasks', 'folderGroup'].forEach(key => client.invalidateQueries({ queryKey: [key] }));
            client.invalidateQueries({ queryKey: ['order', variables.id] });
        },
    });
    return { mutate: mutation.mutate, mutateAsync: mutation.mutateAsync, isPending: mutation.isPending }
}

export const useToggleArchiveOrder = () => {
    const { data: session } = useSession();
    const client = useQueryClient();
    type Variables = { id: string; isArchived: boolean; skipUndo?: boolean };
    const mutation = useMutation<any, Error, Variables, { previous: boolean }>({
        mutationKey: ['toggleArchiveOrder'],
        mutationFn: ({ id, isArchived }) => import("@/api/orders").then(m => m.archiveOrder(session?.user?.token, id, isArchived)),
        onMutate: async ({ id, isArchived }) => {
            await client.cancelQueries({ queryKey: ['orders'] });
            const previous = Boolean(findCachedOrder(client, id)?.isArchived);
            patchOrderCaches(client, id, { isArchived });
            return { previous };
        },
        onError: (error, variables, context) => {
            const current = findCachedOrder(client, variables.id);
            if (current?.isArchived === variables.isArchived) patchOrderCaches(client, variables.id, { isArchived: context?.previous });
            toast.error('Failed to update archive status', { description: error.message });
        },
        onSuccess: (data, variables, context) => {
            if (data?.order) patchOrderCaches(client, variables.id, data.order);
            if (!variables.skipUndo) toast.success(variables.isArchived ? 'Order archived' : 'Order unarchived', {
                duration: 5000,
                action: { label: 'Undo', onClick: () => {
                    if (findCachedOrder(client, variables.id)?.isArchived !== variables.isArchived) {
                        toast.info('Order changed again; Undo is no longer available');
                        return;
                    }
                    mutation.mutate({ id: variables.id, isArchived: context?.previous || false, skipUndo: true });
                } },
            });
        },
        onSettled: () => client.invalidateQueries({ queryKey: ['orders'] }),
    });
    return { mutate: mutation.mutate, isPending: mutation.isPending }
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
