import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, TextInput, View, Text } from 'react-native';
import { Search as SearchIcon, Sparkles } from 'lucide-react-native';
import { ScreenShell, Card, EmptyState, Chip } from '../../components/ui/kit';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';

const GROUP_META: Record<string, { label: string }> = {
  tasks: { label: 'Tasks' },
  orders: { label: 'Orders' },
  customers: { label: 'Customers' },
  files: { label: 'Files' },
  projects: { label: 'Projects' },
  tracking: { label: 'Tracking' },
};

export default function SearchScreen() {
  const { colors } = useTheme();
  const [q, setQ] = useState('');
  const [groups, setGroups] = useState<Record<string, any[]>>({});
  const [tookMs, setTookMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [ai, setAi] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (q.trim().length < 2) {
      setGroups({}); setAi(null); setTookMs(null);
      return;
    }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/admin/search?q=${encodeURIComponent(q.trim())}&limit=20`);
        setGroups(res.data?.groups || {});
        setTookMs(res.data?.tookMs ?? null);
      } catch {
        setGroups({});
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q]);

  const runAiSearch = async () => {
    if (q.trim().length < 2) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/search', {
        query: q.trim(),
        collections: ['products', 'tasks', 'files'],
        limit: 6,
        includeSummary: true,
        language: 'en',
      });
      setAi(res.data || {});
    } catch {
      setAi(null);
    } finally {
      setAiLoading(false);
    }
  };

  const renderHit = (g: string) => (item: any) => (
    <Card key={`${item.id || item._id}-${g}`} style={{ marginBottom: 8 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground }} numberOfLines={1}>
        {hitTitle(g, item)}
      </Text>
      <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 3 }} numberOfLines={2}>
        {hitSubtitle(g, item)}
      </Text>
    </Card>
  );

  return (
    <ScreenShell title="Search" subtitle="Across tasks, orders, files & more" icon={SearchIcon}>
      <View style={{ padding: 16, paddingBottom: 4, gap: 10 }}>
        <View style={[st.row, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}>
          <SearchIcon size={17} color={colors.mutedForeground} />
          <TextInput
            autoFocus
            placeholder="Search order #, customer, task…"
            placeholderTextColor={colors.mutedForeground}
            value={q}
            onChangeText={setQ}
            style={[st.input, { color: colors.foreground }]}
          />
          {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>
        <Chip
          label={aiLoading ? 'AI thinking…' : ai ? `AI: ${ai.expandedQueries?.slice(0, 2).join(', ') || 'done'}` : 'Ask AI about this'}
          active={false}
          onPress={() => void runAiSearch()}
        />
      </View>

      {ai ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <Card style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color={colors.primary} />
              <Text style={{ fontSize: 12, fontWeight: '800', color: colors.primary }}>AI Summary</Text>
            </View>
            {typeof ai.summary === 'string' ? (
              <Text style={{ fontSize: 12, color: colors.foreground, lineHeight: 18 }}>{ai.summary}</Text>
            ) : (
              ['products', 'tasks', 'files'].map((k) =>
                ai.groups?.[k]?.[0]?.snippet ? (
                  <Text key={k} style={{ fontSize: 12, color: colors.foreground, lineHeight: 17 }} numberOfLines={3}>
                    · {ai.groups[k][0].snippet}
                  </Text>
                ) : null,
              )
            )}
            {!ai.usedAi ? <Text style={{ fontSize: 10, color: colors.mutedForeground }}>Keyword fallback (AI unavailable)</Text> : null}
          </Card>
        </View>
      ) : null}

      <FlatList
        data={Object.keys(GROUP_META).filter((g) => (groups[g] || []).length > 0)}
        keyExtractor={(g) => g}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          q.trim().length >= 2 && !loading ? (
            <EmptyState icon={SearchIcon} title={`No results for “${q.trim()}”`} message="Try a different keyword or order number." />
          ) : (
            <EmptyState icon={SearchIcon} title="Start typing to search" message="Minimum 2 characters. Searches tasks, orders, customers, files, projects and tracking." />
          )
        }
        renderItem={({ item: g }) => {
          const hits = groups[g] || [];
          return (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.foreground }}>{GROUP_META[g].label}</Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground }}>{hits.length}{((groups as any).hasMore?.[g]) ? '+' : ''}</Text>
              </View>
              {hits.map(renderHit(g))}
            </View>
          );
        }}
        ListFooterComponent={
          tookMs != null ? (
            <Text style={{ textAlign: 'center', fontSize: 10, color: colors.mutedForeground }}>Searched in {Math.round(tookMs)}ms</Text>
          ) : null
        }
      />
    </ScreenShell>
  );
}

function hitTitle(g: string, item: any): string {
  switch (g) {
    case 'tasks': return item.title || `Task ${String(item._id || '').slice(-6)}`;
    case 'orders': return item.orderNumber || item.customerName || `Order ${String(item._id || '').slice(-6)}`;
    case 'customers': return item.name || item.email || 'Customer';
    case 'files': return item.name || item.originalName || item.filename || 'File';
    case 'projects': return item.title || 'Project';
    case 'tracking': return item.trackingNumber || 'Tracking';
    default: return String(item.title || item.name || item.id);
  }
}

function hitSubtitle(g: string, item: any): string {
  const bits: (string | null | undefined)[] = [];
  if (g === 'tasks') bits.push(item.status?.replace(/_/g, ' '), item.customerUsername, item.orderId ? `#${item.orderId}` : null);
  else if (g === 'orders') bits.push(item.status?.replace(/_/g, ' '), item.trackingNumber ? `AWB ${item.trackingNumber}` : null);
  else if (g === 'customers') bits.push(item.email, item.phoneNumber);
  else if (g === 'files') bits.push(item.mimetype, item.category);
  else if (g === 'projects') bits.push(item.description, `${item.fileCount ?? 0} files`);
  else if (g === 'tracking') bits.push(item.courier, item.status?.replace(/_/g, ' '), item.orderId ? `#${item.orderId}` : null);
  return bits.filter(Boolean).join(' · ');
}

const st = {
  row: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
};
