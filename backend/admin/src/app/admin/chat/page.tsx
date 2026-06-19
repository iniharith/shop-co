import React from "react";
import ChatManager from "@/components/global/chat/ChatManager";

export default function ChatPage() {
  return (
    <div className="p-6 h-[calc(100vh-80px)]">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
        <p className="text-muted-foreground">Communicate with customers and admins.</p>
      </div>
      <ChatManager />
    </div>
  );
}
