import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Truck, RefreshCw, MessageCircle } from 'lucide-react-native';
import api from '../../services/api';

export default function TrackingScreen() {
  const router = useRouter();
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchParcels = async () => {
    try {
      const res = await api.get('/parcels');
      const list = res.data?.data || res.data?.parcels || res.data || [];
      setParcels(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to fetch parcels:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchParcels(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchParcels(); };

  const syncTracking = async (id: string) => {
    setSyncingId(id);
    try {
      await api.put(`/parcels/${id}/track`);
      await fetchParcels();
    } catch (e) {
      Alert.alert('Error', 'Could not sync tracking status.');
    } finally {
      setSyncingId(null);
    }
  };

  const sendWhatsApp = async (id: string) => {
    try {
      await api.post(`/parcels/${id}/whatsapp`);
      Alert.alert('Sent', 'WhatsApp notification sent to the customer.');
    } catch (e) {
      Alert.alert('Error', 'Could not send WhatsApp notification.');
    }
  };

  const statusColor: Record<string, string> = {
    delivered: '#22c55e', in_transit: '#3b82f6', pending: '#eab308', failed: '#ef4444',
  };

  return (
    <View className="flex-1 bg-background pt-14 px-5">
      <View className="flex-row items-center gap-3 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">Tracking</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="hsl(45, 93%, 47%)" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={parcels}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="hsl(45, 93%, 47%)" />}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text className="text-muted-foreground text-center mt-10">No parcels found.</Text>}
          renderItem={({ item }) => (
            <View className="bg-card p-4 rounded-xl mb-3 border border-border">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Truck size={16} color={statusColor[item.status] || '#94a3b8'} />
                  <Text className="text-foreground font-semibold">{item.trackingNumber || item._id?.slice(-8).toUpperCase()}</Text>
                </View>
                <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor[item.status] || '#94a3b8'}22` }}>
                  <Text className="text-[10px] font-bold" style={{ color: statusColor[item.status] || '#94a3b8' }}>
                    {String(item.status || 'unknown').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text className="text-muted-foreground text-xs mb-3">{item.recipientName || item.customerName || 'Unknown recipient'}</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => syncTracking(item._id)}
                  disabled={syncingId === item._id}
                  className="flex-1 flex-row items-center justify-center gap-1.5 bg-secondary py-2 rounded-lg"
                >
                  <RefreshCw size={14} color="#fafafa" />
                  <Text className="text-foreground text-xs font-semibold">{syncingId === item._id ? 'Syncing…' : 'Sync'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => sendWhatsApp(item._id)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 bg-primary/10 py-2 rounded-lg"
                >
                  <MessageCircle size={14} color="hsl(45, 93%, 47%)" />
                  <Text className="text-primary text-xs font-semibold">WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
