// KPI Data Cache Utility
// Shared between /home page and components

const CACHE_KEY = 'kpi-master-data';
const CACHE_TIMESTAMP_KEY = 'kpi-master-timestamp';
const CACHE_EXPIRY_MINUTES = 60; // 1 hour cache

export interface KpiItem {
  id: string;
  name: string;
  criteria: string;
  level: string;
  department: string;
  target: number | null;
  divideNumber: number | null;
  isMophKpi: boolean;
  excellence: string;
  ssj_pm: string;
  moph_department: string;
}

export class KpiDataCache {
  private static instance: KpiDataCache;

  static getInstance(): KpiDataCache {
    if (!KpiDataCache.instance) {
      KpiDataCache.instance = new KpiDataCache();
    }
    return KpiDataCache.instance;
  }

  // Get cached data if valid
  getCachedData(): any[] | null {
    if (typeof window === 'undefined') return null;

    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (!cachedData || !cachedTimestamp) {
        return null;
      }

      const age = Date.now() - parseInt(cachedTimestamp);
      const maxAge = CACHE_EXPIRY_MINUTES * 60 * 1000;

      if (age > maxAge) {
        // Cache expired, clear it
        this.clearCache();
        return null;
      }

      const parsedData = JSON.parse(cachedData);
      console.log(`Loaded ${parsedData.length} KPI records from cache`);
      return parsedData;
    } catch (error) {
      console.warn('Failed to read cache:', error);
      this.clearCache();
      return null;
    }
  }

  // Save data to cache
  setCache(data: any[]): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log(`Cached ${data.length} KPI records`);
    } catch (error) {
      console.warn('Failed to write cache:', error);
    }
  }

  // Clear cache
  clearCache(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      console.log('KPI cache cleared');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Check if cache exists and is valid
  hasValidCache(): boolean {
    return this.getCachedData() !== null;
  }

  // Fetch data from Google Sheets API
  async fetchFromApi(): Promise<any[]> {
    const response = await fetch('/api/kpi/sheet');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return Array.isArray(json.data) ? json.data : [];
  }

  // Load data with cache-first strategy
  async loadData(forceRefresh: boolean = false): Promise<any[]> {
    // If force refresh, clear cache first
    if (forceRefresh) {
      this.clearCache();
    }

    // Try to get from cache
    const cachedData = this.getCachedData();
    if (cachedData && !forceRefresh) {
      return cachedData;
    }

    // Fetch from API
    try {
      const data = await this.fetchFromApi();
      this.setCache(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch from API:', error);
      
      // If API fails and we have expired cache, use it as fallback
      if (!forceRefresh) {
        const expiredData = this.getExpiredData();
        if (expiredData) {
          console.log('Using expired cache as fallback');
          return expiredData;
        }
      }
      
      throw error;
    }
  }

  // Get expired cache data (fallback when API fails)
  private getExpiredData(): any[] | null {
    if (typeof window === 'undefined') return null;

    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (!cachedData) return null;
      
      return JSON.parse(cachedData);
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const kpiDataCache = KpiDataCache.getInstance();

// Transform raw API data to KpiItem format
export function transformKpiData(rawData: any[]): KpiItem[] {
  return rawData.map((item: any) => ({
    id: String(item.id ?? ''),
    name: String(item.name ?? ''),
    criteria: String(item.evaluation_criteria ?? ''),
    level: String(item.area_level === 'อำเภอ' ? 'อำเภอ' : 'จังหวัด'),
    department: String(item.ssj_department ?? ''),
    target: item.target_result ? Number(item.target_result) : null,
    divideNumber: item.divide_number ? Number(item.divide_number) : null,
    isMophKpi: item.is_moph_kpi === 'YES',
    excellence: String(item.excellence ?? ''),
    ssj_pm: String(item.ssj_pm ?? ''),
    moph_department: String(item.moph_department ?? ''),
  }));
}
