# 📊 Creador de Gráficos con IA

Aplicación web que utiliza OpenAI para crear gráficos automáticamente a partir de consultas en lenguaje natural.

## 🚀 Características

- **Búsqueda inteligente con IA**: Ingresa cualquier consulta y OpenAI buscará y estructurará los datos
- **Auto-detección de contexto**: Si falta información, la IA hace UNA pregunta de clarificación antes de generar el gráfico
- **Detección automática de tipo de gráfico**: La IA decide el mejor tipo (barras, líneas, pastel, área) según los datos
- **4 tipos de gráficos**: Barras, Líneas, Pastel y Área
- **Interfaz moderna**: Construida con Chakra UI v3
- **Visualizaciones interactivas**: Powered by Recharts

## 📦 Tecnologías

- **React 19** + **TypeScript**
- **Vite** - Build tool
- **Chakra UI v3** - Sistema de diseño y componentes
- **Recharts** - Librería de gráficos
- **OpenAI API** - Procesamiento de lenguaje natural y extracción de datos
- **Axios** - Cliente HTTP

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
cd billeteras
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar API Key de OpenAI

1. Copia el archivo `.env.example` a `.env.local`:
```bash
copy .env.example .env.local
```

2. Obtén tu API key desde https://platform.openai.com/api-keys

3. Edita `.env.local` y reemplaza `tu-api-key-aqui` con tu API key real:
```env
VITE_OPENAI_API_KEY=sk-proj-...
```

⚠️ **IMPORTANTE**: Nunca compartas tu API key ni la subas a Git. El archivo `.env.local` ya está en `.gitignore`

### 4. Ejecutar el proyecto

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 💡 Uso

### Ejemplos de consultas

1. **Datos temporales** (genera gráfico de líneas):
   - "peruanos muertos en accidentes de tránsito 2020-2023"
   - "evolución de la inflación en Argentina últimos 5 años"

2. **Comparaciones** (genera gráfico de barras):
   - "países con más medallas olímpicas 2024"
   - "ventas por región en Latinoamérica"

3. **Proporciones** (genera gráfico de pastel):
   - "distribución de idiomas en el mundo"
   - "porcentaje de uso de navegadores web"

4. **Tendencias con volumen** (genera gráfico de área):
   - "crecimiento de usuarios de redes sociales por año"
   - "consumo de energía renovable en Europa"

### Flujo de uso

1. Ingresa tu consulta en el campo de texto
2. Si la IA necesita más información, responde la pregunta de clarificación
3. Espera mientras la IA procesa y estructura los datos
4. Visualiza el gráfico generado automáticamente
5. Haz clic en "Crear otro gráfico" para empezar de nuevo

## 🏗️ Estructura del proyecto

```
src/
├── componentes/
│   ├── ChartCreator.tsx      # Componente principal con UI
│   └── ChartRenderer.tsx     # Renderiza los gráficos
├── services/
│   └── openaiService.ts      # Lógica de comunicación con OpenAI
├── App.tsx                   # Punto de entrada de la app
└── main.tsx                  # Setup de React y Chakra UI
```

## 🔧 Scripts disponibles

```bash
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run preview      # Previsualiza el build de producción
npm run lint         # Ejecuta el linter
```

## 🤖 Cómo funciona la IA

1. **Análisis de consulta**: OpenAI analiza tu consulta y determina si necesita más información
2. **Clarificación (opcional)**: Si falta contexto crítico (fechas, ubicación, etc.), hace UNA pregunta
3. **Extracción de datos**: Busca o genera datos numéricos realistas basados en su conocimiento
4. **Selección de gráfico**: Decide automáticamente el tipo de gráfico más apropiado:
   - **Barras**: Comparaciones entre categorías
   - **Líneas**: Evolución temporal o tendencias
   - **Pastel**: Proporciones o porcentajes del total
   - **Área**: Evolución temporal con énfasis en volumen
5. **Estructuración**: Formatea los datos en JSON listo para Recharts

## ⚠️ Notas importantes

- **Seguridad**: La API key se usa en el cliente (navegador). Para producción, considera crear un backend que haga las llamadas a OpenAI
- **Costos**: Cada consulta consume tokens de tu cuenta de OpenAI. Usa el modelo `gpt-4o-mini` para reducir costos
- **Datos**: La IA puede generar datos aproximados si no encuentra información exacta. Siempre verifica la precisión de los datos importantes

## 📄 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios propuestos.
