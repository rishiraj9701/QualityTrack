import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ProjectProvider } from './context/ProjectContext';
import { AppLayout } from './components/layout/AppLayout';

import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { RequestBuilder } from './pages/RequestBuilder';
import { TestSuites } from './pages/TestSuites';
import { TestCases } from './pages/TestCases';
import { TestRuns } from './pages/TestRuns';
import { TestRunDetail } from './pages/TestRunDetail';
import { BugReports } from './pages/BugReports';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ProjectProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="projects" element={<Projects />} />
                <Route path="request-builder" element={<RequestBuilder />} />
                <Route path="test-suites" element={<TestSuites />} />
                <Route path="test-cases" element={<TestCases />} />
                <Route path="test-runs" element={<TestRuns />} />
                <Route path="test-runs/:id" element={<TestRunDetail />} />
                <Route path="bug-reports" element={<BugReports />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ProjectProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
