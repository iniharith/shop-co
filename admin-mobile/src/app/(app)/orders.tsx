import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, StyleSheet, StatusBar, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import api from '../../services/api';
import socketService from '../../services/socket';
import { ShoppingBag, Package, Truck, CheckCircle2, XCircle, Search, ChevronDown, Trash2, Archive } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { THEME } from '../../constants/theme';

const STATUS_CYCLE: Record<string, string> = { PLACED: 'SHIPPED', SHIPPED: 'DELIVERED', DELIVERED: 'DELIVERED', CANCELLED: 'CANCELLED' };
const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  PLACED:    { color: '#60a5fa', bg: '#1e3a5f', label: 'Placed' },
  SHIPPED:   { color: '#fbbf24', bg: '#3b2a10', label: 'Shipped' },
  DELIVERED: { color: '#4ade80', bg: '#14291a', label: 'Delivered' },
  CANCELLED: { color: '#f87171', bg: '#2d1515', label: 'Cancelled' },
};
const FILTERS = ['ALL', 'PLACED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function OrdersScreen() {
  const { theme, colors } = useTheme();
  const [orders, setOrders]       = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);
  const [filter, setFilter]       = useState('ALL');
  const [search, setSearch]       = useState('');
  const [updating, setUpdating]   = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data?.orders || res.data?.data || res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefresh(false); }
  };

    useEffect(() => { 
    fetchOrders(); 
    socketService.connect();
    
    const handleOrderPlaced = (data: any) => {
      setOrders(prev => [data, ...prev]);
    };
    const handleOrderStatus = (data: any) => {
      setOrders(prev => prev.map(o => o._id === data.orderId ? { ...o, orderStatus: data.status } : o));
    };

    const offPlaced = socketService.on('order_placed' as any, handleOrderPlaced);
    const offStatus = socketService.on('order_status_updated' as any, handleOrderStatus);

    return () => { offPlaced(); offStatus(); };
  }, []);

  const updateStatus = async (id: string, currentStatus: string) => {
    const next = STATUS_CYCLE[currentStatus];
    if (!next || next === currentStatus) return;
    setUpdating(id);
    try {
      await api.put(`/orders/${id}`, { status: next });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, orderStatus: next } : o));
    } catch (e) { Alert.alert('Error', 'Failed to update order status'); }
    finally { setUpdating(null); }
  };

  const deleteOrder = (id: string) => {
    Alert.alert('Delete Order', 'Are you sure you want to delete this order?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/admin/orders/${id}`);
          setOrders(prev => prev.filter(o => o._id !== id));
        } catch (e) { Alert.alert('Error', 'Failed to delete order'); }
      }},
    ]);
  };

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'ALL' || o.orderStatus === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || o._id?.toLowerCase().includes(q) || o.customerName?.toLowerCase().includes(q) || o.totalAmount?.toString().includes(q);
    return matchStatus && matchSearch;
  });

  if (loading) return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd, colors.gradientStart]} style={s.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </LinearGradient>
  );

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd, colors.gradientStart]} style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={s.pageTitle}>Orders</Text>
            <Text style={s.pageSub}>{orders.length} total orders</Text>
          </View>
        </View>
        {/* Search */}
        <View style={s.searchBox}>
          <Search size={14} color={colors.mutedForeground} />
          <TextInput placeholder="Search by name, ID, amount..." placeholderTextColor={colors.mutedForeground} value={search} onChangeText={setSearch} style={s.searchInput} />
        </View>
      </BlurView>

      {/* Filter chips */}
      <FlatList
        horizontal showsHorizontalScrollIndicator={false}
        data={FILTERS} keyExtractor={i => i}
        style={{ maxHeight: 44, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 8, alignItems: 'center' }}
        renderItem={({ item }) => {
          const active = filter === item;
          const meta = STATUS_META[item];
          return (
            <TouchableOpacity onPress={() => setFilter(item)} style={[s.chip, active && { backgroundColor: (meta?.color || colors.primary) + '22', borderColor: meta?.color || colors.primary }]}>
              <Text style={[s.chipText, active && { color: meta?.color || colors.primary, fontWeight: '700' }]}>{meta?.label || item}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 130, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); fetchOrders(); }} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <BlurView intensity={theme === 'dark' ? 15 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.glassCard, { alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ color: colors.mutedForeground }}>No orders found.</Text>
          </BlurView>
        }
        renderItem={({ item }) => {
          const meta = STATUS_META[item.orderStatus] || { color: '#94a3b8', bg: '#1a1a1a', label: item.orderStatus };
          const isUpdating = updating === item._id;
          const canAdvance = STATUS_CYCLE[item.orderStatus] && STATUS_CYCLE[item.orderStatus] !== item.orderStatus;
          return (
            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={theme === 'dark' ? 15 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.glassCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.orderId}>#{item._id?.slice(-8).toUpperCase()}</Text>
                  {item.customerName ? <Text style={s.customerName}>{item.customerName}</Text> : null}
                </View>
                <Text style={[s.amount, { color: colors.primary }]}>RM {Number(item.totalAmount || 0).toFixed(2)}</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <View style={[s.badge, { backgroundColor: meta.bg }]}>
                  <Text style={[s.badgeText, { color: meta.color }]}>{meta.label}</Text>
                </View>
                <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{new Date(item.createdAt).toLocaleDateString('en-MY')}</Text>
              </View>

              {/* Payment Info */}
              <View style={[s.divider, { marginVertical: 10 }]} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Text style={s.infoText}>ðŸ’³ {item.paymentMethod || 'N/A'}</Text>
                <Text style={[s.infoText, { color: item.paymentStatus === 'PAID' ? '#4ade80' : colors.warning }]}>{item.paymentStatus || 'PENDING'}</Text>
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {canAdvance && (
                  <TouchableOpacity onPress={() => updateStatus(item._id, item.orderStatus)} disabled={isUpdating}
                    style={[s.actionBtn, { flex: 1, backgroundColor: meta.color + '22', borderColor: meta.color }]}>
                    {isUpdating ? <ActivityIndicator size="small" color={meta.color} /> : (
                      <Text style={{ color: meta.color, fontSize: 12, fontWeight: '700' }}>
                        â†’ {STATUS_META[STATUS_CYCLE[item.orderStatus]]?.label || 'Advance'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => deleteOrder(item._id)} style={[s.actionBtn, { backgroundColor: '#2d1515', borderColor: '#ef4444' }]}>
                  <Trash2 size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </BlurView>
          );
        }}
      />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: THEME.glassBorder, marginBottom: 12 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: THEME.foreground, letterSpacing: -0.5 },
  pageSub: { color: THEME.mutedForeground, fontSize: 13, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: THEME.glassBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10, gap: 8 },
  searchInput: { flex: 1, color: THEME.foreground, fontSize: 14, height: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: THEME.glassBorder, backgroundColor: THEME.glass },
  chipText: { color: THEME.mutedForeground, fontSize: 12 },
  glassCard: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 14 },
  orderId: { color: THEME.foreground, fontWeight: '800', fontSize: 15 },
  customerName: { color: THEME.mutedForeground, fontSize: 12, marginTop: 2 },
  amount: { fontSize: 18, fontWeight: '800' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: THEME.glassBorder },
  infoText: { color: THEME.mutedForeground, fontSize: 12 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 },
});

