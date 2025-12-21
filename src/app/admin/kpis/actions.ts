'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAdminRole } from '@/lib/adminAuth';

export async function getKpis() {
  try {
    await requireAdminRole();
    const kpis = await prisma.kpis.findMany({
      orderBy: {
        id: 'asc'
      }
    });
    return { success: true, data: kpis || [] };
  } catch (error) {
    console.error('Failed to fetch KPIs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to fetch KPIs: ${errorMessage}`, data: [] };
  }
}

async function createKpi(formData: FormData) {
  try {
    await requireAdminRole();
    const data = {
      id: formData.get('id') as string,
      name: formData.get('name') as string,
      evaluation_criteria: formData.get('evaluation_criteria') as string,
      condition: formData.get('condition') as string,
      target_result: parseFloat(formData.get('target_result') as string) || 0,
      divide_number: parseFloat(formData.get('divide_number') as string) || 100,

      excellence: formData.get('excellence') as string,
      area_level: formData.get('area_level') as string,
      ssj_department: formData.get('ssj_department') as string,
      ssj_pm: formData.get('ssj_pm') as string || null,
      moph_department: formData.get('moph_department') as string || null,
      kpi_type: formData.get('kpi_type') as string,
      grade: formData.get('grade') as string || null,
      template_url: formData.get('template_url') as string || null,
    };

    // Check if ID already exists
    const existingKpi = await prisma.kpis.findUnique({
      where: { id: data.id }
    });

    if (existingKpi) {
      return { success: false, error: 'KPI ID already exists' };
    }

    const kpi = await prisma.kpis.create({
      data
    });

    revalidatePath('/admin/kpis');
    return { success: true, data: kpi };
  } catch (error) {
    console.error('Failed to create KPI:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to create KPI: ${errorMessage}` };
  }
}

export async function createKpiMutation(formData: FormData) {
  return createKpi(formData);
}

async function updateKpi(id: string, formData: FormData) {
  try {
    await requireAdminRole();
    const data = {
      name: formData.get('name') as string,
      evaluation_criteria: formData.get('evaluation_criteria') as string,
      condition: formData.get('condition') as string,
      target_result: parseFloat(formData.get('target_result') as string) || 0,
      divide_number: parseFloat(formData.get('divide_number') as string) || 100,
      excellence: formData.get('excellence') as string,
      area_level: formData.get('area_level') as string,
      ssj_department: formData.get('ssj_department') as string,
      ssj_pm: formData.get('ssj_pm') as string || null,
      moph_department: formData.get('moph_department') as string || null,
      kpi_type: formData.get('kpi_type') as string,
      grade: formData.get('grade') as string || null,
      template_url: formData.get('template_url') as string || null,
    };

    const kpi = await prisma.kpis.update({
      where: { id },
      data
    });

    revalidatePath('/admin/kpis');
    return { success: true, data: kpi };
  } catch (error) {
    console.error('Failed to update KPI:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to update KPI: ${errorMessage}` };
  }
}

export async function updateKpiMutation(id: string, formData: FormData) {
  return updateKpi(id, formData);
}

async function deleteKpi(id: string) {
  try {
    await requireAdminRole();
    // Check if KPI exists
    const existingKpi = await prisma.kpis.findUnique({
      where: { id }
    });

    if (!existingKpi) {
      return { success: false, error: 'KPI not found' };
    }

    await prisma.kpis.delete({
      where: { id }
    });

    revalidatePath('/admin/kpis');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete KPI:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to delete KPI: ${errorMessage}` };
  }
}

export async function deleteKpiMutation(id: string) {
  return deleteKpi(id);
}
