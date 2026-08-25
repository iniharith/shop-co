import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { CalendarRange } from 'lucide-react-native';
import { ScreenShell, Card, EmptyState, Loading, SectionTitle, Chip } from '../../components/ui/kit';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#94a3b8', IN_PROGRESS: '#3b82f6', IN_DESIGN: '#8b5cf6', DONE_DESIGN: '#06b6d4',
  IN_PRODUCTION: '#f59e0b', HOLD_PRINTING: '#ef4444', PRINT_AWB: '#14b8a6', PACKAGING: '#0ea5e9',
  SHIPPED: '#22c55e', DELIVERED: '#10b981', COMPLETED: '#10b981', CANCELLED: '#ef4444',
};
const DAY_MS = 86400000;

export default function ScheduleScreen() {
  const { colors } = useTheme();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');

  const { start, end } = useMemo(() => ({
    start: new Date(Date.now() - 14 * DAY_MS),
    end: new Date(Date.now() + 30 * DAY_MS),
  }), []);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/tasks/gantt?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
      setRows(res.data?.tasks || res.data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [start, end]);

  useEffect(() => {
    void load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const categories = useMemo(() => ['All', ...Array.from(new Set(rows.map((r: any) => r.category).filter(Boolean)))], [rows]);
  const statuses = useMemo(() => ['All', ...Array.from(new Set(rows.map((r: any) => r.status).filter(Boolean)))], [rows]);

  const filtered = rows.filter((r: any) =>
    (category === 'All' || r.category === category) && (status === 'All' || r.status === status),
  );

  const totalDays = Math.round((end.getTime() - start.getTime()) / DAY_MS);
  const dayWidth = 26;
  const nowX = ((Date.now() - start.getTime()) / DAY_MS) * dayWidth;
  const days = Array.from({ length: totalDays + 1 }, (_, i) => new Date(start.getTime() + i * DAY_MS));

  return (
    <ScreenShell title="Schedule" subtitle="Task timeline · −2 to +4 weeks" icon={CalendarRange}>
      <View style={{ paddingVertical: 12, gap: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {categories.slice(0, 10).map((c) => (
            <Chip key={c} label={c === 'All' ? 'All categories' : c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {statuses.slice(0, 13).map((st) => (
            <Chip key={st} label={st === 'All' ? 'Any status' : st.replace(/_/g, ' ')} active={status === st} color={STATUS_COLORS[st]} onPress={() => setStatus(st)} />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.primary} />}
          ListHeaderComponent={
            <>
              <SectionTitle>Timeline</SectionTitle>
              <Card style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ width: totalDays * dayWidth + 40, paddingVertical: 8 }}>
                    <View style={{ flexDirection: 'row', paddingLeft: 20 }}>
                      {days.filter((_, i) => i % 5 === 0).map((d, i) => (
                        <Text key={i} style={{ position: 'absolute', left: 20 + i * 5 * dayWidth - 10, fontSize: 8, color: colors.mutedForeground }}>
                          {d.getDate()}/{d.getMonth() + 1}
                        </Text>
                      ))}
                    </View>
                    <View style={{ height: filtered.length * 34 + 6, marginTop: 12 }}>
                      <View style={{ position: 'absolute', left: nowX + 20, top: 0, bottom: 0, width: 1.5, backgroundColor: colors.destructive, opacity: 0.7 }} />
                      {filtered.map((t: any, idx: number) => {
                        const created = new Date(t.createdAt || Date.now()).getTime();
                        const due = new Date(t.dueDate || t.completedAt || Date.now()).getTime();
                        const x1 = Math.max(0, ((created - start.getTime()) / DAY_MS) * dayWidth);
                        const x2 = Math.max(x1 + 6, ((Math.max(due, created) - start.getTime()) / DAY_MS) * dayWidth);
                        return (
                          <View
                            key={String(t.id)}
                            style={{
                              position: 'absolute',
                              left: 20 + x1,
                              top: 4 + idx * 34,
                              width: Math.min(x2 - x1, totalDays * dayWidth - x1),
                              height: 18,
                              borderRadius: 9,
                              backgroundColor: STATUS_COLORS[t.status] || colors.primary,
                              opacity: 0.85,
                            }}
                          />
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>
              </Card>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.foreground, marginHorizontal: 16, marginBottom: 8 }}>{filtered.length} tasks</Text>
            </>
          }
          ListEmptyComponent={<EmptyState icon={CalendarRange} title="No tasks in range" message="Adjust filters or wait for new work." />}
          renderItem={({ item }) => {
            const color = STATUS_COLORS[item.status] || colors.primary;
            return (
              <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ width: 4, alignSelf: 'stretch', minHeight: 34, borderRadius: 2, backgroundColor: color }} />
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }} numberOfLines={1}>{item.title}</Text>
                      <Text style={{ fontSize: 11, color: colors.mutedForeground }} numberOfLines={1}>
                        {item.assignee || 'Unassigned'} · {item.category || 'General'}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: `${color}22`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color }}>{String(item.status || '').replace(/_/g, ' ')}</Text>
                    </View>
                  </View>
                </Card>
              </View>
            );
          }}
        />
      )}
    </ScreenShell>
  );
}
