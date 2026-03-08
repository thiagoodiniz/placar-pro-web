import { mockApi } from './mockApiService';

const api: any = {
    get: async (url: string) => {
        if (url === '/championships') return { data: await mockApi.getChampionships() };
        if (url === '/teams') return { data: await mockApi.getTeams() };
        if (url.includes('/standings')) {
            const id = url.split('/')[2];
            return { data: await mockApi.getStandings(id) };
        }
        if (url.includes('/top-scorers')) {
            const id = url.split('/')[3];
            return { data: await mockApi.getTopScorers(id) };
        }
        if (url.includes('/matches')) {
            const id = url.split('/')[2];
            return { data: await mockApi.getMatches(id) };
        }
        return { data: [] };
    },
    post: async (url: string, body: any) => {
        if (url === '/championships') return { data: await mockApi.createChampionship(body) };
        if (url === '/teams') return { data: await mockApi.createTeam(body) };
        if (url === '/teams/championship') {
            return { data: await mockApi.addTeamsToChampionship(body.championshipId, body.teamIds) };
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
        return { data: {} };
    }
};

export default api;
