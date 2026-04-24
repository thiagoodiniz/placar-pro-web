import React from 'react';
import { Typography, Tag, Space, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;

interface ChampionshipHeaderProps {
    championship: any;
    onOpenConfig: () => void;
}

const ChampionshipHeader: React.FC<ChampionshipHeaderProps> = ({ championship, onOpenConfig }) => {
    const { user } = useAuth();
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
                <Title level={2} style={{ margin: 0 }}>{championship.name}</Title>
                <Text type="secondary">
                    {championship.format === 'GROUPS_KNOCKOUT' ? 'Grupos + Mata-mata' :
                        championship.format === 'LEAGUE' ? 'Liga (Pontos Corridos)' : 'Mata-mata Direto'}
                </Text>
                <div style={{ marginTop: 8 }}>
                    <Tag color="blue">{championship.teamCount} Times</Tag>
                    {championship.format === 'GROUPS_KNOCKOUT' && <Tag color="cyan">{championship.groupCount} Grupos</Tag>}
                    {championship.format === 'LEAGUE' && <Tag color="cyan">{championship.roundTrip ? 'Ida e Volta' : 'Turno Único'}</Tag>}
                </div>
            </div>
            <Space direction="vertical" align="end">
                <Space>
                    {championship.status === 'DRAFT' && user?.role && user.role !== 'USER' && (
                        <Button icon={<SettingOutlined />} onClick={onOpenConfig} />
                    )}
                </Space>
                <Tag color={championship.status === 'FINISHED' ? 'gold' : championship.status === 'STARTED' ? 'green' : 'orange'}>
                    {championship.status === 'FINISHED' ? 'Finalizado' : championship.status === 'STARTED' ? 'Em Andamento' : 'Rascunho'}
                </Tag>
            </Space>
        </div>
    );
};

export default ChampionshipHeader;
