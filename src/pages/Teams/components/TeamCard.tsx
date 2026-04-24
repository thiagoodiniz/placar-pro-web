import React from 'react';
import { Card, Typography, Space, Divider, Tag, theme } from 'antd';
import { TeamOutlined, DesktopOutlined, InfoCircleOutlined, ClockCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface TeamCardProps {
    team: any;
    onClick: () => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, onClick }) => {
    const { token } = theme.useToken();
    const pColor = team.primaryColor || '#16a34a';
    const sColor = team.secondaryColor || '#ffffff';
    const initials = (team.name || 'T').split(' ').filter(Boolean).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
    const stats = team.stats || {};

    return (
        <Card
            hoverable
            styles={{ body: { padding: 0 } }}
            style={{
                borderRadius: 20,
                overflow: 'hidden',
                border: `1px solid ${token.colorBorderSecondary}`,
                transition: 'all 0.3s ease-in-out',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
            onClick={onClick}
        >
            {/* Card Header with Accent Color Gradient */}
            <div style={{
                height: 100,
                background: `linear-gradient(135deg, ${pColor} 0%, ${sColor} 100%)`,
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '0 20px'
            }}>
                <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    background: '#fff',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `4px solid #fff`,
                    position: 'absolute',
                    bottom: -36,
                    overflow: 'hidden',
                    zIndex: 2
                }}>
                    {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'scale-down' }} />
                    ) : (
                        <div style={{
                            width: '100%', height: '100%',
                            background: `linear-gradient(45deg, ${pColor}, ${sColor})`,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 28,
                            fontWeight: 900,
                            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                            {initials}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ padding: '48px 20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Title level={4} style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 18 }}>
                            {team.name}
                        </Title>
                        <Space split={<Divider type="vertical" />} style={{ fontSize: 12, color: token.colorTextSecondary, marginTop: 4 }}>
                            <span><TeamOutlined /> {stats.playerCount || 0}</span>
                            <span><DesktopOutlined /> {stats.championshipCount || 0}</span>
                        </Space>
                    </div>
                </div>

                {/* CTA Message */}
                <div style={{
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: token.colorPrimary,
                    fontSize: 12,
                    fontWeight: 600,
                    background: `${token.colorPrimary}08`,
                    padding: '6px 12px',
                    borderRadius: 8
                }}>
                    <InfoCircleOutlined style={{ fontSize: 14 }} />
                    Clique para visualizar o time
                </div>

            </div>

        </Card>
    );
};

export default TeamCard;
