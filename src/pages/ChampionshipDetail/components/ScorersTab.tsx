import React from 'react';
import { List, Avatar, Typography, Empty, theme } from 'antd';

const { Text } = Typography;

interface ScorersTabProps {
    scorers: any[];
}

const ScorersTab: React.FC<ScorersTabProps> = ({ scorers }) => {
    const { token } = theme.useToken();

    if (scorers.length === 0) return <Empty description="Nenhum gol registrado" />;

    return (
        <List
            dataSource={scorers}
            renderItem={(item: any, index: number) => {
                const medalColors = ['#fadb14', '#d9d9d9', '#d48806'];
                const isMedal = index < 3;
                return (
                    <List.Item style={{
                        padding: '12px 16px',
                        background: index === 0 ? 'rgba(250,219,20,0.06)' : token.colorBgContainer,
                        borderRadius: 8, marginBottom: 6,
                        border: `1px solid ${index === 0 ? 'rgba(250,219,20,0.3)' : token.colorBorderSecondary}`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                background: isMedal ? medalColors[index] : token.colorFillSecondary,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: 12,
                                color: isMedal ? (index === 0 ? '#7a5c00' : index === 1 ? '#595959' : '#fff') : token.colorTextSecondary,
                            }}>
                                {index + 1}
                            </div>
                            <Avatar
                                src={<img src={item.photoUrl} alt={item.player} referrerPolicy="no-referrer" />}
                                size={32}
                                style={{ backgroundColor: '#f0f0f0' }}
                            >
                                {!item.photoUrl && (item.player?.[0]?.toUpperCase() || '?')}
                            </Avatar>
                            <div>
                                <Text strong style={{ fontSize: 14, display: 'block' }}>{item.player}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>{item.team}</Text>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <Text strong style={{ fontSize: 22, color: token.colorError, lineHeight: 1 }}>{item.goals}</Text>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>gols</Text>
                        </div>
                    </List.Item>
                );
            }}
        />
    );
};

export default ScorersTab;
