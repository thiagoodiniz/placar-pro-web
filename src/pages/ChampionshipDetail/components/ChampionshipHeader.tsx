import React from 'react';
import { Typography, Tag, Button, message } from 'antd';
import { SettingOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;

interface ChampionshipHeaderProps {
    championship: any;
    onOpenConfig: () => void;
}

const ChampionshipHeader: React.FC<ChampionshipHeaderProps> = ({ championship, onOpenConfig }) => {
    const { user } = useAuth();
    return (
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Title level={2} style={{ margin: 0, fontSize: '1.5rem', lineHeight: 1.2 }}>
                        {championship.name}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 2 }}>
                        {championship.format === 'GROUPS_KNOCKOUT' ? 'Grupos + Mata-mata' :
                            championship.format === 'LEAGUE' ? 'Liga (Pontos Corridos)' : 'Mata-mata Direto'}
                    </Text>
                </div>
                <Tag
                    color={championship.status === 'FINISHED' ? 'gold' : championship.status === 'STARTED' ? 'green' : 'orange'}
                    style={{ margin: 0, flexShrink: 0, marginTop: 4 }}
                >
                    {championship.status === 'FINISHED' ? 'Finalizado' : championship.status === 'STARTED' ? 'Em Andamento' : 'Rascunho'}
                </Tag>
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                paddingTop: 8,
                borderTop: '1px solid rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <Tag color="blue" style={{ margin: 0 }}>{championship.teamCount} Times</Tag>
                    {championship.format === 'GROUPS_KNOCKOUT' && <Tag color="cyan" style={{ margin: 0 }}>{championship.groupCount} Grupos</Tag>}
                    {championship.format === 'LEAGUE' && <Tag color="cyan" style={{ margin: 0 }}>{championship.roundTrip ? 'Ida e Volta' : 'Turno Único'}</Tag>}
                </div>

                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                    {(championship.status === 'STARTED' || championship.status === 'FINISHED') && (
                        <Button
                            type="primary"
                            ghost
                            size="middle"
                            icon={<ShareAltOutlined />}
                            onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                message.success('Link do campeonato copiado!');
                            }}
                            style={{ borderRadius: 8 }}
                        >
                            Compartilhar
                        </Button>
                    )}
                    {(championship.status === 'DRAFT' || championship.status === 'STARTED') && user?.role && user.role !== 'USER' && (
                        <Button
                            icon={<SettingOutlined />}
                            onClick={onOpenConfig}
                            style={{ borderRadius: 8 }}
                        >
                            Configurações
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChampionshipHeader;
