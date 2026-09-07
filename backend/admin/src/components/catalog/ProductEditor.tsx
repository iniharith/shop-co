'use client';

import { DragEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ArrowLeft,
  CheckCircle2,
  GripVertical,
  ImagePlus,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  createCatalogProduct,
  getCatalogImageUploadUrl,
  getCatalogProduct,
  updateCatalogProduct,
} from '@/api/catalog';
import { resolveImages } from '@/utils/productImage';

type SizeStock = {
  size: string;
  stock: number;
  lowStockThreshold?: number;
  images?: string[];
};

type DesignVariation = {
  name: string;
  stock: number;
  lowStockThreshold?: number;
  images?: string[];
};

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
  variations?: DesignVariation[];
  slug?: string;
  status?: 'draft' | 'published';
  seoTitle?: string;
  seoDescription?: string;
  specifications?: {
    material?: string;
    frame?: string;
    dimensions?: string;
    weight?: string;
    finish?: string;
    color?: string;
    customFields?: Record<string, string>;
  };
  packageContents?: string[];
  productionTurnaround?: {
    standardDays?: number;
    expressDays?: number;
    notes?: string;
  };
  warrantyInfo?: string;
  [key: string]: unknown;
};

const MAX_VARIATION_IMAGES = 8;

const categories = [
  'DIGITAL PRINTING',
  'DISPLAY ITEM',
  'DIGITAL OFFSET',
  'PREMIUM GIFT',
  'APPAREL/SUBLIMATION',
  'FRAME',
  'WEDDING PRODUCT',
  'FOOD PACKAGING',
  'ISLAMIC KHAT',
  'ACRYLIC',
  'BUNTING & BANNER',
  'PHOTOBOOK',
  'MAGNET',
  'MENU BOOK',
  'ALAMAT RUMAH',
  'NO PLAT',
  'STICKER',
  'WEDDING CARD',
  'NOTEBOOK',
];

const emptyProduct: Product = {
  _id: '',
  name: '',
  description: '',
  category: 'DIGITAL PRINTING',
  price: 0,
  originalPrice: 0,
  discount: 0,
  images: [],
  sizes: [{ size: 'Standard', stock: 0, lowStockThreshold: 10, images: [] }],
  variations: [],
  status: 'draft',
  slug: '',
  seoTitle: '',
  seoDescription: '',
  specifications: undefined,
  packageContents: [],
  productionTurnaround: undefined,
  warrantyInfo: '',
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function validateImage(file: File): Promise<void> {
  if (!file.type.startsWith('image/')) throw new Error('Only image files are supported.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Images must be 20MB or smaller.');

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image could not be read.'));
      image.src = url;
    });
    if (image.width < 200 || image.height < 200) {
      throw new Error('Images must be at least 200 x 200 pixels.');
    }
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
  const [selectedVariations, setSelectedVariations] = useState<number[]>([]);
  const [editingVariation, setEditingVariation] = useState<number | null>(0);
  const [newCustomField, setNewCustomField] = useState({ key: '', value: '' });
  const [variationLinkPicker, setVariationLinkPicker] = useState<number | null>(null);
  const [variationLinkUrl, setVariationLinkUrl] = useState('');

  useEffect(() => {
    if (!productId || !token) return;

    void (async () => {
      setLoading(true);
      try {
        const result = await getCatalogProduct(token, productId);
        const current = result.product as Product;
        setProduct({
          ...emptyProduct,
          ...current,
images: resolveImages(current.images),
          sizes: (current.sizes || []).map(size => ({
            ...size,
            images: Array.isArray(size.images) ? resolveImages(size.images.slice(0, MAX_VARIATION_IMAGES)) : [],
          })),
          variations: (current.variations || []).map(variation => ({
            name: variation.name || '',
            stock: Number(variation.stock) || 0,
            lowStockThreshold: variation.lowStockThreshold ?? 10,
            images: Array.isArray(variation.images) ? resolveImages(variation.images.slice(0, MAX_VARIATION_IMAGES)) : [],
          })),
        });
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Could not load product');
        router.replace('/admin/catalog');
      } finally {
        setLoading(false);
      }
    })();
  }, [productId, router, token]);

const updateSize = (index: number, patch: Partial<SizeStock>) =>
    setProduct(current => ({
      ...current,
      sizes: current.sizes.map((size, sizeIndex) =>
        sizeIndex === index ? { ...size, ...patch } : size,
      ),
    }));

  const appendSizeImage = (index: number, imageUrl: string) => {
    const url = String(imageUrl || '').trim();
    if (!url) return;

    setProduct(current => ({
      ...current,
      sizes: current.sizes.map((size, sizeIndex) => {
        if (sizeIndex !== index) return size;

        const images = size.images || [];
        if (images.includes(url) || images.length >= MAX_VARIATION_IMAGES) return size;

        return { ...size, images: [...images, url] };
      }),
    }));
  };

  const moveImage = (from: number, to: number) =>
    setProduct(current => {
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

  const uploadFileToStorage = async (file: File, uploadKey: string) => {
    await validateImage(file);
    setUploading(current => ({ ...current, [uploadKey]: 0 }));

    const signed = await getCatalogImageUploadUrl(token, file.name, file.type);

    await new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('PUT', signed.uploadUrl);
      request.setRequestHeader('Content-Type', file.type);
      request.upload.onprogress = event => {
        if (event.lengthComputable) {
          setUploading(current => ({
            ...current,
            [uploadKey]: Math.round((event.loaded / event.total) * 100),
          }));
        }
      };
      request.onload = () =>
        request.status >= 200 && request.status < 300
          ? resolve()
          : reject(new Error('Image upload failed.'));
      request.onerror = () => reject(new Error('Image upload failed.'));
      request.send(file);
    });

    return signed.imageUrl as string;
  };

  const clearUpload = (uploadKey: string) =>
    setUploading(current => {
      const next = { ...current };
      delete next[uploadKey];
      return next;
    });

  const uploadFiles = async (files: FileList | File[]) => {
    for (const file of Array.from(files)) {
      const uploadKey = `${file.name}-${file.size}`;
      try {
        const imageUrl = await uploadFileToStorage(file, uploadKey);
        setProduct(current => ({ ...current, images: [...current.images, imageUrl] }));
      } catch (error: any) {
        toast.error(error?.message || 'Could not upload image');
      } finally {
        clearUpload(uploadKey);
      }
    }
  };

  const uploadSizeFiles = async (index: number, files: FileList | File[]) => {
    const currentCount = product.sizes[index]?.images?.length || 0;
    const availableSlots = Math.max(0, MAX_VARIATION_IMAGES - currentCount);
    const selectedFiles = Array.from(files);
    const filesToUpload = selectedFiles.slice(0, availableSlots);

    if (availableSlots === 0) {
      toast.error(`This variation already has ${MAX_VARIATION_IMAGES} images.`);
      return;
    }

    if (filesToUpload.length < selectedFiles.length) {
      toast.info(`Only ${availableSlots} more variation image${availableSlots === 1 ? '' : 's'} can be added.`);
    }

    for (const file of filesToUpload) {
      const uploadKey = `variation-${index}-${file.name}-${file.size}`;
      try {
        const imageUrl = await uploadFileToStorage(file, uploadKey);
        appendSizeImage(index, imageUrl);
      } catch (error: any) {
        toast.error(error?.message || 'Could not upload image');
      } finally {
        clearUpload(uploadKey);
      }
    }
  };

  const removeSizeImage = (index: number, imageIndex: number) =>
    setProduct(current => ({
      ...current,
      sizes: current.sizes.map((size, sizeIndex) =>
        sizeIndex === index
          ? { ...size, images: (size.images || []).filter((_, i) => i !== imageIndex) }
          : size,
      ),
    }));

  const addSizeImage = (index: number, imageUrl: string) => appendSizeImage(index, imageUrl);

  const updateVariation = (index: number, patch: Partial<DesignVariation>) =>
    setProduct(current => ({
      ...current,
      variations: (current.variations || []).map((variation, variationIndex) =>
        variationIndex === index ? { ...variation, ...patch } : variation,
      ),
    }));

  const addVariation = () =>
    setProduct(current => ({
      ...current,
      variations: [...(current.variations || []), { name: '', stock: 0, lowStockThreshold: 10, images: [] }],
    }));

  const removeVariation = (index: number) =>
    setProduct(current => ({
      ...current,
      variations: (current.variations || []).filter((_, variationIndex) => variationIndex !== index),
    }));

  const appendVariationImage = (variationIndex: number, imageUrl: string) => {
    const url = String(imageUrl || '').trim();
    if (!url) return;

    setProduct(current => ({
      ...current,
      variations: (current.variations || []).map((variation, index) => {
        if (index !== variationIndex) return variation;
        const images = variation.images || [];
        if (images.includes(url) || images.length >= MAX_VARIATION_IMAGES) return variation;
        return { ...variation, images: [...images, url] };
      }),
    }));
  };

  const uploadVariationFiles = async (variationIndex: number, files: FileList | File[]) => {
    const currentCount = product.variations?.[variationIndex]?.images?.length || 0;
    const availableSlots = Math.max(0, MAX_VARIATION_IMAGES - currentCount);
    const selectedFiles = Array.from(files);
    const filesToUpload = selectedFiles.slice(0, availableSlots);

    if (availableSlots === 0) {
      toast.error(`This variation already has ${MAX_VARIATION_IMAGES} images.`);
      return;
    }
    if (filesToUpload.length < selectedFiles.length) {
      toast.info(`Only ${availableSlots} more variation image${availableSlots === 1 ? '' : 's'} can be added.`);
    }

    for (const file of filesToUpload) {
      const uploadKey = `design-${variationIndex}-${file.name}-${file.size}`;
      try {
        const imageUrl = await uploadFileToStorage(file, uploadKey);
        appendVariationImage(variationIndex, imageUrl);
      } catch (error: any) {
        toast.error(error?.message || 'Could not upload image');
      } finally {
        clearUpload(uploadKey);
      }
    }
  };

  const removeVariationImage = (variationIndex: number, imageIndex: number) =>
    setProduct(current => ({
      ...current,
      variations: (current.variations || []).map((variation, index) =>
        index === variationIndex
          ? { ...variation, images: (variation.images || []).filter((_, i) => i !== imageIndex) }
          : variation,
      ),
    }));

  const updateSpec = (patch: Partial<NonNullable<Product['specifications']>>) =>
    setProduct(current => ({
      ...current,
      specifications: { ...(current.specifications || {}), ...patch },
    }));

  const addCustomField = (key: string, value: string) =>
    setProduct(current => ({
      ...current,
      specifications: {
        ...(current.specifications || {}),
        customFields: {
          ...(current.specifications?.customFields || {}),
          [key.trim()]: value,
        },
      },
    }));

  const updateCustomField = (oldKey: string, newKey: string, value: string) =>
    setProduct(current => {
      const customFields = { ...(current.specifications?.customFields || {}) };
      if (oldKey !== newKey) delete customFields[oldKey];
      if (newKey.trim()) customFields[newKey.trim()] = value;
      return {
        ...current,
        specifications: { ...(current.specifications || {}), customFields },
      };
    });

  const removeCustomField = (key: string) =>
    setProduct(current => {
      const customFields = { ...(current.specifications?.customFields || {}) };
      delete customFields[key];
      return {
        ...current,
        specifications: { ...(current.specifications || {}), customFields },
      };
    });

  const updatePackageItem = (index: number, value: string) =>
    setProduct(current => ({
      ...current,
      packageContents: (current.packageContents || []).map((item, i) =>
        i === index ? value : item,
      ),
    }));

  const addPackageItem = () =>
    setProduct(current => ({
      ...current,
      packageContents: [...(current.packageContents || []), ''],
    }));

  const removePackageItem = (index: number) =>
    setProduct(current => ({
      ...current,
      packageContents: (current.packageContents || []).filter((_, i) => i !== index),
    }));

  const updateTurnaround = (
    patch: Partial<NonNullable<Product['productionTurnaround']>>,
  ) =>
    setProduct(current => ({
      ...current,
      productionTurnaround: { ...(current.productionTurnaround || {}), ...patch },
    }));

  const save = async (status?: 'draft' | 'published') => {
    const payload = {
      ...product,
      sizes: product.sizes.map(size => ({
        ...size,
        images: (size.images || []).slice(0, MAX_VARIATION_IMAGES),
      })),
      status: status || product.status,
      slug: slugify(product.name),
    };

    setSaving(true);
    try {
      const result = productId
        ? await updateCatalogProduct(token, productId, payload)
        : await createCatalogProduct(token, payload);

      toast.success(payload.status === 'draft' ? 'Draft saved' : 'Product published');
      router.push(`/admin/catalog/${productId || result.product._id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not save product');
    } finally {
      setSaving(false);
    }
  };

  const toggleVariationSelection = (index: number) => {
    setSelectedVariations(current =>
      current.includes(index) ? current.filter(item => item !== index) : [...current, index],
    );
  };

  const toggleSelectAllVariations = () => {
    setSelectedVariations(current =>
      current.length === product.sizes.length ? [] : product.sizes.map((_, index) => index),
    );
  };

  const bulkApplyMainImage = () => {
    const mainImage = product.images[0];
    if (!mainImage) {
      toast.error('Upload a main product image first.');
      return;
    }

    if (selectedVariations.length === 0) {
      toast.error('Select at least one variation.');
      return;
    }

    setProduct(current => ({
      ...current,
      sizes: current.sizes.map((size, index) => {
        if (!selectedVariations.includes(index)) return size;
        const images = size.images || [];
        if (images.includes(mainImage)) return size;
        return { ...size, images: [mainImage, ...images].slice(0, MAX_VARIATION_IMAGES) };
      }),
    }));

    toast.success('Main image linked to selected variations.');
  };

  const bulkClearVariationImages = () => {
    if (selectedVariations.length === 0) {
      toast.error('Select at least one variation.');
      return;
    }

    setProduct(current => ({
      ...current,
      sizes: current.sizes.map((size, index) =>
        selectedVariations.includes(index) ? { ...size, images: [] } : size,
      ),
    }));

    toast.success('Variation images cleared.');
  };

  const bulkDeleteSelected = () => {
    if (selectedVariations.length === 0) {
      toast.error('Select at least one variation.');
      return;
    }

    setProduct(current => ({
      ...current,
      sizes: current.sizes.filter((_, index) => !selectedVariations.includes(index)),
    }));
    setSelectedVariations([]);
    setEditingVariation(null);
    setSizeLinkPicker(null);
    toast.success('Selected variations deleted.');
  };

  const linkedVariationCount = useMemo(() => {
    const mainImage = product.images[0];
    if (!mainImage) return 0;
    return product.sizes.filter(size => (size.images || []).includes(mainImage)).length;
  }, [product.images, product.sizes]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </main>
    );
  }

  const mainImage = product.images[0] || '';
  const thumbnailImages = product.images.slice(1);
  const allSelected = product.sizes.length > 0 && selectedVariations.length === product.sizes.length;

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/admin/catalog">
              <ArrowLeft className="mr-1" /> Catalog
            </Link>
          </Button>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Product Images</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your main image and linked variations together for{' '}
            <span className="font-medium text-foreground">{product.name || 'this product'}</span>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
            {product.status === 'published' ? 'Published' : 'Draft'}
          </Badge>
          <Button variant="outline" disabled={saving} onClick={() => void save('draft')}>
            <Save className="mr-2" /> Save draft
          </Button>
          <label className="cursor-pointer">
            <Button type="button" asChild>
              <span>
                <Upload className="mr-2" /> Upload images
                <input
                  className="hidden"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={event => {
                    if (event.target.files) void uploadFiles(event.target.files);
                    event.target.value = '';
                  }}
                />
              </span>
            </Button>
          </label>
          <Button disabled={saving} onClick={() => void save('published')}>
            <Send className="mr-2" /> Publish
          </Button>
        </div>
      </div>

      <section className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Main Image</h2>
              <p className="text-sm text-muted-foreground">
                The first image is primary and can be reused by all linked variations.
              </p>
            </div>
            <Badge variant="secondary">Primary media</Badge>
          </div>

          <div
            onDragOver={event => event.preventDefault()}
            onDrop={event => {
              event.preventDefault();
              if (event.dataTransfer.files.length) void uploadFiles(event.dataTransfer.files);
            }}
            className="mt-5 rounded-2xl border border-dashed p-4"
          >
            {mainImage ? (
              <div className="space-y-4">
                <div className="group relative overflow-hidden rounded-2xl border bg-muted">
                  <img
                    src={mainImage}
                    alt={`${product.name || 'Product'} primary image`}
                    className="aspect-square w-full object-cover"
                  />
                  <Badge className="absolute left-3 top-3">Primary</Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="absolute right-3 top-3"
                  >
                    <Pencil className="mr-1 h-4 w-4" /> Edit
                  </Button>
                </div>

                {thumbnailImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {thumbnailImages.map((image, index) => (
                      <div
                        key={`${image}-${index}`}
                        draggable
                        onDragStart={() => setDraggedImage(index + 1)}
                        onDragEnd={() => setDraggedImage(null)}
                        onDragOver={event => event.preventDefault()}
                        onDrop={event => handleDrop(event, index + 1)}
                        className="group relative overflow-hidden rounded-xl border bg-muted"
                      >
                        <img
                          src={image}
                          alt={`${product.name || 'Product'} image ${index + 2}`}
                          className="aspect-square h-full w-full object-cover"
                        />
                        <GripVertical className="absolute bottom-1 left-1 rounded bg-black/60 p-1 text-white" />
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white"
                          onClick={() =>
                            setProduct(current => ({
                              ...current,
                              images: current.images.filter((_, imageIndex) => imageIndex !== index + 1),
                            }))
                          }
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-2xl border bg-muted/40 text-center text-sm text-muted-foreground">
                Upload a main product image to begin linking variations.
              </div>
            )}

            <label className="mt-4 flex cursor-pointer items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-4 py-6 text-center">
              <span>
                <ImagePlus className="mx-auto mb-2 h-6 w-6" />
                <span className="block font-medium">Click to replace or drag &amp; drop</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  JPG, PNG, WebP (max 20MB)
                </span>
                <input
                  className="hidden"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={event => {
                    if (event.target.files) void uploadFiles(event.target.files);
                    event.target.value = '';
                  }}
                />
              </span>
            </label>

            <div className="mt-3 grid gap-2">
              <Button type="button" variant="outline" disabled={product.images.length < 2}>
                <GripVertical className="mr-2 h-4 w-4" /> Reorder gallery
              </Button>
            </div>
          </div>

          {Object.entries(uploading)
            .filter(([name]) => !name.startsWith('variation-'))
            .map(([name, progress]) => (
              <div key={name} className="mt-3 text-sm">
                <div className="flex justify-between">
                  <span className="truncate">{name}</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ))}
        </div>

        <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Variations</h2>
              <p className="text-sm text-muted-foreground">
                Keep each size together with stock and the images shown when that variation is selected.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={toggleSelectAllVariations}>
                {allSelected ? 'Clear selection' : 'Select all'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setProduct(current => ({
                    ...current,
                    sizes: [
                      ...current.sizes,
                      { size: '', stock: 0, lowStockThreshold: 10, images: [] },
                    ],
                  }))
                }
              >
                Add variation
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {product.sizes.map((size, index) => {
              const variationImages = size.images || [];
              const rowPreview = variationImages[0] || mainImage;
              const isSelected = selectedVariations.includes(index);
              const isEditing = editingVariation === index;
              const imageLimitReached = variationImages.length >= MAX_VARIATION_IMAGES;
              const variationUploads = Object.entries(uploading).filter(([name]) =>
                name.startsWith(`variation-${index}-`),
              );

              return (
                <div key={index} className="overflow-hidden rounded-2xl border bg-background">
                  <div className="grid gap-3 p-4 xl:grid-cols-[auto_72px_minmax(160px,1fr)_130px_130px_auto] xl:items-center">
                    <button
                      type="button"
                      onClick={() => toggleVariationSelection(index)}
                      className={`flex h-7 w-7 items-center justify-center rounded-md border ${
                        isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                      }`}
                      aria-label={`Select ${size.size || `variation ${index + 1}`}`}
                    >
                      {isSelected && <CheckCircle2 className="h-4 w-4" />}
                    </button>

                    <div className="overflow-hidden rounded-xl border bg-muted">
                      {rowPreview ? (
                        <img src={rowPreview} alt="Variation preview" className="h-[72px] w-[72px] object-cover" />
                      ) : (
                        <div className="flex h-[72px] w-[72px] items-center justify-center text-[11px] text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>

                    <label className="space-y-1 text-xs font-medium text-muted-foreground">
                      Size / format
                      <Input
                        value={size.size}
                        placeholder="e.g. Standard, A4, Large"
                        onChange={event => updateSize(index, { size: event.target.value })}
                      />
                    </label>

                    <label className="space-y-1 text-xs font-medium text-muted-foreground">
                      Stock
                      <Input
                        type="number"
                        min="0"
                        value={size.stock}
                        onChange={event => updateSize(index, { stock: Number(event.target.value) })}
                      />
                    </label>

                    <label className="space-y-1 text-xs font-medium text-muted-foreground">
                      Low stock at
                      <Input
                        type="number"
                        min="0"
                        value={size.lowStockThreshold ?? 10}
                        onChange={event =>
                          updateSize(index, { lowStockThreshold: Number(event.target.value) })
                        }
                      />
                    </label>

                    <div className="flex flex-wrap items-center gap-2 justify-self-end">
                      <Badge variant={size.stock > 0 ? 'default' : 'secondary'}>
                        {size.stock > 0 ? 'Active' : 'Out of stock'}
                      </Badge>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingVariation(isEditing ? null : index);
                          setSizeLinkPicker(null);
                          setSizeLinkUrl('');
                        }}
                      >
                        <Pencil className="mr-1 h-4 w-4" /> Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setProduct(current => ({
                            ...current,
                            sizes: current.sizes.filter((_, sizeIndex) => sizeIndex !== index),
                          }));
                          setSelectedVariations(current => current.filter(item => item !== index));
                          setEditingVariation(current => (current === index ? null : current));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="border-t bg-muted/20 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">Variation images</p>
                          <p className="text-xs text-muted-foreground">
                            These images are linked only to this variation.
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {variationImages.length}/{MAX_VARIATION_IMAGES} images
                        </Badge>
                      </div>

                      {variationImages.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {variationImages.map((image, imageIndex) => (
                            <div
                              key={`${image}-${imageIndex}`}
                              className="group relative h-20 w-20 overflow-hidden rounded-xl border bg-muted"
                            >
                              <img
                                src={image}
                                alt={`${size.size || 'Variation'} image ${imageIndex + 1}`}
                                className="h-full w-full object-cover"
                              />
                              {imageIndex === 0 && (
                                <Badge className="absolute bottom-1 left-1 text-[9px]">Primary</Badge>
                              )}
                              <button
                                type="button"
                                className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white"
                                onClick={() => removeSizeImage(index, imageIndex)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">
                          No images linked yet. Reuse the main image, upload variation-specific images,
                          or link one from the gallery.
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!mainImage || variationImages.includes(mainImage) || imageLimitReached}
                          onClick={() => appendSizeImage(index, mainImage)}
                        >
                          Use main image
                        </Button>
                        <label className={imageLimitReached ? 'pointer-events-none opacity-50' : 'cursor-pointer'}>
                          <Button type="button" variant="outline" size="sm" asChild disabled={imageLimitReached}>
                            <span>
                              <ImagePlus className="mr-1 h-4 w-4" /> Upload images
                              <input
                                className="hidden"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={event => {
                                  if (event.target.files) void uploadSizeFiles(index, event.target.files);
                                  event.target.value = '';
                                }}
                              />
                            </span>
                          </Button>
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={imageLimitReached}
                          onClick={() => {
                            setSizeLinkPicker(sizeLinkPicker === index ? null : index);
                            setSizeLinkUrl('');
                          }}
                        >
                          <Link2 className="mr-1 h-4 w-4" /> Link image
                        </Button>
                      </div>

                      {sizeLinkPicker === index && (
                        <div className="mt-3 rounded-xl border bg-background p-3">
                          <p className="mb-2 text-xs text-muted-foreground">
                            Pick from main product images or paste another image URL.
                          </p>
                          {product.images.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {product.images.map((productImage, productImageIndex) => {
                                const isLinked = variationImages.includes(productImage);
                                return (
                                  <button
                                    key={`${productImage}-${productImageIndex}`}
                                    type="button"
                                    disabled={isLinked || imageLimitReached}
                                    onClick={() => addSizeImage(index, productImage)}
                                    className={`relative h-12 w-12 overflow-hidden rounded-lg border ${
                                      isLinked ? 'border-primary opacity-50' : 'hover:border-primary'
                                    }`}
                                  >
                                    <img src={productImage} alt="" className="h-full w-full object-cover" />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          <div className="mt-3 flex gap-2">
                            <Input
                              className="h-8 text-xs"
                              value={sizeLinkUrl}
                              onChange={event => setSizeLinkUrl(event.target.value)}
                              placeholder="Paste an image URL..."
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={!sizeLinkUrl.trim() || imageLimitReached}
                              onClick={() => {
                                const url = sizeLinkUrl.trim();
                                if (!url) return;
                                addSizeImage(index, url);
                                setSizeLinkUrl('');
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      )}

                      {variationUploads.map(([name, progress]) => (
                        <div key={name} className="mt-3 text-xs">
                          <div className="flex justify-between gap-3">
                            <span className="truncate">{name.replace(`variation-${index}-`, '')}</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted">
                            <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border bg-muted/10 p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h3 className="font-semibold">Bulk Actions</h3>
                <p className="text-sm text-muted-foreground">
                  Apply changes to multiple variations at once.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={bulkApplyMainImage}>
                  Update images
                </Button>
                <Button type="button" variant="outline" onClick={bulkClearVariationImages}>
                  Clear images
                </Button>
                <Button type="button" variant="destructive" onClick={bulkDeleteSelected}>
                  Delete selected
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card px-5 py-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          All changes are saved when you press Save draft or Publish.
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border bg-muted">
            <Link2 className="h-4 w-4" />
          </span>
          <span>{linkedVariationCount} variation{linkedVariationCount === 1 ? '' : 's'} linked to the main image</span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Product details</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm font-medium md:col-span-2">
                Product name
                <Input
                  value={product.name}
                  maxLength={160}
                  onChange={event => setProduct({ ...product, name: event.target.value })}
                />
              </label>
              <label className="space-y-1 text-sm font-medium">
                Main product section
                <select
                  value={product.category}
                  onChange={event => setProduct({ ...product, category: event.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm font-medium">
                Storefront URL <Badge variant="secondary">Auto</Badge>
                <div className="rounded-lg bg-muted p-3 font-mono text-xs break-all">
                  shop-co/...{' '}
                  <span className="font-medium text-foreground">
                    {slugify(product.name) || 'product-slug'}
                  </span>
                </div>
              </label>
              <label className="space-y-1 text-sm font-medium">
                Price (RM)
                <Input
                  type="number"
                  min="0"
                  value={product.price}
                  onChange={event => setProduct({ ...product, price: Number(event.target.value) })}
                />
              </label>
              <label className="space-y-1 text-sm font-medium">
                Original price (RM)
                <Input
                  type="number"
                  min="0"
                  value={product.originalPrice || 0}
                  onChange={event =>
                    setProduct({ ...product, originalPrice: Number(event.target.value) })
                  }
                />
              </label>
            </div>
            <label className="mt-4 block space-y-1 text-sm font-medium">
              Description
              <Textarea
                value={product.description}
                rows={6}
                onChange={event => setProduct({ ...product, description: event.target.value })}
              />
            </label>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Design Variations</h2>
                <p className="text-sm text-muted-foreground">
                  Product is the same size — each variation is a selectable design with its own name, stock, and mockup images shown on the storefront design grid.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addVariation}>
                <Plus className="mr-2" /> Add variation
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {(product.variations || []).map((variation, variationIndex) => {
                const variationImages = variation.images || [];
                const imageLimitReached = variationImages.length >= MAX_VARIATION_IMAGES;
                return (
                  <div key={variationIndex} className="rounded-xl border p-3">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px_auto]">
                      <Input
                        value={variation.name}
                        placeholder="e.g. Design A, Motif B, Kufi C..."
                        onChange={event => updateVariation(variationIndex, { name: event.target.value })}
                      />
                      <Input
                        type="number"
                        min="0"
                        value={variation.stock}
                        aria-label={`Stock for ${variation.name || `variation ${variationIndex + 1}`}`}
                        onChange={event => updateVariation(variationIndex, { stock: Number(event.target.value) })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariation(variationIndex)}
                      >
                        <X />
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {variationImages.length}/{MAX_VARIATION_IMAGES} images — {variationImages[0] ? variationImages[0] === product.images[0] ? 'using the main image' : `${variationImages.length} linked image${variationImages.length === 1 ? '' : 's'}` : 'no images yet (falls back to the main image)'}
                    </p>
                    <label className="mt-3 block space-y-2 text-sm font-medium">
                      <span className="sr-only">Variation images</span>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span>
                              <ImagePlus className="mr-1" /> Upload
                              <input
                                className="hidden"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={event => {
                                  if (event.target.files) void uploadVariationFiles(variationIndex, event.target.files);
                                  event.target.value = '';
                                }}
                              />
                            </span>
                          </Button>
                        </label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setVariationLinkPicker(variationLinkPicker === variationIndex ? null : variationIndex)}
                        >
                          <Link2 className="mr-1" /> Link image
                        </Button>
                        {product.images.length > 0 && !variationImages.includes(product.images[0]) && !imageLimitReached && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => appendVariationImage(variationIndex, product.images[0])}
                          >
                            Use main image
                          </Button>
                        )}
                      </div>
                      {variationLinkPicker === variationIndex && (
                        <div className="w-full rounded-lg border bg-muted/30 p-2">
                          <p className="mb-2 text-xs text-muted-foreground">
                            Link an image for this variation — pick one already uploaded above or paste a URL.
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {product.images.map(productImage => {
                              const alreadyLinked = variationImages.includes(productImage);
                              return (
                                <button
                                  key={productImage}
                                  type="button"
                                  disabled={alreadyLinked || imageLimitReached}
                                  title={alreadyLinked ? 'Already linked' : 'Use this image for the variation'}
                                  onClick={() => appendVariationImage(variationIndex, productImage)}
                                  className="h-10 w-10 overflow-hidden rounded border border-border transition-colors hover:border-primary disabled:opacity-40"
                                >
                                  <img src={productImage} alt="" className="h-full w-full object-cover" />
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Input
                              className="h-8 text-xs"
                              value={variationLinkUrl}
                              onChange={event => setVariationLinkUrl(event.target.value)}
                              placeholder="Paste an image URL..."
                              aria-label="Variation image URL"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={imageLimitReached}
                              onClick={() => {
                                const url = variationLinkUrl.trim();
                                if (url) {
                                  appendVariationImage(variationIndex, url);
                                  setVariationLinkUrl('');
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      )}
                      {variationImages.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {variationImages.map((image, imageIndex) => (
                            <div key={`${image}-${imageIndex}`} className="group relative h-16 w-16 overflow-hidden rounded-lg border bg-muted">
                              <img
                                src={image}
                                alt={`${variation.name || 'Variation'} image ${imageIndex + 1}`}
                                onError={event => { event.currentTarget.style.display = 'none'; }}
                                className="h-full w-full object-cover"
                              />
                              {imageIndex === 0 && <Badge className="absolute left-1 top-1 text-[9px]">Main</Badge>}
                              <button
                                type="button"
                                className="absolute right-1 top-1 rounded bg-black/70 p-0.5 text-white"
                                onClick={() => removeVariationImage(variationIndex, imageIndex)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </label>
                  </div>
                );
              })}
              {(product.variations || []).length === 0 && (
                <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                  No design variations yet. Add one to show a selectable design grid on the storefront.
                </div>
              )}
            </div>
            {Object.entries(uploading).map(([name, progress]) => (
              <div key={name} className="mt-3 text-sm">
                <div className="flex justify-between">
                  <span className="truncate">{name}</span>
                  <span>{progress}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Details &amp; content</h2>
                <p className="text-sm text-muted-foreground">
                  Shown in the product information panel on the storefront.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-6">
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Specifications
                </h3>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {(
                    ['material', 'frame', 'dimensions', 'weight', 'finish', 'color'] as const
                  ).map(key => (
                    <label key={key} className="space-y-1 text-sm font-medium capitalize">
                      {key}
                      <Input
                        value={product.specifications?.[key] || ''}
                        onChange={event => updateSpec({ [key]: event.target.value })}
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium">Custom fields</p>
                  {Object.entries(product.specifications?.customFields || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Input
                        className="h-8 text-xs"
                        value={key}
                        onChange={event => updateCustomField(key, event.target.value, String(value))}
                      />
                      <Input
                        className="h-8 text-xs"
                        value={String(value)}
                        onChange={event => updateCustomField(key, key, event.target.value)}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeCustomField(key)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-8 text-xs"
                      value={newCustomField.key}
                      onChange={event =>
                        setNewCustomField(current => ({ ...current, key: event.target.value }))
                      }
                      placeholder="Field name"
                    />
                    <Input
                      className="h-8 text-xs"
                      value={newCustomField.value}
                      onChange={event =>
                        setNewCustomField(current => ({ ...current, value: event.target.value }))
                      }
                      placeholder="Value"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!newCustomField.key.trim()}
                      onClick={() => {
                        addCustomField(newCustomField.key, newCustomField.value);
                        setNewCustomField({ key: '', value: '' });
                      }}
                    >
                      Add field
                    </Button>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Included
                </h3>
                <p className="text-sm text-muted-foreground">
                  What the customer receives with the product.
                </p>
                <div className="mt-2 space-y-2">
                  {product.packageContents?.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        className="h-8 text-xs"
                        value={item}
                        onChange={event => updatePackageItem(index, event.target.value)}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removePackageItem(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addPackageItem}>
                    Add item
                  </Button>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Production time
                </h3>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium">
                    Standard days
                    <Input
                      type="number"
                      min="0"
                      value={product.productionTurnaround?.standardDays ?? ''}
                      onChange={event => updateTurnaround({ standardDays: Number(event.target.value) })}
                    />
                  </label>
                  <label className="space-y-1 text-sm font-medium">
                    Express days
                    <Input
                      type="number"
                      min="0"
                      value={product.productionTurnaround?.expressDays ?? ''}
                      onChange={event => updateTurnaround({ expressDays: Number(event.target.value) })}
                    />
                  </label>
                </div>
                <label className="mt-3 block space-y-1 text-sm font-medium">
                  Notes
                  <Textarea
                    rows={2}
                    value={product.productionTurnaround?.notes || ''}
                    onChange={event => updateTurnaround({ notes: event.target.value })}
                  />
                </label>
              </section>

              <label className="mt-6 block space-y-1 text-sm font-medium">
                Warranty
                <Textarea
                  rows={2}
                  value={product.warrantyInfo || ''}
                  onChange={event => setProduct({ ...product, warrantyInfo: event.target.value })}
                  placeholder="e.g. 1 year frame; 6 months banner outdoor"
                />
              </label>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Publishing</h2>
            <label className="mt-4 block space-y-1 text-sm font-medium">
              Status
              <select
                value={product.status || 'draft'}
                onChange={event =>
                  setProduct({
                    ...product,
                    status: event.target.value as 'draft' | 'published',
                  })
                }
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <p className="mt-3 text-xs text-muted-foreground">
              Drafts remain hidden from the storefront and public product API.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Search preview</h2>
            <label className="mt-4 block space-y-1 text-sm font-medium">
              SEO title <span className="font-normal text-muted-foreground">({(product.seoTitle || '').length}/70)</span>
              <Input
                maxLength={70}
                value={product.seoTitle || ''}
                placeholder={product.name}
                onChange={event => setProduct({ ...product, seoTitle: event.target.value })}
              />
            </label>
            <label className="mt-4 block space-y-1 text-sm font-medium">
              SEO description <span className="font-normal text-muted-foreground">({(product.seoDescription || '').length}/160)</span>
              <Textarea
                maxLength={160}
                rows={5}
                value={product.seoDescription || ''}
                placeholder={product.description}
                onChange={event => setProduct({ ...product, seoDescription: event.target.value })}
              />
            </label>
            <div className="mt-4 rounded-lg bg-muted p-3">
              <p className="truncate text-sm text-emerald-700">
                kampungcetak.com/home/shop/{slugify(product.name) || 'product-slug'}
              </p>
              <p className="mt-1 font-medium">{product.seoTitle || product.name || 'Product title'}</p>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                {product.seoDescription || product.description || 'Product description'}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
