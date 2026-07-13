"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ArchitectureStage, ProcessRow, Project } from "@/lib/types";

export type ProcessNavData = {
  project: Project;
  stages: ArchitectureStage[];
  processes: ProcessRow[];
  currentProcessId: string;
};

type Ctx = {
  data: ProcessNavData | null;
  setData: (data: ProcessNavData | null) => void;
};

const ProcessNavCtx = createContext<Ctx | null>(null);

/** Wraps the app layout so the sidebar can react to the active process page. */
export function ProcessNavProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProcessNavData | null>(null);
  return (
    <ProcessNavCtx.Provider value={{ data, setData }}>
      {children}
    </ProcessNavCtx.Provider>
  );
}

export function useProcessNav() {
  return useContext(ProcessNavCtx);
}

/**
 * Rendered by the process page to publish its project tree to the sidebar.
 * Clears the tree on unmount so leaving the editor restores the project list.
 */
export function SetProcessNav(data: ProcessNavData) {
  const ctx = useContext(ProcessNavCtx);
  const { project, stages, processes, currentProcessId } = data;
  useEffect(() => {
    ctx?.setData({ project, stages, processes, currentProcessId });
    return () => ctx?.setData(null);
  }, [ctx, project, stages, processes, currentProcessId]);
  return null;
}
