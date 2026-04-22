import React from 'react';
import { Typography, Row, Col, Card, Space, Button, List } from 'antd';
import { EditOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface GroupsOverviewProps {
    championship: any;
    standings: any[];
    onEditGroup: (group: any) => void;
    onGenerateMatches: (groupId: string) => void;
    onRemoveTeam: (teamName: string) => void;
}

const GroupsOverview: React.FC<GroupsOverviewProps> = ({
    championship,
    standings,
    onEditGroup,
    onGenerateMatches,
    onRemoveTeam
}) => {
    return (
        <div style={{ marginBottom: 24 }}>
            <Title level={4}>Grupos e Times</Title>
            <Row gutter={[16, 16]}>
                {standings.map((group: any) => (
                    <Col xs={24} sm={12} key={group.groupId}>
                        <Card
                            size="small"
                            title={group.groupName}
                            extra={
                                <Space>
                                    <Button size="small" icon={<EditOutlined />} onClick={() => onEditGroup(group)}>Editar</Button>
                                    <Button size="small" type="link" icon={<PlayCircleOutlined />} onClick={() => onGenerateMatches(group.groupId)}>Sortear Jogos</Button>
                                </Space>
                            }
                        >
                            <List
                                size="small"
                                dataSource={group.standings}
                                renderItem={(s: any) => (
                                    <List.Item actions={[
                                        <Button
                                            key="remove"
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            size="small"
                                            onClick={() => onRemoveTeam(s.teamName)}
                                        />
                                    ]}>
                                        <Text>{s.teamName}</Text>
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default GroupsOverview;
