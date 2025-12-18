import AdminKpisClient from './_components/AdminKpisClient';
import { getKpis } from './actions';

export default async function AdminKpisPage() {
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
      <AdminKpisClient initialKpis={kpis} />
    </div>
  );
}
