'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCcw, RotateCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Ratio = 'original' | 'square' | 'landscape' | 'portrait';

export function ImageEditorDialog({
  imageUrl,
  productName,
  saving,
  onClose,
  onSave,
}: {
  imageUrl: string;
  productName: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (file: File) => void;
}) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [ratio, setRatio] = useState<Ratio>('original');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    setImageReady(false);
    setZoom(1);
    setRotation(0);
  }, [imageUrl]);

  const save = () => {
    const image = imageRef.current;
    if (!image || !imageReady) return;
    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const angle = ((rotation % 360) + 360) % 360;
    const rotatedWidth = angle === 90 || angle === 270 ? sourceHeight : sourceWidth;
    const rotatedHeight = angle === 90 || angle === 270 ? sourceWidth : sourceHeight;
    const targetRatio = ratio === 'square' ? 1 : ratio === 'landscape' ? 4 / 3 : ratio === 'portrait' ? 3 / 4 : rotatedWidth / rotatedHeight;
    let cropWidth = rotatedWidth;
    let cropHeight = cropWidth / targetRatio;
    if (cropHeight > rotatedHeight) {
      cropHeight = rotatedHeight;
      cropWidth = cropHeight * targetRatio;
    }
    cropWidth /= zoom;
    cropHeight /= zoom;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(cropWidth));
    canvas.height = Math.max(1, Math.round(cropHeight));
    const context = canvas.getContext('2d');
    if (!context) return;
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((angle * Math.PI) / 180);
    context.scale(zoom, zoom);
    context.drawImage(image, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);
    canvas.toBlob(blob => {
      if (blob) onSave(new File([blob], `${productName || 'product'}-edited.jpg`, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  };

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
    <Card className="w-full max-w-3xl">
      <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle>Edit image · {productName}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Crop, rotate, and zoom before saving this product image.</p></div><Button variant="ghost" size="icon" onClick={onClose}><X /></Button></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-xl bg-muted p-4"><img ref={imageRef} src={imageUrl} alt={`${productName} preview`} onLoad={() => setImageReady(true)} className="max-h-[55vh] max-w-full object-contain" style={{ transform: `rotate(${rotation}deg) scale(${zoom})` }} /></div>
        <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-medium">Crop</span>{([['original', 'Original'], ['square', 'Square'], ['landscape', '4:3'], ['portrait', '3:4']] as const).map(([value, label]) => <Button key={value} size="sm" variant={ratio === value ? 'default' : 'outline'} onClick={() => setRatio(value)}>{label}</Button>)}<Button size="sm" variant="outline" onClick={() => setRotation(value => value - 90)}><RotateCcw className="mr-1 h-4 w-4" /> Rotate</Button><Button size="sm" variant="outline" onClick={() => setRotation(value => value + 90)}><RotateCw className="mr-1 h-4 w-4" /> Rotate</Button></div>
        <label className="block text-sm font-medium">Zoom <input className="ml-3 align-middle" type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={event => setZoom(Number(event.target.value))} /></label>
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!imageReady || saving} onClick={save}>{saving ? 'Saving...' : 'Save edited image'}</Button></div>
      </CardContent>
    </Card>
  </div>;
}
