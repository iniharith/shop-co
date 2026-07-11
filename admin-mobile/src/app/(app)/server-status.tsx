import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ActivityIndicator, TouchableOpacity, RefreshControl,
  ScrollView, Modal, StyleSheet, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Server, CheckCircle2, XCircle, Activity, Database,
  Globe, Train, Cloud, Archive, RefreshCw, X, ChevronLeft
} from 'lucide-react-native';
import api from '../../services/api';
import { THEME } from '../../constants/theme';
import { useRouter } from 'expo-router';

const AUTO_REFRESH_MS = 10000;

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds: number) {
  if (!seconds) return '0m';
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={[s.pill, { backgroundColor: ok ? '#22c55e18' : '#ef444418', borderColor: ok ? '#22c55e44' : '#ef444444' }]}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: ok ? '#22c55e' : '#ef4444', marginRight: 6 }} />
      <Text style={{ color: ok ? '#22c55e' : '#ef4444', fontSize: 10, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

function ServiceCard({ icon, title, subtitle, status, ok, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1} style={{ flex: 1 }}>
      <BlurView intensity={20} tint="dark" style={s.serviceCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {icon}
          <View style={{ flex: 1 }}>
            <Text style={{ color: THEME.foreground, fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{title}</Text>
            <Text style={{ color: THEME.mutedForeground, fontSize: 10 }} numberOfLines={1}>{subtitle}</Text>
          </View>
        </View>
        <StatusPill ok={ok} label={status || 'UNKNOWN'} />
        {onPress && <Text style={{ color: THEME.mutedForeground, fontSize: 10, marginTop: 4 }}>Tap to view history</Text>}
      </BlurView>
    </TouchableOpacity>
  );
}

export default function ServerStatusScreen() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Deployments modal
  const [deploymentsOpen, setDeploymentsOpen] = useState(false);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loadingDeploys, setLoadingDeploys] = useState(false);

  // Logs modal
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await api.get('/sysadmin/health');
      if (res.data?.success) setData(res.data.data);
    } catch (e) {
      console.error('health fetch failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchDeployments = async () => {
    setDeploymentsOpen(true);
    setLoadingDeploys(true);
    try {
      const res = await api.get('/sysadmin/deployments');
      if (res.data?.success) setDeployments(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingDeploys(false); }
  };

  const fetchLogs = async () => {
    setLogsOpen(true);
    setLoadingLogs(true);
    try {
      const res = await api.get('/sysadmin/logs');
      if (res.data?.success) setLogs(res.data.data || 'No logs.');
    } catch (e) { setLogs('Failed to load logs.'); }
    finally { setLoadingLogs(false); }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const onRefresh = () => { setRefreshing(true); fetchHealth(); };

  if (loading && !data) {
    return (
      <LinearGradient colors={['#0a0a14', '#100a1e', '#0a0a14']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={THEME.primary} />
      </LinearGradient>
    );
  }

  const server = data?.server || {};
  const database = data?.database || {};
  const external = data?.external || {};
  const application = data?.application || {};
  const ramPct = server.totalMem > 0 ? Math.round((server.usedMem / server.totalMem) * 100) : 0;
  const diskPct = server.diskTotal > 0 ? Math.round(((server.diskTotal - server.diskFree) / server.diskTotal) * 100) : 0;
  const cpuLoad = (server.cpuLoad?.[0] || 0).toFixed(2);

  return (
    <LinearGradient colors={['#0a0a14', '#100a1e', '#0a0a14']} style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <BlurView intensity={20} tint="dark" style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <ChevronLeft size={22} color={THEME.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.pageTitle}>Server Status</Text>
          <Text style={s.pageSub}>Your Server Health Snapshot · Auto-refreshes every 10s</Text>
        </View>
        <TouchableOpacity onPress={fetchHealth} style={s.refreshBtn}>
          <RefreshCw size={14} color={THEME.primary} />
        </TouchableOpacity>
      </BlurView>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 130, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
      >
        {!data ? (
          <BlurView intensity={20} tint="dark" style={[s.glassCard, { alignItems: 'center', paddingVertical: 40 }]}>
            <Text style={{ color: THEME.mutedForeground }}>Could not load server health data.</Text>
          </BlurView>
        ) : (
          <>
            {/* ── RAM + CPU row ── */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* RAM */}
              <BlurView intensity={20} tint="dark" style={[s.glassCard, { flex: 1, backgroundColor: '#22c55e0a', borderColor: '#22c55e33' }]}>
                <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>RAM Usage</Text>
                <Text style={{ color: '#4ade80', fontSize: 40, fontWeight: '800' }}>
                  {ramPct}<Text style={{ fontSize: 18 }}>%</Text>
                </Text>
                <Text style={{ color: '#4ade80', fontSize: 11, marginTop: 4, opacity: 0.8 }}>
                  {formatBytes(server.usedMem)} used
                </Text>
                <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, marginTop: 10, overflow: 'hidden' }}>
                  <View style={{ width: `${ramPct}%`, height: '100%', backgroundColor: '#22c55e', borderRadius: 6 }} />
                </View>
              </BlurView>

              {/* CPU */}
              <BlurView intensity={20} tint="dark" style={[s.glassCard, { flex: 1 }]}>
                <Text style={{ color: THEME.mutedForeground, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>CPU Load</Text>
                <Text style={{ color: THEME.foreground, fontSize: 40, fontWeight: '800' }}>{cpuLoad}</Text>
                <Text style={{ color: THEME.mutedForeground, fontSize: 11, marginTop: 4 }}>1-min avg</Text>
                <View style={{ marginTop: 10, gap: 4 }}>
                  {(server.cpuLoad || [0, 0, 0]).slice(0, 3).map((v: number, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: THEME.mutedForeground, fontSize: 10, width: 40 }}>{['1m', '5m', '15m'][i]}</Text>
                      <View style={{ flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{ width: `${Math.min(100, v * 10)}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: 4 }} />
                      </View>
                      <Text style={{ color: THEME.mutedForeground, fontSize: 10, width: 32, textAlign: 'right' }}>{v.toFixed(1)}</Text>
                    </View>
                  ))}
                </View>
              </BlurView>
            </View>

            {/* ── Disk Capacity ── */}
            <BlurView intensity={20} tint="dark" style={s.glassCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: THEME.mutedForeground, fontSize: 12, fontWeight: '600' }}>Disk Capacity</Text>
                <Text style={{ color: THEME.foreground, fontSize: 12, fontWeight: '700' }}>{diskPct}%</Text>
              </View>
              <View style={{ height: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
                <View style={{ width: `${diskPct}%`, height: '100%', backgroundColor: THEME.foreground, borderRadius: 10 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ color: THEME.mutedForeground, fontSize: 11 }}>{formatBytes((server.diskTotal || 0) - (server.diskFree || 0))} used</Text>
                <Text style={{ color: THEME.mutedForeground, fontSize: 11 }}>{formatBytes(server.diskTotal || 0)} total</Text>
              </View>
            </BlurView>

            {/* ── Application Stats ── */}
            <BlurView intensity={20} tint="dark" style={s.glassCard}>
              <Text style={s.sectionTitle}>Application Stats</Text>
              <View style={{ gap: 10, marginTop: 10 }}>
                {[
                  { label: 'Total Artwork Files', value: application.artworkTotal || 0 },
                  { label: 'Total Tasks', value: application.taskTotal || 0 },
                  { label: 'Storage Used', value: formatBytes(application.storageUsed || 0) },
                  { label: 'Uptime', value: formatUptime(server.uptime || 0) },
                ].map(({ label, value }) => (
                  <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: THEME.glassBorder }}>
                    <Text style={{ color: THEME.mutedForeground, fontSize: 13 }}>{label}</Text>
                    <Text style={{ color: THEME.foreground, fontSize: 13, fontWeight: '700' }}>{value}</Text>
                  </View>
                ))}
              </View>
            </BlurView>

            {/* ── External Services ── */}
            <Text style={s.sectionTitle}>External Services</Text>
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <ServiceCard
                  icon={<View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><Globe size={18} color="#000" /></View>}
                  title="Vercel (Frontend)"
                  subtitle="kampungcetak.com"
                  status={external.vercel?.readyState || 'UNKNOWN'}
                  ok={external.vercel?.readyState === 'READY'}
                  onPress={fetchDeployments}
                />
                <ServiceCard
                  icon={<View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#13111C', borderWidth: 1, borderColor: THEME.glassBorder, alignItems: 'center', justifyContent: 'center' }}><Train size={18} color="#fff" /></View>}
                  title="Railway (Backend)"
                  subtitle={external.railway?.environment || 'Production'}
                  status={external.railway?.status || 'UNKNOWN'}
                  ok={external.railway?.status === 'ACTIVE'}
                  onPress={fetchDeployments}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <ServiceCard
                  icon={<View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FF990018', alignItems: 'center', justifyContent: 'center' }}><Cloud size={18} color="#FF9900" /></View>}
                  title="AWS S3 Server"
                  subtitle="kampungcetak-storage"
                  status={external.aws || 'UNKNOWN'}
                  ok={external.aws === 'ONLINE'}
                />
                <ServiceCard
                  icon={<View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#22c55e18', alignItems: 'center', justifyContent: 'center' }}><Database size={18} color="#22c55e" /></View>}
                  title="MongoDB Atlas"
                  subtitle={`${database.detailed?.connections?.current || 0} active conn`}
                  status={database.status || 'Unknown'}
                  ok={database.status === 'Connected'}
                />
              </View>

              {/* Server Logs card */}
              <TouchableOpacity onPress={fetchLogs} activeOpacity={0.7}>
                <BlurView intensity={20} tint="dark" style={[s.glassCard, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#ef444418', alignItems: 'center', justifyContent: 'center' }}>
                    <Archive size={20} color="#ef4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: THEME.foreground, fontWeight: '600' }}>Server Error Logs</Text>
                    <Text style={{ color: THEME.mutedForeground, fontSize: 11 }}>error.log · tap to view</Text>
                  </View>
                  <StatusPill ok={false} label="View Logs" />
                </BlurView>
              </TouchableOpacity>
            </View>

            {/* ── Force Refresh ── */}
            <TouchableOpacity onPress={fetchHealth} style={s.refreshFullBtn}>
              <RefreshCw size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Force Refresh Analytics</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ── Deployments Modal ── */}
      <Modal visible={deploymentsOpen} animationType="slide" onRequestClose={() => setDeploymentsOpen(false)}>
        <LinearGradient colors={['#0a0a0a', '#111']} style={{ flex: 1 }}>
          <StatusBar barStyle="light-content" />
          <View style={s.modalHeader}>
            <Globe size={18} color="#60a5fa" />
            <Text style={s.modalTitle}>Deployment History</Text>
            <TouchableOpacity onPress={() => setDeploymentsOpen(false)} style={{ marginLeft: 'auto' }}>
              <X size={22} color={THEME.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
            {loadingDeploys ? (
              <ActivityIndicator color={THEME.primary} style={{ marginTop: 40 }} />
            ) : deployments.length === 0 ? (
              <Text style={{ color: THEME.mutedForeground, textAlign: 'center', marginTop: 40 }}>No deployment history available.</Text>
            ) : deployments.map((dep: any, i: number) => {
              const isOk = ['READY', 'SUCCESS'].includes(dep.status);
              const isErr = ['ERROR', 'FAILED'].includes(dep.status);
              return (
                <BlurView key={i} intensity={15} tint="dark" style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    {dep.service?.includes('Vercel') ? <Globe size={14} color="#60a5fa" /> : <Train size={14} color="#a78bfa" />}
                    <Text style={{ color: THEME.foreground, fontWeight: '600', flex: 1 }} numberOfLines={1}>{dep.commitMessage}</Text>
                    <View style={[s.pill, { backgroundColor: isOk ? '#22c55e18' : isErr ? '#ef444418' : '#eab30818', borderColor: isOk ? '#22c55e44' : isErr ? '#ef444444' : '#eab30844' }]}>
                      {isOk ? <CheckCircle2 size={10} color="#22c55e" /> : <XCircle size={10} color={isErr ? '#ef4444' : '#eab308'} />}
                      <Text style={{ color: isOk ? '#22c55e' : isErr ? '#ef4444' : '#eab308', fontSize: 10, fontWeight: '700', marginLeft: 4 }}>{dep.status}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ backgroundColor: '#1f2937', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#374151' }}>
                      <Text style={{ color: '#d1d5db', fontSize: 10 }}>{dep.branch}</Text>
                    </View>
                    <Text style={{ color: THEME.mutedForeground, fontSize: 10, flex: 1 }}>{dep.environment}</Text>
                    <Text style={{ color: THEME.mutedForeground, fontSize: 10 }}>{dep.createdAt ? new Date(dep.createdAt).toLocaleDateString('en-MY') : ''}</Text>
                  </View>
                </BlurView>
              );
            })}
          </ScrollView>
        </LinearGradient>
      </Modal>

      {/* ── Logs Modal ── */}
      <Modal visible={logsOpen} animationType="slide" onRequestClose={() => setLogsOpen(false)}>
        <LinearGradient colors={['#0a0a0a', '#111']} style={{ flex: 1 }}>
          <StatusBar barStyle="light-content" />
          <View style={s.modalHeader}>
            <Archive size={18} color="#ef4444" />
            <Text style={s.modalTitle}>Server Error Logs</Text>
            <TouchableOpacity onPress={() => setLogsOpen(false)} style={{ marginLeft: 'auto' }}>
              <X size={22} color={THEME.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {loadingLogs ? (
              <ActivityIndicator color={THEME.primary} style={{ marginTop: 40 }} />
            ) : (
              <Text style={{ color: '#4ade80', fontSize: 11, fontFamily: 'monospace', lineHeight: 18 }}>
                {logs || 'No logs available.'}
              </Text>
            )}
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingTop: 54, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: THEME.glassBorder,
  },
  pageTitle: { fontSize: 20, fontWeight: '800', color: THEME.foreground },
  pageSub: { color: THEME.mutedForeground, fontSize: 11, marginTop: 2 },
  refreshBtn: { padding: 8, borderRadius: 10, borderWidth: 1, borderColor: THEME.glassBorder, backgroundColor: THEME.glass },
  glassCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 16 },
  serviceCard: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: THEME.glassBorder, padding: 14, gap: 10 },
  sectionTitle: { color: THEME.foreground, fontSize: 15, fontWeight: '700' },
  pill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  refreshFullBtn: {
    backgroundColor: '#3b82f6', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  modalHeader: {
    paddingTop: 54, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderBottomWidth: 1, borderBottomColor: THEME.glassBorder,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.foreground },
});
