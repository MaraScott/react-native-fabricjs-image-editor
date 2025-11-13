/**
 * Example Usage of the Modular Store Structure
 * This file demonstrates how to use the new tool-based state management
 */

import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@store/CanvasApp';
import { viewActions } from '@store/CanvasApp/view';

/**
 * Example Component: Tool Switcher
 * Demonstrates switching between different tools
 */
/**
 * ToolSwitcher - Auto-generated documentation stub.
 */
export function ToolSwitcher() {
    const dispatch = useDispatch<AppDispatch>();
    /**
     * useSelector - Auto-generated documentation stub.
     *
     * @param {*} (state - Parameter forwarded to useSelector.
     */
    const activeTool = useSelector((state: RootState) => state.view.activeTool);
    
    return (
        <div>
            <button 
                /**
                 * dispatch - Auto-generated documentation stub.
                 */
                onClick={() => dispatch(viewActions.setActiveTool('select'))}
                disabled={activeTool === 'select'}
            >
                Select Tool
            </button>
            
            <button 
                /**
                 * dispatch - Auto-generated documentation stub.
                 */
                onClick={() => dispatch(viewActions.setActiveTool('pan'))}
                disabled={activeTool === 'pan'}
            >
                Pan Tool
            </button>
            
            <button 
                /**
                 * dispatch - Auto-generated documentation stub.
                 */
                onClick={() => dispatch(viewActions.setActiveTool('draw'))}
                disabled={activeTool === 'draw'}
            >
                Draw Tool
            </button>
        </div>
    );
}

/**
 * Example Component: Pan Controls
 * Demonstrates using pan tool state and actions
 */
/**
 * PanControls - Auto-generated documentation stub.
 */
export function PanControls() {
    const dispatch = useDispatch<AppDispatch>();
    /**
     * useSelector - Auto-generated documentation stub.
     *
     * @param {*} (state - Parameter forwarded to useSelector.
     */
    const panState = useSelector((state: RootState) => state.view.pan);
    
    /**
     * handlePanReset - Auto-generated documentation stub.
     */
    const handlePanReset = () => {
        dispatch(viewActions.pan.resetOffset());
    };
    
    /**
     * handlePanLeft - Auto-generated documentation stub.
     */
    const handlePanLeft = () => {
        /**
         * dispatch - Auto-generated documentation stub.
         *
         * @param {*} viewActions.pan.updateOffset({ dx - Parameter forwarded to dispatch.
         * @param {*} dy - Parameter forwarded to dispatch.
         */
        dispatch(viewActions.pan.updateOffset({ dx: -50, dy: 0 }));
    };
    
    /**
     * handlePanRight - Auto-generated documentation stub.
     */
    const handlePanRight = () => {
        /**
         * dispatch - Auto-generated documentation stub.
         *
         * @param {*} viewActions.pan.updateOffset({ dx - Parameter forwarded to dispatch.
         * @param {*} dy - Parameter forwarded to dispatch.
         */
        dispatch(viewActions.pan.updateOffset({ dx: 50, dy: 0 }));
    };
    
    return (
        <div>
            <p>Pan Offset: x={panState.offset.x}, y={panState.offset.y}</p>
            <p>Is Panning: {panState.isPanning ? 'Yes' : 'No'}</p>
            
            <button onClick={handlePanLeft}>Pan Left</button>
            <button onClick={handlePanRight}>Pan Right</button>
            <button onClick={handlePanReset}>Reset Pan</button>
        </div>
    );
}

/**
 * Example Component: Draw Settings
 * Demonstrates using draw tool state and actions
 */
/**
 * DrawSettings - Auto-generated documentation stub.
 */
export function DrawSettings() {
    const dispatch = useDispatch<AppDispatch>();
    /**
     * useSelector - Auto-generated documentation stub.
     *
     * @param {*} (state - Parameter forwarded to useSelector.
     */
    const drawState = useSelector((state: RootState) => state.view.draw);
    
    /**
     * handleBrushSizeChange - Auto-generated documentation stub.
     */
    const handleBrushSizeChange = (size: number) => {
        dispatch(viewActions.draw.setBrushSize(size));
    };
    
    /**
     * handleColorChange - Auto-generated documentation stub.
     */
    const handleColorChange = (color: string) => {
        /**
         * dispatch - Auto-generated documentation stub.
         */
        dispatch(viewActions.draw.setBrushColor(color));
    };
    
    /**
     * handleOpacityChange - Auto-generated documentation stub.
     */
    const handleOpacityChange = (opacity: number) => {
        /**
         * dispatch - Auto-generated documentation stub.
         */
        dispatch(viewActions.draw.setBrushOpacity(opacity));
    };
    
    return (
        <div>
            <div>
                <label>Brush Size: {drawState.brushSize}</label>
                <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={drawState.brushSize}
                    /**
                     * handleBrushSizeChange - Auto-generated documentation stub.
                     */
                    onChange={(e) => handleBrushSizeChange(Number(e.target.value))}
                />
            </div>
            
            <div>
                <label>Brush Color:</label>
                <input 
                    type="color" 
                    value={drawState.brushColor}
                    /**
                     * handleColorChange - Auto-generated documentation stub.
                     *
                     * @returns {e.target.value} Result produced by handleColorChange.
                     */
                    onChange={(e) => handleColorChange(e.target.value)}
                />
            </div>
            
            <div>
                <label>Opacity: {drawState.brushOpacity}</label>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    value={drawState.brushOpacity}
                    /**
                     * handleOpacityChange - Auto-generated documentation stub.
                     */
                    onChange={(e) => handleOpacityChange(Number(e.target.value))}
                />
            </div>
            
            <p>Currently Drawing: {drawState.isDrawing ? 'Yes' : 'No'}</p>
        </div>
    );
}

/**
 * Example Component: Selection Manager
 * Demonstrates using select tool state and actions
 */
/**
 * SelectionManager - Auto-generated documentation stub.
 */
export function SelectionManager() {
    const dispatch = useDispatch<AppDispatch>();
    /**
     * useSelector - Auto-generated documentation stub.
     *
     * @param {*} (state - Parameter forwarded to useSelector.
     */
    const selectState = useSelector((state: RootState) => state.view.select);
    
    /**
     * handleSelectElement - Auto-generated documentation stub.
     */
    const handleSelectElement = (elementId: string) => {
        dispatch(viewActions.select.addSelectedId(elementId));
    };
    
    /**
     * handleDeselectElement - Auto-generated documentation stub.
     */
    const handleDeselectElement = (elementId: string) => {
        /**
         * dispatch - Auto-generated documentation stub.
         */
        dispatch(viewActions.select.removeSelectedId(elementId));
    };
    
    /**
     * handleClearSelection - Auto-generated documentation stub.
     */
    const handleClearSelection = () => {
        /**
         * dispatch - Auto-generated documentation stub.
         */
        dispatch(viewActions.select.clearSelection());
    };
    
    /**
     * handleSelectMultiple - Auto-generated documentation stub.
     */
    const handleSelectMultiple = (elementIds: string[]) => {
        /**
         * dispatch - Auto-generated documentation stub.
         */
        dispatch(viewActions.select.setSelectedIds(elementIds));
    };
    
    return (
        <div>
            <p>Selected Elements: {selectState.selectedIds.length}</p>
            <ul>
                {selectState.selectedIds.map(id => (
                    <li key={id}>
                        {id}
                        /**
                         * handleDeselectElement - Auto-generated documentation stub.
                         *
                         * @returns {id} Result produced by handleDeselectElement.
                         */
                        <button onClick={() => handleDeselectElement(id)}>Remove</button>
                    </li>
                ))}
            </ul>
            
            <button onClick={handleClearSelection}>Clear All</button>
            
            {selectState.selectionRect && (
                <p>
                    Selection Rect: x={selectState.selectionRect.x}, 
                    y={selectState.selectionRect.y}, 
                    w={selectState.selectionRect.width}, 
                    h={selectState.selectionRect.height}
                </p>
            )}
        </div>
    );
}

/**
 * Example Component: Crop Tool
 * Demonstrates using crop tool state and actions
 */
/**
 * CropTool - Auto-generated documentation stub.
 */
export function CropTool() {
    const dispatch = useDispatch<AppDispatch>();
    /**
     * useSelector - Auto-generated documentation stub.
     *
     * @param {*} (state - Parameter forwarded to useSelector.
     */
    const cropState = useSelector((state: RootState) => state.view.crop);
    
    /**
     * handleStartCrop - Auto-generated documentation stub.
     */
    const handleStartCrop = (elementId: string) => {
        dispatch(viewActions.crop.setTargetElement(elementId));
        dispatch(viewActions.crop.setCropArea({ x: 0, y: 0, width: 100, height: 100 }));
    };
    
    /**
     * handleUpdateCropArea - Auto-generated documentation stub.
     */
    const handleUpdateCropArea = (updates: Partial<{ x: number; y: number; width: number; height: number }>) => {
        /**
         * dispatch - Auto-generated documentation stub.
         */
        dispatch(viewActions.crop.updateCropArea(updates));
    };
    
    /**
     * handleApplyCrop - Auto-generated documentation stub.
     */
    const handleApplyCrop = () => {
        /**
         * dispatch - Auto-generated documentation stub.
         */
        dispatch(viewActions.crop.applyCrop());
        // Your crop logic here
    };
    
    /**
     * handleCancelCrop - Auto-generated documentation stub.
     */
    const handleCancelCrop = () => {
        /**
         * dispatch - Auto-generated documentation stub.
         */
        dispatch(viewActions.crop.cancelCrop());
    };
    
    return (
        <div>
            {cropState.active && cropState.targetElementId ? (
                <div>
                    <p>Cropping Element: {cropState.targetElementId}</p>
                    
                    {cropState.cropArea && (
                        <div>
                            <p>Crop Area:</p>
                            <input 
                                type="number" 
                                value={cropState.cropArea.x}
                                /**
                                 * handleUpdateCropArea - Auto-generated documentation stub.
                                 *
                                 * @param {*} { x - Parameter forwarded to handleUpdateCropArea.
                                 */
                                onChange={(e) => handleUpdateCropArea({ x: Number(e.target.value) })}
                                placeholder="X"
                            />
                            <input 
                                type="number" 
                                value={cropState.cropArea.y}
                                /**
                                 * handleUpdateCropArea - Auto-generated documentation stub.
                                 *
                                 * @param {*} { y - Parameter forwarded to handleUpdateCropArea.
                                 */
                                onChange={(e) => handleUpdateCropArea({ y: Number(e.target.value) })}
                                placeholder="Y"
                            />
                            <input 
                                type="number" 
                                value={cropState.cropArea.width}
                                /**
                                 * handleUpdateCropArea - Auto-generated documentation stub.
                                 *
                                 * @param {*} { width - Parameter forwarded to handleUpdateCropArea.
                                 */
                                onChange={(e) => handleUpdateCropArea({ width: Number(e.target.value) })}
                                placeholder="Width"
                            />
                            <input 
                                type="number" 
                                value={cropState.cropArea.height}
                                /**
                                 * handleUpdateCropArea - Auto-generated documentation stub.
                                 *
                                 * @param {*} { height - Parameter forwarded to handleUpdateCropArea.
                                 */
                                onChange={(e) => handleUpdateCropArea({ height: Number(e.target.value) })}
                                placeholder="Height"
                            />
                        </div>
                    )}
                    
                    <button onClick={handleApplyCrop}>Apply Crop</button>
                    <button onClick={handleCancelCrop}>Cancel</button>
                </div>
            ) : (
                /**
                 * handleStartCrop - Auto-generated documentation stub.
                 *
                 * @returns {'element-123'} Result produced by handleStartCrop.
                 */
                <button onClick={() => handleStartCrop('element-123')}>
                    Start Cropping
                </button>
            )}
        </div>
    );
}

/**
 * Example: Using Multiple Tool States Together
 */
/**
 * AdvancedToolManager - Auto-generated documentation stub.
 */
export function AdvancedToolManager() {
    const dispatch = useDispatch<AppDispatch>();
    /**
     * useSelector - Auto-generated documentation stub.
     *
     * @param {*} (state - Parameter forwarded to useSelector.
     */
    const view = useSelector((state: RootState) => state.view);
    
    // Switch to draw tool with custom settings
    /**
     * startDrawingWithSettings - Auto-generated documentation stub.
     */
    const startDrawingWithSettings = () => {
        dispatch(viewActions.setActiveTool('draw'));
        dispatch(viewActions.draw.setBrushSize(15));
        /**
         * dispatch - Auto-generated documentation stub.
         */
        dispatch(viewActions.draw.setBrushColor('#FF0000'));
        /**
         * dispatch - Auto-generated documentation stub.
         */
        dispatch(viewActions.draw.setBrushOpacity(0.8));
    };
    
    // Enable pan with spacebar mode
    /**
     * enableTemporaryPan - Auto-generated documentation stub.
     */
    const enableTemporaryPan = () => {
        /**
         * dispatch - Auto-generated documentation stub.
         */
        dispatch(viewActions.pan.setSpacePressedMode(true));
    };
    
    // Return to select mode with cleared selection
    /**
     * returnToSelectMode - Auto-generated documentation stub.
     */
    const returnToSelectMode = () => {
        /**
         * dispatch - Auto-generated documentation stub.
         */
        dispatch(viewActions.setActiveTool('select'));
        /**
         * dispatch - Auto-generated documentation stub.
         */
        dispatch(viewActions.select.clearSelection());
    };
    
    return (
        <div>
            <h2>Advanced Tool Manager</h2>
            <p>Active Tool: {view.activeTool}</p>
            
            <button onClick={startDrawingWithSettings}>
                /**
                 * Drawing - Auto-generated documentation stub.
                 *
                 * @param {*} Red - Parameter forwarded to Drawing.
                 * @param {*} Size 15 - Parameter forwarded to Drawing.
                 *
                 * @returns {Red, Size 15} Result produced by Drawing.
                 */
                Start Drawing (Red, Size 15)
            </button>
            
            <button onClick={enableTemporaryPan}>
                Enable Temporary Pan
            </button>
            
            <button onClick={returnToSelectMode}>
                Return to Select Mode
            </button>
            
            {/* Display active states */}
            <div>
                <p>Select Active: {view.select.active ? 'Yes' : 'No'}</p>
                <p>Pan Active: {view.pan.active ? 'Yes' : 'No'}</p>
                <p>Draw Active: {view.draw.active ? 'Yes' : 'No'}</p>
                <p>Rubber Active: {view.rubber.active ? 'Yes' : 'No'}</p>
                <p>Crop Active: {view.crop.active ? 'Yes' : 'No'}</p>
            </div>
        </div>
    );
}
