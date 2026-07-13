import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, SectionList, TouchableOpacity, ActivityIndicator, StyleSheet, StatusBar, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import api from '../../services/api';
import socketService from '../../services/socket';
import { useTheme } from '../../context/ThemeContext';
import { LayoutGrid, List, Plus, Search, ChevronDown, MessageSquare, Calendar, Trash2, CheckCircle, Circle, RefreshCw, UserCircle2, User, ArrowDownUp, X, Check } from 'lucide-react-native';

const COLUMNS = [
  'PLACED', 'IN_PROGRESS', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED', 
  'ARTWORK_REJECTED', 'IN_DESIGN', 'PEMBETULAN', 'DONE_DESIGN', 
  'IN_PRODUCTION', 'HOLD_PRINTING', 'DONE_PRINTING', 'PACKAGING', 
  'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED'
];

export default function TasksScreen() {
  const { theme, colors } = useTheme();
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);
  const [collapsedListSections, setCollapsedListSections] = useState<string[]>(COLUMNS);

  // Multi-select state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  // Pickers state
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [userPickerVisible, setUserPickerVisible] = useState(false);
  const [activeTaskForPicker, setActiveTaskForPicker] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [tasksRes, usersRes] = await Promise.all([
        api.get('/tasks').catch(e => ({ data: [] })),
        api.get('/users').catch(e => ({ data: [] }))
      ]);
      const allTasks = tasksRes.data?.data || tasksRes.data?.tasks || tasksRes.data || [];
      const allUsers = usersRes.data?.data || usersRes.data?.users || usersRes.data || [];
      setTasks(Array.isArray(allTasks) ? allTasks : []);
      setUsers(Array.isArray(allUsers) ? allUsers : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefresh(false); }
  };

    useEffect(() => { 
    fetchData(); 
    socketService.connect();
    
    const handleTaskUpdated = (data: any) => {
      setTasks(prev => {
         const exists = prev.find(t => t._id === data._id);
         if (exists) return prev.map(t => t._id === data._id ? { ...t, ...data } : t);
         return [...prev, data];
      });
    };
    const handleTaskDeleted = (data: any) => {
      setTasks(prev => prev.filter(t => t._id !== data._id));
    };

    const offTaskUpd = socketService.on('task_updated' as any, handleTaskUpdated);
    const offTaskCre = socketService.on('task_created' as any, handleTaskUpdated);
    const offTaskDel = socketService.on('task_deleted' as any, handleTaskDeleted);

    return () => { offTaskUpd(); offTaskCre(); offTaskDel(); };
  }, []);

  const toggleColumnCollapse = (status: string) => {
    setCollapsedColumns(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };

  const toggleTaskSelection = (id: string) => {
    setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]);
  };

  const updateTask = async (id: string, data: any) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t._id === id ? { ...t, ...data } : t));
    try {
      await api.put(`/tasks/${id}`, data);
    } catch (e) {
      console.error(e);
      fetchData(); // Revert on failure
    }
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t._id !== id));
    try {
      await api.delete(`/tasks/${id}`);
    } catch (e) {
      console.error(e);
      fetchData();
    }
  };

  const handleBulkUpdate = async (data: any) => {
    if (selectedTaskIds.length === 0) return;
    
    // Optimistic bulk update
    setTasks(prev => prev.map(t => selectedTaskIds.includes(t._id) ? { ...t, ...data } : t));
    const idsToUpdate = [...selectedTaskIds];
    
    // Deselect all immediately for better UX
    setSelectedTaskIds([]);
    
    try {
      await Promise.all(idsToUpdate.map(id => api.put(`/tasks/${id}`, data)));
    } catch (e) {
      console.error(e);
      fetchData(); // Revert on failure
    }
  };

  const handleBulkDelete = () => {
    if (selectedTaskIds.length === 0) return;
    Alert.alert("Delete Tasks", `Are you sure you want to delete ${selectedTaskIds.length} tasks?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          const idsToDelete = [...selectedTaskIds];
          setTasks(prev => prev.filter(t => !idsToDelete.includes(t._id)));
          setSelectedTaskIds([]);
          try {
            await Promise.all(idsToDelete.map(id => api.delete(`/tasks/${id}`)));
          } catch (e) {
            console.error(e);
            fetchData();
          }
      }}
    ]);
  };

  const openStatusPicker = (taskId: string | null = null) => {
    setActiveTaskForPicker(taskId);
    setStatusPickerVisible(true);
  };

  const openUserPicker = (taskId: string | null = null) => {
    setActiveTaskForPicker(taskId);
    setUserPickerVisible(true);
  };

  const selectStatus = (status: string) => {
    if (activeTaskForPicker) {
      updateTask(activeTaskForPicker, { status });
    } else {
      handleBulkUpdate({ status });
    }
    setStatusPickerVisible(false);
  };

  const selectUser = (userId: string | null) => {
    if (activeTaskForPicker) {
      updateTask(activeTaskForPicker, { assignee: userId });
    } else {
      handleBulkUpdate({ assignee: userId });
    }
    setUserPickerVisible(false);
  };

  const query = searchQuery.toLowerCase();
  const sortedTasks = tasks.filter(t => {
    const titleMatch = t.title?.toLowerCase().includes(query);
    const orderIdStr = typeof t.orderId === 'string' ? t.orderId : (t.orderId?._id || String(t.orderId || ''));
    const orderMatch = orderIdStr.toLowerCase().includes(query);
    const customerMatch = t.customerUsername?.toLowerCase().includes(query);
    return titleMatch || orderMatch || customerMatch;
  });

  if (loading) return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd, colors.gradientStart]} style={s.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </LinearGradient>
  );

  const renderTaskCard = (task: any) => {
    const isSelected = selectedTaskIds.includes(task._id);
    return (
      <BlurView experimentalBlurMethod="dimezisBlurView" intensity={theme === 'dark' ? 15 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.taskCard, { borderColor: isSelected ? colors.primary : colors.glassBorder }, task.isDone && { opacity: 0.6 }]} key={task._id}>
        
        {/* 1. Header: Checkbox (Multi-select), Done Circle, Title, Trash */}
        <View style={s.taskHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: 8 }}>
            <TouchableOpacity onPress={() => toggleTaskSelection(task._id)} style={[s.checkbox, { borderColor: isSelected ? colors.primary : colors.mutedForeground, backgroundColor: isSelected ? colors.primary : 'transparent' }]}>
              {isSelected && <Check size={10} color="#000" />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => updateTask(task._id, { isDone: !task.isDone })}>
              {task.isDone ? <CheckCircle color="#22c55e" size={16} /> : <Circle color={colors.mutedForeground} size={16} />}
            </TouchableOpacity>
            <Text style={[s.taskTitle, { color: colors.foreground }, task.isDone && { textDecorationLine: 'line-through', color: colors.mutedForeground }]} numberOfLines={2}>
              {task.title || `Task #${task._id?.slice(-6)}`}
            </Text>
          </View>
          <TouchableOpacity style={{ padding: 4 }} onPress={() => deleteTask(task._id)}>
            <Trash2 color={colors.destructive} size={14} />
          </TouchableOpacity>
        </View>
        
        {/* 2. Comments Badge */}
        {task.comments?.length > 0 && (
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <View style={[s.commentBadge, { backgroundColor: colors.secondary }]}>
              <MessageSquare size={10} color={colors.foreground} />
              <Text style={[s.taskMeta, { color: colors.foreground }]}>{task.comments.length}</Text>
            </View>
          </View>
        )}
        
        {/* 3. Due Date & Assignee */}
        <View style={s.taskFooter}>
          <View style={[s.footerPill, { backgroundColor: colors.secondary }]}>
            <Calendar size={10} color={colors.foreground} />
            <Text style={[s.taskMeta, { color: colors.foreground }]}>{new Date(task.createdAt).toLocaleDateString('en-MY')}</Text>
          </View>
          
          <TouchableOpacity style={[s.footerPill, { backgroundColor: colors.secondary }]} onPress={() => openUserPicker(task._id)}>
            <UserCircle2 size={12} color={colors.foreground} />
            <Text style={[s.taskMeta, { color: colors.foreground }]}>{task.assignee?.name || 'Unassigned'}</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Status Dropdown Replica */}
        <TouchableOpacity style={[s.statusBadge, { backgroundColor: colors.secondary, borderColor: colors.glassBorder }]} onPress={() => openStatusPicker(task._id)}>
          <Text style={[s.statusText, { color: colors.foreground }]}>
            {task.status?.replace(/_/g, ' ') || 'UNKNOWN'}
          </Text>
          <ChevronDown size={12} color={colors.foreground} />
        </TouchableOpacity>
      </BlurView>
    );
  };

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientEnd, colors.gradientStart]} style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Header */}
      <BlurView intensity={theme === 'dark' ? 20 : 60} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.header, { borderBottomColor: colors.glassBorder }]}>
        <View style={s.headerTop}>
          <View>
            <Text style={[s.pageTitle, { color: colors.foreground }]}>Task Management 📋</Text>
            <Text style={[s.pageSub, { color: colors.mutedForeground }]}>Manage and assign tasks for your team</Text>
          </View>
          <TouchableOpacity onPress={() => {}} style={s.newBtn}>
            <Plus size={16} color="#000" />
            <Text style={s.newBtnText}>New Task</Text>
          </TouchableOpacity>
        </View>

        {/* Toolbar */}
        <View style={s.toolbar}>
          <View style={[s.viewToggle, { backgroundColor: colors.secondary, borderColor: colors.glassBorder }]}>
            <TouchableOpacity 
              style={[s.toggleBtn, viewMode === 'list' && { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} 
              onPress={() => setViewMode('list')}
            >
              <List size={14} color={viewMode === 'list' ? colors.foreground : colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[s.toggleBtn, viewMode === 'board' && { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} 
              onPress={() => setViewMode('board')}
            >
              <LayoutGrid size={14} color={viewMode === 'board' ? colors.foreground : colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={[s.searchBox, { backgroundColor: colors.secondary, borderColor: colors.glassBorder }]}>
            <Search size={14} color={colors.mutedForeground} />
            <TextInput 
              placeholder="Search tasks..." 
              placeholderTextColor={colors.mutedForeground}
              style={[s.searchInput, { color: colors.foreground }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity onPress={() => { setRefresh(true); fetchData(); }} style={[s.refreshBtn, { backgroundColor: colors.secondary, borderColor: colors.glassBorder }]}>
            <RefreshCw size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </BlurView>

      {/* Board View */}
      {viewMode === 'board' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.boardScroll}>
          {COLUMNS.map(status => {
            const columnTasks = sortedTasks.filter(t => t.status === status);
            const isCollapsed = collapsedColumns.includes(status);
            
            return (
              <View key={status} style={[s.column, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: colors.glassBorder }, isCollapsed && s.columnCollapsed]}>
                <TouchableOpacity style={[s.columnHeader, { backgroundColor: colors.secondary, borderColor: colors.glassBorder }]} onPress={() => toggleColumnCollapse(status)}>
                  <Text style={[s.columnTitle, { color: colors.foreground }]}>{status.replace(/_/g, ' ')}</Text>
                  <View style={s.columnCountBadge}>
                    <Text style={[s.columnCount, { color: colors.primary }]}>{columnTasks.length}</Text>
                  </View>
                  <ChevronDown size={14} color={colors.mutedForeground} style={{ transform: [{ rotate: isCollapsed ? '-90deg' : '0deg' }] }} />
                </TouchableOpacity>
                
                {!isCollapsed && (
                  <FlatList
                    data={columnTasks}
                    keyExtractor={t => t._id}
                    renderItem={({ item }) => renderTaskCard(item)}
                    contentContainerStyle={{ gap: 10, paddingBottom: 160 }}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <SectionList
          sections={COLUMNS.filter(status => sortedTasks.some(t => t.status === status)).map(status => ({
            title: status.replace(/_/g, ' '),
            statusId: status,
            data: collapsedListSections.includes(status) ? [] : sortedTasks.filter(t => t.status === status),
            count: sortedTasks.filter(t => t.status === status).length
          }))}
          keyExtractor={t => t._id}
          renderItem={({ item }) => renderTaskCard(item)}
          renderSectionHeader={({ section }) => (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => setCollapsedListSections(prev => 
                prev.includes(section.statusId) ? prev.filter(s => s !== section.statusId) : [...prev, section.statusId]
              )}
              style={{ marginBottom: 10, marginTop: 10, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 4, height: 16, backgroundColor: colors.primary, borderRadius: 2 }} />
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.foreground, letterSpacing: 0.5 }}>{section.title}</Text>
                <View style={{ backgroundColor: colors.glassBorder, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.foreground }}>{section.count}</Text>
                </View>
              </View>
              <ChevronDown size={18} color={colors.mutedForeground} style={{ transform: [{ rotate: collapsedListSections.includes(section.statusId) ? '180deg' : '0deg' }] }} />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Floating Action Bar for Bulk Operations */}
      {selectedTaskIds.length > 0 && (
        <View style={s.fabWrapper}>
          <BlurView intensity={theme === 'dark' ? 40 : 80} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.fab, { borderColor: colors.glassBorder }]}>
            <View style={[s.fabCount, { backgroundColor: colors.primary }]}>
              <Text style={s.fabCountText}>{selectedTaskIds.length}</Text>
            </View>
            
            <TouchableOpacity style={s.fabBtn} onPress={() => openUserPicker(null)}>
              <User size={16} color={colors.foreground} />
            </TouchableOpacity>
            <TouchableOpacity style={s.fabBtn} onPress={() => openStatusPicker(null)}>
              <ArrowDownUp size={16} color={colors.foreground} />
            </TouchableOpacity>
            
            <View style={[s.fabDivider, { backgroundColor: colors.glassBorder }]} />
            
            <TouchableOpacity style={s.fabBtn} onPress={() => handleBulkUpdate({ isDone: true })}>
              <CheckCircle size={16} color="#22c55e" />
            </TouchableOpacity>
            <TouchableOpacity style={s.fabBtn} onPress={handleBulkDelete}>
              <Trash2 size={16} color={colors.destructive} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[s.fabBtn, { marginLeft: 'auto' }]} onPress={() => setSelectedTaskIds([])}>
              <X size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </BlurView>
        </View>
      )}

      {/* Status Picker Modal */}
      <Modal visible={statusPickerVisible} transparent animationType="slide" onRequestClose={() => setStatusPickerVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setStatusPickerVisible(false)}>
          <BlurView intensity={theme === 'dark' ? 40 : 80} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.modalContent, { backgroundColor: theme === 'dark' ? 'rgba(10,10,14,0.9)' : 'rgba(255,255,255,0.9)' }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Select Status</Text>
              <TouchableOpacity onPress={() => setStatusPickerVisible(false)}><X color={colors.foreground} size={20}/></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {COLUMNS.map(sItem => (
                <TouchableOpacity key={sItem} style={[s.modalOption, { borderBottomColor: colors.glassBorder }]} onPress={() => selectStatus(sItem)}>
                  <Text style={[s.modalOptionText, { color: colors.foreground }]}>{sItem.replace(/_/g, ' ')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </BlurView>
        </TouchableOpacity>
      </Modal>

      {/* User Picker Modal */}
      <Modal visible={userPickerVisible} transparent animationType="slide" onRequestClose={() => setUserPickerVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setUserPickerVisible(false)}>
          <BlurView intensity={theme === 'dark' ? 40 : 80} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.modalContent, { backgroundColor: theme === 'dark' ? 'rgba(10,10,14,0.9)' : 'rgba(255,255,255,0.9)' }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.foreground }]}>Assign User</Text>
              <TouchableOpacity onPress={() => setUserPickerVisible(false)}><X color={colors.foreground} size={20}/></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <TouchableOpacity style={[s.modalOption, { borderBottomColor: colors.glassBorder }]} onPress={() => selectUser(null)}>
                <Text style={[s.modalOptionText, { color: colors.mutedForeground, fontStyle: 'italic' }]}>Unassigned</Text>
              </TouchableOpacity>
              {users.map(u => (
                <TouchableOpacity key={u._id} style={[s.modalOption, { borderBottomColor: colors.glassBorder }]} onPress={() => selectUser(u._id)}>
                  <Text style={[s.modalOptionText, { color: colors.foreground }]}>{u.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </BlurView>
        </TouchableOpacity>
      </Modal>

    </LinearGradient>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, marginBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  pageSub: { fontSize: 13, marginTop: 2 },
  newBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0a500', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  newBtnText: { color: '#000', fontWeight: '700', fontSize: 12 },
  
  toolbar: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  viewToggle: { flexDirection: 'row', borderRadius: 8, padding: 2, borderWidth: 1 },
  toggleBtn: { padding: 8, borderRadius: 6 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 10, borderWidth: 1, height: 36, gap: 6 },
  searchInput: { flex: 1, fontSize: 13 },
  refreshBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  boardScroll: { paddingHorizontal: 16, gap: 16 },
  column: { width: 280, borderRadius: 16, padding: 12, borderWidth: 1 },
  columnCollapsed: { width: 140 },
  columnHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
  columnTitle: { flex: 1, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  columnCountBadge: { backgroundColor: 'rgba(255,215,0,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  columnCount: { fontSize: 10, fontWeight: '800' },

  taskCard: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, padding: 12, paddingBottom: 10, marginBottom: 10 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  checkbox: { width: 16, height: 16, borderWidth: 1, borderRadius: 4, marginTop: 1, alignItems: 'center', justifyContent: 'center' },
  taskTitle: { fontWeight: '600', fontSize: 13, lineHeight: 18 },
  commentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  taskFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  taskMeta: { fontSize: 10, fontWeight: '500' },
  footerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  statusBadge: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, borderWidth: 1, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },

  fabWrapper: { position: 'absolute', bottom: 90, left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  fab: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 30, borderWidth: 1, gap: 4, width: '85%', maxWidth: 400, overflow: 'hidden' },
  fabCount: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  fabCountText: { color: '#000', fontWeight: '800', fontSize: 14 },
  fabBtn: { padding: 10, borderRadius: 20 },
  fabDivider: { width: 1, height: 24, marginHorizontal: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalOption: { paddingVertical: 14, borderBottomWidth: 1 },
  modalOptionText: { fontSize: 15, fontWeight: '500' },
});

