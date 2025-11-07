import { useState, useEffect, useCallback } from 'react';

const KEYBOARD_ZOOM_STEP = 10;

interface UseKeyboardControlsProps {
  applyZoomDelta: (delta: number, threshold?: number) => void;
  updateZoom: (updater: (previousZoom: number) => number, options?: { threshold?: number }) => void;
}

interface UseKeyboardControlsResult {
  spacePressed: boolean;
}

export const useKeyboardControls = ({
  applyZoomDelta,
  updateZoom,
}: UseKeyboardControlsProps): UseKeyboardControlsResult => {
  const [spacePressed, setSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (tagName === 'INPUT' || tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }

      if (event.code === 'Space') {
        if (!event.repeat) {
          setSpacePressed(true);
        }
        event.preventDefault();
        return;
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        applyZoomDelta(KEYBOARD_ZOOM_STEP);
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        applyZoomDelta(-KEYBOARD_ZOOM_STEP);
      } else if (event.key === '0' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        updateZoom(() => 0);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpacePressed(false);
      }
    };

    const handleWindowBlur = () => {
      setSpacePressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [applyZoomDelta, updateZoom]);

  return {
    spacePressed,
  };
};
