import { type ReactNode } from 'react';
import { YStack } from 'tamagui';

interface EditorSidebarProps {
    /** Sidebar content sections */
    children: ReactNode;
    /** Additional className */
    className?: string;
}

/**
 * EditorSidebar Template
 *
 * Container for sidebar content like history actions and export actions.
 * Provides consistent spacing and styling for sidebar content.
 *
 * @example
 * ```tsx
 * <EditorSidebar>
 *   <YStack className="editor-header">
 *     <HistoryActions
 *       isCompact
 *       canUndo={canUndo}
 *       canRedo={canRedo}
 *       onUndo={undo}
 *       onRedo={redo}
 *     />
 *     <ExportActions
 *       isCompact
 *       onSave={handleSave}
 *       onExport={handleExport}
 *     />
 *   </YStack>
 * </EditorSidebar>
 * ```
 */
export function EditorSidebar({ children, className = 'editor-header' }: EditorSidebarProps) {
    return <YStack className={className}>{children}</YStack>;
}
