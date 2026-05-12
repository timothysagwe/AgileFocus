function getElementsByLocalName(xmlDoc, localName) {
  const lowerName = localName.toLowerCase();
  return Array.from(xmlDoc.getElementsByTagName('*'))
    .filter(el => {
      const name = (el.localName || el.tagName || '').toLowerCase();
      return name === lowerName;
    });
}

function hasElement(xmlDoc, localName) {
  return getElementsByLocalName(xmlDoc, localName).length > 0;
}

/* -------------------- Element Checkers -------------------- */

export function countElements(xmlDoc, bpmnType) {
  const simpleName = bpmnType.includes(':') ? bpmnType.split(':')[1] : bpmnType;
  return getElementsByLocalName(xmlDoc, simpleName).length;
}

export function checkLaneStructure(xmlDoc) {
  const lanes = getElementsByLocalName(xmlDoc, 'lane');
  return lanes.length >= 2;
}

export function checkStartAndEndEvents(xmlDoc) {
  const starts = getElementsByLocalName(xmlDoc, 'startEvent');
  const ends = getElementsByLocalName(xmlDoc, 'endEvent');
  return starts.length === 1 && ends.length >= 1;
}

export function checkErrorBoundaryOnSubprocess(xmlDoc) {
  const subprocesses = getElementsByLocalName(xmlDoc, 'subProcess');
  if (subprocesses.length === 0) return true;
  const boundaryEvents = getElementsByLocalName(xmlDoc, 'boundaryEvent');
  return subprocesses.every(sp => {
    const spId = sp.getAttribute('id');
    return boundaryEvents.some(be => be.getAttribute('attachedToRef') === spId);
  });
}

export function checkDefaultPathOnExclusiveGateway(xmlDoc) {
  const gateways = getElementsByLocalName(xmlDoc, 'exclusiveGateway');
  if (gateways.length === 0) return true;
  return gateways.every(gw => gw.hasAttribute('default'));
}

export function checkAuditTaskPresence(xmlDoc) {
  const keywords = ['log', 'record', 'evidence', 'notify', 'confirm', 'approve', 'review'];
  const tasks = getElementsByLocalName(xmlDoc, 'task');
  const userTasks = getElementsByLocalName(xmlDoc, 'userTask');
  const serviceTasks = getElementsByLocalName(xmlDoc, 'serviceTask');
  const allTasks = [...tasks, ...userTasks, ...serviceTasks];
  return allTasks.some(task => {
    const name = (task.getAttribute('name') || '').toLowerCase();
    return keywords.some(kw => name.includes(kw));
  });
}

export function checkControlPointPresence(xmlDoc) {
  const gateways = getElementsByLocalName(xmlDoc, 'exclusiveGateway').length +
    getElementsByLocalName(xmlDoc, 'parallelGateway').length +
    getElementsByLocalName(xmlDoc, 'inclusiveGateway').length +
    getElementsByLocalName(xmlDoc, 'eventBasedGateway').length;
  const intermediateEvents = getElementsByLocalName(xmlDoc, 'intermediateCatchEvent').length +
    getElementsByLocalName(xmlDoc, 'intermediateThrowEvent').length;
  const hasDataInput = hasElement(xmlDoc, 'dataInputAssociation') || hasElement(xmlDoc, 'dataInput');
  const hasDataOutput = hasElement(xmlDoc, 'dataOutputAssociation') || hasElement(xmlDoc, 'dataOutput');
  if (hasDataInput || hasDataOutput) {
    return (gateways + intermediateEvents) >= 1;
  }
  return gateways >= 1;
}

export function checkSequenceFlowCompleteness(xmlDoc) {
  const flows = getElementsByLocalName(xmlDoc, 'sequenceFlow');
  if (flows.length === 0) return false;
  const flowObjects = [
    ...getElementsByLocalName(xmlDoc, 'startEvent'),
    ...getElementsByLocalName(xmlDoc, 'endEvent'),
    ...getElementsByLocalName(xmlDoc, 'task'),
    ...getElementsByLocalName(xmlDoc, 'userTask'),
    ...getElementsByLocalName(xmlDoc, 'serviceTask'),
    ...getElementsByLocalName(xmlDoc, 'exclusiveGateway'),
    ...getElementsByLocalName(xmlDoc, 'parallelGateway'),
    ...getElementsByLocalName(xmlDoc, 'inclusiveGateway'),
    ...getElementsByLocalName(xmlDoc, 'eventBasedGateway'),
    ...getElementsByLocalName(xmlDoc, 'subProcess'),
    ...getElementsByLocalName(xmlDoc, 'intermediateCatchEvent'),
    ...getElementsByLocalName(xmlDoc, 'intermediateThrowEvent'),
    ...getElementsByLocalName(xmlDoc, 'boundaryEvent')
  ];

  return flowObjects.every(fo => {
    const id = fo.getAttribute('id');
    if (!id) return true;
    const localName = fo.localName;
    const incoming = flows.filter(f => f.getAttribute('targetRef') === id).length;
    const outgoing = flows.filter(f => f.getAttribute('sourceRef') === id).length;
    if (localName === 'startEvent') return outgoing >= 1;
    if (localName === 'endEvent') return incoming >= 1;
    return incoming >= 1 && outgoing >= 1;
  });
}

/* -------------------- Pattern Checkers -------------------- */

export function checkPatternHasErrorHandling(xmlDoc) {
  const subprocesses = getElementsByLocalName(xmlDoc, 'subProcess');
  if (subprocesses.length === 0) {
    return { passed: true, feedback: 'No subprocesses to check' };
  }
  const ok = checkErrorBoundaryOnSubprocess(xmlDoc);
  return ok
    ? { passed: true, feedback: 'All subprocesses have error boundary events' }
    : { passed: false, feedback: 'At least one subprocess is missing an error boundary event' };
}

export function checkPatternHasDefaultPaths(xmlDoc) {
  const gateways = getElementsByLocalName(xmlDoc, 'exclusiveGateway');
  if (gateways.length === 0) {
    return { passed: true, feedback: 'No exclusive gateways to check' };
  }
  const missing = gateways.filter(gw => !gw.hasAttribute('default'));
  if (missing.length === 0) {
    return { passed: true, feedback: 'All exclusive gateways have default paths' };
  }
  return {
    passed: false,
    feedback: `${missing.length} exclusive gateway(s) missing default path`
  };
}

export function checkPatternHasAuditTrail(xmlDoc) {
  const found = checkAuditTaskPresence(xmlDoc);
  return found
    ? { passed: true, feedback: 'Audit-relevant task found' }
    : { passed: false, feedback: 'No audit-relevant task found (keywords: log, record, evidence, notify, confirm, approve, review)' };
}

export function checkPatternHasControlPoints(xmlDoc) {
  const ok = checkControlPointPresence(xmlDoc);
  return ok
    ? { passed: true, feedback: 'Control points (gateways or intermediate events) detected' }
    : { passed: false, feedback: 'No control points found — add gateways or intermediate events' };
}

export function checkPatternHasLanes(xmlDoc) {
  const ok = checkLaneStructure(xmlDoc);
  return ok
    ? { passed: true, feedback: 'Diagram has at least 2 lanes' }
    : { passed: false, feedback: 'Diagram has fewer than 2 lanes' };
}

export function checkPatternIsCompleteFlow(xmlDoc) {
  const ok = checkSequenceFlowCompleteness(xmlDoc);
  return ok
    ? { passed: true, feedback: 'All flow objects have valid connections' }
    : { passed: false, feedback: 'Some flow objects are missing incoming or outgoing sequence flows' };
}

export function checkPatternHasStartAndEnd(xmlDoc) {
  const ok = checkStartAndEndEvents(xmlDoc);
  return ok
    ? { passed: true, feedback: 'Diagram has exactly one start event and at least one end event' }
    : { passed: false, feedback: 'Diagram should have exactly one start event and at least one end event' };
}

/* -------------------- Antipattern Detectors -------------------- */

export function detectAntipatternDisconnectedElements(xmlDoc) {
  const flows = getElementsByLocalName(xmlDoc, 'sequenceFlow');
  const flowObjects = [
    ...getElementsByLocalName(xmlDoc, 'task'),
    ...getElementsByLocalName(xmlDoc, 'userTask'),
    ...getElementsByLocalName(xmlDoc, 'serviceTask'),
    ...getElementsByLocalName(xmlDoc, 'exclusiveGateway'),
    ...getElementsByLocalName(xmlDoc, 'parallelGateway'),
    ...getElementsByLocalName(xmlDoc, 'inclusiveGateway'),
    ...getElementsByLocalName(xmlDoc, 'eventBasedGateway'),
    ...getElementsByLocalName(xmlDoc, 'subProcess'),
    ...getElementsByLocalName(xmlDoc, 'intermediateCatchEvent'),
    ...getElementsByLocalName(xmlDoc, 'intermediateThrowEvent')
  ];

  const disconnected = flowObjects.filter(fo => {
    const id = fo.getAttribute('id');
    if (!id) return false;
    const incoming = flows.filter(f => f.getAttribute('targetRef') === id).length;
    const outgoing = flows.filter(f => f.getAttribute('sourceRef') === id).length;
    return incoming === 0 && outgoing === 0;
  });

  return {
    found: disconnected.length > 0,
    count: disconnected.length,
    details: disconnected.length > 0
      ? `${disconnected.length} flow object(s) have no connections`
      : 'All flow objects are connected'
  };
}

export function detectAntipatternMissingErrorEvents(xmlDoc) {
  const subprocesses = getElementsByLocalName(xmlDoc, 'subProcess');
  if (subprocesses.length === 0) {
    return { found: false, count: 0, details: 'No subprocesses in diagram' };
  }
  const boundaryEvents = getElementsByLocalName(xmlDoc, 'boundaryEvent');
  const missing = subprocesses.filter(sp => {
    const spId = sp.getAttribute('id');
    return !boundaryEvents.some(be => be.getAttribute('attachedToRef') === spId);
  });
  return {
    found: missing.length > 0,
    count: missing.length,
    details: missing.length > 0
      ? `${missing.length} subprocess(es) missing error boundary events`
      : 'All subprocesses have boundary events'
  };
}

export function detectAntipatternNoDefaultGatewayPath(xmlDoc) {
  const gateways = getElementsByLocalName(xmlDoc, 'exclusiveGateway');
  const missing = gateways.filter(gw => !gw.hasAttribute('default'));
  return {
    found: missing.length > 0,
    count: missing.length,
    details: missing.length > 0
      ? `${missing.length} exclusive gateway(s) without default path`
      : 'All exclusive gateways have default paths'
  };
}

export function detectAntipatternSingleLaneOnly(xmlDoc) {
  const lanes = getElementsByLocalName(xmlDoc, 'lane');
  const pools = getElementsByLocalName(xmlDoc, 'participant');
  const hasPool = pools.length > 0;
  if (!hasPool) return { found: false, count: 0, details: 'No pool in diagram' };
  return {
    found: lanes.length < 2,
    count: lanes.length,
    details: lanes.length < 2
      ? 'Diagram has a pool but only one lane (needs 2+) for multi-stakeholder processes'
      : 'Diagram has 2+ lanes'
  };
}

export function detectAntipatternNoExceptionPath(xmlDoc) {
  const gateways = getElementsByLocalName(xmlDoc, 'exclusiveGateway').length +
    getElementsByLocalName(xmlDoc, 'parallelGateway').length +
    getElementsByLocalName(xmlDoc, 'inclusiveGateway').length;
  if (gateways === 0) return { found: false, count: 0, details: 'No gateways in diagram' };
  const endEvents = getElementsByLocalName(xmlDoc, 'endEvent');
  const hasErrorEnd = endEvents.some(ee => {
    const children = Array.from(ee.children);
    return children.some(c => c.localName === 'errorEventDefinition');
  });
  const hasTerminateEnd = endEvents.some(ee => {
    const children = Array.from(ee.children);
    return children.some(c => c.localName === 'terminateEventDefinition');
  });
  const hasException = hasErrorEnd || hasTerminateEnd;
  return {
    found: !hasException,
    count: hasException ? 0 : 1,
    details: hasException
      ? 'Exception path found (error or terminate end event)'
      : 'No exception path found — diagram has gateways but no error/terminate end event'
  };
}

/* -------------------- Named Checker Registry -------------------- */

const patternCheckers = {
  has_error_handling: checkPatternHasErrorHandling,
  has_default_paths: checkPatternHasDefaultPaths,
  has_audit_trail: checkPatternHasAuditTrail,
  has_control_points: checkPatternHasControlPoints,
  has_lanes: checkPatternHasLanes,
  is_complete_flow: checkPatternIsCompleteFlow,
  has_start_and_end: checkPatternHasStartAndEnd
};

const antipatternDetectors = {
  disconnected_elements: detectAntipatternDisconnectedElements,
  missing_error_events: detectAntipatternMissingErrorEvents,
  no_default_gateway_path: detectAntipatternNoDefaultGatewayPath,
  single_lane_only: detectAntipatternSingleLaneOnly,
  no_exception_path: detectAntipatternNoExceptionPath
};

/* -------------------- Feedback Generator -------------------- */

export function generateFeedback(evaluationResult, rubric) {
  const { score, percentage, passed, element_checks, pattern_checks, antipattern_checks } = evaluationResult;
  const lines = [];
  const maxPoints = rubric?.max_points || 1;

  lines.push(`Score: ${score}/${maxPoints} (${percentage}%)`);
  lines.push(passed ? 'Status: PASSED' : 'Status: FAILED');

  const failedElements = (element_checks || []).filter(c => c.points_earned === 0);
  const failedPatterns = (pattern_checks || []).filter(c => !c.passed);

  if (failedElements.length > 0) {
    lines.push('Missing required elements:');
    failedElements.forEach(c => lines.push(`  - ${c.feedback}`));
  }
  if (failedPatterns.length > 0) {
    lines.push('Unmet patterns:');
    failedPatterns.forEach(c => lines.push(`  - ${c.feedback}`));
  }

  const foundAntipatterns = (antipattern_checks || []).filter(c => c.found);
  if (foundAntipatterns.length > 0) {
    const top = foundAntipatterns.reduce((a, b) => (a.penalty || 0) > (b.penalty || 0) ? a : b);
    lines.push(`Key issue: ${top.feedback}`);
  }

  if (failedElements.length > 0 || failedPatterns.length > 0) {
    lines.push('Review the requirements above and revise your diagram.');
  } else if (passed) {
    lines.push('All requirements met. Good work.');
  }

  return lines.join('\n');
}

/* -------------------- Main Evaluate Function -------------------- */

export function evaluate(bpmnXml, rubric) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(bpmnXml, 'text/xml');

    if (!xmlDoc.documentElement || xmlDoc.documentElement.localName === 'parsererror') {
      return errorResult('Invalid BPMN XML — could not parse', rubric);
    }
    if (getElementsByLocalName(xmlDoc, 'process').length === 0) {
      return errorResult('No BPMN process found in diagram', rubric);
    }

    const elementChecks = runElementChecks(xmlDoc, rubric);
    const patternChecks = runPatternChecks(xmlDoc, rubric);
    const antipatternChecks = runAntipatternChecks(xmlDoc, rubric);
    const partialCredit = runPartialCredit(xmlDoc, rubric, elementChecks, patternChecks, antipatternChecks);

    const elementPoints = elementChecks.reduce((sum, c) => sum + c.points_earned, 0);
    const patternPoints = patternChecks.reduce((sum, c) => sum + c.points_earned, 0);
    const antipatternPenalties = antipatternChecks.reduce((sum, c) => sum + (c.found ? (c.penalty || 0) : 0), 0);
    const partialPoints = partialCredit.reduce((sum, c) => sum + (c.met ? c.points_earned : 0), 0);

    const rawScore = elementPoints + patternPoints + partialPoints - antipatternPenalties;
    const maxPoints = rubric?.max_points || 1;
    const score = Math.max(0, rawScore);
    const percentage = Math.round((score / maxPoints) * 100);
    const passed = percentage >= 70;

    const evaluationResult = {
      score,
      percentage,
      passed,
      element_checks: elementChecks,
      pattern_checks: patternChecks,
      antipattern_checks: antipatternChecks,
      partial_credit: partialCredit,
      overall_feedback: '',
      detailed_feedback: [],
      model_answer_hint: percentage < 50
        ? 'Review the exercise instructions and consider the key BPMN elements needed for regulated processes.'
        : ''
    };

    evaluationResult.overall_feedback = generateFeedback(evaluationResult, rubric);
    evaluationResult.detailed_feedback = buildDetailedFeedback(evaluationResult, rubric);

    return evaluationResult;
  } catch (err) {
    return errorResult(err.message || 'Unknown error during evaluation', rubric);
  }
}

/* -------------------- Internal Helpers -------------------- */

function runElementChecks(xmlDoc, rubric) {
  const required = rubric?.rubric?.required_elements || [];
  return required.map(req => {
    const found = countElements(xmlDoc, req.type);
    const pointsEarned = found >= (req.minimum_count || 1) ? req.points : 0;
    return {
      requirement: req.type,
      found,
      points_earned: pointsEarned,
      feedback: found >= (req.minimum_count || 1)
        ? `${req.type}: found ${found} (need ${req.minimum_count || 1})`
        : `${req.type}: found ${found}, need at least ${req.minimum_count || 1}`
    };
  });
}

function runPatternChecks(xmlDoc, rubric) {
  const patterns = rubric?.rubric?.required_patterns || [];
  return patterns.map(pat => {
    const checker = patternCheckers[pat.check_function];
    if (!checker) {
      return { pattern_id: pat.pattern_id, passed: false, points_earned: 0, feedback: `Unknown checker: ${pat.check_function}` };
    }
    const result = checker(xmlDoc);
    const pointsEarned = result.passed ? pat.points : 0;
    return {
      pattern_id: pat.pattern_id,
      passed: result.passed,
      points_earned: pointsEarned,
      feedback: result.feedback
    };
  });
}

function runAntipatternChecks(xmlDoc, rubric) {
  const antipatterns = rubric?.rubric?.forbidden_antipatterns || [];
  return antipatterns.map(ap => {
    const detector = antipatternDetectors[ap.pattern_id];
    if (!detector) {
      return { pattern_id: ap.pattern_id, found: false, penalty: ap.penalty, feedback: `Unknown detector: ${ap.pattern_id}` };
    }
    const result = detector(xmlDoc);
    return {
      pattern_id: ap.pattern_id,
      found: result.found,
      penalty: result.found ? (ap.penalty || 0) : 0,
      feedback: result.details
    };
  });
}

function runPartialCredit(xmlDoc, rubric, elementChecks, patternChecks, antipatternChecks) {
  const rules = rubric?.rubric?.partial_credit_rules || [];
  return rules.map(rule => {
    let met = false;
    if (rule.condition === 'any_element_present') {
      met = elementChecks.some(c => c.found > 0);
    } else if (rule.condition === 'at_least_one_pattern_passed') {
      met = patternChecks.some(c => c.passed);
    } else if (rule.condition === 'no_antipatterns_found') {
      met = !antipatternChecks.some(c => c.found);
    } else if (rule.condition === 'score_above_zero') {
      const totalElements = elementChecks.reduce((s, c) => s + c.points_earned, 0);
      const totalPatterns = patternChecks.reduce((s, c) => s + c.points_earned, 0);
      met = totalElements + totalPatterns > 0;
    }
    return {
      condition: rule.condition,
      met,
      points_earned: met ? (rule.points || 0) : 0,
      feedback: met ? (rule.feedback || 'Condition met') : (rule.feedback || 'Condition not met')
    };
  });
}

function buildDetailedFeedback(evaluationResult, rubric) {
  const lines = [];
  const { element_checks, pattern_checks, antipattern_checks } = evaluationResult;

  const failedElements = element_checks.filter(c => c.points_earned === 0);
  const failedPatterns = pattern_checks.filter(c => !c.passed);
  const foundAntipatterns = antipattern_checks.filter(c => c.found);

  failedElements.forEach(c => lines.push(c.feedback));
  failedPatterns.forEach(c => lines.push(c.feedback));
  foundAntipatterns.forEach(c => lines.push(`Antipattern: ${c.feedback}`));

  if (lines.length === 0) {
    lines.push('All checks passed.');
  }

  return lines;
}

function errorResult(message, rubric) {
  const maxPoints = rubric?.max_points || 1;
  return {
    score: 0,
    percentage: 0,
    passed: false,
    element_checks: [],
    pattern_checks: [],
    antipattern_checks: [],
    partial_credit: [],
    overall_feedback: `Error: ${message}`,
    detailed_feedback: [message],
    model_answer_hint: 'Unable to evaluate due to an error. Check the BPMN XML format.'
  };
}
