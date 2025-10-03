import { Button, Heading, Input, Label, Popover, XStack, YStack } from 'tamagui';
import { MaterialCommunityIcons } from '@atoms/icons/MaterialCommunityIcons';

export interface CanvasSettingsPopoverProps {
    displayWidth: number;
    displayHeight: number;
    backgroundColor: string;
    canvasSizeDisabled: boolean;
    onCanvasWidthChange: (value: number) => void;
    onCanvasHeightChange: (value: number) => void;
    onCanvasBackgroundChange: (value: string) => void;
    iconLarge: number;
}

export function CanvasSettingsPopover({
    displayWidth,
    displayHeight,
    backgroundColor,
    canvasSizeDisabled,
    onCanvasWidthChange,
    onCanvasHeightChange,
    onCanvasBackgroundChange,
    iconLarge,
}: CanvasSettingsPopoverProps) {
    return (
        <Popover placement="bottom-end">
            <Popover.Trigger position="absolute" top={0} right={0}>
                <Button type="button" aria-label="cog" title="cog">
                    <MaterialCommunityIcons key="cog" name="cog" size={iconLarge} />
                </Button>
            </Popover.Trigger>
            <Popover.Content top={0} right={0}>
                <Popover.Arrow />
                <YStack>
                    <XStack>
                        <Heading tag="h2">Canvas</Heading>
                    </XStack>
                    <XStack>
                        <YStack className="canvas-stats">
                            <XStack gap="$2">
                                <Label>Width</Label>
                                <Input
                                    size="$2"
                                    min={100}
                                    value={displayWidth}
                                    onChange={(event) => onCanvasWidthChange(Number(event.target.value))}
                                    disabled={canvasSizeDisabled}
                                />
                            </XStack>
                            <XStack gap="$2">
                                <Label>Height</Label>
                                <Input
                                    size="$2"
                                    min={100}
                                    value={displayHeight}
                                    onChange={(event) => onCanvasHeightChange(Number(event.target.value))}
                                    disabled={canvasSizeDisabled}
                                />
                            </XStack>
                            <XStack gap="$2">
                                <Label className="full-width">Background</Label>
                                <Input
                                    size="$2"
                                    value={backgroundColor}
                                    onChange={(event) => onCanvasBackgroundChange(event.target.value)}
                                />
                            </XStack>
                        </YStack>
                    </XStack>
                </YStack>
            </Popover.Content>
        </Popover>
    );
}
