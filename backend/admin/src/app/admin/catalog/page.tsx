'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { AlertTriangle, Archive, Check, Eye, History, ImagePlus, PackagePlus, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  adjustCatalogStock,
  archiveCatalogProduct,
  bulkArchiveCatalog,
  bulkDeleteCatalog,
  createCatalogProduct,
  getCatalog,
  getCatalogImageUploadUrl,
  getCatalogStockAdjustments,
  updateCatalogProduct,
} from '@/api/catalog';

type SizeStock = { size: string; stock: number; lowStockThreshold?: number };
type Product = {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images?: string[];
  isDelete?: boolean;
  catalogId?: string;
  sizes?: SizeStock[];
};
type StockAdjustment = {
  _id: string;
  size: string;
  delta: number;
  beforeStock: number;
  afterStock: number;
  reason: string;
  source: string;
  actorName?: string;
  createdAt: string;
};
type CatalogSection = 'all' | 'published' | 'low-stock' | 'archived';

const emptyProduct: Product = { _id: '', name: '', description: '', category: '', price: 0, originalPrice: 0, discount: 0, images: [], sizes: [{ size: 'Standard', stock: 0, lowStockThreshold: 10 }] };
const storefrontUrl = 'https://kampungcetak.com';
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const resolveImageUrl = (image: string) => image.startsWith('/images/') ? `${storefrontUrl}${encodeURI(image)}` : image.startsWith('/') && backendUrl ? `${backendUrl}${encodeURI(image)}` : image;
const thresholdFor = (size: SizeStock) => Number(size.lowStockThreshold ?? 10);
const isLowSize = (size: SizeStock) => Number(size.stock || 0) <= thresholdFor(size);
const needsStock = (product: Product) => !product.isDelete && (product.sizes || []).some(isLowSize);
const totalStock = (product: Product) => (product.sizes || []).reduce((total, item) => total + Number(item.stock || 0), 0);

export default function CatalogPage() {
  const { data: session } = useSession();
  const token = session?.user?.token || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<CatalogSection>('published');
  const [editing, setEditing] = useState<Product | null>(null);
  const [preview, setPreview] = useState<Product | null>(null);
  const [adjusting, setAdjusting] = useState<{ product: Product; size: string; delta: string; reason: string } | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<StockAdjustment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await getCatalog(token);
      setProducts((result.products || []).map((product: Product) => ({ ...product, images: (product.images || []).map(resolveImageUrl) })));
      setSelected([]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not load catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [token]);

  const filtered = useMemo(() => products.filter(product => {
    const matchesQuery = `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase());
    const matchesSection = section === 'all'
      || (section === 'archived' ? product.isDelete : section === 'low-stock' ? needsStock(product) : !product.isDelete);
    return matchesQuery && matchesSection;
  }), [products, query, section]);
  const publishedCount = products.filter(product => !product.isDelete).length;
  const archivedCount = products.filter(product => product.isDelete).length;
  const lowStockCount = products.filter(needsStock).length;
  const allSelected = filtered.length > 0 && filtered.every(product => selected.includes(product._id));

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = { ...editing, _id: undefined };
      if (editing._id) await updateCatalogProduct(token, editing._id, payload);
      else await createCatalogProduct(token, payload);
      toast.success(editing._id ? 'Product updated' : 'Product created');
      setEditing(null);
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file: File) => {
    try {
      const result = await getCatalogImageUploadUrl(token, file.name, file.type);
      const upload = await fetch(result.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!upload.ok) throw new Error('Image upload failed');
      setEditing(current => current ? { ...current, images: [...(current.images || []), result.imageUrl] } : current);
      toast.success('Image uploaded');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not upload image');
    }
  };

  const updateSize = (index: number, patch: Partial<SizeStock>) => setEditing(current => current ? { ...current, sizes: (current.sizes || []).map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) } : current);
  const addSize = () => setEditing(current => current ? { ...current, sizes: [...(current.sizes || []), { size: '', stock: 0, lowStockThreshold: 10 }] } : current);
  const removeSize = (index: number) => setEditing(current => current ? { ...current, sizes: (current.sizes || []).filter((_, itemIndex) => itemIndex !== index) } : current);
  const toggleSelection = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const bulkArchive = async (archived: boolean) => { try { await bulkArchiveCatalog(token, selected, archived); toast.success(archived ? 'Products archived' : 'Products restored'); await load(); } catch { toast.error('Bulk update failed'); } };
  const bulkDelete = async () => { if (section !== 'archived') return; if (!confirm('Permanently delete the selected archived products? This cannot be undone.')) return; try { await bulkDeleteCatalog(token, selected); toast.success('Products permanently deleted'); await load(); } catch { toast.error('Bulk delete failed'); } };

  const openAdjustment = (product: Product, size?: string) => setAdjusting({ product, size: size || product.sizes?.[0]?.size || '', delta: '', reason: '' });
  const saveAdjustment = async () => {
    if (!adjusting) return;
    const delta = Number(adjusting.delta);
    setSaving(true);
    try {
      await adjustCatalogStock(token, adjusting.product._id, { size: adjusting.size, delta, reason: adjusting.reason });
      toast.success('Stock adjusted');
      setAdjusting(null);
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not adjust stock');
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async (product: Product) => {
    setHistoryProduct(product);
    setHistory([]);
    setHistoryLoading(true);
    try {
      const result = await getCatalogStockAdjustments(token, product._id);
      setHistory(result.adjustments || []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not load stock history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const sectionTitle = section === 'archived' ? 'Archived products' : section === 'low-stock' ? 'Low-stock products' : section === 'published' ? 'Published products' : 'All products';
  const selectedSize = adjusting?.product.sizes?.find(item => item.size === adjusting.size);
  const resultingStock = selectedSize ? Number(selectedSize.stock) + Number(adjusting?.delta || 0) : 0;

  return (
    <main className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Storefront / Catalog</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Product catalog</h1><p className="mt-2 text-sm text-muted-foreground">Track inventory by size, respond to low stock, and keep every adjustment accountable.</p></div>
        <Button onClick={() => setEditing({ ...emptyProduct, images: [], sizes: [{ size: 'Standard', stock: 0, lowStockThreshold: 10 }] })}><Plus className="mr-2 h-4 w-4" /> New product</Button>
      </div>

      {lowStockCount > 0 && <button type="button" onClick={() => { setSection('low-stock'); setSelected([]); }} className="flex w-full items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left hover:bg-amber-500/15"><span className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-600" /><span><strong>{lowStockCount} product{lowStockCount === 1 ? '' : 's'} need stock attention</strong><span className="block text-sm text-muted-foreground">One or more sizes are at or below their warning threshold.</span></span></span><span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Review stock</span></button>}

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><CardTitle>{sectionTitle} <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span></CardTitle><div className="relative w-full md:w-72"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name or category" className="pl-9" /></div></div>
          <div className="flex flex-wrap gap-2"><Button size="sm" variant={section === 'published' ? 'default' : 'outline'} onClick={() => { setSection('published'); setSelected([]); }}>Published ({publishedCount})</Button><Button size="sm" variant={section === 'low-stock' ? 'default' : 'outline'} onClick={() => { setSection('low-stock'); setSelected([]); }}><AlertTriangle className="mr-1 h-4 w-4" /> Low stock ({lowStockCount})</Button><Button size="sm" variant={section === 'archived' ? 'default' : 'outline'} onClick={() => { setSection('archived'); setSelected([]); }}><Archive className="mr-1 h-4 w-4" /> Archived ({archivedCount})</Button><Button size="sm" variant={section === 'all' ? 'default' : 'outline'} onClick={() => { setSection('all'); setSelected([]); }}>All ({products.length})</Button></div>
        </CardHeader>
        <CardContent>
          {selected.length > 0 && <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-muted p-3 text-sm"><strong>{selected.length} selected</strong><Button size="sm" variant="outline" onClick={() => void bulkArchive(false)}><Check className="mr-1 h-4 w-4" /> Restore</Button><Button size="sm" variant="outline" onClick={() => void bulkArchive(true)}><Archive className="mr-1 h-4 w-4" /> Archive</Button>{section === 'archived' && <Button size="sm" variant="destructive" onClick={() => void bulkDelete()}><Trash2 className="mr-1 h-4 w-4" /> Delete permanently</Button>}</div>}
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="w-10 p-3"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : filtered.map(product => product._id))} /></th><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="min-w-52 p-3">Stock by size / format</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading catalog...</td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No products match this view.</td></tr> : filtered.map(product => <tr key={product._id} className="border-b align-top last:border-0 hover:bg-muted/40"><td className="p-3"><input type="checkbox" checked={selected.includes(product._id)} onChange={() => toggleSelection(product._id)} /></td><td className="p-3"><div className="flex items-center gap-3"><div className="h-11 w-11 overflow-hidden rounded-lg bg-muted">{product.images?.[0] && <img src={product.images[0]} alt="" className="h-full w-full object-cover" />}</div><div><p className="font-semibold">{product.name}</p><p className="max-w-xs truncate text-xs text-muted-foreground">{product.description}</p></div></div></td><td className="p-3 text-muted-foreground">{product.category}</td><td className="p-3 font-semibold">RM {Number(product.price || 0).toFixed(2)}</td><td className="p-3"><div className="flex flex-wrap gap-1.5">{(product.sizes || []).map(size => <button key={size.size} type="button" disabled={product.isDelete} onClick={() => openAdjustment(product, size.size)} className="rounded-md border px-2 py-1 text-left disabled:cursor-default"><span className="font-medium">{size.size}: {size.stock}</span>{Number(size.stock) === 0 ? <Badge variant="destructive" className="ml-2">Out</Badge> : isLowSize(size) ? <Badge className="ml-2 bg-amber-500 text-black hover:bg-amber-500">Low</Badge> : null}<span className="block text-[10px] text-muted-foreground">alert at {thresholdFor(size)}</span></button>)}</div></td><td className="p-3">{product.isDelete ? <Badge variant="secondary">Archived</Badge> : totalStock(product) === 0 ? <Badge variant="destructive">Out of stock</Badge> : needsStock(product) ? <Badge className="bg-amber-500 text-black hover:bg-amber-500">Low stock</Badge> : <Badge className="bg-emerald-600">Published</Badge>}</td><td className="p-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Preview" onClick={() => setPreview(product)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title="Adjust stock" disabled={product.isDelete} onClick={() => openAdjustment(product)}><PackagePlus className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title="Stock history" onClick={() => void openHistory(product)}><History className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title="Edit" onClick={() => setEditing({ ...product, images: [...(product.images || [])], sizes: (product.sizes || []).map(size => ({ ...size })) })}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title={product.isDelete ? 'Restore' : 'Archive'} onClick={async () => { await archiveCatalogProduct(token, product._id, !product.isDelete); await load(); }}>{product.isDelete ? <Check className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button></div></td></tr>)}</tbody></table></div>
        </CardContent>
      </Card>

      {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>{editing._id ? 'Edit product' : 'New product'}</CardTitle><Button variant="ghost" size="icon" onClick={() => setEditing(null)}><X /></Button></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><label className="space-y-1 text-sm font-medium">Name / Nama<Input value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} /></label><label className="space-y-1 text-sm font-medium">Category / Kategori<Input value={editing.category} onChange={event => setEditing({ ...editing, category: event.target.value })} /></label><label className="space-y-1 text-sm font-medium">Price / Harga<Input type="number" min="0" value={editing.price} onChange={event => setEditing({ ...editing, price: Number(event.target.value) })} /></label><label className="space-y-1 text-sm font-medium">Original price / Harga asal<Input type="number" min="0" value={editing.originalPrice || 0} onChange={event => setEditing({ ...editing, originalPrice: Number(event.target.value) })} /></label></div><label className="block space-y-1 text-sm font-medium">Description / Penerangan<Textarea value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })} rows={4} /></label>
        <section className="space-y-3 rounded-xl border bg-muted/30 p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Stock controls / Kawalan stok</p><p className="text-xs text-muted-foreground">Set warning levels here. Use Adjust stock for auditable quantity changes.</p></div><Badge variant="outline">{totalStock(editing)} units total</Badge></div>{(editing.sizes || []).map((item, index) => <div key={index} className="grid items-end gap-2 sm:grid-cols-[1fr_8rem_8rem_auto]"><label className="space-y-1 text-xs font-medium">Size / Saiz<Input value={item.size} placeholder="Standard, A4..." onChange={event => updateSize(index, { size: event.target.value })} /></label><label className="space-y-1 text-xs font-medium">Quantity<Input type="number" min="0" value={item.stock} disabled={Boolean(editing._id)} onChange={event => updateSize(index, { stock: Number(event.target.value) })} /></label><label className="space-y-1 text-xs font-medium">Low-stock alert<Input type="number" min="0" value={thresholdFor(item)} onChange={event => updateSize(index, { lowStockThreshold: Number(event.target.value) })} /></label><Button type="button" variant="ghost" size="icon" aria-label="Remove size" disabled={Boolean(editing._id && item.stock > 0)} title={editing._id && item.stock > 0 ? 'Adjust this size to zero before removing it' : 'Remove size'} onClick={() => removeSize(index)}><X className="h-4 w-4" /></Button></div>)}<div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={addSize}><Plus className="mr-1 h-4 w-4" /> Add size</Button>{editing._id && <Button type="button" variant="outline" size="sm" onClick={() => { const product = editing; setEditing(null); openAdjustment(product); }}><PackagePlus className="mr-1 h-4 w-4" /> Adjust stock</Button>}</div></section>
        <div className="space-y-3"><div className="flex items-center justify-between"><p className="text-sm font-medium">Images / Gambar</p><label className="inline-flex cursor-pointer items-center rounded-md border px-3 py-2 text-sm hover:bg-muted"><ImagePlus className="mr-2 h-4 w-4" /> Upload image<input type="file" accept="image/*" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.target.value = ''; }} /></label></div><div className="grid grid-cols-3 gap-3">{(editing.images || []).map((image, index) => <div key={`${image}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border"><img src={image} alt={`${editing.name} ${index + 1}`} className="h-full w-full object-cover" /><button type="button" className="absolute right-1 top-1 hidden rounded-full bg-black/70 p-1 text-white group-hover:block" onClick={() => setEditing({ ...editing, images: (editing.images || []).filter((_, imageIndex) => imageIndex !== index) })}><X className="h-3 w-3" /></button></div>)}</div></div><div className="flex justify-end gap-2 border-t pt-4"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={() => void save()} disabled={saving}>{saving ? 'Saving...' : 'Save product'}</Button></div></CardContent></Card></div>}

      {adjusting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><Card className="w-full max-w-md"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Adjust stock</CardTitle><p className="mt-1 text-sm text-muted-foreground">{adjusting.product.name}</p></div><Button variant="ghost" size="icon" onClick={() => setAdjusting(null)}><X /></Button></CardHeader><CardContent className="space-y-4"><label className="block space-y-1 text-sm font-medium">Size / format<select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={adjusting.size} onChange={event => setAdjusting({ ...adjusting, size: event.target.value })}>{(adjusting.product.sizes || []).map(size => <option key={size.size} value={size.size}>{size.size} ({size.stock} available)</option>)}</select></label><label className="block space-y-1 text-sm font-medium">Adjustment<Input type="number" step="1" placeholder="Use + to add or - to remove" value={adjusting.delta} onChange={event => setAdjusting({ ...adjusting, delta: event.target.value })} /></label><div className={`rounded-lg border p-3 text-sm ${resultingStock < 0 ? 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300' : 'bg-muted/40'}`}>Current: <strong>{selectedSize?.stock ?? 0}</strong> &rarr; New stock: <strong>{resultingStock}</strong></div><label className="block space-y-1 text-sm font-medium">Reason<Textarea maxLength={300} placeholder="Delivery received, damaged stock, count correction..." value={adjusting.reason} onChange={event => setAdjusting({ ...adjusting, reason: event.target.value })} rows={3} /></label><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAdjusting(null)}>Cancel</Button><Button disabled={saving || !Number.isInteger(Number(adjusting.delta)) || Number(adjusting.delta) === 0 || resultingStock < 0 || adjusting.reason.trim().length < 3} onClick={() => void saveAdjustment()}>{saving ? 'Saving...' : 'Record adjustment'}</Button></div></CardContent></Card></div>}

      {historyProduct && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><Card className="max-h-[85vh] w-full max-w-3xl overflow-y-auto"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Stock adjustment history</CardTitle><p className="mt-1 text-sm text-muted-foreground">{historyProduct.name}</p></div><Button variant="ghost" size="icon" onClick={() => setHistoryProduct(null)}><X /></Button></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-2">Date</th><th className="p-2">Size</th><th className="p-2">Change</th><th className="p-2">Stock</th><th className="p-2">Reason</th><th className="p-2">By</th></tr></thead><tbody>{historyLoading ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading history...</td></tr> : history.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No stock adjustments recorded yet.</td></tr> : history.map(item => <tr key={item._id} className="border-b align-top last:border-0"><td className="whitespace-nowrap p-2">{new Date(item.createdAt).toLocaleString()}</td><td className="p-2 font-medium">{item.size}</td><td className={`p-2 font-semibold ${item.delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{item.delta > 0 ? '+' : ''}{item.delta}</td><td className="whitespace-nowrap p-2">{item.beforeStock} &rarr; {item.afterStock}</td><td className="min-w-48 p-2"><span>{item.reason}</span><span className="block text-xs capitalize text-muted-foreground">{item.source}</span></td><td className="p-2">{item.actorName || 'System'}</td></tr>)}</tbody></table></div></CardContent></Card></div>}

      {preview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(null)}><Card className="w-full max-w-lg" onClick={event => event.stopPropagation()}><CardHeader className="flex flex-row items-center justify-between"><CardTitle>{preview.name}</CardTitle><Button variant="ghost" size="icon" onClick={() => setPreview(null)}><X /></Button></CardHeader><CardContent><div className="aspect-video overflow-hidden rounded-xl bg-muted">{preview.images?.[0] && <img src={preview.images[0]} alt={preview.name} className="h-full w-full object-contain" />}</div><p className="mt-4 text-sm text-muted-foreground">{preview.description}</p><p className="mt-3 text-xl font-bold">RM {Number(preview.price || 0).toFixed(2)}</p><div className="mt-3 flex flex-wrap gap-2">{(preview.sizes || []).map(size => <Badge key={size.size} variant={isLowSize(size) ? 'destructive' : 'outline'}>{size.size}: {size.stock}</Badge>)}</div></CardContent></Card></div>}
    </main>
  );
}
