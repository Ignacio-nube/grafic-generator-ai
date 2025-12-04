import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Cliente admin con service role key (solo en backend)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Límites de gráficos por tipo de usuario
const CHART_LIMITS = {
  ANONYMOUS: 3,
  FREE: 8,
  PRO: 999999
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verificar configuración
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;

    switch (action) {
      case 'save':
        return await saveChart(req, res);
      case 'list':
        return await listCharts(req, res);
      case 'delete':
        return await deleteChart(req, res);
      case 'get':
        return await getChart(req, res);
      case 'check-limit':
        return await checkLimit(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('Charts API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// Guardar un nuevo gráfico
async function saveChart(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, anonymousId, chartData } = req.body;

  // Verificar límites primero
  const limitCheck = await checkChartLimit(userId, anonymousId);
  if (!limitCheck.allowed) {
    return res.status(403).json({ 
      error: 'Chart limit reached',
      current: limitCheck.current,
      limit: limitCheck.limit
    });
  }

  // Generar share_id único
  const shareId = generateShareId();

  const { data, error } = await supabaseAdmin
    .from('charts')
    .insert({
      user_id: userId || null,
      anonymous_id: userId ? null : anonymousId,
      title: chartData.title,
      chart_type: chartData.chartType,
      data: chartData.values,
      labels: chartData.labels,
      unit: chartData.unit,
      source: chartData.sources?.join(', '),
      is_public: false,
      share_id: shareId
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving chart:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ 
    success: true, 
    chart: data,
    shareUrl: `${process.env.VERCEL_URL || 'https://grafic-generator-ai.vercel.app'}/chart/${shareId}`
  });
}

// Listar gráficos del usuario
async function listCharts(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.query.userId as string || req.body?.userId;
  const anonymousId = req.query.anonymousId as string || req.body?.anonymousId;

  let query = supabaseAdmin
    .from('charts')
    .select('*')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  } else if (anonymousId) {
    query = query.eq('anonymous_id', anonymousId);
  } else {
    return res.status(400).json({ error: 'userId or anonymousId required' });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error listing charts:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ charts: data || [] });
}

// Eliminar un gráfico
async function deleteChart(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const chartId = req.query.chartId as string || req.body?.chartId;
  const userId = req.query.userId as string || req.body?.userId;

  if (!chartId) {
    return res.status(400).json({ error: 'chartId required' });
  }

  // Verificar propiedad
  const { data: chart } = await supabaseAdmin
    .from('charts')
    .select('user_id')
    .eq('id', chartId)
    .single();

  if (chart && chart.user_id !== userId) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { error } = await supabaseAdmin
    .from('charts')
    .delete()
    .eq('id', chartId);

  if (error) {
    console.error('Error deleting chart:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}

// Obtener un gráfico por ID o share_id
async function getChart(req: VercelRequest, res: VercelResponse) {
  const chartId = req.query.chartId as string;
  const shareId = req.query.shareId as string;

  if (!chartId && !shareId) {
    return res.status(400).json({ error: 'chartId or shareId required' });
  }

  let query = supabaseAdmin.from('charts').select('*');
  
  if (shareId) {
    query = query.eq('share_id', shareId);
  } else {
    query = query.eq('id', chartId);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error('Error getting chart:', error);
    return res.status(404).json({ error: 'Chart not found' });
  }

  return res.status(200).json({ chart: data });
}

// Verificar límite de gráficos
async function checkLimit(req: VercelRequest, res: VercelResponse) {
  const userId = req.query.userId as string || req.body?.userId;
  const anonymousId = req.query.anonymousId as string || req.body?.anonymousId;

  const result = await checkChartLimit(userId, anonymousId);
  return res.status(200).json(result);
}

// Función helper para verificar límites
async function checkChartLimit(userId?: string, anonymousId?: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  isPro: boolean;
}> {
  let isPro = false;
  let limit = CHART_LIMITS.ANONYMOUS;

  // Si hay userId, verificar si es Pro
  if (userId) {
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('is_pro')
      .eq('id', userId)
      .single();

    isPro = profile?.is_pro || false;
    limit = isPro ? CHART_LIMITS.PRO : CHART_LIMITS.FREE;
  }

  // Contar gráficos actuales
  let query = supabaseAdmin.from('charts').select('id', { count: 'exact' });
  
  if (userId) {
    query = query.eq('user_id', userId);
  } else if (anonymousId) {
    query = query.eq('anonymous_id', anonymousId);
  }

  const { count } = await query;
  const current = count || 0;

  return {
    allowed: current < limit,
    current,
    limit,
    isPro
  };
}

// Generar ID único para compartir
function generateShareId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
