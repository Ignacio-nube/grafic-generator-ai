import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Brush
} from 'recharts';
import { 
  Box, 
  Text, 
  VStack, 
  HStack, 
  Icon, 
  IconButton, 
  Badge,
  Button
} from '@chakra-ui/react';
import { 
  FaDownload, 
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaChartArea,
  FaImage
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useColorModeValue } from '@/components/ui/color-mode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { ChartData } from '../services/openaiService';

const MotionBox = motion.create(Box);

interface ChartRendererProps {
  chartData: ChartData;
}

// Conversión compacta para que los ticks ocupen máx. 4 caracteres
const formatAxisTick = (rawValue: number): string => {
  if (Number.isNaN(rawValue)) return '';
  const sign = rawValue < 0 ? '-' : '';
  const abs = Math.abs(rawValue);

  let scaled = abs;
  let suffix = '';

  if (abs >= 1_000_000_000) {
    scaled = abs / 1_000_000_000;
    suffix = 'B';
  } else if (abs >= 1_000_000) {
    scaled = abs / 1_000_000;
    suffix = 'M';
  } else if (abs >= 10_000) {
    scaled = abs / 1_000;
    suffix = 'K';
  }

  const digits = scaled >= 10 ? 0 : 1;
  let formatted = scaled.toFixed(digits).replace('.', ',');

  if (formatted.replace(',', '').length > 4) {
    formatted = Math.round(scaled).toString().slice(0, 4);
  }

  return `${sign}${formatted}${suffix}`;
};

const formatFullNumber = (value: number) => {
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 2
  }).format(value);
};

// Colores modernos para los gráficos
const COLORS = [
  '#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b',
  '#fa709a', '#fee140', '#30cfd0', '#a8edea', '#ff6e7f',
  '#38ef7d', '#11998e', '#fc4a1a', '#f7b733', '#00b4db'
];

export default function ChartRenderer({ chartData }: ChartRendererProps) {
  const { labels, values, title, chartType, unit } = chartData;
  const chartRef = useRef<HTMLDivElement>(null);
  const [activeChartType, setActiveChartType] = useState(chartType);
  const [isDownloading, setIsDownloading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  
  // Detectar cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Colores adaptativos usando semantic tokens de Chakra para mejor contraste
  const textColor = useColorModeValue('gray.800', 'gray.50');
  const gridColor = useColorModeValue('#cbd5e0', '#4a5568'); // Valores CSS para Recharts
  const chartTextColor = useColorModeValue('#1a202c', '#f7fafc'); // Valores CSS para Recharts
  const tooltipBg = useColorModeValue('white', 'gray.700');
  const tooltipBorder = useColorModeValue('gray.200', 'gray.600');
  const infoBg = useColorModeValue('gray.100', 'gray.700');
  const infoBorder = useColorModeValue('gray.200', 'gray.600');
  
  // Colores para estadísticas con buen contraste
  const greenBg = useColorModeValue('green.100', 'green.900');
  const greenText = useColorModeValue('green.800', 'green.100');
  const redBg = useColorModeValue('red.100', 'red.900');
  const redText = useColorModeValue('red.800', 'red.100');
  const blueBg = useColorModeValue('blue.100', 'blue.900');
  const blueText = useColorModeValue('blue.800', 'blue.100');

  // Calcular estadísticas
  const stats = useMemo(() => {
    const sum = values.reduce((a, b) => a + b, 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const maxIndex = values.indexOf(max);
    const minIndex = values.indexOf(min);
    
    return { sum, max, min, maxIndex, minIndex };
  }, [values]);

  // Formatear datos para Recharts
  const data = useMemo(() => labels.map((label, index) => ({
    name: label,
    value: values[index],
    isMax: index === stats.maxIndex,
    isMin: index === stats.minIndex
  })), [labels, values, stats]);

  // Función para preparar el elemento para captura (reemplaza colores CSS modernos)
  const prepareElementForCapture = useCallback((element: HTMLElement): () => void => {
    const originalStyles: Map<Element, Record<string, string>> = new Map();
    
    const propertiesToCheck = [
      'color', 'backgroundColor', 'borderColor', 
      'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
      'outlineColor', 'textDecorationColor', 
      'fill', 'stroke', 'stopColor', 'floodColor', 'lightingColor'
    ];

    const allElements = element.querySelectorAll('*');
    // Incluir el elemento raíz
    const elementsToProcess = [element, ...Array.from(allElements)];

    elementsToProcess.forEach((el) => {
      // Castear a HTMLElement para acceder a style (funciona también para SVG en navegadores modernos)
      const htmlEl = el as HTMLElement;
      if (!htmlEl.style) return;

      const computed = window.getComputedStyle(el);
      const savedStyles: Record<string, string> = {};
      let hasChanges = false;

      // 1. Reemplazar propiedades de color simples
      propertiesToCheck.forEach(prop => {
        const val = computed[prop as any];
        if (val && (val.includes('color(') || val.includes('oklch') || val.includes('lab('))) {
           savedStyles[prop] = htmlEl.style[prop as any];
           
           // Fallbacks seguros
           let fallback = '#000000'; // Default text
           const propLower = prop.toLowerCase();
           if (propLower.includes('background')) fallback = '#ffffff'; // Asumir fondo blanco por defecto
           if (propLower.includes('border')) fallback = '#e2e8f0';
           if (propLower.includes('stroke')) fallback = 'transparent';
           if (propLower.includes('fill')) fallback = '#000000';
           if (propLower.includes('stop')) fallback = '#000000';
           
           htmlEl.style[prop as any] = fallback;
           hasChanges = true;
        }
      });

      // 2. Manejar propiedades complejas (Shadows, Gradients)
      
      // Box Shadow
      if (computed.boxShadow && (computed.boxShadow.includes('color(') || computed.boxShadow.includes('oklch'))) {
        savedStyles['boxShadow'] = htmlEl.style.boxShadow;
        htmlEl.style.boxShadow = 'none';
        hasChanges = true;
      }

      // Text Shadow
      if (computed.textShadow && (computed.textShadow.includes('color(') || computed.textShadow.includes('oklch'))) {
        savedStyles['textShadow'] = htmlEl.style.textShadow;
        htmlEl.style.textShadow = 'none';
        hasChanges = true;
      }

      // Background Image (gradientes)
      if (computed.backgroundImage && (computed.backgroundImage.includes('color(') || computed.backgroundImage.includes('oklch'))) {
        savedStyles['backgroundImage'] = htmlEl.style.backgroundImage;
        htmlEl.style.backgroundImage = 'none';
        hasChanges = true;
      }

      if (hasChanges) {
        originalStyles.set(el, savedStyles);
      }
    });
    
    // Función para restaurar estilos originales
    return () => {
      originalStyles.forEach((styles, el) => {
        const htmlEl = el as HTMLElement;
        Object.entries(styles).forEach(([prop, val]) => {
          htmlEl.style[prop as any] = val;
        });
      });
    };
  }, []);

  // Función de descarga PNG
  const handleDownloadPNG = useCallback(async () => {
    if (!chartRef.current) return;
    
    try {
      const element = chartRef.current;
      const restoreStyles = prepareElementForCapture(element);
      
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // Asegurar fondo blanco en el clon
          const clonedElement = clonedDoc.body.querySelector('[data-chart-container]');
          if (clonedElement) {
            (clonedElement as HTMLElement).style.backgroundColor = '#ffffff';
          }
        }
      });
      
      restoreStyles();
      
      const link = document.createElement('a');
      link.download = `${title || 'grafico'}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (error) {
      console.error('Error generando PNG:', error);
      alert(`Error al descargar PNG: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [title, prepareElementForCapture]);

  // Función de descarga PDF profesional
  const handleDownload = useCallback(async () => {
    if (!chartRef.current || isDownloading) return;
    
    setIsDownloading(true);
    
    try {
      const element = chartRef.current;
      const restoreStyles = prepareElementForCapture(element);
      
      // Capturar gráfico en alta resolución
      const canvas = await html2canvas(element, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        removeContainer: true,
        imageTimeout: 0
      });
      
      restoreStyles();
      
      // Crear PDF profesional
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // === HEADER ===
      pdf.setFillColor(102, 126, 234);
      pdf.rect(0, 0, pageWidth, 18, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('GRAFICOS AI', 10, 12);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const dateStr = new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      pdf.text(dateStr, pageWidth - 60, 12);
      
      // === TÍTULO ===
      pdf.setTextColor(30, 30, 30);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title || 'Gráfico', 10, 30);
      
      // === ESTADÍSTICAS ===
      const statsY = 38;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Máximo
      pdf.setFillColor(220, 252, 231);
      pdf.roundedRect(10, statsY, 55, 12, 2, 2, 'F');
      pdf.setTextColor(22, 101, 52);
      pdf.text(`Máximo: ${formatFullNumber(stats.max)} ${unit || ''}`, 14, statsY + 8);
      
      // Mínimo
      pdf.setFillColor(254, 226, 226);
      pdf.roundedRect(70, statsY, 55, 12, 2, 2, 'F');
      pdf.setTextColor(153, 27, 27);
      pdf.text(`Mínimo: ${formatFullNumber(stats.min)} ${unit || ''}`, 74, statsY + 8);
      
      // Total
      pdf.setFillColor(219, 234, 254);
      pdf.roundedRect(130, statsY, 55, 12, 2, 2, 'F');
      pdf.setTextColor(30, 64, 175);
      pdf.text(`Total: ${formatFullNumber(stats.sum)} ${unit || ''}`, 134, statsY + 8);
      
      // Promedio
      const avg = stats.sum / values.length;
      pdf.setFillColor(243, 232, 255);
      pdf.roundedRect(190, statsY, 55, 12, 2, 2, 'F');
      pdf.setTextColor(107, 33, 168);
      pdf.text(`Promedio: ${formatFullNumber(avg)} ${unit || ''}`, 194, statsY + 8);
      
      // === GRÁFICO ===
      const chartY = 55;
      const imgData = canvas.toDataURL('image/png', 1.0);
      const availableWidth = pageWidth - 20;
      const availableHeight = pageHeight - chartY - 25;
      
      const imgAspect = canvas.width / canvas.height;
      let finalWidth = availableWidth;
      let finalHeight = finalWidth / imgAspect;
      
      if (finalHeight > availableHeight) {
        finalHeight = availableHeight;
        finalWidth = finalHeight * imgAspect;
      }
      
      const imgX = (pageWidth - finalWidth) / 2;
      pdf.addImage(imgData, 'PNG', imgX, chartY, finalWidth, finalHeight);
      
      // === TABLA DE DATOS ===
      if (values.length <= 15) {
        // Segunda página con tabla de datos
        pdf.addPage();
        
        // Header segunda página
        pdf.setFillColor(102, 126, 234);
        pdf.rect(0, 0, pageWidth, 18, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('DATOS DEL GRÁFICO', 10, 12);
        
        // Tabla
        const tableStartY = 30;
        const colWidths = [15, 100, 60, 40];
        const rowHeight = 8;
        
        // Header de tabla
        pdf.setFillColor(240, 240, 240);
        pdf.rect(10, tableStartY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
        pdf.setTextColor(50, 50, 50);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('#', 14, tableStartY + 6);
        pdf.text('Etiqueta', 30, tableStartY + 6);
        pdf.text('Valor', 135, tableStartY + 6);
        pdf.text('% del Total', 185, tableStartY + 6);
        
        // Filas de datos
        pdf.setFont('helvetica', 'normal');
        data.forEach((item, idx) => {
          const y = tableStartY + (idx + 1) * rowHeight;
          
          // Alternar colores de fila
          if (idx % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(10, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
          }
          
          // Resaltar máximo y mínimo
          if (item.isMax) {
            pdf.setFillColor(220, 252, 231);
            pdf.rect(10, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
          } else if (item.isMin) {
            pdf.setFillColor(254, 226, 226);
            pdf.rect(10, y, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
          }
          
          pdf.setTextColor(50, 50, 50);
          pdf.text(String(idx + 1), 14, y + 6);
          pdf.text(item.name.substring(0, 40), 30, y + 6);
          pdf.text(`${formatFullNumber(item.value)} ${unit || ''}`, 135, y + 6);
          pdf.text(`${((item.value / stats.sum) * 100).toFixed(1)}%`, 185, y + 6);
        });
      }
      
      // === FOOTER (última página) ===
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Generado con graficos.ignacio.cloud - Página ${i} de ${totalPages}`, 10, pageHeight - 5);
        pdf.text('Los datos son aproximaciones. Verificar con fuentes oficiales.', pageWidth - 100, pageHeight - 5);
      }
      
      // Guardar PDF
      pdf.save(`${title || 'grafico'}.pdf`);
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert(`Error al descargar PDF: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsDownloading(false);
    }
  }, [title, isDownloading, prepareElementForCapture, stats, data, values.length, unit]);

  const getChartIcon = (type: string) => {
    switch(type) {
      case 'bar': return FaChartBar;
      case 'line': return FaChartLine;
      case 'pie': return FaChartPie;
      case 'area': return FaChartArea;
      default: return FaChartBar;
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      
      return (
        <Box
          bg={tooltipBg}
          border="1px solid"
          borderColor={tooltipBorder}
          rounded="lg"
          p={3}
          shadow="lg"
        >
          <Text fontWeight="bold" color={textColor} fontSize="sm" mb={1}>
            {label}
          </Text>
          <Text fontWeight="bold" color="blue.500" fontSize="lg">
            {formatFullNumber(dataPoint.value)} {unit || ''}
          </Text>
          {dataPoint.isMax && (
            <Badge colorPalette="green" size="sm" mt={1}>Máximo</Badge>
          )}
          {dataPoint.isMin && (
            <Badge colorPalette="red" size="sm" mt={1}>Mínimo</Badge>
          )}
        </Box>
      );
    }
    return null;
  };

  // Detectar si es móvil (reactivo)
  const isMobile = windowWidth < 768;
  const chartHeight = isMobile ? 300 : 400;
  const labelAngle = isMobile ? -60 : -45;
  const labelFontSize = isMobile ? 9 : 11;
  const xAxisHeight = isMobile ? 80 : 100;
  const chartMargin = isMobile 
    ? { top: 10, right: 10, left: 0, bottom: 60 }
    : { top: 20, right: 30, left: 20, bottom: 80 };

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
        <XAxis 
          dataKey="name" 
          angle={labelAngle}
          textAnchor="end"
          height={xAxisHeight}
          tick={{ fill: chartTextColor, fontSize: labelFontSize }}
          interval={isMobile && data.length > 6 ? Math.ceil(data.length / 6) : 0}
          tickFormatter={(value) => isMobile && value.length > 10 ? value.substring(0, 10) + '...' : value}
        />
        <YAxis 
          tick={{ fill: chartTextColor, fontSize: labelFontSize }} 
          tickFormatter={formatAxisTick}
          width={isMobile ? 40 : 60}
        />
        <Tooltip content={<CustomTooltip />} />
        {!isMobile && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
        <Bar dataKey="value" name={unit || 'Valor'} radius={[4, 4, 0, 0]} animationDuration={800}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
        {values.length > 10 && !isMobile && <Brush dataKey="name" height={25} stroke="#667eea" />}
      </BarChart>
    </ResponsiveContainer>
  );

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <LineChart data={data} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
        <XAxis 
          dataKey="name" 
          angle={labelAngle}
          textAnchor="end"
          height={xAxisHeight}
          tick={{ fill: chartTextColor, fontSize: labelFontSize }}
          interval={isMobile && data.length > 6 ? Math.ceil(data.length / 6) : 0}
          tickFormatter={(value) => isMobile && value.length > 10 ? value.substring(0, 10) + '...' : value}
        />
        <YAxis 
          tick={{ fill: chartTextColor, fontSize: labelFontSize }} 
          tickFormatter={formatAxisTick}
          width={isMobile ? 40 : 60}
        />
        <Tooltip content={<CustomTooltip />} />
        {!isMobile && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
        <Line 
          type="monotone" 
          dataKey="value" 
          name={unit || 'Valor'}
          stroke="#667eea" 
          strokeWidth={isMobile ? 2 : 3}
          dot={isMobile ? false : { fill: '#667eea', strokeWidth: 2, r: 4 }}
          activeDot={{ r: isMobile ? 4 : 6, stroke: '#fff', strokeWidth: 2 }}
          animationDuration={800}
        />
        {values.length > 10 && !isMobile && <Brush dataKey="name" height={25} stroke="#667eea" />}
      </LineChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={isMobile ? 350 : 400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy={isMobile ? "40%" : "50%"}
          labelLine={!isMobile}
          label={isMobile 
            ? false 
            : ({ name, percent }) => `${(name || '').length > 15 ? (name || '').substring(0, 15) + '...' : (name || '')}: ${((percent || 0) * 100).toFixed(1)}%`
          }
          outerRadius={isMobile ? 80 : 130}
          innerRadius={isMobile ? 30 : 50}
          dataKey="value"
          paddingAngle={2}
          animationDuration={800}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          layout={isMobile ? "horizontal" : "vertical"} 
          align={isMobile ? "center" : "right"} 
          verticalAlign={isMobile ? "bottom" : "middle"}
          wrapperStyle={isMobile ? { fontSize: '10px', paddingTop: '10px' } : {}}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <AreaChart data={data} margin={chartMargin}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
        <XAxis 
          dataKey="name" 
          angle={labelAngle}
          textAnchor="end"
          height={xAxisHeight}
          tick={{ fill: chartTextColor, fontSize: labelFontSize }}
          interval={isMobile && data.length > 6 ? Math.ceil(data.length / 6) : 0}
          tickFormatter={(value) => isMobile && value.length > 10 ? value.substring(0, 10) + '...' : value}
        />
        <YAxis 
          tick={{ fill: chartTextColor, fontSize: labelFontSize }} 
          tickFormatter={formatAxisTick}
          width={isMobile ? 40 : 60}
        />
        <Tooltip content={<CustomTooltip />} />
        {!isMobile && <Legend wrapperStyle={{ paddingTop: '20px' }} />}
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke="#667eea" 
          fill="url(#colorValue)"
          strokeWidth={isMobile ? 2 : 3}
          name={unit || 'Valor'}
          animationDuration={800}
        />
        {values.length > 10 && !isMobile && <Brush dataKey="name" height={25} stroke="#667eea" />}
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderChart = () => {
    switch(activeChartType) {
      case 'bar': return renderBarChart();
      case 'line': return renderLineChart();
      case 'pie': return renderPieChart();
      case 'area': return renderAreaChart();
      default: return renderBarChart();
    }
  };

  return (
    <VStack w="full" gap={4} align="stretch">
      {/* Header */}
      <VStack align="stretch" gap={3}>
        <HStack justify="space-between" align="center" wrap="wrap" gap={2}>
          <HStack gap={2} minW={0} flex={1}>
            <Icon as={getChartIcon(activeChartType)} color="blue.solid" boxSize={{ base: 4, md: 5 }} flexShrink={0} />
            <Text 
              fontSize={{ base: 'md', md: 'xl' }} 
              fontWeight="bold" 
              color={textColor}
              lineClamp={2}
            >
              {title}
            </Text>
          </HStack>
        </HStack>

        <HStack justify="space-between" wrap="wrap" gap={2}>
          {/* Selector de tipo de gráfico */}
          <HStack bg={infoBg} rounded="lg" p={1}>
            {(['bar', 'line', 'area', 'pie'] as const).map((type) => (
              <IconButton
                key={type}
                aria-label={type}
                size={{ base: 'xs', md: 'sm' }}
                variant={activeChartType === type ? 'solid' : 'ghost'}
                colorPalette={activeChartType === type ? 'blue' : 'gray'}
                onClick={() => setActiveChartType(type)}
              >
                <Icon as={getChartIcon(type)} boxSize={{ base: 3, md: 4 }} />
              </IconButton>
            ))}
          </HStack>

          {/* Botones de descarga */}
          <HStack gap={1}>
            <Button
              size={{ base: 'xs', md: 'sm' }}
              variant="solid"
              colorPalette="blue"
              onClick={handleDownload}
              loading={isDownloading}
              loadingText="..."
            >
              <Icon as={FaDownload} boxSize={{ base: 3, md: 4 }} />
              <Text ml={1} display={{ base: 'none', sm: 'inline' }}>PDF</Text>
            </Button>
            <Button
              size={{ base: 'xs', md: 'sm' }}
              variant="outline"
              colorPalette="gray"
              onClick={handleDownloadPNG}
            >
              <Icon as={FaImage} boxSize={{ base: 3, md: 4 }} />
              <Text ml={1} display={{ base: 'none', sm: 'inline' }}>PNG</Text>
            </Button>
          </HStack>
        </HStack>
      </VStack>

      {/* Estadísticas simples con buen contraste */}
      <HStack gap={{ base: 2, md: 4 }} wrap="wrap" justify="center">
        <HStack bg={greenBg} px={{ base: 2, md: 3 }} py={{ base: 1, md: 2 }} rounded="lg" shadow="sm">
          <Text fontSize={{ base: '2xs', md: 'xs' }} color={greenText} fontWeight="medium">Máx:</Text>
          <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color={greenText}>
            {formatFullNumber(stats.max)} {unit || ''}
          </Text>
        </HStack>
        <HStack bg={redBg} px={{ base: 2, md: 3 }} py={{ base: 1, md: 2 }} rounded="lg" shadow="sm">
          <Text fontSize={{ base: '2xs', md: 'xs' }} color={redText} fontWeight="medium">Mín:</Text>
          <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color={redText}>
            {formatFullNumber(stats.min)} {unit || ''}
          </Text>
        </HStack>
        <HStack bg={blueBg} px={{ base: 2, md: 3 }} py={{ base: 1, md: 2 }} rounded="lg" shadow="sm">
          <Text fontSize={{ base: '2xs', md: 'xs' }} color={blueText} fontWeight="medium">Total:</Text>
          <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight="bold" color={blueText}>
            {formatFullNumber(stats.sum)} {unit || ''}
          </Text>
        </HStack>
      </HStack>

      {/* Gráfico principal */}
      <Box 
        ref={chartRef}
        data-chart-container
        bg="white"
        _dark={{ bg: 'gray.800' }}
        p={{ base: 2, md: 4 }} 
        rounded="xl" 
        border="1px solid" 
        borderColor={infoBorder}
        shadow="sm"
        overflow="hidden"
      >
        <AnimatePresence mode="wait">
          <MotionBox
            key={activeChartType}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            {renderChart()}
          </MotionBox>
        </AnimatePresence>
      </Box>
    </VStack>
  );
}
