import { type ReactNode } from 'react';
import { XStack, YStack, Theme } from 'tamagui';
import {
    SidebarContainer,
    SidebarPanel,
    SidebarScroll,
    SidebarToggle,
    SidebarToggleLabel,
    SidebarContent,
} from '@tinyartist/theme/ui/styles';

interface EditorLayoutProps {
    /** Theme name for sidebars */
    sidebarTheme: string;
    /** Left sidebar content */
    leftSidebar?: ReactNode;
    /** Whether left sidebar is open */
    leftSidebarOpen: boolean;
    /** Toggle left sidebar */
    onLeftSidebarToggle: () => void;
    /** Sidebar width when open */
    sidebarWidth: number;
    /** Collapsed width */
    collapsedWidth: number;
    /** Show sidebar toggle button */
    showSidebarToggle?: boolean;
    /** Header content */
    header: ReactNode;
    /** Main content area */
    children: ReactNode;
    /** Main layout width */
    mainLayoutWidth?: number | string;
}

/**
 * EditorLayout Template
 *
 * Provides the main layout structure for the editor with:
 * - Collapsible left sidebar
 * - Header area
 * - Main content area
 *
 * @example
 * ```tsx
 * <EditorLayout
 *   sidebarTheme="sapphire"
 *   leftSidebar={<MySidebarContent />}
 *   leftSidebarOpen={isOpen}
 *   onLeftSidebarToggle={() => setIsOpen(!isOpen)}
 *   sidebarWidth={300}
 *   collapsedWidth={40}
 *   showSidebarToggle={true}
 *   header={<EditorHeader />}
 *   mainLayoutWidth="100%"
 * >
 *   <MyMainContent />
 * </EditorLayout>
 * ```
 */
export function EditorLayout({
    sidebarTheme,
    leftSidebar,
    leftSidebarOpen,
    onLeftSidebarToggle,
    sidebarWidth,
    collapsedWidth,
    showSidebarToggle = false,
    header,
    children,
    mainLayoutWidth = '100%',
}: EditorLayoutProps) {
    return (
        <YStack>
            {/* Left Sidebar */}
            <Theme name={sidebarTheme} key={`theme-${sidebarTheme}`}>
                <SidebarContainer left={0}>
                    {leftSidebarOpen && leftSidebar ? (
                        <SidebarPanel width={sidebarWidth} padding="0">
                            <SidebarScroll>
                                <SidebarContent>{leftSidebar}</SidebarContent>
                            </SidebarScroll>
                        </SidebarPanel>
                    ) : null}
                    {showSidebarToggle ? (
                        <SidebarToggle
                            onPress={onLeftSidebarToggle}
                            width={collapsedWidth}
                            backgroundColor="$backgroundHover"
                        >
                            <SidebarToggleLabel color="$color10">
                                {leftSidebarOpen ? '◀' : '▶'}
                            </SidebarToggleLabel>
                        </SidebarToggle>
                    ) : null}
                </SidebarContainer>
            </Theme>

            {/* Main Content Area */}
            <YStack className="editor-shell">
                {/* Header */}
                <XStack className="editor-header" zIndex={1} overflow="visible">
                    {header}
                </XStack>

                {/* Main Content */}
                <XStack width={mainLayoutWidth} className="editor-shell-layout" zIndex={0}>
                    {children}
                </XStack>
            </YStack>
        </YStack>
    );
}
