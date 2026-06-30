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
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Logging in..." : "Login"}
      </Button>
      
      {/* iOS 15 Diagnostic Native Button */}
      <button 
        type="button" 
        style={{ width: '100%', padding: '10px', background: 'red', color: 'white', marginTop: '10px' }}
        onClick={() => {
           alert("NATIVE BUTTON CLICKED!");
           toast.info("Native button clicked!");
        }}
      >
        IOS 15 NATIVE TEST BUTTON
      </button>
    </form>
  );
}
