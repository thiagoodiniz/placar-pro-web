import type { ThemeConfig } from 'antd';

export const themeConfig: ThemeConfig = {
    token: {
        colorPrimary: '#16a34a',
        colorSuccess: '#22c55e',
        colorError: '#ef4444',
        colorWarning: '#eab308',
        colorBgLayout: '#f8fafc',
        colorBgContainer: '#ffffff',
        colorTextBase: '#0f172a',
        colorBorderSecondary: '#e5e7eb',
        controlHeight: 40,
        borderRadius: 8,
        borderRadiusLG: 12,
        fontSize: 14,
    },
    components: {
        Card: {
            borderRadiusLG: 12,
        },
        Button: {
            borderRadius: 8,
        },
        Input: {
            borderRadius: 8,
        },
        Select: {
            borderRadius: 8,
        },
        InputNumber: {
            borderRadius: 8,
        },
    },
};
