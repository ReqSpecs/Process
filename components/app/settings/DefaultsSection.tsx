"use client";

import { useState, useTransition } from "react";
import { saveWorkspaceSettings } from "@/app/(app)/settings/actions";
import { PROJECT_STATUSES } from "@/lib/ui/projectStyle";
import type { ProjectView, WorkspaceSettings } from "@/lib/ui/settings";
import type { ProcessDocStatus, ProjectStatus } from "@/lib/types";
import { Card, Row, Segmented, Select } from "./ui";

const PROCESS_STATUSES: { value: ProcessDocStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In review" },
  { value: "approved", label: "Approved" },
];

export function DefaultsSection({
  settings,
}: {
  settings: WorkspaceSettings;
}) {
  const [defaults, setDefaults] = useState(settings.defaults);
  const [, startTransition] = useTransition();

  const save = (patch: Partial<WorkspaceSettings["defaults"]>) => {
    setDefaults((d) => ({ ...d, ...patch }));
    startTransition(() => saveWorkspaceSettings({ defaults: patch }));
  };

  return (
    <div className="space-y-5">
      <Card title="New items" desc="Applied when you create a project or process.">
        <Row label="Default project status">
          <Select<ProjectStatus>
            value={defaults.projectStatus}
            onChange={(v) => save({ projectStatus: v })}
            options={PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
          />
        </Row>
        <Row label="Default process status">
          <Select<ProcessDocStatus>
            value={defaults.processStatus}
            onChange={(v) => save({ processStatus: v })}
            options={PROCESS_STATUSES}
          />
        </Row>
      </Card>

      <Card title="Views & export" desc="Your preferred project view and export settings.">
        <Row label="Default project view">
          <Segmented<ProjectView>
            options={[
              { value: "modern", label: "Modern" },
              { value: "traditional", label: "Traditional" },
            ]}
            value={defaults.projectView}
            onChange={(v) => save({ projectView: v })}
          />
        </Row>
        <Row label="Default export size">
          <Select
            value="a3"
            onChange={() => {}}
            options={[{ value: "a3", label: "A3" }]}
          />
        </Row>
        <Row label="Default export behaviour" hint="Which layout the project export uses.">
          <Select
            value="current"
            onChange={() => {}}
            options={[{ value: "current", label: "Current view" }]}
          />
        </Row>
      </Card>
    </div>
  );
}
