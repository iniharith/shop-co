import React, { useEffect, useRef } from 'react';
import { Animated, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FrostedView from './FrostedView';
import { X, LogOut, Moon, Sun } from 'lucide-react-native';
import { usePathname, useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { mobileNavGroups } from '../constants/navItems';
import { useAuthStore } from '../store/useAuthStore';

interface RightNavigationProps {
  visible: boolean;
  onClose: () => void;
}

export default function RightNavigation({ visible, onClose }: RightNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, colors, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const role = user?.role;

  const translateX = useRef(new Animated.Value(320)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateX.setValue(320);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, translateX, backdropOpacity]);

  const navigate = (route: string) => {
    onClose();
    router.navigate(route as any);
  };

  const signOut = async () => {
    onClose();
    await logout();
    router.replace('/login');
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity style={s.backdropFill} activeOpacity={1} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[s.drawer, { transform: [{ translateX }] }]}>
          <FrostedView
            intensity={82}
            tint={theme === 'dark' ? 'dark' : 'light'}
            style={[s.drawerBody, { backgroundColor: theme === 'dark' ? 'rgba(7,7,7,0.72)' : 'rgba(255,255,255,0.64)', borderColor: colors.navBorder }]}
          >
            <View style={[s.header, { borderBottomColor: colors.glassBorder }]}>
              <View style={s.profile}>
                <View style={[s.avatar, { backgroundColor: '#000', borderColor: colors.primary }]}>
                  <Image source={require('../../assets/images/icon.png')} style={s.brandLogo} resizeMode="contain" />
                </View>
                <View style={s.profileText}>
                  <Text style={[s.name, { color: colors.foreground }]} numberOfLines={1}>{user?.name || 'Admin'}</Text>
                  <Text style={[s.role, { color: colors.mutedForeground }]} numberOfLines={1}>{role || 'Staff'}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={s.iconButton}><X size={20} color={colors.foreground} /></TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
              {mobileNavGroups(role).map(group => (
                <View key={group.title} style={s.group}>
                  <Text style={[s.groupTitle, { color: colors.mutedForeground }]}>{group.title}</Text>
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const active = pathname === item.route;
                    return (
                      <TouchableOpacity
                        key={item.route}
                        onPress={() => navigate(item.route)}
                        style={[s.item, active && { backgroundColor: colors.primary + '20' }]}
                      >
                        <Icon size={19} color={active ? colors.primary : colors.mutedForeground} />
                        <Text style={[s.itemText, { color: active ? colors.primary : colors.foreground }]}>{item.title}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>

            <View style={[s.footer, { borderTopColor: colors.glassBorder }]}>
              <TouchableOpacity onPress={toggleTheme} style={s.footerButton}>
                {theme === 'dark' ? <Sun size={18} color={colors.foreground} /> : <Moon size={18} color={colors.foreground} />}
                <Text style={[s.itemText, { color: colors.foreground }]}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={signOut} style={s.footerButton}>
                <LogOut size={18} color={colors.destructive} />
                <Text style={[s.itemText, { color: colors.destructive }]}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </FrostedView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)' },
  backdropFill: { flex: 1 },
  drawer: { width: '84%', maxWidth: 380, height: '100%' },
  drawerBody: { flex: 1, borderLeftWidth: 1, paddingTop: 48 },
  header: { paddingHorizontal: 18, paddingBottom: 18, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profile: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  brandLogo: { width: 36, height: 36 },
  profileText: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700' },
  role: { fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  iconButton: { padding: 8 },
  content: { padding: 18, paddingBottom: 28 },
  group: { marginBottom: 22 },
  groupTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  item: { minHeight: 44, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 3 },
  itemText: { fontSize: 14, fontWeight: '600' },
  footer: { borderTopWidth: 1, padding: 14, gap: 4 },
  footerButton: { minHeight: 42, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
