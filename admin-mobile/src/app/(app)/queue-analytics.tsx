import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { ListChecks, RefreshCcw } from 'lucide-react-native';
import { ScreenShell, Card, EmptyState, Loading, SectionTitle, StatCard, Chip, Bar } from '../../components/ui/kit';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  IN_DESIGN: '#8b5cf6',
  DONE_DESIGN: '#06b6d4',
  IN_PRODUCTION: '#f59e0b',
  HOLD_PRINTING: '#ef4444',
  PRINT_AWB: '#14b8a6',
  PACKAGING: '#0ea5e9',
  SHIPPED: '#22c55e',
  DELIVERED: '#10b981',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
};

export default function QueueAnalyticsScreen() {
  const { colors } = useTheme();
  const [days, setDays] = useState('30');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/sysadmin/queue-analytics?days=${days}`);
      setData(res.data || {});
    } catch {
      setError('Failed to load queue analytics.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const s = data?.summary || {};
  const maxBottleneck = Math.max(1, ...(data?.bottlenecks || []).map((b: any) => b.score || 0));

  return (
    <ScreenShell
      title="Queue Analytics"
      subtitle={`Ops health · last ${days} days`}
      icon={ListChecks}
      right={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label={`${days}d`} active onPress={() => setDays(['7', '14', '30', '60', '90'][(['7','14','30','60','90'].indexOf(days) + 1) % 5])} />
          <TouchableOpacity onPress={() => void load()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCcw size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      }
    >
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View style={{ padding: 16, paddingBottom: 40, gap: 14 }}>
            {data?.dataQuality?.mode && data.dataQuality.mode !== 'clean' ? (
              <Card><Text style={{ fontSize: 12, color: colors.warning }}>{data.dataQuality.note || 'Historical data may skew completion metrics.'}</Text></Card>
            ) : null}

            {loading ? <Loading /> : error ? (
              <EmptyState icon={ListChecks} title="Unable to load" message={error} />
            ) : (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <StatCard label="WIP" value={s.currentWip ?? 0} />
                  <StatCard label="Overdue" value={s.overdueTasks ?? 0} hint={`${Math.round((s.overdueRate ?? 0) * 100)}% rate`} />
                  <StatCard label="Unassigned" value={s.unassignedTasks ?? 0} />
                  <StatCard label="Completed" value={s.completedInRange ?? 0} hint={`last ${days}d`} />
                  <StatCard label="Avg completion" value={`${Number(s.avgCompletionHours ?? 0).toFixed(1)}h`} />
                </View>

                <SectionTitle>Daily throughput</SectionTitle>
                <Card>
                  {(() => {
                    const rows = data?.dailyThroughput || [];
                    if (!rows.length) return <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>No data.</Text>;
                    const maxV = Math.max(1, ...rows.map((r: any) => Math.max(r.created || 0, r.completed || 0)));
                    return (
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 90 }}>
                        {rows.slice(-30).map((r: any, i: number) => (
                          <View key={i} style={{ flex: 1, gap: 1 }}>
                            <View style={{ height: (r.created / maxV) * 84, backgroundColor: colors.primary, borderRadius: 1 }} />
                            <View style={{ height: (r.completed / maxV) * 42, backgroundColor: colors.success, borderRadius: 1 }} />
                          </View>
                        ))}
                      </View>
                    );
                  })()}
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 6 }}>Blue = created · Green = completed</Text>
                </Card>

                <SectionTitle>Status breakdown</SectionTitle>
                <Card style={{ gap: 10 }}>
                  {(data?.statusBreakdown || []).length === 0 ? (
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>No open tasks.</Text>
                  ) : (
                    (data.statusBreakdown || []).slice(0, 8).map((row: any) => (
                      <View key={row.status} style={{ gap: 4 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: STATUS_COLORS[row.status] || colors.foreground }}>{String(row.status).replace(/_/g, ' ')}</Text>
                          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{row.count}{row.overdue ? ` · ${row.overdue} overdue` : ''}</Text>
                        </View>
                        <Bar ratio={(row.count || 0) / Math.max(1, ...(data.statusBreakdown || []).map((r: any) => r.count || 0))} color={STATUS_COLORS[row.status] || colors.primary} height={6} />
                      </View>
                    ))
                  )}
                </Card>

                <SectionTitle>Staff workload</SectionTitle>
                <Card style={{ gap: 8 }}>
                  {(data?.staffWorkload || []).length === 0 ? (
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Nothing assigned yet.</Text>
                  ) : (
                    (data.staffWorkload || []).slice(0, 6).map((w: any) => (
                      <View key={w.assigneeId || w.assigneeName} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ flex: 1, fontSize: 12, color: colors.foreground }} numberOfLines={1}>{w.assigneeName || 'Unassigned'}</Text>
                        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>{w.count} tasks{w.overdue ? ` · ${w.overdue} overdue` : ''}</Text>
                      </View>
                    ))
                  )}
                </Card>

                <SectionTitle>Bottlenecks</SectionTitle>
                <Card style={{ gap: 10 }}>
                  {(data?.bottlenecks || []).length === 0 ? (
                    <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Flow looks healthy.</Text>
                  ) : (
                    (data.bottlenecks || []).slice(0, 5).map((b: any) => (
                      <View key={b.status} style={{ gap: 4 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: STATUS_COLORS[b.status] || colors.foreground }}>{String(b.status).replace(/_/g, ' ')}</Text>
                          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>avg {Number(b.avgAgeHours ?? 0).toFixed(0)}h</Text>
                        </View>
                        <Bar ratio={(b.score || 0) / maxBottleneck} color={STATUS_COLORS[b.status] || colors.destructive} height={6} />
                      </View>
                    ))
                  )}
                </Card>

                {(data?.oldestTasks || []).length > 0 ? (
                  <>
                    <SectionTitle>Oldest open tasks</SectionTitle>
                    <Card style={{ gap: 10 }}>
                      {data.oldestTasks.slice(0, 5).map((t: any) => (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() => {}}
                          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <Text style={{ flex: 1, fontSize: 12, color: colors.foreground }} numberOfLines={1}>{t.title}</Text>
                          <Text style={{ fontSize: 11, color: t.ageHours > 72 ? colors.destructive : colors.mutedForeground }}>{Number(t.ageHours ?? 0).toFixed(0)}h</Text>
                        </TouchableOpacity>
                      ))}
                    </Card>
                  </>
                ) : null}
              </>
            )}
          </View>
        }
      />
    </ScreenShell>
  );
}
