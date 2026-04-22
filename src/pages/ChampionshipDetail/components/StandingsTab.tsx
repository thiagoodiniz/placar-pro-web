import React from 'react';
import { Card, Table, Typography, Space, Avatar, theme } from 'antd';

const { Text } = Typography;

interface StandingsTabProps {
    standings: any[];
    championship: any;
}

const StandingsTab: React.FC<StandingsTabProps> = ({ standings, championship }) => {
    const { token } = theme.useToken();

    const standingColumns = [
        { title: 'Pos', key: 'pos', width: 50, render: (_: any, __: any, i: number) => i + 1 },
        {
            title: 'Time',
            key: 'teamName',
            fixed: 'left' as const,
            width: 140,
            render: (record: any) => (
                <Space size={8} style={{ width: '100%' }}>
                    <Avatar
                        size="small"
                        src={<img src={record.teamLogoUrl} alt={record.teamName} referrerPolicy="no-referrer" />}
                        style={{ backgroundColor: '#f0f0f0', flexShrink: 0 }}
                    >
                        {!record.teamLogoUrl && (record.teamName?.[0]?.toUpperCase() || '?')}
                    </Avatar>
                    <Text strong style={{ fontSize: 13, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{record.teamName}</Text>
                </Space>
            )
        },
        { title: 'P', dataIndex: 'points', key: 'points', width: 40, render: (p: number) => <Text strong>{p}</Text> },
        { title: 'J', dataIndex: 'played', key: 'played', width: 40 },
        { title: 'V', dataIndex: 'wins', key: 'wins', width: 40 },
        { title: 'E', dataIndex: 'draws', key: 'draws', width: 40 },
        { title: 'D', dataIndex: 'losses', key: 'losses', width: 40 },
        { title: 'SG', dataIndex: 'gd', key: 'gd', width: 40 },
    ];

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{
                padding: '6px 12px', fontSize: '11px',
                color: token.colorTextSecondary,
                background: token.colorFillQuaternary,
                borderRadius: 6, display: 'flex', flexWrap: 'wrap', gap: '4px 16px',
            }}>
                <span><b>P</b> - Pontos</span>
                <span><b>J</b> - Jogos</span>
                <span><b>V</b> - Vitórias</span>
                <span><b>E</b> - Empates</span>
                <span><b>D</b> - Derrotas</span>
                <span><b>SG</b> - Saldo de Gols</span>
            </div>
            {standings.map((group: any) => (
                <Card key={group.groupId} title={group.groupName} size="small" styles={{ body: { padding: 0 } }}>
                    <Table
                        dataSource={group.standings}
                        columns={standingColumns}
                        pagination={false}
                        size="small"
                        rowKey="teamId"
                        scroll={{ x: true }}
                        rowClassName={(_, index) => {
                            if (championship.format === 'LEAGUE') return '';
                            return index < (championship.advancingCount || 2) ? 'classification-zone' : '';
                        }}
                    />
                </Card>
            ))}
        </Space>
    );
};

export default StandingsTab;
