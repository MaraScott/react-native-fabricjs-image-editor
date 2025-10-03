import { Button, Popover, Slider, Text, YStack } from 'tamagui';
import { MaterialCommunityIcons } from '@atoms/icons/MaterialCommunityIcons';

export interface ZoomControlPopoverProps {
    zoomPercentage: number;
    sliderValue: number[];
    sliderBounds: { min: number; max: number };
    sliderStep: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onSliderChange: (values: number[]) => void;
    iconSize: number;
    iconLarge: number;
}

export function ZoomControlPopover({
    zoomPercentage,
    sliderValue,
    sliderBounds,
    sliderStep,
    onZoomIn,
    onZoomOut,
    onSliderChange,
    iconSize,
    iconLarge,
}: ZoomControlPopoverProps) {
    return (
        <Popover placement="top-end">
            <Popover.Trigger position="absolute" bottom={0} right={0}>
                <Button type="button" aria-label="Zoom" title="Zoom">
                    <MaterialCommunityIcons key="zoom" name="zoom" size={iconLarge} />
                </Button>
            </Popover.Trigger>
            <Popover.Content>
                <Popover.Arrow />
                <YStack
                    gap="$2"
                    padding="$3"
                    alignItems="center"
                    borderRadius={12}
                    borderWidth={1}
                    borderColor="rgba(148, 163, 184, 0.35)"
                    backgroundColor="rgba(15, 23, 42, 0.8)"
                    className="stage-zoom-bar"
                >
                    <Text fontSize={12} fontWeight="600" aria-live="polite">
                        {zoomPercentage}%
                    </Text>
                    <Button
                        type="button"
                        onPress={onZoomIn}
                        aria-label="Zoom in"
                        title="Zoom in"
                        size="$2"
                    >
                        <MaterialCommunityIcons key="plus" name="plus" size={iconSize - 4} />
                    </Button>
                    <Slider
                        value={sliderValue}
                        min={sliderBounds.min}
                        max={sliderBounds.max}
                        step={sliderStep}
                        orientation="vertical"
                        height={200}
                        onValueChange={onSliderChange}
                        aria-label="Zoom level"
                        width={36}
                    >
                        <Slider.Track>
                            <Slider.TrackActive />
                        </Slider.Track>
                        <Slider.Thumb index={0} circular size="$2" />
                    </Slider>
                    <Button
                        type="button"
                        onPress={onZoomOut}
                        aria-label="Zoom out"
                        title="Zoom out"
                        size="$2"
                    >
                        <MaterialCommunityIcons key="minus" name="minus" size={iconSize - 4} />
                    </Button>
                </YStack>
            </Popover.Content>
        </Popover>
    );
}
