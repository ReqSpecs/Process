/* eslint-disable @typescript-eslint/no-explicit-any */
import { is } from "bpmn-js/lib/util/ModelUtil";

/**
 * Derives a step number for every activity from flow order (BFS from start
 * events along sequence flows; unreached activities appended by position) and
 * forces those shapes to re-render so badges renumber live on any change.
 */
const byPos = (a: any, b: any) => a.y - b.y || a.x - b.x;

export class StepNumbering {
  static $inject = ["eventBus", "elementRegistry", "graphicsFactory", "canvas"];

  private _er: any;
  private _gf: any;
  private _canvas: any;
  private _numbers = new Map<string, number>();

  constructor(
    eventBus: any,
    elementRegistry: any,
    graphicsFactory: any,
    canvas: any,
  ) {
    this._er = elementRegistry;
    this._gf = graphicsFactory;
    this._canvas = canvas;
    const run = () => this._recompute();
    eventBus.on(["import.done", "commandStack.changed"], run);
  }

  getNumber(element: any): number | undefined {
    return this._numbers.get(element.id);
  }

  private _order(): any[] {
    const activities = this._er.filter(
      (e: any) => is(e, "bpmn:Activity") && !e.labelTarget,
    );
    const starts = this._er
      .filter((e: any) => is(e, "bpmn:StartEvent") && !e.labelTarget)
      .sort(byPos);

    const visited = new Set<string>();
    const queue: any[] = [];
    starts.forEach((s: any) => {
      visited.add(s.id);
      queue.push(s);
    });

    const ordered: any[] = [];
    while (queue.length) {
      const node = queue.shift();
      if (is(node, "bpmn:Activity")) ordered.push(node);
      (node.outgoing || [])
        .filter((c: any) => is(c, "bpmn:SequenceFlow"))
        .map((c: any) => c.target)
        .filter(Boolean)
        .sort(byPos)
        .forEach((t: any) => {
          if (!visited.has(t.id)) {
            visited.add(t.id);
            queue.push(t);
          }
        });
    }

    activities
      .filter((a: any) => !ordered.includes(a))
      .sort(byPos)
      .forEach((a: any) => ordered.push(a));
    return ordered;
  }

  private _recompute() {
    const ordered = this._order();
    this._numbers = new Map(ordered.map((el, i) => [el.id, i + 1]));
    for (const el of ordered) {
      const gfx = this._canvas.getGraphics(el);
      if (gfx) this._gf.update("shape", el, gfx);
    }
  }
}
