import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, UserCircle, LogOut, Mail, ShieldCheck } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View className="flex-1 bg-background pt-14 px-5">
      <View className="flex-row items-center gap-3 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">Profile</Text>
      </View>

      <View className="items-center mb-8">
        <View className="h-20 w-20 rounded-full bg-secondary items-center justify-center mb-3">
          <UserCircle size={40} color="#888" />
        </View>
        <Text className="text-foreground text-lg font-bold">{user?.name || 'Admin'}</Text>
        <Text className="text-muted-foreground text-sm">{user?.email}</Text>
      </View>

      <View className="bg-card border border-border rounded-xl divide-y divide-border">
        <View className="flex-row items-center gap-3 p-4">
          <Mail size={16} color="#888" />
          <Text className="text-foreground text-sm flex-1">{user?.email || '—'}</Text>
        </View>
        <View className="flex-row items-center gap-3 p-4">
          <ShieldCheck size={16} color="#888" />
          <Text className="text-foreground text-sm flex-1">{String(user?.role || 'unknown').toUpperCase()}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        className="flex-row items-center justify-center gap-2 bg-card border border-border rounded-xl p-4 mt-6"
      >
        <LogOut size={18} color="#ef4444" />
        <Text className="text-red-500 font-semibold">Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
