import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { useRouter } from 'expo-router';
import { Box, Truck, FileText, CircleCheckBig, CircleAlert, RefreshCw } from 'lucide-react-native';
import api from '../../services/api';

export default function DashboardScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [orders, setOrders] = useState([]);
  const [parcelStats, setParcelStats] = useState({ total: 0, pending: 0, in_transit: 0, delivered: 0, failed: 0 });
  const [fileStats, setFileStats] = useState({ totalFiles: 0, totalSize: 0, pendingReview: 0 });

  const fetchData = async () => {
    try {
      const [orderRes, parcelRes, fileRes] = await Promise.all([
        api.get('/admin/order'),
        api.get('/admin/parcel/stats'),
        api.get('/admin/file/stats').catch(() => ({ data: { totalFiles: 0, totalSize: 0, pendingReview: 0 } }))
      ]);
      
      if (orderRes.data && orderRes.data.orders) setOrders(orderRes.data.orders);
      if (parcelRes.data) setParcelStats(parcelRes.data);
      if (fileRes.data) setFileStats(fileRes.data);
      
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const totalOrders = orders.length;

  return (
    <View className="flex-1 bg-background pt-12 px-5">
      {/* Header Section */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-2xl font-bold tracking-tight text-foreground">Hi, Welcome back 👋</Text>
          <Text className="text-muted-foreground text-sm mt-1 font-medium">
            <Text className="text-primary">{user?.name || 'Admin'}</Text>
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleLogout} 
          className="bg-card border border-border px-4 py-2 rounded-md active:opacity-70 shadow-sm"
        >
          <Text className="text-foreground text-sm font-medium">Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="hsl(45, 93%, 47%)" />}
      >
        {loading && !refreshing ? (
          <View className="py-10 items-center justify-center">
            <ActivityIndicator size="small" color="hsl(45, 93%, 47%)" />
            <Text className="text-muted-foreground mt-4 text-sm">Loading dashboard...</Text>
          </View>
        ) : (
          <View className="gap-4 pb-10">
            {/* Top 4 Cards Grid (2x2) */}
            <View className="flex-row gap-4">
              <View className="flex-1 bg-card border border-border p-4 rounded-xl shadow-sm">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-foreground text-sm font-medium">Total Orders</Text>
                  <Box size={16} color="#888" />
                </View>
                <Text className="text-2xl font-bold text-foreground mb-1">{totalOrders}</Text>
                <Text className="text-xs text-muted-foreground">Total orders placed</Text>
              </View>

              <View className="flex-1 bg-card border border-border p-4 rounded-xl shadow-sm">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-foreground text-sm font-medium">Active Deliveries</Text>
                  <Truck size={16} color="#888" />
                </View>
                <Text className="text-2xl font-bold text-foreground mb-1">{parcelStats.in_transit + parcelStats.pending}</Text>
                <Text className="text-xs text-muted-foreground">{parcelStats.in_transit} in transit, {parcelStats.pending} pending</Text>
              </View>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1 bg-card border border-border p-4 rounded-xl shadow-sm">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-foreground text-sm font-medium">Total Artworks</Text>
                  <FileText size={16} color="#888" />
                </View>
                <Text className="text-2xl font-bold text-foreground mb-1">{fileStats.totalFiles}</Text>
                <Text className="text-xs text-muted-foreground">{(fileStats.totalSize / 1024 / 1024).toFixed(2)} MB total storage used</Text>
              </View>

              <View className="flex-1 bg-card border border-border p-4 rounded-xl shadow-sm">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-foreground text-sm font-medium">Pending Reviews</Text>
                  <CircleAlert size={16} color="#888" />
                </View>
                <Text className="text-2xl font-bold text-foreground mb-1">{fileStats.pendingReview}</Text>
                <Text className="text-xs text-muted-foreground">Artworks needing review</Text>
              </View>
            </View>

            {/* Delivery Status Overview */}
            <View className="bg-card border border-border p-5 rounded-xl shadow-sm mt-2">
              <Text className="text-lg font-bold text-foreground mb-1">Delivery Status Overview</Text>
              <Text className="text-sm text-muted-foreground mb-5">All parcels grouped by current status</Text>
              
              <View className="flex-col gap-4">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <CircleCheckBig size={16} color="#22c55e" />
                    <Text className="text-foreground text-sm font-medium">Delivered</Text>
                  </View>
                  <Text className="text-foreground font-semibold">{parcelStats.delivered || 0}</Text>
                </View>
                
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <Truck size={16} color="#3b82f6" />
                    <Text className="text-foreground text-sm font-medium">In Transit</Text>
                  </View>
                  <Text className="text-foreground font-semibold">{parcelStats.in_transit || 0}</Text>
                </View>
                
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <Box size={16} color="#eab308" />
                    <Text className="text-foreground text-sm font-medium">Pending</Text>
                  </View>
                  <Text className="text-foreground font-semibold">{parcelStats.pending || 0}</Text>
                </View>
                
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <CircleAlert size={16} color="#ef4444" />
                    <Text className="text-foreground text-sm font-medium">Failed</Text>
                  </View>
                  <Text className="text-foreground font-semibold">{parcelStats.failed || 0}</Text>
                </View>
              </View>
            </View>

            {/* Recent Activity */}
            <View className="bg-card border border-border p-5 rounded-xl shadow-sm mt-2">
              <Text className="text-lg font-bold text-foreground mb-1">Recent Activity</Text>
              <Text className="text-sm text-muted-foreground mb-4">Check the latest deliveries or artwork uploads.</Text>
              <Text className="text-sm text-muted-foreground">More details coming soon or view directly in Tracking / Artworks pages.</Text>
            </View>

          </View>
        )}
      </ScrollView>
    </View>
  );
}
