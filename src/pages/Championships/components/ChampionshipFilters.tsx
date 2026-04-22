import React from 'react';
import { Input, Radio, theme } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface ChampionshipFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusChange: (value: string) => void;
}

const ChampionshipFilters: React.FC<ChampionshipFiltersProps> = ({
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusChange
}) => {
    const { token } = theme.useToken();

    const labelStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        lineHeight: 1,
        whiteSpace: 'nowrap'
    };

    return (
        <div style={{
            marginBottom: 20,
            background: token.colorFillAlter,
            padding: '14px 14px',
            borderRadius: 14,
            border: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
        }}>
            <Input
                placeholder="Buscar campeonatos..."
                prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
                style={{ borderRadius: 8, width: '100%' }}
                allowClear
            />
            <Radio.Group
                value={statusFilter}
                onChange={e => onStatusChange(e.target.value)}
                optionType="button"
                buttonStyle="solid"
                style={{ display: 'flex', width: '100%' }}
            >
                <Radio.Button
                    value="ALL"
                    style={{
                        flex: 1,
                        borderRadius: '8px 0 0 8px',
                        padding: '4px 6px'
                    }}
                >
                    <span style={labelStyle as any}>Todos</span>
                </Radio.Button>

                <Radio.Button
                    value="STARTED"
                    style={{
                        flex: 1,
                        padding: '4px 6px'
                    }}
                >
                    <span style={labelStyle as any}>Em Andamento</span>
                </Radio.Button>

                <Radio.Button
                    value="FINISHED"
                    style={{
                        flex: 1,
                        borderRadius: '0 8px 8px 0',
                        padding: '4px 6px'
                    }}
                >
                    <span style={labelStyle as any}>Finalizados</span>
                </Radio.Button>
            </Radio.Group>
        </div>
    );
};

export default ChampionshipFilters;
