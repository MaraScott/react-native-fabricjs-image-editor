
import * as i18n from '@i18n';

export interface HeaderLeftProps {
    key?: string;
    width: number;
    height: number;
    theme: 'kid' | 'adult';
    language: i18n.Language;
    onThemeChange?: (theme: 'kid' | 'adult') => void;
    onLanguageChange?: (lang: i18n.Language) => void;
}

export const HeaderLeft = ({ width, height, theme, language, onThemeChange, onLanguageChange }: HeaderLeftProps) => {
    const t = (key: string) => i18n.translate(language, key, { width, height });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
                <h1 key={`header-left-title`} style={{ margin: 0 }}>
                    {t('headerTitle')}
                </h1>
                <p key={`header-left-tag-line`} style={{ margin: 0 }}>
                    {t('headerSubtitle')}
                </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label htmlFor="theme-select" style={{ fontSize: 12, fontWeight: 600 }}>
                    {t('themeLabel')}
                </label>
                <select
                    id="theme-select"
                    value={theme}
                    onChange={(e) => onThemeChange?.(e.target.value as 'kid' | 'adult')}
                    style={{
                        borderRadius: 6,
                        padding: '4px 6px',
                        border: '1px solid #e5e7eb',
                        fontSize: 12,
                    }}
                >
                    <option value="kid">Kid</option>
                    <option value="adult">Adult</option>
                </select>

                <label htmlFor="lang-select" style={{ fontSize: 12, fontWeight: 600 }}>
                    {t('languageLabel')}
                </label>
                <select
                    id="lang-select"
                    value={language}
                    onChange={(e) => onLanguageChange?.(e.target.value as i18n.Language)}
                    style={{
                        borderRadius: 6,
                        padding: '4px 6px',
                        border: '1px solid #e5e7eb',
                        fontSize: 12,
                    }}
                >
                    <option value="en">EN</option>
                    <option value="fr">FR</option>
                </select>
            </div>
        </div>
    );
};
