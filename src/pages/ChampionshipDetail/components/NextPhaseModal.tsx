import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Typography, Card, Avatar, message } from 'antd';
import { SwapOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import TeamPicker from './TeamPicker';

const { Text } = Typography;

interface NextPhaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    championship: any;
    standings: any[];
    preview: {
        nextPhase: string;
        advancingTeams: any[];
        previewMatches: any[];
    } | null;
    onSave: (matches: { homeTeamId: string; awayTeamId: string }[]) => void;
}

const NextPhaseModal: React.FC<NextPhaseModalProps> = ({
    isOpen,
    onClose,
    championship,
    standings,
    preview,
    onSave
}) => {
    const [matchups, setMatchups] = useState<{ homeTeamId?: string; awayTeamId?: string }[]>([]);
    const [selectingSlot, setSelectingSlot] = useState<{ index: number; side: 'home' | 'away' } | null>(null);

    const totalAdvancingFromGroups = (championship.groupCount || 1) * (championship.advancingCount || 2);
    const isTransitionFromGroups =
        championship.format === 'GROUPS_KNOCKOUT' &&
        preview?.advancingTeams.length === totalAdvancingFromGroups;

    useEffect(() => {
        if (isOpen && preview) {
            if (isTransitionFromGroups) {
                setMatchups(Array(preview.previewMatches.length).fill({}));
            } else {
                setMatchups(
                    preview.previewMatches.map(m => ({
                        homeTeamId: m.homeTeamId,
                        awayTeamId: m.awayTeamId,
                    }))
                );
            }
        }
    }, [isOpen, preview, championship, standings]);

    const handleApplyShortcut = () => {
        if (!preview) return;
        if (standings.length >= 2) {
            const advancingCount = championship.advancingCount || 2;
            const newMatchups = [];
            for (let g = 0; g < standings.length; g += 2) {
                const groupA = standings[g]?.standings || [];
                const groupB = standings[g + 1]?.standings || [];
                for (let i = 0; i < advancingCount; i++) {
                    const homeTeam = groupA[i];
                    const awayTeam = groupB[advancingCount - 1 - i];
                    if (homeTeam && awayTeam) {
                        newMatchups.push({
                            homeTeamId: homeTeam.teamId,
                            awayTeamId: awayTeam.teamId,
                        });
                    }
                }
            }
            setMatchups(newMatchups);
            message.success('Cruzamento olímpico aplicado!');
        } else {
            setMatchups(
                preview.previewMatches.map(m => ({
                    homeTeamId: m.homeTeamId,
                    awayTeamId: m.awayTeamId,
                }))
            );
        }
    };

    const handleTeamSelect = (teamIds: string[]) => {
        if (selectingSlot && teamIds.length > 0) {
            const newMatchups = [...matchups];
            const teamId = teamIds[0];

            const isAlreadySelected = newMatchups.some(
                m => m.homeTeamId === teamId || m.awayTeamId === teamId
            );
            if (isAlreadySelected) {
                message.warning('Este time já foi selecionado para outro confronto.');
                return;
            }

            if (selectingSlot.side === 'home') {
                newMatchups[selectingSlot.index] = { ...newMatchups[selectingSlot.index], homeTeamId: teamId };
            } else {
                newMatchups[selectingSlot.index] = { ...newMatchups[selectingSlot.index], awayTeamId: teamId };
            }
            setMatchups(newMatchups);
            setSelectingSlot(null);
        }
    };

    const handleSave = () => {
        const isComplete = matchups.every(m => m.homeTeamId && m.awayTeamId);
        if (!isComplete) {
            message.error('Por favor, defina todos os times para os confrontos.');
            return;
        }
        onSave(matchups as { homeTeamId: string; awayTeamId: string }[]);
    };

    const getTeamInfo = (teamId?: string) => {
        if (!teamId) return null;
        const team = preview?.advancingTeams.find(t => t.teamId === teamId);
        if (team?.teamName) return { id: teamId, name: team.teamName, logoUrl: team.teamLogoUrl };

        for (const group of standings) {
            const st = group.standings.find((s: any) => s.teamId === teamId);
            if (st) return { id: teamId, name: st.teamName, logoUrl: st.teamLogoUrl };
        }
        return { id: teamId, name: 'Desconhecido', logoUrl: '' };
    };

    if (!preview) return null;

    const selectedTeamIds = matchups
        .flatMap(m => [m.homeTeamId, m.awayTeamId])
        .filter(Boolean) as string[];

    const availableTeams = preview.advancingTeams
        .map((t: any) => {
            const info = getTeamInfo(t.teamId);
            return { id: t.teamId, name: info?.name || 'Desconhecido', logoUrl: info?.logoUrl };
        })
        .filter(t => !selectedTeamIds.includes(t.id));

    return (
        <>
            <Modal
                title={`Definir Confrontos — ${preview.nextPhase}`}
                open={isOpen}
                onCancel={() => {
                    setSelectingSlot(null);
                    onClose();
                }}
                // 100vw on mobile, capped at 800px on desktop
                width="min(800px, 100vw)"
                style={{ top: 16 }}
                styles={{
                    body: { padding: '12px 16px', maxHeight: 'calc(100dvh - 180px)', overflowY: 'auto' },
                }}
                footer={[
                    <Button key="cancel" onClick={onClose} style={{ flex: 1 }}>
                        Cancelar
                    </Button>,
                    <Button key="save" type="primary" onClick={handleSave} style={{ flex: 1 }}>
                        Salvar e Iniciar Fase
                    </Button>,
                ]}
            >
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                    {/* Shortcut banner - Only show when transitioning from Groups */}
                    {isTransitionFromGroups && (
                        <div
                            style={{
                                padding: '10px 12px',
                                background: '#f5f5f5',
                                borderRadius: 8,
                            }}
                        >
                            <Text strong style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
                                Atalhos de Preenchimento:
                            </Text>
                            <Button
                                size="small"
                                onClick={handleApplyShortcut}
                                icon={<SwapOutlined />}
                                style={{ whiteSpace: 'normal', height: 'auto', padding: '4px 10px' }}
                            >
                                Cruzamento Olímpico (1ºA × 2ºB…)
                            </Button>
                        </div>
                    )}

                    {/* Matchup list */}
                    {matchups.map((match, index) => {
                        const homeTeam = getTeamInfo(match.homeTeamId);
                        const awayTeam = getTeamInfo(match.awayTeamId);

                        return (
                            <Card
                                key={index}
                                size="small"
                                styles={{ body: { padding: '10px 12px' } }}
                            >
                                {/* Match number label */}
                                <Text
                                    type="secondary"
                                    style={{ fontSize: 11, display: 'block', marginBottom: 8 }}
                                >
                                    Jogo {index + 1}
                                </Text>

                                {/* Single-row layout: [home] × [away] */}
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 28px 1fr',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                >
                                    {/* Home slot */}
                                    <TeamSlot
                                        team={homeTeam}
                                        label="Mandante"
                                        align="right"
                                        onClick={() => setSelectingSlot({ index, side: 'home' })}
                                        onClear={e => {
                                            e.stopPropagation();
                                            const next = [...matchups];
                                            delete next[index].homeTeamId;
                                            setMatchups(next);
                                        }}
                                    />

                                    {/* VS divider */}
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            fontWeight: 700,
                                            fontSize: 13,
                                            color: '#bfbfbf',
                                            userSelect: 'none',
                                        }}
                                    >
                                        ×
                                    </div>

                                    {/* Away slot */}
                                    <TeamSlot
                                        team={awayTeam}
                                        label="Visitante"
                                        align="left"
                                        onClick={() => setSelectingSlot({ index, side: 'away' })}
                                        onClear={e => {
                                            e.stopPropagation();
                                            const next = [...matchups];
                                            delete next[index].awayTeamId;
                                            setMatchups(next);
                                        }}
                                    />
                                </div>
                            </Card>
                        );
                    })}
                </Space>
            </Modal>

            {/* Team picker sub-modal */}
            <Modal
                title={`Selecione o time — ${selectingSlot?.side === 'home' ? 'Mandante' : 'Visitante'} · Jogo ${(selectingSlot?.index ?? 0) + 1}`}
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
                        teams={availableTeams}
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
                    {/* Clear button */}
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

                    {/* Avatar + name stacked vertically — no risk of overflow */}
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

export default NextPhaseModal;