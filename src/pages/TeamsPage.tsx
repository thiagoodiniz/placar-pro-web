import React, { useEffect, useState, useMemo } from 'react';
import {
    Button, Modal, Form, Input, Typography, Card, List, Tag, Row, Col,
    Spin, theme, Tooltip, Empty, Popconfirm, Divider, Space, Avatar,
    ColorPicker, Grid
} from 'antd';
import {
    PlusOutlined, SearchOutlined, EditOutlined,
    DeleteOutlined, TrophyOutlined, TeamOutlined, DesktopOutlined,
    ClockCircleOutlined, ArrowRightOutlined,
    RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const TeamsPage: React.FC = () => {
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const screens = useBreakpoint();
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Team Modal
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTeam, setEditingTeam] = useState<any>(null);
    const [teamForm] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    // Player management within modal
    const [players, setPlayers] = useState<any[]>([]);
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
    const [isPlayerEdit, setIsPlayerEdit] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<any>(null);
    const [playerForm] = Form.useForm();

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const response = await api.get('/teams');
            setTeams(response.data);
        } catch (error) {
            console.error('Error fetching teams', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredTeams = useMemo(() => {
        return teams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [teams, searchTerm]);

    const handleSaveTeam = async (values: any) => {
        setSubmitting(true);
        // Normalize colors to hex strings if they come from ColorPicker objects
        const payload = {
            ...values,
            primaryColor: typeof values.primaryColor === 'string' ? values.primaryColor : values.primaryColor?.toHexString?.() || values.primaryColor,
            secondaryColor: typeof values.secondaryColor === 'string' ? values.secondaryColor : values.secondaryColor?.toHexString?.() || values.secondaryColor,
        };

        try {
            if (isEditing && editingTeam) {
                await api.patch(`/teams/${editingTeam.id}`, payload);
            } else {
                await api.post('/teams', payload);
            }
            setIsTeamModalOpen(false);
            teamForm.resetFields();
            fetchTeams();
        } catch (error) {
            console.error('Error saving team', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTeam = async (id: string) => {
        try {
            await api.delete(`/teams/${id}`);
            fetchTeams();
        } catch (error) {
            console.error('Error deleting team', error);
        }
    };

    const openEditModal = (team: any) => {
        setEditingTeam(team);
        setIsEditing(true);
        setPlayers(team.players || []);
        teamForm.setFieldsValue({
            name: team.name,
            logoUrl: team.logoUrl,
            primaryColor: team.primaryColor || '#166534',
            secondaryColor: team.secondaryColor || '#ffffff'
        });
        setIsTeamModalOpen(true);
    };

    const handleSavePlayer = async (values: any) => {
        if (!editingTeam) return;
        try {
            if (isPlayerEdit && editingPlayer) {
                await api.patch(`/teams/${editingTeam.id}/players/${editingPlayer.id}`, values);
            } else {
                await api.post(`/teams/${editingTeam.id}/players`, values);
            }
            // Refresh team and players
            const res = await api.get('/teams');
            const updatedTeam = res.data.find((t: any) => t.id === editingTeam.id);
            setTeams(res.data);
            setPlayers(updatedTeam?.players || []);
            setIsPlayerModalOpen(false);
            playerForm.resetFields();
        } catch (error) {
            console.error('Error saving player', error);
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
        if (!editingTeam) return;
        try {
            await api.delete(`/teams/${editingTeam.id}/players/${playerId}`);
            const res = await api.get('/teams');
            const updatedTeam = res.data.find((t: any) => t.id === editingTeam.id);
            setTeams(res.data);
            setPlayers(updatedTeam?.players || []);
        } catch (error) {
            console.error('Error deleting player', error);
        }
    };

    const isMobile = !screens.sm;

    return (
        <div style={{ paddingBottom: 40, padding: isMobile ? '0 8px' : '0' }}>
            <div style={{
                marginBottom: 32,
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: 16
            }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Times</Title>
                    <Text type="secondary">Gerencie os clubes e seus elencos</Text>
                </div>
                <div style={{ display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
                    <Input
                        placeholder="Buscar time..."
                        prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                        style={{ width: isMobile ? '100%' : 260, borderRadius: 12, height: 44 }}
                        onChange={e => setSearchTerm(e.target.value)}
                        allowClear
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="large"
                        onClick={() => {
                            setIsEditing(false);
                            setEditingTeam(null);
                            teamForm.resetFields();
                            teamForm.setFieldsValue({ primaryColor: '#16a34a', secondaryColor: '#ffffff' });
                            setIsTeamModalOpen(true);
                        }}
                        style={{ borderRadius: 12, height: 44 }}
                    >
                        Novo Time
                    </Button>
                </div>
            </div>

            <Spin spinning={loading}>
                {!loading && filteredTeams.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={searchTerm ? "Nenhum time encontrado" : "Nenhum time cadastrado"}
                        style={{ padding: '40px 0' }}
                    />
                ) : (
                    <Row gutter={[20, 20]}>
                        {filteredTeams.map((team: any) => {
                            const pColor = team.primaryColor || '#16a34a';
                            const sColor = team.secondaryColor || '#ffffff';
                            const initials = team.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
                            const stats = team.stats || {};

                            return (
                                <Col xs={24} sm={12} lg={8} xl={6} key={team.id}>
                                    <Card
                                        hoverable
                                        styles={{ body: { padding: 0 } }}
                                        style={{
                                            borderRadius: 20,
                                            overflow: 'hidden',
                                            border: `1px solid ${token.colorBorderSecondary}`,
                                            transition: 'all 0.3s ease-in-out',
                                            transform: 'translateY(0)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        }}
                                        onClick={() => openEditModal(team)}
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
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <Title level={4} style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 20 }}>
                                                        {team.name}
                                                    </Title>
                                                    <Space split={<Divider type="vertical" />} style={{ fontSize: 13, color: token.colorTextSecondary, marginTop: 4 }}>
                                                        <span><TeamOutlined /> {stats.playerCount}</span>
                                                        <span><DesktopOutlined /> {stats.championshipCount} comps</span>
                                                    </Space>
                                                </div>
                                                {stats.titles > 0 && (
                                                    <Tooltip title={`${stats.titles} título(s)`}>
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', gap: 6,
                                                            padding: '6px 12px', background: '#fef3c7',
                                                            borderRadius: 10, border: '1px solid #fcd34d'
                                                        }}>
                                                            <TrophyOutlined style={{ color: '#d97706', fontSize: 16 }} />
                                                            <Text strong style={{ color: '#d97706', fontSize: 14 }}>{stats.titles}</Text>
                                                        </div>
                                                    </Tooltip>
                                                )}
                                            </div>

                                            {/* Matches History Section */}
                                            <div style={{
                                                background: token.colorFillQuaternary,
                                                borderRadius: 16,
                                                padding: '16px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 12,
                                                border: `1px solid ${token.colorBorderSecondary}`
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Space size={8}>
                                                        <ClockCircleOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                                                        <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>ÚLTIMO JOGO</Text>
                                                    </Space>
                                                    {stats.lastMatch ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <Tag color={pColor} style={{ margin: 0, borderRadius: 6, fontWeight: 700 }}>
                                                                {stats.lastMatch.homeScore} x {stats.lastMatch.awayScore}
                                                            </Tag>
                                                            <Text style={{ fontSize: 13, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {stats.lastMatch.opponentName}
                                                            </Text>
                                                            <Button
                                                                type="text" size="small"
                                                                icon={<RightOutlined style={{ fontSize: 10 }} />}
                                                                style={{ padding: 0, width: 24, height: 24 }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/championships/${stats.lastMatch.championshipId}`);
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
                                                    )}
                                                </div>

                                                <Divider style={{ margin: 0, opacity: 0.5 }} />

                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Space size={8}>
                                                        <ArrowRightOutlined style={{ fontSize: 12, color: token.colorTextTertiary }} />
                                                        <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>PRÓXIMO</Text>
                                                    </Space>
                                                    {stats.nextMatch ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <Text style={{ fontSize: 13, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                vs {stats.nextMatch.opponentName}
                                                            </Text>
                                                            <Button
                                                                type="text" size="small"
                                                                icon={<RightOutlined style={{ fontSize: 10 }} />}
                                                                style={{ padding: 0, width: 24, height: 24 }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/championships/${stats.nextMatch.championshipId}`);
                                                                }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <Text type="secondary" style={{ fontSize: 12 }}>Não agendado</Text>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </Spin>

            {/* Team Edit/Create Modal - Mobile Responsive */}
            <Modal
                title={
                    <Space>
                        {isEditing ? <EditOutlined /> : <PlusOutlined />}
                        <span>{isEditing ? "Editar Time" : "Novo Time"}</span>
                    </Space>
                }
                open={isTeamModalOpen}
                onCancel={() => setIsTeamModalOpen(false)}
                okText="Salvar"
                cancelText="Cancelar"
                confirmLoading={submitting}
                width={isMobile ? '95%' : 720}
                style={{ top: isMobile ? 20 : 60 }}
                styles={{ body: { padding: isMobile ? '8px 4px' : '16px 24px' } }}
                footer={[
                    <div key="footer" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <div>
                            {isEditing && (
                                <Popconfirm
                                    title="Excluir Time"
                                    description="Tem certeza? Todos os dados vinculados serão perdidos."
                                    onConfirm={() => {
                                        if (editingTeam) {
                                            handleDeleteTeam(editingTeam.id);
                                            setIsTeamModalOpen(false);
                                        }
                                    }}
                                    okText="Confirmar"
                                    cancelText="Voltar"
                                    okButtonProps={{ danger: true }}
                                >
                                    <Button danger type="text" icon={<DeleteOutlined />}>Excluir</Button>
                                </Popconfirm>
                            )}
                        </div>
                        <Space>
                            <Button onClick={() => setIsTeamModalOpen(false)}>Cancelar</Button>
                            <Button type="primary" onClick={() => teamForm.submit()} loading={submitting}>Salvar Clube</Button>
                        </Space>
                    </div>
                ]}
            >
                <div style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 }}>
                    <Form form={teamForm} layout="vertical" onFinish={handleSaveTeam}>
                        <Row gutter={[24, 0]}>
                            <Col xs={24} sm={16}>
                                <Form.Item name="name" label="Nome do clube" rules={[{ required: true, message: 'O nome é essencial' }]}>
                                    <Input placeholder="Digite o nome do time" size="large" style={{ borderRadius: 12 }} />
                                </Form.Item>
                                <Form.Item name="logoUrl" label="Link para o Escudo (SVG ou PNG)">
                                    <Input placeholder="https://escudos.com/time.png" style={{ borderRadius: 12 }} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={8}>
                                <Title level={5} style={{ marginBottom: 12, fontSize: 14 }}>Esquema de Cores</Title>
                                <Row gutter={12}>
                                    <Col span={12}>
                                        <Form.Item name="primaryColor" label="Primária" style={{ marginBottom: 12 }}>
                                            <ColorPicker
                                                showText
                                                format="hex"
                                                value={teamForm.getFieldValue('primaryColor')}
                                                onChange={(color) => teamForm.setFieldsValue({ primaryColor: color.toHexString() })}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="secondaryColor" label="Secundária" style={{ marginBottom: 12 }}>
                                            <ColorPicker
                                                showText
                                                format="hex"
                                                value={teamForm.getFieldValue('secondaryColor')}
                                                onChange={(color) => teamForm.setFieldsValue({ secondaryColor: color.toHexString() })}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <div style={{ marginTop: 8, padding: 12, background: token.colorFillAlter, borderRadius: 12 }}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        As cores definem a identidade visual do seu clube nos cards e escudo.
                                    </Text>
                                </div>
                            </Col>
                        </Row>
                    </Form>

                    {isEditing && (
                        <div style={{ marginTop: 32, paddingBottom: 20 }}>
                            <Divider orientation="left" style={{ margin: '0 0 16px 0' }}>
                                <Space><TeamOutlined /> Jogadores ({players.length})</Space>
                            </Divider>

                            <div style={{
                                background: token.colorFillQuaternary,
                                padding: 16,
                                borderRadius: 16,
                                border: `1px dashed ${token.colorBorderSecondary}`,
                                marginBottom: 20,
                                textAlign: 'center'
                            }}>
                                <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    block
                                    size="large"
                                    onClick={() => openPlayerModal()}
                                    style={{ height: 44, borderRadius: 12 }}
                                >
                                    Adicionar jogador
                                </Button>
                            </div>

                            <List
                                size="small"
                                dataSource={players}
                                className="player-list-scroll"
                                style={{ maxHeight: 280, overflowY: 'auto' }}
                                renderItem={(player: any) => (
                                    <List.Item
                                        style={{ padding: '12px 0' }}
                                        actions={[
                                            <Button
                                                type="text" size="small" icon={<EditOutlined />}
                                                onClick={() => openPlayerModal(player)}
                                            />,
                                            <Popconfirm title="Remover jogador?" onConfirm={() => handleDeletePlayer(player.id)}>
                                                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                            </Popconfirm>
                                        ]}
                                    >
                                        <Space size={12}>
                                            <Avatar
                                                size="large"
                                                src={<img src={player.photoUrl} alt={player.name} referrerPolicy="no-referrer" />}
                                                style={{
                                                    backgroundColor: token.colorFillSecondary,
                                                    color: token.colorText,
                                                    fontWeight: 600,
                                                    fontSize: 14
                                                }}
                                            >
                                                {!player.photoUrl && player.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                            </Avatar>
                                            <div>
                                                <Text strong style={{ fontSize: 15, display: 'block' }}>{player.name}</Text>
                                            </div>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        </div>
                    )}
                </div>
            </Modal>

            {/* Athlete Add/Edit Modal */}
            <Modal
                title={isPlayerEdit ? "Editar Integrante" : "Novo Integrante"}
                open={isPlayerModalOpen}
                onCancel={() => setIsPlayerModalOpen(false)}
                onOk={() => playerForm.submit()}
                okText="Confirmar"
                cancelText="Cancelar"
                width={400}
                centered
            >
                <Form form={playerForm} layout="vertical" onFinish={handleSavePlayer} style={{ marginTop: 16 }}>
                    <Form.Item name="name" label="Nome do Integrante" rules={[{ required: true, message: 'Digite o nome' }]}>
                        <Input placeholder="Ex: Cristiano Ronaldo" style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item name="photoUrl" label="URL da Foto (Avatar)">
                        <Input placeholder="https://exemplo.com/foto.jpg" style={{ borderRadius: 8 }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TeamsPage;
