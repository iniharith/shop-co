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
    return <ImageIcon size={24} color="hsl(45, 93%, 47%)" />;
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
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="hsl(45, 93%, 47%)" />
      </View>
    );
  }

  // --- FOLDER CONTENTS VIEW ---
  if (selectedFolder) {
    return (
      <View className="flex-1 bg-background pt-12">
        {/* Header */}
        <View className="px-5 pb-4 border-b border-border">
          <TouchableOpacity
            onPress={() => setSelectedFolder(null)}
            className="flex-row items-center mb-2 active:opacity-70"
          >
            <ChevronLeft size={20} color="hsl(0, 0%, 63%)" />
            <Text className="text-muted-foreground font-medium ml-1">Back</Text>
          </TouchableOpacity>
          <View className="flex-row items-center mt-2">
            <View className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center mr-3">
              <Folder size={20} color="hsl(45, 93%, 47%)" />
            </View>
            <View>
              <Text className="text-xl font-bold text-foreground">{selectedFolder.folderName}</Text>
              {selectedFolder.orderId && (
                <Text className="text-sm text-muted-foreground font-medium">Order ID: {selectedFolder.orderId}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Files List */}
        <FlatList
          data={selectedFolder.files}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
          ListEmptyComponent={
            <View className="py-20 items-center justify-center border border-dashed border-border rounded-xl bg-card mt-4">
              <Folder size={48} color="hsl(0, 0%, 30%)" style={{ marginBottom: 12 }} />
              <Text className="text-muted-foreground font-semibold text-lg">Folder is empty</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-card p-4 rounded-xl mb-3 border border-border shadow-sm flex-row items-center">
              <View className="h-12 w-12 rounded-lg bg-secondary items-center justify-center mr-4">
                {getFileIcon(item.mimetype)}
              </View>
              <View className="flex-1 mr-2">
                <Text className="text-foreground font-semibold text-base mb-1" numberOfLines={1}>
                  {item.originalName}
                </Text>
                <Text className="text-muted-foreground text-xs">
                  {formatSize(item.size)} • {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDownload(item.path)}
                className="bg-secondary p-2.5 rounded-lg active:opacity-70"
              >
                <Download size={18} color="hsl(45, 93%, 47%)" />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    );
  }

  // --- FOLDERS OVERVIEW ---
  return (
    <View className="flex-1 bg-background px-5 pt-12">
      <Text className="text-3xl font-extrabold tracking-tight text-foreground mb-4">Artwork Folders</Text>

      {/* Search Bar */}
      <View className="flex-row items-center bg-card border border-border rounded-xl px-3 py-2 mb-4 shadow-sm">
        <Search size={18} color="hsl(0, 0%, 63%)" />
        <TextInput
          placeholder="Search folders, orders, tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="flex-1 ml-2 text-foreground h-8"
          placeholderTextColor="hsl(0, 0%, 45%)"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color="hsl(0, 0%, 63%)" />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredGroups}
        keyExtractor={(item, index) => `${item.folderName}-${item.orderId}-${index}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="hsl(45, 93%, 47%)" />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        ListEmptyComponent={
          <View className="py-20 items-center justify-center">
            <Text className="text-muted-foreground">No artwork folders found.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedFolder(item)}
            className="bg-card p-4 rounded-xl mb-3 border border-border shadow-sm flex-row items-center active:opacity-70"
          >
            <View className="h-12 w-12 rounded-xl bg-secondary items-center justify-center mr-4">
              <Folder size={24} color="hsl(45, 93%, 47%)" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-bold text-base mb-1" numberOfLines={1}>
                {item.folderName || 'Unassigned'}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-muted-foreground text-xs font-medium">
                  {item.files?.length || 0} Files
                </Text>
                {item.orderId && (
                  <>
                    <Text className="text-muted-foreground mx-2">•</Text>
                    <Text className="text-muted-foreground text-xs">Order: {item.orderId}</Text>
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
