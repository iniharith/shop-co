import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import api from '../../services/api';
import { ShoppingBag, Package, Truck, CheckCircle, XCircle } from 'lucide-react-native';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      if (response.data?.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
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

  const filteredOrders = filter === 'ALL' ? orders : orders.filter(o => o.orderStatus === filter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PLACED': return <Package size={20} color="#3b82f6" />;
      case 'SHIPPED': return <Truck size={20} color="#f59e0b" />;
      case 'DELIVERED': return <CheckCircle size={20} color="#10b981" />;
      case 'CANCELLED': return <XCircle size={20} color="#ef4444" />;
      default: return <ShoppingBag size={20} color="#888" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLACED': return 'bg-blue-100 text-blue-800';
      case 'SHIPPED': return 'bg-yellow-100 text-yellow-800';
      case 'DELIVERED': return 'bg-emerald-100 text-emerald-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="hsl(45, 93%, 47%)" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-4 pt-4">
      <Text className="text-2xl font-bold text-foreground mb-4">Orders Overview</Text>

      {/* Filter Tabs */}
      <View className="flex-row gap-2 mb-4">
        {['ALL', 'PLACED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-full border ${filter === status ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
          >
            <Text className={`text-xs font-semibold ${filter === status ? 'text-primary' : 'text-muted-foreground'}`}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="hsl(45, 93%, 47%)" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="py-10 items-center justify-center">
            <Text className="text-muted-foreground">No orders found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-card p-4 rounded-xl mb-3 border border-border shadow-sm flex-row items-center">
            <View className="h-12 w-12 rounded-full bg-secondary items-center justify-center mr-4">
              {getStatusIcon(item.orderStatus)}
            </View>
            <View className="flex-1">
              <View className="flex-row justify-between items-start mb-1">
                <Text className="text-foreground font-semibold flex-1 mr-2" numberOfLines={1}>
                  {item._id.substring(item._id.length - 8).toUpperCase()}
                </Text>
                <Text className="text-foreground font-bold">RM {item.totalAmount?.toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-muted-foreground text-xs">
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                <View className={`px-2 py-0.5 rounded-full ${getStatusColor(item.orderStatus).split(' ')[0]}`}>
                  <Text className={`text-[10px] font-bold ${getStatusColor(item.orderStatus).split(' ')[1]}`}>
                    {item.orderStatus}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}
