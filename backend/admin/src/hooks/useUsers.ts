/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client"
import { useSession } from "next-auth/react";
import { useQueryData } from "./useQueryData"
import { getUsers } from "@/api/users"
import { IUserApiResponse } from "@/types/api";
import { useMutationData } from "./useMutation";
export const useUsers = (enabled = true) => {
    const { data: session, status } = useSession();
    const { data, isPending, refetch, isFetching } = useQueryData(
        ['users'],
        () => getUsers(session?.user?.token),
        { enabled: enabled && status === "authenticated", staleTime: 5 * 60_000 }
    )
    const response = data as IUserApiResponse
    return { data: response, isPending, refetch, isFetching }
}
export const useCreateUser = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['createUser'], (data: any) => import("@/api/users").then(m => m.createUser(session?.user?.token, data)), ["users"])
    return { mutate, isPending }
}

export const useUpdateUser = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['updateUser'], ({ id, data }: any) => import("@/api/users").then(m => m.updateUser(session?.user?.token, id, data)), ["users"])
    return { mutate, isPending }
}

