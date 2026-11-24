"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import AxiosInstance from '@/utils/axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Copy, Send, Bot } from 'lucide-react';

type Message = { _id: string; role: string; source: string; text: string; status: string; createdAt: string; parentId?: string; approval?: { id?: string; decision?: string } };
export default function AssistantPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [online, setOnline] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [deciding, setDeciding] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState<{ text: string; clientId: string } | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const token = session?.user?.token;
  const refresh = useCallback(async () => {
    if (!token) return;
    try { const { data } = await AxiosInstance(token).get('/api/owner-chat'); setMessages(data.messages); setOnline(data.workerOnline); setError(''); }
    catch (e: any) { setError(e.response?.data?.message || 'Could not load the shared conversation.'); }
  }, [token]);
  useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(), 3000); return () => clearInterval(timer); }, [refresh]);
  const lastId = messages[messages.length - 1]?._id;
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [lastId]);
  async function send() {
    if (!token || sending || (!text.trim() && !uncertain)) return;
    const request = uncertain || { text: text.trim(), clientId: crypto.randomUUID() };
    setSending(true);
    try { await AxiosInstance(token).post('/api/owner-chat/messages', request); setText(''); setUncertain(null); await refresh(); }
    catch (e: any) { setUncertain(request); toast.error(e.response?.data?.message || 'Delivery not confirmed. Retry uses the same request ID.'); }
    finally { setSending(false); }
  }
  async function decide(id: string, decision: string) {
    if (!token) return; setDeciding(id);
    try { await AxiosInstance(token).post(`/api/owner-chat/approvals/${id}`, { decision }); await refresh(); }
    catch (e: any) { toast.error(e.response?.data?.message || 'Could not save decision.'); } finally { setDeciding(null); }
  }
  return <div className="mx-auto flex h-[calc(100dvh-130px)] max-w-4xl flex-col p-4 sm:p-6">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="flex items-center gap-2 text-2xl font-semibold"><Bot className="h-6 w-6" />AI Assistant</h1>
        <p className="text-sm text-muted-foreground">Your private conversation, shared with Telegram.</p>
        <p className={`mt-1 text-xs ${online ? 'text-green-600' : 'text-amber-600'}`}>{online ? 'PC connected · requests run in order' : 'PC offline · messages wait in the queue'}</p></div>
      <Button variant="outline" size="sm" onClick={async () => { try { await navigator.clipboard.writeText('Shared Website / Telegram conversation — handoff for Codex\n\n' + messages.map(m => `[${m.role} · ${m.source} · ${m.status}] ${m.text}`).join('\n\n')); toast.success('Handoff copied. Paste into your Codex chat.'); } catch { toast.error('Could not copy the handoff.'); } }}><Copy className="mr-2 h-4 w-4" />Copy for Codex</Button>
    </div>
    {error && <p role="alert" className="mb-3 rounded-md border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
    <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border bg-muted/10 p-4" aria-live="polite">
      {!messages.length && !error && <p className="py-10 text-center text-sm text-muted-foreground">Ask about a task, find a filename, or continue a conversation from Telegram.</p>}
      {messages.map(m => {
        const pending = m.approval?.id && !m.approval.decision && messages.some(parent => parent._id === m.parentId && parent.status === 'running');
        return <div key={m._id} className={`max-w-[95%] rounded-xl border p-3 sm:max-w-[85%] ${m.role === 'user' ? 'ml-auto bg-primary/5' : 'bg-background'}`}>
          <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{m.role === 'user' ? 'You' : m.approval?.id ? 'Approval required' : 'Assistant'} · {m.source === 'codex' ? 'Codex' : m.source === 'telegram' ? 'Telegram' : 'Website'}</span><time>{new Date(m.createdAt).toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'short', timeStyle: 'short' })}</time></div>
          <p className="whitespace-pre-wrap break-words text-sm">{m.text}</p>
          {m.role === 'user' && <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground"><span>{m.status === 'queued' ? 'Waiting' : m.status === 'running' ? 'Working…' : m.status === 'failed' ? 'Failed — check the result before retrying' : m.status}</span>{['queued', 'running'].includes(m.status) && <button className="underline" onClick={async () => { try { await AxiosInstance(token).post(`/api/owner-chat/messages/${m._id}/cancel`); await refresh(); } catch { toast.error('Cancellation was not confirmed.'); } }}>Cancel</button>}</div>}
          {pending && <div className="mt-3 flex gap-2"><Button size="sm" disabled={deciding === m._id} onClick={() => void decide(m._id, 'accept')}>Approve once</Button><Button size="sm" variant="outline" disabled={deciding === m._id} onClick={() => void decide(m._id, 'decline')}>Decline</Button></div>}
          {m.approval?.decision && <p className="mt-2 text-xs text-muted-foreground">{m.approval.decision === 'accept' ? 'Approved' : 'Declined'}</p>}
        </div>;
      })}<div ref={bottom} />
    </div>
    <form className="mt-3 flex items-end gap-2" onSubmit={e => { e.preventDefault(); void send(); }}>
      <Textarea aria-label="Message AI Assistant" value={text} disabled={!!uncertain} maxLength={12000} placeholder="Message your assistant…" className="max-h-40 min-h-20 resize-y" onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }} />
      <Button type="submit" disabled={sending || !!error || (!text.trim() && !uncertain)}><Send className="mr-2 h-4 w-4" />{sending ? 'Sending…' : uncertain ? 'Retry delivery' : 'Send'}</Button>
    </form>
    <p className="mt-2 text-xs text-muted-foreground">PC actions may require your approval here or in Telegram. Use Copy for Codex to continue in a separate desktop chat.</p>
  </div>;
}
