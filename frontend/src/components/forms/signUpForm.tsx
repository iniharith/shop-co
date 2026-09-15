/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import { useAuth } from "@/hooks/useAuth";
import Alert from "@/components/ui/alertBadge";
import AnimatedButton from "../animation/animatedButton";
import { useEffect, useState } from "react";

import { FormField, Form } from "../ui/form";
import FormGeneratorV2 from "../global/formgenrator";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { FaUser } from "react-icons/fa6";
import { signIn } from "next-auth/react";

export function SignupForm({ callBack }: { callBack?: () => void }) {
  const { errors, control, onFormSubmit, isPending, isSuccess, form } =
    useAuth("signup");
  const [err, seterr] = useState<string | null>(null);

  useEffect(() => {
    if (isSuccess) {
      seterr(null);
      // callBack?.();
    }
    const err = Object.values(errors);
    if (err.length > 0) {
      err.map((e, i) => i == 0 && seterr(e?.message as string));
    } else {
      seterr(null);
    }
  }, [errors, isSuccess]);

  return (
    <Form {...form}>
      <form onSubmit={onFormSubmit} className="w-full grid  gap-4">
        {err && <Alert cont={err} />}

        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormGeneratorV2
              field={field}
              type="text"
              label="Name"
              placeholder="Enter your name"
              inputType="input"
              errors={errors}
              Icon={FaUser}
              className={{
                input: "w-full",
              }}
            />
          )}
        />

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

     

        <AnimatedButton
          type="submit"
          text="signup"
          loadingText="signing up..."
          isLoading={isPending}
          disabled={isPending}
        />
        <div className="relative my-1 text-center text-xs text-muted-foreground"><span className="bg-background px-2">or</span></div>
        <button type="button" className="h-12 w-full rounded-2xl border border-border bg-background font-semibold hover:border-primary" onClick={() => signIn("google", { callbackUrl: "/home/profile" })}>Continue with Google</button>
      </form>
    </Form>
  );
}
