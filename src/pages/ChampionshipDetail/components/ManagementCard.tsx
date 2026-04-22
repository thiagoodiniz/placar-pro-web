import React from 'react';
import { Card, Button, Space, Tooltip, Tag } from 'antd';
import { TeamOutlined, TrophyOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../../services/api';

interface ManagementCardProps {
    championship: any;
    matches: any[];
    id: string;
    onEditTeams: () => void;
    onStartClick: () => void;
    onFinalize: () => void;
    onResetGroups: () => void;
    onDeleteChampionship: () => void;
    onFinishChampionship: () => void;
    canStartNextPhase: boolean;
    nextPhaseName: string;
    canFinishChampionship: boolean;
    onStartNextPhase: () => void;
    onAutoResults: () => void;
    onResetMatches: () => void;
}

const ManagementCard: React.FC<ManagementCardProps> = ({
    championship,
    matches,
    id,
    onEditTeams,
    onStartClick,
    onFinalize,
    onResetGroups,
    onDeleteChampionship,
    onFinishChampionship,
    canStartNextPhase,
    nextPhaseName,
    canFinishChampionship,
    onStartNextPhase,
    onAutoResults,
    onResetMatches
}) => {
    return (
        <Card size="small" title="Gestão do Campeonato">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {championship.status === 'DRAFT' && (
                    <Button icon={<TeamOutlined />} onClick={onEditTeams}>
                        Editar Times ({championship.teams?.length || 0}/{championship.teamCount})
                    </Button>
                )}

                {championship.status === 'DRAFT' && championship.teams?.length > 0 && !championship.matchMode && (
                    <Button type="primary" icon={<TrophyOutlined />} onClick={onStartClick}>
                        Definir Confrontos
                    </Button>
                )}

                {championship.status === 'DRAFT' && championship.matchMode && (
                    <Space>
                        <Tooltip title={matches.length === 0 ? "Você precisa definir os confrontos antes de iniciar o campeonato." : ""}>
                            <Button
                                type="primary"
                                icon={<PlayCircleOutlined />}
                                onClick={onFinalize}
                                disabled={matches.length === 0}
                            >
                                Iniciar Campeonato
                            </Button>
                        </Tooltip>
                        <Button danger icon={<DeleteOutlined />} onClick={onResetGroups}>
                            Redefinir Grupos
                        </Button>
                    </Space>
                )}

                {championship.status !== 'FINISHED' && matches.length > 0 && (
                    <Space>
                        <Button
                            type="default"
                            onClick={onAutoResults}
                        >Inserir Placar Automático</Button>

                        <Button danger ghost onClick={onResetMatches}>Redefinir Confrontos</Button>
                    </Space>
                )}

                {canStartNextPhase && nextPhaseName && championship.status !== 'FINISHED' && (
                    <Button
                        type="primary"
                        onClick={onStartNextPhase}
                    >
                        Iniciar {nextPhaseName}
                    </Button>
                )}

                {canFinishChampionship && championship.status !== 'FINISHED' && (
                    <Button
                        type="primary"
                        style={{ backgroundColor: '#52c41a' }}
                        icon={<TrophyOutlined />}
                        onClick={onFinishChampionship}
                    >
                        Finalizar Campeonato
                    </Button>
                )}

                {championship.status === 'FINISHED' && (
                    <Tag color="gold" style={{ fontSize: '14px', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrophyOutlined style={{ marginRight: 8 }} /> Campeonato Finalizado
                    </Tag>
                )}

                <Button danger icon={<DeleteOutlined />} onClick={onDeleteChampionship}>
                    Excluir Campeonato
                </Button>
            </div>
        </Card>
    );
};

export default ManagementCard;
