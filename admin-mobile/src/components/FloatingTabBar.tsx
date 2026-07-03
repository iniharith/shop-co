import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LayoutDashboard, CheckSquare, ShoppingBag, ImageIcon } from 'lucide-react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { THEME } from '../constants/theme';

const TABS: Record<string, { label: string; icon: (color: string, focused: boolean) => React.ReactNode }> = {
  index:    { label: 'Dashboard', icon: (c, f) => <LayoutDashboard size={22} color={c} strokeWidth={f ? 2.5 : 1.8} /> },
  tasks:    { label: 'Tasks',     icon: (c, f) => <CheckSquare     size={22} color={c} strokeWidth={f ? 2.5 : 1.8} /> },
  orders:   { label: 'Orders',    icon: (c, f) => <ShoppingBag     size={22} color={c} strokeWidth={f ? 2.5 : 1.8} /> },
  artworks: { label: 'Artworks',  icon: (c, f) => <ImageIcon       size={22} color={c} strokeWidth={f ? 2.5 : 1.8} /> },
};

export default function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={s.wrapper} pointerEvents="box-none">
      <BlurView intensity={Platform.OS === 'ios' ? 80 : 0} tint="dark" style={s.blur}>
        <View style={s.inner}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const color   = focused ? THEME.primary : '#6b7280';
            const tab     = TABS[route.name];
            if (!tab) return null;

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => {
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                }}
                style={s.tab}
                activeOpacity={0.7}
              >
                {/* Gold active pill indicator */}
                <View style={[s.pill, { opacity: focused ? 1 : 0 }]} />
                {tab.icon(color, focused)}
                <Text style={[s.label, { color, fontWeight: focused ? '700' : '400' }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    // KEY: absolute so it floats above ALL content
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 32,
  },
  blur: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    // Android: BlurView doesn't blur natively — use opaque dark glass color
    backgroundColor: Platform.OS === 'android' ? 'rgba(8, 8, 18, 0.94)' : 'transparent',
  },
  inner: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    gap: 3,
  },
  pill: {
    width: 28,
    height: 3,
    borderRadius: 99,
    backgroundColor: THEME.primary,
    position: 'absolute',
    top: -1,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
