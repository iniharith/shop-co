/**
 * Coded by Harith
 * Kampungcetak ®
 */
import React from "react";
import ChatManager from "@/components/global/chat/ChatManager";

export default function ChatPage() {
  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex flex-col gap-2 mb-4 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
        <p className="text-muted-foreground">Communicate with customers and admins.</p>
      </div>
      <div className="flex-1 min-h-0">
        <ChatManager />
      </div>
    </div>
  );
}
