import React from 'react';
import { Typography, Card, List, Button, Popconfirm, Avatar, Empty, theme } from 'antd';
import { TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';

const { Title } = Typography;

interface PlayerListProps {
    players: any[];
    onAdd: () => void;
    onEdit: (player: any) => void;
    onDelete: (playerId: string) => void;
    loading?: boolean;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, onAdd, onEdit, onDelete, loading }) => {
    const { token } = theme.useToken();
    const { user } = useAuth();

    return (
        <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>
                    <TeamOutlined /> Jogadores ({players.length})
                </Title>
                {user?.role && user.role !== 'USER' && (
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={onAdd}
                        style={{ borderRadius: 8 }}
                        disabled={loading}
                    >
                        Adicionar
                    </Button>
                )}
            </div>

            {players.length === 0 ? (
                <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px 0', border: '1px dashed #d9d9d9' }}>
                    <Empty description="Nenhum jogador cadastrado" />
                    {user?.role && user.role !== 'USER' && (
                        <Button type="dashed" icon={<PlusOutlined />} onClick={onAdd} style={{ marginTop: 16 }} disabled={loading}>
                            Adicionar Primeiro Jogador
                        </Button>
                    )}
                </Card>
            ) : (
                <List
                    grid={{ gutter: 16, xs: 1, sm: 2 }}
                    dataSource={players}
                    renderItem={(player: any) => (
                        <List.Item>
                            <Card
                                size="small"
                                style={{ borderRadius: 12 }}
                                actions={user?.role && user.role !== 'USER' ? [
                                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(player)} disabled={loading}>Editar</Button>,
                                    <Popconfirm title="Remover jogador?" onConfirm={() => onDelete(player.id)} disabled={loading}>
                                        <Button type="text" size="small" danger icon={<DeleteOutlined />} disabled={loading}>Remover</Button>
                                    </Popconfirm>
                                ] : []}
                            >
                                <Card.Meta
                                    avatar={
                                        <Avatar
                                            size={48}
                                            src={player.photoUrl}
                                            style={{ backgroundColor: token.colorFillSecondary }}
                                        >
                                            {!player.photoUrl && (player.name?.[0]?.toUpperCase() || '?')}
                                        </Avatar>
                                    }
                                    title={player.name}
                                    description={
                                        (player.birthDate || (user?.role && user.role !== 'USER' && player.document)) ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                                                {player.birthDate && (
                                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                                        Nasc: {player.birthDate.split('-').reverse().join('/')}
                                                    </Typography.Text>
                                                )}
                                                {user?.role && user.role !== 'USER' && player.document && (
                                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                                        Doc: {player.document}
                                                    </Typography.Text>
                                                )}
                                            </div>
                                        ) : undefined
                                    }
                                />
                            </Card>
                        </List.Item>
                    )}
                />
            )}
        </div>
    );
};

export default PlayerList;
