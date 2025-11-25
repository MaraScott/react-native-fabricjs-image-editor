import { useDispatch } from 'react-redux';
import { useRef } from 'react';
import { viewActions } from '@store/CanvasApp/view';
import { useSimpleCanvasStore } from '@store/SimpleCanvas';

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
}

/**
 * SideBarLeft Component
 * 
 * Renders the SideBarLeft component.
 */
export const SideBarLeft = (props: SideBarLeftProps) => {

    const { isPanToolActive, isSelectToolActive, isDrawToolActive, isRubberToolActive, isTextToolActive, isPaintToolActive } = props;

  const dispatch = useDispatch();
    const layerControls = useSimpleCanvasStore((state) => state.layerControls);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

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
                aria-label={isPanToolActive ? 'Disable pan tool' : 'Enable pan tool'}
                title={isPanToolActive ? 'Pan tool active' : 'Enable pan tool'}
            >
                <span key="pan-icon" aria-hidden="true">
                    {'\u270B'}
                </span>
                <span key="pan-label">Pan</span>
            </button>

            <button
                key="button-select"
                type="button"
                className={`select ${isSelectToolActive ? 'active' : null}`}
                onClick={toggleSelectTool}
                aria-pressed={isSelectToolActive}
                aria-label={isSelectToolActive ? 'Disable select tool' : 'Enable select tool'}
                title={isSelectToolActive ? 'Select tool active' : 'Enable select tool'}
            >
                <span key="select-icon" aria-hidden="true">
                    {'\u261D'}
                </span>
                <span key="select-label">Select</span>
            </button>

            <button
                key="button-draw"
                type="button"
                className={`draw ${isDrawToolActive ? 'active' : null}`}
                onClick={toggleDrawTool}
                aria-pressed={isDrawToolActive}
                aria-label={isDrawToolActive ? 'Disable pen tool' : 'Enable pen tool'}
                title={isDrawToolActive ? 'Pen tool active' : 'Enable pen tool'}
            >
                <span key="draw-icon" aria-hidden="true">
                    {'\u270F'}
                </span>
                <span key="draw-label">Pen</span>
            </button>

            <button
                key="button-paint"
                type="button"
                className={`paint ${isPaintToolActive ? 'active' : null}`}
                onClick={togglePaintTool}
                aria-pressed={isPaintToolActive}
                aria-label={isPaintToolActive ? 'Disable paint tool' : 'Enable paint tool'}
                title={isPaintToolActive ? 'Paint tool active' : 'Enable paint tool'}
            >
                <span key="paint-icon" aria-hidden="true">
                    🎨
                </span>
                <span key="paint-label">Paint</span>
            </button>

            <button
                key="button-erase"
                type="button"
                className={`erase ${isRubberToolActive ? 'active' : null}`}
                onClick={toggleRubberTool}
                aria-pressed={isRubberToolActive}
                aria-label={isRubberToolActive ? 'Disable eraser tool' : 'Enable eraser tool'}
                title={isRubberToolActive ? 'Eraser tool active' : 'Enable eraser tool'}
            >
                <span key="erase-icon" aria-hidden="true">
                    {'🧽'}
                </span>
                <span key="erase-label">Erase</span>
            </button>

            <button
                key="button-text"
                type="button"
                className={`text ${isTextToolActive ? 'active' : null}`}
                onClick={toggleTextTool}
                aria-pressed={isTextToolActive}
                aria-label={isTextToolActive ? 'Disable text tool' : 'Enable text tool'}
                title={isTextToolActive ? 'Text tool active' : 'Enable text tool'}
            >
                <span key="text-icon" aria-hidden="true">
                    {'\u270D'}
                </span>
                <span key="text-label">Text</span>
            </button>

            <button
                key="button-add-image"
                type="button"
                className="add-image"
                onClick={handleAddImageClick}
                aria-label="Add picture"
                title="Add picture"
                disabled={!layerControls?.addImageLayer}
            >
                <span key="add-image-icon" aria-hidden="true">
                    {'🖼️'}
                </span>
                <span key="add-image-label">Picture</span>
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
