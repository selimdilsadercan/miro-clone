"use client";

import { LiveObject } from "@liveblocks/client";
import { colorToCss, connectionIdToColor, findIntersectingLayersWithRectangle, penPointsToPathLayer, pointerEventToCanvasPoint, resizeBounds } from "@/lib/utils"; //prettier-ignore
import { useHistory, useCanUndo, useCanRedo, useMutation, useStorage, useOthersMapped, useSelf } from "@/liveblocks.config";
import { Camera, CanvasMode, CanvasState, Color, LayerType, Point, Side, XYWH } from "@/types";
import { useDisableScrollBounce } from "@/hooks/use-disable-scroll-bounce";
import { nanoid } from "nanoid";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import Info from "./Info";
import Participants from "./Participants";
import Toolbar from "./Toolbar";
import SelectionTools from "./SelectionTools";
import CursorsPresence from "./CursorsPresence";
import Path from "./Path";
import LayerPreview from "./LayerPreview";
import SelectionBox from "./SelectionBox";

const MAX_LAYERS = 100;

interface Props {
  boardId: string;
}

function Canvas({ boardId }: Props) {
  const layerIds = useStorage((root) => root.layerIds);

  const pencilDraft = useSelf((me) => me.presence.pencilDraft);
  const [canvasState, setCanvasState] = useState<CanvasState>({ mode: CanvasMode.None });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const [lastUsedColor, setLastUsedColor] = useState<Color>({ r: 0, g: 0, b: 0 });

  useDisableScrollBounce();
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const insertLayer = useMutation(
    ({ storage, setMyPresence }, layerType: LayerType.Ellipse | LayerType.Rectangle | LayerType.Text | LayerType.Note, position: Point) => {
      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) {
        return;
      }

      const liveLayerIds = storage.get("layerIds");
      const layerId = nanoid();
      const layer = new LiveObject({
        type: layerType,
        x: position.x,
        y: position.y,
        height: 100,
        width: 100,
        fill: lastUsedColor
      });

      liveLayerIds.push(layerId);
      liveLayers.set(layerId, layer);

      setMyPresence({ selection: [layerId] }, { addToHistory: true });
      setCanvasState({ mode: CanvasMode.None });
    },
    [lastUsedColor]
  );

  const translateSelectedLayers = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Translating) {
        return;
      }

      const offset = {
        x: point.x - canvasState.current.x,
        y: point.y - canvasState.current.y
      };

      const liveLayers = storage.get("layers");

      for (const id of self.presence.selection) {
        const layer = liveLayers.get(id);

        if (layer) {
          layer.update({
            x: layer.get("x") + offset.x,
            y: layer.get("y") + offset.y
          });
        }
      }

      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [canvasState]
  );

  const unselectLayers = useMutation(({ self, setMyPresence }) => {
    if (self.presence.selection.length > 0) {
      setMyPresence({ selection: [] }, { addToHistory: true });
    }
  }, []);

  const updateSelectionNet = useMutation(
    ({ storage, setMyPresence }, current: Point, origin: Point) => {
      const layers = storage.get("layers").toImmutable();
      setCanvasState({
        mode: CanvasMode.SelectionNet,
        origin,
        current
      });

      const ids = findIntersectingLayersWithRectangle(layerIds, layers, origin, current);

      setMyPresence({ selection: ids });
    },
    [layerIds]
  );

  const startMultiSelection = useCallback((current: Point, origin: Point) => {
    if (Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5) {
      setCanvasState({
        mode: CanvasMode.SelectionNet,
        origin,
        current
      });
    }
  }, []);

  const continueDrawing = useMutation(
    ({ self, setMyPresence }, point: Point, e: React.PointerEvent) => {
      const { pencilDraft } = self.presence;

      if (canvasState.mode !== CanvasMode.Pencil || e.buttons !== 1 || pencilDraft == null) {
        return;
      }

      setMyPresence({
        cursor: point,
        pencilDraft:
          pencilDraft.length === 1 && pencilDraft[0][0] === point.x && pencilDraft[0][1] === point.y
            ? pencilDraft
            : [...pencilDraft, [point.x, point.y, e.pressure]]
      });
    },
    [canvasState.mode]
  );

  const insertPath = useMutation(
    ({ storage, self, setMyPresence }) => {
      const liveLayers = storage.get("layers");
      const { pencilDraft } = self.presence;

      if (pencilDraft == null || pencilDraft.length < 2 || liveLayers.size >= MAX_LAYERS) {
        setMyPresence({ pencilDraft: null });
        return;
      }

      const id = nanoid();
      liveLayers.set(id, new LiveObject(penPointsToPathLayer(pencilDraft, lastUsedColor)));

      const liveLayerIds = storage.get("layerIds");
      liveLayerIds.push(id);

      setMyPresence({ pencilDraft: null });
      setCanvasState({ mode: CanvasMode.Pencil });
    },
    [lastUsedColor]
  );

  const startDrawing = useMutation(
    ({ setMyPresence }, point: Point, pressure: number) => {
      setMyPresence({
        pencilDraft: [[point.x, point.y, pressure]],
        penColor: lastUsedColor
      });
    },
    [lastUsedColor]
  );

  const resizeSelectedLayer = useMutation(
    ({ storage, self }, point: Point) => {
      if (canvasState.mode !== CanvasMode.Resizing) {
        return;
      }

      const bounds = resizeBounds(canvasState.initialBounds, canvasState.corner, point);

      const liveLayers = storage.get("layers");
      const layer = liveLayers.get(self.presence.selection[0]);

      if (layer) {
        layer.update(bounds);
      }
    },
    [canvasState]
  );

  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      history.pause();
      setCanvasState({
        mode: CanvasMode.Resizing,
        initialBounds,
        corner
      });
    },
    [history]
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY
    }));
  }, []);

  const startPanning = useCallback((e: React.PointerEvent, current: Point) => {
    setCanvasState({ mode: CanvasMode.Panning, current: current });
    setCamera((camera) => ({
      x: camera.x + e.movementX,
      y: camera.y + e.movementY
    }));
  }, []);

  const onPointerMove = useMutation(
    ({ setMyPresence }, e: React.PointerEvent) => {
      e.preventDefault();

      const current = pointerEventToCanvasPoint(e, camera);

      if (canvasState.mode === CanvasMode.Panning) {
        startPanning(e, current);
      } else if (canvasState.mode === CanvasMode.Pressing) {
        startMultiSelection(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.SelectionNet) {
        updateSelectionNet(current, canvasState.origin);
      } else if (canvasState.mode === CanvasMode.Translating) {
        translateSelectedLayers(current);
      } else if (canvasState.mode === CanvasMode.Resizing) {
        resizeSelectedLayer(current);
      } else if (canvasState.mode === CanvasMode.Pencil) {
        continueDrawing(current, e);
      }

      setMyPresence({ cursor: current });
    },
    [continueDrawing, camera, canvasState, resizeSelectedLayer, translateSelectedLayers, startMultiSelection, updateSelectionNet]
  );

  const onPointerLeave = useMutation(({ setMyPresence }) => {
    setMyPresence({ cursor: null });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera);

      if (canvasState.mode === CanvasMode.Pan) {
        startPanning(e, point);
        return;
      }

      if (canvasState.mode === CanvasMode.Inserting) {
        return;
      }

      if (canvasState.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure);
        return;
      }

      if (e.buttons === 4) {
        setCanvasState({ mode: CanvasMode.Pan });
        startPanning(e, point);
        return;
      }
      setCanvasState({ origin: point, mode: CanvasMode.Pressing });
    },
    [camera, canvasState.mode, setCanvasState, startDrawing]
  );

  const onPointerUp = useMutation(
    ({}, e) => {
      const point = pointerEventToCanvasPoint(e, camera);

      if (canvasState.mode === CanvasMode.None || canvasState.mode === CanvasMode.Pressing) {
        unselectLayers();
        setCanvasState({
          mode: CanvasMode.None
        });
      } else if (canvasState.mode === CanvasMode.Pencil) {
        insertPath();
      } else if (canvasState.mode === CanvasMode.Inserting) {
        insertLayer(canvasState.layerType, point);
      } else if (canvasState.mode === CanvasMode.Panning) {
        console.log(e);
        if (e.button == 1) {
          setCanvasState({ mode: CanvasMode.None });
        } else {
          setCanvasState({ mode: CanvasMode.Pan });
        }
      } else {
        setCanvasState({
          mode: CanvasMode.None
        });
      }

      history.resume();
    },
    [setCanvasState, camera, canvasState, history, insertLayer, unselectLayers, insertPath]
  );

  const selections = useOthersMapped((other) => other.presence.selection);

  const onLayerPointerDown = useMutation(
    ({ self, setMyPresence }, e: React.PointerEvent, layerId: string) => {
      if (canvasState.mode === CanvasMode.Pencil || canvasState.mode === CanvasMode.Inserting) {
        return;
      }

      history.pause();
      e.stopPropagation();

      const point = pointerEventToCanvasPoint(e, camera);

      if (!self.presence.selection.includes(layerId)) {
        setMyPresence({ selection: [layerId] }, { addToHistory: true });
      }
      setCanvasState({ mode: CanvasMode.Translating, current: point });
    },
    [setCanvasState, camera, history, canvasState.mode]
  );

  const layerIdsToColorSelection = useMemo(() => {
    const layerIdsToColorSelection: Record<string, string> = {};

    for (const user of selections) {
      const [connectionId, selection] = user;

      for (const layerId of selection) {
        layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId);
      }
    }

    return layerIdsToColorSelection;
  }, [selections]);

  const deleteLayers = useDeleteLayers();

  const copyLayer = useMutation(({ storage, self }) => {
    const liveLayers = storage.get("layers");
    const layer = liveLayers.get(self.presence.selection[0]);

    layer && navigator.clipboard.writeText(JSON.stringify(layer.toObject()));
  }, []);

  const pasteLayer = useMutation(({ storage, setMyPresence }) => {
    navigator.clipboard.readText().then((text) => {
      const layer = JSON.parse(text);

      const liveLayers = storage.get("layers");
      const liveLayerIds = storage.get("layerIds");
      const id = nanoid();

      liveLayers.set(id, new LiveObject({ ...layer, x: layer.x + layer.width + 24 }));
      liveLayerIds.push(id);

      setMyPresence({ selection: [id] }, { addToHistory: true });
    });
  }, []);

  const duplicateLayer = useMutation(({ storage, self, setMyPresence }) => {
    const liveLayers = storage.get("layers");
    const liveLayerIds = storage.get("layerIds");

    const layer = JSON.parse(JSON.stringify(liveLayers.get(self.presence.selection[0])?.toObject()));

    const id = nanoid();
    liveLayers.set(id, new LiveObject({ ...layer, x: layer.x + layer.width + 24 }));
    liveLayerIds.push(id);

    setMyPresence({ selection: [id] }, { addToHistory: true });
  }, []);

  ////

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case "c": {
          if (e.ctrlKey || e.metaKey) {
            copyLayer();
          }
          break;
        }
        case "d": {
          e.preventDefault();
          if (e.ctrlKey || e.metaKey) {
            duplicateLayer();
            break;
          }
        }
        case "v":
          if (e.ctrlKey || e.metaKey) {
            pasteLayer();
            break;
          }
          setCanvasState({ mode: CanvasMode.None });
          break;
        case "t":
          setCanvasState({ mode: CanvasMode.Inserting, layerType: LayerType.Text });
          break;
        case "n":
          setCanvasState({ mode: CanvasMode.Inserting, layerType: LayerType.Note });
          break;
        case "r":
          setCanvasState({ mode: CanvasMode.Inserting, layerType: LayerType.Rectangle });
          break;
        case "e":
          setCanvasState({ mode: CanvasMode.Inserting, layerType: LayerType.Ellipse });
          break;
        case "p":
          setCanvasState({ mode: CanvasMode.Pencil });
          break;
        case "Delete":
        case "Backspace":
          deleteLayers();
          break;
        case "z": {
          if (e.ctrlKey || e.metaKey) {
            if (!e.shiftKey) {
              history.undo();
              break;
            } else {
              history.redo();
              break;
            }
          }
        }
        case "y": {
          if (e.ctrlKey || e.metaKey) {
            history.redo();
            break;
          }
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [deleteLayers, history]);

  ////

  let cursor = "default";
  switch (canvasState.mode) {
    case CanvasMode.Pan:
      cursor = "grab";
      break;
    case CanvasMode.Panning:
      cursor = "grabbing";
      break;
    case CanvasMode.Inserting:
      cursor = "crosshair";
      break;
    case CanvasMode.None:
      cursor = "default";
      break;
  }

  return (
    <main className="h-full w-full relative bg-neutral-100 touch-none">
      <Info boardId={boardId} />
      <Participants />
      <Toolbar canvasState={canvasState} setCanvasState={setCanvasState} canRedo={canRedo} canUndo={canUndo} undo={history.undo} redo={history.redo} />
      <SelectionTools camera={camera} setLastUsedColor={setLastUsedColor} />
      <svg
        style={{ cursor: cursor }}
        className="h-[100vh] w-[100vw] cur"
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <g style={{ transform: `translate(${camera.x}px, ${camera.y}px)` }}>
          {layerIds.map((layerId) => (
            <LayerPreview key={layerId} id={layerId} onLayerPointerDown={onLayerPointerDown} selectionColor={layerIdsToColorSelection[layerId]} />
          ))}
          <SelectionBox onResizeHandlePointerDown={onResizeHandlePointerDown} />
          {canvasState.mode === CanvasMode.SelectionNet && canvasState.current != null && (
            <rect
              className="fill-blue-500/5 stroke-blue-500 stroke-1"
              x={Math.min(canvasState.origin.x, canvasState.current.x)}
              y={Math.min(canvasState.origin.y, canvasState.current.y)}
              width={Math.abs(canvasState.origin.x - canvasState.current.x)}
              height={Math.abs(canvasState.origin.y - canvasState.current.y)}
            />
          )}
          <CursorsPresence />
          {pencilDraft != null && pencilDraft.length > 0 && <Path points={pencilDraft} fill={colorToCss(lastUsedColor)} x={0} y={0} />}
        </g>
      </svg>
    </main>
  );
}

export default Canvas;
