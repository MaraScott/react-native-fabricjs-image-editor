import { useCallback, useEffect, useState, RefObject } from "react";
import Konva from "konva";
import type { LayerTextItem } from "@molecules/Layer/Layer.types";

export type TextEditState = {
  layerId: string;
  textId: string;
  value: string;
  left: number;
  top: number;
  fontSize: number;
  fontFamily: string;
  fontStyle?: "normal" | "italic";
  fontWeight?: string;
  color?: string;
};

type LayerControls = {
  layers: Array<{
    id: string;
    bounds?: { x: number; y: number; width: number; height: number };
    position?: { x: number; y: number };
    texts?: LayerTextItem[];
  }>;
  updateLayerTexts?: (layerId: string, texts: LayerTextItem[]) => void;
};

interface UseTextEditingParams {
  layerControls: LayerControls | null | undefined;
  containerRef: RefObject<HTMLDivElement>;
  stageRef: RefObject<Konva.Stage>;
  stageViewportOffsetX: number;
  stageViewportOffsetY: number;
  safeScale: number;
}

interface UseTextEditingResult {
  activeTextEdit: TextEditState | null;
  setActiveTextEdit: React.Dispatch<React.SetStateAction<TextEditState | null>>;
  startTextEdit: (layerId: string, textId: string) => void;
  finishTextEdit: () => void;
  updateTextValue: (layerId: string, textId: string, value: string) => void;
}

export function useTextEditing({
  layerControls,
  containerRef,
  stageRef,
  stageViewportOffsetX,
  stageViewportOffsetY,
  safeScale,
}: UseTextEditingParams): UseTextEditingResult {
  const [activeTextEdit, setActiveTextEdit] =
    useState<TextEditState | null>(null);

  const getTextItem = useCallback(
    (layerId: string, textId: string) => {
      const layer = layerControls?.layers.find((l) => l.id === layerId);
      const textItem = layer?.texts?.find((t) => t.id === textId);
      return { layer, textItem };
    },
    [layerControls]
  );

  const updateTextValue = useCallback(
    (layerId: string, textId: string, value: string) => {
      if (!layerControls?.updateLayerTexts) return;
      const { layer } = getTextItem(layerId, textId);
      if (!layer) return;
      const nextTexts = (layer.texts ?? []).map((text) =>
        text.id === textId ? { ...text, text: value } : text
      );
      layerControls.updateLayerTexts(layerId, nextTexts);
    },
    [getTextItem, layerControls]
  );

  const removeTextItem = useCallback(
    (layerId: string, textId: string) => {
      if (!layerControls?.updateLayerTexts) return;
      const { layer } = getTextItem(layerId, textId);
      if (!layer) return;
      const nextTexts = (layer.texts ?? []).filter(
        (text) => text.id !== textId
      );
      layerControls.updateLayerTexts(layerId, nextTexts);
    },
    [getTextItem, layerControls]
  );

  const finishTextEdit = useCallback(() => {
    if (!activeTextEdit) return;
    const trimmed = (activeTextEdit.value ?? "").trim();
    if (!trimmed) {
      removeTextItem(activeTextEdit.layerId, activeTextEdit.textId);
    } else {
      updateTextValue(
        activeTextEdit.layerId,
        activeTextEdit.textId,
        trimmed
      );
    }
    setActiveTextEdit(null);
  }, [activeTextEdit, removeTextItem, updateTextValue]);

  const startTextEdit = useCallback(
    (layerId: string, textId: string) => {
      const { textItem, layer } = getTextItem(layerId, textId);
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!textItem || !layer || !containerRect) return;

      const layerBaseX = layer.bounds?.x ?? layer.position?.x ?? 0;
      const layerBaseY = layer.bounds?.y ?? layer.position?.y ?? 0;

      const left =
        (stageViewportOffsetX + layerBaseX + (textItem.x ?? 0)) * safeScale;
      const top =
        (stageViewportOffsetY + layerBaseY + (textItem.y ?? 0)) * safeScale;

      setActiveTextEdit({
        layerId,
        textId,
        value: textItem.text ?? "",
        left,
        top,
        fontSize: textItem.fontSize ?? 32,
        fontFamily: textItem.fontFamily ?? "Arial, sans-serif",
        fontStyle: textItem.fontStyle ?? "normal",
        fontWeight: textItem.fontWeight ?? "normal",
        color: textItem.fill ?? "#000000",
      });

      const container = stageRef.current?.container();
      if (container && typeof container.focus === "function") {
        if (!container.getAttribute("tabindex")) {
          container.setAttribute("tabindex", "0");
        }
        container.focus();
      }
    },
    [
      getTextItem,
      containerRef,
      stageRef,
      safeScale,
      stageViewportOffsetX,
      stageViewportOffsetY,
    ]
  );

  // Escape key closes text edit
  useEffect(() => {
    if (!activeTextEdit) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finishTextEdit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTextEdit, finishTextEdit]);

  return {
    activeTextEdit,
    setActiveTextEdit,
    startTextEdit,
    finishTextEdit,
    updateTextValue,
  };
}
