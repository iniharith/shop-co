import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ChevronLeft, FileText, Shirt } from 'lucide-react-native';
import { ScreenShell, Card, EmptyState, Loading, Chip } from '../../components/ui/kit';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const TABS = [
  { key: 'IN_PRODUCTION', label: 'Printing', next: 'PRINT_AWB', nextLabel: 'Send to Print AWB' },
  { key: 'PRINT_AWB', label: 'Print AWB', next: 'DONE_PRINTING', nextLabel: 'Complete Print AWB' },
  { key: 'PACKAGING', label: 'Done Print', next: 'SHIPPED', nextLabel: 'Mark as Shipped' },
];

export default function SublimationScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState(TABS[0]);
  const [folders, setFolders] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get(`/files/folder-group?taskStatuses=IN_PRODUCTION,PRINT_AWB,PACKAGING${q.trim() ? `&q=${encodeURIComponent(q.trim())}` : ''}`);
      const rows = Array.isArray(res.data?.data) ? res.data.data : [];
      setFolders(rows.filter((folder: any) => {
        const categories = Array.isArray(folder.categories) ? folder.categories : [folder.category];
        return categories.some((category: unknown) => ['APPAREL', 'APPAREL/SUBLIMATION'].includes(String(category || '').toUpperCase()));
      }));
    } catch (requestError: any) {
      setFolders([]);
      setError(requestError?.response?.data?.message || 'Could not load sublimation folders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  const openFolder = async (folder: any) => {
    setSelected(folder);
    try {
      const query = folder.taskId
        ? `taskId=${encodeURIComponent(folder.taskId)}`
        : `orderId=${encodeURIComponent(folder.orderId || '')}&userId=${encodeURIComponent(folder.userId || '')}`;
      const res = await api.get(`/files/by-folder?${query}`);
      setSelected((cur: any) => (cur?.folderName === folder.folderName ? { ...cur, files: res.data?.data || [] } : cur));
    } catch {
      setSelected(null);
    }
  };

  const advance = async () => {
    if (!selected || !tab.next) return;
    setMoving(true);
    try {
      if (selected.taskId) await api.put(`/tasks/${selected.taskId}`, { status: tab.next });
      else if (selected.orderId) await api.put(`/orders/${selected.orderId}`, { status: tab.next });
      setSelected(null);
      await load();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Could not update this folder.');
    } finally {
      setMoving(false);
    }
  };

  const downloadFile = async (file: any) => {
    try {
      const url = file.url || file.previewUrl;
      if (!url) return;
      const dest = `${FileSystem.cacheDirectory}${file.originalName || file.filename || 'file'}`;
      const res = await FileSystem.downloadAsync(url, dest);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(res.uri);
    } catch {
      // ignore
    }
  };

  if (selected) {
    return (
      <ScreenShell title={selected.folderName} subtitle={`${selected.files?.length ?? selected.fileCount ?? 0} files`} back>
        <FlatList
          data={selected.files || []}
          keyExtractor={(f: any, i) => f._id || String(i)}
          contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 8 }}
          ListEmptyComponent={<EmptyState icon={FileText} title="No files" />}
          renderItem={({ item }: any) => (
            <TouchableOpacity onPress={() => void downloadFile(item)}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <FileText size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }} numberOfLines={1}>
                      {item.originalName || item.filename || 'File'}
                    </Text>
                    {!!item.reviewed && <Text style={{ fontSize: 10, color: colors.success }}>Reviewed ✓</Text>}
                  </View>
                  <Chip label="Download" />
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
        {tab.next ? (
          <TouchableOpacity
            disabled={moving}
            onPress={() => void advance()}
            style={{
              position: 'absolute', left: 16, right: 16, bottom: 28, height: 50,
              borderRadius: 25, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{moving ? 'Moving…' : tab.nextLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Sublimation" subtitle="Apparel artwork pipeline" icon={Shirt}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', gap: 8 }}>
        {TABS.map((t) => <Chip key={t.key} label={t.label} active={tab.key === t.key} onPress={() => setTab(t)} />)}
      </View>
      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={folders.filter((f) => (f.orderStatus || f.taskStatus || '').toUpperCase().includes(tab.key))}
          keyExtractor={(f: any, i) => `${f.taskId || f.orderId || i}`}
          contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 120, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.primary} />}
          ListEmptyComponent={<TouchableOpacity onPress={() => void load()}><EmptyState icon={Shirt} title={error ? "Sublimation unavailable" : `Nothing in ${tab.label}`} message={error ? `${error} Tap to retry.` : "New apparel folders will appear here."} /></TouchableOpacity>}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => void openFolder(item)}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Shirt size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }} numberOfLines={1}>{item.folderName}</Text>
                    <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                      {item.fileCount ?? 0} files · {(item.orderStatus || item.taskStatus || '').replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <ChevronLeft size={16} color={colors.mutedForeground} style={{ transform: [{ rotate: '180deg' }] }} />
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenShell>
  );
}
