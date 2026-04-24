import React from 'react';
import { Card, Button, Space, Tooltip, Tag } from 'antd';
import { TeamOutlined, TrophyOutlined, PlayCircleOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';

interface ManagementCardProps {
    championship: any;
    matches: any[];
    id: string;
    onEditTeams: () => void;
    onFinalize: () => void;
    onResetGroups: () => void;
    onDeleteChampionship: () => void;
    onFinishChampionship: () => void;
    canStartNextPhase: boolean;
    nextPhaseName: string;
    canFinishChampionship: boolean;
    onStartNextPhase: () => void;
    onAutoResults: () => void;
    onAutoDistributeTeams: () => void;
    onGenerateAllMatches: () => void;
    standings: any[];
    loading?: boolean;
}

const ManagementCard: React.FC<ManagementCardProps> = ({
    championship,
    matches,
    onEditTeams,
    onFinalize,
    onResetGroups,
    onDeleteChampionship,
    onFinishChampionship,
    canStartNextPhase,
    nextPhaseName,
    canFinishChampionship,
    onStartNextPhase,
    onAutoResults,
    onAutoDistributeTeams,
    onGenerateAllMatches,
    standings,
    loading
}) => {
    const { user } = useAuth();
    const teamsPerGroup = Math.ceil((championship.teamCount || 0) / (championship.groupCount || 1));
    const allGroupsComplete = standings.length > 0 && standings.every(g => g.standings?.length === teamsPerGroup);
    const hasAnyTeamInGroups = standings.some(g => g.standings?.length > 0);

    return (
        <Card size="small" title="Gestão do Campeonato">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {championship.status === 'DRAFT' && (
                    <Space wrap>
                        <Button icon={<TeamOutlined />} onClick={onEditTeams} disabled={loading}>
                            Editar Times ({championship.teams?.length || 0}/{championship.teamCount})
                        </Button>
                        <Button
                            icon={<TeamOutlined />}
                            onClick={onAutoDistributeTeams}
                            disabled={loading || championship.teams?.length === 0}
                        >
                            Sortear Grupos
                        </Button>
                        {allGroupsComplete && (
                            <Button
                                type="primary"
                                icon={<ThunderboltOutlined />}
                                onClick={onGenerateAllMatches}
                                disabled={loading || championship.teams?.length === 0}
                            >
                                Sortear Confrontos
                            </Button>
                        )}
                        {allGroupsComplete && matches.length > 0 && (
                            <Tooltip title={matches.length === 0 ? "Você precisa definir os confrontos antes de iniciar o campeonato." : ""}>
                                <Button
                                    type="primary"
                                    icon={<PlayCircleOutlined />}
                                    onClick={onFinalize}
                                    disabled={loading}
                                >
                                    Iniciar Campeonato
                                </Button>
                            </Tooltip>
                        )}
                        {hasAnyTeamInGroups && (
                            <Button danger icon={<DeleteOutlined />} onClick={onResetGroups} disabled={loading}>
                                Redefinir Grupos
                            </Button>
                        )}
                    </Space>
                )}

                {championship.status === 'STARTED' && matches.length > 0 && user?.role === 'ADMIN' && (
                    <Space wrap>
                        <Button
                            type="default"
                            onClick={onAutoResults}
                            disabled={loading}
                        >Inserir Placar Automático</Button>
                    </Space>
                )}

                {canStartNextPhase && nextPhaseName && championship.status !== 'FINISHED' && (
                    <Button
                        type="primary"
                        onClick={onStartNextPhase}
                        disabled={loading}
                    >
                        Iniciar {nextPhaseName}
                    </Button>
                )}

                {canFinishChampionship && championship.status !== 'FINISHED' && (
                    <Button
                        type="primary"
                        icon={<TrophyOutlined />}
                        onClick={onFinishChampionship}
                        disabled={loading}
                    >
                        Finalizar Campeonato
                    </Button>
                )}

                {championship.status === 'FINISHED' && (
                    <Tag color="gold" style={{ fontSize: '14px', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrophyOutlined style={{ marginRight: 8 }} /> Campeonato Finalizado
                    </Tag>
                )}

                <Button danger icon={<DeleteOutlined />} onClick={onDeleteChampionship} disabled={loading}>
                    Excluir Campeonato
                </Button>
            </div>
        </Card>
    );
};

export default ManagementCard;
