import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
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
      // Fixed endpoint: Uses the standard auth route
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data && response.data.accessToken) {
        // Storing the accessToken and the user object
        await setAuth(response.data.accessToken, response.data.user);
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
    <View className="flex-1 justify-center px-6 bg-background">
      <View className="mb-10 items-center">
        <Text className="text-4xl font-bold text-primary mb-2">Kampungcetak</Text>
        <Text className="text-lg text-foreground/70">Staff Portal</Text>
      </View>
      
      <View className="bg-card p-6 rounded-2xl border border-border">
        <Text className="text-foreground mb-2 font-medium">Email Address</Text>
        <TextInput
          className="bg-background text-foreground border border-border rounded-lg p-3 mb-4"
          placeholder="admin@kampungcetak.com"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text className="text-foreground mb-2 font-medium">Password</Text>
        <TextInput
          className="bg-background text-foreground border border-border rounded-lg p-3 mb-6"
          placeholder="••••••••"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          className="bg-primary rounded-lg p-4 items-center"
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-primary-foreground font-bold text-lg">
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
