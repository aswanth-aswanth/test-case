import React from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import { AppProvider } from './context/AppContext';
import TestCaseGeneratorPage from './pages/TestCaseGeneratorPage';

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <TestCaseGeneratorPage />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
