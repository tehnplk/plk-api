export function normalizeKpiId(value: FormDataEntryValue | string | null | undefined) {
  return String(value ?? '').replace(/\s+/g, '');
}

export function hasKpiIdWhitespace(value: FormDataEntryValue | string | null | undefined) {
  return /\s/.test(String(value ?? ''));
}

export function validateKpiId(value: FormDataEntryValue | string | null | undefined) {
  const rawValue = String(value ?? '');
  const id = normalizeKpiId(rawValue);

  if (!id) {
    return { success: false as const, error: 'KPI ID is required' };
  }

  if (hasKpiIdWhitespace(rawValue)) {
    return { success: false as const, error: 'KPI ID must not contain spaces' };
  }

  return { success: true as const, id };
}
