import en from '@i18n/en.json';
import fr from '@i18n/fr.json';

export type Language = 'en' | 'fr';
type Dictionary = Record<string, string>;

const dictionaries: Record<Language, Dictionary> = {
    en,
    fr,
};

export const translate = (lang: Language, key: string, params?: Record<string, string | number>): string => {
    const dict = dictionaries[lang] ?? dictionaries.en;
    const template = dict[key] ?? dictionaries.en[key] ?? key;
    if (!params) return template;
    return Object.entries(params).reduce((acc, [k, v]) => acc.replace(new RegExp(`{{${k}}}`, 'g'), String(v)), template);
};
