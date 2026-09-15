/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import { useAuth } from "@/hooks/useAuth";
import Alert from "@/components/ui/alertBadge";
import { useEffect, useState } from "react";
import AnimatedButton from "../animation/animatedButton";
import { Form, FormField } from "../ui/form";
import { Button } from "../ui/button";
import FormGeneratorV2 from "../global/formgenrator";
import { FaEnvelope, FaLock } from "react-icons/fa6";
import { useUIStore } from "@/store/uiStore";
export function LoginForm({ callBack, redirectTo }: { callBack?: () => void; redirectTo?: string }) {
  const { form,control, errors, onFormSubmit, isPending, isSuccess } = useAuth("login", redirectTo);
  const {previewsFunction} = useUIStore()
  const [err, seterr] = useState<string | null>(null);
  useEffect(() => {
    if (isSuccess&&!isPending) {
      seterr(null);
      previewsFunction();
      console.log("previewsFunction",previewsFunction);
      // callBack?.();
    }
    Object.values(errors).map(
      (e: any, i) => i == 0 && seterr(e?.message as string)
    );
  }, [errors, isSuccess,isPending]);

  return (
    <Form {...form}>
      <form onSubmit={onFormSubmit} className="w-full grid py-4 md:px-3 gap-4">
      {err && <Alert cont={err} />}
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormGeneratorV2
            field={field}
            type="email"
            label="Email"
            placeholder="Enter your email"
            inputType="input"
            errors={errors}
            Icon={FaEnvelope}
            className={{
              input: "w-full",
            }}
          />
        )}
      />
      <FormField
        control={control}
        name="password"
        render={({ field }) => (
          <FormGeneratorV2
            field={field}
            type="password"
            label="Password"
            placeholder="Enter your password"
            inputType="input"
            errors={errors}
            Icon={FaLock}
            className={{
              input: "w-full",
            }}
          />
        )}
      />

      <Button type="submit" className="w-full h-12 bg-primary rounded-2xl" disabled={isPending}>
        {isPending ? "Logging in..." : "Login"}
      </Button>
    </form>
    </Form>
  );
}
