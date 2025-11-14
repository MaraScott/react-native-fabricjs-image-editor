import { useDispatch } from 'react-redux';
import { viewActions } from '@store/CanvasApp/view';

/**
 * SideBarLeftProps Interface
 * 
 * Type definition for SideBarLeftProps.
 */
export interface SideBarLeftProps {
    key?: string;
    isPanToolActive: boolean;
    isSelectToolActive: boolean;
}

/**
 * SideBarLeft Component
 * 
 * Renders the SideBarLeft component.
 */
export const SideBarLeft = (props: SideBarLeftProps) => {

    const { isPanToolActive, isSelectToolActive } = props;

  /**
   * useDispatch - Auto-generated summary; refine if additional context is needed.
   */
  /**
   * useDispatch - Auto-generated documentation stub.
   */
  const dispatch = useDispatch();

    /**
     * togglePanTool - Auto-generated summary; refine if additional context is needed.
     */
    /**
     * togglePanTool - Auto-generated documentation stub.
     */
    const togglePanTool = () => {
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {isPanToolActive} Refer to the implementation for the precise returned value.
         */
        if (isPanToolActive) {
            // Switch to select tool when disabling pan
            /**
             * dispatch - Auto-generated summary; refine if additional context is needed.
             */
            dispatch(viewActions.setActiveTool('select'));
        } else {
            // Enable pan tool
            /**
             * dispatch - Auto-generated summary; refine if additional context is needed.
             */
            dispatch(viewActions.setActiveTool('pan'));
        }
    };

    /**
     * toggleSelectTool - Auto-generated summary; refine if additional context is needed.
     */
    const toggleSelectTool = () => {
        /**
         * if - Auto-generated summary; refine if additional context is needed.
         *
         * @returns {isSelectToolActive} Refer to the implementation for the precise returned value.
         */
        if (isSelectToolActive) {
            // Switch to pan tool when disabling select
            /**
             * dispatch - Auto-generated summary; refine if additional context is needed.
             */
            dispatch(viewActions.setActiveTool('pan'));
        } else {
            // Enable select tool
            /**
             * dispatch - Auto-generated summary; refine if additional context is needed.
             */
            dispatch(viewActions.setActiveTool('select'));
        }
    };

    return (
        <div
            key="sidebar-left"
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
            }}
        >
            <button
                key="button-pan"
                type="button"
                onClick={togglePanTool}
                aria-pressed={isPanToolActive}
                aria-label={isPanToolActive ? 'Disable pan tool' : 'Enable pan tool'}
                title={isPanToolActive ? 'Pan tool active' : 'Enable pan tool'}
                style={{
                    width: '100%',
                    border: `1px solid ${isPanToolActive ? '#333333' : '#d0d0d0'}`,
                    backgroundColor: isPanToolActive ? '#333333' : '#f8f8f8',
                    color: isPanToolActive ? '#ffffff' : '#333333',
                    borderRadius: '8px',
                    padding: '0.75rem 0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    userSelect: 'none',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
                }}
            >
                <span aria-hidden="true" style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                    {'\u270B'}
                </span>
                <span>Pan</span>
            </button>

            <button
                key="button-select"
                type="button"
                onClick={toggleSelectTool}
                aria-pressed={isSelectToolActive}
                aria-label={isSelectToolActive ? 'Disable select tool' : 'Enable select tool'}
                title={isSelectToolActive ? 'Select tool active' : 'Enable select tool'}
                style={{
                    width: '100%',
                    border: `1px solid ${isSelectToolActive ? '#333333' : '#d0d0d0'}`,
                    backgroundColor: isSelectToolActive ? '#333333' : '#f8f8f8',
                    color: isSelectToolActive ? '#ffffff' : '#333333',
                    borderRadius: '8px',
                    padding: '0.75rem 0.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    userSelect: 'none',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
                }}
            >
                <span aria-hidden="true" style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                    {'\u261D'}
                </span>
                <span>Select</span>
            </button>
        </div>
    )
};  