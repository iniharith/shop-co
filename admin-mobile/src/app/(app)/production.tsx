import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import api from '../../services/api';
import socketService from '../../services/socket';
import { useTheme } from '../../context/ThemeContext';
import { THEME } from '../../constants/theme';
import { PenTool, ArrowLeft, Settings2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ProductionScreen() {
  const { theme, colors } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socketService.connect();
    socketService.on('task_updated' as any, () => { fetchData(); });
    const fetchData = async () => {
      try {
        const res = await api.get('/tasks?status=IN_PRODUCTION');
        setData(res.data?.tasks || res.data?.data || res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd, colors.gradientStart]} style={s.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </LinearGradient>
  );

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd, colors.gradientStart]} style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.pageTitle}>Production</Text>
            <Text style={s.pageSub}>Production pipeline overview</Text>
          </View>
          <View style={s.iconCircle}>
            <PenTool size={20} color={colors.primary} />
          </View>
        </View>
      </BlurView>

      <FlatList
        data={data}
        keyExtractor={(item, idx) => item._id || idx.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
        ListEmptyComponent={
          <BlurView intensity={theme === 'dark' ? 15 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.emptyCard}>
            <Settings2 size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>No production tasks</Text>
            <Text style={{ color: colors.mutedForeground, marginTop: 4 }}>Your production pipeline is clear.</Text>
          </BlurView>
        }
        renderItem={({ item }) => (
          <BlurView intensity={theme === 'dark' ? 15 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.card}>
            <Text style={s.cardTitle}>{item.title || 'Production Item'}</Text>
            <Text style={s.cardDesc}>{item.status || 'Pending'}</Text>
          </BlurView>
        )}
      />
    </LinearGradient>
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

