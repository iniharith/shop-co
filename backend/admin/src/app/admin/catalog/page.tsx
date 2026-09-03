'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Archive, Check, Eye, ImagePlus, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { archiveCatalogProduct, bulkArchiveCatalog, bulkDeleteCatalog, createCatalogProduct, getCatalog, getCatalogImageUploadUrl, updateCatalogProduct } from '@/api/catalog';

type Product = {
  _id: string; name: string; description: string; category: string; price: number; originalPrice?: number;
  discount?: number; images?: string[]; isDelete?: boolean; catalogId?: string;
};

const emptyProduct: Product = { _id: '', name: '', description: '', category: '', price: 0, originalPrice: 0, discount: 0, images: [] };
const storefrontUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://kampungcetak.com';
const resolveImageUrl = (image: string) => image.startsWith('/') ? `${storefrontUrl}${image}` : image;

export default function CatalogPage() {
  const { data: session } = useSession();
  const token = session?.user?.token || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [preview, setPreview] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try { const result = await getCatalog(token); setProducts((result.products || []).map((product: Product) => ({ ...product, images: (product.images || []).map(resolveImageUrl) }))); setSelected([]); }
    catch (error: any) { toast.error(error?.response?.data?.message || 'Could not load catalog'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [token]);

  const filtered = useMemo(() => products.filter(product => `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const allSelected = filtered.length > 0 && filtered.every(product => selected.includes(product._id));

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = { ...editing, _id: undefined };
      if (editing._id) await updateCatalogProduct(token, editing._id, payload);
      else await createCatalogProduct(token, payload);
      toast.success(editing._id ? 'Product updated' : 'Product created'); setEditing(null); await load();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Could not save product'); }
    finally { setSaving(false); }
  };

  const uploadImage = async (file: File) => {
    try {
      const result = await getCatalogImageUploadUrl(token, file.name, file.type);
      await fetch(result.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      setEditing(current => current ? { ...current, images: [...(current.images || []), result.imageUrl] } : current);
      toast.success('Image uploaded');
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Could not upload image'); }
  };

  const toggleSelection = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const bulkArchive = async (archived: boolean) => { try { await bulkArchiveCatalog(token, selected, archived); toast.success(archived ? 'Products archived' : 'Products restored'); await load(); } catch { toast.error('Bulk update failed'); } };
  const bulkDelete = async () => { if (!confirm('Permanently delete the selected products? This cannot be undone.')) return; try { await bulkDeleteCatalog(token, selected); toast.success('Products permanently deleted'); await load(); } catch { toast.error('Bulk delete failed'); } };

  return (
    <main className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Storefront / Catalog</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Product catalog</h1><p className="mt-2 text-sm text-muted-foreground">Publish, organize, and retire products without touching the database.</p></div>
        <Button onClick={() => setEditing({ ...emptyProduct, images: [] })}><Plus className="mr-2 h-4 w-4" /> New product</Button>
      </div>

      <Card><CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><CardTitle>All products <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span></CardTitle><div className="relative w-full md:w-72"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name or category" className="pl-9" /></div></CardHeader><CardContent>
        {selected.length > 0 && <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-muted p-3 text-sm"><strong>{selected.length} selected</strong><Button size="sm" variant="outline" onClick={() => void bulkArchive(false)}><Check className="mr-1 h-4 w-4" /> Restore</Button><Button size="sm" variant="outline" onClick={() => void bulkArchive(true)}><Archive className="mr-1 h-4 w-4" /> Archive</Button><Button size="sm" variant="destructive" onClick={() => void bulkDelete()}><Trash2 className="mr-1 h-4 w-4" /> Delete permanently</Button></div>}
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="w-10 p-3"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : filtered.map(product => product._id))} /></th><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading catalog...</td></tr> : filtered.map(product => <tr key={product._id} className="border-b last:border-0 hover:bg-muted/40"><td className="p-3"><input type="checkbox" checked={selected.includes(product._id)} onChange={() => toggleSelection(product._id)} /></td><td className="p-3"><div className="flex items-center gap-3"><div className="h-11 w-11 overflow-hidden rounded-lg bg-muted">{product.images?.[0] && <img src={product.images[0]} alt="" className="h-full w-full object-cover" />}</div><div><p className="font-semibold">{product.name}</p><p className="max-w-xs truncate text-xs text-muted-foreground">{product.description}</p></div></div></td><td className="p-3 text-muted-foreground">{product.category}</td><td className="p-3 font-semibold">RM {Number(product.price || 0).toFixed(2)}</td><td className="p-3">{product.isDelete ? <Badge variant="secondary">Archived</Badge> : <Badge className="bg-emerald-600">Published</Badge>}</td><td className="p-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="Preview" onClick={() => setPreview(product)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title="Edit" onClick={() => setEditing({ ...product, images: [...(product.images || [])] })}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" title={product.isDelete ? 'Restore' : 'Archive'} onClick={async () => { await archiveCatalogProduct(token, product._id, !product.isDelete); await load(); }}><Archive className="h-4 w-4" /></Button></div></td></tr>)}</tbody></table></div>
      </CardContent></Card>

      {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto"><CardHeader className="flex flex-row items-center justify-between"><CardTitle>{editing._id ? 'Edit product' : 'New product'}</CardTitle><Button variant="ghost" size="icon" onClick={() => setEditing(null)}><X /></Button></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><label className="space-y-1 text-sm font-medium">Name / Nama<Input value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} /></label><label className="space-y-1 text-sm font-medium">Category / Kategori<Input value={editing.category} onChange={event => setEditing({ ...editing, category: event.target.value })} /></label><label className="space-y-1 text-sm font-medium">Price / Harga<Input type="number" min="0" value={editing.price} onChange={event => setEditing({ ...editing, price: Number(event.target.value) })} /></label><label className="space-y-1 text-sm font-medium">Original price / Harga asal<Input type="number" min="0" value={editing.originalPrice || 0} onChange={event => setEditing({ ...editing, originalPrice: Number(event.target.value) })} /></label></div><label className="block space-y-1 text-sm font-medium">Description / Penerangan<Textarea value={editing.description} onChange={event => setEditing({ ...editing, description: event.target.value })} rows={4} /></label><div className="space-y-3"><div className="flex items-center justify-between"><p className="text-sm font-medium">Images / Gambar</p><label className="inline-flex cursor-pointer items-center rounded-md border px-3 py-2 text-sm hover:bg-muted"><ImagePlus className="mr-2 h-4 w-4" /> Upload image<input type="file" accept="image/*" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void uploadImage(file); event.target.value = ''; }} /></label></div><div className="grid grid-cols-3 gap-3">{(editing.images || []).map((image, index) => <div key={`${image}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border"><img src={image} alt={`${editing.name} ${index + 1}`} className="h-full w-full object-cover" /><button type="button" className="absolute right-1 top-1 hidden rounded-full bg-black/70 p-1 text-white group-hover:block" onClick={() => setEditing({ ...editing, images: (editing.images || []).filter((_, imageIndex) => imageIndex !== index) })}><X className="h-3 w-3" /></button></div>)}</div></div><div className="flex justify-end gap-2 border-t pt-4"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={() => void save()} disabled={saving}>{saving ? 'Saving...' : 'Save product'}</Button></div></CardContent></Card></div>}
      {preview && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(null)}><Card className="w-full max-w-lg" onClick={event => event.stopPropagation()}><CardHeader><CardTitle>{preview.name}</CardTitle></CardHeader><CardContent><div className="aspect-video overflow-hidden rounded-xl bg-muted">{preview.images?.[0] && <img src={preview.images[0]} alt={preview.name} className="h-full w-full object-contain" />}</div><p className="mt-4 text-sm text-muted-foreground">{preview.description}</p><p className="mt-3 text-xl font-bold">RM {Number(preview.price || 0).toFixed(2)}</p></CardContent></Card></div>}
    </main>
  );
}
