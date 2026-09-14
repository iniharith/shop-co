"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, ImagePlus, LayoutTemplate, Save, ShoppingBag, Sparkles, Trash2, Upload, WandSparkles } from "lucide-react";

type BookSize = "A5" | "A6";
type Spread = { id: number; backgroundImage?: string; middleImage?: string; image?: string; caption: string };

const initialSpreads: Spread[] = Array.from({ length: 8 }, (_, index) => ({
  id: index + 1,
  caption: index === 0 ? "Cover" : `Page ${index}`,
}));

const sizeCopy: Record<BookSize, { label: string; dimensions: string; price: number; template: string }> = {
  A5: { label: "A5 portrait", dimensions: "148 × 210 mm", price: 49, template: "INLAY PHOTOBOOK BINDER 1P.indd" },
  A6: { label: "A6 portrait", dimensions: "105 × 148 mm", price: 39, template: "INLAY PHOTOBOOK BINDER 1P A6.indd" },
};

export default function DiyPhotobookPage() {
  const [bookSize, setBookSize] = useState<BookSize>("A5");
  const [pageCount, setPageCount] = useState(8);
  const [coverFinish, setCoverFinish] = useState("Hardcover");
  const [title, setTitle] = useState("Our little moments");
  const [subtitle, setSubtitle] = useState("A book made by you");
  const [accent, setAccent] = useState("#087f73");
  const [spreads, setSpreads] = useState<Spread[]>(initialSpreads);
  const [selectedSpread, setSelectedSpread] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const draft = window.localStorage.getItem("kampungcetak-photobook-draft");
    if (!draft) return;
    try {
      const parsed = JSON.parse(draft);
      setBookSize(parsed.bookSize || "A5");
      setPageCount(parsed.pageCount || 8);
      setCoverFinish(parsed.coverFinish || "Hardcover");
      setTitle(parsed.title || "Our little moments");
      setSubtitle(parsed.subtitle || "A book made by you");
      setAccent(parsed.accent || "#087f73");
      setSpreads(parsed.spreads?.length ? parsed.spreads : initialSpreads);
    } catch {
      window.localStorage.removeItem("kampungcetak-photobook-draft");
    }
  }, []);

  const currentSpread = spreads[selectedSpread] || spreads[0];
  const total = useMemo(() => sizeCopy[bookSize].price + (pageCount - 8) * 2 + (coverFinish === "Softcover" ? -8 : 0), [bookSize, pageCount, coverFinish]);

  const updateSpreadLayer = (layer: "backgroundImage" | "middleImage", file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const image = URL.createObjectURL(file);
    setSpreads((items) => items.map((spread, index) => index === selectedSpread ? { ...spread, [layer]: image } : spread));
  };

  const clearSpreadLayer = (layer: "backgroundImage" | "middleImage") => {
    setSpreads((items) => items.map((spread, index) => {
      if (index !== selectedSpread) return spread;
      const next = { ...spread };
      delete next[layer];
      return next;
    }));
  };

  const saveDraft = () => {
    window.localStorage.setItem("kampungcetak-photobook-draft", JSON.stringify({ bookSize, pageCount, coverFinish, title, subtitle, accent, spreads }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const downloadDraft = () => {
    const blob = new Blob([JSON.stringify({ bookSize, pageCount, coverFinish, title, subtitle, accent, spreads }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kampungcetak-${bookSize.toLowerCase()}-photobook-draft.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/90 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Back to Kampung Cetak" className="rounded-full border border-border p-2 transition hover:border-primary hover:text-primary"><ArrowLeft className="size-4" /></Link>
            <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Kampung Cetak</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">DIY Photobook</h1></div>
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex"><Sparkles className="size-4 text-primary" /> Make it yours, page by page</div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-5 p-4 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="order-2 space-y-4 lg:order-1">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><LayoutTemplate className="size-4 text-primary" /><h2 className="font-semibold">Book setup</h2></div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Size</label>
            <div className="grid grid-cols-2 gap-2">
              {(["A5", "A6"] as BookSize[]).map((size) => <button key={size} onClick={() => setBookSize(size)} className={`rounded-xl border p-3 text-left transition ${bookSize === size ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}><span className="block font-bold">{size}</span><span className="text-xs text-muted-foreground">{sizeCopy[size].dimensions}</span></button>)}
            </div>
            <label className="mb-2 mt-5 block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="pages">Pages</label>
            <select id="pages" value={pageCount} onChange={(event) => setPageCount(Number(event.target.value))} className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm"><option value={8}>8 pages</option><option value={12}>12 pages</option><option value={20}>20 pages</option></select>
            <label className="mb-2 mt-5 block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="cover">Cover finish</label>
            <select id="cover" value={coverFinish} onChange={(event) => setCoverFinish(event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm"><option>Hardcover</option><option>Softcover</option></select>
            <div className="mt-4 rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground"><span className="font-semibold text-foreground">Active template:</span><br />{sizeCopy[bookSize].template}<br /><span className="text-[11px]">No suffix = A5 · “A6” suffix = A6</span></div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Your pages</h2>
            <div className="grid max-h-80 grid-cols-4 gap-2 overflow-y-auto pr-1">{spreads.map((spread, index) => <button key={spread.id} onClick={() => setSelectedSpread(index)} className={`relative aspect-[3/4] overflow-hidden rounded-lg border text-left ${selectedSpread === index ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>{(spread.middleImage || spread.image || spread.backgroundImage) ? <img src={spread.middleImage || spread.image || spread.backgroundImage} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center bg-muted text-[10px] text-muted-foreground">{spread.caption}</span>}<span className="absolute bottom-0 left-0 right-0 bg-black/55 px-1 py-0.5 text-center text-[9px] text-white">{spread.id}</span></button>)}</div>
          </section>
        </aside>

        <section className="order-1 flex min-h-[620px] flex-col rounded-3xl border border-border bg-muted/40 p-4 shadow-inner sm:p-6 lg:order-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Live preview</p><p className="text-sm text-muted-foreground">{sizeCopy[bookSize].label} · {pageCount} pages · page {selectedSpread + 1}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">2 editable image layers</span></div>
          <div className="flex flex-1 items-center justify-center py-8"><div className="relative aspect-[0.72] w-[min(76vw,380px)] overflow-hidden rounded-[1.25rem] border-[10px] border-white bg-white shadow-2xl" style={{ borderColor: coverFinish === "Hardcover" ? "#f8f8f5" : "#e5e7eb" }}><div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.22),transparent_32%),linear-gradient(145deg,#087f73,#064e49)]" />{currentSpread?.backgroundImage && <img src={currentSpread.backgroundImage} alt="Background layer" className="absolute inset-0 h-full w-full object-cover" />}<div className="absolute inset-[18%] overflow-hidden rounded-xl border border-white/45 bg-white/10 shadow-lg">{(currentSpread?.middleImage || currentSpread?.image) ? <img src={currentSpread.middleImage || currentSpread.image} alt="Middle image layer" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center px-4 text-center text-xs font-semibold text-white/80">Middle image layer<br />not added</div>}</div><div className="absolute inset-5 flex flex-col items-center justify-end border border-white/40 px-5 pb-5 text-center text-white"><p className="mb-1 text-[9px] font-bold uppercase tracking-[0.35em] opacity-80">Kampung Cetak</p><h2 className="text-2xl font-bold leading-tight drop-shadow" style={{ color: accent }}>{title}</h2><p className="mt-1 text-xs opacity-90">{subtitle}</p></div></div></div>
          <div className="flex items-center justify-center gap-3"><button disabled={selectedSpread === 0} onClick={() => setSelectedSpread((value) => Math.max(0, value - 1))} className="rounded-full border border-border bg-card px-4 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-sm font-semibold text-muted-foreground">{selectedSpread + 1} / {spreads.length}</span><button disabled={selectedSpread === spreads.length - 1} onClick={() => setSelectedSpread((value) => Math.min(spreads.length - 1, value + 1))} className="rounded-full border border-border bg-card px-4 py-2 text-sm disabled:opacity-40">Next</button></div>
        </section>

        <aside className="order-3 space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="mb-4 flex items-center gap-2"><WandSparkles className="size-4 text-primary" /><h2 className="font-semibold">Cover details</h2></div><label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="title">Title</label><input id="title" value={title} onChange={(event) => setTitle(event.target.value)} className="mb-3 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm" /><label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="subtitle">Subtitle</label><input id="subtitle" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="mb-4 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm" /><label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="accent">Accent colour</label><input id="accent" type="color" value={accent} onChange={(event) => setAccent(event.target.value)} className="mb-5 h-11 w-full cursor-pointer rounded-xl border border-input bg-background p-1" /><div className="space-y-3 border-t border-border pt-4"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Image layers · page {selectedSpread + 1}</p><div className="rounded-xl border border-border p-3"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-sm font-semibold">Background image</span>{currentSpread?.backgroundImage && <button onClick={() => clearSpreadLayer("backgroundImage")} className="text-xs font-semibold text-destructive">Clear</button>}</div><label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 px-3 py-3 text-xs font-semibold text-primary hover:bg-primary/5"><Upload className="size-3.5" /> Replace background<input type="file" accept="image/*" className="sr-only" onChange={(event) => updateSpreadLayer("backgroundImage", event.target.files?.[0])} /></label></div><div className="rounded-xl border border-border p-3"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-sm font-semibold">Middle image</span>{(currentSpread?.middleImage || currentSpread?.image) && <button onClick={() => clearSpreadLayer("middleImage")} className="text-xs font-semibold text-destructive">Clear</button>}</div><label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 px-3 py-3 text-xs font-semibold text-primary hover:bg-primary/5"><ImagePlus className="size-3.5" /> Replace middle image<input type="file" accept="image/*" className="sr-only" onChange={(event) => updateSpreadLayer("middleImage", event.target.files?.[0])} /></label></div></div></section>
          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><div className="flex items-end justify-between"><div><p className="text-sm text-muted-foreground">Estimated starting price</p><p className="text-3xl font-bold text-primary">RM {total.toFixed(2)}</p></div><span className="rounded-full bg-card px-3 py-1 text-xs font-bold">{bookSize}</span></div><p className="mt-3 text-xs leading-5 text-muted-foreground">Final delivery charges and production confirmation appear at checkout.</p></section>
          <div className="grid gap-2"><button onClick={saveDraft} className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 py-3.5 font-bold text-white transition hover:bg-neutral-800"><Save className="size-4" /> {saved ? "Draft saved" : "Save draft"}</button><button onClick={downloadDraft} className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3.5 text-sm font-semibold hover:border-primary hover:text-primary"><Download className="size-4" /> Download draft data</button><Link href="/home/shop?category=photobook" className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-5 py-3.5 text-sm font-bold text-primary hover:bg-primary/5"><ShoppingBag className="size-4" /> Continue to photobook product</Link></div>
          <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground"><div className="mb-2 flex items-center gap-2 font-semibold text-foreground"><ImagePlus className="size-4 text-primary" /> Own design upload</div>Upload is currently local for this draft. The production version will send the artwork to your existing storage and attach it to the cart item.</div>
        </aside>
      </div>
      <footer className="mx-auto flex max-w-[1500px] items-center gap-2 px-4 pb-6 text-xs text-muted-foreground sm:px-6"><Trash2 className="size-3.5" /> Draft editor preview — replace the temporary visual assets and copy before launch.</footer>
    </main>
  );
}
