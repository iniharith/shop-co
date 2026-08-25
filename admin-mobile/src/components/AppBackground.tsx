import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function AppBackground({ children, style }: { children: React.ReactNode, style?: any }) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
