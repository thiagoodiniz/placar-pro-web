import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

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
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    players?: { id: string; name: string; photoUrl?: string }[];
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
    champion?: string;
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
    homeScore: number | null;
    awayScore: number | null;
    homePenalties?: number | null;
    awayPenalties?: number | null;
    status: MatchStatus;
    phase: string;
    round: number;
    location?: string;
    dateTime?: string;
    goals: { id: string; playerId: string; teamId: string; playerName: string; teamName: string }[];
}

const STORAGE_KEYS = {
    CHAMPIONSHIPS: 'placarpro_championships',
    TEAMS: 'placarpro_teams',
    GROUPS: 'placarpro_groups',
    MATCHES: 'placarpro_matches'
};

const CLUBS = [
    { id: 'flamengo', name: 'Flamengo', logo: 'https://ssl.gstatic.com/onebox/media/sports/logos/optimized/orE554NToSkH6nuwofe7Yg_96x96.png', color1: '#C8102E', color2: '#000000' },
    { id: 'vasco', name: 'Vasco', logo: 'https://ssl.gstatic.com/onebox/media/sports/logos/optimized/hHwT8LwRmYCAGxQ-STLxYA_96x96.png', color1: '#000000', color2: '#FFFFFF' },
    { id: 'fluminense', name: 'Fluminense', logo: 'https://ssl.gstatic.com/onebox/media/sports/logos/optimized/fCMxMMDF2AZPU7LzYKSlig_96x96.png', color1: '#7A263A', color2: '#006341' },
    { id: 'botafogo', name: 'Botafogo', logo: 'https://ssl.gstatic.com/onebox/media/sports/logos/optimized/KLDWYp-H8CAOT9H_JgizRg_96x96.png', color1: '#000000', color2: '#FFFFFF' },
    { id: 'palmeiras', name: 'Palmeiras', logo: 'https://ssl.gstatic.com/onebox/media/sports/logos/optimized/7spurne-xDt2p6C0imYYNA_96x96.png', color1: '#006437', color2: '#FFFFFF' },
    { id: 'santos', name: 'Santos', logo: 'https://ssl.gstatic.com/onebox/media/sports/logos/optimized/VHdNOT6wWOw_vJ38GMjMzg_96x96.png', color1: '#FFFFFF', color2: '#000000' },
    { id: 'corinthians', name: 'Corinthians', logo: 'https://ssl.gstatic.com/onebox/media/sports/logos/optimized/tCMSqgXVHROpdCpQhzTo1g_96x96.png', color1: '#000000', color2: '#FFFFFF' },
    { id: 'saopaulo', name: 'São Paulo', logo: 'https://ssl.gstatic.com/onebox/media/sports/logos/optimized/4w2Z97Hf9CSOqICK3a8AxQ_96x96.png', color1: '#E60026', color2: '#000000' },
];

const CATEGORIES = ['Sub-13', 'Sub-15', 'Sub-17'];

const generatePlayers = (teamName: string, count: number = 6) => {
    const firstNames = ['João', 'Lucas', 'Gabriel', 'Mateus', 'Pedro', 'Davi', 'Rafael', 'Bruno', 'Thiago', 'Felipe', 'Nicolas', 'Gustavo', 'Igor', 'Enzo', 'Leonardo'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho'];

    return Array.from({ length: count }, (_, i) => {
        const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
        return {
            id: `p-${teamName}-${i}`,
            name,
            photoUrl: `https://api.dicebear.com/7.x/personas/png?seed=${name.replace(' ', '')}`
        };
    });
};

const SEED_TEAMS = CLUBS.flatMap(club =>
    CATEGORIES.map(cat => ({
        id: `t-${club.id}-${cat.toLowerCase()}`,
        name: `${club.name} ${cat}`,
        logoUrl: club.logo,
        primaryColor: club.color1,
        secondaryColor: club.color2,
        players: generatePlayers(`${club.name}-${cat}`)
    }))
);

// Agrupamentos de Clubes
const CARIOCA_IDS = ['flamengo', 'vasco', 'fluminense', 'botafogo'];
const PAULISTA_IDS = ['palmeiras', 'santos', 'corinthians', 'saopaulo'];
const LOCATIONS = ['Maracanã', 'Allianz Parque', 'Morumbi', 'Neo Química Arena', 'São Januário', 'Nilton Santos', 'Vila Belmiro'];

// Global storage for seeded data
const SEEDED_GROUPS: Group[] = [];
const SEEDED_MATCHES: Match[] = [];

// Helper helper to generate scores & goals
const generateMatchResult = (hTeam: Team, aTeam: Team, hId: string, aId: string, biasName?: string) => {
    let hScore = Math.floor(Math.random() * 4);
    let aScore = Math.floor(Math.random() * 3);

    // Bias the designated champion in group stage
    if (biasName) {
        if (hTeam.name === biasName) hScore += 2;
        if (aTeam.name === biasName) aScore += 2;
    }

    const goals: Match['goals'] = [];

    for (let g = 0; g < hScore; g++) {
        const p = hTeam.players![Math.floor(Math.random() * hTeam.players!.length)];
        goals.push({ id: uuidv4(), playerId: p.id, teamId: hId, playerName: p.name, teamName: hTeam.name });
    }
    for (let g = 0; g < aScore; g++) {
        const p = aTeam.players![Math.floor(Math.random() * aTeam.players!.length)];
        goals.push({ id: uuidv4(), playerId: p.id, teamId: aId, playerName: p.name, teamName: aTeam.name });
    }
    return { hScore, aScore, goals };
};

// Proper Round-Robin Generator (Circle Method)
const generateRoundRobinPairings = (teamIds: string[]) => {
    const teams = [...teamIds];
    const n = teams.length;
    const rounds: { round: number; matches: [string, string][] }[] = [];

    // For odd number of teams, add a dummy team
    if (n % 2 !== 0) teams.push('BYE');

    const numRounds = teams.length - 1;
    const half = teams.length / 2;

    for (let r = 0; r < numRounds; r++) {
        const roundMatches: [string, string][] = [];
        for (let i = 0; i < half; i++) {
            const h = teams[i];
            const a = teams[teams.length - 1 - i];
            if (h !== 'BYE' && a !== 'BYE') {
                roundMatches.push([h, a]);
            }
        }
        rounds.push({ round: r + 1, matches: roundMatches });
        // Rotate: keep index 0 fixed, rotate others
        teams.splice(1, 0, teams.pop()!);
    }
    return rounds;
};
const populateChampionshipMatches = (championshipId: string, groups: Group[], progress: number, championName?: string) => {
    const isFinished = progress === 1.0;

    // 1. Group Stage (Using Round-Robin Algorithm)
    groups.forEach(group => {
        const teamIds = group.teams.map(t => t.teamId);
        const schedule = generateRoundRobinPairings(teamIds);

        schedule.forEach(roundData => {
            roundData.matches.forEach(([hId, aId], matchInRoundIdx) => {
                // IMPORTANT: If finished, all matches active. If in-progress, only Round 1 is finished.
                const activeMatch = isFinished || (progress > 0 && roundData.round === 1);

                const hTeam = SEED_TEAMS.find(t => t.id === hId)!;
                const aTeam = SEED_TEAMS.find(t => t.id === aId)!;

                // Bias the champion in finished championships group stage to ensure qualification
                const result = activeMatch ? generateMatchResult(hTeam, aTeam, hId, aId, isFinished ? championName : undefined) : { hScore: null, aScore: null, goals: [] };

                // Sequential dates per round
                const dateOffset = (roundData.round - 1) * 7 + matchInRoundIdx;

                SEEDED_MATCHES.push({
                    id: uuidv4(),
                    championshipId,
                    groupId: group.id,
                    homeTeamId: hId,
                    awayTeamId: aId,
                    homeScore: result.hScore,
                    awayScore: result.aScore,
                    status: activeMatch ? MatchStatus.FINISHED : MatchStatus.SCHEDULED,
                    phase: 'GROUP',
                    round: roundData.round,
                    location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
                    dateTime: dayjs().add(activeMatch ? -dateOffset - 10 : dateOffset + 1, 'day').toISOString(),
                    goals: result.goals
                });
            });
        });
    });

    // Helper to calculate real Top 2 from finished group matches
    const getQualifiers = (groupId: string, teamIds: string[]) => {
        const stats: Record<string, { points: number; gd: number; gp: number; id: string }> = {};
        teamIds.forEach(id => stats[id] = { points: 0, gd: 0, gp: 0, id });

        SEEDED_MATCHES
            .filter(m => m.championshipId === championshipId && m.groupId === groupId && m.status === MatchStatus.FINISHED)
            .forEach(m => {
                stats[m.homeTeamId].gp += m.homeScore;
                stats[m.awayTeamId].gp += m.awayScore;
                stats[m.homeTeamId].gd += (m.homeScore - m.awayScore);
                stats[m.awayTeamId].gd += (m.awayScore - m.homeScore);

                if (m.homeScore > m.awayScore) stats[m.homeTeamId].points += 3;
                else if (m.awayScore > m.homeScore) stats[m.awayTeamId].points += 3;
                else {
                    stats[m.homeTeamId].points += 1;
                    stats[m.awayTeamId].points += 1;
                }
            });

        return Object.values(stats)
            .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gp - a.gp)
            .slice(0, 2)
            .map(s => ({ teamId: s.id }));
    };

    // 2. Knockout Stage (only for finished or very advanced)
    if (isFinished) {
        // GET REAL QUALIFIERS BASED ON POINTS
        const playoffTeams = groups.flatMap(group => {
            const teamIds = group.teams.map(t => t.teamId);
            return getQualifiers(group.id, teamIds);
        });

        const finalists: string[] = [];

        // --- SEMIFINALS ---
        if (playoffTeams.length === 4) {
            const semiPairs = [
                { hId: playoffTeams[0].teamId, aId: playoffTeams[3].teamId }, // 1A vs 2B
                { hId: playoffTeams[2].teamId, aId: playoffTeams[1].teamId }  // 1B vs 2A
            ];

            semiPairs.forEach((pair, idx) => {
                const hTeam = SEED_TEAMS.find(t => t.id === pair.hId)!;
                const aTeam = SEED_TEAMS.find(t => t.id === pair.aId)!;
                let res = generateMatchResult(hTeam, aTeam, hTeam.id, aTeam.id);

                // If one of the teams is the designated winner, force them to advance
                const mustWinH = hTeam.name === championName;
                const mustWinA = aTeam.name === championName;

                if (mustWinH && res.hScore < res.aScore) [res.hScore, res.aScore] = [res.aScore, res.hScore];
                if (mustWinA && res.aScore < res.hScore) [res.hScore, res.aScore] = [res.aScore, res.hScore];

                let hPen: number | undefined, aPen: number | undefined;
                if (res.hScore === res.aScore) {
                    if (mustWinH) { hPen = 5; aPen = 3; }
                    else if (mustWinA) { hPen = 3; aPen = 5; }
                    else { hPen = 5; aPen = 4; }
                }

                SEEDED_MATCHES.push({
                    id: uuidv4(),
                    championshipId,
                    homeTeamId: hTeam.id,
                    awayTeamId: aTeam.id,
                    homeScore: res.hScore,
                    awayScore: res.aScore,
                    homePenalties: hPen,
                    awayPenalties: aPen,
                    status: MatchStatus.FINISHED,
                    phase: 'SEMIFINAL',
                    round: 1,
                    location: LOCATIONS[idx % LOCATIONS.length],
                    dateTime: dayjs().add(-3, 'day').toISOString(),
                    goals: res.goals
                });

                // Determine winner to advance to final
                const winnerId = (res.hScore > res.aScore || (hPen !== undefined && aPen !== undefined && hPen > aPen)) ? hTeam.id : aTeam.id;
                finalists.push(winnerId);
            });
        } else {
            // No Semis, first 2 go to final
            finalists.push(playoffTeams[0].teamId, playoffTeams[1].teamId);
        }

        // --- THE FINAL ---
        const hId = finalists[0];
        const aId = finalists[1];
        const hTeam = SEED_TEAMS.find(t => t.id === hId)!;
        const aTeam = SEED_TEAMS.find(t => t.id === aId)!;

        let res = generateMatchResult(hTeam, aTeam, hId, aId);

        const mustWinH = hTeam.name === championName;
        const mustWinA = aTeam.name === championName;

        if (mustWinH && res.hScore < res.aScore) [res.hScore, res.aScore] = [res.aScore, res.hScore];
        if (mustWinA && res.aScore < res.hScore) [res.hScore, res.aScore] = [res.aScore, res.hScore];

        let hPen: number | undefined, aPen: number | undefined;
        if (res.hScore === res.aScore) {
            if (mustWinH) { hPen = 5; aPen = 3; }
            else if (mustWinA) { hPen = 3; aPen = 5; }
            else { hPen = 5; aPen = 4; }
        }

        SEEDED_MATCHES.push({
            id: uuidv4(),
            championshipId,
            homeTeamId: hId,
            awayTeamId: aId,
            homeScore: res.hScore,
            awayScore: res.aScore,
            homePenalties: hPen,
            awayPenalties: aPen,
            status: MatchStatus.FINISHED,
            phase: 'FINAL',
            round: 1,
            location: 'Maracanã',
            dateTime: dayjs().add(-1, 'day').toISOString(),
            goals: res.goals
        });
    }
};

const createChampionshipSets = () => {
    const championships: Championship[] = [];

    CATEGORIES.forEach(cat => {
        const catSuffix = cat.toLowerCase();

        const configs = [
            { id: 'brazilian', name: `Campeonato Brasileiro ${cat} - 2023`, teams: SEED_TEAMS.filter(t => t.id.endsWith(catSuffix)), progress: 1.0 },
            { id: 'rj', name: `Copa RJ ${cat}`, teams: SEED_TEAMS.filter(t => t.id.endsWith(catSuffix) && CARIOCA_IDS.some(cid => t.id.includes(cid))), progress: 0.5 },
            { id: 'sp', name: `Copa SP ${cat}`, teams: SEED_TEAMS.filter(t => t.id.endsWith(catSuffix) && PAULISTA_IDS.some(cid => t.id.includes(cid))), progress: 0.5 }
        ];

        configs.forEach(conf => {
            const champId = `c-${conf.id}-${catSuffix}`;
            const groupCount = conf.teams.length > 4 ? 2 : 1;
            const champion = conf.progress === 1.0 ? conf.teams[Math.floor(Math.random() * conf.teams.length)].name : undefined;

            const championship: Championship = {
                id: champId,
                name: conf.name,
                format: 'GROUPS_KNOCKOUT',
                teamCount: conf.teams.length,
                groupCount,
                advancingCount: 2,
                status: conf.progress === 1.0 ? ChampionshipStatus.FINISHED : ChampionshipStatus.STARTED,
                champion,
                teams: conf.teams.map(t => ({ teamId: t.id, team: t as any }))
            };

            // Generate Groups
            const currentChampGroups: Group[] = [];
            const teamsPerGroup = Math.ceil(conf.teams.length / groupCount);
            for (let i = 0; i < groupCount; i++) {
                const groupTeams = conf.teams.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
                const group: Group = {
                    id: `g-${champId}-${i}`,
                    championshipId: champId,
                    name: `Grupo ${String.fromCharCode(65 + i)}`,
                    teams: groupTeams.map(t => ({ teamId: t.id, team: t as any }))
                };
                SEEDED_GROUPS.push(group);
                currentChampGroups.push(group);
            }

            // Generate all matches
            populateChampionshipMatches(champId, currentChampGroups, conf.progress, champion);
            championships.push(championship);
        });
    });

    return championships;
};

const SEED_CHAMPIONSHIPS = createChampionshipSets();

const SEED_DATA = {
    teams: SEED_TEAMS,
    championships: SEED_CHAMPIONSHIPS,
    matches: SEEDED_MATCHES,
    groups: SEEDED_GROUPS
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
        this.setData(STORAGE_KEYS.GROUPS, SEED_DATA.groups);
        this.setData(STORAGE_KEYS.MATCHES, SEED_DATA.matches);
    }

    async deleteChampionship(id: string) {
        let championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        championships = championships.filter(c => c.id !== id);
        this.setData(STORAGE_KEYS.CHAMPIONSHIPS, championships);

        let matches = this.getData<Match>(STORAGE_KEYS.MATCHES);
        matches = matches.filter(m => m.championshipId !== id);
        this.setData(STORAGE_KEYS.MATCHES, matches);

        let groups = this.getData<Group>(STORAGE_KEYS.GROUPS);
        groups = groups.filter(g => g.championshipId !== id);
        this.setData(STORAGE_KEYS.GROUPS, groups);

        return { message: 'Championship deleted' };
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
        return championships
            .map(c => ({
                ...c,
                teams: c.teams.map(ct => ({
                    ...ct,
                    team: allTeams.find(t => t.id === ct.teamId) || { id: ct.teamId, name: 'Unknown' }
                }))
            }))
            .sort((a, b) => {
                // Finished last
                if (a.status === ChampionshipStatus.FINISHED && b.status !== ChampionshipStatus.FINISHED) return 1;
                if (a.status !== ChampionshipStatus.FINISHED && b.status === ChampionshipStatus.FINISHED) return -1;
                // Otherwise alphabetical
                return a.name.localeCompare(b.name);
            });
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
        const teams = this.getData<Team>(STORAGE_KEYS.TEAMS);
        const championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        const matches = this.getData<Match>(STORAGE_KEYS.MATCHES);
        const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

        return sortedTeams.map(team => {
            const participatedChampionships = championships.filter(c =>
                c.teams.some(ct => ct.teamId === team.id)
            ).map(c => ({ id: c.id, name: c.name, status: c.status }));

            const titles = championships.filter(c => c.champion === team.name).length;

            const teamMatches = matches.filter(m => m.homeTeamId === team.id || m.awayTeamId === team.id);
            const finishedMatches = teamMatches
                .filter(m => m.status === MatchStatus.FINISHED)
                .sort((a, b) => (b.dateTime || '').localeCompare(a.dateTime || ''));

            const scheduledMatches = teamMatches
                .filter(m => m.status === MatchStatus.SCHEDULED)
                .sort((a, b) => (a.dateTime || '').localeCompare(b.dateTime || ''));

            return {
                ...team,
                stats: {
                    titles,
                    championshipCount: participatedChampionships.length,
                    playerCount: team.players?.length || 0,
                    participatedChampionships,
                    lastMatch: finishedMatches[0] ? {
                        ...finishedMatches[0],
                        opponentName: finishedMatches[0].homeTeamId === team.id
                            ? teams.find(t => t.id === finishedMatches[0].awayTeamId)?.name
                            : teams.find(t => t.id === finishedMatches[0].homeTeamId)?.name
                    } : null,
                    nextMatch: scheduledMatches[0] ? {
                        ...scheduledMatches[0],
                        opponentName: scheduledMatches[0].homeTeamId === team.id
                            ? teams.find(t => t.id === scheduledMatches[0].awayTeamId)?.name
                            : teams.find(t => t.id === scheduledMatches[0].homeTeamId)?.name
                    } : null
                }
            };
        });
    }

    async updateTeam(id: string, data: Partial<Team>) {
        const teams = this.getData<Team>(STORAGE_KEYS.TEAMS);
        const index = teams.findIndex(t => t.id === id);
        if (index === -1) throw new Error('Team not found');

        teams[index] = { ...teams[index], ...data };
        this.setData(STORAGE_KEYS.TEAMS, teams);
        return teams[index];
    }

    async deleteTeam(id: string) {
        let teams = this.getData<Team>(STORAGE_KEYS.TEAMS);
        teams = teams.filter(t => t.id !== id);
        this.setData(STORAGE_KEYS.TEAMS, teams);
        return { message: 'Team deleted' };
    }

    async createTeam(data: { name: string; logoUrl?: string; primaryColor?: string; secondaryColor?: string }) {
        const teams = this.getData<Team>(STORAGE_KEYS.TEAMS);
        const newTeam = {
            id: uuidv4(),
            name: data.name,
            logoUrl: data.logoUrl,
            primaryColor: data.primaryColor || '#166534',
            secondaryColor: data.secondaryColor || '#ffffff',
            players: []
        };
        teams.push(newTeam);
        this.setData(STORAGE_KEYS.TEAMS, teams);
        return newTeam;
    }

    async removePlayerFromTeam(teamId: string, playerId: string) {
        const teams = this.getData<Team>(STORAGE_KEYS.TEAMS);
        const index = teams.findIndex(t => t.id === teamId);
        if (index === -1) throw new Error('Team not found');

        teams[index].players = teams[index].players?.filter(p => p.id !== playerId);
        this.setData(STORAGE_KEYS.TEAMS, teams);
        return { message: 'Player removed' };
    }

    async updatePlayerInTeam(teamId: string, playerId: string, data: { name: string; photoUrl?: string }) {
        const teams = this.getData<Team>(STORAGE_KEYS.TEAMS);
        const index = teams.findIndex(t => t.id === teamId);
        if (index === -1) throw new Error('Team not found');

        const playerIndex = teams[index].players?.findIndex(p => p.id === playerId);
        if (playerIndex === undefined || playerIndex === -1) throw new Error('Player not found');

        teams[index].players![playerIndex].name = data.name;
        if (data.photoUrl !== undefined) {
            teams[index].players![playerIndex].photoUrl = data.photoUrl;
        }
        this.setData(STORAGE_KEYS.TEAMS, teams);
        return teams[index].players![playerIndex];
    }

    async addPlayerToTeam(teamId: string, data: { name: string; photoUrl?: string }) {
        const teams = this.getData<Team>(STORAGE_KEYS.TEAMS);
        const index = teams.findIndex(t => t.id === teamId);
        if (index === -1) throw new Error('Team not found');
        const newPlayer = { id: uuidv4(), name: data.name, photoUrl: data.photoUrl };
        if (!teams[index].players) teams[index].players = [];
        teams[index].players!.push(newPlayer);
        this.setData(STORAGE_KEYS.TEAMS, teams);
        return newPlayer;
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
        // Keep groups but clear their team lists
        let groups = this.getData<Group>(STORAGE_KEYS.GROUPS);
        groups = groups.map(g => {
            if (g.championshipId === championshipId) {
                return { ...g, teams: [] };
            }
            return g;
        });
        this.setData(STORAGE_KEYS.GROUPS, groups);

        // Delete all matches for this championship
        let matches = this.getData<Match>(STORAGE_KEYS.MATCHES);
        matches = matches.filter(m => m.championshipId !== championshipId);
        this.setData(STORAGE_KEYS.MATCHES, matches);

        // Reset championship state
        let championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        const cIndex = championships.findIndex(c => c.id === championshipId);
        if (cIndex !== -1) {
            championships[cIndex].matchMode = undefined;
        }
        this.setData(STORAGE_KEYS.CHAMPIONSHIPS, championships);

        return { message: 'Groups and matches reset' };
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
            homeScore: null,
            awayScore: null,
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
        
        // Update status based on score presence
        if (updated.homeScore !== null && updated.awayScore !== null) {
            updated.status = MatchStatus.FINISHED;
        } else {
            updated.status = MatchStatus.SCHEDULED;
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
                homeScore: null,
                awayScore: null,
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
            const groupCount = champ.groupCount || 1;
            const createdGroups: Group[] = [];
            for (let i = 0; i < groupCount; i++) {
                const groupName = `Grupo ${String.fromCharCode(65 + i)}`;
                const g = await this.createGroup(championshipId, groupName, []);
                createdGroups.push(g);
            }

            const allGroups = this.getData<Group>(STORAGE_KEYS.GROUPS);
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

            for (const g of createdGroups) {
                await this.generateMatchesForGroup(g.id);
            }
        } else if (champ.format === 'LEAGUE') {
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

                        if (champ.roundTrip) {
                            matches.push({
                                championshipId: champ.id,
                                homeTeamId: isEvenRound ? home : away,
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
                    id: uuidv4(),
                    homeScore: null,
                    awayScore: null,
                    status: MatchStatus.SCHEDULED,
                    goals: [],
                    ...m
                });
            }
            this.setData(STORAGE_KEYS.MATCHES, currentMatches);
        }
    }

    async autoDistributeTeams(championshipId: string) {
        const championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        const champ = championships.find(c => c.id === championshipId);
        if (!champ || champ.teams.length === 0) return { message: 'No teams to distribute' };

        const teamIds = [...champ.teams.map(t => t.teamId)].sort(() => Math.random() - 0.5);
        const groups = this.getData<Group>(STORAGE_KEYS.GROUPS).filter(g => g.championshipId === championshipId);
        
        if (groups.length === 0) return { message: 'No groups defined' };

        groups.forEach(g => g.teams = []);

        const allTeams = this.getData<Team>(STORAGE_KEYS.TEAMS);
        for (let i = 0; i < teamIds.length; i++) {
            const groupIdx = i % groups.length;
            const tid = teamIds[i];
            groups[groupIdx].teams.push({ 
                teamId: tid, 
                team: allTeams.find(t => t.id === tid) || { id: tid, name: 'Unknown' } as any 
            });
        }

        const otherGroups = this.getData<Group>(STORAGE_KEYS.GROUPS).filter(g => g.championshipId !== championshipId);
        this.setData(STORAGE_KEYS.GROUPS, [...otherGroups, ...groups]);
        return { message: 'Teams distributed' };
    }

    async generateAllGroupMatches(championshipId: string) {
        let matches = this.getData<Match>(STORAGE_KEYS.MATCHES);
        matches = matches.filter(m => m.championshipId !== championshipId || m.phase !== 'GROUP');
        this.setData(STORAGE_KEYS.MATCHES, matches);

        const groups = this.getData<Group>(STORAGE_KEYS.GROUPS).filter(g => g.championshipId === championshipId);
        for (const g of groups) {
            await this.generateMatchesForGroup(g.id);
        }
        return { message: 'All group matches generated' };
    }

    // Standings
    async getStandings(championshipId: string) {
        const groups = this.getData<Group>(STORAGE_KEYS.GROUPS).filter(g => g.championshipId === championshipId);
        const matches = this.getData<Match>(STORAGE_KEYS.MATCHES).filter(m => 
            m.championshipId === championshipId && 
            m.status === MatchStatus.FINISHED && 
            (m.phase === 'GROUP' || m.phase === 'LEAGUE')
        );
        const allTeams = this.getData<Team>(STORAGE_KEYS.TEAMS);

        const championships = this.getData<Championship>(STORAGE_KEYS.CHAMPIONSHIPS);
        const champ = championships.find(c => c.id === championshipId);

        if (groups.length === 0 && champ?.format === 'GROUPS_KNOCKOUT') {
            const count = champ.groupCount || 1;
            const createdGroups: Group[] = [];
            for (let i = 0; i < count; i++) {
                const g = await this.createGroup(championshipId, `Grupo ${String.fromCharCode(65 + i)}`, []);
                createdGroups.push(g);
            }
            return createdGroups.map(group => ({
                groupId: group.id,
                groupName: group.name,
                standings: []
            }));
        }

        if (groups.length === 0) {
            // If No Groups (like LEAGUE), return based on championship teams and 'geral' group matches
            if (champ && champ.teams.length > 0) {
                const standings = champ.teams.map(ct => {
                    const team = allTeams.find(t => t.id === ct.teamId)!;
                    const tMatches = matches.filter(m => m.homeTeamId === team.id || m.awayTeamId === team.id);

                    let stats = {
                        teamId: team.id,
                        teamName: team.name,
                        teamLogoUrl: team.logoUrl,
                        played: tMatches.length,
                        wins: 0, draws: 0, losses: 0,
                        goalsFor: 0, goalsAgainst: 0, gd: 0, points: 0
                    };

                    tMatches.forEach(m => {
                        const isHome = m.homeTeamId === team.id;
                        const ownScore = (isHome ? m.homeScore : m.awayScore) ?? 0;
                        const opponentScore = (isHome ? m.awayScore : m.homeScore) ?? 0;
                        stats.goalsFor += ownScore;
                        stats.goalsAgainst += opponentScore;
                        if (ownScore > opponentScore) { stats.wins++; stats.points += 3; }
                        else if (ownScore === opponentScore) { stats.draws++; stats.points += 1; }
                        else stats.losses++;
                    });
                    stats.gd = stats.goalsFor - stats.goalsAgainst;
                    return stats;
                });

                return [{
                    groupId: 'geral',
                    groupName: 'Geral',
                    standings: standings.sort((a, b) => b.points - a.points || b.gd - a.gd || b.goalsFor - a.goalsFor)
                }];
            }
            return [];
        }

        return groups.map(group => {
            const groupMatches = matches.filter(m => m.groupId === group.id);
            const standings = group.teams.map(gt => {
                const team = allTeams.find(t => t.id === gt.teamId) || { id: gt.teamId, name: 'Unknown', logoUrl: undefined };
                const tMatches = groupMatches.filter(m => m.homeTeamId === team.id || m.awayTeamId === team.id);

                let stats = {
                    teamId: team.id,
                    teamName: team.name,
                    teamLogoUrl: team.logoUrl,
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
        const teams = this.getData<Team>(STORAGE_KEYS.TEAMS);
        const scores: any = {};

        matches.forEach(m => {
            m.goals.forEach(g => {
                const key = g.playerId;
                if (!scores[key]) {
                    const team = teams.find(t => t.id === g.teamId);
                    const player = team?.players?.find(p => p.id === g.playerId);
                    scores[key] = {
                        playerId: g.playerId,
                        player: g.playerName,
                        photoUrl: player?.photoUrl,
                        teamId: g.teamId,
                        team: g.teamName,
                        teamLogoUrl: team?.logoUrl,
                        goals: 0
                    };
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
                    goals.push({ id: uuidv4(), playerId: p.id, playerName: p.name, teamId: homeTeam.id, teamName: homeTeam.name });
                }
            }

            for (let i = 0; i < awayScore; i++) {
                if (awayTeam?.players?.length) {
                    const p = awayTeam.players[Math.floor(Math.random() * awayTeam.players.length)];
                    goals.push({ id: uuidv4(), playerId: p.id, playerName: p.name, teamId: awayTeam.id, teamName: awayTeam.name });
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
                        homeScore: null,
                        awayScore: null
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
                                homeScore: null,
                                awayScore: null
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
                        homeScore: null,
                        awayScore: null
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
