import { Button, Text, XStack } from 'tamagui';

import type { EditorTheme } from '../../types/editor';

interface ThemeSwitcherProps {
    value: EditorTheme;
    onChange: (theme: EditorTheme) => void;
}

const THEME_OPTIONS: Array<{ value: EditorTheme; label: string }> = [
    { value: 'kid', label: 'Kid' },
    { value: 'adult', label: 'Adult' },
];

export default function ThemeSwitcher({ value, onChange }: ThemeSwitcherProps) {
    return (
        <XStack className="theme-switcher" alignItems="center" gap="$2">
            <Text className="theme-switcher__label">Theme</Text>
            <XStack className="theme-switcher__options" gap="$2">
                {THEME_OPTIONS.map((option) => {
                    const isActive = option.value === value;
                    return (
                        <Button
                            key={option.value}
                            size="$2"
                            className={`theme-switcher__button${isActive ? ' active' : ''}`}
                            aria-pressed={isActive}
                            onPress={() => {
                                if (!isActive) {
                                    onChange(option.value);
                                }
                            }}
                        >
                            {option.label}
                        </Button>
                    );
                })}
            </XStack>
        </XStack>
    );
}
