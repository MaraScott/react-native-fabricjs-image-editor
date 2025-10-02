import { useCallback, useEffect, useMemo, useState } from 'react';
import FilerobotImageEditor, { type SavePayload } from './FilerobotImageEditor';

const SAMPLE_IMAGES: Array<{ id: string; label: string; src: string }> = [
  {
    id: 'aurora',
    label: 'Aurora skyline',
    src: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1280&q=80',
  },
  {
    id: 'mountain',
    label: 'Mountain view',
    src: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1280&q=80',
  },
  {
    id: 'workspace',
    label: 'Creative workspace',
    src: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=1280&q=80',
  },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    });
    reader.addEventListener('error', () => reject(reader.error ?? new Error('Unable to read file')));
    reader.readAsDataURL(file);
  });
}

export default function FilerobotEditorApp() {
  const [source, setSource] = useState<string | null>(SAMPLE_IMAGES[0]?.src ?? null);
  const [savedImage, setSavedImage] = useState<string | null>(null);
  const [designState, setDesignState] = useState<SavePayload['designState'] | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({
          type: 'ready',
        }),
      );
    } catch (error) {
      console.warn('Failed to post ready message', error);
    }
  }, []);

  const handleFileInput = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setSource(dataUrl);
    } catch (error) {
      console.error(error);
    } finally {
      event.currentTarget.value = '';
    }
  }, []);

  const handleSampleSelection = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = SAMPLE_IMAGES.find((item) => item.id === event.currentTarget.value);
    if (selected) {
      setSource(selected.src);
    }
  }, []);

  const handleSave = useCallback((payload: SavePayload) => {
    setIsSaving(true);
    setTimeout(() => {
      setSavedImage(payload.editedImage);
      setDesignState(payload.designState);
      setIsSaving(false);
      try {
        window.ReactNativeWebView?.postMessage(
          JSON.stringify({
            type: 'save',
            payload: {
              dataUrl: payload.editedImage,
              designState: payload.designState,
            },
          }),
        );
      } catch (error) {
        console.warn('Failed to post save message', error);
      }
    }, 80);
  }, []);

  const resetSavedPreview = useCallback(() => {
    setSavedImage(null);
    setDesignState(null);
  }, []);

  const designSummary = useMemo(() => {
    if (!designState) {
      return null;
    }
    const lines = [
      `Rotation: ${designState.rotation}°`,
      `Flip: H ${designState.flip.horizontal ? 'on' : 'off'}, V ${designState.flip.vertical ? 'on' : 'off'}`,
      `Brightness: ${designState.adjustments.brightness.toFixed(2)}`,
      `Contrast: ${designState.adjustments.contrast.toFixed(2)}`,
      `Saturation: ${designState.adjustments.saturation.toFixed(2)}`,
      `Crop: ${designState.crop ? `${Math.round(designState.crop.width)} × ${Math.round(designState.crop.height)}` : 'none'}`,
      `Texts: ${designState.texts.length}`,
    ];
    return lines.join('\n');
  }, [designState]);

  return (
    <div className={`fie-app fie-theme-${theme}`}>
      <header className="fie-app-header">
        <div className="fie-app-header-left">
          <h1>Filerobot Image Editor</h1>
          <p className="fie-app-subtitle">
            Open source editor inspired by the official <a href="https://github.com/scaleflex/filerobot-image-editor">Filerobot Image
            Editor</a>. Edit images with cropping, rotation, colour tuning and text overlays directly in the browser.
          </p>
        </div>
        <div className="fie-app-header-actions">
          <label className="fie-button file">
            <input type="file" accept="image/*" onChange={handleFileInput} />
            Upload image
          </label>
          <select
            className="fie-select"
            onChange={handleSampleSelection}
            value={SAMPLE_IMAGES.find((item) => item.src === source)?.id ?? 'custom'}
          >
            <option value="custom">Custom upload</option>
            {SAMPLE_IMAGES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <button type="button" className="fie-button ghost" onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}>
            Toggle theme
          </button>
        </div>
      </header>

      <FilerobotImageEditor
        source={source}
        theme={theme}
        onSave={handleSave}
        annotationsCommon={{ fill: '#38bdf8', fontSize: 42 }}
        Text={{ text: 'Hello world!', color: '#38bdf8' }}
      />

      <section className="fie-save-preview" aria-live="polite">
        <header className="fie-save-header">
          <h2>Save preview</h2>
          {savedImage ? (
            <button type="button" className="fie-button ghost" onClick={resetSavedPreview}>
              Clear preview
            </button>
          ) : null}
        </header>
        {isSaving ? <p className="fie-saving">Rendering…</p> : null}
        {savedImage ? (
          <div className="fie-save-content">
            <img src={savedImage} alt="Edited result" />
            {designSummary ? <pre className="fie-design-summary">{designSummary}</pre> : null}
          </div>
        ) : (
          <p className="fie-hint">Use the editor above and press <strong>Save</strong> to preview the exported image.</p>
        )}
      </section>
    </div>
  );
}
