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
    Avatar,
    Card,
} from 'antd';
import {
    TrophyOutlined,
    CalendarOutlined,
    FireOutlined,
    EnvironmentOutlined,
    EditOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';
import ChampionshipModal from '../../components/ChampionshipModal';
import { usePageTitle } from '../../components/Layout/AppLayout';
import { getBracketLabels } from '../../utils/bracketLabels';

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

import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const ChampionshipDetailPage: React.FC = () => {
    const { user } = useAuth();
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
    const [submitting, setSubmitting] = useState(false);

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
    const [isRenameLabelsModalOpen, setIsRenameLabelsModalOpen] = useState(false);
    const [nextPhasePreview, setNextPhasePreview] = useState<any>(null);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [matchGoals, setMatchGoals] = useState<any[]>([]);
    const initializedRef = React.useRef<string | null>(null);

    // Forms
    const [resultForm] = Form.useForm();
    const [detailsForm] = Form.useForm();
    const [manualMatchForm] = Form.useForm();
    const [editTeamsForm] = Form.useForm();
    const [groupForm] = Form.useForm();
    const [renameLabelsForm] = Form.useForm();

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

    const loadAllData = async (cid: string, isInitial = false) => {
        if (isInitial) setLoading(true);
        await Promise.all([
            fetchChampionship(cid),
            fetchMatches(cid),
            fetchStandings(cid),
            fetchScorers(cid),
        ]);
        if (isInitial) {
            await fetchTeams();
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id && (!championship || championship.id !== id)) {
            loadAllData(id, true);
        }
    }, [id, championship?.id]);

    useEffect(() => {
        // Só executa se houver jogos e se ainda não inicializamos para este campeonato específico
        if (matches.length === 0 || initializedRef.current === id) return;

        const phaseOrder = ['GROUP', 'LEAGUE', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL'];
        const existingPhases = [...new Set(matches.map((m: any) => m.phase || 'GROUP'))];
        const sortedPhases = existingPhases.sort((a: any, b: any) => phaseOrder.indexOf(a) - phaseOrder.indexOf(b)) as string[];

        let targetPhase = sortedPhases[0];
        let targetRound = 1;

        for (const phase of sortedPhases) {
            const pMatches = matches.filter((m: any) => (m.phase || 'GROUP') === phase);
            
            // Encontra todos os jogos incompletos da fase
            const incompleteMatches = pMatches.filter((m: any) => m.status !== 'FINISHED');
            
            if (incompleteMatches.length > 0) {
                targetPhase = phase;
                // Pegamos a MENOR rodada que ainda tem jogo incompleto
                const roundsWithIncomplete = incompleteMatches.map((m: any) => m.round || 1);
                targetRound = Math.min(...roundsWithIncomplete);
                break;
            } else {
                // Se todos os jogos da fase acabaram, vamos para a última rodada dessa fase
                const allRounds = [...new Set(pMatches.map((m: any) => m.round || 1))] as number[];
                const lastRound = Math.max(...allRounds, 1);
                targetPhase = phase;
                targetRound = lastRound;
                // O loop continua para ver se há uma próxima fase com jogos
            }
        }
        
        setActivePhase(targetPhase);
        setCurrentRound(targetRound);
        initializedRef.current = id || null;
    }, [matches, id]);

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
            const [homeRes, awayRes] = await Promise.all([
                api.get(`/teams/${match.homeTeamId}`),
                api.get(`/teams/${match.awayTeamId}`)
            ]);
            const homeTeam = homeRes.data;
            const awayTeam = awayRes.data;
            setPlayers([
                ...(homeTeam?.players?.map((p: any) => ({ ...p, teamName: homeTeam.name, teamId: homeTeam.id })) || []),
                ...(awayTeam?.players?.map((p: any) => ({ ...p, teamName: awayTeam.name, teamId: awayTeam.id })) || [])
            ]);
        } catch (err) { console.error(err); }
        setIsResultModalOpen(true);
    };

    const handleSaveResult = async (values: any) => {
        setSubmitting(true);
        const hide = message.loading('Salvando resultado...', 0);
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
            await Promise.all([fetchMatches(id!), fetchStandings(id!), fetchScorers(id!)]);
            hide();
        } catch (err) { 
            console.error(err); 
            hide();
            message.error('Erro ao salvar resultado');
        } finally {
            setSubmitting(false);
        }
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
        setSubmitting(true);
        const hide = message.loading('Iniciando campeonato...', 0);
        try {
            await api.post(`/championships/${id}/finalize`);
            trackEvent('championship_started', { championship_id: id });
            hide();
            message.success('Campeonato iniciado com sucesso!');
            fetchChampionship(id!);
            fetchMatches(id!);
            fetchStandings(id!);
        } catch (err) {
            console.error(err);
            hide();
            message.error('Erro ao iniciar campeonato');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFinishChampionship = async () => {
        setSubmitting(true);
        const hide = message.loading('Finalizando campeonato...', 0);
        try {
            await api.post(`/championships/${id}/finish`);
            trackEvent('championship_ended', { championship_id: id });
            hide();
            message.success('Campeonato finalizado com sucesso!');
            await Promise.all([fetchChampionship(id!), fetchMatches(id!)]);
        } catch (err) {
            console.error(err);
            hide();
            message.error('Erro ao finalizar campeonato');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveLabels = async (labels: Record<string, string>) => {
        try {
            await api.patch(`/championships/${id}`, { bracketLabels: labels });
            await fetchChampionship(id!);
            message.success('Rótulos das séries atualizados!');
        } catch (err) {
            console.error(err);
            message.error('Erro ao salvar rótulos');
        }
    };

    const handleSaveLabelsFromModal = async (values: any) => {
        await handleSaveLabels({
            GOLD: values.gold,
            SILVER: values.silver,
            finalLabel: values.finalLabel,
            thirdPlaceLabel: values.thirdPlaceLabel,
        });
        setIsRenameLabelsModalOpen(false);
    };

    const handleDeleteChampionship = async () => {
        Modal.confirm({
            title: 'Excluir Campeonato',
            content: 'Tem certeza que deseja excluir este campeonato? Todos os dados vinculados (jogos, grupos, artilharia) serão perdidos permanentemente.',
            okText: 'Sim, Excluir',
            cancelText: 'Cancelar',
            okType: 'danger',
            onOk: async () => {
                setSubmitting(true);
                const hide = message.loading('Excluindo campeonato...', 0);
                try {
                    await api.delete(`/championships/${id}`);
                    trackEvent('championship_deleted', { championship_id: id });
                    hide();
                    message.success('Campeonato excluído com sucesso!');
                    navigate('/championships');
                } catch (error) {
                    console.error(error);
                    hide();
                    message.error('Erro ao excluir campeonato');
                } finally {
                    setSubmitting(false);
                }
            }
        });
    };

    const handleUpdateConfig = async (values: any) => {
        const structuralFields = ['format', 'teamCount', 'groupCount', 'advancingCount'];
        const isStructuralChange = structuralFields.some(field => values[field] !== undefined && values[field] !== (championship as any)[field]);
        
        const performUpdate = async () => {
            setSubmitting(true);
            const hide = message.loading('Salvando configurações...', 0);
            try {
                await api.patch(`/championships/${id}`, values);
                trackEvent('championship_configured', { championship_id: id });
                setIsConfigModalOpen(false);
                await Promise.all([fetchChampionship(id!), fetchMatches(id!)]);
                hide();
                message.success('Configurações salvas!');
            } catch (err) {
                console.error(err);
                hide();
                message.error('Erro ao salvar configurações');
            } finally {
                setSubmitting(false);
            }
        };

        if (isStructuralChange && matches.length > 0) {
            Modal.confirm({
                title: 'Aviso de Mudança Estrutural',
                content: 'Alterar estas configurações irá apagar todos os confrontos já definidos. Deseja continuar?',
                onOk: performUpdate
            });
        } else {
            performUpdate();
        }
    };

    const handleResetGroups = async () => {
        Modal.confirm({
            title: 'Redefinir Grupos',
            content: 'Deseja remover todos os times dos grupos e limpar os jogos? Esta ação não pode ser desfeita.',
            okText: 'Sim, Redefinir',
            cancelText: 'Cancelar',
            okType: 'danger',
            onOk: async () => {
                setSubmitting(true);
                const hide = message.loading('Redefinindo grupos...', 0);
                try {
                    await api.post(`/championships/${id}/groups/reset`);
                    await Promise.all([fetchStandings(id!), fetchMatches(id!), fetchChampionship(id!)]);
                    hide();
                    message.success('Grupos redefinidos com sucesso!');
                } catch (error) {
                    console.error(error);
                    hide();
                    message.error('Erro ao redefinir grupos');
                } finally {
                    setSubmitting(false);
                }
            }
        });
    };

    const handleEditTeams = async (values: any) => {
        setSubmitting(true);
        const hide = message.loading('Definindo times do campeonato...', 0);
        try {
            const rawTeamIdentifiers = values.teamIds || [];
            if (rawTeamIdentifiers.length > (championship.teamCount || 0)) {
                hide();
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
            await Promise.all([fetchChampionship(id!), fetchTeams()]);
            hide();
            message.success('Times atualizados com sucesso!');
        } catch (error) {
            console.error('Error updating teams', error);
            hide();
            message.error('Erro ao atualizar times');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateGroup = async (values: any) => {
        const hide = message.loading('Salvando grupo...', 0);
        try {
            const tc = Number(championship.teamCount) || 0;
            const gc = Number(championship.groupCount) || 1;
            const tpb = Math.ceil(tc / gc);
            if (values.teamIds && values.teamIds.length > tpb) {
                hide();
                message.error(`Limite de times por grupo excedido! Máximo de ${tpb} times por grupo.`);
                return;
            }
            if (!selectedGroup?.id) {
                hide();
                message.error('ID do grupo não encontrado. Tente reabrir o modal.');
                return;
            }
            await api.patch(`/championships/groups/${selectedGroup.id}`, values);
            setIsEditGroupModalOpen(false);
            groupForm.resetFields();
            await Promise.all([fetchStandings(id!), fetchChampionship(id!)]);
            hide();
            message.success('Grupo atualizado com sucesso!');
        } catch (error) {
            console.error(error);
            hide();
            message.error('Erro ao atualizar grupo');
        }
    };

    const handleGenerateGroupMatches = async (groupId: string) => {
        const hide = message.loading('Sorteando confrontos do grupo...', 0);
        try {
            await api.post(`/championships/groups/${groupId}/generate-matches`);
            await Promise.all([fetchMatches(id!), fetchStandings(id!), fetchChampionship(id!)]);
            hide();
            message.success('Confrontos do grupo gerados!');
        } catch (error) { 
            console.error(error); 
            hide();
            message.error('Erro ao gerar confrontos do grupo');
        }
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
            const phaseOrder = ['GROUP', 'LEAGUE', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL'];
            const currentPhase = matches.reduce((latest: string, m: any) => {
                const p = m.phase || 'GROUP';
                return phaseOrder.indexOf(p) > phaseOrder.indexOf(latest) ? p : latest;
            }, 'GROUP');
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

    // Determine champion and silver champion
    let championName = championship?.champion;
    let silverChampionName = championship?.silverChampion;

    if (championship?.status === 'FINISHED' && !championName) {
        if (championship.format === 'LEAGUE') {
            const table = standings[0]?.standings;
            if (table?.length > 0) championName = table[0].teamName || table[0].name;
        } else {
            const finalMatches = matches.filter(m => m.phase === 'FINAL');
            
            const goldFinal = finalMatches.find(m => (m.bracket || 'GOLD') === 'GOLD');
            const targetFinal = goldFinal || finalMatches[0];
            if (targetFinal && targetFinal.status === 'FINISHED') {
                const hScore = targetFinal.homeScore ?? 0;
                const aScore = targetFinal.awayScore ?? 0;
                if (hScore > aScore) {
                    championName = targetFinal.homeTeam?.name;
                } else if (aScore > hScore) {
                    championName = targetFinal.awayTeam?.name;
                } else {
                    const hPen = targetFinal.homePenalties ?? 0;
                    const aPen = targetFinal.awayPenalties ?? 0;
                    championName = hPen >= aPen ? targetFinal.homeTeam?.name : targetFinal.awayTeam?.name;
                }
            }

            const silverFinal = finalMatches.find(m => m.bracket === 'SILVER');
            if (silverFinal && silverFinal.status === 'FINISHED') {
                const hScore = silverFinal.homeScore ?? 0;
                const aScore = silverFinal.awayScore ?? 0;
                if (hScore > aScore) {
                    silverChampionName = silverFinal.homeTeam?.name;
                } else if (aScore > hScore) {
                    silverChampionName = silverFinal.awayTeam?.name;
                } else {
                    const hPen = silverFinal.homePenalties ?? 0;
                    const aPen = silverFinal.awayPenalties ?? 0;
                    silverChampionName = hPen >= aPen ? silverFinal.homeTeam?.name : silverFinal.awayTeam?.name;
                }
            }
        }
    }

    // Determine runner-up (vice) and 3rd place
    let viceName = '';
    let thirdPlaceName = '';

    if (championship?.status === 'FINISHED') {
        if (championship.format === 'LEAGUE') {
            const table = standings[0]?.standings;
            if (table?.length > 1) viceName = table[1].teamName || table[1].name;
            if (table?.length > 2) thirdPlaceName = table[2].teamName || table[2].name;
        } else {
            const finalMatches = matches.filter(m => m.phase === 'FINAL');
            const goldFinal = finalMatches.find(m => (m.bracket || 'GOLD') === 'GOLD' && (m.round || 1) === 1);
            if (goldFinal && goldFinal.status === 'FINISHED') {
                viceName = goldFinal.homeTeam?.name === championName ? goldFinal.awayTeam?.name : goldFinal.homeTeam?.name;
            }

            const thirdFinal = finalMatches.find(m => (m.bracket || 'GOLD') === 'GOLD' && m.round === 2);
            if (thirdFinal && thirdFinal.status === 'FINISHED') {
                const hScore = thirdFinal.homeScore ?? 0;
                const aScore = thirdFinal.awayScore ?? 0;
                if (hScore > aScore) {
                    thirdPlaceName = thirdFinal.homeTeam?.name;
                } else if (aScore > hScore) {
                    thirdPlaceName = thirdFinal.awayTeam?.name;
                } else {
                    const hPen = thirdFinal.homePenalties ?? 0;
                    const aPen = thirdFinal.awayPenalties ?? 0;
                    thirdPlaceName = hPen >= aPen ? thirdFinal.homeTeam?.name : thirdFinal.awayTeam?.name;
                }
            }
        }
    }

    const championTeam = championship?.teams?.find((t: any) => t.team?.name === championName);
    const championLogo = championTeam?.team?.logoUrl;

    const viceTeam = championship?.teams?.find((t: any) => t.team?.name === viceName);
    const viceLogo = viceTeam?.team?.logoUrl;

    const thirdPlaceTeam = championship?.teams?.find((t: any) => t.team?.name === thirdPlaceName);
    const thirdPlaceLogo = thirdPlaceTeam?.team?.logoUrl;

    const silverChampTeam = championship?.teams?.find((t: any) => t.team?.name === silverChampionName);
    const silverChampLogo = silverChampTeam?.team?.logoUrl;

    return (
        <div style={{ paddingBottom: '24px' }}>
            <ChampionshipHeader championship={championship} onOpenConfig={() => setIsConfigModalOpen(true)} />

            {championName && (
                <div>
                    {/* CHAMPION */}
                    <div style={{
                        marginBottom: 16, textAlign: 'center', padding: '24px 20px',
                        background: 'linear-gradient(135deg, rgba(250,219,20,0.12) 0%, rgba(250,219,20,0.06) 100%)',
                        borderRadius: token.borderRadiusLG,
                        border: '1px solid rgba(250,219,20,0.35)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(250,219,20,0.08)'
                    }}>
                        <TrophyOutlined style={{ fontSize: '38px', color: '#fadb14', marginBottom: 8, display: 'block' }} />
                        <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'block', marginBottom: 6, color: '#b8960c' }}>
                            Campeão
                        </Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {championLogo && (
                                <Avatar src={championLogo} size={40} style={{ border: '2px solid #fadb14', background: '#fff' }} />
                            )}
                            <Title level={2} style={{ margin: 0, color: '#b8960c', fontWeight: 800 }}>
                                {championName}
                            </Title>
                        </div>
                    </div>

                    {/* VICE AND 3RD PLACE */}
                    {(viceName || thirdPlaceName) && (
                        <Row gutter={16} style={{ marginBottom: 24 }}>
                            {viceName && (
                                <Col span={thirdPlaceName ? 12 : 24}>
                                    <Card size="small" style={{
                                        borderRadius: token.borderRadiusLG,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        background: token.colorFillAlter,
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '4px 0' }}>
                                            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Vice:</Text>
                                            {viceLogo && <Avatar src={viceLogo} size={24} style={{ background: '#fff', border: `1px solid ${token.colorBorderSecondary}` }} />}
                                            <Text strong style={{ fontSize: 14 }}>{viceName}</Text>
                                        </div>
                                    </Card>
                                </Col>
                            )}
                            {thirdPlaceName && (
                                <Col span={viceName ? 12 : 24}>
                                    <Card size="small" style={{
                                        borderRadius: token.borderRadiusLG,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        background: token.colorFillAlter,
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '4px 0' }}>
                                            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>3º Lugar:</Text>
                                            {thirdPlaceLogo && <Avatar src={thirdPlaceLogo} size={24} style={{ background: '#fff', border: `1px solid ${token.colorBorderSecondary}` }} />}
                                            <Text strong style={{ fontSize: 14 }}>{thirdPlaceName}</Text>
                                        </div>
                                    </Card>
                                </Col>
                            )}
                        </Row>
                    )}

                    {/* SILVER CHAMPION */}
                    {silverChampionName && (
                        <div style={{
                            marginBottom: 24, padding: '14px 20px',
                            background: 'linear-gradient(135deg, rgba(140,140,140,0.08) 0%, rgba(140,140,140,0.04) 100%)',
                            borderRadius: token.borderRadiusLG,
                            border: '1px solid rgba(140,140,140,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                        }}>
                            <TrophyOutlined style={{ fontSize: '20px', color: '#bfbfbf' }} />
                            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: '#8c8c8c' }}>
                                {`Campeão ${getBracketLabels(championship).silver}:`}
                            </Text>
                            {silverChampLogo && (
                                <Avatar src={silverChampLogo} size={28} style={{ border: '1px solid #bfbfbf', background: '#fff' }} />
                            )}
                            <Text strong style={{ fontSize: 14, color: '#595959' }}>
                                {silverChampionName}
                            </Text>
                        </div>
                    )}
                </div>
            )}

            {user?.role && user.role !== 'USER' && (
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
                            loading={submitting}
                            onStartNextPhase={async () => {
                                setSubmitting(true);
                                const hide = message.loading(`Iniciando ${nextPhaseName}...`, 0);
                                try {
                                    const res = await api.post(`/championships/${id}/next-phase-preview`);
                                    setNextPhasePreview(res.data);
                                    setIsNextPhaseModalOpen(true);
                                    hide();
                                } catch (err) { 
                                    console.error(err); 
                                    hide();
                                    message.error('Erro ao calcular próxima fase');
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                            onAutoResults={async () => {
                                setSubmitting(true);
                                const hide = message.loading('Gerando resultados...', 0);
                                try {
                                    await api.post(`/championships/${id}/auto-results`);
                                    await Promise.all([fetchMatches(id!), fetchScorers(id!), fetchStandings(id!)]);
                                    hide();
                                    message.success('Resultados gerados com sucesso!');
                                } catch (err) { 
                                    console.error(err); 
                                    hide();
                                    message.error('Erro ao gerar resultados');
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                            onAutoDistributeTeams={async () => {
                                setSubmitting(true);
                                const hide = message.loading('Sorteando grupos...', 0);
                                try {
                                    await api.post(`/championships/${id}/auto-distribute-teams`);
                                    await fetchStandings(id!);
                                    hide();
                                    message.success('Times sorteados nos grupos!');
                                } catch (err) { 
                                    console.error(err); 
                                    hide();
                                    message.error('Erro ao sortear grupos');
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                            onGenerateAllMatches={async () => {
                                setSubmitting(true);
                                const hide = message.loading('Sorteando confrontos...', 0);
                                try {
                                    await api.post(`/championships/${id}/generate-all-matches`);
                                    await fetchMatches(id!);
                                    hide();
                                    message.success('Confrontos sorteados!');
                                } catch (err) { 
                                    console.error(err); 
                                    hide();
                                    message.error('Erro ao sortear confrontos');
                                } finally {
                                    setSubmitting(false);
                                }
                            }}
                            onRenameSeries={user?.role === 'ADMIN' ? () => {
                                const current = getBracketLabels(championship);
                                renameLabelsForm.setFieldsValue({
                                    gold: current.gold,
                                    silver: current.silver,
                                    finalLabel: current.finalLabel,
                                    thirdPlaceLabel: current.thirdPlaceLabel,
                                });
                                setIsRenameLabelsModalOpen(true);
                            } : undefined}
                            standings={standings}
                        />
                    </Col>
                </Row>
            )}

            {championship.status === 'DRAFT' && championship.format === 'GROUPS_KNOCKOUT' && standings.length > 0 && championship.teams && championship.teams.length > 0 && (
                <GroupsOverview
                    championship={championship}
                    standings={standings}
                    loading={submitting}
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

            {championship.teams && championship.teams.length > 0 && (
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
                        ...(matches.length > 0 ? [{
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
                                    onOpenDetailsModal={(m: any) => {
                                        setSelectedMatch(m);
                                        detailsForm.setFieldsValue({ location: m.location, dateTime: m.dateTime ? dayjs(m.dateTime) : null });
                                        setIsDetailsModalOpen(true);
                                    }}
                                    onOpenManualMatchModal={() => setIsManualMatchModalOpen(true)}
                                />
                            )
                        }] : []),
                        ...(championship.status !== 'DRAFT' ? [{
                            key: 'scorers',
                            label: <span><FireOutlined /> Artilharia</span>,
                            children: <ScorersTab scorers={scorers} />
                        }] : [])
                    ]}
                />
            )}

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
                    matches={matches}
                    preview={nextPhasePreview}
                    onSaveLabels={user?.role === 'ADMIN' ? handleSaveLabels : undefined}
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

            {/* Modal de Renomear Séries (ADMIN, STARTED/FINISHED) */}
            <Modal
                title={<><EditOutlined style={{ marginRight: 8 }} />Renomear Séries</>}
                open={isRenameLabelsModalOpen}
                onCancel={() => setIsRenameLabelsModalOpen(false)}
                onOk={() => renameLabelsForm.submit()}
                okText="Salvar"
                width={420}
            >
                <Form
                    form={renameLabelsForm}
                    layout="vertical"
                    onFinish={handleSaveLabelsFromModal}
                >
                    <Form.Item name="gold" label="Nome da Série Principal">
                        <Input placeholder="Série Ouro" />
                    </Form.Item>
                    <Form.Item name="silver" label="Nome da Série Consolação">
                        <Input placeholder="Série Prata" />
                    </Form.Item>
                    <Form.Item name="finalLabel" label="Rótulo da Grande Final">
                        <Input placeholder="Grande Final" />
                    </Form.Item>
                    <Form.Item name="thirdPlaceLabel" label="Rótulo da Disputa de 3º Lugar">
                        <Input placeholder="Disputa de 3º Lugar" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ChampionshipDetailPage;
