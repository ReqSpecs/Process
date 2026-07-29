/**
 * Stencil sets for the BPMN editor. "classic" is the original ProDraw look
 * (thin borders, stroked event colours); "essentials" is a bolder, more legible
 * set with filled events and blue-bordered tasks plus a trimmed palette.
 *
 * The choice is stored per-diagram as `prodraw:stencil` on the BPMN
 * <definitions> root, so it survives save/reload/export.
 */

export type Stencil = "classic" | "essentials";

export const STENCILS: { value: Stencil; label: string; hint: string }[] = [
  { value: "classic", label: "Classic", hint: "Original ProDraw shapes" },
  {
    value: "essentials",
    label: "BPMN Essentials",
    hint: "Bold filled events, focused palette",
  },
];

export type EventStyle = {
  match: string;
  stroke: string;
  width?: number;
  /** Gradient fill (top → bottom). Omit for ring-only events (white centre). */
  fillFrom?: string;
  fillTo?: string;
};

export type StencilStyle = {
  /** Per-event-type colour overrides. */
  events: EventStyle[];
  /** Default (thin) activity border width. */
  taskBorderWidth: number;
  /** Optional activity border colour (Essentials tasks are blue). */
  taskStroke?: string;
  /** Apply a subtle drop shadow to events (Essentials). */
  eventShadow?: boolean;
};

export const STENCIL_STYLES: Record<Stencil, StencilStyle> = {
  // Classic = stock bpmn.js look: default black stroke, default border weight,
  // no event colouring. (Only the step-number badge is added on top.)
  classic: {
    taskBorderWidth: 2,
    events: [],
  },
  essentials: {
    taskBorderWidth: 1.5,
    taskStroke: "#29a8e6",
    eventShadow: true,
    events: [
      // Filled, gradient events (single ring). Base colours stay vibrant; the
      // gradient adds a soft top highlight rather than washing them out.
      {
        match: "bpmn:StartEvent",
        stroke: "#0f7a34",
        fillFrom: "#5cf08c",
        fillTo: "#18b84a",
        width: 1.5,
      },
      {
        match: "bpmn:EndEvent",
        stroke: "#9e1414",
        fillFrom: "#ff8a82",
        fillTo: "#ec2b2b",
        width: 1.75,
      },
      // Ring-only events: vibrant orange double ring, white centre.
      {
        match: "bpmn:IntermediateCatchEvent",
        stroke: "#ff8c00",
        width: 2.2,
      },
      {
        match: "bpmn:IntermediateThrowEvent",
        stroke: "#ff8c00",
        width: 2.2,
      },
      { match: "bpmn:BoundaryEvent", stroke: "#ff8c00", width: 2.2 },
    ],
  },
};

/** Reads the stencil recorded in a diagram's XML; defaults to "classic". */
export function readStencil(xml: string | null | undefined): Stencil {
  if (xml && /prodraw:stencil\s*=\s*"classic"/.test(xml)) return "classic";
  // BPMN Essentials is the default palette/stencil when none is stored.
  return "essentials";
}

export type BorderWeight = "thin" | "thick";

/**
 * Reads the diagram-wide task border weight from the <definitions> tag.
 * Matches only the definitions element (not per-shape legacy attrs).
 */
export function readBorderWeight(xml: string | null | undefined): BorderWeight {
  if (!xml) return "thin";
  if (/<bpmn:definitions[^>]*prodraw:defaultBorderWeight\s*=\s*"thick"/.test(xml))
    return "thick";
  if (/<bpmn:definitions[^>]*prodraw:defaultBorderWeight\s*=\s*"thin"/.test(xml))
    return "thin";
  // Fall back to per-shape stamps (uniform after a diagram-wide toggle).
  const thick = (xml.match(/prodraw:borderWeight="thick"/g) ?? []).length;
  const thin = (xml.match(/prodraw:borderWeight="thin"/g) ?? []).length;
  if (thick || thin) return thick >= thin ? "thick" : "thin";
  return "thin";
}

/**
 * Reads the diagram-wide connector (sequence-flow) weight from <definitions>.
 * Defaults to "thick" — bpmn's stock 2px line — so existing diagrams are
 * unchanged until the user opts into thin.
 */
export function readConnectorWeight(
  xml: string | null | undefined,
): BorderWeight {
  if (!xml) return "thick";
  if (
    /<bpmn:definitions[^>]*prodraw:defaultConnectorWeight\s*=\s*"thin"/.test(xml)
  )
    return "thin";
  if (
    /<bpmn:definitions[^>]*prodraw:defaultConnectorWeight\s*=\s*"thick"/.test(xml)
  )
    return "thick";
  // Fall back to per-flow stamps (uniform after a diagram-wide toggle).
  const thin = (xml.match(/prodraw:connectorWeight="thin"/g) ?? []).length;
  const thick = (xml.match(/prodraw:connectorWeight="thick"/g) ?? []).length;
  if (thin || thick) return thin >= thick ? "thin" : "thick";
  return "thick";
}

export type CornerStyle = "sharp" | "round";

/**
 * Reads the diagram-wide connector corner style from <definitions>.
 * Defaults to "round" — bpmn's stock 5px bend.
 */
export function readCornerStyle(xml: string | null | undefined): CornerStyle {
  if (!xml) return "round";
  if (/<bpmn:definitions[^>]*prodraw:defaultCornerStyle\s*=\s*"sharp"/.test(xml))
    return "sharp";
  if (/<bpmn:definitions[^>]*prodraw:defaultCornerStyle\s*=\s*"round"/.test(xml))
    return "round";
  // Fall back to per-flow stamps (uniform after a diagram-wide toggle).
  const sharp = (xml.match(/prodraw:cornerStyle="sharp"/g) ?? []).length;
  const round = (xml.match(/prodraw:cornerStyle="round"/g) ?? []).length;
  if (sharp || round) return sharp >= round ? "sharp" : "round";
  return "round";
}
