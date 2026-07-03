import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { hubItemsForRole } from '../../constants/navItems';

export default function MoreScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const items = hubItemsForRole(user?.role);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View className="flex-1 bg-background pt-14 px-5">
      <Text className="text-2xl font-bold text-foreground mb-1">More</Text>
      <Text className="text-muted-foreground text-sm mb-6">
        Everything else from the admin dashboard, tailored to your role.
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="flex-row flex-wrap gap-3">
          {items.map(({ title, route, icon: Icon }) => (
            <TouchableOpacity
              key={route}
              onPress={() => router.push(route as any)}
              className="w-[47%] bg-card border border-border rounded-xl p-4 items-start gap-3 active:opacity-70"
            >
              <View className="h-10 w-10 rounded-lg bg-primary/10 items-center justify-center">
                <Icon size={20} color="hsl(45, 93%, 47%)" />
              </View>
              <Text className="text-foreground font-semibold">{title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center gap-2 bg-card border border-border rounded-xl p-4 mt-6 active:opacity-70"
        >
          <LogOut size={18} color="#ef4444" />
          <Text className="text-red-500 font-semibold">Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
