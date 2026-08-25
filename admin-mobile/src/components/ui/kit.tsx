import React from 'react';
import { View, Text, StatusBar, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import FrostedView from '../FrostedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AppBackground from '../AppBackground';
import { useTheme } from '../../context/ThemeContext';

interface ScreenShellProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  back?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function ScreenShell({ title, subtitle, icon: Icon, back = true, right, children, footer }: ScreenShellProps) {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <AppBackground style={styles.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      <FrostedView
        intensity={theme === 'dark' ? 48 : 65}
        tint={theme === 'dark' ? 'dark' : 'light'}
        style={[styles.header, { borderBottomColor: colors.navBorder, backgroundColor: colors.navBg, paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerRow}>
          {back && (
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ArrowLeft size={20} color={colors.foreground} />
            </TouchableOpacity>
          )}
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{title}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
          {Icon ? (
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(231,176,8,0.14)' }]}>
              <Icon size={20} color={colors.primary} />
            </View>
          ) : null}
          {right}
        </View>
      </FrostedView>
      <View style={styles.body}>{children}</View>
      {footer}
    </AppBackground>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  const { theme, colors } = useTheme();
  return (
    <FrostedView
      intensity={theme === 'dark' ? 15 : 60}
      tint={theme === 'dark' ? 'dark' : 'light'}
      style={[cardStyles.card, { borderColor: colors.glassBorder, backgroundColor: colors.glass }, style]}
    >
      {children}
    </FrostedView>
  );
}

export function Chip({ label, active, onPress, color }: { label: string; active?: boolean; onPress?: () => void; color?: string }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        chipStyles.chip,
        { borderColor: active ? colors.primary : colors.glassBorder, backgroundColor: active ? colors.primary : 'transparent' },
      ]}
    >
      {color && !active ? <View style={[chipStyles.dot, { backgroundColor: color }]} /> : null}
      <Text style={[chipStyles.text, { color: active ? '#000000' : colors.mutedForeground }]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  const { colors } = useTheme();
  return (
    <Card style={stat.card}>
      <Text style={[stat.label, { color: colors.mutedForeground }]} numberOfLines={1}>{label}</Text>
      <Text style={[stat.value, { color: colors.foreground }]} numberOfLines={1}>{value ?? '—'}</Text>
      {hint ? <Text style={[stat.hint, { color: colors.mutedForeground }]} numberOfLines={1}>{hint}</Text> : null}
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, message }: { icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; title: string; message?: string }) {
  const { colors } = useTheme();
  return (
    <Card style={empty.card}>
      {Icon ? <Icon size={32} color={colors.mutedForeground} /> : null}
      <Text style={[empty.title, { color: colors.foreground }]}>{title}</Text>
      {message ? <Text style={[empty.message, { color: colors.mutedForeground }]}>{message}</Text> : null}
    </Card>
  );
}

export function Loading() {
  const { colors } = useTheme();
  return <ActivityIndicator size="large" color={colors.primary} style={empty.loading} />;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[sec.title, { color: colors.foreground }]}>{children}</Text>;
}

export function Bar({ ratio, color, height = 8 }: { ratio: number; color: string; height?: number }) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
  return (
    <View style={[bar.track, { height, backgroundColor: colors.secondary, borderRadius: height / 2 }]}>
      <View style={{ width: `${clamped * 100}%`, backgroundColor: color, borderRadius: height / 2, height }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4, marginLeft: -4 },
  headerText: { flex: 1, flexShrink: 1 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
});

const cardStyles = StyleSheet.create({
  card: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, padding: 14 },
});

const chipStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  text: { fontSize: 12, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});

const stat = StyleSheet.create({
  card: { flex: 1, minWidth: '30%', gap: 4 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 18, fontWeight: '800' },
  hint: { fontSize: 10 },
});

const empty = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 28, alignItems: 'center', marginTop: 24, gap: 10 },
  title: { fontSize: 16, fontWeight: '700' },
  message: { fontSize: 13, textAlign: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

const sec = StyleSheet.create({
  title: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
});

const bar = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
});
