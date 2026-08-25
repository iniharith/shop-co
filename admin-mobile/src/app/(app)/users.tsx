import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, Mail, Pencil, Phone, RefreshCw, Save, Shield, UserCircle, Users, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBackground from '../../components/AppBackground';
import FrostedView from '../../components/FrostedView';
import api from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../store/useAuthStore';

const EDIT_ROLES = ['admin', 'sysadmin', 'boss'];
const STAFF_ROLES = ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging', 'awapparel'];

export default function UsersScreen() {
  const { theme, colors } = useTheme();
  const currentUser = useAuthStore(state => state.user);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const canEdit = EDIT_ROLES.includes(currentUser?.role);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phoneNumber: '', role: '', password: '' });

  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get('/admin/users');
      setUsers(Array.isArray(response.data?.users) ? response.data.users : []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Could not load staff accounts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  const openUser = (account: any) => {
    setSelected(account);
    setEditing(false);
    setForm({
      name: account.name || '',
      email: account.email || '',
      phoneNumber: account.phoneNumber || '',
      role: account.role || 'designer',
      password: '',
    });
  };

  const closeUser = () => {
    if (saving) return;
    setSelected(null);
    setEditing(false);
  };

  const cancelEdit = () => {
    if (!selected) return;
    setForm({ name: selected.name || '', email: selected.email || '', phoneNumber: selected.phoneNumber || '', role: selected.role || 'designer', password: '' });
    setEditing(false);
  };

  const saveUser = async () => {
    if (!selected?._id || !form.name.trim() || !form.email.trim()) {
      Alert.alert('Missing details', 'Name and email are required.');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim(),
        role: form.role,
      };
      if (form.password.trim()) payload.password = form.password;
      const response = await api.put(`/admin/users/${selected._id}`, payload);
      const returnedUser = response.data?.user || { ...selected, ...payload };
      const { password: _password, ...updated } = returnedUser;
      setUsers(current => current.map(account => account._id === updated._id ? { ...account, ...updated } : account));
      setSelected(updated);
      setForm(current => ({ ...current, password: '' }));
      setEditing(false);
    } catch (requestError: any) {
      Alert.alert('Update failed', requestError?.response?.data?.message || 'Could not update this user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppBackground style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <FrostedView intensity={78} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.header, { borderBottomColor: colors.navBorder, paddingTop: insets.top + 10 }]}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><ArrowLeft size={20} color={colors.foreground} /></TouchableOpacity>
          <View style={{ flex: 1 }}><Text style={[s.pageTitle, { color: colors.foreground }]}>User Management</Text><Text style={[s.pageSub, { color: colors.mutedForeground }]}>{users.length} staff accounts · {canEdit ? 'Tap to view or edit' : 'Tap to view'}</Text></View>
          <TouchableOpacity disabled={refreshing} onPress={() => { setRefreshing(true); void fetchUsers(); }} style={[s.headerAction, { backgroundColor: colors.secondary }]}>{refreshing ? <ActivityIndicator size="small" color={colors.primary} /> : <RefreshCw size={18} color={colors.primary} />}</TouchableOpacity>
        </View>
      </FrostedView>

      {loading ? <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View> : (
        <FlatList
          data={users}
          keyExtractor={(item, index) => item._id || String(index)}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.primary} onRefresh={() => { setRefreshing(true); void fetchUsers(); }} />}
          ListEmptyComponent={<FrostedView intensity={58} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.emptyCard, { borderColor: colors.glassBorder }]}><UserCircle size={34} color={colors.mutedForeground} /><Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '800' }}>{error ? 'Users unavailable' : 'No staff accounts found'}</Text><Text style={{ color: error ? colors.destructive : colors.mutedForeground, textAlign: 'center' }}>{error || 'Staff members will appear here.'}</Text>{error ? <TouchableOpacity onPress={() => void fetchUsers()} style={[s.retryButton, { backgroundColor: colors.primary }]}><Text style={s.retryText}>Try Again</Text></TouchableOpacity> : null}</FrostedView>}
          renderItem={({ item }) => {
            const roleColor = colorForRole(item.role, colors.primary);
            return <TouchableOpacity activeOpacity={0.78} onPress={() => openUser(item)}><FrostedView intensity={58} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.card, { borderColor: colors.glassBorder }]}><View style={[s.avatar, { backgroundColor: `${roleColor}24`, borderColor: `${roleColor}66` }]}><Text style={{ color: roleColor, fontSize: 16, fontWeight: '900' }}>{String(item.name || item.email || 'U').slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={[s.cardTitle, { color: colors.foreground }]} numberOfLines={1}>{item.name || 'System User'}</Text><Text style={[s.cardDesc, { color: colors.mutedForeground }]} numberOfLines={1}>{item.email || 'No email'}</Text></View><View style={[s.roleBadge, { borderColor: `${roleColor}55`, backgroundColor: `${roleColor}16` }]}><Text style={{ color: roleColor, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>{item.role || 'staff'}</Text></View></FrostedView></TouchableOpacity>;
          }}
        />
      )}

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={closeUser}>
        <View style={s.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeUser} />
          <FrostedView intensity={90} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.sheet, { borderColor: colors.glassBorder, paddingBottom: insets.bottom + 18 }]}>
            <View style={s.sheetHandle} />
            <View style={s.sheetHeader}>
              <View style={[s.avatarLarge, { backgroundColor: `${colorForRole(selected?.role, colors.primary)}22`, borderColor: colorForRole(selected?.role, colors.primary) }]}><Text style={{ color: colorForRole(selected?.role, colors.primary), fontSize: 24, fontWeight: '900' }}>{String(selected?.name || selected?.email || 'U').slice(0, 1).toUpperCase()}</Text></View>
              <View style={{ flex: 1 }}><Text style={[s.sheetTitle, { color: colors.foreground }]} numberOfLines={1}>{selected?.name || 'User details'}</Text><Text style={[s.pageSub, { color: colors.mutedForeground }]}>{editing ? 'Editing staff account' : 'Staff account details'}</Text></View>
              {canEdit && !editing ? <TouchableOpacity onPress={() => setEditing(true)} style={[s.editButton, { backgroundColor: colors.primary }]}><Pencil size={14} color="#000" /><Text style={s.editButtonText}>Edit</Text></TouchableOpacity> : null}
              <TouchableOpacity onPress={closeUser} style={s.closeButton}><X size={20} color={colors.foreground} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.sheetContent} keyboardShouldPersistTaps="handled">
              {editing ? (
                <>
                  <Field label="Full Name" icon={<UserCircle size={16} color={colors.mutedForeground} />} value={form.name} onChangeText={(value: string) => setForm(current => ({ ...current, name: value }))} placeholder="Staff name" colors={colors} />
                  <Field label="Email Address" icon={<Mail size={16} color={colors.mutedForeground} />} value={form.email} onChangeText={(value: string) => setForm(current => ({ ...current, email: value }))} placeholder="staff@example.com" colors={colors} keyboardType="email-address" autoCapitalize="none" />
                  <Field label="Phone Number" icon={<Phone size={16} color={colors.mutedForeground} />} value={form.phoneNumber} onChangeText={(value: string) => setForm(current => ({ ...current, phoneNumber: value }))} placeholder="Optional" colors={colors} keyboardType="phone-pad" />
                  <Field label="New Password" icon={<Shield size={16} color={colors.mutedForeground} />} value={form.password} onChangeText={(value: string) => setForm(current => ({ ...current, password: value }))} placeholder="Leave blank to keep current" colors={colors} secureTextEntry />
                  <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>ROLE</Text>
                  <View style={s.roleGrid}>{STAFF_ROLES.map(role => { const active = form.role === role; return <TouchableOpacity key={role} onPress={() => setForm(current => ({ ...current, role }))} style={[s.roleChoice, { borderColor: active ? colors.primary : colors.glassBorder, backgroundColor: active ? `${colors.primary}20` : colors.secondary }]}><Text style={{ color: active ? colors.primary : colors.foreground, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>{role}</Text></TouchableOpacity>; })}</View>
                  <View style={s.formActions}><TouchableOpacity disabled={saving} onPress={cancelEdit} style={[s.cancelButton, { borderColor: colors.glassBorder }]}><Text style={{ color: colors.mutedForeground, fontWeight: '800' }}>Cancel</Text></TouchableOpacity><TouchableOpacity disabled={saving} onPress={() => void saveUser()} style={[s.saveButton, { backgroundColor: colors.primary }]}>{saving ? <ActivityIndicator color="#000" /> : <><Save size={16} color="#000" /><Text style={s.saveButtonText}>Save Changes</Text></>}</TouchableOpacity></View>
                </>
              ) : (
                <View style={{ gap: 10 }}>
                  <DetailRow icon={<Mail size={17} color={colors.primary} />} label="EMAIL" value={selected?.email || 'Not set'} colors={colors} />
                  <DetailRow icon={<Phone size={17} color={colors.primary} />} label="PHONE" value={selected?.phoneNumber || 'Not set'} colors={colors} />
                  <DetailRow icon={<Shield size={17} color={colors.primary} />} label="ROLE" value={String(selected?.role || 'Staff').replace(/_/g, ' ')} colors={colors} />
                  <DetailRow icon={<Users size={17} color={colors.primary} />} label="ACCOUNT" value={selected?.verified === false ? 'Unverified' : 'Verified'} colors={colors} />
                  {!canEdit ? <View style={[s.readOnlyNotice, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}><Shield size={16} color={colors.mutedForeground} /><Text style={{ flex: 1, color: colors.mutedForeground, fontSize: 11, lineHeight: 17 }}>Only Admin, System Admin, or Boss accounts can edit staff users.</Text></View> : null}
                </View>
              )}
            </ScrollView>
          </FrostedView>
        </View>
      </Modal>
    </AppBackground>
  );
}

function Field({ label, icon, colors, ...inputProps }: any) {
  return <View style={{ gap: 6 }}><Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>{label.toUpperCase()}</Text><View style={[s.inputShell, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}>{icon}<TextInput {...inputProps} placeholderTextColor={colors.mutedForeground} style={[s.input, { color: colors.foreground }]} /></View></View>;
}

function DetailRow({ icon, label, value, colors }: any) {
  return <View style={[s.detailRow, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}>{icon}<View style={{ flex: 1 }}><Text style={{ color: colors.mutedForeground, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }}>{label}</Text><Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '700', marginTop: 4, textTransform: label === 'ROLE' ? 'capitalize' : 'none' }}>{value}</Text></View></View>;
}

function colorForRole(role: string, fallback: string) {
  if (role === 'sysadmin') return '#a78bfa';
  if (role === 'boss') return '#f59e0b';
  if (role === 'admin') return fallback;
  if (role === 'designer') return '#60a5fa';
  if (role === 'production') return '#22c55e';
  if (role === 'packaging') return '#fb7185';
  return '#94a3b8';
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  backBtn: { width: 36, height: 36, marginLeft: -8, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  pageSub: { fontSize: 12, marginTop: 2 },
  headerAction: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 120, gap: 10, flexGrow: 1 },
  card: { minHeight: 72, borderRadius: 16, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, overflow: 'hidden' },
  avatar: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontWeight: '800', fontSize: 14 },
  cardDesc: { fontSize: 11, marginTop: 3 },
  roleBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 },
  emptyCard: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: 'center', gap: 10, marginTop: 40, overflow: 'hidden' },
  retryButton: { height: 38, borderRadius: 19, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#000', fontSize: 12, fontWeight: '900' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)' },
  sheet: { maxHeight: '88%', minHeight: '54%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, paddingHorizontal: 18, overflow: 'hidden' },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'center', marginTop: 9, marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  avatarLarge: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: '900' },
  editButton: { height: 36, borderRadius: 18, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 },
  editButtonText: { color: '#000', fontSize: 11, fontWeight: '900' },
  closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center' },
  sheetContent: { paddingBottom: 16, gap: 12 },
  fieldLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginLeft: 3 },
  inputShell: { minHeight: 48, borderRadius: 11, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  input: { flex: 1, fontSize: 13, paddingVertical: 11 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  roleChoice: { minHeight: 36, borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  formActions: { flexDirection: 'row', gap: 9, marginTop: 6 },
  cancelButton: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveButton: { flex: 1.4, height: 46, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  saveButtonText: { color: '#000', fontWeight: '900', fontSize: 12 },
  detailRow: { minHeight: 62, borderRadius: 13, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  readOnlyNotice: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 2 },
});
