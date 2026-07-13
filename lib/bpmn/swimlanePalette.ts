/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Adds a "Swimlane" palette entry: a normal BPMN participant (pool) tagged with
 * prodraw:swimlane so it can dock/stack with other swimlanes (see swimlaneDock).
 */
export class SwimlanePalette {
  static $inject = ["palette", "create", "elementFactory", "translate"];

  private _create: any;
  private _elementFactory: any;
  private _translate: any;

  constructor(
    palette: any,
    create: any,
    elementFactory: any,
    translate: any,
  ) {
    this._create = create;
    this._elementFactory = elementFactory;
    this._translate = translate;
    palette.registerProvider(this);
  }

  getPaletteEntries() {
    const create = this._create;
    const elementFactory = this._elementFactory;
    const translate = this._translate;

    function startCreate(event: any) {
      const shape = elementFactory.createParticipantShape();
      const bo = shape.businessObject;
      if (bo && bo.set) bo.set("prodraw:swimlane", true);
      create.start(event, shape);
    }

    return {
      "create.prodraw-swimlane": {
        group: "collaboration",
        className: "bpmn-icon-participant",
        title: translate("Create Swimlane"),
        action: { dragstart: startCreate, click: startCreate },
      },
    };
  }
}
