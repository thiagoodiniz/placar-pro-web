import React from 'react';
import { Typography, Card, List, Button, Popconfirm, Avatar, Empty, theme } from 'antd';
import { TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface PlayerListProps {
    players: any[];
    onAdd: () => void;
    onEdit: (player: any) => void;
    onDelete: (playerId: string) => void;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, onAdd, onEdit, onDelete }) => {
    const { token } = theme.useToken();

    return (
        <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4} style={{ margin: 0 }}>
                    <TeamOutlined /> Jogadores ({players.length})
                </Title>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={onAdd}
                    style={{ borderRadius: 8 }}
                >
                    Adicionar
                </Button>
            </div>

            {players.length === 0 ? (
                <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px 0', border: '1px dashed #d9d9d9' }}>
                    <Empty description="Nenhum jogador cadastrado" />
                    <Button type="dashed" icon={<PlusOutlined />} onClick={onAdd} style={{ marginTop: 16 }}>
                        Adicionar Primeiro Jogador
                    </Button>
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
                                actions={[
                                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(player)}>Editar</Button>,
                                    <Popconfirm title="Remover jogador?" onConfirm={() => onDelete(player.id)}>
                                        <Button type="text" size="small" danger icon={<DeleteOutlined />}>Remover</Button>
                                    </Popconfirm>
                                ]}
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
