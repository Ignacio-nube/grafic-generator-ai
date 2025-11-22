import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Solo para desarrollo, en producción usar backend
});

export interface ChartData {
  labels: string[];
  values: number[];
  title: string;
  chartType: 'bar' | 'line' | 'pie' | 'area';
  unit?: string;
  description?: string;
  sources?: string[];
}

export interface AIResponse {
  needsClarification: boolean;
  clarificationQuestion?: string;
  chartData?: ChartData;
}

export async function processQueryWithAI(
  query: string,
  clarificationAnswer?: string
): Promise<AIResponse> {
  try {
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

    const parsedResponse: AIResponse = JSON.parse(responseText);

    // Validación básica
    if (parsedResponse.needsClarification && !parsedResponse.clarificationQuestion) {
      throw new Error('Respuesta inválida: falta pregunta de clarificación');
    }

    if (!parsedResponse.needsClarification && !parsedResponse.chartData) {
      throw new Error('Respuesta inválida: faltan datos del gráfico');
    }

    if (parsedResponse.chartData) {
      const { labels, values } = parsedResponse.chartData;
      if (labels.length !== values.length) {
        throw new Error('Los datos no coinciden: labels y values tienen diferente longitud');
      }
    }

    return parsedResponse;
  } catch (error) {
    console.error('Error en processQueryWithAI:', error);
    throw error;
  }
}
