import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, StyleSheet, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';
import { Box, Truck, FileText, CircleCheckBig, CircleAlert, Wifi, WifiOff } from 'lucide-react-native';
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

  const fetchData = async () => {
    try {
      const [orderRes, parcelRes, fileRes] = await Promise.all([
        api.get('/orders'),
        api.get('/parcels/stats').catch(() => ({ data: {} })),
        api.get('/files/stats').catch(() => ({ data: { data: {} } })),
      ]);
      if (orderRes.data) setOrders(orderRes.data.orders || orderRes.data || []);
      if (parcelRes.data) setParcelStats({ total: 0, pending: 0, in_transit: 0, delivered: 0, failed: 0, ...parcelRes.data });
      const fs = fileRes.data?.data || fileRes.data || {};
      setFileStats({ totalFiles: fs.totalFiles || 0, totalSize: fs.totalSize || 0, pendingReview: fs.pendingReview || 0 });
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
        <TouchableOpacity onPress={async () => { await logout(); router.replace('/login'); }} style={s.logoutBtn}>
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
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
            {/* Stat Cards */}
            <View style={s.row}>
              <GlassCard title="Total Orders"     value={orders.length}                              sub="orders placed"                                      icon={<Box size={16} color={THEME.primary} />} />
              <GlassCard title="Active Deliveries" value={parcelStats.in_transit + parcelStats.pending} sub={`${parcelStats.in_transit} transit · ${parcelStats.pending} pending`} icon={<Truck size={16} color="#60a5fa" />} />
            </View>
            <View style={[s.row, { marginTop: 10 }]}>
              <GlassCard title="Total Artworks"   value={fileStats.totalFiles}                       sub={`${(fileStats.totalSize/1024/1024).toFixed(1)} MB used`}               icon={<FileText size={16} color="#a78bfa" />} />
              <GlassCard title="Pending Reviews"  value={fileStats.pendingReview}                    sub="needing review"                                     icon={<CircleAlert size={16} color={THEME.warning} />} />
            </View>

            {/* Delivery Status */}
            <BlurView intensity={20} tint="dark" style={[s.glassCard, { marginTop: 14 }]}>
              <Text style={s.cardTitle}>Delivery Status Overview</Text>
              <Text style={s.cardSub}>All parcels grouped by current status</Text>
              <View style={s.divider} />
              {[
                { label: 'Delivered', value: parcelStats.delivered, icon: <CircleCheckBig size={16} color={THEME.success} />, color: THEME.success },
                { label: 'In Transit', value: parcelStats.in_transit, icon: <Truck size={16} color="#60a5fa" />, color: '#60a5fa' },
                { label: 'Pending',   value: parcelStats.pending,   icon: <Box size={16} color={THEME.warning} />, color: THEME.warning },
                { label: 'Failed',    value: parcelStats.failed,    icon: <CircleAlert size={16} color={THEME.destructive} />, color: THEME.destructive },
              ].map(({ label, value, icon, color }) => (
                <View key={label} style={s.deliveryRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>{icon}<Text style={s.deliveryLabel}>{label}</Text></View>
                  <Text style={[s.deliveryValue, { color }]}>{value}</Text>
                </View>
              ))}
            </BlurView>

            {/* Recent Activity */}
            <BlurView intensity={20} tint="dark" style={[s.glassCard, { marginTop: 10 }]}>
              <Text style={s.cardTitle}>Recent Activity</Text>
              <Text style={s.cardSub}>Latest deliveries or artwork uploads</Text>
              <View style={s.divider} />
              {orders.slice(0, 5).length > 0 ? orders.slice(0, 5).map((o: any) => (
                <View key={o._id} style={[s.deliveryRow]}>
                  <Text style={{ color: THEME.mutedForeground, fontSize: 12 }}>Order #{o._id?.slice(-6).toUpperCase()}</Text>
                  <Text style={{ color: THEME.primary, fontSize: 12, fontWeight: '700' }}>RM {o.totalAmount?.toFixed(2)}</Text>
                </View>
              )) : (
                <Text style={{ color: THEME.mutedForeground, fontSize: 13 }}>No recent activity yet.</Text>
              )}
            </BlurView>
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function GlassCard({ title, value, sub, icon }: { title: string; value: number; sub: string; icon: React.ReactNode }) {
  return (
    <BlurView intensity={20} tint="dark" style={s.statCard}>
      <View style={s.statHeader}><Text style={s.statTitle}>{title}</Text>{icon}</View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statSub}>{sub}</Text>
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
  deliveryLabel: { color: THEME.foreground, fontSize: 14, fontWeight: '500' },
  deliveryValue: { fontSize: 15, fontWeight: '700' },
});
