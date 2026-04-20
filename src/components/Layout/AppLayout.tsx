import React, { createContext, useContext, useState } from 'react';
import { Layout, Avatar, theme } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    TrophyOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';

const { Content } = Layout;

// ── Page Title Context ──────────────────────────────────────────────────────
interface PageTitleContextType {
    title: string;
    setTitle: (t: string) => void;
}

export const PageTitleContext = createContext<PageTitleContextType>({
    title: 'PlacarPro',
    setTitle: () => {},
});

export const usePageTitle = () => useContext(PageTitleContext);

// ── Constants ───────────────────────────────────────────────────────────────
const HEADER_HEIGHT = 56;
const FOOTER_HEIGHT = 64;

// ── NavItem ─────────────────────────────────────────────────────────────────
interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
    const { token } = theme.useToken();
    return (
        <button
            onClick={onClick}
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 4px',
                color: active ? token.colorPrimary : token.colorTextTertiary,
                transition: 'color 0.18s',
                WebkitTapHighlightColor: 'transparent',
                minWidth: 0,
            }}
        >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
            <span style={{
                fontSize: 11,
                fontWeight: active ? 700 : 400,
                transition: 'font-weight 0.18s',
                letterSpacing: active ? '0.01em' : 0,
            }}>
                {label}
            </span>
            {/* Active indicator dot */}
            <span style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: active ? token.colorPrimary : 'transparent',
                transition: 'background 0.18s',
            }} />
        </button>
    );
};

// ── AppLayout ───────────────────────────────────────────────────────────────
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = theme.useToken();
    const [pageTitle, setPageTitle] = useState('Campeonatos');

    const navItems = [
        { key: '/championships', icon: <TrophyOutlined />, label: 'Campeonatos' },
        { key: '/teams', icon: <TeamOutlined />, label: 'Times' },
    ];

    const isActive = (key: string) =>
        location.pathname === key || (key !== '/' && location.pathname.startsWith(key + '/'));

    return (
        <PageTitleContext.Provider value={{ title: pageTitle, setTitle: setPageTitle }}>
            <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>

                {/* ── Header ── */}
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: HEADER_HEIGHT,
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 16px',
                        background: '#0f172a',
                        boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
                    }}
                >
                    {/* Page title */}
                    <span style={{
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 17,
                        flex: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginRight: 12,
                    }}>
                        {pageTitle}
                    </span>

                    {/* Login Avatar */}
                    <Avatar
                        size={36}
                        icon={<UserOutlined />}
                        style={{
                            background: token.colorPrimary,
                            cursor: 'pointer',
                            flexShrink: 0,
                            boxShadow: `0 0 0 2px rgba(255,255,255,0.15)`,
                        }}
                    />
                </div>

                {/* ── Content ── */}
                <Content
                    style={{
                        marginTop: HEADER_HEIGHT,
                        paddingBottom: FOOTER_HEIGHT + 16,
                        minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
                    }}
                >
                    <div style={{ padding: '20px 16px' }}>
                        {children}
                    </div>
                </Content>

                {/* ── Bottom Navigation Footer ── */}
                <div
                    style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: FOOTER_HEIGHT,
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'stretch',
                        background: token.colorBgContainer,
                        borderTop: `1px solid ${token.colorBorderSecondary}`,
                        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
                        // safe area for devices with home indicator
                        paddingBottom: 'env(safe-area-inset-bottom)',
                    }}
                >
                    {navItems.map(item => (
                        <NavItem
                            key={item.key}
                            icon={item.icon}
                            label={item.label}
                            active={isActive(item.key)}
                            onClick={() => navigate(item.key)}
                        />
                    ))}
                </div>
            </Layout>
        </PageTitleContext.Provider>
    );
};

export default AppLayout;
