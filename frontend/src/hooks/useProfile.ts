import { useSession } from "next-auth/react";
import { getProfile, updateProfile } from "@/api/user";
import { useQueryData } from "./useQueryData";
import { useMutationData } from "./useMutation";
import { toast } from "sonner";

export const useProfile = () => {
    const { data: session } = useSession();
    const token = session?.user?.token || "";

    const { data: profileData, isLoading, refetch } = useQueryData(
        ['profile', token],
        () => getProfile(token),
        // Only fetch when we have a token — prevents "not found api users" error
        { enabled: !!token }
    );

    const { mutate: updateProfileMutation, isPending: isUpdating } = useMutationData(
        ['profileUpdate'],
        (data: any) => updateProfile(data, token),
        ['profile', token],
        () => {
            toast.success("Profil berjaya dikemaskini");
            refetch();
        }
    );

    return {
        profileData,
        isLoading,
        updateProfile: updateProfileMutation,
        isUpdating
    };
};
