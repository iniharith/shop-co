import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, StyleSheet, StatusBar, TextInput, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppBackground from '../../components/AppBackground';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import socketService from '../../services/socket';
import { Folder, FileText, ImageIcon, Download, ChevronLeft, Search, X, Trash2, Share2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { THEME } from '../../constants/theme';

const CATEGORIES = ['ALL', 'DIGITAL PRINTING', 'DISPLAY ITEM', 'DIGITAL OFFSET', 'PREMIUM GIFT', 'APPAREL/SUBLIMATION', 'FRAME', 'WEDDING PRODUCT', 'FOOD PACKAGING', 'ACRYLIC', 'BUNTING & BANNER', 'PHOTOBOOK', 'MAGNET', 'MENU BOOK', 'ALAMAT RUMAH', 'NO PLAT', 'E-PRINT', 'STICKER', 'WEDDING CARD', 'NOTEBOOK'];
const MAX_FONT_SCALE = 1.15;

export default function ArtworksScreen() {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [groups, setGroups]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<any>(null);
  const [catFilter, setCatFilter]   = useState('ALL');
  const [deleting, setDeleting]     = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/files/folder-group?taskStatuses=PLACED,IN_DESIGN,IN_PROGRESS,PENDING_ARTWORK,ARTWORK_REVIEWED,ARTWORK_REJECTED,PEMBETULAN,DONE_DESIGN');
      setGroups(res.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

    useEffect(() => { 
    fetchGroups(); 
    socketService.connect();
    
    const handleFileUploaded = () => {
      fetchGroups();
    };

    const offUploaded = socketService.on('file_uploaded' as any, handleFileUploaded);

    return () => { offUploaded(); socketService.disconnect(); };
  }, []);

  const filteredGroups = useMemo(() => {
    let result = groups;
    if (catFilter !== 'ALL') result = result.filter(g => g.category === catFilter || g.files?.some((f: any) => f.category === catFilter));
    const q = search.toLowerCase();
    if (q) result = result.filter(g => g.folderName?.toLowerCase().includes(q) || g.orderId?.toLowerCase().includes(q));
    return result;
  }, [groups, search, catFilter]);

  const deleteFile = async (fileId: string) => {
    Alert.alert('Delete File', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeleting(fileId);
        try {
          await api.delete(`/files/${fileId}`);
          if (selected) {
            const updated = { ...selected, files: selected.files.filter((f: any) => f._id !== fileId) };
            setSelected(updated);
          }
          fetchGroups();
        } catch { Alert.alert('Error', 'Failed to delete file'); }
        finally { setDeleting(null); }
      }},
    ]);
  };

  const openFolder = async (folder: any) => {
    setSelected(folder);
    try {
      const params = folder.taskId
        ? `taskId=${encodeURIComponent(folder.taskId)}`
        : `orderId=${encodeURIComponent(folder.orderId || '')}&userId=${encodeURIComponent(folder.userId || '')}`;
      const res = await api.get(`/files/by-folder?${params}`);
      setSelected((current: any) => current?.folderName === folder.folderName ? { ...current, files: res.data?.data || [] } : current);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <AppBackground style={s.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </AppBackground>
  );

  // â”€â”€ Inside a folder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (selected) return (
    <AppBackground style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => setSelected(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <ChevronLeft size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }} maxFontSizeMultiplier={MAX_FONT_SCALE}>Back to Artworks</Text>
        </TouchableOpacity>
        <Text style={s.pageTitle} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{selected.folderName}</Text>
            <Text style={s.pageSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>{selected.files?.length || selected.fileCount || 0} files{selected.orderId ? `  Â·  Order #${selected.orderId.slice(-6)}` : ''}</Text>
      </BlurView>

      <FlatList
        data={selected.files}
        keyExtractor={i => i._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 160, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGroups(); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <BlurView intensity={theme === 'dark' ? 15 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.glassCard, { alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ color: colors.mutedForeground }}>No files in this folder.</Text>
          </BlurView>
        }
        renderItem={({ item }) => {
          const isImage = item.mimetype?.includes('image') || item.originalName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
          const isPdf   = item.mimetype?.includes('pdf') || item.originalName?.toLowerCase().endsWith('.pdf');
          const iconBg  = isPdf ? '#2d1515' : isImage ? '#1e3a5f' : '#1a1a2e';
          const iconClr = isPdf ? '#f87171' : isImage ? '#60a5fa' : '#a78bfa';

          return (
            <BlurView intensity={theme === 'dark' ? 15 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.glassCard, { backgroundColor: colors.glass }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[s.iconBox, { backgroundColor: iconBg }]}>
                  {isImage ? <ImageIcon size={20} color={iconClr} /> : <FileText size={20} color={iconClr} />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{item.originalName || 'file'}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>
                    {item.category || 'N/A'}  Â·  {new Date(item.createdAt).toLocaleDateString('en-MY')}
                  </Text>
                  {item.notes ? <Text style={{ color: colors.warning, fontSize: 11, marginTop: 2 }}>ðŸ“ {item.notes}</Text> : null}
                  {item.adminNotes ? <Text style={{ color: colors.primary, fontSize: 11, marginTop: 2 }}>ðŸ”– {item.adminNotes}</Text> : null}
                </View>
                <View style={{ gap: 8 }}>
                  <TouchableOpacity onPress={() => Linking.openURL(item.path)} style={[s.iconBtn, { backgroundColor: '#1e3a5f' }]}>
                    <Download size={14} color="#60a5fa" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteFile(item._id)} disabled={deleting === item._id} style={[s.iconBtn, { backgroundColor: '#2d1515' }]}>
                    {deleting === item._id ? <ActivityIndicator size="small" color="#f87171" /> : <Trash2 size={14} color="#f87171" />}
                  </TouchableOpacity>
                </View>
              </View>
              {item.tag ? (
                <View style={{ alignSelf: 'flex-start', marginTop: 10 }}>
                  <View style={[s.tagBadge, item.tag === 'draft' ? { backgroundColor: '#3b2a10' } : item.tag === 'for_print' ? { backgroundColor: '#14291a' } : { backgroundColor: '#1a1a1a' }]}>
                    <Text style={{ color: item.tag === 'draft' ? '#fbbf24' : item.tag === 'for_print' ? '#4ade80' : '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>{item.tag}</Text>
                  </View>
                </View>
              ) : null}
            </BlurView>
          );
        }}
      />
    </AppBackground>
  );

  // â”€â”€ Folder list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <AppBackground style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.header, { paddingTop: insets.top + 10 }]}>
        <Text style={s.pageTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Artworks</Text>
        <Text style={s.pageSub} maxFontSizeMultiplier={MAX_FONT_SCALE}>{groups.length} artwork folders</Text>
        <View style={s.searchBox}>
          <Search size={14} color={colors.mutedForeground} />
          <TextInput placeholder="Search folders, orders..." placeholderTextColor={colors.mutedForeground} value={search} onChangeText={setSearch} style={s.searchInput} />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><X size={14} color={colors.mutedForeground} /></TouchableOpacity> : null}
        </View>
      </BlurView>

      {/* Category filter */}
      <FlatList
        horizontal showsHorizontalScrollIndicator={false}
        data={CATEGORIES} keyExtractor={i => i}
        style={{ maxHeight: 44, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 8, alignItems: 'center' }}
        renderItem={({ item }) => {
          const active = catFilter === item;
          return (
            <TouchableOpacity onPress={() => setCatFilter(item)} style={[s.chip, active && { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
              <Text style={[s.chipText, active && { color: colors.primary, fontWeight: '700' }]}>{item === 'ALL' ? 'All' : item}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={filteredGroups}
        keyExtractor={(item, i) => `${item.folderName}-${item.orderId}-${i}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGroups(); }} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 160, gap: 10 }}
        ListEmptyComponent={
          <BlurView intensity={theme === 'dark' ? 15 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.glassCard, { alignItems: 'center', paddingVertical: 40, backgroundColor: colors.glass }]}>
            <Text style={{ color: colors.mutedForeground }} maxFontSizeMultiplier={MAX_FONT_SCALE}>No artwork folders found.</Text>
          </BlurView>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openFolder(item)} activeOpacity={0.75}>
            <BlurView intensity={theme === 'dark' ? 15 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.glassCard, { backgroundColor: colors.glass }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[s.iconBox, { backgroundColor: '#1a1a0a' }]}>
                  <Folder size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1, flexShrink: 1, marginLeft: 12 }}>
                  <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 14 }} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{item.folderName || 'Unassigned'}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {item.fileCount ?? item.files?.length ?? 0} files{item.orderId ? `  Â·  Order #${item.orderId.slice(-6)}` : ''}
                  </Text>
                </View>
                <ChevronLeft size={16} color={colors.mutedForeground} style={{ transform: [{ rotate: '180deg' }] }} />
              </View>
            </BlurView>
          </TouchableOpacity>
        )}
      />
    </AppBackground>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: THEME.glassBorder, marginBottom: 12 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: THEME.foreground, letterSpacing: -0.5 },
  pageSub: { color: THEME.mutedForeground, fontSize: 13, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: THEME.glassBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10, gap: 8 },
  searchInput: { flex: 1, color: THEME.foreground, fontSize: 14, height: 20 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: THEME.glassBorder, backgroundColor: THEME.glass },
  chipText: { color: THEME.mutedForeground, fontSize: 11 },
  glassCard: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
});
