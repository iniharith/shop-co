import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, FileText, CheckCircle2 } from 'lucide-react-native';
import api from '../../services/api';

export default function PrintDraftsScreen() {
  const router = useRouter();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFiles = async () => {
    try {
      const res = await api.get('/files');
      const list = res.data?.data || res.data?.files || res.data || [];
      setFiles((Array.isArray(list) ? list : []).filter((f: any) => !f.reviewed));
    } catch (e) {
      console.error('Failed to fetch files:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchFiles(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchFiles(); };

  const markReviewed = async (id: string) => {
    try {
      await api.put(`/files/${id}/review`, { reviewed: true });
      setFiles((prev) => prev.filter((f) => f._id !== id));
    } catch (e) {
      Alert.alert('Error', 'Could not update file.');
    }
  };

  return (
    <View className="flex-1 bg-background pt-14 px-5">
      <View className="flex-row items-center gap-3 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">Print Drafts</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="hsl(45, 93%, 47%)" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="hsl(45, 93%, 47%)" />}
          contentContainerStyle={{ paddingBottom: 100, gap: 12 }}
          ListEmptyComponent={<Text className="text-muted-foreground text-center mt-10">Nothing pending review 🎉</Text>}
          renderItem={({ item }) => (
            <View className="flex-1 bg-card border border-border rounded-xl overflow-hidden mb-3">
              {item.url ? (
                <Image source={{ uri: item.url }} className="w-full h-28 bg-secondary" resizeMode="cover" />
              ) : (
                <View className="w-full h-28 bg-secondary items-center justify-center">
                  <FileText size={28} color="#888" />
                </View>
              )}
              <View className="p-3">
                <Text numberOfLines={1} className="text-foreground text-xs font-semibold mb-2">
                  {item.filename || item.name || 'Untitled file'}
                </Text>
                <TouchableOpacity
                  onPress={() => markReviewed(item._id)}
                  className="flex-row items-center justify-center gap-1 bg-primary/10 py-1.5 rounded-lg"
                >
                  <CheckCircle2 size={13} color="hsl(45, 93%, 47%)" />
                  <Text className="text-primary text-[11px] font-semibold">Mark reviewed</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
