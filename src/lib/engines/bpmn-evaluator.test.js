import { describe, it, expect } from 'vitest';
import {
  evaluate,
  countElements,
  checkLaneStructure,
  checkStartAndEndEvents,
  checkErrorBoundaryOnSubprocess,
  checkDefaultPathOnExclusiveGateway,
  checkAuditTaskPresence,
  checkControlPointPresence,
  checkSequenceFlowCompleteness,
  checkPatternHasErrorHandling,
  checkPatternHasDefaultPaths,
  checkPatternHasAuditTrail,
  checkPatternHasControlPoints,
  checkPatternHasLanes,
  checkPatternIsCompleteFlow,
  checkPatternHasStartAndEnd,
  detectAntipatternDisconnectedElements,
  detectAntipatternMissingErrorEvents,
  detectAntipatternNoDefaultGatewayPath,
  detectAntipatternSingleLaneOnly,
  detectAntipatternNoExceptionPath
} from './bpmn-evaluator.js';

const NS = 'xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"';

function xml(body) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions ${NS}>
  <bpmn:process id="Process_1" isExecutable="false">
    ${body}
  </bpmn:process>
</bpmn:definitions>`;
}

function parse(xmlString) {
  return new DOMParser().parseFromString(xmlString, 'text/xml');
}

/* ---------- countElements ---------- */

describe('countElements', () => {
  it('counts exclusive gateways in diagram', () => {
    const doc = parse(xml(`
      <bpmn:exclusiveGateway id="GW1" />
      <bpmn:exclusiveGateway id="GW2" />
    `));
    expect(countElements(doc, 'bpmn:ExclusiveGateway')).toBe(2);
  });

  it('returns 0 when element not present', () => {
    const doc = parse(xml(`<bpmn:task id="T1" />`));
    expect(countElements(doc, 'bpmn:ExclusiveGateway')).toBe(0);
  });

  it('handles unprefixed type name', () => {
    const doc = parse(xml(`<bpmn:parallelGateway id="GW1" />`));
    expect(countElements(doc, 'parallelGateway')).toBe(1);
  });
});

/* ---------- checkLaneStructure ---------- */

describe('checkLaneStructure', () => {
  it('returns true with 2+ lanes', () => {
    const doc = parse(xml(`
      <bpmn:laneSet>
        <bpmn:lane id="L1" name="IT" />
        <bpmn:lane id="L2" name="Risk" />
      </bpmn:laneSet>
    `));
    expect(checkLaneStructure(doc)).toBe(true);
  });

  it('returns false with 0 lanes', () => {
    const doc = parse(xml(`<bpmn:task id="T1" />`));
    expect(checkLaneStructure(doc)).toBe(false);
  });
});

/* ---------- checkStartAndEndEvents ---------- */

describe('checkStartAndEndEvents', () => {
  it('returns true with 1 start and 1 end', () => {
    const doc = parse(xml(`
      <bpmn:startEvent id="S1" />
      <bpmn:endEvent id="E1" />
    `));
    expect(checkStartAndEndEvents(doc)).toBe(true);
  });

  it('returns false with no start event', () => {
    const doc = parse(xml(`<bpmn:endEvent id="E1" />`));
    expect(checkStartAndEndEvents(doc)).toBe(false);
  });

  it('returns false with no end events', () => {
    const doc = parse(xml(`<bpmn:startEvent id="S1" />`));
    expect(checkStartAndEndEvents(doc)).toBe(false);
  });
});

/* ---------- checkErrorBoundaryOnSubprocess ---------- */

describe('checkErrorBoundaryOnSubprocess', () => {
  it('returns true when subprocess has boundary event', () => {
    const doc = parse(xml(`
      <bpmn:subProcess id="SP1">
        <bpmn:startEvent id="S1" />
        <bpmn:endEvent id="E1" />
      </bpmn:subProcess>
      <bpmn:boundaryEvent id="BE1" attachedToRef="SP1">
        <bpmn:errorEventDefinition />
      </bpmn:boundaryEvent>
    `));
    expect(checkErrorBoundaryOnSubprocess(doc)).toBe(true);
  });

  it('returns false when subprocess lacks boundary event', () => {
    const doc = parse(xml(`
      <bpmn:subProcess id="SP1">
        <bpmn:startEvent id="S1" />
        <bpmn:endEvent id="E1" />
      </bpmn:subProcess>
    `));
    expect(checkErrorBoundaryOnSubprocess(doc)).toBe(false);
  });

  it('returns true when no subprocesses exist', () => {
    const doc = parse(xml(`<bpmn:task id="T1" />`));
    expect(checkErrorBoundaryOnSubprocess(doc)).toBe(true);
  });
});

/* ---------- checkDefaultPathOnExclusiveGateway ---------- */

describe('checkDefaultPathOnExclusiveGateway', () => {
  it('returns true when all gateways have default', () => {
    const doc = parse(xml(`
      <bpmn:exclusiveGateway id="GW1" default="Flow1" />
      <bpmn:exclusiveGateway id="GW2" default="Flow2" />
    `));
    expect(checkDefaultPathOnExclusiveGateway(doc)).toBe(true);
  });

  it('returns false when gateway missing default', () => {
    const doc = parse(xml(`<bpmn:exclusiveGateway id="GW1" />`));
    expect(checkDefaultPathOnExclusiveGateway(doc)).toBe(false);
  });
});

/* ---------- checkAuditTaskPresence ---------- */

describe('checkAuditTaskPresence', () => {
  it('returns true when task name contains "approve"', () => {
    const doc = parse(xml(`<bpmn:task id="T1" name="Approve Request" />`));
    expect(checkAuditTaskPresence(doc)).toBe(true);
  });

  it('returns true when task name contains "review"', () => {
    const doc = parse(xml(`<bpmn:userTask id="UT1" name="Peer Review" />`));
    expect(checkAuditTaskPresence(doc)).toBe(true);
  });

  it('returns false when no task has audit keywords', () => {
    const doc = parse(xml(`<bpmn:task id="T1" name="Do Work" />`));
    expect(checkAuditTaskPresence(doc)).toBe(false);
  });
});

/* ---------- checkSequenceFlowCompleteness ---------- */

describe('checkSequenceFlowCompleteness', () => {
  it('returns true when all flow objects are connected', () => {
    const doc = parse(xml(`
      <bpmn:startEvent id="S1" />
      <bpmn:task id="T1" name="Do Work" />
      <bpmn:endEvent id="E1" />
      <bpmn:sequenceFlow id="F1" sourceRef="S1" targetRef="T1" />
      <bpmn:sequenceFlow id="F2" sourceRef="T1" targetRef="E1" />
    `));
    expect(checkSequenceFlowCompleteness(doc)).toBe(true);
  });

  it('returns false when a task has no outgoing flow', () => {
    const doc = parse(xml(`
      <bpmn:startEvent id="S1" />
      <bpmn:task id="T1" name="Dangling" />
      <bpmn:endEvent id="E1" />
      <bpmn:sequenceFlow id="F1" sourceRef="S1" targetRef="T1" />
    `));
    expect(checkSequenceFlowCompleteness(doc)).toBe(false);
  });
});

/* ---------- Pattern Checkers ---------- */

describe('checkPatternHasErrorHandling', () => {
  it('passes when subprocess has boundary error event', () => {
    const doc = parse(xml(`
      <bpmn:subProcess id="SP1">
        <bpmn:startEvent id="S1" />
        <bpmn:endEvent id="E1" />
      </bpmn:subProcess>
      <bpmn:boundaryEvent id="BE1" attachedToRef="SP1">
        <bpmn:errorEventDefinition />
      </bpmn:boundaryEvent>
    `));
    expect(checkPatternHasErrorHandling(doc).passed).toBe(true);
  });

  it('fails when subprocess lacks boundary event', () => {
    const doc = parse(xml(`
      <bpmn:subProcess id="SP1">
        <bpmn:startEvent id="S1" />
        <bpmn:endEvent id="E1" />
      </bpmn:subProcess>
    `));
    expect(checkPatternHasErrorHandling(doc).passed).toBe(false);
  });
});

describe('checkPatternHasDefaultPaths', () => {
  it('passes when all gateways have default', () => {
    const doc = parse(xml(`<bpmn:exclusiveGateway id="GW1" default="F1" />`));
    expect(checkPatternHasDefaultPaths(doc).passed).toBe(true);
  });

  it('fails when a gateway lacks default', () => {
    const doc = parse(xml(`<bpmn:exclusiveGateway id="GW1" />`));
    expect(checkPatternHasDefaultPaths(doc).passed).toBe(false);
  });
});

/* ---------- Antipattern Detectors ---------- */

describe('detectAntipatternDisconnectedElements', () => {
  it('finds disconnected task', () => {
    const doc = parse(xml(`<bpmn:task id="T1" name="Orphan" />`));
    expect(detectAntipatternDisconnectedElements(doc).found).toBe(true);
  });

  it('does not flag connected elements', () => {
    const doc = parse(xml(`
      <bpmn:startEvent id="S1" />
      <bpmn:task id="T1" name="Connected" />
      <bpmn:sequenceFlow id="F1" sourceRef="S1" targetRef="T1" />
    `));
    expect(detectAntipatternDisconnectedElements(doc).found).toBe(false);
  });
});

describe('detectAntipatternNoDefaultGatewayPath', () => {
  it('finds gateway without default', () => {
    const doc = parse(xml(`<bpmn:exclusiveGateway id="GW1" />`));
    expect(detectAntipatternNoDefaultGatewayPath(doc).found).toBe(true);
  });
});

describe('detectAntipatternNoExceptionPath', () => {
  it('flags missing exception path when gateways exist', () => {
    const doc = parse(xml(`
      <bpmn:exclusiveGateway id="GW1" default="F1" />
      <bpmn:endEvent id="E1" />
    `));
    expect(detectAntipatternNoExceptionPath(doc).found).toBe(true);
  });

  it('skips check when no gateways', () => {
    const doc = parse(xml(`<bpmn:task id="T1" />`));
    expect(detectAntipatternNoExceptionPath(doc).found).toBe(false);
  });
});

/* ---------- Edge Cases ---------- */

describe('edge cases', () => {
  it('handles empty XML', () => {
    const result = evaluate('', { max_points: 10 });
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
  });

  it('handles malformed XML', () => {
    const result = evaluate('<not-valid>', { max_points: 10 });
    expect(result.passed).toBe(false);
  });

  it('handles missing rubric gracefully', () => {
    const doc = xml(`<bpmn:task id="T1" name="Test" />`);
    const result = evaluate(doc, null);
    expect(result.score).toBe(0);
    expect(result.element_checks).toEqual([]);
  });
});

/* ---------- Full Evaluation Integration ---------- */

describe('full evaluation integration', () => {
  const rubric = {
    max_points: 20,
    rubric: {
      required_elements: [
        { type: 'bpmn:ExclusiveGateway', minimum_count: 2, points: 4, description: 'At least 2 gateways' },
        { type: 'bpmn:Task', minimum_count: 1, points: 2, description: 'At least 1 task' }
      ],
      required_patterns: [
        { pattern_id: 'has_start_and_end', check_function: 'has_start_and_end', points: 3, description: 'Start and end events' },
        { pattern_id: 'has_audit_trail', check_function: 'has_audit_trail', points: 3, description: 'Audit task' }
      ],
      forbidden_antipatterns: [
        { pattern_id: 'disconnected_elements', description: 'No orphaned elements', check_function: 'disconnected_elements', penalty: 5 },
        { pattern_id: 'single_lane_only', description: 'Multiple lanes', check_function: 'single_lane_only', penalty: 3 }
      ],
      partial_credit_rules: [
        { condition: 'any_element_present', points: 2, feedback: 'Partial credit for attempting elements' }
      ],
      feedback_messages: {
        pass: 'Well done',
        fail: 'Keep trying'
      }
    }
  };

  it('scores a perfect diagram correctly', () => {
    const doc = xml(`
      <bpmn:laneSet>
        <bpmn:lane id="L1" name="Team A" />
        <bpmn:lane id="L2" name="Team B" />
      </bpmn:laneSet>
      <bpmn:startEvent id="S1" />
      <bpmn:task id="T1" name="Review Application" />
      <bpmn:exclusiveGateway id="GW1" default="F2" />
      <bpmn:exclusiveGateway id="GW2" default="F4" />
      <bpmn:endEvent id="E1" />
      <bpmn:sequenceFlow id="F1" sourceRef="S1" targetRef="T1" />
      <bpmn:sequenceFlow id="F2" sourceRef="T1" targetRef="GW1" />
      <bpmn:sequenceFlow id="F3" sourceRef="GW1" targetRef="GW2" />
      <bpmn:sequenceFlow id="F4" sourceRef="GW2" targetRef="E1" />
    `);
    const result = evaluate(doc, rubric);
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(14);
  });

  it('scores a failing diagram correctly', () => {
    const doc = xml(`<bpmn:task id="T1" name="Simple Task" />`);
    const result = evaluate(doc, rubric);
    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(14);
    expect(result.detailed_feedback.length).toBeGreaterThan(0);
  });
});
