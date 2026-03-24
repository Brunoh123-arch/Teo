import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Initialize Capacitor native features
if (Capacitor.isNativePlatform()) {
  // Make status bar transparent/light
  StatusBar.setStyle({ style: Style.Light }).catch(console.error);
  // Hide splash screen when app is ready
  SplashScreen.hide().catch(console.error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
