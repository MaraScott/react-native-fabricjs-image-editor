import { useCallback, useEffect, useMemo, useState } from 'react';

export interface TinyArtistMediaSize {
    url: string;
    width?: number;
    height?: number;
}

export interface TinyArtistMediaItem {
    id: number;
    title?: string;
    file?: string;
    sizes?: Record<string, TinyArtistMediaSize>;
}

export interface WordPressConfig {
    restUrl: string;
    nonce: string;
    username?: string;
    userMedia?: TinyArtistMediaItem[];
}

export type PartialWordPressConfig = Partial<WordPressConfig> & {
    restUrl?: string;
    nonce?: string;
    userMedia?: TinyArtistMediaItem[];
};

export interface NormalizedMediaItem {
    id: number;
    title: string;
    url: string;
    previewUrl: string;
    width?: number;
    height?: number;
    sizes: Record<string, TinyArtistMediaSize>;
}

function normalizeRestUrl(restUrl?: string | null): string {
    if (!restUrl) {
        return '';
    }
    return restUrl.endsWith('/') ? restUrl : `${restUrl}/`;
}

export function extractWpConfig(source: any): PartialWordPressConfig | null {
    if (!source || typeof source !== 'object') {
        return null;
    }

    const restUrl: string | undefined =
        source.restUrl || source.rest_url || source.root || source.apiRoot;
    const nonce: string | undefined =
        source.nonce || source.wpApiNonce || source.wp_rest?.nonce || source.apiNonce;
    const username: string | undefined =
        source.username || source.current_user || source.currentUser || source.user_login;
    const userMedia: TinyArtistMediaItem[] | undefined = Array.isArray(source.user_media)
        ? source.user_media
        : undefined;

    if (!restUrl || !nonce) {
        return null;
    }

    return {
        restUrl: normalizeRestUrl(restUrl),
        nonce,
        username,
        userMedia,
    } satisfies PartialWordPressConfig;
}

function mergeWpConfig(base: WordPressConfig | null, incoming: PartialWordPressConfig | null): WordPressConfig | null {
    if (!incoming) {
        return base;
    }

    const restUrl = incoming.restUrl ? normalizeRestUrl(incoming.restUrl) : base?.restUrl;
    const nonce = incoming.nonce ?? base?.nonce;

    if (!restUrl || !nonce) {
        return base;
    }

    const username = incoming.username ?? base?.username;
    const userMedia = incoming.userMedia ?? base?.userMedia;

    if (
        base &&
        base.restUrl === restUrl &&
        base.nonce === nonce &&
        base.username === username &&
        base.userMedia === userMedia
    ) {
        return base;
    }

    return {
        restUrl,
        nonce,
        username,
        userMedia,
    };
}

export function mapUserMediaToOptions(list?: TinyArtistMediaItem[] | null): NormalizedMediaItem[] {
    if (!Array.isArray(list)) {
        return [];
    }

    return list
        .filter((item) => {
            if (!item || typeof item !== 'object') {
                return false;
            }
            const { id, file, sizes } = item;
            return typeof id === 'number' && (typeof file === 'string' || sizes);
        })
        .map((item) => {
            const { id, title, file, sizes } = item;
            const safeSizes = sizes && typeof sizes === 'object' ? sizes : {};
            const thumbnailSize = safeSizes.thumbnail || safeSizes.medium || safeSizes.full;
            const fullSize = safeSizes.full || safeSizes.large || safeSizes.medium;

            return {
                id,
                title: typeof title === 'string' ? title : `Media ${id}`,
                url: fullSize?.url || file || '',
                previewUrl: thumbnailSize?.url || fullSize?.url || file || '',
                width: fullSize?.width,
                height: fullSize?.height,
                sizes: safeSizes,
            };
        });
}

export function resolveInitialWpConfig(): WordPressConfig | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const sources = [
        (window as any).tinyArtistEditor,
        (window as any).wpApiSettings,
        (window as any).wpData,
        (window as any).__EDITOR_BOOTSTRAP__,
    ].filter(Boolean);

    let result: WordPressConfig | null = null;

    for (const source of sources) {
        const partial = extractWpConfig(source);
        result = mergeWpConfig(result, partial);
    }

    return result;
}

export interface UseWordPressIntegrationReturn {
    wpConfig: WordPressConfig | null;
    wpMedia: NormalizedMediaItem[];
    isMediaLoading: boolean;
    mediaError: string | null;
    hasWpCredentials: boolean;
    applyWpConfig: (incoming: PartialWordPressConfig | null | undefined) => void;
    refreshUserMedia: () => Promise<void>;
}

export function useWordPressIntegration(initialConfig: WordPressConfig | null = null): UseWordPressIntegrationReturn {
    const [wpConfig, setWpConfig] = useState<WordPressConfig | null>(initialConfig);
    const [wpMedia, setWpMedia] = useState<NormalizedMediaItem[]>(() =>
        mapUserMediaToOptions(initialConfig?.userMedia),
    );
    const [isMediaLoading, setMediaLoading] = useState(false);
    const [mediaError, setMediaError] = useState<string | null>(null);

    const hasWpCredentials = Boolean(wpConfig?.restUrl && wpConfig?.nonce);

    const applyWpConfig = useCallback((incoming: PartialWordPressConfig | null | undefined) => {
        if (!incoming) {
            return;
        }
        setWpConfig((current) => {
            const next = mergeWpConfig(current, incoming);
            if (next && (next !== current || next.userMedia !== current?.userMedia)) {
                setWpMedia(mapUserMediaToOptions(next.userMedia));
            }
            return next;
        });
    }, []);

    const refreshUserMedia = useCallback(async () => {
        if (!wpConfig?.restUrl || !wpConfig.nonce) {
            return;
        }
        setMediaLoading(true);
        setMediaError(null);
        try {
            const response = await fetch(`${wpConfig.restUrl}marascott/v1/ta-var`, {
                headers: { 'X-WP-Nonce': wpConfig.nonce },
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            applyWpConfig({
                restUrl: data?.rest_url ?? wpConfig.restUrl,
                nonce: data?.nonce ?? wpConfig.nonce,
                username: data?.username ?? data?.current_user ?? wpConfig.username,
                userMedia: Array.isArray(data?.user_media) ? data.user_media : undefined,
            });
        } catch (error) {
            console.error('Failed to fetch WordPress media', error);
            setMediaError(error instanceof Error ? error.message : String(error));
        } finally {
            setMediaLoading(false);
        }
    }, [applyWpConfig, wpConfig]);

    return {
        wpConfig,
        wpMedia,
        isMediaLoading,
        mediaError,
        hasWpCredentials,
        applyWpConfig,
        refreshUserMedia,
    };
}
