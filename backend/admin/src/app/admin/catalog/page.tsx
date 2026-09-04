'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { AlertTriangle, Archive, Check, Eye, History, PackagePlus, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adjustCatalogStock, archiveCatalogProduct, bulkArchiveCatalog, bulkDeleteCatalog, getCatalog, getCatalogStockAdjustments } from '@/api/catalog';

type SizeStock = { size: string; stock: number; lowStockThreshold?: number };
type Product = { _id: string; name: string; description: string; category: string; price: number; images?: string[]; isDelete?: boolean; status?: 'draft' | 'published'; slug?: string; sizes?: SizeStock[] };
type StockAdjustment = { _id: string; size: string; delta: number; beforeStock: number; afterStock: number; reason: string; source: string; actorName?: string; createdAt: string };
type CatalogSection = 'published' | 'drafts' | 'low-stock' | 'archived' | 'all';

const storefrontUrl = 'https://kampungcetak.com';
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
const resolveImageUrl = (image: string) => image.startsWith('/images/') ? `${storefrontUrl}${encodeURI(image)}` : image.startsWith('/') && backendUrl ? `${backendUrl}${encodeURI(image)}` : image;
const thresholdFor = (size: SizeStock) => Number(size.lowStockThreshold ?? 10);
const isLowSize = (size: SizeStock) => Number(size.stock || 0) <= thresholdFor(size);
const needsStock = (product: Product) => !product.isDelete && product.status !== 'draft' && (product.sizes || []).some(isLowSize);
const totalStock = (product: Product) => (product.sizes || []).reduce((total, size) => total + Number(size.stock || 0), 0);

export default function CatalogPage() {
  const { data: session } = useSession();
  const token = session?.user?.token || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<CatalogSection>('published');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingStock, setSettingStock] = useState<{ product: Product; size: string; stock: string } | null>(null);
  const [adjusting, setAdjusting] = useState<{ product: Product; size: string; delta: string; reason: string } | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<StockAdjustment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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
    const matchesSection = section === 'all' || (section === 'archived' ? product.isDelete : section === 'drafts' ? !product.isDelete && product.status === 'draft' : section === 'low-stock' ? needsStock(product) : !product.isDelete && product.status !== 'draft');
    return matchesQuery && matchesSection;
  }), [products, query, section]);
  const counts = { published: products.filter(product => !product.isDelete && product.status !== 'draft').length, drafts: products.filter(product => !product.isDelete && product.status === 'draft').length, archived: products.filter(product => product.isDelete).length, lowStock: products.filter(needsStock).length };
  const allSelected = filtered.length > 0 && filtered.every(product => selected.includes(product._id));
  const selectedSize = adjusting?.product.sizes?.find(size => size.size === adjusting.size);
  const resultingStock = Number(selectedSize?.stock || 0) + Number(adjusting?.delta || 0);

  const toggleSelection = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const bulkArchive = async (archived: boolean) => { try { await bulkArchiveCatalog(token, selected, archived); toast.success(archived ? 'Products archived' : 'Products restored'); await load(); } catch { toast.error('Bulk update failed'); } };
  const bulkDelete = async () => {
    if (section !== 'archived') return;
    const confirmation = prompt(`Permanent deletion is available only after 30 archived days. Type "DELETE ${selected.length} ARCHIVED PRODUCTS" to continue.`);
    if (!confirmation) return;
    try { await bulkDeleteCatalog(token, selected, confirmation); toast.success('Products permanently deleted'); await load(); }
    catch (error: any) { toast.error(error?.response?.data?.message || 'Bulk delete failed'); }
  };
  const openAdjustment = (product: Product, size?: string) => {
    const selectedSize = product.sizes?.find(item => item.size === (size || product.sizes?.[0]?.size));
    setSettingStock({ product, size: size || product.sizes?.[0]?.size || '', stock: String(selectedSize?.stock ?? 0) });
  };
  const saveStock = async () => {
    if (!settingStock) return;
    setSaving(true);
    try {
      await adjustCatalogStock(token, settingStock.product._id, { size: settingStock.size, stock: Number(settingStock.stock) });
      toast.success('Stock saved');
      setSettingStock(null);
      await load();
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Could not save stock'); } finally { setSaving(false); }
  };
  const saveAdjustment = async () => {
    if (!adjusting) return;
    setAdjusting(null);
  };
  const openHistory = async (product: Product) => {
    setHistoryProduct(product); setHistory([]); setHistoryLoading(true);
    try { const result = await getCatalogStockAdjustments(token, product._id); setHistory(result.adjustments || []); }
    catch (error: any) { toast.error(error?.response?.data?.message || 'Could not load stock history'); }
    finally { setHistoryLoading(false); }
  };

  return <main className="space-y-6 p-4 md:p-8">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Storefront / Catalog</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Product catalog</h1><p className="mt-2 text-sm text-muted-foreground">Manage the storefront, publishing workflow, and inventory from one catalog.</p></div><Button asChild><Link href="/admin/catalog/new"><Plus className="mr-2" /> New product</Link></Button></div>
    {counts.lowStock > 0 && <button type="button" onClick={() => { setSection('low-stock'); setSelected([]); }} className="flex w-full items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left hover:bg-amber-500/15"><span className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-600" /><span><strong>{counts.lowStock} product{counts.lowStock === 1 ? '' : 's'} need stock attention</strong><span className="block text-sm text-muted-foreground">One or more sizes are at or below their warning threshold.</span></span></span><span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Review stock</span></button>}
    <Card><CardHeader className="space-y-4"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><CardTitle>Catalog <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span></CardTitle><div className="relative w-full md:w-72"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name or category" className="pl-9" /></div></div><div className="flex flex-wrap gap-2">{([['published', 'Published', counts.published], ['drafts', 'Drafts', counts.drafts], ['low-stock', 'Low stock', counts.lowStock], ['archived', 'Archived', counts.archived], ['all', 'All', products.length]] as const).map(([key, label, count]) => <Button key={key} size="sm" variant={section === key ? 'default' : 'outline'} onClick={() => { setSection(key); setSelected([]); }}>{key === 'low-stock' && <AlertTriangle className="mr-1" />}{key === 'archived' && <Archive className="mr-1" />}{label} ({count})</Button>)}</div></CardHeader><CardContent>{selected.length > 0 && <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-muted p-3 text-sm"><strong>{selected.length} selected</strong><Button size="sm" variant="outline" onClick={() => void bulkArchive(false)}><Check className="mr-1" /> Restore</Button><Button size="sm" variant="outline" onClick={() => void bulkArchive(true)}><Archive className="mr-1" /> Archive</Button>{section === 'archived' && <Button size="sm" variant="destructive" onClick={() => void bulkDelete()}><Trash2 className="mr-1" /> Delete permanently</Button>}</div>}<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="w-10 p-3"><input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? [] : filtered.map(product => product._id))} /></th><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="min-w-52 p-3">Stock by size / format</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading catalog...</td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No products match this view.</td></tr> : filtered.map(product => <tr key={product._id} className="border-b align-top last:border-0 hover:bg-muted/40"><td className="p-3"><input type="checkbox" checked={selected.includes(product._id)} onChange={() => toggleSelection(product._id)} /></td><td className="p-3"><div className="flex items-center gap-3"><div className="h-11 w-11 overflow-hidden rounded-lg bg-muted">{product.images?.[0] && <img src={product.images[0]} alt="" className="h-full w-full object-cover" />}</div><div><Link href={`/admin/catalog/${product._id}`} className="font-semibold hover:text-primary">{product.name}</Link><p className="max-w-xs truncate text-xs text-muted-foreground">{product.description}</p></div></div></td><td className="p-3 text-muted-foreground">{product.category}</td><td className="p-3 font-semibold">RM {Number(product.price || 0).toFixed(2)}</td><td className="p-3"><div className="flex flex-wrap gap-1.5">{(product.sizes || []).map(size => <button key={size.size} type="button" disabled={product.isDelete} onClick={() => openAdjustment(product, size.size)} className="rounded-md border px-2 py-1 text-left disabled:cursor-default"><span className="font-medium">{size.size}: {size.stock}</span>{Number(size.stock) === 0 ? <Badge variant="destructive" className="ml-2">Out</Badge> : isLowSize(size) ? <Badge className="ml-2 bg-amber-500 text-black hover:bg-amber-500">Low</Badge> : null}<span className="block text-[10px] text-muted-foreground">alert at {thresholdFor(size)}</span></button>)}</div></td><td className="p-3">{product.isDelete ? <Badge variant="secondary">Archived</Badge> : product.status === 'draft' ? <Badge variant="outline">Draft</Badge> : totalStock(product) === 0 ? <Badge variant="destructive">Out of stock</Badge> : needsStock(product) ? <Badge className="bg-amber-500 text-black hover:bg-amber-500">Low stock</Badge> : <Badge className="bg-emerald-600">Published</Badge>}</td><td className="p-3"><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="icon" title="Edit"><Link href={`/admin/catalog/${product._id}`}><Pencil /></Link></Button><Button variant="ghost" size="icon" title="Adjust stock" disabled={product.isDelete} onClick={() => openAdjustment(product)}><PackagePlus /></Button><Button variant="ghost" size="icon" title="Stock history" onClick={() => void openHistory(product)}><History /></Button>{product.status === 'published' && !product.isDelete && <Button asChild variant="ghost" size="icon" title="Preview storefront"><a href={`${storefrontUrl}/home/shop/${product.slug || product._id}`} target="_blank" rel="noreferrer"><Eye /></a></Button>}<Button variant="ghost" size="icon" title={product.isDelete ? 'Restore' : 'Archive'} onClick={async () => { try { await archiveCatalogProduct(token, product._id, !product.isDelete); await load(); } catch { toast.error('Could not update archive status'); } }}>{product.isDelete ? <Check /> : <Archive />}</Button></div></td></tr>)}</tbody></table></div></CardContent></Card>
    {settingStock && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><Card className="w-full max-w-md"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Set stock quantity</CardTitle><p className="mt-1 text-sm text-muted-foreground">{settingStock.product.name}</p></div><Button variant="ghost" size="icon" onClick={() => setSettingStock(null)}><X /></Button></CardHeader><CardContent className="space-y-4"><label className="block space-y-1 text-sm font-medium">Size / format<select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={settingStock.size} onChange={event => { const size = settingStock.product.sizes?.find(item => item.size === event.target.value); setSettingStock({ ...settingStock, size: event.target.value, stock: String(size?.stock ?? 0) }); }}>{(settingStock.product.sizes || []).map(size => <option key={size.size} value={size.size}>{size.size}</option>)}</select></label><label className="block space-y-1 text-sm font-medium">Desired stock quantity<Input type="number" min="0" step="1" autoFocus value={settingStock.stock} onChange={event => setSettingStock({ ...settingStock, stock: event.target.value })} /></label><p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">Enter the final quantity you want available. The history records the change automatically.</p><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setSettingStock(null)}>Cancel</Button><Button disabled={saving || !Number.isInteger(Number(settingStock.stock)) || Number(settingStock.stock) < 0} onClick={() => void saveStock()}>{saving ? 'Saving...' : 'Save stock'}</Button></div></CardContent></Card></div>}
    {adjusting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><Card className="w-full max-w-md"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Adjust stock</CardTitle><p className="mt-1 text-sm text-muted-foreground">{adjusting.product.name}</p></div><Button variant="ghost" size="icon" onClick={() => setAdjusting(null)}><X /></Button></CardHeader><CardContent className="space-y-4"><label className="block space-y-1 text-sm font-medium">Size / format<select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={adjusting.size} onChange={event => setAdjusting({ ...adjusting, size: event.target.value })}>{(adjusting.product.sizes || []).map(size => <option key={size.size} value={size.size}>{size.size} ({size.stock} available)</option>)}</select></label><label className="block space-y-1 text-sm font-medium">Adjustment<Input type="number" step="1" placeholder="Use + to add or - to remove" value={adjusting.delta} onChange={event => setAdjusting({ ...adjusting, delta: event.target.value })} /></label><div className={`rounded-lg border p-3 text-sm ${resultingStock < 0 ? 'border-red-500/40 bg-red-500/10 text-red-700' : 'bg-muted/40'}`}>Current: <strong>{selectedSize?.stock ?? 0}</strong> &rarr; New stock: <strong>{resultingStock}</strong></div><label className="block space-y-1 text-sm font-medium">Reason<Textarea maxLength={300} placeholder="Delivery received, damaged stock, count correction..." value={adjusting.reason} onChange={event => setAdjusting({ ...adjusting, reason: event.target.value })} rows={3} /></label><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setAdjusting(null)}>Cancel</Button><Button disabled={saving || !Number.isInteger(Number(adjusting.delta)) || Number(adjusting.delta) === 0 || resultingStock < 0 || adjusting.reason.trim().length < 3} onClick={() => void saveAdjustment()}>{saving ? 'Saving...' : 'Record adjustment'}</Button></div></CardContent></Card></div>}
    {historyProduct && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><Card className="max-h-[85vh] w-full max-w-3xl overflow-y-auto"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Stock adjustment history</CardTitle><p className="mt-1 text-sm text-muted-foreground">{historyProduct.name}</p></div><Button variant="ghost" size="icon" onClick={() => setHistoryProduct(null)}><X /></Button></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-2">Date</th><th className="p-2">Size</th><th className="p-2">Change</th><th className="p-2">Stock</th><th className="p-2">Reason</th><th className="p-2">By</th></tr></thead><tbody>{historyLoading ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading history...</td></tr> : history.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No stock adjustments recorded yet.</td></tr> : history.map(item => <tr key={item._id} className="border-b align-top last:border-0"><td className="whitespace-nowrap p-2">{new Date(item.createdAt).toLocaleString()}</td><td className="p-2 font-medium">{item.size}</td><td className={`p-2 font-semibold ${item.delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{item.delta > 0 ? '+' : ''}{item.delta}</td><td className="whitespace-nowrap p-2">{item.beforeStock} &rarr; {item.afterStock}</td><td className="min-w-48 p-2"><span>{item.reason}</span><span className="block text-xs capitalize text-muted-foreground">{item.source}</span></td><td className="p-2">{item.actorName || 'System'}</td></tr>)}</tbody></table></div></CardContent></Card></div>}
  </main>;
}
