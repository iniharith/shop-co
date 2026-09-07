'use client';
import { DragEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Check, Eye, GripVertical, ImageIcon, Loader2, Pencil, Plus, Tag, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { createCatalogProduct, getCatalogImageUploadUrl, getCatalogProduct, updateCatalogProduct } from '@/api/catalog';

type Size = { size: string; stock: number; lowStockThreshold?: number; images?: string[] };
type Product = {
  _id: string; name: string; description: string; category: string; price: number; images: string[]; sizes: Size[];
  slug?: string; status?: 'draft' | 'published'; specifications?: { customFields?: Record<string, string>; [k: string]: unknown };
  [k: string]: unknown;
};
const emptyProduct: Product = { _id: '', name: '', description: '', category: 'DIGITAL PRINTING', price: 0, images: [], sizes: [{ size: 'Standard', stock: 0, lowStockThreshold: 10, images: [] }], status: 'draft', specifications: { customFields: {} } };
const slugify = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const skuKey = (v: string) => `variation-sku:${v.trim().toLowerCase()}`;

export function ProductEditor({ productId }: { productId?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.user?.token || '';
  const [product, setProduct] = useState<Product>(emptyProduct);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [imageError, setImageError] = useState(false);
  const [dragged, setDragged] = useState<number | null>(null);
  const loaded = useRef(false);
  const saved = useRef('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!productId || !token) return;
    void (async () => {
      try {
        const result = await getCatalogProduct(token, productId);
        const current = result.product as Product;
        const main = current.images?.[0] || '';
        const next = { ...emptyProduct, ...current, images: current.images || [], specifications: current.specifications || { customFields: {} }, sizes: (current.sizes || []).map(s => ({ ...s, images: main ? [main] : [] })) };
        setProduct(next); saved.current = JSON.stringify(next); loaded.current = true;
      } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not load product'); router.replace('/admin/catalog'); }
      finally { setLoading(false); }
    })();
  }, [productId, token, router]);

  const persist = async (next: Product, announce = false) => {
    if (!token) return;
    const main = next.images[0] || '';
    const payload = { ...next, slug: slugify(next.name), sizes: next.sizes.map(s => ({ ...s, images: main ? [main] : [] })) };
    setSaving(true);
    try {
      const result = productId ? await updateCatalogProduct(token, productId, payload) : await createCatalogProduct(token, payload);
      saved.current = JSON.stringify(next); if (announce) toast.success('Changes saved');
      if (!productId && result?.product?._id) router.replace(`/admin/catalog/${result.product._id}`);
    } catch (e: any) { toast.error(e?.response?.data?.message || 'Could not save changes'); }
    finally { setSaving(false); }
  };

  useEffect(() => {
    if (!loaded.current || !productId || !token) return;
    const json = JSON.stringify(product); if (json === saved.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(product), 800);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [product, productId, token]);

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) throw new Error('Only image files are supported.');
    if (file.size > 20 * 1024 * 1024) throw new Error('Images must be 20MB or smaller.');
    const signed = await getCatalogImageUploadUrl(token, file.name, file.type);
    const response = await fetch(signed.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    if (!response.ok) throw new Error('Image upload failed.');
    return signed.imageUrl as string;
  };

  const replaceMain = async (files: FileList | File[]) => {
    const file = Array.from(files)[0]; if (!file) return;
    try {
      const url = await upload(file); setImageError(false);
      setProduct(p => ({ ...p, images: [url, ...p.images.slice(1)], sizes: p.sizes.map(s => ({ ...s, images: [url] })) }));
    } catch (e: any) { toast.error(e?.message || 'Could not upload image'); }
  };

  const uploadMore = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      try {
        const url = await upload(file);
        setProduct(p => p.images.length ? { ...p, images: [...p.images, url] } : { ...p, images: [url], sizes: p.sizes.map(s => ({ ...s, images: [url] })) });
      } catch (e: any) { toast.error(e?.message || 'Could not upload image'); }
    }
  };

  const updateSize = (i: number, patch: Partial<Size>) => setProduct(p => {
    const old = p.sizes[i]; const sizes = p.sizes.map((s, x) => x === i ? { ...s, ...patch } : s);
    if (patch.size === undefined || !old) return { ...p, sizes };
    const fields = { ...(p.specifications?.customFields || {}) }; const from = skuKey(old.size); const to = skuKey(patch.size);
    if (fields[from] && from !== to) { fields[to] = fields[from]; delete fields[from]; }
    return { ...p, sizes, specifications: { ...(p.specifications || {}), customFields: fields } };
  });
  const getSku = (s: string) => product.specifications?.customFields?.[skuKey(s)] || '';
  const setSku = (i: number, value: string) => setProduct(p => ({ ...p, specifications: { ...(p.specifications || {}), customFields: { ...(p.specifications?.customFields || {}), [skuKey(p.sizes[i]?.size || String(i))]: value } } }));
  const toggle = (i: number) => setSelected(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i]);
  const remove = (i: number) => { setProduct(p => ({ ...p, sizes: p.sizes.filter((_, x) => x !== i) })); setSelected([]); };
  const move = (from: number, to: number) => setProduct(p => { const sizes = [...p.sizes]; const [item] = sizes.splice(from, 1); sizes.splice(to, 0, item); return { ...p, sizes }; });
  const addVariation = () => setProduct(p => ({ ...p, sizes: [...p.sizes, { size: `Variation ${p.sizes.length + 1}`, stock: 0, lowStockThreshold: 10, images: p.images[0] ? [p.images[0]] : [] }] }));
  const bulkStock = () => { if (!selected.length) return toast.error('Select at least one variation.'); const v = window.prompt('Set stock for selected variations:'); if (v == null) return; const n = Number(v); if (!Number.isFinite(n) || n < 0) return toast.error('Enter a valid stock amount.'); setProduct(p => ({ ...p, sizes: p.sizes.map((s, i) => selected.includes(i) ? { ...s, stock: n } : s) })); };
  const bulkSku = () => { if (!selected.length) return toast.error('Select at least one variation.'); const v = window.prompt('SKU prefix:', 'SKU'); if (v == null) return; setProduct(p => { const f = { ...(p.specifications?.customFields || {}) }; p.sizes.forEach((s, i) => { if (selected.includes(i)) f[skuKey(s.size)] = `${v}-${s.size.replace(/\s+/g, '-').toUpperCase()}`; }); return { ...p, specifications: { ...(p.specifications || {}), customFields: f } }; }); };
  const bulkActive = () => { if (!selected.length) return toast.error('Select at least one variation.'); setProduct(p => ({ ...p, sizes: p.sizes.map((s, i) => selected.includes(i) && s.stock <= 0 ? { ...s, stock: 1 } : s) })); };
  const bulkDelete = () => { if (!selected.length) return toast.error('Select at least one variation.'); setProduct(p => ({ ...p, sizes: p.sizes.filter((_, i) => !selected.includes(i)) })); setSelected([]); };

  if (loading) return <main className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></main>;
  const main = product.images[0] || ''; const all = product.sizes.length > 0 && selected.length === product.sizes.length;

  return <main className="mx-auto max-w-[1480px] space-y-5 p-4 md:p-7">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div><Button asChild variant="ghost" size="sm" className="-ml-3 mb-1"><Link href="/admin/catalog"><ArrowLeft className="mr-1 h-4 w-4" />Catalog</Link></Button><h1 className="text-4xl font-bold">Product Images</h1><p className="mt-1 text-base text-muted-foreground">Manage your main image and variations together. Changes will apply across all linked variations.</p></div>
      <div className="flex gap-3"><Button asChild variant="outline" className="h-12 px-6"><a href={`https://kampungcetak.com/home/shop/${product.slug || slugify(product.name)}`} target="_blank" rel="noreferrer"><Eye className="mr-2 h-5 w-5" />Preview Storefront</a></Button><label><Button asChild className="h-12 px-7"><span><Upload className="mr-2 h-5 w-5" />Upload Images<input hidden type="file" accept="image/*" multiple onChange={e => { if (e.target.files) void uploadMore(e.target.files); e.target.value = ''; }} /></span></Button></label></div>
    </header>

    <section className="grid gap-4 xl:grid-cols-[440px_minmax(0,1fr)]">
      <div className="rounded-2xl border bg-card/95 p-5 shadow-xl"><h2 className="mb-4 text-2xl font-semibold">Main Image <span className="text-sm text-muted-foreground">ⓘ</span></h2>
        <div className="relative overflow-hidden rounded-xl border border-primary/50 bg-black/40">{main && !imageError ? <img src={main} alt={`${product.name} main image`} onError={() => setImageError(true)} className="aspect-[1.05/1] w-full object-cover" /> : <div className="flex aspect-[1.05/1] flex-col items-center justify-center gap-2 text-muted-foreground"><ImageIcon className="h-12 w-12" /><b>Image preview unavailable</b><span className="text-xs">Replace this image to create a fresh preview.</span></div>}<Badge className="absolute left-3 top-3 px-4 py-1">Primary</Badge><label className="absolute right-3 top-3"><Button asChild size="sm" variant="secondary"><span><Pencil className="mr-1 h-4 w-4" />Edit<input hidden type="file" accept="image/*" onChange={e => { if (e.target.files) void replaceMain(e.target.files); e.target.value = ''; }} /></span></Button></label></div>
        <label onDragOver={e => e.preventDefault()} onDrop={(e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); if (e.dataTransfer.files.length) void replaceMain(e.dataTransfer.files); }} className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-dashed px-5 py-7 text-center"><ImageIcon className="mr-3 h-8 w-8" /><span><b>Click to replace or drag & drop</b><small className="block text-muted-foreground">JPG, PNG, WebP (Max 20MB)</small></span><input hidden type="file" accept="image/*" onChange={e => { if (e.target.files) void replaceMain(e.target.files); e.target.value = ''; }} /></label>
        <Button type="button" variant="outline" className="mt-3 h-11 w-full" onClick={() => main && window.open(main, '_blank')} disabled={!main}>Crop / Adjust</Button>
      </div>

      <div className="rounded-2xl border bg-card/95 p-5 shadow-xl"><div className="flex items-start justify-between gap-3"><div><h2 className="text-2xl font-semibold">Variations <span className="text-base">(All linked to this image)</span> <span className="text-sm text-muted-foreground">ⓘ</span></h2><p className="mt-1 text-sm text-muted-foreground">Each variation below will use the same image. Update once, apply to all.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setProduct(p => ({ ...p, sizes: [...p.sizes].reverse() }))}><GripVertical className="mr-2 h-4 w-4" />Reorder</Button><Button variant="outline" onClick={addVariation}><Plus className="mr-2 h-4 w-4" />Add Variation</Button></div></div>
        <div className="mt-5 space-y-3">{product.sizes.map((s, i) => <div key={`${s.size}-${i}`} draggable onDragStart={() => setDragged(i)} onDragEnd={() => setDragged(null)} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (dragged !== null) move(dragged, i); setDragged(null); }} className={`grid gap-3 rounded-xl border bg-background/75 p-3 xl:grid-cols-[36px_72px_minmax(150px,1fr)_130px_170px_100px_96px_48px] xl:items-center ${dragged === i ? 'opacity-50' : ''}`}>
          <button onClick={() => toggle(i)} className={`flex h-7 w-7 items-center justify-center rounded-md border ${selected.includes(i) ? 'border-primary bg-primary text-primary-foreground' : ''}`}>{selected.includes(i) && <Check className="h-4 w-4" />}</button>
          <div className="overflow-hidden rounded-lg border bg-muted">{main && !imageError ? <img src={main} alt="Variation preview" onError={() => setImageError(true)} className="h-[68px] w-[68px] object-cover" /> : <div className="flex h-[68px] w-[68px] items-center justify-center"><ImageIcon className="h-5 w-5" /></div>}</div>
          <label className="space-y-1 text-sm"><span className="text-muted-foreground">Size</span><Input data-size-index={i} value={s.size} onChange={e => updateSize(i, { size: e.target.value })} /></label>
          <label className="space-y-1 text-sm"><span className="text-muted-foreground">Stock</span><Input type="number" min="0" value={s.stock} onChange={e => updateSize(i, { stock: Number(e.target.value) })} /></label>
          <label className="space-y-1 text-sm"><span className="text-muted-foreground">SKU (optional)</span><Input value={getSku(s.size)} placeholder={`SKU-${s.size.toUpperCase().replace(/\s+/g, '-')}`} onChange={e => setSku(i, e.target.value)} /></label>
          <Badge className="justify-self-start bg-emerald-950 px-4 py-2 text-emerald-300 hover:bg-emerald-950">Active</Badge><Button variant="outline" size="sm" onClick={() => document.querySelector<HTMLInputElement>(`[data-size-index='${i}']`)?.focus()}><Pencil className="mr-1 h-4 w-4" />Edit</Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(i)}><Trash2 className="h-5 w-5" /></Button>
        </div>)}</div>
      </div>
    </section>

    <section className="ml-auto rounded-2xl border bg-card/95 p-4 shadow-lg xl:w-[calc(100%-456px)]"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h3 className="text-lg font-semibold">Bulk Actions</h3><p className="text-sm text-muted-foreground">Apply changes to multiple variations at once.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setSelected(all ? [] : product.sizes.map((_, i) => i))}>{all ? 'Clear selection' : 'Select all'}</Button><Button variant="outline" onClick={bulkStock}>Update Stock</Button><Button variant="outline" onClick={bulkSku}><Tag className="mr-2 h-4 w-4" />Update SKU</Button><Button variant="outline" onClick={bulkActive}><Check className="mr-2 h-4 w-4" />Set as Active</Button><Button variant="destructive" onClick={bulkDelete}><Trash2 className="mr-2 h-4 w-4" />Delete Selected</Button></div></div></section>

    <footer className="flex flex-wrap items-center justify-between border-t pt-4 text-sm text-muted-foreground"><span className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"><Check className="h-4 w-4" /></span>{saving ? 'Saving changes…' : 'All changes are automatically saved'}</span><span className="font-medium">{product.sizes.length} variation{product.sizes.length === 1 ? '' : 's'} linked to this image</span></footer>
  </main>;
}
