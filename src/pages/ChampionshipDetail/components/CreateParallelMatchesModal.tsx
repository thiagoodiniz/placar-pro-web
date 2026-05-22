import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Space, Typography, message, Divider, Avatar } from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined, CloseOutlined } from '@ant-design/icons';
import TeamPicker from './TeamPicker';

const { Text } = Typography;

interface Matchup {
    homeTeamId: string;
    awayTeamId: string;
}

interface CreateParallelMatchesModalProps {
    isOpen: boolean;
    onClose: () => void;
    championship: any;
    matches: any[];
    activePhase: string;
    onSave: (seriesLabel: string, matchups: Matchup[], phase: string) => Promise<void>;
    confirmLoading?: boolean;
}

const PHASE_LABELS: Record<string, string> = {
    GROUP: 'Fase de Grupos',
    LEAGUE: 'Liga',
    ROUND_16: 'Oitavas de Final',
    QUARTER: 'Quartas de Final',
    SEMI: 'Semifinal',
    FINAL: 'Final',
};

const CreateParallelMatchesModal: React.FC<CreateParallelMatchesModalProps> = ({
    isOpen,
    onClose,
    championship,
    matches,
    activePhase,
    onSave,
    confirmLoading,
}) => {
    const [seriesLabel, setSeriesLabel] = useState('');
    const [matchups, setMatchups] = useState<Matchup[]>([{ homeTeamId: '', awayTeamId: '' }]);
    const [selectingSlot, setSelectingSlot] = useState<{ matchupIndex: number; side: 'home' | 'away' } | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSeriesLabel('');
            setMatchups([{ homeTeamId: '', awayTeamId: '' }]);
            setSelectingSlot(null);
        }
    }, [isOpen]);

    const teams = (championship?.teams || [])
        .map((ct: any) => ct.team)
        .filter(Boolean)
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

    // Teams that already have at least one match in the active phase (main or parallel)
    const takenTeamIds = new Set(
        matches
            .filter((m: any) => m.phase === activePhase)
            .flatMap((m: any) => [m.homeTeamId, m.awayTeamId])
    );

    // Only teams with zero matches in this phase are shown by default
    const baseTeams = teams.filter((t: any) => !takenTeamIds.has(t.id));

    const getTeamInfo = (teamId: string) => {
        if (!teamId) return null;
        return teams.find((t: any) => t.id === teamId) || null;
    };

    // Exclude already-selected teams from the picker
    const getAvailableTeams = () => {
        const selected = matchups.flatMap(m => [m.homeTeamId, m.awayTeamId]).filter(Boolean);
        return baseTeams.filter((t: any) => !selected.includes(t.id));
    };

    const handleTeamSelect = (teamIds: string[]) => {
        if (!selectingSlot || teamIds.length === 0) return;
        const teamId = teamIds[0];
        setMatchups(prev => {
            const next = [...prev];
            if (selectingSlot.side === 'home') {
                next[selectingSlot.matchupIndex] = { ...next[selectingSlot.matchupIndex], homeTeamId: teamId };
            } else {
                next[selectingSlot.matchupIndex] = { ...next[selectingSlot.matchupIndex], awayTeamId: teamId };
            }
            return next;
        });
        setSelectingSlot(null);
    };

    const clearTeam = (matchupIndex: number, side: 'homeTeamId' | 'awayTeamId', e: React.MouseEvent) => {
        e.stopPropagation();
        setMatchups(prev => {
            const next = [...prev];
            next[matchupIndex] = { ...next[matchupIndex], [side]: '' };
            return next;
        });
    };

    const handleSwap = (index: number) => {
        setMatchups(prev => {
            const next = [...prev];
            next[index] = { homeTeamId: next[index].awayTeamId, awayTeamId: next[index].homeTeamId };
            return next;
        });
    };

    const handleAddMatchup = () => {
        setMatchups(prev => [...prev, { homeTeamId: '', awayTeamId: '' }]);
    };

    const handleRemoveMatchup = (index: number) => {
        setMatchups(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!seriesLabel.trim()) {
            message.error('Informe o nome da série.');
            return;
        }
        if (matchups.length === 0) {
            message.error('Adicione pelo menos um confronto.');
            return;
        }
        const incomplete = matchups.some(m => !m.homeTeamId || !m.awayTeamId);
        if (incomplete) {
            message.error('Preencha todos os confrontos com os dois times.');
            return;
        }
        await onSave(seriesLabel.trim(), matchups, activePhase);
    };

    const handleClose = () => {
        if (confirmLoading) return;
        onClose();
    };

    const phaseLabel = PHASE_LABELS[activePhase] || activePhase;
    const sideLabel = selectingSlot?.side === 'home' ? 'Mandante' : 'Visitante';
    const matchupLabel = selectingSlot ? `Confronto ${selectingSlot.matchupIndex + 1}` : '';

    return (
        <>
            <Modal
                title={`Criar Jogos Paralelos — ${phaseLabel}`}
                open={isOpen}
                onCancel={handleClose}
                onOk={handleSave}
                okText="Criar jogos"
                cancelText="Cancelar"
                confirmLoading={confirmLoading}
                closable={!confirmLoading}
                maskClosable={!confirmLoading}
                keyboard={!confirmLoading}
                cancelButtonProps={{ disabled: confirmLoading }}
                width="min(600px, 100vw)"
                style={{ top: 16 }}
                styles={{ body: { padding: '16px', maxHeight: 'calc(100dvh - 200px)', overflowY: 'auto' } }}
            >
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                    {/* Series name */}
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 6 }}>
                            Nome da série
                        </Text>
                        <Input
                            placeholder="Ex: Série Prata, Copa Consolação, Bronze..."
                            value={seriesLabel}
                            onChange={e => setSeriesLabel(e.target.value)}
                            maxLength={60}
                            autoFocus
                        />
                        <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                            Este nome aparecerá como cabeçalho dos jogos na aba {phaseLabel}.
                        </Text>
                    </div>

                    <Divider style={{ margin: '0' }} />

                    {/* Matchups */}
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 10 }}>Confrontos</Text>
                        <Space direction="vertical" style={{ width: '100%' }} size={8}>
                            {matchups.map((matchup, index) => {
                                const homeTeam = getTeamInfo(matchup.homeTeamId);
                                const awayTeam = getTeamInfo(matchup.awayTeamId);
                                return (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 28px 1fr 36px',
                                            gap: 8,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <TeamSlot
                                            team={homeTeam}
                                            label="Mandante"
                                            align="right"
                                            onClick={() => setSelectingSlot({ matchupIndex: index, side: 'home' })}
                                            onClear={e => clearTeam(index, 'homeTeamId', e)}
                                        />

                                        <div
                                            style={{
                                                textAlign: 'center',
                                                fontWeight: 700,
                                                fontSize: 13,
                                                color: '#bfbfbf',
                                                userSelect: 'none',
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => handleSwap(index)}
                                            title="Inverter mandante/visitante"
                                        >
                                            ×
                                        </div>

                                        <TeamSlot
                                            team={awayTeam}
                                            label="Visitante"
                                            align="left"
                                            onClick={() => setSelectingSlot({ matchupIndex: index, side: 'away' })}
                                            onClear={e => clearTeam(index, 'awayTeamId', e)}
                                        />

                                        <Button
                                            type="text"
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => handleRemoveMatchup(index)}
                                            disabled={matchups.length === 1}
                                            title="Remover confronto"
                                        />
                                    </div>
                                );
                            })}
                        </Space>
                        <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={handleAddMatchup}
                            style={{ width: '100%', marginTop: 10 }}
                        >
                            Adicionar confronto
                        </Button>
                    </div>
                </Space>
            </Modal>

            {/* Team picker sub-modal */}
            <Modal
                title={`Selecionar time — ${sideLabel} · ${matchupLabel}`}
                open={!!selectingSlot}
                onCancel={() => setSelectingSlot(null)}
                footer={null}
                width="min(560px, 100vw)"
                style={{ top: 16 }}
                styles={{ body: { padding: '12px 16px' } }}
            >
                {selectingSlot && (
                    <TeamPicker
                        value={[]}
                        onChange={handleTeamSelect}
                        teams={getAvailableTeams()}
                        max={1}
                    />
                )}
            </Modal>
        </>
    );
};

/* ─── TeamSlot sub-component ──────────────────────────────────────────────── */

interface TeamSlotProps {
    team: { id: string; name: string; logoUrl?: string } | null;
    label: string;
    align: 'left' | 'right';
    onClick: () => void;
    onClear: (e: React.MouseEvent) => void;
}

const TeamSlot: React.FC<TeamSlotProps> = ({ team, label, align, onClick, onClear }) => {
    const filled = !!team;

    return (
        <div
            onClick={onClick}
            style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: align === 'right' ? 'flex-end' : 'flex-start',
                justifyContent: 'center',
                minHeight: 52,
                padding: '8px 10px',
                border: `2px dashed ${filled ? '#52c41a' : '#d9d9d9'}`,
                borderRadius: 8,
                background: filled ? '#f6ffed' : '#fafafa',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'border-color 0.2s, background 0.2s',
            }}
        >
            {filled ? (
                <>
                    <button
                        onClick={onClear}
                        style={{
                            position: 'absolute',
                            top: 4,
                            ...(align === 'right' ? { left: 4 } : { right: 4 }),
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 2,
                            lineHeight: 1,
                            color: '#ff4d4f',
                            fontSize: 10,
                        }}
                        aria-label="Remover time"
                    >
                        <CloseOutlined />
                    </button>

                    <Avatar
                        src={team!.logoUrl || undefined}
                        icon={!team!.logoUrl ? <UserOutlined /> : undefined}
                        size={28}
                        style={{ flexShrink: 0 }}
                    />
                    <Text
                        strong
                        style={{
                            fontSize: 12,
                            marginTop: 4,
                            textAlign: align,
                            wordBreak: 'break-word',
                            maxWidth: '100%',
                            lineHeight: 1.3,
                        }}
                    >
                        {team!.name}
                    </Text>
                </>
            ) : (
                <Text
                    type="secondary"
                    style={{
                        fontSize: 12,
                        textAlign: align,
                        width: '100%',
                    }}
                >
                    {label}
                </Text>
            )}
        </div>
    );
};

export default CreateParallelMatchesModal;
