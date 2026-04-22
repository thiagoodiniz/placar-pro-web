import React, { useEffect, useState } from 'react';
import { trackEvent } from '../../services/analytics';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography,
    Row,
    Col,
    Tabs,
    Modal,
    Form,
    Input,
    Select,
    message,
    InputNumber,
    DatePicker,
    Spin,
    theme,
    Empty,
} from 'antd';
import {
    TrophyOutlined,
    CalendarOutlined,
    FireOutlined,
    EnvironmentOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';
import ChampionshipModal from '../../components/ChampionshipModal';
import { usePageTitle } from '../../components/Layout/AppLayout';

// Sub-components
import ChampionshipHeader from './components/ChampionshipHeader';
import ManagementCard from './components/ManagementCard';
import GroupsOverview from './components/GroupsOverview';
import StandingsTab from './components/StandingsTab';
import MatchesTab from './components/MatchesTab';
import ScorersTab from './components/ScorersTab';
import MatchResultModal from './components/MatchResultModal';
import TeamPicker from './components/TeamPicker';
import NextPhaseModal from './components/NextPhaseModal';

const { Title, Text } = Typography;

const ChampionshipDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const { setTitle, setBackUrl } = usePageTitle();

    const [championship, setChampionship] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [matches, setMatches] = useState<any[]>([]);
    const [standings, setStandings] = useState<any[]>([]);
    const [scorers, setScorers] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [players, setPlayers] = useState<any[]>([]);

    // UI State
    const [activeTab, setActiveTab] = useState('standings');
    const [activePhase, setActivePhase] = useState('GROUP');
    const [currentRound, setCurrentRound] = useState(1);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [isEditTeamsModalOpen, setIsEditTeamsModalOpen] = useState(false);
    const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isManualMatchModalOpen, setIsManualMatchModalOpen] = useState(false);
    const [isNextPhaseModalOpen, setIsNextPhaseModalOpen] = useState(false);
    const [nextPhasePreview, setNextPhasePreview] = useState<any>(null);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [matchGoals, setMatchGoals] = useState<any[]>([]);

    // Forms
    const [resultForm] = Form.useForm();
    const [detailsForm] = Form.useForm();
    const [manualMatchForm] = Form.useForm();
    const [editTeamsForm] = Form.useForm();
    const [groupForm] = Form.useForm();

    const fetchChampionship = async (cid: string) => {
        try {
            const res = await api.get(`/championships/${cid}`);
            setChampionship(res.data);
            setTitle(res.data.name);
            setBackUrl('/championships');
        } catch (err) { console.error(err); }
    };

    const fetchMatches = async (cid: string) => {
        try {
            const res = await api.get(`/matches?championshipId=${cid}`);
            setMatches(res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchStandings = async (cid: string) => {
        try {
            const res = await api.get(`/championships/${cid}/standings`);
            setStandings(res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchScorers = async (cid: string) => {
        try {
            const res = await api.get(`/championships/${cid}/scorers`);
            setScorers(res.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchTeams = async () => {
        try {
            const res = await api.get('/teams');
            setTeams(res.data || []);
        } catch (err) { console.error(err); }
    };

    const loadAllData = async (cid: string) => {
        setLoading(true);
        await Promise.all([
            fetchChampionship(cid),
            fetchMatches(cid),
            fetchStandings(cid),
            fetchScorers(cid),
            fetchTeams(),
        ]);
        setLoading(false);
    };

    useEffect(() => {
        if (id) loadAllData(id);
    }, [id]);

    useEffect(() => {
        if (activeTab !== 'matches' || matches.length === 0) return;
        const phaseOrder = ['GROUP', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL'];
        const existingPhases = [...new Set(matches.map((m: any) => m.phase || 'GROUP'))];
        const sortedPhases = existingPhases.sort((a: any, b: any) => phaseOrder.indexOf(a) - phaseOrder.indexOf(b)) as string[];

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
        setMatchGoals((match.goals || []).map((g: any) => ({
            ...g,
            id: g.id || Math.random().toString(36).substr(2, 9)
        })));
        resultForm.setFieldsValue({
            homeScore: match.status === 'FINISHED' ? match.homeScore : (match.homeScore ?? undefined),
            awayScore: match.status === 'FINISHED' ? match.awayScore : (match.awayScore ?? undefined),
            homePenalties: match.homePenalties ?? undefined,
            awayPenalties: match.awayPenalties ?? undefined,
        });

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
                    id: g.id,
                    playerId: g.playerId,
                    teamId: g.teamId,
                    playerName: g.playerName,
                    teamName: g.teamName
                }))
            });
            trackEvent('score_updated', { match_id: selectedMatch.id, championship_id: id });
            if (values.status === 'FINISHED') {
                trackEvent('match_finished', { match_id: selectedMatch.id, championship_id: id });
            }
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
            await api.post(`/championships/match`, { championshipId: id, ...values });
            setIsManualMatchModalOpen(false);
            manualMatchForm.resetFields();
            fetchMatches(id!);
        } catch (err) { console.error(err); }
    };

    const handleFinalize = async () => {
        try {
            await api.post(`/championships/${id}/finalize`);
            trackEvent('championship_started', { championship_id: id });
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
            trackEvent('championship_ended', { championship_id: id });
            message.success('Campeonato finalizado com sucesso!');
            fetchChampionship(id!);
            fetchMatches(id!);
        } catch (err) {
            console.error(err);
            message.error('Erro ao finalizar campeonato');
        }
    };

    const handleDeleteChampionship = async () => {
        Modal.confirm({
            title: 'Excluir Campeonato',
            content: 'Tem certeza que deseja excluir este campeonato? Todos os dados vinculados (jogos, grupos, artilharia) serão perdidos permanentemente.',
            okText: 'Sim, Excluir',
            cancelText: 'Cancelar',
            okType: 'danger',
            onOk: async () => {
                try {
                    await api.delete(`/championships/${id}`);
                    trackEvent('championship_deleted', { championship_id: id });
                    message.success('Campeonato excluído com sucesso!');
                    navigate('/championships');
                } catch (error) {
                    console.error(error);
                    message.error('Erro ao excluir campeonato');
                }
            }
        });
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
                trackEvent('championship_configured', { championship_id: id });
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
                if (existingById) { finalTeamIds.push(identifier); continue; }
                const existingByName = teams.find((t: any) => t.name.toLowerCase() === identifier.toLowerCase());
                if (existingByName) { finalTeamIds.push((existingByName as any).id); continue; }
                const teamRes = await api.post('/teams', { name: identifier });
                finalTeamIds.push(teamRes.data.id);
            }
            await api.post('/teams/championship', { championshipId: id, teamIds: finalTeamIds });
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

    // Group matches by phase
    const groupedMatches = React.useMemo(() => {
        return matches.reduce((acc: any, match: any) => {
            const phase = match.phase || 'GROUP';
            if (!acc[phase]) acc[phase] = [];
            acc[phase].push(match);
            return acc;
        }, {});
    }, [matches]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <Spin size="large">
                <div style={{ paddingTop: 40, color: token.colorTextSecondary }}>Carregando campeonato...</div>
            </Spin>
        </div>
    );

    if (!championship) return <Empty description="Campeonato não encontrado" />;

    // Determine phase logic for buttons
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
                        nextPhaseId = phaseOrder[phaseOrder.indexOf(currentPhase) + 1];
                        if (nextPhaseId) {
                            switch (nextPhaseId) {
                                case 'ROUND_16': nextPhaseName = 'Oitavas de Final'; break;
                                case 'QUARTER': nextPhaseName = 'Quartas de Final'; break;
                                case 'SEMI': nextPhaseName = 'Semifinal'; break;
                                case 'FINAL': nextPhaseName = 'Final'; break;
                            }
                        }
                    }
                }
            }
        }
    }

    // Determine champion
    let championTeam: any = null;
    if (championship?.status === 'FINISHED') {
        if (championship.format === 'LEAGUE') {
            const table = standings[0]?.standings;
            if (table?.length > 0) championTeam = table[0];
        } else {
            const finalMatches = matches.filter(m => m.phase === 'FINAL');
            if (finalMatches.length > 0 && finalMatches[0].status === 'FINISHED') {
                const m = finalMatches[0];
                championTeam = m.homeScore > m.awayScore ? { teamName: m.homeTeam?.name } : { teamName: m.awayTeam?.name };
            }
        }
    }

    return (
        <div style={{ paddingBottom: '24px' }}>
            <ChampionshipHeader championship={championship} onOpenConfig={() => setIsConfigModalOpen(true)} />

            {championTeam && (
                <div style={{
                    marginBottom: 24, textAlign: 'center', padding: '24px 20px',
                    background: 'linear-gradient(135deg, rgba(250,219,20,0.12) 0%, rgba(250,219,20,0.06) 100%)',
                    borderRadius: token.borderRadiusLG,
                    border: '1px solid rgba(250,219,20,0.35)',
                }}>
                    <TrophyOutlined style={{ fontSize: '36px', color: '#fadb14', marginBottom: 8, display: 'block' }} />
                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: 4 }}>Campeão</Text>
                    <Title level={2} style={{ margin: 0, color: '#b8960c' }}>{championTeam.teamName || championTeam.name}</Title>
                </div>
            )}

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={24}>
                    <ManagementCard
                        championship={championship}
                        matches={matches}
                        id={id!}
                        onEditTeams={() => {
                            editTeamsForm.setFieldsValue({ teamIds: championship.teams?.map((t: any) => t.teamId) || [] });
                            setIsEditTeamsModalOpen(true);
                        }}
                        onFinalize={handleFinalize}
                        onResetGroups={handleResetGroups}
                        onDeleteChampionship={handleDeleteChampionship}
                        onFinishChampionship={handleFinishChampionship}
                        canStartNextPhase={canStartNextPhase}
                        nextPhaseName={nextPhaseName}
                        canFinishChampionship={canFinishChampionship}
                        onStartNextPhase={async () => {
                            try {
                                const res = await api.post(`/championships/${id}/next-phase-preview`);
                                setNextPhasePreview(res.data);
                                setIsNextPhaseModalOpen(true);
                            } catch (err) { console.error(err); }
                        }}
                        onAutoResults={async () => {
                            try {
                                await api.post(`/championships/${id}/auto-results`);
                                message.success('Resultados gerados com sucesso!');
                                fetchMatches(id!); fetchScorers(id!); fetchStandings(id!);
                            } catch (err) { console.error(err); }
                        }}
                        onAutoDistributeTeams={async () => {
                            try {
                                await api.post(`/championships/${id}/auto-distribute-teams`);
                                message.success('Times sorteados nos grupos!');
                                fetchStandings(id!);
                            } catch (err) { console.error(err); }
                        }}
                        onGenerateAllMatches={async () => {
                            try {
                                await api.post(`/championships/${id}/generate-all-matches`);
                                message.success('Confrontos sorteados!');
                                fetchMatches(id!);
                            } catch (err) { console.error(err); }
                        }}
                        standings={standings}
                    />
                </Col>
            </Row>

            {championship.status === 'DRAFT' && championship.format === 'GROUPS_KNOCKOUT' && standings.length > 0 && (
                <GroupsOverview
                    championship={championship}
                    standings={standings}
                    onEditGroup={(group) => {
                        setSelectedGroup({ id: group.groupId, name: group.groupName, teams: group.standings });
                        const currentTeamIds = group.standings
                            .map((s: any) => championship.teams?.find((ct: any) => ct.team?.name === s.teamName)?.teamId)
                            .filter(Boolean);
                        groupForm.setFieldsValue({
                            name: group.groupName,
                            teamIds: currentTeamIds
                        });
                        setIsEditGroupModalOpen(true);
                    }}
                    onGenerateMatches={handleGenerateGroupMatches}
                    onRemoveTeam={async (teamName) => {
                        const remainingTeams = championship.teams
                            .filter((t: any) => t.team.name !== teamName)
                            .map((t: any) => t.teamId);
                        await api.post('/teams/championship', { championshipId: id, teamIds: remainingTeams });
                        fetchChampionship(id!);
                    }}
                />
            )}

            <Tabs
                activeKey={activeTab}
                onChange={(key) => {
                    setActiveTab(key);
                    if (key === 'scorers') trackEvent('viewed_scorers_tab', { championship_id: id });
                    if (key === 'standings') trackEvent('viewed_standings_tab', { championship_id: id });
                }}
                items={[
                    {
                        key: 'standings',
                        label: <span><TrophyOutlined /> Classificação</span>,
                        children: <StandingsTab standings={standings} championship={championship} />
                    },
                    {
                        key: 'matches',
                        label: <span><CalendarOutlined /> Jogos</span>,
                        children: (
                            <MatchesTab
                                groupedMatches={groupedMatches}
                                activePhase={groupedMatches[activePhase] ? activePhase : Object.keys(groupedMatches)[0]}
                                setActivePhase={setActivePhase}
                                currentRound={currentRound}
                                setCurrentRound={setCurrentRound}
                                championship={championship}
                                onOpenResultModal={handleOpenResultModal}
                                onOpenDetailsModal={(m) => {
                                    setSelectedMatch(m);
                                    detailsForm.setFieldsValue({ location: m.location, dateTime: m.dateTime ? dayjs(m.dateTime) : null });
                                    setIsDetailsModalOpen(true);
                                }}
                                onOpenManualMatchModal={() => setIsManualMatchModalOpen(true)}
                            />
                        )
                    },
                    {
                        key: 'scorers',
                        label: <span><FireOutlined /> Artilharia</span>,
                        children: <ScorersTab scorers={scorers} />
                    }
                ]}
            />

            <MatchResultModal
                open={isResultModalOpen}
                onCancel={() => setIsResultModalOpen(false)}
                match={selectedMatch}
                form={resultForm}
                players={players}
                matchGoals={matchGoals}
                onAddGoal={addGoal}
                onRemoveGoal={removeGoal}
                onFinish={handleSaveResult}
            />

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

            <Modal title="Definir Confronto Manual" open={isManualMatchModalOpen} onCancel={() => setIsManualMatchModalOpen(false)} onOk={() => manualMatchForm.submit()}>
                <Form form={manualMatchForm} layout="vertical" onFinish={handleCreateManualMatch}>
                    {championship.format === 'GROUPS_KNOCKOUT' && (
                        <Form.Item name="groupId" label="Grupo" rules={[{ required: true }]}>
                            <Select placeholder="Selecione o grupo">
                                {standings.map(g => (
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
                                    { label: 'Grupo', value: 'GROUP' }, { label: 'Oitavas', value: 'ROUND_16' },
                                    { label: 'Quartas', value: 'QUARTER' }, { label: 'Semi', value: 'SEMI' },
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

            <ChampionshipModal open={isConfigModalOpen} onCancel={() => setIsConfigModalOpen(false)} onSave={handleUpdateConfig} initialValues={championship} isEditing={true} />

            <Modal title="Definir Times" open={isEditTeamsModalOpen} onCancel={() => setIsEditTeamsModalOpen(false)} onOk={() => editTeamsForm.submit()} width={480}>
                <Form form={editTeamsForm} layout="vertical" onFinish={handleEditTeams}>
                    <Form.Item name="teamIds">
                        <TeamPicker
                            teams={teams}
                            max={championship?.teamCount || 99}
                            value={editTeamsForm.getFieldValue('teamIds') || []}
                            onChange={(ids) => editTeamsForm.setFieldsValue({ teamIds: ids })}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={`Editar ${selectedGroup?.name || 'Grupo'}`}
                open={isEditGroupModalOpen}
                onCancel={() => setIsEditGroupModalOpen(false)}
                onOk={() => groupForm.submit()}
                width={520}
            >
                <Form form={groupForm} layout="vertical" onFinish={handleUpdateGroup}>
                    <Form.Item name="name" label="Nome do Grupo" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="teamIds" label="Times do Grupo">
                        {(() => {
                            const teamsPerGroup = Math.ceil((championship.teamCount || 0) / (championship.groupCount || 1));
                            const takenInOtherGroups = standings
                                .filter((g: any) => g.groupId !== selectedGroup?.id)
                                .flatMap((g: any) => g.standings.map((s: any) =>
                                    championship.teams?.find((ct: any) => ct.team?.name === s.teamName)?.teamId
                                ).filter(Boolean));
                            const availableTeams = (championship.teams || [])
                                .filter((ct: any) => !takenInOtherGroups.includes(ct.teamId))
                                .map((ct: any) => ct.team)
                                .filter(Boolean);
                            return (
                                <TeamPicker
                                    teams={availableTeams}
                                    max={teamsPerGroup}
                                    value={groupForm.getFieldValue('teamIds') || []}
                                    onChange={(ids) => groupForm.setFieldsValue({ teamIds: ids })}
                                />
                            );
                        })()}
                    </Form.Item>
                </Form>
            </Modal>
            {nextPhasePreview && (
                <NextPhaseModal
                    isOpen={isNextPhaseModalOpen}
                    onClose={() => setIsNextPhaseModalOpen(false)}
                    championship={championship}
                    standings={standings}
                    preview={nextPhasePreview}
                    onSave={async (matchesToSave) => {
                        try {
                            await api.post(`/championships/${id}/next-phase`, { matches: matchesToSave });
                            message.success(`${nextPhaseName} iniciada!`);
                            setIsNextPhaseModalOpen(false);
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
                />
            )}
        </div>
    );
};

export default ChampionshipDetailPage;
