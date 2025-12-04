import { useAuth } from '../../contexts/AuthContext';
import {
  Button,
  VStack,
  HStack,
  Text,
  Icon,
  Spinner,
  Dialog,
  Portal,
  CloseButton,
  Box,
} from '@chakra-ui/react';
import { FaGoogle, FaCheckCircle, FaChartPie } from 'react-icons/fa';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'save' | 'download' | 'share' | 'limit';
}

export default function LoginModal({ isOpen, onClose, reason = 'save' }: LoginModalProps) {
  const { signInWithGoogle, loading } = useAuth();

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      console.error('Login error:', error);
    }
  };

  const getMessage = () => {
    switch (reason) {
      case 'download':
        return 'Inicia sesión para descargar tu gráfico';
      case 'share':
        return 'Inicia sesión para compartir tu gráfico';
      case 'limit':
        return 'Inicia sesión para continuar creando';
      default:
        return 'Guarda y accede a tus gráficos';
    }
  };

  const benefits = [
    'Guarda en la nube',
    'Exporta en HD',
    'Comparte con un link',
    'Acceso desde cualquier lugar'
  ];

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      placement="center"
      motionPreset="slide-in-bottom"
      size={{ base: 'full', md: 'sm' }}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop 
          bg="blackAlpha.700" 
          _open={{ opacity: 1 }}
          _closed={{ opacity: 0 }}
        />
        <Dialog.Positioner>
          <Dialog.Content
            bg={{ base: 'white', _dark: 'gray.800' }}
            borderRadius={{ base: '0', md: 'xl' }}
            mx={{ base: 0, md: 4 }}
          >
            <Dialog.CloseTrigger asChild>
              <CloseButton 
                size="sm" 
                position="absolute" 
                top="3" 
                right="3"
                color={{ base: 'gray.500', _dark: 'gray.400' }}
                _hover={{ color: { base: 'gray.700', _dark: 'white' } }}
              />
            </Dialog.CloseTrigger>

            <Dialog.Body py={8} px={6}>
              <VStack gap={6}>
                {/* Icon */}
                <Box
                  p={3}
                  borderRadius="xl"
                  bg={{ base: '#b9030f', _dark: '#e63946' }}
                  color="white"
                >
                  <Icon as={FaChartPie} boxSize={6} />
                </Box>

                {/* Title */}
                <VStack gap={1} textAlign="center">
                  <Dialog.Title 
                    fontWeight="bold" 
                    fontSize="xl"
                    color={{ base: 'gray.800', _dark: 'white' }}
                  >
                    Gráficos AI
                  </Dialog.Title>
                  <Dialog.Description 
                    color={{ base: 'gray.600', _dark: 'gray.300' }} 
                    fontSize="sm"
                  >
                    {getMessage()}
                  </Dialog.Description>
                </VStack>

                {/* Benefits */}
                <VStack align="start" gap={2} w="full">
                  {benefits.map((benefit, i) => (
                    <HStack key={i} gap={2}>
                      <Icon as={FaCheckCircle} color="#b9030f" boxSize={4} />
                      <Text 
                        fontSize="sm"
                        color={{ base: 'gray.700', _dark: 'gray.200' }}
                      >
                        {benefit}
                      </Text>
                    </HStack>
                  ))}
                </VStack>

                {/* Google Button */}
                <Button
                  w="full"
                  size="lg"
                  bg={{ base: 'white', _dark: '#b9030f' }}
                  color={{ base: 'gray.700', _dark: 'white' }}
                  border="1px solid"
                  borderColor={{ base: 'gray.300', _dark: 'transparent' }}
                  _hover={{ 
                    bg: { base: 'gray.100', _dark: '#9e0004' },
                    borderColor: { base: 'gray.400', _dark: 'transparent' }
                  }}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  fontWeight="600"
                >
                  {loading ? (
                    <Spinner size="sm" />
                  ) : (
                    <HStack gap={2}>
                      <Icon as={FaGoogle} color={{ base: '#DB4437', _dark: 'white' }} />
                      <Text>Continuar con Google</Text>
                    </HStack>
                  )}
                </Button>

                {/* Skip */}
                <Dialog.ActionTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    color={{ base: 'gray.500', _dark: 'gray.400' }}
                    _hover={{ color: { base: 'gray.700', _dark: 'gray.200' } }}
                  >
                    Ahora no
                  </Button>
                </Dialog.ActionTrigger>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer
              bg={{ base: 'gray.50', _dark: 'gray.900' }}
              py={3}
              borderTop="1px solid"
              borderColor={{ base: 'gray.200', _dark: 'gray.700' }}
            >
              <Text 
                fontSize="xs" 
                color={{ base: 'gray.500', _dark: 'gray.500' }} 
                textAlign="center" 
                w="full"
              >
                Al continuar, aceptas nuestros Términos de Servicio
              </Text>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
