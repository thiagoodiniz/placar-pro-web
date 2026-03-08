import React, { useEffect, useState } from 'react';
import { Tabs, Table, Card, Typography, Space } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

const StandingsPage: React.FC = () => {
    const [championships, setChampionships] = useState([]);
    const [selectedChamp, setSelectedChamp] = useState<any>(null);
    const [standings, setStandings] = useState<any[]>([]);

    useEffect(() => {
        fetchChampionships();
    }, []);

    const fetchChampionships = async () => {
        try {
            const response = await api.get('/championships');
            setChampionships(response.data.filter((c: any) => c.status === 'STARTED'));
        } catch (error) {
            console.error('Error fetching championships', error);
        }
    };

    const fetchStandings = async (championshipId: string) => {
        try {
            const response = await api.get(`/championships/${championshipId}/standings`);
            setStandings(response.data);
        } catch (error) {
            console.error('Error fetching standings', error);
        }
    };

    const columns = [
        {
            title: 'Pos',
            key: 'rank',
            width: 50,
            render: (_: any, __: any, index: number) => {
                const color = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'transparent';
                return <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: color,
                    textAlign: 'center',
                    lineHeight: '24px',
                    fontWeight: 'bold',
                    color: index < 3 ? 'white' : 'inherit'
                }}>{index + 1}</div>;
            }
        },
        { title: 'Time', dataIndex: 'teamName', key: 'teamName', fixed: 'left' as const },
        { title: 'P', dataIndex: 'points', key: 'points', sorter: (a: any, b: any) => b.points - a.points, render: (p: number) => <Text strong>{p}</Text> },
        { title: 'J', dataIndex: 'played', key: 'played' },
        { title: 'V', dataIndex: 'wins', key: 'wins' },
        { title: 'E', dataIndex: 'draws', key: 'draws' },
        { title: 'D', dataIndex: 'losses', key: 'losses' },
        { title: 'GP', dataIndex: 'goalsFor', key: 'goalsFor' },
        { title: 'GC', dataIndex: 'goalsAgainst', key: 'goalsAgainst' },
        { title: 'SG', dataIndex: 'gd', key: 'gd', render: (sg: number) => <Text type={sg > 0 ? 'success' : sg < 0 ? 'danger' : 'secondary'}>{sg > 0 ? `+${sg}` : sg}</Text> },
    ];

    const tabItems = standings.map((group: any) => ({
        key: group.groupId,
        label: group.groupName,
        children: (
            <Table
                dataSource={group.standings}
                columns={columns}
                pagination={false}
                rowKey="teamName"
                scroll={{ x: 600 }}
                size="small"
            />
        )
    }));

    return (
        <div style={{ paddingBottom: '24px' }}>
            <Title level={3}>Classificação</Title>

            <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '12px', marginBottom: '16px' }}>
                <Space>
                    {championships.map((c: any) => (
                        <Card
                            key={c.id}
                            size="small"
                            hoverable
                            onClick={() => {
                                setSelectedChamp(c);
                                fetchStandings(c.id);
                            }}
                            style={{
                                minWidth: '150px',
                                border: selectedChamp?.id === c.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                                background: selectedChamp?.id === c.id ? '#e6f7ff' : '#fff',
                                textAlign: 'center'
                            }}
                        >
                            <TrophyOutlined style={{ color: selectedChamp?.id === c.id ? '#1890ff' : '#8c8c8c' }} />
                            <div style={{ marginTop: '4px', fontWeight: '500' }}>{c.name}</div>
                        </Card>
                    ))}
                </Space>
            </div>

            {selectedChamp ? (
                <Card styles={{ body: { padding: '12px' } }}>
                    <Tabs items={[
                        { key: 'standings', label: 'Geral', children: <Tabs items={tabItems} type="card" /> },
                        {
                            key: 'series',
                            label: 'Séries',
                            children: (
                                <Space direction="vertical" style={{ width: '100%', padding: '20px', textAlign: 'center' }}>
                                    <Text type="secondary">As séries Ouro e Prata serão geradas após o fim da fase de grupos.</Text>
                                </Space>
                            )
                        },
                    ]} />
                </Card>
            ) : (
                <Card style={{ textAlign: 'center', padding: '40px' }}>
                    <Text type="secondary">Selecione um campeonato para ver a classificação.</Text>
                </Card>
            )}
        </div>
    );
};

export default StandingsPage;
