// KPI Data Cache Utility
// Now uses database instead of localStorage

type KPIStatus = 'pass' | 'fail' | 'pending';

export interface KpiItem {
  id: string;
  name: string;
  criteria: string;
  level: 'province' | 'district';
  department: string;
  target: number | undefined;
  divideNumber: number | undefined;
  result: string | null;
  status: KPIStatus;
  excellence: string;
  ssj_pm: string;
  moph_department: string;
  kpiType?: string;
  grade?: string;
  template_url?: string;
  last_synced_at?: string;
}

export class KpiDataCache {
  private static instance: KpiDataCache;

  static getInstance(): KpiDataCache {
    if (!KpiDataCache.instance) {
      KpiDataCache.instance = new KpiDataCache();
    }
    return KpiDataCache.instance;
  }

  // Fetch data from database API
  async fetchFromApi(): Promise<any[]> {
    const response = await fetch('/api/kpi/database');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  }

  // Load data directly from database (no localStorage)
  async loadData(forceRefresh: boolean = false): Promise<any[]> {
    // Always fetch fresh data from database
    try {
      const data = await this.fetchFromApi();
      return data;
    } catch (error) {
      console.error('Failed to fetch from database:', error);
      throw error;
    }
  }

  // Clear cache method (no-op since we don't use localStorage)
  clearCache(): void {
    console.log('Cache cleared - now using database directly');
  }

  // Check if cache exists (always true since we use database)
  hasValidCache(): boolean {
    return true;
  }
}

// Export singleton instance
export const kpiDataCache = KpiDataCache.getInstance();

// Transform raw database data to KpiItem format
export function transformKpiData(rawData: any[]): KpiItem[] {
  return rawData.map((item: any) => ({
    id: String(item.id ?? ''),
    name: String(item.name ?? ''),
    criteria: String(item.evaluation_criteria ?? ''),
    level: item.area_level === 'อำเภอ' ? 'district' : 'province',
    department: String(item.ssj_department ?? ''),
    target: item.target_result ? Number(item.target_result) : undefined,
    divideNumber: item.divide_number ? Number(item.divide_number) : undefined,
    result: item.sum_result != null ? String(item.sum_result) : null,
    status: 'pending' as KPIStatus,
    condition: String(item.condition ?? ''),
    kpiType: item.kpi_type,
    excellence: String(item.excellence ?? ''),
    ssj_pm: String(item.ssj_pm ?? ''),
    moph_department: String(item.moph_department ?? ''),
    grade: item.grade,
    template_url: item.template_url,
    last_synced_at: item.last_synced_at,
  }));
}
