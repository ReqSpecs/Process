"use client";

import { useState } from "react";
import { ArrowSquareOut, CaretDown, ChatCircle, Lightbulb } from "@phosphor-icons/react";
import { FeedbackModal } from "@/components/app/FeedbackModal";
import { HELP_TOPICS } from "@/lib/ui/settings";
import { Card } from "./ui";

const SUPPORT_EMAIL = "support@prodraw.app";
const ROADMAP_URL = "https://prodraw.app/roadmap";

export function HelpSection() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="space-y-5">
      {HELP_TOPICS.map((group) => (
        <Card key={group.heading} title={group.heading}>
          <div>
            {group.items.map((item) => (
              <details
                key={item.q}
                className="group border-b border-hairline py-3 last:border-0"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13.5px] font-medium text-ink">
                  {item.q}
                  <CaretDown
                    size={14}
                    weight="bold"
                    className="shrink-0 text-ink-faint transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </Card>
      ))}

      <Card title="Get in touch" desc="We build ProDraw with its users.">
        <div className="grid gap-2 py-3 sm:grid-cols-2">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 rounded-xl border border-hairline bg-surface p-4 transition-colors hover:border-ink-faint"
          >
            <ChatCircle size={20} weight="bold" className="text-cobalt" />
            <div>
              <p className="text-[13.5px] font-semibold text-ink">Contact support</p>
              <p className="text-[12.5px] text-ink-faint">{SUPPORT_EMAIL}</p>
            </div>
          </a>
          <button
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-3 rounded-xl border border-hairline bg-surface p-4 text-left transition-colors hover:border-ink-faint"
          >
            <Lightbulb size={20} weight="bold" className="text-gold" />
            <div>
              <p className="text-[13.5px] font-semibold text-ink">Request a feature</p>
              <p className="text-[12.5px] text-ink-faint">Tell us what you need</p>
            </div>
          </button>
          <a
            href={ROADMAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-hairline bg-surface p-4 transition-colors hover:border-ink-faint"
          >
            <ArrowSquareOut size={20} weight="bold" className="text-ink-soft" />
            <div>
              <p className="text-[13.5px] font-semibold text-ink">Roadmap</p>
              <p className="text-[12.5px] text-ink-faint">See what&apos;s coming</p>
            </div>
          </a>
        </div>
      </Card>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
