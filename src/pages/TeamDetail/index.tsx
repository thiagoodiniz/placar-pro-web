import React, { useEffect, useState } from 'react';
import { trackEvent } from '../../services/analytics';
import {
    Button, Form, Input, Typography, Card, Row, Col,
    Spin, theme, Popconfirm, Avatar,
    ColorPicker, message, Tabs, List, Tag, Skeleton, Upload, Space
} from 'antd';
import {
    TeamOutlined, SaveOutlined, DeleteOutlined, EnvironmentOutlined, CalendarOutlined, UploadOutlined, CloseOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { usePageTitle } from '../../components/Layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { compressImage } from '../../utils/imageUtils';

// Sub-components
import PlayerModal from './components/PlayerModal';
import PlayerList from './components/PlayerList';

const { Title } = Typography;

const TeamDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const { setTitle, setBackUrl } = usePageTitle();
    const { user } = useAuth();

    const getPhaseLabel = (phase: string) => {
        if (!phase) return '';
        switch (phase) {
            case 'GROUP': return 'Fase de Grupos';
            case 'ROUND_16': return 'Oitavas de Final';
            case 'QUARTER': return 'Quartas de Final';
            case 'SEMI': return 'Semifinal';
            case 'FINAL': return 'Final';
            case 'THIRD_PLACE': return 'Disputa 3º Lugar';
            default: return phase;
        }
    };

    const isEditing = !!id && id !== 'new';
    const [loading, setLoading] = useState(isEditing);
    const [submitting, setSubmitting] = useState(false);
    const [teamForm] = Form.useForm();
    const logoUrl = Form.useWatch('logoUrl', teamForm);

    // Player management state
    const [players, setPlayers] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [matchesLoading, setMatchesLoading] = useState(false);
    const [matchesLoaded, setMatchesLoaded] = useState(false);
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
    const [isPlayerEdit, setIsPlayerEdit] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<any>(null);
    const [playerForm] = Form.useForm();

    useEffect(() => {
        if (isEditing) {
            fetchTeam();
        } else {
            setTitle('Novo Time');
            setBackUrl('/teams');
            teamForm.setFieldsValue({ primaryColor: '#16a34a', secondaryColor: '#ffffff' });
        }
    }, [id]);

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/teams/${id}`);
            const foundTeam = response.data;
            if (foundTeam) {
                setPlayers(foundTeam.players || []);
                setTitle(foundTeam.name);
                setBackUrl('/teams');
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

    const handleTabChange = async (key: string) => {
        if (key === '2' && !matchesLoaded && isEditing) {
            setMatchesLoading(true);
            try {
                const response = await api.get(`/teams/${id}/matches`);
                setMatches(response.data);
                setMatchesLoaded(true);
            } catch (error) {
                console.error('Error fetching matches', error);
                message.error('Erro ao carregar jogos do time');
            } finally {
                setMatchesLoading(false);
            }
        }
    };

    const handleSaveTeam = async (values: any) => {
        const hide = message.loading(isEditing ? 'Atualizando time...' : 'Criando time...', 0);
        setSubmitting(true);
        const payload = {
            ...values,
            primaryColor: typeof values.primaryColor === 'string' ? values.primaryColor : values.primaryColor?.toHexString?.() || values.primaryColor,
            secondaryColor: typeof values.secondaryColor === 'string' ? values.secondaryColor : values.secondaryColor?.toHexString?.() || values.secondaryColor,
        };

        try {
            if (isEditing) {
                await api.patch(`/teams/${id}`, payload);
                trackEvent('team_edited', { team_id: id });
                hide();
                message.success('Time atualizado com sucesso');
                setTitle(payload.name);
            } else {
                const res = await api.post('/teams', payload);
                trackEvent('team_created', { team_id: res.data.id });
                hide();
                message.success('Time criado com sucesso');
                navigate(`/teams/${res.data.id}`);
            }
        } catch (error) {
            console.error('Error saving team', error);
            hide();
            message.error('Erro ao salvar time');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTeam = async () => {
        setSubmitting(true);
        const hide = message.loading('Excluindo time...', 0);
        try {
            await api.delete(`/teams/${id}`);
            trackEvent('team_deleted', { team_id: id });
            hide();
            message.success('Time excluído com sucesso');
            navigate('/teams');
        } catch (error) {
            console.error('Error deleting team', error);
            hide();
            message.error('Erro ao excluir time');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSavePlayer = async (values: any) => {
        if (!isEditing) {
            message.warning('Salve o time primeiro antes de adicionar jogadores');
            return;
        }
        setSubmitting(true);
        const hide = message.loading(isPlayerEdit ? 'Salvando jogador...' : 'Adicionando jogador...', 0);
        try {
            if (isPlayerEdit && editingPlayer) {
                await api.patch(`/teams/${id}/players/${editingPlayer.id}`, values);
                trackEvent('player_edited', { team_id: id });
            } else {
                await api.post(`/teams/${id}/players`, values);
                trackEvent('player_added', { team_id: id });
            }
            setIsPlayerModalOpen(false);
            playerForm.resetFields();

            const res = await api.get(`/teams/${id}`);
            const updatedTeam = res.data;
            setPlayers(updatedTeam?.players || []);
            hide();
            message.success(isPlayerEdit ? 'Jogador atualizado' : 'Jogador adicionado');
        } catch (error) {
            console.error('Error saving player', error);
            hide();
            message.error('Erro ao salvar jogador');
        } finally {
            setSubmitting(false);
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
        setSubmitting(true);
        const hide = message.loading('Removendo jogador...', 0);
        try {
            await api.delete(`/teams/${id}/players/${playerId}`);
            const res = await api.get(`/teams/${id}`);
            const updatedTeam = res.data;
            setPlayers(updatedTeam?.players || []);
            hide();
            message.success('Jogador removido');
        } catch (error) {
            console.error('Error deleting player', error);
            hide();
            message.error('Erro ao excluir jogador');
        } finally {
            setSubmitting(false);
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
            <Card style={{ borderRadius: 16, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <Form form={teamForm} layout="vertical" onFinish={handleSaveTeam}>
                    <Row gutter={[24, 0]}>
                        <Col xs={24} sm={16}>
                            <Form.Item name="name" label="Nome do clube" rules={[{ required: true, message: 'O nome é essencial' }]}>
                                <Input placeholder="Digite o nome do time" size="large" style={{ borderRadius: 12 }} disabled={submitting} />
                            </Form.Item>
                            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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
                                    <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}>Escudo do Clube</div>
                                    <Space size="small" wrap>
                                        <Upload
                                            showUploadList={false}
                                            beforeUpload={async (file) => {
                                                try {
                                                    const base64 = await compressImage(file);
                                                    teamForm.setFieldsValue({ logoUrl: base64 });
                                                    trackEvent('image_uploaded', { type: 'team_logo' });
                                                } catch (err) {
                                                    message.error('Erro ao processar imagem');
                                                }
                                                return false;
                                            }}
                                        >
                                            <Button icon={<UploadOutlined />} disabled={submitting}>Selecionar Imagem</Button>
                                        </Upload>
                                        {logoUrl && (
                                            <Button 
                                                icon={<CloseOutlined />} 
                                                onClick={() => teamForm.setFieldsValue({ logoUrl: '' })}
                                                disabled={submitting}
                                                danger
                                            >
                                                Remover
                                            </Button>
                                        )}
                                    </Space>
                                    <Form.Item name="logoUrl" hidden>
                                        <Input />
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
                                            disabled={submitting}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="secondaryColor" label="Secundária">
                                        <ColorPicker
                                            showText
                                            format="hex"
                                            onChange={(color) => teamForm.setFieldsValue({ secondaryColor: color.toHexString() })}
                                            disabled={submitting}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    {user?.role && user.role !== 'USER' && (
                        <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginTop: 24 }}>
                            <Col xs={{ span: 24, order: 2 }} sm={{ span: 12, order: 1 }}>
                                {isEditing && (
                                    <Popconfirm
                                        title="Remover Time"
                                        description="Tem certeza? Todos os dados vinculados serão perdidos."
                                        onConfirm={handleDeleteTeam}
                                        okText="Sim, remover"
                                        cancelText="Não"
                                        okButtonProps={{ danger: true }}
                                        disabled={submitting}
                                    >
                                        <Button 
                                            danger 
                                            type="text" 
                                            icon={<DeleteOutlined />} 
                                            disabled={submitting}
                                            style={{ paddingLeft: 0 }}
                                        >
                                            Remover Time
                                        </Button>
                                    </Popconfirm>
                                )}
                            </Col>
                            <Col xs={{ span: 24, order: 1 }} sm={{ span: 12, order: 2 }} style={{ textAlign: 'right' }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SaveOutlined />}
                                    loading={submitting}
                                    size="large"
                                    style={{ 
                                        borderRadius: 10, 
                                        paddingLeft: 30, 
                                        paddingRight: 30,
                                        width: '100%',
                                        maxWidth: 200
                                    }}
                                >
                                    Salvar
                                </Button>
                            </Col>
                        </Row>
                    )}
                </Form>
            </Card>

            {isEditing && (
                <Tabs
                    defaultActiveKey="1"
                    onChange={handleTabChange}
                    items={[
                        {
                            key: '1',
                            label: `Jogadores (${players.length})`,
                            children: (
                                <PlayerList
                                    players={players}
                                    onAdd={() => openPlayerModal()}
                                    onEdit={openPlayerModal}
                                    onDelete={handleDeletePlayer}
                                    loading={submitting}
                                />
                            )
                        },
                        {
                            key: '2',
                            label: matchesLoaded ? `Jogos (${matches.length})` : 'Jogos',
                            children: (
                                <div style={{ marginTop: 24 }}>
                                    <Skeleton active loading={matchesLoading}>
                                        <List
                                            dataSource={matches}
                                        renderItem={(m: any) => (
                                            <List.Item>
                                                <Card size="small" style={{ width: '100%', borderRadius: 12 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <div>
                                                            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                                                                {m.championship?.name || 'Sem campeonato'} {m.phase ? `- ${getPhaseLabel(m.phase)}` : ''}
                                                            </Typography.Text>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                                <Tag color={m.status === 'FINISHED' ? 'green' : 'default'} style={{ margin: 0, padding: '2px 8px', fontSize: 14, fontWeight: 'bold' }}>
                                                                    {m.status === 'FINISHED' ? (m.isHome ? `${m.homeScore} x ${m.awayScore}` : `${m.awayScore} x ${m.homeScore}`) : 'Agendado'}
                                                                </Tag>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <Typography.Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>vs</Typography.Text>
                                                                    <Avatar src={m.opponentLogo} size={24} style={{ backgroundColor: token.colorFillSecondary }}>
                                                                        {m.opponentName?.[0]}
                                                                    </Avatar>
                                                                    <Typography.Text strong>{m.opponentName}</Typography.Text>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                                            {m.dateTime && (
                                                                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <CalendarOutlined />
                                                                    {new Date(m.dateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {new Date(m.dateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                                </Typography.Text>
                                                            )}
                                                            {m.location && (
                                                                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                    <EnvironmentOutlined />
                                                                    {m.location}
                                                                </Typography.Text>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            </List.Item>
                                        )}
                                        locale={{ emptyText: 'Nenhum jogo encontrado para este time.' }}
                                    />
                                    </Skeleton>
                                </div>
                            )
                        }
                    ]}
                />
            )}

            <PlayerModal
                open={isPlayerModalOpen}
                onCancel={() => setIsPlayerModalOpen(false)}
                onFinish={handleSavePlayer}
                form={playerForm}
                isEdit={isPlayerEdit}
            />
        </div>
    );
};

export default TeamDetailPage;
