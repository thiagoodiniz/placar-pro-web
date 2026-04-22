import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import ChampionshipsPage from './pages/Championships';
import ChampionshipDetailPage from './pages/ChampionshipDetail';
import TeamsPage from './pages/Teams';
import TeamDetailPage from './pages/TeamDetail';

function App() {
    return (
        <BrowserRouter>
            <AppLayout>
                <Routes>
                    <Route path="/championships" element={<ChampionshipsPage />} />
                    <Route path="/championships/:id" element={<ChampionshipDetailPage />} />
                    <Route path="/teams" element={<TeamsPage />} />
                    <Route path="/teams/:id" element={<TeamDetailPage />} />
                    <Route path="/teams/new" element={<TeamDetailPage />} />
                    <Route path="/" element={<Navigate to="/championships" replace />} />
                </Routes>
            </AppLayout>
        </BrowserRouter>
    );
}

export default App;
