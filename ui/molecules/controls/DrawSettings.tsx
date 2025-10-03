import type { ChangeEvent } from 'react';
import { Input, Label, Popover, Slider, YStack } from 'tamagui';

export interface DrawSettingsProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    color: string;
    width: number;
    onColorChange: (color: string) => void;
    onWidthChange: (width: number) => void;
    trigger: React.ReactNode;
}

export function DrawSettings({
    open,
    onOpenChange,
    color,
    width,
    onColorChange,
    onWidthChange,
    trigger,
}: DrawSettingsProps) {
    const handleColorInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        onColorChange(event.target.value);
    };

    const handleWidthChange = (value: number[]) => {
        onWidthChange(value[0]);
    };

    return (
        <Popover size="$5" open={open} onOpenChange={onOpenChange}>
            <Popover.Trigger asChild>{trigger}</Popover.Trigger>
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
                <YStack gap="$3" padding="$3" minWidth={200}>
                    <YStack gap="$2">
                        <Label htmlFor="draw-color">Color</Label>
                        <Input
                            id="draw-color"
                            type="color"
                            value={color}
                            onChange={handleColorInputChange}
                            width="100%"
                        />
                    </YStack>
                    <YStack gap="$2">
                        <Label htmlFor="draw-width">Width: {width}px</Label>
                        <Slider
                            id="draw-width"
                            value={[width]}
                            onValueChange={handleWidthChange}
                            min={1}
                            max={50}
                            step={1}
                            size="$2"
                        >
                            <Slider.Track>
                                <Slider.TrackActive />
                            </Slider.Track>
                            <Slider.Thumb circular index={0} />
                        </Slider>
                    </YStack>
                </YStack>
            </Popover.Content>
        </Popover>
    );
}
