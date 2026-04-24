import React from 'react';
import { Typography, Row, Col, Card, Space, Button, Avatar, Tag, Empty, theme } from 'antd';
import { EditOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface GroupsOverviewProps {
    championship: any;
    standings: any[];
    onEditGroup: (group: any) => void;
    onGenerateMatches?: (groupId: string) => void;
    onRemoveTeam?: (teamName: string) => void;
    loading?: boolean;
}

const GroupsOverview: React.FC<GroupsOverviewProps> = ({
    championship,
    standings,
    onEditGroup,
    loading
}) => {
    const { token } = theme.useToken();
    const teamsPerGroup = Math.ceil((championship.teamCount || 0) / (championship.groupCount || 1));

    return (
        <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={5} style={{ margin: 0 }}>Grupos e Times</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {teamsPerGroup} times por grupo
                </Text>
            </div>
            <Row gutter={[12, 12]}>
                {standings.map((group: any) => {
                    const teamCount = group.standings?.length || 0;
                    const isFull = teamCount >= teamsPerGroup;

                    return (
                        <Col xs={24} sm={12} key={group.groupId}>
                            <Card
                                size="small"
                                style={{
                                    borderRadius: token.borderRadiusLG,
                                    border: `1px solid ${isFull ? token.colorSuccessBorder : token.colorBorderSecondary}`,
                                }}
                                styles={{ body: { padding: '12px 14px' } }}
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Text strong>{group.groupName}</Text>
                                        <Tag color={isFull ? 'success' : 'default'} style={{ margin: 0, fontSize: 11, marginRight: 8 }}>
                                            {teamCount}/{teamsPerGroup}
                                        </Tag>
                                    </div>
                                }
                                extra={
                                    <Space size={4}>
                                        {championship.status === 'DRAFT' && (
                                            <Button
                                                size="small"
                                                icon={<EditOutlined />}
                                                onClick={() => onEditGroup(group)}
                                                disabled={loading}
                                            >
                                                Editar
                                            </Button>
                                        )}
                                    </Space>
                                }
                            >
                                {teamCount === 0 ? (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={<Text type="secondary" style={{ fontSize: 12 }}>Nenhum time definido</Text>}
                                        style={{ margin: '8px 0' }}
                                    />
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                                        {group.standings.map((s: any, i: number) => (
                                            <div
                                                key={s.teamName + i}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    padding: '6px 10px',
                                                    background: token.colorFillAlter,
                                                    borderRadius: 8,
                                                    border: `1px solid ${token.colorBorderSecondary}`,
                                                }}
                                            >
                                                <Avatar
                                                    src={s.teamLogoUrl}
                                                    size={28}
                                                    style={{ flexShrink: 0, fontSize: 12 }}
                                                >
                                                    {s.teamName?.[0]?.toUpperCase()}
                                                </Avatar>
                                                <Text style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {s.teamName}
                                                </Text>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
};

export default GroupsOverview;
