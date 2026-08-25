import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Activity, RefreshCcw } from 'lucide-react-native';
import { ScreenShell, Card, EmptyState, Loading, SectionTitle, StatCard, Chip, Bar } from '../../components/ui/kit';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const METRICS = [
  { key: 'LCP', label: 'Load (LCP)', unit: 's', good: 2500, poor: 4000 },
  { key: 'INP', label: 'Interactivity (INP)', unit: 'ms', good: 200, poor: 500 },
  { key: 'CLS', label: 'Layout shift (CLS)', unit: '', good: 0.1, poor: 0.25 },
  { key: 'FCP', label: 'First paint (FCP)', unit: 'ms', good: 1800, poor: 3000 },
  { key: 'TTFB', label: 'Server (TTFB)', unit: 'ms', good: 800, poor: 1800 },
];

const RANGES = ['7', '14', '30', '60', '90'];

export default function MonitoringScreen() {
  const { colors } = useTheme();
  const [days, setDays] = useState('30');
  const [metric, setMetric] = useState('LCP');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/web-vitals/stats?days=${days}`);
      setData(res.data || {});
    } catch {
      setError('Failed to load web vitals.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const summaryFor = (key: string) => data?.summary?.find((s: any) => s.metric === key);
  const trend = data?.trend || [];
  const activeMetric = METRICS.find((m) => m.key === metric)!;
  const fmtP75 = (s: any) => {
    if (!s) return '—';
    if (activeMetric.unit === '') return Number(s.p75 ?? 0).toFixed(3);
    if (activeMetric.unit === 's') return (Number(s.p75 ?? 0) / 1000).toFixed(2);
    return Math.round(Number(s.p75 ?? 0)).toLocaleString();
  };
  const ratingColor = (v: number) => (v <= activeMetric.good ? colors.success : v <= activeMetric.poor ? colors.warning : colors.destructive);

  return (
    <ScreenShell
      title="Monitoring"
      subtitle={`Core Web Vitals · last ${days} days`}
      icon={Activity}
      right={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label={RANGES.includes(days) ? `${days}d` : `${days}d`} active onPress={() => setDays(RANGES[(RANGES.indexOf(days) + 1) % RANGES.length])} />
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {METRICS.map((m) => (
                <Chip key={m.key} label={m.key} active={metric === m.key} onPress={() => setMetric(m.key)} />
              ))}
            </View>

            {loading ? <Loading /> : error ? (
              <EmptyState icon={Activity} title="Unable to load" message={error} />
            ) : !data?.totalSamples ? (
              <EmptyState icon={Activity} title="No samples yet" message={`No web vital events in the last ${days} days.`} />
            ) : (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <StatCard label="Samples" value={(data.totalSamples || 0).toLocaleString()} />
                  <StatCard label="p75" value={fmtP75(summaryFor(metric)) + (activeMetric.unit === 's' ? 's' : activeMetric.unit)} />
                  <StatCard
                    label="Good rate"
                    value={`${Math.round((summaryFor(metric)?.goodRate ?? 0) * 100)}%`}
                    hint={`${summaryFor(metric)?.good || 0} good · ${summaryFor(metric)?.poor || 0} poor`}
                  />
                </View>

                <SectionTitle>Rating distribution — {metric}</SectionTitle>
                <Card style={{ gap: 10 }}>
                  {(() => {
                    const s = summaryFor(metric) || {};
                    const totalN = Math.max(1, (s.good || 0) + (s.needsImprovement || 0) + (s.poor || 0));
                    const rows = [
                      { label: 'Good', n: s.good || 0, color: colors.success },
                      { label: 'Needs improvement', n: s.needsImprovement || 0, color: colors.warning },
                      { label: 'Poor', n: s.poor || 0, color: colors.destructive },
                    ];
                    return rows.map((r) => (
                      <View key={r.label} style={{ gap: 4 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{r.label}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: r.color }}>{r.n}</Text>
                        </View>
                        <Bar ratio={r.n / totalN} color={r.color} />
                      </View>
                    ));
                  })()}
                </Card>

                <SectionTitle>Daily p75 trend</SectionTitle>
                <Card style={{ gap: 6 }}>
                  {(() => {
                    const points = trend.map((d: any) => Number(d[metric] ?? d.p75 ?? 0)).filter((n: number) => Number.isFinite(n));
                    if (!points.length) return <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>No trend data.</Text>;
                    const maxV = Math.max(...points);
                    return (
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 90 }}>
                        {points.slice(-30).map((v: number, i: number) => (
                          <View key={i} style={{ flex: 1 }}>
                            <View style={{ height: maxV > 0 ? Math.max(3, (v / maxV) * 84) : 3, backgroundColor: ratingColor(v), borderRadius: 2 }} />
                          </View>
                        ))}
                      </View>
                    );
                  })()}
                </Card>

                <SectionTitle>Devices</SectionTitle>
                <Card style={{ gap: 10 }}>
                  {(() => {
                    const mob = data.devices?.mobile || 0;
                    const desk = data.devices?.desktop || 0;
                    const tot = Math.max(1, mob + desk);
                    return (
                      <>
                        <View style={{ gap: 4 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Mobile</Text>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>{mob}</Text>
                          </View>
                          <Bar ratio={mob / tot} color={colors.primary} />
                        </View>
                        <View style={{ gap: 4 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Desktop</Text>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.success }}>{desk}</Text>
                          </View>
                          <Bar ratio={desk / tot} color={colors.success} />
                        </View>
                      </>
                    );
                  })()}
                </Card>

                {(data.topRoutes || []).length > 0 ? (
                  <>
                    <SectionTitle>Top routes</SectionTitle>
                    <Card style={{ gap: 8 }}>
                      {data.topRoutes.slice(0, 5).map((r: any, i: number) => (
                        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ flex: 1, fontSize: 12, color: colors.foreground }} numberOfLines={1}>{r.route}</Text>
                          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>{r.count} · p75 {r.p75}{activeMetric.unit}</Text>
                        </View>
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
