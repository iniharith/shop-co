/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import loginSchema from "@/schema/loginSchema";
import { useMutationData } from "./useMutation";
import { useZodFormV2 } from "./useZodForm";
import { signIn } from "next-auth/react"
import { toast } from "sonner";
import { useRouter } from "nextjs-toploader/app";
import signUpSchema from "@/schema/signUpSchema";
import { IAuthSchema } from "@/types";
import { signUp } from "@/api/auth";
import { useEffect, useState } from "react";

export const useAuth = (type: "login" | "signup" = "login", redirectTo = "/home/profile") => {
  const [isLoading, setIsLoading] = useState(false);

  const schema = (type !== "login" ? signUpSchema : loginSchema) as IAuthSchema;

  const defaultValues = type === "login" ? { email: "", password: "" } : { email: "", password: "", name: "", role: "" };

  const apiFn = async (data: any) => {
    if (type === "signup") await signUp(data);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (result?.error) throw new Error("Invalid email or password");
    return result;
  };


  const router = useRouter();

  const { mutate, isPending, error: mutationError, isSuccess } = useMutationData(['user'],
    (data: any) => apiFn(data),
    ["user"],
    onSubmit
  )

  useEffect(() => {
    if (isPending) setIsLoading(true);
    if (mutationError) setIsLoading(false);
  }, [isPending, mutationError]);

  const { form, control, errors, onFormSubmit, reset } = useZodFormV2(schema, (data: any) => mutate(data), defaultValues as any, { mode: "onSubmit", showToastOnError: true });

  async function onSubmit() {
    try {
      const message = type === "login" ? "Login successful" : "Signup successful";
      toast.success(message);
      router.push(redirectTo);
      reset();
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  }
  return { form, control, errors, onFormSubmit, mutate, isPending: isLoading, error: mutationError, isSuccess }

}
