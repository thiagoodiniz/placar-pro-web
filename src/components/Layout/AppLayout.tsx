import React, { useState } from 'react';
import { Layout, Button, Drawer, Modal, Typography, theme } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    TrophyOutlined,
    TeamOutlined,
    MenuOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { mockApi } from '../../services/mockApiService';

const { Content } = Layout;
const { Text } = Typography;

const SIDEBAR_BG = '#0f172a';
const SIDEBAR_WIDTH = 220;

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const { token } = theme.useToken();

    const menuItems = [
        { key: '/championships', icon: <TrophyOutlined />, label: 'Campeonatos' },
        { key: '/teams', icon: <TeamOutlined />, label: 'Times' },
    ];

    const handleReset = () => {
        Modal.confirm({
            title: 'Reiniciar Dados',
            content: 'Isso irá apagar todas as suas alterações e voltar para os dados iniciais. Deseja continuar?',
            okText: 'Sim, Reiniciar',
            cancelText: 'Cancelar',
            okButtonProps: { danger: true },
            onOk: () => {
                mockApi.resetToSeed();
                window.location.reload();
            },
        });
    };

    const goTo = (key: string) => {
        navigate(key);
        setDrawerVisible(false);
    };

    const isItemActive = (key: string) =>
        location.pathname === key || (key !== '/' && location.pathname.startsWith(key + '/'));

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* ── Desktop Sidebar ── */}
            <div
                className="desktop-sider"
                style={{
                    position: 'fixed', top: 0, left: 0, bottom: 0,
                    width: SIDEBAR_WIDTH, background: SIDEBAR_BG,
                    zIndex: 100, display: 'flex', flexDirection: 'column',
                }}
            >
                <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 9, background: token.colorPrimary,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <TrophyOutlined style={{ color: '#fff', fontSize: 16 }} />
                        </div>
                        <div>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>PlacarPro</div>
                            <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11 }}>Gestão Esportiva</div>
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
                    {menuItems.map(item => (
                        <div
                            key={item.key}
                            onClick={() => goTo(item.key)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '11px 14px', marginBottom: 2, borderRadius: 10,
                                cursor: 'pointer',
                                background: isItemActive(item.key) ? token.colorPrimary : 'transparent',
                                color: isItemActive(item.key) ? '#fff' : 'rgba(255,255,255,0.55)',
                                fontWeight: isItemActive(item.key) ? 600 : 400,
                                fontSize: 14, transition: 'background 0.15s, color 0.15s', userSelect: 'none',
                            }}
                        >
                            <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
                <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <button
                        onClick={handleReset}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                            padding: '9px 12px', background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9,
                            color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)';
                            e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                            e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                        }}
                    >
                        <ReloadOutlined style={{ fontSize: 13 }} />
                        <span>Reiniciar Dados</span>
                    </button>
                </div>
            </div>

            {/* ── Mobile Drawer ── */}
            <Drawer
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 26, height: 26, borderRadius: 7, background: token.colorPrimary,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <TrophyOutlined style={{ color: '#fff', fontSize: 13 }} />
                        </div>
                        <Text strong style={{ fontSize: 15 }}>PlacarPro</Text>
                    </div>
                }
                placement="left"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                styles={{ body: { padding: 0 } }}
                width={260}
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ flex: 1, padding: '8px 0' }}>
                        {menuItems.map(item => (
                            <div
                                key={item.key}
                                onClick={() => goTo(item.key)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '13px 20px', cursor: 'pointer',
                                    background: isItemActive(item.key) ? token.colorPrimaryBg : 'transparent',
                                    color: isItemActive(item.key) ? token.colorPrimary : token.colorTextBase,
                                    fontWeight: isItemActive(item.key) ? 600 : 400,
                                    fontSize: 15,
                                    borderRight: isItemActive(item.key) ? `3px solid ${token.colorPrimary}` : '3px solid transparent',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <span style={{ fontSize: 18 }}>{item.icon}</span>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ padding: '12px 16px', borderTop: `1px solid ${token.colorBorderSecondary}` }}>
                        <Button danger ghost icon={<ReloadOutlined />} onClick={handleReset} style={{ width: '100%' }}>
                            Reiniciar Dados
                        </Button>
                    </div>
                </div>
            </Drawer>

            {/* ── Main Area ── */}
            <Layout className="main-layout" style={{ background: token.colorBgLayout }}>
                {/* Mobile Header */}
                <div
                    className="mobile-header"
                    style={{
                        background: SIDEBAR_BG, padding: '0 16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        position: 'sticky', top: 0, zIndex: 99, height: 56, flexShrink: 0,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Button
                            type="text"
                            icon={<MenuOutlined style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18 }} />}
                            onClick={() => setDrawerVisible(true)}
                            style={{ padding: 4 }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                                width: 26, height: 26, borderRadius: 7, background: token.colorPrimary,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <TrophyOutlined style={{ color: '#fff', fontSize: 13 }} />
                            </div>
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>PlacarPro</span>
                        </div>
                    </div>
                    <Button
                        type="text" size="small"
                        icon={<ReloadOutlined />}
                        onClick={handleReset}
                        style={{ color: 'rgba(255,255,255,0.45)' }}
                    />
                </div>

                <Content style={{ padding: '24px 20px', minHeight: 'calc(100vh - 56px)' }}>
                    {children}
                </Content>
            </Layout>

            <style>{`
                @media (min-width: 992px) {
                    .mobile-header { display: none !important; }
                    .main-layout { margin-left: ${SIDEBAR_WIDTH}px !important; }
                }
                @media (max-width: 991px) {
                    .desktop-sider { display: none !important; }
                }
            `}</style>
        </Layout>
    );
};

export default AppLayout;
