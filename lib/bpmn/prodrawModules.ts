/* eslint-disable @typescript-eslint/no-explicit-any */
import { ProdrawRenderer } from "./prodrawRenderer";
import { StepNumbering } from "./stepNumbering";
import { SwimlanePalette } from "./swimlanePalette";
import { SwimlaneDock } from "./swimlaneDock";

export { prodrawModdleDescriptor } from "./prodrawModdle";

/** Renderer + numbering only — safe for viewers (no palette dependency). */
export const prodrawViewerModule: any = {
  __init__: ["prodrawRenderer", "stepNumbering"],
  prodrawRenderer: ["type", ProdrawRenderer],
  stepNumbering: ["type", StepNumbering],
};

/** Full editor module: adds the swimlane palette entry + docking behaviour. */
export const prodrawModelerModule: any = {
  __init__: [
    "prodrawRenderer",
    "stepNumbering",
    "swimlanePalette",
    "swimlaneDock",
  ],
  prodrawRenderer: ["type", ProdrawRenderer],
  stepNumbering: ["type", StepNumbering],
  swimlanePalette: ["type", SwimlanePalette],
  swimlaneDock: ["type", SwimlaneDock],
};
