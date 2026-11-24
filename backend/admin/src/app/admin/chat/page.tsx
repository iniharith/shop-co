/**
 * Coded by Harith
 * Kampungcetak ®
 */
import React from "react";
import ChatManager from "@/components/global/chat/ChatManager";
import Link from 'next/link';

export default function ChatPage() {
  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex flex-col gap-2 mb-4 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Chat</h1>
        <p className="text-muted-foreground">Communicate with customers and admins.</p>
        <Link href="/admin/assistant" className="text-sm text-primary underline">Open private AI Assistant · shared with Telegram</Link>
      </div>
      <div className="flex-1 min-h-0">
        <ChatManager />
      </div>
    </div>
  );
}
