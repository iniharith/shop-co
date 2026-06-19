"use client";
import React, { useState, useEffect } from "react";
import { useConversations, useMessages, useSendMessage, useCreateConversation } from "@/hooks/useChat";
import { useUsers } from "@/hooks/useUsers";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, User as UserIcon, MessageCircle } from "lucide-react";
import { format } from "date-fns";

export default function ChatManager() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  
  const { data: convData, isPending: convLoading } = useConversations();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [text, setText] = useState("");
  
  const { data: msgData, isPending: msgLoading } = useMessages(activeConvId || "");
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(activeConvId || "");
  const { mutate: createConv, isPending: isCreating } = useCreateConversation();
  
  const { data: usersData } = useUsers();

  const conversations = convData?.conversations || [];
  const messages = msgData?.messages || [];
  
  // Set initial active conversation
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0]._id);
    }
  }, [conversations, activeConvId]);

  const handleSend = () => {
    if (!text.trim() || !activeConvId) return;
    sendMessage(text, {
      onSuccess: () => setText("")
    });
  };

  const getParticipantName = (conv: any) => {
    if (conv.whatsappPhone) return `WhatsApp: ${conv.whatsappPhone}`;
    const otherParticipant = conv.participants?.find((p: any) => p._id !== currentUserId);
    return otherParticipant?.name || otherParticipant?.email || "Unknown User";
  };

  return (
    <div className="flex h-full border border-border/50 rounded-xl bg-card overflow-hidden shadow-sm">
      {/* Sidebar: Conversations List */}
      <div className="w-1/3 min-w-[300px] border-r border-border/50 bg-muted/10 flex flex-col">
        <div className="p-4 border-b border-border/50 bg-background flex justify-between items-center">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" /> Inbox
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convLoading && <div className="p-4 text-sm text-muted-foreground text-center">Loading...</div>}
          {!convLoading && conversations.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">No conversations yet</div>
          )}
          {conversations.map((conv: any) => (
            <div
              key={conv._id}
              onClick={() => setActiveConvId(conv._id)}
              className={`p-4 border-b border-border/50 cursor-pointer transition-colors flex items-center gap-3 ${activeConvId === conv._id ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-muted/30'}`}
            >
              <Avatar className="w-10 h-10 border border-border/50">
                <AvatarFallback>{getParticipantName(conv).substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-sm truncate">{getParticipantName(conv)}</h3>
                  <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(conv.lastMessageAt), "MMM d, h:mm a")}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {conv.type === 'admin_customer' ? 'Customer Support' : 'Admin Chat'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area: Chat Window */}
      <div className="flex-1 flex flex-col bg-background relative">
        {activeConvId ? (
          <>
            <div className="p-4 border-b border-border/50 flex items-center justify-between shadow-sm z-10 bg-background/95 backdrop-blur">
              <h3 className="font-semibold text-lg">
                {getParticipantName(conversations.find((c: any) => c._id === activeConvId))}
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col-reverse">
              {msgLoading && <div className="text-center text-muted-foreground text-sm p-4">Loading messages...</div>}
              {/* Note: the messages array from API is sorted asc, we map them normally if we don't flex-col-reverse. Let's map them. Since flex-col-reverse is tricky, we'll remove it. */}
            </div>
            <div className="absolute inset-0 top-[69px] bottom-[73px] overflow-y-auto p-6 space-y-6 flex flex-col bg-muted/5">
              {messages.map((msg: any) => {
                const isMe = msg.senderId?._id === currentUserId || (msg.senderRole && ['admin','sysadmin','boss'].includes(msg.senderRole));
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted border border-border/50 rounded-tl-sm'}`}>
                      {!isMe && msg.senderId && <p className="text-[10px] font-bold mb-1 opacity-70">{msg.senderId.name || msg.senderRole}</p>}
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                        {format(new Date(msg.createdAt), "h:mm a")} {msg.source === 'whatsapp' && '• via WhatsApp'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-4 border-t border-border/50 bg-background absolute bottom-0 left-0 right-0">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="bg-muted/30 focus-visible:ring-1"
                />
                <Button onClick={handleSend} disabled={isSending} size="icon" className="shrink-0 px-4">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
