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
