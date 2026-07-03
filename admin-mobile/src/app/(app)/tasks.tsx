import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import api from '../../services/api';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      if (res.data) {
        const all = res.data.data || res.data.tasks || res.data || [];
        setTasks(Array.isArray(all) ? all : []);
      }
    } catch (e) {
      console.error('Failed to fetch tasks:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchTasks(); };

  // Group by task status
  const todoTasks       = tasks.filter(t => t.status === 'todo'        || t.status === 'TO_DO'       || t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'IN_PROGRESS' || t.status === 'processing');
  const doneTasks       = tasks.filter(t => t.status === 'done'        || t.status === 'DONE'        || t.status === 'completed');

  const statusColor: Record<string, string> = {
    todo: '#94a3b8',
    TO_DO: '#94a3b8',
    pending: '#94a3b8',
    in_progress: '#f59e0b',
    IN_PROGRESS: '#f59e0b',
    processing: '#f59e0b',
    done: '#22c55e',
    DONE: '#22c55e',
    completed: '#22c55e',
  };

  const TaskCard = ({ task }: { task: any }) => {
    const color = statusColor[task.status] || '#94a3b8';
    return (
      <TouchableOpacity
        className="bg-card border border-border p-4 rounded-xl mb-3 shadow-sm active:opacity-70"
        style={{ borderLeftWidth: 3, borderLeftColor: color }}
      >
        <View className="flex-row justify-between items-start mb-1">
          <Text className="text-foreground font-semibold text-sm flex-1 mr-2" numberOfLines={2}>
            {task.title || task.name || `Task #${task._id?.slice(-6) || '?'}`}
          </Text>
          <View style={{ backgroundColor: color + '22', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ color, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
              {task.status?.replace(/_/g, ' ') || 'unknown'}
            </Text>
          </View>
        </View>
        {task.description ? (
          <Text className="text-muted-foreground text-xs mt-1" numberOfLines={2}>{task.description}</Text>
        ) : null}
        {task.orderId ? (
          <Text className="text-muted-foreground text-xs mt-1">Order: {typeof task.orderId === 'object' ? task.orderId?._id?.slice(-6) : String(task.orderId).slice(-6)}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const Section = ({ title, items, accentColor }: { title: string; items: any[]; accentColor: string }) => (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-bold text-foreground">{title}</Text>
        <View style={{ backgroundColor: accentColor + '22', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
          <Text style={{ color: accentColor, fontSize: 12, fontWeight: '700' }}>{items.length}</Text>
        </View>
      </View>
      {items.length === 0 ? (
        <View className="bg-card border border-border border-dashed p-6 rounded-xl items-center justify-center">
          <Text className="text-muted-foreground text-sm font-medium">No tasks here</Text>
        </View>
      ) : (
        items.map((task, idx) => <TaskCard key={task._id || idx} task={task} />)
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-background pt-12 px-5">
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-3xl font-extrabold tracking-tight text-foreground">Tasks</Text>
          <Text className="text-muted-foreground text-sm mt-1 font-medium">
            Manage your operational workflow
          </Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="hsl(45, 93%, 47%)" />
          <Text className="text-muted-foreground mt-3 text-sm">Loading tasks…</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="hsl(45, 93%, 47%)" />}
        >
          <Section title="To Do"       items={todoTasks}       accentColor="#94a3b8" />
          <Section title="In Progress" items={inProgressTasks} accentColor="#f59e0b" />
          <Section title="Done"        items={doneTasks}       accentColor="#22c55e" />
        </ScrollView>
      )}
    </View>
  );
}
