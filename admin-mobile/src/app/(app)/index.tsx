import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, StyleSheet, StatusBar
} from 'react-native';
import AppBackground from '../../components/AppBackground';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';
import { Box, Truck, FileText, CircleCheckBig, CircleAlert, Wifi, WifiOff, Server, HardDrive, Cpu, Clock, Package, ClipboardList, FolderOpen, Users, Sun, Moon } from 'lucide-react-native';
import api from '../../services/api';
import socketService from '../../services/socket';
import { useTheme } from '../../context/ThemeContext';

export default function DashboardScreen() {
  const { theme, colors, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [live, setLive] = useState(false);
  
  // Dashboard state
  const [summary, setSummary] = useState<any>(null);
  const [parcelStats, setParcelStats] = useState({ total: 0, pending: 0, in_transit: 0, delivered: 0, failed: 0 });
  
  // New System Health state
  const [healthData, setHealthData] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [summaryRes, healthRes] = await Promise.all([
        api.get('/sysadmin/dashboard-summary').catch(() => ({ data: { data: null } })),
        api.get('/sysadmin/health').catch(() => ({ data: { data: null } }))
      ]);
      const dashboardSummary = summaryRes.data?.data;
      setSummary(dashboardSummary);
      setParcelStats({ total: 0, pending: 0, in_transit: 0, delivered: 0, failed: 0, ...(dashboardSummary?.parcels || {}) });
      if (healthRes.data?.data) {
        setHealthData(healthRes.data.data);
      } else if (dashboardSummary) {
        setHealthData({ application: { artworkTotal: dashboardSummary.files?.totalFiles, storageUsed: dashboardSummary.files?.totalSize } });
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    fetchData();
    socketService.connect();
    const offConnect    = socketService.on('connect'     as any, () => setLive(true));
    const offDisconnect = socketService.on('disconnect'  as any, () => setLive(false));
    const offOrder      = socketService.on('order_placed' as any, fetchData);
    const offNotif      = socketService.on('notification' as any, fetchData);
    setLive(!!socketService.socket?.connected);
    return () => { offConnect(); offDisconnect(); offOrder(); offNotif(); socketService.disconnect(); };
  }, []);

  // Format Helpers
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    return `${d}d ${h}h`;
  };

  const showServerHealth = ['sysadmin', 'admin', 'boss'].includes(user?.role || '');
  const deliveryProgress = parcelStats.total ? Math.round((parcelStats.delivered / parcelStats.total) * 100) : 0;
  const activeDeliveries = (parcelStats.pending || 0) + (parcelStats.in_transit || 0);

  return (
    <AppBackground style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[s.header, { backgroundColor: theme === 'dark' ? 'rgb(15, 23, 42)' : '#ffffff', borderBottomColor: colors.glassBorder, paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={[s.greeting, { color: colors.foreground }]}>Hi, Welcome back 👋</Text>
          <View style={s.liveRow}>
            {live ? <Wifi size={12} color={colors.success} /> : <WifiOff size={12} color={colors.destructive} />}
            <Text style={[s.liveText, { color: colors.mutedForeground }]}>
              <Text style={{ color: colors.primary }}>{user?.name || 'Admin'}</Text>
              {'  ·  '}{live ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={toggleTheme} style={[s.themeBtn, { borderColor: colors.glassBorder, backgroundColor: colors.glass }]}>
            {theme === 'dark' ? <Sun size={18} color={colors.foreground} /> : <Moon size={18} color={colors.foreground} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => { await logout(); router.replace('/login'); }} style={[s.logoutBtn, { borderColor: colors.glassBorder, backgroundColor: colors.glass }]}>
            <Text style={[s.logoutText, { color: colors.foreground }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 130, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
      >
        {loading && !refreshing ? (
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.mutedForeground, marginTop: 14, fontSize: 14 }}>Loading dashboard...</Text>
          </View>
        ) : (
          <>
            <Text style={[s.sectionTitle, { color: colors.foreground, marginTop: 10 }]}>Live Operations</Text>
            <View style={s.row}>
              <HeroCard title="Total Orders" value={summary?.orders?.total || 0} sub="last 60 days" icon={<Box size={20} color="#dbeafe" />} dark />
              <HeroCard title="Delivery Success" value={`${deliveryProgress}%`} sub={`${parcelStats.delivered || 0} of ${parcelStats.total || 0} delivered`} icon={<Truck size={20} color="#172033" />} success />
            </View>
            <View style={[s.row, { marginTop: 10 }]}>
              <GlassCard title="Active Deliveries" value={activeDeliveries} sub="pending and in transit" icon={<Truck size={16} color={colors.info} />} />
              <GlassCard title="Total Tasks" value={summary?.tasks?.total || 0} sub="across all stages" icon={<ClipboardList size={16} color="#a78bfa" />} />
            </View>
            <View style={[s.row, { marginTop: 10 }]}>
              <GlassCard title="Total Folders" value={summary?.folders?.total || 0} sub="artwork workspaces" icon={<FolderOpen size={16} color={colors.warning} />} />
              <GlassCard title="Users Online" value={summary?.onlineUsers?.count || 0} sub="active now" icon={<Users size={16} color={colors.success} />} />
            </View>

            {/* Artwork Analytics */}
            <Text style={[s.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>Artwork Analytics</Text>
            <View style={s.row}>
              <GlassCard title="Total Files" value={summary?.files?.totalFiles || healthData?.application?.artworkTotal || 0} sub="managed" icon={<FileText size={16} color="#a78bfa" />} />
              <GlassCard title="Storage Used" value={formatBytes(summary?.files?.totalSize || healthData?.application?.storageUsed || 0)} sub="tracked metadata" icon={<HardDrive size={16} color="#34d399" />} isString />
            </View>
            <View style={[s.row, { marginTop: 10 }]}>
              <GlassCard title="Pending Review" value={summary?.files?.pendingReview || 0} sub="files requiring review" icon={<CircleAlert size={16} color={colors.warning} />} />
              <GlassCard title="Failed Delivery" value={parcelStats.failed || 0} sub="requires attention" icon={<CircleAlert size={16} color={colors.destructive} />} />
            </View>

            {/* Progression Chart (Pure React Native View approach) */}
            {healthData?.charts?.progression && healthData.charts.progression.length > 0 && (
              <View style={[s.glassCard, { marginTop: 14, backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                <Text style={[s.cardTitle, { color: colors.foreground }]}>7-Day Task Progression</Text>
                <Text style={[s.cardSub, { color: colors.mutedForeground }]}>Number of tasks created over the last week</Text>
                <View style={[s.divider, { backgroundColor: colors.glassBorder, marginBottom: 20 }]} />
                
                <View style={{ height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 10 }}>
                  {(() => {
                    const data = healthData.charts.progression.slice(-7);
                    const maxVal = Math.max(...data.map((d: any) => d.count), 1);
                    return data.map((d: any, idx: number) => {
                      const heightPct = (d.count / maxVal) * 100;
                      return (
                        <View key={idx} style={{ alignItems: 'center', width: 30 }}>
                          <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', marginBottom: 6 }}>{d.count}</Text>
                          <View style={{ width: 20, height: `${heightPct}%`, minHeight: 4, backgroundColor: colors.primary, borderRadius: 4, opacity: 0.8 }} />
                          <Text style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 6, transform: [{ rotate: '-45deg' }], width: 40, textAlign: 'center' }}>
                            {d._id.slice(5)}
                          </Text>
                        </View>
                      );
                    });
                  })()}
                </View>
                <View style={{ height: 15 }} />
              </View>
            )}

            {/* Sysadmin Raw Server Health */}
            {showServerHealth && healthData?.server && (
              <View style={[s.glassCard, { marginTop: 14, backgroundColor: colors.glass, borderColor: '#3b82f644' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Server size={18} color="#3b82f6" />
                  <View>
                    <Text style={[s.cardTitle, { color: colors.foreground }]}>Raw Server Health</Text>
                    <Text style={[s.cardSub, { color: '#3b82f6' }]}>SysAdmin / Boss Privileges</Text>
                  </View>
                </View>
                <View style={[s.divider, { backgroundColor: colors.glassBorder }]} />
                
                <View style={{ gap: 14 }}>
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Cpu size={14} color={colors.foreground} /><Text style={[s.healthLabel, { color: colors.foreground }]}>CPU Load</Text></View>
                      <Text style={[s.healthValue, { color: colors.foreground }]}>{healthData.server.cpuLoad?.[0]?.toFixed(2) || '0.00'}</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.glassBorder, borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${Math.min((healthData.server.cpuLoad?.[0] || 0) * 20, 100)}%`, backgroundColor: (healthData.server.cpuLoad?.[0] || 0) > 4 ? colors.destructive : colors.success }} />
                    </View>
                  </View>

                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><HardDrive size={14} color={colors.foreground} /><Text style={[s.healthLabel, { color: colors.foreground }]}>Memory (RAM)</Text></View>
                      <Text style={[s.healthValue, { color: colors.foreground }]}>{formatBytes(healthData.server.usedMem)} / {formatBytes(healthData.server.totalMem)}</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.glassBorder, borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${(healthData.server.usedMem / healthData.server.totalMem) * 100}%`, backgroundColor: '#a78bfa' }} />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Clock size={14} color={colors.foreground} /><Text style={[s.healthLabel, { color: colors.foreground }]}>Uptime</Text></View>
                    <Text style={[s.healthValue, { color: colors.foreground }]}>{formatUptime(healthData.server.uptime)}</Text>
                  </View>
                </View>
              </View>
            )}

          </>
        )}
      </ScrollView>
    </AppBackground>
  );
}

function GlassCard({ title, value, sub, icon, isString = false }: { title: string; value: number | string; sub: string; icon: React.ReactNode; isString?: boolean }) {
  const { theme, colors } = useTheme();
  return (
    <View style={[s.statCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
      <View style={s.statHeader}><Text style={[s.statTitle, { color: colors.foreground }]}>{title}</Text>{icon}</View>
      <Text style={[s.statValue, { color: colors.foreground, fontSize: isString ? 20 : 26 }]}>{value}</Text>
      <Text style={[s.statSub, { color: colors.mutedForeground }]}>{sub}</Text>
    </View>
  );
}

function HeroCard({ title, value, sub, icon, dark = false, success = false }: { title: string; value: number | string; sub: string; icon: React.ReactNode; dark?: boolean; success?: boolean }) {
  const { colors } = useTheme();
  const backgroundColor = dark ? '#0f172a' : success ? '#bef264' : colors.glass;
  const foreground = success ? '#0f172a' : colors.foreground;
  return <View style={[s.heroCard, { backgroundColor, borderColor: dark ? '#334155' : success ? '#a3e635' : colors.glassBorder }]}>
    <View style={s.statHeader}><Text style={[s.statTitle, { color: foreground }]}>{title}</Text>{icon}</View>
    <Text style={[s.heroValue, { color: foreground }]}>{value}</Text>
    <Text style={[s.statSub, { color: success ? '#334155' : colors.mutedForeground }]}>{sub}</Text>
  </View>;
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  greeting: { fontSize: 20, fontWeight: '700' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  liveText: { fontSize: 13 },
  logoutBtn: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  logoutText: { fontSize: 13, fontWeight: '500' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  themeBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 10 },
  glassCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  statCard: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 14 },
  heroCard: { flex: 1, minHeight: 150, borderRadius: 20, borderWidth: 1, padding: 16, justifyContent: 'space-between' },
  heroValue: { fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statTitle: { fontSize: 12, fontWeight: '500', flex: 1 },
  statValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  statSub: { fontSize: 10, marginTop: 2, lineHeight: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSub: { fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  divider: { height: 1, marginVertical: 14 },
  deliveryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  healthLabel: { fontSize: 13, fontWeight: '500' },
  healthValue: { fontSize: 13, fontWeight: '700' },
});
