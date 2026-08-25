import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, I18nManager, View, Text, Pressable, StyleSheet } from 'react-native';
import { LayoutDashboard, CheckSquare, ShoppingBag, ImageIcon, Menu } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import RightNavigation from './RightNavigation';
import FrostedView from './FrostedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS: Record<string, { label: string; icon: (color: string, focused: boolean) => React.ReactNode }> = {
  index:    { label: 'Dashboard', icon: (c, f) => <LayoutDashboard size={22} color={c} strokeWidth={f ? 2.5 : 1.8} /> },
  tasks:    { label: 'Tasks',     icon: (c, f) => <CheckSquare     size={22} color={c} strokeWidth={f ? 2.5 : 1.8} /> },
  orders:   { label: 'Orders',    icon: (c, f) => <ShoppingBag     size={22} color={c} strokeWidth={f ? 2.5 : 1.8} /> },
  artworks: { label: 'Artworks',  icon: (c, f) => <ImageIcon       size={22} color={c} strokeWidth={f ? 2.5 : 1.8} /> },
  more:     { label: 'Menu',      icon: (c, f) => <Menu            size={22} color={c} strokeWidth={f ? 2.5 : 1.8} /> },
};

export default function FloatingTabBar({ state, navigation, descriptors }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [barWidth, setBarWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const visibleRoutes = state.routes.filter((route: any) => TABS[route.name]);
  const activeRouteName = state.routes[state.index]?.name;
  const activePosition = Math.max(0, visibleRoutes.findIndex((route: any) => route.name === (TABS[activeRouteName] ? activeRouteName : 'more')));
  const indicatorPosition = I18nManager.isRTL ? -activePosition : activePosition;
  const selectedOffset = useRef(new Animated.Value(0)).current;
  const blobScale = useRef(new Animated.Value(1)).current;
  const capsuleScale = useRef(new Animated.Value(1)).current;
  const tabWidth = barWidth / Math.max(1, visibleRoutes.length);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      selectedOffset.setValue(indicatorPosition * tabWidth);
      return;
    }
    Animated.spring(selectedOffset, {
      toValue: indicatorPosition * tabWidth,
      damping: 18,
      stiffness: 190,
      mass: 0.8,
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  }, [indicatorPosition, reduceMotion, selectedOffset, tabWidth]);

  const setPressed = (pressed: boolean) => {
    const blobTarget = pressed ? 76 / 56 : 1;
    const capsuleTarget = pressed ? 1.025 : 1;
    if (reduceMotion) {
      blobScale.setValue(1);
      capsuleScale.setValue(1);
      return;
    }
    Animated.parallel([
      Animated.spring(blobScale, { toValue: blobTarget, damping: 15, stiffness: 260, mass: 0.7, useNativeDriver: true }),
      Animated.spring(capsuleScale, { toValue: capsuleTarget, damping: 16, stiffness: 240, mass: 0.8, useNativeDriver: true }),
    ]).start();
  };
  
  return (
    <View style={[s.wrapper, { bottom: insets.bottom + 12, left: insets.left + 16, right: insets.right + 16 }]} pointerEvents="box-none">
      <Animated.View style={[s.barShell, { transform: [{ scale: capsuleScale }] }]}>
        <FrostedView
          pointerEvents="none"
          variant="chrome"
          intensity={42}
          style={[s.capsuleGlass, { borderColor: colors.navBorder }]}
        />
        <View style={s.inner} onLayout={event => setBarWidth(event.nativeEvent.layout.width)}>
          {barWidth > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                s.selectionShadow,
                {
                  width: Math.max(0, tabWidth - 8),
                  transform: [
                    { translateX: selectedOffset },
                    { scale: blobScale },
                  ],
                },
              ]}
            >
              <FrostedView pointerEvents="none" variant="selection" intensity={58} style={s.selectionGlass} />
            </Animated.View>
          ) : null}
          {visibleRoutes.map((route: any) => {
            const focused = route.name === (TABS[activeRouteName] ? activeRouteName : 'more');
            const color   = focused ? colors.primary : colors.mutedForeground;
            const tab     = TABS[route.name];
            const options = descriptors[route.key]?.options || {};
            if (!tab) return null;

            return (
              <Pressable
                key={route.key}
                accessibilityRole={route.name === 'more' ? 'button' : 'tab'}
                accessibilityLabel={options.tabBarAccessibilityLabel || tab.label}
                accessibilityState={route.name === 'more' ? { expanded: drawerOpen } : { selected: focused }}
                testID={options.tabBarButtonTestID}
                onPress={() => {
                  if (route.name === 'more') {
                    setDrawerOpen(true);
                    return;
                  }
                  const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
                }}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                onPressIn={() => setPressed(true)}
                onPressOut={() => setPressed(false)}
                hitSlop={4}
                style={s.tab}
              >
                {tab.icon(color, focused)}
                <Text
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.25}
                  style={[s.label, { color, fontWeight: focused ? '700' : '400' }]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
      <RightNavigation visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
  },
  barShell: {
    height: 64,
    borderRadius: 9999,
  },
  capsuleGlass: {
    ...StyleSheet.absoluteFill,
    borderRadius: 9999,
    overflow: 'hidden',
    borderWidth: 1,
  },
  inner: {
    flexDirection: 'row',
    height: 64,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  selectionShadow: {
    position: 'absolute',
    start: 4,
    top: 4,
    height: 56,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    zIndex: 1,
  },
  selectionGlass: {
    flex: 1,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 2,
    zIndex: 2,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
