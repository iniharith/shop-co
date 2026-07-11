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
    const initAuth = async () => {
      // Safety timeout: if checkAuth hangs for more than 5s, proceed anyway
      const timeout = setTimeout(() => {
        setIsReady(true);
        SplashScreen.hideAsync();
      }, 5000);

      try {
        await checkAuth();
      } catch (e) {
        console.error('Auth check error:', e);
      } finally {
        clearTimeout(timeout);
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)' || segments[0] === 'login';

    if (!token && !inAuthGroup) {
      router.replace('/login');
    } else if (token && inAuthGroup) {
      router.replace('/(app)');
    }
    
    // Hide splash screen after navigation logic is determined and we are ready
    setTimeout(() => {
      SplashScreen.hideAsync().catch(console.warn);
    }, 100);
  }, [token, segments, isReady]);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#0f172a" />
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
