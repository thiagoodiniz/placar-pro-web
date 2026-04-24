import React from 'react';
import { Card, Typography, Tag, Avatar, Button, theme } from 'antd';
import { TrophyOutlined, TeamOutlined, SettingOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;

interface ChampionshipCardProps {
    champ: any;
    statusConfig: Record<string, { label: string; color: string }>;
    formatLabel: Record<string, string>;
    onEdit: (champ: any) => void;
    onManage: (id: string) => void;
}

const ChampionshipCard: React.FC<ChampionshipCardProps> = ({
    champ,
    statusConfig,
    formatLabel,
    onEdit,
    onManage
}) => {
    const { token } = theme.useToken();
    const { user } = useAuth();
    const status = statusConfig[champ.status] || statusConfig.DRAFT;
    const teamsFilled = champ.teams?.length || 0;
    const teamsTotal = champ.teamCount || 1;

    const championTeam = champ.teams?.find((t: any) => t.team.name === champ.champion);
    const championLogo = championTeam?.team.logoUrl;

    return (
        <Card
            hoverable
            styles={{ body: { padding: 0 } }}
            style={{
                overflow: 'hidden',
                borderRadius: 20,
                border: `1px solid ${token.colorBorderSecondary}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
            onClick={() => onManage(champ.id)}
        >
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1, paddingRight: 10 }}>
                        <Title level={4} style={{ margin: 0, fontSize: 17, fontWeight: 700, lineHeight: 1.2, color: token.colorText }}>
                            {champ.name}
                        </Title>
                    </div>
                    <Tag color={status.color} style={{
                        margin: 0,
                        borderRadius: 20,
                        border: 'none',
                        padding: '2px 10px',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        background: `${status.color}15`,
                        color: status.color,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                    }}>
                        {status.label}
                    </Tag>
                </div>

                <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: token.colorFillTertiary,
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        color: token.colorTextSecondary
                    }}>
                        <TrophyOutlined style={{ fontSize: 13 }} />
                        {formatLabel[champ.format]}
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: token.colorFillTertiary,
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        color: token.colorTextSecondary
                    }}>
                        <TeamOutlined style={{ fontSize: 13 }} />
                        {teamsFilled} / {teamsTotal} Times
                    </div>

                    {champ.format === 'GROUPS_KNOCKOUT' && (
                        <div style={{
                            background: token.colorFillTertiary,
                            padding: '4px 10px',
                            borderRadius: 8,
                            fontSize: 12,
                            color: token.colorTextSecondary
                        }}>
                            {champ.groupCount} Grupos
                        </div>
                    )}
                </div>

                {champ.status === 'FINISHED' && champ.champion ? (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px',
                        background: 'linear-gradient(135deg, rgba(250,219,20,0.15) 0%, rgba(250,219,20,0.05) 100%)',
                        borderRadius: 12, border: '1px solid rgba(250,219,20,0.2)',
                    }}>
                        <div style={{ position: 'relative' }}>
                            <Avatar
                                src={<img src={championLogo} referrerPolicy="no-referrer" alt={champ.champion} />}
                                size={38}
                                icon={<TeamOutlined />}
                                style={{ border: '2px solid #fadb14', background: '#fff' }}
                            />
                            <div style={{
                                position: 'absolute', bottom: -4, right: -4,
                                background: '#fadb14',
                                width: 16, height: 16,
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                border: '2px solid #fff'
                            }}>
                                <TrophyOutlined style={{ color: '#fff', fontSize: 9 }} />
                            </div>
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: 10, display: 'block', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Campeão</Text>
                            <Text strong style={{ color: '#d4a017', fontSize: 14 }}>{champ.champion}</Text>
                        </div>
                    </div>
                ) : (
                    <div style={{ height: 52, display: 'flex', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic', opacity: 0.7 }}>
                            {champ.status === 'STARTED' ? 'Competição em progresso...' : 'Preparando início do torneio...'}
                        </Text>
                    </div>
                )}
            </div>

            <div
                style={{
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                    padding: '14px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: token.colorFillQuaternary,
                }}
                onClick={e => e.stopPropagation()}
            >
                {user?.role && user.role !== 'USER' && champ.status === 'DRAFT' ? (
                    <Button
                        size="middle"
                        type="text"
                        icon={<SettingOutlined />}
                        onClick={() => onEdit(champ)}
                        style={{ borderRadius: 8, fontWeight: 500 }}
                    >
                        Ajustar
                    </Button>
                ) : (
                    <div />
                )}
                <Button
                    size="middle"
                    type="primary"
                    icon={<ArrowRightOutlined />}
                    onClick={() => onManage(champ.id)}
                    style={{
                        borderRadius: 8,
                        fontWeight: 600,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                >
                    Ver campeonato
                </Button>
            </div>
        </Card>
    );
};

export default ChampionshipCard;
