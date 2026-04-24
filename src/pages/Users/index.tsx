import React, { useEffect, useState } from 'react';
import { List, Select, message, Tag, Avatar, Card, Typography, theme } from 'antd';
import { usePageTitle } from '../../components/Layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';
import { trackEvent } from '../../services/analytics';

const { Text } = Typography;

const UsersPage: React.FC = () => {
    const { setTitle, setBackUrl } = usePageTitle();
    const { token } = theme.useToken();
    const { user } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('Gerenciar Usuários');
        setBackUrl('/championships');
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/auth/users');
            setUsers(data);
        } catch (err) {
            message.error('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, role: string) => {
        try {
            await api.patch(`/auth/users/${userId}/role`, { role });
            trackEvent('role_updated', { target_user_id: userId, new_role: role });
            message.success('Permissão atualizada!');
            fetchUsers();
        } catch (err) {
            message.error('Erro ao atualizar permissão');
        }
    };

    if (!user || user.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 24 }}>
            <Card 
                styles={{ body: { padding: '8px 16px' } }}
                style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            >
                <List
                    loading={loading}
                    dataSource={users}
                    itemLayout="horizontal"
                    renderItem={(u: any) => (
                        <List.Item
                            actions={[
                                <Select
                                    defaultValue={u.role}
                                    style={{ width: 120 }}
                                    onChange={(value) => handleRoleChange(u.id, value)}
                                    disabled={u.id === user.id}
                                    dropdownStyle={{ borderRadius: 8 }}
                                >
                                    <Select.Option value="ADMIN">ADMIN</Select.Option>
                                    <Select.Option value="MANAGER">MANAGER</Select.Option>
                                    <Select.Option value="USER">USER</Select.Option>
                                </Select>
                            ]}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Avatar 
                                        src={u.avatarUrl} 
                                        size={48} 
                                        style={{ 
                                            backgroundColor: token.colorFillSecondary,
                                            border: `1px solid ${token.colorBorderSecondary}`
                                        }} 
                                    >
                                        {!u.avatarUrl && (u.name?.[0]?.toUpperCase() || '?')}
                                    </Avatar>
                                }
                                title={<Text strong style={{ fontSize: 16 }}>{u.name}</Text>}
                                description={
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <Text type="secondary" style={{ fontSize: 13 }}>{u.email}</Text>
                                        <div>
                                            <Tag 
                                                color={u.role === 'ADMIN' ? 'red' : u.role === 'MANAGER' ? 'orange' : 'blue'}
                                                style={{ borderRadius: 4, fontSize: 10, fontWeight: 700 }}
                                            >
                                                {u.role}
                                            </Tag>
                                        </div>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </div>
    );
};

export default UsersPage;
