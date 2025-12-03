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
import { ColorModeButton, useColorModeValue } from '@/components/ui/color-mode';
import { processQueryWithAI, type ChartData } from '../services/openaiService';
import ChartRenderer from './ChartRenderer';

interface Message {
	id: string;
	type: 'user' | 'assistant' | 'clarification';
	content: string;
	chartData?: ChartData;
	timestamp: Date;
}

export default function ChartCreator() {
	const [query, setQuery] = useState('');
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [waitingForClarification, setWaitingForClarification] = useState(false);
	const [originalQuery, setOriginalQuery] = useState('');
	const messagesEndRef = useRef<HTMLDivElement>(null);

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
	const userMsgBg = useColorModeValue('blue.500', 'blue.600');
	const assistantMsgBg = useColorModeValue('white', 'gray.800');
	const headerBg = useColorModeValue('white', 'gray.900');

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
	};

	const handleSubmit = async () => {
		if (!query.trim()) return;

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

	const showWelcome = messages.length === 0;

	return (
		<Box bg={bg} minH="100vh" display="flex" flexDirection="column">
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
					<Flex justify="space-between" align="center">
						<HStack gap={3}>
							<Box 
								p={2} 
								bg="blue.500" 
								rounded="xl"
								color="white"
							>
								<IoSparkles size={20} />
							</Box>
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
			</Box>

			{/* Chat Area */}
			<Box flex="1" overflowY="auto" pb={32}>
				<Container maxW="4xl" py={6}>
					{/* Welcome Screen */}
					{showWelcome && (
						<VStack gap={8} py={16} textAlign="center">
							<VStack gap={3}>
								<Box 
									p={4} 
									bg="blue.500" 
									rounded="2xl"
									color="white"
									mb={2}
								>
									<IoSparkles size={40} />
								</Box>
								<Text fontSize="3xl" fontWeight="light" color={textColor} letterSpacing="-0.02em">
									¿Qué gráfico quieres crear?
								</Text>
								<Text fontSize="lg" color={mutedColor} maxW="md">
									Describe tus datos en lenguaje natural y la IA generará el gráfico perfecto.
								</Text>
							</VStack>

							{/* Quick Prompts */}
							<Flex wrap="wrap" gap={2} justify="center" maxW="2xl">
								{quickPrompts.map((prompt) => (
									<Button
										key={prompt}
										size="sm"
										variant="outline"
										onClick={() => handleQuickPrompt(prompt)}
										borderColor={borderColor}
										color={mutedColor}
										fontWeight="normal"
										rounded="full"
										_hover={{ 
											borderColor: 'blue.400', 
											color: 'blue.500',
											bg: 'transparent'
										}}
									>
										{prompt}
									</Button>
								))}
							</Flex>
						</VStack>
					)}

					{/* Messages */}
					<VStack gap={6} align="stretch">
						{messages.map((message) => (
							<Box key={message.id}>
								{message.type === 'user' ? (
									// User Message
									<Flex justify="flex-end" mb={2}>
										<HStack gap={3} maxW="80%" align="start">
											<Box 
												bg={userMsgBg} 
												color="white" 
												px={4} 
												py={3} 
												rounded="2xl"
												roundedBottomRight="md"
											>
												<Text>{message.content}</Text>
											</Box>
											<Avatar.Root size="sm" colorPalette="blue">
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
											<Alert.Root status="info" variant="subtle" rounded="2xl" roundedTopLeft="md">
												<Alert.Indicator />
												<Box>
													<Alert.Title fontWeight="medium">Necesito más detalles</Alert.Title>
													<Alert.Description color={mutedColor}>
														{message.content}
													</Alert.Description>
												</Box>
											</Alert.Root>
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
											<Box 
												bg={assistantMsgBg}
												border="1px solid"
												borderColor={borderColor}
												rounded="2xl"
												roundedTopLeft="md"
												p={4}
												flex="1"
												shadow="sm"
											>
												{message.chartData && (
													<ChartRenderer chartData={message.chartData} />
												)}
											</Box>
										</HStack>
									</Flex>
								)}
							</Box>
						))}

						{/* Loading Indicator */}
						{loading && (
							<Flex justify="flex-start">
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
											<Spinner size="sm" color="blue.500" />
											<Text color={mutedColor}>Generando gráfico...</Text>
										</HStack>
									</Box>
								</HStack>
							</Flex>
						)}

						{/* Error Message */}
						{error && (
							<Alert.Root status="error" variant="subtle" rounded="xl">
								<Alert.Indicator />
								<Alert.Title>{error}</Alert.Title>
							</Alert.Root>
						)}

						<div ref={messagesEndRef} />
					</VStack>
				</Container>
			</Box>

			{/* Input Area - Fixed at bottom */}
			<Box 
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
									borderColor: 'blue.400', 
									outline: 'none',
									shadow: 'sm'
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
								colorPalette="blue"
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
			</Box>
		</Box>
	);
}

