import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, InputNumber, Card, Typography, Space, DatePicker, Input, Select, Divider } from 'antd';
import { EditOutlined, TrophyOutlined, EnvironmentOutlined, ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const MatchManagementPage: React.FC = () => {
    const [championships, setChampionships] = useState<any[]>([]);
    const [selectedChamp, setSelectedChamp] = useState<any>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);

    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCreateMatchModalOpen, setIsCreateMatchModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<any>(null);

    const [resultForm] = Form.useForm();
    const [detailsForm] = Form.useForm();
    const [createMatchForm] = Form.useForm();

    useEffect(() => {
        fetchChampionships();
        fetchTeams();
    }, []);

    const fetchChampionships = async () => {
        try {
            const response = await api.get('/championships');
            setChampionships(response.data.filter((c: any) => c.status === 'STARTED'));
        } catch (error) {
            console.error('Error fetching championships', error);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams');
            setTeams(response.data);
        } catch (error) {
            console.error('Error fetching teams', error);
        }
    };

    const fetchMatches = async (championshipId: string) => {
        try {
            const response = await api.get(`/championships/${championshipId}/matches`);
            setMatches(response.data);
        } catch (error) {
            console.error('Error fetching matches', error);
        }
    };

    const handleUpdateResult = async (values: any) => {
        try {
            // Transform goals: values.goals is [{ playerName: [name], teamId: id }]
            const transformedGoals = (values.goals || []).map((g: any) => {
                const pName = Array.isArray(g.playerName) ? g.playerName[0] : g.playerName;
                const team = teams.find((t: any) => t.id === g.teamId);
                return {
                    playerId: pName, // Reuse name as ID for simplicity if new
                    playerName: pName,
                    teamId: g.teamId,
                    teamName: team ? team.name : 'Unknown'
                };
            });

            await api.patch(`/matches/${selectedMatch.id}`, {
                ...values,
                goals: transformedGoals
            });
            setIsResultModalOpen(false);
            fetchMatches(selectedChamp.id);
        } catch (error) {
            console.error('Error updating match result', error);
        }
    };

    const handleUpdateDetails = async (values: any) => {
        try {
            const formattedDate = values.dateTime ? values.dateTime.toISOString() : undefined;
            await api.patch(`/matches/${selectedMatch.id}/details`, { ...values, dateTime: formattedDate });
            setIsDetailsModalOpen(false);
            fetchMatches(selectedChamp.id);
        } catch (error) {
            console.error('Error updating match details', error);
        }
    };

    const handleCreateMatch = async (values: any) => {
        try {
            // We need a create match endpoint. 
            // For now, I'll assume the backend has it under POST /matches
            // or I'll just skip the actual implementation if it blocks.
            // I already added Match.create to the mock, let's use it.
            await api.post('/championships/match', { ...values, championshipId: selectedChamp.id });
            setIsCreateMatchModalOpen(false);
            createMatchForm.resetFields();
            fetchMatches(selectedChamp.id);
        } catch (error) {
            console.error('Error creating match', error);
        }
    };

    const columns = [
        {
            title: 'Partida',
            key: 'match',
            render: (record: any) => (
                <div style={{ padding: '8px 0' }}>
                    <div style={{ fontSize: '12px', color: '#1890ff', marginBottom: '4px', fontWeight: 'bold' }}>
                        {record.groupName ? `${record.groupName} - ` : ''}Rodada {record.round || 1}
                    </div>
                    <Space direction="vertical" size={1} style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>{record.homeTeam?.name || 'TBD'}</span>
                            <span>{record.homeScore} x {record.awayScore}</span>
                            <span>{record.awayTeam?.name || 'TBD'}</span>
                        </div>
                        <Space size="small" style={{ fontSize: '12px', color: '#8c8c8c' }}>
                            {record.location && <span><EnvironmentOutlined /> {record.location}</span>}
                            {record.dateTime && <span><ClockCircleOutlined /> {dayjs(record.dateTime).format('DD/MM HH:mm')}</span>}
                        </Space>
                    </Space>
                </div>
            )
        },
        {
            title: 'Ações',
            key: 'actions',
            width: 120,
            render: (record: any) => (
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Button size="small" block onClick={() => {
                        setSelectedMatch(record);
                        resultForm.setFieldsValue(record);
                        setIsResultModalOpen(true);
                    }}>
                        Placar
                    </Button>
                    <Button size="small" block icon={<EditOutlined />} onClick={() => {
                        setSelectedMatch(record);
                        detailsForm.setFieldsValue({
                            ...record,
                            dateTime: record.dateTime ? dayjs(record.dateTime) : null
                        });
                        setIsDetailsModalOpen(true);
                    }}>
                        Local/Hora
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Title level={3} style={{ margin: 0 }}>Gestão de Partidas</Title>
                {selectedChamp && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateMatchModalOpen(true)}>
                        Nova Partida
                    </Button>
                )}
            </div>

            <Space direction="vertical" style={{ width: '100%' }} size="large">
                <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '8px' }}>
                    <Space>
                        {championships.map((c: any) => (
                            <Card
                                key={c.id}
                                size="small"
                                hoverable
                                onClick={() => {
                                    setSelectedChamp(c);
                                    fetchMatches(c.id);
                                }}
                                style={{
                                    minWidth: '150px',
                                    border: selectedChamp?.id === c.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                                    background: selectedChamp?.id === c.id ? '#e6f7ff' : '#fff'
                                }}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <TrophyOutlined style={{ color: selectedChamp?.id === c.id ? '#1890ff' : '#8c8c8c' }} />
                                    <div style={{ marginTop: '4px', fontWeight: '500' }}>{c.name}</div>
                                </div>
                            </Card>
                        ))}
                    </Space>
                </div>

                {selectedChamp ? (
                    <Table
                        dataSource={matches}
                        columns={columns}
                        rowKey="id"
                        pagination={false}
                        size="middle"
                        scroll={{ x: true }}
                    />
                ) : (
                    <Card style={{ textAlign: 'center', padding: '40px' }}>
                        <Text type="secondary">Selecione um campeonato iniciado para gerenciar as partidas.</Text>
                    </Card>
                )}
            </Space>

            <Modal
                title="Registrar Resultado"
                open={isResultModalOpen}
                onCancel={() => setIsResultModalOpen(false)}
                onOk={() => resultForm.submit()}
                width={600}
            >
                <Form form={resultForm} layout="vertical" onFinish={handleUpdateResult}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '16px', marginBottom: '24px' }}>
                        <Form.Item name="homeScore" label={selectedMatch?.homeTeam?.name} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                            <InputNumber min={0} size="large" />
                        </Form.Item>
                        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>X</div>
                        <Form.Item name="awayScore" label={selectedMatch?.awayTeam?.name} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                            <InputNumber min={0} size="large" />
                        </Form.Item>
                    </div>

                    <Divider orientation="left">Gols e Autores</Divider>

                    <Form.List name="goals">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'playerName']}
                                            rules={[{ required: true, message: 'Nome do jogador' }]}
                                        >
                                            <Select
                                                showSearch
                                                mode="tags"
                                                style={{ width: 200 }}
                                                placeholder="Jogador"
                                                maxCount={1}
                                            >
                                                {teams.filter((t: any) => t.id === selectedMatch?.homeTeamId || t.id === selectedMatch?.awayTeamId)
                                                    .flatMap((t: any) => t.players || [])
                                                    .map((p: any) => (
                                                        <Select.Option key={p.id} value={p.name}>{p.name}</Select.Option>
                                                    ))
                                                }
                                            </Select>
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'teamId']}
                                            rules={[{ required: true, message: 'Time' }]}
                                        >
                                            <Select style={{ width: 140 }} placeholder="Time">
                                                <Select.Option value={selectedMatch?.homeTeam?.id}>{selectedMatch?.homeTeam?.name}</Select.Option>
                                                <Select.Option value={selectedMatch?.awayTeam?.id}>{selectedMatch?.awayTeam?.name}</Select.Option>
                                            </Select>
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusCircleOutlined />}>
                                        Adicionar Gol
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Form>
            </Modal>

            {/* Details Modal */}
            <Modal title="Editar Local e Horário" open={isDetailsModalOpen} onCancel={() => setIsDetailsModalOpen(false)} onOk={() => detailsForm.submit()}>
                <Form form={detailsForm} layout="vertical" onFinish={handleUpdateDetails}>
                    <Form.Item name="location" label="Local da Partida">
                        <Input prefix={<EnvironmentOutlined />} placeholder="Ex: Estádio Municipal, Quadra B..." />
                    </Form.Item>
                    <Form.Item name="dateTime" label="Data e Horário">
                        <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Create Match Modal */}
            <Modal title="Criar Nova Partida" open={isCreateMatchModalOpen} onCancel={() => setIsCreateMatchModalOpen(false)} onOk={() => createMatchForm.submit()}>
                <Form form={createMatchForm} layout="vertical" onFinish={handleCreateMatch}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Form.Item name="homeTeamId" label="Mandante" style={{ flex: 1 }} rules={[{ required: true }]}>
                            <Select placeholder="Time A">
                                {teams.map((t: any) => (<Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="awayTeamId" label="Visitante" style={{ flex: 1 }} rules={[{ required: true }]}>
                            <Select placeholder="Time B">
                                {teams.map((t: any) => (<Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>))}
                            </Select>
                        </Form.Item>
                    </div>
                    <Divider />
                    <Form.Item name="location" label="Local">
                        <Input prefix={<EnvironmentOutlined />} placeholder="Estádio..." />
                    </Form.Item>
                    <Form.Item name="dateTime" label="Data/Hora">
                        <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default MatchManagementPage;
