import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Share as RNShare, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileText, Folder as FolderIcon, Star, Trash2, Pencil } from 'lucide-react-native';
import { ScreenShell, Card, EmptyState, Loading, Chip } from '../../../components/ui/kit';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../services/api';

const fmtBytes = (n?: number) => {
  if (!n && n !== 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n; let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
};

export default function ProjectDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [promptState, setPromptState] = useState<{ title: string; message: string; onOk: (v: string) => void } | null>(null);
  const [promptText, setPromptText] = useState('');

  const prompt = (title: string, message: string, onOk: (v: string) => void, initial = '') => {
    setPromptText(initial);
    setPromptState({ title, message, onOk });
  };

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data?.data || null);
    } catch {
      Alert.alert('Not found', 'This project could not be loaded.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const crumbs = (() => {
    const chain: { id: string | null; name: string }[] = [{ id: null, name: 'Files' }];
    if (!project) return chain;
    const byId = new Map<string, any>((project.folders || []).map((f: any) => [f._id as string, f]));
    let cur: any = folderId ? byId.get(folderId) : null;
    while (cur) {
      chain.unshift({ id: cur._id, name: cur.name });
      cur = cur.parentFolderId ? byId.get(cur.parentFolderId) : null;
    }
    return chain;
  })();

  const foldersHere = (project?.folders || []).filter((f: any) => (f.parentFolderId ?? null) === folderId);
  const filesHere = (project?.files || []).filter((f: any) => (f.folderId ?? null) === folderId);

  const uploadImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to upload files.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: 8,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      for (const asset of result.assets) {
        const info = await FileSystem.getInfoAsync(asset.uri);
        const size = (info as any).size ?? asset.fileSize ?? 0;
        if (size > 200 * 1024 * 1024) continue;
        const name = asset.fileName || `photo-${Date.now()}.jpg`;
        // 1. presigned url
        const signRes: any = await api.post(`/projects/${id}/upload-url`, {
          filename: name,
          contentType: asset.mimeType || 'image/jpeg',
          size,
        });
        const key = signRes.data?.key || signRes.data?.fileKey;
        const signedUrl = signRes.data?.signedUrl || signRes.data?.url;
        // 2. PUT to S3
        await FileSystem.uploadAsync(signedUrl, asset.uri, {
          httpMethod: 'PUT',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: { 'Content-Type': asset.mimeType || 'image/jpeg' },
        });
        // 3. register file
        await api.post(`/projects/${id}/files`, { key, originalName: name, folderId });
      }
      await load();
    } catch (e) {
      Alert.alert('Upload failed', 'One or more files could not be uploaded.');
    } finally {
      setUploading(false);
    }
  };

  const createFolder = () => {
    prompt('New folder', 'Folder name', async (name) => {
      if (!name?.trim()) return;
      try {
        await api.post(`/projects/${id}/folders`, { name: name.trim(), parentFolderId: folderId });
        await load();
      } catch {
        Alert.alert('Failed', 'Could not create the folder.');
      }
    });
  };

  const renameFile = (file: any) => {
    prompt('Rename file', 'New name', async (name) => {
      if (!name?.trim()) return;
      try {
        await api.patch(`/projects/${id}/files/${file._id}`, { originalName: name.trim() });
        await load();
      } catch { Alert.alert('Failed', 'Rename failed.'); }
    }, file.originalName);
  };

  const deleteFile = (file: any) => {
    Alert.alert('Delete file', `Delete "${file.originalName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/projects/${id}/files/${file._id}`);
          await load();
        } catch { Alert.alert('Failed', 'Delete failed.'); }
      } },
    ]);
  };

  const deleteFolder = (folder: any) => {
    Alert.alert('Delete folder', `Delete "${folder.name}" and everything inside?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/projects/${id}/folders/${folder._id}`);
          if (folderId === folder._id) setFolderId(null);
          await load();
        } catch { Alert.alert('Failed', 'Delete failed.'); }
      } },
    ]);
  };

  const setCover = async (file: any) => {
    try {
      await api.patch(`/projects/${id}`, { coverFileId: file._id });
      await load();
    } catch { Alert.alert('Failed', 'Could not set cover.'); }
  };

  const downloadFile = async (file: any) => {
    setBusy(true);
    try {
      const url = file.url || file.previewUrl;
      if (!url) throw new Error('no url');
      const dest = `${FileSystem.cacheDirectory}${file.originalName || 'download'}`;
      const res = await FileSystem.downloadAsync(url, dest);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(res.uri);
    } catch {
      Alert.alert('Failed', 'Download failed.');
    } finally {
      setBusy(false);
    }
  };

  const shareLink = async () => {
    try {
      const res: any = await api.post(`/projects/${id}/share`, {});
      const slug = res.data?.data?.token;
      const link = slug ? (String(slug).startsWith('http') ? slug : `https://admin.kampungcetak.com/share/project/${slug}`) : null;
      if (!link) throw new Error('no link');
      await RNShare.share({ message: link, title: project?.title ? `Share: ${project.title}` : 'Share project' });
    } catch {
      Alert.alert('Failed', 'Could not create a share link.');
    }
  };

  if (loading) return <ScreenShell title="Project" back><Loading /></ScreenShell>;
  if (!project) return null;

  return (
    <ScreenShell
      title={project.title || 'Project'}
      subtitle={`${(project.files || []).length} files · ${(project.folders || []).length} folders`}
      back
    >
      {/* Breadcrumb */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {crumbs.map((c, i) => (
          <Chip
            key={c.id || 'root'}
            label={c.name + (i < crumbs.length - 1 ? ' ›' : '')}
            active={i === crumbs.length - 1}
            onPress={() => setFolderId(c.id)}
          />
        ))}
      </View>

      {/* Actions */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Chip label={uploading ? 'Uploading…' : '+ Photos'} active onPress={() => void uploadImages()} />
        <Chip label="Folder" onPress={createFolder} />
        <Chip label="Share link" onPress={() => void shareLink()} />
      </View>

      <FlatList
        data={[...foldersHere.map((f: any) => ({ kind: 'folder', data: f })), ...filesHere.map((f: any) => ({ kind: 'file', data: f }))]}
        keyExtractor={(item) => `${item.kind}-${item.data._id}`}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, gap: 8 }}
        ListEmptyComponent={<EmptyState icon={FolderIcon} title="Empty folder" message="Upload photos or create subfolders." />}
        renderItem={({ item }) => {
          if (item.kind === 'folder') {
            return (
              <Card>
                <TouchableOpacity onPress={() => setFolderId(item.data._id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <FolderIcon size={20} color={colors.primary} />
                  <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: colors.foreground }} numberOfLines={1}>{item.data.name}</Text>
                  <TouchableOpacity onPress={() => deleteFolder(item.data)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Trash2 size={16} color={colors.destructive} />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Card>
            );
          }
          const isImage = String(item.data.mimetype || '').startsWith('image/');
          const proxied = item.data.previewUrl || item.data.url;
          return (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {isImage && proxied ? (
                  <Image source={{ uri: proxied }} style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: colors.secondary }} contentFit="cover" />
                ) : (
                  <View style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} color={colors.mutedForeground} />
                  </View>
                )}
                <TouchableOpacity style={{ flex: 1 }} onPress={() => void downloadFile(item.data)} disabled={busy}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }} numberOfLines={1}>{item.data.originalName}</Text>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{fmtBytes(item.data.size)}{isImage ? ' · tap to download' : ''}</Text>
                </TouchableOpacity>
                {isImage ? (
                  <TouchableOpacity onPress={() => void setCover(item.data)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Star size={17} color={project.coverFileId === item.data._id ? colors.warning : colors.mutedForeground} />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={() => renameFile(item.data)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Pencil size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteFile(item.data)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Trash2 size={16} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </Card>
          );
        }}
      />
      <Modal visible={!!promptState} transparent animationType="fade" onRequestClose={() => setPromptState(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Card style={{ width: '100%', maxWidth: 380, gap: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.foreground }}>{promptState?.title}</Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>{promptState?.message}</Text>
            <TextInput
              autoFocus
              value={promptText}
              onChangeText={setPromptText}
              placeholderTextColor={colors.mutedForeground}
              style={{ borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.secondary, color: colors.foreground, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity onPress={() => setPromptState(null)} style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.mutedForeground }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  const cb = promptState?.onOk;
                  setPromptState(null);
                  await cb?.(promptText);
                }}
                style={{ backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </Modal>
    </ScreenShell>
  );
}
