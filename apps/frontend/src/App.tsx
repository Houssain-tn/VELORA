import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { ToasterProvider } from './components/ui/Toaster';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { PwaBadge } from './components/PwaBadge';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { TaskTracking } from './pages/TaskTracking';
import { ChronologicalPlanning } from './pages/ChronologicalPlanning';
import { Interventions } from './pages/Interventions';
import { Sites } from './pages/Sites';
import { Contracts } from './pages/Contracts';
import { CalendarView } from './pages/CalendarView';
import { Documents } from './pages/Documents';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Projects } from './pages/Projects';
import { Equipment } from './pages/Equipment';
import { Analytics } from './pages/Analytics';
import { Invoices } from './pages/Invoices';
import { AuditLogs } from './pages/AuditLogs';
import { Notifications } from './pages/Notifications';
import { SquadManagement } from './pages/SquadManagement';
import { ScannerPage } from './pages/ScannerPage';
import { Archive } from './pages/Archive';
import { HelpCenter } from './pages/HelpCenter';
import { Meetings } from './pages/Meetings';
import { PPM } from './pages/PPM';
import { EquipmentDetail } from './pages/EquipmentDetail';
import { LandingPage } from './pages/LandingPage';
import { Purchases } from './pages/Purchases';
import { ModuleHub } from './pages/ModuleHub';
import { MoyensGeneraux } from './pages/MoyensGeneraux';
import { Immobilisations } from './pages/Immobilisations';
import { ParcAutomobile } from './pages/ParcAutomobile';
import { Workflows } from './pages/Workflows';
import { LiveTracking } from './pages/LiveTracking';
import { Clients } from './pages/Clients';

// Client Portal Pages
import { ClientLayout } from './components/layout/ClientLayout';
import { ClientDashboard } from './pages/client/ClientDashboard';
import { ClientInvoices } from './pages/client/ClientInvoices';
import { ClientTickets } from './pages/client/ClientTickets';

import VeloraSplashScreen from './components/layout/VeloraSplashScreen';

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Enforce a minimum splash duration for brand impact (4s)
        const minDuration = new Promise(resolve => setTimeout(resolve, 4000));
        await Promise.all([checkAuth(), minDuration]);
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [checkAuth]);

  if (isInitializing) return <VeloraSplashScreen />;

  return (
    <ErrorBoundary>
      <ToasterProvider>
        <PwaBadge />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/modules" element={<ModuleHub />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/task-tracking" element={<TaskTracking />} />
              <Route path="/chronological-planning" element={<ChronologicalPlanning />} />
              <Route path="/interventions" element={<Interventions />} />
              <Route path="/ppm" element={<PPM />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/sites" element={<Sites />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/equipment/:id" element={<EquipmentDetail />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/squads" element={<SquadManagement />} />
              <Route path="/scanner" element={<ScannerPage />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/users" element={<Users />} />
              <Route path="/settings" element={<Settings />} />
              {/* NEW ERP MODULES */}
              <Route path="/moyens-generaux" element={<MoyensGeneraux />} />
              <Route path="/immobilisations" element={<Immobilisations />} />
              <Route path="/parc-automobile" element={<ParcAutomobile />} />
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/live-tracking" element={<LiveTracking />} />
            </Route>

            {/* Client Portal Routes */}
            <Route element={<ClientLayout />}>
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/invoices" element={<ClientInvoices />} />
              <Route path="/client/tickets" element={<ClientTickets />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to={isAuthenticated ? '/modules' : '/login'} replace />} />
        </Routes>
      </ToasterProvider>
    </ErrorBoundary>
  );
}

export default App;
