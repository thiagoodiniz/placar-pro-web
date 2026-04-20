import React, { useEffect, useState } from 'react';
import { 
    Button, Tag, Typography, Card, Row, Col, 
    Spin, theme, Empty 
} from 'antd';
import { 
    PlusOutlined, ArrowRightOutlined, SettingOutlined, 
    TeamOutlined, TrophyOutlined, SearchOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Input, Radio, Avatar } from 'antd';
import api from '../services/api';
import ChampionshipModal from '../components/ChampionshipModal';
import { usePageTitle } from '../components/Layout/AppLayout';

const { Title, Text } = Typography;

const ChampionshipsPage: React.FC = () => {
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const { setTitle } = usePageTitle();

    const [championships, setChampionships] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedChamp, setSelectedChamp] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    useEffect(() => {
        setTitle('Campeonatos');
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

    const filteredChampionships = championships.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div style={{ paddingBottom: 16 }}>
            {/* ── Action bar ── */}
            <div style={{ marginBottom: 16 }}>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={openCreate}
                    size="large"
                    block
                    style={{ borderRadius: 10 }}
                >
                    Novo Campeonato
                </Button>
            </div>

            {/* ── Filters (mobile-first: stacked) ── */}
            <div style={{ 
                marginBottom: 20,
                background: token.colorFillAlter,
                padding: '14px 14px',
                borderRadius: 14,
                border: `1px solid ${token.colorBorderSecondary}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
            }}>
                {/* Search always on top */}
                <Input
                    placeholder="Buscar campeonatos..."
                    prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ borderRadius: 8, width: '100%' }}
                    allowClear
                />
                {/* Status filter below */}
                <Radio.Group 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    optionType="button"
                    buttonStyle="solid"
                    style={{ display: 'flex', width: '100%' }}
                >
                    <Radio.Button value="ALL" style={{ flex: 1, textAlign: 'center', borderRadius: '8px 0 0 8px' }}>Todos</Radio.Button>
                    <Radio.Button value="STARTED" style={{ flex: 1, textAlign: 'center' }}>Em Andamento</Radio.Button>
                    <Radio.Button value="FINISHED" style={{ flex: 1, textAlign: 'center', borderRadius: '0 8px 8px 0' }}>Finalizados</Radio.Button>
                </Radio.Group>
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
                    <Row gutter={[16, 16]}>
                        {filteredChampionships.map((champ: any) => {
                            const status = statusConfig[champ.status] || statusConfig.DRAFT;
                            const teamsFilled = champ.teams?.length || 0;
                            const teamsTotal = champ.teamCount || 1;
                            
                            const championTeam = champ.teams?.find((t: any) => t.team.name === champ.champion);
                            const championLogo = championTeam?.team.logoUrl;

                            return (
                                <Col xs={24} sm={12} lg={8} key={champ.id}>
                                    <Card
                                        hoverable
                                        styles={{ body: { padding: 0 } }}
                                        style={{ 
                                            overflow: 'hidden', 
                                            borderRadius: 20,
                                            border: `1px solid ${token.colorBorderSecondary}`,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                        }}
                                        onClick={() => navigate(`/championships/${champ.id}`)}
                                    >
                                        <div style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <div style={{ flex: 1, paddingRight: 10 }}>
                                                    <Title level={4} style={{ margin: 0, fontSize: 17, fontWeight: 700, lineHeight: 1.2, color: token.colorText }}>
                                                        {champ.name}
                                                    </Title>
                                                </div>
                                                <Tag color={status.color} style={{ 
                                                    margin: 0, 
                                                    borderRadius: 20, 
                                                    border: 'none', 
                                                    padding: '2px 10px',
                                                    fontSize: 11,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    background: `${status.color}15`, 
                                                    color: status.color, 
                                                    fontWeight: 700,
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {status.label}
                                                </Tag>
                                            </div>

                                            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: 5, 
                                                    background: token.colorFillTertiary, 
                                                    padding: '4px 10px', 
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                    color: token.colorTextSecondary
                                                }}>
                                                    <TrophyOutlined style={{ fontSize: 13 }} />
                                                    {formatLabel[champ.format]}
                                                </div>
                                                
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: 5, 
                                                    background: token.colorFillTertiary, 
                                                    padding: '4px 10px', 
                                                    borderRadius: 8,
                                                    fontSize: 12,
                                                    color: token.colorTextSecondary
                                                }}>
                                                    <TeamOutlined style={{ fontSize: 13 }} />
                                                    {teamsFilled} / {teamsTotal} Times
                                                </div>
                                                
                                                {champ.format === 'GROUPS_KNOCKOUT' && (
                                                    <div style={{ 
                                                        background: token.colorFillTertiary, 
                                                        padding: '4px 10px', 
                                                        borderRadius: 8,
                                                        fontSize: 12,
                                                        color: token.colorTextSecondary
                                                    }}>
                                                        {champ.groupCount} Grupos
                                                    </div>
                                                )}
                                            </div>

                                            {champ.status === 'FINISHED' && champ.champion ? (
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: 12,
                                                    padding: '10px 14px',
                                                    background: 'linear-gradient(135deg, rgba(250,219,20,0.15) 0%, rgba(250,219,20,0.05) 100%)',
                                                    borderRadius: 12, border: '1px solid rgba(250,219,20,0.2)',
                                                }}>
                                                    <div style={{ position: 'relative' }}>
                                                        <Avatar 
                                                            src={<img src={championLogo} referrerPolicy="no-referrer" alt={champ.champion} />} 
                                                            size={38} 
                                                            icon={<TeamOutlined />} 
                                                            style={{ border: '2px solid #fadb14', background: '#fff' }}
                                                        />
                                                        <div style={{ 
                                                            position: 'absolute', bottom: -4, right: -4,
                                                            background: '#fadb14', 
                                                            width: 16, height: 16, 
                                                            borderRadius: '50%', 
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                            border: '2px solid #fff'
                                                        }}>
                                                            <TrophyOutlined style={{ color: '#fff', fontSize: 9 }} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Text type="secondary" style={{ fontSize: 10, display: 'block', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>Campeão</Text>
                                                        <Text strong style={{ color: '#d4a017', fontSize: 14 }}>{champ.champion}</Text>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ height: 52, display: 'flex', alignItems: 'center' }}>
                                                     <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic', opacity: 0.7 }}>
                                                        {champ.status === 'STARTED' ? 'Competição em progresso...' : 'Preparando início do torneio...'}
                                                     </Text>
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            style={{
                                                borderTop: `1px solid ${token.colorBorderSecondary}`,
                                                padding: '14px 20px',
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
                                                style={{ borderRadius: 8, fontWeight: 500 }}
                                            >
                                                Ajustar
                                            </Button>
                                            <Button
                                                size="middle" 
                                                type="primary"
                                                icon={<ArrowRightOutlined />}
                                                onClick={() => navigate(`/championships/${champ.id}`)}
                                                style={{ 
                                                    borderRadius: 8, 
                                                    fontWeight: 600,
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
                                                }}
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
