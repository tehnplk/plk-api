'use server';

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { requireAdminRole } from '@/lib/adminAuth';
import { runDbCleansing } from '@/lib/dbCleansing';
import { validateKpiId } from '@/utils/kpiId';

export async function getKpis() {
  try {
    await requireAdminRole();
    const kpis = await prisma.kpis.findMany({
      orderBy: {
        id: 'asc'
      }
    });

    const exclusions = await prisma.kpiAreaExclusion.findMany({
      orderBy: [
        { kpi_id: 'asc' },
        { area_name: 'asc' },
      ],
    });
    const exclusionMap = new Map<string, string[]>();
    exclusions.forEach((exclusion) => {
      const current = exclusionMap.get(exclusion.kpi_id) ?? [];
      current.push(exclusion.area_name);
      exclusionMap.set(exclusion.kpi_id, current);
    });

    return {
      success: true,
      data: (kpis || []).map((kpi) => ({
        ...kpi,
        excluded_area_names: exclusionMap.get(kpi.id) ?? [],
      })),
    };
  } catch (error) {
    console.error('Failed to fetch KPIs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to fetch KPIs: ${errorMessage}`, data: [] };
  }
}

function getExcludedAreaNames(formData: FormData) {
  return Array.from(new Set(
    formData
      .getAll('excluded_area_names')
      .map((value) => String(value).trim())
      .filter(Boolean)
  ));
}

async function replaceKpiAreaExclusions(
  tx: Prisma.TransactionClient,
  kpiId: string,
  areaNames: string[],
) {
  await tx.kpiAreaExclusion.deleteMany({
    where: { kpi_id: kpiId },
  });

  if (areaNames.length === 0) return;

  await tx.kpiAreaExclusion.createMany({
    data: areaNames.map((areaName) => ({
      kpi_id: kpiId,
      area_name: areaName,
    })),
    skipDuplicates: true,
  });
}

async function createKpi(formData: FormData) {
  try {
    await requireAdminRole();
    const idResult = validateKpiId(formData.get('id'));
    if (!idResult.success) {
      return { success: false, error: idResult.error };
    }

    const excludedAreaNames = getExcludedAreaNames(formData);
    const data = {
      id: idResult.id,
      name: formData.get('name') as string,
      evaluation_criteria: formData.get('evaluation_criteria') as string,
      condition: formData.get('condition') as string,
      target_result: parseFloat(formData.get('target_result') as string) || 0,
      rate_formula: (formData.get('rate_formula') as string)?.trim() || '{A}/{B}x100',

      excellence: formData.get('excellence') as string,
      area_level: formData.get('area_level') as string,
      ssj_department: formData.get('ssj_department') as string,
      ssj_pm: formData.get('ssj_pm') as string || null,
      moph_department: formData.get('moph_department') as string || null,
      kpi_type: formData.get('kpi_type') as string,
      template_url: formData.get('template_url') as string || null,
    };

    // Check if ID already exists
    const existingKpi = await prisma.kpis.findUnique({
      where: { id: data.id }
    });

    if (existingKpi) {
      return { success: false, error: 'KPI ID already exists' };
    }

    const kpi = await prisma.$transaction(async (tx) => {
      const created = await tx.kpis.create({
        data
      });
      await replaceKpiAreaExclusions(tx, created.id, excludedAreaNames);
      return created;
    });

    try {
      await runDbCleansing();
    } catch (error) {
      console.error('Post-save DB cleansing failed:', error);
    }

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
    const idResult = validateKpiId(formData.get('id'));
    if (!idResult.success) {
      return { success: false, error: idResult.error };
    }

    const newId = idResult.id;
    
    const excludedAreaNames = getExcludedAreaNames(formData);
    const data = {
      name: formData.get('name') as string,
      evaluation_criteria: formData.get('evaluation_criteria') as string,
      condition: formData.get('condition') as string,
      target_result: parseFloat(formData.get('target_result') as string) || 0,
      rate_formula: (formData.get('rate_formula') as string)?.trim() || '{A}/{B}x100',
      excellence: formData.get('excellence') as string,
      area_level: formData.get('area_level') as string,
      ssj_department: formData.get('ssj_department') as string,
      ssj_pm: formData.get('ssj_pm') as string || null,
      moph_department: formData.get('moph_department') as string || null,
      kpi_type: formData.get('kpi_type') as string,
      template_url: formData.get('template_url') as string || null,
    };

    // If ID is being changed, check if new ID already exists
    if (newId !== id) {
      const existingKpi = await prisma.kpis.findUnique({
        where: { id: newId }
      });

      if (existingKpi) {
        return { success: false, error: 'รหัส KPI นี้มีในระบบแล้ว' };
      }

      const kpi = await prisma.$transaction(async (tx) => {
        const updated = await tx.kpis.update({
          where: { id },
          data: {
            id: newId,
            ...data
          }
        });

        await tx.kpiReport.updateMany({
          where: { kpi_id: id },
          data: { kpi_id: newId },
        });

        await replaceKpiAreaExclusions(tx, newId, excludedAreaNames);

        return updated;
      });

      try {
        await runDbCleansing();
      } catch (error) {
        console.error('Post-save DB cleansing failed:', error);
      }

      revalidatePath('/admin/kpis');
      return { success: true, data: kpi };
    }

    const kpi = await prisma.$transaction(async (tx) => {
      const updated = await tx.kpis.update({
        where: { id },
        data
      });
      await replaceKpiAreaExclusions(tx, id, excludedAreaNames);
      return updated;
    });

    try {
      await runDbCleansing();
    } catch (error) {
      console.error('Post-save DB cleansing failed:', error);
    }

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

    await prisma.$transaction(async (tx) => {
      await tx.kpiAreaExclusion.deleteMany({
        where: { kpi_id: id },
      });
      await tx.kpis.delete({
        where: { id }
      });
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
