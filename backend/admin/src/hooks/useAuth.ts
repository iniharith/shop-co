/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import loginSchema from "@/schema/loginSchema";
import { signUp } from "@/api/auth";
import { useMutationData } from "./useMutation";
import useZodForm from "./useZodForm";
import { useModalStore } from "@/store/uiStore";
import { signIn } from "next-auth/react"
import { toast } from "sonner";
import { useRouter } from "nextjs-toploader/app";
import signUpSchema from "@/schema/signUpSchema";
import { useState, useEffect } from "react";
export const useAuth = (type: "login" | "signup" = "login") => {
  const router = useRouter()
  const schema = type === "login" ? loginSchema : signUpSchema;
  const fn = async (data: any) => {
    if (type === "signup") await signUp(data);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (result?.error) throw new Error("Invalid email or password");
    return result;
  };
  const [isLoading, setIsLoading] = useState(false)
  const { mutate, isPending, error: mutationError, isSuccess } = useMutationData(['user'],
    (data) => fn(data),
    ["user"],
    onSubmit
  )

  useEffect(() => {
    if (isPending) {
      setIsLoading(true)
    }
    if (mutationError) {
      setIsLoading(false)
      toast.error((mutationError as any)?.response?.data?.message || (mutationError as Error).message || "Login failed")
    }
  }, [isPending, mutationError])


  const form = useZodForm(schema, mutate);
  const { register, onFormSubmit, errors, reset, getValues, setValue } = form;
  function onSubmit() {
    setIsLoading(false)
    localStorage.setItem("loginId", getValues("email"))
    // Hard navigation (not router.push) so the freshly-issued session/token
    // is guaranteed to be picked up on every device/browser, instead of a
    // stale cached session persisting across a client-side route change.
    window.location.href = "/admin/dashboard"
  }








  return { register, onFormSubmit, errors, reset, isPending: isLoading, mutationError, isSuccess, form, setValue }



}
