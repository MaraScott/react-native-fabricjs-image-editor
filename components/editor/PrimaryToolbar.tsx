import { Button, Text, YStack } from 'tamagui';

import { MaterialCommunityIcons } from '../icons/MaterialCommunityIcons';
import type { Tool } from './types';

export interface PrimaryToolbarProps {
    activeTool: Tool;
    onSelectTool: (tool: Tool) => void;
    onAddText: () => void;
    onRequestImage: () => void;
    iconSize: number;
}

export default function PrimaryToolbar({
    activeTool,
    onSelectTool,
    onAddText,
    onRequestImage,
    iconSize,
}: PrimaryToolbarProps) {
    const activeToolLabel = activeTool === 'draw' ? 'Draw' : activeTool === 'pan' ? 'Pan' : 'Select';

    return (
        <YStack className="editor-toolbar">
            <YStack className="toolbar-group">
                <Button
                    type="button"
                    className={activeTool === 'select' ? 'active' : ''}
                    onPress={() => onSelectTool('select')}
                    aria-label="Select"
                    title="Select"
                >
                    <MaterialCommunityIcons key="cursor-default" name="cursor-default" size={iconSize} />
                </Button>
                <Button
                    type="button"
                    className={activeTool === 'pan' ? 'active' : ''}
                    onPress={() => onSelectTool('pan')}
                    aria-label="Pan"
                    title="Pan"
                >
                    <MaterialCommunityIcons key="hand-back-right-outline" name="hand-back-right-outline" size={iconSize} />
                </Button>
                <Button
                    type="button"
                    className={activeTool === 'draw' ? 'active' : ''}
                    onPress={() => onSelectTool('draw')}
                    aria-label="Draw"
                    title="Draw"
                >
                    <MaterialCommunityIcons key="pencil-outline" name="pencil-outline" size={iconSize} />
                </Button>
            </YStack>
            <Text className="active-tool-status" aria-live="polite">
                Active tool: {activeToolLabel}
            </Text>
            <YStack className="toolbar-group">
                <Button type="button" onPress={onAddText} aria-label="Add text" title="Add text">
                    <MaterialCommunityIcons key="format-text" name="format-text" size={iconSize} />
                </Button>
                <Button type="button" onPress={onRequestImage} aria-label="Add image" title="Add image">
                    <MaterialCommunityIcons key="image-outline" name="image-outline" size={iconSize} />
                </Button>
            </YStack>
        </YStack>
    );
}
