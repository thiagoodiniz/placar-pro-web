import React, { useEffect, useState } from 'react';
import { 
    Button, Tag, Typography, Card, Row, Col, Progress, 
    Spin, theme, Empty 
} from 'antd';
import { 
    PlusOutlined, ArrowRightOutlined, SettingOutlined, 
    TeamOutlined, TrophyOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ChampionshipModal from '../components/ChampionshipModal';

const { Title, Text } = Typography;

const ChampionshipsPage: React.FC = () => {
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const [championships, setChampionships] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChamp, setSelectedChamp] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const champsRes = await api.get('/championships');
            setChampionships(champsRes.data);
        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (values: any) => {
        setSubmitting(true);
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
            fetchData();
        } catch (error) {
            console.error('Error saving championship', error);
        } finally {
            setSubmitting(false);
        }
    };

    const statusConfig: Record<string, { label: string; color: string }> = {
        STARTED: { label: 'Em Andamento', color: token.colorSuccess },
        FINISHED: { label: 'Finalizado', color: '#fadb14' },
        DRAFT: { label: 'Rascunho', color: token.colorTextSecondary },
    };

    const formatLabel: Record<string, string> = {
        GROUPS_KNOCKOUT: 'Grupos + Mata-mata',
        KNOCKOUT: 'Mata-mata',
        LEAGUE: 'Liga',
    };

    const openEdit = (champ: any) => {
        setSelectedChamp(champ);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setSelectedChamp(null);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    return (
        <div style={{ paddingBottom: 40 }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 24,
                flexDirection: window.innerWidth < 576 ? 'column' : 'row',
                gap: 16
            }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Campeonatos</Title>
                    <Text type="secondary">Crie e gerencie suas competições</Text>
                </div>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={openCreate}
                    size="large"
                    style={{ borderRadius: 8, width: window.innerWidth < 576 ? '100%' : 'auto' }}
                >
                    Novo Campeonato
                </Button>
            </div>

            <Spin spinning={loading}>
                {!loading && championships.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Nenhum campeonato ainda"
                        style={{ padding: '64px 0' }}
                    >
                        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                            Criar Primeiro Campeonato
                        </Button>
                    </Empty>
                ) : (
                    <Row gutter={[20, 20]}>
                        {championships.map((champ: any) => {
                            const status = statusConfig[champ.status] || statusConfig.DRAFT;
                            const teamsFilled = champ.teams?.length || 0;
                            const teamsTotal = champ.teamCount || 1;
                            const pct = Math.round((teamsFilled / teamsTotal) * 100);
                            return (
                                <Col xs={24} sm={12} lg={8} key={champ.id}>
                                    <Card
                                        hoverable
                                        styles={{ body: { padding: 0 } }}
                                        style={{ 
                                            overflow: 'hidden', 
                                            borderRadius: 16,
                                            border: `1px solid ${token.colorBorderSecondary}`
                                        }}
                                        onClick={() => navigate(`/championships/${champ.id}`)}
                                    >
                                        <div style={{ height: 4, background: status.color }} />

                                        <div style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <Title level={4} style={{ margin: 0, flex: 1, paddingRight: 8, fontSize: 18, lineHeight: 1.3 }}>
                                                    {champ.name}
                                                </Title>
                                                <Tag color={status.color} style={{ margin: 0, borderRadius: 6, border: 'none', background: `${status.color}15`, color: status.color, fontWeight: 600 }}>
                                                    {status.label}
                                                </Tag>
                                            </div>

                                            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                <Tag style={{ borderRadius: 6 }}>{formatLabel[champ.format]}</Tag>
                                                {champ.format === 'GROUPS_KNOCKOUT' && (
                                                    <Tag style={{ borderRadius: 6 }}>{champ.groupCount} Grupos</Tag>
                                                )}
                                                {champ.format === 'LEAGUE' && champ.roundTrip && (
                                                    <Tag style={{ borderRadius: 6 }}>Ida e Volta</Tag>
                                                )}
                                            </div>

                                            <div style={{ marginBottom: 4 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                                        <TeamOutlined style={{ marginRight: 6 }} />Times Inscritos
                                                    </Text>
                                                    <Text strong style={{ fontSize: 13 }}>
                                                        {teamsFilled} / {teamsTotal}
                                                    </Text>
                                                </div>
                                                <Progress
                                                    percent={pct}
                                                    size={['100%', 6] as any}
                                                    showInfo={false}
                                                    strokeColor={pct === 100 ? token.colorSuccess : token.colorPrimary}
                                                    trailColor={token.colorFillSecondary}
                                                    style={{ marginBottom: 0 }}
                                                />
                                            </div>

                                            {champ.status === 'FINISHED' && champ.champion && (
                                                <div style={{
                                                    marginTop: 16, display: 'flex', alignItems: 'center', gap: 10,
                                                    padding: '10px 14px',
                                                    background: 'rgba(250,219,20,0.1)',
                                                    borderRadius: 12, border: '1px solid rgba(250,219,20,0.2)',
                                                }}>
                                                    <TrophyOutlined style={{ color: '#d97706', fontSize: 18 }} />
                                                    <div>
                                                        <Text type="secondary" style={{ fontSize: 10, display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Campeão</Text>
                                                        <Text strong style={{ color: '#b8960c' }}>{champ.champion}</Text>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            style={{
                                                borderTop: `1px solid ${token.colorBorderSecondary}`,
                                                padding: '12px 20px',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                background: token.colorFillQuaternary,
                                            }}
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <Button 
                                                size="middle" 
                                                type="text" 
                                                icon={<SettingOutlined />} 
                                                onClick={() => openEdit(champ)}
                                                style={{ borderRadius: 8 }}
                                            >
                                                Configurar
                                            </Button>
                                            <Button
                                                size="middle" 
                                                type="primary"
                                                icon={<ArrowRightOutlined />}
                                                onClick={() => navigate(`/championships/${champ.id}`)}
                                                style={{ borderRadius: 8 }}
                                            >
                                                Gerenciar
                                            </Button>
                                        </div>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </Spin>

            <ChampionshipModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialValues={selectedChamp}
                isEditing={isEditing}
                submitting={submitting}
            />
        </div>
    );
};

export default ChampionshipsPage;
