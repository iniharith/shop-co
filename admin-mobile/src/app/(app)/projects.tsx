import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { FolderKanban, Plus, RefreshCcw, Search } from 'lucide-react-native';
import { ScreenShell, Card, EmptyState, Loading } from '../../components/ui/kit';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const timeAgo = (d?: string) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-MY');
};

export default function ProjectsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [projects, setProjects] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [deferredQ, setDeferredQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDeferredQ(q), 300);
    return () => clearTimeout(id);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/projects${deferredQ.trim() ? `?q=${encodeURIComponent(deferredQ.trim())}` : ''}`);
      setProjects(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e: any) {
      setProjects([]);
      setError(e?.response?.data?.message || 'Could not load projects. Pull to retry.');
    } finally {
      setLoading(false);
    }
  }, [deferredQ]);

  useEffect(() => {
    void load();
  }, [load]);

  const createProject = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res: any = await api.post('/projects', { title: title.trim(), description: description.trim() });
      setCreateOpen(false);
      setTitle('');
      setDescription('');
      const id = res.data?.data?._id;
      if (id) {
        router.push(`/projects/${id}` as never);
        return;
      }
      void load();
    } catch {
      Alert.alert('Failed', 'Could not create the project.');
    } finally {
      setCreating(false);
    }
  };

  const coverFor = (p: any) => {
    const files = p.files || [];
    const cover = files.find((f: any) => f._id === p.coverFileId) || files.find((f: any) => String(f.mimetype || '').startsWith('image/'));
    const url = cover?.previewUrl || cover?.url;
    if (!url) return null;
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=400&output=jpg`;
  };

  return (
    <ScreenShell
      title="Projects"
      subtitle={`${projects.length} projects`}
      icon={FolderKanban}
      right={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => void load()} style={st.iconBtn}>
            <RefreshCcw size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCreateOpen(true)} style={[st.iconBtn, { backgroundColor: colors.primary }]}>
            <Plus size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      }
    >
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <View style={st.rowWrap(colors.glassBorder, colors.secondary)}>
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            placeholder="Search projects…"
            placeholderTextColor={colors.mutedForeground}
            value={q}
            onChangeText={setQ}
            style={[st.input, { color: colors.foreground }]}
          />
        </View>
      </View>

      {loading && !projects.length ? (
        <Loading />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingBottom: 100, gap: 12 }}
          ListEmptyComponent={<EmptyState icon={FolderKanban} title={error ? "Projects unavailable" : "No projects"} message={error || "Tap + to create your first project."} />}
          renderItem={({ item }) => {
            const cover = coverFor(item);
            return (
              <TouchableOpacity activeOpacity={0.75} style={{ width: '48%' }} onPress={() => router.push(`/projects/${item._id}` as never)}>
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                  <View style={{ aspectRatio: 4 / 3, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                    {cover ? (
                      <Image source={{ uri: cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
                    ) : (
                      <FolderKanban size={30} color={colors.mutedForeground} />
                    )}
                  </View>
                  <View style={{ padding: 10, gap: 3 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }} numberOfLines={1}>{item.title || 'Untitled'}</Text>
                    <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                      {(item.files?.length ?? item.fileCount ?? 0)} files · {timeAgo(item.updatedAt)}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
        <View style={st.overlay}>
          <Card style={{ width: '88%', maxWidth: 420, gap: 10 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.foreground }}>New Project</Text>
            <TextInput
              placeholder="Title"
              placeholderTextColor={colors.mutedForeground}
              value={title}
              onChangeText={setTitle}
              style={[st.field, { borderColor: colors.glassBorder, color: colors.foreground, backgroundColor: colors.secondary }]}
            />
            <TextInput
              placeholder="Description (optional)"
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
              multiline
              style={[st.field, { borderColor: colors.glassBorder, color: colors.foreground, backgroundColor: colors.secondary, height: 70, textAlignVertical: 'top' }]}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity onPress={() => setCreateOpen(false)} style={[st.btn, { backgroundColor: colors.secondary }]}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => void createProject()} disabled={!title.trim() || creating} style={[st.btn, { backgroundColor: colors.primary, opacity: !title.trim() || creating ? 0.5 : 1 }]}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>{creating ? 'Creating…' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </Modal>
    </ScreenShell>
  );
}

const st = {
  rowWrap: (borderColor: string, bg: string) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    borderWidth: 1,
    borderColor,
    backgroundColor: bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  }),
  input: { flex: 1 as const, fontSize: 14, paddingVertical: 0 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.12)', alignItems: 'center' as const, justifyContent: 'center' as const },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center' as const, justifyContent: 'center' as const, padding: 20 },
  field: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14 },
  btn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 },
};
