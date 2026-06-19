"use client";
import React from 'react';
import { useSession } from 'next-auth/react';
import { ChatBox } from '@/components/global/FloatingChatWidget';
import { MessageCircle } from 'lucide-react';

const ProfileChatPage = () => {
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-[500px] text-gray-500">
        Please log in to use chat.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[600px]">
      <div className="bg-black text-white p-4 flex items-center gap-2">
        <MessageCircle size={20} />
        <h3 className="font-semibold">Customer Support Chat</h3>
      </div>
      <ChatBox userId={session.user.id} />
    </div>
  );
};

export default ProfileChatPage;
