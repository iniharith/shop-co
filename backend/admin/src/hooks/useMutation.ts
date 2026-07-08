/**
 * Coded by Harith
 * Kampungcetak ®
 */
import { MutationFunction, MutationKey, QueryKey, useMutation, useMutationState, useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { toast } from "sonner"

export const useMutationData = (mutationKey: MutationKey,
    mutationFn: MutationFunction<any, any>,
    queryKey?: QueryKey,
    onSuccess?: (data: any) => void
) => {
    const client = useQueryClient()
    const { mutate, isPending, isSuccess, isError, ...rest } = useMutation({
        mutationKey,
        mutationFn,
        onError(error) {
            const data = (error as unknown as AxiosError).response?.data as { message?: string } 
            console.log(data || error, "error")
            if (data?.message) toast.error(data.message)
            else if (error.message === 'Network Error') toast.error("Network Error", { description: "Please check your internet connection." })
            else toast.error("An unexpected error occurred.", {
                description: error.message?.toString()
            })        },
        onSuccess(data) {
            if (data?.message) {
                toast.success(data.message);
            }
            if (onSuccess) onSuccess(data);
        },

        onSettled: () => {
            if (!queryKey) return;
            if (Array.isArray(queryKey) && queryKey.length > 0 && typeof queryKey[0] === 'string') {
                const keys = queryKey as string[];
                // check if it's multiple top-level keys like ['groupedFiles', 'allFiles']
                if (keys.every(k => typeof k === 'string')) {
                     keys.forEach(k => client.invalidateQueries({ queryKey: [k] }));
                     return;
                }
            }
            client.invalidateQueries({ queryKey: queryKey as QueryKey, exact: true })
        }
    })
    return { mutate, isPending, isSuccess, isError, ...rest }
}


export const useMutationDataState = (mutationKey: MutationKey) => {
    const data = useMutationState({
        filters: {
            mutationKey
        },
        select(mutation) {
            return {
                variables: mutation.state.variables as any,
                status: mutation.state.status,
            };
        },
    })
    const latestVaribales = data[data.length - 1];
    return { latestVaribales }
}
