import type { ReactNode } from 'react';
import { Button, XStack, YStack } from 'tamagui';

import { MaterialCommunityIcons } from '@atoms/icons/MaterialCommunityIcons';
import { KidFriendlyEraserIcon, KidFriendlyUndoIcon, KidFriendlyRedoIcon } from '@atoms/icons/EnhancedIcons';

interface ResponsiveStackProps {
    isCompact: boolean;
    className?: string;
    children: ReactNode;
}

function ResponsiveStack({ isCompact, className, children }: ResponsiveStackProps) {
    const Component = isCompact ? YStack : XStack;
    return <Component className={className}>{children}</Component>;
}

export interface HistoryActionsProps {
    isCompact: boolean;
    canUndo: boolean;
    canRedo: boolean;
    hasSelection: boolean;
    hasClipboard: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onCopy: () => void;
    onPaste: () => void;
    onDuplicate: () => void;
    onRemoveSelected: () => void;
    onClear: () => void;
    iconSize: number;
}

export function HistoryActions({
    isCompact,
    canUndo,
    canRedo,
    hasSelection,
    hasClipboard,
    onUndo,
    onRedo,
    onCopy,
    onPaste,
    onDuplicate,
    onRemoveSelected,
    onClear,
    iconSize,
}: HistoryActionsProps) {
    return (
        <ResponsiveStack isCompact={isCompact} className="toolbar-group">
            <Button type="button" onPress={onUndo} disabled={!canUndo} aria-label="Undo" title="Undo">
                <KidFriendlyUndoIcon key="undo" size={iconSize} />
            </Button>
            <Button type="button" onPress={onRedo} disabled={!canRedo} aria-label="Redo" title="Redo">
                <KidFriendlyRedoIcon key="redo" size={iconSize} />
            </Button>
            <Button
                type="button"
                onPress={onCopy}
                disabled={!hasSelection}
                aria-label="Copy"
                title="Copy"
            >
                <MaterialCommunityIcons key="content-copy" name="content-copy" size={iconSize} />
            </Button>
            <Button
                type="button"
                onPress={onPaste}
                disabled={!hasClipboard}
                aria-label="Paste"
                title="Paste"
            >
                <MaterialCommunityIcons key="content-paste" name="content-paste" size={iconSize} />
            </Button>
            <Button
                type="button"
                onPress={onDuplicate}
                disabled={!hasSelection}
                aria-label="Duplicate"
                title="Duplicate"
            >
                <MaterialCommunityIcons key="content-duplicate" name="content-duplicate" size={iconSize} />
            </Button>
            <Button
                type="button"
                onPress={onRemoveSelected}
                disabled={!hasSelection}
                aria-label="Delete"
                title="Delete"
            >
                <KidFriendlyEraserIcon key="delete" size={iconSize} />
            </Button>
            <Button type="button" onPress={onClear} aria-label="Clear canvas" title="Clear canvas">
                <MaterialCommunityIcons key="eraser-variant" name="eraser-variant" size={iconSize} />
            </Button>
        </ResponsiveStack>
    );
}

export interface ExportActionsProps {
    isCompact: boolean;
    onSave: () => void;
    onLoad: () => void;
    onExport: (format: 'png' | 'jpeg' | 'json' | 'svg') => void;
    iconSize: number;
}

export function ExportActions({ isCompact, onSave, onLoad, onExport, iconSize }: ExportActionsProps) {
    return (
        <ResponsiveStack isCompact={isCompact} className="toolbar-group">
            <Button type="button" onPress={onSave} aria-label="Save" title="Save">
                <MaterialCommunityIcons key="content-save-outline" name="content-save-outline" size={iconSize} />
            </Button>
            <Button type="button" onPress={onLoad} aria-label="Load" title="Load">
                <MaterialCommunityIcons key="folder-open-outline" name="folder-open-outline" size={iconSize} />
            </Button>
            <Button type="button" onPress={() => onExport('png')} aria-label="Export PNG" title="Export PNG">
                <MaterialCommunityIcons key="file-image" name="file-image" size={iconSize} />
            </Button>
            <Button type="button" onPress={() => onExport('jpeg')} aria-label="Export JPEG" title="Export JPEG">
                <MaterialCommunityIcons key="file-jpg-box" name="file-jpg-box" size={iconSize} />
            </Button>
            <Button type="button" onPress={() => onExport('svg')} aria-label="Export SVG" title="Export SVG">
                <MaterialCommunityIcons key="svg" name="svg" size={iconSize} />
            </Button>
            <Button type="button" onPress={() => onExport('json')} aria-label="Export JSON" title="Export JSON">
                <MaterialCommunityIcons key="code-json" name="code-json" size={iconSize} />
            </Button>
        </ResponsiveStack>
    );
}
