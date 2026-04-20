import React, { useEffect, useState } from 'react';
import {
    Button, Form, Input, Typography, Card, List, Row, Col,
    Spin, theme, Empty, Popconfirm, Avatar,
    ColorPicker, message, Modal
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    TeamOutlined, ArrowLeftOutlined, SaveOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { usePageTitle } from '../components/Layout/AppLayout';

const { Title } = Typography;

const TeamDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const { setTitle } = usePageTitle();

    const isEditing = !!id && id !== 'new';
    const [loading, setLoading] = useState(isEditing);
    const [submitting, setSubmitting] = useState(false);
    const [team, setTeam] = useState<any>(null);
    const [teamForm] = Form.useForm();
    const logoUrl = Form.useWatch('logoUrl', teamForm);

    // Player management
    const [players, setPlayers] = useState<any[]>([]);
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
    const [isPlayerEdit, setIsPlayerEdit] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<any>(null);
    const [playerForm] = Form.useForm();

    useEffect(() => {
        if (isEditing) {
            fetchTeam();
        } else {
            setTitle('Novo Time');
            teamForm.setFieldsValue({ primaryColor: '#16a34a', secondaryColor: '#ffffff' });
        }
    }, [id]);

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const response = await api.get('/teams');
            const foundTeam = Array.isArray(response.data) ? response.data.find((t: any) => t.id === id) : null;
            if (foundTeam) {
                setTeam(foundTeam);
                setPlayers(foundTeam.players || []);
                setTitle(foundTeam.name);
                teamForm.setFieldsValue({
                    name: foundTeam.name,
                    logoUrl: foundTeam.logoUrl,
                    primaryColor: foundTeam.primaryColor || '#166534',
                    secondaryColor: foundTeam.secondaryColor || '#ffffff'
                });
            } else {
                message.error('Time não encontrado');
                navigate('/teams');
            }
        } catch (error) {
            console.error('Error fetching team', error);
            message.error('Erro ao carregar dados do time');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTeam = async (values: any) => {
        setSubmitting(true);
        const payload = {
            ...values,
            primaryColor: typeof values.primaryColor === 'string' ? values.primaryColor : values.primaryColor?.toHexString?.() || values.primaryColor,
            secondaryColor: typeof values.secondaryColor === 'string' ? values.secondaryColor : values.secondaryColor?.toHexString?.() || values.secondaryColor,
        };

        try {
            if (isEditing) {
                await api.patch(`/teams/${id}`, payload);
                message.success('Time atualizado com sucesso');
                setTitle(payload.name);
            } else {
                const res = await api.post('/teams', payload);
                message.success('Time criado com sucesso');
                navigate(`/teams/${res.data.id}`);
            }
        } catch (error) {
            console.error('Error saving team', error);
            message.error('Erro ao salvar time');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTeam = async () => {
        try {
            await api.delete(`/teams/${id}`);
            message.success('Time excluído com sucesso');
            navigate('/teams');
        } catch (error) {
            console.error('Error deleting team', error);
            message.error('Erro ao excluir time');
        }
    };

    const handleSavePlayer = async (values: any) => {
        if (!isEditing) {
            message.warning('Salve o time primeiro antes de adicionar jogadores');
            return;
        }
        try {
            if (isPlayerEdit && editingPlayer) {
                await api.patch(`/teams/${id}/players/${editingPlayer.id}`, values);
            } else {
                await api.post(`/teams/${id}/players`, values);
            }
            setIsPlayerModalOpen(false);
            playerForm.resetFields();

            // Refresh team and players
            const res = await api.get('/teams');
            const updatedTeam = res.data.find((t: any) => t.id === id);
            setPlayers(updatedTeam?.players || []);
            message.success(isPlayerEdit ? 'Jogador atualizado' : 'Jogador adicionado');
        } catch (error) {
            console.error('Error saving player', error);
            message.error('Erro ao salvar jogador');
        }
    };

    const openPlayerModal = (player?: any) => {
        if (player) {
            setIsPlayerEdit(true);
            setEditingPlayer(player);
            playerForm.setFieldsValue({ name: player.name, photoUrl: player.photoUrl });
        } else {
            setIsPlayerEdit(false);
            setEditingPlayer(null);
            playerForm.resetFields();
        }
        setIsPlayerModalOpen(true);
    };

    const handleDeletePlayer = async (playerId: string) => {
        try {
            await api.delete(`/teams/${id}/players/${playerId}`);
            const res = await api.get('/teams');
            const updatedTeam = res.data.find((t: any) => t.id === id);
            setPlayers(updatedTeam?.players || []);
            message.success('Jogador removido');
        } catch (error) {
            console.error('Error deleting player', error);
            message.error('Erro ao excluir jogador');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Spin size="large" tip="Carregando..." />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 40 }}>
            {/* Header Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/teams')}
                    type="text"
                >
                    Voltar
                </Button>
                {isEditing && (
                    <Popconfirm
                        title="Excluir Time"
                        description="Tem certeza? Todos os dados vinculados serão perdidos."
                        onConfirm={handleDeleteTeam}
                        okText="Sim, excluir"
                        cancelText="Não"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger type="text" icon={<DeleteOutlined />}>Excluir Time</Button>
                    </Popconfirm>
                )}
            </div>

            <Card style={{ borderRadius: 16, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Form form={teamForm} layout="vertical" onFinish={handleSaveTeam}>
                    <Row gutter={[24, 0]}>
                        <Col xs={24} sm={16}>
                            <Form.Item name="name" label="Nome do clube" rules={[{ required: true, message: 'O nome é essencial' }]}>
                                <Input placeholder="Digite o nome do time" size="large" style={{ borderRadius: 12 }} />
                            </Form.Item>
                            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                                <Avatar
                                    size={64}
                                    src={logoUrl}
                                    shape="square"
                                    style={{
                                        borderRadius: 12,
                                        backgroundColor: token.colorFillSecondary,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                        flexShrink: 0
                                    }}
                                >
                                    {!logoUrl && <TeamOutlined style={{ fontSize: 24 }} />}
                                </Avatar>
                                <div style={{ flex: 1 }}>
                                    <Form.Item name="logoUrl" label="Link para o Escudo (URL)" style={{ margin: 0 }}>
                                        <Input placeholder="https://exemplo.com/logo.png" style={{ borderRadius: 12 }} />
                                    </Form.Item>
                                </div>
                            </div>
                        </Col>
                        <Col xs={24} sm={8}>
                            <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>Cores do Clube</Title>
                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item name="primaryColor" label="Primária">
                                        <ColorPicker
                                            showText
                                            format="hex"
                                            onChange={(color) => teamForm.setFieldsValue({ primaryColor: color.toHexString() })}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="secondaryColor" label="Secundária">
                                        <ColorPicker
                                            showText
                                            format="hex"
                                            onChange={(color) => teamForm.setFieldsValue({ secondaryColor: color.toHexString() })}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SaveOutlined />}
                            loading={submitting}
                            size="large"
                            style={{ borderRadius: 10, paddingLeft: 30, paddingRight: 30 }}
                        >
                            Salvar Dados do Clube
                        </Button>
                    </div>
                </Form>
            </Card>

            {isEditing && (
                <div style={{ marginTop: 32 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <Title level={4} style={{ margin: 0 }}>
                            <TeamOutlined /> Jogadores ({players.length})
                        </Title>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => openPlayerModal()}
                            style={{ borderRadius: 8 }}
                        >
                            Adicionar
                        </Button>
                    </div>

                    {players.length === 0 ? (
                        <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px 0', border: '1px dashed #d9d9d9' }}>
                            <Empty description="Nenhum jogador cadastrado" />
                            <Button type="dashed" icon={<PlusOutlined />} onClick={() => openPlayerModal()} style={{ marginTop: 16 }}>
                                Adicionar Primeiro Jogador
                            </Button>
                        </Card>
                    ) : (
                        <List
                            grid={{ gutter: 16, xs: 1, sm: 2 }}
                            dataSource={players}
                            renderItem={(player: any) => (
                                <List.Item>
                                    <Card
                                        size="small"
                                        style={{ borderRadius: 12 }}
                                        actions={[
                                            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openPlayerModal(player)}>Editar</Button>,
                                            <Popconfirm title="Remover jogador?" onConfirm={() => handleDeletePlayer(player.id)}>
                                                <Button type="text" size="small" danger icon={<DeleteOutlined />}>Remover</Button>
                                            </Popconfirm>
                                        ]}
                                    >
                                        <Card.Meta
                                            avatar={
                                                <Avatar
                                                    size={48}
                                                    src={player.photoUrl}
                                                    style={{ backgroundColor: token.colorFillSecondary }}
                                                >
                                                    {!player.photoUrl && (player.name?.[0]?.toUpperCase() || '?')}
                                                </Avatar>
                                            }
                                            title={player.name}
                                        />
                                    </Card>
                                </List.Item>
                            )}
                        />
                    )}
                </div>
            )}

            {/* Player Modal */}
            <Modal
                title={isPlayerEdit ? "Editar Jogador" : "Novo Jogador"}
                open={isPlayerModalOpen}
                onCancel={() => setIsPlayerModalOpen(false)}
                onOk={() => playerForm.submit()}
                okText="Salvar"
                cancelText="Cancelar"
                centered
            >
                <Form form={playerForm} layout="vertical" onFinish={handleSavePlayer} style={{ marginTop: 16 }}>
                    <Form.Item name="name" label="Nome Completo" rules={[{ required: true, message: 'Digite o nome' }]}>
                        <Input placeholder="Ex: Cristiano Ronaldo" style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item name="photoUrl" label="URL da Foto">
                        <Input placeholder="https://exemplo.com/foto.jpg" style={{ borderRadius: 8 }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TeamDetailPage;
