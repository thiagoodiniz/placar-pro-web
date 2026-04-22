import { mockApi } from './mockApiService';

const api: any = {
    get: async (url: string) => {
        if (url === '/championships') return { data: await mockApi.getChampionships() };
        if (url.match(/^\/championships\/[^\/]+$/) && !url.includes('/standings') && !url.includes('/scorers') && !url.includes('/top-scorers')) {
            const id = url.split('/')[2];
            const all = await mockApi.getChampionships();
            return { data: all.find((c: any) => c.id === id) || null };
        }
        if (url === '/teams') return { data: await mockApi.getTeams() };
        if (url.includes('/standings')) {
            const id = url.split('/')[2];
            return { data: await mockApi.getStandings(id) };
        }
        if (url.includes('/scorers') || url.includes('/top-scorers')) {
            const id = url.split('/')[2];
            return { data: await mockApi.getTopScorers(id) };
        }
        if (url.includes('/matches')) {
            // Handle both /matches?championshipId=xxx and /championships/:id/matches
            let id: string | undefined;
            if (url.includes('championshipId=')) {
                id = new URLSearchParams(url.split('?')[1]).get('championshipId') ?? undefined;
            } else {
                id = url.split('/')[2];
            }
            return { data: await mockApi.getMatches(id) };
        }
        if (url.includes('/teams/')) {
            const id = url.split('/')[2];
            const all = await mockApi.getTeams();
            return { data: all.find((t: any) => t.id === id) || null };
        }
        return { data: [] };
    },
    post: async (url: string, body: any) => {
        if (url === '/championships') return { data: await mockApi.createChampionship(body) };
        if (url === '/teams') return { data: await mockApi.createTeam(body) };
        if (url === '/teams/championship') {
            return { data: await mockApi.addTeamsToChampionship(body.championshipId, body.teamIds) };
        }
        // Add player to team: POST /teams/:id/players
        if (url.includes('/teams/') && url.endsWith('/players')) {
            const teamId = url.split('/')[2];
            return { data: await mockApi.addPlayerToTeam(teamId, body) };
        }
        // Create manual match
        if (url === '/championships/match') {
            return { data: await mockApi.createMatch(body) };
        }
        if (url.includes('/start')) {
            const id = url.split('/')[2];
            return { data: await mockApi.startChampionship(id, body.mode) };
        }
        if (url.includes('/finalize')) {
            const id = url.split('/')[2];
            return { data: await mockApi.finalizeStart(id) };
        }
        if (url.includes('/finish')) {
            const id = url.split('/')[2];
            return { data: await mockApi.finishChampionship(id) };
        }
        // Groups reset must come BEFORE generic /reset to avoid wrong handler
        if (url.includes('/groups/reset')) {
            const id = url.split('/')[2];
            return { data: await mockApi.resetGroups(id) };
        }
        if (url.includes('/reset')) {
            const id = url.split('/')[2];
            return { data: await mockApi.resetMatches(id) };
        }
        if (url.includes('/auto-results')) {
            const id = url.split('/')[2];
            return { data: await mockApi.fillRandomResults(id) };
        }
        if (url.includes('/next-phase')) {
            const id = url.split('/')[2];
            return { data: await mockApi.generateNextPhaseMatches(id) };
        }
        if (url.includes('/groups') && url.includes('/generate-matches')) {
            const groupId = url.split('/')[3];
            return { data: await mockApi.generateMatchesForGroup(groupId) };
        }
        if (url.includes('/groups')) {
            const id = url.split('/')[2];
            return { data: await mockApi.createGroup(id, body.name, body.teamIds) };
        }
        return { data: {} };
    },
    patch: async (url: string, body: any) => {
        if (url.includes('/championships/groups')) {
            const groupId = url.split('/')[3];
            return { data: await mockApi.updateGroup(groupId, body) };
        }
        if (url.includes('/championships/')) {
            const id = url.split('/')[2];
            return { data: await mockApi.updateChampionship(id, body) };
        }
        if (url.includes('/matches/')) {
            const id = url.split('/')[2];
            return { data: await mockApi.updateMatch(id, body) };
        }
        if (url.includes('/teams/') && url.includes('/players/')) {
            const [,, teamId,, playerId] = url.split('/');
            return { data: await mockApi.updatePlayerInTeam(teamId, playerId, body) };
        }
        if (url.includes('/teams/')) {
            const id = url.split('/')[2];
            return { data: await mockApi.updateTeam(id, body) };
        }
        return { data: {} };
    },
    delete: async (url: string) => {
        if (url.includes('/teams/') && url.includes('/players/')) {
            const [,, teamId,, playerId] = url.split('/');
            return { data: await mockApi.removePlayerFromTeam(teamId, playerId) };
        }
        if (url.includes('/championships/')) {
            const id = url.split('/')[2];
            return { data: await mockApi.deleteChampionship(id) };
        }
        if (url.includes('/teams/')) {
            const id = url.split('/')[2];
            return { data: await mockApi.deleteTeam(id) };
        }
        return { data: {} };
    }
};

export default api;
