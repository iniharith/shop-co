import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, RefreshControl, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, MessageSquare, Plus, Search, Send, Users, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '../../components/AppBackground';
import FrostedView from '../../components/FrostedView';
import api from '../../services/api';
import socketService from '../../services/socket';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';

export default function ChatScreen() {
  const { theme, colors } = useTheme();
  const user = useAuthStore(state => state.user);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const messageListRef = useRef<FlatList>(null);
  const selectedRef = useRef<any>(null);
  const messageRequestRef = useRef(0);
  const [conversations, setConversations] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/chat/conversations?type=admin_admin');
      const rows = Array.isArray(response.data?.conversations) ? response.data.conversations : [];
      setConversations(rows.filter((conversation: any) => conversation.type === 'admin_admin'));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Could not load team chats.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchStaff = useCallback(async () => {
    try {
      const response = await api.get('/admin/users');
      const rows = Array.isArray(response.data?.users) ? response.data.users : [];
      setStaff(rows.filter((member: any) => member._id !== user?._id));
    } catch (requestError) {
      console.error(requestError);
    }
  }, [user?._id]);

  const fetchMessages = useCallback(async (conversationId: string, showLoader = true) => {
    const requestId = ++messageRequestRef.current;
    if (showLoader) setMessagesLoading(true);
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`);
      if (requestId === messageRequestRef.current && selectedRef.current?._id === conversationId) {
        setMessages(Array.isArray(response.data?.messages) ? response.data.messages : []);
      }
    } catch (requestError: any) {
      if (requestId === messageRequestRef.current && selectedRef.current?._id === conversationId) {
        Alert.alert('Messages unavailable', requestError?.response?.data?.message || 'Could not load this conversation.');
      }
    } finally {
      if (requestId === messageRequestRef.current && selectedRef.current?._id === conversationId) setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([fetchConversations(), fetchStaff()]);
    socketService.connect();
    const offMessage = socketService.on('new_message', (payload: any) => {
      void fetchConversations();
      const conversationId = typeof payload?.conversationId === 'string' ? payload.conversationId : payload?.conversationId?._id;
      if (conversationId && selectedRef.current?._id === conversationId) void fetchMessages(conversationId, false);
    });
    return () => { offMessage(); socketService.disconnect(); };
  }, [fetchConversations, fetchMessages, fetchStaff]);

  const openConversation = (conversation: any) => {
    selectedRef.current = conversation;
    setSelected(conversation);
    setComposer('');
    void fetchMessages(conversation._id);
  };

  const closeConversation = () => {
    messageRequestRef.current += 1;
    selectedRef.current = null;
    setSelected(null);
    setMessages([]);
  };

  const startConversation = async (member: any) => {
    const existing = conversations.find(conversation => conversation.participants?.some((participant: any) => participantId(participant) === member._id));
    if (existing) {
      setPickerVisible(false);
      openConversation(existing);
      return;
    }
    if (!user?._id) return;
    setCreatingFor(member._id);
    try {
      const response = await api.post('/chat/conversations', {
        participantIds: [user._id, member._id],
        type: 'admin_admin',
      });
      const created = response.data?.conversation;
      if (!created?._id) throw new Error('Conversation was not returned');
      const hydrated = { ...created, participants: [user, member] };
      setPickerVisible(false);
      setStaffSearch('');
      openConversation(hydrated);
      await fetchConversations();
    } catch (requestError: any) {
      Alert.alert('Chat not created', requestError?.response?.data?.message || 'Could not start this conversation.');
    } finally {
      setCreatingFor(null);
    }
  };

  const sendMessage = async () => {
    const text = composer.trim();
    if (!selected?._id || !text || sending) return;
    const conversationId = selected._id;
    setSending(true);
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, { text, source: 'web' });
      const sent = response.data?.message;
      if (selectedRef.current?._id === conversationId) {
        if (sent?._id) setMessages(current => current.some(message => message._id === sent._id) ? current : [...current, { ...sent, senderId: user }]);
        setComposer(current => current.trim() === text ? '' : current);
      }
      void fetchConversations();
    } catch (requestError: any) {
      Alert.alert('Message not sent', requestError?.response?.data?.message || 'Could not send this message.');
    } finally {
      setSending(false);
    }
  };

  const conversationName = (conversation: any) => {
    const teammate = conversation?.participants?.find((participant: any) => participantId(participant) !== user?._id);
    return typeof teammate === 'object' ? teammate?.name || teammate?.email || 'Team member' : 'Team member';
  };

  const filteredStaff = staff.filter(member => `${member.name || ''} ${member.email || ''} ${member.role || ''}`.toLowerCase().includes(staffSearch.toLowerCase()));

  if (selected) {
    const title = conversationName(selected);
    return (
      <AppBackground style={s.screen}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <FrostedView intensity={78} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.header, { borderBottomColor: colors.navBorder, paddingTop: insets.top + 10 }]}>
          <View style={s.headerTop}>
            <TouchableOpacity onPress={closeConversation} style={s.backBtn}><ArrowLeft size={20} color={colors.foreground} /></TouchableOpacity>
            <View style={[s.avatar, { backgroundColor: colors.primary }]}><Text style={s.avatarText}>{title.slice(0, 1).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}><Text style={[s.pageTitle, { color: colors.foreground }]} numberOfLines={1}>{title}</Text><Text style={[s.pageSub, { color: colors.mutedForeground }]}>Team conversation</Text></View>
          </View>
        </FrostedView>
        <KeyboardAvoidingView style={s.chatBody} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
          {messagesLoading ? <View style={s.center}><ActivityIndicator color={colors.primary} /></View> : (
            <FlatList
              ref={messageListRef}
              data={messages}
              keyExtractor={(message, index) => message._id || String(index)}
              contentContainerStyle={s.messages}
              onContentSizeChange={() => messageListRef.current?.scrollToEnd({ animated: true })}
              ListEmptyComponent={<View style={s.messageEmpty}><MessageSquare size={28} color={colors.mutedForeground} /><Text style={{ color: colors.mutedForeground, textAlign: 'center' }}>No messages yet. Say hello to {title}.</Text></View>}
              renderItem={({ item }) => {
                const senderId = participantId(item.senderId);
                const mine = senderId === user?._id;
                return <View style={[s.messageRow, mine && s.messageRowMine]}><View style={[s.bubble, mine ? { backgroundColor: colors.primary } : { backgroundColor: colors.glass, borderColor: colors.glassBorder, borderWidth: 1 }]}><Text style={{ color: mine ? '#000' : colors.foreground, fontSize: 13, lineHeight: 19 }}>{item.text}</Text><Text style={{ color: mine ? 'rgba(0,0,0,0.58)' : colors.mutedForeground, fontSize: 8, marginTop: 4, textAlign: 'right' }}>{item.createdAt ? new Date(item.createdAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' }) : ''}</Text></View></View>;
              }}
            />
          )}
          <FrostedView intensity={84} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.composerShell, { borderColor: colors.glassBorder, marginBottom: insets.bottom + 88 }]}>
            <TextInput value={composer} onChangeText={setComposer} placeholder="Message your teammate..." placeholderTextColor={colors.mutedForeground} multiline style={[s.composerInput, { color: colors.foreground }]} />
            <TouchableOpacity disabled={!composer.trim() || sending} onPress={() => void sendMessage()} style={[s.sendButton, { backgroundColor: composer.trim() ? colors.primary : colors.secondary }]}>{sending ? <ActivityIndicator size="small" color="#000" /> : <Send size={17} color={composer.trim() ? '#000' : colors.mutedForeground} />}</TouchableOpacity>
          </FrostedView>
        </KeyboardAvoidingView>
      </AppBackground>
    );
  }

  return (
    <AppBackground style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <FrostedView intensity={78} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.header, { borderBottomColor: colors.navBorder, paddingTop: insets.top + 10 }]}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><ArrowLeft size={20} color={colors.foreground} /></TouchableOpacity>
          <View style={{ flex: 1 }}><Text style={[s.pageTitle, { color: colors.foreground }]}>Team Chat</Text><Text style={[s.pageSub, { color: colors.mutedForeground }]}>Internal communication</Text></View>
          <TouchableOpacity onPress={() => { setPickerVisible(true); void fetchStaff(); }} style={[s.newChatButton, { backgroundColor: colors.primary }]}><Plus size={18} color="#000" /><Text style={s.newChatText}>New</Text></TouchableOpacity>
        </View>
      </FrostedView>
      {loading ? <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View> : (
        <FlatList
          data={conversations}
          keyExtractor={(item, index) => item._id || String(index)}
          contentContainerStyle={s.conversationList}
          refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.primary} onRefresh={() => { setRefreshing(true); void fetchConversations(); }} />}
          ListEmptyComponent={<FrostedView intensity={58} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.emptyCard, { borderColor: colors.glassBorder }]}><Users size={32} color={colors.mutedForeground} /><Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '800' }}>{error ? 'Team chat unavailable' : 'No team chats yet'}</Text><Text style={{ color: error ? colors.destructive : colors.mutedForeground, textAlign: 'center', lineHeight: 18 }}>{error || 'Start a private conversation with a teammate.'}</Text><TouchableOpacity onPress={() => error ? void fetchConversations() : setPickerVisible(true)} style={[s.emptyAction, { backgroundColor: colors.primary }]}><Text style={s.emptyActionText}>{error ? 'Try Again' : 'Start New Chat'}</Text></TouchableOpacity></FrostedView>}
          renderItem={({ item }) => {
            const name = conversationName(item);
            return <TouchableOpacity activeOpacity={0.78} onPress={() => openConversation(item)}><FrostedView intensity={58} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.card, { borderColor: colors.glassBorder }]}><View style={[s.avatar, { backgroundColor: colors.primary }]}><Text style={s.avatarText}>{name.slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={[s.cardTitle, { color: colors.foreground }]} numberOfLines={1}>{name}</Text><Text style={[s.cardDesc, { color: colors.mutedForeground }]}>{item.unreadCount ? `${item.unreadCount} unread messages` : 'Open conversation'}</Text></View><Text style={{ color: colors.mutedForeground, fontSize: 9 }}>{item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleDateString('en-MY') : ''}</Text></FrostedView></TouchableOpacity>;
          }}
        />
      )}

      <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setPickerVisible(false)} />
          <FrostedView intensity={88} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.picker, { borderColor: colors.glassBorder, paddingBottom: insets.bottom + 16 }]}>
            <View style={s.pickerHeader}><View><Text style={[s.pickerTitle, { color: colors.foreground }]}>New Team Chat</Text><Text style={[s.pageSub, { color: colors.mutedForeground }]}>Choose a teammate</Text></View><TouchableOpacity onPress={() => setPickerVisible(false)} style={s.closeButton}><X size={19} color={colors.foreground} /></TouchableOpacity></View>
            <View style={[s.searchBox, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}><Search size={16} color={colors.mutedForeground} /><TextInput value={staffSearch} onChangeText={setStaffSearch} placeholder="Search staff..." placeholderTextColor={colors.mutedForeground} style={{ flex: 1, color: colors.foreground }} /></View>
            <FlatList data={filteredStaff} keyExtractor={member => member._id} contentContainerStyle={{ paddingTop: 8 }} ListEmptyComponent={<Text style={{ color: colors.mutedForeground, textAlign: 'center', padding: 24 }}>No staff members found.</Text>} renderItem={({ item }) => <TouchableOpacity disabled={!!creatingFor} onPress={() => void startConversation(item)} style={[s.staffRow, { borderBottomColor: colors.glassBorder }]}><View style={[s.avatar, { backgroundColor: colors.primary }]}><Text style={s.avatarText}>{String(item.name || item.email || 'U').slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontWeight: '800' }}>{item.name || item.email}</Text><Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{item.role || 'Staff'} · {item.email}</Text></View>{creatingFor === item._id ? <ActivityIndicator color={colors.primary} /> : <MessageSquare size={17} color={colors.primary} />}</TouchableOpacity>} />
          </FrostedView>
        </View>
      </Modal>
    </AppBackground>
  );
}

function participantId(participant: any) {
  return typeof participant === 'string' ? participant : participant?._id;
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  backBtn: { width: 36, height: 36, marginLeft: -8, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  pageSub: { fontSize: 12, marginTop: 2 },
  newChatButton: { minHeight: 38, paddingHorizontal: 12, borderRadius: 19, flexDirection: 'row', alignItems: 'center', gap: 5 },
  newChatText: { color: '#000', fontSize: 12, fontWeight: '900' },
  conversationList: { padding: 16, paddingBottom: 120, gap: 10, flexGrow: 1 },
  card: { minHeight: 72, borderRadius: 16, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, overflow: 'hidden' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#000', fontSize: 15, fontWeight: '900' },
  cardTitle: { fontSize: 14, fontWeight: '800' },
  cardDesc: { fontSize: 11, marginTop: 3 },
  emptyCard: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: 'center', gap: 10, marginTop: 40, overflow: 'hidden' },
  emptyAction: { height: 40, borderRadius: 20, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  emptyActionText: { color: '#000', fontSize: 12, fontWeight: '900' },
  chatBody: { flex: 1 },
  messages: { padding: 16, gap: 8, flexGrow: 1 },
  messageEmpty: { flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 28 },
  messageRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  messageRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 17, paddingHorizontal: 13, paddingVertical: 9 },
  composerShell: { minHeight: 54, maxHeight: 116, marginHorizontal: 12, borderRadius: 27, borderWidth: 1, padding: 6, paddingLeft: 15, flexDirection: 'row', alignItems: 'flex-end', gap: 8, overflow: 'hidden' },
  composerInput: { flex: 1, maxHeight: 92, minHeight: 40, fontSize: 13, paddingVertical: 10 },
  sendButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)' },
  picker: { height: '72%', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, padding: 16, overflow: 'hidden' },
  pickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  pickerTitle: { fontSize: 19, fontWeight: '900' },
  closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  searchBox: { height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  staffRow: { minHeight: 64, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9 },
});
