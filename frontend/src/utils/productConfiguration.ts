import { IProduct } from "@/types/IProduct";

export function getDesignNumber(configuration = ""): number | null {
  const match = configuration.match(/Design:\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

export function getConfiguredProductImage(product: IProduct, configuration = ""): string {
  const designNumber = getDesignNumber(configuration);
  const imageIndex = designNumber ? designNumber - 1 : 0;
  return product.images[imageIndex] || product.images[0] || "/placeholder.svg";
}

export function getConfigurationParts(configuration = ""): string[] {
  return configuration.split("|").map((part) => part.trim()).filter(Boolean);
}
