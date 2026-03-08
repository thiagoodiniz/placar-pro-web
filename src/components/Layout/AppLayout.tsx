import React, { useState } from 'react';
import { Layout, Menu, Button, Drawer, Modal } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    TrophyOutlined,
    TeamOutlined,
    MenuOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { mockApi } from '../../services/mockApiService';

const { Header, Content, Sider } = Layout;

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerVisible, setDrawerVisible] = useState(false);

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
            onOk: () => {
                mockApi.resetToSeed();
                window.location.reload();
            }
        });
    };

    const onMenuClick = (key: string) => {
        navigate(key);
        setDrawerVisible(false);
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* Desktop Sider */}
            <Sider breakpoint="lg" collapsedWidth="0" trigger={null} className="desktop-sider" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px', color: 'white', fontWeight: 'bold', fontSize: '24px', textAlign: 'center', background: '#001529' }}>
                    PlacarPro
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Menu
                        theme="dark"
                        mode="inline"
                        selectedKeys={[location.pathname]}
                        items={menuItems}
                        onClick={({ key }) => onMenuClick(key)}
                    />
                    <div style={{ padding: '16px', borderTop: '1px solid #303030' }}>
                        <Button
                            danger
                            ghost
                            icon={<ReloadOutlined />}
                            onClick={handleReset}
                            style={{ width: '100%' }}
                        >
                            Reiniciar Dados
                        </Button>
                    </div>
                </div>
            </Sider>

            {/* Mobile Drawer */}
            <Drawer
                title="PlacarPro"
                placement="left"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                styles={{ body: { padding: 0 } }}
                width={250}
                extra={
                    <Button type="text" danger icon={<ReloadOutlined />} onClick={handleReset}>Reset</Button>
                }
            >
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => onMenuClick(key)}
                />
            </Drawer>

            <Layout>
                <Header style={{
                    background: '#001529',
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                            className="mobile-menu-btn"
                            type="text"
                            icon={<MenuOutlined style={{ color: 'white', fontSize: '20px' }} />}
                            onClick={() => setDrawerVisible(true)}
                            style={{ marginRight: '8px' }}
                        />
                        <h2 style={{ margin: 0, fontSize: '18px', color: 'white' }}>
                            {menuItems.find(item => item.key === location.pathname)?.label || 'PlacarPro'}
                        </h2>
                    </div>
                    <Button
                        size="small"
                        danger
                        icon={<ReloadOutlined />}
                        onClick={handleReset}
                        className="mobile-only-reset"
                    >
                        Reiniciar
                    </Button>
                </Header>
                <Content style={{
                    margin: '16px',
                    padding: '16px',
                    background: '#fff',
                    borderRadius: '8px',
                    minHeight: '280px'
                }}>
                    {children}
                </Content>
            </Layout>

            <style>{`
                @media (min-width: 992px) {
                    .mobile-menu-btn, .mobile-only-reset {
                        display: none !important;
                    }
                }
                @media (max-width: 991px) {
                    .desktop-sider {
                        display: none !important;
                    }
                }
            `}</style>
        </Layout>
    );
};

export default AppLayout;
