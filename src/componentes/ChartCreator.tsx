import { useState } from 'react';
import {
	Box,
	Button,
	Input,
	Heading,
	Text,
	Spinner,
	Container,
	IconButton,
	Flex,
	VStack,
	Wrap,
	WrapItem
} from '@chakra-ui/react';
import { Alert } from '@chakra-ui/react/alert';
import { IoArrowForward, IoRefresh } from 'react-icons/io5';
import { ColorModeButton, useColorModeValue } from '@/components/ui/color-mode';
import { processQueryWithAI, type ChartData } from '../services/openaiService';
import ChartRenderer from './ChartRenderer';

export default function ChartCreator() {
	const [query, setQuery] = useState('');
	const [clarificationQuestion, setClarificationQuestion] = useState('');
	const [clarificationAnswer, setClarificationAnswer] = useState('');
	const [chartData, setChartData] = useState<ChartData | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [waitingForClarification, setWaitingForClarification] = useState(false);
	const [originalQuery, setOriginalQuery] = useState('');

	const quickPrompts = [
		'Top 10 países más poblados',
		'Evolución de energías renovables',
		'Ventas vs Ganancias 2024'
	];

	const bg = useColorModeValue('white', 'gray.950');
	const textColor = useColorModeValue('gray.900', 'gray.50');
	const mutedColor = useColorModeValue('gray.500', 'gray.400');
	const borderColor = useColorModeValue('gray.200', 'gray.800');
	const inputBg = useColorModeValue('gray.50', 'gray.900');
	const inputFocusBorder = useColorModeValue('gray.400', 'gray.600');

	const handleSubmit = async () => {
		if (!query.trim()) {
			setError('Por favor, ingresa una consulta');
			return;
		}

		setLoading(true);
		setError('');
		setChartData(null);
		setClarificationQuestion('');
		setWaitingForClarification(false);

		try {
			const response = await processQueryWithAI(query);

			if (response.needsClarification && response.clarificationQuestion) {
				setClarificationQuestion(response.clarificationQuestion);
				setWaitingForClarification(true);
				setOriginalQuery(query);
			} else if (response.chartData) {
				setChartData(response.chartData);
			} else {
				setError('No se pudo procesar la respuesta de la IA');
			}
		} catch (err) {
			console.error('Error:', err);
			setError(
				err instanceof Error
					? err.message
					: 'Error al procesar la consulta. Verifica tu API key en el archivo .env.local'
			);
		} finally {
			setLoading(false);
		}
	};

	const handleClarificationSubmit = async () => {
		if (!clarificationAnswer.trim()) {
			setError('Por favor, responde la pregunta de clarificación');
			return;
		}

		setLoading(true);
		setError('');

		try {
			const response = await processQueryWithAI(originalQuery, clarificationAnswer);

			if (response.chartData) {
				setChartData(response.chartData);
				setWaitingForClarification(false);
				setClarificationQuestion('');
				setClarificationAnswer('');
			} else {
				setError('No se pudieron obtener datos después de la clarificación');
			}
		} catch (err) {
			console.error('Error:', err);
			setError(
				err instanceof Error
					? err.message
					: 'Error al procesar la respuesta'
			);
		} finally {
			setLoading(false);
		}
	};

	const handleReset = () => {
		setQuery('');
		setChartData(null);
		setError('');
		setClarificationQuestion('');
		setClarificationAnswer('');
		setWaitingForClarification(false);
		setOriginalQuery('');
	};



	return (
		<Box bg={bg} minH="100vh" transition="background 0.2s">
			<Box position="fixed" top={6} right={6} zIndex={10}>
				<ColorModeButton size="sm" variant="ghost" />
			</Box>

			<Container maxW="4xl" py={{ base: 20, md: 32 }} px={6}>
				<VStack gap={12} align="stretch">
					{!chartData && !loading && !waitingForClarification && (
						<VStack gap={8} align="center" textAlign="center">
							<VStack gap={4}>
								<Heading 
									size="4xl" 
									fontWeight="light" 
									letterSpacing="-0.03em"
									color={textColor}
								>
									Generador de Gráficos
								</Heading>
								<Text fontSize="xl" color={mutedColor} maxW="lg" fontWeight="light">
									Describe tus datos y deja que la IA los visualice.
								</Text>
							</VStack>

							<Box w="full" maxW="2xl" position="relative">
								<Input
									placeholder="Ej. Ventas mensuales de 2024..."
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
									size="xl"
									h="72px"
									pl={6}
									pr={16}
									bg={inputBg}
									border="1px solid"
									borderColor={borderColor}
									rounded="2xl"
									fontSize="xl"
									_focus={{ 
										borderColor: inputFocusBorder, 
										outline: 'none',
										shadow: 'sm'
									}}
									_placeholder={{ color: mutedColor }}
								/>
								<IconButton
									aria-label="Generar"
									onClick={handleSubmit}
									position="absolute"
									right={3}
									top={3}
									h="48px"
									w="48px"
									rounded="xl"
									variant="ghost"
									color={textColor}
									_hover={{ bg: borderColor }}
								>
									<IoArrowForward size={24} />
								</IconButton>
							</Box>

							<Wrap justify="center" gap={3}>
								{quickPrompts.map((prompt) => (
									<WrapItem key={prompt}>
										<Button
											size="sm"
											variant="outline"
											onClick={() => setQuery(prompt)}
											borderColor={borderColor}
											color={mutedColor}
											fontWeight="normal"
											rounded="full"
											_hover={{ 
												borderColor: textColor, 
												color: textColor,
												bg: 'transparent'
											}}
										>
											{prompt}
										</Button>
									</WrapItem>
								))}
							</Wrap>
						</VStack>
					)}

					{waitingForClarification && (
						<VStack gap={6} maxW="2xl" mx="auto" w="full">
							<Alert.Root status="info" variant="subtle" rounded="xl">
								<Alert.Indicator />
								<Box>
									<Alert.Title fontWeight="medium">Necesito detalles</Alert.Title>
									<Alert.Description color={mutedColor}>
										{clarificationQuestion}
									</Alert.Description>
								</Box>
							</Alert.Root>
							
							<Flex gap={3} w="full">
								<Input
									placeholder="Tu respuesta..."
									value={clarificationAnswer}
									onChange={(e) => setClarificationAnswer(e.target.value)}
									onKeyPress={(e) => e.key === 'Enter' && handleClarificationSubmit()}
									size="lg"
									bg={inputBg}
									borderColor={borderColor}
									rounded="xl"
								/>
								<Button 
									onClick={handleClarificationSubmit}
									loading={loading}
									size="lg"
									variant="surface"
								>
									Responder
								</Button>
							</Flex>
							<Button variant="plain" size="sm" onClick={handleReset} color={mutedColor}>
								Cancelar
							</Button>
						</VStack>
					)}

					{loading && (
						<VStack gap={6} align="center" py={20}>
							<Spinner size="xl" color={textColor} />
							<Text color={mutedColor} fontSize="lg" fontWeight="light">
								{waitingForClarification ? 'Procesando...' : 'Analizando datos...'}
							</Text>
						</VStack>
					)}

					{error && (
						<Alert.Root status="error" variant="subtle" rounded="xl">
							<Alert.Indicator />
							<Alert.Title>{error}</Alert.Title>
						</Alert.Root>
					)}

					{chartData && !loading && (
						<VStack gap={8} w="full" animation="fade-in 0.5s">
							<Box 
								w="full" 
								p={{ base: 6, md: 10 }} 
								border="1px solid" 
								borderColor={borderColor} 
								rounded="3xl"
								bg="transparent"
							>
								<ChartRenderer chartData={chartData} />
							</Box>
							
							<Button
								variant="ghost"
								onClick={handleReset}
								size="lg"
								color={mutedColor}
								_hover={{ color: textColor, bg: inputBg }}
								rounded="full"
							>
								<IoRefresh style={{ marginRight: '8px' }} />
								Crear otro gráfico
							</Button>
						</VStack>
					)}
				</VStack>
			</Container>
		</Box>
	);
}

