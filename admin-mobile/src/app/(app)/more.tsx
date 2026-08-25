import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, ChevronRight } from 'lucide-react-native';
import { hubItemsForRole, mobileNavGroups } from '../../constants/navItems';
import { useAuthStore } from '../../store/useAuthStore';
import AppBackground from '../../components/AppBackground';
import FrostedView from '../../components/FrostedView';

export default function MoreScreen() {
  const router = useRouter();
  const { theme, toggleTheme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const groups = mobileNavGroups(user?.role);

  return (
    <AppBackground style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Header */}
      <FrostedView
        intensity={theme === 'dark' ? 48 : 65}
        tint={theme === 'dark' ? 'dark' : 'light'}
        style={[s.header, { borderBottomColor: colors.glassBorder, paddingTop: insets.top + 10, backgroundColor: colors.navBg }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[s.pageTitle, { color: colors.foreground }]}>More Features</Text>
          <Text style={[s.pageSub, { color: colors.mutedForeground }]}>Everything the website has — in your pocket</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={s.themeToggle}>
          {theme === 'light' ? <Moon color={colors.foreground} size={22} /> : <Sun color={colors.foreground} size={22} />}
        </TouchableOpacity>
      </FrostedView>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {groups.map((group) => (
          <View key={group.title} style={{ marginBottom: 18 }}>
            <Text style={[s.groupTitle, { color: colors.mutedForeground }]}>{group.title}</Text>
            <View style={{ gap: 8 }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity key={item.title} activeOpacity={0.7} onPress={() => router.push(item.route as never)}>
                    <FrostedView
                      intensity={theme === 'dark' ? 15 : 60}
                      tint={theme === 'dark' ? 'dark' : 'light'}
                      style={[s.row, { borderColor: colors.glassBorder, backgroundColor: colors.glass }]}
                    >
                      <View style={[s.iconWrapper, { backgroundColor: 'rgba(59,130,246,0.12)' }]}>
                        <Icon size={20} color={colors.primary} strokeWidth={1.9} />
                      </View>
                      <Text style={[s.rowTitle, { color: colors.foreground }]}>{item.title}</Text>
                      <ChevronRight size={16} color={colors.mutedForeground} />
                    </FrostedView>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: THEME.glassBorder, flexDirection: 'row', alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  pageSub: { fontSize: 13, marginTop: 2 },
  themeToggle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(120,120,120,0.2)', alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 140 },
  groupTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },

  row: { minHeight: 58, borderRadius: 16, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
});
