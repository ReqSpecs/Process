/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProdrawRenderer } from "./prodrawRenderer";
import { StepNumbering } from "./stepNumbering";
import { SwimlanePalette } from "./swimlanePalette";
import { SwimlaneDock } from "./swimlaneDock";
import { EssentialsPalette } from "./essentialsPalette";
import { TypeToEdit } from "./typeToEdit";
import { TaskMenuOrder } from "./taskMenuOrder";
import { LabelEditingTweaks } from "./labelEditingTweaks";
import { SmartFlowLayout } from "./smartFlowLayout";
import { freeformCanvasModule } from "./freeformCanvas";
import type { Stencil } from "./stencil";

export { prodrawModdleDescriptor } from "./prodrawModdle";
export type { Stencil } from "./stencil";

/** Renderer + numbering only — safe for viewers (no palette dependency). */
export function makeProdrawViewerModule(stencil: Stencil): any {
  return {
    // Include the cross-pool connector lift so standalone/cross-pool connectors
    // render on top (not greyed out behind a lane) in read-only views too, and
    // the import fix-up so standalone elements outside pools are drawn at all.
    __init__: [
      "prodrawRenderer",
      "stepNumbering",
      "crossPoolConnectionLayer",
      "freeformImport",
    ],
    prodrawRenderer: ["type", ProdrawRenderer],
    stepNumbering: ["type", StepNumbering],
    crossPoolConnectionLayer: freeformCanvasModule.crossPoolConnectionLayer,
    freeformImport: freeformCanvasModule.freeformImport,
    stencilMode: ["value", stencil],
  };
}

/**
 * Full editor module: renderer + numbering + swimlane docking, plus the palette
 * for the active stencil (trimmed "essentials" set, or the classic default +
 * swimlane entry).
 */
export function makeProdrawModelerModule(stencil: Stencil): any {
  const paletteInit =
    stencil === "essentials" ? "essentialsPalette" : "swimlanePalette";
  const module: any = {
    __init__: [
      "prodrawRenderer",
      "stepNumbering",
      "swimlaneDock",
      "typeToEdit",
      "taskMenuOrder",
      "labelEditingTweaks",
      "smartFlowLayout",
      ...freeformCanvasModule.__init__,
      paletteInit,
    ],
    prodrawRenderer: ["type", ProdrawRenderer],
    stepNumbering: ["type", StepNumbering],
    swimlaneDock: ["type", SwimlaneDock],
    typeToEdit: ["type", TypeToEdit],
    taskMenuOrder: ["type", TaskMenuOrder],
    labelEditingTweaks: ["type", LabelEditingTweaks],
    smartFlowLayout: ["type", SmartFlowLayout],
    connectIntent: freeformCanvasModule.connectIntent,
    freeformRules: freeformCanvasModule.freeformRules,
    freeformContainment: freeformCanvasModule.freeformContainment,
    freeformParticipant: freeformCanvasModule.freeformParticipant,
    keepPoolsAtRoot: freeformCanvasModule.keepPoolsAtRoot,
    preserveConnectorsOnMove: freeformCanvasModule.preserveConnectorsOnMove,
    crossPoolConnectionLayer: freeformCanvasModule.crossPoolConnectionLayer,
    freeformOrdering: freeformCanvasModule.freeformOrdering,
    freeformImport: freeformCanvasModule.freeformImport,
    stencilMode: ["value", stencil],
  };
  if (stencil === "essentials") {
    module.essentialsPalette = ["type", EssentialsPalette];
  } else {
    module.swimlanePalette = ["type", SwimlanePalette];
  }
  return module;
}
