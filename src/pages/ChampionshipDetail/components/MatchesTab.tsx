import React from 'react';
import { Tabs, Button, Empty, Typography, Space, Card, List, Avatar, Divider, theme, Tag } from 'antd';
import { PlusOutlined, EnvironmentOutlined, ClockCircleOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../../../contexts/AuthContext';
import { getBracketLabels } from '../../../utils/bracketLabels';

const { Text } = Typography;

interface MatchesTabProps {
    groupedMatches: any;
    activePhase: string;
    setActivePhase: (phase: string) => void;
    currentRound: number;
    setCurrentRound: (round: number) => void;
    championship: any;
    onOpenEditModal: (match: any) => void;
    onOpenManualMatchModal: () => void;
    loadingMatchId?: string | null;
}

const MatchesTab: React.FC<MatchesTabProps> = ({
    groupedMatches,
    activePhase,
    setActivePhase,
    currentRound,
    setCurrentRound,
    championship,
    onOpenEditModal,
    onOpenManualMatchModal,
    loadingMatchId,
}) => {
    const { token } = theme.useToken();
    const { user } = useAuth();
    const labels = getBracketLabels(championship);

    const phaseOrder = ['GROUP', 'LEAGUE', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL'];
    const currentPhase = Object.keys(groupedMatches).reduce((latest: string, p: string) => {
        return phaseOrder.indexOf(p) > phaseOrder.indexOf(latest) ? p : latest;
    }, 'GROUP');

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    {championship.status === 'DRAFT' && championship.matchMode === 'MANUALLY' && championship.status !== 'FINISHED' && user?.role && user.role !== 'USER' && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={onOpenManualMatchModal}>Definir Confronto</Button>
                    )}
                </div>
            </div>

            {Object.keys(groupedMatches).length > 0 ? (
                <Tabs
                    type="card"
                    activeKey={activePhase}
                    onChange={(key) => {
                        setActivePhase(key);
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
                    items={Object.entries(groupedMatches)
                        .sort((a, b) => {
                            const phaseOrder = ['GROUP', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL'];
                            return phaseOrder.indexOf(a[0]) - phaseOrder.indexOf(b[0]);
                        })
                        .map(([phase, phaseMatches]: [string, any]) => {
                            const phaseLabel = phase === 'GROUP' ? 'Fase de Grupos' :
                                phase === 'ROUND_16' ? 'Oitavas de Final' :
                                    phase === 'QUARTER' ? 'Quartas de Final' :
                                        phase === 'SEMI' ? 'Semifinal' :
                                            phase === 'FINAL' ? 'Final' : phase;

                            const rounds = Array.from(new Set(phaseMatches.map((m: any) => m.round || 1))).sort((a: any, b: any) => a - b) as number[];
                            const activeRound = rounds.includes(currentRound) ? currentRound : (rounds[0] || 1);
                            const roundMatches = phase === 'GROUP'
                                ? phaseMatches.filter((m: any) => (m.round || 1) === activeRound)
                                : phaseMatches;

                            const matchesByGroup = roundMatches.reduce((acc: any, m: any) => {
                                let g = m.groupName || '';
                                if (phase !== 'GROUP' && m.bracket) {
                                    g = m.bracket === 'GOLD' ? labels.gold : labels.silver;
                                }
                                if (!acc[g]) acc[g] = [];
                                acc[g].push(m);
                                return acc;
                            }, {});

                            return {
                                key: phase,
                                label: phaseLabel,
                                children: (
                                    <div>
                                        {phase === 'GROUP' && rounds.length > 0 && (
                                            <div style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                marginBottom: 20, background: token.colorFillQuaternary,
                                                padding: '10px 16px', borderRadius: 8,
                                            }}>
                                                <Button
                                                    size="small"
                                                    disabled={activeRound === rounds[0]}
                                                    onClick={() => setCurrentRound(activeRound - 1)}
                                                >← Anterior</Button>
                                                <Text strong style={{ fontSize: 14 }}>Rodada {activeRound}</Text>
                                                <Button
                                                    size="small"
                                                    disabled={activeRound === rounds[rounds.length - 1]}
                                                    onClick={() => setCurrentRound(activeRound + 1)}
                                                >Próxima →</Button>
                                            </div>
                                        )}

                                        {Object.keys(matchesByGroup)
                                            .sort((a, b) => {
                                                if (phase !== 'GROUP') {
                                                    if (a === labels.gold) return -1;
                                                    if (b === labels.gold) return 1;
                                                }
                                                return a.localeCompare(b);
                                            })
                                            .map(gName => (
                                            <div key={gName} style={{ marginBottom: 16 }}>
                                                {gName && (
                                                    <div style={{ paddingLeft: 10, borderLeft: `3px solid ${token.colorPrimary}`, marginBottom: 12 }}>
                                                        <Text strong style={{ color: token.colorPrimary }}>{gName}</Text>
                                                    </div>
                                                )}
                                                <List
                                                    dataSource={matchesByGroup[gName]}
                                                    renderItem={(m: any) => {
                                                        const getScorerSummary = (teamId: string) => {
                                                            if (!m.goals) return [];
                                                            const teamGoals = m.goals.filter((g: any) => g.teamId === teamId);
                                                            const counts: Record<string, number> = {};
                                                            teamGoals.forEach((g: any) => {
                                                                counts[g.playerName] = (counts[g.playerName] || 0) + 1;
                                                            });
                                                            return Object.entries(counts).map(([name, count]) =>
                                                                count > 1 ? `${name} (${count})` : name
                                                            );
                                                        };

                                                        const homeScorers = getScorerSummary(m.homeTeamId);
                                                        const awayScorers = getScorerSummary(m.awayTeamId);

                                                        return (
                                                            <List.Item style={{ border: 'none', padding: '0 0 12px 0' }}>
                                                                <Card size="small" style={{ width: '100%', borderRadius: token.borderRadiusLG }} styles={{ body: { padding: '14px 16px' } }}>
                                                                    {m.phase === 'FINAL' && (
                                                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                                                                            {m.bracket === 'SILVER' ? (
                                                                                Number(m.round) === 2 ? (
                                                                                    <Tag color="orange" style={{ fontWeight: 600 }}>{`Disputa de 3º lugar - ${labels.silver}`}</Tag>
                                                                                ) : (
                                                                                    <Tag color="gold" style={{ fontWeight: 600 }}>{`Final ${labels.silver}`}</Tag>
                                                                                )
                                                                            ) : (
                                                                                Number(m.round) === 2 ? (
                                                                                    <Tag color="orange" style={{ fontWeight: 600 }}>{labels.thirdPlaceLabel}</Tag>
                                                                                ) : (
                                                                                    <Tag color="gold" style={{ fontWeight: 600 }}>{labels.finalLabel}</Tag>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (homeScorers.length > 0 || awayScorers.length > 0) ? 4 : 10 }}>
                                                                        <div style={{ flex: 1, minWidth: 0, textAlign: 'right', paddingRight: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                                                            <Text strong style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.homeTeam?.name || 'A definir'}</Text>
                                                                            <Avatar
                                                                                size="small"
                                                                                src={m.homeTeam?.logoUrl ? <img src={m.homeTeam.logoUrl} alt={m.homeTeam.name} referrerPolicy="no-referrer" /> : undefined}
                                                                                style={{
                                                                                    backgroundColor: m.homeTeam?.primaryColor || token.colorFillSecondary,
                                                                                    color: m.homeTeam?.secondaryColor || '#fff',
                                                                                    flexShrink: 0,
                                                                                    border: m.homeTeam?.logoUrl ? 'none' : `1px solid ${token.colorBorderSecondary}`
                                                                                }}
                                                                            >
                                                                                {!m.homeTeam?.logoUrl && (m.homeTeam?.name?.[0]?.toUpperCase() || '?')}
                                                                            </Avatar>
                                                                        </div>
                                                                        <div style={{
                                                                            minWidth: 80, textAlign: 'center',
                                                                            background: m.status === 'FINISHED' ? token.colorFillSecondary : token.colorFillQuaternary,
                                                                            padding: '5px 14px', borderRadius: 8,
                                                                            fontWeight: 700, fontSize: 18,
                                                                            color: m.status === 'FINISHED' ? token.colorTextBase : token.colorTextSecondary,
                                                                            letterSpacing: '0.05em',
                                                                            flexShrink: 0
                                                                        }}>
                                                                            {m.status === 'FINISHED'
                                                                                ? (m.homePenalties != null && m.awayPenalties != null
                                                                                    ? `${m.homeScore}(${m.homePenalties}) × ${m.awayScore}(${m.awayPenalties})`
                                                                                    : `${m.homeScore} × ${m.awayScore}`)
                                                                                : 'vs'}
                                                                        </div>
                                                                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left', paddingLeft: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8 }}>
                                                                            <Avatar
                                                                                size="small"
                                                                                src={m.awayTeam?.logoUrl ? <img src={m.awayTeam.logoUrl} alt={m.awayTeam.name} referrerPolicy="no-referrer" /> : undefined}
                                                                                style={{
                                                                                    backgroundColor: m.awayTeam?.primaryColor || token.colorFillSecondary,
                                                                                    color: m.awayTeam?.secondaryColor || '#fff',
                                                                                    flexShrink: 0,
                                                                                    border: m.awayTeam?.logoUrl ? 'none' : `1px solid ${token.colorBorderSecondary}`
                                                                                }}
                                                                            >
                                                                                {!m.awayTeam?.logoUrl && (m.awayTeam?.name?.[0]?.toUpperCase() || '?')}
                                                                            </Avatar>
                                                                            <Text strong style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.awayTeam?.name || 'A definir'}</Text>
                                                                        </div>
                                                                    </div>

                                                                    {(homeScorers.length > 0 || awayScorers.length > 0) && (
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                                                            <div style={{ flex: 1, textAlign: 'right', paddingRight: 50, color: token.colorTextSecondary, fontSize: 11 }}>
                                                                                {homeScorers.map(s => <div key={s}>{s}</div>)}
                                                                            </div>
                                                                            <div style={{ flex: 1, textAlign: 'left', paddingLeft: 50, color: token.colorTextSecondary, fontSize: 11 }}>
                                                                                {awayScorers.map(s => <div key={s}>{s}</div>)}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    <div style={{
                                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                        fontSize: '12px', color: token.colorTextSecondary,
                                                                        borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 9,
                                                                        flexWrap: 'wrap', gap: '6px 0',
                                                                    }}>
                                                                        <Space split={<Divider type="vertical" />}>
                                                                            <span><EnvironmentOutlined /> {m.location || 'Local a definir'}</span>
                                                                            <span><ClockCircleOutlined /> {m.dateTime ? dayjs(m.dateTime).format('DD/MM HH:mm') : 'Hora a definir'}</span>
                                                                        </Space>
                                                                        {championship.status === 'STARTED' && m.phase === currentPhase && user?.role && user.role !== 'USER' && (
                                                                            <Space>
                                                                                <Button
                                                                                    size="small"
                                                                                    type="primary"
                                                                                    icon={<EditOutlined />}
                                                                                    onClick={() => onOpenEditModal(m)}
                                                                                    loading={loadingMatchId === m.id}
                                                                                    disabled={loadingMatchId !== null && loadingMatchId !== m.id}
                                                                                >Editar Jogo</Button>
                                                                            </Space>
                                                                        )}
                                                                    </div>
                                                                </Card>
                                                            </List.Item>
                                                        );
                                                    }}
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
    );
};

export default MatchesTab;
