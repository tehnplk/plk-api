import AdminKpisClient from './_components/AdminKpisClient';
import { getKpis } from './actions';

export default async function AdminKpisPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const result = await getKpis();

  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{result.error}</div>
      </div>
    );
  }

  const kpis = result.data;

  return (
    <div>
      {resolvedSearchParams?.success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
          {resolvedSearchParams.success}
        </div>
      )}

      {resolvedSearchParams?.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
          {resolvedSearchParams.error}
        </div>
      )}

      <AdminKpisClient initialKpis={kpis} />
    </div>
  );
}
