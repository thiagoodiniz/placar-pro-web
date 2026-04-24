# Placar Pro Web ⚽

Interface moderna e responsiva para gestão e visualização de campeonatos esportivos em tempo real.

## 💎 Diferenciais
- **UI Premium**: Design moderno com Ant Design e animações suaves.
- **Gestão Completa**: Suporte a diversos formatos de torneios (Grupos, Mata-mata, Pontos Corridos).
- **Mata-mata Inteligente**: Gerenciamento de chaves (Oitavas, Quartas, Semi e Final).
- **Performance**: Compressão de imagens em tempo real para Base64.
- **Segurança**: Controle de acesso por perfis (Admin, Manager, User).

## 🚀 Tecnologias
- **React** (v18+)
- **Vite** (Build tool)
- **Ant Design** (UI Library)
- **React Query** (Data Fetching)
- **PostHog** (Product Analytics)
- **Sentry** (Error Monitoring)
- **Google OAuth** (Authentication)

## ⚙️ Configuração

### 1. Variáveis de Ambiente
Crie um arquivo `.env` na raiz:
```env
VITE_API_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID="seu_google_client_id"
VITE_POSTHOG_KEY="sua_chave_posthog"
VITE_POSTHOG_HOST="https://us.i.posthog.com"
VITE_POSTHOG_BLOCK_EMAILS="email1@teste.com,email2@teste.com"
VITE_SENTRY_DSN="sua_sentry_dsn"
```

### 2. Rodando o Projeto
```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📸 Funcionalidades de Destaque
- **Upload Inteligente**: As fotos de times e jogadores são redimensionadas e comprimidas no próprio navegador antes de serem enviadas ao servidor, economizando banda e armazenamento.
- **Modo Somente Leitura**: Visitantes podem acompanhar todos os placares sem necessidade de login, enquanto gestores têm acesso às ferramentas de edição.
- **Analytics Privado**: Suporte a blocklist de e-mails para evitar que logs de desenvolvedores/admins sujem os dados do PostHog.

## 📱 Responsividade
A aplicação foi construída com foco mobile-first, garantindo que a gestão do campeonato possa ser feita diretamente na beira do campo via celular.

---
Placar Pro - Elevando o nível do seu campeonato.
