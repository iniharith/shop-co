import { IProduct } from "@/types/IProduct";
import { ICartItem, IProductConfiguration } from "@/types/ICart";

export interface ProductVariation {
  variantId: string;
  variantLabel: string;
  variantImage: string;
}

export function getProductVariation(product: IProduct, index: number): ProductVariation {
  const image = product.images[index] || product.images[0] || "/placeholder.svg";
  const pathParts = image.split("/").filter(Boolean);
  const folder = pathParts[pathParts.length - 2] || product.name;
  const filename = (pathParts[pathParts.length - 1] || `variation-${index + 1}`).replace(/\.[^.]+$/, "");
  const sequence = filename.match(/(\d+)$/)?.[1] || String(index + 1).padStart(2, "0");
  const productCode = folder
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase();
  const variantLabel = `${productCode}-M${sequence.padStart(2, "0")}`;

  return {
    variantId: `${product._id}:${filename.toLowerCase()}`,
    variantLabel,
    variantImage: image,
  };
}

export function getDesignNumber(configuration = ""): number | null {
  const match = configuration.match(/Design:\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

export function getConfiguredProductImage(product: IProduct, configuration = "", structured?: IProductConfiguration): string {
  if (structured?.design?.variantImage) return structured.design.variantImage;
  if (structured?.design?.image) return structured.design.image;
  const designNumber = getDesignNumber(configuration);
  const imageIndex = designNumber ? designNumber - 1 : 0;
  return product.images[imageIndex] || product.images[0] || "/placeholder.svg";
}

export function getConfigurationParts(configuration = ""): string[] {
  return configuration.split("|").map((part) => part.trim()).filter(Boolean);
}

export function getStructuredConfigurationParts(item: Pick<ICartItem, "size" | "configuration">): string[] {
  if (!item.configuration) return getConfigurationParts(item.size);
  const selections = item.configuration.selections.flatMap((selection) =>
    selection.values.map((value) => `${selection.name}: ${value.label}`)
  );
  const designLabel = item.configuration.design?.variantLabel || item.configuration.design?.label;
  return [item.configuration.fulfillmentSize, ...selections, designLabel]
    .filter((part): part is string => Boolean(part));
}

export function getCartUnitPrice(item: ICartItem): number {
  return item.unitPrice ?? item.product.price;
}

export function getCartLineTotal(item: ICartItem): number {
  return item.lineTotal ?? getCartUnitPrice(item) * item.quantity + (item.fixedPrice ?? 0);
}
