import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, RefreshControl,
  TouchableOpacity, Alert, Modal, ScrollView, StyleSheet,
  StatusBar, TextInput, Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Plus, Trash2, Pencil, X, ChevronLeft, UserCircle, Eye, EyeOff } from 'lucide-react-native';
import api from '../../services/api';
import { THEME } from '../../constants/theme';

const ROLES = ['sysadmin', 'admin', 'boss', 'designer', 'production', 'packaging'];

const ROLE_COLOR: Record<string, string> = {
  sysadmin:   '#ef4444',
  admin:      '#f59e0b',
  boss:       '#f59e0b',
  designer:   '#8b5cf6',
  production: '#3b82f6',
  packaging:  '#06b6d4',
  client:     '#94a3b8',
};

const DICEBEAR_SEEDS = ['Ahmad','Siti','Ali','Aisyah','Muthu','MeiLing','Farid','Nurul','Chong','Devi','Amir','Fatima'];

const EMPTY_FORM = { name: '', email: '', phoneNumber: '', role: 'admin', password: '' };

function AvatarCircle({ user, size = 44 }: { user: any; size?: number }) {
  const color = ROLE_COLOR[user.role] || '#94a3b8';
  const initials = (user.name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  if (user.avatar) {
    return (
      <Image
        source={{ uri: user.avatar }}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: color + '55' }}
      />
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color + '22', borderWidth: 2, borderColor: color + '55',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color, fontSize: size * 0.35, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

export default function UsersScreen() {
  const [users, setUsers]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser]   = useState<any>(null); // null = create mode
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [saving, setSaving]       = useState(false);
  const [showPass, setShowPass]   = useState(false);

  // Avatar picker
  const [pickedAvatar, setPickedAvatar] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      const list = res.data?.data || res.data?.users || res.data || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) { console.error('Failed to fetch users:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchUsers(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchUsers(); };

  const openCreate = () => {
    setEditUser(null);
    setForm({ ...EMPTY_FORM });
    setPickedAvatar(null);
    setShowPass(false);
    setModalOpen(true);
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role || 'admin',
      password: '',
    });
    setPickedAvatar(user.avatar || null);
    setShowPass(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      Alert.alert('Validation', 'Name and email are required.');
      return;
    }
    if (!editUser && !form.password) {
      Alert.alert('Validation', 'Password is required for new users.');
      return;
    }
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (editUser && !payload.password) delete payload.password;
      if (pickedAvatar) payload.avatar = pickedAvatar;

      if (editUser) {
        await api.put(`/admin/users/${editUser._id}`, payload);
        setUsers(prev => prev.map(u => u._id === editUser._id ? { ...u, ...payload } : u));
        Alert.alert('Success', 'User updated.');
      } else {
        const res = await api.post('/admin/users', payload);
        const newUser = res.data?.user || res.data?.data || res.data || { ...payload, _id: Date.now().toString() };
        setUsers(prev => [newUser, ...prev]);
        Alert.alert('Success', 'User created.');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete user', `Remove ${name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/admin/users/${id}`);
            setUsers(prev => prev.filter(u => u._id !== id));
          } catch (e) { Alert.alert('Error', 'Could not delete user.'); }
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={['#0a0a14', '#100a1e', '#0a0a14']} style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <BlurView intensity={20} tint="dark" style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.pageTitle}>Users 🫰</Text>
          <Text style={s.pageSub}>Data Listing And Actions</Text>
        </View>
        <TouchableOpacity onPress={openCreate} style={s.addBtn}>
          <Plus size={16} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Add User</Text>
        </TouchableOpacity>
      </BlurView>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 130, gap: 10 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <BlurView intensity={15} tint="dark" style={[s.glassCard, { alignItems: 'center', paddingVertical: 40 }]}>
              <Text style={{ color: THEME.mutedForeground }}>No users found.</Text>
            </BlurView>
          }
          renderItem={({ item }) => {
            const rc = ROLE_COLOR[item.role] || '#94a3b8';
            return (
              <BlurView intensity={15} tint="dark" style={s.glassCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {/* Avatar */}
                  <AvatarCircle user={item} />

                  {/* Info */}
                  <View style={{ flex: 1 }}>
                    <Text style={s.userName}>{item.name}</Text>
                    <Text style={s.userEmail} numberOfLines={1}>{item.email}</Text>
                    {item.phoneNumber ? (
                      <Text style={s.userPhone}>{item.phoneNumber}</Text>
                    ) : null}
                  </View>

                  {/* Role badge */}
                  <View style={[s.roleBadge, { backgroundColor: rc + '22', borderColor: rc + '55' }]}>
                    <Text style={[s.roleText, { color: rc }]}>{String(item.role).toUpperCase()}</Text>
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => openEdit(item)} style={s.iconBtn}>
                      <Pencil size={15} color={THEME.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item._id, item.name)} style={[s.iconBtn, { borderColor: '#ef444455', backgroundColor: '#ef444418' }]}>
                      <Trash2 size={15} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </BlurView>
            );
          }}
        />
      )}

      {/* ── Create / Edit Modal ── */}
      <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <LinearGradient colors={['#0a0a0a', '#111']} style={{ flex: 1 }}>
          <StatusBar barStyle="light-content" />

          {/* Modal Header */}
          <BlurView intensity={20} tint="dark" style={[s.header, { paddingTop: 54 }]}>
            <Text style={[s.pageTitle, { fontSize: 18 }]}>{editUser ? 'Edit User' : 'Add New User'}</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)} style={s.iconBtn}>
              <X size={18} color={THEME.foreground} />
            </TouchableOpacity>
          </BlurView>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

            {/* Avatar Preview */}
            <View style={{ alignItems: 'center', marginBottom: 4 }}>
              {pickedAvatar ? (
                <Image source={{ uri: pickedAvatar }} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: THEME.primary }} />
              ) : (
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: THEME.glass, borderWidth: 2, borderColor: THEME.glassBorder, alignItems: 'center', justifyContent: 'center' }}>
                  <UserCircle size={44} color={THEME.mutedForeground} />
                </View>
              )}
              {pickedAvatar && (
                <TouchableOpacity onPress={() => setPickedAvatar(null)} style={{ marginTop: 6 }}>
                  <Text style={{ color: THEME.mutedForeground, fontSize: 12 }}>Clear avatar</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* DiceBear Avatar Picker */}
            <BlurView intensity={15} tint="dark" style={[s.glassCard, { padding: 12 }]}>
              <Text style={{ color: THEME.mutedForeground, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Choose a 3D Avatar</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {DICEBEAR_SEEDS.map(seed => {
                  const url = `https://api.dicebear.com/7.x/micah/svg?seed=${seed}`;
                  const isSelected = pickedAvatar === url;
                  return (
                    <TouchableOpacity key={seed} onPress={() => setPickedAvatar(url)}
                      style={{ borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: isSelected ? THEME.primary : 'transparent' }}>
                      <Image source={{ uri: url }} style={{ width: 44, height: 44 }} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </BlurView>

            {/* Fields */}
            {([
              { label: 'Full Name *', key: 'name', placeholder: 'Full Name' },
              { label: 'Email *', key: 'email', placeholder: 'email@example.com', keyboardType: 'email-address' },
              { label: 'Phone Number', key: 'phoneNumber', placeholder: 'e.g. 60123456789', keyboardType: 'phone-pad' },
            ] as any[]).map(({ label, key, placeholder, keyboardType }) => (
              <View key={key}>
                <Text style={s.fieldLabel}>{label}</Text>
                <TextInput
                  style={s.textInput}
                  value={form[key as keyof typeof form]}
                  onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor={THEME.mutedForeground}
                  keyboardType={keyboardType}
                  autoCapitalize="none"
                />
              </View>
            ))}

            {/* Role Picker */}
            <View>
              <Text style={s.fieldLabel}>Role</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ROLES.map(role => {
                  const active = form.role === role;
                  const rc = ROLE_COLOR[role] || '#94a3b8';
                  return (
                    <TouchableOpacity key={role} onPress={() => setForm(f => ({ ...f, role }))}
                      style={[s.roleOption, active && { backgroundColor: rc + '22', borderColor: rc }]}>
                      <Text style={[{ color: THEME.mutedForeground, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }, active && { color: rc }]}>
                        {role}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Password */}
            <View>
              <Text style={s.fieldLabel}>
                Password {editUser && <Text style={{ color: THEME.mutedForeground, fontSize: 11 }}>(leave blank to keep unchanged)</Text>}
              </Text>
              <View style={s.passwordRow}>
                <TextInput
                  style={[s.textInput, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                  value={form.password}
                  onChangeText={v => setForm(f => ({ ...f, password: v }))}
                  placeholder="••••••••"
                  placeholderTextColor={THEME.mutedForeground}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPass(p => !p)} style={s.eyeBtn}>
                  {showPass ? <EyeOff size={18} color={THEME.mutedForeground} /> : <Eye size={18} color={THEME.mutedForeground} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.saveBtn, saving && { opacity: 0.6 }]}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                  {editUser ? 'Save Changes' : 'Create User'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: THEME.glassBorder,
  },
  pageTitle: { fontSize: 22, fontWeight: '800', color: THEME.foreground, flex: 1 },
  pageSub: { color: THEME.mutedForeground, fontSize: 12, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: THEME.primary, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10,
  },
  glassCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 14 },
  userName: { color: THEME.foreground, fontWeight: '700', fontSize: 15 },
  userEmail: { color: THEME.mutedForeground, fontSize: 12, marginTop: 1 },
  userPhone: { color: THEME.mutedForeground, fontSize: 11, marginTop: 1 },
  roleBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  roleText: { fontSize: 10, fontWeight: '700' },
  iconBtn: { padding: 8, borderRadius: 10, borderWidth: 1, borderColor: THEME.glassBorder, backgroundColor: THEME.glass },
  fieldLabel: { color: THEME.foreground, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: THEME.glassBorder,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    color: THEME.foreground, fontSize: 14,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: THEME.glassBorder, borderTopRightRadius: 10, borderBottomRightRadius: 10, padding: 12, borderLeftWidth: 0 },
  roleOption: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: THEME.glassBorder, backgroundColor: THEME.glass },
  saveBtn: { backgroundColor: THEME.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
});
