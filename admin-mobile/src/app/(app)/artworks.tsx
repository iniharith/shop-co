import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, StyleSheet, StatusBar, TextInput, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import api from '../../services/api';
import { Folder, FileText, ImageIcon, Download, ChevronLeft, Search, X, Trash2, Share2 } from 'lucide-react-native';
import { THEME } from '../../constants/theme';

const CATEGORIES = ['ALL', 'DIGITAL PRINTING', 'DISPLAY ITEM', 'DIGITAL OFFSET', 'PREMIUM GIFT', 'APPAREL', 'FRAME', 'WEDDING PRODUCT', 'FOOD PACKAGING'];

export default function ArtworksScreen() {
  const [groups, setGroups]         = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<any>(null);
  const [catFilter, setCatFilter]   = useState('ALL');
  const [deleting, setDeleting]     = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/files/grouped');
      setGroups(res.data?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchGroups(); }, []);

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

  if (loading) return (
    <LinearGradient colors={['#0a0a14', '#100a1e', '#0a0a14']} style={s.center}>
      <ActivityIndicator size="large" color={THEME.primary} />
    </LinearGradient>
  );

  // ── Inside a folder ──────────────────────────────────────
  if (selected) return (
    <LinearGradient colors={['#0a0a14', '#100a1e', '#0a0a14']} style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <BlurView intensity={20} tint="dark" style={s.header}>
        <TouchableOpacity onPress={() => setSelected(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <ChevronLeft size={18} color={THEME.primary} />
          <Text style={{ color: THEME.primary, fontWeight: '600', fontSize: 14 }}>Back to Artworks</Text>
        </TouchableOpacity>
        <Text style={s.pageTitle} numberOfLines={1}>{selected.folderName}</Text>
        <Text style={s.pageSub}>{selected.files?.length || 0} files{selected.orderId ? `  ·  Order #${selected.orderId.slice(-6)}` : ''}</Text>
      </BlurView>

      <FlatList
        data={selected.files}
        keyExtractor={i => i._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 130, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGroups(); }} tintColor={THEME.primary} />}
        ListEmptyComponent={
          <BlurView intensity={15} tint="dark" style={[s.glassCard, { alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ color: THEME.mutedForeground }}>No files in this folder.</Text>
          </BlurView>
        }
        renderItem={({ item }) => {
          const isImage = item.mimetype?.includes('image') || item.originalName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
          const isPdf   = item.mimetype?.includes('pdf') || item.originalName?.toLowerCase().endsWith('.pdf');
          const iconBg  = isPdf ? '#2d1515' : isImage ? '#1e3a5f' : '#1a1a2e';
          const iconClr = isPdf ? '#f87171' : isImage ? '#60a5fa' : '#a78bfa';

          return (
            <BlurView intensity={15} tint="dark" style={s.glassCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[s.iconBox, { backgroundColor: iconBg }]}>
                  {isImage ? <ImageIcon size={20} color={iconClr} /> : <FileText size={20} color={iconClr} />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: THEME.foreground, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{item.originalName}</Text>
                  <Text style={{ color: THEME.mutedForeground, fontSize: 11, marginTop: 2 }}>
                    {item.category || 'N/A'}  ·  {new Date(item.createdAt).toLocaleDateString('en-MY')}
                  </Text>
                  {item.notes ? <Text style={{ color: THEME.warning, fontSize: 11, marginTop: 2 }}>📝 {item.notes}</Text> : null}
                  {item.adminNotes ? <Text style={{ color: THEME.primary, fontSize: 11, marginTop: 2 }}>🔖 {item.adminNotes}</Text> : null}
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
    </LinearGradient>
  );

  // ── Folder list ──────────────────────────────────────────
  return (
    <LinearGradient colors={['#0a0a14', '#100a1e', '#0a0a14']} style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <BlurView intensity={20} tint="dark" style={s.header}>
        <Text style={s.pageTitle}>Artworks</Text>
        <Text style={s.pageSub}>{groups.length} artwork folders</Text>
        <View style={s.searchBox}>
          <Search size={14} color={THEME.mutedForeground} />
          <TextInput placeholder="Search folders, orders..." placeholderTextColor={THEME.mutedForeground} value={search} onChangeText={setSearch} style={s.searchInput} />
          {search ? <TouchableOpacity onPress={() => setSearch('')}><X size={14} color={THEME.mutedForeground} /></TouchableOpacity> : null}
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
            <TouchableOpacity onPress={() => setCatFilter(item)} style={[s.chip, active && { backgroundColor: THEME.primary + '22', borderColor: THEME.primary }]}>
              <Text style={[s.chipText, active && { color: THEME.primary, fontWeight: '700' }]}>{item === 'ALL' ? 'All' : item}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={filteredGroups}
        keyExtractor={(item, i) => `${item.folderName}-${item.orderId}-${i}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchGroups(); }} tintColor={THEME.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 130, gap: 10 }}
        ListEmptyComponent={
          <BlurView intensity={15} tint="dark" style={[s.glassCard, { alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ color: THEME.mutedForeground }}>No artwork folders found.</Text>
          </BlurView>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelected(item)} activeOpacity={0.75}>
            <BlurView intensity={15} tint="dark" style={s.glassCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[s.iconBox, { backgroundColor: '#1a1a0a' }]}>
                  <Folder size={22} color={THEME.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: THEME.foreground, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{item.folderName || 'Unassigned'}</Text>
                  <Text style={{ color: THEME.mutedForeground, fontSize: 12, marginTop: 2 }}>
                    {item.files?.length || 0} files{item.orderId ? `  ·  Order #${item.orderId.slice(-6)}` : ''}
                  </Text>
                </View>
                <ChevronLeft size={16} color={THEME.mutedForeground} style={{ transform: [{ rotate: '180deg' }] }} />
              </View>
            </BlurView>
          </TouchableOpacity>
        )}
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
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: THEME.glassBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10, gap: 8 },
  searchInput: { flex: 1, color: THEME.foreground, fontSize: 14, height: 20 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: THEME.glassBorder, backgroundColor: THEME.glass },
  chipText: { color: THEME.mutedForeground, fontSize: 11 },
  glassCard: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
});
