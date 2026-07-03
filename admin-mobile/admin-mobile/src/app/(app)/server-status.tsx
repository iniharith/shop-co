import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Server, CheckCircle2, XCircle } from 'lucide-react-native';
import api, { API_URL } from '../../services/api';

export default function ServerStatusScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'up' | 'down'>('checking');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const checkHealth = async () => {
    const start = Date.now();
    try {
      await api.get('/health').catch(() => api.get('/'));
      setLatencyMs(Date.now() - start);
      setStatus('up');
    } catch (e) {
      setStatus('down');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { checkHealth(); }, []);
  const onRefresh = () => { setRefreshing(true); setStatus('checking'); checkHealth(); };

  return (
    <ScrollView
      className="flex-1 bg-background pt-14 px-5"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="hsl(45, 93%, 47%)" />}
    >
      <View className="flex-row items-center gap-3 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">Server Status</Text>
      </View>

      <View className="bg-card border border-border rounded-xl p-5 items-center mb-4">
        <View className="h-14 w-14 rounded-full bg-secondary items-center justify-center mb-3">
          <Server size={26} color="#888" />
        </View>
        {status === 'checking' ? (
          <ActivityIndicator color="hsl(45, 93%, 47%)" />
        ) : status === 'up' ? (
          <View className="items-center">
            <View className="flex-row items-center gap-1.5 mb-1">
              <CheckCircle2 size={16} color="#22c55e" />
              <Text className="text-emerald-500 font-bold">API Online</Text>
            </View>
            <Text className="text-muted-foreground text-xs">{latencyMs}ms response time</Text>
          </View>
        ) : (
          <View className="flex-row items-center gap-1.5">
            <XCircle size={16} color="#ef4444" />
            <Text className="text-red-500 font-bold">API Unreachable</Text>
          </View>
        )}
      </View>

      <View className="bg-card border border-border rounded-xl p-4 mb-4">
        <Text className="text-muted-foreground text-xs mb-1">Backend URL</Text>
        <Text className="text-foreground text-sm">{API_URL}</Text>
      </View>

      <Text className="text-muted-foreground text-xs text-center">
        Pull to refresh · AWS media health lives on the web dashboard's Server Status page.
      </Text>
    </ScrollView>
  );
}
