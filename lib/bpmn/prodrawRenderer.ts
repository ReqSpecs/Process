/* eslint-disable @typescript-eslint/no-explicit-any */
import BaseRenderer from "diagram-js/lib/draw/BaseRenderer";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
} from "tiny-svg";
import { updateLine } from "diagram-js/lib/util/RenderUtil";
import {
  STENCIL_STYLES,
  type EventStyle,
  type Stencil,
  type StencilStyle,
} from "./stencil";

const HIGH_PRIORITY = 1500;

/**
 * Wraps the stock bpmn renderer: default thin borders (thick when tagged),
 * distinct event colours, a plain-text step number top-right of activities, and
 * per-element text styling. All applied via inline SVG attrs so exports keep it.
 * The active stencil (injected as `stencilMode`) selects the colour scheme.
 */
export class ProdrawRenderer extends BaseRenderer {
  static $inject = [
    "eventBus",
    "bpmnRenderer",
    "stepNumbering",
    "stencilMode",
    "canvas",
  ];

  private _bpmn: any;
  private _steps: any;
  private _style: StencilStyle;
  private _canvas: any;

  constructor(
    eventBus: any,
    bpmnRenderer: any,
    stepNumbering: any,
    stencilMode: Stencil,
    canvas: any,
  ) {
    super(eventBus, HIGH_PRIORITY);
    this._bpmn = bpmnRenderer;
    this._steps = stepNumbering;
    this._style = STENCIL_STYLES[stencilMode] ?? STENCIL_STYLES.classic;
    this._canvas = canvas;
  }

  canRender(element: any): boolean {
    return is(element, "bpmn:BaseElement");
  }

  drawShape(parent: any, element: any): any {
    const shape = this._bpmn.drawShape(parent, element);
    const isLabel = !!element.labelTarget;
    const bo = getBusinessObject(element.labelTarget || element);

    if (!isLabel && is(element, "bpmn:Activity")) {
      const rect = parent.querySelector("rect");
      if (rect) {
        // Diagram-wide border weight (on <definitions>) wins; fall back to a
        // legacy per-shape attr, then the stencil's default (thin).
        const diagramW = this._diagramWeight();
        const own = bo && bo.get("prodraw:borderWeight");
        const weight = diagramW ?? (own === "thick" ? "thick" : "thin");
        const attrs: any = {
          "stroke-width": weight === "thick" ? 2.6 : this._style.taskBorderWidth,
        };
        if (this._style.taskStroke) attrs.stroke = this._style.taskStroke;
        svgAttr(rect, attrs);
      }
      const num = this._steps.getNumber(element);
      if (num != null) this._drawNumber(parent, element, num);

      // The stock manual-task "hand" marker reads too wide; squash it
      // horizontally (anchored at its left edge) for a more natural hand.
      if (is(element, "bpmn:ManualTask")) {
        parent.querySelectorAll("path").forEach((p: any) => {
          p.style.transformBox = "fill-box";
          p.style.transformOrigin = "left center";
          p.style.transform = "scaleX(0.72)";
        });
      }
    }

    // Groups: match the task's blue styling with a light, clean dashed outline
    // (replacing the stock dash-dot look).
    if (!isLabel && is(element, "bpmn:Group")) {
      const rect = parent.querySelector("rect");
      if (rect) {
        svgAttr(rect, {
          stroke: this._style.taskStroke || "#29a8e6",
          "stroke-width": this._style.taskBorderWidth,
          "stroke-dasharray": "6 4",
          "stroke-linecap": "round",
        });
      }
    }

    if (!isLabel) {
      const ev = this._style.events.find((e) => is(element, e.match));
      if (ev) {
        const circles: any[] = Array.from(parent.querySelectorAll("circle"));
        // Colour every ring; leave fill untouched for ring-only events so the
        // centre stays white (e.g. intermediate double ring).
        const strokeAttrs: any = { stroke: ev.stroke };
        if (ev.width) strokeAttrs["stroke-width"] = ev.width;
        circles.forEach((c) => svgAttr(c, strokeAttrs));

        const outer = circles[0];
        if (outer && ev.fillTo) {
          const gradId = this._ensureGradient(parent, ev);
          svgAttr(outer, { fill: `url(#${gradId})` });
        } else {
          // Ring-only events: solid white centre so the drop shadow projects
          // outside only (no shadow bleeding through the middle).
          circles.forEach((c) => svgAttr(c, { fill: "#ffffff" }));
        }
        if (outer && this._style.eventShadow) {
          // Apply only to the outer ring so double-ring events (intermediate)
          // don't get an inner shadow on the inner circle.
          outer.style.filter = "drop-shadow(0 1.5px 1.5px rgba(15,23,42,0.35))";
        }
      }
    }

    // User fill override (ribbon colour picker). Applied last so it wins over
    // stencil event fills; "none" means transparent (no fill).
    if (!isLabel && bo?.get) {
      const fill = bo.get("prodraw:fillColor");
      if (fill) {
        const bg = parent.querySelector("rect, circle, polygon, path");
        if (bg) svgAttr(bg, { fill });
      }
    }

    this._applyText(parent, bo, element);
    return shape;
  }

  drawConnection(parent: any, element: any): any {
    const gfx = this._bpmn.drawConnection(parent, element);
    const bo = getBusinessObject(element);
    // The bpmn renderer returns the line path itself; fall back to a query.
    const line =
      gfx && gfx.tagName === "path"
        ? gfx
        : parent.querySelector?.("path:not([data-marker])") ||
          parent.querySelector?.("path");
    if (line) {
      // Corner style: bpmn draws connections with a 5px radius by default. The
      // ribbon toggles diagram-wide between a sharp point (0) and a rounded bend
      // (legacy per-flow attr honoured as fallback).
      const corner =
        this._diagramCornerStyle() ?? bo?.get?.("prodraw:cornerStyle");
      if (corner && element.waypoints) {
        // "round" matches bpmn's stock 5px bend (a freshly dragged flow);
        // "sharp" is a hard 0px corner.
        line.dataset.cornerRadius = corner === "round" ? "5" : "0";
        line.style.strokeLinejoin = corner === "round" ? "round" : "miter";
        updateLine(line, element.waypoints);
      }
      // Thin / thick connector weight (arrowheads scale with stroke width).
      // Diagram-wide setting on <definitions> wins, with a legacy per-flow attr
      // as fallback. Thick keeps bpmn's default flow width (2); thin matches the
      // thin task border for the active stencil.
      const weight =
        this._diagramConnectorWeight() ?? bo?.get?.("prodraw:connectorWeight");
      if (weight) {
        svgAttr(line, {
          "stroke-width": weight === "thick" ? 2 : this._style.taskBorderWidth,
        });
      }
    }
    return gfx;
  }

  getShapePath(shape: any): any {
    return this._bpmn.getShapePath(shape);
  }

  getConnectionPath(connection: any): any {
    return this._bpmn.getConnectionPath(connection);
  }

  private _applyText(parent: any, bo: any, element?: any) {
    if (!bo || !bo.get) return;
    const bold = bo.get("prodraw:textBold");
    const italic = bo.get("prodraw:textItalic");
    const underline = bo.get("prodraw:textUnderline");
    const color = bo.get("prodraw:textColor");
    const size = bo.get("prodraw:fontSize");
    if (!bold && !italic && !underline && !color && !size) return;
    const nodes = parent.querySelectorAll("text, tspan");
    nodes.forEach((n: any) => {
      // Never restyle the step-number badge — it stays fixed regardless of the
      // element's font settings.
      if (
        n.classList?.contains("prodraw-step") ||
        n.closest?.(".prodraw-step")
      )
        return;
      if (bold) svgAttr(n, { "font-weight": "bold" });
      if (italic) svgAttr(n, { "font-style": "italic" });
      if (underline) svgAttr(n, { "text-decoration": "underline" });
      if (color) svgAttr(n, { fill: color });
      if (size) svgAttr(n, { "font-size": `${size}px` });
    });

    // Keep centred labels centred as the font grows. diagram-js lays out
    // centred text by pinning each tspan's x to the line's LEFT edge and its y
    // to a baseline both computed at the DEFAULT font size. When we enlarge or
    // shrink the text the glyphs grow rightward from that fixed left edge (so
    // the label drifts right) and the fixed baselines make the lines overlap
    // (bigger) or spread out (smaller). Re-anchor horizontally to the box
    // centre and re-space the baselines to the new font's line height.
    this._recenterText(parent, element, size ? Number(size) : null);
  }

  /**
   * Re-anchors centred labels (tasks, events, gateways) to their box centre and,
   * when a custom font size is set, evenly re-spaces the lines for that size.
   */
  private _recenterText(parent: any, element: any, size: number | null) {
    if (!element) return;
    const centred =
      is(element, "bpmn:Activity") ||
      is(element, "bpmn:Event") ||
      is(element, "bpmn:Gateway");
    if (!centred) return;

    const cx = (element.width || 0) / 2;
    const h = element.height || 0;
    // diagram-js uses lineHeight = ratio(1.2) * fontSize; mirror that so the
    // vertical rhythm scales with the chosen size instead of the default 12px.
    const lh = size ? size * 1.2 : 0;
    // Task labels are centred vertically (center-middle); external event /
    // gateway labels flow from the top (center-top). Match each so lines land
    // where diagram-js would have put them at the new size.
    const isExternal = !!element.labelTarget;

    parent.querySelectorAll("text").forEach((t: any) => {
      if (
        t.classList?.contains("prodraw-step") ||
        t.closest?.(".prodraw-step")
      )
        return;

      svgAttr(t, { "text-anchor": "middle" });
      if (t.hasAttribute?.("x")) svgAttr(t, { x: cx });

      const spans = Array.from(t.querySelectorAll("tspan")) as any[];
      spans.forEach((sp) => svgAttr(sp, { x: cx }));

      if (lh && spans.length) {
        const n = spans.length;
        // Start baseline: center-middle centres the block in the box; center-top
        // starts at the top. Both then apply diagram-js's -lh/4 magic offset.
        let y = (isExternal ? 0 : (h - n * lh) / 2) - lh / 4;
        spans.forEach((sp) => {
          y += lh;
          svgAttr(sp, { y });
        });
      }
    });
  }

  /** Diagram-wide border weight stored on <definitions>, or null if unset. */
  private _diagramWeight(): "thin" | "thick" | null {
    try {
      const defs = this._canvas?.getRootElement?.()?.businessObject?.$parent;
      const w = defs?.get?.("prodraw:defaultBorderWeight");
      return w === "thick" ? "thick" : w === "thin" ? "thin" : null;
    } catch {
      return null;
    }
  }

  /** Diagram-wide connector weight stored on <definitions>, or null if unset. */
  private _diagramConnectorWeight(): "thin" | "thick" | null {
    try {
      const defs = this._canvas?.getRootElement?.()?.businessObject?.$parent;
      const w = defs?.get?.("prodraw:defaultConnectorWeight");
      return w === "thick" ? "thick" : w === "thin" ? "thin" : null;
    } catch {
      return null;
    }
  }

  /** Diagram-wide connector corner style on <definitions>, or null if unset. */
  private _diagramCornerStyle(): "sharp" | "round" | null {
    try {
      const defs = this._canvas?.getRootElement?.()?.businessObject?.$parent;
      const c = defs?.get?.("prodraw:defaultCornerStyle");
      return c === "sharp" ? "sharp" : c === "round" ? "round" : null;
    } catch {
      return null;
    }
  }

  /** Finds (or creates) a shared <defs> in the owning SVG for gradients/filters. */
  private _defs(parent: any): any {
    // Prefer the always-attached canvas SVG: during initial import the element's
    // own group isn't attached yet (ownerSVGElement is null), which previously
    // left events hollow until a later repaint.
    const svg =
      this._canvas?.getContainer?.()?.querySelector?.("svg") ||
      parent?.ownerSVGElement ||
      parent?.closest?.("svg");
    if (!svg) return null;
    let defs = svg.querySelector("defs.prodraw-defs");
    if (!defs) {
      defs = svgCreate("defs");
      svgAttr(defs, { class: "prodraw-defs" });
      svg.insertBefore(defs, svg.firstChild);
    }
    return defs;
  }

  private _ensureGradient(parent: any, ev: EventStyle): string {
    const id = `prodraw-grad-${ev.match.replace(/[^a-z]/gi, "")}`;
    const defs = this._defs(parent);
    if (defs && !defs.querySelector(`#${id}`)) {
      const grad = svgCreate("linearGradient");
      svgAttr(grad, { id, x1: "0", y1: "0", x2: "0", y2: "1" });
      const s1 = svgCreate("stop");
      svgAttr(s1, { offset: "0%", "stop-color": ev.fillFrom });
      const s2 = svgCreate("stop");
      svgAttr(s2, { offset: "100%", "stop-color": ev.fillTo });
      svgAppend(grad, s1);
      svgAppend(grad, s2);
      svgAppend(defs, grad);
    }
    return id;
  }

  private _drawNumber(parent: any, element: any, num: number) {
    const text = svgCreate("text");
    svgAttr(text, {
      class: "prodraw-step",
      x: element.width - 5,
      y: 13,
      "text-anchor": "end",
      "font-family": "system-ui, sans-serif",
      "font-size": "11px",
      "font-weight": "normal",
      fill: "#1d1c1a",
    });
    (text as any).style.pointerEvents = "none";
    text.textContent = String(num);
    svgAppend(parent, text);
  }
}
