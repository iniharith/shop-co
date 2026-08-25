import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  BarChart3, CalendarRange, Cloud, Bot, Activity,
  ListChecks, Wrench, ImageUp, ScrollText,
} from 'lucide-react-native';
import { ScreenShell, Card } from '../../../components/ui/kit';
import { useTheme } from '../../../context/ThemeContext';import { useAuthStore } from '../../../store/useAuthStore';

const TOOLS = [
  { title: 'Reports', desc: 'Staff & monthly orders', icon: BarChart3, route: '/reports' },
  { title: 'Queue Analytics', desc: 'Bottlenecks & workload', icon: ListChecks, route: '/queue-analytics' },
  { title: 'Schedule', desc: 'Task timeline / gantt', icon: CalendarRange, route: '/schedule' },
  { title: 'Upscale', desc: 'AI image upscaler 2x/4x', icon: ImageUp, route: '/tools/upscale' },
  { title: 'Audit Log', desc: 'Activity trail', icon: ScrollText, route: '/tools/audit-log' },
  { title: 'Server Status', desc: 'System diagnostics', icon: Activity, route: '/server-status' },
  { title: 'AWS Media', desc: 'S3 bucket browser', icon: Cloud, route: '/aws-media' },
  { title: 'Bot Logs', desc: 'Telegram bot console', icon: Bot, route: '/bot-logs' },
];

export default function ToolsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const isAdmin = ['sysadmin', 'admin', 'boss'].includes(String(user?.role || ''));

  const items = TOOLS.filter((t) => !(t.title === 'AWS Media' || t.title === 'Bot Logs') || user?.role === 'sysadmin');

  return (
    <ScreenShell
      title="Tools"
      subtitle="Utilities and admin utilities"
      icon={Wrench}
    >
      <View style={st.grid}>
        {items.map((t) => {
          const Icon = t.icon;
          return (
            <TouchableOpacity key={t.title} style={st.cell} activeOpacity={0.7} onPress={() => router.push(t.route as never)}>
              <Card style={st.card}>
                <View style={st.iconWrap}><Icon size={22} color={colors.primary} strokeWidth={1.8} /></View>
                <Text style={[st.t, { color: colors.foreground }]} numberOfLines={1}>{t.title}</Text>
                <Text style={[st.d, { color: colors.mutedForeground }]} numberOfLines={2}>{t.desc}</Text>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>
      {!isAdmin ? (
        <Text style={[st.note, { color: colors.mutedForeground }]}>Some tools are restricted to admins.</Text>
      ) : null}
    </ScreenShell>
  );
}

const st = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '47%', flexGrow: 1 },
  card: { gap: 8, minHeight: 110 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(59,130,246,0.12)', alignItems: 'center', justifyContent: 'center' },
  t: { fontSize: 14, fontWeight: '700' },
  d: { fontSize: 11, lineHeight: 15 },
  note: { fontSize: 12, marginTop: 16, textAlign: 'center' },
});
