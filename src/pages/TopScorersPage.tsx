import React, { useEffect, useState } from 'react';
import { Table, Card, Typography, Space, Tag, Avatar } from 'antd';
import { FireOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

const TopScorersPage: React.FC = () => {
    const [championships, setChampionships] = useState([]);
    const [selectedChamp, setSelectedChamp] = useState<any>(null);
    const [scorers, setScorers] = useState<any[]>([]);

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

    const fetchScorers = async (championshipId: string) => {
        try {
            const response = await api.get(`/matches/championship/${championshipId}/top-scorers`);
            setScorers(response.data);
        } catch (error) {
            console.error('Error fetching scorers', error);
        }
    };

    const columns = [
        {
            title: 'Jogador',
            key: 'player',
            render: (record: any) => (
                <Space>
                    <Avatar icon={<UserOutlined />} size="small" />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>{record.player}</div>
                        <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{record.team}</div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Gols',
            dataIndex: 'goals',
            key: 'goals',
            width: 80,
            sorter: (a: any, b: any) => b.goals - a.goals,
            render: (goals: number) => (
                <Tag color="volcano" icon={<FireOutlined />} style={{ fontWeight: 'bold', borderRadius: '12px' }}>
                    {goals}
                </Tag>
            )
        },
    ];

    return (
        <div style={{ paddingBottom: '24px' }}>
            <Title level={3}>Artilharia</Title>

            <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '12px', marginBottom: '16px' }}>
                <Space>
                    {championships.map((c: any) => (
                        <Card
                            key={c.id}
                            size="small"
                            hoverable
                            onClick={() => {
                                setSelectedChamp(c);
                                fetchScorers(c.id);
                            }}
                            style={{
                                minWidth: '150px',
                                border: selectedChamp?.id === c.id ? '2px solid #fa8c16' : '1px solid #f0f0f0',
                                background: selectedChamp?.id === c.id ? '#fff7e6' : '#fff',
                                textAlign: 'center'
                            }}
                        >
                            <TrophyOutlined style={{ color: selectedChamp?.id === c.id ? '#fa8c16' : '#8c8c8c' }} />
                            <div style={{ marginTop: '4px', fontWeight: '500' }}>{c.name}</div>
                        </Card>
                    ))}
                </Space>
            </div>

            {selectedChamp ? (
                <Table
                    dataSource={scorers}
                    columns={columns}
                    rowKey={(r) => `${r.player}-${r.team}`}
                    pagination={{ pageSize: 20 }}
                    size="middle"
                />
            ) : (
                <Card style={{ textAlign: 'center', padding: '40px' }}>
                    <Text type="secondary">Selecione um campeonato para ver os artilheiros.</Text>
                </Card>
            )}
        </div>
    );
};

export default TopScorersPage;
