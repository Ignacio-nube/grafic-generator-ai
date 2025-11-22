import { useRef } from 'react';
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
  Cell
} from 'recharts';
import { Box, Text, VStack, HStack, Icon, IconButton } from '@chakra-ui/react';
import { FaInfoCircle, FaExternalLinkAlt, FaDownload } from 'react-icons/fa';
import { useColorModeValue } from '@/components/ui/color-mode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { ChartData } from '../services/openaiService';

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

const formatTooltipValue = (value: number, unit?: string | null) => {
  if (Number.isNaN(value)) return '—';
  const formatter = new Intl.NumberFormat('es-ES', {
    maximumFractionDigits: 2
  });
  return `${formatter.format(value)}${unit ? ` ${unit}` : ''}`;
};

// Colores modernos para los gráficos
const COLORS = [
  '#667eea',
  '#764ba2',
  '#f093fb',
  '#4facfe',
  '#43e97b',
  '#fa709a',
  '#fee140',
  '#30cfd0',
  '#a8edea',
  '#ff6e7f'
];

export default function ChartRenderer({ chartData }: ChartRendererProps) {
  const { labels, values, title, chartType, unit } = chartData;
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Colores adaptativos para el tema
  const textColor = useColorModeValue('#1a202c', '#f7fafc');
  const gridColor = useColorModeValue('#e2e8f0', '#4a5568');
  const tooltipBg = useColorModeValue('#ffffff', '#2d3748');
  const tooltipBorder = useColorModeValue('#e2e8f0', '#4a5568');
  const pdfBg = useColorModeValue('#ffffff', '#1a202c');
  
  // Colores para la sección de info
  const infoBg = useColorModeValue('gray.50', 'gray.800');
  const infoBorder = useColorModeValue('gray.100', 'gray.700');
  const descColor = useColorModeValue('gray.700', 'gray.300');
  const sourceLabelColor = useColorModeValue('gray.500', 'gray.400');
  const sourceTextColor = useColorModeValue('gray.600', 'gray.400');

  const handleDownloadPDF = async () => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: pdfBg,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${title || 'grafico'}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  };

  // Formatear datos para Recharts
  const data = labels.map((label, index) => ({
    name: label,
    value: values[index]
  }));

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={450}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fill: textColor, fontSize: 12 }}
        />
        <YAxis 
          label={{ value: unit || '', angle: -90, position: 'insideLeft', fill: textColor }} 
          tick={{ fill: textColor }}
          tickFormatter={formatAxisTick}
        />
        <Tooltip 
          formatter={(value: number) => formatTooltipValue(value, unit)}
          contentStyle={{ 
            backgroundColor: tooltipBg, 
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
          itemStyle={{ color: textColor }}
          labelStyle={{ color: textColor }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px', color: textColor }} />
        <Bar dataKey="value" fill="#667eea" name={unit || 'Valor'} radius={[8, 8, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={450}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fill: textColor, fontSize: 12 }}
        />
        <YAxis 
          label={{ value: unit || '', angle: -90, position: 'insideLeft', fill: textColor }} 
          tick={{ fill: textColor }}
          tickFormatter={formatAxisTick}
        />
        <Tooltip 
          formatter={(value: number) => formatTooltipValue(value, unit)}
          contentStyle={{ 
            backgroundColor: tooltipBg, 
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
          itemStyle={{ color: textColor }}
          labelStyle={{ color: textColor }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px', color: textColor }} />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#667eea" 
          strokeWidth={4}
          name={unit || 'Valor'}
          dot={{ fill: '#667eea', r: 8, strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 10 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={450}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={true}
          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
          outerRadius={140}
          fill="#667eea"
          dataKey="value"
          paddingAngle={2}
        >
          {data.map((_, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]}
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => formatTooltipValue(value, unit)}
          contentStyle={{ 
            backgroundColor: tooltipBg, 
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
          itemStyle={{ color: textColor }}
          labelStyle={{ color: textColor }}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={450}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.3} />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fill: textColor, fontSize: 12 }}
        />
        <YAxis 
          label={{ value: unit || '', angle: -90, position: 'insideLeft', fill: textColor }} 
          tick={{ fill: textColor }}
          tickFormatter={formatAxisTick}
        />
        <Tooltip 
          formatter={(value: number) => formatTooltipValue(value, unit)}
          contentStyle={{ 
            backgroundColor: tooltipBg, 
            border: `1px solid ${tooltipBorder}`,
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}
          itemStyle={{ color: textColor }}
          labelStyle={{ color: textColor }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px', color: textColor }} />
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke="#667eea" 
          fill="#667eea"
          fillOpacity={0.3}
          strokeWidth={3}
          name={unit || 'Valor'}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  return (
    <VStack w="full" gap={6} align="stretch" ref={chartRef} p={4} bg={useColorModeValue('white', 'transparent')}>
      <HStack justify="center" position="relative" w="full">
        <h2 style={{ 
          textAlign: 'center', 
          fontSize: '28px', 
          fontWeight: '800',
          color: textColor,
          letterSpacing: '-0.02em',
          margin: 0
        }}>
          {title}
        </h2>
        <IconButton
          aria-label="Descargar PDF"
          onClick={handleDownloadPDF}
          position="absolute"
          right={0}
          top="50%"
          transform="translateY(-50%)"
          size="sm"
          variant="ghost"
          color={textColor}
          _hover={{ bg: gridColor }}
        >
          <FaDownload />
        </IconButton>
      </HStack>
      
      <Box w="full" h="450px">
        {chartType === 'bar' && renderBarChart()}
        {chartType === 'line' && renderLineChart()}
        {chartType === 'pie' && renderPieChart()}
        {chartType === 'area' && renderAreaChart()}
      </Box>

      {(chartData.description || (chartData.sources && chartData.sources.length > 0)) && (
        <Box 
          mt={4} 
          p={4} 
          bg={infoBg} 
          rounded="xl" 
          border="1px solid" 
          borderColor={infoBorder}
        >
          <VStack align="start" gap={3}>
            {chartData.description && (
              <HStack align="start" gap={3}>
                <Icon as={FaInfoCircle} color="blue.500" mt={1} />
                <Text fontSize="sm" color={descColor}>
                  {chartData.description}
                </Text>
              </HStack>
            )}
            
            {chartData.sources && chartData.sources.length > 0 && (
              <HStack align="start" gap={3}>
                <Icon as={FaExternalLinkAlt} color="green.500" mt={1} boxSize={3} />
                <HStack wrap="wrap" gap={2}>
                  <Text fontSize="xs" fontWeight="bold" color={sourceLabelColor}>
                    Fuentes:
                  </Text>
                  {chartData.sources.map((source, idx) => (
                    <Text key={idx} fontSize="xs" color={sourceTextColor}>
                      {source}{idx < (chartData.sources?.length || 0) - 1 ? ' • ' : ''}
                    </Text>
                  ))}
                </HStack>
              </HStack>
            )}
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
