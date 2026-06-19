import { useSession } from "next-auth/react";
import { useQueryData } from "./useQueryData";
import { getProducts } from "@/api/products";

export const useProducts = () => {
    const { data: session } = useSession();
    return useQueryData(['products'], () => getProducts(session?.user?.token));
}
