import React, { useEffect, useState, useMemo } from 'react';
import {
    Button, Input, Row, Col,
    Spin, theme, Empty
} from 'antd';
import {
    PlusOutlined, SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { usePageTitle } from '../../components/Layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';

// Sub-components
import TeamCard from './components/TeamCard';

const TeamsPage: React.FC = () => {
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const { setTitle, setBackUrl } = usePageTitle();
    const { user } = useAuth();
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setTitle('Times');
        setBackUrl(undefined);
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
                        {filteredTeams.map((team: any) => (
                            <Col xs={24} sm={12} lg={8} xl={6} key={team.id}>
                                <TeamCard 
                                    team={team} 
                                    onClick={() => navigate(`/teams/${team.id}`)} 
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </Spin>

            {/* Floating Action Button */}
            {user?.role && user.role !== 'USER' && (
                <Button
                    type="primary"
                    shape="circle"
                    icon={<PlusOutlined style={{ fontSize: 24 }} />}
                    size="large"
                    style={{
                        position: 'fixed',
                        bottom: 84, // Above the footer
                        right: 20,
                        width: 56,
                        height: 56,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 99,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={() => navigate('/teams/new')}
                />
            )}
        </div>
    );
};

export default TeamsPage;
