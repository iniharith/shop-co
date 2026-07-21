/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "@heroui/button";
import { toast } from "sonner";

const Cta = () => {
  const [email, setEmail] = useState("");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  const handleSubmit = () => {
    setEmail("");
    toast.success("Email subscribed successfully", {
      description: "You will receive our latest offers and news in your inbox",
    });
  };
  return (
    <div className="relative z-10 w-full translate-y-10 grid place-items-center px-4">
      <div className="glass-panel-strong w-full max-w-5xl rounded-[2rem] px-4 py-8 grid md:grid-cols-2 overflow-hidden">
        <div className="flex flex-col justify-center gap-2 md:px-10 px-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-primary">Print notes</p>
          <h1 className="text-foreground text-3xl">
            stay up to date about our latest offers
          </h1>
        </div>
        <div className="flex md:mt-0 md:px-0 px-4 mt-10 flex-col items-center justify-center gap-2">
          <Input
            value={email}
            onChange={handleChange}
            type="text"
            placeholder="Enter your email"
            className="glass-subtle w-full md:text-base text-sm p-2 rounded-xl"
          />
          <Button
            onPress={handleSubmit}
            size="sm"
            className="w-full text-primary-foreground text-sm capitalize py-5 cursor-pointer hover:bg-primary/90 active:scale-95 transition-all duration-300 font-bold rounded-xl bg-primary"
          >
            <p>Subscribe to our newsletter</p>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cta;
