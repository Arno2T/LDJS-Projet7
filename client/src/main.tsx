import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { installGlobalErrorHandlers, reportError } from './services/logService';
import './index.css';

installGlobalErrorHandlers();

createRoot(document.getElementById('root')!, {
  // React 19: errors thrown while rendering, without a class error boundary
  onUncaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
    reportError(error);
  },
}).render(
  <StrictMode>
    <App />
  </StrictMode>
);
