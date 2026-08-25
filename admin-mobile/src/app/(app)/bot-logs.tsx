import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Bot, Pause, Play } from 'lucide-react-native';
import { ScreenShell, Card, EmptyState, Loading } from '../../components/ui/kit';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

function lineColor(message: string, colors: any) {
  const m = message || '';
  if (m.includes('[ERROR]')) return '#ef4444';
  if (m.includes('[WARN]')) return '#f59e0b';
  if (m.includes('[INCOMING]') || m.includes('[TELEGRAM]')) return '#a78bfa';
  if (m.includes('[AI REPLY]') || m.includes('[AI TOOL CALL]') || m.includes('[UPLOAD OK]')) return '#10b981';
  if (m.includes('[SYSTEM]') || m.includes('[AUTH]') || m.includes('[OK]')) return colors.primary;
  return colors.mutedForeground;
}

export default function BotLogsScreen() {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!live && !loading) return;
    let active = true;
    const tick = async () => {
      try {
        const res = await api.get('/sysadmin/bot-logs');
        if (!active) return;
        setLogs(res.data?.logs || []);
        setError(null);
      } catch (e: any) {
        if (!active) return;
        setError(e?.response?.status === 403 ? 'Sysadmin access required.' : 'Could not reach log stream.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void tick();
    const id = setInterval(tick, 2000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [live, loading]);

  if (user?.role !== 'sysadmin') {
    return (
      <ScreenShell title="Bot Logs" subtitle="Telegram bot console" icon={Bot}>
        <EmptyState icon={Bot} title="Restricted" message="Only sysadmins can view bot logs." />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Bot Logs"
      subtitle={live ? `Live · ${logs.length} lines` : 'Paused'}
      icon={Bot}
      right={
        <TouchableOpacity
          onPress={() => setLive((v) => !v)}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.12)', alignItems: 'center', justifyContent: 'center' }}
        >
          {live ? <Pause size={18} color={colors.primary} /> : <Play size={18} color={colors.primary} />}
        </TouchableOpacity>
      }
    >
      {error ? (
        <View style={{ paddingHorizontal: 16 }}>
          <Card><Text style={{ color: colors.destructive, fontSize: 13 }}>{error}</Text></Card>
        </View>
      ) : null}
      {loading ? (
        <Loading />
      ) : (
        <FlatList
          ref={listRef}
          data={logs}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 3 }}
          onContentSizeChange={() => live && listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<EmptyState icon={Bot} title="No logs yet" message="Bot activity will stream here." />}
          renderItem={({ item }) => (
            <Text style={{ fontFamily: undefined, fontSize: 11, lineHeight: 15, color: lineColor(item.message, colors) }} selectable>
              {item.timestamp ? new Date(item.timestamp).toLocaleTimeString('en-MY') + '  ' : ''}
              {item.message}
            </Text>
          )}
        />
      )}
    </ScreenShell>
  );
}
