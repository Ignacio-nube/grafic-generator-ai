import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { FaGoogle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion.create(Box);

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
    // El redirect ocurrirá automáticamente
  };

  const getMessage = () => {
    switch (reason) {
      case 'download':
        return 'Inicia sesión para descargar el PDF de tu gráfico';
      case 'share':
        return 'Inicia sesión para compartir tu gráfico con un link interactivo';
      case 'limit':
        return 'Has alcanzado el límite de gráficos gratis. Inicia sesión para guardar más';
      default:
        return 'Inicia sesión para guardar tus gráficos y acceder desde cualquier dispositivo';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <MotionBox
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.600"
            zIndex={1000}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <MotionBox
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            bg="white"
            _dark={{ bg: 'gray.800' }}
            rounded="2xl"
            shadow="2xl"
            p={8}
            zIndex={1001}
            maxW="400px"
            w="90%"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <VStack gap={6}>
              {/* Logo/Icon */}
              <Box
                w={16}
                h={16}
                rounded="full"
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="2xl">📊</Text>
              </Box>
              
              {/* Title */}
              <VStack gap={2}>
                <Text fontSize="xl" fontWeight="bold" textAlign="center">
                  Bienvenido a Gráficos AI
                </Text>
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  {getMessage()}
                </Text>
              </VStack>
              
              {/* Benefits */}
              <VStack align="start" gap={2} w="full" px={4}>
                <HStack gap={2}>
                  <Text>✓</Text>
                  <Text fontSize="sm">Guarda hasta 8 gráficos gratis</Text>
                </HStack>
                <HStack gap={2}>
                  <Text>✓</Text>
                  <Text fontSize="sm">Descarga en PDF profesional</Text>
                </HStack>
                <HStack gap={2}>
                  <Text>✓</Text>
                  <Text fontSize="sm">Comparte con un enlace</Text>
                </HStack>
                <HStack gap={2}>
                  <Text>✓</Text>
                  <Text fontSize="sm">Accede desde cualquier dispositivo</Text>
                </HStack>
              </VStack>
              
              {/* Google Login Button */}
              <Button
                w="full"
                size="lg"
                bg="white"
                color="gray.700"
                border="1px solid"
                borderColor="gray.300"
                _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
                _dark={{ 
                  bg: 'gray.700', 
                  color: 'white',
                  borderColor: 'gray.600',
                  _hover: { bg: 'gray.600' }
                }}
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                {loading ? (
                  <Spinner size="sm" />
                ) : (
                  <HStack gap={3}>
                    <Icon as={FaGoogle} color="red.500" />
                    <Text>Continuar con Google</Text>
                  </HStack>
                )}
              </Button>
              
              {/* Skip/Close */}
              <Button
                variant="ghost"
                size="sm"
                color="gray.500"
                onClick={onClose}
              >
                Ahora no
              </Button>
              
              {/* Terms */}
              <Text fontSize="xs" color="gray.400" textAlign="center">
                Al continuar, aceptas nuestros términos de servicio y política de privacidad
              </Text>
            </VStack>
          </MotionBox>
        </>
      )}
    </AnimatePresence>
  );
}
