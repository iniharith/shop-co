import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import api from '../../services/api';
import { THEME } from '../../constants/theme';

const STATUSES = [
  { key: 'TODO',          label: 'To Do',       color: '#94a3b8' },
  { key: 'IN_PROGRESS',   label: 'In Progress', color: '#f59e0b' },
  { key: 'IN_PRODUCTION', label: 'Production',  color: '#a78bfa' },
  { key: 'DONE',          label: 'Done',        color: '#22c55e' },
  { key: 'CANCELLED',     label: 'Cancelled',   color: '#ef4444' },
];

function getStatusMeta(status: string) {
  const s = status?.toUpperCase();
  return (
    STATUSES.find(x => x.key === s) ||
    (s?.includes('PROGRESS') ? STATUSES[1] : null) ||
    (s?.includes('PROD')     ? STATUSES[2] : null) ||
    (s?.includes('DONE') || s?.includes('COMPLET') ? STATUSES[3] : null) ||
    (s?.includes('CANCEL')   ? STATUSES[4] : null) ||
    STATUSES[0]
  );
}

export default function TasksScreen() {
  const [tasks, setTasks]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [filter, setFilter]     = useState('ALL');

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      const all = res.data?.data || res.data?.tasks || res.data || [];
      setTasks(Array.isArray(all) ? all : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefresh(false); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const filtered = filter === 'ALL'
    ? tasks
    : tasks.filter(t => getStatusMeta(t.status)?.key === filter);

  if (loading) return (
    <LinearGradient colors={['#0a0a14', '#100a1e', '#0a0a14']} style={s.center}>
      <ActivityIndicator size="large" color={THEME.primary} />
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#0a0a14', '#100a1e', '#0a0a14']} style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <BlurView intensity={20} tint="dark" style={s.header}>
        <Text style={s.pageTitle}>Tasks</Text>
        <Text style={s.pageSub}>Manage your operational workflow</Text>
      </BlurView>

      {/* Status Filter Tabs */}
      <FlatList
        horizontal showsHorizontalScrollIndicator={false}
        data={[{ key: 'ALL', label: 'All', color: THEME.primary }, ...STATUSES]}
        keyExtractor={i => i.key}
        style={{ maxHeight: 44, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 8, alignItems: 'center' }}
        renderItem={({ item }) => {
          const active = filter === item.key;
          return (
            <TouchableOpacity
              onPress={() => setFilter(item.key)}
              style={[s.chip, active && { backgroundColor: item.color + '33', borderColor: item.color }]}
            >
              <Text style={[s.chipText, active && { color: item.color, fontWeight: '700' }]}>{item.label}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 130, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); fetchTasks(); }} tintColor={THEME.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <BlurView intensity={15} tint="dark" style={[s.glassCard, { alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ color: THEME.mutedForeground }}>No tasks in this category</Text>
          </BlurView>
        }
        renderItem={({ item }) => {
          const meta = getStatusMeta(item.status);
          return (
            <BlurView intensity={15} tint="dark" style={[s.glassCard, { borderLeftWidth: 3, borderLeftColor: meta?.color || '#94a3b8' }]}>
              <View style={s.taskHeader}>
                <Text style={s.taskTitle} numberOfLines={2}>{item.title || `Task #${item._id?.slice(-6)}`}</Text>
                <View style={[s.badge, { backgroundColor: (meta?.color || '#94a3b8') + '22' }]}>
                  <Text style={[s.badgeText, { color: meta?.color || '#94a3b8' }]}>{meta?.label || item.status}</Text>
                </View>
              </View>
              {item.description ? <Text style={s.taskDesc} numberOfLines={3}>{item.description}</Text> : null}
              <View style={s.taskFooter}>
                {item.category ? <Text style={s.taskMeta}>📁 {item.category}</Text> : null}
                {item.orderId  ? <Text style={s.taskMeta}>🛒 Order #{typeof item.orderId === 'object' ? item.orderId?._id?.slice(-6) : String(item.orderId).slice(-6)}</Text> : null}
                <Text style={[s.taskMeta, { marginLeft: 'auto' }]}>{new Date(item.createdAt).toLocaleDateString('en-MY')}</Text>
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
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: THEME.glassBorder, backgroundColor: THEME.glass },
  chipText: { color: THEME.mutedForeground, fontSize: 12 },
  glassCard: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 14 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  taskTitle: { color: THEME.foreground, fontWeight: '700', fontSize: 14, flex: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  taskDesc: { color: THEME.mutedForeground, fontSize: 12, marginTop: 8, lineHeight: 18 },
  taskFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10, flexWrap: 'wrap' },
  taskMeta: { color: THEME.mutedForeground, fontSize: 11 },
});
