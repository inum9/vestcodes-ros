import { useEffect, useRef, useState } from 'react';
import { fetchTableQrBlob } from '@/lib/manager-api';
import { cn } from '@/lib/utils';

type QrPreviewProps = {
  tableId: number;
  size?: 'sm' | 'md';
};

export default function QrPreview({ tableId, size = 'md' }: QrPreviewProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setFailed(false);
      setSrc(null);
      try {
        const blob = await fetchTableQrBlob(tableId);
        if (cancelled) return;
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setSrc(url);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [tableId]);

  const boxClass = size === 'sm' ? 'h-24' : 'h-36';
  const imgClass = size === 'sm' ? 'h-24 w-24' : 'h-36 w-36';

  if (failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-app-surface px-1 text-center text-xs text-warning-dark',
          boxClass,
        )}
      >
        QR failed — check login & backend
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-app-surface text-xs text-app-text-muted',
          boxClass,
        )}
      >
        Loading…
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Table ${tableId} QR code`}
      className={cn('mx-auto rounded-xl border border-app-border bg-white', imgClass)}
    />
  );
}
