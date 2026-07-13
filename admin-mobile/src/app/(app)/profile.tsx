import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, StatusBar, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { THEME } from '../../constants/theme';
import { ArrowLeft, User, Mail, Save, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';

export default function ProfileScreen() {
  const { theme, colors } = useTheme();
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

  if (loading) return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd, colors.gradientStart]} style={s.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </LinearGradient>
  );

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd, colors.gradientStart]} style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.header}>
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

      <View style={s.content}>
        <BlurView intensity={theme === 'dark' ? 15 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={s.formCard}>
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
      </View>
    </LinearGradient>
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
});
