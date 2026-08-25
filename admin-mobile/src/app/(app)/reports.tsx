import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart3, Download, RefreshCcw } from 'lucide-react-native';
import { ScreenShell, Card, EmptyState, Loading, SectionTitle, StatCard, Chip } from '../../components/ui/kit';
import { useTheme } from '../../context/ThemeContext';
import api, { API_URL } from '../../services/api';

const TABS = ['Monthly Orders', 'Staff Performance'];

export default function ReportsScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState(TABS[0]);
  return (
    <ScreenShell title="Reports" subtitle="Performance & monthly orders" icon={BarChart3}>
      <View style={{ flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 8 }}>
        {TABS.map((t) => <Chip key={t} label={t} active={tab === t} onPress={() => setTab(t)} />)}
      </View>
      {tab === 'Monthly Orders' ? <MonthlyOrders /> : <StaffReport />}
    </ScreenShell>
  );
}

function MonthlyOrders() {
  const { colors } = useTheme();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/reports/monthly-orders?month=${month}&limit=100`);
      const data = res.data?.data ?? res.data;
      setRows(data?.rows || []);
      setSummary(data?.summary || {});
    } catch {
      setRows([]); setSummary({});
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const dest = `${FileSystem.cacheDirectory}monthly-orders-${month}.xlsx`;
      const res = await FileSystem.downloadAsync(`${API_URL}/api/admin/reports/monthly-orders/export?month=${month}`, dest, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(res.uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      }
    } catch {
      // ignore
    } finally {
      setExporting(false);
    }
  };

  const shiftMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    setMonth(d.toISOString().slice(0, 7));
  };

  return (
    <FlatList
      data={rows}
      keyExtractor={(item, i) => String(item.orderId || item.taskId || i)}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <TouchableOpacity onPress={() => shiftMonth(-1)}><Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary }}>‹</Text></TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.foreground }}>{month}</Text>
            <TouchableOpacity onPress={() => shiftMonth(1)}><Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary }}>›</Text></TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            <StatCard label="Orders" value={summary.orderCount ?? rows.length} />
            <StatCard label="Files" value={summary.fileCount ?? '—'} hint={summary.fileSizeGB ? `${Number(summary.fileSizeGB).toFixed(2)} GB` : undefined} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity onPress={() => void load()} disabled={loading} style={[st.btn, { backgroundColor: colors.secondary }]}>
              <RefreshCcw size={15} color={colors.foreground} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.foreground }}>Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => void exportCsv()} disabled={exporting} style={[st.btn, { backgroundColor: colors.primary, opacity: exporting ? 0.6 : 1 }]}>
              <Download size={15} color="#fff" />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>{exporting ? 'Exporting…' : 'Export Excel'}</Text>
            </TouchableOpacity>
          </View>
          <SectionTitle>Orders ({rows.length}{rows.length === 100 ? '+' : ''})</SectionTitle>
        </View>
      }
      ListEmptyComponent={loading ? <Loading /> : <EmptyState icon={BarChart3} title="No orders this month" message="Pick another month." />}
      renderItem={({ item }) => (
        <Card style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: colors.foreground }} numberOfLines={1}>
              {item.customerName || '—'}
            </Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground }} numberOfLines={1}>{item.orderId}</Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 3 }} numberOfLines={1}>
            {[item.category, item.itemName, item.size && `${item.size}`, item.quantity && `×${item.quantity}`].filter(Boolean).join(' · ')}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{item.fileCount ?? 0} files{item.fileSizeMB ? ` · ${Number(item.fileSizeMB).toFixed(1)} MB` : ''}</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.primary }} numberOfLines={1}>{item.assignedTo || 'Unassigned'}</Text>
          </View>
        </Card>
      )}
    />
  );
}

function StaffReport() {
  const { colors } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users')
      .then((res) => {
        const list = res.data?.users || [];
        setUsers(list);
        if (list.length) setUserId(list[0]._id);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    api.get(`/sysadmin/reports?userId=${userId}`)
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [userId]);

  const r = data || {};

  return (
    <FlatList
      data={(r.detailedTasks || []).slice(0, 50)}
      keyExtractor={(t: any, i) => String(t._id || i)}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
            {users.map((u) => (
              <Chip key={u._id} label={u.name || u.username || u.email} active={userId === u._id} onPress={() => setUserId(u._id)} />
            ))}
          </ScrollView>
          {loading && !data ? <Loading /> : data ? (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <StatCard label="Assigned" value={r.tasksAssigned ?? '—'} />
                <StatCard label="Completed" value={r.tasksCompleted ?? '—'} />
                <StatCard label="Avg time" value={r.avgTimeFormatted ?? '—'} />
                <StatCard label="Files" value={r.fileQuantity ?? '—'} />
                <StatCard label="Efficiency" value={`${Math.round((r.efficiency ?? 0) * 100)}%`} />
              </View>
              {Array.isArray(r.chartData) && r.chartData.length ? (
                <>
                  <SectionTitle>Completions · last 30 days</SectionTitle>
                  <Card>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 80 }}>
                      {(() => {
                        const maxV = Math.max(1, ...r.chartData.map((d: any) => d.completed || 0));
                        return r.chartData.map((d: any, i: number) => (
                          <View key={i} style={{ flex: 1 }}>
                            <View style={{ height: Math.max(2, ((d.completed || 0) / maxV) * 74), backgroundColor: colors.success, borderRadius: 2 }} />
                          </View>
                        ));
                      })()}
                    </View>
                  </Card>
                </>
              ) : null}
              <SectionTitle>Detailed tasks</SectionTitle>
            </>
          ) : (
            <EmptyState icon={BarChart3} title="Select a staff member" message="Choose a name above to load their report." />
          )}
        </View>
      }
      ListEmptyComponent={<EmptyState icon={BarChart3} title="No task detail" />}
      renderItem={({ item }: any) => (
        <Card style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: colors.foreground }} numberOfLines={1}>{item.title}</Text>
            <Text style={{ fontSize: 10, color: colors.mutedForeground }}>{String(item.status || '').replace(/_/g, ' ')}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 4 }}>
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{item.fileCount ?? 0} files</Text>
            {item.timeTookFormatted ? <Text style={{ fontSize: 11, color: colors.mutedForeground }}>took {item.timeTookFormatted}</Text> : null}
          </View>
        </Card>
      )}
    />
  );
}

const st = {
  btn: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, gap: 7, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14 },
};
