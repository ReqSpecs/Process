"use client";

import { useState, useTransition } from "react";
import { submitFeedback } from "@/app/(app)/actions";
import { SUPPORT_EMAIL } from "@/lib/support";

const CATEGORIES = [
  { value: "feature", label: "Feature idea" },
  { value: "bug", label: "Something's broken" },
  { value: "other", label: "Other" },
];

export function FeedbackModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [category, setCategory] = useState("feature");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    const formData = new FormData();
    formData.set("category", category);
    formData.set("message", message);
    startTransition(async () => {
      const result = await submitFeedback(formData);
      // Keep the text on screen when it didn't get through — thanking someone
      // for a bug report that went nowhere is the worst of both outcomes.
      if (result.ok) setSent(true);
      else setFailed(true);
    });
  }

  function handleClose() {
    onClose();
    // reset after the close animation would finish
    setTimeout(() => {
      setSent(false);
      setFailed(false);
      setMessage("");
      setCategory("feature");
    }, 300);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Suggest a feature"
    >
      <div
        className="w-full max-w-md rounded-panel border border-hairline bg-surface p-6 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="py-6 text-center">
            <p className="text-lg font-semibold text-ink">Thank you!</p>
            <p className="mt-2 text-[14px] text-ink-soft">
              Your feedback shapes what gets built next.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 rounded-full bg-cobalt px-5 py-2 text-[14px] font-semibold text-white hover:bg-cobalt-deep"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold text-ink">Suggest a feature</h2>
            <p className="mt-1 text-[13px] text-ink-soft">
              ProDraw is built with its users. Tell us what you need.
            </p>

            <div className="mt-4 flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    category === c.value
                      ? "bg-cobalt text-white"
                      : "bg-mist text-ink-soft hover:text-ink"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {failed && (
              <p className="mt-4 rounded-lg bg-ember-tint px-3 py-2 text-[13px] font-medium text-signal">
                That didn&apos;t send. Try again, or email us at{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>
            )}

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="What would make ProDraw better for you?"
              className="mt-4 w-full resize-none rounded-lg border border-hairline bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-cobalt focus:bg-surface"
              required
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full px-4 py-2 text-[14px] font-medium text-ink-soft hover:bg-mist"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending || !message.trim()}
                className="rounded-full bg-cobalt px-5 py-2 text-[14px] font-semibold text-white hover:bg-cobalt-deep disabled:opacity-60"
              >
                {pending ? "Sending\u2026" : "Send"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
