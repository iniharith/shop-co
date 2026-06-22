"use client";
import React, { useState, useEffect } from "react";
import { useConversations, useMessages, useSendMessage, useCreateConversation, useDeleteConversation } from "@/hooks/useChat";
import { useUsers } from "@/hooks/useUsers";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown, Plus, Send, User as User, MessageCircle, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatManager() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  
  const { data: convData, isPending: convLoading, refetch: refetchConvs, isFetching: isFetchingConvs } = useConversations();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [text, setText] = useState("");
  
  const { data: msgData, isPending: msgLoading, refetch: refetchMsgs, isFetching: isFetchingMsgs } = useMessages(activeConvId || "");
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(activeConvId || "");
  const { mutate: createConv, isPending: isCreating } = useCreateConversation();
  const { mutate: deleteConv, isPending: isDeleting } = useDeleteConversation();
  
  const { data: usersData } = useUsers();
  const backendUsers = usersData?.users?.filter((u: any) => ['admin', 'sysadmin', 'boss'].includes(u.role)) || [];
  const [openNewChat, setOpenNewChat] = useState(false);

  const conversations = (convData as any)?.conversations || [];
  const messages = (msgData as any)?.messages || [];
  
  // Set initial active conversation
  useEffect(() => {
    if (!activeConvId && conversations.length > 0) {
      setActiveConvId(conversations[0]._id);
    }
  }, [conversations, activeConvId]);

  const handleSend = () => {
    if (!text.trim() || !activeConvId) return;
    sendMessage(text, { onSuccess: () => setText("") });
  };

  const getParticipantName = (conv: any) => {
    if (conv.whatsappPhone) return `WhatsApp: ${conv.whatsappPhone}`;
    const otherParticipant = conv.participants?.find((p: any) => p._id?.toString() !== currentUserId);
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => { refetchConvs(); refetchMsgs(); }} disabled={isFetchingConvs || isFetchingMsgs} className="h-8 w-8 rounded-full shadow-sm" title="Refresh Chats">
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isFetchingConvs || isFetchingMsgs ? 'animate-spin' : ''}`} />
            </Button>
            <Popover open={openNewChat} onOpenChange={setOpenNewChat}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                  <Plus className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Search admin..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No admin found.</CommandEmpty>
                  <CommandGroup>
                    {backendUsers.map((u: any) => (
                      <CommandItem
                        key={u._id}
                        value={u.name || u.email}
                        onSelect={() => {
                          createConv({ participantIds: [u._id], type: 'admin_admin' }, {
                            onSuccess: (res: any) => {
                              if(res.conversation) setActiveConvId(res.conversation._id);
                              setOpenNewChat(false);
                            }
                          });
                        }}
                      >
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        {u.name || u.email}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          </div>
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
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-sm truncate pr-2">{getParticipantName(conv)}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-muted-foreground">{format(new Date(conv.lastMessageAt || new Date()), "MMM d, h:mm a")}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-50 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        if(confirm("Are you sure you want to delete this chat?")) {
                          deleteConv(conv._id, {
                            onSuccess: () => {
                              if (activeConvId === conv._id) setActiveConvId(null);
                            }
                          });
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
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
              <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600" onClick={() => {
                if(confirm("Are you sure you want to delete this chat?")) {
                  deleteConv(activeConvId, {
                    onSuccess: () => setActiveConvId(null)
                  });
                }
              }}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Chat
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col bg-muted/5">
              {messages.map((msg: any) => {
                const isMe = msg.senderId?._id?.toString() === currentUserId || (msg.senderRole && ['admin','sysadmin','boss'].includes(msg.senderRole) && msg.senderId?._id?.toString() === currentUserId) || msg.senderId === currentUserId;
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
            
            <div className="shrink-0 p-4 border-t border-border/50 bg-background">
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
