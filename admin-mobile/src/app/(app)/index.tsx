import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, StyleSheet, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';
import { Box, Truck, FileText, CircleCheckBig, CircleAlert, Wifi, WifiOff, Server, HardDrive, Cpu, Clock } from 'lucide-react-native';
import api from '../../services/api';
import socketService from '../../services/socket';
import { useTheme } from '../../context/ThemeContext';
import { THEME } from '../../constants/theme';

export default function DashboardScreen() {
  const { theme, colors } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [live, setLive] = useState(false);
  
  // Dashboard state
  const [orders, setOrders] = useState<any[]>([]);
  const [parcelStats, setParcelStats] = useState({ total: 0, pending: 0, in_transit: 0, delivered: 0, failed: 0 });
  
  // New System Health state
  const [healthData, setHealthData] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [orderRes, parcelRes, healthRes] = await Promise.all([
        api.get('/orders').catch(() => ({ data: [] })),
        api.get('/parcels/stats').catch(() => ({ data: {} })),
        api.get('/sysadmin/health').catch(() => ({ data: { data: null } }))
      ]);
      
      setOrders(orderRes.data?.orders || orderRes.data || []);
      setParcelStats({ total: 0, pending: 0, in_transit: 0, delivered: 0, failed: 0, ...parcelRes.data });
      if (healthRes.data?.data) {
        setHealthData(healthRes.data.data);
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

  const showServerHealth = user?.role === 'sysadmin' || user?.role === 'boss';

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd, colors.gradientStart]} style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Header */}
      <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.header}>
        <View>
          <Text style={s.greeting}>Hi, Welcome back 👋</Text>
          <View style={s.liveRow}>
            {live ? <Wifi size={12} color={colors.success} /> : <WifiOff size={12} color={colors.destructive} />}
            <Text style={s.liveText}>
              <Text style={{ color: colors.primary }}>{user?.name || 'Admin'}</Text>
              {'  ·  '}{live ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={async () => { await logout(); router.replace('/login'); }} style={s.logoutBtn}>
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </BlurView>

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
            {/* Business Stats Grid */}
            <View style={s.row}>
              <GlassCard title="Total Tasks"      value={healthData?.application?.taskTotal || 0}    sub="lifetime tasks"                                   icon={<Box size={16} color={colors.primary} />} />
              <GlassCard title="Active Deliveries" value={parcelStats.in_transit + parcelStats.pending} sub={`${parcelStats.in_transit} transit · ${parcelStats.pending} pending`} icon={<Truck size={16} color="#60a5fa" />} />
            </View>
            <View style={[s.row, { marginTop: 10 }]}>
              <GlassCard title="Total Artworks"   value={healthData?.application?.artworkTotal || 0} sub="lifetime files"                                   icon={<FileText size={16} color="#a78bfa" />} />
              <GlassCard title="Storage Used"     value={formatBytes(healthData?.application?.storageUsed || 0)}  sub="AWS S3 bucket"                   icon={<HardDrive size={16} color={colors.warning} />} isString />
            </View>

            {/* Progression Chart (Pure React Native View approach) */}
            {healthData?.charts?.progression && healthData.charts.progression.length > 0 && (
              <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.glassCard, { marginTop: 14 }]}>
                <Text style={s.cardTitle}>7-Day Task Progression</Text>
                <Text style={s.cardSub}>Number of tasks created over the last week</Text>
                <View style={[s.divider, { marginBottom: 20 }]} />
                
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
              </BlurView>
            )}

            {/* Sysadmin Raw Server Health */}
            {showServerHealth && healthData?.server && (
              <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.glassCard, { marginTop: 14, borderColor: '#3b82f644' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Server size={18} color="#3b82f6" />
                  <View>
                    <Text style={s.cardTitle}>Raw Server Health</Text>
                    <Text style={[s.cardSub, { color: '#3b82f6' }]}>SysAdmin / Boss Privileges</Text>
                  </View>
                </View>
                <View style={s.divider} />
                
                <View style={{ gap: 14 }}>
                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Cpu size={14} color={colors.foreground} /><Text style={s.healthLabel}>CPU Load</Text></View>
                      <Text style={s.healthValue}>{healthData.server.cpuLoad?.[0]?.toFixed(2) || '0.00'}</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.glassBorder, borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${Math.min((healthData.server.cpuLoad?.[0] || 0) * 20, 100)}%`, backgroundColor: (healthData.server.cpuLoad?.[0] || 0) > 4 ? colors.destructive : colors.success }} />
                    </View>
                  </View>

                  <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><HardDrive size={14} color={colors.foreground} /><Text style={s.healthLabel}>Memory (RAM)</Text></View>
                      <Text style={s.healthValue}>{formatBytes(healthData.server.usedMem)} / {formatBytes(healthData.server.totalMem)}</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: colors.glassBorder, borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${(healthData.server.usedMem / healthData.server.totalMem) * 100}%`, backgroundColor: '#a78bfa' }} />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Clock size={14} color={colors.foreground} /><Text style={s.healthLabel}>Uptime</Text></View>
                    <Text style={s.healthValue}>{formatUptime(healthData.server.uptime)}</Text>
                  </View>
                </View>
              </BlurView>
            )}

            {/* Recent Activity */}
            <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.glassCard, { marginTop: 14 }]}>
              <Text style={s.cardTitle}>Recent Activity</Text>
              <Text style={s.cardSub}>Latest deliveries or artwork uploads</Text>
              <View style={s.divider} />
              {orders.slice(0, 5).length > 0 ? orders.slice(0, 5).map((o: any) => (
                <View key={o._id} style={[s.deliveryRow]}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Order #{o._id?.slice(-6).toUpperCase()}</Text>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>RM {o.totalAmount?.toFixed(2)}</Text>
                </View>
              )) : (
                <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>No recent activity yet.</Text>
              )}
            </BlurView>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function GlassCard({ title, value, sub, icon, isString = false }: { title: string; value: number | string; sub: string; icon: React.ReactNode; isString?: boolean }) {
  const { theme, colors } = useTheme();
  return (
    <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.statCard}>
      <View style={s.statHeader}><Text style={s.statTitle}>{title}</Text>{icon}</View>
      <Text style={[s.statValue, { color: colors.foreground, fontSize: isString ? 20 : 26 }]}>{value}</Text>
      <Text style={[s.statSub, { color: colors.mutedForeground }]}>{sub}</Text>
    </BlurView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: THEME.glassBorder },
  greeting: { fontSize: 20, fontWeight: '700', color: THEME.foreground },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  liveText: { color: THEME.mutedForeground, fontSize: 13 },
  logoutBtn: { borderWidth: 1, borderColor: THEME.glassBorder, backgroundColor: THEME.glass, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  logoutText: { color: THEME.foreground, fontSize: 13, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 10 },
  glassCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 16 },
  statCard: { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 14 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statTitle: { color: THEME.foreground, fontSize: 12, fontWeight: '500', flex: 1 },
  statValue: { color: THEME.foreground, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  statSub: { color: THEME.mutedForeground, fontSize: 10, marginTop: 2, lineHeight: 14 },
  cardTitle: { color: THEME.foreground, fontSize: 15, fontWeight: '700' },
  cardSub: { color: THEME.mutedForeground, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: THEME.glassBorder, marginVertical: 12 },
  deliveryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: THEME.glassBorder },
  healthLabel: { color: THEME.foreground, fontSize: 13, fontWeight: '500' },
  healthValue: { color: THEME.foreground, fontSize: 13, fontWeight: '700' },
});

