/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useConversations, useMessages, useSendMessage, useCreateConversation, useDeleteConversation } from "@/hooks/useChat";
import { useUsers } from "@/hooks/useUsers";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format, isToday, isYesterday } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Plus, Send, MessageCircle, Trash2, RefreshCw } from "lucide-react";
import LoadingAnimation from "@/components/global/LoadingAnimation";
import { getSocket } from "@/utils/socket";
import { useChatTypingStore } from "@/store/chatTypingStore";

const ADMIN_ROLES = ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging'];

const getParticipantName = (conv: any, currentUserId?: string) => {
  if (!conv) return "Unknown User";
  if (conv.source === 'tiktok') return `TikTok: ${conv.tiktokUsername || 'User'}`;
  if (conv.source === 'shopee') return `Shopee: ${conv.shopeeUsername || 'User'}`;
  if (conv.whatsappPhone) return `WhatsApp: ${conv.whatsappPhone}`;
  const otherParticipant = conv.participants?.find((p: any) => p._id?.toString() !== currentUserId);
  return otherParticipant?.name || otherParticipant?.email || "Unknown User";
};

const dayLabel = (day: string) => {
  if (isToday(new Date(day))) return "Today";
  if (isYesterday(new Date(day))) return "Yesterday";
  return format(new Date(day), "MMMM d, yyyy");
};

function ConversationRow({ conv, currentUserId, active, onSelect, onDelete }: {
  conv: any;
  currentUserId?: string;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const typingInfo = useChatTypingStore((s) => s.typing[conv._id]);
  const name = getParticipantName(conv, currentUserId);
  return (
    <div
      onClick={onSelect}
      className={`p-4 border-b border-white/10 cursor-pointer transition-colors flex items-center gap-3 ${active ? 'bg-primary/20 border-l-4 border-l-primary' : 'hover:bg-muted/30'}`}
    >
      <Avatar className="w-10 h-10 border border-border/50">
        <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-semibold text-sm truncate pr-2">{name}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-muted-foreground">{format(new Date(conv.lastMessageAt || new Date()), "MMM d, h:mm a")}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-50 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        {typingInfo?.typing ? (
          <p className="text-xs text-primary font-medium truncate">{typingInfo.userName} is typing…</p>
        ) : (
          <p className="text-xs text-muted-foreground truncate">
            {conv.type === 'admin_customer' ? 'Customer Support' : 'Admin Chat'}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          {conv.unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatManager() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id as string | undefined;
  const client = useQueryClient();

  const { data: convData, isPending: convLoading, refetch: refetchConvs, isFetching: isFetchingConvs } = useConversations();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [text, setText] = useState("");

  const { data: msgData, refetch: refetchMsgs, isFetching: isFetchingMsgs } = useMessages(activeConvId || "");
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(activeConvId || "");
  const { mutate: createConv } = useCreateConversation();
  const { mutate: deleteConv } = useDeleteConversation();

  const { data: usersData } = useUsers();
  // Filter out the current user, but include everyone else (admins, bosses, clients)
  const allUsers = usersData?.users?.filter((u: any) => u._id !== currentUserId) || [];
  const [openNewChat, setOpenNewChat] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");

  const conversations = (convData as any)?.conversations || [];
  const messages = (msgData as any)?.messages || [];

  const filteredConversations = conversations.filter((conv: any) => {
    let matchesPlatform = true;
    if (platformFilter !== 'all') {
      if (platformFilter === 'internal') {
        matchesPlatform = !conv.source || conv.source === 'internal';
      } else {
        matchesPlatform = conv.source === platformFilter;
      }
    }

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const name = getParticipantName(conv, currentUserId).toLowerCase();
      matchesSearch = name.includes(searchQuery.toLowerCase());
    }

    return matchesPlatform && matchesSearch;
  });

  // Set initial active conversation
  useEffect(() => {
    if (!activeConvId && filteredConversations.length > 0) {
      setActiveConvId(filteredConversations[0]._id);
    }
  }, [filteredConversations, activeConvId]);

  // ---- Live typing (like the task modal) ----
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitRef = useRef(0);

  const emitChatTyping = (typing: boolean) => {
    if (!activeConvId) return;
    const socket = session ? getSocket(session as any) : null;
    if (!socket) return;
    socket.emit("chat_typing", { conversationId: activeConvId, typing });
  };

  const handleTextChange = (val: string) => {
    setText(val);
    const now = Date.now();
    if (now - lastTypingEmitRef.current >= 400) {
      lastTypingEmitRef.current = now;
      emitChatTyping(true);
    } else if (!typingTimerRef.current) {
      typingTimerRef.current = setTimeout(() => {
        typingTimerRef.current = null;
        lastTypingEmitRef.current = Date.now();
        emitChatTyping(true);
      }, 400);
    }
  };

  const stopTyping = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    emitChatTyping(false);
    lastTypingEmitRef.current = 0;
  };

  // Make sure we don't leave a stale "typing" state behind when unmounting.
  useEffect(() => {
    return () => stopTyping();
  }, []);

  const selectConversation = (id: string) => {
    stopTyping();
    setActiveConvId(id);
    // Optimistically clear the unread badge for the conversation being opened.
    client.setQueryData(["conversations"], (old: any) => {
      if (!old?.conversations) return old;
      return {
        ...old,
        conversations: old.conversations.map((c: any) =>
          c._id === id ? { ...c, unreadCount: 0 } : c
        ),
      };
    });
  };

  const handleSend = () => {
    if (!text.trim() || !activeConvId) return;
    const currentText = text.trim();
    setText("");
    stopTyping();
    // Optimistically append the message so it appears instantly.
    const optimistic = {
      _id: `temp-${Date.now()}`,
      conversationId: activeConvId,
      senderId: currentUserId,
      senderRole: (session?.user as any)?.role || 'admin',
      text: currentText,
      source: 'web',
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    client.setQueryData(["messages", activeConvId], (old: any) => ({
      ...(old || { success: true }),
      messages: [...(old?.messages || []), optimistic],
    }));
    sendMessage(currentText);
  };

  const activeConv = conversations.find((c: any) => c._id === activeConvId);
  const activeTyping = useChatTypingStore((s) => (activeConvId ? s.typing[activeConvId] : undefined));

  // Auto-scroll to the latest message.
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [activeConvId]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, activeTyping?.typing]);

  // Day separators
  let prevDay = "";

  return (
    <div className="flex h-full min-w-0 flex-col border border-white/10 rounded-2xl bg-background/40 backdrop-blur-md overflow-hidden shadow-xl md:flex-row">
      {/* Sidebar: Conversations List */}
      <div className="h-1/2 w-full min-w-0 border-b border-white/10 bg-transparent flex flex-col md:h-full md:w-1/3 md:min-w-[260px] md:border-b-0 md:border-r">
        <div className="p-4 border-b border-white/10 bg-transparent flex justify-between items-center">
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
              <PopoverContent className="w-[300px] p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search user..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup heading="Available Users">
                      {allUsers.map((u: any) => (
                        <CommandItem
                          key={u._id}
                          value={u.name || u.email}
                          onSelect={() => {
                            createConv({ participantIds: [currentUserId, u._id], type: 'admin_admin' }, {
                              onSuccess: (res: any) => {
                                if (res.conversation) setActiveConvId(res.conversation._id);
                                setOpenNewChat(false);
                              }
                            });
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{u.name || u.email}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{u.role}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="p-3 border-b border-white/10 bg-transparent flex flex-col gap-3">
          <Input
            placeholder="Search username..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-9 bg-background/20 text-sm border-white/10"
          />
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {['all', 'internal', 'whatsapp', 'tiktok', 'shopee'].map(pf => (
              <Button
                key={pf}
                variant={platformFilter === pf ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-[10px] uppercase font-bold tracking-wider rounded-full shrink-0"
                onClick={() => setPlatformFilter(pf)}
              >
                {pf}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convLoading && <div className="flex justify-center"><LoadingAnimation fullScreen={false} label="" scale={0.35} /></div>}
          {!convLoading && filteredConversations.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">No conversations found</div>
          )}
          {filteredConversations.map((conv: any) => (
            <ConversationRow
              key={conv._id}
              conv={conv}
              currentUserId={currentUserId}
              active={activeConvId === conv._id}
              onSelect={() => selectConversation(conv._id)}
              onDelete={() => {
                if (confirm("Are you sure you want to delete this chat?")) {
                  deleteConv(conv._id, {
                    onSuccess: () => {
                      if (activeConvId === conv._id) setActiveConvId(null);
                    }
                  });
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Area: Chat Window */}
      <div className="min-h-0 min-w-0 flex-1 flex flex-col bg-transparent relative">
        {activeConvId ? (
          <>
            <div className="p-4 border-b border-white/10 flex items-center justify-between shadow-sm z-10 bg-background/40 backdrop-blur-md">
              <div className="min-w-0">
                <h3 className="font-semibold text-lg truncate">
                  {getParticipantName(activeConv, currentUserId)}
                </h3>
                {activeTyping?.typing && (
                  <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    {activeTyping.userName} is typing…
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600" onClick={() => {
                if (confirm("Are you sure you want to delete this chat?")) {
                  deleteConv(activeConvId, {
                    onSuccess: () => setActiveConvId(null)
                  });
                }
              }}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Chat
              </Button>
            </div>

            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col bg-transparent">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
                  <MessageCircle className="w-10 h-10 opacity-20" />
                  <p>No messages yet. Say hello!</p>
                </div>
              )}
              {messages.map((msg: any) => {
                const day = format(new Date(msg.createdAt), "yyyy-MM-dd");
                const showDay = day !== prevDay;
                prevDay = day;
                const isMe = msg.senderId?._id?.toString() === currentUserId || msg.senderId === currentUserId || (msg.senderRole && ADMIN_ROLES.includes(msg.senderRole) && msg.senderId?._id?.toString() === currentUserId);
                return (
                  <React.Fragment key={msg._id}>
                    {showDay && (
                      <div className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/70 my-2">{dayLabel(day)}</div>
                    )}
                    <div className={`flex min-w-0 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`min-w-0 max-w-[85%] p-3 rounded-2xl md:max-w-[70%] ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted border border-border/50 rounded-tl-sm'}`}>
                        {!isMe && msg.senderId && <p className="text-[10px] font-bold mb-1 opacity-70">{msg.senderId.name || msg.senderRole}</p>}
                        <p className="text-sm whitespace-pre-wrap [overflow-wrap:anywhere]">{msg.text}</p>
                        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          <span>{format(new Date(msg.createdAt), "h:mm a")}</span>
                          {msg.source === 'whatsapp' && <span>• via WhatsApp</span>}
                          {isMe && <span title={msg.isRead ? 'Read' : 'Sent'}>{msg.isRead ? '✓✓' : '✓'}</span>}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 p-4 border-t border-white/10 bg-background/40 backdrop-blur-md">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={text}
                  onChange={e => handleTextChange(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  onBlur={stopTyping}
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
