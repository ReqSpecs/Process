/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";
import { is } from "bpmn-js/lib/util/ModelUtil";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "@/components/app/bpmn-theme.css";
import {
  makeProdrawModelerModule,
  makeProdrawViewerModule,
  prodrawModdleDescriptor,
} from "@/lib/bpmn/prodrawModules";
import type { Stencil } from "@/lib/bpmn/stencil";

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
  setFontSize: (size: number) => void;
  setFill: (color: string | null) => void;
  align: (type: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  distribute: (orientation: "horizontal" | "vertical") => void;
  matchSize: (dim: "width" | "height" | "both") => void;
  setConnectorCorner: (mode: "sharp" | "round") => void;
  setConnectorWeight: (mode: "thin" | "thick") => void;
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
  stencil,
  onChange,
  onReady,
  onSelectionChange,
}: {
  xml: string;
  readOnly: boolean;
  stencil: Stencil;
  onChange: () => void;
  onReady: (api: BpmnApi) => void;
  onSelectionChange?: (summary: SelectionSummary) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<Modeler | null>(null);
  const onChangeRef = useRef(onChange);
  const onReadyRef = useRef(onReady);
  const onSelRef = useRef(onSelectionChange);
  const xmlRef = useRef(xml);
  onChangeRef.current = onChange;
  onReadyRef.current = onReady;
  onSelRef.current = onSelectionChange;
  // Always import the latest XML on (re)init — e.g. when the stencil switches,
  // the parent passes the current diagram so edits are preserved.
  xmlRef.current = xml;

  useEffect(() => {
    let cancelled = false;
    let modeler: Modeler | null = null;

    async function init() {
      const container = containerRef.current;
      if (!container) return;

      // Tag the container so palette icons can be tinted per-stencil via CSS.
      container.classList.toggle("prodraw-essentials", stencil === "essentials");
      container.classList.toggle("prodraw-classic", stencil !== "essentials");

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
          readOnly
            ? makeProdrawViewerModule(stencil)
            : makeProdrawModelerModule(stencil),
        ],
        moddleExtensions: { prodraw: prodrawModdleDescriptor },
      });
      modelerRef.current = modeler;

      try {
        await modeler.importXML(xmlRef.current);
        // "auto" centers the diagram in the viewport — without it diagram-js
        // pins the content to the top-left corner (under the palette).
        modeler.get("canvas").zoom("fit-viewport", "auto");
        // Stamp the active stencil onto <definitions> so it persists on save.
        const root = modeler.get("canvas").getRootElement?.();
        const defs = root?.businessObject?.$parent;
        if (defs?.set) defs.set("prodraw:stencil", stencil);
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

      // Walk up from the root to the <definitions> element (robust across plain
      // process vs collaboration roots). Diagram-wide defaults live here.
      const getDefinitions = () => {
        let node: any = canvas().getRootElement?.()?.businessObject;
        while (node && node.$type !== "bpmn:Definitions") node = node.$parent;
        return node ?? null;
      };

      const updateModdle = (el: any, props: Record<string, unknown>) => {
        const mod = modeling();
        if (mod && bo(el)) mod.updateModdleProperties(el, bo(el), props);
      };

      // Text/size props live on the semantic element, but events/gateways/flows
      // render their text on a separate external label that won't repaint on its
      // own — so force it after updating.
      const styleText = (el: any, props: Record<string, unknown>) => {
        updateModdle(el, props);
        const label = el.label;
        if (!label) return;
        const gf = svc("graphicsFactory");
        const gfx = svc("elementRegistry")?.getGraphics(label);
        if (gf && gfx) {
          try {
            gf.update("shape", label, gfx);
          } catch {
            /* best effort */
          }
        }
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
        // Also refresh after edits so ribbon toggles (bold, size, …) reflect the
        // new state — otherwise they read stale values and only fire once.
        m.on("element.changed", emit);
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
        zoomFit: () => void canvas().zoom("fit-viewport", "auto"),
        undo: () => svc("commandStack")?.undo(),
        redo: () => svc("commandStack")?.redo(),

        setBorderWeight: (weight) => {
          // Record the diagram default (new shapes inherit it) AND stamp every
          // existing activity via the modeling command so the value lives on each
          // element — this persists through the normal save/undo path and survives
          // reload, rather than relying on a fragile read off <definitions>.
          const defs = getDefinitions();
          if (defs?.set) defs.set("prodraw:defaultBorderWeight", weight);
          const mod = modeling();
          const er = svc("elementRegistry");
          er?.getAll?.().forEach((el: any) => {
            if (!el.waypoints && bo(el) && is(el, "bpmn:Activity") && mod) {
              mod.updateModdleProperties(el, bo(el), {
                "prodraw:borderWeight": weight,
              });
            }
          });
          onChangeRef.current();
        },

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
            if (Object.keys(props).length) styleText(el, props);
          }),

        bumpFontSize: (delta) =>
          selected().forEach((el) => {
            const cur = (bo(el)?.get?.("prodraw:fontSize") as number) || 12;
            const next = Math.max(6, Math.min(96, cur + delta));
            styleText(el, { "prodraw:fontSize": next });
          }),

        setFontSize: (size) => {
          const next = Math.max(6, Math.min(96, Math.round(size)));
          selected().forEach((el) =>
            styleText(el, { "prodraw:fontSize": next }),
          );
        },

        setFill: (color) =>
          selected()
            .filter(isShape)
            .forEach((el) => updateModdle(el, { "prodraw:fillColor": color })),

        align: (type) => {
          const mod = modeling();
          const els = selected().filter(isShape);
          if (!mod || els.length < 2) return;
          // Align to the FIRST-selected object (its edge/centre) rather than the
          // group's outer bounds, matching PowerPoint/Visio behaviour.
          const ref = els[0];
          const value =
            type === "left"
              ? ref.x
              : type === "right"
                ? ref.x + ref.width
                : type === "center"
                  ? ref.x + Math.round(ref.width / 2)
                  : type === "top"
                    ? ref.y
                    : type === "bottom"
                      ? ref.y + ref.height
                      : ref.y + Math.round(ref.height / 2); // middle
          mod.alignElements(els, { [type]: value });
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

        setConnectorCorner: (mode) => {
          // Record the diagram default (new flows inherit it) AND stamp every
          // existing connection so the choice lives on each flow — persists via
          // the normal save/undo path and survives reload, and uniformly clears
          // any earlier per-flow sharp/round mix.
          const defs = getDefinitions();
          if (defs?.set) defs.set("prodraw:defaultCornerStyle", mode);
          const mod = modeling();
          const er = svc("elementRegistry");
          er?.getAll?.().forEach((el: any) => {
            if (el.waypoints && bo(el) && mod) {
              mod.updateModdleProperties(el, bo(el), {
                "prodraw:cornerStyle": mode,
              });
            }
          });
          onChangeRef.current();
        },

        setConnectorWeight: (weight) => {
          const defs = getDefinitions();
          if (defs?.set) defs.set("prodraw:defaultConnectorWeight", weight);
          const mod = modeling();
          const er = svc("elementRegistry");
          er?.getAll?.().forEach((el: any) => {
            if (el.waypoints && bo(el) && mod) {
              mod.updateModdleProperties(el, bo(el), {
                "prodraw:connectorWeight": weight,
              });
            }
          });
          onChangeRef.current();
        },

        copyFormat: () => {
          const el = selected()[0];
          const b = bo(el);
          if (!b?.get) return;
          // Capture the whole visual style of the object (fill + border + all
          // text styling), not just fonts, so paste reproduces the full look.
          fmt = {
            "prodraw:fillColor": b.get("prodraw:fillColor") ?? null,
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
          const srcFill = (fmt["prodraw:fillColor"] as string | null) ?? null;
          // styleText writes the props and repaints the element (and its external
          // label, for events/gateways) so fill + text style apply immediately.
          selected().forEach((el) => {
            // Resolve the fill per target. A null source fill means "no custom
            // fill". For solid shapes (tasks/gateways) paste an explicit white so
            // the target reliably becomes white — clearing to null can otherwise
            // fall through to the stock grey default and look wrong.
            const solid = isShape(el) && !is(el, "bpmn:Event");
            const fillForEl = srcFill != null ? srcFill : solid ? "#ffffff" : null;
            styleText(el, {
              ...(fmt as Record<string, unknown>),
              "prodraw:fillColor": fillForEl,
            });
          });
        },

        duplicate: () => {
          const cp = svc("copyPaste");
          const sel = svc("selection");
          const els = selected();
          if (!cp || !els.length) return;
          // Anchor the copy just to the right of the current selection's bounds
          // and re-select it, so repeated duplicates cascade rather than stack.
          const shapes = els.filter(isShape);
          const ref = shapes.length ? shapes : els;
          const right = Math.max(...ref.map((e) => (e.x ?? 0) + (e.width ?? 0)));
          const left = Math.min(...ref.map((e) => e.x ?? 0));
          const top = Math.min(...ref.map((e) => e.y ?? 0));
          const bottom = Math.max(
            ...ref.map((e) => (e.y ?? 0) + (e.height ?? 0)),
          );
          const bw = right - left;
          const bh = bottom - top;
          cp.copy(els);
          const created = cp.paste({
            element: canvas().getRootElement(),
            // paste centres the copied bbox on `point`; offset one gap right.
            point: { x: right + 40 + bw / 2, y: top + bh / 2 },
          });
          if (created && sel?.select)
            sel.select(Array.isArray(created) ? created : [created]);
        },
      });
    }

    init();

    // Undo/redo shortcuts. bpmn's own keyboard is bound to the canvas container
    // and handles Ctrl/Cmd+Z / Y while focus is inside the canvas. This
    // document-level handler covers the rest of the page (e.g. after clicking a
    // ribbon button) and defers to bpmn's keyboard for in-canvas events so a
    // single keystroke never triggers two undos.
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key?.toLowerCase();
      if (key !== "z" && key !== "y") return;
      const t = e.target as HTMLElement | null;
      // When focus is inside the canvas, bpmn's own keyboard handles undo/redo
      // (and correctly skips label editing) — acting here too would double-undo.
      if (t && t.closest?.(".djs-container")) return;
      // Outside the canvas, skip real text fields (process name, owner, ...).
      const isTextEditing =
        !!t &&
        (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName));
      if (isTextEditing) return;
      const cs = modelerRef.current?.get?.("commandStack");
      if (!cs) return;
      const redo = key === "y" || (key === "z" && e.shiftKey);
      if (redo) {
        if (cs.canRedo?.() ?? true) cs.redo?.();
      } else if (cs.canUndo?.() ?? true) {
        cs.undo?.();
      }
      e.preventDefault();
    };
    if (!readOnly) document.addEventListener("keydown", onKeyDown, true);

    return () => {
      cancelled = true;
      document.removeEventListener("keydown", onKeyDown, true);
      modeler?.destroy();
      modelerRef.current = null;
    };
    // The canvas owns the XML after mount; autosave reads back via getXml.
    // Re-inits on stencil change (parent supplies the current XML via xmlRef).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, stencil]);

  return <div ref={containerRef} className="h-full w-full" />;
}
