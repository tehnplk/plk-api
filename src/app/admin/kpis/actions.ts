'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/authConfig';

async function checkAdminRole() {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const profile = (session.user as any).profile;
  let providerId = session.user.name;
  
  if (profile) {
    try {
      const parsedProfile = typeof profile === 'string' ? JSON.parse(profile) : profile;
      providerId = parsedProfile.provider_id || parsedProfile.sub || parsedProfile.id || session.user.name;
    } catch (e) {
      console.log('Profile parse error');
    }
  }

  const user = await prisma.accountUser.findUnique({
    where: { provider_id: providerId || '' },
    select: { role: true, active: true }
  });

  if (!user || !user.active || user.role !== 'admin') {
    throw new Error('Access denied. Admin role required.');
  }

  return true;
}

export async function getKpis() {
  try {
    await checkAdminRole();
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

export async function getKpiById(id: string) {
  try {
    await checkAdminRole();
    const kpi = await prisma.kpis.findUnique({
      where: { id }
    });
    
    if (!kpi) {
      return { success: false, error: 'KPI not found' };
    }
    
    return { success: true, data: kpi };
  } catch (error) {
    console.error('Failed to fetch KPI:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Failed to fetch KPI: ${errorMessage}` };
  }
}

async function createKpi(formData: FormData) {
  try {
    await checkAdminRole();
    const data = {
      id: formData.get('id') as string,
      name: formData.get('name') as string,
      evaluation_criteria: formData.get('evaluation_criteria') as string,
      condition: formData.get('condition') as string,
      target_result: parseFloat(formData.get('target_result') as string) || 0,
      divide_number: parseFloat(formData.get('divide_number') as string) || 100,
      sum_result: formData.get('sum_result') as string || null,
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

export async function createKpiAction(formData: FormData) {
  const result = await createKpi(formData);
  if (result.success) {
    redirect(`/admin/kpis?success=${encodeURIComponent('Created successfully')}`);
  }
  redirect(`/admin/kpis?error=${encodeURIComponent(result.error ?? 'Create failed')}`);
}

export async function createKpiMutation(formData: FormData) {
  return createKpi(formData);
}

async function updateKpi(id: string, formData: FormData) {
  try {
    await checkAdminRole();
    const data = {
      name: formData.get('name') as string,
      evaluation_criteria: formData.get('evaluation_criteria') as string,
      condition: formData.get('condition') as string,
      target_result: parseFloat(formData.get('target_result') as string) || 0,
      divide_number: parseFloat(formData.get('divide_number') as string) || 100,
      sum_result: formData.get('sum_result') as string || null,
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

export async function updateKpiAction(id: string, formData: FormData) {
  const result = await updateKpi(id, formData);
  if (result.success) {
    redirect(`/admin/kpis?success=${encodeURIComponent('Updated successfully')}`);
  }
  redirect(`/admin/kpis?error=${encodeURIComponent(result.error ?? 'Update failed')}`);
}

export async function updateKpiMutation(id: string, formData: FormData) {
  return updateKpi(id, formData);
}

async function deleteKpi(id: string) {
  try {
    await checkAdminRole();
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

export async function deleteKpiAction(id: string, _formData?: FormData) {
  const result = await deleteKpi(id);
  if (result.success) {
    redirect(`/admin/kpis?success=${encodeURIComponent('Deleted successfully')}`);
  }
  redirect(`/admin/kpis?error=${encodeURIComponent(result.error ?? 'Delete failed')}`);
}

export async function deleteKpiMutation(id: string) {
  return deleteKpi(id);
}
