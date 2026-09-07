const storefrontUrl = 'https://kampungcetak.com';
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export function resolveImageUrl(image: string | null | undefined): string {
  if (!image) return '';
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  if (image.startsWith('/images/')) return `${storefrontUrl}${encodeURI(image)}`;
  if (image.startsWith('/') && backendUrl) return `${backendUrl}${encodeURI(image)}`;
  return image;
}

export function resolveImages(images?: (string | null | undefined)[] | null): string[] {
  return (images || []).map(resolveImageUrl).filter(Boolean);
}