
export interface HeaderLeftProps {
    key?: string;
    width: number;
    height: number;
    theme: 'kid' | 'adult';
    onThemeChange?: (theme: 'kid' | 'adult') => void;
}

export const HeaderLeft = ({ width, height, theme, onThemeChange }: HeaderLeftProps) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
                <h1 key={`header-left-title`} style={{ margin: 0 }}>
                    TinyArtist Editor
                </h1>
                <p key={`header-left-tag-line`} style={{ margin: 0 }}>
                    Let's DreamDraw - {width}x{height}px canvas
                </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label htmlFor="theme-select" style={{ fontSize: 12, fontWeight: 600 }}>
                    Theme
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
                    <option value="kid">Warm Kid</option>
                    <option value="adult">Adult</option>
                </select>
            </div>
        </div>
    );
};
