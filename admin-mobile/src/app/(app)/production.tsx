import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Printer } from 'lucide-react-native';
import api from '../../services/api';
import socketService from '../../services/socket';

// Production queue: orders that have been PLACED and are awaiting/undergoing printing.
export default function ProductionScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      const list = res.data?.data || res.data || [];
      setOrders((Array.isArray(list) ? list : []).filter((o: any) => o.orderStatus === 'PLACED' || o.orderStatus === 'PROCESSING'));
    } catch (e) {
      console.error('Failed to fetch production queue:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    socketService.connect();
    const off = socketService.on('order_placed', () => fetchOrders());
    return () => { off(); socketService.disconnect(); };
  }, []);
  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  const markProcessing = async (id: string) => {
    try {
      await api.put(`/orders/${id}`, { status: 'PROCESSING' });
      fetchOrders();
    } catch (e) {
      Alert.alert('Error', 'Could not update order.');
    }
  };

  return (
    <View className="flex-1 bg-background pt-14 px-5">
      <View className="flex-row items-center gap-3 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">Production</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="hsl(45, 93%, 47%)" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="hsl(45, 93%, 47%)" />}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text className="text-muted-foreground text-center mt-10">Production queue is empty.</Text>}
          renderItem={({ item }) => (
            <View className="bg-card p-4 rounded-xl mb-3 border border-border flex-row items-center">
              <View className="h-10 w-10 rounded-full bg-secondary items-center justify-center mr-3">
                <Printer size={18} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{item._id?.slice(-8).toUpperCase()}</Text>
                <Text className="text-muted-foreground text-xs">{item.orderStatus}</Text>
              </View>
              {item.orderStatus === 'PLACED' && (
                <TouchableOpacity onPress={() => markProcessing(item._id)} className="bg-primary/10 px-3 py-1.5 rounded-lg">
                  <Text className="text-primary text-xs font-semibold">Start</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}
