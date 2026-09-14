"use client";

import Link from "next/link";
import { ChangeEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Download, ImagePlus, LayoutTemplate, RotateCcw, Save, ShoppingBag, Upload, ZoomIn } from "lucide-react";
import { photoCanvasTemplates, PhotoCanvasTemplate } from "@/lib/photoCanvasTemplates";

type Adjustment = { scale: number; x: number; y: number };
type CustomerPhoto = { id: string; name: string; url: string };
type SlotDesign = { photoId?: string; adjustment: Adjustment };
const DEFAULT_ADJUSTMENT: Adjustment = { scale: 1, x: 0, y: 0 };

const surfaceClass: Record<PhotoCanvasTemplate["surface"], string> = {
  linen: "bg-[#ded5bd]",
  gallery: "bg-[#f4efe7]",
  midnight: "bg-[#172029]",
  clock: "bg-[#111827]",
};

export default function PhotoCanvasEditor() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(photoCanvasTemplates[0].id);
  const [activeCategory, setActiveCategory] = useState<"All" | PhotoCanvasTemplate["category"]>("All");
  const [photos, setPhotos] = useState<CustomerPhoto[]>([]);
  const [design, setDesign] = useState<Record<string, SlotDesign>>({});
  const [selectedSlotId, setSelectedSlotId] = useState("photo-1");
  const [saved, setSaved] = useState(false);
  const drag = useRef<{ x: number; y: number; baseX: number; baseY: number } | undefined>(undefined);

  const template = photoCanvasTemplates.find((item) => item.id === selectedTemplateId) || photoCanvasTemplates[0];
  const selectedSlot = template.slots.find((slot) => slot.id === selectedSlotId) || template.slots[0];
  const slotDesign = design[selectedSlot.id] || { adjustment: DEFAULT_ADJUSTMENT };
  const selectedPhoto = photos.find((photo) => photo.id === slotDesign.photoId);
  const completedCount = template.slots.filter((slot) => design[slot.id]?.photoId).length;

  useEffect(() => {
    setSelectedSlotId(template.slots[0].id);
    setDesign((previous) => Object.fromEntries(template.slots.map((slot) => [slot.id, previous[slot.id] || { adjustment: DEFAULT_ADJUSTMENT }])));
  }, [template.id]);

  const updateSlot = (slotId: string, changes: Partial<SlotDesign>) => {
    setDesign((previous) => ({
      ...previous,
      [slotId]: { ...previous[slotId], adjustment: previous[slotId]?.adjustment || DEFAULT_ADJUSTMENT, ...changes },
    }));
  };

  const updateAdjustment = (changes: Partial<Adjustment>) => {
    setDesign((previous) => ({
      ...previous,
      [selectedSlot.id]: {
        photoId: previous[selectedSlot.id]?.photoId,
        adjustment: { ...(previous[selectedSlot.id]?.adjustment || DEFAULT_ADJUSTMENT), ...changes },
      },
    }));
  };

  const uploadPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    const additions = files.map((file) => ({ id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`, name: file.name, url: URL.createObjectURL(file) }));
    setPhotos((previous) => [...previous, ...additions]);
    if (!slotDesign.photoId) updateSlot(selectedSlot.id, { photoId: additions[0].id });
    event.target.value = "";
  };

  const pickTemplate = (item: PhotoCanvasTemplate) => {
    setSelectedTemplateId(item.id);
    setSelectedSlotId(item.slots[0].id);
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!selectedPhoto) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, baseX: slotDesign.adjustment.x, baseY: slotDesign.adjustment.y };
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    updateAdjustment({
      x: Math.max(-50, Math.min(50, drag.current.baseX + (event.clientX - drag.current.x) / 2)),
      y: Math.max(-50, Math.min(50, drag.current.baseY + (event.clientY - drag.current.y) / 2)),
    });
  };

  const saveDraft = () => {
    const draft = { templateId: template.id, design, photoNames: photos.map(({ id, name }) => ({ id, name })), savedAt: new Date().toISOString() };
    window.localStorage.setItem("kampungcetak-photo-canvas-draft", JSON.stringify(draft));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const downloadProductionBrief = () => {
    const output = {
      product: "DIY Photo Canvas",
      template: { id: template.id, name: template.name, size: template.size, sourceFile: template.sourceFile },
      photoSlots: template.slots.map((slot) => ({ ...slot, photo: photos.find((photo) => photo.id === design[slot.id]?.photoId)?.name || "NOT ASSIGNED", adjustment: design[slot.id]?.adjustment || DEFAULT_ADJUSTMENT })),
      createdAt: new Date().toISOString(),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(output, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kampungcetak-${template.id}-design-brief.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const filteredTemplates = useMemo(() => photoCanvasTemplates.filter((item) => activeCategory === "All" || item.category === activeCategory), [activeCategory]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/90 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-4">
          <div className="flex items-center gap-3"><Link href="/" aria-label="Back to Kampung Cetak" className="rounded-full border border-border p-2 transition hover:border-primary hover:text-primary"><ArrowLeft className="size-4" /></Link><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Kampung Cetak</p><h1 className="text-xl font-bold tracking-tight sm:text-2xl">DIY Photo Canvas</h1></div></div>
          <div className="hidden rounded-full border border-border bg-muted/40 p-1 text-sm sm:flex"><Link href="/diy?mode=photobook" className="rounded-full px-4 py-2 text-muted-foreground hover:text-foreground">Photobook</Link><span className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground">Photo Canvas</span></div>
          <button onClick={saveDraft} className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white"><Save className="size-4" />{saved ? "Saved" : "Save draft"}</button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1540px] gap-5 p-4 sm:p-6 lg:grid-cols-[290px_minmax(0,1fr)_320px]">
        <aside className="space-y-4 lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="mb-4 flex items-center gap-2"><LayoutTemplate className="size-4 text-primary" /><h2 className="font-semibold">1. Choose template</h2></div><div className="flex flex-wrap gap-2">{(["All", "Single photo", "Collage", "Photo clock"] as const).map((category) => <button key={category} onClick={() => setActiveCategory(category)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeCategory === category ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary"}`}>{category}</button>)}</div><div className="mt-4 grid grid-cols-2 gap-3">{filteredTemplates.map((item) => <button key={item.id} onClick={() => pickTemplate(item)} className={`overflow-hidden rounded-xl border text-left transition ${item.id === template.id ? "border-primary ring-2 ring-primary/25" : "border-border hover:border-primary/60"}`}><div className={`relative aspect-square ${surfaceClass[item.surface]}`}>{item.preview ? <img src={item.preview} alt="" className="h-full w-full object-cover opacity-80" /> : <span className="grid h-full place-items-center text-3xl">{item.category === "Photo clock" ? "◷" : "▦"}</span>}<span className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold text-white">{item.size}</span></div><span className="block p-2 text-xs font-semibold leading-4">{item.name}</span></button>)}</div></section>
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="mb-2 flex items-center gap-2"><Upload className="size-4 text-primary" /><h2 className="font-semibold">2. Your photos</h2></div><p className="mb-3 text-xs leading-5 text-muted-foreground">Upload once, then place a photo into any template slot.</p><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/50 px-3 py-3 text-sm font-semibold text-primary hover:bg-primary/5"><ImagePlus className="size-4" /> Upload photos<input type="file" accept="image/*" multiple className="sr-only" onChange={uploadPhotos} /></label>{photos.length ? <div className="mt-3 grid grid-cols-3 gap-2">{photos.map((photo) => <button key={photo.id} title={photo.name} onClick={() => updateSlot(selectedSlot.id, { photoId: photo.id })} className={`aspect-square overflow-hidden rounded-lg border-2 ${slotDesign.photoId === photo.id ? "border-primary" : "border-transparent"}`}><img src={photo.url} alt={photo.name} className="h-full w-full object-cover" /></button>)}</div> : <p className="mt-3 text-xs text-muted-foreground">No photos uploaded yet.</p>}</section>
        </aside>

        <section className="flex min-h-[680px] flex-col rounded-3xl border border-border bg-muted/35 p-4 shadow-inner sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Live print preview</p><h2 className="text-lg font-bold">{template.name}</h2><p className="text-sm text-muted-foreground">{completedCount} of {template.slots.length} photo slots completed</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{template.size}</span></div>
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/90 p-2 text-sm shadow-sm"><span className="px-2 font-semibold">Selected: {selectedSlot.label}</span><label className="ml-auto flex items-center gap-2 px-2 text-xs font-semibold"><ZoomIn className="size-3.5" /> Zoom<input type="range" min="1" max="3" step="0.05" value={slotDesign.adjustment.scale} disabled={!selectedPhoto} onChange={(event) => updateAdjustment({ scale: Number(event.target.value) })} className="w-24" /></label><button onClick={() => updateAdjustment(DEFAULT_ADJUSTMENT)} disabled={!selectedPhoto} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40"><RotateCcw className="size-3.5" /> Reset</button></div>
          <div className="flex flex-1 items-center justify-center overflow-hidden py-4"><div className={`relative w-[min(100%,720px)] overflow-hidden rounded-[1.4rem] border-[10px] border-white shadow-2xl ${surfaceClass[template.surface]}`} style={{ aspectRatio: template.aspectRatio }}>
            {template.preview && <img src={template.preview} alt={`${template.name} reference preview`} className="absolute inset-0 h-full w-full object-cover opacity-25" />}
            {template.surface === "clock" && <div className="pointer-events-none absolute left-[6%] top-[11%] grid h-[78%] w-[41%] place-items-center rounded-full border-[5px] border-white/90 bg-black/15 text-5xl font-light text-white/95 shadow-lg sm:text-7xl">◷</div>}
            {template.slots.map((slot, index) => { const item = design[slot.id] || { adjustment: DEFAULT_ADJUSTMENT }; const photo = photos.find((candidate) => candidate.id === item.photoId); const isSelected = selectedSlot.id === slot.id; return <div key={slot.id} onClick={() => setSelectedSlotId(slot.id)} onPointerDown={isSelected ? startDrag : undefined} onPointerMove={isSelected ? moveDrag : undefined} onPointerUp={() => { drag.current = undefined; }} onPointerCancel={() => { drag.current = undefined; }} className={`absolute cursor-pointer overflow-hidden border-2 transition ${slot.shape === "circle" ? "rounded-full" : "rounded-md"} ${isSelected ? "z-20 border-primary ring-4 ring-primary/30" : "border-white/80 hover:border-primary/80"}`} style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.width}%`, height: `${slot.height}%` }}>{photo ? <img src={photo.url} alt={slot.label} draggable={false} className="h-full w-full select-none object-cover" style={{ transform: `translate(${item.adjustment.x}%, ${item.adjustment.y}%) scale(${item.adjustment.scale})` }} /> : <div className="grid h-full place-items-center bg-black/35 p-2 text-center text-xs font-semibold text-white backdrop-blur-[1px]"><span><ImagePlus className="mx-auto mb-1 size-5" />{slot.label}</span></div>}<span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white">{index + 1}</span></div>; })}
            {template.surface !== "clock" && <div className="pointer-events-none absolute inset-[4%] rounded border-2 border-white/80" />}
          </div></div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">{template.slots.map((slot, index) => <button key={slot.id} onClick={() => setSelectedSlotId(slot.id)} className={`rounded-full border px-3 py-2 text-xs font-semibold ${selectedSlot.id === slot.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"}`}>{design[slot.id]?.photoId ? <Check className="mr-1 inline size-3.5" /> : null}Photo {index + 1}</button>)}</div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-4 lg:h-fit"><section className="rounded-2xl border border-border bg-card p-4 shadow-sm"><h2 className="font-semibold">3. Finish your design</h2><div className="mt-4 rounded-xl bg-muted/60 p-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Template</span><strong>{template.name}</strong></div><div className="mt-2 flex justify-between"><span className="text-muted-foreground">Print size</span><strong>{template.size}</strong></div><div className="mt-2 flex justify-between"><span className="text-muted-foreground">Photos</span><strong>{completedCount}/{template.slots.length}</strong></div></div><div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3"><p className="text-xs text-muted-foreground">Starting from</p><p className="text-3xl font-bold text-primary">RM {template.price.toFixed(2)}</p><p className="mt-1 text-xs text-muted-foreground">Final price depends on canvas material and selected size.</p></div><button onClick={downloadProductionBrief} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:border-primary hover:text-primary"><Download className="size-4" /> Download design brief</button><Link href="/home/shop?search=photo%20canvas" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-bold text-white"><ShoppingBag className="size-4" /> Continue to order</Link></section><section className="rounded-2xl border border-dashed border-border p-4 text-xs leading-5 text-muted-foreground"><strong className="block text-sm text-foreground">Production-ready workflow</strong>Your selected template, every photo slot and crop position are included in the design brief. The Illustrator master remains <code>{template.sourceFile}</code>.</section></aside>
      </div>
    </main>
  );
}
