import { useDispatch } from 'react-redux';
import { useEffect, useRef, useState, useMemo } from 'react';
import { viewActions } from '@store/CanvasApp/view';
import { useSimpleCanvasStore } from '@store/SimpleCanvas';
import type { Language } from '@i18n';
import { translate } from '@i18n';

/**
 * SideBarLeftProps Interface
 * 
 * Type definition for SideBarLeftProps.
 */
export interface SideBarLeftProps {
    key?: string;
    isPanToolActive: boolean;
    isSelectToolActive: boolean;
    isDrawToolActive: boolean;
    isRubberToolActive: boolean;
    isTextToolActive: boolean;
    isPaintToolActive: boolean;
    language?: Language;
}

/**
 * SideBarLeft Component
 * 
 * Renders the SideBarLeft component.
 */
export const SideBarLeft = (props: SideBarLeftProps) => {

    const { isPanToolActive, isSelectToolActive, isDrawToolActive, isRubberToolActive, isTextToolActive, isPaintToolActive, language = 'en' } = props;

  const dispatch = useDispatch();
    const layerControls = useSimpleCanvasStore((state) => state.layerControls);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [theme, setTheme] = useState<'kid' | 'adult'>('kid');
    const iconSrc = useMemo(() => {
        const base = './assets/public/img';
        return {
            pan: `${base}/tinyartist-icon-pan.png`,
            select: `${base}/tinyartist-icon-layer.png`,
            draw: `${base}/tinyartist-icon-pencil.png`,
            paint: `${base}/tinyartist-icon-paint.png`,
            erase: `${base}/tinyartist-icon-eraser.png`,
            text: `${base}/tinyartist-icon-text.png`,
            picture: `${base}/tinyartist-icon-picture.png`,
        };
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const layout = document.querySelector('.canvas-layout');
        if (layout?.classList.contains('adult')) {
            setTheme('adult');
        } else {
            setTheme('kid');
        }
    }, []);

    const togglePanTool = () => {
        if (isPanToolActive) {
            dispatch(viewActions.setActiveTool('select'));
        } else {
            dispatch(viewActions.setActiveTool('pan'));
        }
    };

    const toggleSelectTool = () => {
        if (isSelectToolActive) {
            dispatch(viewActions.setActiveTool('pan'));
        } else {
            dispatch(viewActions.setActiveTool('select'));
        }
    };

    const toggleDrawTool = () => {
        if (isDrawToolActive) {
            dispatch(viewActions.setActiveTool('select'));
        } else {
            dispatch(viewActions.setActiveTool('draw'));
        }
    };

    const toggleRubberTool = () => {
        if (isRubberToolActive) {
            dispatch(viewActions.setActiveTool('select'));
        } else {
            dispatch(viewActions.setActiveTool('rubber'));
        }
    };

    const togglePaintTool = () => {
        if (isPaintToolActive) {
            dispatch(viewActions.setActiveTool('select'));
        } else {
            dispatch(viewActions.setActiveTool('paint'));
        }
    };

    const toggleTextTool = () => {
        if (isTextToolActive) {
            dispatch(viewActions.setActiveTool('select'));
        } else {
            dispatch(viewActions.setActiveTool('text'));
        }
    };

    const handleAddImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !layerControls?.addImageLayer) return;
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') {
                layerControls.addImageLayer(result);
                dispatch(viewActions.setActiveTool('select'));
            }
            event.target.value = '';
        };
        reader.readAsDataURL(file);
    };

    const t = useMemo(() => (key: string) => translate(language, key), [language]);

    return (
        <div
            className="sidebar left"
        >
            <button
                key="button-pan"
                type="button"
                onClick={togglePanTool}
                className={`pan ${isPanToolActive ? 'active' : null}`}
                aria-pressed={isPanToolActive}
                aria-label={t('pan')}
                title={t('pan')}
            >
                <img width="44px" key="pan-icon" aria-hidden="true" src={iconSrc.pan} alt="Pan" />
                {/* <span key="pan-label">Pan</span> */}
            </button>

            <button
                key="button-select"
                type="button"
                className={`select ${isSelectToolActive ? 'active' : null}`}
                onClick={toggleSelectTool}
                aria-pressed={isSelectToolActive}
                aria-label={t('select')}
                title={t('select')}
            >
                <img width="44px" key="select-icon" aria-hidden="true" src={iconSrc.select} alt="Select" />
                {/* <span key="select-label">Select</span> */}
            </button>

            <button
                key="button-draw"
                type="button"
                className={`draw ${isDrawToolActive ? 'active' : null}`}
                onClick={toggleDrawTool}
                aria-pressed={isDrawToolActive}
                aria-label={t('draw')}
                title={t('draw')}
            >
                <img width="44px" key="draw-icon" aria-hidden="true" src={iconSrc.draw} alt="Draw" />
                {/* <span key="draw-label">Draw</span> */}
            </button>

            <button
                key="button-paint"
                type="button"
                className={`paint ${isPaintToolActive ? 'active' : null}`}
                onClick={togglePaintTool}
                aria-pressed={isPaintToolActive}
                aria-label={t('paint')}
                title={t('paint')}
            >
                <img width="44px" key="paint-icon" aria-hidden="true" src={iconSrc.paint} alt="Paint" />
                {/* <span key="paint-label">Paint</span> */}
            </button>

            <button
                key="button-erase"
                type="button"
                className={`erase ${isRubberToolActive ? 'active' : null}`}
                onClick={toggleRubberTool}
                aria-pressed={isRubberToolActive}
                aria-label={t('erase')}
                title={t('erase')}
            >
                <img width="44px" key="erase-icon" aria-hidden="true" src={iconSrc.erase} alt="Erase" />
                {/* <span key="erase-label">Erase</span> */}
            </button>

            <button
                key="button-text"
                type="button"
                className={`text ${isTextToolActive ? 'active' : null}`}
                onClick={toggleTextTool}
                aria-pressed={isTextToolActive}
                aria-label={t('text')}
                title={t('text')}
            >
                <img width="44px" key="text-icon" aria-hidden="true" src={iconSrc.text} alt="Text" />
                {/* <span key="text-label">Text</span> */}
            </button>

            <button
                key="button-add-image"
                type="button"
            className="add-image"
            onClick={handleAddImageClick}
            aria-label={t('picture')}
            title={t('picture')}
            disabled={!layerControls?.addImageLayer}
        >
                <img width="44px" key="add-image-icon" aria-hidden="true" src={iconSrc.picture} alt="Picture" />
                {/* <span key="add-image-label">Picture</span> */}
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
            />
        </div>
    )
};  
