/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "@/components/app/bpmn-theme.css";
import {
  prodrawModdleDescriptor,
  prodrawModelerModule,
  prodrawViewerModule,
} from "@/lib/bpmn/prodrawModules";

type Modeler = {
  importXML: (xml: string) => Promise<{ warnings: unknown[] }>;
  saveXML: (options: { format: boolean }) => Promise<{ xml?: string }>;
  saveSVG: () => Promise<{ svg: string }>;
  on: (event: string, callback: (e?: any) => void) => void;
  off: (event: string, callback: (e?: any) => void) => void;
  get: (module: string) => any;
  destroy: () => void;
};

export type SelectionSummary = {
  count: number;
  hasShape: boolean;
  hasConnection: boolean;
  borderWeight: "thin" | "thick" | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize: number | null;
};

export type TextStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
};

export type BpmnApi = {
  getXml: () => Promise<string | undefined>;
  getSvg: () => Promise<string>;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomFit: () => void;
  undo: () => void;
  redo: () => void;
  setBorderWeight: (weight: "thin" | "thick") => void;
  setTextStyle: (style: TextStyle) => void;
  bumpFontSize: (delta: number) => void;
  setFill: (color: string | null) => void;
  align: (type: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  distribute: (orientation: "horizontal" | "vertical") => void;
  matchSize: (dim: "width" | "height" | "both") => void;
  setConnectorLayout: (mode: "straight" | "orthogonal") => void;
  copyFormat: () => void;
  applyFormat: () => void;
  duplicate: () => void;
};

const EMPTY_SUMMARY: SelectionSummary = {
  count: 0,
  hasShape: false,
  hasConnection: false,
  borderWeight: null,
  bold: false,
  italic: false,
  underline: false,
  fontSize: null,
};

export function BpmnCanvas({
  xml,
  readOnly,
  onChange,
  onReady,
  onSelectionChange,
}: {
  xml: string;
  readOnly: boolean;
  onChange: () => void;
  onReady: (api: BpmnApi) => void;
  onSelectionChange?: (summary: SelectionSummary) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<Modeler | null>(null);
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  const onSelRef = useRef(onSelectionChange);
  onChangeRef.current = onChange;
  onReadyRef.current = onReady;
  onSelRef.current = onSelectionChange;

  useEffect(() => {
    let cancelled = false;
    let modeler: Modeler | null = null;

    async function init() {
      const container = containerRef.current;
      if (!container) return;

      const { default: BpmnModeler } = await import("bpmn-js/lib/Modeler");
      const { default: BpmnViewer } = await import(
        "bpmn-js/lib/NavigatedViewer"
      );
      if (cancelled) return;

      const Ctor = (readOnly ? BpmnViewer : BpmnModeler) as unknown as new (
        options: {
          container: HTMLElement;
          additionalModules?: unknown[];
          moddleExtensions?: Record<string, unknown>;
        },
      ) => Modeler;

      modeler = new Ctor({
        container,
        additionalModules: [
          readOnly ? prodrawViewerModule : prodrawModelerModule,
        ],
        moddleExtensions: { prodraw: prodrawModdleDescriptor },
      });
      modelerRef.current = modeler;

      try {
        await modeler.importXML(xml);
        modeler.get("canvas").zoom("fit-viewport");
      } catch (err) {
        console.error("BPMN import failed", err);
      }
      if (cancelled) return;

      if (!readOnly) {
        modeler.on("commandStack.changed", () => onChangeRef.current());
      }

      const m = modeler;
      const svc = (name: string) => {
        try {
          return m.get(name);
        } catch {
          return null;
        }
      };
      const canvas = () => m.get("canvas");
      const zoomStep = (dir: 1 | -1) => {
        const current = canvas().zoom(undefined as unknown as number);
        canvas().zoom(Math.max(0.2, Math.min(4, current + dir * 0.15)));
      };

      const modeling = () => svc("modeling");
      const selection = () => svc("selection");
      const selected = (): any[] => selection()?.get() ?? [];
      const isShape = (el: any) => el && !el.waypoints;
      const isConnection = (el: any) => el && !!el.waypoints;
      const bo = (el: any) => el?.businessObject;

      const updateModdle = (el: any, props: Record<string, unknown>) => {
        const mod = modeling();
        if (mod && bo(el)) mod.updateModdleProperties(el, bo(el), props);
      };

      // format painter clipboard
      let fmt: Record<string, unknown> | null = null;

      if (onSelRef.current) {
        const emit = () => {
          const els = selected();
          if (els.length === 0) {
            onSelRef.current?.(EMPTY_SUMMARY);
            return;
          }
          const primary = els[0];
          const pbo = bo(primary);
          onSelRef.current?.({
            count: els.length,
            hasShape: els.some(isShape),
            hasConnection: els.some(isConnection),
            borderWeight:
              (pbo?.get?.("prodraw:borderWeight") as "thin" | "thick") ?? null,
            bold: !!pbo?.get?.("prodraw:textBold"),
            italic: !!pbo?.get?.("prodraw:textItalic"),
            underline: !!pbo?.get?.("prodraw:textUnderline"),
            fontSize: (pbo?.get?.("prodraw:fontSize") as number) ?? null,
          });
        };
        m.on("selection.changed", emit);
      }

      onReadyRef.current({
        getXml: async () => {
          const { xml: out } = await m.saveXML({ format: true });
          return out;
        },
        getSvg: async () => {
          const { svg } = await m.saveSVG();
          return svg;
        },
        zoomIn: () => zoomStep(1),
        zoomOut: () => zoomStep(-1),
        zoomFit: () => void canvas().zoom("fit-viewport"),
        undo: () => svc("commandStack")?.undo(),
        redo: () => svc("commandStack")?.redo(),

        setBorderWeight: (weight) =>
          selected()
            .filter(isShape)
            .forEach((el) => updateModdle(el, { "prodraw:borderWeight": weight })),

        setTextStyle: (style) =>
          selected().forEach((el) => {
            const props: Record<string, unknown> = {};
            if (style.bold !== undefined) props["prodraw:textBold"] = style.bold;
            if (style.italic !== undefined)
              props["prodraw:textItalic"] = style.italic;
            if (style.underline !== undefined)
              props["prodraw:textUnderline"] = style.underline;
            if (style.color !== undefined)
              props["prodraw:textColor"] = style.color;
            if (Object.keys(props).length) updateModdle(el, props);
          }),

        bumpFontSize: (delta) =>
          selected().forEach((el) => {
            const cur = (bo(el)?.get?.("prodraw:fontSize") as number) || 12;
            const next = Math.max(6, Math.min(48, cur + delta));
            updateModdle(el, { "prodraw:fontSize": next });
          }),

        setFill: (color) => {
          const mod = modeling();
          const els = selected().filter(isShape);
          if (mod && els.length) mod.setColor(els, { fill: color ?? undefined });
        },

        align: (type) => {
          const els = selected().filter(isShape);
          if (els.length >= 2) svc("alignElements")?.trigger(els, type);
        },

        distribute: (orientation) => {
          const els = selected().filter(isShape);
          if (els.length >= 3) svc("distributeElements")?.trigger(els, orientation);
        },

        matchSize: (dim) => {
          const mod = modeling();
          const els = selected().filter(isShape);
          if (!mod || els.length < 2) return;
          const ref = els[0];
          els.slice(1).forEach((el) => {
            const bounds = { x: el.x, y: el.y, width: el.width, height: el.height };
            if (dim === "width" || dim === "both") bounds.width = ref.width;
            if (dim === "height" || dim === "both") bounds.height = ref.height;
            mod.resizeShape(el, bounds);
          });
        },

        setConnectorLayout: (mode) => {
          const mod = modeling();
          if (!mod) return;
          selected()
            .filter(isConnection)
            .forEach((conn) => {
              if (mode === "straight" && conn.source && conn.target) {
                const mid = (el: any) => ({
                  x: el.x + el.width / 2,
                  y: el.y + el.height / 2,
                });
                mod.updateWaypoints(conn, [mid(conn.source), mid(conn.target)]);
              } else {
                mod.layoutConnection(conn);
              }
            });
        },

        copyFormat: () => {
          const el = selected()[0];
          const b = bo(el);
          if (!b?.get) return;
          fmt = {
            "prodraw:borderWeight": b.get("prodraw:borderWeight") ?? null,
            "prodraw:textBold": !!b.get("prodraw:textBold"),
            "prodraw:textItalic": !!b.get("prodraw:textItalic"),
            "prodraw:textUnderline": !!b.get("prodraw:textUnderline"),
            "prodraw:textColor": b.get("prodraw:textColor") ?? null,
            "prodraw:fontSize": b.get("prodraw:fontSize") ?? null,
          };
        },

        applyFormat: () => {
          if (!fmt) return;
          selected().forEach((el) => updateModdle(el, fmt as Record<string, unknown>));
        },

        duplicate: () => {
          const cp = svc("copyPaste");
          const els = selected();
          if (!cp || !els.length) return;
          cp.copy(els);
          cp.paste({
            element: canvas().getRootElement(),
            point: { x: els[0].x + (els[0].width || 40) + 40, y: els[0].y + 20 },
          });
        },
      });
    }

    init();

    return () => {
      cancelled = true;
      modeler?.destroy();
      modelerRef.current = null;
    };
    // The canvas owns the XML after mount; autosave reads back via getXml.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  return <div ref={containerRef} className="h-full w-full" />;
}
