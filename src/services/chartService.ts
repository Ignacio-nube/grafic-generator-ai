import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CHART_LIMITS } from '../contexts/AuthContext';

export interface ChartData {
  labels: string[];
  values: number[];
  title: string;
  chartType: 'bar' | 'line' | 'pie' | 'area';
  unit?: string;
  description?: string;
  sources?: string[];
  insights?: string[];
  trend?: 'up' | 'down' | 'stable';
}

export interface SavedChart extends ChartData {
  id: string;
  userId?: string;
  anonymousId?: string;
  isPublic: boolean;
  shareId: string;
  createdAt: string;
  updatedAt: string;
}

// Obtener gráficos del localStorage (para usuarios sin cuenta o sin Supabase)
const getLocalCharts = (): SavedChart[] => {
  const stored = localStorage.getItem('graficos_local_charts');
  return stored ? JSON.parse(stored) : [];
};

const saveLocalCharts = (charts: SavedChart[]) => {
  localStorage.setItem('graficos_local_charts', JSON.stringify(charts));
};

// Generar ID corto para compartir
const generateShareId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Contar gráficos del usuario
export async function getChartCount(userId?: string, anonymousId?: string): Promise<number> {
  if (!isSupabaseConfigured()) {
    return getLocalCharts().length;
  }

  if (userId) {
    // Contar gráficos del usuario autenticado + sus anónimos migrados
    const { count } = await supabase
      .from('charts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    return count || 0;
  }

  if (anonymousId) {
    // Contar gráficos anónimos
    const { count } = await supabase
      .from('charts')
      .select('*', { count: 'exact', head: true })
      .eq('anonymous_id', anonymousId)
      .is('user_id', null);
    return count || 0;
  }

  return 0;
}

// Verificar si puede crear más gráficos
export async function canCreateChart(userId?: string, anonymousId?: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const count = await getChartCount(userId, anonymousId);
  
  if (userId) {
    // Usuario autenticado: límite free (8) o pro (infinito)
    // TODO: Verificar si es usuario pro
    const limit = CHART_LIMITS.free;
    return { allowed: count < limit, current: count, limit };
  }
  
  // Usuario anónimo: límite de 3
  const limit = CHART_LIMITS.anonymous;
  return { allowed: count < limit, current: count, limit };
}

// Guardar gráfico
export async function saveChart(
  chartData: ChartData,
  userId?: string,
  anonymousId?: string
): Promise<{ success: boolean; chart?: SavedChart; error?: string }> {
  
  // Verificar límites
  const { allowed, limit } = await canCreateChart(userId, anonymousId);
  if (!allowed) {
    if (!userId) {
      return { 
        success: false, 
        error: `Has alcanzado el límite de ${limit} gráficos. Inicia sesión para guardar más.` 
      };
    }
    return { 
      success: false, 
      error: `Has alcanzado el límite de ${limit} gráficos. Actualiza a Pro para gráficos ilimitados.` 
    };
  }

  // Si Supabase no está configurado, guardar en localStorage
  if (!isSupabaseConfigured()) {
    const localCharts = getLocalCharts();
    const newChart: SavedChart = {
      ...chartData,
      id: crypto.randomUUID(),
      anonymousId,
      isPublic: false,
      shareId: generateShareId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localCharts.unshift(newChart);
    saveLocalCharts(localCharts);
    return { success: true, chart: newChart };
  }

  // Guardar en Supabase
  const shareId = generateShareId();
  
  const { data, error } = await supabase
    .from('charts')
    .insert({
      user_id: userId || null,
      anonymous_id: userId ? null : anonymousId,
      title: chartData.title,
      chart_type: chartData.chartType,
      labels: chartData.labels,
      values: chartData.values,
      data: chartData.values, // Mantener compatibilidad con schema original
      unit: chartData.unit,
      description: chartData.description,
      sources: chartData.sources,
      insights: chartData.insights,
      trend: chartData.trend,
      is_public: false,
      share_id: shareId
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving chart:', error);
    return { success: false, error: 'Error al guardar el gráfico' };
  }

  const savedChart: SavedChart = {
    id: data.id,
    userId: data.user_id,
    anonymousId: data.anonymous_id,
    title: data.title,
    chartType: data.chart_type,
    labels: data.labels || [],
    values: data.values || data.data || [],
    unit: data.unit,
    description: data.description,
    sources: data.sources,
    insights: data.insights,
    trend: data.trend,
    isPublic: data.is_public,
    shareId: data.share_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };

  return { success: true, chart: savedChart };
}

// Obtener gráficos del usuario
export async function getUserCharts(userId?: string, anonymousId?: string): Promise<SavedChart[]> {
  if (!isSupabaseConfigured()) {
    return getLocalCharts();
  }

  let query = supabase.from('charts').select('*').order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (anonymousId) {
    query = query.eq('anonymous_id', anonymousId).is('user_id', null);
  } else {
    return [];
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching charts:', error);
    return [];
  }

  return data.map(chart => ({
    id: chart.id,
    userId: chart.user_id,
    anonymousId: chart.anonymous_id,
    title: chart.title,
    chartType: chart.chart_type,
    labels: chart.labels || [],
    values: chart.values || chart.data || [],
    unit: chart.unit,
    description: chart.description,
    sources: chart.sources,
    insights: chart.insights,
    trend: chart.trend,
    isPublic: chart.is_public,
    shareId: chart.share_id,
    createdAt: chart.created_at,
    updatedAt: chart.updated_at
  }));
}

// Eliminar gráfico
export async function deleteChart(chartId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const localCharts = getLocalCharts();
    const filtered = localCharts.filter(c => c.id !== chartId);
    saveLocalCharts(filtered);
    return true;
  }

  const { error } = await supabase
    .from('charts')
    .delete()
    .eq('id', chartId);

  return !error;
}

// Obtener gráfico por shareId (para compartir)
export async function getChartByShareId(shareId: string): Promise<SavedChart | null> {
  if (!isSupabaseConfigured()) {
    const localCharts = getLocalCharts();
    return localCharts.find(c => c.shareId === shareId) || null;
  }

  const { data, error } = await supabase
    .from('charts')
    .select('*')
    .eq('share_id', shareId)
    .eq('is_public', true)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    userId: data.user_id,
    anonymousId: data.anonymous_id,
    title: data.title,
    chartType: data.chart_type,
    labels: data.labels || [],
    values: data.values || data.data || [],
    unit: data.unit,
    description: data.description,
    sources: data.sources,
    insights: data.insights,
    trend: data.trend,
    isPublic: data.is_public,
    shareId: data.share_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

// Hacer gráfico público/privado
export async function toggleChartPublic(chartId: string, isPublic: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const localCharts = getLocalCharts();
    const chart = localCharts.find(c => c.id === chartId);
    if (chart) {
      chart.isPublic = isPublic;
      saveLocalCharts(localCharts);
      return true;
    }
    return false;
  }

  const { error } = await supabase
    .from('charts')
    .update({ is_public: isPublic })
    .eq('id', chartId);

  return !error;
}

// Migrar gráficos anónimos a cuenta de usuario
export async function migrateAnonymousCharts(userId: string, anonymousId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    // En modo local, simplemente actualizar los charts existentes
    const localCharts = getLocalCharts();
    localCharts.forEach(chart => {
      if (chart.anonymousId === anonymousId && !chart.userId) {
        chart.userId = userId;
        chart.anonymousId = undefined;
      }
    });
    saveLocalCharts(localCharts);
    return;
  }

  await supabase
    .from('charts')
    .update({ user_id: userId, anonymous_id: null })
    .eq('anonymous_id', anonymousId)
    .is('user_id', null);
}
