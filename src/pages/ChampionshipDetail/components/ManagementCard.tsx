import React from 'react';
import { Card, Button, Space, Tooltip, Tag, Popconfirm } from 'antd';
import { TeamOutlined, TrophyOutlined, PlayCircleOutlined, DeleteOutlined, EditOutlined, RollbackOutlined, OrderedListOutlined } from '@ant-design/icons';
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
    onDefineMatches: () => void;
    onRenameSeries?: () => void;
    canRollbackPhase: boolean;
    currentPhaseName: string;
    onRollbackPhase: () => void;
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
    onDefineMatches,
    onRenameSeries,
    canRollbackPhase,
    onRollbackPhase,
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
                                icon={<OrderedListOutlined />}
                                onClick={onDefineMatches}
                                disabled={loading || championship.teams?.length === 0}
                            >
                                Definir Confrontos
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
                        <Popconfirm
                            title="Inserir placar automático"
                            description="Tem certeza que deseja gerar resultados aleatórios para todos os jogos não finalizados?"
                            onConfirm={onAutoResults}
                            okText="Sim"
                            cancelText="Não"
                        >
                            <Button type="default" disabled={loading}>
                                Inserir Placar Automático
                            </Button>
                        </Popconfirm>
                        {championship.format === 'GROUPS_KNOCKOUT' && (
                            <Button
                                icon={<OrderedListOutlined />}
                                onClick={onDefineMatches}
                                disabled={loading}
                            >
                                Editar Confrontos
                            </Button>
                        )}
                        {onRenameSeries && (
                            <Button
                                icon={<EditOutlined />}
                                onClick={onRenameSeries}
                                disabled={loading}
                            >
                                Renomear Rótulos
                            </Button>
                        )}
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

                {canRollbackPhase && championship.status === 'STARTED' && user?.role && user.role !== 'USER' && (
                    <Button
                        danger
                        icon={<RollbackOutlined />}
                        onClick={onRollbackPhase}
                        disabled={loading}
                    >
                        Voltar à Fase Anterior
                    </Button>
                )}

                {championship.status === 'FINISHED' && (
                    <Tag color="gold" style={{ fontSize: '14px', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrophyOutlined style={{ marginRight: 8 }} /> Campeonato Finalizado
                    </Tag>
                )}

                {(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && championship.status === 'DRAFT')) && (
                    <Button danger icon={<DeleteOutlined />} onClick={onDeleteChampionship} disabled={loading}>
                        Excluir Campeonato
                    </Button>
                )}
            </div>
        </Card>
    );
};

export default ManagementCard;
