'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Pencil, Pin, StickyNote, Eraser, Undo2, Redo2, Save, X, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { fileAnnotationsApi } from '@/utils/fileAnnotationsApi';

export type ImageAnnotation = {
  id: string; kind: 'stroke' | 'pin' | 'note'; color: string; width: number;
  points?: { x: number; y: number }[]; x?: number; y?: number; text?: string;
};
export type AnnotationEditor = { editorId: string; editorName: string; updatedAt?: string; revision?: number };
export type AnnotationLayer = AnnotationEditor & { fileId: string; items: ImageAnnotation[]; revision: number };
type Editor = { id: string; name: string };
type Tool = 'stroke' | 'pin' | 'note' | 'erase';

export function annotationUserColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
}

export function AnnotationEditorBadge({ editors, onSelect }: { editors: AnnotationEditor[]; onSelect?: (editorId: string) => void }) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const signature = editors.map(editor => editor.editorId).join(',');
  useEffect(() => {
    setIndex(0);
    if (editors.length < 2 || reduceMotion) return;
    const timer = setInterval(() => setIndex(previous => (previous + 1) % editors.length), 2800);
    return () => clearInterval(timer);
  }, [signature, editors.length, reduceMotion]);
  if (!editors.length) return null;
  const active = editors[index % editors.length];
  return <button type="button" onClick={() => onSelect?.(active.editorId)} title={`Annotated by ${editors.map(editor => editor.editorName).join(', ')}`} aria-label={`View annotations by ${active.editorName}`} className="flex items-center gap-1.5 min-w-0 text-[10px] text-muted-foreground hover:text-foreground">
    <span className="flex items-center shrink-0" aria-hidden="true">
      {editors.slice(0, 4).map((editor, i) => <span key={editor.editorId} className="block rounded-full border-2 border-background" style={{ width: 13, height: 13, marginLeft: i ? -5 : 0, backgroundColor: annotationUserColor(editor.editorId), zIndex: i + 1 }} />)}
    </span>
    <span className="relative h-4 min-w-0 overflow-hidden" style={{ minWidth: 60 }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={active.editorId} className="block truncate max-w-[130px]" initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -5 }} transition={{ duration: .18 }}>{active.editorName}</motion.span>
      </AnimatePresence>
    </span>
    {editors.length > 1 && <span className="shrink-0 opacity-60">+{editors.length - 1}</span>}
  </button>;
}

export function useAnnotationSummaries(fileIds: string[], token: string, userId: string, enabled = true) {
  const ids = [...new Set(fileIds.filter(id => /^[a-f\d]{24}$/i.test(id)))].sort();
  return useQuery<Record<string, AnnotationEditor[]>>({
    queryKey: ['file-annotation-summaries', userId, ids.join(',')],
    queryFn: async () => {
      const pages = [];
      for (let i = 0; i < ids.length; i += 200) pages.push(fileAnnotationsApi(token, 'POST', '/summaries', { fileIds: ids.slice(i, i + 200) }));
      return Object.assign({}, ...await Promise.all(pages));
    },
    enabled: enabled && !!token && ids.length > 0,
    staleTime: 15000,
    refetchInterval: enabled ? 30000 : false,
  });
}

export function useImageAnnotationSession(fileId: string | undefined, token: string, editor: Editor, enabled: boolean, initialEditorId?: string) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ImageAnnotation[]>([]);
  const [baseItems, setBaseItems] = useState<ImageAnnotation[]>([]);
  const [baseRevision, setBaseRevision] = useState(0);
  const [selectedEditorId, setSelectedEditorId] = useState(initialEditorId || '');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [tool, setTool] = useState<Tool>('stroke');
  const [color, setColor] = useState('#ef4444');
  const [width, setWidth] = useState(3);
  const undo = useRef<ImageAnnotation[][]>([]);
  const redo = useRef<ImageAnnotation[][]>([]);
  const queryKey = ['file-annotations', editor.id, fileId];
  const query = useQuery<AnnotationLayer[]>({
    queryKey,
    queryFn: () => fileAnnotationsApi(token, 'GET', `/${fileId}`),
    enabled: enabled && !!token && !!fileId,
    staleTime: 0,
    refetchOnWindowFocus: !editing,
  });
  const layers = query.data || [];
  const ownLayer = layers.find(layer => layer.editorId === editor.id);
  const visibleLayer = layers.find(layer => layer.editorId === selectedEditorId && layer.items.length > 0) || layers.find(layer => layer.items.length > 0);
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(baseItems);
  const save = useMutation({
    mutationFn: () => fileAnnotationsApi(token, 'PUT', `/${fileId}`, { items: draft, revision: baseRevision }),
    onSuccess: (saved: AnnotationLayer) => {
      queryClient.setQueryData<AnnotationLayer[]>(queryKey, old => [saved, ...(old || []).filter(layer => layer.editorId !== saved.editorId)]);
      void queryClient.invalidateQueries({ queryKey: ['file-annotation-summaries'] });
      setEditing(false);
      setSelectedEditorId(saved.editorId);
      toast.success('Image annotations saved');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || error.message || 'Unable to save annotations'),
  });

  useEffect(() => {
    setEditing(false); setDraft([]); setSelectedEditorId(initialEditorId || ''); setSelectedItemId('');
    undo.current = []; redo.current = [];
  }, [fileId, enabled, initialEditorId]);
  useEffect(() => {
    if (!dirty) return;
    const protect = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty]);

  const canLeave = () => !save.isPending && (!dirty || window.confirm('Discard your unsaved image annotations?'));
  const commit = (items: ImageAnnotation[]) => {
    if (items.length > 200) { toast.error('Maximum 200 annotations per image'); return; }
    undo.current = [...undo.current.slice(-49), draft]; redo.current = []; setDraft(items);
  };
  const undoChange = () => {
    const previous = undo.current.pop();
    if (previous) { redo.current.push(draft); setDraft(previous); }
  };
  const redoChange = () => {
    const next = redo.current.pop();
    if (next) { undo.current.push(draft); setDraft(next); }
  };
  const startEditing = () => {
    if (!token || !editor.id || !fileId || query.isPending || query.isError) return;
    setDraft(ownLayer?.items || []); setBaseItems(ownLayer?.items || []); setBaseRevision(ownLayer?.revision || 0); undo.current = []; redo.current = [];
    setSelectedEditorId(editor.id); setSelectedItemId(''); setEditing(true);
  };
  useEffect(() => {
    if (!editing) return;
    const keydown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.closest('input, textarea, [contenteditable=true]')) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault(); event.stopPropagation();
        if (event.shiftKey) redoChange(); else undoChange();
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });
  const changeEditor = (id: string) => {
    if (!canLeave()) return;
    setEditing(false); setSelectedEditorId(id); setSelectedItemId('');
  };
  return {
    editing, dirty, draft, items: editing ? draft : visibleLayer?.items || [], layers, visibleLayer, editor, token, fileId,
    selectedEditorId: editing ? editor.id : visibleLayer?.editorId || '', selectedItemId, setSelectedItemId,
    tool, setTool, color, setColor, width, setWidth, commit, undoChange, redoChange,
    canUndo: undo.current.length > 0, canRedo: redo.current.length > 0,
    startEditing, changeEditor, canLeave, cancel: () => { if (canLeave()) setEditing(false); },
    save: () => save.mutate(), saving: save.isPending, loading: query.isPending, error: query.isError,
    reload: () => { if (canLeave()) { setEditing(false); void query.refetch(); } },
  };
}
export type AnnotationSession = ReturnType<typeof useImageAnnotationSession>;

export function AnnotationHeader({ session }: { session: AnnotationSession }) {
  const editors = session.layers.filter(layer => layer.items.length > 0);
  const selected = editors.find(editor => editor.editorId === session.selectedEditorId);
  return <div className="flex items-center gap-2 shrink-0 text-white">
    {editors.length > 0 && <label className="flex items-center gap-1.5 text-xs max-w-[180px]">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: annotationUserColor(session.selectedEditorId) }} />
      <select aria-label="View editor annotations" value={selected?.editorId || ''} disabled={session.saving} onChange={event => session.changeEditor(event.target.value)} className="bg-zinc-900 text-white border border-white/20 rounded px-1 py-1 min-w-0 max-w-[145px] text-xs">
        {!selected && <option value="">{session.editing ? session.editor.name : 'Select editor'}</option>}
        {editors.map(editor => <option key={editor.editorId} value={editor.editorId}>{editor.editorName}</option>)}
      </select>
    </label>}
    {!editors.length && session.editing && <span className="flex items-center gap-1.5 text-xs"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: annotationUserColor(session.editor.id) }} />{session.editor.name}</span>}
    <button type="button" className={`flex items-center gap-1.5 border rounded-md px-2 py-1.5 text-xs ${session.editing ? 'border-amber-400 text-amber-300' : 'border-white/20 hover:bg-white/10'} disabled:opacity-40`} disabled={!session.fileId || !session.token || session.loading || session.error || session.saving} onClick={session.editing ? session.cancel : session.startEditing}>
      <Pencil size={13} /> {session.editing ? 'Exit Edit Mode' : 'Edit Mode'}
    </button>
    {session.error && <button type="button" onClick={session.reload} title="Retry loading annotations" className="text-red-300"><RefreshCw size={14} /></button>}
  </div>;
}

export function AnnotationToolbar({ session }: { session: AnnotationSession }) {
  if (!session.editing) return null;
  const tools = [{ id: 'stroke', label: 'Sketch', Icon: Pencil }, { id: 'pin', label: 'Pin', Icon: Pin }, { id: 'note', label: 'Note', Icon: StickyNote }, { id: 'erase', label: 'Erase', Icon: Eraser }] as const;
  return <div className="flex flex-wrap items-center justify-center gap-2 bg-zinc-900/95 border border-white/15 rounded-lg px-3 py-2 text-white shadow-xl">
    {tools.map(({ id, label, Icon }) => <button type="button" key={id} aria-label={label} title={label} aria-pressed={session.tool === id} disabled={session.saving} onClick={() => session.setTool(id)} className={`p-2 rounded-md ${session.tool === id ? 'bg-amber-400 text-black' : 'hover:bg-white/10'}`}><Icon size={16} /></button>)}
    <input type="color" aria-label="Annotation colour" value={session.color} onChange={event => session.setColor(event.target.value)} className="w-7 h-7 rounded cursor-pointer bg-transparent" disabled={session.saving} />
    <select aria-label="Sketch thickness" value={session.width} onChange={event => session.setWidth(Number(event.target.value))} className="text-xs bg-zinc-800 rounded px-1 py-2" disabled={session.saving}>{[2, 3, 5, 8, 12].map(width => <option key={width} value={width}>{width}px</option>)}</select>
    <button type="button" aria-label="Undo annotation" title="Undo" disabled={!session.canUndo || session.saving} onClick={session.undoChange} className="p-2 disabled:opacity-30"><Undo2 size={16} /></button>
    <button type="button" aria-label="Redo annotation" title="Redo" disabled={!session.canRedo || session.saving} onClick={session.redoChange} className="p-2 disabled:opacity-30"><Redo2 size={16} /></button>
    <button type="button" onClick={session.save} disabled={session.saving || !session.dirty} className="flex items-center gap-1.5 bg-amber-400 text-black rounded-md px-3 py-2 text-xs font-semibold disabled:opacity-40"><Save size={14} />{session.saving ? 'Saving…' : 'Save'}</button>
    <button type="button" onClick={session.cancel} disabled={session.saving} aria-label="Cancel annotations" className="p-2"><X size={16} /></button>
  </div>;
}

export function AnnotatedImage({ src, alt, session }: { src: string; alt: string; session: AnnotationSession }) {
  const container = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [imageFailed, setImageFailed] = useState(false);
  const [drawing, setDrawing] = useState<ImageAnnotation | null>(null);
  const activeStroke = useRef<ImageAnnotation | null>(null);
  const activePointer = useRef<number | null>(null);
  const frame = useRef<number | null>(null);
  useEffect(() => { setNatural({ width: 0, height: 0 }); setImageFailed(false); }, [src]);
  useEffect(() => {
    const fit = () => {
      if (!container.current || !natural.width) return;
      const factor = Math.min(container.current.clientWidth / natural.width, container.current.clientHeight / natural.height, 1);
      setSize({ width: natural.width * factor, height: natural.height * factor });
    };
    fit();
    const observer = new ResizeObserver(fit);
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, [natural]);
  useEffect(() => {
    activeStroke.current = null; activePointer.current = null; setDrawing(null);
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, [session.editing, src]);
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  const point = (event: React.PointerEvent) => {
    const rect = surface.current!.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  };
  const endStroke = (event: React.PointerEvent, cancel = false) => {
    if (event.pointerId !== activePointer.current) return;
    const stroke = activeStroke.current;
    activePointer.current = null; activeStroke.current = null;
    if (frame.current !== null) { cancelAnimationFrame(frame.current); frame.current = null; }
    setDrawing(null);
    if (stroke && !cancel) session.commit([...session.draft, stroke]);
  };
  const remove = (id: string) => { session.commit(session.draft.filter(item => item.id !== id)); session.setSelectedItemId(''); };
  // Hit-test in displayed pixels so thin sketches are easy to erase at any zoom.
  const eraseAt = (event: React.PointerEvent) => {
    const p = point(event);
    const hit = session.draft.filter(item => item.kind === 'stroke' && (item.points || []).some((b, index, points) => {
      const a = points[Math.max(0, index - 1)];
      const dx = (b.x - a.x) * size.width, dy = (b.y - a.y) * size.height;
      const px = (p.x - a.x) * size.width, py = (p.y - a.y) * size.height;
      const length = dx * dx + dy * dy;
      const t = length ? Math.max(0, Math.min(1, (px * dx + py * dy) / length)) : 0;
      return Math.hypot(px - t * dx, py - t * dy) <= 12 + item.width / 2;
    }));
    if (hit.length) {
      const ids = new Set(hit.map(item => item.id));
      session.commit(session.draft.filter(item => !ids.has(item.id)));
      session.setSelectedItemId('');
    }
  };
  const selected = session.editing ? session.draft.find(item => item.id === session.selectedItemId && item.kind !== 'stroke') : undefined;
  const rendered = drawing ? [...session.items, drawing] : session.items;
  const path = (item: ImageAnnotation) => (item.points || []).map((p, index) => `${index ? 'L' : 'M'}${p.x * 1000},${p.y * 1000}`).join(' ');
  return <div ref={container} className="w-full h-full flex items-center justify-center relative min-h-0">
    {imageFailed ? <p className="text-red-300 text-sm">This image could not be loaded. Open or download the original file.</p> : <div ref={surface} className="relative shrink-0" style={{ width: size.width || undefined, height: size.height || undefined }}>
      <img src={src} alt={alt} draggable={false} onError={() => setImageFailed(true)} onLoad={event => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} className="block rounded-md select-none" style={{ width: size.width || undefined, height: size.height || undefined, maxWidth: size.width ? undefined : '100%', visibility: size.width ? 'visible' : 'hidden' }} />
      {size.width > 0 && <div className="absolute inset-0" style={{ cursor: session.editing ? session.tool === 'erase' ? 'crosshair' : 'crosshair' : 'default', touchAction: session.editing ? 'none' : 'auto' }}
        onPointerDown={event => {
          if (!session.editing || session.saving || event.button !== 0 || activePointer.current !== null) return;
          if (session.tool === 'erase') {
            event.currentTarget.setPointerCapture(event.pointerId); activePointer.current = event.pointerId;
            eraseAt(event); return;
          }
          const p = point(event);
          if (session.tool === 'stroke') {
            const total = session.draft.reduce((count, item) => count + (item.points?.length || 0), 0);
            if (total >= 15000) { toast.error('Sketch is too large; remove some strokes'); return; }
            event.currentTarget.setPointerCapture(event.pointerId); activePointer.current = event.pointerId;
            activeStroke.current = { id: crypto.randomUUID(), kind: 'stroke', color: session.color, width: session.width, points: [p] };
            setDrawing(activeStroke.current);
          } else {
            const item: ImageAnnotation = { id: crypto.randomUUID(), kind: session.tool, color: session.color, width: session.width, x: p.x, y: p.y, text: '' };
            session.commit([...session.draft, item]); session.setSelectedItemId(item.id);
          }
        }}
        onPointerMove={event => {
          if (event.pointerId !== activePointer.current) return;
          if (session.tool === 'erase') { eraseAt(event); return; }
          if (!activeStroke.current) return;
          const points = activeStroke.current.points!;
          const total = session.draft.reduce((count, item) => count + (item.points?.length || 0), 0);
          if (points.length >= 3000 || points.length + total >= 15000) return;
          const p = point(event); const last = points[points.length - 1];
          if (Math.hypot(p.x - last.x, p.y - last.y) < .001) return;
          activeStroke.current = { ...activeStroke.current, points: [...points, p] };
          if (frame.current === null) frame.current = requestAnimationFrame(() => { frame.current = null; setDrawing(activeStroke.current); });
        }} onPointerUp={event => endStroke(event)} onPointerCancel={event => endStroke(event, true)}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-label="Image sketch overlay">
          {rendered.filter(item => item.kind === 'stroke').map(item => <path key={item.id} d={item.points?.length === 1 ? `${path(item)} l.01,.01` : path(item)} fill="none" stroke={item.color} strokeWidth={item.width} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" style={{ pointerEvents: 'none' }} />)}
        </svg>
        {rendered.filter(item => item.kind !== 'stroke').map((item, index) => <button type="button" key={item.id} aria-label={`${item.kind === 'pin' ? 'Pin' : 'Note'} ${index + 1}: ${item.text || 'Add a note'}`} title={item.text || 'Add a note'} className={`absolute text-left shadow-lg border-2 ${item.kind === 'pin' ? 'rounded-full flex items-center justify-center w-7 h-7 -translate-x-1/2 -translate-y-1/2 text-white font-bold text-xs' : 'rounded-md px-2 py-1 text-xs bg-yellow-100 text-black max-w-[180px] whitespace-pre-wrap break-words'}`} style={{ left: `${item.x! * 100}%`, top: `${item.y! * 100}%`, transform: item.kind === 'note' ? `translate(${item.x! > .75 ? '-100%' : '0'}, ${item.y! > .75 ? '-100%' : '0'})` : undefined, backgroundColor: item.kind === 'pin' ? item.color : undefined, borderColor: item.color, outline: item.id === session.selectedItemId ? '2px solid white' : undefined }} onPointerDown={event => event.stopPropagation()} onClick={() => {
          if (session.saving) return;
          if (session.editing && session.tool === 'erase') remove(item.id);
          else session.setSelectedItemId(session.selectedItemId === item.id ? '' : item.id);
        }}>{item.kind === 'pin' ? index + 1 : item.text ? `${item.text.slice(0, 120)}${item.text.length > 120 ? '…' : ''}` : 'Add note'}</button>)}
        {!session.editing && session.selectedItemId && (() => {
          const item = session.items.find(item => item.id === session.selectedItemId && item.kind !== 'stroke');
          return item ? <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-zinc-900/95 border border-white/20 p-3 text-white text-sm whitespace-pre-wrap break-words">{item.text || 'No note added'}<button type="button" aria-label="Close pin note" onClick={() => session.setSelectedItemId('')} className="float-right ml-2"><X size={14} /></button></div> : null;
        })()}
      </div>}
    </div>}
    {selected && <div className="absolute bottom-2 right-2 w-72 max-w-[95%] bg-zinc-900 text-white border border-white/20 rounded-lg p-3 shadow-xl z-10" onPointerDown={event => event.stopPropagation()}>
      <label className="text-xs font-semibold" htmlFor="annotation-note">{selected.kind === 'pin' ? 'Pin note' : 'Image note'}</label>
      <textarea id="annotation-note" autoFocus value={selected.text || ''} maxLength={2000} rows={3} placeholder="Write a note for this mark…" disabled={session.saving} onChange={event => session.commit(session.draft.map(item => item.id === selected.id ? { ...item, text: event.target.value } : item))} className="block w-full mt-2 p-2 rounded bg-zinc-800 text-white text-sm resize-none" />
      <div className="flex items-center justify-between mt-2"><button type="button" aria-label="Delete selected annotation" onClick={() => remove(selected.id)} disabled={session.saving} className="text-red-300"><Trash2 size={15} /></button><button type="button" onClick={() => session.setSelectedItemId('')} className="text-xs px-2 py-1 bg-zinc-700 rounded">Done</button></div>
    </div>}
  </div>;
}
