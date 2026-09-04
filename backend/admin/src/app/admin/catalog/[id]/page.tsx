import { ProductEditor } from '@/components/catalog/ProductEditor';

export default async function CatalogProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditor productId={id} />;
}
