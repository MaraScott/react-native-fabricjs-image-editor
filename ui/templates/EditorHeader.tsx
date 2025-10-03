import { type ReactNode } from 'react';
import { Image, Text, XStack } from 'tamagui';

interface EditorHeaderProps {
    /** Application logo URL */
    logoUrl?: string;
    /** Application title */
    title?: string;
    /** Theme switcher component */
    themeSwitcher?: ReactNode;
    /** Left side actions (e.g., history, export for desktop) */
    leftActions?: ReactNode;
    /** Right side actions */
    rightActions?: ReactNode;
    /** Show logo and title */
    showBranding?: boolean;
    /** Show left actions (desktop only typically) */
    showLeftActions?: boolean;
}

/**
 * EditorHeader Template
 *
 * Provides the header bar for the editor with:
 * - Branding (logo + title)
 * - Theme switcher
 * - Action buttons (history, export, etc.)
 *
 * Responsive: Can hide certain elements on mobile
 *
 * @example
 * ```tsx
 * <EditorHeader
 *   logoUrl="https://example.com/logo.png"
 *   title="TinyArtist Editor"
 *   themeSwitcher={<ThemeSwitcher />}
 *   leftActions={
 *     <>
 *       <HistoryActions />
 *       <ExportActions />
 *     </>
 *   }
 *   showBranding={true}
 *   showLeftActions={!isMobile}
 * />
 * ```
 */
export function EditorHeader({
    logoUrl = 'https://raw.githubusercontent.com/Everduin94/react-native-vector-icons/master/assets/images/TinyArtist.png',
    title = 'TinyArtist Editor',
    themeSwitcher,
    leftActions,
    rightActions,
    showBranding = true,
    showLeftActions = true,
}: EditorHeaderProps) {
    return (
        <>
            {/* Branding */}
            {showBranding ? (
                <XStack className="logo" alignItems="center" gap="$2">
                    <Image src={logoUrl} alt={`${title} logo`} width="40" height="40" />
                    <Text>{title}</Text>
                </XStack>
            ) : null}

            {/* Theme Switcher */}
            {themeSwitcher}

            {/* Left Actions */}
            {showLeftActions && leftActions ? <XStack gap="$2">{leftActions}</XStack> : null}

            {/* Right Actions */}
            {rightActions ? <XStack gap="$2">{rightActions}</XStack> : null}
        </>
    );
}
