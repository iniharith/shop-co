import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Archive } from 'lucide-react-native';
import api from '../../services/api';

export default function HistoryScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/orders');
      const list = res.data?.data || res.data || [];
      setOrders((Array.isArray(list) ? list : []).filter((o: any) => o.isArchived || o.orderStatus === 'DELIVERED' || o.orderStatus === 'CANCELLED'));
    } catch (e) {
      console.error('Failed to fetch history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchHistory(); };

  return (
    <View className="flex-1 bg-background pt-14 px-5">
      <View className="flex-row items-center gap-3 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">History</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="hsl(45, 93%, 47%)" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="hsl(45, 93%, 47%)" />}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text className="text-muted-foreground text-center mt-10">No completed or archived orders yet.</Text>}
          renderItem={({ item }) => (
            <View className="bg-card p-4 rounded-xl mb-3 border border-border flex-row items-center">
              <View className="h-10 w-10 rounded-full bg-secondary items-center justify-center mr-3">
                <Archive size={18} color="#888" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{item._id?.slice(-8).toUpperCase()}</Text>
                <Text className="text-muted-foreground text-xs">{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text className="text-foreground font-bold">RM {item.totalAmount?.toFixed(2)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
