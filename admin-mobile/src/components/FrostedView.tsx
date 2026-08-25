import React, { createContext, useContext, useRef } from 'react';
import { Image, Platform, StyleSheet, View, type View as NativeView } from 'react-native';
import { BlurTargetView, BlurView, type BlurViewProps } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const BlurTargetContext = createContext<React.RefObject<NativeView | null> | null>(null);

type FrostedViewProps = BlurViewProps & {
  variant?: 'surface' | 'chrome' | 'selection';
};

export function BlurRoot({ children }: { children: React.ReactNode }) {
  const targetRef = useRef<NativeView>(null);
  const { colors, customBackground, hasImageBackground } = useTheme();

  const backdrop = hasImageBackground ? (
    <View style={StyleSheet.absoluteFill}>
      <Image source={{ uri: customBackground! }} style={styles.backdropImage} resizeMode="cover" />
      <View style={[StyleSheet.absoluteFill, themeScrim(colors.background)]} />
    </View>
  ) : customBackground ? (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: customBackground }]} />
  ) : (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd, colors.gradientStart]} style={StyleSheet.absoluteFill} />
  );

  return (
    <View style={styles.root}>
      {Platform.OS === 'android' ? (
        <BlurTargetView ref={targetRef} style={StyleSheet.absoluteFill} pointerEvents="none">
          {backdrop}
        </BlurTargetView>
      ) : backdrop}
      <BlurTargetContext.Provider value={Platform.OS === 'android' ? targetRef : null}>
        <View style={styles.content}>{children}</View>
      </BlurTargetContext.Provider>
    </View>
  );
}

export default function FrostedView(props: FrostedViewProps) {
  const blurTarget = useContext(BlurTargetContext);
  const { theme, hasImageBackground } = useTheme();
  const { children, style, variant = 'surface', ...blurProps } = props;
  const requestedIntensity = typeof props.intensity === 'number' ? props.intensity : 50;
  // After Android's reduction factor this maps to Nothing Player's 8-16px
  // capsule blur; its active blob adds roughly another 20px.
  const materialIntensity = variant === 'selection'
    ? 58
    : Math.max(28, Math.min(42, requestedIntensity * 0.68));
  const dark = theme === 'dark';

  const surfaceColor = variant === 'selection'
    ? dark ? 'rgba(0,0,0,0.46)' : 'rgba(0,0,0,0.10)'
    : hasImageBackground
      ? dark ? 'rgba(0,0,0,0.34)' : 'rgba(255,255,255,0.18)'
      : dark ? 'rgba(18,18,18,0.52)' : 'rgba(255,255,255,0.58)';

  return (
    <BlurView
      {...blurProps}
      intensity={materialIntensity}
      tint={dark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
      style={[style, styles.material]}
      blurTarget={blurTarget || undefined}
      blurMethod={blurTarget ? 'dimezisBlurViewSdk31Plus' : 'none'}
      blurReductionFactor={variant === 'selection' ? 2 : 2.6}
    >
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: surfaceColor }]} />
      {variant === 'selection' ? (
        <View
          pointerEvents="none"
          style={[styles.selectionHighlight, { borderColor: dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.62)' }]}
        />
      ) : null}
      {children}
    </BlurView>
  );
}

function themeScrim(background: string) {
  return { backgroundColor: background === '#000000' ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.12)' };
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  backdropImage: { width: '100%', height: '100%' },
  material: { backgroundColor: 'transparent' },
  selectionHighlight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1,
    borderRadius: 9999,
  },
});
