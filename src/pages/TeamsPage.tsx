import React, { useEffect, useState, useMemo } from 'react';
import {
    Button, Input, Typography, Card, Row, Col,
    Spin, theme, Empty, Divider, Space, Tag
} from 'antd';
import {
    PlusOutlined, SearchOutlined, TeamOutlined, DesktopOutlined,
    ClockCircleOutlined, ArrowRightOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { usePageTitle } from '../components/Layout/AppLayout';

const { Title, Text } = Typography;

const TeamsPage: React.FC = () => {
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const { setTitle } = usePageTitle();
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setTitle('Times');
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

    return (
        <div style={{ paddingBottom: 16 }}>
            {/* ── Action + Search bar ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                <Input
                    placeholder="Buscar time..."
                    prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                    style={{ borderRadius: 12, height: 44 }}
                    onChange={e => setSearchTerm(e.target.value)}
                    allowClear
                />
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    block
                    onClick={() => navigate('/teams/new')}
                    style={{ borderRadius: 12, height: 44 }}
                >
                    Novo Time
                </Button>
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
                            const initials = (team.name || 'T').split(' ').filter(Boolean).map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
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
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        }}
                                        onClick={() => navigate(`/teams/${team.id}`)}
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
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <Title level={4} style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 18 }}>
                                                        {team.name}
                                                    </Title>
                                                    <Space split={<Divider type="vertical" />} style={{ fontSize: 12, color: token.colorTextSecondary, marginTop: 4 }}>
                                                        <span><TeamOutlined /> {stats.playerCount || 0}</span>
                                                        <span><DesktopOutlined /> {stats.championshipCount || 0}</span>
                                                    </Space>
                                                </div>
                                            </div>

                                            {/* CTA Message */}
                                            <div style={{
                                                marginBottom: 16,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                color: token.colorPrimary,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                background: `${token.colorPrimary}08`,
                                                padding: '6px 12px',
                                                borderRadius: 8
                                            }}>
                                                <InfoCircleOutlined style={{ fontSize: 14 }} />
                                                Clique para visualizar o time
                                            </div>

                                            {/* Matches History Section */}
                                            <div style={{
                                                background: token.colorFillQuaternary,
                                                borderRadius: 16,
                                                padding: '12px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 8,
                                                border: `1px solid ${token.colorBorderSecondary}`
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Space size={4}>
                                                        <ClockCircleOutlined style={{ fontSize: 11, color: token.colorTextTertiary }} />
                                                        <Text type="secondary" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>ÚLTIMO JOGO</Text>
                                                    </Space>
                                                    {stats.lastMatch ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Tag color={pColor} style={{ margin: 0, borderRadius: 4, fontWeight: 700, fontSize: 10 }}>
                                                                {stats.lastMatch.homeScore} x {stats.lastMatch.awayScore}
                                                            </Tag>
                                                            <Text style={{ fontSize: 11, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {stats.lastMatch.opponentName}
                                                            </Text>
                                                        </div>
                                                    ) : (
                                                        <Text type="secondary" style={{ fontSize: 11 }}>-</Text>
                                                    )}
                                                </div>

                                                <Divider style={{ margin: 0, opacity: 0.3 }} />

                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Space size={4}>
                                                        <ArrowRightOutlined style={{ fontSize: 11, color: token.colorTextTertiary }} />
                                                        <Text type="secondary" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>PRÓXIMO</Text>
                                                    </Space>
                                                    {stats.nextMatch ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <Text style={{ fontSize: 11, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                vs {stats.nextMatch.opponentName}
                                                            </Text>
                                                        </div>
                                                    ) : (
                                                        <Text type="secondary" style={{ fontSize: 11 }}>Não agendado</Text>
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
        </div>
    );
};

export default TeamsPage;
