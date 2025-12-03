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
    const response = await fetch('/api/generate-chart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, clarificationAnswer }),
    });

    if (!response.ok) {
      throw new Error('Error en la petición al servidor');
    }

    const parsedResponse: AIResponse = await response.json();

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
