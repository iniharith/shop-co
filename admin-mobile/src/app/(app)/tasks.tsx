import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import api from '../../services/api';

export default function TasksScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      if (res.data) setOrders(res.data.orders || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };
  
  // Group orders loosely by status for the task view
  const pendingTasks = orders.filter(o => o.status === 'pending');
  const activeTasks = orders.filter(o => o.status === 'processing');

  return (
    <View className="flex-1 bg-background pt-12 px-5">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-3xl font-extrabold tracking-tight text-foreground">Tasks</Text>
          <Text className="text-muted-foreground text-sm mt-1 font-medium">
            Manage your operational workflow
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="hsl(45, 93%, 47%)" />}
      >
        
        {/* To Do Section */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">To Do</Text>
            <View className="bg-muted px-2 py-0.5 rounded-full">
              <Text className="text-muted-foreground text-xs font-bold">{pendingTasks.length}</Text>
            </View>
          </View>
          
          {pendingTasks.length === 0 ? (
            <View className="bg-card border border-border p-6 rounded-xl border-dashed items-center justify-center">
              <Text className="text-muted-foreground text-sm font-medium">No pending tasks</Text>
            </View>
          ) : (
            pendingTasks.map((task, idx) => (
              <TouchableOpacity key={idx} className="bg-card border border-border p-4 rounded-xl mb-3 shadow-sm active:opacity-70 flex-row justify-between items-center">
                <View>
                  <Text className="text-foreground font-semibold text-base mb-1">Order #{task.id}</Text>
                  <Text className="text-muted-foreground text-xs">{task.item || 'Unknown item'}</Text>
                </View>
                <View className="w-6 h-6 rounded-full border-2 border-muted flex items-center justify-center" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* In Progress Section */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">In Progress</Text>
            <View className="bg-primary/20 px-2 py-0.5 rounded-full">
              <Text className="text-primary text-xs font-bold">{activeTasks.length}</Text>
            </View>
          </View>
          
          {activeTasks.length === 0 ? (
            <View className="bg-card border border-border p-6 rounded-xl border-dashed items-center justify-center">
              <Text className="text-muted-foreground text-sm font-medium">No active tasks</Text>
            </View>
          ) : (
            activeTasks.map((task, idx) => (
              <TouchableOpacity key={idx} className="bg-card border border-primary/50 p-4 rounded-xl mb-3 shadow-sm active:opacity-70 flex-row justify-between items-center">
                <View>
                  <Text className="text-foreground font-semibold text-base mb-1">Order #{task.id}</Text>
                  <Text className="text-primary text-xs font-medium">Processing...</Text>
                </View>
                <View className="w-6 h-6 rounded-full bg-primary flex items-center justify-center" />
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
}
