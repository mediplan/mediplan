import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Companies from '@/pages/Companies';
import CompanyDetail from '@/pages/CompanyDetail';
import PatientDetail from '@/pages/PatientDetail';
import VisitEdit from '@/pages/VisitEdit';

import Settings from '@/pages/Settings';
import ArchivioPaziente from '@/pages/ArchivioPaziente';
import Scadenze from '@/pages/Scadenze';
import Fatturazione from '@/pages/Fatturazione';
import SurveillancePlanEditor from '@/pages/SurveillancePlanEditor';
import Statistiche from '@/pages/Statistiche';
import Admin from '@/pages/Admin';
import ClienteDashboard from '@/pages/ClienteDashboard';
import Tickets from '@/pages/Tickets';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/aziende" element={<Companies />} />
        <Route path="/aziende/:id" element={<CompanyDetail />} />
        <Route path="/pazienti/:id" element={<PatientDetail />} />
        <Route path="/visita" element={<VisitEdit />} />
        <Route path="/archivio-paziente/:id" element={<ArchivioPaziente />} />

        <Route path="/scadenze" element={<Scadenze />} />
        <Route path="/fatturazione" element={<Fatturazione />} />
        <Route path="/statistiche" element={<Statistiche />} />
        <Route path="/impostazioni" element={<Settings />} />
        <Route path="/assistenza" element={<Tickets />} />

      </Route>
      <Route path="/piano-sorveglianza" element={<SurveillancePlanEditor />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/portale-azienda" element={<ClienteDashboard />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App