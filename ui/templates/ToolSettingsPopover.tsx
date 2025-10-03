import type { ChangeEvent, ReactNode } from 'react';
import { Button, Heading, Label, Paragraph, Popover, Slider, Text, XStack, YStack } from 'tamagui';
import { MaterialCommunityIcons } from '@atoms/icons/MaterialCommunityIcons';
import type { Tool } from '@organisms/editor/types';

export interface ToolSettingsPopoverProps {
    activeTool: Tool;
    toolSettingsOpen: boolean;
    onToolSettingsOpenChange: (open: boolean) => void;
    drawSettings: { color: string; width: number };
    onDrawSettingsChange: (updates: Partial<{ color: string; width: number }>) => void;
    cropState: any;
    onCropApply: () => void;
    onCropCancel: () => void;
    layerSelectionInteractive: boolean;
    layerSelectionRectRef: any;
    onLayerSelectionTransformStart: () => void;
    onLayerSelectionTransform: (bounds: any) => void;
    onLayerSelectionTransformEnd: () => void;
    commitLayerSelectionBounds: (node: any) => any;
    iconLarge: number;
}

export function ToolSettingsPopover({
    activeTool,
    toolSettingsOpen,
    onToolSettingsOpenChange,
    drawSettings,
    onDrawSettingsChange,
    cropState,
    onCropApply,
    onCropCancel,
    layerSelectionInteractive,
    layerSelectionRectRef,
    onLayerSelectionTransformStart,
    onLayerSelectionTransform,
    onLayerSelectionTransformEnd,
    commitLayerSelectionBounds,
    iconLarge,
}: ToolSettingsPopoverProps) {
    return (
        <Popover placement="bottom-start" open={toolSettingsOpen} onOpenChange={onToolSettingsOpenChange}>
            <Popover.Trigger position="absolute" top={0} left={0}>
                <Button type="button" aria-label="tool" title="tool">
                    <MaterialCommunityIcons key="tool" name="tool" size={iconLarge} />
                </Button>
            </Popover.Trigger>
            <Popover.Content top={0} left={0}>
                <Popover.Arrow />
                <YStack className="tool-stats editor-sidebar">
                    <YStack tag="aside">
                        <Heading tag="h2">
                            {activeTool === 'draw'
                                ? 'Draw settings'
                                : activeTool === 'pan'
                                    ? 'Pan mode'
                                    : activeTool === 'crop'
                                        ? 'Crop mode'
                                        : 'Selection'}
                        </Heading>
                        {activeTool === 'crop' ? (
                            <YStack gap="$3" paddingTop="$3">
                                <Paragraph fontSize={12} color="rgba(226, 232, 240, 0.65)">
                                    Click on an image to start cropping. Adjust the crop area and click Apply to crop the image.
                                </Paragraph>
                                {cropState ? (
                                    <XStack gap="$2">
                                        <Button type="button" onPress={onCropApply} flex={1}>
                                            Apply Crop
                                        </Button>
                                        <Button type="button" onPress={onCropCancel} flex={1}>
                                            Cancel
                                        </Button>
                                    </XStack>
                                ) : null}
                            </YStack>
                        ) : activeTool === 'draw' ? (
                            <YStack gap="$3" paddingTop="$3">
                                <XStack alignItems="center" gap="$3">
                                    <Label htmlFor="draw-color" flex={1}>
                                        Stroke color
                                    </Label>
                                    <input
                                        id="draw-color"
                                        type="color"
                                        aria-label="Stroke color"
                                        value={drawSettings.color}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                            onDrawSettingsChange({ color: event.target.value })
                                        }
                                        style={{
                                            width: 44,
                                            height: 44,
                                            padding: 0,
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                        }}
                                    />
                                </XStack>
                                <YStack gap="$2">
                                    <XStack alignItems="center" justifyContent="space-between">
                                        <Label htmlFor="draw-width">Stroke width</Label>
                                        <Text fontSize={12} fontWeight="600">
                                            {Math.round(drawSettings.width)} px
                                        </Text>
                                    </XStack>
                                    <Slider
                                        id="draw-width"
                                        value={[drawSettings.width]}
                                        min={1}
                                        max={64}
                                        step={1}
                                        onValueChange={(value) => {
                                            const width = value[0] ?? drawSettings.width;
                                            onDrawSettingsChange({ width });
                                        }}
                                        aria-label="Stroke width"
                                    >
                                        <Slider.Track>
                                            <Slider.TrackActive />
                                        </Slider.Track>
                                        <Slider.Thumb index={0} circular size="$2" />
                                    </Slider>
                                </YStack>
                            </YStack>
                        ) : activeTool === 'pan' ? (
                            <Paragraph paddingTop="$3" fontSize={12} color="rgba(226, 232, 240, 0.65)">
                                Drag anywhere on the canvas to scroll. Use a trackpad pinch, touch gesture, or mouse wheel to zoom in and out.
                            </Paragraph>
                        ) : (
                            <YStack gap="$3" paddingTop="$3">
                                <Paragraph fontSize={12} color="rgba(226, 232, 240, 0.65)">
                                    Use the layer resize tool below to scale the active selection. Hold Ctrl/Cmd/Alt to select a single element, Shift to toggle.
                                </Paragraph>
                                <Button
                                    type="button"
                                    disabled={!layerSelectionInteractive}
                                    onPress={() => {
                                        if (layerSelectionInteractive && layerSelectionRectRef.current) {
                                            onLayerSelectionTransformStart();
                                            const rect = layerSelectionRectRef.current;
                                            const bounds = commitLayerSelectionBounds(rect);
                                            onLayerSelectionTransform(bounds);
                                            onLayerSelectionTransformEnd();
                                        }
                                    }}
                                >
                                    {layerSelectionInteractive ? 'Resize selection' : 'Layer locked'}
                                </Button>
                            </YStack>
                        )}
                    </YStack>
                </YStack>
            </Popover.Content>
        </Popover>
    );
}
