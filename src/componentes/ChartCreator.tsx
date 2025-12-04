import { useState, useRef, useEffect } from 'react';
import {
	Box,
	Button,
	Input,
	Text,
	Spinner,
	Container,
	IconButton,
	Flex,
	VStack,
	HStack,
	Avatar,
} from '@chakra-ui/react';
import { Alert } from '@chakra-ui/react/alert';
import { IoSend, IoSparkles } from 'react-icons/io5';
import { FaUser, FaRobot } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { ColorModeButton, useColorModeValue } from '@/components/ui/color-mode';
import { processQueryWithAI, type ChartData } from '../services/openaiService';
import { saveChart, canCreateChart } from '../services/chartService';
import type { SavedChart } from '../services/chartService';
import { useAuth } from '../contexts/AuthContext';
import ChartRenderer from './ChartRenderer';
import LoginModal from '../components/auth/LoginModal';

// Motion components
const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);
const MotionVStack = motion.create(VStack);

interface Message {
	id: string;
	type: 'user' | 'assistant' | 'clarification';
	content: string;
	chartData?: ChartData;
	timestamp: Date;
}

interface ChartCreatorProps {
	initialChart?: SavedChart | null;
	onChartSaved?: () => void;
}

export default function ChartCreator({ initialChart, onChartSaved }: ChartCreatorProps) {
	const { user, anonymousId } = useAuth();
	const [query, setQuery] = useState('');
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [waitingForClarification, setWaitingForClarification] = useState(false);
	const [originalQuery, setOriginalQuery] = useState('');
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [loginReason, setLoginReason] = useState<'save' | 'download' | 'share' | 'limit'>('save');
	const messagesEndRef = useRef<HTMLDivElement>(null);
	
	// Estado para rastrear el gráfico guardado actual
	const [currentSavedChartId, setCurrentSavedChartId] = useState<string | undefined>();
	const [currentShareId, setCurrentShareId] = useState<string | undefined>();

	// Cargar gráfico seleccionado del sidebar
	useEffect(() => {
		if (initialChart) {
			setCurrentSavedChartId(initialChart.id);
			setCurrentShareId(initialChart.shareId);
			setMessages([{
				id: initialChart.id,
				type: 'assistant',
				content: initialChart.title,
				chartData: {
					labels: initialChart.labels,
					values: initialChart.values,
					title: initialChart.title,
					chartType: initialChart.chartType,
					unit: initialChart.unit,
					description: initialChart.description,
					sources: initialChart.sources,
					insights: initialChart.insights,
					trend: initialChart.trend
				},
				timestamp: new Date(initialChart.createdAt)
			}]);
		} else {
			// Resetear cuando no hay gráfico inicial
			setCurrentSavedChartId(undefined);
			setCurrentShareId(undefined);
		}
	}, [initialChart]);

	const quickPrompts = [
		'Top 10 países más poblados',
		'Evolución del Bitcoin 2020-2024',
		'Distribución de lenguajes de programación',
		'Ventas trimestrales 2024'
	];

	// Colores
	const bg = useColorModeValue('gray.50', 'gray.950');
	const textColor = useColorModeValue('gray.900', 'gray.50');
	const mutedColor = useColorModeValue('gray.500', 'gray.400');
	const borderColor = useColorModeValue('gray.200', 'gray.800');
	const inputBg = useColorModeValue('white', 'gray.800');
	const userMsgBg = useColorModeValue('brand.500', 'brand.600');
	const assistantMsgBg = useColorModeValue('white', 'gray.800');
	const headerBg = useColorModeValue('white', 'gray.900');

	// Animation state
	const hasStartedChat = messages.length > 0 || loading;

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages, loading]);

	const addMessage = (type: Message['type'], content: string, chartData?: ChartData) => {
		const newMessage: Message = {
			id: Date.now().toString(),
			type,
			content,
			chartData,
			timestamp: new Date()
		};
		setMessages(prev => [...prev, newMessage]);
		return newMessage;
	};

	// Guardar gráfico automáticamente al crearlo
	const autoSaveChart = async (chartData: ChartData) => {
		// Verificar límites
		const { allowed } = await canCreateChart(user?.id, anonymousId);
		
		if (!allowed) {
			// Mostrar modal de login si no tiene cuenta
			if (!user) {
				setLoginReason('limit');
				setShowLoginModal(true);
			}
			return;
		}

		// Guardar gráfico
		const result = await saveChart(chartData, user?.id, anonymousId);
		if (result.success && result.chart) {
			setCurrentSavedChartId(result.chart.id);
			setCurrentShareId(result.chart.shareId);
			onChartSaved?.();
		}
	};

	// Handler cuando el gráfico se guarda desde ChartRenderer (al compartir)
	const handleChartSavedFromShare = (chartId: string, shareId: string) => {
		setCurrentSavedChartId(chartId);
		setCurrentShareId(shareId);
		onChartSaved?.();
	};

	const handleSubmit = async () => {
		if (!query.trim()) return;

		// Verificar límites antes de crear
		const { allowed, limit } = await canCreateChart(user?.id, anonymousId);
		if (!allowed) {
			if (!user) {
				setLoginReason('limit');
				setShowLoginModal(true);
				setError(`Has alcanzado el límite de ${limit} gráficos gratis. Inicia sesión para guardar más.`);
			} else {
				setError(`Has alcanzado el límite de ${limit} gráficos. Actualiza a Pro para gráficos ilimitados.`);
			}
			return;
		}

		// Resetear IDs del gráfico anterior (es un nuevo gráfico)
		setCurrentSavedChartId(undefined);
		setCurrentShareId(undefined);

		const userQuery = query;
		setQuery('');
		addMessage('user', userQuery);
		setLoading(true);
		setError('');

		try {
			const response = await processQueryWithAI(userQuery);

			if (response.needsClarification && response.clarificationQuestion) {
				addMessage('clarification', response.clarificationQuestion);
				setWaitingForClarification(true);
				setOriginalQuery(userQuery);
			} else if (response.chartData) {
				addMessage('assistant', response.chartData.title, response.chartData);
				// Guardar automáticamente
				await autoSaveChart(response.chartData);
			} else {
				setError('No se pudo procesar la respuesta de la IA');
			}
		} catch (err) {
			console.error('Error:', err);
			setError(
				err instanceof Error
					? err.message
					: 'Error al procesar la consulta'
			);
		} finally {
			setLoading(false);
		}
	};

	const handleClarificationSubmit = async () => {
		if (!query.trim()) return;

		const answer = query;
		setQuery('');
		addMessage('user', answer);
		setLoading(true);
		setError('');
		setWaitingForClarification(false);

		try {
			const response = await processQueryWithAI(originalQuery, answer);

			if (response.chartData) {
				addMessage('assistant', response.chartData.title, response.chartData);
				// Guardar automáticamente
				await autoSaveChart(response.chartData);
			} else {
				setError('No se pudieron obtener datos');
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

	// Handler para requerir login (pasado a ChartRenderer)
	const handleRequireLogin = (reason: 'save' | 'download' | 'share' | 'limit') => {
		setLoginReason(reason);
		setShowLoginModal(true);
	};

	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			if (waitingForClarification) {
				handleClarificationSubmit();
			} else {
				handleSubmit();
			}
		}
	};

	const handleQuickPrompt = (prompt: string) => {
		setQuery(prompt);
	};

	return (
		<Box bg={bg} minH="100vh" display="flex" flexDirection="column">
			{/* Header - only show when chat started */}
			<AnimatePresence>
				{hasStartedChat && (
					<MotionBox 
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
						bg={headerBg} 
						borderBottom="1px solid" 
						borderColor={borderColor}
						position="sticky"
						top={0}
						zIndex={10}
					>
						<Container maxW="4xl" py={3}>
							<Flex justify="space-between" align="center">
								<HStack gap={3}>
									<MotionBox 
										p={2} 
										bg="brand.500" 
										rounded="xl"
										color="white"
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
									>
										<IoSparkles size={20} />
									</MotionBox>
									<VStack align="start" gap={0}>
										<Text fontWeight="semibold" fontSize="lg" color={textColor}>
											Graficos AI
										</Text>
										<Text fontSize="xs" color={mutedColor}>
											Generador de gráficos con IA
										</Text>
									</VStack>
								</HStack>
								<ColorModeButton size="sm" variant="ghost" />
							</Flex>
						</Container>
					</MotionBox>
				)}
			</AnimatePresence>

			{/* Main Content Area */}
			<Box flex="1" display="flex" flexDirection="column" position="relative">
				{/* Centered Welcome Screen */}
				<AnimatePresence mode="wait">
					{!hasStartedChat && (
						<MotionFlex
							initial={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95, y: -50 }}
							transition={{ duration: 0.4, ease: "easeInOut" }}
							flex="1"
							align="center"
							justify="center"
							direction="column"
							px={4}
							minH="100vh"
						>
							<MotionVStack 
								gap={8} 
								textAlign="center" 
								w="full" 
								maxW="2xl"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.1 }}
							>
								{/* Logo and Title */}
								<VStack gap={4}>
										<MotionBox 
											p={4} 
											bg="brand.500" 
											rounded="2xl"
											color="white"
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											transition={{ 
												type: "spring", 
												stiffness: 260, 
												damping: 20,
												delay: 0.2 
											}}
											whileHover={{ scale: 1.1, rotate: 5 }}
										>
										<IoSparkles size={40} />
									</MotionBox>
									<MotionBox
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.4, delay: 0.3 }}
									>
										<Text fontSize="3xl" fontWeight="light" color={textColor} letterSpacing="-0.02em">
											¿Qué gráfico quieres crear?
										</Text>
									</MotionBox>
									<MotionBox
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ duration: 0.4, delay: 0.4 }}
									>
										<Text fontSize="lg" color={mutedColor} maxW="md">
											Describe tus datos en lenguaje natural y la IA generará el gráfico perfecto.
										</Text>
									</MotionBox>
								</VStack>

								{/* Centered Input */}
								<MotionBox 
									w="full"
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.4, delay: 0.5 }}
								>
									<HStack gap={3}>
										<Box position="relative" flex="1">
											<Input
												placeholder="Describe el gráfico que necesitas..."
												value={query}
												onChange={(e) => setQuery(e.target.value)}
												onKeyPress={handleKeyPress}
												size="lg"
												h="56px"
												pl={5}
												pr={14}
												bg={inputBg}
												border="1px solid"
												borderColor={borderColor}
												rounded="xl"
												fontSize="md"
												_focus={{ 
													borderColor: 'brand.400', 
													outline: 'none',
													shadow: '0 0 0 3px rgba(185, 3, 15, 0.2)'
												}}
												_placeholder={{ color: mutedColor }}
												disabled={loading}
											/>
											<IconButton
												aria-label="Enviar"
												onClick={handleSubmit}
												position="absolute"
												right={2}
												top="50%"
												transform="translateY(-50%)"
												h="40px"
												w="40px"
												rounded="lg"
												bg="brand.500"
												color="white"
												_hover={{ bg: 'brand.600' }}
												disabled={loading || !query.trim()}
											>
												<IoSend size={18} />
											</IconButton>
										</Box>
									</HStack>
								</MotionBox>

								{/* Quick Prompts */}
								<MotionBox
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ duration: 0.4, delay: 0.6 }}
								>
									<Flex wrap="wrap" gap={2} justify="center" maxW="2xl">
										{quickPrompts.map((prompt, index) => (
											<MotionBox
												key={prompt}
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
											>
												<Button
													size="sm"
													variant="outline"
													onClick={() => handleQuickPrompt(prompt)}
													borderColor={borderColor}
													color={mutedColor}
													fontWeight="normal"
													rounded="full"
														_hover={{ 
															borderColor: 'brand.500', 
															color: 'brand.500',
															bg: 'brand.50'
														}}
												>
													{prompt}
												</Button>
											</MotionBox>
										))}
									</Flex>
								</MotionBox>

								{/* Theme Toggle in welcome */}
								<MotionBox
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ duration: 0.4, delay: 1 }}
								>
									<ColorModeButton size="sm" variant="ghost" />
								</MotionBox>
							</MotionVStack>
						</MotionFlex>
					)}
				</AnimatePresence>

				{/* Chat Area - only show after chat started */}
				<AnimatePresence>
					{hasStartedChat && (
						<MotionBox 
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.3, delay: 0.2 }}
							flex="1" 
							overflowY="auto" 
							pb={32}
						>
							<Container maxW="4xl" py={6}>
								{/* Messages */}
								<VStack gap={6} align="stretch">
									{messages.map((message, index) => (
										<MotionBox 
											key={message.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ duration: 0.3, delay: index === messages.length - 1 ? 0.1 : 0 }}
										>
											{message.type === 'user' ? (
												// User Message
												<Flex justify="flex-end" mb={2}>
													<HStack gap={3} maxW="80%" align="start">
														<MotionBox 
															bg={userMsgBg} 
															color="white" 
															px={4} 
															py={3} 
															rounded="2xl"
															roundedBottomRight="md"
															initial={{ scale: 0.9 }}
															animate={{ scale: 1 }}
															transition={{ type: "spring", stiffness: 500, damping: 30 }}
														>
															<Text>{message.content}</Text>
														</MotionBox>
															<Avatar.Root size="sm" colorPalette="red">
															<Avatar.Fallback>
																<FaUser size={12} />
															</Avatar.Fallback>
														</Avatar.Root>
													</HStack>
												</Flex>
											) : message.type === 'clarification' ? (
												// Clarification Question
												<Flex justify="flex-start" mb={2}>
													<HStack gap={3} maxW="80%" align="start">
														<Avatar.Root size="sm" colorPalette="purple">
															<Avatar.Fallback>
																<FaRobot size={12} />
															</Avatar.Fallback>
														</Avatar.Root>
														<MotionBox
															initial={{ scale: 0.9 }}
															animate={{ scale: 1 }}
															transition={{ type: "spring", stiffness: 500, damping: 30 }}
														>
															<Alert.Root status="info" variant="subtle" rounded="2xl" roundedTopLeft="md">
																<Alert.Indicator />
																<Box>
																	<Alert.Title fontWeight="medium">Necesito más detalles</Alert.Title>
																	<Alert.Description color={mutedColor}>
																		{message.content}
																	</Alert.Description>
																</Box>
															</Alert.Root>
														</MotionBox>
													</HStack>
												</Flex>
											) : (
												// Assistant Message with Chart
												<Flex justify="flex-start" mb={2}>
													<HStack gap={3} maxW="100%" w="full" align="start">
														<Avatar.Root size="sm" colorPalette="green">
															<Avatar.Fallback>
																<FaRobot size={12} />
															</Avatar.Fallback>
														</Avatar.Root>
														<MotionBox 
															bg={assistantMsgBg}
															border="1px solid"
															borderColor={borderColor}
															rounded="2xl"
															roundedTopLeft="md"
															p={4}
															flex="1"
															shadow="sm"
															initial={{ scale: 0.95, opacity: 0 }}
															animate={{ scale: 1, opacity: 1 }}
															transition={{ duration: 0.4, ease: "easeOut" }}
														>
															{message.chartData && (
																<ChartRenderer 
																	chartData={message.chartData} 
																	onRequireLogin={handleRequireLogin}
																	savedChartId={currentSavedChartId}
																	savedShareId={currentShareId}
																	onChartSaved={handleChartSavedFromShare}
																/>
															)}
														</MotionBox>
													</HStack>
												</Flex>
											)}
										</MotionBox>
									))}

									{/* Loading Indicator */}
									<AnimatePresence>
										{loading && (
											<MotionFlex 
												justify="flex-start"
												initial={{ opacity: 0, y: 10 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0 }}
												transition={{ duration: 0.2 }}
											>
												<HStack gap={3} align="start">
													<Avatar.Root size="sm" colorPalette="green">
														<Avatar.Fallback>
															<FaRobot size={12} />
														</Avatar.Fallback>
													</Avatar.Root>
													<Box 
														bg={assistantMsgBg}
														border="1px solid"
														borderColor={borderColor}
														rounded="2xl"
														roundedTopLeft="md"
														px={6}
														py={4}
													>
														<HStack gap={3}>
																<Spinner size="sm" color="brand.500" />
															<Text color={mutedColor}>Generando gráfico...</Text>
														</HStack>
													</Box>
												</HStack>
											</MotionFlex>
										)}
									</AnimatePresence>

									{/* Error Message */}
									<AnimatePresence>
										{error && (
											<MotionBox
												initial={{ opacity: 0, scale: 0.95 }}
												animate={{ opacity: 1, scale: 1 }}
												exit={{ opacity: 0, scale: 0.95 }}
												transition={{ duration: 0.2 }}
											>
												<Alert.Root status="error" variant="subtle" rounded="xl">
													<Alert.Indicator />
													<Alert.Title>{error}</Alert.Title>
												</Alert.Root>
											</MotionBox>
										)}
									</AnimatePresence>

									<div ref={messagesEndRef} />
								</VStack>
							</Container>
						</MotionBox>
					)}
				</AnimatePresence>
			</Box>

			{/* Input Area - Fixed at bottom, only when chat has started */}
			<AnimatePresence>
				{hasStartedChat && (
					<MotionBox 
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, ease: "easeOut" }}
						position="fixed" 
						bottom={0} 
						left={0} 
						right={0} 
						bg={headerBg}
						borderTop="1px solid"
						borderColor={borderColor}
						py={4}
					>
						<Container maxW="4xl">
							<HStack gap={3}>
								<Box position="relative" flex="1">
									<Input
										placeholder={
											waitingForClarification 
												? "Escribe tu respuesta..." 
												: "Describe el gráfico que necesitas..."
										}
										value={query}
										onChange={(e) => setQuery(e.target.value)}
										onKeyPress={handleKeyPress}
										size="lg"
										h="56px"
										pl={5}
										pr={14}
										bg={inputBg}
										border="1px solid"
										borderColor={borderColor}
										rounded="xl"
										fontSize="md"
										_focus={{ 
											borderColor: 'brand.400', 
											outline: 'none',
											shadow: '0 0 0 3px rgba(185, 3, 15, 0.2)'
										}}
										_placeholder={{ color: mutedColor }}
										disabled={loading}
									/>
									<IconButton
										aria-label="Enviar"
										onClick={waitingForClarification ? handleClarificationSubmit : handleSubmit}
										position="absolute"
										right={2}
										top="50%"
										transform="translateY(-50%)"
										h="40px"
										w="40px"
										rounded="lg"
										bg="brand.500"
										color="white"
										_hover={{ bg: 'brand.600' }}
										disabled={loading || !query.trim()}
									>
										<IoSend size={18} />
									</IconButton>
								</Box>
							</HStack>
							<Text fontSize="xs" color={mutedColor} textAlign="center" mt={2}>
								Los datos generados son aproximaciones. Verifica con fuentes oficiales.
							</Text>
						</Container>
					</MotionBox>
				)}
			</AnimatePresence>

			{/* Login Modal */}
			<LoginModal 
				isOpen={showLoginModal} 
				onClose={() => setShowLoginModal(false)}
				reason={loginReason}
			/>
		</Box>
	);
}

