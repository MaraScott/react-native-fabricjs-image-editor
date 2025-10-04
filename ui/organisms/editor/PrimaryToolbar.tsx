import { Button, Text, YStack } from 'tamagui';

import { EnhancedIcon } from '@atoms/icons/EnhancedIcons';
import type { Tool } from '@organisms/editor/types';

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
    const activeToolLabel =
        activeTool === 'draw' ? 'Draw' :
        activeTool === 'rubber' ? 'Rubber' :
        activeTool === 'pan' ? 'Pan' :
        activeTool === 'crop' ? 'Crop' :
        'Select';

    return (
        <YStack className="editor-toolbar">
            <Text className="active-tool-status" aria-live="polite">
                Active tool: {activeToolLabel}
            </Text>
            <YStack className="toolbar-group">
                <Button
                    type="button"
                    className={activeTool === 'select' ? 'active' : ''}
                    onPress={() => onSelectTool('select')}
                    aria-label="Select"
                    title="Select"
                >
                    <EnhancedIcon key="select" name="select" size={iconSize} theme="kid" />
                </Button>
                <Button
                    type="button"
                    className={activeTool === 'pan' ? 'active' : ''}
                    onPress={() => onSelectTool('pan')}
                    aria-label="Pan"
                    title="Pan"
                >
                    <EnhancedIcon key="pan" name="pan" size={iconSize} theme="kid" />
                </Button>
                <Button
                    type="button"
                    className={activeTool === 'draw' ? 'active' : ''}
                    onPress={() => onSelectTool('draw')}
                    aria-label="draw"
                    title="draw"
                >
                    <EnhancedIcon key="paint" name="paint" size={iconSize} theme="kid" />
                </Button>
                <Button
                    type="button"
                    className={activeTool === 'rubber' ? 'active' : ''}
                    onPress={() => onSelectTool('rubber')}
                    aria-label="rubber"
                    title="rubber"
                >
                    <EnhancedIcon key="rubber" name="rubber" size={iconSize} theme="kid" />
                </Button>
                <Button
                    type="button"
                    className={activeTool === 'crop' ? 'active' : ''}
                    onPress={() => onSelectTool('crop')}
                    aria-label="Crop"
                    title="Crop"
                >
                    <EnhancedIcon key="crop" name="crop" size={iconSize} theme="kid" />
                </Button>
                <Button type="button" onPress={onAddText} aria-label="Add text" title="Add text">
                    <EnhancedIcon key="text" name="text" size={iconSize} theme="kid" />
                </Button>
                <Button type="button" onPress={onRequestImage} aria-label="Add image" title="Add image">
                    <EnhancedIcon key="image" name="image" size={iconSize} theme="kid" />
                </Button>
            </YStack>
        </YStack>
    );
}
