import React from 'react';
import { Modal, Form, Row, Col, Typography, InputNumber, Divider, Select, List, Button, theme } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface MatchResultModalProps {
    open: boolean;
    onCancel: () => void;
    match: any;
    form: any;
    players: any[];
    matchGoals: any[];
    onAddGoal: (player: any) => void;
    onRemoveGoal: (goalId: string) => void;
    onFinish: (values: any) => void;
}

const MatchResultModal: React.FC<MatchResultModalProps> = ({
    open,
    onCancel,
    match,
    form,
    players,
    matchGoals,
    onAddGoal,
    onRemoveGoal,
    onFinish
}) => {
    const { token } = theme.useToken();
    
    // Watch form values for conditional rendering (penalties)
    const homeScore = Form.useWatch('homeScore', form);
    const awayScore = Form.useWatch('awayScore', form);

    return (
        <Modal 
            title="Resultado e Gols" 
            open={open} 
            onCancel={onCancel} 
            onOk={() => form.submit()} 
            width={600}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginBottom: 20, background: token.colorFillQuaternary,
                    padding: '20px 16px', borderRadius: 12,
                    gap: 12
                }}>
                    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
                        <Title level={5} style={{
                            margin: '0 0 12px',
                            fontSize: 14,
                            minHeight: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1.2
                        }}>
                            {match?.homeTeam?.name}
                        </Title>
                        <Form.Item name="homeScore" noStyle>
                            <InputNumber
                                min={0}
                                size="large"
                                style={{ width: '100%', maxWidth: 70 }}
                                placeholder="-"
                            />
                        </Form.Item>
                    </div>

                    <div style={{
                        fontSize: '22px',
                        fontWeight: 700,
                        color: token.colorTextSecondary,
                        paddingTop: 40 // Align with inputs
                    }}>
                        ×
                    </div>

                    <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
                        <Title level={5} style={{
                            margin: '0 0 12px',
                            fontSize: 14,
                            minHeight: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1.2
                        }}>
                            {match?.awayTeam?.name}
                        </Title>
                        <Form.Item name="awayScore" noStyle>
                            <InputNumber
                                min={0}
                                size="large"
                                style={{ width: '100%', maxWidth: 70 }}
                                placeholder="-"
                            />
                        </Form.Item>
                    </div>
                </div>

                {/* Penalty shootout - only for knockout phases when draw */}
                {match?.phase && match?.phase !== 'GROUP' && homeScore === awayScore && homeScore !== undefined && homeScore !== null && (
                    <div style={{ background: token.colorWarningBg, border: `1px solid ${token.colorWarning}50`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                        <Text strong style={{ color: '#fa8c16' }}>Empate! Resultado dos Pênaltis:</Text>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 12 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>{match?.homeTeam?.name}</div>
                                <Form.Item name="homePenalties" noStyle><InputNumber min={0} size="large" style={{ width: 80 }} /></Form.Item>
                            </div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>x</div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 4 }}>{match?.awayTeam?.name}</div>
                                <Form.Item name="awayPenalties" noStyle><InputNumber min={0} size="large" style={{ width: 80 }} /></Form.Item>
                            </div>
                        </div>
                    </div>
                )}

                <Row gutter={[24, 24]}>
                    <Col xs={24} sm={12}>
                        <Divider orientation="left" style={{ fontSize: '14px', margin: '0 0 12px' }}>Gols: {match?.homeTeam?.name}</Divider>
                        <Select
                            showSearch
                            style={{ width: '100%', marginBottom: 12 }}
                            placeholder="Add gol..."
                            disabled={matchGoals.filter(g => g.teamId === match?.homeTeamId).length >= (homeScore || 0)}
                            onChange={(_, opt: any) => onAddGoal(opt.player)}
                            value={null}
                        >
                            {players.filter(p => p.teamId === match?.homeTeamId).map(p => (
                                <Select.Option key={p.id} value={p.id} player={p}>{p.name}</Select.Option>
                            ))}
                        </Select>
                        <div style={{ maxHeight: 200, overflowY: 'auto', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8 }}>
                            <List
                                size="small"
                                dataSource={matchGoals.filter(g => g.teamId === match?.homeTeamId)}
                                renderItem={g => (
                                    <List.Item actions={[<Button type="text" danger icon={<DeleteOutlined />} onClick={() => onRemoveGoal(g.id)} />]} style={{ padding: '4px 12px' }}>
                                        <Text ellipsis style={{ maxWidth: '100%' }}>{g.playerName}</Text>
                                    </List.Item>
                                )}
                                locale={{ emptyText: <Text type="secondary" style={{ fontSize: 12 }}>Nenhum gol</Text> }}
                            />
                        </div>
                    </Col>

                    <Col xs={24} sm={12}>
                        <Divider orientation="left" style={{ fontSize: '14px', margin: '0 0 12px' }}>Gols: {match?.awayTeam?.name}</Divider>
                        <Select
                            showSearch
                            style={{ width: '100%', marginBottom: 12 }}
                            placeholder="Add gol..."
                            disabled={matchGoals.filter(g => g.teamId === match?.awayTeamId).length >= (awayScore || 0)}
                            onChange={(_, opt: any) => onAddGoal(opt.player)}
                            value={null}
                        >
                            {players.filter(p => p.teamId === match?.awayTeamId).map(p => (
                                <Select.Option key={p.id} value={p.id} player={p}>{p.name}</Select.Option>
                            ))}
                        </Select>
                        <div style={{ maxHeight: 200, overflowY: 'auto', border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8 }}>
                            <List
                                size="small"
                                dataSource={matchGoals.filter(g => g.teamId === match?.awayTeamId)}
                                renderItem={g => (
                                    <List.Item actions={[<Button type="text" danger icon={<DeleteOutlined />} onClick={() => onRemoveGoal(g.id)} />]} style={{ padding: '4px 12px' }}>
                                        <Text ellipsis style={{ maxWidth: '100%' }}>{g.playerName}</Text>
                                    </List.Item>
                                )}
                                locale={{ emptyText: <Text type="secondary" style={{ fontSize: 12 }}>Nenhum gol</Text> }}
                            />
                        </div>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default MatchResultModal;
