import { IProduct } from "@/types/IProduct";
import { ICartItem, IProductConfiguration } from "@/types/ICart";

export function getDesignNumber(configuration = ""): number | null {
  const match = configuration.match(/Design:\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

export function getConfiguredProductImage(product: IProduct, configuration = "", structured?: IProductConfiguration): string {
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
  return [item.configuration.fulfillmentSize, ...selections, item.configuration.design?.label]
    .filter((part): part is string => Boolean(part));
}

export function getCartUnitPrice(item: ICartItem): number {
  return item.unitPrice ?? item.product.price;
}

export function getCartLineTotal(item: ICartItem): number {
  return item.lineTotal ?? getCartUnitPrice(item) * item.quantity + (item.fixedPrice ?? 0);
}
