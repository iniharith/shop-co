import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, RefreshControl,
  TouchableOpacity, Alert, StyleSheet, StatusBar, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Printer, ChevronRight, RefreshCw } from 'lucide-react-native';
import api from '../../services/api';
import socketService from '../../services/socket';
import { THEME } from '../../constants/theme';

// Production workflow sub-tabs matching website ProductionManager
const SUB_TABS = [
  { key: 'IN_PRODUCTION',  label: '🖨️ Printing',      color: '#818cf8' },
  { key: 'HOLD_PRINTING',  label: '⏸ Hold',           color: '#94a3b8' },
  { key: 'DONE_PRINTING',  label: '✅ Done Printing',  color: '#4ade80' },
];

// Full task status list for advance button
const STATUS_FLOW: Record<string, string> = {
  IN_PRODUCTION: 'DONE_PRINTING',
  DONE_PRINTING: 'PACKAGING',
};

const STATUS_META: Record<string, { color: string; label: string }> = {
  IN_PRODUCTION: { color: '#818cf8', label: 'In Production' },
  HOLD_PRINTING: { color: '#94a3b8', label: 'Hold Printing' },
  DONE_PRINTING: { color: '#4ade80', label: 'Done Printing' },
  PACKAGING:     { color: '#06b6d4', label: 'Packaging' },
};

export default function ProductionScreen() {
  const [tasks, setTasks]       = useState<any[]>([]);
  const [orders, setOrders]     = useState<any[]>([]);
  const [users, setUsers]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState('IN_PRODUCTION');
  const [advancing, setAdvancing] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [taskRes, orderRes, userRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/orders'),
        api.get('/admin/users').catch(() => ({ data: [] })),
      ]);
      const t = taskRes.data?.tasks || taskRes.data?.data || taskRes.data || [];
      const o = orderRes.data?.orders || orderRes.data?.data || orderRes.data || [];
      const u = userRes.data?.data || userRes.data?.users || userRes.data || [];
      setTasks(Array.isArray(t) ? t : []);
      setOrders(Array.isArray(o) ? o : []);
      setUsers(Array.isArray(u) ? u : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefresh(false); }
  };

  useEffect(() => {
    fetchAll();
    socketService.connect();
    const off = socketService.on('order_placed', fetchAll);
    return () => { off(); socketService.disconnect(); };
  }, []);

  const onRefresh = () => { setRefresh(true); fetchAll(); };

  const advanceTask = async (task: any) => {
    const next = STATUS_FLOW[task.status];
    if (!next) return;
    setAdvancing(task._id);
    try {
      await api.put(`/tasks/${task._id}`, { status: next });
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: next } : t));
      Alert.alert('✅ Advanced', `Task moved to ${STATUS_META[next]?.label || next}`);
    } catch (e) {
      Alert.alert('Error', 'Could not advance task status.');
    } finally { setAdvancing(null); }
  };

  const resolveUser = (id: string) => users.find(u => u._id === id || u._id === String(id));
  const resolveOrder = (id: string) => orders.find(o => o._id === id || o._id === String(id));

  const filteredTasks = tasks.filter(t => {
    const s = (t.status || '').toUpperCase();
    return s === activeTab;
  });

  if (loading) return (
    <LinearGradient colors={['#0a0a14', '#100a1e', '#0a0a14']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={THEME.primary} />
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#0a0a14', '#100a1e', '#0a0a14']} style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <BlurView intensity={20} tint="dark" style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.pageTitle}>Production Manager 🖨️</Text>
          <Text style={s.pageSub}>View and manage artworks for orders in production</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={s.refreshBtn}>
          <RefreshCw size={14} color={THEME.primary} />
        </TouchableOpacity>
      </BlurView>

      {/* Sub-tab row */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 48, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 8, alignItems: 'center' }}
      >
        {SUB_TABS.map(tab => {
          const active = activeTab === tab.key;
          const count = tasks.filter(t => (t.status || '').toUpperCase() === tab.key).length;
          return (
            <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)}
              style={[s.tab, active && { backgroundColor: tab.color + '22', borderColor: tab.color }]}>
              <Text style={[s.tabText, active && { color: tab.color, fontWeight: '700' }]}>{tab.label}</Text>
              <View style={[s.tabBadge, { backgroundColor: tab.color + '33' }]}>
                <Text style={{ color: tab.color, fontSize: 10, fontWeight: '700' }}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Task list */}
      <FlatList
        data={filteredTasks}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 130, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <BlurView intensity={15} tint="dark" style={[s.glassCard, { alignItems: 'center', paddingVertical: 48 }]}>
            <Printer size={32} color={THEME.mutedForeground} />
            <Text style={{ color: THEME.mutedForeground, marginTop: 12, fontSize: 14 }}>Production queue is empty</Text>
          </BlurView>
        }
        renderItem={({ item }) => {
          const sm = STATUS_META[item.status?.toUpperCase()] || { color: '#94a3b8', label: item.status };
          const assignedUser = item.assignedTo
            ? resolveUser(typeof item.assignedTo === 'object' ? item.assignedTo._id : item.assignedTo)
            : null;
          const linkedOrder = item.orderId
            ? resolveOrder(typeof item.orderId === 'object' ? item.orderId._id : item.orderId)
            : null;
          const nextStatus = STATUS_FLOW[item.status?.toUpperCase()];
          const isAdvancing = advancing === item._id;

          return (
            <BlurView intensity={15} tint="dark" style={[s.glassCard, { borderLeftWidth: 3, borderLeftColor: sm.color }]}>
              {/* Top row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.taskTitle} numberOfLines={2}>{item.title || `Task #${item._id?.slice(-6)}`}</Text>
                  {item.category && (
                    <Text style={s.taskCategory}>📁 {item.category}</Text>
                  )}
                </View>
                <View style={[s.statusBadge, { backgroundColor: sm.color + '22', borderColor: sm.color + '55' }]}>
                  <Text style={[s.statusText, { color: sm.color }]}>{sm.label}</Text>
                </View>
              </View>

              {/* Order + Assignee info */}
              <View style={s.metaRow}>
                {linkedOrder && (
                  <View style={s.metaChip}>
                    <Text style={s.metaText}>🛒 Order #{String(linkedOrder._id).slice(-6).toUpperCase()}</Text>
                  </View>
                )}
                {assignedUser && (
                  <View style={s.metaChip}>
                    <Text style={s.metaText}>👤 {assignedUser.name}</Text>
                  </View>
                )}
                {item.dueDate && (
                  <View style={[s.metaChip, { borderColor: '#eab30855', backgroundColor: '#eab30818' }]}>
                    <Text style={[s.metaText, { color: THEME.warning }]}>📅 {new Date(item.dueDate).toLocaleDateString('en-MY')}</Text>
                  </View>
                )}
              </View>

              {/* Advance button */}
              {nextStatus && (
                <TouchableOpacity
                  onPress={() => advanceTask(item)}
                  disabled={isAdvancing}
                  style={[s.advanceBtn, { borderColor: (STATUS_META[nextStatus]?.color || '#22c55e') + '55', backgroundColor: (STATUS_META[nextStatus]?.color || '#22c55e') + '15' }]}
                >
                  {isAdvancing
                    ? <ActivityIndicator size="small" color={STATUS_META[nextStatus]?.color || '#22c55e'} />
                    : <>
                        <Text style={[s.advanceText, { color: STATUS_META[nextStatus]?.color || '#22c55e' }]}>
                          → {STATUS_META[nextStatus]?.label || nextStatus}
                        </Text>
                        <ChevronRight size={14} color={STATUS_META[nextStatus]?.color || '#22c55e'} />
                      </>
                  }
                </TouchableOpacity>
              )}
            </BlurView>
          );
        }}
      />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: THEME.glassBorder, marginBottom: 10,
  },
  pageTitle: { fontSize: 18, fontWeight: '800', color: THEME.foreground },
  pageSub: { color: THEME.mutedForeground, fontSize: 11, marginTop: 2 },
  refreshBtn: { padding: 8, borderRadius: 10, borderWidth: 1, borderColor: THEME.glassBorder, backgroundColor: THEME.glass },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: THEME.glassBorder, backgroundColor: THEME.glass },
  tabText: { color: THEME.mutedForeground, fontSize: 12 },
  tabBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  glassCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 14 },
  taskTitle: { color: THEME.foreground, fontWeight: '700', fontSize: 14 },
  taskCategory: { color: THEME.mutedForeground, fontSize: 11, marginTop: 3 },
  statusBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  metaChip: { borderRadius: 8, borderWidth: 1, borderColor: THEME.glassBorder, backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 8, paddingVertical: 4 },
  metaText: { color: THEME.mutedForeground, fontSize: 11 },
  advanceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginTop: 4 },
  advanceText: { fontSize: 13, fontWeight: '700' },
});
