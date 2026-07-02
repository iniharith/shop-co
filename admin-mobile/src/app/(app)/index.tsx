import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useSyncStore } from '../../store/useSyncStore';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const { isConnected, orders, initSync, stopSync } = useSyncStore();
  const router = useRouter();

  useEffect(() => {
    initSync();
    return () => {
      stopSync();
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const newOrdersCount = orders.filter(o => o.status === 'pending').length;
  const inProgressCount = orders.filter(o => o.status === 'processing').length;

  return (
    <View className="flex-1 bg-background pt-12 px-5">
      {/* Header Section */}
      <View className="flex-row justify-between items-center mb-8">
        <View>
          <Text className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard</Text>
          <Text className="text-muted-foreground text-sm mt-1 font-medium">
            Welcome back, <Text className="text-primary">{user?.name || 'Admin'}</Text>
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleLogout} 
          className="bg-card border border-border px-4 py-2 rounded-lg active:opacity-70 shadow-sm"
        >
          <Text className="text-foreground text-sm font-medium">Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Status Badge */}
      <View className="flex-row items-center bg-card border border-border self-start px-3 py-1.5 rounded-full mb-6 shadow-sm">
        <View className={`w-2.5 h-2.5 rounded-full mr-2 ${isConnected ? 'bg-primary' : 'bg-destructive'}`} />
        <Text className="text-foreground text-xs font-medium">
          {isConnected ? 'System Connected' : 'Disconnected'}
        </Text>
      </View>

      {/* Metrics Grid */}
      <View className="flex-row justify-between mb-8">
        <View className="flex-1 bg-card border border-border p-5 rounded-xl mr-2 shadow-sm">
          <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">New Orders</Text>
          <Text className="text-4xl font-extrabold text-foreground">{newOrdersCount}</Text>
          <Text className="text-primary text-xs font-medium mt-2">+2 from yesterday</Text>
        </View>
        <View className="flex-1 bg-card border border-border p-5 rounded-xl ml-2 shadow-sm">
          <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">In Progress</Text>
          <Text className="text-4xl font-extrabold text-foreground">{inProgressCount}</Text>
          <Text className="text-muted-foreground text-xs font-medium mt-2">Active tasks</Text>
        </View>
      </View>

      <Text className="text-xl font-bold tracking-tight text-foreground mb-4">Recent Sync Events</Text>
      
      {/* List Container */}
      <ScrollView className="flex-1 bg-card border border-border rounded-xl mb-6 shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <View className="p-8 items-center justify-center">
            <Text className="text-muted-foreground text-center font-medium">No recent orders synced yet.</Text>
            <Text className="text-muted-foreground/50 text-xs text-center mt-1">Orders will appear here automatically.</Text>
          </View>
        ) : (
          orders.slice(0, 10).map((order, index) => (
            <View 
              key={index} 
              className={`flex-row justify-between items-center p-4 ${index !== orders.slice(0, 10).length - 1 ? 'border-b border-border' : ''}`}
            >
              <View>
                <Text className="text-foreground font-semibold">Order #{order.id}</Text>
                <Text className="text-muted-foreground text-xs mt-0.5">{order.item || 'Unknown item'}</Text>
              </View>
              <View className="bg-primary/20 px-2.5 py-1 rounded-md border border-primary/30">
                <Text className="text-primary text-xs font-bold uppercase">{order.status}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
