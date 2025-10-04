import { Button, Heading, Paragraph, Popover, YStack } from 'tamagui';
import { EnhancedIcon } from '@atoms/icons/EnhancedIcons';
import LayersPanel from '@organisms/editor/LayersPanel';
import type { EditorElement, EditorLayer } from '@types/editor';

export interface LayersPopoverProps {
    layers: EditorLayer[];
    contentElements: EditorElement[];
    activeLayerId: string | null;
    selectedIds: string[];
    onSelectLayer: (layerId: string) => void;
    onToggleVisibility: (layerId: string) => void;
    onToggleLock: (layerId: string) => void;
    onRemoveLayer: (layerId: string) => void;
    onMoveLayer: (layerId: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
    onAddLayer: () => void;
    iconLarge: number;
}

export function LayersPopover({
    layers,
    contentElements,
    activeLayerId,
    selectedIds,
    onSelectLayer,
    onToggleVisibility,
    onToggleLock,
    onRemoveLayer,
    onMoveLayer,
    onAddLayer,
    iconLarge,
}: LayersPopoverProps) {
    return (
        <Popover placement="top-start">
            <Popover.Trigger position="absolute" bottom={0} left={0}>
                <Button type="button" aria-label="Layers" title="Layers">
                    <EnhancedIcon key="layers" name="layers" size={iconLarge} theme="kid" />
                </Button>
            </Popover.Trigger>
            <Popover.Content>
                <Popover.Arrow />
                <YStack>
                    <Heading tag="h2">Layers</Heading>
                    <Paragraph>{layers.length} layers</Paragraph>
                    <LayersPanel
                        layers={layers}
                        elements={contentElements}
                        activeLayerId={activeLayerId}
                        selectedElementIds={selectedIds}
                        onSelectLayer={onSelectLayer}
                        onToggleVisibility={onToggleVisibility}
                        onToggleLock={onToggleLock}
                        onRemoveLayer={onRemoveLayer}
                        onMoveLayer={onMoveLayer}
                        onAddLayer={onAddLayer}
                    />
                </YStack>
            </Popover.Content>
        </Popover>
    );
}
