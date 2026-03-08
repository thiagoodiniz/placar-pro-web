import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Table,
    Button,
    Card,
    Typography,
    Space,
    Tag,
    Row,
    Col,
    Tabs,
    List,
    Modal,
    Form,
    Input,
    Select,
    Divider,
    Empty,
    message,
    Avatar,
    InputNumber,
    DatePicker,
    Radio
} from 'antd';
import {
    TrophyOutlined,
    CalendarOutlined,
    TeamOutlined,
    PlusOutlined,
    EditOutlined,
    PlayCircleOutlined,
    ClockCircleOutlined,
    EnvironmentOutlined,
    FireOutlined,
    DeleteOutlined,
    ArrowLeftOutlined,
    SettingOutlined,
    UserOutlined
} from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ChampionshipDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [championship, setChampionship] = useState<any>(null);
    const [standings, setStandings] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [scorers, setScorers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isManualMatchModalOpen, setIsManualMatchModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isEditTeamsModalOpen, setIsEditTeamsModalOpen] = useState(false);
    const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    // Tab state management
    const [activeTab, setActiveTab] = useState('standings');
    const [activePhase, setActivePhase] = useState<string>('GROUP');

    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    const [matchGoals, setMatchGoals] = useState<any[]>([]);
    const [players, setPlayers] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [currentRound, setCurrentRound] = useState(1);

    const [resultForm] = Form.useForm();
    const homeScore = Form.useWatch('homeScore', resultForm);
    const awayScore = Form.useWatch('awayScore', resultForm);
    const [detailsForm] = Form.useForm();
    const [manualMatchForm] = Form.useForm();
    const [configForm] = Form.useForm();
    const [editTeamsForm] = Form.useForm();
    const [groupForm] = Form.useForm();


    const fetchChampionship = async (champId: string) => {
        try {
            const res = await api.get(`/championships`);
            const champ = res.data.find((c: any) => c.id === champId);
            setChampionship(champ);
        } catch (err) { console.error(err); }
    };

    const fetchTeams = async () => {
        try {
            const res = await api.get('/teams');
            setTeams(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const loadData = async () => {
            if (id) {
                setLoading(true);
                try {
                    await Promise.all([
                        fetchChampionship(id),
                        fetchStandings(id),
                        fetchMatches(id),
                        fetchScorers(id),
                        fetchTeams()
                    ]);
                } catch (error) {
                    console.error("Error loading championship data:", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadData();
    }, [id]);

    const fetchStandings = async (champId: string) => {
        try {
            const res = await api.get(`/championships/${champId}/standings`);
            setStandings(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchMatches = async (champId: string) => {
        try {
            const res = await api.get(`/championships/${champId}/matches`);
            setMatches(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchScorers = async (champId: string) => {
        try {
            const res = await api.get(`/matches/championship/${champId}/top-scorers`);
            setScorers(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchGroups = async (champId: string) => {
        try {
            const res = await api.get(`/championships/${champId}/standings`);
            setGroups(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (id && championship?.status === 'DRAFT' && championship?.matchMode === 'MANUALLY') {
            fetchGroups(id);
        }
    }, [id, championship]);

    // Auto-select current phase/round when Jogos tab is opened or matches change
    useEffect(() => {
        if (activeTab !== 'matches' || matches.length === 0) return;

        const phaseOrder = ['GROUP', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL'];

        // Find the most advanced phase that exists
        const existingPhases = [...new Set(matches.map((m: any) => m.phase || 'GROUP'))];
        const sortedPhases = existingPhases.sort((a: any, b: any) => {
            return phaseOrder.indexOf(a) - phaseOrder.indexOf(b);
        }) as string[];

        // Find first incomplete match across all phases in order
        let targetPhase = sortedPhases[0];
        let targetRound = 1;

        for (const phase of sortedPhases) {
            const pMatches = matches.filter((m: any) => (m.phase || 'GROUP') === phase);
            const incompleteMatch = pMatches.find((m: any) => m.status !== 'FINISHED');
            if (incompleteMatch) {
                targetPhase = phase;
                targetRound = incompleteMatch.round || 1;
                break;
            } else {
                // All matches in this phase finished - if next phase doesn't exist, stay here at last round
                const allRounds = [...new Set(pMatches.map((m: any) => m.round || 1))] as number[];
                const lastRound = Math.max(...allRounds);
                const nextPhase = sortedPhases[sortedPhases.indexOf(phase) + 1];
                if (!nextPhase) {
                    targetPhase = phase;
                    targetRound = lastRound;
                }
            }
        }

        setActivePhase(targetPhase);
        setCurrentRound(targetRound);
    }, [activeTab, matches]);

    const handleOpenResultModal = async (match: any) => {
        setSelectedMatch(match);
        setMatchGoals(match.goals || []);
        resultForm.setFieldsValue({
            homeScore: match.homeScore || 0,
            awayScore: match.awayScore || 0,
            homePenalties: match.homePenalties ?? undefined,
            awayPenalties: match.awayPenalties ?? undefined,
        });

        // Use existing teams state if loaded, otherwise fetch
        try {
            let currentTeams = teams;
            if (currentTeams.length === 0) {
                const res = await api.get('/teams');
                currentTeams = res.data;
                setTeams(currentTeams);
            }

            const homeTeam = currentTeams.find((t: any) => t.id === match.homeTeamId);
            const awayTeam = currentTeams.find((t: any) => t.id === match.awayTeamId);

            setPlayers([
                ...(homeTeam?.players?.map((p: any) => ({ ...p, teamName: homeTeam.name, teamId: homeTeam.id })) || []),
                ...(awayTeam?.players?.map((p: any) => ({ ...p, teamName: awayTeam.name, teamId: awayTeam.id })) || [])
            ]);
        } catch (err) { console.error(err); }

        setIsResultModalOpen(true);
    };

    const handleSaveResult = async (values: any) => {
        try {
            await api.patch(`/matches/${selectedMatch.id}`, {
                ...values,
                goals: matchGoals.map(g => ({
                    playerId: g.playerId,
                    teamId: g.teamId,
                    playerName: g.playerName,
                    teamName: g.teamName
                }))
            });
            setIsResultModalOpen(false);
            fetchMatches(id!);
            fetchStandings(id!);
            fetchScorers(id!);
        } catch (err) { console.error(err); }
    };

    const handleSaveDetails = async (values: any) => {
        try {
            await api.patch(`/matches/${selectedMatch.id}/details`, {
                ...values,
                dateTime: values.dateTime?.toISOString()
            });
            setIsDetailsModalOpen(false);
            fetchMatches(id!);
        } catch (err) { console.error(err); }
    };

    const handleCreateManualMatch = async (values: any) => {
        try {
            await api.post(`/championships/match`, {
                championshipId: id,
                ...values
            });
            setIsManualMatchModalOpen(false);
            manualMatchForm.resetFields();
            fetchMatches(id!);
        } catch (err) { console.error(err); }
    };

    const handleFinalize = async () => {
        try {
            await api.post(`/championships/${id}/finalize`);
            message.success('Campeonato iniciado com sucesso!');
            fetchChampionship(id!);
            fetchMatches(id!);
            fetchStandings(id!);
        } catch (err) {
            console.error(err);
            message.error('Erro ao iniciar campeonato');
        }
    };

    const handleFinishChampionship = async () => {
        try {
            await api.post(`/championships/${id}/finish`);
            message.success('Campeonato finalizado com sucesso!');
            fetchChampionship(id!);
            fetchMatches(id!);
        } catch (err) {
            console.error(err);
            message.error('Erro ao finalizar campeonato');
        }
    };


    const handleUpdateConfig = async (values: any) => {
        try {
            const structuralFields = ['format', 'teamCount', 'groupCount', 'advancingCount'];
            const isStructuralChange = structuralFields.some(field => values[field] !== undefined && values[field] !== (championship as any)[field]);

            if (isStructuralChange && matches.length > 0) {
                Modal.confirm({
                    title: 'Aviso de Mudança Estrutural',
                    content: 'Alterar estas configurações irá apagar todos os confrontos já definidos. Deseja continuar?',
                    onOk: async () => {
                        await api.patch(`/championships/${id}`, values);
                        setIsConfigModalOpen(false);
                        fetchChampionship(id!);
                        fetchMatches(id!);
                    }
                });
            } else {
                await api.patch(`/championships/${id}`, values);
                setIsConfigModalOpen(false);
                fetchChampionship(id!);
            }
        } catch (err) { console.error(err); }
    };

    const handleResetGroups = async () => {
        Modal.confirm({
            title: 'Redefinir Grupos',
            content: 'Deseja remover todos os times dos grupos e limpar os jogos? Esta ação não pode ser desfeita.',
            okText: 'Sim, Redefinir',
            cancelText: 'Cancelar',
            okType: 'danger',
            onOk: async () => {
                try {
                    await api.post(`/championships/${id}/groups/reset`);
                    fetchStandings(id!);
                    fetchMatches(id!);
                    fetchChampionship(id!);
                    message.success('Grupos redefinidos com sucesso!');
                } catch (error) {
                    console.error(error);
                    message.error('Erro ao redefinir grupos');
                }
            }
        });
    };

    const handleEditTeams = async (values: any) => {
        try {
            const rawTeamIdentifiers = values.teamIds || [];

            if (rawTeamIdentifiers.length > (championship.teamCount || 0)) {
                message.error(`Limite de times excedido! Máximo de ${championship.teamCount} times permitido.`);
                return;
            }

            const finalTeamIds: string[] = [];

            for (const identifier of rawTeamIdentifiers) {
                const existingById = teams.find((t: any) => t.id === identifier);
                if (existingById) {
                    finalTeamIds.push(identifier);
                    continue;
                }
                const existingByName = teams.find((t: any) => t.name.toLowerCase() === identifier.toLowerCase());
                if (existingByName) {
                    finalTeamIds.push((existingByName as any).id);
                    continue;
                }
                const teamRes = await api.post('/teams', { name: identifier });
                finalTeamIds.push(teamRes.data.id);
            }

            await api.post('/teams/championship', {
                championshipId: id,
                teamIds: finalTeamIds
            });
            setIsEditTeamsModalOpen(false);
            fetchChampionship(id!);
            fetchTeams();
            message.success('Times atualizados com sucesso!');
        } catch (error) {
            console.error('Error updating teams', error);
            message.error('Erro ao atualizar times');
        }
    };

    const handleUpdateGroup = async (values: any) => {
        try {
            const tc = Number(championship.teamCount) || 0;
            const gc = Number(championship.groupCount) || 1;
            const tpb = Math.ceil(tc / gc);

            if (values.teamIds && values.teamIds.length > tpb) {
                message.error(`Limite de times por grupo excedido! Máximo de ${tpb} times por grupo.`);
                return;
            }

            if (!selectedGroup?.id) {
                message.error('ID do grupo não encontrado. Tente reabrir o modal.');
                return;
            }

            await api.patch(`/championships/groups/${selectedGroup.id}`, values);
            setIsEditGroupModalOpen(false);
            groupForm.resetFields();
            fetchStandings(id!);
            fetchChampionship(id!);
            message.success('Grupo atualizado com sucesso!');
        } catch (error) {
            console.error(error);
            message.error('Erro ao atualizar grupo');
        }
    };

    const handleGenerateGroupMatches = async (groupId: string) => {
        try {
            await api.post(`/championships/groups/${groupId}/generate-matches`);
            fetchMatches(id!);
            fetchStandings(id!);
            fetchChampionship(id!);
        } catch (error) { console.error(error); }
    };

    const handleStartClick = () => {
        Modal.confirm({
            title: 'Iniciar Confrontos',
            content: 'Deseja sortear os jogos automaticamente ou definir manualmente?',
            okText: 'Definir Manualmente',
            cancelText: 'Sortear Automático',
            onOk: async () => {
                await api.post(`/championships/${id}/start`, { mode: 'MANUALLY' });
                await fetchChampionship(id!);
                await fetchStandings(id!);
                await fetchMatches(id!);
            },
            onCancel: async () => {
                await api.post(`/championships/${id}/start`, { mode: 'RANDOM' });
                await fetchChampionship(id!);
                await fetchStandings(id!);
                await fetchMatches(id!);
            }
        });
    };

    const addGoal = (player: any) => {
        setMatchGoals([...matchGoals, {
            id: Math.random().toString(),
            playerId: player.id,
            playerName: player.name,
            teamId: player.teamId,
            teamName: player.teamName
        }]);
    };

    const removeGoal = (goalId: string) => {
        setMatchGoals(matchGoals.filter(g => g.id !== goalId));
    };

    const standingColumns = [
        { title: 'Pos', key: 'pos', width: 50, render: (_: any, __: any, i: number) => i + 1 },
        { title: 'Time', dataIndex: 'teamName', key: 'teamName', fixed: 'left' as const, width: 120 },
        { title: 'P', dataIndex: 'points', key: 'points', width: 40, render: (p: number) => <Text strong>{p}</Text> },
        { title: 'J', dataIndex: 'played', key: 'played', width: 40 },
        { title: 'V', dataIndex: 'wins', key: 'wins', width: 40 },
        { title: 'E', dataIndex: 'draws', key: 'draws', width: 40 },
        { title: 'D', dataIndex: 'losses', key: 'losses', width: 40 },
        { title: 'SG', dataIndex: 'gd', key: 'gd', width: 40 },
    ];

    if (loading) return <div>Carregando...</div>;
    if (!championship) return <Empty description="Campeonato não encontrado" />;

    // Determine the next phase name and ID for the "Iniciar Próxima Fase" button
    let nextPhaseName = '';
    let nextPhaseId = '';
    let canStartNextPhase = false;
    let canFinishChampionship = false;

    if (championship?.status === 'STARTED' || championship?.status === 'FINISHED') {
        if (championship.format === 'LEAGUE') {
            canFinishChampionship = championship.status !== 'FINISHED' && matches.length > 0 && matches.every(m => m.status === 'FINISHED');
        } else {
            const currentPhase = matches.length > 0 ? (matches[matches.length - 1].phase || 'GROUP') : 'GROUP';
            const phaseMatches = matches.filter(m => m.phase === currentPhase);
            const allPhaseFinished = phaseMatches.length > 0 && phaseMatches.every(m => m.status === 'FINISHED');

            if (allPhaseFinished && championship.status !== 'FINISHED') {
                if (currentPhase === 'FINAL' || (currentPhase === 'GROUP' && championship.advancingCount === 0)) {
                    canFinishChampionship = true;
                } else if (currentPhase !== 'FINAL') {
                    canStartNextPhase = true;

                    if (currentPhase === 'GROUP') {
                        const advancing = (championship.advancingCount || 2) * (championship.groupCount || 1);
                        if (advancing === 16) { nextPhaseName = 'Oitavas de Final'; nextPhaseId = 'ROUND_16'; }
                        else if (advancing === 8) { nextPhaseName = 'Quartas de Final'; nextPhaseId = 'QUARTER'; }
                        else if (advancing === 4) { nextPhaseName = 'Semifinal'; nextPhaseId = 'SEMI'; }
                        else if (advancing === 2) { nextPhaseName = 'Final'; nextPhaseId = 'FINAL'; }
                    } else {
                        const phaseOrder = ['GROUP', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL'];
                        const currentPhaseIndex = phaseOrder.indexOf(currentPhase);
                        nextPhaseId = phaseOrder[currentPhaseIndex + 1];

                        if (nextPhaseId) {
                            switch (nextPhaseId) {
                                case 'ROUND_16': nextPhaseName = 'Oitavas de Final'; break;
                                case 'QUARTER': nextPhaseName = 'Quartas de Final'; break;
                                case 'SEMI': nextPhaseName = 'Semifinal'; break;
                                case 'FINAL': nextPhaseName = 'Final'; break;
                                default: nextPhaseName = '';
                            }
                        }
                    }
                }
            }
        }
    }

    let championTeam: any = null;
    if (championship?.status === 'FINISHED') {
        if (championship.format === 'LEAGUE') {
            const table = standings[0]?.standings;
            if (table && table.length > 0) {
                championTeam = table[0];
            }
        } else {
            const finalMatches = matches.filter(m => m.phase === 'FINAL');
            if (finalMatches.length > 0) {
                const finalMatch = finalMatches[0];
                if (finalMatch.status === 'FINISHED') {
                    if (finalMatch.homeScore > finalMatch.awayScore) {
                        championTeam = { teamName: finalMatch.homeTeam?.name || 'TBD' };
                    } else if (finalMatch.awayScore > finalMatch.homeScore) {
                        championTeam = { teamName: finalMatch.awayTeam?.name || 'TBD' };
                    } else {
                        // In a real app we'd have penalties, for now we just show a tie or first team
                        championTeam = { teamName: finalMatch.homeTeam?.name || 'TBD' };
                    }
                }
            }
        }
    }

    // Group matches by phase
    const groupedMatches = matches.reduce((acc: any, match: any) => {
        const phase = match.phase || 'GROUP';
        if (!acc[phase]) {
            acc[phase] = [];
        }
        acc[phase].push(match);
        return acc;
    }, {});


    return (
        <div style={{ paddingBottom: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
                <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/championships')} style={{ paddingLeft: 0 }}>
                    Voltar para Campeonatos
                </Button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>{championship.name}</Title>
                    <Text type="secondary">
                        {championship.format === 'GROUPS_KNOCKOUT' ? 'Grupos + Mata-mata' :
                            championship.format === 'LEAGUE' ? 'Liga (Pontos Corridos)' : 'Mata-mata Direto'}
                    </Text>
                    <div style={{ marginTop: 8 }}>
                        <Tag color="blue">{championship.teamCount} Times</Tag>
                        {championship.format === 'GROUPS_KNOCKOUT' && <Tag color="cyan">{championship.groupCount} Grupos</Tag>}
                        {championship.format === 'LEAGUE' && <Tag color="cyan">{championship.roundTrip ? 'Ida e Volta' : 'Turno Único'}</Tag>}
                    </div>
                </div>
                <Space direction="vertical" align="end">
                    <Space>
                        {championship.status !== 'FINISHED' && (
                            <Button icon={<SettingOutlined />} onClick={() => {
                                configForm.setFieldsValue(championship);
                                setIsConfigModalOpen(true);
                            }} />
                        )}
                    </Space>
                    <Tag color={championship.status === 'FINISHED' ? 'gold' : championship.status === 'STARTED' ? 'green' : 'orange'}>
                        {championship.status === 'FINISHED' ? 'Finalizado' : championship.status === 'STARTED' ? 'Em Andamento' : 'Rascunho'}
                    </Tag>
                </Space>
            </div>

            {championTeam && (
                <div style={{ marginBottom: 24, textAlign: 'center', padding: '20px', background: 'linear-gradient(90deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.2) 50%, rgba(255,215,0,0.1) 100%)', borderRadius: '8px', border: '1px solid #ffd700' }}>
                    <TrophyOutlined style={{ fontSize: '32px', color: '#faad14', marginBottom: 8 }} />
                    <Title level={3} style={{ margin: 0, color: '#faad14' }}>Campeão</Title>
                    <Title level={2} style={{ margin: 0 }}>{championTeam.teamName || championTeam.name}</Title>
                </div>
            )}

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={24}>
                    <Card size="small" title="Gestão do Campeonato">
                        <Space wrap>
                            {championship.status === 'DRAFT' && (
                                <Button icon={<TeamOutlined />} onClick={() => {
                                    editTeamsForm.setFieldsValue({
                                        teamIds: championship.teams?.map((t: any) => t.teamId) || []
                                    });
                                    setIsEditTeamsModalOpen(true);
                                }}>Editar Times ({championship.teams?.length || 0}/{championship.teamCount})</Button>
                            )}

                            {championship.status === 'DRAFT' && championship.teams?.length > 0 && !championship.matchMode && (
                                <Button type="primary" icon={<TrophyOutlined />} onClick={handleStartClick}>
                                    Definir Confrontos
                                </Button>
                            )}

                            {championship.status === 'DRAFT' && championship.matchMode && (
                                <Space>
                                    <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleFinalize}>
                                        Iniciar Campeonato
                                    </Button>
                                    <Button danger icon={<DeleteOutlined />} onClick={handleResetGroups}>
                                        Redefinir Grupos
                                    </Button>
                                </Space>
                            )}

                            {championship.status !== 'FINISHED' && matches.length > 0 && (
                                <Space>
                                    <Button
                                        type="default"
                                        onClick={async () => {
                                            try {
                                                await api.post(`/championships/${id}/auto-results`);
                                                message.success('Resultados gerados com sucesso!');
                                                fetchMatches(id!);
                                                fetchScorers(id!);
                                                fetchStandings(id!);
                                            } catch (err) {
                                                console.error(err);
                                                message.error('Erro ao gerar resultados');
                                            }
                                        }}
                                    >Inserir Placar Automático</Button>

                                    <Button danger ghost onClick={async () => {
                                        await api.post(`/championships/${id}/reset`);
                                        fetchChampionship(id!);
                                        fetchMatches(id!);
                                        setActivePhase('GROUP');
                                    }}>Redefinir Confrontos</Button>
                                </Space>
                            )}

                            {canStartNextPhase && nextPhaseName && championship.status !== 'FINISHED' && (
                                <Button
                                    type="primary"
                                    onClick={async () => {
                                        try {
                                            await api.post(`/championships/${id}/next-phase`);
                                            message.success(`${nextPhaseName} iniciada!`);
                                            await fetchMatches(id!);
                                            await fetchStandings(id!);
                                            setActiveTab('matches');
                                            setActivePhase(nextPhaseId);
                                            setCurrentRound(1);
                                        } catch (err) {
                                            console.error(err);
                                            message.error('Erro ao iniciar próxima fase');
                                        }
                                    }}
                                >
                                    Iniciar {nextPhaseName}
                                </Button>
                            )}

                            {canFinishChampionship && championship.status !== 'FINISHED' && (
                                <Button
                                    type="primary"
                                    style={{ backgroundColor: '#52c41a' }}
                                    icon={<TrophyOutlined />}
                                    onClick={handleFinishChampionship}
                                >
                                    Finalizar Campeonato
                                </Button>
                            )}

                            {championship.status === 'FINISHED' && (
                                <Tag color="gold" style={{ fontSize: '14px', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <TrophyOutlined style={{ marginRight: 8 }} /> Campeonato Finalizado
                                </Tag>
                            )}
                        </Space>
                    </Card>
                </Col>
            </Row>

            {championship.status === 'DRAFT' && championship.format === 'GROUPS_KNOCKOUT' && standings.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <Title level={4}>Grupos e Times</Title>
                    <Row gutter={[16, 16]}>
                        {standings.map((group: any) => (
                            <Col xs={24} sm={12} key={group.groupId}>
                                <Card
                                    size="small"
                                    title={group.groupName}
                                    extra={
                                        <Space>
                                            <Button size="small" icon={<EditOutlined />} onClick={() => {
                                                setSelectedGroup({ id: group.groupId, name: group.groupName, teams: group.standings });
                                                groupForm.setFieldsValue({
                                                    name: group.groupName,
                                                    teamIds: group.standings.map((s: any) => {
                                                        const ct = championship.teams.find((t: any) => t.team.name === s.teamName);
                                                        return ct?.teamId;
                                                    })
                                                });
                                                setIsEditGroupModalOpen(true);
                                            }}>Editar</Button>
                                            <Button size="small" type="link" icon={<PlayCircleOutlined />} onClick={() => handleGenerateGroupMatches(group.groupId)}>Sortear Jogos</Button>
                                        </Space>
                                    }
                                >
                                    <List
                                        size="small"
                                        dataSource={group.standings}
                                        renderItem={(s: any) => (
                                            <List.Item actions={[
                                                <Button
                                                    key="remove"
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    size="small"
                                                    onClick={async () => {
                                                        const remainingTeams = championship.teams
                                                            .filter((t: any) => t.team.name !== s.teamName)
                                                            .map((t: any) => t.teamId);
                                                        await api.post('/teams/championship', {
                                                            championshipId: id,
                                                            teamIds: remainingTeams
                                                        });
                                                        fetchChampionship(id!);
                                                    }}
                                                />
                                            ]}>
                                                <Text>{s.teamName}</Text>
                                            </List.Item>
                                        )}
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: 'standings',
                        label: <span><TrophyOutlined /> Classificação</span>,
                        children: (
                            <Space direction="vertical" style={{ width: '100% ' }}>
                                <div style={{ padding: '4px 8px', fontSize: '11px', color: '#8c8c8c', background: '#fafafa', borderRadius: 4 }}>
                                    <Space direction="horizontal" size="small" split={<Divider type="vertical" />}>
                                        <span><b>P</b> - Pontos</span>
                                        <span><b>J</b> - Jogos</span>
                                        <span><b>V</b> - Vitórias</span>
                                        <span><b>E</b> - Empates</span>
                                        <span><b>D</b> - Derrotas</span>
                                        <span><b>SG</b> - Saldo de Gols</span>
                                    </Space>
                                </div>
                                {standings.map((group: any) => (
                                    <Card key={group.groupId} title={group.groupName} size="small" styles={{ body: { padding: 0 } }}>
                                        <Table
                                            dataSource={group.standings}
                                            columns={standingColumns}
                                            pagination={false}
                                            size="small"
                                            rowKey="teamId"
                                            scroll={{ x: true }}
                                            rowClassName={(_, index) => {
                                                if (championship.format === 'LEAGUE') return '';
                                                return index < (championship.advancingCount || 2) ? 'classification-zone' : '';
                                            }}
                                        />
                                    </Card>
                                ))}
                            </Space>
                        )
                    },
                    {
                        key: 'matches',
                        label: <span><CalendarOutlined /> Jogos</span>,
                        children: (
                            <div style={{ position: 'relative' }}>
                                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        {championship.status === 'DRAFT' && championship.matchMode === 'MANUALLY' && championship.status !== 'FINISHED' && (
                                            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsManualMatchModalOpen(true)}>Definir Confronto</Button>
                                        )}
                                    </div>
                                </div>

                                {Object.keys(groupedMatches).length > 0 ? (
                                    <Tabs
                                        type="card"
                                        activeKey={activePhase}
                                        onChange={(key) => {
                                            setActivePhase(key);
                                            // Reset round to newly selected phase's first round or uncompleted round
                                            const matchesInPhase = groupedMatches[key] || [];
                                            const incompleteMatch = matchesInPhase.find((m: any) => m.status !== 'FINISHED');
                                            if (incompleteMatch && incompleteMatch.round) {
                                                setCurrentRound(incompleteMatch.round);
                                            } else if (matchesInPhase.length > 0) {
                                                setCurrentRound(matchesInPhase[0].round || 1);
                                            } else {
                                                setCurrentRound(1);
                                            }
                                        }}
                                        items={Object.entries(groupedMatches).map(([phase, phaseMatches]: [string, any]) => {
                                            const phaseLabel = phase === 'GROUP' ? 'Fase de Grupos' :
                                                phase === 'ROUND_16' ? 'Oitavas de Final' :
                                                    phase === 'QUARTER' ? 'Quartas de Final' :
                                                        phase === 'SEMI' ? 'Semifinal' :
                                                            phase === 'FINAL' ? 'Final' : phase;

                                            const rounds = Array.from(new Set(phaseMatches.map((m: any) => m.round || 1))).sort((a: any, b: any) => a - b) as number[];
                                            const activeRound = rounds.includes(currentRound) ? currentRound : rounds[0];
                                            const roundMatches = phaseMatches.filter((m: any) => (m.round || 1) === activeRound);

                                            const matchesByGroup = roundMatches.reduce((acc: any, m: any) => {
                                                const g = m.groupName || 'Geral';
                                                if (!acc[g]) acc[g] = [];
                                                acc[g].push(m);
                                                return acc;
                                            }, {});

                                            return {
                                                key: phase,
                                                label: phaseLabel,
                                                children: (
                                                    <div>
                                                        {rounds.length > 0 && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: '#f0f2f5', padding: '12px 20px', borderRadius: 8 }}>
                                                                <Button
                                                                    disabled={activeRound === rounds[0]}
                                                                    onClick={() => setCurrentRound(activeRound - 1)}
                                                                >Anterior</Button>
                                                                <Title level={4} style={{ margin: 0 }}>Rodada {activeRound}</Title>
                                                                <Button
                                                                    disabled={activeRound === rounds[rounds.length - 1]}
                                                                    onClick={() => setCurrentRound(activeRound + 1)}
                                                                >Próxima</Button>
                                                            </div>
                                                        )}

                                                        {Object.keys(matchesByGroup).sort().map(gName => (
                                                            <div key={gName} style={{ marginBottom: 16 }}>
                                                                <div style={{ paddingLeft: 8, borderLeft: '3px solid #1890ff', marginBottom: 12 }}>
                                                                    <Text strong style={{ color: '#1890ff' }}>{gName}</Text>
                                                                </div>
                                                                <List
                                                                    dataSource={matchesByGroup[gName]}
                                                                    renderItem={(m: any) => (
                                                                        <List.Item style={{ border: 'none', padding: '0 0 12px 0' }}>
                                                                            <Card size="small" style={{ width: '100%' }}>
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                                                    <div style={{ flex: 1, textAlign: 'right' }}>
                                                                                        <Text strong>{m.homeTeam?.name || 'TBD'}</Text>
                                                                                    </div>
                                                                                    <div style={{ margin: '0 20px', background: '#f5f5f5', padding: '4px 16px', borderRadius: '4px', fontWeight: 'bold', fontSize: '18px' }}>
                                                                                        {m.status === 'FINISHED'
                                                                                            ? (m.homePenalties !== undefined && m.awayPenalties !== undefined
                                                                                                ? `${m.homeScore}(${m.homePenalties}) x ${m.awayScore}(${m.awayPenalties})`
                                                                                                : `${m.homeScore} x ${m.awayScore}`)
                                                                                            : 'v'}
                                                                                    </div>
                                                                                    <div style={{ flex: 1, textAlign: 'left' }}>
                                                                                        <Text strong>{m.awayTeam?.name || 'TBD'}</Text>
                                                                                    </div>
                                                                                </div>
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#8c8c8c', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                                                                                    <Space split={<Divider type="vertical" />}>
                                                                                        <span><EnvironmentOutlined /> {m.location || 'Local TBD'}</span>
                                                                                        <span><ClockCircleOutlined /> {m.dateTime ? dayjs(m.dateTime).format('DD/MM HH:mm') : 'Hora TBD'}</span>
                                                                                    </Space>
                                                                                    {championship.status !== 'FINISHED' && (
                                                                                        <Space>
                                                                                            <Button size="small" icon={<EditOutlined />} onClick={() => {
                                                                                                setSelectedMatch(m);
                                                                                                detailsForm.setFieldsValue({
                                                                                                    location: m.location,
                                                                                                    dateTime: m.dateTime ? dayjs(m.dateTime) : null
                                                                                                });
                                                                                                setIsDetailsModalOpen(true);
                                                                                            }} />
                                                                                            <Button
                                                                                                size="small"
                                                                                                type="primary"
                                                                                                disabled={championship.status !== 'STARTED'}
                                                                                                onClick={() => handleOpenResultModal(m)}
                                                                                            >Placar</Button>
                                                                                        </Space>
                                                                                    )}
                                                                                </div>
                                                                            </Card>
                                                                        </List.Item>
                                                                    )}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            };
                                        })}
                                    />
                                ) : (
                                    <Empty description="Nenhum jogo gerado" />
                                )}
                            </div>
                        )
                    },
                    {
                        key: 'scorers',
                        label: <span><FireOutlined /> Artilharia</span>,
                        children: (
                            <List
                                dataSource={scorers}
                                renderItem={(item: any) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<Avatar icon={<UserOutlined />} src={item.photoUrl} />}
                                            title={<Text strong>{item.player}</Text>}
                                            description={item.team}
                                        />
                                        <div style={{ textAlign: 'right' }}>
                                            <Text strong style={{ fontSize: '18px', color: '#f5222d' }}>{item.goals}</Text>
                                            <br /><Text type="secondary" style={{ fontSize: '12px' }}>gols</Text>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        )
                    }
                ]} />

            {/* Result Modal with Goal Authors */}
            <Modal title="Resultado e Gols" open={isResultModalOpen} onCancel={() => setIsResultModalOpen(false)} onOk={() => resultForm.submit()} width={600}>
                <Form form={resultForm} layout="vertical" onFinish={handleSaveResult}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, background: '#fafafa', padding: 16, borderRadius: 8 }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <Title level={5}>{selectedMatch?.homeTeam?.name}</Title>
                            <Form.Item name="homeScore" noStyle><InputNumber min={0} size="large" /></Form.Item>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 20px' }}>X</div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <Title level={5}>{selectedMatch?.awayTeam?.name}</Title>
                            <Form.Item name="awayScore" noStyle><InputNumber min={0} size="large" /></Form.Item>
                        </div>
                    </div>

                    {/* Penalty shootout - only for knockout phases when draw */}
                    {selectedMatch?.phase && selectedMatch?.phase !== 'GROUP' && homeScore === awayScore && homeScore !== undefined && (
                        <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                            <Text strong style={{ color: '#fa8c16' }}>Empate! Resultado dos Pênaltis:</Text>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 12 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>{selectedMatch?.homeTeam?.name}</div>
                                    <Form.Item name="homePenalties" noStyle><InputNumber min={0} size="large" style={{ width: 80 }} /></Form.Item>
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>x</div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>{selectedMatch?.awayTeam?.name}</div>
                                    <Form.Item name="awayPenalties" noStyle><InputNumber min={0} size="large" style={{ width: 80 }} /></Form.Item>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        <div>
                            <Divider orientation="left" style={{ fontSize: '14px' }}>Gols: {selectedMatch?.homeTeam?.name}</Divider>
                            <Select
                                showSearch
                                style={{ width: '100%', marginBottom: 12 }}
                                placeholder="Add gol..."
                                disabled={matchGoals.filter(g => g.teamId === selectedMatch?.homeTeamId).length >= (homeScore || 0)}
                                onChange={(_, opt: any) => addGoal(opt.player)}
                                value={null}
                            >
                                {players.filter(p => p.teamId === selectedMatch?.homeTeamId).map(p => (
                                    <Select.Option key={p.id} value={p.id} player={p}>{p.name}</Select.Option>
                                ))}
                            </Select>
                            <List
                                size="small"
                                dataSource={matchGoals.filter(g => g.teamId === selectedMatch?.homeTeamId)}
                                renderItem={g => (
                                    <List.Item actions={[<Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeGoal(g.id)} />]}>
                                        <Text ellipsis style={{ maxWidth: 100 }}>{g.playerName}</Text>
                                    </List.Item>
                                )}
                            />
                        </div>

                        <div style={{ borderLeft: '1px solid #f0f0f0', paddingLeft: 24 }}>
                            <Divider orientation="left" style={{ fontSize: '14px' }}>Gols: {selectedMatch?.awayTeam?.name}</Divider>
                            <Select
                                showSearch
                                style={{ width: '100%', marginBottom: 12 }}
                                placeholder="Add gol..."
                                disabled={matchGoals.filter(g => g.teamId === selectedMatch?.awayTeamId).length >= (awayScore || 0)}
                                onChange={(_, opt: any) => addGoal(opt.player)}
                                value={null}
                            >
                                {players.filter(p => p.teamId === selectedMatch?.awayTeamId).map(p => (
                                    <Select.Option key={p.id} value={p.id} player={p}>{p.name}</Select.Option>
                                ))}
                            </Select>
                            <List
                                size="small"
                                dataSource={matchGoals.filter(g => g.teamId === selectedMatch?.awayTeamId)}
                                renderItem={g => (
                                    <List.Item actions={[<Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeGoal(g.id)} />]}>
                                        <Text ellipsis style={{ maxWidth: 100 }}>{g.playerName}</Text>
                                    </List.Item>
                                )}
                            />
                        </div>
                    </div>
                </Form>
            </Modal>

            {/* Details Modal */}
            <Modal title="Local e Hora" open={isDetailsModalOpen} onCancel={() => setIsDetailsModalOpen(false)} onOk={() => detailsForm.submit()}>
                <Form form={detailsForm} layout="vertical" onFinish={handleSaveDetails}>
                    <Form.Item name="location" label="Local">
                        <Input prefix={<EnvironmentOutlined />} placeholder="Estádio, Quadra..." />
                    </Form.Item>
                    <Form.Item name="dateTime" label="Data e Hora">
                        <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Manual Match Modal */}
            <Modal title="Definir Confronto Manual" open={isManualMatchModalOpen} onCancel={() => setIsManualMatchModalOpen(false)} onOk={() => manualMatchForm.submit()}>
                <Form form={manualMatchForm} layout="vertical" onFinish={handleCreateManualMatch}>
                    {championship.format === 'GROUPS_KNOCKOUT' && (
                        <Form.Item name="groupId" label="Grupo" rules={[{ required: true }]}>
                            <Select placeholder="Selecione o grupo">
                                {groups.map(g => (
                                    <Select.Option key={g.groupId} value={g.groupId}>{g.groupName}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    <Row gutter={16}>
                        <Col span={11}>
                            <Form.Item name="homeTeamId" label="Time Mandante" rules={[{ required: true }]}>
                                <Select placeholder="Selecione">
                                    {championship.teams?.map((ct: any) => (
                                        <Select.Option key={ct.team.id} value={ct.team.id}>{ct.team.name}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={2} style={{ textAlign: 'center', paddingTop: 35 }}>X</Col>
                        <Col span={11}>
                            <Form.Item name="awayTeamId" label="Time Visitante" rules={[{ required: true }]}>
                                <Select placeholder="Selecione">
                                    {championship.teams?.map((ct: any) => (
                                        <Select.Option key={ct.team.id} value={ct.team.id}>{ct.team.name}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="phase" label="Fase" initialValue="GROUP">
                                <Select options={[
                                    { label: 'Grupo', value: 'GROUP' },
                                    { label: 'Oitavas', value: 'ROUND_16' },
                                    { label: 'Quartas', value: 'QUARTER' },
                                    { label: 'Semi', value: 'SEMI' },
                                    { label: 'Final', value: 'FINAL' },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="round" label="Rodada" initialValue={1}>
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* Config Modal */}
            <Modal title="Configurar Campeonato" open={isConfigModalOpen} onCancel={() => setIsConfigModalOpen(false)} onOk={() => configForm.submit()} maskClosable={false}>
                <Form form={configForm} layout="vertical" onFinish={handleUpdateConfig}>
                    <Form.Item name="name" label="Nome do Campeonato" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="format" label="Formato" rules={[{ required: true }]}>
                        <Radio.Group>
                            <Radio value="GROUPS_KNOCKOUT">Grupos + Mata-mata</Radio>
                            <Radio value="KNOCKOUT">Mata-mata Direto</Radio>
                            <Radio value="LEAGUE">Liga (Pontos Corridos)</Radio>
                        </Radio.Group>
                    </Form.Item>

                    {/* Add Form.useWatch to track format value */}
                    <Form.Item noStyle dependencies={['format']}>
                        {({ getFieldValue }) => {
                            const format = getFieldValue('format');
                            return (
                                <>
                                    {format === 'GROUPS_KNOCKOUT' && (
                                        <Form.Item name="knockoutMode" label="Critério de Cruzamento (Mata-mata)" rules={[{ required: true }]}>
                                            <Radio.Group>
                                                <Radio value="RANDOM">Sorteio</Radio>
                                                <Radio value="RANKED">Classificação (Melhores x Piores)</Radio>
                                            </Radio.Group>
                                        </Form.Item>
                                    )}
                                    {format === 'LEAGUE' && (
                                        <Form.Item name="roundTrip" label="Turno e Returno (Ida e Volta)?">
                                            <Radio.Group>
                                                <Radio value={true}>Sim (Ida e Volta)</Radio>
                                                <Radio value={false}>Não (Turno Único)</Radio>
                                            </Radio.Group>
                                        </Form.Item>
                                    )}
                                </>
                            );
                        }}
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="teamCount" label="Qtd Times" rules={[{ required: true }]}>
                                <InputNumber min={2} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>

                        <Form.Item noStyle dependencies={['format']}>
                            {({ getFieldValue }) => {
                                const format = getFieldValue('format');
                                if (format === 'GROUPS_KNOCKOUT') {
                                    return (
                                        <>
                                            <Col span={12}>
                                                <Form.Item name="groupCount" label="Qtd Grupos" rules={[{ required: true }]}>
                                                    <InputNumber min={2} style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    name="advancingCount"
                                                    label="Classificados/Grupo"
                                                    dependencies={['teamCount', 'groupCount']}
                                                    rules={[
                                                        { required: true },
                                                        ({ getFieldValue }) => ({
                                                            validator(_, value) {
                                                                const tc = getFieldValue('teamCount');
                                                                const gc = getFieldValue('groupCount') || 1;
                                                                const teamsPerGroup = tc / gc;
                                                                if (value >= teamsPerGroup) {
                                                                    return Promise.reject(new Error(`Deve ser menor que ${teamsPerGroup}`));
                                                                }
                                                                return Promise.resolve();
                                                            },
                                                        }),
                                                    ]}
                                                >
                                                    <InputNumber min={1} style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                        </>
                                    );
                                }
                                return null;
                            }}
                        </Form.Item>
                    </Row>
                </Form>
            </Modal>

            {/* Edit Teams Modal */}
            <Modal title="Editar Times" open={isEditTeamsModalOpen} onCancel={() => setIsEditTeamsModalOpen(false)} onOk={() => editTeamsForm.submit()} maskClosable={false}>
                <Form form={editTeamsForm} layout="vertical" onFinish={handleEditTeams}>
                    <Form.Item name="teamIds" label="Times Selecionados" extra="Digite nomes novos ou selecione existentes">
                        <Select mode="tags" style={{ width: '100%' }} placeholder="Adicione os times">
                            {teams.map(t => (
                                <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Edit Group Modal */}
            <Modal title="Editar Grupo" open={isEditGroupModalOpen} onCancel={() => setIsEditGroupModalOpen(false)} onOk={() => groupForm.submit()} maskClosable={false}>
                <Form form={groupForm} layout="vertical" onFinish={handleUpdateGroup}>
                    <Form.Item name="name" label="Nome do Grupo" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="teamIds" label="Times do Grupo" rules={[{ required: true }]}>
                        <Select mode="multiple" placeholder="Selecione os times">
                            {championship.teams?.filter((ct: any) => {
                                // Show teams not in any group OR teams already in this group
                                const isAlreadyInAnotherGroup = standings.some(g => g.groupId !== selectedGroup?.id && g.standings.some((s: any) => s.teamName === ct.team.name));
                                return !isAlreadyInAnotherGroup;
                            }).map((ct: any) => (
                                <Select.Option key={ct.team.id} value={ct.team.id}>{ct.team.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div >
    );
};

export default ChampionshipDetailPage;
