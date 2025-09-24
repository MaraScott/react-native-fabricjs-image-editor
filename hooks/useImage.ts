import { useEffect, useState } from 'react';

type ImageConfig = { crossOrigin?: string; referrerPolicy?: string };

type UseImageResult = [HTMLImageElement | null, 'loading' | 'loaded' | 'failed'];

export function useImage(src: string | null, config: ImageConfig = {}): UseImageResult {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>(src ? 'loading' : 'loaded');

  useEffect(() => {
    if (!src) {
      setImage(null);
      setStatus('loaded');
      return undefined;
    }

    let cancelled = false;
    const img = new Image();

    if (config.crossOrigin) {
      img.crossOrigin = config.crossOrigin;
    }

    if (config.referrerPolicy) {
      img.referrerPolicy = config.referrerPolicy;
    }

    img.onload = () => {
      if (cancelled) return;
      setImage(img);
      setStatus('loaded');
    };

    img.onerror = () => {
      if (cancelled) return;
      setImage(null);
      setStatus('failed');
    };

    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src, config.crossOrigin, config.referrerPolicy]);

  return [image, status];
}

export default useImage;
