/* eslint-disable @typescript-eslint/no-explicit-any */
import { getBusinessObject } from "bpmn-js/lib/util/ModelUtil";

/**
 * Makes in-place label editing behave consistently for elements that carry an
 * external label (events, gateways, …):
 *
 *  1. Editing a label ALWAYS runs through the owning object. Double-clicking the
 *     label text and double-clicking the object now open the exact same editor
 *     (previously the label path produced a stock narrow box, badly so with
 *     enlarged fonts).
 *  2. The editor uses the element's custom font size (prodraw:fontSize) so
 *     typing is WYSIWYG.
 *  3. External-label editors get a comfortable minimum width so short/enlarged
 *     text wraps naturally instead of stacking one character per line.
 *
 * Tasks (embedded labels) are intentionally left untouched.
 */
export class LabelEditingTweaks {
  static $inject = ["labelEditingProvider", "canvas", "directEditing"];

  constructor(provider: any, canvas: any, directEditing: any) {
    // 1. Always edit via the owning object, never the label element itself.
    if (directEditing && typeof directEditing.activate === "function") {
      const originalActivate = directEditing.activate.bind(directEditing);
      directEditing.activate = (element: any) => {
        const target =
          element && element.labelTarget ? element.labelTarget : element;
        return originalActivate(target);
      };
    }

    // 2 + 3. Match custom font size and widen narrow external-label editors.
    if (provider && typeof provider.getEditingBBox === "function") {
      const originalBBox = provider.getEditingBBox.bind(provider);
      provider.getEditingBBox = (element: any) => {
        const result = originalBBox(element);
        try {
          const zoom = canvas.zoom() || 1;
          const bo = getBusinessObject(element);
          const size = Number(bo?.get?.("prodraw:fontSize")) || 0;
          const hasExternalLabel = !!element.label || !!element.labelTarget;

          if (size && result?.style) {
            result.style.fontSize = `${size * zoom}px`;
            result.style.lineHeight = 1.2;
          }

          if (hasExternalLabel && result?.bounds) {
            const minWidth = Math.max(90 * zoom, size ? size * zoom * 7 : 0);
            if ((result.bounds.width || 0) < minWidth) {
              const centreX = result.bounds.x + (result.bounds.width || 0) / 2;
              result.bounds.width = minWidth;
              result.bounds.x = centreX - minWidth / 2;
            }
            if (size) {
              const minHeight = size * zoom * 1.6;
              if ((result.bounds.height || 0) < minHeight) {
                result.bounds.height = minHeight;
              }
            }
          }
        } catch {
          /* fall back to the stock editing box on any failure */
        }
        return result;
      };
    }
  }
}
