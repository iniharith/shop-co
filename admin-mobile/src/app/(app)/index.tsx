import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, StyleSheet, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';
import {
  Box, Truck, FileText, CircleCheckBig, CircleAlert,
  Wifi, WifiOff, ClipboardList, FolderOpen, Users,
  Archive, Layers, Package, RefreshCw
} from 'lucide-react-native';
import api from '../../services/api';
import socketService from '../../services/socket';
import { THEME } from '../../constants/theme';

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [live, setLive] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [parcelStats, setParcelStats] = useState({ total: 0, pending: 0, in_transit: 0, delivered: 0, failed: 0 });
  const [fileStats, setFileStats] = useState({ totalFiles: 0, totalSize: 0, pendingReview: 0 });
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalFolders, setTotalFolders] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState(0);

  const fetchData = async () => {
    try {
      const [orderRes, parcelRes, fileRes, taskRes, folderRes, onlineRes] = await Promise.all([
        api.get('/orders'),
        api.get('/parcels/stats').catch(() => ({ data: {} })),
        api.get('/files/stats').catch(() => ({ data: { data: {} } })),
        api.get('/tasks').catch(() => ({ data: { tasks: [] } })),
        api.get('/folders').catch(() => ({ data: { data: [] } })),
        api.get('/sysadmin/online-users').catch(() => ({ data: { count: 0 } })),
      ]);

      if (orderRes.data) setOrders(orderRes.data.orders || orderRes.data || []);
      if (parcelRes.data) setParcelStats({ total: 0, pending: 0, in_transit: 0, delivered: 0, failed: 0, ...parcelRes.data });
      const fs = fileRes.data?.data || fileRes.data || {};
      setFileStats({ totalFiles: fs.totalFiles || 0, totalSize: fs.totalSize || 0, pendingReview: fs.pendingReview || 0 });
      const tasks = taskRes.data?.tasks || taskRes.data?.data || taskRes.data || [];
      setTotalTasks(Array.isArray(tasks) ? tasks.length : 0);
      const folders = folderRes.data?.data || folderRes.data || [];
      setTotalFolders(Array.isArray(folders) ? folders.length : 0);
      setOnlineUsers(onlineRes.data?.count || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    fetchData();
    socketService.connect();
    const offConnect    = socketService.on('connect'      as any, () => setLive(true));
    const offDisconnect = socketService.on('disconnect'   as any, () => setLive(false));
    const offOrder      = socketService.on('order_placed' as any, fetchData);
    const offNotif      = socketService.on('notification' as any, fetchData);
    setLive(!!socketService.socket?.connected);
    return () => { offConnect(); offDisconnect(); offOrder(); offNotif(); socketService.disconnect(); };
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalParcels = parcelStats.total || (parcelStats.delivered + parcelStats.in_transit + parcelStats.pending + parcelStats.failed);
  const deliveryPct = totalParcels > 0 ? Math.round((parcelStats.delivered / totalParcels) * 100) : 0;
  const activeDeliveries = (parcelStats.in_transit || 0) + (parcelStats.pending || 0);

  return (
    <LinearGradient colors={['#0a0a14', '#100a1e', '#0a0a14']} style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <BlurView intensity={20} tint="dark" style={s.header}>
        <View>
          <Text style={s.greeting}>Hi, Welcome back 👋</Text>
          <View style={s.liveRow}>
            {live ? <Wifi size={12} color={THEME.success} /> : <WifiOff size={12} color={THEME.destructive} />}
            <Text style={s.liveText}>
              <Text style={{ color: THEME.primary }}>{user?.name || 'Admin'}</Text>
              {'  ·  '}{live ? 'Live' : 'Offline'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity onPress={fetchData} style={s.refreshBtn}>
            <RefreshCw size={14} color={THEME.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => { await logout(); router.replace('/login'); }} style={s.logoutBtn}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </BlurView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 130, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={THEME.primary} />}
      >
        {loading && !refreshing ? (
          <View style={{ paddingVertical: 80, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={THEME.primary} />
            <Text style={{ color: THEME.mutedForeground, marginTop: 14, fontSize: 14 }}>Loading dashboard...</Text>
          </View>
        ) : (
          <>
            {/* Row 1: Total Orders (blue hero) + Delivery Success Rate */}
            <View style={s.row}>
              {/* Blue hero card */}
              <BlurView intensity={20} tint="dark" style={[s.heroCard, { borderColor: '#3b82f633' }]}>
                <View style={{ backgroundColor: '#3b82f614', borderRadius: 28, padding: 20, flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: '#60a5fa', fontSize: 13, fontWeight: '600' }}>Total Orders</Text>
                    <Box size={18} color="#60a5fa" />
                  </View>
                  <Text style={s.heroValue}>{orders.length}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#60a5fa', marginRight: 6 }} />
                    <Text style={{ color: '#60a5fa', fontSize: 11, fontWeight: '600' }}>Lifetime orders placed</Text>
                  </View>
                </View>
              </BlurView>

              {/* Delivery % */}
              <BlurView intensity={20} tint="dark" style={s.statCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={s.statTitle}>Delivery Rate</Text>
                  <Truck size={16} color={THEME.mutedForeground} />
                </View>
                <Text style={s.statValue}>{deliveryPct}<Text style={{ fontSize: 16, color: THEME.mutedForeground }}> %</Text></Text>
                <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, marginTop: 10, overflow: 'hidden' }}>
                  <View style={{ width: `${deliveryPct}%`, height: '100%', backgroundColor: THEME.success, borderRadius: 6 }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ color: THEME.mutedForeground, fontSize: 10 }}>{parcelStats.delivered} delivered</Text>
                  <Text style={{ color: THEME.mutedForeground, fontSize: 10 }}>{totalParcels} total</Text>
                </View>
              </BlurView>
            </View>

            {/* Row 2: 4 mini metric cards */}
            <View style={[s.row, { marginTop: 10 }]}>
              <MiniCard label="Active Deliveries" value={activeDeliveries} icon={<Truck size={14} color="#60a5fa" />} />
              <MiniCard label="Total Tasks"        value={totalTasks}       icon={<ClipboardList size={14} color={THEME.warning} />} />
              <MiniCard label="Total Folders"      value={totalFolders}     icon={<FolderOpen size={14} color="#a78bfa" />} />
              <MiniCard
                label="Online Users"
                value={onlineUsers}
                icon={<Users size={14} color={THEME.success} />}
                pulse
              />
            </View>

            {/* Row 3: 4 delivery status cards */}
            <View style={[s.row, { marginTop: 10 }]}>
              {[
                { label: 'Delivered',  value: parcelStats.delivered,  icon: <CircleCheckBig size={16} color={THEME.success} />,     color: '#22c55e14', border: '#22c55e33' },
                { label: 'In Transit', value: parcelStats.in_transit, icon: <Truck size={16} color="#60a5fa" />,                   color: '#3b82f614', border: '#3b82f633' },
                { label: 'Pending',    value: parcelStats.pending,    icon: <Package size={16} color={THEME.warning} />,           color: '#eab30814', border: '#eab30833' },
                { label: 'Failed',     value: parcelStats.failed,     icon: <CircleAlert size={16} color={THEME.destructive} />,   color: '#ef444414', border: '#ef444433' },
              ].map(({ label, value, icon, color, border }) => (
                <BlurView key={label} intensity={20} tint="dark" style={[s.statusCard, { borderColor: border }]}>
                  <View style={{ backgroundColor: color, borderRadius: 20, padding: 12, flex: 1 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                      {icon}
                    </View>
                    <Text style={{ color: THEME.mutedForeground, fontSize: 11, fontWeight: '600' }}>{label}</Text>
                    <Text style={{ color: THEME.foreground, fontSize: 22, fontWeight: '800', marginTop: 2 }}>{value}</Text>
                  </View>
                </BlurView>
              ))}
            </View>

            {/* Artwork Analytics */}
            <BlurView intensity={20} tint="dark" style={[s.glassCard, { marginTop: 14 }]}>
              <Text style={s.cardTitle}>Artwork Analytics</Text>
              <Text style={s.cardSub}>File storage overview</Text>
              <View style={s.divider} />

              {/* Big file count */}
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ color: THEME.mutedForeground, fontSize: 12, fontWeight: '500', marginBottom: 4 }}>Total Files Managed</Text>
                <Text style={{ color: THEME.foreground, fontSize: 52, fontWeight: '800', letterSpacing: -1 }}>{fileStats.totalFiles}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#064e3b', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 8 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80', marginRight: 6 }} />
                  <Text style={{ color: '#4ade80', fontSize: 11, fontWeight: '700' }}>Uploaded</Text>
                </View>
              </View>

              <View style={s.divider} />

              {/* Storage Used */}
              <View style={s.analyticsRow}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Archive size={20} color={THEME.foreground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: THEME.foreground, fontWeight: '600' }}>Storage Used</Text>
                  <Text style={{ color: THEME.mutedForeground, fontSize: 11 }}>Artwork volume</Text>
                </View>
                <Text style={{ color: THEME.foreground, fontWeight: '700' }}>{formatBytes(fileStats.totalSize || 0)}</Text>
              </View>

              {/* Pending Review */}
              <View style={s.analyticsRow}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#f97316' + '18', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <Layers size={20} color="#f97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: THEME.foreground, fontWeight: '600' }}>Pending Review</Text>
                  <Text style={{ color: THEME.mutedForeground, fontSize: 11 }}>Awaiting action</Text>
                </View>
                <Text style={{ color: THEME.foreground, fontWeight: '700' }}>{fileStats.pendingReview || 0}</Text>
              </View>

              {/* Total Artworks */}
              <View style={s.analyticsRow}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#a78bfa' + '18', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <FileText size={20} color="#a78bfa" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: THEME.foreground, fontWeight: '600' }}>Total Artworks</Text>
                  <Text style={{ color: THEME.mutedForeground, fontSize: 11 }}>Uploaded files</Text>
                </View>
                <Text style={{ color: THEME.foreground, fontWeight: '700' }}>{fileStats.totalFiles}</Text>
              </View>
            </BlurView>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function MiniCard({ label, value, icon, pulse }: { label: string; value: number; icon: React.ReactNode; pulse?: boolean }) {
  return (
    <BlurView intensity={20} tint="dark" style={s.miniCard}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ color: THEME.mutedForeground, fontSize: 10, fontWeight: '600', flex: 1 }}>{label}</Text>
        {pulse && (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.success }} />
        )}
        {!pulse && icon}
      </View>
      <Text style={{ color: THEME.foreground, fontSize: 22, fontWeight: '800' }}>{value}</Text>
    </BlurView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: THEME.glassBorder,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: THEME.foreground },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  liveText: { color: THEME.mutedForeground, fontSize: 13 },
  refreshBtn: { padding: 8, borderRadius: 10, borderWidth: 1, borderColor: THEME.glassBorder, backgroundColor: THEME.glass },
  logoutBtn: { borderWidth: 1, borderColor: THEME.glassBorder, backgroundColor: THEME.glass, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  logoutText: { color: THEME.foreground, fontSize: 13, fontWeight: '500' },
  row: { flexDirection: 'row', gap: 10 },
  heroCard: { flex: 1, borderRadius: 28, overflow: 'hidden', borderWidth: 1 },
  statCard: { flex: 1, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 16 },
  statTitle: { color: THEME.mutedForeground, fontSize: 12, fontWeight: '600' },
  statValue: { color: THEME.foreground, fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  heroValue: { color: THEME.foreground, fontSize: 52, fontWeight: '800', letterSpacing: -2, marginTop: 10 },
  miniCard: { flex: 1, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 12 },
  statusCard: { flex: 1, borderRadius: 24, overflow: 'hidden', borderWidth: 1 },
  glassCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 16 },
  cardTitle: { color: THEME.foreground, fontSize: 15, fontWeight: '700' },
  cardSub: { color: THEME.mutedForeground, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: THEME.glassBorder, marginVertical: 12 },
  analyticsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: THEME.glassBorder },
});
