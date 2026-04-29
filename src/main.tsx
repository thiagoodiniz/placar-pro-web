import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import * as Sentry from "@sentry/react"
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from './contexts/AuthContext'
import App from './App.tsx'
import { themeConfig } from './theme/theme.ts'
import './index.css'
import { initAnalytics } from './services/analytics.ts'

// Inicializa o Sentry
Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    enableLogs: true,
    integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: true
});

// Inicializa o PostHog Analytics
initAnalytics();

const APP_VERSION = '2.0.0';
const storedVersion = localStorage.getItem('APP_VERSION');

if (storedVersion !== APP_VERSION) {
    console.log(`Nova versão detectada (${APP_VERSION}). Limpando cache local...`);
    localStorage.clear();

    localStorage.setItem('APP_VERSION', APP_VERSION);
    // Recarrega a página para garantir que o estado inicial (como mock data) seja reinicializado
    window.location.reload();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <Sentry.ErrorBoundary fallback={<div>Ocorreu um erro. Nossa equipe foi notificada.</div>}>
        <AuthProvider>
            <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <ConfigProvider theme={themeConfig} locale={ptBR}>
                    <App />
                </ConfigProvider>
            </GoogleOAuthProvider>
        </AuthProvider>
    </Sentry.ErrorBoundary>,
)
