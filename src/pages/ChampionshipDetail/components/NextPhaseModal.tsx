import React, { useState, useEffect } from 'react';
import { Modal, Button, Space, Typography, Card, Avatar, message } from 'antd';
import { SwapOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import { Switch, Tabs } from 'antd';
import TeamPicker from './TeamPicker';
import { trackEvent } from '../../../services/analytics';

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
}

const NextPhaseModal: React.FC<NextPhaseModalProps> = ({
    isOpen,
    onClose,
    championship,
    standings,
    matches,
    preview,
    onSave
}) => {
    const [matchups, setMatchups] = useState<{ homeTeamId?: string; awayTeamId?: string; bracket: 'GOLD' | 'SILVER'; round?: number }[]>([]);
    const [selectingSlot, setSelectingSlot] = useState<{ index: number; side: 'home' | 'away' } | null>(null);
    const [enableSilverBracket, setEnableSilverBracket] = useState(false);
    const [enableThirdPlaceGold, setEnableThirdPlaceGold] = useState(false);
    const [enableThirdPlaceSilver, setEnableThirdPlaceSilver] = useState(false);

    const isTransitionFromGroups =
        championship.format === 'GROUPS_KNOCKOUT' &&
        preview?.advancingTeams && preview?.advancingTeams.length > 0 &&
        !preview.advancingTeams.some((t: any) => t.bracket);

    const hasSilverPreview = preview?.previewMatches.some((m: any) => m.bracket === 'SILVER') || false;

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

    const getSemiLosers = (bracket: 'GOLD' | 'SILVER') => {
        const bSemiMatches = matches.filter(
            m => m.phase === 'SEMI' && (m.bracket || 'GOLD') === bracket
        );
        return bSemiMatches.map(m => {
            const winnerId = getWinnerId(m);
            return m.homeTeamId === winnerId ? m.awayTeamId : m.homeTeamId;
        }).filter(Boolean);
    };

    console.log('[DEBUG NextPhaseModal] championship:', championship);
    console.log('[DEBUG NextPhaseModal] preview:', preview);
    console.log('[DEBUG NextPhaseModal] isTransitionFromGroups:', isTransitionFromGroups);
    console.log('[DEBUG NextPhaseModal] enableSilverBracket:', enableSilverBracket);
    console.log('[DEBUG NextPhaseModal] hasSilverPreview:', hasSilverPreview);

    useEffect(() => {
        if (isOpen && preview) {
            let silverEnabled = enableSilverBracket;

            if (!isTransitionFromGroups) {
                silverEnabled = hasSilverPreview;
                setEnableSilverBracket(silverEnabled);
            }

            console.log('[DEBUG NextPhaseModal useEffect] silverEnabled:', silverEnabled);

            let newMatchups: any[] = [];

            if (isTransitionFromGroups) {
                const goldMatchesCount = preview.previewMatches.length;
                console.log('[DEBUG NextPhaseModal useEffect] isTransitionFromGroups=true, goldMatchesCount:', goldMatchesCount);
                // Add Gold slots
                for (let i = 0; i < goldMatchesCount; i++) {
                    newMatchups.push({ bracket: 'GOLD', round: 1 });
                }
                if (enableThirdPlaceGold && preview.nextPhase === 'FINAL') {
                    newMatchups.push({ bracket: 'GOLD', round: 2 });
                }

                // Add Silver slots if enabled
                if (silverEnabled) {
                    console.log('[DEBUG NextPhaseModal useEffect] Adding silver matchups slots. goldMatchesCount:', goldMatchesCount);
                    for (let i = 0; i < goldMatchesCount; i++) {
                        newMatchups.push({ bracket: 'SILVER', round: 1 });
                    }
                    if (enableThirdPlaceSilver && preview.nextPhase === 'FINAL') {
                        newMatchups.push({ bracket: 'SILVER', round: 2 });
                    }
                }
            } else {
                console.log('[DEBUG NextPhaseModal useEffect] isTransitionFromGroups=false. preview.previewMatches:', preview.previewMatches);
                // Vindo das semifinais: copiamos os jogos da final calculados pelo back-end
                preview.previewMatches.forEach(m => {
                    newMatchups.push({
                        homeTeamId: m.homeTeamId,
                        awayTeamId: m.awayTeamId,
                        bracket: m.bracket || 'GOLD',
                        round: 1,
                    });
                });

                // Se habilitar disputa do 3º lugar na Ouro e estivermos na FINAL, adicionamos
                if (enableThirdPlaceGold && preview.nextPhase === 'FINAL') {
                    const goldLosers = getSemiLosers('GOLD');
                    if (goldLosers.length >= 2) {
                        newMatchups.push({
                            homeTeamId: goldLosers[0],
                            awayTeamId: goldLosers[1],
                            bracket: 'GOLD',
                            round: 2,
                        });
                    } else {
                        newMatchups.push({ bracket: 'GOLD', round: 2 });
                    }
                }

                // Se habilitar disputa do 3º lugar na Prata, estivermos na FINAL, e Série Prata estiver habilitada
                if (enableThirdPlaceSilver && preview.nextPhase === 'FINAL' && silverEnabled) {
                    const silverLosers = getSemiLosers('SILVER');
                    if (silverLosers.length >= 2) {
                        newMatchups.push({
                            homeTeamId: silverLosers[0],
                            awayTeamId: silverLosers[1],
                            bracket: 'SILVER',
                            round: 2,
                        });
                    } else {
                        newMatchups.push({ bracket: 'SILVER', round: 2 });
                    }
                }
            }

            console.log('[DEBUG NextPhaseModal useEffect] Final calculated newMatchups:', newMatchups);
            setMatchups(newMatchups);
        }
    }, [isOpen, preview, championship, standings, enableSilverBracket, enableThirdPlaceGold, enableThirdPlaceSilver, isTransitionFromGroups, hasSilverPreview]);

        const handleApplyShortcut = () => {
        if (!preview) return;
        if (standings.length >= 1) {
            const advancingCount = championship.advancingCount || 2;
            const newMatchups: { homeTeamId?: string; awayTeamId?: string; bracket: 'GOLD' | 'SILVER'; round?: number }[] = [];

            if (preview.nextPhase === 'FINAL' && (enableThirdPlaceGold || enableThirdPlaceSilver)) {
                if (standings.length === 1) {
                    // Caso: Apenas 1 grupo, disputa do 3º lugar
                    const group = standings[0].standings || [];
                    
                    // Ouro Final (round 1)
                    newMatchups.push({ homeTeamId: group[0]?.teamId, awayTeamId: group[1]?.teamId, bracket: 'GOLD', round: 1 });
                    // Ouro 3º Lugar (round 2)
                    if (enableThirdPlaceGold) {
                        newMatchups.push({ homeTeamId: group[2]?.teamId, awayTeamId: group[3]?.teamId, bracket: 'GOLD', round: 2 });
                    }
                    
                    if (enableSilverBracket) {
                        // Prata Final (round 1)
                        newMatchups.push({ homeTeamId: group[4]?.teamId, awayTeamId: group[5]?.teamId, bracket: 'SILVER', round: 1 });
                        // Prata 3º Lugar (round 2)
                        if (enableThirdPlaceSilver) {
                            newMatchups.push({ homeTeamId: group[6]?.teamId, awayTeamId: group[7]?.teamId, bracket: 'SILVER', round: 2 });
                        }
                    }
                } else {
                    // Caso: 2 ou mais grupos, disputa do 3º lugar (Cruzamento entre 1ºs e 2ºs de cada grupo)
                    const groupA = standings[0]?.standings || [];
                    const groupB = standings[1]?.standings || [];
                    
                    // Ouro Final (round 1): 1ºA vs 1ºB
                    newMatchups.push({ homeTeamId: groupA[0]?.teamId, awayTeamId: groupB[0]?.teamId, bracket: 'GOLD', round: 1 });
                    // Ouro 3º Lugar (round 2): 2ºA vs 2ºB
                    if (enableThirdPlaceGold) {
                        newMatchups.push({ homeTeamId: groupA[1]?.teamId, awayTeamId: groupB[1]?.teamId, bracket: 'GOLD', round: 2 });
                    }
                    
                    if (enableSilverBracket) {
                        // Prata Final (round 1): 3ºA vs 3ºB
                        newMatchups.push({ homeTeamId: groupA[2]?.teamId, awayTeamId: groupB[2]?.teamId, bracket: 'SILVER', round: 1 });
                        // Prata 3º Lugar (round 2): 4ºA vs 4ºB
                        if (enableThirdPlaceSilver) {
                            newMatchups.push({ homeTeamId: groupA[3]?.teamId, awayTeamId: groupB[3]?.teamId, bracket: 'SILVER', round: 2 });
                        }
                    }
                }
            } else {
                if (standings.length === 1) {
                    // Caso: Apenas 1 grupo
                    const group = standings[0].standings || [];
                    const numMatches = Math.max(1, Math.floor(advancingCount / 2));
                    
                    // Ouro
                    for (let i = 0; i < numMatches; i++) {
                        const homeTeam = group[i];
                        const awayTeam = group[advancingCount - 1 - i];
                        if (homeTeam || awayTeam) {
                            newMatchups.push({ homeTeamId: homeTeam?.teamId, awayTeamId: awayTeam?.teamId, bracket: 'GOLD', round: 1 });
                        }
                    }
                    
                    // Prata
                    if (enableSilverBracket) {
                        for (let i = 0; i < numMatches; i++) {
                            const homeTeam = group[i + advancingCount];
                            const awayTeam = group[advancingCount - 1 - i + advancingCount];
                            if (homeTeam || awayTeam) {
                                newMatchups.push({ homeTeamId: homeTeam?.teamId, awayTeamId: awayTeam?.teamId, bracket: 'SILVER', round: 1 });
                            }
                        }
                    }
                } else {
                    // Caso: 2 ou mais grupos (Cruzamento entre pares de grupos)
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

                    if (enableSilverBracket) {
                        for (let g = 0; g < standings.length; g += 2) {
                            const groupA = standings[g]?.standings || [];
                            const groupB = standings[g + 1]?.standings || [];
                            for (let i = 0; i < advancingCount; i++) {
                                const homeTeam = groupA[i + advancingCount];
                                const awayTeam = groupB[advancingCount - 1 - i + advancingCount];
                                if (homeTeam || awayTeam) {
                                    newMatchups.push({ homeTeamId: homeTeam?.teamId, awayTeamId: awayTeam?.teamId, bracket: 'SILVER', round: 1 });
                                }
                            }
                        }
                    }
                }
            }

            // Pad with empty slots if needed
            const goldMatchesCount = preview.previewMatches.length;
            const goldExpected = goldMatchesCount + (enableThirdPlaceGold && preview.nextPhase === 'FINAL' ? 1 : 0);
            const silverExpected = goldMatchesCount + (enableThirdPlaceSilver && preview.nextPhase === 'FINAL' ? 1 : 0);
            let expectedLength = goldExpected;
            if (enableSilverBracket) {
                expectedLength += silverExpected;
            }

            while (newMatchups.length < expectedLength) {
                const goldCount = newMatchups.filter(m => m.bracket === 'GOLD').length;
                const targetBracket = goldCount < goldExpected ? 'GOLD' : 'SILVER';
                const round1Count = newMatchups.filter(m => m.bracket === targetBracket && m.round === 1).length;
                const round = round1Count < goldMatchesCount ? 1 : 2;
                newMatchups.push({ bracket: targetBracket, round });
            }

            setMatchups(newMatchups.slice(0, expectedLength));
            message.success('Cruzamento olímpico aplicado!');
        } else {
            setMatchups(
                preview.previewMatches.map(m => ({
                    homeTeamId: m.homeTeamId,
                    awayTeamId: m.awayTeamId,
                    bracket: m.bracket || 'GOLD',
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
            silver_bracket_enabled: enableSilverBracket 
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
        const slotBracket = matchups[selectingSlot.index]?.bracket || 'GOLD';

        if (isTransitionFromGroups) {
            if (slotBracket === 'GOLD') {
                sourceTeams = preview.advancingTeams.map((t: any) => ({ teamId: t.teamId }));
            } else {
                const advancingIds = new Set(preview.advancingTeams.map((t: any) => t.teamId));
                sourceTeams = [];
                for (const group of standings) {
                    for (const st of group.standings) {
                        if (!advancingIds.has(st.teamId)) {
                            sourceTeams.push({ teamId: st.teamId });
                        }
                    }
                }
            }
        } else {
            const bracketTeams = preview.advancingTeams.filter((t: any) => t.bracket === slotBracket);
            if (bracketTeams.length > 0) {
                sourceTeams = bracketTeams.map((t: any) => ({ teamId: t.teamId }));
            }
        }
    }

    const availableTeams = sourceTeams
        .map((t: any) => {
            const info = getTeamInfo(t.teamId);
            return { id: t.teamId, name: info?.name || 'Desconhecido', logoUrl: info?.logoUrl };
        })
        .filter(t => !selectedTeamIds.includes(t.id));

    const renderMatchupsList = (bracket: 'GOLD' | 'SILVER') => {
        const isGold = bracket === 'GOLD';
        const isThirdPlaceEnabled = isGold ? enableThirdPlaceGold : enableThirdPlaceSilver;
        const setThirdPlaceEnabled = isGold ? setEnableThirdPlaceGold : setEnableThirdPlaceSilver;

        return (
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {preview.nextPhase === 'FINAL' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f5', padding: '12px', borderRadius: 8, marginBottom: 4 }}>
                        <Text strong>Habilitar disputa de 3º lugar ({isGold ? 'Série Ouro' : 'Série Prata'})?</Text>
                        <Switch checked={isThirdPlaceEnabled} onChange={setThirdPlaceEnabled} />
                    </div>
                )}
                {matchups.map((match, index) => {
                    if (match.bracket !== bracket) return null;
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
                                {preview.nextPhase === 'FINAL'
                                    ? (Number(match.round) === 2 ? 'Disputa de 3º Lugar' : 'Grande Final')
                                    : `Jogo ${index + 1}`}
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
        );
    };

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
                    {isTransitionFromGroups && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f5', padding: '12px', borderRadius: 8 }}>
                            <Text strong>Habilitar Série Prata (Consolação)?</Text>
                            <Switch checked={enableSilverBracket} onChange={setEnableSilverBracket} />
                        </div>
                    )}

                    {/* O switch global foi movido para dentro de cada aba em renderMatchupsList */}

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
                    {enableSilverBracket ? (
                        <Tabs
                            defaultActiveKey="GOLD"
                            items={[
                                { key: 'GOLD', label: 'Série Ouro', children: renderMatchupsList('GOLD') },
                                { key: 'SILVER', label: 'Série Prata', children: renderMatchupsList('SILVER') }
                            ]}
                        />
                    ) : (
                        renderMatchupsList('GOLD')
                    )}
                </Space>
            </Modal>

            {/* Team picker sub-modal */}
            <Modal
                title={`Selecione o time — ${selectingSlot?.side === 'home' ? 'Mandante' : 'Visitante'} · ${preview.nextPhase === 'FINAL' ? (Number(matchups[selectingSlot?.index ?? 0]?.round) === 2 ? 'Disputa de 3º Lugar' : 'Grande Final') : `Jogo ${(selectingSlot?.index ?? 0) + 1}`}`}
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