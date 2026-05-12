import React, { useState } from 'react';
import { Typography, Tag, Input, Checkbox, Avatar, Button, theme } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface TeamPickerProps {
    value: string[];
    onChange: (ids: string[]) => void;
    teams: any[];
    max: number;
    onCreateTeam?: (name: string) => Promise<any>;
}

const TeamPicker: React.FC<TeamPickerProps> = ({ value = [], onChange, teams, max, onCreateTeam }) => {
    const { token } = theme.useToken();
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [adding, setAdding] = useState(false);

    const filtered = teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

    const toggle = (teamId: string) => {
        if (value.includes(teamId)) {
            onChange(value.filter(s => s !== teamId));
        } else if (value.length < max) {
            onChange([...value, teamId]);
        }
    };

    const handleCreate = async () => {
        if (!newTeamName.trim() || !onCreateTeam) return;
        setAdding(true);
        try {
            const newTeam = await onCreateTeam(newTeamName.trim());
            if (newTeam?.id && value.length < max) {
                onChange([...value, newTeam.id]);
            }
            setNewTeamName('');
            setShowAdd(false);
        } finally {
            setAdding(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>Toque para selecionar/remover</Text>
                <Tag color={value.length === max ? 'green' : 'blue'} style={{ fontSize: 13, padding: '2px 10px' }}>
                    {value.length} / {max}
                </Tag>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <Input
                    placeholder="Buscar time..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ borderRadius: 8 }}
                />
                {!showAdd && onCreateTeam && (
                    <Button icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>Novo</Button>
                )}
            </div>

            {showAdd && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, padding: 8, background: token.colorFillAlter, borderRadius: 8 }}>
                    <Input
                        autoFocus
                        placeholder="Nome do novo time"
                        value={newTeamName}
                        onChange={e => setNewTeamName(e.target.value)}
                        onPressEnter={handleCreate}
                    />
                    <Button type="primary" onClick={handleCreate} loading={adding}>Criar</Button>
                    <Button onClick={() => setShowAdd(false)}>X</Button>
                </div>
            )}

            <div style={{
                maxHeight: 400,
                overflowY: 'auto',
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 12,
                padding: 4
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: 8,
                    padding: 4
                }}>
                    {filtered.map(team => {
                        const selected = value.includes(team.id);
                        return (
                            <div
                                key={team.id}
                                onClick={() => toggle(team.id)}
                                style={{
                                    border: `2px solid ${selected ? token.colorPrimary : 'transparent'}`,
                                    background: selected ? `${token.colorPrimary}10` : token.colorBgContainer,
                                    borderRadius: 12,
                                    padding: '12px 8px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    position: 'relative'
                                }}
                            >
                                <Avatar
                                    src={team.logoUrl}
                                    size={40}
                                    style={{
                                        marginBottom: 8,
                                        border: team.logoUrl ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                                        backgroundColor: team.primaryColor || token.colorFillSecondary,
                                        color: team.secondaryColor || '#fff',
                                        fontSize: 18,
                                        fontWeight: 600
                                    }}
                                >
                                    {team.name?.[0]?.toUpperCase()}
                                </Avatar>
                                <Text strong style={{ fontSize: 11, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {team.name}
                                </Text>
                                {selected && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        width: 16,
                                        height: 16,
                                        background: token.colorPrimary,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Checkbox checked={true} style={{ pointerEvents: 'none', transform: 'scale(0.7)' }} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TeamPicker;
