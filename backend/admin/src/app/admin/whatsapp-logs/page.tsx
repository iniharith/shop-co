"use client";

import React, { useEffect, useState, useRef } from "react";
import { Bot, Terminal } from "lucide-react";
import { useSession } from "next-auth/react";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export default function WhatsAppLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const endOfLogsRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://56.68.8.52:5002/api/logs");
      if (!res.ok) throw new Error("Failed to fetch logs");
      const json = await res.json();
      setLogs(json.logs || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to connect to the WhatsApp AI Agent API.");
    }
  };

  useEffect(() => {
    // Fetch logs immediately, then poll every 2 seconds
    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    endOfLogsRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Restrict to sysadmin only (double-check on client side just in case)
  if (session?.user?.role !== "sysadmin") {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        You do not have permission to view this page.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white p-4 md:p-8 font-sans h-[calc(100vh-theme(spacing.16))] overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
        <div className="flex flex-wrap items-center space-x-2 md:space-x-6">
          <div className="flex items-center text-white font-bold text-xl mr-4">
            <Bot className="w-6 h-6 mr-2 text-green-400" />
            <span>WhatsApp AI Logs</span>
          </div>
          <div className="flex flex-wrap gap-2 md:space-x-4 text-xs md:text-sm font-medium text-gray-500">
            <span className="text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full flex items-center">
              <Terminal className="w-4 h-4 mr-2" />
              Live Terminal
            </span>
          </div>
        </div>
      </div>

      {/* Terminal Window */}
      <div className="w-full max-w-6xl mx-auto bg-[#0c0c0c] rounded-lg border border-gray-800 shadow-2xl overflow-hidden flex flex-col h-[70vh]">
        
        {/* Fake Window Header */}
        <div className="h-8 bg-[#1e1e1e] flex items-center px-4 border-b border-gray-800 shrink-0">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="mx-auto text-xs text-gray-500 font-mono">
            sysadmin@ai-agent: ~
          </div>
        </div>

        {/* Log Output Area */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed" style={{ scrollBehavior: 'smooth' }}>
          {error && (
            <div className="text-red-400 mb-4 bg-red-900/20 p-4 rounded-md border border-red-900/50">
              [SYSTEM ERROR] {error}
              <br />
              Make sure `server-sandbox.js` is currently running in the ai-agent directory.
            </div>
          )}
          
          {logs.length === 0 && !error ? (
            <div className="text-gray-500 italic">Waiting for AI agent logs...</div>
          ) : (
            logs.map((log, index) => {
              // Colorize based on content
              let textColor = "text-gray-300";
              if (log.level === "error" || log.message.includes("[ERROR]")) {
                textColor = "text-red-400";
              } else if (log.message.includes("[INCOMING]")) {
                textColor = "text-blue-400";
              } else if (log.message.includes("[AI REPLY]") || log.message.includes("[AI TOOL CALL]")) {
                textColor = "text-green-400";
              } else if (log.message.includes("[SYSTEM]") || log.message.includes("[AUTH]")) {
                textColor = "text-yellow-400";
              }

              return (
                <div key={index} className={`mb-1 break-words ${textColor}`}>
                  <span className="text-gray-600 mr-3 text-xs">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {log.message}
                </div>
              );
            })
          )}
          <div ref={endOfLogsRef} />
        </div>
      </div>
    </div>
  );
}
