/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client"
import { addressSchema } from "@/schema/address.schema"
import { useZodFormV2 } from "./useZodForm"
import { useGetCart } from "./useCart";
import { useSession } from "next-auth/react";
import { createOrder, getOrderById, getPreviousAddress } from "@/api/order";
import { getProfile } from "@/api/user";
import { useRef, useState } from "react";
import { isAxiosError } from 'axios';
import type { z } from 'zod';
import type { ICartItem } from '@/types/ICart';
import { useMutationData } from "./useMutation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "nextjs-toploader/app";
import { getOrdersByUserId } from "@/api/order";
import { useQueryData } from "./useQueryData";
import { IOrderByIdResponse, IOrderResponse, IPreviousAddressResponse } from "@/types/api";



const CHECKOUT_KEY_STORAGE = 'kampungcetak:checkout-attempt';

function getCheckoutKey(items: ICartItem[]): string {
    const fingerprint = JSON.stringify(items.map((item) => [
        item.product?._id, item.size, item.quantity, item.configurationKey, item.artworkUrl,
    ]));
    try {
        const stored = JSON.parse(sessionStorage.getItem(CHECKOUT_KEY_STORAGE) || 'null');
        if (stored?.fingerprint === fingerprint && typeof stored.key === 'string') return stored.key;
    } catch { /* Storage may be unavailable; this attempt still gets a unique key. */ }
    const key = crypto.randomUUID();
    try { sessionStorage.setItem(CHECKOUT_KEY_STORAGE, JSON.stringify({ fingerprint, key })); } catch { /* Storage may be unavailable. */ }
    return key;
}

export const useOrder = (checkoutMeta?: { getShippingPrice?: (address: z.infer<typeof addressSchema>) => number | null; onShippingQuoteChanged?: () => void }) => {
    const { data: session, update } = useSession();
    const [DisOpen,setDisOpen]=useState(false)
    const client = useQueryClient()
    const router = useRouter();
    const token = session?.user?.token || "";
    const { data: previousAddress, isLoading: previousAddressLoading } = useQueryData(['previousAddress'], () => getPreviousAddress(token));
    const { data: response } = useGetCart();
    const formRef = useRef<HTMLFormElement>(null);
    const { mutate: createOrderMutation, isPending: orderSubmitting } = useMutationData(['order'], async (data: z.infer<typeof addressSchema>) => {
        try {
            const shippingPrice = checkoutMeta?.getShippingPrice?.(data);
            if (shippingPrice === null || shippingPrice === undefined) throw new Error('Please wait for shipping rates before checking out.');
            return await createOrder({ ...data, shippingPrice }, token, getCheckoutKey(response?.cart?.items || []));
        } catch (error: unknown) {
            if (isAxiosError(error) && error.response?.status === 409) checkoutMeta?.onShippingQuoteChanged?.();
            throw error;
        }
    }, ['cart'], async () => {
        await update({ ...session, user: { ...session?.user, orderSuccesPageAccess: true } });
        toast.success("Order created successfully");
        await client.invalidateQueries({ queryKey: ['products'], exact: true });
        await client.invalidateQueries({ queryKey: ['cart'], exact: true });
        await client.invalidateQueries({ queryKey: ['orders'], exact: true });
        try { sessionStorage.removeItem(CHECKOUT_KEY_STORAGE); } catch { /* Storage may be unavailable. */ }
        router.push("/home/cart/checkout/success");
    })
    
    // Also fetch the user's profile to see if they have a saved address
    const { data: profileData } = useQueryData(['profile'], () => getProfile(token));
    const profile = profileData as { data?: { address?: { street?: string; city?: string; state?: string; country?: string; zip?: string } } } | undefined;

    const { form, onFormSubmit, control, errors, } = useZodFormV2(addressSchema, (data: z.infer<typeof addressSchema>) => createOrderMutation(data), {
        customerName: "",
        address: "",
        city: "",
        state: "",
        country: "Malaysia",
        postalCode: "",
        street: "",
        orderNotes: "",
    }, {
        mode: "onChange"
    })

    // Removed auto-prefill to allow manual selection via switch
    const handleCheckout = () => {
        if (formRef.current) {
            formRef.current.requestSubmit();
        }
    };

    const previousAddressData = previousAddress as IPreviousAddressResponse
    return { form, onFormSubmit, control, errors, formRef, handleCheckout, previousAddressData, previousAddressLoading,DisOpen,setDisOpen, profile, orderSubmitting }
}



export const useGetOrders = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: session } = useSession();
    const token = session?.user?.token || "";
    const { data: response, isLoading } = useQueryData(['orders', token], () => getOrdersByUserId(token), { enabled: !!token });
    const responseData = response as IOrderResponse;
    const orders = responseData?.orders || [];
    const filteredOrders = orders.length > 0 ? orders.filter(
        (order) =>
            order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.products.some((item) =>
                item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
    ) : [];

    return { data: responseData, isLoading, filteredOrders, setSearchTerm, searchTerm }
}



export const useGetOrderById = (id: string) => {
    
    const { data: session } = useSession();
    const token = session?.user?.token || "";
    const { data: response, isLoading } = useQueryData(['order', id, token], () => getOrderById(token, id), { enabled: !!token });
    const responseData = response as IOrderByIdResponse
    return { data: responseData, isLoading }
}



