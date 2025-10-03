import { Button, Input, Label, Popover, Slider, Stack, Text, XStack, YStack } from 'tamagui';
import { MaterialCommunityIcons } from '../../components/icons/MaterialCommunityIcons';

export interface ZoomControlsProps {
    zoom: number;
    zoomPercentage: number;
    sliderValue: number[];
    sliderBounds: { min: number; max: number };
    sliderStep: number;
    onZoomChange: (zoom: number) => void;
    onZoomToFit: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onSliderChange: (value: number[]) => void;
    iconSize?: number;
}

export function ZoomControls({
    zoom,
    zoomPercentage,
    sliderValue,
    sliderBounds,
    sliderStep,
    onZoomChange,
    onZoomToFit,
    onZoomIn,
    onZoomOut,
    onSliderChange,
    iconSize = 12,
}: ZoomControlsProps) {
    return (
        <XStack className="zoom-controls" gap="$2" alignItems="center">
            <Button
                size="$2"
                onPress={onZoomOut}
                icon={<MaterialCommunityIcons name="minus" size={iconSize} />}
                aria-label="Zoom out"
            />
            <Popover size="$5" placement="top">
                <Popover.Trigger asChild>
                    <Button size="$2" className="zoom-display">
                        <Text fontSize="$2">{zoomPercentage}%</Text>
                    </Button>
                </Popover.Trigger>
                <Popover.Content
                    borderWidth={1}
                    borderColor="$borderColor"
                    enterStyle={{ y: -10, opacity: 0 }}
                    exitStyle={{ y: -10, opacity: 0 }}
                    elevate
                    animation={[
                        'quick',
                        {
                            opacity: {
                                overshootClamping: true,
                            },
                        },
                    ]}
                >
                    <Popover.Arrow borderWidth={1} borderColor="$borderColor" />
                    <YStack gap="$3" padding="$3" width={200}>
                        <Label htmlFor="zoom-slider">Zoom Level</Label>
                        <Slider
                            id="zoom-slider"
                            value={sliderValue}
                            onValueChange={onSliderChange}
                            min={sliderBounds.min}
                            max={sliderBounds.max}
                            step={sliderStep}
                            size="$2"
                        >
                            <Slider.Track>
                                <Slider.TrackActive />
                            </Slider.Track>
                            <Slider.Thumb circular index={0} />
                        </Slider>
                        <Button size="$2" onPress={onZoomToFit}>
                            Fit to Window
                        </Button>
                    </YStack>
                </Popover.Content>
            </Popover>
            <Button
                size="$2"
                onPress={onZoomIn}
                icon={<MaterialCommunityIcons name="plus" size={iconSize} />}
                aria-label="Zoom in"
            />
        </XStack>
    );
}
