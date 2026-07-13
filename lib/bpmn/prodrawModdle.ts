/**
 * ProDraw moddle extension: namespaced attributes stored on the BPMN XML so
 * swimlane tagging and per-element styling survive save/reload/export.
 */
export const prodrawModdleDescriptor = {
  name: "ProDraw",
  uri: "http://prodraw.app/schema/bpmn/1.0",
  prefix: "prodraw",
  xml: { tagAlias: "lowerCase" },
  associations: [],
  types: [
    {
      name: "SwimlaneParticipant",
      extends: ["bpmn:Participant"],
      properties: [{ name: "swimlane", isAttr: true, type: "Boolean" }],
    },
    {
      name: "StyledElement",
      extends: ["bpmn:BaseElement"],
      properties: [
        { name: "borderWeight", isAttr: true, type: "String" },
        { name: "textBold", isAttr: true, type: "Boolean" },
        { name: "textItalic", isAttr: true, type: "Boolean" },
        { name: "textUnderline", isAttr: true, type: "Boolean" },
        { name: "textColor", isAttr: true, type: "String" },
        { name: "fontSize", isAttr: true, type: "Integer" },
      ],
    },
  ],
};
