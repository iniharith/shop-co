/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { useSession } from "next-auth/react";
import { useQueryData } from "./useQueryData";
import { getProducts } from "@/api/products";

export const useProducts = () => {
    const { data: session, status } = useSession();
    return useQueryData(
        ['products'],
        () => getProducts(session?.user?.token),
        { enabled: status === "authenticated", staleTime: 300_000 }
    );
}
