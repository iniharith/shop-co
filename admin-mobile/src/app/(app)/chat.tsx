import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, MessageSquare, Send } from 'lucide-react-native';
import api from '../../services/api';
import socketService from '../../services/socket';

export default function ChatScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      const list = res.data?.data || res.data || [];
      setConversations(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to fetch conversations:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = useCallback(async (id: string) => {
    try {
      const res = await api.get(`/chat/conversations/${id}/messages`);
      setMessages(res.data?.messages || res.data?.data || []);
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    }
  }, []);

  // Keep a ref in sync so the socket handler below (registered once on mount)
  // always knows which thread is currently open without re-subscribing.
  const activeIdRef = React.useRef<string | null>(null);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  useEffect(() => {
    fetchConversations();
    socketService.connect();

    const off = socketService.on('new_message', (msg: any) => {
      // Bump the conversation list so unread/last-message previews stay fresh.
      fetchConversations();
      // If we're looking at the thread this message belongs to, append it live
      // instead of waiting for the next poll.
      const belongsToOpenThread = msg?.conversationId && msg.conversationId === activeIdRef.current;
      if (belongsToOpenThread) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => {
      off();
      socketService.disconnect();
    };
  }, []);

  const openThread = (id: string) => {
    setActiveId(id);
    fetchMessages(id);
  };

  const sendMessage = async () => {
    if (!draft.trim() || !activeId) return;
    setSending(true);
    try {
      await api.post(`/chat/conversations/${activeId}/messages`, { text: draft.trim() });
      setDraft('');
      fetchMessages(activeId);
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setSending(false);
    }
  };

  if (activeId) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 pt-14 px-5 mb-4">
          <TouchableOpacity onPress={() => setActiveId(null)} className="p-1">
            <ChevronLeft size={24} color="#fafafa" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-foreground">Conversation</Text>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item, idx) => item._id || String(idx)}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8 }}
          renderItem={({ item }) => (
            <View className={`max-w-[80%] p-3 rounded-xl ${item.isAdmin || item.fromAdmin ? 'self-end bg-primary/10' : 'self-start bg-card border border-border'}`}>
              <Text className="text-foreground text-sm">{item.text}</Text>
            </View>
          )}
          ListEmptyComponent={<Text className="text-muted-foreground text-center mt-10">No messages yet.</Text>}
        />

        <View className="flex-row items-center gap-2 px-5 py-3 border-t border-border">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message…"
            placeholderTextColor="#666"
            className="flex-1 bg-card border border-border rounded-full px-4 py-2.5 text-foreground"
          />
          <TouchableOpacity onPress={sendMessage} disabled={sending} className="h-10 w-10 rounded-full bg-primary items-center justify-center">
            <Send size={16} color="#171717" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View className="flex-1 bg-background pt-14 px-5">
      <View className="flex-row items-center gap-3 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">Chat</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="hsl(45, 93%, 47%)" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text className="text-muted-foreground text-center mt-10">No conversations yet.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => openThread(item._id)}
              className="bg-card p-4 rounded-xl mb-3 border border-border flex-row items-center"
            >
              <View className="h-10 w-10 rounded-full bg-secondary items-center justify-center mr-3">
                <MessageSquare size={18} color="#888" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{item.customerName || item.title || 'Customer'}</Text>
                <Text numberOfLines={1} className="text-muted-foreground text-xs">{item.lastMessage || 'Tap to open'}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
