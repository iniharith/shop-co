import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useRouter } from 'expo-router';
import api from '../services/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data && response.data.accessToken) {
        await setAuth(response.data.accessToken, response.data.user, response.data.refreshToken);
        router.replace('/');
      } else {
        Alert.alert('Error', 'Invalid login response');
      }
    } catch (error: any) {
      console.error(error?.response?.data || error);
      Alert.alert('Error', error?.response?.data?.message || 'Invalid credentials or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 md:px-10 bg-background">
      <View className="w-full max-w-sm self-center">
        {/* Header section identical to Web Admin */}
        <View className="flex-col items-center gap-2 mb-6">
          <View className="h-12 items-center justify-center rounded-md mb-2">
            <Image 
              source={require('../../assets/images/icon.png')} 
              className="w-16 h-16 rounded-xl"
              resizeMode="contain" 
            />
          </View>
          <Text className="text-xl font-bold text-foreground">
            Welcome to Kampung Cetak
          </Text>
          <Text className="text-center text-sm text-muted-foreground">
            Login Here
          </Text>
        </View>
        
        {/* Form section mimicking Shadcn LoginForm */}
        <View className="flex-col gap-6">
          <View className="flex-col gap-2">
            <Text className="text-sm font-medium leading-none text-foreground">
              Email
            </Text>
            <TextInput
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground mb-2"
              placeholder="admin@kampungcetak.com"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-sm font-medium leading-none text-foreground">
                Password
              </Text>
              <Text className="text-sm text-muted-foreground font-medium underline">
                Forgot your password?
              </Text>
            </View>
            <TextInput
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="••••••••"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 mt-4 active:opacity-70"
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-primary-foreground font-medium text-sm">
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
