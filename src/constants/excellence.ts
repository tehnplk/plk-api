export const EXCELLENCE_MAP: Record<string, string> = {
  'PP&P': 'PP&P Excellence',
  SE: 'Service Excellence',
  PE: 'People Excellence',
  GE: 'Governance Excellence',
  HRE: 'Health-Related Economy Excellence',
};

// ใช้สำหรับแสดง label ตามลำดับมาตรฐานของ 5 Excellence
export const EXCELLENCE_STRATEGIES: string[] = Object.values(EXCELLENCE_MAP);
