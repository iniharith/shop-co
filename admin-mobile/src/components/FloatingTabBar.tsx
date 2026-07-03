import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LayoutDashboard, CheckSquare, ShoppingBag, Image as ImageIcon } from 'lucide-react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const icons: Record<string, (color: string) => React.ReactNode> = {
    index: (color) => <LayoutDashboard size={22} color={color} />,
    tasks: (color) => <CheckSquare size={22} color={color} />,
    orders: (color) => <ShoppingBag size={22} color={color} />,
    artworks: (color) => <ImageIcon size={22} color={color} />,
  };

  const labels: Record<string, string> = {
    index: 'Dashboard',
    tasks: 'Tasks',
    orders: 'Orders',
    artworks: 'Artworks',
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <BlurView intensity={60} tint="dark" style={styles.blurContainer}>
        <View style={styles.inner}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const color = isFocused ? '#f59e0b' : '#94a3b8';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.tab}
                activeOpacity={0.7}
              >
                {isFocused && <View style={styles.activePill} />}
                {icons[route.name]?.(color)}
                <Text style={[styles.label, { color }]}>
                  {labels[route.name]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 28,
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 100,
  },
  blurContainer: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: Platform.OS === 'android' ? 'rgba(15, 23, 42, 0.88)' : 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  inner: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 4,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: -4,
    width: 32,
    height: 3,
    backgroundColor: '#f59e0b',
    borderRadius: 99,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
