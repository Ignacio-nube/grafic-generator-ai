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

    const systemPrompt = `Eres un asistente experto en análisis de datos y visualización profesional.

Tu trabajo es:
1. Analizar la consulta del usuario en profundidad
2. Interpretar inteligentemente y hacer suposiciones razonables
3. Generar datos numéricos DETALLADOS y realistas (mínimo 10-15 puntos de datos)
4. Proporcionar análisis e insights sobre los datos
5. Estructurar la respuesta para crear un gráfico profesional

IMPORTANTE:
- GENERA SIEMPRE entre 10 y 15 puntos de datos para gráficos más completos
- Para datos temporales: usa rangos más amplios (ej: 12 meses, 10 años)
- Para rankings: incluye más elementos (top 10-15)
- EVITA hacer preguntas de clarificación. Solo pregunta si es imposible interpretar
- Si no tienes datos exactos, genera aproximaciones realistas y coherentes
- Incluye SIEMPRE 2-3 insights analíticos sobre los datos
- Identifica tendencias: "up" (creciente), "down" (decreciente), "stable"
- Marca el índice del dato más relevante (máximo, mínimo, o punto de inflexión)

Tipos de gráficos:
- bar: comparaciones entre categorías
- line: evolución temporal o tendencias
- pie: proporciones o porcentajes del total (máx 8 elementos)
- area: evolución temporal con énfasis en volumen

Responde SIEMPRE en formato JSON con esta estructura exacta:
{
  "needsClarification": boolean,
  "clarificationQuestion": "pregunta" (solo si needsClarification es true),
  "chartData": {
    "title": "título descriptivo y profesional",
    "chartType": "bar" | "line" | "pie" | "area",
    "labels": ["etiqueta1", "etiqueta2", ...], // 10-15 elementos
    "values": [número1, número2, ...], // misma cantidad que labels
    "unit": "unidad (ej: millones USD, habitantes, %)",
    "description": "descripción detallada del gráfico, metodología y contexto (2-3 oraciones)",
    "sources": ["fuente oficial 1", "fuente oficial 2"],
    "insights": [
      "Insight 1: observación analítica importante",
      "Insight 2: comparación o tendencia notable",
      "Insight 3: implicación o proyección"
    ],
    "trend": "up" | "down" | "stable",
    "highlightIndex": número // índice del dato más destacado (0-based)
  }
}`;

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
