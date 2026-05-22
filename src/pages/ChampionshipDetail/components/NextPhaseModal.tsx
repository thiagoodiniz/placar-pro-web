import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Typography, Card, Avatar, message, Input, Collapse } from 'antd';
import { SwapOutlined, CloseOutlined, UserOutlined, EditOutlined } from '@ant-design/icons';
import { Switch } from 'antd';
import TeamPicker from './TeamPicker';
import { trackEvent } from '../../../services/analytics';
import { getBracketLabels, BracketLabels } from '../../../utils/bracketLabels';
import { useAuth } from '../../../contexts/AuthContext';

const { Text } = Typography;

interface NextPhaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    championship: any;
    standings: any[];
    matches: any[];
    preview: {
        nextPhase: string;
        advancingTeams: any[];
        previewMatches: any[];
    } | null;
    onSave: (matches: { homeTeamId: string; awayTeamId: string; bracket: 'GOLD' | 'SILVER'; round?: number }[]) => void;
    onSaveLabels?: (labels: Record<string, string>) => void;
    confirmLoading?: boolean;
}

const NextPhaseModal: React.FC<NextPhaseModalProps> = ({
    isOpen,
    onClose,
    championship,
    standings,
    matches,
    preview,
    onSave,
    onSaveLabels,
    confirmLoading
}) => {
    const [matchups, setMatchups] = useState<{ homeTeamId?: string; awayTeamId?: string; bracket: 'GOLD'; round?: number }[]>([]);
    const [selectingSlot, setSelectingSlot] = useState<{ index: number; side: 'home' | 'away' } | null>(null);
    const [enableThirdPlace, setEnableThirdPlace] = useState(false);

    const { user } = useAuth();
    const baseLabels = getBracketLabels(championship);
    const [draftLabels, setDraftLabels] = useState<BracketLabels>(baseLabels);
    const [labelsDirty, setLabelsDirty] = useState(false);

    // Sync draft labels when championship changes
    useEffect(() => {
        setDraftLabels(getBracketLabels(championship));
        setLabelsDirty(false);
    }, [championship?.bracketLabels]);

    const isTransitionFromGroups =
        championship.format === 'GROUPS_KNOCKOUT' &&
        preview?.advancingTeams &&
        preview?.advancingTeams.length > 0 &&
        !preview.advancingTeams.some((t: any) => t.bracket);

    const getWinnerId = (m: any) => {
        const h = m.homeScore ?? 0;
        const a = m.awayScore ?? 0;
        if (h > a) return m.homeTeamId;
        if (a > h) return m.awayTeamId;
        const hp = m.homePenalties ?? 0;
        const ap = m.awayPenalties ?? 0;
        if (hp > ap) return m.homeTeamId;
        if (ap > hp) return m.awayTeamId;
        return m.homeTeamId;
    };

    const getSemiLosers = () => {
        const semiMatches = matches.filter(
            m => m.phase === 'SEMI' && (!m.bracket || m.bracket === 'GOLD')
        );
        return semiMatches.map(m => {
            const winnerId = getWinnerId(m);
            return m.homeTeamId === winnerId ? m.awayTeamId : m.homeTeamId;
        }).filter(Boolean);
    };

    useEffect(() => {
        if (isOpen && preview) {
            let newMatchups: { homeTeamId?: string; awayTeamId?: string; bracket: 'GOLD'; round?: number }[] = [];

            if (isTransitionFromGroups) {
                const goldMatchesCount = preview.previewMatches.filter((m: any) => !m.bracket || m.bracket === 'GOLD').length || preview.previewMatches.length;
                for (let i = 0; i < goldMatchesCount; i++) {
                    newMatchups.push({ bracket: 'GOLD', round: 1 });
                }
                if (enableThirdPlace && preview.nextPhase === 'FINAL') {
                    newMatchups.push({ bracket: 'GOLD', round: 2 });
                }
            } else {
                // Vindo de semi → final: copia os jogos previstos pelo back-end (apenas GOLD)
                preview.previewMatches.forEach((m: any) => {
                    if (!m.bracket || m.bracket === 'GOLD') {
                        newMatchups.push({
                            homeTeamId: m.homeTeamId,
                            awayTeamId: m.awayTeamId,
                            bracket: 'GOLD',
                            round: 1,
                        });
                    }
                });

                // Disputa de 3º lugar (GOLD)
                if (enableThirdPlace && preview.nextPhase === 'FINAL') {
                    const losers = getSemiLosers();
                    if (losers.length >= 2) {
                        newMatchups.push({
                            homeTeamId: losers[0],
                            awayTeamId: losers[1],
                            bracket: 'GOLD',
                            round: 2,
                        });
                    } else {
                        newMatchups.push({ bracket: 'GOLD', round: 2 });
                    }
                }
            }

            setMatchups(newMatchups);
        }
    }, [isOpen, preview, championship, standings, enableThirdPlace, isTransitionFromGroups]);

    const handleApplyShortcut = () => {
        if (!preview) return;
        if (standings.length >= 1) {
            const advancingCount = championship.advancingCount || 2;
            const newMatchups: { homeTeamId?: string; awayTeamId?: string; bracket: 'GOLD'; round?: number }[] = [];

            if (preview.nextPhase === 'FINAL' && enableThirdPlace) {
                if (standings.length === 1) {
                    const group = standings[0].standings || [];
                    newMatchups.push({ homeTeamId: group[0]?.teamId, awayTeamId: group[1]?.teamId, bracket: 'GOLD', round: 1 });
                    newMatchups.push({ homeTeamId: group[2]?.teamId, awayTeamId: group[3]?.teamId, bracket: 'GOLD', round: 2 });
                } else {
                    const groupA = standings[0]?.standings || [];
                    const groupB = standings[1]?.standings || [];
                    newMatchups.push({ homeTeamId: groupA[0]?.teamId, awayTeamId: groupB[0]?.teamId, bracket: 'GOLD', round: 1 });
                    newMatchups.push({ homeTeamId: groupA[1]?.teamId, awayTeamId: groupB[1]?.teamId, bracket: 'GOLD', round: 2 });
                }
            } else {
                if (standings.length === 1) {
                    const group = standings[0].standings || [];
                    const numMatches = Math.max(1, Math.floor(advancingCount / 2));
                    for (let i = 0; i < numMatches; i++) {
                        const homeTeam = group[i];
                        const awayTeam = group[advancingCount - 1 - i];
                        if (homeTeam || awayTeam) {
                            newMatchups.push({ homeTeamId: homeTeam?.teamId, awayTeamId: awayTeam?.teamId, bracket: 'GOLD', round: 1 });
                        }
                    }
                } else {
                    for (let g = 0; g < standings.length; g += 2) {
                        const groupA = standings[g]?.standings || [];
                        const groupB = standings[g + 1]?.standings || [];
                        for (let i = 0; i < advancingCount; i++) {
                            const homeTeam = groupA[i];
                            const awayTeam = groupB[advancingCount - 1 - i];
                            if (homeTeam || awayTeam) {
                                newMatchups.push({ homeTeamId: homeTeam?.teamId, awayTeamId: awayTeam?.teamId, bracket: 'GOLD', round: 1 });
                            }
                        }
                    }
                }
            }

            // Pad with empty slots if needed
            const goldMatchesCount = preview.previewMatches.filter((m: any) => !m.bracket || m.bracket === 'GOLD').length || preview.previewMatches.length;
            const goldExpected = goldMatchesCount + (enableThirdPlace && preview.nextPhase === 'FINAL' ? 1 : 0);

            while (newMatchups.length < goldExpected) {
                const round1Count = newMatchups.filter(m => m.round === 1).length;
                const round = round1Count < goldMatchesCount ? 1 : 2;
                newMatchups.push({ bracket: 'GOLD', round });
            }

            setMatchups(newMatchups.slice(0, goldExpected));
            message.success('Cruzamento olímpico aplicado!');
        } else {
            setMatchups(
                preview.previewMatches
                    .filter((m: any) => !m.bracket || m.bracket === 'GOLD')
                    .map((m: any) => ({
                        homeTeamId: m.homeTeamId,
                        awayTeamId: m.awayTeamId,
                        bracket: 'GOLD' as const,
                        round: m.round || 1,
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
        trackEvent('next_phase_started', {
            championship_id: championship.id,
        });
        onSave(matchups as { homeTeamId: string; awayTeamId: string; bracket: 'GOLD' | 'SILVER'; round?: number }[]);
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

    let sourceTeams = preview.advancingTeams.map((t: any) => ({ teamId: t.teamId }));

    if (selectingSlot !== null) {
        if (!isTransitionFromGroups) {
            const goldTeams = preview.advancingTeams.filter((t: any) => !t.bracket || t.bracket === 'GOLD');
            if (goldTeams.length > 0) {
                sourceTeams = goldTeams.map((t: any) => ({ teamId: t.teamId }));
            }
        }
    }

    const availableTeams = sourceTeams
        .map((t: any) => {
            const info = getTeamInfo(t.teamId);
            return { id: t.teamId, name: info?.name || 'Desconhecido', logoUrl: info?.logoUrl };
        })
        .filter(t => !selectedTeamIds.includes(t.id));

    const renderMatchups = () => {
        return (
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {preview.nextPhase === 'FINAL' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f5', padding: '12px', borderRadius: 8, marginBottom: 4 }}>
                        <Text strong>Habilitar {draftLabels.thirdPlaceLabel}?</Text>
                        <Switch checked={enableThirdPlace} onChange={setEnableThirdPlace} />
                    </div>
                )}
                {matchups.map((match, index) => {
                    const homeTeam = getTeamInfo(match.homeTeamId);
                    const awayTeam = getTeamInfo(match.awayTeamId);

                    return (
                        <Card
                            key={index}
                            size="small"
                            styles={{ body: { padding: '10px 12px' } }}
                        >
                            <Text
                                type="secondary"
                                style={{ fontSize: 11, display: 'block', marginBottom: 8 }}
                            >
                                {preview.nextPhase === 'FINAL'
                                    ? (Number(match.round) === 2 ? draftLabels.thirdPlaceLabel : draftLabels.finalLabel)
                                    : `Jogo ${index + 1}`}
                            </Text>

                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 28px 1fr',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
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
        );
    };

    return (
        <>
            <Modal
                title={`Definir Confrontos — ${preview.nextPhase}`}
                open={isOpen}
                onCancel={() => {
                    if (confirmLoading) return;
                    setSelectingSlot(null);
                    onClose();
                }}
                width="min(800px, 100vw)"
                style={{ top: 16 }}
                styles={{
                    body: { padding: '12px 16px', maxHeight: 'calc(100dvh - 180px)', overflowY: 'auto' },
                }}
                closable={!confirmLoading}
                keyboard={!confirmLoading}
                maskClosable={!confirmLoading}
                footer={[
                    <Button key="cancel" onClick={onClose} style={{ flex: 1 }} disabled={confirmLoading}>
                        Cancelar
                    </Button>,
                    <Button key="save" type="primary" onClick={handleSave} style={{ flex: 1 }} loading={confirmLoading}>
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
                    {renderMatchups()}

                    {/* Admin-only: Renomear rótulos */}
                    {user?.role === 'ADMIN' && onSaveLabels && (
                        <Collapse
                            ghost
                            size="small"
                            items={[{
                                key: 'labels',
                                label: (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <EditOutlined style={{ marginRight: 6 }} />
                                        Renomear rótulos
                                    </Text>
                                ),
                                children: (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Nome da Série Principal</Text>
                                            <Input
                                                size="small"
                                                placeholder="Série Ouro"
                                                value={draftLabels.gold}
                                                onChange={e => { setDraftLabels(p => ({ ...p, gold: e.target.value })); setLabelsDirty(true); }}
                                            />
                                        </div>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Rótulo da Grande Final</Text>
                                            <Input
                                                size="small"
                                                placeholder="Grande Final"
                                                value={draftLabels.finalLabel}
                                                onChange={e => { setDraftLabels(p => ({ ...p, finalLabel: e.target.value })); setLabelsDirty(true); }}
                                            />
                                        </div>
                                        <div>
                                            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Rótulo da Disputa de 3º Lugar</Text>
                                            <Input
                                                size="small"
                                                placeholder="Disputa de 3º Lugar"
                                                value={draftLabels.thirdPlaceLabel}
                                                onChange={e => { setDraftLabels(p => ({ ...p, thirdPlaceLabel: e.target.value })); setLabelsDirty(true); }}
                                            />
                                        </div>
                                        {labelsDirty && (
                                            <Button
                                                size="small"
                                                type="primary"
                                                onClick={() => {
                                                    onSaveLabels({
                                                        GOLD: draftLabels.gold,
                                                        SILVER: draftLabels.silver,
                                                        finalLabel: draftLabels.finalLabel,
                                                        thirdPlaceLabel: draftLabels.thirdPlaceLabel,
                                                    });
                                                    setLabelsDirty(false);
                                                    message.success('Rótulos salvos!');
                                                }}
                                            >
                                                Salvar Rótulos
                                            </Button>
                                        )}
                                    </div>
                                )
                            }]}
                        />
                    )}
                </Space>
            </Modal>

            {/* Team picker sub-modal */}
            <Modal
                title={(() => {
                    const sideText = selectingSlot?.side === 'home' ? 'Mandante' : 'Visitante';
                    if (!selectingSlot) return 'Selecione o time';
                    const match = matchups[selectingSlot.index];
                    let matchLabel = `Jogo ${selectingSlot.index + 1}`;
                    if (preview.nextPhase === 'FINAL' && match) {
                        matchLabel = Number(match.round) === 2
                            ? draftLabels.thirdPlaceLabel
                            : draftLabels.finalLabel;
                    }
                    return `Selecione o time — ${sideText} · ${matchLabel}`;
                })()}
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