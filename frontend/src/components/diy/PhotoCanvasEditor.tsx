"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Upload, Download, ArrowLeft, RotateCcw, Check, Loader2, Eye } from 'lucide-react';
import { loadPhotoCanvasTemplates, loadTemplateArtwork, PhotoCanvasTemplate, PhotoSlot } from '@/lib/photoCanvasTemplates';
import { assignUploadedPhotos, CanvasDesigns, clamp, DEFAULT_PHOTO_ADJUSTMENT, PhotoAdjustment, photoPlacement } from '@/lib/photoCanvasDesign';
import { loadCanvasDraft, saveCanvasDraft, saveCanvasPhotos } from '@/lib/photoCanvasDraft';
import { CustomerPhoto, exportCanvasPackage, fillTemplate } from '@/lib/photoCanvasExport';
import { uploadToS3Directly } from '@/utils/s3Upload';

const button = 'rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold disabled:opacity-40 hover:border-primary';
const panel = 'rounded-2xl border border-border bg-card p-4';
export default function PhotoCanvasEditor() {
  const params = useSearchParams();
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<PhotoCanvasTemplate[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [selectedId, setSelectedId] = useState('photo-1');
  const [photos, setPhotos] = useState<CustomerPhoto[]>([]);
  const [designs, setDesigns] = useState<CanvasDesigns>({});
  const [source, setSource] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [storageMessage, setStorageMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [preview, setPreview] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef('photo-1');
  const artwork = useRef<HTMLDivElement>(null);
  const urls = useRef<string[]>([]);
  const drag = useRef<{ slot: PhotoSlot; x: number; y: number; base: PhotoAdjustment; overflowX: number; overflowY: number } | null>(null);
  const template = templates.find(t => t.id === templateId);
  const design = designs[templateId] || {};
  const selected = template?.slots.find(s => s.id === selectedId) || template?.slots[0];
  const current = selected ? design[selected.id] : undefined;
  const selectedPhoto = photos.find(p => p.id === current?.photoId);
  const adjustment = current?.adjustment || DEFAULT_PHOTO_ADJUSTMENT;
  const complete = template?.slots.filter(s => photos.some(p => p.id === design[s.id]?.photoId)).length || 0;
  const finished = !!template?.slots.length && complete === template.slots.length;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const library = await loadPhotoCanvasTemplates();
        let saved: Awaited<ReturnType<typeof loadCanvasDraft>> | undefined;
        try { saved = await loadCanvasDraft(); } catch { if (mounted) setStorageMessage('Browser storage is unavailable. Download your design before leaving.'); }
        if (!mounted) return;
        setTemplates(library);
        const wanted = params.get('template') || saved?.draft?.templateId;
        setTemplateId(library.some(t => t.id === wanted) ? wanted! : library[0]?.id || '');
        if (saved) {
          setDesigns(saved.draft?.designs || {});
          setPhotos(saved.photos.map(p => { const url = URL.createObjectURL(p.blob); urls.current.push(url); return { ...p, url }; }));
        }
        setReady(true);
      } catch (e) { if (mounted) setError(e instanceof Error ? e.message : 'Could not open the template library.'); }
    })();
    return () => { mounted = false; urls.current.forEach(url => URL.revokeObjectURL(url)); };
  // The initial query chooses a starting template; subsequent selections stay local.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!template) return;
    let active = true;
    setSource(''); setSelectedId(template.slots[0]?.id || ''); setPreview(false);
    loadTemplateArtwork(template).then(svg => { if (active) setSource(svg); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [template]);
  useLayoutEffect(() => {
    const svg = artwork.current?.querySelector('svg');
    if (svg && template) fillTemplate(svg, template, design, photos);
  }, [source, template, design, photos]);
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      saveCanvasDraft({ templateId, designs, savedAt: new Date().toISOString() }).catch(() => setStorageMessage('Could not save in this browser. Download your design before leaving.'));
    }, 400);
    return () => clearTimeout(timer);
  }, [templateId, designs, ready]);

  const filtered = useMemo(() => templates.filter(t => (category === 'All' || t.category === category) && `${t.name} ${t.size}`.toLowerCase().includes(search.toLowerCase())), [templates, category, search]);
  function adjust(slotId: string, change: Partial<PhotoAdjustment>) {
    setDesigns(prev => ({ ...prev, [templateId]: { ...prev[templateId], [slotId]: { ...prev[templateId]?.[slotId], adjustment: { ...(prev[templateId]?.[slotId]?.adjustment || DEFAULT_PHOTO_ADJUSTMENT), ...change } } } }));
  }
  function assign(photoId: string) {
    if (!selected) return;
    setDesigns(prev => ({ ...prev, [templateId]: { ...prev[templateId], [selected.id]: { photoId, adjustment: { ...DEFAULT_PHOTO_ADJUSTMENT } } } }));
  }
  function chooseUpload(slotId = selected?.id) {
    if (!slotId || busy) return;
    uploadTarget.current = slotId; setSelectedId(slotId); input.current?.click();
  }
  async function upload(files: File[], target: string) {
    if (!template || busy || !files.length) return;
    const targetTemplate = template;
    setBusy('Opening photos…'); setError('');
    const additions: CustomerPhoto[] = [];
    const failures: string[] = [];
    try {
      for (const file of files) {
        if (!/^image\/(jpeg|png|webp|gif|avif)$/i.test(file.type) || file.size > 50 * 1024 * 1024) { failures.push(file.name); continue; }
        const url = URL.createObjectURL(file);
        try {
          const img = new Image(); await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; img.src = url; });
          additions.push({ id: crypto.randomUUID(), name: file.name, blob: file, url, width: img.naturalWidth, height: img.naturalHeight }); urls.current.push(url);
        } catch { URL.revokeObjectURL(url); failures.push(file.name); }
      }
      setPhotos(prev => [...prev, ...additions]);
      setDesigns(prev => ({ ...prev, [targetTemplate.id]: assignUploadedPhotos(prev[targetTemplate.id] || {}, targetTemplate.slots.map(s => s.id), target, additions.map(p => p.id)) }));
      try { await saveCanvasPhotos(additions.map(({ url: _url, ...photo }) => photo)); } catch { setStorageMessage('These photos could not be saved in this browser. Download before leaving.'); }
      if (failures.length) setError(`${failures.length} file(s) could not be opened. Use JPG, PNG, WebP or AVIF under 50 MB each.`);
    } finally { setBusy(''); if (input.current) input.current.value = ''; }
  }
  async function finish(forOrder: boolean) {
    if (!template || !source || !finished || busy) return;
    if (forOrder && !session?.user?.token) { setError('Please sign in before attaching a design to an order. Your photos are saved on this device; you can also download the design now.'); return; }
    setBusy('Preparing your completed design…'); setError('');
    try {
      const output = await exportCanvasPackage(source, template, design, photos);
      const filename = `kampungcetak-${template.id}.zip`;
      if (!forOrder) {
        const url = URL.createObjectURL(output.archive); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
      } else {
        setBusy('Uploading your completed design…');
        const result = await uploadToS3Directly(session!.user.token, new File([output.archive], filename, { type: 'application/zip' }), process.env.NEXT_PUBLIC_BACKEND_URL || '', progress => setBusy(`Uploading design: ${progress}%`));
        const productId = params.get('product');
        localStorage.setItem('kc-canvas-ready', JSON.stringify({ id: crypto.randomUUID(), productId, url: result.fileUrl, templateId: template.id, templateName: template.name, size: template.size }));
        window.location.assign(productId && /^[a-zA-Z0-9_-]+$/.test(productId) ? `/home/shop/${encodeURIComponent(productId)}?canvas=ready` : '/home/shop?search=photo%20canvas');
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not prepare your design. Please try again.'); }
    finally { setBusy(''); }
  }

  return <main className="min-h-screen bg-background text-foreground">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-4">
      <div className="flex items-center gap-3"><Link href="/" aria-label="Back to shop"><ArrowLeft className="size-5" /></Link><div><p className="text-xs font-bold text-primary">KAMPUNG CETAK</p><h1 className="text-xl font-bold">DIY Photo Canvas</h1></div></div>
      <p className="text-xs text-muted-foreground">Choose a template · Add your photos · Use your design</p>
      <Link href="/diy?mode=photobook" className={button}>Photobook</Link>
    </header>
    {error && <div role="alert" className="mx-5 mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}<button className="ml-3 underline" onClick={() => setError('')}>Dismiss</button></div>}
    {storageMessage && <p className="mx-5 mt-3 text-sm text-amber-800">{storageMessage}</p>}
    {!ready ? <p role="status" className="p-10">{error ? 'Reload this page to try again.' : 'Loading template library…'}</p> : <div className="mx-auto grid max-w-[1700px] gap-5 p-4 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
      <aside className="space-y-4">
        <section className={panel}><h2 className="font-bold">1. Choose template</h2><input aria-label="Search templates" placeholder="Search size or template…" value={search} onChange={e => setSearch(e.target.value)} className="my-3 w-full rounded-lg border border-border bg-background p-2 text-sm" /><div className="flex flex-wrap gap-1">{['All','Single photo','Collage','Photo clock'].map(c => <button className={`${button} ${category === c ? 'border-primary text-primary' : ''}`} key={c} onClick={() => setCategory(c)}>{c}</button>)}</div><p className="my-2 text-xs text-muted-foreground">{filtered.length} layouts</p>
          <div className="grid max-h-[360px] grid-cols-2 gap-2 overflow-y-auto pr-1 lg:max-h-[540px]">{filtered.map(t => <button key={t.id} disabled={!!busy} onClick={() => setTemplateId(t.id)} className={`overflow-hidden rounded-xl border text-left ${t.id === templateId ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}><img src={t.preview} alt="" loading="lazy" className="aspect-square w-full bg-neutral-100 object-contain p-1" /><span className="block p-2 text-[11px] font-semibold">{t.name}<span className="mt-1 block font-normal text-muted-foreground">{t.slots.length} photos</span></span></button>)}</div>
        </section>
        <section className={panel}><h2 className="font-bold">2. Your photos</h2><p className="my-2 text-xs text-muted-foreground">Select a photo area, then upload or choose a photo below.</p><button className={`${button} w-full text-primary`} disabled={!!busy || !selected} onClick={() => chooseUpload()}><Upload className="mr-2 inline size-4" />Upload photos</button><input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="sr-only" aria-label="Upload customer photos" onChange={e => void upload(Array.from(e.target.files || []), uploadTarget.current)} /><div className="mt-3 grid max-h-60 grid-cols-3 gap-2 overflow-y-auto">{photos.map(p => <button key={p.id} disabled={!!busy} title={`Insert ${p.name}`} onClick={() => assign(p.id)} className={`aspect-square overflow-hidden rounded-md border-2 ${selectedPhoto?.id === p.id ? 'border-primary' : 'border-transparent'}`}><img src={p.url} alt={p.name} className="h-full w-full object-cover" /></button>)}</div></section>
      </aside>
      <section className="min-w-0 rounded-2xl bg-muted/30 p-3 sm:p-5">
        {template && <><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-bold">{template.name}</h2><p className="text-sm text-muted-foreground">{template.size} · {complete}/{template.slots.length} photos</p></div><button className={button} onClick={() => setPreview(p => !p)}><Eye className="mr-1 inline size-4" />{preview ? 'Edit photos' : 'Preview'}</button></div>
          {!source ? <p className="p-10" role="status">Loading original artwork…</p> : <div className="mx-auto" style={{ maxWidth: `min(100%, ${Math.max(220, 700 * template.width / template.height)}px)` }}>
            <div className="relative isolate bg-white shadow-xl" style={{ aspectRatio: template.aspectRatio }}>
              <div ref={artwork} className="pointer-events-none absolute inset-0 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: source }} />
              {!preview && template.slots.map(slot => <button key={slot.id} aria-label={`Edit ${slot.label}`} disabled={!!busy} style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.width}%`, height: `${slot.height}%`, clipPath: `polygon(${slot.polygon.map(p => `${p[0]}% ${p[1]}%`).join(',')})`, touchAction: design[slot.id]?.photoId ? 'none' : 'auto' }}
                className={`absolute flex items-center justify-center overflow-hidden text-xs ${selected?.id === slot.id ? 'outline outline-2 -outline-offset-2 outline-emerald-500 bg-emerald-500/5' : 'hover:bg-white/10'}`}
                onClick={() => { setSelectedId(slot.id); if (!design[slot.id]?.photoId) chooseUpload(slot.id); }}
                onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); setSelectedId(slot.id); void upload(Array.from(e.dataTransfer.files), slot.id); }}
                onPointerDown={e => { setSelectedId(slot.id); const photo = photos.find(p => p.id === design[slot.id]?.photoId); if (!photo) return; const a = design[slot.id]?.adjustment || DEFAULT_PHOTO_ADJUSTMENT; const r = e.currentTarget.getBoundingClientRect(); const pos = photoPlacement(photo.width, photo.height, r.width, r.height, a); e.currentTarget.setPointerCapture(e.pointerId); drag.current = { slot, x: e.clientX, y: e.clientY, base: a, overflowX: pos.overflowX, overflowY: pos.overflowY }; }}
                onPointerMove={e => { const d = drag.current; if (!d || d.slot.id !== slot.id) return; adjust(slot.id, { x: d.overflowX ? clamp(d.base.x + (e.clientX - d.x) * 2 / d.overflowX, -1, 1) : 0, y: d.overflowY ? clamp(d.base.y + (e.clientY - d.y) * 2 / d.overflowY, -1, 1) : 0 }); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
                {!design[slot.id]?.photoId && <span className="rounded bg-white/85 p-1 text-neutral-800"><ImagePlus className="mx-auto size-4" />{slot.label}</span>}
              </button>)}
            </div>
          </div>}
          <div className="mt-5 flex flex-wrap justify-center gap-2">{template.slots.map(slot => <button key={slot.id} className={`${button} ${selected?.id === slot.id ? 'border-primary text-primary' : ''}`} onClick={() => { setSelectedId(slot.id); setPreview(false); }}>{design[slot.id]?.photoId && <Check className="mr-1 inline size-3" />}{slot.label}</button>)}</div>
        </>}
      </section>
      <aside className="space-y-4 lg:sticky lg:top-4 lg:h-fit">
        <section className={panel}><h2 className="font-bold">Adjust {selected?.label.toLowerCase() || 'photo'}</h2><p className="my-2 text-xs text-muted-foreground">Drag the photo to reposition it. Zoom to crop closer.</p><button disabled={!selected || !!busy} className={`${button} w-full`} onClick={() => chooseUpload()}>Replace photo</button><label className="mt-4 block text-sm">Zoom<input className="mt-2 w-full" type="range" min="1" max="4" step="0.02" aria-label="Photo zoom" value={adjustment.scale} disabled={!selectedPhoto || !!busy} onChange={e => selected && adjust(selected.id, { scale: Number(e.target.value) })} /></label><button className={`${button} mt-3`} disabled={!selectedPhoto || !!busy} onClick={() => selected && adjust(selected.id, DEFAULT_PHOTO_ADJUSTMENT)}><RotateCcw className="mr-1 inline size-3" />Reset crop</button></section>
        <section className={panel}><h2 className="font-bold">3. Finish your design</h2><p className="my-3 text-sm">{complete} of {template?.slots.length || 0} photos filled</p><p className="mb-4 text-xs text-muted-foreground">Your template artwork stays fixed. Preview the complete design before continuing.</p><button className={`${button} w-full`} disabled={!finished || !!busy || !source} onClick={() => void finish(false)}><Download className="mr-1 inline size-4" />Download completed design</button><button className="mt-3 w-full rounded-xl bg-primary px-3 py-3 text-sm font-bold text-primary-foreground disabled:opacity-40" disabled={!finished || !!busy || !source} onClick={() => void finish(true)}>Use this design for my order</button><p className="mt-3 text-xs text-muted-foreground">Choose your product and print options next. Your completed design will be attached when you add it to cart.</p>{busy && <p role="status" className="mt-3 text-sm"><Loader2 className="mr-1 inline size-4 animate-spin" />{busy}</p>}</section>
      </aside>
    </div>}
  </main>;
}
