import React, { useState, useEffect } from 'react';
import { Modal, Button, Tabs, Typography, Space, Avatar, message, Divider, theme } from 'antd';
import { SwapOutlined, ThunderboltOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import TeamPicker from './TeamPicker';

const { Text } = Typography;

// ─── Types ───────────────────────────────────────────────────────────────────

interface TeamInfo {
    id: string;
    name: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
}

interface ExistingMatch {
    id: string;
    round: number;
    homeTeamId: string;
    awayTeamId: string;
    status: string;
}

interface GroupSetup {
    groupId: string;
    groupName: string;
    teams: TeamInfo[];
    existingMatches: ExistingMatch[];
}

interface MatchSlot {
    groupId: string;
    round: number;
    homeTeamId: string | null;
    awayTeamId: string | null;
}

interface DefineMatchesModalProps {
    open: boolean;
    onClose: () => void;
    championshipId: string;
    setup: { rounds: number; groups: GroupSetup[] } | null;
    loadingSetup: boolean;
    onSave: (matches: { groupId: string; homeTeamId: string; awayTeamId: string; round: number }[]) => Promise<void>;
    onAutoGenerate: () => Promise<void>;
    confirmLoading?: boolean;
}

// ─── TeamSlot sub-component (same pattern as NextPhaseModal) ─────────────────

interface TeamSlotProps {
    team: TeamInfo | null;
    label: string;
    align: 'left' | 'right';
    onClick: () => void;
    onClear: (e: React.MouseEvent) => void;
    token: any;
}

const TeamSlot: React.FC<TeamSlotProps> = ({ team, label, align, onClick, onClear, token }) => {
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
                border: `2px dashed ${filled ? token.colorSuccess : token.colorBorderSecondary}`,
                borderRadius: 8,
                background: filled ? token.colorSuccessBg : token.colorFillQuaternary,
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
                            color: token.colorError,
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
                        style={{
                            flexShrink: 0,
                            backgroundColor: team!.primaryColor || token.colorFillSecondary,
                            color: team!.secondaryColor || '#fff',
                            border: team!.logoUrl ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                        }}
                    >
                        {!team!.logoUrl && team!.name?.[0]?.toUpperCase()}
                    </Avatar>
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
                    style={{ fontSize: 12, textAlign: align, width: '100%' }}
                >
                    {label}
                </Text>
            )}
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const DefineMatchesModal: React.FC<DefineMatchesModalProps> = ({
    open,
    onClose,
    setup,
    loadingSetup,
    onSave,
    onAutoGenerate,
    confirmLoading,
}) => {
    const { token } = theme.useToken();

    // slots[groupId][round][slotIndex]
    const [slots, setSlots] = useState<MatchSlot[]>([]);
    const [selectingSlot, setSelectingSlot] = useState<{ slotIndex: number; side: 'home' | 'away' } | null>(null);

    // Initialize slots from setup
    useEffect(() => {
        if (!open || !setup) return;

        const initial: MatchSlot[] = [];
        for (const group of setup.groups) {
            const n = group.teams.length;
            const working = n % 2 !== 0 ? n + 1 : n;
            const numRounds = Math.max(working - 1, 1);
            // real teams only (exclude BYE slot)
            const realMatchesPerRound = Math.floor(n / 2);

            for (let round = 1; round <= numRounds; round++) {
                for (let slot = 0; slot < realMatchesPerRound; slot++) {
                    // Check if there's an existing match for this round/group/slot
                    const existing = group.existingMatches.filter(m => m.round === round);
                    const existingSlot = existing[slot];
                    initial.push({
                        groupId: group.groupId,
                        round,
                        homeTeamId: existingSlot?.homeTeamId || null,
                        awayTeamId: existingSlot?.awayTeamId || null,
                    });
                }
            }
        }
        setSlots(initial);
        setSelectingSlot(null);
    }, [open, setup]);

    if (!setup) return null;

    // ── Derived state ─────────────────────────────────────────────────────────

    const getTeamInfo = (groupId: string, teamId: string | null): TeamInfo | null => {
        if (!teamId) return null;
        const group = setup.groups.find(g => g.groupId === groupId);
        return group?.teams.find(t => t.id === teamId) || null;
    };

    const getUsedTeamsInRoundGroup = (groupId: string, round: number, excludeSlotIndex?: number): Set<string> => {
        const used = new Set<string>();
        slots.forEach((s, i) => {
            if (i === excludeSlotIndex) return;
            if (s.groupId !== groupId || s.round !== round) return;
            if (s.homeTeamId) used.add(s.homeTeamId);
            if (s.awayTeamId) used.add(s.awayTeamId);
        });
        return used;
    };

    const getUsedPairsInGroup = (groupId: string, excludeSlotIndex?: number): Set<string> => {
        const used = new Set<string>();
        slots.forEach((s, i) => {
            if (i === excludeSlotIndex) return;
            if (s.groupId !== groupId) return;
            if (s.homeTeamId && s.awayTeamId) {
                used.add([s.homeTeamId, s.awayTeamId].sort().join('|'));
            }
        });
        return used;
    };

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleTeamSelect = (teamIds: string[]) => {
        if (!selectingSlot || teamIds.length === 0) return;
        const { slotIndex, side } = selectingSlot;
        const slot = slots[slotIndex];

        // Check round+group usage
        const usedInRound = getUsedTeamsInRoundGroup(slot.groupId, slot.round, slotIndex);
        if (usedInRound.has(teamIds[0])) {
            message.warning('Este time já joga nesta rodada neste grupo.');
            return;
        }

        // Check pair duplication
        const otherSideId = side === 'home' ? slot.awayTeamId : slot.homeTeamId;

        // Guard against self-match
        if (otherSideId && teamIds[0] === otherSideId) {
            message.warning('Um time não pode jogar contra si mesmo.');
            return;
        }

        if (otherSideId) {
            const usedPairs = getUsedPairsInGroup(slot.groupId, slotIndex);
            const pairKey = [teamIds[0], otherSideId].sort().join('|');
            if (usedPairs.has(pairKey)) {
                message.warning('Este confronto já existe em outra rodada deste grupo.');
                return;
            }
        }

        const next = [...slots];
        next[slotIndex] = {
            ...slot,
            homeTeamId: side === 'home' ? teamIds[0] : slot.homeTeamId,
            awayTeamId: side === 'away' ? teamIds[0] : slot.awayTeamId,
        };
        setSlots(next);
        setSelectingSlot(null);
    };

    const handleSwap = (slotIndex: number) => {
        const next = [...slots];
        const s = next[slotIndex];
        next[slotIndex] = { ...s, homeTeamId: s.awayTeamId, awayTeamId: s.homeTeamId };
        setSlots(next);
    };

    const handleClear = (slotIndex: number, side: 'home' | 'away') => {
        const next = [...slots];
        next[slotIndex] = {
            ...next[slotIndex],
            homeTeamId: side === 'home' ? null : next[slotIndex].homeTeamId,
            awayTeamId: side === 'away' ? null : next[slotIndex].awayTeamId,
        };
        setSlots(next);
    };

    const handleSave = async () => {
        const incomplete = slots.some(s => !s.homeTeamId || !s.awayTeamId);
        if (incomplete) {
            message.error('Defina todos os confrontos antes de salvar.');
            return;
        }
        await onSave(
            slots.map(s => ({
                groupId: s.groupId,
                homeTeamId: s.homeTeamId!,
                awayTeamId: s.awayTeamId!,
                round: s.round,
            }))
        );
    };

    const handleAutoGenerate = async () => {
        await onAutoGenerate();
    };

    // ── Build available teams for the picker modal ────────────────────────────

    const pickerTeams = (() => {
        if (selectingSlot === null) return [];
        const slot = slots[selectingSlot.slotIndex];
        const group = setup.groups.find(g => g.groupId === slot.groupId);
        if (!group) return [];

        const usedInRound = getUsedTeamsInRoundGroup(slot.groupId, slot.round, selectingSlot.slotIndex);
        const usedPairs = getUsedPairsInGroup(slot.groupId, selectingSlot.slotIndex);
        const otherSide = selectingSlot.side === 'home' ? slot.awayTeamId : slot.homeTeamId;

        return group.teams.filter(t => {
            if (usedInRound.has(t.id)) return false;
            // Prevent self-match: exclude the team already on the other side of this slot
            if (otherSide && t.id === otherSide) return false;
            if (otherSide) {
                const pairKey = [t.id, otherSide].sort().join('|');
                if (usedPairs.has(pairKey)) return false;
            }
            return true;
        });
    })();

    // ── Build tabs ────────────────────────────────────────────────────────────

    const rounds = setup.rounds;

    const tabItems = Array.from({ length: rounds }, (_, roundIdx) => {
        const round = roundIdx + 1;
        const roundSlots = slots
            .map((s, i) => ({ ...s, index: i }))
            .filter(s => s.round === round);

        return {
            key: String(round),
            label: `Rodada ${round}`,
            children: (
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                    {setup.groups.map(group => {
                        const groupSlots = roundSlots.filter(s => s.groupId === group.groupId);
                        if (groupSlots.length === 0) return null;
                        return (
                            <div key={group.groupId}>
                                <Divider orientation="left" style={{ fontSize: 13, margin: '0 0 10px' }}>
                                    {group.groupName}
                                </Divider>
                                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                                    {groupSlots.map(slot => {
                                        const home = getTeamInfo(slot.groupId, slot.homeTeamId);
                                        const away = getTeamInfo(slot.groupId, slot.awayTeamId);
                                        return (
                                            <div
                                                key={slot.index}
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 36px 1fr',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    background: token.colorFillAlter,
                                                    padding: '8px 10px',
                                                    borderRadius: 8,
                                                    border: `1px solid ${token.colorBorderSecondary}`,
                                                }}
                                            >
                                                <TeamSlot
                                                    team={home}
                                                    label="Mandante"
                                                    align="right"
                                                    onClick={() => setSelectingSlot({ slotIndex: slot.index, side: 'home' })}
                                                    onClear={e => { e.stopPropagation(); handleClear(slot.index, 'home'); }}
                                                    token={token}
                                                />
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                    <span style={{ fontWeight: 700, fontSize: 13, color: token.colorTextSecondary, userSelect: 'none' }}>×</span>
                                                    <button
                                                        title="Inverter mandante/visitante"
                                                        onClick={() => handleSwap(slot.index)}
                                                        style={{
                                                            background: 'none',
                                                            border: `1px solid ${token.colorBorderSecondary}`,
                                                            borderRadius: 4,
                                                            cursor: 'pointer',
                                                            padding: '2px 4px',
                                                            color: token.colorTextSecondary,
                                                            fontSize: 12,
                                                            lineHeight: 1,
                                                        }}
                                                    >
                                                        <SwapOutlined />
                                                    </button>
                                                </div>
                                                <TeamSlot
                                                    team={away}
                                                    label="Visitante"
                                                    align="left"
                                                    onClick={() => setSelectingSlot({ slotIndex: slot.index, side: 'away' })}
                                                    onClear={e => { e.stopPropagation(); handleClear(slot.index, 'away'); }}
                                                    token={token}
                                                />
                                            </div>
                                        );
                                    })}
                                </Space>
                            </div>
                        );
                    })}
                </Space>
            ),
        };
    });

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <Modal
                title="Definir Confrontos da Fase de Grupos"
                open={open}
                onCancel={() => {
                    if (confirmLoading) return;
                    setSelectingSlot(null);
                    onClose();
                }}
                width="min(820px, 100vw)"
                style={{ top: 16 }}
                styles={{
                    body: { padding: '12px 16px', maxHeight: 'calc(100dvh - 200px)', overflowY: 'auto' },
                }}
                closable={!confirmLoading}
                keyboard={!confirmLoading}
                maskClosable={!confirmLoading}
                loading={loadingSetup}
                footer={[
                    <Button
                        key="auto"
                        icon={<ThunderboltOutlined />}
                        onClick={handleAutoGenerate}
                        disabled={confirmLoading}
                    >
                        Sortear Automaticamente
                    </Button>,
                    <Button key="cancel" onClick={onClose} disabled={confirmLoading}>
                        Cancelar
                    </Button>,
                    <Button
                        key="save"
                        type="primary"
                        onClick={handleSave}
                        loading={confirmLoading}
                    >
                        Salvar Confrontos
                    </Button>,
                ]}
            >
                <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
                    Clique em cada espaço para escolher o time. Use ⇄ para inverter mandante/visitante.
                    Times já usados na mesma rodada e pares já enfrentados estarão bloqueados.
                </Text>
                <Tabs items={tabItems} size="small" />
            </Modal>

            {/* Team picker sub-modal */}
            <Modal
                title={(() => {
                    if (!selectingSlot) return 'Selecionar time';
                    const slot = slots[selectingSlot.slotIndex];
                    const group = setup.groups.find(g => g.groupId === slot.groupId);
                    const side = selectingSlot.side === 'home' ? 'Mandante' : 'Visitante';
                    return `Selecionar time — ${side} · ${group?.groupName} · Rodada ${slot.round}`;
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
                        teams={pickerTeams}
                        max={1}
                    />
                )}
            </Modal>
        </>
    );
};

export default DefineMatchesModal;
