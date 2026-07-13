/* eslint-disable @typescript-eslint/no-explicit-any */
import BaseRenderer from "diagram-js/lib/draw/BaseRenderer";
import { getBusinessObject, is } from "bpmn-js/lib/util/ModelUtil";
import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
} from "tiny-svg";

const HIGH_PRIORITY = 1500;

const EVENT_COLORS: { match: string; stroke: string; width?: number }[] = [
  { match: "bpmn:StartEvent", stroke: "#0F9E7A" },
  { match: "bpmn:EndEvent", stroke: "#FF5722", width: 3 },
  { match: "bpmn:IntermediateCatchEvent", stroke: "#b45309" },
  { match: "bpmn:IntermediateThrowEvent", stroke: "#b45309" },
  { match: "bpmn:BoundaryEvent", stroke: "#b45309" },
];

/**
 * Wraps the stock bpmn renderer: default thin borders (thick when tagged),
 * distinct event colours, a plain-text step number top-right of activities, and
 * per-element text styling. All applied via inline SVG attrs so exports keep it.
 */
export class ProdrawRenderer extends BaseRenderer {
  static $inject = ["eventBus", "bpmnRenderer", "stepNumbering"];

  private _bpmn: any;
  private _steps: any;

  constructor(eventBus: any, bpmnRenderer: any, stepNumbering: any) {
    super(eventBus, HIGH_PRIORITY);
    this._bpmn = bpmnRenderer;
    this._steps = stepNumbering;
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
      if (rect)
        svgAttr(rect, {
          "stroke-width":
            bo && bo.get("prodraw:borderWeight") === "thick" ? 2.6 : 1.3,
        });
      const num = this._steps.getNumber(element);
      if (num != null) this._drawNumber(parent, element, num);
    }

    if (!isLabel) {
      const ev = EVENT_COLORS.find((e) => is(element, e.match));
      if (ev) {
        const circle = parent.querySelector("circle");
        if (circle) {
          const attrs: any = { stroke: ev.stroke };
          if (ev.width) attrs["stroke-width"] = ev.width;
          svgAttr(circle, attrs);
        }
      }
    }

    this._applyText(parent, bo);
    return shape;
  }

  drawConnection(parent: any, element: any): any {
    return this._bpmn.drawConnection(parent, element);
  }

  getShapePath(shape: any): any {
    return this._bpmn.getShapePath(shape);
  }

  getConnectionPath(connection: any): any {
    return this._bpmn.getConnectionPath(connection);
  }

  private _applyText(parent: any, bo: any) {
    if (!bo || !bo.get) return;
    const bold = bo.get("prodraw:textBold");
    const italic = bo.get("prodraw:textItalic");
    const underline = bo.get("prodraw:textUnderline");
    const color = bo.get("prodraw:textColor");
    const size = bo.get("prodraw:fontSize");
    if (!bold && !italic && !underline && !color && !size) return;
    const nodes = parent.querySelectorAll("text, tspan");
    nodes.forEach((n: any) => {
      if (bold) svgAttr(n, { "font-weight": "bold" });
      if (italic) svgAttr(n, { "font-style": "italic" });
      if (underline) svgAttr(n, { "text-decoration": "underline" });
      if (color) svgAttr(n, { fill: color });
      if (size) svgAttr(n, { "font-size": `${size}px` });
    });
  }

  private _drawNumber(parent: any, element: any, num: number) {
    const text = svgCreate("text");
    svgAttr(text, {
      x: element.width - 5,
      y: 13,
      "text-anchor": "end",
      "font-family": "system-ui, sans-serif",
      "font-size": "11px",
      "font-weight": "bold",
      fill: "#1d1c1a",
    });
    (text as any).style.pointerEvents = "none";
    text.textContent = String(num);
    svgAppend(parent, text);
  }
}
