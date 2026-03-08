import React, { useEffect, useState } from 'react';
import { Button, Modal, Form, Input, Typography, Card, List, Avatar, Tag, Row, Col } from 'antd';
import { PlusOutlined, UserAddOutlined, TeamOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;

const TeamsPage: React.FC = () => {
    const [teams, setTeams] = useState([]);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<any>(null);
    const [teamForm] = Form.useForm();
    const [playerForm] = Form.useForm();

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams');
            setTeams(response.data);
        } catch (error) {
            console.error('Error fetching teams', error);
        }
    };

    const handleCreateTeam = async (values: any) => {
        try {
            await api.post('/teams', values);
            setIsTeamModalOpen(false);
            teamForm.resetFields();
            fetchTeams();
        } catch (error) {
            console.error('Error creating team', error);
        }
    };

    const handleAddPlayer = async (values: any) => {
        try {
            await api.post(`/teams/${selectedTeam.id}/players`, values);
            setIsPlayerModalOpen(false);
            playerForm.resetFields();
            fetchTeams();
        } catch (error) {
            console.error('Error adding player', error);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={2} style={{ margin: 0 }}>Gestão de Times</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsTeamModalOpen(true)} size="large" shape="round">
                    Novo Time
                </Button>
            </div>

            <Row gutter={[16, 16]}>
                {teams.map((team: any) => (
                    <Col xs={24} sm={12} lg={8} key={team.id}>
                        <Card
                            hoverable
                            actions={[
                                <Button type="link" icon={<UserAddOutlined />} onClick={() => {
                                    setSelectedTeam(team);
                                    setIsPlayerModalOpen(true);
                                }}>Add Jogador</Button>
                            ]}
                        >
                            <Card.Meta
                                avatar={<Avatar icon={<TeamOutlined />} src={team.logoUrl} />}
                                title={team.name}
                                description={<Tag color="blue">{team.players?.length || 0} Jogadores</Tag>}
                            />
                            <List
                                size="small"
                                style={{ marginTop: 16 }}
                                dataSource={team.players || []}
                                renderItem={(player: any) => (
                                    <List.Item>
                                        <Text style={{ fontSize: '12px' }}>{player.name}</Text>
                                    </List.Item>
                                )}
                                locale={{ emptyText: <Text type="secondary" style={{ fontSize: 12 }}>Nenhum jogador cadastrado</Text> }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            <Modal
                title="Novo Time"
                open={isTeamModalOpen}
                onCancel={() => setIsTeamModalOpen(false)}
                onOk={() => teamForm.submit()}
                okText="Criar"
                cancelText="Cancelar"
            >
                <Form form={teamForm} layout="vertical" onFinish={handleCreateTeam}>
                    <Form.Item name="name" label="Nome do Time" rules={[{ required: true, message: 'Por favor, insira o nome do time' }]}>
                        <Input placeholder="Ex: Real Madrid, Time do Bairro..." />
                    </Form.Item>
                    <Form.Item name="logoUrl" label="URL do Escudo">
                        <Input placeholder="https://exemplo.com/logo.png" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={`Adicionar Jogador ao ${selectedTeam?.name}`}
                open={isPlayerModalOpen}
                onCancel={() => setIsPlayerModalOpen(false)}
                onOk={() => playerForm.submit()}
                okText="Adicionar"
                cancelText="Cancelar"
            >
                <Form form={playerForm} layout="vertical" onFinish={handleAddPlayer}>
                    <Form.Item name="name" label="Nome do Jogador" rules={[{ required: true, message: 'Por favor, insira o nome do jogador' }]}>
                        <Input placeholder="Ex: Cristiano Ronaldo, Neymar..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TeamsPage;
