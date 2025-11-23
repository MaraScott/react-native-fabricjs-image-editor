import { useEffect, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';

interface ImageLayerNodeProps {
    src: string;
}

export const ImageLayerNode = ({ src }: ImageLayerNodeProps) => {
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!src) {
            setImage(null);
            return;
        }

        let mounted = true;
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            if (mounted) {
                setImage(img);
            }
        };
        img.src = src;

        return () => {
            mounted = false;
        };
    }, [src]);

    return (
        <KonvaImage
            key={`image-${src}`}
            image={image}
            listening={false}
        />
    );
};
