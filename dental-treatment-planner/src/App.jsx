import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Patients from './pages/Patients';
import TreatmentPlans from './pages/TreatmentPlans';
import TreatmentPlanGantt from './pages/TreatmentPlanGantt';
import QuoteEditor from './pages/QuoteEditor';
import TestRelativeGantt from './pages/TestRelativeGantt';
import TestTreatmentRoadmap from './pages/TestTreatmentRoadmap';
import TestDragDrop from './pages/TestDragDrop';
import TestGanttView from './pages/TestGanttView';
import TestDependencyView from './pages/TestDependencyView';
import TestDependencyPhase2 from './pages/TestDependencyPhase2';
import TestDragDropDependencies from './pages/TestDragDropDependencies';
import TestDependencyPersistence from './pages/TestDependencyPersistence';
import TestDentalTaskDialog from './pages/TestDentalTaskDialog';
import { TreatmentPlanProvider } from './contexts/TreatmentPlanContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <AuthProvider>
      <TreatmentPlanProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="patients" element={<Patients />} />
              <Route path="calendar" element={<Navigate to="/patients" replace />} /> {/* Redirection temporaire */}
              <Route path="treatment-plans/:patientId" element={<TreatmentPlans />} />
              <Route path="treatment-plan-gantt/:patientId" element={<TreatmentPlanGantt />} />
              <Route path="quote-editor/new" element={<QuoteEditor />} /> {/* Route spécifique pour nouveau devis */}
              <Route path="quote-editor/:quoteId" element={<QuoteEditor />} />
              <Route path="settings" element={<Settings />} />
              <Route path="test-gantt" element={<TestRelativeGantt />} />
              <Route path="test-roadmap" element={<TestTreatmentRoadmap />} />
              <Route path="test-drag-drop" element={<TestDragDrop />} />
              <Route path="test-gantt-view" element={<TestGanttView />} />
              <Route path="test-dependency-view" element={<TestDependencyView />} />
              <Route path="test-drag-drop-dependencies" element={<TestDragDropDependencies />} />
              <Route path="test-dependency-persistence" element={<TestDependencyPersistence />} />
              <Route path="test-dental-task-dialog" element={<TestDentalTaskDialog />} />
              {/* Other routes will be added here */}
            </Route>
          </Routes>
          <Toaster />
        </Router>
      </TreatmentPlanProvider>
    </AuthProvider>
  );
}

export default App;
