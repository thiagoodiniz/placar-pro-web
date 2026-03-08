import { v4 as uuidv4 } from 'uuid';

export enum ChampionshipStatus {
    DRAFT = 'DRAFT',
    STARTED = 'STARTED',
    FINISHED = 'FINISHED'
}

export enum MatchStatus {
    SCHEDULED = 'SCHEDULED',
    FINISHED = 'FINISHED'
}

interface Team {
    id: string;
    name: string;
    players?: { id: string; name: string }[];
}

interface Championship {
    id: string;
    name: string;
    format: 'KNOCKOUT' | 'GROUPS_KNOCKOUT' | 'LEAGUE';
    teamCount: number;
    groupCount?: number;
    advancingCount?: number;
    roundTrip?: boolean;
    status: ChampionshipStatus;
    matchMode?: 'RANDOM' | 'MANUALLY' | null;
    knockoutMode?: 'RANDOM' | 'RANKED' | null;
    teams: { teamId: string; team: Team }[];
}

interface Group {
    id: string;
    championshipId: string;
    name: string;
    teams: { teamId: string; team: Team }[];
}

interface Match {
    id: string;
    championshipId: string;
    groupId?: string;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number;
    awayScore: number;
    homePenalties?: number;
    awayPenalties?: number;
    status: MatchStatus;
    phase: string;
    round: number;
    location?: string;
    dateTime?: string;
    goals: { playerId: string; teamId: string; playerName: string; teamName: string }[];
}

const STORAGE_KEYS = {
    CHAMPIONSHIPS: 'placarpro_championships',
    TEAMS: 'placarpro_teams',
    GROUPS: 'placarpro_groups',
    MATCHES: 'placarpro_matches'
};

const SEED_DATA = {
    teams: [
        { id: 't1', name: 'Flamengo', players: [{ id: 'p1', name: 'Gabigol' }, { id: 'p2', name: 'Arrascaeta' }] },
        { id: 't2', name: 'Vasco', players: [{ id: 'p3', name: 'Payet' }, { id: 'p4', name: 'Vegetti' }] },
        { id: 't3', name: 'Fluminense', players: [{ id: 'p5', name: 'Cano' }, { id: 'p6', name: 'Ganso' }] },
        { id: 't4', name: 'Botafogo', players: [{ id: 'p7', name: 'Tiquinho' }, { id: 'p8', name: 'Junior Santos' }] },
        { id: 't5', name: 'Palmeiras', players: [{ id: 'p9', name: 'Endrick' }, { id: 'p10', name: 'Veiga' }] },
        { id: 't6', name: 'Santos', players: [{ id: 'p11', name: 'Gil' }, { id: 'p12', name: 'Otero' }] },
        { id: 't7', name: 'Corinthians', players: [{ id: 'p13', name: 'Yuri Alberto' }, { id: 'p14', name: 'Garro' }] },
        { id: 't8', name: 'São Paulo', players: [{ id: 'p15', name: 'Calleri' }, { id: 'p16', name: 'Lucas' }] },
    ],
    championships: [
        {
            id: 'c1',
            name: 'Copa Mock 2024',
            format: 'GROUPS_KNOCKOUT',
            teamCount: 8,
            groupCount: 2,
            advancingCount: 2,
            status: ChampionshipStatus.DRAFT,
            matchMode: null,
            knockoutMode: 'RANDOM',
            teams: []
        }
    ]
};

class MockApiService {
    private getData<T>(key: string, defaultValue: T[] = []): T[] {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    }

    private setData(key: string, data: any) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    resetToSeed() {
        localStorage.clear();
        this.setData(STORAGE_KEYS.TEAMS, SEED_DATA.teams);
        this.setData(STORAGE_KEYS.CHAMPIONSHIPS, SEED_DATA.championships);
        this.setData(STORAGE_KEYS.GROUPS, []);
        this.setData(STORAGE_KEYS.MATCHES, []);
    }

    init() {
        if (!localStorage.getItem(STORAGE_KEYS.CHAMPIONSHIPS)) {
            this.resetToSeed();
        }
    }

    // Championships
    async getChampionships() {
        const championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        const allTeams = this.getData<Team>(STORAGE_KEYS.TEAMS);
        return championships.map(c => ({
            ...c,
            teams: c.teams.map(ct => ({
                ...ct,
                team: allTeams.find(t => t.id === ct.teamId) || { id: ct.teamId, name: 'Unknown' }
            }))
        }));
    }

    async createChampionship(data: any) {
        const championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        const newChamp: Championship = {
            id: uuidv4(),
            status: ChampionshipStatus.DRAFT,
            teams: [],
            matchMode: null,
            ...data
        };
        championships.push(newChamp);
        this.setData(STORAGE_KEYS.CHAMPIONSHIPS, championships);
        return newChamp;
    }

    async updateChampionship(id: string, data: any) {
        const championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        const index = championships.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Championship not found');

        const original = championships[index];
        const updated = { ...original, ...data };

        // Structural change detection
        const structuralFields = ['format', 'teamCount', 'groupCount', 'advancingCount'];
        const isStructuralChange = structuralFields.some(f => data[f] !== undefined && data[f] !== (original as any)[f]);

        if (isStructuralChange) {
            await this.resetMatches(id);
        }

        championships[index] = updated;
        this.setData(STORAGE_KEYS.CHAMPIONSHIPS, championships);
        return updated;
    }

    async resetMatches(championshipId: string) {
        const championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        const cIndex = championships.findIndex(c => c.id === championshipId);
        if (cIndex !== -1) {
            championships[cIndex].status = ChampionshipStatus.DRAFT;
            championships[cIndex].matchMode = null;
            this.setData(STORAGE_KEYS.CHAMPIONSHIPS, championships);
        }

        let matches = this.getData<Match>(STORAGE_KEYS.MATCHES);
        matches = matches.filter(m => m.championshipId !== championshipId);
        this.setData(STORAGE_KEYS.MATCHES, matches);

        let groups = this.getData<Group>(STORAGE_KEYS.GROUPS);
        groups = groups.filter(g => g.championshipId !== championshipId);
        this.setData(STORAGE_KEYS.GROUPS, groups);

        return { message: 'Reset successful' };
    }

    // This is a new internal update method to avoid triggering structural changes for simple status updates
    private async _updateChampionship(id: string, updates: Partial<Championship>) {
        const championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        const index = championships.findIndex(c => c.id === id);
        if (index > -1) {
            championships[index] = { ...championships[index], ...updates };
            this.setData(STORAGE_KEYS.CHAMPIONSHIPS, championships);
            return championships[index];
        }
        throw new Error('Championship not found');
    }

    async finishChampionship(id: string) {
        const championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        const champ = championships.find(c => c.id === id);
        if (!champ) throw new Error('Championship not found');

        let champion: string | undefined;

        if (champ.format === 'LEAGUE') {
            // For league, get teams sorted by points from standings computation
            const teams = this.getData<Team>(STORAGE_KEYS.TEAMS);
            const allMatches = this.getData<Match>(STORAGE_KEYS.MATCHES).filter(m => m.championshipId === id && m.status === 'FINISHED');
            const pointsMap: Record<string, { pts: number; gd: number; name: string }> = {};
            for (const m of allMatches) {
                const hTeam = teams.find(t => t.id === m.homeTeamId);
                const aTeam = teams.find(t => t.id === m.awayTeamId);
                if (!hTeam || !aTeam) continue;
                if (!pointsMap[m.homeTeamId]) pointsMap[m.homeTeamId] = { pts: 0, gd: 0, name: hTeam.name };
                if (!pointsMap[m.awayTeamId]) pointsMap[m.awayTeamId] = { pts: 0, gd: 0, name: aTeam.name };
                const hg = m.homeScore ?? 0; const ag = m.awayScore ?? 0;
                pointsMap[m.homeTeamId].gd += hg - ag;
                pointsMap[m.awayTeamId].gd += ag - hg;
                if (hg > ag) { pointsMap[m.homeTeamId].pts += 3; }
                else if (ag > hg) { pointsMap[m.awayTeamId].pts += 3; }
                else { pointsMap[m.homeTeamId].pts += 1; pointsMap[m.awayTeamId].pts += 1; }
            }
            const sorted = Object.values(pointsMap).sort((a, b) => b.pts - a.pts || b.gd - a.gd);
            if (sorted.length > 0) champion = sorted[0].name;
        } else {
            // For knockout formats, find winner of the FINAL match
            const matches = this.getData<Match>(STORAGE_KEYS.MATCHES).filter(m => m.championshipId === id && m.phase === 'FINAL');
            if (matches.length > 0) {
                const finalMatch = matches[0];
                const teams = this.getData<Team>(STORAGE_KEYS.TEAMS);
                let winnerId: string | undefined;
                if ((finalMatch.homeScore ?? 0) > (finalMatch.awayScore ?? 0)) {
                    winnerId = finalMatch.homeTeamId;
                } else if ((finalMatch.awayScore ?? 0) > (finalMatch.homeScore ?? 0)) {
                    winnerId = finalMatch.awayTeamId;
                } else if (finalMatch.homePenalties !== undefined && finalMatch.awayPenalties !== undefined) {
                    winnerId = finalMatch.homePenalties > finalMatch.awayPenalties ? finalMatch.homeTeamId : finalMatch.awayTeamId;
                } else {
                    winnerId = finalMatch.homeTeamId; // fallback
                }
                const winnerTeam = teams.find(t => t.id === winnerId);
                if (winnerTeam) champion = winnerTeam.name;
            }
        }

        return this._updateChampionship(id, { status: ChampionshipStatus.FINISHED, champion } as any);
    }

    async startChampionship(id: string, mode: 'RANDOM' | 'MANUALLY') {
        const championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        const index = championships.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Championship not found');

        championships[index].matchMode = mode;
        this.setData(STORAGE_KEYS.CHAMPIONSHIPS, championships);

        if (mode === 'RANDOM') {
            await this.generateAutoMatches(id);
        } else if (mode === 'MANUALLY' && championships[index].format === 'GROUPS_KNOCKOUT') {
            const count = championships[index].groupCount || 1;
            for (let i = 0; i < count; i++) {
                await this.createGroup(id, `Grupo ${String.fromCharCode(65 + i)}`, []);
            }
        }
        return { message: 'Started' };
    }

    async finalizeStart(id: string) {
        const championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        const index = championships.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Championship not found');

        championships[index].status = ChampionshipStatus.STARTED;
        this.setData(STORAGE_KEYS.CHAMPIONSHIPS, championships);
        return { message: 'Finalized' };
    }

    // Teams
    async getTeams() {
        return this.getData<Team>(STORAGE_KEYS.TEAMS);
    }

    async createTeam(data: { name: string }) {
        const teams = this.getData<Team>(STORAGE_KEYS.TEAMS);
        const newTeam = { id: uuidv4(), name: data.name };
        teams.push(newTeam);
        this.setData(STORAGE_KEYS.TEAMS, teams);
        return newTeam;
    }

    async addTeamsToChampionship(championshipId: string, teamIds: string[]) {
        const championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        const index = championships.findIndex(c => c.id === championshipId);
        if (index === -1) throw new Error('Championship not found');

        championships[index].teams = teamIds.map(tid => ({ teamId: tid, team: {} as any }));
        this.setData(STORAGE_KEYS.CHAMPIONSHIPS, championships);
        return championships[index];
    }

    // Groups
    async createGroup(championshipId: string, name: string, teamIds: string[]) {
        const groups = this.getData<Group>(STORAGE_KEYS.GROUPS);
        const allTeams = this.getData<Team>(STORAGE_KEYS.TEAMS);
        const newGroup: Group = {
            id: uuidv4(),
            championshipId,
            name,
            teams: teamIds.map(tid => ({
                teamId: tid,
                team: allTeams.find(t => t.id === tid) || { id: tid, name: 'Unknown' }
            }))
        };
        groups.push(newGroup);
        this.setData(STORAGE_KEYS.GROUPS, groups);
        return newGroup;
    }

    async updateGroup(groupId: string, data: { name?: string, teamIds?: string[] }) {
        const groups = this.getData<Group>(STORAGE_KEYS.GROUPS);
        const index = groups.findIndex(g => g.id === groupId);
        if (index === -1) throw new Error('Group not found');

        if (data.name) groups[index].name = data.name;
        if (data.teamIds) {
            const allTeams = this.getData<Team>(STORAGE_KEYS.TEAMS);
            groups[index].teams = data.teamIds.map(tid => ({
                teamId: tid,
                team: allTeams.find(t => t.id === tid) || { id: tid, name: 'Unknown' }
            }));
        }

        this.setData(STORAGE_KEYS.GROUPS, groups);
        return groups[index];
    }

    async resetGroups(championshipId: string) {
        const groups = this.getData<Group>(STORAGE_KEYS.GROUPS);
        groups.forEach(g => {
            if (g.championshipId === championshipId) {
                g.teams = [];
            }
        });
        this.setData(STORAGE_KEYS.GROUPS, groups);

        // Also clear matches if they exist
        let matches = this.getData<Match>(STORAGE_KEYS.MATCHES);
        matches = matches.filter(m => m.championshipId !== championshipId);
        this.setData(STORAGE_KEYS.MATCHES, matches);

        return { message: 'Groups reset' };
    }

    // Matches
    async getMatches(championshipId: string) {
        const matches = this.getData<Match>(STORAGE_KEYS.MATCHES);
        const allTeams = this.getData<Team>(STORAGE_KEYS.TEAMS);
        const allGroups = this.getData<Group>(STORAGE_KEYS.GROUPS);
        return matches.filter(m => m.championshipId === championshipId).map(m => ({
            ...m,
            homeTeam: allTeams.find(t => t.id === m.homeTeamId),
            awayTeam: allTeams.find(t => t.id === m.awayTeamId),
            groupName: allGroups.find(g => g.id === m.groupId)?.name
        }));
    }

    async createMatch(data: any) {
        const matches = this.getData<Match>(STORAGE_KEYS.MATCHES);
        const newMatch: Match = {
            id: uuidv4(),
            homeScore: 0,
            awayScore: 0,
            status: MatchStatus.SCHEDULED,
            goals: [],
            ...data
        };
        matches.push(newMatch);
        this.setData(STORAGE_KEYS.MATCHES, matches);
        return newMatch;
    }

    async updateMatch(matchId: string, data: any) {
        const matches = this.getData<Match>(STORAGE_KEYS.MATCHES);
        const index = matches.findIndex(m => m.id === matchId);
        if (index === -1) throw new Error('Match not found');

        const updated = { ...matches[index], ...data };
        if (data.homeScore !== undefined || data.awayScore !== undefined) {
            updated.status = MatchStatus.FINISHED;
        }

        // Ensure goals are persisted if provided
        if (data.goals) {
            updated.goals = data.goals;
        }

        matches[index] = updated;
        this.setData(STORAGE_KEYS.MATCHES, matches);
        return updated;
    }

    async generateMatchesForGroup(groupId: string) {
        const groups = this.getData<Group>(STORAGE_KEYS.GROUPS);
        const group = groups.find(g => g.id === groupId);
        if (!group) throw new Error('Group not found');

        const teamIds = [...group.teams.map(t => t.teamId)];
        if (teamIds.length < 2) return;

        // Berger Table Algorithm (Round Robin)
        // If odd number of teams, add a dummy/bye team
        if (teamIds.length % 2 !== 0) {
            teamIds.push('BYE');
        }

        const numTeams = teamIds.length;
        const numRounds = numTeams - 1;
        const halfNav = numTeams / 2;
        const matches: any[] = [];

        for (let round = 1; round <= numRounds; round++) {
            for (let i = 0; i < halfNav; i++) {
                const home = teamIds[i];
                const away = teamIds[numTeams - 1 - i];

                if (home !== 'BYE' && away !== 'BYE') {
                    // Alternate home/away to be fair
                    const isEvenRound = round % 2 === 0;
                    matches.push({
                        championshipId: group.championshipId,
                        groupId: group.id,
                        homeTeamId: isEvenRound ? away : home,
                        awayTeamId: isEvenRound ? home : away,
                        phase: 'GROUP',
                        round: round
                    });
                }
            }
            // Rotate teamIds (keep the first one fixed)
            teamIds.splice(1, 0, teamIds.pop()!);
        }

        const currentMatches = this.getData<Match>(STORAGE_KEYS.MATCHES);
        for (const m of matches) {
            const newMatch: Match = {
                id: uuidv4(),
                homeScore: 0,
                awayScore: 0,
                status: MatchStatus.SCHEDULED,
                goals: [],
                ...m
            };
            currentMatches.push(newMatch);
        }
        this.setData(STORAGE_KEYS.MATCHES, currentMatches);
        return { message: 'Matches generated' };
    }

    private async generateAutoMatches(championshipId: string) {
        const championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        const champ = championships.find(c => c.id === championshipId);
        if (!champ || champ.teams.length === 0) return;

        const teamIds = champ.teams.map(t => t.teamId);

        if (champ.format === 'KNOCKOUT') {
            // Simple knockout pair generation
            for (let i = 0; i < teamIds.length; i += 2) {
                if (teamIds[i] && teamIds[i + 1]) {
                    await this.createMatch({
                        championshipId,
                        homeTeamId: teamIds[i],
                        awayTeamId: teamIds[i + 1],
                        phase: 'ROUND_16',
                        round: 1
                    });
                }
            }
        } else if (champ.format === 'GROUPS_KNOCKOUT') {
            // Auto assign teams to groups first
            const groupCount = champ.groupCount || 1;
            const createdGroups: Group[] = [];
            for (let i = 0; i < groupCount; i++) {
                const groupName = `Grupo ${String.fromCharCode(65 + i)}`;
                const g = await this.createGroup(championshipId, groupName, []);
                createdGroups.push(g);
            }

            // Distribute teams
            const allGroups = this.getData<Group>(STORAGE_KEYS.GROUPS); // Re-fetch to ensure latest state
            for (let i = 0; i < teamIds.length; i++) {
                const groupIdx = i % groupCount;
                const targetGroup = allGroups.find(g => g.id === createdGroups[groupIdx].id);
                if (targetGroup) {
                    const tid = teamIds[i];
                    const allTeams = this.getData<Team>(STORAGE_KEYS.TEAMS);
                    targetGroup.teams.push({ teamId: tid, team: allTeams.find(t => t.id === tid)! });
                }
            }
            this.setData(STORAGE_KEYS.GROUPS, allGroups);

            // Generate matches for each group
            for (const g of createdGroups) { // Use createdGroups to ensure we only generate for the new groups
                await this.generateMatchesForGroup(g.id);
            }
        } else if (champ.format === 'LEAGUE') {
            // Generate round-robin matches for all teams
            const numTeams = teamIds.length;
            const hasBye = numTeams % 2 !== 0;
            const workingTeams = hasBye ? [...teamIds, 'BYE'] : [...teamIds];
            const numWorkingTeams = workingTeams.length;
            const numRounds = numWorkingTeams - 1;
            const halfNav = numWorkingTeams / 2;
            const matches: any[] = [];

            for (let round = 1; round <= numRounds; round++) {
                for (let i = 0; i < halfNav; i++) {
                    const home = workingTeams[i];
                    const away = workingTeams[numWorkingTeams - 1 - i];

                    if (home !== 'BYE' && away !== 'BYE') {
                        const isEvenRound = round % 2 === 0;
                        matches.push({
                            championshipId: champ.id,
                            homeTeamId: isEvenRound ? away : home,
                            awayTeamId: isEvenRound ? home : away,
                            phase: 'LEAGUE',
                            round: round,
                            groupId: 'geral'
                        });

                        // If round-trip is enabled, generate the return match immediately but schedule it in the second half
                        if (champ.roundTrip) {
                            matches.push({
                                championshipId: champ.id,
                                homeTeamId: isEvenRound ? home : away, // Reversed from first leg
                                awayTeamId: isEvenRound ? away : home,
                                phase: 'LEAGUE',
                                round: round + numRounds,
                                groupId: 'geral'
                            });
                        }
                    }
                }
                workingTeams.splice(1, 0, workingTeams.pop()!);
            }

            const currentMatches = this.getData<Match>(STORAGE_KEYS.MATCHES);
            for (const m of matches) {
                currentMatches.push({
                    id: Math.random().toString(36).substr(2, 9),
                    homeScore: 0,
                    awayScore: 0,
                    status: MatchStatus.SCHEDULED,
                    goals: [],
                    ...m
                });
            }
            this.setData(STORAGE_KEYS.MATCHES, currentMatches);
        }
    }

    // Standings
    async getStandings(championshipId: string) {
        const groups = this.getData<Group>(STORAGE_KEYS.GROUPS).filter(g => g.championshipId === championshipId);
        const matches = this.getData<Match>(STORAGE_KEYS.MATCHES).filter(m => m.championshipId === championshipId && m.status === MatchStatus.FINISHED);
        const allTeams = this.getData<Team>(STORAGE_KEYS.TEAMS);

        const championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        const champ = championships.find(c => c.id === championshipId);

        if (groups.length === 0) {
            // If No Groups, return based on championship teams if they exist
            if (champ && champ.teams.length > 0) {
                return [{
                    groupId: 'geral',
                    groupName: 'Geral',
                    standings: champ.teams.map(ct => {
                        const team = allTeams.find(t => t.id === ct.teamId)!;
                        return {
                            teamId: team.id,
                            teamName: team.name,
                            played: 0, wins: 0, draws: 0, losses: 0,
                            goalsFor: 0, goalsAgainst: 0, gd: 0, points: 0
                        };
                    })
                }];
            }
            return [];
        }

        return groups.map(group => {
            const groupMatches = matches.filter(m => m.groupId === group.id);
            const standings = group.teams.map(gt => {
                const team = allTeams.find(t => t.id === gt.teamId) || { id: gt.teamId, name: 'Unknown' };
                const tMatches = groupMatches.filter(m => m.homeTeamId === team.id || m.awayTeamId === team.id);

                let stats = {
                    teamId: team.id,
                    teamName: team.name,
                    played: tMatches.length,
                    wins: 0, draws: 0, losses: 0,
                    goalsFor: 0, goalsAgainst: 0, gd: 0, points: 0
                };

                tMatches.forEach(m => {
                    const isHome = m.homeTeamId === team.id;
                    const ownScore = isHome ? m.homeScore : m.awayScore;
                    const opponentScore = isHome ? m.awayScore : m.homeScore;
                    stats.goalsFor += ownScore;
                    stats.goalsAgainst += opponentScore;
                    if (ownScore > opponentScore) { stats.wins++; stats.points += 3; }
                    else if (ownScore === opponentScore) { stats.draws++; stats.points += 1; }
                    else stats.losses++;
                });
                stats.gd = stats.goalsFor - stats.goalsAgainst;
                return stats;
            });

            return {
                groupId: group.id,
                groupName: group.name,
                standings: standings.sort((a, b) => b.points - a.points || b.gd - a.gd || b.goalsFor - a.goalsFor)
            };
        });
    }

    async getTopScorers(championshipId: string) {
        const matches = this.getData<Match>(STORAGE_KEYS.MATCHES).filter(m => m.championshipId === championshipId);
        const scores: any = {};

        matches.forEach(m => {
            m.goals.forEach(g => {
                const key = g.playerId;
                if (!scores[key]) {
                    scores[key] = { player: g.playerName, team: g.teamName, goals: 0 };
                }
                scores[key].goals++;
            });
        });

        return Object.values(scores).sort((a: any, b: any) => b.goals - a.goals);
    }

    async fillRandomResults(championshipId: string) {
        let matches = this.getData<Match>(STORAGE_KEYS.MATCHES);
        const teams = this.getData<Team>(STORAGE_KEYS.TEAMS);

        matches = matches.map(m => {
            if (m.championshipId !== championshipId) return m;

            const homeScore = Math.floor(Math.random() * 6);
            const awayScore = Math.floor(Math.random() * 6);
            const goals: any[] = [];

            const homeTeam = teams.find(t => t.id === m.homeTeamId);
            const awayTeam = teams.find(t => t.id === m.awayTeamId);

            for (let i = 0; i < homeScore; i++) {
                if (homeTeam?.players?.length) {
                    const p = homeTeam.players[Math.floor(Math.random() * homeTeam.players.length)];
                    goals.push({ playerId: p.id, playerName: p.name, teamId: homeTeam.id, teamName: homeTeam.name });
                }
            }

            for (let i = 0; i < awayScore; i++) {
                if (awayTeam?.players?.length) {
                    const p = awayTeam.players[Math.floor(Math.random() * awayTeam.players.length)];
                    goals.push({ playerId: p.id, playerName: p.name, teamId: awayTeam.id, teamName: awayTeam.name });
                }
            }

            return { ...m, homeScore, awayScore, goals, status: MatchStatus.FINISHED };
        });

        this.setData(STORAGE_KEYS.MATCHES, matches);
        return { message: 'Random results generated' };
    }

    async generateNextPhaseMatches(championshipId: string) {
        const champ = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS).find(c => c.id === championshipId);
        if (!champ) throw new Error('Championship not found');

        const matches = this.getData<Match>(STORAGE_KEYS.MATCHES).filter(m => m.championshipId === championshipId);
        const currentPhase = matches.length > 0 ? (matches[matches.length - 1].phase || 'GROUP') : 'GROUP';

        let nextPhase = '';
        let advancingTeams: any[] = [];
        const standings = await this.getStandings(championshipId);

        if (currentPhase === 'GROUP') {
            const advancingCount = champ.advancingCount || 2;

            standings.forEach(group => {
                const groupAdvancing = group.standings.slice(0, advancingCount);
                advancingTeams.push(...groupAdvancing);
            });

            const totalAdvancing = advancingTeams.length;
            if (totalAdvancing === 16) nextPhase = 'ROUND_16';
            else if (totalAdvancing === 8) nextPhase = 'QUARTER';
            else if (totalAdvancing === 4) nextPhase = 'SEMI';
            else if (totalAdvancing === 2) nextPhase = 'FINAL';
            else throw new Error(`Número inválido de classificados: ${totalAdvancing}`);

            if (champ.knockoutMode !== 'RANKED') {
                advancingTeams = advancingTeams.sort(() => Math.random() - 0.5);
            }
        } else {
            const phaseMatches = matches.filter(m => m.phase === currentPhase);
            phaseMatches.forEach(m => {
                if (m.homeScore !== undefined && m.awayScore !== undefined) {
                    if (m.homeScore > m.awayScore) advancingTeams.push({ teamId: m.homeTeamId });
                    else if (m.awayScore > m.homeScore) advancingTeams.push({ teamId: m.awayTeamId });
                    else {
                        if (Math.random() > 0.5) advancingTeams.push({ teamId: m.homeTeamId });
                        else advancingTeams.push({ teamId: m.awayTeamId });
                    }
                }
            });

            const totalAdvancing = advancingTeams.length;
            if (totalAdvancing === 8) nextPhase = 'QUARTER';
            else if (totalAdvancing === 4) nextPhase = 'SEMI';
            else if (totalAdvancing === 2) nextPhase = 'FINAL';
            else throw new Error(`Número inválido de classificados para a próxima fase: ${totalAdvancing}`);
        }

        if (!nextPhase) throw new Error('Could not determine next phase');

        const newMatches: Match[] = [];

        if (currentPhase === 'GROUP' && champ.knockoutMode === 'RANKED') {
            const advancingCount = champ.advancingCount || 2;

            if (standings.length === 1) {
                const groupAdvancing = standings[0].standings.slice(0, advancingCount);
                const numMatches = groupAdvancing.length / 2;
                for (let i = 0; i < numMatches; i++) {
                    newMatches.push({
                        id: Math.random().toString(36).substr(2, 9),
                        championshipId,
                        homeTeamId: groupAdvancing[i].teamId,
                        awayTeamId: groupAdvancing[groupAdvancing.length - 1 - i].teamId,
                        phase: nextPhase,
                        round: 1,
                        status: MatchStatus.SCHEDULED,
                        goals: [],
                        homeScore: 0,
                        awayScore: 0
                    });
                }
            } else {
                for (let g = 0; g < standings.length; g += 2) {
                    const groupA = standings[g].standings.slice(0, advancingCount);
                    const groupB = standings[g + 1] ? standings[g + 1].standings.slice(0, advancingCount) : [];

                    for (let i = 0; i < Math.min(groupA.length, groupB.length); i++) {
                        const homeTeam = groupA[i];
                        const awayTeam = groupB[advancingCount - 1 - i];
                        if (homeTeam && awayTeam) {
                            newMatches.push({
                                id: Math.random().toString(36).substr(2, 9),
                                championshipId,
                                homeTeamId: homeTeam.teamId,
                                awayTeamId: awayTeam.teamId,
                                phase: nextPhase,
                                round: 1,
                                status: MatchStatus.SCHEDULED,
                                goals: [],
                                homeScore: 0,
                                awayScore: 0
                            });
                        }
                    }
                }
            }
        } else {
            const numMatches = advancingTeams.length / 2;
            for (let i = 0; i < numMatches; i++) {
                const homeTeam = advancingTeams[i * 2];
                const awayTeam = advancingTeams[i * 2 + 1];

                if (homeTeam && awayTeam) {
                    newMatches.push({
                        id: Math.random().toString(36).substr(2, 9),
                        championshipId,
                        homeTeamId: homeTeam.teamId,
                        awayTeamId: awayTeam.teamId,
                        phase: nextPhase,
                        round: 1,
                        status: MatchStatus.SCHEDULED,
                        goals: [],
                        homeScore: 0,
                        awayScore: 0
                    });
                }
            }
        }

        const allMatches = this.getData<Match>(STORAGE_KEYS.MATCHES);

        this.setData(STORAGE_KEYS.MATCHES, [...allMatches, ...newMatches]);
        return { message: 'Próxima fase gerada com sucesso' };
    }
}

export const mockApi = new MockApiService();
mockApi.init();
