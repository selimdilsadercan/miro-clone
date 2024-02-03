import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { NoteLayer } from "@/types";
import { calculateFontSize, cn, colorToCss, getContrastingTextColor } from "@/lib/utils";
import { useMutation } from "@/liveblocks.config";
import { Kalam } from "next/font/google";
const font = Kalam({ subsets: ["latin"], weight: ["400"] });

interface Props {
  id: string;
  layer: NoteLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

function Note({ layer, onPointerDown, id, selectionColor }: Props) {
  const { x, y, width, height, fill, value } = layer;

  const updateValue = useMutation(({ storage }, newValue: string) => {
    const liveLayers = storage.get("layers");

    liveLayers.get(id)?.set("value", newValue);
  }, []);

  const handleContentChange = (e: ContentEditableEvent) => {
    updateValue(e.target.value);
  };

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={(e) => onPointerDown(e, id)}
      style={{ outline: selectionColor ? `1px solid ${selectionColor}` : "none", backgroundColor: fill ? colorToCss(fill) : "#000" }}
      className="shadow-md drop-shadow-xl"
    >
      <ContentEditable
        html={value || "Text"}
        onChange={handleContentChange}
        className={cn("h-full w-full flex items-center justify-center text-center outline-none", font.className)}
        style={{ fontSize: calculateFontSize(width, height), color: fill ? getContrastingTextColor(fill) : "#000" }}
      />
    </foreignObject>
  );
}

export default Note;
