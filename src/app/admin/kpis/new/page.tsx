import Link from 'next/link';
import { createKpiAction } from '../actions';
import KpiFormFields from '../_components/KpiFormFields';

export default function NewKpiPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create KPI</h1>
        <p className="text-gray-600">Add a new KPI record</p>
      </div>

      <form action={createKpiAction} className="bg-white shadow rounded-lg p-6">
        <KpiFormFields mode="create" />

        <div className="flex justify-end space-x-3 pt-6">
          <Link
            href="/admin/kpis"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
