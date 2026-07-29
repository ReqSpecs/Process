/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Freeform canvas rules.
 *
 * Out of the box bpmn-js forces a "collaboration" model: as soon as one pool /
 * participant exists, every flow element MUST live inside a participant, and
 * dropping the first pool onto a non-empty diagram resizes it to cover — and
 * absorb — all existing shapes. That is too restrictive for a freeform tool.
 *
 * This module relaxes that in three coordinated pieces:
 *
 *  1. FreeformRules — allow flow elements (and labels / groups / artifacts) to
 *     be created and moved directly on the Collaboration / Process root, i.e.
 *     as standalone shapes outside any pool.
 *  2. FreeformContainment — when a flow element's semantic parent would become
 *     the Collaboration (which can't hold flow elements), redirect it to a
 *     "free" process kept in the definitions. This keeps the BPMN model valid
 *     while the shape renders standalone on the collaboration plane.
 *  3. FreeformParticipant — stop a freshly dropped pool from fitting/absorbing
 *     the existing shapes: it drops at a sensible default size and any elements
 *     bpmn tried to absorb are moved back out to the root (→ free process).
 */
import RuleProvider from "diagram-js/lib/features/rules/RuleProvider";
import { is } from "bpmn-js/lib/util/ModelUtil";
import { isLabel } from "bpmn-js/lib/util/LabelUtil";

const DEFAULT_POOL_WIDTH = 600;
const DEFAULT_POOL_HEIGHT = 200;

function getDefinitions(bo: any): any {
  let node = bo;
  while (node && node.$type !== "bpmn:Definitions") node = node.$parent;
  return node ?? null;
}

/** Find (or lazily create) a process that isn't referenced by any pool. */
function getFreeProcess(collaborationBo: any, bpmnFactory: any): any {
  const defs = getDefinitions(collaborationBo);
  if (!defs) return null;

  const roots: any[] = defs.get("rootElements") || [];
  const referenced = new Set<any>();
  roots.forEach((re) => {
    if (is(re, "bpmn:Collaboration")) {
      (re.get("participants") || []).forEach((p: any) => {
        if (p.processRef) referenced.add(p.processRef);
      });
    }
  });

  let free = roots.find(
    (re) => is(re, "bpmn:Process") && !referenced.has(re),
  );
  if (!free) {
    free = bpmnFactory.create("bpmn:Process");
    roots.push(free);
    free.$parent = defs;
  }
  ensureLaneSet(free, (attrs: any) => bpmnFactory.create("bpmn:LaneSet", attrs));
  return free;
}

/**
 * Make sure a process carries a (possibly empty) laneSet. The importer only
 * draws processes that aren't referenced by a pool when they contain lanes
 * (BpmnTreeWalker#handleUnhandledProcesses) — without this, every standalone
 * element in the "free" process silently disappears on save + reload.
 */
function ensureLaneSet(processBo: any, create: (attrs: any) => any) {
  const laneSets = processBo.get("laneSets");
  if (laneSets && laneSets.length) return;
  const laneSet = create({});
  laneSet.$parent = processBo;
  processBo.set("laneSets", [laneSet]);
}

function isFreeformElement(el: any): boolean {
  return (
    isLabel(el) ||
    is(el, "bpmn:Group") ||
    is(el, "bpmn:Artifact") ||
    (is(el, "bpmn:FlowElement") && !is(el, "bpmn:BoundaryEvent"))
  );
}

function canBeSequenceSource(el: any): boolean {
  return !!el && is(el, "bpmn:FlowNode") && !is(el, "bpmn:EndEvent");
}

function canBeSequenceTarget(el: any): boolean {
  return (
    !!el &&
    is(el, "bpmn:FlowNode") &&
    !is(el, "bpmn:StartEvent") &&
    !is(el, "bpmn:BoundaryEvent")
  );
}

/** Nearest enclosing pool/participant, or null when standalone. */
function nearestPool(el: any): any {
  let n = el;
  while (n) {
    if (is(n, "bpmn:Participant")) return n;
    n = n.parent;
  }
  return null;
}

function isCrossPoolConnection(conn: any): boolean {
  if (!conn || !conn.source || !conn.target) return false;
  return nearestPool(conn.source) !== nearestPool(conn.target);
}

/**
 * Shared connect intent so the palette can tell the rules which kind of
 * connector the user picked. Default is "sequence" (also used by the context
 * pad), while the essentials "Pool connector" tool switches to "message".
 */
class ConnectIntent {
  static $inject = ["eventBus"];
  mode: "sequence" | "message" = "sequence";

  constructor(eventBus: any) {
    // Fall back to "sequence" after every connect interaction (cleanup fires on
    // success or cancel) and after any connection is created, so a one-off
    // "Pool connector" pick can never get "stuck" for later connects.
    eventBus.on(
      [
        "connect.cleanup",
        "global-connect.cleanup",
        "commandStack.connection.create.postExecuted",
      ],
      () => {
        this.mode = "sequence";
      },
    );
  }
}

/**
 * (1) Allow standalone flow elements directly on the Collaboration root.
 *
 * Scoped to Collaboration only: a plain Process root already permits freeform
 * placement out of the box, so we leave that path entirely to the defaults.
 */
class FreeformRules extends (RuleProvider as any) {
  static $inject = ["eventBus", "connectIntent"];

  constructor(eventBus: any, connectIntent: any) {
    super(eventBus);
    // Rule callbacks below read this at fire time (runtime), so it's fine that
    // super() → init() ran before this assignment.
    (this as any)._connectIntent = connectIntent;
  }

  init() {
    const allow = (target: any, elements: any[]) => {
      if (!target || !elements || !elements.length) return undefined;
      if (!is(target, "bpmn:Collaboration")) return undefined;
      return elements.every(isFreeformElement) ? true : undefined;
    };

    this.addRule("elements.move", 1500, (ctx: any) => {
      const shapes = ctx.shapes || [];
      // Let pools be dragged next to / over each other so they can dock into a
      // stack of swimlanes. Stock bpmn rejects a pool whose drop target is
      // another pool (red cursor); we allow it and keep it on the root (see
      // KeepPoolsAtRoot) so it snaps beside the other pool rather than nesting.
      if (shapes.length && shapes.every((s: any) => is(s, "bpmn:Participant"))) {
        return ctx.target === null ? undefined : true;
      }
      return allow(ctx.target, shapes);
    });
    // Allow dropping a pool from the palette straight over/near another pool so
    // it can dock immediately (parent is redirected to the root in
    // KeepPoolsAtRoot so it never nests inside the hovered pool).
    this.addRule("shape.create", 1500, (ctx: any) => {
      const shape = ctx.shape;
      if (shape && is(shape, "bpmn:Participant")) {
        return ctx.target ? true : undefined;
      }
      return allow(ctx.target, shape ? [shape] : []);
    });
    this.addRule("elements.create", 1500, (ctx: any) => {
      const els = ctx.elements || [];
      if (els.length && els.every((el: any) => is(el, "bpmn:Participant"))) {
        return ctx.target ? true : undefined;
      }
      return allow(ctx.target, els);
    });

    // Normal connects ignore pools entirely and behave like a plain process
    // flow: between flow nodes (same pool, different pools, standalone) the
    // result is always a sequence flow, and a pool/lane end is treated like
    // empty canvas (blocked) instead of falling back to bpmn's message-flow
    // ("pool connector") rules. Only the explicit "Pool connector" tool
    // (mode === "message") still uses the stock pool rules.
    const isPoolish = (el: any) =>
      !!el && (is(el, "bpmn:Participant") || is(el, "bpmn:Lane"));

    this.addRule("connection.create", 1500, (ctx: any) => {
      const mode = (this as any)._connectIntent?.mode || "sequence";
      if (mode === "message") return undefined;
      if (canBeSequenceSource(ctx.source) && canBeSequenceTarget(ctx.target)) {
        return { type: "bpmn:SequenceFlow" };
      }
      // Mixed ends (flow node <-> pool) are the accidental "pool connector"
      // case. Returning null (instead of false) makes the lane surface
      // completely inert while dragging a connect — no red marker flooding
      // the pool, no message-flow fallback — the same neutral feel as
      // dragging over empty canvas. Pool-to-pool stays on the default rules
      // so a deliberate message flow between pools still works.
      if (isPoolish(ctx.source) !== isPoolish(ctx.target)) return null;
      return undefined;
    });

    // Reconnecting a sequence flow keeps it a sequence flow — across pools
    // too. Stock bpmn answers "message flow" here for cross-pool ends, which
    // made the drag preview show a dashed pool connector; and where the
    // forward direction was rejected, diagram-js retried with source/target
    // swapped, visibly reversing the arrow. Answering with the connection's
    // own type in the forward direction fixes the preview, the docking and
    // the reversal at once. Hovering a pool/lane while dragging an endpoint is
    // blocked outright (like empty canvas) rather than converting the line.
    // Message flows fall through to the default rules.
    this.addRule("connection.reconnect", 1500, (ctx: any) => {
      const conn = ctx.connection;
      if (!conn || !is(conn, "bpmn:SequenceFlow")) return undefined;
      if (canBeSequenceSource(ctx.source) && canBeSequenceTarget(ctx.target)) {
        return { type: "bpmn:SequenceFlow" };
      }
      // Neutral (no red) over lane surfaces while dragging an endpoint.
      if (isPoolish(ctx.source) !== isPoolish(ctx.target)) return null;
      return undefined;
    });
  }
}

/** (2) Route Collaboration-parented flow elements to a free process. */
class FreeformContainment {
  static $inject = ["bpmnUpdater", "bpmnFactory"];

  constructor(bpmnUpdater: any, bpmnFactory: any) {
    const original = bpmnUpdater.updateSemanticParent.bind(bpmnUpdater);
    bpmnUpdater.updateSemanticParent = function (
      businessObject: any,
      newParent: any,
      visualParent: any,
    ) {
      try {
        if (
          newParent &&
          is(newParent, "bpmn:Collaboration") &&
          is(businessObject, "bpmn:FlowElement")
        ) {
          const free = getFreeProcess(newParent, bpmnFactory);
          if (free) newParent = free;
        }
      } catch {
        /* fall back to default containment on any lookup failure */
      }
      return original(businessObject, newParent, visualParent);
    };
  }
}

/** (3) Freeform pool placement: no cover-all fit, no absorbing existing shapes. */
class FreeformParticipant {
  static $inject = ["eventBus", "canvas", "modeling"];

  constructor(eventBus: any, canvas: any, modeling: any) {
    // Neutralise the "resize to cover every existing element" fit that bpmn
    // applies (at priority 2000) when the first pool is dropped over a
    // non-empty process — run just after it and reset to a default size.
    eventBus.on("create.start", 1990, (event: any) => {
      const ctx = event.context;
      const shape = ctx && ctx.shape;
      const root = canvas.getRootElement();
      if (!shape || !is(shape, "bpmn:Participant") || !is(root, "bpmn:Process"))
        return;
      shape.width = DEFAULT_POOL_WIDTH;
      shape.height = DEFAULT_POOL_HEIGHT;
      shape.x = -DEFAULT_POOL_WIDTH / 2;
      shape.y = -DEFAULT_POOL_HEIGHT / 2;
      if (ctx.createConstraints) delete ctx.createConstraints;
    });

    // Runs after bpmn's absorb (default priority 1000). Two steps:
    //  (a) if bpmn converted the whole process into the pool (first pool over
    //      a non-empty diagram), undo the cover-all: move the absorbed
    //      elements back to the root and reset the pool to its default size;
    //  (b) adopt whatever standalone element ends up (centre-)inside the
    //      pool's final bounds — so dropping a lane ONTO existing objects
    //      makes them stick to it (they move with the lane), exactly like
    //      objects created inside the lane, while everything outside stays
    //      standalone.
    eventBus.on(
      "commandStack.shape.create.postExecute",
      500,
      (event: any) => {
        try {
          const context = event.context;
          const shape = context.shape;
          if (!is(shape, "bpmn:Participant")) return;
          const root = canvas.getRootElement();

          // (a) neutralise the cover-all absorb
          if (context.process && is(root, "bpmn:Collaboration")) {
            const kids = (shape.children || []).filter(
              (el: any) => !isLabel(el) && !is(el, "bpmn:Lane"),
            );
            if (kids.length) {
              modeling.moveElements(kids, { x: 0, y: 0 }, root);
            }
            modeling.resizeShape(shape, {
              x: shape.x,
              y: shape.y,
              width: DEFAULT_POOL_WIDTH,
              height: DEFAULT_POOL_HEIGHT,
            });
          }

          // (b) sticky adoption of elements under the pool
          if (!root) return;
          const inside = (el: any) => {
            const cx = el.x + el.width / 2;
            const cy = el.y + el.height / 2;
            return (
              cx >= shape.x &&
              cx <= shape.x + shape.width &&
              cy >= shape.y &&
              cy <= shape.y + shape.height
            );
          };
          const strays = (root.children || []).filter(
            (el: any) =>
              el !== shape &&
              !el.waypoints &&
              !isLabel(el) &&
              !is(el, "bpmn:Participant") &&
              !is(el, "bpmn:Group") &&
              isFreeformElement(el) &&
              inside(el),
          );
          if (strays.length) {
            // Zero-delta move; the closure brings connections between the
            // adopted elements along into the pool as well.
            modeling.moveElements(strays, { x: 0, y: 0 }, shape);
          }
        } catch {
          /* on failure leave bpmn's default absorb behavior in place */
        }
      },
    );
  }
}

/**
 * (4) Keep connectors when a shape is dragged out of / into a pool.
 *
 * bpmn's ReplaceConnectionBehavior runs on `elements.move` and removes (or
 * converts to a message flow) any sequence flow whose endpoints end up in
 * different processes — which happens the moment a connected shape leaves its
 * pool. We run just ahead of it and empty the move closure's connection map so
 * it has nothing to remove or convert, leaving the connector intact.
 */
class PreserveConnectorsOnMove {
  static $inject = ["eventBus"];

  constructor(eventBus: any) {
    // NOTE: connections enclosed in a moved selection (both endpoints moving)
    // stay in the closure on purpose, so they travel with the shapes — e.g.
    // dragging a connected group of standalone tasks into a lane brings the
    // connectors along. The ordering crash that once forced us to strip them
    // ("no parent for <Flow> in <Collaboration>") is handled by
    // FreeformOrdering below.

    // After the move: clear the closure's connection map so bpmn's
    // ReplaceConnectionBehavior doesn't remove/convert them across processes.
    eventBus.on(
      "commandStack.elements.move.postExecuted",
      2000,
      (event: any) => {
        const closure = event.context && event.context.closure;
        if (closure && closure.allConnections) {
          closure.allConnections = {};
        }
      },
    );

    // Reconnecting an endpoint (dragging a connector end to another side of a
    // shape, or to another shape) must never silently swap the connector's
    // type. bpmn's ReplaceConnectionBehavior does exactly that in its
    // `connection.reconnect` preExecute — it turns a sequence flow whose ends
    // sit in different pools into a message flow ("pool connector") and vice
    // versa. It is the only preExecute hook on this command, so stopping
    // propagation ahead of it suppresses just the swap; the reconnect itself
    // is performed by the command handler and is unaffected.
    eventBus.on(
      "commandStack.connection.reconnect.preExecute",
      2000,
      (event: any) => {
        const conn = event.context && event.context.connection;
        if (
          conn &&
          (is(conn, "bpmn:SequenceFlow") || is(conn, "bpmn:MessageFlow"))
        ) {
          event.stopPropagation();
        }
      },
    );
  }
}

/**
 * (4b) Keep pools on the root when docking.
 *
 * We allow a pool to be dragged over another pool (so it can snap into a
 * swimlane stack), but bpmn would otherwise try to reparent it into the pool it
 * was dropped on. Clearing `newParent` for participant moves keeps each pool a
 * direct child of the collaboration (MoveHelper leaves the parent untouched when
 * `newParent` is falsy), so it docks beside the other pool instead of nesting.
 */
class KeepPoolsAtRoot {
  static $inject = ["eventBus", "canvas"];

  constructor(eventBus: any, canvas: any) {
    // A pool may only ever be parented to the root (Collaboration / Process).
    // Our freeform rules let pools be dropped over ANY element (another pool, a
    // task, a group, ...), so without this redirect bpmn would try to nest the
    // pool inside that element — updateSemanticParent then crashes on e.g.
    // `task.get("participants").push(...)` and corrupts the model.
    const isRootLike = (el: any) =>
      !!el && (is(el, "bpmn:Collaboration") || is(el, "bpmn:Process"));

    // Moving pools: if the drop target isn't the root, keep the current parent
    // (MoveHelper leaves parents untouched when newParent is falsy).
    eventBus.on(
      "commandStack.elements.move.preExecute",
      2000,
      (event: any) => {
        const ctx = event.context;
        const shapes = (ctx && ctx.shapes) || [];
        const movingPool = shapes.some((s: any) => is(s, "bpmn:Participant"));
        if (movingPool && ctx.newParent && !isRootLike(ctx.newParent)) {
          ctx.newParent = null;
        }
      },
    );

    // Creating a pool (palette drop): if the hovered element isn't the root,
    // parent the new pool to the root instead of nesting it.
    eventBus.on("commandStack.shape.create.preExecute", 2000, (event: any) => {
      const ctx = event.context;
      const shape = ctx && ctx.shape;
      if (
        shape &&
        is(shape, "bpmn:Participant") &&
        ctx.parent &&
        !isRootLike(ctx.parent)
      ) {
        const root = canvas.getRootElement();
        if (root) ctx.parent = root;
      }
    });
  }
}

/**
 * (5) Keep cross-pool connectors visible on top.
 *
 * A connector whose ends sit in different pools would otherwise render inside
 * one pool's group and get painted over by the other pool's fill (appearing
 * greyed out / behind the lane). We lift such connectors to the root layer so
 * they draw above every pool, the same way message flows do.
 */
class CrossPoolConnectionLayer {
  static $inject = ["eventBus", "canvas", "elementRegistry"];

  constructor(eventBus: any, canvas: any, elementRegistry: any) {
    const lift = (conn: any, refront = false) => {
      try {
        const root = canvas.getRootElement();
        if (!root) return;
        if (conn.parent === root) {
          // Already at root. During editing that means it was appended last
          // (on top). After an import, though, DI order may have painted it
          // BELOW the pools — `refront` re-appends it so it draws on top.
          if (!refront) return;
        } else if (!isCrossPoolConnection(conn)) {
          return;
        }
        // Re-add to the root layer (visual only — does not touch the model).
        canvas.removeConnection(conn);
        canvas.addConnection(conn, root);
      } catch {
        /* ignore — z-order is a best-effort visual tweak */
      }
    };

    eventBus.on("commandStack.connection.create.postExecuted", (event: any) => {
      lift(event.context && event.context.connection);
    });

    eventBus.on("commandStack.elements.move.postExecuted", (event: any) => {
      const shapes = (event.context && event.context.shapes) || [];
      const seen = new Set<any>();
      shapes.forEach((s: any) => {
        [...(s.incoming || []), ...(s.outgoing || [])].forEach((c: any) => {
          if (c && !seen.has(c)) {
            seen.add(c);
            lift(c);
          }
        });
      });
    });

    // On (re)load the importer may parent cross-pool connectors inside a pool
    // (painted over by the other lane) or add root-level connectors BEFORE the
    // pools (painted over by every pool). Re-lift/re-front them all once the
    // diagram has finished importing so nothing renders greyed out.
    eventBus.on("import.done", () => {
      try {
        elementRegistry
          .filter((el: any) => el && el.waypoints)
          .forEach((conn: any) => lift(conn, true));
      } catch {
        /* best-effort */
      }
    });
  }
}

/**
 * (5b) Draw standalone elements after reload.
 *
 * Runs on `import.parse.complete`, before the tree walker: every process that
 * no pool references gets an empty laneSet stamped on (see ensureLaneSet), so
 * the walker's "unhandled processes" pass draws its elements on the
 * collaboration plane instead of silently dropping everything that lives
 * outside the pools.
 */
class FreeformImport {
  static $inject = ["eventBus"];

  constructor(eventBus: any) {
    eventBus.on("import.parse.complete", (event: any) => {
      try {
        const defs = event && event.definitions;
        if (!defs) return;
        const roots: any[] = defs.get("rootElements") || [];
        if (!roots.some((re) => is(re, "bpmn:Collaboration"))) return;

        const referenced = new Set<any>();
        roots.forEach((re) => {
          if (is(re, "bpmn:Collaboration")) {
            (re.get("participants") || []).forEach((p: any) => {
              if (p.processRef) referenced.add(p.processRef);
            });
          }
        });

        roots.forEach((re) => {
          if (!is(re, "bpmn:Process") || referenced.has(re)) return;
          ensureLaneSet(re, (attrs: any) => defs.$model.create("bpmn:LaneSet", attrs));
        });
      } catch {
        /* best-effort — worst case the stock (lossy) import behavior remains */
      }
    });
  }
}

/**
 * (6) Let connections live on the Collaboration root.
 *
 * Stock ordering can only place a sequence flow inside a participant or a
 * process — for a flow between two standalone shapes (diagram parent =
 * Collaboration) `findActualParent` finds nothing and THROWS, killing the
 * command mid-flight. That's why quick-menu appends outside a pool created
 * the shape but no connector (and step numbering, which follows sequence
 * flows, fell back to position order). When stock ordering gives up we place
 * the connection at the root, on top — the same treatment message flows get.
 */
class FreeformOrdering {
  static $inject = ["bpmnOrderingProvider", "canvas"];

  constructor(bpmnOrderingProvider: any, canvas: any) {
    const original = bpmnOrderingProvider.getOrdering.bind(bpmnOrderingProvider);
    bpmnOrderingProvider.getOrdering = (element: any, newParent: any) => {
      try {
        return original(element, newParent);
      } catch {
        const root = canvas.findRoot?.(newParent) || canvas.getRootElement();
        return { parent: root || newParent, index: -1 };
      }
    };
  }
}

export const freeformCanvasModule: any = {
  __init__: [
    "connectIntent",
    "freeformRules",
    "freeformContainment",
    "freeformParticipant",
    "keepPoolsAtRoot",
    "preserveConnectorsOnMove",
    "crossPoolConnectionLayer",
    "freeformOrdering",
    "freeformImport",
  ],
  connectIntent: ["type", ConnectIntent],
  freeformRules: ["type", FreeformRules],
  freeformContainment: ["type", FreeformContainment],
  freeformParticipant: ["type", FreeformParticipant],
  keepPoolsAtRoot: ["type", KeepPoolsAtRoot],
  preserveConnectorsOnMove: ["type", PreserveConnectorsOnMove],
  crossPoolConnectionLayer: ["type", CrossPoolConnectionLayer],
  freeformOrdering: ["type", FreeformOrdering],
  freeformImport: ["type", FreeformImport],
};
