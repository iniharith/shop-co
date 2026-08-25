import React, { useState } from 'react';
import { Alert, Image, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ImageUp } from 'lucide-react-native';
import { ScreenShell, Card, Chip, Loading } from '../../../components/ui/kit';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../services/api';

export default function UpscaleScreen() {
  const { colors } = useTheme();
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [scale, setScale] = useState<'2' | '4'>('2');
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAfter, setShowAfter] = useState(true);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to pick an image.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (!res.canceled && res.assets[0]) {
      if ((res.assets[0].fileSize ?? 0) > 10 * 1024 * 1024) {
        Alert.alert('Too large', 'Server accepts images up to 10MB.');
        return;
      }
      setImage(res.assets[0]);
      setResult(null);
    }
  };

  const upscale = async () => {
    if (!image) return;
    setBusy(true);
    try {
      const form = new FormData();
      // @ts-expect-error RN FormData file part
      form.append('image', { uri: image.uri, name: image.fileName || 'upload.jpg', type: image.mimeType || 'image/jpeg' });
      form.append('scale', scale);
      const res: any = await api.post('/tools/upscale', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });
      setResult(res.data?.image || null);
      setShowAfter(true);
      if (!res.data?.image) Alert.alert('Failed', 'Upscale returned no image.');
    } catch (e: any) {
      Alert.alert('Failed', e?.response?.status === 403 ? 'Admins only.' : 'Could not upscale this image.');
    } finally {
      setBusy(false);
    }
  };

  const shareResult = async () => {
    if (!result) return;
    try {
      const base64 = result.split(',')[1];
      if (!base64) throw new Error('Invalid image');
      const uri = `${FileSystem.cacheDirectory}upscaled-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png' });
      }
    } catch {
      Alert.alert('Failed', 'Could not share the upscaled image.');
    }
  };

  return (
    <ScreenShell title="Upscale" subtitle="2x / 4x image upscaler" icon={ImageUp}>
      <View style={{ padding: 16, gap: 14 }}>
        {!result ? (
          <>
            <TouchableOpacity onPress={() => void pick()} activeOpacity={0.8}>
              <Card style={{ alignItems: 'center', justifyContent: 'center', minHeight: 220, borderStyle: 'dashed', borderWidth: 2, borderColor: colors.glassBorder }}>
                {image ? (
                  <View style={{ width: '100%', alignItems: 'center', gap: 8 }}>
                    <Image source={{ uri: image.uri }} style={{ width: '90%', aspectRatio: (image.width ?? 4) / (image.height ?? 3), borderRadius: 12 }} resizeMode="contain" />
                    <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Tap to change image</Text>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', gap: 10 }}>
                    <ImageUp size={34} color={colors.primary} />
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}>Pick an image</Text>
                    <Text style={{ fontSize: 11, color: colors.mutedForeground }}>JPEG / PNG / WebP · max 10MB</Text>
                  </View>
                )}
              </Card>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Chip label="2x" active={scale === '2'} onPress={() => setScale('2')} />
              <Chip label="4x" active={scale === '4'} onPress={() => setScale('4')} />
            </View>

            {image ? (
              <TouchableOpacity
                onPress={() => void upscale()}
                disabled={busy}
                style={{ backgroundColor: colors.primary, borderRadius: 25, height: 48, alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}
              >
                {busy ? <Loading /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Upscale {scale}x</Text>}
              </TouchableOpacity>
            ) : null}
          </>
        ) : (
          <>
            <Card style={{ padding: 6 }}>
              <Image source={{ uri: showAfter ? result : image!.uri }} style={{ width: '100%', aspectRatio: (image!.width ?? 4) / (image!.height ?? 3), borderRadius: 10 }} resizeMode="contain" />
              <Text style={{ textAlign: 'center', fontSize: 11, color: colors.mutedForeground, paddingBottom: 6 }}>
                {showAfter ? `After · ${scale}x` : 'Before'}
              </Text>
            </Card>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Chip label={showAfter ? 'Show before' : 'Show after'} onPress={() => setShowAfter((v) => !v)} />
              <Chip label="Share / Save" onPress={() => void shareResult()} />
              <Chip
                label="Start over"
                onPress={() => { setImage(null); setResult(null); }}
                active
              />
            </View>
          </>
        )}
        {busy ? <Loading /> : null}
      </View>
    </ScreenShell>
  );
}
