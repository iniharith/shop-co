import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FrostedView from './FrostedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronLeft, FileText, Folder, PackageCheck, PenTool } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AppBackground from './AppBackground';
import api from '../services/api';
import socketService from '../services/socket';
import { useTheme } from '../context/ThemeContext';

const MAX_FONT_SCALE = 1.15;

interface FolderQueueProps {
  title: string;
  subtitle: string;
  statuses: string[];
  nextStatus: string | ((folder: any) => string);
  nextLabel: string | ((folder: any) => string);
  mode: 'production' | 'packaging';
}

export default function FolderQueue({ title, subtitle, statuses, nextStatus, nextLabel, mode }: FolderQueueProps) {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [folders, setFolders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusKey = statuses.join(',');

  const fetchFolders = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get(`/files/folder-group?taskStatuses=${statusKey}`);
      setFolders(res.data?.data || []);
    } catch (requestError: any) {
      console.error(requestError);
      setError(requestError?.response?.data?.message || 'Could not load this queue. Tap retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusKey]);

  useEffect(() => {
    void fetchFolders();
    socketService.connect();
    const off = socketService.on('task_updated' as any, fetchFolders);
    return () => { off(); socketService.disconnect(); };
  }, [fetchFolders]);

  const openFolder = async (folder: any) => {
    setSelected(folder);
    try {
      const query = folder.taskId
        ? `taskId=${encodeURIComponent(folder.taskId)}`
        : `orderId=${encodeURIComponent(folder.orderId || '')}&userId=${encodeURIComponent(folder.userId || '')}`;
      const res = await api.get(`/files/by-folder?${query}`);
      setSelected((current: any) => current?.folderName === folder.folderName ? { ...current, files: res.data?.data || [] } : current);
    } catch (error) {
      console.error(error);
      Alert.alert('Open failed', 'Could not load the files in this folder.');
    }
  };

  const moveForward = () => {
    if (!selected) return;
    const targetStatus = typeof nextStatus === 'function' ? nextStatus(selected) : nextStatus;
    const actionLabel = typeof nextLabel === 'function' ? nextLabel(selected) : nextLabel;
    Alert.alert(actionLabel, `Move ${selected.folderName} to ${targetStatus.replace(/_/g, ' ')}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: actionLabel, onPress: async () => {
        setUpdating(true);
        try {
          if (selected.taskId) await api.put(`/tasks/${selected.taskId}`, { status: targetStatus });
          else if (selected.orderId) await api.put(`/orders/${selected.orderId}`, { status: targetStatus });
          setSelected(null);
          await fetchFolders();
        } catch {
          Alert.alert('Update failed', 'Could not update this workflow item.');
        } finally {
          setUpdating(false);
        }
      } },
    ]);
  };

  if (loading) return <AppBackground style={s.center}><ActivityIndicator size="large" color={colors.primary} /></AppBackground>;

  const QueueIcon = mode === 'production' ? PenTool : PackageCheck;
  if (selected) {
    return (
      <AppBackground style={s.screen}>
        <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <FrostedView intensity={theme === 'dark' ? 48 : 65} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.header, { backgroundColor: colors.navBg, borderBottomColor: colors.navBorder, paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => setSelected(null)} style={s.back}><ChevronLeft size={20} color={colors.primary} /><Text style={[s.backText, { color: colors.primary }]} maxFontSizeMultiplier={MAX_FONT_SCALE}>Back to {title}</Text></TouchableOpacity>
          <Text style={[s.title, { color: colors.foreground }]} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{selected.folderName}</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{selected.files?.length || selected.fileCount || 0} files</Text>
        </FrostedView>
        <FlatList
          data={selected.files || []}
          keyExtractor={(file, index) => file._id || String(index)}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 170 }]}
          renderItem={({ item }) => <FrostedView intensity={theme === 'dark' ? 48 : 70} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.card, { borderColor: colors.glassBorder, backgroundColor: colors.glass }]}><FileText size={18} color={colors.primary} /><View style={s.fileText}><Text style={[s.fileName, { color: colors.foreground }]} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.originalName || item.filename || 'File'}</Text><Text style={[s.fileMeta, { color: colors.mutedForeground }]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.mimetype || 'Attachment'}</Text></View></FrostedView>}
          ListEmptyComponent={<Text style={[s.empty, { color: colors.mutedForeground }]} maxFontSizeMultiplier={MAX_FONT_SCALE}>No files in this folder.</Text>}
        />
        <TouchableOpacity disabled={updating} onPress={moveForward} style={[s.action, { backgroundColor: colors.primary, bottom: insets.bottom + 96 }]}>{updating ? <ActivityIndicator color="#000" /> : <Text style={s.actionText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{typeof nextLabel === 'function' ? nextLabel(selected) : nextLabel}</Text>}</TouchableOpacity>
      </AppBackground>
    );
  }

  return (
    <AppBackground style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <FrostedView intensity={theme === 'dark' ? 48 : 65} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.header, { backgroundColor: colors.navBg, borderBottomColor: colors.navBorder, paddingTop: insets.top + 10 }]}>
        <View style={s.headerRow}><TouchableOpacity onPress={() => router.back()}><ArrowLeft size={20} color={colors.foreground} /></TouchableOpacity><View style={s.headerText}><Text style={[s.title, { color: colors.foreground }]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{title}</Text><Text style={[s.subtitle, { color: colors.mutedForeground }]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{subtitle}</Text></View><QueueIcon size={22} color={colors.primary} /></View>
      </FrostedView>
      <FlatList
        data={folders}
        keyExtractor={(folder, index) => `${folder.taskId || folder.orderId || folder.folderName}-${index}`}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 170 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void fetchFolders(); }} tintColor={colors.primary} />}
        renderItem={({ item }) => <TouchableOpacity onPress={() => openFolder(item)}><FrostedView intensity={theme === 'dark' ? 48 : 70} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.card, { borderColor: colors.glassBorder, backgroundColor: colors.glass }]}><Folder size={22} color={colors.primary} /><View style={s.fileText}><Text style={[s.fileName, { color: colors.foreground }]} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.folderName}</Text><Text style={[s.fileMeta, { color: colors.mutedForeground }]} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.fileCount ?? item.files?.length ?? 0} files · {item.orderStatus || 'In progress'}</Text></View></FrostedView></TouchableOpacity>}
        ListEmptyComponent={error ? <TouchableOpacity onPress={() => void fetchFolders()}><Text style={[s.empty, { color: colors.destructive }]} maxFontSizeMultiplier={MAX_FONT_SCALE}>{error}{'\n'}Tap to retry</Text></TouchableOpacity> : <Text style={[s.empty, { color: colors.mutedForeground }]} maxFontSizeMultiplier={MAX_FONT_SCALE}>No {title.toLowerCase()} folders found.</Text>}
      />
    </AppBackground>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 }, headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 }, headerText: { flex: 1, flexShrink: 1 }, back: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 }, backText: { fontSize: 13, fontWeight: '700' }, title: { fontSize: 21, fontWeight: '800' }, subtitle: { fontSize: 12, marginTop: 3 },
  list: { padding: 16, gap: 10 }, card: { minHeight: 68, padding: 14, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' }, fileText: { flex: 1, flexShrink: 1 }, fileName: { fontSize: 14, fontWeight: '700' }, fileMeta: { fontSize: 11, marginTop: 3 }, empty: { textAlign: 'center', marginTop: 48 }, action: { position: 'absolute', left: 16, right: 16, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' }, actionText: { color: '#000', fontSize: 14, fontWeight: '800' },
});
