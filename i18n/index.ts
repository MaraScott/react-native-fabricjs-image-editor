import en from '@i18n/en.json';
import fr from '@i18n/fr.json';

export type Language = 'en' | 'fr';
type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = {
    en,
    fr,
};

const resolvedLanguagePrefixes: Array<{ prefix: string; language: Language }> = [
    { prefix: 'en', language: 'en' },
    { prefix: 'fr', language: 'fr' },
];

const fallbackLanguage: Language = 'fr';

export const resolveLanguage = (lang?: string | Language | null): Language => {
    if (!lang) {
        return fallbackLanguage;
    }
    const normalized = String(lang).trim().toLowerCase().replace(/_/g, '-');
    for (const { prefix, language } of resolvedLanguagePrefixes) {
        if (normalized === prefix || normalized.startsWith(`${prefix}-`)) {
            return language;
        }
    }
    return fallbackLanguage;
};

export const translate = (lang: Language, key: string, params?: Record<string, string | number>): string => {
    const dict = dictionaries[lang] ?? dictionaries.en;
    const template = dict[key] ?? dictionaries.en[key] ?? key;
    if (!params) return template;
    return Object.entries(params).reduce((acc, [k, v]) => acc.replace(new RegExp(`{{${k}}}`, 'g'), String(v)), template);
};
