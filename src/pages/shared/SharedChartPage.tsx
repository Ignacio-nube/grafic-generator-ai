import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, VStack, HStack, Text, Button, Spinner, Container, Icon } from '@chakra-ui/react';
import { FaArrowLeft, FaChartBar } from 'react-icons/fa';
import { IoSparkles } from 'react-icons/io5';
import { useColorModeValue } from '@/components/ui/color-mode';
import { getChartByShareId } from '../../services/chartService';
import type { SavedChart } from '../../services/chartService';
import ChartRenderer from '../../componentes/ChartRenderer';

export default function SharedChartPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [chart, setChart] = useState<SavedChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bg = useColorModeValue('gray.50', 'gray.950');
  const headerBg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.800');
  const textColor = useColorModeValue('gray.900', 'gray.50');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    const loadChart = async () => {
      if (!shareId) {
        setError('ID de gráfico no válido');
        setLoading(false);
        return;
      }

      try {
        const chartData = await getChartByShareId(shareId);
        if (chartData) {
          setChart(chartData);
        } else {
          setError('Gráfico no encontrado o no es público');
        }
      } catch (err) {
        console.error('Error loading chart:', err);
        setError('Error al cargar el gráfico');
      } finally {
        setLoading(false);
      }
    };

    loadChart();
  }, [shareId]);

  if (loading) {
    return (
      <Box bg={bg} minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack gap={4}>
          <Spinner size="xl" color="brand.500" />
          <Text color={mutedColor}>Cargando gráfico...</Text>
        </VStack>
      </Box>
    );
  }

  if (error || !chart) {
    return (
      <Box bg={bg} minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack gap={6} textAlign="center" p={8}>
          <Icon as={FaChartBar} boxSize={16} color="gray.300" />
          <VStack gap={2}>
            <Text fontSize="2xl" fontWeight="bold" color={textColor}>
              {error || 'Gráfico no encontrado'}
            </Text>
            <Text color={mutedColor}>
              Este gráfico puede haber sido eliminado o no es público.
            </Text>
          </VStack>
          <Button asChild colorPalette="red" size="lg">
            <Link to="/">
              <Icon as={FaArrowLeft} mr={2} />
              Crear mi propio gráfico
            </Link>
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box bg={bg} minH="100vh">
      {/* Header */}
      <Box 
        bg={headerBg} 
        borderBottom="1px solid" 
        borderColor={borderColor}
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Container maxW="4xl" py={3}>
          <HStack justify="space-between" align="center">
            <HStack gap={3}>
              <Box p={2} bg="brand.500" rounded="xl" color="white">
                <IoSparkles size={20} />
              </Box>
              <VStack align="start" gap={0}>
                <Text fontWeight="bold" color={textColor} fontSize="lg">
                  Gráficos AI
                </Text>
                <Text fontSize="xs" color={mutedColor}>
                  Gráfico compartido
                </Text>
              </VStack>
            </HStack>
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <Icon as={FaArrowLeft} mr={2} />
                Crear gráfico
              </Link>
            </Button>
          </HStack>
        </Container>
      </Box>

      {/* Content */}
      <Container maxW="4xl" py={8}>
        <VStack gap={6} align="stretch">
          {/* Info del creador */}
          <Box 
            bg={headerBg} 
            p={4} 
            rounded="lg" 
            border="1px solid" 
            borderColor={borderColor}
          >
            <HStack gap={4}>
              <Box 
                w={10} 
                h={10} 
                rounded="full" 
                bg="linear-gradient(135deg, #b9030f 0%, #e63946 100%)"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="white" fontWeight="bold">
                  {chart.title.charAt(0).toUpperCase()}
                </Text>
              </Box>
              <VStack align="start" gap={0}>
                <Text fontWeight="medium" color={textColor}>
                  Gráfico creado con IA
                </Text>
                <Text fontSize="sm" color={mutedColor}>
                  {new Date(chart.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </VStack>
            </HStack>
          </Box>

          {/* El gráfico */}
          <ChartRenderer 
            chartData={{
              labels: chart.labels,
              values: chart.values,
              title: chart.title,
              chartType: chart.chartType,
              unit: chart.unit,
              description: chart.description,
              sources: chart.sources,
              insights: chart.insights,
              trend: chart.trend
            }}
          />

          {/* Call to action */}
          <Box 
            bg="linear-gradient(135deg, #b9030f 0%, #e63946 100%)"
            p={6}
            rounded="xl"
            textAlign="center"
          >
            <VStack gap={4}>
              <Text color="white" fontSize="xl" fontWeight="bold">
                ¿Quieres crear tu propio gráfico?
              </Text>
              <Text color="whiteAlpha.800">
                Usa inteligencia artificial para generar gráficos profesionales en segundos.
              </Text>
              <Button asChild colorPalette="whiteAlpha" size="lg">
                <Link to="/">Crear gráfico gratis</Link>
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
