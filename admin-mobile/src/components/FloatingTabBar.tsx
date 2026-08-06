import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LayoutDashboard, CheckSquare, ShoppingBag, ImageIcon, Menu } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import RightNavigation from './RightNavigation';

const TABS: Record<string, { label: string; icon: (color: string, focused: boolean) => React.ReactNode }> = {
  index:    { label: 'Dashboard', icon: (c, f) => <LayoutDashboard size={22} color={c} strokeWidth={f ? 2.5 : 1.8} /> },
  tasks:    { label: 'Tasks',     icon: (c, f) => <CheckSquare     size={22} color={c} strokeWidth={f ? 2.5 : 1.8} /> },
  orders:   { label: 'Orders',    icon: (c, f) => <ShoppingBag     size={22} color={c} strokeWidth={f ? 2.5 : 1.8} /> },
  artworks: { label: 'Artworks',  icon: (c, f) => <ImageIcon       size={22} color={c} strokeWidth={f ? 2.5 : 1.8} /> },
  more:     { label: 'Menu',      icon: (c, f) => <Menu            size={22} color={c} strokeWidth={f ? 2.5 : 1.8} /> },
};

export default function FloatingTabBar({ state, navigation }: any) {
  const { theme, colors } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  return (
    <View style={s.wrapper} pointerEvents="box-none">
      <View style={[s.blur, { borderColor: colors.glassBorder, backgroundColor: theme === 'dark' ? 'rgb(9, 9, 11)' : '#ffffff' }]}>
        <View style={s.inner}>
          {state.routes.map((route: any, index: number) => {
            const focused = state.index === index;
            const color   = focused ? colors.primary : colors.mutedForeground;
            const tab     = TABS[route.name];
            if (!tab) return null;

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => {
                  if (route.name === 'more') {
                    setDrawerOpen(true);
                    return;
                  }
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                }}
                style={s.tab}
                activeOpacity={0.7}
              >
                {tab.icon(color, focused)}
                <Text style={[s.label, { color, fontWeight: focused ? '700' : '400' }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      <RightNavigation visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  blur: {
    borderRadius: 9999,
    overflow: 'hidden',
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  inner: {
    flexDirection: 'row',
    paddingVertical: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
