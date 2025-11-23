// Utility for evaluating KPI conditions
export interface ConditionResult {
  passed: boolean;
  status: 'pass' | 'fail' | 'pending';
}

export const evaluateCondition = (
  condition: string,
  target: number,
  actual: number | null | undefined
): ConditionResult => {
  // If no actual result, return pending
  if (actual === null || actual === undefined) {
    return { passed: false, status: 'pending' };
  }

  // Parse condition and evaluate
  const cleanCondition = condition.trim();
  let passed = false;

  switch (cleanCondition) {
    case '>=':
      passed = actual >= target;
      break;
    case '>':
      passed = actual > target;
      break;
    case '<=':
      passed = actual <= target;
      break;
    case '<':
      passed = actual < target;
      break;
    case '==':
    case '=':
      passed = actual === target;
      break;
    case '!=':
      passed = actual !== target;
      break;
    default:
      // Unknown condition, default to pending
      return { passed: false, status: 'pending' };
  }

  return {
    passed,
    status: passed ? 'pass' : 'fail'
  };
};

// Helper function to get status based on condition evaluation
export const getStatusFromCondition = (
  condition: string,
  target: number,
  actual: number | null | undefined
): 'pass' | 'fail' | 'pending' => {
  return evaluateCondition(condition, target, actual).status;
};
