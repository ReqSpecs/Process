/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * "BPMN Essentials" palette: replaces the default bpmn-js palette with a focused
 * set — Pool/Lane, Start / Intermediate / End events, Gateway, Task, Annotation,
 * Sequence flow, Pool connector (message flow) and Group. Registered at a low
 * priority so it runs after the stock provider and can trim its entries.
 *
 * Both connector tools start the global-connect tool; bpmn-js infers the
 * connection type from the endpoints (sequence flow within a pool, message flow
 * across pools), so "Pool connector" produces a message flow between pools.
 */
export class EssentialsPalette {
  static $inject = [
    "palette",
    "create",
    "elementFactory",
    "globalConnect",
    "translate",
    "connectIntent",
  ];

  private _create: any;
  private _elementFactory: any;
  private _globalConnect: any;
  private _translate: any;
  private _connectIntent: any;

  constructor(
    palette: any,
    create: any,
    elementFactory: any,
    globalConnect: any,
    translate: any,
    connectIntent: any,
  ) {
    this._create = create;
    this._elementFactory = elementFactory;
    this._globalConnect = globalConnect;
    this._translate = translate;
    this._connectIntent = connectIntent;
    palette.registerProvider(500, this);
  }

  getPaletteEntries() {
    const create = this._create;
    const elementFactory = this._elementFactory;
    const globalConnect = this._globalConnect;
    const translate = this._translate;
    const connectIntent = this._connectIntent;

    const createAction = (
      type: string,
      group: string,
      className: string,
      title: string,
    ) => {
      function start(event: any) {
        const shape =
          type === "bpmn:Participant"
            ? elementFactory.createParticipantShape()
            : elementFactory.createShape({ type });
        // Tag pools as swimlanes so they dock/stack with each other (see
        // swimlaneDock), matching the classic palette's swimlane behaviour.
        if (type === "bpmn:Participant") {
          const bo = shape.businessObject;
          if (bo && bo.set) bo.set("prodraw:swimlane", true);
        }
        create.start(event, shape);
      }
      return {
        group,
        className,
        title: translate(title),
        action: { dragstart: start, click: start },
      };
    };

    const connectAction = (
      className: string,
      title: string,
      mode: "sequence" | "message",
    ) => {
      const start = (event: any) => {
        if (connectIntent) connectIntent.mode = mode;
        globalConnect.start(event);
      };
      return {
        group: "connect",
        className,
        title: translate(title),
        action: { click: start, dragstart: start },
      };
    };

    // Return a transformer so we start from the stock entries (keeping the
    // hand/lasso/space tools) and drop everything else.
    return function (entries: Record<string, any>) {
      const tools: Record<string, any> = {};
      ["hand-tool", "lasso-tool", "space-tool"].forEach((k) => {
        if (entries[k]) tools[k] = entries[k];
      });

      return {
        ...tools,
        "tool-separator": entries["tool-separator"] ?? {
          group: "tools",
          separator: true,
        },
        "create.participant": createAction(
          "bpmn:Participant",
          "collaboration",
          "bpmn-icon-participant",
          "Pool / Lane",
        ),
        "create.start-event": createAction(
          "bpmn:StartEvent",
          "event",
          "bpmn-icon-start-event-none",
          "Start event",
        ),
        "create.intermediate-event": createAction(
          "bpmn:IntermediateThrowEvent",
          "event",
          "bpmn-icon-intermediate-event-none",
          "Intermediate event",
        ),
        "create.end-event": createAction(
          "bpmn:EndEvent",
          "event",
          "bpmn-icon-end-event-none",
          "End event",
        ),
        "create.exclusive-gateway": createAction(
          "bpmn:ExclusiveGateway",
          "gateway",
          "bpmn-icon-gateway-none",
          "Gateway",
        ),
        "create.task": createAction(
          "bpmn:Task",
          "activity",
          "bpmn-icon-task",
          "Task",
        ),
        "create.text-annotation": createAction(
          "bpmn:TextAnnotation",
          "artifact",
          "bpmn-icon-text-annotation",
          "Annotation",
        ),
        "tool-sequence-flow": connectAction(
          "bpmn-icon-connection",
          "Sequence flow",
          "sequence",
        ),
        "tool-pool-connector": connectAction(
          "bpmn-icon-connection-multi",
          "Pool connector",
          "message",
        ),
        "create.group": createAction(
          "bpmn:Group",
          "artifact",
          "bpmn-icon-group",
          "Group",
        ),
      };
    };
  }
}
