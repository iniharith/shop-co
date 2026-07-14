"use client";
import React from "react";

export function AILoader({ text = "SYSTEM LOADING" }: { text?: string }) {
  return (
    <div className="absolute inset-0 z-[50] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm overflow-hidden min-h-[400px]">
      <div className="relative flex items-center justify-center w-64 h-64 scale-75 md:scale-100">
        {/* Outer glowing radar ring */}
        <div className="absolute inset-0 rounded-full border border-primary/20 bg-primary/5 shadow-[0_0_50px_rgba(16,185,129,0.1)]"></div>
        
        {/* Rotating outer dashed ring */}
        <svg className="absolute w-full h-full animate-[spin_10s_linear_infinite] opacity-50" viewBox="0 0 100 100">
          <circle 
            cx="50" cy="50" r="48" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="0.5" 
            strokeDasharray="4 8" 
            className="text-primary"
          />
        </svg>

        {/* Counter-rotating middle segmented ring */}
        <svg className="absolute w-4/5 h-4/5 animate-[spin_6s_linear_infinite_reverse] opacity-70" viewBox="0 0 100 100">
          <circle 
            cx="50" cy="50" r="46" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeDasharray="20 10 5 10 40 20" 
            className="text-primary"
          />
        </svg>

        {/* Inner pulsing core border */}
        <div className="absolute w-1/2 h-1/2 rounded-full border-2 border-primary/40 animate-ping opacity-30"></div>

        {/* Central glowing core */}
        <div className="relative w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_30px_var(--theme-primary)] backdrop-blur-sm border border-primary/50 overflow-hidden group">
          {/* Scanning line inside core */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_var(--theme-primary)] animate-[scan_2s_ease-in-out_infinite]"></div>
          
          <div className="w-6 h-6 rounded-full bg-primary shadow-[0_0_15px_var(--theme-primary)] animate-pulse"></div>
        </div>
        
        {/* Floating nodes/data points */}
        <div className="absolute top-[10%] left-[20%] w-1.5 h-1.5 rounded-full bg-primary animate-ping" style={{ animationDelay: '0.2s' }}></div>
        <div className="absolute bottom-[20%] right-[15%] w-2 h-2 rounded-full bg-primary animate-ping" style={{ animationDelay: '0.7s' }}></div>
        <div className="absolute top-[30%] right-[10%] w-1 h-1 rounded-full bg-primary animate-ping" style={{ animationDelay: '1.2s' }}></div>
        <div className="absolute bottom-[10%] left-[30%] w-1.5 h-1.5 rounded-full bg-primary animate-ping" style={{ animationDelay: '1.8s' }}></div>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <h2 className="text-lg font-bold tracking-[0.3em] text-foreground uppercase animate-pulse">
          {text}
        </h2>
        <div className="mt-3 flex items-center gap-1 opacity-70">
          <span className="text-[10px] font-mono text-primary tracking-widest">INITIALIZING</span>
          <span className="flex gap-1 ml-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0%, 100% { transform: translateY(-100%); opacity: 0; }
          10%, 90% { opacity: 1; }
          50% { transform: translateY(64px); opacity: 1; }
        }
      `}} />
    </div>
  );
}
