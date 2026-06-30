"use client";
import { Button } from "@/components/ui/button";
import FormGenerator from "../global/formGenerator";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import AnimatedButton from "../global/globalButton";
import Alert from "../ui/alertBadge";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function LoginForm() {
  const { register, errors, onFormSubmit, isPending, isSuccess } = useAuth();
  const [err, seterr] = useState<string | null>(null);
  useEffect(() => {
    if (isSuccess) seterr(null);
    Object.values(errors).map((e:any, i) => i == 0 && seterr(e?.message as string));
  }, [errors, isSuccess]);

  return (
    <form onSubmit={onFormSubmit} className="flex w-full flex-col gap-6">
      {err && <Alert cont={err} />}
      <FormGenerator
        inputType="input"
        label="email"
        name="email"
        type="email"
        placeholder="demo@example"
        register={register}
        errors={errors}
        showError={false}
      />
      <FormGenerator
        inputType="input"
        type="password"
        label="password"
        name="password"
        placeholder="********"
        register={register}
        errors={errors}
        showError={false}
      />
      <Button 
        type="button" 
        className="w-full relative z-50" 
        style={{ touchAction: 'manipulation' }}
        disabled={isPending}
        onClick={(e) => {
          toast.info("Debug: onClick registered!");
          onFormSubmit(e as any);
        }}
        onTouchStart={(e) => {
          if (!isPending) {
             toast.info("Debug: onTouchStart registered!");
             onFormSubmit(e as any);
          }
        }}
      >
        {isPending ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
}
