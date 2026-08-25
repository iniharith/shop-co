import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Cloud, RefreshCcw, Search } from 'lucide-react-native';
import { ScreenShell, Card, EmptyState, Loading, Chip } from '../../components/ui/kit';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

const fmtBytes = (n?: number) => {
  if (!n && n !== 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
};

export default function AwsMediaScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [pageTokens, setPageTokens] = useState<(string | null)[]>([null]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const loadPage = useCallback(async (index: number) => {
    setLoading(true);
    try {
      const continuation = pageTokens[index];
      const params = new URLSearchParams({ limit: '100' });
      if (continuation) params.set('continuationToken', continuation);
      const res = await api.get(`/sysadmin/aws-media?${params.toString()}`);
      setItems(res.data?.items || []);
      setToken(res.data?.nextContinuationToken || null);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [pageTokens]);

  useEffect(() => {
    void loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (user?.role !== 'sysadmin') {
    return (
      <ScreenShell title="AWS Media" subtitle="S3 bucket browser" icon={Cloud}>
        <EmptyState icon={Cloud} title="Restricted" message="Only sysadmins can browse storage." />
      </ScreenShell>
    );
  }

  const open = async (key: string) => {
    try {
      const res = await api.post('/sysadmin/aws-media/open', { key });
      if (res.data?.url) await WebBrowser.openBrowserAsync(res.data.url);
    } catch {
      Alert.alert('Open failed', 'Could not get a signed URL.');
    }
  };

  const remove = (item: any) => {
    Alert.alert('Delete object', `Delete "${item.key.split('/').pop()}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete('/sysadmin/aws-media', { params: { key: item.key }, data: { key: item.key } });
          void loadPage(pageTokens.length - 1);
        } catch (e: any) {
          if (e?.response?.status === 409) {
            Alert.alert('Referenced in database', 'This file is still referenced. Force delete?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Force delete', style: 'destructive', onPress: async () => {
                try {
                  await api.delete('/sysadmin/aws-media', { params: { key: item.key, force: 'true' }, data: { key: item.key } });
                  void loadPage(pageTokens.length - 1);
                } catch { Alert.alert('Failed', 'Force delete failed.'); }
              } },
            ]);
          } else {
            Alert.alert('Failed', 'Could not delete object.');
          }
        }
      } },
    ]);
  };

  const scanDb = () => {
    Alert.alert('Scan DB references', 'Scan the database for phantom S3 references?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Scan only', onPress: () => doScan(false) },
      { text: 'Scan + cleanup', style: 'destructive', onPress: () => doScan(true) },
    ]);
  };

  const doScan = async (cleanup: boolean) => {
    setScanning(true);
    try {
      const res = await api.post(`/sysadmin/files/scan?cleanup=${cleanup ? 'true' : 'false'}`, {});
      const sum = res.data?.summary || {};
      const miss = res.data?.missing || [];
      Alert.alert(
        'Scan complete',
        `Scanned ${sum.refsScanned ?? 0} refs · ${sum.uniqueKeys ?? 0} unique keys\nMissing refs: ${miss.length}` +
        (cleanup ? `\nRemoved: ${res.data?.cleanupResult?.removedFileUploads ?? 0} fileuploads, ${res.data?.cleanupResult?.removedTaskFiles ?? 0} task files` : ''),
      );
    } catch {
      Alert.alert('Scan failed', 'Could not complete the scan.');
    } finally {
      setScanning(false);
    }
  };

  const shown = filter.trim()
    ? items.filter((i) => i.key.toLowerCase().includes(filter.trim().toLowerCase()))
    : items;

  return (
    <ScreenShell
      title="AWS Media"
      subtitle={`${shown.length}${filter ? ` of ${items.length}` : ''} objects`}
      icon={Cloud}
      right={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity disabled={scanning} onPress={scanDb} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void loadPage(pageTokens.length - 1)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCcw size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      }
    >
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <View style={[st.row, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}>
          <Search size={15} color={colors.mutedForeground} />
          <TextInput placeholder="Filter this page…" placeholderTextColor={colors.mutedForeground} value={filter} onChangeText={setFilter} style={[st.input, { color: colors.foreground }]} />
        </View>
      </View>

      {loading && !items.length ? (
        <Loading />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 80, gap: 8 }}
          ListEmptyComponent={<EmptyState icon={Cloud} title="No objects" message="Bucket page is empty or filter matched nothing." />}
          renderItem={({ item }) => {
            const name = item.key.split('/').pop() || item.key;
            return (
              <Card>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }} numberOfLines={1}>{name}</Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }} numberOfLines={1}>{fmtBytes(item.size)} · {item.storageClass || 'STANDARD'} · {item.lastModified ? new Date(item.lastModified).toLocaleDateString('en-MY') : ''}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <Chip label="Open" onPress={() => void open(item.key)} />
                  <Chip label="Delete" onPress={() => remove(item)} />
                </View>
              </Card>
            );
          }}
          ListFooterComponent={
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10 }}>
              <TouchableOpacity
                disabled={pageTokens.length <= 1}
                onPress={() => {
                  const next = pageTokens.slice(0, -1);
                  setPageTokens(next);
                  setLoading(true);
                  api.get(`/sysadmin/aws-media?limit=100${next[next.length - 1] ? `&continuationToken=${encodeURIComponent(next[next.length - 1]!)}` : ''}`)
                    .then((r) => { setItems(r.data?.items || []); setToken(r.data?.nextContinuationToken || null); })
                    .finally(() => setLoading(false));
                }}
                style={{ opacity: pageTokens.length <= 1 ? 0.35 : 1 }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>‹ Prev</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Page {pageTokens.length}</Text>
              <TouchableOpacity
                disabled={!token}
                onPress={async () => {
                  if (!token) return;
                  setPageTokens((t) => [...t, token]);
                  setLoading(true);
                  try {
                    const r = await api.get(`/sysadmin/aws-media?limit=100&continuationToken=${encodeURIComponent(token)}`);
                    setItems(r.data?.items || []);
                    setToken(r.data?.nextContinuationToken || null);
                  } finally {
                    setLoading(false);
                  }
                }}
                style={{ opacity: token ? 1 : 0.35 }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>Next ›</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </ScreenShell>
  );
}

const st = {
  row: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 42 },
  input: { flex: 1, fontSize: 14, paddingVertical: 0 },
};
