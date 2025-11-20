/**
 * Atomic Design - Organism: BackgroundLayer
 * 
 * Combines FullContainerBackground and StageMimic in a single Layer for performance
 */

import { FullContainerBackground, StageMimic } from '@molecules/Layer/Stage/_BackgroundLayer';
import { Layer as KonvaLayer } from '@atoms/Canvas';

/**
 * BackgroundLayer component props
 */
export interface BackgroundLayerProps {
    containerWidth: number;
    containerHeight: number;
    containerBackground: string;
    stageViewportOffsetX: number;
    stageViewportOffsetY: number;
    stageWidth: number;
    stageHeight: number;
}

/**
 * BackgroundLayer component
 * 
 * Renders the background layer containing the full container background
 * and stage mimic. Combined for performance optimization.
 * 
 * @param {BackgroundLayerProps} props - Component props
 * @returns {JSX.Element} Layer with background elements
 */
export const BackgroundLayer = ({
    containerWidth,
    containerHeight,
    containerBackground,
    stageViewportOffsetX,
    stageViewportOffsetY,
    stageWidth,
    stageHeight,
}: BackgroundLayerProps) => {
    return (
        <KonvaLayer listening={false}>
            <FullContainerBackground
                key="canvas-background"
                width={containerWidth}
                height={containerHeight}
                fill={containerBackground}
            />
            <StageMimic
                key="canvas-cutout"
                x={stageViewportOffsetX}
                y={stageViewportOffsetY}
                width={stageWidth}
                height={stageHeight}
            />
        </KonvaLayer>

    );
};
