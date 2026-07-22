/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useConversations, useMessages, useSendMessage, useCreateConversation } from "@/hooks/useChat";
import { MessageCircle, X, Send, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

const FloatingChatWidget = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  
  // We only show widget if user is logged in
  if (!session?.user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 z-50 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageCircle size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[350px] h-[500px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          <div className="bg-black text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <h3 className="font-semibold">Support Chat</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <ChatBox userId={session.user.id} />
        </div>
      )}
    </>
  );
};

import { useStaff } from "@/hooks/useProfile";

export const ChatBox = ({ userId }: { userId: string }) => {
  const { data: convData, isPending: convLoading } = useConversations();
  const { mutate: createConv, isPending: isCreating } = useCreateConversation();
  
  const conversations = (convData as any)?.conversations || [];
  
  const activeConversation = conversations.find((c: any) => c.type === 'admin_customer');

  useEffect(() => {
    // Auto-create a conversation if none exists
    if (!convLoading && !isCreating && conversations.length > 0 && !activeConversation) {
      createConv({
        participantIds: [userId],
        type: 'admin_customer'
      });
    }
    if (!convLoading && conversations.length === 0 && !isCreating) {
      createConv({
        participantIds: [userId],
        type: 'admin_customer'
      });
    }
  }, [convLoading, conversations, activeConversation, isCreating, userId, createConv]);

  if (convLoading || isCreating || !activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-sm text-gray-500 relative bg-gray-50">
        Connecting...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative h-full">
      <div className="bg-gray-100 p-2.5 px-4 text-xs border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
         <span className="font-semibold text-gray-700">Chatting with Admin Support</span>
      </div>
      <ChatMessages conversationId={activeConversation._id} currentUserId={userId} />
    </div>
  );
};

const ChatMessages = ({ conversationId, currentUserId }: { conversationId: string, currentUserId: string }) => {
  const { data: msgData, isPending } = useMessages(conversationId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage(conversationId);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = (msgData as any)?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        <div className="text-center text-xs text-gray-400 my-4">
          Chat started. An admin will reply shortly.
        </div>
        {messages.map((msg: any) => {
          const isMe = msg.senderId?._id === currentUserId || msg.senderRole === 'client' || msg.senderId === currentUserId;
          return (
            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${isMe ? 'bg-black text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm shadow-sm'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <div className={`text-[10px] mt-1.5 text-right ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                  {format(new Date(msg.createdAt), "h:mm a")}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-gray-300 focus:ring-0 rounded-full px-4 py-2 text-sm transition-all"
          />
          <button 
            onClick={handleSend} 
            disabled={isSending || !text.trim()} 
            className="w-10 h-10 shrink-0 bg-green-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-green-700 transition-colors"
          >
            <Send size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </>
  );
};

export default FloatingChatWidget;
