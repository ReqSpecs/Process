/* eslint-disable @typescript-eslint/no-explicit-any */
import { is } from "bpmn-js/lib/util/ModelUtil";
import {
  create as svgCreate,
  attr as svgAttr,
  append as svgAppend,
  clear as svgClear,
} from "tiny-svg";

/**
 * Docks swimlane participants into a vertical stack:
 *  - dropping a pool near another's edge snaps it flush and matches its
 *    width + height, so lanes look even;
 *  - dropping between two lanes inserts it and pushes the lanes apart instead
 *    of overlapping; relocating a lane also closes the gap it left behind;
 *  - resizing one lane's width (length) extends every lane in the stack so they
 *    behave as one, while height stays independent per lane — growing a lane
 *    (manually or via auto-expand around a new object) pushes the lanes below
 *    it down so the stack always stays flush;
 *  - a green preview shows where the pool will dock while dragging (from the
 *    canvas or straight from the palette).
 */
const SNAP = 40;
const EPS = 3;
const SNAP_LAYER = "prodraw-swimlane-snap";
const SNAP_GREEN = "#22c55e";

type Bounds = { x: number; y: number; width: number; height: number };

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
  static $inject = ["eventBus", "modeling", "elementRegistry", "canvas"];

  private _modeling: any;
  private _er: any;
  private _canvas: any;
  private _busy = false;

  constructor(
    eventBus: any,
    modeling: any,
    elementRegistry: any,
    canvas: any,
  ) {
    this._modeling = modeling;
    this._er = elementRegistry;
    this._canvas = canvas;

    eventBus.on(
      [
        "commandStack.shape.move.postExecuted",
        "commandStack.shape.create.postExecuted",
      ],
      (e: any) => this._dock(e),
    );

    // Any lane resize (manual drag or bpmn's auto-expand when an object is
    // placed inside) syncs the stack's width and re-stacks the lanes flush.
    eventBus.on("commandStack.shape.resize.postExecuted", (e: any) =>
      this._onResize(e),
    );

    // Live snap preview — from the canvas (shape.move) and the palette (create).
    eventBus.on("shape.move.move", (e: any) => {
      const shape = e && e.context && e.context.shape;
      if (!isSwimlane(shape)) return this._clearPreview();
      this._preview(
        {
          x: shape.x + (e.dx || 0),
          y: shape.y + (e.dy || 0),
          width: shape.width,
          height: shape.height,
        },
        shape.id,
      );
    });
    eventBus.on("create.move", (e: any) => {
      const shape = e && e.context && e.context.shape;
      if (!isSwimlane(shape)) return this._clearPreview();
      this._preview(
        {
          x: e.x - shape.width / 2,
          y: e.y - shape.height / 2,
          width: shape.width,
          height: shape.height,
        },
        shape.id,
      );
    });
    eventBus.on(
      [
        "shape.move.end",
        "shape.move.cleanup",
        "create.end",
        "create.cancel",
        "create.cleanup",
      ],
      () => this._clearPreview(),
    );
  }

  /**
   * Snap target + resulting docked bounds (matched to the target's width and
   * height) for a set of previewed bounds.
   *
   * Works slot-based: for every dockable lane we consider the slot directly
   * below it and the slot directly above it, and pick the slot closest to
   * where the lane currently is. This keeps re-docking an already-docked lane
   * a stable no-op (it just snaps back into its own slot) instead of
   * rearranging the stack.
   */
  private _snapPlan(
    bounds: Bounds,
    excludeId: string,
  ): { other: any; edgeY: number; docked: Bounds } | null {
    const others = this._er.filter(
      (el: any) => isSwimlane(el) && el.id !== excludeId,
    );

    let best: { other: any; dist: number; edgeY: number; docked: Bounds } | null =
      null;

    for (const o of others) {
      const overlapX =
        bounds.x < o.x + o.width && bounds.x + bounds.width > o.x;
      if (!overlapX) continue;

      const h = o.height;
      const candidates = [
        // slot directly below o (shared border = o's bottom edge)
        { slotY: o.y + o.height, edgeY: o.y + o.height },
        // slot directly above o (shared border = o's top edge)
        { slotY: o.y - h, edgeY: o.y },
      ];

      for (const c of candidates) {
        const dist = Math.abs(bounds.y - c.slotY);
        if (dist <= SNAP && (!best || dist < best.dist)) {
          best = {
            other: o,
            dist,
            edgeY: c.edgeY,
            docked: { x: o.x, y: c.slotY, width: o.width, height: h },
          };
        }
      }
    }

    return best;
  }

  private _dock(e: any) {
    if (this._busy) return;
    const shape = e && e.context && e.context.shape;
    if (!isSwimlane(shape)) return;

    const plan = this._snapPlan(shape, shape.id);
    if (!plan) return;

    const { docked } = plan;
    const exclude = new Set<string>([shape.id]);

    // Lanes in the stack we're docking into ...
    const members = new Set<any>([plan.other]);
    this._stackFrom(plan.other, exclude).forEach((l) => members.add(l));

    // ... plus the stack the lane came from (moves only), so the gap it left
    // behind closes up instead of splitting that stack apart.
    const delta = e.context.delta;
    if (delta && (delta.x || delta.y)) {
      const old = {
        x: shape.x - delta.x,
        y: shape.y - delta.y,
        width: shape.width,
        height: shape.height,
      };
      this._stackFrom(old, exclude).forEach((l) => members.add(l));
    }

    this._busy = true;
    try {
      // Match x, width and height to the lane we're docking to.
      if (
        shape.x !== docked.x ||
        shape.width !== docked.width ||
        shape.height !== docked.height
      ) {
        this._modeling.resizeShape(shape, {
          x: docked.x,
          y: shape.y,
          width: docked.width,
          height: docked.height,
        });
      }

      // Re-stack every lane flush, with the shape inserted at its slot. This
      // single pass covers inserts (the occupant and everything below it get
      // pushed down), appends/prepends (nothing shifts) and relocations (the
      // gap left behind closes up) without lanes ever overlapping.
      const ordered = [...members].sort((a, b) => a.y - b.y);
      const at = ordered.findIndex((l) => docked.y < l.y + EPS);
      if (at === -1) ordered.push(shape);
      else ordered.splice(at, 0, shape);

      this._layoutFlush(ordered, ordered[0] === shape ? docked.y : ordered[0].y);
    } catch {
      /* never let a docking hiccup break the drag/create interaction */
    } finally {
      this._busy = false;
    }
  }

  /**
   * After a lane resize: give the whole stack the same x/width (lanes behave
   * as one horizontally) and re-stack them flush vertically, so growing a
   * lane — by dragging its handle or via bpmn auto-expanding it around a new
   * object — pushes the lanes below down instead of overlapping them.
   */
  private _onResize(e: any) {
    if (this._busy) return;
    const shape = e && e.context && e.context.shape;
    if (!isSwimlane(shape)) return;

    // Stack membership is decided by where the lane was BEFORE the resize —
    // afterwards it may already overlap (grew) or have a gap to (shrank) its
    // neighbours, which would break flush detection.
    const old: Bounds = e.context.oldBounds || shape;
    const others = this._stackFrom(old, new Set([shape.id]));
    if (!others.length) return;

    this._busy = true;
    try {
      others.forEach((l: any) => {
        if (l.x !== shape.x || l.width !== shape.width) {
          this._modeling.resizeShape(l, {
            x: shape.x,
            y: l.y,
            width: shape.width,
            height: l.height,
          });
        }
      });

      const ordered = [shape, ...others].sort((a, b) => {
        const ay = a === shape ? old.y : a.y;
        const by = b === shape ? old.y : b.y;
        return ay - by;
      });
      this._layoutFlush(ordered, ordered[0].y);
    } catch {
      /* keep resizing usable even if propagation fails */
    } finally {
      this._busy = false;
    }
  }

  /** Move `ordered` lanes so each starts where the previous one ends. */
  private _layoutFlush(ordered: any[], top: number) {
    let cursor = top;
    for (const l of ordered) {
      const dy = cursor - l.y;
      if (Math.abs(dy) > 0.5) {
        this._modeling.moveElements([l], { x: 0, y: dy });
      }
      cursor += l.height;
    }
  }

  private _preview(bounds: Bounds, excludeId: string) {
    const plan = this._snapPlan(bounds, excludeId);
    if (!plan) return this._clearPreview();

    const { edgeY, docked } = plan;
    const layer = this._canvas.getLayer(SNAP_LAYER, 1000);
    svgClear(layer);

    const ghost = svgCreate("rect");
    svgAttr(ghost, {
      x: docked.x,
      y: docked.y,
      width: docked.width,
      height: docked.height,
      rx: 2,
      fill: SNAP_GREEN,
      "fill-opacity": 0.1,
      stroke: SNAP_GREEN,
      "stroke-width": 2,
      "stroke-dasharray": "6 4",
    });
    svgAppend(layer, ghost);

    const edge = svgCreate("line");
    svgAttr(edge, {
      x1: docked.x,
      y1: edgeY,
      x2: docked.x + docked.width,
      y2: edgeY,
      stroke: SNAP_GREEN,
      "stroke-width": 3,
      "stroke-linecap": "round",
    });
    svgAppend(layer, edge);
  }

  private _clearPreview() {
    try {
      svgClear(this._canvas.getLayer(SNAP_LAYER, 1000));
    } catch {
      /* layer may not exist yet */
    }
  }

  /**
   * Connected component of swimlanes docked flush (vertically) starting from
   * `seed` bounds. The seed itself is NOT part of the result; lanes whose id
   * is in `exclude` are ignored entirely.
   */
  private _stackFrom(seed: Bounds, exclude: Set<string>): any[] {
    const all = this._er.filter(
      (el: any) => isSwimlane(el) && !exclude.has(el.id),
    );
    const flush = (a: Bounds, b: Bounds) => {
      const overlapX = a.x < b.x + b.width && a.x + a.width > b.x;
      if (!overlapX) return false;
      const gap = Math.min(
        Math.abs(a.y - (b.y + b.height)),
        Math.abs(a.y + a.height - b.y),
      );
      return gap <= EPS;
    };

    const found = new Set<any>();
    const queue: Bounds[] = [seed];
    while (queue.length) {
      const cur = queue.pop()!;
      for (const o of all) {
        if (found.has(o)) continue;
        if (flush(cur, o)) {
          found.add(o);
          queue.push(o);
        }
      }
    }
    return [...found];
  }
}
