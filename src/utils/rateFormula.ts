type FormulaValues = {
  A: number;
  B: number;
};

type Token =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: '+' | '-' | '*' | '/' }
  | { type: 'paren'; value: '(' | ')' };

const OPERATOR_PATTERN = /^[+\-*/]$/;
type OperatorTokenValue = '+' | '-' | '*' | '/';

function roundRate(value: number) {
  return Math.round(value * 100) / 100;
}

function tokenizeRateFormula(formula: string, values: FormulaValues): Token[] | null {
  const normalized = formula
    .replace(/\{A\}/gi, String(values.A))
    .replace(/\{B\}/gi, String(values.B))
    .replace(/[xX×]/g, '*')
    .replace(/\s+/g, '');

  const tokens: Token[] = [];
  let index = 0;

  while (index < normalized.length) {
    const char = normalized[index];

    if (char === '(' || char === ')') {
      tokens.push({ type: 'paren', value: char });
      index += 1;
      continue;
    }

    if (OPERATOR_PATTERN.test(char)) {
      const previous = tokens[tokens.length - 1];
      const isUnarySign =
        (char === '-' || char === '+') &&
        (!previous || (previous.type === 'operator') || (previous.type === 'paren' && previous.value === '('));

      if (isUnarySign) {
        const match = normalized.slice(index).match(/^[+-]?\d+(\.\d+)?/);
        if (!match) return null;
        tokens.push({ type: 'number', value: Number(match[0]) });
        index += match[0].length;
        continue;
      }

      tokens.push({ type: 'operator', value: char as OperatorTokenValue });
      index += 1;
      continue;
    }

    const match = normalized.slice(index).match(/^\d+(\.\d+)?/);
    if (!match) return null;
    tokens.push({ type: 'number', value: Number(match[0]) });
    index += match[0].length;
  }

  return tokens;
}

function parseRateExpression(tokens: Token[]) {
  let index = 0;

  const parseFactor = (): number | null => {
    const token = tokens[index];
    if (!token) return null;

    if (token.type === 'number') {
      index += 1;
      return token.value;
    }

    if (token.type === 'paren' && token.value === '(') {
      index += 1;
      const value = parseExpression();
      if (tokens[index]?.type !== 'paren' || tokens[index]?.value !== ')') return null;
      index += 1;
      return value;
    }

    return null;
  };

  const parseTerm = (): number | null => {
    let value = parseFactor();
    if (value === null) return null;

    while (tokens[index]?.type === 'operator' && (tokens[index].value === '*' || tokens[index].value === '/')) {
      const operator = tokens[index].value;
      index += 1;
      const next = parseFactor();
      if (next === null) return null;

      if (operator === '*') {
        value *= next;
      } else {
        if (next === 0) return null;
        value /= next;
      }
    }

    return value;
  };

  const parseExpression = (): number | null => {
    let value = parseTerm();
    if (value === null) return null;

    while (tokens[index]?.type === 'operator' && (tokens[index].value === '+' || tokens[index].value === '-')) {
      const operator = tokens[index].value;
      index += 1;
      const next = parseTerm();
      if (next === null) return null;
      value = operator === '+' ? value + next : value - next;
    }

    return value;
  };

  const value = parseExpression();
  if (value === null || index !== tokens.length || !Number.isFinite(value)) return null;
  return value;
}

export function calculateRateFormula(
  formula: string | null | undefined,
  values: FormulaValues,
): number | null {
  const cleanFormula = formula?.trim() || '{A}/{B}x100';
  const tokens = tokenizeRateFormula(cleanFormula, values);
  if (!tokens) return null;

  const value = parseRateExpression(tokens);
  return value === null ? null : roundRate(value);
}
