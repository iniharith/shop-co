import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppBackground from '../../components/AppBackground';
import FrostedView from '../../components/FrostedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { THEME } from '../../constants/theme';
import { History, ArrowLeft, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function HistoryScreen() {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/admin/orders');
        const orders = res.data?.orders || [];
        setData(orders.filter((order: any) => ['DELIVERED', 'DONE_DESIGN', 'SHIPPED', 'IN_TRANSIT', 'CANCELLED', 'FAILED'].includes(order.status) || order.isArchived));
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

      <FrostedView intensity={theme === 'dark' ? 48 : 65} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.header, { backgroundColor: colors.navBg, borderBottomColor: colors.navBorder, paddingTop: insets.top + 10 }]}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.pageTitle}>System History</Text>
            <Text style={s.pageSub}>Task and order logs</Text>
          </View>
          <View style={s.iconCircle}>
            <History size={20} color={colors.primary} />
          </View>
        </View>
      </FrostedView>

      <FlatList
        data={data}
        keyExtractor={(item, idx) => item._id || idx.toString()}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
        ListEmptyComponent={
          <FrostedView intensity={theme === 'dark' ? 45 : 70} tint={theme === 'dark' ? 'dark' : 'light'} style={s.emptyCard}>
            <Clock size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>No history records</Text>
            <Text style={{ color: colors.mutedForeground, marginTop: 4 }}>System logs will appear here.</Text>
          </FrostedView>
        }
        renderItem={({ item }) => (
          <FrostedView intensity={theme === 'dark' ? 45 : 70} tint={theme === 'dark' ? 'dark' : 'light'} style={s.card}>
            <Text style={s.cardTitle}>{item.orderNumber || item.customerUsername || `Order #${item._id?.slice(-6)}`}</Text>
            <Text style={s.cardDesc}>{item.status?.replace(/_/g, ' ') || 'Archived'}{item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString('en-MY')}` : ''}</Text>
          </FrostedView>
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
