import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl,
  ActivityIndicator, StyleSheet, StatusBar, Animated, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import api from '../../services/api';
import { THEME } from '../../constants/theme';
import { Trash2, CheckSquare, Tag, X } from 'lucide-react-native';

// Full status list matching website tasksManager.tsx
const TASK_STATUSES = [
  { key: 'PLACED',            label: 'Placed',            color: '#60a5fa' },
  { key: 'IN_PROGRESS',       label: 'In Progress',       color: '#f59e0b' },
  { key: 'PENDING_ARTWORK',   label: 'Pending Artwork',   color: '#f97316' },
  { key: 'ARTWORK_REVIEWED',  label: 'Artwork Reviewed',  color: '#22c55e' },
  { key: 'ARTWORK_REJECTED',  label: 'Artwork Rejected',  color: '#ef4444' },
  { key: 'IN_DESIGN',         label: 'In Design',         color: '#a78bfa' },
  { key: 'PEMBETULAN',        label: 'Pembetulan',        color: '#fb923c' },
  { key: 'DONE_DESIGN',       label: 'Done Design',       color: '#34d399' },
  { key: 'IN_PRODUCTION',     label: 'In Production',     color: '#818cf8' },
  { key: 'HOLD_PRINTING',     label: 'Hold Printing',     color: '#94a3b8' },
  { key: 'DONE_PRINTING',     label: 'Done Printing',     color: '#4ade80' },
  { key: 'PACKAGING',         label: 'Packaging',         color: '#06b6d4' },
  { key: 'SHIPPED',           label: 'Shipped',           color: '#fbbf24' },
  { key: 'IN_TRANSIT',        label: 'In Transit',        color: '#60a5fa' },
  { key: 'DELIVERED',         label: 'Delivered',         color: '#22c55e' },
  { key: 'CANCELLED',         label: 'Cancelled',         color: '#ef4444' },
  { key: 'FAILED',            label: 'Failed',            color: '#f43f5e' },
];

const FILTER_TABS = [{ key: 'ALL', label: 'All', color: THEME.primary }, ...TASK_STATUSES];

function getStatusMeta(status: string) {
  const s = status?.toUpperCase();
  return (
    TASK_STATUSES.find(x => x.key === s) ||
    (s?.includes('PROGRESS')  ? TASK_STATUSES[1]  : null) ||
    (s?.includes('PROD')      ? TASK_STATUSES[8]  : null) ||
    (s?.includes('DONE') || s?.includes('COMPLET') ? TASK_STATUSES[10] : null) ||
    (s?.includes('CANCEL')    ? TASK_STATUSES[15] : null) ||
    TASK_STATUSES[0]
  );
}

// Generate a stable color per user ID (same logic as website userColor.ts)
const USER_COLORS = [
  '#ef4444','#f97316','#eab308','#22c55e','#06b6d4',
  '#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f59e0b',
];
function getUserColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return USER_COLORS[hash % USER_COLORS.length];
}

function AssigneeTag({ user }: { user: any }) {
  if (!user) return null;
  const name = user.name || user.email || String(user._id || user).slice(-6);
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const color = getUserColor(user._id || String(user));
  return (
    <View style={[s.assigneeTag, { backgroundColor: color + '22', borderColor: color + '55' }]}>
      <View style={[s.assigneeDot, { backgroundColor: color }]} />
      <Text style={[s.assigneeText, { color }]} numberOfLines={1}>{name}</Text>
    </View>
  );
}

export default function TasksScreen() {
  const [tasks, setTasks]           = useState<any[]>([]);
  const [users, setUsers]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefresh]    = useState(false);
  const [filter, setFilter]         = useState('ALL');

  // Long-press multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
  const bulkBarAnim = useRef(new Animated.Value(0)).current;

  const fetchTasks = async () => {
    try {
      const [taskRes, userRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/admin/users').catch(() => ({ data: [] })),
      ]);
      const all = taskRes.data?.data || taskRes.data?.tasks || taskRes.data || [];
      setTasks(Array.isArray(all) ? all : []);
      const uList = userRes.data?.data || userRes.data?.users || userRes.data || [];
      setUsers(Array.isArray(uList) ? uList : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefresh(false); }
  };

  useEffect(() => { fetchTasks(); }, []);

  // Show/hide bulk action bar
  useEffect(() => {
    Animated.spring(bulkBarAnim, {
      toValue: selectionMode && selectedIds.size > 0 ? 1 : 0,
      useNativeDriver: true,
      tension: 80, friction: 12,
    }).start();
  }, [selectionMode, selectedIds.size]);

  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleLongPress = useCallback((id: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  }, []);

  const handleTap = useCallback((task: any) => {
    if (!selectionMode) return; // normal tap — future: open task modal
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(task._id)) next.delete(task._id);
      else next.add(task._id);
      if (next.size === 0) setSelectionMode(false);
      return next;
    });
  }, [selectionMode]);

  const bulkDelete = () => {
    Alert.alert(
      'Delete Tasks',
      `Delete ${selectedIds.size} selected task(s)? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all([...selectedIds].map(id => api.delete(`/tasks/${id}`)));
              setTasks(prev => prev.filter(t => !selectedIds.has(t._id)));
              exitSelection();
            } catch (e) {
              Alert.alert('Error', 'Some tasks could not be deleted.');
            }
          },
        },
      ]
    );
  };

  const bulkMarkDone = async () => {
    try {
      await Promise.all([...selectedIds].map(id => api.put(`/tasks/${id}`, { status: 'DELIVERED' })));
      await fetchTasks();
      exitSelection();
    } catch (e) { Alert.alert('Error', 'Failed to update tasks.'); }
  };

  // Resolve assignee from users list
  const resolveAssignees = (task: any): any[] => {
    const ids: string[] = [];
    if (Array.isArray(task.assignedTo)) ids.push(...task.assignedTo);
    else if (task.assignedTo) ids.push(task.assignedTo);
    if (task.assignee) ids.push(task.assignee);
    const unique = [...new Set(ids.map(i => (typeof i === 'object' ? i?._id : i)))].filter(Boolean);
    return unique.map(id => {
      if (typeof id === 'object') return id;
      return users.find(u => u._id === id || u._id === String(id)) || { _id: id, name: String(id).slice(-6) };
    });
  };

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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={s.pageTitle}>Tasks</Text>
            <Text style={s.pageSub}>
              {selectionMode
                ? `${selectedIds.size} selected — tap to toggle`
                : 'Long-press a task to select'}
            </Text>
          </View>
          {selectionMode && (
            <TouchableOpacity onPress={exitSelection} style={s.exitSelBtn}>
              <X size={16} color={THEME.foreground} />
              <Text style={{ color: THEME.foreground, fontSize: 12, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </BlurView>

      {/* Status Filter Tabs */}
      {!selectionMode && (
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={FILTER_TABS}
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
      )}

      {/* Task List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 160, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); fetchTasks(); }} tintColor={THEME.primary} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <BlurView intensity={15} tint="dark" style={[s.glassCard, { alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ color: THEME.mutedForeground }}>No tasks in this category</Text>
          </BlurView>
        }
        renderItem={({ item }) => {
          const meta = getStatusMeta(item.status);
          const isSelected = selectedIds.has(item._id);
          const assignees = resolveAssignees(item);

          return (
            <TouchableOpacity
              onLongPress={() => handleLongPress(item._id)}
              onPress={() => handleTap(item)}
              delayLongPress={350}
              activeOpacity={0.85}
            >
              <BlurView
                intensity={15} tint="dark"
                style={[
                  s.glassCard,
                  { borderLeftWidth: 3, borderLeftColor: meta?.color || '#94a3b8' },
                  isSelected && { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: THEME.primary },
                ]}
              >
                {/* Selection indicator */}
                {selectionMode && (
                  <View style={[s.selectCircle, isSelected && { backgroundColor: THEME.primary, borderColor: THEME.primary }]}>
                    {isSelected && <Text style={{ color: '#000', fontSize: 10, fontWeight: '800' }}>✓</Text>}
                  </View>
                )}

                <View style={s.taskHeader}>
                  <Text style={s.taskTitle} numberOfLines={2}>{item.title || `Task #${item._id?.slice(-6)}`}</Text>
                  <View style={[s.badge, { backgroundColor: (meta?.color || '#94a3b8') + '22' }]}>
                    <Text style={[s.badgeText, { color: meta?.color || '#94a3b8' }]}>{meta?.label || item.status}</Text>
                  </View>
                </View>

                {item.description ? <Text style={s.taskDesc} numberOfLines={2}>{item.description}</Text> : null}

                {/* Assignee tags */}
                {assignees.length > 0 && (
                  <View style={s.assigneeRow}>
                    {assignees.map((u, i) => <AssigneeTag key={i} user={u} />)}
                  </View>
                )}

                <View style={s.taskFooter}>
                  {item.category ? <Text style={s.taskMeta}>📁 {item.category}</Text> : null}
                  {item.orderId ? (
                    <Text style={s.taskMeta}>
                      🛒 #{typeof item.orderId === 'object' ? item.orderId?._id?.slice(-6) : String(item.orderId).slice(-6)}
                    </Text>
                  ) : null}
                  {item.dueDate ? (
                    <Text style={[s.taskMeta, { color: THEME.warning }]}>
                      📅 {new Date(item.dueDate).toLocaleDateString('en-MY')}
                    </Text>
                  ) : null}
                  <Text style={[s.taskMeta, { marginLeft: 'auto' }]}>
                    {new Date(item.createdAt).toLocaleDateString('en-MY')}
                  </Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          );
        }}
      />

      {/* Floating Bulk Action Bar */}
      <Animated.View
        pointerEvents={selectionMode && selectedIds.size > 0 ? 'auto' : 'none'}
        style={[
          s.bulkBar,
          {
            transform: [{
              translateY: bulkBarAnim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }),
            }],
            opacity: bulkBarAnim,
          },
        ]}
      >
        <BlurView intensity={40} tint="dark" style={s.bulkBarInner}>
          <Text style={s.bulkCount}>{selectedIds.size} selected</Text>
          <TouchableOpacity onPress={bulkMarkDone} style={[s.bulkBtn, { backgroundColor: '#22c55e22', borderColor: '#22c55e55' }]}>
            <CheckSquare size={15} color="#22c55e" />
            <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: '700' }}>Mark Done</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={bulkDelete} style={[s.bulkBtn, { backgroundColor: '#ef444422', borderColor: '#ef444455' }]}>
            <Trash2 size={15} color="#ef4444" />
            <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={exitSelection} style={s.bulkDismiss}>
            <X size={16} color={THEME.mutedForeground} />
          </TouchableOpacity>
        </BlurView>
      </Animated.View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: THEME.glassBorder, marginBottom: 10 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: THEME.foreground, letterSpacing: -0.5 },
  pageSub: { color: THEME.mutedForeground, fontSize: 12, marginTop: 2 },
  exitSelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: THEME.glassBorder, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: THEME.glass },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: THEME.glassBorder, backgroundColor: THEME.glass },
  chipText: { color: THEME.mutedForeground, fontSize: 12 },
  glassCard: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 14 },
  selectCircle: { position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: THEME.glassBorder, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', zIndex: 2 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  taskTitle: { color: THEME.foreground, fontWeight: '700', fontSize: 14, flex: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, flexShrink: 0 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  taskDesc: { color: THEME.mutedForeground, fontSize: 12, marginTop: 6, lineHeight: 18 },
  assigneeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  assigneeTag: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  assigneeDot: { width: 6, height: 6, borderRadius: 3 },
  assigneeText: { fontSize: 11, fontWeight: '600', maxWidth: 100 },
  taskFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10, flexWrap: 'wrap' },
  taskMeta: { color: THEME.mutedForeground, fontSize: 11 },
  // Floating bulk bar
  bulkBar: { position: 'absolute', bottom: 110, left: 16, right: 16, borderRadius: 20, overflow: 'hidden' },
  bulkBarInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: THEME.glassBorder, borderRadius: 20 },
  bulkCount: { color: THEME.foreground, fontWeight: '700', fontSize: 13, flex: 1 },
  bulkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  bulkDismiss: { padding: 4 },
});
