import { IProductConfiguration } from '../../domain/interfaces/cart.interface';
import { IProduct } from '../../domain/interfaces/product.interface';
import { DESIGN_SERVICE_FEE } from '../pricing/product-pricing.service';

const variationFor = (product: IProduct, index: number) => {
  const image = product.images[index];
  if (!image) throw new Error('Selected design is not available for this product');

  const pathParts = image.split('/').filter(Boolean);
  const folder = pathParts[pathParts.length - 2] || product.name;
  const filename = (pathParts[pathParts.length - 1] || `variation-${index + 1}`).replace(/\.[^.]+$/, '');
  const sequence = filename.match(/(\d+)$/)?.[1] || String(index + 1).padStart(2, '0');
  const productCode = folder
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();

  return {
    variantId: `${String(product.catalogId || (product as any)._id || productCode)}:${filename.toLowerCase()}`,
    variantLabel: `${productCode}-M${sequence.padStart(2, '0')}`,
    variantImage: image,
  };
};

export const normalizeProductConfiguration = (
  product: IProduct,
  configuration: IProductConfiguration,
  fulfillmentSize: string
): IProductConfiguration => {
  const productOptions = product.printingOptions || [];
  const incomingSelections = configuration.selections || [];
  const incomingOptionNames = new Set<string>();
  for (const selection of incomingSelections) {
    if (!productOptions.some((option) => option.name === selection.name)) {
      throw new Error(`Invalid product option: ${selection.name}`);
    }
    if (incomingOptionNames.has(selection.name)) throw new Error(`Duplicate product option: ${selection.name}`);
    incomingOptionNames.add(selection.name);
  }

  const selections = productOptions.flatMap((option) => {
    const selection = incomingSelections.find((candidate) => candidate.name === option.name);
    if (!selection) {
      if (!option.isMultiSelect && option.options.length > 0) {
        throw new Error(`A valid ${option.name} selection is required`);
      }
      return [];
    }

    const values = (selection.values || []).map((selected) => {
      const value = option.options.find((candidate) => candidate.label === selected.label);
      if (!value) throw new Error(`Invalid ${option.name} selection`);
      return { label: value.label, priceAdd: Number(value.priceAdd) || 0 };
    });
    const distinctLabels = new Set(values.map((value) => value.label));
    if ((!option.isMultiSelect && values.length !== 1) || distinctLabels.size !== values.length) {
      throw new Error(`A valid ${option.name} selection is required`);
    }
    return values.length ? [{ name: option.name, values }] : [];
  });

  let design = configuration.design;
  if (design?.type === 'variation') {
    if (!Number.isInteger(design.variationIndex) || (design.variationIndex as number) < 0) {
      throw new Error('A valid design selection is required');
    }
    const variation = variationFor(product, design.variationIndex as number);
    design = {
      type: 'variation',
      label: variation.variantLabel,
      priceAdd: 0,
      variationIndex: design.variationIndex,
      image: variation.variantImage,
      ...variation,
    };
  } else if (design?.type === 'service') {
    design = { type: 'service', label: 'Need Design Service', priceAdd: DESIGN_SERVICE_FEE };
  } else if (design?.type === 'upload') {
    design = { type: 'upload', label: 'Upload Artwork', priceAdd: 0 };
  }
  if (product.category.toLowerCase() === 'islamic khat' && product.images.length > 1 && design?.type !== 'variation') {
    throw new Error('A valid design selection is required');
  }

  return {
    version: 1,
    fulfillmentSize,
    selections,
    design,
  };
};
