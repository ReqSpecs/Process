/**
 * BPMN Essentials shapes used by marketing mocks. Drawn to the same stencil
 * as the in-app canvas (`lib/bpmn/stencil.ts`) so stills and the animated
 * product mock stay in lockstep with what users actually get.
 */

export const LINE = "#000";
export const INK = "#1d1c1a";
export const TASK_STROKE = "#29a8e6";
export const EVENT_RING = "#ff8c00";
export const EVENT_SHADOW = "drop-shadow(0 1.5px 1.5px rgba(15, 23, 42, 0.35))";

export const TASK_W = 100;
export const TASK_H = 80;
export const EVENT_R = 18;
export const GATEWAY = 50;

const FONT = "Arial, sans-serif";

export type TaskKind = "user" | "service" | "send";

export const PO_FLOW_VIEWBOX = "-16 0 888 340";

export const PO_FLOW_TASKS: {
  x: number;
  y: number;
  kind: TaskKind;
  step: number;
  lines: string[];
}[] = [
  { x: 118, y: 128, kind: "user", step: 1, lines: ["Raise PO"] },
  { x: 424, y: 48, kind: "service", step: 2, lines: ["Send to Vendor"] },
  { x: 424, y: 208, kind: "user", step: 3, lines: ["Revise &", "Resubmit"] },
  { x: 654, y: 128, kind: "send", step: 4, lines: ["Notify Vendor"] },
];

export const PO_FLOW_FLOWS: [number, number][][] = [
  [
    [78, 168],
    [118, 168],
  ],
  [
    [218, 168],
    [258, 168],
  ],
  [
    [283, 143],
    [283, 88],
    [348, 88],
  ],
  [
    [384, 88],
    [424, 88],
  ],
  [
    [283, 193],
    [283, 248],
    [348, 248],
  ],
  [
    [384, 248],
    [424, 248],
  ],
  [
    [524, 88],
    [589, 88],
    [589, 143],
  ],
  [
    [524, 248],
    [589, 248],
    [589, 193],
  ],
  [
    [614, 168],
    [654, 168],
  ],
  [
    [754, 168],
    [794, 168],
  ],
];

export function BpmnMockDefs({ prefix }: { prefix: string }) {
  return (
    <defs>
      <marker
        id={`${prefix}-arrow`}
        viewBox="0 0 20 20"
        refX="11"
        refY="10"
        markerWidth="10"
        markerHeight="10"
        markerUnits="userSpaceOnUse"
        orient="auto"
      >
        <path
          d="M1 5 11 10 1 15Z"
          fill={LINE}
          stroke={LINE}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </marker>
      <linearGradient id={`${prefix}-start-fill`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5cf08c" />
        <stop offset="100%" stopColor="#18b84a" />
      </linearGradient>
      <linearGradient id={`${prefix}-end-fill`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff8a82" />
        <stop offset="100%" stopColor="#ec2b2b" />
      </linearGradient>
    </defs>
  );
}

export function Task({
  x,
  y,
  kind,
  step,
  lines,
}: {
  x: number;
  y: number;
  kind: TaskKind;
  step: number;
  lines: string[];
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={TASK_W}
        height={TASK_H}
        rx="10"
        fill="#fff"
        stroke={TASK_STROKE}
        strokeWidth="1.5"
      />
      <TaskMarker kind={kind} x={x + 8} y={y + 8} />
      <text
        x={x + TASK_W - 5}
        y={y + 13}
        textAnchor="end"
        fontFamily="system-ui, sans-serif"
        fontSize="11"
        fill={INK}
      >
        {step}
      </text>
      <Label cx={x + TASK_W / 2} cy={y + TASK_H / 2} lines={lines} />
    </g>
  );
}

function TaskMarker({ kind, x, y }: { kind: TaskKind; x: number; y: number }) {
  const stroke = {
    fill: "none",
    stroke: INK,
    strokeWidth: 1.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <g transform={`translate(${x} ${y})`}>
      {kind === "user" && (
        <>
          <circle cx="8" cy="4.6" r="2.9" {...stroke} />
          <path d="M2.2 14.6c0-3.2 2.6-5.3 5.8-5.3s5.8 2.1 5.8 5.3" {...stroke} />
        </>
      )}
      {kind === "service" && <ServiceCog />}
      {kind === "send" && (
        <>
          <rect x="0.8" y="3.6" width="14.4" height="9.6" rx="1" fill={INK} />
          <path
            d="M0.8 3.6 8 9.2l7.2-5.6"
            fill="none"
            stroke="#fff"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </>
      )}
    </g>
  );
}

function ServiceCog() {
  return (
    <g fill="none" stroke={INK} strokeWidth="1.2" strokeLinejoin="round">
      <path d="M6.7 1.6h2.6l.45 1.85 1.7-.7 1.85 1.85-.7 1.7 1.85.45v2.6l-1.85.45.7 1.7-1.85 1.85-1.7-.7-.45 1.85H6.7l-.45-1.85-1.7.7L2.7 11.7l.7-1.7-1.85-.45V6.95l1.85-.45-.7-1.7 1.85-1.85 1.7.7z" />
      <circle cx="8" cy="8" r="2.15" />
    </g>
  );
}

export function StartEvent({
  cx,
  cy,
  label,
  prefix,
}: {
  cx: number;
  cy: number;
  label: string;
  prefix: string;
}) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={EVENT_R}
        fill={`url(#${prefix}-start-fill)`}
        stroke="#0f7a34"
        strokeWidth="1.5"
        style={{ filter: EVENT_SHADOW }}
      />
      <ExternalLabel cx={cx} cy={cy + EVENT_R} text={label} />
    </g>
  );
}

export function EndEvent({
  cx,
  cy,
  label,
  prefix,
}: {
  cx: number;
  cy: number;
  label: string;
  prefix: string;
}) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={EVENT_R}
        fill={`url(#${prefix}-end-fill)`}
        stroke="#9e1414"
        strokeWidth="1.75"
        style={{ filter: EVENT_SHADOW }}
      />
      <ExternalLabel cx={cx} cy={cy + EVENT_R} text={label} />
    </g>
  );
}

export function IntermediateEvent({
  cx,
  cy,
  lines,
  side,
}: {
  cx: number;
  cy: number;
  lines: string[];
  side: "above" | "below";
}) {
  return (
    <g>
      <g style={{ filter: EVENT_SHADOW }}>
        <circle
          cx={cx}
          cy={cy}
          r={EVENT_R}
          fill="#fff"
          stroke={EVENT_RING}
          strokeWidth="2.2"
        />
        <circle
          cx={cx}
          cy={cy}
          r={EVENT_R - 3}
          fill="none"
          stroke={EVENT_RING}
          strokeWidth="2.2"
        />
      </g>
      {lines.map((line, i) => {
        const y =
          side === "above"
            ? cy - EVENT_R - 6 - (lines.length - 1 - i) * 13
            : cy + EVENT_R + 14 + i * 13;
        return (
          <text
            key={line}
            x={cx}
            y={y}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize="11"
            fill={LINE}
          >
            {line}
          </text>
        );
      })}
    </g>
  );
}

export function Gateway({
  cx,
  cy,
  label,
}: {
  cx: number;
  cy: number;
  label?: string;
}) {
  const half = GATEWAY / 2;
  const arm = 9;

  return (
    <g>
      <path
        d={`M${cx} ${cy - half}L${cx + half} ${cy}L${cx} ${cy + half}L${cx - half} ${cy}Z`}
        fill="#fff"
        stroke={LINE}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d={`M${cx - arm} ${cy - arm}l${arm * 2} ${arm * 2}M${cx + arm} ${cy - arm}l${-arm * 2} ${arm * 2}`}
        stroke={LINE}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {label && (
        <text
          x={cx - 6}
          y={cy - half - 8}
          textAnchor="end"
          fontFamily={FONT}
          fontSize="11"
          fill={LINE}
        >
          {label}
        </text>
      )}
    </g>
  );
}

function ExternalLabel({
  cx,
  cy,
  text,
}: {
  cx: number;
  cy: number;
  text: string;
}) {
  return (
    <text
      x={cx}
      y={cy + 15}
      textAnchor="middle"
      fontFamily={FONT}
      fontSize="11"
      fill={LINE}
    >
      {text}
    </text>
  );
}

function Label({
  cx,
  cy,
  lines,
}: {
  cx: number;
  cy: number;
  lines: string[];
}) {
  const lineHeight = 14.4;
  const first = cy + 4 - ((lines.length - 1) * lineHeight) / 2;

  return (
    <text x={cx} textAnchor="middle" fontFamily={FONT} fontSize="12" fill={LINE}>
      {lines.map((line, i) => (
        <tspan key={line} x={cx} y={first + i * lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export function orthogonal(points: [number, number][], radius = 5): string {
  if (points.length < 2) return "";

  let d = `M${points[0][0]} ${points[0][1]}`;

  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [cx, cy] = points[i];
    const [nx, ny] = points[i + 1];
    const inLength = Math.hypot(cx - px, cy - py);
    const outLength = Math.hypot(nx - cx, ny - cy);
    const r = Math.min(radius, inLength / 2, outLength / 2);

    d += ` L${cx - ((cx - px) / inLength) * r} ${cy - ((cy - py) / inLength) * r}`;
    d += ` Q${cx} ${cy} ${cx + ((nx - cx) / outLength) * r} ${cy + ((ny - cy) / outLength) * r}`;
  }

  const [lx, ly] = points[points.length - 1];
  return `${d} L${lx} ${ly}`;
}
