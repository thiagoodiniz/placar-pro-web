import React, { useState, useEffect } from 'react';
import { Modal, Form, Typography, Button, theme, Tabs, Input, DatePicker, Checkbox, Collapse, message, Spin, Alert } from 'antd';
import { EnvironmentOutlined, PlusOutlined, LoadingOutlined, MinusOutlined } from '@ant-design/icons';
import PlayerModal from '../../TeamDetail/components/PlayerModal';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

const { Title, Text } = Typography;

interface MatchEditModalProps {
    open: boolean;
    onCancel: () => void;
    match: any;
    form: any;
    players: any[];
    matchGoals: any[];
    onAddGoal: (player: any) => void;
    onRemoveGoal: (goalId: string) => void;
    onFinish: (values: any) => void;
    confirmLoading?: boolean;
    onRefetchPlayers?: () => Promise<void>;
    loadingPlayers?: boolean;
}

const MatchResultModal: React.FC<MatchEditModalProps> = ({
    open,
    onCancel,
    match,
    form,
    players,
    matchGoals,
    onAddGoal,
    onRemoveGoal,
    onFinish,
    confirmLoading,
    onRefetchPlayers,
    loadingPlayers = false,
}) => {
    const { token } = theme.useToken();
    const { user } = useAuth();
    
    const [presentPlayerIds, setPresentPlayerIds] = useState<string[]>([]);
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
    const [addingPlayerTeamId, setAddingPlayerTeamId] = useState<string | null>(null);
    const [playerSubmitting, setPlayerSubmitting] = useState(false);
    const [playerForm] = Form.useForm();
    
    const homeScore = Form.useWatch('homeScore', form);
    const awayScore = Form.useWatch('awayScore', form);

    useEffect(() => {
        if (open && match) {
            setPresentPlayerIds(match.presences || []);
        } else {
            setPresentPlayerIds([]);
        }
    }, [open, match]);

    const handleTogglePresence = (playerId: string, checked: boolean, playerName: string) => {
        if (!checked) {
            const playerGoals = matchGoals.filter(g => g.playerId === playerId);
            if (playerGoals.length > 0) {
                playerGoals.forEach(g => onRemoveGoal(g.id));
                message.warning(`Gols de ${playerName} foram removidos pois sua presença foi desmarcada.`);
            }
            setPresentPlayerIds(prev => prev.filter(id => id !== playerId));
        } else {
            setPresentPlayerIds(prev => [...prev, playerId]);
        }
    };

    const handleOpenAddPlayerModal = (teamId: string) => {
        setAddingPlayerTeamId(teamId);
        playerForm.resetFields();
        setIsPlayerModalOpen(true);
    };

    const handleSavePlayers = async (values: any) => {
        if (!addingPlayerTeamId) return;
        setPlayerSubmitting(true);
        const hide = message.loading('Adicionando jogador(es)...', 0);
        try {
            const res = await api.post(`/teams/${addingPlayerTeamId}/players`, {
                players: values.players || []
            });

            if (onRefetchPlayers) {
                await onRefetchPlayers();
            }

            const newPlayers = Array.isArray(res.data) ? res.data : [res.data];
            const newIds = newPlayers.map((p: any) => p.id);
            setPresentPlayerIds(prev => [...prev, ...newIds]);

            hide();
            message.success('Jogador(es) adicionado(s) com sucesso!');
            setIsPlayerModalOpen(false);
        } catch (err) {
            console.error(err);
            hide();
            message.error('Erro ao adicionar jogador(es)');
        } finally {
            setPlayerSubmitting(false);
        }
    };

    const handleFormFinish = (values: any) => {
        onFinish({
            ...values,
            homeScore: values.homeScore ?? 0,
            awayScore: values.awayScore ?? 0,
            presences: presentPlayerIds
        });
    };

    const renderTeamPresenceList = (teamId: string) => {
        const teamPlayers = players
            .filter(p => p.teamId === teamId)
            .sort((a, b) => a.name.localeCompare(b.name));

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {teamPlayers.length === 0 ? (
                    <Text type="secondary" style={{ fontSize: 13, display: 'block', padding: '8px 0', textAlign: 'center' }}>
                        Nenhum jogador cadastrado neste time.
                    </Text>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                        gap: 8 
                    }}>
                        {teamPlayers.map(p => {
                            const isPresent = presentPlayerIds.includes(p.id);
                            return (
                                <Checkbox 
                                    key={p.id} 
                                    checked={isPresent} 
                                    onChange={(e) => handleTogglePresence(p.id, e.target.checked, p.name)}
                                    style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        padding: '8px 10px',
                                        borderRadius: 8,
                                        background: isPresent ? token.colorFillAlter : token.colorBgContainer,
                                        border: `1px solid ${isPresent ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
                                        transition: 'all 0.2s',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        width: '100%',
                                        margin: 0
                                    }}
                                >
                                    <span style={{ 
                                        fontSize: 13, 
                                        fontWeight: isPresent ? 500 : 400,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: 'inline-block',
                                        maxWidth: 100,
                                        verticalAlign: 'middle',
                                        color: isPresent ? token.colorText : token.colorTextSecondary
                                    }} title={p.name}>
                                        {p.name}
                                    </span>
                                </Checkbox>
                            );
                        })}
                    </div>
                )}
                
                {user?.role && user.role !== 'USER' && (
                    <Button 
                        type="dashed" 
                        icon={<PlusOutlined />} 
                        onClick={() => handleOpenAddPlayerModal(teamId)}
                        block
                        style={{ marginTop: 4 }}
                    >
                        Adicionar Jogador
                    </Button>
                )}
            </div>
        );
    };

    const renderPresenceTab = () => {
        const homePlayers = (players || []).filter(p => p.teamId === match?.homeTeamId);
        const homeTotal = homePlayers.length;
        const homePresent = homePlayers.filter(p => presentPlayerIds.includes(p.id)).length;

        const awayPlayers = (players || []).filter(p => p.teamId === match?.awayTeamId);
        const awayTotal = awayPlayers.length;
        const awayPresent = awayPlayers.filter(p => presentPlayerIds.includes(p.id)).length;

        return (
            <div style={{ maxHeight: '42vh', overflowY: 'auto', marginTop: 16, paddingRight: 4 }}>
                <Collapse
                    accordion
                    defaultActiveKey="home"
                    ghost
                    style={{ background: 'transparent' }}
                    items={[
                        {
                            key: 'home',
                            label: (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <Text strong>{match?.homeTeam?.name || 'Mandante'}</Text>
                                    <span style={{ 
                                        fontSize: 12, 
                                        color: token.colorTextSecondary, 
                                        background: token.colorFillQuaternary, 
                                        padding: '2px 8px', 
                                        borderRadius: 12, 
                                        fontWeight: 600 
                                    }}>
                                        {homePresent}/{homeTotal}
                                    </span>
                                </span>
                            ),
                            children: renderTeamPresenceList(match?.homeTeamId)
                        },
                        {
                            key: 'away',
                            label: (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                    <Text strong>{match?.awayTeam?.name || 'Visitante'}</Text>
                                    <span style={{ 
                                        fontSize: 12, 
                                        color: token.colorTextSecondary, 
                                        background: token.colorFillQuaternary, 
                                        padding: '2px 8px', 
                                        borderRadius: 12, 
                                        fontWeight: 600 
                                    }}>
                                        {awayPresent}/{awayTotal}
                                    </span>
                                </span>
                            ),
                            children: renderTeamPresenceList(match?.awayTeamId)
                        }
                    ]}
                />
            </div>
        );
    };

    const StepperInput = ({ value, onChange }: { value?: number, onChange?: (v: number) => void }) => {
        const val = value || 0;
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <Button 
                    shape="circle" 
                    icon={<MinusOutlined />} 
                    onClick={() => onChange?.(Math.max(0, val - 1))} 
                    size="large"
                />
                <div style={{ fontSize: 28, fontWeight: 'bold', width: 40, textAlign: 'center', lineHeight: 1 }}>
                    {val}
                </div>
                <Button 
                    shape="circle" 
                    icon={<PlusOutlined />} 
                    onClick={() => onChange?.(val + 1)} 
                    size="large"
                />
            </div>
        );
    };

    const handleGoalChange = (player: any, newCount: number) => {
        const pGoals = matchGoals.filter(g => g.playerId === player.id);
        const currentCount = pGoals.length;
        
        if (newCount > currentCount) {
            for (let i = 0; i < newCount - currentCount; i++) {
                onAddGoal(player);
            }
        } else if (newCount < currentCount) {
            const goalsToRemove = currentCount - newCount;
            for (let i = 0; i < goalsToRemove; i++) {
                onRemoveGoal(pGoals[i].id);
            }
        }
    };

    const renderScoreTab = () => {
        const assignedHome = matchGoals.filter(g => g.teamId === match?.homeTeamId).length;
        const assignedAway = matchGoals.filter(g => g.teamId === match?.awayTeamId).length;
        const unassignedHome = Math.max(0, (homeScore || 0) - assignedHome);
        const unassignedAway = Math.max(0, (awayScore || 0) - assignedAway);

        const homePlayers = players
            .filter(p => p.teamId === match?.homeTeamId && presentPlayerIds.includes(p.id))
            .sort((a, b) => a.name.localeCompare(b.name));
        homePlayers.push({ id: `own-goal-${match?.homeTeamId}`, name: 'Gol contra', teamId: match?.homeTeamId, teamName: match?.homeTeam?.name });

        const awayPlayers = players
            .filter(p => p.teamId === match?.awayTeamId && presentPlayerIds.includes(p.id))
            .sort((a, b) => a.name.localeCompare(b.name));
        awayPlayers.push({ id: `own-goal-${match?.awayTeamId}`, name: 'Gol contra', teamId: match?.awayTeamId, teamName: match?.awayTeam?.name });

        return (
            <div style={{ marginTop: 16 }}>

                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 20, background: token.colorFillQuaternary,
                    padding: '20px 16px', borderRadius: 12,
                    gap: 12
                }}>
                    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
                        <Title level={5} style={{ margin: '0 0 12px', fontSize: 14, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1.2 }}>
                            {match?.homeTeam?.name}
                        </Title>
                        <Form.Item name="homeScore" noStyle>
                            <StepperInput />
                        </Form.Item>
                    </div>

                    <div style={{ fontSize: '22px', fontWeight: 700, color: token.colorTextSecondary, paddingTop: 30 }}>
                        ×
                    </div>

                    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
                        <Title level={5} style={{ margin: '0 0 12px', fontSize: 14, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1.2 }}>
                            {match?.awayTeam?.name}
                        </Title>
                        <Form.Item name="awayScore" noStyle>
                            <StepperInput />
                        </Form.Item>
                    </div>
                </div>

                {match?.phase && match?.phase !== 'GROUP' && homeScore === awayScore && homeScore !== undefined && homeScore !== null && (
                    <div style={{ background: token.colorWarningBg, border: `1px solid ${token.colorWarning}50`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                        <Text strong style={{ color: '#fa8c16', display: 'block', textAlign: 'center', marginBottom: 12 }}>Empate! Resultado dos Pênaltis:</Text>
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            gap: 12
                        }}>
                            <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {match?.homeTeam?.name}
                                </div>
                                <Form.Item name="homePenalties" noStyle>
                                    <StepperInput />
                                </Form.Item>
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: token.colorTextSecondary, paddingTop: 20 }}>
                                ×
                            </div>
                            <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {match?.awayTeam?.name}
                                </div>
                                <Form.Item name="awayPenalties" noStyle>
                                    <StepperInput />
                                </Form.Item>
                            </div>
                        </div>
                    </div>
                )}

                {((homeScore || 0) > 0 || (awayScore || 0) > 0) && presentPlayerIds.length === 0 && (
                    <Alert
                        message="Dica: Para atribuir gols aos jogadores, não se esqueça de marcá-los como presentes na aba 'Lista de Presença'."
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                {(unassignedHome > 0 || unassignedAway > 0) && presentPlayerIds.length > 0 && (
                    <Alert
                        message={`Gols não atribuídos: ${unassignedHome > 0 ? `${unassignedHome} (${match?.homeTeam?.name})` : ''}${unassignedHome > 0 && unassignedAway > 0 ? ' e ' : ''}${unassignedAway > 0 ? `${unassignedAway} (${match?.awayTeam?.name})` : ''}`}
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}

                <Collapse accordion style={{ marginTop: 16 }} items={[
                    {
                        key: 'home',
                        label: `Gols: ${match?.homeTeam?.name}`,
                        children: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                                {homePlayers.length === 1 && presentPlayerIds.length === 0 ? (
                                    <Text type="secondary" style={{ fontSize: 12 }}>Marque jogadores na Lista de Presença primeiro.</Text>
                                ) : (
                                    homePlayers.map(p => {
                                        const pGoals = matchGoals.filter(g => g.playerId === p.id).length;
                                        const maxReached = matchGoals.filter(g => g.teamId === match?.homeTeamId).length >= (homeScore || 0);
                                        return (
                                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: token.colorFillAlter, borderRadius: 8, border: `1px solid ${pGoals > 0 ? token.colorPrimaryBorder : token.colorBorderSecondary}` }}>
                                                <Text style={{ flex: 1, marginRight: 8, fontSize: 13, fontWeight: pGoals > 0 ? 500 : 400 }} ellipsis title={p.name}>{p.name}</Text>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <Button shape="circle" size="small" icon={<MinusOutlined style={{ fontSize: 10 }} />} onClick={() => handleGoalChange(p, pGoals - 1)} disabled={pGoals === 0} />
                                                    <span style={{ fontWeight: 'bold', width: 16, textAlign: 'center', fontSize: 13, color: pGoals > 0 ? token.colorPrimary : token.colorText }}>{pGoals}</span>
                                                    <Button shape="circle" size="small" icon={<PlusOutlined style={{ fontSize: 10 }} />} onClick={() => handleGoalChange(p, pGoals + 1)} disabled={maxReached} />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )
                    },
                    {
                        key: 'away',
                        label: `Gols: ${match?.awayTeam?.name}`,
                        children: (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                                {awayPlayers.length === 1 && presentPlayerIds.length === 0 ? (
                                    <Text type="secondary" style={{ fontSize: 12 }}>Marque jogadores na Lista de Presença primeiro.</Text>
                                ) : (
                                    awayPlayers.map(p => {
                                        const pGoals = matchGoals.filter(g => g.playerId === p.id).length;
                                        const maxReached = matchGoals.filter(g => g.teamId === match?.awayTeamId).length >= (awayScore || 0);
                                        return (
                                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: token.colorFillAlter, borderRadius: 8, border: `1px solid ${pGoals > 0 ? token.colorPrimaryBorder : token.colorBorderSecondary}` }}>
                                                <Text style={{ flex: 1, marginRight: 8, fontSize: 13, fontWeight: pGoals > 0 ? 500 : 400 }} ellipsis title={p.name}>{p.name}</Text>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <Button shape="circle" size="small" icon={<MinusOutlined style={{ fontSize: 10 }} />} onClick={() => handleGoalChange(p, pGoals - 1)} disabled={pGoals === 0} />
                                                    <span style={{ fontWeight: 'bold', width: 16, textAlign: 'center', fontSize: 13, color: pGoals > 0 ? token.colorPrimary : token.colorText }}>{pGoals}</span>
                                                    <Button shape="circle" size="small" icon={<PlusOutlined style={{ fontSize: 10 }} />} onClick={() => handleGoalChange(p, pGoals + 1)} disabled={maxReached} />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )
                    }
                ]} />
            </div>
        );
    };

    const renderDetailsTab = () => (
        <div style={{ marginTop: 16 }}>
            <Form.Item name="location" label="Local do Jogo">
                <Input prefix={<EnvironmentOutlined />} placeholder="Estádio, Quadra, Campo..." />
            </Form.Item>
            <Form.Item name="dateTime" label="Data e Hora">
                <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" placeholder="Selecione data e hora" />
            </Form.Item>
        </div>
    );

    return (
        <>
            <Modal 
                title="Editar Jogo" 
                open={open} 
                onCancel={() => {
                    if (confirmLoading) return;
                    onCancel();
                }} 
                onOk={() => form.submit()} 
                width={600}
                destroyOnClose
                okText="Salvar"
                cancelText="Cancelar"
                confirmLoading={confirmLoading}
                okButtonProps={{ disabled: loadingPlayers || confirmLoading }}
                cancelButtonProps={{ disabled: confirmLoading }}
                closable={!confirmLoading}
                maskClosable={!confirmLoading}
                keyboard={!confirmLoading}
                styles={{ body: { maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 } }}
            >
                <Form form={form} layout="vertical" onFinish={handleFormFinish}>
                    {loadingPlayers ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 16 }}>
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
                            <span style={{ color: 'var(--ant-color-text-secondary)', fontSize: 14 }}>Carregando dados do jogo...</span>
                        </div>
                    ) : (
                        <Tabs 
                            defaultActiveKey="score"
                            items={[
                                {
                                    key: 'score',
                                    label: 'Placar e Gols',
                                    children: renderScoreTab()
                                },
                                {
                                    key: 'presence',
                                    label: 'Lista de Presença',
                                    children: renderPresenceTab()
                                },
                                {
                                    key: 'details',
                                    label: 'Data e Local',
                                    children: renderDetailsTab()
                                }
                            ]}
                        />
                    )}
                </Form>
            </Modal>

            <PlayerModal
                open={isPlayerModalOpen}
                onCancel={() => setIsPlayerModalOpen(false)}
                onFinish={handleSavePlayers}
                form={playerForm}
                isEdit={false}
                confirmLoading={playerSubmitting}
            />
        </>
    );
};

export default MatchResultModal;
