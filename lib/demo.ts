/**
 * Local "demo mode" — lets you sign in as test@prodraw.ai / 123 (or use the
 * "Try the demo" button) and click through the whole app without any
 * Supabase/Stripe backend configured.
 *
 * When `NEXT_PUBLIC_DEMO_MODE=true` and the demo cookie is present, the server
 * `createClient()` returns the Supabase-shaped fake client below, backed by an
 * in-memory store seeded with a sample project, chevron architecture and a
 * BPMN process. Writes mutate the store, so CRUD works for the session
 * (state resets when the dev server restarts). This is strictly dev-only and
 * never runs when the flag is off.
 */

import { DEFAULT_BPMN_XML } from "@/lib/bpmn/defaultDiagram";

export const DEMO_EMAIL = "test@prodraw.ai";
export const DEMO_PASSWORD = "123";
export const DEMO_COOKIE = "prodraw_demo";

export const DEMO_USER = { id: "demo-user", email: DEMO_EMAIL } as const;

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

// ---------------------------------------------------------------------------
// In-memory store
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;
type Tables = Record<string, Row[]>;

type Store = { tables: Tables };

const GLOBAL_KEY = "__PRODRAW_DEMO_STORE__";

/** A richer starter diagram (Start → Task → Decision → parallel tasks → End). */
const SAMPLE_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_demo"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_demo" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Start Event">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Task 1">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_1" name="Decision?">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_2a" name="Task 2a">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_2b" name="Task 2b">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="End Event">
      <bpmn:incoming>Flow_5</bpmn:incoming>
      <bpmn:incoming>Flow_6</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Gateway_1" targetRef="Task_2a" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Gateway_1" targetRef="Task_2b" />
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_2a" targetRef="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_2b" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_demo">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="180" y="222" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="166" y="265" width="64" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="270" y="200" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1" isMarkerVisible="true">
        <dc:Bounds x="425" y="215" width="50" height="50" />
        <bpmndi:BPMNLabel><dc:Bounds x="420" y="272" width="60" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_2a_di" bpmnElement="Task_2a">
        <dc:Bounds x="540" y="100" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_2b_di" bpmnElement="Task_2b">
        <dc:Bounds x="540" y="300" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="732" y="222" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="718" y="265" width="64" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="216" y="240" />
        <di:waypoint x="270" y="240" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="370" y="240" />
        <di:waypoint x="425" y="240" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="450" y="215" />
        <di:waypoint x="450" y="140" />
        <di:waypoint x="540" y="140" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="450" y="265" />
        <di:waypoint x="450" y="340" />
        <di:waypoint x="540" y="340" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5">
        <di:waypoint x="640" y="140" />
        <di:waypoint x="750" y="140" />
        <di:waypoint x="750" y="222" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_6_di" bpmnElement="Flow_6">
        <di:waypoint x="640" y="340" />
        <di:waypoint x="750" y="340" />
        <di:waypoint x="750" y="258" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

function nowIso(): string {
  return new Date().toISOString();
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function seed(): Store {
  const created = new Date(Date.now() - 3 * 86_400_000).toISOString();

  const workspace: Row = {
    id: "demo-ws",
    owner_id: DEMO_USER.id,
    name: "Acme Operations",
    trial_ends_at: daysFromNow(7),
    stripe_customer_id: null,
    stripe_subscription_id: null,
    subscription_status: "trialing",
    billing_alert: null,
    currency: null,
    created_at: created,
    updated_at: created,
  };

  const project: Row = {
    id: "demo-proj",
    workspace_id: "demo-ws",
    name: "Finance Transformation",
    description: "End-to-end procure-to-pay process map.",
    status: "active",
    icon: null,
    color: null,
    sort_order: 0,
    created_at: created,
    updated_at: nowIso(),
  };

  const stages: Row[] = [
    ["demo-stage-1", "Identify Need", "lime"],
    ["demo-stage-2", "Select Supplier", "violet"],
    ["demo-stage-3", "Procure to Pay", "cobalt"],
    ["demo-stage-4", "Receive Goods", "ember"],
    ["demo-stage-5", "Invoice Processing", "magenta"],
  ].map(([id, name, color], i) => ({
    id,
    project_id: "demo-proj",
    name,
    color,
    sort_order: i,
    created_at: created,
    updated_at: created,
  }));

  // Compact factory for a demo process/group row.
  let seq = 0;
  const proc = (o: {
    id?: string;
    stage: string;
    name: string;
    group?: boolean;
    parent?: string | null;
    bpmn?: string;
    owner?: string;
    status?: string;
  }): Row => ({
    id: o.id ?? `demo-proc-${++seq}`,
    project_id: "demo-proj",
    stage_id: o.stage,
    parent_id: o.parent ?? null,
    is_group: o.group ?? false,
    name: o.name,
    bpmn_xml: o.group ? "" : o.bpmn ?? DEFAULT_BPMN_XML,
    doc_owner: o.owner ?? "",
    doc_status: o.status ?? "draft",
    doc_inputs: "",
    doc_outputs: "",
    doc_systems: "",
    doc_risks: "",
    doc_notes: "",
    sort_order: 0,
    created_at: created,
    updated_at: created,
  });

  const processes: Row[] = [
    // Identify Need
    proc({ stage: "demo-stage-1", name: "Raise Requisition" }),
    proc({ stage: "demo-stage-1", name: "Budget Check" }),
    proc({ stage: "demo-stage-1", name: "Needs Assessment" }),
    // Select Supplier — with a collapsible group
    proc({ id: "demo-grp-1", stage: "demo-stage-2", name: "Vendor Evaluation", group: true }),
    proc({ stage: "demo-stage-2", name: "Vendor Shortlist", parent: "demo-grp-1" }),
    proc({ stage: "demo-stage-2", name: "RFQ Sent", parent: "demo-grp-1" }),
    proc({ stage: "demo-stage-2", name: "Supplier Scoring", parent: "demo-grp-1" }),
    proc({
      stage: "demo-stage-2",
      name: "Contract Review",
      owner: "Marcus Lee",
    }),
    // Procure to Pay
    proc({
      id: "demo-proc-po",
      stage: "demo-stage-3",
      name: "PO Approval",
      bpmn: SAMPLE_BPMN_XML,
      owner: "Sarah Johnson",
      status: "in_review",
    }),
    proc({ stage: "demo-stage-3", name: "3-Way Match" }),
    proc({ stage: "demo-stage-3", name: "PO Dispatch" }),
    // Receive Goods
    proc({ stage: "demo-stage-4", name: "Goods Receipt" }),
    proc({ stage: "demo-stage-4", name: "Quality Check" }),
    // Invoice Processing
    proc({ stage: "demo-stage-5", name: "Invoice Match" }),
    proc({ stage: "demo-stage-5", name: "Payment Run" }),
    proc({ stage: "demo-stage-5", name: "Dispute Handling" }),
  ];

  return {
    tables: {
      workspaces: [workspace],
      projects: [project],
      architecture_stages: stages,
      processes,
      process_versions: [],
      feedback: [],
      blocked_email_domains: [],
    },
  };
}

function getStore(): Store {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: Store };
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = seed();
  return g[GLOBAL_KEY];
}

// ---------------------------------------------------------------------------
// Supabase-shaped query builder over the in-memory store
// ---------------------------------------------------------------------------

type QueryResult<T> = { data: T; error: null };

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2)}`;
}

function compare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function withDefaults(table: string, payload: Row): Row {
  const now = nowIso();
  const base: Row = { id: newId(), created_at: now, updated_at: now };

  const perTable: Record<string, Row> = {
    projects: {
      description: "",
      status: "draft",
      icon: null,
      color: null,
      sort_order: 0,
    },
    architecture_stages: { color: "cobalt", sort_order: 0 },
    processes: {
      stage_id: null,
      parent_id: null,
      is_group: false,
      bpmn_xml: DEFAULT_BPMN_XML,
      doc_owner: "",
      doc_status: "draft",
      doc_inputs: "",
      doc_outputs: "",
      doc_systems: "",
      doc_risks: "",
      doc_notes: "",
      sort_order: 0,
    },
  };

  return { ...(perTable[table] ?? {}), ...base, ...payload };
}

type Order = { col: string; asc: boolean };

class DemoQuery<T = unknown> implements PromiseLike<QueryResult<T>> {
  private op: "select" | "insert" | "update" | "delete" = "select";
  private payload: Row | null = null;
  private filters: Array<[string, unknown]> = [];
  private orders: Order[] = [];
  private limitN: number | null = null;
  private mode: "single" | "maybe" | null = null;

  constructor(
    private readonly store: Store,
    private readonly table: string,
  ) {}

  select(): this {
    // For reads this begins the query; for insert/update it's a returning
    // clause. Either way we don't need the column list for the demo.
    return this;
  }

  insert(payload: Row): this {
    this.op = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Row): this {
    this.op = "update";
    this.payload = payload;
    return this;
  }

  delete(): this {
    this.op = "delete";
    return this;
  }

  eq(col: string, val: unknown): this {
    this.filters.push([col, val]);
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    this.orders.push({ col, asc: opts?.ascending !== false });
    return this;
  }

  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  returns<R>(): PromiseLike<QueryResult<R>> {
    return this as unknown as PromiseLike<QueryResult<R>>;
  }

  single<R = T>(): Promise<QueryResult<R | null>> {
    this.mode = "single";
    return this.exec<R | null>();
  }

  maybeSingle<R = T>(): Promise<QueryResult<R | null>> {
    this.mode = "maybe";
    return this.exec<R | null>();
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.exec<T>().then(
      onfulfilled as (v: QueryResult<T>) => TResult1,
      onrejected,
    );
  }

  private rows(): Row[] {
    if (!this.store.tables[this.table]) this.store.tables[this.table] = [];
    return this.store.tables[this.table];
  }

  private matches(row: Row): boolean {
    return this.filters.every(([col, val]) => row[col] === val);
  }

  private async exec<R>(): Promise<QueryResult<R>> {
    const rows = this.rows();

    if (this.op === "insert" && this.payload) {
      const row = withDefaults(this.table, this.payload);
      rows.push(row);
      return this.shape<R>(this.mode ? row : null);
    }

    if (this.op === "update" && this.payload) {
      const matched = rows.filter((r) => this.matches(r));
      for (const r of matched) {
        Object.assign(r, this.payload, { updated_at: nowIso() });
      }
      return this.shape<R>(this.mode ? (matched[0] ?? null) : null);
    }

    if (this.op === "delete") {
      this.store.tables[this.table] = rows.filter((r) => !this.matches(r));
      return this.shape<R>(null);
    }

    // select
    let out = rows.filter((r) => this.matches(r));
    for (const { col, asc } of [...this.orders].reverse()) {
      out = [...out].sort((a, b) => (asc ? 1 : -1) * compare(a[col], b[col]));
    }
    if (this.limitN != null) out = out.slice(0, this.limitN);

    if (this.mode) return this.shape<R>(out[0] ?? null);
    return { data: out as unknown as R, error: null };
  }

  private shape<R>(value: unknown): QueryResult<R> {
    return { data: (value as R) ?? (null as R), error: null };
  }
}

type DemoAuthResult = { data: { user: typeof DEMO_USER }; error: null };

type DemoClient = {
  auth: {
    getUser: () => Promise<DemoAuthResult>;
    /** Profile edits in Settings are accepted and discarded. */
    updateUser: () => Promise<DemoAuthResult>;
    signOut: () => Promise<{ error: null }>;
  };
  from: (table: string) => DemoQuery;
};

export function createDemoClient(): DemoClient {
  const store = getStore();
  const user = async () => ({ data: { user: DEMO_USER }, error: null } as const);
  return {
    auth: {
      getUser: user,
      updateUser: user,
      signOut: async () => ({ error: null }),
    },
    from: (table: string) => new DemoQuery(store, table),
  };
}
