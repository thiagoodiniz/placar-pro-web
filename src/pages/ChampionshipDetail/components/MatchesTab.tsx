import React from 'react';
import { Tabs, Button, Empty, Typography, Space, Card, List, Avatar, Divider, theme } from 'antd';
import { PlusOutlined, EnvironmentOutlined, ClockCircleOutlined, EditOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface MatchesTabProps {
    groupedMatches: any;
    activePhase: string;
    setActivePhase: (phase: string) => void;
    currentRound: number;
    setCurrentRound: (round: number) => void;
    championship: any;
    onOpenResultModal: (match: any) => void;
    onOpenDetailsModal: (match: any) => void;
    onOpenManualMatchModal: () => void;
}

const MatchesTab: React.FC<MatchesTabProps> = ({
    groupedMatches,
    activePhase,
    setActivePhase,
    currentRound,
    setCurrentRound,
    championship,
    onOpenResultModal,
    onOpenDetailsModal,
    onOpenManualMatchModal
}) => {
    const { token } = theme.useToken();

    return (
        <div style={{ position: 'relative' }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    {championship.status === 'DRAFT' && championship.matchMode === 'MANUALLY' && championship.status !== 'FINISHED' && (
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
                            const roundMatches = phaseMatches.filter((m: any) => (m.round || 1) === activeRound);

                            const matchesByGroup = roundMatches.reduce((acc: any, m: any) => {
                                const g = m.groupName || '';
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

                                        {Object.keys(matchesByGroup).sort().map(gName => (
                                            <div key={gName} style={{ marginBottom: 16 }}>
                                                <div style={{ paddingLeft: 10, borderLeft: `3px solid ${token.colorPrimary}`, marginBottom: 12 }}>
                                                    <Text strong style={{ color: token.colorPrimary }}>{gName}</Text>
                                                </div>
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
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: (homeScorers.length > 0 || awayScorers.length > 0) ? 4 : 10 }}>
                                                                        <div style={{ flex: 1, minWidth: 0, textAlign: 'right', paddingRight: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                                                                            <Text strong style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.homeTeam?.name || 'TBD'}</Text>
                                                                            <Avatar
                                                                                size="small"
                                                                                src={<img src={m.homeTeam?.logoUrl} alt={m.homeTeam?.name} referrerPolicy="no-referrer" />}
                                                                                style={{ backgroundColor: '#f5f5f5', flexShrink: 0 }}
                                                                            >
                                                                                {!m.homeTeam?.logoUrl && m.homeTeam?.name?.[0].toUpperCase()}
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
                                                                                ? (m.homePenalties !== undefined && m.awayPenalties !== undefined
                                                                                    ? `${m.homeScore}(${m.homePenalties}) × ${m.awayScore}(${m.awayPenalties})`
                                                                                    : `${m.homeScore} × ${m.awayScore}`)
                                                                                : 'vs'}
                                                                        </div>
                                                                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left', paddingLeft: 10, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 8 }}>
                                                                            <Avatar
                                                                                size="small"
                                                                                src={<img src={m.awayTeam?.logoUrl} alt={m.awayTeam?.name} referrerPolicy="no-referrer" />}
                                                                                style={{ backgroundColor: '#f5f5f5', flexShrink: 0 }}
                                                                            >
                                                                                {!m.awayTeam?.logoUrl && m.awayTeam?.name?.[0].toUpperCase()}
                                                                            </Avatar>
                                                                            <Text strong style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.awayTeam?.name || 'TBD'}</Text>
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
                                                                            <span><EnvironmentOutlined /> {m.location || 'Local TBD'}</span>
                                                                            <span><ClockCircleOutlined /> {m.dateTime ? dayjs(m.dateTime).format('DD/MM HH:mm') : 'Hora TBD'}</span>
                                                                        </Space>
                                                                        {championship.status !== 'FINISHED' && (
                                                                            <Space>
                                                                                <Button size="small" icon={<EditOutlined />} onClick={() => onOpenDetailsModal(m)} />
                                                                                <Button
                                                                                    size="small"
                                                                                    type="primary"
                                                                                    disabled={championship.status !== 'STARTED'}
                                                                                    onClick={() => onOpenResultModal(m)}
                                                                                >Placar</Button>
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
