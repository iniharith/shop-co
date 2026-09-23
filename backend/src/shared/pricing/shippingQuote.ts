export type ShippingCartItem = { size: string; quantity: number };

// Keep in sync with the customer checkout estimate until parcel dimensions come from the catalog.
export function estimateCartWeight(items: ShippingCartItem[]): number {
  const sizes: Record<string, number> = { A3: 0.12474, A4: 0.06237, A5: 0.03108, A6: 0.01554 };
  let weight = 0.2;
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new Error('Invalid cart quantity');
    const name = String(item.size || '').toUpperCase();
    const area = Object.entries(sizes).find(([size]) => name.includes(size))?.[1] ?? 0.06237;
    weight += item.quantity * 128 * area / 1000;
  }
  return Math.max(1, Number(weight.toFixed(2)));
}

export function selectCheapestShippingQuote(groups: unknown): { price: number; courier: string } | null {
  if (!Array.isArray(groups)) return null;
  const quotes = groups.flatMap((group: any) => Array.isArray(group?.quotations) ? group.quotations : Array.isArray(group) ? group : [group]);
  let best: { price: number; courier: string } | null = null;
  for (const quote of quotes) {
    const raw = quote?.pricing?.total_amount ?? quote?.pricing?.shipment_price ?? quote?.price ?? quote?.total_amount ?? quote?.shipping_price;
    if (typeof raw !== 'number' && (typeof raw !== 'string' || !raw.trim())) continue;
    const price = Number(raw);
    if (!Number.isFinite(price) || price < 0) continue;
    const courier = String(quote?.courier?.courier_name || quote?.courier?.service_name || quote?.courier_name || '');
    if (!best || price < best.price) best = { price, courier };
  }
  return best;
}

export function matchesQuotedShippingPrice(submitted: unknown, quoted: number): boolean {
  return typeof submitted === 'number' && Number.isFinite(submitted)
    && Math.round(submitted * 100) === Math.round(quoted * 100);
}

export class ShippingQuoteChangedError extends Error {
  constructor() {
    super('Shipping price changed. Please review the updated total and try again.');
    this.name = 'ShippingQuoteChangedError';
  }
}
