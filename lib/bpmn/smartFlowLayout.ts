/* eslint-disable @typescript-eslint/no-explicit-any */
import { is } from "bpmn-js/lib/util/ModelUtil";

/**
 * Side-aware sequence flow routing.
 *
 * Stock BpmnLayouter routes every plain sequence flow "h:h" (leave and enter
 * horizontally), no matter where on the shape the user dropped or dragged the
 * endpoint — pointing at a task's bottom edge still produces a line that bends
 * around and enters from the side. Here we read which side of the shape each
 * docking point sits on (the exact point the user chose is preserved by the
 * cropping docking as `original`) and hand the router matching preferred
 * directions, so the connector leaves/enters through the side that was
 * pointed at. Ends docked near the centre keep the stock behaviour.
 */

/** How much of the shape's half-size around the centre counts as "centre". */
const CENTER_ZONE = 0.35;

type Side = "t" | "r" | "b" | "l";

function dockingPoint(waypoints: any[] | undefined, first: boolean): any {
  if (!waypoints || !waypoints.length) return null;
  const p = first ? waypoints[0] : waypoints[waypoints.length - 1];
  return (p && (p.original || p)) || null;
}

/** The side of `shape` the point leans toward, or null when it's central. */
function sideOf(point: any, shape: any): Side | null {
  if (!point || !shape || !shape.width || !shape.height) return null;
  const dx = (point.x - (shape.x + shape.width / 2)) / (shape.width / 2);
  const dy = (point.y - (shape.y + shape.height / 2)) / (shape.height / 2);
  if (Math.abs(dx) < CENTER_ZONE && Math.abs(dy) < CENTER_ZONE) return null;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? "r" : "l";
  return dy > 0 ? "b" : "t";
}

/** Stock fallback direction for an un-pointed end (BpmnLayouter defaults). */
function defaultDir(el: any): "h" | "v" {
  return is(el, "bpmn:Gateway") ? "v" : "h";
}

export class SmartFlowLayout {
  static $inject = ["layouter"];

  constructor(layouter: any) {
    const original = layouter.layoutConnection.bind(layouter);

    layouter.layoutConnection = (connection: any, hints: any) => {
      return original(connection, this._withPointedSides(connection, hints));
    };
  }

  private _withPointedSides(connection: any, hints: any): any {
    try {
      hints = hints || {};
      if (!is(connection, "bpmn:SequenceFlow") || hints.preferredLayouts) {
        return hints;
      }

      const source = hints.source || connection.source;
      const target = hints.target || connection.target;
      if (!source || !target || source === target) return hints;

      // Leave bpmn's special-cased layouts alone.
      if (
        is(source, "bpmn:BoundaryEvent") ||
        is(source, "bpmn:SubProcess") ||
        is(target, "bpmn:SubProcess")
      ) {
        return hints;
      }

      const waypoints = hints.waypoints || connection.waypoints;
      const start = hints.connectionStart || dockingPoint(waypoints, true);
      const end = hints.connectionEnd || dockingPoint(waypoints, false);

      const startSide = sideOf(start, source);
      const endSide = sideOf(end, target);
      if (!startSide && !endSide) return hints;

      return {
        ...hints,
        preferredLayouts: [
          `${startSide || defaultDir(source)}:${endSide || defaultDir(target)}`,
        ],
      };
    } catch {
      return hints || {};
    }
  }
}
