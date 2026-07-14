import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppBackground from '../../components/AppBackground';
import { BlurView } from 'expo-blur';
import { THEME } from '../../constants/theme';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Truck, PenTool, Package, MessageSquare, History, Printer, Users, Server, Moon, Sun, UserCircle } from 'lucide-react-native';

const MENU_ITEMS = [
  { id: 'profile', title: 'My Profile', icon: UserCircle, desc: 'Manage account details', route: '/profile' },
  { id: 'tracking', title: 'Tracking', icon: Truck, desc: 'Order & shipping tracking', route: '/tracking' },
  { id: 'production', title: 'Production', icon: PenTool, desc: 'Production pipeline', route: '/production' },
  { id: 'packaging', title: 'Packaging', icon: Package, desc: 'Packaging status', route: '/packaging' },
  { id: 'chat', title: 'Chat', icon: MessageSquare, desc: 'Team communication', route: '/chat' },
  { id: 'history', title: 'History', icon: History, desc: 'Task & order logs', route: '/history' },
  { id: 'print-drafts', title: 'Print Drafts', icon: Printer, desc: 'Design & print layouts', route: '/print-drafts' },
  { id: 'users', title: 'Users', icon: Users, desc: 'User & role management', route: '/users' },
  { id: 'server-status', title: 'Server Status', icon: Server, desc: 'System diagnostics', route: '/server-status' },
];

export default function MoreScreen() {
  const router = useRouter();
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <AppBackground style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Header */}
      <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.header, { borderBottomColor: colors.glassBorder }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.pageTitle, { color: colors.foreground }]}>More Features</Text>
          <Text style={[s.pageSub, { color: colors.mutedForeground }]}>Explore additional management tools</Text>
        </View>
        <TouchableOpacity onPress={toggleTheme} style={s.themeToggle}>
          {theme === 'light' ? <Moon color={colors.foreground} size={22} /> : 
           <Sun color={colors.foreground} size={22} />}
        </TouchableOpacity>
      </BlurView>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.grid}>
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={s.cardWrapper}
                activeOpacity={0.7}
                onPress={() => router.push(item.route as any)}
              >
                <BlurView intensity={15} tint="dark" style={s.card}>
                  <View style={s.iconWrapper}>
                    <Icon size={24} color={THEME.primary} strokeWidth={1.8} />
                  </View>
                  <Text style={s.cardTitle}>{item.title}</Text>
                  <Text style={s.cardDesc} numberOfLines={2}>{item.desc}</Text>
                </BlurView>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </AppBackground>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: THEME.glassBorder, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: THEME.foreground, letterSpacing: -0.5 },
  pageSub: { color: THEME.mutedForeground, fontSize: 13, marginTop: 2 },
  themeToggle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(120,120,120,0.2)', alignItems: 'center', justifyContent: 'center' },
  
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  
  cardWrapper: { width: '47%', aspectRatio: 1 },
  card: { flex: 1, borderRadius: 20, borderWidth: 1, borderColor: THEME.glassBorder, padding: 16, alignItems: 'center', justifyContent: 'center', gap: 12 },
  iconWrapper: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255, 215, 0, 0.1)', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: THEME.foreground, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  cardDesc: { color: THEME.mutedForeground, fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
