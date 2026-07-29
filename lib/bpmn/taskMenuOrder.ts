/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Reorders the "Change element" (replace) menu for activities so the three most
 * common task types — User, Service, Manual — sit at the top, in their own
 * group. diagram-js renders each group as a separate list, and our CSS draws a
 * hairline between the primary group and the rest.
 *
 * Registered at a lower priority than the stock ReplaceMenuProvider so it runs
 * afterwards and receives the already-built entries to transform.
 */
const PRIMARY = [
  "replace-with-user-task",
  "replace-with-service-task",
  "replace-with-manual-task",
];

export class TaskMenuOrder {
  static $inject = ["popupMenu"];

  constructor(popupMenu: any) {
    popupMenu.registerProvider("bpmn-replace", 900, this);
  }

  getPopupMenuEntries() {
    return (entries: Record<string, any>) => {
      if (!entries) return entries;

      // Only touch the task/activity menu.
      const hasPrimary = PRIMARY.some((k) => k in entries);
      if (!hasPrimary) return entries;

      const result: Record<string, any> = {};

      // Top group first (only those present after same-type filtering).
      PRIMARY.forEach((k) => {
        if (entries[k]) result[k] = { ...entries[k], group: "task-primary" };
      });

      // Everything else keeps its original order and (default) group.
      Object.keys(entries).forEach((k) => {
        if (!(k in result)) result[k] = entries[k];
      });

      return result;
    };
  }
}
