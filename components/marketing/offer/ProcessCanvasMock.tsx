/**
 * A still of a real ProDraw BPMN diagram, drawn to the Essentials stencil
 * (see `lib/bpmn/stencil.ts`). Chrome is omitted so the process itself is
 * the first thing a visitor sees.
 *
 * Laid out at a fixed pixel width — wrap it in `OfferMockFrame` so it scales
 * down on phones instead of crushing.
 */

import {
  BpmnMockDefs,
  EndEvent,
  Gateway,
  IntermediateEvent,
  LINE,
  PO_FLOW_FLOWS,
  PO_FLOW_TASKS,
  PO_FLOW_VIEWBOX,
  StartEvent,
  Task,
  orthogonal,
} from "./bpmnMockShapes";

const NODE =
  "[transform-box:fill-box] origin-center [filter:drop-shadow(0_2px_4px_rgba(29,28,26,0.14))] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none hover:-translate-y-px hover:scale-[1.02]";

export function ProcessCanvasMock() {
  return (
    <div className="h-[320px] w-full sm:h-[380px]">
      <Diagram />
    </div>
  );
}

function Diagram() {
  return (
    <svg
      viewBox={PO_FLOW_VIEWBOX}
      className="h-full w-full overflow-visible"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="A BPMN 2.0 purchase-order approval diagram"
    >
      <BpmnMockDefs prefix="pcm" />

      {PO_FLOW_FLOWS.map((points, i) => (
        <path
          key={i}
          d={orthogonal(points)}
          fill="none"
          stroke={LINE}
          strokeWidth="2"
          markerEnd="url(#pcm-arrow)"
        />
      ))}

      <g className={NODE}>
        <StartEvent prefix="pcm" cx={60} cy={168} label="Requisition raised" />
      </g>
      <g className={NODE}>
        <EndEvent prefix="pcm" cx={812} cy={168} label="PO issued" />
      </g>

      {PO_FLOW_TASKS.map((task) => (
        <g key={task.step} className={NODE}>
          <Task {...task} />
        </g>
      ))}

      <g className={NODE}>
        <Gateway cx={283} cy={168} />
      </g>
      <g className={NODE}>
        <IntermediateEvent
          cx={366}
          cy={88}
          lines={["PO Raised"]}
          side="below"
        />
      </g>
      <g className={NODE}>
        <IntermediateEvent
          cx={366}
          cy={248}
          lines={["Issue with PO", "Encountered"]}
          side="below"
        />
      </g>
      <g className={NODE}>
        <Gateway cx={589} cy={168} />
      </g>
    </svg>
  );
}
