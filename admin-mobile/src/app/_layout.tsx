import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { token, checkAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      // Safety timeout: if checkAuth hangs for more than 3s, proceed anyway
      const timeout = setTimeout(() => {
        if (!mounted) return;
        setIsReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }, 3000);

      try {
        await checkAuth();
      } catch (e) {
        console.error('Auth check error:', e);
      } finally {
        if (!mounted) return;
        clearTimeout(timeout);
        setIsReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    };
    initAuth();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login';

    if (!token && !inAuthGroup) {
      router.replace('/login');
    } else if (token && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [token, segments, isReady]);

  if (!isReady) {
    // Match background to splash screen color to prevent white flash
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(app)" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
