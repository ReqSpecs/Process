/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Lets the user rename an element by simply selecting it and starting to type —
 * no double-click required. On the first printable keystroke it opens the
 * label editor and replaces the label with what's typed (Visio/PowerPoint-style
 * overwrite). Once editing is active it gets out of the way so the textbox
 * behaves normally.
 */
export class TypeToEdit {
  static $inject = ["eventBus", "selection", "directEditing"];

  constructor(eventBus: any, selection: any, directEditing: any) {
    const onKeydown = (e: KeyboardEvent) => {
      // Ignore shortcuts and non-character keys (Enter, Tab, arrows, F-keys…).
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key == null || e.key.length !== 1 || e.key === " ") return;

      // Don't hijack typing that belongs to a real input/textarea/editable.
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      )
        return;

      if (directEditing.isActive()) return;

      const sel = selection.get();
      if (!sel || sel.length !== 1) return;

      const element = sel[0];
      const activated = directEditing.activate(element);
      if (!activated) return;

      // The keystroke that opened the editor won't reach the new textbox, so
      // seed it with the typed character (replacing the selected-all content).
      e.preventDefault();
      const content = directEditing._textbox?.content;
      if (!content) return;
      content.textContent = e.key;

      const range = document.createRange();
      range.selectNodeContents(content);
      range.collapse(false);
      const domSel = window.getSelection();
      domSel?.removeAllRanges();
      domSel?.addRange(range);
    };

    document.addEventListener("keydown", onKeydown, true);
    eventBus.on("diagram.destroy", () => {
      document.removeEventListener("keydown", onKeydown, true);
    });
  }
}
