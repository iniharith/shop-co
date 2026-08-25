import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { ChevronLeft, ChevronRight, RotateCcw, ScrollText, Search } from 'lucide-react-native';
import { ScreenShell, Card, EmptyState, Loading, SectionTitle, Chip } from '../../../components/ui/kit';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../services/api';

const PAGE_SIZE = 50;

export default function AuditLogScreen() {
  const { colors } = useTheme();
  const [rows, setRows] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actors, setActors] = useState<any[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [q, setQ] = useState('');
  const [action, setAction] = useState('');
  const [actor, setActor] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sortBy = 'date';

  useEffect(() => {
    api.get('/audit-logs/filters')
      .then((res) => {
        setActors(res.data?.actors || []);
        setActions(res.data?.actions?.length ? res.data.actions : ['LOGIN', 'CREATE_TASK', 'UPDATE_TASK_STATUS', 'DELETE_TASK', 'CREATE_ORDER', 'UPDATE_ORDER', 'UPLOAD_FILE']);
      })
      .catch(() => setActions(['LOGIN', 'CREATE_TASK', 'UPDATE_TASK_STATUS']));
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sortOrder });
      if (sortBy) params.set('sortBy', sortBy);
      if (q.trim().length >= 2) params.set('q', q.trim());
      if (action) params.set('action', action);
      if (actor) params.set('actor', actor);
      const res = await api.get(`/audit-logs?${params.toString()}`);
      setRows(res.data?.logs || []);
      setPages(res.data?.pagination?.pages || 1);
      setTotal(res.data?.pagination?.total || 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, q, action, actor, sortOrder]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void fetchLogs(), 250);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [fetchLogs]);

  const reset = () => {
    setQ(''); setAction(''); setActor(''); setPage(1); setSortOrder('desc');
  };

  const actorName = useMemo(() => new Map(actors.map((a) => [a.value, a])), [actors]);

  return (
    <ScreenShell title="Audit Log" subtitle={`${total} activities recorded`} icon={ScrollText}>
      <View style={{ padding: 16, paddingBottom: 0, gap: 10 }}>
        <View style={[st.searchRow, { borderColor: colors.glassBorder, backgroundColor: colors.secondary }]}>
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            placeholder="Search summary or route…"
            placeholderTextColor={colors.mutedForeground}
            value={q}
            onChangeText={(t) => { setQ(t); setPage(1); }}
            style={[st.input, { color: colors.foreground }]}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Chip label={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'} active onPress={() => { setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); setPage(1); }} />
          <TouchableOpacity onPress={reset} style={[st.reset, { borderColor: colors.glassBorder }]}>
            <RotateCcw size={13} color={colors.mutedForeground} />
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Reset</Text>
          </TouchableOpacity>
        </View>
        {actor || action ? (
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {actor ? (
              <Chip label={`Actor: ${(actorName.get(actor) as any)?.name || actor}`} active onPress={() => setActor('')} />
            ) : null}
            {action ? <Chip label={action.replace(/_/g, ' ')} active onPress={() => setAction('')} /> : null}
          </View>
        ) : null}
      </View>

      {loading && rows.length === 0 ? (
        <Loading />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item._id || String(item.createdAt)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 10 }}
          ListHeaderComponent={<SectionTitle>Activity</SectionTitle>}
          ListEmptyComponent={<EmptyState icon={ScrollText} title="No matching activity" message="Try adjusting filters." />}
          renderItem={({ item }) => (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: colors.foreground }} numberOfLines={2}>
                  {item.summary || item.action}
                </Text>
                <View style={{ backgroundColor: 'rgba(59,130,246,0.14)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: colors.primary }}>{String(item.action || '').replace(/_/g, ' ')}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 5 }}>
                {item.actorName || 'System'}{item.actorRole ? ` · ${item.actorRole}` : ''}
                {item.method && item.route ? ` · ${item.method} ${item.route}` : ''}
              </Text>
              <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 2 }}>
                {item.createdAt ? new Date(item.createdAt).toLocaleString('en-MY') : ''}
              </Text>
            </Card>
          )}
          ListFooterComponent={
            pages > 1 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingTop: 12 }}>
                <TouchableOpacity disabled={page <= 1} onPress={() => setPage((p) => Math.max(1, p - 1))} style={{ opacity: page <= 1 ? 0.4 : 1 }}>
                  <ChevronLeft size={22} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Page {page} / {pages}</Text>
                <TouchableOpacity disabled={page >= pages} onPress={() => setPage((p) => p + 1)} style={{ opacity: page >= pages ? 0.4 : 1 }}>
                  <ChevronRight size={22} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: 160 }}>
        <FlatList
          horizontal
          data={['All', ...actions.slice(0, 12)]}
          keyExtractor={(a) => a}
          contentContainerStyle={{ padding: 12, gap: 8, alignItems: 'flex-end' }}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Chip
              label={item === 'All' ? item : item.replace(/_/g, ' ').toLowerCase()}
              active={item === 'All' ? !action : action === item}
              onPress={() => { setAction(item === 'All' ? '' : item); setPage(1); }}
            />
          )}
        />
      </View>
    </ScreenShell>
  );
}

const st = {
  searchRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  input: { flex: 1, fontSize: 14, paddingVertical: 0 },
  reset: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
};
