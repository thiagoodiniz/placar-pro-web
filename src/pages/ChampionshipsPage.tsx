import React, { useEffect, useState } from 'react';
import { Button, Modal, Form, Input, Select, InputNumber, Space, Tag, Typography, Card, Row, Col, Progress, Empty, Radio } from 'antd';
import { PlusOutlined, ArrowRightOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const { Title, Text } = Typography;

const ChampionshipsPage: React.FC = () => {
    const navigate = useNavigate();
    const [championships, setChampionships] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChamp, setSelectedChamp] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [createForm] = Form.useForm();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const champsRes = await api.get('/championships');
            setChampionships(champsRes.data);
        } catch (error) {
            console.error('Error fetching data', error);
        }
    };

    const handleCreate = async (values: any) => {
        try {
            const payload = { ...values, hasGoldSilver: false };
            if (values.format === 'KNOCKOUT') {
                delete payload.groupCount;
                delete payload.advancingCount;
            }

            if (isEditing && selectedChamp) {
                await api.patch(`/championships/${selectedChamp.id}`, payload);
            } else {
                await api.post('/championships', payload);
            }

            setIsModalOpen(false);
            setIsEditing(false);
            createForm.resetFields();
            fetchData();
        } catch (error) {
            console.error('Error creating championship', error);
        }
    };

    const getStatusTag = (status: string) => {
        switch (status) {
            case 'STARTED': return <Tag color="green">Em Andamento</Tag>;
            case 'FINISHED': return <Tag color="blue">Finalizado</Tag>;
            default: return <Tag color="orange">Rascunho</Tag>;
        }
    };

    return (
        <div style={{ paddingBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={2} style={{ margin: 0 }}>Campeonatos</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} size="large" shape="round">
                    Novo
                </Button>
            </div>

            {championships.length === 0 ? (
                <Card style={{ padding: '40px', textAlign: 'center' }}>
                    <Empty description="Nenhum campeonato encontrado" />
                    <Button type="primary" style={{ marginTop: 16 }} onClick={() => setIsModalOpen(true)}>
                        Criar Primeiro Campeonato
                    </Button>
                </Card>
            ) : (
                <Row gutter={[16, 16]}>
                    {championships.map((champ: any) => (
                        <Col xs={24} sm={12} lg={8} key={champ.id}>
                            <Card
                                hoverable
                                styles={{ body: { padding: '20px' } }}
                                actions={[
                                    <Button type="link" icon={<ArrowRightOutlined />} onClick={() => navigate(`/championships/${champ.id}`)}>Ver</Button>,
                                    ...(champ.status !== 'FINISHED' ? [<Button type="link" icon={<SettingOutlined />} onClick={() => {
                                        setSelectedChamp(champ);
                                        setIsEditing(true);
                                        createForm.setFieldsValue({
                                            name: champ.name,
                                            format: champ.format,
                                            teamCount: champ.teamCount,
                                            hasGoldSilver: champ.hasGoldSilver,
                                            groupCount: champ.groupCount,
                                            advancingCount: champ.advancingCount
                                        });
                                        setIsModalOpen(true);
                                    }}>Configurar</Button>] : [])
                                ]}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <Title level={4} style={{ margin: 0 }}>{champ.name}</Title>
                                    {getStatusTag(champ.status)}
                                </div>

                                <Space direction="vertical" style={{ width: '100%' }} size="small">
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary"><TeamOutlined /> Times</Text>
                                        <Text strong>{champ.teams?.length || 0} / {champ.teamCount}</Text>
                                    </div>
                                    <Progress
                                        percent={Math.round(((champ.teams?.length || 0) / champ.teamCount) * 100)}
                                        size="small"
                                        status={champ.status === 'STARTED' ? 'active' : champ.status === 'FINISHED' ? 'success' : 'normal'}
                                    />

                                    <div style={{ marginTop: 8 }}>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                            {champ.format === 'GROUPS_KNOCKOUT' ? 'Grupos + Mata-mata' :
                                                champ.format === 'LEAGUE' ? 'Liga (Pontos Corridos)' : 'Mata-mata Direto'}
                                        </Text>
                                    </div>

                                    {champ.status === 'FINISHED' && champ.champion && (
                                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            <span style={{ fontSize: '16px' }}>🏆</span>
                                            <Text strong style={{ color: '#faad14' }}>{champ.champion}</Text>
                                        </div>
                                    )}
                                </Space>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <Modal
                title={isEditing ? "Editar Campeonato" : "Novo Campeonato"}
                open={isModalOpen}
                onCancel={() => { setIsModalOpen(false); setIsEditing(false); createForm.resetFields(); }}
                onOk={() => createForm.submit()}
                width={500}
            >
                <Form form={createForm} layout="vertical" onFinish={handleCreate} initialValues={{ format: 'GROUPS_KNOCKOUT', teamCount: 8, groupCount: 2, advancingCount: 2 }}>
                    <Form.Item name="name" label="Nome do Campeonato" rules={[{ required: true, message: 'Digite o nome' }]}>
                        <Input placeholder="Ex: Copa Interbairros 2024" />
                    </Form.Item>

                    <Form.Item name="format" label="Formato">
                        <Select options={[
                            { label: 'Grupos + Mata-mata', value: 'GROUPS_KNOCKOUT' },
                            { label: 'Mata-mata Direto', value: 'KNOCKOUT' },
                            { label: 'Liga (Pontos Corridos)', value: 'LEAGUE' },
                        ]} />
                    </Form.Item>

                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, curr) => prev.format !== curr.format || prev.teamCount !== curr.teamCount || prev.groupCount !== curr.groupCount}
                    >
                        {({ getFieldValue }) => {
                            const format = getFieldValue('format');
                            const teamCount = getFieldValue('teamCount') || 0;
                            const groupCount = getFieldValue('groupCount') || 2;

                            return (
                                <>
                                    <Form.Item
                                        name="teamCount"
                                        label="Quantidade de Times"
                                        rules={[
                                            { required: true },
                                            { type: 'number', min: format === 'KNOCKOUT' ? 2 : 3, message: `Mínimo de ${format === 'KNOCKOUT' ? 2 : 3} times` }
                                        ]}
                                    >
                                        <InputNumber min={2} style={{ width: '100%' }} />
                                    </Form.Item>

                                    {format === 'GROUPS_KNOCKOUT' && (
                                        <>
                                            <Row gutter={16}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        name="groupCount"
                                                        label="Qtd de Grupos"
                                                        rules={[
                                                            { required: true },
                                                            ({ getFieldValue }) => ({
                                                                validator(_, value) {
                                                                    const tc = getFieldValue('teamCount');
                                                                    if (value > 1 && value % 2 !== 0) {
                                                                        return Promise.reject(new Error('Número de grupos deve ser 1 ou par'));
                                                                    }
                                                                    if (tc % value !== 0) return Promise.reject(new Error('Times devem ser divisíveis pelos grupos'));
                                                                    return Promise.resolve();
                                                                },
                                                            }),
                                                        ]}
                                                    >
                                                        <InputNumber min={1} max={teamCount} style={{ width: '100%' }} />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        name="advancingCount"
                                                        label="Classificados/Grupo"
                                                        rules={[
                                                            { required: true },
                                                            ({ getFieldValue }) => ({
                                                                validator(_, value) {
                                                                    const tc = getFieldValue('teamCount');
                                                                    const gc = getFieldValue('groupCount') || 1;
                                                                    const teamsPerGroup = tc / gc;
                                                                    if (value >= teamsPerGroup) {
                                                                        return Promise.reject(new Error(`Deve ser menor que ${teamsPerGroup} (times por grupo)`));
                                                                    }
                                                                    return Promise.resolve();
                                                                },
                                                            }),
                                                        ]}
                                                    >
                                                        <InputNumber min={1} style={{ width: '100%' }} />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                            <div style={{ marginBottom: 16, padding: '8px 12px', background: '#f5f5f5', borderRadius: 4 }}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    Configuração: <b>{groupCount}</b> grupos de <b>{teamCount / groupCount || 0}</b> times.
                                                    Total de <b>{groupCount * getFieldValue('advancingCount')}</b> classificados.
                                                </Text>
                                            </div>
                                        </>
                                    )}

                                    {format === 'LEAGUE' && (
                                        <Form.Item name="roundTrip" label="Turno e Returno (Ida e Volta)?">
                                            <Radio.Group>
                                                <Radio value={true}>Sim (Ida e Volta)</Radio>
                                                <Radio value={false}>Não (Turno Único)</Radio>
                                            </Radio.Group>
                                        </Form.Item>
                                    )}
                                </>
                            );
                        }}
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ChampionshipsPage;
