import type { ReactNode } from 'react';
import { Button, XStack, YStack } from 'tamagui';
import { EnhancedIcon } from '@atoms/icons/EnhancedIcons';

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
                <EnhancedIcon key="undo" name="undo" size={iconSize} theme="kid" />
            </Button>
            <Button type="button" onPress={onRedo} disabled={!canRedo} aria-label="Redo" title="Redo">
                <EnhancedIcon key="redo" name="redo" size={iconSize} theme="kid" />
            </Button>
            <Button
                type="button"
                onPress={onCopy}
                disabled={!hasSelection}
                aria-label="Copy"
                title="Copy"
            >
                <EnhancedIcon key="copy" name="copy" size={iconSize} theme="kid" />
            </Button>
            <Button
                type="button"
                onPress={onPaste}
                disabled={!hasClipboard}
                aria-label="Paste"
                title="Paste"
            >
                <EnhancedIcon key="paste" name="paste" size={iconSize} theme="kid" />
            </Button>
            <Button
                type="button"
                onPress={onDuplicate}
                disabled={!hasSelection}
                aria-label="Duplicate"
                title="Duplicate"
            >
                <EnhancedIcon key="duplicate" name="duplicate" size={iconSize} theme="kid" />
            </Button>
            <Button
                type="button"
                onPress={onRemoveSelected}
                disabled={!hasSelection}
                aria-label="Delete"
                title="Delete"
            >
                <EnhancedIcon key="delete" name="delete" size={iconSize} theme="kid" />
            </Button>
            <Button type="button" onPress={onClear} aria-label="Clear canvas" title="Clear canvas">
                <EnhancedIcon key="clear" name="clear" size={iconSize} />
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
                <EnhancedIcon key="save" name="save" size={iconSize} theme="kid" />
            </Button>
            <Button type="button" onPress={onLoad} aria-label="upload" title="upload">
                <EnhancedIcon key="upload" name="upload" size={iconSize} theme="kid" />
            </Button>
            {/* <Button type="button" onPress={() => onExport('png')} aria-label="Export PNG" title="Export PNG">
                <EnhancedIcon key="file-image" name="file-image" size={iconSize} theme="kid" />
            </Button>
            <Button type="button" onPress={() => onExport('jpeg')} aria-label="Export JPEG" title="Export JPEG">
                <EnhancedIcon key="file-jpg-box" name="file-jpg-box" size={iconSize} theme="kid" />
            </Button>
            <Button type="button" onPress={() => onExport('svg')} aria-label="Export SVG" title="Export SVG">
                <EnhancedIcon key="svg" name="svg" size={iconSize} theme="kid" />
            </Button>
            <Button type="button" onPress={() => onExport('json')} aria-label="Export JSON" title="Export JSON">
                <EnhancedIcon key="code-json" name="code-json" size={iconSize} theme="kid" />
            </Button> */}
        </ResponsiveStack>
    );
}
