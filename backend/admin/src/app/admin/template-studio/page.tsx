"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  ChevronDown,
  Circle,
  Copy,
  Download,
  Eye,
  FileImage,
  ImagePlus,
  Lock,
  Move,
  MousePointer2,
  Plus,
  Redo2,
  RotateCw,
  Square,
  Trash2,
  Type,
  Undo2,
  Upload,
  ZoomIn,
} from "lucide-react";
import { deleteTemplateFont, DiyTemplate, getDiyTemplates, getTemplateFonts, TemplateFont, updateDiyTemplate, uploadTemplateFont } from "@/api/templateFonts";
import { useSession } from "next-auth/react";
import {
  ChangeEvent,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Shape = "rect" | "circle";
type Tool = "select" | "photo" | "text" | "pan";
type PhotoSlot = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shape: Shape;
  required: boolean;
  locked: boolean;
  image?: string;
};
type TextSlot = {
  id: string;
  name: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  editable: boolean;
  locked: boolean;
};
type Artboard = {
  id: string;
  name: string;
  width: number;
  height: number;
  background?: string;
  sourceName?: string;
  diyTemplate?: DiyTemplate;
  lockedArtwork: boolean;
  photoSlots: PhotoSlot[];
  textSlots: TextSlot[];
};
type StudioState = { artboards: Artboard[] };
type Selection = { type: "photo" | "text"; id: string } | null;
type DragState = {
  type: "move" | "resize";
  layer: "photo" | "text";
  id: string;
  startX: number;
  startY: number;
  origin: PhotoSlot | TextSlot;
  snapshot: StudioState;
};

const studioKey = "kampung-cetak-template-studio-v1";
const diyBaseUrl = (process.env.NEXT_PUBLIC_DIY_URL || "https://diy.kampungcetak.com").replace(/\/$/, "");
const cloneState = (state: StudioState): StudioState =>
  JSON.parse(JSON.stringify(state));
const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const initialState: StudioState = {
  artboards: [
    {
      id: "artboard-1",
      name: "Frame 8 × 10 in",
      width: 12,
      height: 18,
      lockedArtwork: true,
      photoSlots: [
        {
          id: "photo-1",
          name: "Photo 1",
          x: 12,
          y: 12,
          width: 76,
          height: 58,
          rotation: 0,
          shape: "rect",
          required: true,
          locked: false,
        },
      ],
      textSlots: [
        {
          id: "text-1",
          name: "Customer text",
          text: "Your title",
          x: 18,
          y: 75,
          width: 64,
          height: 9,
          rotation: 0,
          fontFamily: "Inter",
          fontSize: 5,
          color: "#102a32",
          align: "center",
          editable: true,
          locked: false,
        },
      ],
    },
    {
      id: "frame-12x18",
      name: "Frame 12 × 18 in",
      width: 12,
      height: 18,
      lockedArtwork: true,
      photoSlots: [{ id: "frame-12x18-photo", name: "Main photo", x: 8, y: 8, width: 84, height: 70, rotation: 0, shape: "rect", required: true, locked: false }],
      textSlots: [{ id: "frame-12x18-text", name: "Caption", text: "Your caption", x: 12, y: 82, width: 76, height: 8, rotation: 0, fontFamily: "Inter", fontSize: 4, color: "#102a32", align: "center", editable: true, locked: false }],
    },
    {
      id: "frame-16x20-landscape",
      name: "Frame 16 × 20 in (Landscape)",
      width: 20,
      height: 16,
      lockedArtwork: true,
      photoSlots: [{ id: "frame-16x20-photo", name: "Main photo", x: 7, y: 10, width: 86, height: 65, rotation: 0, shape: "rect", required: true, locked: false }],
      textSlots: [{ id: "frame-16x20-text", name: "Caption", text: "Your caption", x: 12, y: 80, width: 76, height: 8, rotation: 0, fontFamily: "Inter", fontSize: 4, color: "#102a32", align: "center", editable: true, locked: false }],
    },
    {
      id: "photobook-cover",
      name: "Photobook — Cover",
      width: 12,
      height: 12,
      lockedArtwork: true,
      photoSlots: [{ id: "photobook-cover-photo", name: "Cover photo", x: 6, y: 6, width: 88, height: 70, rotation: 0, shape: "rect", required: true, locked: false }],
      textSlots: [
        { id: "photobook-cover-title", name: "Title", text: "Our Story", x: 10, y: 80, width: 80, height: 7, rotation: 0, fontFamily: "Georgia", fontSize: 5, color: "#102a32", align: "center", editable: true, locked: false },
        { id: "photobook-cover-date", name: "Date", text: "2026", x: 10, y: 88, width: 80, height: 4, rotation: 0, fontFamily: "Inter", fontSize: 3, color: "#102a32", align: "center", editable: true, locked: false },
      ],
    },
    {
      id: "photobook-page",
      name: "Photobook — Inside Page",
      width: 12,
      height: 12,
      lockedArtwork: true,
      photoSlots: [
        { id: "photobook-page-photo-1", name: "Photo 1", x: 7, y: 8, width: 41, height: 62, rotation: 0, shape: "rect", required: true, locked: false },
        { id: "photobook-page-photo-2", name: "Photo 2", x: 52, y: 8, width: 41, height: 62, rotation: 0, shape: "rect", required: true, locked: false },
      ],
      textSlots: [{ id: "photobook-page-caption", name: "Page caption", text: "A moment to remember", x: 10, y: 78, width: 80, height: 7, rotation: 0, fontFamily: "Inter", fontSize: 4, color: "#102a32", align: "center", editable: true, locked: false }],
    },
  ],
};

const fieldClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs outline-none focus:border-primary";
const buttonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40";

export default function TemplateStudioPage() {
  const [state, setState] = useState<StudioState>(initialState);
  const [past, setPast] = useState<StudioState[]>([]);
  const [future, setFuture] = useState<StudioState[]>([]);
  const [selectedArtboardId, setSelectedArtboardId] = useState("artboard-1");
  const [selection, setSelection] = useState<Selection>({
    type: "photo",
    id: "photo-1",
  });
  const [tool, setTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(72);
  const [customerPreview, setCustomerPreview] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [customFonts, setCustomFonts] = useState<TemplateFont[]>([]);
  const [fontBusy, setFontBusy] = useState(false);
  const [fontMessage, setFontMessage] = useState<string | null>(null);
  const [diyLibraryMessage, setDiyLibraryMessage] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const artboardRef = useRef<HTMLDivElement>(null);
  const inlineTextSnapshotRef = useRef<StudioState | null>(null);
  const { data: session, status: sessionStatus } = useSession();
  const token = (session?.user as { token?: string; accessToken?: string } | undefined)?.token
    || (session?.user as { accessToken?: string } | undefined)?.accessToken
    || (typeof window !== "undefined" ? window.localStorage.getItem("token") || "" : "");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(studioKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.artboards?.length) {
          const hasPresetLibrary = parsed.artboards.some((item: Artboard) => item.id === "photobook-cover");
          setState(hasPresetLibrary ? parsed : {
            ...parsed,
            artboards: [...parsed.artboards, ...initialState.artboards.filter((item) => item.id !== "artboard-1")],
          });
        }
      }
    } catch {
      /* local draft is optional */
    }
  }, []);

  const registerFont = async (font: TemplateFont) => {
    if (typeof document === "undefined" || document.fonts.check(`12px \"${font.family}\"`)) return;
    const face = new FontFace(font.family, `url(${font.url})`);
    await face.load();
    document.fonts.add(face);
  };

  useEffect(() => {
    if (sessionStatus !== "authenticated" || !token) return;
    getTemplateFonts(token)
      .then(async (fonts) => {
        setCustomFonts(fonts);
        await Promise.all(fonts.map((font) => registerFont(font).catch(() => undefined)));
      })
      .catch(() => setFontMessage("Custom fonts could not be loaded."));
  }, [sessionStatus, token]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    getDiyTemplates(token).then((templates) => {
      const diyArtboards: Artboard[] = templates.map((template) => ({
        id: `diy-${template.id}`,
        name: `DIY · ${template.name}`,
        width: template.width,
        height: template.height,
        background: template.preview || template.svg ? `${diyBaseUrl}${template.preview || template.svg}` : undefined,
        sourceName: template.sourceFile || template.size || "DIY template",
        diyTemplate: template,
        lockedArtwork: true,
        photoSlots: template.slots.map((slot) => ({
          id: slot.id,
          name: slot.label,
          x: slot.x,
          y: slot.y,
          width: slot.width,
          height: slot.height,
          rotation: slot.rotation || 0,
          shape: "rect" as Shape,
          required: true,
          locked: false,
        })),
        textSlots: [],
      }));
      setState((current) => ({
        artboards: [...current.artboards.filter((item) => !item.diyTemplate), ...diyArtboards],
      }));
    }).catch(() => setDiyLibraryMessage("DIY template library could not be loaded."));
  }, [sessionStatus, token]);

  const artboard = useMemo(
    () =>
      state.artboards.find((item) => item.id === selectedArtboardId) ||
      state.artboards[0],
    [state.artboards, selectedArtboardId],
  );
  const selectedLayer = useMemo(() => {
    if (!artboard || !selection) return null;
    return selection.type === "photo"
      ? artboard.photoSlots.find((slot) => slot.id === selection.id) || null
      : artboard.textSlots.find((slot) => slot.id === selection.id) || null;
  }, [artboard, selection]);

  const commit = (
    next: StudioState | ((current: StudioState) => StudioState),
  ) => {
    setPast((items) => [...items.slice(-39), cloneState(state)]);
    setFuture([]);
    setState(typeof next === "function" ? next(state) : next);
  };
  const updateArtboard = (
    updater: (item: Artboard) => Artboard,
    record = true,
  ) => {
    const next = {
      artboards: state.artboards.map((item) =>
        item.id === artboard.id ? updater(item) : item,
      ),
    };
    if (record) commit(next);
    else setState(next);
  };
  const updateLayer = (
    layer: "photo" | "text",
    id: string,
    patch: Record<string, unknown>,
    record = true,
  ) => {
    updateArtboard(
      (item) =>
        layer === "photo"
          ? {
              ...item,
              photoSlots: item.photoSlots.map((slot) =>
                slot.id === id ? { ...slot, ...patch } : slot,
              ),
            }
          : {
              ...item,
              textSlots: item.textSlots.map((slot) =>
                slot.id === id ? { ...slot, ...patch } : slot,
              ),
            },
      record,
    );
  };
  const undo = () => {
    const previous = past[past.length - 1];
    if (!previous) return;
    setPast((items) => items.slice(0, -1));
    setFuture((items) => [cloneState(state), ...items]);
    setState(previous);
  };
  const redo = () => {
    const next = future[0];
    if (!next) return;
    setFuture((items) => items.slice(1));
    setPast((items) => [...items, cloneState(state)]);
    setState(next);
  };

  const addPhotoSlot = () => {
    const slot: PhotoSlot = {
      id: newId("photo"),
      name: `Photo ${artboard.photoSlots.length + 1}`,
      x: 15,
      y: 15,
      width: 35,
      height: 28,
      rotation: 0,
      shape: "rect",
      required: false,
      locked: false,
    };
    commit({
      artboards: state.artboards.map((item) =>
        item.id === artboard.id
          ? { ...item, photoSlots: [...item.photoSlots, slot] }
          : item,
      ),
    });
    setSelection({ type: "photo", id: slot.id });
    setTool("select");
  };
  const addTextSlot = () => {
    const slot: TextSlot = {
      id: newId("text"),
      name: `Text ${artboard.textSlots.length + 1}`,
      text: "Editable text",
      x: 20,
      y: 85,
      width: 60,
      height: 8,
      rotation: 0,
      fontFamily: "Inter",
      fontSize: 4,
      color: "#102a32",
      align: "center",
      editable: true,
      locked: false,
    };
    commit({
      artboards: state.artboards.map((item) =>
        item.id === artboard.id
          ? { ...item, textSlots: [...item.textSlots, slot] }
          : item,
      ),
    });
    setSelection({ type: "text", id: slot.id });
    setTool("select");
  };
  const removeSelected = () => {
    if (!selection) return;
    updateArtboard((item) =>
      selection.type === "photo"
        ? {
            ...item,
            photoSlots: item.photoSlots.filter(
              (slot) => slot.id !== selection.id,
            ),
          }
        : {
            ...item,
            textSlots: item.textSlots.filter(
              (slot) => slot.id !== selection.id,
            ),
          },
    );
    setSelection(null);
  };
  const duplicateSelected = () => {
    if (!selectedLayer || !selection) return;
    const copy = {
      ...selectedLayer,
      id: newId(selection.type),
      name: `${selectedLayer.name} copy`,
      x: Math.min(82, selectedLayer.x + 4),
      y: Math.min(88, selectedLayer.y + 4),
    };
    commit({
      artboards: state.artboards.map((item) =>
        item.id === artboard.id
          ? selection.type === "photo"
            ? { ...item, photoSlots: [...item.photoSlots, copy as PhotoSlot] }
            : { ...item, textSlots: [...item.textSlots, copy as TextSlot] }
          : item,
      ),
    });
    setSelection({ type: selection.type, id: copy.id });
  };
  const startDrag = (
    event: PointerEvent,
    layer: "photo" | "text",
    id: string,
    resize = false,
  ) => {
    if (customerPreview) return;
    event.stopPropagation();
    const source =
      layer === "photo"
        ? artboard.photoSlots.find((slot) => slot.id === id)
        : artboard.textSlots.find((slot) => slot.id === id);
    if (!source || ("locked" in source && source.locked)) return;
    setSelection({ type: layer, id });
    dragRef.current = {
      type: resize ? "resize" : "move",
      layer,
      id,
      startX: event.clientX,
      startY: event.clientY,
      origin: { ...source },
      snapshot: cloneState(state),
    };
  };
  const dragLayer = (event: PointerEvent) => {
    const drag = dragRef.current;
    const surface = artboardRef.current;
    if (!drag || !surface) return;
    const rect = surface.getBoundingClientRect();
    const dx = ((event.clientX - drag.startX) / rect.width) * 100;
    const dy = ((event.clientY - drag.startY) / rect.height) * 100;
    const origin = drag.origin as PhotoSlot | TextSlot;
    if (drag.type === "resize") {
      updateLayer(
        drag.layer,
        drag.id,
        {
          width: Math.max(8, Math.min(95 - origin.x, origin.width + dx)),
          height: Math.max(6, Math.min(95 - origin.y, origin.height + dy)),
        },
        false,
      );
    } else {
      updateLayer(
        drag.layer,
        drag.id,
        {
          x: Math.max(0, Math.min(100 - origin.width, origin.x + dx)),
          y: Math.max(0, Math.min(100 - origin.height, origin.y + dy)),
        },
        false,
      );
    }
  };
  const endDrag = () => {
    const drag = dragRef.current;
    if (!drag) return;
    setPast((items) => [...items.slice(-39), drag.snapshot]);
    setFuture([]);
    dragRef.current = null;
  };
  const importTemplate = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const imported: Artboard = {
      id: newId("artboard"),
      name: file.name.replace(/\.[^.]+$/, "") || "Imported template",
      width: artboard.width,
      height: artboard.height,
      background: url,
      sourceName: file.name,
      lockedArtwork: true,
      photoSlots: [],
      textSlots: [],
    };
    commit({ artboards: [...state.artboards, imported] });
    setSelectedArtboardId(imported.id);
    setSelection(null);
    event.target.value = "";
  };
  const removeArtboard = (id: string) => {
    if (state.artboards.length === 1) return;
    const item = state.artboards.find((board) => board.id === id);
    if (!item || !window.confirm(`Remove template \"${item.name}\"?`)) return;
    const remaining = state.artboards.filter((board) => board.id !== id);
    commit({ artboards: remaining });
    if (selectedArtboardId === id) {
      const next = remaining[0];
      setSelectedArtboardId(next.id);
      setSelection(next.photoSlots[0] ? { type: "photo", id: next.photoSlots[0].id } : null);
    }
  };
  const saveDraft = () => {
    localStorage.setItem(studioKey, JSON.stringify(state));
    setSavedAt(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    );
  };
  const publish = async () => {
    if (artboard.diyTemplate && token) {
      const template: DiyTemplate = {
        ...artboard.diyTemplate,
        name: artboard.name.replace(/^DIY ·\s*/, ""),
        width: artboard.width,
        height: artboard.height,
        slots: artboard.photoSlots.map((slot) => ({
          ...(artboard.diyTemplate?.slots.find((item) => item.id === slot.id) || {}),
          id: slot.id,
          label: slot.name,
          x: slot.x,
          y: slot.y,
          width: slot.width,
          height: slot.height,
          rotation: slot.rotation,
        })),
      };
      try {
        await updateDiyTemplate(token, template);
        setState((current) => ({ artboards: current.artboards.map((item) => item.id === artboard.id ? { ...item, diyTemplate: template } : item) }));
      } catch (error: any) {
        setDiyLibraryMessage(`DIY sync failed: ${error?.message || "publish request failed"}`);
        return;
      }
    }
    localStorage.setItem(
      `${studioKey}-published`,
      JSON.stringify({ ...state, publishedAt: new Date().toISOString() }),
    );
    setPublished(true);
    setSavedAt(
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    );
  };
  const updateSelected = (patch: Record<string, unknown>) =>
    selection && updateLayer(selection.type, selection.id, patch);

  const finishInlineTextEdit = () => {
    const snapshot = inlineTextSnapshotRef.current;
    if (!snapshot) return;
    setPast((items) => [...items.slice(-39), snapshot]);
    setFuture([]);
    inlineTextSnapshotRef.current = null;
  };
  const alignSelected = (horizontal: "left" | "center" | "right" | null, vertical?: "top" | "middle" | "bottom") => {
    if (!selectedLayer) return;
    const patch: Record<string, number> = {};
    if (horizontal === "left") patch.x = 0;
    if (horizontal === "center") patch.x = (100 - selectedLayer.width) / 2;
    if (horizontal === "right") patch.x = 100 - selectedLayer.width;
    if (vertical === "top") patch.y = 0;
    if (vertical === "middle") patch.y = (100 - selectedLayer.height) / 2;
    if (vertical === "bottom") patch.y = 100 - selectedLayer.height;
    updateSelected(patch);
  };
  const moveSelected = (x: number, y: number) => {
    if (!selectedLayer) return;
    updateSelected({
      x: Math.max(0, Math.min(100 - selectedLayer.width, selectedLayer.x + x)),
      y: Math.max(0, Math.min(100 - selectedLayer.height, selectedLayer.y + y)),
    });
  };
  const handleFontUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !token) return;
    const family = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
    setFontBusy(true);
    setFontMessage(null);
    try {
      const font = await uploadTemplateFont(token, file, family);
      await registerFont(font);
      setCustomFonts((items) => [...items, font].sort((a, b) => a.name.localeCompare(b.name)));
      setFontMessage(`${font.name} is ready to use.`);
    } catch (error: any) {
      setFontMessage(error?.response?.data?.message || "Font upload failed.");
    } finally {
      setFontBusy(false);
    }
  };
  const removeCustomFont = async (font: TemplateFont) => {
    if (!token || !window.confirm(`Remove ${font.name}?`)) return;
    try {
      await deleteTemplateFont(token, font._id);
      setCustomFonts((items) => items.filter((item) => item._id !== font._id));
    } catch {
      setFontMessage("Font could not be removed.");
    }
  };

  useEffect(() => {
    const isTyping = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      return !!element?.closest("input, textarea, select, [contenteditable='true']");
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (modifier && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
        return;
      }
      if (modifier && key === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if (modifier && ["+", "="].includes(key)) {
        event.preventDefault();
        setZoom((value) => Math.min(200, value + 10));
        return;
      }
      if (modifier && key === "-") {
        event.preventDefault();
        setZoom((value) => Math.max(25, value - 10));
        return;
      }
      if (modifier && key === "0") {
        event.preventDefault();
        setZoom(72);
        return;
      }
      if (isTyping(event.target)) return;
      if (key === "escape") setSelection(null);
      if ((key === "delete" || key === "backspace") && selection) {
        event.preventDefault();
        removeSelected();
      }
      if (modifier && key === "d") {
        event.preventDefault();
        duplicateSelected();
      }
      const distance = event.shiftKey ? 5 : 1;
      if (key === "arrowleft") moveSelected(-distance, 0);
      if (key === "arrowright") moveSelected(distance, 0);
      if (key === "arrowup") moveSelected(0, -distance);
      if (key === "arrowdown") moveSelected(0, distance);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [past, future, state, selection, selectedLayer]);

  return (
    <main className="min-h-full bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-4 md:px-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
            Products / Template Studio
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Template Studio
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Define exactly which photo and text areas customers can edit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {savedAt && (
            <span className="text-xs text-muted-foreground">
              Saved {savedAt}
            </span>
          )}
          {published && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <Check className="size-3" /> Published
            </span>
          )}
          <button
            className={buttonClass}
            onClick={() => setCustomerPreview((value) => !value)}
          >
            <Eye className="size-3.5" />
            {customerPreview ? "Exit preview" : "Customer preview"}
          </button>
          <button className={buttonClass} onClick={saveDraft}>
            <Download className="size-3.5" />
            Save draft
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
            onClick={publish}
          >
            <Check className="size-3.5" />
            Publish
          </button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-112px)] grid-cols-1 lg:grid-cols-[250px_minmax(0,1fr)_285px]">
        <aside className="border-b border-border bg-card p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Template library</h2>
            <button
              className="rounded-md p-1.5 hover:bg-muted"
              title="Add artboard"
              onClick={() => {
                const copy = {
                  ...artboard,
                  id: newId("artboard"),
                  name: `Artboard ${state.artboards.length + 1}`,
                  photoSlots: artboard.photoSlots.map((slot) => ({
                    ...slot,
                    id: newId("photo"),
                  })),
                  textSlots: artboard.textSlots.map((slot) => ({
                    ...slot,
                    id: newId("text"),
                  })),
                };
                commit({ artboards: [...state.artboards, copy] });
                setSelectedArtboardId(copy.id);
              }}
            >
              <Plus className="size-4" />
            </button>
          </div>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 px-3 py-3 text-xs font-semibold text-primary hover:bg-primary/5">
            <Upload className="size-3.5" />
            Import template
            <input
              type="file"
              accept="image/*,.svg,.pdf"
              className="sr-only"
              onChange={importTemplate}
            />
          </label>
          <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
            SVG is recommended. PDF and raster files are kept as locked artwork
            backgrounds. Select a listed template to edit it.
          </p>
          {diyLibraryMessage && <p className="mt-2 text-[11px] text-destructive">{diyLibraryMessage}</p>}
          <label className="mt-3 block text-xs font-semibold">
            Selected template name
            <input
              className={fieldClass}
              value={artboard.name}
              onChange={(event) => updateArtboard((item) => ({ ...item, name: event.target.value }))}
            />
          </label>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Artboards
            </p>
            <span className="text-[10px] text-muted-foreground">
              {state.artboards.some((item) => item.id === selectedArtboardId) ? 1 : 0}
            </span>
          </div>
          <label className="mt-2 block text-xs font-semibold">
            Open DIY template
            <select
              className={fieldClass}
              value={artboard.diyTemplate ? artboard.id : ""}
              onChange={(event) => {
                const next = state.artboards.find((item) => item.id === event.target.value);
                if (!next) return;
                setSelectedArtboardId(next.id);
                setSelection(next.photoSlots[0] ? { type: "photo", id: next.photoSlots[0].id } : null);
              }}
            >
              <option value="">Select a DIY template…</option>
              {state.artboards.filter((item) => item.diyTemplate).map((item) => (
                <option key={item.id} value={item.id}>{String(item.diyTemplate?.category || "DIY")} · {String(item.diyTemplate?.size || item.name.replace(/^DIY ·\s*/, ""))}</option>
              ))}
            </select>
          </label>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {state.artboards.filter((item) => item.diyTemplate).length} DIY templates available · matches the DIY library
          </p>
          <div className="mt-2 space-y-2" aria-label="Selected template">
            {state.artboards.filter((item) => item.id === selectedArtboardId).map((item, index) => (
              <div key={item.id} className={`rounded-lg border p-2 text-xs ${item.id === artboard.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedArtboardId(item.id);
                      setSelection(item.photoSlots[0] ? { type: "photo", id: item.photoSlots[0].id } : null);
                    }}
                    className="min-w-0 flex-1 text-left"
                    title={`Edit ${item.name}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="grid size-9 place-items-center rounded bg-muted">
                        <FileImage className="size-4 text-muted-foreground" />
                      </div>
                      <span className="min-w-0 flex-1 truncate font-semibold">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground">{index + 1}</span>
                    </div>
                    <span className="mt-1 block text-[10px] text-muted-foreground">
                      {item.sourceName ? `Uploaded: ${item.sourceName} · ` : "Blank template · "}{item.width}×{item.height} in · {item.photoSlots.length} photo
                      {item.photoSlots.length === 1 ? "" : "s"}
                    </span>
                  </button>
                  <button
                    className="rounded p-1 text-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-30"
                    onClick={() => removeArtboard(item.id)}
                    disabled={state.artboards.length === 1}
                    title={state.artboards.length === 1 ? "Keep at least one template" : `Remove ${item.name}`}
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Tools
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  ["select", MousePointer2, "Select"],
                  ["photo", ImagePlus, "Photo box"],
                  ["text", Type, "Text box"],
                  ["pan", Move, "Pan"],
                ] as const
              ).map(([value, Icon, label]) => (
                <button
                  key={value}
                  className={`${buttonClass} ${tool === value ? "border-primary bg-primary/10 text-primary" : ""}`}
                  onClick={() => {
                    setTool(value);
                    if (value === "photo") addPhotoSlot();
                    if (value === "text") addTextSlot();
                  }}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section
          className="relative flex min-h-[680px] flex-col overflow-hidden bg-[#3d4144] p-4 md:p-7"
          onPointerMove={dragLayer}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-white">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
                {artboard.name}
              </p>
              <p className="mt-1 text-sm text-white/80">
                {artboard.width} × {artboard.height} in ·{" "}
                {artboard.photoSlots.length} photo slots ·{" "}
                {artboard.textSlots.length} text slots
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-md p-2 hover:bg-white/10 disabled:opacity-30"
                onClick={undo}
                disabled={!past.length}
                title="Undo (Ctrl/Cmd + Z)"
              >
                <Undo2 className="size-4" />
              </button>
              <button
                className="rounded-md p-2 hover:bg-white/10 disabled:opacity-30"
                onClick={redo}
                disabled={!future.length}
                title="Redo (Ctrl/Cmd + Shift + Z / Ctrl + Y)"
              >
                <Redo2 className="size-4" />
              </button>
              <span className="mx-1 h-5 w-px bg-white/20" />
              <ZoomIn className="size-4 text-white/70" />
              <input
                aria-label="Zoom"
                type="range"
                min="35"
                max="130"
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-28 accent-white"
              />
              <span className="w-10 text-right text-xs text-white/70">
                {zoom}%
              </span>
            </div>
          </div>
          <div
            className="flex flex-1 items-center justify-center overflow-auto rounded-xl border border-black/30 bg-[#34383b] p-8"
            onWheel={(event) => {
              if (!event.ctrlKey && !event.metaKey) return;
              event.preventDefault();
              setZoom((value) => Math.max(25, Math.min(200, value + (event.deltaY < 0 ? 8 : -8))));
            }}
            style={{
              backgroundImage:
                "linear-gradient(45deg,#3a3e41 25%,transparent 25%),linear-gradient(-45deg,#3a3e41 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#3a3e41 75%),linear-gradient(-45deg,transparent 75%,#3a3e41 75%)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0",
            }}
          >
            <div
              ref={artboardRef}
              className="relative shrink-0 overflow-hidden bg-white shadow-2xl"
              style={{
                width: `min(68vw, 620px)`,
                aspectRatio: `${artboard.width} / ${artboard.height}`,
                transform: `scale(${zoom / 72})`,
                transformOrigin: "center center",
              }}
              onClick={() => setSelection(null)}
            >
              {artboard.background ? (
                <img
                  src={artboard.background}
                  alt={artboard.sourceName || "Imported template"}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-white text-center text-xs text-muted-foreground">
                  Import an SVG, PDF or image template
                  <br />
                  <span className="text-[10px]">
                    The original artwork stays locked behind editable layers.
                  </span>
                </div>
              )}
              {!customerPreview && (
                <div className="pointer-events-none absolute inset-0 border-2 border-amber-300/80" />
              )}
              {!customerPreview && artboard.lockedArtwork && (
                <div className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-black/65 px-2 py-1 text-[10px] font-semibold text-white">
                  <Lock className="size-3" />
                  Artwork locked
                </div>
              )}
              {artboard.photoSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`absolute overflow-hidden ${!customerPreview && selection?.type === "photo" && selection.id === slot.id ? "outline outline-2 outline-emerald-400" : !customerPreview ? "outline outline-1 outline-emerald-400/70" : ""}`}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    width: `${slot.width}%`,
                    height: `${slot.height}%`,
                    borderRadius: slot.shape === "circle" ? "999px" : "5px",
                    transform: `rotate(${slot.rotation}deg)`,
                  }}
                  onPointerDown={(event) => startDrag(event, "photo", slot.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelection({ type: "photo", id: slot.id });
                  }}
                >
                  <div
                    className={`grid h-full w-full place-items-center ${slot.image ? "bg-cover bg-center" : "bg-emerald-400/15"}`}
                    style={
                      slot.image
                        ? { backgroundImage: `url(${slot.image})` }
                        : undefined
                    }
                  >
                    {!slot.image && !customerPreview && (
                      <span className="rounded bg-white/80 px-2 py-1 text-center text-[10px] font-bold text-emerald-800">
                        <ImagePlus className="mx-auto mb-0.5 size-4" />
                        {slot.name}
                      </span>
                    )}
                  </div>
                  {!customerPreview &&
                    selection?.type === "photo" &&
                    selection.id === slot.id && (
                      <button
                        className="absolute bottom-0 right-0 grid size-5 cursor-se-resize place-items-center rounded-tl bg-emerald-500 text-white"
                        onPointerDown={(event) =>
                          startDrag(event, "photo", slot.id, true)
                        }
                        aria-label="Resize photo box"
                      >
                        <Square className="size-3" />
                      </button>
                    )}
                </div>
              ))}
              {artboard.textSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`absolute overflow-hidden ${!customerPreview && selection?.type === "text" && selection.id === slot.id ? "outline outline-2 outline-sky-400" : !customerPreview ? "outline outline-1 outline-sky-400/60" : ""}`}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    width: `${slot.width}%`,
                    height: `${slot.height}%`,
                    transform: `rotate(${slot.rotation}deg)`,
                    color: slot.color,
                    fontFamily: slot.fontFamily,
                    fontSize: `${slot.fontSize}%`,
                    textAlign: slot.align,
                  }}
                  onPointerDown={(event) => startDrag(event, "text", slot.id)}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelection({ type: "text", id: slot.id });
                  }}
                >
                  <div
                    contentEditable={!customerPreview && !slot.locked}
                    suppressContentEditableWarning
                    className="h-full w-full whitespace-pre-wrap break-words outline-none"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      setSelection({ type: "text", id: slot.id });
                    }}
                    onFocus={() => {
                      if (!inlineTextSnapshotRef.current) inlineTextSnapshotRef.current = cloneState(state);
                    }}
                    onInput={(event) =>
                      updateLayer("text", slot.id, { text: event.currentTarget.textContent || "" }, false)
                    }
                    onBlur={finishInlineTextEdit}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelection({ type: "text", id: slot.id });
                    }}
                    role="textbox"
                    aria-label={`${slot.name} text`}
                  >
                    {slot.text}
                  </div>
                  {!customerPreview && (
                    <span className="absolute -right-0.5 -top-0.5 rounded bg-sky-500 px-1 text-[8px] text-white">
                      T
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/60">
            <span>
              Click text to edit it. Drag a layer edge to move it; use Ctrl +
              wheel to zoom.
            </span>
            <span>{artboard.sourceName || "No source imported"}</span>
          </div>
        </section>

        <aside className="border-t border-border bg-card p-4 lg:border-l lg:border-t-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold">Inspector</h2>
            {selection && (
              <button
                className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                onClick={removeSelected}
                title="Delete selected layer"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className={buttonClass} onClick={addPhotoSlot}>
              <ImagePlus className="size-3.5" />
              Add photo box
            </button>
            <button className={buttonClass} onClick={addTextSlot}>
              <Type className="size-3.5" />
              Add text box
            </button>
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Artboard settings
            </p>
            <label className="mt-3 block text-xs font-semibold">
              Name
              <input
                className={fieldClass}
                value={artboard.name}
                onChange={(event) =>
                  updateArtboard((item) => ({
                    ...item,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-xs font-semibold">
                Width
                <input
                  type="number"
                  className={fieldClass}
                  value={artboard.width}
                  onChange={(event) =>
                    updateArtboard((item) => ({
                      ...item,
                      width: Number(event.target.value) || 1,
                    }))
                  }
                />
              </label>
              <label className="text-xs font-semibold">
                Height
                <input
                  type="number"
                  className={fieldClass}
                  value={artboard.height}
                  onChange={(event) =>
                    updateArtboard((item) => ({
                      ...item,
                      height: Number(event.target.value) || 1,
                    }))
                  }
                />
              </label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={artboard.lockedArtwork}
                onChange={(event) =>
                  updateArtboard((item) => ({
                    ...item,
                    lockedArtwork: event.target.checked,
                  }))
                }
              />
              Lock original artwork
            </label>
          </div>
          {selectedLayer && selection && (
            <div className="mt-5 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Selected {selection.type} box
                </p>
                <button
                  className="text-muted-foreground hover:text-primary"
                  onClick={duplicateSelected}
                  title="Duplicate"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
              <label className="mt-3 block text-xs font-semibold">
                Label
                <input
                  className={fieldClass}
                  value={selectedLayer.name}
                  onChange={(event) =>
                    updateSelected({ name: event.target.value })
                  }
                />
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-xs font-semibold">
                  X %
                  <input
                    type="number"
                    className={fieldClass}
                    value={Math.round(selectedLayer.x * 100) / 100}
                    onChange={(event) =>
                      updateSelected({ x: Number(event.target.value) })
                    }
                  />
                </label>
                <label className="text-xs font-semibold">
                  Y %
                  <input
                    type="number"
                    className={fieldClass}
                    value={Math.round(selectedLayer.y * 100) / 100}
                    onChange={(event) =>
                      updateSelected({ y: Number(event.target.value) })
                    }
                  />
                </label>
                <label className="text-xs font-semibold">
                  Width %
                  <input
                    type="number"
                    className={fieldClass}
                    value={Math.round(selectedLayer.width * 100) / 100}
                    onChange={(event) =>
                      updateSelected({ width: Number(event.target.value) })
                    }
                  />
                </label>
                <label className="text-xs font-semibold">
                  Height %
                  <input
                    type="number"
                    className={fieldClass}
                    value={Math.round(selectedLayer.height * 100) / 100}
                    onChange={(event) =>
                      updateSelected({ height: Number(event.target.value) })
                    }
                  />
                </label>
              </div>
              <label className="mt-2 block text-xs font-semibold">
                Rotation
                <input
                  type="range"
                  min={-180}
                  max={180}
                  value={selectedLayer.rotation}
                  onChange={(event) =>
                    updateSelected({ rotation: Number(event.target.value) })
                  }
                  className="mt-2 w-full accent-primary"
                />
              </label>
              <label className="mt-3 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedLayer.locked}
                  onChange={(event) =>
                    updateSelected({ locked: event.target.checked })
                  }
                />
                Lock this layer
              </label>
              <div className="mt-3">
                <p className="text-xs font-semibold">Align on artboard</p>
                <div className="mt-1 grid grid-cols-3 gap-1">
                  <button className={buttonClass} onClick={() => alignSelected("left")} title="Align layer left">Left</button>
                  <button className={buttonClass} onClick={() => alignSelected("center")} title="Align layer centre">Centre</button>
                  <button className={buttonClass} onClick={() => alignSelected("right")} title="Align layer right">Right</button>
                  <button className={buttonClass} onClick={() => alignSelected(null, "top")} title="Align layer top">Top</button>
                  <button className={buttonClass} onClick={() => alignSelected(null, "middle")} title="Align layer middle">Middle</button>
                  <button className={buttonClass} onClick={() => alignSelected(null, "bottom")} title="Align layer bottom">Bottom</button>
                </div>
              </div>
              {selection.type === "photo" ? (
                <>
                  <label className="mt-3 block text-xs font-semibold">
                    Shape
                    <select
                      className={fieldClass}
                      value={(selectedLayer as PhotoSlot).shape}
                      onChange={(event) =>
                        updateSelected({ shape: event.target.value })
                      }
                    >
                      <option value="rect">Rectangle</option>
                      <option value="circle">Circle</option>
                    </select>
                  </label>
                  <label className="mt-3 flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={(selectedLayer as PhotoSlot).required}
                      onChange={(event) =>
                        updateSelected({ required: event.target.checked })
                      }
                    />
                    Required photo
                  </label>
                </>
              ) : (
                <>
                  <label className="mt-3 block text-xs font-semibold">
                    Default text
                    <textarea
                      className={`${fieldClass} min-h-16`}
                      value={(selectedLayer as TextSlot).text}
                      onChange={(event) =>
                        updateSelected({ text: event.target.value })
                      }
                    />
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="text-xs font-semibold">
                      Font
                      <select
                        className={fieldClass}
                        value={(selectedLayer as TextSlot).fontFamily}
                        onChange={(event) =>
                          updateSelected({ fontFamily: event.target.value })
                        }
                      >
                        <option>Inter</option>
                        <option>Arial</option>
                        <option>Georgia</option>
                        <option>Montserrat</option>
                        {customFonts.length > 0 && <option disabled>── Uploaded fonts ──</option>}
                        {customFonts.map((font) => (
                          <option key={font._id} value={font.family}>{font.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-semibold">
                      Size %
                      <input
                        type="number"
                        className={fieldClass}
                        value={(selectedLayer as TextSlot).fontSize}
                        onChange={(event) =>
                          updateSelected({
                            fontSize: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="mt-3 rounded-lg border border-border bg-muted/30 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">Admin font library</span>
                      <label className={`${buttonClass} cursor-pointer py-1.5`}>
                        <Upload className="size-3" />
                        {fontBusy ? "Uploading…" : "Upload font"}
                        <input
                          className="sr-only"
                          type="file"
                          accept=".woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf"
                          disabled={fontBusy || !token}
                          onChange={handleFontUpload}
                        />
                      </label>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">WOFF2, WOFF, TTF, or OTF · available to every admin.</p>
                    {fontMessage && <p className="mt-1 text-[10px] text-primary">{fontMessage}</p>}
                    {customFonts.length > 0 && (
                      <div className="mt-2 max-h-24 space-y-1 overflow-y-auto">
                        {customFonts.map((font) => (
                          <div key={font._id} className="flex items-center justify-between gap-2 text-[11px]" style={{ fontFamily: font.family }}>
                            <span className="truncate">{font.name}</span>
                            <button className="text-destructive hover:underline" onClick={() => removeCustomFont(font)}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-semibold">Text alignment</p>
                    <div className="mt-1 grid grid-cols-3 gap-1">
                      {([
                        ["left", AlignLeft, "Left"],
                        ["center", AlignCenter, "Centre"],
                        ["right", AlignRight, "Right"],
                      ] as const).map(([value, Icon, label]) => (
                        <button
                          key={value}
                          className={`${buttonClass} py-1.5 ${(selectedLayer as TextSlot).align === value ? "border-primary bg-primary/10 text-primary" : ""}`}
                          onClick={() => updateSelected({ align: value })}
                          title={`Align text ${label.toLowerCase()}`}
                        >
                          <Icon className="size-3.5" /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="mt-3 block text-xs font-semibold">
                    Colour
                    <input
                      type="color"
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-background"
                      value={(selectedLayer as TextSlot).color}
                      onChange={(event) =>
                        updateSelected({ color: event.target.value })
                      }
                    />
                  </label>
                  <label className="mt-3 flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={(selectedLayer as TextSlot).editable}
                      onChange={(event) =>
                        updateSelected({ editable: event.target.checked })
                      }
                    />
                    Customer can edit text
                  </label>
                </>
              )}
            </div>
          )}
          <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/40 p-3 text-[11px] leading-4 text-muted-foreground">
            <div className="mb-1 flex items-center gap-2 font-semibold text-foreground">
              <AlignCenter className="size-3.5 text-primary" />
              Production-safe template
            </div>
            Publish only after testing every required photo box in Customer
            preview. The same slot settings will drive the future DIY export.
          </div>
        </aside>
      </div>
    </main>
  );
}
