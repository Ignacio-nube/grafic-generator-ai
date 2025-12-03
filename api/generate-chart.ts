import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verificar API key
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, clarificationAnswer } = req.body;

    const fullQuery = clarificationAnswer
      ? `${query}\nInformación adicional: ${clarificationAnswer}`
      : query;

    const systemPrompt = `Eres un asistente experto en análisis de datos y visualización.

Tu trabajo es:
1. Analizar la consulta del usuario
2. Interpretar inteligentemente la consulta y hacer suposiciones razonables cuando sea necesario
3. Generar datos numéricos realistas basados en tu conocimiento general
4. Estructurar la respuesta para crear un gráfico

IMPORTANTE:
- EVITA hacer preguntas de clarificación. Solo pregunta si la consulta es extremadamente ambigua o imposible de interpretar
- Cuando mencionen un año reciente (como 2024), usa tus conocimientos actualizados
- Si no tienes datos exactos, genera aproximaciones realistas y coherentes
- Prefiere generar el gráfico directamente en lugar de pedir más información
- Sugiere el tipo de gráfico más apropiado según los datos (bar, line, pie, area)
- Devuelve entre 5 y 10 puntos de datos

Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "needsClarification": boolean,
  "clarificationQuestion": "pregunta clara y concisa" (solo si needsClarification es true),
  "chartData": {
    "title": "título descriptivo",
    "chartType": "bar" | "line" | "pie" | "area",
    "labels": ["etiqueta1", "etiqueta2", ...],
    "values": [número1, número2, ...],
    "unit": "unidad opcional (ej: personas, casos, %)",
    "description": "breve descripción del gráfico y sus hallazgos principales (máx 2 oraciones)",
    "sources": ["fuente 1", "fuente 2"]
- line: evolución temporal o tendencias
- pie: proporciones o porcentajes del total
- area: evolución temporal con énfasis en volumen`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: fullQuery }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No se recibió respuesta de OpenAI');
    }

    return res.status(200).json(JSON.parse(responseText));

  } catch (error: any) {
    console.error('Error en API:', error);
    const errorMessage = error?.message || 'Unknown error';
    const errorCode = error?.code || error?.status || 500;
    return res.status(500).json({ 
      error: 'Error processing request',
      details: errorMessage,
      code: errorCode
    });
  }
}
