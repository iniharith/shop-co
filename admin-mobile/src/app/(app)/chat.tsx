import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppBackground from '../../components/AppBackground';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { THEME } from '../../constants/theme';
import { MessageSquare, ArrowLeft, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ChatScreen() {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/chat');
        setData(res.data?.data || res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <AppBackground style={s.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </AppBackground>
  );

  return (
    <AppBackground style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.header, { paddingTop: insets.top + 10 }]}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.pageTitle}>Team Chat</Text>
            <Text style={s.pageSub}>Internal communication</Text>
          </View>
          <View style={s.iconCircle}>
            <MessageSquare size={20} color={colors.primary} />
          </View>
        </View>
      </BlurView>

      <FlatList
        data={data}
        keyExtractor={(item, idx) => item._id || idx.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
        ListEmptyComponent={
          <BlurView intensity={theme === 'dark' ? 15 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.emptyCard}>
            <Users size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>No active chats</Text>
            <Text style={{ color: colors.mutedForeground, marginTop: 4 }}>Start a conversation with your team.</Text>
          </BlurView>
        }
        renderItem={({ item }) => (
          <BlurView intensity={theme === 'dark' ? 15 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.card}>
            <Text style={s.cardTitle}>{item.title || 'Chat Room'}</Text>
            <Text style={s.cardDesc}>{item.status || 'Active'}</Text>
          </BlurView>
        )}
      />
    </AppBackground>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: THEME.glassBorder, marginBottom: 4 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 8, marginLeft: -8 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: THEME.foreground, letterSpacing: -0.5 },
  pageSub: { color: THEME.mutedForeground, fontSize: 13, marginTop: 2 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 215, 0, 0.1)', alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 16 },
  cardTitle: { color: THEME.foreground, fontWeight: '700', fontSize: 15 },
  cardDesc: { color: THEME.mutedForeground, fontSize: 13, marginTop: 4 },
  emptyCard: { borderRadius: 16, borderWidth: 1, borderColor: THEME.glassBorder, padding: 32, alignItems: 'center', marginTop: 40 },
});
