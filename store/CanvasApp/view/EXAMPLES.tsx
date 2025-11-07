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
export function ToolSwitcher() {
    const dispatch = useDispatch<AppDispatch>();
    const activeTool = useSelector((state: RootState) => state.view.activeTool);
    
    return (
        <div>
            <button 
                onClick={() => dispatch(viewActions.setActiveTool('select'))}
                disabled={activeTool === 'select'}
            >
                Select Tool
            </button>
            
            <button 
                onClick={() => dispatch(viewActions.setActiveTool('pan'))}
                disabled={activeTool === 'pan'}
            >
                Pan Tool
            </button>
            
            <button 
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
export function PanControls() {
    const dispatch = useDispatch<AppDispatch>();
    const panState = useSelector((state: RootState) => state.view.pan);
    
    const handlePanReset = () => {
        dispatch(viewActions.pan.resetOffset());
    };
    
    const handlePanLeft = () => {
        dispatch(viewActions.pan.updateOffset({ dx: -50, dy: 0 }));
    };
    
    const handlePanRight = () => {
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
export function DrawSettings() {
    const dispatch = useDispatch<AppDispatch>();
    const drawState = useSelector((state: RootState) => state.view.draw);
    
    const handleBrushSizeChange = (size: number) => {
        dispatch(viewActions.draw.setBrushSize(size));
    };
    
    const handleColorChange = (color: string) => {
        dispatch(viewActions.draw.setBrushColor(color));
    };
    
    const handleOpacityChange = (opacity: number) => {
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
                    onChange={(e) => handleBrushSizeChange(Number(e.target.value))}
                />
            </div>
            
            <div>
                <label>Brush Color:</label>
                <input 
                    type="color" 
                    value={drawState.brushColor}
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
export function SelectionManager() {
    const dispatch = useDispatch<AppDispatch>();
    const selectState = useSelector((state: RootState) => state.view.select);
    
    const handleSelectElement = (elementId: string) => {
        dispatch(viewActions.select.addSelectedId(elementId));
    };
    
    const handleDeselectElement = (elementId: string) => {
        dispatch(viewActions.select.removeSelectedId(elementId));
    };
    
    const handleClearSelection = () => {
        dispatch(viewActions.select.clearSelection());
    };
    
    const handleSelectMultiple = (elementIds: string[]) => {
        dispatch(viewActions.select.setSelectedIds(elementIds));
    };
    
    return (
        <div>
            <p>Selected Elements: {selectState.selectedIds.length}</p>
            <ul>
                {selectState.selectedIds.map(id => (
                    <li key={id}>
                        {id}
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
export function CropTool() {
    const dispatch = useDispatch<AppDispatch>();
    const cropState = useSelector((state: RootState) => state.view.crop);
    
    const handleStartCrop = (elementId: string) => {
        dispatch(viewActions.crop.setTargetElement(elementId));
        dispatch(viewActions.crop.setCropArea({ x: 0, y: 0, width: 100, height: 100 }));
    };
    
    const handleUpdateCropArea = (updates: Partial<{ x: number; y: number; width: number; height: number }>) => {
        dispatch(viewActions.crop.updateCropArea(updates));
    };
    
    const handleApplyCrop = () => {
        dispatch(viewActions.crop.applyCrop());
        // Your crop logic here
    };
    
    const handleCancelCrop = () => {
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
                                onChange={(e) => handleUpdateCropArea({ x: Number(e.target.value) })}
                                placeholder="X"
                            />
                            <input 
                                type="number" 
                                value={cropState.cropArea.y}
                                onChange={(e) => handleUpdateCropArea({ y: Number(e.target.value) })}
                                placeholder="Y"
                            />
                            <input 
                                type="number" 
                                value={cropState.cropArea.width}
                                onChange={(e) => handleUpdateCropArea({ width: Number(e.target.value) })}
                                placeholder="Width"
                            />
                            <input 
                                type="number" 
                                value={cropState.cropArea.height}
                                onChange={(e) => handleUpdateCropArea({ height: Number(e.target.value) })}
                                placeholder="Height"
                            />
                        </div>
                    )}
                    
                    <button onClick={handleApplyCrop}>Apply Crop</button>
                    <button onClick={handleCancelCrop}>Cancel</button>
                </div>
            ) : (
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
export function AdvancedToolManager() {
    const dispatch = useDispatch<AppDispatch>();
    const view = useSelector((state: RootState) => state.view);
    
    // Switch to draw tool with custom settings
    const startDrawingWithSettings = () => {
        dispatch(viewActions.setActiveTool('draw'));
        dispatch(viewActions.draw.setBrushSize(15));
        dispatch(viewActions.draw.setBrushColor('#FF0000'));
        dispatch(viewActions.draw.setBrushOpacity(0.8));
    };
    
    // Enable pan with spacebar mode
    const enableTemporaryPan = () => {
        dispatch(viewActions.pan.setSpacePressedMode(true));
    };
    
    // Return to select mode with cleared selection
    const returnToSelectMode = () => {
        dispatch(viewActions.setActiveTool('select'));
        dispatch(viewActions.select.clearSelection());
    };
    
    return (
        <div>
            <h2>Advanced Tool Manager</h2>
            <p>Active Tool: {view.activeTool}</p>
            
            <button onClick={startDrawingWithSettings}>
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
