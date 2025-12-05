import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
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
import { useColorModeValue } from '../ui/color-mode';
import { FaGoogle, FaCheckCircle, FaChartPie } from 'react-icons/fa';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'save' | 'download' | 'share' | 'limit';
}

export default function LoginModal({ isOpen, onClose, reason = 'save' }: LoginModalProps) {
  const { t } = useTranslation();
  const { signInWithGoogle, loading } = useAuth();
  
  // Colores para modo claro/oscuro
  const bgColor = useColorModeValue('white', 'gray.800');
  const titleColor = useColorModeValue('gray.800', 'white');
  const descColor = useColorModeValue('gray.600', 'gray.300');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const footerBg = useColorModeValue('gray.50', 'gray.900');
  const buttonBorderColor = useColorModeValue('gray.300', 'gray.600');
  const buttonHoverBg = useColorModeValue('gray.100', 'gray.700');

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      console.error('Login error:', error);
    }
  };

  const getMessage = () => {
    switch (reason) {
      case 'download':
        return t('login.reasonDownload');
      case 'share':
        return t('login.reasonShare');
      case 'limit':
        return t('login.reasonLimit');
      default:
        return t('login.reasonDefault');
    }
  };

  const benefits = [
    t('login.benefit1'),
    t('login.benefit2'),
    t('login.benefit3'),
    t('login.benefit4')
  ];

  // No renderizar nada si no está abierto
  if (!isOpen) return null;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      placement="center"
      motionPreset="slide-in-bottom"
      size={{ base: 'full', md: 'sm' }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bg={bgColor}
            borderRadius={{ base: '0', md: 'xl' }}
            mx={{ base: 0, md: 4 }}
          >
            <Dialog.CloseTrigger asChild>
              <CloseButton 
                size="sm" 
                position="absolute" 
                top="3" 
                right="3"
                color={mutedColor}
              />
            </Dialog.CloseTrigger>

            <Dialog.Body py={8} px={6}>
              <VStack gap={6}>
                {/* Icon */}
                <Box
                  p={3}
                  borderRadius="xl"
                  bg="#b9030f"
                  color="white"
                >
                  <Icon as={FaChartPie} boxSize={6} />
                </Box>

                {/* Title */}
                <VStack gap={1} textAlign="center">
                  <Dialog.Title 
                    fontWeight="bold" 
                    fontSize="xl"
                    color={titleColor}
                  >
                    {t('app.title')}
                  </Dialog.Title>
                  <Dialog.Description 
                    fontSize="sm"
                    color={descColor}
                  >
                    {getMessage()}
                  </Dialog.Description>
                </VStack>

                {/* Benefits */}
                <VStack align="start" gap={2} w="full">
                  {benefits.map((benefit, i) => (
                    <HStack key={i} gap={2}>
                      <Icon as={FaCheckCircle} color="#b9030f" boxSize={4} />
                      <Text fontSize="sm" color={textColor}>
                        {benefit}
                      </Text>
                    </HStack>
                  ))}
                </VStack>

                {/* Google Button */}
                <Button
                  w="full"
                  size="lg"
                  variant="outline"
                  borderColor={buttonBorderColor}
                  color={textColor}
                  _hover={{ bg: buttonHoverBg }}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  fontWeight="600"
                >
                  {loading ? (
                    <Spinner size="sm" />
                  ) : (
                    <HStack gap={2}>
                      <Icon as={FaGoogle} color="#DB4437" />
                      <Text>{t('login.continueWithGoogle')}</Text>
                    </HStack>
                  )}
                </Button>

                {/* Skip */}
                <Dialog.ActionTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    color={mutedColor}
                    _hover={{ color: textColor }}
                  >
                    {t('login.notNow')}
                  </Button>
                </Dialog.ActionTrigger>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer
              bg={footerBg}
              py={3}
              borderTop="1px solid"
              borderColor={borderColor}
            >
              <Text 
                fontSize="xs" 
                color={mutedColor}
                textAlign="center" 
                w="full"
              >
                {t('login.termsNotice')}
              </Text>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
