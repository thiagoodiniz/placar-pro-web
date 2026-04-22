import React, { useEffect, useState } from 'react';
import { trackEvent } from '../../services/analytics';
import {
    Button, Row, Col,
    Spin, theme, Empty
} from 'antd';
import {
    PlusOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ChampionshipModal from '../../components/ChampionshipModal';
import { usePageTitle } from '../../components/Layout/AppLayout';

// Sub-components
import ChampionshipFilters from './components/ChampionshipFilters';
import ChampionshipCard from './components/ChampionshipCard';

const ChampionshipsPage: React.FC = () => {
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const { setTitle, setBackUrl } = usePageTitle();

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
        setBackUrl(undefined);
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
                trackEvent('championship_edited', { championship_id: selectedChamp.id, format: payload.format });
            } else {
                await api.post('/championships', payload);
                trackEvent('championship_created', { format: payload.format, team_count: payload.teamCount });
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

    const filteredChampionships = championships.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div style={{ paddingBottom: 16 }}>
            <ChampionshipFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
            />

            <Spin spinning={loading}>
                {!loading && championships.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Nenhum campeonato ainda"
                        style={{ padding: '64px 0' }}
                    >
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedChamp(null); setIsEditing(false); setIsModalOpen(true); }}>
                            Criar Primeiro Campeonato
                        </Button>
                    </Empty>
                ) : (
                    <Row gutter={[16, 16]}>
                        {filteredChampionships.map((champ: any) => (
                            <Col xs={24} sm={12} lg={8} key={champ.id}>
                                <ChampionshipCard
                                    champ={champ}
                                    statusConfig={statusConfig}
                                    formatLabel={formatLabel}
                                    onEdit={(c) => { setSelectedChamp(c); setIsEditing(true); setIsModalOpen(true); }}
                                    onManage={(cid) => navigate(`/championships/${cid}`)}
                                />
                            </Col>
                        ))}
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

            {/* Floating Action Button */}
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
                onClick={() => { setSelectedChamp(null); setIsEditing(false); setIsModalOpen(true); }}
            />
        </div>
    );
};

export default ChampionshipsPage;
