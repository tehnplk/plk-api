'use client';

import { useState, useEffect } from 'react';

export default function SyncPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [lastSync, setLastSync] = useState<string>('');
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Check sync status on load
  const checkSyncStatus = async () => {
    try {
      const response = await fetch('/api/kpi/sync');
      const data = await response.json();
      
      if (data.success) {
        setLastSync(data.lastSyncedAt ? new Date(data.lastSyncedAt).toLocaleString('th-TH') : 'Never');
        setTotalRecords(data.totalRecords || 0);
      }
    } catch (error) {
      console.error('Failed to check sync status:', error);
    }
  };

  // Handle sync
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/kpi/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setSyncStatus('success');
        setMessage(`Synced ${data.count} records successfully!`);
        setLastSync(new Date(data.lastSyncedAt).toLocaleString('th-TH'));
        setTotalRecords(data.count);
      } else {
        setSyncStatus('error');
        setMessage(data.message || 'Sync failed');
      }
    } catch (error) {
      setSyncStatus('error');
      setMessage('Network error during sync');
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load status on component mount
  useEffect(() => {
    checkSyncStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              KPI Data Sync Management
            </h1>

            {/* Sync Status */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Sync Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Last Sync</p>
                  <p className="text-base font-medium text-gray-900">{lastSync}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Records</p>
                  <p className="text-base font-medium text-gray-900">{totalRecords}</p>
                </div>
              </div>
            </div>

            {/* Sync Controls */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Controls</h2>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    Sync KPI metadata from Google Sheets to the local database.
                    This will update the Kpis table with the latest data.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Source: Google Sheets API → Target: Database Cache
                  </p>
                </div>
                
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isSyncing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>

              {/* Status Message */}
              {message && (
                <div className={`mt-4 p-3 rounded-md ${
                  syncStatus === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <p className="text-sm font-medium">{message}</p>
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">1</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">
                      <strong>Fetch from Google Sheets:</strong> API retrieves KPI data from the Google Sheets endpoint
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">2</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">
                      <strong>Transform & Validate:</strong> Data is transformed to match database schema
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">3</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">
                      <strong>Upsert to Database:</strong> Records are created or updated in the Kpis table
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">4</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">
                      <strong>Update Cache:</strong> Frontend cache fetches from database instead of Google Sheets
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
