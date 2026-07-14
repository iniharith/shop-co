import React from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

export default function AppBackground({ children, style }: { children: React.ReactNode, style?: any }) {
  const { colors, customBackground } = useTheme();

  if (customBackground) {
    if (customBackground.startsWith('file://')) {
      return (
        <ImageBackground source={{ uri: customBackground }} style={[styles.container, style]} resizeMode="cover">
          {children}
        </ImageBackground>
      );
    }
    
    return (
      <View style={[styles.container, style, { backgroundColor: customBackground }]}>
        {children}
      </View>
    );
  }

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd, colors.gradientStart]} style={[styles.container, style]}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
