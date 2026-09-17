import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { photobookCoverTemplates } from '@/components/diy/photobookCoverTemplates';

export const dynamic = 'force-dynamic';

export async function GET() {
  const raw = await readFile(path.join(process.cwd(), 'public', 'templates', 'photo-canvas', 'library', 'manifest.json'), 'utf8');
  const photoCanvas = JSON.parse(raw).map((template: any) => ({ ...template, kind: 'photo-canvas' }));
  const photobook = (Object.entries(photobookCoverTemplates) as Array<[string, any[]]>).flatMap(([size, templates]) =>
    templates.map((template) => ({
      ...template,
      id: `photobook-${size.toLowerCase()}-${template.id.toLowerCase()}`,
      kind: 'photobook-cover',
      bookSize: size,
      width: size === 'A5' ? 150 : 105,
      height: size === 'A5' ? 213 : 151,
      size: `${size} photobook`,
    })),
  );
  return NextResponse.json({ templates: [...photoCanvas, ...photobook] }, {
    headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' },
  });
}
