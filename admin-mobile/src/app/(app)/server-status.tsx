import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, StatusBar, TouchableOpacity, RefreshControl } from 'react-native';
import AppBackground from '../../components/AppBackground';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { THEME } from '../../constants/theme';
import { Server, ArrowLeft, Activity, Database, HardDrive, Cpu, Clock, Cloud, Globe, Train, RefreshCw, Archive } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
};

export default function ServerStatusScreen() {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const fetchHealth = async (initial = false) => {
    initial ? setLoading(true) : setRefreshing(true);
    try {
      const response = await api.get('/sysadmin/health');
      const health = response.data?.data || response.data;
      if (!health?.server) throw new Error('No server health data available');
      setData(health);
      setError('');
    } catch (requestError: any) {
      setError(requestError?.message || 'Unable to refresh server health.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => {
    void fetchHealth(true);
    const interval = setInterval(() => void fetchHealth(), 30_000);
    return () => clearInterval(interval);
  }, []);
  if (loading && !data) return <AppBackground style={s.center}><ActivityIndicator size="large" color={colors.primary} /></AppBackground>;

  const server = data?.server || {};
  const application = data?.application || {};
  const external = data?.external || {};
  const memory = server.totalMem ? Math.round((server.usedMem / server.totalMem) * 100) : 0;
  const disk = server.diskTotal ? Math.round((1 - server.diskFree / server.diskTotal) * 100) : 0;
  const bandwidth = data?.charts?.bandwidth || [];
  const latestBandwidth = bandwidth[bandwidth.length - 1]?.bytesOut || 0;
  const progression = data?.charts?.progression || [];
  return <AppBackground style={s.screen}>
    <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
    <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.header, { paddingTop: insets.top + 10 }]}>
      <TouchableOpacity onPress={() => router.back()} style={s.back}><ArrowLeft size={20} color={colors.foreground} /></TouchableOpacity>
      <View style={{ flex: 1 }}><Text style={s.title}>Server Health</Text><Text style={s.subtitle}>Updated every 30 seconds</Text></View>
      <TouchableOpacity onPress={() => void fetchHealth()} style={s.refresh} disabled={refreshing}><RefreshCw size={18} color={colors.primary} /></TouchableOpacity>
    </BlurView>
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void fetchHealth()} tintColor={colors.primary} />}>
      {error ? <View style={[s.error, { borderColor: colors.warning }]}><Text style={{ color: colors.warning }}>{data ? `Showing the last snapshot. ${error}` : error}</Text></View> : null}
      {!data ? <View style={s.empty}><Activity size={32} color={colors.mutedForeground} /><Text style={[s.emptyText, { color: colors.foreground }]}>No server data</Text><TouchableOpacity onPress={() => void fetchHealth(true)} style={s.retry}><Text style={s.retryText}>Try Again</Text></TouchableOpacity></View> : <>
        <Text style={s.section}>Server Snapshot</Text>
        <View style={s.row}><Metric title="System RAM" value={`${memory}%`} detail={`${formatBytes(server.usedMem)} used`} icon={<HardDrive size={17} color="#4ade80" />} /><Metric title="Disk Capacity" value={`${disk}%`} detail={`${formatBytes((server.diskTotal || 0) - (server.diskFree || 0))} used`} icon={<Server size={17} color={colors.info} />} /></View>
        <View style={[s.row, s.rowGap]}><Metric title="CPU Load" value={(server.cpuLoad?.[0] || 0).toFixed(1)} detail={`5m ${(server.cpuLoad?.[1] || 0).toFixed(1)} | 15m ${(server.cpuLoad?.[2] || 0).toFixed(1)}`} icon={<Cpu size={17} color="#60a5fa" />} /><Metric title="Data Transfer" value={`${formatBytes(latestBandwidth / 5)}/s`} detail="latest sample" icon={<Activity size={17} color="#f87171" />} /></View>
        <BlurView intensity={20} tint="dark" style={[s.card, { marginTop: 12 }]}><View style={s.cardTop}><View><Text style={s.cardTitle}>Task Progression</Text><Text style={s.cardSub}>{application.taskTotal || 0} tasks created</Text></View><Archive size={17} color={colors.primary} /></View><View style={s.chart}>{progression.slice(-7).map((item: any) => <View key={item._id} style={s.chartItem}><Text style={[s.chartValue, { color: colors.primary }]}>{item.count}</Text><View style={[s.bar, { height: Math.max(5, Math.min(76, item.count * 12)), backgroundColor: colors.primary }]} /><Text style={s.chartLabel}>{item._id?.slice(5)}</Text></View>)}</View></BlurView>
        <Text style={s.section}>Infrastructure</Text>
        <View style={s.row}><Service title="Vercel" detail={external.vercel?.url || 'Frontend'} value={external.vercel?.readyState || 'UNKNOWN'} icon={<Globe size={17} color={colors.foreground} />} /><Service title="Railway" detail={external.railway?.environment || 'Backend'} value={external.railway?.status || 'UNKNOWN'} icon={<Train size={17} color="#c084fc" />} /></View>
        <View style={[s.row, s.rowGap]}><Service title="AWS S3" detail="kampungcetak-storage" value={external.aws || 'UNKNOWN'} icon={<Cloud size={17} color="#fb923c" />} /><Service title="MongoDB Atlas" detail={`${data.database?.detailed?.connections?.current || 0} active connections`} value={data.database?.status || 'Unknown'} icon={<Database size={17} color="#4ade80" />} /></View>
        <Text style={s.section}>Application</Text>
        <BlurView intensity={20} tint="dark" style={s.card}><Info label="Artwork files" value={String(application.artworkTotal || 0)} icon={<Archive size={16} color={colors.primary} />} /><Info label="Tracked file size" value={formatBytes(application.storageUsed)} icon={<HardDrive size={16} color={colors.info} />} /><Info label="System uptime" value={`${Math.floor((server.uptime || 0) / 86400)}d ${Math.floor(((server.uptime || 0) % 86400) / 3600)}h`} icon={<Clock size={16} color="#a78bfa" />} /></BlurView>
      </>}
    </ScrollView>
  </AppBackground>;
}

function Metric({ title, value, detail, icon }: { title: string; value: string; detail: string; icon: React.ReactNode }) { return <BlurView intensity={20} tint="dark" style={s.metric}><View style={s.cardTop}><Text style={s.cardTitle}>{title}</Text>{icon}</View><Text style={s.metricValue}>{value}</Text><Text style={s.cardSub}>{detail}</Text></BlurView>; }
function Service({ title, detail, value, icon }: { title: string; detail: string; value: string; icon: React.ReactNode }) { const { colors } = useTheme(); const online = ['READY', 'ACTIVE', 'ONLINE', 'Connected'].includes(value); return <BlurView intensity={20} tint="dark" style={s.metric}><View style={s.cardTop}>{icon}<Text style={s.cardTitle}>{title}</Text></View><Text style={s.cardSub} numberOfLines={1}>{detail}</Text><Text style={[s.status, { color: online ? colors.success : colors.warning }]}>{value}</Text></BlurView>; }
function Info({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <View style={s.info}><View style={s.infoLabel}>{icon}<Text style={s.cardTitle}>{label}</Text></View><Text style={s.infoValue}>{value}</Text></View>; }

const s = StyleSheet.create({ screen: { flex: 1 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: THEME.glassBorder, flexDirection: 'row', alignItems: 'center', gap: 12 }, back: { padding: 8, marginLeft: -8 }, title: { fontSize: 20, fontWeight: '800', color: THEME.foreground }, subtitle: { color: THEME.mutedForeground, fontSize: 12, marginTop: 2 }, refresh: { padding: 9, borderWidth: 1, borderColor: THEME.glassBorder, borderRadius: 10 }, content: { padding: 16, paddingBottom: 120 }, section: { color: THEME.foreground, fontSize: 17, fontWeight: '800', marginTop: 18, marginBottom: 10 }, row: { flexDirection: 'row', gap: 10 }, rowGap: { marginTop: 10 }, metric: { flex: 1, minHeight: 126, overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: THEME.glassBorder, padding: 14 }, card: { overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: THEME.glassBorder, padding: 16 }, cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, cardTitle: { color: THEME.foreground, fontSize: 13, fontWeight: '700', flexShrink: 1 }, cardSub: { color: THEME.mutedForeground, fontSize: 11, marginTop: 6 }, metricValue: { color: THEME.foreground, fontSize: 30, fontWeight: '800', marginTop: 18, letterSpacing: -1 }, status: { fontSize: 11, fontWeight: '800', marginTop: 18 }, chart: { height: 112, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 14 }, chartItem: { alignItems: 'center', flex: 1 }, chartValue: { fontSize: 10, fontWeight: '700', marginBottom: 5 }, bar: { width: 13, borderRadius: 4 }, chartLabel: { color: THEME.mutedForeground, fontSize: 8, marginTop: 6 }, info: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: THEME.glassBorder, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, infoLabel: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1 }, infoValue: { color: THEME.foreground, fontSize: 13, fontWeight: '700' }, error: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 4 }, empty: { alignItems: 'center', marginTop: 100, gap: 12 }, emptyText: { fontSize: 16, fontWeight: '700' }, retry: { backgroundColor: '#f0a500', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }, retryText: { fontWeight: '800', color: '#000' } });
