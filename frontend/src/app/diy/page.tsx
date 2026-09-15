"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Download, ImagePlus, LayoutTemplate, Loader2, Save, ShoppingBag, Sparkles, Sticker, Trash2, Upload, WandSparkles, Undo2, Redo2, AlignCenter, Maximize2 } from "lucide-react";
import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";
import PhotoCanvasEditor from "@/components/diy/PhotoCanvasEditor";

type BookSize = "A5" | "A6";
type PageChoice = "80" | "custom";
type Spread = {
  id: number;
  middleImage?: string;
  image?: string;
  caption: string;
  stickers?: string[];
};
type ImageAdjust = { scale: number; x: number; y: number };
type AdjustmentHistory = {
  coverAdjust: ImageAdjust;
  imageAdjustments: Record<number, ImageAdjust>;
};

const makeSpreads = (count: number, existing: Spread[] = []): Spread[] =>
  Array.from({ length: count }, (_, index) => ({
    ...(existing[index] || {}),
    id: index + 1,
    caption: index === 0 ? "Cover" : `Page ${index}`,
  }));
const sizeCopy: Record<
  BookSize,
  {
    label: string;
    dimensions: string;
    price: number;
    template: string;
    preview: string;
    innerPreview: string;
  }
> = {
  A5: {
    label: "A5 portrait",
    dimensions: "148 × 210 mm",
    price: 49,
    template: "INLAY PHOTOBOOK BINDER 1P.indd",
    preview: "/templates/photobook/a5-preview.png",
    innerPreview: "/templates/photobook/website/a5.png",
  },
  A6: {
    label: "A6 portrait",
    dimensions: "105 × 148 mm",
    price: 39,
    template: "INLAY PHOTOBOOK BINDER 1P A6.indd",
    preview: "/templates/photobook/a6-preview.png",
    innerPreview: "/templates/photobook/website/a6.png",
  },
};
const stickerChoices = ["★", "♥", "✦", "☀", "✿", "●"];
const coverDesigns: Record<BookSize, string[]> = {
  A5: ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10"],
  A6: ["D1", "D2", "D5", "D7", "D8", "D10"],
};

const ARCHIVE_PASSWORD = "kampungcetak.com";
const EXPORT_PPI = 300;
const mmToPixels = (mm: number) => Math.round((mm / 25.4) * EXPORT_PPI);
const pngCrc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
};
const addPngResolution = async (blob: Blob) => {
  const source = new Uint8Array(await blob.arrayBuffer());
  const ppm = Math.round(EXPORT_PPI / 0.0254);
  const payload = new Uint8Array(17);
  new DataView(payload.buffer).setUint32(0, 9);
  payload.set([112, 72, 89, 115], 4);
  const view = new DataView(payload.buffer);
  view.setUint32(8, ppm);
  view.setUint32(12, ppm);
  view.setUint8(16, 1);
  const crcInput = payload.slice(4);
  const crc = new Uint8Array(4);
  new DataView(crc.buffer).setUint32(0, pngCrc32(crcInput));
  return new Blob([source.slice(0, 33), payload, crc, source.slice(33)], {
    type: "image/png",
  });
};
const toDataUrl = async (src?: string) => {
  if (!src) return undefined;
  if (src.startsWith("data:")) return src;
  const response = await fetch(src);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
const loadExportImage = (src?: string) =>
  new Promise<HTMLImageElement | undefined>((resolve) => {
    if (!src) return resolve(undefined);
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(undefined);
    image.src = src;
  });
const drawPhotoBookPage = async (options: { size: BookSize; cover: boolean; background: string; backgroundImage?: string; image?: string; adjustment: ImageAdjust; stickers: string[]; title?: string; subtitle?: string }) => {
  const canvas = document.createElement("canvas");
  const width = options.cover ? mmToPixels(420) : options.size === "A5" ? mmToPixels(150) : mmToPixels(105);
  const height = options.cover ? mmToPixels(297) : options.size === "A5" ? mmToPixels(213) : mmToPixels(151);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas export is unavailable");
  const backgroundImage = await loadExportImage(options.backgroundImage);
  if (backgroundImage) {
    context.drawImage(backgroundImage, 0, 0, width, height);
  } else {
    context.fillStyle = options.background;
    context.fillRect(0, 0, width, height);
  }
  const photo = await loadExportImage(options.image);
  if (photo) {
    const imageWidth = options.cover ? width * 0.44 : width * (options.size === "A5" ? 0.762 : 0.78263);
    const imageHeight = options.cover ? height * 0.8 : height * (options.size === "A5" ? 0.83474 : 0.84656);
    const imageLeft = (width - imageWidth) / 2;
    const imageTop = (height - imageHeight) / 2;
    const fit = Math.min(imageWidth / photo.width, imageHeight / photo.height) * options.adjustment.scale;
    const drawWidth = photo.width * fit;
    const drawHeight = photo.height * fit;
    const drawLeft = imageLeft + (imageWidth - drawWidth) / 2 + (options.adjustment.x / 100) * imageWidth;
    const drawTop = imageTop + (imageHeight - drawHeight) / 2 + (options.adjustment.y / 100) * imageHeight;
    context.save();
    context.beginPath();
    context.rect(imageLeft, imageTop, imageWidth, imageHeight);
    context.clip();
    context.drawImage(photo, drawLeft, drawTop, drawWidth, drawHeight);
    context.restore();
  }
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `${Math.max(18, Math.round(width * 0.025))}px sans-serif`;
  options.stickers.forEach((sticker, index) => {
    context.fillStyle = "#111827";
    context.fillText(sticker, width * (0.18 + (index % 3) * 0.27), height * (0.12 + Math.floor(index / 3) * 0.16));
  });
  if (options.cover) {
    context.fillStyle = "#111827";
    context.font = `700 ${Math.max(28, Math.round(width * 0.04))}px sans-serif`;
    context.fillText(options.title || "", width * 0.73, height * 0.42);
    context.font = `${Math.max(18, Math.round(width * 0.02))}px sans-serif`;
    context.fillText(options.subtitle || "", width * 0.73, height * 0.5);
  }
  const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))), "image/png"));
  return addPngResolution(png);
};

function DiyPhotobookPage() {
  const [bookSize, setBookSize] = useState<BookSize>("A5");
  const [pageChoice, setPageChoice] = useState<PageChoice>("80");
  const [customPages, setCustomPages] = useState("80");
  const [title, setTitle] = useState("Our little moments");
  const [subtitle, setSubtitle] = useState("A book made by you");
  const [coverDesign, setCoverDesign] = useState("D1");
  const [backgroundChoice, setBackgroundChoice] = useState("teal");
  const [colourChoice, setColourChoice] = useState("cream");
  const [surfaceMode, setSurfaceMode] = useState<"background" | "color">("background");
  const [spreads, setSpreads] = useState<Spread[]>(() => makeSpreads(80));
  const [coverImage, setCoverImage] = useState<string>();
  const [coverAdjust, setCoverAdjust] = useState<ImageAdjust>({
    scale: 1,
    x: 0,
    y: 0,
  });
  const [imageAdjustments, setImageAdjustments] = useState<Record<number, ImageAdjust>>({});
  const [coverStickers, setCoverStickers] = useState<string[]>([]);
  const [showCover, setShowCover] = useState(true);
  const [selectedSpread, setSelectedSpread] = useState(0);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareError, setShareError] = useState("");
  const [templateReady, setTemplateReady] = useState(true);
  const [undoStack, setUndoStack] = useState<AdjustmentHistory[]>([]);
  const [redoStack, setRedoStack] = useState<AdjustmentHistory[]>([]);
  const [imageSelected, setImageSelected] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const dragOrigin = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | undefined>(undefined);
  const pageCount = pageChoice === "80" ? 80 : Math.max(1, Math.min(300, Number(customPages) || 1));
  const currentSpread = spreads[selectedSpread] || spreads[0];
  const activeImage = showCover ? coverImage : currentSpread?.middleImage || currentSpread?.image;
  const activeStickers = showCover ? coverStickers : currentSpread?.stickers || [];
  const activeAdjust = showCover ? coverAdjust : imageAdjustments[selectedSpread] || { scale: 1, x: 0, y: 0 };
  const total = useMemo(() => sizeCopy[bookSize].price + Math.max(0, pageCount - 80) * 2, [bookSize, pageCount]);

  useEffect(() => {
    const shared = new URLSearchParams(window.location.hash.slice(1)).get("share");
    const draft = shared ? decodeURIComponent(escape(atob(shared))) : window.localStorage.getItem("kampungcetak-photobook-draft");
    if (!draft) return;
    try {
      const parsed = JSON.parse(draft);
      const restoredPages = Number(parsed.pageCount) || 80;
      setBookSize(parsed.bookSize || "A5");
      setPageChoice(restoredPages === 80 ? "80" : "custom");
      setCustomPages(String(restoredPages));
      setTitle(parsed.title || "Our little moments");
      setSubtitle(parsed.subtitle || "A book made by you");
      setBackgroundChoice(parsed.backgroundChoice || "teal");
      setColourChoice(parsed.colourChoice || "cream");
      setSurfaceMode(parsed.surfaceMode || "background");
      setCoverDesign(parsed.coverDesign || "D1");
      setCoverImage(parsed.coverImage);
      setCoverAdjust(parsed.coverAdjust || { scale: 1, x: 0, y: 0 });
      setCoverStickers(parsed.coverStickers || []);
      setImageAdjustments(parsed.imageAdjustments || {});
      setSpreads(makeSpreads(restoredPages, parsed.spreads || []));
    } catch {
      window.localStorage.removeItem("kampungcetak-photobook-draft");
    }
  }, []);
  useEffect(() => {
    setSpreads((items) => makeSpreads(pageCount, items));
    setSelectedSpread((index) => Math.min(index, pageCount - 1));
  }, [pageCount]);
  useEffect(() => {
    setTemplateReady(true);
  }, [bookSize]);

  const updateSpreadImage = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const image = URL.createObjectURL(file);
    if (showCover) setCoverImage(image);
    else setSpreads((items) => items.map((spread, index) => (index === selectedSpread ? { ...spread, middleImage: image, image } : spread)));
  };
  const deleteActiveImage = () => {
    if (showCover) setCoverImage(undefined);
    else setSpreads((items) => items.map((spread, index) => (index === selectedSpread ? { ...spread, middleImage: undefined, image: undefined } : spread)));
    setImageSelected(false);
  };
  const updateImageAdjust = (changes: Partial<ImageAdjust>, record = true) => {
    if (record) {
      setUndoStack((items) => [...items, { coverAdjust, imageAdjustments }]);
      setRedoStack([]);
    }
    if (showCover) setCoverAdjust((value) => ({ ...value, ...changes }));
    else
      setImageAdjustments((values) => ({
        ...values,
        [selectedSpread]: {
          ...(values[selectedSpread] || { scale: 1, x: 0, y: 0 }),
          ...changes,
        },
      }));
  };
  const undo = () => {
    setUndoStack((items) => {
      const previous = items.at(-1);
      if (!previous) return items;
      setRedoStack((future) => [...future, { coverAdjust, imageAdjustments }]);
      setCoverAdjust(previous.coverAdjust);
      setImageAdjustments(previous.imageAdjustments);
      return items.slice(0, -1);
    });
  };
  const redo = () => {
    setRedoStack((items) => {
      const next = items.at(-1);
      if (!next) return items;
      setUndoStack((past) => [...past, { coverAdjust, imageAdjustments }]);
      setCoverAdjust(next.coverAdjust);
      setImageAdjustments(next.imageAdjustments);
      return items.slice(0, -1);
    });
  };
  const beginImageDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activeImage) return;
    setImageSelected(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    setUndoStack((items) => [...items, { coverAdjust, imageAdjustments }]);
    setRedoStack([]);
    dragOrigin.current = {
      startX: event.clientX,
      startY: event.clientY,
      baseX: activeAdjust.x,
      baseY: activeAdjust.y,
    };
  };
  const dragImage = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragOrigin.current) return;
    updateImageAdjust(
      {
        x: Math.max(-45, Math.min(45, dragOrigin.current.baseX + (event.clientX - dragOrigin.current.startX) / 3)),
        y: Math.max(-45, Math.min(45, dragOrigin.current.baseY + (event.clientY - dragOrigin.current.startY) / 3)),
      },
      false,
    );
  };
  const endImageDrag = () => {
    dragOrigin.current = undefined;
  };
  const addSticker = (sticker: string) => {
    if (showCover) setCoverStickers((items) => [...items, sticker]);
    else setSpreads((items) => items.map((spread, index) => (index === selectedSpread ? { ...spread, stickers: [...(spread.stickers || []), sticker] } : spread)));
  };
  const removeSticker = (stickerIndex: number) => {
    if (showCover) setCoverStickers((items) => items.filter((_, index) => index !== stickerIndex));
    else
      setSpreads((items) =>
        items.map((spread, index) =>
          index === selectedSpread
            ? {
                ...spread,
                stickers: (spread.stickers || []).filter((_, itemIndex) => itemIndex !== stickerIndex),
              }
            : spread,
        ),
      );
  };
  const activeDesign = coverDesigns[bookSize].includes(coverDesign) ? coverDesign : coverDesigns[bookSize][0];
  const templatePreview = `/templates/photobook/covers/${bookSize.toLowerCase()}/${activeDesign.toLowerCase()}.png`;
  const previewImage = showCover ? templatePreview : sizeCopy[bookSize].innerPreview;
  const previewAspect = showCover ? "1190.55 / 841.89" : bookSize === "A5" ? "150 / 213" : "105 / 151";
  const draftData = {
    bookSize,
    pageCount,
    coverFinish: "Hardcover",
    coverDesign: activeDesign,
    coverImage,
    coverAdjust,
    coverStickers,
    imageAdjustments,
    title,
    subtitle,
    backgroundChoice,
    colourChoice,
    surfaceMode,
    spreads,
  };
  const saveDraft = () => {
    window.localStorage.setItem("kampungcetak-photobook-draft", JSON.stringify(draftData));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };
  const downloadFinishedBook = async () => {
    setExporting(true);
    try {
      const writer = new BlobWriter("application/zip");
      const zip = new ZipWriter(writer, { password: ARCHIVE_PASSWORD });
      const coverBackground = await toDataUrl(templatePreview);
      const coverPhoto = await toDataUrl(coverImage);
      await zip.add(
        "00-cover.png",
        new BlobReader(
          await drawPhotoBookPage({
            size: bookSize,
            cover: true,
            background: previewBackground,
            backgroundImage: coverBackground,
            image: coverPhoto,
            adjustment: coverAdjust,
            stickers: coverStickers,
            title,
            subtitle,
          }),
        ),
      );
      for (let index = 0; index < spreads.length; index += 1) {
        const spread = spreads[index];
        const photo = await toDataUrl(spread.middleImage || spread.image);
        const png = await drawPhotoBookPage({
          size: bookSize,
          cover: false,
          background: previewBackground,
          backgroundImage: await toDataUrl(sizeCopy[bookSize].innerPreview),
          image: photo,
          adjustment: imageAdjustments[index] || { scale: 1, x: 0, y: 0 },
          stickers: spread.stickers || [],
        });
        await zip.add(`${String(index + 1).padStart(2, "0")}-page.png`, new BlobReader(png));
      }
      await zip.close();
      const archive = await writer.getData();
      const url = URL.createObjectURL(archive);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `kampungcetak-${bookSize.toLowerCase()}-photobook-finished.zip`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setShareError("Could not export the finished book. Please try again.");
    } finally {
      setExporting(false);
    }
  };
  const copyReviewLink = async () => {
    setShareError("");
    try {
      const shared = {
        ...draftData,
        coverImage: await toDataUrl(coverImage),
        spreads: await Promise.all(
          spreads.map(async (spread) => ({
            ...spread,
            middleImage: await toDataUrl(spread.middleImage),
            image: await toDataUrl(spread.image),
          })),
        ),
      };
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(shared))));
      const link = `${window.location.origin}/diy?mode=photobook#share=${encoded}`;
      if (link.length > 1800000) {
        setShareError("This draft is too large for a browser link. Download the finished archive and send it to admin instead.");
        return;
      }
      await navigator.clipboard.writeText(link);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2200);
    } catch {
      setShareError("Could not copy the review link. Please allow clipboard access and try again.");
    }
  };
  const downloadDraft = downloadFinishedBook;
  const previewColour = colourChoice === "coral" ? "#f47c68" : "#f8e4a8";
  const previewBackground = surfaceMode === "color" ? previewColour : backgroundChoice === "sand" ? "linear-gradient(145deg,#d8b98c,#8b6b49)" : "linear-gradient(145deg,#087f73,#064e49)";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/90 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Back to Kampung Cetak" className="rounded-full border border-border p-2 transition hover:border-primary hover:text-primary">
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Kampung Cetak</p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">DIY Photobook</h1>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <Sparkles className="size-4 text-primary" /> Make it yours, page by page
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1500px] gap-5 p-4 sm:p-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="order-2 space-y-4 lg:order-1">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <LayoutTemplate className="size-4 text-primary" />
              <h2 className="font-semibold">Book setup</h2>
            </div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Size</label>
            <div className="grid grid-cols-2 gap-2">
              {(["A5", "A6"] as BookSize[]).map((size) => (
                <button key={size} onClick={() => setBookSize(size)} className={`rounded-xl border p-3 text-left transition ${bookSize === size ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}>
                  <span className="block font-bold">{size}</span>
                  <span className="text-xs text-muted-foreground">{sizeCopy[size].dimensions}</span>
                </button>
              ))}
            </div>
            <label className="mb-2 mt-5 block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="pages">
              Pages
            </label>
            <select id="pages" value={pageChoice} onChange={(event) => setPageChoice(event.target.value as PageChoice)} className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm">
              <option value="80">80 pages</option>
              <option value="custom">Custom</option>
            </select>
            {pageChoice === "custom" && <input aria-label="Custom page count" type="number" min={1} max={300} value={customPages} onChange={(event) => setCustomPages(event.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm" placeholder="Type page count" />}
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
              <span className="font-semibold">Cover finish:</span> Hardcover
            </div>
            <div className="mt-4 rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">
              <span className="font-semibold text-foreground">Active template:</span>
              <br />
              {sizeCopy[bookSize].template}
              <br />
              <span className="text-[11px]">No suffix = A5 · “A6” suffix = A6</span>
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h2 className="mb-3 font-semibold">Your pages · cover + {pageCount} pages</h2>
            <div className="grid max-h-80 grid-cols-4 gap-2 overflow-y-auto pr-1">
              <button onClick={() => setShowCover(true)} className={`relative aspect-[3/4] overflow-hidden rounded-lg border text-left ${showCover ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
                <img src={previewImage} alt={`${bookSize} cover`} className="h-full w-full object-cover" />
                <span className="absolute bottom-0 left-0 right-0 bg-black/55 px-1 py-0.5 text-center text-[9px] text-white">Cover</span>
              </button>
              {spreads.map((spread, index) => (
                <button
                  key={spread.id}
                  onClick={() => {
                    setShowCover(false);
                    setSelectedSpread(index);
                  }}
                  className={`relative aspect-[3/4] overflow-hidden rounded-lg border text-left ${showCover ? "border-border" : selectedSpread === index ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                >
                  {spread.middleImage || spread.image ? <img src={spread.middleImage || spread.image} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center bg-muted text-[10px] text-muted-foreground">{spread.caption}</span>}
                  <span className="absolute bottom-0 left-0 right-0 bg-black/55 px-1 py-0.5 text-center text-[9px] text-white">{spread.id}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>
        <section className="order-1 flex min-h-[520px] flex-col rounded-3xl border border-border bg-muted/40 p-4 shadow-inner sm:p-6 lg:order-2 lg:sticky lg:top-4 lg:self-start">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Live preview · {sizeCopy[bookSize].label}</p>
              <p className="text-sm text-muted-foreground">
                {pageCount} pages · {showCover ? "Cover" : `Page ${selectedSpread + 1}`}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Template preview</span>
          </div>
          <div className="flex flex-1 items-start justify-center py-4">
            <div
              className="relative w-[min(76vw,520px)] overflow-hidden rounded-[1.25rem] border-[10px] border-white bg-white shadow-2xl"
              onClick={() => setImageSelected(false)}
              style={{
                background: previewBackground,
                aspectRatio: previewAspect,
              }}
            >
              <img
                src={previewImage}
                alt={showCover ? `${bookSize} ${activeDesign} cover design` : `${bookSize} inlay template`}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  setTemplateReady(false);
                }}
              />
              {!templateReady && (
                <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm font-semibold text-white">
                  Template {activeDesign} preview is not available
                  <br />
                  <code>
                    /public/templates/photobook/{bookSize.toLowerCase()}
                    -preview.png
                  </code>
                </div>
              )}
              {activeImage && (
                <div
                  className={`absolute z-10 cursor-move overflow-hidden outline outline-2 -outline-offset-2 outline-emerald-500 ${showCover ? "left-[4%] top-[4%] h-[80%] w-[44%]" : "left-[7%] top-[5%] h-[66%] w-[62%]"} bg-black`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setImageSelected(true);
                  }}
                  onPointerDown={beginImageDrag}
                  onPointerMove={dragImage}
                  onPointerUp={endImageDrag}
                  onPointerCancel={endImageDrag}
                >
                  <img
                    src={activeImage}
                    alt="Image inside selected cover design"
                    className="h-full w-full object-cover transition-transform"
                    style={{
                      transform: `translate(${activeAdjust.x}%, ${activeAdjust.y}%) scale(${activeAdjust.scale})`,
                    }}
                  />
                </div>
              )}
              {activeStickers.map((sticker, index) => (
                <button
                  key={`${sticker}-${index}`}
                  onClick={() => removeSticker(index)}
                  className="absolute text-3xl drop-shadow"
                  style={{
                    left: `${18 + (index % 3) * 27}%`,
                    top: `${12 + Math.floor(index / 3) * 16}%`,
                    color: previewColour,
                  }}
                  aria-label="Remove sticker"
                >
                  {sticker}
                </button>
              ))}
              {activeImage && imageSelected && (
                <div className="absolute left-1/2 top-2 z-30 flex max-w-[calc(100%-1rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-xl border border-border bg-background/95 p-1.5 text-xs shadow-xl backdrop-blur-md" role="toolbar" aria-label="Photobook image adjustments">
                  <button onClick={undo} disabled={!undoStack.length} className="rounded-lg p-2 hover:bg-muted disabled:opacity-35" title="Undo">
                    <Undo2 className="size-4" />
                  </button>
                  <button onClick={redo} disabled={!redoStack.length} className="rounded-lg p-2 hover:bg-muted disabled:opacity-35" title="Redo">
                    <Redo2 className="size-4" />
                  </button>
                  <button onClick={() => replaceInputRef.current?.click()} className="rounded-lg p-2 text-primary hover:bg-primary/10" title="Replace image">
                    <Upload className="size-4" />
                  </button>
                  <input ref={replaceInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => updateSpreadImage(event.target.files?.[0])} />
                  <button onClick={deleteActiveImage} className="rounded-lg p-2 text-destructive hover:bg-destructive/10" title="Delete image">
                    <Trash2 className="size-4" />
                  </button>
                  <label className="flex items-center gap-2 px-2 font-semibold">
                    Zoom <input type="range" min="0.5" max="2.5" step="0.05" value={activeAdjust.scale} onChange={(event) => updateImageAdjust({ scale: Number(event.target.value) })} className="w-24" />
                  </label>
                  <button onClick={() => updateImageAdjust({ x: 0, y: 0 })} className="rounded-lg p-2 hover:bg-muted" title="Center image">
                    <AlignCenter className="size-4" />
                  </button>
                  <button onClick={() => updateImageAdjust({ x: 0, y: 0, scale: 1 })} className="rounded-lg p-2 hover:bg-muted" title="Reset crop">
                    <Maximize2 className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button disabled={showCover} onClick={() => (showCover ? null : selectedSpread === 0 ? setShowCover(true) : setSelectedSpread((value) => Math.max(0, value - 1)))} className="rounded-full border border-border bg-card px-4 py-2 text-sm disabled:opacity-40">
              Previous
            </button>
            <span className="text-sm font-semibold text-muted-foreground">{showCover ? "Cover" : `${selectedSpread + 1} / ${spreads.length}`}</span>
            <button disabled={!showCover && selectedSpread === spreads.length - 1} onClick={() => (showCover ? setShowCover(false) : setSelectedSpread((value) => Math.min(spreads.length - 1, value + 1)))} className="rounded-full border border-border bg-card px-4 py-2 text-sm disabled:opacity-40">
              Next
            </button>
          </div>
        </section>
        <aside className="order-3 space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <WandSparkles className="size-4 text-primary" />
              <h2 className="font-semibold">Cover details</h2>
            </div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="title">
              Title
            </label>
            <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} className="mb-3 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm" />
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="subtitle">
              Subtitle
            </label>
            <input id="subtitle" value={subtitle} onChange={(event) => setSubtitle(event.target.value)} className="mb-4 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm" />
            <div className="mt-4 border-t border-border pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground" htmlFor="cover-design">
                Existing cover design
              </label>
              <select id="cover-design" value={activeDesign} onChange={(event) => setCoverDesign(event.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm">
                {coverDesigns[bookSize].map((design) => (
                  <option key={design} value={design}>
                    {design}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">Choose a design from the supplied {bookSize} cover templates.</p>
            </div>
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Use background or colour</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setSurfaceMode("background")} className={`rounded-xl border p-3 text-left text-sm font-semibold ${surfaceMode === "background" ? "border-primary bg-primary/10" : "border-border"}`}>
                  Background
                </button>
                <button onClick={() => setSurfaceMode("color")} className={`rounded-xl border p-3 text-left text-sm font-semibold ${surfaceMode === "color" ? "border-primary bg-primary/10" : "border-border"}`}>
                  Colour
                </button>
              </div>
              {surfaceMode === "background" ? (
                <label className="block text-sm font-semibold">
                  Background
                  <select value={backgroundChoice} onChange={(event) => setBackgroundChoice(event.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm">
                    <option value="teal">Teal</option>
                    <option value="sand">Sand</option>
                  </select>
                </label>
              ) : (
                <label className="block text-sm font-semibold">
                  Colour
                  <select value={colourChoice} onChange={(event) => setColourChoice(event.target.value)} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm">
                    <option value="cream">Cream</option>
                    <option value="coral">Coral</option>
                  </select>
                </label>
              )}
            </div>
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Design image · {showCover ? "cover" : `page ${selectedSpread + 1}`}</p>
              <div className="rounded-xl border border-border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">Image inside design</span>
                  {activeImage && (
                    <button
                      onClick={() =>
                        showCover
                          ? setCoverImage(undefined)
                          : setSpreads((items) =>
                              items.map((spread, index) =>
                                index === selectedSpread
                                  ? {
                                      ...spread,
                                      middleImage: undefined,
                                      image: undefined,
                                    }
                                  : spread,
                              ),
                            )
                      }
                      className="text-xs font-semibold text-destructive"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 px-3 py-3 text-xs font-semibold text-primary hover:bg-primary/5">
                  <Upload className="size-3.5" /> Replace design image
                  <input type="file" accept="image/*" className="sr-only" onChange={(event) => updateSpreadImage(event.target.files?.[0])} />
                </label>
              </div>
            </div>
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stickers · {showCover ? "cover" : `page ${selectedSpread + 1}`}</p>
              <div className="flex flex-wrap gap-2">
                {stickerChoices.map((sticker) => (
                  <button key={sticker} onClick={() => addSticker(sticker)} className="grid size-10 place-items-center rounded-xl border border-border bg-background text-xl hover:border-primary" aria-label={`Add ${sticker} sticker`}>
                    {sticker}
                  </button>
                ))}
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Estimated starting price</p>
                <p className="text-3xl font-bold text-primary">RM {total.toFixed(2)}</p>
              </div>
              <span className="rounded-full bg-card px-3 py-1 text-xs font-bold">{bookSize}</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">Final delivery charges and production confirmation appear at checkout.</p>
          </section>
          <div className="grid gap-2">
            <button onClick={saveDraft} className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 py-3.5 font-bold text-white transition hover:bg-neutral-800">
              <Save className="size-4" /> {saved ? "Draft saved" : "Save draft"}
            </button>
            <button onClick={downloadDraft} className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3.5 text-sm font-semibold hover:border-primary hover:text-primary">
              <Download className="size-4" /> Download draft data
            </button>
            <Link href="/home/shop?category=photobook" className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-5 py-3.5 text-sm font-bold text-primary hover:bg-primary/5">
              <ShoppingBag className="size-4" /> Continue to photobook product
            </Link>
          </div>
          <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
              <ImagePlus className="size-4 text-primary" /> Replace image inside design
            </div>
            Upload a photo to replace the image area inside the selected cover design.
          </div>
        </aside>
      </div>
      <footer className="mx-auto flex max-w-[1500px] items-center gap-2 px-4 pb-6 text-xs text-muted-foreground sm:px-6">
        <Trash2 className="size-3.5" /> A5/A6 template preview assets are required in the public templates folder.
      </footer>
      <div className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-stretch gap-2 rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur sm:flex-row sm:items-center">
        <button onClick={downloadFinishedBook} disabled={exporting} className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-60">
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {exporting ? "Preparing PNGs..." : "Download finished book"}
        </button>
        <button onClick={copyReviewLink} className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/5">
          {shareCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {shareCopied ? "Link copied" : "Copy review link"}
        </button>
        {shareError && <span className="max-w-xs text-xs text-destructive">{shareError}</span>}
      </div>
    </main>
  );
}

export default function DiyPage() {
  const searchParams = useSearchParams();
  return searchParams.get("mode") === "photobook" ? <DiyPhotobookPage /> : <PhotoCanvasEditor />;
}
