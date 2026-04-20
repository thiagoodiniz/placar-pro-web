import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import App from './App.tsx'
import { themeConfig } from './theme/theme.ts'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ConfigProvider theme={themeConfig} locale={ptBR}>
            <App />
        </ConfigProvider>
    </React.StrictMode>,
)
