/** Blank starter diagram: a single start event, ready to model. */
export const DEFAULT_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Start" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="160" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

/**
 * Returns the starter diagram, optionally baking in the diagram-wide style
 * preferences (task border weight, connector weight, connector corner style) so
 * newly created processes inherit the project's remembered look. Only non-default
 * values are written, keeping the XML clean. Existing diagrams are never touched —
 * this only affects fresh XML.
 */
export function defaultDiagramXml(prefs?: {
  borderWeight?: "thin" | "thick";
  connectorWeight?: "thin" | "thick";
  cornerStyle?: "sharp" | "round";
}): string {
  const attrs: string[] = [];
  if (prefs?.borderWeight === "thick")
    attrs.push('prodraw:defaultBorderWeight="thick"');
  if (prefs?.connectorWeight === "thin")
    attrs.push('prodraw:defaultConnectorWeight="thin"');
  if (prefs?.cornerStyle === "sharp")
    attrs.push('prodraw:defaultCornerStyle="sharp"');
  if (!attrs.length) return DEFAULT_BPMN_XML;
  return DEFAULT_BPMN_XML.replace(
    'xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"',
    `xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"\n  xmlns:prodraw="http://prodraw.app/schema/bpmn/1.0"\n  ${attrs.join("\n  ")}`,
  );
}
