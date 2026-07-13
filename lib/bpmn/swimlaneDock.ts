/* eslint-disable @typescript-eslint/no-explicit-any */
import { is } from "bpmn-js/lib/util/ModelUtil";

/**
 * Docks swimlane participants: when a swimlane is dropped near another's top or
 * bottom edge, align x/width and snap flush so their borders merge into a stack.
 */
const SNAP = 40;

function isSwimlane(el: any): boolean {
  return !!(
    el &&
    is(el, "bpmn:Participant") &&
    el.businessObject &&
    el.businessObject.get &&
    el.businessObject.get("prodraw:swimlane")
  );
}

export class SwimlaneDock {
  static $inject = ["eventBus", "modeling", "elementRegistry"];

  private _modeling: any;
  private _er: any;
  private _busy = false;

  constructor(eventBus: any, modeling: any, elementRegistry: any) {
    this._modeling = modeling;
    this._er = elementRegistry;
    eventBus.on(
      [
        "commandStack.shape.move.postExecuted",
        "commandStack.shape.create.postExecuted",
      ],
      (e: any) => this._dock(e),
    );
  }

  private _dock(e: any) {
    if (this._busy) return;
    const shape = e && e.context && e.context.shape;
    if (!isSwimlane(shape)) return;

    const other = this._nearest(shape);
    if (!other) return;

    this._busy = true;
    try {
      if (shape.x !== other.x || shape.width !== other.width) {
        this._modeling.resizeShape(shape, {
          x: other.x,
          y: shape.y,
          width: other.width,
          height: shape.height,
        });
      }
      const gapBelow = Math.abs(shape.y - (other.y + other.height));
      const gapAbove = Math.abs(shape.y + shape.height - other.y);
      const dy =
        gapBelow <= gapAbove
          ? other.y + other.height - shape.y
          : other.y - (shape.y + shape.height);
      if (dy) this._modeling.moveShape(shape, { x: 0, y: dy });
    } finally {
      this._busy = false;
    }
  }

  private _nearest(shape: any): any {
    const others = this._er.filter(
      (el: any) => isSwimlane(el) && el.id !== shape.id,
    );
    let best: any = null;
    let bestDist = SNAP;
    for (const o of others) {
      const overlapX = shape.x < o.x + o.width && shape.x + shape.width > o.x;
      if (!overlapX) continue;
      const d = Math.min(
        Math.abs(shape.y - (o.y + o.height)),
        Math.abs(shape.y + shape.height - o.y),
      );
      if (d <= bestDist) {
        bestDist = d;
        best = o;
      }
    }
    return best;
  }
}
