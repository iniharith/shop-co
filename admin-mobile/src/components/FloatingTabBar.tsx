import React from 'react';
import { View, Pressable, StyleSheet, Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LayoutDashboard, CheckSquare, ShoppingBag, Image as ImageIcon } from 'lucide-react-native';

const ICONS: Record<string, any> = {
  index: LayoutDashboard,
  tasks: CheckSquare,
  orders: ShoppingBag,
  artworks: ImageIcon,
};

const GOLD = 'hsl(45, 93%, 47%)';
const GOLD_FOREGROUND = 'hsl(0, 0%, 9%)';
const MUTED = 'hsl(0, 0%, 58%)';

function TabButton({
  isFocused,
  onPress,
  Icon,
}: {
  isFocused: boolean;
  onPress: () => void;
  Icon: any;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 30,
      bounciness: 9,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(0.88)}
      onPressOut={() => animateTo(1)}
      style={styles.tabButton}
      hitSlop={10}
    >
      <Animated.View
        style={[styles.iconWrap, isFocused && styles.iconWrapActive, { transform: [{ scale }] }]}
      >
        <Icon size={21} color={isFocused ? GOLD_FOREGROUND : MUTED} strokeWidth={isFocused ? 2.5 : 2} />
      </Animated.View>
    </Pressable>
  );
}

export default function FloatingTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: insets.bottom + 14 }]}>
      <View style={styles.shadowWrap}>
        <BlurView intensity={65} tint="dark" style={styles.blur}>
          <View style={styles.tint} />
          <View style={styles.row}>
            {state.routes.map((route: any, index: number) => {
              const isFocused = state.index === index;
              const Icon = ICONS[route.name] || LayoutDashboard;

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

              return <TabButton key={route.key} isFocused={isFocused} onPress={onPress} Icon={Icon} />;
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  shadowWrap: {
    width: '100%',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 14,
  },
  blur: {
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.18)',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    // Android's BlurView falls back to a plain view, so we lean on a darker
    // tint there; iOS gets real native blur underneath this subtle overlay.
    backgroundColor: Platform.OS === 'android' ? 'rgba(8, 8, 8, 0.78)' : 'rgba(8, 8, 8, 0.32)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 64,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: GOLD,
  },
});
