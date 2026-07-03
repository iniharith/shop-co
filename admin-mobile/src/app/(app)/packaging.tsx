import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, PackageCheck } from 'lucide-react-native';
import api from '../../services/api';
import socketService from '../../services/socket';

// Packaging queue: orders that finished production and need to be packed for shipping.
export default function PackagingScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      const list = res.data?.data || res.data || [];
      setOrders((Array.isArray(list) ? list : []).filter((o: any) => o.orderStatus === 'PROCESSING'));
    } catch (e) {
      console.error('Failed to fetch packaging queue:', e);
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

  const markShipped = async (id: string) => {
    try {
      await api.put(`/orders/${id}`, { status: 'SHIPPED' });
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
        <Text className="text-2xl font-bold text-foreground">Packaging</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="hsl(45, 93%, 47%)" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="hsl(45, 93%, 47%)" />}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text className="text-muted-foreground text-center mt-10">Packaging queue is empty.</Text>}
          renderItem={({ item }) => (
            <View className="bg-card p-4 rounded-xl mb-3 border border-border flex-row items-center">
              <View className="h-10 w-10 rounded-full bg-secondary items-center justify-center mr-3">
                <PackageCheck size={18} color="#06b6d4" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{item._id?.slice(-8).toUpperCase()}</Text>
                <Text className="text-muted-foreground text-xs">Ready to pack & ship</Text>
              </View>
              <TouchableOpacity onPress={() => markShipped(item._id)} className="bg-primary/10 px-3 py-1.5 rounded-lg">
                <Text className="text-primary text-xs font-semibold">Ship</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
