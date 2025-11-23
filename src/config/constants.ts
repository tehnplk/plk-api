// Global configuration constants for the PLK KPI application

export const DISTRICTS: string[] = [
  'เมืองพิษณุโลก',
  'นครไทย',
  'ชาติตระการ',
  'บางระกำ',
  'บางกระทุ่ม',
  'พรหมพิราม',
  'วัดโบสถ์',
  'วังทอง',
  'เนินมะปราง',
];

export const MONTH_NAMES: string[] = [
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
];

export const MONTH_FIELDS: string[] = [
  'result_oct',
  'result_nov',
  'result_dec',
  'result_jan',
  'result_feb',
  'result_mar',
  'result_apr',
  'result_may',
  'result_jun',
  'result_jul',
  'result_aug',
  'result_sep',
];

export const DEFAULT_MONEY_YEAR = Number(
  process.env.NEXT_PUBLIC_MONEY_YEAR ?? '2569',
);

export type District = string;
export type MonthName = string;
export type MonthField = string;