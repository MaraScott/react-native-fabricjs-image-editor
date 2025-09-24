import type { EditorDesign, EditorElement } from '../types/editor';

export function createEmptyDesign(): EditorDesign {
  return { elements: [], metadata: null };
}

export function serializeDesign(elements: EditorElement[]): EditorDesign {
  return { elements: [...elements], metadata: null };
}

export function stringifyDesign(elements: EditorElement[]): string {
  return JSON.stringify(serializeDesign(elements));
}

export function parseDesign(design: string | EditorDesign | null | undefined): EditorDesign | null {
  if (!design) {
    return null;
  }

  try {
    const raw = typeof design === 'string' ? JSON.parse(design) : design;
    if (Array.isArray(raw)) {
      return { elements: raw as EditorElement[], metadata: null };
    }
    if (typeof raw === 'object' && raw !== null && Array.isArray((raw as EditorDesign).elements)) {
      const incoming = raw as EditorDesign;
      return {
        elements: [...incoming.elements],
        metadata: incoming.metadata ?? null,
      };
    }
  } catch (error) {
    console.warn('[Editor] Unable to parse design', error);
  }

  return null;
}
