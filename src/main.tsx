import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import App from './App.tsx'
import { themeConfig } from './theme/theme.ts'
import './index.css'
import { initAnalytics } from './services/analytics.ts'

// Inicializa o PostHog Analytics
initAnalytics();

const APP_VERSION = '1.0.0';
const storedVersion = localStorage.getItem('APP_VERSION');

if (storedVersion !== APP_VERSION) {
    console.log(`Nova versão detectada (${APP_VERSION}). Limpando cache local...`);
    localStorage.clear();

    localStorage.setItem('APP_VERSION', APP_VERSION);
    // Recarrega a página para garantir que o estado inicial (como mock data) seja reinicializado
    window.location.reload();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <ConfigProvider theme={themeConfig} locale={ptBR}>
        <App />
    </ConfigProvider>,
)
