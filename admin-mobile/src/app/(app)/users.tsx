import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Trash2, UserCircle } from 'lucide-react-native';
import api from '../../services/api';

export default function UsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      const list = res.data?.data || res.data?.users || res.data || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchUsers(); };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete user', `Remove ${name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/admin/users/${id}`);
            setUsers((prev) => prev.filter((u) => u._id !== id));
          } catch (e) {
            Alert.alert('Error', 'Could not delete user.');
          }
        },
      },
    ]);
  };

  const roleColor: Record<string, string> = {
    sysadmin: '#ef4444', admin: '#f59e0b', boss: '#f59e0b',
    designer: '#8b5cf6', production: '#3b82f6', packaging: '#06b6d4', client: '#94a3b8',
  };

  return (
    <View className="flex-1 bg-background pt-14 px-5">
      <View className="flex-row items-center gap-3 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ChevronLeft size={24} color="#fafafa" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground">Users</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="hsl(45, 93%, 47%)" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="hsl(45, 93%, 47%)" />}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<Text className="text-muted-foreground text-center mt-10">No users found.</Text>}
          renderItem={({ item }) => (
            <View className="bg-card p-4 rounded-xl mb-3 border border-border flex-row items-center">
              <View className="h-10 w-10 rounded-full bg-secondary items-center justify-center mr-3">
                <UserCircle size={22} color="#888" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{item.name}</Text>
                <Text className="text-muted-foreground text-xs">{item.email}</Text>
              </View>
              <View
                className="px-2 py-1 rounded-full mr-3"
                style={{ backgroundColor: `${roleColor[item.role] || '#94a3b8'}22` }}
              >
                <Text className="text-[10px] font-bold" style={{ color: roleColor[item.role] || '#94a3b8' }}>
                  {String(item.role).toUpperCase()}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item._id, item.name)} className="p-1">
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
