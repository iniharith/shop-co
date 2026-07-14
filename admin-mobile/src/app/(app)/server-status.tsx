import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppBackground from '../../components/AppBackground';
import { BlurView } from 'expo-blur';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { THEME } from '../../constants/theme';
import { Server, ArrowLeft, Activity } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ServerStatusScreen() {
  const { theme, colors } = useTheme();
  const router = useRouter();
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/sysadmin/health');
        setHealthData(res.data?.data || res.data || null);
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

      <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.pageTitle}>Server Status</Text>
            <Text style={s.pageSub}>System diagnostics</Text>
          </View>
          <View style={s.iconCircle}>
            <Server size={20} color={colors.primary} />
          </View>
        </View>
      </BlurView>

      <FlatList
        data={healthData?.server ? Object.entries(healthData.server) : []}
        keyExtractor={([key]) => key}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
        ListHeaderComponent={
          healthData ? (
            <BlurView intensity={theme === 'dark' ? 15 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.card, { marginBottom: 12 }]}>
              <Text style={s.cardTitle}>Application Stats</Text>
              <Text style={s.cardDesc}>Users: {healthData.application?.userCount}</Text>
              <Text style={s.cardDesc}>Tasks: {healthData.application?.taskTotal}</Text>
              <Text style={s.cardDesc}>Artworks: {healthData.application?.artworkTotal}</Text>
              <Text style={s.cardDesc}>Storage Used: {Math.round(healthData.application?.storageUsed / (1024*1024))} MB</Text>
            </BlurView>
          ) : null
        }
        ListEmptyComponent={
          <BlurView intensity={theme === 'dark' ? 15 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.emptyCard}>
            <Activity size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>No server data</Text>
            <Text style={{ color: colors.mutedForeground, marginTop: 4 }}>Unable to connect to sysadmin health API.</Text>
          </BlurView>
        }
        renderItem={({ item }) => {
          const [key, value] = item;
          // Format based on type (memory -> MB, uptime -> hours)
          let displayValue = String(value);
          if (key.toLowerCase().includes('mem') || key.toLowerCase().includes('ram')) displayValue = `${Math.round(Number(value) / (1024*1024))} MB`;
          if (key === 'uptime' && !isNaN(Number(value))) displayValue = `${Math.floor(Number(value) / 3600)}h ${Math.floor((Number(value) % 3600) / 60)}m`;
          
          return (
            <BlurView intensity={theme === 'dark' ? 15 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.card}>
              <Text style={s.cardTitle}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}</Text>
              <Text style={[s.cardDesc, { color: colors.primary, fontSize: 16, marginTop: 8 }]}>{displayValue}</Text>
            </BlurView>
          );
        }}
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
