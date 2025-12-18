import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getKpiById, updateKpiAction } from '../../actions';
import KpiFormFields from '../../_components/KpiFormFields';

export default async function EditKpiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getKpiById(id);
  if (!result.success || !result.data) {
    return notFound();
  }

  const kpi = result.data;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit KPI</h1>
        <p className="text-gray-600">Update KPI: {kpi.id}</p>
      </div>

      <form
        action={updateKpiAction.bind(null, kpi.id)}
        className="bg-white shadow rounded-lg p-6"
      >
        <KpiFormFields mode="edit" kpi={kpi} />

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
            Update
          </button>
        </div>
      </form>
    </div>
  );
}
