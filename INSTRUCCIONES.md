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

### 3. Configurar API Key de OpenAI (producción y local)

Para mantener tu clave segura en producción usamos un endpoint serverless en Vercel. No expongas la clave en el cliente.

1. Producción / Preview en Vercel

   - En el panel de tu proyecto en Vercel → **Settings → Environment Variables** añade la variable:

     Key: `OPENAI_API_KEY`  
     Value: `sk-...` (tu API key)

   - Alternativamente desde la CLI:

```bash
vercel env add OPENAI_API_KEY production
vercel env add OPENAI_API_KEY preview
```

2. Desarrollo local seguro

   - Para desarrollo local evita exponer la clave en el repositorio. Crea un `.env.local` (no se compromete) y añade:

```env
OPENAI_API_KEY=REPLACE_WITH_YOUR_OPENAI_KEY
```

   - Usa `vercel dev` para arrancar tu app y las funciones serverless localmente (carga variables del entorno):

```bash
npm i -g vercel
vercel login
vercel dev
```

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

- **Seguridad**: La aplicación ahora realiza llamadas a OpenAI desde una función serverless (`/api/generate-chart`) — la API key debe almacenarse como `OPENAI_API_KEY` en Vercel y **no** en el código cliente.
- **Costos**: Cada consulta consume tokens de tu cuenta de OpenAI. Usa el modelo `gpt-4o-mini` para reducir costos
- **Datos**: La IA puede generar datos aproximados si no encuentra información exacta. Siempre verifica la precisión de los datos importantes
 - **Reemplazo de clave comprometida**: Si ya subiste una clave al repo (o la has expuesto), revócala y genera una nueva en https://platform.openai.com/account/api-keys. Luego actualiza la variable `OPENAI_API_KEY` en Vercel.

## 📄 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios propuestos.
