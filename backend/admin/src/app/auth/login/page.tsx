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

            {/* iOS 15 Diagnostic Native Button OUTSIDE FORM */}
            <button 
              type="button" 
              className="relative z-[9999]"
              style={{ width: '100%', padding: '10px', background: 'blue', color: 'white', marginTop: '20px', cursor: 'pointer' }}
              onClick={() => {
                 alert("BLUE BUTTON OUTSIDE FORM CLICKED!");
              }}
              onTouchEnd={() => {
                 alert("BLUE BUTTON OUTSIDE FORM TOUCHED!");
              }}
            >
              IOS 15 BLUE BUTTON (OUTSIDE FORM)
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
