import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, StatusBar, Alert, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppBackground from '../../components/AppBackground';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { THEME } from '../../constants/theme';
import { ArrowLeft, User, Mail, Save, Lock, Image as ImageIcon, Palette } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';

export default function ProfileScreen() {
  const { theme, colors, customBackground, setCustomBackground } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/user/profile');
        const profile = res.data?.data || res.data || user;
        setFormData(prev => ({
          ...prev,
          name: profile.name || '',
          email: profile.email || ''
        }));
      } catch (e) {
        console.error(e);
        // Fallback to auth store if fetch fails
        if (user) {
          setFormData(prev => ({
            ...prev,
            name: user.name || '',
            email: user.email || ''
          }));
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = { name: formData.name, email: formData.email };
      if (formData.password) {
        payload.password = formData.password;
      }
      
      const res = await api.put('/user/profile', payload);
      if (res.data?.success) {
        Alert.alert('Success', 'Profile updated successfully');
        if (user) {
           setUser({ ...user, name: formData.name, email: formData.email });
        }
        setFormData(prev => ({ ...prev, password: '' }));
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCustomBackground(result.assets[0].uri);
    }
  };

  const PREDEFINED_COLORS = ['#000000', '#0a0a14', '#1e1e24', '#0f172a', '#171717', '#18181b', '#f8fafc', '#f1f5f9'];

  if (loading) return (
    <AppBackground style={s.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </AppBackground>
  );

  return (
    <AppBackground style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.header, { paddingTop: insets.top + 10 }]}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <ArrowLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.pageTitle}>My Profile</Text>
            <Text style={s.pageSub}>Update your personal details</Text>
          </View>
        </View>
      </BlurView>

      <ScrollView style={s.content} contentContainerStyle={{ paddingBottom: 40, gap: 16 }}>
        <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.formCard}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Personal Details</Text>
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: colors.foreground }]}>Full Name</Text>
            <View style={[s.inputWrapper, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}>
              <User size={18} color={colors.mutedForeground} style={s.inputIcon} />
              <TextInput 
                style={[s.input, { color: colors.foreground }]}
                value={formData.name}
                onChangeText={(val) => setFormData(prev => ({ ...prev, name: val }))}
                placeholder="Your Name"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <View style={s.inputGroup}>
            <Text style={[s.label, { color: colors.foreground }]}>Email Address</Text>
            <View style={[s.inputWrapper, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}>
              <Mail size={18} color={colors.mutedForeground} style={s.inputIcon} />
              <TextInput 
                style={[s.input, { color: colors.foreground }]}
                value={formData.email}
                onChangeText={(val) => setFormData(prev => ({ ...prev, email: val }))}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <View style={s.inputGroup}>
            <Text style={[s.label, { color: colors.foreground }]}>New Password (Optional)</Text>
            <View style={[s.inputWrapper, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}>
              <Lock size={18} color={colors.mutedForeground} style={s.inputIcon} />
              <TextInput 
                style={[s.input, { color: colors.foreground }]}
                value={formData.password}
                onChangeText={(val) => setFormData(prev => ({ ...prev, password: val }))}
                placeholder="Leave blank to keep unchanged"
                secureTextEntry
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <TouchableOpacity style={[s.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#000" /> : (
              <>
                <Save size={18} color="#000" />
                <Text style={s.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </BlurView>

        <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.formCard}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>App Background</Text>
          <Text style={[s.pageSub, { marginTop: -10, marginBottom: 10 }]}>Customize your app experience</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, marginBottom: 16 }}>
            <TouchableOpacity 
              style={[s.colorCircle, !customBackground && s.colorCircleActive, { backgroundColor: colors.gradientStart }]}
              onPress={() => setCustomBackground(null)}
            >
              {!customBackground && <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>Default</Text>}
            </TouchableOpacity>
            
            {PREDEFINED_COLORS.map(c => (
              <TouchableOpacity 
                key={c}
                style={[s.colorCircle, customBackground === c && s.colorCircleActive, { backgroundColor: c }]}
                onPress={() => setCustomBackground(c)}
              />
            ))}
          </ScrollView>

          <TouchableOpacity style={[s.uploadBtn, { borderColor: colors.primary }]} onPress={handlePickImage}>
            <ImageIcon size={18} color={colors.primary} />
            <Text style={[s.uploadBtnText, { color: colors.primary }]}>Upload Custom Image</Text>
          </TouchableOpacity>
          
          {customBackground && customBackground.startsWith('file://') && (
            <View style={s.previewContainer}>
              <Text style={[s.label, { color: colors.foreground, marginBottom: 8 }]}>Image Preview</Text>
              <Image source={{ uri: customBackground }} style={s.previewImage} />
              <TouchableOpacity style={s.removeBgBtn} onPress={() => setCustomBackground(null)}>
                <Text style={s.removeBgText}>Remove Image</Text>
              </TouchableOpacity>
            </View>
          )}
        </BlurView>

      </ScrollView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: THEME.glassBorder, marginBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 8, marginLeft: -8 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: THEME.foreground, letterSpacing: -0.5 },
  pageSub: { color: THEME.mutedForeground, fontSize: 13, marginTop: 2 },
  content: { paddingHorizontal: 16 },
  formCard: { padding: 20, borderRadius: 16, borderWidth: 1, borderColor: THEME.glassBorder, gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, height: 48, paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 10, gap: 8, marginTop: 10 },
  saveBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  colorCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: THEME.glassBorder, alignItems: 'center', justifyContent: 'center' },
  colorCircleActive: { borderWidth: 2, borderColor: '#f0a500' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 10, gap: 8, borderWidth: 1, backgroundColor: 'rgba(240, 165, 0, 0.1)' },
  uploadBtnText: { fontWeight: '600', fontSize: 14 },
  previewContainer: { marginTop: 16 },
  previewImage: { width: '100%', height: 120, borderRadius: 10, resizeMode: 'cover' },
  removeBgBtn: { alignSelf: 'center', marginTop: 12, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 6 },
  removeBgText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
});
