'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, BarChart3, Eye, PackageSearch, RefreshCw, TrendingUp, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCatalogAnalytics } from '@/api/catalog';
import { resolveImages } from '@/utils/productImage';

type Product = { _id: string; name: string; category: string; viewCount?: number; unitsSold?: number; revenue?: number; size?: string; stock?: number; lowStockThreshold?: number; updatedAt?: string; images?: string[]; status?: string; updatedBy?: string };
type Analytics = { mostViewed: Product[]; bestSelling: Product[]; zeroSales: Product[]; lowStock: Product[]; recentlyUpdated: Product[] };
const emptyAnalytics: Analytics = { mostViewed: [], bestSelling: [], zeroSales: [], lowStock: [], recentlyUpdated: [] };

const ProductRows = ({ products, metric, renderMeta }: { products: Product[]; metric: (product: Product) => string; renderMeta?: (product: Product) => React.ReactNode }) => <div className="divide-y">{products.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No data yet.</p> : products.map(product => <Link key={`${product._id}-${product.size || ''}`} href={`/admin/catalog/${product._id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50">{product.images && product.images[0] ? <img src={product.images[0]} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" /> : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">{product.name.charAt(0).toUpperCase()}</div>}<span className="min-w-0 flex-1"><span className="block truncate font-medium">{product.name}</span><span className="block truncate text-xs text-muted-foreground">{product.category}{product.size ? ` / ${product.size}` : ''}</span>{renderMeta && <span className="mt-0.5 block">{renderMeta(product)}</span>}</span><span className="shrink-0 text-sm font-semibold">{metric(product)}</span></Link>)}</div>;

export default function CatalogAnalyticsPage() {
  const { data: session } = useSession();
  const token = session?.user?.token || '';
  const [data, setData] = useState<Analytics>(emptyAnalytics);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const raw = await getCatalogAnalytics(token);
      const resolve = (arr: Product[]) => (arr || []).map(p => ({ ...p, images: resolveImages(p.images) }));
      setData({ ...emptyAnalytics, mostViewed: resolve(raw.mostViewed), bestSelling: resolve(raw.bestSelling), zeroSales: resolve(raw.zeroSales), lowStock: resolve(raw.lowStock), recentlyUpdated: resolve(raw.recentlyUpdated) });
    }
    catch (error: any) { toast.error(error?.response?.data?.message || 'Could not load catalog analytics'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [token]);
  const recentlyUpdatedMeta = (product: Product) => (
    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      {product.updatedBy && <span>by {product.updatedBy}</span>}
      {product.status && <Badge variant={product.status === 'published' ? 'default' : 'secondary'} className="px-1.5 py-0 text-[10px] leading-tight">{product.status}</Badge>}
    </span>
  );
  const cards = [
    { title: 'Most viewed', icon: Eye, products: data.mostViewed, metric: (product: Product) => `${product.viewCount || 0} views` },
    { title: 'Best selling', icon: TrendingUp, products: data.bestSelling, metric: (product: Product) => `${product.unitsSold || 0} sold` },
    { title: 'Zero sales', icon: PackageSearch, products: data.zeroSales, metric: () => 'No sales' },
    { title: 'Low stock', icon: TriangleAlert, products: data.lowStock, metric: (product: Product) => `${product.stock || 0} left` },
    { title: 'Recently updated', icon: RefreshCw, products: data.recentlyUpdated, metric: (product: Product) => product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : '', renderMeta: recentlyUpdatedMeta },
  ];
  return <main className="space-y-6 p-4 md:p-8"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><Button asChild variant="ghost" size="sm" className="-ml-3"><Link href="/admin/catalog"><ArrowLeft className="mr-1" /> Catalog</Link></Button><p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Catalog / Analytics</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Catalog performance</h1><p className="mt-2 text-sm text-muted-foreground">Use product demand and inventory signals to prioritize stock and merchandising.</p></div><Button variant="outline" disabled={loading} onClick={() => void load()}><RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh</Button></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{cards.map(({ title, icon: Icon, products, metric, renderMeta }) => <Card key={title}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-base">{title}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent className="p-0"><ProductRows products={products} metric={metric} renderMeta={renderMeta} /></CardContent></Card>)}</div><Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Summary</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-3"><Badge variant="outline">{data.mostViewed.reduce((total, product) => total + Number(product.viewCount || 0), 0)} tracked views</Badge><Badge variant="outline">{data.bestSelling.reduce((total, product) => total + Number(product.unitsSold || 0), 0)} units sold in top products</Badge><Badge variant={data.lowStock.length ? 'destructive' : 'outline'}>{data.lowStock.length} low-stock sizes</Badge></CardContent></Card></main>;
}
