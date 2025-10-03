import { memo } from 'react';
import { MaterialCommunityIcons, type MaterialCommunityIconsProps } from '@components/icons/MaterialCommunityIcons';

/**
 * Enhanced Icons with Kid-Friendly Decorations
 * These icons add sparkles and other playful elements for the kid theme
 */

interface EnhancedIconProps extends MaterialCommunityIconsProps {
    readonly theme?: 'kid' | 'adult';
    readonly showSparkles?: boolean;
}

export const EnhancedIcon = memo<EnhancedIconProps>(
    ({ theme = 'kid', showSparkles = false, name, size = 20, color = '#0f172a', ...rest }) => {
        const isKidTheme = theme === 'kid';
        const shouldShowSparkles = isKidTheme && showSparkles;

        if (!shouldShowSparkles) {
            return <MaterialCommunityIcons name={name} size={size} color={color} {...rest} />;
        }

        // Kid theme with sparkles
        return (
            <div style={{ position: 'relative', display: 'inline-flex' }}>
                <MaterialCommunityIcons name={name} size={size} color={color} {...rest} />
                {/* Sparkle decorations */}
                <svg
                    style={{
                        position: 'absolute',
                        top: -3,
                        right: -3,
                        pointerEvents: 'none',
                    }}
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                >
                    <path
                        d="M4 0L4.5 3.5L8 4L4.5 4.5L4 8L3.5 4.5L0 4L3.5 3.5L4 0Z"
                        fill="#FFB700"
                        opacity="0.8"
                    />
                </svg>
                <svg
                    style={{
                        position: 'absolute',
                        bottom: -2,
                        left: -2,
                        pointerEvents: 'none',
                    }}
                    width="6"
                    height="6"
                    viewBox="0 0 6 6"
                    fill="none"
                >
                    <path
                        d="M3 0L3.3 2.7L6 3L3.3 3.3L3 6L2.7 3.3L0 3L2.7 2.7L3 0Z"
                        fill="#00D68F"
                        opacity="0.7"
                    />
                </svg>
            </div>
        );
    },
);

EnhancedIcon.displayName = 'EnhancedIcon';

/**
 * Kid-Friendly Icon Variants
 * Specific icon sets optimized for children
 */

export const KidFriendlyDrawIcon = memo<Omit<MaterialCommunityIconsProps, 'name'>>(
    ({ size = 24, color = '#1e5bc6', ...rest }) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...rest}
        >
            {/* Crayon-style pencil */}
            <path d="M4 15.75l.75-3 9-9 3.5 3.5-9 9-3 .75z" fill={color} fillOpacity={0.3} stroke="none" />
            <path d="M4 15.75l-.75 3.75L7 18.75" strokeWidth={2.8} />
            <path d="M12.75 3.75l3.5 3.5" strokeWidth={2.8} />
            <circle cx="14.5" cy="5.5" r="0.8" fill={color} />
            <circle cx="13.5" cy="6.5" r="0.6" fill="#FFB700" opacity="0.8" />
        </svg>
    ),
);

KidFriendlyDrawIcon.displayName = 'KidFriendlyDrawIcon';

export const KidFriendlyShapeIcon = memo<Omit<MaterialCommunityIconsProps, 'name'>>(
    ({ size = 24, color = '#1e5bc6', ...rest }) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...rest}
        >
            {/* Fun shapes */}
            <rect x={5} y={7} width={6} height={6} rx={1.5} fill={color} fillOpacity={0.2} />
            <circle cx={16} cy={10} r={3} fill="none" />
            <polygon points="12 15 9 19 15 19 12 15" fill={color} fillOpacity={0.15} />
        </svg>
    ),
);

KidFriendlyShapeIcon.displayName = 'KidFriendlyShapeIcon';

export const KidFriendlyEraserIcon = memo<Omit<MaterialCommunityIconsProps, 'name'>>(
    ({ size = 24, color = '#c91d55', ...rest }) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...rest}
        >
            {/* Big friendly eraser */}
            <path
                d="M5 15l7.25-7.25a1.5 1.5 0 0 1 2.12 0L19 12.38l-6.25 6.25H8.12a1.5 1.5 0 0 1-1.06-.44L5 17.12a1.5 1.5 0 0 1 0-2.12z"
                fill={color}
                fillOpacity={0.25}
                stroke="none"
            />
            <path d="M5 15l4.5 4.5" strokeWidth={2.8} />
            <path d="M12.25 7.75L19 14.5" strokeWidth={2.8} />
            {/* Sparkle effect */}
            <circle cx="8" cy="13" r="0.8" fill="#FFB700" />
            <circle cx="15" cy="10" r="0.6" fill="#00D68F" />
        </svg>
    ),
);

KidFriendlyEraserIcon.displayName = 'KidFriendlyEraserIcon';

/**
 * Adult-Friendly Professional Icons
 * Clean, minimal variations for professional use
 */

export const ProfessionalDrawIcon = memo<Omit<MaterialCommunityIconsProps, 'name'>>(
    ({ size = 20, color = '#0f172a', ...rest }) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...rest}
        >
            <path d="M4 15.75l.75-3 9-9 3.5 3.5-9 9-3 .75z" fill={color} fillOpacity={0.08} stroke="none" />
            <path d="M4 15.75l-.75 3.75L7 18.75" />
            <path d="M12.75 3.75l3.5 3.5" />
            <path d="M6.5 17l2.5 2.5" />
        </svg>
    ),
);

ProfessionalDrawIcon.displayName = 'ProfessionalDrawIcon';

export const ProfessionalShapeIcon = memo<Omit<MaterialCommunityIconsProps, 'name'>>(
    ({ size = 20, color = '#0f172a', ...rest }) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...rest}
        >
            <rect x={4.5} y={6.5} width={15} height={11} rx={2} />
        </svg>
    ),
);

ProfessionalShapeIcon.displayName = 'ProfessionalShapeIcon';

export const ProfessionalEraserIcon = memo<Omit<MaterialCommunityIconsProps, 'name'>>(
    ({ size = 20, color = '#0f172a', ...rest }) => (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...rest}
        >
            <path
                d="M5 15l7.25-7.25a1.5 1.5 0 0 1 2.12 0L19 12.38l-6.25 6.25H8.12a1.5 1.5 0 0 1-1.06-.44L5 17.12a1.5 1.5 0 0 1 0-2.12z"
                fill={color}
                fillOpacity={0.06}
                stroke="none"
            />
            <path d="M5 15l4.5 4.5" />
            <path d="M12.25 7.75L19 14.5" />
        </svg>
    ),
);

ProfessionalEraserIcon.displayName = 'ProfessionalEraserIcon';
