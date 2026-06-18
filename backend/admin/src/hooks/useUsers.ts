"use client"
import { useSession } from "next-auth/react";
import { useQueryData } from "./useQueryData"
import { getDeliveryBoys, getUsers, updateDeliveryBoy } from "@/api/users"
import { IUserApiResponse, IDeliveryBoyApiResponse } from "@/types/api";
import { useMutationData } from "./useMutation";
export const useUsers = () => {
    const { data: session } = useSession();
    const { data, isPending } = useQueryData(['users'], () => getUsers(session?.user.token))
    const response = data as IUserApiResponse
    return { data: response, isPending }
}


export const useDeliveryBoys = () => {
    const { data: session } = useSession();
    const { data, isPending } = useQueryData(['deliveryBoys'], () => getDeliveryBoys(session?.user.token))
    const response = data as IDeliveryBoyApiResponse
    return { data: response, isPending }
}


export const useUpdateDeliveryBoy = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['updateDeliveryBoy'], ({ id, status }: any) => updateDeliveryBoy(session?.user.token, id, status), ["deliveryBoys"])
    return { mutate, isPending }
}

export const useCreateUser = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['createUser'], (data: any) => import("@/api/users").then(m => m.createUser(session?.user.token, data)), ["users"])
    return { mutate, isPending }
}

export const useUpdateUser = () => {
    const { data: session } = useSession();
    const { mutate, isPending } = useMutationData(['updateUser'], ({ id, data }: any) => import("@/api/users").then(m => m.updateUser(session?.user.token, id, data)), ["users"])
    return { mutate, isPending }
}

