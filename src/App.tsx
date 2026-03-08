import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import ChampionshipsPage from './pages/ChampionshipsPage';
import ChampionshipDetailPage from './pages/ChampionshipDetailPage';
import TeamsPage from './pages/TeamsPage';

function App() {
    return (
        <BrowserRouter>
            <AppLayout>
                <Routes>
                    <Route path="/championships" element={<ChampionshipsPage />} />
                    <Route path="/championships/:id" element={<ChampionshipDetailPage />} />
                    <Route path="/teams" element={<TeamsPage />} />
                    <Route path="/" element={<Navigate to="/championships" replace />} />
                </Routes>
            </AppLayout>
        </BrowserRouter>
    );
}

export default App;
