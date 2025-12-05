import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, CHART_LIMITS } from '../../contexts/AuthContext';
import { getUserCharts, deleteChart, canCreateChart } from '../../services/chartService';
import type { SavedChart } from '../../services/chartService';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  IconButton,
  Button,
  Spinner,
} from '@chakra-ui/react';
import { useColorModeValue, ColorModeButton } from '../ui/color-mode';
import { LanguageToggleButton } from '../ui/language-toggle';
import { 
  FaPlus, 
  FaChartBar, 
  FaChartLine, 
  FaChartPie, 
  FaChartArea,
  FaTrash,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaCrown
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import LoginModal from '../auth/LoginModal';

const MotionBox = motion.create(Box);

interface SidebarProps {
  onSelectChart: (chart: SavedChart | null) => void;
  onNewChart: () => void;
  currentChartId?: string;
  refreshTrigger?: number;
}

export default function Sidebar({ onSelectChart, onNewChart, currentChartId, refreshTrigger }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const { user, signOut, anonymousId, loading: authLoading } = useAuth();
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [chartLimit, setChartLimit] = useState({ current: 0, limit: CHART_LIMITS.anonymous });
  
  const sidebarBg = useColorModeValue('gray.50', 'gray.900');
  const hoverBg = useColorModeValue('gray.100', 'gray.800');
  const activeBg = useColorModeValue('brand.100', 'brand.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('dark.800', 'dark.50');
  const mutedColor = useColorModeValue('dark.400', 'dark.300');

  const loadCharts = useCallback(async () => {
    setLoading(true);
    const userCharts = await getUserCharts(user?.id, anonymousId);
    setCharts(userCharts);
    
    const limitInfo = await canCreateChart(user?.id, anonymousId);
    setChartLimit({ current: limitInfo.current, limit: limitInfo.limit });
    
    setLoading(false);
  }, [user?.id, anonymousId]);

  useEffect(() => {
    if (!authLoading) {
      loadCharts();
    }
  }, [authLoading, loadCharts, refreshTrigger]);

  const handleDeleteChart = async (chartId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('sidebar.deleteConfirm'))) {
      await deleteChart(chartId);
      await loadCharts();
      if (currentChartId === chartId) {
        onNewChart();
      }
    }
  };

  const getChartIcon = (type: string) => {
    switch(type) {
      case 'bar': return FaChartBar;
      case 'line': return FaChartLine;
      case 'pie': return FaChartPie;
      case 'area': return FaChartArea;
      default: return FaChartBar;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.now');
    if (diffMins < 60) return t('time.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('time.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays });
    const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  };

  // Mobile toggle button
  const ToggleButton = () => (
    <IconButton
      aria-label={t('sidebar.toggleAriaLabel')}
      position="fixed"
      top={4}
      left={4}
      zIndex={100}
      size="sm"
      variant="solid"
      colorPalette="gray"
      onClick={() => setIsOpen(!isOpen)}
      display={{ base: 'flex', lg: 'none' }}
    >
      <Icon as={isOpen ? FaTimes : FaBars} />
    </IconButton>
  );

  const SidebarContent = () => (
    <VStack h="full" align="stretch" gap={0}>
      {/* Header */}
      <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
        <Button
          w="full"
          size="md"
          variant="outline"
          colorPalette="gray"
          onClick={() => {
            onNewChart();
            setIsOpen(false);
          }}
          borderStyle="dashed"
        >
          <Icon as={FaPlus} mr={2} />
          {t('sidebar.newChart')}
        </Button>
      </Box>
      
      {/* Chart limit indicator */}
      <Box px={4} py={2} borderBottom="1px solid" borderColor={borderColor}>
        <HStack justify="space-between">
          <Text fontSize="xs" color={mutedColor}>
            {t('sidebar.chartCount', { current: chartLimit.current, limit: chartLimit.limit === Infinity ? '∞' : chartLimit.limit })}
          </Text>
          {!user && (
            <Button 
              size="xs" 
              variant="ghost" 
              color="accent.500"
              _hover={{ bg: 'accent.50', _dark: { bg: 'accent.900' } }}
              onClick={() => setShowLoginModal(true)}
            >
              <Icon as={FaCrown} mr={1} />
              {t('sidebar.more')}
            </Button>
          )}
        </HStack>
        {/* Progress bar */}
        <Box 
          mt={1} 
          h="2px" 
          bg="gray.200" 
          _dark={{ bg: 'gray.700' }}
          rounded="full"
          overflow="hidden"
        >
          <Box 
            h="full" 
            bg={chartLimit.current >= chartLimit.limit ? 'red.500' : 'brand.500'}
            w={`${Math.min((chartLimit.current / chartLimit.limit) * 100, 100)}%`}
            transition="width 0.3s"
          />
        </Box>
      </Box>

      {/* Charts list */}
      <Box flex={1} overflowY="auto" p={2}>
        {loading ? (
          <VStack py={8}>
            <Spinner size="sm" />
            <Text fontSize="sm" color={mutedColor}>{t('sidebar.loading')}</Text>
          </VStack>
        ) : charts.length === 0 ? (
          <VStack py={8} gap={2}>
            <Text fontSize="sm" color={mutedColor} textAlign="center">
              {t('sidebar.noCharts')}
            </Text>
            <Text fontSize="xs" color={mutedColor} textAlign="center">
              {t('sidebar.createPrompt')}
            </Text>
          </VStack>
        ) : (
          <VStack gap={1} align="stretch">
            {charts.map((chart) => (
              <HStack
                key={chart.id}
                p={3}
                rounded="lg"
                cursor="pointer"
                bg={currentChartId === chart.id ? activeBg : 'transparent'}
                _hover={{ bg: currentChartId === chart.id ? activeBg : hoverBg }}
                onClick={() => {
                  onSelectChart(chart);
                  setIsOpen(false);
                }}
                justify="space-between"
                role="group"
              >
                <HStack gap={3} flex={1} minW={0}>
                  <Icon 
                    as={getChartIcon(chart.chartType)} 
                    color={currentChartId === chart.id ? 'brand.500' : mutedColor}
                    flexShrink={0}
                  />
                  <VStack align="start" gap={0} flex={1} minW={0}>
                    <Text 
                      fontSize="sm" 
                      fontWeight={currentChartId === chart.id ? 'medium' : 'normal'}
                      color={textColor}
                      lineClamp={1}
                    >
                      {chart.title}
                    </Text>
                    <Text fontSize="xs" color={mutedColor}>
                      {formatDate(chart.createdAt)}
                    </Text>
                  </VStack>
                </HStack>
                
                <IconButton
                  aria-label={t('sidebar.delete')}
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  opacity={0}
                  _groupHover={{ opacity: 1 }}
                  onClick={(e) => handleDeleteChart(chart.id, e)}
                >
                  <Icon as={FaTrash} boxSize={3} />
                </IconButton>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>

      {/* Settings section */}
      <Box px={4} py={2} borderTop="1px solid" borderColor={borderColor}>
        <HStack justify="center" gap={1}>
          <ColorModeButton />
          <LanguageToggleButton />
        </HStack>
      </Box>

      {/* User section */}
      <Box p={4} borderTop="1px solid" borderColor={borderColor}>
        {user ? (
          <HStack justify="space-between">
            <HStack gap={3}>
              <Box
                w={8}
                h={8}
                rounded="full"
                bg="brand.500"
                display="flex"
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
              >
                {user.user_metadata?.avatar_url ? (
                  <img 
                    src={user.user_metadata.avatar_url} 
                    alt="Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Text fontSize="sm" color="white" fontWeight="bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </Text>
                )}
              </Box>
              <VStack align="start" gap={0}>
                <Text fontSize="sm" fontWeight="medium" color={textColor} lineClamp={1}>
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </Text>
                <Text fontSize="xs" color={mutedColor}>
                  {t('sidebar.freePlan')}
                </Text>
              </VStack>
            </HStack>
            <IconButton
              aria-label={t('sidebar.signOut')}
              size="sm"
              variant="ghost"
              onClick={signOut}
            >
              <Icon as={FaSignOutAlt} />
            </IconButton>
          </HStack>
        ) : (
          <Button
            w="full"
            size="sm"
            bg="accent.500"
            color="white"
            _hover={{ bg: 'accent.600' }}
            onClick={() => setShowLoginModal(true)}
          >
            {t('sidebar.signIn')}
          </Button>
        )}
      </Box>
    </VStack>
  );

  return (
    <>
      <ToggleButton />
      
      {/* Desktop sidebar */}
      <Box
        display={{ base: 'none', lg: 'block' }}
        w="280px"
        h="100vh"
        bg={sidebarBg}
        borderRight="1px solid"
        borderColor={borderColor}
        position="fixed"
        left={0}
        top={0}
        zIndex={50}
      >
        <SidebarContent />
      </Box>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <MotionBox
              display={{ base: 'block', lg: 'none' }}
              position="fixed"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="blackAlpha.500"
              zIndex={90}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Sidebar */}
            <MotionBox
              display={{ base: 'block', lg: 'none' }}
              position="fixed"
              top={0}
              left={0}
              w="280px"
              h="100vh"
              bg={sidebarBg}
              zIndex={95}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <SidebarContent />
            </MotionBox>
          </>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        reason="limit"
      />
    </>
  );
}
