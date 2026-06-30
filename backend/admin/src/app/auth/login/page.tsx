import { LoginForm } from "@/components/forms/loginForm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function LoginPage({ className }: { className?: string }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2">
              <a
                href="#"
                className="flex flex-col items-center gap-2 font-medium"
              >
                <div className="flex h-12 items-center justify-center rounded-md">
                  <Image src="/logo.png" width={120} height={40} alt="Kampung Cetak" className="object-contain" />
                </div>
                <span className="sr-only">Kampung Cetak</span>
              </a>
              <h1 className="text-xl font-bold">
                Welcome to Kampung Cetak
              </h1>
              <div className="text-center text-sm text-muted-foreground">
                Login Here
              </div>
            </div>

            <LoginForm />

          </div>
        </div>
      </div>
    </div>
  );
}
