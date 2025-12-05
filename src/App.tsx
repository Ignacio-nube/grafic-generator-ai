import { useState, useCallback, useEffect } from 'react';
import { Box } from '@chakra-ui/react';
import ChartCreator from './componentes/ChartCreator';
import Sidebar from './components/layout/Sidebar';
import type { SavedChart } from './services/chartService';
import { useAuth } from './contexts/AuthContext';
import { migrateAnonymousCharts } from './services/chartService';

function App() {
  const { user, anonymousId } = useAuth();
  const [selectedChart, setSelectedChart] = useState<SavedChart | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [resetKey, setResetKey] = useState(0);

  // Migrar gráficos anónimos cuando el usuario inicie sesión
  useEffect(() => {
    if (user && anonymousId) {
      migrateAnonymousCharts(user.id, anonymousId).then(() => {
        setRefreshTrigger(prev => prev + 1);
      });
    }
  }, [user, anonymousId]);

  const handleSelectChart = useCallback((chart: SavedChart | null) => {
    setSelectedChart(chart);
  }, []);

  const handleNewChart = useCallback(() => {
    setSelectedChart(null);
    setResetKey(prev => prev + 1); // Forzar reset del ChartCreator
  }, []);

  const handleChartSaved = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      {/* Sidebar */}
      <Sidebar 
        onSelectChart={handleSelectChart}
        onNewChart={handleNewChart}
        currentChartId={selectedChart?.id}
        refreshTrigger={refreshTrigger}
      />
      
      {/* Main content */}
      <Box 
        ml={{ base: 0, lg: '280px' }}
        minH="100vh"
        transition="margin-left 0.3s"
      >
        <ChartCreator 
          initialChart={selectedChart}
          onChartSaved={handleChartSaved}
          resetKey={resetKey}
        />
      </Box>
    </Box>
  );
}

export default App
