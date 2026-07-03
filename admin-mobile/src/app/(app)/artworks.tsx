import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Linking, TextInput } from 'react-native';
import api from '../../services/api';
import { FileText, Image as ImageIcon, Download, Folder, ChevronLeft, Search, X } from 'lucide-react-native';

export default function ArtworksScreen() {
  const [groupedFiles, setGroupedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Navigation State
  const [selectedFolder, setSelectedFolder] = useState<any>(null);

  const fetchFiles = async () => {
    try {
      const response = await api.get('/files/grouped');
      if (response.data?.success) {
        setGroupedFiles(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch grouped files:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFiles();
  };

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return groupedFiles;
    
    return groupedFiles.filter(g => 
      g.folderName?.toLowerCase().includes(q) || 
      g.orderId?.toLowerCase().includes(q) ||
      g.taskId?.toLowerCase().includes(q)
    );
  }, [groupedFiles, searchQuery]);

  const getFileIcon = (mimetype: string) => {
    if (mimetype?.includes('pdf')) return <FileText size={24} color="#ef4444" />;
    return <ImageIcon size={24} color="#3b82f6" />;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = (url: string) => {
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  // --- FOLDER CONTENTS VIEW ---
  if (selectedFolder) {
    return (
      <View className="flex-1 bg-slate-50 pt-4">
        {/* Header */}
        <View className="px-4 pb-4 border-b border-slate-200 bg-white">
          <TouchableOpacity 
            onPress={() => setSelectedFolder(null)}
            className="flex-row items-center mb-2"
          >
            <ChevronLeft size={20} color="#64748b" />
            <Text className="text-slate-500 font-medium ml-1">Back</Text>
          </TouchableOpacity>
          <View className="flex-row items-center mt-2">
            <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center mr-3">
              <Folder size={20} color="#0f172a" />
            </View>
            <View>
              <Text className="text-xl font-bold text-slate-900">{selectedFolder.folderName}</Text>
              {selectedFolder.orderId && (
                <Text className="text-sm text-slate-500 font-medium">Order ID: {selectedFolder.orderId}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Files List */}
        <FlatList
          data={selectedFolder.files}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="py-20 items-center justify-center border border-dashed border-slate-300 rounded-xl bg-white mt-4">
              <Folder size={48} color="#cbd5e1" className="mb-4" />
              <Text className="text-slate-500 font-semibold text-lg">Folder is empty</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-white p-4 rounded-xl mb-3 border border-slate-200 shadow-sm flex-row items-center">
              <View className="h-12 w-12 rounded-lg bg-slate-100 items-center justify-center mr-4">
                {getFileIcon(item.mimetype)}
              </View>
              <View className="flex-1 mr-2">
                <Text className="text-slate-900 font-semibold text-base mb-1" numberOfLines={1}>
                  {item.originalName}
                </Text>
                <Text className="text-slate-500 text-xs">
                  {formatSize(item.size)} • {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => handleDownload(item.path)}
                className="bg-slate-100 p-2.5 rounded-lg"
              >
                <Download size={18} color="#0f172a" />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  }

  // --- FOLDERS OVERVIEW ---
  return (
    <View className="flex-1 bg-slate-50 px-4 pt-4">
      <Text className="text-2xl font-bold text-slate-900 mb-4">Artwork Folders</Text>

      {/* Search Bar */}
      <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-3 py-2 mb-4 shadow-sm">
        <Search size={18} color="#94a3b8" />
        <TextInput
          placeholder="Search folders, orders, tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="flex-1 ml-2 text-slate-900 h-8"
          placeholderTextColor="#94a3b8"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredGroups}
        keyExtractor={(item, index) => `${item.folderName}-${item.orderId}-${index}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f172a" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="py-20 items-center justify-center">
            <Text className="text-slate-500">No artwork folders found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => setSelectedFolder(item)}
            className="bg-white p-4 rounded-xl mb-3 border border-slate-200 shadow-sm flex-row items-center"
          >
            <View className="h-12 w-12 rounded-xl bg-slate-100 items-center justify-center mr-4">
              <Folder size={24} color="#0f172a" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 font-bold text-base mb-1" numberOfLines={1}>
                {item.folderName || 'Unassigned'}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-slate-500 text-xs font-medium">
                  {item.files?.length || 0} Files
                </Text>
                {item.orderId && (
                  <>
                    <Text className="text-slate-300 mx-2">•</Text>
                    <Text className="text-slate-400 text-xs">Order: {item.orderId}</Text>
                  </>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
