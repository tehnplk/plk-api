'use client';

import { useMemo, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import KpiFormFields from './KpiFormFields';
import { createKpiMutation, deleteKpiMutation, updateKpiMutation } from '../actions';

type Banner = { type: 'success' | 'error'; text: string };

type Kpi = {
  id: string;
  name: string;
  evaluation_criteria: string;
  condition: string;
  target_result: number;
  divide_number: number;
  sum_result: string | null;
  excellence: string;
  area_level: string;
  ssj_department: string;
  ssj_pm: string | null;
  moph_department: string | null;
  kpi_type: string;
  grade: string | null;
  template_url: string | null;
};

type ModalMode = 'create' | 'edit';

type Props = {
  initialKpis: Kpi[];
};

export default function AdminKpisClient({ initialKpis }: Props) {
  const router = useRouter();
  const [banner, setBanner] = useState<Banner | null>(null);

  const [formMode, setFormMode] = useState<ModalMode | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<Kpi | null>(null);

  const [isPending, startTransition] = useTransition();

  const kpis = useMemo<Kpi[]>(() => initialKpis ?? [], [initialKpis]);

  const closeFormModal = () => {
    setFormMode(null);
    setSelectedKpi(null);
  };

  const handleOpenCreate = () => {
    setBanner(null);
    setSelectedKpi(null);
    setFormMode('create');
  };

  const handleOpenEdit = (kpi: Kpi) => {
    setBanner(null);
    setSelectedKpi(kpi);
    setFormMode('edit');
  };

  const handleSubmit = async (formData: FormData) => {
    setBanner(null);

    if (formMode === 'edit' && selectedKpi?.id) {
      const result = await updateKpiMutation(selectedKpi.id, formData);
      if (!result.success) {
        setBanner({ type: 'error', text: result.error ?? 'Update failed' });
        return;
      }

      setBanner({ type: 'success', text: 'Updated successfully' });
      closeFormModal();
      router.refresh();
      return;
    }

    const result = await createKpiMutation(formData);
    if (!result.success) {
      setBanner({ type: 'error', text: result.error ?? 'Create failed' });
      return;
    }

    setBanner({ type: 'success', text: 'Created successfully' });
    closeFormModal();
    router.refresh();
  };

  const confirmDelete = async (kpi: Kpi) => {
    setBanner(null);

    const res = await Swal.fire({
      title: 'Confirm delete',
      text: `Delete KPI: ${kpi.id}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const result = await deleteKpiMutation(kpi.id);
        if (!result.success) {
          Swal.showValidationMessage(result.error ?? 'Delete failed');
          return false;
        }
        return true;
      },
      allowOutsideClick: () => !Swal.isLoading(),
    });

    if (res.isConfirmed) {
      await Swal.fire({
        title: 'Deleted',
        text: 'Deleted successfully',
        icon: 'success',
        timer: 1400,
        showConfirmButton: false,
      });
      router.refresh();
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">KPI Management</h1>
          <p className="text-sm text-gray-600">Manage all KPI records in the system</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4" />
          Add KPI
        </button>
      </div>

      {banner?.type === 'success' && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
          {banner.text}
        </div>
      )}

      {banner?.type === 'error' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
          {banner.text}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th
                aria-label="Actions"
                className="sticky right-0 z-10 bg-gray-50 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.25)]"
              />
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {kpis.map((kpi) => (
                <tr key={kpi.id} className="group hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{kpi.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-md truncate" title={kpi.name}>
                      {kpi.name}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{kpi.kpi_type}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{kpi.area_level}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{kpi.ssj_department}</td>
                  <td className="sticky right-0 bg-white px-6 py-4 text-right text-sm shadow-[-8px_0_12px_-12px_rgba(0,0,0,0.25)] group-hover:bg-gray-50">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(kpi)}
                        aria-label="Edit"
                        title="Edit"
                        className="inline-flex items-center justify-center rounded-md p-2 text-blue-700 hover:bg-blue-50 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void confirmDelete(kpi);
                        }}
                        aria-label="Delete"
                        title="Delete"
                        className="inline-flex items-center justify-center rounded-md p-2 text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {kpis.length === 0 && <div className="py-10 text-center text-sm text-gray-500">No KPIs found</div>}
      </div>

      {formMode && (
        <Modal
          title={formMode === 'create' ? 'Create KPI' : `Edit KPI: ${selectedKpi?.id ?? ''}`}
          subtitle={formMode === 'create' ? 'Add a new KPI record' : 'Update KPI record'}
          onClose={closeFormModal}
        >
          <form
            key={formMode === 'create' ? 'create' : (selectedKpi?.id ?? 'edit')}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(() => {
                void handleSubmit(fd);
              });
            }}
            className="bg-white rounded-lg"
          >
            <KpiFormFields mode={formMode} kpi={selectedKpi ?? undefined} />

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={closeFormModal}
                disabled={isPending}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {formMode === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-x-0 top-16 z-50 flex justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              {subtitle ? <p className="text-sm text-gray-600">{subtitle}</p> : null}
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <span className="sr-only">Close</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="bg-white shadow rounded-lg p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
