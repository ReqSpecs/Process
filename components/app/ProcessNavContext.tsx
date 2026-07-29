"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
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
  const value = useMemo<Ctx>(() => ({ data, setData }), [data]);
  return (
    <ProcessNavCtx.Provider value={value}>{children}</ProcessNavCtx.Provider>
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
  // Depend only on the stable setter (never the context value object, whose
  // identity changes whenever `data` updates) to avoid an update loop.
  const setData = useContext(ProcessNavCtx)?.setData;
  const { project, stages, processes, currentProcessId } = data;
  useEffect(() => {
    if (!setData) return;
    setData({ project, stages, processes, currentProcessId });
    return () => setData(null);
  }, [setData, project, stages, processes, currentProcessId]);
  return null;
}
