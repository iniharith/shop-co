'use client';

import { DragEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, GripVertical, ImagePlus, Link2, Loader2, Save, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { createCatalogProduct, getCatalogImageUploadUrl, getCatalogProduct, updateCatalogProduct } from '@/api/catalog';

type SizeStock = { size: string; stock: number; lowStockThreshold?: number; images?: string[] };
type Product = {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  images: string[];
  sizes: SizeStock[];
  slug?: string;
  status?: 'draft' | 'published';
  seoTitle?: string;
  seoDescription?: string;
  specifications?: { material?: string; frame?: string; dimensions?: string; weight?: string; finish?: string; color?: string; customFields?: Record<string, string> };
  packageContents?: string[];
  productionTurnaround?: { standardDays?: number; expressDays?: number; notes?: string };
  warrantyInfo?: string;
  [key: string]: unknown;
};

const categories = ['DIGITAL PRINTING', 'DISPLAY ITEM', 'DIGITAL OFFSET', 'PREMIUM GIFT', 'APPAREL/SUBLIMATION', 'FRAME', 'WEDDING PRODUCT', 'FOOD PACKAGING', 'ISLAMIC KHAT', 'ACRYLIC', 'BUNTING & BANNER', 'PHOTOBOOK', 'MAGNET', 'MENU BOOK', 'ALAMAT RUMAH', 'NO PLAT', 'STICKER', 'WEDDING CARD', 'NOTEBOOK'];
const emptyProduct: Product = { _id: '', name: '', description: '', category: 'DIGITAL PRINTING', price: 0, originalPrice: 0, discount: 0, images: [], sizes: [{ size: 'Standard', stock: 0, lowStockThreshold: 10 }], status: 'draft', slug: '', seoTitle: '', seoDescription: '', specifications: undefined, packageContents: [], productionTurnaround: undefined, warrantyInfo: '' };
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

async function validateImage(file: File): Promise<void> {
  if (!file.type.startsWith('image/')) throw new Error('Only image files are supported.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Images must be 20MB or smaller.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Image could not be read.')); image.src = url; });
    if (image.width < 200 || image.height < 200) throw new Error('Images must be at least 200 x 200 pixels.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ProductEditor({ productId }: { productId?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = session?.user?.token || '';
  const [product, setProduct] = useState<Product>(emptyProduct);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [draggedImage, setDraggedImage] = useState<number | null>(null);
  const [sizeLinkPicker, setSizeLinkPicker] = useState<number | null>(null);
  const [sizeLinkUrl, setSizeLinkUrl] = useState('');
  const [newCustomField, setNewCustomField] = useState({ key: '', value: '' });

  useEffect(() => {
    if (!productId || !token) return;
    void (async () => {
      setLoading(true);
      try {
        const result = await getCatalogProduct(token, productId);
        const current = result.product as Product;
        setProduct({ ...emptyProduct, ...current, images: current.images || [], sizes: current.sizes || [] });
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Could not load product');
        router.replace('/admin/catalog');
      } finally {
        setLoading(false);
      }
    })();
  }, [productId, router, token]);

  const updateSize = (index: number, patch: Partial<SizeStock>) => setProduct(current => ({ ...current, sizes: current.sizes.map((size, sizeIndex) => sizeIndex === index ? { ...size, ...patch } : size) }));
  const moveImage = (from: number, to: number) => setProduct(current => {
    const images = [...current.images];
    const [image] = images.splice(from, 1);
    images.splice(to, 0, image);
    return { ...current, images };
  });
  const handleDrop = (event: DragEvent<HTMLDivElement>, to: number) => {
    event.preventDefault();
    if (draggedImage !== null && draggedImage !== to) moveImage(draggedImage, to);
    setDraggedImage(null);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const uploadKey = `${file.name}-${file.size}`;
      try {
        await validateImage(file);
        setUploading(current => ({ ...current, [uploadKey]: 0 }));
        const signed = await getCatalogImageUploadUrl(token, file.name, file.type);
        await new Promise<void>((resolve, reject) => {
          const request = new XMLHttpRequest();
          request.open('PUT', signed.uploadUrl);
          request.setRequestHeader('Content-Type', file.type);
          request.upload.onprogress = event => { if (event.lengthComputable) setUploading(current => ({ ...current, [uploadKey]: Math.round(event.loaded / event.total * 100) })); };
          request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error('Image upload failed.'));
          request.onerror = () => reject(new Error('Image upload failed.'));
          request.send(file);
        });
        setProduct(current => ({ ...current, images: [...current.images, signed.imageUrl] }));
      } catch (error: any) {
        toast.error(error?.message || 'Could not upload image');
      } finally {
        setUploading(current => { const next = { ...current }; delete next[uploadKey]; return next; });
      }
    }
  };

  const uploadSizeFiles = async (index: number, files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const uploadKey = `${file.name}-${file.size}-${index}`;
      try {
        await validateImage(file);
        setUploading(current => ({ ...current, [uploadKey]: 0 }));
        const signed = await getCatalogImageUploadUrl(token, file.name, file.type);
        await new Promise<void>((resolve, reject) => {
          const request = new XMLHttpRequest();
          request.open('PUT', signed.uploadUrl);
          request.setRequestHeader('Content-Type', file.type);
          request.upload.onprogress = event => { if (event.lengthComputable) setUploading(current => ({ ...current, [uploadKey]: Math.round(event.loaded / event.total * 100) })); };
          request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error('Image upload failed.'));
          request.onerror = () => reject(new Error('Image upload failed.'));
          request.send(file);
        });
        updateSize(index, { images: [...(product.sizes[index]?.images || []), signed.imageUrl] });
      } catch (error: any) {
        toast.error(error?.message || 'Could not upload image');
      } finally {
        setUploading(current => { const next = { ...current }; delete next[uploadKey]; return next; });
      }
    }
  };

  const removeSizeImage = (index: number, imageIndex: number) => updateSize(index, { images: (product.sizes[index]?.images || []).filter((_, i) => i !== imageIndex) });

  const addSizeImage = (index: number, imageUrl: string) => {
    const url = String(imageUrl || '').trim();
    if (!url) return;
    updateSize(index, { images: [...(product.sizes[index]?.images || []), url] });
  };

  const updateSpec = (patch: Partial<NonNullable<Product['specifications']>>) => setProduct(current => ({ ...current, specifications: { ...(current.specifications || {}), ...patch } }));
  const addCustomField = (key: string, value: string) => setProduct(current => ({ ...current, specifications: { ...(current.specifications || {}), customFields: { ...(current.specifications?.customFields || {}), [key.trim()]: value } } }));
  const updateCustomField = (oldKey: string, newKey: string, value: string) => setProduct(current => {
    const customFields = { ...(current.specifications?.customFields || {}) };
    if (oldKey !== newKey) delete customFields[oldKey];
    if (newKey.trim()) customFields[newKey.trim()] = value;
    return { ...current, specifications: { ...(current.specifications || {}), customFields } };
  });
  const removeCustomField = (key: string) => setProduct(current => {
    const customFields = { ...(current.specifications?.customFields || {}) };
    delete customFields[key];
    return { ...current, specifications: { ...(current.specifications || {}), customFields } };
  });
  const updatePackageItem = (index: number, value: string) => setProduct(current => ({ ...current, packageContents: (current.packageContents || []).map((item, i) => (i === index ? value : item)) }));
  const addPackageItem = () => setProduct(current => ({ ...current, packageContents: [...(current.packageContents || []), ''] }));
  const removePackageItem = (index: number) => setProduct(current => ({ ...current, packageContents: (current.packageContents || []).filter((_, i) => i !== index) }));
  const updateTurnaround = (patch: Partial<NonNullable<Product['productionTurnaround']>>) => setProduct(current => ({ ...current, productionTurnaround: { ...(current.productionTurnaround || {}), ...patch } }));

  const save = async (status?: 'draft' | 'published') => {
    const payload = { ...product, status: status || product.status, slug: slugify(product.name) };
    setSaving(true);
    try {
      const result = productId ? await updateCatalogProduct(token, productId, payload) : await createCatalogProduct(token, payload);
      toast.success(payload.status === 'draft' ? 'Draft saved' : 'Product published');
      router.push(`/admin/catalog/${productId || result.product._id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></main>;

  return <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
    <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center"><div><Button asChild variant="ghost" size="sm" className="-ml-3"><Link href="/admin/catalog"><ArrowLeft className="mr-1" /> Catalog</Link></Button><h1 className="mt-2 text-3xl font-bold tracking-tight">{productId ? product.name || 'Edit product' : 'Create product'}</h1><p className="mt-1 text-sm text-muted-foreground">Build the product page, storefront URL, and publishing state in one workspace.</p></div><div className="flex flex-wrap gap-2"><Badge variant={product.status === 'published' ? 'default' : 'secondary'}>{product.status === 'published' ? 'Published' : 'Draft'}</Badge><Button variant="outline" disabled={saving} onClick={() => void save('draft')}><Save className="mr-2" /> Save draft</Button><Button disabled={saving} onClick={() => void save('published')}><Send className="mr-2" /> Publish</Button></div></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6"><section className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Product details</h2><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="space-y-1 text-sm font-medium md:col-span-2">Product name<Input value={product.name} maxLength={160} onChange={event => setProduct({ ...product, name: event.target.value })} /></label><label className="space-y-1 text-sm font-medium">Main product section<select value={product.category} onChange={event => setProduct({ ...product, category: event.target.value })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></label><label className="space-y-1 text-sm font-medium">Storefront URL <Badge variant="secondary">Auto</Badge><div className="rounded-lg bg-muted p-3 font-mono text-xs break-all">shop-co/... <span className="font-medium text-foreground">{slugify(product.name) || 'product-slug'}</span></div><p className="text-xs text-muted-foreground">Generated automatically from the product name — you don't need to set it. If the name is taken, a number is appended (e.g. <span className="font-medium text-foreground">banner-2</span>).</p></label><label className="space-y-1 text-sm font-medium">Price (RM)<Input type="number" min="0" value={product.price} onChange={event => setProduct({ ...product, price: Number(event.target.value) })} /></label><label className="space-y-1 text-sm font-medium">Original price (RM)<Input type="number" min="0" value={product.originalPrice || 0} onChange={event => setProduct({ ...product, originalPrice: Number(event.target.value) })} /></label></div><label className="mt-4 block space-y-1 text-sm font-medium">Description<Textarea value={product.description} rows={6} onChange={event => setProduct({ ...product, description: event.target.value })} /></label></section>
      <section className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Images</h2><p className="text-sm text-muted-foreground">Drag cards to set the storefront image order. The first image is primary.</p></div><label className="cursor-pointer"><Button type="button" variant="outline" asChild><span><ImagePlus className="mr-2" /> Upload<input className="hidden" type="file" accept="image/*" multiple onChange={event => { if (event.target.files) void uploadFiles(event.target.files); event.target.value = ''; }} /></span></Button></label></div><div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (event.dataTransfer.files.length) void uploadFiles(event.dataTransfer.files); }} className="mt-4 grid min-h-32 grid-cols-2 gap-3 rounded-xl border border-dashed p-3 sm:grid-cols-3">{product.images.map((image, index) => <div key={`${image}-${index}`} draggable onDragStart={() => setDraggedImage(index)} onDragEnd={() => setDraggedImage(null)} onDragOver={event => event.preventDefault()} onDrop={event => handleDrop(event, index)} className={`group relative aspect-square overflow-hidden rounded-lg border bg-muted ${draggedImage === index ? 'opacity-50' : ''}`}><img src={image} alt={`${product.name || 'Product'} image ${index + 1}`} onError={event => { event.currentTarget.style.display = 'none'; }} className="h-full w-full object-cover" />{index === 0 && <Badge className="absolute left-2 top-2">Primary</Badge>}<GripVertical className="absolute bottom-2 left-2 rounded bg-black/60 p-1 text-white" /><button type="button" className="absolute right-2 top-2 rounded bg-black/70 p-1 text-white" onClick={() => setProduct(current => ({ ...current, images: current.images.filter((_, imageIndex) => imageIndex !== index) }))}><X className="h-4 w-4" /></button></div>)}{product.images.length === 0 && <div className="col-span-full flex items-center justify-center text-sm text-muted-foreground">Drop images here or use Upload.</div>}</div>{Object.entries(uploading).map(([name, progress]) => <div key={name} className="mt-3 text-sm"><div className="flex justify-between"><span className="truncate">{name}</span><span>{progress}%</span></div><div className="mt-1 h-1.5 overflow-hidden rounded bg-muted"><div className="h-full bg-primary" style={{ width: `${progress}%` }} /></div></div>)}</section>
      <section className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Variations (sizes / formats)</h2><p className="text-sm text-muted-foreground">Each variation holds its own available quantity, low-stock warning level, and optional images shown when that variation is selected.</p><div className="mt-4 grid gap-3 px-1 text-xs font-medium text-muted-foreground sm:grid-cols-[minmax(0,1fr)_110px_130px]"><span>Size / format</span><span>Stock quantity</span><span>Low-stock warning</span></div><div className="mt-2 space-y-3">{product.sizes.map((size, index) => <div key={index} className="rounded-xl border p-3"><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_130px_auto]"><Input value={size.size} placeholder="e.g. A4, Standard, Large" onChange={event => updateSize(index, { size: event.target.value })} /><Input type="number" min="0" value={size.stock} aria-label={`Stock quantity for ${size.size || `variation ${index + 1}`}`} onChange={event => updateSize(index, { stock: Number(event.target.value) })} /><Input type="number" min="0" value={size.lowStockThreshold ?? 10} aria-label={`Low-stock warning for ${size.size || `variation ${index + 1}`}`} onChange={event => updateSize(index, { lowStockThreshold: Number(event.target.value) })} /><Button type="button" variant="ghost" size="icon" onClick={() => setProduct(current => ({ ...current, sizes: current.sizes.filter((_, sizeIndex) => sizeIndex !== index) }))}><X /></Button></div><label className="mt-3 block space-y-2 text-sm font-medium">Variation images <span className="font-normal text-muted-foreground">(optional — show when a customer selects this size)</span><div className="flex flex-wrap items-center gap-2"><label className="cursor-pointer"><Button type="button" variant="outline" size="sm" asChild><span><ImagePlus className="mr-1" /> Upload<input className="hidden" type="file" accept="image/*" multiple onChange={event => { if (event.target.files) void uploadSizeFiles(index, event.target.files); event.target.value = ''; }} /></span></Button></label><Button type="button" variant="outline" size="sm" onClick={() => setSizeLinkPicker(sizeLinkPicker === index ? null : index)}><Link2 className="mr-1" /> Link image</Button>{sizeLinkPicker === index && (<div className="w-full rounded-lg border bg-muted/30 p-2"><p className="mb-2 text-xs text-muted-foreground">Link an image for this variation — pick one already uploaded above or paste a URL.</p>{product.images.length > 0 && (<div className="flex flex-wrap gap-1.5">{product.images.map(productImage => (<button key={productImage} type="button" title="Use this image for the variation" onClick={() => addSizeImage(index, productImage)} className="h-10 w-10 overflow-hidden rounded border border-border transition-colors hover:border-primary"><img src={productImage} alt="" className="h-full w-full object-cover" /></button>))}</div>)}<div className="mt-2 flex items-center gap-2"><Input className="h-8 text-xs" value={sizeLinkUrl} onChange={event => setSizeLinkUrl(event.target.value)} placeholder="Paste an image URL..." aria-label="Variation image URL" /><Button type="button" size="sm" variant="outline" onClick={() => { const url = sizeLinkUrl.trim(); if (url) { addSizeImage(index, url); setSizeLinkUrl(''); } }}>Add</Button></div></div>)}{size.images?.map((image, imageIndex) => <div key={`${image}-${imageIndex}`} className="group relative h-16 w-16 overflow-hidden rounded-lg border bg-muted"><img src={image} alt={`${size.size || 'Variation'} image ${imageIndex + 1}`} onError={event => { event.currentTarget.style.display = 'none'; }} className="h-full w-full object-cover" />{imageIndex === 0 && <Badge className="absolute left-1 top-1 text-[9px]">Main</Badge>}<button type="button" className="absolute right-1 top-1 rounded bg-black/70 p-0.5 text-white" onClick={() => removeSizeImage(index, imageIndex)}><X className="h-3.5 w-3.5" /></button></div>)}</div></label></div>)}</div><Button type="button" className="mt-3" variant="outline" onClick={() => setProduct(current => ({ ...current, sizes: [...current.sizes, { size: '', stock: 0, lowStockThreshold: 10, images: [] }] }))}>Add size / format</Button></section>
      <section className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Details &amp; content</h2><p className="text-sm text-muted-foreground">Shown in the product information panel on the storefront.</p></div></div><div className="mt-4 space-y-6"><section><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Specifications</h3><div className="mt-2 grid gap-3 sm:grid-cols-2">{(['material', 'frame', 'dimensions', 'weight', 'finish', 'color'] as const).map(key => (<label key={key} className="space-y-1 text-sm font-medium capitalize">{key}<Input value={product.specifications?.[key] || ''} onChange={event => updateSpec({ [key]: event.target.value })} /></label>))}</div><div className="mt-3 space-y-2"><p className="text-sm font-medium">Custom fields</p>{Object.entries(product.specifications?.customFields || {}).map(([key, value]) => (<div key={key} className="flex items-center gap-2"><Input className="h-8 text-xs" value={key} onChange={event => updateCustomField(key, event.target.value, String(value))} aria-label="Custom field name" /><Input className="h-8 text-xs" value={String(value)} onChange={event => updateCustomField(key, key, event.target.value)} aria-label="Custom field value" /><Button type="button" variant="ghost" size="icon" onClick={() => removeCustomField(key)}><X className="h-4 w-4" /></Button></div>))}<div className="flex items-center gap-2"><Input className="h-8 text-xs" value={newCustomField.key} onChange={event => setNewCustomField(current => ({ ...current, key: event.target.value }))} placeholder="Field name" aria-label="New custom field name" /><Input className="h-8 text-xs" value={newCustomField.value} onChange={event => setNewCustomField(current => ({ ...current, value: event.target.value }))} placeholder="Value" aria-label="New custom field value" /><Button type="button" size="sm" variant="outline" disabled={!newCustomField.key.trim()} onClick={() => { addCustomField(newCustomField.key, newCustomField.value); setNewCustomField({ key: '', value: '' }); }}>Add field</Button></div></div></section><section><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Included</h3><p className="text-sm text-muted-foreground">What the customer receives with the product.</p><div className="mt-2 space-y-2">{product.packageContents?.map((item, index) => (<div key={index} className="flex items-center gap-2"><Input className="h-8 text-xs" value={item} onChange={event => updatePackageItem(index, event.target.value)} aria-label={`Included item ${index + 1}`} /><Button type="button" variant="ghost" size="icon" onClick={() => removePackageItem(index)}><X className="h-4 w-4" /></Button></div>))}<Button type="button" variant="outline" size="sm" onClick={addPackageItem}>Add item</Button></div></section><section><h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Production time</h3><div className="mt-2 grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm font-medium">Standard days<Input type="number" min="0" value={product.productionTurnaround?.standardDays ?? ''} onChange={event => updateTurnaround({ standardDays: Number(event.target.value) })} /></label><label className="space-y-1 text-sm font-medium">Express days<Input type="number" min="0" value={product.productionTurnaround?.expressDays ?? ''} onChange={event => updateTurnaround({ expressDays: Number(event.target.value) })} /></label></div><label className="mt-3 block space-y-1 text-sm font-medium">Notes<Textarea rows={2} value={product.productionTurnaround?.notes || ''} onChange={event => updateTurnaround({ notes: event.target.value })} /></label></section><label className="mt-6 block space-y-1 text-sm font-medium">Warranty<Textarea rows={2} value={product.warrantyInfo || ''} onChange={event => setProduct({ ...product, warrantyInfo: event.target.value })} placeholder="e.g. 1 year frame; 6 months banner outdoor" /></label></div></section>
    </div>
      <aside className="space-y-6"><section className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Publishing</h2><label className="mt-4 block space-y-1 text-sm font-medium">Status<select value={product.status || 'draft'} onChange={event => setProduct({ ...product, status: event.target.value as 'draft' | 'published' })} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="draft">Draft</option><option value="published">Published</option></select></label><p className="mt-3 text-xs text-muted-foreground">Drafts remain hidden from the storefront and public product API.</p></section><section className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Search preview</h2><label className="mt-4 block space-y-1 text-sm font-medium">SEO title <span className="font-normal text-muted-foreground">({(product.seoTitle || '').length}/70)</span><Input maxLength={70} value={product.seoTitle || ''} placeholder={product.name} onChange={event => setProduct({ ...product, seoTitle: event.target.value })} /></label><label className="mt-4 block space-y-1 text-sm font-medium">SEO description <span className="font-normal text-muted-foreground">({(product.seoDescription || '').length}/160)</span><Textarea maxLength={160} rows={5} value={product.seoDescription || ''} placeholder={product.description} onChange={event => setProduct({ ...product, seoDescription: event.target.value })} /></label><div className="mt-4 rounded-lg bg-muted p-3"><p className="truncate text-sm text-emerald-700">kampungcetak.com/home/shop/{slugify(product.name) || 'product-slug'}</p><p className="mt-1 font-medium">{product.seoTitle || product.name || 'Product title'}</p><p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{product.seoDescription || product.description || 'Product description'}</p></div></section></aside>
    </div>
  </main>;
}
