import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, SectionList, TouchableOpacity, ActivityIndicator, StyleSheet, StatusBar, ScrollView, TextInput, Modal, Alert, Share } from 'react-native';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import AppBackground from '../../components/AppBackground';
import FrostedView from '../../components/FrostedView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { API_URL } from '../../services/api';
import socketService from '../../services/socket';
import { useTheme } from '../../context/ThemeContext';
import { LayoutGrid, List, Plus, Search, ChevronDown, MessageSquare, Calendar, Trash2, CheckCircle, Circle, RefreshCw, UserCircle2, User, ArrowDownUp, X, Check, Eye, Download, Paperclip, Printer, FolderOpen, Share2, Activity, Pencil, Save } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';

const COLUMNS = [
  'PLACED', 'IN_PROGRESS', 'PENDING_ARTWORK', 'ARTWORK_REVIEWED', 
  'ARTWORK_REJECTED', 'IN_DESIGN', 'PEMBETULAN', 'DONE_DESIGN', 
  'IN_PRODUCTION', 'PRINT_AWB', 'DONE_PRINTING', 'PACKAGING',
  'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'FAILED', 'RETURN'
];

export default function TasksScreen() {
  const { theme, colors } = useTheme();
  const router = useRouter();
  const token = useAuthStore(state => state.token);
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);
  const [collapsedListSections, setCollapsedListSections] = useState<string[]>(COLUMNS);
  const [sortOption, setSortOption] = useState<'dateDesc' | 'dateAsc' | 'nameAsc' | 'nameDesc'>('dateDesc');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [sortPickerVisible, setSortPickerVisible] = useState(false);
  const [assigneeFilterVisible, setAssigneeFilterVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskDetailLoading, setTaskDetailLoading] = useState(false);
  const [taskFiles, setTaskFiles] = useState<any[]>([]);
  const [taskPreviewFile, setTaskPreviewFile] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<'comments' | 'activity'>('comments');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [descriptionEditorSource, setDescriptionEditorSource] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);

  // Multi-select state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  // Pickers state
  const [statusPickerVisible, setStatusPickerVisible] = useState(false);
  const [userPickerVisible, setUserPickerVisible] = useState(false);
  const [activeTaskForPicker, setActiveTaskForPicker] = useState<string | null>(null);
  const fetchRequestRef = useRef(0);
  const taskDetailRequestRef = useRef(0);

  const fetchData = async () => {
    const requestId = ++fetchRequestRef.current;
    try {
      const [tasksRes, usersRes] = await Promise.all([
        api.get('/tasks').catch(e => ({ data: [] })),
        api.get('/admin/users').catch(e => ({ data: [] }))
      ]);
      const allTasks = tasksRes.data?.data || tasksRes.data?.tasks || tasksRes.data || [];
        const allUsers = usersRes.data?.users || [];
      if (requestId === fetchRequestRef.current) {
        setTasks(Array.isArray(allTasks) ? allTasks : []);
        setUsers(Array.isArray(allUsers) ? allUsers : []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefresh(false); }
  };

    useEffect(() => { 
    fetchData(); 
    socketService.connect();
    
    const handleTaskUpdated = (data: any) => {
      fetchRequestRef.current += 1;
      void fetchData();
      if (data?.event === 'task_deleted' && data?.taskId) {
        setTasks(prev => prev.filter(t => t._id !== data.taskId));
        return;
      }

      const task = data?.task;
      if (!task?._id) return;
      setTasks(prev => {
         const exists = prev.find(t => t._id === task._id);
         if (exists) return prev.map(t => t._id === task._id ? { ...t, ...task } : t);
         return [...prev, task];
      });
    };

    const offTaskUpd = socketService.on('task_updated' as any, handleTaskUpdated);

    return () => { offTaskUpd(); socketService.disconnect(); };
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

  const openTask = async (task: any) => {
    const requestId = ++taskDetailRequestRef.current;
    setSelectedTask(task);
    setDescriptionDraft(descriptionToEditorHtml(task.description));
    setEditingDescription(false);
    setTaskFiles([]);
    setDetailTab('comments');
    setTaskDetailLoading(true);
    try {
      const [taskResponse, filesResponse] = await Promise.all([
        api.get(`/tasks/${task._id}`),
        api.get(`/files/by-folder?taskId=${encodeURIComponent(task._id)}`).catch(() => ({ data: { data: [] } })),
      ]);
      const detail = taskResponse.data?.task || task;
      const uploads = Array.isArray(filesResponse.data?.data) ? filesResponse.data.data : [];
      if (requestId !== taskDetailRequestRef.current) return;
      setSelectedTask(detail);
      setDescriptionDraft(descriptionToEditorHtml(detail.description));
      setTaskFiles(mergeTaskFiles(detail.files || [], uploads));
    } catch (error) {
      if (requestId !== taskDetailRequestRef.current) return;
      console.error(error);
      Alert.alert('Open failed', 'Could not load the latest task details.');
    } finally {
      if (requestId === taskDetailRequestRef.current) setTaskDetailLoading(false);
    }
  };

  const closeTask = () => {
    taskDetailRequestRef.current += 1;
    setSelectedTask(null);
    setTaskFiles([]);
    setTaskPreviewFile(null);
    setEditingDescription(false);
  };

  const saveDescription = async () => {
    if (!selectedTask?._id) return;
    const taskId = selectedTask._id;
    const requestId = taskDetailRequestRef.current;
    setSavingDescription(true);
    try {
      const response = await api.put(`/tasks/${taskId}`, { description: descriptionDraft.trim() });
      const updated = response.data?.task || { ...selectedTask, description: descriptionDraft.trim() };
      setTasks(current => current.map(task => task._id === updated._id ? { ...task, ...updated } : task));
      if (requestId === taskDetailRequestRef.current) {
        setSelectedTask(updated);
        setDescriptionDraft(descriptionToEditorHtml(updated.description));
        setEditingDescription(false);
      }
    } catch (error: any) {
      Alert.alert('Save failed', error?.response?.data?.message || 'Could not update the task description.');
    } finally {
      setSavingDescription(false);
    }
  };

  const previewTaskFile = (file: any) => setTaskPreviewFile(file);

  const taskFileUrl = (file: any, inline: boolean) => {
    if (file.fileUploadId) return `${API_URL}/api/files/${file.fileUploadId}/${inline ? 'preview' : 'download'}`;
    const params = new URLSearchParams({ url: file.url || '', name: file.name || 'file' });
    if (inline) params.set('inline', 'true');
    else params.set('stream', 'true');
    return `${API_URL}/api/files/proxy-download?${params.toString()}`;
  };

  const downloadTaskFile = async (file: any) => {
    try {
      const safeName = String(file.name || 'download').replace(/[\\/:*?"<>|]/g, '_');
      const response = await FileSystem.downloadAsync(taskFileUrl(file, false), `${FileSystem.cacheDirectory}${safeName}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(response.uri);
    } catch {
      Alert.alert('Download failed', 'Could not download this file.');
    }
  };

  const shareTaskFolder = async () => {
    if (!selectedTask) return;
    try {
      const response = await api.post('/files/share-link', {
        folderName: selectedTask.title || selectedTask.customerUsername || 'Task Files',
        taskId: selectedTask._id,
        orderId: typeof selectedTask.orderId === 'string' ? selectedTask.orderId : selectedTask.orderId?._id,
        audience: 'CUSTOMER',
      });
      const slug = response.data?.data?.slug;
      if (!slug) throw new Error('Missing share slug');
      await Share.share({ message: `https://admin.kampungcetak.com/share/${slug}` });
    } catch {
      Alert.alert('Share failed', 'Could not create the task share link.');
    }
  };

  const renderTaskFileCard = (file: any, index: number) => {
    const tag = String(file.tag || 'attachment');
    const tagColor = tag === 'draft' ? '#f59e0b' : tag === 'for_print' ? '#22c55e' : tag === 'awb' ? '#ef4444' : colors.mutedForeground;
    return (
      <View key={file.fileUploadId || file._id || `${file.name}-${index}`} style={[s.fileCard, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}>
        <TouchableOpacity onPress={() => previewTaskFile(file)} style={[s.fileIcon, { backgroundColor: `${tagColor}18` }]}>
          {isImageFile(file) ? <Image source={{ uri: taskFileUrl(file, true), headers: token ? { Authorization: `Bearer ${token}` } : {} }} style={s.fileThumbnail} contentFit="cover" /> : <Paperclip size={18} color={tagColor} />}
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => previewTaskFile(file)}>
          <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '700' }} numberOfLines={2}>{file.name || 'Attachment'}</Text>
          {file.notes ? <Text style={{ color: colors.primary, fontSize: 10, marginTop: 3 }} numberOfLines={1}>{file.notes}</Text> : null}
        </TouchableOpacity>
        <View style={[s.fileTag, { borderColor: `${tagColor}55`, backgroundColor: `${tagColor}16` }]}><Text style={{ color: tagColor, fontSize: 8, fontWeight: '900' }}>{tag.replace(/_/g, ' ').toUpperCase()}</Text></View>
        <View style={s.fileActions}>
          <TouchableOpacity onPress={() => previewTaskFile(file)} style={s.fileAction}><Eye size={15} color={colors.primary} /></TouchableOpacity>
          <TouchableOpacity onPress={() => void downloadTaskFile(file)} style={s.fileAction}><Download size={15} color={colors.foreground} /></TouchableOpacity>
        </View>
      </View>
    );
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

  const sortedTasks = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return [...tasks]
      .filter(t => {
        const titleMatch = t.title?.toLowerCase().includes(query);
        const orderIdStr = typeof t.orderId === 'string' ? t.orderId : (t.orderId?._id || String(t.orderId || ''));
        const orderMatch = orderIdStr.toLowerCase().includes(query);
        const customerMatch = t.customerUsername?.toLowerCase().includes(query);
        return titleMatch || orderMatch || customerMatch;
      })
      .filter(t => {
        if (assigneeFilter === 'all') return true;
        if (assigneeFilter === 'unassigned') return !t.assignee;
        return t.assignee === assigneeFilter || t.assignee?._id === assigneeFilter;
      })
      .sort((a, b) => {
        if (sortOption === 'dateDesc') return new Date(b.statusUpdatedAt || b.createdAt).getTime() - new Date(a.statusUpdatedAt || a.createdAt).getTime();
        if (sortOption === 'dateAsc') return new Date(a.statusUpdatedAt || a.createdAt).getTime() - new Date(b.statusUpdatedAt || b.createdAt).getTime();
        if (sortOption === 'nameAsc') return (a.title || '').localeCompare(b.title || '');
        return (b.title || '').localeCompare(a.title || '');
      });
  }, [tasks, searchQuery, assigneeFilter, sortOption]);

  const tasksByStatus = useMemo(() => {
    const grouped = Object.fromEntries(COLUMNS.map(status => [status, [] as any[]]));
    sortedTasks.forEach(task => grouped[task.status]?.push(task));
    return grouped as Record<string, any[]>;
  }, [sortedTasks]);

  const taskSections = useMemo(
    () => COLUMNS.filter(status => tasksByStatus[status].length > 0).map(status => ({
      title: status.replace(/_/g, ' '),
      statusId: status,
      data: collapsedListSections.includes(status) ? [] : tasksByStatus[status],
      count: tasksByStatus[status].length,
    })),
    [tasksByStatus, collapsedListSections]
  );

  if (loading) return (
    <AppBackground style={s.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </AppBackground>
  );

  const renderTaskCard = (task: any) => {
    const isSelected = selectedTaskIds.includes(task._id);
    const assigneeId = typeof task.assignee === 'string' ? task.assignee : task.assignee?._id;
    const assignee = users.find(user => user._id === assigneeId);
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const dueDateLabel = dueDate ? dueDate.toLocaleDateString('en-MY', { day: '2-digit', month: 'short' }) : 'Set Due Date';
    return (
      <TouchableOpacity key={task._id} activeOpacity={0.78} onPress={() => void openTask(task)}>
      <FrostedView intensity={theme === 'dark' ? 45 : 70} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.taskCard, { borderColor: isSelected ? colors.primary : colors.glassBorder, backgroundColor: colors.glass }, task.isDone && { opacity: 0.6 }]}>
        
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
            <Text style={[s.taskMeta, { color: dueDate ? colors.foreground : colors.mutedForeground }]}>{dueDateLabel}</Text>
          </View>
          
          <TouchableOpacity style={[s.footerPill, { backgroundColor: colors.secondary }]} onPress={() => openUserPicker(task._id)}>
            <UserCircle2 size={12} color={colors.foreground} />
            <Text style={[s.taskMeta, { color: colors.foreground }]}>{assignee?.name || task.assignee?.name || 'Unassigned'}</Text>
          </TouchableOpacity>
        </View>

        {/* 4. Status Dropdown Replica */}
        <TouchableOpacity style={[s.statusBadge, { backgroundColor: colors.secondary, borderColor: colors.glassBorder }]} onPress={() => openStatusPicker(task._id)}>
          <Text style={[s.statusText, { color: colors.foreground }]}>
            {task.status?.replace(/_/g, ' ') || 'UNKNOWN'}
          </Text>
          <ChevronDown size={12} color={colors.foreground} />
        </TouchableOpacity>
      </FrostedView>
      </TouchableOpacity>
    );
  };

  return (
    <AppBackground style={s.screen}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Header */}
      <FrostedView intensity={theme === 'dark' ? 48 : 65} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.header, { backgroundColor: colors.navBg, borderBottomColor: colors.navBorder, paddingTop: insets.top + 10 }]}>
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
        <View style={s.filterBar}>
          <TouchableOpacity onPress={() => setSortPickerVisible(true)} style={[s.filterButton, { backgroundColor: colors.secondary, borderColor: colors.glassBorder }]}>
            <ArrowDownUp size={13} color={colors.mutedForeground} />
            <Text style={[s.filterText, { color: colors.foreground }]}>{sortOption === 'dateDesc' ? 'Newest' : sortOption === 'dateAsc' ? 'Oldest' : sortOption === 'nameAsc' ? 'Name A-Z' : 'Name Z-A'}</Text>
            <ChevronDown size={12} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAssigneeFilterVisible(true)} style={[s.filterButton, { backgroundColor: colors.secondary, borderColor: colors.glassBorder }]}>
            <UserCircle2 size={13} color={colors.mutedForeground} />
            <Text style={[s.filterText, { color: colors.foreground }]} numberOfLines={1}>
              {assigneeFilter === 'all' ? 'All Users' : assigneeFilter === 'unassigned' ? 'Unassigned' : users.find(user => user._id === assigneeFilter)?.name || 'Assignee'}
            </Text>
            <ChevronDown size={12} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </FrostedView>

      {/* Board View */}
      {viewMode === 'board' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.boardScroll}>
          {COLUMNS.map(status => {
            const columnTasks = tasksByStatus[status];
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
          sections={taskSections}
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
          ListEmptyComponent={<Text style={[s.emptyText, { color: colors.mutedForeground }]}>No tasks found</Text>}
        />
      )}

      {/* Floating Action Bar for Bulk Operations */}
      {selectedTaskIds.length > 0 && (
        <View style={s.fabWrapper}>
          <FrostedView intensity={theme === 'dark' ? 68 : 82} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.fab, { borderColor: colors.glassBorder }]}>
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
          </FrostedView>
        </View>
      )}

      {/* Task Detail Modal */}
      <Modal visible={!!selectedTask} transparent animationType="slide" onRequestClose={closeTask}>
        <View style={s.detailOverlay}>
          <FrostedView intensity={84} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.detailModal, { backgroundColor: 'rgba(10,10,10,0.78)', borderColor: colors.glassBorder, paddingTop: insets.top + 8 }]}>
            <View style={s.sheetHandle} />
            <View style={[s.modalHeader, { marginBottom: 10 }]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[s.detailTitle, { color: colors.foreground }]} numberOfLines={2}>{selectedTask?.title || 'Task details'}</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 10, marginTop: 4 }}>TASK #{String(selectedTask?._id || '').slice(-8).toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={closeTask} style={s.detailClose}><X color={colors.foreground} size={20} /></TouchableOpacity>
            </View>
            {taskDetailLoading ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} /> : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 64, gap: 14 }}>
                <View style={s.detailPills}>
                  <View style={[s.detailPill, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}><Text style={[s.statusText, { color: colors.primary }]}>{String(selectedTask?.status || 'UNKNOWN').replace(/_/g, ' ')}</Text></View>
                  <View style={[s.detailPill, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}><Text style={[s.statusText, { color: colors.foreground }]}>{selectedTask?.category || 'UNASSIGNED'}</Text></View>
                </View>

                <View style={s.fileSectionHeader}>
                  <View style={s.sectionHeading}><View style={[s.sectionAccent, { backgroundColor: colors.primary }]} /><Text style={[s.sectionHeadingText, { color: colors.foreground }]}>Description</Text></View>
                  {!editingDescription ? <TouchableOpacity onPress={() => { const html = descriptionToEditorHtml(selectedTask?.description); setDescriptionDraft(html); setDescriptionEditorSource(descriptionEditorDocument(html, colors.foreground, colors.mutedForeground)); setEditingDescription(true); }} style={s.inlineEdit}><Pencil size={13} color={colors.primary} /><Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900' }}>EDIT</Text></TouchableOpacity> : null}
                </View>
                <View style={[s.descriptionCard, { borderColor: colors.glassBorder, backgroundColor: colors.glass }]}>
                  {editingDescription ? (
                    <>
                      <WebView
                        key={`${selectedTask?._id}-description-editor`}
                        originWhitelist={['*']}
                        source={{ html: descriptionEditorSource }}
                        onMessage={event => setDescriptionDraft(event.nativeEvent.data)}
                        javaScriptEnabled
                        scrollEnabled={false}
                        style={[s.descriptionInput, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}
                      />
                      <View style={s.descriptionActions}>
                        <TouchableOpacity disabled={savingDescription} onPress={() => { setDescriptionDraft(descriptionToEditorHtml(selectedTask?.description)); setEditingDescription(false); }} style={[s.descriptionButton, { borderColor: colors.glassBorder }]}><X size={14} color={colors.mutedForeground} /><Text style={{ color: colors.mutedForeground, fontSize: 11, fontWeight: '800' }}>Cancel</Text></TouchableOpacity>
                        <TouchableOpacity disabled={savingDescription} onPress={() => void saveDescription()} style={[s.descriptionButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}>{savingDescription ? <ActivityIndicator size="small" color="#000" /> : <><Save size={14} color="#000" /><Text style={{ color: '#000', fontSize: 11, fontWeight: '900' }}>Save</Text></>}</TouchableOpacity>
                      </View>
                    </>
                  ) : <Text style={[s.detailText, { color: selectedTask?.description ? colors.foreground : colors.mutedForeground }]}>{descriptionToText(selectedTask?.description) || 'No description'}</Text>}
                </View>

                <View style={s.propertyGrid}>
                  <View style={[s.propertyCard, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}><UserCircle2 size={15} color={colors.primary} /><Text style={[s.propertyLabel, { color: colors.mutedForeground }]}>ASSIGNEE</Text><Text style={[s.propertyValue, { color: colors.foreground }]} numberOfLines={1}>{selectedTask?.assignee?.name || users.find(user => user._id === selectedTask?.assignee)?.name || 'Unassigned'}</Text></View>
                  <View style={[s.propertyCard, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}><Calendar size={15} color={colors.primary} /><Text style={[s.propertyLabel, { color: colors.mutedForeground }]}>DUE DATE</Text><Text style={[s.propertyValue, { color: colors.foreground }]} numberOfLines={1}>{selectedTask?.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString('en-MY') : 'Not set'}</Text></View>
                  <View style={[s.propertyCard, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}><Printer size={15} color={colors.primary} /><Text style={[s.propertyLabel, { color: colors.mutedForeground }]}>STATUS</Text><Text style={[s.propertyValue, { color: colors.foreground }]} numberOfLines={1}>{String(selectedTask?.status || '').replace(/_/g, ' ')}</Text></View>
                  <View style={[s.propertyCard, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}><FolderOpen size={15} color={colors.primary} /><Text style={[s.propertyLabel, { color: colors.mutedForeground }]}>ORDER</Text><Text style={[s.propertyValue, { color: colors.foreground }]} numberOfLines={1}>{typeof selectedTask?.orderId === 'string' ? selectedTask.orderId : selectedTask?.orderId?._id || 'Not linked'}</Text></View>
                </View>

                <View style={s.contextActions}>
                  <TouchableOpacity onPress={() => { closeTask(); router.push('/artworks' as never); }} style={[s.contextButton, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}><FolderOpen size={15} color={colors.primary} /><Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 11 }}>{selectedTask?.status === 'IN_PRODUCTION' ? 'Production Folder' : selectedTask?.status === 'PACKAGING' ? 'Packaging Folder' : 'Artwork Folder'}</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => void shareTaskFolder()} style={[s.contextButton, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}><Share2 size={15} color={colors.primary} /><Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 11 }}>Share Link</Text></TouchableOpacity>
                </View>

                <View style={s.fileSectionHeader}><View style={s.sectionHeading}><View style={[s.sectionAccent, { backgroundColor: colors.primary }]} /><Text style={[s.sectionHeadingText, { color: colors.foreground }]}>Artworks</Text><Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{taskFiles.filter(file => ['draft', 'for_print'].includes(file.tag)).length}</Text></View>{taskFiles.filter(file => ['draft', 'for_print'].includes(file.tag)).length ? <TouchableOpacity onPress={() => taskFiles.filter(file => ['draft', 'for_print'].includes(file.tag)).forEach(file => void downloadTaskFile(file))}><Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800' }}>DOWNLOAD ALL</Text></TouchableOpacity> : null}</View>
                <View style={{ gap: 8 }}>{taskFiles.filter(file => ['draft', 'for_print'].includes(file.tag)).length ? taskFiles.filter(file => ['draft', 'for_print'].includes(file.tag)).map(renderTaskFileCard) : <Text style={[s.detailMeta, { color: colors.mutedForeground }]}>No artwork files</Text>}</View>

                <View style={s.fileSectionHeader}><View style={s.sectionHeading}><View style={[s.sectionAccent, { backgroundColor: colors.primary }]} /><Text style={[s.sectionHeadingText, { color: colors.foreground }]}>Attachments</Text><Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{taskFiles.filter(file => !['draft', 'for_print'].includes(file.tag)).length}</Text></View>{taskFiles.filter(file => !['draft', 'for_print'].includes(file.tag)).length ? <TouchableOpacity onPress={() => taskFiles.filter(file => !['draft', 'for_print'].includes(file.tag)).forEach(file => void downloadTaskFile(file))}><Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800' }}>DOWNLOAD ALL</Text></TouchableOpacity> : null}</View>
                <View style={{ gap: 8 }}>{taskFiles.filter(file => !['draft', 'for_print'].includes(file.tag)).length ? taskFiles.filter(file => !['draft', 'for_print'].includes(file.tag)).map(renderTaskFileCard) : <Text style={[s.detailMeta, { color: colors.mutedForeground }]}>No attachments</Text>}</View>

                <View style={[s.activityTabs, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}>
                  <TouchableOpacity onPress={() => setDetailTab('comments')} style={[s.activityTab, detailTab === 'comments' && { backgroundColor: colors.glassHover }]}><MessageSquare size={14} color={detailTab === 'comments' ? colors.primary : colors.mutedForeground} /><Text style={{ color: detailTab === 'comments' ? colors.foreground : colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>Comments</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => setDetailTab('activity')} style={[s.activityTab, detailTab === 'activity' && { backgroundColor: colors.glassHover }]}><Activity size={14} color={detailTab === 'activity' ? colors.primary : colors.mutedForeground} /><Text style={{ color: detailTab === 'activity' ? colors.foreground : colors.mutedForeground, fontSize: 11, fontWeight: '700' }}>All activity</Text></TouchableOpacity>
                </View>

                {detailTab === 'comments' ? (
                  <View style={{ gap: 8 }}>{(selectedTask?.comments || []).length ? [...selectedTask.comments].sort((a: any, b: any) => Number(!!b.pinned) - Number(!!a.pinned)).map((comment: any, index: number) => <View key={comment._id || index} style={[s.commentRow, { borderColor: colors.glassBorder, backgroundColor: colors.glass }]}><View style={[s.commentAvatar, { backgroundColor: colors.primary }]}><Text style={{ color: '#000', fontWeight: '900', fontSize: 10 }}>{String(comment.userName || comment.user?.name || 'U').slice(0, 1).toUpperCase()}</Text></View><View style={{ flex: 1 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}><Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '800' }}>{comment.userName || comment.user?.name || 'Team member'}{comment.pinned ? '  • PINNED' : ''}</Text><Text style={{ color: colors.mutedForeground, fontSize: 9 }}>{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('en-MY') : ''}</Text></View><Text style={[s.detailText, { color: colors.foreground, marginTop: 4 }]}>{comment.text || comment.comment || ''}</Text></View></View>) : <Text style={[s.detailMeta, { color: colors.mutedForeground }]}>No comments yet.</Text>}</View>
                ) : (
                  <View style={{ gap: 8 }}>{(selectedTask?.activities || []).length ? [...selectedTask.activities].reverse().map((activity: any, index: number) => <View key={activity._id || index} style={[s.activityRow, { borderColor: colors.glassBorder }]}><Activity size={13} color={colors.primary} /><View style={{ flex: 1 }}><Text style={{ color: colors.foreground, fontSize: 11 }}>{activity.message || activity.action || activity.type || 'Task updated'}</Text><Text style={{ color: colors.mutedForeground, fontSize: 9, marginTop: 2 }}>{activity.createdAt ? new Date(activity.createdAt).toLocaleString('en-MY') : ''}</Text></View></View>) : <Text style={[s.detailMeta, { color: colors.mutedForeground }]}>No activity yet.</Text>}</View>
                )}
              </ScrollView>
            )}
          </FrostedView>
        </View>
      </Modal>

      <Modal visible={!!taskPreviewFile} transparent animationType="fade" onRequestClose={() => setTaskPreviewFile(null)}>
        <View style={s.previewOverlay}>
          <FrostedView intensity={88} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.previewModal, { borderColor: colors.glassBorder, backgroundColor: 'rgba(8,8,8,0.78)', paddingTop: insets.top + 8 }]}>
            <View style={s.previewHeader}><Text style={{ flex: 1, color: colors.foreground, fontWeight: '800' }} numberOfLines={1}>{taskPreviewFile?.name || 'Preview'}</Text><TouchableOpacity onPress={() => setTaskPreviewFile(null)} style={s.detailClose}><X size={20} color={colors.foreground} /></TouchableOpacity></View>
            {taskPreviewFile ? isImageFile(taskPreviewFile)
              ? <Image source={{ uri: taskFileUrl(taskPreviewFile, true), headers: token ? { Authorization: `Bearer ${token}` } : {} }} style={s.previewBody} contentFit="contain" />
              : <WebView source={{ uri: taskFileUrl(taskPreviewFile, true), headers: token ? { Authorization: `Bearer ${token}` } : {} }} style={s.previewBody} startInLoadingState renderLoading={() => <ActivityIndicator color={colors.primary} style={StyleSheet.absoluteFill} />} />
              : null}
            <TouchableOpacity onPress={() => void downloadTaskFile(taskPreviewFile)} style={[s.previewDownload, { backgroundColor: colors.primary }]}><Download size={16} color="#000" /><Text style={{ color: '#000', fontWeight: '900' }}>Download / Share</Text></TouchableOpacity>
          </FrostedView>
        </View>
      </Modal>

      {/* Status Picker Modal */}
      <Modal visible={statusPickerVisible} transparent animationType="slide" onRequestClose={() => setStatusPickerVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setStatusPickerVisible(false)}>
          <FrostedView intensity={theme === 'dark' ? 72 : 84} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.modalContent, { backgroundColor: theme === 'dark' ? 'rgba(10,10,14,0.74)' : 'rgba(255,255,255,0.72)' }]}>
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
          </FrostedView>
        </TouchableOpacity>
      </Modal>

      {/* User Picker Modal */}
      <Modal visible={userPickerVisible} transparent animationType="slide" onRequestClose={() => setUserPickerVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setUserPickerVisible(false)}>
          <FrostedView intensity={theme === 'dark' ? 72 : 84} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.modalContent, { backgroundColor: theme === 'dark' ? 'rgba(10,10,14,0.74)' : 'rgba(255,255,255,0.72)' }]}>
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
          </FrostedView>
        </TouchableOpacity>
      </Modal>

      <Modal visible={sortPickerVisible} transparent animationType="slide" onRequestClose={() => setSortPickerVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setSortPickerVisible(false)}>
          <FrostedView intensity={theme === 'dark' ? 72 : 84} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.modalContent, { backgroundColor: theme === 'dark' ? 'rgba(10,10,14,0.74)' : 'rgba(255,255,255,0.72)' }]}>
            <View style={s.modalHeader}><Text style={[s.modalTitle, { color: colors.foreground }]}>Sort Tasks</Text><TouchableOpacity onPress={() => setSortPickerVisible(false)}><X color={colors.foreground} size={20}/></TouchableOpacity></View>
            {[['dateDesc', 'Newest First'], ['dateAsc', 'Oldest First'], ['nameAsc', 'Name (A-Z)'], ['nameDesc', 'Name (Z-A)']].map(([value, label]) => (
              <TouchableOpacity key={value} style={[s.modalOption, { borderBottomColor: colors.glassBorder }]} onPress={() => { setSortOption(value as typeof sortOption); setSortPickerVisible(false); }}><Text style={[s.modalOptionText, { color: colors.foreground }]}>{label}</Text></TouchableOpacity>
            ))}
          </FrostedView>
        </TouchableOpacity>
      </Modal>

      <Modal visible={assigneeFilterVisible} transparent animationType="slide" onRequestClose={() => setAssigneeFilterVisible(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setAssigneeFilterVisible(false)}>
          <FrostedView intensity={theme === 'dark' ? 72 : 84} tint={theme === 'dark' ? 'dark' : 'light'} style={[s.modalContent, { backgroundColor: theme === 'dark' ? 'rgba(10,10,14,0.74)' : 'rgba(255,255,255,0.72)' }]}>
            <View style={s.modalHeader}><Text style={[s.modalTitle, { color: colors.foreground }]}>Filter by Assignee</Text><TouchableOpacity onPress={() => setAssigneeFilterVisible(false)}><X color={colors.foreground} size={20}/></TouchableOpacity></View>
            {[['all', 'All Users'], ['unassigned', 'Unassigned'], ...users.map(user => [user._id, user.name || user.email])].map(([value, label]) => (
              <TouchableOpacity key={value} style={[s.modalOption, { borderBottomColor: colors.glassBorder }]} onPress={() => { setAssigneeFilter(value); setAssigneeFilterVisible(false); }}><Text style={[s.modalOptionText, { color: colors.foreground }]}>{label}</Text></TouchableOpacity>
            ))}
          </FrostedView>
        </TouchableOpacity>
      </Modal>

    </AppBackground>
  );
}

function mergeTaskFiles(embeddedFiles: any[], uploads: any[]) {
  const enriched = embeddedFiles.map(file => {
    const match = uploads.find(upload => upload.path === file.url || (file.name && upload.originalName === file.name));
    return {
      ...file,
      name: file.name || file.originalName || file.filename,
      fileUploadId: match?._id,
      mimetype: file.mimetype || match?.mimetype,
      notes: file.notes || match?.notes || match?.adminNotes,
      tag: file.tag || match?.tag || 'customer_upload',
      createdAt: file.createdAt || match?.createdAt || match?.uploadedAt,
    };
  });
  const uploadedFiles = uploads.filter(upload => !enriched.some(file => file.url === upload.path || (file.name && upload.originalName === file.name))).map(upload => ({
    _id: upload._id,
    fileUploadId: upload._id,
    url: upload.path,
    name: upload.originalName || upload.filename,
    mimetype: upload.mimetype,
    notes: upload.notes || upload.adminNotes,
    tag: upload.tag || 'customer_upload',
    createdAt: upload.createdAt || upload.uploadedAt,
  }));
  const priority = (tag: string) => tag === 'draft' ? 0 : tag === 'for_print' ? 1 : 2;
  return [...enriched, ...uploadedFiles].sort((a, b) => {
    const groupDifference = priority(a.tag) - priority(b.tag);
    if (groupDifference) return groupDifference;
    const direction = priority(a.tag) === 2 ? 1 : -1;
    return direction * (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  });
}

function isImageFile(file: any) {
  return String(file.mimetype || '').startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(file.name || file.url || ''));
}

function descriptionToEditorHtml(description: unknown) {
  const value = String(description || '');
  if (/<[a-z][\s\S]*>/i.test(value)) return sanitizeDescriptionHtml(value);
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

function sanitizeDescriptionHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(["']).*?\1/gi, '')
    .replace(/javascript\s*:/gi, '');
}

function descriptionEditorDocument(value: string, foreground: string, muted: string) {
  const initial = JSON.stringify(sanitizeDescriptionHtml(value));
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>*{box-sizing:border-box}html,body{margin:0;background:transparent;color:${foreground};font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.55}#editor{min-height:148px;padding:12px;outline:none}#editor:empty:before{content:'Add task description...';color:${muted}}p{margin:0 0 8px}ul,ol{margin:4px 0;padding-left:22px}a{color:#e7b008}</style></head><body><div id="editor" contenteditable="true"></div><script>const editor=document.getElementById('editor');editor.innerHTML=${initial};editor.focus();editor.addEventListener('input',()=>window.ReactNativeWebView.postMessage(editor.innerHTML));</script></body></html>`;
}

function descriptionToText(description: unknown) {
  return String(description || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
  filterBar: { flexDirection: 'row', gap: 8, marginTop: 10 },
  filterButton: { flex: 1, minWidth: 0, height: 34, borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  filterText: { flex: 1, fontSize: 11, fontWeight: '600' },
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
  emptyText: { textAlign: 'center', marginTop: 48, fontSize: 14 },
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.62)', justifyContent: 'flex-end' },
  detailModal: { height: '88%', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, paddingHorizontal: 18, overflow: 'hidden' },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)', alignSelf: 'center', marginBottom: 14 },
  detailTitle: { fontSize: 20, lineHeight: 25, fontWeight: '900', letterSpacing: -0.4 },
  detailClose: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  detailPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailPill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionAccent: { width: 3, height: 16, borderRadius: 2 },
  sectionHeadingText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.2 },
  descriptionCard: { padding: 14, borderRadius: 12, borderWidth: 1 },
  inlineEdit: { minHeight: 28, paddingHorizontal: 8, borderRadius: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  descriptionInput: { height: 150, borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  descriptionActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  descriptionButton: { minWidth: 88, height: 38, borderRadius: 9, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  propertyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  propertyCard: { width: '48.7%', borderRadius: 12, borderWidth: 1, padding: 11, gap: 5 },
  propertyLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  propertyValue: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  contextActions: { flexDirection: 'row', gap: 8 },
  contextButton: { flex: 1, minHeight: 42, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 8 },
  fileSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  fileCard: { minHeight: 62, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 8 },
  fileIcon: { width: 44, height: 44, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  fileThumbnail: { width: '100%', height: '100%' },
  fileTag: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 3 },
  fileActions: { flexDirection: 'row', gap: 2 },
  fileAction: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.05)' },
  activityTabs: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, padding: 3, marginTop: 2 },
  activityTab: { flex: 1, height: 34, borderRadius: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  commentRow: { borderRadius: 12, borderWidth: 1, padding: 11, flexDirection: 'row', gap: 9 },
  commentAvatar: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  activityRow: { minHeight: 42, borderBottomWidth: 1, paddingVertical: 9, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.86)', padding: 10 },
  previewModal: { flex: 1, borderRadius: 22, borderWidth: 1, overflow: 'hidden', padding: 12 },
  previewHeader: { height: 46, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  previewBody: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#050505' },
  previewDownload: { minHeight: 46, borderRadius: 12, marginTop: 10, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  detailSection: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 5 },
  detailLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  detailText: { fontSize: 13, lineHeight: 19 },
  detailMeta: { fontSize: 11, marginTop: 2 },
});
