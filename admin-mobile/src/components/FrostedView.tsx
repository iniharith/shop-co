import React, { createContext, useContext, useRef } from 'react';
import { Image, Platform, StyleSheet, View, type View as NativeView } from 'react-native';
import { BlurTargetView, BlurView, type BlurViewProps } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const BlurTargetContext = createContext<React.RefObject<NativeView | null> | null>(null);

export function BlurRoot({ children }: { children: React.ReactNode }) {
  const targetRef = useRef<NativeView>(null);
  const { colors, customBackground, hasImageBackground } = useTheme();

  const backdrop = hasImageBackground ? (
    <View style={StyleSheet.absoluteFill}>
      <Image source={{ uri: customBackground! }} style={styles.backdropImage} resizeMode="cover" />
      <LinearGradient colors={['rgba(0,0,0,0.10)', 'rgba(0,0,0,0.34)', 'rgba(0,0,0,0.20)']} style={StyleSheet.absoluteFill} />
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
          <View style={[styles.glow, styles.topGlow, { backgroundColor: colors.primary }]} />
          <View style={[styles.glow, styles.bottomGlow, { backgroundColor: colors.mutedForeground }]} />
        </BlurTargetView>
      ) : backdrop}
      <BlurTargetContext.Provider value={Platform.OS === 'android' ? targetRef : null}>
        <View style={styles.content}>{children}</View>
      </BlurTargetContext.Provider>
    </View>
  );
}

export default function FrostedView(props: BlurViewProps) {
  const blurTarget = useContext(BlurTargetContext);
  const { theme, hasImageBackground } = useTheme();
  const { children, style, ...blurProps } = props;
  const requestedIntensity = typeof props.intensity === 'number' ? props.intensity : 50;
  return (
    <BlurView
      {...blurProps}
      intensity={hasImageBackground ? Math.max(requestedIntensity, 82) : requestedIntensity}
      style={[style, hasImageBackground && styles.imageMaterial]}
      blurTarget={blurTarget || undefined}
      blurMethod={blurTarget ? 'dimezisBlurViewSdk31Plus' : 'none'}
      blurReductionFactor={hasImageBackground ? 1.55 : 2.2}
    >
      <LinearGradient
        pointerEvents="none"
        colors={hasImageBackground ? ['rgba(255,255,255,0.20)', 'rgba(255,255,255,0.045)', 'rgba(0,0,0,0.12)'] : theme === 'dark' ? ['rgba(255,255,255,0.11)', 'rgba(255,255,255,0.025)', 'rgba(231,176,8,0.035)'] : ['rgba(255,255,255,0.52)', 'rgba(255,255,255,0.17)', 'rgba(231,176,8,0.055)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {hasImageBackground ? <View pointerEvents="none" style={styles.refractionOrb} /> : null}
      <View pointerEvents="none" style={[styles.edgeHighlight, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.8)' }]} />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  backdropImage: { width: '100%', height: '100%' },
  imageMaterial: { backgroundColor: 'rgba(8,8,10,0.36)', borderColor: 'rgba(255,255,255,0.22)' },
  glow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.19 },
  topGlow: { top: -105, right: -80 },
  bottomGlow: { bottom: -135, left: -95, opacity: 0.11 },
  edgeHighlight: { position: 'absolute', top: 0, left: 16, right: 16, height: StyleSheet.hairlineWidth },
  refractionOrb: { position: 'absolute', width: 76, height: 76, borderRadius: 38, top: -42, right: -20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.035)' },
});
