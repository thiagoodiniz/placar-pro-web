# Placar Pro Web ⚽

Modern and responsive frontend interface for the Placar Pro ecosystem. Built with React, Vite, and Ant Design.

## Features

- **Tournament Dashboard**: Real-time visualization of standings, matches, and top scorers.
- **Advanced Management**: Intuitive tools for creating groups, shuffling teams, and managing knockout phases.
- **Smart Image Upload**: Integrated Base64 compression for team logos and player photos to optimize storage and performance.
- **Role-Based UI**: Dynamic interface that adapts based on user permissions (Admin, Manager, User).
- **Social Login**: Seamless authentication with Google OAuth.
- **Analytics**: Product insights powered by PostHog with custom email blocklists for development.
- **Mobile First**: Fully responsive design optimized for use at the sports field.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: Ant Design (v5)
- **State & Data**: React Query & Axios
- **Analytics**: PostHog
- **Monitoring**: Sentry
- **Icons**: Ant Design Icons & Lucide

## Getting Started

### Prerequisites

- Node.js (v18+)
- Backend API running (Placar Pro API)
- npm or yarn

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file and fill in the required values (VITE_API_URL, GOOGLE_CLIENT_ID, etc.).

### Running the App

- **Development**:
  ```bash
  npm run dev
  ```
- **Production Build**:
  ```bash
  npm run build
  npm run preview
  ```

## Project Highlights

### 📸 Base64 Image Compression
The application automatically resizes and compresses images in the browser before sending them to the API, ensuring a fast and lightweight data flow.

### 🛡️ RBAC Implementation
UI elements like "Edit", "Delete", and "Manage" buttons are conditionally rendered based on the user's role fetched from the secure AuthContext.

---
Placar Pro - Precision in every score.
