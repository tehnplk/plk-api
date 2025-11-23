"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kpiCache = void 0;
const CACHE_KEY = 'kpi_cache';
const CACHE_VERSION = '2.0.0';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
exports.kpiCache = {
    // Get cached KPI data
    get() {
        try {
            if (typeof window === 'undefined')
                return null;
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached)
                return null;
            const parsed = JSON.parse(cached);
            // Check version compatibility
            if (parsed.version !== CACHE_VERSION) {
                this.clear();
                return null;
            }
            // Check TTL
            const now = Date.now();
            if (now - parsed.timestamp > CACHE_TTL) {
                this.clear();
                return null;
            }
            return parsed.data;
        }
        catch (error) {
            console.warn('Failed to read KPI cache:', error);
            this.clear();
            return null;
        }
    },
    // Set KPI data in cache
    set(data) {
        try {
            if (typeof window === 'undefined')
                return;
            const entry = {
                data,
                timestamp: Date.now(),
                version: CACHE_VERSION,
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
            console.log('KPI data cached to localStorage');
        }
        catch (error) {
            console.warn('Failed to cache KPI data:', error);
            // Don't throw error, just continue without caching
        }
    },
    // Clear cache
    clear() {
        try {
            if (typeof window === 'undefined')
                return;
            localStorage.removeItem(CACHE_KEY);
        }
        catch (error) {
            console.warn('Failed to clear KPI cache:', error);
        }
    },
    // Check if cache exists and is valid
    isValid() {
        return this.get() !== null;
    },
    // Get cache age in minutes
    getAge() {
        try {
            if (typeof window === 'undefined')
                return Infinity;
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached)
                return Infinity;
            const parsed = JSON.parse(cached);
            return (Date.now() - parsed.timestamp) / (1000 * 60); // minutes
        }
        catch {
            return Infinity;
        }
    },
    // Force refresh cache with new data
    refresh(data) {
        this.clear();
        this.set(data);
    },
};
